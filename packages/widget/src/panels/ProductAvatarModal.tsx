import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Crown, CloudUpload, LayoutGrid, X, ArrowLeft } from 'lucide-react';
import { ImmersiveModal } from './ImmersiveModal';
import { AvatarTemplateGrid } from './components/AvatarTemplateGrid';
import type { AvatarTemplate, AvatarCategory } from './components/AvatarTemplateGrid';
import { ScriptInput } from './components/ScriptInput';
import type { VoiceoverOption } from './components/ScriptInput';

type ProductMode = 'auto' | 'manual';

export interface ProductAvatarSubmitData {
  actionId: 'product-avatar';
  mode: ProductMode;
  templateId?: string;
  avatarImageUrl: string;
  productImageUrl: string;
  scriptMode: 'text' | 'audio';
  scriptText?: string;
  audioUrl?: string;
  voiceoverId?: string;
}

export interface ProductAvatarModalProps {
  open: boolean;
  onClose: () => void;
  credits?: number;
  onSubmit: (data: ProductAvatarSubmitData) => void;
  onSelectFromBoard?: (context: 'product-image' | 'avatar-template') => void;
  templates?: AvatarTemplate[];
  categories?: AvatarCategory[];
  onCategoryChange?: (categoryId: string) => void;
  onLoadMoreTemplates?: () => void;
  hasMoreTemplates?: boolean;
  loadingTemplates?: boolean;
  voiceoverOptions?: VoiceoverOption[];
  initialProductImageUrl?: string;
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

const segBtn = (active: boolean): React.CSSProperties => ({
  flex: 1,
  height: 34,
  borderRadius: 8,
  border: active ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.06)',
  background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
  color: active ? '#fff' : 'rgba(255,255,255,0.4)',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 120ms ease',
});

