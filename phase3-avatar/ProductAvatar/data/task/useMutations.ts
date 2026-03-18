'use client';

/**
 * Product Avatar 任务相关 Mutation Hooks
 *
 * 对应 Router: productAvatar.task
 * - createPromptReplaceProductAuto: 创建图像替换任务（Auto Mode）
 * - createPromptReplaceProductManual: 创建图像替换任务（Manual Mode）
 * - createRemoveBackground: 创建移除背景任务
 * - createImageCharacterSwap: 创建图片角色替换任务
 * - createVideoRegenerate: 创建图像到视频自动保存数字人任务
 * - deleteSimpleProcess: 删除组合步骤任务
 */

import { trpc } from '@/lib/trpc/client';
import { wrapMutation } from '@/lib/trpc/helper';
import type { TRPCMutationConfig } from '@/lib/trpc/type';

/**
 * 创建图像替换任务（Auto Mode）
 * 自动模式：系统自动识别产品位置进行替换
 */
export function useCreatePromptReplaceAutoMutation(
  options?: TRPCMutationConfig
) {
  return wrapMutation(
    trpc.productAvatar.task.createPromptReplaceProductAuto.useMutation(options)
  );
}

/**
 * 创建图像替换任务（Manual Mode）
 * 手动模式：用户手动指定产品位置进行替换
 */
export function useCreatePromptReplaceManualMutation(
  options?: TRPCMutationConfig
) {
  return wrapMutation(
    trpc.productAvatar.task.createPromptReplaceProductManual.useMutation(
      options
    )
  );
}

/**
 * 创建移除背景任务
 *
 * @example
 * ```tsx
 * const mutation = useCreateRemoveBackgroundMutation();
 *
 * const handleRemoveBackground = async () => {
 *   try {
 *     const taskId = await mutation.mutateAsync({
 *       productImagePath: "xxx",
 *       boardTaskId: "xxx"
 *     });
 *     // 开始轮询任务结果
 *     pollTaskResult(taskId);
 *   } catch (error) {
 *     const { errorMessage } = extractErrorInfo(error);
 *     toast.error(errorMessage || "移除背景失败");
 *   }
 * };
 * ```
 */
export function useCreateRemoveBackgroundMutation(
  options?: TRPCMutationConfig
) {
  return wrapMutation(
    trpc.productAvatar.task.createRemoveBackground.useMutation(options)
  );
}

/**
 * 创建图片角色替换任务
 *
 * @example
 * ```tsx
 * const mutation = useCreateImageCharacterSwapTaskMutation();
 *
 * const handleSubmit = async () => {
 *   try {
 *     const result = await mutation.mutateAsync({
 *       inputModelImagePath: "xxx",
 *       inputTemplateImagePath: "xxx",
 *       boardTaskId: "xxx"
 *     });
 *     pollTaskResult(result.taskId);
 *   } catch (error) {
 *     const { errorMessage } = extractErrorInfo(error);
 *     toast.error(errorMessage || "创建任务失败");
 *   }
 * };
 * ```
 */
export function useCreateImageCharacterSwapTaskMutation(
  options?: TRPCMutationConfig
) {
  return wrapMutation(
    trpc.productAvatar.task.createImageCharacterSwap.useMutation(options)
  );
}

/**
 * 创建图像到视频自动保存数字人任务
 *
 * @example
 * ```tsx
 * const mutation = useCreateVideoRegenerateMutation();
 *
 * const handleRegenerate = async () => {
 *   try {
 *     const result = await mutation.mutateAsync({
 *       imageResourceId: "xxx",
 *       boardId: "xxx"
 *     });
 *     console.log("Video regenerate task created:", result);
 *   } catch (error) {
 *     const { errorCode, errorMessage } = extractErrorInfo(error);
 *     checkTaskCode(errorCode);
 *   }
 * };
 * ```
 */
export function useCreateVideoRegenerateMutation(options?: TRPCMutationConfig) {
  return wrapMutation(
    trpc.productAvatar.task.createVideoRegenerate.useMutation(options)
  );
}

/**
 * 删除组合步骤任务
 *
 * @example
 * ```tsx
 * const mutation = useDeleteSimpleProcessMutation();
 *
 * const handleDelete = async (cardId: string) => {
 *   try {
 *     await mutation.mutateAsync({ cardId });
 *     toast.success("删除成功");
 *   } catch (error) {
 *     const { errorMessage } = extractErrorInfo(error);
 *     toast.error(errorMessage || "删除失败");
 *   }
 * };
 * ```
 */
export function useDeleteSimpleProcessMutation(options?: TRPCMutationConfig) {
  return wrapMutation(
    trpc.productAvatar.task.deleteSimpleProcess.useMutation(options)
  );
}
