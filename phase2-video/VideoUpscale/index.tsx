'use client';

/**
 * Video Upscale 视频放大工具
 * 将低分辨率视频放大到更高分辨率
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRecoilState } from 'recoil-next';
import {
  Upload,
  Film,
  ChevronDown,
  FileVideo,
  X,
  Info,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';
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
import { videoUpscaleFormFamily } from './store/atoms';
import { useVideoUpscaleTaskGeneration } from './hooks/useVideoUpscaleTaskGeneration';
import { toast } from '@/hooks/useToast';
import { generateS3UploadPath, getMimeType } from '@/utils/file';
import {
  TARGET_RESOLUTION_OPTIONS,
  VIDEO_UPSCALE_S3_PATH_PREFIX,
  VIDEO_UPSCALE_VIDEO_MAX_SIZE,
  VIDEO_UPSCALE_VIDEO_MAX_DURATION,
  getCreditPerMinuteByResolution
} from './config';
import {
  trackCreditConsumptionGenTask,
  CreditConsumingGenTaskType
} from '@/utils/creditGa';

/** 上传状态接口 */
interface UploadState {
  fileName: string;
  fileSize: number;
  progress: number;
  blobUrl: string;
}

/** 格式化文件大小 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function VideoUpscale() {
  const tabId = useActiveTabId();
  const { startAssetSelect } = useAssetSelect();
  const [formValues, setFormValues] = useRecoilState(
    videoUpscaleFormFamily(tabId)
  );

  // 使用 S3 上传 Hook
  const { uploadFileToS3, getCdnUrls } = useAwsS3();

  // 任务生成
  const { isSubmitting, generateTask } = useVideoUpscaleTaskGeneration();

  // 上传中状态（提交时上传到 S3）
  const [isUploading, setIsUploading] = useState(false);

  const [videoDragOver, setVideoDragOver] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [durationWarning, setDurationWarning] = useState<string | null>(null);
  // 上传状态（本地文件处理进度）
  const [uploadState, setUploadState] = useState<UploadState | null>(null);
  const uploadCancelledRef = useRef(false);
  // 视频元数据状态
  const [videoMeta, setVideoMeta] = useState<{
    width: number;
    height: number;
    duration: number;
    frameCount: number;
  } | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const selectContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 使用 ref 保存本地文件（File 对象不能存储在 Recoil state 中）
  const sourceVideoFileRef = useRef<File | null>(null);

  const { sourceVideo, sourceVideoPath, targetResolution } = formValues;

  // Re-edit URL 加载状态（通过检测 sourceVideoPath 存在但 sourceVideo 为 null 来判断）
  const isLoadingUrl = !sourceVideo && !!sourceVideoPath;

  // 是否正在处理中（提交任务或上传文件时禁用表单）
  const isProcessing = isSubmitting || isUploading || isLoadingUrl;

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

  // 更新表单值
  const updateFormValues = useCallback(
    (updates: Partial<typeof formValues>) => {
      setFormValues((prev) => ({ ...prev, ...updates }));
    },
    [setFormValues]
  );

  // 设置源视频（从 Board 选择或已有 CDN URL）
  const setSourceVideo = useCallback(
    (video: string | null, s3Path?: string | null) => {
      // 清除本地文件引用
      sourceVideoFileRef.current = null;
      setFormValues((prev) => ({
        ...prev,
        sourceVideo: video,
        sourceVideoPath: s3Path ?? null
      }));
      // 清空视频时重置元数据
      if (!video) {
        setVideoMeta(null);
      }
    },
    [setFormValues]
  );

  // 显示时长超限警告
  const showDurationWarning = useCallback(() => {
    const maxMinutes = VIDEO_UPSCALE_VIDEO_MAX_DURATION / 60;
    setDurationWarning(`Uploaded videos cannot exceed ${maxMinutes} minutes.`);
    setTimeout(() => {
      setDurationWarning(null);
    }, 2000);
  }, []);

  // 读取视频元数据，并在此时校验时长
  const handleVideoLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      const width = video.videoWidth;
      const height = video.videoHeight;
      const duration = video.duration;

      // 上传/拖拽时校验视频时长
      if (duration > VIDEO_UPSCALE_VIDEO_MAX_DURATION) {
        showDurationWarning();
        // 清除已选择的视频
        sourceVideoFileRef.current = null;
        setFormValues((prev) => ({
          ...prev,
          sourceVideo: null,
          sourceVideoPath: null
        }));
        setVideoMeta(null);
        return;
      }

      // 假设默认帧率为 30fps 来估算帧数
      const frameCount = Math.round(duration * 30);
      setVideoMeta({ width, height, duration, frameCount });
    }
  }, [showDurationWarning, setFormValues]);

  /** 处理文件选择（仅预览，不上传到 S3） */
  const handleFileSelect = useCallback(
    (file: File) => {
      if (!file || !file.type.startsWith('video/')) return;

      // 检查文件大小
      if (file.size > VIDEO_UPSCALE_VIDEO_MAX_SIZE) {
        toast({
          title: 'File too large',
          description: `Maximum file size is ${VIDEO_UPSCALE_VIDEO_MAX_SIZE / (1024 * 1024)}MB`,
          variant: 'destructive'
        });
        return;
      }

      const blobUrl = URL.createObjectURL(file);

      // 立即保存文件引用到 ref（避免闭包问题）
      sourceVideoFileRef.current = file;

      // 初始化上传状态（模拟处理进度）
      uploadCancelledRef.current = false;
      setUploadState({
        fileName: file.name,
        fileSize: file.size,
        progress: 0,
        blobUrl
      });

      // 模拟处理进度（根据文件大小动态调整时长）
      const totalDuration = Math.min(
        Math.max((file.size / (1024 * 1024)) * 300, 300),
        1500
      );
      const startTime = Date.now();

      const updateProgress = () => {
        if (uploadCancelledRef.current) {
          URL.revokeObjectURL(blobUrl);
          sourceVideoFileRef.current = null; // 取消时清除
          return;
        }

        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / totalDuration, 1);

        if (progress < 1) {
          setUploadState((prev) => (prev ? { ...prev, progress } : null));
          requestAnimationFrame(updateProgress);
        } else {
          // 处理完成，更新状态（文件已在上面保存到 ref）
          setUploadState(null);
          setFormValues((prev) => ({
            ...prev,
            sourceVideo: blobUrl,
            sourceVideoPath: null
          }));
        }
      };

      requestAnimationFrame(updateProgress);
    },
    [setFormValues]
  );

  /** 取消上传 */
  const cancelUpload = useCallback(() => {
    uploadCancelledRef.current = true;
    if (uploadState?.blobUrl) {
      URL.revokeObjectURL(uploadState.blobUrl);
    }
    setUploadState(null);
  }, [uploadState?.blobUrl]);

  /** 处理拖拽放置 */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setVideoDragOver(false);

      if (isProcessing) return;

      // 从 Board 拖拽的视频
      const jsonData = e.dataTransfer.getData('application/json');
      if (jsonData) {
        try {
          const data = JSON.parse(jsonData);
          if (data.type === MediaType.VIDEO && data.url) {
            setSourceVideo(data.url, data.s3Path);
            return;
          }
        } catch {
          // 忽略解析错误
        }
      }

      // 本地文件
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [isProcessing, setSourceVideo, handleFileSelect]
  );

  // 处理生成
  const handleGenerate = async () => {
    if (!sourceVideo) {
      toast({
        title: 'Missing video',
        description: 'Please upload a video to upscale.',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);

    try {
      let finalVideoS3Path = sourceVideoPath;

      // 如果有本地视频文件，先上传到 S3
      if (sourceVideoFileRef.current && !sourceVideoPath) {
        const uploadS3Path = generateS3UploadPath(
          sourceVideoFileRef.current,
          VIDEO_UPSCALE_S3_PATH_PREFIX
        );
        const mimeType = getMimeType(sourceVideoFileRef.current);
        if (!mimeType) {
          throw new Error('Unsupported video format.');
        }

        const uploadedS3Path = await uploadFileToS3({
          file: sourceVideoFileRef.current,
          s3Path: uploadS3Path,
          mimeType: mimeType as MimeType
        });

        if (!uploadedS3Path) {
          throw new Error('Failed to upload video.');
        }
        finalVideoS3Path = uploadedS3Path;

        // 更新 sourceVideoPath
        updateFormValues({ sourceVideoPath: finalVideoS3Path });
      }

      // 验证最终路径
      if (!finalVideoS3Path) {
        throw new Error('Please upload a video first.');
      }

      const videoDuration = videoMeta?.duration || 0;

      // GA 埋点：积分消耗（按分钟计算，时长向上取整到分钟）
      const creditConsumed =
        Math.ceil(videoDuration / 60) *
        getCreditPerMinuteByResolution(targetResolution);
      trackCreditConsumptionGenTask({
        type: CreditConsumingGenTaskType.VIDEO_UPSCALE,
        creditConsumed
      });

      // 使用更新后的 formValues
      await generateTask(
        {
          ...formValues,
          sourceVideoPath: finalVideoS3Path
        },
        videoDuration
      );
    } catch (error) {
      const errorMessage =
        (error as Error)?.message || 'Failed to submit task. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      console.error('[VideoUpscale] Failed to generate:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // 计算积分成本（按分钟计算，时长向上取整到分钟）
  const calculateCreditCost = () => {
    if (!videoMeta) {
      // 未上传视频时显示默认值
      return 0;
    }
    const { duration } = videoMeta;
    const creditPerMinute = getCreditPerMinuteByResolution(targetResolution);
    // 时长向上取整到分钟（如 3.65 秒按 1 分钟计费）
    const minutes = Math.ceil(duration / 60);
    return minutes * creditPerMinute;
  };
  const totalCost = formatCredits(calculateCreditCost());

  // 清除视频
  const handleClearVideo = useCallback(() => {
    sourceVideoFileRef.current = null;
    updateFormValues({ sourceVideo: null, sourceVideoPath: null });
    setVideoMeta(null);
  }, [updateFormValues]);

  return (
    <div className='flex h-full w-full flex-col'>
      {/* 全局时长超限 Toast 提示 */}
      {durationWarning && (
        <div className='fixed left-1/2 top-6 z-[9999] -translate-x-1/2 animate-in fade-in slide-in-from-top-2 duration-200'>
          <div className='flex items-center gap-2 rounded-lg bg-[#2d2d2d] px-4 py-2.5 shadow-2xl'>
            <AlertCircle className='h-4 w-4 flex-shrink-0 text-red-400' />
            <span className='text-sm text-white/90'>{durationWarning}</span>
          </div>
        </div>
      )}

      {/* 表单内容 */}
      <div className='flex-1 space-y-4 p-4'>
        {/* 视频上传区 */}
        <div>
          <label className='mb-2 block text-sm text-white/60'>
            Upload Video
          </label>
          <input
            ref={videoInputRef}
            type='file'
            accept='video/*'
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileSelect(file);
              }
              // 清空 value，允许重复选择同一文件
              e.target.value = '';
            }}
            className='hidden'
          />
          <div
            data-drop-zone='video'
            onDragOver={(e) => {
              if (isProcessing) return;
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = 'copy';
              setVideoDragOver(true);
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
                setVideoDragOver(false);
              }
            }}
            onDragEnd={(e) => {
              if (isProcessing) return;
              e.preventDefault();
              e.stopPropagation();
              setVideoDragOver(false);
            }}
            onDrop={handleDrop}
            onMouseEnter={() => {
              if (isProcessing) return;
              const dragData = window.__dragData;
              if (dragData && dragData.type === MediaType.VIDEO) {
                setVideoDragOver(true);
              }
            }}
            onMouseLeave={() => {
              setVideoDragOver(false);
            }}
            onMouseUp={(e) => {
              if (isProcessing) return;
              const windowWithDragData = window;
              const dragData = windowWithDragData.__dragData;
              if (
                dragData &&
                dragData.url &&
                dragData.type === MediaType.VIDEO
              ) {
                e.stopPropagation();
                setSourceVideo(dragData.url, dragData.s3Path);
                delete windowWithDragData.__dragData;
              }
              setVideoDragOver(false);
            }}
            className={cn(
              'rounded-lg border-2 border-dashed transition-all',
              isProcessing && 'pointer-events-none opacity-50',
              videoDragOver
                ? 'border-white/50 bg-white/10'
                : 'border-transparent'
            )}
          >
            {/* Re-edit URL 加载中状态 */}
            {!sourceVideo && sourceVideoPath ? (
              <div className='flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-white/5'>
                <div className='h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/60' />
                <span className='text-sm text-white/50'>Loading video...</span>
              </div>
            ) : /* 上传中状态 */
            uploadState ? (
              <div className='flex aspect-[4/3] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-white/20 bg-white/5 p-4'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20'>
                    <FileVideo className='h-5 w-5 text-indigo-400' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p
                      className='max-w-[180px] truncate text-sm text-white/80'
                      title={uploadState.fileName}
                    >
                      {uploadState.fileName}
                    </p>
                    <p className='text-xs text-white/40'>
                      {formatFileSize(uploadState.fileSize)}
                    </p>
                  </div>
                  <button
                    onClick={cancelUpload}
                    className='rounded p-1 text-white/40 transition hover:bg-white/10 hover:text-white/70'
                    title='Cancel upload'
                  >
                    <X className='h-4 w-4' />
                  </button>
                </div>

                <div className='w-full max-w-[200px]'>
                  <div className='h-1.5 w-full overflow-hidden rounded-full bg-white/10'>
                    <div
                      className='h-full rounded-full bg-indigo-500'
                      style={{ width: `${uploadState.progress * 100}%` }}
                    />
                  </div>
                  <p className='mt-1.5 text-center text-xs text-white/50'>
                    {uploadState.progress < 1
                      ? `Processing... ${Math.round(uploadState.progress * 100)}%`
                      : 'Processing...'}
                  </p>
                </div>
              </div>
            ) : sourceVideo ? (
              <div className='group relative aspect-[4/3] overflow-hidden rounded-lg bg-[#1e1e1e]'>
                <video
                  ref={videoRef}
                  src={sourceVideo}
                  className='h-full w-full object-contain'
                  onLoadedMetadata={handleVideoLoadedMetadata}
                />
                {/* 删除按钮 - 处理中时隐藏 */}
                {!isProcessing && (
                  <button
                    onClick={handleClearVideo}
                    className='absolute right-2 top-2 rounded bg-black/60 p-1.5 text-white/70 opacity-0 transition hover:bg-black/80 group-hover:opacity-100'
                  >
                    <svg
                      className='h-4 w-4'
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
                        MediaType.VIDEO,
                        'sourceVideo',
                        (url, s3Path) => setSourceVideo(url, s3Path)
                      );
                    }}
                    className='absolute bottom-3 left-3 right-3 flex items-center justify-center gap-1.5 rounded bg-black/70 px-3 py-2 text-sm text-white/80 opacity-0 transition hover:bg-black/90 group-hover:opacity-100'
                  >
                    <Film className='h-4 w-4' />
                    Select from Board
                  </button>
                )}
              </div>
            ) : (
              <div className='group relative'>
                <div
                  onClick={() => {
                    if (!isProcessing) {
                      videoInputRef.current?.click();
                    }
                  }}
                  className={cn(
                    'flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed transition',
                    isProcessing
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer',
                    videoDragOver
                      ? 'border-white/50 bg-white/10'
                      : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
                  )}
                >
                  <Upload className='h-8 w-8 text-white/40' />
                  <span className='text-sm text-white/40'>
                    {videoDragOver ? 'Release to drop video' : 'Upload a video'}
                  </span>
                  <span className='text-xs text-white/30'>
                    Format: mp4, mov, webm, m4v
                  </span>
                </div>
                {/* Hover 时显示"从 Board 选择"按钮 - 处理中时隐藏 */}
                {!isProcessing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startAssetSelect(
                        MediaType.VIDEO,
                        'sourceVideo',
                        (url, s3Path) => setSourceVideo(url, s3Path)
                      );
                    }}
                    className='absolute bottom-3 left-3 right-3 flex items-center justify-center gap-1.5 rounded bg-black/70 px-3 py-2 text-sm text-white/80 opacity-0 transition hover:bg-black/90 group-hover:opacity-100'
                  >
                    <Film className='h-4 w-4' />
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
          <label className='shrink-0 whitespace-nowrap text-sm text-white/60'>
            Target Resolution
          </label>
          <div className='relative'>
            <button
              type='button'
              onClick={() => !isProcessing && setIsSelectOpen(!isSelectOpen)}
              disabled={isProcessing}
              className={cn(
                'flex w-28 items-center justify-between gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 transition hover:border-white/20',
                isProcessing && 'cursor-not-allowed'
              )}
            >
              <span className='text-sm text-white'>
                {TARGET_RESOLUTION_OPTIONS.find(
                  (o) => o.value === targetResolution
                )?.label || '1080p'}
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 flex-shrink-0 text-white/40 transition-transform',
                  isSelectOpen && 'rotate-180'
                )}
              />
            </button>
            {isSelectOpen && !isProcessing && (
              <div className='absolute right-0 top-full z-[100] mt-1 w-28 rounded-lg border border-white/10 bg-[#252525] py-1 shadow-xl'>
                {TARGET_RESOLUTION_OPTIONS.map((option) => {
                  const isSelected = option.value === targetResolution;
                  return (
                    <button
                      key={option.value}
                      type='button'
                      onClick={() => {
                        updateFormValues({ targetResolution: option.value });
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
          disabled={isSubmitting || isUploading || !sourceVideo}
        >
          {isSubmitting || isUploading ? (
            <GenerateButtonLoading />
          ) : (
            <>
              <span>Upscale Video</span>
              <CreditBadge
                cost={totalCost}
                suffix={
                  <Tooltip
                    content='Credits are calculated based on video duration, resolution and frame rate'
                    position='top'
                  >
                    <Info className='h-3.5 w-3.5 cursor-help text-white/50 hover:text-white/70' />
                  </Tooltip>
                }
              />
            </>
          )}
        </GenerateButtonBase>
      </GenerateButtonContainer>
    </div>
  );
}
