# 飞书企业登录 - 问题解答

## 📋 你的问题

> admin 的页面，能接入一个 feishu 登录的？（基于企业帐号的登录）
> 1. 我需要提供什么信息参数？
> 2. 我需要怎么配置？
> 3. 你怎么开发实现？
> 4. 提供一个基于飞书登录的UI界面作为打开 admin的首页，并基于登录态管理（30d）

---

## ✅ 1. 需要提供的信息参数

### 从飞书开放平台获取

| 参数 | 示例 | 获取位置 | 说明 |
|-----|------|---------|------|
| **App ID** | `cli_a1234567890abcde` | 飞书开放平台 → 应用详情 → 凭证与基础信息 | 应用的唯一标识 |
| **App Secret** | `xxxxxxxxxxxxxxxxxxxxxx` | 飞书开放平台 → 应用详情 → 凭证与基础信息 | 应用密钥，需保密 |

### 你需要配置的参数

| 参数 | 示例 | 配置位置 | 说明 |
|-----|------|---------|------|
| **重定向 URI** | `http://localhost:3002/admin/auth/callback` | `.env.local` | OAuth 授权后的回调地址 |
| **管理员白名单** | `admin@company.com,manager@company.com` | `.env.local` | 允许访问的用户邮箱列表 |
| **Session 密钥** | `base64随机字符串（32+字符）` | `.env.local` | 用于加密 Session Cookie |

### 完整的环境变量配置

```bash
# 飞书登录配置
FEISHU_APP_ID=cli_xxxxxxxxxxxx
FEISHU_APP_SECRET=your_app_secret_here
FEISHU_REDIRECT_URI=http://localhost:3002/admin/auth/callback

# 管理员白名单（用逗号分隔）
ADMIN_WHITELIST=admin@company.com,manager@company.com

# Session 密钥（使用 openssl rand -base64 32 生成）
SESSION_SECRET=your_random_session_secret_at_least_32_chars
```

---

## ⚙️ 2. 配置步骤

### 步骤 1: 飞书开放平台配置（5-10分钟）

