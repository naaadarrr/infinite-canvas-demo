import React from 'react';

export function MediaSkeleton() {
  return (
    <>
      <style>
        {`
          @keyframes media-skeleton-shimmer {
            0% { transform: translateX(-120%); }
            100% { transform: translateX(120%); }
          }
          @keyframes media-skeleton-pulse {
            0% { opacity: 0.85; }
            50% { opacity: 0.55; }
            100% { opacity: 0.85; }
          }
        `}
      </style>
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: 'transparent',
          animation: 'media-skeleton-pulse 1.1s ease-in-out infinite',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(229,231,235,0) 0%, rgba(229,231,235, 0.4) 50%, rgba(229,231,235,0) 100%)',
            animation: 'media-skeleton-shimmer 1.2s linear infinite',
          }}
        />
      </div>
    </>
  );
}
