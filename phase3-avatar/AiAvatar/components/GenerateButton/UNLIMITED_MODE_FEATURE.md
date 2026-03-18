# AI Avatar Unlimited Mode 功能文档

## 功能概述

为 AI Avatar 工具添加了 Unlimited 权益判断和生成模式选择功能。根据用户是否拥有 Avatar 工具的 Unlimited 权益，显示不同的 UI 和功能。

## 三种场景

### 场景 1：免费用户

- **UI**:
  - 显示 "Get Free Unlimited Generations" 横幅（36px 高）
  - 单一 Generate 按钮（无箭头，无菜单）
- **按钮显示**: 星星图标 + 免费次数（如：0）
- **交互**: 点击横幅引导用户跳转到订阅页面

### 场景 2：付费用户（有 Unlimited 权益）

- **UI**:
  - 不显示横幅
  - 分裂按钮：左侧 Generate + 右侧箭头按钮（36px × 40px）
- **默认模式**: Unlimited 模式
- **按钮显示**: 皇冠图标 + "Generate" + 星星图标 + 免费次数（如：0）
- **菜单选项**:
  - **Unlimited**（选中）: 显示星星图标 + 积分数
  - **Credit Mode**: 显示星星图标 + 积分数（如：5）+ 描述文案 "Skips the queue and generates at maximum speed."

### 场景 3：付费用户（无 Unlimited 权益）

- **UI**:
  - 不显示横幅
  - 分裂按钮：左侧 Generate + 右侧箭头按钮（36px × 40px）
- **默认模式**: Credit Mode
- **按钮显示**: 皇冠图标 + "Generate" + 星星图标 + 积分数（如：5）
- **菜单选项**:
  - **Credit Mode**（选中）: 显示星星图标 + 积分数
  - **Unlimited**: 显示星星图标 + 积分数（如：35）+ **Upgrade** 按钮 + 描述文案 "Generate without spending credits. Unlimited creation, optimized for smooth performance."

## 交互逻辑

### 菜单交互

- **点击箭头按钮**: 展开/收起菜单
- **点击菜单选项**: 切换模式，不自动关闭菜单
- **点击外部区域**: 关闭菜单

### 按钮显示

- **Credit Mode**: 显示积分数
- **Unlimited 模式**: 显示免费次数，不显示积分

### 权益判断

- **Pro 用户**: 有 Unlimited 权益
- **Business 用户**: 有 Unlimited 权益
- **Free 用户**: 无 Unlimited 权益

## 样式规范

### 菜单样式

- **宽度**: 260px
- **圆角**: 10px (`rounded-[10px]`)
- **背景**: #252525
- **边框**: border-white/10
- **位置**: 按钮上方 4px (-mb-1)，右对齐 (right-4)
- **阴影**: shadow-xl
- **图标与数字间距**: 4px (`gap-1`)

### 按钮样式

- **主按钮**: flex-1，左侧
- **箭头按钮**: 36px × 40px，右侧
- **箭头按钮边框**: border-l border-black/30
- **背景色**: #4E40F3
- **悬停背景**: #4030E0

### 横幅样式（免费用户）

- **高度**: 36px (h-9)
- **圆角**: 8px (rounded-lg)
- **背景**: from-purple-500/10 to-blue-500/10
- **边框**: border-white/5
- **悬停边框**: border-purple-500/50
- **悬停背景**: from-purple-500/20 to-blue-500/20

### 图标样式

- **星星图标**: 白色填充 (fill-current text-white)，无描边 (strokeWidth={0})
- **皇冠图标**: 白色 (text-white)
- **火箭图标**: 白色 (text-white)
- **勾选图标**: 白色 (text-white)，strokeWidth={2}

## 文件结构

```
components/GenerateButton/
├── index.tsx                          # 主组件
├── components/
│   ├── GenerateButtonContent.tsx     # 按钮内容组件
│   ├── GenerationModeMenu.tsx        # 生成模式菜单
│   ├── UnlimitedUpgradePrompt.tsx    # 升级引导横幅
│   └── FreeUserTips.tsx              # 免费用户提示
└── UNLIMITED_MODE_FEATURE.md         # 本文档
```

## 核心实现

### 1. useAvatarUnlimitedMode Hook

**文件**: `hooks/useAvatarUnlimitedMode.ts`

**功能**: 判断用户是否拥有 Avatar 工具的 Unlimited 权益

**实现逻辑**:

```typescript
// Pro 和 Business 用户有 unlimited 权益
const hasUnlimitedAccess =
  userSubscription === 'pro' || userSubscription === 'business';
```

**使用示例**:

```typescript
const { hasUnlimitedAccess } = useAvatarUnlimitedMode({ userSubscription });
```

### 2. GenerationModeMenu 组件

**文件**: `components/GenerationModeMenu.tsx`

**功能**: 显示在按钮上方的模式选择菜单

**Props**:

