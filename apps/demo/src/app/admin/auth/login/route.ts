/**
 * 飞书登录 - 发起授权
 * GET /admin/auth/login
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFeishuAuthUrl } from '@/lib/feishu';

export const runtime = 'edge';

const POST_LOGIN_REDIRECT_COOKIE_NAME = 'post_login_redirect';
const POST_LOGIN_REDIRECT_MAX_AGE_SECONDS = 10 * 60;

function getSafeNextPath(path: string | null): string | null {
  if (!path) return null;
  if (!path.startsWith('/') || path.startsWith('//')) return null;
  return path;
}

export async function GET(request: NextRequest) {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;
  const redirectUri = process.env.FEISHU_REDIRECT_URI;
  const nextPath = getSafeNextPath(request.nextUrl.searchParams.get('next'));

  if (!appId || !appSecret || !redirectUri) {
    return NextResponse.json(
      { error: '飞书登录配置不完整，请检查环境变量' },
      { status: 500 }
    );
  }

  // 生成 state 参数用于防止 CSRF 攻击
  const state = Math.random().toString(36).substring(7);

  // 重定向到飞书授权页面
  const authUrl = getFeishuAuthUrl(
    {
      appId,
      appSecret,
      redirectUri,
    },
    state
  );

  const response = NextResponse.redirect(authUrl);

  if (nextPath) {
    response.cookies.set(POST_LOGIN_REDIRECT_COOKIE_NAME, nextPath, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: POST_LOGIN_REDIRECT_MAX_AGE_SECONDS,
    });
  } else {
    response.cookies.delete(POST_LOGIN_REDIRECT_COOKIE_NAME);
  }

  return response;
}
