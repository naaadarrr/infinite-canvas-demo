"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "../utils/cn";
import { useMenuPosition } from "../hooks/useMenuPosition";
import { UserAvatar } from "./UserAvatar";
import { UserMenuHeader } from "./UserMenuHeader";
import { UserMenuContent } from "./UserMenuContent";
import type { UserMenuItemConfig } from "./types";

export interface SidebarUserMenuProps {
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
   * 用户 ID（用于双击复制）
   */
  userId?: string;
  /**
   * 双击头像后的回调（可用于显示 toast）
   */
  onAvatarDoubleClick?: (userId: string) => void;
  /**
   * 自定义头像渲染 (完全覆盖默认头像)
   */
  renderAvatar?: () => React.ReactNode;
  /**
   * 自定义菜单头部渲染 (完全覆盖默认头部)
   */
  renderMenuHeader?: () => React.ReactNode;
  /**
   * 自定义菜单内容渲染 (完全覆盖默认内容)
   */
  renderMenuContent?: () => React.ReactNode;
  /**
   * 菜单样式类名
   */
  menuClassName?: string;

  // ========== 自治模式 Props ==========

  /**
   * 菜单项配置列表 — 驱动默认 UserMenuContent
   */
  menuItems?: UserMenuItemConfig[];
  /**
   * 编辑名称的异步保存回调
   */
  onNameSave?: (newName: string) => Promise<void>;
  /**
   * 登出回调 — 传入则显示 Logout 菜单项
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

  // ========== 语言选择器 Props ==========

  /**
   * 当前语言
   */
  currentLanguage?: string;
  /**
   * 语言变更回调
   */
  onLanguageChange?: (language: string) => void;
  /**
   * 可选语言列表 (不传则用内置默认列表)
   */
  languages?: string[];
}

/**
 * Sidebar 用户菜单组件
 *
 * 特性：
 * - 自动计算位置，左边缘与 Sidebar 右边缘对齐
 * - 下边缘与头像下边缘对齐
 * - 自治模式：传入 menuItems / onNameSave / onLogout 即可工作
 * - 覆盖模式：通过 renderAvatar / renderMenuHeader / renderMenuContent 完全自定义
 */
