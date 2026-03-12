# Demo 实施方案：Text to Image / Image Edit / Product Photography

> **目标**：用三个工具完整演示 Canvas 的两种工具呈现方式（Canvas Panel + Immersive Modal），验证核心架构。
> **日期**：2026-03-10
> **前置**：基于现有 `CollaborativeCanvas.tsx` 中的 `aiCreateMode` 基础改造

---

## 为什么选这三个工具

| 工具 | 呈现方式 | 验证点 |
|------|----------|--------|
| **Text to Image** | Canvas Panel (Compact) | Prompt 驱动面板、底栏参数、⚙ Advanced 弹窗 |
| **Image Edit** | Canvas Panel (Compact) | Tab 切换（与 T2I 共享面板）、(+) 参考图上传 |
| **Product Photography** | Immersive Modal | 全屏遮罩弹窗、素材上传 Slot、Background Prompt、模板网格 |

三个工具覆盖了：
- ✅ Canvas Panel 骨架 + Tab 机制
- ✅ Immersive Modal 骨架
- ✅ A 类面板（Prompt 驱动）
- ✅ 素材上传 + Select from Board
- ✅ 底栏参数区（Model / Ratio / Resolution）
- ✅ Advanced 参数弹窗
- ✅ 模板网格浏览
- ✅ 两种入口（侧边栏 + QuickAction）

---

## 现状分析

当前 `aiCreateMode` 实现的问题：

1. **所有工具共用一个 Prompt-only 面板** — 没有底栏参数、没有上传区、没有 Tab 切换
2. **没有 Immersive Modal** — 所有工具都用同一种悬浮面板
3. **面板跟随节点但不够精确** — 用 screenX/screenY 硬算，没有考虑面板溢出视口
4. **没有工具专属状态** — 只存了 `prompt`，没有 model / ratio / resolution 等参数

---

## 实施拆分：5 个步骤

### Step 1：Canvas Panel (Compact) 通用骨架

**目标**：替换现有 `aiCreateMode` 的简易面板，建立可复用的 Canvas Panel 组件结构。

**新建文件**：`packages/widget/src/panels/CanvasPanel.tsx`

**组件结构**：

```
┌──────────────────────────────────┐
│ [Tab A]  Tab B                   │  ← TabBar（可选，≥2 个 Tab 时显示）
├──────────────────────────────────┤
│                                  │
│  {children} — 面板主体区域        │  ← 由具体工具填充（Prompt / Upload / Script）
│                                  │
├──────────────────────────────────┤
│ Param ▾ | Param ▾ | ⚙ | ⚡ Send │  ← BottomBar（参数 + Advanced + 发送）
└──────────────────────────────────┘
```

**核心 Props**：

```ts
interface CanvasPanelProps {
  nodeId: string;
  nodeScreenRect: { x: number; y: number; w: number; h: number };
  tabs?: { id: string; label: string }[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  bottomBar?: React.ReactNode;
  onClose?: () => void;
  children: React.ReactNode;
}
```

**关键行为**：
- 面板定位：在占位素材正下方，水平居中对齐，间距 12px
- 固定宽度 520px（与现有一致）
- 面板溢出视口底部时，自动切换到素材上方显示
- 点击面板外区域关闭（保留占位素材）
- 打开/关闭带 opacity + translateY 过渡动画

**改造点**：
- 从 `CollaborativeCanvas.tsx` 的 `aiCreateMode` 渲染块中提取
- 现有 `aiCreateMode` state 保留，但渲染逻辑改为调用 `<CanvasPanel>`

---

### Step 2：Text to Image 面板

**目标**：Canvas Panel 的第一个具体工具实现。

**新建文件**：`packages/widget/src/panels/TextToImagePanel.tsx`

**面板内容**：

```
┌──────────────────────────────────┐
│ [Text to Image]  Image Edit      │  ← Tab（Step 3 加入）
├──────────────────────────────────┤
│                                  │
│  Describe anything you want...   │  ← Prompt 输入（textarea，自动聚焦）
│                                  │
│                                  │
├──────────────────────────────────┤
│ Model ▾ │ 📐 ▾ │ 📏 ▾ │ ⚙ │ ⚡14│  ← 底栏
└──────────────────────────────────┘
```

