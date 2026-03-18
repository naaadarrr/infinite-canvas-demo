/**
 * Video Upscale API 调用函数
 * 从 apps/base/src/server/api/services/videoUpscale/index.ts 提取
 *
 * 实际 API 端点：
 *   创建任务: POST {BASE_URL}/common_task/video_flash_vsr/submit
 *   查询任务: GET  {BASE_URL}/common_task/video_flash_vsr/detail?taskId=xxx
 */

import axios from 'axios';
import type {
  CreateVideoUpscaleTaskParams,
  CreateVideoUpscaleTaskResponse,
  QueryVideoUpscaleTaskParams,
  QueryVideoUpscaleTaskResponse
} from './api-types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export const createVideoUpscaleTask = (
  params: CreateVideoUpscaleTaskParams
): Promise<CreateVideoUpscaleTaskResponse> =>
  axios
    .post(`${BASE_URL}/common_task/video_flash_vsr/submit`, params)
    .then(({ data }) => data);

export const queryVideoUpscaleTask = (
  params: QueryVideoUpscaleTaskParams
): Promise<QueryVideoUpscaleTaskResponse> =>
  axios
    .get(`${BASE_URL}/common_task/video_flash_vsr/detail`, { params })
    .then(({ data }) => data);
