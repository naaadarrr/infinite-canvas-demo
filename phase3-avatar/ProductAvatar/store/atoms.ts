/**
 * ProductAvatar 模块独立 Store
 * 产品 Avatar 工具的表单状态
 */

import { atomFamily } from 'recoil-next';
import {
  ProductAvatarGenerateMode,
  type RectangleCorners,
  type PromptReplaceProductTaskType
} from '@/server/api/services/productAvatar/task/type';
import { TaskStatus } from '@/server/api/services/_common/type';
import type { RESOURCE_SUBS_TYPE } from '@/types/benefit/resources';

// 重新导出枚举供其他模块使用
export { ProductAvatarGenerateMode };

/**
 * 产品位置和变换数据（前端使用）
 */
export interface ProductTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

/**
 * ProductAvatar 表单值基础字段（两种模式共有）
 */
interface ProductAvatarFormValuesBase {
  /** 当前选中的 Avatar ID */
  avatarId?: string;
  /** Avatar 头像照片 URL */
  avatarTemplateUrl?: string;
  /** 当前所选模板要求的最低订阅类型（仅从模板库选择时有值） */
  templateMinSubsType?: RESOURCE_SUBS_TYPE;
  /** 模板图片 URL（用户上传的模板图片） */
  templateImageUrl?: string;
  /** 模板图片路径（用户上传的模板图片） */
  templateImagePath?: string;
  /** 模板图片资源 ID */
  inputImageResourceId?: string;
  /** 产品图片 URL */
  productImageUrl?: string;
  /** 产品图片路径 */
  productImagePath?: string;
}

/**
 * Auto Mode 表单值
 */
export interface ProductAvatarAutoModeFormValues extends ProductAvatarFormValuesBase {
  mode: ProductAvatarGenerateMode.AUTO;
}

/**
 * Manual Mode 表单值
 */
export interface ProductAvatarManualModeFormValues extends ProductAvatarFormValuesBase {
  mode: ProductAvatarGenerateMode.MANUAL;
  /** 无背景的产品图片 s3Path（用于提交任务） */
  productImageWithoutBackground?: string;
  /** 无背景的产品图片 CDN URL（用于显示） */
  productImageWithoutBackgroundUrl?: string;
  /** 手绘产品遮罩 s3Path（用于提交任务） */
  handPaintedProductMaskPath?: string;
  /** 手绘产品遮罩 CDN URL（用于显示） */
  handPaintedProductMaskUrl?: string;
  /** 位置信息. 格式：[[float, float]], 元素位置代表信息 [left_top, right_top, left_bottom, right_bottom] */
  location?: RectangleCorners;
  /** 0-叠图 1-双拼 */
  type?: PromptReplaceProductTaskType;
  /** 产品位置和变换数据（前端使用，用于合成画布） */
  productTransform?: ProductTransform;
}

/**
 * ProductAvatar 表单值类型（Discriminated Union）
 */
export type ProductAvatarFormValues =
  | ProductAvatarAutoModeFormValues
  | ProductAvatarManualModeFormValues;

/**
 * Auto Mode 默认值
 */
export const DEFAULT_PRODUCT_AVATAR_AUTO_VALUES: ProductAvatarAutoModeFormValues =
  {
    mode: ProductAvatarGenerateMode.AUTO,
    avatarId: '',
    avatarTemplateUrl: undefined,
    productImageUrl: undefined,
    productImagePath: undefined,
    templateImageUrl: undefined,
    templateImagePath: undefined
  };

/**
 * Manual Mode 默认值
 */
export const DEFAULT_PRODUCT_AVATAR_MANUAL_VALUES: ProductAvatarManualModeFormValues =
  {
    mode: ProductAvatarGenerateMode.MANUAL,
    avatarId: '',
    avatarTemplateUrl: undefined,
    productImageUrl: undefined,
    productImagePath: undefined,
    templateImageUrl: undefined,
    templateImagePath: undefined,
    productImageWithoutBackground: undefined,
    productImageWithoutBackgroundUrl: undefined,
    handPaintedProductMaskPath: undefined,
    handPaintedProductMaskUrl: undefined,
    location: undefined,
    type: undefined,
    productTransform: undefined
  };

/**
 * 默认值（根据模式返回对应的默认值）
 */
export const DEFAULT_PRODUCT_AVATAR_VALUES: ProductAvatarFormValues =
  DEFAULT_PRODUCT_AVATAR_AUTO_VALUES;

/**
 * 按 TabId 隔离的 ProductAvatar 表单状态
 */
export const productAvatarFormFamily = atomFamily<
  ProductAvatarFormValues,
  string
>({
  key: 'productAvatarForm',
  default: DEFAULT_PRODUCT_AVATAR_VALUES
});

/**
 * 移除图片背景任务状态接口
 */
export interface RemoveImageBackgroundTaskState {
  taskId: string;
  status: TaskStatus | string;
}

/**
 * 按 TabId 隔离的移除图片背景任务状态
 * 与 productAvatarFormFamily 使用相同的 tabId 参数，确保任务状态与表单数据对应
 */
export const removeImageBackgroundTaskFamily = atomFamily<
  RemoveImageBackgroundTaskState,
  string
>({
  key: 'removeImageBackgroundTask',
  default: {
    taskId: '',
    status: TaskStatus.FAIL
  }
});

/**
 * Re-edit loading 状态（按 tabId 隔离）
 * 用于在 re-edit 时获取 URL 的过程中显示 loading
 */
export const reEditLoadingFamily = atomFamily<boolean, string>({
  key: 'productAvatarReEditLoading',
  default: false
});
