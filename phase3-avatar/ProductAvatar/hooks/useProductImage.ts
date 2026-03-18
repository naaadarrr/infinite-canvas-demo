/**
 * ProductAvatar 产品图相关操作 Hook
 * 绑定 productImageUrl、productImagePath，以及后续的 productImageWithoutBackground
 *
 * 功能包括：
 * - 文件上传处理（校验、压缩、格式转换）
 * - S3 上传
 * - 状态管理（处理中状态、图片URL等）
 * - 创建抠图任务（Manual 模式）
 * - 处理抠图任务成功/失败回调
 */

import { useRecoilCallback } from 'recoil-next';
import { useCallback } from 'react';
import { activeTabIdState } from '@/app/board/[id]/components/ToolPanel/store';
import {
  productAvatarFormFamily,
  ProductAvatarGenerateMode,
  removeImageBackgroundTaskFamily
} from '../store/atoms';
import { TaskStatus } from '@/server/api/services/_common/type';
import {
  validateAndProcessImage,
  generateS3UploadPath,
  getMimeType
} from '@/utils/file';
import useAwsS3 from '@/hooks/useAwsS3';
import { useToast } from '@/hooks/useToast';
import {
  PRODUCT_AVATAR_IMAGE_MAX_SIZE,
  PRODUCT_AVATAR_PRODUCT_IMAGE_S3_PATH_PREFIX,
  IMAGE_MAX_WIDTH,
  IMAGE_MAX_HEIGHT,
  IMAGE_MAX_RESIZE_QUALITY,
  DEFAULT_PROCESS_IMAGE_FORMAT
} from '../config';
import { useCreateRemoveBackgroundMutation } from '../data/task/useMutations';
import { MimeType } from '@/types/common/resource';

/**
 * 产品图相关字段操作的 Hook
 * 绑定 productImageUrl、productImagePath，以及后续的 productImageWithoutBackground
 */
