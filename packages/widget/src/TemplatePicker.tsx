import React from 'react';
import { createWidgetEvent, widgetBridge } from './bridge';
import { Maximize2, Minimize2 } from 'lucide-react';

export interface TemplateItem {
  id: string;
  name: string;
  thumbnailUrl: string;
  category: 'image' | 'video';
}

export type TemplatePickerProps = {
  open: boolean;
  onClose: () => void;
  sidebarOffset?: number;
  expanded?: boolean;
  onExpandToggle?: () => void;
};

const PANEL_BG = '#1c1e22';
const PANEL_BORDER = 'rgba(255,255,255,0.08)';
const PANEL_SHADOW = '0 8px 32px rgba(0,0,0,0.4)';

const DEMO_TEMPLATES: TemplateItem[] = [
  { id: 'tpl-1', name: 'UGC Creator', thumbnailUrl: '', category: 'image' },
  { id: 'tpl-2', name: 'Fashion Rise Motion', thumbnailUrl: '', category: 'video' },
  { id: 'tpl-3', name: 'Cinematic Blockbuster', thumbnailUrl: '', category: 'video' },
  { id: 'tpl-4', name: 'Music Production MV', thumbnailUrl: '', category: 'video' },
  { id: 'tpl-5', name: 'Model Clothing Video', thumbnailUrl: '', category: 'video' },
  { id: 'tpl-6', name: 'E-commerce Video Maker', thumbnailUrl: '', category: 'video' },
  { id: 'tpl-7', name: 'Product Showcase', thumbnailUrl: '', category: 'image' },
  { id: 'tpl-8', name: 'Social Media Post', thumbnailUrl: '', category: 'image' },
  { id: 'tpl-9', name: 'Brand Identity', thumbnailUrl: '', category: 'image' },
];

export function TemplatePicker({ open, onClose, sidebarOffset = 0, expanded = false, onExpandToggle }: TemplatePickerProps) {
  const [activeTab, setActiveTab] = React.useState<'image' | 'video'>('image');
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open, onClose]);

  React.useEffect(() => {
    if (open) {
      widgetBridge.emit(
        createWidgetEvent('CANVAS_REQUEST_TEMPLATES', { category: activeTab }, { source: 'ui' })
      );
    }
  }, [open, activeTab]);

  if (!open) return null;

  const filteredTemplates = DEMO_TEMPLATES.filter((t) => t.category === activeTab);

  const handleTemplateClick = (templateId: string) => {
    widgetBridge.emit(
      createWidgetEvent('CANVAS_APPLY_TEMPLATE', { templateId, category: activeTab }, { source: 'ui' })
    );
    onClose();
  };

  const handleExpand = () => {
    if (onExpandToggle) {
      onExpandToggle();
    } else {
      widgetBridge.emit(
        createWidgetEvent('CANVAS_OPEN_TEMPLATES_FULL', { category: activeTab }, { source: 'ui' })
      );
    }
  };

  const panelStyle: React.CSSProperties = expanded
    ? {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '80vw',
        maxWidth: 960,
        height: '70vh',
        maxHeight: 680,
        zIndex: 100,
        borderRadius: 20,
        background: PANEL_BG,
        border: `1px solid ${PANEL_BORDER}`,
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        pointerEvents: 'auto',
      }
    : {
        position: 'absolute',
        bottom: 62,
        left: `calc(50% + ${sidebarOffset / 2}px)`,
        transform: 'translateX(-50%)',
        width: 480,
        maxHeight: 420,
        zIndex: 25,
        borderRadius: 16,
        background: PANEL_BG,
        border: `1px solid ${PANEL_BORDER}`,
        boxShadow: PANEL_SHADOW,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        pointerEvents: 'auto',
      };

  return (
    <>
      {expanded && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
          }}
          onClick={onClose}
        />
      )}
      <div
        ref={panelRef}
        onPointerDown={(e) => e.stopPropagation()}
        style={panelStyle}
      >
      {/* Header with tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px 0',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', gap: 20 }}>
          {(['image', 'video'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #fff' : '2px solid transparent',
                padding: '0 0 10px',
                color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.4)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'color 120ms ease',
                textTransform: 'capitalize',
              }}
            >
              {tab === 'image' ? 'Image' : 'Video'}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleExpand}
          aria-label="Expand"
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: 'none',
            background: 'transparent',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 120ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
        >
          {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

      {/* Grid */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 12,
          display: 'grid',
          gridTemplateColumns: expanded ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)',
          gap: 12,
          alignContent: 'start',
        }}
      >
        {filteredTemplates.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => handleTemplateClick(tpl.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              textAlign: 'left',
              borderRadius: 12,
              overflow: 'hidden',
              transition: 'transform 150ms ease, opacity 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.opacity = '1'; }}
          >
            <div
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: 12,
                background: tpl.thumbnailUrl
                  ? `url(${tpl.thumbnailUrl}) center/cover no-repeat`
                  : 'rgba(255,255,255,0.06)',
                marginBottom: 6,
              }}
            />
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.8)',
                lineHeight: '16px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {tpl.name}
            </div>
          </button>
        ))}
        {filteredTemplates.length === 0 && (
          <div
            style={{
              gridColumn: '1 / -1',
              padding: '40px 0',
              textAlign: 'center',
              color: 'rgba(255,255,255,0.3)',
              fontSize: 13,
            }}
          >
            No templates available
          </div>
        )}
      </div>
      </div>
    </>
  );
}
