import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronRight, Sparkles } from 'lucide-react';

const RESOURCE_HOST = 'https://d1735p3aqhycef.cloudfront.net';

const BADGE_COLORS: Record<string, string> = {
  HOT: '#f97316',
  NEW: '#6366f1',
  BETA: '#6b7280',
};

export interface VideoModel {
  id: string;
  name: string;
  badges: string[];
  tags: string[];
}

export interface VideoProvider {
  providerId: string;
  providerName: string;
  logoS3Path: string;
  models: VideoModel[];
}

interface VideoModelSelectorProps {
  providers: VideoProvider[];
  selectedModelId: string;
  onChange: (modelId: string) => void;
}

function getLogoUrl(s3Path: string): string {
  // Absolute URL or relative path (e.g. /model-logo/seedance.png) — use as-is
  if (s3Path.startsWith('http') || s3Path.startsWith('/')) return s3Path;
  return `${RESOURCE_HOST}/${s3Path}`;
}

function ProviderLogo({ s3Path, size = 24 }: { s3Path: string; size?: number }) {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return (
      <div style={{
        width: size, height: size, borderRadius: size / 4,
        background: 'rgba(255,255,255,0.08)',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Sparkles size={size * 0.55} style={{ opacity: 0.4 }} />
      </div>
    );
  }
  return (
    <img
      src={getLogoUrl(s3Path)}
      style={{ width: size, height: size, borderRadius: size / 4, objectFit: 'cover', flexShrink: 0 }}
      onError={() => setErrored(true)}
    />
  );
}

export function VideoModelSelector({ providers, selectedModelId, onChange }: VideoModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [activeProviderId, setActiveProviderId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Find selected model info for the trigger button
  const selectedProvider = providers.find(p => p.models.some(m => m.id === selectedModelId));
  const selectedModel = selectedProvider?.models.find(m => m.id === selectedModelId);
  const displayName = selectedModel?.name ?? selectedModelId;

  // When opening, default to the provider that contains the selected model
  const handleOpen = () => {
    setActiveProviderId(selectedProvider?.providerId ?? providers[0]?.providerId ?? null);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveProviderId(null);
      }
    };
    window.addEventListener('mousedown', handler, true);
    return () => window.removeEventListener('mousedown', handler, true);
  }, [open]);

  const activeProvider = providers.find(p => p.providerId === activeProviderId);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => open ? setOpen(false) : handleOpen()}
        style={{
          height: 32,
          padding: '0 8px',
          borderRadius: 6,
          border: 'none',
          background: open ? 'rgba(255,255,255,0.08)' : 'transparent',
          color: 'rgba(255,255,255,0.45)',
          fontSize: 12,
          lineHeight: '16px',
          fontWeight: 400,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          transition: 'background 100ms ease',
          whiteSpace: 'nowrap',
          maxWidth: 160,
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = 'transparent'; }}
      >
        {selectedProvider
          ? <ProviderLogo s3Path={selectedProvider.logoS3Path} size={16} />
          : <Sparkles size={14} style={{ opacity: 0.6, flexShrink: 0 }} />
        }
        <span style={{ color: '#fff', fontSize: 12, lineHeight: '16px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {displayName}
        </span>
      </button>

      {/* Dropdown — two columns: provider list (left) + model list (right) */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          display: 'flex',
          borderRadius: 12,
          background: '#1e1e1e',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
          zIndex: 30,
          overflow: 'hidden',
          height: 360, // Fixed height for consistency
        }}>
          {/* Left: provider list */}
          <div style={{
            width: 200,
            padding: '6px 4px',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            overflowY: 'auto',
            height: '100%',
          }}>
            {providers.map((provider) => {
              const isActive = provider.providerId === activeProviderId;
              return (
                <button
                  key={provider.providerId}
                  type="button"
                  onMouseEnter={() => setActiveProviderId(provider.providerId)}
                  onClick={() => setActiveProviderId(provider.providerId)}
                  style={{
                    width: '100%',
                    padding: '7px 8px',
                    border: 'none',
                    borderRadius: 8,
                    background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                    fontSize: 13,
                    fontWeight: isActive ? 500 : 400,
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    transition: 'background 80ms ease',
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <ProviderLogo s3Path={provider.logoS3Path} size={28} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {provider.providerName}
                  </span>
                  <ChevronRight size={14} style={{ opacity: 0.35, flexShrink: 0 }} />
                </button>
              );
            })}
          </div>

          {/* Right: model list for active provider */}
          {activeProvider && (
            <div style={{
              width: 280,
              padding: '6px 4px',
              overflowY: 'auto',
              height: '100%',
            }}>
              {activeProvider.models.map((model) => {
                const isSelected = model.id === selectedModelId;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => { onChange(model.id); setOpen(false); setActiveProviderId(null); }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: 'none',
                      borderRadius: 8,
                      background: isSelected ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: isSelected ? '#fff' : 'rgba(255,255,255,0.75)',
                      fontSize: 12,
                      fontWeight: isSelected ? 500 : 400,
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      transition: 'background 80ms ease',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? 'rgba(255,255,255,0.08)' : 'transparent'; }}
                  >
                    {/* Icon on left */}
                    <ProviderLogo s3Path={activeProvider.logoS3Path} size={32} />

                    {/* Content on right */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                      {/* Name row + badges + check */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
                        <span style={{ flexShrink: 0, fontWeight: 600 }}>{model.name}</span>
                        {model.badges.map((badge) => (
                          <span
                            key={badge}
                            style={{
                              padding: '1px 4px',
                              borderRadius: 3,
                              fontSize: 9,
                              fontWeight: 700,
                              lineHeight: '14px',
                              color: '#fff',
                              background: BADGE_COLORS[badge] ?? '#6b7280',
                              flexShrink: 0,
                              textTransform: 'uppercase',
                              letterSpacing: '0.02em',
                            }}
                          >
                            {badge}
                          </span>
                        ))}
                        {isSelected && (
                          <Check size={13} style={{ marginLeft: 'auto', color: '#fff', flexShrink: 0 }} />
                        )}
                      </div>
                      {/* Tags row */}
                      {model.tags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {model.tags.map((tag) => (
                            <span
                              key={tag}
                              style={{
                                padding: '1px 6px',
                                borderRadius: 4,
                                fontSize: 10,
                                lineHeight: '16px',
                                fontWeight: 400,
                                color: 'rgba(255,255,255,0.45)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                background: 'rgba(255,255,255,0.04)',
                                flexShrink: 0,
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
