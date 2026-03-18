'use client';

import { useState } from 'react';
import { Star, Crown, PersonStanding } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';
import { getResourcePrefixed } from '@/utils/media';
import type { ProductAvatarMetaFrontDTO } from '@/server/api/services/productAvatar/template/type';
import { RESOURCE_SUBS_TYPE } from '@/types/benefit/resources';

/** 默认宽高比 - 图片加载前使用 */
const DEFAULT_ASPECT_RATIO = '9/16';

export interface TemplateCardProps {
  /** 模板数据 */
  template: ProductAvatarMetaFrontDTO;
  /** 是否已收藏 */
  isFavorite: boolean;
  /** 点击使用模板 */
  onUse: () => void;
  /** 切换收藏状态 */
  onToggleFavorite: () => void;
  /** 点击 Character Swap */
  onCharacterSwap: () => void;
}

export function TemplateCard({
  template,
  isFavorite,
  onUse,
  onToggleFavorite,
  onCharacterSwap
}: TemplateCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  // 存储图片实际宽高比（图片加载后获取）
  const [naturalAspectRatio, setNaturalAspectRatio] = useState<string | null>(
    null
  );
  const imageUrl = getResourcePrefixed(
    template.coverImagePath || template.avatarImagePath || ''
  );

  // 计算宽高比：
  // 1. 图片加载后使用实际尺寸
  // 2. 加载前使用默认 3:4 比例（避免高度异常）
  const aspectRatio = naturalAspectRatio || DEFAULT_ASPECT_RATIO;

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // 获取图片实际尺寸
    setNaturalAspectRatio(`${img.naturalWidth}/${img.naturalHeight}`);
    setImageLoaded(true);
  };

  return (
    <div
      onClick={onUse}
      className='group cursor-pointer overflow-hidden rounded-xl border border-white/5 bg-white/5 transition-all duration-200 hover:border-white/20 hover:shadow-lg hover:shadow-black/30'
    >
      <div
        className='relative overflow-hidden bg-white/5'
        style={{ aspectRatio }}
      >
        <img
          src={imageUrl}
          alt={template.avatarName}
          draggable={false}
          className={cn(
            'h-full w-full select-none object-cover transition-transform duration-300 group-hover:scale-105',
            !imageLoaded && 'opacity-0'
          )}
          loading='lazy'
          onLoad={handleImageLoad}
        />
        {!imageLoaded && (
          <div className='absolute inset-0 animate-pulse bg-white/10' />
        )}

        {/* Top Left: Favorite Button + NEW Badge */}
        <div className='absolute left-2 top-2 z-10 flex items-center'>
          {/* Favorite Button - width collapses when hidden */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={cn(
              'overflow-hidden p-0.5 transition-all duration-200',
              isFavorite
                ? 'w-5 opacity-100'
                : 'w-0 opacity-0 group-hover:w-5 group-hover:opacity-100'
            )}
          >
            <Star
              className={cn(
                'h-4 w-4 flex-shrink-0 transition',
                isFavorite
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-white/50 hover:text-amber-400'
              )}
            />
          </button>

          {/* NEW Badge - moves to left edge when favorite button is hidden */}
          {template.showNewBadge === 1 && (
            <span className='rounded bg-indigo-500 px-1.5 py-0.5 text-[10px] font-medium text-white transition-all duration-200'>
              NEW
            </span>
          )}
        </div>

        {/* Top Right: Premium Crown - 根据 minSubsType 判断是否为 Premium */}
        {template.minSubsType !== undefined &&
          template.minSubsType !== RESOURCE_SUBS_TYPE.FREE && (
            <div className='absolute right-2 top-2 z-10'>
              <Crown className='h-4 w-4 fill-amber-400 text-amber-400 drop-shadow-md' />
            </div>
          )}

        {/* Hover overlay with buttons at bottom */}
        <div className='absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/60 via-transparent to-transparent pb-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
          <div className='flex items-center gap-2'>
            <span className='pointer-events-none flex-shrink-0 whitespace-nowrap rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black shadow-lg'>
              Use This Avatar
            </span>
            <Tooltip
              content='Character Swap'
              position='top'
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCharacterSwap();
                }}
                className='rounded-md bg-white/90 p-1.5 text-black shadow-lg transition hover:bg-white'
              >
                <PersonStanding className='h-4 w-4' />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
