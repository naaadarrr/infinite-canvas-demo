import React from 'react';
import { X } from 'lucide-react';

type ShortcutEntry = {
  label: string;
  keys: string[][];
};

type ShortcutGroup = {
  title: string;
  items: ShortcutEntry[];
};

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'View',
    items: [
      { label: 'Pan Canvas', keys: [['Scroll']] },
      { label: 'Zoom', keys: [['⌘', 'Scroll']] },
      { label: 'Zoom In', keys: [['⌘', '+']] },
      { label: 'Zoom Out', keys: [['⌘', '−']] },
      { label: 'Fit to Screen', keys: [['⇧', '1'], ['F']] },
      { label: 'Zoom to Selection', keys: [['⇧', '2']] },
    ],
  },
  {
    title: 'Tools',
    items: [
      { label: 'Select Tool', keys: [['V']] },
      { label: 'Hand Tool', keys: [['H']] },
      { label: 'Temporary Hand', keys: [['Space', 'Drag']] },
    ],
  },
  {
    title: 'Selection',
    items: [
      { label: 'Multi-select', keys: [['⇧', 'Click']] },
      { label: 'Select All', keys: [['⌘', 'A']] },
    ],
  },
  {
    title: 'Edit',
    items: [
      { label: 'Copy', keys: [['⌘', 'C']] },
      { label: 'Paste', keys: [['⌘', 'V']] },
      { label: 'Delete', keys: [['Delete'], ['⌫']] },
    ],
  },
  {
    title: 'Multi-select (2+)',
    items: [
      { label: 'Horizontal Space', keys: [['⇧', 'H']] },
      { label: 'Vertical Space', keys: [['⇧', 'V']] },
      { label: 'Auto Arrange', keys: [['⇧', 'A']] },
    ],
  },
];

function KeyBadge({ children }: { children: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 24,
        height: 24,
        padding: '0 6px',
        borderRadius: 5,
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.1)',
        fontSize: 11,
        fontWeight: 500,
        fontFamily: 'Inter, -apple-system, sans-serif',
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 1,
      }}
    >
      {children}
    </span>
  );
}

type KeyboardShortcutsModalProps = {
  open: boolean;
  onClose: () => void;
};

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
        }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 400,
          maxHeight: 'calc(100vh - 120px)',
          overflow: 'auto',
          background: '#1c1e22',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          padding: '24px 0',
          fontFamily: 'Inter, -apple-system, sans-serif',
          color: '#fff',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 600 }}>Keyboard Shortcuts</span>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              borderRadius: 6,
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              transition: 'background 120ms',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <X size={16} />
          </button>
        </div>
        {/* Groups */}
        {SHORTCUT_GROUPS.map((group) => (
          <div key={group.title} style={{ padding: '16px 24px 0' }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.35)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 8,
              }}
            >
              {group.title}
            </div>
            {group.items.map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.8)' }}>
                  {item.label}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {item.keys.map((combo, ci) => (
                    <React.Fragment key={ci}>
                      {ci > 0 && (
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>/</span>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {combo.map((key, ki) => (
                          <KeyBadge key={ki}>{key}</KeyBadge>
                        ))}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
