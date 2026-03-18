/**
 * 灵感库回显数据构建工具
 * 纯函数，不依赖任何 Hook，可在任何环境中使用
 */

import { ToolType } from '@/app/board/[id]/components/ToolPanel/types';
import {
  AIVideoEditMode,
  AIVideoImageMode
} from '@/app/board/[id]/components/ToolPanel/types/model';
import { EnumAIVideoKeepOriginalSound } from '@/server/api/services/aiVideo/type';
import { VideoInspirationItem } from '@/server/api/services/common/inspiration/type';
import { AIVideoFormValues } from '../store/atoms';
import { getAIVideoModelCapability } from './capability';

/**
 * 将 taskType 转换为 ToolType
 */
export const taskTypeToToolType = (taskType: string): ToolType => {
  switch (taskType) {
    case 'imageToVideo':
      return ToolType.ImageToVideo;
    case 'textToVideo':
      return ToolType.TextToVideo;
    case 'videoEdit':
      return ToolType.VideoEdit;
    default:
      return ToolType.ImageToVideo;
  }
};

/**
 * 模型配置数据类型（简化版，仅用于查找模型）
 */
interface ModelProvider {
  models?: Array<{ id: string; [key: string]: unknown }>;
}

interface AIVideoConfigData {
  imageToVideo: ModelProvider[];
  textToVideo: ModelProvider[];
  videoEdit: ModelProvider[];
}

/**
 * 从配置数据中查找模型
 */
export const findModelFromConfig = (
  configData: AIVideoConfigData | null | undefined,
  modelId: string
) => {
  if (!configData) return undefined;

  const { imageToVideo, textToVideo, videoEdit } = configData;
  const allProviders = [...imageToVideo, ...textToVideo, ...videoEdit];

  for (const provider of allProviders) {
    const model = provider.models?.find((m) => m.id === modelId);
    if (model) {
      return model;
    }
  }

  return undefined;
};

/**
 * 构建灵感回显参数的输入
 */
export interface BuildInspirationPresetInput {
  /** 灵感项数据 */
  item: VideoInspirationItem;
  /** 模型配置数据（用于判断模型能力） */
  configData?: AIVideoConfigData | null;
  /** CDN URL 映射表（S3 路径 -> CDN URL） */
  cdnUrlMap: Record<string, string>;
  /** 视频 CDN URL 映射表（用于 VideoEdit） */
  videoCdnUrlMap?: Record<string, string>;
}

/**
 * 构建灵感回显参数的输出
 */
export interface BuildInspirationPresetOutput {
  /** 目标工具类型 */
  toolType: ToolType;
  /** 表单预设值 */
  preset: Partial<AIVideoFormValues>;
}

/**
 * 构建灵感回显的表单预设值
 *
 * 纯函数，根据灵感项数据和模型能力，构建对应工具的表单预设值。
 * 不依赖任何 Hook，可在组件、工具函数、服务端等任何环境中使用。
 *
 * @example
 * ```ts
 * // 在组件中使用（需要先获取 cdnUrlMap）
 * const cdnUrlMap = await getCdnUrls(pathMap);
 * const { toolType, preset } = buildInspirationPreset({
 *   item,
 *   configData: configData?.data,
 *   cdnUrlMap
 * });
 * setCurrentToolType(toolType);
 * setAIVideoForm(preset);
 *
 * // 在非 hook 环境中使用
 * const { toolType, preset } = buildInspirationPreset({
 *   item,
 *   configData,
 *   cdnUrlMap: precomputedCdnUrlMap
 * });
 * ```
 */
