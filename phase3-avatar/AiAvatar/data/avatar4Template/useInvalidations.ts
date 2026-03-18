'use client';

import { trpc } from '@/lib/trpc/client';
import { CustomAvatarAccessSource } from '@/server/api/services/mediaLibrary/aiAvatar/type';

export function useMyAvatarListInvalidations() {
  const trpcUtils = trpc.useUtils();

  const invalidateMyAvatarList = async () => {
    await trpcUtils.mediaLibrary.aiAvatar.getCustomAiAvatarList.invalidate({
      source: CustomAvatarAccessSource.INDEPENDENT_AVATAR
    });
  };

  /** 使免费次数查询失效，用于任务创建后刷新免费额度（免费用户用完次数后积分能正确计算） */
  const invalidateAvatar4FreeQuota = async () => {
    await trpcUtils.avatar4.getAvatar4FreeQuotaByMode.invalidate();
  };

  return {
    invalidateMyAvatarList,
    invalidateAvatar4FreeQuota
  };
}
