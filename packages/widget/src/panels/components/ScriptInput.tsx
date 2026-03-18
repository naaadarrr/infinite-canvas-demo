import React, { useCallback, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Upload, X, ChevronDown, Volume2, Crown, Info } from 'lucide-react';

export interface VoiceoverOption {
  id: string;
  name: string;
  language: string;
  flag?: string;
}

interface ScriptInputProps {
  mode: 'text' | 'audio';
  onModeChange: (mode: 'text' | 'audio') => void;
  text: string;
  onTextChange: (text: string) => void;
  audioUrl: string;
  onAudioChange: (url: string) => void;
  maxChars?: number;
  placeholder?: string;
  showVoiceover?: boolean;
  voiceoverOptions?: VoiceoverOption[];
  selectedVoiceover?: string;
  onVoiceoverChange?: (id: string) => void;
  /** Audition/preview voice - when provided, shows Volume2 button next to voiceover dropdown */
  onPreviewVoice?: () => void;
  showHelpers?: boolean;
  onAddPause?: () => void;
  onModifyPronunciation?: () => void;
  /** Show script info as hover tooltip (info icon; 450 chars, 30 sec, Increase time limit) */
  showScriptInfo?: boolean;
  /** Callback when user clicks "Increase time limit" (premium) */
  onIncreaseTimeLimit?: () => void;
  /** Tooltip text for Modify Pronunciation button */
  modifyPronunciationTooltip?: string;
}

function ScriptInfoHoverTooltip({
  charCount,
  maxChars,
  onIncreaseTimeLimit,
}: {
  charCount: number;
  maxChars: number;
  onIncreaseTimeLimit?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const updatePos = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 8, left: rect.left });
  }, []);

  return (
    <div
      ref={ref}
      onMouseEnter={() => { setHovered(true); updatePos(); }}
      onMouseLeave={() => setHovered(false)}
      style={{
        flexShrink: 0,
        width: 20,
        height: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'help',
        color: 'rgba(255,255,255,0.4)',
      }}
    >
      <Info size={16} />
      {hovered && pos && ReactDOM.createPortal(
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: 280,
            maxWidth: 'calc(100vw - 24px)',
            padding: '12px 14px',
            borderRadius: 8,
            background: 'rgba(37,37,37,0.95)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 9999,
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
            It&apos;s okay to go slightly over 450 characters, but your video must stay under 30 sec to generate successfully.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{charCount}/{maxChars} (30 sec max)</span>
            <button
              type="button"
              onClick={() => onIncreaseTimeLimit?.()}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: 0, border: 'none', background: 'transparent',
                color: '#f59e0b', fontSize: 12, fontWeight: 500, cursor: 'pointer',
              }}
            >
              <Crown size={14} />
              Increase time limit
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

const modeBtn = (active: boolean): React.CSSProperties => ({
  flex: 1,
  height: 32,
  borderRadius: 6,
  border: 'none',
  background: active ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.05)',
  color: active ? '#fff' : 'rgba(255,255,255,0.55)',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 120ms ease',
});

