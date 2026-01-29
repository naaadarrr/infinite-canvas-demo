# 管理面板快速启动指南

## 🚀 本地开发环境

### 1. 配置环境变量

在 `apps/demo/.env.local` 中添加:

```bash
NEXT_PUBLIC_API_BASE=http://localhost:8787
NEXT_PUBLIC_WS_BASE=ws://localhost:8787
NEXT_PUBLIC_USER_TOKEN=user_admin
```

**重要**: Token 必须以 `user_` 开头,例如:
- `user_admin` - 管理员用户
- `user_123` - 普通用户
- `user_test` - 测试用户

### 2. 启动服务

#### 启动后端服务 (Cloudflare Worker)

```bash
cd packages/server
wrangler dev --port 8787
```

#### 启动前端应用

```bash
cd apps/demo
npm run dev
# 或
pnpm dev
```

### 3. 访问管理面板

打开浏览器访问: http://localhost:3000/admin

如果端口不同,请根据实际情况调整。

---

## 🌐 生产环境

### 1. 配置环境变量

在 `apps/demo/.env.production` 中:

```bash
NEXT_PUBLIC_API_BASE=https://your-worker.workers.dev
NEXT_PUBLIC_WS_BASE=wss://your-worker.workers.dev
NEXT_PUBLIC_USER_TOKEN=user_your_admin_token
```

**安全建议**:
- 使用强随机 token,例如: `user_admin_a1b2c3d4e5f6`
- 不要在代码中硬编码 token
- 生产环境应实现真正的管理员权限检查

### 2. 部署

```bash
# 部署后端
cd packages/server
wrangler deploy

# 部署前端
cd apps/demo
npm run build
# 根据你的部署平台部署
```

---

## 🔐 认证说明

### Token 格式

当前使用简单的 token 认证(MVP 阶段):

- **格式**: `user_{userId}`
- **示例**: `user_admin`, `user_123`, `user_test`
- **验证**: 只要以 `user_` 开头即可通过认证

### API 调用示例

```bash
# 获取房间列表
curl -X GET \
  "http://localhost:8787/admin/rooms" \
  -H "Authorization: Bearer user_admin"

# 获取房间状态
curl -X GET \
  "http://localhost:8787/admin/rooms/canvas_xxx" \
  -H "Authorization: Bearer user_admin"

# 踢出用户
curl -X POST \
  "http://localhost:8787/admin/rooms/canvas_xxx/kick" \
  -H "Authorization: Bearer user_admin" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_123"}'

# 关闭房间
curl -X POST \
  "http://localhost:8787/admin/rooms/canvas_xxx/shutdown" \
  -H "Authorization: Bearer user_admin"
```

---

## ⚠️ 常见问题

### 问题1: "Unauthorized" 错误

**原因**: Token 未配置或格式错误

**解决方案**:
1. 检查 `.env.local` 中是否有 `NEXT_PUBLIC_USER_TOKEN`
2. 确认 token 以 `user_` 开头
3. 重启前端开发服务器(环境变量修改后需要重启)

```bash
# 停止当前服务 (Ctrl+C)
# 重新启动
npm run dev
```

### 问题2: "Failed to fetch rooms" 错误

**原因**: 后端服务未启动或地址错误

**解决方案**:
1. 确认后端服务正在运行: `wrangler dev --port 8787`
2. 检查 `NEXT_PUBLIC_API_BASE` 配置是否正确
3. 检查浏览器控制台的网络请求

### 问题3: 管理面板显示空白

**原因**: 数据库中没有画布记录

**解决方案**:
1. 先访问主应用创建一些画布
2. 刷新管理面板
3. 或者直接通过 API 创建测试数据

---

## 🔧 开发调试

### 查看网络请求

打开浏览器开发者工具 (F12) > Network 标签:
- 查看 API 请求是否成功
- 检查请求头中的 Authorization
- 查看响应内容

### 查看控制台日志

打开浏览器开发者工具 (F12) > Console 标签:
- 查看是否有 JavaScript 错误
- 查看网络请求失败的详细信息

### 后端日志

在运行 `wrangler dev` 的终端中:
- 查看 API 请求日志
- 查看认证失败的原因
- 查看 DO 状态变化

---

## 🚀 快速测试流程

1. **启动后端**:
   ```bash
   cd packages/server
   wrangler dev --port 8787
   ```

2. **启动前端**:
   ```bash
   cd apps/demo
   npm run dev
   ```

3. **创建测试画布**:
   - 访问 http://localhost:3000
   - 创建一个新画布
   - 添加一些节点

4. **访问管理面板**:
   - 访问 http://localhost:3000/admin
   - 应该能看到刚创建的画布
   - 点击查看详细状态

5. **测试管理功能**:
   - 查看房间状态
   - 测试刷新功能
   - 测试关闭房间(可选)

---

## 📚 相关文档

- [DO 优化配置文档](./DO_Optimization_Configuration.md)
- [DO 优化测试指南](./DO_Optimization_Testing_Guide.md)
- [DO 优化实施报告](./DO_Optimization_Report.md)

---

## 🔒 安全提示

### 开发环境
- 可以使用简单的 token: `user_admin`
- 不需要特别复杂的认证

### 生产环境
- **必须**使用强随机 token
- **必须**实现真正的管理员权限检查
- **建议**使用 JWT 或 OAuth
- **建议**添加操作审计日志
- **建议**限制管理 API 的访问来源

### 改进建议

在 `packages/server/src/admin.ts` 中实现真正的权限检查:

```typescript
async function verifyAdminToken(request: Request, env: Env): Promise<{ success: boolean; error?: string }> {
  const token = extractToken(request);
  const auth = await verifyToken(token, env);
  
  if (!auth.success) {
    return { success: false, error: auth.error || 'Unauthorized' };
  }
  
  // TODO: 检查用户是否有管理员权限
  // 例如: 从数据库查询用户角色
  const isAdmin = await checkIsAdmin(auth.userId, env.DB);
  if (!isAdmin) {
    return { success: false, error: 'Admin access required' };
  }
  
  return { success: true };
}

async function checkIsAdmin(userId: string, db: D1Database): Promise<boolean> {
  const result = await db
    .prepare('SELECT role FROM users WHERE id = ?')
    .bind(userId)
    .first<{ role: string }>();
  
  return result?.role === 'admin';
}
```

---

**祝使用愉快!** 🎉
