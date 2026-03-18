'use client';

/**
 * Product Avatar 模板相关 Mutation Hooks
 *
 * 对应 Router:
 * - productAvatar.template: 模板相关操作
 * - common.favorite: 收藏相关操作
 */

import { trpc } from '@/lib/trpc/client';
import { wrapMutation } from '@/lib/trpc/helper';
import type { TRPCMutationConfig } from '@/lib/trpc/type';

/**
 * 删除自定义产品数字人模板
 *
 * @example
 * ```tsx
 * const mutation = useDeleteCustomMetaMutation();
 *
 * const handleDelete = async (avatarId: string) => {
 *   try {
 *     await mutation.mutateAsync({ avatarId });
 *     toast.success("Delete success");
 *   } catch (error) {
 *     const { errorMessage } = extractErrorInfo(error);
 *     toast.error(errorMessage || "Delete failed");
 *   }
 * };
 * ```
 */
export function useDeleteCustomMetaMutation(options?: TRPCMutationConfig) {
  return wrapMutation(
    trpc.productAvatar.template.deleteCustomMeta.useMutation(options)
  );
}

/**
 * 添加收藏
 *
 * @example
 * ```tsx
 * const mutation = useAddFavoriteMutation();
 *
 * const handleAddFavorite = async (resourceId: string, type: string) => {
 *   try {
 *     const result = await mutation.mutateAsync({ resourceId, type });
 *     toast.success("Favorite added successfully");
 *   } catch (error) {
 *     const { errorMessage } = extractErrorInfo(error);
 *     toast.error(errorMessage || "Failed to add favorite");
 *   }
 * };
 * ```
 */
export function useAddFavoriteMutation(options?: TRPCMutationConfig) {
  return wrapMutation(trpc.common.favorite.add.useMutation(options));
}

/**
 * 取消收藏
 *
 * @example
 * ```tsx
 * const mutation = useCancelFavoriteMutation();
 *
 * const handleCancelFavorite = async (resourceId: string, type: string) => {
 *   try {
 *     const result = await mutation.mutateAsync({ resourceId, type });
 *     toast.success("Favorite removed successfully");
 *   } catch (error) {
 *     const { errorMessage } = extractErrorInfo(error);
 *     toast.error(errorMessage || "Failed to remove favorite");
 *   }
 * };
 * ```
 */
export function useCancelFavoriteMutation(options?: TRPCMutationConfig) {
  return wrapMutation(trpc.common.favorite.cancel.useMutation(options));
}
