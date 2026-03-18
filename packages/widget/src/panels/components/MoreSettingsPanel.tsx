/**
 * More Settings panel for AI Avatar - widget-native implementation.
 * Mirrors phase3-avatar/AiAvatar/components/MoreSettings structure:
 * - Subtitle Style selector
 * - Custom Motion (Optional) with Beta tag
 * - Off-Peak Mode toggle
 */
import React, { useCallback, useRef, useState } from 'react';
import { Ban, ChevronDown, Crown, Info } from 'lucide-react';
import { CommonTooltip } from '../../components/CommonTooltip';

const CUSTOM_MOTION_MAX_LENGTH = 600;

const sectionLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: 'rgba(255,255,255,0.6)',
  display: 'block',
  marginBottom: 8,
};

export interface MoreSettingsPanelProps {
  /** Subtitle style key (undefined = No Subtitle) */
  captionKey?: string;
  onCaptionKeyChange: (key: string | undefined) => void;
  /** Custom motion / positive prompt */
  customMotion?: string;
  onCustomMotionChange: (value: string | undefined) => void;
  /** Off-peak mode */
  offPeak?: boolean;
  onOffPeakChange: (value: boolean) => void;
}

const DEMO_SUBTITLE_OPTIONS: { key: string; label: string }[] = [
  { key: 'style-default', label: 'Default' },
  { key: 'style-minimal', label: 'Minimal' },
  { key: 'style-bold', label: 'Bold' },
];

export function MoreSettingsPanel({
  captionKey,
  onCaptionKeyChange,
  customMotion,
  onCustomMotionChange,
  offPeak,
  onOffPeakChange,
}: MoreSettingsPanelProps) {
  const [subtitleModalOpen, setSubtitleModalOpen] = useState(false);
  const subtitleModalRef = useRef<HTMLDivElement>(null);

  const handleSubtitleSelect = useCallback(
    (key: string | undefined) => {
      onCaptionKeyChange(key);
      setSubtitleModalOpen(false);
    },
    [onCaptionKeyChange]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Subtitle Style */}
      <div style={{ position: 'relative' }}>
        <span style={sectionLabel}>Subtitle Style</span>
        <button
          type="button"
          onClick={() => setSubtitleModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 120,
            height: 56,
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            transition: 'all 120ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          }}
        >
          {!captionKey ? (
            <Ban size={24} style={{ opacity: 0.6 }} />
          ) : (
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
              {DEMO_SUBTITLE_OPTIONS.find((o) => o.key === captionKey)?.label ?? 'Style'}
            </span>
          )}
        </button>

        {subtitleModalOpen && (
          <SubtitleStyleModal
            captionKey={captionKey}
            onSelect={handleSubtitleSelect}
            onClose={() => setSubtitleModalOpen(false)}
            options={DEMO_SUBTITLE_OPTIONS}
          />
        )}
      </div>

      {/* Custom Motion (Optional) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={sectionLabel}>Custom Motion</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>(Optional)</span>
          <span
            style={{
              padding: '2px 6px',
              borderRadius: 4,
              background: 'rgba(99,102,241,0.2)',
              color: '#818cf8',
              fontSize: 10,
              fontWeight: 500,
            }}
          >
            Beta
          </span>
        </div>
        <textarea
          value={customMotion ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            if (v.length <= CUSTOM_MOTION_MAX_LENGTH) onCustomMotionChange(v || undefined);
          }}
          placeholder="Describe the avatar's emotional actions, such as excited, discouraged, or cheering."
          rows={4}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
            color: '#fff',
            fontSize: 13,
            lineHeight: 1.5,
            resize: 'none',
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
          {(customMotion ?? '').length}/{CUSTOM_MOTION_MAX_LENGTH}
        </div>
      </div>

      {/* Off-Peak Mode */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ ...sectionLabel, marginBottom: 0 }}>Off-Peak Mode</span>
          <Crown size={14} style={{ color: '#a78bfa' }} />
          <CommonTooltip
            text="Save 50% credits. Processed in idle hours. Guaranteed within 24h."
            placement="top"
          >
            <span style={{ cursor: 'help', display: 'flex', alignItems: 'center' }}>
              <Info size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
            </span>
          </CommonTooltip>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={!!offPeak}
          onClick={() => onOffPeakChange(!offPeak)}
          style={{
            position: 'relative',
            width: 36,
            height: 20,
            borderRadius: 10,
            border: 'none',
            background: offPeak ? '#6366f1' : 'rgba(255,255,255,0.2)',
            cursor: 'pointer',
            transition: 'background 150ms ease',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 2,
              left: offPeak ? 18 : 2,
              width: 16,
              height: 16,
              borderRadius: 8,
              background: '#fff',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
              transition: 'left 150ms ease',
            }}
          />
        </button>
      </div>
    </div>
  );
}

function SubtitleStyleModal({
  captionKey,
  onSelect,
  onClose,
  options,
}: {
  captionKey?: string;
  onSelect: (key: string | undefined) => void;
  onClose: () => void;
  options: { key: string; label: string }[];
}) {
  const ref = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener('mousedown', handler, true);
    return () => window.removeEventListener('mousedown', handler, true);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: 0,
        top: '100%',
        marginTop: 8,
        padding: 12,
        borderRadius: 8,
        background: '#1e1e1e',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        zIndex: 100,
        minWidth: 140,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button
          type="button"
          onClick={() => onSelect(undefined)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 6,
            border: 'none',
            background: captionKey === undefined ? 'rgba(78,64,243,0.3)' : 'transparent',
            color: '#fff',
            fontSize: 12,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <Ban size={16} style={{ opacity: 0.6 }} />
          No Subtitle
        </button>
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => onSelect(opt.key)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: 'none',
              background: captionKey === opt.key ? 'rgba(78,64,243,0.3)' : 'transparent',
              color: '#fff',
              fontSize: 12,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
