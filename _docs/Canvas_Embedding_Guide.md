# 画布嵌入使用指南

## 概述

当将 `InfiniteCanvas` 或 `CollaborativeCanvas` 组件嵌入到业务方 UI 时，需要确保画布容器有正确的尺寸，否则 Controls（控制器）和 MiniMap（小地图）等组件可能无法正常显示。

## 问题原因

ReactFlow 依赖容器的实际尺寸来正确渲染内部组件。如果容器尺寸为 0 或不确定，会导致：

1. Controls 按钮不可见
2. MiniMap 不显示或位置错误
3. 画布交互异常

## 解决方案

### 方案 1：使用新增的尺寸属性（推荐）

组件现在支持 `width`、`height`、`minWidth`、`minHeight` 属性：

```typescript
import { CollaborativeCanvas } from '@tc/infinite-widget';

function MyApp() {
  return (
    <CollaborativeCanvas
      canvasId={canvasId}
      userId={userId}
      rawData={mockData}
      width="100%"
      height="600px"
      minWidth="300px"
      minHeight="400px"
    />
  );
}
```

**默认值：**
- `width`: `'100%'`
- `height`: `'100%'`
- `minWidth`: `'300px'`
- `minHeight`: `'400px'`

### 方案 2：父容器设置明确高度

确保父容器有明确的高度：

```typescript
function MyApp() {
  return (
    <div style={{ height: '600px' }}>
      <CollaborativeCanvas {...props} />
    </div>
  );
}
```

### 方案 3：使用 Flex 布局

使用 flex 布局让画布占据剩余空间：

```typescript
function MyApp() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ height: '60px' }}>Header</header>
      <div style={{ flex: 1 }}>
        <CollaborativeCanvas {...props} />
      </div>
    </div>
  );
}
```

### 方案 4：使用 Grid 布局

```typescript
function MyApp() {
  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100vh' }}>
      <header>Header</header>
      <div>
        <CollaborativeCanvas {...props} />
      </div>
    </div>
  );
}
```

### 方案 5：固定视口高度

```typescript
function MyApp() {
  return (
    <div style={{ height: '100vh' }}>
      <CollaborativeCanvas {...props} />
    </div>
  );
}
```

## 最佳实践

### 1. 嵌入到现有页面

如果嵌入到已有复杂布局的页面中：

```typescript
function ComplexPage() {
  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content">
        <PageHeader />
        {/* 明确指定画布高度 */}
        <div style={{ height: 'calc(100vh - 120px)' }}>
          <CollaborativeCanvas {...props} />
        </div>
      </main>
    </div>
  );
}
```

### 2. 响应式布局

使用 CSS 变量和媒体查询：

```typescript
function ResponsivePage() {
  return (
    <div className="canvas-container">
      <CollaborativeCanvas 
        {...props}
        minHeight="400px"
        height="100%"
      />
    </div>
  );
}

// CSS
.canvas-container {
  height: 600px;
}

@media (max-width: 768px) {
  .canvas-container {
    height: 400px;
  }
}
```

### 3. 全屏模式

```typescript
function FullscreenCanvas() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div style={{ 
      height: isFullscreen ? '100vh' : '600px',
      width: '100%'
    }}>
      <button onClick={() => setIsFullscreen(!isFullscreen)}>
        切换全屏
      </button>
      <CollaborativeCanvas {...props} />
    </div>
  );
}
```

### 4. 动态高度

根据窗口大小动态调整：

```typescript
function DynamicCanvas() {
  const [height, setHeight] = useState(600);

  useEffect(() => {
    const handleResize = () => {
      // 减去头部和底部的高度
      setHeight(window.innerHeight - 200);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <CollaborativeCanvas 
      {...props}
      height={height}
    />
  );
}
```

## 常见问题

### Q: Controls 按钮不显示？

**A:** 检查容器高度是否足够。最小高度建议 400px。

```typescript
// ❌ 错误：容器高度为 0
<div>
  <CollaborativeCanvas {...props} />
</div>

// ✅ 正确：明确高度
<div style={{ height: '600px' }}>
  <CollaborativeCanvas {...props} />
</div>

// ✅ 或使用 minHeight
<CollaborativeCanvas 
  {...props}
  minHeight="600px"
/>
```

### Q: MiniMap 位置不正确？

**A:** 确保容器有明确的宽度和高度，且 `position: relative` 或以上。

```typescript
// ✅ 推荐
<div style={{ position: 'relative', width: '100%', height: '600px' }}>
  <CollaborativeCanvas {...props} />
</div>
```

### Q: 在 Modal/Dialog 中使用？

**A:** 确保 Modal 内容区域有明确高度：

```typescript
<Modal>
  <div style={{ width: '800px', height: '600px' }}>
    <CollaborativeCanvas {...props} />
  </div>
</Modal>
```

### Q: 在 Tab 中使用？

**A:** Tab 内容区域需要有高度：

```typescript
<Tabs>
  <TabPanel>
    <div style={{ height: '500px' }}>
      <CollaborativeCanvas {...props} />
    </div>
  </TabPanel>
</Tabs>
```

## 调试技巧

### 1. 检查容器尺寸

在浏览器开发者工具中检查画布容器的实际尺寸：

```javascript
// 在控制台运行
const container = document.querySelector('.your-canvas-container');
console.log('Width:', container.offsetWidth);
console.log('Height:', container.offsetHeight);
```

### 2. 添加边框调试

临时添加边框查看容器范围：

```typescript
<div style={{ 
  border: '2px solid red', 
  height: '600px' 
}}>
  <CollaborativeCanvas {...props} />
</div>
```

### 3. 使用最小尺寸

设置较大的最小尺寸确保可见性：

```typescript
<CollaborativeCanvas 
  {...props}
  minWidth="600px"
  minHeight="500px"
/>
```

## 类型定义

```typescript
interface InfiniteCanvasProps {
  // ... 其他属性
  
  /** 画布宽度，默认 '100%' */
  width?: string | number;
  
  /** 画布高度，默认 '100%' */
  height?: string | number;
  
  /** 最小宽度，默认 '300px' */
  minWidth?: string | number;
  
  /** 最小高度，默认 '400px' */
  minHeight?: string | number;
}

interface CollaborativeCanvasProps {
  // ... 其他属性
  
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

## 总结

嵌入画布组件到业务方 UI 时，关键是确保容器有明确的尺寸。推荐方案：

1. ✅ 使用组件的 `width`/`height` 属性
2. ✅ 父容器设置 `height: 'XXXpx'`
3. ✅ 使用 Flex/Grid 布局并设置父容器高度
4. ✅ 设置合理的 `minHeight` 值

避免：
- ❌ 让画布容器高度为 `auto` 且没有子元素撑开
- ❌ 在高度为 0 的容器中使用画布
- ❌ 忽略最小尺寸限制
