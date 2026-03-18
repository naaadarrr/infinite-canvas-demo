/**
 * AiAvatar Re-edit 处理 Hook
 * 将 task.parameters 映射为 AiAvatarFormValues
 * 在 Handler 层集中获取所有 URL，然后一次性设置 formValues
 */

import { useRecoilCallback } from 'recoil-next';
import { activeTabIdState } from '@/app/board/[id]/components/ToolPanel/store';
import {
  aiAvatarFormFamily,
  reEditLoadingFamily,
  type AiAvatarFormValues
} from '../store/atoms';
import {
  AudioInputType,
  PhotoAvatarVideoMode,
  VideoResolution,
  ExportedVideoType,
  PhotoAvatarType
} from '@/server/api/services/avatar4/type';
import type { PronRule } from '@/server/api/services/tts/type';
import { useFetchTtsTask } from '@/app/board/[id]/components/ToolPanel/components/avatar/AvatarScript/data/tts/useQueries';
import useAwsS3 from '@/hooks/useAwsS3';
import type { TaskParameters } from '@/server/api/services/board/common';
import { TaskSource, TaskStatus } from '@/server/api/services/_common/type';

/**
 * AiAvatar 任务参数类型（task.parameters 的精确定义）
 */
interface AiAvatarTaskParameters extends TaskParameters {
  // Avatar 相关
  aiavatarId?: string;
  avatarType?: PhotoAvatarType;
  imageS3Path?: string;

  // 音频相关
  audioFileSource?: AudioInputType;
  audioS3Path?: string;
  audioStartTime?: number;
  audioEndTime?: number;
  durations?: number;

  // TTS 相关
  ttsTaskId?: string;
  ttsText?: string;
  voiceoverId?: string;
  voiceSpeed?: number;
  pronRules?: PronRule[];

  // 视频相关
  mode?: PhotoAvatarVideoMode;
  fileName?: string;
  resolution?: VideoResolution;
  includeWatermark?: ExportedVideoType;
  captionKey?: string;
  positivePrompt?: string;
  source?: TaskSource;
  offPeak?: boolean;
}

