import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export interface ImmersiveModalTab {
  id: string;
  label: string;
}

export interface ImmersiveModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  tabs?: ImmersiveModalTab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  footer?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;
}

const MODAL_PADDING = 24;
const MODAL_TOP_PADDING = 48;

export function ImmersiveModal({
  open,
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  footer,
  onClose,
  children,
  maxWidth = 1800,
}: ImmersiveModalProps) {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (open) {
      setAnimating(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      const timer = setTimeout(() => setAnimating(false), 180);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open && !animating) return null;

  const hasTabs = tabs && tabs.length > 1;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        padding: `${MODAL_TOP_PADDING}px ${MODAL_PADDING}px ${MODAL_PADDING}px ${MODAL_PADDING + 64}px`,
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 200ms ease',
        }}
      />

      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '84vw',
          minWidth: 300,
          maxWidth,
          borderRadius: 16,
          background: '#000000',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.96)',
          transition: 'opacity 200ms ease, transform 200ms ease',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 36, height: 36, borderRadius: 18, border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 100ms ease, color 100ms ease, border-color 100ms ease',
            zIndex: 10,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.16)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{
          padding: '32px 32px 16px',
          flexShrink: 0,
          textAlign: 'center',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: 32,
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 600,
            color: '#fff',
            lineHeight: '40px',
          }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{
              margin: '4px 0 0',
              fontSize: 13,
              color: 'rgba(255,255,255,0.4)',
              lineHeight: '18px',
            }}>
              {subtitle}
            </p>
          )}
          {hasTabs && (
            <div style={{
              display: 'flex',
              gap: 0,
              marginTop: 12,
              justifyContent: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              {tabs.map((tab) => {
                const isActive = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onTabChange?.(tab.id)}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      background: 'transparent',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 400,
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'color 120ms ease',
                    }}
                  >
                    {tab.label}
                    {isActive && (
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: '15%',
                        right: '15%',
                        height: 2,
                        borderRadius: 1,
                        background: '#fff',
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'hidden',
          padding: '0 32px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: '16px 32px 48px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexShrink: 0,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
