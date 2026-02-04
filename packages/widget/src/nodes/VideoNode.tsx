import React from 'react';
import { Handle, NodeProps, Position, useStore } from '@xyflow/react';
import type { RawDataItem, VideoNodeData } from '@tc/infinite-core';
import { Info, Paintbrush, RefreshCw, Shuffle, Play, Pause } from 'lucide-react';
import { QuickActionToolbar, type QuickAction } from './QuickActionToolbar';
import { useToolbarVisibility } from './useToolbarVisibility';
import { createWidgetEvent, widgetBridge } from '../bridge';
import { MediaSkeleton } from './MediaSkeleton';
import { useDependencyFocus } from './DependencyFocusContext';
import { NodeRatingBadge } from './NodeRatingBadge';
import { useCanvasRole } from '../CanvasRoleContext';

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
  const rawItem = (nodeData as VideoNodeData & { raw?: RawDataItem }).raw;
  const status = String(rawItem?.status ?? '').toLowerCase();
  const rawResult = rawItem?.result ?? undefined;
  const actualWidth = rawResult?.originVideo?.width ?? rawResult?.originImage?.width ?? rawResult?.width;
  const actualHeight =
    rawResult?.originVideo?.height ?? rawResult?.originImage?.height ?? rawResult?.height;
  const sizeLabel =
    typeof actualWidth === 'number' && typeof actualHeight === 'number'
      ? `${Math.round(actualWidth)} x ${Math.round(actualHeight)}`
      : `${Math.round(nodeData.size.width)} x ${Math.round(nodeData.size.height)}`;
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [preloadProgress, setPreloadProgress] = React.useState(0);
  const [isPreloaded, setIsPreloaded] = React.useState(false);
  const isSkeleton = status === 'init';
  const isFailed = status === 'fail';
  const isSuccess = status === 'success';
  const showHighlight = selected || dragging;
  const showToolbar = useToolbarVisibility(selected, dragging) && !isSkeleton && !isFailed;
  const { activeNodeId, toggleNode } = useDependencyFocus();
  const isDependencyFocus = activeNodeId === nodeData.id;
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
        id: 'avatar',
        label: 'AI Avatar',
        icon: Paintbrush,
        onClick: () => handleQuickAction('avatar', 'AI Avatar'),
      },
      {
        id: 'upscale',
        label: 'Upscale',
        icon: Shuffle,
        onClick: () => handleQuickAction('upscale', 'Upscale'),
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
    const video = videoRef.current;
    if (!video) {
      return undefined;
    }

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

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
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* 动画背景层 - 始终存在，被内容覆盖 */}
        {!isFailed && (
          <>
            <style>
              {`
                @keyframes video-node-stripe {
                  0% { background-position: 0 0; }
                  100% { background-position: 60px 60px; }
                }
                @keyframes video-node-glow {
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
                  animation: 'video-node-stripe 1.5s linear infinite, video-node-glow 4s ease-in-out infinite',
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
                transform: 'translate(-50%, -50%)',
                width: 56,
                height: 56,
                borderRadius: 28,
                border: '2px solid rgba(255, 255, 255, 0.9)',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
                zIndex: 2,
              }}
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
          </>
        ) : null}
      </div>
      {showToolbar && <QuickActionToolbar actions={quickActions} />}
      {showToolbar && (
        <div className="tc-node-size-badge">
          {sizeLabel}
        </div>
      )}
    </div>
  );
}
