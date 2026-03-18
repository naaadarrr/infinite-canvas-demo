'use client';

/**
 * Image Upscale 任务相关 Hooks
 *
 * 对应 Router: imageUpscale
 * - createTask: 创建图片放大任务
 * - queryTask: 查询图片放大任务详情
 */

import { trpc } from '@/lib/trpc/client';
import { wrapMutation } from '@/lib/trpc/helper';
import type { TRPCMutationConfig } from '@/lib/trpc/type';

/**
 * 创建图片放大任务
 *
 * @example
 * ```tsx
 * const mutation = useCreateImageUpscaleTaskMutation();
 *
 * const handleUpscale = async () => {
 *   try {
 *     const taskId = await mutation.mutateAsync({
 *       projectId: "board_task_123",
 *       inputImagePath: "s3://bucket/images/original.jpg",
 *       resolution: ImageUpscaleResolution.RES_2K,
 *       source: "board"
 *     });
 *     console.log("Task created:", taskId);
 *   } catch (error) {
 *     const { errorMessage } = extractErrorInfo(error);
 *     toast.error(errorMessage || "创建图片放大任务失败");
 *   }
 * };
 * ```
 */
export function useCreateImageUpscaleTaskMutation(
  options?: TRPCMutationConfig
) {
  return wrapMutation(trpc.imageUpscale.createTask.useMutation(options));
}

/**
 * 查询图片放大任务详情
 * 直接透传 tRPC hook，保持完整的类型推导
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useQueryImageUpscaleTaskQuery(
 *   { taskId: "task_123456" },
 *   { enabled: !!taskId }
 * );
 *
 * useEffect(() => {
 *   const result = extractQueryData(data);
 *   if (result?.status === TaskStatus.SUCCESS) {
 *     console.log("Output image:", result.outputImageUrl);
 *   }
 * }, [data]);
 * ```
 */
export const useQueryImageUpscaleTaskQuery =
  trpc.imageUpscale.queryTask.useQuery;
