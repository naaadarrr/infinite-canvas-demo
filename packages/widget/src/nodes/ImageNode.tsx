import React from 'react';
import { Handle, NodeProps, NodeToolbar, Position, useStore } from '@xyflow/react';
import type { ImageNodeData, RawDataItem } from '@tc/infinite-core';
import { NodeType } from '@tc/infinite-core';
import { ArrowUpRight, CircleUser, Download, Paintbrush, RotateCw, Shuffle, Video } from 'lucide-react';
import { ExpandIcon } from '../icons';
import { QuickActionToolbar, type QuickAction } from './QuickActionToolbar';
import { NodeLabelBar } from './NodeLabelBar';
import { useToolbarVisibility, useLabelBarVisibility } from './useToolbarVisibility';
import { useNodeSelection } from './useNodeSelection';
import { createWidgetEvent, widgetBridge } from '../bridge';
import { MediaSkeleton } from './MediaSkeleton';

import { NodeRatingBadge } from './NodeRatingBadge';
import { useCanvasRole } from '../CanvasRoleContext';
import { useSelectMode } from '../SelectModeContext';
import { SelectionOverlay } from './components/SelectionOverlay';
import { useAiCreate } from '../AiCreateContext';
import { TextToImagePanel } from '../panels/TextToImagePanel';
import type { ImageToolTab } from '../panels/TextToImagePanel';
import { AIVideoPanel } from '../panels/AIVideoPanel';
import type { VideoToolTab } from '../panels/AIVideoPanel';
import { getToolLabel } from '../utils/toolLabels';

