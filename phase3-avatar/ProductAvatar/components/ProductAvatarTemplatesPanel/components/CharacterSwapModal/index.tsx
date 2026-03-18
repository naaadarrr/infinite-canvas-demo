'use client';

import { useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSetRecoilState, useRecoilValue } from 'recoil-next';
import { X, Upload, ArrowRight, Sparkle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { productAvatarTemplateCollectionIdState } from '../../../../store/templateAtoms';
import type { ProductAvatarMetaFrontDTO } from '@/server/api/services/productAvatar/template/type';
import { getResourcePrefixed } from '@/utils/media';
import { ProductAvatarCategoryId } from '../../../../type';
import { imageCharacterSwapTaskListState } from '../../../../store/characterSwapAtoms';
import { useCreateImageCharacterSwapTaskMutation } from '../../../../data/task/useMutations';
import useAwsS3 from '@/hooks/useAwsS3';
import {
  validateAndProcessImage,
  generateS3UploadPath,
  getMimeType
} from '@/utils/file';
import {
  IMAGE_MAX_WIDTH,
  IMAGE_MAX_HEIGHT,
  IMAGE_MAX_RESIZE_QUALITY,
  DEFAULT_PROCESS_IMAGE_FORMAT,
  PRODUCT_AVATAR_IMAGE_MAX_SIZE,
  PRODUCT_AVATAR_CHARACTER_IMAGE_S3_PATH_PREFIX
} from '../../../../config';
import { MimeType } from '@/types/common/resource';
import { toast } from '@/hooks/useToast';
import { ImageCharacterSwapTaskSourceEnum } from '@/server/api/services/imageCharacterSwap/type';
import { TaskStatus } from '@/server/api/services/_common/type';
import { usePricingModal } from '@topview/pricing';
import { teamCreditState } from '@/store/benefit';

/** Character Swap 任务积分消耗 */
const CHARACTER_SWAP_CREDIT_CONSUMPTION = 0.5;

export interface CharacterSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 模板对象（完整 DTO） */
  template: ProductAvatarMetaFrontDTO;
}

