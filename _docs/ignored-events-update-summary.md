# Ignored Events 原因日志 - 更新总结

## 更新内容

为所有 `summary.ignored += 1` 的地方添加了详细的原因日志,格式统一为:

```
[CanvasRoom] Ignored <command_type>: Reason=<原因>, <关键字段>=<值>, ...
```

---

## 修改的位置

### 1. Append Nodes (3 处)

#### 位置 1: 无效的 item 或缺少 taskId
```typescript
if (!item || typeof item.taskId !== 'string') {
  console.log(
    `[CanvasRoom] Ignored append_nodes: Reason=Invalid item or missing taskId, item=${JSON.stringify(item)}`
  );
  summary.ignored += 1;
  continue;
}
```

#### 位置 2: 节点已存在
```typescript
if (existingId) {
  console.log(
    `[CanvasRoom] Ignored append_nodes: Reason=Node already exists, taskId=${item.taskId}, existingNodeId=${existingId}`
  );
  summary.ignored += 1;
  continue;
}
```

#### 位置 3: 无法构建节点
```typescript
if (!createdNode) {
  console.log(
    `[CanvasRoom] Ignored append_nodes: Reason=Failed to build node, taskId=${item.taskId}, mediaType=${item.mediaType}`
  );
  summary.ignored += 1;
  continue;
}
```

---

### 2. Update Nodes (5 处)

#### 位置 1: 无效的 item 或缺少 taskId
```typescript
if (!item || typeof item.taskId !== 'string') {
  console.log(
    `[CanvasRoom] Ignored update_nodes: Reason=Invalid item or missing taskId, item=${JSON.stringify(item)}`
  );
  summary.ignored += 1;
  continue;
}
```

#### 位置 2: 节点不存在
```typescript
if (!existingId) {
  console.log(
    `[CanvasRoom] Ignored update_nodes: Reason=Node not found, taskId=${item.taskId}, source=${source}`
  );
  summary.ignored += 1;
  continue;
}
```

#### 位置 3: 节点索引不一致
```typescript
if (!existing) {
  console.log(
    `[CanvasRoom] Ignored update_nodes: Reason=Node exists in index but not in memory, taskId=${item.taskId}, nodeId=${existingId}`
  );
  summary.ignored += 1;
  continue;
}
```

#### 位置 4: 无变化 (深度相等)
```typescript
if (existingRaw && this.isDeepEqual(existingRaw, mergedRaw) && !shouldRefreshMedia) {
  console.log(
    `[CanvasRoom] Ignored update_nodes: Reason=No changes detected (deep equal), taskId=${item.taskId}, status=${incomingStatus}, shouldRefreshMedia=${shouldRefreshMedia}`
  );
  summary.ignored += 1;
  continue;
}
```

#### 位置 5: 空更新
```typescript
if (!updates || Object.keys(updates).length === 0) {
  console.log(
    `[CanvasRoom] Ignored update_nodes: Reason=Empty updates (buildTaskItemUpdates returned nothing), taskId=${item.taskId}, status=${incomingStatus}, nodeType=${normalizedType}`
  );
  summary.ignored += 1;
  continue;
}
```

---

### 3. Delete Nodes (3 处)

#### 位置 1: 无效的 item 或缺少 taskId
```typescript
if (!item || typeof item.taskId !== 'string') {
  console.log(
    `[CanvasRoom] Ignored delete_nodes: Reason=Invalid item or missing taskId, item=${JSON.stringify(item)}`
  );
  summary.ignored += 1;
  continue;
}
```

#### 位置 2: 节点不存在
```typescript
if (!existingId) {
  console.log(
    `[CanvasRoom] Ignored delete_nodes: Reason=Node not found, taskId=${item.taskId}, source=${source}`
  );
  summary.ignored += 1;
  continue;
}
```

#### 位置 3: 节点索引不一致
```typescript
if (!this.nodes.has(existingId)) {
  console.log(
    `[CanvasRoom] Ignored delete_nodes: Reason=Node exists in index but not in memory, taskId=${item.taskId}, nodeId=${existingId}`
  );
  summary.ignored += 1;
  continue;
}
```

---

## 日志格式规范

### 统一格式

```
[CanvasRoom] Ignored <command_type>: Reason=<原因>, <字段1>=<值1>, <字段2>=<值2>
```

### 关键字段说明

- **command_type**: `append_nodes` / `update_nodes` / `delete_nodes`
- **Reason**: 具体的忽略原因 (英文,便于搜索)
- **taskId**: 任务 ID (必有)
- **nodeId**: 节点 ID (如果存在)
- **existingNodeId**: 已存在的节点 ID (append 重复时)
- **source**: 命令来源
- **status**: 任务状态 (update 时)
- **mediaType**: 媒体类型 (append 失败时)
- **nodeType**: 节点类型 (update 失败时)
- **shouldRefreshMedia**: 是否需要刷新媒体 (update 时)

