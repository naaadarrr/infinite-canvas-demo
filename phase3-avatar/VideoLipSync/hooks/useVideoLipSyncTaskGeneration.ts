/**
 * VideoLipSync 任务生成 Hook
 * 封装任务创建逻辑，处理音频上传、API 调用、任务插入等
 */

import { useState, useCallback } from 'react';
import { useRecoilCallback } from 'recoil-next';
import dayjs from 'dayjs';
import { AudioInputType } from '@/server/api/services/avatar4/type';
import { ToolType } from '@/app/board/[id]/components/ToolPanel/types';
import { TAB_DISPLAY_NAME_MAP } from '@/app/board/[id]/components/ToolPanel/config';
import { useBoardTaskManager } from '@/app/board/[id]/components/BoardWorkspace/hooks/useBoardTaskManager';
import { useViewMode } from '@/app/board/[id]/components/ToolPanel/hooks/useViewMode';
import { useActiveTabId } from '@/app/board/[id]/components/ToolPanel/hooks/useActiveTabId';
import { toast } from '@/hooks/useToast';
import { extractErrorInfo } from '@/lib/trpc/helper';
import { useSliceAndUploadAudio } from '@/app/board/[id]/components/ToolPanel/feature/Avatar/AiAvatar/hooks/useSliceAndUploadAudio';
import { handleAudioUpload as handleAudioUploadUtil } from '@/app/board/[id]/components/ToolPanel/components/avatar/utils/audioUpload';
import {
  AUDIO_S3_PATH_PREFIX,
  VIDEO_LIP_SYNC_SECONDS_PER_CREDIT,
  VIDEO_LIP_SYNC_CHARACTERS_PER_CREDIT
} from '../config';
import { useCreateIndependentAiAvatarTaskMutation } from '../data/task/useMutations';
import {
  calculateTotalPauseDuration,
  getPlainTextLength
} from '@/app/board/[id]/components/ToolPanel/components/avatar/utils/textUtils';

import { videoLipSyncFormFamily } from '../store/atoms';
import type { VideoLipSyncFormValues } from '../store/atoms';
import { TaskSource } from '@/server/api/services/_common/type';

export interface UseVideoLipSyncTaskGenerationResult {
  isSubmitting: boolean;
  generateTask: (
    formValues: VideoLipSyncFormValues,
    options?: {
      uploadedAudioFile?: File | null;
      audioRange?: { start: number; end: number } | null;
      /** 用于埋点/追踪的积分消耗（Unlimited 时为 0） */
      creditConsumedForTracking?: number;
    }
  ) => Promise<void>;
}

/**
 * VideoLipSync 任务生成 Hook
 */
