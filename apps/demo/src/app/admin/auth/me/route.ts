/**
 * 获取当前登录用户信息
 * GET /admin/auth/me
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: session.userId,
      name: session.userName,
      email: session.userEmail,
      avatar: session.userAvatar,
      loginAt: session.loginAt,
    },
  });
}
