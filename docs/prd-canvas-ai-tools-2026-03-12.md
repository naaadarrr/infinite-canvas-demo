# PRD：Canvas AI 工具交互设计方案

**工具范围**：Text to Image · Image Edit · Product Photography  
**文档版本**：v1.1  
**日期**：2026-03-12（更新）  
**状态**：已实施（含待补充项标注）

---

## 变更记录

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| v1.0 | 2026-03-12 | 初版，记录三个工具的交互设计方案 |
| v1.1 | 2026-03-12 | 补充底部工具栏规范；更新光标行为；修正 Select/Hand 工具命名；补充缩放控件交互；修正已知 Bug 修复记录 |

---

## 一、设计原则

1. **画布优先**：面板不遮挡画布主体；创作者始终感知自己在画布上操作。
2. **两种呈现模式**：轻量工具用 Canvas Panel（跟随节点、画布可见）；复杂配置用 Immersive Modal（全屏遮罩、专注配置）。
3. **占位节点驱动**：所有 AI 工具先在画布上创建占位节点，再打开配置面板；生成结果直接替换占位节点，位置不变。
4. **状态保留**：面板关闭（Esc / 点击外部）只关闭面板，占位节点保留在画布上；再次点击节点重新打开面板并恢复上次参数。
5. **积分可见**：Generate 按钮始终显示消耗积分数，禁用态时视觉降级（灰色背景）。

---

## 二、通用组件

### 2.1 Canvas Panel（轻量面板）

用于跟随节点的紧凑型工具面板，不遮挡画布整体。

**两种渲染模式**：

| 模式 | 触发场景 | 定位方式 |
|------|----------|----------|
| **Inline**（内联） | 渲染在 React Flow `NodeToolbar` 内部，随画布缩放/平移同步移动 | 由 NodeToolbar 控制，居中对齐节点底部 |
| **Standalone**（独立） | 渲染在画布 DOM 外层，绝对定位 | 节点正下方 + 8px 间距，水平居中；左边界 ≥ 72px（侧边栏宽度）；右边界不超出视口 |

**结构**：

```
┌──────────────────────────────────────┐
│ [Tab A]  Tab B                        │  ← Tab 栏（≥2 个 Tab 时显示）
├──────────────────────────────────────┤
│                                      │
│  {children} — 工具主体内容            │
│                                      │
├──────────────────────────────────────┤
│  Param ▾  Param ▾  Param ▾  │  Send  │  ← Bottom Bar
└──────────────────────────────────────┘
```

**关闭行为**（Standalone 模式）：
- `Esc` 键关闭
- 点击面板外区域关闭（点击节点本身不关闭）
- 关闭后占位节点保留，再次点击节点重新打开

**动画**：打开时 `opacity 0→1` + `translateY(-6px→0)`，160ms ease

**尺寸**：
- 固定宽度 **480px**（不随节点大小缩放）
- 当节点屏幕宽度 ≥ 1200px 时自动隐藏面板（用户正在放大查看细节，不适合显示操作面板）

---

### 2.2 Immersive Modal（沉浸弹窗）

用于需要大量配置的工具，全屏遮罩、专注操作。

**结构**：

```
┌────────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ [×]   │
│ ░░  ┌──────────────────────────────────────────┐  ░░  │
│ ░░  │              {title}                      │  ░░  │
│ ░░  ├──────────────────────────────────────────┤  ░░  │
│ ░░  │                                          │  ░░  │
│ ░░  │           {children}                     │  ░░  │
│ ░░  │                                          │  ░░  │
│ ░░  ├──────────────────────────────────────────┤  ░░  │
│ ░░  │              {footer}                    │  ░░  │
│ ░░  └──────────────────────────────────────────┘  ░░  │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
└────────────────────────────────────────────────────────┘
  ░ = 遮罩 rgba(0,0,0,0.6)，点击关闭
```

**关闭行为**：
- `Esc` 键关闭
- 点击遮罩关闭
- 点击 × 按钮关闭
- 关闭后占位节点保留，节点取消选中

