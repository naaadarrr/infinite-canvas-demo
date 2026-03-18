'use client';

/**
 * Video Lip Sync 相关 Query Hooks
 *
 * 对应 Router: mediaLibrary.aiAvatar
 * - getAiAvatarListV2: 查询AI头像列表V2
 * - getAiAvatarListV2Infinite: 查询AI头像列表V2（无限滚动）
 * - getAiAvatarDetail: 查询AI头像详情
 * - getCustomAiAvatarList: 查询用户自定义头像列表
 */

import { trpc } from '@/lib/trpc/client';

/**
 * 无限滚动查询AI头像列表V2
 * 获取公共AI头像列表（支持无限滚动）
 */
export const useGetAiAvatarListV2InfiniteQuery =
  trpc.mediaLibrary.aiAvatar.getAiAvatarListV2Infinite.useInfiniteQuery;

/**
 * 查询 AI 头像详情（按 aiAvatarId）
 * 用于展示或 re-edit 时恢复模板预览
 */
export const useGetAiAvatarDetailQuery =
  trpc.mediaLibrary.aiAvatar.getAiAvatarDetail.useQuery;

/**
 * 命令式获取 AI 头像详情
 * 用于 re-edit 场景中仅有 aiavatarId 时拉取预览 URL
 *
 * @returns fetch 函数，可直接调用获取 AI 头像详情
 */
export function useFetchAiAvatarDetail() {
  const utils = trpc.useUtils();
  return utils.mediaLibrary.aiAvatar.getAiAvatarDetail.fetch;
}

/**
 * 查询用户自定义的 AI 头像列表
 * 获取当前用户创建的自定义头像（用于 Video Lip Sync）
 */
export const useGetCustomAiAvatarListQuery =
  trpc.mediaLibrary.aiAvatar.getCustomAiAvatarList.useQuery;

/**
 * 查询收藏的 AI 头像列表
 * 获取当前用户收藏的 AI 头像列表（用于 Video Lip Sync）
 */
export const useGetFavoriteAiAvatarListQuery =
  trpc.mediaLibrary.aiAvatar.getFavoriteAiAvatarList.useInfiniteQuery;

export const useGetEthnicityListQuery =
  trpc.mediaLibrary.aiAvatar.getEthnicityList.useQuery;
