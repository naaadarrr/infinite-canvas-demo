import type { BoardTaskItem, ExternalCommandEnvelope } from '../types';

const encoder = new TextEncoder();

export const DEFAULT_EXTERNAL_COMMAND_MAX_BYTES = 1_500_000;
export const MAX_STRING_BYTES = 8 * 1024;
const MAX_OBJECT_KEYS = 64;
const MAX_ARRAY_ITEMS = 64;
const MAX_DEPTH = 8;

export function byteLength(value: string): number {
  return encoder.encode(value).byteLength;
}

export function resolveExternalCommandMaxBytes(raw?: string): number {
  if (!raw) {
    return DEFAULT_EXTERNAL_COMMAND_MAX_BYTES;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_EXTERNAL_COMMAND_MAX_BYTES;
  }
  return parsed;
}

function trimStringToBytes(value: string, maxBytes: number): string {
  if (byteLength(value) <= maxBytes) {
    return value;
  }

  let low = 0;
  let high = value.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (byteLength(value.slice(0, mid)) <= maxBytes) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  return value.slice(0, low);
}

function sanitizeUnknown(value: unknown, depth: number): unknown {
  if (value === null) {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return trimStringToBytes(value, MAX_STRING_BYTES);
  }

  if (Array.isArray(value)) {
    if (depth >= MAX_DEPTH) {
      return [];
    }
    const sanitized: unknown[] = [];
    const upper = Math.min(value.length, MAX_ARRAY_ITEMS);
    for (let i = 0; i < upper; i += 1) {
      const next = sanitizeUnknown(value[i], depth + 1);
      if (next !== undefined) {
        sanitized.push(next);
      }
    }
    return sanitized;
  }

  if (!value || typeof value !== 'object') {
    return undefined;
  }

  if (depth >= MAX_DEPTH) {
    return {};
  }

  const sanitized: Record<string, unknown> = {};
  let kept = 0;
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (kept >= MAX_OBJECT_KEYS) {
      break;
    }
    const next = sanitizeUnknown(nested, depth + 1);
    if (next !== undefined) {
      sanitized[key] = next;
      kept += 1;
    }
  }
  return sanitized;
}

export function compactBoardTaskItem(item: BoardTaskItem): BoardTaskItem {
  const candidate = sanitizeUnknown(item, 0);
  const sanitized = candidate && typeof candidate === 'object'
    ? (candidate as Record<string, unknown>)
    : {};

  // 强制保留外部同步所需关键字段
  sanitized.taskId = item.taskId;
  sanitized.mediaType = item.mediaType;
  sanitized.status = item.status;
  sanitized.toolType = item.toolType;
  sanitized.toolCategory = item.toolCategory;
  sanitized.rating = item.rating;
  sanitized.isPinned = item.isPinned;
  sanitized.completedAt = item.completedAt;
  sanitized.errorMessage = item.errorMessage;

  if (item.parameters === null) {
    sanitized.parameters = null;
  } else {
    sanitized.parameters = sanitizeUnknown(item.parameters, 0) as Record<string, unknown>;
  }

  if (item.result === null || item.result === undefined) {
    sanitized.result = item.result ?? null;
  } else {
    sanitized.result = sanitizeUnknown(item.result, 0) as Record<string, unknown>;
  }

  return sanitized as unknown as BoardTaskItem;
}

export function compactExternalCommand(command: ExternalCommandEnvelope): ExternalCommandEnvelope {
  const nodes = Array.isArray(command.payload?.nodes) ? command.payload.nodes : [];
  const compactedNodes = nodes.map((node) => compactBoardTaskItem(node));

  return {
    ...command,
    payload: {
      nodes: compactedNodes,
    },
  };
}
