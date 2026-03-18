// Text to Video 工具表单组件

import { useEffect, useRef, useCallback } from 'react';
import { useRecoilState } from 'recoil-next';
import { PromptHistoryPanel } from '@/app/board/[id]/components/ToolPanel/components/PromptHistoryPanel';
import { textToVideoConfig } from './config';
import { TextareaParameter } from '@/app/board/[id]/components/ToolPanel/components/inputs/TextareaParameter';
import { SwitchParameter } from '@/app/board/[id]/components/ToolPanel/components/inputs/SwitchParameter';
import { SelectParameter } from '@/app/board/[id]/components/ToolPanel/components/inputs/SelectParameter';
import { SliderParameter } from '@/app/board/[id]/components/ToolPanel/components/inputs/SliderParameter';
import { useVideoModelConfig } from '../hooks/useVideoModelConfig';
import { getAIVideoModelCapability } from '../helpers/capability';
import { useActiveTabId } from '@/app/board/[id]/components/ToolPanel/hooks/useActiveTabId';
import { aiVideoFormFamily, AIVideoFormValues } from '../store/atoms';

export function TextToVideo() {
  // 获取当前活动的 Tab ID
  const tabId = useActiveTabId();

  // 从模块独立 store 获取状态
  const [formValues, setFormValues] = useRecoilState(aiVideoFormFamily(tabId));

  // 处理表单值更新
  const handleValueChange = useCallback(
    <K extends keyof AIVideoFormValues>(
      key: K,
      value: AIVideoFormValues[K]
    ) => {
      setFormValues((prev) => ({ ...prev, [key]: value }));
    },
    [setFormValues]
  );

  // 获取模型配置
  const {
    currentModel,
    getI2VDurationOptions,
    getI2VResolutionOptions,
    getI2VAspectRatioOptions
  } = useVideoModelConfig();

  // 使用能力判定工具获取当前模型能力
  const capability = getAIVideoModelCapability(currentModel as any);

  // 获取动态 duration 选项
  const durationConfig = getI2VDurationOptions();
  const durationOptions =
    durationConfig.type === 'select' && durationConfig.options
      ? durationConfig.options.map((d: number) => ({
          value: String(d),
          label: `${d}s`
        }))
      : [];

  // 获取动态 resolution 选项
  const resolutionOptions = getI2VResolutionOptions().map((r) => ({
    value: r,
    label: r
  }));

  // 获取动态 aspect ratio 选项
  const aspectRatioOptions = getI2VAspectRatioOptions().map((r) => ({
    value: r,
    label: r
  }));

  // 获取最大分辨率（提取数字部分比较）
  const getMaxResolution = () => {
    if (resolutionOptions.length === 0) return '720p';
    return resolutionOptions.reduce((max, curr) => {
      const maxNum = parseInt(max.value.replace(/\D/g, '')) || 0;
      const currNum = parseInt(curr.value.replace(/\D/g, '')) || 0;
      return currNum > maxNum ? curr : max;
    }).value;
  };

  // 记录上一次的 resolutionOptions 用于检测模型切换
  const prevResolutionOptionsRef = useRef<string>('');
  const resolutionOptionsKey = resolutionOptions.map((o) => o.value).join(',');

  // 当模型切换（resolutionOptions 变化）时，自动设置为最大分辨率
  useEffect(() => {
    if (
      resolutionOptions.length > 0 &&
      resolutionOptionsKey !== prevResolutionOptionsRef.current
    ) {
      const maxRes = getMaxResolution();
      setFormValues((prev) => ({ ...prev, resolution: maxRes }));
      prevResolutionOptionsRef.current = resolutionOptionsKey;
    }
  }, [resolutionOptionsKey, resolutionOptions.length, setFormValues]);

  // 当参数选项变化时，如果当前值不在选项中，自动重置为第一个可用选项
  useEffect(() => {
    if (
      resolutionOptions.length > 0 &&
      !resolutionOptions.find((o: any) => o.value === formValues.resolution)
    ) {
      handleValueChange('resolution', resolutionOptions[0].value);
    }
  }, [resolutionOptions, formValues.resolution, handleValueChange]);

  useEffect(() => {
    if (
      aspectRatioOptions.length > 0 &&
      !aspectRatioOptions.find((o: any) => o.value === formValues.aspectRatio)
    ) {
      handleValueChange('aspectRatio', aspectRatioOptions[0].value);
    }
  }, [formValues.aspectRatio, handleValueChange]);

  useEffect(() => {
    if (
      durationOptions.length > 0 &&
      !durationOptions.find((o: any) => o.value === String(formValues.duration))
    ) {
      handleValueChange('duration', Number(durationOptions[0].value));
    }
  }, [durationOptions, formValues.duration, handleValueChange]);

  return (
    <>
      <TextareaParameter
        label='Prompt'
        placeholder='Describe the motion you want... Use quotes for speech/singing.'
        value={(formValues.prompt as string) || ''}
        keyParam='prompt'
        onChange={(key, val) =>
          handleValueChange(key as keyof AIVideoFormValues, val)
        }
        headerAction={
          <PromptHistoryPanel
            onSelect={(prompt) => handleValueChange('prompt', prompt)}
          />
        }
      />

      {/* Native Audio - 仅在支持时显示 */}
      {capability.supportsNativeAudio && (
        <SwitchParameter
          label='Native Audio'
          value={formValues.nativeAudio}
          defaultValue={true}
          tooltip='Enable to generate video with speaking/singing and sound effects'
          onChange={(val) => handleValueChange('nativeAudio', val)}
        />
      )}

      {/* Aspect Ratio - 仅在有选项时显示 */}
      {capability.supportsRatio && aspectRatioOptions.length > 0 && (
        <SelectParameter
          label='Aspect Ratio'
          options={aspectRatioOptions}
          value={formValues.aspectRatio as string}
          defaultValue={
            aspectRatioOptions[0]?.value || textToVideoConfig.defaultAspectRatio
          }
          paramKey='aspectRatio'
          onChange={(val) => handleValueChange('aspectRatio', val)}
        />
      )}

      {/* Resolution - 仅在有多个选项时显示 */}
      {capability.supportsResolution && resolutionOptions.length > 0 && (
        <SelectParameter
          label='Resolution'
          options={resolutionOptions}
          value={formValues.resolution}
          defaultValue={getMaxResolution()}
          onChange={(val) => handleValueChange('resolution', val)}
        />
      )}

      {/* Duration - 仅在有选项时显示 */}
      {capability.supportsDuration && durationOptions.length > 0 && (
        <SelectParameter
          label='Duration'
          options={durationOptions}
          value={String(formValues.duration || 5)}
          defaultValue={
            durationOptions.find(
              (o: { value: string; label: string }) => o.value === '5'
            )?.value || durationOptions[0]?.value
          }
          onChange={(val) => handleValueChange('duration', Number(val))}
        />
      )}

      <SliderParameter
        label='Generation Count'
        value={formValues.generatingCount}
        defaultValue={textToVideoConfig.generationCount.defaultValue}
        min={textToVideoConfig.generationCount.min}
        max={textToVideoConfig.generationCount.max}
        step={textToVideoConfig.generationCount.step}
        onChange={(val) => handleValueChange('generatingCount', val)}
      />
    </>
  );
}
