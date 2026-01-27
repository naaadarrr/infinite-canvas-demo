# InfiniteCanvas 容器尺寸适配问题分析与解决方案

## 问题描述

当 InfiniteCanvas 组件被嵌入到业务方 UI 后，`Controls` 和 `MiniMap` 组件可能无法正常显示。这是因为：

1. 组件容器使用了 `width: 100%, height: 100%`
2. 如果父容器没有明确的高度，组件会塌陷为 0 高度
3. ReactFlow 需要容器有明确的尺寸才能正确渲染控制器和小地图

## 当前实现

```typescript
<div
  ref={containerRef}
  className={className}
  style={{ width: '100%', height: '100%', backgroundColor, position: 'relative', ...style }}
>
  <ReactFlow>
    <Controls />
    <MiniMap />
  </ReactFlow>
</div>
```

## 解决方案

### 方案 1：添加 CSS 类和最小尺寸（推荐）

为容器添加默认的最小尺寸，确保即使父容器没有明确高度，组件也能正常显示。

### 方案 2：使用 ResizeObserver 监听

监听容器尺寸变化，确保 ReactFlow 获取正确的容器尺寸。

### 方案 3：提供尺寸 props

允许业务方通过 props 显式指定组件尺寸。

## 实施计划

1. 添加默认最小尺寸样式
2. 添加内联样式文档说明
3. 在 InfiniteCanvasProps 中添加 width/height 可选参数
4. 更新使用文档

## 业务方使用建议

```typescript
// 方式 1：父容器设置明确高度
<div style={{ height: '600px' }}>
  <InfiniteCanvas {...props} />
</div>

// 方式 2：使用 flex 布局
<div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
  <div style={{ flex: 1 }}>
    <InfiniteCanvas {...props} />
  </div>
</div>

// 方式 3：使用新增的 width/height props
<InfiniteCanvas width="100%" height="600px" {...props} />
```
