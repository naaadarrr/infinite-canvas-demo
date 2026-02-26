# 在线用户列表不实时更新问题分析 - 最终结论

## 问题描述

管理员（admin）进入房间后，在线列表只显示之前的两个用户，不显示管理员自己。而且当后续有新用户进入时，在线列表和人数都不会自动刷新。

## 问题复现

1. 用户A和用户B已经在房间内
2. 管理员进入房间
3. 现象：
   - 管理员能看到用户A和用户B（通过 SYNC_STATE 消息）
   - 但用户A和用户B看不到管理员
   - 在线人数显示仍然是2人，没有变成3人

## 技术分析

### 1. 服务端消息流程 ✅

**代码位置：**`packages/server/src/canvasRoom.ts:506-592`

当新用户加入时，服务端的处理：

```typescript:506:592:packages/server/src/canvasRoom.ts
private async handleJoin(ws: WebSocket, message: JoinMessage): Promise<void> {
  // 1. 注册连接
  this.connections.set(ws, { userId, userName, ... });
  
  // 2. 添加到 presences (只有非隐形用户)
  if (!invisible) {
    this.presences.set(userId, { userId, userName, ... });
  }

  // 3. 发送 SYNC_STATE 给新用户 (只有新用户收到)
  this.send(ws, syncMessage);

  // 4. 广播 PRESENCE_UPDATE 给其他用户
  if (!invisible) {
    this.broadcastPresenceUpdate(userId, this.presences.get(userId)!);
  }
}
```

**消息流程：**
- 新用户收到：`SYNC_STATE`（包含所有在线用户）
- 其他用户收到：`PRESENCE_UPDATE`（新用户的信息）

**结论：** 服务端逻辑正确，消息都已正确发送。

### 2. 客户端 Hook 处理 ✅

**代码位置：**`packages/widget/src/hooks/useCollaboration.ts:421-431`

```typescript:421:431:packages/widget/src/hooks/useCollaboration.ts
case MessageType.PRESENCE_UPDATE:
  setPresences((prev) => {
    const next = new Map(prev);
    if (message.presence) {
      next.set(message.userId, message.presence);
    } else {
      next.delete(message.userId);
    }
    return next;
  });
  break;
```

**结论：** Hook 正确处理 `PRESENCE_UPDATE` 消息，`presences` 状态会正确更新。

### 3. UI 组件渲染 ❌

**代码位置：**`packages/widget/src/CollaborativeCanvas.tsx:1859-1931`

```typescript:1859:1931:packages/widget/src/CollaborativeCanvas.tsx
{/* <header style={{...}}>
  ...
  <div style={{...}}>
    <div>在线用户 ({collab.presences.size})</div>
    <div>
      {Array.from(collab.presences.entries()).map(([id, presence]) => (
        <div key={id}>
          {presence.userName || id}
          {id === userId ? ' (你)' : ''}
        </div>
      ))}
    </div>
  </div>
</header> */}
```

**问题所在：** 在线用户列表的 UI 已经被注释掉了！

### 4. 管理后台显示问题 ❓

你截图中看到的在线用户列表，应该是**管理后台的 UI**，而不是 `CollaborativeCanvas` 组件内部的 UI。

**可能的情况：**

1. **管理后台通过 iframe 嵌入画布**
   - 管理后台无法直接访问 iframe 内部的 `collab.presences` 状态
   - 需要通过消息通信（如 `postMessage`）来同步在线用户列表

2. **管理后台通过 WebSocket 独立连接**
   - 管理后台自己连接 WebSocket 获取房间状态
   - 可能没有正确监听 `PRESENCE_UPDATE` 消息
   - 或者只在初次加载时获取了用户列表，后续没有更新

3. **管理后台通过轮询 HTTP API**
   - 使用 `/status` API 定期获取房间状态
   - 轮询间隔可能太长，导致更新不及时

## 根本原因

**问题不在 `CollaborativeCanvas` 组件本身**，而在于：

1. 截图中的在线用户列表是**管理后台的 UI**
2. 管理后台的在线列表**没有实时更新机制**
3. 需要检查管理后台如何获取和更新在线用户信息

## 解决方案

### 方案一：管理后台通过 iframe 通信

如果管理后台是通过 iframe 嵌入画布的：

```typescript
// 在 CollaborativeCanvas.tsx 中添加
useEffect(() => {
  // 向父窗口发送 presences 更新
  window.parent.postMessage({
    type: 'PRESENCES_UPDATE',
    presences: Array.from(collab.presences.entries()).map(([id, presence]) => ({
      userId: id,
      userName: presence.userName,
    })),
  }, '*');
}, [collab.presences]);

// 在管理后台中监听
window.addEventListener('message', (event) => {
  if (event.data.type === 'PRESENCES_UPDATE') {
    setOnlineUsers(event.data.presences);
  }
});
```

### 方案二：管理后台独立 WebSocket 连接

如果管理后台自己连接 WebSocket：

1. 确保管理后台正确处理 `PRESENCE_UPDATE` 消息
2. 检查消息处理函数是否更新 UI 状态

### 方案三：使用 HTTP 轮询

如果使用 `/status` API：

```typescript
// 减少轮询间隔，增加实时性
setInterval(async () => {
  const response = await fetch(`/rooms/${canvasId}/status`);
  const status = await response.json();
  setOnlineUsers(status.connections);
}, 3000); // 每3秒更新一次
```

## 需要进一步检查

1. **确认管理后台的实现方式**
   - 是否通过 iframe 嵌入
   - 如何获取在线用户信息
   - 是否有实时更新机制

2. **检查管理后台代码**
   - 在线用户列表的渲染逻辑
   - WebSocket 消息处理
   - 或 HTTP API 调用

3. **调试步骤**
   - 在浏览器开发者工具中查看 WebSocket 消息
   - 确认 `PRESENCE_UPDATE` 消息是否被发送和接收
   - 检查管理后台的状态更新日志

## 状态

- [x] 问题分析完成
- [x] 服务端代码检查 ✅
- [x] 客户端 Hook 检查 ✅
- [x] UI 组件检查 ✅
- [ ] 管理后台代码检查
- [ ] 修复方案实施
- [ ] 测试验证
