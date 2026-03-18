// VideoLipSync 配置文件
// 包含视频口型同步工具相关的常量配置

import { RESOURCE_SUBS_TYPE } from '@/types/benefit/resources';

/**
 * 视频口型同步最大输入文本长度（按会员等级）
 * - FREE: 4,000 字符
 * - STARTER / PRO: 8,000 字符
 * - BUSINESS: 24,000 字符
 */
export const VIDEO_LIP_SYNC_MAX_INPUT_TEXT_LENGTH_MAP: Record<
  RESOURCE_SUBS_TYPE,
  number
> = {
  [RESOURCE_SUBS_TYPE.FREE]: 4000,
  [RESOURCE_SUBS_TYPE.STARTER]: 8000,
  [RESOURCE_SUBS_TYPE.PRO]: 8000,
  [RESOURCE_SUBS_TYPE.BUSINESS]: 24000
};

/**
 * 视频口型同步最大输入文本长度硬限制（按会员等级，与显示限制一致）
 */
export const VIDEO_LIP_SYNC_MAX_INPUT_TEXT_LENGTH_HARD_MAP: Record<
  RESOURCE_SUBS_TYPE,
  number
> = {
  [RESOURCE_SUBS_TYPE.FREE]: 4000,
  [RESOURCE_SUBS_TYPE.STARTER]: 8000,
  [RESOURCE_SUBS_TYPE.PRO]: 8000,
  [RESOURCE_SUBS_TYPE.BUSINESS]: 24000
};

/**
 * 视频口型同步最大输入音频时长（按会员等级，单位：秒）
 * - FREE: 300 秒（5 分钟）
 * - STARTER / PRO: 600 秒（10 分钟）
 * - BUSINESS: 1,800 秒（30 分钟）
 */
export const VIDEO_LIP_SYNC_MAX_INPUT_AUDIO_DURATION_MAP: Record<
  RESOURCE_SUBS_TYPE,
  number
> = {
  [RESOURCE_SUBS_TYPE.FREE]: 60 * 5, // 300 秒
  [RESOURCE_SUBS_TYPE.STARTER]: 60 * 10, // 600 秒
  [RESOURCE_SUBS_TYPE.PRO]: 60 * 10, // 600 秒
  [RESOURCE_SUBS_TYPE.BUSINESS]: 60 * 30 // 1800 秒
};

/**
 * 音频最小时长（秒）
 */
export const VIDEO_LIP_SYNC_AUDIO_MIN_DURATION = 2;

/**
 * 积分计算常量：每 30 秒 = 1 credit
 */
export const VIDEO_LIP_SYNC_SECONDS_PER_CREDIT = 30;

/**
 * 积分计算常量：每 400 字符 = 1 credit
 */
export const VIDEO_LIP_SYNC_CHARACTERS_PER_CREDIT = 400;

/**
 * 音频文件接受类型
 */
export const VIDEO_LIP_SYNC_AUDIO_ACCEPT =
  'audio/mp3,audio/m4a,audio/x-m4a,audio/wav,audio/mpeg';

/**
 * 音频文件 S3 路径前缀
 */
export const AUDIO_S3_PATH_PREFIX =
  'analyzed_video/task/independent_aiavatar/audio';

/**
 * 视频文件 S3 路径前缀
 */
export const VIDEO_S3_PATH_PREFIX =
  'analyzed_video/task/independent_aiavatar/video';

/**
 * VideoLipSync TTS 任务类型
 * 对应旧项目的 TTSTaskType.videoAvatarPaid = 11
 */
export const VIDEO_LIP_SYNC_TTS_TASK_TYPE = 11;
