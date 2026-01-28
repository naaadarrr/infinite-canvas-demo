import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  locked?: boolean;
}

export function LockModeIcon({ size = 16, locked = false, ...props }: IconProps) {
  return locked ? (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.6667 7.33334H3.33333C2.59695 7.33334 2 7.9303 2 8.66668V13.3333C2 14.0697 2.59695 14.6667 3.33333 14.6667H12.6667C13.403 14.6667 14 14.0697 14 13.3333V8.66668C14 7.9303 13.403 7.33334 12.6667 7.33334Z" stroke="white" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M4.66666 7.33334V4.66668C4.66666 3.78262 5.01785 2.93478 5.64297 2.30965C6.26809 1.68453 7.11593 1.33334 7.99999 1.33334C8.88404 1.33334 9.73189 1.68453 10.357 2.30965C10.9821 2.93478 11.3333 3.78262 11.3333 4.66668V7.33334" stroke="white" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  ) : (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12.6667 7.33337H3.33333C2.59695 7.33337 2 7.93033 2 8.66671V13.3334C2 14.0698 2.59695 14.6667 3.33333 14.6667H12.6667C13.403 14.6667 14 14.0698 14 13.3334V8.66671C14 7.93033 13.403 7.33337 12.6667 7.33337Z"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.66675 7.33331V4.66665C4.66592 3.84001 4.97227 3.04256 5.52633 2.42909C6.08039 1.81563 6.84264 1.42992 7.66509 1.34684C8.48754 1.26376 9.31151 1.48925 9.97707 1.97952C10.6426 2.4698 11.1023 3.18988 11.2667 3.99998"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
