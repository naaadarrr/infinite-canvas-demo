/**
 * AiAvatar 模块对外暴露的 Hooks
 * 供 ToolTabBar、BoardWorkspace 等外部组件调用
 */

import { useRecoilCallback } from 'recoil-next';
import {
  aiAvatarFormFamily,
  AiAvatarFormValues,
  DEFAULT_AI_AVATAR_VALUES
} from '../store/atoms';

/**
 * Cleanup - 清理 Tab 状态
 * 在 Tab 关闭时调用，避免内存泄漏
 */
export function useAiAvatarFormCleanup() {
  return useRecoilCallback(
    ({ reset }) =>
      (tabId: string) => {
        reset(aiAvatarFormFamily(tabId));
      },
    []
  );
}

/**
 * Initializer - 初始化 Tab 状态
 * 在新建 Tab 或从模板/任务初始化时调用
 */
export function useAiAvatarFormInitializer() {
  return useRecoilCallback(
    ({ set }) =>
      (tabId: string, initialValues?: Partial<AiAvatarFormValues>) => {
        set(aiAvatarFormFamily(tabId), {
          ...DEFAULT_AI_AVATAR_VALUES,
          ...initialValues
        });
      },
    []
  );
}
