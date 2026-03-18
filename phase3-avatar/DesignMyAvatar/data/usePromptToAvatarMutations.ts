'use client';

import { trpc } from '@/lib/trpc/client';
import { wrapMutation } from '@/lib/trpc/helper';
import { type TRPCMutationConfig } from '@/lib/trpc/type';

/**
 * 创建提示词生成数字人任务 mutation hook
 */
export function useCreatePromptToAvatarTaskMutation(
  options?: TRPCMutationConfig
) {
  return wrapMutation(
    trpc.promptToAvatar.createPromptToAvatarTask.useMutation(options)
  );
}
