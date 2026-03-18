import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Crown, ChevronDown, X, Upload, Images, Sparkles } from 'lucide-react';
import { ImmersiveModal } from './ImmersiveModal';
import { AvatarTemplateGrid } from './components/AvatarTemplateGrid';
import type { AvatarTemplate, AvatarCategory } from './components/AvatarTemplateGrid';
import { ScriptInput } from './components/ScriptInput';
import type { VoiceoverOption } from './components/ScriptInput';
import { MoreSettingsPanel } from './components/MoreSettingsPanel';

type AvatarModel = 'avatar4' | 'avatar4-fast';

export interface AIAvatarSubmitData {
  actionId: 'ai-avatar';
  templateId?: string;
  avatarImageUrl: string;
  model: AvatarModel;
  scriptMode: 'text' | 'audio';
  scriptText?: string;
  audioUrl?: string;
  voiceoverId?: string;
  /** Custom motion / positive prompt (More Settings) */
  motion?: string;
  /** Subtitle style key (More Settings) */
  subtitleStyle?: string;
  /** Off-peak mode (More Settings) */
  offPeak?: boolean;
}

export interface AIAvatarModalProps {
  open: boolean;
  onClose: () => void;
  credits?: number;
  onSubmit: (data: AIAvatarSubmitData) => void;
  onSelectFromBoard?: (context: 'avatar-template') => void;
  templates?: AvatarTemplate[];
  categories?: AvatarCategory[];
  onCategoryChange?: (categoryId: string) => void;
  onLoadMoreTemplates?: () => void;
  hasMoreTemplates?: boolean;
  loadingTemplates?: boolean;
  voiceoverOptions?: VoiceoverOption[];
  initialAvatarUrl?: string;
  /** Optional model preview video URL (host provides, e.g. /avatar-demo.mp4) */
  modelPreviewVideoUrl?: string;
  /** Optional model preview poster image URL */
  modelPreviewPosterUrl?: string;
}

const MODEL_OPTIONS: { value: AvatarModel; label: string; desc: string; features: string[] }[] = [
  {
    value: 'avatar4',
    label: 'Avatar 4',
    desc: 'Best quality',
    features: [
      'Character actions automatically match the audio rhythm; support prompt-based control of character movements.',
      'Up to 120 seconds per video.',
    ],
  },
  {
    value: 'avatar4-fast',
    label: 'Avatar 4 Fast',
    desc: 'Faster, slightly lower quality',
    features: ['Cheaper and faster, with slightly lower quality than Avatar 4.'],
  },
];

const DEMO_CATEGORIES: AvatarCategory[] = [
  { id: 'my-avatar', label: 'My Avatar', icon: '👤' },
  { id: 'favorite', label: 'Favorite', icon: '⭐' },
  { id: 'all', label: 'All' },
  { id: 'conference', label: '🎤Conference/Public Speaking' },
  { id: 'lifestyle', label: '🌿Lifestyle/UGC' },
  { id: 'doctor', label: '🏥Doctor/Expert' },
  { id: 'fashion', label: '👗Fashion/Model' },
  { id: 'tech', label: '💻Tech/Geek' },
  { id: 'business', label: '💼Business/Profession' },
  { id: 'fitness', label: '💪Fitness/sport' },
  { id: 'foodie', label: 'Foodie/Chef', icon: '👨‍🍳' },
  { id: 'pets', label: 'Pets/Animals', icon: '🐱' },
  { id: 'senior', label: 'Senior', icon: '👴' },
  { id: 'anime', label: '✨Anime/Creative' },
];

const DEMO_VOICEOVER_OPTIONS: VoiceoverOption[] = [
  { id: 'violet', name: 'Violet', language: 'en' },
  { id: 'adam', name: 'Adam', language: 'en' },
  { id: 'emma', name: 'Emma', language: 'en' },
  { id: 'josh', name: 'Josh', language: 'en' },
  { id: 'sarah', name: 'Sarah', language: 'en' },
  { id: 'alex', name: 'Alex', language: 'en' },
  { id: 'lily', name: 'Lily', language: 'en' },
];

