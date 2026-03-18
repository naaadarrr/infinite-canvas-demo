import React from 'react';
import { useReactFlow, useStore } from '@xyflow/react';

import { ShortcutBadge } from './components/ShortcutBadge';

export type CanvasControlsProps = {
  isLocked?: boolean;
  onLockChange?: (locked: boolean) => void;
  position?: 'top-left' | 'bottom-left';
  style?: React.CSSProperties;
  className?: string;
};

const ICON_STYLE: React.CSSProperties = {
  width: 16,
  height: 16,
  display: 'block',
};

function ZoomOutIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={ICON_STYLE}>
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5 7H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ZoomInIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={ICON_STYLE}>
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5 7H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M7 5V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ControlButton({ label, shortcutKeys, onClick, disabled, ariaLabel, children }: {
  label: string;
  shortcutKeys?: string[];
  onClick: () => void;
  disabled?: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className="tc-canvas-control-button"
        style={{
          width: 32,
          height: 32,
          padding: 0,
          borderRadius: 6,
          border: 'none',
          background: hovered && !disabled ? 'rgba(255,255,255,0.1)' : 'transparent',
          color: disabled ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background 120ms ease, color 120ms ease',
        }}
      >
        {children}
      </button>
      {hovered && !disabled && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: 6,
          padding: '5px 8px',
          borderRadius: 6,
          background: '#252525',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          color: '#fff',
          fontSize: 11,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
        }}>
          <span>{label}</span>
          {shortcutKeys && <ShortcutBadge keys={shortcutKeys} />}
        </div>
      )}
    </div>
  );
}

export function CanvasControls({
  position = 'bottom-left',
  style,
  className,
}: CanvasControlsProps) {
  const { zoomIn, zoomOut, zoomTo } = useReactFlow();
  const zoom = useStore((state) => state.transform[2] ?? 1);
  const minZoom = useStore((state) => state.minZoom ?? 0.1);
  const maxZoom = useStore((state) => state.maxZoom ?? 4);
  const [zoomHovered, setZoomHovered] = React.useState(false);

  const zoomPercent = Math.round(zoom * 100);
  const canZoomIn = zoom < maxZoom - 0.001;
  const canZoomOut = zoom > minZoom + 0.001;

  const handleZoomReset = React.useCallback(() => {
    zoomTo(1, { duration: 200 });
  }, [zoomTo]);

  const containerPosition: React.CSSProperties = style ? {} :
    position === 'top-left'
      ? { top: 16, left: 16 }
      : { bottom: 16, left: 16 };

  const isAbsolute = !style;

  return (
    <div
      className={className}
      style={{
        position: isAbsolute ? 'absolute' : 'relative',
        ...containerPosition,
        zIndex: 20,
        pointerEvents: 'none',
        ...style,
      }}
    >
      <div
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          pointerEvents: 'auto',
          color: '#ffffff',
          fontFamily: 'Inter, sans-serif',
          background: 'rgba(28, 30, 34, 1)', // Dark background like other panels
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, // Pill shape
          padding: '2px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}
      >
        {/* Zoom group */}
        <ControlButton
          label="Zoom out"
          shortcutKeys={['⌘', '−']}
          onClick={() => zoomOut({ duration: 0 })}
          disabled={!canZoomOut}
          ariaLabel="Zoom out"
        >
          <ZoomOutIcon />
        </ControlButton>
        <div
          role="button"
          tabIndex={0}
          onClick={handleZoomReset}
          onKeyDown={(e) => { if (e.key === 'Enter') handleZoomReset(); }}
          onMouseEnter={() => setZoomHovered(true)}
          onMouseLeave={() => setZoomHovered(false)}
          style={{
            minWidth: 40,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            lineHeight: '16px',
            fontWeight: 500,
            color: zoomHovered ? '#fff' : 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            transition: 'color 120ms ease',
            userSelect: 'none',
            height: 32,
          }}
        >
          {zoomPercent}%
        </div>
        <ControlButton
          label="Zoom in"
          shortcutKeys={['⌘', '+']}
          onClick={() => zoomIn({ duration: 0 })}
          disabled={!canZoomIn}
          ariaLabel="Zoom in"
        >
          <ZoomInIcon />
        </ControlButton>
      </div>
    </div>
  );
}
