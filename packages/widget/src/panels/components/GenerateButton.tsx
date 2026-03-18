import React, { useEffect, useRef, useState } from 'react';
import { Crown, ChevronDown } from 'lucide-react';

const activeStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.9)',
  color: '#000',
  cursor: 'pointer',
};
const disabledStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  color: 'rgba(255,255,255,0.25)',
  cursor: 'default',
};

export interface GenerateButtonProps {
  canSubmit: boolean;
  credits: number;
  onGenerate: (withWatermark: boolean) => void;
  /** When true, shows a split button with "Generate with watermark" dropdown */
  showWatermarkOption?: boolean;
}

export function GenerateButton({
  canSubmit,
  credits,
  onGenerate,
  showWatermarkOption = false,
}: GenerateButtonProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    window.addEventListener('mousedown', handler, true);
    return () => window.removeEventListener('mousedown', handler, true);
  }, [dropdownOpen]);

  if (!showWatermarkOption) {
    return (
      <button
        type="button"
        onClick={() => canSubmit && onGenerate(false)}
        style={{
          height: 32,
          padding: '0 12px',
          borderRadius: 8,
          border: 'none',
          fontSize: 12,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'all 120ms ease',
          ...(canSubmit ? activeStyle : disabledStyle),
        }}
      >
        <Crown size={13} color="currentColor" />
        <span style={{ lineHeight: '16px' }}>{credits}</span>
        <span style={{ lineHeight: '16px' }}>Generate</span>
      </button>
    );
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', height: 32 }}>
      <button
        type="button"
        onClick={() => canSubmit && onGenerate(false)}
        style={{
          height: 32,
          padding: '0 12px',
          borderRadius: '8px 0 0 8px',
          border: 'none',
          fontSize: 12,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'all 120ms ease',
          ...(canSubmit ? activeStyle : disabledStyle),
        }}
      >
        <Crown size={13} color="currentColor" />
        <span style={{ lineHeight: '16px' }}>{credits}</span>
        <span style={{ lineHeight: '16px' }}>Generate</span>
      </button>
      <div style={{
        width: 1,
        background: canSubmit ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
        flexShrink: 0,
      }} />
      <button
        type="button"
        onClick={() => canSubmit && setDropdownOpen((p) => !p)}
        style={{
          width: 24, height: 32,
          borderRadius: '0 8px 8px 0',
          border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 120ms ease',
          ...(canSubmit ? activeStyle : disabledStyle),
          boxShadow: 'none',
        }}
      >
        <ChevronDown size={13} />
      </button>
      {dropdownOpen && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          right: 0,
          marginBottom: 6,
          padding: '4px',
          borderRadius: 10,
          background: '#1e1e1e',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          zIndex: 10,
          minWidth: 200,
        }}>
          <button
            type="button"
            onClick={() => { onGenerate(true); setDropdownOpen(false); }}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              borderRadius: 6,
              background: 'transparent',
              color: 'rgba(255,255,255,0.7)',
              fontSize: 13,
              fontWeight: 400,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 80ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            Generate with watermark
          </button>
        </div>
      )}
    </div>
  );
}
