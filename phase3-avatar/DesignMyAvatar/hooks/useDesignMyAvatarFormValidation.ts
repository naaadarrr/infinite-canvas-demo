/**
 * DesignMyAvatar 表单验证 Hook
 * 验证表单完整性，根据人脸来源类型进行不同的验证
 */
'use client';

import { useMemo } from 'react';
import { AvatarFaceFromTypeEnum } from '@/server/api/services/promptToAvatar/type';
import type { DesignMyAvatarFormValues } from '../type';

export interface FormValidationResult {
  /** 表单是否有效 */
  isValid: boolean;
  /** 错误信息 */
  errorMessage?: string;
}

/**
 * DesignMyAvatar 表单验证 Hook
 */
export function useDesignMyAvatarFormValidation(
  formValues: DesignMyAvatarFormValues
): FormValidationResult {
  return useMemo(() => {
    const { faceSource, avatarFaceS3Key, prompt } = formValues;

    // 1. Photo 模式：必须有头像照片
    if (faceSource === AvatarFaceFromTypeEnum.photo) {
      if (!avatarFaceS3Key) {
        return {
          isValid: false,
          errorMessage: 'Please upload an avatar photo'
        };
      }
    }

    // 2. 必须有 prompt
    if (!prompt || !prompt.trim()) {
      return {
        isValid: false,
        errorMessage: 'Please describe your avatar'
      };
    }

    return { isValid: true };
  }, [formValues.faceSource, formValues.avatarFaceS3Key, formValues.prompt]);
}
