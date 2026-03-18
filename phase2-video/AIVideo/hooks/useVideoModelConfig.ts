import { useMemo } from 'react';
import { useRecoilValue } from 'recoil-next';
import { currentToolTypeState } from '@/app/board/[id]/components/ToolPanel/store';
import { ToolType } from '@/app/board/[id]/components/ToolPanel/types';
import type { ModelSelectorProvider } from '@/app/board/[id]/components/ToolPanel/types/model';
import { useActiveTabId } from '@/app/board/[id]/components/ToolPanel/hooks/useActiveTabId';
import { aiVideoFormFamily } from '../store/atoms';
import { useAiVideoConfigQuery } from '../data/useQueries';

// AI Video 工具组
const AI_VIDEO_TOOLS = [
  ToolType.ImageToVideo,
  ToolType.TextToVideo,
  ToolType.VideoEdit
] as const;

/**
 * Video 工具模型配置 Hook
 * 提供当前工具类型对应的 providers、当前模型、参数选项等
 */
export function useVideoModelConfig() {
  const currentToolType = useRecoilValue(currentToolTypeState);
  const tabId = useActiveTabId();
  const formValues = useRecoilValue(aiVideoFormFamily(tabId));
  const currentModelId = formValues.modelId;

  // 获取真实 API 数据
  const { data: configData, isLoading } = useAiVideoConfigQuery();

  // 确保当前工具类型在 AI Video 组内
  const activeToolType = AI_VIDEO_TOOLS.includes(currentToolType as any)
    ? (currentToolType as (typeof AI_VIDEO_TOOLS)[number])
    : ToolType.ImageToVideo;

  // 获取当前工具类型对应的 providers
  const providers = useMemo((): ModelSelectorProvider[] => {
    if (!configData?.data) return [];
    const { imageToVideo, textToVideo, videoEdit } = configData.data;

    if (activeToolType === ToolType.ImageToVideo) return imageToVideo as any;
    if (activeToolType === ToolType.TextToVideo) return textToVideo as any;
    if (activeToolType === ToolType.VideoEdit) return videoEdit as any;

    return [];
  }, [configData, activeToolType]);

  // 查找当前模型
  const currentModel = useMemo(() => {
    if (!currentModelId || !providers.length) return undefined;

    for (const provider of providers) {
      const model = provider.models?.find((m: any) => m.id === currentModelId);
      if (model) return model;
    }
    return undefined;
  }, [providers, currentModelId]);

  // 获取当前表单值
  const currentResolution = formValues.resolution;
  const currentRatio = formValues.aspectRatio;
  const currentDuration = formValues.duration;

  // 获取动态联动后的参数限制
  const parameterLimits = useMemo(() => {
    if (!currentModel?.parameters) return null;

    const { parameters } = currentModel;
    const {
      dynamicParameters,
      durationByResolution,
      resolutions,
      ratios,
      durations
    } = parameters;

    // 初始限制为模型定义的全部范围
    let limitedResolutions = resolutions || [];
    let limitedRatios = ratios || [];
    let limitedDurations = durations || [];

    // 1. 处理 dynamicParameters (优先级最高)
    if (dynamicParameters && dynamicParameters.length > 0) {
      dynamicParameters.forEach((config: any) => {
        const { conditions, limits } = config;

        // 检查是否满足所有条件
        const isMatch = Object.entries(conditions).every(([key, value]) => {
          if (key === 'resolution') return currentResolution === value;
          if (key === 'ratio') return currentRatio === value;
          if (key === 'duration') return currentDuration === value;
          return true;
        });

        if (isMatch) {
          if (limits.resolutions)
            limitedResolutions = limitedResolutions.filter((r: number) =>
              limits.resolutions?.includes(r)
            );
          if (limits.ratios)
            limitedRatios = limitedRatios.filter((r: string) =>
              limits.ratios?.includes(r)
            );
          if (limits.durations)
            limitedDurations = limitedDurations.filter((d: number) =>
              limits.durations?.includes(d)
            );
        }
      });
    }

    // 2. 处理旧的 durationByResolution (兼容逻辑)
    if (durationByResolution && currentResolution) {
      const resKey = String(currentResolution).replace('p', '');
      if (durationByResolution[resKey]) {
        limitedDurations = limitedDurations.filter((d: number) =>
          durationByResolution[resKey].includes(d)
        );
      }
    }

    return {
      resolutions: limitedResolutions,
      ratios: limitedRatios,
      durations: limitedDurations
    };
  }, [currentModel, currentResolution, currentRatio, currentDuration]);

  // 判断参数是否应该显示
  const shouldShowI2VParam = (paramKey: string): boolean => {
    if (!currentModel) return true;

    // 根据 API 返回的 parameters 进行判断
    const params = currentModel.parameters;

    switch (paramKey) {
      case 'nativeAudio':
        // 生产环境中使用 capability 判断，这里根据参数映射
        return true;
      case 'resolution':
        return (params?.resolutions?.length ?? 0) > 0;
      case 'aspectRatio':
        return (params?.ratios?.length ?? 0) > 0;
      case 'duration':
        return (params?.durations?.length ?? 0) > 0;
      default:
        return true;
    }
  };

  // 获取时长选项
  const getI2VDurationOptions = () => {
    const options = parameterLimits?.durations ||
      currentModel?.parameters?.durations || [5, 10];
    return { type: 'select' as const, options };
  };

  // 获取分辨率选项
  const getI2VResolutionOptions = (): string[] => {
    const options = parameterLimits?.resolutions ||
      currentModel?.parameters?.resolutions || [720, 1080];
    return options.map((r: number) => {
      if (r === 4320) return '8K';
      if (r === 2880) return '5K';
      if (r === 2160) return '4K';
      if (r === 1440) return '2K';
      return `${r}p`;
    });
  };

  // 获取宽高比选项
  const getI2VAspectRatioOptions = (): string[] => {
    return (
      parameterLimits?.ratios ||
      currentModel?.parameters?.ratios || ['16:9', '9:16', '1:1']
    );
  };

  return {
    // 基础数据
    providers,
    currentModel,
    activeToolType,
    isLoading,
    // 参数配置
    shouldShowI2VParam,
    getI2VDurationOptions,
    getI2VResolutionOptions,
    getI2VAspectRatioOptions
  };
}
