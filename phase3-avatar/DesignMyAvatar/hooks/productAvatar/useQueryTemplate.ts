'use client';

import { useMemo, useCallback } from 'react';
import { extractQueryData, extractErrorInfo } from '@/lib/trpc/helper';
import { TRPCReturn, PaginatedResponse } from '@/lib/trpc/type';
import {
  useGetMetaListInfiniteQuery,
  useGetCollectionMetaListInfiniteQuery
} from '../../data/productAvatar/useQueries';
import type { ProductAvatarMetaFrontDTO } from '@/server/api/services/productAvatar/template/type';
import { ProductAvatarMetaAvatarType } from '@/server/api/services/productAvatar/template/type';
import { CommonSortField, SortType } from '@/server/api/services/_common/type';

/** 模板列表分页响应类型 */
type MetaListPageData = TRPCReturn & {
  data?: PaginatedResponse<ProductAvatarMetaFrontDTO>;
};

interface UseQueryProductAvatarTemplateOptions {
  categoryIds?: string;
  pageSize?: number;
  avatarType?: ProductAvatarMetaAvatarType;
  ethnicityIds?: string;
  sortType?: SortType;
}

/**
 * 查询 Product Avatar 模板列表 Hook
 * 支持分页加载更多功能
 *
 * @param options - 查询选项
 * @param options.categoryIds - 分类ID列表（可选，逗号分隔）
 * @param options.pageSize - 每页大小（可选，默认 20）
 * @param options.avatarType - 头像类型（可选，用于区分自定义用户头像等）
 * @param options.ethnicityIds - 种族ID列表（可选，逗号分隔）
 * @param options.sortField - 排序字段（可选）
 * @param options.sortType - 排序类型（可选，asc/desc）
 * @returns 返回模板列表数据和加载状态
 */
export function useQueryProductAvatarTemplate({
  categoryIds,
  pageSize = 50,
  avatarType,
  ethnicityIds,
  sortType = SortType.DESC
}: UseQueryProductAvatarTemplateOptions = {}) {
  // 构建分页参数获取函数
  const getNextPageParam = useCallback((lastPage: MetaListPageData) => {
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

  // 构建查询配置
  const queryOptions = useMemo(
    () => ({
      initialPageParam: 1,
      getNextPageParam,
      // 禁用缓存，确保每次都能获取最新数据
      staleTime: 0,
      gcTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      trpc: {
        context: {
          skipBatch: true // 禁用批处理，确保单独请求
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
  } = useGetCollectionMetaListInfiniteQuery(
    {
      sortType,
      sortField: CommonSortField.SORTING_VALUE,
      pageSize,
      collectionId: categoryIds || '',
      avatarType,
      ...(ethnicityIds && { ethnicityIds })
    },
    queryOptions
  );

  // 扁平化所有页面的数据
  const templates = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages
      .map((page) => {
        try {
          const pageData = extractQueryData(page as MetaListPageData);
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
          extractQueryData(page as MetaListPageData);
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

export default useQueryProductAvatarTemplate;
