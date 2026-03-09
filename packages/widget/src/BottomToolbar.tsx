import React from 'react';
import { EditModeIcon, PanModeIcon, LayersIcon } from './icons';
import { LayoutTemplate } from 'lucide-react';

const TOOLBAR_BG = 'rgba(28, 30, 34, 1)';
const TOOLBAR_BORDER = '1px solid rgba(255,255,255,0.08)';
const TOOLBAR_SHADOW = '0 4px 16px rgba(0,0,0,0.2)';
const DIVIDER_COLOR = 'rgba(255,255,255,0.06)';

function ZoomOutIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 16, height: 16, display: 'block' }}>
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5 7H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ZoomInIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 16, height: 16, display: 'block' }}>
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5 7H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M7 5V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = React.useState(false);
  const bg = active
    ? 'rgba(255,255,255,0.18)'
    : hovered && !disabled
      ? 'rgba(255,255,255,0.08)'
      : 'transparent';
  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        style={{
          width: 32,
          height: 32,
          padding: 0,
          borderRadius: 8,
          border: 'none',
          background: bg,
          color: disabled ? 'rgba(255,255,255,0.25)' : active ? '#fff' : 'rgba(255,255,255,0.7)',
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
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 8,
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
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 18, background: DIVIDER_COLOR, margin: '0 2px', flexShrink: 0 }} />;
}

export type BottomToolbarProps = {
  toolMode: 'pan' | 'edit';
  onToolModeChange: (mode: 'pan' | 'edit') => void;
  viewport: { x: number; y: number; zoom: number };
  reactFlowInstance: { zoomIn: (opts?: { duration?: number }) => void; zoomOut: (opts?: { duration?: number }) => void; zoomTo: (zoom: number, opts?: { duration?: number }) => void } | null;
  layersPanelOpen: boolean;
  onLayersToggle: () => void;
  templateOpen: boolean;
  onTemplateToggle: () => void;
  canEdit: boolean;
  isLocked: boolean;
  sidebarOffset?: number;
};

export function BottomToolbar({
  toolMode,
  onToolModeChange,
  viewport,
  reactFlowInstance,
  layersPanelOpen,
  onLayersToggle,
  templateOpen,
  onTemplateToggle,
  canEdit,
  isLocked,
  sidebarOffset = 0,
}: BottomToolbarProps) {
  const zoomPercent = Math.round(viewport.zoom * 100);
  const canZoomIn = viewport.zoom < 3.99;
  const canZoomOut = viewport.zoom > 0.11;
  const [zoomHovered, setZoomHovered] = React.useState(false);

  const handleZoomIn = React.useCallback(() => {
    reactFlowInstance?.zoomIn({ duration: 0 });
  }, [reactFlowInstance]);

  const handleZoomOut = React.useCallback(() => {
    reactFlowInstance?.zoomOut({ duration: 0 });
  }, [reactFlowInstance]);

  const handleZoomReset = React.useCallback(() => {
    reactFlowInstance?.zoomTo(1, { duration: 200 });
  }, [reactFlowInstance]);

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        bottom: 16,
        left: `calc(50% + ${sidebarOffset / 2}px)`,
        transform: 'translateX(-50%)',
        zIndex: 20,
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          height: 44,
          padding: '0 6px',
          borderRadius: 16,
          background: TOOLBAR_BG,
          border: TOOLBAR_BORDER,
          boxShadow: TOOLBAR_SHADOW,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Move / Hand section */}
        <ToolbarButton label="Move (V)" active={toolMode === 'edit'} onClick={() => onToolModeChange('edit')}>
          <EditModeIcon size={16} />
        </ToolbarButton>
        <ToolbarButton label="Hand (H)" active={toolMode === 'pan'} onClick={() => onToolModeChange('pan')}>
          <PanModeIcon size={16} />
        </ToolbarButton>

        <Divider />

        {/* Template */}
        <ToolbarButton
          label="Template"
          active={templateOpen}
          disabled={!canEdit || isLocked}
          onClick={onTemplateToggle}
        >
          <LayoutTemplate size={16} />
        </ToolbarButton>

        <Divider />

        {/* Zoom section */}
        <ToolbarButton label="Zoom out (⌘ −)" disabled={!canZoomOut} onClick={handleZoomOut}>
          <ZoomOutIcon />
        </ToolbarButton>
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
        <ToolbarButton label="Zoom in (⌘ +)" disabled={!canZoomIn} onClick={handleZoomIn}>
          <ZoomInIcon />
        </ToolbarButton>

        <Divider />

        {/* Layers */}
        <ToolbarButton label="Layers" active={layersPanelOpen} onClick={onLayersToggle}>
          <LayersIcon size={14} />
        </ToolbarButton>
      </div>
    </div>
  );
}
