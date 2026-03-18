// Upload Avatar Photo - 上传 Avatar 照片组件

import { useState, useRef, useCallback } from 'react';
import { Users, Upload } from 'lucide-react';
import { useRecoilState } from 'recoil-next';
import { cn } from '@/lib/utils';
import { useAssetSelect } from '@/app/board/[id]/components/ToolPanel/hooks/useAssetSelect';
import { useActiveTabId } from '@/app/board/[id]/components/ToolPanel/hooks/useActiveTabId';
import { toast } from '@/hooks/useToast';
import useAwsS3 from '@/hooks/useAwsS3';
import {
  generateS3UploadPath,
  getMimeType,
  validateAndProcessImage
} from '@/utils/file';
import { AvatarTemplatesModal } from './AvatarTemplatesModal';
import { designMyAvatarFormFamily } from '../../store/atoms';
import { MediaType } from '@/server/api/services/board/common';

const MAX_AVATAR_PHOTO_SIZE_MB = 5;

// Select from Board 按钮组件
function SelectFromBoardButton({ onSelect }: { onSelect: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className='absolute bottom-1 left-1 right-1 rounded bg-black/70 px-2 py-1 text-xs text-white/80 opacity-0 transition hover:bg-black/90 group-hover:opacity-100'
    >
      Select from Board
    </button>
  );
}

