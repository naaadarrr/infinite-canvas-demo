/**
 * Video Upscale API 类型定义
 * 从 apps/base/src/server/api/services/videoUpscale/type.ts 提取
 *
 * 目标仓库无 tRPC，直接使用这些类型配合 axios/fetch 调用 API
 */

export enum VideoUpscaleResolution {
  RES_1K = '1080p',
  RES_2K = '2K',
  RES_4K = '4K'
}

/**
 * 创建视频放大任务 - 请求参数
 * POST /common_task/video_flash_vsr/submit
 */
export interface CreateVideoUpscaleTaskParams {
  inputVideoPath: string;
  resolution: VideoUpscaleResolution;
  /** 视频时长（秒），必填 */
  duration: number;
  source?: string;
  mainTaskId?: string;
  parentTaskId?: string;
  boardTaskId?: string;
}

export interface CreateVideoUpscaleTaskResponse {
  code: string;
  message: string;
  result: string; // taskId
}

export interface QueryVideoUpscaleTaskParams {
  taskId: string;
}

export enum TaskStatus {
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed'
}

export interface VideoUpscaleTaskDetail {
  taskId: string;
  projectId: string;
  status: TaskStatus;
  uid: string;
  teamId: string;
  source?: string;
  gmtCreate: string;
  gmtModify: string;
  errorCode?: string | null;
  errorMsg?: string | null;
  inputVideoPath: string;
  inputVideoUrl: string;
  outputVideoPath?: string | null;
  outputVideoUrl?: string | null;
  resolution: string;
}

export interface QueryVideoUpscaleTaskResponse {
  code: string;
  message: string;
  result: VideoUpscaleTaskDetail;
}
