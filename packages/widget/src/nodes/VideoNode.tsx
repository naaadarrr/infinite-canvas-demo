import React from 'react';
import { NodeProps } from '@xyflow/react';
import type { VideoNodeData } from '@tc/infinite-core';

export function VideoNode({ data, selected, dragging }: NodeProps) {
  const nodeData = data as unknown as VideoNodeData;
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
        backgroundColor: '#000',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 拖拽区域 - 顶部条 */}
      <div
        style={{
          height: '32px',
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '12px',
          color: '#fff',
          fontSize: '12px',
          flexShrink: 0,
        }}
      >
        🎬 视频
      </div>
      {/* 视频播放器容器 */}
      <div
        className="nodrag nopan nowheel"
        onPointerDownCapture={(e) => e.stopPropagation()}
        onMouseDownCapture={(e) => e.stopPropagation()}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <video
          src={nodeData.url}
          poster={nodeData.poster}
          autoPlay={nodeData.autoplay}
          loop={nodeData.loop}
          muted={nodeData.muted}
          controls
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
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
