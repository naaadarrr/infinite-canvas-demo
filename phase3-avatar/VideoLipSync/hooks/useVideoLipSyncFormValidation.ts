/**
 * VideoLipSync 表单验证 Hook
 * 验证表单完整性，根据音频来源类型进行不同的验证
 */

import { useMemo } from 'react';
import { AudioInputType } from '@/server/api/services/avatar4/type';
import type { VideoLipSyncFormValues } from '../store/atoms';

export interface FormValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * 验证 VideoLipSync 表单
 */
export function useVideoLipSyncFormValidation(
  formValues: VideoLipSyncFormValues,
  options?: {
    /** 是否正在加载音频 */
    isAudioLoading?: boolean;
    /** 是否正在加载 TTS 预览 */
    isLoadingAudio?: boolean;
    /** TTS 音频是否超过最大时长 */
    isTtsAudioExceeded?: boolean;
    /** 最大音频时长（秒） */
    maxAudioDuration?: number;
    /** 是否有上传的音频文件对象 */
    uploadedAudioFile?: File | null;
  }
): FormValidationResult {
  return useMemo(() => {
    const {
      videoUrl,
      videoS3Path,
      audioFileSource,
      audioS3Path,
      audioUrl,
      ttsText,
      ttsTaskId,
      durations
    } = formValues;

    const {
      isAudioLoading = false,
      isLoadingAudio = false,
      isTtsAudioExceeded = false,
      maxAudioDuration,
      uploadedAudioFile
    } = options || {};

    // 1. 视频检查（立即上传方案：只检查 videoUrl 和 videoS3Path）
    if (!videoUrl && !videoS3Path) {
      return {
        isValid: false,
        errorMessage: 'Please upload a video'
      };
    }

    // 2. 音频来源检查
    if (audioFileSource === AudioInputType.UPLOAD_AUDIO) {
      // 上传音频模式：必须有 audioS3Path 或 audioUrl，且不能正在加载
      if (isAudioLoading) {
        return {
          isValid: false,
          errorMessage: 'Please wait for audio to finish loading'
        };
      }

      if (!audioS3Path && !audioUrl && !uploadedAudioFile) {
        return {
          isValid: false,
          errorMessage: 'Please upload an audio file'
        };
      }
    } else if (audioFileSource === AudioInputType.TEXT_TO_AUDIO) {
      // 文字转语音模式：必须有 ttsText，且不能正在加载音频预览
      if (isLoadingAudio) {
        return {
          isValid: false,
          errorMessage: 'Please wait for audio preview to finish'
        };
      }

      if (!ttsText || !ttsText.trim()) {
        return {
          isValid: false,
          errorMessage: 'Please input text'
        };
      }
    }

    // 3. TTS 音频时长检查
    if (isTtsAudioExceeded && maxAudioDuration) {
      return {
        isValid: false,
        errorMessage: `Audio duration exceeds maximum limit (${maxAudioDuration}s)`
      };
    }

    // 4. 积分检查（VideoLipSync 使用实时计算，不需要检查 estimatedCredits）
    // 这里不检查积分，因为积分计算是实时的，在按钮点击时再检查

    return { isValid: true };
  }, [
    formValues,
    options?.isAudioLoading,
    options?.isLoadingAudio,
    options?.isTtsAudioExceeded,
    options?.maxAudioDuration,
    options?.uploadedAudioFile
  ]);
}
