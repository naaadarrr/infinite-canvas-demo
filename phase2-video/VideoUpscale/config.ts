/**
 * VideoUpscale 模块配置
 */

import { TaskSource } from '@/server/api/services/_common/type';
import { VideoUpscaleResolution } from '@/server/api/services/videoUpscale/type';

// Re-export 枚举类型，便于组件层使用
export { VideoUpscaleResolution };

/** 任务来源 - Board */
export const TASK_SOURCE_BOARD = TaskSource.BOARD;

/** 每次生成的任务数量 */
export const VIDEO_UPSCALE_TASK_GENERATE_COUNT = 1;

/** 视频上传 S3 路径前缀 */
export const VIDEO_UPSCALE_S3_PATH_PREFIX =
  'analyzed_video/task/video_upscale/user_video';

/** 视频上传最大文件大小 (500MB) */
export const VIDEO_UPSCALE_VIDEO_MAX_SIZE = 500 * 1024 * 1024;

/** 视频最大时长限制 (10分钟 = 600秒) */
export const VIDEO_UPSCALE_VIDEO_MAX_DURATION = 10 * 60;

/** 目标分辨率配置（使用枚举作为 key） */
export const TARGET_RESOLUTION_CONFIG: Record<
  VideoUpscaleResolution,
  {
    label: string;
    /** 每分钟积分消耗 */
    creditPerMinute: number;
  }
> = {
  [VideoUpscaleResolution.RES_1K]: {
    label: '1080p',
    creditPerMinute: 1.2
  },
  [VideoUpscaleResolution.RES_2K]: {
    label: '2K',
    creditPerMinute: 2.4
  },
  [VideoUpscaleResolution.RES_4K]: {
    label: '4K',
    creditPerMinute: 4.8
  }
};

/** 目标分辨率选项 */
export const TARGET_RESOLUTION_OPTIONS = Object.entries(
  TARGET_RESOLUTION_CONFIG
).map(([value, config]) => ({
  value: value as VideoUpscaleResolution,
  label: config.label
}));

/**
 * 根据分辨率获取每分钟积分消耗
 */
export function getCreditPerMinuteByResolution(
  resolution: VideoUpscaleResolution | string
): number {
  return (
    TARGET_RESOLUTION_CONFIG[resolution as VideoUpscaleResolution]
      ?.creditPerMinute ?? 6
  );
}
