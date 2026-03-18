/**
 * 用户菜单相关类型定义
 *
 * @module components/types
 */

// ==================== 菜单项配置 ====================

/**
 * 用户菜单项配置
 *
 * 用于驱动 UserMenuContent 的菜单项渲染
 *
 * @example
 * ```tsx
 * const items: UserMenuItemConfig[] = [
 *   { id: "home", label: "Home", icon: Home, group: "main", onClick: () => router.push("/home") },
 *   { id: "logout", label: "Logout", icon: LogOut, variant: "logout", onClick: handleLogout },
 * ];
 * ```
 */
export interface UserMenuItemConfig {
  /** 菜单项唯一标识 */
  id: string;
  /** 显示文本 */
  label: string;
  /** 图标组件 (lucide-react 兼容) */
  icon: React.ComponentType<{ className?: string }>;
  /** 点击回调 */
  onClick?: () => void;
  /** 分组标识, 不同 group 之间渲染分隔线 */
  group?: string;
  /** 变体样式 */
  variant?: "default" | "logout";
  /** 是否隐藏 */
  hidden?: boolean;
  /**
   * 菜单项类型
   * - "default": 普通菜单项 (默认)
   * - "language": 语言选择器, 点击展开语言列表
   */
  type?: "default" | "language";
}

// ==================== UserMenuItem ====================

export interface UserMenuItemProps {
  /** 图标组件 */
  icon: React.ComponentType<{ className?: string }>;
  /** 菜单项文本 */
  label: string;
  /** 是否显示右侧箭头 */
  showChevron?: boolean;
  /** 点击回调 */
  onClick?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 变体样式 */
  variant?: "default" | "logout";
  /** 紧凑模式 */
  compact?: boolean;
}

// ==================== UserMenuHeader ====================

export interface UserMenuHeaderProps {
  /** 用户头像 URL */
  userAvatarUrl?: string;
  /** 用户名 */
  userName?: string;
  /** 用户邮箱 */
  userEmail?: string;
  /** 编辑名称的异步保存回调 */
  onNameSave?: (newName: string) => Promise<void>;
  /** 名称变更后的本地状态回调 (乐观更新) */
  onNameChange?: (newName: string) => void;
  /** Toast 通知回调 */
  onToast?: (message: string, type: "success" | "error") => void;
  /** 自定义验证函数 */
  validateName?: (name: string) => string;
  /** 紧凑模式 */
  compact?: boolean;
  /** 自定义类名 */
  className?: string;
}

// ==================== UserMenuContent ====================

export interface UserMenuContentProps {
  /** 菜单项配置列表 */
  items?: UserMenuItemConfig[];
  /** 紧凑模式 */
  compact?: boolean;
  /** 登出回调 — 传入则显示 Logout 菜单项 */
  onLogout?: () => Promise<void>;
  /** 自定义类名 */
  className?: string;

  // ========== 语言选择器 ==========

  /** 当前语言 (有 type="language" 菜单项时需传入) */
  currentLanguage?: string;
  /** 语言变更回调 */
  onLanguageChange?: (language: string) => void;
  /**
   * 可选语言列表
   * @default DEFAULT_LANGUAGES
   */
  languages?: string[];
}

// ==================== LanguageSelector ====================

export interface LanguageSelectorProps {
  /** 当前选中的语言 */
  currentLanguage: string;
  /** 语言变更回调 */
  onSelect: (language: string) => void;
  /** 可选语言列表 */
  languages: string[];
  /** 紧凑模式 */
  compact?: boolean;
  /** 触发器内容 (hover 触发弹出) */
  children: React.ReactNode;
}

/** 内置默认语言列表 */
export const DEFAULT_LANGUAGES = [
  "English",
  "Português",
  "Español",
  "Français",
  "Deutsch",
  "Русский",
  "Tiếng Việt",
  "Bahasa Melayu",
  "Bahasa Indonesia",
  "简体中文",
  "繁體中文",
  "العربية",
  "日本語",
  "한국어",
];

// ==================== EditNameModal ====================

export interface EditNameModalProps {
  /** 是否打开 */
  open: boolean;
  /** 打开状态变更回调 */
  onOpenChange: (open: boolean) => void;
  /** 当前名称 */
  currentName?: string;
  /** 保存回调 — 返回 Promise, 组件内部管理 loading 状态 */
  onSave?: (newName: string) => Promise<void>;
  /** Toast 通知回调 — 不传则静默 */
  onToast?: (message: string, type: "success" | "error") => void;
  /** 自定义验证函数 — 不传则用内置 defaultValidateUserName */
  validateName?: (name: string) => string;
}

// ==================== 内置验证函数 ====================

/**
 * 默认用户名验证
 *
 * 支持中文、日文、韩文、泰文、英文、数字、空格、-、_
 * 长度 3-16 字符
 *
 * @param name - 用户名
 * @returns 错误信息, 空字符串表示验证通过
 */
export function defaultValidateUserName(name: string): string {
  if (name.length < 3 || name.length > 16) {
    return "Username must be between 3 and 16 characters";
  }

  const allowedPattern =
    /^[a-zA-Z\u4e00-\u9fa5\u0e00-\u0e7f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf0-9\s\-_]+$/;

  if (!allowedPattern.test(name)) {
    return "Username can only contain letters, numbers, spaces, -, _";
  }

  return "";
}