**动画**：遮罩 fade-in 200ms + 弹窗 `scale(0.96→1)` + `opacity(0→1)` 200ms；关闭反向 180ms

**尺寸**：最大宽度 1400px（Product Photography 双栏布局需要），`position: fixed`，左侧留出 64px 侧边栏偏移

---

### 2.3 ParamDropdown（参数下拉）

底栏参数选择器，图标 + 文字，点击展开选项列表。

- 宽度：内容自适应（Model 固定 102px，其余 auto）
- 选中项高亮（白色文字 + 轻背景）
- 点击外部关闭

---

### 2.4 UploadSlot（上传区）

| 尺寸 | 用途 | 行为 |
|------|------|------|
| Small（64×64） | Image Edit 参考图 | 点击上传；有图时 hover 显示 × 移除 |
| Large（全宽 × 自适应） | Product Photography 产品图 | 点击上传 / Select from Board；有图时显示缩略图 + × |

---

## 三、底部工具栏

画布底部居中固定工具栏，提供工具模式切换、资产添加、缩放控制、图层面板入口。

### 3.1 工具栏结构

```
┌─────────────────────────────────────────────────────────────┐
│  [↖ Select]  [✋ Hand]  │  [+ Add]  │  [−]  56%  [+]  │  [≡] │
└─────────────────────────────────────────────────────────────┘
```

| 控件 | 快捷键 | 说明 |
|------|--------|------|
| **Select**（选择） | `V` | 选中/移动节点模式；激活态白色背景 + 黑色图标 |
| **Hand**（手型） | `H` | 画布平移模式；激活态白色背景 + 黑色图标 |
| **Add Asset**（添加素材） | — | 打开素材添加菜单；viewer 角色或锁定状态下禁用（灰色） |
| **Zoom Out** | `⌘ −` | 缩小画布；最小 11% 时禁用 |
| **Zoom %** | — | 显示当前缩放比例；点击进入编辑模式直接输入数值 |
| **Zoom In** | `⌘ +` | 放大画布；最大 399% 时禁用 |
| **Layers**（图层） | — | 打开/关闭图层面板；激活态白色背景 |

### 3.2 工具按钮交互规范

**通用状态**：
- **默认**：透明背景，图标 `rgba(255,255,255,0.7)`
- **Hover**：背景 `rgba(255,255,255,0.08)`，图标 `rgba(255,255,255,0.7)`
- **Active（激活）**：背景 `#ffffff`，图标 `#000000`
- **Disabled**：背景透明，图标 `rgba(255,255,255,0.25)`，`cursor: not-allowed`
- **Tooltip**：hover 时在按钮上方显示标签文字（含快捷键）

**Hand 按钮特殊光标**：
- Hand 激活时按钮自身光标为 `grab`
- 按住鼠标时光标变为 `grabbing`

### 3.3 缩放百分比控件

**显示态**：
- 最小宽度 44px，高度 28px，圆角 8px
- 默认颜色 `rgba(255,255,255,0.6)`
- Hover：背景 `rgba(255,255,255,0.08)`，颜色变白（与工具按钮 hover 视觉一致）
- 过渡：`background 120ms ease, color 120ms ease`

**编辑态**（点击后进入）：
- 变为 `<input>`，宽度 44px，背景 `rgba(255,255,255,0.08)`，圆角 8px
- 自动聚焦并全选当前值
- `Enter` 提交，`Esc` 取消，失焦提交
- 输入值范围：10–400（超出自动 clamp）

---

## 四、光标行为规范

### 4.1 Select 模式

| 区域 | 光标 |
|------|------|
| 画布空白区域（pane） | `default` |
| 可选中节点（idle） | `grab` |
| 节点拖拽中 | `grabbing` |
| 节点拖拽（全局） | `move`（body 级） |

### 4.2 Hand 模式

Hand 模式通过给画布容器添加 `.tc-pan-mode` CSS 类统一控制所有光标：

