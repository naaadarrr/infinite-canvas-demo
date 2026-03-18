'use client';

import { useMemo } from 'react';
import { extractQueryData, extractErrorInfo } from '@/lib/trpc/helper';
import { useGetAllCollectionsQuery } from '@/app/board/[id]/components/ToolPanel/feature/Avatar/DesignMyAvatar/data/avatar4/useQueries';

/**
 * 查询 Avatar4 分类列表 Hook
 * 获取头像模板的合集分类信息
 *
 * @returns 返回处理后的合集分类数据和状态
 */
export function useQueryAvatar4Category() {
  const {
    data: collectionData,
    isLoading: collectionLoading,
    error: collectionError
  } = useGetAllCollectionsQuery(undefined, { refetchOnWindowFocus: false });

  // 提取合集列表
  const collectionCategories = useMemo(() => {
    return extractQueryData(collectionData) || [];
  }, [collectionData]);

  const collectionQueryError = useMemo<string | undefined>(() => {
    if (collectionError) {
      const { errorMessage } = extractErrorInfo(collectionError);
      return errorMessage;
    }

    // 如果数据存在但提取失败，说明是业务错误
    if (collectionData) {
      try {
        extractQueryData(collectionData);
      } catch (err) {
        const { errorMessage } = extractErrorInfo(err);
        return errorMessage;
      }
    }

    return undefined;
  }, [collectionData, collectionError]);

  return {
    collectionQueryError,
    collectionCategories,
    collectionLoading
  };
}

export default useQueryAvatar4Category;
