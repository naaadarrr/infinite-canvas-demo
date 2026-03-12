# 无限画布与 Board 关系分析

> **文档版本**: v3
> **日期**: 2026-03-10
> **分析基于**: PRD v14、现有代码（`@tc/infinite-widget`、`@tc/infinite-core`）、事件桥接合约、宿主截图与讨论确认。
> **工具总数**: 21（20 进 Canvas，1 个 Grid-Only）

---

## 无限画布的产品方向共识

> **写给所有参与无限画布产品和开发的团队成员。** 这一节是我们做所有后续设计、开发、优先级决策的思想基础，请先读完再往下看细节。

### 我们在造什么

无限画布不是"更花哨的 Grid"，也不是 Grid 的替代品。

**Grid 解决的是管理问题**：我有一堆素材，需要找到、整理、批量处理它们。
**Canvas 解决的是创作问题**：我有一个创作任务，需要边想边做——把素材、灵感、生成结果铺在一块空间里，建立关联，推进创作。

两个视图共享同一批素材和工具，但目标场景截然不同：

```
Grid  →  我需要管理大量素材（排序 / 筛选 / 批量下载 / 找历史）
Canvas →  我需要在创作过程中组织思路（放图 / 生图 / 对比 / 协作 / 迭代）
```

**Canvas 的核心价值是"空间即思维"** — 把人物照放左边、商品放右边、成品放中间，用空间位置本身来表达创作意图；团队成员能实时看到彼此在做什么，协作从被动变主动。

---

### Q1：无限画布和 Board 是什么关系？做成一个 View，还是独立平行功能？

> **结论：当前阶段做成 Board 的 View**（与 Grid / Split / Grouped 同级）。

Canvas 与 Board 共用同一份素材数据，好处是：
- Grid 里生成的素材自动出现在 Canvas；Canvas 里生成的素材也在 Grid 可见，**两个视图的内容天然一致**
- 宿主已接入的 ~20 个 AI 工具无需重新开发，**直接复用**
- 同一个 Board 可以随时在 Grid 和 Canvas 之间切换，**用户没有割裂感**

**代价**：Canvas 若未来需要"连线/分区/画框"等高级空间能力，现有架构会逐步受限。但这个演进路径是开放的，事件桥架构支持将来升级为独立项目类型，而不需要推倒重来。

---

### Q2：Board 现有的组件和能力，在 Canvas 里应该怎么映射？

> **结论：能在画布上直接操作的保留并强化；依赖列表/结构化管理的留在 Grid。**

三类关系一句话解释：

| 类型 | 例子 | 原则 |
|------|------|------|
| ✅ **互逆（两边都有）** | 素材本体、任务状态、评分、多选/批量下载 | 同一批素材在两种视图都能完成核心动作，交互方式可以不同（Grid 用 checkbox，Canvas 用框选），但功能等价 |
| 🔴 **Grid Only（只在 Grid）** | 筛选/排序/置顶/历史时间线 | 这些依赖"列表规则"，放 Canvas 只会干扰创作流；Canvas 用**空间位置**代替这些管理手段 |
| 🔵 **Canvas 强化（Canvas 做得更好）** | 空间语义组织、就地预览、同屏协作可见、快捷动作密度 | 这是 Canvas 的差异化价值，应重点打磨 |

**另一个关键设计差异 — 单次生成数量**：

| 维度 | Grid | Canvas |
|------|------|--------|
| 单次生成数量 | 支持批量（一次可生成多张/多个） | 每次生成 **1 个**，结果就地落在对应占位节点 |
| 设计理由 | Grid 强调效率，批量出图合理 | Canvas 强调"每个节点有明确空间位置"；批量生成会让节点炸开、空间失控 |

> 详细映射表见 `§ 2.1`，已按七类分组（数据/操作/创作/小工具/画布层/协作/Grid Only），并补齐 QuickAction / 右键菜单 / 快捷键清单。

---

### Q3：已接入的 20 个 AI 工具在 Canvas 里怎么呈现？哪些不适合放 Canvas？

> **结论：统一为两种呈现方式，判断标准只有一个。**

**判断标准**：这个工具需不需要大面积视觉操作空间？

| 呈现方式 | 适合的工具类型 | 体验特征 |
|----------|----------|------|
| **Canvas 面板（Compact）** | Text to Image, Image Edit, Image to Video / Text to Video, Upscale, AI Avatar, Voiceover | 悬浮在占位素材下方，画布仍然可见，主要输入是 Prompt 或简单参数 |
| **沉浸弹窗（Immersive Modal）** | Inpaint, Character Swap, Face Swap, Photo Angle Editor, Virtual Try-On, Product Photography, Motion Control | 全屏遮罩聚焦操作，弹窗内有足够空间放涂抹画笔/3D 控件/左右素材对比/模板网格 |

**不适合 Canvas 的**（1 个工具 + 若干能力）：
- **URL to Video**：需输入电商链接、自动解析商品信息、多步确认编辑，流程太长，与 Canvas "即开即用"的节奏冲突
- **筛选/排序/置顶/批量统计**：这些是管理行为，不是创作行为，留在 Grid

---

## 目录

