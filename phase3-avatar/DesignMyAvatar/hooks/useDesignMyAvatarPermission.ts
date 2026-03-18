/**
 * DesignMyAvatar 权限和积分 Hook
 * 检查用户权限、积分是否足够、是否有 Unlimited 权益等
 */
'use client';

import { useMemo } from 'react';
import { useRecoilValue } from 'recoil-next';
import { teamCreditState, teamBenefitInfoState } from '@/store/benefit';
import { formatCredits } from '@/app/board/[id]/components/ToolPanel/components/primitives/CreditBadge';

/**
 * DesignMyAvatar 固定积分消耗
 * 每次生成消耗 1 积分
 */
const DESIGN_MY_AVATAR_CREDIT_COST = 1;

export interface UseDesignMyAvatarPermissionResult {
  /** 积分消耗数量 */
  creditConsumption: number;
  /** 积分显示文本 */
  creditDisplay: string;
  /** 积分是否足够 */
  isEnoughCredit: boolean;
  /** 权限是否满足 */
  isSufficientPermission: boolean;
  /** 是否有 Unlimited 权益 */
  hasUnlimitedAccess: boolean;
  /** 是否为付费用户 */
  isPaidUser: boolean;
  /** 是否为免费用户 */
  isFreeUser: boolean;
}

/**
 * DesignMyAvatar 权限和积分 Hook
 */
export function useDesignMyAvatarPermission(): UseDesignMyAvatarPermissionResult {
  const teamCredit = useRecoilValue(teamCreditState);
  const teamBenefitInfo = useRecoilValue(teamBenefitInfoState);

  return useMemo(() => {
    const subsType = teamBenefitInfo?.subsType ?? '';

    // 判断用户类型：免费用户是 subsType 为空或为 'free'
    const isFreeUser = !subsType || subsType === 'free';
    const isPaidUser = !isFreeUser;

    // Pro 和 Business 用户有 unlimited 权益
    // subsType 可能是 'pro_month', 'pro_annual', 'business_month', 'business_annual' 等
    const hasUnlimitedAccess =
      subsType.includes('pro') || subsType.includes('business');

    // 积分消耗（固定 1 积分）
    const creditConsumption = DESIGN_MY_AVATAR_CREDIT_COST;
    const creditDisplay = formatCredits(creditConsumption);

    // 积分是否足够
    const remainCredit = teamCredit?.remainCredit ?? 0;
    const isEnoughCredit = remainCredit >= creditConsumption;

    // 权限是否满足（DesignMyAvatar 对所有用户开放，仅检查积分）
    const isSufficientPermission = true;

    return {
      creditConsumption,
      creditDisplay,
      isEnoughCredit,
      isSufficientPermission,
      hasUnlimitedAccess,
      isPaidUser,
      isFreeUser
    };
  }, [teamCredit?.remainCredit, teamBenefitInfo?.subsType]);
}
