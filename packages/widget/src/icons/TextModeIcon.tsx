import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function TextModeIcon({ size = 16, ...props }: IconProps) {
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
        d="M8 2.66663V13.3333"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.66675 4.66663V3.33329C2.66675 3.15648 2.73699 2.98691 2.86201 2.86189C2.98703 2.73686 3.1566 2.66663 3.33341 2.66663H12.6667C12.8436 2.66663 13.0131 2.73686 13.1382 2.86189C13.2632 2.98691 13.3334 3.15648 13.3334 3.33329V4.66663"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 13.3334H10"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
