/**
 * Media Library Query Hooks
 * 媒体库相关查询 Hooks
 *
 * 对应 Router: mediaLibrary.caption
 */
'use client';

import { trpc } from '@/lib/trpc/client';

/**
 * 查询字幕列表
 * 直接透传 tRPC hook，保持完整的类型推导
 */
export const useGetCaptionListQuery =
  trpc.mediaLibrary.caption.getCaptionList.useQuery;

/**
 * 查询字幕列表（无限滚动）
 * 直接透传 tRPC hook，保持完整的类型推导
 */
export const useGetCaptionListInfiniteQuery =
  trpc.mediaLibrary.caption.getCaptionListInfinite.useInfiniteQuery;

/**
 * 根据 CID 查询字幕详情
 * 直接透传 tRPC hook，保持完整的类型推导
 */
export const useGetCaptionDetailByCidQuery =
  trpc.mediaLibrary.caption.getCaptionDetailByCid.useQuery;
