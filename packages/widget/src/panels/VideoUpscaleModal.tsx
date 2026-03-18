import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, LayoutGrid, ChevronDown, Crown, X, Play, Pause } from 'lucide-react';
import { ImmersiveModal } from './ImmersiveModal';

type VideoUpscaleResolution = '1080p' | '2K' | '4K';
type TutorialCategory = 'animation' | 'landscape' | 'portrait';

const RESOLUTION_OPTIONS: { value: VideoUpscaleResolution; label: string; creditPerMin: number }[] = [
  { value: '1080p', label: '1080p', creditPerMin: 1 },
  { value: '2K', label: '2K', creditPerMin: 2 },
  { value: '4K', label: '4K', creditPerMin: 4 },
];

const TUTORIAL_CATEGORIES: { id: TutorialCategory; label: string }[] = [
  { id: 'animation', label: 'Animation' },
  { id: 'landscape', label: 'Landscape' },
  { id: 'portrait', label: 'Portrait' },
];

const TUTORIAL_IMAGES: Record<TutorialCategory, { before: string; after: string }> = {
  animation: {
    before: 'https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?w=400&q=50',
    after: 'https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?w=1200&q=95',
  },
  landscape: {
    before: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=50',
    after: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=95',
  },
  portrait: {
    before: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=50',
    after: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&q=95',
  },
};

export interface VideoUpscaleModalProps {
  open: boolean;
  onClose: () => void;
  onSelectFromBoard?: () => void;
  onSubmit: (data: { videoUrl: string; targetResolution: VideoUpscaleResolution }) => void;
  credits?: number;
}

