'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getResourcePrefixed } from '@/utils/path';
import type { ProductAvatarMetaFrontDTO } from '@/server/api/services/productAvatar/template/type';

export interface ProductAvatarCardProps {
  template: ProductAvatarMetaFrontDTO;
  onSelect: (template: ProductAvatarMetaFrontDTO) => void;
  onToggleFavorite: (templateId: string, isFavorite: boolean) => void;
}

export function ProductAvatarCard({
  template,
  onSelect,
  onToggleFavorite
}: ProductAvatarCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);

  const templateId = template.avatarId;
  const imageUrl = getResourcePrefixed(template.avatarImagePath || '');
  const altText = template.avatarName || `Template ${template.avatarId}`;

  // 固定宽高比 9:16
  const DEFAULT_ASPECT_RATIO = 9 / 16;

  // 图片加载完成处理
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      setImageAspectRatio(aspectRatio);
    }
    setIsImageLoaded(true);
  };

  // 计算占位容器的宽高比，如果没有则使用默认值 9:16
  const placeholderAspectRatio = imageAspectRatio || DEFAULT_ASPECT_RATIO;

  return (
    <div
      onClick={() => onSelect(template)}
      className='group relative mb-3 break-inside-avoid rounded-xl border border-white/5 bg-white/5 transition-all duration-200 hover:border-white/20 hover:shadow-lg hover:shadow-black/30 cursor-pointer'
    >
      {/* 图片容器 - 固定宽高比模式 */}
      <div
        className='relative overflow-hidden rounded-xl bg-white/5'
        style={{
          aspectRatio: `${placeholderAspectRatio}`,
          minHeight: imageAspectRatio ? undefined : '80px'
        }}
      >
        {/* 占位容器 - 在图片加载前显示 */}
        {!isImageLoaded && (
          <div className='absolute inset-0 bg-white/5 animate-pulse' />
        )}

        {/* 实际图片 */}
        <img
          src={imageUrl}
          alt={altText}
          draggable={false}
          onLoad={handleImageLoad}
          onError={() => setIsImageLoaded(true)}
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-300 group-hover:scale-105 select-none',
            isImageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          loading='lazy'
        />
      </div>

      {/* Hover overlay with button at bottom */}
      <div className='absolute inset-0 flex items-end justify-center pb-3 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none'>
        <span className='rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black shadow-lg'>
          Select
        </span>
      </div>

      {/* Top buttons container - outside overflow-hidden */}
      <div className='absolute top-2 left-2 right-2 z-10 flex justify-between items-start'>
        {/* Favorite Button - Top Left */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(templateId, !!template.favorite);
          }}
          className={cn(
            'p-0.5 transition-all duration-200',
            template.favorite
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100'
          )}
        >
          <Star
            className={cn(
              'h-4 w-4 transition',
              template.favorite
                ? 'fill-amber-400 text-amber-400'
                : 'text-white/50 hover:text-amber-400'
            )}
          />
        </button>
      </div>
    </div>
  );
}
