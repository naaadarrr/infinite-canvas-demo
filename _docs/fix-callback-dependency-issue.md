# 修复：handleNodeDataUpdate 依赖问题导致更新不同步

## 问题描述

用户A点击星星或修改文本后，更新没有立即同步到用户B。只有在用户A拖动节点后，更新才会同步。

## 根本原因

在 `InfiniteCanvas.tsx` 中的 `handleNodeDataUpdate` 回调函数有一个错误的依赖项：

```typescript
const handleNodeDataUpdate = useCallback(
  (id: string, dataPatch: CanvasNodeDataPatch) => {
    // ... 使用 setNodes 函数形式更新状态
  },
  [emitNodesChange, requestDeleteNode, nodes] // ❌ nodes 作为依赖
);
```

### 问题分析

1. **依赖链问题**：
   - `handleNodeDataUpdate` 依赖 `nodes`
   - 每次 `nodes` 变化，回调就会重新创建
   - 但是这个回调通过 `data.onNodeDataChange` 已经传递给了节点组件

2. **节点组件的回调引用**：
   - 节点组件（如 `ImageNode`）通过 `nodeData.onNodeDataChange` 调用这个回调
   - 但由于 React Flow 的优化，节点组件接收到的可能是**旧的回调引用**
   - 当用户点击星星时，调用的是旧的回调，而旧的回调可能无法正确触发更新链

3. **为什么拖动后会更新**：
   - 拖动操作会触发 React Flow 的重新渲染
   - 重新渲染会给节点传递新的 `onNodeDataChange` 回调
   - 这时积压的更新才会被发送

### 正确做法

`handleNodeDataUpdate` 内部使用的是 `setNodes` 的**函数形式**：

```typescript
setNodes((prevNodes) => {
  // 从 prevNodes 读取当前状态，不需要外部 nodes
  return updatedNodes;
});
```

因此，**不需要** `nodes` 作为依赖项！

## 解决方案

移除 `nodes` 依赖，保持回调引用稳定：

```typescript
const handleNodeDataUpdate = useCallback(
  (id: string, dataPatch: CanvasNodeDataPatch) => {
    // ...
    setNodes((prevNodes) => {
      // 使用函数形式，从参数获取当前状态
      const updatedNodes = prevNodes.map((node) => {
        // ...
      });
      emitNodesChange(updatedNodes);
      return updatedNodes;
    });
  },
  [emitNodesChange, requestDeleteNode] // ✅ 移除 nodes 依赖
);
```

## 效果

修复后：
- ✅ 用户A点击星星 → 立即触发 `handleNodeDataUpdate`
- ✅ `handleNodeDataUpdate` 调用 `emitNodesChange`
- ✅ `emitNodesChange` 调用 `onNodesChangeCallback`（即 `CollaborativeCanvas.handleNodesChange`）
- ✅ `handleNodesChange` 检测到 rating 变化
- ✅ 调用 `collab.updateNodes(dataUpdates, true)` 立即发送
- ✅ 服务器广播给用户B
- ✅ 用户B立即看到星星变化

## 完整的调用链

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
collab.updateNodes([{ nodeId, updates: { rating: 3 } }], true)
  ↓
useCollaboration.updateNodes() with immediate=true
  ↓
send({ type: UPDATE_NODES, updates }) [立即发送，不节流]
  ↓
服务器 broadcast NODES_UPDATED
  ↓
用户B接收并应用更新
  ↓
用户B看到星星变化 ⭐⭐⭐
```

## 为什么之前会误以为是节流问题

之前我认为问题是节流导致的，所以添加了 `immediate` 参数。虽然这个优化是好的，但实际上：

1. **节流不是根本原因**：节流只是延迟33ms，不会等到拖动才发送
2. **真正的问题**：是回调引用不稳定，导致更新链断裂
3. **immediate 优化**：虽然不是必需的，但仍然是有价值的改进（用户操作应该立即响应）

## 额外发现的问题

在调试过程中，我还添加了日志来追踪整个流程。这些日志可以帮助：
- 确认 `handleNodeDataUpdate` 是否被调用
- 确认 `emitNodesChange` 是否被调用
- 确认 `handleNodesChange` 是否收到更新

建议在测试环境保留这些日志，生产环境可以移除。

## 修改文件

- ✅ `packages/widget/src/InfiniteCanvas.tsx`
  - 修改 `handleNodeDataUpdate` 的依赖数组（行 297-351）
  - 添加调试日志（可选，用于验证）

## 测试验证

请测试以下场景：

1. **打星星**
   - [ ] 用户A点击星星 → 用户B立即看到（< 100ms）
   - [ ] 快速连续点击星星 → 每次都能同步

2. **修改文本**
   - [ ] 用户A编辑文本内容 → 用户B在300ms后看到（TextNode 有延迟同步）
   - [ ] 用户A修改字体大小/颜色 → 用户B立即看到

3. **调整图层**
   - [ ] 用户A调整节点层级 → 用户B立即看到

4. **拖动节点**
   - [ ] 拖动应该仍然流畅（不应该有性能回退）

## 日期

2026-01-31
