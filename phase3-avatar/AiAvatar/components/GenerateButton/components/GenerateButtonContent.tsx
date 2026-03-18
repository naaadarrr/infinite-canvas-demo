/**
 * GenerateButtonContent 组件
 * 按钮内容子组件，消除重复代码
 */
'use client';

import { Info, Sparkle, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';
import { GenerateButtonLoading } from '@/app/board/[id]/components/ToolPanel/components/primitives/GenerateButton';

interface GenerateButtonContentProps {
  isLoading: boolean;
  displayCost: string;
  creditsPerSecond: number;
  isEstimatedCredits: boolean;
  loadingText?: string;
  /** 是否免费生成（免费用户且有免费次数） */
  isFreeGenerate?: boolean;
  /** 免费次数（用于显示在星星图标后面） */
  freeCount?: number;
  /** 是否显示皇冠图标（付费用户或无权限时） */
  showCrownIcon?: boolean;
  /** 权限是否满足（无权限时 Crown 用 amber 与 PA 对齐） */
  isSufficientPermission?: boolean;
  /** 积分是否足够（不足时成本数字显示橙色） */
  isEnoughCredit?: boolean;
}

/**
 * 按钮内容组件
 */
export function GenerateButtonContent({
  isLoading,
  displayCost,
  creditsPerSecond,
  isEstimatedCredits,
  loadingText,
  isFreeGenerate = false,
  freeCount,
  showCrownIcon = false,
  isSufficientPermission = true,
  isEnoughCredit = true
}: GenerateButtonContentProps) {
  // 与 PA 对齐：无权限时 Crown 用 amber，付费用户 Unlimited 时用 white
  const crownClassName =
    showCrownIcon && !isSufficientPermission
      ? 'h-4 w-4 shrink-0 fill-amber-400 text-amber-400'
      : showCrownIcon
        ? 'h-4 w-4 shrink-0 text-white'
        : '';

  const tooltipContent = isFreeGenerate
    ? 'Free generation (using free quota)'
    : isEstimatedCredits
      ? `Estimated cost. Actual price is based on generated audio duration (${creditsPerSecond} credits/sec).`
      : `${creditsPerSecond} credits per second`;

  // 免费生成：绿色；积分不足：橙色；其余：默认
  const costColor = isFreeGenerate
    ? 'text-[#00CA30]'
    : !isEnoughCredit
      ? 'text-orange-400'
      : '';
  const freeGenerateFill = isFreeGenerate ? 'fill-[#00CA30]' : 'fill-current';

  return (
    <>
      {/* 正常状态内容 - 始终渲染以保持按钮宽度 */}
      <span
        className={cn(
          'flex w-full items-center justify-center gap-2',
          isLoading && 'invisible'
        )}
      >
        {showCrownIcon && crownClassName ? (
          <Crown className={crownClassName} />
        ) : null}
        <span>Generate</span>
        <span className='flex items-center gap-1 border-l border-white/30 pl-2'>
          <Sparkle className={cn('h-3.5 w-3.5', freeGenerateFill)} />
          {freeCount !== undefined && (
            <span className='text-white/70'>{freeCount}</span>
          )}
          {displayCost && <span className={costColor}>{displayCost}</span>}
          {/* Info Tooltip - 使用 Tooltip 组件统一实现 */}
          <Tooltip
            content={tooltipContent}
            position='top'
          >
            <Info className='h-3.5 w-3.5 cursor-help text-white/40 hover:text-white/60' />
          </Tooltip>
        </span>
      </span>
      {/* Loading 状态内容 - 绝对定位覆盖在原内容上 */}
      {isLoading && (
        <span className='absolute inset-0 flex w-full items-center justify-center gap-2'>
          <GenerateButtonLoading text={loadingText} />
        </span>
      )}
    </>
  );
}
