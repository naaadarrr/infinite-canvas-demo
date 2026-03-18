// Product Image 上传组件 - 单张图片上传，复刻自 ImageEdit

import { useRef, useState } from 'react';
import { ImagePlus, Upload, Loader2, Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AssetSelectCallback } from '../../../../../components/types';
import { MediaType } from '@/server/api/services/board/common';

export interface ProductImageUploadProps {
  /** 标签 */
  label: string;
  /** 当前产品图片 URL */
  image: string | null;
  /** 更新产品图片；传 { url, s3Path }，s3Path 必填 */
  setImage: (value: { url: string; s3Path: string }) => void;
  /** 清空产品图片 */
  clearImage: () => void;
  /** 资源选择回调 */
  onAssetSelect: AssetSelectCallback;
  /** 是否正在处理（抠图中） */
  isProcessing?: boolean;
  /** 是否显示操作按钮（调整抠图） */
  showActions?: boolean;
  /** 调整抠图回调 */
  onAdjustCutout?: () => void;
  /** 处理文件上传（实际上传到 S3） */
  onFileUpload?: (file: File | File[]) => Promise<void>;
  /** Re-edit loading 状态 */
  isLoading?: boolean;
}

export function ProductImageUpload({
  label,
  image,
  setImage,
  clearImage,
  onAssetSelect,
  isProcessing = false,
  showActions = false,
  onAdjustCutout,
  onFileUpload,
  isLoading = false
}: ProductImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 处理文件实际上传
  const handleFileUpload = async (file: File | FileList) => {
    if (!onFileUpload) {
      console.warn('onFileUpload is required for file upload');
      return;
    }

    try {
      setIsUploading(true);
      const files = file instanceof FileList ? Array.from(file) : file;
      await onFileUpload(files);
    } catch (error) {
      console.error('File upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // 处理文件选择（用于 input[type="file"]）
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
    // Reset input to allow selecting same file again
    e.target.value = '';
  };

  // 处理拖拽放置
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    // 1. 优先检查 JSON 数据（从 Grid 拖拽）
    const jsonData = e.dataTransfer.getData('application/json');
    if (jsonData) {
      try {
        const data = JSON.parse(jsonData);
        if (data.type === MediaType.IMAGE && data.url && data.s3Path) {
          setImage({ url: data.url, s3Path: data.s3Path });
          return;
        }
      } catch {
        // 忽略 JSON 解析错误
      }
    }

    // 2. 检查 text/plain（从 Grid 拖拽的 URL）
    const textUrl = e.dataTransfer.getData('text/plain');
    if (textUrl && textUrl.startsWith('http')) {
      // 从 Board 拖拽的 URL，需要 s3Path，这里暂时使用 URL
      setImage({ url: textUrl, s3Path: '' });
      return;
    }

    // 3. 处理本地文件
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleFileUpload(files);
    }
  };

  function handleZoneDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }

  function handleZoneDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      setIsDragOver(false);
    }
  }

  function handleZoneDragEnd(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleZoneDrop(e: React.DragEvent) {
    handleDrop(e);
    setIsDragOver(false);
  }

  function handleZoneMouseEnter() {
    const dragData = window.__dragData;
    if (dragData && dragData.type === MediaType.IMAGE) {
      setIsDragOver(true);
    }
  }

  function handleZoneMouseLeave() {
    const dragData = window.__dragData;
    if (dragData) {
      setIsDragOver(false);
    }
  }

  function handleZoneMouseUp(e: React.MouseEvent) {
    const dragData = window.__dragData;
    if (dragData && dragData.url && dragData.type === MediaType.IMAGE) {
      e.stopPropagation();
      setImage({ url: dragData.url, s3Path: dragData.s3Path });
      setIsDragOver(false);
    }
  }

  function handleRemoveClick() {
    clearImage();
    setIsDragOver(false);
  }

  function handleSelectFromBoardClick(e: React.MouseEvent) {
    e.stopPropagation();
    onAssetSelect(
      MediaType.IMAGE,
      'productImage',
      (url: string, s3Path: string) => {
        setImage({ url, s3Path });
      }
    );
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  // 判断是否显示 loading（Re-edit loading 或上传中）
  const showLoadingState = isLoading && !image;

  return (
    <div>
      <div className='mb-2 flex items-center justify-between'>
        <label className='flex items-center gap-2 text-sm text-white/60'>
          {label}
        </label>
      </div>
      {/* 拖拽区域 */}
      <div
        data-drop-zone='image'
        onDragOver={handleZoneDragOver}
        onDragLeave={handleZoneDragLeave}
        onDragEnd={handleZoneDragEnd}
        onDrop={handleZoneDrop}
        onMouseEnter={handleZoneMouseEnter}
        onMouseLeave={handleZoneMouseLeave}
        onMouseUp={handleZoneMouseUp}
        className={cn(
          'rounded-lg border-2 border-dashed transition-all',
          isDragOver && !image
            ? 'border-white/50 bg-white/10'
            : 'border-transparent'
        )}
      >
        <div className='flex flex-wrap gap-2'>
          {/* Loading 状态（Re-edit） */}
          {showLoadingState ? (
            <div className='flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5'>
              <Loader2 className='h-5 w-5 animate-spin text-white/40' />
              <span className='text-[10px] text-white/40'>Loading...</span>
            </div>
          ) : image ? (
            // 已上传图片预览
            <div className='group/img relative h-24 w-24 overflow-hidden rounded-lg border border-white/10'>
              {/* Loading overlay when re-edit is in progress */}
              {isLoading && (
                <div className='absolute inset-0 z-10 flex items-center justify-center bg-black/40'>
                  <Loader2 className='h-5 w-5 animate-spin text-white' />
                </div>
              )}
              <img
                src={image}
                alt=''
                className='h-full w-full object-cover'
              />
              {/* 上传/抠图 Loading 遮罩 */}
              {(isUploading || isProcessing) && (
                <div className='absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm'>
                  <Loader2 className='mb-1 h-5 w-5 animate-spin text-white' />
                  <span className='text-[10px] text-white/80'>
                    {isUploading ? 'Uploading...' : 'Removing BG...'}
                  </span>
                </div>
              )}
              {/* 删除按钮 - 处理中时隐藏 */}
              {!isProcessing && !isUploading && !isLoading && (
                <button
                  onClick={handleRemoveClick}
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
              {!isProcessing && !isUploading && !isLoading && (
                <button
                  onClick={handleSelectFromBoardClick}
                  className='absolute bottom-1 left-1 right-1 rounded bg-black/70 px-2 py-1 text-xs text-white/80 opacity-0 transition hover:bg-black/90 group-hover/img:opacity-100'
                >
                  <ImagePlus className='mr-1 inline h-3 w-3' />
                  Select from Board
                </button>
              )}
            </div>
          ) : (
            // Import 按钮
            <>
              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                onChange={handleFileSelect}
                className='hidden'
                disabled={isUploading || isProcessing}
              />
              <div className='group relative'>
                <button
                  onClick={handleImportClick}
                  className='flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed transition border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
                >
                  <Upload className='h-5 w-5 text-white/40' />
                  <span className='text-[10px] text-white/40'>Import</span>
                </button>
                {/* Hover 时显示"从 Board 选择"按钮 */}
                <button
                  onClick={handleSelectFromBoardClick}
                  className='absolute bottom-1 left-1 right-1 rounded bg-black/70 px-2 py-1 text-xs text-white/80 opacity-0 transition hover:bg-black/90 group-hover:opacity-100'
                >
                  <ImagePlus className='mr-1 inline h-3 w-3' />
                  Select from Board
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 操作按钮 - 调整抠图 */}
      {showActions && image && !isProcessing && !isUploading && !isLoading && (
        <div className='mt-2'>
          <button
            onClick={onAdjustCutout}
            className='flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10 hover:text-white'
          >
            <Scissors className='h-3.5 w-3.5' />
            Adjust Cutout
          </button>
        </div>
      )}
    </div>
  );
}
