import React from 'react';
import { NodeToolbar, Position, useStore } from '@xyflow/react';
import { ImageIcon, VideoIcon, Music } from 'lucide-react';

const typeIcons: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  IMAGE: ImageIcon,
  VIDEO: VideoIcon,
  AUDIO: Music,
};

type NodeLabelBarProps = {
  isVisible: boolean;
  nodeType: string;
  label: string;
  sizeLabel: string;
  nodeWidth: number;
};

export function NodeLabelBar({ isVisible, nodeType, label, sizeLabel, nodeWidth }: NodeLabelBarProps) {
  const zoom = useStore((state) => state.transform[2] ?? 1);
  const Icon = typeIcons[nodeType.toUpperCase()] ?? ImageIcon;
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden', color: '#5857FD' }}>
          <Icon size={13} style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: showSize ? 150 : renderedWidth - 20 }}>{label}</span>
        </div>
        {showSize && (
          <div style={{ flexShrink: 0, color: 'rgba(88, 87, 253, 0.7)' }}>
            {sizeLabel}
          </div>
        )}
      </div>
    </NodeToolbar>
  );
}
