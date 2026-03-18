'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Star, Crown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AiAvatarDTO } from '@/server/api/services/mediaLibrary/aiAvatar/type';
import { RESOURCE_SUBS_TYPE } from '@/types/benefit/resources';
import { getResourcePrefixed } from '@/utils/path';

export interface PublicAvatarCardProps {
  avatar: AiAvatarDTO;
  onUse: () => void;
  onToggleFavorite: () => void;
}

export function PublicAvatarCard({
  avatar,
  onUse,
  onToggleFavorite
}: PublicAvatarCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  // 获取缩略图 URL
  const thumbnailUrl =
    avatar.coverDefaultUrl || getResourcePrefixed(avatar.coverDefault || '');

  // 获取预览视频 URL
  const previewVideoUrl =
    avatar.previewVideoUrl || avatar.transPreviewVideoUrl || '';

  // 图片加载完成处理
  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };

  // 处理 hover 开始加载并播放视频
  const handleMouseEnter = () => {
    setIsHovered(true);
    // 标记需要加载视频（只在第一次 hover 时）
    if (!shouldLoadVideo) {
      setShouldLoadVideo(true);
    }
  };

  // 处理 hover 结束暂停视频
  const handleMouseLeave = () => {
    setIsHovered(false);
    // 移除这里的 pause 调用，统一由 useEffect 处理，避免竞态条件
  };

  // 当需要加载视频时，设置 src（只在第一次）
  useEffect(() => {
    if (shouldLoadVideo && videoRef.current && previewVideoUrl) {
      const video = videoRef.current;
      // 只在还没有设置 src 时设置
      if (!video.src || video.src !== previewVideoUrl) {
        video.src = previewVideoUrl;
        video.load();
      }
    }
  }, [shouldLoadVideo, previewVideoUrl]);

  // 当 hover 时播放视频（统一控制播放/暂停，避免竞态条件）
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoadVideo) return;

    if (isHovered) {
      // 播放视频，捕获可能的错误
      video.currentTime = 0;
      const playPromise = video.play();
      // play() 返回 Promise，需要处理可能的错误
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // 忽略播放被中断的错误（通常是因为快速 hover/unhover 导致的）
          if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
            console.warn('Video play error:', error);
          }
        });
      }
    } else {
      // 暂停视频前，先检查视频状态，避免在 play() Promise 未完成时调用 pause()
      if (!video.paused) {
        video.pause();
      }
      video.currentTime = 0;
    }
  }, [isHovered, shouldLoadVideo]);

  // 处理点击卡片（打开预览）
  const handleCardClick = () => {
    setIsPreviewOpen(true);
  };

  // 处理预览中使用模板
  const handlePreviewUse = () => {
    onUse();
    setIsPreviewOpen(false);
  };

  // 预览弹窗打开时自动播放
  useEffect(() => {
    if (isPreviewOpen && previewVideoRef.current) {
      const video = previewVideoRef.current;
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // 忽略自动播放错误（浏览器策略限制）
          if (error.name !== 'NotAllowedError' && error.name !== 'AbortError') {
            console.warn('Preview video play error:', error);
          }
        });
      }
    } else if (!isPreviewOpen && previewVideoRef.current) {
      // 弹窗关闭时暂停视频
      const video = previewVideoRef.current;
      if (!video.paused) {
        video.pause();
      }
      video.currentTime = 0;
    }
  }, [isPreviewOpen]);

  // 从视频元素获取宽高（如果可用），否则使用默认值 9:16
  const [videoWidth, setVideoWidth] = useState<number>(9);
  const [videoHeight, setVideoHeight] = useState<number>(16);

  // 当预览视频加载元数据时，获取实际宽高
  useEffect(() => {
    if (previewVideoRef.current && previewVideoUrl) {
      const video = previewVideoRef.current;
      const handleLoadedMetadata = () => {
        if (video.videoWidth && video.videoHeight) {
          setVideoWidth(video.videoWidth);
          setVideoHeight(video.videoHeight);
        }
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      // 如果元数据已经加载，立即获取
      if (video.videoWidth && video.videoHeight) {
        setVideoWidth(video.videoWidth);
        setVideoHeight(video.videoHeight);
      }

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [previewVideoUrl, isPreviewOpen]);

  // 计算视频宽高比
  const aspectRatio = videoWidth / videoHeight;

  // 竖屏视频（宽高比 < 1）使用更窄的弹窗
  const isVertical = aspectRatio < 1;

  // 判断是否为 Premium
  const isPremium =
    avatar.memberType !== undefined &&
    avatar.memberType !== RESOURCE_SUBS_TYPE.FREE;

  return (
    <>
      <div
        onClick={handleCardClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className='group mb-3 break-inside-avoid overflow-hidden rounded-xl border border-white/5 bg-white/5 transition-all duration-200 hover:border-white/20 hover:shadow-lg hover:shadow-black/30 cursor-pointer'
      >
        <div
          className='relative overflow-hidden bg-white/5'
          style={{
            aspectRatio: '9/16'
          }}
        >
          {/* 缩略图（默认显示） */}
          <img
            src={thumbnailUrl}
            alt={avatar.aiavatarName}
            draggable={false}
            onLoad={handleImageLoad}
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-opacity duration-300 select-none',
              isHovered ? 'opacity-0' : 'opacity-100'
            )}
            loading='lazy'
          />

          {/* 占位容器 - 在图片加载前显示 */}
          {!isImageLoaded && (
            <div className='absolute inset-0 bg-white/5 animate-pulse' />
          )}

          {/* 预览视频（hover 时才加载和显示，加载后保留元素） */}
          {shouldLoadVideo && previewVideoUrl && (
            <video
              ref={videoRef}
              muted
              loop
              playsInline
              preload='none'
              className={cn(
                'absolute inset-0 h-full w-full object-cover transition-opacity duration-300',
                isHovered ? 'opacity-100' : 'opacity-0'
              )}
            />
          )}

          {/* Top Left: Favorite Button + NEW Badge */}
          <div className='absolute top-2 left-2 z-10 flex items-center'>
            {/* Favorite Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className={cn(
                'p-0.5 transition-all duration-200 overflow-hidden',
                avatar.isFavorite
                  ? 'opacity-100 w-5'
                  : 'opacity-0 w-0 group-hover:opacity-100 group-hover:w-5'
              )}
            >
              <Star
                className={cn(
                  'h-4 w-4 transition flex-shrink-0',
                  avatar.isFavorite
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-white/50 hover:text-amber-400'
                )}
              />
            </button>
          </div>

          {/* Top Right: Premium Crown */}
          {isPremium && (
            <div className='absolute top-2 right-2 z-10'>
              <Crown className='h-4 w-4 fill-amber-400 text-amber-400 drop-shadow-md' />
            </div>
          )}

          {/* Hover overlay with "Use" button */}
          <div className='absolute inset-0 flex items-end justify-center pb-3 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none'>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUse();
              }}
              className='rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black shadow-lg pointer-events-auto hover:bg-white/90 transition'
            >
              Use This Avatar
            </button>
          </div>
        </div>
      </div>

      {/* 预览弹窗 */}
      {isPreviewOpen &&
        createPortal(
          <div
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm'
            onClick={() => setIsPreviewOpen(false)}
          >
            <div
              className={cn(
                'relative mx-4 rounded-2xl overflow-hidden bg-[#1e1e1e] shadow-2xl flex flex-col',
                isVertical
                  ? 'max-h-[90vh] w-auto'
                  : 'max-h-[85vh] max-w-[800px] w-full'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 关闭按钮 */}
              <button
                onClick={() => setIsPreviewOpen(false)}
                className='absolute top-3 right-3 z-10 rounded-full bg-black/50 p-2 text-white/70 transition hover:bg-black/70 hover:text-white'
              >
                <X className='h-5 w-5' />
              </button>

              {/* 视频容器 */}
              <div
                className='flex-1 flex items-center justify-center bg-black overflow-hidden'
                style={{
                  maxHeight: isVertical ? 'calc(90vh - 72px)' : '70vh'
                }}
              >
                <video
                  ref={previewVideoRef}
                  src={previewVideoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className={cn(
                    'object-contain',
                    isVertical
                      ? 'h-full max-h-[calc(90vh-72px)] w-auto'
                      : 'w-full h-auto max-h-[70vh]'
                  )}
                  style={
                    isVertical
                      ? {
                          aspectRatio: `${videoWidth}/${videoHeight}`
                        }
                      : undefined
                  }
                />
              </div>

              {/* 底部操作栏 */}
              <div className='p-4 flex items-center justify-center border-t border-white/10 flex-shrink-0'>
                <button
                  onClick={handlePreviewUse}
                  className='rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-black transition hover:bg-white/90'
                >
                  Use This Avatar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
