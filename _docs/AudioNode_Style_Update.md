# AudioNode 样式更新总结

## 更新日期
2026-02-04

## 更新内容

将 `AudioNode` 的内部样式更新为类似 `AudioThumbnail` 的现代化设计，同时保持外部的拖动和缩放功能不变。

## 尺寸优化（2026-02-04）

### 问题
音频节点的默认尺寸是 `300 x 120`（宽扁形），与视频节点的正方形外观不协调，看起来很别扭。

### 解决方案
将音频节点的默认尺寸固定为 **300 x 300** 正方形。

**修改位置**: `packages/server/src/canvasRoom.ts`

```typescript
// ❌ 修改前
if (type === NodeType.AUDIO || type === NodeType.TEXT) {
  return { width: nodeWidth, height: 120 };  // 300 x 120
}

// ✅ 修改后
if (type === NodeType.AUDIO) {
  // 音频节点固定为 300x300 正方形
  return { width: 300, height: 300 };
}
if (type === NodeType.TEXT) {
  return { width: nodeWidth, height: 120 };
}
```

**效果**:
- 音频节点固定为 **300x300** 正方形
- 与视频节点的外观协调
- 内部的波形、播放按钮、文字等元素在正方形中居中显示更美观

### 自动迁移现有节点

为了让已存在的音频节点也变成 300x300，添加了自动迁移逻辑。

```typescript
// 自动修正音频节点尺寸为 300x300 正方形（迁移逻辑）
if (normalizedType === NodeType.AUDIO && existing.size) {
  const { width, height } = existing.size;
  // 如果尺寸不是 300x300，则修正
  if (width !== 300 || height !== 300) {
    updates.size = { width: 300, height: 300 };
  }
}
```

**触发时机**:
- 当音频节点数据更新时（例如任务状态变化）
- 自动将尺寸强制更新为 300x300

## 主要变更

### 1. 新增功能

#### 音频播放控制
- 添加了自定义的播放/暂停按钮
- 实现了音频进度跟踪
- 使用 `useRef` 和 `useState` 管理音频状态

#### 视觉效果
- **波形动画**：30 个垂直条形成的波形，播放时会动态跳动
- **环境光晕**：中心的模糊光晕效果，播放时会放大
- **脉冲环动画**：播放时显示两个扩散的脉冲环
- **圆形进度条**：SVG 实现的环形进度指示器
- **渐变背景**：深色渐变背景（#252525 → #1e1e1e → #181818）

### 2. 样式特点

#### 布局
- 绝对定位的内容区域，填充整个节点
- 垂直居中的紧凑布局
- 从上到下：波形 → 播放按钮 → 标题/艺术家

#### 颜色方案
- 背景：深色渐变
- 文字：白色半透明（0.7 / 0.3）
- 按钮：白色半透明背景，悬停时加深
- 波形：白色半透明（0.5）

#### 交互
- 播放按钮使用 `nodrag nopan nowheel` 类名防止拖拽冲突
- 添加了 `onPointerDown` 和 `onMouseDown` 的 `stopPropagation`
- 悬停时按钮背景色变化

### 3. 动画实现

#### CSS 关键帧动画
```css
@keyframes wave {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.5); }
}

@keyframes ping {
  75%, 100% {
    transform: scale(1.2);
    opacity: 0;
  }
}
```

#### 波形动画
- 每个条形独立动画
- 延迟时间：`i * 50ms`
- 持续时间：1.5s
- 缓动函数：ease-in-out

#### 脉冲环动画
- 两个环，不同大小和延迟
- 持续时间：2s / 2.5s
- 缓动函数：cubic-bezier(0, 0, 0.2, 1)

### 4. 状态管理

#### 本地状态
```typescript
const audioRef = useRef<HTMLAudioElement>(null);
const [isPlaying, setIsPlaying] = useState(false);
const [progress, setProgress] = useState(0);
```

#### 事件监听
- `timeupdate`：更新进度
- `ended`：重置状态
- `pause`：更新播放状态
- `play`：更新播放状态

### 5. 防止交互冲突

#### 拖拽冲突处理
- 播放按钮使用 `className="nodrag nopan nowheel"`
- 添加 `onPointerDown={(e) => e.stopPropagation()}`
- 添加 `onMouseDown={(e) => e.stopPropagation()}`

#### 保留的外部功能
- ✅ 节点拖动（外层容器）
- ✅ 节点缩放（四角缩放点）
- ✅ 右键菜单
- ✅ 选中高亮
- ✅ 工具栏显示
- ✅ 评分徽章

## 文件修改清单

### 1. `/packages/widget/src/nodes/AudioNode.tsx`
- 新增导入：`useState`, `useRef`, `useEffect`, `Play`, `Pause`
- 新增常量：`defaultWaveformHeights`
- 新增状态：`audioRef`, `isPlaying`, `progress`
- 新增函数：`togglePlay`
- 新增副作用：音频事件监听
- 重写渲染：完整的音频播放器 UI

### 2. `/packages/widget/src/styles.css`
- 新增 `@keyframes wave` 动画
- 新增 `@keyframes ping` 动画

