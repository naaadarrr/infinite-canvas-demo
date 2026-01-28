# WebSocket 错误导致节点清空问题修复

## 问题描述

**症状**：
- 控制台出现错误：`[Collaboration] WebSocket error: {}`
- 画布中的所有任务节点被清空（tasks 存在但内容为空）
- 用户无法看到任何内容

## 根本原因分析

### 1. WebSocket 连接失败
- 连接到 `wss://infinite-canvas-collab-server.buzzbus.workers.dev` 失败
- 可能的原因：
  - 服务器不可用或宕机
  - 网络问题
  - CORS 或安全策略问题
  - 环境变量配置错误

### 2. sync_state 处理逻辑缺陷

**问题代码** (`CollaborativeCanvas.tsx` 第 625-646 行)：

```typescript
case 'sync_state':
  if (message.nodes.length > 0) {
    seededRef.current = true;
    setNodes(message.nodes as CanvasNodeData[]);
  } else {
    setNodes([]);  // ❌ 危险：直接清空所有节点！
    if (!seededRef.current) {
      seedCanvas();
    }
  }
  break;
```

**问题**：
- 当 WebSocket 连接异常时，服务器可能返回空的 `sync_state`
- 代码逻辑会执行 `setNodes([])`，清空本地所有节点
- 即使本地已经有数据（从 `rawData` prop 解析而来），也会被清空

### 3. WebSocket 错误信息不足
- `ws.onerror` 只打印空对象 `{}`
- 缺少详细的错误信息（message、type、readyState）
- 难以诊断问题原因

## 修复方案

### 1. 改进 sync_state 处理逻辑

**修复后的代码**：

```typescript
case 'sync_state':
  console.log('[Collaboration] Received sync_state:', {
    nodesCount: message.nodes.length,
    presencesCount: Object.keys(message.presences).length,
    currentNodesCount: nodesRef.current.length,
    seeded: seededRef.current,
  });
  
  if (message.nodes.length > 0) {
    seededRef.current = true;
    setNodes(message.nodes as CanvasNodeData[]);
  } else {
    // 如果本地已经有数据,不要清空
    // 只在首次连接且房间为空时才初始化
    if (!seededRef.current && nodesRef.current.length === 0) {
      seedCanvas();
    } else if (!seededRef.current) {
      // 本地有数据但未 seed,保持现有数据不变
      console.log('[Collaboration] Keeping local nodes, not clearing');
    }
    // 不要执行 setNodes([]),这会清空本地数据
  }
  
  // 初始化已知用户列表,排除自己
  const otherUsers = Object.keys(message.presences).filter(id => id !== userId);
  knownUsersRef.current = new Set(otherUsers);
  readyForRawMergeRef.current = true;
  break;
```

**关键改进**：
- ✅ 检查本地是否已有数据 (`nodesRef.current.length`)
- ✅ 只在真正需要初始化时才 seed
- ✅ **永远不会清空已有的本地数据**
- ✅ 添加详细的日志用于调试

### 2. 改进 WebSocket 错误日志

**修复后的代码** (`useCollaboration.ts`)：

```typescript
ws.onerror = (error: Event) => {
  const wsError = error as ErrorEvent;
  console.error('[Collaboration] WebSocket error:', {
    error: wsError,
    message: wsError.message || 'Unknown error',
    type: wsError.type,
    url,
    readyState: ws.readyState,
    readyStateText: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][ws.readyState],
    canvasId,
  });
};
```

**改进**：
- ✅ 提取 ErrorEvent 的详细信息
- ✅ 显示人类可读的 readyState 状态
- ✅ 包含完整的连接上下文

### 3. 保持协作功能开启

**说明**：
- ✅ 协作功能保持开启（`enableCollaboration` 默认为 true）
- ✅ 即使 WebSocket 出错，本地数据也不会被清空
- ✅ rawData 会通过 `seedCanvas()` 正常初始化
- ✅ 后续的 rawData 合并逻辑会继续工作

## 验证修复

### 1. 测试 WebSocket 连接失败场景

```bash
# 1. 启动应用
pnpm dev

# 2. 打开浏览器控制台
# 3. 观察是否出现 WebSocket 错误
# 4. 检查节点是否仍然正常显示
```

**预期结果**：
- ✅ 即使 WebSocket 连接失败，节点仍然正常显示
- ✅ 控制台显示详细的错误信息
- ✅ 控制台显示 "Keeping local nodes, not clearing" 日志

### 2. 测试 WebSocket 正常连接

当服务器可用时：
- ✅ WebSocket 正常连接
- ✅ 多用户协作正常
- ✅ 节点同步正常
- ✅ 控制台显示 "Received sync_state" 日志

