'use client';

import { useCallback, useMemo } from 'react';
import { extractQueryData, extractErrorInfo } from '@/lib/trpc/helper';
import {
  CustomAvatarType,
  type AiAvatarDTO
} from '@/server/api/services/mediaLibrary/aiAvatar/type';
import type { PaginatedResponse, TRPCReturn } from '@/lib/trpc/type';
import { useGetFavoriteAiAvatarListQuery } from '@/app/board/[id]/components/ToolPanel/feature/Avatar/VideoLipSync/data/mediaLibrary/useQueries';

/** 收藏 Video Avatar 列表分页响应类型 */
type FavoriteAvatarListPageData = TRPCReturn & {
  data?: PaginatedResponse<AiAvatarDTO>;
};

/**
 * 查询收藏的 Video Avatar 列表 Hook
 * 支持无限滚动加载更多功能
 *
 * 写法参考：`useQueryFavoriteAvatar4Template`
 */
export function useQueryFavoriteVideoAvatar(options?: {
  sortField?: string;
  sortType?: string;
  pageSize?: number;
}) {
  const {
    sortField = 'gmt_create',
    sortType = 'desc',
    pageSize = 20
  } = options || {};

  // 计算下一页参数的函数
  const getNextPageParam = useCallback(
    (lastPage: FavoriteAvatarListPageData) => {
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
    },
    []
  );

  // 构建查询配置（不使用缓存，每次都从服务端拉取最新数据）
  const queryOptions = useMemo(
    () => ({
      initialPageParam: 1,
      getNextPageParam,
      // 禁用缓存
      staleTime: 0,
      gcTime: 0,
      // 每次挂载都强制重新请求
      refetchOnMount: true,
      // 避免聚焦窗口时自动触发缓存刷新
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
  } = useGetFavoriteAiAvatarListQuery(
    {
      pageSize,
      sortField,
      sortType,
      type: CustomAvatarType.VIDEO
    },
    queryOptions
  );

  // 扁平化所有页面的数据
  const avatars = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages
      .map((page) => {
        try {
          const pageData = extractQueryData(page as FavoriteAvatarListPageData);
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
        data.pages[0] as FavoriteAvatarListPageData
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
          extractQueryData(page as FavoriteAvatarListPageData);
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
    totalCount
  };
}

export default useQueryFavoriteVideoAvatar;
