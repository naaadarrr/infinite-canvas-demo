# 画布容器尺寸适配总结

## 修改内容

### 1. InfiniteCanvas 组件更新

**文件**: `packages/widget/src/InfiniteCanvas.tsx`

#### 新增属性

在 `InfiniteCanvasProps` 接口中添加了 4 个新的尺寸控制属性：

```typescript
export interface InfiniteCanvasProps {
  // ... 原有属性
  
  /** 画布宽度，默认 '100%' */
  width?: string | number;
  
  /** 画布高度，默认 '100%' */
  height?: string | number;
  
  /** 最小宽度，默认 '300px' */
  minWidth?: string | number;
  
  /** 最小高度，默认 '400px' */
  minHeight?: string | number;
}
```

#### 默认值设置

```typescript
export function InfiniteCanvas({
  // ... 其他参数
  width = '100%',
  height = '100%',
  minWidth = '300px',
  minHeight = '400px',
}: InfiniteCanvasProps)
```

#### 容器样式应用

```typescript
const containerStyle: React.CSSProperties = {
  width,
  height,
  minWidth,
  minHeight,
  backgroundColor,
  position: 'relative',
  ...style,  // 用户自定义样式可以覆盖
};
```

### 2. CollaborativeCanvas 组件更新

**文件**: `packages/widget/src/CollaborativeCanvas.tsx`

#### 新增属性

在 `CollaborativeCanvasProps` 接口中添加了相同的 4 个尺寸控制属性：

```typescript
export interface CollaborativeCanvasProps {
  // ... 原有属性
  
  /** 画布宽度，默认 '100%' */
  width?: string | number;
  
  /** 画布高度，默认 '100%' */
  height?: string | number;
  
  /** 最小宽度，默认 '300px' */
  minWidth?: string | number;
  
  /** 最小高度，默认 '400px' */
  minHeight?: string | number;
}
```

#### 属性传递

将这些属性传递给内部的 `InfiniteCanvas` 组件：

```typescript
<InfiniteCanvas
  // ... 其他属性
  width={width}
  height={height}
  minWidth={minWidth}
  minHeight={minHeight}
/>
```

## 问题解决

### 问题描述

当画布组件嵌入到业务方 UI 后，可能出现：

1. ✗ Controls（控制按钮）不可见
2. ✗ MiniMap（小地图）不显示或位置错误
3. ✗ 画布区域高度为 0，完全不可见

### 根本原因

ReactFlow 依赖容器的实际尺寸来渲染。如果父容器没有明确高度，容器会塌陷为 0 高度。

### 解决方案

提供了三层解决方案：

1. **组件层面**: 添加 width/height/minWidth/minHeight props
2. **默认值保护**: 设置合理的最小高度（400px）
3. **灵活性**: 支持 string（如 '100%'）和 number（如 600）类型

## 使用方式

### 方式 1: 使用新增的 props（推荐）

```typescript
<CollaborativeCanvas
  canvasId="canvas-1"
  userId="user-1"
  rawData={data}
  width="100%"
  height="600px"
  minHeight="400px"
/>
```

### 方式 2: 父容器设置高度

```typescript
<div style={{ height: '600px' }}>
  <CollaborativeCanvas
    canvasId="canvas-1"
    userId="user-1"
    rawData={data}
  />
</div>
```

### 方式 3: Flex 布局

```typescript
<div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
  <header style={{ height: '60px' }}>头部</header>
  <div style={{ flex: 1 }}>
    <CollaborativeCanvas {...props} />
  </div>
</div>
```

## 兼容性

### 向后兼容

✅ 完全向后兼容，不会影响现有代码：

- 所有新增属性都是可选的
- 默认值与原有行为一致（width: '100%', height: '100%'）
- 用户的 style prop 可以覆盖新增的样式

### 类型安全

✅ TypeScript 类型定义完整：

```typescript
width?: string | number;     // '100%' 或 600
height?: string | number;    // '80vh' 或 800
minWidth?: string | number;  // '300px' 或 300
minHeight?: string | number; // '400px' 或 400
```

## 测试建议

### 场景 1: 基本嵌入

```typescript
// 测试用例
<CollaborativeCanvas 
  width="100%" 
  height="600px" 
  {...props} 
/>

// 预期结果
- 画布高度为 600px
- Controls 和 MiniMap 正常显示
```

### 场景 2: 最小高度保护

```typescript
// 测试用例
<div style={{ height: '100px' }}>
  <CollaborativeCanvas minHeight="400px" {...props} />
</div>

// 预期结果
- 画布高度为 400px（不会塌陷到 100px）
```

### 场景 3: 响应式

```typescript
// 测试用例
<CollaborativeCanvas 
  height={windowHeight - 100} 
  minHeight="400px"
  {...props} 
/>

// 预期结果
- 窗口缩小时，画布高度不会小于 400px
```

### 场景 4: 全屏

```typescript
// 测试用例
<CollaborativeCanvas 
  height="100vh" 
  {...props} 
/>

// 预期结果
- 画布占据整个视口高度
```

## 文档更新

创建了以下文档：

1. **InfiniteCanvas_Container_Size_Fix.md**
   - 问题分析
   - 解决方案说明
   - 实施计划

2. **Canvas_Embedding_Guide.md**
   - 完整使用指南
   - 多种场景的解决方案
   - 常见问题 FAQ
   - 调试技巧

3. **Canvas_Embedding_Examples.tsx**
   - 10 个实际使用示例
   - 涵盖各种布局场景
   - 可直接复制使用的代码

## 注意事项

### ⚠️ 重要提示

1. **最小高度**: 建议设置 `minHeight` 至少 `400px`，确保 Controls 和 MiniMap 有足够空间显示

2. **父容器高度**: 如果使用默认的 `height="100%"`，必须确保父容器有明确高度

3. **Flex 布局**: 使用 `flex: 1` 时，父容器必须有高度且为 flex 容器

4. **单位**: 
   - 使用 string 时需要带单位：`'600px'`、`'80vh'`、`'100%'`
   - 使用 number 时会被视为像素值：`600` → `'600px'`

5. **样式覆盖**: 如果同时使用 `height` prop 和 `style={{ height: ... }}`，后者会覆盖前者

## 优势

### ✅ 灵活性

- 支持多种尺寸单位（px、%、vh、vw 等）
- 可以动态调整尺寸
- 与现有样式系统兼容

### ✅ 易用性

- 默认值合理，开箱即用
- 类型提示完整
- 向后兼容

### ✅ 健壮性

- 最小尺寸保护
- 防止容器塌陷
- 适配各种布局方式

## 下一步

### 可选优化

1. **ResizeObserver**: 
   - 监听容器尺寸变化
   - 自动调整 ReactFlow 视口
   - 提高响应式体验

2. **预设尺寸**:
   - 提供常用尺寸预设（small、medium、large）
   - 简化配置

3. **自适应模式**:
   - 根据内容自动调整画布尺寸
   - 智能计算最佳显示尺寸

### 文档增强

1. 添加视频教程
2. 在 Storybook 中添加示例
3. 更新 API 文档
4. 添加性能优化建议

## 总结

通过添加 4 个简单的 props（width、height、minWidth、minHeight），我们解决了画布组件嵌入到业务方 UI 时可能遇到的尺寸问题。这个方案：

- ✅ 简单易用
- ✅ 向后兼容
- ✅ 类型安全
- ✅ 灵活强大
- ✅ 有完整文档和示例

业务方可以根据自己的需求选择最合适的集成方式。
