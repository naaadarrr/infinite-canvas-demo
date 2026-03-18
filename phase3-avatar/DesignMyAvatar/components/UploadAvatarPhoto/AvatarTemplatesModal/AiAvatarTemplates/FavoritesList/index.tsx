'use client';

import { Loader2, Star } from 'lucide-react';
import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { PublicAvatarCard } from '../AvatarCard/PublicAvatarCard';
import type { AiAvatarDTO } from '@/server/api/services/mediaLibrary/aiAvatar/type';
import type { AigcPhotoAvatar4TemplateDTO } from '@/server/api/services/avatar4/type';
import { useQueryFavoriteAvatar4Template } from '../../../../../hooks/avatar4/useQueryFavoriteTemplate';
import { useQueryCustomAvatar4Template } from '../../../../../hooks/avatar4/useQueryCustomTemplate';
import { useTogglePhotoAvatarFavorite } from '../../../../../hooks/useTogglePhotoAvatarFavorite';
import { RESOURCE_TYPE } from '@/server/api/services/common/favorite/type';

type FavoriteItem = AigcPhotoAvatar4TemplateDTO | AiAvatarDTO;

interface FavoritesListProps {
  onSelectTemplate: (template: AigcPhotoAvatar4TemplateDTO) => void;
  onSelectCustomAvatar: (avatar: AiAvatarDTO) => void;
}

