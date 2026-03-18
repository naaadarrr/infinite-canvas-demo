/**
 * AiAvatar GenerateButton 组件
 * 生成 AI Avatar 视频任务的按钮组件
 * 基于 GenerateButtonV2 实现
 */
'use client';

import { useMemo } from 'react';
import { useRecoilValue } from 'recoil-next';
import { toast } from '@/hooks/useToast';
import { GenerateButtonV2 } from '@/app/board/[id]/components/ToolPanel/components/primitives/GenerateButtonV2';
import { formatCredits } from '@/app/board/[id]/components/ToolPanel/components/primitives/CreditBadge';
import { useAiAvatarFormValidation } from '../../hooks/useAiAvatarFormValidation';
import { useAiAvatarTaskGeneration } from '../../hooks/useAiAvatarTaskGeneration';
import type { AiAvatarFormValues } from '../../store/atoms';
import type { UseAiAvatarFreeUserResult } from '../../hooks/useAiAvatarFreeUser';
import { teamCreditState, teamBenefitInfoState } from '@/store/benefit';
import { usePricingModal } from '@topview/pricing';
import { checkUserSufficientPermission } from '@/app/avatar-video-creation/utils/permission';
import { RESOURCE_SUBS_TYPE } from '@/types/benefit/resources';
import { SUBS_TYPE } from '@/types/benefit/charge';
import {
  isAvatar4CompatibleMode,
  isResolutionPremium,
  isWatermarkOptionPremium
} from '@/app/avatar-video-creation/helper';
import { getCreditsPerSecondByMode } from '../../config';
import { FreeUserTips } from './components/FreeUserTips';

// Loading 文本常量
const LOADING_TEXT = {
  SUBMITTING: 'Submitting...'
} as const;

export interface GenerateButtonProps {
  /** 表单值 */
  formValues: AiAvatarFormValues;
  /** 上传的音频文件对象（如果存在） */
  uploadedAudioFile?: File | null;
  /** 音频范围（如果存在） */
  audioRange?: { start: number; end: number } | null;
  /** 是否正在加载音频 */
  isAudioLoading?: boolean;
  /** 是否正在加载 TTS 预览 */
  isLoadingAudio?: boolean;
  /** TTS 音频是否超过最大时长 */
  isTtsAudioExceeded?: boolean;
  /** 最大音频时长（秒） */
  maxAudioDuration?: number;
  /** 免费用户相关信息 */
  freeUserInfo: UseAiAvatarFreeUserResult;
}

/**
 * AiAvatar GenerateButton 组件
 */
