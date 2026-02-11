/**
 * 飞书登录 - 授权回调
 * GET /admin/auth/callback
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserAccessToken,
  getFeishuUserInfo,
  isAdminUser,
} from '@/lib/feishu';
import { createSession } from '@/lib/session';

export const runtime = 'edge';

const POST_LOGIN_REDIRECT_COOKIE_NAME = 'post_login_redirect';
const PROCESSED_CODE_TTL_MS = 5 * 60 * 1000;

function getSafeNextPath(path: string | undefined): string | null {
  if (!path) return null;
  if (!path.startsWith('/') || path.startsWith('//')) return null;
  return path;
}

// 用于防止重复处理同一个 code
const processedCodes = new Map<string, number>();

function cleanupProcessedCodes(now: number): void {
  for (const [code, timestamp] of processedCodes) {
    if (now - timestamp > PROCESSED_CODE_TTL_MS) {
      processedCodes.delete(code);
    }
  }
}

function hasProcessedCode(code: string, now: number): boolean {
  const timestamp = processedCodes.get(code);
  if (!timestamp) {
    return false;
  }

  if (now - timestamp > PROCESSED_CODE_TTL_MS) {
    processedCodes.delete(code);
    return false;
  }

  return true;
}

export async function GET(request: NextRequest) {
  const now = Date.now();
  cleanupProcessedCodes(now);

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  console.log('📨 收到授权回调:', {
    has_code: !!code,
    has_error: !!error,
    code_preview: code ? code.substring(0, 10) + '...' : 'none',
  });

  // 处理用户拒绝授权
  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/login?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    console.warn('⚠️ 缺少授权码');
    return NextResponse.redirect(
      new URL('/admin/login?error=missing_code', request.url)
    );
  }

  // 检查 code 是否已经处理过
  if (hasProcessedCode(code, now)) {
    console.warn('⚠️ 授权码已处理，跳过重复请求:', code.substring(0, 10) + '...');
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // 标记 code 为已处理
  processedCodes.set(code, now);
  console.log('✅ 开始处理授权码:', code.substring(0, 10) + '...');

  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;
  const redirectUri = process.env.FEISHU_REDIRECT_URI;
  const adminWhitelistRaw = process.env.ADMIN_WHITELIST;
  const adminWhitelist = (adminWhitelistRaw || '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
  const shouldCheckWhitelist = adminWhitelist.length > 0;

  if (!appId || !appSecret || !redirectUri) {
    return NextResponse.redirect(
      new URL('/admin/login?error=config_error', request.url)
    );
  }

  try {
    // 1. 使用授权码获取用户访问令牌
    const tokenData = await getUserAccessToken(code, {
      appId,
      appSecret,
      redirectUri,
    });

    // 2. 使用访问令牌获取用户信息
    const userInfo = await getFeishuUserInfo(tokenData.access_token);

    // 3. 验证用户是否在管理员白名单中
    if (shouldCheckWhitelist && !isAdminUser(userInfo.email, adminWhitelist)) {
      console.warn(
        `Unauthorized login attempt from: ${userInfo.email || userInfo.open_id}`
      );
      return NextResponse.redirect(
        new URL('/admin/login?error=unauthorized', request.url)
      );
    }
    if (!shouldCheckWhitelist) {
      console.warn('⚠️ ADMIN_WHITELIST 未配置，已跳过白名单校验');
    }

    // 4. 创建 Session（30天有效期）
    await createSession({
      userId: userInfo.open_id,
      userName: userInfo.name,
      userEmail: userInfo.email || '',
      userAvatar: userInfo.avatar_url,
      loginAt: Date.now(),
    });

    console.log(`Admin logged in: ${userInfo.name} (${userInfo.email})`);

    // 5. 重定向到原入口（若存在），否则管理后台
    const nextPath =
      getSafeNextPath(
        request.cookies.get(POST_LOGIN_REDIRECT_COOKIE_NAME)?.value
      ) || '/admin';
    const response = NextResponse.redirect(new URL(nextPath, request.url));
    response.cookies.delete(POST_LOGIN_REDIRECT_COOKIE_NAME);
    return response;
  } catch (error) {
    console.error('❌ Feishu auth callback error:', error);
    
    // 从已处理列表中移除失败的 code，允许重试
    processedCodes.delete(code);
    
    // 特殊处理授权码失效错误
    const errorMessage = error instanceof Error ? error.message : 'unknown_error';
    if (
      errorMessage.includes('20014') ||
      errorMessage.includes('20003') ||
      errorMessage.includes('已过期') ||
      errorMessage.includes('已使用') ||
      errorMessage.includes('code is invalid') ||
      errorMessage.includes('code is expired')
    ) {
      console.error('💡 提示: 授权码已失效，请重新登录');
      return NextResponse.redirect(
        new URL('/admin/login?error=code_expired', request.url)
      );
    }
    
    return NextResponse.redirect(
      new URL(
        `/admin/login?error=${encodeURIComponent(errorMessage)}`,
        request.url
      )
    );
  }
}
