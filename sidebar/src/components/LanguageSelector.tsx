"use client";

import { useState, useRef } from "react";
import { Check } from "lucide-react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "../utils/cn";
import type { LanguageSelectorProps } from "./types";

/**
 * 语言选择器组件
 *
 * 弹出式子菜单, hover 触发, 从右侧弹出语言列表
 *
 * @example
 * ```tsx
 * <LanguageSelector
 *   currentLanguage="English"
 *   onSelect={(lang) => console.log(lang)}
 *   languages={["English", "简体中文", "日本語"]}
 *   compact
 * >
 *   <div>Language trigger</div>
 * </LanguageSelector>
 * ```
 */
export function LanguageSelector({
  currentLanguage,
  onSelect,
  languages,
  compact = false,
  children,
}: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const clearCloseTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    clearCloseTimeout();
    setOpen(true);
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    clearCloseTimeout();
    timeoutRef.current = setTimeout(() => {
      const relatedTarget = e.relatedTarget as HTMLElement;
      const contentEl = contentRef.current;
      if (!contentEl?.contains(relatedTarget)) {
        setOpen(false);
      }
    }, 100);
  };

  const handleContentMouseEnter = () => {
    clearCloseTimeout();
  };

  const handleContentMouseLeave = () => {
    clearCloseTimeout();
    timeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 100);
  };

  const handleSelect = (language: string) => {
    onSelect(language);
    setOpen(false);
  };

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverPrimitive.Trigger asChild>
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {children}
        </div>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          ref={contentRef}
          align="start"
          side="right"
          sideOffset={8}
          onMouseEnter={handleContentMouseEnter}
          onMouseLeave={handleContentMouseLeave}
          className={cn(
            "!z-[1004] w-64 bg-[#1c1c1e] rounded-2xl py-2 shadow-2xl border border-white/5",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
        >
          <div>
            {languages.map((language) => {
              const isSelected = language === currentLanguage;
              return (
                <button
                  key={language}
                  onClick={() => handleSelect(language)}
                  className={cn(
                    "w-full flex items-center justify-between",
                    "hover:bg-[#2c2c2e] transition-colors group",
                    compact ? "px-4 py-2.5" : "px-5 py-3.5"
                  )}
                >
                  <span
                    className={cn(
                      "font-medium transition-colors",
                      compact ? "text-[13px]" : "text-[15px]",
                      isSelected
                        ? "text-white"
                        : "text-gray-300 group-hover:text-white"
                    )}
                  >
                    {language}
                  </span>
                  {isSelected && (
                    <Check
                      className={cn(
                        "text-indigo-500 stroke-[3px]",
                        compact ? "w-4 h-4" : "w-5 h-5"
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
