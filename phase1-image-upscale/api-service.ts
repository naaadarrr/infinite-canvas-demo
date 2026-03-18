/**
 * Image Upscale API 调用函数
 * 从 apps/base/src/server/api/services/imageUpscale/index.ts 提取
 *
 * 原仓库通过 tRPC router -> service -> axios 调用后端
 * 目标仓库无 tRPC，直接用 axios 调用
 *
 * 实际 API 端点：
 *   创建任务: POST {BASE_URL}/common_task/image_upscale/submit
 *   查询任务: GET  {BASE_URL}/common_task/image_upscale/detail?taskId=xxx
 */

import axios from 'axios';
import type {
  CreateImageUpscaleTaskParams,
  CreateImageUpscaleTaskResponse,
  QueryImageUpscaleTaskParams,
  QueryImageUpscaleTaskResponse
} from './api-types';

// TODO: 替换为你项目的 BASE_URL
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

/**
 * 创建图片放大任务
 *
 * @example
 * const result = await createImageUpscaleTask({
 *   boardTaskId: "board_task_123",
 *   inputImagePath: "s3://bucket/path/to/image.jpg",
 *   resolution: ImageUpscaleResolution.RES_2K,
 *   source: "board"
 * });
 * console.log(result.result); // "task_123456"
 */
export const createImageUpscaleTask = (
  params: CreateImageUpscaleTaskParams
): Promise<CreateImageUpscaleTaskResponse> =>
  axios
    .post(`${BASE_URL}/common_task/image_upscale/submit`, params)
    .then(({ data }) => data);

/**
 * 查询图片放大任务详情
 *
 * @example
 * const result = await queryImageUpscaleTask({ taskId: "task_123456" });
 * console.log(result.result.status); // "success"
 * console.log(result.result.outputImageUrl); // "https://cdn.../output.jpg"
 */
export const queryImageUpscaleTask = (
  params: QueryImageUpscaleTaskParams
): Promise<QueryImageUpscaleTaskResponse> =>
  axios
    .get(`${BASE_URL}/common_task/image_upscale/detail`, { params })
    .then(({ data }) => data);
