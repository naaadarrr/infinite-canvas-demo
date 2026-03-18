/**
 * AIVideo 任务生成 Hook
 * 处理批量任务创建逻辑
 */

import { useState, useCallback } from 'react';
import { useBoardTaskManager } from '@/app/board/[id]/components/BoardWorkspace/hooks/useBoardTaskManager';
import { useSubmitAiVideoTaskMutation } from '../data/useMutations';
import { AiVideoTaskSubmitParam } from '@/server/api/services/aiVideo/type';
import { ToolType } from '@/app/board/[id]/components/ToolPanel/types';
import { toast } from '@/hooks/useToast';
import { extractErrorInfo } from '@/lib/trpc/helper';
import { TASK_SOURCE_BOARD } from '@/app/board/[id]/components/ToolPanel/feature/CrossMedia/FaceSwap/config';

export interface UseAIVideoTaskGenerationResult {
  isSubmitting: boolean;
  generateTasks: (
    params: AiVideoTaskSubmitParam,
    toolType: ToolType
  ) => Promise<void>;
}

export interface UseAIVideoTaskGenerationOptions {
  useUnlimitMode?: boolean;
  onSuccess?: () => void;
}

export function useAIVideoTaskGeneration(
  options: UseAIVideoTaskGenerationOptions = {}
): UseAIVideoTaskGenerationResult {
  const { onSuccess, useUnlimitMode = false } = options;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createBoardTask, insertBoardTasksByIds } = useBoardTaskManager();
  const submitTaskMutation = useSubmitAiVideoTaskMutation();

  /**
   * 创建单个任务
   */
  const createSingleTask = useCallback(
    async (params: AiVideoTaskSubmitParam, toolType: ToolType) => {
      // 1. 创建 Board 任务占位
      const boardTaskId = await createBoardTask({ toolType, useUnlimitMode });

      // 2. 提交真实任务
      const [result, err] = await submitTaskMutation
        .mutateAsync({
          ...params,
          boardTaskId,
          useUnlimitMode,
          source: TASK_SOURCE_BOARD
        })
        .then(
          (data) => [data, null] as const,
          (error) => [null, error] as const
        );

      if (err) {
        return [null, err] as const;
      }

      return [{ boardTaskId, result }, null] as const;
    },
    [createBoardTask, submitTaskMutation]
  );

  /**
   * 批量生成任务
   */
  const generateTasks = useCallback(
    async (params: AiVideoTaskSubmitParam, toolType: ToolType) => {
      if (isSubmitting) return;
      setIsSubmitting(true);

      const count = params.generatingCount ?? 1;
      const createdBoardTaskIds: string[] = [];
      let successCount = 0;
      let firstError: any = null;

      try {
        for (let i = 0; i < count; i++) {
          const [data, err] = await createSingleTask(params, toolType);

          if (err) {
            if (i === 0) {
              firstError = err;
              break;
            }
            // 后续任务失败，仅记录并提示
            const { errorMessage } = extractErrorInfo(err);
            toast.error({
              title: `Task ${i + 1} failed`,
              description: errorMessage || 'Failed to create task'
            });
            continue;
          }

          if (data) {
            createdBoardTaskIds.push(data.boardTaskId);
            successCount++;
          }
        }

        if (successCount > 0) {
          // 批量插入任务到画布
          await insertBoardTasksByIds(createdBoardTaskIds);

          toast.success({
            title: 'Tasks submitted successfully',
            description: `Successfully created ${successCount} tasks.`
          });

          onSuccess?.();
        } else if (firstError) {
          throw firstError;
        }
      } catch (error: any) {
        const { errorMessage } = extractErrorInfo(error);
        toast.error({
          title: 'Failed to submit tasks',
          description: errorMessage || 'Unknown error'
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, createSingleTask, insertBoardTasksByIds, onSuccess]
  );

  return {
    isSubmitting,
    generateTasks
  };
}
