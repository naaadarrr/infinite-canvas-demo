// AI Avatar 工具表单组件

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil-next';
import { teamBenefitInfoState } from '@/store/benefit';
import { SUBS_TYPE } from '@/types/benefit/charge';
import { MediaType } from '@/server/api/services/board/common';
import {
  AudioInputType,
  PhotoAvatarVideoMode
} from '@/server/api/services/avatar4/type';
import { ModelSelector } from './components/ModelSelector';
import { AvatarPhotoUpload } from './components/AvatarPhotoUpload';
import {
  AvatarScript,
  TtsPreviewQuota,
  DEFAULT_TTS_PREVIEW_QUOTA
} from '@/app/board/[id]/components/ToolPanel/components/avatar/AvatarScript';
import { MoreSettings } from './components/MoreSettings';
import { useAssetSelect } from '@/app/board/[id]/components/ToolPanel/hooks/useAssetSelect';
import { useActiveTabId } from '@/app/board/[id]/components/ToolPanel/hooks/useActiveTabId';
import { aiAvatarFormFamily, reEditLoadingFamily } from './store/atoms';
import { useAiAvatarTemplate } from './hooks/useAiAvatarTemplate';
import { useAiAvatarTemplateInit } from './hooks/useAiAvatarTemplateInit';
import { useAiAvatarCreditCalculation } from './hooks/useAiAvatarCreditCalculation';
import { useAiAvatarFreeUser } from './hooks/useAiAvatarFreeUser';
import { GenerateButton } from './components/GenerateButton';
import { aiAvatarVoiceoverUiFamily } from './store/voiceoverAtoms';
import { AssetInputSource } from '@/app/board/[id]/components/ToolPanel/components/avatar/types';
import {
  AVATAR_4_MODE_MAX_INPUT_TEXT_LENGTH,
  AVATAR_4_MODE_MAX_INPUT_TEXT_LENGTH_FREE,
  AVATAR_4_MODE_MAX_INPUT_TEXT_LENGTH_HARD,
  AVATAR_4_MODE_MAX_INPUT_TEXT_LENGTH_FREE_HARD,
  AVATAR_4_MODE_MAX_INPUT_AUDIO_DURATION,
  AVATAR_4_MODE_MAX_INPUT_AUDIO_DURATION_FREE
} from './config/index';
import {
  extractPronRulesFromText,
  PRON_TAG_REGEX
} from '@/app/board/[id]/components/ToolPanel/components/avatar/utils/textUtils';
import type { PronRule } from '@/server/api/services/tts/type';
import { useGetTtsAuditionQuotaQuery } from '@/app/board/[id]/components/ToolPanel/components/avatar/AvatarScript/data/tts/useQueries';
import { extractQueryData } from '@/lib/trpc/helper';

