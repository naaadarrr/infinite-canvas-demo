'use client';

import { trpc } from '@/lib/trpc/client';
import { wrapMutation } from '@/lib/trpc/helper';
import type { TRPCMutationConfig } from '@/lib/trpc/type';

/**
 * 创建 TTS 试听任务
 *
 * Router: tts.createTtsTask
 */
export function useCreateTtsTaskMutation(options?: TRPCMutationConfig) {
  return wrapMutation(trpc.tts.createTtsTask.useMutation(options));
}
