/**
 * VideoLipSync 模块独立 Store
 * 视频口型同步工具的表单状态
 * 严格对齐后端接口字段命名
 */

import { atomFamily } from 'recoil-next';
import {
  AudioInputType,
  VideoResolution
} from '@/server/api/services/avatar4/type';
import {
  AvatarVideoCreationMode,
  AvatarVideoCreationVersion
} from '@/server/api/services/avatarVideoCreation/type';
import type { PronRule } from '@/server/api/services/tts/type';
import { TaskSource } from '@/server/api/services/_common/type';
import { AssetInputSource } from '@/app/board/[id]/components/ToolPanel/components/avatar/types';

/**
 * VideoLipSync 表单值类型 - 严格对齐后端接口字段
 * 接口字段顺序：aiavatarId, audioFileSource, fileName, resolution, mode, version,
 * audioS3Path, audioStartTime, audioEndTime, ttsTaskId, ttsText, voiceoverId, voiceSpeed,
 * pronRules, durations, captionKey, emotionFrontName, saveToPrivate,
 * source, boardTaskId, videoS3Path
 */
export interface VideoLipSyncFormValues {
  // ========== 后端接口字段（严格对齐） ==========
  /** AI Avatar ID */
  aiavatarId?: string;
  /** 音频来源（接口必填）*/
  audioFileSource: AudioInputType;
  /** 文件名（接口必填）*/
  fileName: string;
  /** 视频分辨率（接口必填）*/
  resolution: VideoResolution;
  /** 模式（接口必填）*/
  mode: AvatarVideoCreationMode;
  /** 版本（可选，V2 表示 LipSync 模式）*/
  version?: AvatarVideoCreationVersion;
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
  /** 时长（秒）*/
  durations?: number;
  /** 字幕 key */
  captionKey?: string;
  /** 情感前置名称 */
  emotionFrontName?: string;
  /** 是否保存到私模（仅 version=V2 时适用）*/
  saveToPrivate?: boolean;
  /** 任务来源 */
  source?: TaskSource;
  /** 关联的 Board 任务 ID */
  boardTaskId: string;
  /** 视频 S3 路径 */
  videoS3Path?: string;

  // ========== 前端 UI 专用字段（不提交到后端） ==========
  /** 视频 URL（前端显示用）*/
  videoUrl?: string;
  /** 音频文件 URL（前端显示用）*/
  audioUrl?: string;
  /** 音频文件名（本地上传时用于显示，避免 blob URL 显示错误）*/
  audioFileName?: string;
  /** 视频输入来源（用于区分本地上传和 board asset 拖拽）*/
  videoInputSource?: AssetInputSource;

  // ========== TTS 预览恢复用字段（前端专用，re-edit 场景） ==========
  /** TTS 音频 URL（已完成的预览音频，用于 re-edit 恢复）*/
  ttsAudioUrl?: string;
  /** TTS 预览音频时长（秒，用于 re-edit 恢复）*/
  ttsPreviewDuration?: number;
  /** Re-edit 时间戳，用于触发 TTS 预览重新初始化 */
  reEditTimestamp?: number;
}

/**
 * 默认值 - 完整初始化（严格对齐后端接口）
 */
export const DEFAULT_VIDEO_LIP_SYNC_VALUES: VideoLipSyncFormValues = {
  // ========== 后端接口字段（严格对齐） ==========
  aiavatarId: undefined,
  audioFileSource: AudioInputType.TEXT_TO_AUDIO, // 必填，默认文字转语音
  fileName: 'Untitled Video', // 必填，默认 Untitled Video
  resolution: VideoResolution.RESOLUTION_1080P, // 必填，默认 1080P
  mode: AvatarVideoCreationMode.NORMAL, // 必填，默认 NORMAL
  version: AvatarVideoCreationVersion.V2, // 可选，LipSync 模式固定为 V2
  audioS3Path: undefined,
  audioStartTime: undefined,
  audioEndTime: undefined,
  ttsTaskId: undefined,
  ttsText: undefined,
  voiceoverId: '', // TTS 模式必填，默认空字符串
  voiceSpeed: 1.0, // TTS 模式必填，默认 1.0
  pronRules: [],
  durations: undefined,
  captionKey: undefined,
  emotionFrontName: undefined,
  saveToPrivate: undefined,
  source: TaskSource.BOARD,
  boardTaskId: '', // 必填，默认空字符串，任务创建时生成

  // ========== 前端 UI 专用字段 ==========
  videoUrl: undefined,
  audioUrl: undefined,
  audioFileName: undefined,
  videoS3Path: undefined,
  videoInputSource: undefined
};

/**
 * 按 TabId 隔离的 VideoLipSync 表单状态
 */
export const videoLipSyncFormFamily = atomFamily<
  VideoLipSyncFormValues,
  string
>({
  key: 'videoLipSyncForm',
  default: DEFAULT_VIDEO_LIP_SYNC_VALUES
});

/**
 * 按 TabId 隔离的 Re-edit Loading 状态
 * 用于在 re-edit 时显示局部 loading
 */
export const reEditLoadingFamily = atomFamily<boolean, string>({
  key: 'videoLipSyncReEditLoading',
  default: false
});
