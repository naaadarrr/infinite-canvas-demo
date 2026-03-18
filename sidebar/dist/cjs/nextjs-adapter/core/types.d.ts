import type { ComponentType, CSSProperties } from "react";
export type ToolCategory = string;
export type ToolType = string;
/**
 * Icon 组件类型
 * 统一使用 React 组件作为 icon，不再支持字符串形式
 */
export type IconComponent = ComponentType<{
    className?: string;
}>;
export interface ToolSubItem {
    id: ToolType;
    name: string;
    icon: IconComponent;
    hidden?: boolean;
    disabled?: boolean;
    badge?: string | number | {
        type: "new" | "beta" | "pro";
        text: string;
    };
    comingSoon?: boolean;
    onClick?: () => void;
}
export interface ToolCategoryConfig {
    id: ToolCategory;
    name: string;
    icon: IconComponent;
    subItems: ToolSubItem[];
    hidden?: boolean;
    order?: number;
    isSeparated?: boolean;
    directTool?: ToolType;
    customClassName?: string;
}
export interface SidebarConfig {
    categories: ToolCategoryConfig[];
    showHomeButton?: boolean;
    showAgentButton?: boolean;
    showBoardButton?: boolean;
    showProjectsButton?: boolean;
    showUserInfo?: boolean;
    showPromotion?: boolean;
    showCredits?: boolean;
    showLoginButton?: boolean;
    showChatButton?: boolean;
    isInBoard?: boolean;
}
export interface SidebarProps {
    config: SidebarConfig;
    currentTool?: ToolType;
    currentCategory?: ToolCategory;
    expandedCategory?: ToolCategory | null;
    userInfo?: {
        credits?: number;
        planType?: "free" | "pro" | "enterprise";
        isLoggedIn?: boolean;
        avatar?: string;
    };
    onToolClick?: (tool: ToolType, category: ToolCategory) => void;
    onCategoryHover?: (category: ToolCategory | null) => void;
    onHomeClick?: () => void;
    onAgentClick?: () => void;
    onBoardClick?: () => void;
    onProjectsClick?: () => void;
    onUserProfileClick?: () => void;
    onPromotionClick?: () => void;
    onCreditsClick?: () => void;
    onLoginClick?: () => void;
    onChatClick?: () => void;
    userAvatarUrl?: string;
    renderUserMenu?: () => React.ReactNode;
    className?: string;
    style?: CSSProperties;
}
export type ToolTypeCategoryMap = Record<ToolType, ToolCategory>;
//# sourceMappingURL=types.d.ts.map