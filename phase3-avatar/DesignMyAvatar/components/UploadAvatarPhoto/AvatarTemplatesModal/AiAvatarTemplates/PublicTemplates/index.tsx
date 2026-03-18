'use client';

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { User, Loader2 } from 'lucide-react';
import { useQueryAvatar4Template } from '../../../../../hooks/avatar4/useQueryTemplate';
import { AigcPhotoAvatar4TemplateDTO } from '@/server/api/services/avatar4/type';
import { PublicAvatarCard } from '../AvatarCard/PublicAvatarCard';
import { useTogglePhotoAvatarFavorite } from '../../../../../hooks/useTogglePhotoAvatarFavorite';
import { RESOURCE_TYPE } from '@/server/api/services/common/favorite/type';

interface PublicTemplatesProps {
  categoryId: string;
  onSelectTemplate: (template: AigcPhotoAvatar4TemplateDTO) => void;
}

export function PublicTemplates({
  categoryId,
  onSelectTemplate
}: PublicTemplatesProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 使用 hook 处理收藏切换
  const { toggleFavorite } = useTogglePhotoAvatarFavorite();

  // 在组件内部获取模板数据
  const {
    templates: apiTemplates,
    isLoading,
    isFetchingNextPage,
    error,
    hasMore,
    loadMore
  } = useQueryAvatar4Template({
    categories:
      categoryId !== 'favorites' &&
      categoryId !== 'my-avatar' &&
      categoryId !== 'all'
        ? categoryId
        : undefined,
    pageSize: 50
  });

  // 本地状态管理 templates（用于乐观更新）
  const [localTemplates, setLocalTemplates] = useState<
    AigcPhotoAvatar4TemplateDTO[] | null
  >(null);

  // 同步 API 数据到本地状态（仅在非乐观更新状态下同步）
  useEffect(() => {
    if (apiTemplates.length > 0) {
      setLocalTemplates(apiTemplates);
    }
  }, [apiTemplates]);

  // 使用本地状态或 API 数据
  const templates = useMemo(() => {
    return localTemplates !== null ? localTemplates : apiTemplates;
  }, [localTemplates, apiTemplates]);

  // 滚动到底部时加载更多
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasMore || isFetchingNextPage) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const threshold = 100; // 距离底部 100px 时触发加载

    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      loadMore();
    }
  }, [hasMore, isFetchingNextPage, loadMore]);

  // 添加滚动事件监听
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // 处理收藏切换（带乐观更新）
  const handleToggleFavorite = async (itemId: string, isFavorite: boolean) => {
    // 获取当前模板列表（优先使用本地状态，否则使用 API 数据）
    const currentTemplates =
      localTemplates !== null ? localTemplates : apiTemplates;

    // 乐观更新：先更新本地状态
    const previousTemplates = currentTemplates;
    const newTemplates = currentTemplates.map((template) => {
      if (template.avatarId === itemId) {
        return {
          ...template,
          isFavorite: isFavorite ? 0 : 1
        };
      }
      return template;
    });
    setLocalTemplates(newTemplates);

    try {
      // 调用 API
      await toggleFavorite({
        itemId,
        isFavorite,
        type: RESOURCE_TYPE.PHOTO_AVATAR
      });
      // 成功后，清除本地状态和乐观更新标志，使用最新的 API 数据
    } catch (error) {
      // 失败时回滚到之前的状态
      setLocalTemplates(previousTemplates);
      throw error;
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className='flex h-full flex-col items-center justify-center text-white/40'>
        <div className='mb-3 opacity-50'>
          <div className='animate-spin rounded-full h-8 w-8 border border-white/30 border-t-white/60'></div>
        </div>
        <p className='text-sm text-center'>Loading avatar templates...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className='flex h-full flex-col items-center justify-center text-red-400'>
        <User
          size={48}
          className='mb-3 opacity-50'
        />
        <p className='text-sm text-center mb-2'>
          Failed to load avatar templates
        </p>
        <p className='text-xs text-center opacity-70'>{error}</p>
      </div>
    );
  }

  // Empty State
  if (templates.length === 0) {
    return (
      <div className='flex h-full flex-col items-center justify-center text-white/40'>
        <p className='text-sm'>No avatars found</p>
      </div>
    );
  }

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
        {templates.map((template) => {
          return (
            <PublicAvatarCard
              key={template.avatarId}
              avatar={template}
              onSelect={(avatar) =>
                onSelectTemplate(avatar as AigcPhotoAvatar4TemplateDTO)
              }
              onToggleFavorite={handleToggleFavorite}
              defaultAspectRatio={9 / 16}
            />
          );
        })}
      </div>

      {/* 加载状态区域 - 独立于多列布局 */}
      <div className='mt-4'>
        {/* 加载更多指示器 */}
        {isFetchingNextPage && templates.length > 0 && (
          <div className='flex items-center justify-center py-4'>
            <Loader2 className='h-5 w-5 animate-spin text-white/60' />
            <span className='ml-2 text-sm text-white/60'>
              Loading more templates...
            </span>
          </div>
        )}

        {/* 没有更多数据提示 */}
        {!hasMore && templates.length > 0 && !isFetchingNextPage && (
          <div className='flex items-center justify-center py-4'>
            <span className='text-xs text-white/40'>
              No more templates to load
            </span>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className='flex items-center justify-center py-4'>
            <span className='text-xs text-red-400'>
              Failed to load templates: {error}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
