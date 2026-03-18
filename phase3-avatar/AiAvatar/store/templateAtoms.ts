'use client';

import { atom } from 'recoil-next';

// ========== Avatar Templates 相关状态 ==========

/** Avatar Templates 当前选中的合集 ID */
export const avatarTemplateCollectionIdState = atom<string>({
  key: 'avatarTemplateCollectionId',
  default: 'all'
});

/** Avatar Templates 分类是否展开 */
export const avatarTemplateCategoryExpandedState = atom<boolean>({
  key: 'avatarTemplateCategoryExpanded',
  default: false
});

/** localStorage key for Favorites */
const FAVORITES_STORAGE_KEY = 'createhub_avatar_template_favorites';

/** 从 localStorage 获取收藏列表 */
const getFavoritesFromStorage = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/** Avatar Templates 收藏的模板 ID 列表（全局持久化） */
export const avatarTemplateFavoritesState = atom<string[]>({
  key: 'avatarTemplateFavorites',
  default: [],
  effects: [
    ({ setSelf, onSet }) => {
      // 初始化时从 localStorage 读取
      if (typeof window !== 'undefined') {
        setSelf(getFavoritesFromStorage());
      }

      // 状态变化时保存到 localStorage
      onSet((newValue) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newValue));
        }
      });
    }
  ]
});

/** Avatar Templates 是否只显示收藏 */
export const avatarTemplateShowFavoritesOnlyState = atom<boolean>({
  key: 'avatarTemplateShowFavoritesOnly',
  default: false
});

// ========== My Avatar 相关状态 ==========

/** 用户自定义 Avatar 项目 */
export interface MyAvatarItem {
  id: string;
  /** Avatar 图片 URL */
  imageUrl: string;
  /** 创建时间 */
  createdAt: number;
  /** 名称（可选） */
  name?: string;
  /** 默认音色 ID */
  defaultVoiceId?: string;
}

/** localStorage key for My Avatar Favorites */
const MY_AVATAR_FAVORITES_STORAGE_KEY = 'createhub_my_avatar_favorites';

/** 从 localStorage 获取 My Avatar 收藏列表 */
const getMyAvatarFavoritesFromStorage = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(MY_AVATAR_FAVORITES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/** My Avatar 收藏的 ID 列表（全局持久化） */
export const myAvatarFavoritesState = atom<string[]>({
  key: 'myAvatarFavorites',
  default: [],
  effects: [
    ({ setSelf, onSet }) => {
      if (typeof window !== 'undefined') {
        setSelf(getMyAvatarFavoritesFromStorage());
      }
      onSet((newValue) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            MY_AVATAR_FAVORITES_STORAGE_KEY,
            JSON.stringify(newValue)
          );
        }
      });
    }
  ]
});

/** localStorage key for My Avatar */
const MY_AVATAR_STORAGE_KEY = 'createhub_my_avatars';

/** 从 localStorage 获取 My Avatar 列表 */
const getMyAvatarsFromStorage = (): MyAvatarItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(MY_AVATAR_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/** 用户自定义 Avatar 列表 */
export const myAvatarsState = atom<MyAvatarItem[]>({
  key: 'myAvatars',
  default: [],
  effects: [
    ({ setSelf, onSet }) => {
      // 初始化时从 localStorage 读取
      if (typeof window !== 'undefined') {
        setSelf(getMyAvatarsFromStorage());
      }

      // 状态变化时保存到 localStorage
      onSet((newValue) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(MY_AVATAR_STORAGE_KEY, JSON.stringify(newValue));
        }
      });
    }
  ]
});

// ========== 新用户引导相关状态 ==========

/** localStorage key for Avatar Templates button clicked state */
const AVATAR_TEMPLATE_BUTTON_CLICKED_KEY =
  'createhub_avatar_template_button_clicked';

/** 从 localStorage 获取是否已点击过 Avatar Templates 按钮 */
const getAvatarTemplateButtonClickedFromStorage = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(AVATAR_TEMPLATE_BUTTON_CLICKED_KEY);
    return stored === 'true';
  } catch {
    return false;
  }
};

/** Avatar Templates 按钮是否已被点击过（用于新用户引导动效） */
export const avatarTemplateButtonClickedState = atom<boolean>({
  key: 'avatarTemplateButtonClicked',
  default: false,
  effects: [
    ({ setSelf, onSet }) => {
      // 初始化时从 localStorage 读取
      if (typeof window !== 'undefined') {
        setSelf(getAvatarTemplateButtonClickedFromStorage());
      }

      // 状态变化时保存到 localStorage
      onSet((newValue) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            AVATAR_TEMPLATE_BUTTON_CLICKED_KEY,
            String(newValue)
          );
        }
      });
    }
  ]
});
