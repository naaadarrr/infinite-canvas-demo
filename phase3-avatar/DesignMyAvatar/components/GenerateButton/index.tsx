/**
 * DesignMyAvatar GenerateButton 组件
 * 基于 GenerateButtonV2，不支持 Unlimited 模式
 */
'use client';

import { useMemo } from 'react';
import { usePricingModal } from '@topview/pricing';
import { toast } from '@/hooks/useToast';
import { GenerateButtonV2 } from '@/app/board/[id]/components/ToolPanel/components/primitives/GenerateButtonV2';
import { useDesignMyAvatarFormValidation } from '../../hooks/useDesignMyAvatarFormValidation';
import { useDesignMyAvatarTaskGeneration } from '../../hooks/useDesignMyAvatarTaskGeneration';
import { useDesignMyAvatarPermission } from '../../hooks/useDesignMyAvatarPermission';
import type { DesignMyAvatarFormValues } from '../../type';

const LOADING_TEXT = {
  SUBMITTING: 'Submitting...'
} as const;

export interface GenerateButtonProps {
  /** 表单值 */
  formValues: DesignMyAvatarFormValues;
}

/**
 * DesignMyAvatar GenerateButton 组件
 */
export function GenerateButton({ formValues }: GenerateButtonProps) {
  const { openPricingModal } = usePricingModal();

  // 权限和积分检查
  const permission = useDesignMyAvatarPermission();
  const {
    creditConsumption,
    isEnoughCredit,
    isSufficientPermission,
    creditDisplay
  } = permission;

  // 表单验证
  const validation = useDesignMyAvatarFormValidation(formValues);

  // 任务生成
  const { isSubmitting, generateTask } = useDesignMyAvatarTaskGeneration();

  // 按钮禁用状态
  const isDisabled = isSubmitting || !validation.isValid;

  // 禁用时的提示文案
  const disabledTooltip = useMemo(() => {
    if (!isDisabled) return undefined;
    if (isSubmitting) return LOADING_TEXT.SUBMITTING;
    if (!validation.isValid && validation.errorMessage) {
      return validation.errorMessage;
    }
    return undefined;
  }, [isDisabled, isSubmitting, validation]);

  // 生成按钮点击处理
  const handleGenerate = async () => {
    // 表单验证失败，显示错误提示
    if (!validation.isValid && validation.errorMessage) {
      toast.error(validation.errorMessage);
      return;
    }

    try {
      await generateTask(formValues, {
        creditConsumedForTracking: creditConsumption,
        taskCount: 2 // 一次性创建两个任务
      });
    } catch {
      // 错误已在 generateTask 中处理
    }
  };

  // 升级按钮点击处理
  const handleUpgradeClick = () => {
    openPricingModal();
  };

  return (
    <GenerateButtonV2
      disabled={isDisabled}
      isLoading={isSubmitting}
      loadingText={LOADING_TEXT.SUBMITTING}
      credits={creditConsumption}
      creditsDisplay={creditDisplay}
      supportsUnlimitedMode={false}
      onGenerate={handleGenerate}
      onUpgradeClick={handleUpgradeClick}
      disabledTooltip={disabledTooltip}
      isEnoughCredit={isEnoughCredit}
      isSufficientPermission={isSufficientPermission}
    />
  );
}
