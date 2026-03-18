'use client';

import { useState, useEffect, useMemo } from 'react';
import { extractQueryData, extractErrorInfo } from '@/lib/trpc/helper';
import type { TemplatePrompt } from '@/server/api/services/promptToAvatar/type';
import type { PaginatedResponse } from '@/lib/trpc/type';
import { usePromptToAvatarTemplateQuery } from '@/app/board/[id]/components/ToolPanel/feature/Avatar/DesignMyAvatar/data/usePromptToAvatarTemplateQuery';

/**
 * 查询模板提示词列表 Hook
 * 支持分页加载更多功能
 */
export function useTemplatePrompts() {
  const [pageNo, setPageNo] = useState(1);
  const [templates, setTemplates] = useState<TemplatePrompt[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isQueryEnabled, setIsQueryEnabled] = useState(true); // 默认启用第一页查询

  const {
    data: response,
    isLoading,
    error: queryError,
    refetch
  } = usePromptToAvatarTemplateQuery(
    { pageNo, pageSize: 30 },
    {
      enabled: isQueryEnabled // 只在明确启用时才执行查询
    }
  );

  // 使用 extractQueryData 安全提取分页数据
  const pageData = useMemo<
    PaginatedResponse<TemplatePrompt> | undefined
  >(() => {
    if (!response) return undefined;

    try {
      return extractQueryData(response);
    } catch {
      return undefined;
    }
  }, [response]);

  // 处理分页数据更新
  useEffect(() => {
    if (pageData) {
      const newData = pageData.data || [];

      setTemplates((prev) => {
        if (pageNo === 1) {
          return newData;
        }
        return [...prev, ...newData];
      });

      // 计算是否还有更多数据
      const total = pageData.total || 0;
      const pageSize = pageData.pageSize || 30;
      const loadedCount = pageNo * pageSize;
      setHasMore(loadedCount < total);

      // 数据加载完成后禁用查询，避免自动触发下一页
      setIsQueryEnabled(false);
    }
  }, [pageData, pageNo]);

  // 使用 extractErrorInfo 统一错误处理
  const error = useMemo<string | undefined>(() => {
    if (queryError) {
      const { errorMessage } = extractErrorInfo(queryError);
      return errorMessage;
    }

    // 如果响应存在但数据提取失败，说明是业务错误
    if (response) {
      try {
        extractQueryData(response);
      } catch (err) {
        const { errorMessage } = extractErrorInfo(err);
        return errorMessage;
      }
    }

    return undefined;
  }, [response, queryError]);

  // 加载更多数据
  const loadMore = () => {
    if (!isLoading && hasMore) {
      setPageNo((prev) => prev + 1);
      setIsQueryEnabled(true); // 启用查询以加载下一页
    }
  };

  // 刷新数据（重置到第一页）
  const refresh = () => {
    setPageNo(1);
    setTemplates([]);
    setHasMore(true);
    setIsQueryEnabled(true); // 启用查询以重新加载第一页
    refetch();
  };

  return {
    templates,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
    currentPage: pageNo,
    totalCount: pageData?.total || 0
  };
}
