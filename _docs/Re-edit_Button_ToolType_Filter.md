# Re-edit Button with toolType Filter Implementation

## 更新日期
2026-02-04

## 概述

为 ImageNode、VideoNode 和 AudioNode 添加了 Re-edit 快捷操作按钮，并实现了基于 `toolType` 的过滤逻辑：
- 当 `toolType === "user-upload"` 时，**不显示** Re-edit 按钮
- 对于其他所有 toolType，**显示** Re-edit 按钮

## 实现逻辑

### 核心过滤条件

```typescript
// Re-edit 按钮 - 仅当 toolType 不是 "user-upload" 时显示
if (rawItem?.toolType !== 'user-upload') {
  actions.push({
    id: 'edit',
    label: 'Re-edit',
    icon: Pen,
    onClick: () => { /* ... */ }
  });
}
```

### 关键点

1. **数据来源**: 从 `rawItem?.toolType` 获取 toolType 值
2. **过滤方式**: 使用条件判断 `!== 'user-upload'`
3. **独立判断**: toolType 的判断与 mediaType 的菜单过滤是**独立的**，两者是**交集方式**来过滤

## 修改的文件

### 1. ImageNode.tsx

**文件路径**: `/packages/widget/src/nodes/ImageNode.tsx`

**修改内容**:
1. 导入 `Pen` 图标: `import { Info, Pen } from 'lucide-react';`
2. 将 `quickActions` 从静态数组改为 `useMemo` 动态构建
3. 添加 Re-edit 按钮的条件渲染逻辑

```typescript
// 构建快捷操作菜单
const quickActions: QuickAction[] = React.useMemo(() => {
  const actions: QuickAction[] = [];
  
  // Re-edit 按钮 - 仅当 toolType 不是 "user-upload" 时显示
  if (rawItem?.toolType !== 'user-upload') {
    actions.push({
      id: 'edit',
      label: 'Re-edit',
      icon: Pen,
      onClick: () => {
        const { onNodeDataChange: _ignore, ...nodeSnapshot } = nodeData;
        widgetBridge.emit(
          createWidgetEvent(
            'NODE_QUICK_ACTION',
            {
              nodeId: nodeData.id,
              nodeType: nodeData.type,
              actionId: 'edit',
              actionLabel: 'Re-edit',
              node: nodeSnapshot,
            },
            { source: 'ui' }
          )
        );
      },
    });
  }
  
  // 依赖关系线开关按钮
  actions.push({
    id: 'dependency',
    label: 'Related Nodes',
    icon: Info,
    onClick: () => toggleNode(nodeData.id),
    active: isDependencyFocus,
  });
  
  return actions;
}, [rawItem?.toolType, nodeData, toggleNode, isDependencyFocus]);
```

### 2. VideoNode.tsx

**文件路径**: `/packages/widget/src/nodes/VideoNode.tsx`

**修改内容**:
1. 导入 `Pen` 图标: `import { Info, Play, Pause, Pen } from 'lucide-react';`
2. 与 ImageNode 相同的 quickActions 构建逻辑

### 3. AudioNode.tsx

**文件路径**: `/packages/widget/src/nodes/AudioNode.tsx`

**修改内容**:
1. 导入 `Pen` 图标: `import { Info, Play, Pause, Pen } from 'lucide-react';`
2. 与 ImageNode 相同的 quickActions 构建逻辑

## 事件通信

Re-edit 按钮点击时，会通过 `widgetBridge` 发送 `NODE_QUICK_ACTION` 事件：

```typescript
{
  type: 'NODE_QUICK_ACTION',
  payload: {
    nodeId: string,
    nodeType: string,
    actionId: 'edit',
    actionLabel: 'Re-edit',
    node: NodeSnapshot
  },
  metadata: {
    source: 'ui'
  }
}
```

## 使用场景示例

### 场景 1: AI 生成的图片（显示 Re-edit）

```json
{
  "toolType": "text-to-image",
  "mediaType": "IMAGE",
  "status": "success"
}
```

**结果**: ✅ 显示 Re-edit 按钮

### 场景 2: 用户上传的图片（隐藏 Re-edit）

```json
{
  "toolType": "user-upload",
  "mediaType": "IMAGE",
  "status": "success"
}
```

**结果**: ❌ 不显示 Re-edit 按钮

### 场景 3: AI 生成的视频（显示 Re-edit）

```json
{
  "toolType": "text-to-video",
  "mediaType": "VIDEO",
  "status": "success"
}
```

**结果**: ✅ 显示 Re-edit 按钮

### 场景 4: 用户上传的视频（隐藏 Re-edit）

```json
{
  "toolType": "user-upload",
  "mediaType": "VIDEO",
  "status": "success"
}
```

**结果**: ❌ 不显示 Re-edit 按钮

## 性能优化

使用 `React.useMemo` 优化 quickActions 数组的构建：
- 仅在依赖项变化时重新计算
- 依赖项: `[rawItem?.toolType, nodeData, toggleNode, isDependencyFocus]`
- 避免不必要的重新渲染

## 注意事项

1. **toolType 优先级**: toolType 的判断独立于 mediaType，两者是交集过滤
2. **空值处理**: 使用可选链 `rawItem?.toolType` 安全访问
3. **事件传递**: Re-edit 按钮需要配合外部的事件监听器（如 InfiniteLayout）才能完整工作
4. **图标选择**: 使用 `Pen` 图标表示编辑操作
5. **按钮顺序**: Re-edit 按钮显示在 Related Nodes 按钮之前

## 测试建议

1. **功能测试**:
   - 测试 `toolType: "user-upload"` 的节点不显示 Re-edit 按钮
   - 测试其他 toolType 的节点显示 Re-edit 按钮
   - 测试 Re-edit 按钮点击后事件是否正确发送

2. **边界测试**:
   - 测试 `rawItem` 为 `undefined` 的情况
   - 测试 `toolType` 为 `undefined` 的情况
   - 测试 `toolType` 为其他值（如 "text-to-image", "image-edit" 等）的情况

3. **集成测试**:
   - 测试与 InfiniteLayout 的事件监听器集成
   - 测试 Re-edit 功能是否能正确打开工具面板并填充参数

## 相关文档

- [InfiniteLayout Quick Actions Implementation](./_docs/InfiniteLayout_QuickActions_Implementation.md)
- [Quick Actions Summary](./_docs/InfiniteLayout_QuickActions_Summary.md)
- [Quick Actions Quick Reference](./_docs/InfiniteLayout_QuickActions_Quick_Reference.md)
