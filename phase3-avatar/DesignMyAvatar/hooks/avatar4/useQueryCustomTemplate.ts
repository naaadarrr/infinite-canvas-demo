'use client';

import { useMemo } from 'react';
import { extractQueryData, extractErrorInfo } from '@/lib/trpc/helper';
import {
  CustomAvatarAccessSource,
  CustomAvatarType
} from '@/server/api/services/mediaLibrary/aiAvatar/type';
import type { AiAvatarDTO } from '@/server/api/services/mediaLibrary/aiAvatar/type';
import { useGetCustomAiAvatarListQuery } from '@/app/board/[id]/components/ToolPanel/feature/Avatar/DesignMyAvatar/data/avatar4/useQueries';

/**
 * 查询用户自定义的 Avatar4 数字人列表 Hook
 */
export function useQueryCustomAvatar4Template() {
  const {
    data,
    isLoading,
    error: queryError
  } = useGetCustomAiAvatarListQuery(
    {
      source: CustomAvatarAccessSource.INDEPENDENT_AVATAR,
      type: CustomAvatarType.PHOTO
    },
    {
      // 禁用缓存，确保每次都能获取最新数据
      staleTime: 0,
      gcTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: false
    }
  );

  // 提取列表数据
  const list = useMemo<AiAvatarDTO[]>(() => {
    try {
      const result = extractQueryData(data);
      return result || [];
    } catch {
      return [];
    }
  }, [data]);

  // 处理错误信息
  const error = useMemo<string | undefined>(() => {
    if (queryError) {
      const { errorMessage } = extractErrorInfo(queryError);
      return errorMessage;
    }
    // 如果数据存在但提取失败，说明是业务错误
    if (data) {
      try {
        extractQueryData(data);
      } catch (err) {
        const { errorMessage } = extractErrorInfo(err);
        return errorMessage;
      }
    }
    return undefined;
  }, [data, queryError]);

  return {
    list,
    isLoading,
    error
  };
}