**底栏参数**（5 个控件）：

| 控件 | 类型 | 默认值 | 选项（mock） |
|------|------|--------|-------------|
| Model | Dropdown | Flux | Flux / SDXL / SD3 |
| Ratio (📐) | Dropdown | 1:1 | 1:1 / 16:9 / 9:16 / 4:3 / 3:4 |
| Resolution (📏) | Dropdown | 1K | 1K / 2K / 4K |
| ⚙ Advanced | Button | — | 打开 Advanced 弹窗 |
| ⚡ Send | Button | 14 credits | 触发 `CANVAS_CREATE_ACTION` |

**工具状态**（扩展 `aiCreateMode`）：

```ts
interface AiCreateState {
  type: string;
  subActionId: string;
  nodeId: string;
  prompt: string;
  model: string;
  ratio: string;
  resolution: string;
  referenceImageUrl?: string;  // Image Edit 用
  advancedParams?: {
    steps: number;
    cfg: number;
    seed: string;
    negativePrompt: string;
  };
}
```

**事件**：
- 发送时 emit `CANVAS_CREATE_ACTION`，payload 包含所有参数
- Enter 提交（Shift+Enter 换行）

---

### Step 3：Image Edit Tab + 参考图上传

**目标**：在 Text to Image 面板基础上，加入 Tab 切换和参考图上传能力。

**改造文件**：`packages/widget/src/panels/TextToImagePanel.tsx`（加入 Tab 逻辑）

**Image Edit Tab 内容**：

```
┌──────────────────────────────────┐
│  Text to Image  [Image Edit]     │  ← 当前 Tab：Image Edit
├──────────────────────────────────┤
│ ┌────┐                           │
│ │ +  │  Describe what to edit... │  ← (+) 参考图上传 + Prompt
│ │Ref │                           │
│ └────┘                           │
├──────────────────────────────────┤
│ Model ▾ │ 📐 ▾ │ 📏 ▾ │ ⚙ │ ⚡14│
└──────────────────────────────────┘
```

**参考图上传区**（左侧 64×64）：
- 点击触发 `CANVAS_CREATE_ACTION { actionId: 'upload-reference' }` 或本地文件选择
- 上传后显示缩略图，hover 显示 × 移除
- QuickAction 进入时，自动填入当前选中素材作为参考图

**Tab 切换行为**：
- 切换时保留 Prompt 内容
- 切换时保留底栏参数
- Image Edit 的参考图在切换到 T2I 时隐藏但不清除

**QuickAction 衔接**（选中图片 → Re-edit / Remix）：
- Re-edit：打开 Image Edit Tab，自动填入原素材 URL + 原始 Prompt（如有）
- Remix：打开 Image Edit Tab，自动填入原素材作为参考图

---

### Step 4：Immersive Modal 通用骨架

**目标**：建立沉浸弹窗的可复用组件。

**新建文件**：`packages/widget/src/panels/ImmersiveModal.tsx`

**组件结构**：

```
┌──────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ [×]   │
│ ░░  ┌─────────────────────────────────────────┐  ░░ │
│ ░░  │     {title}               [Tab A][Tab B] │  ░░ │  ← 标题 + 可选 Tab
│ ░░  ├─────────────────────────────────────────┤  ░░ │
│ ░░  │                                         │  ░░ │
│ ░░  │              {children}                 │  ░░ │  ← 工具主体
│ ░░  │                                         │  ░░ │
│ ░░  ├─────────────────────────────────────────┤  ░░ │
│ ░░  │              {footer}                   │  ░░ │  ← 底部操作区
│ ░░  └─────────────────────────────────────────┘  ░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└──────────────────────────────────────────────────────┘
  ░ = 半透明遮罩 (rgba(0,0,0,0.6))，点击关闭
```

**核心 Props**：

```ts
interface ImmersiveModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  tabs?: { id: string; label: string }[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  footer?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}
```

