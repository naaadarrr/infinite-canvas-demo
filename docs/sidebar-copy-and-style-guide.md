# 侧边栏复用：可直接复制的目录 + 统一样式话术

## 一、可直接复制的目录与文件

### 1. 侧边栏核心包（整包复制）

复制整个目录到新项目，例如 `your-project/packages/sidebar/`：

```
packages/sidebar/
├── package.json
├── tsconfig.json
├── rollup.config.mjs
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── index.ts
│   ├── styles.css
│   ├── utils/
│   │   └── cn.ts
│   ├── core/
│   │   ├── Sidebar.tsx
│   │   └── types.ts
│   ├── components/
│   │   ├── SidebarFooter.tsx
│   │   ├── SidebarUserMenu.tsx
│   │   ├── UserAvatar.tsx
│   │   ├── UserMenuItem.tsx
│   │   ├── UserMenuHeader.tsx
│   │   ├── UserMenuContent.tsx
│   │   ├── EditNameModal.tsx
│   │   ├── LanguageSelector.tsx
│   │   └── types.ts
│   ├── providers/
│   │   ├── index.ts
│   │   ├── SidebarProvider.tsx
│   │   └── types.ts
│   ├── hooks/
│   │   ├── useClickOutside.ts
│   │   └── useMenuPosition.ts
│   └── nextjs-adapter/
│       └── index.ts
```

**根目录下执行：**
```bash
cp -r packages/sidebar /path/to/your-new-project/packages/sidebar
cd /path/to/your-new-project/packages/sidebar && pnpm install && pnpm build
```

---

### 2. 应用层集成（按需复制）

若新项目是 Next.js 且要沿用 base 的用法，可复制以下文件并改路径/业务逻辑：

```
apps/base/src/
├── components/Sidebar/
│   ├── AppSidebar.tsx          # 应用层入口，注入依赖、回调
│   ├── index.ts
│   ├── config.tsx              # 若有自定义 config 可一起复制
│   └── hooks/
│       └── useUserMenuActions.ts
└── configs/
    ├── menuConfig.ts           # 工具分类：Image / Video / Avatar / Audio、路由、翻译
    └── userMenuConfig.ts       # 用户菜单项（可选）
```

**最小集成**只需：
- `AppSidebar.tsx`（或仿照其结构写一个）
- 一份 `menuConfig`（或精简版 `toolCategories` + 路由映射）

---

### 3. 依赖清单（新项目需安装）

侧边栏包本身的依赖见 `packages/sidebar/package.json`，应用层需安装：

```json
{
  "dependencies": {
    "@topview/sidebar": "workspace:*",
    "lucide-react": "^0.300.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "@radix-ui/react-popover": "^1.1.0"
  }
}
```

若复制的是整包，把 `@topview/sidebar` 改为指向本地 `packages/sidebar`（如 `"@topview/sidebar": "workspace:*"`）。

---

## 二、如何跟 AI 说「统一侧边栏样式」

下面几段可以直接复制给 AI 使用，按你的需求选一段或组合使用。

---

### 话术 A：严格按设计稿统一

```
请统一侧边栏的视觉样式，要求：

1. 严格对照设计稿/参考图：宽度、背景色、边框、圆角、图标与文字大小、间距、hover/active 状态都要一致。
2. 侧边栏相关样式只改这些文件：packages/sidebar/src/core/Sidebar.tsx、packages/sidebar/src/components/SidebarFooter.tsx、packages/sidebar/src/styles.css，以及 packages/sidebar 的 tailwind.config.js（若有自定义主题）。
3. 使用 CSS 变量或 Tailwind 主题统一颜色和尺寸，方便后续换肤或适配多端。
4. 改完后列一下改了哪些 class/变量，方便和设计稿对稿。
```

---

### 话术 B：和现有项目风格统一

```
请把侧边栏的样式和当前项目统一，要求：

1. 侧边栏的主色、背景色、字体、圆角、阴影等，都跟项目里已有的布局/导航组件一致（例如 header、其他 sidebar、或 design tokens）。
2. 只修改 packages/sidebar 下的样式相关代码，不动业务逻辑；若项目有全局 CSS 变量或 Tailwind 主题，优先用这些变量/主题。
3. 保证可访问性：对比度、焦点样式、hover 状态清晰可见。
```

---

### 话术 C：只统一颜色和间距

```
请统一侧边栏的配色和间距：

1. 背景色、边框色、文字色、图标色、高亮/促销色（如 47% OFF）都从 [项目 design tokens / 某 CSS 变量文件 / 某 tailwind 配置] 里取，不要写死色值。
2. 导航项、底部区块、用户头像区域的 padding/margin/gap 与 [某参考组件或设计规范] 一致。
3. 只改 packages/sidebar 下的样式（Sidebar.tsx、SidebarFooter.tsx、styles.css、tailwind 配置），并列出改动点。
```

---

### 话术 D：和线上 main 分支侧边栏一致（本项目内）

```
请把当前侧边栏的样式和线上 main 分支的侧边栏完全一致：

1. 以 packages/sidebar 和 apps/base 里使用侧边栏的代码为基准，对比我当前分支的改动，恢复或统一为 main 的样式。
2. 重点核对：侧边栏宽度、背景 bg-[#232326]、边框 border-white/5、Logo 与 Board/Image/Video/Avatar/Audio 的图标与文字样式、底部 47% OFF 与 8 Free 的样式、用户头像尺寸与圆角。
3. 若有样式冲突，以 main 分支的 Sidebar.tsx、SidebarFooter.tsx、styles.css 为准。
```

---

## 三、样式关键位置（方便 AI 或人工对稿）

| 位置 | 文件 | 说明 |
|------|------|------|
| 整体容器 | `Sidebar.tsx` | `aside` 的 className：宽度 `w-16`、背景 `bg-[#232326]`、边框 `border-r border-white/5` |
| Logo | `Sidebar.tsx` | `LOGO_SVG` 及外层 `flex h-14` 容器 |
| 导航项 | `Sidebar.tsx` | Board / Image / Video / Avatar / Audio 的图标 + 文案样式 |
| 底部区块 | `SidebarFooter.tsx` | 促销条、Credits（8 Free）、用户头像 |
| 全局样式 | `styles.css` | Tailwind 入口，可加侧边栏专用变量 |

把「可直接复制的目录」+ 上面某一段「统一侧边栏样式」话术一起发给 AI，即可在新项目里复用侧边栏并统一样式。
