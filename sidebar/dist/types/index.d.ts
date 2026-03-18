import * as react_jsx_runtime from 'react/jsx-runtime';
import { ComponentType, CSSProperties, ReactNode, RefObject } from 'react';
import { ClassValue } from 'clsx';

type ToolCategory = string;
type ToolType = string;
/**
 * Icon 组件类型
 * 统一使用 React 组件作为 icon，不再支持字符串形式
 */
type IconComponent = ComponentType<{
    className?: string;
}>;
interface ToolSubItem {
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
interface ToolCategoryConfig {
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
interface SidebarConfig {
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
interface SidebarProps {
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
type ToolTypeCategoryMap = Record<ToolType, ToolCategory>;

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
declare function Sidebar({ config, currentTool, currentCategory, expandedCategory: controlledExpandedCategory, userInfo, onToolClick, onCategoryHover, onHomeClick, onAgentClick, onBoardClick, onProjectsClick, onUserProfileClick, onPromotionClick, onCreditsClick, onLoginClick, onChatClick, userAvatarUrl, renderUserMenu, className, style, }: SidebarProps): react_jsx_runtime.JSX.Element;

/**
 * Sidebar 依赖注入类型定义
 *
 * 设计原则:
 * 1. Sidebar 不直接依赖任何框架特定的实现
 * 2. 所有外部依赖通过接口注入
 * 3. 适配器在应用层实现,Sidebar 只依赖接口
 */

/**
 * 路由适配器 - 抽象路由操作
 *
 * Sidebar 不直接依赖 Next.js Router,而是通过这个接口
 * 应用层需要提供实现
 */
interface IRouteAdapter {
    /**
     * 导航到指定路径
     */
    navigate(path: string): void | Promise<void>;
    /**
     * 打开外部链接
     */
    openExternal(url: string): void;
    /**
     * 检查路径是否为当前激活路径
     */
    isActive(path: string): boolean;
    /**
     * 获取当前路径
     */
    getCurrentPath(): string;
    /**
     * 导航到工具页面
     */
    navigateToTool(tool: ToolType, category: ToolCategory): void | Promise<void>;
    /**
     * 导航到分类页面
     */
    navigateToCategory(category: ToolCategory): void | Promise<void>;
}
/**
 * 国际化翻译键
 *
 * 定义 Sidebar 需要的所有翻译文本
 */
type SidebarTranslationKey = "home" | "agent" | "board" | "projects" | "credits" | "login" | "signup" | "chat" | "promotion" | "upgrade" | "avatar" | "image" | "video" | "voice" | "music" | "upload";
/**
 * 国际化适配器接口
 *
 * Sidebar 不直接依赖任何 i18n 库
 */
interface II18nAdapter {
    /**
     * 翻译函数
     */
    t(key: SidebarTranslationKey, params?: Record<string, string | number>): string;
    /**
     * 当前语言
     */
    locale: string;
    /**
     * 语言是否已加载完成
     */
    isReady: boolean;
}
/**
 * 用户信息接口
 */
interface IUserInfo {
    id: string;
    name?: string;
    avatar?: string;
    credits?: number;
    creditsLoading?: boolean;
    planType?: "free" | "pro" | "enterprise";
    isLoggedIn: boolean;
}
/**
 * 用户状态适配器接口
 *
 * Sidebar 通过此接口获取用户信息,不直接依赖 Auth 系统
 */
interface IUserAdapter {
    /**
     * 获取当前用户信息
     */
    getUserInfo(): IUserInfo | null;
    /**
     * 监听用户信息变化
     */
    onUserInfoChange(callback: (user: IUserInfo | null) => void): () => void;
    /**
     * 触发登录流程
     *
     * 当用户需要登录时(例如点击需要登录的功能),Sidebar 会调用此方法
     * 应用层需要提供实现,例如打开登录模态框
     */
    onLoginRequired?(): void;
    /**
     * 触发注册流程
     *
     * 当用户需要注册时,Sidebar 会调用此方法
     * 应用层需要提供实现,例如打开注册模态框
     */
    onSignupRequired?(): void;
    /**
     * 触发升级流程
     *
     * 当用户点击升级或积分时,Sidebar 会调用此方法
     * 应用层需要提供实现,例如打开定价弹窗
     */
    onUpgradeRequired?(): void;
}
/**
 * 路由配置接口
 *
 * 定义工具类型到路由的映射
 */
interface IRouteConfig {
    /**
     * 工具类型到路由的映射
     */
    toolRoutes: Record<ToolType, string>;
    /**
     * 分类到路由的映射
     */
    categoryRoutes: Record<ToolCategory, string>;
    /**
     * Agent 域名
     */
    agentDomain: string;
}
/**
 * 行为配置接口
 *
 * 控制 Sidebar 的各种行为
 */
interface IBehaviorConfig {
    /**
     * 点击工具后是否自动关闭子菜单
     * @default true
     */
    closeSubMenuAfterToolClick?: boolean;
    /**
     * 是否在鼠标悬停时展开子菜单
     * @default false
     */
    expandSubMenuOnHover?: boolean;
    /**
     * 子菜单展开延迟(毫秒)
     * @default 200
     */
    expandDelay?: number;
    /**
     * 子菜单收起延迟(毫秒)
     * @default 300
     */
    collapseDelay?: number;
}
/**
 * Sidebar 依赖配置
 *
 * 应用层通过 Provider 注入这些依赖
 */
interface SidebarDependencies {
    /**
     * 路由适配器(必需)
     */
    routeAdapter: IRouteAdapter;
    /**
     * 国际化适配器(可选,有默认实现)
     */
    i18nAdapter?: II18nAdapter;
    /**
     * 用户适配器(可选)
     */
    userAdapter?: IUserAdapter;
    /**
     * 路由配置(可选)
     */
    routeConfig?: Partial<IRouteConfig>;
    /**
     * 行为配置(可选)
     */
    behaviorConfig?: IBehaviorConfig;
}

interface SidebarContextValue {
    routeAdapter: IRouteAdapter;
    i18nAdapter: II18nAdapter;
    userAdapter: IUserAdapter | undefined;
    routeConfig: IRouteConfig;
    behaviorConfig: IBehaviorConfig;
}
/**
 * 使用 Sidebar Context
 *
 * @throws 如果未在 SidebarProvider 内使用会抛出错误
 */
declare function useSidebarContext(): SidebarContextValue;
interface SidebarProviderProps {
    children: ReactNode;
    dependencies: SidebarDependencies;
}
declare function SidebarProvider({ children, dependencies, }: SidebarProviderProps): react_jsx_runtime.JSX.Element;

interface SidebarFooterProps {
    /**
     * 优惠按钮点击回调
     */
    onPromotionClick?: () => void;
    /**
     * 积分点击回调
     */
    onCreditsClick?: () => void;
    /**
     * 登录按钮点击回调
     */
    onLoginClick?: () => void;
    /**
     * 聊天按钮点击回调
     */
    onChatClick?: () => void;
    /**
     * 用户积分数量
     */
    credits?: number;
    /**
     * 是否已登录
     */
    isLoggedIn?: boolean;
    /**
     * 是否显示积分数量
     * @default true
     */
    showCredits?: boolean;
    /**
     * 是否显示登录按钮
     * @default true
     */
    showLogin?: boolean;
    /**
     * 是否显示聊天按钮
     * @default true
     */
    showChat?: boolean;
    /**
     * 优惠折扣显示文本
     * @default "47% OFF"
     */
    promotionText?: string;
    /**
     * 自定义类名
     */
    className?: string;
    /**
     * 用户头像 URL
     */
    userAvatarUrl?: string;
    /**
     * 自定义用户菜单渲染函数
     */
    renderUserMenu?: () => React.ReactNode;
}
/**
 * SidebarFooter 组件 - 显示底部区域（优惠、积分、登录等）
 *
 * 优化说明：
 * - ✅ 移除 Recoil 订阅，改为通过 props 传递数据
 * - ✅ 遵循 rerender-defer-reads 规则，减少不必要的重渲染
 *
 * @component
 * @example
 * ```tsx
 * <SidebarFooter
 *   onPromotionClick={() => console.log('Promotion clicked')}
 *   onCreditsClick={() => console.log('Credits clicked')}
 *   onLoginClick={() => console.log('Login clicked')}
 *   onChatClick={() => console.log('Chat clicked')}
 *   credits={1000}
 *   isLoggedIn={true}
 * />
 * ```
 */
declare function SidebarFooter({ onPromotionClick, onCreditsClick, onLoginClick, onChatClick, credits, isLoggedIn, showCredits, showLogin, showChat, promotionText, className, userAvatarUrl, renderUserMenu, }: SidebarFooterProps): react_jsx_runtime.JSX.Element;

/**
 * 合并 Tailwind CSS 类名
 * 结合 clsx 和 tailwind-merge 的功能
 */
declare function cn(...inputs: ClassValue[]): string;

declare function useClickOutside(ref: RefObject<HTMLElement>, callback: () => void, isEnabled?: boolean): void;

export { Sidebar, SidebarFooter, SidebarProvider, cn, useClickOutside, useSidebarContext };
export type { IconComponent, SidebarConfig, SidebarDependencies, SidebarFooterProps, SidebarProps, ToolCategory, ToolCategoryConfig, ToolSubItem, ToolType, ToolTypeCategoryMap };