| 区域 | 光标 |
|------|------|
| 画布空白区域 | `grab` |
| 节点上 | `grab`（覆盖 Select 模式的 grab，保持一致） |
| 鼠标按下（拖拽中） | `grabbing`（CSS `:active` 伪类驱动） |
| Hand 工具按钮本身 | `grab` / `grabbing`（按下时） |

### 4.3 其他状态

| 状态 | 光标 |
|------|------|
| 画布锁定 | `not-allowed` |
| Inpaint 模式 | `none`（自定义笔刷光标） |
| 文本工具 | `text` |
| 禁用按钮 | `not-allowed` |

### 4.4 Space 键临时 Hand 模式

- 按住 `Space`：临时切换到 Hand 模式（`grab` 光标）
- 松开 `Space`：恢复 Select 模式
- 仅在 Immersive Modal 未打开时生效（Modal 打开时 Space 不触发模式切换）

---

## 五、Text to Image

### 5.1 入口

| 入口 | 路径 | 行为 |
|------|------|------|
| 侧边栏 | Image → Text to Image | 在画布中心创建 320×320 占位节点 → 自动打开面板 |
| 快捷键 | 暂无 | — |

### 5.2 面板布局

```
┌──────────────────────────────────────────────┐
│ [Text to Image]  Image Edit                   │  ← Tab 栏
├──────────────────────────────────────────────┤
│                                              │
│  Describe the image you want to generate...  │  ← Prompt textarea（自动聚焦）
│                                              │
├──────────────────────────────────────────────┤
│ ✦ Nano Banana 2 ▾ │ □1:1▾ │ 📺1K▾ │  ⚡25 Generate ▾ │
└──────────────────────────────────────────────┘
```

### 5.3 参数

| 控件 | 类型 | 默认值 | 选项 |
|------|------|--------|------|
| Model | Dropdown | Nano Banana 2 | Nano Banana 2 / Seedream 5.0 / GPT Image 1.5 / Kontext-Pro / Imagen 4 |
| Ratio | Dropdown | 1:1 | 1:1 / 16:9 / 9:16 / 4:3 / 3:4（图标随比例变化） |
| Resolution | Dropdown | 1K | 512p / 1K / 2K / 4K |
| ⚙ Advanced | Button | — | 打开 Advanced 弹窗（**待接入**） |

### 5.4 Generate 按钮

- **可用态**：蓝色背景（`#3643FF`）+ 金色 Crown 图标 + 积分数
- **禁用态**（Prompt 为空）：灰色背景 `rgba(255,255,255,0.06)`，不可点击
- **Split 设计**：
  - 左侧主按钮：`⚡ {credits} Generate`
  - 右侧 `▾` 箭头：展开下拉菜单
  - 下拉选项：Generate with watermark

### 5.5 提交行为

1. 点击 Generate（或 Prompt 聚焦时按 `Enter`）
2. emit `CANVAS_CREATE_ACTION`，payload：
   ```ts
   {
     actionId: 'text-to-image',
     nodeId,
     prompt,
     model,
     ratio,
     resolution,
     referenceImageUrl?,  // Image Edit 时携带
     withWatermark,
   }
   ```
3. 面板关闭，占位节点进入 loading 骨架状态（`raw.status: 'init'`）
4. 宿主回调更新节点为实际生成结果

### 5.6 Advanced 弹窗（组件已实现，待接入底栏）

| 参数 | 类型 | 默认值 | 范围 |
|------|------|--------|------|
| Steps | Number input | 30 | 1–100 |
| CFG Scale | Number input | 7 | 1–30，步长 0.5 |
| Seed | Text input | 空（Random） | 任意字符串 |
| Negative Prompt | Textarea | 空 | 自由文本 |

操作：Reset（恢复默认）/ Done（关闭）

---

## 六、Image Edit

### 6.1 入口

