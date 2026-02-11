/**
 * 快照持久化模块
 * 负责将画布状态保存到 R2 和 D1
 */

import type { CanvasNodeData, CanvasSnapshot, Env } from './types';

/**
 * 生成快照文件的 R2 key
 */
export function getSnapshotKey(canvasId: string, seq: number): string {
  return `snapshots/${canvasId}/${seq}.json`;
}

/**
 * 保存快照到 R2
 */
export async function saveSnapshot(
  env: Env,
  canvasId: string,
  seq: number,
  nodes: CanvasNodeData[]
): Promise<string> {
  const snapshot: CanvasSnapshot = {
    canvasId,
    seq,
    nodes,
    timestamp: Date.now(),
  };

  const key = getSnapshotKey(canvasId, seq);
  const content = JSON.stringify(snapshot);

  await env.R2.put(key, content, {
    httpMetadata: {
      contentType: 'application/json',
    },
    customMetadata: {
      canvasId,
      seq: seq.toString(),
      timestamp: snapshot.timestamp.toString(),
    },
  });

  console.log(`[Snapshot] Saved snapshot for canvas ${canvasId} at seq ${seq}`);
  return key;
}

/**
 * 从 R2 加载快照
 */
export async function loadSnapshot(
  env: Env,
  snapshotKey: string
): Promise<CanvasSnapshot | null> {
  const object = await env.R2.get(snapshotKey);
  
  if (!object) {
    console.warn(`[Snapshot] Snapshot not found: ${snapshotKey}`);
    return null;
  }

  const content = await object.text();
  const snapshot = JSON.parse(content) as CanvasSnapshot;
  
  console.log(`[Snapshot] Loaded snapshot for canvas ${snapshot.canvasId} at seq ${snapshot.seq}`);
  return snapshot;
}

/** R2 key for full (uncompressed) snapshot - single file per canvas, overwritten on each flush */
export const FULL_SNAPSHOT_KEY_PREFIX = 'snapshots/';
export function getFullSnapshotKey(canvasId: string): string {
  return `snapshots/${canvasId}/latest-full.json`;
}

/**
 * 保存完整未压缩数据到 R2（用于"重新使用相同 prompt 生成"等需要完整数据的场景）
 * 始终覆盖更新，不保留历史版本
 */
export async function saveFullSnapshot(
  env: Env,
  canvasId: string,
  seq: number,
  nodes: CanvasNodeData[]
): Promise<string> {
  const key = getFullSnapshotKey(canvasId);
  const snapshot: CanvasSnapshot = {
    canvasId,
    seq,
    nodes,
    timestamp: Date.now(),
  };
  const content = JSON.stringify(snapshot);

  await env.R2.put(key, content, {
    httpMetadata: {
      contentType: 'application/json',
    },
    customMetadata: {
      canvasId,
      seq: seq.toString(),
      timestamp: snapshot.timestamp.toString(),
      dataType: 'full',
    },
  });

  console.log(`[Snapshot] Saved full snapshot for canvas ${canvasId} at seq ${seq}`);
  return key;
}

/**
 * 从 R2 加载完整未压缩数据（用于获取完整 prompt 等）
 */
export async function loadFullSnapshot(
  env: Env,
  canvasId: string
): Promise<CanvasSnapshot | null> {
  const key = getFullSnapshotKey(canvasId);
  const object = await env.R2.get(key);

  if (!object) {
    console.warn(`[Snapshot] Full snapshot not found: ${key}`);
    return null;
  }

  const content = await object.text();
  const snapshot = JSON.parse(content) as CanvasSnapshot;

  console.log(`[Snapshot] Loaded full snapshot for canvas ${snapshot.canvasId} at seq ${snapshot.seq}`);
  return snapshot;
}

/**
 * 更新 D1 中的快照指针
 */
export async function updateSnapshotPointer(
  env: Env,
  canvasId: string,
  snapshotKey: string,
  seq: number
): Promise<void> {
  await env.DB.prepare(
    `UPDATE canvases 
     SET latest_snapshot_key = ?, latest_seq = ?, updated_at = unixepoch()
     WHERE id = ?`
  )
    .bind(snapshotKey, seq, canvasId)
    .run();

  console.log(`[Snapshot] Updated snapshot pointer for canvas ${canvasId} to seq ${seq}`);
}

/**
 * 从 D1 获取最新快照信息
 */
export async function getLatestSnapshotInfo(
  env: Env,
  canvasId: string
): Promise<{ snapshotKey: string | null; seq: number }> {
  const result = await env.DB.prepare(
    'SELECT latest_snapshot_key, latest_seq FROM canvases WHERE id = ?'
  )
    .bind(canvasId)
    .first<{ latest_snapshot_key: string | null; latest_seq: number }>();

  if (!result) {
    return { snapshotKey: null, seq: 0 };
  }

  return {
    snapshotKey: result.latest_snapshot_key,
    seq: result.latest_seq || 0,
  };
}

/**
 * 完整的快照保存流程：保存到 R2 并更新 D1 指针
 */
export async function createAndSaveSnapshot(
  env: Env,
  canvasId: string,
  seq: number,
  nodes: CanvasNodeData[]
): Promise<void> {
  try {
    const snapshotKey = await saveSnapshot(env, canvasId, seq, nodes);
    await updateSnapshotPointer(env, canvasId, snapshotKey, seq);
  } catch (error) {
    console.error(`[Snapshot] Error saving snapshot for canvas ${canvasId}:`, error);
    throw error;
  }
}

/**
 * 加载最新快照
 */
export async function loadLatestSnapshot(
  env: Env,
  canvasId: string
): Promise<CanvasSnapshot | null> {
  const { snapshotKey } = await getLatestSnapshotInfo(env, canvasId);
  
  if (!snapshotKey) {
    console.log(`[Snapshot] No snapshot found for canvas ${canvasId}`);
    return null;
  }

  return await loadSnapshot(env, snapshotKey);
}

/**
 * 清理旧快照（可选，用于定期清理）
 */
export async function cleanupOldSnapshots(
  env: Env,
  canvasId: string,
  keepCount: number = 10
): Promise<void> {
  const prefix = `snapshots/${canvasId}/`;
  const listed = await env.R2.list({ prefix });

  if (listed.objects.length <= keepCount) {
    return;
  }

  // 按名称排序（seq 递增）
  const sorted = listed.objects.sort((a, b) => a.key.localeCompare(b.key));
  
  // 删除旧的快照
  const toDelete = sorted.slice(0, sorted.length - keepCount);
  
  for (const obj of toDelete) {
    await env.R2.delete(obj.key);
    console.log(`[Snapshot] Deleted old snapshot: ${obj.key}`);
  }
}
