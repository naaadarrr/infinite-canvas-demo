# 飞书企业登录配置指南

## 📋 概述

本指南将帮助你为 Board Admin 管理后台配置飞书企业账号登录功能，实现基于企业账号的安全认证和 30 天登录态管理。

## 🔧 1. 飞书开放平台配置

### 1.1 创建企业自建应用

1. 访问 [飞书开放平台](https://open.feishu.cn/app)
2. 点击「创建企业自建应用」
3. 填写应用信息：
   - **应用名称**: Board Admin（或自定义）
   - **应用描述**: 协作画布管理后台
   - **应用图标**: 上传应用图标

### 1.2 获取应用凭证

创建完成后，在「凭证与基础信息」页面获取：

- **App ID**: `cli_xxxxxxxxxxxx`
- **App Secret**: `xxxxxxxxxxxxxxxxxxxxxxxx`

⚠️ **请妥善保管 App Secret，不要泄露！**

### 1.3 配置网页应用

1. 进入「网页」→「网页配置」
2. 点击「添加重定向 URL」
3. 添加以下 URL（根据环境选择）：

   **本地开发环境:**
   ```
   http://localhost:3002/admin/auth/callback
   ```

   **生产环境:**
   ```
   https://your-domain.com/admin/auth/callback
   ```

   💡 可以同时添加多个环境的 URL

### 1.4 开启应用权限

进入「权限管理」→「权限配置」，开启以下权限：

| 权限名称 | 权限标识 | 用途 |
|---------|---------|------|
| 获取用户基本信息 | `contact:user.base:readonly` | 获取用户姓名、头像等 |
| 获取用户邮箱信息 | `contact:user.email:readonly` | 用于身份识别和白名单验证 |

### 1.5 发布应用

1. 完成以上配置后，点击「版本管理与发布」
2. 创建版本并提交审核
3. 审核通过后发布应用
4. 将应用添加到企业工作台

## ⚙️ 2. 环境变量配置

### 2.1 配置 `.env.local`

在 `apps/demo/.env.local` 文件中添加以下配置：

```bash
# 飞书登录配置
FEISHU_APP_ID=cli_xxxxxxxxxxxx
FEISHU_APP_SECRET=your_app_secret_here
FEISHU_REDIRECT_URI=http://localhost:3002/admin/auth/callback

# 生产环境使用:
# FEISHU_REDIRECT_URI=https://your-domain.com/admin/auth/callback

# 管理员白名单（飞书用户邮箱，用逗号分隔）
ADMIN_WHITELIST=admin@company.com,manager@company.com,ceo@company.com

# Session 密钥（用于加密 cookie，请使用随机字符串）
SESSION_SECRET=your_random_session_secret_at_least_32_chars
```

### 2.2 配置说明

| 变量名 | 必填 | 说明 |
|-------|------|------|
| `FEISHU_APP_ID` | ✅ | 飞书应用的 App ID |
| `FEISHU_APP_SECRET` | ✅ | 飞书应用的 App Secret |
| `FEISHU_REDIRECT_URI` | ✅ | OAuth 回调地址，必须与飞书平台配置一致 |
| `ADMIN_WHITELIST` | ✅ | 允许访问管理后台的飞书用户邮箱列表 |
| `SESSION_SECRET` | ✅ | 用于加密 Session Cookie 的密钥（至少 32 个字符）|

### 2.3 生成安全的 SESSION_SECRET

**方法 1: 使用 OpenSSL**
```bash
openssl rand -base64 32
```

**方法 2: 使用 Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**方法 3: 在线生成**
访问 [1Password Generator](https://1password.com/password-generator/) 生成 32+ 字符的随机字符串

## 📦 3. 安装依赖

运行以下命令安装必需的依赖包：

```bash
cd apps/demo
pnpm install
```

新增依赖:
- `jose`: 用于 JWT Session 管理

## 🚀 4. 启动应用

### 4.1 启动开发服务器

```bash
# 在项目根目录
pnpm dev

# 或者在 apps/demo 目录
cd apps/demo
pnpm dev
```

应用将在 `http://localhost:3002` 启动

### 4.2 访问管理后台

1. 打开浏览器访问: `http://localhost:3002/admin`
2. 自动跳转到登录页面
3. 点击「使用飞书账号登录」
4. 在飞书授权页面确认授权
5. 成功登录后跳转到管理后台

## 🔐 5. 安全配置

### 5.1 管理员白名单

只有在 `ADMIN_WHITELIST` 中配置的邮箱才能登录管理后台。

**添加管理员:**
```bash
ADMIN_WHITELIST=admin@company.com,manager@company.com,newadmin@company.com
```

### 5.2 Session 有效期

默认 Session 有效期为 **30 天**，在此期间用户无需重复登录。

修改有效期（在 `src/lib/session.ts` 中）:
```typescript
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 天
```

### 5.3 Cookie 安全设置

生产环境会自动启用以下安全特性：
- **HttpOnly**: 防止 XSS 攻击
- **Secure**: 仅在 HTTPS 下传输
- **SameSite=Lax**: 防止 CSRF 攻击

## 🌐 6. 生产环境部署

### 6.1 更新重定向 URL

1. 在飞书开放平台添加生产环境的回调 URL
2. 更新 `.env.production` 或环境变量:

```bash
FEISHU_REDIRECT_URI=https://your-domain.com/admin/auth/callback
```

### 6.2 环境变量设置

**Cloudflare Pages:**
在 Cloudflare Dashboard 设置环境变量

**Vercel:**
在 Vercel Dashboard 的 Settings → Environment Variables 添加

**Docker/自托管:**
通过 `.env` 文件或容器环境变量传入

### 6.3 域名配置

确保生产域名已正确配置 HTTPS 证书。

## 📋 7. 功能清单

### ✅ 已实现功能

- [x] 飞书 OAuth 2.0 企业账号登录
- [x] 基于 JWT 的 Session 管理（30 天有效期）
- [x] 管理员白名单验证
- [x] HTTP-Only Cookie 安全存储
- [x] 登录态自动检查
- [x] 登录页面 UI
- [x] 用户信息展示（头像、姓名、邮箱）
- [x] 退出登录功能
- [x] 中间件路由保护
- [x] 错误提示和处理

### 🎨 UI 界面

**登录页面** (`/admin/login`):
- 简洁的登录界面
- 飞书品牌按钮
- 错误提示
- 加载状态

**管理后台** (`/admin`):
- 顶部显示用户信息（头像、姓名、邮箱）
- 退出登录按钮
- 完整的管理功能

## 🧪 8. 测试流程

### 8.1 测试登录

1. 访问 `http://localhost:3002/admin`
2. 验证自动跳转到登录页
3. 点击「使用飞书账号登录」
4. 在飞书授权页面点击「确认授权」
5. 验证成功跳转到管理后台
6. 检查用户信息是否正确显示

### 8.2 测试白名单

1. 使用**不在白名单**中的飞书账号登录
2. 验证显示「您没有权限访问管理后台」错误
3. 无法进入管理后台

### 8.3 测试 Session

1. 成功登录后关闭浏览器
2. 重新打开浏览器访问 `/admin`
3. 验证自动登录（无需重新授权）
4. Session 在 30 天内有效

### 8.4 测试退出

1. 点击右上角「退出」按钮
2. 验证跳转到登录页
3. 尝试访问 `/admin`，应重定向到登录页

## 🐛 9. 常见问题

### Q1: 提示「飞书登录配置不完整」

**原因**: 缺少必要的环境变量

**解决**:
1. 检查 `.env.local` 文件是否存在
2. 确认 `FEISHU_APP_ID`、`FEISHU_APP_SECRET`、`FEISHU_REDIRECT_URI` 已正确配置
3. 重启开发服务器

### Q2: 授权后显示「您没有权限访问管理后台」

**原因**: 当前用户邮箱不在白名单中

**解决**:
1. 检查飞书账号的企业邮箱
2. 将邮箱添加到 `ADMIN_WHITELIST`
3. 格式: `email1@company.com,email2@company.com`

### Q3: 回调地址报错 「redirect_uri_mismatch」

**原因**: 回调 URL 与飞书平台配置不一致

**解决**:
1. 确认 `FEISHU_REDIRECT_URI` 配置正确
2. 在飞书开放平台检查「网页」→「网页配置」中的重定向 URL
3. 确保完全一致（包括协议、域名、端口、路径）

### Q4: Session 验证失败，频繁退出登录

**原因**: `SESSION_SECRET` 未配置或配置错误

**解决**:
1. 确保 `SESSION_SECRET` 至少 32 个字符
2. 使用随机生成的密钥，不要使用默认值
3. 重启服务后重新登录

### Q5: 生产环境无法登录

**原因**: Cookie 安全设置

**解决**:
1. 确保生产环境使用 HTTPS
2. 检查 `NODE_ENV` 是否为 `production`
3. 检查浏览器 Cookie 设置

## 📚 10. API 接口文档

### 10.1 发起登录

```
GET /admin/auth/login
```

重定向到飞书授权页面。

### 10.2 授权回调

```
GET /admin/auth/callback?code=xxx&state=xxx
```

处理飞书授权回调，创建 Session。

### 10.3 获取当前用户

```
GET /admin/auth/me
```

**Response (Success 200)**:
```json
{
  "user": {
    "id": "ou_xxxxxxxxxxxx",
    "name": "张三",
    "email": "zhangsan@company.com",
    "avatar": "https://...",
    "loginAt": 1707686400000
  }
}
```

**Response (Unauthorized 401)**:
```json
{
  "error": "Unauthorized"
}
```

### 10.4 退出登录

```
POST /admin/auth/logout
GET /admin/auth/logout
```

清除 Session，POST 返回 JSON，GET 重定向到登录页。

## 🔄 11. 升级和维护

### 11.1 更新管理员列表

修改 `.env.local` 中的 `ADMIN_WHITELIST`，重启服务。

### 11.2 轮换 Session Secret

1. 生成新的随机密钥
2. 更新 `SESSION_SECRET`
3. 重启服务
4. 所有用户需要重新登录

### 11.3 查看日志

登录成功会在服务端输出:
```
Admin logged in: 张三 (zhangsan@company.com)
```

未授权登录尝试会输出:
```
Unauthorized login attempt from: zhangsan@company.com
```

## 📞 12. 技术支持

如有问题，请检查:
1. 飞书开放平台应用配置
2. 环境变量配置
3. 服务器日志
4. 浏览器控制台错误

---

**配置完成后，你的管理后台将拥有:**
✅ 企业级身份认证
✅ 30 天免登录体验
✅ 安全的权限管理
✅ 优雅的登录界面