function makeDemoTemplates(): AvatarTemplate[] {
  const cats = ['conference', 'lifestyle', 'doctor', 'fashion', 'tech', 'business', 'fitness', 'foodie', 'pets', 'senior', 'anime'];
  const names = [
    'Professional Pitch', 'Corporate Intro', 'Meeting Opener',
    'Product Launch', 'Social Ad', 'Brand Story',
    'Course Intro', 'Tutorial Guide', 'Quiz Intro',
    'Fun Greeting', 'Birthday Wish', 'Holiday Message',
    'Product Review', 'Flash Sale', 'Unboxing',
    'Morning Motivation', 'Wellness Tips', 'Travel Vlog',
    'Tech News', 'App Demo', 'Software Tutorial',
    'Health Reminder', 'Medical Info', 'Appointment Reminder',
  ];
  return names.map((name, i) => ({
    id: `demo-${i + 1}`,
    name,
    thumbnailUrl: `https://picsum.photos/seed/avatar-${i + 1}/${360 + (i % 3) * 40}/${440 + ((i * 7) % 5) * 30}`,
    category: cats[Math.floor(i / 3) % cats.length],
    aspectRatio: (360 + (i % 3) * 40) / (440 + ((i * 7) % 5) * 30),
  }));
}

const DEMO_TEMPLATES = makeDemoTemplates();

const sectionLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'rgba(255,255,255,0.65)',
  display: 'block',
  marginBottom: 8,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const actionCardStyle: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  borderRadius: 8,
  border: '1px dashed rgba(255,255,255,0.25)',
  background: 'rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.65)',
  cursor: 'pointer',
  fontSize: 10,
  fontWeight: 500,
  transition: 'all 120ms ease',
  padding: 8,
};

