# Board Grid 模式 Hover 快捷工具栏 - 模糊背景代码

用于复用到其他项目的「模糊背景」样式与结构说明。

---

## 1. 源码位置

- **文件**：`apps/base/src/app/board/[id]/components/BoardWorkspace/components/Gallery/components/TaskAssets/components/TaskCard/components/TaskCardToolbar/index.tsx`
- **顶部工具栏**：约 117-271 行
- **底部快捷操作栏**：约 273-409 行

---

## 2. 源码：顶部工具栏（带模糊背景）

```tsx
{/* Top Bar: download and more menu on right */}
<div className='absolute left-0 right-0 top-0 z-[5] flex items-start justify-end p-2'>
  <div className='flex items-center gap-0.5 rounded-lg bg-black/60 p-1 backdrop-blur-md'>
    {/* More menu */}
    <div className='relative'>
      <button
        className='rounded-md p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors'
      >
        <MoreHorizontal className='h-4 w-4' />
      </button>
    </div>
    <div className='mx-0.5 h-4 w-px bg-white/20' />
    {/* Video volume */}
    <button
      className='rounded-md p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors'
    >
      <Volume2 className='h-4 w-4' />
    </button>
    <div className='mx-0.5 h-4 w-px bg-white/20' />
    {/* Download */}
    <button
      className='rounded-md p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors'
    >
      <Download className='h-4 w-4' />
    </button>
    <div className='mx-0.5 h-4 w-px bg-white/20' />
    {/* Pin */}
    <button
      className='rounded-md p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors'
    >
      <Pin className='h-4 w-4' />
    </button>
  </div>
</div>
```

---

## 3. 源码：底部快捷操作栏（带模糊背景）

```tsx
{/* Bottom Bar: quick action buttons */}
<div className='absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center p-2'>
  <div className='flex items-center gap-0.5 rounded-lg bg-black/60 p-1 backdrop-blur-md'>
    {/* Visible quick buttons */}
    {quickActions.slice(0, visibleButtonCount).map((action) => {
      const IconComponent = action.icon;
      return (
        <div key={action.id} className='group/tooltip relative'>
          <button
            onClick={() => onQuickAction(action.id)}
            className='rounded-md p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors'
          >
            <IconComponent className='h-3.5 w-3.5' />
          </button>
        </div>
      );
    })}
    {/* More features - 折叠的更多按钮 */}
    {visibleButtonCount < quickActions.length && (
      <>
        <div className='mx-0.5 h-4 w-px bg-white/20' />
        <button
          className='rounded-md p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors'
        >
          <MoreHorizontal className='h-3.5 w-3.5' />
        </button>
      </>
    )}
  </div>
</div>
```

---

## 4. 模糊背景类名（Tailwind）

工具栏容器使用同一套样式，**直接复用时复制下面这一行 class 即可**：

```txt
rounded-lg bg-black/60 p-1 backdrop-blur-md
```

- `rounded-lg`：圆角
- `bg-black/60`：60% 不透明黑色底
- `p-1`：内边距
- `backdrop-blur-md`：背后内容模糊（毛玻璃效果）

---

## 5. 最小可复用容器结构（便于对齐布局）

**顶部栏（右上角）：**

```tsx
<div className="absolute left-0 right-0 top-0 z-[5] flex items-start justify-end p-2">
  <div className="flex items-center gap-0.5 rounded-lg bg-black/60 p-1 backdrop-blur-md">
    {/* 你的按钮：下载、更多菜单等 */}
  </div>
</div>
```

**底部栏（底部居中）：**

```tsx
<div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center p-2">
  <div className="flex items-center gap-0.5 rounded-lg bg-black/60 p-1 backdrop-blur-md">
    {/* 你的快捷操作按钮 */}
  </div>
</div>
```

---

## 6. 按钮在工具栏内的样式（可选一致）

- 普通按钮：`rounded-md p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors`
- 图标尺寸：`h-3.5 w-3.5` 或 `h-4 w-4`
- 分隔线：`<div className="mx-0.5 h-4 w-px bg-white/20" />`

