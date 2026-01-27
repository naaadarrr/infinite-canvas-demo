# 🚀 快速修复指南

## 问题
用户进入房间时出现 WebSocket 连接错误和状态混乱。

## 已修复的问题

✅ WebSocket 错误处理改进 - 添加详细日志  
✅ 修复循环依赖 - PING/PONG 不再依赖 send 函数  
✅ 改进连接状态管理 - 断线时不清空节点  
✅ 修复 sync_state 处理 - 正确初始化用户列表  
✅ 避免重复的进出提示  

## 如何测试修复

### 方法1: 使用测试工具(推荐)

1. 确保 WebSocket 服务器在运行:
```bash
cd packages/server
pnpm dev
```

2. 在浏览器中打开测试工具:
```
open test-websocket.html
```

3. 点击"连接"按钮,查看日志输出

**期望结果:**
- ✅ 显示"WebSocket 连接成功!"
- ✅ 收到 sync_state 消息
- ✅ 自动回复 PING/PONG

### 方法2: 测试实际应用

1. 启动服务器(如果未运行):
```bash
cd packages/server
pnpm dev
```

2. 重新构建 widget:
```bash
cd packages/widget
pnpm build
```

3. 启动 demo 应用:
```bash
cd apps/demo
pnpm dev
```

4. 在浏览器中打开:
```
http://localhost:3000?canvasId=test
```

5. 打开浏览器控制台,应该看到:
```
[Collaboration] Connecting to: ws://127.0.0.1:8787/ws/canvas/test?token=user_xxx
[Collaboration] Connected to canvas: test
[Collaboration] Received sync_state: { nodesCount: 0, presencesCount: 0 }
```

### 方法3: 多用户测试

1. 在第一个浏览器窗口打开:
```
http://localhost:3000?canvasId=multi-test
```

2. 在另一个浏览器(或隐身窗口)打开相同URL

3. 观察:
- ✅ 两个用户都能看到对方
- ✅ 显示"xxx 进入了房间"
- ✅ 拖动节点,另一个用户能实时看到
- ✅ 不会出现大量"离开房间"提示

## 如果还有问题

### WebSocket 连接失败

**检查服务器是否运行:**
```bash
curl http://127.0.0.1:8787
```

应该返回:
```json
{"name":"Infinite Canvas Server","version":"0.0.1","status":"running"}
```

**如果服务器未运行,启动它:**
```bash
cd packages/server
pnpm install  # 如果需要
pnpm dev
```

### 端口冲突

如果 8787 端口被占用:

1. 修改服务器配置 `packages/server/wrangler.toml`:
```toml
[dev]
port = 8788  # 改为其他端口
```

2. 修改客户端配置,创建 `apps/demo/.env.local`:
```env
NEXT_PUBLIC_WS_BASE=ws://127.0.0.1:8788
```

### 查看详细日志

在浏览器控制台中:
```javascript
// 查看所有日志
localStorage.setItem('debug', '*')
```

或只查看协作相关日志:
```javascript
localStorage.setItem('debug', 'Collaboration:*')
```

## 修改内容总结

### packages/widget/src/hooks/useCollaboration.ts
- ✅ 添加 try-catch 保护
- ✅ 改进错误日志输出
- ✅ PING/PONG 直接使用 ws 实例
- ✅ JOIN 消息发送添加错误处理

### packages/widget/src/CollaborativeCanvas.tsx
- ✅ 断线时不清空节点
- ✅ 改进断线提示文案
- ✅ sync_state 排除自己初始化 knownUsers
- ✅ 只在未 seeded 时调用 seedCanvas

## 相关文档

- [详细修复文档](./WEBSOCKET_FIX.md) - 完整的问题分析和修复说明
- [WebSocket 测试工具](./test-websocket.html) - 独立的连接测试页面

## 下一步

如果问题已解决,可以:
1. 删除测试文件 `test-websocket.html`(可选)
2. 提交修改到版本控制
3. 部署更新

如果问题仍然存在,请查看 [WEBSOCKET_FIX.md](./WEBSOCKET_FIX.md) 中的"常见问题"部分。
