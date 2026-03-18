'use client';

/**
 * ProductAvatar GenerateButton 组件
 * 生成产品头像任务的按钮组件
 * 基于 GenerateButtonV2 实现
 */

import { useMemo } from 'react';
import { useRecoilValue } from 'recoil-next';
import { toast } from '@/hooks/useToast';
import { GenerateButtonV2 } from '@/app/board/[id]/components/ToolPanel/components/primitives/GenerateButtonV2';
import { formatCredits } from '@/app/board/[id]/components/ToolPanel/components/primitives/CreditBadge';
import type { ProductAvatarFormValues } from '../../store/atoms';
import { ProductAvatarGenerateMode } from '../../store/atoms';
import {
  PROMPT_OBJECT_REPLACE_TASK_CREDIT_CONSUMPTION,
  PROMPT_OBJECT_REPLACE_TASK_GENERATE_COUNT,
  MANUAL_OBJECT_REPLACE_TASK_CREDIT_CONSUMPTION,
  MANUAL_OBJECT_REPLACE_TASK_GENERATE_COUNT
} from '../../config';
import { useProductAvatarFormValidation } from '../../hooks/useProductAvatarFormValidation';
import { RESOURCE_SUBS_TYPE } from '@/types/benefit/resources';
import { teamCreditState, teamBenefitInfoState } from '@/store/benefit';
import { usePricingModal } from '@topview/pricing';
import { checkUserSufficientPermission } from '@/app/avatar-video-creation/utils/permission';
import { SUBS_TYPE } from '@/types/benefit/charge';

const LOADING_TEXT = {
  SUBMITTING: 'Submitting...',
  PROCESSING_IMAGE: 'Processing image...'
} as const;

export interface GenerateButtonProps {
  formValues: ProductAvatarFormValues;
  isSubmitting: boolean;
  isProcessingImage?: boolean;
  onGenerate: () => Promise<void>;
}

/**
 * ProductAvatar GenerateButton 组件
 */
export function GenerateButton({
  formValues,
  isSubmitting,
  isProcessingImage = false,
  onGenerate
}: GenerateButtonProps) {
  const { openPricingModal } = usePricingModal();
  const teamCredit = useRecoilValue(teamCreditState);
  const teamBenefitInfo = useRecoilValue(teamBenefitInfoState);

  // 表单验证
  const validation = useProductAvatarFormValidation(formValues);

  // 计算积分消耗
  const creditConsumption = useMemo(() => {
    if (formValues.mode === ProductAvatarGenerateMode.AUTO) {
      return (
        PROMPT_OBJECT_REPLACE_TASK_CREDIT_CONSUMPTION *
        PROMPT_OBJECT_REPLACE_TASK_GENERATE_COUNT
      );
    } else {
      return (
        MANUAL_OBJECT_REPLACE_TASK_CREDIT_CONSUMPTION *
        MANUAL_OBJECT_REPLACE_TASK_GENERATE_COUNT
      );
    }
  }, [formValues.mode]);

  // 积分是否足够（与参考页统一使用 teamCreditState）
  const isEnoughCredit = useMemo(
    () => (teamCredit?.remainCredit ?? 0) >= creditConsumption,
    [teamCredit?.remainCredit, creditConsumption]
  );

  // 权限是否满足（模板最低订阅档位 + 积分）
  const isSufficientPermission = useMemo(
    () =>
      checkUserSufficientPermission({
        minSubsType: formValues.templateMinSubsType ?? RESOURCE_SUBS_TYPE.FREE,
        creditConsumed: creditConsumption,
        userSubsType: (teamBenefitInfo?.subsType ?? '') as SUBS_TYPE,
        teamCredit
      }),
    [
      formValues.templateMinSubsType,
      creditConsumption,
      teamBenefitInfo?.subsType,
      teamCredit
    ]
  );

  // 按钮是否禁用
  const isDisabled = isSubmitting || !validation.isValid || isProcessingImage;

  // 计算 loading 状态的文案
  const loadingText = useMemo(() => {
    if (isProcessingImage) {
      return LOADING_TEXT.PROCESSING_IMAGE;
    }
    return LOADING_TEXT.SUBMITTING;
  }, [isSubmitting, isProcessingImage]);

  // 计算禁用时的提示信息
  const disabledTooltip = useMemo(() => {
    if (!isDisabled) return undefined;
    if (isProcessingImage) {
      return LOADING_TEXT.PROCESSING_IMAGE;
    }
    if (isSubmitting) {
      return LOADING_TEXT.SUBMITTING;
    }
    if (!validation.isValid && validation.errorMessage) {
      return validation.errorMessage;
    }
    return undefined;
  }, [isDisabled, isSubmitting, isProcessingImage, validation]);

  // 处理点击事件：权限校验 → 表单校验 → onGenerate
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
    await onGenerate();
  };

  const handleUpgradeClick = () => {
    openPricingModal();
  };

  // 付费用户：使用 teamBenefitInfo.subsType 判断（与 AiAvatar/VideoLipSync 一致）
  const isPaidUser =
    !!teamBenefitInfo?.subsType && teamBenefitInfo.subsType !== SUBS_TYPE.FREE;

  // Info 图标文案：按模式说明积分规则
  const imageCount =
    formValues.mode === ProductAvatarGenerateMode.AUTO
      ? PROMPT_OBJECT_REPLACE_TASK_GENERATE_COUNT
      : MANUAL_OBJECT_REPLACE_TASK_GENERATE_COUNT;
  const infoTooltip = `${creditConsumption} credit(s) per generation (${imageCount} images).`;

  return (
    <div className='relative'>
      <GenerateButtonV2
        disabled={isDisabled}
        isLoading={isSubmitting || isProcessingImage}
        loadingText={loadingText}
        credits={creditConsumption}
        creditsDisplay={formatCredits(creditConsumption)}
        isPaidUser={isPaidUser}
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