1. [Canvas 作为 Board 的 View vs. 独立功能](#1-canvas-作为-board-的-view-vs-独立功能)
2. [Board 组件在 Canvas 中的映射关系](#2-board-组件在-canvas-中的映射关系)
3. [工具的通用交互模型](#3-工具的通用交互模型)
4. [能力分层决策表](#4-能力分层决策表)
5. [全部 21 个工具适配方案](#5-全部-21-个工具适配方案)
6. [每个工具的具体交互方案](#6-每个工具的具体交互方案)
7. [Canvas 专属优势](#7-canvas-专属优势)
8. [总结](#8-总结)

---

## 1. Canvas 作为 Board 的 View vs. 独立功能

### 1.1 当前方案

Canvas 是 Board 的第四种视图（Grid / Split / Grouped / **Canvas**），共享 `BoardTaskItem[]` 数据源。

### 1.2 方案对比

| 维度 | **A：Canvas 作为 Board View** | **B：Canvas 独立平行于 Board** |
|------|------|------|
| 数据模型 | 复用 `BoardTaskItem[]`，一个 boardId 多种视图 | Canvas 有独立数据模型，与 Board 无从属关系 |
| 切换体验 | 同页面内切视图，素材无缝同步 | 跳转不同页面，需要导入/同步机制 |
| 数据一致性 | Grid 生成 → Canvas 下方自动出现；Canvas 生成 → Grid 可见 | 两边独立，要么手动同步，要么建映射层 |
| 工具复用 | 通过事件桥调用宿主已有的 ~20 个工具 API，零重复开发 | 需要重新接入所有工具 API |
| 架构灵活性 | 受限于 `BoardTaskItem` 模型，Canvas 专属概念需额外扩展 | 完全自由定义数据结构，可原生支持连线、画框、分区等 |
| 协作模型 | Board + Canvas（DO）两层协调 | Canvas 独立协作系统，更简洁 |
| 用户认知 | "Board 有多种看法" —— 直觉 | "Canvas 是另一个东西" —— 需解释关系 |
| 开发成本 | 增量开发 | 重建项目管理、权限、计费等基础设施 |
| 天花板 | 若 Canvas 未来要做连线/分区/画框，View 框架会越来越受限 | 天花板高，短期投入大 |

### 1.3 结论

> **维持方案 A：Canvas 作为 Board View。**

Canvas 与 Grid 的分工非常清晰：

- **Canvas** = Prompt 驱动 + 已有素材驱动，轻量快速创作，空间自由组织
- **Grid** = 模板驱动 + 全参数调优，完整工作流，结构化管理

两者互补。未来若 Canvas 发展出大量 Board 无关的高级功能，widget 的事件桥架构本身支持"升级为独立项目类型"的演进。

---

## 2. Board 组件在 Canvas 中的映射关系

### 2.1 完整映射表（按类拆分 + 补齐“小工具/快捷操作”）

> 目标：把“大能力”和“日常小工具（快捷操作/右键/快捷键/视图控制）”一次性映射清楚，落地对齐更快。

#### 2.1.1 素材与任务语义（数据层）

| Board（Grid） | Canvas | 关系 |
|---|---|---|
| 素材卡片（grid item） | 素材节点（Image/Video/AudioNode） | ✅ **互逆** — 通过 `taskId`/`externalId` 双向映射 |
| 任务状态（init/running/success/fail） | 节点状态（骨架屏/loading/红色边框等） | ✅ **互逆** — 视觉不同但语义一致 |
| 评分（0–3 星） | NodeRatingBadge + `NODE_QUICK_ACTION: rating` | ✅ **互逆** — 支持乐观更新 |

#### 2.1.2 选择与批量（操作层）

| Board（Grid） | Canvas | 关系 |
|---|---|---|
| 单选（点击卡片） | 点击节点选中 | ✅ **互逆** |
| 批量选择（checkbox） | 框选 + ⌘ 点击多选 | ✅ **互逆** — 交互不同但功能等价 |
| 批量操作栏（下载/删除/分组移动…） | 多选后浮动操作条（下载/删除/复制…） | ✅ **互逆** — Canvas 版更轻量 |
| 素材选择器（从列表挑一张图/视频） | SelectMode：点击节点触发 `NODE_SELECT_REQUEST` | ✅ **互逆** — Canvas 用“点选画布节点”完成选择 |

#### 2.1.3 工具入口与参数（创作层）

| Board（Grid） | Canvas | 关系 |
|---|---|---|
| 完整工具面板（左侧，全参数） | **Canvas 面板（Compact）** / **沉浸弹窗（Immersive Modal）** | ⚠️ **分层映射** — 核心参数主流程；高级参数走 Advanced |
| Advanced（全参数） | `⚙ Advanced` 辅助弹窗（面板触发） | ✅ **互逆** — 关闭后面板保持干净 |
| 模板库浏览（Virtual Try-On 公模、Product Photography 背景…） | 沉浸弹窗内的模板网格/库视图 | ⚠️ **弹窗映射** — 在同一沉浸弹窗内完成选择与回填 |
| Inpaint（Inpaint） | Image Edit 子能力：Inpaint（沉浸弹窗 + 涂抹） | ✅ **互逆** — 两边都支持；Canvas 更强调沉浸操作 |
| **批量生成**（一次生成多张/多个） | 每次生成 **1 个**，结果就地落在占位节点位置 | ⚠️ **差异化设计** — Grid 重效率；Canvas 重空间秩序（批量生成会导致节点炸开、位置混乱） |

#### 2.1.4 “小工具/快捷操作”清单（节点工具条 / 右键菜单 / 快捷键）

##### A) 节点快捷动作（`NODE_QUICK_ACTION`：工具条 + 右键菜单）

> 这些是「选中节点后浮现」的小工具按钮（不同媒体类型可见项略有差异）。

| actionId | UI 文案（示例） | 典型节点 | Board 侧等价/对应 |
|---|---|---|---|
| `edit` | Re-edit | Video | 重新编辑（复填原参数） |
| `reference` | Remix | Image | 设置为参考/Remix |
| `inpaint` | Inpaint | Image | Inpaint入口 |
| `video` | Generate Video | Image | 作为 Image to Video 首帧/生成视频入口 |
| `edit-angles` | Edit Angles | Image | Photo Angle Editor 入口 |
| `avatar` | AI Avatar | Image/Video | open AI Avatar tool |
| `upscale` | Upscale | Image/Video | Upscale |
| `download` | Download | Image/Video | 下载素材（单个） |
| `delete` | Delete | Image/Video | 删除 |
| `feedback` | Feedback | Image/Video | 反馈入口（如有） |
| `rating` | Rating | Image/Video/Audio | 评分（0–3 星） |
| `ocr` | 编辑文字 | Image | OCR（若接入） |
| `lipsync` | Video Lip Sync | Video | Video Lip Sync（若接入） |
| `copy` | Copy | All | 复制（剪贴板语义） |
| `cut` | Cut | All | 剪切（剪贴板语义） |
| `hide` / `show` | Hide / Show | All | 显示/隐藏（仅影响 Canvas 视图） |
| `lock` / `unlock` | Lock / Unlock | All | 锁定（仅影响 Canvas 操作：拖拽/编辑） |
| `export` | Export PNG/JPG/SVG | All | 导出（单节点） |

##### B) 右键菜单（Canvas 空白处）

| 小工具 | 快捷键（示例） | Board 侧等价/对应 |
|---|---|---|
| Zoom In / Zoom Out | ⌘+ / ⌘− | 视图缩放 |
| Zoom to Fit | ⌘0 | Fit / 适配视图 |
| Zoom to 100% | ⌘1 | 回到 100% |
| Paste（当前禁用） | ⌘V | 粘贴（若要做跨视图剪贴板则需宿主支持） |

##### C) 右键菜单（节点上）

| 小工具 | 快捷键（示例） | 备注 |
|---|---|---|
| Copy / Cut / Paste（禁用） / Duplicate | ⌘C / ⌘X / ⌘V / ⌘D | Copy/Cut 会触发 `NODE_QUICK_ACTION`；Duplicate 为本地克隆 |
| Move up / Move down / Bring to front / Send to back | ⌘] / ⌘[ / ⌘⇧] / ⌘⇧[ | 图层顺序（Canvas 语义） |
| Hide / Show | ⌘⇧H | 节点可见性 |
| Lock / Unlock | ⌘⇧L | 节点可拖拽/可编辑锁定 |
| Export（PNG/JPG/SVG） | — | `NODE_QUICK_ACTION: export`（带 format） |
| Delete | ⌫ | 删除节点 |

##### D) Inpaint 子工具（遮罩工具条）

> Inpaint 在 Canvas 侧会出现一组“涂抹小工具”（画笔/橡皮/笔刷粗细/撤销重做/完成）。实现上常见两类：沉浸弹窗内工具条，或进入聚焦编辑态后悬浮工具条。

| 小工具 | 说明 | 事件/语义 |
|---|---|---|
| Brush / Eraser | 切换画笔/橡皮 | 本地状态 |
| Brush Size | 笔刷粗细滑杆 | 本地状态 |
| Undo / Redo | 撤销/重做遮罩操作 | `INPAINT_MASK_ACTION: undo/redo` |
| Done | 退出涂抹态/完成遮罩 | 关闭聚焦态（回到常规画布交互） |

> 注：上表覆盖了当前 widget 内已出现的 actionId 与菜单项（代码与 `_docs/InfiniteLayout_QuickActions_Quick_Reference.md` 汇总）。

#### 2.1.5 视图与组织（画布层）

| Board（Grid） | Canvas | 关系 |
|---|---|---|
| 分页/无限滚动 | 缩放 + 平移（Pan/Zoom） | ↔ **概念替代** |
| 分组管理（Grouped View） | Canvas Group 分组 | ✅ **互逆** |
| 素材详情页（点击展开） | QuickActionToolbar + 右键菜单 + Layers 面板 | ⚠️ **简化映射** — 以“就地操作”替代详情页 |
| Layers（若 Grid 有） | Layers 面板（Canvas） | 🔵 **Canvas Only**（当前实现存在） |

#### 2.1.6 协作与权限（协作层）

| Board（Grid） | Canvas | 关系 |
|---|---|---|
| 协作（评论/状态/谁在编辑） | 协作光标 + Presence + 节点锁定可视化 | 🔵 **Canvas 强化** — 同屏实时可见 |

#### 2.1.7 Grid-Only（结构化管理能力）

| Grid 能力 | Canvas 对应 | 关系 |
|---|---|---|
| 筛选器（类型/状态/时间） | ❌ 无 | 🔴 **Grid Only** — Canvas 靠空间位置组织 |
| 排序器（时间/名称） | ❌ 无 | 🔴 **Grid Only** — Canvas 手动拖放决定排列 |
| 置顶功能 | ❌ 无 | 🔴 **Grid Only** |
| 历史时间线 | ❌ 无 | 🔴 **Grid Only** |

### 2.2 总结

```
✅ 互逆映射      素材节点/状态/评分、多选、批量操作、分组、核心工具能力
⚠️ 分层/弹窗映射  工具入口（Canvas 面板 vs 沉浸弹窗）、Advanced、模板库
⚠️ 差异化设计    批量生成：Grid 支持多个，Canvas 每次 1 个（空间秩序优先）
🧩 小工具清单     QuickActionToolbar / 右键菜单 / 快捷键 / 图层顺序 / 导出
🔴 Grid Only     筛选、排序、置顶、历史时间线、URL to Video
🔵 Canvas 强化    占位草稿、Layers、协作 Presence、就地操作（快捷动作密度更高）
```

---

## 3. 工具的通用交互模型

### 3.1 两条入口

**入口 1 — 侧边栏（从零开始）**：
```
侧边栏 → Image/Video/Avatar/Audio → 子菜单项
  → 画布中央创建占位素材（toolId + toolCategory）
  → Canvas 面板（Compact 工具）：占位素材下方弹出面板
  → 沉浸弹窗（Modal 工具）：占位素材创建后直接打开遮罩弹窗
  → 用户填参数 → Generate
```

**入口 2 — QuickAction（从已有素材触发）**：
```
选中素材 → QuickActionToolbar → 操作按钮
  → 已有素材自动填入为输入
  → Canvas 面板 或 沉浸弹窗（取决于工具类型）
```

### 3.2 两种呈现方式（核心决策）

工具在 Canvas 中只有 **两种** 呈现方式，判断标准很简单：**需不需要大面积操作空间？**

| 形态 | 判断标准 | 视觉特征 | 典型工具 |
|------|----------|----------|----------|
| **Canvas 面板（Compact）** | 主要输入是 Prompt 或简单参数，不需要大面积预览/操作区 | 悬浮在占位素材下方；画布仍可见；支持 Tab 切换家族工具 | Text to Image ↔ Image Edit / Image to Video ↔ Text to Video ↔ Omni Reference / Upscale / Avatar / Voiceover |
| **沉浸弹窗（Immersive Modal）** | 需要大面积预览、画笔涂抹、3D 控件、左右素材对比、模板网格等复杂交互 | 全屏/近全屏 Modal + 半透明遮罩；画布被遮挡；操作完成后关闭回到画布 | Inpaint / Character Swap / Face Swap / Photo Angle Editor / Virtual Try-On / Product Photography / Motion Control |

#### Canvas 面板（Compact）— 在画布上直接操作

```
     ┌──────────┐
     │  🖼 占位   │  ← 占位素材（图片/视频/音频）
     │   素材    │
     └──────────┘
     ┌──────────────────────────────────┐
     │ [Tab A] [Tab B] [Tab C]          │  ← 可选 Tab 切换（同家族工具）
     ├──────────────────────────────────┤
     │ (+) Prompt / Upload / Script     │  ← 主输入区
     ├──────────────────────────────────┤
     │ Model ▾ | Res ▾ | ... | ⚙ | ⚡   │  ← 底栏参数 + 发送
     └──────────────────────────────────┘
```

- 面板跟随占位素材，随画布缩放平移
- 画布仍然可见，可以看到其他素材的空间关系
- Tab 切换不重置已填内容（尽量保留）
- 底栏只放核心参数（≤ 5 个），高级参数走 ⚙ Advanced 弹窗

#### 沉浸弹窗（Immersive Modal）— 遮罩 + 大弹窗

```
┌──────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ [×] │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░  ┌─────────────────────────────────────────┐  ░░ │
│ ░░  │     Tool Title          [Tab A] [Tab B] │  ░░ │
│ ░░  ├─────────────────────────────────────────┤  ░░ │
│ ░░  │                                         │  ░░ │
│ ░░  │   大面积操作区                            │  ░░ │
│ ░░  │  （涂抹 / 3D 预览 / 左右 Slot /          │  ░░ │
│ ░░  │    模板网格 / 图片对比等）                 │  ░░ │
│ ░░  │                                         │  ░░ │
│ ░░  ├─────────────────────────────────────────┤  ░░ │
│ ░░  │ [upload] [Select from Board] [generate]  │  ░░ │
│ ░░  └─────────────────────────────────────────┘  ░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└──────────────────────────────────────────────────────┘
  ░ = 半透明遮罩（画布被遮挡，用户聚焦在当前工具操作）
```

- 画布被半透明遮罩覆盖，用户聚焦在当前工具
- 弹窗内有充足空间：大图预览、画笔工具条、3D 控件、模板网格、左右 Slot 对比
- 操作完成（generate / confirm）后弹窗关闭，结果出现在画布占位素材位置
- 部分工具有分步流程（如 Inpaint：先选图 → 进入涂抹步；Photo Angle Editor：先上传 → 3D 调整步）
- 弹窗内可包含 Tab 切换（如 Inpaint 的 Replace/Add/Remove；Swap 的 Image/Video）

#### 两种形态对比

| 维度 | Canvas 面板 | 沉浸弹窗 |
|------|-------------|----------|
| 画布可见性 | ✅ 画布可见，可参考周围素材 | ❌ 遮罩覆盖画布 |
| 操作空间 | 窄面板，适合文字输入 | 大面积，适合视觉操作 |
| 触发方式 | 侧边栏 / QuickAction | 侧边栏 / QuickAction |
| 关闭后 | 面板消失，占位素材保留 | 弹窗关闭，结果出现在画布 |
| Tab 切换 | ✅ 家族内切换 | ✅ 弹窗内切换 |
| ⚙ Advanced | 从面板打开子弹窗 | 弹窗内有足够空间内联 |

### 3.3 素材输入方式

所有需要素材输入的工具，统一提供两种选择：

| 方式 | 交互 | 说明 |
|------|------|------|
| **Upload** | 本地文件选择 | 通用 |
| **Select from Board** 📂 | 触发 `CANVAS_NAVIGATE` 事件，宿主打开素材选择器 | 复用宿主组件（统一入口） |

> QuickAction 场景下，当前选中素材自动填入为输入（Slot A / Target / Source），用户只需补齐其他输入或 Prompt。

### 3.4 通用规则

1. **占位即草稿** — 触发工具就创建占位素材，用户可先"占位"多个
2. **事件桥解耦** — Widget 只做 UI，通过事件通知宿主调 API
3. **核心参数内联** — 面板/弹窗默认只露 3–5 个核心参数
4. **高级参数走 Advanced** — Canvas 面板用子弹窗；沉浸弹窗可内联
5. **模板浏览在弹窗内** — 沉浸弹窗工具直接在弹窗内展示模板网格，不需要二级弹窗
6. **批量生成可选** — 默认 1 张，可选 Count（1/2/4）

### 3.5 工具家族（Tab 合并策略）

将 UI 骨架相同、仅输入媒体或参数略有差异的工具合并到同一面板/弹窗，用 Tab 切换：

| 家族 | 合并的工具 | 呈现方式 | Tab 说明 |
|------|-----------|----------|----------|
| **Image Creation** | Text to Image ↔ Image Edit | Canvas 面板 | `Text to Image` Tab：纯 Prompt；`Image Edit` Tab：Prompt + 上传参考图 |
| **Video Creation** | Image to Video ↔ Text to Video ↔ Omni Reference | Canvas 面板 | `Image to Video` Tab：上传 + Prompt；`Text to Video` Tab：纯 Prompt；`Omni Reference` Tab：上传 + Ref + Prompt |
| **Character Swap** | Image Character Swap / Video Character Swap | 沉浸弹窗 | `Image Character Swap` Tab / `Video Character Swap` Tab：左右 Slot 布局一致，仅 Target 素材类型不同 |
| **Face Swap** | Image Face Swap ↔ Video Face Swap | 沉浸弹窗 | `Image` Tab / `Video` Tab：同上 |
| **Upscale** | Image Upscale ↔ Video Upscale | Canvas 面板 | `Image` Tab / `Video` Tab |
| **AI Avatar Family** | AI Avatar / Video Lip Sync / Product Avatar / Design My Avatar | Canvas 面板 | 按工具名切换 Tab |
| **Standalone** | Inpaint / Photo Angle Editor / Virtual Try-On / Product Photography / Motion Control / Voiceover | 各自独立 | 无合并需求 |

---

## 4. 能力分层决策表

Canvas 的能力按三层组织：**Canvas 面板 / 沉浸弹窗**（工具操作层）→ **辅助弹窗**（高级参数/模板/批量下载）→ **Grid 管理**（留在 Grid）。

### 4.1 决策矩阵

| 能力 | 层级 | 交互入口 | 设计原则 |
|------|------|----------|----------|
| **核心参数**（Model/Ratio/Resolution/Duration） | 🟢 Canvas 面板底栏 / 沉浸弹窗内 | 面板底栏 or 弹窗内联 | 高频参数，≤ 5 个 |
| **Prompt 输入** | 🟢 Canvas 面板主体 / 沉浸弹窗内 | 面板/弹窗主体区域 | 核心输入 |
| **素材上传/选择** | 🟢 Canvas 面板内 / 沉浸弹窗内 | Upload + Select from Board | 核心输入 |
| **脚本 + Voiceover** | 🟢 Canvas 面板 | 面板内文本区 + 底栏 Voice | E 类工具核心 |
| **生成数量**（1/2/4） | 🟢 面板底栏 | 小下拉 `Count ▾` | 高频，保持轻量 |
| **涂抹/画笔操作** | 🟢 沉浸弹窗 | 弹窗内画笔工具条 | 需要大面积操作空间 |
| **3D 相机预览** | 🟢 沉浸弹窗 | 弹窗内 3D 预览 + 控件 | 需要大面积操作空间 |
| **模板网格浏览** | 🟢 沉浸弹窗 | 弹窗内直接展示模板网格 | 有足够空间，无需二级弹窗 |
| **高级参数**（Steps/CFG/Seed/Negative Prompt） | 🟡 辅助弹窗 | Canvas 面板 `⚙ Advanced` → modal | 关闭后面板显示"已启用高级设置" |
| **Cutout 调整**（Product Photography） | 🟡 辅助弹窗 | 沉浸弹窗内 `✂ Adjust Cutout` → 二级弹窗 | 精细操作需更大画面 |
| **批量操作**（下载/删除/复制） | 🟢 主流程 | 多选后浮动操作条 | 依赖多选（框选 + ⌘ 点击） |
| **批量打包下载**（zip + 格式选择） | 🟡 辅助弹窗 | 操作条 Download → 小弹窗选格式/水印 | 轻量弹窗 |
| **筛选 / 排序** | 🔴 Grid | — | Canvas 靠空间位置组织 |
| **置顶** | 🔴 Grid | — | Canvas 无"顶部"概念 |
| **历史时间线** | 🔴 Grid | — | Grid 天然按时间排列 |
| **URL/链接导入素材** | 🔴 Grid | — | 电商链接解析流程太长 |
| **数据统计/用量** | 🔴 Grid | — | 表格类信息 |

### 4.2 批量生成的落点规则

| 规则 | 说明 |
|------|------|
| **锚点** | 以占位素材为锚点 |
| **排列** | 向右（或右下）按固定间距排布 N 张 |
| **上限** | Canvas 建议最多 4 张；超过 4 张引导去 Grid |
| **避免** | 不要让画布"突然炸开一堆节点"导致迷失 |

---

## 5. 全部 21 个工具适配方案

### 5.1 总表：21 个工具 → 呈现方式 + 家族归属

| # | 底层工具 | 呈现方式 | 家族/Tab | 弹窗内关键交互 |
|---|---------|----------|----------|---------------|
| 1 | Text to Image | **Canvas 面板** | Image Creation → `Text to Image` | ⚙ Advanced；Count(1–4) |
| 2 | Image Edit | **Canvas 面板** | Image Creation → `Image Edit` | ⚙ Advanced；(+) 参考图上传 |
| 3 | Inpaint | **沉浸弹窗** | 独立（Image Edit 子能力） | 分步：选图 → Replace/Add/Remove Tab → 画笔涂抹 + Prompt |
| 4 | Image Character Swap | **沉浸弹窗** | Character Swap Family → `Image Character Swap` | 左右 Slot（Target Image + Character Image）+ 历史参考 |
| 5 | Video Character Swap | **沉浸弹窗** | Character Swap Family → `Video Character Swap` | 左右 Slot（Target Video + Character Image） |
| 6 | Image Face Swap | **沉浸弹窗** | Face Swap Family → `Image Face Swap` | 左右 Slot（Target Image + Face Image） |
| 7 | Video Face Swap | **沉浸弹窗** | Face Swap Family → `Video Face Swap` | 左右 Slot（Target Video + Face Image） |
| 8 | Image Upscale | **Canvas 面板** | Upscale Family → `Image Upscale` | Upload + Resolution 选择 |
| 9 | Video Upscale | **Canvas 面板** | Upscale Family → `Video Upscale` | Upload + Resolution 选择 |
| 10 | Photo Angle Editor | **沉浸弹窗** | 独立 | 分步：上传+多角度预览 → 3D Camera Preview + Rotate/Vertical/Zoom 控件 |
| 11 | Virtual Try-On | **沉浸弹窗** | 独立 | 左右 Slot（Product Image + Template Photo）；模板网格（可选） |
| 12 | Product Photography | **沉浸弹窗** | 独立 | Product + Background；✂ Cutout（二级弹窗）；模板网格（可选） |
| 13 | Image to Video | **Canvas 面板** | Video Creation → `Image to Video` | (+) 首帧/尾帧上传 + Prompt + Model/Res/Duration |
| 14 | Text to Video | **Canvas 面板** | Video Creation → `Text to Video` | 纯 Prompt + Model/Ratio/Res/Duration |
| 15 | Omni Reference | **Canvas 面板** | Video Creation → `Omni Reference` | (+) 参考素材上传 + Prompt + Model/Res |
| 16 | Motion Control | **沉浸弹窗** | 独立 | 左右 Slot（Character Image + Motion Video） |
| 17 | URL to Video | **Grid-Only** | — | — |
| 18 | AI Avatar | **Canvas 面板** | AI Avatar → `AI Avatar` | Identity + Script + Voice |
| 19 | Video Lip Sync | **Canvas 面板** | AI Avatar Family → `Video Lip Sync` | Video + Script + Voice |
| 20 | Product Avatar | **Canvas 面板** | AI Avatar → `Product Avatar` | Product + Script + Voice |
| 21 | Design My Avatar | **Canvas 面板** | AI Avatar → `Design` | Upload photos → Generate avatar |
| 22 | Voiceover | **Canvas 面板** | 独立（或 Audio 家族） | Script + Voice + Language |

### 5.2 按呈现方式统计

| 呈现方式 | 工具数 | 工具列表 |
|----------|--------|----------|
| **Canvas 面板（Compact）** | 12 | Text to Image, Image Edit, Image Upscale, Video Upscale, Image to Video, Text to Video, Omni Reference, AI Avatar, Video Lip Sync, Product Avatar, Design My Avatar, Voiceover |
| **沉浸弹窗（Immersive Modal）** | 8 | Inpaint, Image Character Swap, Video Character Swap, Image Face Swap, Video Face Swap, Photo Angle Editor, Virtual Try-On, Product Photography, Motion Control |
| **Grid-Only** | 1 | URL to Video |

### 5.3 家族 Tab 一览

| 家族名 | 呈现方式 | Tab 列表 | 合并理由 |
|--------|----------|----------|----------|
| Image Creation | Canvas 面板 | `Text to Image` / `Image Edit` | 骨架一致（Prompt + 参数），Edit 多一个参考图上传 |
| Video Creation | Canvas 面板 | `Image to Video` / `Text to Video` / `Omni Reference` | 骨架一致（Prompt + 参数），Image to Video/Omni 多上传 slot |
| Character Swap | 沉浸弹窗 | `Image` / `Video` | 左右 Slot 布局一致，仅 Target 媒体类型不同 |
| Face Swap | 沉浸弹窗 | `Image` / `Video` | 同上 |
| Upscale | Canvas 面板 | `Image` / `Video` | Upload + Resolution，极简 |
| AI Avatar Family | Canvas 面板 | `AI Avatar` / `Video Lip Sync` / `Product Avatar` / `Design My Avatar` | 均为 Identity + Script/Upload |

---

## 6. 每个工具的具体交互方案

> 以下基于线框图确认的方案，描述每个工具（或工具家族）在 Canvas 中的具体交互。

### 6.1 Image Creation Family — Text to Image ↔ Image Edit（Canvas 面板）

对应线框图 3。面板跟随占位素材悬浮在画布上。

**Text to Image Tab**：

```
     ┌──────────┐
     │  🖼 占位   │
     │   素材    │
     └──────────┘
     ┌──────────────────────────────────┐
     │ [Text to Image]  Image Edit      │  ← Tab 切换
     ├──────────────────────────────────┤
     │ Describe...                      │  ← Prompt 输入
     │                                  │
     ├──────────────────────────────────┤
     │ Model ▾ | 📐 ▾ | 📏 ▾ | ... | ⚡│  ← 底栏：Model / Ratio / Res / ⚙ / Send
     └──────────────────────────────────┘
```

**Image Edit Tab**：

```
     ┌──────────┐
     │  🖼 占位   │
     │   素材    │
     └──────────┘
     ┌──────────────────────────────────┐
     │  Text to Image  [Image Edit]     │  ← Tab 切换
     ├──────────────────────────────────┤
     │ (+)  Describe...                 │  ← (+) 上传参考图 + Prompt
     │                                  │
     ├──────────────────────────────────┤
     │ Model ▾ | 📐 ▾ | 📏 ▾ | ... | ⚡│
     └──────────────────────────────────┘
```

- Tab 切换时保留已输入的 Prompt 内容
- Image Edit 的 (+) 按钮：上传参考图或 Select from Board
- 底栏 `⚙` 打开 Advanced modal（Steps / CFG / Seed / Negative Prompt）
- Count 选择在底栏或 Advanced 弹窗内

### 6.2 Inpaint — AI Image Inpainter（沉浸弹窗）

对应线框图 1。需要大面积画笔涂抹操作，用沉浸弹窗。

**第一步 — 选择图片**：

```
┌──────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ [×] │
│ ░░  ┌─────────────────────────────────────────┐  ░░ │
│ ░░  │           AI Image Inpainter            │  ░░ │
│ ░░  │  Modify or reimagine elements of your   │  ░░ │
│ ░░  │  image with simple brush strokes        │  ░░ │
│ ░░  │                                         │  ░░ │
│ ░░  │     [Replace]  [Add]  [Remove]          │  ░░ │  ← 模式 Tab
│ ░░  │                                         │  ░░ │
│ ░░  │  ┌───────────────────────────────────┐  │  ░░ │
│ ░░  │  │                                   │  │  ░░ │
│ ░░  │  │      （大面积图片预览区域）          │  │  ░░ │
│ ░░  │  │      Replace 模式效果对比           │  │  ░░ │
│ ░░  │  │                                   │  │  ░░ │
│ ░░  │  └───────────────────────────────────┘  │  ░░ │
│ ░░  │                                         │  ░░ │
│ ░░  │   [upload]          [Select from Board]  │  ░░ │
│ ░░  └─────────────────────────────────────────┘  ░░ │
└──────────────────────────────────────────────────────┘
```

**第二步 — 涂抹操作**（选择图片后进入）：

```
┌──────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ [×] │
│ ░░  ┌─────────────────────────────────────────┐  ░░ │
│ ░░  │                                         │  ░░ │
│ ░░  │  ┌───────────────────────────────────┐  │  ░░ │
│ ░░  │  │                                   │  │  ░░ │
│ ░░  │  │      图片 + 涂抹遮罩层              │  │  ░░ │
│ ░░  │  │      （用户在此画笔涂抹区域）        │  │  ░░ │
│ ░░  │  │                                   │  │  ░░ │
│ ░░  │  └───────────────────────────────────┘  │  ░░ │
│ ░░  │  [🖌 画笔] [粗细 ━━━━●━━━ ] [颜色]      │  ░░ │  ← 画笔工具条
│ ░░  │                                         │  ░░ │
│ ░░  │  (+)  Describe...                   (i) │  ░░ │  ← Prompt + 额外参考 + 发送
│ ░░  └─────────────────────────────────────────┘  ░░ │
└──────────────────────────────────────────────────────┘
```

- Replace / Add / Remove 三种模式 Tab
- 画笔工具条：画笔/橡皮切换、粗细滑块、遮罩颜色
- 底部 Prompt 输入 + (+) 上传额外参考图
- 完成后点发送，弹窗关闭，结果出现在画布

### 6.3 Character Swap Family — Character Swap（沉浸弹窗）

对应线框图 2。需要左右两个大面积素材 Slot 对比。

```
┌──────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ [×] │
│ ░░  ┌─────────────────────────────────────────┐  ░░ │
│ ░░  │                                         │  ░░ │
│ ░░  │  ┌──── Target Image ────┐ ┌── Character Image ──┐ │
│ ░░  │  │                      │ │                      │ │
│ ░░  │  │         (+)          │ │         (+)          │ │
│ ░░  │  │                      │ │                      │ │
│ ░░  │  │  ┌──┐ ┌──┐ ┌──┐     │ │                      │ │
│ ░░  │  │  │🖼│ │🖼│ │🖼│     │ │                      │ │  ← 历史/推荐
│ ░░  │  │  └──┘ └──┘ └──┘     │ │                      │ │
│ ░░  │  └──────────────────────┘ └──────────────────────┘ │
│ ░░  │                                         │  ░░ │
│ ░░  │            [ generate ]                  │  ░░ │
│ ░░  └─────────────────────────────────────────┘  ░░ │
└──────────────────────────────────────────────────────┘
```

- 左右各一个大面积 Slot：Target（图片/视频） + Character（图片）
- 每个 Slot 点击 (+) 可 Upload 或 Select from Board
- Target Slot 下方可展示历史/推荐素材缩略图
- Image / Video Tab 切换（仅 Target 素材类型变化）
- Face Swap 家族布局一致，仅标签不同（Target + Face）

### 6.4 Photo Angle Editor（沉浸弹窗）

对应线框图 4。需要大面积 3D 相机预览 + 控件。

**第一步 — 上传图片 + 多角度预览**：

```
┌──────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ [×] │
│ ░░  ┌─────────────────────────────────────────┐  ░░ │
│ ░░  │          Photo Angle Editor             │  ░░ │
│ ░░  │  Generate multi angle views from a      │  ░░ │
│ ░░  │  single static image with AI            │  ░░ │
│ ░░  │                                         │  ░░ │
│ ░░  │  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐              │  ░░ │
│ ░░  │  │🏎│ │🏎│ │🏎│ │🏎│ │🏎│              │  ░░ │
│ ░░  │  └──┘ └──┘ └──┘ └──┘ └──┘              │  ░░ │  ← 多角度预览网格
│ ░░  │  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐              │  ░░ │
│ ░░  │  │🏎│ │🏎│ │🏎│ │🏎│ │🏎│              │  ░░ │
│ ░░  │  └──┘ └──┘ └──┘ └──┘ └──┘              │  ░░ │
│ ░░  │                                         │  ░░ │
│ ░░  │   [upload]          [Select from Board]  │  ░░ │
│ ░░  └─────────────────────────────────────────┘  ░░ │
└──────────────────────────────────────────────────────┘
```

**第二步 — 3D 相机调整**：

```
┌──────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ [×] │
│ ░░  ┌─────────────────────────────────────────┐  ░░ │
│ ░░  │  Camera Preview                   [🔳]  │  ░░ │
│ ░░  │                                         │  ░░ │
│ ░░  │  ┌───────────────────────────────────┐  │  ░░ │
│ ░░  │  │                                   │  │  ░░ │
│ ░░  │  │   3D 相机视角预览                   │  │  ░░ │
│ ░░  │  │   （可拖拽旋转的 3D 控件）           │  │  ░░ │
│ ░░  │  │                                   │  │  ░░ │
│ ░░  │  └───────────────────────────────────┘  │  ░░ │
│ ░░  │  ☐ generate from 12 best angles         │  ░░ │
│ ░░  │  Rotate    ━━━━━━━━━●━━   0°            │  ░░ │
│ ░░  │  Vertical  ━━━━●━━━━━━━   0°            │  ░░ │
│ ░░  │  Zoom      ━━━━━━━━━━●━   1             │  ░░ │
│ ░░  │                                         │  ░░ │
│ ░░  │            [ generate ]                  │  ░░ │
│ ░░  └─────────────────────────────────────────┘  ░░ │
└──────────────────────────────────────────────────────┘
```

- 分步：先上传图片并看多角度预览 → 进入 3D 相机调整
- 3D 预览区域需要大面积空间（可拖拽旋转）
- 三个滑块：Rotate / Vertical / Zoom
- 可勾选"从 12 个最佳角度生成"

### 6.5 Virtual Try-On（沉浸弹窗）

对应线框图 5。需要左右 Slot + 可选模板网格。

**默认路径 — 手动上传**：

```
┌──────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ [×] │
│ ░░  ┌─────────────────────────────────────────┐  ░░ │
│ ░░  │           Visual Virtual Try-On                 │  ░░ │
│ ░░  │                                         │  ░░ │
│ ░░  │  ┌── Product Image ──┐ ┌── Template Photo ──┐ │
│ ░░  │  │                    │ │                     │ │
│ ░░  │  │       (+)          │ │        (+)          │ │
│ ░░  │  │                    │ │                     │ │
│ ░░  │  └────────────────────┘ └─────────────────────┘ │
│ ░░  │                                         │  ░░ │
│ ░░  │   [upload]   [Select from Board]         │  ░░ │
│ ░░  │              [Select from Template]      │  ░░ │
│ ░░  │                                         │  ░░ │
│ ░░  │            [ generate ]                  │  ░░ │
│ ░░  └─────────────────────────────────────────┘  ░░ │
└──────────────────────────────────────────────────────┘
```

**模板路径 — 点击 Select from Template 后**：

```
┌──────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ [×] │
│ ░░  ┌─────────────────────────────────────────┐  ░░ │
│ ░░  │           Visual Virtual Try-On                 │  ░░ │
│ ░░  │                                         │  ░░ │
│ ░░  │  ┌── Product Image ──┐ ┌── Template Photo ──┐ │
│ ░░  │  │                    │ │ ┌──┐┌──┐┌──┐┌──┐  │ │
│ ░░  │  │       (+)          │ │ │👤││👤││👤││👤│  │ │
│ ░░  │  │                    │ │ ├──┤├──┤├──┤├──┤  │ │
│ ░░  │  │                    │ │ │👤││👤││👤││👤│  │ │  ← 模板网格
│ ░░  │  │                    │ │ ├──┤├──┤├──┤├──┤  │ │
│ ░░  │  │                    │ │ │👤││👤││👤││👤│  │ │
│ ░░  │  │                    │ │ └──┘└──┘└──┘└──┘  │ │
│ ░░  │  └────────────────────┘ └─────────────────────┘ │
│ ░░  │                                         │  ░░ │
│ ░░  │            [ generate ]                  │  ░░ │
│ ░░  └─────────────────────────────────────────┘  ░░ │
└──────────────────────────────────────────────────────┘
```

- 左右 Slot：Product Image + Template Photo（模特照）
- Template Photo 的 Slot 可变为模板网格浏览（弹窗空间足够，无需二级弹窗）
- 模板网格按品类标签分类、可搜索
- 选中模板后回填到 Template Photo Slot

### 6.6 Product Photography（沉浸弹窗）

与 Virtual Try-On 类似的沉浸弹窗，但交互更丰富：Product Image + Background（Prompt 或模板） + ✂ Cutout。

```
┌──────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ [×] │
│ ░░  ┌─────────────────────────────────────────┐  ░░ │
│ ░░  │        Product Photography              │  ░░ │
│ ░░  │                                         │  ░░ │
│ ░░  │  Product Image                          │  ░░ │
│ ░░  │  ┌───────────────────┐                  │  ░░ │
│ ░░  │  │       (+)         │  [✂ Adjust Cutout]│ ░░ │
│ ░░  │  └───────────────────┘                  │  ░░ │
│ ░░  │                                         │  ░░ │
│ ░░  │  Background                             │  ░░ │
│ ░░  │  ┌───────────────────────────────────┐  │  ░░ │
│ ░░  │  │ Describe the background...        │  │  ░░ │
│ ░░  │  └───────────────────────────────────┘  │  ░░ │
│ ░░  │  [🖼 Or select from templates]          │  ░░ │
│ ░░  │                                         │  ░░ │
│ ░░  │  📷 参考图(可选)  1:1 ▾       [generate] │  ░░ │
│ ░░  └─────────────────────────────────────────┘  ░░ │
└──────────────────────────────────────────────────────┘
```

- ✂ Adjust Cutout：二级弹窗（画笔/橡皮/粗细/遮罩色/大图预览）
- Background 默认为 Prompt，也可切换到模板网格
- 模板网格在弹窗内直接展示（空间够用）

### 6.7 Video Creation Family — Image to Video ↔ Text to Video ↔ Omni Reference（Canvas 面板）

对应线框图 6。三个工具共用面板，Tab 切换。

**Image to Video Tab**：

```
     ┌──────────┐
     │  ▶ 占位   │
     │   素材    │
     └──────────┘
     ┌──────────────────────────────────┐
     │ [Image to Video]  Text to Video   Omni Reference           │  ← Tab 切换
     ├──────────────────────────────────┤
     │ (+first) (+end)                  │  ← 首帧/尾帧上传 Slot
     │ Describe...                      │  ← Prompt
     ├──────────────────────────────────┤
     │ Model ▾ | 720P ▾ | 15s ▾ | ⚙ |⚡│
     └──────────────────────────────────┘
```

**Text to Video Tab**：

```
     ┌──────────┐
     │  ▶ 占位   │
     │   素材    │
     └──────────┘
     ┌──────────────────────────────────┐
     │  Image to Video  [Text to Video]  Omni Reference           │
     ├──────────────────────────────────┤
     │ Describe...                      │  ← 纯 Prompt（无上传 Slot）
     │                                  │
     ├──────────────────────────────────┤
     │ Model ▾ | 16:1 ▾| 720P ▾| 15s ▾| ⚙ |⚡│
     └──────────────────────────────────┘
```

**Omni Reference Tab**：

```
     ┌──────────┐
     │  ▶ 占位   │
     │   素材    │
     └──────────┘
     ┌──────────────────────────────────┐
     │  Image to Video   Text to Video  [Omni Reference]          │
     ├──────────────────────────────────┤
     │ (+)                              │  ← 参考素材上传
     │ Describe...                      │  ← Prompt
     ├──────────────────────────────────┤
     │ Model ▾ | 720P ▾ | ... | ⚙ | ⚡ │
     └──────────────────────────────────┘
```

- 三个 Tab 之间切换保留已输入内容
- Image to Video 有首帧/尾帧两个可选上传 Slot
- Text to Video 纯 Prompt，最简洁
- Omni Reference 有一个参考素材上传 + Prompt
- 底栏参数：Model / Ratio / Resolution / Duration / ⚙ Advanced

### 6.8 Motion Control（沉浸弹窗）

需要左右 Slot 对比（Character Image + Motion Video），Motion Video 需要预览播放。

```
┌──────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ [×] │
│ ░░  ┌─────────────────────────────────────────┐  ░░ │
│ ░░  │          Motion Control                 │  ░░ │
│ ░░  │                                         │  ░░ │
│ ░░  │  ┌── Character Image ──┐ ┌── Motion Video ──┐ │
│ ░░  │  │                      │ │                   │ │
│ ░░  │  │       (+)            │ │       (+)  ▶      │ │
│ ░░  │  │                      │ │                   │ │
│ ░░  │  └──────────────────────┘ └───────────────────┘ │
│ ░░  │                                         │  ░░ │
│ ░░  │  Quality ▾                               │  ░░ │
│ ░░  │            [ generate ]                  │  ░░ │
│ ░░  └─────────────────────────────────────────┘  ░░ │
└──────────────────────────────────────────────────────┘
```

### 6.9 Upscale 家族 — Image ↔ Video（Canvas 面板）

极简面板，Upload + Resolution 选择。

```
     ┌──────────┐
     │  🖼 占位   │
     │   素材    │
     └──────────┘
     ┌──────────────────────────────────┐
     │ [Image]  Video                   │  ← Tab 切换
     ├──────────────────────────────────┤
     │ (+) Upload / Select from Board   │
     ├──────────────────────────────────┤
     │ Resolution ▾              | ⚡   │
     └──────────────────────────────────┘
```

### 6.10 AI Avatar Family — AI Avatar / Video Lip Sync / Product Avatar / Design My Avatar（Canvas 面板）

Script-driven tools. Panel body is a Script textarea.

```
     ┌──────────┐
     │  🖼 占位   │
     │   素材    │
     └──────────┘
     ┌──────────────────────────────────┐
     │ [AI Avatar] [Video Lip Sync] [Product Avatar] [Design My Avatar] │ ← Tab 切换
     ├──────────────────────────────────┤
     │ (+) Identity / Video / Product   │  ← 形象/视频/商品上传
     ├──────────────────────────────────┤
     │ Script textarea                  │  ← 脚本文本
     │                                  │
     ├──────────────────────────────────┤
     │ Voice ▾ | Language ▾ | ... | ⚡  │
     └──────────────────────────────────┘
```

- **AI Avatar**: Identity photo + Script + Voice
- **Video Lip Sync**: Source video + Script + Voice
- **Product Avatar**: Product photo + Script + Voice
- **Design My Avatar**: Upload photos → Generate avatar (no Script)

### 6.11 Voiceover（Canvas 面板）

独立音频工具，极简。

```
     ┌──────────┐
     │  🔊 占位   │
     │   素材    │
     └──────────┘
     ┌──────────────────────────────────┐
     │ Script textarea                  │
     │                                  │
     ├──────────────────────────────────┤
     │ Voice ▾ | Language ▾ | ... | ⚡  │
     └──────────────────────────────────┘
```

---

## 7. Canvas 专属优势

这些能力是 Canvas 相比 Grid **独有的、做得更好的**：

| 能力 | 说明 | 受益工具 |
|------|------|----------|
| **占位素材草稿** | 一口气"开"多个工具占位，稍后逐个填参数 | 所有工具 |
| **空间语义组织** | 把人物照放左边、商品照放右边、成品放中间——用空间位置表达创作意图 | 创作流整体 |
| **就地预览** | 生成结果直接出现在占位素材旁边，不需要去列表里找 | 所有工具 |
| **协作可见** | 同事在用哪个工具、选了哪张图，实时可见 | 团队协作场景 |
| **同屏上下文** | 创作/编辑时仍能看到其他素材的空间关系（Canvas 面板工具优势尤为明显） | Text to Image、Image Edit、Video Creation tools, etc. |

---

## 8. 总结

### 8.1 两种呈现方式

```
┌─────────────────────────────────────────────────────────┐
│  📋 Canvas 面板（Compact）— 12 个工具                      │
│  悬浮在占位素材下方，画布可见                                │
│  支持 Tab 切换家族工具                                      │
│  适合：Prompt 输入、简单参数、脚本文本                       │
│                                                           │
│  工具：Text to Image / Image Edit / Image to Video / Text to Video / Omni Reference  │
│       / Image Upscale / Video Upscale / AI Avatar         │
│       / Video Lip Sync / Product Avatar / Design My Avatar         │
│       / Voiceover                                         │
├─────────────────────────────────────────────────────────┤
│  🖥 沉浸弹窗（Immersive Modal）— 8 个工具                   │
│  全屏遮罩 + 大弹窗，画布被遮挡                               │
│  适合：画笔涂抹、3D 控件、左右 Slot 对比、模板网格            │
│                                                           │
│  工具：Inpaint / Image Character Swap / Video Character Swap        │
│       / Image Face Swap / Video Face Swap                 │
│       / Photo Angle Editor / Virtual Try-On               │
│       / Product Photography / Motion Control              │
├─────────────────────────────────────────────────────────┤
│  🔴 Grid-Only — 1 个工具                                   │
│  URL to Video（链接导入 + 电商解析）                         │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Tab 家族

| 家族 | 呈现方式 | Tab 数 |
|------|----------|--------|
| Image Creation | Canvas 面板 | 2（Text to Image / Image Edit） |
| Video Creation | Canvas 面板 | 3（Image to Video / Text to Video / Omni Reference） |
| Character Swap | 沉浸弹窗 | 2（Image / Video） |
| Face Swap | 沉浸弹窗 | 2（Image / Video） |
| Upscale | Canvas 面板 | 2（Image / Video） |
| AI Avatar Family | Canvas 面板 | 4（AI Avatar / Video Lip Sync / Product Avatar / Design My Avatar） |

### 8.3 数字

- **进 Canvas 的工具**：20 / 21
- **Grid-Only 工具**：1（URL to Video）
- **Canvas 面板工具**：12 个（6 个家族 Tab 组 + 1 个独立）
- **沉浸弹窗工具**：8 个（2 个家族 Tab 组 + 5 个独立）
- **Canvas 优势点**：5 项（占位草稿 / 空间组织 / 就地预览 / 协作可见 / 同屏上下文）

### 8.4 下一步

1. 基于本文档的线框图，输出高保真设计稿（Figma）
2. 定义 Advanced 弹窗的通用结构（哪些参数每个工具都有、哪些是工具特有的）
3. 定义 Canvas 面板与沉浸弹窗的动效规范（弹出/关闭/遮罩过渡）
4. 实现多选交互（框选 + ⌘ 点击）→ 解锁批量操作和批量下载
5. 定义 Canvas ↔ Grid 素材同步规则
