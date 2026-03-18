/**
 * ProductAvatar 表单验证 Hook
 * 验证表单完整性，根据模式（Auto/Manual）进行不同的验证
 */

import { useMemo } from 'react';
import type { ProductAvatarFormValues } from '../store/atoms';
import { ProductAvatarGenerateMode } from '../store/atoms';

export interface FormValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * 验证 ProductAvatar 表单
 */
export function useProductAvatarFormValidation(
  formValues: ProductAvatarFormValues
): FormValidationResult {
  return useMemo(() => {
    const { mode, productImagePath, templateImagePath, avatarId } = formValues;

    // 基础验证：必须有产品图片和模板图片
    if (!productImagePath) {
      return {
        isValid: false,
        errorMessage: 'Please upload a product image'
      };
    }

    if (!templateImagePath && !avatarId) {
      return {
        isValid: false,
        errorMessage: 'Please upload an avatar photo'
      };
    }

    // Auto 模式：仅基础验证
    if (mode === ProductAvatarGenerateMode.AUTO) {
      return { isValid: true };
    }

    // Manual 模式：需要额外的验证
    if (mode === ProductAvatarGenerateMode.MANUAL) {
      const manualValues = formValues as typeof formValues & {
        productImageWithoutBackground?: string;
        location?: Array<[number, number]>;
      };

      // 检查是否有无背景的产品图片
      if (!manualValues.productImageWithoutBackground) {
        return {
          isValid: false,
          errorMessage: 'Please wait for product image to be processed'
        };
      }

      // 检查是否有位置信息
      if (!manualValues.location || manualValues.location.length === 0) {
        return {
          isValid: false,
          errorMessage: 'Please wait for product image to be processed'
        };
      }

      return { isValid: true };
    }

    return { isValid: true };
  }, [formValues]);
}
