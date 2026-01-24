# 调试会话总结

## 会话日期
2026-01-23

## 问题描述

### 问题1：文本框缩放/拉伸时和停止后会抖动
用户报告在缩放或拉伸文本节点时，框会明显抖动，影响用户体验。

### 问题2：批量拖动同步问题
当用户A拖动4个以上的元素时，用户B只看到1个节点在动，直到用户A放手后，其他节点才突然跳到最终位置。

---

## 调试过程

### 第一轮调试

**生成的假设：**
- **H1-A**: 缩放时频繁调用服务器同步，回显导致抖动
- **H1-B**: `syncNodeDataSize` 与 React Flow 内部更新产生竞争
- **H1-C**: ✅ **CONFIRMED** - 自动高度调整与手动缩放冲突
- **H1-D**: ✅ **CONFIRMED** - 缩放过程中收到服务器回显
- **H1-E**: 缩放结束时没有标记状态

- **H2-A**: `handleNodeDrag` 只对主节点同步
- **H2-B**: ✅ **CONFIRMED** - 回调只接收主节点ID
- **H2-C**: React Flow 批量拖动机制问题
- **H2-D**: 节流导致丢失
- **H2-E**: ✅ **CONFIRMED** - 其他节点被 `draggingNodesRef` 阻止同步

**关键日志证据：**

问题1：
```json
{"location":"TextNode.tsx:handleUp","message":"Scale end"}
{"location":"TextNode.tsx:useLayoutEffect","oldHeight":364,"newHeight":357}
{"location":"TextNode.tsx:useLayoutEffect","oldHeight":456,"newHeight":468}
{"location":"TextNode.tsx:useLayoutEffect","oldHeight":348,"newHeight":357}
```
缩放结束后，`useLayoutEffect` 立即触发了3次高度调整。

问题2：
```json
{"location":"page.tsx:handleNodeDrag","draggingCount":1,"allDraggingIds":["node_xxx"]}
```
只有1个节点被标记为拖动，其他选中的节点没有被包含。

**第一次修复尝试：**
1. 延迟100ms清除 `scaleStateRef` 和 `widthResizeRef`
2. 修改 `InfiniteCanvas` 传递 `selectedNodeIds` 参数
3. 在 `handleNodeDrag` 中批量发送所有选中节点的位置

**结果：**
- 问题2修复成功 ✅
- 问题1仍然存在：高度在232和240之间循环 ❌

### 第二轮调试

**新假设：**
- **H1-F**: ✅ **CONFIRMED** - `useLayoutEffect` 依赖 `nodeData.size.height`，造成循环
- **H1-G**: 服务器回显在延迟期间触发更新
- **H1-H**: ✅ **CONFIRMED** - `scrollHeight` 计算不稳定

**关键日志证据：**
```json
{"location":"TextNode.tsx:useLayoutEffect","oldHeight":232,"newHeight":240}
{"location":"TextNode.tsx:useLayoutEffect","oldHeight":240,"newHeight":232}
{"location":"TextNode.tsx:useLayoutEffect","oldHeight":232,"newHeight":240}
...
```
无限循环，高度在两个值之间反复跳动。

**最终修复方案：**

1. **引入 `manualSizingRef`**：
   - 在缩放/拉伸开始时设置为 `true`
   - 在操作结束后延迟500ms设置为 `false`
   - 在 `useLayoutEffect` 中检查此标记，手动调整期间跳过自动高度计算

2. **移除高度依赖**：
   - 从 `useLayoutEffect` 的依赖数组中移除 `nodeData.size.height` 和 `nodeData.size`
   - 只保留 `nodeData.size.width`，因为宽度变化时需要重新计算高度
   - 添加 eslint-disable 注释

**最终验证日志：**
```json
// 缩放期间
{"location":"TextNode.tsx:useLayoutEffect","message":"Skipped - manual sizing","manualSizing":true}
{"location":"TextNode.tsx:useLayoutEffect","message":"Skipped - manual sizing","manualSizing":true}

// 缩放结束后
{"location":"TextNode.tsx:useLayoutEffect","scrollHeight":268,"oldHeight":292,"nextHeight":292,"diff":0,"willUpdate":false}
```
✅ 所有调用都被正确跳过或确认不需要更新

批量拖动验证：
```json
{"location":"page.tsx:handleNodeDrag","draggingCount":11,"selectedCount":11}
```
✅ 所有11个选中的节点都被正确处理

---

## 最终解决方案

### 修复1：文本框抖动

**文件：** `packages/widget/src/nodes/TextNode.tsx`

**关键变更：**

1. 添加 `manualSizingRef` 来追踪手动调整状态：
```typescript
const manualSizingRef = React.useRef(false);
```

