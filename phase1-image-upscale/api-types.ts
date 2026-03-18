/**
 * Image Upscale API 类型定义
 * 从 apps/base/src/server/api/services/imageUpscale/type.ts 提取
 *
 * 目标仓库无 tRPC，直接使用这些类型配合 axios/fetch 调用 API
 */

/**
 * 图片放大分辨率枚举
 */
export enum ImageUpscaleResolution {
  RES_1K = '1k',
  RES_2K = '2k',
  RES_4K = '4k'
}

/**
 * 创建图片放大任务 - 请求参数
 * POST /common_task/image_upscale/submit
 */
export interface CreateImageUpscaleTaskParams {
  boardTaskId: string;
  inputImagePath: string;
  resolution: ImageUpscaleResolution;
  source?: string;
  mainTaskId?: string;
  parentTaskId?: string;
}

/**
 * 创建图片放大任务 - 响应
 */
export interface CreateImageUpscaleTaskResponse {
  code: string;
  message: string;
  result: string; // taskId
}

/**
 * 查询图片放大任务 - 请求参数
 * GET /common_task/image_upscale/detail
 */
export interface QueryImageUpscaleTaskParams {
  taskId: string;
}

/**
 * 任务状态枚举
 */
export enum TaskStatus {
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed'
}

/**
 * 图片放大任务详情
 */
export interface ImageUpscaleTaskDetail {
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
  inputImagePath: string;
  inputImageUrl: string;
  outputImagePath?: string;
  outputImageUrl?: string;
}

/**
 * 查询图片放大任务 - 响应
 */
export interface QueryImageUpscaleTaskResponse {
  code: string;
  message: string;
  result: ImageUpscaleTaskDetail;
}
