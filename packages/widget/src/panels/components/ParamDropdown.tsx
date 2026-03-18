import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface ParamDropdownProps {
  label?: string;
  icon?: React.ReactNode;
  value: string;
  options: string[] | { value: string; label?: string; icon?: React.ReactNode }[];
  onChange: (value: string) => void;
  renderOption?: (option: string) => React.ReactNode;
  width?: number;
}

export function ParamDropdown({ label, icon, value, options, onChange, renderOption, width }: ParamDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('mousedown', handleClick, true);
    window.addEventListener('keydown', handleKey, true);
    return () => {
      window.removeEventListener('mousedown', handleClick, true);
      window.removeEventListener('keydown', handleKey, true);
    };
  }, [open, close]);

  const activeOption = options.find(opt => (typeof opt === 'string' ? opt === value : opt.value === value));
  const displayLabel = typeof activeOption === 'object' && activeOption ? activeOption.label || activeOption.value : value;
  const displayIcon = typeof activeOption === 'object' && activeOption ? activeOption.icon : null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        style={{
          height: 32,
          padding: '0 8px',
          borderRadius: 6,
          border: 'none',
          background: open ? 'rgba(255,255,255,0.08)' : 'transparent',
          color: 'rgba(255,255,255,0.45)',
          fontSize: 12,
          lineHeight: '16px',
          fontWeight: 400,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          transition: 'background 100ms ease',
          whiteSpace: 'nowrap',
          minWidth: width,
        }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.background = 'transparent';
        }}
      >
        {displayIcon || icon}
        {label && <span style={{ flexShrink: 0 }}>{label}</span>}
        <span style={{ color: '#fff', fontSize: 12, lineHeight: '16px', fontWeight: 600 }}>{displayLabel}</span>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            padding: 4,
            borderRadius: 10,
            background: '#1e1e1e',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 10,
            minWidth: 120,
          }}
        >
          {options.map((opt) => {
            const optValue = typeof opt === 'string' ? opt : opt.value;
            const isSelected = optValue === value;
            const optLabel = typeof opt === 'object' ? opt.label || opt.value : opt;
            const optIcon = typeof opt === 'object' ? opt.icon : null;

            return (
              <button
                key={optValue}
                type="button"
                onClick={() => {
                  onChange(optValue);
                  close();
                }}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  border: 'none',
                  borderRadius: 6,
                  background: isSelected ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: isSelected ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)',
                  fontSize: 12,
                  lineHeight: '16px',
                  fontWeight: isSelected ? 500 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                  transition: 'background 80ms ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isSelected ? 'rgba(255,255,255,0.08)' : 'transparent';
                }}
              >
                {optIcon}
                {optLabel}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
