"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "../utils/cn";
import type { SidebarProps } from "./types";
import { SidebarFooter } from "../components/SidebarFooter";

// Icons - 按需导入以优化 bundle 大小
import { Home, Sparkles, Frame } from "lucide-react";
// 导入常用的分类图标（向后兼容字符串类型）
import {
  Image,
  Video,
  User,
  Headphones,
  MessageCircle,
  MessageSquare,
  Music2,
  Upload,
} from "lucide-react";

// Icon mapping for categories - 向后兼容字符串类型的图标
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Image,
  Video,
  User,
  Headphones,
  MessageCircle,
  MessageSquare,
  Music2,
  Upload,
};

// 静态 Logo SVG - 提升到组件外部以避免重复创建
const LOGO_SVG = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="36"
    height="24"
    viewBox="0 0 36 24"
    fill="none"
  >
    <path
      d="M16.3635 3.47368C16.3635 3.21207 16.6077 3 16.9089 3H19.0908C19.392 3 19.6362 3.21208 19.6362 3.47368V20.5263C19.6362 20.7879 19.392 21 19.0908 21H16.9089C16.6077 21 16.3635 20.7879 16.3635 20.5263V3.47368Z"
      fill="#5768FC"
    />
    <path
      d="M22.9089 3.47203C22.9089 3.21133 23.1531 3 23.4544 3H25.6362C25.9374 3 26.1816 3.21133 26.1816 3.47203V14.8007C26.1816 15.0614 25.9374 15.2727 25.6362 15.2727H23.4544C23.1531 15.2727 22.9089 15.0614 22.9089 14.8007V3.47203Z"
      fill="#4657F2"
    />
    <path
      d="M9.81804 3.47203C9.81804 3.21133 10.0622 3 10.3635 3H12.5453C12.8466 3 13.0908 3.21133 13.0908 3.47203V14.8007C13.0908 15.0614 12.8466 15.2727 12.5453 15.2727H10.3635C10.0622 15.2727 9.81804 15.0614 9.81804 14.8007V3.47203Z"
      fill="#4657F2"
    />
    <path
      d="M29.4543 3.46753C29.4543 3.20932 29.6986 3 29.9998 3H32.1816C32.4829 3 32.7271 3.20932 32.7271 3.46753V9.07792C32.7271 9.33613 32.4829 9.54545 32.1816 9.54545H29.9998C29.6986 9.54545 29.4543 9.33613 29.4543 9.07792V3.46753Z"
      fill="#2D3FE1"
    />
    <path
      d="M3.27271 3.46753C3.27271 3.20932 3.51691 3 3.81816 3H5.99998C6.30122 3 6.54543 3.20932 6.54543 3.46753V9.07792C6.54543 9.33613 6.30122 9.54545 5.99998 9.54545H3.81816C3.51691 9.54545 3.27271 9.33613 3.27271 9.07792V3.46753Z"
      fill="#2D3FE1"
    />
  </svg>
);

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
      stroke="url(#paint0_linear_sidebar_separator)"
      strokeWidth="0.5"
    />
    <defs>
      <linearGradient
        id="paint0_linear_sidebar_separator"
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
export function Sidebar({
  config,
  currentTool,
  currentCategory,
  expandedCategory: controlledExpandedCategory,
  userInfo,
  onToolClick,
  onCategoryHover,
  onHomeClick,
  onAgentClick,
  onBoardClick,
  onUserProfileClick,
  onPromotionClick,
  onCreditsClick,
  onLoginClick,
  onChatClick,
  onAvatarDoubleClick,
  userAvatarUrl,
  renderUserMenu,
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
  className,
  style,
}: SidebarProps) {
  // 内部状态：子菜单展开状态
  const [internalExpandedCategory, setInternalExpandedCategory] = useState<
    string | null
  >(null);

  // 使用受控或非受控模式
  const expandedCategory =
    controlledExpandedCategory !== undefined
      ? controlledExpandedCategory
      : internalExpandedCategory;

  // 使用 useCallback 稳定 setExpandedCategory 函数
  const setExpandedCategory = useCallback(
    (category: string | null) => {
      if (controlledExpandedCategory === undefined) {
        setInternalExpandedCategory(category);
      }
      // 通知父组件
      onCategoryHover?.(category);
    },
    [controlledExpandedCategory, onCategoryHover]
  );

  const menuRef = useRef<HTMLDivElement>(null);
  const subMenuRef = useRef<HTMLDivElement | null>(null);
  const agentSubMenuRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 存储子菜单位置 (用于 fixed 定位)
  const [subMenuPosition, setSubMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // 存储菜单项的 ref (用于计算位置)
  const menuItemRefs = useRef<Map<string, HTMLElement>>(new Map());

  // 点击外部关闭菜单 - 延迟执行，避免在 click 事件前关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // 检查是否点击在工具菜单区域内
      const clickedInMenu = menuRef.current?.contains(target);
      // 检查是否点击在 Agent 子菜单内（Portal 渲染到 body）
      const clickedInAgentSubMenu = agentSubMenuRef.current?.contains(target);

      // 只有点击外部时才关闭
      if (!clickedInMenu && !clickedInAgentSubMenu) {
        // 使用 setTimeout 延迟关闭，确保 click 事件能触发
        setTimeout(() => {
          setExpandedCategory(null);
        }, 0);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setExpandedCategory]);

  // 卸载时清除关闭延迟定时器
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      setExpandedCategory(null);
      closeTimerRef.current = null;
    }, 100);
  }, [setExpandedCategory]);

  // 处理分类悬停 - 使用 useCallback 避免不必要的重渲染
  const handleCategoryHover = useCallback(
    (categoryId: string) => {
      setExpandedCategory(categoryId);
    },
    [setExpandedCategory]
  );

  // 处理工具点击 - 使用 useCallback 避免不必要的重渲染
  const handleToolClick = useCallback(
    (categoryId: string, toolType: string) => {
      onToolClick?.(toolType, categoryId);
      setExpandedCategory(null);
    },
    [onToolClick, setExpandedCategory]
  );

  // 渲染分类图标 - 支持字符串和组件类型 - 使用 useCallback 避免重复创建
  const renderCategoryIcon = useCallback(
    (icon: string | React.ComponentType<{ className?: string }>) => {
      if (typeof icon === "string") {
        const IconComponent = iconMap[icon];
        return IconComponent ? (
          <IconComponent className="h-[18px] w-[18px] flex-shrink-0 text-[#D4D4D4]" />
        ) : null;
      }
      const Icon = icon;
      return (
        <Icon className="h-[18px] w-[18px] flex-shrink-0 text-[#D4D4D4]" />
      );
    },
    []
  );

  // 渲染子菜单项图标 - 支持字符串和组件类型 - 使用 useCallback 避免重复创建
  const renderSubItemIcon = useCallback(
    (icon: string | React.ComponentType<{ className?: string }>) => {
      if (typeof icon === "string") {
        const IconComponent = iconMap[icon];
        if (!IconComponent) {
          console.warn(
            `[Sidebar] Unknown icon string: "${icon}", using fallback`
          );
          return (
            <Sparkles className="h-[18px] w-[18px] flex-shrink-0 text-[#D4D4D4]" />
          );
        }
        return (
          <IconComponent className="h-[18px] w-[18px] flex-shrink-0 text-[#D4D4D4]" />
        );
      }
      // 组件类型 - 支持普通函数组件和 forwardRef 组件
      // forwardRef 组件的 typeof 是 'object'，有 $$typeof 属性
      if (!icon) {
        console.warn("[Sidebar] Invalid icon component:", icon);
        return (
          <Sparkles className="h-[18px] w-[18px] flex-shrink-0 text-[#D4D4D4]" />
        );
      }
      try {
        const Icon = icon as React.ComponentType<{ className?: string }>;
        return (
          <Icon className="h-[18px] w-[18px] flex-shrink-0 text-[#D4D4D4]" />
        );
      } catch (error) {
        console.error("[Sidebar] Error rendering icon:", error);
        return (
          <Sparkles className="h-[18px] w-[18px] flex-shrink-0 text-[#D4D4D4]" />
        );
      }
    },
    []
  );

  // 过滤隐藏的分类 - 使用 useMemo 缓存结果
  const visibleCategories = useMemo(
    () => config.categories.filter((cat) => !cat.hidden),
    [config.categories]
  );

  return (
    <aside
      className={cn(
        "flex h-full w-16 flex-col border-r border-white/5 bg-[#232326]",
        className
      )}
      style={style}
    >
      {/* Logo */}
      <div className="flex h-14 flex-shrink-0 items-center justify-center">
        <button
          onClick={onHomeClick}
          className="flex items-center justify-center"
          aria-label="Home"
        >
          {LOGO_SVG}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2">
        <div className="flex flex-col gap-1">
          {/* Home - 仅在非 Board 页面显示 */}
          {!config.isInBoard && config.showHomeButton !== false && (
            <button
              onClick={onHomeClick}
              className="flex flex-col items-center gap-1 rounded-lg p-2 text-white/60 transition hover:bg-white/5 hover:text-white"
              aria-label="Home"
            >
              <Home className="h-5 w-5" />
              <span
                className="text-[11px] leading-[14px] tracking-normal"
                style={{ color: "var(--neutral-300, #D4D4D4)" }}
              >
                Home
              </span>
            </button>
          )}

          {/* Agent - 仅在非 Board 页面显示，位于 Home 和 Board 之间，支持子菜单 */}
          {!config.isInBoard && config.showAgentButton !== false && (
            <div className="relative">
              <button
                ref={(el) => {
                  if (el) menuItemRefs.current.set("__agent__", el);
                }}
                onMouseEnter={(e) => {
                  cancelClose();
                  const agentSubItems = config.agentSubItems?.filter(
                    (item) => !item.hidden
                  );
                  if (agentSubItems && agentSubItems.length > 0) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const sidebar = e.currentTarget.closest("aside");
                    const sidebarRight = sidebar
                      ? sidebar.getBoundingClientRect().right
                      : rect.right;
                    setSubMenuPosition({
                      top: rect.top,
                      left: sidebarRight + 4,
                    });
                    setExpandedCategory("__agent__");
                  }
                }}
                className="flex w-full flex-col items-center gap-1 rounded-lg p-2 text-white/60 transition hover:bg-white/5 hover:text-white"
                aria-label="Agent"
              >
                <Sparkles className="h-5 w-5" />
                <span
                  className="text-[11px] leading-[14px] tracking-normal"
                  style={{ color: "var(--neutral-300, #D4D4D4)" }}
                >
                  Agent
                </span>
              </button>

              {/* Agent 子菜单 - 使用 Portal 渲染到 body，避免被 overflow 裁剪 */}
              {expandedCategory === "__agent__" &&
                subMenuPosition !== null &&
                config.agentSubItems &&
                config.agentSubItems.filter((item) => !item.hidden).length >
                  0 &&
                createPortal(
                  <div
                    ref={(node) => {
                      agentSubMenuRef.current = node;
                    }}
                    style={{
                      position: "fixed",
                      left: subMenuPosition.left,
                      top: subMenuPosition.top,
                      zIndex: 1050,
                      minWidth: "200px",
                      backgroundColor: "#252525",
                    }}
                    className="rounded-lg border border-white/10 px-2 py-2 shadow-xl"
                    onMouseEnter={cancelClose}
                    onMouseLeave={scheduleClose}
                  >
                    {config.agentSubItems
                      .filter((item) => !item.hidden)
                      .map((item) => (
                        <a
                          key={item.id}
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (item.onClick) {
                              item.onClick();
                            }
                            setExpandedCategory(null);
                          }}
                          className={cn(
                            "flex w-full items-center gap-2 whitespace-nowrap px-2 py-0 transition rounded-lg h-10",
                            "text-[14px] font-normal leading-[20px]",
                            "text-[#D4D4D4] hover:bg-white/5 hover:text-white",
                            item.disabled && "opacity-50 pointer-events-none"
                          )}
                          style={{ cursor: "pointer", textDecoration: "none" }}
                        >
                          {renderSubItemIcon(item.icon)}
                          <span>{item.name}</span>
                        </a>
                      ))}
                  </div>,
                  document.body
                )}
            </div>
          )}

          {/* Board */}
          {config.showBoardButton !== false && (
            <button
              onClick={onBoardClick}
              className="flex flex-col items-center gap-1 rounded-lg p-2 text-white/60 transition hover:bg-white/5 hover:text-white"
              aria-label="Board"
            >
              <Frame className="h-5 w-5" />
              <span
                className="text-[11px] leading-[14px] tracking-normal"
                style={{ color: "var(--neutral-300, #D4D4D4)" }}
              >
                Board
              </span>
            </button>
          )}

          {/* 分隔线 */}
          <div className="my-2 flex justify-center">{SEPARATOR_SVG}</div>

          {/* Tool Categories */}
          <div
            ref={menuRef}
            onMouseEnter={cancelClose}
          >
            {visibleCategories.map((category) => {
              // 过滤隐藏的子项
              const visibleSubItems = category.subItems.filter(
                (item) => !item.hidden
              );

              return (
                <React.Fragment key={category.id}>
                  {/* Separator line for separated categories */}
                  {category.isSeparated && (
                    <div className="my-2 flex justify-center">
                      {SEPARATOR_SVG}
                    </div>
                  )}
                  <div
                    className="relative"
                    onMouseEnter={() => {
                      cancelClose();
                      // 计算子菜单位置 (用于 fixed 定位)
                      const menuItem = menuItemRefs.current.get(category.id);
                      if (menuItem && !category.directTool) {
                        const rect = menuItem.getBoundingClientRect();
                        // 获取 sidebar 元素的右边缘，使子菜单与用户菜单对齐
                        const sidebar = menuItem.closest("aside");
                        const sidebarRight = sidebar
                          ? sidebar.getBoundingClientRect().right
                          : rect.right;
                        setSubMenuPosition({
                          top: rect.top,
                          left: sidebarRight + 4, // 与用户头像菜单左边线对齐
                        });
                      }
                      // For items with directTool (no submenu), close any open submenu
                      // For items with submenu, open the submenu
                      if (category.directTool) {
                        setExpandedCategory(null);
                      } else {
                        handleCategoryHover(category.id);
                      }
                    }}
                  >
                    <div
                      ref={(el) => {
                        if (el) menuItemRefs.current.set(category.id, el);
                      }}
                      className="relative flex w-full"
                    >
                      <button
                        onClick={() => {
                          // Direct click for categories with directTool
                          if (category.directTool) {
                            handleToolClick(category.id, category.directTool!);
                          }
                        }}
                        className={cn(
                          "flex w-full flex-col items-center gap-1 rounded-lg p-2 transition",
                          currentCategory === category.id
                            ? "bg-[#3E3E47] text-white"
                            : "text-white/60 hover:bg-white/5 hover:text-white",
                          category.customClassName
                        )}
                        aria-label={category.name}
                        aria-expanded={expandedCategory === category.id}
                      >
                        {renderCategoryIcon(category.icon)}
                        <span
                          className="text-[11px] leading-[14px] tracking-normal"
                          style={{ color: "var(--neutral-300, #D4D4D4)" }}
                        >
                          {category.name}
                        </span>
                      </button>

                      {/* Submenu popup - only for categories with subItems */}
                      {expandedCategory === category.id &&
                        subMenuPosition !== null &&
                        visibleSubItems.length > 0 &&
                        !category.directTool && (
                          <div
                            ref={(node) => {
                              subMenuRef.current = node;
                            }}
                            style={{
                              position: "fixed",
                              left: subMenuPosition.left,
                              top: subMenuPosition.top,
                              zIndex: 1050,
                              minWidth: "200px",
                              backgroundColor: "#252525",
                            }}
                            className="rounded-lg border border-white/10 px-2 py-2 shadow-xl animate-in fade-in slide-in-from-left-2 duration-150"
                            role="menu"
                            onMouseEnter={cancelClose}
                            onMouseLeave={scheduleClose}
                          >
                            {/* 桥接区：覆盖 sidebar 到子菜单的间隙，方便鼠标移入 */}
                            <div
                              className="absolute right-full top-0 h-full w-[200px]"
                              onMouseEnter={cancelClose}
                              style={{ right: -200 }}
                            />
                            {visibleSubItems.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => {
                                  if (item.onClick) {
                                    item.onClick();
                                  } else {
                                    handleToolClick(category.id, item.id);
                                  }
                                }}
                                disabled={item.disabled}
                                className={cn(
                                  "flex w-full items-center gap-2 whitespace-nowrap px-2 py-0 transition rounded-lg h-10",
                                  // paragraph small/regular
                                  "font-family font-sans",
                                  "text-[14px] font-normal leading-[20px] tracking-normal",
                                  currentTool === item.id
                                    ? "bg-[#3E3E47] text-white"
                                    : "text-[#D4D4D4] hover:bg-white/5 hover:text-white",
                                  item.disabled &&
                                    "opacity-50 cursor-not-allowed"
                                )}
                                role="menuitem"
                                aria-disabled={item.disabled}
                              >
                                {renderSubItemIcon(item.icon)}
                                <span>{item.name}</span>

                                {/* Badge */}
                                {item.badge && (
                                  <span
                                    className={cn(
                                      "ml-auto text-xs",
                                      typeof item.badge === "object" &&
                                        item.badge.type === "new" &&
                                        "bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded",
                                      typeof item.badge === "object" &&
                                        item.badge.type === "beta" &&
                                        "bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded",
                                      typeof item.badge === "object" &&
                                        item.badge.type === "pro" &&
                                        "bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded"
                                    )}
                                  >
                                    {typeof item.badge === "string"
                                      ? item.badge
                                      : typeof item.badge === "number"
                                        ? item.badge
                                        : item.badge.text}
                                  </span>
                                )}

                                {/* Coming Soon */}
                                {item.comingSoon && (
                                  <span className="ml-auto text-xs text-white/40">
                                    Coming Soon
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Bottom Section */}
      <SidebarFooter
        onPromotionClick={onPromotionClick}
        onCreditsClick={onCreditsClick}
        onLoginClick={onLoginClick}
        onChatClick={onChatClick}
        credits={userInfo?.credits}
        isLoggedIn={userInfo?.isLoggedIn ?? false}
        showCredits={config.showCredits}
        showLogin={config.showLoginButton}
        showChat={config.showChatButton}
        userAvatarUrl={userAvatarUrl ?? userInfo?.avatar}
        userName={userInfo?.name}
        userEmail={userInfo?.email}
        userId={userInfo?.id}
        onAvatarDoubleClick={onAvatarDoubleClick}
        renderUserMenu={renderUserMenu}
        planType={userInfo?.planType}
        menuItems={menuItems}
        onNameSave={onNameSave}
        onLogout={onLogout}
        onToast={onToast}
        validateName={validateName}
        currentLanguage={currentLanguage}
        onLanguageChange={onLanguageChange}
        languages={languages}
      />
    </aside>
  );
}

export type { SidebarProps } from "./types";
export default Sidebar;
