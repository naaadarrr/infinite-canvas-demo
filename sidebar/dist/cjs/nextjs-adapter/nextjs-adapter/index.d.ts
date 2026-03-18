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
import type { IRouteAdapter, II18nAdapter, IUserAdapter, IRouteConfig } from "../providers/types";
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
export declare function useNextJsRouteAdapter(routeConfig: IRouteConfig): IRouteAdapter;
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
export declare function useNextJsI18nAdapter(translations: Record<string, string>): II18nAdapter;
/**
 * Next.js 用户适配器配置
 */
export interface NextJsUserAdapterOptions {
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
export declare function useNextJsUserAdapter(options?: NextJsUserAdapterOptions): IUserAdapter;
//# sourceMappingURL=index.d.ts.map