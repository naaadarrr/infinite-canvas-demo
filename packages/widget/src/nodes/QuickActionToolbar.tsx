import React from 'react';
import { NodeToolbar, Position, useStore, useNodeId } from '@xyflow/react';
import type { LucideIcon } from 'lucide-react';
import { MoreHorizontal } from 'lucide-react';

export type QuickAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  active?: boolean;
  dividerBefore?: boolean;
};

type QuickActionToolbarProps = {
  isVisible: boolean;
  actions: QuickAction[];
  moreActions?: QuickAction[];
  offset?: number;
};

export function QuickActionToolbar({ isVisible, actions, moreActions, offset = 28 }: QuickActionToolbarProps) {
  const nodeId = useNodeId();
  const zoom = useStore((state) => state.transform[2] ?? 1);
  
  const position = useStore((state) => {
    if (!nodeId) return Position.Top;
    const node = state.nodeLookup?.get(nodeId);
    if (!node) return Position.Top;
    
    const [_, ty, tZoom] = state.transform;
    // Fallback to node.position.y if internals not available (though nodeLookup returns internal nodes)
    const nodeY = node.internals?.positionAbsolute?.y ?? node.position.y;
    const screenNodeY = nodeY * tZoom + ty;
    
    // Switch to bottom if node top is too close to screen top (< 120px buffer)
    return screenNodeY < 120 ? Position.Bottom : Position.Top;
  });

  const [hoveredActionId, setHoveredActionId] = React.useState<string | null>(null);
  const [moreMenuOpen, setMoreMenuOpen] = React.useState(false);
  const moreRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.style.setProperty('--tc-node-toolbar-offset', `${offset}px`);
    root.style.setProperty('--tc-node-toolbar-scale', `${1 / zoom}`);
  }, [offset, zoom]);

  React.useEffect(() => {
    if (!moreMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [moreMenuOpen]);

  if (!actions.length && (!moreActions || !moreActions.length)) {
    return null;
  }

  const renderAction = (action: QuickAction) => {
    const Icon = action.icon;
    return (
      <React.Fragment key={action.id}>
        {action.dividerBefore && (
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)', margin: '0 2px', flexShrink: 0 }} />
        )}
        <div
          onMouseEnter={() => setHoveredActionId(action.id)}
          onMouseLeave={() => setHoveredActionId((current) => (current === action.id ? null : current))}
          className="tc-node-toolbar-action"
        >
          <button
            type="button"
            onClick={action.onClick}
            aria-label={action.label}
            aria-pressed={action.active ?? false}
            className="tc-node-toolbar-button"
            style={{ width: 'auto', padding: '5px 10px', gap: 6 }}
          >
            <Icon className="tc-node-toolbar-icon" size={16} />
            <span style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', lineHeight: 1 }}>
              {action.label}
            </span>
          </button>
        </div>
      </React.Fragment>
    );
  };

  return (
    <NodeToolbar
      isVisible={isVisible}
      position={position}
      offset={offset}
      align="center"
      className="tc-node-toolbar-portal"
    >
      <div
        className="tc-node-toolbar"
        onPointerDownCapture={(event) => event.stopPropagation()}
        onMouseDownCapture={(event) => event.stopPropagation()}
      >
        {actions.map(renderAction)}
        {moreActions && moreActions.length > 0 && (
          <div
            ref={moreRef}
            onMouseEnter={() => setHoveredActionId('__more__')}
            onMouseLeave={() => {
              setHoveredActionId((current) => (current === '__more__' ? null : current));
            }}
            className="tc-node-toolbar-action"
            style={{ position: 'relative' }}
          >
            <button
              type="button"
              onClick={() => setMoreMenuOpen((prev) => !prev)}
              aria-label="More actions"
              className="tc-node-toolbar-button"
              style={{ width: 30, height: 30, padding: 5 }}
            >
              <MoreHorizontal className="tc-node-toolbar-icon" size={16} />
            </button>
            {hoveredActionId === '__more__' && !moreMenuOpen && (
              <div className="tc-node-toolbar-tooltip">
                <div className="tc-node-toolbar-tooltip-label">More...</div>
                <div className="tc-node-toolbar-tooltip-arrow" />
              </div>
            )}
            {moreMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: 6,
                  padding: 4,
                  borderRadius: 10,
                  background: '#1c1e22',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 4px 20px -4px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.2)',
                  minWidth: 160,
                  zIndex: 10,
                }}
              >
                {moreActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => {
                        action.onClick();
                        setMoreMenuOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: 'none',
                        background: 'transparent',
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: 12,
                        fontWeight: 500,
                        textAlign: 'left',
                        borderRadius: 6,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'background 100ms ease',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Icon size={14} color="rgba(255,255,255,0.5)" />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </NodeToolbar>
  );
}
