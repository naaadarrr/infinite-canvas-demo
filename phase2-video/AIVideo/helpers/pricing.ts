import { ModelSelectorModel } from '@/app/board/[id]/components/ToolPanel/types/model';
import { AIVideoFormValues } from '../store/atoms';
import { getAIVideoModelCapability } from './capability';

/**
 * 计算 AI Video 任务的积分成本
 * 根据模型的 pricing 配置和用户选择的参数计算
 */
export function calculateAIVideoCost(
  model: ModelSelectorModel | undefined | null,
  formValues: AIVideoFormValues
): { totalCost: number; unitCost: number } {
  if (!model?.pricing) return { totalCost: 0, unitCost: 0 };

  const capability = getAIVideoModelCapability(model);
  const pricing = model.pricing as Record<string, number>;

  // Video Edit 模式：按秒计费
  if (pricing.per_second) {
    const videoDuration = formValues.uploadedVideoDuration || 0;
    const roundedDuration = Math.ceil(videoDuration);
    const costPerGeneration = pricing.per_second * roundedDuration;
    return {
      totalCost: costPerGeneration * (formValues.generatingCount || 1),
      unitCost: costPerGeneration
    };
  }

  // 构造 pricing key
  let pricingKey = '';

  // 1. 如果有 resolution 参数
  if (capability.supportsResolution && formValues.resolution) {
    const resolutionNum = parseInt(formValues.resolution.replace(/\D/g, ''));
    pricingKey += `${resolutionNum}_`;
  }

  // 2. 添加 duration
  if (formValues.duration) {
    pricingKey += `${formValues.duration}`;
  }

  // 3. 如果支持音频且用户开启了
  if (capability.supportsNativeAudio && formValues.nativeAudio) {
    pricingKey += '_sound';
  }

  // 4. 查找对应的价格
  let cost = pricing[pricingKey];

  // 5. 如果找不到，尝试不带 resolution 的 key
  if (cost === undefined && capability.supportsResolution) {
    const fallbackKey = formValues.duration
      ? `${formValues.duration}${capability.supportsNativeAudio && formValues.nativeAudio ? '_sound' : ''}`
      : '';
    cost = pricing[fallbackKey];
  }

  // 6. 如果还找不到，尝试只用 duration
  if (cost === undefined && formValues.duration) {
    cost = pricing[formValues.duration.toString()];
  }

  // 7. 最后尝试使用 default
  if (cost === undefined) {
    cost = pricing.default;
  }

  // 8. 乘以生成数量
  const unitCost = cost || 0;
  const totalCost = unitCost * (formValues.generatingCount || 1);

  return { totalCost, unitCost };
}

/**
 * 获取 pricing key 用于调试
 */
export function getPricingKey(
  model: ModelSelectorModel | undefined | null,
  formValues: AIVideoFormValues
): string {
  if (!model) return '';

  const capability = getAIVideoModelCapability(model);
  let key = '';

  if (capability.supportsResolution && formValues.resolution) {
    const resolutionNum = parseInt(formValues.resolution.replace(/\D/g, ''));
    key += `${resolutionNum}_`;
  }

  if (formValues.duration) {
    key += `${formValues.duration}`;
  }

  if (capability.supportsNativeAudio && formValues.nativeAudio) {
    key += '_sound';
  }

  return key || 'default';
}