**关键行为**：
- z-index: 100（在所有画布 UI 之上）
- 遮罩点击关闭
- Esc 关闭
- 弹窗内容区最大宽度 880px，最大高度 calc(100vh - 120px)
- 打开动画：遮罩 fade-in 200ms + 弹窗 scale(0.95→1) + opacity(0→1) 200ms
- 关闭动画：反向 150ms
- 弹窗在视口居中（排除左侧 64px 侧边栏）

**与 Canvas Panel 的关键区别**：
- Canvas Panel 跟随节点、画布可见
- Immersive Modal 固定居中、遮罩覆盖画布

---

### Step 5：Product Photography 弹窗

**目标**：Immersive Modal 的第一个具体工具实现。

**新建文件**：`packages/widget/src/panels/ProductPhotographyModal.tsx`

**弹窗内容**：

```
┌─────────────────────────────────────────┐
│        Product Photography              │
│                                         │
│  Product Image                          │
│  ┌───────────────────┐                  │
│  │       (+)         │  [✂ Adjust]      │  ← 上传区 + Cutout 入口
│  └───────────────────┘                  │
│                                         │
│  Background                             │
│  ┌───────────────────────────────────┐  │
│  │ Describe the background...        │  │  ← Background Prompt
│  └───────────────────────────────────┘  │
│                                         │
│  Or select from templates:              │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐       │
│  │🏞│ │🏞│ │🏞│ │🏞│ │🏞│ │🏞│       │  ← 模板网格
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘       │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐       │
│  │🏞│ │🏞│ │🏞│ │🏞│ │🏞│ │🏞│       │
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘       │
│                                         │
│  📐 1:1 ▾   📷 参考图(可选)   [Generate] │  ← 底部操作栏
└─────────────────────────────────────────┘
```

**组件拆解**：

| 区域 | 组件 | 说明 |
|------|------|------|
| Product Image | `<UploadSlot>` | 点击上传 / Select from Board / QuickAction 自动填入 |
| ✂ Adjust Cutout | Button | Demo 阶段仅显示按钮，点击 toast "Coming soon"（不实现二级弹窗） |
| Background Prompt | `<textarea>` | 描述背景 |
| Template Grid | `<TemplateGrid>` | 6×2 mock 模板缩略图，点击选中（高亮边框） |
| Ratio | Dropdown | 1:1 / 16:9 / 9:16 / 4:3 |
| 参考图 | 可选上传 | 小 (+) 按钮 |
| Generate | Button | 触发 `CANVAS_CREATE_ACTION` |

**入口方式**：

| 入口 | 行为 |
|------|------|
| 侧边栏 → Image → （需要把 Product Photography 加入 Image 子菜单，或单独类目） | 创建占位节点 → 打开 Immersive Modal |
| QuickAction（选中图片 → 更多菜单里可选） | 自动填入当前图片作为 Product Image → 打开 Modal |

**状态管理**：

```ts
interface ProductPhotoState {
  nodeId: string;
  productImageUrl: string;
  backgroundPrompt: string;
  selectedTemplateId?: string;
  ratio: string;
  referenceImageUrl?: string;
}
```

**事件**：
- Generate 触发 `CANVAS_CREATE_ACTION { actionId: 'product-photography', ... }`
- 关闭 Modal（× / Esc / 遮罩点击）→ 保留占位节点，清除 Modal 状态

---

## 新建文件清单

```
packages/widget/src/panels/
  ├── CanvasPanel.tsx           # Step 1 — Canvas Panel 通用骨架
  ├── ImmersiveModal.tsx        # Step 4 — Immersive Modal 通用骨架
  ├── TextToImagePanel.tsx      # Step 2+3 — T2I / Image Edit 面板
  ├── ProductPhotographyModal.tsx # Step 5 — Product Photography 弹窗
  ├── components/
  │   ├── ParamDropdown.tsx     # Step 2 — 底栏参数下拉（通用）
  │   ├── UploadSlot.tsx        # Step 3+5 — 上传素材区域（通用）
  │   ├── AdvancedModal.tsx     # Step 2 — ⚙ Advanced 参数弹窗
  │   └── TemplateGrid.tsx      # Step 5 — 模板网格（通用）
  └── index.ts                  # 导出
```

