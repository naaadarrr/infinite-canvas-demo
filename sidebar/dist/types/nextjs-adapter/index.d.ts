type ToolCategory = string;
type ToolType = string;

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
 * Next.js 应用层适配器实现
 *
 * 这些适配器 bridges Sidebar 和 Next.js 应用层
 * Sidebar 组件本身不直接依赖这些文件
 *
 * 设计原则:
 * - 适配器只负责"适配"工作,不包含配置
 * - 所有配置由应用层通过参数传入
 * - 这样 Sidebar 可以抽成独立的 npm 包
 */

/**
 * Next.js 路由适配器 Hook
 *
 * @param routeConfig - 路由配置(由应用层提供)
 *
 * 使用示例:
 * ```tsx
 * import { SIDEBAR_ROUTE_CONFIG } from '@/configs/sidebar-config';
 *
 * const routeAdapter = useNextJsRouteAdapter(SIDEBAR_ROUTE_CONFIG);
 * ```
 */
declare function useNextJsRouteAdapter(routeConfig: IRouteConfig): IRouteAdapter;
/**
 * Next.js i18n 适配器
 *
 * @param translations - 翻译配置(由应用层提供)
 *
 * 使用示例:
 * ```tsx
 * import { SIDEBAR_TRANSLATIONS } from '@/configs/sidebar-config';
 *
 * const i18nAdapter = useNextJsI18nAdapter(SIDEBAR_TRANSLATIONS);
 * ```
 */
declare function useNextJsI18nAdapter(translations: Record<string, string>): II18nAdapter;
/**
 * Next.js 用户适配器配置
 */
interface NextJsUserAdapterOptions {
    /**
     * 登录回调 - 当用户需要登录时触发
     */
    onLoginRequired?: () => void;
    /**
     * 注册回调 - 当用户需要注册时触发
     */
    onSignupRequired?: () => void;
    /**
     * 升级回调 - 当用户需要升级或点击积分时触发
     */
    onUpgradeRequired?: () => void;
    /**
     * 用户额外信息 - 积分、加载状态、套餐类型等
     */
    creditsInfo?: {
        credits?: number;
        creditsLoading?: boolean;
        planType?: "free" | "pro" | "enterprise";
    };
    /**
     * 用户状态 (从 @topview/auth-modal 的 useAuth 获取)
     */
    userState?: {
        isLoggedIn: boolean;
        uid?: string;
        user?: {
            name?: string;
            image?: string;
            email?: string;
        };
    };
}
/**
 * Next.js 用户适配器
 *
 * 将 @topview/auth-modal 的 useAuth 适配为 Sidebar 需要的接口
 *
 * @param options - 适配器配置(可选)
 *
 * 使用示例:
 * ```tsx
 * const userAdapter = useNextJsUserAdapter({
 *   onLoginRequired: () => setAuthModal({ open: true, mode: 'login' }),
 *   onSignupRequired: () => setAuthModal({ open: true, mode: 'signup' }),
 *   onUpgradeRequired: () => openPricingModal(),
 *   creditsInfo: {
 *     credits: teamCredit?.remainCredit,
 *     creditsLoading: creditLoading,
 *     planType: 'pro',
 *   },
 * });
 * ```
 */
declare function useNextJsUserAdapter(options?: NextJsUserAdapterOptions): IUserAdapter;

export { useNextJsI18nAdapter, useNextJsRouteAdapter, useNextJsUserAdapter };
export type { NextJsUserAdapterOptions };
