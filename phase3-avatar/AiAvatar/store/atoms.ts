/**
 * AiAvatar 模块独立 Store
 * AI Avatar 视频生成工具的表单状态
 */

import { atom, atomFamily } from 'recoil-next';
import {
  PhotoAvatarType,
  AudioInputType,
  VideoResolution,
  ExportedVideoType,
  PhotoAvatarVideoMode
} from '@/server/api/services/avatar4/type';
import type { PronRule } from '@/server/api/services/tts/type';
import { TaskSource } from '@/server/api/services/_common/type';
import { AssetInputSource } from '@/app/board/[id]/components/ToolPanel/components/avatar/types';

/**
 * AiAvatar 表单值类型 - 严格对齐后端接口字段
 * 接口字段顺序：aiavatarId, avatarType, audioFileSource, fileName, resolution, includeWatermark,
 * audioS3Path, audioStartTime, audioEndTime, ttsTaskId, ttsText, voiceoverId, voiceSpeed,
 * mode, durations, captionKey, imageS3Path, positivePrompt, source, offPeak, boardTaskId
 */
export interface AiAvatarFormValues {
  // ========== 后端接口字段（严格对齐） ==========
  /** AI Avatar ID */
  aiavatarId?: string;
  /** Avatar 类型 */
  avatarType?: PhotoAvatarType;
  /** 音频来源（接口必填）*/
  audioFileSource: AudioInputType;
  /** 文件名（接口必填）*/
  fileName: string;
  /** 视频分辨率（接口必填）*/
  resolution: VideoResolution;
  /** 是否包含水印（接口必填）*/
  includeWatermark: ExportedVideoType;
  /** 音频文件 S3 路径 */
  audioS3Path?: string;
  /** 音频开始时间（秒）*/
  audioStartTime?: number;
  /** 音频结束时间（秒）*/
  audioEndTime?: number;
  /** TTS 任务 ID */
  ttsTaskId?: string;
  /** TTS 文本内容 */
  ttsText?: string;
  /** 音色 ID */
  voiceoverId: string;
  /** 语速 */
  voiceSpeed: number;
  /** 发音规则列表 */
  pronRules?: PronRule[];
  /** 模式 */
  mode: PhotoAvatarVideoMode;
  /** 时长（秒）*/
  durations?: number;
  /** 字幕 key */
  captionKey?: string;
  /** 图片 S3 路径 */
  imageS3Path?: string;
  /** 正向提示词 */
  positivePrompt?: string;
  /** 任务来源 */
  source?: TaskSource;
  /** 是否非高峰 */
  offPeak?: boolean;
  /** 关联的 Board 任务 ID */
  boardTaskId: string;

  // ========== 前端 UI 专用字段（不提交到后端） ==========
  /** 头像图片输入来源（用于决定是否入库 My Avatar） */
  avatarPhotoInputSource?: AssetInputSource;
  /** 是否需要在任务创建成功后将头像图片入库到 My Avatar */
  shouldSaveToMyAvatar?: boolean;
  /** Avatar 头像照片 URL（模板库的，前端显示用）*/
  avatarTemplateUrl?: string;
  /** 模板图片 URL（用户上传的模板图片，前端显示用）*/
  templateImageUrl?: string;
  /** 音频文件 URL（前端显示用）*/
  audioUrl?: string;

  // ========== TTS 预览恢复用字段（前端专用，re-edit 场景） ==========
  /** TTS 音频 URL（已完成的预览音频，用于 re-edit 恢复）*/
  ttsAudioUrl?: string;
  /** TTS 预览音频时长（秒，用于 re-edit 恢复）*/
  ttsPreviewDuration?: number;
  /** Re-edit 时间戳，用于触发 TTS 预览重新初始化（解决重复 re-edit 同一任务的边缘情况）*/
  reEditTimestamp?: number;

  // ========== 前端计算用字段（不提交到后端） ==========
  /** 预估积分 */
  estimatedCredits?: number;
  /** 是否为预估值（非精确计算）*/
  isEstimatedCredits?: boolean;
}

/**
 * 默认值 - 完整初始化（严格对齐后端接口）
 */
export const DEFAULT_AI_AVATAR_VALUES: AiAvatarFormValues = {
  // ========== 后端接口字段（严格对齐） ==========
  aiavatarId: undefined,
  avatarType: undefined,
  audioFileSource: AudioInputType.TEXT_TO_AUDIO, // 必填，默认文字转语音
  fileName: 'Untitled Video', // 必填，默认 Untitled Video
  resolution: VideoResolution.RESOLUTION_1080P, // 必填，默认 1080P
  includeWatermark: ExportedVideoType.NORMAL, // 必填，默认无水印
  audioS3Path: undefined,
  audioStartTime: undefined,
  audioEndTime: undefined,
  ttsTaskId: undefined,
  ttsText: undefined,
  voiceoverId: '',
  voiceSpeed: 1,
  pronRules: [],
  mode: PhotoAvatarVideoMode.AVATAR_4, // 必填，默认 AVATAR_4
  durations: undefined,
  captionKey: undefined,
  imageS3Path: undefined,
  positivePrompt: undefined,
  source: TaskSource.BOARD,
  offPeak: undefined,
  boardTaskId: '',

  // ========== 前端 UI 专用字段 ==========
  avatarPhotoInputSource: undefined,
  shouldSaveToMyAvatar: undefined,
  avatarTemplateUrl: undefined,
  templateImageUrl: undefined,
  audioUrl: undefined,

  // ========== TTS 预览恢复用字段 ==========
  ttsAudioUrl: undefined,
  ttsPreviewDuration: undefined,

  // ========== 前端计算用字段 ==========
  estimatedCredits: undefined,
  isEstimatedCredits: undefined
};

/**
 * 按 TabId 隔离的 AiAvatar 表单状态
 */
export const aiAvatarFormFamily = atomFamily<AiAvatarFormValues, string>({
  key: 'aiAvatarForm',
  default: DEFAULT_AI_AVATAR_VALUES
});

/**
 * Avatar 模式免费次数状态
 * 存储每个模式的剩余免费次数
 * key: mode (如 'avatar4', 'avatar4Fast')
 * value: 剩余免费次数
 */
export const avatarModeFreeCountState = atom<Record<string, number>>({
  key: 'AvatarModeFreeCountState',
  default: {}
});

/**
 * Re-edit Loading 状态
 * 按 TabId 隔离，用于控制 re-edit 时的整体 loading overlay
 */
export const reEditLoadingFamily = atomFamily<boolean, string>({
  key: 'aiAvatarReEditLoading',
  default: false
});
