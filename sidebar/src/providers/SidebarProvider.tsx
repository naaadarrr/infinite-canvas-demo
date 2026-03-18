/**
 * Sidebar 依赖注入 Provider
 *
 * 提供 Context 和默认实现
 */

"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type {
  IRouteAdapter,
  II18nAdapter,
  IUserAdapter,
  SidebarDependencies,
  IRouteConfig,
  IBehaviorConfig,
  SidebarTranslationKey,
  IUserInfo,
} from "./types";
import type { ToolType, ToolCategory } from "../core/types";

// ==================== Context 定义 ====================

interface SidebarContextValue {
  routeAdapter: IRouteAdapter;
  i18nAdapter: II18nAdapter;
  userAdapter: IUserAdapter | undefined;
  routeConfig: IRouteConfig;
  behaviorConfig: IBehaviorConfig;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

/**
 * 使用 Sidebar Context
 *
 * @throws 如果未在 SidebarProvider 内使用会抛出错误
 */
export function useSidebarContext(): SidebarContextValue {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within SidebarProvider");
  }
  return context;
}

// ==================== 默认实现 ====================

/**
 * 默认路由配置
 */
const DEFAULT_ROUTE_CONFIG: IRouteConfig = {
  toolRoutes: {
    "text-to-image": "/ai-creation/text-to-image",
    "image-edit": "/ai-creation/image-edit",
    "virtual-try-on": "/virtual-try-on",
    "product-photography": "/product-photography",
    "character-swap": "/character-swap",
    "image-character-swap": "/image-character-swap",
    "video-character-swap": "/video-character-swap",
    "image-face-swap": "/image-face-swap",
    "video-face-swap": "/video-face-swap",
    "image-translation": "/image-translation",
    "image-upscale": "/image-upscale",
    inpaint: "/ai-creation/inpaint",
    "remove-background": "/ai-creation/remove-background",
    "image-to-video": "/ai-creation/image-to-video",
    "text-to-video": "/ai-creation/text-to-video",
    "video-edit": "/ai-creation/video-edit",
    "video-lip-sync": "/video-lip-sync",
    "video-upscale": "/video-upscale",
    "ai-avatar": "/avatar-4",
    "product-avatar": "/product-avatar",
    "design-my-avatar": "/design-my-avatar",
    "text-to-speech": "/voice",
    "text-to-music": "/music",
    chatbot: "/chat",
    "local-upload": "/upload",
  },
  categoryRoutes: {
    image: "/ai-creation/image",
    video: "/ai-creation/video",
    avatar: "/avatar",
    voice: "/voice",
    music: "/music",
    chat: "/chat",
    upload: "/upload",
  },
  agentDomain:
    process.env.NEXT_PUBLIC_AGENT_DOMAIN || "https://agent.example.com",
};

/**
 * 默认行为配置
 */
const DEFAULT_BEHAVIOR_CONFIG: IBehaviorConfig = {
  closeSubMenuAfterToolClick: true,
  expandSubMenuOnHover: false,
  expandDelay: 200,
  collapseDelay: 300,
};

/**
 * 默认翻译(英文)
 */
const DEFAULT_TRANSLATIONS: Record<SidebarTranslationKey, string> = {
  home: "Home",
  agent: "Agent",
  board: "Board",
  projects: "Projects",
  credits: "Credits",
  login: "Login",
  signup: "Start for Free",
  chat: "Chat",
  promotion: "Limited Time Sale",
  upgrade: "Upgrade",
  avatar: "Avatar",
  image: "Image",
  video: "Video",
  voice: "Audios",
  music: "Music",
  upload: "Upload",
};

/**
 * 默认 i18n 适配器实现
 */
class DefaultI18nAdapter implements II18nAdapter {
  locale = "en";
  isReady = true;

