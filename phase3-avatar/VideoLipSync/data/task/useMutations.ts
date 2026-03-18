'use client';

/**
 * VideoLipSync 任务相关 Mutation Hooks
 *
 * 对应 Router: avatarVideoCreation
 * - createIndependentAiAvatarTask: 创建独立 AI Avatar 任务（VideoLipSync 模式）
 */

import { trpc } from '@/lib/trpc/client';
import { wrapMutation } from '@/lib/trpc/helper';
import type { TRPCMutationConfig } from '@/lib/trpc/type';

/**
 * 创建独立 AI Avatar 任务（VideoLipSync 模式）
 *
 * @param options - tRPC mutation 配置选项
 * @returns mutation hook，返回 TaskPair 类型数据
 *
 * @example
 * ```tsx
 * const mutation = useCreateIndependentAiAvatarTaskMutation();
 *
 * const handleCreateTask = async () => {
 *   try {
 *     const result = await mutation.mutateAsync({
 *       boardTaskId: "board_task_123",
 *       aiavatarId: "avatar_123",
 *       audioFileSource: AudioInputType.TEXT_TO_AUDIO,
 *       fileName: "My Video",
 *       resolution: VideoResolution.RESOLUTION_1080P,
 *       mode: AvatarVideoCreationMode.NORMAL,
 *       ttsText: "Hello world",
 *       voiceoverId: "voice_123",
 *       voiceSpeed: 1.0
 *     });
 *     console.log("Task created:", result);
 *   } catch (error) {
 *     const { errorCode, errorMessage } = extractErrorInfo(error);
 *     toast.error(errorMessage || "创建任务失败");
 *   }
 * };
 * ```
 */
export function useCreateIndependentAiAvatarTaskMutation(
  options?: TRPCMutationConfig
) {
  return wrapMutation(
    trpc.avatarVideoCreation.createIndependentAiAvatarTask.useMutation(options)
  );
}
