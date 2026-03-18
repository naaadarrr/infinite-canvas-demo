/**
 * AiAvatar 任务生成 Hook
 * 封装任务创建逻辑，处理音频上传、API 调用、任务插入等
 */

import { useState, useCallback } from 'react';
import { useRecoilValue, useRecoilCallback } from 'recoil-next';
import dayjs from 'dayjs';
import { AudioInputType } from '@/server/api/services/avatar4/type';
import { ToolType } from '@/app/board/[id]/components/ToolPanel/types';
import { TAB_DISPLAY_NAME_MAP } from '@/app/board/[id]/components/ToolPanel/config';
import { useBoardTaskManager } from '@/app/board/[id]/components/BoardWorkspace/hooks/useBoardTaskManager';
import { useViewMode } from '@/app/board/[id]/components/ToolPanel/hooks/useViewMode';
import { useActiveTabId } from '@/app/board/[id]/components/ToolPanel/hooks/useActiveTabId';
import { toast } from '@/hooks/useToast';
import { extractErrorInfo } from '@/lib/trpc/helper';
import { teamCreditState } from '@/store/benefit';
import {
  CreditConsumingGenTaskType,
  trackCreditConsumptionGenTask
} from '@/utils/creditGa';
import { useSliceAndUploadAudio } from './useSliceAndUploadAudio';
import { handleAudioUpload as handleAudioUploadUtil } from '@/app/board/[id]/components/ToolPanel/components/avatar/utils/audioUpload';
import { AUDIO_S3_PATH_PREFIX } from '../config';
import { useCreatePhotoAvatar4VideoTaskMutation } from '../data/task/useMutations';
import { useCreatePhotoAiAvatarMutation } from '../data/avatar4Template/useMutations';
import { useMyAvatarListInvalidations } from '../data/avatar4Template/useInvalidations';
import { aiAvatarFormFamily } from '../store/atoms';
import type { AiAvatarFormValues } from '../store/atoms';
import { CustomPhotoAvatarSource } from '@/server/api/services/mediaLibrary/aiAvatar/type';
import { AssetInputSource } from '@/app/board/[id]/components/ToolPanel/components/avatar/types';

export interface UseAiAvatarTaskGenerationResult {
  isSubmitting: boolean;
  generateTask: (
    formValues: AiAvatarFormValues,
    options?: {
      uploadedAudioFile?: File | null;
      audioRange?: { start: number; end: number } | null;
      /** 用于埋点的实际消耗积分（免费生成时传 0） */
      creditConsumedForTracking?: number;
    }
  ) => Promise<void>;
}

/**
 * AiAvatar 任务生成 Hook
 */
