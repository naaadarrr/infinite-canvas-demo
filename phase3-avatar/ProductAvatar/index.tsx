// Product Avatar 工具表单组件

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil-next';
import { AvatarPhotoUpload } from './components/AvatarPhotoUpload';
import { ProductImageUpload } from './components/ProductImageUpload';
import { ManualCompositeCanvas } from './components/ManualCompositeCanvas';
import { useAssetSelect } from '@/app/board/[id]/components/ToolPanel/hooks/useAssetSelect';
import { useViewMode } from '@/app/board/[id]/components/ToolPanel/hooks/useViewMode';
import { useActiveTabId } from '@/app/board/[id]/components/ToolPanel/hooks/useActiveTabId';
import { TaskStatus } from '@/server/api/services/_common/type';
import type { RectangleCorners } from '@/server/api/services/productAvatar/task/type';
import {
  productAvatarFormFamily,
  ProductAvatarFormValues,
  ProductAvatarGenerateMode,
  removeImageBackgroundTaskFamily,
  reEditLoadingFamily,
  type ProductTransform
} from './store/atoms';
import { ModeSwitch } from './components/ModeSwitch';
import { useProductAvatarTemplate } from './hooks/useProductAvatarTemplate';
import { useProductAvatarTemplateInit } from './hooks/useProductAvatarTemplateInit';
import { useProductImage } from './hooks/useProductImage';
import { RemoveProductImageBackgroundController } from './components/RemoveProductImageBackgroundController';
import { GenerateButton } from './components/GenerateButton';
import { useProductAvatarTaskGeneration } from './hooks/useProductAvatarTaskGeneration';
import MaskEditor from './components/MaskEditor';

