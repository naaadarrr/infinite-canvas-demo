/**
 * DesignMyAvatar Re-edit 处理 Hook
 * 将 task.parameters 映射为 DesignMyAvatarFormValues
 * 若有 avatarFaceS3Key 会请求 getFileUrl 获取预览 URL 并写入表单
 */

import { useRef } from 'react';
import { useRecoilCallback } from 'recoil-next';
import { activeTabIdState } from '@/app/board/[id]/components/ToolPanel/store';
import {
  designMyAvatarFormFamily,
  DEFAULT_DESIGN_MY_AVATAR_VALUES
} from '../store/atoms';
import type { TaskParameters } from '@/server/api/services/board/common';
import type { DesignMyAvatarFormValues } from '../type';
import { AvatarFaceFromTypeEnum } from '@/server/api/services/promptToAvatar/type';
import type {
  PromptToAvatarStyle,
  VideoAspectRatioValue
} from '@/server/api/services/promptToAvatar/type';
import { trpc } from '@/lib/trpc/client';
import { wrapMutation } from '@/lib/trpc/helper';

/**
 * DesignMyAvatar 任务参数类型（task.parameters 的精确定义）
 * 与提交任务时的字段保持一致
 */
interface DesignMyAvatarTaskParameters extends TaskParameters {
  modelId?: string;
  /** 人脸来源：0-prompt, 1-photo */
  avatarFaceFromType?: AvatarFaceFromTypeEnum;
  faceSource?: AvatarFaceFromTypeEnum;
  /** 头像照片 S3 key（Photo 模式） */
  avatarFaceS3Key?: string;
  gender?: string;
  age?: string;
  country?: string;
  style?: PromptToAvatarStyle;
  /** 提交时用 aspectRatio，与表单 ratio 一致 */
  aspectRatio?: VideoAspectRatioValue;
  ratio?: VideoAspectRatioValue;
  prompt?: string;
}

export function useDesignMyAvatarReEditHandler() {
  const getFileUrlMutation = wrapMutation(
    trpc.common.aws.getFileUrl.useMutation()
  );
  const getFileUrlRef = useRef(getFileUrlMutation);
  getFileUrlRef.current = getFileUrlMutation;

  return useRecoilCallback(
    ({ snapshot, set }) =>
      async (parameters: TaskParameters) => {
        const activeTabId = snapshot.getLoadable(activeTabIdState).getValue();
        if (!activeTabId) return;

        const params = parameters as DesignMyAvatarTaskParameters;
        const faceSource =
          params.avatarFaceFromType ??
          params.faceSource ??
          AvatarFaceFromTypeEnum.photo;
        const ratio =
          params.aspectRatio ??
          params.ratio ??
          DEFAULT_DESIGN_MY_AVATAR_VALUES.ratio;

        let avatarFaceS3Url = '';
        const avatarFaceS3Key = params.avatarFaceS3Key ?? '';
        if (avatarFaceS3Key) {
          try {
            const data = await getFileUrlRef.current.mutateAsync({
              filePath: avatarFaceS3Key
            });
            avatarFaceS3Url = data?.fileUrl ?? '';
          } catch (_e) {
            // 获取 URL 失败时仍回填 key，预览由上传组件按需再请求
          }
        }

        const formValues: DesignMyAvatarFormValues = {
          ...DEFAULT_DESIGN_MY_AVATAR_VALUES,
          modelId: params.modelId ?? DEFAULT_DESIGN_MY_AVATAR_VALUES.modelId,
          faceSource,
          avatarFaceS3Key,
          avatarFaceS3Url,
          gender: params.gender ?? DEFAULT_DESIGN_MY_AVATAR_VALUES.gender,
          age: params.age ?? DEFAULT_DESIGN_MY_AVATAR_VALUES.age,
          country: params.country ?? DEFAULT_DESIGN_MY_AVATAR_VALUES.country,
          style: params.style ?? DEFAULT_DESIGN_MY_AVATAR_VALUES.style,
          ratio,
          prompt: params.prompt ?? ''
        };

        set(designMyAvatarFormFamily(activeTabId), formValues);
      },
    []
  );
}