export function ProductAvatarModal({
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
  initialProductImageUrl,
}: ProductAvatarModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<AvatarTemplate | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [productImageUrl, setProductImageUrl] = useState('');
  const [mode, setMode] = useState<ProductMode>('auto');
  const [scriptMode, setScriptMode] = useState<'text' | 'audio'>('text');
  const [scriptText, setScriptText] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [voiceoverId, setVoiceoverId] = useState(voiceoverOptions[0]?.id ?? '');
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? 'all');
  const [browsingTemplates, setBrowsingTemplates] = useState(false);
  const [hoverProduct, setHoverProduct] = useState(false);
  const productFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSelectedTemplate(null);
      setAvatarUrl('');
      setProductImageUrl(initialProductImageUrl ?? '');
      setMode('auto');
      setScriptMode('text');
      setScriptText('');
      setAudioUrl('');
      setVoiceoverId(voiceoverOptions[0]?.id ?? '');
      setActiveCategory(categories[0]?.id ?? 'all');
      setBrowsingTemplates(false);
      setHoverProduct(false);
    }
  }, [open, initialProductImageUrl, voiceoverOptions, categories]);

  const handleTemplateSelect = useCallback((tpl: AvatarTemplate) => {
    setSelectedTemplate(tpl);
    setAvatarUrl(tpl.thumbnailUrl);
    setBrowsingTemplates(false);
  }, []);

  const handleCategoryChange = useCallback(
    (id: string) => {
      setActiveCategory(id);
      onCategoryChange?.(id);
    },
    [onCategoryChange]
  );

  const handleProductFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProductImageUrl(URL.createObjectURL(file));
    e.target.value = '';
  }, []);

  const hasAvatar = !!avatarUrl;
  const hasProduct = !!productImageUrl;
  const hasScript = scriptMode === 'text' ? scriptText.trim().length > 0 : !!audioUrl;
  const canSubmit = hasAvatar && hasProduct && hasScript;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    onSubmit({
      actionId: 'product-avatar',
      mode,
      templateId: selectedTemplate?.id,
      avatarImageUrl: avatarUrl,
      productImageUrl,
      scriptMode,
      scriptText: scriptMode === 'text' ? scriptText : undefined,
      audioUrl: scriptMode === 'audio' ? audioUrl : undefined,
      voiceoverId: scriptMode === 'text' ? voiceoverId : undefined,
    });
  }, [canSubmit, onSubmit, mode, selectedTemplate, avatarUrl, productImageUrl, scriptMode, scriptText, audioUrl, voiceoverId]);

  return (
    <ImmersiveModal
      open={open}
      title="Product Avatar"
      subtitle="Create product explainer videos with AI avatars"
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
        ref={productFileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleProductFileSelect}
      />
      <div style={{ display: 'flex', gap: 24, flex: 1, minHeight: 0, marginTop: 24 }}>
        {/* Left panel */}
        <div
          style={{
            width: 320,
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
          {/* Avatar template */}
          <div>
            <span style={sectionLabel}>Avatar Template</span>
            {avatarUrl ? (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '3/4',
                  maxHeight: 240,
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: '#111',
                }}
              >
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setAvatarUrl('');
                    setSelectedTemplate(null);
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
                    backdropFilter: 'blur(4px)',
                    zIndex: 2,
                  }}
                >
                  <X size={14} />
                </button>
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '20px 10px 8px',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                    {selectedTemplate?.name || 'Avatar'}
                  </span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setBrowsingTemplates(true)}
                style={{
                  width: '100%',
                  height: 120,
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
                Select avatar template
              </button>
            )}
            <button
              type="button"
              onClick={() => setBrowsingTemplates(true)}
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
              <LayoutGrid size={13} />
              Browse Templates
            </button>
          </div>

          {/* Mode */}
          <div>
            <span style={sectionLabel}>Mode</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" onClick={() => setMode('auto')} style={segBtn(mode === 'auto')}>
                Auto
              </button>
              <button
                type="button"
                onClick={() => {}}
                style={{
                  ...segBtn(false),
                  opacity: 0.4,
                  cursor: 'not-allowed',
                }}
                title="Coming soon"
              >
                Manual
              </button>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.25)', lineHeight: '16px' }}>
              AI automatically places your product with the avatar
            </p>
          </div>
        </div>

        {/* Right panel — switches between product input and template browsing */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
          {browsingTemplates ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setBrowsingTemplates(false)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    border: 'none',
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 100ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  }}
                >
                  <ArrowLeft size={14} />
                </button>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                  Select Avatar Template
                </span>
              </div>
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
            </>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                flex: 1,
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.06) transparent',
              }}
            >
              {/* Product Image */}
              <div>
                <span style={sectionLabel}>Product Image</span>
                {productImageUrl ? (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: 400,
                      aspectRatio: '1',
                      borderRadius: 10,
                      overflow: 'hidden',
                      background: '#111',
                    }}
                  >
                    <img
                      src={productImageUrl}
                      alt="Product"
                      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (productImageUrl.startsWith('blob:')) URL.revokeObjectURL(productImageUrl);
                        setProductImageUrl('');
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
                  <div
                    style={{ position: 'relative', width: '100%', maxWidth: 400, aspectRatio: '1' }}
                    onMouseEnter={() => setHoverProduct(true)}
                    onMouseLeave={() => setHoverProduct(false)}
                  >
                    <button
                      type="button"
                      onClick={() => productFileRef.current?.click()}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: 10,
                        border: '1.5px dashed rgba(255,255,255,0.12)',
                        background: hoverProduct ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
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
                        borderColor: hoverProduct ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)',
                      }}
                    >
                      <CloudUpload size={28} style={{ opacity: 0.4 }} />
                      Upload product image
                    </button>
                    {onSelectFromBoard && (
                      <button
                        type="button"
                        onClick={() => onSelectFromBoard('product-image')}
                        style={{
                          position: 'absolute',
                          bottom: 12,
                          left: 12,
                          right: 12,
                          height: 36,
                          borderRadius: 8,
                          border: 'none',
                          background: 'rgba(0,0,0,0.85)',
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          cursor: 'pointer',
                          opacity: hoverProduct ? 1 : 0,
                          transform: hoverProduct ? 'translateY(0)' : 'translateY(4px)',
                          transition: 'all 150ms ease',
                          pointerEvents: hoverProduct ? 'auto' : 'none',
                        }}
                      >
                        <LayoutGrid size={14} />
                        Select from Board
                      </button>
                    )}
                  </div>
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
                  placeholder="Describe the product features..."
                  showVoiceover={voiceoverOptions.length > 0}
                  voiceoverOptions={voiceoverOptions}
                  selectedVoiceover={voiceoverId}
                  onVoiceoverChange={setVoiceoverId}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </ImmersiveModal>
  );
}
