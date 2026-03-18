/**
 * AIVideo 模块独立 Store
 * 包含 ImageToVideo、TextToVideo、VideoEdit 三个子工具的表单状态
 */

import { atomFamily } from 'recoil-next';
import { AspectRatio } from '../../../../types';
import { AiVideoTaskSubmitParam } from '@/server/api/services/aiVideo/type';

/**
 * AIVideo 表单值类型 - 继承自 API 提交参数，并扩展 UI 独有状态
 */
export interface AIVideoFormValues extends Omit<
  AiVideoTaskSubmitParam,
  'positivePrompt' | 'resolution' | 'sound' | 'keepOriginalSound'
> {
  // ========== 基础参数 ==========
  /**
   * 正面提示词 (UI 对应 API 的 positivePrompt)
   * 在提交时，如果支持资源引用提示词，则使用 i2vRefToVideoPrompt，否则使用 prompt
   */
  prompt: string;

  // ========== UI 独有状态 ==========
  /** 分辨率 (UI 使用字符串格式如 "1080p"，API 使用数字如 1080) */
  resolution: string;
  /** 是否生成原生音频 (UI 使用布尔值，API 对应 sound: "on" | "off") */
  nativeAudio: boolean;
  /** 是否保持视频原声 (UI 使用布尔值，API 对应 keepOriginalSound: "yes" | "no") */
  keepVideoSound: boolean;

  // ========== 扩展参数 (API 中未定义或需要 UI 转换的) ==========
  /** 首帧图片 URL (ImageToVideo) */
  firstFrameImage?: string | null;
  /** 尾帧图片 URL (ImageToVideo) */
  lastFrameImage?: string | null;
  /** 参考图片列表 */
  referenceImages: string[];
  /** 参考视频 URL (VideoEdit) */
  referenceVideo?: string | null;

  /** 参考视频模式下的 prompt（含 @ImageX 格式）*/
  i2vRefToVideoPrompt: string;
  /** ImageToVideo 普通模式下的 prompt（与 TextToVideo 的 prompt 分离）*/
  i2vPrompt: string;

  /** 上传的视频（用于编辑）*/
  uploadedVideo?: string;
  /** 上传视频的时长（秒，用于 Video Edit 按秒计费）*/
  uploadedVideoDuration?: number;
  /** VE 参考图片列表 */
  veReferenceImages: string[];
  /** VE 参考视频模式下的 prompt */
  veRefToVideoPrompt: string;
  /** 视频编辑模式 */
  videoEditMode: string;

  /** 随机种子 */
  seed?: number;
  /** 运动强度 */
  motionIntensity?: number;

  /** 是否已增强提示词 */
  isPromptEnhanced: boolean;
  /** 原始提示词（增强前） */
  originalPrompt?: string;
}

/**
 * 默认值
 */
export const DEFAULT_AI_VIDEO_VALUES: AIVideoFormValues = {
  // 基础参数 (from AiVideoTaskSubmitParam)
  taskType: 'imageToVideo',
  modelId: '',
  aspectRatio: AspectRatio.SIXTEEN_TO_NINE,
  duration: 5,
  generatingCount: 1,

  // UI 转换后的基础参数
  prompt: '',
  negativePrompt: '',

  // UI 独有状态
  resolution: '1080p',
  nativeAudio: true,
  keepVideoSound: true,

  // 参考媒体
  firstFrameImage: null,
  lastFrameImage: null,
  referenceImages: [],
  referenceVideo: null,

  // Image to Video 特有
  i2vRefToVideoPrompt: '',
  i2vPrompt: '',

  // Video Edit 特有
  uploadedVideo: undefined,
  uploadedVideoDuration: undefined,
  veReferenceImages: [],
  veRefToVideoPrompt: '',
  videoEditMode: 'edit',

  // 高级参数
  seed: undefined,
  motionIntensity: 50,

  // 提示词增强
  isPromptEnhanced: false,
  originalPrompt: undefined
};

/**
 * 按 TabId 隔离的 AIVideo 表单状态
 */
export const aiVideoFormFamily = atomFamily<AIVideoFormValues, string>({
  key: 'aiVideoForm',
  default: DEFAULT_AI_VIDEO_VALUES
});
