/**
 * ProductAvatar 任务生成 Hook
 * 封装任务创建逻辑，处理 Auto/Manual 两种模式，支持批量创建任务
 */

import { useState, useCallback } from 'react';
import { useRecoilValue } from 'recoil-next';
import { teamCreditState } from '@/store/benefit';
import { ToolType } from '@/app/board/[id]/components/ToolPanel/types';
import { useBoardTaskManager } from '@/app/board/[id]/components/BoardWorkspace/hooks/useBoardTaskManager';
import { useViewMode } from '@/app/board/[id]/components/ToolPanel/hooks/useViewMode';
import { toast } from '@/hooks/useToast';
import { extractErrorInfo } from '@/lib/trpc/helper';
import type { ProductAvatarFormValues } from '../store/atoms';
import { ProductAvatarGenerateMode } from '../store/atoms';
import {
  useCreatePromptReplaceAutoMutation,
  useCreatePromptReplaceManualMutation
} from '../data/task/useMutations';
import {
  PROMPT_OBJECT_REPLACE_TASK_CREDIT_CONSUMPTION,
  PROMPT_OBJECT_REPLACE_TASK_GENERATE_COUNT,
  MANUAL_OBJECT_REPLACE_TASK_CREDIT_CONSUMPTION,
  MANUAL_OBJECT_REPLACE_TASK_GENERATE_COUNT,
  TASK_SOURCE_BOARD
} from '../config';
import { PromptReplaceProductTaskType } from '@/server/api/services/productAvatar/task/type';

import {
  CreditConsumingGenTaskType,
  trackCreditConsumptionGenTask
} from '@/utils/creditGa';

export interface UseProductAvatarTaskGenerationResult {
  isSubmitting: boolean;
  generateTask: (formValues: ProductAvatarFormValues) => Promise<void>;
}

interface CreatedTask {
  boardTaskId: string;
  cardId: string;
}

/**
 * ProductAvatar 任务生成 Hook
 */
