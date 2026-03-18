'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AigcPhotoAvatar4TemplateDTO } from '@/server/api/services/avatar4/type';
import { getResourcePrefixed } from '@/utils/path';

export interface TemplateCardProps {
  template: AigcPhotoAvatar4TemplateDTO;
  isFavorite: boolean;
  onUse: () => void;
  onToggleFavorite: () => void;
}

export function PublicAvatarCard({
  template,
  isFavorite,
  onUse,
  onToggleFavorite
}: TemplateCardProps) {
  const templateId = template.avatarId;
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);

  // 获取模板图片 URL
  const getTemplateImageUrl = (): string => {
    if (template.imageCompressPath) {
      return getResourcePrefixed(template.imageCompressPath);
    }
    if (template.imageS3Path) {
      return getResourcePrefixed(template.imageS3Path);
    }
    return '';
  };

  const imageUrl = getTemplateImageUrl();

  // 图片加载完成处理
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      setImageAspectRatio(aspectRatio);
    }
    setIsImageLoaded(true);
  };

  // 计算占位容器的宽高比
  const placeholderAspectRatio = imageAspectRatio || 1;

  return (
    <div
      onClick={onUse}
      className='group mb-3 break-inside-avoid overflow-hidden rounded-xl border border-white/5 bg-white/5 transition-all duration-200 hover:border-white/20 hover:shadow-lg hover:shadow-black/30 cursor-pointer'
    >
      {/* 图片容器 - 使用 aspectRatio 预留空间 */}
      <div
        className='relative overflow-hidden bg-white/5'
        style={{
          aspectRatio: `${placeholderAspectRatio}`
        }}
      >
        {/* 占位容器 - 在图片加载前显示 */}
        {!isImageLoaded && (
          <div className='absolute inset-0 bg-white/5 animate-pulse' />
        )}

        {/* 实际图片 */}
        <img
          src={imageUrl}
          alt={`Template ${templateId}`}
          draggable={false}
          onLoad={handleImageLoad}
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-300 group-hover:scale-105 select-none',
            isImageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          loading='lazy'
        />

        {/* Favorite Button - Top Left */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={cn(
            'absolute top-2 left-2 z-10 p-0.5 transition-all duration-200',
            isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
        >
          <Star
            className={cn(
              'h-4 w-4 transition',
              isFavorite
                ? 'fill-amber-400 text-amber-400'
                : 'text-white/50 hover:text-amber-400'
            )}
          />
        </button>

        {/* Hover overlay with "Use" button at bottom */}
        <div className='absolute inset-0 flex items-end justify-center pb-3 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none'>
          <span className='rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black shadow-lg'>
            Use
          </span>
        </div>
      </div>
    </div>
  );
}
