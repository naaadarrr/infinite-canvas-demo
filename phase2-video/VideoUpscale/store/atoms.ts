/**
 * VideoUpscale 模块状态管理
 * 使用 atomFamily 实现按 tabId 隔离状态
 */

import { atomFamily } from 'recoil-next';
import { VideoUpscaleResolution } from '../config';

/** VideoUpscale 表单值类型 */
export interface VideoUpscaleFormValues {
  /** 源视频 URL（用于预览） */
  sourceVideo: string | null;
  /** 源视频 S3 路径（用于提交任务） */
  sourceVideoPath: string | null;
  /** 目标分辨率 */
  targetResolution: VideoUpscaleResolution;
}

/** 默认表单值 */
export const DEFAULT_VIDEO_UPSCALE_FORM_VALUES: VideoUpscaleFormValues = {
  sourceVideo: null,
  sourceVideoPath: null,
  targetResolution: VideoUpscaleResolution.RES_1K
};

/**
 * VideoUpscale 表单状态 (atomFamily)
 * 按 tabId 隔离，每个标签页有独立状态
 */
export const videoUpscaleFormFamily = atomFamily<
  VideoUpscaleFormValues,
  string
>({
  key: 'VideoUpscaleFormFamily',
  default: DEFAULT_VIDEO_UPSCALE_FORM_VALUES
});
