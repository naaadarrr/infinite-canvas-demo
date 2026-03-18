/**
 * ProductAvatar 表单基础操作 Hooks
 * 提供表单值的设置、清理和初始化功能
 */

import { useRecoilCallback } from 'recoil-next';
import {
  productAvatarFormFamily,
  ProductAvatarFormValues,
  DEFAULT_PRODUCT_AVATAR_VALUES
} from '../store/atoms';

/**
 * 清理表单值的 Hook
 */
export function useProductAvatarFormCleanup() {
  return useRecoilCallback(
    ({ reset }) =>
      (tabId: string) => {
        reset(productAvatarFormFamily(tabId));
      },
    []
  );
}

/**
 * 初始化表单值的 Hook
 */
export function useProductAvatarFormInitializer() {
  return useRecoilCallback(
    ({ set }) =>
      (tabId: string, initialValues?: Partial<ProductAvatarFormValues>) => {
        set(productAvatarFormFamily(tabId), {
          ...DEFAULT_PRODUCT_AVATAR_VALUES,
          ...initialValues
        });
      },
    []
  );
}
