// Video Avatar Templates Store

import { atom } from 'recoil-next';

// ========== Video Avatar Templates Filter 状态 ==========

/** 性别类型 */
export type GenderType = 'female' | 'male';

/** 排序类型 */
export type SortingType = 'popularity' | 'newest';

/** Video Avatar Templates 筛选器状态 */
export interface VideoAvatarFilterState {
  ethnicity: string[];
  gender: GenderType[];
  sorting: SortingType;
}

/** 默认筛选器状态 */
const DEFAULT_FILTER: VideoAvatarFilterState = {
  ethnicity: [],
  gender: [],
  sorting: 'popularity'
};

/** Video Avatar Templates 筛选器状态 */
export const videoAvatarFilterState = atom<VideoAvatarFilterState>({
  key: 'videoAvatarFilter',
  default: DEFAULT_FILTER
});

// ========== Video Avatar Templates 相关状态 ==========

/** 当前选中的分类 ID */
export const videoAvatarTemplateCategoryIdState = atom<string>({
  key: 'VideoAvatarTemplateCategoryIdState',
  default: 'all'
});

/** 分类展开状态 */
export const videoAvatarTemplateCategoryExpandedState = atom<boolean>({
  key: 'VideoAvatarTemplateCategoryExpandedState',
  default: false
});

/** localStorage key for Video Avatar Favorites */
const VIDEO_AVATAR_FAVORITES_STORAGE_KEY =
  'createhub_video_avatar_template_favorites';

/** 从 localStorage 获取收藏列表 */
const getVideoAvatarFavoritesFromStorage = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(VIDEO_AVATAR_FAVORITES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/** 收藏的模板 ID 列表（全局持久化） */
export const videoAvatarTemplateFavoritesState = atom<string[]>({
  key: 'VideoAvatarTemplateFavoritesState',
  default: [],
  effects: [
    ({ setSelf, onSet }) => {
      // 初始化时从 localStorage 读取
      if (typeof window !== 'undefined') {
        setSelf(getVideoAvatarFavoritesFromStorage());
      }

      // 状态变化时保存到 localStorage
      onSet((newValue) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            VIDEO_AVATAR_FAVORITES_STORAGE_KEY,
            JSON.stringify(newValue)
          );
        }
      });
    }
  ]
});

/** 是否只显示收藏 */
export const videoAvatarTemplateShowFavoritesOnlyState = atom<boolean>({
  key: 'VideoAvatarTemplateShowFavoritesOnlyState',
  default: false
});

// ========== My Video Avatar 相关状态 ==========

/** 用户自定义 Video Avatar 项目 */
export interface MyVideoAvatarItem {
  id: string;
  /** 视频 URL */
  videoUrl: string;
  /** 缩略图 URL */
  thumbnailUrl?: string;
  /** 创建时间 */
  createdAt: number;
  /** 名称（可选） */
  name?: string;
  /** 默认音色 ID */
  defaultVoiceId?: string;
  /** 处理状态：processing 处理中，completed 完成，failed 失败 */
  status?: 'processing' | 'completed' | 'failed';
  /** 处理进度 0-100 */
  progress?: number;
  /** 视频时长（秒） */
  duration?: number;
  /** 宽度 */
  width?: number;
  /** 高度 */
  height?: number;
}

/** localStorage key for My Video Avatar Favorites */
const MY_VIDEO_AVATAR_FAVORITES_STORAGE_KEY =
  'createhub_my_video_avatar_favorites';

/** 从 localStorage 获取 My Video Avatar 收藏列表 */
const getMyVideoAvatarFavoritesFromStorage = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(MY_VIDEO_AVATAR_FAVORITES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/** My Video Avatar 收藏的 ID 列表（全局持久化） */
export const myVideoAvatarFavoritesState = atom<string[]>({
  key: 'myVideoAvatarFavorites',
  default: [],
  effects: [
    ({ setSelf, onSet }) => {
      if (typeof window !== 'undefined') {
        setSelf(getMyVideoAvatarFavoritesFromStorage());
      }
      onSet((newValue) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            MY_VIDEO_AVATAR_FAVORITES_STORAGE_KEY,
            JSON.stringify(newValue)
          );
        }
      });
    }
  ]
});

/** localStorage key for My Video Avatar */
const MY_VIDEO_AVATAR_STORAGE_KEY = 'createhub_my_video_avatars';

/** 从 localStorage 获取 My Video Avatar 列表 */
const getMyVideoAvatarsFromStorage = (): MyVideoAvatarItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(MY_VIDEO_AVATAR_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/** 用户自定义 Video Avatar 列表 */
export const myVideoAvatarsState = atom<MyVideoAvatarItem[]>({
  key: 'myVideoAvatars',
  default: [],
  effects: [
    ({ setSelf, onSet }) => {
      // 初始化时从 localStorage 读取
      if (typeof window !== 'undefined') {
        setSelf(getMyVideoAvatarsFromStorage());
      }

      // 状态变化时保存到 localStorage
      onSet((newValue) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            MY_VIDEO_AVATAR_STORAGE_KEY,
            JSON.stringify(newValue)
          );
        }
      });
    }
  ]
});

// ========== 新用户引导相关状态 ==========

/** localStorage key for Video Avatar Templates button clicked state */
const VIDEO_AVATAR_TEMPLATE_BUTTON_CLICKED_KEY =
  'createhub_video_avatar_template_button_clicked';

/** 从 localStorage 获取是否已点击过 Video Avatar Templates 按钮 */
const getVideoAvatarTemplateButtonClickedFromStorage = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(
      VIDEO_AVATAR_TEMPLATE_BUTTON_CLICKED_KEY
    );
    return stored === 'true';
  } catch {
    return false;
  }
};

/** Video Avatar Templates 按钮点击状态（用于新用户引导动画） */
export const videoAvatarTemplateButtonClickedState = atom<boolean>({
  key: 'VideoAvatarTemplateButtonClickedState',
  default: false,
  effects: [
    ({ setSelf, onSet }) => {
      // 初始化时从 localStorage 读取
      if (typeof window !== 'undefined') {
        setSelf(getVideoAvatarTemplateButtonClickedFromStorage());
      }

      // 状态变化时保存到 localStorage
      onSet((newValue) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            VIDEO_AVATAR_TEMPLATE_BUTTON_CLICKED_KEY,
            String(newValue)
          );
        }
      });
    }
  ]
});
