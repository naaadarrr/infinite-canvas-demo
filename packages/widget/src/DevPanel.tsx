import React from 'react';

type DevPanelProps = {
  value: 'A' | 'B';
  onChange: (scheme: 'A' | 'B') => void;
};

export function DevPanel({ value, onChange }: DevPanelProps) {
  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: 56,
        right: 16,
        zIndex: 51,
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        padding: 2,
        borderRadius: 8,
        background: '#1c1e22',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        fontFamily: 'Inter, -apple-system, sans-serif',
        userSelect: 'none',
      }}
    >
      {(['A', 'B'] as const).map((scheme) => (
        <button
          key={scheme}
          type="button"
          onClick={() => onChange(scheme)}
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            border: 'none',
            background: value === scheme ? 'rgba(255,255,255,0.12)' : 'transparent',
            color: value === scheme ? '#fff' : 'rgba(255,255,255,0.4)',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 120ms ease, color 120ms ease',
          }}
        >
          {scheme}
        </button>
      ))}
    </div>
  );
}
