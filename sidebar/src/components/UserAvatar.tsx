/**
 * UserAvatar 组件 - 用户头像显示
 *
 * 支持的功能:
 * - 自定义头像图片或默认渐变背景
 * - 多种尺寸 (sm, md, lg)
 * - 点击事件
 * - Hover 效果
 *
 * @module components/UserAvatar
 */

import { cn } from "../utils/cn";

export interface UserAvatarProps {
  /**
   * 用户头像图片 URL
   */
  userAvatar?: string;
  /**
   * 点击回调
   */
  onClick?: () => void;
  /**
   * 自定义类名
   */
  className?: string;
  /**
   * 头像尺寸
   * - 'sm': 16x16px (默认，响应式)
   * - 'md': 24x24px
   * - 'lg': 32x32px
   *
   * @default 'sm'
   */
  size?: "sm" | "md" | "lg";
}

/**
 * UserAvatar 组件
 *
 * 显示用户头像，如果没有图片则显示默认的渐变背景
 *
 * @example
 * ```tsx
 * // 使用默认尺寸
 * <UserAvatar userAvatar="https://example.com/avatar.jpg" />
 *
 * // 大尺寸 + 点击事件
 * <UserAvatar
 *   userAvatar={user.image}
 *   size="lg"
 *   onClick={() => console.log('clicked')}
 * />
 *
 * // 无图片时显示默认渐变
 * <UserAvatar size="md" />
 * ```
 */
export function UserAvatar({
  userAvatar,
  onClick,
  className,
  size = "sm",
}: UserAvatarProps) {
  const sizeClasses = {
    sm: "w-4 h-4 md:w-5 md:h-5 xl:w-6 xl:h-6", // 默认响应式尺寸
    md: "w-6 h-6", // 24x24px
    lg: "w-8 h-8", // 32x32px
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        sizeClasses[size],
        "rounded-full",
        "bg-gradient-to-br from-yellow-400 via-orange-400 via-red-500 to-purple-500",
        "flex items-center justify-center",
        "cursor-pointer hover:opacity-80 transition-opacity",
        "shadow-sm",
        className
      )}
    >
      {userAvatar ? (
        <img
          src={userAvatar}
          alt="User Avatar"
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <div
          className={cn(
            "w-full h-full rounded-full",
            "bg-gradient-to-br from-yellow-400 via-orange-400 via-red-500 to-purple-500"
          )}
        />
      )}
    </div>
  );
}
