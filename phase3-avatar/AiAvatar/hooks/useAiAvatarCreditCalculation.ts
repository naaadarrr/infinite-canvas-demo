/**
 * AiAvatar 积分计算 Hook
 * 整合音频时长计算和字符预估，完全按照旧项目逻辑
 */

import { useMemo } from 'react';
import { AudioInputType } from '@/server/api/services/avatar4/type';
import {
  getCreditsPerSecondByMode,
  OFF_PEAK_MODE_CREDIT_DISCOUNT
} from '../config';
import { calculateCreditWithDynamicPrecision } from '@/app/board/[id]/components/ToolPanel/utils/credit';
import { getBillableTextLength, getPlainTextLength } from '../utils/text';
import type { AiAvatarFormValues } from '../store/atoms';

/**
 * 字符预估积分常量：每 15 字符 = 0.1 credits
 */
const CHAR_ESTIMATED_CREDITS_PER_15_CHARS = 0.1;

export interface UseAiAvatarCreditCalculationResult {
  /** 积分消耗值 */
  credits: number | undefined;
  /** 是否为预估值 */
  isEstimated: boolean | undefined;
}

export interface UseAiAvatarCreditCalculationOptions {
  /** 表单值 */
  formValues: AiAvatarFormValues;
  /** 音频范围（上传音频模式） */
  audioRange?: { start: number; end: number } | null;
  /** TTS 预览时长（TTS 模式） */
  previewDuration?: number;
  /** 是否免费生成（免费用户且有免费次数） */
  isFreeGenerate?: boolean;
}

/**
 * AiAvatar 积分计算 Hook
 * 完全按照旧项目逻辑：先计算基础积分，最后统一应用非高峰模式折扣
 */
export function useAiAvatarCreditCalculation({
  formValues,
  audioRange,
  previewDuration,
  isFreeGenerate = false
}: UseAiAvatarCreditCalculationOptions): UseAiAvatarCreditCalculationResult {
  const {
    audioFileSource,
    mode,
    ttsText,
    pronRules,
    audioStartTime,
    audioEndTime,
    durations,
    offPeak
  } = formValues;

  return useMemo(() => {
    // 如果免费生成，直接返回 0
    if (isFreeGenerate) {
      return {
        credits: 0,
        isEstimated: false
      };
    }

    // 获取每秒积分消耗
    const creditPerSecond = mode ? getCreditsPerSecondByMode(mode) : 0.1;

    // 优先级 1：有音频时长（精确计算）
    let audioDuration: number | undefined;
    if (audioFileSource === AudioInputType.UPLOAD_AUDIO) {
      // 上传音频模式：优先使用 audioRange，否则使用 formValues 中的时间
      if (audioRange) {
        audioDuration = audioRange.end - audioRange.start;
      } else if (audioStartTime !== undefined && audioEndTime !== undefined) {
        audioDuration = audioEndTime - audioStartTime;
      }
    } else if (audioFileSource === AudioInputType.TEXT_TO_AUDIO) {
      // TTS 模式：优先使用 formValues.durations，否则使用 previewDuration
      audioDuration = durations ?? previewDuration;
    }

    if (audioDuration !== undefined && audioDuration > 0) {
      // 完全按照旧项目逻辑
      // 1. 先计算基础积分：Math.ceil(audioDuration) * creditPerSecond
      let totalCredit = Math.ceil(audioDuration) * creditPerSecond;

      // 2. 最后统一应用非高峰模式折扣
      totalCredit = totalCredit * (offPeak ? OFF_PEAK_MODE_CREDIT_DISCOUNT : 1);

      // 3. 使用精度处理函数
      const credits = calculateCreditWithDynamicPrecision({
        totalCredit,
        unitCredit: creditPerSecond,
        ...(offPeak && { decimalPlaces: 2 })
      });

      return {
        credits,
        isEstimated: false
      };
    }

    // 优先级 2：没有音频时长但有字符（字符预估，仅 TTS 模式）
    if (audioFileSource === AudioInputType.TEXT_TO_AUDIO && ttsText?.trim()) {
      const charCount = pronRules?.length
        ? getBillableTextLength({ text: ttsText, pronRules })
        : getPlainTextLength(ttsText);
      if (charCount > 0) {
        // 1. 先计算基础积分：Math.ceil(charCount / 15) * 0.1
        let totalCredit =
          Math.ceil(charCount / 15) * CHAR_ESTIMATED_CREDITS_PER_15_CHARS;

        // 2. 最后统一应用非高峰模式折扣（非高峰模式在最后统一应用，跟字符和音频无关）
        totalCredit =
          totalCredit * (offPeak ? OFF_PEAK_MODE_CREDIT_DISCOUNT : 1);

        // 3. 使用精度处理函数
        const credits = calculateCreditWithDynamicPrecision({
          totalCredit,
          unitCredit: CHAR_ESTIMATED_CREDITS_PER_15_CHARS,
          ...(offPeak && { decimalPlaces: 2 })
        });

        return {
          credits,
          isEstimated: true
        };
      }
    }

    // 优先级 3：都没有
    return {
      credits: undefined,
      isEstimated: undefined
    };
  }, [
    audioFileSource,
    mode,
    ttsText,
    audioStartTime,
    audioEndTime,
    durations,
    previewDuration,
    audioRange,
    offPeak,
    isFreeGenerate
  ]);
}
