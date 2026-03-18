// types.ts
import type { ComponentType, CSSProperties } from "react";

// ========== 基础类型 ==========

export type ToolCategory = string;
export type ToolType = string;

// ========== Icon 类型系统 ==========

/**
 * Icon 组件类型
 * 统一使用 React 组件作为 icon，不再支持字符串形式
 */
export type IconComponent = ComponentType<{ className?: string }>;

// ========== 配置接口 ==========

export interface ToolSubItem {
  id: ToolType;
  name: string;
  icon: IconComponent;

  // 控制显示
  hidden?: boolean;
  disabled?: boolean;

  // UI 增强
  badge?: string | number | { type: "new" | "beta" | "pro"; text: string };
  comingSoon?: boolean;

  // 自定义行为（覆盖默认 onClick）
  onClick?: () => void;
}

export interface ToolCategoryConfig {
  id: ToolCategory;
  name: string;
  icon: IconComponent;
  subItems: ToolSubItem[];

  // 控制显示
  hidden?: boolean;

  // 排序
  order?: number;

  // 特殊行为
  isSeparated?: boolean;
  directTool?: ToolType;

  // 自定义样式
  customClassName?: string;
}

export interface SidebarConfig {
  categories: ToolCategoryConfig[];

  // 显示控制
  showHomeButton?: boolean;
  showAgentButton?: boolean;
  showBoardButton?: boolean;
  showUserInfo?: boolean;
  showPromotion?: boolean;
  showCredits?: boolean;
  showLoginButton?: boolean;
  showChatButton?: boolean;

  // Agent 子菜单（hover 展示）
  agentSubItems?: ToolSubItem[];

  // 行为控制
  isInBoard?: boolean;
}

export interface SidebarProps {
  config: SidebarConfig;

  // 当前状态（受控）
  currentTool?: ToolType;
  currentCategory?: ToolCategory;
  expandedCategory?: ToolCategory | null;

  // 用户信息（可选）
  userInfo?: {
    id?: string;
    name?: string;
    email?: string;
    credits?: number;
    planType?: "free" | "pro" | "business";
    isLoggedIn?: boolean;
    avatar?: string;
  };

  // 纯事件通知
  onToolClick?: (tool: ToolType, category: ToolCategory) => void;
  onCategoryHover?: (category: ToolCategory | null) => void;
  onHomeClick?: () => void;
  onAgentClick?: () => void;
  onBoardClick?: () => void;
  onUserProfileClick?: () => void;
  onPromotionClick?: () => void;
  onCreditsClick?: () => void;
  onLoginClick?: () => void;
  onChatClick?: () => void;
  onAvatarDoubleClick?: (userId: string) => void;

  // 用户菜单定制
  userAvatarUrl?: string;
  renderUserMenu?: () => React.ReactNode;

  // 用户菜单自治 Props（透传给 SidebarUserMenu）
  /** 菜单项配置列表 */
  menuItems?: import("../components/types").UserMenuItemConfig[];
  /** 编辑名称的异步保存回调 */
  onNameSave?: (newName: string) => Promise<void>;
  /** 登出回调 */
  onLogout?: () => Promise<void>;
  /** Toast 通知回调 */
  onToast?: (message: string, type: "success" | "error") => void;
  /** 自定义用户名验证函数 */
  validateName?: (name: string) => string;

  // 语言选择器 Props（透传给 SidebarUserMenu → UserMenuContent）
  /** 当前语言 */
  currentLanguage?: string;
  /** 语言变更回调 */
  onLanguageChange?: (language: string) => void;
  /** 可选语言列表 */
  languages?: string[];

  // 样式定制
  className?: string;
  style?: CSSProperties;
}

// ========== 辅助类型 ==========

export type ToolTypeCategoryMap = Record<ToolType, ToolCategory>;

// 用户菜单类型重导出（方便消费方直接从 @topview/sidebar 导入）
export type { UserMenuItemConfig } from "../components/types";
