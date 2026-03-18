'use client';

import { useState, useRef, useEffect } from 'react';
import { Star, MoreHorizontal, Info, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AiAvatarDTO } from '@/server/api/services/mediaLibrary/aiAvatar/type';
import { getResourcePrefixed } from '@/utils/path';
import { AvatarInfoModal } from './AvatarInfoModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

/**
 * 检查头像是否有预览视频
 */
function hasPreviewVideo(avatar: AiAvatarDTO): boolean {
  return !!avatar.previewVideoUrl || !!avatar.previewVideoS3Path;
}

/**
 * 获取预览视频 URL
 */
function getPreviewVideoUrl(avatar: AiAvatarDTO): string {
  if (avatar.previewVideoUrl) {
    return avatar.previewVideoUrl;
  }
  if (avatar.previewVideoS3Path) {
    return getResourcePrefixed(avatar.previewVideoS3Path);
  }
  return '';
}

export interface AvatarCardProps {
  avatar: AiAvatarDTO;
  onUse: () => void;
  onToggleFavorite: () => void;
  /** 显示删除确认回调 */
  onShowDeleteConfirm?: (avatar: AiAvatarDTO) => void;
}

export function CustomAvatarCard({
  avatar,
  onUse,
  onToggleFavorite,
  onShowDeleteConfirm
}: AvatarCardProps) {
  const avatarName = avatar.aiavatarName || 'My Avatar';
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [deleteConfirmAvatar, setDeleteConfirmAvatar] =
    useState<AiAvatarDTO | null>(null);

  // 视频相关状态
  const [isHovered, setIsHovered] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasVideo = hasPreviewVideo(avatar);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  // 处理视频播放/暂停
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasVideo) return;

    const playVideo = async () => {
      try {
        await video.play();
        setIsVideoPlaying(true);
      } catch (error) {
        console.error('Failed to play video:', error);
        setIsVideoPlaying(false);
      }
    };

    const pauseVideo = () => {
      video.pause();
      video.currentTime = 0; // 重置到开头
      setIsVideoPlaying(false);
    };

    if (isHovered) {
      playVideo();
    } else {
      pauseVideo();
    }

    // 清理函数
    return () => {
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    };
  }, [isHovered, hasVideo]);

  // 获取头像图片 URL
  const getAvatarImageUrl = (): string => {
    if (avatar.coverDefaultUrl) {
      return avatar.coverDefaultUrl;
    }
    if (avatar.coverDefault) {
      return getResourcePrefixed(avatar.coverDefault);
    }
    return '';
  };

  const imageUrl = getAvatarImageUrl();

  // 图片加载完成处理
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      setImageAspectRatio(aspectRatio);
    }
    setIsImageLoaded(true);
  };

  // 计算占位容器的宽高比，如果没有则使用默认的最小高度
  const placeholderAspectRatio = imageAspectRatio || 1;

  // 判断是否显示更多菜单：如果有 onUpdateVoice 或 onShowDeleteConfirm，则显示
  const showMoreMenu = !!onShowDeleteConfirm;

  return (
    <div
      onClick={onUse}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className='group relative mb-3 break-inside-avoid rounded-xl border border-white/5 bg-white/5 transition-all duration-200 hover:border-white/20 hover:shadow-lg hover:shadow-black/30 cursor-pointer'
    >
      {/* 媒体容器 - 使用 aspectRatio 预留空间 */}
      <div
        className='relative overflow-hidden rounded-xl bg-white/5'
        style={{
          aspectRatio: `${placeholderAspectRatio}`,
          minHeight: imageAspectRatio ? undefined : '80px'
        }}
      >
        {/* 视频层 - 如果有预览视频 */}
        {hasVideo && (
          <video
            ref={videoRef}
            src={getPreviewVideoUrl(avatar)}
            muted
            loop
            playsInline
            preload='metadata'
            className={cn(
              'absolute inset-0 w-full h-full object-cover select-none transition-opacity duration-300 group-hover:scale-105',
              isHovered ? 'opacity-100' : 'opacity-0'
            )}
            onLoadedMetadata={() => {
              // 视频元数据加载后，设置视频的宽高比
              const video = videoRef.current;
              if (video?.videoWidth && video?.videoHeight) {
                const aspectRatio = video.videoWidth / video.videoHeight;
                setImageAspectRatio(aspectRatio);
              }
            }}
          />
        )}

        {/* 占位容器 - 在图片加载前显示 */}
        {!isImageLoaded && (
          <div className='absolute inset-0 bg-white/5 animate-pulse' />
        )}

        {/* 实际图片 */}
        <img
          src={imageUrl}
          alt={avatarName}
          draggable={false}
          onLoad={handleImageLoad}
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-300 group-hover:scale-105 select-none',
            // 如果有视频且正在播放，隐藏图片
            hasVideo && isHovered
              ? 'opacity-0'
              : isImageLoaded
                ? 'opacity-100'
                : 'opacity-0'
          )}
          loading='lazy'
        />

        {/* Hover overlay with "Use" button at bottom */}
        <div className='absolute inset-0 flex items-end justify-center pb-3 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none'>
          <span className='rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black shadow-lg'>
            Use
          </span>
        </div>
      </div>

      {/* Top buttons container - outside overflow-hidden */}
      <div className='absolute top-2 left-2 right-2 z-10 flex justify-between items-start'>
        {/* Favorite Button - Top Left */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
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

        {/* More Button - Top Right */}
        {showMoreMenu && (
          <div
            className='relative'
            ref={menuOpen ? menuRef : undefined}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className='p-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200'
            >
              <MoreHorizontal className='h-4 w-4 text-white/50 hover:text-white transition' />
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className='absolute right-0 top-6 w-36 py-1 rounded-lg bg-[#2d2d2d] border border-white/10 shadow-xl z-50'>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setInfoModalOpen(true);
                    setMenuOpen(false);
                  }}
                  className='w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 flex items-center gap-2'
                >
                  <Info size={14} />
                  Avatar Info
                </button>

                {showMoreMenu && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmAvatar(avatar);
                      setMenuOpen(false);
                    }}
                    className='w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-white/10 flex items-center gap-2'
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Avatar Info Modal */}
      <AvatarInfoModal
        avatar={avatar}
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
      />

      {deleteConfirmAvatar && (
        <DeleteConfirmModal
          isOpen={!!deleteConfirmAvatar}
          onClose={() => setDeleteConfirmAvatar(null)}
          onConfirm={() => {
            onShowDeleteConfirm?.(deleteConfirmAvatar);
            setDeleteConfirmAvatar(null);
          }}
        />
      )}
    </div>
  );
}
