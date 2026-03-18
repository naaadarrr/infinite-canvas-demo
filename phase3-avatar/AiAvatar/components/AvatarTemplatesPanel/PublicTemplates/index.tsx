'use client';

import { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { useRecoilValue } from 'recoil-next';
import { avatarTemplateCollectionIdState } from '../../../store/templateAtoms';
import { useQueryAvatar4Template } from '../../../hooks/avatar4Template/useQueryTemplate';
import type { AigcPhotoAvatar4TemplateDTO } from '@/server/api/services/avatar4/type';
import { COMMON_INT_BOOLEAN } from '@/server/api/services/_common/type';
import { RESOURCE_TYPE } from '@/server/api/services/common/favorite/type';
import { useTogglePhotoAvatarFavorite } from '../../../hooks/useTogglePhotoAvatarFavorite';
import { PublicAvatarCard } from '../AvatarCard/PublicAvatarCard';

interface PublicTemplatesProps {
  onUseTemplate: (template: AigcPhotoAvatar4TemplateDTO) => void;
}

export function PublicTemplates({ onUseTemplate }: PublicTemplatesProps) {
  const categoryId = useRecoilValue(avatarTemplateCollectionIdState);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isLoadingMoreRef = useRef(false);
  const { toggleFavorite } = useTogglePhotoAvatarFavorite();

  const categoriesParam = useMemo(() => {
    if (categoryId === 'all' || categoryId === 'my-avatar') {
      return undefined;
    }
    return categoryId;
  }, [categoryId]);

  const { templates, isLoading, isFetchingNextPage, error, hasMore, loadMore } =
    useQueryAvatar4Template({
      categories: categoriesParam
    });

  const [localTemplates, setLocalTemplates] = useState<
    AigcPhotoAvatar4TemplateDTO[] | null
  >(null);

  useEffect(() => {
    if (templates.length > 0) {
      setLocalTemplates(templates);
    }
  }, [templates]);

  const displayTemplates = useMemo(() => {
    return localTemplates ?? templates;
  }, [localTemplates, templates]);

  useEffect(() => {
    isLoadingMoreRef.current = false;
  }, [categoryId, categoriesParam]);

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
    const threshold = 200;

    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      isLoadingMoreRef.current = true;
      loadMore();
    }
  }, [hasMore, isFetchingNextPage, loadMore]);

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

  const handleToggleFavorite = async (
    templateId: string,
    isFavorite: boolean
  ) => {
    const currentTemplates =
      localTemplates !== null ? localTemplates : templates;
    const previousTemplates = currentTemplates;
    const newTemplates = currentTemplates.map((template) => {
      if (template.avatarId === templateId) {
        return {
          ...template,
          isFavorite: isFavorite
            ? COMMON_INT_BOOLEAN.FALSE
            : COMMON_INT_BOOLEAN.TRUE
        };
      }
      return template;
    });
    setLocalTemplates(newTemplates);

    try {
      await toggleFavorite({
        itemId: templateId,
        isFavorite,
        type: RESOURCE_TYPE.PHOTO_AVATAR
      });
    } catch (error) {
      setLocalTemplates(previousTemplates);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className='flex-1 flex flex-col items-center justify-center text-white/40'>
        <div className='animate-spin rounded-full h-8 w-8 border-2 border-white/30 border-t-white/60 mb-3'></div>
        <p className='text-sm text-center'>Loading templates...</p>
      </div>
    );
  }

  if (error && displayTemplates.length === 0 && !isLoading) {
    return (
      <div className='flex-1 flex flex-col items-center justify-center text-white/40'>
        <p className='text-sm text-center text-red-400'>
          Failed to load templates
        </p>
        <p className='text-xs mt-1 text-center opacity-70'>{error}</p>
      </div>
    );
  }

  if (displayTemplates.length === 0 && !isLoading && !error) {
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
        {displayTemplates.map((template) => (
          <PublicAvatarCard
            key={template.avatarId}
            template={template}
            isFavorite={template.isFavorite === COMMON_INT_BOOLEAN.TRUE}
            onUse={() => onUseTemplate(template)}
            onToggleFavorite={() =>
              handleToggleFavorite(
                template.avatarId,
                template.isFavorite === COMMON_INT_BOOLEAN.TRUE
              )
            }
          />
        ))}
      </div>

      {isFetchingNextPage && displayTemplates.length > 0 && (
        <div className='flex justify-center py-4 flex-shrink-0'>
          <div className='animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white/60'></div>
        </div>
      )}
    </div>
  );
}
