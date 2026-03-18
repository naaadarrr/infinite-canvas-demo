'use client';

/**
 * Product Avatar 任务相关 Query Hooks
 *
 * 对应 Router: productAvatar.task
 * - queryRemoveBackground: 查询移除背景任务
 * - queryImageCharacterSwap: 查询图片角色替换任务详情
 * - getSimpleProcessList: 查询组合步骤任务列表
 */

import { trpc } from '@/lib/trpc/client';

/**
 * 查询移除背景任务结果
 *
 * @example
 * ```tsx
 * const { data, isLoading, refetch } = useQueryRemoveBackgroundQuery(
 *   { taskId: "xxx" },
 *   {
 *     enabled: !!taskId,
 *     refetchInterval: (query) => {
 *       // 任务完成后停止轮询
 *       const result = extractQueryData(query.state.data);
 *       return result?.status === "completed" ? false : 3000;
 *     }
 *   }
 * );
 * ```
 */
export const useQueryRemoveBackgroundQuery =
  trpc.productAvatar.task.queryRemoveBackground.useQuery;

/**
 * 查询图片角色替换任务详情
 *
 * @example
 * ```tsx
 * const { data, isLoading, refetch } = useQueryImageCharacterSwapTaskQuery(
 *   { taskId: "xxx" },
 *   {
 *     enabled: !!taskId,
 *     refetchInterval: (query) => {
 *       const result = extractQueryData(query.state.data);
 *       return result?.status === "success" || result?.status === "fail" ? false : 3000;
 *     }
 *   }
 * );
 * ```
 */
export const useQueryImageCharacterSwapTaskQuery =
  trpc.productAvatar.task.queryImageCharacterSwap.useQuery;

/**
 * 查询未完成的图片角色替换任务列表（unfinished）
 *
 * @example
 * ```tsx
 * const { data, isLoading, refetch } = useQueryImageCharacterSwapTaskUnfinishedQuery(
 *   { source: ImageCharacterSwapTaskSourceEnum.ProductAvatar },
 *   { enabled: true }
 * );
 * ```
 */
export const useQueryImageCharacterSwapTaskUnfinishedQuery =
  trpc.productAvatar.task.queryImageCharacterSwapUnfinished.useQuery;

/**
 * 查询组合步骤任务列表
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useGetSimpleProcessListQuery(
 *   { pageNo: 1, pageSize: 20 },
 *   { enabled: true }
 * );
 * ```
 */
export const useGetSimpleProcessListQuery =
  trpc.productAvatar.task.getSimpleProcessList.useQuery;

/**
 * 无限滚动查询组合步骤任务列表
 *
 * @example
 * ```tsx
 * const { data, fetchNextPage, hasNextPage } = useGetSimpleProcessListInfiniteQuery(
 *   { pageSize: 20 },
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
