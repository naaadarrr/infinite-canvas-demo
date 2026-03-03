import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function EditModeIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M3.5 2L3.5 12L6.2 9.3L9.2 13.5L11 12.5L8 8.3L11.5 8.3L3.5 2Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
