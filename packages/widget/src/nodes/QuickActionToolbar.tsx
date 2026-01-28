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
  React.useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const root = document.documentElement;
    root.style.setProperty('--tc-node-toolbar-offset', `${offset}px`);
    root.style.setProperty('--tc-node-toolbar-scale', `${1 / zoom}`);
  }, [offset, zoom]);

  if (!actions.length) {
    return null;
  }

  return (
    <div
      className="tc-node-toolbar-wrapper nodrag nopan nowheel"
      onPointerDownCapture={(event) => event.stopPropagation()}
      onMouseDownCapture={(event) => event.stopPropagation()}
    >
      <div className="tc-node-toolbar">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <div
              key={action.id}
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
              >
                <Icon className="tc-node-toolbar-icon" size={16} />
              </button>
              {hoveredActionId === action.id && (
                <div className="tc-node-toolbar-tooltip">
                  <div className="tc-node-toolbar-tooltip-label">
                    {action.label}
                  </div>
                  <div className="tc-node-toolbar-tooltip-arrow" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
