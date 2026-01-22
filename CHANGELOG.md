# 更新日志

## v0.0.2 - 2026-01-21

### ✨ 新功能

1. **音频节点支持**
   - 新增 `AudioNode` 组件，支持音频文件播放
   - 音频节点显示标题、艺术家信息和播放控件
   - 支持自动播放和循环播放配置

2. **背景颜色配置**
   - 移除了默认的背景点图案
   - 添加 `backgroundColor` 属性，支持自定义画布背景颜色
   - Demo 中添加了颜色选择器，可实时调整背景颜色

3. **数据解析功能**
   - 新增 `parseRawData` 工具函数
   - 自动解析原始数据格式并转换为画布节点
   - 支持基于 `status` 字段过滤数据（仅渲染 `status: "success"` 的项）
   - 支持 `IMAGE`/`image`、`VIDEO`、`AUDIO` 三种媒体类型

4. **4列网格布局**
   - 实现 4*n 自动布局算法
   - 可配置列数、节点尺寸、间距等参数
   - 自动计算节点位置，无需手动设置坐标

### 🎨 改进

- 优化了节点样式，统一边框和圆角设计
- 改进了 Demo 页面的头部布局，添加了颜色控制器
- 调整了默认缩放比例为 0.8，更适合多节点展示

### 📦 API 变更

#### InfiniteCanvas 组件

新增属性：
```typescript
backgroundColor?: string; // 画布背景颜色，默认 '#f5f5f5'
```

#### 新增类型

```typescript
// 音频节点数据
interface AudioNodeData extends BaseNodeData {
  type: NodeType.AUDIO;
  url: string;
  title?: string;
  artist?: string;
  autoplay?: boolean;
  loop?: boolean;
}

// 原始数据项
interface RawDataItem {
  status: string;
  mediaType: string;
  result?: {
    originImage?: { url?: string };
    originVideo?: { filePath?: string };
    originAudio?: { filePath?: string };
  };
}

// 布局配置
interface LayoutConfig {
  columns?: number;      // 每行列数，默认 4
  nodeWidth?: number;    // 节点宽度，默认 300
  nodeHeight?: number;   // 节点高度，默认 200
  gap?: number;          // 节点间距，默认 50
  startX?: number;       // 起始 X 坐标，默认 100
  startY?: number;       // 起始 Y 坐标，默认 100
}
```

#### 新增工具函数

```typescript
// 解析原始数据为画布节点
function parseRawData(
  rawData: RawDataItem[],
  layoutConfig?: LayoutConfig
): CanvasNodeData[];
```

### 📝 使用示例

```typescript
import { InfiniteCanvas, parseRawData } from '@tc/infinite-widget';
import { RawDataItem } from '@tc/infinite-core';

const rawData: RawDataItem[] = [
  {
    status: 'success',
    mediaType: 'IMAGE',
    result: { originImage: { url: 'https://example.com/image.jpg' } },
  },
  {
    status: 'success',
    mediaType: 'AUDIO',
    result: { originAudio: { filePath: 'https://example.com/audio.mp3' } },
    title: '示例音频',
  },
];

const nodes = parseRawData(rawData, {
  columns: 4,
  nodeWidth: 300,
  nodeHeight: 200,
  gap: 50,
});

<InfiniteCanvas
  nodes={nodes}
  backgroundColor="#e8f4f8"
  config={{ defaultZoom: 0.8 }}
/>
```

---

## v0.0.1 - 2026-01-21

### 🎉 初始版本

- 实现基础无限画布功能
- 支持图片、视频、文本节点
- 支持节点拖动、缩放、平移
- 基于 React Flow 构建
- Monorepo 结构（pnpm workspace）
