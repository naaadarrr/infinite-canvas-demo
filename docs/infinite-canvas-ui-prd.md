# 无限画布 (Infinite Canvas) — 产品需求文档 v6

---

## 1. 产品定位

### 1.1 是什么

**无限画布** 是 Board 的视图模式之一（Grid / Split / Grouped / **Canvas**），提供一个自由的二维空间，创作者可以在其中随意摆放、浏览和**直接创作** AI 素材（图片、视频、音频、文字）。

### 1.2 不是什么

- **不是节点流工具**（Node-flow / Workflow Editor）——没有连线、条件分支、执行管线。
- **不是设计工具**（Figma/Sketch）——不提供矢量绘图、布尔运算、组件系统。

### 1.3 核心价值

| 维度 | Grid 模式 | Canvas 模式 |
|------|----------|-------------|
| 空间 | 固定网格排列 | 自由二维空间 |
| 创作 | 左侧面板生成 → 右侧展示 | 画布即创作台，素材就地生成 |
| 组织 | 按时间/类型自动排列 | 手动拖放，空间语义分组 |
| 协作 | 各自独立操作 | 实时多人协同（光标、选中、拖拽同步） |

---

## 2. 界面布局

```
┌──────────────────────────────────────────────────────────┐
│  [Logo] My First Board ▾               [◇ Canvas] Share  │  ← 顶部栏（透明）
├──┬───────────────────────────────────────────────────────┤
│  │                                                       │
│[+]│                                                       │
│[↗]│              无限画布内容区域                            │
│[T]│          （素材节点 + 自由空间）                          │
│  │                                                       │
│  │                                                       │
│  │                                                       │
├──┴───────────────────────────────────────────────────────┤
│             [－] 15% [＋] ▸                                │  ← 底部控件
└──────────────────────────────────────────────────────────┘
```

### 2.1 顶部栏

| 属性 | 值 |
|------|-----|
| 高度 | 48px |
| 背景 | `rgba(17,17,19,0.75)` (半透明) |
| 边框 | 底部 1px solid `rgba(255,255,255,0.06)` |
| z-index | 50 |

**左侧**：
- **Logo**：32×32px 热区，24×24px 图像。Hover 显示 tooltip "Back to home"，点击直接导航回首页（发送 `CANVAS_NAVIGATE { target: 'home' }` 事件）。
- **Board 名称**：显示当前 Board 名称 + `▾` 下拉图标，点击弹出 Board 切换列表。

**右侧**：
- **Layout 按钮**：显示当前模式图标（Canvas 模式下显示无限画布图标 ◇），图标颜色为纯白 `#FFFFFF`。点击弹出 Layout 切换面板（Grid / Split / Grouped / Canvas）。
- **Share 按钮**：30px 高度圆角按钮，`<UserPlus>` 图标 + "Share" 文字。

### 2.2 左侧工具栏

| 属性 | 值 |
|------|-----|
| 位置 | 绝对定位，`left: 12px`，垂直居中 |
| 宽度 | 48px（按钮 40×40 + 四周 padding 4px） |
| 背景 | `FLOW_UI.panelBg`（`#1c1e22`） |
| 圆角 | 12px |
| z-index | 5（`+` 菜单打开时提升至 51） |

**按钮列表**（从上到下）：

所有按钮尺寸统一为 **40×40**，圆角 10px，图标 18px。

| 按钮 | 图标 | 样式 | 快捷键 | 说明 |
|------|------|------|--------|------|
| **+** (创建) | `Plus` (18px) | **反白**：白底(`#fff`) + 深色图标(`#1c1e22`)；hover: `rgba(255,255,255,0.85)` | — | 打开创建菜单面板 |
| — | — | 分割线 | — | — |
| **箭头** (编辑) | `EditModeIcon` (18px) | 标准工具按钮样式 | `V` | 切换到编辑模式；点击可在箭头/手掌之间切换 |
| **文字** | `TextModeIcon` (18px) | 标准工具按钮样式 | `T` | 切换到文字创建工具 |

> **Assets 按钮已移除**：Assets（资产）功能与 Layers 面板高度重叠——画布上的素材即为已生成的资产。V1 统一由 Layers 面板承载素材浏览和管理。V2 可考虑增加跨 Board 的 Library 功能。

> **注意**：Pan（平移）按钮已移除。平移通过以下方式实现：
> - 滚轮 / 触控板滑动
> - 鼠标中键拖拽
> - 鼠标右键拖拽
> - **Space + 拖拽**（按住空格临时切换为平移模式，松开恢复编辑模式）

