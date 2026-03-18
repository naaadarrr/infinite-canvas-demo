'use client';

import { atom } from 'recoil-next';
import type { GenderType, SortingType } from '../data/templates';
import { ProductAvatarCategoryId } from '../type';

// ========== Product Avatar Templates Filter 状态 ==========

/** Product Avatar Templates 筛选器状态 */
export interface ProductAvatarFilterState {
  ethnicity: string[];
  gender: GenderType[];
  sorting: SortingType;
}

/** 默认筛选器状态 */
const DEFAULT_FILTER: ProductAvatarFilterState = {
  ethnicity: [],
  gender: [],
  sorting: 'popularity'
};

/** Product Avatar Templates 筛选器状态 */
export const productAvatarFilterState = atom<ProductAvatarFilterState>({
  key: 'productAvatarFilter',
  default: DEFAULT_FILTER
});

// ========== Product Avatar Templates 相关状态 ==========

/** Product Avatar Templates 当前选中的分类 ID */
export const productAvatarTemplateCategoryIdState = atom<string>({
  key: 'productAvatarTemplateCategoryId',
  default: ProductAvatarCategoryId.ALL
});

/** Product Avatar Templates 当前选中的合集 ID */
export const productAvatarTemplateCollectionIdState = atom<string>({
  key: 'productAvatarTemplateCollectionId',
  default: ProductAvatarCategoryId.ALL
});

/** Product Avatar Templates 分类是否展开 */
export const productAvatarTemplateCategoryExpandedState = atom<boolean>({
  key: 'productAvatarTemplateCategoryExpanded',
  default: false
});

/** localStorage key for Product Avatar Favorites */
const PRODUCT_AVATAR_FAVORITES_STORAGE_KEY =
  'createhub_product_avatar_template_favorites';

/** 从 localStorage 获取收藏列表 */
const getProductAvatarFavoritesFromStorage = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(PRODUCT_AVATAR_FAVORITES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/** Product Avatar Templates 收藏的模板 ID 列表（全局持久化） */
export const productAvatarTemplateFavoritesState = atom<string[]>({
  key: 'productAvatarTemplateFavorites',
  default: [],
  effects: [
    ({ setSelf, onSet }) => {
      // 初始化时从 localStorage 读取
      if (typeof window !== 'undefined') {
        setSelf(getProductAvatarFavoritesFromStorage());
      }

      // 状态变化时保存到 localStorage
      onSet((newValue) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            PRODUCT_AVATAR_FAVORITES_STORAGE_KEY,
            JSON.stringify(newValue)
          );
        }
      });
    }
  ]
});

/** Product Avatar Templates 是否只显示收藏 */
export const productAvatarTemplateShowFavoritesOnlyState = atom<boolean>({
  key: 'productAvatarTemplateShowFavoritesOnly',
  default: false
});

// ========== My Product Avatar 相关状态 ==========
// 注意：myProductAvatarsState 目前仅被 CharacterSwapModal 使用
// 该功能可能需要后续改为调用 API 而不是使用本地状态

/** localStorage key for My Product Avatar */
const MY_PRODUCT_AVATAR_STORAGE_KEY = 'createhub_my_product_avatars';

/** 从 localStorage 获取 My Product Avatar 列表 */
const getMyProductAvatarsFromStorage = (): unknown[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(MY_PRODUCT_AVATAR_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/** 用户自定义 Product Avatar 列表（临时状态，用于 CharacterSwapModal） */
export const myProductAvatarsState = atom<unknown[]>({
  key: 'myProductAvatars',
  default: [],
  effects: [
    ({ setSelf, onSet }) => {
      // 初始化时从 localStorage 读取
      if (typeof window !== 'undefined') {
        setSelf(getMyProductAvatarsFromStorage());
      }

      // 状态变化时保存到 localStorage
      onSet((newValue) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            MY_PRODUCT_AVATAR_STORAGE_KEY,
            JSON.stringify(newValue)
          );
        }
      });
    }
  ]
});

// ========== 新用户引导相关状态 ==========

/** localStorage key for Product Avatar Templates button clicked state */
const PRODUCT_AVATAR_TEMPLATE_BUTTON_CLICKED_KEY =
  'createhub_product_avatar_template_button_clicked';

/** 从 localStorage 获取是否已点击过 Product Avatar Templates 按钮 */
const getProductAvatarTemplateButtonClickedFromStorage = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(
      PRODUCT_AVATAR_TEMPLATE_BUTTON_CLICKED_KEY
    );
    return stored === 'true';
  } catch {
    return false;
  }
};

/** Product Avatar Templates 按钮是否已被点击过（用于新用户引导动效） */
export const productAvatarTemplateButtonClickedState = atom<boolean>({
  key: 'productAvatarTemplateButtonClicked',
  default: false,
  effects: [
    ({ setSelf, onSet }) => {
      // 初始化时从 localStorage 读取
      if (typeof window !== 'undefined') {
        setSelf(getProductAvatarTemplateButtonClickedFromStorage());
      }

      // 状态变化时保存到 localStorage
      onSet((newValue) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            PRODUCT_AVATAR_TEMPLATE_BUTTON_CLICKED_KEY,
            String(newValue)
          );
        }
      });
    }
  ]
});
