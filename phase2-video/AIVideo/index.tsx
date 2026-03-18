'use client';

import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil-next';
import { currentToolTypeState } from '@/app/board/[id]/components/ToolPanel/store';
import { ToolType } from '@/app/board/[id]/components/ToolPanel/types';
import type { ModelSelectorModel } from '@/app/board/[id]/components/ToolPanel/types/model';
import { cn } from '@/lib/utils';
import { TextToVideo } from './TextToVideo';
import { ImageToVideo } from './ImageToVideo';
import { VideoEdit } from './VideoEdit';
import { ModelSelector } from '@/app/board/[id]/components/ToolPanel/components/ModelSelector';
import {
  buildInspirationPreset,
  extractS3PathsFromInspiration
} from './helpers/buildInspirationPreset';
import useAwsS3 from '@/hooks/useAwsS3';
import {
  useAiVideoConfigQuery,
  useVideoInspirationDetailQuery
} from './data/useQueries';

import {
  GenerateButtonV2,
  GenerateMode
} from '@/app/board/[id]/components/ToolPanel/components/primitives/GenerateButtonV2';
import { formatCredits } from '@/app/board/[id]/components/ToolPanel/components/primitives/CreditBadge';
import { useActiveTabId } from '@/app/board/[id]/components/ToolPanel/hooks/useActiveTabId';
import { aiVideoFormFamily, AIVideoFormValues } from './store/atoms';
import { useVideoModelConfig } from './hooks/useVideoModelConfig';
import { toast } from '@/hooks/useToast';
import {
  AiVideoTaskInputImage,
  AiVideoTaskSubmitParam,
  EnumAIVideoKeepOriginalSound
} from '@/server/api/services/aiVideo/type';
import { getAIVideoModelCapability } from './helpers/capability';
import { calculateAIVideoCost } from './helpers/pricing';
import {
  normalizePromptToUI,
  normalizePromptToAPI
} from './helpers/promptConverter';
import { useS3Upload } from '@/hooks/useS3Upload';
import { AI_VIDEO_S3_UPLOAD_PREFIX } from './config';
import { useAIVideoTaskGeneration } from './hooks/useAIVideoTaskGeneration';
import { useAIVideoGenerateGuard } from './hooks/useAIVideoGenerateGuard';
import { useViewMode } from '@/app/board/[id]/components/ToolPanel/hooks/useViewMode';
import { usePricingModal } from '@topview/pricing';
import { teamCreditState, teamBenefitInfoState } from '@/store/benefit';
import { checkUserSufficientPermission } from '@/app/avatar-video-creation/utils/permission';
import { RESOURCE_SUBS_TYPE } from '@/types/benefit/resources';
import { SUBS_TYPE } from '@/types/benefit/charge';
import { usePromptHistory } from '@/app/board/[id]/components/ToolPanel/components/PromptHistoryPanel/hooks/usePromptHistory';
import { trackGAEvent } from '@/utils/ga';
import {
  trackCreditConsumptionGenTask,
  CreditConsumingGenTaskType
} from '@/utils/creditGa';
import { useModelIdFromUrl } from '@/app/board/[id]/components/ToolPanel/hooks/useModelIdFromUrl';

const DEBUG_MODE = false;

// AI Video 工具组
const AI_VIDEO_TOOLS = [
  ToolType.ImageToVideo,
  ToolType.TextToVideo,
  ToolType.VideoEdit
] as const;

// 工具名称映射
const TOOL_NAMES = {
  [ToolType.ImageToVideo]: 'Image to Video',
  [ToolType.TextToVideo]: 'Text to Video',
  [ToolType.VideoEdit]: 'Video Edit'
} as const;