---

## 7. 复用到其他项目

1. 给 hover 时显示的工具栏外层加：`absolute` 定位 + 上述 `rounded-lg bg-black/60 p-1 backdrop-blur-md` 的 div。
2. 依赖：仅 Tailwind，需支持 `backdrop-blur-md`（若未开 blur 插件需确认 Tailwind 配置）。

---

## 8. 完整组件源码（TaskCardToolbar/index.tsx）

<details>
<summary>点击展开完整文件</summary>

```tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Download,
  Trash2,
  MoreHorizontal,
  Volume2,
  VolumeX,
  MessageSquare,
  Pin,
  Loader2
} from 'lucide-react';
import { MediaType } from '@/server/api/services/board/common';
import { cn } from '@/lib/utils';
import type { QuickAction } from '@/app/board/[id]/components/BoardWorkspace/types/quickAction';

interface TaskCardToolbarProps {
  taskMediaType: MediaType;
  taskIsPinned: boolean;
  isDownloading: boolean;
  videoMuted: boolean;
  onDownload: () => void;
  onTogglePin: () => void;
  onToggleVideoMute: () => void;
  onDelete: () => void;
  onShowFeedback: () => void;
  onQuickAction: (actionId: string) => void;
  quickActions: QuickAction[];
  visibleButtonCount: number;
  isHovered: boolean;
  setIsHovered: (hovered: boolean) => void;
  readonly?: boolean;
  disabledActionIds?: string[];
  variant?: 'full' | 'moreOnly';
}

export function TaskCardToolbar({
  taskMediaType,
  taskIsPinned,
  isDownloading,
  videoMuted,
  onDownload,
  onTogglePin,
  onToggleVideoMute,
  onDelete,
  onShowFeedback,
  onQuickAction,
  quickActions,
  visibleButtonCount,
  isHovered,
  setIsHovered,
  readonly = false,
  disabledActionIds = [],
  variant = 'full'
}: TaskCardToolbarProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [moreMenuPosition, setMoreMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [quickMenuPosition, setQuickMenuPosition] = useState<{
    top: number;
    left: number;
    transform?: string;
  }>({ top: 0, left: 0 });

  const moreMenuRef = useRef<HTMLDivElement>(null);
  const quickMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuButtonRef = useRef<HTMLButtonElement>(null);
  const quickMenuButtonRef = useRef<HTMLButtonElement>(null);

  const calculateMoreMenuPosition = useCallback(() => {
    if (!moreMenuButtonRef.current) return { top: 0, left: 0 };
    const rect = moreMenuButtonRef.current.getBoundingClientRect();
    const menuHeight = 100;
    const menuWidth = 120;
    const gap = 8;
    let top = rect.top;
    let left = rect.right + gap;
    if (left + menuWidth > window.innerWidth - 10) {
      left = rect.left - menuWidth - gap;
      if (left < 10) left = 10;
    }
    if (top + menuHeight > window.innerHeight - 10) {
      top = window.innerHeight - menuHeight - 10;
    }
    if (top < 10) top = 10;
    return { top, left };
  }, []);

  return (
    <>
      {/* Top Bar */}
      <div className='absolute left-0 right-0 top-0 z-[5] flex items-start justify-end p-2'>
        <div className='flex items-center gap-0.5 rounded-lg bg-black/60 p-1 backdrop-blur-md'>
          {!readonly && (
            <>
              <div className='relative' ref={moreMenuRef}>
                <button
                  ref={moreMenuButtonRef}
                  onClick={() => {
                    if (!showMoreMenu) {
                      const position = calculateMoreMenuPosition();
                      setMoreMenuPosition(position);
                      setShowMoreMenu(true);
                    } else {
                      setShowMoreMenu(false);
                    }
                  }}
                  className='rounded-md p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors'
                >
                  <MoreHorizontal className='h-4 w-4' />
                </button>
                {showMoreMenu && moreMenuPosition && typeof document !== 'undefined' &&
                  createPortal(
                    <div
                      ref={moreMenuRef}
                      className='fixed z-[9999] min-w-[120px] rounded-lg border border-white/10 bg-[#252525] py-1 shadow-xl animate-in fade-in duration-150'
                      style={{ top: moreMenuPosition.top, left: moreMenuPosition.left }}
                      onMouseLeave={() => setShowMoreMenu(false)}
                    >
                      <button
                        onClick={() => { onShowFeedback(); setShowMoreMenu(false); }}
                        className='flex w-full items-center gap-2 px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white'
                      >
                        <MessageSquare className='h-4 w-4' /> Feedback
                      </button>
                      {variant === 'full' && (
                        <button
                          onClick={onDelete}
                          className='flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5'
                        >
                          <Trash2 className='h-4 w-4' /> Delete
                        </button>
                      )}
                    </div>,
                    document.body
                  )}
              </div>
              {variant === 'full' && <div className='mx-0.5 h-4 w-px bg-white/20' />}
            </>
          )}
          {variant === 'full' && taskMediaType === MediaType.VIDEO && (
            <>
              <div className='group/tooltip relative'>
                <button
                  onClick={onToggleVideoMute}
                  className='rounded-md p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors'
                >
                  {videoMuted ? <VolumeX className='h-4 w-4' /> : <Volume2 className='h-4 w-4' />}
                </button>
                <div className='pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 scale-90 group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 transition-all duration-200 origin-top'>
                  <div className='whitespace-nowrap rounded-md bg-[#252525] px-2.5 py-1.5 text-xs font-medium text-white shadow-xl border border-white/10'>
                    {videoMuted ? 'Unmute' : 'Mute'}
                  </div>
                  <div className='absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 rotate-45 bg-[#252525] border-l border-t border-white/10' />
                </div>
              </div>
              <div className='mx-0.5 h-4 w-px bg-white/20' />
            </>
          )}
          {variant === 'full' && (
            <>
              {taskMediaType !== MediaType.VIDEO && <div className='mx-0.5 h-4 w-px bg-white/20' />}
              <div className='group/tooltip relative'>
                <button
                  onClick={onDownload}
                  disabled={isDownloading}
                  className={cn(
                    'rounded-md p-1.5 transition-colors',
                    isDownloading ? 'text-white/50 cursor-wait' : 'text-white/80 hover:bg-white/20 hover:text-white'
                  )}
                >
                  {isDownloading ? <Loader2 className='h-4 w-4 animate-spin' /> : <Download className='h-4 w-4' />}
                </button>
                <div className='pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 scale-90 group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 transition-all duration-200 origin-top z-50'>
                  <div className='whitespace-nowrap rounded-md bg-[#333] px-2 py-1 text-xs text-white shadow-lg'>
                    {isDownloading ? 'Downloading...' : 'Download (D)'}
                  </div>
                </div>
              </div>
            </>
          )}
          {variant === 'full' && !readonly && (
            <>
              <div className='mx-0.5 h-4 w-px bg-white/20' />
              <div className='group/tooltip relative'>
                <button
                  onClick={onTogglePin}
                  className={cn(
                    'rounded-md p-1.5 transition-colors',
                    taskIsPinned ? 'text-amber-400 hover:bg-white/20' : 'text-white/80 hover:bg-white/20 hover:text-white'
                  )}
                >
                  <Pin className={cn('h-4 w-4', taskIsPinned && 'fill-amber-400')} />
                </button>
                <div className='pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 scale-90 group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 transition-all duration-200 origin-top z-50'>
                  <div className='whitespace-nowrap rounded-md bg-[#333] px-2 py-1 text-xs text-white shadow-lg'>
                    {taskIsPinned ? 'Unpin' : 'Pin to top'}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      {variant === 'full' && !readonly && (
        <div className='absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center p-2'>
          <div className='flex items-center gap-0.5 rounded-lg bg-black/60 p-1 backdrop-blur-md'>
            {quickActions.slice(0, visibleButtonCount).map((action) => {
              const IconComponent = action.icon;
              const isDisabled = disabledActionIds.includes(action.id);
              return (
                <div key={action.id} className='group/tooltip relative'>
                  <button
                    onClick={() => !isDisabled && onQuickAction(action.id)}
                    disabled={isDisabled}
                    className={cn(
                      'rounded-md p-1.5 transition-colors',
                      isDisabled ? 'text-white/30 cursor-not-allowed' : 'text-white/80 hover:bg-white/20 hover:text-white'
                    )}
                  >
                    <IconComponent className='h-3.5 w-3.5' />
                  </button>
                  <div className='pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 scale-90 group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 transition-all duration-200 origin-bottom'>
                    <div className='whitespace-nowrap rounded-md bg-[#252525] px-2.5 py-1.5 text-xs font-medium text-white shadow-xl border border-white/10'>
                      {action.label}
                      {isDisabled && ' (Not available for uploads)'}
                    </div>
                    <div className='absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45 bg-[#252525] border-r border-b border-white/10' />
                  </div>
                </div>
              );
            })}
            {visibleButtonCount < quickActions.length && (
              <>
                <div className='mx-0.5 h-4 w-px bg-white/20' />
                <div className='relative group/tooltip' ref={quickMenuRef}>
                  <button
                    ref={quickMenuButtonRef}
                    onClick={() => {
                      if (quickMenuButtonRef.current) {
                        const rect = quickMenuButtonRef.current.getBoundingClientRect();
                        const menuWidth = 140;
                        const menuHeight = 200;
                        const viewportWidth = window.innerWidth;
                        const viewportHeight = window.innerHeight;
                        const hasSpaceRight = rect.right + menuWidth + 8 < viewportWidth;
                        const hasSpaceBelow = rect.top + menuHeight < viewportHeight;
                        if (hasSpaceRight) {
                          setQuickMenuPosition({
                            top: hasSpaceBelow ? rect.top : rect.bottom - menuHeight,
                            left: rect.right + 4,
                            transform: 'none'
                          });
                        } else {
                          setQuickMenuPosition({
                            top: hasSpaceBelow ? rect.top : rect.bottom - menuHeight,
                            left: rect.left - 4,
                            transform: 'translateX(-100%)'
                          });
                        }
                      }
                      setShowQuickMenu(!showQuickMenu);
                    }}
                    className='rounded-md p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors'
                  >
                    <MoreHorizontal className='h-3.5 w-3.5' />
                  </button>
                  {!showQuickMenu && (
                    <div className='pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 scale-90 group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 transition-all duration-200 origin-bottom'>
                      <div className='whitespace-nowrap rounded-md bg-[#252525] px-2.5 py-1.5 text-xs font-medium text-white shadow-xl border border-white/10'>More</div>
                      <div className='absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45 bg-[#252525] border-r border-b border-white/10' />
                    </div>
                  )}
                  {showQuickMenu && typeof document !== 'undefined' &&
                    createPortal(
                      <div
                        className='fixed z-[9999] min-w-[130px] rounded-lg border border-white/10 bg-[#252525] py-1 shadow-xl animate-in fade-in duration-150'
                        style={{
                          top: quickMenuPosition.top,
                          left: quickMenuPosition.left,
                          transform: quickMenuPosition.transform || 'none'
                        }}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => { setShowQuickMenu(false); setIsHovered(false); }}
                      >
                        {quickActions.slice(visibleButtonCount).map((action) => {
                          const IconComponent = action.icon;
                          const isDisabled = disabledActionIds.includes(action.id);
                          return (
                            <button
                              key={action.id}
                              onClick={() => !isDisabled && onQuickAction(action.id)}
                              disabled={isDisabled}
                              className={cn(
                                'flex w-full items-center gap-2 px-3 py-2 text-xs',
                                isDisabled ? 'text-white/30 cursor-not-allowed' : 'text-white/70 hover:bg-white/5 hover:text-white'
                              )}
                            >
                              <IconComponent className='h-3.5 w-3.5' />
                              {action.label}
                            </button>
                          );
                        })}
                      </div>,
                      document.body
                    )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
```

</details>

复制时注意：`MediaType`、`QuickAction`、`cn` 等需按你项目替换或实现。
