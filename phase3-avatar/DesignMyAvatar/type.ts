// DesignMyAvatar 类型定义

import {
  AvatarFaceFromTypeEnum,
  PromptToAvatarStyle,
  type VideoAspectRatioValue
} from '@/server/api/services/promptToAvatar/type';

// DesignMyAvatar 表单值类型
export interface DesignMyAvatarFormValues {
  // ========== 模型配置 ==========
  /** 当前选中的模型 ID */
  modelId: string;

  // ========== 人脸来源 ==========
  /** 人脸来源模式 */
  faceSource: AvatarFaceFromTypeEnum;
  /** Avatar 头像照片 S3 路径（上传模式）*/
  avatarFaceS3Key: string;
  /** Avatar 头像照片 URL（上传模式）*/
  avatarFaceS3Url: string;

  // ========== 基础属性 ==========
  /** 性别 */
  gender: string;
  /** 年龄范围 */
  age: string;
  /** 国家/地区 */
  country: string;

  // ========== 风格配置 ==========
  /** 风格 */
  style: PromptToAvatarStyle;
  /** 宽高比 */
  ratio: VideoAspectRatioValue;

  // ========== 提示词 ==========
  /** 自定义提示词 */
  prompt: string;
}
