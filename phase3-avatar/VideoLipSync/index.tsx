// Video Lip Sync 工具表单组件

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil-next';
import { teamBenefitInfoState } from '@/store/benefit';
import { SUBS_TYPE, simplifySubsType } from '@/types/benefit/charge';
import { RESOURCE_SUBS_TYPE } from '@/types/benefit/resources';
import { MediaType } from '@/server/api/services/board/common';
import { AudioInputType } from '@/server/api/services/avatar4/type';
import { AvatarVideoUploadParameter } from '@/app/board/[id]/components/ToolPanel/components/avatar/AvatarVideoUploadParameter';
import {
  AvatarScript,
  DEFAULT_TTS_PREVIEW_QUOTA,
  type TtsPreviewQuota
} from '@/app/board/[id]/components/ToolPanel/components/avatar/AvatarScript';
import { MoreSettings } from './components/MoreSettings';
import { videoLipSyncFormFamily, reEditLoadingFamily } from './store/atoms';
import { videoLipSyncVoiceoverUiFamily } from './store/voiceoverAtoms';
import { useAssetSelect } from '@/app/board/[id]/components/ToolPanel/hooks/useAssetSelect';
import { useVideoLipSyncTemplate } from './hooks/useVideoLipSyncTemplate';
import { useActiveTabId } from '@/app/board/[id]/components/ToolPanel/hooks/useActiveTabId';
import { useGetTtsAuditionQuotaQuery } from '@/app/board/[id]/components/ToolPanel/components/avatar/AvatarScript/data/tts/useQueries';
import { extractQueryData } from '@/lib/trpc/helper';
import {
  extractPronRulesFromText,
  PRON_TAG_REGEX
} from '@/app/board/[id]/components/ToolPanel/components/avatar/utils/textUtils';
import type { PronRule } from '@/server/api/services/tts/type';
import {
  VIDEO_LIP_SYNC_TTS_TASK_TYPE,
  VIDEO_LIP_SYNC_MAX_INPUT_TEXT_LENGTH_MAP,
  VIDEO_LIP_SYNC_MAX_INPUT_TEXT_LENGTH_HARD_MAP,
  VIDEO_LIP_SYNC_MAX_INPUT_AUDIO_DURATION_MAP,
  VIDEO_S3_PATH_PREFIX
} from './config';
import { GenerateButton } from './components/GenerateButton';
import { AssetInputSource } from '@/app/board/[id]/components/ToolPanel/components/avatar';