export function FavoritesList({
  onSelectTemplate,
  onSelectCustomAvatar
}: FavoritesListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 使用 hook 处理收藏切换
  const { toggleFavorite } = useTogglePhotoAvatarFavorite();

  // 获取收藏的模板数据 - 支持无限滚动
  const {
    templates: favoriteTemplates,
    isLoading: isLoadingFavorites,
    isFetchingNextPage: isFetchingNextPageFavorites,
    hasMore: hasMoreFavorites,
    loadMore: loadMoreFavorites,
    error: favoriteError,
    refresh: refreshFavorites
  } = useQueryFavoriteAvatar4Template();

  // 获取自定义头像数据
  const { list: customAvatars, isLoading: isLoadingCustomAvatars } =
    useQueryCustomAvatar4Template();

  // 合并所有收藏项目（从 API 获取的原始数据）
  const apiFavoriteItems: FavoriteItem[] = useMemo(() => {
    return [
      ...customAvatars.filter((avatar) => !!avatar.isFavorite),
      ...favoriteTemplates
    ];
  }, [favoriteTemplates, customAvatars]);

  // 本地状态管理收藏列表（用于在取消收藏后移除元素）
  const [localFavoriteItems, setLocalFavoriteItems] = useState<
    FavoriteItem[] | null
  >(null);
  // 记录已取消收藏的 ID，避免 API 更新时重新添加
  const [removedItemIds, setRemovedItemIds] = useState<Set<string>>(new Set());

  // 同步 API 数据到本地状态（过滤掉已移除的项）
  useEffect(() => {
    const filteredItems = apiFavoriteItems.filter((item) => {
      const itemId = 'avatarId' in item ? item.avatarId : item.aiavatarId;
      return !removedItemIds.has(itemId);
    });
    setLocalFavoriteItems(filteredItems);
  }, [apiFavoriteItems, removedItemIds]);

  // 使用本地状态（已过滤掉已移除的项）
  const favoriteItems = useMemo(() => {
    if (localFavoriteItems === null) {
      // 初始加载时，如果 localFavoriteItems 为 null，返回过滤后的 apiFavoriteItems
      return apiFavoriteItems.filter((item) => {
        const itemId = 'avatarId' in item ? item.avatarId : item.aiavatarId;
        return !removedItemIds.has(itemId);
      });
    }
    return localFavoriteItems;
  }, [localFavoriteItems, apiFavoriteItems, removedItemIds]);

  // 处理收藏切换（等待接口成功后再更新）
  const handleToggleFavorite = async (itemId: string, isFavorite: boolean) => {
    try {
      // 调用 API
      await toggleFavorite({
        itemId,
        isFavorite,
        type: RESOURCE_TYPE.PHOTO_AVATAR
      });

      // 接口调用成功后，从本地状态中移除元素（取消收藏时）
      if (isFavorite) {
        // 取消收藏：从列表中移除，并记录到 removedItemIds
        setRemovedItemIds((prev) => new Set(prev).add(itemId));
        setLocalFavoriteItems((prev) => {
          if (!prev) return null;
          return prev.filter((item) => {
            const itemIdToCompare =
              'avatarId' in item ? item.avatarId : item.aiavatarId;
            return itemIdToCompare !== itemId;
          });
        });
      } else {
        // 添加收藏：从 removedItemIds 中移除，并刷新数据以获取最新状态
        setRemovedItemIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
        refreshFavorites();
      }
    } catch (error) {
      // 错误已在 toggleFavorite 中处理，这里不需要额外处理
      console.error('[FavoritesList] Failed to toggle favorite:', error);
    }
  };

  // 滚动到底部时加载更多
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasMoreFavorites || isFetchingNextPageFavorites) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const threshold = 100; // 距离底部 100px 时触发加载

    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      loadMoreFavorites();
    }
  }, [hasMoreFavorites, isFetchingNextPageFavorites, loadMoreFavorites]);

  // 添加滚动事件监听
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Loading State - 首次加载时显示加载动画
  const isLoading = isLoadingFavorites || isLoadingCustomAvatars;
  if (isLoading && favoriteItems.length === 0) {
    return (
      <div className='flex h-full flex-col items-center justify-center text-white/40'>
        <div className='mb-3 opacity-50'>
          <div className='animate-spin rounded-full h-8 w-8 border border-white/30 border-t-white/60'></div>
        </div>
        <p className='text-sm text-center'>Loading favorite avatars...</p>
      </div>
    );
  }

  // Empty State
  if (favoriteItems.length === 0) {
    return (
      <div className='flex h-full flex-col items-center justify-center text-white/40'>
        <Star
          size={48}
          className='mb-3 opacity-50'
        />
        <p className='text-sm text-center'>No favorite avatars yet</p>
        <p className='text-xs mt-1 text-center opacity-70'>
          Click the star icon on any template to add it to favorites
        </p>
      </div>
    );
  }

  // 渲染单个收藏项目
  const renderFavoriteItem = (item: FavoriteItem) => {
    const isTemplate = 'avatarId' in item;
    const itemId = isTemplate ? item.avatarId : item.aiavatarId;
    const onClick = isTemplate
      ? () => onSelectTemplate(item as AigcPhotoAvatar4TemplateDTO)
      : () => onSelectCustomAvatar(item as AiAvatarDTO);
    const isFavorite = isTemplate
      ? (item as AigcPhotoAvatar4TemplateDTO).isFavorite === 1
      : (item as AiAvatarDTO).isFavorite === 1;

    return (
      <PublicAvatarCard
        key={itemId}
        avatar={item}
        onSelect={onClick}
        onToggleFavorite={handleToggleFavorite}
        defaultAspectRatio={isTemplate ? 9 / 16 : undefined}
      />
    );
  };

  return (
    <div
      ref={scrollContainerRef}
      className='h-full overflow-y-auto'
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
      }}
    >
      <div
        style={{
          columnCount: 7,
          columnGap: '12px'
        }}
      >
        {favoriteItems.map(renderFavoriteItem)}
      </div>

      {/* 加载状态区域 - 独立于多列布局 */}
      <div className='mt-4'>
        {/* 加载更多指示器 */}
        {isFetchingNextPageFavorites && favoriteTemplates.length > 0 && (
          <div className='flex items-center justify-center py-4'>
            <Loader2 className='h-5 w-5 animate-spin text-white/60' />
            <span className='ml-2 text-sm text-white/60'>Loading more...</span>
          </div>
        )}

        {/* 没有更多数据提示 */}
        {!hasMoreFavorites &&
          favoriteTemplates.length > 0 &&
          !isFetchingNextPageFavorites && (
            <div className='flex items-center justify-center py-4'>
              <span className='text-xs text-white/40'>
                No more favorites to load
              </span>
            </div>
          )}

        {/* 错误提示 */}
        {favoriteError && (
          <div className='flex items-center justify-center py-4'>
            <span className='text-xs text-red-400'>
              Failed to load favorites: {favoriteError}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
