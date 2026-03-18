"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { cn } from "../utils/cn";
import { EditNameModal } from "./EditNameModal";
import type { UserMenuHeaderProps } from "./types";

/**
 * 用户菜单头部组件
 *
 * 显示用户头像、用户名、邮箱, 以及编辑名称按钮
 *
 * @example
 * ```tsx
 * <UserMenuHeader
 *   userAvatarUrl="https://example.com/avatar.jpg"
 *   userName="Alice"
 *   userEmail="alice@example.com"
 *   onNameSave={async (name) => { await api.updateName(name); }}
 *   onNameChange={(name) => setLocalName(name)}
 *   onToast={(msg, type) => toast({ title: msg, variant: type })}
 *   compact
 * />
 * ```
 */
export function UserMenuHeader({
  userAvatarUrl,
  userName,
  userEmail,
  onNameSave,
  onNameChange,
  onToast,
  validateName,
  compact = false,
  className,
}: UserMenuHeaderProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleSaveName = async (newName: string) => {
    // 乐观更新本地状态
    onNameChange?.(newName);

    // 异步保存到服务器
    if (onNameSave) {
      await onNameSave(newName);
    }
  };

  return (
    <>
      <div
        className={cn(
          "flex items-center justify-between border-b border-gray-800/50",
          compact ? "p-3 gap-2" : "p-4 space-x-3",
          className
        )}
      >
        <div
          className={cn("flex items-center", compact ? "gap-2" : "space-x-3")}
        >
          {userAvatarUrl ? (
            <img
              src={userAvatarUrl}
              alt="User Avatar"
              className={cn(
                "rounded-full object-cover flex-shrink-0",
                compact ? "w-8 h-8" : "w-10 h-10"
              )}
            />
          ) : (
            <div
              className={cn(
                "rounded-full bg-gradient-to-br from-yellow-400 via-orange-400 via-red-500 to-purple-500 flex-shrink-0",
                compact ? "w-8 h-8" : "w-10 h-10"
              )}
            />
          )}
          <div className="overflow-hidden">
            <p
              className={cn(
                "text-white font-medium truncate",
                compact ? "w-24 text-xs" : "w-32 text-sm"
              )}
            >
              {userName}
            </p>
            {/* 紧凑模式不显示邮箱 */}
            {!compact && userEmail && (
              <p className="text-xs text-gray-500 truncate">{userEmail}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setIsEditModalOpen(true)}
          className={cn(
            "rounded hover:bg-gray-700 transition focus:outline-none focus:ring-0 border-none bg-transparent",
            compact ? "p-1.5" : "p-2"
          )}
        >
          <Pencil
            className={cn("text-white", compact ? "w-3.5 h-3.5" : "w-4 h-4")}
          />
        </button>
      </div>

      <EditNameModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        currentName={userName}
        onSave={handleSaveName}
        onToast={onToast}
        validateName={validateName}
      />
    </>
  );
}
