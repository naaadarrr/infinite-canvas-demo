// Avatar Photo 上传组件 - 自定义样式版本

import { useRef, useState, useEffect, useCallback } from 'react';
import { Sparkles, Upload, Images } from 'lucide-react';
import { useSetRecoilState } from 'recoil-next';
import type { AssetSelectCallback } from '@/app/board/[id]/components/ToolPanel/components/types';
import type { GlobalDragData } from '@/app/board/[id]/types/drag';
import { cn } from '@/lib/utils';
import {
  currentToolTypeState,
  currentToolCategoryState
} from '@/app/board/[id]/components/ToolPanel/store';
import { ToolType } from '@/app/board/[id]/components/ToolPanel/types';
import { ToolCategory, MediaType } from '@/server/api/services/board/common';
import { useViewMode } from '@/app/board/[id]/components/ToolPanel/hooks/useViewMode';
import { ViewMode } from '@/app/board/[id]/components/BoardWorkspace/types/view';
import { toast } from '@/hooks/useToast';
import useAwsS3 from '@/hooks/useAwsS3';
import {
  generateS3UploadPath,
  getMimeType,
  validateAndProcessImage
} from '@/utils/file';
import {
  IMAGE_S3_PATH_PREFIX,
  DRAG_DATA_FORMAT_JSON,
  IMAGE_MIME_TYPE_PREFIX,
  AI_AVATAR_IMAGE_MAX_SIZE,
  AI_AVATAR_IMAGE_MAX_WIDTH,
  AI_AVATAR_IMAGE_MAX_HEIGHT,
  AI_AVATAR_IMAGE_MAX_RESIZE_QUALITY,
  AI_AVATAR_DEFAULT_PROCESS_IMAGE_FORMAT
} from '../config';
import { AssetInputSource } from '@/app/board/[id]/components/ToolPanel/components/avatar/types';

export interface AvatarPhotoUploadProps {
  /** 标签 */
  label?: string;
  /** 当前头像照片 URL */
  photoUrl?: string;
  /** 更新头像照片 */
  setPhoto: (photoData: {
    url: string;
    s3Path: string;
    inputSource: AssetInputSource;
  }) => void;
  /** 清空头像照片 */
  clearPhoto?: () => void;
  /** 资源选择回调 */
  onAssetSelect: AssetSelectCallback;
  /** 是否隐藏 "Create with AI" 按钮 */
  hideCreateWithAI?: boolean;
  /** 是否隐藏 "Select from Templates" 按钮 */
  hideSelectFromTemplates?: boolean;
  /** 是否隐藏标题 */
  hideLabel?: boolean;
  /** 外部控制的 loading 状态（如 re-edit 时） */
  isLoading?: boolean;
}

// 校验图片文件大小（移到组件外部，避免不必要的 useCallback）
function validateImageFileSize(imageFile: File): void {
  if (imageFile.size > AI_AVATAR_IMAGE_MAX_SIZE) {
    const maxSizeMB = AI_AVATAR_IMAGE_MAX_SIZE / 1024 / 1024;
    throw new Error(`Image size max ${maxSizeMB}MB`);
  }
}

// 统一错误处理函数
function handleUploadError(error: unknown): string {
  return (
    (error as Error)?.message ||
    'Failed to upload image. Please try again later.'
  );
}

// 检查并获取 Board 拖拽数据（类型安全）
function getBoardDragData(): GlobalDragData | null {
  const dragData = window.__dragData;
  if (dragData && dragData.type === MediaType.IMAGE && dragData.url) {
    return dragData;
  }
  return null;
}

