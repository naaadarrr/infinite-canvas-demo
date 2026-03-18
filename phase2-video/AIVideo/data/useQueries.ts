import { trpc } from '@/lib/trpc/client';

/**
 * 获取 AI 视频配置（模型列表、提供商、定价等）
 */
export const useAiVideoConfigQuery = () => {
  return trpc.aiVideo.getAiVideoConfig.useQuery(undefined, {
    staleTime: 1000 * 60 * 5 // 5 分钟
  });
};

/**
 * 查询视频灵感列表
 */
export const useVideoInspirationQuery = (params: {
  collectionId?: string;
  pageNo?: number;
  pageSize?: number;
}) => {
  return trpc.common.inspiration.queryVideoInspiration.useQuery(params, {
    staleTime: 1000 * 60 * 5 // 5 分钟
  });
};

/**
 * 查询视频灵感集合列表
 */
export const useVideoInspirationCollectionsQuery = () => {
  return trpc.common.inspiration.queryVideoInspirationCollections.useQuery(
    undefined,
    {
      staleTime: 1000 * 60 * 5 // 5 分钟
    }
  );
};

/**
 * 查询单个视频灵感详情
 */
export const useVideoInspirationDetailQuery = (
  templateId: string | null,
  options?: { enabled?: boolean }
) => {
  return trpc.inspiration.videoDetail.useQuery(
    { templateId: templateId! },
    {
      enabled: !!templateId && options?.enabled !== false,
      staleTime: 1000 * 60 * 5 // 5 分钟
    }
  );
};
