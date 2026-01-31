# 修复缩放抖动问题

**日期**: 2026-01-30  
**问题**: 本地缩放操作会出现抖动和闪烁，节点在缩放过程中会短暂回到旧位置或中间状态

## 问题分析

### 根本原因
通过运行时日志分析发现，问题的核心原因是**服务器回显导致的状态冲突**：

1. **缺少 ownership 过滤机制**: 当本地用户缩放节点时，更新被发送到服务器
2. **服务器广播回传**: 服务器将更新广播给所有客户端（包括发送者自己）
3. **无法识别自己的操作**: `nodes_updated` 消息中没有 `userId` 字段，客户端无法识别这是自己发送的更新
4. **重复应用更新**: 本地状态被服务器回传的数据覆盖，导致视觉抖动

### 日志证据
```json
{
  "message": "Received nodes_updated",
  "data": {
    "updateCount": 1,
    "updates": [{"nodeId": "xxx", "keys": ["size", "position"]}],
    "hasUserId": false  // ⚠️ 关键问题：缺少用户标识
  }
}
```

## 解决方案

### 实现本地操作跟踪机制

在 `CollaborativeCanvas.tsx` 中添加了一个 ref 来跟踪本地正在操作的节点：

```typescript
// 跟踪本地正在操作的节点（用于过滤服务器回显）
const localOperatingNodesRef = useRef<Map<string, number>>(new Map());
```

### 关键修改点

#### 1. 发送更新时标记节点（CollaborativeCanvas.tsx:1203-1220）

```typescript
if (dataUpdates.length > 0) {
  // 标记这些节点正在本地操作中（用于过滤服务器回显）
  const now = Date.now();
  dataUpdates.forEach(update => {
    localOperatingNodesRef.current.set(update.nodeId, now);
  });
  
  collab.updateNodes(dataUpdates);
  
  // 500ms 后清除标记（足够时间接收服务器回显）
  setTimeout(() => {
    dataUpdates.forEach(update => {
      const timestamp = localOperatingNodesRef.current.get(update.nodeId);
      if (timestamp === now) {
        localOperatingNodesRef.current.delete(update.nodeId);
      }
    });
  }, 500);
}
```

#### 2. 过滤服务器回显（CollaborativeCanvas.tsx:742-750）

```typescript
case 'nodes_updated':
  // 过滤掉本地正在操作的节点的更新（防止回显造成抖动）
  const filteredUpdates = message.updates.filter(update => {
    // 如果节点正在本地操作中，跳过服务器的更新
    const isLocallyOperating = localOperatingNodesRef.current.has(update.nodeId);
    return !isLocallyOperating;
  });
  
  if (filteredUpdates.length === 0) {
    break;
  }
  // ... 继续处理过滤后的更新
```

#### 3. 拖动操作也应用相同机制（CollaborativeCanvas.tsx:1226-1240 & 1277-1296）

拖动开始时标记节点：
```typescript
const handleNodeDragStart = useCallback(
  (nodeId: string, position: { x: number; y: number }) => {
    draggingNodesRef.current.add(nodeId);
    const mappedId = idMapRef.current.get(nodeId) ?? nodeId;
    
    // 标记节点正在本地操作中
    localOperatingNodesRef.current.set(mappedId, Date.now());
    
    collab.dragStart(mappedId, position);
  },
  [collab]
);
```

拖动结束时延迟清除标记：
```typescript
const handleNodeDragEnd = useCallback(
  (nodeId: string, position: { x: number; y: number }) => {
    // ... 拖动结束逻辑
    
    draggingNodeIds.forEach((id) => {
      const mappedId = idMapRef.current.get(id) ?? id;
      const node = nodesRef.current.find((n) => n.id === id);
      if (node) {
        collab.dragEnd(mappedId, node.position);
        
        // 延迟清除操作标记
        const timestamp = Date.now();
        localOperatingNodesRef.current.set(mappedId, timestamp);
        setTimeout(() => {
          const currentTimestamp = localOperatingNodesRef.current.get(mappedId);
          if (currentTimestamp === timestamp) {
            localOperatingNodesRef.current.delete(mappedId);
          }
        }, 500);
      }
    });
  },
  [collab]
);
```

## 技术细节

### 为什么使用时间戳
使用时间戳而不是简单的布尔值，可以确保：
- 同一个节点的多次连续操作不会互相干扰
- 延迟清除机制可以正确识别应该清除哪个操作的标记

### 为什么是 500ms
- WebSocket 通信通常在 50-200ms 内完成
- 500ms 提供了足够的缓冲时间来接收服务器回显
- 不会影响用户体验（用户感知不到这个延迟）

### 替代方案对比

| 方案 | 优点 | 缺点 | 是否采用 |
|------|------|------|---------|
| 服务器添加 userId | 最彻底的解决 | 需要修改服务器代码 | ❌ 未采用 |
| 本地操作标记 | 客户端完全控制 | 需要时间窗口管理 | ✅ 已采用 |
| 比较更新内容 | 无需额外状态 | 可能误判相同值 | ❌ 不可靠 |

## 效果验证

修复后的行为：
1. ✅ 本地缩放操作流畅，无抖动
2. ✅ 其他用户的缩放操作仍然正常同步
3. ✅ 拖动操作也应用了相同的防抖机制
4. ✅ 不影响其他协作功能（光标、选择等）

## 相关文件

- `packages/widget/src/CollaborativeCanvas.tsx` - 主要修改
- `packages/widget/src/hooks/useCollaboration.ts` - 无需修改
- `packages/server/src/canvasRoom.ts` - 未修改（服务器端）

## 注意事项

1. 如果将来服务器在 `nodes_updated` 消息中添加了 `userId` 字段，可以进一步优化为基于 userId 的过滤
2. 500ms 的时间窗口可以根据实际网络延迟情况调整
3. 这个机制也适用于其他类型的节点操作（移动、删除等）
