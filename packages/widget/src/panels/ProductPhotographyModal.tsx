import React, { useCallback, useState } from 'react';
import { Upload, LayoutGrid, Crown, CloudUpload, RefreshCw, ChevronRight, Paintbrush } from 'lucide-react';
import { ImmersiveModal } from './ImmersiveModal';

// ── Categorized template data with generated placeholder thumbnails ──────────

interface TemplateCategoryData {
  id: string;
  label: string;
  items: { id: string; label: string; thumbnail: string }[];
}

function makePlaceholder(hue: number, sat: number, light: number, label: string): string {
  const bg = `hsl(${hue}, ${sat}%, ${light}%)`;
  const fg = light > 50 ? `hsl(${hue}, ${sat}%, ${Math.max(light - 35, 15)}%)` : `hsl(${hue}, ${Math.min(sat + 10, 80)}%, ${Math.min(light + 40, 85)}%)`;
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" rx="4" fill="${bg}"/><text x="60" y="66" text-anchor="middle" font-size="10" font-family="sans-serif" fill="${fg}">${label}</text></svg>`)}`;
}

const TEMPLATE_CATEGORIES: TemplateCategoryData[] = [
  {
    id: 'general', label: 'General Display',
    items: [
      { id: 'g1', label: 'Studio White', thumbnail: makePlaceholder(40, 8, 94, 'Studio') },
      { id: 'g2', label: 'Warm Light', thumbnail: makePlaceholder(35, 55, 65, 'Warm') },
      { id: 'g3', label: 'Soft Shadow', thumbnail: makePlaceholder(30, 15, 82, 'Shadow') },
      { id: 'g4', label: 'Golden Hour', thumbnail: makePlaceholder(38, 70, 58, 'Golden') },
      { id: 'g5', label: 'Cream Tone', thumbnail: makePlaceholder(42, 30, 88, 'Cream') },
      { id: 'g6', label: 'Amber Glow', thumbnail: makePlaceholder(30, 65, 52, 'Amber') },
      { id: 'g7', label: 'Ivory', thumbnail: makePlaceholder(45, 12, 92, 'Ivory') },
      { id: 'g8', label: 'Candle Light', thumbnail: makePlaceholder(28, 60, 48, 'Candle') },
      { id: 'g9', label: 'Honey', thumbnail: makePlaceholder(40, 72, 55, 'Honey') },
      { id: 'g10', label: 'Champagne', thumbnail: makePlaceholder(48, 25, 80, 'Champagne') },
      { id: 'g11', label: 'Peach', thumbnail: makePlaceholder(20, 50, 75, 'Peach') },
      { id: 'g12', label: 'Terracotta', thumbnail: makePlaceholder(15, 55, 50, 'Terracotta') },
      { id: 'g13', label: 'Sienna', thumbnail: makePlaceholder(18, 60, 42, 'Sienna') },
      { id: 'g14', label: 'Caramel', thumbnail: makePlaceholder(32, 58, 48, 'Caramel') },
      { id: 'g15', label: 'Rust', thumbnail: makePlaceholder(12, 65, 40, 'Rust') },
    ],
  },
  {
    id: 'fabric', label: 'Fabric & Velvet',
    items: [
      { id: 'f1', label: 'Silk White', thumbnail: makePlaceholder(0, 0, 95, 'Silk') },
      { id: 'f2', label: 'Linen Beige', thumbnail: makePlaceholder(38, 25, 72, 'Linen') },
      { id: 'f3', label: 'Velvet Red', thumbnail: makePlaceholder(0, 55, 35, 'Velvet') },
      { id: 'f4', label: 'Satin Gold', thumbnail: makePlaceholder(45, 65, 55, 'Satin') },
      { id: 'f5', label: 'Cashmere', thumbnail: makePlaceholder(30, 18, 78, 'Cashmere') },
      { id: 'f6', label: 'Blush Pink', thumbnail: makePlaceholder(340, 40, 80, 'Blush') },
      { id: 'f7', label: 'Champagne Silk', thumbnail: makePlaceholder(42, 30, 82, 'Champ.') },
      { id: 'f8', label: 'Ivory Drape', thumbnail: makePlaceholder(48, 15, 90, 'Drape') },
      { id: 'f9', label: 'Mocha Suede', thumbnail: makePlaceholder(25, 35, 45, 'Suede') },
      { id: 'f10', label: 'Dusty Rose', thumbnail: makePlaceholder(350, 30, 65, 'Rose') },
      { id: 'f11', label: 'Taupe', thumbnail: makePlaceholder(30, 15, 55, 'Taupe') },
      { id: 'f12', label: 'Burgundy', thumbnail: makePlaceholder(345, 50, 30, 'Burgundy') },
      { id: 'f13', label: 'Olive Cloth', thumbnail: makePlaceholder(80, 30, 40, 'Olive') },
      { id: 'f14', label: 'Navy Fabric', thumbnail: makePlaceholder(220, 45, 28, 'Navy') },
    ],
  },
  {
    id: 'home', label: 'Home Life',
    items: [
      { id: 'h1', label: 'Kitchen Counter', thumbnail: makePlaceholder(30, 10, 85, 'Kitchen') },
      { id: 'h2', label: 'Bathroom Shelf', thumbnail: makePlaceholder(200, 8, 88, 'Bath') },
      { id: 'h3', label: 'Wooden Table', thumbnail: makePlaceholder(28, 45, 42, 'Wood') },
      { id: 'h4', label: 'Bookshelf', thumbnail: makePlaceholder(25, 30, 38, 'Shelf') },
      { id: 'h5', label: 'Window Sill', thumbnail: makePlaceholder(50, 12, 90, 'Window') },
      { id: 'h6', label: 'Cozy Corner', thumbnail: makePlaceholder(35, 25, 55, 'Cozy') },
      { id: 'h7', label: 'Plant Shelf', thumbnail: makePlaceholder(120, 35, 45, 'Plant') },
      { id: 'h8', label: 'Bedside', thumbnail: makePlaceholder(30, 15, 75, 'Bedside') },
      { id: 'h9', label: 'Desk Setup', thumbnail: makePlaceholder(210, 10, 50, 'Desk') },
      { id: 'h10', label: 'Fireplace', thumbnail: makePlaceholder(15, 50, 35, 'Fire') },
      { id: 'h11', label: 'Dining', thumbnail: makePlaceholder(35, 20, 65, 'Dining') },
      { id: 'h12', label: 'Living Room', thumbnail: makePlaceholder(40, 12, 70, 'Living') },
    ],
  },
  {
    id: 'water', label: 'Water Elements',
    items: [
      { id: 'w1', label: 'Ocean Blue', thumbnail: makePlaceholder(200, 60, 50, 'Ocean') },
      { id: 'w2', label: 'Pool Aqua', thumbnail: makePlaceholder(185, 55, 60, 'Pool') },
      { id: 'w3', label: 'Splash', thumbnail: makePlaceholder(195, 50, 65, 'Splash') },
      { id: 'w4', label: 'Rain Drops', thumbnail: makePlaceholder(210, 35, 55, 'Rain') },
      { id: 'w5', label: 'Underwater', thumbnail: makePlaceholder(200, 65, 35, 'Under') },
      { id: 'w6', label: 'Ice Crystal', thumbnail: makePlaceholder(195, 25, 85, 'Ice') },
      { id: 'w7', label: 'Teal Wave', thumbnail: makePlaceholder(175, 50, 45, 'Teal') },
      { id: 'w8', label: 'Mist', thumbnail: makePlaceholder(200, 15, 80, 'Mist') },
      { id: 'w9', label: 'Deep Sea', thumbnail: makePlaceholder(215, 60, 25, 'Deep') },
      { id: 'w10', label: 'Coral Reef', thumbnail: makePlaceholder(180, 45, 55, 'Coral') },
      { id: 'w11', label: 'Lagoon', thumbnail: makePlaceholder(170, 55, 50, 'Lagoon') },
      { id: 'w12', label: 'Dewdrop', thumbnail: makePlaceholder(140, 30, 70, 'Dew') },
    ],
  },
  {
    id: 'sand', label: 'Sand & Rocks',
    items: [
      { id: 'r1', label: 'Beach Sand', thumbnail: makePlaceholder(42, 40, 72, 'Sand') },
      { id: 'r2', label: 'Desert Dune', thumbnail: makePlaceholder(38, 55, 62, 'Dune') },
      { id: 'r3', label: 'Marble White', thumbnail: makePlaceholder(0, 0, 90, 'Marble') },
      { id: 'r4', label: 'Slate Gray', thumbnail: makePlaceholder(210, 8, 45, 'Slate') },
      { id: 'r5', label: 'Granite', thumbnail: makePlaceholder(0, 0, 55, 'Granite') },
      { id: 'r6', label: 'Sandstone', thumbnail: makePlaceholder(30, 35, 60, 'Stone') },
      { id: 'r7', label: 'Pebbles', thumbnail: makePlaceholder(25, 12, 65, 'Pebble') },
      { id: 'r8', label: 'Concrete', thumbnail: makePlaceholder(0, 0, 62, 'Concrete') },
      { id: 'r9', label: 'Obsidian', thumbnail: makePlaceholder(240, 10, 18, 'Obsidian') },
      { id: 'r10', label: 'Terracotta Tile', thumbnail: makePlaceholder(15, 50, 48, 'Tile') },
      { id: 'r11', label: 'Clay', thumbnail: makePlaceholder(20, 40, 55, 'Clay') },
    ],
  },
  {
    id: 'creative', label: 'Creative Photography',
    items: [
      { id: 'c1', label: 'Neon Glow', thumbnail: makePlaceholder(280, 70, 30, 'Neon') },
      { id: 'c2', label: 'Gradient Sunset', thumbnail: makePlaceholder(15, 75, 55, 'Sunset') },
      { id: 'c3', label: 'Holographic', thumbnail: makePlaceholder(300, 50, 65, 'Holo') },
      { id: 'c4', label: 'Smoke', thumbnail: makePlaceholder(0, 0, 25, 'Smoke') },
      { id: 'c5', label: 'Sparkle', thumbnail: makePlaceholder(50, 60, 50, 'Sparkle') },
      { id: 'c6', label: 'Galaxy', thumbnail: makePlaceholder(260, 55, 20, 'Galaxy') },
      { id: 'c7', label: 'Prism', thumbnail: makePlaceholder(320, 45, 60, 'Prism') },
      { id: 'c8', label: 'Aurora', thumbnail: makePlaceholder(160, 55, 40, 'Aurora') },
      { id: 'c9', label: 'Retro Film', thumbnail: makePlaceholder(40, 40, 50, 'Retro') },
      { id: 'c10', label: 'Pop Art', thumbnail: makePlaceholder(350, 70, 55, 'Pop') },
      { id: 'c11', label: 'Cyberpunk', thumbnail: makePlaceholder(290, 65, 35, 'Cyber') },
      { id: 'c12', label: 'Bokeh', thumbnail: makePlaceholder(45, 30, 40, 'Bokeh') },
    ],
  },
];

