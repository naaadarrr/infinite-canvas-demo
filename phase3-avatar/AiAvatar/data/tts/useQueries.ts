'use client';

import { trpc } from '@/lib/trpc/client';

/**
 * 查询视频头像 TTS 免费字符额度（所有登录用户）
 *
 * Router: avatarVideoCreation.getTtsAuditionQuota
 */
export const useGetTtsAuditionQuotaQuery =
  trpc.avatarVideoCreation.getTtsAuditionQuota.useQuery;

/**
 * 查询 TTS 任务详情（轮询用）
 *
 * Router: tts.getTtsTask
 */
export const useGetTtsTaskQuery = trpc.tts.getTtsTask.useQuery;