export function AvatarPhotoUpload({
  label,
  photoUrl,
  setPhoto,
  clearPhoto,
  onAssetSelect,
  hideCreateWithAI = false,
  hideSelectFromTemplates = false,
  hideLabel = false,
  isLoading = false
}: AvatarPhotoUploadProps) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPhotoDragOver, setIsPhotoDragOver] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 合并上传 loading 和外部 loading 状态
  const showLoading = isUploading || isLoading;
  const setCurrentToolType = useSetRecoilState(currentToolTypeState);
  const setCurrentToolCategory = useSetRecoilState(currentToolCategoryState);
  const { getViewMode, switchToInspiration } = useViewMode();
  const { uploadFileToS3, getFileUrl } = useAwsS3();

  // 当图片变化时，重置宽高比
  useEffect(() => {
    if (!photoUrl) {
      setImageAspectRatio(null);
    }
  }, [photoUrl]);

  // 处理从模板选择
  const handleSelectFromTemplates = useCallback(() => {
    // 如果右侧已经是 templates 视图，显示 toast 提示
    if (getViewMode() === ViewMode.INSPIRATION) {
      toast({
        title: '👉 Select a template from the right panel',
        duration: 5000
      });
      return;
    }
    // 切换到 Inspiration 视图
    switchToInspiration();
  }, [getViewMode, switchToInspiration]);

  // 处理使用 AI 创建
  const handleCreateWithAI = useCallback(() => {
    setCurrentToolCategory(ToolCategory.AVATAR);
    setCurrentToolType(ToolType.DesignMyAvatar);
  }, [setCurrentToolCategory, setCurrentToolType]);

  // 处理文件上传
  const handleFileUpload = useCallback(
    async (imageFile: File) => {
      try {
        setIsUploading(true);

        // 校验文件大小
        validateImageFileSize(imageFile);

        // 图片校验 & 处理
        const processedImageFile = await validateAndProcessImage({
          file: imageFile,
          processingOptions: {
            maxWidth: AI_AVATAR_IMAGE_MAX_WIDTH,
            maxHeight: AI_AVATAR_IMAGE_MAX_HEIGHT,
            resizeQuality: AI_AVATAR_IMAGE_MAX_RESIZE_QUALITY,
            format: AI_AVATAR_DEFAULT_PROCESS_IMAGE_FORMAT as
              | 'jpeg'
              | 'png'
              | 'webp'
          }
        });

        // 生成 S3 上传路径
        const targetS3Path = generateS3UploadPath(
          processedImageFile,
          IMAGE_S3_PATH_PREFIX
        );

        // 获取 MIME 类型
        const mimeType = getMimeType(processedImageFile);
        if (!mimeType) {
          throw new Error(
            'Unsupported image format. Supported: JPG, PNG, WEBP'
          );
        }

        // 上传到 S3
        const photoS3Path = await uploadFileToS3({
          file: processedImageFile,
          s3Path: targetS3Path,
          mimeType
        });

        if (!photoS3Path) {
          throw new Error('Failed to upload image.');
        }

        // 获取可访问的预览 URL（S3 CDN URL，切换工具后仍有效）
        const cdnUrl = await getFileUrl(photoS3Path);

        // 更新状态
        setPhoto({
          url: cdnUrl,
          s3Path: photoS3Path,
          inputSource: AssetInputSource.LOCAL_UPLOAD
        });
      } catch (error) {
        const errorMessage = handleUploadError(error);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
          duration: 5000
        });
      } finally {
        setIsUploading(false);
      }
    },
    [setPhoto, uploadFileToS3, getFileUrl]
  );

  // 处理文件选择
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const imageFile = e.target.files?.[0];
      if (imageFile) {
        handleFileUpload(imageFile);
      }
      // Reset input to allow selecting same file again
      e.target.value = '';
    },
    [handleFileUpload]
  );

  // 处理删除按钮点击
  const handleRemovePhoto = useCallback(() => {
    if (clearPhoto) {
      clearPhoto();
    }
  }, [clearPhoto]);

  // 处理上传按钮点击
  const handleUploadClick = () => {
    photoInputRef.current?.click();
  };

  // 检查并处理 Board 拖拽数据
  const handleBoardDragDrop = useCallback((): boolean => {
    const dragData = getBoardDragData();
    if (dragData) {
      setPhoto({
        url: dragData.url,
        s3Path: dragData.s3Path,
        inputSource: AssetInputSource.BOARD_ASSET
      });
      // 清除拖拽数据
      delete window.__dragData;
      return true;
    }
    return false;
  }, [setPhoto]);

  // 处理从 Board 选择
  const handleSelectFromBoard = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onAssetSelect(
        MediaType.IMAGE,
        'avatarTemplateUrl',
        (imageUrl: string, imageS3Path: string) => {
          setPhoto({
            url: imageUrl,
            s3Path: imageS3Path,
            inputSource: AssetInputSource.BOARD_ASSET
          });
        }
      );
    },
    [onAssetSelect, setPhoto]
  );

  // 处理图片加载
  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      if (img.naturalWidth && img.naturalHeight) {
        setImageAspectRatio(img.naturalWidth / img.naturalHeight);
      }
    },
    []
  );

  // 处理拖拽悬停
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setIsPhotoDragOver(true);
  }, []);

  // 处理拖拽离开
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 只有当离开整个拖拽区域时才重置状态
    const containerRect = (
      e.currentTarget as HTMLElement
    ).getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;
    if (
      clientX < containerRect.left ||
      clientX > containerRect.right ||
      clientY < containerRect.top ||
      clientY > containerRect.bottom
    ) {
      setIsPhotoDragOver(false);
    }
  }, []);

  // 处理拖拽结束
  const handleDragEnd = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPhotoDragOver(false);
  }, []);

  // 处理拖拽放置
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsPhotoDragOver(false);

      // 首先检查 Board 拖拽数据
      if (handleBoardDragDrop()) {
        return;
      }

      // 检查 HTML5 拖放 API 数据
      const jsonData = e.dataTransfer.getData(DRAG_DATA_FORMAT_JSON);
      if (jsonData) {
        try {
          const dragData = JSON.parse(jsonData);
          if (dragData.type === MediaType.IMAGE && dragData.url) {
            setPhoto({
              url: dragData.url,
              s3Path: dragData.s3Path,
              inputSource: AssetInputSource.BOARD_ASSET
            });
            return;
          }
        } catch {
          // ignore
        }
      }
      // 从本地拖入文件
      const droppedImageFile = e.dataTransfer.files[0];
      if (
        droppedImageFile &&
        droppedImageFile.type.startsWith(IMAGE_MIME_TYPE_PREFIX)
      ) {
        handleFileUpload(droppedImageFile);
      }
    },
    [handleBoardDragDrop, handleFileUpload, setPhoto]
  );

  // 处理鼠标进入
  const handleMouseEnter = useCallback(() => {
    const dragData = getBoardDragData();
    if (dragData) {
      setIsPhotoDragOver(true);
    }
  }, []);

  // 处理鼠标离开
  const handleMouseLeave = useCallback(() => {
    const dragData = window.__dragData;
    if (dragData) {
      setIsPhotoDragOver(false);
    }
  }, []);

  // 统一的鼠标抬起处理函数（处理 Board 拖拽）
  const handleDocumentMouseUp = useCallback(
    (e: MouseEvent) => {
      const dragData = getBoardDragData();
      if (!dragData) return;

      // 检查鼠标是否在组件范围内
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      if (
        e.clientX >= containerRect.left &&
        e.clientX <= containerRect.right &&
        e.clientY >= containerRect.top &&
        e.clientY <= containerRect.bottom
      ) {
        setPhoto({
          url: dragData.url,
          s3Path: dragData.s3Path,
          inputSource: AssetInputSource.BOARD_ASSET
        });
        delete window.__dragData;
      }
    },
    [setPhoto]
  );

  // 监听 document mouseup 事件，处理 Board 拖拽
  useEffect(() => {
    document.addEventListener('mouseup', handleDocumentMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
  }, [handleDocumentMouseUp]);

  return (
    <div ref={containerRef}>
      {!hideLabel && label && (
        <div className='mb-2 flex items-center justify-between'>
          <label className='text-sm text-white/60'>{label}</label>
        </div>
      )}
      <input
        ref={photoInputRef}
        type='file'
        accept='image/*'
        onChange={handleFileSelect}
        className='hidden'
      />
      <div
        data-drop-zone={MediaType.IMAGE}
        className={cn(
          'rounded-lg border-2 border-dashed transition-all',
          isPhotoDragOver && !photoUrl
            ? 'border-indigo-500 bg-indigo-500/20'
            : 'border-transparent'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDragEnd={handleDragEnd}
        onDrop={handleDrop}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className='flex flex-wrap gap-2'>
          {showLoading ? (
            <div
              className={cn(
                'flex flex-1 min-w-[100px] flex-col items-center justify-center gap-2 rounded-lg border border-white/10 bg-black/20',
                hideSelectFromTemplates && hideCreateWithAI
                  ? 'h-24 w-24'
                  : 'aspect-[4/3]'
              )}
            >
              <div className='h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/60' />
              <span className='text-xs text-white/40'>
                {isLoading ? 'Loading...' : 'Uploading...'}
              </span>
            </div>
          ) : photoUrl ? (
            <div
              className={cn(
                'group relative overflow-hidden rounded-lg border border-white/10 bg-black/20',
                // 当两个按钮都隐藏时，使用固定小尺寸；否则使用自适应大尺寸
                hideSelectFromTemplates && hideCreateWithAI
                  ? 'h-24 w-24'
                  : 'flex-1 min-w-[100px]'
              )}
              style={{
                aspectRatio:
                  hideSelectFromTemplates && hideCreateWithAI
                    ? undefined
                    : imageAspectRatio
                      ? `${imageAspectRatio}`
                      : '4/3'
              }}
            >
              <img
                src={photoUrl}
                alt=''
                className='h-full w-full object-contain'
                onLoad={handleImageLoad}
              />
              <button
                onClick={handleRemovePhoto}
                className='absolute right-1 top-1 rounded bg-black/60 p-1 text-white/70 opacity-0 transition hover:bg-black/80 group-hover:opacity-100'
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
              {/* Hover 时显示"从 Board 选择"按钮 */}
              <button
                onClick={handleSelectFromBoard}
                className='absolute bottom-1 left-1 right-1 rounded bg-black/70 px-2 py-1 text-xs text-white/80 opacity-0 transition hover:bg-black/90 group-hover:opacity-100'
              >
                Select from Board
              </button>
            </div>
          ) : (
            <>
              <div
                onClick={handleUploadClick}
                className={cn(
                  'group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed transition',
                  // 当两个按钮都隐藏时，使用固定小尺寸；否则使用自适应大尺寸
                  hideSelectFromTemplates && hideCreateWithAI
                    ? 'h-24 w-24 gap-1'
                    : 'aspect-[4/3] flex-1 min-w-[100px]',
                  isPhotoDragOver
                    ? 'border-indigo-500 bg-indigo-500/20'
                    : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
                )}
              >
                <Upload
                  className={cn(
                    'text-white/40',
                    hideSelectFromTemplates && hideCreateWithAI
                      ? 'h-5 w-5'
                      : 'h-6 w-6'
                  )}
                />
                <span
                  className={cn(
                    'text-white/40',
                    hideSelectFromTemplates && hideCreateWithAI
                      ? 'text-[10px]'
                      : 'text-xs'
                  )}
                >
                  {isPhotoDragOver ? 'Release to drop' : 'Upload Photo'}
                </span>
                {/* Hover 时显示"从 Board 选择"按钮 */}
                <button
                  onClick={handleSelectFromBoard}
                  className='absolute bottom-1 left-1 right-1 rounded bg-black/70 px-2 py-1 text-xs text-white/80 opacity-0 transition hover:bg-black/90 group-hover:opacity-100'
                >
                  Select from Board
                </button>
              </div>
              {(!hideSelectFromTemplates || !hideCreateWithAI) && (
                <div
                  className={cn(
                    'flex flex-1 min-w-[100px] flex-col gap-1',
                    hideCreateWithAI || hideSelectFromTemplates
                      ? ''
                      : 'aspect-[4/3]'
                  )}
                >
                  {!hideSelectFromTemplates && (
                    <button
                      onClick={handleSelectFromTemplates}
                      className='flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/20 bg-white/5 transition hover:border-white/30 hover:bg-white/10'
                    >
                      <Images className='h-4 w-4 text-white/40' />
                      <span className='text-[10px] text-white/40'>
                        Select from Templates
                      </span>
                    </button>
                  )}
                  {!hideCreateWithAI && (
                    <button
                      onClick={handleCreateWithAI}
                      className='flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/20 bg-white/5 transition hover:border-white/30 hover:bg-white/10'
                    >
                      <Sparkles className='h-4 w-4 text-white/40' />
                      <span className='text-[10px] text-white/40'>
                        Create with AI
                      </span>
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
