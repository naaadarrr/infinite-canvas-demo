'use client';

import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { Star } from 'lucide-react';
import type { AiAvatarDTO } from '@/server/api/services/mediaLibrary/aiAvatar/type';
import type { AigcPhotoAvatar4TemplateDTO } from '@/server/api/services/avatar4/type';
import { useQueryCustomAvatar4Template } from '../../../hooks/avatar4Template/useQueryCustomTemplate';
import { useQueryFavoriteAvatar4Template } from '../../../hooks/avatar4Template/useQueryFavoriteTemplate';
import { COMMON_INT_BOOLEAN } from '@/server/api/services/_common/type';
import { RESOURCE_TYPE } from '@/server/api/services/common/favorite/type';
import { useTogglePhotoAvatarFavorite } from '../../../hooks/useTogglePhotoAvatarFavorite';
import { PublicAvatarCard } from '../AvatarCard/PublicAvatarCard';
import { CustomAvatarCard } from '../AvatarCard/CustomAvatarCard';

type FavoriteItem = AigcPhotoAvatar4TemplateDTO | AiAvatarDTO;

interface FavoritesListProps {
  onUseTemplate: (template: AigcPhotoAvatar4TemplateDTO) => void;
  onUseMyAvatar: (avatar: AiAvatarDTO) => void;
  onUpdateVoice?: (avatarId: string, voiceId: string) => void;
  onShowDeleteConfirm?: (avatar: AiAvatarDTO) => void;
}

