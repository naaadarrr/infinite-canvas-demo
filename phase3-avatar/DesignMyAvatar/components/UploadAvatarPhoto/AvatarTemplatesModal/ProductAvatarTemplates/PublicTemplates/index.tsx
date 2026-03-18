'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import {
  ProductAvatarMetaAvatarType,
  type ProductAvatarMetaFrontDTO
} from '@/server/api/services/productAvatar/template/type';
import {
  SortType,
  COMMON_INT_BOOLEAN
} from '@/server/api/services/_common/type';
import { useQueryProductAvatarTemplate } from '../../../../../hooks/productAvatar/useQueryTemplate';
import { ProductAvatarCard } from '../AvatarCard/ProductAvatarCard';
import { useTogglePhotoAvatarFavorite } from '../../../../../hooks/useTogglePhotoAvatarFavorite';
import { RESOURCE_TYPE } from '@/server/api/services/common/favorite/type';

interface ProductTemplatesProps {
  categoryIds?: string;
  ethnicityIds?: string;
  gender?: string[];
  sorting?: 'popularity' | 'newest';
  onSelect: (template: ProductAvatarMetaFrontDTO) => void;
}

export function ProductTemplates({
  categoryIds,
  ethnicityIds,
  gender,
  sorting = 'popularity',
  onSelect
}: ProductTemplatesProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 使用 hook 处理收藏切换
  const { toggleFavorite } = useTogglePhotoAvatarFavorite();

  // 使用 hook 获取模板数据（只传递 ethnicityIds 进行服务端筛选）
  const {
    templates: apiTemplates,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    loadMore,
    error
  } = useQueryProductAvatarTemplate({
    avatarType: ProductAvatarMetaAvatarType.CUSTOM_NONE,
    categoryIds,
    ethnicityIds,
    sortType: sorting === 'popularity' ? SortType.DESC : SortType.ASC, // popularity 降序，newest 升序
    pageSize: 50
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

  // 对获取的模板数据进行客户端 gender 筛选
  const rawTemplates = useMemo(() => {
    return localTemplates !== null ? localTemplates : apiTemplates;
  }, [localTemplates, apiTemplates]);

  const templates = useMemo(() => {
    if (!gender?.length) return rawTemplates; // 如果没有性别筛选条件，返回所有数据
    // 根据 gender 字段进行客户端筛选
    return rawTemplates.filter((template) =>
      gender.some((g) => g === template.gender)
    );
  }, [rawTemplates, gender]);

  // 处理收藏切换（带乐观更新）
  const handleToggleFavorite = async (
    templateId: string,
    isFavorite: boolean
  ) => {
    // 获取当前模板列表（优先使用本地状态，否则使用 API 数据）
    const currentTemplates =
      localTemplates !== null ? localTemplates : apiTemplates;
    console.log('isFavorite', isFavorite);
    // 乐观更新：先更新本地状态
    const previousTemplates = currentTemplates;
    const newTemplates = currentTemplates.map((template) => {
      if (template.avatarId === templateId) {
        return {
          ...template,
          favorite: isFavorite
            ? COMMON_INT_BOOLEAN.FALSE
            : COMMON_INT_BOOLEAN.TRUE
        };
      }
      return template;
    });
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
      // 当距离底部 100px 时开始加载
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
        <p className='text-sm text-center'>
          Loading product avatar templates...
        </p>
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
        <p className='text-sm text-center mb-2'>Failed to load templates</p>
        <p className='text-xs text-center opacity-70'>{error}</p>
      </div>
    );
  }

  // Empty State
  if (templates?.length === 0) {
    return (
      <div className='flex h-full flex-col items-center justify-center text-white/40'>
        <p className='text-sm'>No templates found</p>
      </div>
    );
  }

  return (
    <>
      <div
        ref={scrollContainerRef}
        className='h-full overflow-y-auto p-4'
      >
        <div className='grid grid-cols-7 gap-3'>
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
              Loading more product avatar templates...
            </div>
          </div>
        )}
      </div>
    </>
  );
}
