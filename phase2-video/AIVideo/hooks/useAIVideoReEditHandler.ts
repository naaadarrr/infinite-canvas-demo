/**
 * AIVideo Re-edit 处理 Hook
 * 将 task.parameters 映射为 AIVideoFormValues
 * 只设置 path 字段，URL 由各上传组件自己获取
 */

import { useRecoilCallback } from 'recoil-next';
import { activeTabIdState } from '@/app/board/[id]/components/ToolPanel/store';
import type { TaskParameters } from '@/server/api/services/board/common';
import type {
  AiVideoTaskInputImage,
  AiVideoTaskSubmitParam
} from '@/server/api/services/aiVideo/type';
import { EnumAIVideoKeepOriginalSound } from '@/server/api/services/aiVideo/type';
import useAwsS3 from '@/hooks/useAwsS3';
import { normalizePromptToUI } from '../helpers/promptConverter';
import {
  aiVideoFormFamily,
  DEFAULT_AI_VIDEO_VALUES,
  type AIVideoFormValues
} from '../store/atoms';

/**
 * AIVideo 任务参数类型（task.parameters 的精确定义）
 */
interface AIVideoTaskParameters
  extends TaskParameters, AiVideoTaskSubmitParam {}

const getImagePath = (image?: AiVideoTaskInputImage): string | null => {
  if (!image) return null;
  return image.inputImageS3Path || image.inputImageResourceId || null;
};

const getNamedImagePaths = (
  inputImages: AiVideoTaskInputImage[] | undefined,
  name: string
): string[] => {
  if (!inputImages?.length) return [];
  return inputImages
    .filter((img) => img.name === name)
    .map((img) => getImagePath(img))
    .filter((path): path is string => Boolean(path));
};

const getResolutionValue = (resolution?: number): string | undefined => {
  if (!resolution) return undefined;
  return `${resolution}p`;
};

const buildCommonValues = (
  params: AIVideoTaskParameters
): Partial<AIVideoFormValues> => {
  const positivePrompt = params.positivePrompt ?? '';
  return {
    modelId: params.modelId ?? DEFAULT_AI_VIDEO_VALUES.modelId,
    prompt: positivePrompt,
    negativePrompt:
      params.negativePrompt ?? DEFAULT_AI_VIDEO_VALUES.negativePrompt,
    aspectRatio: params.aspectRatio ?? DEFAULT_AI_VIDEO_VALUES.aspectRatio,
    duration: params.duration ?? DEFAULT_AI_VIDEO_VALUES.duration,
    generatingCount:
      params.generatingCount ?? DEFAULT_AI_VIDEO_VALUES.generatingCount,
    resolution:
      getResolutionValue(params.resolution) ??
      DEFAULT_AI_VIDEO_VALUES.resolution,
    nativeAudio:
      params.sound !== undefined
        ? params.sound === 'on'
        : DEFAULT_AI_VIDEO_VALUES.nativeAudio,
    keepVideoSound:
      params.keepOriginalSound !== undefined
        ? params.keepOriginalSound === EnumAIVideoKeepOriginalSound.YES
        : DEFAULT_AI_VIDEO_VALUES.keepVideoSound
  };
};

const buildImageToVideoInputs = (params: AIVideoTaskParameters) => {
  const inputImages = params.inputImages ?? [];
  const firstFrame = getImagePath(
    inputImages.find((img) => img.name === 'firstFrame')
  );
  const lastFrame = getImagePath(
    inputImages.find((img) => img.name === 'lastFrame')
  );
  const referenceImages = getNamedImagePaths(inputImages, 'referenceImage');

  const imageMode = params.imageMode;
  if (imageMode === 'startEndFrame') {
    return {
      firstFrameImage: firstFrame,
      lastFrameImage: lastFrame,
      referenceImages: [],
      imageMode: imageMode
    };
  }

  if (imageMode === 'singleImage') {
    return {
      firstFrameImage: firstFrame ?? referenceImages[0] ?? null,
      lastFrameImage: null,
      referenceImages: [],
      imageMode: imageMode
    };
  }

  if (imageMode === 'multiImage') {
    return {
      firstFrameImage: null,
      lastFrameImage: null,
      referenceImages: referenceImages,
      imageMode: imageMode
    };
  }

  if (firstFrame || lastFrame) {
    return {
      firstFrameImage: firstFrame,
      lastFrameImage: lastFrame,
      referenceImages: []
    };
  }

  return {
    firstFrameImage: null,
    lastFrameImage: null,
    referenceImages: referenceImages
  };
};

