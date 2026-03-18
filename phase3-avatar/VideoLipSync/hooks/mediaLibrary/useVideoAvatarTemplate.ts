'use client';

import { useMemo, useCallback } from 'react';
import { extractQueryData, extractErrorInfo } from '@/lib/trpc/helper';
import type { AiAvatarDTO } from '@/server/api/services/mediaLibrary/aiAvatar/type';
import type { TRPCReturn, PaginatedResponse } from '@/lib/trpc/type';
import { useGetAiAvatarListV2InfiniteQuery } from '@/app/board/[id]/components/ToolPanel/feature/Avatar/VideoLipSync/data/mediaLibrary/useQueries';

/** 头像列表分页响应类型 */
type AvatarListPageData = TRPCReturn & {
  data?: PaginatedResponse<AiAvatarDTO>;
};

/**
 * 查询 Video Avatar 模板列表 Hook
 * 支持无限滚动加载更多功能
 *
 * @param options - 查询选项
 * @param options.ethnicityIds - 种族ID（可选）
 * @param options.gender - 性别（可选）
 * @param options.includeFavorite - 是否包含收藏（可选）
 * @param options.sortField - 排序字段（可选，默认 'sort'）
 * @param options.sortType - 排序类型（可选，默认 'desc'）
 * @param options.pageSize - 每页大小（可选，默认 20）
 * @returns 返回头像列表数据和加载状态
 */
export function useVideoAvatarTemplate(options?: {
  ethnicityIds?: string;
  gender?: string;
  includeFavorite?: number;
  sortField?: string;
  sortType?: string;
  pageSize?: number;
}) {
  const {
    ethnicityIds,
    gender,
    includeFavorite = 1,
    sortField = 'sort',
    sortType = 'desc',
    pageSize = 20
  } = options || {};

  // 计算下一页参数的函数
  const getNextPageParam = useCallback((lastPage: AvatarListPageData) => {
    try {
      const pageData = extractQueryData(lastPage);
      if (pageData?.data && pageData.pageSize && pageData.pageNo) {
        const { data, pageSize: dataPageSize, pageNo } = pageData;
        // 如果返回的数据量等于 pageSize，说明可能还有下一页
        return data.length === dataPageSize ? pageNo + 1 : undefined;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }, []);

  // 构建查询配置
  const queryOptions = useMemo(
    () => ({
      initialPageParam: 1,
      getNextPageParam,
      // 禁用缓存，确保每次切换筛选条件时都重新请求
      staleTime: 0,
      gcTime: 0,
      // 强制重新获取，不使用缓存
      refetchOnMount: true,
      refetchOnWindowFocus: false
    }),
    [getNextPageParam]
  );

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    error: queryError
  } = useGetAiAvatarListV2InfiniteQuery(
    {
      ethnicityIds,
      gender,
      includeFavorite,
      pageSize,
      sortField,
      sortType
    },
    queryOptions
  );

  // 扁平化所有页面的数据
  const avatars = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages
      .map((page) => {
        try {
          const pageData = extractQueryData(page as AvatarListPageData);
          return pageData?.data || [];
        } catch {
          return [];
        }
      })
      .flat();
  }, [data]);

  // 计算总数量（从第一页获取）
  const totalCount = useMemo(() => {
    if (!data?.pages || data.pages.length === 0) return 0;
    try {
      const firstPageData = extractQueryData(
        data.pages[0] as AvatarListPageData
      );
      return firstPageData?.total || 0;
    } catch {
      return 0;
    }
  }, [data]);

  // 统一错误处理
  const error = useMemo<string | undefined>(() => {
    if (queryError) {
      const { errorMessage } = extractErrorInfo(queryError);
      return errorMessage;
    }

    // 检查是否有页面提取错误
    if (data?.pages) {
      for (const page of data.pages) {
        try {
          extractQueryData(page as AvatarListPageData);
        } catch (err) {
          const { errorMessage } = extractErrorInfo(err);
          return errorMessage;
        }
      }
    }

    return undefined;
  }, [data, queryError]);

  // 加载更多数据
  const loadMore = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  // 刷新数据
  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    avatars,
    isLoading,
    isFetching,
    isFetchingNextPage,
    error,
    hasMore: hasNextPage ?? false,
    loadMore,
    refresh,
    fetchNextPage,
    currentPage: data?.pages?.length || 0,
    totalCount,
    // 原始数据（未过滤）
    allAvatars: avatars
  };
}

export default useVideoAvatarTemplate;
