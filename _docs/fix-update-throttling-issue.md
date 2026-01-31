# 修复：节点更新延迟同步问题

## 问题描述

用户在进行以下操作时，更新没有立即同步到其他客户端：
- 打星星（rating）
- 修改文本内容
- 更新文本样式
- 修改状态
- 调整图层顺序

这些更新只有在拖动节点时才会被发送，导致协作体验不佳。

## 根本原因

在 `useCollaboration.ts` 中，`updateNodes` 方法使用了 `throttledUpdateNodes`，该函数对所有更新都应用了 33ms 的节流：

```typescript
const throttledUpdateNodes = useRef(
  throttle((updates: Array<{ nodeId: string; updates: Partial<CanvasNodeData> }>) => {
    send({
      type: MessageType.UPDATE_NODES,
      updates,
    });
  }, 33) // ~30 fps
).current;

const updateNodes = useCallback(
  (updates: Array<{ nodeId: string; updates: Partial<CanvasNodeData> }>) => {
    if (updates.length === 0) {
      return;
    }
    throttledUpdateNodes(updates); // 所有更新都被节流
  },
  [throttledUpdateNodes]
);
```

### 节流的影响

节流函数的工作原理：
1. 第一次调用时，设置一个 33ms 的定时器
2. 在这 33ms 内的所有后续调用，只保存最后一次的参数
3. 33ms 后，执行最后一次保存的调用

这导致：
- 用户点击星星后，更新被延迟 33ms
- 如果没有其他触发（如拖动），更新可能一直被积压
- 只有在拖动结束时，积压的更新才会被发送

## 解决方案

### 1. 添加 `immediate` 参数

修改 `updateNodes` 方法，增加一个可选的 `immediate` 参数：

```typescript
const updateNodes = useCallback(
  (updates: Array<{ nodeId: string; updates: Partial<CanvasNodeData> }>, immediate = false) => {
    if (updates.length === 0) {
      return;
    }
    if (immediate) {
      // 立即发送，不使用节流
      send({
        type: MessageType.UPDATE_NODES,
        updates,
      });
    } else {
      // 使用节流（用于拖动等高频更新）
      throttledUpdateNodes(updates);
    }
  },
  [throttledUpdateNodes, send]
);
```

### 2. 更新类型定义

```typescript
export interface CollaborationState {
  // ... 其他字段
  updateNodes: (
    updates: Array<{ nodeId: string; updates: Partial<CanvasNodeData> }>, 
    immediate?: boolean
  ) => void;
  // ... 其他方法
}
```

### 3. 在调用点使用 `immediate: true`

在 `CollaborativeCanvas.tsx` 中，对于需要立即同步的更新，使用 `immediate: true`：

#### 数据更新（rating, content, status 等）
```typescript
if (dataUpdates.length > 0) {
  // 对于数据更新（如 rating, content, status 等），立即发送，不使用节流
  collab.updateNodes(dataUpdates, true);
}
```

#### 依赖关系焦点更新
```typescript
if (updates.length > 0) {
  // 依赖关系焦点是UI状态，应立即同步
  collabRef.current?.updateNodes(updates, true);
}
```

#### 图层顺序（zIndex）更新
```typescript
if (pendingUpdates.length > 0) {
  // zIndex 调整应立即同步
  collab.updateNodes(pendingUpdates, true);
}
```

#### 位置更新（保持节流）
```typescript
// 位置更新不需要立即发送，使用默认节流
collab.updateNodes(updates); // immediate 默认为 false
```

## 修改的文件

### 1. `packages/widget/src/hooks/useCollaboration.ts`
- 修改 `CollaborationState` 接口，增加 `immediate` 参数
- 修改 `updateNodes` 方法实现

### 2. `packages/widget/src/CollaborativeCanvas.tsx`
- 数据更新调用（行 1247）：`collab.updateNodes(dataUpdates, true)`
- 依赖焦点调用（行 456）：`collabRef.current?.updateNodes(updates, true)`
- zIndex 调用（行 1544）：`collab.updateNodes(pendingUpdates, true)`

## 更新类型与处理策略

| 更新类型 | immediate | 原因 |
|---------|-----------|------|
| rating（打星星） | ✅ true | 用户主动操作，期望立即生效 |
| content（文本内容） | ✅ true | 用户主动操作，期望立即生效 |
| status（状态） | ✅ true | 状态变化应立即同步 |
| zIndex（图层） | ✅ true | 用户主动操作，影响显示顺序 |
| dependencyFocus | ✅ true | UI状态，应立即同步 |
| position（非拖动） | ❌ false | 可以容忍轻微延迟，使用节流减少消息 |
| position（拖动中） | ❌ false | 高频更新，必须使用节流 |
| size（调整尺寸） | ✅ true | 包含在 dataUpdates 中 |

## 性能考虑

### 为什么不是所有更新都立即发送？

1. **位置更新的高频特性**：
   - 拖动节点时，每次鼠标移动都会触发位置更新
   - 如果不节流，会产生大量WebSocket消息（每秒30-60条）
   - 节流可以将其降低到每秒30条左右

2. **数据更新的低频特性**：
   - 用户点击星星、修改文本等操作频率很低
   - 通常每次操作后几秒内不会再次操作同一属性
   - 立即发送不会造成性能问题

### 优化效果

- **立即同步**：rating, content, status, zIndex 等用户可感知的操作
- **节流同步**：position 等高频连续的操作
- **最佳体验**：既保证了响应速度，又控制了消息频率

## 测试场景

### ✅ 应该立即同步的场景

1. **打星星**
   - 用户A点击星星评分
   - 用户B应该立即看到评分变化

2. **修改文本**
   - 用户A编辑文本节点内容
   - 用户B应该立即看到文本更新

3. **调整图层**
   - 用户A通过右键菜单调整节点层级
   - 用户B应该立即看到显示顺序变化

4. **状态变化**
   - ExternalCommand 更新节点状态
   - 所有用户应该立即看到状态更新

### ✅ 保持节流的场景

1. **拖动节点**
   - 用户A拖动节点
   - 用户B看到平滑的拖动动画（30fps）
   - 不会因为过多消息造成卡顿

2. **批量拖动**
   - 用户A拖动多个选中的节点
   - 所有节点同步更新，平滑移动

## 向后兼容性

- `immediate` 参数是可选的，默认值为 `false`
- 不传递该参数的现有代码继续使用节流行为
- 不影响现有功能

## 日期

2026-01-31
