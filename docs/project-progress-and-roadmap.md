# 无限画布项目进展与开发路线图

> **文档版本**: v1  
> **日期**: 2026-03-16  
> **目的**: 梳理当前进展、从线上仓库迁入的能力、以及后续开发方向与节奏。

---

## 一、当前项目状态概览

### 1.1 本仓库已具备的能力

| 能力 | 状态 | 说明 |
|------|------|------|
| **侧边栏结构** | ✅ 已有 | Image / Video / Avatar / Audio 四大类 + 二级子菜单，共 21 个小工具入口（见下表） |
| **部分小工具实现** | ⚠️ 部分 | Text to Image、Image Edit、Inpaint、Product Photography 等有面板/弹窗；其余多为 `demoDisabled: true` |
| **键盘快捷键** | ✅ 已有 | `KeyboardShortcutsModal` + `KEYBOARD_SHORTCUTS.md`，覆盖 View / Selection / Tools / Actions / Multi-select |
| **QuickActionToolbar** | ✅ 已有 | 跟随节点、zoom 无关尺寸、Glassmorphism 风格；ImageNode 等已配置 Remix、Inpaint、Upscale、Download 等 |
| **多选与 MultiSelectBar** | ✅ 已有 | 框选、⌘ 点击、批量操作条 |
| **事件桥** | ✅ 已有 | 占位创建、`NODE_QUICK_ACTION`、面板/弹窗与宿主通信 |
| **设计规范** | ✅ 已有 | AGENTS.md：QuickAction/MultiSelect 与 zoom 规则、Glassmorphism、选中框/把手规范 |

### 1.2 侧边栏当前二级小工具清单（本仓库）

| 分类 | 子工具 | 本仓库状态 |
|------|--------|------------|
| **Image** | Text to Image, Image Edit, Inpaint, Image Character Swap, Image Face Swap, Image Upscale, Photo Angle Editor, Product Photography | 前 4 个有实现/面板，后 4 个 `demoDisabled` |
| **Video** | Image to Video, Text to Video, Omni Reference, Video Character Swap, Video Upscale, Motion Control | 全部 `demoDisabled` |
| **Avatar** | AI Avatar, Video Lip Sync, Product Avatar, Design My Avatar | 全部 `demoDisabled` |
| **Audio** | Voiceover | `demoDisabled` |

### 1.3 待从「线上仓库」迁入的内容（你的需求）

> **说明**：此处「线上仓库」指你将要从中拷贝代码的另一个仓库；请在团队内约定其路径或名称（如 `apps/base`、Board 主仓库等），便于迁移时对照。


1. **侧边栏 Image / Video / Avatar / Audio 全部二级小工具**  
   - 指：线上仓库里这些工具在 **Grid/Board** 侧的完整实现（交互、参数、与后端/事件桥的对接）。  
   - 迁入后：在 Canvas 侧复用时，占位创建 → 面板/弹窗 → 事件桥 → 结果回填 的链路要与现有事件桥一致；部分工具已有 Canvas 面板/弹窗的保留，缺的从线上仓库补全或对齐逻辑。

2. **键盘快捷键**  
   - 指：与线上仓库（或 Board 产品）一致的快捷键集合与行为。  
   - 本仓库已有 `KeyboardShortcutsModal` 和 `KEYBOARD_SHORTCUTS.md`，迁入时需对比线上仓库的快捷键列表与实现，查漏补缺并统一文档。

3. **QuickActionToolbar 新增「放大观看」**  
   - 指：在节点快捷操作栏增加一项「放大观看 / 查看详情」，点击后在合适容器内**展示该素材的详情**（大图/大视频预览、元数据等）。  
   - 本仓库暂无该能力，需新增：入口（QuickAction 按钮）+ 详情展示 UI（如 Modal 或侧边抽屉）+ 与当前节点数据的绑定。

---

## 二、迁移任务拆解（从线上仓库 → 本仓库）

### 2.1 侧边栏全部二级小工具

| 步骤 | 内容 | 产出 |
|------|------|------|
| M1 | 从线上仓库梳理：Image/Video/Avatar/Audio 下每个 toolId 的入口、参数、API/事件 | 清单：toolId ↔ 面板/弹窗形态 ↔ 事件/API |
| M2 | 与本仓库侧边栏配置对齐：确保 21 个小工具 id、label、actionType 与线上一致 | 更新 `CollaborativeCanvas` 侧边栏配置（如需要） |
| M3 | 迁入 Canvas 面板（Compact）类：Text to Image 已存在，补 Image Edit 等；Video/Avatar/Audio 各家族面板 | 各 Panel 组件或复用/适配线上组件 |
| M4 | 迁入沉浸弹窗（Immersive Modal）类：Inpaint、Product Photography 等已有；补 Character Swap、Face Swap、Photo Angle、Try-On、Motion Control 等 | Modal 组件 + 事件桥事件名 |
| M5 | 事件桥与宿主对接：确保 `CANVAS_ADD_PLACEHOLDER`、`NODE_QUICK_ACTION`、结果回填等与线上仓库约定一致 | 文档 + 必要时 bridge 接口扩展 |

