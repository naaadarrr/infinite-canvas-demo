# 左侧工具条重构实现文档

## 概述

重构了 `CollaborativeCanvas` 组件的左侧工具条，采用新的 UI 设计，将模式切换改为 radio 按钮组，并新增了画布锁定功能。

## 主要变更

### 1. 新增状态

```typescript
const [isLocked, setIsLocked] = useState(false);
```

新增 `isLocked` 状态用于控制画布的锁定/解锁。

### 2. 工具条 UI 重构

#### 原设计
- 文本工具按钮
- 一个切换按钮（在 pan 和 edit 模式间切换）

#### 新设计
- **文本工具按钮** (T)
  - 在 pan 模式或 locked 状态下禁用
  - 激活时显示蓝色高亮

- **分隔线**

- **Edit 模式按钮** (↖)
  - Radio 按钮行为
  - 选中时显示蓝色高亮
  - locked 状态下禁用

- **Pan 模式按钮** (✋)
  - Radio 按钮行为
  - 选中时显示蓝色高亮
  - locked 状态下禁用

- **分隔线**

- **Lock 按钮** (🔒/🔓)
  - Toggle 按钮
  - 锁定时显示红色高亮
  - 解锁时显示灰色

### 3. 样式更新

```typescript
{
  padding: '8px',
  borderRadius: 12,
  gap: 8,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
}
```

- 更紧凑的间距
- 更柔和的阴影
- 统一的按钮尺寸 (40x40)
- 平滑的过渡动画 (0.15s ease)

### 4. 按钮状态设计

#### 激活状态
- 边框: `2px solid #3b82f6`
- 背景: `#eff6ff`
- 文字: `#3b82f6`

#### 未激活状态
- 边框: `1px solid #e5e7eb`
- 背景: `#fff`
- 文字: `#64748b`

#### 禁用状态
- 透明度: `0.4`
- 鼠标: `not-allowed`

#### Lock 激活状态
- 边框: `2px solid #ef4444`
- 背景: `#fef2f2`
- 文字: `#ef4444`

### 5. 功能集成

#### Lock 状态影响的行为

1. **InfiniteCanvas Props**
   ```typescript
   nodesDraggable={!isLocked && toolMode === 'edit'}
   elementsSelectable={!isLocked && toolMode === 'edit'}
   selectionOnDrag={!isLocked && toolMode === 'edit'}
   panOnDrag={isLocked ? false : toolMode === 'pan' ? [0, 1, 2] : [1, 2]}
   paneCursor={isLocked ? 'not-allowed' : ...}
   ```

2. **handlePaneClick**
   - locked 状态下不能添加文本节点

3. **handleNodeContextMenu**
   - locked 状态下不显示右键菜单

4. **工具按钮**
   - locked 状态下所有模式切换按钮禁用
   - 文本工具按钮禁用

## 交互逻辑

### Radio 按钮行为
- Edit 和 Pan 按钮互斥
- 点击 Edit 按钮：
  - 设置 `toolMode = 'edit'`
  - 重置 `activeTool = 'select'`
- 点击 Pan 按钮：
  - 设置 `toolMode = 'pan'`
  - 重置 `activeTool = 'select'`

### Lock 按钮行为
- Toggle 切换 `isLocked` 状态
- 锁定时：
  - 禁用所有节点拖拽
  - 禁用节点选择
  - 禁用画布平移
  - 禁用所有工具按钮
  - 光标显示为 `not-allowed`

### 快捷键支持
保持原有快捷键：
- `H` - 切换到 Pan 模式（locked 时无效）
- `V` - 切换到 Edit 模式（locked 时无效）

## 设计参考

基于 Figma 设计稿：
- 工具条容器: `node-id=6446-788`
- Edit 按钮: `node-id=6446-789`
- Pan 按钮: `node-id=6446-792`
- Lock 按钮: `node-id=6446-803`

## 视觉效果

```
┌─────────┐
│    T    │  文本工具
├─────────┤
│    ↖    │  Edit 模式 (选中时蓝色)
│    ✋    │  Pan 模式
├─────────┤
│  🔒/🔓  │  Lock 切换 (锁定时红色)
└─────────┘
```

## 后续优化建议

1. 可以考虑添加工具提示（Tooltip）显示快捷键
2. 可以添加键盘快捷键 `L` 来切换 Lock 状态
3. 可以在 locked 状态下显示全局提示信息
4. 可以考虑添加动画效果使状态切换更流畅