const footerBtnStyle: React.CSSProperties = {
  flex: 1,
  maxWidth: 240,
  height: 44,
  borderRadius: 8,
  border: 'none',
  background: 'rgba(255,255,255,0.08)',
  color: '#fff',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  transition: 'background 120ms ease',
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Video Preview ────────────────────────────────────────────────────────────

function VideoPreview({
  videoUrl,
  hovered,
  onHoverChange,
  onClear,
  onMetadata,
}: {
  videoUrl: string;
  hovered: boolean;
  onHoverChange: (v: boolean) => void;
  onClear: () => void;
  onMetadata: (meta: { width: number; height: number; duration: number }) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [meta, setMeta] = useState<{ width: number; height: number; duration: number } | null>(null);

  const handleLoadedMetadata = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const m = { width: v.videoWidth, height: v.videoHeight, duration: v.duration };
    setMeta(m);
    onMetadata(m);
  }, [onMetadata]);

  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onEnded = () => setPlaying(false);
    v.addEventListener('ended', onEnded);
    return () => v.removeEventListener('ended', onEnded);
  }, []);

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        onLoadedMetadata={handleLoadedMetadata}
        style={{
          display: 'block',
          maxWidth: '100%',
          maxHeight: '100%',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          borderRadius: 8,
        }}
      />
      {/* Play/Pause overlay */}
      <button
        type="button"
        onClick={togglePlay}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)',
          border: '2px solid rgba(255,255,255,0.3)',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: hovered || !playing ? 0.9 : 0,
          transition: 'opacity 200ms ease',
          backdropFilter: 'blur(4px)',
        }}
      >
        {playing ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: 2 }} />}
      </button>
      {/* Close button */}
      <button
        type="button"
        onClick={onClear}
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
          opacity: hovered ? 1 : 0,
          transition: 'opacity 150ms ease, background 100ms ease',
          pointerEvents: hovered ? 'auto' : 'none',
          backdropFilter: 'blur(4px)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.65)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.4)'; }}
      >
        <X size={16} />
      </button>
      {/* Meta info badge */}
      {meta && (
        <div style={{
          position: 'absolute',
          bottom: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 12,
          padding: '4px 12px',
          borderRadius: 6,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
            {meta.width} x {meta.height}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
            {formatDuration(meta.duration)}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Generate Button ──────────────────────────────────────────────────────────

function GenerateButton({ onClick, credits, disabled }: { onClick: () => void; credits: number; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        maxWidth: 400,
        height: 44,
        background: disabled ? 'rgba(54,67,255,0.4)' : '#3643FF',
        border: 'none',
        color: '#fff',
        fontSize: 14,
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        borderRadius: 8,
        transition: 'background 120ms ease',
        opacity: disabled ? 0.6 : 1,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = '#4a55ff'; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = '#3643FF'; }}
    >
      <span>Upscale Video</span>
      <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Crown size={16} color="#facc15" />
        <span>{credits}</span>
      </div>
    </button>
  );
}

// ── Before/After Comparison Slider ──────────────────────────────────────────

function ComparisonSlider({ beforeSrc, afterSrc }: { beforeSrc: string; afterSrc: string }) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    updatePosition(e.clientX);
  }, [updatePosition]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      updatePosition(e.clientX);
    };
    const handleUp = () => { draggingRef.current = false; };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [updatePosition]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: 16,
        cursor: 'ew-resize',
        userSelect: 'none',
      }}
    >
      <img src={afterSrc} alt="After" draggable={false} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
        <img src={beforeSrc} alt="Before" draggable={false} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(0.5px) brightness(0.92)' }} />
      </div>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${sliderPos}%`, width: 2, background: 'rgba(255,255,255,0.8)', transform: 'translateX(-1px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '50%', left: `${sliderPos}%`, transform: 'translate(-50%, -50%)', width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: '2px solid rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', backdropFilter: 'blur(4px)' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M4.5 3L1.5 7L4.5 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9.5 3L12.5 7L9.5 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ position: 'absolute', bottom: 12, left: 12, padding: '3px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 500, backdropFilter: 'blur(4px)', pointerEvents: 'none' }}>Before</div>
      <div style={{ position: 'absolute', bottom: 12, right: 12, padding: '3px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 500, backdropFilter: 'blur(4px)', pointerEvents: 'none' }}>After</div>
    </div>
  );
}

// ── Main Modal ──────────────────────────────────────────────────────────────

export function VideoUpscaleModal({
  open,
  onClose,
  onSelectFromBoard,
  onSubmit,
  credits,
}: VideoUpscaleModalProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [targetResolution, setTargetResolution] = useState<VideoUpscaleResolution>('1080p');
  const [activeCategory, setActiveCategory] = useState<TutorialCategory>('animation');
  const [resDropdownOpen, setResDropdownOpen] = useState(false);
  const [videoHover, setVideoHover] = useState(false);
  const [videoMeta, setVideoMeta] = useState<{ width: number; height: number; duration: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resDropdownRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasVideo = !!videoUrl;
  const currentRes = RESOLUTION_OPTIONS.find((o) => o.value === targetResolution) ?? RESOLUTION_OPTIONS[0];
  const creditCost = credits ?? currentRes.creditPerMin;

  const AUTO_CYCLE_MS = 3000;

  useEffect(() => {
    if (open) {
      setVideoUrl('');
      setTargetResolution('1080p');
      setActiveCategory('animation');
      setResDropdownOpen(false);
      setVideoHover(false);
      setVideoMeta(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || hasVideo) return;
    timerRef.current = setInterval(() => {
      setActiveCategory((prev) => {
        const idx = TUTORIAL_CATEGORIES.findIndex((c) => c.id === prev);
        return TUTORIAL_CATEGORIES[(idx + 1) % TUTORIAL_CATEGORIES.length].id;
      });
    }, AUTO_CYCLE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [open, hasVideo]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveCategory((prev) => {
        const idx = TUTORIAL_CATEGORIES.findIndex((c) => c.id === prev);
        return TUTORIAL_CATEGORIES[(idx + 1) % TUTORIAL_CATEGORIES.length].id;
      });
    }, AUTO_CYCLE_MS);
  }, []);

  useEffect(() => {
    if (!resDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (resDropdownRef.current && !resDropdownRef.current.contains(e.target as Node)) {
        setResDropdownOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [resDropdownOpen]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (videoUrl.startsWith('blob:')) URL.revokeObjectURL(videoUrl);
    setVideoUrl(URL.createObjectURL(file));
    e.target.value = '';
  }, [videoUrl]);

  const triggerUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleClearVideo = useCallback(() => {
    if (videoUrl.startsWith('blob:')) URL.revokeObjectURL(videoUrl);
    setVideoUrl('');
    setVideoHover(false);
    setVideoMeta(null);
  }, [videoUrl]);

  const handleSubmit = useCallback(() => {
    if (!videoUrl) return;
    onSubmit({ videoUrl, targetResolution });
  }, [videoUrl, targetResolution, onSubmit]);

  const handleMetadata = useCallback((meta: { width: number; height: number; duration: number }) => {
    setVideoMeta(meta);
  }, []);

  // ── Content panel ──────────────────────────────────────────────────────────

  const contentPanel = hasVideo ? (
    <VideoPreview
      videoUrl={videoUrl}
      hovered={videoHover}
      onHoverChange={setVideoHover}
      onClear={handleClearVideo}
      onMetadata={handleMetadata}
    />
  ) : (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 24,
      marginTop: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {TUTORIAL_CATEGORIES.map((cat) => {
          const isActive = cat.id === activeCategory;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => { setActiveCategory(cat.id); resetTimer(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 32,
                padding: '0 16px',
                borderRadius: 20,
                border: 'none',
                background: isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                transition: 'background 150ms ease, color 150ms ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 720, aspectRatio: '16 / 9' }}>
          <ComparisonSlider
            beforeSrc={TUTORIAL_IMAGES[activeCategory].before}
            afterSrc={TUTORIAL_IMAGES[activeCategory].after}
          />
        </div>
      </div>
    </div>
  );

  // ── Footer ─────────────────────────────────────────────────────────────────

  const footer = hasVideo ? (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%' }}>
      <div ref={resDropdownRef} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setResDropdownOpen((p) => !p)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 44,
            padding: '0 16px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'border-color 100ms ease, background 100ms ease',
            minWidth: 100,
            justifyContent: 'space-between',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
        >
          <span>{currentRes.label}</span>
          <ChevronDown
            size={16}
            style={{
              color: 'rgba(255,255,255,0.4)',
              transition: 'transform 150ms ease',
              transform: resDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </button>
        {resDropdownOpen && (
          <div style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: 0,
            padding: 4,
            borderRadius: 8,
            background: '#1c1e22',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 -8px 24px rgba(0,0,0,0.5)',
            zIndex: 20,
            minWidth: 100,
          }}>
            {RESOLUTION_OPTIONS.map((opt) => {
              const isSelected = opt.value === targetResolution;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setTargetResolution(opt.value); setResDropdownOpen(false); }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: 4,
                    background: isSelected ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: isSelected ? '#fff' : 'rgba(255,255,255,0.5)',
                    fontSize: 14,
                    fontWeight: isSelected ? 500 : 400,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 80ms ease',
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? 'rgba(255,255,255,0.08)' : 'transparent'; }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <GenerateButton onClick={handleSubmit} credits={creditCost} />
    </div>
  ) : (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%' }}>
      <button
        type="button"
        onClick={triggerUpload}
        style={{ ...footerBtnStyle, background: '#fff', color: '#000' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f0f0'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
      >
        <Upload size={16} />
        Upload
      </button>
      {onSelectFromBoard && (
        <button
          type="button"
          onClick={onSelectFromBoard}
          style={footerBtnStyle}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
        >
          <LayoutGrid size={16} />
          Select from Board
        </button>
      )}
    </div>
  );

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      <ImmersiveModal
        open={open}
        title="AI Video Upscaler"
        subtitle={hasVideo ? undefined : 'Enhance any video to crystal-clear HD, 2K or 4K resolution in seconds.'}
        onClose={onClose}
        maxWidth={1800}
        footer={footer}
      >
        <div style={{
          flex: 1,
          display: 'flex',
          minHeight: 0,
          padding: '8px 0 20px',
          justifyContent: 'center',
          alignItems: 'flex-start',
          marginTop: 24,
        }}>
          {contentPanel}
        </div>
      </ImmersiveModal>
    </>
  );
}
