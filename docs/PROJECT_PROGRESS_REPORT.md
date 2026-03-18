# 无限画布项目进度报告

> **检查日期**: 2026-03-16  
> **基于**: 代码库扫描 + `docs/project-progress-and-roadmap.md`、`sidebar_tools_integration_e06eb16a.plan.md` 对照。

---

## 一、总体进度概览

| 模块 | 状态 | 完成度（约） | 说明 |
|------|------|--------------|------|
| 侧边栏 21 个小工具 | 🟡 进行中 | **约 67%** | 17 个已启用并可点击，7 个仍 `demoDisabled` |
| 键盘快捷键 | ✅ 已完成 | **100%** | 实现 + 文档 + Modal 齐全 |
| QuickActionToolbar「放大观看」 | ❌ 未开始 | **0%** | 无入口、无详情容器 |
| 多选 / 事件桥 / 设计规范 | ✅ 已有 | — | 与路线图一致 |

---

## 二、侧边栏小工具明细（21 个）

### 2.1 已启用（demoDisabled: false）— 17 个

| 分类 | 工具 ID | 本仓库对应 UI | 备注 |
|------|---------|----------------|------|
| **Image** | text-to-image | TextToImagePanel | ✅ |
| | image-edit | 同上（Tab） | ✅ |
| | inpaint | InpaintTutorialModal + 沉浸流程 | ✅ |
| | image-upscale | ImageUpscaleModal | ✅ |
| | product-photography | ProductPhotographyModal | ✅ |
| **Video** | image-to-video | AIVideoPanel / AIVideoModal | ✅ |
| | text-to-video | 同上（Tab） | ✅ |
| | video-upscale | VideoUpscaleModal | ✅ |
| **Avatar** | ai-avatar | AIAvatarModal | ✅ |
| | product-avatar | ProductAvatarModal | ✅ |
| | design-avatar | DesignMyAvatarModal | ✅ |
| | video-lip-sync | VideoLipSyncModal | ✅ |
| **Audio** | — | — | 见下 |

### 2.2 仍禁用（demoDisabled: true）— 7 个

| 分类 | 工具 ID | 缺失 | 预计工作量（参考 plan） |
|------|---------|------|-------------------------|
| Image | image-character-swap | 沉浸弹窗 + 事件桥 | Phase 5，约 2–3 天 |
| | image-face-swap | 同上 | Phase 5，约 2–3 天 |
| | photo-angle-editor | 沉浸弹窗 + three.js | Phase 6，约 1–2 天 |
| Video | omni-reference | Canvas 面板 | 约 0.5–1 天 |
| | video-character-swap | 同 Image Character Swap | 与上合并 |
| | motion-control | 沉浸弹窗 | Phase 6，约 1–2 天 |
| Audio | voiceover | Canvas 面板 / 弹窗 | Phase 4，约 1–2 天 |

**说明**：Avatar 4 个已全部启用；Audio 仅 Voiceover 一个工具且当前禁用，需新增 Voiceover 面板/弹窗。

---

## 三、键盘快捷键

- **实现**：`KeyboardShortcutsModal` 与画布内 key 监听已覆盖 View / Tools / Selection / Edit / 多选分布。
- **文档**：`docs/KEYBOARD_SHORTCUTS.md` 已更新（中英说明、设计原则）。
- **与线上对齐**：若线上仓库有额外快捷键，需做一次 K1–K4 对比（见路线图 2.2 节）；当前本仓库内无待办。

---

## 四、QuickActionToolbar「放大观看」

- **现状**：未实现。
  - `ImageNode` 的 `visibleActions` 仅有 Remix、Inpaint、Generate Video、Edit Angles、AI Avatar、Upscale、Download，无「放大观看 / 查看详情」。
  - 无 `AssetDetailViewer` 或类似详情容器组件。
- **待做**：路线图 2.3 节 Q1–Q4（产品形态确认 → 添加入口 → 详情 UI → 可选事件桥）。

---

## 五、剩余工作与预估时间

### 5.1 侧边栏剩余 7 个工具

| 批次 | 内容 | 预估 |
|------|------|------|
| 1 | Omni Reference（面板） + Voiceover（面板/弹窗） | 1.5–3 天 |
| 2 | Character Swap（Image + Video） + Face Swap（Image + Video） | 4–5 天 |
| 3 | Photo Angle Editor + Motion Control | 2–4 天 |

**合计**：约 **8–12 个工作日**（视是否复用线上仓库组件与 API 而定）。

### 5.2 QuickActionToolbar「放大观看」

| 步骤 | 预估 |
|------|------|
| Q1 产品确认 + Q2 入口 + Q3 详情容器（图/视频/音频） | 2–4 天 |

### 5.3 与线上仓库对齐（可选）

- 快捷键对比与补全（K1–K4）：约 **0.5–1 天**。
- 事件桥/宿主对接与联调：视宿主环境，约 **1–3 天**。

---

## 六、一页汇总

| 项目 | 进度 | 剩余预估 |
|------|------|----------|
| 侧边栏 21 工具 | 17/21 已启用，7 个待接入面板/弹窗 | **8–12 天** |
| 键盘快捷键 | 已完成 | 0（若与线上对齐 +0.5–1 天） |
| QuickAction「放大观看」 | 未开始 | **2–4 天** |
| **整体** | 约 **2/3 完成** | **约 10–17 个工作日**（可并行则日历时间更短） |

---

*报告生成后可根据实际完成情况更新 `docs/project-progress-and-roadmap.md` 与 plan 中的 todo 状态。*
