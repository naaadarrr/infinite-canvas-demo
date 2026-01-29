/**
 * 管理API模块
 * 提供DO状态监控和管理功能
 */

import type { Env } from './types';
import { extractToken, verifyToken } from './utils/auth';

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
