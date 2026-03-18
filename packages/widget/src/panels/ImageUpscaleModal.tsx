import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, LayoutGrid, ChevronDown, Crown, X } from 'lucide-react';
import { ImmersiveModal } from './ImmersiveModal';

type UpscaleResolution = '1k' | '2k' | '4k';
type TutorialCategory = 'portraits' | 'landscapes' | 'text';

const RESOLUTION_OPTIONS: { value: UpscaleResolution; label: string; creditCost: number }[] = [
  { value: '1k', label: '1K', creditCost: 0.8 },
  { value: '2k', label: '2K', creditCost: 0.8 },
  { value: '4k', label: '4K', creditCost: 1.4 },
];

const TUTORIAL_CATEGORIES: { id: TutorialCategory; label: string }[] = [
  { id: 'portraits', label: 'Portraits' },
  { id: 'landscapes', label: 'Landscapes' },
  { id: 'text', label: 'Text' },
];

const TUTORIAL_IMAGES: Record<TutorialCategory, { before: string; after: string }> = {
  portraits: {
    before: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=60',
    after: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&q=95',
  },
  landscapes: {
    before: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=60',
    after: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=95',
  },
  text: {
    before: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=50',
    after: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=95',
  },
};

export interface ImageUpscaleModalProps {
  open: boolean;
  onClose: () => void;
  onSelectFromBoard?: () => void;
  onSubmit: (data: { imageUrl: string; targetResolution: UpscaleResolution; withWatermark: boolean }) => void;
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

// ── Image Preview with anchored close button ────────────────────────────────
//
// Challenge: object-fit:contain letterboxes the image inside its container.
// The close button must sit at the image's visual corner, not the container's.
//
// Solution: measure the img element's actual screen rect relative to the
// outer container using getBoundingClientRect(), then set the button's
// top/right accordingly. ResizeObserver keeps it in sync when the modal
// or image size changes.

function ImagePreview({
  imageUrl,
  onClear,
}: {
  imageUrl: string;
  onClear: () => void;
}) {
  const imgRef = React.useRef<HTMLImageElement>(null);
  const outerRef = React.useRef<HTMLDivElement>(null);
  const [imgRect, setImgRect] = React.useState<{ top: number; right: number } | null>(null);
  // hover state lives here — avoids parent re-render cycle and the
  // "mouse moves to button triggers onMouseLeave on image" problem
  const [hovered, setHovered] = React.useState(false);

  const updateRect = React.useCallback(() => {
    const img = imgRef.current;
    const outer = outerRef.current;
    if (!img || !outer) return;
    const imgBounds = img.getBoundingClientRect();
    const outerBounds = outer.getBoundingClientRect();
    setImgRect({
      top: imgBounds.top - outerBounds.top,
      right: outerBounds.right - imgBounds.right,
    });
  }, []);

  React.useEffect(() => {
    const img = imgRef.current;
    const outer = outerRef.current;
    if (!img || !outer) return;

    // Blob URLs are already decoded — img.complete may already be true
    if (img.complete) updateRect();
    img.addEventListener('load', updateRect);

    // Re-measure whenever the image or the outer container resizes
    const ro = new ResizeObserver(updateRect);
    ro.observe(img);
    ro.observe(outer);

    return () => {
      img.removeEventListener('load', updateRect);
      ro.disconnect();
    };
  }, [imageUrl, updateRect]);

  return (
    <div
      ref={outerRef}
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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Preview"
        style={{
          display: 'block',
          maxWidth: '100%',
          maxHeight: '100%',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
        }}
      />
      {/* Close button — positioned to the image's actual top-right corner */}
      <button
        type="button"
        onClick={onClear}
        style={{
          position: 'absolute',
          top: imgRect ? imgRect.top + 8 : 8,
          right: imgRect ? imgRect.right + 8 : 8,
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
    </div>
  );
}

// ── Split Generate Button ────────────────────────────────────────────────────

function GenerateDropdownButton({ onGenerate, credits }: { onGenerate: (withWatermark: boolean) => void; credits: number }) {
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

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', height: 44, maxWidth: 400, flex: 1 }}>
      {/* Main generate button */}
      <button
        type="button"
        onClick={() => onGenerate(false)}
        style={{
          flex: 1,
          height: '100%',
          background: '#3643FF',
          border: 'none',
          color: '#fff',
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          borderRadius: '8px 0 0 8px',
          transition: 'background 120ms ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#4a55ff'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#3643FF'; }}
      >
        <span>Generate</span>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Crown size={16} color="#facc15" />
          <span>{credits}</span>
        </div>
      </button>
      {/* Divider */}
      <div style={{ width: 1, height: '100%', background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
      {/* Dropdown arrow button */}
      <button
        type="button"
        onClick={() => setDropdownOpen((p) => !p)}
        style={{
          width: 44,
          height: 44,
          border: 'none',
          background: '#3643FF',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          borderRadius: '0 8px 8px 0',
          transition: 'background 120ms ease',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#4a55ff'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#3643FF'; }}
      >
        <ChevronDown
          size={15}
          style={{
            transition: 'transform 150ms ease',
            transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
      {/* Dropdown menu — not inside overflow:hidden, so it renders above */}
      {dropdownOpen && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          right: 0,
          padding: '4px',
          borderRadius: 8,
          background: '#1c1e22',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 -8px 24px rgba(0,0,0,0.5)',
          zIndex: 100,
          minWidth: 200,
        }}>
          <button
            type="button"
            onClick={() => { onGenerate(true); setDropdownOpen(false); }}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              borderRadius: 4,
              background: 'transparent',
              color: 'rgba(255,255,255,0.8)',
              fontSize: 14,
              fontWeight: 400,
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              transition: 'background 80ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            Generate with watermark
            <Crown size={14} style={{ marginLeft: 'auto', color: '#fff' }} />
          </button>
        </div>
      )}
    </div>
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
      {/* After image (full) */}
      <img
        src={afterSrc}
        alt="After"
        draggable={false}
        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* Before image (clipped) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
        }}
      >
        <img
          src={beforeSrc}
          alt="Before"
          draggable={false}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(0.5px) brightness(0.92)',
          }}
        />
      </div>

      {/* Slider line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${sliderPos}%`,
          width: 2,
          background: 'rgba(255,255,255,0.8)',
          transform: 'translateX(-1px)',
          pointerEvents: 'none',
        }}
      />

      {/* Slider handle */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: `${sliderPos}%`,
          transform: 'translate(-50%, -50%)',
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)',
          border: '2px solid rgba(255,255,255,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          backdropFilter: 'blur(4px)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M4.5 3L1.5 7L4.5 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9.5 3L12.5 7L9.5 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Labels */}
      <div style={{
        position: 'absolute',
        bottom: 12,
        left: 12,
        padding: '3px 8px',
        borderRadius: 6,
        background: 'rgba(0,0,0,0.5)',
        color: 'rgba(255,255,255,0.8)',
        fontSize: 11,
        fontWeight: 500,
        backdropFilter: 'blur(4px)',
        pointerEvents: 'none',
      }}>
        Before
      </div>
      <div style={{
        position: 'absolute',
        bottom: 12,
        right: 12,
        padding: '3px 8px',
        borderRadius: 6,
        background: 'rgba(0,0,0,0.5)',
        color: 'rgba(255,255,255,0.8)',
        fontSize: 11,
        fontWeight: 500,
        backdropFilter: 'blur(4px)',
        pointerEvents: 'none',
      }}>
        After
      </div>
    </div>
  );
}

// ── Main Modal ──────────────────────────────────────────────────────────────

export function ImageUpscaleModal({
  open,
  onClose,
  onSelectFromBoard,
  onSubmit,
  credits,
}: ImageUpscaleModalProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [targetResolution, setTargetResolution] = useState<UpscaleResolution>('2k');
  const [activeCategory, setActiveCategory] = useState<TutorialCategory>('portraits');
  const [resDropdownOpen, setResDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resDropdownRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasImage = !!imageUrl;
  const currentRes = RESOLUTION_OPTIONS.find((o) => o.value === targetResolution) ?? RESOLUTION_OPTIONS[1];
  const creditCost = credits ?? currentRes.creditCost;

  const AUTO_CYCLE_MS = 3000;

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setImageUrl('');
      setTargetResolution('2k');
      setActiveCategory('portraits');
      setResDropdownOpen(false);
    }
  }, [open]);

