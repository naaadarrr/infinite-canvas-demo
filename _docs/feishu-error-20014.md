# 飞书错误码 20014 解决方案

## ❌ 错误信息

```
飞书 API 返回错误: {
  code: 20014,
  msg: undefined,
  error: undefined,
  error_description: undefined
}
```

## 🔍 错误原因

**错误码 20014** 表示：**授权码（code）已过期或已使用**

### 为什么会出现这个错误？

1. **授权码只能使用一次** ⚠️
   - 飞书返回的 `code` 只能使用一次
   - 如果页面刷新或重复请求，会导致 code 被重复使用

2. **授权码有效期很短**
   - 通常只有几分钟有效期
   - 如果授权后等待太久才回调，code 会过期

3. **浏览器自动重试**
   - 浏览器可能会自动重试失败的请求
   - 导致同一个 code 被使用多次

## ✅ 解决方案

### 方案 1: 清除浏览器缓存并重新授权（最简单）

```bash
# 1. 清除浏览器缓存
- 打开浏览器开发者工具
- Application → Clear storage → Clear site data

# 2. 或使用无痕模式
- Chrome: Ctrl+Shift+N (Windows) / Cmd+Shift+N (Mac)
- 在无痕窗口中访问 http://localhost:3002/admin

# 3. 重新登录
- 点击「使用飞书账号登录」
- 完成授权
- 应该能成功登录 ✅
```

### 方案 2: 避免重复请求

检查是否有以下情况导致重复请求：

1. **React Strict Mode**
   - 开发环境下 React 会执行两次渲染
   - 可能导致 API 被调用两次

2. **浏览器自动刷新**
   - 检查是否有自动刷新插件
   - 检查是否有热重载导致重复请求

3. **网络问题**
   - 网络延迟可能导致浏览器重试
   - 确保网络连接稳定

### 方案 3: 添加防重复请求机制

我已经在代码中添加了详细的日志，现在可以看到：

```typescript
// 请求日志
🔐 请求飞书 access_token: {
  url: '...',
  client_id: 'cli_xxx',
  code_length: 32,
  code_preview: '8wAjKbbAB4...'
}

// 响应日志
📥 飞书 API 响应: {
  status: 200,
  code: 20014,
  has_data: false,
  full_response: {...}
}

// 错误日志
❌ 飞书 API 返回错误: {
  code: 20014,
  message: '授权码已过期或已使用（code 只能使用一次）',
  ...
}
```

## 🧪 测试步骤

### 1. 完全清除状态

```bash
# 停止服务
Ctrl+C

# 清除浏览器所有数据
- 打开开发者工具
- Application → Storage → Clear site data

# 重启服务
pnpm dev
```

### 2. 使用无痕模式测试

```bash
# 1. 打开无痕窗口
Chrome: Ctrl+Shift+N (Windows) / Cmd+Shift+N (Mac)

# 2. 访问
http://localhost:3002/admin

# 3. 观察日志
- 查看控制台输出
- 确认只有一次 API 请求
```

### 3. 检查日志

现在日志会显示：

```
🔐 请求飞书 access_token: { ... }
📥 飞书 API 响应: { ... }
```

**如果看到多次相同的 code**，说明有重复请求问题。

## 🔧 高级调试

### 检查是否有重复请求

在浏览器开发者工具中：

1. **Network 面板**
   ```
   - 打开 Network 面板
   - 访问 /admin/auth/callback
   - 查看是否有多个相同的请求
   - 检查请求的 Initiator（发起者）
   ```

2. **Console 面板**
   ```
   - 查看是否有多个 "🔐 请求飞书 access_token" 日志
   - 如果有多个，说明 callback 被调用了多次
   ```

### 添加请求去重

如果确认有重复请求问题，可以添加去重逻辑：

```typescript
// 在 callback/route.ts 中添加
const processedCodes = new Set<string>();

export async function GET(request: NextRequest) {
  const code = searchParams.get('code');
  
  // 检查 code 是否已处理
  if (processedCodes.has(code)) {
    console.log('⚠️ Code 已处理，跳过重复请求');
    return NextResponse.redirect(new URL('/admin', request.url));
  }
  
  // 标记为已处理
  processedCodes.add(code);
  
  // ... 继续处理
}
```

## 📋 常见场景

### 场景 1: 页面刷新

```
用户授权后 → 回调到 /admin/auth/callback → 用户刷新页面
❌ 问题: code 被重复使用
✅ 解决: 回调成功后立即重定向到 /admin
```

### 场景 2: 开发环境热重载

```
授权回调 → 代码修改 → 热重载 → 重新执行回调
❌ 问题: code 被重复使用
✅ 解决: 使用无痕模式测试，或暂时禁用热重载
```

### 场景 3: React Strict Mode

```
开发环境 → React Strict Mode → 组件渲染两次 → API 调用两次
❌ 问题: code 被重复使用
✅ 解决: API 路由不受 Strict Mode 影响，应该不是这个原因
```

## 🎯 推荐操作流程

### 正确的测试流程

```bash
1. 清除浏览器缓存
   ↓
2. 访问 /admin
   ↓
3. 点击登录按钮（只点一次）
   ↓
4. 在飞书页面授权（只授权一次）
   ↓
5. 等待自动跳转（不要刷新）
   ↓
6. 成功进入管理后台 ✅
```

### 错误的操作

```bash
❌ 授权后刷新页面
❌ 点击浏览器后退按钮
❌ 重复点击登录按钮
❌ 在授权页面停留太久
❌ 网络不稳定时重试
```

## 🔍 如何确认问题已解决

成功登录的日志应该是：

```
🔐 请求飞书 access_token: { ... }
📥 飞书 API 响应: { status: 200, code: 0, has_data: true }
✅ 成功获取 access_token
Admin logged in: 张三 (zhangsan@company.com)
```

## 📞 仍然失败？

如果按照以上步骤仍然出现 20014 错误：

1. **检查飞书应用配置**
   ```
   - 确认 App ID 和 App Secret 正确
   - 确认重定向 URL 完全匹配
   - 确认应用已发布
   ```

2. **检查网络环境**
   ```
   - 确保能访问 open.feishu.cn
   - 检查是否有代理或防火墙
   - 尝试使用其他网络
   ```

3. **查看完整日志**
   ```bash
   # 现在日志会显示完整的请求和响应
   # 包括 code 的长度和预览
   # 可以帮助诊断问题
   ```

4. **联系飞书技术支持**
   ```
   如果确认配置正确但仍然失败
   可以联系飞书开放平台技术支持
   提供错误日志和应用配置信息
   ```

## 💡 预防措施

1. **回调后立即重定向**
   - 避免用户停留在回调页面
   - 防止刷新导致 code 重复使用

2. **添加加载状态**
   - 显示"登录中..."提示
   - 防止用户重复操作

3. **错误处理**
   - 遇到 20014 错误时，引导用户重新登录
   - 不要自动重试，因为 code 已失效

---

**更新时间**: 2026-02-11
**错误码**: 20014
**状态**: 已添加详细日志和错误说明
