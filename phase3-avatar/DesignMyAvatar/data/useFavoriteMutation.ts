'use client';

import { trpc } from '@/lib/trpc/client';
import { wrapMutation } from '@/lib/trpc/helper';
import { type TRPCMutationConfig } from '@/lib/trpc/type';

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
