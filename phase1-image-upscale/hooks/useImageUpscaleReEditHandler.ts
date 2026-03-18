/**
 * ImageUpscale Re-edit 处理 Hook
 * 将 task.parameters 映射为 ImageUpscaleFormValues
 */

import { useRecoilCallback } from 'recoil-next';
import { activeTabIdState } from '@/app/board/[id]/components/ToolPanel/store';
import { imageUpscaleFormFamily } from '../store/atoms';
import { ImageUpscaleResolution } from '../config';
import useAwsS3 from '@/hooks/useAwsS3';
import type { TaskParameters } from '@/server/api/services/board/common';

/**
 * ImageUpscale 任务参数类型（task.parameters 的精确定义）
 */
interface ImageUpscaleTaskParameters extends TaskParameters {
  /** 输入图片 S3 路径 */
  inputImagePath?: string;
  /** 目标分辨率 */
  resolution?: ImageUpscaleResolution;
}

export function useImageUpscaleReEditHandler() {
  const { getCdnUrls } = useAwsS3();

  return useRecoilCallback(
    ({ snapshot, set }) =>
      async (parameters: TaskParameters) => {
        const activeTabId = snapshot.getLoadable(activeTabIdState).getValue();
        if (!activeTabId) return;

        const params = parameters as ImageUpscaleTaskParameters;

        // 如果没有输入图片路径，直接返回
        if (!params.inputImagePath) {
          console.warn('[ImageUpscaleReEdit] Missing inputImagePath');
          return;
        }

        // 先设置 path 信息，sourceImage 为 null 触发 loading 状态
        set(imageUpscaleFormFamily(activeTabId), {
          sourceImage: null, // 先设为 null，触发 loading 状态
          sourceImagePath: params.inputImagePath,
          targetResolution: params.resolution ?? ImageUpscaleResolution.RES_2K
        });

        try {
          // 获取 CDN URL
          const urls = await getCdnUrls({
            sourceImageUrl: params.inputImagePath
          });

          // 设置表单值（包含获取到的 URL）
          set(imageUpscaleFormFamily(activeTabId), {
            sourceImage: urls.sourceImageUrl || null,
            sourceImagePath: params.inputImagePath,
            targetResolution: params.resolution ?? ImageUpscaleResolution.RES_2K
          });
        } catch (error) {
          console.error('[ImageUpscaleReEdit] Failed to fetch URLs:', error);
          // 获取 URL 失败，保持 path 信息不变（已在上面设置）
        }
      },
    [getCdnUrls]
  );
}
