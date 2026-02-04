import React from 'react';

/**
 * 媒体加载动画组件
 * 用于显示媒体文件正在下载/URL正在解析的状态
 * 特性：45度斜条纹动画 + 霓虹灯光效果 + 磨砂玻璃遮罩
 */
export function MediaLoading() {
  return (
    <>
      <style>
        {`
          @keyframes media-loading-stripe {
            0% {
              background-position: 0 0;
            }
            100% {
              background-position: 60px 60px;
            }
          }
          @keyframes media-loading-glow {
            0% {
              filter: hue-rotate(0deg) brightness(1);
            }
            50% {
              filter: hue-rotate(60deg) brightness(1.2);
            }
            100% {
              filter: hue-rotate(0deg) brightness(1);
            }
          }
          @keyframes media-loading-pulse {
            0% {
              opacity: 0.6;
            }
            50% {
              opacity: 0.9;
            }
            100% {
              opacity: 0.6;
            }
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
          background: '#1a1a1a',
        }}
      >
        {/* 霓虹灯条纹背景层 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(
              45deg,
              rgba(0, 255, 255, 0.15) 0px,
              rgba(0, 255, 255, 0.15) 10px,
              rgba(255, 0, 255, 0.15) 10px,
              rgba(255, 0, 255, 0.15) 20px,
              rgba(0, 255, 128, 0.15) 20px,
              rgba(0, 255, 128, 0.15) 30px,
              rgba(255, 128, 0, 0.12) 30px,
              rgba(255, 128, 0, 0.12) 40px,
              rgba(128, 0, 255, 0.15) 40px,
              rgba(128, 0, 255, 0.15) 50px,
              rgba(0, 128, 255, 0.15) 50px,
              rgba(0, 128, 255, 0.15) 60px
            )`,
            backgroundSize: '84.85px 84.85px', /* 60px * sqrt(2) for 45deg */
            animation: 'media-loading-stripe 1.5s linear infinite, media-loading-glow 4s ease-in-out infinite',
          }}
        />
        
        {/* 额外的霓虹光晕效果 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(ellipse at 20% 30%, rgba(0, 255, 255, 0.2) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 70%, rgba(255, 0, 255, 0.2) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(0, 255, 128, 0.1) 0%, transparent 60%)
            `,
            animation: 'media-loading-pulse 2s ease-in-out infinite',
          }}
        />
        
        {/* 磨砂玻璃效果层 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(30, 30, 30, 0.4)',
            backdropFilter: 'blur(8px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(8px) saturate(1.2)',
          }}
        />
        
        {/* 加载指示器 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {/* 加载图标 */}
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              animation: 'media-loading-pulse 1.5s ease-in-out infinite',
            }}
          >
            <path
              d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
              stroke="rgba(200, 200, 200, 0.6)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M7 10L12 15L17 10"
              stroke="rgba(200, 200, 200, 0.6)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 15V3"
              stroke="rgba(200, 200, 200, 0.6)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          
          {/* 文字提示 */}
          <span
            style={{
              fontSize: 11,
              color: 'rgba(200, 200, 200, 0.6)',
              fontWeight: 500,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            Loading...
          </span>
        </div>
      </div>
    </>
  );
}
