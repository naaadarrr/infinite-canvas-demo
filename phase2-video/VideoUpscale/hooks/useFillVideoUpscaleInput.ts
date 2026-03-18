/**
 * useFillVideoUpscaleInput - 填充 Video Upscale 的上传区域
 *
 * 从 Board 素材填充源视频到 Video Upscale 表单
 * 用于 Gallery 卡片 "Upscale" 操作（视频产物）
 */

import { useRecoilCallback } from 'recoil-next';
import { activeTabIdState } from '@/app/board/[id]/components/ToolPanel/store';
import { videoUpscaleFormFamily } from '../store/atoms';

interface FillVideoUpscaleInputParams {
  /** 视频 CDN URL（用于展示） */
  videoUrl?: string;
  /** 视频 S3 路径（用于提交任务） */
  videoS3Path?: string;
}

/**
 * 填充 Video Upscale 的 sourceVideo 和 sourceVideoPath
 */
export function useFillVideoUpscaleInput() {
  return useRecoilCallback(
    ({ snapshot, set }) =>
      (input: FillVideoUpscaleInputParams) => {
        const tabId = snapshot.getLoadable(activeTabIdState).getValue();
        if (!tabId) return;

        const url = input.videoUrl || input.videoS3Path;
        if (!url) return;

        set(videoUpscaleFormFamily(tabId), (prev) => ({
          ...prev,
          sourceVideo: url,
          // 同时设置 S3 路径，用于直接提交任务（无需再次上传）
          sourceVideoPath: input.videoS3Path ?? null
        }));
      },
    []
  );
}
