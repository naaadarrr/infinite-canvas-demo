'use client';

/**
 * Avatar4 / AiAvatar 相关 Mutation Hooks
 *
 * 对应 Router: mediaLibrary.aiAvatar
 * - createPhotoAvatar: 添加照片 AI 头像（入库 My Avatar）
 */

import { trpc } from '@/lib/trpc/client';
import { wrapMutation } from '@/lib/trpc/helper';
import type { TRPCMutationConfig } from '@/lib/trpc/type';

export function useCreatePhotoAiAvatarMutation(options?: TRPCMutationConfig) {
  return wrapMutation(
    trpc.mediaLibrary.aiAvatar.createPhotoAvatar.useMutation(options)
  );
}

/**
 * 添加收藏 mutation hook
 */
export function useAddFavoriteMutation(options?: TRPCMutationConfig) {
  return wrapMutation(trpc.common.favorite.add.useMutation(options));
}

/**
 * 取消收藏 mutation hook
 */
export function useCancelFavoriteMutation(options?: TRPCMutationConfig) {
  return wrapMutation(trpc.common.favorite.cancel.useMutation(options));
}
