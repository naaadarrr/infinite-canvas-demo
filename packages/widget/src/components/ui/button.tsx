/**
 * Adapter: Button for product-photography ToolBar / Dialog (resolves @/components/ui/button)
 */
import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'secondary' | 'default';
  className?: string;
  children?: React.ReactNode;
}

export function Button({ variant = 'default', className = '', children, ...rest }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none';
  const variants = {
    default: 'bg-[#4E40F3] text-white hover:bg-[#6255FF]',
    secondary: 'bg-[#272729] text-white hover:bg-[#3A3A3C]',
    ghost: 'bg-transparent hover:bg-white/10',
  };
  return (
    <button type="button" className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
