/**
 * AiAvatar 模板相关操作 Hook
 * 提供两种方式设置模板：从模板库选择或用户上传
 */

import { useRecoilCallback } from 'recoil-next';
import { PhotoAvatarType } from '@/server/api/services/avatar4/type';
import { activeTabIdState } from '@/app/board/[id]/components/ToolPanel/store';
import { aiAvatarFormFamily } from '../store/atoms';
import { AssetInputSource } from '@/app/board/[id]/components/ToolPanel/components/avatar/types';
import { aiAvatarVoiceoverUiFamily } from '../store/voiceoverAtoms';

/**
 * 模板相关字段操作的 Hook
 * 提供两种方式设置模板：从模板库选择或用户上传
 */
export function useAiAvatarTemplate() {
  /**
   * 从模板库选择模板
   * 设置 aiavatarId、avatarType 和 avatarTemplateUrl，清空用户上传的模板字段
   * 注意：提交任务时使用 aiavatarId，不需要 imageS3Path
   */
  const setTemplateFromLibrary = useRecoilCallback(
    ({ set, snapshot }) =>
      (values: {
        aiavatarId: string;
        avatarTemplateUrl: string;
        avatarType: PhotoAvatarType;
      }) => {
        const tabId = snapshot.getLoadable(activeTabIdState).getValue()!;
        set(aiAvatarFormFamily(tabId), (prev) => ({
          ...prev,
          aiavatarId: values.aiavatarId,
          avatarType: values.avatarType,
          avatarTemplateUrl: values.avatarTemplateUrl,
          avatarPhotoInputSource: undefined,
          shouldSaveToMyAvatar: undefined,
          // 清空用户上传的模板字段
          templateImageUrl: undefined,
          imageS3Path: undefined // 从模板库选择时，提交任务使用 aiavatarId，不需要 imageS3Path
        }));
      },
    []
  );

  /**
   * 从用户上传设置模板
   * 设置 templateImageUrl 和 imageS3Path，清空模板库相关字段
   * 注意：提交任务时使用 imageS3Path（直接使用 imageS3Path 字段，完全对齐后端接口）
   */
  const setTemplateFromUpload = useRecoilCallback(
    ({ set, snapshot }) =>
      (values: {
        url: string;
        s3Path: string;
        inputSource: AssetInputSource;
      }) => {
        const tabId = snapshot.getLoadable(activeTabIdState).getValue()!;
        const shouldSaveToMyAvatar =
          values.inputSource === AssetInputSource.LOCAL_UPLOAD;
        set(aiAvatarFormFamily(tabId), (prev) => ({
          ...prev,
          templateImageUrl: values.url,
          imageS3Path: values.s3Path, // 用户上传时，直接设置 imageS3Path（后端接口字段）
          avatarPhotoInputSource: values.inputSource,
          shouldSaveToMyAvatar,
          // 清空模板库相关字段
          aiavatarId: undefined,
          avatarType: undefined,
          avatarTemplateUrl: undefined
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
        set(aiAvatarFormFamily(tabId), (prev) => ({
          ...prev,
          avatarPhotoInputSource: undefined,
          shouldSaveToMyAvatar: undefined,
          // 清空模板库相关字段
          aiavatarId: undefined,
          avatarType: undefined,
          avatarTemplateUrl: undefined,
          // 清空用户上传的模板字段
          templateImageUrl: undefined,
          imageS3Path: undefined
        }));
      },
    []
  );

  /**
   * 模板联动音色：仅“提示”用户切换（不直接改 voiceoverId）
   * - 若 templateVoiceoverId 与当前 voiceoverId 不同，写入 pendingVoiceoverId
   * - 若相同或为空，则清空 pendingVoiceoverId
   */
  const suggestTemplateVoiceover = useRecoilCallback(
    ({ set, snapshot }) =>
      (templateVoiceoverId?: string) => {
        const tabId = snapshot.getLoadable(activeTabIdState).getValue()!;
        const currentVoiceoverId = snapshot
          .getLoadable(aiAvatarFormFamily(tabId))
          .getValue().voiceoverId;

        set(aiAvatarVoiceoverUiFamily(tabId), (prev) => {
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
    clearTemplate,
    suggestTemplateVoiceover
  };
}