const buildCdnUrlGetter = (
  getCdnUrls: (
    pathMap: Record<string, string>
  ) => Promise<Record<string, string>>
) => {
  return async (path?: string | null) => {
    if (!path) return null;
    const urlMap = await getCdnUrls({ target: path });
    return urlMap.target ?? path;
  };
};

const buildCdnUrlListGetter = (
  getCdnUrls: (
    pathMap: Record<string, string>
  ) => Promise<Record<string, string>>
) => {
  return async (paths: string[]) => {
    if (!paths.length) return [];
    const pathMap: Record<string, string> = {};
    paths.forEach((path, index) => {
      if (path) {
        pathMap[`path_${index}`] = path;
      }
    });
    const urlMap = await getCdnUrls(pathMap);
    return paths.map((path, index) => urlMap[`path_${index}`] ?? path);
  };
};

export function useImageToVideoReEditHandler() {
  const { getCdnUrls } = useAwsS3();
  const getCdnUrl = buildCdnUrlGetter(getCdnUrls);
  const getCdnUrlsForList = buildCdnUrlListGetter(getCdnUrls);

  return useRecoilCallback(
    ({ snapshot, set }) =>
      async (parameters: TaskParameters) => {
        const activeTabId = snapshot.getLoadable(activeTabIdState).getValue();
        if (!activeTabId) return;

        const params = parameters as AIVideoTaskParameters;
        const positivePrompt = params.positivePrompt ?? '';
        const imageInputs = buildImageToVideoInputs(params);
        const firstFrameUrl = await getCdnUrl(imageInputs.firstFrameImage);
        const lastFrameUrl = await getCdnUrl(imageInputs.lastFrameImage);
        const referenceImageUrls = await getCdnUrlsForList(
          imageInputs.referenceImages ?? []
        );
        const formValues: AIVideoFormValues = {
          ...DEFAULT_AI_VIDEO_VALUES,
          ...buildCommonValues(params),
          taskType: params.taskType || 'imageToVideo',
          i2vPrompt: positivePrompt,
          i2vRefToVideoPrompt: normalizePromptToUI(positivePrompt),
          ...imageInputs,
          firstFrameImage: firstFrameUrl,
          lastFrameImage: lastFrameUrl,
          referenceImages: referenceImageUrls
        };

        set(aiVideoFormFamily(activeTabId), formValues);
      },
    []
  );
}

export function useTextToVideoReEditHandler() {
  return useRecoilCallback(
    ({ snapshot, set }) =>
      async (parameters: TaskParameters) => {
        const activeTabId = snapshot.getLoadable(activeTabIdState).getValue();
        if (!activeTabId) return;

        const params = parameters as AIVideoTaskParameters;
        const positivePrompt = params.positivePrompt ?? '';
        const formValues: AIVideoFormValues = {
          ...DEFAULT_AI_VIDEO_VALUES,
          ...buildCommonValues(params),
          taskType: params.taskType || 'textToVideo',
          prompt: positivePrompt
        };

        set(aiVideoFormFamily(activeTabId), formValues);
      },
    []
  );
}

export function useVideoEditReEditHandler() {
  const { getCdnUrls } = useAwsS3();
  const getCdnUrl = buildCdnUrlGetter(getCdnUrls);
  const getCdnUrlsForList = buildCdnUrlListGetter(getCdnUrls);

  return useRecoilCallback(
    ({ snapshot, set }) =>
      async (parameters: TaskParameters) => {
        const activeTabId = snapshot.getLoadable(activeTabIdState).getValue();
        if (!activeTabId) return;

        const params = parameters as AIVideoTaskParameters;
        const positivePrompt = params.positivePrompt ?? '';
        const uploadedVideoUrl = await getCdnUrl(params.videoPath);
        const referenceImageUrls = await getCdnUrlsForList(
          getNamedImagePaths(params.inputImages, 'referenceImage')
        );
        const formValues: AIVideoFormValues = {
          ...DEFAULT_AI_VIDEO_VALUES,
          ...buildCommonValues(params),
          taskType: params.taskType || 'videoEdit',
          uploadedVideo: uploadedVideoUrl ?? undefined,
          veReferenceImages: referenceImageUrls,
          veRefToVideoPrompt: normalizePromptToUI(positivePrompt),
          videoEditMode:
            params.referType ?? DEFAULT_AI_VIDEO_VALUES.videoEditMode
        };

        set(aiVideoFormFamily(activeTabId), formValues);
      },
    []
  );
}