function AvatarPhotoSection({
  avatarUrl,
  templateName,
  onClear,
  onUploadPhoto,
  onSelectFromTemplates,
  onSelectFromBoard,
}: {
  avatarUrl: string;
  templateName?: string;
  onClear: () => void;
  onUploadPhoto: (url: string) => void;
  onSelectFromTemplates: () => void;
  onSelectFromBoard?: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hovered, setHovered] = useState(false);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUploadPhoto(URL.createObjectURL(file));
    e.target.value = '';
  }, [onUploadPhoto]);

  if (avatarUrl) {
    return (
      <div>
        <span style={sectionLabel}>Avatar</span>
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '4/3',
            borderRadius: 8,
            overflow: 'hidden',
            background: '#111',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <img
            src={avatarUrl}
            alt="Selected avatar"
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
          <button
            type="button"
            onClick={onClear}
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 24,
              height: 24,
              borderRadius: 4,
              background: 'rgba(0,0,0,0.6)',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: hovered ? 1 : 0,
              transition: 'opacity 150ms ease',
            }}
          >
            <X size={12} />
          </button>
          {onSelectFromBoard && (
            <button
              type="button"
              onClick={onSelectFromBoard}
              style={{
                position: 'absolute',
                bottom: 4,
                left: 4,
                right: 4,
                height: 28,
                borderRadius: 6,
                border: 'none',
                background: 'rgba(0,0,0,0.7)',
                color: 'rgba(255,255,255,0.8)',
                fontSize: 11,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: hovered ? 1 : 0,
                transform: hovered ? 'translateY(0)' : 'translateY(4px)',
                transition: 'all 150ms ease',
                pointerEvents: hovered ? 'auto' : 'none',
              }}
            >
              Select from Board
            </button>
          )}
          {templateName && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '16px 8px 6px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                textAlign: 'center',
                pointerEvents: 'none',
                opacity: hovered ? 0 : 1,
                transition: 'opacity 150ms ease',
              }}
            >
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                {templateName}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <span style={sectionLabel}>Avatar</span>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      <div style={{ display: 'flex', gap: 6, aspectRatio: '4/3' }}>
        {/* Left: Upload Photo */}
        <div
          style={{ display: 'flex', flex: 1, position: 'relative' }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              ...actionCardStyle,
              flex: 1,
              width: '100%',
              gap: 6,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.16)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
            }}
          >
            <Upload size={20} style={{ opacity: 0.65 }} />
            <span>Upload Photo</span>
          </button>
          {onSelectFromBoard && (
            <button
              type="button"
              onClick={onSelectFromBoard}
              style={{
                position: 'absolute',
                bottom: 4,
                left: 4,
                right: 4,
                height: 26,
                borderRadius: 6,
                border: 'none',
                background: 'rgba(0,0,0,0.7)',
                color: 'rgba(255,255,255,0.8)',
                fontSize: 10,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: hovered ? 1 : 0,
                transform: hovered ? 'translateY(0)' : 'translateY(3px)',
                transition: 'all 150ms ease',
                pointerEvents: hovered ? 'auto' : 'none',
              }}
            >
              Select from Board
            </button>
          )}
        </div>
        {/* Right: Templates + AI */}
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 6 }}>
          <button
            type="button"
            onClick={onSelectFromTemplates}
            style={actionCardStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.16)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
            }}
          >
            <Images size={16} style={{ opacity: 0.65 }} />
            <span>Select from Templates</span>
          </button>
          <button
            type="button"
            onClick={() => {}}
            style={actionCardStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.16)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
            }}
          >
            <Sparkles size={16} style={{ opacity: 0.65 }} />
            <span>Create with AI</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function AIAvatarModal({
  open,
  onClose,
  credits = 0,
  onSubmit,
  onSelectFromBoard,
  templates: templatesProp = [],
  categories: categoriesProp = [],
  onCategoryChange,
  onLoadMoreTemplates,
  hasMoreTemplates,
  loadingTemplates,
  voiceoverOptions: voiceoverOptionsProp = [],
  initialAvatarUrl,
  modelPreviewVideoUrl,
  modelPreviewPosterUrl,
}: AIAvatarModalProps) {
  const categories = categoriesProp.length > 0 ? categoriesProp : DEMO_CATEGORIES;
  const allTemplates = templatesProp.length > 0 ? templatesProp : DEMO_TEMPLATES;
  const voiceoverOptions = voiceoverOptionsProp.length > 0 ? voiceoverOptionsProp : DEMO_VOICEOVER_OPTIONS;

  const [model, setModel] = useState<AvatarModel>('avatar4');
  const [selectedTemplate, setSelectedTemplate] = useState<AvatarTemplate | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [scriptMode, setScriptMode] = useState<'text' | 'audio'>('text');
  const [scriptText, setScriptText] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [voiceoverId, setVoiceoverId] = useState(voiceoverOptions[0]?.id ?? '');
  const [activeCategory, setActiveCategory] = useState('all');
  const [moreSettingsOpen, setMoreSettingsOpen] = useState(false);
  const [captionKey, setCaptionKey] = useState<string | undefined>(undefined);
  const [customMotion, setCustomMotion] = useState<string | undefined>(undefined);
  const [offPeak, setOffPeak] = useState(false);
  const [modelTooltip, setModelTooltip] = useState<AvatarModel | null>(null);
  const [modelTooltipPos, setModelTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const modelButtonRefs = useRef<Map<AvatarModel, HTMLButtonElement>>(new Map());

  const filteredTemplates = React.useMemo(() => {
    if (!activeCategory || activeCategory === 'all' || activeCategory === 'my-avatar' || activeCategory === 'favorite') {
      return allTemplates;
    }
    return allTemplates.filter((t) => t.category === activeCategory);
  }, [allTemplates, activeCategory]);

  useEffect(() => {
    if (open) {
      setModel('avatar4');
      setSelectedTemplate(null);
      setAvatarUrl(initialAvatarUrl ?? '');
      setScriptMode('text');
      setScriptText('');
      setAudioUrl('');
      setVoiceoverId(voiceoverOptions[0]?.id ?? '');
      setActiveCategory('all');
      setMoreSettingsOpen(false);
      setCaptionKey(undefined);
      setCustomMotion(undefined);
      setOffPeak(false);
    }
  }, [open, initialAvatarUrl, voiceoverOptions]);

  const handleTemplateSelect = useCallback((tpl: AvatarTemplate) => {
    setSelectedTemplate(tpl);
    setAvatarUrl(tpl.thumbnailUrl);
  }, []);

  const handleCategoryChange = useCallback(
    (id: string) => {
      setActiveCategory(id);
      onCategoryChange?.(id);
    },
    [onCategoryChange]
  );

  const hasAvatar = !!avatarUrl;
  const hasScript = scriptMode === 'text' ? scriptText.trim().length > 0 : !!audioUrl;
  const canSubmit = hasAvatar && hasScript;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    onSubmit({
      actionId: 'ai-avatar',
      templateId: selectedTemplate?.id,
      avatarImageUrl: avatarUrl,
      model,
      scriptMode,
      scriptText: scriptMode === 'text' ? scriptText : undefined,
      audioUrl: scriptMode === 'audio' ? audioUrl : undefined,
      voiceoverId: scriptMode === 'text' ? voiceoverId : undefined,
      motion: customMotion,
      subtitleStyle: captionKey,
      offPeak,
    });
  }, [canSubmit, onSubmit, selectedTemplate, avatarUrl, model, scriptMode, scriptText, audioUrl, voiceoverId, customMotion, captionKey, offPeak]);

  return (
    <ImmersiveModal
      open={open}
      title="AI Avatar"
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
      <div style={{ display: 'flex', gap: 24, flex: 1, minHeight: 0, marginTop: 24 }}>
        {/* Left panel */}
        <div
          style={{
            width: 300,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            overflowY: 'auto',
            padding: '16px 12px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.08) transparent',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Model selector */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <span style={sectionLabel}>Model</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {MODEL_OPTIONS.map((opt) => {
                const isActive = model === opt.value;
                const showTooltip = modelTooltip === opt.value;
                return (
                  <div key={opt.value} style={{ flex: 1 }}>
                    <button
                      ref={(el) => { if (el) modelButtonRefs.current.set(opt.value, el); }}
                      type="button"
                      onClick={() => setModel(opt.value)}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const w = 320;
                        const h = modelPreviewVideoUrl ? 280 : 120;
                        let left = rect.left + rect.width / 2 - w / 2;
                        let top = rect.bottom + 8;
                        if (left + w > window.innerWidth - 10) left = window.innerWidth - w - 10;
                        if (left < 10) left = 10;
                        if (top + h > window.innerHeight - 10) top = rect.top - h - 8;
                        setModelTooltipPos({ top, left });
                        setModelTooltip(opt.value);
                      }}
                      onMouseLeave={() => {
                        setModelTooltip(null);
                        setModelTooltipPos(null);
                      }}
                      style={{
                        width: '100%',
                        height: 34,
                        borderRadius: 8,
                        border: isActive ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.12)',
                        background: isActive ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)',
                        color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 120ms ease',
                      }}
                    >
                      {opt.label}
                    </button>
                  </div>
                );
              })}
            </div>
            <p
              style={{
                margin: '6px 0 0',
                fontSize: 11,
                color: 'rgba(255,255,255,0.45)',
                lineHeight: '16px',
              }}
            >
              {MODEL_OPTIONS.find((o) => o.value === model)?.desc}
            </p>
          </div>

          {/* Model tooltip (portaled to body to avoid z-index/overflow clipping) */}
          {modelTooltip && modelTooltipPos && open && ReactDOM.createPortal(
            <div
              onMouseEnter={() => setModelTooltip(modelTooltip)}
              onMouseLeave={() => { setModelTooltip(null); setModelTooltipPos(null); }}
              style={{
                position: 'fixed',
                top: modelTooltipPos.top,
                left: modelTooltipPos.left,
                width: 320,
                padding: modelPreviewVideoUrl ? 0 : 12,
                borderRadius: 8,
                background: '#2d2d2d',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                zIndex: 9999,
                overflow: 'hidden',
              }}
            >
              {modelPreviewVideoUrl && (
                <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000' }}>
                  <video
                    src={modelPreviewVideoUrl}
                    poster={modelPreviewPosterUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}
              <div style={{ padding: 12 }}>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {MODEL_OPTIONS.find((o) => o.value === modelTooltip)?.features.map((f, i) => (
                    <li
                      key={i}
                      style={{
                        display: 'flex',
                        gap: 8,
                        marginTop: i > 0 ? 6 : 0,
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.7)',
                        lineHeight: 1.4,
                      }}
                    >
                      <span style={{ flexShrink: 0, width: 4, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.4)', marginTop: 6 }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>,
            document.body
          )}

          {/* Avatar photo upload — 3-zone layout */}
          <AvatarPhotoSection
            avatarUrl={avatarUrl}
            templateName={selectedTemplate?.name}
            onClear={() => { setAvatarUrl(''); setSelectedTemplate(null); }}
            onUploadPhoto={(url) => setAvatarUrl(url)}
            onSelectFromTemplates={() => { /* right panel is already the template gallery */ }}
            onSelectFromBoard={onSelectFromBoard ? () => onSelectFromBoard('avatar-template') : undefined}
          />

          {/* Script input */}
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
              showHelpers
              showVoiceover
              voiceoverOptions={voiceoverOptions}
              selectedVoiceover={voiceoverId}
              onVoiceoverChange={setVoiceoverId}
              onPreviewVoice={() => { /* Audition: host can wire TTS preview */ }}
              showScriptInfo
              onIncreaseTimeLimit={() => { /* Premium: host can open upgrade modal */ }}
            />
          </div>

          {/* More Settings */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <button
              type="button"
              onClick={() => setMoreSettingsOpen((p) => !p)}
              style={{
                width: '100%',
                padding: '8px 0',
                border: 'none',
                background: 'transparent',
                color: 'rgba(255,255,255,0.65)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'color 100ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
              }}
            >
              <ChevronDown
                size={14}
                style={{
                  transition: 'transform 150ms ease',
                  transform: moreSettingsOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                }}
              />
              More Settings
            </button>
            {moreSettingsOpen && (
              <div style={{ padding: '16px 0 0', marginTop: 12 }}>
                <MoreSettingsPanel
                  captionKey={captionKey}
                  onCaptionKeyChange={setCaptionKey}
                  customMotion={customMotion}
                  onCustomMotionChange={setCustomMotion}
                  offPeak={offPeak}
                  onOffPeakChange={setOffPeak}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right panel — template gallery */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
          <AvatarTemplateGrid
            templates={filteredTemplates}
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
