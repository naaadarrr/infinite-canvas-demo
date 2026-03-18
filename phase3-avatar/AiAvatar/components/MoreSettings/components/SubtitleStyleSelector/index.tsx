import { useState, useEffect, useRef } from 'react';
import { Ban } from 'lucide-react';
import Image from 'next/image';
import { SubtitleStyleModal } from './SubtitleStyleModal';
import { useGetCaptionListQuery } from '../../../../data/mediaLibrary/useQueries';
import { extractQueryData } from '@/lib/trpc/helper';
import { COMMON_INT_BOOLEAN } from '@/server/api/services/_common/type';
import useAwsS3 from '@/hooks/useAwsS3';
import type { CaptionInfo } from '@/server/api/services/mediaLibrary/caption/type';

interface SubtitleStyleSelectorProps {
  /** 字幕 key */
  captionKey?: string;
  /** 字幕 key 变更回调 */
  onCaptionKeyChange: (key: string | undefined) => void;
}

export function SubtitleStyleSelector({
  captionKey,
  onCaptionKeyChange
}: SubtitleStyleSelectorProps) {
  const [showModal, setShowModal] = useState(false);
  const [captionInfo, setCaptionInfo] = useState<CaptionInfo | undefined>();
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>();

  const { getCdnUrls } = useAwsS3();
  const getCdnUrlsRef = useRef(getCdnUrls);

  // 保持 getCdnUrls 的引用稳定
  useEffect(() => {
    getCdnUrlsRef.current = getCdnUrls;
  }, [getCdnUrls]);

  // 查询字幕列表以获取字幕信息
  const { data } = useGetCaptionListQuery(
    {
      convert: true,
      categories: ['1'],
      isDelete: false,
      status: 1,
      pageNo: 1,
      pageSize: 999
    },
    {
      enabled: !!captionKey // 只在有 captionKey 时查询
    }
  );

  // 从查询结果中提取字幕信息并获取封面图
  useEffect(() => {
    if (!captionKey || !data) {
      setCaptionInfo(undefined);
      setThumbnailUrl(undefined);
      return;
    }

    const processCaptionInfo = async () => {
      try {
        const extractedData = extractQueryData(data);
        if (
          extractedData &&
          typeof extractedData === 'object' &&
          'data' in extractedData
        ) {
          const captionList =
            (extractedData as { data?: CaptionInfo[] }).data || [];
          const found = captionList.find(
            (caption) => caption.resourceKey === captionKey
          );

          if (!found) {
            setCaptionInfo(undefined);
            setThumbnailUrl(undefined);
            return;
          }

          setCaptionInfo(found);

          // 如果 thumbnail 是 S3 路径，获取 CDN URL
          if (found.thumbnail && !found.thumbnail.includes('http')) {
            try {
              const cdnUrls = await getCdnUrlsRef.current({
                [`${found.resourceKey}_thumbnail`]: found.thumbnail
              });
              const cdnUrl = cdnUrls[`${found.resourceKey}_thumbnail`];
              setThumbnailUrl(cdnUrl || found.thumbnail);
            } catch (error) {
              console.error('Failed to get CDN URL for thumbnail:', error);
              setThumbnailUrl(found.thumbnail);
            }
          } else {
            setThumbnailUrl(found.thumbnail);
          }
        }
      } catch (error) {
        console.error('Failed to extract caption info:', error);
        setCaptionInfo(undefined);
        setThumbnailUrl(undefined);
      }
    };

    processCaptionInfo();
  }, [captionKey, data]);

  return (
    <>
      <div>
        <label className='mb-2 block text-sm text-white/60'>
          Subtitle Style
        </label>
        <button
          onClick={() => setShowModal(true)}
          className='flex h-14 w-[120px] items-center justify-center rounded-lg border border-white/10 bg-white/5 transition hover:bg-white/10 overflow-hidden'
        >
          {!captionKey ? (
            <Ban className='h-6 w-6 text-white/60' />
          ) : thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={captionInfo?.captionName || 'Subtitle Style'}
              width={120}
              height={56}
              className='w-full h-full object-contain'
            />
          ) : (
            <span className='text-sm text-white/80'>
              {captionInfo?.captionName || 'Style'}
            </span>
          )}
        </button>
      </div>

      {showModal && (
        <SubtitleStyleModal
          captionKey={captionKey}
          onCaptionKeyChange={onCaptionKeyChange}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
