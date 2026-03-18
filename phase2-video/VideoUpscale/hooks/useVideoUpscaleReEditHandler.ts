/**
 * VideoUpscale Re-edit 处理 Hook
 * 将 task.parameters 映射为 VideoUpscaleFormValues
 */

import { useRecoilCallback } from 'recoil-next';
import { activeTabIdState } from '@/app/board/[id]/components/ToolPanel/store';
import { videoUpscaleFormFamily } from '../store/atoms';
import { VideoUpscaleResolution } from '../config';
import useAwsS3 from '@/hooks/useAwsS3';
import type { TaskParameters } from '@/server/api/services/board/common';

/**
 * VideoUpscale 任务参数类型（task.parameters 的精确定义）
 */
interface VideoUpscaleTaskParameters extends TaskParameters {
  /** 输入视频 S3 路径 */
  inputVideoPath?: string;
  /** 目标分辨率 */
  resolution?: VideoUpscaleResolution;
}

export function useVideoUpscaleReEditHandler() {
  const { getCdnUrls } = useAwsS3();

  return useRecoilCallback(
    ({ snapshot, set }) =>
      async (parameters: TaskParameters) => {
        const activeTabId = snapshot.getLoadable(activeTabIdState).getValue();
        if (!activeTabId) return;

        const params = parameters as VideoUpscaleTaskParameters;

        // 如果没有输入视频路径，直接返回
        if (!params.inputVideoPath) {
          console.warn('[VideoUpscaleReEdit] Missing inputVideoPath');
          return;
        }

        // 先设置 path 信息，sourceVideo 为 null 触发 loading 状态
        set(videoUpscaleFormFamily(activeTabId), {
          sourceVideo: null, // 先设为 null，触发 loading 状态
          sourceVideoPath: params.inputVideoPath,
          targetResolution: params.resolution ?? VideoUpscaleResolution.RES_1K
        });

        try {
          // 获取 CDN URL
          const urls = await getCdnUrls({
            sourceVideoUrl: params.inputVideoPath
          });

          // 设置表单值（包含获取到的 URL）
          set(videoUpscaleFormFamily(activeTabId), {
            sourceVideo: urls.sourceVideoUrl || null,
            sourceVideoPath: params.inputVideoPath,
            targetResolution: params.resolution ?? VideoUpscaleResolution.RES_1K
          });
        } catch (error) {
          console.error('[VideoUpscaleReEdit] Failed to fetch URLs:', error);
          // 获取 URL 失败，保持 path 信息不变（已在上面设置）
        }
      },
    [getCdnUrls]
  );
}
