'use client';

import { useState, useEffect, useMemo } from 'react';
import { User } from 'lucide-react';
import { useQueryCustomAvatar4Template } from '../../../../../hooks/avatar4/useQueryCustomTemplate';
import type { AiAvatarDTO } from '@/server/api/services/mediaLibrary/aiAvatar/type';
import { PublicAvatarCard } from '../AvatarCard/PublicAvatarCard';
import { useTogglePhotoAvatarFavorite } from '../../../../../hooks/useTogglePhotoAvatarFavorite';
import { RESOURCE_TYPE } from '@/server/api/services/common/favorite/type';

interface CustomAvatarsProps {
  onSelectCustomAvatar: (avatar: AiAvatarDTO) => void;
}

export function CustomAvatars({ onSelectCustomAvatar }: CustomAvatarsProps) {
  // 使用 hook 处理收藏切换
  const { toggleFavorite } = useTogglePhotoAvatarFavorite();

  // 从 API 获取自定义头像数据
  const {
    list: apiAvatars,
    isLoading,
    error
  } = useQueryCustomAvatar4Template();

  // 本地状态管理 avatars（用于乐观更新）
  const [localAvatars, setLocalAvatars] = useState<AiAvatarDTO[] | null>(null);

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
  const handleToggleFavorite = async (itemId: string, isFavorite: boolean) => {
    // 获取当前头像列表（优先使用本地状态，否则使用 API 数据）
    const currentAvatars = localAvatars !== null ? localAvatars : apiAvatars;

    // 乐观更新：先更新本地状态
    const previousAvatars = currentAvatars;
    const newAvatars = currentAvatars.map((avatar) => {
      if (avatar.aiavatarId === itemId) {
        return {
          ...avatar,
          isFavorite: isFavorite ? 0 : 1
        };
      }
      return avatar;
    });
    setLocalAvatars(newAvatars);

    try {
      // 调用 API
      await toggleFavorite({
        itemId,
        isFavorite,
        type: RESOURCE_TYPE.PHOTO_AVATAR
      });
      // 成功后，清除本地状态，使用最新的 API 数据
    } catch (error) {
      // 失败时回滚到之前的状态
      setLocalAvatars(previousAvatars);
      throw error;
    }
  };
  // Loading State
  if (isLoading) {
    return (
      <div className='flex h-full flex-col items-center justify-center text-white/40'>
        <div className='mb-3 opacity-50'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-white'></div>
        </div>
        <p className='text-sm text-center'>Loading your custom avatars...</p>
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
          Failed to load custom avatars
        </p>
        <p className='text-xs text-center opacity-70'>{error}</p>
      </div>
    );
  }

  // Empty State
  if (avatars.length === 0) {
    return (
      <div className='flex h-full flex-col items-center justify-center text-white/40'>
        <User
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
    <div
      style={{
        columnCount: 7,
        columnGap: '12px'
      }}
    >
      {avatars.map((avatar) => {
        return (
          <PublicAvatarCard
            key={`my-${avatar.aiavatarId}`}
            avatar={avatar}
            onSelect={(avatar) => onSelectCustomAvatar(avatar as AiAvatarDTO)}
            onToggleFavorite={handleToggleFavorite}
            defaultAspectRatio={9 / 16}
          />
        );
      })}
    </div>
  );
}
