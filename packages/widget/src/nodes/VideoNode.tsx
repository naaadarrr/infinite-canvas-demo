import React from 'react';
import { Handle, NodeProps, NodeToolbar, Position, useStore } from '@xyflow/react';
import type { RawDataItem, VideoNodeData } from '@tc/infinite-core';
import { ArrowUpRight, Download, RefreshCw, MicVocal, Play, Pause } from 'lucide-react';
import { ExpandIcon } from '../icons';
import { QuickActionToolbar, type QuickAction } from './QuickActionToolbar';
import { NodeLabelBar } from './NodeLabelBar';
import { useToolbarVisibility, useLabelBarVisibility } from './useToolbarVisibility';
import { useNodeSelection } from './useNodeSelection';
import { createWidgetEvent, widgetBridge } from '../bridge';
import { MediaSkeleton } from './MediaSkeleton';

import { NodeRatingBadge } from './NodeRatingBadge';
import { useCanvasRole } from '../CanvasRoleContext';
import { getToolLabel } from '../utils/toolLabels';
import { useAiCreate } from '../AiCreateContext';
import { AIVideoPanel } from '../panels/AIVideoPanel';
import type { VideoToolTab } from '../panels/AIVideoPanel';

export function VideoNode({ data, selected, dragging }: NodeProps) {
  const role = useCanvasRole();
  const canEdit = role !== 'viewer';
  const canDeleteFailed = canEdit;
  const nodeData = data as unknown as VideoNodeData & {
    onNodeDataChange?: (id: string, patch: Partial<Omit<VideoNodeData, 'type'>>) => void;
  };
  // 使用 useStore 获取 React Flow 中的实际节点位置
  const nodePosition = useStore((state) => {
    const node = state.nodeLookup?.get(nodeData.id);
    return node?.position ?? nodeData.position;
  });
  const zoom = useStore((state) => state.transform[2] ?? 1);
  const selectedCount = useStore((state) => state.nodes.filter((n) => n.selected).length);
  const rawItem = (nodeData as VideoNodeData & { raw?: RawDataItem }).raw;
  const status = String(rawItem?.status ?? '').toLowerCase();
  const rawResult = rawItem?.result ?? undefined;
  const actualWidth = rawResult?.originVideo?.width ?? rawResult?.originImage?.width ?? rawResult?.width;
  const actualHeight =
    rawResult?.originVideo?.height ?? rawResult?.originImage?.height ?? rawResult?.height;
  const sizeLabel = `${Math.round(nodeData.size.width)} x ${Math.round(nodeData.size.height)}`;
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [duration, setDuration] = React.useState<number>(0);
  // 节点在屏幕上的实际像素尺寸
  const screenW = nodeData.size.width * zoom;
  const screenH = nodeData.size.height * zoom;
  // 统一阈值：确保播放按钮（中心 32px）与时长标签（左下角 8px 边距，高 20px）同时显示时不重叠
  // 高度方向：播放按钮下边缘在 50%+16px，标签上边缘在 bottom 28px，需要 screenH/2 - 16 > 28 → screenH > 88
  // 宽度方向：标签约 50px，留足左侧空间，screenW > 120
  // 取更保守的值确保两者绝不重叠
  const showVideoOverlays = screenW >= 120 && screenH >= 120;
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const { effectiveSelected, handlePointerDown: handleNodePointerDown } = useNodeSelection(selected, containerRef);
  const [preloadProgress, setPreloadProgress] = React.useState(0);
  const [isPreloaded, setIsPreloaded] = React.useState(false);
  const isSkeleton = status === 'init';
  const isFailed = status === 'fail';
  const isSuccess = status === 'success';
  const isPlaceholder = !nodeData.url && !rawItem;

  const aiCreate = useAiCreate();
  const showAiVideoPanel = isPlaceholder && effectiveSelected && !dragging
    && aiCreate.aiCreateMode?.nodeId === nodeData.id
    && aiCreate.aiCreateMode?.type === 'ai-video';

  const showHighlight = (effectiveSelected || dragging) && !isPlaceholder;
  const showToolbar = useToolbarVisibility(effectiveSelected, dragging) && !isSkeleton && !isFailed && !isPlaceholder;
  const showLabelBar = useLabelBarVisibility(effectiveSelected) && !isSkeleton && !isFailed;
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
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
  const quickActions = React.useMemo(() => {
    const videoUrl = nodeData.url || rawItem?.result?.originVideo?.url || '';
    const resolutions: { value: string; label: string; detail: string; creditPerMin: number }[] = [
      { value: '1080p', label: '1080p', detail: '1920×1080', creditPerMin: 1 },
      { value: '2K',    label: '2K',    detail: '2560×1440', creditPerMin: 2 },
      { value: '4K',    label: '4K',    detail: '3840×2160', creditPerMin: 4 },
    ];
    return [
      { id: 'edit', label: 'Re-edit', icon: RefreshCw, onClick: () => handleQuickAction('edit', 'Re-edit') },
      { id: 'video-lip-sync', label: 'Lip Sync', icon: MicVocal, onClick: () => handleQuickAction('video-lip-sync', 'Lip Sync') },
      {
        id: 'upscale',
        label: 'Upscale',
        icon: ArrowUpRight,
        onClick: () => handleQuickAction('upscale', 'Upscale'),
        dropdownItems: resolutions.map((r) => ({
          id: r.value,
          label: r.label,
          detail: r.detail,
          creditCost: r.creditPerMin,
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
                  videoUrl,
                  node: nodeSnapshot,
                },
                { source: 'ui' }
              )
            );
          },
        })),
      },
    { id: 'download', label: 'Download', icon: Download, onClick: () => handleQuickAction('download', 'Download'), dividerBefore: true, iconOnly: true },
    { id: 'fullscreen', label: 'Full Screen', icon: ExpandIcon, onClick: () => handleQuickAction('fullscreen', 'Full Screen'), iconOnly: true },
    ];
  }, [handleQuickAction, actualWidth, actualHeight, nodeData, rawItem]);
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
      // 使用 React Flow 的实际位置，而不是 nodeData.position
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

  React.useEffect(() => {
    if (!nodeData.url) {
      setIsPlaying(false);
      return undefined;
    }

    const video = videoRef.current;
    if (!video) {
      return undefined;
    }

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
    };

    // Sync initial state for videos that mount after a task finishes.
    setIsPlaying(!video.paused && !video.ended);
    if (video.readyState >= 1 && video.duration && !isNaN(video.duration)) {
      setDuration(video.duration);
    }

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [nodeData.url]);

  // 视频预加载 - 获得URL后立即开始下载
  React.useEffect(() => {
    if (!nodeData.url) {
      setPreloadProgress(0);
      setIsPreloaded(false);
      return undefined;
    }

    // 使用 AbortController 支持取消
    const abortController = new AbortController();
    let cancelled = false;

    const preloadVideo = async () => {
      try {
        const response = await fetch(nodeData.url, {
          signal: abortController.signal,
          // 使用 cors 模式，如果服务器不支持则回退
          mode: 'cors',
          credentials: 'omit',
        });

        if (!response.ok || cancelled) {
          return;
        }

        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;

        if (!response.body) {
          // 如果没有 body stream，至少触发浏览器缓存
          setIsPreloaded(true);
          setPreloadProgress(100);
          return;
        }

        const reader = response.body.getReader();
        let receivedLength = 0;
        const chunks: BlobPart[] = [];

        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;

          chunks.push(value);
          receivedLength += value.length;

          // 更新进度
          if (total > 0) {
            setPreloadProgress(Math.round((receivedLength / total) * 100));
          } else {
            // 如果没有 content-length，使用估算进度
            setPreloadProgress(Math.min(90, Math.round(receivedLength / 10000)));
          }
        }

        if (!cancelled) {
          setIsPreloaded(true);
          setPreloadProgress(100);
          
          // 创建 Blob URL 并预热浏览器缓存（可选，但有助于即时播放）
          // 注意：这里不替换原 URL，只是确保数据已在内存中
          const blob = new Blob(chunks);
          // 触发浏览器内部缓存机制
          URL.createObjectURL(blob);
        }
      } catch (error) {
        if (!cancelled && (error as Error).name !== 'AbortError') {
          console.warn('[VideoNode] Preload failed, will use streaming:', error);
          // 预加载失败不影响正常播放，浏览器会在播放时流式加载
        }
      }
    };

    // 延迟一点开始预加载，避免阻塞渲染
    const timer = setTimeout(() => {
      void preloadVideo();
    }, 100);

    return () => {
      cancelled = true;
      abortController.abort();
      clearTimeout(timer);
    };
  }, [nodeData.url]);

  const togglePlayback = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (video.paused || video.ended) {
      void video.play();
    } else {
      video.pause();
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  
  const displayDuration = duration || rawResult?.originVideo?.duration || (rawResult as any)?.duration || 0;
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
        borderRadius: '2px',
        overflow: 'visible',
        backgroundColor: 'transparent',
        cursor: isSkeleton || isFailed ? 'default' : dragging ? 'grabbing' : 'grab',
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
      {showHighlight && selectedCount <= 1 && !dragging && (
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
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          background: '#1a1a1a',
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
              background: '#1a1a1a',
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600 }}>Failed to generate video</div>
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
        ) : isPlaceholder ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#1a1a1a',
              pointerEvents: 'none',
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="#fff"
              style={{ opacity: 0.12 }}
            >
              <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11.04-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14z" />
            </svg>
          </div>
        ) : nodeData.url ? (
          <>
            <video
              ref={videoRef}
              src={nodeData.url}
              poster={nodeData.poster}
              preload="auto"
              autoPlay={false}
              loop={nodeData.loop}
              muted={nodeData.muted}
              playsInline
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                pointerEvents: 'none',
              }}
            />
            {/* 预加载进度指示器 - 仅在未完成预加载且未播放时显示 */}
            {!isPreloaded && !isPlaying && preloadProgress > 0 && preloadProgress < 100 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  right: 8,
                  height: 3,
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${preloadProgress}%`,
                    backgroundColor: 'rgba(0, 255, 200, 0.8)',
                    borderRadius: 2,
                    transition: 'width 0.2s ease-out',
                    boxShadow: '0 0 6px rgba(0, 255, 200, 0.6)',
                  }}
                />
              </div>
            )}
            {/* 播放按钮 & 时长标签 - 统一阈值，同时出现/消失，确保不重叠 */}
            {showVideoOverlays && (
              <>
                <button
                  type="button"
                  className="nodrag nopan nowheel"
                  onClick={togglePlayback}
                  onPointerDown={(event) => event.stopPropagation()}
                  onMouseDown={(event) => event.stopPropagation()}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -50%) scale(${1 / zoom})`,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    border: 'none',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    cursor: 'pointer',
                    zIndex: 2,
                    opacity: !isPlaying || isHovered ? 1 : 0,
                    transition: 'opacity 0.2s ease',
                    pointerEvents: !isPlaying || isHovered ? 'auto' : 'none',
                  }}
                  aria-label={isPlaying ? 'Pause video' : 'Play video'}
                >
                  {isPlaying ? (
                    <Pause size={16} fill="currentColor" stroke="none" />
                  ) : (
                    <Play size={16} fill="currentColor" stroke="none" style={{ marginLeft: 2 }} />
                  )}
                </button>

                {displayDuration > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 8 / zoom,
                      bottom: 8 / zoom,
                      padding: '0 6px',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      backdropFilter: 'blur(4px)',
                      WebkitBackdropFilter: 'blur(4px)',
                      color: '#fff',
                      fontSize: 12,
                      lineHeight: '20px',
                      fontWeight: 500,
                      borderRadius: 4,
                      zIndex: 2,
                      pointerEvents: 'none',
                      transform: `scale(${1 / zoom})`,
                      transformOrigin: 'bottom left',
                    }}
                  >
                    {formatDuration(displayDuration)}
                  </div>
                )}
              </>
            )}
          </>
        ) : null}
      </div>
      <NodeLabelBar
        isVisible={showLabelBar}
        nodeType={nodeData.type}
        label={rawItem?.title || 'Video'}
        sizeLabel={sizeLabel}
        nodeWidth={nodeData.size.width}
        toolLabel={undefined}
      />
      <QuickActionToolbar isVisible={showToolbar} actions={quickActions} />
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
