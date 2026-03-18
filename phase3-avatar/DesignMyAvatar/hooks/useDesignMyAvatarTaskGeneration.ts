/**
 * DesignMyAvatar 任务生成 Hook
 * 封装任务创建逻辑，处理 API 调用、任务插入等
 */
'use client';

import { useState, useCallback } from 'react';
import { useRecoilValue } from 'recoil-next';
import { ToolType } from '@/app/board/[id]/components/ToolPanel/types';
import { useBoardTaskManager } from '@/app/board/[id]/components/BoardWorkspace/hooks/useBoardTaskManager';
import { useViewMode } from '@/app/board/[id]/components/ToolPanel/hooks/useViewMode';
import { toast } from '@/hooks/useToast';
import { extractErrorInfo } from '@/lib/trpc/helper';
import { teamCreditState } from '@/store/benefit';
import { useCreatePromptToAvatarTaskMutation } from '../data/usePromptToAvatarMutations';
import { DEFAULT_VALUES } from '../config';
import type { DesignMyAvatarFormValues } from '../type';

export interface UseDesignMyAvatarTaskGenerationResult {
  /** 是否正在提交（包括 API 调用中） */
  isSubmitting: boolean;
  /** 生成任务 */
  generateTask: (
    formValues: DesignMyAvatarFormValues,
    options?: {
      /** 用于埋点的实际消耗积分（Unlimited 模式传 0） */
      creditConsumedForTracking?: number;
      /** 创建任务数量，默认 1 */
      taskCount?: number;
    }
  ) => Promise<void>;
  /** mutation 是否正在执行 */
  isMutationPending: boolean;
}

/**
 * DesignMyAvatar 任务生成 Hook
 */
export function useDesignMyAvatarTaskGeneration(): UseDesignMyAvatarTaskGenerationResult {
  const teamCredit = useRecoilValue(teamCreditState);
  const { switchToBoard } = useViewMode();
  const { insertBoardTasksByIds, createBoardTask } = useBoardTaskManager();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const createPromptToAvatarTaskMutation =
    useCreatePromptToAvatarTaskMutation();

  /**
   * 验证积分是否足够
   */
  const validateCredits = useCallback(
    (creditConsumption: number): boolean => {
      if ((teamCredit?.remainCredit ?? 0) < creditConsumption) {
        toast.error(
          `Insufficient credits. You need ${creditConsumption} credits to generate this task.`
        );
        return false;
      }
      return true;
    },
    [teamCredit?.remainCredit]
  );

  /**
   * 生成任务（主流程）
   * @param formValues - 表单值
   * @param options.creditConsumedForTracking - 用于埋点的实际消耗积分
   * @param options.taskCount - 创建任务数量，默认 1
   */
  const generateTask = useCallback(
    async (
      formValues: DesignMyAvatarFormValues,
      options?: {
        creditConsumedForTracking?: number;
        taskCount?: number;
      }
    ) => {
      if (isSubmitting) return;

      setIsSubmitting(true);

      try {
        const { creditConsumedForTracking = 1, taskCount = 1 } = options || {};

        // 1. 验证积分（如果不是 Unlimited 模式）
        if (creditConsumedForTracking > 0) {
          if (!validateCredits(creditConsumedForTracking)) {
            setIsSubmitting(false);
            return;
          }
        }

        // 2. 切换到 board 视图（提前切换，让用户看到任务逐个创建）
        switchToBoard();

        // 3. 逐个创建任务，每创建成功一个就立即更新视图
        let successCount = 0;
        let failedCount = 0;

        for (let i = 0; i < taskCount; i++) {
          try {
            // 创建 Board 任务记录
            const boardTaskId = await createBoardTask({
              toolType: ToolType.DesignMyAvatar
            });

            // 准备 API 请求参数
            const params = {
              prompt: formValues.prompt.trim(),
              style: formValues.style,
              aspectRatio: formValues.ratio || DEFAULT_VALUES.ratio,
              imageCount: 1,
              avatarFaceFromType: formValues.faceSource,
              avatarFaceS3Key: formValues.avatarFaceS3Key || '',
              gender: formValues.gender,
              age: formValues.age,
              country: formValues.country,
              boardTaskId
            };

            // 调用工具 API 创建任务
            await createPromptToAvatarTaskMutation.mutateAsync(params);

            // API 调用成功后，立即插入到 BoardWorkspace
            await insertBoardTasksByIds([boardTaskId]);
            successCount++;
          } catch (error) {
            // 单个任务失败时记录错误，但继续创建其他任务
            failedCount++;
            console.error(
              `[DesignMyAvatar] Failed to create task ${i + 1}:`,
              error
            );
          }
        }

        // 4. 显示结果提示
        if (successCount > 0) {
          if (failedCount === 0) {
            // 全部成功
            toast.success(
              taskCount > 1
                ? `${taskCount} tasks created successfully`
                : 'Task created successfully'
            );
          } else {
            // 部分成功
            toast.warning(
              `${successCount} task${successCount > 1 ? 's' : ''} created successfully, ${failedCount} failed`
            );
          }
        } else {
          // 全部失败
          toast.error('Failed to create tasks. Please try again.');
        }
      } catch (error) {
        // 处理验证失败等顶层错误
        const { errorMessage } = extractErrorInfo(error);
        toast.error(errorMessage || 'Failed to create task. Please try again.');
        console.error('[DesignMyAvatar] Failed to create task:', error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      validateCredits,
      createBoardTask,
      createPromptToAvatarTaskMutation,
      insertBoardTasksByIds,
      switchToBoard
    ]
  );

  return {
    isSubmitting: isSubmitting || createPromptToAvatarTaskMutation.isPending,
    generateTask,
    isMutationPending: createPromptToAvatarTaskMutation.isPending
  };
}