export function UploadAvatarPhoto() {
  // 获取当前活动的 Tab ID
  const tabId = useActiveTabId();

  // 从 store 获取表单状态
  const [formValues, setFormValues] = useRecoilState(
    designMyAvatarFormFamily(tabId)
  );
  const { avatarFaceS3Url } = formValues;

  // 获取素材选择方法
  const { startAssetSelect } = useAssetSelect();

  const [showAvatarTemplates, setShowAvatarTemplates] = useState(false);
  const [photoDragOver, setPhotoDragOver] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const photoContainerRef = useRef<HTMLDivElement>(null);

  // S3 上传 Hook
  const { uploadFileToS3, getFileUrl } = useAwsS3();

  // 设置 avatarFaceS3Url（用于预览）和 avatarFaceS3Key（S3路径）
  const setAvatarPhoto = useCallback(
    (s3Url: string = '', s3Key: string = '') => {
      setFormValues((prev) => ({
        ...prev,
        avatarFaceS3Url: s3Url,
        avatarFaceS3Key: s3Key
      }));
    },
    [setFormValues]
  );

  // 检查并处理自定义拖拽数据（从 Board 拖入）
  const handleCustomDragDrop = (): boolean => {
    const dragData = window.__dragData;
    if (dragData && dragData.type === MediaType.IMAGE && dragData.url) {
      setAvatarPhoto(dragData.url);
      delete window.__dragData;
      return true;
    }
    return false;
  };

  // 上传文件到 S3（仅负责校验、处理和上传，不重置 UI 状态）
  const uploadPhotoToS3 = async (file: File) => {
    // 大小校验
    const sizeInMB = file.size / 1024 / 1024;
    if (sizeInMB > MAX_AVATAR_PHOTO_SIZE_MB) {
      toast.error(`Image max ${MAX_AVATAR_PHOTO_SIZE_MB}MB file size.`);
      return '';
    }

    try {
      const processedFile = await validateAndProcessImage({
        file
      });

      const s3Path = generateS3UploadPath(
        processedFile,
        `analyzed_video/task/p2a/upload`
      );
      const mimeType = getMimeType(processedFile);

      if (!mimeType) {
        throw new Error('Unsupported image format. Supported: JPG, PNG, WEBP');
      }

      // 上传到 S3（进度映射到 0-90%）
      console.log('[UploadAvatarPhoto] Uploading to S3...');
      const uploadedS3Path = await uploadFileToS3({
        s3Path,
        file: processedFile,
        mimeType,
        handleUploadProgress: ({ loaded, total }) => {
          // 将上传进度映射到 0-90% 范围
          const progress = Math.round((loaded / total) * 90);
          setUploadProgress(progress);
        }
      });

      if (!uploadedS3Path) {
        throw new Error('Upload failed: No S3 path returned');
      }

      console.log('[UploadAvatarPhoto] Upload complete:', uploadedS3Path);
      return uploadedS3Path;
    } catch (error) {
      console.error('[UploadAvatarPhoto] Photo upload failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Upload failed';

      toast.error(errorMessage);

      return '';
    }
  };

  // 检查是否为 GIF 格式
  const isGifFile = (file: File): boolean => {
    return (
      file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif')
    );
  };

  // 处理文件选择：负责整体流程（校验 -> 上传 -> 获取 URL -> 更新状态）
  const handleFileSelect = async (file: File) => {
    // 过滤 GIF 格式
    if (isGifFile(file)) {
      console.log('[UploadAvatarPhoto] GIF file rejected');
      toast.error(
        'GIF images are not supported. Please use JPG, PNG, or WEBP.'
      );
      return;
    }

    setIsUploadingPhoto(true);
    setUploadProgress(0);

    try {
      // 上传到 S3，获取路径
      const s3Path = await uploadPhotoToS3(file);

      if (!s3Path) {
        console.log('[UploadAvatarPhoto] No s3Path returned, resetting');
        setAvatarPhoto();
        return;
      }

      // 获取可访问的预览 URL（成功后进度设为 100%）
      console.log('[UploadAvatarPhoto] Getting preview URL...');
      const previewUrl = await getFileUrl(s3Path);
      console.log('[UploadAvatarPhoto] Preview URL:', previewUrl);
      setUploadProgress(100);
      setAvatarPhoto(previewUrl, s3Path);

      toast.success('Photo uploaded successfully');
    } catch (error) {
      console.error(
        '[UploadAvatarPhoto] Photo upload or preview URL fetch failed:',
        error
      );
      const errorMessage =
        error instanceof Error ? error.message : 'Upload failed';

      setAvatarPhoto();

      toast.error(errorMessage);
    } finally {
      // 仅在整个流程（path + url）结束后重置 UI 状态
      console.log('[UploadAvatarPhoto] Upload flow completed');
      setIsUploadingPhoto(false);
      setUploadProgress(0);
    }
  };

  const handleAvatarSelect = (url: string, path: string) => {
    setAvatarPhoto(url, path);
  };

  return (
    <>
      <div
        ref={photoContainerRef}
        data-drop-zone='image'
        className={cn(
          'rounded-lg border-2 border-dashed transition-all',
          photoDragOver ? 'border-white/50 bg-white/10' : 'border-transparent'
        )}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = 'copy';
          setPhotoDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // 只有当离开整个拖拽区域时才重置状态
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const x = e.clientX;
          const y = e.clientY;
          if (
            x < rect.left ||
            x > rect.right ||
            y < rect.top ||
            y > rect.bottom
          ) {
            setPhotoDragOver(false);
          }
        }}
        onDragEnd={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setPhotoDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setPhotoDragOver(false);

          // 首先检查自定义拖拽数据（从 Board 拖入）
          if (handleCustomDragDrop()) {
            return;
          }
          // 从本地拖入文件
          const file = e.dataTransfer.files[0];
          if (file && file.type.startsWith('image/') && !isGifFile(file)) {
            handleFileSelect(file);
          }
        }}
        onMouseEnter={() => {
          const dragData = window.__dragData;
          if (dragData && dragData.type === MediaType.IMAGE) {
            setPhotoDragOver(true);
          }
        }}
        onMouseLeave={() => {
          const dragData = window.__dragData;
          if (dragData) {
            setPhotoDragOver(false);
          }
        }}
        onMouseUp={(e) => {
          const dragData = window.__dragData;
          if (dragData && dragData.url && dragData.type === MediaType.IMAGE) {
            console.log(dragData);
            e.stopPropagation();
            setAvatarPhoto(dragData.url, dragData.s3Path);
            delete window.__dragData;
            setPhotoDragOver(false);
          }
        }}
      >
        <input
          ref={photoInputRef}
          type='file'
          accept='image/jpeg,image/jpg,image/png,image/webp,image/pjpeg'
          onChange={(e) => {
            console.log('[UploadAvatarPhoto] Input onChange triggered');
            const file = e.target.files?.[0];
            console.log(
              '[UploadAvatarPhoto] Selected file:',
              file
                ? {
                    name: file.name,
                    type: file.type,
                    size: file.size
                  }
                : 'none'
            );
            if (file) {
              handleFileSelect(file);
            }
            // Reset input to allow selecting same file again
            e.target.value = '';
          }}
          className='hidden'
        />
        <div className='flex flex-wrap gap-2'>
          {avatarFaceS3Url ? (
            <div className='group relative h-24 w-24 overflow-hidden rounded-lg border border-white/10 bg-black/20'>
              <img
                src={avatarFaceS3Url}
                alt=''
                className='h-full w-full object-contain'
              />
              {/* 删除按钮 */}
              <button
                onClick={() => {
                  setAvatarPhoto();
                }}
                disabled={isUploadingPhoto}
                className='absolute right-1 top-1 rounded bg-black/60 p-1 text-white/70 opacity-0 transition hover:bg-black/80 group-hover:opacity-100 disabled:opacity-50'
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
              {!isUploadingPhoto && (
                <SelectFromBoardButton
                  onSelect={() =>
                    startAssetSelect?.(
                      MediaType.IMAGE,
                      'avatarFaceS3Url',
                      (url, _s3Path) => {
                        setAvatarPhoto(url, _s3Path);
                      }
                    )
                  }
                />
              )}
            </div>
          ) : (
            <>
              {/* Upload Photo */}
              <div
                onClick={() =>
                  !isUploadingPhoto && photoInputRef.current?.click()
                }
                className={cn(
                  'group relative flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed transition',
                  isUploadingPhoto && 'cursor-not-allowed opacity-50',
                  photoDragOver
                    ? 'border-indigo-500 bg-indigo-500/20'
                    : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
                )}
              >
                {isUploadingPhoto ? (
                  <>
                    <div className='mb-1 text-xs text-white/60'>
                      {uploadProgress}%
                    </div>
                    <div className='h-1 w-12 overflow-hidden rounded-full bg-white/20'>
                      <div
                        className='h-full bg-indigo-500 transition-all'
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className='h-5 w-5 text-white/40' />
                    <span className='text-[10px] text-white/40'>
                      {photoDragOver ? 'Release to drop' : 'Upload Photo'}
                    </span>
                  </>
                )}
                {/* Hover 时显示"从 Board 选择"按钮 */}
                {!isUploadingPhoto && (
                  <SelectFromBoardButton
                    onSelect={() =>
                      startAssetSelect?.(
                        MediaType.IMAGE,
                        'avatarFaceS3Url',
                        (url, _s3Path) => setAvatarPhoto(url, _s3Path)
                      )
                    }
                  />
                )}
              </div>
              {/* Select Existing Avatar */}
              <button
                onClick={() => setShowAvatarTemplates(true)}
                className='flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/20 bg-white/5 transition hover:border-white/30 hover:bg-white/10'
              >
                <Users className='h-5 w-5 text-white/40' />
                <span className='text-center text-[10px] leading-tight text-white/40'>
                  Select Existing Avatar
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Avatar Templates Modal */}
      {showAvatarTemplates && (
        <AvatarTemplatesModal
          onSelectAvatar={handleAvatarSelect}
          onClose={() => setShowAvatarTemplates(false)}
        />
      )}
    </>
  );
}
