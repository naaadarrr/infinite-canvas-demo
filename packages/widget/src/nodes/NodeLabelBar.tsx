import React from 'react';
import { NodeToolbar, Position, useStore } from '@xyflow/react';
import { Video, Music, Image } from 'lucide-react';

const typeIcons: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  IMAGE: Image,
  VIDEO: Video,
  AUDIO: Music,
};

type NodeLabelBarProps = {
  isVisible: boolean;
  nodeType: string;
  label: string;
  sizeLabel: string;
  nodeWidth: number;
  /** Tool name badge shown for placeholder / generating nodes */
  toolLabel?: string;
};

export function NodeLabelBar({ isVisible, nodeType, label, sizeLabel, nodeWidth, toolLabel }: NodeLabelBarProps) {
  const zoom = useStore((state) => state.transform[2] ?? 1);
  const Icon = typeIcons[nodeType.toUpperCase()] ?? Image;
  const renderedWidth = nodeWidth * zoom;
  const showSize = renderedWidth >= 150;

  return (
    <NodeToolbar
      isVisible={isVisible}
      position={Position.Top}
      offset={4}
      align="start"
    >
      <div
        style={{
          width: renderedWidth,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          lineHeight: '16px',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden', color: '#7781FF' }}>
          <Icon size={13} style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: showSize ? 120 : renderedWidth - 20 }}>{label}</span>
          {toolLabel && (
            <span
              style={{
                flexShrink: 0,
                fontSize: 10,
                fontWeight: 500,
                lineHeight: '16px',
                padding: '0 5px',
                borderRadius: 3,
                background: 'rgba(119,129,255,0.12)',
                color: 'rgba(119,129,255,0.7)',
              }}
            >
              {toolLabel}
            </span>
          )}
        </div>
        {showSize && (
          <div style={{ flexShrink: 0, color: '#7781FF' }}>
            {sizeLabel}
          </div>
        )}
      </div>
    </NodeToolbar>
  );
}
