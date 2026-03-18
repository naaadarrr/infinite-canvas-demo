/**
 * Sidebar 依赖注入类型定义
 *
 * 设计原则:
 * 1. Sidebar 不直接依赖任何框架特定的实现
 * 2. 所有外部依赖通过接口注入
 * 3. 适配器在应用层实现,Sidebar 只依赖接口
 */
import type { ToolType, ToolCategory } from "../core/types";
/**
 * 路由适配器 - 抽象路由操作
 *
 * Sidebar 不直接依赖 Next.js Router,而是通过这个接口
 * 应用层需要提供实现
 */
export interface IRouteAdapter {
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
export type SidebarTranslationKey = "home" | "agent" | "board" | "projects" | "credits" | "login" | "signup" | "chat" | "promotion" | "upgrade" | "avatar" | "image" | "video" | "voice" | "music" | "upload";
/**
 * 国际化适配器接口
 *
 * Sidebar 不直接依赖任何 i18n 库
 */
export interface II18nAdapter {
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
export interface IUserInfo {
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
export interface IUserAdapter {
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
export interface IRouteConfig {
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
export interface IBehaviorConfig {
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
export interface SidebarDependencies {
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
//# sourceMappingURL=types.d.ts.map