export const buildInspirationPreset = ({
  item,
  configData,
  cdnUrlMap,
  videoCdnUrlMap = {}
}: BuildInspirationPresetInput): BuildInspirationPresetOutput => {
  const toolType = taskTypeToToolType(item.taskType);
  const modelId = item.model;
  const itemTaskResult = item.taskResults?.[0];

  // 1. 获取模型能力
  const targetModel = findModelFromConfig(configData, modelId);
  const capability = getAIVideoModelCapability(targetModel as any);

  // 2. 获取参考图片路径
  const inputImages = itemTaskResult?.inputImages || [];
  const imgS3Paths = inputImages
    .map((img) => img.inputImageS3Path)
    .filter(Boolean) as string[];

  // 辅助函数：获取 CDN URL
  const getCdnUrl = (s3Path?: string) => (s3Path && cdnUrlMap[s3Path]) || null;

  // 3. 处理通用参数
  const preset: Partial<AIVideoFormValues> = {
    modelId,
    aspectRatio: itemTaskResult?.aspectRatio,
    resolution: itemTaskResult?.resolution
      ? itemTaskResult.resolution.toString()
      : undefined,
    duration: itemTaskResult?.duration,
    generatingCount: itemTaskResult?.generatingCount || 1
  };

  // 4. 根据工具类型处理特定参数
  if (toolType === ToolType.ImageToVideo) {
    // 优先使用灵感数据中记录的 imageMode，其次根据模型能力判断
    const recordedImageMode = itemTaskResult?.imageMode as
      | AIVideoImageMode
      | undefined;

    // 判断是否使用 Reference to Video 模式（prompt 包含 <<<image_X>>> 格式）
    const isRefToVideoPrompt =
      capability.supportsResourceRefPrompt ||
      /<<<image_\d+>>>/.test(item.prompt || '');

    if (isRefToVideoPrompt) {
      // Reference to Video 模式（多图 + 特殊 prompt）
      preset.referenceImages = imgS3Paths
        .map((path) => cdnUrlMap[path])
        .filter(Boolean);
      preset.i2vRefToVideoPrompt = item.prompt;
      preset.imageMode = AIVideoImageMode.MULTI_IMAGE;
    } else {
      // 普通模式：使用 i2vPrompt
      preset.i2vPrompt = item.prompt;

      // 根据记录的 imageMode 或模型能力设置图片
      if (
        recordedImageMode === AIVideoImageMode.START_END_FRAME ||
        capability.supportsStartEndFrame
      ) {
        // 首尾帧模式
        preset.firstFrameImage = getCdnUrl(inputImages[0]?.inputImageS3Path);
        preset.lastFrameImage = getCdnUrl(inputImages[1]?.inputImageS3Path);
        preset.imageMode = AIVideoImageMode.START_END_FRAME;
      } else if (
        recordedImageMode === AIVideoImageMode.MULTI_IMAGE ||
        capability.supportsMultiImage
      ) {
        // 多图模式
        preset.referenceImages = imgS3Paths
          .map((path) => cdnUrlMap[path])
          .filter(Boolean);
        preset.imageMode = AIVideoImageMode.MULTI_IMAGE;
      } else {
        // 单图模式 (默认)
        preset.firstFrameImage = getCdnUrl(inputImages[0]?.inputImageS3Path);
        preset.imageMode = AIVideoImageMode.SINGLE_IMAGE;
      }
    }
  } else if (toolType === ToolType.TextToVideo) {
    // TextToVideo 使用 prompt 字段
    preset.prompt = item.prompt;
  } else if (toolType === ToolType.VideoEdit) {
    // 处理 VideoEdit 回显
    const videoS3Key = itemTaskResult?.videoPath;
    if (videoS3Key) {
      preset.uploadedVideo = videoCdnUrlMap[videoS3Key] || undefined;
    }

    // 处理参考图片和 prompt
    if (imgS3Paths.length > 0) {
      preset.veReferenceImages = imgS3Paths
        .map((path) => cdnUrlMap[path])
        .filter(Boolean);
    }
    preset.veRefToVideoPrompt = item.prompt;

    // VideoEdit 特有参数
    preset.videoEditMode = itemTaskResult?.referType || AIVideoEditMode.BASE;
    preset.keepVideoSound =
      itemTaskResult?.keepOriginalSound === EnumAIVideoKeepOriginalSound.YES;
  }

  return { toolType, preset };
};

/**
 * 提取灵感项中需要获取 CDN URL 的 S3 路径
 *
 * 用于在调用 buildInspirationPreset 之前，批量获取所需的 CDN URLs
 *
 * @example
 * ```ts
 * const { imagePaths, videoPaths } = extractS3PathsFromInspiration(item);
 * const cdnUrlMap = await getCdnUrls(imagePaths.reduce((acc, p) => ({ ...acc, [p]: p }), {}));
 * const videoCdnUrlMap = videoPaths.length > 0
 *   ? await getCdnUrls(videoPaths.reduce((acc, p) => ({ ...acc, [p]: p }), {}))
 *   : {};
 * ```
 */
export const extractS3PathsFromInspiration = (
  item: VideoInspirationItem
): { imagePaths: string[]; videoPaths: string[] } => {
  const itemTaskResult = item.taskResults?.[0];
  const inputImages = itemTaskResult?.inputImages || [];

  const imagePaths = inputImages
    .map((img) => img.inputImageS3Path)
    .filter(Boolean) as string[];

  const videoPaths: string[] = [];
  const videoS3Key = itemTaskResult?.videoPath;
  if (videoS3Key) {
    videoPaths.push(videoS3Key);
  }

  return { imagePaths, videoPaths };
};
