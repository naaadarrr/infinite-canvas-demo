import React from 'react';
import { NodeToolbar, Position, useStore, useNodeId } from '@xyflow/react';
import type { LucideIcon } from 'lucide-react';
type AnyIcon = LucideIcon | React.ComponentType<{ size?: number; className?: string }>;
import { ToolbarDropdownMenu } from './ToolbarDropdownMenu';
import type { DropdownMenuItem } from './ToolbarDropdownMenu';

import { ShortcutBadge } from '../components/ShortcutBadge';

export type DropdownItem = DropdownMenuItem;

export type QuickAction = {
  id: string;
  label: string;
  icon: AnyIcon;
  onClick: () => void;
  active?: boolean;
  dividerBefore?: boolean;
  iconOnly?: boolean;
  shortcutKeys?: string[];
  /** If provided, clicking the button opens a dropdown instead of calling onClick directly */
  dropdownItems?: DropdownItem[];
};

type QuickActionToolbarProps = {
  isVisible: boolean;
  actions: QuickAction[];
  offset?: number;
};

export function QuickActionToolbar({ isVisible, actions, offset = 28 }: QuickActionToolbarProps) {
  const nodeId = useNodeId();
  const zoom = useStore((state) => state.transform[2] ?? 1);
  
  const position = useStore((state) => {
    if (!nodeId) return Position.Top;
    const node = state.nodeLookup?.get(nodeId);
    if (!node) return Position.Top;
    
    const [_, ty, tZoom] = state.transform;
    const nodeY = node.internals?.positionAbsolute?.y ?? node.position.y;
    const screenNodeY = nodeY * tZoom + ty;
    return screenNodeY < 120 ? Position.Bottom : Position.Top;
  });

  const [hoveredActionId, setHoveredActionId] = React.useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = React.useState<string | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.style.setProperty('--tc-node-toolbar-offset', `${offset}px`);
    root.style.setProperty('--tc-node-toolbar-scale', `${1 / zoom}`);
  }, [offset, zoom]);

  // Close dropdown on outside click
  React.useEffect(() => {
    if (!openDropdownId) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    window.addEventListener('mousedown', handler, true);
    return () => window.removeEventListener('mousedown', handler, true);
  }, [openDropdownId]);

  // Close dropdown when toolbar hides
  React.useEffect(() => {
    if (!isVisible) setOpenDropdownId(null);
  }, [isVisible]);

  if (!actions.length) {
    return null;
  }

  const isBottom = position === Position.Bottom;

  const renderAction = (action: QuickAction) => {
    const Icon = action.icon;
    const hasDropdown = !!action.dropdownItems?.length;
    const isDropdownOpen = openDropdownId === action.id;

    const handleClick = () => {
      if (hasDropdown) {
        setOpenDropdownId(isDropdownOpen ? null : action.id);
      } else {
        action.onClick();
      }
    };

    return (
      <React.Fragment key={action.id}>
        {action.dividerBefore && (
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 2px', flexShrink: 0 }} />
        )}
        <div
          ref={isDropdownOpen ? dropdownRef : undefined}
          onMouseEnter={() => setHoveredActionId(action.id)}
          onMouseLeave={() => setHoveredActionId((current) => (current === action.id ? null : current))}
          className="tc-node-toolbar-action"
          style={{ position: 'relative' }}
        >
          <button
            type="button"
            onClick={handleClick}
            aria-label={action.label}
            aria-pressed={action.active || isDropdownOpen}
            aria-expanded={isDropdownOpen}
            className="tc-node-toolbar-button"
            style={action.iconOnly ? { width: 30, height: 30, padding: '8px' } : { width: 'auto', padding: '8px', gap: 6 }}
          >
            <Icon className="tc-node-toolbar-icon" size={16} />
            {!action.iconOnly && (
              <span style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', lineHeight: '20px' }}>
                {action.label}
              </span>
            )}
          </button>
          {hoveredActionId === action.id && action.iconOnly && !isDropdownOpen && (
            <div className="tc-node-toolbar-tooltip">
              <div className="tc-node-toolbar-tooltip-label">
                <span>{action.label}</span>
                {action.shortcutKeys && <ShortcutBadge keys={action.shortcutKeys} />}
              </div>
            </div>
          )}
          {/* Dropdown menu */}
          {isDropdownOpen && action.dropdownItems && (
            <ToolbarDropdownMenu
              items={action.dropdownItems}
              direction={isBottom ? 'down' : 'down'}
              onClose={() => setOpenDropdownId(null)}
            />
          )}
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
        style={{
          color: 'rgba(255, 255, 255, 0.95)',
          background: '#252525',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        }}
        onPointerDownCapture={(event) => event.stopPropagation()}
        onMouseDownCapture={(event) => event.stopPropagation()}
      >
        {actions.map(renderAction)}
      </div>
    </NodeToolbar>
  );
}
