/**
 * ImageUpscale 模块配置
 */

import { TaskSource } from '@/server/api/services/_common/type';
import { ImageUpscaleResolution } from '@/server/api/services/imageUpscale/type';

// Re-export 枚举类型，便于组件层使用
export { ImageUpscaleResolution };

/** 任务来源 - Board */
export const TASK_SOURCE_BOARD = TaskSource.BOARD;

/** 每次生成的任务数量 */
export const IMAGE_UPSCALE_TASK_GENERATE_COUNT = 1;

/** 图片上传 S3 路径前缀 */
export const IMAGE_UPSCALE_S3_PATH_PREFIX =
  'analyzed_video/task/image_upscale/user_image';

/** 目标分辨率配置（使用枚举作为 key） */
export const TARGET_RESOLUTION_CONFIG: Record<
  ImageUpscaleResolution,
  {
    label: string;
    width: number;
    height: number;
    creditCost: number;
  }
> = {
  [ImageUpscaleResolution.RES_1K]: {
    label: '1K',
    width: 1024,
    height: 1024,
    creditCost: 0.8
  },
  [ImageUpscaleResolution.RES_2K]: {
    label: '2K',
    width: 2048,
    height: 2048,
    creditCost: 0.8
  },
  [ImageUpscaleResolution.RES_4K]: {
    label: '4K',
    width: 4096,
    height: 4096,
    creditCost: 1.4
  }
};

/** 目标分辨率选项 */
export const TARGET_RESOLUTION_OPTIONS = Object.entries(
  TARGET_RESOLUTION_CONFIG
).map(([value, config]) => ({
  value: value as ImageUpscaleResolution,
  label: config.label
}));

/** 图片上传配置 */
export const IMAGE_UPSCALE_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';
export const IMAGE_UPSCALE_IMAGE_MAX_SIZE = 10 * 1024 * 1024; // 10MB
export const IMAGE_UPSCALE_IMAGE_S3_PATH_PREFIX =
  'analyzed_video/task/image_upscale/user_image';

/**
 * 根据分辨率获取积分消耗
 */
export function getCreditCostByResolution(
  resolution: ImageUpscaleResolution
): number {
  return TARGET_RESOLUTION_CONFIG[resolution]?.creditCost ?? 1.0;
}

/**
 * 根据分辨率获取目标尺寸
 */
export function getTargetSizeByResolution(resolution: ImageUpscaleResolution): {
  width: number;
  height: number;
} {
  const config = TARGET_RESOLUTION_CONFIG[resolution];
  return {
    width: config?.width ?? 2048,
    height: config?.height ?? 2048
  };
}
