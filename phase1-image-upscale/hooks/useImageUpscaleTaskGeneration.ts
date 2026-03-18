/**
 * ImageUpscale 任务生成 Hook
 * 封装任务创建逻辑，处理图片放大任务的提交
 */

import { useState, useCallback } from 'react';
import { useRecoilValue } from 'recoil-next';
import { teamCreditState } from '@/store/benefit';
import { ToolType } from '@/app/board/[id]/components/ToolPanel/types';
import { useBoardTaskManager } from '@/app/board/[id]/components/BoardWorkspace/hooks/useBoardTaskManager';
import { useViewMode } from '@/app/board/[id]/components/ToolPanel/hooks/useViewMode';
import { toast } from '@/hooks/useToast';
import { extractErrorInfo } from '@/lib/trpc/helper';
import type { ImageUpscaleFormValues } from '../store/atoms';
import { useCreateImageUpscaleTaskMutation } from '../data/task/useMutations';
import {
  IMAGE_UPSCALE_TASK_GENERATE_COUNT,
  TASK_SOURCE_BOARD,
  getCreditCostByResolution
} from '../config';

export interface UseImageUpscaleTaskGenerationResult {
  isSubmitting: boolean;
  generateTask: (formValues: ImageUpscaleFormValues) => Promise<void>;
}

interface CreatedTask {
  boardTaskId: string;
  taskId: string;
}

/**
 * ImageUpscale 任务生成 Hook
 */
export function useImageUpscaleTaskGeneration(): UseImageUpscaleTaskGenerationResult {
  const teamCredit = useRecoilValue(teamCreditState);
  const { switchToBoard } = useViewMode();
  const { insertBoardTasksByIds, createBoardTask } = useBoardTaskManager();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const createImageUpscaleTaskMutation = useCreateImageUpscaleTaskMutation();

  /**
   * 计算积分消耗
   */
  const calculateCreditConsumption = useCallback(
    (formValues: ImageUpscaleFormValues): number => {
      const creditCost = getCreditCostByResolution(formValues.targetResolution);
      return creditCost * IMAGE_UPSCALE_TASK_GENERATE_COUNT;
    },
    []
  );

  /**
   * 验证积分是否足够
   */
  const validateCredits = useCallback(
    (creditConsumption: number): boolean => {
      if (teamCredit.remainCredit < creditConsumption) {
        toast({
          title: 'Insufficient credits',
          description: `You need ${creditConsumption} credits to generate this task.`,
          variant: 'destructive'
        });
        return false;
      }
      return true;
    },
    [teamCredit.remainCredit]
  );

  /**
   * 验证表单数据
   */
  const validateFormValues = useCallback(
    (formValues: ImageUpscaleFormValues): boolean => {
      if (!formValues.sourceImagePath) {
        toast({
          title: 'Missing image',
          description: 'Please upload an image to upscale.',
          variant: 'destructive'
        });
        return false;
      }
      return true;
    },
    []
  );

  /**
   * 构建任务参数
   * 根据新的 API 接口文档构建参数
   */
  const buildTaskParams = useCallback(
    (boardTaskId: string, formValues: ImageUpscaleFormValues) => {
      return {
        // projectId 使用 boardTaskId
        boardTaskId: boardTaskId,
        // 输入图片 S3 路径
        inputImagePath: formValues.sourceImagePath!,
        // 目标分辨率
        resolution: formValues.targetResolution,
        // 任务来源
        source: TASK_SOURCE_BOARD
      };
    },
    []
  );

  /**
   * 创建单个 ImageUpscale 任务
   */
  const createSingleImageUpscaleTask = useCallback(
    async (formValues: ImageUpscaleFormValues): Promise<CreatedTask> => {
      // 创建 Board 任务，获取真实的 taskId
      const boardTaskId = await createBoardTask({
        toolType: ToolType.ImageUpscale
      });

      // 构建任务参数
      const params = buildTaskParams(boardTaskId, formValues);

      // 调用 API 创建任务
      // wrapMutation 会自动解包 data，所以 result 直接就是 taskId 字符串
      const taskId = await createImageUpscaleTaskMutation.mutateAsync(params);

      console.log('createSingleImageUpscaleTask', taskId);

      // 处理成功响应
      if (!taskId) {
        throw new Error('Failed to create task: No taskId returned');
      }

      return { boardTaskId, taskId };
    },
    [createBoardTask, buildTaskParams]
  );

  /**
   * 批量创建任务
   */
  const createBatchTasks = useCallback(
    async (
      formValues: ImageUpscaleFormValues,
      generateCount: number
    ): Promise<CreatedTask[]> => {
      const createdTasks: CreatedTask[] = [];

      for (let index = 0; index < generateCount; index++) {
        try {
          const task = await createSingleImageUpscaleTask(formValues);
          createdTasks.push(task);
        } catch (error) {
          // 提取错误信息
          const { errorMessage } = extractErrorInfo(error);

          // 如果第一个任务就失败了，直接抛出错误，让外层 catch 处理
          if (index === 0) {
            throw error;
          }

          // 后续任务失败，显示错误但继续处理其他任务
          toast({
            title: 'Failed to create task',
            description: errorMessage || `Task ${index + 1} creation failed.`,
            variant: 'destructive'
          });
          console.error(
            `[ImageUpscale] Failed to create task ${index + 1}:`,
            error
          );
        }
      }

      return createdTasks;
    },
    [createSingleImageUpscaleTask]
  );

  /**
   * 处理任务创建成功后的操作
   */
  const handleTaskCreationSuccess = useCallback(
    async (createdTasks: CreatedTask[], generateCount: number) => {
      // 收集所有 taskId，使用 insertBoardTasksByIds 批量插入任务
      const boardTaskIds = createdTasks.map((task) => task.boardTaskId);
      await insertBoardTasksByIds(boardTaskIds);

      // 切换视图
      switchToBoard();

      // 显示成功提示
      toast({
        title: 'Task created successfully',
        description:
          createdTasks.length === generateCount
            ? `Successfully created ${createdTasks.length} task(s).`
            : `Successfully created ${createdTasks.length} of ${generateCount} tasks.`
      });
    },
    [insertBoardTasksByIds, switchToBoard]
  );

  /**
   * 生成任务（主流程）
   */
  const generateTask = useCallback(
    async (formValues: ImageUpscaleFormValues) => {
      if (isSubmitting) return;

      setIsSubmitting(true);

      try {
        // 1. 验证表单数据
        if (!validateFormValues(formValues)) {
          setIsSubmitting(false);
          return;
        }

        // 2. 计算积分消耗
        const creditConsumption = calculateCreditConsumption(formValues);

        // 3. 验证积分
        if (!validateCredits(creditConsumption)) {
          setIsSubmitting(false);
          return;
        }

        // 4. 获取生成数量
        const generateCount = IMAGE_UPSCALE_TASK_GENERATE_COUNT;

        // 5. 批量创建任务
        const createdTasks = await createBatchTasks(formValues, generateCount);

        // 6. 处理成功后的操作
        if (createdTasks.length > 0) {
          await handleTaskCreationSuccess(createdTasks, generateCount);
        } else {
          throw new Error('Failed to create any tasks');
        }
      } catch (error) {
        const { errorMessage } = extractErrorInfo(error);
        toast({
          title: 'Failed to create task',
          description: errorMessage || 'Please try again later.',
          variant: 'destructive'
        });
        console.error('[ImageUpscale] Failed to create task:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      validateFormValues,
      calculateCreditConsumption,
      validateCredits,
      createBatchTasks,
      handleTaskCreationSuccess
    ]
  );

  return {
    isSubmitting,
    generateTask
  };
}
