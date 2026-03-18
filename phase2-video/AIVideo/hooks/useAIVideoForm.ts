/**
 * AIVideo 模块对外暴露的 Hooks
 */

import { useRecoilCallback } from 'recoil-next';
import {
  aiVideoFormFamily,
  AIVideoFormValues,
  DEFAULT_AI_VIDEO_VALUES
} from '../store/atoms';
import { activeTabIdState } from '@/app/board/[id]/components/ToolPanel/store';

const buildImageToVideoInitialValues = (
  initialValues?: Partial<AIVideoFormValues>
): AIVideoFormValues => {
  const i2vPrompt =
    initialValues?.i2vPrompt ??
    initialValues?.prompt ??
    DEFAULT_AI_VIDEO_VALUES.i2vPrompt;
  const i2vRefToVideoPrompt =
    initialValues?.i2vRefToVideoPrompt ??
    DEFAULT_AI_VIDEO_VALUES.i2vRefToVideoPrompt;

  return {
    ...DEFAULT_AI_VIDEO_VALUES,
    ...initialValues,
    taskType: 'imageToVideo',
    prompt: DEFAULT_AI_VIDEO_VALUES.prompt,
    i2vPrompt,
    i2vRefToVideoPrompt,
    uploadedVideo: DEFAULT_AI_VIDEO_VALUES.uploadedVideo,
    uploadedVideoDuration: DEFAULT_AI_VIDEO_VALUES.uploadedVideoDuration,
    veReferenceImages: DEFAULT_AI_VIDEO_VALUES.veReferenceImages,
    veRefToVideoPrompt: DEFAULT_AI_VIDEO_VALUES.veRefToVideoPrompt,
    videoEditMode: DEFAULT_AI_VIDEO_VALUES.videoEditMode,
    referenceVideo: DEFAULT_AI_VIDEO_VALUES.referenceVideo
  };
};

/**
 * Setter - 更新表单值
 *
 * tabId 可选：不传时内部用 snapshot 获取 activeTabId，避免调用方订阅 store
 */
export function useAIVideoFormSetter() {
  return useRecoilCallback(
    ({ snapshot, set }) =>
      (values: Partial<AIVideoFormValues>, tabId?: string) => {
        const effectiveTabId =
          tabId ?? snapshot.getLoadable(activeTabIdState).getValue();
        if (!effectiveTabId) return;
        set(aiVideoFormFamily(effectiveTabId), (prev) => ({
          ...prev,
          ...values
        }));
      },
    []
  );
}

/**
 * Cleanup - 清理 Tab 状态
 */
export function useAIVideoFormCleanup() {
  return useRecoilCallback(
    ({ reset }) =>
      (tabId: string) => {
        reset(aiVideoFormFamily(tabId));
      },
    []
  );
}

/**
 * Initializer - 初始化 Tab 状态
 */
export function useAIVideoFormInitializer() {
  return useRecoilCallback(
    ({ set }) =>
      (tabId: string, initialValues?: Partial<AIVideoFormValues>) => {
        set(aiVideoFormFamily(tabId), {
          ...DEFAULT_AI_VIDEO_VALUES,
          ...initialValues
        });
      },
    []
  );
}

/**
 * ImageToVideo Initializer - 初始化 ImageToVideo 的表单状态
 */
export function useImageToVideoFormInitializer() {
  return useRecoilCallback(
    ({ snapshot, set }) =>
      (initialValues?: Partial<AIVideoFormValues>, tabId?: string) => {
        const effectiveTabId =
          tabId ?? snapshot.getLoadable(activeTabIdState).getValue();
        if (!effectiveTabId) return;
        set(
          aiVideoFormFamily(effectiveTabId),
          buildImageToVideoInitialValues(initialValues)
        );
      },
    []
  );
}