2. 在缩放/拉伸开始时设置标记：
```typescript
const handleScaleStart = (...) => {
  manualSizingRef.current = true;
  // ...
};

const handleWidthResizeStart = (...) => {
  manualSizingRef.current = true;
  // ...
};
```

3. 在操作结束后延迟清除标记：
```typescript
const handleUp = () => {
  // ...
  setTimeout(() => {
    manualSizingRef.current = false;
  }, 500);
};
```

4. 在自动高度调整中检查标记：
```typescript
React.useLayoutEffect(() => {
  if (manualSizingRef.current) {
    return; // 跳过自动调整
  }
  // ... 自动高度计算
}, [content, lineHeightPx, nodeData.id, nodeData.onNodeDataChange, paddingSize, nodeData.size.width]);
// 注意：移除了 nodeData.size.height 的依赖
```

### 修复2：批量拖动同步

**文件：** 
- `packages/widget/src/InfiniteCanvas.tsx`
- `apps/demo/src/app/page.tsx`

**关键变更：**

1. 修改 `InfiniteCanvas` 的回调接口：
```typescript
onNodeDrag?: (nodeId: string, position: { x: number; y: number }, selectedNodeIds?: string[]) => void;
```

2. 在拖动时传递所有选中的节点：
```typescript
onNodeDrag={(_, node) => {
  const selectedNodeIds = nodes.filter(n => n.selected).map(n => n.id);
  onNodeDrag?.(node.id, node.position, selectedNodeIds.length > 1 ? selectedNodeIds : undefined);
}}
```

3. 在 `handleNodeDrag` 中批量发送更新：
```typescript
const handleNodeDrag = useCallback((nodeId, position, selectedNodeIds) => {
  if (selectedNodeIds && selectedNodeIds.length > 1) {
    // 标记所有选中的节点为拖动状态
    selectedNodeIds.forEach(id => draggingNodesRef.current.add(id));
    
    // 批量发送所有节点的位置更新
    const updates = selectedNodeIds.map(id => {
      const node = currentNodes.find(n => n.id === id);
      return {
        nodeId: idMapRef.current.get(id) ?? id,
        updates: { position: node.position },
      };
    }).filter(update => update !== null);
    
    collab.updateNodes(updates);
  } else {
    // 单节点拖动
    collab.dragMove(mappedId, position);
  }
}, [collab]);
```

---

## 技术要点

### 问题1的根本原因
- React 的 `useLayoutEffect` 依赖数组包含了它自己要更新的值（`nodeData.size.height`）
- 这导致了一个更新循环：更新高度 → 触发 effect → 计算新高度 → 更新高度 → ...
- 同时，在缩放操作刚结束时，`scrollHeight` 的值可能还在调整中，导致计算不稳定

### 问题2的根本原因
- React Flow 的 `onNodeDrag` 回调只针对主拖动节点触发
- 其他选中的节点虽然在UI上一起移动，但它们的位置变化没有独立的回调
- 之前的实现只发送了主节点的位置，导致其他客户端看不到其他节点的移动

### 关键洞察
1. **状态循环的检测**：通过日志看到值在两个数字之间反复跳动，这是循环依赖的明显标志
2. **React Flow的批量拖动机制**：需要从选中状态(`selected`)推断哪些节点在一起移动
3. **延迟策略的权衡**：500ms的延迟足够让所有相关的更新完成，但不会影响用户体验

---

## 性能影响

### 改进前
- 文本框缩放：每次缩放结束后触发3-10次不必要的高度计算
- 批量拖动：每个拖动事件只同步1个节点，其他节点在拖动结束后一次性更新

### 改进后
- 文本框缩放：缩放期间和结束后500ms内完全跳过自动高度计算，消除抖动
- 批量拖动：每个拖动事件同步所有选中的节点（使用批量API），实时性显著提升

---

## 测试建议

### 回归测试
1. **单节点拖动**：确保单个节点拖动仍然正常工作
2. **文本自动换行**：输入长文本时确保高度能正确自动调整
3. **宽度调整**：调整文本框宽度时确保高度随内容重排正确更新

### 边界情况
1. **快速连续操作**：快速进行多次缩放操作
2. **大量节点**：选中10个以上节点进行批量拖动
3. **网络延迟**：在高延迟环境下测试协同效果

---

## 总结

通过系统的调试和日志分析，我们成功定位并修复了两个影响用户体验的关键问题：

1. ✅ **文本框抖动**：通过引入手动调整标记和移除循环依赖，彻底消除了抖动
2. ✅ **批量拖动同步**：通过传递选中节点列表和批量更新API，实现了真正的实时多节点拖动

修复后的代码更加健壮，用户体验显著提升。