export function CharacterSwapModal({
  isOpen,
  onClose,
  template
}: CharacterSwapModalProps) {
  const [characterImage, setCharacterImage] = useState<string | null>(null);
  const [characterFile, setCharacterFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setCollectionId = useSetRecoilState(
    productAvatarTemplateCollectionIdState
  );
  const { uploadFileToS3, getCdnUrls } = useAwsS3();
  const setImageCharacterSwapTaskList = useSetRecoilState(
    imageCharacterSwapTaskListState
  );
  const { mutateAsync: createImageCharacterSwapTask } =
    useCreateImageCharacterSwapTaskMutation();

  // 积分检查
  const { openPricingModal } = usePricingModal();
  const teamCredit = useRecoilValue(teamCreditState);
  const isEnoughCredit = useMemo(
    () => (teamCredit?.remainCredit ?? 0) >= CHARACTER_SWAP_CREDIT_CONSUMPTION,
    [teamCredit?.remainCredit]
  );

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      // 校验文件大小
      if (file.size > PRODUCT_AVATAR_IMAGE_MAX_SIZE) {
        throw new Error('Image size max 10MB');
      }
      setCharacterImage(URL.createObjectURL(file));
      setCharacterFile(file);
    }
  };

  // 将角色图片处理并上传到 S3，返回 { s3Path, url }
  const uploadCharacterFileToS3 = async (file: File) => {
    if (file.size > PRODUCT_AVATAR_IMAGE_MAX_SIZE) {
      throw new Error('Image size max 10MB');
    }
    const processedFile = await validateAndProcessImage({
      file,
      processingOptions: {
        maxWidth: IMAGE_MAX_WIDTH,
        maxHeight: IMAGE_MAX_HEIGHT,
        resizeQuality: IMAGE_MAX_RESIZE_QUALITY,
        format: DEFAULT_PROCESS_IMAGE_FORMAT
      }
    });

    const uploadS3Path = generateS3UploadPath(
      processedFile,
      PRODUCT_AVATAR_CHARACTER_IMAGE_S3_PATH_PREFIX
    );

    const mimeType = getMimeType(processedFile);
    if (!mimeType) {
      throw new Error('Unsupported image format. Supported: JPG, PNG, WEBP');
    }

    const uploadedS3Path = await uploadFileToS3({
      file: processedFile,
      s3Path: uploadS3Path,
      mimeType: mimeType as MimeType
    });

    if (!uploadedS3Path) {
      throw new Error('Failed to upload image');
    }

    // 通过后端获取可访问的 CDN URL（优先使用后端返回的 URL）
    // 获取后端 CDN URL（失败则抛出错误）
    const cdnMap = await getCdnUrls({ characterImageUrl: uploadedS3Path });
    if (!cdnMap || !cdnMap.characterImageUrl) {
      throw new Error('Failed to get CDN URL for uploaded image');
    }
    return {
      s3Path: uploadedS3Path,
      url: cdnMap.characterImageUrl
    };
  };

  const handleGenerate = async () => {
    if (!characterImage || !characterFile) return;

    // 积分不足时打开价格弹窗
    if (!isEnoughCredit) {
      openPricingModal();
      return;
    }

    setIsGenerating(true);
    try {
      // 上传角色图片到 S3
      const res = await uploadCharacterFileToS3(characterFile);
      const uploadedS3Path = res.s3Path;
      const uploadedUrl = res.url;

      // 创建后端任务
      const taskId = await createImageCharacterSwapTask({
        inputModelImagePath: uploadedS3Path,
        inputTemplateImagePath:
          template.coverImagePath || template.avatarImagePath || '',
        source: ImageCharacterSwapTaskSourceEnum.ProductAvatar,
        referAvatarId: template.avatarId
      });
      const newTask = {
        taskId,
        status: TaskStatus.INIT,
        inputModelImagePath: uploadedS3Path,
        inputModelImageUrl: uploadedUrl,
        inputTemplateImagePath:
          template.coverImagePath || template.avatarImagePath || '',
        inputTemplateImageUrl: getResourcePrefixed(
          template.coverImagePath || template.avatarImagePath || ''
        ),
        outputImagePath: '',
        outputImageUrl: '',
        gmtCreate: new Date().toISOString()
      };

      setImageCharacterSwapTaskList((prev) => [newTask, ...prev]);

      // 先切换到 My Product Avatar 分类（在弹窗关闭前完成）
      setCollectionId(ProductAvatarCategoryId.MY_PRODUCT_AVATAR);

      // 稍微延迟关闭弹窗，确保状态更新完成
      setTimeout(() => {
        handleClose();
      }, 100);
    } catch (err: any) {
      const { errorMessage } =
        typeof err === 'object' ? (err as any) : { errorMessage: String(err) };
      toast.error(errorMessage || 'Failed to generate character swap task');
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setCharacterImage(null);
    setIsGenerating(false);
    onClose();
  };

  const modalContent = (
    <div className='fixed inset-0 z-[100] flex items-center justify-center'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/60 backdrop-blur-sm'
        onClick={handleClose}
      />

      {/* Modal */}
      <div className='relative w-full max-w-md rounded-2xl border border-white/10 bg-[#1e1e1e] px-6 pb-6 pt-10 shadow-2xl'>
        {/* Close Button */}
        <button
          onClick={handleClose}
          className='absolute right-3 top-3 z-10 rounded-md p-1 text-white/40 transition hover:bg-white/10 hover:text-white'
        >
          <X className='h-5 w-5' />
        </button>

        {/* Upload Area */}
        <div className='flex flex-col items-center'>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            onChange={handleFileSelect}
            className='hidden'
          />

          {/* Upload Zone - 整个区域可点击上传 */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'mb-4 w-full cursor-pointer rounded-xl border-2 border-dashed transition-all',
              characterImage
                ? 'border-transparent bg-transparent p-0'
                : 'border-white/10 bg-white/5 p-6 hover:border-white/20 hover:bg-white/10'
            )}
          >
            {characterImage ? (
              /* 上传后：显示上传的图片 */
              <div className='group relative overflow-hidden rounded-xl'>
                <img
                  src={characterImage}
                  alt='Uploaded character'
                  className='h-auto max-h-[280px] w-full object-contain'
                  draggable={false}
                />
                {/* 替换按钮 */}
                <div className='absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:opacity-100'>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className='flex items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-1.5 text-xs text-white/80 backdrop-blur-sm transition hover:bg-black/80'
                  >
                    <Upload className='h-3.5 w-3.5' />
                    Replace
                  </button>
                </div>
              </div>
            ) : (
              /* 上传前：显示上传图标、提示文字、示意图 */
              <div className='flex flex-col items-center'>
                {/* Upload Icon */}
                <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5'>
                  <Upload className='h-5 w-5 text-white/40' />
                </div>

                {/* Text */}
                <p className='mb-4 text-center text-sm text-white/60'>
                  Upload a character image to swap the avatar
                </p>

                {/* Preview Images - 仅示意 */}
                <div className='flex select-none items-center justify-center gap-2'>
                  {/* Template Image (图A) */}
                  <div className='relative h-16 w-12 overflow-hidden rounded-lg border border-white/10 bg-white/5'>
                    <img
                      src={getResourcePrefixed(
                        template.coverImagePath ||
                          template.avatarImagePath ||
                          ''
                      )}
                      alt='Template'
                      className='h-full w-full object-cover'
                      draggable={false}
                    />
                    {/* Play button overlay */}
                    <div className='absolute inset-0 flex items-center justify-center'>
                      <div className='flex h-4 w-4 items-center justify-center rounded-full bg-black/50'>
                        <div className='ml-0.5 h-0 w-0 border-y-[3px] border-l-[5px] border-y-transparent border-l-white' />
                      </div>
                    </div>
                  </div>

                  {/* Plus sign */}
                  <span className='text-lg text-white/30'>+</span>

                  {/* Character placeholder (图B) */}
                  <div className='relative h-16 w-12 overflow-hidden rounded-lg border border-white/10 bg-white/5'>
                    <img
                      src='https://picsum.photos/seed/char-demo/200/250'
                      alt='Character'
                      className='h-full w-full object-cover'
                      draggable={false}
                    />
                  </div>

                  {/* Arrow */}
                  <div className='flex items-center text-white/30'>
                    <span className='mx-1 text-xs'>···</span>
                    <ArrowRight className='h-4 w-4' />
                  </div>

                  {/* Result (图C) */}
                  <div className='relative h-16 w-12 overflow-hidden rounded-lg border border-white/10 bg-white/5'>
                    <img
                      src={getResourcePrefixed(
                        template.coverImagePath ||
                          template.avatarImagePath ||
                          ''
                      )}
                      alt='Result'
                      className='h-full w-full object-cover'
                      draggable={false}
                    />
                    {/* Cyan border highlight */}
                    <div className='absolute inset-0 rounded-lg ring-2 ring-cyan-400/50' />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!characterImage || isGenerating}
            className={cn(
              'flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium text-white transition-all',
              'bg-[#4E40F3] hover:bg-[#4030E0] disabled:opacity-70'
            )}
          >
            {isGenerating ? (
              <>
                <div className='h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>Generate</span>
                <span className='flex items-center gap-1 border-l border-white/30 pl-2'>
                  <Sparkle className='h-3.5 w-3.5 fill-current' />
                  <span>0.5</span>
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
