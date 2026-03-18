// AI Avatar 模型配置

import { PhotoAvatarVideoMode } from '@/server/api/services/avatar4/type';
import { prefixed } from '@/utils/path';

/** AI Avatar 模型配置接口 */
export interface AiAvatarModelConfig {
  mode: PhotoAvatarVideoMode;
  name: string;
  tag?: string;
  previewVideoUrl: string;
  posterUrl: string;
  features: string[];
  /** 每秒消耗的积分 */
  creditsPerSecond: number;
}

/** AI Avatar 模型列表 */
export const AI_AVATAR_MODELS: AiAvatarModelConfig[] = [
  {
    mode: PhotoAvatarVideoMode.AVATAR_4,
    name: 'Avatar 4',
    previewVideoUrl: prefixed(
      '/avatar-video-creation/video_generation_mode_avatar_4.mp4'
    ),
    posterUrl: prefixed(
      '/avatar-video-creation/video_generation_mode_avatar_4_poster.jpg'
    ),
    features: [
      'Character actions automatically match the audio rhythm; support prompt-based control of character movements.',
      'Up to 120 seconds per video.'
    ],
    creditsPerSecond: 0.1
  },
  {
    mode: PhotoAvatarVideoMode.AVATAR_4_FAST,
    name: 'Avatar 4 Fast',
    previewVideoUrl: prefixed(
      '/avatar-video-creation/video_generation_mode_avatar_4.mp4'
    ),
    posterUrl: prefixed(
      '/avatar-video-creation/video_generation_mode_avatar_4_poster.jpg'
    ),
    features: [
      'Cheaper and faster, with slightly lower quality than Avatar 4.'
    ],
    creditsPerSecond: 0.06
  }
];

/** 根据 mode 获取模型配置 */
export function getModelConfigByMode(
  mode: PhotoAvatarVideoMode
): AiAvatarModelConfig | undefined {
  return AI_AVATAR_MODELS.find((model) => model.mode === mode);
}

/** 根据 mode 获取每秒积分消耗 */
export function getCreditsPerSecondByMode(mode: PhotoAvatarVideoMode): number {
  const config = getModelConfigByMode(mode);
  return config?.creditsPerSecond ?? 0.1; // 默认 0.1
}

/** 默认模式 */
export const DEFAULT_AI_AVATAR_MODE = PhotoAvatarVideoMode.AVATAR_4;

/**
 * 音频文件接受类型
 */
export const VIDEO_AVATAR_AUDIO_ACCEPT =
  'audio/mp3,audio/m4a,audio/x-m4a,audio/wav,audio/mpeg';
/**
 * 音频文件 S3 路径前缀
 */
export const AUDIO_S3_PATH_PREFIX = 'analyzed_video/task/avatar_4/audio';

/**
 * 图片文件 S3 路径前缀
 */
export const IMAGE_S3_PATH_PREFIX = 'analyzed_video/task/avatar_4/image';

/**
 * Avatar 4 模式最大输入文本长度（显示限制 - 付费用户）
 */
export const AVATAR_4_MODE_MAX_INPUT_TEXT_LENGTH = 2700;

/**
 * Avatar 4 模式免费用户最大输入文本长度（显示限制）
 */
export const AVATAR_4_MODE_MAX_INPUT_TEXT_LENGTH_FREE = 450;

/**
 * Avatar 4 模式最大输入文本长度硬限制（实际限制 - 付费用户，显示值的 150%）
 */
export const AVATAR_4_MODE_MAX_INPUT_TEXT_LENGTH_HARD = 4050;

/**
 * Avatar 4 模式免费用户最大输入文本长度硬限制（实际限制，显示值的 150%）
 */
export const AVATAR_4_MODE_MAX_INPUT_TEXT_LENGTH_FREE_HARD = 675;

/**
 * Avatar 4 模式免费用户最大输入音频时长 (秒)
 */
export const AVATAR_4_MODE_MAX_INPUT_AUDIO_DURATION_FREE = 30;

/**
 * Avatar 4 模式最大音频时长（秒）
 */
export const AVATAR_4_MODE_MAX_INPUT_AUDIO_DURATION = 180;

/**
 * TTS 音频预览每次消耗的积分
 */
export const VIDEO_AVATAR_TTS_AUDIO_CREDITS_PER_PREVIEW = 0.1;

/**
 * Avatar 4 模式积分计算相关常量
 */
export const AVATAR_4_MODE_CREDITS_PER_SECOND = 0.1;

/**
 * Avatar 4 Fast 模式积分计算相关常量
 */
export const AVATAR_4_FAST_MODE_CREDITS_PER_SECOND = 0.06;

/**
 * 非高峰模式积分折扣（50% 折扣）
 */
export const OFF_PEAK_MODE_CREDIT_DISCOUNT = 0.5;

/**
 * 图片上传配置
 */
export const AI_AVATAR_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';
export const AI_AVATAR_IMAGE_MAX_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * 图片处理配置
 */
export const AI_AVATAR_IMAGE_MAX_WIDTH = 1024;
export const AI_AVATAR_IMAGE_MAX_HEIGHT = 1024;
export const AI_AVATAR_IMAGE_MAX_RESIZE_QUALITY = 0.9;
export const AI_AVATAR_DEFAULT_PROCESS_IMAGE_FORMAT = 'jpeg';

/**
 * 拖拽和上传相关常量
 */
export const DRAG_DATA_FORMAT_JSON = 'application/json';
export const IMAGE_MIME_TYPE_PREFIX = 'image/';

/**
 * 自定义动作最大长度
 */
export const CUSTOM_MOTION_MAX_LENGTH = 600;
