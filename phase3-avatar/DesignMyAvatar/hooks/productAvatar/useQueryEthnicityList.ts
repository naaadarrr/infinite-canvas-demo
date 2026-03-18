'use client';

import { useMemo } from 'react';
import { extractQueryData, extractErrorInfo } from '@/lib/trpc/helper';
import { TRPCReturn } from '@/lib/trpc/type';
import { useGetEthnicityListQuery } from '../../data/productAvatar/useQueries';
import type {
  EthnicityItem,
  EthnicityListResult
} from '@/server/api/services/mediaLibrary/aiAvatar/type';

/**
 * 查询种族列表 Hook
 * 获取可用的种族分类信息
 */
export function useQueryEthnicityList() {
  const {
    data,
    isLoading,
    error: queryError
  } = useGetEthnicityListQuery(undefined, {
    refetchOnWindowFocus: false
  });

  // 提取数据
  const ethnicityData = useMemo<EthnicityListResult | undefined>(() => {
    if (!data) return undefined;

    try {
      return extractQueryData(data as TRPCReturn);
    } catch {
      return undefined;
    }
  }, [data]);

  // 提取种族列表
  const ethnicityList = useMemo<EthnicityItem[]>(() => {
    return ethnicityData?.data || [];
  }, [ethnicityData]);

  // 处理错误信息
  const error = useMemo<string | undefined>(() => {
    if (queryError) {
      const { errorMessage } = extractErrorInfo(queryError);
      return errorMessage;
    }

    // 如果数据存在但提取失败，说明是业务错误
    if (data) {
      try {
        extractQueryData(data as TRPCReturn);
      } catch (err) {
        const { errorMessage } = extractErrorInfo(err);
        return errorMessage;
      }
    }

    return undefined;
  }, [data, queryError]);

  return {
    ethnicityList,
    isLoading,
    error
  };
}

export default useQueryEthnicityList;