---

## 日志示例

### Append Nodes 日志

```
[CanvasRoom] Ignored append_nodes: Reason=Invalid item or missing taskId, item=null
[CanvasRoom] Ignored append_nodes: Reason=Node already exists, taskId=task_123, existingNodeId=task:task_123
[CanvasRoom] Ignored append_nodes: Reason=Failed to build node, taskId=task_456, mediaType=unknown
```

### Update Nodes 日志

```
[CanvasRoom] Ignored update_nodes: Reason=Invalid item or missing taskId, item={"taskId":123}
[CanvasRoom] Ignored update_nodes: Reason=Node not found, taskId=task_789, source=board
[CanvasRoom] Ignored update_nodes: Reason=Node exists in index but not in memory, taskId=task_abc, nodeId=task:task_abc
[CanvasRoom] Ignored update_nodes: Reason=No changes detected (deep equal), taskId=task_def, status=completed, shouldRefreshMedia=false
[CanvasRoom] Ignored update_nodes: Reason=Empty updates (buildTaskItemUpdates returned nothing), taskId=task_ghi, status=init, nodeType=video
```

### Delete Nodes 日志

```
[CanvasRoom] Ignored delete_nodes: Reason=Invalid item or missing taskId, item=undefined
[CanvasRoom] Ignored delete_nodes: Reason=Node not found, taskId=task_jkl, source=board
[CanvasRoom] Ignored delete_nodes: Reason=Node exists in index but not in memory, taskId=task_mno, nodeId=task:task_mno
```

---

## 使用场景

### 1. 实时监控

```bash
# 查看所有 ignored 事件
npx wrangler tail --format pretty | grep "Ignored"

# 查看特定原因
npx wrangler tail --format pretty | grep "Reason=Node not found"
```

### 2. 日志分析

```bash
# 导出日志进行分析
npx wrangler tail --format json > logs.json

# 统计各种 ignored 原因的数量
cat logs.json | grep "Ignored" | grep -o "Reason=[^,]*" | sort | uniq -c
```

### 3. 故障排查

当 `ignored` 数量异常时:

1. 搜索对应的 `Reason=` 日志
2. 查看 taskId 和其他关键字段
3. 根据原因采取相应的处理措施

---

## 监控指标

### 关键指标

| 指标 | 计算方法 | 正常阈值 |
|------|---------|---------|
| Append ignored 率 | ignored / (created + ignored) | < 5% |
| Update ignored 率 | ignored / (updated + ignored) | < 10% |
| Delete ignored 率 | ignored / (deleted + ignored) | < 5% |

### 异常告警

| Reason | 严重程度 | 告警阈值 |
|--------|---------|---------|
| Node exists in index but not in memory | 🔴 Critical | 出现即告警 |
| Invalid item or missing taskId | 🟡 Warning | > 1% |
| Failed to build node | 🟡 Warning | > 5% |
| Node not found (update) | 🟢 Info | > 30% |
| Node already exists (append) | 🟢 Info | > 10% |

---

## 优势

### 1. 问题定位更快

**之前**:
```
[CanvasRoom] External command result id=cmd_001 ignored=5
```
无法知道为什么 ignored,需要查看大量日志

**现在**:
```
[CanvasRoom] Ignored update_nodes: Reason=Node not found, taskId=task_123, source=board
[CanvasRoom] Ignored update_nodes: Reason=Node not found, taskId=task_456, source=board
...
[CanvasRoom] External command result id=cmd_001 ignored=5
```
一目了然,知道是哪些 taskId 找不到

### 2. 区分正常和异常

- 正常: "Node already exists" (防重机制)
- 异常: "Node exists in index but not in memory" (状态不一致)

### 3. 便于监控和统计

可以根据 `Reason=` 进行分类统计,发现系统问题

### 4. 便于调试

所有关键信息都在一行日志中,无需上下文关联

---

## 相关文档

- 详细说明: `_docs/ignored-events-reasons.md`
- 修复总结: `_docs/update-node-fix-optimized.md`
- 快速参考: `_docs/update-node-fix-quick-ref.md`

---

## 总结

✅ 所有 11 处 `summary.ignored += 1` 都添加了详细的原因日志
✅ 统一的日志格式,便于搜索和分析
✅ 包含关键字段,快速定位问题
✅ 支持实时监控和历史分析
✅ 无 linter 错误

**效果**: 从"不知道为什么被忽略"到"一眼看出具体原因",大幅提升调试效率! 🎉