export function useVideoLipSyncTaskGeneration(): UseVideoLipSyncTaskGenerationResult {
  const { switchToBoard } = useViewMode();
  const { insertBoardTasksByIds, createBoardTask } = useBoardTaskManager();
  const tabId = useActiveTabId();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { sliceAndUploadAudio } = useSliceAndUploadAudio();
  const createTaskMutation = useCreateIndependentAiAvatarTaskMutation();

  // 更新 formValues 的方法
  const setFormValues = useRecoilCallback(
    ({ set }) =>
      (updater: (prev: VideoLipSyncFormValues) => VideoLipSyncFormValues) => {
        set(videoLipSyncFormFamily(tabId), updater);
      },
    [tabId]
  );

  /**
   * 实时计算积分消耗
   */
  const calculateCreditConsumption = useCallback(
    (
      formValues: VideoLipSyncFormValues,
      audioRange?: { start: number; end: number } | null
    ): number => {
      const { audioFileSource, ttsText, audioStartTime, audioEndTime } =
        formValues;

      let creditConsumption = 1; // 默认最少 1 credit

      if (audioFileSource === AudioInputType.UPLOAD_AUDIO) {
        // 上传音频模式：根据音频时长计算
        let audioDuration = 0;

        if (audioRange) {
          audioDuration = audioRange.end - audioRange.start;
        } else if (audioStartTime !== undefined && audioEndTime !== undefined) {
          audioDuration = audioEndTime - audioStartTime;
        }

        if (audioDuration > 0) {
          creditConsumption = Math.ceil(
            audioDuration / VIDEO_LIP_SYNC_SECONDS_PER_CREDIT
          );
        }
      } else if (audioFileSource === AudioInputType.TEXT_TO_AUDIO) {
        // TTS 模式：根据字符数和 pause 时长计算
        if (ttsText?.trim()) {
          const characterCount = getPlainTextLength(ttsText);
          const totalPauseDuration = calculateTotalPauseDuration(ttsText);

          // 字符数积分
          const characterCredit =
            characterCount / VIDEO_LIP_SYNC_CHARACTERS_PER_CREDIT;
          // pause 时长积分
          const pauseCredit =
            totalPauseDuration / VIDEO_LIP_SYNC_SECONDS_PER_CREDIT;

          creditConsumption = Math.ceil(characterCredit + pauseCredit);
        }
      }

      // 最少 1 credit
      return Math.max(creditConsumption, 1);
    },
    []
  );

  /**
   * 处理音频上传（如果需要）
   */
  const handleAudioUpload = useCallback(
    async (
      formValues: VideoLipSyncFormValues,
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
      formValues: VideoLipSyncFormValues,
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
      formValues: VideoLipSyncFormValues,
      finalAudioS3Path: string | undefined,
      audioDuration: number | undefined,
      audioRange?: { start: number; end: number } | null
    ) => {
      const {
        aiavatarId,
        audioFileSource,
        fileName,
        resolution,
        mode,
        version,
        audioStartTime,
        audioEndTime,
        ttsTaskId,
        ttsText,
        voiceoverId,
        voiceSpeed,
        pronRules,
        durations,
        captionKey,
        emotionFrontName,
        saveToPrivate,
        videoS3Path
      } = formValues;

      return {
        boardTaskId,
        ...(aiavatarId && { aiavatarId }), // 可选字段，仅在存在时传递
        audioFileSource,
        fileName,
        resolution,
        mode,
        source: TaskSource.BOARD,
        ...(version && { version }),
        ...(videoS3Path && { videoS3Path }),
        ...(captionKey && { captionKey }),
        ...(emotionFrontName && { emotionFrontName }),
        ...(saveToPrivate !== undefined && { saveToPrivate }),
        ...(audioDuration !== undefined &&
          audioDuration > 0 && { durations: audioDuration }),
        // TTS 模式参数
        ...(audioFileSource === AudioInputType.TEXT_TO_AUDIO && {
          ttsText: ttsText!,
          voiceoverId: voiceoverId!,
          voiceSpeed: voiceSpeed!,
          ...(durations !== undefined && { durations }),
          ...(pronRules && pronRules.length > 0 && { pronRules }),
          ...(ttsTaskId && { ttsTaskId }),
          ...(emotionFrontName && { emotionFrontName })
        }),
        // 上传音频模式参数
        ...(audioFileSource === AudioInputType.UPLOAD_AUDIO && {
          audioS3Path: finalAudioS3Path!,
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
      formValues: VideoLipSyncFormValues,
      options?: {
        uploadedAudioFile?: File | null;
        audioRange?: { start: number; end: number } | null;
      }
    ) => {
      if (isSubmitting) return;

      setIsSubmitting(true);

      try {
        const { uploadedAudioFile, audioRange, creditConsumedForTracking } =
          options || {};
        const { ttsText } = formValues;

        // 1. 积分校验由调用方（GenerateButton + useVideoLipSyncPermission）负责，此处仅用计算结果
        const creditConsumption = calculateCreditConsumption(
          formValues,
          audioRange
        );

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

        // 4. 计算音频时长
        const audioDuration = calculateAudioDuration(formValues, audioRange);
        // 对于上传音频模式，必须验证音频时长
        // 对于 TTS 模式，允许没有音频时长（支持仅传文本创建任务）
        if (formValues.audioFileSource === AudioInputType.UPLOAD_AUDIO) {
          if (!audioDuration || audioDuration <= 0) {
            throw new Error('Invalid audio duration');
          }
        }

        // 5. 创建 Board 任务
        const boardTaskId = await createBoardTask({
          toolType: ToolType.VideoLipSync
        });

        // 6. 生成动态文件名：toolType + 日期
        const toolDisplayName = TAB_DISPLAY_NAME_MAP[ToolType.VideoLipSync];
        const dateStr = dayjs().format('YYYY-MM-DD');
        const dynamicFileName = `${toolDisplayName} ${dateStr}`;

        // 7. 构建 API 参数（使用动态生成的文件名，videoS3Path 已在立即上传时设置）
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

        // 8. 调用 API 创建任务
        await createTaskMutation.mutateAsync(apiParams);

        // 9. 插入任务到 Board
        await insertBoardTasksByIds([boardTaskId]);

        // 10. 切换视图
        switchToBoard();

        // 11. 显示成功提示
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
        console.error('[VideoLipSync] Failed to create task:', error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      calculateCreditConsumption,
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
