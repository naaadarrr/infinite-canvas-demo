# @tc/infinite - 无限画布库

基于 React Flow 构建的可嵌入无限画布库，支持图片、视频、文本节点的展示和交互。

## 特性

- 🖼️ **图片节点** - 支持图片展示和预览
- 🎬 **视频节点** - 支持视频在节点中预览播放
- 🎵 **音频节点** - 支持音频文件播放和控制
- 📝 **文本节点** - 支持富文本内容展示
- 🔄 **视口控制** - 支持平移、缩放操作
- 📦 **节点管理** - 支持拖动、缩放、层级堆叠
- 📐 **智能布局** - 4列网格自动布局
- 🎨 **可定制** - 灵活的配置选项，包括背景颜色
- 📊 **数据解析** - 自动解析原始数据格式
- 🤝 **多人协同** - 基于 WebSocket 的实时协作编辑
- 🔒 **节点锁定** - 防止多人同时编辑冲突
- 👥 **Presence** - 实时显示其他用户的光标和状态

## 项目结构

```
/
├── packages/
│   ├── core/          # 核心逻辑和类型定义（不依赖 React）
│   ├── widget/        # React 组件层（基于 @xyflow/react）
│   └── server/        # Cloudflare Worker 后端（协同编辑）
└── apps/
    └── demo/          # Next.js 15 演示应用
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 构建包

```bash
# 构建所有包
pnpm build

# 或分别构建
pnpm --filter @tc/infinite-core build
pnpm --filter @tc/infinite-widget build
```

### 运行演示

```bash
# 仅运行前端
pnpm dev

# 同时运行前后端（包含协同编辑功能）
pnpm dev:all
```

访问 http://localhost:3000 查看演示。

### 启用协同编辑功能

如需测试多人实时协作，请参考 [协同功能设置指南](./COLLABORATION_SETUP.md)。

## 使用示例

### 基础使用

```tsx
import { InfiniteCanvas, NodeType } from '@tc/infinite-widget';
import '@xyflow/react/dist/style.css';

function App() {
  const nodes = [
    {
      id: '1',
      type: NodeType.IMAGE,
      position: { x: 100, y: 100 },
      size: { width: 300, height: 200 },
      url: 'https://example.com/image.jpg',
    },
    {
      id: '2',
      type: NodeType.AUDIO,
      position: { x: 500, y: 100 },
      size: { width: 300, height: 120 },
      url: 'https://example.com/audio.mp3',
      title: '示例音频',
    },
  ];

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <InfiniteCanvas
        nodes={nodes}
        backgroundColor="#f5f5f5"
        config={{
          minZoom: 0.1,
          maxZoom: 4,
          defaultZoom: 1,
        }}
      />
    </div>
  );
}
```

### 使用数据解析（推荐）

```tsx
import { InfiniteCanvas } from '@tc/infinite-widget';
import { parseRawData, RawDataItem } from '@tc/infinite-core';
import '@xyflow/react/dist/style.css';

function App() {
  // 原始数据格式
  const rawData: RawDataItem[] = [
    {
      status: 'success',
      mediaType: 'IMAGE',
      result: { originImage: { url: 'https://example.com/image1.jpg' } },
    },
    {
      status: 'success',
      mediaType: 'VIDEO',
      result: { originVideo: { filePath: 'https://example.com/video1.mp4' } },
    },
    {
      status: 'success',
      mediaType: 'AUDIO',
      result: { originAudio: { filePath: 'https://example.com/audio1.mp3' } },
      title: '背景音乐',
    },
    {
      status: 'failed', // 这个不会被渲染
      mediaType: 'IMAGE',
      result: { originImage: { url: 'https://example.com/failed.jpg' } },
    },
  ];

  // 自动解析为 4 列网格布局
  const nodes = parseRawData(rawData, {
    columns: 4,
    nodeWidth: 300,
    nodeHeight: 200,
    gap: 50,
    startX: 100,
    startY: 100,
  });

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <InfiniteCanvas
        nodes={nodes}
        backgroundColor="#e8f4f8"
        config={{ defaultZoom: 0.8 }}
      />
    </div>
  );
}
```

## API 文档

### InfiniteCanvas 组件

| 属性 | 类型 | 描述 |
|------|------|------|
| `nodes` | `CanvasNodeData[]` | 节点数据数组 |
| `edges` | `Edge[]` | 边数据数组（可选） |
| `config` | `CanvasConfig` | 画布配置（可选） |
| `onNodesChange` | `(nodes: CanvasNodeData[]) => void` | 节点变化回调 |
| `onEdgesChange` | `(edges: Edge[]) => void` | 边变化回调 |

### 节点类型

- `NodeType.IMAGE` - 图片节点
- `NodeType.VIDEO` - 视频节点
- `NodeType.AUDIO` - 音频节点
- `NodeType.TEXT` - 文本节点

### 数据解析

`parseRawData` 函数可以自动将原始数据转换为画布节点：

- 只渲染 `status: "success"` 的数据项
- 支持 `IMAGE`/`image`、`VIDEO`、`AUDIO` 三种媒体类型
- 自动 4 列网格布局，无需手动计算位置
- 可配置列数、节点尺寸、间距等参数

## 开发

### 命令

```bash
# 安装依赖
pnpm install

# 构建核心包
pnpm build:core

# 构建组件包
pnpm build:widget

# 运行前端演示
pnpm dev

# 运行后端服务
pnpm dev:server

# 同时运行前后端
pnpm dev:all

# 部署后端到 Cloudflare
pnpm deploy:server

# 清理所有构建产物
pnpm clean
```

## 协同编辑

本项目支持基于 Cloudflare Workers + Durable Objects 的多人实时协作：

### 快速体验

1. 参考 [协同功能设置指南](./COLLABORATION_SETUP.md) 配置后端
2. 使用 `useCollaboration` Hook 集成到你的应用
3. 查看 [集成示例](./packages/widget/COLLABORATION_EXAMPLE.md)

### 功能特性

- ✅ **实时同步**：节点位置、状态实时广播
- ✅ **节点锁定**：拖拽时自动锁定，防止冲突
- ✅ **Presence**：显示其他用户的光标和选择状态
- ✅ **自动快照**：定期保存到 R2，支持冷启动恢复
- ✅ **断线重连**：自动重连并增量同步

### 架构

```
前端 (React + WebSocket) ←→ Worker ←→ Durable Object ←→ D1/R2
```

详细设计请参考 [需求文档](./infinite-canvas-requirements.md)。

## License
For open source projects, say how it is licensed.

## Project status
If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.
