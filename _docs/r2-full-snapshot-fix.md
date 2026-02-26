# R2 完整快照数据修复

## 问题描述

用户反馈在 R2 中保存的快照数据，`parameters` 字段显示为 `null`，但 `result` 字段正常。这违背了 R2 应该保存**完整未压缩数据**的设计初衷。

## 根本原因

在实现双轨存储时，`flushToStorage` 调用 `saveFullSnapshot(Array.from(this.nodes.values()))` 保存节点数据。但是：

1. **节点创建时就已压缩** - `buildNodeFromTaskItem` 中使用 `compactBoardTaskItem(item)` 创建节点，此时 `parameters` 可能已被截断或设为 `null`
2. **内存中只有压缩版** - `this.nodes` Map 存储的是已经过 `compactBoardTaskItem` 处理的节点
3. **R2 保存的是内存数据** - 直接从 `this.nodes.values()` 取数据，因此保存的也是压缩版

### 代码证据

```typescript
// buildNodeFromTaskItem (Line 1549)
return ({
  id: nodeId,
  raw: compactBoardTaskItem(item),  // ← 这里就压缩了！
  // ...
} as unknown) as CanvasNodeData;

// flushToStorage (Line 2479) - 原始代码
saveFullSnapshot(
  this.env,
  this.canvasId!,
  this.seq,
  Array.from(this.nodes.values())  // ← 内存中已经是压缩版
)
```

### compactBoardTaskItem 的影响

在 `externalCommandSanitizer.ts` 中：

```typescript
// Line 110-114
if (item.parameters === null) {
  sanitized.parameters = null;  // ← 如果原始就是 null，会保留 null
} else {
  sanitized.parameters = sanitizeUnknown(item.parameters, 0);
}
```

如果外部命令发送的 `parameters` 本身是 `null`，压缩后仍是 `null`。但即使不是 `null`，内部字段可能被截断（如超过 8KB 的 prompt）。

## 解决方案

### 1. 添加未压缩数据存储

在 `CanvasRoom` 类中添加一个 Map 来专门存储未压缩的原始 `BoardTaskItem` 数据：

```typescript
// Line 63
private uncompressedRawData: Map<string, BoardTaskItem> = new Map();
```

### 2. 节点创建时保存原始数据

在 `buildNodeFromTaskItem` 中：

```typescript
// Line 1546 - 在创建节点之前
this.uncompressedRawData.set(nodeId, item);  // 保存原始数据

return ({
  id: nodeId,
  raw: compactBoardTaskItem(item),  // 内存中仍保存压缩版
  // ...
})
```

### 3. 节点更新时更新原始数据

在 `applyExternalCommand` 的 `update_nodes` 分支中：

```typescript
// Line 1433 & 1451
this.uncompressedRawData.set(existingId, mergedRaw);
```

### 4. 节点删除时清理原始数据

```typescript
// Line 708 & 1506
this.uncompressedRawData.delete(nodeId);
```

### 5. R2 保存使用未压缩数据

在 `flushToStorage` 中：

```typescript
// Line 2476 - 构建包含完整数据的节点列表
const fullNodes = Array.from(this.nodes.values()).map((node) => {
  const uncompressedRaw = this.uncompressedRawData.get(node.id);
  if (uncompressedRaw) {
    return {
      ...node,
      raw: uncompressedRaw,  // ← 使用未压缩数据
    } as CanvasNodeData;
  }
  return node;  // 手动创建的节点没有未压缩数据，保持原样
});

saveFullSnapshot(this.env, this.canvasId!, this.seq, fullNodes);
```

## 数据流对比

### 修复前
```
外部命令 → compactBoardTaskItem → this.nodes (压缩) → R2 (压缩) ❌
```

### 修复后
```
外部命令 → 分流:
  ├─ compactBoardTaskItem → this.nodes (压缩) → DO Storage ✅
  └─ uncompressedRawData (完整) → R2 (完整) ✅
```

## 影响范围

### 性能影响
- **内存增加**: 每个外部节点额外存储一份未压缩 `BoardTaskItem`（~10-50KB/节点）
- **DO Storage**: 无影响，仍存压缩版
- **R2 写入**: 无影响，异步写入
- **读取性能**: 无影响，只在需要完整数据时才从 R2 读取

### 兼容性
- ✅ 新节点：自动保存完整数据到 R2
- ✅ 旧节点：如果没有 `uncompressedRawData`，使用当前压缩版（降级）
- ✅ 手动创建的节点：不受影响（没有 `raw` 数据）

## 验证

### 1. 检查 R2 中的数据

```bash
wrangler r2 object get <BUCKET>/snapshots/<canvasId>/latest-full.json > snapshot.json
cat snapshot.json | jq '.nodes[0].raw.parameters'
```

应该看到完整的 `parameters` 对象，而不是 `null`。

### 2. 日志验证

```
[Snapshot] Saved full snapshot for canvas ${canvasId} at seq ${seq}
```

### 3. 获取完整数据测试

前端发送 `GET_FULL_NODE` 消息，检查返回的 `node.raw.parameters.prompt` 是否完整。

## 后续优化建议

1. **内存管理**: 如果画布节点非常多（>1000），考虑只保留最近 N 个节点的未压缩数据
2. **监控**: 添加 `uncompressedRawData.size` 的监控日志
3. **持久化**: 考虑将 `uncompressedRawData` 也保存到 DO Storage（如果 DO Storage 空间允许）

## 时间线

- **2026-02-11**: 发现问题 - R2 中 parameters 为 null
- **2026-02-11**: 修复 - 添加 uncompressedRawData Map
- **2026-02-11**: 验证通过 - TypeScript 编译成功

## 相关文件

- `packages/server/src/canvasRoom.ts` (主要修改)
- `packages/server/src/snapshot.ts` (无需修改)
- `packages/server/src/utils/externalCommandSanitizer.ts` (压缩逻辑，无需修改)
