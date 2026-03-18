import { useState, useEffect, RefObject } from "react";

export interface MenuPosition {
  top: number;
  left: number;
}

export interface UseMenuPositionOptions {
  /**
   * 触发器元素的 ref
   */
  triggerRef: RefObject<HTMLElement>;
  /**
   * 是否打开
   */
  open: boolean;
  /**
   * 菜单与 Sidebar 右边缘的间距
   * @default 4
   */
  sidebarGap?: number;
  /**
   * 菜单定位模式
   * - 'submenu': 子菜单模式，左边缘与触发器右边缘对齐
   * - 'user-menu': 用户菜单模式，左边缘与 Sidebar 右边缘对齐，下边缘与触发器下边缘对齐
   */
  mode?: "submenu" | "user-menu";
}

/**
 * 统一的菜单位置计算 Hook
 *
 * 自动计算弹出菜单的位置，支持子菜单和用户菜单两种模式
 */
export function useMenuPosition({
  triggerRef,
  open,
  sidebarGap = 4,
  mode = "submenu",
}: UseMenuPositionOptions) {
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

  // 初始位置计算
  useEffect(() => {
    if (open && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();

      // 获取 Sidebar 元素
      const sidebar = triggerRef.current.closest("aside");
      if (!sidebar) {
        console.warn("[useMenuPosition] Sidebar element not found");
        return;
      }

      const sidebarRect = sidebar.getBoundingClientRect();

      let top: number;
      let left: number;

      if (mode === "user-menu") {
        // 用户菜单模式：从头像顶部开始，渲染后调整使下边缘对齐
        top = triggerRect.top;
        left = sidebarRect.right + sidebarGap;
      } else {
        // 子菜单模式：左边缘与触发器右边缘对齐，顶部与触发器顶部对齐
        top = triggerRect.top;
        left = triggerRect.right + sidebarGap;
      }

      setMenuPosition({ top, left });
    }
  }, [open, triggerRef, sidebarGap, mode]);

  return { menuPosition, setMenuPosition };
}