  t(
    key: SidebarTranslationKey,
    params?: Record<string, string | number>
  ): string {
    let translation = DEFAULT_TRANSLATIONS[key];

    // 简单的参数插值
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(`{{${paramKey}}}`, String(value));
      });
    }

    return translation;
  }
}

/**
 * 默认用户适配器实现
 */
class DefaultUserAdapter implements IUserAdapter {
  getUserInfo(): IUserInfo | null {
    // 默认实现:返回未登录状态
    return {
      id: "",
      isLoggedIn: false,
    };
  }

  onUserInfoChange(callback: (user: IUserInfo | null) => void): () => void {
    // 默认实现:不监听变化
    return () => {};
  }
}

// ==================== Provider 组件 ====================

interface SidebarProviderProps {
  children: ReactNode;
  dependencies: SidebarDependencies;
}

export function SidebarProvider({
  children,
  dependencies,
}: SidebarProviderProps) {
  // 合并配置
  const routeConfig: IRouteConfig = useMemo(
    () => ({
      ...DEFAULT_ROUTE_CONFIG,
      ...dependencies.routeConfig,
      toolRoutes: {
        ...DEFAULT_ROUTE_CONFIG.toolRoutes,
        ...dependencies.routeConfig?.toolRoutes,
      },
      categoryRoutes: {
        ...DEFAULT_ROUTE_CONFIG.categoryRoutes,
        ...dependencies.routeConfig?.categoryRoutes,
      },
    }),
    [dependencies.routeConfig]
  );

  const behaviorConfig: IBehaviorConfig = useMemo(
    () => ({
      ...DEFAULT_BEHAVIOR_CONFIG,
      ...dependencies.behaviorConfig,
    }),
    [dependencies.behaviorConfig]
  );

  // 使用提供的适配器或默认实现
  const i18nAdapter = useMemo(
    () => dependencies.i18nAdapter || new DefaultI18nAdapter(),
    [dependencies.i18nAdapter]
  );

  const userAdapter = useMemo(
    () => dependencies.userAdapter || new DefaultUserAdapter(),
    [dependencies.userAdapter]
  );

  // Context 值
  const contextValue = useMemo<SidebarContextValue>(
    () => ({
      routeAdapter: dependencies.routeAdapter,
      i18nAdapter,
      userAdapter,
      routeConfig,
      behaviorConfig,
    }),
    [
      dependencies.routeAdapter,
      i18nAdapter,
      userAdapter,
      routeConfig,
      behaviorConfig,
    ]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
}

// ==================== 应用层适配器工厂 ====================

/**
 * 创建 Next.js 路由适配器
 *
 * 这是一个辅助函数,用于在应用层创建适配器
 * Sidebar 组件本身不直接依赖这个函数
 */
export function createNextJsRouteAdapter(
  router: {
    push(path: string): void | Promise<void>;
    replace(path: string): void | Promise<void>;
    pathname?: string;
  },
  pathname: string
): IRouteAdapter {
  return {
    navigate: (path: string) => router.push(path),
    openExternal: (url: string) => {
      window.open(url, "_blank", "noopener,noreferrer");
    },
    isActive: (path: string) => {
      // 简单的路径匹配
      const currentPath = pathname.split("?")[0];
      const targetPath = path.split("?")[0];
      return currentPath === targetPath;
    },
    getCurrentPath: () => pathname,
    navigateToTool: (tool: ToolType, _category: ToolCategory) => {
      const { routeConfig } = useSidebarContext();
      const route = routeConfig.toolRoutes[tool];
      if (route) {
        router.push(route);
      } else {
        console.warn(`[Sidebar] Route not found for tool: ${tool}`);
        router.push("/home");
      }
    },
    navigateToCategory: (category: ToolCategory) => {
      const { routeConfig } = useSidebarContext();
      const route = routeConfig.categoryRoutes[category];
      if (route) {
        router.push(route);
      } else {
        console.warn(`[Sidebar] Route not found for category: ${category}`);
        router.push("/home");
      }
    },
  };
}
