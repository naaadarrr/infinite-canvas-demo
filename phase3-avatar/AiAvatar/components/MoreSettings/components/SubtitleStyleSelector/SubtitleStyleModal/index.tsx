/**
 * SubtitleStyleModal 组件
 * 字幕样式选择弹窗
 */
'use client';

import { useEffect, useState, useRef } from 'react';
import type { CaptionInfo } from '@/server/api/services/mediaLibrary/caption/type';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Loader2, X, Ban } from 'lucide-react';
import { useGetCaptionListQuery } from '../../../../../data/mediaLibrary/useQueries';
import { extractQueryData, extractErrorInfo } from '@/lib/trpc/helper';
import { COMMON_INT_BOOLEAN } from '@/server/api/services/_common/type';
import useAwsS3 from '@/hooks/useAwsS3';

interface SubtitleStyleModalProps {
  /** 字幕 key */
  captionKey?: string;
  /** 字幕 key 变更回调 */
  onCaptionKeyChange: (key: string | undefined) => void;
  /** 关闭回调 */
  onClose: () => void;
}

export function SubtitleStyleModal({
  captionKey,
  onCaptionKeyChange,
  onClose
}: SubtitleStyleModalProps) {
  const [hoveredSubtitleStyleKey, setHoveredSubtitleStyleKey] =
    useState<string>();
  const [selectedSubtitleStyle, setSelectedSubtitleStyle] = useState<
    CaptionInfo | undefined
  >(undefined);
  const [subtitleStyleList, setSubtitleStyleList] = useState<
    Array<CaptionInfo>
  >([]);
  const [isFetchingSubtitleStyleList, setIsFetchingSubtitleStyleList] =
    useState(true);

  // 使用 useAwsS3 hook 获取 CDN URLs
  const { getCdnUrls } = useAwsS3();
  const getCdnUrlsRef = useRef(getCdnUrls);

  // 保持 getCdnUrls 的引用稳定
  useEffect(() => {
    getCdnUrlsRef.current = getCdnUrls;
  }, [getCdnUrls]);

  // 查询字幕列表（弹窗打开时自动查询）
  const { data, isLoading } = useGetCaptionListQuery(
    {
      convert: true,
      categories: ['1'], // 只使用基础字幕库 过滤掉 M2V 字幕库
      isDelete: false,
      status: 1,
      pageNo: 1,
      pageSize: 999
    },
    {
      enabled: true // 弹窗组件挂载时就开始查询
    }
  );

  // 当有数据时，处理字幕列表
  useEffect(() => {
    if (!data) {
      return;
    }

    const processCaptionList = async () => {
      setIsFetchingSubtitleStyleList(true);
      try {
        const extractedData = extractQueryData(data);
        if (
          extractedData &&
          typeof extractedData === 'object' &&
          'data' in extractedData
        ) {
          const captionList =
            (extractedData as { data?: CaptionInfo[] }).data || [];

          // 过滤启用的字幕样式
          const enabledSubtitleStyleList = captionList.filter(
            (subtitleStyle) => subtitleStyle.status === COMMON_INT_BOOLEAN.TRUE
          );

          // 构建 S3 路径映射
          const s3PathsRecord: Record<string, string> = {};
          enabledSubtitleStyleList.forEach((subtitleStyle) => {
            // 只处理非 HTTP URL 的路径（即 S3 路径）
            if (
              subtitleStyle.thumbnail &&
              !subtitleStyle.thumbnail.includes('http')
            ) {
              s3PathsRecord[`${subtitleStyle.resourceKey}_thumbnail`] =
                subtitleStyle.thumbnail;
            }
            if (
              subtitleStyle.thumbnailGif &&
              !subtitleStyle.thumbnailGif.includes('http')
            ) {
              s3PathsRecord[`${subtitleStyle.resourceKey}_thumbnailGif`] =
                subtitleStyle.thumbnailGif;
            }
          });

          // 获取 CDN URLs
          let cdnUrls: Record<string, string> = {};
          if (Object.keys(s3PathsRecord).length > 0) {
            try {
              cdnUrls = await getCdnUrlsRef.current(s3PathsRecord);
            } catch (error) {
              console.error('Failed to get CDN URLs:', error);
            }
          }

          // 合并 CDN URLs 到字幕样式列表
          const processedList = enabledSubtitleStyleList.map(
            (subtitleStyle) => ({
              ...subtitleStyle,
              thumbnail:
                cdnUrls[`${subtitleStyle.resourceKey}_thumbnail`] ||
                subtitleStyle.thumbnail ||
                '',
              thumbnailGif:
                cdnUrls[`${subtitleStyle.resourceKey}_thumbnailGif`] ||
                subtitleStyle.thumbnailGif ||
                ''
            })
          );

          setSubtitleStyleList(processedList);
        }
      } catch (error) {
        const { errorMessage } = extractErrorInfo(error);
        console.error(
          'Failed to extract caption list data:',
          errorMessage || error
        );
        setSubtitleStyleList([]);
      } finally {
        setIsFetchingSubtitleStyleList(false);
      }
    };

    processCaptionList();
  }, [data]);

  const handleMouseEnterSubtitleStyle = (subtitleStyle: CaptionInfo) => {
    setHoveredSubtitleStyleKey(subtitleStyle.resourceKey);
  };

  const handleMouseLeaveSubtitleStyle = () => {
    setHoveredSubtitleStyleKey(undefined);
  };

  const handleSelectSubtitleStyle = (subtitleStyle?: CaptionInfo) => {
    setSelectedSubtitleStyle(subtitleStyle);
  };

  const handleConfirmSubtitleStyle = () => {
    onCaptionKeyChange(selectedSubtitleStyle?.resourceKey);
    onClose();
  };

  // 根据 captionKey 初始化选中的字幕样式
  useEffect(() => {
    if (captionKey && subtitleStyleList.length > 0) {
      const found = subtitleStyleList.find(
        (style) => style.resourceKey === captionKey
      );
      if (found) {
        setSelectedSubtitleStyle(found);
      }
    } else if (!captionKey) {
      setSelectedSubtitleStyle(undefined);
    }
  }, [captionKey, subtitleStyleList]);

  const isFetching = isLoading || isFetchingSubtitleStyleList;

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className='max-w-[964px] w-[964px] max-h-[90vh] p-4 rounded-xl bg-[#272729] border-none overflow-hidden flex flex-col [&>button]:hidden'>
        <button
          onClick={onClose}
          className='absolute right-3 top-3 text-white/70 hover:text-white text-xs z-10'
        >
          <X className='h-3 w-3' />
        </button>
        <DialogHeader className='mb-4 flex-shrink-0'>
          <DialogTitle className='text-lg font-semibold text-white'>
            Subtitle Style
          </DialogTitle>
        </DialogHeader>

        <div className='h-[592px] max-h-[calc(90vh-240px)] mb-4 bg-[#161617] border-[0.85px] border-[#282B2F] rounded-lg flex flex-col'>
          {isFetching ? (
            <div className='h-full flex justify-center items-center'>
              <Loader2 className='w-8 h-8 animate-spin text-white' />
            </div>
          ) : (
            <div className='flex-1 overflow-auto min-h-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-[#363636] [&::-webkit-scrollbar-thumb]:rounded-[20px] [&::-webkit-scrollbar-track]:rounded-[20px]'>
              <div className='flex flex-wrap gap-[10px] mt-4 mr-0.5 mb-4 ml-4 pb-2'>
                {/* 无字幕选项 */}
                <div
                  className={`flex flex-col justify-center items-center gap-y-[3px] gap-x-0 w-[120px] h-14 bg-[#272729] rounded-lg overflow-hidden cursor-pointer hover:outline hover:outline-[1.5px] hover:outline-[#4E40F3] hover:outline-offset-0 ${
                    selectedSubtitleStyle?.resourceKey === undefined
                      ? 'outline outline-[1.5px] outline-[#4E40F3] outline-offset-0'
                      : ''
                  }`}
                  onClick={() => handleSelectSubtitleStyle()}
                >
                  <Ban className='h-6 w-6 text-white/60' />
                  <span className='text-xs font-medium text-[#FFFFFFB2]'>
                    No Subtitle
                  </span>
                </div>

                {/* 字幕样式列表 */}
                {subtitleStyleList?.map((subtitleStyle) => {
                  const isSelected =
                    selectedSubtitleStyle?.resourceKey ===
                    subtitleStyle.resourceKey;
                  const isHovered =
                    hoveredSubtitleStyleKey === subtitleStyle.resourceKey;

                  return (
                    <div
                      key={subtitleStyle.resourceKey}
                      className={`w-[120px] h-14 bg-[#272729] rounded-lg cursor-pointer hover:outline hover:outline-[1.5px] hover:outline-[#4E40F3] hover:outline-offset-0 ${
                        isSelected
                          ? 'outline outline-[1.5px] outline-[#4E40F3] outline-offset-0'
                          : ''
                      }`}
                      onClick={() => handleSelectSubtitleStyle(subtitleStyle)}
                      onMouseEnter={() =>
                        handleMouseEnterSubtitleStyle(subtitleStyle)
                      }
                      onMouseLeave={handleMouseLeaveSubtitleStyle}
                    >
                      <div className='w-full h-full overflow-hidden rounded-lg'>
                        {(() => {
                          const imageSrc = isHovered
                            ? subtitleStyle.thumbnailGif
                            : subtitleStyle.thumbnail;

                          // 如果 src 为空字符串或无效，不渲染 Image，显示占位符
                          if (!imageSrc || !imageSrc.trim()) {
                            return (
                              <div className='w-full h-full flex items-center justify-center bg-[#1a1a1a]' />
                            );
                          }

                          return (
                            <Image
                              src={imageSrc}
                              alt='subtitleStyle'
                              width={120}
                              height={56}
                              className='w-full h-full object-contain'
                            />
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className='flex justify-center gap-x-3 flex-shrink-0'>
          <Button
            variant='outline'
            className='w-[140px] h-10 bg-[#3A3A3C] text-base text-white border-none rounded-lg hover:bg-[#575757] active:bg-[#575757]'
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className='w-[140px] h-10 bg-[#4E40F3] text-base text-white rounded-lg hover:bg-[#4E40F3] active:bg-[#4E40F3]'
            onClick={handleConfirmSubtitleStyle}
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
