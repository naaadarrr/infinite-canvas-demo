import React from 'react';
import { Handle, NodeProps, Position, useStore } from '@xyflow/react';
import type { ImageNodeData, RawDataItem } from '@tc/infinite-core';
import { Info, Paintbrush, RefreshCw, Shuffle, Type, Video } from 'lucide-react';
import { QuickActionToolbar, type QuickAction } from './QuickActionToolbar';
import { useToolbarVisibility } from './useToolbarVisibility';
import { createWidgetEvent, widgetBridge } from '../bridge';
import { MediaSkeleton } from './MediaSkeleton';
import { useDependencyFocus } from './DependencyFocusContext';
import { NodeRatingBadge } from './NodeRatingBadge';
import { useCanvasRole } from '../CanvasRoleContext';

export function ImageNode({ data, selected, dragging }: NodeProps) {
  const role = useCanvasRole();
  const canEdit = role !== 'viewer';
  const canDeleteFailed = canEdit;
  const nodeData = data as unknown as ImageNodeData & {
    onNodeDataChange?: (id: string, patch: Partial<Omit<ImageNodeData, 'type'>>) => void;
  };
  // 使用 useStore 获取 React Flow 中的实际节点位置
  const nodePosition = useStore((state) => {
    const node = state.nodeLookup?.get(nodeData.id);
    return node?.position ?? nodeData.position;
  });
  const rawItem = (nodeData as ImageNodeData & { raw?: RawDataItem }).raw;
  const rawResult = rawItem?.result ?? undefined;
  const status = String(rawItem?.status ?? '').toLowerCase();
  const actualWidth =
    rawResult?.originImage?.width ?? rawResult?.compressedImage?.width ?? rawResult?.width;
  const actualHeight =
    rawResult?.originImage?.height ?? rawResult?.compressedImage?.height ?? rawResult?.height;
  const sizeLabel =
    typeof actualWidth === 'number' && typeof actualHeight === 'number'
      ? `${Math.round(actualWidth)} x ${Math.round(actualHeight)}`
      : `${Math.round(nodeData.size.width)} x ${Math.round(nodeData.size.height)}`;
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
  
  // 使用 React Flow 原生的 selected 和 dragging 状态
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
  // 构建快捷操作菜单 - 根据 toolType 过滤 Re-edit 按钮
  const quickActions: QuickAction[] = React.useMemo(() => {
    const actions: QuickAction[] = [];
    
    // Re-edit 按钮 - 仅当 toolType 不是 "user-upload" 时显示
    if (rawItem?.toolType !== 'user-upload') {
      actions.push({
        id: 'edit',
        label: 'Re-edit',
        icon: RefreshCw,
        onClick: () => handleQuickAction('edit', 'Re-edit'),
      });
    }
    
    // 以下按钮始终显示（不受 toolType 影响）
    actions.push(
      {
        id: 'reference',
        label: 'Remix',
        icon: Shuffle,
        onClick: () => handleQuickAction('reference', 'Remix'),
      },
      {
        id: 'inpaint',
        label: 'Inpaint',
        icon: Paintbrush,
        onClick: () => handleQuickAction('inpaint', 'Inpaint'),
      },
      {
        id: 'video',
        label: 'Generate Video',
        icon: Video,
        onClick: () => handleQuickAction('video', 'Generate Video'),
      },
      {
        id: 'ocr',
        label: 'Edit Image Text',
        icon: Type,
        onClick: () => handleQuickAction('ocr', 'Edit Image Text'),
      },
      {
        id: 'dependency',
        label: 'Related Nodes',
        icon: Info,
        onClick: () => toggleNode(nodeData.id),
        active: isDependencyFocus,
      }
    );
    
    return actions;
  }, [rawItem?.toolType, handleQuickAction, toggleNode, nodeData.id, isDependencyFocus]);
  const handleDelete = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!canDeleteFailed) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      nodeData.onNodeDataChange?.(nodeData.id, { _delete: true } as any);
    },
    [canDeleteFailed, nodeData]
  );

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
      // 使用 React Flow 的实际位置，而不是 nodeData.position
      // 这样可以避免在拖动后立即拉伸时位置跳回旧值
      startPosX: nodePosition.x,
      startPosY: nodePosition.y,
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
      const minWidth = 80;
      const minHeight = 60;
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
        border: `2px solid ${isFailed ? '#ef4444' : showHighlight ? '#3b82f6' : 'transparent'}`,
        borderRadius: '2px',
        overflow: 'visible',
        backgroundColor: 'transparent',
      }}
    >
      {/* 顶部/底部依赖连接点 */}
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
      {/* 左侧依赖连接点（用于 firstFrame） */}
      <Handle
        id="dep-source-left"
        type="source"
        position={Position.Left}
        style={{ opacity: 0, pointerEvents: 'none' }}
      />
      <Handle
        id="dep-target-left"
        type="target"
        position={Position.Left}
        style={{ opacity: 0, pointerEvents: 'none' }}
      />
      {/* 右侧依赖连接点（用于 lastFrame） */}
      <Handle
        id="dep-source-right"
        type="source"
        position={Position.Right}
        style={{ opacity: 0, pointerEvents: 'none' }}
      />
      <Handle
        id="dep-target-right"
        type="target"
        position={Position.Right}
        style={{ opacity: 0, pointerEvents: 'none' }}
      />
      {isSuccess && (
        <NodeRatingBadge
          rating={(nodeData as any).rating ?? rawItem?.rating}
          onChange={canEdit ? handleRatingChange : undefined}
        />
      )}
      <div
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* 动画背景层 - 始终存在，被内容覆盖 */}
        {!isFailed && (
          <>
            <style>
              {`
                @keyframes image-node-stripe {
                  0% { background-position: 0 0; }
                  100% { background-position: 60px 60px; }
                }
                @keyframes image-node-glow {
                  0% { filter: hue-rotate(0deg) brightness(1); }
                  50% { filter: hue-rotate(60deg) brightness(1.2); }
                  100% { filter: hue-rotate(0deg) brightness(1); }
                }
              `}
            </style>
            {/* 霓虹条纹动画背景 */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: '#1a1a1a',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `repeating-linear-gradient(
                    45deg,
                    rgba(0, 255, 255, 0.12) 0px,
                    rgba(0, 255, 255, 0.12) 10px,
                    rgba(255, 0, 255, 0.12) 10px,
                    rgba(255, 0, 255, 0.12) 20px,
                    rgba(0, 255, 128, 0.12) 20px,
                    rgba(0, 255, 128, 0.12) 30px,
                    rgba(255, 128, 0, 0.10) 30px,
                    rgba(255, 128, 0, 0.10) 40px,
                    rgba(128, 0, 255, 0.12) 40px,
                    rgba(128, 0, 255, 0.12) 50px,
                    rgba(0, 128, 255, 0.12) 50px,
                    rgba(0, 128, 255, 0.12) 60px
                  )`,
                  backgroundSize: '84.85px 84.85px',
                  animation: 'image-node-stripe 1.5s linear infinite, image-node-glow 4s ease-in-out infinite',
                }}
              />
              {/* 磨砂玻璃遮罩 */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(30, 30, 30, 0.5)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                }}
              />
            </div>
          </>
        )}
        
        {/* 内容层 */}
        {isFailed ? (
          <div
            style={{
              position: 'relative',
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
              background: '#1a1a1a',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600 }}>Failed to generate image</div>
          {canDeleteFailed && (
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
          )}
        </div>
        ) : isSkeleton ? (
          <MediaSkeleton />
        ) : nodeData.url ? (
          <img
            src={nodeData.url}
            alt={nodeData.alt || 'Image'}
            draggable={false}
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              pointerEvents: 'none',
            }}
          />
        ) : null}
      </div>
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
      {showToolbar && <QuickActionToolbar actions={quickActions} />}
      {showToolbar && (
        <div className="tc-node-size-badge">
          {sizeLabel}
        </div>
      )}
    </div>
  );
}
