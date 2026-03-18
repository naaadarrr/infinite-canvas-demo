import { useRef, useState, useEffect, useCallback } from 'react';
import { ImagePlus, Upload } from 'lucide-react';
import type { AssetSelectCallback } from '@/app/board/[id]/components/ToolPanel/components/types';
import { MediaType } from '@/server/api/services/board/common';
import { cn } from '@/lib/utils';
import { useFileStorage } from '@/hooks/useFileStorage';

export interface VideoFrameUploadConfig {
  /** 首帧图片 URL */
  firstFrame: string | null;
  /** 更新首帧图片 */
  setFirstFrame: (url: string | null) => void;
  /** 尾帧图片 URL */
  endFrame: string | null;
  /** 更新尾帧图片 */
  setEndFrame: (url: string | null) => void;
  /** 是否添加尾帧 */
  addEndFrame: boolean;
  /** 设置是否添加尾帧 */
  setAddEndFrame: (value: boolean) => void;
  /** 资源选择回调 */
  onAssetSelect: AssetSelectCallback;
}

export interface VideoFrameUploadAdvancedConfig {
  /** 是否显示尾帧选项 */
  hasEndFrame?: boolean;
  /** 首帧输入 ref */
  firstFrameInputRef?: React.RefObject<HTMLInputElement>;
  /** 尾帧输入 ref */
  endFrameInputRef?: React.RefObject<HTMLInputElement>;
  /** 首帧是否拖拽悬停 */
  firstFrameDragOver?: boolean;
  /** 设置首帧拖拽悬停状态 */
  setFirstFrameDragOver?: (value: boolean) => void;
  /** 尾帧是否拖拽悬停 */
  endFrameDragOver?: boolean;
  /** 设置尾帧拖拽悬停状态 */
  setEndFrameDragOver?: (value: boolean) => void;
}

export interface VideoFrameUploadParameterProps {
  /** 标签 */
  label: string;
  /** 上传配置 */
  uploadConfig: VideoFrameUploadConfig;
  /** 高级配置（可选） */
  advanced?: VideoFrameUploadAdvancedConfig;
}

