/**
 * Cloudflare Worker 入口
 * 处理 HTTP API 和 WebSocket 路由
 */

import type { Env } from './types';
import { extractToken, verifyToken } from './utils/auth';

export { CanvasRoom } from './canvasRoom';

/**
 * Worker 默认导出
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // CORS 处理
    if (request.method === 'OPTIONS') {
      return handleCORS(request);
    }

    try {
      // API 路由
      if (url.pathname.startsWith('/api/')) {
        return await handleAPI(request, env, url);
      }

      // WebSocket 路由
      if (url.pathname.startsWith('/ws/')) {
        return await handleWebSocket(request, env, url);
      }

      // 根路径
      if (url.pathname === '/' || url.pathname === '') {
        return new Response(
          JSON.stringify({
            name: 'Infinite Canvas Server',
            version: '0.0.1',
            status: 'running',
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response('Not found', { status: 404 });
    } catch (error) {
      console.error('[Worker] Error:', error);
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
};

/**
 * 处理 API 请求
 */
async function handleAPI(request: Request, env: Env, url: URL): Promise<Response> {
  const path = url.pathname.replace('/api', '');

  // GET /api/canvas - 获取画布列表
  if (path === '/canvas' && request.method === 'GET') {
    return await handleGetCanvasList(request, env);
  }

  // POST /api/canvas - 创建新画布
  if (path === '/canvas' && request.method === 'POST') {
    return await handleCreateCanvas(request, env);
  }

  // GET /api/canvas/:id - 获取画布详情
  const canvasMatch = path.match(/^\/canvas\/([^/]+)$/);
  if (canvasMatch && request.method === 'GET') {
    return await handleGetCanvas(request, env, canvasMatch[1]);
  }

  // POST /api/canvas/:id/leave - 强制用户离开
  const leaveMatch = path.match(/^\/canvas\/([^/]+)\/leave$/);
  if (leaveMatch && request.method === 'POST') {
    return await handleForceLeave(request, env, leaveMatch[1]);
  }

  // DELETE /api/canvas/:id - 删除画布
  if (canvasMatch && request.method === 'DELETE') {
    return await handleDeleteCanvas(request, env, canvasMatch[1]);
  }

  return new Response('Not found', { status: 404 });
}

/**
 * 强制用户离开（外部服务）
 */
async function handleForceLeave(request: Request, env: Env, canvasId: string): Promise<Response> {
  try {
    const token = extractToken(request);
    const auth = await verifyToken(token, env);

    if (!auth.success) {
      return errorResponse(auth.error || 'Unauthorized', 401);
    }

    const body = await request.json<{ userId?: string }>();
    if (!body.userId) {
      return errorResponse('Missing userId', 400);
    }

    const id = env.CANVAS_ROOM.idFromName(canvasId);
    const stub = env.CANVAS_ROOM.get(id);
    const doUrl = new URL(request.url);
    doUrl.pathname = '/leave';
    const response = await stub.fetch(doUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: body.userId }),
    });

    return response;
  } catch (error) {
    console.error('[API] Error forcing leave:', error);
    return errorResponse('Failed to force leave', 500);
  }
}

/**
 * 获取画布列表
 */
async function handleGetCanvasList(request: Request, env: Env): Promise<Response> {
  try {
    const result = await env.DB.prepare(
      'SELECT id, title, latest_seq, created_at, updated_at FROM canvases ORDER BY updated_at DESC LIMIT 50'
    ).all();

    return jsonResponse(result.results || []);
  } catch (error) {
    return errorResponse('Failed to fetch canvases', 500);
  }
}

/**
 * 创建画布
 */
async function handleCreateCanvas(request: Request, env: Env): Promise<Response> {
  try {
    const token = extractToken(request);
    const auth = await verifyToken(token, env);

    if (!auth.success) {
      return errorResponse(auth.error || 'Unauthorized', 401);
    }

    const body = await request.json<{ title?: string }>();
    const canvasId = `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const title = body.title || 'Untitled Canvas';

    await env.DB.prepare(
      'INSERT INTO canvases (id, title, latest_seq) VALUES (?, ?, 0)'
    )
      .bind(canvasId, title)
      .run();

    // 可选：添加创建者为 owner
    if (auth.userId) {
      await env.DB.prepare(
        'INSERT INTO canvas_members (canvas_id, user_id, role) VALUES (?, ?, ?)'
      )
        .bind(canvasId, auth.userId, 'owner')
        .run();
    }

    return jsonResponse({
      id: canvasId,
      title,
      seq: 0,
      createdAt: Date.now(),
    });
  } catch (error) {
    console.error('[API] Error creating canvas:', error);
    return errorResponse('Failed to create canvas', 500);
  }
}

/**
 * 获取画布详情
 */
async function handleGetCanvas(request: Request, env: Env, canvasId: string): Promise<Response> {
  try {
    const result = await env.DB.prepare(
      'SELECT id, title, latest_seq, created_at, updated_at FROM canvases WHERE id = ?'
    )
      .bind(canvasId)
      .first();

    if (!result) {
      return errorResponse('Canvas not found', 404);
    }

    return jsonResponse(result);
  } catch (error) {
    return errorResponse('Failed to fetch canvas', 500);
  }
}

/**
 * 删除画布
 */
async function handleDeleteCanvas(request: Request, env: Env, canvasId: string): Promise<Response> {
  try {
    const token = extractToken(request);
    const auth = await verifyToken(token, env);

    if (!auth.success) {
      return errorResponse(auth.error || 'Unauthorized', 401);
    }

    // TODO: 检查权限（是否为 owner）

    await env.DB.prepare('DELETE FROM canvases WHERE id = ?')
      .bind(canvasId)
      .run();

    // 可选：删除 R2 中的快照
    const prefix = `snapshots/${canvasId}/`;
    const listed = await env.R2.list({ prefix });
    for (const obj of listed.objects) {
      await env.R2.delete(obj.key);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('[API] Error deleting canvas:', error);
    return errorResponse('Failed to delete canvas', 500);
  }
}

/**
 * 处理 WebSocket 连接
 */
async function handleWebSocket(request: Request, env: Env, url: URL): Promise<Response> {
  // 路由: /ws/canvas/:id
  const match = url.pathname.match(/^\/ws\/canvas\/([^/]+)$/);
  if (!match) {
    return new Response('Invalid WebSocket path', { status: 400 });
  }

  const canvasId = match[1];

  // 验证 token
  const token = extractToken(request);
  const auth = await verifyToken(token, env);

  if (!auth.success) {
    return new Response(auth.error || 'Unauthorized', { status: 401 });
  }

  // TODO: 检查用户对画布的权限

  // 获取或创建 Durable Object
  const id = env.CANVAS_ROOM.idFromName(canvasId);
  const stub = env.CANVAS_ROOM.get(id);

  // 将请求转发到 DO，并附加 canvasId
  const doUrl = new URL(request.url);
  doUrl.searchParams.set('canvasId', canvasId);
  doUrl.searchParams.set('userId', auth.userId || 'unknown');
  doUrl.searchParams.set('userName', auth.userName || 'Unknown');

  return await stub.fetch(doUrl.toString(), request);
}

/**
 * CORS 处理
 */
function handleCORS(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * JSON 响应辅助函数
 */
function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

/**
 * 错误响应辅助函数
 */
function errorResponse(message: string, status: number = 400): Response {
  return jsonResponse({ error: message }, status);
}
