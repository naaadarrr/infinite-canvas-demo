// Image to Video 工具表单组件

import { useRef, useState, useCallback, useEffect } from 'react';
import { useRecoilState } from 'recoil-next';
import { PromptHistoryPanel } from '@/app/board/[id]/components/ToolPanel/components/PromptHistoryPanel';
import { imageToVideoConfig } from './config';
import { VideoFrameUploadParameter } from '../components/VideoFrameUploadParameter';
import { TextareaParameter } from '@/app/board/[id]/components/ToolPanel/components/inputs/TextareaParameter';
import { SwitchParameter } from '@/app/board/[id]/components/ToolPanel/components/inputs/SwitchParameter';
import { SelectParameter } from '@/app/board/[id]/components/ToolPanel/components/inputs/SelectParameter';
import { SliderParameter } from '@/app/board/[id]/components/ToolPanel/components/inputs/SliderParameter';
import { ReferenceToVideoParameter } from '../components/ReferenceToVideoParameter';
import { useVideoModelConfig } from '../hooks/useVideoModelConfig';
import { getAIVideoModelCapability } from '../helpers/capability';
import { useActiveTabId } from '@/app/board/[id]/components/ToolPanel/hooks/useActiveTabId';
import { aiVideoFormFamily, AIVideoFormValues } from '../store/atoms';
import { MultiImagesUploadBase } from '@/app/board/[id]/components/ToolPanel/components/uploads/MultiImagesUploadBase';
import { useAssetSelect } from '@/app/board/[id]/components/ToolPanel/hooks/useAssetSelect';