### 2.3 底部控件

缩放控件区域（`bottom: 16px, left: 16px`），圆角 12px 深色面板，包含：
- 缩小 `[🔍－]`（放大镜 + 减号图标）— hover tooltip: "Zoom out (⌘ -)"
- 缩放百分比显示
- 放大 `[🔍＋]`（放大镜 + 加号图标）— hover tooltip: "Zoom in (⌘ +)"
- 分割线
- **Zoom to Selection** `[⌖]`（快捷键 `Z`）— hover tooltip: "Zoom to selection (Z)"
- **Fit to Screen** `[⬜]`（快捷键 `F`）— hover tooltip: "Fit to screen (F)"

> 所有缩放按钮 hover 时显示自定义 tooltip（含快捷键提示），统一使用 `TooltipButton` 组件。

### 2.4 Layers 面板（图层管理）

| 属性 | 值 |
|------|-----|
| 位置 | 右下角，`right: 16px, bottom: 16px` |
| 触发 | 点击右下角 `LayersIcon` 图标按钮展开/收起 |
| 面板宽度 | 260px |
| 最大高度 | 600px |

**面板结构**：

- **头部**：标题 "Layers" + 素材数量 + **收起 `ChevronDown` 图标按钮**
- **列表**：按 z-index 倒序排列的素材缩略图 + 名称
  - 支持拖拽排序（调整 z-index）
  - **点击图层项**：选中对应素材 + **自动 Zoom to Selection**（fitView 到该节点，padding: 0.3，动画 300ms）
  - 选中态：蓝紫色背景高亮 `rgba(99,102,241,0.25)`
  - Hover 态：`rgba(255,255,255,0.06)`

### 2.5 创建菜单面板（+ Menu）

点击 `+` 按钮后弹出，位于左侧工具栏右侧。

**结构**：左侧导航 + 右侧子内容

| 导航标签 | id | 子内容 |
|---------|-----|--------|
| **Image** | `ai-image` | Text to Image / Image Edit / Inpaint / Image Character Swap / Image Face Swap / Image Upscale / Photo Angle Editor |
| **Video** | `ai-video` | Image to Video / Text to Video / Omni Reference / Video Character Swap / Video Upscale / Motion Control |
| **Avatar** | `avatar` | AI Avatar / Product Avatar / Design My Avatar / Video Lip Sync |
| **Audio** | `audio` | Voiceover |
| **Upload** | `upload` | 直接触发文件上传（无子菜单） |

点击子内容项会调用 `handlePlusAction(type, subActionId)`，在画布中心创建占位节点，进入 AI 创作模式，并在节点下方显示创作面板（Prompt 输入 + 积分 + 发送按钮）。

### 2.5 Layout 切换面板

点击顶部栏 Layout 按钮弹出下拉面板，包含 4 种视图模式：

| 模式 | 图标 | 说明 |
|------|------|------|
| Grid | 四宫格 | 标准网格视图 |
| Split | 双列 | 分栏视图 |
| Grouped | 分组 | 按类型分组视图 |
| **Canvas** | 对角箭头+矩形 | 无限画布（当前激活） |

切换到非 Canvas 模式时发送 `CANVAS_LAYOUT_CHANGE { layout }` 事件。

---

## 3. 素材节点

### 3.1 节点类型

| 类型 | 组件 | 数据接口 |
|------|------|----------|
| 图片 | `ImageNode` | `ImageNodeData` |
| 视频 | `VideoNode` | `VideoNodeData` |
| 音频 | `AudioNode` | `AudioNodeData` |
| 文字 | `TextNode` | `TextNodeData` |

### 3.2 节点交互状态

| 状态 | 视觉效果 |
|------|----------|
| 默认 | 无边框，`cursor: default` |
| Hover | 蓝色边框（`2px solid rgba(59,130,246,0.5)`），`cursor: default` |
| 选中 | 蓝色边框（`2px solid #3b82f6`） + 尺寸标签 + QuickActionToolbar |
| 拖拽中 | 保持选中样式，隐藏 QuickActionToolbar |
| 骨架屏 | 加载动画，无工具栏 |
| 失败 | 错误提示 + 删除按钮 |

### 3.3 尺寸标签

选中时在节点下方显示实际像素尺寸，如 `1024 × 1024`。

---

## 4. QuickActionToolbar（素材快捷操作栏）

### 4.1 显示条件

以下条件**全部满足**时显示：

