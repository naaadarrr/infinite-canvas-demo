'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Star } from 'lucide-react';
import { useQueryProductAvatarTemplate } from '../../../../../hooks/productAvatar/useQueryTemplate';
import {
  ProductAvatarMetaAvatarType,
  ProductAvatarMetaFrontDTO
} from '@/server/api/services/productAvatar/template/type';
import { COMMON_INT_BOOLEAN } from '@/server/api/services/_common/type';
import { ProductAvatarCard } from '../AvatarCard/ProductAvatarCard';
import { useTogglePhotoAvatarFavorite } from '../../../../../hooks/useTogglePhotoAvatarFavorite';
import { RESOURCE_TYPE } from '@/server/api/services/common/favorite/type';

interface MyProductAvatarsProps {
  onSelect: (avatar: ProductAvatarMetaFrontDTO) => void;
}

export function CustomAvatars({ onSelect }: MyProductAvatarsProps) {
  // 滚动容器引用
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 使用 hook 处理收藏切换
  const { toggleFavorite } = useTogglePhotoAvatarFavorite();

  // 使用 hook 获取用户自定义的产品头像数据
  const {
    templates: apiAvatars,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    loadMore,
    error
  } = useQueryProductAvatarTemplate({
    avatarType: ProductAvatarMetaAvatarType.CUSTOM_USER,
    pageSize: 50
  });

  // 本地状态管理 avatars（用于乐观更新）
  const [localAvatars, setLocalAvatars] = useState<
    ProductAvatarMetaFrontDTO[] | null
  >(null);

  // 同步 API 数据到本地状态
  useEffect(() => {
    if (apiAvatars.length > 0) {
      setLocalAvatars(apiAvatars);
    }
  }, [apiAvatars]);

  // 使用本地状态或 API 数据
  const avatars = useMemo(() => {
    return localAvatars !== null ? localAvatars : apiAvatars;
  }, [localAvatars, apiAvatars]);

  // 处理收藏切换（带乐观更新）
  const handleToggleFavorite = async (
    avatarId: string,
    isFavorite: boolean
  ) => {
    // 获取当前头像列表（优先使用本地状态，否则使用 API 数据）
    const currentAvatars = localAvatars !== null ? localAvatars : apiAvatars;

    // 乐观更新：先更新本地状态
    const previousAvatars = currentAvatars;
    const newAvatars = currentAvatars.map((avatar) => {
      if (avatar.avatarId === avatarId) {
        return {
          ...avatar,
          favorite: isFavorite
            ? COMMON_INT_BOOLEAN.FALSE
            : COMMON_INT_BOOLEAN.TRUE
        };
      }
      return avatar;
    });
    setLocalAvatars(newAvatars);

    try {
      // 调用 API
      await toggleFavorite({
        itemId: avatarId,
        isFavorite,
        type: RESOURCE_TYPE.PRODUCT_AVATAR
      });
    } catch (error) {
      // 失败时回滚到之前的状态
      setLocalAvatars(previousAvatars);
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
        <p className='text-sm text-center'>Loading your custom avatars...</p>
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
          Failed to load custom avatars
        </p>
        <p className='text-xs text-center opacity-70'>{error}</p>
      </div>
    );
  }

  // Empty State
  if (avatars?.length === 0) {
    return (
      <div className='flex h-full flex-col items-center justify-center text-white/40'>
        <Star
          size={48}
          className='mb-3 opacity-50'
        />
        <p className='text-sm text-center'>
          Your used avatar photos will appear here
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        ref={scrollContainerRef}
        className='grid gap-3'
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))'
        }}
      >
        {avatars.map((avatar) => (
          <ProductAvatarCard
            key={`my-${avatar.avatarId}`}
            template={avatar}
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
            Loading more custom avatars...
          </div>
        </div>
      )}
    </>
  );
}
