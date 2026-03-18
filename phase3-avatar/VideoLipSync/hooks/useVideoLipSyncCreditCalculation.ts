/**
 * VideoLipSync 积分计算 Hook
 * 实时计算积分消耗，不使用预估
 * 参考旧项目的积分计算逻辑
 */

import { useMemo } from 'react';
import { AudioInputType } from '@/server/api/services/avatar4/type';
import {
  VIDEO_LIP_SYNC_SECONDS_PER_CREDIT,
  VIDEO_LIP_SYNC_CHARACTERS_PER_CREDIT
} from '../config';
import {
  calculateTotalPauseDuration,
  getPlainTextLength
} from '@/app/board/[id]/components/ToolPanel/components/avatar/utils/textUtils';
import type { VideoLipSyncFormValues } from '../store/atoms';

export interface UseVideoLipSyncCreditCalculationResult {
  /** 积分消耗值 */
  credits: number;
}

export interface UseVideoLipSyncCreditCalculationOptions {
  /** 表单值 */
  formValues: VideoLipSyncFormValues;
  /** 音频范围（上传音频模式） */
  audioRange?: { start: number; end: number } | null;
}

/**
 * VideoLipSync 积分计算 Hook
 * 实时计算积分消耗，不使用预估
 *
 * 计算规则：
 * - 上传音频模式：Math.ceil((audioEndTime - audioStartTime) / 30)，最少 1 credit
 * - TTS 模式：Math.ceil(characterCount / 400 + pauseDuration / 30)，最少 1 credit
 */
export function useVideoLipSyncCreditCalculation({
  formValues,
  audioRange
}: UseVideoLipSyncCreditCalculationOptions): UseVideoLipSyncCreditCalculationResult {
  const { audioFileSource, ttsText, audioStartTime, audioEndTime } = formValues;

  return useMemo(() => {
    let creditConsumption = 1; // 默认最少 1 credit

    if (audioFileSource === AudioInputType.UPLOAD_AUDIO) {
      // 上传音频模式：根据音频时长计算
      let audioDuration = 0;

      if (audioRange) {
        audioDuration = audioRange.end - audioRange.start;
      } else if (audioStartTime !== undefined && audioEndTime !== undefined) {
        audioDuration = audioEndTime - audioStartTime;
      }

      if (audioDuration > 0) {
        creditConsumption = Math.ceil(
          audioDuration / VIDEO_LIP_SYNC_SECONDS_PER_CREDIT
        );
      }
    } else if (audioFileSource === AudioInputType.TEXT_TO_AUDIO) {
      // TTS 模式：根据字符数和 pause 时长计算
      if (ttsText?.trim()) {
        const characterCount = getPlainTextLength(ttsText);
        const totalPauseDuration = calculateTotalPauseDuration(ttsText);

        // 字符数积分
        const characterCredit =
          characterCount / VIDEO_LIP_SYNC_CHARACTERS_PER_CREDIT;
        // pause 时长积分
        const pauseCredit =
          totalPauseDuration / VIDEO_LIP_SYNC_SECONDS_PER_CREDIT;

        creditConsumption = Math.ceil(characterCredit + pauseCredit);
      }
    }

    // 最少 1 credit
    return {
      credits: Math.max(creditConsumption, 1)
    };
  }, [audioFileSource, ttsText, audioStartTime, audioEndTime, audioRange]);
}
