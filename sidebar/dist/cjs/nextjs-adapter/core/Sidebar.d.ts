import type { SidebarProps } from "./types";
/**
 * Sidebar v2 - 独立的无状态侧边栏组件
 *
 * 特性:
 * - ✅ 不依赖 Recoil
 * - ✅ 不依赖 Next.js 路由
 * - ✅ 纯 props + 回调模式
 * - ✅ 内部状态管理（子菜单展开/收起）
 * - ✅ 点击外部关闭子菜单
 * - ✅ 支持键盘导航
 */
export declare function Sidebar({ config, currentTool, currentCategory, expandedCategory: controlledExpandedCategory, userInfo, onToolClick, onCategoryHover, onHomeClick, onAgentClick, onBoardClick, onProjectsClick, onUserProfileClick, onPromotionClick, onCreditsClick, onLoginClick, onChatClick, userAvatarUrl, renderUserMenu, className, style, }: SidebarProps): import("react/jsx-runtime").JSX.Element;
export type { SidebarProps } from "./types";
export default Sidebar;
//# sourceMappingURL=Sidebar.d.ts.map