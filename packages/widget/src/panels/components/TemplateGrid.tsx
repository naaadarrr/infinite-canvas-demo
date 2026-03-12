import React from 'react';

export interface TemplateItem {
  id: string;
  label: string;
  thumbnail: string;
}

interface TemplateGridProps {
  templates: TemplateItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  columns?: number;
  itemSize?: number;
}

export function TemplateGrid({
  templates,
  selectedId,
  onSelect,
  columns = 6,
  itemSize = 96,
}: TemplateGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 8,
      }}
    >
      {templates.map((tpl) => {
        const isSelected = tpl.id === selectedId;
        return (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onSelect(tpl.id)}
            title={tpl.label}
            style={{
              width: '100%',
              aspectRatio: '1',
              maxWidth: itemSize,
              borderRadius: 8,
              border: isSelected ? '2px solid #5857FD' : '2px solid transparent',
              background: '#2a2d32',
              cursor: 'pointer',
              overflow: 'hidden',
              padding: 0,
              transition: 'border-color 100ms ease, transform 100ms ease',
              transform: isSelected ? 'scale(1.02)' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            }}
            onMouseLeave={(e) => {
              if (!isSelected) e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <img
              src={tpl.thumbnail}
              alt={tpl.label}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
