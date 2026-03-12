import React from 'react';
import { X } from 'lucide-react';

export interface AdvancedParams {
  steps: number;
  cfg: number;
  seed: string;
  negativePrompt: string;
}

const DEFAULTS: AdvancedParams = {
  steps: 30,
  cfg: 7,
  seed: '',
  negativePrompt: '',
};

interface AdvancedModalProps {
  open: boolean;
  params: AdvancedParams;
  onChange: (params: AdvancedParams) => void;
  onClose: () => void;
}

export function AdvancedModal({ open, params, onChange, onClose }: AdvancedModalProps) {
  if (!open) return null;

  const update = <K extends keyof AdvancedParams>(key: K, value: AdvancedParams[K]) => {
    onChange({ ...params, [key]: value });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 34,
    padding: '0 10px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#fff',
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 6,
    display: 'block',
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 200,
        }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '50%',
          left: 'calc(50% + 32px)',
          transform: 'translate(-50%, -50%)',
          width: 380,
          zIndex: 201,
          borderRadius: 16,
          background: '#1c1e22',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Advanced Settings</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 26, height: 26, borderRadius: 7, border: 'none',
              background: 'transparent', color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={15} />
          </button>
        </div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Steps</label>
              <input
                type="number"
                min={1}
                max={100}
                value={params.steps}
                onChange={(e) => update('steps', Number(e.target.value))}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>CFG Scale</label>
              <input
                type="number"
                min={1}
                max={30}
                step={0.5}
                value={params.cfg}
                onChange={(e) => update('cfg', Number(e.target.value))}
                style={inputStyle}
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Seed</label>
            <input
              type="text"
              placeholder="Random"
              value={params.seed}
              onChange={(e) => update('seed', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Negative Prompt</label>
            <textarea
              placeholder="Things to avoid..."
              value={params.negativePrompt}
              onChange={(e) => update('negativePrompt', e.target.value)}
              rows={3}
              style={{
                ...inputStyle,
                height: 'auto',
                padding: '8px 10px',
                resize: 'none',
                lineHeight: '1.4',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              type="button"
              onClick={() => onChange(DEFAULTS)}
              style={{
                height: 32, padding: '0 14px', borderRadius: 8, border: 'none',
                background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
              }}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                height: 32, padding: '0 14px', borderRadius: 8, border: 'none',
                background: '#5857FD', color: '#fff',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export { DEFAULTS as ADVANCED_DEFAULTS };