1. `elementsSelectable === true`（编辑模式）
2. 节点被**单选**（非多选）
3. 节点**未被拖拽**
4. 画布**未在缩放中**
5. 节点状态不是 `init`（骨架屏）或 `fail`（失败）

### 4.2 图片素材 (Image)

| # | 操作 | actionId | 图标 | 条件 | 说明 |
|---|------|----------|------|------|------|
| 1 | Re-edit | `edit` | `RefreshCw` | AI 生成的素材 | 重新编辑原始创作参数 |
| 2 | Remix | `reference` | `Shuffle` | 始终 | 以当前图片为参考生成新图 |
| 3 | Inpaint | `inpaint` | `Paintbrush` | 始终 | 进入局部重绘模式 |
| 4 | Generate Video | `video` | `Video` | 始终 | 图生视频 |
| 5 | Edit Angles | `edit-angles` | `RotateCw` | 始终 | 多角度生成（同一主体不同角度） |
| 6 | AI Avatar | `avatar` | `ScanFace` | 始终 | 生成 AI 虚拟人 |
| 7 | Upscale | `upscale` | `ArrowUpRight` | 始终 | 超分辨率增强 |
| 8 | **Download** | `download` | `Download` | 始终 | 下载原始图片 |

> **Inpaint** 属于 Image 类工具的子功能。在 QuickActionToolbar 中点击 Inpaint 会进入 Inpaint 编辑模式（fitView 聚焦 + 涂抹工具栏 + Prompt 输入）。
> **Download** 始终放在 QuickActionToolbar 末尾，作为最后一个操作。

### 4.3 视频素材 (Video)

| # | 操作 | actionId | 图标 | 条件 | 说明 |
|---|------|----------|------|------|------|
| 1 | Re-edit | `edit` | `RefreshCw` | AI 生成的素材 | 重新编辑原始创作参数 |
| 2 | AI Avatar | `avatar` | `ScanFace` | 始终 | 生成 AI 虚拟人视频 |
| 3 | Upscale | `upscale` | `ArrowUpRight` | 始终 | 视频超分辨率增强 |
| 4 | **Download** | `download` | `Download` | 始终 | 下载原始视频 |

### 4.4 音频素材 (Audio)

| # | 操作 | actionId | 图标 | 条件 | 说明 |
|---|------|----------|------|------|------|
| 1 | Re-edit | `edit` | `RefreshCw` | AI 生成的素材 | 重新编辑原始创作参数 |
| 2 | **Download** | `download` | `Download` | 始终 | 下载原始音频 |

> V1 保持最简，后续版本可扩展 Clone Voice、Text to Speech 等操作。

### 4.5 文字素材 (Text)

不使用 QuickActionToolbar，使用专属的 `TextToolbar`：
- 字号调节
- 加粗
- 对齐方式（左 / 中 / 右）
- 背景色

### 4.6 右键上下文菜单 (Context Menu)

在编辑模式下，右键点击素材弹出上下文菜单：

| # | 操作 | 条件 | 说明 |
|---|------|------|------|
| 1 | Forward | 成功素材 | z-index 上移一层 |
| 2 | Backward | 成功素材 | z-index 下移一层 |
| 3 | To Front | 成功素材 | z-index 置顶 |
| 4 | To Back | 成功素材 | z-index 置底 |
| — | 分割线 | — | — |
| 5 | Duplicate | 成功素材 | 复制素材到画布（偏移 20px） |
| 6 | Download | 成功素材 | 下载原始文件 |
| — | 分割线 | — | — |
| 7 | Delete | 始终 | 删除素材（红色警示色） |

### 4.7 事件机制

所有快捷操作按钮（除已移除的 Related Nodes）通过 `widgetBridge` 发送 `NODE_QUICK_ACTION` 事件：

```typescript
{
  nodeId: string;
  nodeType: 'image' | 'video' | 'audio';
  actionId: string;
  actionLabel: string;
  node: NodeSnapshot;
}
```

宿主应用监听此事件后执行对应的业务逻辑（打开编辑面板、调用 API 等）。

---

## 5. 交互模式

### 5.1 编辑模式 (Edit Mode) — 默认

| 属性 | 值 |
|------|-----|
| 触发 | 进入画布默认激活 / 按 `V` / 点击箭头按钮 |
| 光标 | `default`（箭头） |
| 素材可选 | 是 |
| 素材可拖 | 是 |
| 框选 | 左键拖空白区域 |
| 平移 | 中键/右键拖拽、滚轮、Space+拖拽 |

