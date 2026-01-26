import React from 'react';
import { NodeProps } from '@xyflow/react';
import type { AudioNodeData } from '@tc/infinite-core';
import { RefreshCw } from 'lucide-react';
import { QuickActionToolbar, type QuickAction } from './QuickActionToolbar';
import { useToolbarVisibility } from './useToolbarVisibility';
import { createWidgetEvent, widgetBridge } from '../bridge';

export function AudioNode({ data, selected, dragging }: NodeProps) {
  const nodeData = data as unknown as AudioNodeData & {
    onNodeDataChange?: (id: string, patch: Partial<Omit<AudioNodeData, 'type'>>) => void;
  };
  const showHighlight = selected || dragging;
  const showToolbar = useToolbarVisibility(selected, dragging);
  const handleQuickAction = React.useCallback(
    (actionId: string, actionLabel: string) => {
      const { onNodeDataChange: _ignore, ...nodeSnapshot } = nodeData;
      widgetBridge.emit(
        createWidgetEvent(
          'NODE_QUICK_ACTION',
          {
            nodeId: nodeData.id,
            nodeType: nodeData.type,
            actionId,
            actionLabel,
            node: nodeSnapshot,
          },
          { source: 'ui' }
        )
      );
    },
    [nodeData]
  );
  const quickActions: QuickAction[] = [
    { id: 'edit', label: 'Re-edit', icon: RefreshCw, onClick: () => handleQuickAction('edit', 'Re-edit') },
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
      const minWidth = 120;
      const minHeight = 80;
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
        padding: '16px',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
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
      {showToolbar && <QuickActionToolbar actions={quickActions} />}
    </div>
  );
}