export function ImageToVideo() {
  const { startAssetSelect } = useAssetSelect();
  // 获取当前活动的 Tab ID
  const tabId = useActiveTabId();

  // 从模块独立 store 获取状态
  const [formValues, setFormValues] = useRecoilState(aiVideoFormFamily(tabId));

  // 从 formValues 获取 I2V 相关状态
  const {
    i2vRefToVideoPrompt,
    firstFrameImage,
    lastFrameImage,
    referenceImages
  } = formValues;

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

  // 设置首帧图片
  const setFirstFrameImage = useCallback(
    (image: string | null) => handleValueChange('firstFrameImage', image),
    [handleValueChange]
  );

  // 设置尾帧图片
  const setLastFrameImage = useCallback(
    (image: string | null) => handleValueChange('lastFrameImage', image),
    [handleValueChange]
  );

  // 设置 I2V 参考图片
  const setReferenceImages = useCallback(
    (images: string[] | ((prev: string[]) => string[])) => {
      if (typeof images === 'function') {
        setFormValues((prev) => ({
          ...prev,
          referenceImages: images(prev.referenceImages || [])
        }));
      } else {
        handleValueChange('referenceImages', images);
      }
    },
    [handleValueChange, setFormValues]
  );

  // 获取模型配置
  const {
    currentModel,
    getI2VDurationOptions,
    getI2VResolutionOptions,
    getI2VAspectRatioOptions
  } = useVideoModelConfig();

  // 使用能力判定工具获取当前模型能力
  const capability = getAIVideoModelCapability(currentModel);

  const [addEndFrame, setAddEndFrame] = useState(true);
  const firstFrameInputRef = useRef<HTMLInputElement>(null);
  const endFrameInputRef = useRef<HTMLInputElement>(null);
  const [firstFrameDragOver, setFirstFrameDragOver] = useState(false);
  const [endFrameDragOver, setEndFrameDragOver] = useState(false);

  // 检查是否是 Sora 系列模型
  const isSoraModel = (): boolean => {
    const modelIdLower = currentModel?.id?.toLowerCase() || '';
    return modelIdLower.includes('sora');
  };

  // 根据模型动态设置 placeholder
  const getPromptPlaceholder = (): string => {
    if (capability.supportsResourceRefPrompt) {
      return 'Upload a 3-10s video clip and use text or images to easily modify content, change camera angles, or restyle the original video. Use @ to quickly insert added assets.';
    }
    const modelIdLower = currentModel?.id?.toLowerCase() || '';
    // Seedance 1.5 Pro 和 Kling 2.6
    if (
      modelIdLower.includes('seedance-1.5-pro') ||
      modelIdLower.includes('kling-v2-6-pro') ||
      modelIdLower.includes('t2v-seedance-1.5-pro') ||
      modelIdLower.includes('t2v-kling-v2-6-pro')
    ) {
      return 'Use quotation marks for speaking/singing content. For example: the character sings "look at the stars" (best with English or Chinese Mandarin).';
    }
    return "Please describe the video content you'd like to generate.";
  };

  // 获取上传图片的 label
  const getUploadImageLabel = (): string => {
    if (isSoraModel()) {
      return 'Upload Image (No realistic human figures)';
    }
    return 'Upload image';
  };

  // 获取动态分辨率选项
  const resolutionOptions = getI2VResolutionOptions().map((res) => ({
    value: res,
    label: res
  }));

  // 获取动态宽高比选项
  const aspectRatioOptions = getI2VAspectRatioOptions().map((ar) => ({
    value: ar,
    label: ar
  }));

  // 获取动态时长选项
  const durationOptions = (() => {
    const durationConfig = getI2VDurationOptions();
    if (durationConfig.type === 'select' && durationConfig.options) {
      return durationConfig.options.map((d: number) => ({
        value: String(d),
        label: `${d}s`
      }));
    }
    // Slider 模式暂时返回默认选项
    return [
      { value: '5', label: '5s' },
      { value: '10', label: '10s' }
    ];
  })();

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
  }, [aspectRatioOptions, formValues.aspectRatio, handleValueChange]);

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
      {/* Reference to Video 模式：显示 ReferenceToVideoParameter */}
      {capability.supportsResourceRefPrompt ? (
        <ReferenceToVideoParameter
          label='Reference Image'
          placeholder={getPromptPlaceholder()}
          value={i2vRefToVideoPrompt}
          maxImages={capability.maxRefImageCount}
          images={referenceImages}
          setImages={setReferenceImages}
          onChange={(val) => {
            handleValueChange('i2vRefToVideoPrompt', val);
            !val && handleValueChange('i2vPrompt', '');
          }}
        />
      ) : (
        <>
          {/* 单图 ｜ 首尾帧 */}
          {(capability.supportsSingleImage ||
            capability.supportsStartEndFrame) && (
            <VideoFrameUploadParameter
              label={getUploadImageLabel()}
              uploadConfig={{
                firstFrame: firstFrameImage || null,
                setFirstFrame: setFirstFrameImage,
                endFrame: lastFrameImage || null,
                setEndFrame: setLastFrameImage,
                addEndFrame,
                setAddEndFrame,
                onAssetSelect: startAssetSelect || (() => {})
              }}
              advanced={{
                hasEndFrame: capability.supportsStartEndFrame,
                firstFrameInputRef,
                endFrameInputRef,
                firstFrameDragOver,
                setFirstFrameDragOver,
                endFrameDragOver,
                setEndFrameDragOver
              }}
            />
          )}

          {/* 多图模式 */}
          {capability.supportsMultiImage && (
            <MultiImagesUploadBase
              label='Reference Image'
              maxImages={capability.maxRefImageCount}
              optional={capability.isInputImagesOptional}
              images={referenceImages}
              onImagesChange={setReferenceImages}
            />
          )}
        </>
      )}

      {/* 普通 Prompt */}
      {capability.supportsPositivePrompt && (
        <TextareaParameter
          label='Prompt'
          placeholder={getPromptPlaceholder()}
          value={formValues.i2vPrompt || ''}
          keyParam='i2vPrompt'
          onChange={(_key, val) => {
            handleValueChange('i2vPrompt', val);
            !val && handleValueChange('i2vRefToVideoPrompt', '');
          }}
          headerAction={
            <PromptHistoryPanel
              onSelect={(prompt) => handleValueChange('i2vPrompt', prompt)}
            />
          }
        />
      )}

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

      {/* Aspect Ratio - 仅在模型支持时显示 */}
      {capability.supportsRatio && aspectRatioOptions.length > 0 && (
        <SelectParameter
          label='Aspect Ratio'
          options={aspectRatioOptions}
          value={formValues.aspectRatio}
          defaultValue={aspectRatioOptions[0]?.value || '16:9'}
          paramKey='aspectRatio'
          onChange={(val) => handleValueChange('aspectRatio', val)}
        />
      )}

      {/* Resolution - 仅在模型支持多分辨率时显示 */}
      {capability.supportsResolution && resolutionOptions.length > 0 && (
        <SelectParameter
          label='Resolution'
          options={resolutionOptions}
          value={formValues.resolution}
          defaultValue={getMaxResolution()}
          onChange={(val) => handleValueChange('resolution', val)}
        />
      )}

      {/* Duration - 动态从模型获取 */}
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
        defaultValue={imageToVideoConfig.generationCount.defaultValue}
        min={imageToVideoConfig.generationCount.min}
        max={imageToVideoConfig.generationCount.max}
        step={imageToVideoConfig.generationCount.step}
        onChange={(val) => handleValueChange('generatingCount', val)}
      />
    </>
  );
}
