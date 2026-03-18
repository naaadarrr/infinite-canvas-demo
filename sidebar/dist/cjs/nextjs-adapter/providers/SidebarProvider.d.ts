/**
 * Sidebar 依赖注入 Provider
 *
 * 提供 Context 和默认实现
 */
import { type ReactNode } from "react";
import type { IRouteAdapter, II18nAdapter, IUserAdapter, SidebarDependencies, IRouteConfig, IBehaviorConfig } from "./types";
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
export declare function useSidebarContext(): SidebarContextValue;
interface SidebarProviderProps {
    children: ReactNode;
    dependencies: SidebarDependencies;
}
export declare function SidebarProvider({ children, dependencies, }: SidebarProviderProps): import("react/jsx-runtime").JSX.Element;
/**
 * 创建 Next.js 路由适配器
 *
 * 这是一个辅助函数,用于在应用层创建适配器
 * Sidebar 组件本身不直接依赖这个函数
 */
export declare function createNextJsRouteAdapter(router: {
    push(path: string): void | Promise<void>;
    replace(path: string): void | Promise<void>;
    pathname?: string;
}, pathname: string): IRouteAdapter;
export {};
//# sourceMappingURL=SidebarProvider.d.ts.map