export function ProductAvatar() {
  // 获取素材选择方法
  const { startAssetSelect } = useAssetSelect();

  // 获取视图模式控制方法
  const { switchToInspiration, switchToBoard } = useViewMode();

  // 使用独立的模块 store，按 tabId 隔离
  const tabId = useActiveTabId();

  // 初始化模板（处理从 Home 页跳转时携带的 templateId 参数）
  useProductAvatarTemplateInit();

  const [formValues, setFormValues] = useRecoilState(
    productAvatarFormFamily(tabId)
  );
  // 从模块 store 获取状态
  const {
    avatarTemplateUrl,
    templateImageUrl,
    productImageUrl,
    productImagePath,
    mode
  } = formValues;

  // 获取 Manual 模式下的抠图后的产品图 s3Path（用于提交任务）
  const productImageWithoutBackground =
    mode === ProductAvatarGenerateMode.MANUAL
      ? (
          formValues as ProductAvatarFormValues & {
            productImageWithoutBackground?: string;
          }
        ).productImageWithoutBackground
      : undefined;

  // 获取 Manual 模式下的抠图后的产品图 CDN URL（用于显示）
  const productImageWithoutBackgroundUrl =
    mode === ProductAvatarGenerateMode.MANUAL
      ? (
          formValues as ProductAvatarFormValues & {
            productImageWithoutBackgroundUrl?: string;
          }
        ).productImageWithoutBackgroundUrl
      : undefined;

  // 获取 Manual 模式下的手绘产品遮罩 URL（用于显示）
  const handPaintedProductMaskUrl =
    mode === ProductAvatarGenerateMode.MANUAL
      ? (
          formValues as ProductAvatarFormValues & {
            handPaintedProductMaskUrl?: string;
          }
        ).handPaintedProductMaskUrl
      : undefined;

  // 获取移除背景任务状态
  const removeImageBackgroundTask = useRecoilValue(
    removeImageBackgroundTaskFamily(tabId)
  );

  // 用于设置任务状态的 setter
  const setRemoveImageBackgroundTask = useSetRecoilState(
    removeImageBackgroundTaskFamily(tabId)
  );

  // 获取当前显示的模板图片 URL（优先使用模板库的，否则使用用户上传的）
  const currentTemplateUrl = avatarTemplateUrl ?? templateImageUrl;

  // 获取 Re-edit loading 状态
  const isReEditLoading = useRecoilValue(reEditLoadingFamily(tabId));

  // 使用模板相关的 Hook
  const { setTemplateFromUpload, clearTemplate } = useProductAvatarTemplate();

  // 使用产品图相关的 Hook（绑定 productImageUrl、productImagePath、productImageWithoutBackground）
  const {
    setProductImageFromUpload,
    clearProductImage,
    handleUploadProductImage,
    createRemoveImageBackgroundTask,
    setHandPaintedProductMask
  } = useProductImage();

  // Mask Editor 状态
  const [isOpenMaskEditor, setIsOpenMaskEditor] = useState(false);

  // 更新 avatarTemplate 的辅助函数
  // 当用户上传或从 Board 拖入时，使用 setTemplateFromUpload
  const setAvatarTemplate = useCallback(
    (values: { url: string; s3Path: string }) => {
      setTemplateFromUpload({
        templateImageUrl: values.url,
        templateImagePath: values.s3Path
      });
    },
    [setTemplateFromUpload]
  );

  // 清空 avatarTemplate 的辅助函数
  const clearAvatarTemplate = useCallback(() => {
    clearTemplate();
  }, [clearTemplate]);

  // 更新 mode：仅切换模式，不清除、不覆盖任何数据
  const setMode = useCallback(
    (newMode: ProductAvatarGenerateMode) => {
      setFormValues((prev) => {
        if (prev.mode === newMode) return prev;
        return { ...prev, mode: newMode } as ProductAvatarFormValues;
      });
    },
    [setFormValues]
  );

  // Product Avatar 自动切换到 Templates 视图
  useEffect(() => {
    switchToInspiration();
    return () => {
      // 组件卸载时切换回 Board 视图
      switchToBoard();
    };
  }, [switchToInspiration, switchToBoard]);

  // 跟踪已经为哪个 productImagePath 发起过任务，避免重复发起
  const lastTriggeredImagePathRef = useRef<string | null>(null);

  // 当从 AUTO 切换到 MANUAL 时，如果产品图没有抠图信息，自动发起抠图任务
  useEffect(() => {
    // 检查是否满足发起任务的条件
    const shouldTrigger =
      mode === ProductAvatarGenerateMode.MANUAL &&
      productImagePath &&
      !productImageWithoutBackground &&
      removeImageBackgroundTask.status !== TaskStatus.RUNNING &&
      removeImageBackgroundTask.status !== TaskStatus.SUCCESS && // 如果任务已经成功，不应该再发起
      !removeImageBackgroundTask.taskId &&
      productImagePath !== lastTriggeredImagePathRef.current; // 确保没有为当前图片发起过任务

    if (shouldTrigger) {
      // 记录已为当前图片发起过任务
      lastTriggeredImagePathRef.current = productImagePath;

      // 立即设置状态为 RUNNING，显示 loading
      setRemoveImageBackgroundTask({
        taskId: '', // 任务 ID 还未创建，先设为空
        status: TaskStatus.RUNNING
      });

      // 自动发起抠图任务
      createRemoveImageBackgroundTask(productImagePath).catch((error) => {
        console.error(
          'Failed to create remove background task on mode switch:',
          error
        );
        // 如果失败，重置状态和 ref，允许重试
        setRemoveImageBackgroundTask({
          taskId: '',
          status: TaskStatus.FAIL
        });
        if (productImagePath === lastTriggeredImagePathRef.current) {
          lastTriggeredImagePathRef.current = null;
        }
      });
    }

    // 只在 productImagePath 真正变化时重置 ref，而不是在模式切换时重置
    // 这样即使切换模式，如果 productImagePath 没变，也不会重复发起任务
    if (
      productImagePath &&
      productImagePath !== lastTriggeredImagePathRef.current
    ) {
      // 如果 productImagePath 变化了，且新图片已经有抠图结果，不需要重置 ref
      // 如果新图片没有抠图结果，重置 ref 允许发起新任务
      if (!productImageWithoutBackground) {
        lastTriggeredImagePathRef.current = null;
      }
    }
  }, [
    mode,
    productImagePath,
    productImageWithoutBackground,
    removeImageBackgroundTask.status,
    removeImageBackgroundTask.taskId,
    setRemoveImageBackgroundTask,
    createRemoveImageBackgroundTask
  ]);

  // 使用任务生成 hook
  const { isSubmitting, generateTask } = useProductAvatarTaskGeneration();

  // 根据真实任务状态判断是否正在处理抠图
  // 注意：status === RUNNING 时就应该显示 loading，即使 taskId 还是空的（任务创建中）
  const isCutoutProcessing: boolean =
    mode === ProductAvatarGenerateMode.MANUAL &&
    removeImageBackgroundTask.status === TaskStatus.RUNNING;

  // 判断是否完成（如果有抠图后的图，说明已经完成，不需要检查任务状态）
  // 因为切换模式时任务状态可能不是 SUCCESS，但抠图结果已经保存在 formValues 中
  const isCutoutDone =
    mode === ProductAvatarGenerateMode.MANUAL &&
    !!productImageWithoutBackground &&
    !!productImageWithoutBackgroundUrl;

  // 更新模式时同步到 formValues
  const handleModeChange = (newMode: ProductAvatarGenerateMode) => {
    setMode(newMode);
  };

  // 调整抠图 - 打开 Mask Editor
  const handleAdjustCutout = () => {
    setIsOpenMaskEditor(true);
  };

  // 处理 Mask Editor 成功回调
  const handleEditProductMaskSuccess = useCallback(
    async ({
      s3Path,
      coordinate
    }: {
      s3Path: string;
      coordinate: { x: number; y: number; w: number; h: number };
    }) => {
      // 设置手绘遮罩路径
      setHandPaintedProductMask(s3Path);

      // 清除之前的抠图结果和变换数据，触发重新抠图
      setFormValues((prev) => {
        if (prev.mode === ProductAvatarGenerateMode.MANUAL) {
          return {
            ...prev,
            productImageWithoutBackground: undefined,
            productImageWithoutBackgroundUrl: undefined,
            productTransform: undefined,
            location: undefined
          };
        }
        return prev;
      });

      // 如果产品图存在，重新创建移除背景任务（包含新的 mask）
      if (productImagePath) {
        setRemoveImageBackgroundTask({
          taskId: '',
          status: TaskStatus.RUNNING
        });
        await createRemoveImageBackgroundTask(productImagePath);
      }
    },
    [
      setHandPaintedProductMask,
      setFormValues,
      productImagePath,
      setRemoveImageBackgroundTask,
      createRemoveImageBackgroundTask
    ]
  );

  // 处理产品变换更新
  const handleProductTransformChange = useCallback(
    (data: { transform: ProductTransform; location: RectangleCorners }) => {
      if (mode === ProductAvatarGenerateMode.MANUAL) {
        setFormValues((prev) => {
          if (prev.mode === ProductAvatarGenerateMode.MANUAL) {
            return {
              ...prev,
              productTransform: data.transform,
              location: data.location
            };
          }
          return prev;
        });
      }
    },
    [mode, setFormValues]
  );

  // 判断是否显示合成画布（Manual 模式 + 两张图都有 + 抠图完成 + 抠图后的图存在）
  const showCompositeCanvas =
    mode === ProductAvatarGenerateMode.MANUAL &&
    !!currentTemplateUrl &&
    !!productImageUrl &&
    productImageWithoutBackgroundUrl &&
    isCutoutDone;

  // 判断是否正在抠图（Manual 模式 + 两张图都有 + 正在处理）
  const isProcessingCutout: boolean =
    mode === ProductAvatarGenerateMode.MANUAL &&
    !!currentTemplateUrl &&
    !!productImageUrl &&
    isCutoutProcessing;

  // 处理生成任务
  const handleGenerate = useCallback(async () => {
    await generateTask(formValues);
  }, [generateTask, formValues]);

  return (
    <div className='flex h-full flex-col'>
      {/* 移除背景任务轮询控制器 */}
      <RemoveProductImageBackgroundController />
      <div className='flex-1 space-y-4 p-4'>
        {/* Mode Switch */}
        <ModeSwitch
          mode={mode}
          onModeChange={handleModeChange}
        />

        {/* Manual 模式下的合成画布（抠图完成后显示） */}
        {showCompositeCanvas && productImageWithoutBackgroundUrl && (
          <ManualCompositeCanvas
            avatarTemplate={currentTemplateUrl ?? null}
            productImage={productImageWithoutBackgroundUrl}
            onTransformChange={handleProductTransformChange}
            onClearTemplate={clearAvatarTemplate}
          />
        )}

        {/* Avatar Photo 上传 - 仅在未显示合成画布时显示 */}
        {!showCompositeCanvas && (
          <AvatarPhotoUpload
            label='Avatar Photo'
            photoUrl={currentTemplateUrl}
            setPhoto={setAvatarTemplate}
            clearPhoto={clearAvatarTemplate}
            onAssetSelect={startAssetSelect}
            isLoading={isReEditLoading}
          />
        )}

        {/* Upload Product Image - 始终显示，根据状态传递不同 props */}
        <ProductImageUpload
          label='Upload Product Image'
          image={productImageUrl ?? null}
          setImage={setProductImageFromUpload}
          clearImage={clearProductImage}
          onAssetSelect={startAssetSelect}
          isProcessing={!showCompositeCanvas && isProcessingCutout}
          showActions={!!showCompositeCanvas}
          onAdjustCutout={showCompositeCanvas ? handleAdjustCutout : undefined}
          onFileUpload={(file) => handleUploadProductImage(file)}
          isLoading={isReEditLoading}
        />

        {/* Auto Mode 提示 */}
        {!showCompositeCanvas &&
          mode === ProductAvatarGenerateMode.AUTO &&
          productImageUrl && (
            <p className='text-xs text-white/40'>
              Product placement is automatic. Switch to Manual to customize.
            </p>
          )}
      </div>

      {/* Generate Button */}
      <GenerateButton
        formValues={formValues}
        isSubmitting={isSubmitting}
        isProcessingImage={isProcessingCutout}
        onGenerate={handleGenerate}
      />

      {/* Mask Editor */}
      {isOpenMaskEditor && productImageUrl && (
        <MaskEditor
          key={handPaintedProductMaskUrl}
          isOpen={isOpenMaskEditor}
          onClose={() => setIsOpenMaskEditor(false)}
          title='Manually Mask Product'
          imageUrl={productImageUrl}
          maskImageUrl={handPaintedProductMaskUrl}
          onSuccess={handleEditProductMaskSuccess}
        />
      )}
    </div>
  );
}
