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

"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
// import { useAuth } from '@topview/auth-modal'; // 在应用层通过 peer dependencies 提供
import type {
  IRouteAdapter,
  II18nAdapter,
  IUserAdapter,
  IUserInfo,
  IRouteConfig,
} from "../providers/types";

// ==================== Next.js 路由适配器 ====================

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
export function useNextJsRouteAdapter(
  routeConfig: IRouteConfig
): IRouteAdapter {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = useCallback(
    (path: string) => {
      router.push(path);
    },
    [router]
  );

  const openExternal = useCallback((url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const isActive = useCallback(
    (path: string) => {
      const currentPath = pathname.split("?")[0];
      const targetPath = path.split("?")[0];
      return currentPath === targetPath;
    },
    [pathname]
  );

  const getCurrentPath = useCallback(() => pathname, [pathname]);

  const navigateToTool = useCallback(
    (tool: string, _category: string) => {
      const route = routeConfig.toolRoutes[tool];
      if (route) {
        router.push(route);
      } else {
        console.warn(`[Sidebar] Route not found for tool: ${tool}`);
        router.push("/home");
      }
    },
    [router, routeConfig]
  );

  const navigateToCategory = useCallback(
    (category: string) => {
      const route = routeConfig.categoryRoutes[category];
      if (route) {
        router.push(route);
      } else {
        console.warn(`[Sidebar] Route not found for category: ${category}`);
        router.push("/home");
      }
    },
    [router, routeConfig]
  );

  return {
    navigate,
    openExternal,
    isActive,
    getCurrentPath,
    navigateToTool,
    navigateToCategory,
  };
}

// ==================== Next.js i18n 适配器 ====================

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
export function useNextJsI18nAdapter(
  translations: Record<string, string>
): II18nAdapter {
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let translation = translations[key] || key;

      // 参数插值
      if (params) {
        Object.entries(params).forEach(([paramKey, value]) => {
          translation = translation.replace(`{{${paramKey}}}`, String(value));
        });
      }

      return translation;
    },
    [translations]
  );

  return {
    t,
    locale: "en",
    isReady: true,
  };
}

// ==================== Next.js 用户适配器 ====================

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
    planType?: "free" | "pro" | "business";
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
export function useNextJsUserAdapter(
  options?: NextJsUserAdapterOptions
): IUserAdapter {
  // 从 options 中获取用户状态,而不是直接调用 useAuth
  const { isLoggedIn, uid, user } = options?.userState || {
    isLoggedIn: false,
    uid: undefined,
    user: undefined,
  };

  const getUserInfo = useCallback((): IUserInfo | null => {
    if (!isLoggedIn) {
      return {
        id: "",
        isLoggedIn: false,
      };
    }

    return {
      id: uid || "",
      name: user?.name || undefined,
      avatar: user?.image || undefined,
      isLoggedIn: true,
      ...options?.creditsInfo,
    };
  }, [isLoggedIn, uid, user, options?.creditsInfo]);

  const onUserInfoChange = useCallback(
    (callback: (user: IUserInfo | null) => void) => {
      // 监听登录状态变化
      const handleLoginChange = () => {
        callback(getUserInfo());
      };

      // 监听自定义事件
      window.addEventListener("auth-state-change", handleLoginChange);

      // 清理函数
      return () => {
        window.removeEventListener("auth-state-change", handleLoginChange);
      };
    },
    [getUserInfo]
  );

  return {
    getUserInfo,
    onUserInfoChange,
    onLoginRequired: options?.onLoginRequired,
    onSignupRequired: options?.onSignupRequired,
    onUpgradeRequired: options?.onUpgradeRequired,
  };
}
