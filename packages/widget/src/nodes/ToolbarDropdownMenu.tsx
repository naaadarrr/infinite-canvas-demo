import React from 'react';
import { Zap } from 'lucide-react';

export type DropdownMenuItem = {
  id: string;
  label: string;
  /** Secondary text shown after the label (e.g. target dimensions) */
  detail?: string;
  /** Credit cost shown on hover (uses ⚡ icon) */
  creditCost?: number;
  onClick: () => void;
};

type ToolbarDropdownMenuProps = {
  items: DropdownMenuItem[];
  /** Which direction the menu opens. Default: 'down' */
  direction?: 'up' | 'down';
  onClose: () => void;
};

/**
 * Shared dropdown menu for QuickActionToolbar actions.
 * Renders a dark panel with icon+label rows, optional detail text, and credit cost on hover.
 *
 * Usage:
 *   <ToolbarDropdownMenu items={dropdownItems} onClose={() => setOpen(false)} />
 */
export function ToolbarDropdownMenu({ items, direction = 'down', onClose }: ToolbarDropdownMenuProps) {
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  return (
    <div
      style={{
        position: 'absolute',
        ...(direction === 'down'
          ? { top: 'calc(100% + 8px)' }
          : { bottom: 'calc(100% + 8px)' }),
        left: 0,
        padding: 4,
        borderRadius: 8,
        background: '#1e1e1e',
        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        zIndex: 10,
        minWidth: 168,
      }}
    >
      {items.map((item) => {
        const isHovered = hoveredId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              item.onClick();
              onClose();
            }}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              width: '100%',
              padding: '6px 8px',
              border: 'none',
              borderRadius: 6,
              background: isHovered ? 'rgba(255,255,255,0.06)' : 'transparent',
              color: '#fff',
              fontSize: 12,
              fontWeight: 500,
              lineHeight: '20px',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'background 80ms ease',
              boxSizing: 'border-box',
            }}
          >
            <span style={{ flexShrink: 0, lineHeight: '20px' }}>{item.label}</span>
            {item.detail && (
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 400, flexShrink: 0, lineHeight: '20px' }}>
                {item.detail}
              </span>
            )}
            {item.creditCost != null && isHovered && (
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, lineHeight: '20px' }}>
                <Zap size={12} style={{ color: '#fff' }} />
                <span style={{ fontSize: 12, color: '#fff', fontWeight: 400, lineHeight: '20px' }}>
                  {item.creditCost}
                </span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
