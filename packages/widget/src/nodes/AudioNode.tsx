import React from 'react';
import { Handle, NodeProps, Position } from '@xyflow/react';
import type { AudioNodeData, RawDataItem } from '@tc/infinite-core';
import { Info, RefreshCw } from 'lucide-react';
import { QuickActionToolbar, type QuickAction } from './QuickActionToolbar';
import { useToolbarVisibility } from './useToolbarVisibility';
import { createWidgetEvent, widgetBridge } from '../bridge';
import { MediaSkeleton } from './MediaSkeleton';
import { useDependencyFocus } from './DependencyFocusContext';
import { NodeRatingBadge } from './NodeRatingBadge';

export function AudioNode({ data, selected, dragging }: NodeProps) {
  const nodeData = data as unknown as AudioNodeData & {
    onNodeDataChange?: (id: string, patch: Partial<Omit<AudioNodeData, 'type'>>) => void;
  };
  const rawItem = (nodeData as AudioNodeData & { raw?: RawDataItem }).raw;
  const status = String(rawItem?.status ?? '').toLowerCase();
  const isSkeleton = status === 'init';
  const isFailed = status === 'fail';
  const isSuccess = status === 'success';
  const showHighlight = selected || dragging;
  const showToolbar = useToolbarVisibility(selected, dragging) && !isSkeleton && !isFailed;
  const { activeNodeId, toggleNode } = useDependencyFocus();
  const isDependencyFocus = activeNodeId === nodeData.id;
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
  const handleRatingChange = React.useCallback(
    (nextRating: number) => {
      const { onNodeDataChange: _ignore, ...nodeSnapshot } = nodeData;
      nodeData.onNodeDataChange?.(nodeData.id, { rating: nextRating } as any);
      widgetBridge.emit(
        createWidgetEvent(
          'NODE_QUICK_ACTION',
          {
            nodeId: nodeData.id,
            nodeType: nodeData.type,
            actionId: 'rating',
            actionLabel: 'Rating',
            rating: nextRating,
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
    {
      id: 'dependency',
      label: 'Related Nodes',
      icon: Info,
      onClick: () => toggleNode(nodeData.id),
      active: isDependencyFocus,
    },
  ];
  const handleDelete = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      nodeData.onNodeDataChange?.(nodeData.id, { _delete: true } as any);
    },
    [nodeData]
  );
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
        border: `2px solid ${isFailed ? '#ef4444' : showHighlight ? '#3b82f6' : '#ddd'}`,
        // borderRadius: '8px',
        overflow: 'visible',
        padding: isSkeleton || isFailed ? 0 : '16px',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <Handle
        id="dep-source"
        type="source"
        position={Position.Top}
        style={{ opacity: 0, pointerEvents: 'none' }}
      />
      <Handle
        id="dep-target"
        type="target"
        position={Position.Bottom}
        style={{ opacity: 0, pointerEvents: 'none' }}
      />
      {isSuccess && (
        <NodeRatingBadge
          rating={(nodeData as any).rating ?? rawItem?.rating}
          onChange={handleRatingChange}
        />
      )}
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
      {isFailed ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            textAlign: 'center',
            padding: 16,
            color: '#b91c1c',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600 }}>Failed to generate audio</div>
          <button
            type="button"
            onClick={handleDelete}
            onPointerDown={(event) => event.stopPropagation()}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid #ef4444',
              background: '#fee2e2',
              color: '#b91c1c',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              pointerEvents: 'auto',
            }}
          >
            Delete
          </button>
        </div>
      ) : isSkeleton ? (
        <MediaSkeleton />
      ) : (
        <>
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
        </>
      )}
      {showToolbar && <QuickActionToolbar actions={quickActions} />}
    </div>
  );
}
