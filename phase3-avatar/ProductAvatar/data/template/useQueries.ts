'use client';

/**
 * Product Avatar 模板相关 Query Hooks
 *
 * 对应 Router: productAvatar.template
 * - getMetaById: 根据 ID 查询单个产品数字人模板
 * - getMetaList: 查询产品数字人模板列表
 * - getMetaListInfinite: 查询产品数字人模板列表（无限滚动）
 * - getCategoryList: 查询产品数字人模板分类
 * - getFavoriteList: 查询收藏的模板列表
 * - getFavoriteListInfinite: 查询收藏的模板列表（无限滚动）
 */

import { trpc } from '@/lib/trpc/client';

/**
 * 根据 ID 查询单个产品数字人模板
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useGetMetaByIdQuery(
 *   { avatarId: "xxx" },
 *   { enabled: !!avatarId }
 * );
 * ```
 */
export const useGetMetaByIdQuery =
  trpc.productAvatar.template.getMetaById.useQuery;

/**
 * 查询产品数字人模板分类
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useGetCategoryListQuery(
 *   { pageNo: 1, pageSize: 50 },
 *   { enabled: true }
 * );
 * ```
 */
export const useGetCategoryListQuery =
  trpc.productAvatar.template.getCategoryList.useQuery;

/**
 * 无限滚动查询模板列表（公共模板和私有模板）
 *
 * @example
 * ```tsx
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetMetaListInfiniteQuery(
 *   { pageSize: 20, categoryIds: "1,2,3" },
 *   {
 *     initialPageParam: 1,
 *     getNextPageParam: (lastPage) => {
 *       const result = extractQueryData(lastPage);
 *       if (result?.list && result.list.length === result.pageSize) {
 *         return result.pageNo + 1;
 *       }
 *       return undefined;
 *     }
 *   }
 * );
 * ```
 */
export const useGetMetaListInfiniteQuery =
  trpc.productAvatar.template.getMetaListInfinite.useInfiniteQuery;

/**
 * 无限滚动查询收藏的模板列表（需登录）
 *
 * @example
 * ```tsx
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetFavoriteListInfiniteQuery(
 *   { pageSize: 20 },
 *   {
 *     enabled: isLoggedIn,
 *     initialPageParam: 1,
 *     getNextPageParam: (lastPage) => {
 *       const result = extractQueryData(lastPage);
 *       if (result?.list && result.list.length === result.pageSize) {
 *         return result.pageNo + 1;
 *       }
 *       return undefined;
 *     }
 *   }
 * );
 * ```
 */
export const useGetFavoriteListInfiniteQuery =
  trpc.productAvatar.template.getFavoriteListInfinite.useInfiniteQuery;

/**
 * 查询产品数字人模板合集列表
 */
export const useGetCollectionListQuery =
  trpc.productAvatar.template.getCollectionList.useQuery;

/**
 * 查询产品数字人合集模板列表
 */
export const useGetCollectionMetaListQuery =
  trpc.productAvatar.template.getCollectionMetaList.useQuery;

/**
 * 查询产品数字人合集模板列表（无限滚动）
 */
export const useGetCollectionMetaListInfiniteQuery =
  trpc.productAvatar.template.getCollectionMetaListInfinite.useInfiniteQuery;

/**
 * 根据 ID 获取模板详情（命令式调用）hook
 * 用于需要手动触发查询的场景（如 re-edit handler）
 *
 * @example
 * ```tsx
 * const fetchMetaById = useFetchMetaById();
 * const result = await fetchMetaById({ avatarId: "xxx" });
 * ```
 */
export function useFetchMetaById() {
  const utils = trpc.useUtils();
  return utils.productAvatar.template.getMetaById.fetch;
}
