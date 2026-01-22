import React from 'react';
import { NodeProps } from '@xyflow/react';
import type { ImageNodeData } from '@tc/infinite-core';

export function ImageNode({ data, selected, dragging }: NodeProps) {
  const nodeData = data as unknown as ImageNodeData;
  const sizeLabel = `${nodeData.size.width} x ${nodeData.size.height}`;
  
  // 使用 React Flow 原生的 selected 和 dragging 状态
  const showHighlight = selected || dragging;
  
  return (
    <div
      style={{
        width: nodeData.size.width,
        height: nodeData.size.height,
        position: 'relative',
        border: `2px solid ${showHighlight ? '#3b82f6' : '#ddd'}`,
        // borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#fff',
      }}
    >
      <img
        src={nodeData.url}
        alt={nodeData.alt || 'Image'}
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          pointerEvents: 'none',
        }}
      />
      {showHighlight && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: -28,
            transform: 'translateX(-50%)',
            padding: '4px 8px',
            // borderRadius: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            // border: '1px solid #3b82f6',
            outline: '1px solid #3b82f6',
            outlineOffset: '-1px',
            fontSize: 12,
            color: '#1f2937',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        >
          {sizeLabel}
        </div>
      )}
    </div>
  );
}
