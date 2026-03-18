'use client';

/**
 * AI Avatar 任务相关 Mutation Hooks
 *
 * 对应 Router: avatar4
 * - createPhotoAvatar4Task: 创建照片头像视频任务
 */

import { trpc } from '@/lib/trpc/client';
import { wrapMutation } from '@/lib/trpc/helper';
import type { TRPCMutationConfig } from '@/lib/trpc/type';

/**
 * 创建照片头像视频任务
 *
 * @param options - tRPC mutation 配置选项
 * @returns mutation hook，返回 TaskPair 类型数据
 *
 * @example
 * ```tsx
 * const mutation = useCreatePhotoAvatar4VideoTaskMutation();
 *
 * const handleCreateTask = async () => {
 *   try {
 *     const result = await mutation.mutateAsync({
 *       aiavatarId: "avatar_123",
 *       avatarType: PhotoAvatarType.PHOTO,
 *       audioFileSource: AudioInputType.TEXT_TO_AUDIO,
 *       fileName: "My Video",
 *       resolution: VideoResolution.HD,
 *       includeWatermark: ExportedVideoType.WITH_WATERMARK,
 *       ttsText: "Hello world",
 *       voiceoverId: "voice_123",
 *       boardTaskId: "board_task_456"
 *     });
 *     console.log("Task created:", result);
 *   } catch (error) {
 *     const { errorCode, errorMessage } = extractErrorInfo(error);
 *     toast.error(errorMessage || "创建任务失败");
 *   }
 * };
 * ```
 */
export function useCreatePhotoAvatar4VideoTaskMutation(
  options?: TRPCMutationConfig
) {
  return wrapMutation(trpc.avatar4.createPhotoAvatar4Task.useMutation(options));
}