export function useProductAvatarTaskGeneration(): UseProductAvatarTaskGenerationResult {
  const teamCredit = useRecoilValue(teamCreditState);
  const { switchToBoard } = useViewMode();
  const { insertBoardTasksByIds, createBoardTask } = useBoardTaskManager();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const createAutoTaskMutation = useCreatePromptReplaceAutoMutation();
  const createManualTaskMutation = useCreatePromptReplaceManualMutation();

  /**
   * 计算积分消耗
   */
  const calculateCreditConsumption = useCallback(
    (mode: ProductAvatarGenerateMode): number => {
      if (mode === ProductAvatarGenerateMode.AUTO) {
        return (
          PROMPT_OBJECT_REPLACE_TASK_CREDIT_CONSUMPTION *
          PROMPT_OBJECT_REPLACE_TASK_GENERATE_COUNT
        );
      } else {
        return (
          MANUAL_OBJECT_REPLACE_TASK_CREDIT_CONSUMPTION *
          MANUAL_OBJECT_REPLACE_TASK_GENERATE_COUNT
        );
      }
    },
    []
  );

  /**
   * 获取生成任务数量
   */
  const getGenerateCount = useCallback(
    (mode: ProductAvatarGenerateMode): number => {
      return mode === ProductAvatarGenerateMode.AUTO
        ? PROMPT_OBJECT_REPLACE_TASK_GENERATE_COUNT
        : MANUAL_OBJECT_REPLACE_TASK_GENERATE_COUNT;
    },
    []
  );

  /**
   * 验证积分是否足够（与参考页统一使用 teamCreditState）
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
   * 构建 Auto 模式任务参数
   * 参数类型对应 API 类型定义：PromptReplaceProductAutoModeTaskSubmitParam
   * 支持两种情况：
   * 1. 使用 avatarId（预设的 Avatar）
   * 2. 使用 templateImagePath（用户上传的模板图片）
   * 两者只会存在一种，根据实际情况选择传递
   */
  const buildAutoModeParams = useCallback(
    (boardTaskId: string, formValues: ProductAvatarFormValues) => {
      const autoValues = formValues as typeof formValues & {
        productImagePath?: string;
        templateImagePath?: string;
        avatarId?: string;
      };

      if (!autoValues.productImagePath) {
        throw new Error(
          'Missing required fields for auto mode: productImagePath'
        );
      }

      // 必须有 avatarId 或 templateImagePath 其中之一
      if (!autoValues.avatarId && !autoValues.templateImagePath) {
        throw new Error(
          'Missing required fields for auto mode: avatarId or templateImagePath'
        );
      }

      // 根据是否有 avatarId 来决定传递的参数
      // 参考旧项目逻辑：如果有 avatarId 就传 avatarId，否则传 templateImagePath
      if (autoValues.avatarId) {
        return {
          boardTaskId,
          avatarId: autoValues.avatarId,
          productImagePath: autoValues.productImagePath,
          source: TASK_SOURCE_BOARD
        };
      } else {
        return {
          boardTaskId,
          productImagePath: autoValues.productImagePath,
          templateImagePath: autoValues.templateImagePath,
          source: TASK_SOURCE_BOARD
        };
      }
    },
    []
  );

  /**
   * 构建 Manual 模式任务参数
   * 参数类型对应 API 类型定义：PromptReplaceProductManualModeTaskSubmitParam
   * Manual 模式下，type 字段：偶数索引为 OVERLAY，奇数索引为 DOUBLE
   * tRPC input schema 要求：boardTaskId, templateImagePath, inputImageResourceId,
   * productImagePath, productImageWithoutBackground 是必需的
   */
  const buildManualModeParams = useCallback(
    (
      boardTaskId: string,
      formValues: ProductAvatarFormValues,
      taskIndex: number
    ) => {
      const manualValues = formValues as typeof formValues & {
        productImagePath: string;
        templateImagePath?: string;
        avatarId?: string;
        productImageWithoutBackground: string;
        location?: Array<[number, number]>;
        type?: PromptReplaceProductTaskType;
        inputImageResourceId?: string;
      };

      // 必须有 productImagePath 和 productImageWithoutBackground
      if (
        !manualValues.productImagePath ||
        !manualValues.productImageWithoutBackground
      ) {
        throw new Error(
          'Missing required fields for manual mode: productImagePath or productImageWithoutBackground'
        );
      }

      // 必须有 avatarId 或 templateImagePath 其中之一
      if (!manualValues.avatarId && !manualValues.templateImagePath) {
        throw new Error(
          'Missing required fields for manual mode: avatarId or templateImagePath'
        );
      }

      // Manual 模式下，type 字段：偶数索引为 OVERLAY，奇数索引为 DOUBLE
      const taskType =
        taskIndex % 2 === 0
          ? PromptReplaceProductTaskType.OVERLAY
          : PromptReplaceProductTaskType.DOUBLE;

      // 参考旧项目逻辑：如果有 avatarId 就传 avatarId，否则传 templateImagePath
      // 注意：tRPC schema 要求 templateImagePath 是必需的，但如果使用 avatarId，可以传空字符串
      const params = {
        boardTaskId,
        inputImageResourceId: manualValues.inputImageResourceId || '',
        productImagePath: manualValues.productImagePath,
        productImageWithoutBackground:
          manualValues.productImageWithoutBackground,
        source: TASK_SOURCE_BOARD,
        location: manualValues.location,
        type: manualValues.type ?? taskType,
        // tRPC schema 要求 templateImagePath 是必需的，所以总是提供
        templateImagePath: manualValues.templateImagePath || '',
        // 如果有 avatarId，优先使用 avatarId
        ...(manualValues.avatarId && { avatarId: manualValues.avatarId })
      };

      return params;
    },
    []
  );

  /**
   * 创建单个 ProductAvatar 任务
   */
  const createSingleProductAvatarTask = useCallback(
    async (
      formValues: ProductAvatarFormValues,
      taskIndex: number
    ): Promise<CreatedTask> => {
      // 创建 Board 任务，获取真实的 taskId
      const boardTaskId = await createBoardTask({
        toolType: ToolType.ProductAvatar
      });

      const { mode } = formValues;
      let result;

      if (mode === ProductAvatarGenerateMode.AUTO) {
        // Auto 模式
        const params = buildAutoModeParams(boardTaskId, formValues);
        result = await createAutoTaskMutation.mutateAsync(params);
      } else {
        // Manual 模式
        const params = buildManualModeParams(
          boardTaskId,
          formValues,
          taskIndex
        );
        result = await createManualTaskMutation.mutateAsync(params);
      }

      // 处理成功响应
      if (!result?.cardId) {
        throw new Error('Failed to create task: No cardId returned');
      }

      return { boardTaskId, cardId: result.cardId };
    },
    [
      createBoardTask,
      buildAutoModeParams,
      buildManualModeParams,
      createAutoTaskMutation,
      createManualTaskMutation
    ]
  );

  /**
   * 批量创建任务
   */
  const createBatchTasks = useCallback(
    async (
      formValues: ProductAvatarFormValues,
      generateCount: number
    ): Promise<CreatedTask[]> => {
      const createdTasks: CreatedTask[] = [];

      for (let index = 0; index < generateCount; index++) {
        try {
          const task = await createSingleProductAvatarTask(formValues, index);
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
            `[ProductAvatar] Failed to create task ${index + 1}:`,
            error
          );
        }
      }

      return createdTasks;
    },
    [createSingleProductAvatarTask]
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
      toast.success({
        title: 'Tasks created successfully',
        description: `Successfully created ${createdTasks.length} of ${generateCount} tasks.`
      });
    },
    [insertBoardTasksByIds, switchToBoard]
  );

  /**
   * 生成任务（主流程）
   */
  const generateTask = useCallback(
    async (formValues: ProductAvatarFormValues) => {
      if (isSubmitting) return;

      setIsSubmitting(true);

      try {
        const { mode } = formValues;

        // 1. 计算积分消耗
        const creditConsumption = calculateCreditConsumption(mode);

        // 2. 验证积分
        if (!validateCredits(creditConsumption)) {
          setIsSubmitting(false);
          return;
        }

        // 3. 获取生成数量
        const generateCount = getGenerateCount(mode);

        // 4. 批量创建任务
        const createdTasks = await createBatchTasks(formValues, generateCount);

        // 5. 处理成功后的操作
        if (createdTasks.length > 0) {
          await handleTaskCreationSuccess(createdTasks, generateCount);
          trackCreditConsumptionGenTask({
            type: CreditConsumingGenTaskType.PRODUCT_AVATAR,
            creditConsumed: creditConsumption
          });
        } else {
          throw new Error('Failed to create any tasks');
        }
      } catch (error) {
        const { errorMessage } = extractErrorInfo(error);
        toast({
          title: 'Failed to create tasks',
          description: errorMessage || 'Please try again later.',
          variant: 'destructive'
        });
        console.error('[ProductAvatar] Failed to create tasks:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      calculateCreditConsumption,
      validateCredits,
      getGenerateCount,
      createBatchTasks,
      handleTaskCreationSuccess
    ]
  );

  return {
    isSubmitting,
    generateTask
  };
}
