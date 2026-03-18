'use client';

import { useMemo, useCallback } from 'react';
import { extractQueryData, extractErrorInfo } from '@/lib/trpc/helper';
import type { AigcPhotoAvatar4TemplateDTO } from '@/server/api/services/avatar4/type';
import type { TRPCReturn, PaginatedResponse } from '@/lib/trpc/type';
import { useGetFavoritePhotoAvatar4TemplatesInfiniteQuery } from '@/app/board/[id]/components/ToolPanel/feature/Avatar/DesignMyAvatar/data/avatar4/useQueries';

/** 收藏模板列表分页响应类型 */
type FavoriteTemplateListPageData = TRPCReturn & {
  data?: PaginatedResponse<AigcPhotoAvatar4TemplateDTO>;
};

/**
 * 查询收藏的 Avatar4 模板列表 Hook
 * 支持无限滚动加载更多功能
 *
 * @param options - 查询选项
 * @param options.sortField - 排序字段（可选，默认 'gmtCreate'）
 * @param options.sortType - 排序类型（可选，默认 'desc'）
 * @param options.pageSize - 每页大小（可选，默认 30）
 * @returns 返回收藏模板列表数据和加载状态
 * @example
 * ```tsx
 * const { templates, isLoading, error, hasMore, loadMore } = useQueryFavoriteAvatar4Template();
 *
 * if (isLoading && templates.length === 0) return <Loading />;
 * if (error) return <Error message={error} />;
 *
 * return (
 *   <div>
 *     {templates.map(template => (
 *       <TemplateItem key={template.id} template={template} />
 *     ))}
 *     {hasMore && (
 *       <button onClick={loadMore} disabled={isFetchingNextPage}>
 *         {isFetchingNextPage ? '加载中...' : '加载更多'}
 *       </button>
 *     )}
 *   </div>
 * );
 * ```
 */
export function useQueryFavoriteAvatar4Template(options?: {
  sortField?: string;
  sortType?: string;
  pageSize?: number;
}) {
  const {
    sortField = 'gmtCreate',
    sortType = 'desc',
    pageSize = 30
  } = options || {};

  // 计算下一页参数的函数
  const getNextPageParam = useCallback(
    (lastPage: FavoriteTemplateListPageData) => {
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

  // 构建查询配置
  const queryOptions = useMemo(
    () => ({
      initialPageParam: 1,
      getNextPageParam,
      // 禁用缓存，确保每次都能获取最新数据
      staleTime: 0,
      gcTime: 0,
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
  } = useGetFavoritePhotoAvatar4TemplatesInfiniteQuery(
    {
      pageSize,
      sortField,
      sortType
    },
    queryOptions
  );

  // 扁平化所有页面的数据
  const templates = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages
      .map((page) => {
        try {
          const pageData = extractQueryData(
            page as FavoriteTemplateListPageData
          );
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
        data.pages[0] as FavoriteTemplateListPageData
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
          extractQueryData(page as FavoriteTemplateListPageData);
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
    templates,
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
    allTemplates: templates
  };
}

export default useQueryFavoriteAvatar4Template;
