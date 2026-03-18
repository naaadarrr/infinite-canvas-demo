'use client';

import { useMemo } from 'react';
import { extractQueryData, extractErrorInfo } from '@/lib/trpc/helper';
import { TRPCReturn } from '@/lib/trpc/type';
import { useGetCollectionListQuery } from '../../data/productAvatar/useQueries';

/**
 * 查询 Product Avatar 合集列表 Hook
 * 获取产品头像模板的合集信息
 *
 * @returns 返回处理后的合集列表数据和状态
 * @example
 * ```tsx
 * const { collectionCategories, collectionLoading, collectionQueryError } = useQueryProductAvatarCategory();
 *
 * if (collectionLoading) return <Loading />;
 * if (collectionQueryError) return <Error message={collectionQueryError} />;
 *
 * return (
 *   <div>
 *     {collectionCategories.map(collection => (
 *       <CollectionItem key={collection.id} collection={collection} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useQueryProductAvatarCategory() {
  const {
    data: collectionData,
    isLoading: collectionLoading,
    error: collectionError
  } = useGetCollectionListQuery(undefined, { refetchOnWindowFocus: false });

  // 提取合集列表
  const collectionCategories = useMemo<any[]>(() => {
    const result = extractQueryData(collectionData as TRPCReturn);
    return result || [];
  }, [collectionData]);

  // 处理合集错误信息
  const collectionQueryError = useMemo<string | undefined>(() => {
    if (collectionError) {
      const { errorMessage } = extractErrorInfo(collectionError);
      return errorMessage;
    }

    // 如果数据存在但提取失败，说明是业务错误
    if (collectionData) {
      try {
        extractQueryData(collectionData as TRPCReturn);
      } catch (err) {
        const { errorMessage } = extractErrorInfo(err);
        return errorMessage;
      }
    }

    return undefined;
  }, [collectionData, collectionError]);

  return {
    collectionCategories,
    collectionQueryError,
    collectionLoading
  };
}

export default useQueryProductAvatarCategory;
