'use client';

/**
 * AI 视频任务相关 Mutations
 * 对应 Router: aiVideo.submitAiVideoTask
 */

import { trpc } from '@/lib/trpc/client';
import { wrapMutation } from '@/lib/trpc/helper';
import type { TRPCMutationConfig } from '@/lib/trpc/type';

/**
 * 提交 AI 视频生成任务
 *
 * @param options - Mutation 配置选项
 * @returns 包装后的 mutation，mutateAsync 返回解包后的 data
 */
export function useSubmitAiVideoTaskMutation(options?: TRPCMutationConfig) {
  return wrapMutation(trpc.aiVideo.submitAiVideoTask.useMutation(options));
}