#### 1.1 创建应用
1. 访问 [飞书开放平台](https://open.feishu.cn/app)
2. 点击「创建企业自建应用」
3. 填写应用信息：
   - 应用名称: `Board Admin`
   - 应用描述: `协作画布管理后台`
   - 上传应用图标

#### 1.2 获取凭证
在「凭证与基础信息」页面复制：
- **App ID**: `cli_xxxxxxxxxxxx`
- **App Secret**: `xxxxxxxxxxxxxxxx`

#### 1.3 配置重定向 URL
1. 进入「网页」→「网页配置」
2. 点击「添加重定向 URL」
3. 添加：
   - 开发环境: `http://localhost:3002/admin/auth/callback`
   - 生产环境: `https://your-domain.com/admin/auth/callback`

#### 1.4 开启权限
进入「权限管理」→「权限配置」，开启：
- ✅ `contact:user.base:readonly` - 获取用户基本信息
- ✅ `contact:user.email:readonly` - 获取用户邮箱信息

#### 1.5 发布应用
1. 点击「版本管理与发布」
2. 创建版本并提交审核
3. 审核通过后发布
4. 将应用添加到企业工作台

### 步骤 2: 本地环境配置（2分钟）

#### 2.1 配置环境变量

编辑 `apps/demo/.env.local`:

```bash
# 飞书配置
FEISHU_APP_ID=cli_xxxxxxxxxxxx              # 从飞书平台复制
FEISHU_APP_SECRET=your_secret_here          # 从飞书平台复制
FEISHU_REDIRECT_URI=http://localhost:3002/admin/auth/callback

# 管理员白名单（填写你的企业邮箱）
ADMIN_WHITELIST=your_email@company.com

# Session 密钥（运行命令生成）
SESSION_SECRET=$(openssl rand -base64 32)
```

#### 2.2 生成 Session 密钥

```bash
# 方法 1: 使用 OpenSSL
openssl rand -base64 32

# 方法 2: 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 复制生成的密钥到 .env.local
```

### 步骤 3: 安装依赖并启动（1分钟）

```bash
# 进入项目目录
cd apps/demo

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 步骤 4: 测试登录

1. 打开浏览器访问: `http://localhost:3002/admin`
2. 自动跳转到登录页面
3. 点击「使用飞书账号登录」
4. 在飞书授权页面确认授权
5. 成功登录进入管理后台 ✅

---

## 🛠️ 3. 开发实现

### 技术栈

- **Next.js 15**: 应用框架
- **React 18**: UI 框架
- **TypeScript**: 类型安全
- **jose**: JWT 签名和验证
- **飞书 OAuth 2.0**: 企业身份认证

### 核心模块

#### 3.1 飞书 OAuth 工具 (`lib/feishu.ts`)

```typescript
// 生成授权 URL
export function getFeishuAuthUrl(config: FeishuConfig): string

// 获取用户访问令牌
export async function getUserAccessToken(code: string): Promise<FeishuAccessToken>

// 获取用户信息
export async function getFeishuUserInfo(token: string): Promise<FeishuUserInfo>

// 验证白名单
export function isAdminUser(email: string, whitelist: string[]): boolean
```

#### 3.2 Session 管理 (`lib/session.ts`)

```typescript
// 创建 Session（30天有效期）
export async function createSession(data: SessionData): Promise<void>

// 获取 Session
export async function getSession(): Promise<SessionData | null>

// 清除 Session
export async function clearSession(): Promise<void>

// 验证登录
export async function requireAuth(): Promise<SessionData>
```

#### 3.3 API 路由

| 路由 | 方法 | 功能 |
|-----|------|------|
| `/admin/auth/login` | GET | 发起飞书授权 |
| `/admin/auth/callback` | GET | 处理授权回调 |
| `/admin/auth/me` | GET | 获取当前用户 |
| `/admin/auth/logout` | POST/GET | 退出登录 |

#### 3.4 路由保护 (`middleware.ts`)

```typescript
// 保护 /admin 路径
// 未登录 → 重定向到登录页
// 已登录 → 允许访问
export async function middleware(request: NextRequest)
```

### 认证流程

```
1. 用户访问 /admin
   ↓
2. Middleware 检查 Session
   ↓
3. 未登录 → 重定向到 /admin/login
   ↓
4. 点击「使用飞书账号登录」
   ↓
5. 跳转到飞书授权页面
   ↓
6. 用户确认授权
   ↓
7. 飞书回调 /admin/auth/callback?code=xxx
   ↓
8. 使用 code 换取 access_token
   ↓
9. 使用 access_token 获取用户信息
   ↓
10. 验证用户邮箱是否在白名单
    ↓
11. 创建 JWT Session（30天有效期）
    ↓
12. 设置 HTTP-Only Cookie
    ↓
13. 重定向到 /admin
    ↓
14. 显示管理后台 ✅
```

### 安全措施

1. **OAuth 2.0 授权码流程** - 企业级身份验证
2. **白名单机制** - 仅允许授权用户访问
3. **JWT 签名** - 防止 Session 篡改
4. **HTTP-Only Cookie** - 防止 XSS 攻击
5. **Secure Cookie** - 生产环境仅 HTTPS 传输
6. **SameSite=Lax** - 防止 CSRF 攻击
7. **Middleware 保护** - 路由级别访问控制

---

## 🎨 4. 登录 UI 和登录态管理

### 4.1 登录页面 UI

**路径**: `/admin/login`

**设计特点**:
- ✅ 简洁优雅的卡片式设计
- ✅ 渐变背景（slate-50 → blue-50 → slate-100）
- ✅ 品牌 Logo 展示
- ✅ 飞书品牌按钮
- ✅ 错误提示（Alert 组件）
- ✅ 加载状态（Loader 动画）
- ✅ 使用说明提示
- ✅ 响应式布局

**视觉效果**:

```
┌─────────────────────────────────────────────┐
│                                             │
│              ┌─────────┐                    │
│              │    B    │  Logo              │
│              └─────────┘                    │
│                                             │
│            Board Admin                      │
│          协作画布管理后台                    │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ ⚠️ 错误提示（如果有）                  │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  🔐 使用飞书账号登录                   │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ℹ️ 使用企业飞书账号登录，仅限管理员        │
│  ℹ️ 登录状态将保持 30 天                   │
│                                             │
│         © 2024 Board Admin                  │
│                                             │
└─────────────────────────────────────────────┘
```

### 4.2 管理后台用户信息展示

**位置**: 顶部右侧

**展示内容**:
- ✅ 用户头像（圆形）
- ✅ 用户姓名
- ✅ 用户邮箱
- ✅ 退出登录按钮

**视觉效果**:

```
┌──────────────────────────────────────────────────────────────┐
│  Board Admin  │  Dashboard                   👤 张三       ⎋  │
│                                          zhangsan@company.com │
└──────────────────────────────────────────────────────────────┘
```

### 4.3 登录态管理（30天）

#### Session 存储方式

```typescript
// 存储位置: HTTP-Only Cookie
// Cookie 名称: admin_session
// 存储内容: JWT Token

{
  userId: "ou_xxxxx",
  userName: "张三",
  userEmail: "zhangsan@company.com",
  userAvatar: "https://...",
  loginAt: 1707686400000
}
```

#### Session 特性

| 特性 | 配置 | 说明 |
|-----|------|------|
| **有效期** | 30 天 | 登录后 30 天内无需重新登录 |
| **存储方式** | HTTP-Only Cookie | 浏览器无法通过 JS 访问 |
| **安全传输** | Secure (生产环境) | 仅通过 HTTPS 传输 |
| **防 CSRF** | SameSite=Lax | 防止跨站请求伪造 |
| **自动验证** | Middleware | 每次请求自动验证 |
| **过期处理** | 自动跳转登录页 | Session 过期自动重定向 |

#### 登录态持久化

```
场景 1: 关闭浏览器
✅ Cookie 保留
✅ 重新打开浏览器仍然登录
✅ 无需重新授权

场景 2: 30 天内访问
✅ 自动验证 Session
✅ 直接进入管理后台
✅ 用户无感知

场景 3: 超过 30 天
❌ Session 过期
❌ 自动跳转到登录页
❌ 需要重新登录

场景 4: 主动退出
❌ 清除 Cookie
❌ Session 立即失效
❌ 需要重新登录
```

#### 退出登录

**触发方式**:
- 点击顶部「退出」按钮
- 调用 `/admin/auth/logout` API

**执行流程**:
```
1. 用户点击「退出」按钮
   ↓
2. 弹出确认对话框
   ↓
3. 调用 POST /admin/auth/logout
   ↓
4. 服务器清除 Cookie
   ↓
5. 返回成功响应
   ↓
6. 前端跳转到 /admin/login
   ↓
7. 显示登录页面
```

---

## 📚 完整文档清单

### 1. 完整配置指南
**文件**: `_docs/feishu-login-setup.md`
**内容**: 12 章节详细配置说明，包含配置、测试、故障排查

### 2. 快速参考
**文件**: `_docs/feishu-login-quick-ref.md`
**内容**: 5 分钟快速配置，常用命令和检查清单

### 3. 架构设计
**文件**: `_docs/feishu-login-architecture.md`
**内容**: 系统架构图、时序图、数据流图、安全设计

### 4. 实现总结
**文件**: `_docs/feishu-login-implementation-summary.md`
**内容**: 功能清单、技术栈、文件结构、测试清单

### 5. 问题解答（本文档）
**文件**: `_docs/feishu-login-qa.md`
**内容**: 针对你的 4 个问题的详细解答

### 6. 环境变量示例
**文件**: `apps/demo/.env.local.example`
**内容**: 完整的环境变量配置模板

---

## 🎯 功能对照表

| 需求 | 状态 | 实现位置 |
|-----|------|---------|
| **1. 飞书企业登录** | ✅ | `lib/feishu.ts` |
| **2. 获取用户信息** | ✅ | `app/admin/auth/callback/route.ts` |
| **3. 白名单验证** | ✅ | `lib/feishu.ts` |
| **4. 30天登录态** | ✅ | `lib/session.ts` |
| **5. 登录页面UI** | ✅ | `app/admin/login/page.tsx` |
| **6. 用户信息展示** | ✅ | `app/admin/page.tsx` |
| **7. 退出登录** | ✅ | `app/admin/auth/logout/route.ts` |
| **8. 路由保护** | ✅ | `middleware.ts` |
| **9. 错误处理** | ✅ | 所有 API 路由 |
| **10. 安全措施** | ✅ | Cookie + JWT + 白名单 |

---

## 🚀 快速开始

### 最简配置（3步）

```bash
# 1. 配置环境变量
vim apps/demo/.env.local

# 2. 安装依赖
cd apps/demo && pnpm install

# 3. 启动服务
pnpm dev
```

### 访问管理后台

```
http://localhost:3002/admin
```

---

## ✅ 完成状态

所有需求已完成实现！

✅ **问题 1**: 提供了完整的参数清单和获取方式
✅ **问题 2**: 提供了详细的配置步骤（飞书平台 + 本地环境）
✅ **问题 3**: 完整的代码实现，包含认证流程、Session 管理、API 路由
✅ **问题 4**: 优雅的登录 UI 界面 + 30 天登录态管理

---

## 📞 获取帮助

如有问题，请查看:
1. **配置问题**: `_docs/feishu-login-setup.md`
2. **快速参考**: `_docs/feishu-login-quick-ref.md`
3. **架构设计**: `_docs/feishu-login-architecture.md`
4. **实现细节**: `_docs/feishu-login-implementation-summary.md`

---

**祝你使用愉快！** 🎉