- `selectedMode`: 当前选中的模式 ("unlimited" | "credit")
- `onChange`: 模式切换回调
- `unlimitedCount`: Unlimited 模式的剩余次数
- `creditCost`: Credit Mode 需要的积分
- `disabled`: 是否禁用
- `hasUnlimitedAccess`: 是否有 Unlimited 权益
- `onUpgradeClick`: 点击 Upgrade 回调

**UI 特点**:

- 根据 `hasUnlimitedAccess` 显示不同的菜单布局
- 使用勾选图标 (Check) 标识当前选中的模式
- 支持点击菜单项切换模式
- 菜单项悬停时显示高亮效果 (hover:bg-white/5)

### 3. UnlimitedUpgradePrompt 组件

**文件**: `components/UnlimitedUpgradePrompt.tsx`

**功能**: 引导免费用户升级到 Unlimited 权益的横幅

**Props**:

- `onClick`: 点击回调（跳转到订阅页面）
- `className`: 自定义类名（可选）

**UI 特点**:

- 渐变背景卡片，带有边框和悬停效果
- 左侧显示火箭图标和文字说明
- 右侧显示箭头，鼠标悬停时有移动动画
- 整个卡片可点击

### 4. GenerateButtonContent 组件

**文件**: `components/GenerateButtonContent.tsx`

**新增 Props**:

- `freeCount`: 免费次数（用于显示在星星图标后面）
- `showCrownIcon`: 是否显示皇冠图标（付费用户）

**显示逻辑**:

```typescript
// Unlimited 模式：皇冠图标 + Generate + 星星图标 + 免费次数
<Crown className="h-4 w-4 text-white" />
<span>Generate</span>
<Sparkle className="h-3.5 w-3.5 fill-current" />
<span className="text-white/70">{freeCount}</span>

// Credit Mode：皇冠图标 + Generate + 星星图标 + 积分数
<Crown className="h-4 w-4 text-white" />
<span>Generate</span>
<Sparkle className="h-3.5 w-3.5 fill-current" />
<span>{displayCost}</span>
```

### 5. 主组件集成

**文件**: `index.tsx`

**新增状态**:

```typescript
// 生成模式状态（仅付费用户使用）
const [generationMode, setGenerationMode] = useState<GenerationMode>('credit');

// 下拉菜单状态
const [isMenuOpen, setIsMenuOpen] = useState(false);

// 菜单和按钮容器，用于处理点击空白处关闭菜单
const menuWrapperRef = useRef<HTMLDivElement | null>(null);
```

**新增逻辑**:

```typescript
// 根据 Unlimited 权益设置默认模式
useEffect(() => {
  if (hasUnlimitedAccess) {
    setGenerationMode('unlimited');
  } else {
    setGenerationMode('credit');
  }
}, [hasUnlimitedAccess]);

// 点击容器外部时收起菜单
useEffect(() => {
  if (!isMenuOpen) return;
  const handleClickOutside = (event: MouseEvent) => {
    if (!menuWrapperRef.current) return;
    const target = event.target as Node | null;
    if (target && !menuWrapperRef.current.contains(target)) {
      setIsMenuOpen(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [isMenuOpen]);
```

**UI 渲染**:

```typescript
<GenerateButtonContainer className="relative">
  <div ref={menuWrapperRef}>
    {/* 免费用户：显示 Upgrade Prompt */}
    {!hasUnlimitedAccess && (
      <div className="mb-3">
        <UnlimitedUpgradePrompt onClick={handleUpgradeClick} />
      </div>
    )}

    {/* 下拉菜单（显示在按钮上方，仅付费用户） */}
    {!freeUserInfo.isFreeUser && isMenuOpen && (
      <div className="absolute bottom-full right-4 z-50 -mb-1 w-[260px]">
        <GenerationModeMenu
          selectedMode={generationMode}
          onChange={handleModeChange}
          unlimitedCount={freeUserInfo.userFreeCount}
          creditCost={creditModeDisplayCost}
          disabled={isSubmitting}
          hasUnlimitedAccess={hasUnlimitedAccess}
          onUpgradeClick={handleUpgradeClick}
        />
      </div>
    )}

    {/* Generate Button - 分为主按钮和箭头按钮 */}
    <div className="flex">
      <GenerateButtonBase className="flex-1 rounded-r-none">
        {/* 主按钮内容 */}
      </GenerateButtonBase>

      {/* 箭头按钮（仅付费用户显示） */}
      {!freeUserInfo.isFreeUser && (
        <button className="flex h-10 w-9 items-center justify-center rounded-r-lg">
          {isMenuOpen ? <ChevronUp /> : <ChevronDown />}
        </button>
      )}
    </div>
  </div>
</GenerateButtonContainer>
```

## 数据依赖

### 用户订阅信息

- **来源**: `@/store/board`
- **Atom**: `userSubscriptionState`
- **类型**: `UserSubscription` ("free" | "pro" | "business" | "enterprise")

### 免费用户信息

- **Hook**: `useAiAvatarFreeUser`
- **返回值**:
  - `isFreeUser`: 是否为免费用户
  - `userFreeCount`: 免费次数
  - `isFreeGenerate`: 是否为免费生成
  - `shouldShowFreeUserTips`: 是否显示免费用户提示