export function useAiAvatarReEditHandler() {
  const { getCdnUrls } = useAwsS3();
  const fetchTtsTask = useFetchTtsTask();

  return useRecoilCallback(
    ({ snapshot, set }) =>
      async (parameters: TaskParameters) => {
        const activeTabId = snapshot.getLoadable(activeTabIdState).getValue();
        if (!activeTabId) return;

        // 类型断言为精确的 AiAvatar 参数类型
        const params = parameters as AiAvatarTaskParameters;
        const isTextToAudio =
          params.audioFileSource === AudioInputType.TEXT_TO_AUDIO;

        // 1. 设置 loading 状态
        set(reEditLoadingFamily(activeTabId), true);

        try {
          // 2. 获取模板图片 URL（直接使用 imageS3Path）
          let avatarTemplateUrl: string | undefined;

          if (params.imageS3Path) {
            const urls = await getCdnUrls({
              imageUrl: params.imageS3Path
            });
            avatarTemplateUrl = urls.imageUrl;
          }

          // 3. 根据音频模式处理
          let audioUrl: string | undefined;
          let ttsAudioUrl: string | undefined;
          let ttsPreviewDuration: number | undefined;
          let audioStartTime: number | undefined;
          let audioEndTime: number | undefined;

          if (isTextToAudio) {
            // TTS 模式：如果有 ttsTaskId，尝试恢复预览音频
            if (params.ttsTaskId) {
              try {
                const ttsResult = await fetchTtsTask({
                  taskId: params.ttsTaskId
                });

                // 检查任务状态是否成功
                if (
                  ttsResult.data?.status === TaskStatus.SUCCESS &&
                  ttsResult.data?.audioPath
                ) {
                  // 获取音频 CDN URL
                  const audioUrls = await getCdnUrls({
                    audioUrl: ttsResult.data.audioPath
                  });
                  ttsAudioUrl = audioUrls.audioUrl;
                  ttsPreviewDuration = ttsResult.data.durations?.[0];
                }
              } catch (error) {
                console.error(
                  '[AiAvatarReEdit] Failed to fetch TTS task:',
                  error
                );
                // TTS 任务查询失败不影响主流程，用户可以重新预览
              }
            }
          } else {
            // Upload Audio 模式
            if (params.audioS3Path) {
              const audioUrls = await getCdnUrls({
                audioUrl: params.audioS3Path
              });
              audioUrl = audioUrls.audioUrl;
            }

            // 裁剪后的音频：audioStartTime 设为 0，audioEndTime 设为 durations
            // 因为 audioS3Path 指向的是已裁剪的音频文件
            audioStartTime = 0;
            audioEndTime = params.durations;
          }

          // 4. 构建 formValues
          const formValues: AiAvatarFormValues = {
            // Avatar 相关
            aiavatarId: params.aiavatarId,
            avatarType: params.avatarType,
            imageS3Path: params.imageS3Path,
            avatarTemplateUrl,
            templateImageUrl: avatarTemplateUrl,

            // 音频相关
            audioFileSource:
              params.audioFileSource ?? AudioInputType.TEXT_TO_AUDIO,
            audioS3Path: params.audioS3Path,
            audioUrl,
            audioStartTime,
            audioEndTime,
            durations: params.durations,

            // TTS 相关
            ttsTaskId: params.ttsTaskId,
            ttsText: params.ttsText,
            voiceoverId: params.voiceoverId ?? '',
            voiceSpeed: params.voiceSpeed ?? 1,
            pronRules: params.pronRules,
            ttsAudioUrl,
            ttsPreviewDuration,
            // 每次 re-edit 时更新时间戳，用于触发 TTS 预览重新初始化
            reEditTimestamp: Date.now(),

            // 视频相关
            mode: params.mode ?? PhotoAvatarVideoMode.AVATAR_4,
            fileName: params.fileName ?? 'Untitled Video',
            resolution: params.resolution ?? VideoResolution.RESOLUTION_1080P,
            includeWatermark:
              params.includeWatermark ?? ExportedVideoType.NORMAL,
            captionKey: params.captionKey,
            positivePrompt: params.positivePrompt,
            source: params.source ?? TaskSource.BOARD,
            offPeak: params.offPeak,
            boardTaskId: '',

            // 前端专用字段（re-edit 时重置）
            avatarPhotoInputSource: undefined,
            shouldSaveToMyAvatar: undefined,
            estimatedCredits: undefined,
            isEstimatedCredits: undefined
          };

          set(aiAvatarFormFamily(activeTabId), formValues);
        } catch (error) {
          console.error('[AiAvatarReEdit] Failed to fetch URLs:', error);

          // 即使失败也设置基本的参数信息，让用户可以看到部分数据
          set(aiAvatarFormFamily(activeTabId), {
            aiavatarId: params.aiavatarId,
            avatarType: params.avatarType,
            imageS3Path: params.imageS3Path,
            audioFileSource:
              params.audioFileSource ?? AudioInputType.TEXT_TO_AUDIO,
            audioS3Path: params.audioS3Path,
            audioStartTime: isTextToAudio ? params.audioStartTime : 0,
            audioEndTime: isTextToAudio
              ? params.audioEndTime
              : params.durations,
            durations: params.durations,
            ttsTaskId: params.ttsTaskId,
            ttsText: params.ttsText,
            voiceoverId: params.voiceoverId ?? '',
            voiceSpeed: params.voiceSpeed ?? 1,
            pronRules: params.pronRules,
            mode: params.mode ?? PhotoAvatarVideoMode.AVATAR_4,
            fileName: params.fileName ?? 'Untitled Video',
            resolution: params.resolution ?? VideoResolution.RESOLUTION_1080P,
            includeWatermark:
              params.includeWatermark ?? ExportedVideoType.NORMAL,
            captionKey: params.captionKey,
            positivePrompt: params.positivePrompt,
            source: params.source ?? TaskSource.BOARD,
            offPeak: params.offPeak,
            boardTaskId: ''
          });
        } finally {
          // 清除 loading 状态
          set(reEditLoadingFamily(activeTabId), false);
        }
      },
    [getCdnUrls, fetchTtsTask]
  );
}
