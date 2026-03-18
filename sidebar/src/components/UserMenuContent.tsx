"use client";

import { LogOut, ChevronRight } from "lucide-react";
import { cn } from "../utils/cn";
import { UserMenuItem } from "./UserMenuItem";
import { LanguageSelector } from "./LanguageSelector";
import { DEFAULT_LANGUAGES } from "./types";
import type { UserMenuContentProps, UserMenuItemConfig } from "./types";

/**
 * 用户菜单内容组件
 *
 * 根据 items 配置渲染菜单项, 按 group 自动分组, 组间渲染分隔线
 * 支持 type="language" 的菜单项弹出语言选择器
 *
 * @example
 * ```tsx
 * <UserMenuContent
 *   items={[
 *     { id: "home", label: "Home", icon: Home, group: "main", onClick: () => router.push("/home") },
 *     { id: "language", label: "Language", icon: Globe, group: "main", type: "language" },
 *   ]}
 *   currentLanguage="English"
 *   onLanguageChange={(lang) => console.log(lang)}
 *   onLogout={async () => { await signOut(); }}
 *   compact
 * />
 * ```
 */
export function UserMenuContent({
  items = [],
  compact = false,
  onLogout,
  className,
  currentLanguage = "English",
  onLanguageChange,
  languages,
}: UserMenuContentProps) {
  const languageList = languages || DEFAULT_LANGUAGES;

  // 过滤隐藏项, 按 group 分组
  const visibleItems = items.filter((item) => !item.hidden);

  // 保持插入顺序的分组
  const groupedItems: Array<{
    group: string;
    items: UserMenuItemConfig[];
  }> = [];

  for (const item of visibleItems) {
    const group = item.group || "default";
    const lastGroup = groupedItems[groupedItems.length - 1];
    if (lastGroup && lastGroup.group === group) {
      lastGroup.items.push(item);
    } else {
      groupedItems.push({ group, items: [item] });
    }
  }

  const handleLanguageSelect = (language: string) => {
    onLanguageChange?.(language);
  };

  const renderItem = (item: UserMenuItemConfig) => {
    // 语言选择器 — 弹出式子菜单
    if (item.type === "language") {
      const Icon = item.icon;

      return (
        <LanguageSelector
          key={item.id}
          currentLanguage={currentLanguage}
          onSelect={handleLanguageSelect}
          languages={languageList}
          compact={compact}
        >
          <div
            className={cn(
              "w-full flex items-center transition-colors group cursor-pointer",
              compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm",
              "text-gray-300 hover:bg-[#2c2c2e]/50 hover:text-white"
            )}
          >
            <Icon
              className={cn(
                "opacity-80 group-hover:opacity-100",
                compact ? "w-4 h-4 mr-3" : "w-5 h-5 mr-4"
              )}
            />
            <span className="flex-grow text-left">{item.label}</span>
            <ChevronRight
              className={cn("opacity-50", compact ? "w-3 h-3" : "w-4 h-4")}
            />
          </div>
        </LanguageSelector>
      );
    }

    // 普通菜单项
    return (
      <UserMenuItem
        key={item.id}
        icon={item.icon}
        label={item.label}
        onClick={item.onClick}
        variant={item.variant}
        compact={compact}
      />
    );
  };

  return (
    <div className={className}>
      {groupedItems.map((groupData, groupIndex) => (
        <div key={groupData.group}>
          {groupIndex > 0 && (
            <div className="my-2 border-b border-gray-800/50" />
          )}
          <div className={cn(compact ? "space-y-0.5" : "space-y-1")}>
            {groupData.items.map(renderItem)}
          </div>
        </div>
      ))}

      {/* Logout */}
      {onLogout && (
        <>
          <div className="mt-2 mb-[10px] border-b border-gray-800/50" />
          <div className="pb-[10px]">
            <UserMenuItem
              icon={LogOut}
              label="Logout"
              variant="logout"
              onClick={onLogout}
              compact={compact}
            />
          </div>
        </>
      )}
    </div>
  );
}
