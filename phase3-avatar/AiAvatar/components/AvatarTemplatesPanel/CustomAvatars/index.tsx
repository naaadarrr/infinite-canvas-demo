'use client';

import { useEffect, useMemo, useState } from 'react';
import { User } from 'lucide-react';
import { useQueryCustomAvatar4Template } from '../../../hooks/avatar4Template/useQueryCustomTemplate';
import type { AiAvatarDTO } from '@/server/api/services/mediaLibrary/aiAvatar/type';
import { COMMON_INT_BOOLEAN } from '@/server/api/services/_common/type';
import { RESOURCE_TYPE } from '@/server/api/services/common/favorite/type';
import { useTogglePhotoAvatarFavorite } from '../../../hooks/useTogglePhotoAvatarFavorite';
import { useDeleteCustomAvatarMutation } from '../../../data/mediaLibrary/useMutation';
import { toast } from '@/hooks/useToast';
import { CustomAvatarCard } from '../AvatarCard/CustomAvatarCard';

interface CustomAvatarsProps {
  onUseMyAvatar: (avatar: AiAvatarDTO) => void;
}

export function CustomAvatars({ onUseMyAvatar }: CustomAvatarsProps) {
  // 从 API 获取自定义头像数据
  const {
    list: avatars,
    isLoading,
    error,
    refetch: refetchCustomAvatars
  } = useQueryCustomAvatar4Template();
  const { toggleFavorite } = useTogglePhotoAvatarFavorite();
  const deleteCustomAvatarMutation = useDeleteCustomAvatarMutation();

  const [localAvatars, setLocalAvatars] = useState<AiAvatarDTO[] | null>(null);

  useEffect(() => {
    if (avatars.length > 0) {
      setLocalAvatars(avatars);
    }
  }, [avatars]);

  const displayAvatars = useMemo(() => {
    return localAvatars ?? avatars;
  }, [localAvatars, avatars]);

  // 切换收藏状态（带乐观更新）
  const handleToggleFavorite = async (
    avatarId: string,
    isFavorite: boolean
  ) => {
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
      await toggleFavorite({
        itemId: avatarId,
        isFavorite,
        type: RESOURCE_TYPE.AVATAR
      });
    } catch (error) {
      setLocalAvatars(previousAvatars);
      throw error;
    }
  };

  // 删除头像
  const handleDeleteAvatar = async (avatar: AiAvatarDTO) => {
    try {
      await deleteCustomAvatarMutation.mutateAsync({
        aiavatarId: avatar.aiavatarUniqueId
      });
      toast.success('Delete success');
      await refetchCustomAvatars();
    } catch (error) {
      console.error('Delete avatar failed:', error);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className='flex-1 flex flex-col items-center justify-center text-white/40'>
        <div className='animate-spin rounded-full h-8 w-8 border-2 border-white/30 border-t-white/60 mb-3'></div>
        <p className='text-sm text-center'>Loading avatars...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className='flex-1 flex flex-col items-center justify-center text-white/40'>
        <p className='text-sm text-center text-red-400'>
          Failed to load avatars
        </p>
        <p className='text-xs mt-1 text-center opacity-70'>{error}</p>
      </div>
    );
  }

  // Empty State
  if (displayAvatars.length === 0) {
    return (
      <div className='flex-1 flex flex-col items-center justify-center text-white/40'>
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
      className='flex-1 overflow-y-auto pr-1'
      style={{
        columnCount: 5,
        columnGap: '12px'
      }}
    >
      {displayAvatars.map((avatar) => {
        const avatarId = avatar.aiavatarId;
        return (
          <CustomAvatarCard
            key={avatarId}
            avatar={avatar}
            onUse={() => onUseMyAvatar(avatar)}
            onToggleFavorite={() =>
              handleToggleFavorite(
                avatarId,
                avatar.isFavorite === COMMON_INT_BOOLEAN.TRUE
              )
            }
            onShowDeleteConfirm={handleDeleteAvatar}
          />
        );
      })}
    </div>
  );
}
