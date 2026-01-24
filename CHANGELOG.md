# 更新日志

## v0.0.3 - 2026-01-24

### 🐛 重要修复

1. **WebSocket 连接稳定性修复**
   - 修复 WebSocket 错误处理不完善的问题
   - 添加详细的错误日志(包括 URL、readyState、canvasId)
   - 添加 try-catch 保护 WebSocket 创建过程
   - 改进 onclose 日志,显示关闭代码和原因

2. **修复 React Hooks 循环依赖**
   - **关键修复**: PING/PONG 消息处理不再使用 `send` 函数
   - 避免了 `connect` → `onMessage` → `send` 的循环依赖
   - 修复了错误堆栈指向错误位置的问题
   - 在 JOIN 消息发送时添加 try-catch 保护

3. **改进连接状态管理**
   - 断线时不再清空节点数据,等待重连后恢复
   - 断线提示从"已离开房间"改为"连接断开,正在重连..."
   - 区分"主动离开"和"断线重连"两种场景
   - 连接成功时不显示多余的 toast

4. **修复 sync_state 处理逻辑**
   - 初始化 `knownUsers` 时正确排除当前用户
   - 只在房间为空且未 seeded 时才调用 `seedCanvas`
   - 添加详细的日志输出(节点数、用户数)
   - 避免重复的"进入房间"/"离开房间"提示

5. **改进用户进出提示**
   - 避免在断线重连时显示大量"离开房间"提示
   - 只在真正的用户进出时才显示提示
   - presence_update 消息处理逻辑更清晰

### 🔧 技术改进

- 改进 WebSocket readyState 检查
- 添加连接状态日志便于调试
- 优化重连策略和状态管理
- 添加更多边界条件检查

### 📚 文档

- 新增 [WEBSOCKET_FIX.md](./WEBSOCKET_FIX.md) - 详细的问题分析和修复说明
- 新增 [QUICK_FIX.md](./QUICK_FIX.md) - 快速修复指南
- 新增 [test-websocket.html](./test-websocket.html) - 独立的 WebSocket 连接测试工具

### 🔍 问题诊断

如果遇到连接问题,请使用新增的测试工具:
```bash
open test-websocket.html
```

或查看浏览器控制台,现在会显示详细的连接日志。

---

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
