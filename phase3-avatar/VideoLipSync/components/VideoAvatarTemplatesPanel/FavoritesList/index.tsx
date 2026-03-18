'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import type { AiAvatarDTO } from '@/server/api/services/mediaLibrary/aiAvatar/type';
import { COMMON_INT_BOOLEAN } from '@/server/api/services/_common/type';
import { RESOURCE_TYPE } from '@/server/api/services/common/favorite/type';
import { useQueryFavoriteVideoAvatar } from '../../../hooks/mediaLibrary/useQueryFavoriteTemplate';
import { useToggleAvatarFavorite } from '../../../hooks/useToggleAvatarFavorite';
import { PublicAvatarCard } from '../AvatarCard/PublicAvatarCard';
import { CustomAvatarCard } from '../AvatarCard/CustomAvatarCard';

type FavoriteItem = AiAvatarDTO;

export interface FavoritesListProps {
  onUseTemplate: (avatar: AiAvatarDTO) => void;
}

export function FavoritesList({ onUseTemplate }: FavoritesListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isLoadingMoreRef = useRef(false);
  const { toggleFavorite } = useToggleAvatarFavorite();

  // 从 API 获取收藏的头像数据（包含公共模板 + 自定义头像）
  const { avatars, isLoading, isFetchingNextPage, error, hasMore, loadMore } =
    useQueryFavoriteVideoAvatar();

  const [localAvatars, setLocalAvatars] = useState<FavoriteItem[] | null>(null);

  useEffect(() => {
    if (avatars.length > 0) {
      setLocalAvatars(avatars);
    }
  }, [avatars]);

  const favoriteItems: FavoriteItem[] = useMemo(() => {
    return localAvatars ?? avatars;
  }, [localAvatars, avatars]);

  // 无限滚动：滚动到底部时加载更多
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (
      !container ||
      !hasMore ||
      isFetchingNextPage ||
      isLoadingMoreRef.current
    ) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = container;
    const threshold = 200;

    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      isLoadingMoreRef.current = true;
      loadMore();
    }
  }, [hasMore, isFetchingNextPage, loadMore]);

  // 如果内容不足以滚动且还有更多数据，自动加载下一页
  const checkAndLoadMore = useCallback(() => {
    const container = scrollContainerRef.current;
    if (
      !container ||
      !hasMore ||
      isFetchingNextPage ||
      isLoadingMoreRef.current
    ) {
      return;
    }

    const { scrollHeight, clientHeight } = container;
    if (scrollHeight <= clientHeight) {
      isLoadingMoreRef.current = true;
      loadMore();
    }
  }, [hasMore, isFetchingNextPage, loadMore]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // 当加载完成时重置 isLoadingMoreRef
  useEffect(() => {
    if (!isFetchingNextPage) {
      isLoadingMoreRef.current = false;
    }
  }, [isFetchingNextPage]);

  // 使用 ResizeObserver 监听内容变化，自动补充加载
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasMore || isFetchingNextPage) return;

    const resizeObserver = new ResizeObserver(() => {
      if (isLoadingMoreRef.current) return;
      checkAndLoadMore();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [checkAndLoadMore, hasMore, isFetchingNextPage]);

  // 切换收藏状态（取消收藏时从列表中移除，带乐观更新）
  const handleToggleFavorite = async (
    avatarId: string,
    isFavorite: boolean
  ) => {
    const currentItems = localAvatars !== null ? localAvatars : avatars;
    const previousItems = currentItems;

    // Favorites 视图中主要处理"取消收藏"：取消时从列表中移除
    const nextItems = isFavorite
      ? currentItems.filter((item) => item.aiavatarId !== avatarId)
      : currentItems;

    setLocalAvatars(nextItems);

    try {
      await toggleFavorite({
        itemId: avatarId,
        isFavorite,
        type: RESOURCE_TYPE.AVATAR
      });
    } catch (err) {
      setLocalAvatars(previousItems);
      throw err;
    }
  };

  const isFavoriteAvatar = (avatar: AiAvatarDTO) =>
    avatar.isFavorite === COMMON_INT_BOOLEAN.TRUE;

  const isCustomAvatar = (avatar: AiAvatarDTO) =>
    avatar.isCustom === COMMON_INT_BOOLEAN.TRUE;

  // Loading State
  if (isLoading && favoriteItems.length === 0) {
    return (
      <div className='flex-1 flex flex-col items-center justify-center text-white/40'>
        <div className='animate-spin rounded-full h-8 w-8 border-2 border-white/30 border-t-white/60 mb-3'></div>
        <p className='text-sm text-center'>Loading favorite video avatars...</p>
      </div>
    );
  }

  // Error State
  if (error && favoriteItems.length === 0 && !isLoading) {
    return (
      <div className='flex-1 flex flex-col items-center justify-center text-white/40'>
        <p className='text-sm text-center text-red-400'>
          Failed to load favorite avatars
        </p>
        <p className='text-xs mt-1 text-center opacity-70'>{error}</p>
      </div>
    );
  }

  // Empty State
  if (favoriteItems.length === 0) {
    return (
      <div className='flex-1 flex flex-col items-center justify-center text-white/40'>
        <Star
          size={48}
          className='mb-3 opacity-50'
        />
        <p className='text-sm text-center'>No favorite video avatars yet</p>
        <p className='text-xs mt-1 text-center opacity-70'>
          Click the star icon on any template to add it to favorites
        </p>
      </div>
    );
  }

  // 渲染单个收藏项目：根据 isCustom 区分公共模板和 My Avatar
  const renderFavoriteItem = (item: FavoriteItem) => {
    const avatarId = item.aiavatarId;
    const favorite = isFavoriteAvatar(item);

    if (isCustomAvatar(item)) {
      return (
        <CustomAvatarCard
          key={avatarId}
          avatar={item}
          onUse={() => onUseTemplate(item)}
          onToggleFavorite={() => handleToggleFavorite(avatarId, favorite)}
        />
      );
    }

    return (
      <PublicAvatarCard
        key={avatarId}
        avatar={item}
        onUse={() => onUseTemplate(item)}
        onToggleFavorite={() => handleToggleFavorite(avatarId, favorite)}
      />
    );
  };

  return (
    <div className='flex-1 flex flex-col overflow-hidden'>
      <div
        ref={scrollContainerRef}
        className='flex-1 overflow-y-auto pr-1'
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '12px'
          }}
        >
          {favoriteItems.map(renderFavoriteItem)}
        </div>
      </div>

      {/* Loading More Indicator */}
      {isFetchingNextPage && favoriteItems.length > 0 && (
        <div className='flex justify-center py-4 flex-shrink-0'>
          <div className='animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white/60'></div>
        </div>
      )}
    </div>
  );
}
