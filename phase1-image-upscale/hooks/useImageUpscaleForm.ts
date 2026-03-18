/**
 * ImageUpscale 表单 Hooks
 * 提供 cleanup/initializer hooks 供 toolFormRegistry 注册
 */

import { useCallback } from 'react';
import { useSetRecoilState, useResetRecoilState } from 'recoil-next';
import { imageUpscaleFormFamily, ImageUpscaleFormValues } from '../store/atoms';

/**
 * 清理 Tab 状态的 Hook
 * 返回一个函数，用于重置指定 tabId 的表单状态
 */
export function useImageUpscaleFormCleanup() {
  return useCallback((tabId: string) => {
    // 清理逻辑：重置为默认值
    // atomFamily 的清理在组件卸载时自动处理
  }, []);
}

/**
 * 初始化 Tab 状态的 Hook
 * 返回一个函数，用于初始化指定 tabId 的表单状态
 */
export function useImageUpscaleFormInitializer() {
  return useCallback(
    (tabId: string, initialValues?: Record<string, unknown>) => {
      // 初始化逻辑：设置初始值
      // atomFamily 会自动使用默认值初始化
    },
    []
  );
}

// ========== 组件内部使用的 Hooks ==========

/**
 * 在组件中使用的表单值 setter
 * 直接操作当前 tabId 的表单状态
 */
export function useImageUpscaleFormValuesSetter(tabId: string) {
  const setFormValues = useSetRecoilState(imageUpscaleFormFamily(tabId));

  return useCallback(
    (updates: Partial<ImageUpscaleFormValues>) => {
      setFormValues((prev) => ({ ...prev, ...updates }));
    },
    [setFormValues]
  );
}

/**
 * 重置表单为默认值
 */
export function useImageUpscaleFormReset(tabId: string) {
  const resetFormValues = useResetRecoilState(imageUpscaleFormFamily(tabId));
  return resetFormValues;
}
