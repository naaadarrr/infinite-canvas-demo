/**
 * 简单的鉴权工具
 * MVP 阶段可以使用简单的 token 验证
 * 生产环境建议使用 JWT 或 OAuth
 */

import type { Env } from '../types';

export interface AuthResult {
  success: boolean;
  userId?: string;
  userName?: string;
  error?: string;
}

/**
 * 验证 token（简单实现）
 * 生产环境应该使用 JWT 或其他标准方案
 */
export async function verifyToken(token: string | null, env: Env): Promise<AuthResult> {
  if (!token) {
    return { success: false, error: 'Missing token' };
  }

  // MVP: 简单的 token 验证
  // 格式: user_{userId} 或 share_{shareId}
  if (token.startsWith('user_')) {
    const userId = token.substring(5);
    return {
      success: true,
      userId,
      userName: `User ${userId}`,
    };
  }

  if (token.startsWith('share_')) {
    // 共享链接，生成匿名用户 ID
    const shareId = token.substring(6);
    return {
      success: true,
      userId: `anon_${shareId}_${Date.now()}`,
      userName: 'Anonymous',
    };
  }

  // 开发环境：允许任何 token
  if (env.TOKEN_SECRET === 'dev-secret-change-in-production') {
    return {
      success: true,
      userId: token || 'dev_user',
      userName: 'Dev User',
    };
  }

  return { success: false, error: 'Invalid token' };
}

/**
 * 从请求中提取 token
 */
export function extractToken(request: Request): string | null {
  const url = new URL(request.url);
  
  // 从查询参数获取
  const queryToken = url.searchParams.get('token');
  if (queryToken) return queryToken;

  // 从 header 获取
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * 验证用户对画布的权限
 * MVP 阶段暂时允许所有已认证用户
 */
export async function checkCanvasPermission(
  userId: string,
  canvasId: string,
  db: D1Database,
  requiredRole: 'owner' | 'editor' | 'viewer' = 'viewer'
): Promise<boolean> {
  // MVP: 暂时允许所有用户访问
  // 生产环境应查询 canvas_members 表
  return true;

  /* 生产环境实现示例：
  const result = await db
    .prepare('SELECT role FROM canvas_members WHERE canvas_id = ? AND user_id = ?')
    .bind(canvasId, userId)
    .first<{ role: string }>();

  if (!result) return false;

  const roleHierarchy = { owner: 3, editor: 2, viewer: 1 };
  return roleHierarchy[result.role as keyof typeof roleHierarchy] >= 
         roleHierarchy[requiredRole];
  */
}
