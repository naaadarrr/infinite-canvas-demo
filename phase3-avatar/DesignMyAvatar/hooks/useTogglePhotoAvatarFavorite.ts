'use client';

import {
  useAddFavoriteMutation,
  useCancelFavoriteMutation
} from '../data/useFavoriteMutation';
import { toast } from '@/hooks/useToast';
import { extractErrorInfo } from '@/lib/trpc/helper';
import { RESOURCE_TYPE } from '@/server/api/services/common/favorite/type';

export interface TogglePhotoAvatarFavoriteParams {
  itemId: string;
  isFavorite: boolean;
  type: RESOURCE_TYPE;
}

/**
 * 切换照片头像收藏状态的 Hook
 * @returns toggleFavorite 函数，用于切换收藏状态
 */
export function useTogglePhotoAvatarFavorite() {
  const addFavoriteMutation = useAddFavoriteMutation();
  const cancelFavoriteMutation = useCancelFavoriteMutation();

  const toggleFavorite = async (params: TogglePhotoAvatarFavoriteParams) => {
    const { itemId, isFavorite, type } = params;
    try {
      if (isFavorite) {
        // 取消收藏
        await cancelFavoriteMutation.mutateAsync({
          resourceId: itemId,
          type
        });
        toast.success('Removed from favorites');
      } else {
        // 添加收藏
        await addFavoriteMutation.mutateAsync({
          resourceId: itemId,
          type
        });
        toast.success('Added to favorites');
      }
    } catch (error) {
      const { errorMessage } = extractErrorInfo(error);
      toast.error(errorMessage || 'Failed to update favorite status');
      console.error(
        '[useTogglePhotoAvatarFavorite] Failed to toggle favorite:',
        error
      );
    }
  };

  return { toggleFavorite };
}
