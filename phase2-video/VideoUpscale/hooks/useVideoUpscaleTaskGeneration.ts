/**
 * VideoUpscale 任务生成 Hook
 * 封装任务创建逻辑，处理视频放大任务的提交
 */

import { useState, useCallback } from 'react';
import { useRecoilValue } from 'recoil-next';
import { teamCreditState } from '@/store/benefit';
import { ToolType } from '@/app/board/[id]/components/ToolPanel/types';
import { useBoardTaskManager } from '@/app/board/[id]/components/BoardWorkspace/hooks/useBoardTaskManager';
import { useViewMode } from '@/app/board/[id]/components/ToolPanel/hooks/useViewMode';
import { toast } from '@/hooks/useToast';
import { extractErrorInfo } from '@/lib/trpc/helper';
import type { VideoUpscaleFormValues } from '../store/atoms';
import { useCreateVideoUpscaleTaskMutation } from '../data/task/useMutations';
import {
  VIDEO_UPSCALE_TASK_GENERATE_COUNT,
  TASK_SOURCE_BOARD,
  getCreditPerMinuteByResolution
} from '../config';

export interface UseVideoUpscaleTaskGenerationResult {
  isSubmitting: boolean;
  generateTask: (
    formValues: VideoUpscaleFormValues,
    videoDuration: number
  ) => Promise<void>;
}

interface CreatedTask {
  boardTaskId: string;
  taskId: string;
}

/**
 * VideoUpscale 任务生成 Hook
 */
export function useVideoUpscaleTaskGeneration(): UseVideoUpscaleTaskGenerationResult {
  const teamCredit = useRecoilValue(teamCreditState);
  const { switchToBoard } = useViewMode();
  const { insertBoardTasksByIds, createBoardTask } = useBoardTaskManager();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const createVideoUpscaleTaskMutation = useCreateVideoUpscaleTaskMutation();

  /**
   * 计算积分消耗（按分钟计算，时长向上取整到分钟）
   */
  const calculateCreditConsumption = useCallback(
    (formValues: VideoUpscaleFormValues, videoDuration: number): number => {
      const creditPerMinute = getCreditPerMinuteByResolution(
        formValues.targetResolution
      );
      // 时长向上取整到分钟（如 3.65 秒按 1 分钟计费）
      const minutes = Math.ceil(videoDuration / 60);
      return creditPerMinute * minutes * VIDEO_UPSCALE_TASK_GENERATE_COUNT;
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
          description: `You need ${creditConsumption.toFixed(1)} credits to generate this task.`,
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
    (formValues: VideoUpscaleFormValues): boolean => {
      if (!formValues.sourceVideoPath) {
        toast({
          title: 'Missing video',
          description: 'Please upload a video to upscale.',
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
    (
      boardTaskId: string,
      formValues: VideoUpscaleFormValues,
      videoDuration: number
    ) => {
      return {
        // projectId 使用 boardTaskId
        boardTaskId: boardTaskId,
        // 输入视频 S3 路径
        inputVideoPath: formValues.sourceVideoPath!,
        // 目标分辨率
        resolution: formValues.targetResolution,
        // 视频时长（秒，保留小数）
        duration: videoDuration,
        // 任务来源
        source: TASK_SOURCE_BOARD
      };
    },
    []
  );

  /**
   * 创建单个 VideoUpscale 任务
   */
  const createSingleVideoUpscaleTask = useCallback(
    async (
      formValues: VideoUpscaleFormValues,
      videoDuration: number
    ): Promise<CreatedTask> => {
      // 创建 Board 任务，获取真实的 taskId
      const boardTaskId = await createBoardTask({
        toolType: ToolType.VideoUpscale
      });

      // 构建任务参数
      const params = buildTaskParams(boardTaskId, formValues, videoDuration);

      // 调用 API 创建任务
      // wrapMutation 会自动解包 data，所以 result 直接就是 taskId 字符串
      const taskId = await createVideoUpscaleTaskMutation.mutateAsync(params);

      console.log('createSingleVideoUpscaleTask', taskId);

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
      formValues: VideoUpscaleFormValues,
      generateCount: number,
      videoDuration: number
    ): Promise<CreatedTask[]> => {
      const createdTasks: CreatedTask[] = [];

      for (let index = 0; index < generateCount; index++) {
        try {
          const task = await createSingleVideoUpscaleTask(
            formValues,
            videoDuration
          );
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
            `[VideoUpscale] Failed to create task ${index + 1}:`,
            error
          );
        }
      }

      return createdTasks;
    },
    [createSingleVideoUpscaleTask]
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
    async (formValues: VideoUpscaleFormValues, videoDuration: number) => {
      if (isSubmitting) return;

      setIsSubmitting(true);

      try {
        // 1. 验证表单数据
        if (!validateFormValues(formValues)) {
          setIsSubmitting(false);
          return;
        }

        // 2. 计算积分消耗
        const creditConsumption = calculateCreditConsumption(
          formValues,
          videoDuration
        );

        // 3. 验证积分
        if (!validateCredits(creditConsumption)) {
          setIsSubmitting(false);
          return;
        }

        // 4. 获取生成数量
        const generateCount = VIDEO_UPSCALE_TASK_GENERATE_COUNT;

        // 5. 批量创建任务
        const createdTasks = await createBatchTasks(
          formValues,
          generateCount,
          videoDuration
        );

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
        console.error('[VideoUpscale] Failed to create task:', error);
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
