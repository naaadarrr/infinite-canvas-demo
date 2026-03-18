import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Crown, CloudUpload, ChevronDown, X, Play, Pause, Upload } from 'lucide-react';
import { ImmersiveModal } from './ImmersiveModal';
import { AvatarTemplateGrid } from './components/AvatarTemplateGrid';
import type { AvatarTemplate, AvatarCategory } from './components/AvatarTemplateGrid';
import { ScriptInput } from './components/ScriptInput';
import type { VoiceoverOption } from './components/ScriptInput';

const EMOTION_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'happy', label: 'Happy' },
  { value: 'sad', label: 'Sad' },
  { value: 'angry', label: 'Angry' },
  { value: 'surprised', label: 'Surprised' },
];

export interface VideoLipSyncSubmitData {
  actionId: 'video-lip-sync';
  sourceMode: 'template' | 'upload';
  templateId?: string;
  videoUrl: string;
  scriptMode: 'text' | 'audio';
  scriptText?: string;
  audioUrl?: string;
  voiceoverId?: string;
  emotion?: string;
}

export interface VideoLipSyncModalProps {
  open: boolean;
  onClose: () => void;
  credits?: number;
  onSubmit: (data: VideoLipSyncSubmitData) => void;
  onSelectFromBoard?: (context: 'lip-sync-video') => void;
  templates?: AvatarTemplate[];
  categories?: AvatarCategory[];
  onCategoryChange?: (categoryId: string) => void;
  onLoadMoreTemplates?: () => void;
  hasMoreTemplates?: boolean;
  loadingTemplates?: boolean;
  voiceoverOptions?: VoiceoverOption[];
  initialVideoUrl?: string;
}

const sectionLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'rgba(255,255,255,0.5)',
  display: 'block',
  marginBottom: 6,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

