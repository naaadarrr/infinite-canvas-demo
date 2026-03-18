/**
 * Video Lip Sync 权益与积分校验 Hook
 * 整合积分计算、团队积分、权限检查（无免费次数与高级 TTS 模式）
 */

import { useMemo } from 'react';
import { useRecoilValue } from 'recoil-next';
import { teamBenefitInfoState, teamCreditState } from '@/store/benefit';
import { checkUserSufficientPermission } from '@/app/avatar-video-creation/utils/permission';
import { RESOURCE_SUBS_TYPE } from '@/types/benefit/resources';
import { SUBS_TYPE } from '@/types/benefit/charge';
import { useVideoLipSyncCreditCalculation } from './useVideoLipSyncCreditCalculation';
import { formatCredits } from '@/app/board/[id]/components/ToolPanel/components/primitives/CreditBadge';
import type { VideoLipSyncFormValues } from '../store/atoms';

export interface UseVideoLipSyncPermissionOptions {
  formValues: VideoLipSyncFormValues;
  audioRange?: { start: number; end: number } | null;
}

export interface UseVideoLipSyncPermissionResult {
  /** 积分消耗值 */
  creditConsumption: number;
  /** 积分是否足够 */
  isEnoughCredit: boolean;
  /** 权限是否满足（套餐等级 + 积分） */
  isSufficientPermission: boolean;
  /** 用于按钮显示的积分文本 */
  creditDisplay: string;
  /** 是否为付费用户（Board 侧：非 free 即付费） */
  isPaidUser: boolean;
}

export function useVideoLipSyncPermission({
  formValues,
  audioRange
}: UseVideoLipSyncPermissionOptions): UseVideoLipSyncPermissionResult {
  const teamCredit = useRecoilValue(teamCreditState);
  const teamBenefitInfo = useRecoilValue(teamBenefitInfoState);

  const { credits } = useVideoLipSyncCreditCalculation({
    formValues,
    audioRange
  });

  return useMemo(() => {
    const creditConsumption = credits;
    const remainCredit = teamCredit?.remainCredit ?? 0;
    const isEnoughCredit = remainCredit >= creditConsumption;
    const userSubsType = (teamBenefitInfo?.subsType ?? '') as SUBS_TYPE;

    const isSufficientPermission = checkUserSufficientPermission({
      minSubsType: RESOURCE_SUBS_TYPE.STARTER,
      creditConsumed: creditConsumption,
      userSubsType,
      teamCredit: teamCredit ?? { allPaidCredit: 0, remainCredit: 0 }
    });

    const isPaidUser =
      !!teamBenefitInfo?.subsType &&
      teamBenefitInfo.subsType !== SUBS_TYPE.FREE;

    const creditDisplay =
      creditConsumption > 0 ? formatCredits(creditConsumption) : '0';

    return {
      creditConsumption,
      isEnoughCredit,
      isSufficientPermission,
      creditDisplay,
      isPaidUser
    };
  }, [credits, teamCredit, teamBenefitInfo?.subsType]);
}
