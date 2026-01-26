import React from 'react';
import { NodeProps, useStore } from '@xyflow/react';
import type { VideoNodeData } from '@tc/infinite-core';
import { Paintbrush, RefreshCw, Shuffle } from 'lucide-react';
import { QuickActionToolbar, type QuickAction } from './QuickActionToolbar';
import { useToolbarVisibility } from './useToolbarVisibility';

export function VideoNode({ data, selected, dragging }: NodeProps) {
  const nodeData = data as unknown as VideoNodeData & {
    onNodeDataChange?: (id: string, patch: Partial<Omit<VideoNodeData, 'type'>>) => void;
  };
  const sizeLabel = `${nodeData.size.width} x ${nodeData.size.height}`;
  const showHighlight = selected || dragging;
  const showToolbar = useToolbarVisibility(selected, dragging);
  const zoom = useStore((state) => state.transform[2] ?? 1);
  const handleQuickAction = React.useCallback((_actionId: string) => {}, []);
  const quickActions: QuickAction[] = [
    { id: 'edit', label: 'Re-edit', icon: RefreshCw, onClick: () => handleQuickAction('edit') },
    { id: 'avatar', label: 'AI Avatar', icon: Paintbrush, onClick: () => handleQuickAction('avatar') },
    { id: 'upscale', label: 'Upscale', icon: Shuffle, onClick: () => handleQuickAction('upscale') },
  ];
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const scaleStateRef = React.useRef<{
    anchorX: number;
    anchorY: number;
    startDist: number;
    startWidth: number;
    startHeight: number;
    startPosX: number;
    startPosY: number;
    corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  } | null>(null);

  const handleScaleStart = (
    event: React.PointerEvent<HTMLDivElement>,
    corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const anchorX = corner.includes('left') ? rect.right : rect.left;
    const anchorY = corner.includes('top') ? rect.bottom : rect.top;
    const startDist = Math.hypot(event.clientX - anchorX, event.clientY - anchorY);

    scaleStateRef.current = {
      anchorX,
      anchorY,
      startDist,
      startWidth: nodeData.size.width,
      startHeight: nodeData.size.height,
      startPosX: nodeData.position.x,
      startPosY: nodeData.position.y,
      corner,
    };

    const handleMove = (moveEvent: PointerEvent) => {
      if (!scaleStateRef.current) {
        return;
      }
      const {
        anchorX,
        anchorY,
        startDist,
        startWidth,
        startHeight,
        startPosX,
        startPosY,
        corner: moveCorner,
      } = scaleStateRef.current;

      const currentDist = Math.hypot(moveEvent.clientX - anchorX, moveEvent.clientY - anchorY);
      const rawScaleFactor = currentDist / startDist;
      const minWidth = 160;
      const minHeight = 100;
      const minScaleFactor = Math.max(minWidth / startWidth, minHeight / startHeight, 0.1);
      const scaleFactor = Math.max(rawScaleFactor, minScaleFactor);

      const newWidth = Math.max(minWidth, startWidth * scaleFactor);
      const newHeight = Math.max(minHeight, startHeight * scaleFactor);

      let newPosX = startPosX;
      let newPosY = startPosY;

      if (moveCorner === 'bottom-right') {
        newPosX = startPosX;
        newPosY = startPosY;
      } else if (moveCorner === 'bottom-left') {
        newPosX = startPosX + (startWidth - newWidth);
        newPosY = startPosY;
      } else if (moveCorner === 'top-right') {
        newPosX = startPosX;
        newPosY = startPosY + (startHeight - newHeight);
      } else if (moveCorner === 'top-left') {
        newPosX = startPosX + (startWidth - newWidth);
        newPosY = startPosY + (startHeight - newHeight);
      }

      nodeData.onNodeDataChange?.(nodeData.id, {
        size: {
          width: Math.round(newWidth),
          height: Math.round(newHeight),
        },
        position: {
          x: newPosX,
          y: newPosY,
        },
      });
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      scaleStateRef.current = null;
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };
  
  return (
    <div
      ref={containerRef}
      style={{
        width: nodeData.size.width,
        height: nodeData.size.height,
        position: 'relative',
        border: `2px solid ${showHighlight ? '#3b82f6' : '#ddd'}`,
        // borderRadius: '8px',
        overflow: 'visible',
        backgroundColor: '#000',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {showHighlight && (
        <>
          {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((corner) => {
            const cursorStyle = (corner === 'top-left' || corner === 'bottom-right') ? 'nwse-resize' : 'nesw-resize';
            return (
              <div
                key={corner}
                className="nodrag"
                onPointerDown={(e) => handleScaleStart(e, corner)}
                style={{
                  position: 'absolute',
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  background: '#fff',
                  border: '2px solid #3b82f6',
                  cursor: cursorStyle,
                  left: corner.includes('left') ? -6 : 'auto',
                  right: corner.includes('right') ? -6 : 'auto',
                  top: corner.includes('top') ? -6 : 'auto',
                  bottom: corner.includes('bottom') ? -6 : 'auto',
                  zIndex: 2,
                }}
              />
            );
          })}
        </>
      )}
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
      {showToolbar && <QuickActionToolbar actions={quickActions} />}
      {showToolbar && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 'calc(100% + 5px)',
            transform: `translateX(-50%) scale(${1 / zoom})`,
            transformOrigin: 'bottom center',
            padding: '4px 8px',
            borderRadius: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            fontSize: 12,
            color: '#fff',
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
