/**
 * useFillSourceVideoInput - 填充 VideoLipSync 源视频输入
 *
 * 从 Board 素材填充源视频到 VideoLipSync 表单
 * 用于 Gallery 右键菜单 "AI Avatar" 操作（视频素材）
 */

import { useRecoilCallback } from 'recoil-next';
import { activeTabIdState } from '@/app/board/[id]/components/ToolPanel/store';
import { videoLipSyncFormFamily } from '../store/atoms';
import { AssetInputSource } from '@/app/board/[id]/components/ToolPanel/components/avatar/types';

interface FillSourceVideoInputParams {
  /** 视频 CDN URL（用于预览显示）*/
  videoUrl?: string;
  /** 视频 S3 路径（用于任务提交）*/
  videoS3Path?: string;
}

/**
 * 填充源视频输入
 *
 * @example
 * ```tsx
 * const fillSourceVideoInput = useFillSourceVideoInput();
 * fillSourceVideoInput({
 *   videoUrl: 'https://cdn.example.com/video.mp4',
 *   videoS3Path: 'path/to/video.mp4',
 * });
 * ```
 */
export function useFillSourceVideoInput() {
  return useRecoilCallback(
    ({ snapshot, set }) =>
      (input: FillSourceVideoInputParams) => {
        const tabId = snapshot.getLoadable(activeTabIdState).getValue();
        if (!tabId) return;

        set(videoLipSyncFormFamily(tabId), (prev) => ({
          ...prev,
          // 填充素材
          videoUrl: input.videoUrl,
          videoS3Path: input.videoS3Path,
          // 标记来源为 Board 素材
          videoInputSource: AssetInputSource.BOARD_ASSET,
          // 重置相关字段（因为是新素材）
          aiavatarId: undefined
        }));
      },
    []
  );
}
