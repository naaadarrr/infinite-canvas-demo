# WebSocket 连接问题修复文档

## 问题描述

用户进入房间时出现以下问题:
1. WebSocket连接错误: `[Collaboration] WebSocket error: {}`
2. 大量"已离开房间"的提示
3. 用户状态混乱,无法正常协作

## 根本原因

### 1. WebSocket错误处理不完善
- `ws.onerror` 只打印了一个空对象,没有详细信息
- 缺少URL、连接状态等关键调试信息
- 没有try-catch保护WebSocket创建过程

### 2. React Hooks循环依赖
- `connect`函数依赖`onMessage`
- PING处理时调用`send`函数
- `send`函数的调用导致hooks依赖链混乱
- 错误堆栈指向错误的位置(updateNodes而非真正的错误位置)

### 3. 连接状态管理混乱
- 断线时立即清空nodes和idMap
- 没有区分"主动离开"和"断线重连"
- knownUsers包含了自己,导致重复提示

### 4. sync_state处理不当
- 总是调用seedCanvas,即使房间已有数据
- knownUsers初始化时包含了当前用户
- 缺少日志,难以调试

## 修复内容

### 1. 改进WebSocket错误处理 (`useCollaboration.ts`)

```typescript
// 添加try-catch包装
try {
  const url = `${wsUrl}/ws/canvas/${canvasId}?token=${token}`;
  console.log('[Collaboration] Connecting to:', url);
  const ws = new WebSocket(url);
  // ...
} catch (error) {
  console.error('[Collaboration] Error creating WebSocket:', error);
}

// 改进错误日志
ws.onerror = (error) => {
  console.error('[Collaboration] WebSocket error:', {
    error,
    url,
    readyState: ws.readyState,
    canvasId,
  });
};

// 改进关闭日志
ws.onclose = (event) => {
  console.log('[Collaboration] Disconnected from canvas:', canvasId, 'code:', event.code, 'reason:', event.reason);
  // ...
};
```

### 2. 修复循环依赖 (`useCollaboration.ts`)

**关键修复**: PING/PONG不再使用send函数

```typescript
case MessageType.PING:
  // 直接使用ws实例,避免循环依赖
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: MessageType.PONG }));
  }
  break;
```

同时在JOIN消息发送时添加保护:

```typescript
ws.onopen = () => {
  console.log('[Collaboration] Connected to canvas:', canvasId);
  setConnected(true);
  
  try {
    ws.send(
      JSON.stringify({
        type: MessageType.JOIN,
        userId,
        userName,
        lastSeq: lastSeqRef.current,
      })
    );
  } catch (error) {
    console.error('[Collaboration] Error sending JOIN message:', error);
  }
};
```

### 3. 改进连接状态管理 (`CollaborativeCanvas.tsx`)

```typescript
useEffect(() => {
  if (!collabEnabled) {
    return;
  }
  // 只在真正从已连接变为断开时才提示
  if (wasConnectedRef.current && !collab.connected) {
    setContextMenu(null);
    // 不要立即清空nodes,等待重连
    // setNodes([]);
    // idMapRef.current.clear();
    knownUsersRef.current.clear();
    pushToast('连接断开,正在重连...', 'error');
  } else if (!wasConnectedRef.current && collab.connected) {
    console.log('[Collaboration] Connected successfully');
  }
  wasConnectedRef.current = collab.connected;
}, [collab.connected, collabEnabled, pushToast]);
```

### 4. 修复sync_state处理 (`CollaborativeCanvas.tsx`)

```typescript
case 'sync_state':
  console.log('[Collaboration] Received sync_state:', {
    nodesCount: message.nodes.length,
    presencesCount: Object.keys(message.presences).length,
  });
  
  if (message.nodes.length > 0) {
    seededRef.current = true;
    setNodes(message.nodes as CanvasNodeData[]);
  } else {
    setNodes([]);
    // 只有在房间为空时才seed
    if (!seededRef.current) {
      seedCanvas();
    }
  }
  
  // 初始化已知用户列表,排除自己
  const otherUsers = Object.keys(message.presences).filter(id => id !== userId);
  knownUsersRef.current = new Set(otherUsers);
  break;
```

## 如何验证修复

### 1. 检查WebSocket服务器

确保WebSocket服务器正在运行:

```bash
cd packages/server
pnpm dev
```

服务器应该在 `ws://127.0.0.1:8787` 运行。

### 2. 配置环境变量(可选)

如果服务器在其他地址,创建 `apps/demo/.env.local`:

```env
NEXT_PUBLIC_WS_BASE=ws://your-server-address:port
NEXT_PUBLIC_USER_TOKEN=your_token
```

### 3. 测试连接

1. 启动demo应用: `cd apps/demo && pnpm dev`
2. 打开浏览器控制台
3. 访问 `http://localhost:3000?canvasId=test`
4. 查看控制台日志:
   - 应该看到 `[Collaboration] Connecting to: ws://...`
   - 应该看到 `[Collaboration] Connected to canvas: test`
   - 应该看到 `[Collaboration] Received sync_state: {...}`

### 4. 测试多用户

1. 在不同浏览器/隐身窗口中打开相同的URL
2. 应该看到其他用户的进入提示
3. 拖动节点,其他用户应该能看到实时更新
4. 不应该看到大量"离开房间"提示

## 常见问题

### 1. WebSocket连接失败

**症状**: 控制台显示 `WebSocket error` 或连接被拒绝

**解决方法**:
- 确保服务器正在运行
- 检查URL是否正确(默认: `ws://127.0.0.1:8787`)
- 检查防火墙设置
- 查看服务器日志是否有错误

### 2. 连接成功但看不到其他用户

**症状**: 连接显示成功,但在线用户列表为空

**解决方法**:
- 检查控制台的 `sync_state` 日志
- 确保其他用户也连接到了同一个 `canvasId`
- 检查服务器的Durable Object是否正常工作

### 3. 节点更新不同步

**症状**: 一个用户的操作另一个用户看不到

**解决方法**:
- 检查控制台是否有 `node_updated` 或 `nodes_updated` 消息
- 确保没有被防火墙/代理拦截WebSocket消息
- 检查服务器日志,确认消息被正确广播

## 技术细节

### WebSocket状态码

修复后的代码会记录关闭代码:
- `1000`: 正常关闭
- `1001`: 端点离开
- `1013`: Try again later (服务器过载)
- `4000`: 自定义错误(房间已满)
- `4002`: 自定义错误(其他业务错误)

### 重连策略

- 默认重连间隔: 3秒
- 在以下情况下不会重连:
  - 房间已满 (code: 4000)
  - 手动关闭
  - `enabled=false`
  - 服务器返回特定错误码

## 后续改进建议

1. **添加心跳检测**: 定期PING服务器,检测连接是否存活
2. **指数退避重连**: 重连失败后逐渐增加重连间隔
3. **连接状态UI**: 显示连接状态指示器
4. **离线消息队列**: 断线时缓存操作,重连后重放
5. **更详细的错误提示**: 根据不同错误类型显示不同提示

## 相关文件

- `packages/widget/src/hooks/useCollaboration.ts` - WebSocket连接和消息处理
- `packages/widget/src/CollaborativeCanvas.tsx` - 协作画布主组件
- `packages/server/src/canvasRoom.ts` - 服务器端Durable Object
- `packages/server/src/index.ts` - WebSocket路由处理
