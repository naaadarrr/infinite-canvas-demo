/**
 * AiAvatar Query Hooks
 * AI Avatar 相关查询 Hooks
 *
 * 对应 Router: avatar4
 */
'use client';

import { trpc } from '@/lib/trpc/client';

/**
 * 查询 Avatar 4 模式用户免费次数
 * 直接透传 tRPC hook，保持完整的类型推导
 */
export const useGetAvatar4FreeQuotaByModeQuery =
  trpc.avatar4.getAvatar4FreeQuotaByMode.useQuery;