### 2.2 键盘快捷键

| 步骤 | 内容 | 产出 |
|------|------|------|
| K1 | 导出线上仓库的快捷键列表（含 View / 选择 / 编辑 / 工具切换 / 多选分布等） | 清单 |
| K2 | 与本仓库 `KEYBOARD_SHORTCUTS.md` 和 `KeyboardShortcutsModal` 对比，列出差异 | 差异表 |
| K3 | 在本仓库实现缺失的快捷键（如图层顺序、导出、删除等）并统一 key 绑定 | 代码 + 更新 KEYBOARD_SHORTCUTS.md |
| K4 | 更新 KeyboardShortcutsModal 的展示内容与线上一致（中英双语若需要） | 文案与分组更新 |

### 2.3 QuickActionToolbar「放大观看」功能

| 步骤 | 内容 | 产出 |
|------|------|------|
| Q1 | 产品确认：详情展示形式（全屏 Modal / 侧边抽屉 / 画布内浮层）与信息范围（预览 + 元数据 + 操作按钮） | 结论 |
| Q2 | 在 QuickActionToolbar 的 actions 中新增一项「放大观看」（如 icon: Maximize2 或 Eye） | ImageNode / VideoNode / AudioNode 等传入该 action |
| Q3 | 实现详情容器：根据节点类型展示大图/视频播放器/音频播放器 + 元数据（尺寸、时长、状态等） | 新组件 AssetDetailViewer（或同名） |
| Q4 | 与事件桥/宿主约定：若详情需「从 Board 拉取更多信息」则定义事件或 props | 可选 |

---

## 三、开发方向与节奏建议

### 3.1 总体方向

- **产品目标**：Canvas 作为 Board 的 View，与 Grid 共享素材与工具，侧边栏工具、快捷键、QuickAction 与 Board/线上体验一致。  
- **技术方向**：在现有事件桥与节点体系上，补齐「工具实现」与「详情查看」，不改变 Canvas 核心架构。

### 3.2 建议的先后顺序（按依赖与价值排序）

| 阶段 | 任务 | 理由 |
|------|------|------|
| **1** | **键盘快捷键对齐（2.2）** | 无 UI 迁移依赖，改键位与文档即可，快速与线上一致。 |
| **2** | **QuickActionToolbar「放大观看」（2.3）** | 纯本仓库新增，不依赖线上仓库代码迁入，先做可尽快提升单节点体验。 |
| **3** | **侧边栏小工具迁入（2.1）** | 依赖线上仓库代码与 API/事件约定，工作量大，放在前两项之后；可再按 Image → Video → Avatar → Audio 或按「面板 / 弹窗」分批。 |

### 3.3 节奏建议

- **短期（1–2 周）**  
  - 完成快捷键对齐（K1–K4）。  
  - 完成「放大观看」产品形态确认 + QuickAction 入口 + 详情容器（Q1–Q3）。  

- **中期（2–4 周）**  
  - 侧边栏 M1–M2（清单与配置对齐）。  
  - 优先迁入 Image 类剩余工具 + Video 类 1–2 个高优工具（M3–M4 部分）。  

- **后续**  
  - 按家族补齐 Video / Avatar / Audio 面板与弹窗（M3–M5）。  
  - 与 `docs/canvas-board-relationship-analysis.md`、`docs/infinite-canvas-iteration-prd.md` 中的项目 6/8 等节点对齐验收。

### 3.4 与本仓库现有文档的关系

- **`docs/canvas-board-relationship-analysis.md`**：工具与 Board 的映射、21 工具呈现方式与家族 Tab，迁移时以之为「目标形态」参考。  
- **`docs/infinite-canvas-iteration-prd.md`**：项目 6（接入 Image/Video/Audio/Avatar）、项目 8（多选、右键、QuickAction、快捷键）等，本路线图与之一致，迁移完成后可在该 PRD 中勾选对应节点。  
- **`packages/widget/KEYBOARD_SHORTCUTS.md`**：快捷键以之为单页真相，迁入后保持与实现同步更新。

---

## 四、一页汇总：接下来按什么方向、节奏、顺序

| 顺序 | 做什么 | 节奏 |
|------|--------|------|
| 1 | 从线上仓库对齐**键盘快捷键**（列表 + 实现 + KeyboardShortcutsModal + KEYBOARD_SHORTCUTS.md） | 1 周内 |
| 2 | 在本仓库新增 **QuickActionToolbar「放大观看」**（入口 + 素材详情展示 UI） | 1 周内 |
| 3 | 从线上仓库迁入**侧边栏全部二级小工具**：先清单与配置对齐，再按 Image → Video → Avatar → Audio 分批迁入面板/弹窗与事件桥 | 2–4 周，分批交付 |

以上顺序可随「线上仓库可访问时间」或「产品优先级」微调；放大观看若与某类素材强相关，也可与对应工具迁入同批排期。

---

*文档维护：完成迁移或迭代后更新本表与相关 PRD/分析文档。*
