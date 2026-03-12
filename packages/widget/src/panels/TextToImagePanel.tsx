import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Crown, ChevronDown, Monitor, Sparkles } from 'lucide-react';
import { CanvasPanel } from './CanvasPanel';
import { ParamDropdown } from './components/ParamDropdown';
import { UploadSlot } from './components/UploadSlot';

// ── Real model list (from product) ──────────────────────────────────────────
const MODELS = [
  'Nano Banana 2',
  'Seedream 5.0',
  'GPT Image 1.5',
  'Kontext-Pro',
  'Imagen 4',
];

const RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4'];
const RESOLUTIONS = ['512p', '1K', '2K', '4K'];

export type ImageToolTab = 'text-to-image' | 'image-edit';

export interface TextToImageState {
  prompt: string;
  model: string;
  ratio: string;
  resolution: string;
  referenceImageUrl: string;
}

const DEFAULT_STATE: TextToImageState = {
  prompt: '',
  model: 'Nano Banana 2',
  ratio: '1:1',
  resolution: '1K',
  referenceImageUrl: '',
};

interface TextToImagePanelProps {
  /** When true, renders inline (for use inside NodeToolbar). */
  inline?: boolean;
  /** Override panel width. */
  width?: number;
  nodeScreenRect?: { x: number; y: number; w: number; h: number };
  initialTab?: ImageToolTab;
  initialState?: Partial<TextToImageState>;
  credits?: number;
  onSubmit: (tab: ImageToolTab, state: TextToImageState, withWatermark: boolean) => void;
  onDismiss?: () => void;
  onUploadReference?: () => void;
  onSelectFromBoard?: () => void;
}

function getRatioIcon(ratio: string) {
  const parts = ratio.split(':');
  let w = 12;
  let h = 12;
  if (parts.length === 2) {
    const rw = parseFloat(parts[0]);
    const rh = parseFloat(parts[1]);
    if (!isNaN(rw) && !isNaN(rh) && rw > 0 && rh > 0) {
      if (rw >= rh) {
        w = 14;
        h = (14 * rh) / rw;
      } else {
        h = 14;
        w = (14 * rw) / rh;
      }
    }
  }

  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.6, flexShrink: 0 }}>
      <rect x={8 - w/2} y={8 - h/2} width={w} height={h} rx="1.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

// ── Split Generate Button ────────────────────────────────────────────────────
function GenerateButton({
  canSubmit,
  credits,
  onGenerate,
}: {
  canSubmit: boolean;
  credits: number;
  onGenerate: (withWatermark: boolean) => void;
}) {
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

  const activeStyle: React.CSSProperties = {
    background: '#3643FF',
    color: '#fff',
    cursor: 'pointer',
  };
  const disabledStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.25)',
    cursor: 'default',
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', height: 32 }}>
      {/* Main button */}
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
        <Crown size={13} color={canSubmit ? '#facc15' : 'currentColor'} />
        <span style={{ lineHeight: '16px' }}>{credits}</span>
        <span style={{ lineHeight: '16px' }}>Generate</span>
      </button>
      {/* Divider */}
      <div style={{
        width: 1,
        background: canSubmit ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
        flexShrink: 0,
      }} />
      {/* Dropdown arrow */}
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
      {/* Dropdown */}
      {dropdownOpen && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          right: 0,
          marginBottom: 6,
          padding: '4px',
          borderRadius: 10,
          background: '#1c1e22',
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

// ── Main Panel ───────────────────────────────────────────────────────────────
export function TextToImagePanel({
  inline,
  width,
  nodeScreenRect,
  initialTab = 'text-to-image',
  initialState,
  credits = 25,
  onSubmit,
  onDismiss,
  onUploadReference,
  onSelectFromBoard,
}: TextToImagePanelProps) {
  const [activeTab, setActiveTab] = useState<ImageToolTab>(initialTab);
  const [state, setState] = useState<TextToImageState>(() => ({
    ...DEFAULT_STATE,
    ...initialState,
  }));

  const update = useCallback(<K extends keyof TextToImageState>(key: K, value: TextToImageState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const canSubmit = state.prompt.trim().length > 0;

  const handleSubmit = useCallback((withWatermark: boolean) => {
    if (!canSubmit) return;
    onSubmit(activeTab, state, withWatermark);
  }, [activeTab, canSubmit, onSubmit, state]);

  const isImageEdit = activeTab === 'image-edit';

  return (
    <CanvasPanel
      inline={inline}
      width={width}
      nodeScreenRect={nodeScreenRect}
      tabs={[
        { id: 'text-to-image', label: 'Text to Image' },
        { id: 'image-edit', label: 'Image Edit' },
      ]}
      activeTab={activeTab}
      onTabChange={(id) => setActiveTab(id as ImageToolTab)}
      onDismiss={onDismiss}
      bottomBar={
        <>
          <ParamDropdown
            value={state.model}
            options={MODELS.map(m => ({ value: m, icon: <Sparkles size={14} style={{ opacity: 0.6 }} /> }))}
            onChange={(v) => update('model', v)}
            width={102}
          />
          <ParamDropdown
            value={state.ratio}
            options={RATIOS.map(r => ({ value: r, icon: getRatioIcon(r) }))}
            onChange={(v) => update('ratio', v)}
          />
          <ParamDropdown
            value={state.resolution}
            options={RESOLUTIONS.map(r => ({ value: r, icon: <Monitor size={14} style={{ opacity: 0.6 }} /> }))}
            onChange={(v) => update('resolution', v)}
          />
          <div style={{ flex: 1 }} />
          <GenerateButton
            canSubmit={canSubmit}
            credits={credits}
            onGenerate={handleSubmit}
          />
        </>
      }
    >
      {/* Main content area */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Reference image slot (Image Edit tab only) */}
        {isImageEdit && (
          <UploadSlot
            label="Ref"
            imageUrl={state.referenceImageUrl || undefined}
            size="small"
            onUpload={() => onUploadReference?.()}
            onSelectFromBoard={!state.referenceImageUrl ? onSelectFromBoard : undefined}
            onClear={() => update('referenceImageUrl', '')}
          />
        )}
        {/* Prompt */}
        <textarea
          placeholder={
            isImageEdit
              ? 'Describe how you want to edit the image...'
              : 'Describe the image you want to generate...'
          }
          value={state.prompt}
          onChange={(e) => update('prompt', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && canSubmit) {
              e.preventDefault();
              handleSubmit(false);
            }
          }}
          autoFocus
          rows={3}
          className="placeholder:text-white/40"
          style={{
            flex: 1,
            height: 72,
            padding: '8px 8px 8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 8,
            boxSizing: 'border-box',
            background: 'transparent',
            color: '#fff',
            fontSize: 12,
            lineHeight: '18px',
            resize: 'none',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
      </div>
    </CanvasPanel>
  );
}
