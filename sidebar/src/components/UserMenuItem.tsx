"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "../utils/cn";
import type { UserMenuItemProps } from "./types";

/**
 * 用户菜单项组件
 *
 * @example
 * ```tsx
 * <UserMenuItem icon={Home} label="Home" onClick={() => router.push("/home")} />
 * <UserMenuItem icon={LogOut} label="Logout" variant="logout" onClick={handleLogout} />
 * ```
 */
export function UserMenuItem({
  icon: Icon,
  label,
  showChevron = false,
  onClick,
  className,
  variant = "default",
  compact = false,
}: UserMenuItemProps) {
  const isLogout = variant === "logout";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center transition-colors group",
        compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm",
        isLogout
          ? "text-gray-400 hover:bg-[#2c2c2e] hover:text-white"
          : "text-gray-300 hover:bg-[#2c2c2e]/50 hover:text-white",
        className
      )}
    >
      <Icon
        className={cn(
          "opacity-80 group-hover:opacity-100",
          compact ? "w-4 h-4 mr-3" : "w-5 h-5 mr-4"
        )}
      />
      <span className="flex-grow text-left">{label}</span>
      {showChevron && (
        <ChevronRight
          className={cn("opacity-50", compact ? "w-3 h-3" : "w-4 h-4")}
        />
      )}
    </button>
  );
}
