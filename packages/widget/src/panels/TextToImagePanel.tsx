import React, { useCallback, useState } from 'react';
import { Monitor, Sparkles } from 'lucide-react';
import { CanvasPanel } from './CanvasPanel';
import { ParamDropdown } from './components/ParamDropdown';
import { UploadSlot } from './components/UploadSlot';
import { GenerateButton } from './components/GenerateButton';
import { getRatioIcon } from './components/RatioIcon';

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
  inline?: boolean;
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
            showWatermarkOption
          />
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
        {isImageEdit && (
          <div style={{ display: 'flex', gap: 12 }}>
            <UploadSlot
              label="Ref"
              imageUrl={state.referenceImageUrl || undefined}
              size="inline"
              onUpload={() => onUploadReference?.()}
              onSelectFromBoard={!state.referenceImageUrl ? onSelectFromBoard : undefined}
              onClear={() => update('referenceImageUrl', '')}
            />
          </div>
        )}
        <textarea
          placeholder={
            isImageEdit
              ? 'Describe how you want to edit the image...'
              : 'Describe the motion you want... Use quotes for speech/singing.'
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