## 技术细节

### 进度计算
```typescript
setProgress((audio.currentTime / audio.duration) * 100);
```

### SVG 圆形进度
```typescript
strokeDasharray={`${2 * Math.PI * 36}`}
strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
```

### 条件动画
```typescript
animation: isPlaying ? `wave 1.5s ease-in-out infinite` : 'none'
```

## 兼容性说明

- ✅ 保持了原有的 `AudioNodeData` 接口
- ✅ 保持了原有的 props 传递
- ✅ 保持了失败和骨架屏状态的渲染
- ✅ 保持了评分、工具栏等功能
- ✅ 保持了缩放和拖动功能

## 用户体验改进

1. **视觉吸引力**：现代化的深色主题设计
2. **反馈清晰**：播放状态有明确的视觉反馈
3. **交互流畅**：动画过渡自然，无卡顿
4. **信息层次**：标题、艺术家、类型信息清晰分层
5. **操作便捷**：大号播放按钮，易于点击

## 错误修复（2026-02-04）

### 问题 1: 样式冲突警告
**错误信息**: "Updating a style property during rerender (animation) when a conflicting property is set (animationDelay)"

**原因**: 不能同时使用 `animation` 简写属性和 `animationDelay` 属性

**解决方案**: 将所有动画属性拆分为独立属性
```typescript
// ❌ 错误
animation: 'wave 1.5s ease-in-out infinite',
animationDelay: '500ms',

// ✅ 正确
animationName: 'wave',
animationDuration: '1.5s',
animationTimingFunction: 'ease-in-out',
animationIterationCount: 'infinite',
animationDelay: '500ms',
```

### 问题 2: 音频源错误
**错误信息**: "The element has no supported sources" / "Audio loading error: {}"

**原因**: 
1. `nodeData.url` 可能为空或无效
2. 音频加载失败时没有错误处理
3. 错误日志不够详细，无法定位问题

**解决方案**:
1. 添加 `hasError` 状态跟踪音频错误
2. 条件渲染 `<audio>` 元素（仅在有 URL 时渲染）
3. 添加 `error` 和 `loadedmetadata` 事件监听
4. 播放失败时使用 `.catch()` 捕获错误
5. 错误状态下禁用播放按钮并显示视觉反馈
6. **改进错误日志**，提供详细的错误信息

```typescript
// 新增状态
const [hasError, setHasError] = useState(false);

// 详细的错误处理
const handleError = () => {
  const error = audio.error;
  const errorDetails = {
    code: error?.code,
    message: error?.message,
    url: nodeData.url,
    networkState: audio.networkState,
    readyState: audio.readyState,
  };
  
  // 错误代码说明
  const errorMessages: Record<number, string> = {
    1: 'MEDIA_ERR_ABORTED - 加载被中止',
    2: 'MEDIA_ERR_NETWORK - 网络错误',
    3: 'MEDIA_ERR_DECODE - 解码错误',
    4: 'MEDIA_ERR_SRC_NOT_SUPPORTED - 不支持的音频格式或源',
  };
  
  console.error('Audio loading error:', {
    ...errorDetails,
    errorType: error?.code ? errorMessages[error.code] : 'Unknown error',
  });
  
  setHasError(true);
  setIsPlaying(false);
};

// 播放错误处理
audio.play().catch((error) => {
  console.error('Audio play error:', {
    error,
    name: error.name,
    message: error.message,
    url: nodeData.url,
    readyState: audio.readyState,
    networkState: audio.networkState,
  });
  setHasError(true);
  setIsPlaying(false);
});

// 条件渲染
{nodeData.url && <audio ref={audioRef} src={nodeData.url} />}

// 错误状态视觉反馈
{hasError ? '无法加载音频' : nodeData.title || '音频文件'}
```

**错误代码说明**:
- `code: 1` - MEDIA_ERR_ABORTED: 用户中止了加载
- `code: 2` - MEDIA_ERR_NETWORK: 网络错误导致加载失败
- `code: 3` - MEDIA_ERR_DECODE: 音频解码失败（格式损坏）
- `code: 4` - MEDIA_ERR_SRC_NOT_SUPPORTED: 不支持的音频格式或无效的源

## 注意事项

1. 隐藏的 `<audio>` 元素通过 `ref` 控制，不使用原生控件
2. 所有交互元素都添加了防止拖拽冲突的处理
3. 动画仅在播放时激活，暂停时静止以节省性能
4. 进度条使用 SVG 实现，性能优于 Canvas
5. 样式使用内联 style，避免 CSS 模块冲突
6. **动画属性必须拆分**，不能使用简写和单独属性混合
7. **音频源必须验证**，添加完整的错误处理机制
8. 错误状态下按钮显示红色并禁用

## 后续优化建议

1. 考虑添加音量控制
2. 考虑添加播放速度控制
3. 考虑添加波形可视化（基于实际音频数据）
4. 考虑添加拖动进度条功能
5. 考虑添加键盘快捷键支持（空格播放/暂停）
