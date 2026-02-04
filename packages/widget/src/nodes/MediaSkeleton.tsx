import React from 'react';

export function MediaSkeleton() {
  return (
    <>
      <style>
        {`
          @keyframes media-skeleton-gradient-shift {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
          @keyframes media-skeleton-shimmer {
            0% { transform: translateX(-120%); }
            100% { transform: translateX(120%); }
          }
          @keyframes media-skeleton-pulse {
            0% { opacity: 0.9; }
            50% { opacity: 0.7; }
            100% { opacity: 0.9; }
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
          background: 'linear-gradient(135deg, rgb(37, 37, 37) 0%, rgb(30, 30, 30) 25%, rgb(24, 24, 24) 50%, rgb(30, 30, 30) 75%, rgb(37, 37, 37) 100%)',
          backgroundSize: '200% 200%',
          animation: 'media-skeleton-gradient-shift 2s ease-in-out infinite, media-skeleton-pulse 1.5s ease-in-out infinite',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255, 0.05) 50%, rgba(255,255,255,0) 100%)',
            animation: 'media-skeleton-shimmer 1.5s linear infinite',
          }}
        />
      </div>
    </>
  );
}
