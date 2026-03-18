/**
 * ImageUpscale 模块状态管理
 * 使用 atomFamily 实现按 tabId 隔离状态
 */

import { atomFamily } from 'recoil-next';
import { ImageUpscaleResolution } from '@/server/api/services/imageUpscale/type';

/** ImageUpscale 表单值类型 */
export interface ImageUpscaleFormValues {
  /** 源图片 URL (CDN URL，用于显示) */
  sourceImage: string | null;
  /** 源图片 S3 路径 (用于提交任务) */
  sourceImagePath: string | null;
  /** 目标分辨率 */
  targetResolution: ImageUpscaleResolution;
}

/** 默认表单值 */
export const DEFAULT_IMAGE_UPSCALE_FORM_VALUES: ImageUpscaleFormValues = {
  sourceImage: null,
  sourceImagePath: null,
  targetResolution: ImageUpscaleResolution.RES_2K
};

/**
 * ImageUpscale 表单状态 (atomFamily)
 * 按 tabId 隔离，每个标签页有独立状态
 */
export const imageUpscaleFormFamily = atomFamily<
  ImageUpscaleFormValues,
  string
>({
  key: 'ImageUpscaleFormFamily',
  default: DEFAULT_IMAGE_UPSCALE_FORM_VALUES
});

/**
 * 设置源图片（同时设置 URL 和 S3 路径）
 */
export interface SetSourceImageParams {
  url: string;
  s3Path: string;
}
