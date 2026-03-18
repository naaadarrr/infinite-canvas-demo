import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MoreHorizontal, ArrowLeftRight } from 'lucide-react';
import { CanvasPanel } from './CanvasPanel';
import { ParamDropdown } from './components/ParamDropdown';
import { UploadSlot } from './components/UploadSlot';
import { GenerateButton } from './components/GenerateButton';
import { getRatioIcon } from './components/RatioIcon';
import { VideoModelSelector, type VideoProvider } from './components/VideoModelSelector';
import videoModelsData from './data/videoModels.json';

const RATIOS = ['16:9', '9:16', '1:1', '4:3', '3:4'];
const RESOLUTIONS = ['720p', '1080p'];
const DURATIONS = ['4s', '5s', '6s', '8s'];

const MODEL_DATA: Record<string, VideoProvider[]> = {
  'image-to-video': videoModelsData.imageToVideo as VideoProvider[],
  'text-to-video': videoModelsData.textToVideo as VideoProvider[],
  'video-edit': videoModelsData.videoEdit as VideoProvider[],
};

export type VideoToolTab = 'image-to-video' | 'text-to-video' | 'video-edit';

export interface AIVideoState {
  prompt: string;
  aspectRatio: string;
  resolution: string;
  duration: string;
  firstFrameUrl: string;
  endFrameUrl: string;
  sourceVideoUrl: string;
  nativeAudio: boolean;
  internetSearch: boolean;
  model: string;
}

const DEFAULT_STATE: AIVideoState = {
  prompt: '',
  aspectRatio: '16:9',
  resolution: '720p',
  duration: '5s',
  firstFrameUrl: '',
  endFrameUrl: '',
  sourceVideoUrl: '',
  nativeAudio: true,
  internetSearch: false,
  model: 'seedance-1.5-pro',
};

