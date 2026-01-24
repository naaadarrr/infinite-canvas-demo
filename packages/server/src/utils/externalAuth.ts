import type { Env } from '../types';

interface ExternalKeyConfig {
  secret: string;
  sources?: Set<string>;
}

interface ExternalAuthContext {
  keyId: string;
  config: ExternalKeyConfig;
}

interface ExternalAuthResult {
  ok: boolean;
  status: number;
  error?: string;
  context?: ExternalAuthContext;
  retryAfterSeconds?: number;
}

const cachedKeyConfigs: {
  raw?: string;
  parsed?: Map<string, ExternalKeyConfig>;
} = {};

const nonceCache = new Map<string, number>();
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();

const DEFAULT_TIME_WINDOW_SEC = 300;
const DEFAULT_RATE_LIMIT_COUNT = 60;
const DEFAULT_RATE_LIMIT_WINDOW_SEC = 60;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function parseExternalKeys(raw?: string): Map<string, ExternalKeyConfig> {
  if (!raw) {
    return new Map();
  }

  if (cachedKeyConfigs.raw === raw && cachedKeyConfigs.parsed) {
    return cachedKeyConfigs.parsed;
  }

  let parsed: Map<string, ExternalKeyConfig> = new Map();

  const trimmed = raw.trim();
  try {
    const json = JSON.parse(trimmed) as
      | Record<string, { secret: string; sources?: string[] }>
      | Array<{ key: string; secret: string; sources?: string[] }>;

    if (Array.isArray(json)) {
      parsed = new Map(
        json
          .filter((entry) => entry.key && entry.secret)
          .map((entry) => [
            entry.key,
            {
              secret: entry.secret,
              sources: entry.sources ? new Set(entry.sources) : undefined,
            },
          ])
      );
    } else if (json && typeof json === 'object') {
      parsed = new Map(
        Object.entries(json)
          .filter(([key, entry]) => key && entry?.secret)
          .map(([key, entry]) => [
            key,
            {
              secret: entry.secret,
              sources: entry.sources ? new Set(entry.sources) : undefined,
            },
          ])
      );
    }
  } catch (error) {
    // Fallback format: key:secret[,key2:secret2]
    const entries = trimmed
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry): [string, ExternalKeyConfig] | null => {
        const [key, secret] = entry.split(':');
        if (!key || !secret) {
          return null;
        }
        return [key, { secret }];
      })
      .filter((entry): entry is [string, ExternalKeyConfig] => Boolean(entry));

    parsed = new Map(entries);
  }

  cachedKeyConfigs.raw = raw;
  cachedKeyConfigs.parsed = parsed;
  return parsed;
}

function extractBearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization');
  if (!header) return null;
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

function bytesToHex(bytes: Uint8Array): string {
  const out: string[] = [];
  bytes.forEach((byte) => {
    out.push(byte.toString(16).padStart(2, '0'));
  });
  return out.join('');
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return bytesToHex(new Uint8Array(signature));
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < left.length; i += 1) {
    result |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return result === 0;
}

function parseTimestampMillis(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return null;
  if (parsed > 1_000_000_000_000) {
    return parsed;
  }
  return parsed * 1000;
}

function buildCanonicalString(request: Request, bodyText: string, timestamp: string, nonce: string): string {
  const url = new URL(request.url);
  return ['v1', request.method.toUpperCase(), url.pathname, timestamp, nonce, bodyText].join('\n');
}

function checkAndStoreNonce(keyId: string, nonce: string, nowMs: number, ttlMs: number): boolean {
  const cacheKey = `${keyId}:${nonce}`;
  const existing = nonceCache.get(cacheKey);
  if (existing && nowMs - existing < ttlMs) {
    return false;
  }

  nonceCache.set(cacheKey, nowMs);

  if (nonceCache.size > 5000) {
    const cutoff = nowMs - ttlMs;
    for (const [key, ts] of nonceCache.entries()) {
      if (ts < cutoff) {
        nonceCache.delete(key);
      }
    }
  }

  return true;
}

function checkRateLimit(keyId: string, canvasId: string, limit: number, windowMs: number, nowMs: number) {
  const cacheKey = `${keyId}:${canvasId}`;
  const entry = rateLimitCache.get(cacheKey);

  if (!entry || nowMs >= entry.resetAt) {
    rateLimitCache.set(cacheKey, { count: 1, resetAt: nowMs + windowMs });
    return { allowed: true };
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - nowMs) / 1000) };
  }

  entry.count += 1;
  return { allowed: true };
}

export async function authenticateExternalRequest(
  request: Request,
  env: Env,
  bodyText: string,
  canvasId: string
): Promise<ExternalAuthResult> {
  const keyId = extractBearerToken(request);
  if (!keyId) {
    return { ok: false, status: 401, error: 'Missing external API key' };
  }

  const keyConfigs = parseExternalKeys(env.EXTERNAL_API_KEYS);
  const config = keyConfigs.get(keyId);
  if (!config) {
    return { ok: false, status: 401, error: 'Invalid external API key' };
  }

  const signature = request.headers.get('X-Signature');
  const timestamp = request.headers.get('X-Timestamp');
  const nonce = request.headers.get('X-Nonce');
  if (!signature || !timestamp || !nonce) {
    return { ok: false, status: 401, error: 'Missing signature headers' };
  }

  const timestampMs = parseTimestampMillis(timestamp);
  if (!timestampMs) {
    return { ok: false, status: 401, error: 'Invalid X-Timestamp' };
  }

  const timeWindowSec = parsePositiveInt(env.EXTERNAL_API_TIME_WINDOW_SEC, DEFAULT_TIME_WINDOW_SEC);
  const nowMs = Date.now();
  if (Math.abs(nowMs - timestampMs) > timeWindowSec * 1000) {
    return { ok: false, status: 401, error: 'Signature expired' };
  }

  const nonceTtlSec = parsePositiveInt(env.EXTERNAL_API_NONCE_TTL_SEC, timeWindowSec);
  const nonceOk = checkAndStoreNonce(keyId, nonce, nowMs, nonceTtlSec * 1000);
  if (!nonceOk) {
    return { ok: false, status: 401, error: 'Replay detected' };
  }

  const canonical = buildCanonicalString(request, bodyText, timestamp, nonce);
  const expected = await hmacSha256Hex(config.secret, canonical);
  const provided = signature.toLowerCase();
  if (!timingSafeEqual(expected, provided)) {
    return { ok: false, status: 401, error: 'Invalid signature' };
  }

  const rateLimitCount = parsePositiveInt(env.EXTERNAL_API_RATE_LIMIT_COUNT, DEFAULT_RATE_LIMIT_COUNT);
  const rateLimitWindowSec = parsePositiveInt(env.EXTERNAL_API_RATE_LIMIT_WINDOW_SEC, DEFAULT_RATE_LIMIT_WINDOW_SEC);
  const rateLimit = checkRateLimit(keyId, canvasId, rateLimitCount, rateLimitWindowSec * 1000, nowMs);
  if (!rateLimit.allowed) {
    return {
      ok: false,
      status: 429,
      error: 'Rate limit exceeded',
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    };
  }

  return { ok: true, status: 200, context: { keyId, config } };
}

export function isSourceAllowed(config: ExternalKeyConfig, source: string): boolean {
  if (!config.sources || config.sources.size === 0) {
    return true;
  }
  return config.sources.has(source);
}
