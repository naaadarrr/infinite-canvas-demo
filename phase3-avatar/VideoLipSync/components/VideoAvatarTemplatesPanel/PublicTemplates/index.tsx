'use client';

import { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { useRecoilValue } from 'recoil-next';
import { videoAvatarTemplateCategoryIdState } from '../../../store/templateAtoms';
import { useVideoAvatarTemplate } from '../../../hooks/mediaLibrary/useVideoAvatarTemplate';
import { useToggleAvatarFavorite } from '../../../hooks/useToggleAvatarFavorite';
import type { AiAvatarDTO } from '@/server/api/services/mediaLibrary/aiAvatar/type';
import { PublicAvatarCard } from '../AvatarCard/PublicAvatarCard';
import { COMMON_INT_BOOLEAN } from '@/server/api/services/_common/type';
import { RESOURCE_TYPE } from '@/server/api/services/common/favorite/type';

export interface PublicTemplatesProps {
  onUseTemplate: (avatar: AiAvatarDTO) => void;
  onToggleFavorite?: (templateId: string) => void;
  /** 筛选参数 */
  ethnicityIds?: string;
  gender?: string;
  sortField?: string;
  sortType?: string;
}

export function PublicTemplates({
  onUseTemplate,
  onToggleFavorite,
  ethnicityIds,
  gender,
  sortField = 'sort',
  sortType = 'desc'
}: PublicTemplatesProps) {
  const categoryId = useRecoilValue(videoAvatarTemplateCategoryIdState);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isLoadingMoreRef = useRef(false);
  const { toggleFavorite } = useToggleAvatarFavorite();

  // 从 API 获取头像数据
  const { avatars, isLoading, isFetchingNextPage, error, hasMore, loadMore } =
    useVideoAvatarTemplate({
      ethnicityIds,
      gender,
      sortField,
      sortType
    });

  const [localAvatars, setLocalAvatars] = useState<AiAvatarDTO[] | null>(null);

  useEffect(() => {
    if (avatars.length > 0) {
      setLocalAvatars(avatars);
    }
  }, [avatars]);

  const displayAvatars = useMemo(() => {
    return localAvatars ?? avatars;
  }, [localAvatars, avatars]);

  // 当分类切换时，重置 isLoadingMoreRef
  useEffect(() => {
    isLoadingMoreRef.current = false;
  }, [categoryId]);

  // 当加载完成时重置 isLoadingMoreRef
  useEffect(() => {
    if (!isFetchingNextPage) {
      isLoadingMoreRef.current = false;
    }
  }, [isFetchingNextPage]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (
      !container ||
      !hasMore ||
      isFetchingNextPage ||
      isLoadingMoreRef.current
    )
      return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const threshold = 200; // 距离底部 200px 时触发加载

    // 检查是否接近底部
    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      isLoadingMoreRef.current = true;
      loadMore();
    }
  }, [hasMore, isFetchingNextPage, loadMore]);

  // 检查内容是否填满容器，如果没填满且有更多数据，自动加载
  const checkAndLoadMore = useCallback(() => {
    const container = scrollContainerRef.current;
    if (
      !container ||
      !hasMore ||
      isFetchingNextPage ||
      isLoadingMoreRef.current
    )
      return;

    const { scrollHeight, clientHeight } = container;

    // 如果内容高度小于等于容器高度（不需要滚动），且有更多数据，自动加载
    if (scrollHeight <= clientHeight) {
      isLoadingMoreRef.current = true;
      loadMore();
    }
  }, [hasMore, isFetchingNextPage, loadMore]);

  // 无限滚动加载更多
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // 使用 ResizeObserver 监听内容高度变化，当图片加载完成后自动检查是否需要加载更多
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasMore || isFetchingNextPage) return;

    const resizeObserver = new ResizeObserver(() => {
      // 防抖处理，避免频繁触发
      if (isLoadingMoreRef.current) return;

      checkAndLoadMore();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [checkAndLoadMore, hasMore, isFetchingNextPage]);

  // 切换收藏状态（带乐观更新）
  const handleToggleFavorite = useCallback(
    async (avatarId: string, isFavorite: boolean) => {
      // 乐观更新本地状态
      const currentAvatars = localAvatars !== null ? localAvatars : avatars;
      const previousAvatars = currentAvatars;
      const newAvatars = currentAvatars.map((avatar) => {
        if (avatar.aiavatarId === avatarId) {
          return {
            ...avatar,
            isFavorite: isFavorite
              ? COMMON_INT_BOOLEAN.FALSE
              : COMMON_INT_BOOLEAN.TRUE
          };
        }
        return avatar;
      });
      setLocalAvatars(newAvatars);

      try {
        // 调用 API 更新收藏状态
        await toggleFavorite({
          itemId: avatarId,
          isFavorite,
          type: RESOURCE_TYPE.AVATAR
        });
        // API 调用成功后，如果外部提供了 onToggleFavorite，也调用它来同步本地 state
        if (onToggleFavorite) {
          onToggleFavorite(avatarId);
        }
      } catch (error) {
        // 失败时回滚
        setLocalAvatars(previousAvatars);
        throw error;
      }
    },
    [localAvatars, avatars, onToggleFavorite, toggleFavorite]
  );

  // 检查头像是否已收藏（从 API 数据中获取）
  const isFavorite = (avatar: AiAvatarDTO) => {
    return avatar.isFavorite === COMMON_INT_BOOLEAN.TRUE;
  };

  // Loading State - 首次加载或分类切换后加载
  if (isLoading) {
    return (
      <div className='flex-1 flex flex-col items-center justify-center text-white/40'>
        <div className='animate-spin rounded-full h-8 w-8 border-2 border-white/30 border-t-white/60 mb-3'></div>
        <p className='text-sm text-center'>Loading templates...</p>
      </div>
    );
  }

  // Error State
  if (error && displayAvatars.length === 0 && !isLoading) {
    return (
      <div className='flex-1 flex flex-col items-center justify-center text-white/40'>
        <p className='text-sm text-center text-red-400'>
          Failed to load templates
        </p>
        <p className='text-xs mt-1 text-center opacity-70'>{error}</p>
      </div>
    );
  }

  // Empty State - 只有在非加载状态、没有错误且分类切换完成时才显示
  if (displayAvatars.length === 0 && !isLoading && !error) {
    return (
      <div className='flex-1 flex flex-col items-center justify-center text-white/40'>
        <p className='text-sm'>No templates found</p>
      </div>
    );
  }

  return (
    <div className='flex-1 flex flex-col overflow-hidden'>
      <div
        ref={scrollContainerRef}
        className='flex-1 overflow-y-auto pr-1'
        style={{
          columnCount: 5,
          columnGap: '12px'
        }}
      >
        {displayAvatars.map((avatar) => (
          <PublicAvatarCard
            key={avatar.aiavatarId}
            avatar={avatar}
            onUse={() => onUseTemplate(avatar)}
            onToggleFavorite={() =>
              handleToggleFavorite(avatar.aiavatarId, isFavorite(avatar))
            }
          />
        ))}
      </div>

      {/* Loading More Indicator - 单独一行 */}
      {isFetchingNextPage && displayAvatars.length > 0 && (
        <div className='flex justify-center py-4 flex-shrink-0'>
          <div className='animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white/60'></div>
        </div>
      )}
    </div>
  );
}
