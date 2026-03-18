"use client";

import { useMemo } from "react";
import { LogIn, MessageCircle } from "lucide-react";
import { cn } from "../utils/cn";
import { SidebarUserMenu } from "./SidebarUserMenu";

// 分隔线 SVG - 渐变效果
const SEPARATOR_SVG = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="40"
    height="1"
    viewBox="0 0 40 1"
    fill="none"
    className="mx-auto"
  >
    <path
      d="M0 0.25H40"
      stroke="url(#paint0_linear_footer_separator)"
      strokeWidth="0.5"
    />
    <defs>
      <linearGradient
        id="paint0_linear_footer_separator"
        x1="0"
        y1="0.75"
        x2="40"
        y2="0.75"
        gradientUnits="userSpaceOnUse"
      >
        <stop
          stopColor="white"
          stopOpacity="0"
        />
        <stop
          offset="0.5"
          stopColor="white"
        />
        <stop
          offset="1"
          stopColor="white"
          stopOpacity="0"
        />
      </linearGradient>
    </defs>
  </svg>
);

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
   * 用户名
   */
  userName?: string;
  /**
   * 用户邮箱
   */
  userEmail?: string;
  /**
   * 自定义用户菜单渲染函数（完全控制渲染）
   * 如果提供此函数，将忽略 renderMenuHeader 和 renderMenuContent
   */
  renderUserMenu?: () => React.ReactNode;
  /**
   * 自定义用户菜单头部渲染
   */
  renderMenuHeader?: () => React.ReactNode;
  /**
   * 自定义用户菜单内容渲染
   */
  renderMenuContent?: () => React.ReactNode;
  /**
   * 用户订阅类型
   */
  planType?: "free" | "pro" | "business";
  /**
   * 用户 ID（用于双击复制）
   */
  userId?: string;
  /**
   * 双击头像后的回调（可用于显示 toast）
   */
  onAvatarDoubleClick?: (userId: string) => void;

  // ========== 用户菜单自治 Props（透传给 SidebarUserMenu）==========

  /**
   * 菜单项配置列表
   */
  menuItems?: import("./types").UserMenuItemConfig[];
  /**
   * 编辑名称的异步保存回调
   */
  onNameSave?: (newName: string) => Promise<void>;
  /**
   * 登出回调
   */
  onLogout?: () => Promise<void>;
  /**
   * Toast 通知回调
   */
  onToast?: (message: string, type: "success" | "error") => void;
  /**
   * 自定义用户名验证函数
   */
  validateName?: (name: string) => string;

  // ========== 语言选择器 Props（透传给 SidebarUserMenu）==========

  /**
   * 当前语言
   */
  currentLanguage?: string;
  /**
   * 语言变更回调
   */
  onLanguageChange?: (language: string) => void;
  /**
   * 可选语言列表
   */
  languages?: string[];
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
export function SidebarFooter({
  onPromotionClick,
  onCreditsClick,
  onLoginClick,
  onChatClick,
  credits = 0,
  isLoggedIn = false,
  showCredits = true,
  showLogin = true,
  showChat = true,
  promotionText = "47% OFF",
  className,
  userAvatarUrl,
  userName,
  userEmail,
  renderUserMenu,
  renderMenuHeader,
  renderMenuContent,
  planType,
  userId,
  onAvatarDoubleClick,
  // 用户菜单自治 props
  menuItems,
  onNameSave,
  onLogout,
  onToast,
  validateName,
  // 语言选择器 props
  currentLanguage,
  onLanguageChange,
  languages,
}: SidebarFooterProps) {
  // 格式化积分，如果有小数点则保留两位
  const formattedCredits = useMemo(() => {
    if (credits % 1 !== 0) {
      return credits.toFixed(2);
    }
    return credits.toString();
  }, [credits]);

  return (
    <div className={cn("relative z-10 flex-shrink-0 p-2 space-y-1", className)}>
      {/* 优惠 */}
      <button
        onClick={onPromotionClick}
        className="flex w-full flex-col items-center gap-1 rounded-lg p-2 text-white transition hover:bg-white/5"
        aria-label="Promotion"
      >
        <img
          src="https://d1735p3aqhycef.cloudfront.net/topview/dc4c14f2aba1b71f8de715e760306463b4e4c2f1.png"
          alt="Promotion"
          className="h-5 w-5"
        />
        <span className="text-[10px]">{promotionText}</span>
      </button>

      {/* 积分 - 仅登录后显示 */}
      {showCredits && isLoggedIn && (
        <button
          onClick={onCreditsClick}
          className="flex w-full flex-col items-center gap-1 rounded-lg p-2 text-white transition hover:bg-white/5 cursor-pointer"
          aria-label="Credits"
        >
          <img
            src="https://d1735p3aqhycef.cloudfront.net/topview/ic_credit.svg"
            alt="Credits"
            className="h-5 w-5 pointer-events-none"
          />
          <span
            className={cn(
              "text-[10px]",
              formattedCredits.length > 6 && "text-[8px]"
            )}
          >
            {formattedCredits}
          </span>
          {planType === "free" && (
            <span className="text-[10px] text-white/40 mt-0.5">Free</span>
          )}
        </button>
      )}

      {/* 登录/用户区域 */}
      {showLogin && (
        <div className="mb-[10px]">
          {isLoggedIn ? (
            // 已登录：显示用户菜单
            renderUserMenu ? (
              renderUserMenu()
            ) : (
              <SidebarUserMenu
                userAvatarUrl={userAvatarUrl}
                userName={userName}
                userEmail={userEmail}
                userId={userId}
                onAvatarDoubleClick={onAvatarDoubleClick}
                renderMenuHeader={renderMenuHeader}
                renderMenuContent={renderMenuContent}
                menuItems={menuItems}
                onNameSave={onNameSave}
                onLogout={onLogout}
                onToast={onToast}
                validateName={validateName}
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
                languages={languages}
              />
            )
          ) : (
            // 未登录：显示 Login 按钮
            <button
              onClick={onLoginClick}
              className="flex w-full flex-col items-center gap-1 rounded-lg p-2 text-white/60 transition hover:bg-white/5 hover:text-white"
              aria-label="Login"
            >
              <LogIn className="h-5 w-5" />
              <span className="text-[10px]">Login</span>
            </button>
          )}
        </div>
      )}

      {/* Chat */}
      {showChat && (
        <button
          onClick={onChatClick}
          className="flex w-full flex-col items-center gap-1 rounded-lg p-2 text-white/60 transition hover:bg-white/5 hover:text-white"
          aria-label="Chat"
        >
          <MessageCircle className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