| 入口 | 路径 | 行为 |
|------|------|------|
| 侧边栏 | Image → Image Edit | 创建占位节点 → 打开面板，默认 Image Edit Tab |
| QuickAction | 选中图片节点 → Remix | 打开面板，Image Edit Tab，自动填入当前图片为参考图（Remix 模式） |

### 6.2 面板布局

```
┌──────────────────────────────────────────────┐
│  Text to Image  [Image Edit]                  │  ← Tab 栏，Image Edit 激活
├──────────────────────────────────────────────┤
│ ┌────┐                                        │
│ │ +  │  Describe how you want to edit...      │  ← 参考图 Slot + Prompt
│ │Ref │                                        │
│ └────┘                                        │
├──────────────────────────────────────────────┤
│ ✦ Nano Banana 2 ▾ │ □1:1▾ │ 📺1K▾ │  ⚡25 Generate ▾ │
└──────────────────────────────────────────────┘
```

### 6.3 参考图上传区（UploadSlot Small，64×64）

**空状态**：
- 虚线边框 + `+` 图标
- Hover 时出现「Select from Board」浮层按钮
- 点击触发 `CANVAS_CREATE_ACTION { actionId: 'upload-reference', nodeId }`

**有图状态**：
- 显示缩略图（`object-fit: cover`）
- Hover 显示 × 移除按钮（右上角）

**Remix 模式自动填入**：
- 从 QuickAction 进入时，`referenceImageUrl` 自动填入当前节点图片 URL
- 面板以 Image Edit Tab 打开，图片已预填

### 6.4 Tab 切换行为

- 切换时保留 Prompt 内容
- 切换时保留底栏参数（Model / Ratio / Resolution）
- 切换到 Text to Image 时，参考图 Slot 隐藏但不清除（切回 Image Edit 时恢复）

### 6.5 提交行为

同 Text to Image，`actionId` 为 `'image-edit'`，payload 额外包含 `referenceImageUrl`。

---

## 七、Product Photography

### 7.1 入口

| 入口 | 路径 | 行为 |
|------|------|------|
| 侧边栏 | Image → Product Photography | 创建 320×320 占位节点 → 打开 Immersive Modal |
| QuickAction | 选中图片 → 更多菜单 → Product Photography（**待实现**） | 打开 Modal，自动填入当前图片为产品图 |

### 7.2 弹窗布局（双栏）

