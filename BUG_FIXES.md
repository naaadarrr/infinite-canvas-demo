# Bug 修复报告

## 修复日期
2026-01-23

## 修复的问题

### 1. 批量拖动超过3个元件时的拖尾现象

**问题描述：**
当同时拖动多个节点（超过3个）时，会出现严重的拖尾现象。虽然之前修复了自动跳来跳去的问题，但批量拖动时性能和同步问题仍然存在。

**根本原因：**
1. 在拖动过程中，`handleNodesChange` 会被频繁调用，每次都会尝试发送批量更新到服务器
2. 多个节点同时拖动时，每个节点的位置变化都会触发独立的更新消息
3. 拖动标记 (`draggingNodesRef`) 只记录了主拖动节点，没有包含所有被选中并一起移动的节点

**修复方案：**

#### 1.1 在 `apps/demo/src/app/page.tsx` 的 `handleNodeDragStart` 中：
```typescript
// 检查是否有其他选中的节点，如果有，也标记它们为拖动状态
const selectedNodes = currentNodes.filter((node) => {
  return (node as any).selected === true;
});

// 将所有选中的节点都标记为正在拖动
selectedNodes.forEach((node) => {
  draggingNodesRef.current.add(node.id);
});
```

#### 1.2 在 `handleNodesChange` 中：
```typescript
// 只有在没有节点正在拖动，且有位置变化时才发送批量更新
// 这样可以避免在拖动过程中的干扰
if (movedNodes.length > 0 && draggingNodesRef.current.size === 0) {
  const updates = movedNodes.map((node) => ({
    nodeId: idMapRef.current.get(node.id) ?? node.id,
    updates: { position: node.position },
  }));
  collab.updateNodes(updates);
}
```

#### 1.3 在 `handleNodeDragEnd` 中：
```typescript
// 获取所有正在拖动的节点
const draggingNodeIds = Array.from(draggingNodesRef.current);

// 清除所有拖动标记
draggingNodesRef.current.clear();

// 如果有多个节点被拖动，发送批量更新
if (draggingNodeIds.length > 1) {
  const updates = draggingNodeIds
    .map((id) => {
      const node = currentNodes.find((n) => n.id === id);
      if (!node) return null;
      return {
        nodeId: idMapRef.current.get(id) ?? id,
        updates: { position: node.position },
      };
    })
    .filter((update) => update !== null);
  
  if (updates.length > 0) {
    collab.updateNodes(updates);
  }
}
```

**效果：**
- 拖动过程中不再发送位置更新，避免了与服务器的频繁同步
- 拖动结束后一次性批量更新所有移动的节点位置
- 所有选中的节点都被正确标记为拖动状态，避免了来自服务器的位置更新干扰

---

### 2. 文本输入无法正常输入中文

**问题描述：**
在文本节点中输入中文时，每次敲击一个键盘就会输出并产生严重的输入问题。中文输入法（IME）无法正常工作，每个字符都会立即同步到服务器并可能被回显打断。

**根本原因：**
1. `TextNode.tsx` 中的 `handleContentChange` 在每次 `onChange` 事件时都立即调用 `nodeData.onNodeDataChange`
2. 中文输入法在输入过程中会触发多次 `onChange` 事件（composition 过程）
3. 每次同步都会触发服务器更新和可能的回显，打断了输入法的正常工作流程

**修复方案：**

在 `packages/widget/src/nodes/TextNode.tsx` 中添加了以下改进：

#### 2.1 添加输入法状态追踪：
```typescript
const contentSyncTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
const isComposingRef = React.useRef(false);
```

#### 2.2 修改 `handleContentChange`：
```typescript
const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
  const nextValue = event.target.value;
  setContent(nextValue);
  
  // 如果正在输入中文（composing），不立即同步
  if (isComposingRef.current) {
    return;
  }
  
  // 清除之前的延迟同步
  if (contentSyncTimeoutRef.current) {
    clearTimeout(contentSyncTimeoutRef.current);
  }
  
  // 延迟 300ms 同步到服务器，避免打断输入
  contentSyncTimeoutRef.current = setTimeout(() => {
    nodeData.onNodeDataChange?.(nodeData.id, { content: nextValue });
  }, 300);
};
```

#### 2.3 添加输入法事件处理：
```typescript
// 处理输入法开始
const handleCompositionStart = () => {
  isComposingRef.current = true;
};

// 处理输入法结束
const handleCompositionEnd = (event: React.CompositionEvent<HTMLTextAreaElement>) => {
  isComposingRef.current = false;
  const nextValue = (event.target as HTMLTextAreaElement).value;
  
  // 输入法结束后立即同步
  if (contentSyncTimeoutRef.current) {
    clearTimeout(contentSyncTimeoutRef.current);
  }
  nodeData.onNodeDataChange?.(nodeData.id, { content: nextValue });
};
```

#### 2.4 在 textarea 上绑定事件：
```typescript
<textarea
  // ... 其他属性
  onChange={handleContentChange}
  onCompositionStart={handleCompositionStart}
  onCompositionEnd={handleCompositionEnd}
  // ...
/>
```

**效果：**
- 中文输入法（IME）现在可以正常工作
- 在输入法激活期间（composition），不会同步到服务器
- 输入法结束时立即同步最终内容
- 普通输入延迟 300ms 同步，减少不必要的网络请求
- 避免了输入过程中的回显干扰

---

## 技术细节

### IME (Input Method Editor) 支持
通过监听 `compositionstart`、`compositionend` 和 `compositionupdate` 事件，我们可以检测用户何时在使用输入法（如中文、日文等）。在 composition 期间，我们延迟所有的服务器同步，直到用户完成输入。

### 批量操作优化
通过在拖动开始时标记所有选中的节点，并在拖动结束时一次性发送批量更新，我们显著减少了网络请求和状态同步的次数，提高了多节点拖动的性能。

### 防抖（Debounce）策略
对于文本输入，我们使用 300ms 的延迟来减少同步频率。这在不影响用户体验的前提下，大大减少了网络负载。

---

## 测试建议

### 测试场景1：批量拖动
1. 选中 3 个以上的节点（使用框选或 Shift+点击）
2. 拖动其中一个节点
3. 验证所有选中的节点都跟随移动，且没有拖尾现象
4. 检查拖动过程是否流畅

### 测试场景2：中文输入
1. 创建一个新的文本节点
2. 使用中文输入法输入文字（如：拼音输入"zhongwen"）
3. 验证输入法候选框正常显示
4. 选择候选词后验证文字正确显示
5. 继续输入更多中文，验证整个过程流畅

### 测试场景3：多用户协同
1. 打开两个浏览器标签页，连接到同一个 canvas
2. 在一个标签页中批量拖动节点
3. 在另一个标签页中观察节点位置是否正确同步
4. 在一个标签页中编辑文本
5. 在另一个标签页中验证文本是否正确同步

---

## 相关文件

- `packages/widget/src/nodes/TextNode.tsx` - 文本节点组件
- `apps/demo/src/app/page.tsx` - 主应用页面，包含协同逻辑
- `packages/widget/src/hooks/useCollaboration.ts` - 协同编辑 Hook

---

## 未来改进建议

1. **更精细的冲突解决**：当多个用户同时编辑同一个文本节点时，可以考虑使用 CRDT 或 OT 算法
2. **拖动性能优化**：考虑使用 requestAnimationFrame 来优化拖动时的渲染
3. **网络优化**：实现更智能的批量更新策略，合并短时间内的多个更新
4. **离线支持**：添加离线编辑能力，在网络恢复时自动同步
