'use client';

/**
 * Template Card 骨架屏组件
 * 用于显示加载状态
 */
export function TemplateCardSkeleton() {
  return (
    <div className='group overflow-hidden rounded-xl border border-white/5 bg-white/5'>
      <div
        className='relative overflow-hidden bg-white/5'
        style={{
          aspectRatio: '9/16'
        }}
      >
        {/* 骨架屏图片区域 */}
        <div className='h-full w-full animate-pulse bg-white/10' />
      </div>
    </div>
  );
}
