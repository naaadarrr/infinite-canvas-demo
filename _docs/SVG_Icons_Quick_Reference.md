# SVG 图标快速参考

## 快速开始

### 1. 使用图标

```tsx
import { EditModeIcon, PanModeIcon, LockModeIcon, TextModeIcon } from '@tc/infinite-widget';

// 基础使用
<EditModeIcon />

// 自定义大小
<PanModeIcon size={20} />

// 自定义颜色
<LockModeIcon style={{ color: '#ef4444' }} />
```

### 2. 可用图标

| 图标 | 组件名 | 用途 |
|------|--------|------|
| ![Edit](../apps/demo/public/infinit-edit-mode.svg) | `EditModeIcon` | 编辑/选择模式 |
| ![Pan](../apps/demo/public/infinit-pan-mode.svg) | `PanModeIcon` | 移动/平移模式 |
| ![Lock](../apps/demo/public/infinit-lock-mode.svg) | `LockModeIcon` | 锁定画布 |
| ![Text](../apps/demo/public/infinit-text-mode.svg) | `TextModeIcon` | 文本工具 |

### 3. Props

```typescript
interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;  // 默认 16
}
```

### 4. 常见用法

```tsx
// 在按钮中使用（自动继承颜色）
<button style={{ color: isActive ? '#3b82f6' : '#64748b' }}>
  <EditModeIcon size={16} />
</button>

// 带类名
<EditModeIcon className="toolbar-icon" />

// 带事件
<EditModeIcon onClick={handleClick} />

// 完全自定义
<EditModeIcon 
  size={24}
  style={{ color: '#10b981' }}
  className="custom-icon"
  onClick={handleClick}
/>
```

## 添加新图标

### 步骤 1: 创建组件文件

`packages/widget/src/icons/NewIcon.tsx`:

```tsx
import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function NewIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* 粘贴 SVG path，记得改 stroke="currentColor" */}
    </svg>
  );
}
```

### 步骤 2: 导出图标

`packages/widget/src/icons/index.ts`:

```tsx
export { NewIcon } from './NewIcon';
```

### 步骤 3: 重新构建

```bash
cd packages/widget
pnpm build
```

## SVG 转换规则

| 原 SVG 属性 | React 组件属性 |
|------------|---------------|
| `width="16"` | `width={size}` |
| `height="16"` | `height={size}` |
| `stroke="white"` | `stroke="currentColor"` |
| `fill="#000"` | `fill="currentColor"` |
| `stroke-width` | `strokeWidth` |
| `stroke-linecap` | `strokeLinecap` |
| `stroke-linejoin` | `strokeLinejoin` |
| `fill-rule` | `fillRule` |
| `clip-path` | `clipPath` |

## 常见问题

### Q: 为什么使用 `currentColor`？
A: 让图标自动继承父元素的 `color` 样式，方便主题切换。

### Q: 如何改变图标颜色？
A: 三种方式：
```tsx
// 1. 通过 style
<EditModeIcon style={{ color: '#3b82f6' }} />

// 2. 通过 className
<EditModeIcon className="text-blue-500" />

// 3. 通过父元素
<div style={{ color: '#3b82f6' }}>
  <EditModeIcon />
</div>
```

### Q: 图标不显示怎么办？
A: 检查：
1. 是否正确导入：`import { EditModeIcon } from '@tc/infinite-widget'`
2. 是否设置了颜色（默认继承父元素）
3. 是否有 `display: none` 或 `visibility: hidden`

### Q: 需要安装额外的包吗？
A: 不需要！图标已经内联到代码中，打包后完全自包含。

## 文件位置

```
packages/widget/src/icons/
├── EditModeIcon.tsx
├── LockModeIcon.tsx
├── PanModeIcon.tsx
├── TextModeIcon.tsx
└── index.ts
```

## 构建输出

```bash
# 开发模式（监听文件变化）
pnpm dev

# 生产构建
pnpm build

# 输出位置
packages/widget/dist/
```
