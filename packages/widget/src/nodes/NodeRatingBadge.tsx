import React from 'react';
import { Star } from 'lucide-react';

type NodeRatingBadgeProps = {
  rating?: number | null;
  max?: number;
  onChange?: (nextRating: number) => void;
};

export function NodeRatingBadge({ rating, max = 3, onChange }: NodeRatingBadgeProps) {
  const [hovered, setHovered] = React.useState(false);
  const normalized = Math.max(0, Math.min(max, Math.round(typeof rating === 'number' ? rating : 0)));

  return (
    <div
      className="nodrag nopan nowheel"
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute',
        left: 6,
        top: 6,
        zIndex: 4,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: 0,
        borderRadius: 0,
        backgroundColor: 'transparent',
        border: 'none',
        color: '#fff',
        userSelect: 'none',
      }}
      aria-label={`Rating ${normalized} of ${max}`}
    >
      <div style={{ display: 'flex', gap: 2 }}>
        {Array.from({ length: max }).map((_, index) => {
          const active = normalized >= index + 1;
          return (
            <button
              key={`star_${index}`}
              type="button"
              onClick={() => {
                if (!onChange) {
                  return;
                }
                const next = index + 1 === normalized ? 0 : index + 1;
                onChange(next);
              }}
              onPointerDown={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              aria-label={`Rate ${index + 1}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                border: 'none',
                background: 'transparent',
                cursor: onChange ? 'pointer' : 'default',
                color: 'inherit',
              }}
            >
              <Star
                size={12}
                color={active ? '#f59e0b' : 'rgba(255, 255, 255, 0.45)'}
                fill={active ? '#f59e0b' : 'none'}
              />
            </button>
          );
        })}
      </div>
      {hovered && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '100%',
            marginTop: 8,
            padding: '6px 10px',
            borderRadius: 6,
            backgroundColor: '#1f2937',
            color: '#fff',
            fontSize: 12,
            whiteSpace: 'nowrap',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
            zIndex: 10,
          }}
        >
          Shortcut: 1 / 2 / 3 to rate, 0 to clear
        </div>
      )}
    </div>
  );
}
