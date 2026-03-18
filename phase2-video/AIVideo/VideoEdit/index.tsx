// Video Edit 工具表单组件

import { useRef, useCallback } from 'react';
import { useRecoilState } from 'recoil-next';
import { videoEditConfig } from './config';
import { VideoUploadBase } from '@/app/board/[id]/components/ToolPanel/components/uploads/VideoUploadBase';
import { ReferenceToVideoParameter } from '../components/ReferenceToVideoParameter';
import { SwitchParameter } from '@/app/board/[id]/components/ToolPanel/components/inputs/SwitchParameter';
import { SelectParameter } from '@/app/board/[id]/components/ToolPanel/components/inputs/SelectParameter';
import { SliderParameter } from '@/app/board/[id]/components/ToolPanel/components/inputs/SliderParameter';
import { useVideoModelConfig } from '../hooks/useVideoModelConfig';
import { getAIVideoModelCapability } from '../helpers/capability';
import { useActiveTabId } from '@/app/board/[id]/components/ToolPanel/hooks/useActiveTabId';
import { aiVideoFormFamily, AIVideoFormValues } from '../store/atoms';

export function VideoEdit() {
  // 获取当前活动的 Tab ID
  const tabId = useActiveTabId();

  // 从模块独立 store 获取状态
  const [formValues, setFormValues] = useRecoilState(aiVideoFormFamily(tabId));

  // 获取模型配置
  const { currentModel } = useVideoModelConfig();

  // 使用能力判定工具获取当前模型能力
  const capability = getAIVideoModelCapability(currentModel as any);

  // 从 formValues 获取 Video Edit 相关状态
  const uploadedVideo = formValues.uploadedVideo;
  const veReferenceImages = formValues.veReferenceImages;
  const veRefToVideoPrompt = formValues.veRefToVideoPrompt;

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

  // 设置上传的视频
  const setUploadedVideo = useCallback(
    (video: string | null) =>
      handleValueChange('uploadedVideo', video ?? undefined),
    [handleValueChange]
  );

  // 设置 VE 参考图片（支持函数形式更新）
  const setVeReferenceImages = useCallback(
    (images: string[] | ((prev: string[]) => string[])) => {
      if (typeof images === 'function') {
        setFormValues((prev) => ({
          ...prev,
          veReferenceImages: images(prev.veReferenceImages || [])
        }));
      } else {
        handleValueChange('veReferenceImages', images);
      }
    },
    [handleValueChange, setFormValues]
  );

  // 设置 VE 参考视频提示词
  const setVeRefToVideoPrompt = useCallback(
    (prompt: string) => handleValueChange('veRefToVideoPrompt', prompt),
    [handleValueChange]
  );
  const veRefToVideoPromptRef = useRef<HTMLDivElement>(null);

  // 注意：视频 tag 的自动添加/删除逻辑已由 ReferenceToVideoParameter 组件统一处理
  // 不再需要在这里手动处理

  return (
    <>
      <VideoUploadBase
        label='Upload Video'
        placeholder='Upload a 3-10s video clip to edit'
        video={uploadedVideo ?? null}
        setVideo={setUploadedVideo}
        onVideoDurationChange={(duration) =>
          handleValueChange('uploadedVideoDuration', duration)
        }
        limits={{
          maxDuration: 10
        }}
        aspectRatio='video'
      />

      {/* Reference Image + Prompt with @ mention */}
      <ReferenceToVideoParameter
        label='Reference Image'
        placeholder='Upload a 3-10s video clip and use text or images to easily modify content, change camera angles, or restyle the original video. Use @ to quickly insert added assets.'
        value={veRefToVideoPrompt}
        maxImages={4}
        images={veReferenceImages || []}
        setImages={setVeReferenceImages}
        onChange={(val) => {
          setVeRefToVideoPrompt(val);
          // 注意：VideoEdit 只更新 veRefToVideoPrompt，不更新共享的 prompt 字段
          // 避免 VideoEdit 的 prompt 出现在其他工具类型中
        }}
        uploadedVideo={uploadedVideo || undefined}
        setUploadedVideo={setUploadedVideo}
        isVideoEdit={true}
        promptRef={veRefToVideoPromptRef}
      />

      {capability.supportsKeepVideoSound && (
        <SwitchParameter
          label='Keep Video Sound'
          value={formValues.keepVideoSound}
          defaultValue={true}
          onChange={(val) => handleValueChange('keepVideoSound', val)}
        />
      )}

      {capability.supportsVideoEditMode && (
        <SelectParameter
          label='Video Edit Mode'
          options={[...videoEditConfig.videoEditModeOptions]}
          value={formValues.videoEditMode}
          defaultValue={videoEditConfig.defaultVideoEditMode}
          stacked={true}
          onChange={(val) => handleValueChange('videoEditMode', val)}
        />
      )}

      {capability.supportsResolution && (
        <SelectParameter
          label='Resolution'
          options={[...videoEditConfig.resolutionOptions]}
          value={formValues.resolution}
          defaultValue={videoEditConfig.defaultResolution}
          onChange={(val) => handleValueChange('resolution', val)}
        />
      )}

      <SliderParameter
        label='Generating Count'
        value={formValues.generatingCount}
        defaultValue={videoEditConfig.generatingCount.defaultValue}
        min={videoEditConfig.generatingCount.min}
        max={videoEditConfig.generatingCount.max}
        step={videoEditConfig.generatingCount.step}
        onChange={(val) => handleValueChange('generatingCount', val)}
      />
    </>
  );
}
