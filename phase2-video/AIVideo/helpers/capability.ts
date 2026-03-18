import {
  AIPromptSupport,
  AIVideoImageMode,
  ModelSelectorModel
} from '@/app/board/[id]/components/ToolPanel/types/model';

/**
 * 纯工具函数：判定 AIVideo 模型的能力
 * 供 Hook 和纯函数（如计费逻辑）共同使用
 */
export const getAIVideoModelCapability = (
  model: ModelSelectorModel | null | undefined
) => {
  const parameters = model?.parameters;

  return {
    supportsResolution: !!(
      parameters?.resolutions && parameters.resolutions.length > 0
    ),
    supportsDuration: !!(
      parameters?.durations && parameters.durations.length > 0
    ),
    supportsRatio: !!(parameters?.ratios && parameters.ratios.length > 0),
    supportsNativeAudio: !!parameters?.nativeAudio,
    supportsKeepVideoSound: !!parameters?.keepVideoSound,
    // 这里的 enableSwitchPromptEnhancement 对应 AIPromptSupport.ENHANCEMENT
    supportsPromptEnhancement: !!parameters?.promptSupport?.includes(
      AIPromptSupport.ENHANCEMENT
    ),
    supportsPositivePrompt: !!parameters?.promptSupport?.includes(
      AIPromptSupport.POSITIVE
    ),
    supportsResourceRefPrompt: !!parameters?.promptSupport?.includes(
      AIPromptSupport.SUPPORT_REF_PROMPT
    ),
    supportsNegativePrompt: !!parameters?.promptSupport?.includes(
      AIPromptSupport.NEGATIVE
    ),
    supportsVideoEditMode: !!(
      parameters?.videoEditMode && parameters.videoEditMode.length > 0
    ),
    supportsInputVideo: !!parameters?.inputVideoMode,
    // 补充图片输入模式判断
    supportsSingleImage:
      parameters?.inputImageMode === AIVideoImageMode.SINGLE_IMAGE,
    supportsStartEndFrame:
      parameters?.inputImageMode === AIVideoImageMode.START_END_FRAME,
    supportsMultiImage:
      parameters?.inputImageMode === AIVideoImageMode.MULTI_IMAGE,
    isInputImagesOptional: !!parameters?.imageOptional,
    maxRefImageCount:
      parameters?.maxRefImageCount ??
      (parameters?.inputImageMode === AIVideoImageMode.MULTI_IMAGE ? 7 : 1)
  };
};
