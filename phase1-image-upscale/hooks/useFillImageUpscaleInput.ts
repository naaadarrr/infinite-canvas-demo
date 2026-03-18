/**
 * useFillImageUpscaleInput - 填充 Image Upscale 的上传区域
 *
 * 从 Board 素材填充源图到 Image Upscale 表单
 * 用于 Gallery 卡片 "Upscale" 操作（图片产物）
 */

import { useRecoilCallback } from 'recoil-next';
import { activeTabIdState } from '@/app/board/[id]/components/ToolPanel/store';
import { imageUpscaleFormFamily } from '../store/atoms';

interface FillImageUpscaleInputParams {
  /** 图片 CDN URL（用于展示） */
  imageUrl?: string;
  /** 图片 S3 路径（用于任务提交） */
  imageS3Path?: string;
}

/**
 * 填充 Image Upscale 的 sourceImage / sourceImagePath
 */
export function useFillImageUpscaleInput() {
  return useRecoilCallback(
    ({ snapshot, set }) =>
      (input: FillImageUpscaleInputParams) => {
        const tabId = snapshot.getLoadable(activeTabIdState).getValue();
        if (!tabId) return;

        // 优先用 URL 展示，S3 路径用于提交
        const displayUrl = input.imageUrl || input.imageS3Path;
        const pathForSubmit = input.imageS3Path || input.imageUrl;
        if (!displayUrl && !pathForSubmit) return;

        set(imageUpscaleFormFamily(tabId), (prev) => ({
          ...prev,
          sourceImage: displayUrl ?? null,
          sourceImagePath: pathForSubmit ?? null
        }));
      },
    []
  );
}
