/**
 * Session 管理工具
 * 基于 HTTP-Only Cookie 实现 30 天登录态
 */

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

export interface SessionData {
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  loginAt: number;
}

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 天

/**
 * 获取 JWT 密钥
 */
function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET || 'dev-secret-change-in-production';
  return new TextEncoder().encode(secret);
}

/**
 * 创建 Session
 */
export async function createSession(data: SessionData): Promise<void> {
  const expires = new Date(Date.now() + SESSION_DURATION);

  // 创建 JWT
  const token = await new SignJWT(data)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(getSecretKey());

  // 设置 HTTP-Only Cookie
  (await cookies()).set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires,
    path: '/',
  });
}

/**
 * 获取 Session
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, getSecretKey());
    return verified.payload as unknown as SessionData;
  } catch (error) {
    console.error('Session verification failed:', error);
    return null;
  }
}

/**
 * 清除 Session
 */
export async function clearSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE_NAME);
}

/**
 * 验证是否已登录
 */
export async function requireAuth(): Promise<SessionData> {
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}