export function ImageNode({ data, selected, dragging }: NodeProps) {
  const role = useCanvasRole();
  const canEdit = role !== 'viewer';
  const canDeleteFailed = canEdit;
  
  // Select mode - 素材选择模式
  const selectMode = useSelectMode();
  // 判断节点是否可被选择（在选择模式下且 mediaType 匹配）
  // Widget 的 NodeType.IMAGE 对应宿主页面的 MediaType.IMAGE
  const nodeMediaType = NodeType.IMAGE.toLowerCase();
  const isSelectable = selectMode.isActive && selectMode.mediaType === nodeMediaType;
  const nodeData = data as unknown as ImageNodeData & {
    onNodeDataChange?: (id: string, patch: Partial<Omit<ImageNodeData, 'type'>>) => void;
  };
  // 使用 useStore 获取 React Flow 中的实际节点位置
  const nodePosition = useStore((state) => {
    const node = state.nodeLookup?.get(nodeData.id);
    return node?.position ?? nodeData.position;
  });
  const zoom = useStore((state) => state.transform[2] ?? 1);
  const selectedCount = useStore((state) => state.nodes.filter((n) => n.selected).length);
  const rawItem = (nodeData as ImageNodeData & { raw?: RawDataItem }).raw;
  const rawResult = rawItem?.result ?? undefined;
  const status = String(rawItem?.status ?? '').toLowerCase();
  const actualWidth =
    rawResult?.originImage?.width ?? rawResult?.compressedImage?.width ?? rawResult?.width;
  const actualHeight =
    rawResult?.originImage?.height ?? rawResult?.compressedImage?.height ?? rawResult?.height;
  const sizeLabel = `${Math.round(nodeData.size.width)} x ${Math.round(nodeData.size.height)}`;
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
  
  const [isHovered, setIsHovered] = React.useState(false);
  const { effectiveSelected, handlePointerDown: handleNodePointerDown } = useNodeSelection(selected, containerRef);
  
  const aiCreate = useAiCreate();

  const isSkeleton = status === 'init';
  const isFailed = status === 'fail';
  const isSuccess = status === 'success';
  const isPlaceholder = !nodeData.url && !rawItem;

  // Remix mode: existing (non-placeholder) node with aiCreateMode targeting it for image-edit
  const isRemixMode = !isPlaceholder && effectiveSelected && !dragging
    && aiCreate.aiCreateMode?.nodeId === nodeData.id
    && aiCreate.aiCreateMode?.subActionId === 'image-edit'
    && !!aiCreate.aiCreateMode?.referenceImageUrl;

  const showHighlight = (effectiveSelected || dragging) && !isPlaceholder;
  const showToolbar = useToolbarVisibility(effectiveSelected, dragging) && !isSkeleton && !isFailed && !isPlaceholder;
  const showLabelBar = useLabelBarVisibility(effectiveSelected) && !isSkeleton && !isFailed;

  const nodeScreenWidth = nodeData.size.width * zoom;
  const showAiPanel = (isPlaceholder || isRemixMode) && effectiveSelected && !dragging
    && aiCreate.aiCreateMode?.nodeId === nodeData.id
    && (aiCreate.aiCreateMode?.subActionId === 'text-to-image' || aiCreate.aiCreateMode?.subActionId === 'image-edit')
    && nodeScreenWidth < 1200;
  const showAiVideoPanel = !isPlaceholder && effectiveSelected && !dragging
    && aiCreate.aiCreateMode?.nodeId === nodeData.id
    && aiCreate.aiCreateMode?.type === 'ai-video';
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
  
  /**
   * 处理素材选择请求
   * 在选择模式下点击节点时触发，发送 NODE_SELECT_REQUEST 事件
   */
  const handleSelectRequest = React.useCallback(() => {
    const taskId = rawItem?.taskId;
    // 从 raw 数据中获取 URL 和 S3 Path
    const url = nodeData.url || rawItem?.result?.originImage?.url || rawItem?.result?.compressedImage?.url || '';
    const s3Path = rawItem?.result?.originImage?.filePath || rawItem?.result?.compressedImage?.filePath || '';
    
    widgetBridge.emit(
      createWidgetEvent(
        'NODE_SELECT_REQUEST',
        {
          nodeId: nodeData.id,
          nodeType: nodeData.type,
          taskId: taskId || '',
          url,
          s3Path,
        },
        { source: 'ui' }
      )
    );
  }, [nodeData.id, nodeData.type, nodeData.url, rawItem]);
  
  const handleRemix = React.useCallback(() => {
    const imageUrl = nodeData.url || rawItem?.result?.originImage?.url || rawItem?.result?.compressedImage?.url || '';
    if (imageUrl && aiCreate.enterRemixMode) {
      aiCreate.enterRemixMode(nodeData.id, imageUrl);
    } else {
      handleQuickAction('reference', 'Remix');
    }
  }, [nodeData.id, nodeData.url, rawItem, aiCreate, handleQuickAction]);

  const visibleActions = React.useMemo(() => [
    { id: 'reference', label: 'Remix', icon: Shuffle, onClick: handleRemix },
    { id: 'inpaint', label: 'Inpaint', icon: Paintbrush, onClick: () => handleQuickAction('inpaint', 'Inpaint') },
    { id: 'video', label: 'Generate Video', icon: Video, onClick: () => handleQuickAction('video', 'Generate Video') },
    { id: 'edit-angles', label: 'Edit Angles', icon: RotateCw, onClick: () => handleQuickAction('edit-angles', 'Edit Angles') },
    { id: 'avatar', label: 'AI Avatar', icon: CircleUser, onClick: () => handleQuickAction('avatar', 'AI Avatar') },
    { id: 'upscale', label: 'Upscale', icon: ArrowUpRight, onClick: () => handleQuickAction('upscale', 'Upscale'),
      dropdownItems: (() => {
        const imgW = actualWidth || Math.round(nodeData.size.width);
        const imgH = actualHeight || Math.round(nodeData.size.height);
        const imageUrl = nodeData.url || rawItem?.result?.originImage?.url || rawItem?.result?.compressedImage?.url || '';
        const resolutions: { value: string; label: string; scale: number; creditCost: number }[] = [
          { value: '1k', label: '1K', scale: 1, creditCost: 0.8 },
          { value: '2k', label: '2K', scale: 2, creditCost: 0.8 },
          { value: '4k', label: '4K', scale: 4, creditCost: 1.4 },
        ];
        return resolutions.map((r) => ({
          id: r.value,
          label: r.label,
          detail: `${imgW * r.scale}×${imgH * r.scale}`,
          creditCost: r.creditCost,
          onClick: () => {
            const { onNodeDataChange: _ignore, ...nodeSnapshot } = nodeData;
            widgetBridge.emit(
              createWidgetEvent(
                'NODE_QUICK_ACTION',
                {
                  nodeId: nodeData.id,
                  nodeType: nodeData.type,
                  actionId: 'upscale',
                  actionLabel: `Upscale ${r.label}`,
                  resolution: r.value,
                  imageUrl,
                  node: nodeSnapshot,
                },
                { source: 'ui' }
              )
            );
          },
        }));
      })(),
    },
    { id: 'download', label: 'Download', icon: Download, onClick: () => handleQuickAction('download', 'Download'), dividerBefore: true, iconOnly: true },
    { id: 'fullscreen', label: 'Full Screen', icon: ExpandIcon, onClick: () => handleQuickAction('fullscreen', 'Full Screen'), iconOnly: true },
  ], [handleQuickAction, handleRemix, actualWidth, actualHeight, nodeData, rawItem]);
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

      const newWidth = Math.round(Math.max(minWidth, startWidth * scaleFactor));
      const newHeight = Math.round(Math.max(minHeight, startHeight * scaleFactor));

      let newPosX = startPosX;
      let newPosY = startPosY;

      if (moveCorner === 'bottom-left') {
        newPosX = startPosX + (startWidth - newWidth);
      } else if (moveCorner === 'top-right') {
        newPosY = startPosY + (startHeight - newHeight);
      } else if (moveCorner === 'top-left') {
        newPosX = startPosX + (startWidth - newWidth);
        newPosY = startPosY + (startHeight - newHeight);
      }

      nodeData.onNodeDataChange?.(nodeData.id, {
        size: { width: newWidth, height: newHeight },
        position: { x: newPosX, y: newPosY },
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onPointerDown={handleNodePointerDown}
      style={{
        width: nodeData.size.width,
        height: nodeData.size.height,
        position: 'relative',
        border: 'none',
        borderRadius: 0,
        overflow: 'visible',
        backgroundColor: 'transparent',
        cursor: isSkeleton || isFailed ? 'default' : dragging ? 'move' : 'default',
        outline: (isPlaceholder && dragging)
          ? `${2 / zoom}px solid transparent`
          : effectiveSelected && !dragging
            ? (isFailed ? `${1 / zoom}px solid #ef4444` : `${1 / zoom}px solid #7781FF`)
            : isFailed
              ? `${1 / zoom}px solid #ef4444`
              : isHovered && !isPlaceholder
                ? `${1 / zoom}px solid rgba(119,129,255,0.7)`
                : `${1 / zoom}px solid transparent`,
        outlineOffset: 0,
        transition: 'outline-color 150ms ease',
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
      {isSuccess && showToolbar && (
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
          background: isPlaceholder ? '#1f1f1f' : '#1a1a1a',
          borderRadius: 0,
        }}
      >
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
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.15 }}
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
        )}
        {/* 素材选择模式遮罩 - 仅在选择模式下且任务成功时显示 */}
        <SelectionOverlay
          isVisible={isSelectable && isSuccess}
          onClick={handleSelectRequest}
        />
      </div>
      {showHighlight && !isPlaceholder && selectedCount <= 1 && !dragging && (
        <>
          {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((corner) => {
            const cursorStyle = (corner === 'top-left' || corner === 'bottom-right') ? 'nwse-resize' : 'nesw-resize';
            const handleSize = 8 / zoom;
            const handleOffset = -(handleSize / 2);
            return (
              <div
                key={corner}
                className="nodrag"
                onPointerDown={(e) => handleScaleStart(e, corner)}
                style={{
                  position: 'absolute',
                  left: corner.includes('left') ? handleOffset : 'auto',
                  right: corner.includes('right') ? handleOffset : 'auto',
                  top: corner.includes('top') ? handleOffset : 'auto',
                  bottom: corner.includes('bottom') ? handleOffset : 'auto',
                  width: handleSize,
                  height: handleSize,
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    background: '#fff',
                    border: '1px solid #7781FF',
                    cursor: cursorStyle,
                    boxSizing: 'border-box',
                    transform: `scale(${1 / zoom})`,
                    transformOrigin: '0 0',
                  }}
                />
              </div>
            );
          })}
        </>
      )}
      <NodeLabelBar
        isVisible={showLabelBar}
        nodeType={nodeData.type}
        label={rawItem?.title || 'Image'}
        sizeLabel={sizeLabel}
        nodeWidth={nodeData.size.width}
        toolLabel={undefined}
      />
      <QuickActionToolbar isVisible={showToolbar} actions={visibleActions} />
      {/* AI Create panel — rendered via NodeToolbar for proper zoom/pan tracking */}
      <NodeToolbar
        isVisible={showAiPanel}
        position={Position.Bottom}
        offset={8}
        align="center"
      >
        <TextToImagePanel
          inline
          width={480}
          initialTab={aiCreate.aiCreateMode?.subActionId as ImageToolTab}
          initialState={{
            prompt: aiCreate.aiCreateMode?.prompt ?? '',
            referenceImageUrl: aiCreate.aiCreateMode?.referenceImageUrl ?? '',
          }}
          credits={aiCreate.credits}
          onSubmit={aiCreate.onSubmit}
          onDismiss={aiCreate.onDismiss}
          onUploadReference={() => aiCreate.onUploadReference?.(nodeData.id)}
          onSelectFromBoard={() => aiCreate.onSelectFromBoard?.(nodeData.id)}
        />
      </NodeToolbar>
      {/* AI Video panel — shown when "Generate Video" is clicked on this image */}
      <NodeToolbar
        isVisible={showAiVideoPanel}
        position={Position.Bottom}
        offset={8}
        align="center"
      >
        <AIVideoPanel
          inline
          width={480}
          initialTab={aiCreate.aiCreateMode?.subActionId as VideoToolTab}
          initialState={{
            prompt: aiCreate.aiCreateMode?.prompt ?? '',
            firstFrameUrl: aiCreate.aiCreateMode?.referenceImageUrl ?? '',
          }}
          credits={aiCreate.credits}
          onSubmit={aiCreate.onVideoSubmit}
          onDismiss={aiCreate.onDismiss}
          onUploadFirstFrame={() => aiCreate.onUploadFirstFrame?.(nodeData.id)}
          onUploadEndFrame={() => aiCreate.onUploadEndFrame?.(nodeData.id)}
          onUploadMedia={() => aiCreate.onUploadMedia?.(nodeData.id)}
          onSelectFromBoard={() => aiCreate.onSelectFromBoard?.(nodeData.id)}
        />
      </NodeToolbar>
    </div>
  );
}