export function VideoLipSync() {
  // 获取素材选择方法
  const { startAssetSelect } = useAssetSelect();

  // 使用独立的模块 store，按 tabId 隔离
  const tabId = useActiveTabId();
  const [formValues, setFormValues] = useRecoilState(
    videoLipSyncFormFamily(tabId)
  );
  const [voiceoverUi, setVoiceoverUi] = useRecoilState(
    videoLipSyncVoiceoverUiFamily(tabId)
  );
  // Re-edit loading 状态
  const isReEditLoading = useRecoilValue(reEditLoadingFamily(tabId));

  // 会员状态
  const teamBenefitInfo = useRecoilValue(teamBenefitInfoState);
  const subsType = teamBenefitInfo?.subsType ?? '';
  const membershipLevel = useMemo(
    () => simplifySubsType((subsType || SUBS_TYPE.FREE) as SUBS_TYPE),
    [subsType]
  );
  const isPremiumUser = membershipLevel !== RESOURCE_SUBS_TYPE.FREE;
  const isBusinessUser = membershipLevel === RESOURCE_SUBS_TYPE.BUSINESS;

  // 文字模式下的试听音频时长
  const [previewDuration, setPreviewDuration] = useState<number | undefined>(
    undefined
  );

  // 从模块 store 获取状态
  const {
    aiavatarId,
    videoUrl,
    audioFileSource,
    ttsText,
    audioUrl,
    audioFileName,
    audioS3Path,
    voiceoverId,
    captionKey,
    saveToPrivate,
    emotionFrontName,
    // TTS 预览恢复字段
    ttsAudioUrl,
    ttsPreviewDuration,
    reEditTimestamp
  } = formValues;
  const { pendingVoiceoverId } = voiceoverUi;

  // 根据会员等级计算限制配置（对齐 aigc-web 的 Avatar Video Creation 规则）
  const userLimits = useMemo(
    () => ({
      maxCharacters: VIDEO_LIP_SYNC_MAX_INPUT_TEXT_LENGTH_MAP[membershipLevel],
      maxSeconds: VIDEO_LIP_SYNC_MAX_INPUT_AUDIO_DURATION_MAP[membershipLevel],
      hardLimit: VIDEO_LIP_SYNC_MAX_INPUT_TEXT_LENGTH_HARD_MAP[membershipLevel]
    }),
    [membershipLevel]
  );
  const maxAudioDuration =
    VIDEO_LIP_SYNC_MAX_INPUT_AUDIO_DURATION_MAP[membershipLevel];

  // 检查 TTS 音频是否超过最大时长
  const isTtsAudioExceeded =
    audioFileSource === AudioInputType.TEXT_TO_AUDIO &&
    previewDuration != null &&
    previewDuration > maxAudioDuration;

  // 使用模板相关的 Hook
  const { setTemplateFromUpload, clearTemplate } = useVideoLipSyncTemplate();

  // 音频范围是临时状态，保持为本地状态
  const [audioRange, setAudioRange] = useState<{
    start: number;
    end: number;
  } | null>(null);
  // 上传的音频文件对象（临时状态）
  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null);
  // TTS 预览加载状态
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  // TTS 试听配额状态（来自 API 的剩余免费字符额度换算）
  const [ttsPreviewQuota, setTtsPreviewQuota] = useState<TtsPreviewQuota>(
    DEFAULT_TTS_PREVIEW_QUOTA
  );
  const ttsAuditionQuotaQuery = useGetTtsAuditionQuotaQuery(void 0, {
    // board 页面通常要求登录；若未登录，query 会失败但不影响主体功能
    retry: false
  });
  const refetchTtsAuditionQuotaRef = useRef(ttsAuditionQuotaQuery.refetch);
  refetchTtsAuditionQuotaRef.current = ttsAuditionQuotaQuery.refetch;

  // 将"剩余免费字符额度"映射为 UI 需要的 quota 结构
  useEffect(() => {
    try {
      const remaining = extractQueryData(ttsAuditionQuotaQuery.data);
      if (typeof remaining === 'number' && Number.isFinite(remaining)) {
        const dailyFreeCharacters =
          DEFAULT_TTS_PREVIEW_QUOTA.dailyFreeCharacters;
        const usedCharactersToday = Math.max(
          0,
          Math.min(dailyFreeCharacters, dailyFreeCharacters - remaining)
        );

        setTtsPreviewQuota((prev) => ({
          ...prev,
          dailyFreeCharacters,
          usedCharactersToday
        }));
      }
    } catch (error) {
      // 静默失败：保持默认值即可
      console.error('Failed to extract tts audition quota:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsAuditionQuotaQuery.data]);

  // 视频上传相关 ref
  const avatarVideoInputRef = useRef<HTMLInputElement>(null);
  const [avatarVideoDragOver, setAvatarVideoDragOver] = useState(false);

  // 更新 avatarTemplateUrl 的辅助函数（命名对齐 AiAvatar）
  // 当用户上传或从 Board 拖入时，使用 setTemplateFromUpload
  const setAvatarTemplateUrl = useCallback(
    (videoData: {
      url: string;
      s3Path: string;
      inputSource: AssetInputSource;
    }) => {
      setTemplateFromUpload({
        url: videoData.url,
        s3Path: videoData.s3Path,
        inputSource: videoData.inputSource
      });
    },
    [setTemplateFromUpload]
  );

  // 清空 avatarTemplateUrl 的辅助函数（命名对齐 AiAvatar）
  const clearAvatarTemplateUrl = useCallback(() => {
    clearTemplate();
  }, [clearTemplate]);

  // 处理音频来源变更
  const handleAudioFileSourceChange = useCallback(
    (value: AudioInputType) => {
      setFormValues((prev) => ({
        ...prev,
        audioFileSource: value,
        // 切换音频来源时，清空相关字段
        ttsTaskId: undefined,
        audioUrl: undefined,
        audioFileName: undefined,
        audioS3Path: undefined,
        audioStartTime: undefined,
        audioEndTime: undefined,
        durations: undefined
      }));
      setAudioRange(null);
      setUploadedAudioFile(null);
    },
    [setFormValues]
  );

  // 处理 TTS 文本变更（编辑器会一并传入从 DOM 提取的 pronRules）
  const handleTtsTextChange = useCallback(
    (text: string, pronRulesFromEditor?: PronRule[]) => {
      const pronRules =
        pronRulesFromEditor !== undefined
          ? pronRulesFromEditor
          : extractPronRulesFromText(text);
      const processedText = text.replace(PRON_TAG_REGEX, '$1');
      setFormValues((prev) => ({
        ...prev,
        ttsText: processedText,
        pronRules: pronRules.length > 0 ? pronRules : [],
        ttsTaskId: undefined
      }));
    },
    [setFormValues]
  );

  // 处理音频 S3 路径变更
  const handleAudioS3PathChange = useCallback(
    (
      audioUrl: string,
      audioS3Path: string,
      audioFile?: File,
      audioFileName?: string
    ) => {
      setFormValues((prev) => ({
        ...prev,
        audioUrl,
        audioS3Path,
        audioFileName
      }));
      // 保存文件对象（如果提供）
      if (audioFile) {
        setUploadedAudioFile(audioFile);
      }
      // 清除音频范围
      if (!audioUrl) {
        setAudioRange(null);
        setUploadedAudioFile(null);
        setFormValues((prev) => ({
          ...prev,
          audioStartTime: undefined,
          audioEndTime: undefined,
          durations: undefined,
          audioFileName: undefined
        }));
      }
    },
    [setFormValues]
  );

  // 处理音频范围变化（Import 模式）
  const handleAudioRangeChange = useCallback(
    (start: number, end: number) => {
      setAudioRange({ start, end });
      // 计算音频时长（秒）
      const durations = end - start;
      setFormValues((prev) => ({
        ...prev,
        audioStartTime: start,
        audioEndTime: end,
        durations
      }));
    },
    [setFormValues]
  );

  // 处理试听音频时长变化（Text 模式）
  const handlePreviewDurationChange = useCallback(
    (duration: number | undefined) => {
      setPreviewDuration(duration);
    },
    []
  );

  // 处理试听加载状态变化（Text 模式）
  const handlePreviewLoadingChange = useCallback((isLoading: boolean) => {
    setIsLoadingAudio(isLoading);
  }, []);

  // 处理试听生成（改为：试听成功后由 hook 触发 refetch；这里兜底直接 refetch）
  const handlePreviewGenerate = useCallback((_characterCount: number) => {
    void refetchTtsAuditionQuotaRef.current();
  }, []);

  // 处理音色变更
  const handleVoiceoverChange = useCallback(
    (id: string) => {
      setFormValues((prev) => ({
        ...prev,
        voiceoverId: id,
        // 音色变化会使试听作废
        ttsTaskId: undefined
      }));

      // 清理 UI 音色状态，避免"展示信息错配 / 待确认提示残留"
      setVoiceoverUi((prev) => ({
        ...prev,
        pendingVoiceoverId: undefined
      }));
    },
    [setFormValues, setVoiceoverUi]
  );

  // 处理音色情绪变更
  const handleEmotionChange = useCallback(
    (emotion?: string) => {
      setFormValues((prev) => ({
        ...prev,
        emotionFrontName: emotion,
        // 情绪变化会使试听作废
        ttsTaskId: undefined
      }));
    },
    [setFormValues]
  );

  // 处理清除待确认的音色提示
  const handleClearPendingVoiceover = useCallback(() => {
    setVoiceoverUi((prev) => {
      if (!prev.pendingVoiceoverId) return prev;
      return {
        ...prev,
        pendingVoiceoverId: undefined
      };
    });
  }, [setVoiceoverUi]);

  const handleVoiceSpeedChange = useCallback(
    (speed: number) => {
      setFormValues((prev) => ({
        ...prev,
        voiceSpeed: speed,
        // 语速变化会使试听作废
        ttsTaskId: undefined
      }));
    },
    [setFormValues]
  );

  // 处理字幕 key 变更
  const handleCaptionKeyChange = useCallback(
    (key: string | undefined) => {
      setFormValues((prev) => ({ ...prev, captionKey: key }));
    },
    [setFormValues]
  );

  // 处理保存到私模变更
  const handleSaveToPrivateChange = useCallback(
    (value: boolean | undefined) => {
      setFormValues((prev) => ({ ...prev, saveToPrivate: value }));
    },
    [setFormValues]
  );

  // 处理素材选择（空函数兜底）
  const handleAssetSelect = useCallback(
    (
      mediaType: MediaType,
      targetInput: string,
      onSelect: (url: string, s3Path: string) => void
    ) => {
      if (startAssetSelect) {
        // 特殊处理：视频选择，使用 setAvatarTemplateUrl
        if (mediaType === MediaType.VIDEO && targetInput === 'avatarVideo') {
          startAssetSelect(mediaType, targetInput, (url, s3Path) => {
            if (s3Path) {
              setAvatarTemplateUrl({
                url,
                s3Path,
                inputSource: AssetInputSource.BOARD_ASSET
              });
            }
          });
        } else {
          startAssetSelect(mediaType, targetInput, onSelect);
        }
      }
    },
    [startAssetSelect, setAvatarTemplateUrl]
  );

  return (
    <div className='flex h-full flex-col overflow-x-hidden'>
      <div className='flex-1 space-y-4 overflow-x-hidden p-4'>
        <AvatarVideoUploadParameter
          label='Source Video'
          placeholder='Upload a video for the Avatar template'
          uploadConfig={{
            video: videoUrl || null,
            setVideo: clearAvatarTemplateUrl,
            onAssetSelect: handleAssetSelect,
            onVideoUploadComplete: (data) => {
              // 组件已经判断了 inputSource，直接使用（已经是枚举类型）
              setAvatarTemplateUrl({
                url: data.url,
                s3Path: data.s3Path,
                inputSource: data.inputSource
              });
            },
            s3PathPrefix: VIDEO_S3_PATH_PREFIX
          }}
          advanced={{
            videoInputRef: avatarVideoInputRef,
            videoDragOver: avatarVideoDragOver,
            setVideoDragOver: setAvatarVideoDragOver
          }}
          isLoading={isReEditLoading}
        />

        <AvatarScript
          label='Audio'
          audioFileSource={audioFileSource || AudioInputType.TEXT_TO_AUDIO}
          ttsText={ttsText || ''}
          pronRules={formValues.pronRules || []}
          audioUrl={audioUrl}
          audioFileName={audioFileName}
          audioS3Path={audioS3Path}
          voiceoverId={voiceoverId}
          voiceSpeed={formValues.voiceSpeed}
          pendingVoiceoverId={pendingVoiceoverId}
          ttsTaskId={formValues.ttsTaskId}
          showUpgradeButton={!isBusinessUser}
          ttsPreviewQuota={ttsPreviewQuota}
          emotionFrontName={emotionFrontName}
          ttsTaskType={VIDEO_LIP_SYNC_TTS_TASK_TYPE}
          userLimits={userLimits}
          maxAudioDuration={maxAudioDuration}
          // TTS 预览恢复字段（re-edit 场景）
          ttsAudioUrl={ttsAudioUrl}
          ttsPreviewDuration={ttsPreviewDuration}
          reEditTimestamp={reEditTimestamp}
          onAudioFileSourceChange={handleAudioFileSourceChange}
          onTtsTextChange={handleTtsTextChange}
          onAudioS3PathChange={handleAudioS3PathChange}
          onAudioRangeChange={handleAudioRangeChange}
          onVoiceoverChange={handleVoiceoverChange}
          onVoiceSpeedChange={handleVoiceSpeedChange}
          onEmotionChange={handleEmotionChange}
          onClearPendingVoiceover={handleClearPendingVoiceover}
          onAssetSelect={handleAssetSelect}
          onTtsTaskIdChange={(taskId?: string) => {
            setFormValues((prev) => ({ ...prev, ttsTaskId: taskId }));
          }}
          onPreviewDurationChange={handlePreviewDurationChange}
          onPreviewGenerate={handlePreviewGenerate}
          onPreviewLoadingChange={handlePreviewLoadingChange}
        />

        <MoreSettings
          captionKey={captionKey}
          onCaptionKeyChange={handleCaptionKeyChange}
          saveToPrivate={saveToPrivate}
          onSaveToPrivateChange={handleSaveToPrivateChange}
          isUserUploadedVideo={!!videoUrl && !aiavatarId}
        />
      </div>

      {/* Generate Button */}
      <GenerateButton
        formValues={formValues}
        uploadedAudioFile={uploadedAudioFile}
        audioRange={audioRange}
        isAudioLoading={false}
        isLoadingAudio={isLoadingAudio}
        isTtsAudioExceeded={isTtsAudioExceeded}
        maxAudioDuration={maxAudioDuration}
      />
    </div>
  );
}