export function VideoFrameUploadParameter({
  label,
  uploadConfig,
  advanced
}: VideoFrameUploadParameterProps) {
  const {
    firstFrame: firstFrameImage,
    setFirstFrame: setFirstFrameImage,
    endFrame: endFrameImage,
    setEndFrame: setEndFrameImage,
    addEndFrame: _addEndFrame,
    setAddEndFrame: _setAddEndFrame,
    onAssetSelect: startAssetSelect
  } = uploadConfig;
  // 保留接口兼容性，但不再使用这些变量
  void _addEndFrame;
  void _setAddEndFrame;
  const {
    hasEndFrame,
    firstFrameInputRef: externalFirstFrameInputRef,
    endFrameInputRef: externalEndFrameInputRef,
    firstFrameDragOver: externalFirstFrameDragOver,
    setFirstFrameDragOver: externalSetFirstFrameDragOver,
    endFrameDragOver: externalEndFrameDragOver,
    setEndFrameDragOver: externalSetEndFrameDragOver
  } = advanced || {};

  const internalFirstFrameInputRef = useRef<HTMLInputElement>(null);
  const internalEndFrameInputRef = useRef<HTMLInputElement>(null);
  const firstFrameInputRef =
    externalFirstFrameInputRef || internalFirstFrameInputRef;
  const endFrameInputRef = externalEndFrameInputRef || internalEndFrameInputRef;
  const [internalFirstFrameDragOver, setInternalFirstFrameDragOver] =
    useState(false);
  const [internalEndFrameDragOver, setInternalEndFrameDragOver] =
    useState(false);
  const firstFrameDragOver =
    externalFirstFrameDragOver ?? internalFirstFrameDragOver;
  const endFrameDragOver = externalEndFrameDragOver ?? internalEndFrameDragOver;
  const setFirstFrameDragOver =
    externalSetFirstFrameDragOver ?? setInternalFirstFrameDragOver;
  const setEndFrameDragOver =
    externalSetEndFrameDragOver ?? setInternalEndFrameDragOver;

  // Refs for drop zones
  const firstFrameDropRef = useRef<HTMLDivElement>(null);
  const endFrameDropRef = useRef<HTMLDivElement>(null);

  const { saveFile, releaseFile } = useFileStorage();

  // 检查鼠标是否在元素内
  const isMouseInElement = useCallback(
    (element: HTMLElement | null, mouseX: number, mouseY: number) => {
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      return (
        mouseX >= rect.left &&
        mouseX <= rect.right &&
        mouseY >= rect.top &&
        mouseY <= rect.bottom
      );
    },
    []
  );

  // 监听全局 mouseup 事件，处理从 Board 拖拽的图片
  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      const dragData = window.__dragData;

      if (dragData && dragData.type === MediaType.IMAGE && dragData.url) {
        // 检查鼠标是否在 First Frame 区域内
        if (
          !firstFrameImage &&
          isMouseInElement(firstFrameDropRef.current, e.clientX, e.clientY)
        ) {
          setFirstFrameImage(dragData.url);
          setFirstFrameDragOver(false);
          return;
        }

        // 检查鼠标是否在 End Frame 区域内
        if (
          hasEndFrame &&
          !endFrameImage &&
          isMouseInElement(endFrameDropRef.current, e.clientX, e.clientY)
        ) {
          setEndFrameImage(dragData.url);
          setEndFrameDragOver(false);
          return;
        }
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [
    firstFrameImage,
    endFrameImage,
    hasEndFrame,
    setFirstFrameImage,
    setEndFrameImage,
    setFirstFrameDragOver,
    setEndFrameDragOver,
    isMouseInElement
  ]);

  return (
    <div>
      <div className='mb-2 flex items-center justify-between'>
        <label className='text-sm text-white/60'>{label}</label>
      </div>
      <div className='flex gap-2'>
        {/* First Frame */}
        <div className='w-1/2'>
          <input
            ref={firstFrameInputRef}
            type='file'
            accept='image/*'
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                const [url, err] = await saveFile(file);
                if (!err && url) {
                  setFirstFrameImage(url);
                }
              }
            }}
            className='hidden'
          />
          {firstFrameImage ? (
            <div className='group relative aspect-[4/3] overflow-hidden rounded-lg border border-white/10'>
              <img
                src={firstFrameImage}
                alt=''
                className='h-full w-full object-cover'
              />
              <button
                onClick={() => {
                  if (firstFrameImage?.startsWith('blob:')) {
                    releaseFile(firstFrameImage);
                  }
                  setFirstFrameImage(null);
                }}
                className='absolute right-1 top-1 rounded bg-black/60 p-0.5 text-white/70 opacity-0 transition hover:bg-black/80 group-hover:opacity-100'
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
                onClick={(e) => {
                  e.stopPropagation();
                  startAssetSelect(
                    MediaType.IMAGE,
                    'firstFrame',
                    (url, _s3Path) => setFirstFrameImage(url)
                  );
                }}
                className='absolute bottom-1 left-1 right-1 rounded bg-black/70 px-2 py-1 text-xs text-white/80 opacity-0 transition hover:bg-black/90 group-hover:opacity-100'
              >
                <ImagePlus className='mr-1 inline h-3 w-3' />
                Select from Board
              </button>
            </div>
          ) : (
            <div
              ref={firstFrameDropRef}
              className='group relative'
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer) {
                  e.dataTransfer.dropEffect = 'copy';
                }
                setFirstFrameDragOver(true);
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setFirstFrameDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // 只有当离开整个容器时才重置状态
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX;
                const y = e.clientY;
                if (
                  x < rect.left ||
                  x > rect.right ||
                  y < rect.top ||
                  y > rect.bottom
                ) {
                  setFirstFrameDragOver(false);
                }
              }}
              onDrop={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                setFirstFrameDragOver(false);
                // 先检查是否有文件
                const file = e.dataTransfer?.files[0];
                if (file && file.type.startsWith('image/')) {
                  const [url, err] = await saveFile(file);
                  if (!err && url) {
                    setFirstFrameImage(url);
                  }
                  return;
                }
                // 再检查 JSON 数据
                const jsonData = e.dataTransfer?.getData('application/json');
                if (jsonData) {
                  try {
                    const data = JSON.parse(jsonData);
                    if (data.type === MediaType.IMAGE && data.url) {
                      setFirstFrameImage(data.url);
                      return;
                    }
                  } catch {}
                }
              }}
            >
              <div
                onClick={() => firstFrameInputRef.current?.click()}
                className={cn(
                  'flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed transition',
                  firstFrameDragOver
                    ? 'border-indigo-500 bg-indigo-500/20'
                    : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
                )}
              >
                <Upload className='h-5 w-5 text-white/40' />
                <span className='text-[10px] text-white/40'>
                  {firstFrameDragOver ? 'Release to drop' : 'First Frame'}
                </span>
              </div>
              {/* Hover 时显示"从 Board 选择"按钮 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startAssetSelect(
                    MediaType.IMAGE,
                    'firstFrame',
                    (url, _s3Path) => setFirstFrameImage(url)
                  );
                }}
                className='absolute bottom-1 left-1 right-1 rounded bg-black/70 px-2 py-1 text-xs text-white/80 opacity-0 transition hover:bg-black/90 group-hover:opacity-100'
              >
                <ImagePlus className='mr-1 inline h-3 w-3' />
                Select from Board
              </button>
            </div>
          )}
        </div>
        {/* End Frame */}
        {hasEndFrame && (
          <div className='w-1/2'>
            <input
              ref={endFrameInputRef}
              type='file'
              accept='image/*'
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const [url, err] = await saveFile(file);
                  if (!err && url) {
                    setEndFrameImage(url);
                  }
                }
              }}
              className='hidden'
            />
            {endFrameImage ? (
              <div className='group relative aspect-[4/3] overflow-hidden rounded-lg border border-white/10'>
                <img
                  src={endFrameImage}
                  alt=''
                  className='h-full w-full object-cover'
                />
                <button
                  onClick={() => {
                    if (endFrameImage?.startsWith('blob:')) {
                      releaseFile(endFrameImage);
                    }
                    setEndFrameImage(null);
                  }}
                  className='absolute right-1 top-1 rounded bg-black/60 p-0.5 text-white/70 opacity-0 transition hover:bg-black/80 group-hover:opacity-100'
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
                  onClick={(e) => {
                    e.stopPropagation();
                    startAssetSelect(
                      MediaType.IMAGE,
                      'endFrame',
                      (url, _s3Path) => setEndFrameImage(url)
                    );
                  }}
                  className='absolute bottom-1 left-1 right-1 rounded bg-black/70 px-2 py-1 text-xs text-white/80 opacity-0 transition hover:bg-black/90 group-hover:opacity-100'
                >
                  <ImagePlus className='mr-1 inline h-3 w-3' />
                  Select from Board
                </button>
              </div>
            ) : (
              <div
                ref={endFrameDropRef}
                className='group relative'
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer) {
                    e.dataTransfer.dropEffect = 'copy';
                  }
                  setEndFrameDragOver(true);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEndFrameDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // 只有当离开整个容器时才重置状态
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX;
                  const y = e.clientY;
                  if (
                    x < rect.left ||
                    x > rect.right ||
                    y < rect.top ||
                    y > rect.bottom
                  ) {
                    setEndFrameDragOver(false);
                  }
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEndFrameDragOver(false);
                  // 先检查是否有文件
                  const file = e.dataTransfer?.files[0];
                  if (file && file.type.startsWith('image/')) {
                    const [url, err] = await saveFile(file);
                    if (!err && url) {
                      setEndFrameImage(url);
                    }
                    return;
                  }
                  // 再检查 JSON 数据
                  const jsonData = e.dataTransfer?.getData('application/json');
                  if (jsonData) {
                    try {
                      const data = JSON.parse(jsonData);
                      if (data.type === MediaType.IMAGE && data.url) {
                        setEndFrameImage(data.url);
                        return;
                      }
                    } catch {}
                  }
                }}
              >
                <div
                  onClick={() => endFrameInputRef.current?.click()}
                  className={cn(
                    'flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed transition',
                    endFrameDragOver
                      ? 'border-indigo-500 bg-indigo-500/20'
                      : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
                  )}
                >
                  <Upload className='h-5 w-5 text-white/40' />
                  <span className='text-[10px] text-white/40'>
                    {endFrameDragOver ? 'Release to drop' : 'End Frame'}
                  </span>
                </div>
                {/* Hover 时显示"从 Board 选择"按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startAssetSelect(
                      MediaType.IMAGE,
                      'endFrame',
                      (url, _s3Path) => setEndFrameImage(url)
                    );
                  }}
                  className='absolute bottom-1 left-1 right-1 rounded bg-black/70 px-2 py-1 text-xs text-white/80 opacity-0 transition hover:bg-black/90 group-hover:opacity-100'
                >
                  <ImagePlus className='mr-1 inline h-3 w-3' />
                  Select from Board
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