export function AIVideo() {
  const searchParams = useSearchParams();
  const setCurrentToolType = useSetRecoilState(currentToolTypeState);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateMode, setGenerateMode] = useState<GenerateMode>();
  const { openPricingModal } = usePricingModal();
  const teamCredit = useRecoilValue(teamCreditState);
  const teamBenefitInfo = useRecoilValue(teamBenefitInfoState);

  const { uploadSmart } = useS3Upload(DEBUG_MODE);
  const { switchToBoard } = useViewMode();
  const { getCdnUrls } = useAwsS3();

  // 使用独立的模块 store，按 tabId 隔离
  const tabId = useActiveTabId();
  const [formValues, setFormValues] = useRecoilState(aiVideoFormFamily(tabId));
  // 从模块 store 获取状态
  const { modelId: currentModelId } = formValues;

  // 使用 useVideoModelConfig 获取模型配置
  const {
    providers: modelSelectorProviders,
    currentModel: currentModelForSelector,
    activeToolType,
    isLoading: isConfigLoading
  } = useVideoModelConfig();

  // 获取模型配置数据（用于 buildInspirationPreset）
  const { data: configData } = useAiVideoConfigQuery();

  // 处理 URL 中的 templateId 参数（从 home 页灵感库跳转过来）
  const templateId = searchParams.get('templateId');
  const templateIdProcessedRef = useRef<string | null>(null);

  // 使用 API 查询灵感详情
  const { data: inspirationData } = useVideoInspirationDetailQuery(templateId, {
    enabled: !!templateId && templateIdProcessedRef.current !== templateId
  });

  // 提取灵感数据，方便依赖数组引用
  const inspirationItem = inspirationData?.data;

  useEffect(() => {
    if (!templateId || templateIdProcessedRef.current === templateId) return;
    if (!inspirationItem) return;

    templateIdProcessedRef.current = templateId;

    // 异步处理灵感回显
    const applyInspirationPreset = async () => {
      try {
        // 提取 S3 路径并获取 CDN URLs
        // 使用 as any 兼容 API 返回类型与本地类型定义的差异
        const { imagePaths, videoPaths } = extractS3PathsFromInspiration(
          inspirationItem as any
        );

        let cdnUrlMap: Record<string, string> = {};
        if (imagePaths.length > 0) {
          const pathMap = imagePaths.reduce(
            (acc, path) => ({ ...acc, [path]: path }),
            {}
          );
          cdnUrlMap = await getCdnUrls(pathMap);
        }

        let videoCdnUrlMap: Record<string, string> = {};
        if (videoPaths.length > 0) {
          const videoPathMap = videoPaths.reduce(
            (acc, path) => ({ ...acc, [path]: path }),
            {}
          );
          videoCdnUrlMap = await getCdnUrls(videoPathMap);
        }

        // 构建预设值
        // 使用 as any 兼容 API 返回类型与本地类型定义的差异
        const { toolType, preset } = buildInspirationPreset({
          item: inspirationItem as any,
          configData: configData?.data,
          cdnUrlMap,
          videoCdnUrlMap
        });

        // 切换工具类型并填充表单
        setCurrentToolType(toolType);
        setFormValues((prev) => ({ ...prev, ...preset }));
      } catch (error) {
        console.error('Failed to apply inspiration preset:', error);
      }
    };

    applyInspirationPreset();
  }, [
    templateId,
    inspirationItem,
    configData?.data,
    getCdnUrls,
    setCurrentToolType,
    setFormValues
  ]);

  // 更新表单值的辅助函数
  const updateFormValues = useCallback(
    (updates: Partial<AIVideoFormValues>) => {
      setFormValues((prev) => ({ ...prev, ...updates }));
    },
    [setFormValues]
  );

  // 任务生成逻辑
  const { generateTasks } = useAIVideoTaskGeneration({
    onSuccess: () => {
      switchToBoard();
    },
    useUnlimitMode: generateMode === GenerateMode.UNLIMITED
  });

  // Prompt 历史记录 hook
  const { savePrompt } = usePromptHistory();

  // 生成限制守卫：集中管理付费状态、Unlimited 权益、并发限制检查
  const {
    isPaidUser,
    hasUnlimitedAccess,
    canGenerate,
    validateAsync: validateGenerate
  } = useAIVideoGenerateGuard({
    formValues,
    toolType: activeToolType
  });

  useEffect(() => {
    setGenerateMode(
      hasUnlimitedAccess ? GenerateMode.UNLIMITED : GenerateMode.CREDIT
    );
  }, [hasUnlimitedAccess, setGenerateMode]);

  // 处理模型切换
  const handleModelSwitch = (
    newModelId: string,
    newModel: ModelSelectorModel
  ) => {
    const updates: Partial<AIVideoFormValues> = {
      modelId: newModelId,
      modelName: newModel.name
    };
    const oldCapability = getAIVideoModelCapability(
      currentModelForSelector as any
    );
    const newCapability = getAIVideoModelCapability(newModel);

    // 根据新模型能力确定 imageMode（仅 ImageToVideo 模式）
    if (activeToolType === ToolType.ImageToVideo) {
      if (newCapability.supportsMultiImage) {
        updates.imageMode = 'multiImage';
      } else if (newCapability.supportsSingleImage) {
        updates.imageMode = 'singleImage';
      } else if (newCapability.supportsStartEndFrame) {
        updates.imageMode = 'startEndFrame';
      }
    }

    // 模型切换时，处理 prompt（仅 ImageToVideo 模式）
    if (activeToolType === ToolType.ImageToVideo) {
      if (
        oldCapability.supportsResourceRefPrompt &&
        !newCapability.supportsResourceRefPrompt
      ) {
        // 从 resourceRefPrompt 模式切换到普通模式：将 @ImageX 转换为普通文本，保存到 i2vPrompt
        const newPrompt = normalizePromptToAPI(formValues.i2vRefToVideoPrompt);
        updates.i2vPrompt = newPrompt;
      }
      // 从普通模式切换到 reference-to-video
      if (
        !oldCapability.supportsResourceRefPrompt &&
        newCapability.supportsResourceRefPrompt
      ) {
        // 将 i2vPrompt 转换为 UI 格式（@ImageX），保存到 i2vRefToVideoPrompt
        const convertedPrompt = normalizePromptToUI(formValues.i2vPrompt || '');
        updates.i2vRefToVideoPrompt = convertedPrompt;
      }
    }

    // Image to Video 模式下，处理模型切换带来的参数变化
    if (activeToolType === ToolType.ImageToVideo) {
      // 处理图片数量超限 (MultiImage 模式)
      if (newCapability.supportsMultiImage) {
        const maxCount = newCapability.maxRefImageCount;
        if (formValues.referenceImages.length > maxCount) {
          updates.referenceImages = formValues.referenceImages.slice(
            0,
            maxCount
          );
          toast.warning(
            `Model change: Reference images limited to ${maxCount}`
          );
        }
      }

      // 处理 inputImageMode 变化时的字段同步逻辑
      // 场景：从 StartEndFrame 切换到 SingleImage，保留首帧
      if (
        oldCapability.supportsStartEndFrame &&
        newCapability.supportsSingleImage
      ) {
        if (!formValues.firstFrameImage && formValues.lastFrameImage) {
          updates.firstFrameImage = formValues.lastFrameImage;
        }
      }
      // 场景：从 MultiImage 切换到 SingleImage，取第一张图作为首帧
      if (
        oldCapability.supportsMultiImage &&
        newCapability.supportsSingleImage
      ) {
        if (
          !formValues.firstFrameImage &&
          formValues.referenceImages.length > 0
        ) {
          updates.firstFrameImage = formValues.referenceImages[0];
        }
      }
      // 场景：从 SingleImage/StartEndFrame 切换到 MultiImage，将已有图片加入参考图列表
      if (
        !oldCapability.supportsMultiImage &&
        newCapability.supportsMultiImage
      ) {
        const newRefImages = [...formValues.referenceImages];
        if (
          formValues.firstFrameImage &&
          !newRefImages.includes(formValues.firstFrameImage)
        ) {
          newRefImages.unshift(formValues.firstFrameImage);
        }
        if (
          formValues.lastFrameImage &&
          !newRefImages.includes(formValues.lastFrameImage)
        ) {
          newRefImages.push(formValues.lastFrameImage);
        }
        updates.referenceImages = newRefImages.slice(
          0,
          newCapability.maxRefImageCount
        );
      }

      // 统一更新表单值
      updateFormValues(updates);
    } else {
      // 非 I2V 模式，仅更新模型 ID
      updateFormValues({ modelId: newModelId });
    }
  };

  // URL 参数中的 model-id 读取 hook
  const { consumeModelIdFromUrl } = useModelIdFromUrl();

  // 当模型为空或模型不在当前 providers 中时，自动选择第一个模型
  // 支持通过 URL 参数 model-id 指定初始模型
  useEffect(() => {
    if (!isConfigLoading && modelSelectorProviders.length > 0) {
      // 辅助函数：在 providers 中查找模型
      const findModelInProviders = (modelId: string) => {
        for (const provider of modelSelectorProviders) {
          const model = provider.models.find((m) => m.id === modelId);
          if (model) return model;
        }
        return null;
      };

      // 情况1: 没有选中模型，尝试从 URL 获取或自动选择第一个
      if (!currentModelId) {
        // 优先使用 URL 中的 model-id
        const urlModelId = consumeModelIdFromUrl();
        if (urlModelId) {
          const urlModel = findModelInProviders(urlModelId);
          if (urlModel) {
            handleModelSwitch(urlModel.id, urlModel);
            console.log(
              `✅ [${activeToolType}] Initialized model from URL: ${urlModel.id} (${urlModel.name})`
            );
            return;
          }
          console.warn(
            `⚠️ [${activeToolType}] URL model-id "${urlModelId}" not found in providers`
          );
        }

        // 回退：选择第一个模型
        handleModelSwitch(
          modelSelectorProviders[0].models[0].id,
          modelSelectorProviders[0].models[0]
        );
        return;
      }

      // 情况2: 有选中模型，但不在当前 providers 中（工具切换导致）
      // 检查当前模型是否在新的 providers 中存在
      const modelExists = modelSelectorProviders.some((provider) =>
        provider.models.some((m) => m.id === currentModelId)
      );

      if (!modelExists) {
        // 模型不存在于新的 providers 中，自动选择第一个可用模型
        handleModelSwitch(
          modelSelectorProviders[0].models[0].id,
          modelSelectorProviders[0].models[0]
        );
      }
    }
  }, [
    isConfigLoading,
    modelSelectorProviders,
    currentModelId,
    handleModelSwitch,
    consumeModelIdFromUrl,
    activeToolType
  ]);

  // 计算积分成本（根据模型 pricing 配置和用户选择的参数）
  const { totalCost: totalCostValue } = calculateAIVideoCost(
    currentModelForSelector,
    formValues
  );

  // 权限是否满足（模板最低订阅档位 + 积分）
  const isSufficientPermission = useMemo(
    () =>
      checkUserSufficientPermission({
        minSubsType: RESOURCE_SUBS_TYPE.FREE,
        creditConsumed: totalCostValue,
        userSubsType: (teamBenefitInfo?.subsType ?? '') as SUBS_TYPE,
        teamCredit
      }),
    [totalCostValue, teamBenefitInfo?.subsType, teamCredit]
  );

  const formatTaskCount = (count: number): string => {
    return count === 1 ? '1 task' : `${count} tasks`;
  };

  // 提交 ai-video 任务
  const handleGenerate = async () => {
    // 立即设置 loading 状态，提升用户感知体验
    setIsGenerating(true);

    try {
      // 检查积分权限
      if (!isSufficientPermission) {
        openPricingModal();
        return;
      }

      // 使用统一的验证函数检查生成限制（会先刷新并发数据获取最新状态）
      const validation = await validateGenerate();
      if (!validation.valid) {
        toast.error({
          title: validation.reason,
          description: validation.description
        });
        return;
      }

      const requestedTaskCount = formValues.generatingCount || 1;
      const allowedTaskCount =
        validation.allowedTaskCount ?? requestedTaskCount;
      const blockedTaskCount = validation.blockedTaskCount ?? 0;

      if (allowedTaskCount <= 0) {
        return;
      }
      // 使用能力判定工具获取当前模型能力
      const capability = getAIVideoModelCapability(currentModelForSelector);

      // 构造提交参数
      const resolutionNum = parseInt(
        formValues.resolution?.replace(/\D/g, '') || '720'
      );

      // 处理输入图片
      // 注意这里的图片来源包含了本地上传的图片（blob url）以及从 board 拖拽过来的图片(http url)
      const inputImages: AiVideoTaskInputImage[] = [];
      const refImagesForSubmit = {
        [ToolType.VideoEdit]: formValues.veReferenceImages,
        [ToolType.ImageToVideo]: formValues.referenceImages,
        [ToolType.TextToVideo]: []
      }[activeToolType];

      // 统一上传配置
      const uploadOptions = { pathPrefix: AI_VIDEO_S3_UPLOAD_PREFIX };

      if (capability.supportsSingleImage) {
        // 检查是否必须提供图片
        if (!formValues.firstFrameImage && !capability.isInputImagesOptional) {
          throw new Error('Please select a first frame image');
        }
        if (formValues.firstFrameImage) {
          const [s3Path, err] = await uploadSmart(
            formValues.firstFrameImage,
            uploadOptions
          );
          if (err || !s3Path)
            throw new Error('Failed to upload first frame image');
          inputImages.push({ inputImageS3Path: s3Path, name: 'firstFrame' });
        }
      } else if (capability.supportsStartEndFrame) {
        // 检查是否必须提供图片
        if (!formValues.firstFrameImage && !capability.isInputImagesOptional) {
          throw new Error('Please select a first frame image');
        }
        if (formValues.firstFrameImage) {
          const [firstS3Path, firstErr] = await uploadSmart(
            formValues.firstFrameImage,
            uploadOptions
          );
          if (firstErr || !firstS3Path)
            throw new Error('Failed to upload first frame image');
          inputImages.push({
            inputImageS3Path: firstS3Path,
            name: 'firstFrame'
          });

          if (formValues.lastFrameImage) {
            const [lastS3Path, lastErr] = await uploadSmart(
              formValues.lastFrameImage,
              uploadOptions
            );
            if (lastS3Path) {
              inputImages.push({
                inputImageS3Path: lastS3Path,
                name: 'lastFrame'
              });
            }
          }
        }
      } else if (capability.supportsMultiImage) {
        // 检查是否必须提供图片
        if (!refImagesForSubmit.length && !capability.isInputImagesOptional) {
          throw new Error('Please select at least one reference image');
        }
        for (const image of refImagesForSubmit) {
          const [s3Path, err] = await uploadSmart(image, uploadOptions);
          if (s3Path) {
            inputImages.push({
              inputImageS3Path: s3Path,
              name: 'referenceImage'
            });
          }
        }
      }

      const positivePrompt = capability.supportsResourceRefPrompt
        ? normalizePromptToAPI(
            activeToolType === ToolType.VideoEdit
              ? formValues.veRefToVideoPrompt
              : formValues.i2vRefToVideoPrompt
          )
        : activeToolType === ToolType.ImageToVideo
          ? formValues.i2vPrompt
          : formValues.prompt;
      const negativePrompt = capability.supportsNegativePrompt
        ? formValues.negativePrompt
        : undefined;

      const submitParams: AiVideoTaskSubmitParam = {
        taskType: {
          [ToolType.TextToVideo]: 'textToVideo',
          [ToolType.ImageToVideo]: 'imageToVideo',
          [ToolType.VideoEdit]: 'videoEdit'
        }[activeToolType],
        modelId: currentModelId,
        modelName: formValues.modelName,
        positivePrompt: positivePrompt,
        negativePrompt: negativePrompt,
        aspectRatio: capability.supportsRatio
          ? formValues.aspectRatio
          : undefined,
        duration: capability.supportsDuration ? formValues.duration : undefined,
        resolution: capability.supportsResolution ? resolutionNum : undefined,
        inputImages: inputImages.length > 0 ? inputImages : undefined,
        imageMode: formValues.imageMode,
        generatingCount: allowedTaskCount,
        sound: capability.supportsNativeAudio
          ? formValues.nativeAudio
            ? 'on'
            : 'off'
          : undefined,
        keepOriginalSound: capability.supportsKeepVideoSound
          ? formValues.keepVideoSound
            ? EnumAIVideoKeepOriginalSound.YES
            : EnumAIVideoKeepOriginalSound.NO
          : undefined,
        ...(activeToolType === ToolType.VideoEdit && {
          referType: formValues.videoEditMode,
          duration: formValues.uploadedVideoDuration
        })
      };

      if (activeToolType === ToolType.VideoEdit) {
        const [s3Path, err] = await uploadSmart(
          formValues.uploadedVideo || '',
          uploadOptions
        );
        if (err || !s3Path) {
          throw new Error('Failed to upload source video');
        }
        submitParams.videoPath = s3Path;
      }

      if (DEBUG_MODE) {
        console.log('formValues for debug', formValues);
        console.log('submitParams for debug', submitParams);
        toast.info({ title: 'Debug mode: Parameters printed to console' });
      } else {
        await generateTasks(submitParams, activeToolType);

        // 保存 prompt 到历史记录
        if (positivePrompt) {
          savePrompt(positivePrompt, activeToolType);
        }
        // 埋点上报：GA 事件
        trackGAEvent(
          'gen.aiCreation',
          'aivideo.generate',
          Object.values(submitParams).join('|')
        );

        // 埋点上报：积分消费（仅在非 Unlimited 模式时上报）
        if (
          !(generateMode === GenerateMode.UNLIMITED && hasUnlimitedAccess) &&
          totalCostValue > 0
        ) {
          trackCreditConsumptionGenTask({
            type: CreditConsumingGenTaskType.AI_VIDEO_CREATION_PAGE,
            creditConsumed: +formatCredits(totalCostValue)
          });
        }

        if (blockedTaskCount > 0) {
          toast.warning({
            title: `${formatTaskCount(allowedTaskCount)} started. ${formatTaskCount(blockedTaskCount)} couldn't be queued due to your concurrency limit.`,
            description: 'Upgrade to run more tasks at once.'
          });
        }
      }
    } catch (error: any) {
      toast.error({
        title: 'Failed to submit task',
        description: error?.message || 'Unknown error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className='flex h-full w-full flex-col'>
      {/* 工具切换标签 */}
      <div className='flex items-center gap-2 border-b border-white/5 px-4 py-2'>
        {AI_VIDEO_TOOLS.map((tool) => {
          const isActive = tool === activeToolType;
          return (
            <button
              key={tool}
              onClick={() => setCurrentToolType(tool)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm transition-all duration-150',
                isActive
                  ? 'bg-white/5 text-white'
                  : 'text-white/50 hover:bg-white/5 hover:text-white'
              )}
            >
              {TOOL_NAMES[tool]}
            </button>
          );
        })}
      </div>

      {/* 工具表单内容 */}
      <div className='flex-1 space-y-4 overflow-y-auto p-4 custom-scrollbar'>
        {/* Model Selector */}
        {isConfigLoading ? (
          <div className='h-10 w-full animate-pulse rounded-lg bg-white/5' />
        ) : (
          modelSelectorProviders.length > 0 && (
            <ModelSelector
              providers={modelSelectorProviders}
              currentModel={currentModelForSelector}
              currentModelId={currentModelId || ''}
              onModelSwitch={handleModelSwitch}
            />
          )
        )}

        {/* 工具表单 */}
        {activeToolType === ToolType.ImageToVideo && <ImageToVideo />}

        {activeToolType === ToolType.TextToVideo && <TextToVideo />}

        {activeToolType === ToolType.VideoEdit && <VideoEdit />}
      </div>

      {/* Generate Button */}
      <GenerateButtonV2
        disabled={!canGenerate}
        isLoading={isGenerating}
        loadingText='Generating...'
        credits={totalCostValue}
        creditsDisplay={formatCredits(totalCostValue)}
        isPaidUser={isPaidUser}
        hasUnlimitedAccess={hasUnlimitedAccess}
        mode={generateMode}
        onGenerate={handleGenerate}
        onModeChange={setGenerateMode}
        onUpgradeClick={() => openPricingModal()}
        className='px-4 pb-4'
      />
    </div>
  );
}
