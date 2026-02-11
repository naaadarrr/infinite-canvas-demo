'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: '授权码缺失，请重试',
  config_error: '系统配置错误，请联系管理员',
  unauthorized: '您没有权限访问管理后台',
  unknown_error: '登录失败，请重试',
  code_expired: '授权已过期，请重新登录（不要刷新页面或重复点击）',
};

// 检测错误消息中的错误码
const getErrorMessage = (errorParam: string | null): string | null => {
  if (!errorParam) return null;
  
  // 检查是否包含错误码 20025
  if (errorParam.includes('20025')) {
    return '获取用户访问令牌失败 (错误码: 20025): missing app id or app secret';
  }
  
  return ERROR_MESSAGES[errorParam] || decodeURIComponent(errorParam);
};

const isSafeNextPath = (path: string | null): path is string =>
  !!path && path.startsWith('/') && !path.startsWith('//');

export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(getErrorMessage(errorParam));
    }
  }, [searchParams]);

  const handleLogin = () => {
    setIsLoading(true);
    setError(null);

    const nextPath = searchParams.get('next');
    if (isSafeNextPath(nextPath)) {
      const authUrl = new URL('/admin/auth/login', window.location.origin);
      authUrl.searchParams.set('next', nextPath);
      window.location.href = authUrl.toString();
      return;
    }

    // 重定向到飞书授权页面
    window.location.href = '/admin/auth/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="space-y-4 text-center pb-8 pt-10">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
              <span className="text-2xl font-bold text-white">B</span>
            </div>
          </div>

          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight">
              Board Admin
            </CardTitle>
            <CardDescription className="text-base">
              协作画布管理后台
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-8 pb-10">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="animate-in fade-in-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Login Button */}
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full h-12 text-base font-medium shadow-md hover:shadow-lg transition-all"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                登录中...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-5 w-5" />
                使用飞书账号登录
              </>
            )}
          </Button>

          {/* Info */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="leading-relaxed">
                使用企业飞书账号登录，仅限已授权的管理员访问
              </p>
            </div>

            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="leading-relaxed">
                登录状态将保持 30 天，期间无需重复登录
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground/60 pt-4">
            © 2026 Board Admin. All rights reserved.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
