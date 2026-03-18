/**
 * AiAvatar 免费用户相关 Hook
 * 查询免费次数、判断是否为免费用户、获取免费次数、判断是否免费生成
 */
'use client';

import { useEffect, useMemo } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil-next';
import { avatarModeFreeCountState } from '../store/atoms';
import type { AiAvatarFormValues } from '../store/atoms';
import { SUBS_TYPE } from '@/types/benefit/charge';
import { PhotoAvatarVideoMode } from '@/server/api/services/avatar4/type';
import { useGetAvatar4FreeQuotaByModeQuery } from '../data/useQueries';
import { extractQueryData } from '@/lib/trpc/helper';

/**
 * Avatar 4 模式列表（用于查询免费次数）
 */
const AVATAR_4_MODES = [
  PhotoAvatarVideoMode.AVATAR_4,
  PhotoAvatarVideoMode.AVATAR_4_FAST
];

/**
 * 将模式数组转换为逗号分隔的字符串
 */
function formatModesForAPI(modes: PhotoAvatarVideoMode[]): string {
  return modes.join(',');
}

export interface UseAiAvatarFreeUserResult {
  /** 是否为免费用户 */
  isFreeUser: boolean;
  /** 当前模式的免费次数 */
  userFreeCount: number;
  /** 是否免费生成（免费用户且有免费次数） */
  isFreeGenerate: boolean;
  /** 是否显示免费用户提示 */
  shouldShowFreeUserTips: boolean;
}

export interface UseAiAvatarFreeUserOptions {
  /** 表单值（包含 mode） */
  formValues: AiAvatarFormValues;
  /** 用户订阅类型（来自 teamBenefitInfoState.subsType，与 useCreditAndPermission 一致） */
  subsType: string;
}

/**
 * AiAvatar 免费用户相关 Hook
 * 自动查询免费次数并更新到 store，同时返回免费用户相关信息
 */
export function useAiAvatarFreeUser({
  formValues,
  subsType
}: UseAiAvatarFreeUserOptions): UseAiAvatarFreeUserResult {
  const setUserFreeCount = useSetRecoilState(avatarModeFreeCountState);
  const avatarModeFreeCount = useRecoilValue(avatarModeFreeCountState);

  // 查询免费次数
  const { data } = useGetAvatar4FreeQuotaByModeQuery({
    modes: formatModesForAPI(AVATAR_4_MODES)
  });

  // 更新免费次数到 store
  useEffect(() => {
    try {
      const extractedData = extractQueryData(data);
      if (extractedData) {
        setUserFreeCount(
          extractedData.reduce(
            (acc, curr) => {
              acc[curr.mode] = curr.freeQuota;
              return acc;
            },
            {} as Record<string, number>
          )
        );
      }
    } catch (error) {
      // 处理错误，静默失败
      console.error('Failed to extract user free count data:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // 计算免费用户相关信息（与 useCreditAndPermission 一致：空或 free 为免费用户）
  return useMemo(() => {
    const isFreeUser = !subsType || subsType === SUBS_TYPE.FREE;
    const mode = formValues.mode;

    // 获取当前模式的免费次数
    const userFreeCount = mode ? (avatarModeFreeCount[mode] ?? 0) : 0;

    // 判断是否免费生成：免费用户 && 有免费次数
    const isFreeGenerate = isFreeUser && userFreeCount > 0;

    // 判断是否显示免费用户提示：免费用户
    const shouldShowFreeUserTips = isFreeUser;

    return {
      isFreeUser,
      userFreeCount,
      isFreeGenerate,
      shouldShowFreeUserTips
    };
  }, [formValues.mode, subsType, avatarModeFreeCount]);
}
