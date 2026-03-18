/**
 * Generation Mode Menu 组件
 * 显示在按钮上方的模式选择菜单
 */
'use client';

import { Check, Sparkle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GenerationMode = 'unlimited' | 'credit';

export interface GenerationModeMenuProps {
  /** 当前选中的模式 */
  selectedMode: GenerationMode;
  /** 模式切换回调 */
  onChange: (mode: GenerationMode) => void;
  /** Unlimited 模式的剩余次数 */
  unlimitedCount: number;
  /** Credit Mode 需要的积分 */
  creditCost: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否有 Unlimited 权益 */
  hasUnlimitedAccess?: boolean;
  /** 点击 Upgrade 回调 */
  onUpgradeClick?: () => void;
}

/**
 * Generation Mode Menu 组件
 */
export function GenerationModeMenu({
  selectedMode,
  onChange,
  unlimitedCount,
  creditCost,
  disabled = false,
  hasUnlimitedAccess = false,
  onUpgradeClick
}: GenerationModeMenuProps) {
  const handleModeSelect = (mode: GenerationMode) => {
    if (!disabled) {
      onChange(mode);
    }
  };

  // 场景一：用户有 Unlimited 权益
  if (hasUnlimitedAccess) {
    return (
      <div className='overflow-hidden rounded-[10px] border border-white/10 bg-[#252525] shadow-xl pt-1 pb-1'>
        {/* Unlimited 选项 - 简单版本 */}
        <button
          type='button'
          onClick={() => handleModeSelect('unlimited')}
          disabled={disabled}
          className={cn(
            'flex w-full items-center gap-2 pl-2 pr-4 py-2.5 text-left transition-colors hover:bg-white/5',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          {/* 勾选图标 */}
          <div className='flex h-5 w-5 flex-shrink-0 items-center justify-center'>
            {selectedMode === 'unlimited' && (
              <Check
                className='h-5 w-5 text-white'
                strokeWidth={2}
              />
            )}
          </div>

          {/* 文本内容 */}
          <div className='flex flex-1 items-center justify-between gap-3'>
            <span className='text-sm font-medium text-white'>Unlimited</span>
            <div className='flex items-center gap-1 text-sm text-white'>
              <Sparkle
                className='h-4 w-4 fill-white text-white'
                strokeWidth={0}
              />
              <span>{unlimitedCount}</span>
            </div>
          </div>
        </button>

        {/* Credit Mode 选项 - 带描述 */}
        <button
          type='button'
          onClick={() => handleModeSelect('credit')}
          disabled={disabled}
          className={cn(
            'flex w-full items-start gap-2 pl-2 pr-4 py-2.5 text-left transition-colors hover:bg-white/5',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          {/* 勾选图标 */}
          <div className='mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center'>
            {selectedMode === 'credit' && (
              <Check
                className='h-5 w-5 text-white'
                strokeWidth={2}
              />
            )}
          </div>

          {/* 文本内容 */}
          <div className='flex flex-1 flex-col gap-1'>
            <div className='flex items-center justify-between gap-3'>
              <span className='text-sm font-medium text-white'>
                Credit Mode
              </span>
              <div className='flex items-center gap-1 text-sm text-white'>
                <Sparkle
                  className='h-4 w-4 fill-white text-white'
                  strokeWidth={0}
                />
                <span>{creditCost || 5}</span>
              </div>
            </div>
            <p className='text-xs leading-relaxed text-white/50'>
              Skips the queue and generates at maximum speed.
            </p>
          </div>
        </button>
      </div>
    );
  }

  // 场景二：用户没有 Unlimited 权益
  return (
    <div className='overflow-hidden rounded-[10px] border border-white/10 bg-[#252525] shadow-xl pt-1 pb-1'>
      {/* Credit Mode 选项 - 简单版本 */}
      <button
        type='button'
        onClick={() => handleModeSelect('credit')}
        disabled={disabled}
        className={cn(
          'flex w-full items-center gap-2 pl-2 pr-4 py-2.5 text-left transition-colors hover:bg-white/5',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        {/* 勾选图标 */}
        <div className='flex h-5 w-5 flex-shrink-0 items-center justify-center'>
          {selectedMode === 'credit' && (
            <Check
              className='h-5 w-5 text-white'
              strokeWidth={2}
            />
          )}
        </div>

        {/* 文本内容 */}
        <div className='flex flex-1 items-center justify-between gap-3'>
          <span className='text-sm font-medium text-white'>Credit Mode</span>
          <div className='flex items-center gap-1 text-sm text-white'>
            <Sparkle
              className='h-4 w-4 fill-white text-white'
              strokeWidth={0}
            />
            {/* 无 Unlimited 权益时，示例显示 0 积分 */}
            <span>{creditCost || 0}</span>
          </div>
        </div>
      </button>

      {/* Unlimited 选项 - 带描述和 Upgrade 按钮，整行点击跳转订阅付费页面 */}
      <button
        type='button'
        onClick={() => onUpgradeClick?.()}
        disabled={disabled}
        className={cn(
          'flex w-full items-start gap-2 pl-2 pr-4 py-2.5 text-left transition-colors hover:bg-white/5',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        {/* 勾选图标 */}
        <div className='mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center'>
          {selectedMode === 'unlimited' && (
            <Check
              className='h-5 w-5 text-white'
              strokeWidth={2}
            />
          )}
        </div>

        {/* 文本内容 */}
        <div className='flex flex-1 flex-col gap-1'>
          <div className='flex items-center justify-between gap-3'>
            <span className='text-sm font-medium text-white'>Unlimited</span>
            <div className='flex items-center gap-1.5'>
              <div className='flex items-center gap-1 text-sm text-white'>
                <Sparkle
                  className='h-4 w-4 fill-white text-white'
                  strokeWidth={0}
                />
                {/* 无 Unlimited 权益时，示例显示 35 作为 Unlimited 所需积分 */}
                <span>{unlimitedCount || 35}</span>
              </div>
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  onUpgradeClick?.();
                }}
                className='rounded-full bg-[#5B5BD6] px-2 py-1 text-[12px] font-medium text-white transition-colors hover:bg-[#4A4AC5]'
              >
                Upgrade
              </button>
            </div>
          </div>
          <p className='text-xs leading-relaxed text-white/50'>
            Generate without spending credits. Unlimited creation, optimized for
            smooth performance.
          </p>
        </div>
      </button>
    </div>
  );
}
