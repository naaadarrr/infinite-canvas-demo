/**
 * VideoLipSync 模板相关操作 Hook
 * 提供从模板库选择视频模板的功能
 */

import { useRecoilCallback } from 'recoil-next';
import { activeTabIdState } from '@/app/board/[id]/components/ToolPanel/store';
import { videoLipSyncFormFamily } from '../store/atoms';
import { videoLipSyncVoiceoverUiFamily } from '../store/voiceoverAtoms';
import { AssetInputSource } from '@/app/board/[id]/components/ToolPanel/components/avatar/types';

/**
 * 模板相关字段操作的 Hook
 * 提供从模板库选择视频模板的功能
 */
export function useVideoLipSyncTemplate() {
  /**
   * 从模板库选择模板
   * 设置 aiavatarId 和 videoUrl，清空用户上传的视频字段
   * 注意：提交任务时使用 aiavatarId（如果存在），否则使用 videoS3Path
   */
  const setTemplateFromLibrary = useRecoilCallback(
    ({ set, snapshot }) =>
      (values: { aiavatarId?: string; videoUrl: string }) => {
        const tabId = snapshot.getLoadable(activeTabIdState).getValue()!;
        set(videoLipSyncFormFamily(tabId), (prev) => ({
          ...prev,
          aiavatarId: values.aiavatarId,
          videoUrl: values.videoUrl,
          videoInputSource: undefined, // 从模板库选择时清空
          // 清空用户上传的视频字段
          videoS3Path: undefined,
          saveToPrivate: undefined // 从模板库选择时重置
        }));
      },
    []
  );

  /**
   * 从用户上传设置视频
   * 设置 videoUrl 和 videoS3Path，清空模板库相关字段
   * 注意：提交任务时使用 videoS3Path（直接使用 videoS3Path 字段，完全对齐后端接口）
   */
  const setTemplateFromUpload = useRecoilCallback(
    ({ set, snapshot }) =>
      (values: {
        url: string;
        s3Path: string;
        inputSource: AssetInputSource;
      }) => {
        const tabId = snapshot.getLoadable(activeTabIdState).getValue()!;
        set(videoLipSyncFormFamily(tabId), (prev) => ({
          ...prev,
          videoUrl: values.url,
          videoS3Path: values.s3Path, // 用户上传时，直接设置 videoS3Path（后端接口字段）
          videoInputSource: values.inputSource,
          // 清空模板库相关字段
          aiavatarId: undefined
        }));
      },
    []
  );

  /**
   * 设置音色
   * 直接设置 voiceoverId
   */
  const setVoiceover = useRecoilCallback(
    ({ set, snapshot }) =>
      (voiceoverId: string) => {
        const tabId = snapshot.getLoadable(activeTabIdState).getValue()!;
        set(videoLipSyncFormFamily(tabId), (prev) => ({
          ...prev,
          voiceoverId
        }));
      },
    []
  );

  /**
   * 清空模板
   * 清空所有模板相关字段（包括模板库和用户上传的）
   */
  const clearTemplate = useRecoilCallback(
    ({ set, snapshot }) =>
      () => {
        const tabId = snapshot.getLoadable(activeTabIdState).getValue()!;
        set(videoLipSyncFormFamily(tabId), (prev) => ({
          ...prev,
          // 清空模板库相关字段
          aiavatarId: undefined,
          videoUrl: undefined,
          // 清空用户上传的视频字段
          videoS3Path: undefined,
          videoInputSource: undefined
        }));
        // 清空模板推荐的音色提示
        set(videoLipSyncVoiceoverUiFamily(tabId), (prev) => {
          if (!prev.pendingVoiceoverId) return prev;
          return {
            ...prev,
            pendingVoiceoverId: undefined
          };
        });
      },
    []
  );

  /**
   * 模板联动音色：仅"提示"用户切换（不直接改 voiceoverId）
   * - 若 templateVoiceoverId 与当前 voiceoverId 不同，写入 pendingVoiceoverId
   * - 若相同或为空，则清空 pendingVoiceoverId
   */
  const suggestTemplateVoiceover = useRecoilCallback(
    ({ set, snapshot }) =>
      (templateVoiceoverId?: string) => {
        const tabId = snapshot.getLoadable(activeTabIdState).getValue()!;
        const currentVoiceoverId = snapshot
          .getLoadable(videoLipSyncFormFamily(tabId))
          .getValue().voiceoverId;

        set(videoLipSyncVoiceoverUiFamily(tabId), (prev) => {
          if (
            !templateVoiceoverId ||
            templateVoiceoverId === currentVoiceoverId
          ) {
            if (!prev.pendingVoiceoverId) return prev;
            return {
              ...prev,
              pendingVoiceoverId: undefined
            };
          }

          if (prev.pendingVoiceoverId === templateVoiceoverId) return prev;
          return {
            ...prev,
            pendingVoiceoverId: templateVoiceoverId
          };
        });
      },
    []
  );

  return {
    setTemplateFromLibrary,
    setTemplateFromUpload,
    setVoiceover,
    clearTemplate,
    suggestTemplateVoiceover
  };
}