**交互流程**：
1. 鼠标悬停素材 → 蓝色 hover 边框
2. 点击素材 → 选中 + 显示 QuickActionToolbar + 尺寸标签
3. 拖拽素材 → 移动位置（吸附对齐辅助线）
4. 拖拽空白区域 → 框选
5. 点击空白区域 → 取消所有选中

### 5.2 临时平移 (Space + Drag)

| 属性 | 值 |
|------|-----|
| 触发 | 按住 Space 键 |
| 光标 | `grab` → `grabbing` |
| 行为 | 左键拖拽画布平移 |
| 释放 | 松开 Space 恢复编辑模式 |

> 替代原先独立的 Pan 模式按钮，减少工具栏复杂度。

### 5.3 文字创建 (Text Tool)

| 属性 | 值 |
|------|-----|
| 触发 | 点击 `T` 按钮 / 按 `T` |
| 光标 | `text` |
| 行为 | 点击画布空白处创建文字节点 |
| 退出 | 创建后自动切换回编辑模式 |

### 5.4 AI 创作模式 (AI Create Mode)

| 属性 | 值 |
|------|-----|
| 触发 | 从 `+` 菜单选择创作类型（如 Text to Image） |
| 行为 | 在画布中心创建占位节点 → 下方显示 Prompt 输入面板 |
| 退出 | 按 Esc / 点击关闭按钮 |

**创作流程**：
1. 点击 `+` 打开创建菜单
2. 选择子类型（如 "Text to Image"）
3. 画布中心出现占位节点（实色背景 + 类型图标），带选中描边
4. 节点下方出现 Prompt 输入框（多行 textarea）+ 积分显示 + 圆形发送按钮（ArrowUp 图标）
5. 输入提示词 → 点击发送 / 按 Enter
6. 发送 `CANVAS_CREATE_ACTION { actionId: subActionId, nodeId, prompt }` 事件，宿主开始生成
7. 占位节点显示进度 → 完成后替换为实际素材
8. 按 Esc 退出创作模式（占位节点保留在画布上）

**`CANVAS_CREATE_ACTION` 事件 payload**：
```typescript
{
  actionId: string;   // 具体子操作 ID，如 'text-to-image'、'image-to-video'
  nodeId: string;     // 占位节点 ID
  prompt: string;     // 用户输入的提示词
}
```

### 5.5 Inpaint 编辑模式

| 属性 | 值 |
|------|-----|
| 触发 | 选中图片 → 点击 QuickActionToolbar 中的 Inpaint 按钮 |
| 行为 | fitView 聚焦到目标图片 → 显示涂抹工具栏 + Prompt 输入面板 |
| 退出 | 按 Esc / 点击关闭按钮 |

> Inpaint 属于 Image 类工具的子功能，不是独立的工具类型。

**工具栏**：
- 画笔 / 橡皮擦
- 画笔大小滑块
- 撤销 / 重做
- 关闭按钮

### 5.6 素材选择模式 (Select Mode)

| 属性 | 值 |
|------|-----|
| 触发 | 宿主通过 `SET_SELECT_MODE` 事件激活 |
| 行为 | 可选素材显示选择遮罩，点击选中/取消 |
| 退出 | 宿主发送退出事件 |

用于宿主应用需要用户选择特定素材的场景（如 "选择参考图"）。

### 5.7 锁定模式 (Lock Mode)

| 属性 | 值 |
|------|-----|
| 触发 | 底部控件的锁定按钮 |
| 光标 | `not-allowed` |
| 行为 | 禁止所有编辑操作（选中、拖拽、创建）|

---

## 6. Grid 模式 vs Canvas 模式对照

| 维度 | Grid 模式 | Canvas 模式 |
|------|----------|-------------|
| 布局 | 自动排列（瀑布流/网格） | 自由拖放 |
| 左侧栏 | Board 导航 + 创作面板（Model/Prompt/Settings） | 精简工具栏（+/箭头/文字） |
| 创作入口 | 左侧面板直接操作 | `+` 菜单 → 画布占位节点 → Prompt 输入 |
| 素材操作 | 右键菜单 / 详情面板 | QuickActionToolbar（悬浮在素材上方） |
| 导航 | 页面滚动 | 画布平移 + 缩放 |
| 协作 | 各自独立 | 实时同步（光标、位置、选中） |
| 数据 | 共享同一 Board 数据 | 共享同一 Board 数据 |

---

## 7. 事件总线 (Widget Bridge)

所有 Canvas 与宿主之间的通信通过 `widgetBridge` 事件总线：

