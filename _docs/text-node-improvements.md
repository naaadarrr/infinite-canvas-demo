# 文本节点改进文档

## 修改日期
2026-01-28

## 问题描述
文本节点在创建和使用时存在以下问题：
1. 新建文本节点时内容为空，没有默认文本
2. 默认文字颜色为黑色（#111），在深色背景下不可见
3. 需要默认透明背景、白色字体，并包含提示文本
4. 需要自动聚焦到输入框并处于可输入状态
5. 文字颜色需要根据背景色智能调整（透明和黑色背景用白字，其他背景用黑字）

## 解决方案

### 1. CollaborativeCanvas.tsx 修改
**文件路径**: `packages/widget/src/CollaborativeCanvas.tsx`

**修改位置**: `handlePaneClick` 函数（约1042-1081行）

**修改内容**:
```typescript
// 修改前
const defaultContent = '';
color: '#111',

// 修改后
const defaultContent = 'Add some text..';
color: '#ffffff',
selected: true, // 新增：自动选中
```

**详细说明**:
- 将默认内容从空字符串改为 `'Add some text..'`
- 将文字颜色从 `'#111'`（深灰色）改为 `'#ffffff'`（白色）
- 保持 `backgroundColor: 'transparent'`（透明背景）
- 保持 `autoEdit: true`（自动进入编辑模式并聚焦）
- 添加 `selected: true`（自动选中新创建的节点）
- 更新文本宽度计算，使用实际默认文本而不是占位符

### 2. TextNode.tsx 修改
**文件路径**: `packages/widget/src/nodes/TextNode.tsx`

#### 2.1 默认内容和颜色
**修改位置**: 第552行和第601-617行

**修改内容**:
```typescript
// 默认内容（第552行）
const [content, setContent] = React.useState(nodeData.content || 'Add some text..');

// 智能文字颜色（第601-617行）
const resolvedTextColor = React.useMemo(() => {
  const raw = (nodeData.backgroundColor || '').toLowerCase();
  // 透明背景使用白色字体
  if (!raw || raw === 'transparent') {
    return nodeData.color || '#ffffff';
  }
  const normalized = raw.startsWith('#') ? raw.slice(1) : raw;
  const hex = normalized.length === 3 ? normalized.split('').map((c) => c + c).join('') : normalized;
  // 黑色背景使用白色字体
  if (hex === '000000') {
    return nodeData.color || '#ffffff';
  }
  // 白色背景使用黑色字体
  if (hex === 'ffffff') {
    return nodeData.color || '#000000';
  }
  // 其他背景使用黑色字体
  return nodeData.color || '#000000';
}, [nodeData.backgroundColor, nodeData.color]);

// placeholder 文本（第1066行）
placeholder="Add some text.."
```

**颜色规则说明**:
- **透明背景** → 白色字体 (#ffffff)
- **黑色背景** (#000000) → 白色字体 (#ffffff)
- **白色背景** (#ffffff) → 黑色字体 (#000000)
- **其他颜色背景**（淡黄、淡蓝、淡绿等）→ 黑色字体 (#000000)

#### 2.3 背景色改变时自动调整文字颜色
**修改位置**: 第755-783行

**修改内容**:
```typescript
const handleBackgroundColorChange = React.useCallback((newColor: string | undefined) => {
  // 根据新背景色自动设置文字颜色
  let textColor: string;
  const raw = (newColor || '').toLowerCase();
  
  if (!raw || raw === 'transparent') {
    textColor = '#ffffff';
  } else {
    const normalized = raw.startsWith('#') ? raw.slice(1) : raw;
    const hex = normalized.length === 3 ? normalized.split('').map((c) => c + c).join('') : normalized;
    if (hex === '000000') {
      textColor = '#ffffff';
    } else if (hex === 'ffffff') {
      textColor = '#000000';
    } else {
      textColor = '#000000';
    }
  }
  
  nodeData.onNodeDataChange?.(nodeData.id, { 
    backgroundColor: newColor,
    color: textColor 
  });
}, [nodeData]);
```

**说明**:
- 当用户通过工具栏改变背景色时，文字颜色会自动调整
- 确保在任何背景色下都有良好的对比度和可读性

#### 2.2 删除功能
**说明**:
- 文本节点的删除由 `InfiniteCanvas.tsx` 统一处理
- **编辑状态下**：Delete/Backspace 键用于编辑文本内容
- **非编辑状态下**：选中节点后按 Delete/Backspace 键可删除节点
- 当失焦且内容为空时，节点会自动删除（第757-761行）

## 功能验证清单

- [x] 新建文本节点时包含默认文本 "Add some text.."
- [x] 默认背景为透明
- [x] 默认文字颜色为白色（#ffffff）
- [x] 创建后自动选中并聚焦到输入框
- [x] 文本全选状态，用户可直接输入替换
- [x] 智能文字颜色：透明/黑色背景用白字，其他背景用黑字
- [x] 可以通过 Delete/Backspace 键删除文本节点（非编辑状态）
- [x] 编辑状态下 Delete/Backspace 用于编辑文本，不会误删节点
- [x] placeholder 文本也更新为 "Add some text.."
- [x] 失焦且内容为空时自动删除节点

## 用户体验改进

1. **智能颜色适配**: 根据背景色自动调整文字颜色，确保可读性
   - 透明/黑色背景 → 白色文字
   - 白色/彩色背景 → 黑色文字
2. **明确的引导**: 默认文本 "Add some text.." 提示用户这是一个文本框
3. **即时可用**: 创建后自动选中、聚焦、全选文本，用户可立即输入
4. **便捷删除**: 
   - 非编辑状态：按 Delete/Backspace 删除节点
   - 编辑状态：Delete/Backspace 用于编辑文本
   - 失焦且内容为空：自动删除节点
5. **防止误删**: 编辑状态下删除键用于文本编辑，不会误删节点

## 相关文件
- `packages/widget/src/CollaborativeCanvas.tsx`
- `packages/widget/src/nodes/TextNode.tsx`
