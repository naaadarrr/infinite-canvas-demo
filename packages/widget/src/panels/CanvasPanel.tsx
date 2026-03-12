import React, { useEffect, useRef, useState } from 'react';

const DEFAULT_PANEL_WIDTH = 520;
const GAP = 8;

// CanvasPanel does NOT use a full-canvas dismiss overlay — that would block
// node drag/resize on the canvas. Instead it closes on Escape or outside-click.

export interface CanvasPanelTab {
  id: string;
  label: string;
}

export interface CanvasPanelProps {
  /** When true, panel renders inline (no absolute positioning / dismiss handlers). */
  inline?: boolean;
  /** Override panel width (defaults to 520). */
  width?: number;
  nodeScreenRect?: { x: number; y: number; w: number; h: number };
  tabs?: CanvasPanelTab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  bottomBar?: React.ReactNode;
  onDismiss?: () => void;
  children: React.ReactNode;
}

export function CanvasPanel({
  inline,
  width: widthProp,
  nodeScreenRect,
  tabs,
  activeTab,
  onTabChange,
  bottomBar,
  onDismiss,
  children,
}: CanvasPanelProps) {
  const PANEL_WIDTH = widthProp ?? DEFAULT_PANEL_WIDTH;
  const panelRef = useRef<HTMLDivElement>(null);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const [mounted, setMounted] = useState(!!inline);

  useEffect(() => {
    if (!inline) requestAnimationFrame(() => setMounted(true));
  }, [inline]);

  // Close on Escape (standalone mode only)
  useEffect(() => {
    if (inline || !onDismiss) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismissRef.current?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [inline, onDismiss]);

  // Close on mousedown outside (standalone mode only)
  const nodeRectRef = useRef(nodeScreenRect);
  nodeRectRef.current = nodeScreenRect;

  useEffect(() => {
    if (inline || !onDismiss) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && panelRef.current.contains(e.target as Node)) return;
      const nr = nodeRectRef.current;
      if (nr &&
        e.clientX >= nr.x && e.clientX <= nr.x + nr.w &&
        e.clientY >= nr.y && e.clientY <= nr.y + nr.h
      ) return;
      onDismissRef.current?.();
    };
    window.addEventListener('mousedown', handler, true);
    return () => window.removeEventListener('mousedown', handler, true);
  }, [inline, onDismiss]);

  const hasTabs = tabs && tabs.length > 1;

  // Inline mode: no absolute positioning, no entrance animation
  if (inline) {
    return (
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        onPointerDownCapture={(e) => e.stopPropagation()}
        onMouseDownCapture={(e) => e.stopPropagation()}
        style={{
          width: PANEL_WIDTH,
          borderRadius: 12,
          background: '#18191d',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}
      >
        {hasTabs && (
          <div style={{ display: 'flex', alignItems: 'center', padding: '8px 8px 0', flexShrink: 0, gap: 4 }}>
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button key={tab.id} type="button" onClick={() => onTabChange?.(tab.id)}
                  style={{
                    height: 24, margin: 0, padding: '0 8px', borderRadius: 6, border: 'none',
                    background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 120ms ease', whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
                >{tab.label}</button>
              );
            })}
          </div>
        )}
        <div style={{ flex: 1, padding: '8px 8px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
        {bottomBar && (
          <div style={{ padding: '0 8px 8px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>{bottomBar}</div>
        )}
      </div>
    );
  }

  // Standalone mode: absolute positioning with entrance animation
  const panelLeft = (nodeScreenRect?.x ?? 0) + (nodeScreenRect?.w ?? 0) / 2 - PANEL_WIDTH / 2;
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const panelTop = (nodeScreenRect?.y ?? 0) + (nodeScreenRect?.h ?? 0) + GAP;

  return (
    <div
      ref={panelRef}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        left: Math.max(72, Math.min(panelLeft, viewportW - PANEL_WIDTH - 8)),
        top: panelTop,
        width: PANEL_WIDTH,
        zIndex: 42,
        borderRadius: 12,
        background: '#18191d',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, -apple-system, sans-serif',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(-6px)',
        transition: 'opacity 160ms ease, transform 160ms ease',
      }}
    >
      {/* Tab bar — underline style matching reference */}
      {hasTabs && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 8px 0',
          borderBottom: 'none',
          flexShrink: 0,
          gap: 4,
        }}>
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange?.(tab.id)}
                style={{
                  height: 24,
                  margin: 0,
                  padding: '0 8px',
                  borderRadius: 6,
                  border: 'none',
                  background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 120ms ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Main content — no divider at bottom */}
      <div style={{ flex: 1, padding: '8px 8px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>

      {/* Bottom bar — no top border, seamlessly attached */}
      {bottomBar && (
        <div style={{
          padding: '0 8px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}>
          {bottomBar}
        </div>
      )}
    </div>
  );
}