| 事件 | 方向 | 用途 |
|------|------|------|
| `CANVAS_NAVIGATE` | Canvas → 宿主 | 导航（home、board） |
| `CANVAS_LAYOUT_CHANGE` | Canvas → 宿主 | 切换视图模式 |
| `CANVAS_CREATE_ACTION` | Canvas → 宿主 | 创作请求 |
| `NODE_QUICK_ACTION` | Canvas → 宿主 | 素材快捷操作 |
| `NODE_SELECT_REQUEST` | Canvas → 宿主 | 素材选择确认 |
| `SET_SELECT_MODE` | 宿主 → Canvas | 进入/退出素材选择模式 |

---

## 8. 实施清单 (V1)

### 8.1 已完成

- [x] ImageNode QuickActionToolbar：移除 Related Nodes + OCR，新增 Edit Angles / AI Avatar / Upscale
- [x] VideoNode QuickActionToolbar：移除 Related Nodes，图标更新为 ScanFace / ArrowUpRight
- [x] AudioNode QuickActionToolbar：移除 Related Nodes
- [x] 左侧工具栏：移除 Pan 按钮和 Assets 按钮，保留 + / 箭头(V/H切换) / 文字
- [x] Space+拖拽临时平移：Space keydown → pan，keyup → edit
- [x] `+` 菜单标签重命名：AI Image → Image，AI Video → Video
- [x] Logo：去掉下拉菜单，hover tooltip "Back to home"，点击直接跳转首页，图像尺寸 24×24
- [x] 顶部栏：半透明背景 `rgba(17,17,19,0.75)` + `backdrop-filter: blur(12px)` + 底部分割线
- [x] `+` 按钮：反白样式（白底深色图标），40×40 尺寸与其他按钮一致
- [x] Layout 按钮：显示 Canvas 图标，灰色背景（无描边），图标颜色 `#FFFFFF` (纯白)
- [x] 默认模式：Edit（进入画布后素材立即可点击可选中）
- [x] 画布背景色：`#000000` (从 #141414 修改)
- [x] 节点选中：移除蓝色描边，仅失败状态保留红色描边
- [x] 底部控件：新增 Zoom to Selection(Z) 和 Fit to Screen(F) 按钮，带自定义 tooltip
- [x] AI Create 发送按钮：圆形 + ArrowUp 图标
- [x] Image/Video 子菜单：完整创作选项列表
- [x] Upload 标签：直接触发上传
- [x] QuickActionToolbar Bug 修复：`nodeDragThreshold` 从 1 提升至 5，确保 Edit 模式下点击选中正常
- [x] 左侧工具栏按钮统一为 40×40，面板宽度 48px，图标 18px
- [x] QuickActionToolbar：所有素材类型末尾添加 Download 按钮
- [x] QuickActionToolbar Tooltip 修复：`.tc-node-toolbar` 的 `overflow` 从 `hidden` 改为 `visible`
- [x] Layers 面板：头部增加收起 `ChevronDown` 图标按钮
- [x] Layers 面板：点击图层项自动 Zoom to Selection（fitView 聚焦到对应素材）
- [x] 缩放图标：从 +/- 改为放大镜样式（🔍+ / 🔍-），所有缩放按钮统一使用 TooltipButton 显示快捷键提示
- [x] 右键上下文菜单：新增 Duplicate 和 Download 操作（Forward/Backward/To Front/To Back + 分割线 + Duplicate + Download + 分割线 + Delete）
- [x] Assets 按钮移除：从左侧工具栏移除，V1 由 Layers 面板统一承载素材管理
- [x] `+` 菜单 Bug 修复：Image/Video 子菜单项现在正确调用 `handlePlusAction(type, subActionId)`，在画布创建占位节点并进入 AI 创作模式；`CANVAS_CREATE_ACTION` 事件携带具体 `subActionId`（如 `text-to-image`）
- [x] AI 创作面板标题：显示具体操作名称（如 "Text To Image"）而非通用 "Image"

### 8.2 待验证

- [ ] Space+拖拽平移流畅，松开后正确恢复编辑模式
- [ ] 无限画布各节点类型工具栏按钮数量和图标正确

### 8.3 后续版本 (V2+)

- [ ] 跨 Board Library（资产库）：浏览所有 Board 的素材，可导入到当前画布
- [ ] Audio QuickActionToolbar 扩展（Clone Voice / TTS / Extend）
- [ ] QuickActionToolbar "..." 溢出菜单（当操作过多时）
- [ ] 底部持久化 Prompt 输入栏
- [ ] 素材详情面板（右侧抽屉）
- [ ] 多选操作批量工具栏
