import React, { useState, useEffect, useRef } from 'react';
import { EditModeIcon, PanModeIcon, LayersIcon } from './icons';
import { Plus } from 'lucide-react';
import { ShortcutBadge } from './components/ShortcutBadge';

const TOOLBAR_BG = 'rgba(31, 31, 31, 1)';
const TOOLBAR_BORDER = '1px solid rgba(255,255,255,0.08)';
const TOOLBAR_SHADOW = '0 4px 16px rgba(0,0,0,0.2)';
const DIVIDER_COLOR = 'rgba(255,255,255,0.06)';

function ZoomOutIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 16, height: 16, display: 'block' }}>
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5 7H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ZoomInIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 16, height: 16, display: 'block' }}>
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5 7H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M7 5V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ToolbarButton({
  label,
  shortcutKeys,
  active,
  disabled,
  cursorOverride,
  onClick,
  children,
}: {
  label: string;
  shortcutKeys?: string[];
  active?: boolean;
  disabled?: boolean;
  /** Override the button cursor (e.g. 'grab' for the Hand tool when active). */
  cursorOverride?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const bg = active
    ? '#ffffff'
    : hovered && !disabled
      ? 'rgba(255,255,255,0.08)'
      : 'transparent';

  const cursor = disabled
    ? 'not-allowed'
    : cursorOverride
      ? (pressed ? 'grabbing' : cursorOverride)
      : 'pointer';

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        style={{
          width: 32,
          height: 32,
          padding: 0,
          borderRadius: 4,
          border: 'none',
          background: bg,
          color: disabled ? 'rgba(255,255,255,0.25)' : active ? '#000000' : 'rgba(255,255,255,0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor,
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
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span>{label}</span>
          {shortcutKeys && <ShortcutBadge keys={shortcutKeys} />}
        </div>
      )}
    </div>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 24, background: DIVIDER_COLOR, margin: '0 4px', flexShrink: 0 }} />;
}

export type BottomToolbarProps = {
  visible?: boolean;
  toolMode: 'pan' | 'edit';
  onToolModeChange: (mode: 'pan' | 'edit') => void;
  viewport: { x: number; y: number; zoom: number };
  reactFlowInstance: { zoomIn: (opts?: { duration?: number }) => void; zoomOut: (opts?: { duration?: number }) => void; zoomTo: (zoom: number, opts?: { duration?: number }) => void } | null;
  layersPanelOpen: boolean;
  onLayersToggle: () => void;
  canEdit: boolean;
  isLocked: boolean;
  sidebarOffset?: number;
  onAddAsset?: () => void;
};

export function BottomToolbar({
  visible = true,
  toolMode,
  onToolModeChange,
  viewport,
  reactFlowInstance,
  layersPanelOpen,
  onLayersToggle,
  canEdit,
  isLocked,
  sidebarOffset = 0,
  onAddAsset,
}: BottomToolbarProps) {
  const displayZoom = Math.round(viewport.zoom * 100);

  const canZoomIn = viewport.zoom < 3.99;
  const canZoomOut = viewport.zoom > 0.11;
  const [zoomHovered, setZoomHovered] = React.useState(false);
  const [isEditingZoom, setIsEditingZoom] = useState(false);
  const [tempZoomValue, setTempZoomValue] = useState('');
  const zoomInputRef = useRef<HTMLInputElement>(null);

  const handleZoomIn = React.useCallback(() => {
    reactFlowInstance?.zoomIn({ duration: 0 });
  }, [reactFlowInstance]);

  const handleZoomOut = React.useCallback(() => {
    reactFlowInstance?.zoomOut({ duration: 0 });
  }, [reactFlowInstance]);

  const handleZoomReset = React.useCallback(() => {
    reactFlowInstance?.zoomTo(1, { duration: 200 });
  }, [reactFlowInstance]);

  const handleZoomCommit = () => {
    let val = parseFloat(tempZoomValue);
    if (!isNaN(val)) {
      val = Math.max(10, Math.min(400, val)); // Clamp between 10% and 400%
      reactFlowInstance?.zoomTo(val / 100, { duration: 200 });
    }
    setIsEditingZoom(false);
  };

  useEffect(() => {
    if (isEditingZoom && zoomInputRef.current) {
      zoomInputRef.current.focus();
      zoomInputRef.current.select();
    }
  }, [isEditingZoom]);

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        bottom: 12,
        left: `calc(50% + ${sidebarOffset / 2}px)`,
        transform: visible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(28px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
        zIndex: 200,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: 8,
          borderRadius: 8,
          background: TOOLBAR_BG,
          border: TOOLBAR_BORDER,
          boxShadow: TOOLBAR_SHADOW,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Select / Hand section */}
        <ToolbarButton label="Select" shortcutKeys={['V']} active={toolMode === 'edit'} onClick={() => onToolModeChange('edit')}>
          <EditModeIcon size={20} />
        </ToolbarButton>
        <ToolbarButton
          label="Hand"
          shortcutKeys={['H']}
          active={toolMode === 'pan'}
          cursorOverride={toolMode === 'pan' ? 'grab' : undefined}
          onClick={() => onToolModeChange('pan')}
        >
          <PanModeIcon size={20} />
        </ToolbarButton>

        <Divider />

        {/* Add Asset */}
        {onAddAsset && (
          <ToolbarButton label="Add Asset" onClick={onAddAsset} disabled={!canEdit || isLocked}>
            <div style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              border: '1.2px solid currentColor',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Plus size={12} strokeWidth={2.4} />
            </div>
          </ToolbarButton>
        )}

        <Divider />

        {/* Zoom section */}
        <ToolbarButton label="Zoom out" shortcutKeys={['⌘', '−']} disabled={!canZoomOut} onClick={handleZoomOut}>
          <ZoomOutIcon />
        </ToolbarButton>
        
        {isEditingZoom ? (
          <input
            ref={zoomInputRef}
            value={tempZoomValue}
            onChange={(e) => setTempZoomValue(e.target.value)}
            onBlur={handleZoomCommit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleZoomCommit();
              } else if (e.key === 'Escape') {
                setIsEditingZoom(false);
              }
            }}
            style={{
              width: 44,
              textAlign: 'center',
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              outline: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 12,
              fontWeight: 500,
              height: 32,
              padding: 0,
            }}
          />
        ) : (
          <button
            type="button"
            aria-label={`Zoom ${Math.round(displayZoom)}%, click to set`}
            onClick={() => {
              setTempZoomValue(String(Math.round(displayZoom)));
              setIsEditingZoom(true);
            }}
            onMouseEnter={() => setZoomHovered(true)}
            onMouseLeave={() => setZoomHovered(false)}
            style={{
              minWidth: 44,
              height: 32,
              padding: '0 4px',
              borderRadius: 8,
              border: 'none',
              background: zoomHovered ? 'rgba(255,255,255,0.08)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              lineHeight: '16px',
              fontWeight: 500,
              color: zoomHovered ? '#fff' : 'rgba(255,255,255,0.95)',
              cursor: 'pointer',
              transition: 'background 120ms ease, color 120ms ease',
              userSelect: 'none',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {Math.round(displayZoom)}%
          </button>
        )}
        <ToolbarButton label="Zoom in" shortcutKeys={['⌘', '+']} disabled={!canZoomIn} onClick={handleZoomIn}>
          <ZoomInIcon />
        </ToolbarButton>

        <Divider />

        {/* Layers */}
        <ToolbarButton label="Layers" active={layersPanelOpen} onClick={onLayersToggle}>
          <LayersIcon size={16} />
        </ToolbarButton>
      </div>
    </div>
  );
}