## 测试建议

### 功能测试

1. **Free 用户**: 应显示升级引导横幅，单一按钮
2. **Pro 用户**:
   - 应显示分裂按钮和下拉菜单
   - 默认选中 Unlimited 模式
   - 按钮显示皇冠图标和免费次数
3. **Business 用户**: 同 Pro 用户
4. **无权益付费用户**:
   - 应显示分裂按钮和下拉菜单
   - 默认选中 Credit Mode
   - 菜单中 Unlimited 选项显示 Upgrade 按钮
5. **模式切换**: 测试在 Unlimited 和 Credit Mode 之间切换
6. **菜单交互**:
   - 点击箭头按钮展开/收起菜单
   - 点击外部区域关闭菜单
   - 点击菜单项切换模式

### UI 测试

1. **按钮样式**: 测试分裂按钮的样式和圆角
2. **菜单样式**: 测试菜单的宽度、圆角、背景色、位置
3. **图标显示**: 测试星星图标、皇冠图标、火箭图标的显示
4. **悬停效果**: 测试菜单项和横幅的悬停效果
5. **响应式**: 测试在不同屏幕宽度下的显示效果

### 边界情况

1. **订阅状态变化**: 用户登录/登出或订阅状态变化时，UI 应正确更新
2. **权益判断**: 确保 Pro 和 Business 用户正确识别为有 Unlimited 权益
3. **菜单定位**: 确保菜单在按钮上方正确显示，不被遮挡
4. **默认模式**: 确保有权益用户默认选中 Unlimited，无权益用户默认选中 Credit Mode

## 参考分支

本功能基于 `origin/feature/AI-tool-Avatar-unlimited-mode-button` 分支实现，样式逻辑与该分支保持一致。

## 技术栈说明

- **React**: 18.3.1
- **TypeScript**: 5.6.3
- **Recoil**: 通过 recoil-next 0.3.0
- **Tailwind CSS**: 3.4.17
- **Lucide React**: 用于图标（Crown, Sparkle, Rocket, ChevronDown, ChevronUp, Check）

## 注意事项

1. **权益判断**: 权益判断依赖于用户订阅状态，确保订阅状态的正确性
2. **菜单定位**: 菜单使用绝对定位 (absolute bottom-full right-4)，确保容器有 relative 定位
3. **点击外部关闭**: 使用 ref 和事件监听实现点击外部关闭菜单，注意事件监听的清理
4. **状态管理**: 生成模式状态是组件级别的，不会持久化存储
5. **按钮分裂**: 免费用户显示单一按钮，付费用户显示分裂按钮

## 按钮改动点（Code Review 清单）

以下为本次对 AI Avatar Generate 按钮及模式菜单的改动，供开发人员检查。

### 1. GenerationModeMenu 样式

| 位置           | 改动前             | 改动后                  | 文件                                                                                          |
| -------------- | ------------------ | ----------------------- | --------------------------------------------------------------------------------------------- |
| 菜单容器圆角   | `rounded-lg` (8px) | `rounded-[10px]` (10px) | `components/GenerationModeMenu.tsx`                                                           |
| 图标与数字间距 | `gap-1.5` (6px)    | `gap-1` (4px)           | `components/GenerationModeMenu.tsx`（共 4 处：Unlimited/ Credit 选项中的 Sparkle + 数字容器） |

### 2. GenerateButton 开发预览开关

| 位置                           | 说明                                                                                                            | 文件        |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- | ----------- |
| `FORCE_UNLIMITED_MENU_PREVIEW` | 常量，设为 `true` 时强制按「有 Unlimited 权益」展示按钮与菜单，便于本地预览；上线前需改为 `false`               | `index.tsx` |
| `hasUnlimitedAccessForDisplay` | 使用 `FORCE_UNLIMITED_MENU_PREVIEW \|\| hasUnlimitedAccess`，统一控制菜单内容、皇冠图标、Upgrade 提示、默认模式 | `index.tsx` |

### 3. 其他相关修复（非按钮 UI）

- **store/board.ts**: 合并冲突已解决，保留 `pricingModalState` 与 Board 邀请链接相关 atoms。
- **pricing-modal-demo/index.tsx**: 增加 `PricingModal` 再导出，供 Board 页使用。
- **AIImage/hooks/useUnlimitedAccess.ts**: `PRICING_PLANS` 为对象，使用 `PRICING_PLANS[subscription.plan]` 替代 `.find()`。

### 检查建议

1. 确认菜单圆角 10px、图标与数字 4px 间距在本地与设计一致。
2. 确认 `FORCE_UNLIMITED_MENU_PREVIEW` 在合并/发布前为 `false`。
3. 有 Unlimited 与无 Unlimited 两种菜单布局、默认模式、Upgrade 入口行为是否符合产品预期。

---

## 相关文档

- [ToolPanel 主文档](../../README.md)
- [User Subscription 类型定义](/src/store/board/index.ts)