  // Auto-cycle tutorial categories when no image
  useEffect(() => {
    if (!open || hasImage) return;
    timerRef.current = setInterval(() => {
      setActiveCategory((prev) => {
        const idx = TUTORIAL_CATEGORIES.findIndex((c) => c.id === prev);
        return TUTORIAL_CATEGORIES[(idx + 1) % TUTORIAL_CATEGORIES.length].id;
      });
    }, AUTO_CYCLE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [open, hasImage]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveCategory((prev) => {
        const idx = TUTORIAL_CATEGORIES.findIndex((c) => c.id === prev);
        return TUTORIAL_CATEGORIES[(idx + 1) % TUTORIAL_CATEGORIES.length].id;
      });
    }, AUTO_CYCLE_MS);
  }, []);

  // Close resolution dropdown on outside click
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
    setImageUrl(URL.createObjectURL(file));
    e.target.value = '';
  }, []);

  const triggerUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleClearImage = useCallback(() => {
    if (imageUrl.startsWith('blob:')) URL.revokeObjectURL(imageUrl);
    setImageUrl('');
  }, [imageUrl]);

  const handleSubmit = useCallback((withWatermark: boolean) => {
    if (!imageUrl) return;
    onSubmit({ imageUrl, targetResolution, withWatermark });
  }, [imageUrl, targetResolution, onSubmit]);

  // ── Content panel ──────────────────────────────────────────────────────────

  const contentPanel = hasImage ? (
    /*
     * Image preview layout — close button anchored to the image's visual corner:
     *
     * The challenge: object-fit:contain letterboxes the image, so the image's
     * rendered bounds are smaller than the container. We can't use a single
     * positioned container because the button would end up in the container's
     * corner, not the image's corner.
     *
     * Solution: two-layer approach
     * 1. Outer centering div (flex, fills available space) — just for centering
     * 2. Inner wrapper (position:relative) that shrinks to the image's rendered
     *    size using max-width/max-height + aspect-ratio. The close button is
     *    positioned inside this wrapper, so it always sits on the image corner.
     */
    <ImagePreview
      imageUrl={imageUrl}
      onClear={handleClearImage}
    />
  ) : (
    // Tutorial showcase
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 24,
      marginTop: 0,
    }}>
      {/* Category pills */}
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

      {/* Before/After comparison slider */}
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <div style={{
          width: '100%',
          maxWidth: 720,
          aspectRatio: '16 / 9',
        }}>
          <ComparisonSlider
            beforeSrc={TUTORIAL_IMAGES[activeCategory].before}
            afterSrc={TUTORIAL_IMAGES[activeCategory].after}
          />
        </div>
      </div>
    </div>
  );

  // ── Footer ─────────────────────────────────────────────────────────────────

  const footer = hasImage ? (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%' }}>
      {/* Resolution dropdown */}
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

      <GenerateDropdownButton onGenerate={handleSubmit} credits={creditCost} />
    </div>
  ) : (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%' }}>
      <button
        type="button"
        onClick={triggerUpload}
        style={{
          ...footerBtnStyle,
          background: '#fff',
          color: '#000',
        }}
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      <ImmersiveModal
        open={open}
        title="AI Image Upscaler"
        subtitle={hasImage ? undefined : 'From old family photos to product shots, upscale any image to crystal-clear 4K in seconds.'}
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
