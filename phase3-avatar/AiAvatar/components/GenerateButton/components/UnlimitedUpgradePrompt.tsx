/**
 * Unlimited Upgrade Prompt 组件
 * 引导免费用户升级到 Unlimited 权益的横幅
 */
'use client';

import { Rocket, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UnlimitedUpgradePromptProps {
  /** 点击回调（跳转到订阅页面） */
  onClick: () => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * Unlimited Upgrade Prompt 组件
 * 引导免费用户升级到 Unlimited 权益的横幅
 */
export function UnlimitedUpgradePrompt({
  onClick,
  className
}: UnlimitedUpgradePromptProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'group relative flex h-9 w-full items-center justify-between gap-2 overflow-hidden rounded-xl border border-blue-500/30 bg-gradient-to-r from-purple-500/10 to-blue-500/10 pl-3 pr-3 transition-all hover:border-blue-500/50 hover:from-purple-500/20 hover:to-blue-500/20',
        className
      )}
    >
      <div className='flex items-center gap-2'>
        <Rocket className='h-4 w-4 text-white' />
        <span className='text-xs font-medium text-white'>
          Get Free Unlimited Generations
        </span>
      </div>
      <ChevronRight className='h-4 w-4 flex-shrink-0 text-white/50 transition-[transform,color] duration-200 group-hover:translate-x-1 group-hover:text-white' />
    </button>
  );
}
