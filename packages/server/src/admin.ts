/**
 * 管理API模块
 * 提供DO状态监控和管理功能
 */

import type { Env } from './types';
import { extractToken, verifyToken } from './utils/auth';

/**
 * 健康检查端点
 * 测试系统各组件的连接状态
 */
export async function handleHealthCheck(
  request: Request,
  env: Env
): Promise<Response> {
  const startTime = Date.now();
  const health: {
    status: 'healthy' | 'unhealthy';
    timestamp: number;
    checks: {
      d1: { status: 'ok' | 'error'; latency?: number; error?: string };
      r2: { status: 'ok' | 'error'; latency?: number; error?: string };
    };
    latency: number;
  } = {
    status: 'healthy',
    timestamp: Date.now(),
    checks: {
      d1: { status: 'ok' },
      r2: { status: 'ok' },
    },
    latency: 0,
  };

  // 测试 D1 连接
  try {
    const d1Start = Date.now();
    await env.DB.prepare('SELECT 1 as test').first();
    health.checks.d1 = {
      status: 'ok',
      latency: Date.now() - d1Start,
    };
  } catch (error) {
    health.status = 'unhealthy';
    health.checks.d1 = {
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // 测试 R2 连接
  try {
    const r2Start = Date.now();
    await env.R2.list({ limit: 1 });
    health.checks.r2 = {
      status: 'ok',
      latency: Date.now() - r2Start,
    };
  } catch (error) {
    health.status = 'unhealthy';
    health.checks.r2 = {
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    };
  }

  health.latency = Date.now() - startTime;

  return new Response(JSON.stringify(health), {
    status: health.status === 'healthy' ? 200 : 500,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

/**
 * 验证管理员权限
 */
async function verifyAdminToken(request: Request, env: Env): Promise<{ success: boolean; error?: string }> {
  const token = extractToken(request);
  
  // 使用现有的token验证机制
  const auth = await verifyToken(token, env);
  
  if (!auth.success) {
    return { success: false, error: auth.error || 'Unauthorized' };
  }
  
  // TODO: 在实际生产环境中,应该检查用户是否有管理员权限
  // 目前简化处理,所有认证用户都可以访问管理API
  return { success: true };
}

/**
 * 获取特定房间状态
 */
export async function handleGetRoomStatus(
  request: Request,
  env: Env,
  roomId: string
): Promise<Response> {
  const auth = await verifyAdminToken(request, env);
  if (!auth.success) {
    return new Response(JSON.stringify({ error: auth.error || 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
  
  try {
    const id = env.CANVAS_ROOM.idFromName(roomId);
    const stub = env.CANVAS_ROOM.get(id);
    const statusUrl = new URL(request.url);
    statusUrl.pathname = '/status';
    const response = await stub.fetch(statusUrl.toString());
    
    // 添加CORS头
    const data = await response.text();
    return new Response(data, {
      status: response.status,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[Admin] Error getting room status:', error);
    return new Response(JSON.stringify({ error: 'Failed to get room status' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

/**
 * 关闭房间
 */
export async function handleShutdownRoom(
  request: Request,
  env: Env,
  roomId: string
): Promise<Response> {
  const auth = await verifyAdminToken(request, env);
  if (!auth.success) {
    return new Response(JSON.stringify({ error: auth.error || 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
  
  try {
    const id = env.CANVAS_ROOM.idFromName(roomId);
    const stub = env.CANVAS_ROOM.get(id);
    const shutdownUrl = new URL(request.url);
    shutdownUrl.pathname = '/shutdown';
    const response = await stub.fetch(shutdownUrl.toString(), {
      method: 'POST',
    });
    
    const data = await response.text();
    return new Response(data, {
      status: response.status,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[Admin] Error shutting down room:', error);
    return new Response(JSON.stringify({ error: 'Failed to shutdown room' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

/**
 * 从房间踢出用户
 */
export async function handleKickFromRoom(
  request: Request,
  env: Env,
  roomId: string
): Promise<Response> {
  const auth = await verifyAdminToken(request, env);
  if (!auth.success) {
    return new Response(JSON.stringify({ error: auth.error || 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
  
  try {
    const body = await request.text();
    const id = env.CANVAS_ROOM.idFromName(roomId);
    const stub = env.CANVAS_ROOM.get(id);
    const kickUrl = new URL(request.url);
    kickUrl.pathname = '/kick';
    const response = await stub.fetch(kickUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    
    const data = await response.text();
    return new Response(data, {
      status: response.status,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[Admin] Error kicking user:', error);
    return new Response(JSON.stringify({ error: 'Failed to kick user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

/**
 * 列出所有活跃房间（从D1数据库）
 * 注意: 这只能列出数据库中的房间,不能直接列出所有活跃的DO实例
 */
export async function handleListRooms(
  request: Request,
  env: Env
): Promise<Response> {
  const auth = await verifyAdminToken(request, env);
  if (!auth.success) {
    return new Response(JSON.stringify({ error: auth.error || 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
  
  try {
    const rooms: any[] = [];
    
    // 从D1获取持久化的画布列表
    try {
      const result = await env.DB.prepare(
        'SELECT id, title, latest_seq, created_at, updated_at FROM canvases ORDER BY updated_at DESC LIMIT 100'
      ).all();
      
      if (result.results && result.results.length > 0) {
        rooms.push(...result.results);
      }
    } catch (dbError) {
      console.warn('[Admin] D1 query failed, returning empty list:', dbError);
    }

    return new Response(JSON.stringify({
      rooms: rooms,
      total: rooms.length,
      note: '提示: 活跃但未持久化的房间需要手动输入房间ID添加'
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[Admin] Error listing rooms:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to list rooms',
      rooms: [],
      total: 0
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

/**
 * 为单个房间创建或更新 D1 记录
 * 用于修复缺失的 D1 记录
 */
export async function handleCreateRoomRecord(
  request: Request,
  env: Env
): Promise<Response> {
  const auth = await verifyAdminToken(request, env);
  if (!auth.success) {
    return new Response(JSON.stringify({ error: auth.error || 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
  
  try {
    const body = await request.json() as { roomId: string };
    const { roomId } = body;
    
    if (!roomId) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'roomId is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
    
    // 获取 DO 实例
    const id = env.CANVAS_ROOM.idFromName(roomId);
    const stub = env.CANVAS_ROOM.get(id);
    
    // 调用 DO 的状态 API 获取当前状态
    let seq = 0;
    let nodeCount = 0;
    
    try {
      const statusUrl = new URL(request.url);
      statusUrl.pathname = '/status';
      const statusResponse = await stub.fetch(statusUrl.toString());
      
      if (statusResponse.ok) {
        const status = await statusResponse.json() as any;
        seq = status.seq || 0;
        nodeCount = status.nodeCount || 0;
      }
    } catch (statusError) {
      console.warn(`[Admin] Could not fetch status for ${roomId}, using defaults:`, statusError);
    }
    
    // 检查 D1 中是否已存在
    const existing = await env.DB.prepare(
      'SELECT id, latest_seq FROM canvases WHERE id = ?'
    ).bind(roomId).first() as { id: string; latest_seq: number } | null;
    
    let action: 'created' | 'updated';
    
    if (existing) {
      // 更新记录
      const result = await env.DB.prepare(
        'UPDATE canvases SET updated_at = unixepoch(), latest_seq = ? WHERE id = ?'
      ).bind(seq, roomId).run();
      
      if (!result.success) {
        throw new Error('D1 update failed');
      }
      
      action = 'updated';
      console.log(`[Admin] ✅ Updated D1 record for room ${roomId} (seq: ${seq})`);
    } else {
      // 创建新记录
      const result = await env.DB.prepare(
        'INSERT INTO canvases (id, title, latest_seq, created_at, updated_at) VALUES (?, ?, ?, unixepoch(), unixepoch())'
      ).bind(roomId, roomId, seq).run();
      
      if (!result.success) {
        throw new Error('D1 insert failed');
      }
      
      action = 'created';
      console.log(`[Admin] ✅ Created D1 record for room ${roomId} (seq: ${seq})`);
    }
    
    return new Response(JSON.stringify({
      success: true,
      action,
      roomId,
      seq,
      nodeCount,
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[Admin] Error creating room record:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create room record',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

/**
 * 批量扫描并修复房间记录
 * 从 R2 扫描所有房间 ID,为每个房间创建 D1 记录
 */
export async function handleScanAndFixRooms(
  request: Request,
  env: Env
): Promise<Response> {
  const auth = await verifyAdminToken(request, env);
  if (!auth.success) {
    return new Response(JSON.stringify({ error: auth.error || 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
  
  try {
    const roomIds = new Set<string>();
    
    // 从 R2 扫描所有房间
    console.log('[Admin] Scanning R2 for room IDs...');
    const listed = await env.R2.list({ prefix: 'snapshots/' });
    
    for (const obj of listed.objects) {
      // 解析 key: snapshots/{roomId}/{seq}.json
      const match = obj.key.match(/^snapshots\/([^\/]+)\//);
      if (match) {
        roomIds.add(match[1]);
      }
    }
    
    console.log(`[Admin] Found ${roomIds.size} rooms in R2`);
    
    const results: Array<{
      roomId: string;
      action: 'created' | 'updated' | 'skipped' | 'failed';
      seq?: number;
      error?: string;
    }> = [];
    
    // 为每个房间检查并创建 D1 记录
    for (const roomId of roomIds) {
      try {
        // 检查是否已存在
        const existing = await env.DB.prepare(
          'SELECT id FROM canvases WHERE id = ?'
        ).bind(roomId).first();
        
        if (existing) {
          results.push({ roomId, action: 'skipped' });
          continue;
        }
        
        // 尝试从 DO 获取状态
        let seq = 0;
        
        try {
          const id = env.CANVAS_ROOM.idFromName(roomId);
          const stub = env.CANVAS_ROOM.get(id);
          const statusUrl = new URL(request.url);
          statusUrl.pathname = '/status';
          const statusResponse = await stub.fetch(statusUrl.toString());
          
          if (statusResponse.ok) {
            const status = await statusResponse.json() as any;
            seq = status.seq || 0;
          }
        } catch (statusError) {
          console.warn(`[Admin] Could not fetch status for ${roomId}:`, statusError);
        }
        
        // 创建 D1 记录
        const result = await env.DB.prepare(
          'INSERT INTO canvases (id, title, latest_seq, created_at, updated_at) VALUES (?, ?, ?, unixepoch(), unixepoch())'
        ).bind(roomId, roomId, seq).run();
        
        if (!result.success) {
          throw new Error('D1 insert failed');
        }
        
        results.push({ roomId, action: 'created', seq });
        console.log(`[Admin] ✅ Created D1 record for room ${roomId}`);
      } catch (error) {
        results.push({ 
          roomId, 
          action: 'failed', 
          error: error instanceof Error ? error.message : String(error)
        });
        console.error(`[Admin] ❌ Failed to create record for ${roomId}:`, error);
      }
    }
    
    const summary = {
      total: roomIds.size,
      created: results.filter(r => r.action === 'created').length,
      updated: results.filter(r => r.action === 'updated').length,
      skipped: results.filter(r => r.action === 'skipped').length,
      failed: results.filter(r => r.action === 'failed').length,
    };
    
    console.log('[Admin] Scan and fix completed:', summary);
    
    return new Response(JSON.stringify({
      success: true,
      summary,
      results,
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[Admin] Error scanning and fixing rooms:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to scan and fix rooms',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
