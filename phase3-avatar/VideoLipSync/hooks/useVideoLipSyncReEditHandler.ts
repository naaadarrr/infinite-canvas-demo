/**
 * VideoLipSync Re-edit 处理 Hook
 * 将 task.parameters 映射为 VideoLipSyncFormValues
 * 在 Handler 层集中获取所有 URL，然后一次性设置 formValues
 */

import { useRecoilCallback } from 'recoil-next';
import { activeTabIdState } from '@/app/board/[id]/components/ToolPanel/store';
import {
  videoLipSyncFormFamily,
  reEditLoadingFamily,
  type VideoLipSyncFormValues
} from '../store/atoms';
import {
  AudioInputType,
  VideoResolution
} from '@/server/api/services/avatar4/type';
import {
  AvatarVideoCreationMode,
  AvatarVideoCreationVersion
} from '@/server/api/services/avatarVideoCreation/type';
import type { PronRule } from '@/server/api/services/tts/type';
import { useFetchTtsTask } from '@/app/board/[id]/components/ToolPanel/components/avatar/AvatarScript/data/tts/useQueries';
import useAwsS3 from '@/hooks/useAwsS3';
import type { TaskParameters } from '@/server/api/services/board/common';
import { TaskSource, TaskStatus } from '@/server/api/services/_common/type';
import { useFetchAiAvatarDetail } from '../data/mediaLibrary/useQueries';

/**
 * VideoLipSync 任务参数类型（task.parameters 的精确定义）
 */
interface VideoLipSyncTaskParameters extends TaskParameters {
  // 视频相关
  videoS3Path?: string;
  aiavatarId?: string;

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
  emotionFrontName?: string;

  // 配置相关
  fileName?: string;
  resolution?: VideoResolution;
  mode?: AvatarVideoCreationMode;
  version?: AvatarVideoCreationVersion;
  captionKey?: string;
  saveToPrivate?: boolean;
  source?: TaskSource;
}

export function useVideoLipSyncReEditHandler() {
  const { getCdnUrls } = useAwsS3();
  const fetchTtsTask = useFetchTtsTask();
  const fetchAiAvatarDetail = useFetchAiAvatarDetail();

  return useRecoilCallback(
    ({ snapshot, set }) =>
      async (parameters: TaskParameters) => {
        const activeTabId = snapshot.getLoadable(activeTabIdState).getValue();
        if (!activeTabId) return;

        // 类型断言为精确的 VideoLipSync 参数类型
        const params = parameters as VideoLipSyncTaskParameters;
        const isTextToAudio =
          params.audioFileSource === AudioInputType.TEXT_TO_AUDIO;

        // 1. 设置 loading 状态
        set(reEditLoadingFamily(activeTabId), true);

        try {
          // 2. 获取视频 URL（上传视频用 CDN；仅 aiavatarId 时用详情接口取预览 URL）
          let videoUrl: string | undefined;

          if (params.videoS3Path) {
            const urls = await getCdnUrls({
              videoUrl: params.videoS3Path
            });
            videoUrl = urls.videoUrl;
          } else if (params.aiavatarId) {
            try {
              const detailRes = await fetchAiAvatarDetail({
                aiAvatarId: params.aiavatarId
              });

              const avatar = detailRes?.data;
              if (avatar) {
                videoUrl =
                  avatar.previewVideoUrl ??
                  avatar.inputVideoPlayUrl ??
                  undefined;
              }
            } catch (error) {
              console.error(
                '[VideoLipSyncReEdit] Failed to fetch AI avatar detail:',
                error
              );
            }
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
                  '[VideoLipSyncReEdit] Failed to fetch TTS task:',
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
          const formValues: VideoLipSyncFormValues = {
            // 视频相关
            videoS3Path: params.videoS3Path,
            videoUrl,
            aiavatarId: params.aiavatarId,

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
            emotionFrontName: params.emotionFrontName,
            ttsAudioUrl,
            ttsPreviewDuration,
            // 每次 re-edit 时更新时间戳，用于触发 TTS 预览重新初始化
            reEditTimestamp: Date.now(),

            // 配置相关
            fileName: params.fileName ?? 'Untitled Video',
            resolution: params.resolution ?? VideoResolution.RESOLUTION_1080P,
            mode: params.mode ?? AvatarVideoCreationMode.NORMAL,
            version: params.version ?? AvatarVideoCreationVersion.V2,
            captionKey: params.captionKey,
            saveToPrivate: params.saveToPrivate,
            source: params.source ?? TaskSource.BOARD,
            boardTaskId: '',

            // 前端专用字段（re-edit 时重置）
            videoInputSource: undefined
          };

          set(videoLipSyncFormFamily(activeTabId), formValues);
        } catch (error) {
          console.error('[VideoLipSyncReEdit] Failed to fetch URLs:', error);

          // 即使失败也设置基本的参数信息，让用户可以看到部分数据
          set(videoLipSyncFormFamily(activeTabId), {
            videoS3Path: params.videoS3Path,
            aiavatarId: params.aiavatarId,
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
            emotionFrontName: params.emotionFrontName,
            fileName: params.fileName ?? 'Untitled Video',
            resolution: params.resolution ?? VideoResolution.RESOLUTION_1080P,
            mode: params.mode ?? AvatarVideoCreationMode.NORMAL,
            version: params.version ?? AvatarVideoCreationVersion.V2,
            captionKey: params.captionKey,
            saveToPrivate: params.saveToPrivate,
            source: params.source ?? TaskSource.BOARD,
            boardTaskId: ''
          });
        } finally {
          // 清除 loading 状态
          set(reEditLoadingFamily(activeTabId), false);
        }
      },
    [getCdnUrls, fetchTtsTask, fetchAiAvatarDetail]
  );
}
