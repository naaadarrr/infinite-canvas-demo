/* v3 版本 - Prompt 图像替换任务配置 */
export const PROMPT_OBJECT_REPLACE_TASK_GENERATE_COUNT = 2;
export const PROMPT_OBJECT_REPLACE_TASK_IMAGE_COUNT = 1;
export const PROMPT_OBJECT_REPLACE_TASK_CREDIT_CONSUMPTION = 0.5;

/* Manual 模式配置 */
export const MANUAL_OBJECT_REPLACE_TASK_GENERATE_COUNT = 2;
export const MANUAL_OBJECT_REPLACE_TASK_IMAGE_COUNT = 1;
export const MANUAL_OBJECT_REPLACE_TASK_CREDIT_CONSUMPTION = 0.5;

/* 图片上传配置 */
export const PRODUCT_AVATAR_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';
export const PRODUCT_AVATAR_IMAGE_MAX_SIZE = 10 * 1024 * 1024; // 10MB
export const PRODUCT_AVATAR_PRODUCT_IMAGE_S3_PATH_PREFIX =
  'analyzed_video/task/product_avatar/user_image';
export const PRODUCT_AVATAR_TEMPLATE_IMAGE_S3_PATH_PREFIX =
  'analyzed_video/task/product_avatar/user_product_avatar_template_image';
export const PRODUCT_AVATAR_MASK_IMAGE_S3_PATH_PREFIX =
  'analyzed_video/task/product_avatar/user_product_avatar_mask_image';
export const PRODUCT_AVATAR_CHARACTER_IMAGE_S3_PATH_PREFIX =
  'analyzed_video/task/pa_character_swap/upload';

/* 图片处理配置 */
export const IMAGE_MAX_WIDTH = 1024;
export const IMAGE_MAX_HEIGHT = 1024;
export const IMAGE_MAX_RESIZE_QUALITY = 0.9;
export const DEFAULT_PROCESS_IMAGE_FORMAT = 'jpeg';

/* 任务来源配置 */
import { TaskSource } from '@/server/api/services/_common/type';

/**
 * Board 任务来源常量
 * 所有使用 boardTaskId 的任务接口都需要传递此值
 */
export const TASK_SOURCE_BOARD = TaskSource.BOARD;

/* 拖拽和上传相关常量 */
export const DRAG_DATA_FORMAT_JSON = 'application/json';
export const ASSET_TYPE_AVATAR_PHOTO = 'avatarPhoto';
export const IMAGE_MIME_TYPE_PREFIX = 'image/';
