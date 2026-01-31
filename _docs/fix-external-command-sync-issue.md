# 修复：ExternalCommand 更新节点时字段同步问题

## 问题描述

当通过 ExternalCommand API 更新节点时（例如更新 status、rating、isPinned 等字段），B 用户的画面没有同步更新这些字段的变化。

## 根本原因

在服务器端处理 ExternalCommand 更新时，`buildTaskItemUpdates` 和 `buildNodeFromTaskItem` 方法没有将 `BoardTaskItem` 中的一些关键字段包含在节点数据中，导致这些字段的更新无法广播给其他客户端。

## 修复内容

### 1. `buildNodeFromTaskItem` 方法（创建新节点）

**修改前：**
```typescript
return ({
  id: nodeId,
  type: normalizedType,
  position,
  size,
  zIndex: 1,
  raw: item,
  taskId: item.taskId,
  rating: item.rating,
  externalId: item.taskId,
  externalSource: source,
  ...derived,
} as unknown) as CanvasNodeData;
```

**修改后：**
```typescript
return ({
  id: nodeId,
  type: normalizedType,
  position,
  size,
  zIndex: 1,
  raw: item,
  taskId: item.taskId,
  rating: item.rating,
  status: item.status,              // ✅ 新增
  isPinned: item.isPinned,          // ✅ 新增
  errorMessage: item.errorMessage,  // ✅ 新增
  completedAt: item.completedAt,    // ✅ 新增
  externalId: item.taskId,
  externalSource: source,
  ...derived,
} as unknown) as CanvasNodeData;
```

### 2. `buildTaskItemUpdates` 方法（更新节点）

**修改前：**
```typescript
const updates: Partial<CanvasNodeData> = {
  raw: item,
  taskId: item.taskId,
  rating: item.rating,
  externalId: item.taskId,
  externalSource: source,
};
```

**修改后：**
```typescript
const updates: Partial<CanvasNodeData> = {
  raw: item,
  taskId: item.taskId,
  rating: item.rating,
  status: item.status,              // ✅ 新增
  isPinned: item.isPinned,          // ✅ 新增
  errorMessage: item.errorMessage,  // ✅ 新增
  completedAt: item.completedAt,    // ✅ 新增
  externalId: item.taskId,
  externalSource: source,
};
```

## 新增的同步字段

| 字段 | 类型 | 说明 |
|-----|------|------|
| `status` | `string` | 任务状态（如 pending, processing, completed 等） |
| `isPinned` | `boolean \| undefined` | 是否置顶 |
| `errorMessage` | `string \| null \| undefined` | 错误信息 |
| `completedAt` | `string \| null` | 完成时间 |

## 测试场景

1. **状态更新**：A 通过 ExternalCommand 更新节点状态，B 能看到状态变化
2. **星星评分更新**：A 更新节点的 rating，B 能看到星星数变化
3. **置顶状态更新**：A 将节点置顶/取消置顶，B 能看到相应变化
4. **错误信息同步**：节点出现错误时，所有用户都能看到错误信息
5. **完成时间同步**：任务完成后，完成时间能同步到所有客户端

## 影响范围

- **文件**：`packages/server/src/canvasRoom.ts`
- **方法**：
  - `buildNodeFromTaskItem` (行 1359-1385)
  - `buildTaskItemUpdates` (行 1387-1418)

## 相关代码流程

```
ExternalCommand API
  ↓
canvasRoom.handleExternalCommand()
  ↓
case 'update_nodes' (行 1269-1314)
  ↓
buildTaskItemUpdates() ← 生成更新数据
  ↓
this.broadcast({
  type: MessageType.NODES_UPDATED,
  updates: updatesBatch
})
  ↓
所有客户端收到 NODES_UPDATED 消息
  ↓
CollaborativeCanvas.handleMessage()
  ↓
case 'nodes_updated' (行 744-791)
  ↓
setNodes() 更新本地状态
```

## 注意事项

1. 所有新增的字段都会包含在 `NODES_UPDATED` 消息中
2. 客户端的 `handleMessage` 已经能够正确处理这些字段（通过对象展开运算符）
3. `raw` 字段包含完整的 `BoardTaskItem` 数据，但显式同步关键字段可以确保类型安全和明确性

## 日期

2026-01-31
