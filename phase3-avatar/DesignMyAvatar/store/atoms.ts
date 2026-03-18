/**
 * DesignMyAvatar 模块独立 Store
 * 设计 Avatar 工具的表单状态
 */

import { atomFamily } from 'recoil-next';
import type { DesignMyAvatarFormValues } from '../type';
import { DEFAULT_VALUES } from '../config';
import { AvatarFaceFromTypeEnum } from '@/server/api/services/promptToAvatar/type';

/**
 * 默认值
 */
export const DEFAULT_DESIGN_MY_AVATAR_VALUES: DesignMyAvatarFormValues = {
  // 模型配置
  modelId: 'design-avatar-standard',

  // 人脸来源
  faceSource: AvatarFaceFromTypeEnum.photo,
  avatarFaceS3Key: '',
  avatarFaceS3Url: '',

  // 基础属性
  gender: DEFAULT_VALUES.gender,
  age: DEFAULT_VALUES.age,
  country: DEFAULT_VALUES.country,

  // 风格配置
  style: DEFAULT_VALUES.style,
  ratio: DEFAULT_VALUES.ratio,

  // 提示词
  prompt: ''
};

/**
 * 按 TabId 隔离的 DesignMyAvatar 表单状态
 */
export const designMyAvatarFormFamily = atomFamily<
  DesignMyAvatarFormValues,
  string
>({
  key: 'designMyAvatarForm',
  default: DEFAULT_DESIGN_MY_AVATAR_VALUES
});
