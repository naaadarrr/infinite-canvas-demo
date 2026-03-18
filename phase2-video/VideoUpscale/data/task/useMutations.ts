'use client';

/**
 * Video Upscale 任务相关 Hooks
 *
 * 对应 Router: videoUpscale
 * - createTask: 创建视频放大任务
 * - queryTask: 查询视频放大任务详情
 */

import { trpc } from '@/lib/trpc/client';
import { wrapMutation } from '@/lib/trpc/helper';
import type { TRPCMutationConfig } from '@/lib/trpc/type';

/**
 * 创建视频放大任务
 *
 * @example
 * ```tsx
 * const mutation = useCreateVideoUpscaleTaskMutation();
 *
 * const handleUpscale = async () => {
 *   try {
 *     const taskId = await mutation.mutateAsync({
 *       projectId: "board_task_123",
 *       inputVideoPath: "s3://bucket/videos/original.mp4",
 *       resolution: VideoUpscaleResolution.RES_2K,
 *       source: "board"
 *     });
 *     console.log("Task created:", taskId);
 *   } catch (error) {
 *     const { errorMessage } = extractErrorInfo(error);
 *     toast.error(errorMessage || "创建视频放大任务失败");
 *   }
 * };
 * ```
 */
export function useCreateVideoUpscaleTaskMutation(
  options?: TRPCMutationConfig
) {
  return wrapMutation(trpc.videoUpscale.createTask.useMutation(options));
}

/**
 * 查询视频放大任务详情
 * 直接透传 tRPC hook，保持完整的类型推导
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useQueryVideoUpscaleTaskQuery(
 *   { taskId: "task_123456" },
 *   { enabled: !!taskId }
 * );
 *
 * useEffect(() => {
 *   const result = extractQueryData(data);
 *   if (result?.status === TaskStatus.SUCCESS) {
 *     console.log("Output video:", result.outputVideoUrl);
 *   }
 * }, [data]);
 * ```
 */
export const useQueryVideoUpscaleTaskQuery =
  trpc.videoUpscale.queryTask.useQuery;
