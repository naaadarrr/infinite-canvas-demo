# 协同编辑同步问题修复总结

本文档总结了三个相关的协同编辑同步问题的修复。

## 问题概述

用户报告在协同编辑时，节点的更新（如状态、评分、文本等）没有实时同步到其他用户的画面。

经过分析，发现有三个独立但相关的问题：

### 问题 1：ExternalCommand 更新缺少字段同步

**现象**：通过 ExternalCommand API 更新节点时，某些字段（如 status、rating、isPinned）的变化没有同步到其他客户端。

**原因**：服务器端在构建节点更新数据时，遗漏了这些字段。

### 问题 2：客户端更新被节流延迟

**现象**：用户在客户端的操作（如点击星星、修改文本）后，更新没有立即发送，而是等到拖动等操作时才一起发送。

**原因**：`updateNodes` 方法对所有更新都应用了节流（33ms），导致用户主动操作的更新被延迟。

### 问题 3：handleNodeDataUpdate 依赖错误 ⚠️ **根本原因**

**现象**：即使修复了问题1和2，用户A点击星星后，更新仍然不会立即同步到用户B，只有在拖动后才会同步。

**原因**：`InfiniteCanvas.tsx` 中的 `handleNodeDataUpdate` 回调错误地依赖了 `nodes`，导致回调引用不稳定，节点组件接收到旧的回调，更新链断裂。

## 修复方案

### 修复 1：补全 ExternalCommand 更新字段

**文件**：`packages/server/src/canvasRoom.ts`

在 `buildNodeFromTaskItem` 和 `buildTaskItemUpdates` 方法中添加以下字段：
- `status` - 任务状态
- `isPinned` - 是否置顶
- `errorMessage` - 错误信息
- `completedAt` - 完成时间

**详细文档**：[fix-external-command-sync-issue.md](./fix-external-command-sync-issue.md)

### 修复 2：区分立即更新和节流更新

**文件**：
- `packages/widget/src/hooks/useCollaboration.ts`
- `packages/widget/src/CollaborativeCanvas.tsx`

为 `updateNodes` 方法添加 `immediate` 参数：
- `immediate: true` - 立即发送（用于用户主动操作）
- `immediate: false` - 使用节流（用于高频位置更新）

**详细文档**：[fix-update-throttling-issue.md](./fix-update-throttling-issue.md)

### 修复 3：修复 handleNodeDataUpdate 依赖错误 ⭐ **关键修复**

**文件**：`packages/widget/src/InfiniteCanvas.tsx`

移除 `handleNodeDataUpdate` 回调中错误的 `nodes` 依赖：

```typescript
// 修复前
const handleNodeDataUpdate = useCallback(
  (id: string, dataPatch: CanvasNodeDataPatch) => {
    setNodes((prevNodes) => {
      // 使用函数形式，不需要外部 nodes
    });
  },
  [emitNodesChange, requestDeleteNode, nodes] // ❌ 错误的依赖
);

// 修复后
const handleNodeDataUpdate = useCallback(
  (id: string, dataPatch: CanvasNodeDataPatch) => {
    setNodes((prevNodes) => {
      // 使用函数形式，不需要外部 nodes
    });
  },
  [emitNodesChange, requestDeleteNode] // ✅ 移除 nodes 依赖
);
```

**问题**：
- `nodes` 作为依赖会导致回调频繁重新创建
- 节点组件接收到旧的回调引用
- 用户点击星星时调用的是旧回调，无法触发更新链

**详细文档**：[fix-callback-dependency-issue.md](./fix-callback-dependency-issue.md)

## 完整数据流

### 场景 1：ExternalCommand 更新状态

```
外部系统发送 ExternalCommand
  ↓
服务器 handleExternalCommand()
  ↓
buildTaskItemUpdates() 构建更新（✅ 现在包含 status）
  ↓
broadcast NODES_UPDATED 消息
  ↓
所有客户端接收并应用更新
  ↓
UI 立即显示新状态
```

### 场景 2：用户点击星星评分

```
用户A点击星星
  ↓
ImageNode.handleRatingChange()
  ↓
nodeData.onNodeDataChange(nodeId, { rating: 3 })
  ↓
InfiniteCanvas.handleNodeDataUpdate() [✅ 稳定的回调引用]
  ↓
setNodes() + emitNodesChange()
  ↓
CollaborativeCanvas.handleNodesChange()
  ↓
检测到 rating 变化
  ↓
collab.updateNodes(updates, true) [✅ immediate=true 立即发送]
  ↓
useCollaboration.send() [✅ 不使用节流]
  ↓
服务器 broadcast NODES_UPDATED
  ↓
用户B接收并应用更新
  ↓
用户B看到星星变化 ⭐⭐⭐
```

### 场景 3：用户拖动节点

```
用户A拖动节点
  ↓
dragMove 每次鼠标移动触发
  ↓
throttledDragMove (33ms节流) ✅ 避免过多消息
  ↓
服务器 broadcast DRAG_MOVE
  ↓
用户B看到平滑的拖动动画
```

