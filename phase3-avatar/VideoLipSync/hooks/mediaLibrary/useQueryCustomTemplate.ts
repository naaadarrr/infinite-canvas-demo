'use client';

import { useMemo } from 'react';
import { extractQueryData, extractErrorInfo } from '@/lib/trpc/helper';
import {
  CustomAvatarAccessSource,
  CustomAvatarType
} from '@/server/api/services/mediaLibrary/aiAvatar/type';
import type { AiAvatarDTO } from '@/server/api/services/mediaLibrary/aiAvatar/type';
import { useGetCustomAiAvatarListQuery } from '../../data/mediaLibrary/useQueries';

/**
 * 查询用户自定义的 Video Lip Sync 头像列表 Hook
 * 获取当前用户创建的自定义头像（用于 Video Lip Sync）
 *
 * 禁用缓存：每次挂载都从服务端拉取最新数据
 */
export function useQueryCustomAvatar4Template() {
  const {
    data,
    isLoading,
    error: queryError,
    refetch
  } = useGetCustomAiAvatarListQuery(
    {
      source: CustomAvatarAccessSource.INDEPENDENT_AVATAR,
      type: CustomAvatarType.VIDEO
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
    error,
    refetch
  };
}