export function FavoritesList({
  onUseTemplate,
  onUseMyAvatar,
  onUpdateVoice,
  onShowDeleteConfirm
}: FavoritesListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isLoadingMoreRef = useRef(false);
  const { toggleFavorite } = useTogglePhotoAvatarFavorite();

  // 从 API 获取收藏的模板数据
  const {
    templates: favoriteTemplates,
    isLoading: isLoadingTemplates,
    isFetchingNextPage: isFetchingNextPageTemplates,
    error: templatesError,
    hasMore: hasMoreTemplates,
    loadMore: loadMoreTemplates
  } = useQueryFavoriteAvatar4Template({
    pageSize: 30
  });

  // 从 API 获取自定义头像数据
  const {
    list: myAvatars,
    isLoading: isLoadingMyAvatars,
    error: myAvatarsError
  } = useQueryCustomAvatar4Template();

  const [localFavoriteTemplates, setLocalFavoriteTemplates] = useState<
    AigcPhotoAvatar4TemplateDTO[] | null
  >(null);
  const [localMyAvatars, setLocalMyAvatars] = useState<AiAvatarDTO[] | null>(
    null
  );

  useEffect(() => {
    if (favoriteTemplates.length > 0) {
      setLocalFavoriteTemplates(favoriteTemplates);
    }
  }, [favoriteTemplates]);

  useEffect(() => {
    if (myAvatars.length > 0) {
      setLocalMyAvatars(myAvatars);
    }
  }, [myAvatars]);

  const displayFavoriteTemplates = useMemo(() => {
    return localFavoriteTemplates ?? favoriteTemplates;
  }, [localFavoriteTemplates, favoriteTemplates]);

  const displayMyAvatars = useMemo(() => {
    return localMyAvatars ?? myAvatars;
  }, [localMyAvatars, myAvatars]);

  // 获取收藏的 My Avatars
  const favoriteMyAvatars = useMemo(() => {
    return displayMyAvatars.filter(
      (avatar) => avatar.isFavorite === COMMON_INT_BOOLEAN.TRUE
    );
  }, [displayMyAvatars]);

  // 合并所有收藏项目
  const favoriteItems: FavoriteItem[] = useMemo(() => {
    return [...favoriteMyAvatars, ...displayFavoriteTemplates];
  }, [displayFavoriteTemplates, favoriteMyAvatars]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (
      !container ||
      !hasMoreTemplates ||
      isFetchingNextPageTemplates ||
      isLoadingMoreRef.current
    )
      return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const threshold = 200; // 距离底部 200px 时触发加载

    // 检查是否接近底部
    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      isLoadingMoreRef.current = true;
      loadMoreTemplates();
    }
  }, [hasMoreTemplates, isFetchingNextPageTemplates, loadMoreTemplates]);

  // 检查内容是否填满容器，如果没填满且有更多数据，自动加载
  const checkAndLoadMore = useCallback(() => {
    const container = scrollContainerRef.current;
    if (
      !container ||
      !hasMoreTemplates ||
      isFetchingNextPageTemplates ||
      isLoadingMoreRef.current
    )
      return;

    const { scrollHeight, clientHeight } = container;

    // 如果内容高度小于等于容器高度（不需要滚动），且有更多数据，自动加载
    if (scrollHeight <= clientHeight) {
      isLoadingMoreRef.current = true;
      loadMoreTemplates();
    }
  }, [hasMoreTemplates, isFetchingNextPageTemplates, loadMoreTemplates]);

  // 无限滚动加载更多收藏模板
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // 当加载完成时重置 isLoadingMoreRef
  useEffect(() => {
    if (!isFetchingNextPageTemplates) {
      isLoadingMoreRef.current = false;
    }
  }, [isFetchingNextPageTemplates]);

  // 使用 ResizeObserver 监听内容高度变化，当图片加载完成后自动检查是否需要加载更多
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasMoreTemplates || isFetchingNextPageTemplates) return;

    const resizeObserver = new ResizeObserver(() => {
      // 防抖处理，避免频繁触发
      if (isLoadingMoreRef.current) return;

      checkAndLoadMore();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [checkAndLoadMore, hasMoreTemplates, isFetchingNextPageTemplates]);

  // 切换模板收藏状态
  const handleToggleTemplateFavorite = async (
    templateId: string,
    isFavorite: boolean
  ) => {
    const currentTemplates =
      localFavoriteTemplates !== null
        ? localFavoriteTemplates
        : favoriteTemplates;
    const previousTemplates = currentTemplates;
    setLocalFavoriteTemplates(
      currentTemplates.filter((template) => template.avatarId !== templateId)
    );

    try {
      await toggleFavorite({
        itemId: templateId,
        isFavorite,
        type: RESOURCE_TYPE.PHOTO_AVATAR
      });
    } catch (error) {
      setLocalFavoriteTemplates(previousTemplates);
      throw error;
    }
  };

  // 切换 My Avatar 收藏状态
  const handleToggleMyAvatarFavorite = async (
    avatarId: string,
    isFavorite: boolean
  ) => {
    const currentAvatars = localMyAvatars !== null ? localMyAvatars : myAvatars;
    const previousAvatars = currentAvatars;
    setLocalMyAvatars(
      currentAvatars.filter((avatar) => avatar.aiavatarId !== avatarId)
    );

    try {
      await toggleFavorite({
        itemId: avatarId,
        isFavorite,
        type: RESOURCE_TYPE.AVATAR
      });
    } catch (error) {
      setLocalMyAvatars(previousAvatars);
      throw error;
    }
  };

  // Loading State
  const isLoading = isLoadingTemplates || isLoadingMyAvatars;
  if (isLoading && favoriteItems.length === 0) {
    return (
      <div className='flex-1 flex flex-col items-center justify-center text-white/40'>
        <div className='animate-spin rounded-full h-8 w-8 border-2 border-white/30 border-t-white/60 mb-3'></div>
        <p className='text-sm text-center'>Loading favorites...</p>
      </div>
    );
  }

  // Error State
  if (templatesError || myAvatarsError) {
    return (
      <div className='flex-1 flex flex-col items-center justify-center text-white/40'>
        <p className='text-sm text-center text-red-400'>
          Failed to load favorites
        </p>
        <p className='text-xs mt-1 text-center opacity-70'>
          {templatesError || myAvatarsError}
        </p>
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
        <p className='text-sm text-center'>No favorite avatars yet</p>
        <p className='text-xs mt-1 text-center opacity-70'>
          Click the star icon on any template to add it to favorites
        </p>
      </div>
    );
  }

  // 渲染单个收藏项目
  const renderFavoriteItem = (item: FavoriteItem) => {
    // 判断是否为模板：AigcPhotoAvatar4TemplateDTO 有 avatarId 字段
    const isTemplate = 'avatarId' in item && !('aiavatarId' in item);

    if (isTemplate) {
      const template = item as AigcPhotoAvatar4TemplateDTO;
      const templateId = template.avatarId;
      return (
        <PublicAvatarCard
          key={templateId}
          template={template}
          isFavorite={template.isFavorite === COMMON_INT_BOOLEAN.TRUE}
          onUse={() => onUseTemplate(template)}
          onToggleFavorite={() =>
            handleToggleTemplateFavorite(
              templateId,
              template.isFavorite === COMMON_INT_BOOLEAN.TRUE
            )
          }
        />
      );
    } else {
      const avatar = item as AiAvatarDTO;
      const avatarId = avatar.aiavatarId;
      return (
        <CustomAvatarCard
          key={avatarId}
          avatar={avatar}
          onUse={() => onUseMyAvatar(avatar)}
          onToggleFavorite={() =>
            handleToggleMyAvatarFavorite(
              avatarId,
              avatar.isFavorite === COMMON_INT_BOOLEAN.TRUE
            )
          }
          onShowDeleteConfirm={
            onShowDeleteConfirm ? () => onShowDeleteConfirm(avatar) : undefined
          }
        />
      );
    }
  };

  return (
    <div className='flex-1 flex flex-col overflow-hidden'>
      <div
        ref={scrollContainerRef}
        className='flex-1 overflow-y-auto pr-1'
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
          columnCount: 5,
          columnGap: '12px'
        }}
      >
        {favoriteItems.map(renderFavoriteItem)}
      </div>

      {/* Loading More Indicator - 单独一行 */}
      {isFetchingNextPageTemplates && favoriteItems.length > 0 && (
        <div className='flex justify-center py-4 flex-shrink-0'>
          <div className='animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white/60'></div>
        </div>
      )}
    </div>
  );
}
