'use client';

import { useRef, useEffect, useState } from 'react';
import { Star, MoreHorizontal, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductAvatarMetaFrontDTO } from '@/server/api/services/productAvatar/template/type';
import { getResourcePrefixed } from '@/utils/media';

export interface MyAvatarCardProps {
  /** Avatar 数据 */
  avatar: ProductAvatarMetaFrontDTO;
  /** 是否已收藏 */
  isFavorite: boolean;
  /** 点击使用 Avatar */
  onUse: () => void;
  /** 切换收藏状态 */
  onToggleFavorite: () => void;
  /** 删除 Avatar */
  onDelete: () => void;
}

export function MyAvatarCard({
  avatar,
  isFavorite,
  onUse,
  onToggleFavorite,
  onDelete
}: MyAvatarCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // ProductAvatarMetaFrontDTO 的 status 是 StatusInteger (0:禁用, 1:启用)
  // 这里暂时不显示 processing 状态，因为 DTO 中没有 processing 状态
  const isProcessing = false;
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageUrl = getResourcePrefixed(
    avatar.coverImagePath || avatar.avatarImagePath || ''
  );

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCardClick = () => {
    if (!isProcessing) {
      onUse();
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'group relative rounded-xl border border-white/5 bg-white/5 transition-all duration-200',
        isProcessing
          ? 'cursor-default'
          : 'cursor-pointer hover:border-white/20 hover:shadow-lg hover:shadow-black/30'
      )}
    >
      {/* Image container with reserved aspect ratio to avoid collapse */}
      <div
        className='relative overflow-hidden bg-white/5'
        style={{ aspectRatio: '9/16' }}
      >
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={avatar.avatarName || 'My Product Avatar'}
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
          </>
        ) : (
          <div className='absolute inset-0 animate-pulse bg-white/10' />
        )}

        {/* Processing overlay with progress bar */}
        {isProcessing && (
          <div className='absolute inset-0 flex flex-col items-center justify-center bg-black/40'>
            {/* Progress bar */}
            <div className='absolute bottom-0 left-0 right-0 h-1 bg-white/10' />
          </div>
        )}

        {/* Hover overlay with "Use" button at bottom - only for completed */}
        {!isProcessing && (
          <div className='pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/60 via-transparent to-transparent pb-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
            <span className='rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black shadow-lg'>
              Use
            </span>
          </div>
        )}
      </div>

      {/* Top buttons container - outside overflow-hidden */}
      <div className='absolute left-2 right-2 top-2 z-10 flex items-start justify-between'>
        {/* Favorite Button - Top Left (hide when processing) */}
        {!isProcessing ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={cn(
              'p-0.5 transition-all duration-200',
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
        ) : (
          <div />
        )}

        {/* More Button - Top Right (hide when processing) */}
        {!isProcessing && (
          <div
            className='relative'
            ref={menuRef}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className='p-0.5 opacity-0 transition-all duration-200 group-hover:opacity-100'
            >
              <MoreHorizontal className='h-4 w-4 text-white/50 transition hover:text-white' />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className='absolute right-0 top-6 z-50 w-36 rounded-lg border border-white/10 bg-[#2d2d2d] py-1 shadow-xl'>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                    setIsMenuOpen(false);
                  }}
                  className='flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-white/10'
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
