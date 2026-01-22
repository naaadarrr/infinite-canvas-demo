import React from 'react';
import { NodeProps } from '@xyflow/react';
import type { AudioNodeData } from '@tc/infinite-core';

export function AudioNode({ data, selected, dragging }: NodeProps) {
  const nodeData = data as unknown as AudioNodeData;
  const sizeLabel = `${nodeData.size.width} x ${nodeData.size.height}`;
  const showHighlight = selected || dragging;
  
  return (
    <div
      style={{
        width: nodeData.size.width,
        height: nodeData.size.height,
        position: 'relative',
        border: `2px solid ${showHighlight ? '#3b82f6' : '#ddd'}`,
        // borderRadius: '8px',
        padding: '16px',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* 可拖拽区域 - 标题和艺术家 */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#333',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          🎵 {nodeData.title || '音频文件'}
        </div>
        {nodeData.artist && (
          <div
            style={{
              fontSize: 12,
              color: '#666',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {nodeData.artist}
          </div>
        )}
      </div>
      {/* 音频控件 - 使用 nodrag 阻止拖拽 */}
      <div
        className="nodrag nopan nowheel"
        onPointerDownCapture={(e) => e.stopPropagation()}
        onMouseDownCapture={(e) => e.stopPropagation()}
      >
        <audio
          src={nodeData.url}
          autoPlay={nodeData.autoplay}
          loop={nodeData.loop}
          controls
          style={{
            width: '100%',
          }}
        />
      </div>
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
          }}
        >
          {sizeLabel}
        </div>
      )}
    </div>
  );
}