## 改造文件清单

| 文件 | 改动 |
|------|------|
| `CollaborativeCanvas.tsx` | 1. 扩展 `aiCreateMode` state 类型（增加 model/ratio/resolution 等）<br>2. `aiCreateMode` 渲染块改为条件分支：Canvas Panel 工具走 `<TextToImagePanel>`，Immersive Modal 工具走 `<ProductPhotographyModal>`<br>3. `handlePlusAction` 增加 Product Photography 的分支<br>4. 侧边栏菜单追加 Product Photography 入口 |
| `bridge.ts` | 扩展 `CANVAS_CREATE_ACTION` payload 类型，支持更多参数 |

---

## 实施顺序与依赖

```
Step 1: CanvasPanel 骨架
  │    ├─ ParamDropdown（底栏下拉组件）
  │    └─ AdvancedModal（⚙ 弹窗）
  │
  ├──→ Step 2: Text to Image 面板
  │       └─ 替换现有 aiCreateMode 渲染，可跑通完整流程
  │
  └──→ Step 3: Image Edit Tab + UploadSlot
          └─ Tab 切换 + 参考图上传 + QuickAction 衔接

Step 4: ImmersiveModal 骨架
  │
  └──→ Step 5: Product Photography 弹窗
          └─ UploadSlot（复用 Step 3）+ TemplateGrid + 完整流程
```

**可独立验证的里程碑**：

| 里程碑 | 完成 Step | 可演示内容 |
|--------|-----------|-----------|
| M1 | Step 1+2 | 侧边栏 → Text to Image → 占位节点 + 带参数的面板 → 发送 |
| M2 | Step 3 | T2I / Image Edit Tab 切换 + 参考图上传 + QuickAction 入口 |
| M3 | Step 4+5 | Product Photography 沉浸弹窗完整流程 |

---

## 设计规范速查

### 颜色 Token（沿用现有 FLOW_UI）

| Token | 值 | 用途 |
|-------|-----|------|
| panelBg | `#1c1e22` | 面板/弹窗背景 |
| panelBorder | `rgba(255,255,255,0.08)` | 面板/弹窗边框 |
| divider | `rgba(255,255,255,0.08)` | 分割线 |
| accent | `#5857FD` | 选中、激活状态 |
| sendActive | `#fff` bg + `#000` text | 发送按钮可用态 |
| sendDisabled | `rgba(255,255,255,0.08)` bg | 发送按钮禁用态 |

### 尺寸

| 元素 | 值 |
|------|-----|
| Canvas Panel 宽度 | 520px |
| Immersive Modal 最大宽度 | 880px |
| Immersive Modal 遮罩 | `rgba(0,0,0,0.6)` |
| 底栏高度 | 44px |
| Tab 高度 | 40px |
| 参数下拉宽度 | auto（内容撑开） |
| Upload Slot（小） | 64×64px |
| Upload Slot（大，Product Photo） | 100% 宽 × 160px 高 |
| Template Grid 单项 | 96×96px, gap 8px |
| 圆角 | 面板 16px / 弹窗 16px / 按钮 8px / 输入框 10px |

---

## Demo 数据

所有参数选项为 mock 数据（硬编码常量），不依赖后端 API：

```ts
const MOCK_MODELS = ['Flux', 'SDXL', 'SD3'];
const MOCK_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4'];
const MOCK_RESOLUTIONS = ['1K', '2K', '4K'];
const MOCK_PP_TEMPLATES = [
  { id: 'pp-1', label: 'Studio White', thumbnail: '/templates/studio-white.jpg' },
  { id: 'pp-2', label: 'Outdoor Natural', thumbnail: '/templates/outdoor.jpg' },
  // ... 12 个 mock 模板
];
```

发送按钮点击后的行为：
1. emit `CANVAS_CREATE_ACTION` 事件（包含全部参数）
2. 关闭面板 / Modal
3. 占位节点保留在画布上（等待宿主回调更新为实际结果）
