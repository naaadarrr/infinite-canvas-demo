// 核心组件
export { Sidebar } from "./core/Sidebar";
export type { SidebarProps } from "./core/Sidebar";

// 类型定义
export * from "./core/types";

// Provider
export { SidebarProvider, useSidebarContext } from "./providers";
export type { SidebarDependencies } from "./providers/types";

// 子组件
export { SidebarFooter } from "./components/SidebarFooter";
export type { SidebarFooterProps } from "./components/SidebarFooter";

export { SidebarUserMenu } from "./components/SidebarUserMenu";
export type { SidebarUserMenuProps } from "./components/SidebarUserMenu";

// 用户菜单组件 — 可独立使用
export { UserAvatar } from "./components/UserAvatar";
export type { UserAvatarProps } from "./components/UserAvatar";

export { UserMenuItem } from "./components/UserMenuItem";
export { UserMenuHeader } from "./components/UserMenuHeader";
export { UserMenuContent } from "./components/UserMenuContent";
export { EditNameModal } from "./components/EditNameModal";
export { LanguageSelector } from "./components/LanguageSelector";

// 用户菜单类型
export type {
  UserMenuItemConfig,
  UserMenuItemProps,
  UserMenuHeaderProps,
  UserMenuContentProps,
  EditNameModalProps,
  LanguageSelectorProps,
} from "./components/types";
export { defaultValidateUserName, DEFAULT_LANGUAGES } from "./components/types";

// 工具函数
export { cn } from "./utils/cn";

// Hooks
export { useClickOutside } from "./hooks/useClickOutside";
export { useMenuPosition } from "./hooks/useMenuPosition";
export type {
  MenuPosition,
  UseMenuPositionOptions,
} from "./hooks/useMenuPosition";
