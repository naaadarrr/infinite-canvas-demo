import React from 'react';
import { useStore } from '@xyflow/react';
import type { LucideIcon } from 'lucide-react';

export type QuickAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  active?: boolean;
};

type QuickActionToolbarProps = {
  actions: QuickAction[];
  offset?: number;
};

export function QuickActionToolbar({ actions, offset = 5 }: QuickActionToolbarProps) {
  const zoom = useStore((state) => state.transform[2] ?? 1);
  const [hoveredActionId, setHoveredActionId] = React.useState<string | null>(null);

  if (!actions.length) {
    return null;
  }

  return (
    <div
      className="nodrag nopan nowheel"
      onPointerDownCapture={(event) => event.stopPropagation()}
      onMouseDownCapture={(event) => event.stopPropagation()}
      style={{
        position: 'absolute',
        left: '50%',
        top: `calc(100% + ${offset}px)`,
        transform: `translateX(-50%) scale(${1 / zoom})`,
        transformOrigin: 'top center',
        zIndex: 5,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          padding: 4,
          borderRadius: 8,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <div
              key={action.id}
              onMouseEnter={() => setHoveredActionId(action.id)}
              onMouseLeave={() => setHoveredActionId((current) => (current === action.id ? null : current))}
              style={{ position: 'relative', display: 'inline-flex' }}
            >
              <button
                type="button"
                onClick={action.onClick}
                aria-label={action.label}
                aria-pressed={action.active ?? false}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  border: 'none',
                  background: action.active ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
                  color: action.active ? '#fff' : 'rgba(255, 255, 255, 0.85)',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <Icon size={14} />
              </button>
              {hoveredActionId === action.id && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: 8,
                    pointerEvents: 'none',
                    zIndex: 10,
                  }}
                >
                  <div
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      backgroundColor: '#252525',
                      color: '#fff',
                      fontSize: 12,
                      whiteSpace: 'nowrap',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
                    }}
                  >
                    {action.label}
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      bottom: -4,
                      width: 8,
                      height: 8,
                      transform: 'translateX(-50%) rotate(45deg)',
                      backgroundColor: '#252525',
                      borderRight: '1px solid rgba(255, 255, 255, 0.12)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
