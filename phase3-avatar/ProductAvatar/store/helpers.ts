/**
 * ProductAvatar 表单值转换辅助函数
 * 将前端表单值转换为接口参数
 */

import type {
  PromptReplaceProductAutoModeTaskSubmitParam,
  PromptReplaceProductManualModeTaskSubmitParam,
  RectangleCorners
} from '@/server/api/services/productAvatar/task/type';
import type {
  ProductAvatarFormValues,
  ProductAvatarAutoModeFormValues,
  ProductAvatarManualModeFormValues,
  ProductTransform
} from './atoms';
import { ProductAvatarGenerateMode } from './atoms';

/**
 * 将 productTransform 转换为 location（RectangleCorners）
 * @param transform 产品变换数据
 * @param imageWidth 图片宽度
 * @param imageHeight 图片高度
 * @returns 位置信息
 */
export function transformToLocation(
  transform: ProductTransform,
  imageWidth: number,
  imageHeight: number
): RectangleCorners {
  // 计算产品在画布中的位置
  // 这里需要根据实际的合成画布逻辑来计算
  // 暂时返回一个示例实现
  const { x, y, scale } = transform;

  // 假设产品原始尺寸为 100x100（实际应该从产品图片获取）
  const productWidth = 100 * scale;
  const productHeight = 100 * scale;

  // 计算四个角点（相对于图片的归一化坐标）
  const leftTop: [number, number] = [x / imageWidth, y / imageHeight];
  const rightTop: [number, number] = [
    (x + productWidth) / imageWidth,
    y / imageHeight
  ];
  const rightBottom: [number, number] = [
    (x + productWidth) / imageWidth,
    (y + productHeight) / imageHeight
  ];
  const leftBottom: [number, number] = [
    x / imageWidth,
    (y + productHeight) / imageHeight
  ];

  return [leftTop, rightTop, rightBottom, leftBottom];
}

/**
 * 将 Auto Mode 表单值转换为接口参数
 */
export function convertAutoModeFormValuesToParams(
  formValues: ProductAvatarAutoModeFormValues,
  additionalParams?: Partial<PromptReplaceProductAutoModeTaskSubmitParam>
): PromptReplaceProductAutoModeTaskSubmitParam {
  return {
    // 基础字段
    avatarId: formValues.avatarId,
    userFaceImagePath: formValues.avatarTemplateUrl || undefined,
    productImagePath:
      formValues.productImagePath || formValues.productImageUrl || undefined,

    // 其他参数
    ...additionalParams
  };
}

/**
 * 将 Manual Mode 表单值转换为接口参数
 */
export function convertManualModeFormValuesToParams(
  formValues: ProductAvatarManualModeFormValues,
  additionalParams?: Partial<PromptReplaceProductManualModeTaskSubmitParam>
): PromptReplaceProductManualModeTaskSubmitParam {
  return {
    // 基础字段
    avatarId: formValues.avatarId,
    userFaceImagePath: formValues.avatarTemplateUrl || undefined,
    productImagePath:
      formValues.productImagePath || formValues.productImageUrl || undefined,

    // Manual Mode 特定字段
    productImageWithoutBackground: formValues.productImageWithoutBackground,
    location: formValues.location,
    type: formValues.type,

    // 其他参数
    ...additionalParams
  };
}

/**
 * 根据模式将表单值转换为对应的接口参数
 */
export function convertFormValuesToParams(
  formValues: ProductAvatarFormValues,
  additionalParams?: Partial<
    | PromptReplaceProductAutoModeTaskSubmitParam
    | PromptReplaceProductManualModeTaskSubmitParam
  >
):
  | PromptReplaceProductAutoModeTaskSubmitParam
  | PromptReplaceProductManualModeTaskSubmitParam {
  if (formValues.mode === ProductAvatarGenerateMode.AUTO) {
    return convertAutoModeFormValuesToParams(formValues, additionalParams);
  } else {
    return convertManualModeFormValuesToParams(formValues, additionalParams);
  }
}

/**
 * 类型守卫：判断是否为 Auto Mode
 */
export function isAutoMode(
  formValues: ProductAvatarFormValues
): formValues is ProductAvatarAutoModeFormValues {
  return formValues.mode === ProductAvatarGenerateMode.AUTO;
}

/**
 * 类型守卫：判断是否为 Manual Mode
 */
export function isManualMode(
  formValues: ProductAvatarFormValues
): formValues is ProductAvatarManualModeFormValues {
  return formValues.mode === ProductAvatarGenerateMode.MANUAL;
}
