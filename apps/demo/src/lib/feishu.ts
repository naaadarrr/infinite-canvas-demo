/**
 * 飞书 OAuth 认证工具库
 */

export interface FeishuConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

export interface FeishuUserInfo {
  open_id: string;
  union_id?: string;
  name: string;
  en_name?: string;
  email?: string;
  mobile?: string;
  avatar_url?: string;
  employee_no?: string;
}

export interface FeishuAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  refresh_expires_in?: number;
}

/**
 * 获取飞书登录授权 URL
 */
export function getFeishuAuthUrl(config: FeishuConfig, state?: string): string {
  const params = new URLSearchParams({
    app_id: config.appId,
    redirect_uri: config.redirectUri,
    state: state || Math.random().toString(36).substring(7),
    // 添加 scope 参数，请求用户基本信息和邮箱权限
    scope: 'contact:user.base:readonly contact:user.email:readonly',
  });

  return `https://open.feishu.cn/open-apis/authen/v1/authorize?${params.toString()}`;
}

/**
 * 获取租户访问令牌（tenant_access_token）
 * 用于后续的 API 调用
 */
export async function getTenantAccessToken(
  appId: string,
  appSecret: string
): Promise<string> {
  const response = await fetch(
    'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: appId,
        app_secret: appSecret,
      }),
    }
  );

  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(`获取租户访问令牌失败: ${data.msg}`);
  }

  return data.tenant_access_token;
}

/**
 * 使用授权码获取用户访问令牌
 * 文档: https://open.feishu.cn/document/common-capabilities/sso/api/get-access_token
 */
export async function getUserAccessToken(
  code: string,
  config: FeishuConfig
): Promise<FeishuAccessToken> {
  const requestBody = {
    grant_type: 'authorization_code',
    code,
    app_id: config.appId,
    app_secret: config.appSecret,
    redirect_uri: config.redirectUri,
  };

  console.log('🔐 请求飞书 access_token:', {
    url: 'https://open.feishu.cn/open-apis/authen/v1/access_token',
    app_id: config.appId,
    has_app_secret: !!config.appSecret,
    has_redirect_uri: !!config.redirectUri,
    code_length: code.length,
    code_preview: code.substring(0, 10) + '...',
  });

  const response = await fetch(
    'https://open.feishu.cn/open-apis/authen/v1/access_token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  );

  const data = await response.json();

  console.log('📥 飞书 API 响应:', {
    status: response.status,
    code: data.code,
    has_data: !!data.data,
    full_response: data,
  });

  // 添加详细的错误日志
  if (data.code !== 0) {
    // 飞书错误码对照
    const errorMessages: Record<number, string> = {
      10014: 'App ID 或 App Secret 错误',
      20014: '授权码已过期或已使用（code 只能使用一次）',
      20025: 'App ID 或 App Secret 未正确传递到 API',
      99991663: 'redirect_uri 不匹配',
      99991664: 'scope 参数错误',
    };

    const errorMsg = errorMessages[data.code] || data.msg || '未知错误';

    console.error('❌ 飞书 API 返回错误:', {
      code: data.code,
      message: errorMsg,
      msg: data.msg,
      error: data.error,
      error_description: data.error_description,
      full_response: data,
    });

    throw new Error(`获取用户访问令牌失败 (错误码: ${data.code}): ${errorMsg}`);
  }

  console.log('✅ 成功获取 access_token');
  return data.data as FeishuAccessToken;
}

/**
 * 获取用户信息
 */
export async function getFeishuUserInfo(
  userAccessToken: string
): Promise<FeishuUserInfo> {
  const response = await fetch(
    'https://open.feishu.cn/open-apis/authen/v1/user_info',
    {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
      },
    }
  );

  const data = await response.json();

  // 添加详细的错误日志
  if (data.code !== 0) {
    console.error('飞书 API 返回错误:', {
      code: data.code,
      msg: data.msg,
      error: data.error,
    });
    throw new Error(`获取用户信息失败: ${data.msg || data.error || '未知错误'}`);
  }

  return data.data as FeishuUserInfo;
}

/**
 * 验证用户是否在管理员白名单中
 */
export function isAdminUser(email: string | undefined, whitelist: string[]): boolean {
  if (!email) return false;
  return whitelist.some(
    (adminEmail) => adminEmail.toLowerCase() === email.toLowerCase()
  );
}
