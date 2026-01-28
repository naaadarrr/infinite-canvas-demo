import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function PanModeIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#clip0_6446_793)">
        <path
          d="M11.9999 7.33329V3.99996C11.9999 3.64634 11.8594 3.3072 11.6094 3.05715C11.3593 2.8071 11.0202 2.66663 10.6666 2.66663C10.313 2.66663 9.97383 2.8071 9.72378 3.05715C9.47373 3.3072 9.33325 3.64634 9.33325 3.99996"
          stroke="currentColor"
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.33341 6.66671V2.66671C9.33341 2.31309 9.19294 1.97395 8.94289 1.7239C8.69284 1.47385 8.3537 1.33337 8.00008 1.33337C7.64646 1.33337 7.30732 1.47385 7.05727 1.7239C6.80722 1.97395 6.66675 2.31309 6.66675 2.66671V4.00004"
          stroke="currentColor"
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.66667 6.99996V3.99996C6.66667 3.64634 6.52619 3.3072 6.27614 3.05715C6.02609 2.8071 5.68696 2.66663 5.33333 2.66663C4.97971 2.66663 4.64057 2.8071 4.39052 3.05715C4.14048 3.3072 4 3.64634 4 3.99996V9.33329"
          stroke="currentColor"
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 5.33333C12 4.97971 12.1405 4.64057 12.3905 4.39052C12.6406 4.14048 12.9797 4 13.3333 4C13.6869 4 14.0261 4.14048 14.2761 4.39052C14.5262 4.64057 14.6667 4.97971 14.6667 5.33333V9.33333C14.6667 10.7478 14.1048 12.1044 13.1046 13.1046C12.1044 14.1048 10.7478 14.6667 9.33332 14.6667H7.99999C6.13332 14.6667 4.99999 14.0933 4.00665 13.1067L1.60665 10.7067C1.37728 10.4526 1.25438 10.1201 1.2634 9.77796C1.27243 9.43581 1.41269 9.11023 1.65513 8.86864C1.89758 8.62705 2.22365 8.48794 2.56584 8.48013C2.90802 8.47232 3.2401 8.59639 3.49332 8.82667L4.66665 10"
          stroke="currentColor"
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_6446_793">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
