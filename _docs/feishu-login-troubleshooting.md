# 飞书登录故障排查指南

## 🐛 常见错误及解决方案

### 错误 1: "获取用户访问令牌失败: undefined"

**错误信息**:
```
Feishu auth callback error: Error: 获取用户访问令牌失败: undefined
```

**原因**:
1. ❌ **缺少 scope 参数**（最常见）
2. ❌ App ID 或 App Secret 配置错误
3. ❌ 授权码已过期或已使用
4. ❌ redirect_uri 不匹配

**解决方案**:

#### 1. 检查 scope 参数（已修复）

授权 URL 必须包含 `scope` 参数：

```typescript
// ✅ 正确 - 包含 scope
const params = new URLSearchParams({
  app_id: config.appId,
  redirect_uri: config.redirectUri,
  state: state,
  scope: 'contact:user.base:readonly contact:user.email:readonly', // 必需！
});

// ❌ 错误 - 缺少 scope
const params = new URLSearchParams({
  app_id: config.appId,
  redirect_uri: config.redirectUri,
  state: state,
  // 缺少 scope 参数
});
```

**scope 说明**:
- `contact:user.base:readonly` - 获取用户基本信息（姓名、头像等）
- `contact:user.email:readonly` - 获取用户邮箱（用于白名单验证）

#### 2. 验证飞书应用配置

在飞书开放平台检查：

1. **权限配置**
   - 进入「权限管理」→「权限配置」
   - 确保开启了以下权限：
     - ✅ `contact:user.base:readonly`
     - ✅ `contact:user.email:readonly`

2. **重定向 URL**
   - 进入「网页」→「网页配置」
   - 确保添加了正确的回调地址
   - 必须完全匹配（包括协议、域名、端口、路径）

3. **应用状态**
   - 确保应用已发布
   - 确保应用已添加到企业工作台

#### 3. 检查环境变量

```bash
# 检查 .env.local
cat apps/demo/.env.local

# 必须包含以下配置
FEISHU_APP_ID=cli_xxxxxxxxxxxx
FEISHU_APP_SECRET=your_secret_here
FEISHU_REDIRECT_URI=http://localhost:3002/admin/auth/callback
```

#### 4. 查看详细错误日志

现在代码已添加详细的错误日志，重新测试后查看控制台：

```bash
# 启动开发服务器
pnpm dev

# 查看日志输出
# 会显示飞书 API 返回的详细错误信息
```

---

### 错误 2: "redirect_uri_mismatch"

**错误信息**:
```
redirect_uri_mismatch
```

**原因**:
回调 URL 与飞书平台配置不一致

**解决方案**:

1. **检查 .env.local 配置**
   ```bash
   # 开发环境
   FEISHU_REDIRECT_URI=http://localhost:3002/admin/auth/callback
   
   # 生产环境
   FEISHU_REDIRECT_URI=https://your-domain.com/admin/auth/callback
   ```

2. **检查飞书平台配置**
   - 进入「网页」→「网页配置」
   - 确保添加了相同的 URL
   - 注意：必须完全一致，包括：
     - 协议（http/https）
     - 域名
     - 端口（如果有）
     - 路径

3. **常见错误**:
   ```
   ❌ http://localhost:3002/admin/auth/callback  (配置)
   ✅ http://localhost:3002/admin/auth/callback/ (实际)
   
   ❌ https://domain.com/admin/auth/callback     (配置)
   ✅ http://domain.com/admin/auth/callback      (实际)
   ```

---

### 错误 3: "您没有权限访问管理后台"

**错误信息**:
登录页面显示「您没有权限访问管理后台」

**原因**:
当前用户邮箱不在白名单中

**解决方案**:

1. **检查用户邮箱**
   - 确认飞书账号绑定的企业邮箱
   - 在飞书客户端查看个人资料

2. **更新白名单**
   ```bash
   # 编辑 .env.local
   ADMIN_WHITELIST=user1@company.com,user2@company.com,user3@company.com
   ```

3. **重启服务**
   ```bash
   # Ctrl+C 停止服务
   pnpm dev
   ```

4. **验证权限**
   - 确保飞书应用开启了 `contact:user.email:readonly` 权限
   - 用户必须有企业邮箱

---

### 错误 4: Session 验证失败，频繁退出

**错误信息**:
登录后立即退出，或刷新页面后退出

**原因**:
1. SESSION_SECRET 未配置或配置错误
2. Cookie 被浏览器阻止
3. 开发环境使用了 127.0.0.1 而非 localhost

**解决方案**:

1. **检查 SESSION_SECRET**
   ```bash
   # 生成新的密钥
   openssl rand -base64 32
   
   # 更新 .env.local
   SESSION_SECRET=生成的密钥
   ```

2. **使用 localhost**
   ```bash
   # ✅ 正确
   http://localhost:3002/admin
   
   # ❌ 错误（可能导致 Cookie 问题）
   http://127.0.0.1:3002/admin
   ```

