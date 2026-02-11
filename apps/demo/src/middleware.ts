import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE_NAME = 'admin_session';

// 需要登录的路径
const PROTECTED_PATHS = ['/admin'];

// 登录相关路径（已登录用户不应访问）
const AUTH_PATHS = ['/admin/login', '/admin/auth/login', '/admin/auth/callback'];

// 公开 API 路径
const PUBLIC_API_PATHS = ['/admin/auth/login', '/admin/auth/callback'];

function isSafeRedirectPath(path: string | null): path is string {
  return !!path && path.startsWith('/') && !path.startsWith('//');
}

/**
 * 验证 Session Token
 */
async function verifySession(token: string): Promise<boolean> {
  try {
    const secret = process.env.SESSION_SECRET || 'dev-secret-change-in-production';
    const secretKey = new TextEncoder().encode(secret);
    await jwtVerify(token, secretKey);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  
  // 如果是公开 API，直接放行
  if (PUBLIC_API_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 画布入口也纳入登录保护（例如 /?canvasId=xxx）
  const isCanvasEntryPath =
    pathname === '/' && request.nextUrl.searchParams.has('canvasId');

  // 检查是否是受保护的路径
  const isProtectedPath =
    PROTECTED_PATHS.some((path) => pathname.startsWith(path)) || isCanvasEntryPath;
  const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path));

  // 获取 session token
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isAuthenticated = sessionToken ? await verifySession(sessionToken) : false;

  // 如果访问受保护路径但未登录，重定向到登录页
  if (isProtectedPath && !isAuthenticated && !isAuthPath) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  // 如果已登录但访问登录页，重定向到管理后台
  if (isAuthPath && isAuthenticated) {
    const nextPath = request.nextUrl.searchParams.get('next');
    if (isSafeRedirectPath(nextPath)) {
      return NextResponse.redirect(new URL(nextPath, request.url));
    }
    const adminUrl = new URL('/admin', request.url);
    return NextResponse.redirect(adminUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/',
  ],
};
