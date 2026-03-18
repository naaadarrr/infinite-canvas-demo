'use client';

import { trpc } from '@/lib/trpc/client';
import { wrapMutation } from '@/lib/trpc/helper';
import type { TRPCMutationConfig } from '@/lib/trpc/type';

/**
 * 更新自定义头像音色 mutation hook
 */
export function useUpdateAvatarVoiceMutation(options?: TRPCMutationConfig) {
  return wrapMutation(
    trpc.mediaLibrary.aiAvatar.updateAvatarVoice.useMutation(options)
  );
}

/**
 * 删除自定义 AI 头像 mutation hook
 */
export function useDeleteCustomAvatarMutation(options?: TRPCMutationConfig) {
  return wrapMutation(
    trpc.mediaLibrary.aiAvatar.deleteCustomAvatar.useMutation(options)
  );
}