```
┌─────────────────────────────────────────────────────────────┐
│                    Product Photography                  [×]  │
├──────────────────────┬──────────────────────────────────────┤
│                      │                                      │
│  Product Image       │  Background                          │
│  ┌────────────────┐  │  ┌──────────────────────────────┐   │
│  │                │  │  │ Image Background │ Prompt Bg  │   │
│  │   [缩略图]     │  │  └──────────────────────────────┘   │
│  │                │  │                                      │
│  └────────────────┘  │  ┌──────────────────────────────┐   │
│                      │  │ Templates │ Upload │ From Board│   │
│  9:16 3:4 [1:1] 4:3  │  └──────────────────────────────┘   │
│  16:9                │                                      │
│                      │  [模板分类横向滚动列表...]            │
│                      │                                      │
├──────────────────────┴──────────────────────────────────────┤
│                    ⚡ 25   Generate                          │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 左栏：产品图

**空状态**：
- 全宽正方形虚线上传区（棋盘格背景体现透明度）
- 点击触发 `CANVAS_CREATE_ACTION { actionId: 'upload-product', nodeId }`
- Hover 时出现「Select from Board」浮层按钮
- 底部 Quick Start 示例图（4 个 emoji 占位图，点击直接填入）

**有图状态**：
- 显示产品图缩略图（`scale(0.65)` 居中，棋盘格背景）
- 黄色 Bounding Box 标注（模拟裁切框，含四角圆点 + 旋转手柄）
- 右上角 × 按钮移除

**比例选择**（有图时显示于图片下方）：
- 5 个比例按钮：9:16 / 3:4 / **1:1**（默认） / 4:3 / 16:9
- 选中态：背景 `rgba(255,255,255,0.1)`，边框 `rgba(255,255,255,0.2)`，文字白色

### 7.4 右栏：背景配置

#### 背景模式切换

| 模式 | 说明 |
|------|------|
| **Image Background** | 从模板/上传/画布选择背景图 |
| **Prompt Background** | 文字描述背景（textarea，`Enter` 提交） |

#### Image Background — 三个来源 Tab

| Tab | 行为 |
|-----|------|
| **Templates** | 按分类横向滚动展示模板缩略图（64×64，圆角 6px），点击选中（白色边框 + `scale(1.05)`） |
| **Upload** | 点击上传背景图，显示预览 + × 移除 |
| **From Board** | 3×2 网格展示画布图片，点击选取 |

#### 模板分类（6 类，每类 11–15 项，横向滚动）

| 分类 | 代表风格 |
|------|----------|
| General Display | Studio White / Warm Light / Golden Hour / Terracotta 等 |
| Fabric & Velvet | Silk White / Velvet Red / Satin Gold / Burgundy 等 |
| Home Life | Kitchen Counter / Wooden Table / Plant Shelf / Fireplace 等 |
| Water Elements | Ocean Blue / Pool Aqua / Deep Sea / Lagoon 等 |
| Sand & Rocks | Beach Sand / Marble White / Obsidian / Clay 等 |
| Creative Photography | Neon Glow / Galaxy / Cyberpunk / Bokeh 等 |

每类右侧有「More →」按钮（当前为占位，未实现展开）。

#### Prompt Background

- Textarea，placeholder：「Describe the background you want to generate...」
- `Enter`（非 `Shift+Enter`）在 canSubmit 时提交

### 7.5 底部 Generate 按钮

- 居中，宽度 400px，高度 40px，圆角 10px
- **可用条件**：产品图已上传 AND（已选模板 OR 已上传背景图 OR 已填写 Background Prompt）
- **可用态**：蓝色背景（`#3643FF`）+ 金色 Crown 图标 + 积分数
- **禁用态**：灰色背景 `rgba(255,255,255,0.08)`，文字 `rgba(255,255,255,0.4)`，不可点击

### 7.6 提交行为

1. 点击 Generate
2. emit `CANVAS_CREATE_ACTION`，payload：
   ```ts
   {
     actionId: 'product-photography',
     nodeId,
     productImageUrl,
     backgroundPrompt,
     backgroundImageUrl,
     selectedTemplateId,
     ratio,
   }
   ```
3. 弹窗关闭，占位节点进入 loading 骨架（`raw.status: 'init'`）
4. 节点取消选中，视口 `fitView` 到该节点（padding 0.4，maxZoom 1.2，duration 400ms）
5. ~1.5s 后（mock）节点更新为结果图（`raw.status: 'success'`，`url` 填入）

---

## 八、状态流转

### 占位节点生命周期

```
侧边栏点击
    │
    ▼
创建占位节点（url: '', toolId: 'xxx', selected: true）
    │
    ▼
自动打开面板（tryActivatePlaceholderPanel）
    │
    ├─ 用户关闭面板 ──→ 节点保留（取消选中）
    │                    再次点击节点 ──→ 重新打开面板
    │
    └─ 用户点击 Generate
            │
            ▼
        emit CANVAS_CREATE_ACTION
        节点状态：raw.status = 'init'（骨架动画）
        面板关闭，节点取消选中
            │
            ▼
        宿主回调 / mock 延迟（~1.5s）
            │
            ▼
        节点状态：raw.status = 'success'，url = 结果图
        ppGeneratingRef 清除（允许再次点击打开面板）
```

### 防重入保护

| 机制 | 说明 |
|------|------|
| `ppGeneratingRef` | 生成中的节点 ID 集合；生成期间点击节点不重新打开 Modal |
| `ppClosedAtRef` | Modal 关闭时记录时间戳；500ms 冷却防止立即重触发 |
| `raw.status` 检查 | 有 status 的节点（init / success / fail）不触发面板 |
| `node.url` 检查 | 有 URL 的节点（已有结果）不触发面板 |

