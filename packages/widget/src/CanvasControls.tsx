import React from 'react';
import { useReactFlow, useStore } from '@xyflow/react';

export type CanvasControlsProps = {
  isLocked?: boolean;
  onLockChange?: (locked: boolean) => void;
  position?: 'top-left' | 'bottom-left';
};

const BUTTON_STYLE: React.CSSProperties = {
  width: 32,
  height: 32,
  padding: 8,
  borderRadius: 8,
  border: 'none',
  background: 'transparent',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  outline: 'none',
};

const ICON_STYLE: React.CSSProperties = {
  width: 16,
  height: 16,
  display: 'block',
};

const getButtonStyle = (enabled: boolean): React.CSSProperties => ({
  ...BUTTON_STYLE,
  opacity: enabled ? 1 : 0.35,
  cursor: enabled ? 'pointer' : 'not-allowed',
});

function ZoomOutIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={ICON_STYLE}
    >
      <path
        d="M3.33333 8H12.6667"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ZoomInIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={ICON_STYLE}
    >
      <path
        d="M3.33333 8H12.6667"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 3V12.3333"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FitViewIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={ICON_STYLE}
    >
      <path
        d="M2 4.66667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H4.66667"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.3333 2H12.6667C13.0203 2 13.3594 2.14048 13.6095 2.39052C13.8595 2.64057 14 2.97971 14 3.33333V4.66667"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 11.3333V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H11.3333"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.66667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V11.3333"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.6667 5.33333H5.33333C4.96514 5.33333 4.66667 5.63181 4.66667 6V10C4.66667 10.3682 4.96514 10.6667 5.33333 10.6667H10.6667C11.0349 10.6667 11.3333 10.3682 11.3333 10V6C11.3333 5.63181 11.0349 5.33333 10.6667 5.33333Z"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon({ locked }: { locked: boolean }) {
  return locked ? (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={ICON_STYLE}
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
  ) : (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={ICON_STYLE}
    >
      <path
        d="M12.6667 7.33337H3.33333C2.59695 7.33337 2 7.93033 2 8.66671V13.3334C2 14.0698 2.59695 14.6667 3.33333 14.6667H12.6667C13.403 14.6667 14 14.0698 14 13.3334V8.66671C14 7.93033 13.403 7.33337 12.6667 7.33337Z"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.66667 7.33331V4.66665C9.66667 3.56208 8.77124 2.66665 7.66667 2.66665C6.5621 2.66665 5.66667 3.56208 5.66667 4.66665"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CanvasControls({
  isLocked = false,
  onLockChange,
  position = 'bottom-left',
}: CanvasControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const zoom = useStore((state) => state.transform[2] ?? 1);
  const minZoom = useStore((state) => state.minZoom ?? 0.1);
  const maxZoom = useStore((state) => state.maxZoom ?? 4);

  const zoomPercent = Math.round(zoom * 100);
  const canZoomIn = zoom < maxZoom - 0.001;
  const canZoomOut = zoom > minZoom + 0.001;

  const containerPosition: React.CSSProperties =
    position === 'top-left'
      ? { top: 16, left: 16 }
      : { bottom: 16, left: 16 };

  return (
    <div
      style={{
        position: 'absolute',
        ...containerPosition,
        zIndex: 20,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: 4,
          borderRadius: 12,
          background: '#1c1e22',
          border: '1px solid rgba(255,255,255,0.03)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          color: '#ffffff',
          fontFamily: 'Inter, sans-serif',
          pointerEvents: 'auto',
        }}
      >
        <button
          type="button"
          onClick={() => zoomOut({ duration: 0 })}
          style={getButtonStyle(canZoomOut)}
          disabled={!canZoomOut}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <ZoomOutIcon />
        </button>
        <div
          style={{
            width: 32,
            padding: '8px 4px',
            borderRadius: 8,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            lineHeight: '16px',
            fontWeight: 400,
            color: '#ffffff',
          }}
        >
          {zoomPercent}%
        </div>
        <button
          type="button"
          onClick={() => zoomIn({ duration: 0 })}
          style={getButtonStyle(canZoomIn)}
          disabled={!canZoomIn}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <ZoomInIcon />
        </button>
        <button
          type="button"
          onClick={() => fitView({ padding: 0.2, duration: 0 })}
          style={getButtonStyle(true)}
          aria-label="Fit view"
          title="Fit view"
        >
          <FitViewIcon />
        </button>
        <button
          type="button"
          onClick={() => onLockChange?.(!isLocked)}
          style={getButtonStyle(Boolean(onLockChange))}
          aria-label={isLocked ? 'Unlock canvas' : 'Lock canvas'}
          title={isLocked ? '解锁画布' : '锁定画布'}
          disabled={!onLockChange}
        >
          <LockIcon locked={isLocked} />
        </button>
      </div>
    </div>
  );
}
