'use client';

import { useState, useCallback } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil-next';
import { ChevronDown, Loader2 } from 'lucide-react';
// ToolPanel store & hooks
import { currentToolTypeState } from '@/app/board/[id]/components/ToolPanel/store';
import { useAIVideoFormSetter } from '../../hooks/useAIVideoForm';
// Local store
import { gridColumnsState } from '@/app/board/[id]/components/BoardWorkspace/store/taskAssets/viewSettings/atoms';
import { cn } from '@/lib/utils';
// Data hooks
import {
  useVideoInspirationQuery,
  useVideoInspirationCollectionsQuery,
  useAiVideoConfigQuery
} from '../../data/useQueries';
import {
  VideoInspirationItem,
  InspirationItemCollectionList
} from '@/server/api/services/common/inspiration/type';
import useAwsS3 from '@/hooks/useAwsS3';
// Helpers
import {
  buildInspirationPreset,
  extractS3PathsFromInspiration
} from '../../helpers/buildInspirationPreset';

/**
 * AIVideoInspiration - AI 视频灵感库组件
 * 展示精选视频模板和灵感作品，瀑布流布局
 */
export default function AIVideoInspiration() {
  const gridColumns = useRecoilValue(gridColumnsState);
  const setCurrentToolType = useSetRecoilState(currentToolTypeState);
  const { getCdnUrls } = useAwsS3();

  // 工具专用 setter（内部自动获取 activeTabId）
  const setAIVideoForm = useAIVideoFormSetter();

  const [selectedCollectionId, setSelectedCollectionId] =
    useState<string>('all');
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(false);

  // 获取模型配置数据，用于判断模型能力
  const { data: configData } = useAiVideoConfigQuery();

  // 获取集合列表
  const { data: collectionsRes, isLoading: isCollectionsLoading } =
    useVideoInspirationCollectionsQuery();
  const collections = collectionsRes?.data || [];

  // 获取灵感列表，"all" 时传 undefined 表示不过滤集合
  const { data: inspirationsRes, isLoading: isInspirationsLoading } =
    useVideoInspirationQuery({
      collectionId:
        selectedCollectionId === 'all' ? undefined : selectedCollectionId,
      pageNo: 1,
      pageSize: 50
    });
  const inspirations = inspirationsRes?.data?.data || [];

  const handleCreateSimilar = useCallback(
    async (item: VideoInspirationItem, e: React.MouseEvent) => {
      e.stopPropagation();

      // 1. 提取需要获取 CDN URL 的 S3 路径
      const { imagePaths, videoPaths } = extractS3PathsFromInspiration(item);

      // 2. 批量获取 CDN URLs
      let cdnUrlMap: Record<string, string> = {};
      if (imagePaths.length > 0) {
        const pathMap = imagePaths.reduce(
          (acc, path) => ({ ...acc, [path]: path }),
          {}
        );
        cdnUrlMap = await getCdnUrls(pathMap);
      }

      let videoCdnUrlMap: Record<string, string> = {};
      if (videoPaths.length > 0) {
        const videoPathMap = videoPaths.reduce(
          (acc, path) => ({ ...acc, [path]: path }),
          {}
        );
        videoCdnUrlMap = await getCdnUrls(videoPathMap);
      }

      // 3. 使用纯函数构建预设值
      const { toolType, preset } = buildInspirationPreset({
        item,
        configData: configData?.data,
        cdnUrlMap,
        videoCdnUrlMap
      });

      // 4. 切换工具类型并填充表单
      setCurrentToolType(toolType);
      setAIVideoForm(preset);
    },
    [configData?.data, getCdnUrls, setCurrentToolType, setAIVideoForm]
  );

  if (isCollectionsLoading) {
    return (
      <div className='flex h-40 items-center justify-center'>
        <Loader2 className='h-6 w-6 animate-spin text-white/20' />
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full'>
      {/* Category Filter Bar */}
      <div className='flex items-start gap-1.5 pb-3 flex-shrink-0'>
        <div
          className={cn(
            'flex-1 flex items-center gap-1.5 transition-all duration-200',
            isCategoryExpanded ? 'flex-wrap' : 'overflow-hidden max-h-[26px]'
          )}
        >
          <button
            onClick={() => setSelectedCollectionId('all')}
            className={cn(
              'flex-shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150 border',
              selectedCollectionId === 'all'
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-white/70 border-white/20 hover:border-white/40 hover:text-white'
            )}
          >
            All
          </button>
          {collections.map((category: InspirationItemCollectionList) => (
            <button
              key={category.collectionId}
              onClick={() => setSelectedCollectionId(category.collectionId)}
              className={cn(
                'flex-shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150 border',
                selectedCollectionId === category.collectionId
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-white/70 border-white/20 hover:border-white/40 hover:text-white'
              )}
            >
              {category.collectionName}
            </button>
          ))}
        </div>
        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsCategoryExpanded(!isCategoryExpanded)}
          className='flex-shrink-0 rounded-md p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-all duration-150'
        >
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              isCategoryExpanded && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* Masonry Grid */}
      <div className='flex-1 overflow-y-auto scrollbar-none'>
        {isInspirationsLoading ? (
          <div className='flex h-40 items-center justify-center'>
            <Loader2 className='h-6 w-6 animate-spin text-white/20' />
          </div>
        ) : inspirations.length === 0 ? (
          <div className='flex h-40 items-center justify-center text-white/20 text-sm'>
            No inspirations found
          </div>
        ) : (
          <div
            style={{
              columnCount: gridColumns,
              columnGap: '12px'
            }}
          >
            {inspirations.map((item: VideoInspirationItem) => (
              <div
                key={item.taskId}
                className='group mb-3 break-inside-avoid overflow-hidden rounded-xl border border-white/5 bg-white/5 transition-all duration-200 hover:border-white/20 hover:shadow-lg hover:shadow-black/30 cursor-pointer'
              >
                <div
                  className='relative overflow-hidden bg-white/5'
                  style={{
                    aspectRatio: '1/1' // 视频通常使用 1:1 封面，或者根据 item 动态计算
                  }}
                >
                  <img
                    src={item.coverUrl}
                    alt={item.prompt || 'Inspiration'}
                    draggable={false}
                    className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 select-none'
                    loading='lazy'
                  />
                  {/* Hover overlay with "Create Similar" button */}
                  <div className='absolute inset-0 flex items-end justify-center pb-3 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
                    <button
                      onClick={(e) => handleCreateSimilar(item, e)}
                      className='rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg transition-transform hover:scale-105 hover:bg-indigo-500'
                    >
                      Create Similar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