export function GenerateButton({
  formValues,
  uploadedAudioFile,
  audioRange,
  isAudioLoading = false,
  isLoadingAudio = false,
  isTtsAudioExceeded = false,
  maxAudioDuration,
  freeUserInfo
}: GenerateButtonProps) {
  const { openPricingModal } = usePricingModal();
  const teamCredit = useRecoilValue(teamCreditState);
  const teamBenefitInfo = useRecoilValue(teamBenefitInfoState);

  // 表单验证
  const validation = useAiAvatarFormValidation(formValues, {
    isAudioLoading,
    isLoadingAudio,
    isTtsAudioExceeded,
    maxAudioDuration,
    uploadedAudioFile,
    isFreeGenerate: freeUserInfo.isFreeGenerate
  });

  // 任务生成
  const { isSubmitting, generateTask } = useAiAvatarTaskGeneration();

  // 积分消耗（免费生成时为 0）
  const creditConsumption = freeUserInfo.isFreeGenerate
    ? 0
    : (formValues.estimatedCredits ?? 0);

  // 积分是否足够（免费生成时无需检查）
  const isEnoughCredit = useMemo(
    () =>
      freeUserInfo.isFreeGenerate
        ? true
        : (teamCredit?.remainCredit ?? 0) >= creditConsumption,
    [freeUserInfo.isFreeGenerate, teamCredit?.remainCredit, creditConsumption]
  );

  // 权限是否满足
  const isSufficientPermission = useMemo(() => {
    if (freeUserInfo.isFreeGenerate) return true;
    const isFreeUser =
      (teamBenefitInfo?.subsType as SUBS_TYPE) === SUBS_TYPE.FREE;
    const isSelectedResolutionPremium = isResolutionPremium(
      formValues.resolution as Parameters<typeof isResolutionPremium>[0]
    );
    const isSelectedWatermarkPremium = isWatermarkOptionPremium(
      formValues.includeWatermark as Parameters<
        typeof isWatermarkOptionPremium
      >[0]
    );
    if (
      isFreeUser &&
      (isSelectedResolutionPremium || isSelectedWatermarkPremium)
    ) {
      return false;
    }
    const minSubsType =
      isAvatar4CompatibleMode(
        formValues.mode as Parameters<typeof isAvatar4CompatibleMode>[0]
      ) && formValues.offPeak
        ? RESOURCE_SUBS_TYPE.BUSINESS
        : RESOURCE_SUBS_TYPE.STARTER;
    return checkUserSufficientPermission({
      minSubsType,
      creditConsumed: creditConsumption,
      userSubsType: (teamBenefitInfo?.subsType ?? '') as SUBS_TYPE,
      teamCredit
    });
  }, [
    freeUserInfo.isFreeGenerate,
    teamBenefitInfo?.subsType,
    formValues.resolution,
    formValues.includeWatermark,
    formValues.mode,
    formValues.offPeak,
    creditConsumption,
    teamCredit
  ]);

  // 计算积分显示
  const estimatedCredits = formValues.estimatedCredits || 0;
  const isEstimatedCredits = freeUserInfo.isFreeGenerate
    ? false
    : formValues.isEstimatedCredits === true;
  const displayCost = freeUserInfo.isFreeGenerate
    ? 'Free'
    : estimatedCredits > 0
      ? isEstimatedCredits
        ? `≈${formatCredits(estimatedCredits)}`
        : formatCredits(estimatedCredits)
      : '0';

  // 付费用户 Credit 模式显示的数值（初始化时显示 0）
  const creditsDisplayForPaid =
    estimatedCredits > 0
      ? isEstimatedCredits
        ? `≈${formatCredits(estimatedCredits)}`
        : formatCredits(estimatedCredits)
      : '0';

  const hasCredits = freeUserInfo.isFreeGenerate || estimatedCredits > 0;
  const isDisabled = isSubmitting || !validation.isValid || !hasCredits;

  const disabledTooltip = useMemo(() => {
    if (!isDisabled) return undefined;
    if (isSubmitting) return LOADING_TEXT.SUBMITTING;
    if (!validation.isValid && validation.errorMessage) {
      return validation.errorMessage;
    }
    return undefined;
  }, [isDisabled, isSubmitting, validation]);

  const handleGenerate = async () => {
    if (!isSufficientPermission) {
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
        creditConsumedForTracking: freeUserInfo.isFreeGenerate
          ? 0
          : (formValues.estimatedCredits ?? 0)
      });
    } catch {
      // 错误已在 generateTask 中处理
    }
  };

  const handleUpgradeClick = () => {
    openPricingModal();
  };

  const creditsValue = creditConsumption;
  const creditsDisplayValue = freeUserInfo.isFreeUser
    ? displayCost
    : creditsDisplayForPaid;

  // Info 图标文案：与 GenerateButtonContent 一致
  const infoTooltip = useMemo(() => {
    const creditsPerSecond = getCreditsPerSecondByMode(
      formValues.mode as Parameters<typeof getCreditsPerSecondByMode>[0]
    );
    return freeUserInfo.isFreeGenerate
      ? 'Free generation (using free quota)'
      : isEstimatedCredits
        ? `Estimated cost. Actual price is based on generated audio duration (${creditsPerSecond} credits/sec).`
        : `${creditsPerSecond} credits per second`;
  }, [freeUserInfo.isFreeGenerate, isEstimatedCredits, formValues.mode]);

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

      {/* 免费用户：体验次数提示（浮动在底部） */}
      {freeUserInfo.shouldShowFreeUserTips && (
        <div className='sticky bottom-2 z-10 bg-[#2d2d2d]  text-center text-sm text-white/70'>
          <FreeUserTips
            isFreeUser={freeUserInfo.isFreeUser}
            selectedVideoGenerationMode={formValues.mode}
            userFreeCount={freeUserInfo.userFreeCount}
          />
        </div>
      )}
    </div>
  );
}