export function VideoLipSyncModal({
  open,
  onClose,
  credits = 0,
  onSubmit,
  onSelectFromBoard,
  templates = [],
  categories = [],
  onCategoryChange,
  onLoadMoreTemplates,
  hasMoreTemplates,
  loadingTemplates,
  voiceoverOptions = [],
  initialVideoUrl,
}: VideoLipSyncModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<AvatarTemplate | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [sourceMode, setSourceMode] = useState<'template' | 'upload'>('template');
  const [scriptMode, setScriptMode] = useState<'text' | 'audio'>('text');
  const [scriptText, setScriptText] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [voiceoverId, setVoiceoverId] = useState(voiceoverOptions[0]?.id ?? '');
  const [emotion, setEmotion] = useState('normal');
  const [emotionOpen, setEmotionOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? 'all');
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emotionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setSelectedTemplate(null);
      setVideoUrl(initialVideoUrl ?? '');
      setSourceMode(initialVideoUrl ? 'upload' : 'template');
      setScriptMode('text');
      setScriptText('');
      setAudioUrl('');
      setVoiceoverId(voiceoverOptions[0]?.id ?? '');
      setEmotion('normal');
      setEmotionOpen(false);
      setActiveCategory(categories[0]?.id ?? 'all');
      setIsPlaying(false);
    }
  }, [open, initialVideoUrl, voiceoverOptions, categories]);

  useEffect(() => {
    if (!emotionOpen) return;
    const handler = (e: MouseEvent) => {
      if (emotionRef.current && !emotionRef.current.contains(e.target as Node)) setEmotionOpen(false);
    };
    window.addEventListener('mousedown', handler, true);
    return () => window.removeEventListener('mousedown', handler, true);
  }, [emotionOpen]);

  const handleTemplateSelect = useCallback((tpl: AvatarTemplate) => {
    setSelectedTemplate(tpl);
    setVideoUrl(tpl.thumbnailUrl);
    setSourceMode('template');
  }, []);

  const handleCategoryChange = useCallback(
    (id: string) => {
      setActiveCategory(id);
      onCategoryChange?.(id);
    },
    [onCategoryChange]
  );

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoUrl(URL.createObjectURL(file));
    setSourceMode('upload');
    setSelectedTemplate(null);
    e.target.value = '';
  }, []);

  const togglePlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play();
      setIsPlaying(true);
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  }, []);

  const hasVideo = !!videoUrl;
  const hasScript = scriptMode === 'text' ? scriptText.trim().length > 0 : !!audioUrl;
  const canSubmit = hasVideo && hasScript;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    onSubmit({
      actionId: 'video-lip-sync',
      sourceMode,
      templateId: selectedTemplate?.id,
      videoUrl,
      scriptMode,
      scriptText: scriptMode === 'text' ? scriptText : undefined,
      audioUrl: scriptMode === 'audio' ? audioUrl : undefined,
      voiceoverId: scriptMode === 'text' ? voiceoverId : undefined,
      emotion,
    });
  }, [canSubmit, onSubmit, sourceMode, selectedTemplate, videoUrl, scriptMode, scriptText, audioUrl, voiceoverId, emotion]);

  const selectedEmotion = EMOTION_OPTIONS.find((e) => e.value === emotion);

  return (
    <ImmersiveModal
      open={open}
      title="Video Lip Sync"
      subtitle="Sync lip movements to any avatar video"
      onClose={onClose}
      maxWidth={1800}
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%' }}>
          <button
            type="button"
            onClick={handleSubmit}
            style={{
              height: 44,
              width: 400,
              maxWidth: '80%',
              padding: '0 24px',
              borderRadius: 8,
              border: 'none',
              fontSize: 14,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              transition: 'all 120ms ease',
              background: canSubmit ? '#3643FF' : 'rgba(255,255,255,0.08)',
              color: canSubmit ? '#fff' : 'rgba(255,255,255,0.4)',
              cursor: canSubmit ? 'pointer' : 'default',
            }}
            onMouseEnter={(e) => {
              if (canSubmit) e.currentTarget.style.background = '#4a55ff';
            }}
            onMouseLeave={(e) => {
              if (canSubmit) e.currentTarget.style.background = '#3643FF';
            }}
          >
            <span>Generate</span>
            <div style={{ width: 1, height: 16, background: canSubmit ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Crown size={16} color={canSubmit ? '#facc15' : 'currentColor'} />
              <span>{credits}</span>
            </div>
          </button>
        </div>
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      <div style={{ display: 'flex', gap: 24, flex: 1, minHeight: 0, marginTop: 24 }}>
        {/* Left panel */}
        <div
          style={{
            width: 300,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            overflowY: 'auto',
            paddingRight: 4,
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.06) transparent',
          }}
        >
          {/* Video preview */}
          <div>
            <span style={sectionLabel}>Video Source</span>
            {videoUrl ? (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16/9',
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: '#000',
                }}
              >
                <video
                  ref={videoRef}
                  src={videoUrl}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  onEnded={() => setIsPlaying(false)}
                  loop={false}
                />
                {/* Play/pause overlay */}
                <button
                  type="button"
                  onClick={togglePlay}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {!isPlaying && (
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      <Play size={18} color="#fff" style={{ marginLeft: 2 }} />
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (videoUrl.startsWith('blob:')) URL.revokeObjectURL(videoUrl);
                    setVideoUrl('');
                    setSelectedTemplate(null);
                    setIsPlaying(false);
                  }}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 32,
                    height: 32,
                    borderRadius: 4,
                    background: 'rgba(0,0,0,0.4)',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(8px)',
                    zIndex: 2,
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%',
                  aspectRatio: '16/9',
                  borderRadius: 10,
                  border: '1.5px dashed rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.02)',
                  color: 'rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
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
                <CloudUpload size={24} style={{ opacity: 0.4 }} />
                Select a template or upload →
              </button>
            )}
            {!videoUrl && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%',
                  height: 34,
                  marginTop: 8,
                  borderRadius: 8,
                  border: 'none',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'background 120ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }}
              >
                <Upload size={13} />
                Upload Video
              </button>
            )}
          </div>

          {/* Script */}
          <div>
            <span style={sectionLabel}>Script</span>
            <ScriptInput
              mode={scriptMode}
              onModeChange={setScriptMode}
              text={scriptText}
              onTextChange={setScriptText}
              audioUrl={audioUrl}
              onAudioChange={setAudioUrl}
              maxChars={450}
              showVoiceover={voiceoverOptions.length > 0}
              voiceoverOptions={voiceoverOptions}
              selectedVoiceover={voiceoverId}
              onVoiceoverChange={setVoiceoverId}
            />
          </div>

          {/* Emotion */}
          <div>
            <span style={sectionLabel}>Emotion</span>
            <div ref={emotionRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setEmotionOpen((p) => !p)}
                style={{
                  width: '100%',
                  height: 36,
                  padding: '0 10px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'border-color 100ms ease',
                }}
              >
                <span>{selectedEmotion?.label ?? 'Normal'}</span>
                <ChevronDown
                  size={14}
                  style={{
                    color: 'rgba(255,255,255,0.3)',
                    transition: 'transform 150ms ease',
                    transform: emotionOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </button>
              {emotionOpen && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    padding: 4,
                    borderRadius: 8,
                    background: '#1e1e1e',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    zIndex: 20,
                  }}
                >
                  {EMOTION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setEmotion(opt.value);
                        setEmotionOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: 'none',
                        borderRadius: 4,
                        background: opt.value === emotion ? 'rgba(255,255,255,0.08)' : 'transparent',
                        color: opt.value === emotion ? '#fff' : 'rgba(255,255,255,0.6)',
                        fontSize: 12,
                        fontWeight: opt.value === emotion ? 500 : 400,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 80ms ease',
                      }}
                      onMouseEnter={(e) => {
                        if (opt.value !== emotion) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        if (opt.value !== emotion) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right panel — template gallery */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
          <AvatarTemplateGrid
            templates={templates}
            selectedId={selectedTemplate?.id ?? null}
            onSelect={handleTemplateSelect}
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            onLoadMore={onLoadMoreTemplates}
            hasMore={hasMoreTemplates}
            loading={loadingTemplates}
          />
        </div>
      </div>
    </ImmersiveModal>
  );
}
