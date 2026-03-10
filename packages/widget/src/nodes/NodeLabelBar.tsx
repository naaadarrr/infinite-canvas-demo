import React from 'react';
import { NodeToolbar, Position, useStore } from '@xyflow/react';
import { VideoIcon, Music } from 'lucide-react';

function FilledImageIcon({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <rect x="2" y="3" width="20" height="18" rx="3" fill="currentColor" opacity="0.35" />
      <circle cx="8.5" cy="9.5" r="2" fill="currentColor" />
      <path d="M22 16l-5.5-6L10 17.5 7.5 15 2 21h17a3 3 0 003-3v-2z" fill="currentColor" />
    </svg>
  );
}

const typeIcons: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  IMAGE: FilledImageIcon,
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
          <div style={{ flexShrink: 0, color: '#5857FD' }}>
            {sizeLabel}
          </div>
        )}
      </div>
    </NodeToolbar>
  );
}
