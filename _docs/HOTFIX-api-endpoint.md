# 🔥 紧急修复: 使用正确的飞书 API 端点

## ❌ 问题诊断

### 错误信息
```
code: 20014
message: 'The app access token passed is invalid. Please check the value.'
```

### 根本原因

我们使用了错误的 API 端点：

```typescript
// ❌ 错误 - OIDC 端点（需要特殊配置）
'https://open.feishu.cn/open-apis/authen/v1/oidc/access_token'

// ✅ 正确 - 标准网页应用 SSO 端点
'https://open.feishu.cn/open-apis/authen/v1/access_token'
```

## ✅ 已修复

### 修改的内容

#### 1. 修改 API 端点

```typescript
// 修复前
const response = await fetch(
  'https://open.feishu.cn/open-apis/authen/v1/oidc/access_token',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      client_id: config.appId,
      client_secret: config.appSecret,
    }),
  }
);

// 修复后
const response = await fetch(
  'https://open.feishu.cn/open-apis/authen/v1/access_token',
  {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${config.appId}:${config.appSecret}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
    }),
  }
);
```

#### 2. 关键变化

| 变化项 | 修复前 | 修复后 |
|-------|--------|--------|
| **API 端点** | `/authen/v1/oidc/access_token` | `/authen/v1/access_token` |
| **认证方式** | 请求体中传递 | HTTP Basic Auth（Header） |
| **app_id 位置** | 请求体 `client_id` | Authorization Header |
| **app_secret 位置** | 请求体 `client_secret` | Authorization Header |

## 📚 飞书 API 说明

### 两种登录方式对比

飞书提供两种网页应用登录方式：

#### 1. 标准网页应用 SSO（我们使用的）✅

**端点**: `/authen/v1/access_token`

**特点**:
- ✅ 简单易用，适合大多数场景
- ✅ 使用 HTTP Basic Authentication
- ✅ 返回 `user_access_token`
- ✅ 支持获取用户基本信息

**文档**: [获取 access_token](https://open.feishu.cn/document/common-capabilities/sso/api/get-access_token)

**认证方式**:
```
Authorization: Basic base64(app_id:app_secret)
```

#### 2. OIDC 登录（OpenID Connect）❌

**端点**: `/authen/v1/oidc/access_token`

**特点**:
- ⚠️ 需要特殊配置
- ⚠️ 遵循 OIDC 标准
- ⚠️ 返回 `id_token` 和 `access_token`
- ⚠️ 需要在飞书后台开启 OIDC 支持

**适用场景**:
- 需要符合 OIDC 标准的集成
- 需要 `id_token` 的场景
- 企业级 SSO 集成

## 🚀 测试修复

### 1. 重启服务

```bash
# 停止当前服务
Ctrl+C

# 重启服务
cd apps/demo
pnpm dev
```

### 2. 清除浏览器缓存

```bash
# 打开开发者工具
F12 或 右键 → 检查

# 清除存储
Application → Storage → Clear site data
```

### 3. 重新测试登录

```bash
# 1. 访问登录页
http://localhost:3002/admin

# 2. 点击「使用飞书账号登录」

# 3. 在飞书授权页面确认

# 4. 应该能成功登录 ✅
```

### 4. 查看日志

成功的日志应该是：

```
📨 收到授权回调: { has_code: true, ... }
✅ 开始处理授权码: xxx...
🔐 请求飞书 access_token: { 
  url: 'https://open.feishu.cn/open-apis/authen/v1/access_token',
  app_id: 'cli_xxx',
  ...
}
📥 飞书 API 响应: { 
  status: 200, 
  code: 0,          // ✅ 成功！
  has_data: true 
}
✅ 成功获取 access_token
Admin logged in: 张三 (zhangsan@company.com)
```

## 🔍 如何识别使用了错误的端点

### 错误的端点会返回

```json
{
  "code": 20014,
  "message": "The app access token passed is invalid. Please check the value."
}
```

### 正确的端点会返回

```json
{
  "code": 0,
  "data": {
    "access_token": "u-xxx",
    "token_type": "Bearer",
    "expires_in": 7200,
    "refresh_token": "ur-xxx",
    "refresh_expires_in": 2592000
  }
}
```

## 📋 检查清单

- [ ] 代码已更新（使用 `/authen/v1/access_token`）
- [ ] 使用了 HTTP Basic Auth
- [ ] app_id 和 app_secret 在 Authorization Header
- [ ] 请求体只包含 `grant_type` 和 `code`
- [ ] 服务已重启
- [ ] 浏览器缓存已清除
- [ ] 能够成功登录

## 🎯 技术细节

### HTTP Basic Authentication

```typescript
// 构建 Basic Auth Header
const credentials = `${appId}:${appSecret}`;
const base64Credentials = Buffer.from(credentials).toString('base64');
const authHeader = `Basic ${base64Credentials}`;

// 示例
// app_id: cli_abc123
// app_secret: secret_xyz789
// credentials: cli_abc123:secret_xyz789
// base64: Y2xpX2FiYzEyMzpzZWNyZXRfeHl6Nzg5
// header: Basic Y2xpX2FiYzEyMzpzZWNyZXRfeHl6Nzg5
```

### 请求示例

```bash
curl -X POST \
  'https://open.feishu.cn/open-apis/authen/v1/access_token' \
  -H 'Authorization: Basic Y2xpX2FiYzEyMzpzZWNyZXRfeHl6Nzg5' \
  -H 'Content-Type: application/json' \
  -d '{
    "grant_type": "authorization_code",
    "code": "xMSldislSkdK"
  }'
```

### 响应示例

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "access_token": "u-6jHKE3E72NcVRAcEExyTqdyng0sHyja.mN5c3Hj0S",
    "token_type": "Bearer",
    "expires_in": 7200,
    "name": "张三",
    "en_name": "Zhang San",
    "avatar_url": "https://...",
    "avatar_thumb": "https://...",
    "avatar_middle": "https://...",
    "avatar_big": "https://...",
    "open_id": "ou_xxx",
    "union_id": "on_xxx",
    "email": "zhangsan@company.com",
    "enterprise_email": "zhangsan@company.com",
    "user_id": "xxx",
    "mobile": "+86123456789",
    "tenant_key": "xxx",
    "refresh_expires_in": 2592000,
    "refresh_token": "ur-xxx"
  }
}
```

## 🎓 学到的经验

1. **仔细阅读 API 文档**
   - 飞书有多个相似的 API 端点
   - 不同端点用于不同的场景
   - 需要根据实际需求选择

2. **注意认证方式**
   - OIDC 端点使用请求体传递凭证
   - 标准端点使用 HTTP Basic Auth
   - 认证方式错误会导致 401 或类似错误

3. **查看完整的错误信息**
   - 不仅要看错误码
   - 还要看错误消息
   - 完整的响应体包含更多信息

4. **测试时使用详细日志**
   - 记录请求 URL
   - 记录请求参数
   - 记录完整响应
   - 有助于快速定位问题

## 📞 相关文档

- [飞书网页应用 SSO](https://open.feishu.cn/document/common-capabilities/sso/web-application-sso/web-app-overview)
- [获取 access_token](https://open.feishu.cn/document/common-capabilities/sso/api/get-access_token)
- [获取用户信息](https://open.feishu.cn/document/common-capabilities/sso/api/get-user-info)
- [OIDC 登录](https://open.feishu.cn/document/common-capabilities/sso/oidc-sso/overview)

---

**修复时间**: 2026-02-11  
**问题**: 使用了错误的 OIDC API 端点  
**解决方案**: 改用标准的网页应用 SSO API  
**状态**: ✅ 已修复