export function SidebarUserMenu({
  userAvatarUrl,
  userName,
  userEmail,
  userId,
  onAvatarDoubleClick,
  renderAvatar,
  renderMenuHeader,
  renderMenuContent,
  menuClassName,
  // 自治模式 props
  menuItems,
  onNameSave,
  onLogout,
  onToast,
  validateName,
  // 语言选择器 props
  currentLanguage,
  onLanguageChange,
  languages,
}: SidebarUserMenuProps) {
  // 内部 localUserName 状态, 实现乐观更新
  const [localUserName, setLocalUserName] = useState(userName || "");

  // 同步外部 userName → localUserName
  useEffect(() => {
    if (userName && userName !== localUserName) {
      setLocalUserName(userName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName]);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentNodeRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 清除关闭定时器
  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  // 延迟关闭
  const scheduleClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, 100);
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  // 点击外部关闭菜单
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // 如果点击的是触发器或菜单内部，不关闭
      if (
        triggerRef.current?.contains(target) ||
        contentNodeRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    // 使用 mousedown 而不是 click，响应更快
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const { menuPosition, setMenuPosition } = useMenuPosition({
    triggerRef,
    open,
    sidebarGap: 4,
    mode: "user-menu",
  });

  // 使用 ref callback 在内容渲染后立即调整位置
  const contentRefCallback = useCallback((node: HTMLDivElement | null) => {
    // 保存节点引用用于点击外部检测
    contentNodeRef.current = node;
  }, []);

  // 当 menuPosition 或 contentNodeRef 变化时调整位置
  useEffect(() => {
    if (!contentNodeRef.current || !triggerRef.current || !menuPosition) {
      return;
    }

    const node = contentNodeRef.current;
    // 获取尺寸信息
    const contentRect = node.getBoundingClientRect();
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // 菜单高度
    const menuHeight = contentRect.height;
    // 理想位置：下边缘与头像下边缘对齐
    const idealTop = triggerRect.bottom - menuHeight;

    // 边距（底部留更多空间）
    const marginTop = 15;
    const marginBottom = 40;

    let finalTop: number;

    // 检查理想位置下菜单是否完全在视口内
    const idealBottom = idealTop + menuHeight;
    const wouldOverflowTop = idealTop < marginTop;
    const wouldOverflowBottom = idealBottom > viewportHeight - marginBottom;

    if (!wouldOverflowTop && !wouldOverflowBottom) {
      // 理想情况：菜单可以完全显示，下边缘与头像下边缘对齐
      finalTop = idealTop;
    } else if (wouldOverflowBottom && !wouldOverflowTop) {
      // 菜单底部超出视口，向上调整使底部贴近视口底部
      finalTop = viewportHeight - marginBottom - menuHeight;
      // 但确保不超出顶部
      if (finalTop < marginTop) {
        finalTop = marginTop;
      }
    } else if (wouldOverflowTop) {
      // 菜单顶部超出视口，顶部贴近视口顶部
      finalTop = marginTop;
    } else {
      // 兜底：顶部对齐
      finalTop = marginTop;
    }

    // 只在位置需要调整时才更新
    if (finalTop !== menuPosition.top) {
      setMenuPosition((prev) => (prev ? { ...prev, top: finalTop } : null));
    }
  }, [menuPosition, setMenuPosition]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setMenuPosition(null);
    }
  };

  // Hover 进入头像
  const handleMouseEnter = useCallback(() => {
    cancelClose();
    setOpen(true);
  }, [cancelClose]);

  // Hover 离开头像
  const handleMouseLeave = useCallback(() => {
    scheduleClose();
  }, [scheduleClose]);

  // Hover 进入菜单
  const handleContentMouseEnter = useCallback(() => {
    cancelClose();
  }, [cancelClose]);

  // Hover 离开菜单
  const handleContentMouseLeave = useCallback(() => {
    scheduleClose();
  }, [scheduleClose]);

  // 双击头像复制用户 ID
  const handleAvatarDoubleClick = useCallback(() => {
    if (userId) {
      // 复制到剪贴板
      navigator.clipboard
        .writeText(userId)
        .then(() => {
          // 通知父组件显示 toast
          onAvatarDoubleClick?.(userId);
        })
        .catch((err) => {
          console.error("Failed to copy user ID:", err);
        });
    }
  }, [userId, onAvatarDoubleClick]);

  return (
    <>
      <div
        ref={triggerRef}
        className="flex items-center justify-center"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleAvatarDoubleClick}
      >
        {renderAvatar ? (
          renderAvatar()
        ) : (
          <UserAvatar
            userAvatar={userAvatarUrl}
            size="lg"
          />
        )}
      </div>

      {menuPosition && open && (
        <div
          ref={contentRefCallback}
          onMouseEnter={handleContentMouseEnter}
          onMouseLeave={handleContentMouseLeave}
          style={{
            position: "fixed",
            left: menuPosition.left,
            top: menuPosition.top,
            zIndex: 1003,
          }}
          className={cn(
            "w-60 rounded-xl border border-gray-800 bg-[#1e1e20]",
            "text-gray-300 shadow-2xl overflow-hidden",
            "min-w-[200px] max-w-[240px]",
            "animate-in fade-in zoom-in-95",
            "origin-[--radix-popover-content-transform-origin]",
            menuClassName
          )}
        >
          {renderMenuHeader ? (
            renderMenuHeader()
          ) : (
            <UserMenuHeader
              userAvatarUrl={userAvatarUrl}
              userName={localUserName}
              userEmail={userEmail}
              onNameSave={onNameSave}
              onNameChange={setLocalUserName}
              onToast={onToast}
              validateName={validateName}
              compact
            />
          )}

          {renderMenuContent ? (
            renderMenuContent()
          ) : (
            <UserMenuContent
              items={menuItems}
              onLogout={onLogout}
              currentLanguage={currentLanguage}
              onLanguageChange={onLanguageChange}
              languages={languages}
              compact
            />
          )}
        </div>
      )}
    </>
  );
}
