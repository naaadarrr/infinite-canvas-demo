import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Upload, LayoutGrid } from 'lucide-react';

interface UploadSlotProps {
  label?: string;
  imageUrl?: string;
  size?: 'small' | 'large';
  onUpload: () => void;
  onSelectFromBoard?: () => void;
  onClear?: () => void;
}

export function UploadSlot({
  label,
  imageUrl,
  size = 'small',
  onUpload,
  onSelectFromBoard,
  onClear,
}: UploadSlotProps) {
  const isSmall = size === 'small';
  const w = isSmall ? 72 : '100%';
  const h = isSmall ? 72 : 160;
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!popoverOpen) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [popoverOpen]);

  if (imageUrl) {
    return (
      <div style={{ position: 'relative', width: w, height: h, flexShrink: 0, borderRadius: 8, overflow: 'hidden' }}>
        <img src={imageUrl} alt={label || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        {onClear && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            style={{
              position: 'absolute', top: 4, right: 4,
              width: 20, height: 20, borderRadius: 10,
              background: 'rgba(0,0,0,0.6)', border: 'none',
              color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={12} />
          </button>
        )}
      </div>
    );
  }

  if (isSmall) {
    const hasOptions = !!onSelectFromBoard;
    return (
      <div ref={popoverRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => {
            if (hasOptions) {
              setPopoverOpen((p) => !p);
            } else {
              onUpload();
            }
          }}
          style={{
            width: 72, height: 72, flexShrink: 0,
            borderRadius: 8, border: 'none',
            background: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.3)',
            cursor: 'pointer',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 4,
            fontSize: 10, fontWeight: 500,
            transition: 'background 120ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
        >
          <Plus size={18} style={{ opacity: 0.4 }} />
          {label && <span style={{ color: 'rgba(255,255,255,0.25)' }}>{label}</span>}
        </button>
        {popoverOpen && hasOptions && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            padding: 4,
            borderRadius: 8,
            background: '#1c1e22',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 20,
            minWidth: 140,
          }}>
            <button
              type="button"
              onClick={() => { setPopoverOpen(false); onUpload(); }}
              style={{
                width: '100%', padding: '6px 10px',
                border: 'none', borderRadius: 5, background: 'transparent',
                color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                fontSize: 12, fontWeight: 400, textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'background 80ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Upload size={13} style={{ opacity: 0.5 }} />
              Upload local
            </button>
            <button
              type="button"
              onClick={() => { setPopoverOpen(false); onSelectFromBoard?.(); }}
              style={{
                width: '100%', padding: '6px 10px',
                border: 'none', borderRadius: 5, background: 'transparent',
                color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                fontSize: 12, fontWeight: 400, textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'background 80ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <LayoutGrid size={13} style={{ opacity: 0.5 }} />
              Select from Board
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button
        type="button"
        onClick={onUpload}
        style={{
          width: '100%', height: h,
          borderRadius: 10,
          border: '1.5px dashed rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.02)',
          color: 'rgba(255,255,255,0.35)',
          cursor: 'pointer',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8,
          fontSize: 13, fontWeight: 500,
          transition: 'background 120ms ease, border-color 120ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
        }}
      >
        <Plus size={24} style={{ opacity: 0.4 }} />
        <span>{label || 'Upload Image'}</span>
      </button>
      {onSelectFromBoard && (
        <button
          type="button"
          onClick={onSelectFromBoard}
          style={{
            width: '100%', height: 36, borderRadius: 8,
            border: 'none', background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontSize: 12, fontWeight: 500,
            transition: 'background 120ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
        >
          <LayoutGrid size={13} />
          Select from Board
        </button>
      )}
    </div>
  );
}
