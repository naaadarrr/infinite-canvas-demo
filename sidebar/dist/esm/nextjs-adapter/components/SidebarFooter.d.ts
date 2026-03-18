export interface SidebarFooterProps {
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
export declare function SidebarFooter({ onPromotionClick, onCreditsClick, onLoginClick, onChatClick, credits, isLoggedIn, showCredits, showLogin, showChat, promotionText, className, userAvatarUrl, renderUserMenu, }: SidebarFooterProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=SidebarFooter.d.ts.map