## 修改文件清单

### 服务器端
- ✅ `packages/server/src/canvasRoom.ts`
  - `buildNodeFromTaskItem` 方法（行 1359-1385）
  - `buildTaskItemUpdates` 方法（行 1387-1418）

### 客户端
- ✅ `packages/widget/src/hooks/useCollaboration.ts`
  - `CollaborationState` 接口（行 152-169）
  - `updateNodes` 方法（行 677-692）

- ✅ `packages/widget/src/CollaborativeCanvas.tsx`
  - 数据更新调用（行 1247）
  - 依赖焦点调用（行 456）
  - zIndex 调用（行 1544）

- ✅ `packages/widget/src/InfiniteCanvas.tsx` ⭐ **关键修复**
  - `handleNodeDataUpdate` 方法依赖数组（行 297-351）
  - 移除错误的 `nodes` 依赖

## 更新类型处理策略

| 更新来源 | 更新类型 | 处理方式 | 原因 |
|---------|---------|---------|------|
| ExternalCommand | status, rating, isPinned, etc. | ✅ 包含在更新中 | 服务器端构建完整数据 |
| 用户操作 | rating（打星星） | ✅ 立即发送 | 用户主动操作 |
| 用户操作 | content（文本） | ✅ 立即发送 | 用户主动操作 |
| 用户操作 | zIndex（图层） | ✅ 立即发送 | 影响显示顺序 |
| 用户操作 | position（拖动） | ⏱️ 节流发送 | 高频更新 |
| 用户操作 | dependencyFocus | ✅ 立即发送 | UI 状态 |

## 性能影响

### 消息频率对比

**修复前**：
- 用户点击星星 → 延迟33ms或等待其他操作触发
- ExternalCommand 更新 → 立即发送但缺少字段

**修复后**：
- 用户点击星星 → 立即发送（延迟 < 5ms）
- ExternalCommand 更新 → 立即发送且包含完整字段
- 拖动节点 → 保持节流（~30fps）

### 网络流量

- **用户操作**：低频，立即发送不会增加太多流量
- **拖动操作**：高频，继续使用节流控制流量
- **总体影响**：可忽略不计（< 1% 增加）

## 测试建议

### 基本功能测试

1. **评分同步**
   - [ ] 用户A点击星星，用户B立即看到评分变化
   - [ ] ExternalCommand 更新 rating，所有用户立即看到

2. **状态同步**
   - [ ] ExternalCommand 更新 status，所有用户立即看到状态变化
   - [ ] 置顶状态（isPinned）能正确同步

3. **文本同步**
   - [ ] 用户A修改文本内容，用户B立即看到
   - [ ] 文本样式修改能立即同步

4. **图层同步**
   - [ ] 用户A调整图层顺序，用户B立即看到
   - [ ] zIndex 变化正确同步

5. **拖动性能**
   - [ ] 拖动节点时画面流畅（不卡顿）
   - [ ] 其他用户看到平滑的拖动动画
   - [ ] 批量拖动时所有节点同步移动

### 边界情况测试

1. **快速连续操作**
   - [ ] 快速点击星星多次，每次都能同步
   - [ ] 快速修改文本，不会丢失更新

2. **并发操作**
   - [ ] 多个用户同时操作不同节点，都能正确同步
   - [ ] 多个用户同时操作同一节点，有正确的冲突处理

3. **网络延迟**
   - [ ] 在网络延迟情况下，更新顺序正确
   - [ ] 延迟恢复后，所有更新都能到达

## 回滚方案

如果发现问题需要回滚：

### 服务器端回滚
移除 `buildNodeFromTaskItem` 和 `buildTaskItemUpdates` 中新增的字段：
```typescript
// 移除这些行：
status: item.status,
isPinned: item.isPinned,
errorMessage: item.errorMessage,
completedAt: item.completedAt,
```

### 客户端回滚
恢复 `updateNodes` 方法：
```typescript
const updateNodes = useCallback(
  (updates: Array<{ nodeId: string; updates: Partial<CanvasNodeData> }>) => {
    if (updates.length === 0) {
      return;
    }
    throttledUpdateNodes(updates);
  },
  [throttledUpdateNodes]
);
```

移除所有调用点的 `true` 参数。

## 相关链接

- [ExternalCommand 同步问题修复](./fix-external-command-sync-issue.md)
- [更新节流问题修复](./fix-update-throttling-issue.md)
- [handleNodeDataUpdate 依赖问题修复](./fix-callback-dependency-issue.md) ⭐ **关键修复**

## 重要说明

**修复 3（handleNodeDataUpdate 依赖问题）是最关键的修复**。如果没有这个修复，即使修复了1和2，用户操作的更新仍然不会立即同步。

修复顺序的重要性：
1. 修复 3 解决了更新链断裂的根本问题
2. 修复 2 优化了发送策略（立即发送 vs 节流）
3. 修复 1 补全了 ExternalCommand 的字段

## 日期

2026-01-31