const SAMPLE_PRODUCTS = [
  { id: 's1', url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="8" fill="%23f5f0eb"/><text x="40" y="44" text-anchor="middle" font-size="28">🧴</text></svg>', label: 'Serum' },
  { id: 's2', url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="8" fill="%23fce4ec"/><text x="40" y="44" text-anchor="middle" font-size="28">💄</text></svg>', label: 'Lipstick' },
  { id: 's3', url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="8" fill="%23e8d5c4"/><text x="40" y="44" text-anchor="middle" font-size="28">👜</text></svg>', label: 'Handbag' },
  { id: 's4', url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="8" fill="%23e0f2fe"/><text x="40" y="44" text-anchor="middle" font-size="28">🧪</text></svg>', label: 'Bottle' },
];

type BgMode = 'image' | 'prompt';

export interface ProductPhotoState {
  productImageUrl: string;
  productMaskDataUrl?: string;
  backgroundPrompt: string;
  backgroundImageUrl: string;
  selectedTemplateId: string;
  ratio: string;
}

const DEFAULT_STATE: ProductPhotoState = {
  productImageUrl: '',
  productMaskDataUrl: undefined,
  backgroundPrompt: '',
  backgroundImageUrl: '',
  selectedTemplateId: '',
  ratio: '1:1',
};

interface ProductPhotographyModalProps {
  open: boolean;
  nodeId: string;
  initialState?: Partial<ProductPhotoState>;
  credits?: number;
  onSubmit: (state: ProductPhotoState) => void;
  onClose: () => void;
  onUploadProduct?: () => void;
  onUploadBackground?: () => void;
  onSelectFromBoard?: () => void;
}

// ── Horizontal-scroll category row ──────────────────────────────────────────

function TemplateCategoryRow({
  category,
  selectedId,
  onSelect,
}: {
  category: TemplateCategoryData;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 8, padding: '0 2px',
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
          {category.label}
        </span>
        <button
          type="button"
          style={{
            border: 'none', background: 'transparent', padding: '2px 0',
            color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 500,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2,
            transition: 'color 100ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
        >
          More <ChevronRight size={12} />
        </button>
      </div>
      <div style={{
        display: 'flex', gap: 6, overflowX: 'auto',
        paddingBottom: 4,
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255,255,255,0.08) transparent',
      }}>
        {category.items.map((item) => {
          const isSelected = item.id === selectedId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              title={item.label}
              style={{
                width: 64, height: 64, flexShrink: 0,
                borderRadius: 6, padding: 0,
                border: isSelected ? '2px solid #ffffff' : '2px solid transparent',
                background: '#2c2c2c', cursor: 'pointer',
                overflow: 'hidden',
                transition: 'border-color 100ms ease, transform 80ms ease',
                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <img
                src={item.thumbnail} alt={item.label}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main modal ──────────────────────────────────────────────────────────────

export function ProductPhotographyModal({
  open,
  nodeId,
  initialState,
  credits = 25,
  onSubmit,
  onClose,
  onUploadProduct,
  onUploadBackground,
  onSelectFromBoard,
}: ProductPhotographyModalProps) {
  const [state, setState] = useState<ProductPhotoState>(() => ({
    ...DEFAULT_STATE,
    ...initialState,
  }));
  type BgSourceMode = 'templates' | 'upload' | 'board';

  const [bgMode, setBgMode] = useState<BgMode>('image');
  const [bgSource, setBgSource] = useState<BgSourceMode>('templates');
  const [hoverProduct, setHoverProduct] = useState(false);

  React.useEffect(() => {
    if (initialState) {
      setState(prev => ({ ...prev, ...initialState }));
    }
  }, [initialState]);

  const update = useCallback(<K extends keyof ProductPhotoState>(key: K, value: ProductPhotoState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const hasProduct = state.productImageUrl !== '';
  const hasBg = bgMode === 'image'
    ? (state.backgroundImageUrl !== '' || state.selectedTemplateId !== '')
    : state.backgroundPrompt.trim() !== '';
  const canSubmit = hasProduct && hasBg;

  const handleSubmit = useCallback((_withWatermark?: boolean) => {
    if (!canSubmit) return;
    onSubmit(state);
  }, [canSubmit, onSubmit, state]);

  const sectionLabel: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)',
    display: 'block', marginBottom: 12,
  };

  const tabBtnStyle = (mode: BgMode): React.CSSProperties => ({
    flex: 1,
    height: 36,
    borderRadius: 8,
    border: 'none',
    background: bgMode === mode ? 'rgba(255,255,255,0.08)' : 'transparent',
    color: bgMode === mode ? '#fff' : 'rgba(255,255,255,0.35)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    transition: 'all 120ms ease',
  });

  const selectedTemplateThumbnail = state.selectedTemplateId
    ? TEMPLATE_CATEGORIES.flatMap(c => c.items).find(t => t.id === state.selectedTemplateId)?.thumbnail
    : undefined;

  return (
    <ImmersiveModal
      open={open}
      title="Product Photography"
      onClose={onClose}
      maxWidth={1800}
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%' }}>
          <button
            type="button"
            onClick={() => canSubmit && handleSubmit(false)}
            style={{
              height: 40, width: 400, padding: '0 24px', borderRadius: 12, border: 'none',
              fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'all 120ms ease',
              background: canSubmit ? '#3643FF' : 'rgba(255,255,255,0.08)',
              color: canSubmit ? '#fff' : 'rgba(255,255,255,0.4)',
              cursor: canSubmit ? 'pointer' : 'default',
            }}
          >
            <span>Generate</span>
            <div style={{ width: 1, height: 16, background: canSubmit ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Crown size={16} color={canSubmit ? '#facc15' : 'currentColor'} />
              <span>{credits}</span>
            </div>
          </button>
        </div>
      }
    >
      {/* ── Two-column layout (form) ── */}
      <div style={{
        display: 'flex', gap: 28, flex: 1, minHeight: 0,
      }}>

          {/* ── LEFT: Product Image ── */}
          <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={sectionLabel}>Product Image</span>

            {state.productImageUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  position: 'relative', width: '100%', aspectRatio: '1',
                  borderRadius: 12, overflow: 'hidden', background: '#111',
                  backgroundImage: 'repeating-linear-gradient(45deg, #222 25%, transparent 25%, transparent 75%, #222 75%, #222), repeating-linear-gradient(45deg, #222 25%, #1a1a1a 25%, #1a1a1a 75%, #222 75%, #222)',
                  backgroundPosition: '0 0, 10px 10px',
                  backgroundSize: '20px 20px',
                }}>
                  <img
                    src={state.productImageUrl} alt="Product"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', transform: 'scale(0.65)' }}
                  />

                  {/* Mock Yellow Bounding Box */}
                  <div style={{
                    position: 'absolute',
                    top: '17.5%', left: '17.5%', right: '17.5%', bottom: '17.5%',
                    border: '1.5px solid #facc15',
                    pointerEvents: 'none',
                  }}>
                    {/* Corners */}
                    <div style={{ position: 'absolute', top: -5, left: -5, width: 10, height: 10, background: '#fff', borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', top: -5, right: -5, width: 10, height: 10, background: '#fff', borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', bottom: -5, left: -5, width: 10, height: 10, background: '#fff', borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', bottom: -5, right: -5, width: 10, height: 10, background: '#fff', borderRadius: '50%' }} />
                    {/* Rotate Handle */}
                    <div style={{ position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)', width: 20, height: 20, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <RefreshCw size={12} color="#000" />
                    </div>
                    <div style={{ position: 'absolute', top: -18, left: '50%', width: 1.5, height: 18, background: '#facc15' }} />
                  </div>

                  <button
                    type="button"
                    onClick={() => update('productImageUrl', '')}
                    style={{
                      position: 'absolute', top: 8, right: 8,
                      width: 28, height: 28, borderRadius: 8,
                      background: 'rgba(0,0,0,0.6)', border: 'none',
                      color: '#fff', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 600, backdropFilter: 'blur(8px)',
                      zIndex: 10,
                    }}
                  >
                    ×
                  </button>
                  {/* Manually mask: shown when ProductPhotography is added */}
                </div>

                {/* Ratios */}
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                  {['9:16', '3:4', '1:1', '4:3', '16:9'].map((r) => (
                    <button
                      key={r}
                      onClick={() => update('ratio', r)}
                      style={{
                        flex: 1, height: 32, borderRadius: 6,
                        background: state.ratio === r ? 'rgba(255,255,255,0.1)' : 'transparent',
                        border: `1px solid ${state.ratio === r ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
                        color: state.ratio === r ? '#fff' : 'rgba(255,255,255,0.5)',
                        fontSize: 12, cursor: 'pointer',
                        transition: 'all 120ms ease',
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div
                style={{ position: 'relative', width: '100%', aspectRatio: '1' }}
                onMouseEnter={() => setHoverProduct(true)}
                onMouseLeave={() => setHoverProduct(false)}
              >
                <button
                  type="button"
                  onClick={() => onUploadProduct?.()}
                  style={{
                    width: '100%', height: '100%',
                    borderRadius: 12, border: '1.5px dashed rgba(255,255,255,0.15)',
                    background: hoverProduct ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                    color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 12,
                    fontSize: 13, fontWeight: 500,
                    transition: 'background 120ms ease, border-color 120ms ease',
                    borderColor: hoverProduct ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
                  }}
                >
                  <CloudUpload size={28} style={{ opacity: 0.5 }} />
                  <span>Upload Image</span>
                </button>
                
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onSelectFromBoard?.(); }}
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
              </div>
            )}

            {!state.productImageUrl && (
              <div>
                <span style={{
                  fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.35)',
                  display: 'block', marginBottom: 8,
                }}>
                  Quick start with examples:
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {SAMPLE_PRODUCTS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => update('productImageUrl', s.url)}
                      style={{
                        width: 56, height: 56, borderRadius: 12, padding: 0,
                        border: state.productImageUrl === s.url ? '2px solid #ffffff' : '2px solid transparent',
                        background: '#2c2c2c', cursor: 'pointer',
                        overflow: 'hidden', flexShrink: 0,
                        transition: 'border-color 100ms ease, transform 100ms ease',
                        transform: state.productImageUrl === s.url ? 'scale(1.04)' : 'scale(1)',
                      }}
                      onMouseEnter={(e) => {
                        if (state.productImageUrl !== s.url) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        if (state.productImageUrl !== s.url) e.currentTarget.style.borderColor = 'transparent';
                      }}
                    >
                      <img src={s.url} alt={s.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Background ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
            <span style={sectionLabel}>Background</span>

            {/* BG mode tabs — text-only, reference style */}
            <div style={{
              display: 'flex', gap: 0, padding: 3,
              borderRadius: 12, background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <button type="button" onClick={() => setBgMode('image')} style={tabBtnStyle('image')}>
                Image Background
              </button>
              <button type="button" onClick={() => setBgMode('prompt')} style={tabBtnStyle('prompt')}>
                Prompt Background
              </button>
            </div>

            {/* BG content */}
            {bgMode === 'image' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minHeight: 0 }}>
                {/* Selected background preview (only for uploaded/board images) */}
                {state.backgroundImageUrl && (
                  <div style={{
                    position: 'relative', width: '100%', height: 100,
                    borderRadius: 12, overflow: 'hidden', background: '#111', flexShrink: 0,
                  }}>
                    <img
                      src={state.backgroundImageUrl}
                      alt="Background"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    <button
                      type="button"
                      onClick={() => { update('backgroundImageUrl', ''); }}
                      style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 24, height: 24, borderRadius: 6,
                        background: 'rgba(0,0,0,0.6)', border: 'none',
                        color: '#fff', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 600, backdropFilter: 'blur(8px)',
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Source tabs — pill style like Components/Snippets reference */}
                <div style={{
                  display: 'flex', gap: 0, flexShrink: 0,
                  borderRadius: 12, background: 'rgba(255,255,255,0.04)', padding: 3,
                }}>
                  {([
                    { key: 'templates' as BgSourceMode, icon: <LayoutGrid size={13} />, label: 'Templates' },
                    { key: 'upload' as BgSourceMode, icon: <Upload size={13} />, label: 'Upload' },
                    { key: 'board' as BgSourceMode, icon: <LayoutGrid size={13} />, label: 'From Board' },
                  ]).map((tab) => {
                    const isActive = bgSource === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => {
                          setBgSource(tab.key);
                        }}
                        style={{
                          flex: 1, height: 32, borderRadius: 8, border: 'none',
                          background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                          color: isActive ? '#fff' : 'rgba(255,255,255,0.35)',
                          fontSize: 12, fontWeight: 500, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                          transition: 'all 120ms ease',
                        }}
                      >
                        {tab.icon}
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Content area based on active source tab */}
                <div style={{
                  flex: 1, overflowY: 'auto', minHeight: 0,
                  paddingTop: 4,
                }}>
                  {bgSource === 'templates' && TEMPLATE_CATEGORIES.map((cat) => (
                    <TemplateCategoryRow
                      key={cat.id}
                      category={cat}
                      selectedId={state.selectedTemplateId}
                      onSelect={(id) => {
                        update('selectedTemplateId', id);
                        update('backgroundImageUrl', '');
                      }}
                    />
                  ))}

                  {bgSource === 'upload' && (
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 12, flex: 1, minHeight: 200,
                      borderRadius: 12, border: '1.5px dashed rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.03)', cursor: 'pointer',
                      transition: 'all 120ms ease',
                    }}
                      onClick={() => onUploadBackground?.()}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    >
                      <CloudUpload size={32} style={{ opacity: 0.4 }} color="#fff" />
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>
                        Click to upload background image
                      </span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
                        JPG, PNG, WebP supported
                      </span>
                    </div>
                  )}

                  {bgSource === 'board' && (
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
                    }}>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          style={{
                            aspectRatio: '1', borderRadius: 12, overflow: 'hidden',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 120ms ease',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                          onClick={() => onSelectFromBoard?.()}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                            <circle cx="9" cy="9" r="2" />
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                          </svg>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <textarea
                  placeholder="Describe the background you want to generate..."
                  value={state.backgroundPrompt}
                  onChange={(e) => update('backgroundPrompt', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && canSubmit) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  autoFocus={bgMode === 'prompt'}
                  rows={6}
                  style={{
                    width: '100%', flex: 1,
                    padding: '12px 14px', borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                    color: '#fff', fontSize: 13, lineHeight: '1.6',
                    resize: 'none', fontFamily: 'inherit', outline: 'none',
                    boxSizing: 'border-box', minHeight: 140,
                  }}
                />
              </div>
            )}
          </div>
        </div>

    </ImmersiveModal>
  );
}
