'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getResourcePrefixed } from '@/utils/path';
import type { AiAvatarDTO } from '@/server/api/services/mediaLibrary/aiAvatar/type';
import type { AigcPhotoAvatar4TemplateDTO } from '@/server/api/services/avatar4/type';

type AvatarItem = AigcPhotoAvatar4TemplateDTO | AiAvatarDTO;

export interface AvatarImageCardProps {
  avatar: AvatarItem;
  onSelect: (avatar: AvatarItem) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  /** 默认宽高比，当图片未加载时使用 */
  defaultAspectRatio?: number;
}

export function PublicAvatarCard({
  avatar,
  onSelect,
  onToggleFavorite,
  defaultAspectRatio = 9 / 16
}: AvatarImageCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);

  // 判断是否为模板类型
  const isTemplate = 'avatarId' in avatar;

  // 获取 avatar ID
  const avatarId = isTemplate ? avatar.avatarId : avatar.aiavatarId || '';

  // 获取图片 URL
  const getImageUrl = (): string => {
    if (isTemplate) {
      return getResourcePrefixed(
        avatar.imageCompressPath || avatar.imageS3Path
      );
    }
    if (avatar.coverDefaultUrl) {
      return avatar.coverDefaultUrl;
    }
    if (avatar.coverDefault) {
      return getResourcePrefixed(avatar.coverDefault);
    }
    return '';
  };

  // 获取 alt 文本
  const getAltText = (): string => {
    if (isTemplate) {
      return `Avatar ${avatar.avatarId}`;
    }
    return avatar.aiavatarName || 'My Avatar';
  };

  const imageUrl = getImageUrl();
  const altText = getAltText();

  // 图片加载完成处理
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      setImageAspectRatio(aspectRatio);
    }
    setIsImageLoaded(true);
  };

  // 计算占位容器的宽高比，如果没有则使用默认值
  const placeholderAspectRatio = imageAspectRatio || defaultAspectRatio;

  return (
    <div
      onClick={() => {
        onSelect(avatar);
      }}
      className='group relative mb-3 break-inside-avoid rounded-xl border border-white/5 bg-white/5 transition-all duration-200 hover:border-white/20 hover:shadow-lg hover:shadow-black/30 cursor-pointer'
    >
      {/* 图片容器 - 使用 aspectRatio 预留空间 */}
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

        {/* Hover overlay with button at bottom */}
        <div className='absolute inset-0 flex items-end justify-center pb-3 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none'>
          <span className='rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black shadow-lg'>
            Select
          </span>
        </div>
      </div>

      {/* Top buttons container - outside overflow-hidden */}
      <div className='absolute top-2 left-2 right-2 z-10 flex justify-between items-start'>
        {/* Favorite Button - Top Left */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (avatarId) {
              onToggleFavorite(avatarId, !!avatar.isFavorite);
            }
          }}
          className={cn(
            'p-0.5 transition-all duration-200',
            avatar.isFavorite
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100'
          )}
        >
          <Star
            className={cn(
              'h-4 w-4 transition',
              avatar.isFavorite
                ? 'fill-amber-400 text-amber-400'
                : 'text-white/50 hover:text-amber-400'
            )}
          />
        </button>
      </div>
    </div>
  );
}
