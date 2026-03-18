/**
 * VideoLipSync GenerateButton 组件
 * 基于 GenerateButtonV2，无免费次数与高级 TTS 模式
 */
'use client';

import { useMemo } from 'react';
import { toast } from '@/hooks/useToast';
import { GenerateButtonV2 } from '@/app/board/[id]/components/ToolPanel/components/primitives/GenerateButtonV2';
import { useVideoLipSyncFormValidation } from '../../hooks/useVideoLipSyncFormValidation';
import { useVideoLipSyncTaskGeneration } from '../../hooks/useVideoLipSyncTaskGeneration';
import { useVideoLipSyncPermission } from '../../hooks/useVideoLipSyncPermission';
import { usePricingModal } from '@topview/pricing';
import type { VideoLipSyncFormValues } from '../../store/atoms';
import {
  VIDEO_LIP_SYNC_SECONDS_PER_CREDIT,
  VIDEO_LIP_SYNC_CHARACTERS_PER_CREDIT
} from '../../config';

const LOADING_TEXT = {
  SUBMITTING: 'Submitting...'
} as const;

export interface GenerateButtonProps {
  formValues: VideoLipSyncFormValues;
  uploadedAudioFile?: File | null;
  audioRange?: { start: number; end: number } | null;
  isAudioLoading?: boolean;
  isLoadingAudio?: boolean;
  isTtsAudioExceeded?: boolean;
  maxAudioDuration?: number;
}

export function GenerateButton({
  formValues,
  uploadedAudioFile,
  audioRange,
  isAudioLoading = false,
  isLoadingAudio = false,
  isTtsAudioExceeded = false,
  maxAudioDuration
}: GenerateButtonProps) {
  const { openPricingModal } = usePricingModal();

  const permission = useVideoLipSyncPermission({ formValues, audioRange });
  const {
    creditConsumption,
    isEnoughCredit,
    isSufficientPermission,
    creditDisplay,
    isPaidUser
  } = permission;

  const validation = useVideoLipSyncFormValidation(formValues, {
    isAudioLoading,
    isLoadingAudio,
    isTtsAudioExceeded,
    maxAudioDuration,
    uploadedAudioFile
  });

  const { isSubmitting, generateTask } = useVideoLipSyncTaskGeneration();

  const hasCredits = creditConsumption > 0;
  const isDisabled = isSubmitting || !validation.isValid || !hasCredits;

  const disabledTooltip = useMemo(() => {
    if (!isDisabled) return undefined;
    if (isSubmitting) return LOADING_TEXT.SUBMITTING;
    if (!validation.isValid && validation.errorMessage) {
      return validation.errorMessage;
    }
    return undefined;
  }, [isDisabled, isSubmitting, validation]);

  const creditsValue = creditConsumption;
  const creditsDisplayValue = creditDisplay;

  // Info 图标文案：与积分规则一致（上传音频按时长，TTS 按字符+停顿）
  const infoTooltip = useMemo(
    () =>
      `1 credit per ${VIDEO_LIP_SYNC_SECONDS_PER_CREDIT} seconds of audio; for TTS, 1 credit per ${VIDEO_LIP_SYNC_CHARACTERS_PER_CREDIT} characters plus 1 per ${VIDEO_LIP_SYNC_SECONDS_PER_CREDIT} seconds of pause.`,
    []
  );

  const handleGenerate = async () => {
    if (!isSufficientPermission) {
      openPricingModal();
      return;
    }
    if (!isEnoughCredit) {
      openPricingModal();
      return;
    }
    if (isDisabled) {
      if (!validation.isValid && validation.errorMessage) {
        toast({
          title: validation.errorMessage,
          variant: 'destructive',
          duration: 3000
        });
      }
      return;
    }

    try {
      await generateTask(formValues, {
        uploadedAudioFile,
        audioRange,
        creditConsumedForTracking: creditConsumption
      });
    } catch {
      // 错误已在 generateTask 中处理
    }
  };

  const handleUpgradeClick = () => {
    openPricingModal();
  };

  return (
    <div className='relative'>
      <GenerateButtonV2
        disabled={isDisabled}
        isLoading={isSubmitting}
        loadingText={LOADING_TEXT.SUBMITTING}
        credits={creditsValue}
        creditsDisplay={creditsDisplayValue}
        supportsUnlimitedMode={false}
        onGenerate={handleGenerate}
        onUpgradeClick={handleUpgradeClick}
        disabledTooltip={disabledTooltip}
        isEnoughCredit={isEnoughCredit}
        isSufficientPermission={isSufficientPermission}
        infoTooltip={infoTooltip}
        className='relative'
      />
    </div>
  );
}
