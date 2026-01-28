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

export function CanvasControls({
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
      </div>
    </div>
  );
}
