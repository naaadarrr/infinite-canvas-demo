/**
 * VideoLipSync 模块对外暴露的 Hooks
 */

import { useRecoilCallback } from 'recoil-next';
import {
  videoLipSyncFormFamily,
  VideoLipSyncFormValues,
  DEFAULT_VIDEO_LIP_SYNC_VALUES
} from '../store/atoms';

/**
 * Cleanup - 清理 Tab 状态
 */
export function useVideoLipSyncFormCleanup() {
  return useRecoilCallback(
    ({ reset }) =>
      (tabId: string) => {
        reset(videoLipSyncFormFamily(tabId));
      },
    []
  );
}

/**
 * Initializer - 初始化 Tab 状态
 */
export function useVideoLipSyncFormInitializer() {
  return useRecoilCallback(
    ({ set }) =>
      (tabId: string, initialValues?: Partial<VideoLipSyncFormValues>) => {
        set(videoLipSyncFormFamily(tabId), {
          ...DEFAULT_VIDEO_LIP_SYNC_VALUES,
          ...initialValues
        });
      },
    []
  );
}
