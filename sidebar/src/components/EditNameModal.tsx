"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2 } from "lucide-react";
import { cn } from "../utils/cn";
import { defaultValidateUserName } from "./types";
import type { EditNameModalProps } from "./types";

/**
 * VisuallyHidden — 隐藏但保持屏幕阅读器可访问
 */
function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-normal border-0">
      {children}
    </span>
  );
}

/**
 * 编辑名称弹窗
 *
 * 特性:
 * - 内置用户名验证 (可通过 validateName 覆盖)
 * - 异步保存, 内部管理 loading/error 状态
 * - 支持 Enter 保存, Escape 关闭
 * - 通过 onToast 回调通知应用层显示提示
 *
 * @example
 * ```tsx
 * <EditNameModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   currentName="Alice"
 *   onSave={async (name) => { await api.updateName(name); }}
 *   onToast={(msg, type) => toast({ title: msg, variant: type })}
 * />
 * ```
 */
export function EditNameModal({
  open,
  onOpenChange,
  currentName = "",
  onSave,
  onToast,
  validateName,
}: EditNameModalProps) {
  const [name, setName] = useState(currentName);
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const validate = validateName || defaultValidateUserName;

  // 当弹窗打开或 currentName 变化时更新输入值
  useEffect(() => {
    if (open) {
      setName(currentName);
      setError("");
    }
  }, [open, currentName]);

  const handleInputChange = (value: string) => {
    setName(value);
    const validationError = validate(value);
    setError(validationError);
  };

  const handleSave = async () => {
    const validationError = validate(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    const newName = name.trim();

    // 名字没有变化, 直接关闭
    if (newName === currentName) {
      onOpenChange(false);
      return;
    }

    if (onSave) {
      setIsPending(true);
      try {
        await onSave(newName);
        onToast?.("Name updated successfully", "success");
        onOpenChange(false);
      } catch (err) {
        console.error("Failed to update username:", err);
        onToast?.("Failed to update name, please try again", "error");
      } finally {
        setIsPending(false);
      }
    } else {
      // 无 onSave 回调时, 直接关闭
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !error && !isPending) {
      handleSave();
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={onOpenChange}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-[110] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[110]",
            "w-[400px] bg-[#1c1c1e] rounded-2xl p-6 shadow-2xl border border-white/5",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
        >
          {/* 隐藏的标题, 用于屏幕阅读器 */}
          <VisuallyHidden>
            <Dialog.Title>Edit Name</Dialog.Title>
            <Dialog.Description>Change your display name</Dialog.Description>
          </VisuallyHidden>

          {/* 关闭按钮 */}
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition disabled:opacity-50"
              disabled={isPending}
            >
              <X className="w-6 h-6" />
            </button>
          </Dialog.Close>

          <div className="mt-8 space-y-6">
            {/* 输入框 */}
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter name"
                autoFocus
                disabled={isPending}
                className={cn(
                  "w-full bg-transparent border rounded-xl",
                  "px-4 py-3 text-white",
                  "focus:outline-none transition-colors",
                  "placeholder:text-gray-500",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  error
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-700 focus:border-gray-500"
                )}
              />
              {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
            </div>

            {/* 按钮组 */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className={cn(
                  "px-6 py-2.5 rounded-xl bg-[#3a3a3c] text-white font-medium",
                  "hover:bg-[#48484a] transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!!error || !name.trim() || isPending}
                className={cn(
                  "px-6 py-2.5 rounded-xl bg-[#4b3af3] text-white font-medium",
                  "hover:bg-[#5a4cf5] shadow-lg shadow-blue-900/20",
                  "transition-all active:scale-95 flex items-center gap-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#4b3af3]"
                )}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Change"
                )}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
