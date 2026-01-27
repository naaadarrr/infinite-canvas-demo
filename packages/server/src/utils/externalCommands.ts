import type { BoardTaskItem, ExternalCommandEnvelope, ExternalCommandType } from '../types';

const ALLOWED_COMMAND_TYPES = new Set<ExternalCommandType>([
  'append_nodes',
  'update_nodes',
  'upsert_nodes',
  'delete_nodes',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validateTaskItem(node: BoardTaskItem): string | null {
  if (!node || typeof node !== 'object') {
    return 'Invalid node payload';
  }

  if (!node.taskId || typeof node.taskId !== 'string') {
    return 'Missing taskId';
  }

  return null;
}

export function validateExternalCommand(
  command: unknown
): { ok: boolean; error?: string; command?: ExternalCommandEnvelope } {
  if (!isRecord(command)) {
    return { ok: false, error: 'Invalid command body' };
  }

  const candidate = command as Record<string, unknown>;
  const id = candidate.id;
  const source = candidate.source;
  const type = candidate.type;
  const payload = candidate.payload;

  if (!id || typeof id !== 'string') {
    return { ok: false, error: 'Missing command id' };
  }

  if (!source || typeof source !== 'string') {
    return { ok: false, error: 'Missing command source' };
  }

  if (!type || typeof type !== 'string' || !ALLOWED_COMMAND_TYPES.has(type as ExternalCommandType)) {
    return { ok: false, error: 'Unsupported command type' };
  }

  if (!isRecord(payload) || !Array.isArray(payload.nodes)) {
    return { ok: false, error: 'Missing payload.nodes' };
  }

  for (const node of payload.nodes as BoardTaskItem[]) {
    const error = validateTaskItem(node);
    if (error) {
      return { ok: false, error };
    }
  }

  return { ok: true, command: command as unknown as ExternalCommandEnvelope };
}

export function parseExternalCommand(bodyText: string): { ok: boolean; error?: string; command?: ExternalCommandEnvelope } {
  try {
    const parsed = JSON.parse(bodyText) as unknown;
    return validateExternalCommand(parsed);
  } catch (error) {
    return { ok: false, error: 'Invalid JSON body' };
  }
}