export function useProductImage() {
  const { toast } = useToast();
  const { uploadFileToS3, getCdnUrls } = useAwsS3();
  const { mutateAsync: createRemoveBackgroundTask } =
    useCreateRemoveBackgroundMutation();

  /**
   * 从上传/Board 选择/拖入设置产品图
   * 设置 productImageUrl、productImagePath；无论当前模式，只要产品图变化都清除 Manual 模式的抠图相关参数，并重置任务状态
   */
  const setProductImageFromUpload = useRecoilCallback(
    ({ set, snapshot }) =>
      (values: { url: string; s3Path: string }) => {
        const tabId = snapshot.getLoadable(activeTabIdState).getValue()!;
        set(productAvatarFormFamily(tabId), (prev) => {
          const baseNext = {
            ...prev,
            productImageUrl: values.url,
            productImagePath: values.s3Path
          };
          if (prev.mode === ProductAvatarGenerateMode.MANUAL) {
            return {
              ...baseNext,
              productImageWithoutBackground: undefined,
              productImageWithoutBackgroundUrl: undefined,
              handPaintedProductMaskPath: undefined,
              handPaintedProductMaskUrl: undefined,
              location: undefined,
              type: undefined,
              productTransform: undefined
            };
          }
          // Auto 模式下也清除可能存在的 Manual 相关字段，确保切回 Manual 时能重新触发抠图
          return {
            ...baseNext,
            productImageWithoutBackground: undefined,
            productImageWithoutBackgroundUrl: undefined,
            handPaintedProductMaskPath: undefined,
            handPaintedProductMaskUrl: undefined,
            location: undefined,
            type: undefined,
            productTransform: undefined
          };
        });
        set(removeImageBackgroundTaskFamily(tabId), {
          taskId: '',
          status: TaskStatus.FAIL
        });
      },
    []
  );

  /**
   * 清空产品图
   * 清空 productImageUrl、productImagePath；无论当前模式都清除 Manual 抠图相关参数并重置任务状态
   */
  const clearProductImage = useRecoilCallback(
    ({ set, snapshot }) =>
      () => {
        const tabId = snapshot.getLoadable(activeTabIdState).getValue()!;
        set(productAvatarFormFamily(tabId), (prev) => ({
          ...prev,
          productImageUrl: undefined,
          productImagePath: undefined,
          productImageWithoutBackground: undefined,
          productImageWithoutBackgroundUrl: undefined,
          handPaintedProductMaskPath: undefined,
          handPaintedProductMaskUrl: undefined,
          location: undefined,
          type: undefined,
          productTransform: undefined
        }));
        set(removeImageBackgroundTaskFamily(tabId), {
          taskId: '',
          status: TaskStatus.FAIL
        });
      },
    []
  );

  /**
   * 设置移除背景后的产品图（Manual 模式，抠图完成后）
   * 同时存储 s3Path（用于提交任务）和 CDN URL（用于显示）
   */
  const setProductImageWithoutBackground = useRecoilCallback(
    ({ set, snapshot }) =>
      (s3Path: string, url?: string) => {
        const tabId = snapshot.getLoadable(activeTabIdState).getValue()!;
        set(productAvatarFormFamily(tabId), (prev) => {
          if (prev.mode !== ProductAvatarGenerateMode.MANUAL) return prev;
          return {
            ...prev,
            productImageWithoutBackground: s3Path,
            productImageWithoutBackgroundUrl: url
          };
        });
      },
    []
  );

  /**
   * 设置处理中状态
   */
  const setIsProcessing = useRecoilCallback(
    ({ set, snapshot }) =>
      (isProcessing: boolean) => {
        const tabId = snapshot.getLoadable(activeTabIdState).getValue()!;
        // 可以通过扩展 store 来添加 isProcessing 字段，或者通过其他方式管理
        // 这里暂时不修改 store，通过外部状态管理
      },
    []
  );

  /**
   * 校验文件大小
   */
  const validateFileSize = useCallback((file: File) => {
    if (file.size > PRODUCT_AVATAR_IMAGE_MAX_SIZE) {
      throw new Error(
        `Image size max ${PRODUCT_AVATAR_IMAGE_MAX_SIZE / 1024 / 1024}MB`
      );
    }
  }, []);

  /**
   * 设置手绘产品遮罩（Manual 模式）
   * 同时存储 s3Path（用于提交任务）和 CDN URL（用于显示）
   */
  const setHandPaintedProductMask = useRecoilCallback(
    ({ set, snapshot }) =>
      (s3Path: string, url?: string) => {
        const tabId = snapshot.getLoadable(activeTabIdState).getValue()!;
        set(productAvatarFormFamily(tabId), (prev) => {
          if (prev.mode !== ProductAvatarGenerateMode.MANUAL) return prev;
          return {
            ...prev,
            handPaintedProductMaskPath: s3Path,
            handPaintedProductMaskUrl: url
          };
        });
      },
    []
  );

  /**
   * 创建移除背景任务（Manual 模式）
   */
  const createRemoveImageBackgroundTask = useRecoilCallback(
    ({ set, snapshot }) =>
      async (productImageS3Path: string) => {
        try {
          const tabId = snapshot.getLoadable(activeTabIdState).getValue()!;
          const formValues = snapshot
            .getLoadable(productAvatarFormFamily(tabId))
            .getValue();

          if (formValues.mode !== ProductAvatarGenerateMode.MANUAL) {
            return;
          }

          const manualFormValues = formValues as typeof formValues & {
            handPaintedProductMaskPath?: string;
          };

          const taskId = await createRemoveBackgroundTask({
            productImagePath: productImageS3Path,
            handPaintedProductMaskPath:
              manualFormValues.handPaintedProductMaskPath
          });

          // 保存任务 ID 和状态到 store
          if (taskId) {
            set(removeImageBackgroundTaskFamily(tabId), {
              taskId,
              status: TaskStatus.RUNNING
            });
          }

          return taskId;
        } catch (error: any) {
          const errorMessage =
            error?.message || 'Failed to create remove background task';
          toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive'
          });
          // 更新任务状态为失败
          const tabId = snapshot.getLoadable(activeTabIdState).getValue()!;
          set(removeImageBackgroundTaskFamily(tabId), {
            taskId: '',
            status: TaskStatus.FAIL
          });
          throw error;
        }
      },
    [createRemoveBackgroundTask, toast]
  );

  /**
   * 处理产品图片上传成功后的逻辑
   */
  const handleUploadProductImageSuccess = useRecoilCallback(
    ({ set, snapshot }) =>
      async (s3Path: string) => {
        const tabId = snapshot.getLoadable(activeTabIdState).getValue()!;
        const formValues = snapshot
          .getLoadable(productAvatarFormFamily(tabId))
          .getValue();

        // 更新 CDN URL
        const cdnUrls = await getCdnUrls({
          productImageUrl: s3Path
        });
        const productImageUrl = cdnUrls.productImageUrl;

        // 设置产品图片；无论当前模式都清除 Manual 抠图相关字段，确保换图后切回 Manual 能重新触发抠图
        set(productAvatarFormFamily(tabId), (prev) => ({
          ...prev,
          productImageUrl: productImageUrl || prev.productImageUrl,
          productImagePath: s3Path,
          productImageWithoutBackground: undefined,
          productImageWithoutBackgroundUrl: undefined,
          handPaintedProductMaskPath: undefined,
          handPaintedProductMaskUrl: undefined,
          location: undefined,
          type: undefined,
          productTransform: undefined
        }));
        set(removeImageBackgroundTaskFamily(tabId), {
          taskId: '',
          status: TaskStatus.FAIL
        });

        // 如果是 Manual 模式，创建抠图任务
        if (formValues.mode === ProductAvatarGenerateMode.MANUAL && s3Path) {
          await createRemoveImageBackgroundTask(s3Path);
        }
      },
    [createRemoveImageBackgroundTask, getCdnUrls]
  );

  /**
   * 处理文件上传
   * 包括：文件校验、图片处理、S3上传、状态更新
   */
  const handleUploadProductImage = useRecoilCallback(
    ({ set, snapshot }) =>
      async (file: File | File[]) => {
        try {
          // 统一处理单个文件
          const selectedFile = Array.isArray(file) ? file[0] : file;
          if (!selectedFile) return;

          // 校验文件大小
          validateFileSize(selectedFile);

          // 图片校验 & 处理
          const processedFile = await validateAndProcessImage({
            file: selectedFile,
            processingOptions: {
              maxWidth: IMAGE_MAX_WIDTH,
              maxHeight: IMAGE_MAX_HEIGHT,
              resizeQuality: IMAGE_MAX_RESIZE_QUALITY,
              format: DEFAULT_PROCESS_IMAGE_FORMAT as 'jpeg' | 'png' | 'webp'
            }
          });

          // 生成预览 URL；无论当前模式都清除 Manual 抠图相关字段，避免中间状态残留
          const blobUrl = URL.createObjectURL(processedFile);
          const tabId = snapshot.getLoadable(activeTabIdState).getValue()!;
          set(productAvatarFormFamily(tabId), (prev) => ({
            ...prev,
            productImageUrl: blobUrl,
            productImagePath: '', // 临时使用 blob URL，上传成功后再更新
            productImageWithoutBackground: undefined,
            productImageWithoutBackgroundUrl: undefined,
            handPaintedProductMaskPath: undefined,
            handPaintedProductMaskUrl: undefined,
            location: undefined,
            type: undefined,
            productTransform: undefined
          }));

          // 生成 S3 上传路径
          const uploadS3Path = generateS3UploadPath(
            processedFile,
            PRODUCT_AVATAR_PRODUCT_IMAGE_S3_PATH_PREFIX
          );

          // 获取 MIME 类型
          const mimeType = getMimeType(processedFile);
          if (!mimeType) {
            throw new Error(
              'Unsupported image format. Supported: JPG, PNG, WEBP'
            );
          }

          // 上传到 S3
          const uploadedS3Path = await uploadFileToS3({
            file: processedFile,
            s3Path: uploadS3Path,
            mimeType: mimeType as MimeType
          });

          if (!uploadedS3Path) {
            throw new Error('Failed to upload image.');
          }

          // 处理上传成功后的逻辑
          await handleUploadProductImageSuccess(uploadedS3Path);
        } catch (error) {
          const errorMessage =
            (error as Error)?.message ||
            'Failed to upload image. Please try again later.';
          toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive'
          });
          clearProductImage();
          throw error;
        }
      },
    [
      validateFileSize,
      uploadFileToS3,
      handleUploadProductImageSuccess,
      clearProductImage,
      toast
    ]
  );

  /**
   * 处理移除背景任务成功回调
   */
  const handleRemoveImageBackgroundTaskSuccess = useRecoilCallback(
    ({ set, snapshot }) =>
      async (taskResult: {
        bgRemovedImage?: { filePath?: string };
        mask?: { filePath?: string };
      }) => {
        const tabId = snapshot.getLoadable(activeTabIdState).getValue()!;
        const formValues = snapshot
          .getLoadable(productAvatarFormFamily(tabId))
          .getValue();

        if (formValues.mode !== ProductAvatarGenerateMode.MANUAL) {
          return;
        }

        const { bgRemovedImage, mask } = taskResult;
        const removeBackgroundProductImageS3Path = bgRemovedImage?.filePath;
        const maskS3Path = mask?.filePath;

        if (!removeBackgroundProductImageS3Path) {
          // 如果没有文件路径，更新任务状态为失败
          set(removeImageBackgroundTaskFamily(tabId), {
            taskId: '',
            status: TaskStatus.FAIL
          });
          return;
        }

        // 获取 CDN URL 用于显示
        try {
          const cdnUrlMap: Record<string, string> = {
            removeBackgroundProductImageUrl: removeBackgroundProductImageS3Path
          };

          // 如果任务结果中包含 mask，也获取其 CDN URL
          if (maskS3Path) {
            cdnUrlMap.handPaintedProductMaskUrl = maskS3Path;
          }

          const cdnUrls = await getCdnUrls(cdnUrlMap);

          const removeBackgroundProductImageUrl =
            cdnUrls.removeBackgroundProductImageUrl;
          const handPaintedProductMaskUrl = cdnUrls.handPaintedProductMaskUrl;

          // 同时存储 s3Path（用于提交任务）和 CDN URL（用于显示）
          setProductImageWithoutBackground(
            removeBackgroundProductImageS3Path,
            removeBackgroundProductImageUrl
          );

          // 如果任务结果中包含 mask，设置手绘产品遮罩
          if (maskS3Path) {
            setHandPaintedProductMask(maskS3Path, handPaintedProductMaskUrl);
          }

          // 更新任务状态为成功
          set(removeImageBackgroundTaskFamily(tabId), {
            taskId: '',
            status: TaskStatus.SUCCESS
          });
        } catch (error) {
          // CDN URL 获取失败，只存储 s3Path
          console.error(
            'Failed to get CDN URL for removed background image:',
            error
          );
          setProductImageWithoutBackground(removeBackgroundProductImageS3Path);

          // 如果任务结果中包含 mask，即使 CDN URL 获取失败，也存储 s3Path
          if (maskS3Path) {
            setHandPaintedProductMask(maskS3Path);
          }

          set(removeImageBackgroundTaskFamily(tabId), {
            taskId: '',
            status: TaskStatus.SUCCESS
          });
        }
      },
    [setProductImageWithoutBackground, setHandPaintedProductMask, getCdnUrls]
  );

  /**
   * 处理移除背景任务失败回调
   */
  const handleRemoveImageBackgroundTaskError = useRecoilCallback(
    ({ set, snapshot }) =>
      () => {
        const tabId = snapshot.getLoadable(activeTabIdState).getValue()!;

        // 更新任务状态为失败
        set(removeImageBackgroundTaskFamily(tabId), {
          taskId: '',
          status: TaskStatus.FAIL
        });

        clearProductImage();
      },
    [clearProductImage]
  );

  return {
    setProductImageFromUpload,
    clearProductImage,
    setProductImageWithoutBackground,
    setHandPaintedProductMask,
    handleUploadProductImage,
    createRemoveImageBackgroundTask,
    handleRemoveImageBackgroundTaskSuccess,
    handleRemoveImageBackgroundTaskError
  };
}
