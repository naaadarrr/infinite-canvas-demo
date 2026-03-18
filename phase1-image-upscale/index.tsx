'use client';

/**
 * Image Upscale 图片放大工具
 * 将低分辨率图片放大到更高分辨率
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { useRecoilState } from 'recoil-next';
import { ImagePlus, Upload, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveTabId } from '@/app/board/[id]/components/ToolPanel/hooks/useActiveTabId';
import { useAssetSelect } from '@/app/board/[id]/components/ToolPanel/hooks/useAssetSelect';
import useAwsS3 from '@/hooks/useAwsS3';
import { MediaType } from '@/server/api/services/board/common';
import { MimeType } from '@/types/common/resource';
import {
  GenerateButtonContainer,
  GenerateButtonBase,
  GenerateButtonLoading
} from '@/app/board/[id]/components/ToolPanel/components/primitives/GenerateButton';
import {
  CreditBadge,
  formatCredits
} from '@/app/board/[id]/components/ToolPanel/components/primitives/CreditBadge';
import { imageUpscaleFormFamily } from './store/atoms';
import { useImageUpscaleTaskGeneration } from './hooks/useImageUpscaleTaskGeneration';
import {
  IMAGE_UPSCALE_S3_PATH_PREFIX,
  getCreditCostByResolution,
  TARGET_RESOLUTION_OPTIONS,
  ImageUpscaleResolution
} from './config';
import {
  validateAndProcessImage,
  generateS3UploadPath,
  getMimeType
} from '@/utils/file';
import { toast } from '@/hooks/useToast';
import {
  trackCreditConsumptionGenTask,
  CreditConsumingGenTaskType
} from '@/utils/creditGa';

export function ImageUpscale() {
  const tabId = useActiveTabId();
  const { startAssetSelect } = useAssetSelect();
  const [formValues, setFormValues] = useRecoilState(
    imageUpscaleFormFamily(tabId)
  );
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectContainerRef = useRef<HTMLDivElement>(null);

  // 使用任务生成 Hook
  const { isSubmitting, generateTask } = useImageUpscaleTaskGeneration();

  // 使用 S3 上传 Hook
  const { uploadFileToS3, getFileUrl } = useAwsS3();

  const { sourceImage, sourceImagePath, targetResolution } = formValues;

  // 是否正在处理中（提交任务或上传文件时禁用表单）
  const isProcessing = isSubmitting || isUploading;

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectContainerRef.current &&
        !selectContainerRef.current.contains(event.target as Node)
      ) {
        setIsSelectOpen(false);
      }
    };

    if (isSelectOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSelectOpen]);

  // 设置源图片（同时设置 URL 和 S3 路径）
  const setSourceImage = useCallback(
    (image: string | null, s3Path?: string | null) => {
      setFormValues((prev) => ({
        ...prev,
        sourceImage: image,
        sourceImagePath: s3Path ?? null
      }));
    },
    [setFormValues]
  );

  // 处理文件上传到 S3
  const handleFileUploadToS3 = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        // 1. 验证并处理图片（压缩、格式转换等）
        const processedFile = await validateAndProcessImage({
          file,
          processingOptions: {
            maxWidth: 4096,
            maxHeight: 4096,
            quality: 0.9,
            format: 'jpeg'
          }
        });

        // 2. 生成预览 URL
        const blobUrl = URL.createObjectURL(processedFile);
        setSourceImage(blobUrl, null); // 先显示预览，上传成功后再更新 s3Path

        // 3. 生成 S3 上传路径
        const uploadS3Path = generateS3UploadPath(
          processedFile,
          IMAGE_UPSCALE_S3_PATH_PREFIX
        );

        // 4. 获取 MIME 类型
        const mimeType = getMimeType(processedFile);
        if (!mimeType) {
          throw new Error(
            'Unsupported image format. Supported: JPG, PNG, WEBP'
          );
        }

        // 5. 上传到 S3
        const uploadedS3Path = await uploadFileToS3({
          file: processedFile,
          s3Path: uploadS3Path,
          mimeType: mimeType as MimeType
        });

        if (!uploadedS3Path) {
          throw new Error('Failed to upload image.');
        }

        // 6. 获取 CDN URL 并更新状态
        const cdnUrl = await getFileUrl(uploadedS3Path);
        setSourceImage(cdnUrl, uploadedS3Path);
      } catch (error) {
        const errorMessage =
          (error as Error)?.message ||
          'Failed to upload image. Please try again later.';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
        setSourceImage(null, null); // 上传失败，清空状态
        console.error('[ImageUpscale] Failed to upload file:', error);
      } finally {
        setIsUploading(false);
      }
    },
    [uploadFileToS3, getFileUrl, setSourceImage]
  );

  // 处理文件选择（上传到 S3）
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await handleFileUploadToS3(file);
      }
      // 清空 input 值，允许重复选择同一文件
      e.target.value = '';
    },
    [handleFileUploadToS3]
  );

  // 处理拖放（上传到 S3）
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) {
        await handleFileUploadToS3(file);
      }
    },
    [handleFileUploadToS3]
  );

  // 处理生成
  const handleGenerate = useCallback(async () => {
    if (!sourceImage || !sourceImagePath) return;
    // GA 埋点：积分消耗
    const creditConsumed = getCreditCostByResolution(targetResolution);
    trackCreditConsumptionGenTask({
      type: CreditConsumingGenTaskType.IMAGE_UPSCALE,
      creditConsumed
    });
    await generateTask(formValues);
  }, [
    sourceImage,
    sourceImagePath,
    generateTask,
    formValues,
    targetResolution
  ]);

  // 计算积分成本（根据分辨率定价）
  const totalCost = formatCredits(getCreditCostByResolution(targetResolution));

  return (
    <div className='flex h-full w-full flex-col'>
      {/* 表单内容 */}
      <div className='flex-1 space-y-4 overflow-y-auto p-4'>
        {/* 图片上传区 */}
        <div>
          <div className='mb-2'>
            <label className='text-sm text-white/60'>Upload Image</label>
          </div>

          <div
            data-drop-zone='image'
            onDragOver={(e) => {
              if (isProcessing) return;
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = 'copy';
              setIsDragOver(true);
            }}
            onDragLeave={(e) => {
              if (isProcessing) return;
              e.preventDefault();
              e.stopPropagation();
              const rect = (
                e.currentTarget as HTMLElement
              ).getBoundingClientRect();
              const x = e.clientX;
              const y = e.clientY;
              if (
                x < rect.left ||
                x > rect.right ||
                y < rect.top ||
                y > rect.bottom
              ) {
                setIsDragOver(false);
              }
            }}
            onDragEnd={(e) => {
              if (isProcessing) return;
              e.preventDefault();
              e.stopPropagation();
              setIsDragOver(false);
            }}
            onDrop={(e) => {
              if (isProcessing) return;
              handleDrop(e);
              setIsDragOver(false);
            }}
            onMouseEnter={() => {
              if (isProcessing) return;
              const dragData = window.__dragData;
              if (dragData && dragData.type === MediaType.IMAGE) {
                setIsDragOver(true);
              }
            }}
            onMouseLeave={() => {
              setIsDragOver(false);
            }}
            onMouseUp={(e) => {
              if (isProcessing) return;
              const windowWithDragData = window;
              const dragData = windowWithDragData.__dragData;
              if (
                dragData &&
                dragData.url &&
                dragData.type === MediaType.IMAGE
              ) {
                e.stopPropagation();
                // 从 Board 拖入的图片，同时设置 URL 和 S3 路径
                setSourceImage(dragData.url, dragData.s3Path);
                delete windowWithDragData.__dragData;
              }
              setIsDragOver(false);
            }}
            className={cn(
              'rounded-lg border-2 border-dashed transition-all',
              isProcessing && 'pointer-events-none opacity-50',
              isDragOver && !sourceImage
                ? 'border-white/50 bg-white/10'
                : 'border-transparent'
            )}
          >
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              onChange={handleFileSelect}
              className='hidden'
            />

            {/* Re-edit URL 加载中状态 */}
            {!sourceImage && sourceImagePath ? (
              <div className='flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-white/5'>
                <div className='h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/60' />
                <span className='text-sm text-white/50'>Loading image...</span>
              </div>
            ) : sourceImage ? (
              // 图片预览
              <div className='group/img relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-white/10 bg-black/20'>
                <img
                  src={sourceImage}
                  alt=''
                  className='h-full w-full object-contain'
                />
                {/* 删除按钮 - 处理中时隐藏 */}
                {!isProcessing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSourceImage(null, null);
                      setIsDragOver(false);
                    }}
                    className='absolute right-1 top-1 rounded bg-black/60 p-0.5 text-white/70 opacity-0 transition hover:bg-black/80 hover:text-white group-hover/img:opacity-100'
                    title='Remove'
                  >
                    <svg
                      className='h-3 w-3'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                    >
                      <path d='M18 6L6 18M6 6l12 12' />
                    </svg>
                  </button>
                )}
                {/* Hover 时显示"从 Board 选择"按钮 - 处理中时隐藏 */}
                {!isProcessing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startAssetSelect(
                        MediaType.IMAGE,
                        'sourceImage',
                        (url: string, s3Path?: string) => {
                          setSourceImage(url, s3Path);
                        }
                      );
                    }}
                    className='absolute bottom-3 left-3 right-3 flex items-center justify-center gap-1.5 rounded bg-black/70 px-3 py-2 text-sm text-white/80 opacity-0 transition hover:bg-black/90 group-hover/img:opacity-100'
                  >
                    <ImagePlus className='h-4 w-4' />
                    Select from Board
                  </button>
                )}
              </div>
            ) : (
              // Import 按钮
              <div className='group relative w-full'>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className='flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed transition border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10 disabled:opacity-50'
                >
                  {isUploading ? (
                    <>
                      <div className='h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/60' />
                      <span className='text-sm text-white/40'>
                        Uploading...
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className='h-8 w-8 text-white/40' />
                      <span className='text-sm text-white/40'>Import</span>
                    </>
                  )}
                </button>
                {/* Hover 时显示"从 Board 选择"按钮 - 处理中时隐藏 */}
                {!isProcessing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startAssetSelect(
                        MediaType.IMAGE,
                        'sourceImage',
                        (url: string, s3Path?: string) => {
                          setSourceImage(url, s3Path);
                        }
                      );
                    }}
                    className='absolute bottom-3 left-3 right-3 flex items-center justify-center gap-1.5 rounded bg-black/70 px-3 py-2 text-sm text-white/80 opacity-0 transition hover:bg-black/90 group-hover:opacity-100'
                  >
                    <ImagePlus className='h-4 w-4' />
                    Select from Board
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 目标分辨率 */}
        <div
          className={cn(
            'flex items-center justify-between',
            isProcessing && 'pointer-events-none opacity-50'
          )}
          ref={selectContainerRef}
        >
          <label className='shrink-0 text-sm text-white/60'>
            Target Resolution
          </label>
          <div className='relative'>
            <button
              type='button'
              onClick={() => !isProcessing && setIsSelectOpen(!isSelectOpen)}
              disabled={isProcessing}
              className={cn(
                'flex w-20 items-center justify-between gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 transition hover:border-white/20',
                isProcessing && 'cursor-not-allowed'
              )}
            >
              <span className='text-sm text-white'>
                {TARGET_RESOLUTION_OPTIONS.find(
                  (o) => o.value === targetResolution
                )?.label ?? '2K'}
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 flex-shrink-0 text-white/40 transition-transform',
                  isSelectOpen && 'rotate-180'
                )}
              />
            </button>
            {isSelectOpen && !isProcessing && (
              <div className='absolute right-0 top-full z-[100] mt-1 w-20 rounded-lg border border-white/10 bg-[#252525] py-1 shadow-xl'>
                {TARGET_RESOLUTION_OPTIONS.map((option) => {
                  const isSelected = option.value === targetResolution;
                  return (
                    <button
                      key={option.value}
                      type='button'
                      onClick={() => {
                        setFormValues((prev) => ({
                          ...prev,
                          targetResolution: option.value
                        }));
                        setIsSelectOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center px-3 py-2 text-sm transition hover:bg-white/5',
                        isSelected ? 'bg-white/5 text-white' : 'text-white/70'
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <GenerateButtonContainer>
        <GenerateButtonBase
          onClick={handleGenerate}
          disabled={
            isSubmitting || isUploading || !sourceImage || !sourceImagePath
          }
        >
          {isSubmitting ? (
            <GenerateButtonLoading />
          ) : (
            <>
              <span>Generate</span>
              <CreditBadge cost={totalCost} />
            </>
          )}
        </GenerateButtonBase>
      </GenerateButtonContainer>
    </div>
  );
}
