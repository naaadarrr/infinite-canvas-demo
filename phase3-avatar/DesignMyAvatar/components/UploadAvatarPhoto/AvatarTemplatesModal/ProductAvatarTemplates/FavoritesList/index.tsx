'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Star } from 'lucide-react';
import type { ProductAvatarMetaFrontDTO } from '@/server/api/services/productAvatar/template/type';
import { useQueryProductAvatarFavoriteTemplate } from '../../../../../hooks/productAvatar/useQueryFavoriteTemplate';
import { ProductAvatarCard } from '../AvatarCard/ProductAvatarCard';
import { useTogglePhotoAvatarFavorite } from '../../../../../hooks/useTogglePhotoAvatarFavorite';
import { RESOURCE_TYPE } from '@/server/api/services/common/favorite/type';

interface ProductFavoritesProps {
  onSelect: (template: ProductAvatarMetaFrontDTO) => void;
}

export function FavoritesList({ onSelect }: ProductFavoritesProps) {
  // 滚动容器引用
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 使用 hook 处理收藏切换
  const { toggleFavorite } = useTogglePhotoAvatarFavorite();

  // 使用 hook 获取收藏的模板数据
  const {
    templates: apiTemplates,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    loadMore,
    error
  } = useQueryProductAvatarFavoriteTemplate({
    pageSize: 20
  });

  // 本地状态管理 templates（用于乐观更新）
  const [localTemplates, setLocalTemplates] = useState<
    ProductAvatarMetaFrontDTO[] | null
  >(null);

  // 同步 API 数据到本地状态
  useEffect(() => {
    if (apiTemplates.length > 0) {
      setLocalTemplates(apiTemplates);
    }
  }, [apiTemplates]);

  // 使用本地状态或 API 数据
  const templates = useMemo(() => {
    return localTemplates !== null ? localTemplates : apiTemplates;
  }, [localTemplates, apiTemplates]);

  // 处理收藏切换（带乐观更新）
  const handleToggleFavorite = async (
    templateId: string,
    isFavorite: boolean
  ) => {
    // 获取当前模板列表（优先使用本地状态，否则使用 API 数据）
    const currentTemplates =
      localTemplates !== null ? localTemplates : apiTemplates;

    // 乐观更新：先更新本地状态（从收藏列表中移除）
    const previousTemplates = currentTemplates;
    const newTemplates = currentTemplates.filter(
      (template) => template.avatarId !== templateId
    );
    setLocalTemplates(newTemplates);

    try {
      // 调用 API
      await toggleFavorite({
        itemId: templateId,
        isFavorite,
        type: RESOURCE_TYPE.PRODUCT_AVATAR
      });
    } catch (error) {
      // 失败时回滚到之前的状态
      setLocalTemplates(previousTemplates);
      throw error;
    }
  };

  // 无限滚动逻辑
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasNextPage || isFetchingNextPage) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        loadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, loadMore]);

  // Loading State
  if (isLoading) {
    return (
      <div className='flex h-full flex-col items-center justify-center text-white/40'>
        <div className='mb-3 opacity-50'>
          <div className='animate-spin rounded-full h-8 w-8 border border-white/30 border-t-white/60'></div>
        </div>
        <p className='text-sm text-center'>Loading favorite templates...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className='flex h-full flex-col items-center justify-center text-red-400'>
        <Star
          size={48}
          className='mb-3 opacity-50'
        />
        <p className='text-sm text-center mb-2'>
          Failed to load favorite templates
        </p>
        <p className='text-xs text-center opacity-70'>{error}</p>
      </div>
    );
  }

  // Empty State
  if (templates?.length === 0) {
    return (
      <div className='flex h-full flex-col items-center justify-center text-white/40'>
        <Star
          size={48}
          className='mb-3 opacity-50'
        />
        <p className='text-sm text-center'>
          No favorite product avatar templates yet
        </p>
        <p className='text-xs mt-1 text-center opacity-70'>
          Click the star icon on any template to add it to favorites
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        ref={scrollContainerRef}
        className='grid grid-cols-7 gap-3'
      >
        {templates.map((template) => (
          <ProductAvatarCard
            key={template.avatarId}
            template={template}
            onSelect={onSelect}
            onToggleFavorite={handleToggleFavorite}
          />
        ))}
      </div>

      {/* Loading indicator for infinite scroll */}
      {isFetchingNextPage && (
        <div className='flex justify-center py-6'>
          <div className='flex items-center gap-2 text-white/60 text-sm'>
            <div className='animate-spin rounded-full h-4 w-4 border border-white/30 border-t-white/60'></div>
            Loading more favorite templates...
          </div>
        </div>
      )}
    </>
  );
}
