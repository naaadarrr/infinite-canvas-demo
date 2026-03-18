import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface AvatarTemplate {
  id: string;
  name: string;
  thumbnailUrl: string;
  category?: string;
  isFavorite?: boolean;
  isCustom?: boolean;
  aspectRatio?: number;
}

export interface AvatarCategory {
  id: string;
  label: string;
  icon?: string;
}

interface AvatarTemplateGridProps {
  templates: AvatarTemplate[];
  selectedId: string | null;
  onSelect: (template: AvatarTemplate) => void;
  categories?: AvatarCategory[];
  activeCategory?: string;
  onCategoryChange?: (id: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  /** Allow categories to wrap into multiple rows (matches online reference) */
  categoryWrap?: boolean;
}

const SKELETON_COUNT = 12;

function TemplateCard({
  template,
  isSelected,
  loaded,
  ratio,
  onSelect,
  onImgLoad,
}: {
  template: AvatarTemplate;
  isSelected: boolean;
  loaded: boolean;
  ratio: number;
  onSelect: () => void;
  onImgLoad: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={(e) => {
        setHovered(true);
        if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
      }}
      onMouseLeave={(e) => {
        setHovered(false);
        if (!isSelected) e.currentTarget.style.borderColor = 'transparent';
      }}
      style={{
        display: 'block',
        width: '100%',
        padding: 0,
        marginBottom: 8,
        borderRadius: 8,
        border: isSelected ? '2px solid #3643FF' : '2px solid transparent',
        background: '#1a1a1a',
        cursor: 'pointer',
        overflow: 'hidden',
        breakInside: 'avoid',
        transition: 'border-color 100ms ease, transform 80ms ease',
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
        position: 'relative',
        aspectRatio: ratio > 0 ? `${ratio}` : undefined,
      }}
    >
      {!loaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255,255,255,0.04)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      )}
      <img
        src={template.thumbnailUrl}
        alt={template.name}
        loading="lazy"
        onLoad={onImgLoad}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 200ms ease, transform 200ms ease',
          transform: hovered ? 'scale(1.05)' : 'scale(1)',
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      {/* Hover overlay with "Use" button */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingBottom: 12,
          background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.6) 100%)',
          opacity: hovered ? 1 : 0,
          pointerEvents: 'none',
          transition: 'opacity 200ms ease',
        }}
      >
        <span
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            background: '#fff',
            color: '#1a1a1a',
            fontSize: 12,
            fontWeight: 500,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          Use
        </span>
      </div>
    </button>
  );
}

function SkeletonCard({ index }: { index: number }) {
  const heights = [180, 220, 160, 200, 240, 170, 210, 190, 230, 150, 200, 180];
  const h = heights[index % heights.length];
  return (
    <div
      style={{
        width: '100%',
        height: h,
        borderRadius: 8,
        background: 'rgba(255,255,255,0.04)',
        marginBottom: 8,
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  );
}

export function AvatarTemplateGrid({
  templates,
  selectedId,
  onSelect,
  categories,
  activeCategory,
  onCategoryChange,
  onLoadMore,
  hasMore,
  loading,
  categoryWrap = true,
}: AvatarTemplateGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [imgLoaded, setImgLoaded] = useState<Set<string>>(new Set());

  const handleImgLoad = useCallback((id: string) => {
    setImgLoaded((prev) => new Set(prev).add(id));
  }, []);

  useEffect(() => {
    if (!onLoadMore || !hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { root: scrollRef.current, rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore]);

  const hasCats = categories && categories.length > 0;
  const catScrollRef = useRef<HTMLDivElement>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Category pill bar */}
      {hasCats && (
        <div
          ref={catScrollRef}
          style={{
            display: 'flex',
            flexWrap: categoryWrap ? 'wrap' : 'nowrap',
            gap: 6,
            paddingBottom: 12,
            overflowX: categoryWrap ? 'visible' : 'auto',
            flexShrink: 0,
            scrollbarWidth: 'none',
          }}
        >
          {categories.map((cat) => {
            const isActive = cat.id === activeCategory;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategoryChange?.(cat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  height: 26,
                  padding: '0 10px',
                  borderRadius: 6,
                  border: isActive ? '1px solid #fff' : '1px solid rgba(255,255,255,0.2)',
                  background: isActive ? '#fff' : 'transparent',
                  color: isActive ? '#1a1a1a' : 'rgba(255,255,255,0.7)',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 120ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                  }
                }}
              >
                {cat.icon && <span style={{ fontSize: 13 }}>{cat.icon}</span>}
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Masonry grid */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.08) transparent',
        }}
      >
        {loading && templates.length === 0 ? (
          <div style={{ columns: 4, columnGap: 8 }}>
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <SkeletonCard key={i} index={i} />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 200,
              color: 'rgba(255,255,255,0.25)',
              fontSize: 13,
            }}
          >
            No templates found
          </div>
        ) : (
          <div style={{ columns: 4, columnGap: 8 }}>
            {templates.map((tpl) => {
              const isSelected = tpl.id === selectedId;
              const loaded = imgLoaded.has(tpl.id);
              const ratio = tpl.aspectRatio || 1;
              return (
                <TemplateCard
                  key={tpl.id}
                  template={tpl}
                  isSelected={isSelected}
                  loaded={loaded}
                  ratio={ratio}
                  onSelect={() => onSelect(tpl)}
                  onImgLoad={() => handleImgLoad(tpl.id)}
                />
              );
            })}
            {/* Sentinel for infinite scroll */}
            {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
            {/* Loading more skeletons */}
            {loading &&
              templates.length > 0 &&
              Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`more-${i}`} index={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}
