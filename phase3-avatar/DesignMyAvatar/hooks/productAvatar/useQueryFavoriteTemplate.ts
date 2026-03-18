'use client';

import { useMemo, useCallback } from 'react';
import { extractQueryData, extractErrorInfo } from '@/lib/trpc/helper';
import { TRPCReturn, PaginatedResponse } from '@/lib/trpc/type';
import { useGetFavoriteListInfiniteQuery } from '../../data/productAvatar/useQueries';
import type { ProductAvatarMetaFrontDTO } from '@/server/api/services/productAvatar/template/type';

/** 收藏模板列表分页响应类型 */
type FavoriteListPageData = TRPCReturn & {
  data?: PaginatedResponse<ProductAvatarMetaFrontDTO>;
};

interface UseQueryProductAvatarFavoriteTemplateOptions {
  pageSize?: number;
}

/**
 * 查询 Product Avatar 收藏模板列表 Hook
 * 支持分页加载更多功能（需登录）
 *
 * @param options - 查询选项
 * @param options.pageSize - 每页大小（可选，默认 20）
 * @returns 返回收藏模板列表数据和加载状态
 */
export function useQueryProductAvatarFavoriteTemplate({
  pageSize = 20
}: UseQueryProductAvatarFavoriteTemplateOptions = {}) {
  // 构建分页参数获取函数
  const getNextPageParam = useCallback((lastPage: FavoriteListPageData) => {
    try {
      const result = extractQueryData(lastPage);
      if (result?.data && result.pageSize && result.pageNo) {
        const { data, pageSize, pageNo } = result;
        // 如果返回的数据量等于 pageSize，说明可能还有下一页
        return data.length === pageSize ? pageNo + 1 : undefined;
      }
    } catch {
      // 错误会在组件中处理
    }
    return undefined;
  }, []);

  // 构建收藏查询配置（禁用批处理，确保单独请求）
  // 收藏列表禁用缓存，因为会有删除新增操作
  const queryOptions = useMemo(
    () => ({
      initialPageParam: 1,
      getNextPageParam,
      // 收藏列表禁用缓存，确保每次都能获取最新数据
      staleTime: 0,
      gcTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      trpc: {
        context: {
          skipBatch: true
        }
      }
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
  } = useGetFavoriteListInfiniteQuery(
    {
      pageSize
    },
    queryOptions
  );

  // 扁平化所有页面的数据
  const templates = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages
      .map((page) => {
        try {
          const pageData = extractQueryData(page as FavoriteListPageData);
          return pageData?.data || [];
        } catch {
          return [];
        }
      })
      .flat();
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
          extractQueryData(page as FavoriteListPageData);
        } catch (err) {
          const { errorMessage } = extractErrorInfo(err);
          return errorMessage;
        }
      }
    }

    return undefined;
  }, [data, queryError]);

  // 加载更多数据
  const loadMore = () => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  };

  // 刷新数据
  const refresh = () => {
    refetch();
  };

  return {
    templates,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    error,
    loadMore,
    refresh
  };
}

export default useQueryProductAvatarFavoriteTemplate;