---

## 九、键盘交互

| 快捷键 | 作用 |
|--------|------|
| `Enter`（Prompt 聚焦时） | 提交（canSubmit 为 true 时） |
| `Shift + Enter` | Prompt 换行 |
| `Esc` | 关闭面板 / Modal |
| `V` | 切换到 Select 模式 |
| `H` | 切换到 Hand 模式 |
| `Space`（按住） | 临时切换到 Hand 模式（松开恢复；Modal 打开时不触发） |
| `⌘ 0` / `Ctrl 0` | 画布 fitView（适应所有节点） |
| `⌘ 1` / `Ctrl 1` | 缩放重置到 100% |
| `Z`（节点选中时） | fitView 到选中节点 |
| `F` | fitView 到全部节点 |
| `Delete` / `Backspace` | 删除选中节点（单选时有效） |

---

## 十、待补充项

| 编号 | 项目 | 优先级 | 说明 |
|------|------|--------|------|
| P1 | ⚙ Advanced 按钮接入 TextToImagePanel | 高 | 组件已实现，需在底栏加入按钮并管理弹窗状态 |
| P2 | CanvasPanel 底部溢出翻转 | 中 | 节点在视口底部时，面板应显示在节点上方 |
| P3 | Product Photography QuickAction 入口 | 中 | ImageNode moreActions 加入「Product Photography」，自动填入产品图 |
| P4 | ✂ Adjust Cutout 按钮 | 低 | 产品图区域加入按钮，点击 toast「Coming soon」 |
| P5 | 模板 More → 展开 | 低 | 当前为占位按钮，未实现展开更多模板 |

---

## 十一、设计规范速查

### 颜色

| Token | 值 | 用途 |
|-------|-----|------|
| 面板背景 | `#18191d` | Canvas Panel 背景 |
| 弹窗背景 | `#000000` | Immersive Modal 背景 |
| 工具栏背景 | `rgba(28,30,34,1)` | BottomToolbar 背景 |
| 面板边框 | `rgba(255,255,255,0.07)` | Canvas Panel 边框 |
| 弹窗边框 | `rgba(255,255,255,0.15)` | Immersive Modal 边框 |
| 工具栏边框 | `rgba(255,255,255,0.08)` | BottomToolbar 边框 |
| 遮罩 | `rgba(0,0,0,0.6)` | Immersive Modal 遮罩 |
| 强调色 | `#3643FF` | Generate 按钮可用态 |
| 积分图标 | `#facc15` | Crown 图标颜色 |
| 分割线 | `rgba(255,255,255,0.06)` | 底栏分割线 |
| 按钮 hover | `rgba(255,255,255,0.08)` | 工具栏按钮 hover 背景 |
| 按钮激活 | `#ffffff` bg + `#000000` text | 工具栏按钮激活态 |

### 尺寸

| 元素 | 值 |
|------|-----|
| Canvas Panel 宽度 | 480px（固定，不随节点缩放） |
| Canvas Panel 自动隐藏阈值 | 节点屏幕宽度 ≥ 1200px |
| Immersive Modal 最大宽度 | 1400px |
| 工具栏按钮 | 28×28px，圆角 8px |
| 缩放百分比控件 | 最小宽度 44px，高度 28px |
| 底栏高度 | 约 40px（padding 8px 上下） |
| Tab 按钮高度 | 24px |
| UploadSlot Small | 64×64px |
| 模板缩略图 | 64×64px，圆角 6px |
| Generate 按钮（Modal） | 400×40px，圆角 10px |
| 圆角 | 面板 12px / 弹窗 16px / 按钮 8–10px |

### 动画时长

| 动画 | 时长 | Easing |
|------|------|--------|
| Canvas Panel 打开 | 160ms | ease |
| Immersive Modal 打开 | 200ms | ease |
| Immersive Modal 关闭 | 180ms | ease |
| 工具按钮 hover | 120ms | ease |
| fitView（生成后） | 400ms | — |
