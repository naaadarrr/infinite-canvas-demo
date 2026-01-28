# SVG 图标实现方案

## 概述

将 SVG 图标转换为 React 组件，内联到代码中，使其成为 npm 包的一部分，打包后不需要外部资源引用。

## 方案选择

### ✅ 方案一：直接内联为 React 组件（已采用）

**优点：**
- ✅ 无需额外依赖
- ✅ TypeScript 类型安全
- ✅ 完全打包到代码中
- ✅ 支持 props 传递（size, color, className 等）
- ✅ 支持 `currentColor`，可继承父元素颜色
- ✅ Tree-shaking 友好
- ✅ 构建简单，tsup 原生支持

**缺点：**
- 需要手动转换 SVG

### 方案二：使用 SVGR（未采用）

需要安装额外依赖：
```bash
pnpm add -D @svgr/core @svgr/plugin-jsx
```

配置 tsup：
```typescript
import { defineConfig } from 'tsup';
import { transform } from '@svgr/core';

export default defineConfig({
  esbuildPlugins: [
    {
      name: 'svgr',
      setup(build) {
        build.onLoad({ filter: /\.svg$/ }, async (args) => {
          const svg = await fs.readFile(args.path, 'utf8');
          const jsx = await transform(svg, { typescript: true });
          return { contents: jsx, loader: 'tsx' };
        });
      },
    },
  ],
});
```

## 实现细节

### 1. 图标组件结构

```typescript
import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function EditModeIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        stroke="currentColor"  // 使用 currentColor 继承父元素颜色
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="..."
      />
    </svg>
  );
}
```

### 2. 关键改动

#### 原 SVG 属性
```xml
<svg width="16" height="16" ...>
  <path stroke="white" stroke-width="1.33333" .../>
</svg>
```

#### React 组件属性
```tsx
<svg width={size} height={size} ...>
  <path stroke="currentColor" strokeWidth="1.33333" .../>
</svg>
```

**变更说明：**
1. `width/height` → 使用 `size` prop 控制
2. `stroke="white"` → `stroke="currentColor"` 继承颜色
3. `stroke-width` → `strokeWidth` (驼峰命名)
4. `stroke-linecap` → `strokeLinecap`
5. `stroke-linejoin` → `strokeLinejoin`
6. `clip-path` → `clipPath`

### 3. 文件结构

```
packages/widget/src/icons/
├── EditModeIcon.tsx      # 编辑模式图标
├── LockModeIcon.tsx      # 锁定模式图标
├── PanModeIcon.tsx       # 移动模式图标
├── TextModeIcon.tsx      # 文本模式图标
└── index.ts              # 统一导出
```

### 4. 导出配置

`packages/widget/src/icons/index.ts`:
```typescript
export { EditModeIcon } from './EditModeIcon';
export { LockModeIcon } from './LockModeIcon';
export { PanModeIcon } from './PanModeIcon';
export { TextModeIcon } from './TextModeIcon';
export type { IconProps } from './EditModeIcon';
```

`packages/widget/src/index.ts`:
```typescript
export * from './icons';
```

## 使用方式

### 在组件中使用

```tsx
import { EditModeIcon, PanModeIcon, LockModeIcon, TextModeIcon } from '@tc/infinite-widget';

function Toolbar() {
  return (
    <div>
      {/* 基础使用 */}
      <EditModeIcon />
      
      {/* 自定义大小 */}
      <PanModeIcon size={20} />
      
      {/* 自定义颜色（通过 style 或 color prop） */}
      <LockModeIcon style={{ color: '#ef4444' }} />
      
      {/* 继承父元素颜色 */}
      <button style={{ color: '#3b82f6' }}>
        <TextModeIcon />  {/* 自动使用蓝色 */}
      </button>
      
      {/* 传递其他 SVG 属性 */}
      <EditModeIcon 
        size={24} 
        className="icon"
        onClick={() => console.log('clicked')}
      />
    </div>
  );
}
```

### 在 CollaborativeCanvas 中的应用

```tsx
<button
  style={{
    color: toolMode === 'edit' ? '#3b82f6' : '#64748b',
  }}
>
  <EditModeIcon size={16} />  {/* 自动继承按钮的颜色 */}
</button>
```

## 打包结果

### 构建命令
```bash
cd packages/widget
pnpm build
```

### 输出文件
```
packages/widget/dist/
├── index.js          # CommonJS 格式
├── index.mjs         # ES Module 格式
├── index.d.ts        # TypeScript 类型定义
└── index.css         # 样式文件
```

### 打包后的代码
图标会被内联到 JS 代码中：

```javascript
// dist/index.mjs
export function EditModeIcon({ size = 16, ...props }) {
  return React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ...props
  }, React.createElement("path", {
    stroke: "currentColor",
    strokeWidth: "1.33333",
    // ...
  }));
}
```

## 优势总结

1. **零外部依赖** - 不需要额外的 SVG 加载器或插件
2. **完全自包含** - 打包后的代码包含所有图标资源
3. **类型安全** - 完整的 TypeScript 类型支持
4. **灵活定制** - 支持 size、color、className 等所有 SVG 属性
5. **性能优化** - Tree-shaking 自动移除未使用的图标
6. **易于维护** - 清晰的文件结构，易于添加新图标
7. **颜色继承** - 使用 `currentColor` 自动适配主题

## 添加新图标的步骤

1. 创建新的图标组件文件 `NewIcon.tsx`
2. 复制 SVG 内容，转换为 React 组件
3. 替换固定颜色为 `currentColor`
4. 转换属性为驼峰命名
5. 在 `icons/index.ts` 中导出
6. 运行 `pnpm build` 重新构建

## 参考资源

- [SVG 转 React 组件最佳实践](https://react-svgr.com/docs/what-is-svgr/)
- [currentColor 的使用](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#currentcolor_keyword)
- [tsup 文档](https://tsup.egoist.dev/)