interface AIVideoPanelProps {
  inline?: boolean;
  width?: number;
  initialTab?: VideoToolTab;
  initialState?: Partial<AIVideoState>;
  credits?: number;
  onSubmit: (tab: VideoToolTab, state: AIVideoState) => void;
  onDismiss?: () => void;
  onUploadFirstFrame?: () => void;
  onUploadEndFrame?: () => void;
  onUploadMedia?: () => void;
  onSelectFromBoard?: () => void;
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        position: 'relative',
        width: 36,
        height: 20,
        borderRadius: 10,
        border: 'none',
        background: value ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.15)',
        cursor: 'pointer',
        transition: 'background 150ms ease',
        flexShrink: 0,
        padding: 0,
      }}
    >
      <div style={{
        position: 'absolute',
        top: 2,
        left: value ? 18 : 2,
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: value ? '#1a1a1a' : '#fff',
        transition: 'left 150ms ease, background 150ms ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  );
}

// ── More popover (opens below, left-aligned) ─────────────────────────────────
function MorePopover({
  nativeAudio,
  internetSearch,
  showNativeAudio,
  showInternetSearch,
  onNativeAudioChange,
  onInternetSearchChange,
}: {
  nativeAudio: boolean;
  internetSearch: boolean;
  showNativeAudio: boolean;
  showInternetSearch: boolean;
  onNativeAudioChange: (v: boolean) => void;
  onInternetSearchChange: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', handler, true);
    return () => window.removeEventListener('mousedown', handler, true);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        style={{
          height: 32, width: 32, borderRadius: 6, border: 'none',
          background: open ? 'rgba(255,255,255,0.08)' : 'transparent',
          color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 100ms ease', flexShrink: 0,
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = 'transparent'; }}
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          padding: '8px 0', borderRadius: 10, background: '#1e1e1e',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 30, minWidth: 200,
        }}>
          {showNativeAudio && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', gap: 12 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}>Native Audio</span>
              <Toggle value={nativeAudio} onChange={onNativeAudioChange} />
            </div>
          )}
          {showInternetSearch && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', gap: 12 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}>Internet Search</span>
              <Toggle value={internetSearch} onChange={onInternetSearchChange} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const PROMPT_PLACEHOLDERS: Record<VideoToolTab, string> = {
  'image-to-video': 'Describe motion between start and end frames...',
  'text-to-video': 'Describe the motion you want... Use quotes for speech/singing.',
  'video-edit': 'Upload 1-5 reference images or videos and use @mentions to describe interactions. Example: Use @Image1 as the first frame, @Image2 as the last frame, and make them dance like @Video1.',
};

export function AIVideoPanel({
  inline,
  width,
  initialTab = 'image-to-video',
  initialState,
  credits = 2,
  onSubmit,
  onDismiss,
  onUploadFirstFrame,
  onUploadEndFrame,
  onUploadMedia,
  onSelectFromBoard,
}: AIVideoPanelProps) {
  const [activeTab, setActiveTab] = useState<VideoToolTab>(initialTab);
  const [state, setState] = useState<AIVideoState>(() => ({
    ...DEFAULT_STATE,
    ...initialState,
  }));

  const update = useCallback(<K extends keyof AIVideoState>(key: K, value: AIVideoState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const canSubmit = (() => {
    switch (activeTab) {
      case 'image-to-video': return !!state.firstFrameUrl && state.prompt.trim().length > 0;
      case 'text-to-video': return state.prompt.trim().length > 0;
      case 'video-edit': return state.prompt.trim().length > 0;
    }
  })();

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    onSubmit(activeTab, state);
  }, [activeTab, canSubmit, onSubmit, state]);

  const isI2V = activeTab === 'image-to-video';
  const isT2V = activeTab === 'text-to-video';
  const isOR = activeTab === 'video-edit';

  const providers = MODEL_DATA[activeTab] ?? [];

  return (
    <CanvasPanel
      inline={inline}
      width={width}
      tabs={[
        { id: 'image-to-video', label: 'Image to Video' },
        { id: 'text-to-video', label: 'Text to Video' },
        { id: 'video-edit', label: 'Omni Reference' },
      ]}
      activeTab={activeTab}
      onTabChange={(id) => setActiveTab(id as VideoToolTab)}
      onDismiss={onDismiss}
      bottomBar={
        <>
          {/* Model selector — first, all tabs */}
          <VideoModelSelector
            providers={providers}
            selectedModelId={state.model}
            onChange={(v) => update('model', v)}
          />
          {/* Aspect ratio */}
          <ParamDropdown
            value={state.aspectRatio}
            options={RATIOS.map(r => ({ value: r, icon: getRatioIcon(r) }))}
            onChange={(v) => update('aspectRatio', v)}
          />
          {/* Resolution */}
          <ParamDropdown
            value={state.resolution}
            options={RESOLUTIONS.map(r => ({ value: r }))}
            onChange={(v) => update('resolution', v)}
          />
          {/* Duration */}
          <ParamDropdown
            value={state.duration}
            options={DURATIONS.map(d => ({ value: d }))}
            onChange={(v) => update('duration', v)}
          />
          {/* More options */}
          <MorePopover
            nativeAudio={state.nativeAudio}
            internetSearch={state.internetSearch}
            showNativeAudio={isI2V || isT2V}
            showInternetSearch={true}
            onNativeAudioChange={(v) => update('nativeAudio', v)}
            onInternetSearchChange={(v) => update('internetSearch', v)}
          />
          <div style={{ flex: 1 }} />
          <GenerateButton
            canSubmit={canSubmit}
            credits={credits}
            onGenerate={() => handleSubmit()}
          />
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
        {/* Integrated input container: upload slots + textarea inside one bordered area */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            borderRadius: 8,
            background: 'rgba(37, 37, 37, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0px 8px 32px 0px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(12px)',
            overflow: 'hidden',
          }}
        >
          {isI2V && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}>
              <UploadSlot
                label="First"
                imageUrl={state.firstFrameUrl || undefined}
                size="inline"
                onUpload={() => onUploadFirstFrame?.()}
                onSelectFromBoard={!state.firstFrameUrl ? onSelectFromBoard : undefined}
                onClear={() => update('firstFrameUrl', '')}
              />
              <button
                type="button"
                onClick={() => {
                  const a = state.firstFrameUrl;
                  const b = state.endFrameUrl;
                  update('firstFrameUrl', b);
                  update('endFrameUrl', a);
                }}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: 'none',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                }}
              >
                <ArrowLeftRight size={14} />
              </button>
              <UploadSlot
                label="End frame"
                imageUrl={state.endFrameUrl || undefined}
                size="inline"
                onUpload={() => onUploadEndFrame?.()}
                onSelectFromBoard={!state.endFrameUrl ? onSelectFromBoard : undefined}
                onClear={() => update('endFrameUrl', '')}
              />
            </div>
          )}
          {isOR && (
            <div style={{ display: 'flex', gap: 12, padding: 12 }}>
              <UploadSlot
                imageUrl={state.sourceVideoUrl || undefined}
                size="inline"
                onUpload={() => onUploadMedia?.()}
                onSelectFromBoard={!state.sourceVideoUrl ? onSelectFromBoard : undefined}
                onClear={() => update('sourceVideoUrl', '')}
              />
            </div>
          )}
          <textarea
            placeholder={PROMPT_PLACEHOLDERS[activeTab]}
            value={state.prompt}
            onChange={(e) => update('prompt', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && canSubmit) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            autoFocus
            className="placeholder:text-white/40"
            style={{
              flex: 1,
              minHeight: isOR ? 100 : 80,
              padding: 12,
              margin: 0,
              border: 'none',
              borderRadius: 0,
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
      </div>
    </CanvasPanel>
  );
}