export function useAiAvatarTaskGeneration(): UseAiAvatarTaskGenerationResult {
  const teamCredit = useRecoilValue(teamCreditState);
  const { switchToBoard } = useViewMode();
  const { insertBoardTasksByIds, createBoardTask } = useBoardTaskManager();
  const tabId = useActiveTabId();
  const { invalidateMyAvatarList } = useMyAvatarListInvalidations();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { sliceAndUploadAudio } = useSliceAndUploadAudio();
  const createTaskMutation = useCreatePhotoAvatar4VideoTaskMutation();
  const createPhotoAiAvatarMutation = useCreatePhotoAiAvatarMutation();

  // 更新 formValues 的方法
  const setFormValues = useRecoilCallback(
    ({ set }) =>
      (updater: (prev: AiAvatarFormValues) => AiAvatarFormValues) => {
        set(aiAvatarFormFamily(tabId), updater);
      },
    [tabId]
  );

  /**
   * 验证积分是否足够（与 avatar-4 一致，使用 teamCredit.remainCredit）
   */
  const validateCredits = useCallback(
    (creditConsumption: number): boolean => {
      if ((teamCredit?.remainCredit ?? 0) < creditConsumption) {
        toast({
          title: 'Insufficient credits',
          description: `You need ${creditConsumption} credits to generate this task.`,
          variant: 'destructive'
        });
        return false;
      }
      return true;
    },
    [teamCredit?.remainCredit]
  );

  /**
   * 处理音频上传（如果需要）
   */
  const handleAudioUpload = useCallback(
    async (
      formValues: AiAvatarFormValues,
      uploadedAudioFile?: File | null,
      audioRange?: { start: number; end: number } | null
    ): Promise<string | undefined> => {
      return handleAudioUploadUtil(formValues, {
        uploadedAudioFile,
        audioRange,
        sliceAndUploadAudio,
        s3PathPrefix: AUDIO_S3_PATH_PREFIX
      });
    },
    [sliceAndUploadAudio]
  );

  /**
   * 计算音频时长
   */
  const calculateAudioDuration = useCallback(
    (
      formValues: AiAvatarFormValues,
      audioRange?: { start: number; end: number } | null
    ): number | undefined => {
      const { audioFileSource, audioStartTime, audioEndTime, durations } =
        formValues;

      if (audioFileSource === AudioInputType.TEXT_TO_AUDIO) {
        // TTS 模式：使用 durations，如果没有则返回 undefined（允许不传）
        return durations;
      } else {
        // 上传音频模式：使用音频范围或 formValues 中的时间
        if (audioRange) {
          return audioRange.end - audioRange.start;
        } else if (audioStartTime !== undefined && audioEndTime !== undefined) {
          return audioEndTime - audioStartTime;
        } else {
          throw new Error(
            'Invalid audio duration: missing audio range or time'
          );
        }
      }
    },
    []
  );

  /**
   * 构建 API 参数
   */
  const buildApiParams = useCallback(
    (
      boardTaskId: string,
      formValues: AiAvatarFormValues,
      finalAudioS3Path: string | undefined,
      audioDuration: number | undefined,
      audioRange?: { start: number; end: number } | null
    ) => {
      const {
        aiavatarId,
        avatarType,
        audioFileSource,
        fileName,
        resolution,
        includeWatermark,
        audioStartTime,
        audioEndTime,
        ttsTaskId,
        ttsText,
        voiceoverId,
        voiceSpeed,
        pronRules,
        mode,
        captionKey,
        imageS3Path,
        positivePrompt,
        source,
        offPeak
      } = formValues;

      return {
        boardTaskId,
        audioFileSource,
        fileName,
        resolution,
        includeWatermark,
        mode,
        ...(audioDuration !== undefined &&
          audioDuration > 0 && { durations: audioDuration }),
        ...(aiavatarId && { aiavatarId }),
        ...(avatarType !== undefined && { avatarType }),
        ...(imageS3Path && { imageS3Path }),
        ...(captionKey && { captionKey }),
        ...(positivePrompt && { positivePrompt }),
        ...(source && { source }),
        ...(offPeak !== undefined && { offPeak }),
        // TTS 模式参数
        ...(audioFileSource === AudioInputType.TEXT_TO_AUDIO && {
          ttsText,
          voiceoverId,
          ...(voiceSpeed !== undefined && { voiceSpeed }),
          ...(ttsTaskId && { ttsTaskId }),
          ...(pronRules && pronRules.length > 0 && { pronRules })
        }),
        // 上传音频模式参数
        ...(audioFileSource === AudioInputType.UPLOAD_AUDIO && {
          audioS3Path: finalAudioS3Path,
          ...(audioRange
            ? {
                audioStartTime: audioRange.start,
                audioEndTime: audioRange.end
              }
            : {
                ...(audioStartTime !== undefined && { audioStartTime }),
                ...(audioEndTime !== undefined && { audioEndTime })
              })
        })
      };
    },
    []
  );

  /**
   * 生成任务（主流程）
   */
  const generateTask = useCallback(
    async (
      formValues: AiAvatarFormValues,
      options?: {
        uploadedAudioFile?: File | null;
        audioRange?: { start: number; end: number } | null;
        currentTemplateUrl?: string;
        creditConsumedForTracking?: number;
      }
    ) => {
      if (isSubmitting) return;

      setIsSubmitting(true);

      try {
        const { uploadedAudioFile, audioRange, creditConsumedForTracking } =
          options || {};
        const { estimatedCredits, isEstimatedCredits, ttsText } = formValues;

        // 1. 验证积分（与 avatar-4 一致，使用 teamCredit.remainCredit）
        const creditConsumption = estimatedCredits || 0;
        // 预估积分不做前置硬校验：由后端按真实音频时长扣费，不足则任务失败提示
        if (isEstimatedCredits !== true) {
          if (!validateCredits(creditConsumption)) {
            setIsSubmitting(false);
            return;
          }
        }

        // 2. 处理音频上传（如果需要）
        const finalAudioS3Path = await handleAudioUpload(
          formValues,
          uploadedAudioFile,
          audioRange
        );

        // 如果上传了音频，更新 formValues
        if (
          finalAudioS3Path &&
          formValues.audioFileSource === AudioInputType.UPLOAD_AUDIO
        ) {
          setFormValues((prev) => ({
            ...prev,
            audioS3Path: finalAudioS3Path
          }));
        }

        // 3. 计算音频时长
        const audioDuration = calculateAudioDuration(formValues, audioRange);
        // 对于上传音频模式，必须验证音频时长
        // 对于 TTS 模式，允许没有音频时长（支持仅传文本创建任务）
        if (formValues.audioFileSource === AudioInputType.UPLOAD_AUDIO) {
          if (!audioDuration || audioDuration <= 0) {
            throw new Error('Invalid audio duration');
          }
        }

        // 4. 创建 Board 任务
        const boardTaskId = await createBoardTask({
          toolType: ToolType.AiAvatar
        });

        // 5. 生成动态文件名：toolType + 日期
        const toolDisplayName = TAB_DISPLAY_NAME_MAP[ToolType.AiAvatar];
        const dateStr = dayjs().format('YYYY-MM-DD');
        const dynamicFileName = `${toolDisplayName} ${dateStr}`;

        // 6. 构建 API 参数（使用动态生成的文件名）
        const formValuesWithDynamicFileName = {
          ...formValues,
          fileName: dynamicFileName
        };
        const apiParams = buildApiParams(
          boardTaskId,
          formValuesWithDynamicFileName,
          finalAudioS3Path,
          audioDuration,
          audioRange
        );

        // 7. 调用 API 创建任务
        await createTaskMutation.mutateAsync(apiParams);

        // 7.1 任务创建成功后：若头像图片来自“本地上传”，则入库到 My Avatar（跨 board 全局）
        if (
          formValues.avatarPhotoInputSource === AssetInputSource.LOCAL_UPLOAD &&
          formValues.shouldSaveToMyAvatar === true &&
          formValues.imageS3Path
        ) {
          try {
            await createPhotoAiAvatarMutation.mutateAsync({
              imageS3Path: formValues.imageS3Path,
              source: CustomPhotoAvatarSource.PhotoTalkingAvatar
            });

            // 刷新 My Avatar 列表缓存，确保无需刷新即可看到新增头像
            await invalidateMyAvatarList();

            // 入库成功后关闭标记，避免重复入库
            setFormValues((prev) => ({
              ...prev,
              shouldSaveToMyAvatar: false
            }));
          } catch (saveError) {
            // 入库失败不影响主流程，仅提示/记录
            console.error(
              '[AiAvatar] Failed to save photo avatar to My Avatar:',
              saveError
            );
          }
        }

        // 8. 插入任务到 Board
        await insertBoardTasksByIds([boardTaskId]);

        // 9. 切换视图
        switchToBoard();

        // 10. 显示成功提示
        toast({
          title: 'Task created successfully',
          description: 'Your video generation task has been created.'
        });
      } catch (error) {
        const { errorMessage } = extractErrorInfo(error);
        toast({
          title: 'Failed to create task',
          description: errorMessage || 'Please try again later.',
          variant: 'destructive'
        });
        console.error('[AiAvatar] Failed to create task:', error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      validateCredits,
      handleAudioUpload,
      calculateAudioDuration,
      buildApiParams,
      createBoardTask,
      createTaskMutation,
      insertBoardTasksByIds,
      switchToBoard,
      setFormValues
    ]
  );

  return {
    isSubmitting,
    generateTask
  };
}
