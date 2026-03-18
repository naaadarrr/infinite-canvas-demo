import { useCallback, useMemo } from 'react';
import { useRecoilValue } from 'recoil-next';
import { extractQueryData } from '@/lib/trpc/helper';
import { ToolType } from '@/app/board/[id]/components/ToolPanel/types';
import { useUnlimitedAccessQuery } from '@/app/board/[id]/components/ToolPanel/data/activity/useQueries';
import { useBoardsConcurrencyQuery } from '@/app/board/[id]/components/BoardWorkspace/data/board/useBoardsConcurrencyQuery';
import {
  UnlimitedModelCategory,
  UnlimitedModelTaskType
} from '@/server/api/services/activity/type';
import { teamBenefitInfoState } from '@/store';
import { SUBS_TYPE } from '@topview/pricing';
import type { AIVideoFormValues } from '../store/atoms';
import { AIVideoImageMode } from '@/app/board/[id]/components/ToolPanel/types/model';

/**
 * 工具类型到任务类型的映射
 */
const TOOL_TO_TASK_TYPE: Record<string, UnlimitedModelTaskType> = {
  [ToolType.ImageToVideo]: UnlimitedModelTaskType.IMAGE_TO_VIDEO,
  [ToolType.TextToVideo]: UnlimitedModelTaskType.TEXT_TO_VIDEO,
  [ToolType.VideoEdit]: UnlimitedModelTaskType.VIDEO_EDIT
};

export interface UseAIVideoGenerateGuardOptions {
  /** 表单值 */
  formValues: AIVideoFormValues;
  /** 当前的工具类型 */
  toolType: ToolType;
}

export interface GenerateValidationResult {
  /** 是否通过验证 */
  valid: boolean;
  /** 验证失败原因 */
  reason?: string;
  /** 验证失败详细描述 */
  description?: string;
  /** 允许提交的任务数量 */
  allowedTaskCount?: number;
  /** 被并发限制阻止的任务数量 */
  blockedTaskCount?: number;
}

export interface UseAIVideoGenerateGuardResult {
  /** 用户是否为付费用户 */
  isPaidUser: boolean;
  /** 用户是否拥有当前模型的 Unlimited 权益 */
  hasUnlimitedAccess: boolean;
  /** 是否可以生成（用于按钮禁用状态，基于缓存数据的快速判断） */
  canGenerate: boolean;
  /** 异步验证是否可以生成（会先刷新并发数据获取最新状态） */
  validateAsync: () => Promise<GenerateValidationResult>;
}

/**
 * AI Video 生成限制守卫 Hook
 *
 * 集中管理所有生成限制相关的逻辑：
 * - 用户付费状态
 * - Unlimited 权益检查
 * - 并发任务数检查
 * - 统一验证函数
 */
export function useAIVideoGenerateGuard({
  formValues,
  toolType
}: UseAIVideoGenerateGuardOptions): UseAIVideoGenerateGuardResult {
  const resolution = useMemo(() => {
    return parseInt(formValues.resolution?.replace(/\D/g, '') || '720');
  }, [formValues.resolution]);

  // 获取用户订阅信息
  const teamBenefitInfo = useRecoilValue(teamBenefitInfoState);

  // 判断是否为付费用户
  const isPaidUser = useMemo(() => {
    return teamBenefitInfo.subsType !== SUBS_TYPE.FREE;
  }, [teamBenefitInfo.subsType]);

  // 获取任务类型
  const taskType = TOOL_TO_TASK_TYPE[toolType];

  // 调用 API 检查用户是否拥有 Unlimited 权益
  const unlimitedCheckQuery = useUnlimitedAccessQuery({
    category: UnlimitedModelCategory.VIDEO,
    modelId: formValues.modelId || '',
    taskType: taskType,
    resolution: resolution
  });

  // 计算是否拥有 Unlimited 权益
  const hasUnlimitedAccess = useMemo(() => {
    if (!isPaidUser) return false;
    const result = extractQueryData(unlimitedCheckQuery.data);
    return result?.available ?? false;
  }, [isPaidUser, unlimitedCheckQuery.data]);

  // 获取并发任务信息
  const { data: concurrencyData, refetch: refetchConcurrency } =
    useBoardsConcurrencyQuery();

  // 提取并发数据（基于缓存）
  const concurrency = useMemo(() => {
    const data = extractQueryData(concurrencyData);
    if (!data) return null;
    return {
      used: data.used,
      max: data.max
    };
  }, [concurrencyData]);

  // 是否可以生成（用于按钮禁用状态，基于缓存数据的快速判断）
  const canGenerate = useMemo(() => {
    console.log(formValues);
    // 没有选择模型
    if (!formValues.modelId) return false;

    // 文本生成模式下没有提示词
    if (toolType === ToolType.TextToVideo) {
      if (!formValues.prompt) return false;
    }

    // 图片生成模式下没有上传图片
    if (toolType === ToolType.ImageToVideo) {
      if (!formValues.i2vRefToVideoPrompt && !formValues.i2vPrompt)
        return false;
      if (formValues.imageMode === AIVideoImageMode.MULTI_IMAGE) {
        if (
          !formValues.referenceImages ||
          formValues.referenceImages.length === 0
        )
          return false;
      }
      if (formValues.imageMode === AIVideoImageMode.START_END_FRAME) {
        if (!formValues.firstFrameImage) return false;
      }
      if (formValues.imageMode === AIVideoImageMode.SINGLE_IMAGE) {
        if (!formValues.firstFrameImage && !formValues.referenceImages.length)
          return false;
      }
    }

    // 视频编辑模式下没有上传视频
    if (toolType === ToolType.VideoEdit) {
      if (!formValues.veRefToVideoPrompt) return false;
      if (!formValues.uploadedVideo) return false;
    }

    // 并发已达上限，暂时不检查，因为缺少检测任务已完成的通知机制
    // if (concurrency && concurrency.used >= concurrency.max) return false;
    return true;
  }, [formValues, concurrency]);

  // 异步验证函数（会先刷新并发数据获取最新状态）
  const validateAsync =
    useCallback(async (): Promise<GenerateValidationResult> => {
      const requestedTaskCount = formValues.generatingCount || 1;

      // 检查模型是否选择
      if (!formValues.modelId) {
        return {
          valid: false,
          reason: 'Please select a model'
        };
      }

      // 刷新并发数据，获取最新状态
      const { data: latestData } = await refetchConcurrency();
      const latestConcurrency = extractQueryData(latestData);

      // 检查并发限制
      if (
        latestConcurrency &&
        latestConcurrency.used >= latestConcurrency.max
      ) {
        return {
          valid: false,
          reason: "You've reached your active task limit.",
          description: 'Upgrade to unlock higher concurrency.'
          // description: `You have reached the maximum number of concurrent tasks (${latestConcurrency.max}). Please wait for existing tasks to complete.`
        };
      }

      if (latestConcurrency) {
        const availableTaskCount = Math.max(
          latestConcurrency.max - latestConcurrency.used,
          0
        );

        if (availableTaskCount < requestedTaskCount) {
          return {
            valid: true,
            allowedTaskCount: availableTaskCount,
            blockedTaskCount: requestedTaskCount - availableTaskCount
          };
        }
      }

      return { valid: true };
    }, [formValues, refetchConcurrency]);

  return {
    isPaidUser,
    hasUnlimitedAccess,
    canGenerate,
    validateAsync
  };
}