3. **检查浏览器 Cookie 设置**
   - 打开浏览器开发者工具
   - Application → Cookies
   - 查看是否有 `admin_session` Cookie
   - 检查 Cookie 属性（HttpOnly、SameSite 等）

4. **清除浏览器缓存**
   - 清除 Cookie
   - 清除本地存储
   - 重新登录

---

### 错误 5: "飞书登录配置不完整"

**错误信息**:
登录页面显示「飞书登录配置不完整，请检查环境变量」

**原因**:
缺少必要的环境变量

**解决方案**:

1. **检查所有必需的环境变量**
   ```bash
   # .env.local 必须包含
   FEISHU_APP_ID=cli_xxxxxxxxxxxx
   FEISHU_APP_SECRET=your_secret_here
   FEISHU_REDIRECT_URI=http://localhost:3002/admin/auth/callback
   ADMIN_WHITELIST=your_email@company.com
   SESSION_SECRET=your_random_secret
   ```

2. **验证配置**
   ```bash
   # 检查环境变量是否正确加载
   cat apps/demo/.env.local
   ```

3. **重启服务**
   ```bash
   # Ctrl+C 停止服务
   pnpm dev
   ```

---

## 🔍 调试技巧

### 1. 查看完整的错误信息

现在代码已添加详细的错误日志，查看控制台输出：

```bash
# 启动开发服务器
pnpm dev

# 尝试登录，查看日志
# 会显示飞书 API 返回的详细错误
```

### 2. 检查网络请求

使用浏览器开发者工具：

1. 打开 Network 面板
2. 尝试登录
3. 查看请求详情：
   - 请求 URL
   - 请求参数
   - 响应内容

### 3. 验证飞书 API

使用 curl 测试飞书 API：

```bash
# 测试获取 tenant_access_token
curl -X POST \
  'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal' \
  -H 'Content-Type: application/json' \
  -d '{
    "app_id": "your_app_id",
    "app_secret": "your_app_secret"
  }'
```

### 4. 检查飞书应用状态

在飞书开放平台：

1. 查看应用状态（是否已发布）
2. 查看权限配置（是否已开启）
3. 查看重定向 URL（是否正确配置）
4. 查看应用日志（如果有错误）

---

## 📋 完整的检查清单

### 飞书平台配置

- [ ] 应用已创建
- [ ] 获取了 App ID 和 App Secret
- [ ] 配置了重定向 URL
- [ ] 开启了 `contact:user.base:readonly` 权限
- [ ] 开启了 `contact:user.email:readonly` 权限
- [ ] 应用已发布
- [ ] 应用已添加到企业工作台

### 本地环境配置

- [ ] `.env.local` 文件存在
- [ ] `FEISHU_APP_ID` 已配置
- [ ] `FEISHU_APP_SECRET` 已配置
- [ ] `FEISHU_REDIRECT_URI` 已配置且正确
- [ ] `ADMIN_WHITELIST` 已配置且包含测试用户邮箱
- [ ] `SESSION_SECRET` 已配置（至少 32 个字符）
- [ ] 依赖已安装（`pnpm install`）
- [ ] 服务已重启

### 代码检查

- [ ] `lib/feishu.ts` 中包含 `scope` 参数
- [ ] 授权 URL 格式正确
- [ ] API 调用参数正确
- [ ] 错误处理完善

### 测试验证

- [ ] 访问 `/admin` 自动跳转到登录页
- [ ] 点击登录按钮跳转到飞书授权页
- [ ] 授权页面显示正确的应用信息
- [ ] 授权后成功回调
- [ ] 成功获取用户信息
- [ ] 白名单验证通过
- [ ] 成功进入管理后台

---

## 🆘 仍然无法解决？

如果按照以上步骤仍然无法解决问题，请：

1. **收集以下信息**:
   - 完整的错误日志
   - 浏览器控制台错误
   - 网络请求详情
   - 飞书应用配置截图

2. **检查飞书官方文档**:
   - [飞书开放平台文档](https://open.feishu.cn/document/)
   - [网页应用登录](https://open.feishu.cn/document/common-capabilities/sso/web-application-sso/web-app-overview)

3. **常见问题**:
   - 确保使用的是企业自建应用，不是商店应用
   - 确保应用已发布到企业
   - 确保用户在企业通讯录中
   - 确保用户有企业邮箱

---

## 🎯 快速修复步骤（针对 scope 问题）

如果你遇到的是 "获取用户访问令牌失败: undefined" 错误：

1. **确认代码已更新**
   ```bash
   # 查看 lib/feishu.ts 第 37 行
   # 应该包含 scope 参数
   ```

2. **重启服务**
   ```bash
   # Ctrl+C 停止服务
   pnpm dev
   ```

3. **清除浏览器缓存**
   - 清除 Cookie
   - 清除本地存储

4. **重新测试**
   - 访问 `http://localhost:3002/admin`
   - 点击登录
   - 完成授权

5. **查看日志**
   - 如果仍有错误，查看控制台详细错误信息
   - 现在会显示飞书 API 返回的完整错误

---

**更新时间**: 2026-02-11
**状态**: ✅ scope 问题已修复
