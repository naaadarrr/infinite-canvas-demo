import React from 'react';

export function ShortcutBadge({ keys }: { keys: string[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
      {keys.map((k, i) => {
        if (k === '+') {
          return (
            <span key={i} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>
              +
            </span>
          );
        }
        return (
          <kbd
            key={i}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 18,
              height: 20,
              padding: '0 4px',
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 4,
              fontSize: 10,
              fontFamily: 'inherit',
              color: 'rgba(255,255,255,0.9)',
              lineHeight: 1,
            }}
          >
            {k}
          </kbd>
        );
      })}
    </div>
  );
}