### 3. 测试 WebSocket 连接失败但数据正常

当服务器不可用或返回空 sync_state 时：
- ✅ 节点仍然正常显示（从 rawData 创建）
- ✅ 控制台显示 "Keeping local nodes, not clearing" 或调用 seedCanvas
- ✅ 所有本地功能正常（拖拽、缩放、删除等）

## 后续改进建议

### 1. 优雅降级策略
```typescript
// 检测 WebSocket 连接失败后，自动切换到本地模式
const [collabEnabled, setCollabEnabled] = useState(true);

useEffect(() => {
  if (wsError) {
    console.warn('[Collaboration] Falling back to local mode');
    setCollabEnabled(false);
  }
}, [wsError]);
```

### 2. 健康检查
```typescript
// 在连接前检查服务器可用性
async function checkServerHealth(wsUrl: string) {
  try {
    const response = await fetch(wsUrl.replace('ws://', 'http://').replace('wss://', 'https://') + '/health');
    return response.ok;
  } catch {
    return false;
  }
}
```

### 3. 用户提示
```typescript
// 显示友好的错误提示
if (!collabEnabled) {
  return (
    <div className="collab-warning">
      协作功能暂时不可用，已切换到本地模式
    </div>
  );
}
```

### 4. 重试机制改进
```typescript
// 实现指数退避重连
const retryDelays = [1000, 2000, 5000, 10000, 30000];
let retryCount = 0;

function scheduleReconnect() {
  const delay = retryDelays[Math.min(retryCount, retryDelays.length - 1)];
  retryCount++;
  setTimeout(connect, delay);
}
```

## 数据流程说明

### 协作模式下的数据初始化流程

1. **组件挂载**：
   - `CollaborativeCanvas` 接收 `rawData` prop
   - `seedNodes = parseRawData(rawData)` 解析原始数据
   - `collabEnabled = true`（默认）

2. **WebSocket 连接**：
   - `useCollaboration` hook 尝试连接服务器
   - 连接成功后发送 `JOIN` 消息

3. **收到 sync_state**（关键点）：
   
   **场景 A：服务器有数据**
   ```typescript
   if (message.nodes.length > 0) {
     seededRef.current = true;
     setNodes(message.nodes); // 使用服务器数据
   }
   ```
   
   **场景 B：服务器无数据 + 本地无数据**
   ```typescript
   if (!seededRef.current && nodesRef.current.length === 0) {
     seedCanvas(); // 从 seedNodes (rawData) 创建节点
   }
   ```
   
   **场景 C：服务器无数据 + 本地有数据**（修复的关键）
   ```typescript
   else if (!seededRef.current) {
     // 保持现有数据不变
     console.log('[Collaboration] Keeping local nodes, not clearing');
   }
   ```

4. **设置 readyForRawMergeRef**：
   - `readyForRawMergeRef.current = true`
   - 触发 rawData 合并 effect（第 897-999 行）

5. **rawData 增量合并**：
   - 检查 `rawData` 中的新任务
   - 只添加尚未存在的节点
   - 保持现有节点不变

## 相关文件

- ✏️ `packages/widget/src/CollaborativeCanvas.tsx` - sync_state 处理逻辑（第 625-652 行）
- ✏️ `packages/widget/src/hooks/useCollaboration.ts` - WebSocket 错误日志（第 403-410 行）
- ✏️ `src/.../InfiniteLayout/index.tsx` - 使用 CollaborativeCanvas 的业务组件

## 技术细节

### WebSocket 连接状态

| readyState | 名称 | 说明 |
|------------|------|------|
| 0 | CONNECTING | 正在建立连接 |
| 1 | OPEN | 连接已建立 |
| 2 | CLOSING | 连接正在关闭 |
| 3 | CLOSED | 连接已关闭 |

### ErrorEvent 属性

- `message`: 错误描述
- `type`: 事件类型（通常是 "error"）
- `target`: WebSocket 实例

### 防御性编程原则

1. **永远不要信任外部数据**：WebSocket 消息可能异常
2. **保护本地状态**：不要轻易清空用户数据
3. **添加详细日志**：方便问题诊断
4. **优雅降级**：功能不可用时提供备选方案

## 总结

这次修复的核心思想是：
1. **保护用户数据**：永远不要因为网络问题清空本地数据
2. **防御性编程**：假设外部服务可能失败
3. **优雅降级**：提供本地模式作为备选方案
4. **详细日志**：方便快速定位问题

修复后，即使 WebSocket 服务器完全不可用，用户仍然可以正常使用画布的所有本地功能。