export function AiAvatar() {
  // 使用独立的模块 store，按 tabId 隔离（需要在其他 Hook 之前获取）
  const tabId = useActiveTabId();

  // 初始化模板（处理从 Home 页跳转时携带的 templateId 参数）
  useAiAvatarTemplateInit(tabId);

  // 获取素材选择方法
  const { startAssetSelect } = useAssetSelect();
  const [formValues, setFormValues] = useRecoilState(aiAvatarFormFamily(tabId));
  const [voiceoverUi, setVoiceoverUi] = useRecoilState(
    aiAvatarVoiceoverUiFamily(tabId)
  );
  const isReEditLoading = useRecoilValue(reEditLoadingFamily(tabId));

  // 从模块 store 获取状态
  const {
    avatarTemplateUrl,
    templateImageUrl,
    mode: currentMode,
    audioFileSource,
    ttsTaskId,
    ttsText,
    audioUrl,
    audioS3Path,
    voiceoverId,
    voiceSpeed,
    captionKey,
    positivePrompt,
    offPeak,
    pronRules,
    // TTS 预览恢复用字段
    ttsAudioUrl,
    ttsPreviewDuration: initialTtsPreviewDuration,
    reEditTimestamp
  } = formValues;
  console.log('🚀 ~ AiAvatar ~ pronRules:', pronRules);
  const { pendingVoiceoverId } = voiceoverUi;

  // 获取当前显示的模板图片 URL（优先使用模板库的，否则使用用户上传的）
  const currentTemplateUrl = avatarTemplateUrl ?? templateImageUrl;

  // 使用模板相关的 Hook
  const { setTemplateFromUpload, clearTemplate } = useAiAvatarTemplate();

  // 更新 avatarTemplateUrl 的辅助函数
  // 当用户上传或从 Board 拖入时，使用 setTemplateFromUpload
  const setAvatarTemplateUrl = useCallback(
    (photoData: {
      url: string;
      s3Path: string;
      inputSource: AssetInputSource;
    }) => {
      setTemplateFromUpload({
        url: photoData.url,
        s3Path: photoData.s3Path,
        inputSource: photoData.inputSource
      });
    },
    [setTemplateFromUpload]
  );

  // 清空 avatarTemplateUrl 的辅助函数
  const clearAvatarTemplateUrl = useCallback(() => {
    clearTemplate();
  }, [clearTemplate]);

  // 会员状态（与 useCreditAndPermission 一致：用 teamBenefitInfoState.subsType）
  const teamBenefitInfo = useRecoilValue(teamBenefitInfoState);
  const subsType = teamBenefitInfo?.subsType ?? '';
  const isPremiumUser = !!subsType && subsType !== SUBS_TYPE.FREE;

  // 免费用户相关信息（自动查询免费次数并更新到 store）
  const freeUserInfo = useAiAvatarFreeUser({
    formValues,
    subsType
  });

  // 音频范围是临时状态，保持为本地状态
  const [audioRange, setAudioRange] = useState<{
    start: number;
    end: number;
  } | null>(null);
  // 上传的音频文件对象（临时状态）
  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null);
  // 文字模式下的试听音频时长
  const [previewDuration, setPreviewDuration] = useState<number | undefined>(
    undefined
  );
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

  // 将“剩余免费字符额度”映射为 UI 需要的 quota 结构
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

  // 处理音频范围变化（Import 模式）
  const handleAudioRangeChange = useCallback(
    (start: number, end: number) => {
      setAudioRange({ start, end });
      // 计算音频时长（秒）
      const durations = end - start;
      // 可以在这里将范围信息传递给父组件或存储到 formValues
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

  // ========== 组件事件处理方法 ==========

  // 处理模式选择
  const handleModeChange = useCallback(
    (value: PhotoAvatarVideoMode) => {
      setFormValues((prev) => ({ ...prev, mode: value }));
    },
    [setFormValues]
  );

  // 处理音频来源变更
  const handleAudioFileSourceChange = useCallback(
    (value: AudioInputType) => {
      setFormValues((prev) => ({
        ...prev,
        audioFileSource: value,
        // 切换脚本模式时，清空 ttsTaskId（防止带着旧试听任务提交）
        ttsTaskId: undefined
      }));
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
      _audioFileName?: string
    ) => {
      setFormValues((prev) => ({
        ...prev,
        audioUrl,
        audioS3Path
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
          estimatedCredits: undefined,
          isEstimatedCredits: undefined
        }));
      }
    },
    [setFormValues]
  );

  // 处理音色变更
  const handleVoiceoverChange = useCallback(
    (id: string) => {
      setFormValues((prev) => ({
        ...prev,
        voiceoverId: id,
        // 音色变化会使试听作废
        ttsTaskId: undefined
      }));

      // 清理 UI 音色状态，避免“展示信息错配 / 待确认提示残留”
      setVoiceoverUi((prev) => ({
        ...prev,
        pendingVoiceoverId: undefined
      }));
    },
    [setFormValues, setVoiceoverUi]
  );

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

  const handleClearPendingVoiceover = useCallback(() => {
    setVoiceoverUi((prev) => {
      if (!prev.pendingVoiceoverId) return prev;
      return {
        ...prev,
        pendingVoiceoverId: undefined
      };
    });
  }, [setVoiceoverUi]);

  // 试听任务 ID 回写
  const handleTtsTaskIdChange = useCallback(
    (taskId: string | undefined) => {
      setFormValues((prev) => ({
        ...prev,
        ttsTaskId: taskId
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

  // 处理正向提示词变更
  const handlePositivePromptChange = useCallback(
    (value: string | undefined) => {
      setFormValues((prev) => ({ ...prev, positivePrompt: value }));
    },
    [setFormValues]
  );

  // 处理非高峰模式变更
  const handleOffPeakChange = useCallback(
    (value: boolean | undefined) => {
      setFormValues((prev) => ({ ...prev, offPeak: value }));
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
        startAssetSelect(mediaType, targetInput, onSelect);
      }
    },
    [startAssetSelect]
  );

  // 使用新的积分计算 Hook（传递免费生成标识）
  const creditCalculation = useAiAvatarCreditCalculation({
    formValues,
    audioRange,
    previewDuration,
    isFreeGenerate: freeUserInfo.isFreeGenerate
  });

  // 更新预估积分到模块 store
  useEffect(() => {
    setFormValues((prev) => {
      // 只有当值发生变化时才更新，避免不必要的渲染
      if (
        prev.estimatedCredits !== creditCalculation.credits ||
        prev.isEstimatedCredits !== creditCalculation.isEstimated
      ) {
        return {
          ...prev,
          estimatedCredits: creditCalculation.credits,
          isEstimatedCredits: creditCalculation.isEstimated
        };
      }
      return prev;
    });
  }, [creditCalculation.credits, creditCalculation.isEstimated, setFormValues]);

  // 计算用户限制配置（根据用户身份：Starter/Pro/Business 为付费用户）
  const userLimits = useMemo(() => {
    return isPremiumUser
      ? {
          maxCharacters: AVATAR_4_MODE_MAX_INPUT_TEXT_LENGTH,
          maxSeconds: AVATAR_4_MODE_MAX_INPUT_AUDIO_DURATION,
          hardLimit: AVATAR_4_MODE_MAX_INPUT_TEXT_LENGTH_HARD
        }
      : {
          maxCharacters: AVATAR_4_MODE_MAX_INPUT_TEXT_LENGTH_FREE,
          maxSeconds: AVATAR_4_MODE_MAX_INPUT_AUDIO_DURATION_FREE,
          hardLimit: AVATAR_4_MODE_MAX_INPUT_TEXT_LENGTH_FREE_HARD
        };
  }, [isPremiumUser]);

  // 计算最大音频时长（根据用户身份：Starter/Pro/Business 为付费用户）
  const maxAudioDuration = useMemo(() => {
    return isPremiumUser
      ? AVATAR_4_MODE_MAX_INPUT_AUDIO_DURATION
      : AVATAR_4_MODE_MAX_INPUT_AUDIO_DURATION_FREE;
  }, [isPremiumUser]);

  // 检查 TTS 音频是否超过最大时长
  const isTtsAudioExceeded = useMemo(() => {
    if (audioFileSource !== AudioInputType.TEXT_TO_AUDIO) {
      return false;
    }
    if (!previewDuration || !maxAudioDuration) {
      return false;
    }
    return previewDuration > maxAudioDuration;
  }, [audioFileSource, previewDuration, maxAudioDuration]);

  return (
    <div className='relative flex h-full flex-col overflow-x-hidden'>
      <div className='flex-1 space-y-4 overflow-x-hidden p-4'>
        {/* Model Selection */}
        <ModelSelector
          value={formValues.mode}
          onChange={handleModeChange}
        />

        <AvatarPhotoUpload
          label='Avatar Photo'
          photoUrl={currentTemplateUrl}
          setPhoto={setAvatarTemplateUrl}
          clearPhoto={clearAvatarTemplateUrl}
          onAssetSelect={handleAssetSelect}
          isLoading={isReEditLoading}
        />

        <AvatarScript
          label='Script'
          audioFileSource={audioFileSource || AudioInputType.TEXT_TO_AUDIO}
          ttsText={ttsText || ''}
          pronRules={pronRules || []}
          ttsTaskId={ttsTaskId}
          audioUrl={audioUrl}
          audioS3Path={audioS3Path}
          voiceoverId={voiceoverId}
          voiceSpeed={voiceSpeed}
          pendingVoiceoverId={pendingVoiceoverId}
          showUpgradeButton={!isPremiumUser}
          ttsPreviewQuota={ttsPreviewQuota}
          userLimits={userLimits}
          maxAudioDuration={maxAudioDuration}
          // TTS 预览恢复用字段（re-edit 场景）
          ttsAudioUrl={ttsAudioUrl}
          ttsPreviewDuration={initialTtsPreviewDuration}
          reEditTimestamp={reEditTimestamp}
          onAudioFileSourceChange={handleAudioFileSourceChange}
          onTtsTextChange={handleTtsTextChange}
          onAudioS3PathChange={handleAudioS3PathChange}
          onAudioRangeChange={handleAudioRangeChange}
          onVoiceoverChange={handleVoiceoverChange}
          onVoiceSpeedChange={handleVoiceSpeedChange}
          onClearPendingVoiceover={handleClearPendingVoiceover}
          onAssetSelect={handleAssetSelect}
          onTtsTaskIdChange={handleTtsTaskIdChange}
          onPreviewDurationChange={handlePreviewDurationChange}
          onPreviewGenerate={handlePreviewGenerate}
          onPreviewLoadingChange={handlePreviewLoadingChange}
        />

        {/* More Settings */}
        <MoreSettings
          captionKey={captionKey}
          onCaptionKeyChange={handleCaptionKeyChange}
          positivePrompt={positivePrompt}
          onPositivePromptChange={handlePositivePromptChange}
          offPeak={offPeak}
          onOffPeakChange={handleOffPeakChange}
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
        freeUserInfo={freeUserInfo}
      />
    </div>
  );
}
