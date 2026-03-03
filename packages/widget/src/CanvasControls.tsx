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

function ZoomToSelectionIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={ICON_STYLE}>
      <path d="M2 5V3.33C2 2.6 2.6 2 3.33 2H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 2h1.67C13.4 2 14 2.6 14 3.33V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 11v1.67c0 .73-.6 1.33-1.33 1.33H11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 14H3.33C2.6 14 2 13.4 2 12.67V11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function FitToScreenIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={ICON_STYLE}>
      <path d="M2 4.67V3.33C2 2.6 2.6 2 3.33 2H4.67" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.33 2H12.67C13.4 2 14 2.6 14 3.33V4.67" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 11.33V12.67C14 13.4 13.4 14 12.67 14H11.33" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.67 14H3.33C2.6 14 2 13.4 2 12.67V11.33" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="4.67" y="5.33" width="6.67" height="5.33" rx="0.67" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TooltipButton({ label, onClick, style, disabled, ariaLabel, children }: {
  label: string;
  onClick: () => void;
  style: React.CSSProperties;
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
        style={style}
        disabled={disabled}
        aria-label={ariaLabel}
      >
        {children}
      </button>
      {hovered && (
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
        }}>
          {label}
        </div>
      )}
    </div>
  );
}

export function CanvasControls({
  position = 'bottom-left',
}: CanvasControlsProps) {
  const { zoomIn, zoomOut, fitView, getNodes } = useReactFlow();
  const zoom = useStore((state) => state.transform[2] ?? 1);
  const minZoom = useStore((state) => state.minZoom ?? 0.1);
  const maxZoom = useStore((state) => state.maxZoom ?? 4);

  const zoomPercent = Math.round(zoom * 100);
  const canZoomIn = zoom < maxZoom - 0.001;
  const canZoomOut = zoom > minZoom + 0.001;

  const handleZoomToSelection = React.useCallback(() => {
    const selectedNodes = getNodes().filter((n) => n.selected);
    if (selectedNodes.length > 0) {
      fitView({ nodes: selectedNodes, padding: 0.3, duration: 300 });
    }
  }, [getNodes, fitView]);

  const handleFitToScreen = React.useCallback(() => {
    fitView({ padding: 0.15, duration: 300 });
  }, [fitView]);

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
          overflow: 'visible',
          color: '#ffffff',
          fontFamily: 'Inter, sans-serif',
          pointerEvents: 'auto',
        }}
      >
        <TooltipButton
          label="Zoom out (⌘ -)"
          onClick={() => zoomOut({ duration: 0 })}
          style={getButtonStyle(canZoomOut)}
          disabled={!canZoomOut}
          ariaLabel="Zoom out"
        >
          <ZoomOutIcon />
        </TooltipButton>
        <div
          style={{
            width: 36,
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
        <TooltipButton
          label="Zoom in (⌘ +)"
          onClick={() => zoomIn({ duration: 0 })}
          style={getButtonStyle(canZoomIn)}
          disabled={!canZoomIn}
          ariaLabel="Zoom in"
        >
          <ZoomInIcon />
        </TooltipButton>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)', margin: '0 2px', flexShrink: 0 }} />
        <TooltipButton
          label="Zoom to selection (Z)"
          onClick={handleZoomToSelection}
          style={getButtonStyle(true)}
          ariaLabel="Zoom to selection"
        >
          <ZoomToSelectionIcon />
        </TooltipButton>
        <TooltipButton
          label="Fit to screen (F)"
          onClick={handleFitToScreen}
          style={getButtonStyle(true)}
          ariaLabel="Fit to screen"
        >
          <FitToScreenIcon />
        </TooltipButton>
      </div>
    </div>
  );
}