export function ScriptInput({
  mode,
  onModeChange,
  text,
  onTextChange,
  audioUrl,
  onAudioChange,
  maxChars = 450,
  placeholder = 'Enter your script here...',
  showVoiceover = false,
  voiceoverOptions = [],
  selectedVoiceover,
  onVoiceoverChange,
  onPreviewVoice,
  showHelpers = false,
  onAddPause,
  onModifyPronunciation,
  showScriptInfo = false,
  onIncreaseTimeLimit,
  modifyPronunciationTooltip = 'Modify pronunciation or add phonetics for specific words',
}: ScriptInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);
  const voiceRef = useRef<HTMLDivElement>(null);

  const charCount = text.length;
  const isOverLimit = charCount > maxChars;

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      onAudioChange(URL.createObjectURL(file));
      e.target.value = '';
    },
    [onAudioChange]
  );

  const clearAudio = useCallback(() => {
    if (audioUrl.startsWith('blob:')) URL.revokeObjectURL(audioUrl);
    onAudioChange('');
  }, [audioUrl, onAudioChange]);

  React.useEffect(() => {
    if (!voiceDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (voiceRef.current && !voiceRef.current.contains(e.target as Node)) {
        setVoiceDropdownOpen(false);
      }
    };
    window.addEventListener('mousedown', handler, true);
    return () => window.removeEventListener('mousedown', handler, true);
  }, [voiceDropdownOpen]);

  const selectedVoice = voiceoverOptions.find((v) => v.id === selectedVoiceover);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Mode toggle */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          padding: 2,
          borderRadius: 8,
          background: 'rgba(255,255,255,0.08)',
        }}
      >
        <button type="button" onClick={() => onModeChange('text')} style={modeBtn(mode === 'text')}>
          Text
        </button>
        <button type="button" onClick={() => onModeChange('audio')} style={modeBtn(mode === 'audio')}>
          Audio Upload
        </button>
      </div>

      {/* Text mode */}
      {mode === 'text' && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder={placeholder}
              rows={5}
              style={{
                width: '100%',
                padding: '10px 12px',
                paddingBottom: showScriptInfo ? 10 : 28,
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                fontSize: 13,
                lineHeight: '1.5',
                resize: 'none',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              }}
            />
            {!showScriptInfo && (
              <span
                style={{
                  position: 'absolute',
                  bottom: 8,
                  right: 12,
                  fontSize: 11,
                  color: isOverLimit ? '#ef4444' : 'rgba(255,255,255,0.25)',
                  fontWeight: isOverLimit ? 600 : 400,
                }}
              >
                {charCount}/{maxChars}
              </span>
            )}
          </div>
          {showScriptInfo && (
            <ScriptInfoHoverTooltip
              charCount={charCount}
              maxChars={maxChars}
              onIncreaseTimeLimit={onIncreaseTimeLimit}
            />
          )}
        </div>
      )}

      {/* Audio mode */}
      {mode === 'audio' && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mp3,audio/wav,audio/mpeg,audio/ogg,audio/webm,audio/*"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          {audioUrl ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: 'rgba(54,67,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Volume2 size={14} color="#818cf8" />
              </div>
              <span
                style={{
                  flex: 1,
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.7)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                Audio uploaded
              </span>
              <button
                type="button"
                onClick={clearAudio}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  border: 'none',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                height: 80,
                borderRadius: 8,
                border: '1.5px dashed rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.02)',
                color: 'rgba(255,255,255,0.35)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 500,
                transition: 'all 120ms ease',
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
              <Upload size={18} style={{ opacity: 0.4 }} />
              Upload audio file
            </button>
          )}
        </>
      )}

      {/* Helper buttons */}
      {showHelpers && mode === 'text' && (
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            type="button"
            onClick={() => {
              if (onAddPause) { onAddPause(); return; }
              onTextChange(text + ' [pause 0.2s] ');
            }}
            style={{
              height: 26,
              padding: '0 10px',
              borderRadius: 13,
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.7)',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 100ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
            }}
          >
            Add Pause
          </button>
          <button
            type="button"
            title={modifyPronunciationTooltip}
            onClick={() => {
              if (onModifyPronunciation) { onModifyPronunciation(); return; }
            }}
            style={{
              height: 26,
              padding: '0 10px',
              borderRadius: 13,
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.7)',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 100ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
            }}
          >
            Modify Pronunciation
          </button>
        </div>
      )}

      {/* Voiceover selector */}
      {showVoiceover && mode === 'text' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>Voiceover</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div ref={voiceRef} style={{ position: 'relative', flex: 1 }}>
              <button
                type="button"
                onClick={() => setVoiceDropdownOpen((p) => !p)}
                style={{
                  width: '100%',
                  height: 36,
                  padding: '0 10px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'border-color 100ms ease',
                }}
              >
                {selectedVoice?.flag && <span>{selectedVoice.flag}</span>}
                <span style={{ flex: 1, textAlign: 'left' }}>{selectedVoice?.name || 'Select voice'}</span>
                <ChevronDown
                  size={14}
                  style={{
                    color: 'rgba(255,255,255,0.3)',
                    transition: 'transform 150ms ease',
                    transform: voiceDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </button>
              {voiceDropdownOpen && voiceoverOptions.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    padding: 4,
                    borderRadius: 8,
                    background: '#1e1e1e',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    zIndex: 20,
                    maxHeight: 200,
                    overflowY: 'auto',
                  }}
                >
                  {voiceoverOptions.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        onVoiceoverChange?.(v.id);
                        setVoiceDropdownOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: 'none',
                        borderRadius: 4,
                        background: v.id === selectedVoiceover ? 'rgba(255,255,255,0.08)' : 'transparent',
                        color: v.id === selectedVoiceover ? '#fff' : 'rgba(255,255,255,0.6)',
                        fontSize: 12,
                        fontWeight: v.id === selectedVoiceover ? 500 : 400,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'background 80ms ease',
                      }}
                      onMouseEnter={(e) => {
                        if (v.id !== selectedVoiceover) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        if (v.id !== selectedVoiceover) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {v.flag && <span>{v.flag}</span>}
                      {v.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => onPreviewVoice?.()}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 100ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                }}
              >
                <Volume2 size={14} />
              </button>
          </div>
        </div>
      )}
    </div>
  );
}
