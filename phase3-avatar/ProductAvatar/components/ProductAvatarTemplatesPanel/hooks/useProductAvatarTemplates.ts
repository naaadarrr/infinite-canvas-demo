'use client';

import { useMemo, useCallback } from 'react';
import { extractQueryData } from '@/lib/trpc/helper';
import { TRPCReturn, PaginatedResponse } from '@/lib/trpc/type';
import {
  useGetMetaListInfiniteQuery,
  useGetFavoriteListInfiniteQuery,
  useGetCollectionMetaListInfiniteQuery
} from '../../../data/template/useQueries';
import type { ProductAvatarFilterState } from '../../../store/templateAtoms';
import { ProductAvatarCategoryId } from '../../../type';
import {
  Gender,
  SortType,
  CommonSortField
} from '@/server/api/services/_common/type';
import {
  ProductAvatarMetaAvatarType,
  type ProductAvatarMetaFrontDTO
} from '@/server/api/services/productAvatar/template/type';

/** 模板列表分页响应类型 */
type MetaListPageData = TRPCReturn & {
  data?: PaginatedResponse<ProductAvatarMetaFrontDTO>;
};

interface UseProductAvatarTemplatesOptions {
  categoryId: string;
  showFavoritesOnly: boolean;
  filter: ProductAvatarFilterState;
  isMyAvatarCategory: boolean;
}

/**
 * 将前端筛选状态转换为 API 参数
 */
function buildQueryParams(
  categoryId: string,
  filter: ProductAvatarFilterState,
  showFavoritesOnly: boolean,
  isMyAvatarCategory: boolean
) {
  // 构建分类 ID（如果是 "all" 或 "my-product-avatar" 则不传）
  const categoryIds =
    categoryId !== ProductAvatarCategoryId.ALL &&
    categoryId !== ProductAvatarCategoryId.MY_PRODUCT_AVATAR
      ? categoryId
      : '';

  // 构建人种 ID（如果有多个，用逗号分隔）
  const ethnicityIds =
    filter.ethnicity.length > 0 ? filter.ethnicity.join(',') : undefined;

  // 构建性别（前端支持多选，但 API 只支持单选，如果选择了多个性别则不传参数）
  // 如果只选择了一个性别，则传递该性别；如果选择了多个或未选择，则不传
  const gender =
    filter.gender.length === 1
      ? filter.gender[0] === 'male'
        ? Gender.MALE
        : Gender.FEMALE
      : undefined;

  // 构建排序字段和排序类型
  // My Product Avatar 强制按生成时间倒序（越晚生成越靠前）
  const sortField = isMyAvatarCategory
    ? CommonSortField.GMT_CREATE
    : filter.sorting === 'popularity'
      ? CommonSortField.SORTING_VALUE
      : CommonSortField.GMT_CREATE;
  const sortType = SortType.DESC;

  // 构建 avatarType：My Product Avatar 分类需要传递 CUSTOM_USER
  const avatarType = isMyAvatarCategory
    ? ProductAvatarMetaAvatarType.CUSTOM_USER
    : ProductAvatarMetaAvatarType.CUSTOM_NONE;

  return {
    pageSize: 20,
    ethnicityIds,
    gender,
    sortField,
    sortType,
    avatarType,
    collectionId: categoryIds
  };
}

/**
 * 使用无限滚动查询 Product Avatar 模板列表
 */
export function useProductAvatarTemplates({
  categoryId,
  showFavoritesOnly,
  filter,
  isMyAvatarCategory
}: UseProductAvatarTemplatesOptions) {
  // 构建查询参数
  const queryParams = useMemo(
    () =>
      buildQueryParams(
        categoryId,
        filter,
        showFavoritesOnly,
        isMyAvatarCategory
      ),
    [categoryId, filter, showFavoritesOnly, isMyAvatarCategory]
  );

  // 构建分页参数获取函数（公共逻辑）
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

  // 构建公共查询配置（禁用批处理，确保单独请求）
  // My Product Avatar 和普通分类都走 getMetaListInfinite 接口
  // My Product Avatar 禁用缓存，因为会有删除新增操作
  const queryOptions = useMemo(
    () => ({
      enabled: !showFavoritesOnly,
      initialPageParam: 1,
      getNextPageParam,
      refetchOnWindowFocus: false,
      ...(isMyAvatarCategory && {
        staleTime: 0,
        gcTime: 0
      }),
      trpc: {
        context: {
          skipBatch: true
        }
      }
    }),
    [showFavoritesOnly, isMyAvatarCategory, getNextPageParam]
  );

  // 构建收藏查询配置（禁用批处理，确保单独请求）
  // 收藏列表禁用缓存，因为会有删除新增操作
  const favoriteQueryOptions = useMemo(
    () => ({
      enabled: showFavoritesOnly,
      initialPageParam: 1,
      getNextPageParam,
      refetchOnWindowFocus: false,
      staleTime: 0,
      gcTime: 0,
      trpc: {
        context: {
          skipBatch: true
        }
      }
    }),
    [showFavoritesOnly, getNextPageParam]
  );

  // 同时调用两个 Hook（符合 React Hooks 规则）
  const metaListQuery = useGetCollectionMetaListInfiniteQuery(
    queryParams,
    queryOptions
  );
  const favoriteListQuery = useGetFavoriteListInfiniteQuery(
    { pageSize: queryParams.pageSize },
    favoriteQueryOptions
  );

  // 根据视图类型选择使用哪个查询结果
  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    error
  } = showFavoritesOnly ? favoriteListQuery : metaListQuery;

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

  return {
    templates,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    error
  };
}
