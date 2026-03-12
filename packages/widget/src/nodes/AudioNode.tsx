import React, { useState, useRef, useEffect } from 'react';
import { Handle, NodeProps, Position, useStore } from '@xyflow/react';
import type { AudioNodeData, RawDataItem } from '@tc/infinite-core';
import { Download, RefreshCw, Play, Pause } from 'lucide-react';
import { QuickActionToolbar, type QuickAction } from './QuickActionToolbar';
import { NodeLabelBar } from './NodeLabelBar';
import { useToolbarVisibility } from './useToolbarVisibility';
import { useNodeSelection } from './useNodeSelection';
import { createWidgetEvent, widgetBridge } from '../bridge';
import { MediaSkeleton } from './MediaSkeleton';

import { NodeRatingBadge } from './NodeRatingBadge';
import { useCanvasRole } from '../CanvasRoleContext';
import { getToolLabel } from '../utils/toolLabels';

// 默认波形高度
const defaultWaveformHeights = [
  6, 8, 12, 16, 18, 22, 20, 24, 22, 18, 20, 24, 26, 22, 18, 14, 16, 20, 18, 14,
  10, 12, 8, 6, 8, 10, 14, 12, 8, 6
];

export function AudioNode({ data, selected, dragging }: NodeProps) {
  const role = useCanvasRole();
  const canEdit = role !== 'viewer';
  const canDeleteFailed = canEdit;
  const nodeData = data as unknown as AudioNodeData & {
    onNodeDataChange?: (id: string, patch: Partial<Omit<AudioNodeData, 'type'>>) => void;
  };
  // 使用 useStore 获取 React Flow 中的实际节点位置
  const nodePosition = useStore((state) => {
    const node = state.nodeLookup?.get(nodeData.id);
    return node?.position ?? nodeData.position;
  });
  const zoom = useStore((state) => state.transform[2] ?? 1);
  const rawItem = (nodeData as AudioNodeData & { raw?: RawDataItem }).raw;
  const status = String(rawItem?.status ?? '').toLowerCase();
  const isSkeleton = status === 'init';
  const isFailed = status === 'fail';
  const isSuccess = status === 'success';

  // 音频播放状态
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasError, setHasError] = useState(false);

  // 处理播放/暂停
  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio || hasError) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch((error) => {
        console.error('Audio play error:', {
          error,
          name: error.name,
          message: error.message,
          url: nodeData.url,
          readyState: audio.readyState,
          networkState: audio.networkState,
        });
        setHasError(true);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  // 更新进度和错误处理
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setHasError(false);
    };

    const handleError = () => {
      const error = audio.error;
      const errorDetails = {
        code: error?.code,
        message: error?.message,
        url: nodeData.url,
        networkState: audio.networkState,
        readyState: audio.readyState,
      };
      
      // 错误代码说明
      const errorMessages: Record<number, string> = {
        1: 'MEDIA_ERR_ABORTED - 加载被中止',
        2: 'MEDIA_ERR_NETWORK - 网络错误',
        3: 'MEDIA_ERR_DECODE - 解码错误',
        4: 'MEDIA_ERR_SRC_NOT_SUPPORTED - 不支持的音频格式或源',
      };
      
      console.error('Audio loading error:', {
        ...errorDetails,
        errorType: error?.code ? errorMessages[error.code] : 'Unknown error',
      });
      
      setHasError(true);
      setIsPlaying(false);
    };

    const handleLoadedMetadata = () => {
      setHasError(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);
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
  const quickActions: QuickAction[] = React.useMemo(() => {
    const actions: QuickAction[] = [];
    
    if (rawItem?.toolType !== 'user-upload') {
      actions.push({
        id: 'edit',
        label: 'Re-edit',
        icon: RefreshCw,
        onClick: () => handleQuickAction('edit', 'Re-edit'),
      });
    }

    actions.push({
      id: 'download',
      label: 'Download',
      icon: Download,
      onClick: () => handleQuickAction('download', 'Download'),
    });

    return actions;
  }, [rawItem?.toolType, handleQuickAction]);
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
  const { effectiveSelected, handlePointerDown: handleNodePointerDown } = useNodeSelection(selected, containerRef);
  const showHighlight = effectiveSelected || dragging;
  const showToolbar = useToolbarVisibility(effectiveSelected, dragging) && !isSkeleton && !isFailed;
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onPointerDown={handleNodePointerDown}
      style={{
        width: nodeData.size.width,
        height: nodeData.size.height,
        position: 'relative',
        border: 'none',
        overflow: 'visible',
        padding: isSkeleton || isFailed ? 0 : '16px',
        backgroundColor: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        cursor: isSkeleton || isFailed ? 'default' : dragging ? 'grabbing' : 'grab',
        outline: effectiveSelected
          ? `${1 / zoom}px solid #5857FD`
          : isFailed
            ? `${1 / zoom}px solid #ef4444`
            : isHovered
              ? `${1 / zoom}px solid rgba(88,87,253,0.7)`
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
            const handleSize = 12 / zoom;
            const handleOffset = -(handleSize / 2);
            return (
              <div
                key={corner}
                className="nodrag"
                onPointerDown={(e) => handleScaleStart(e, corner)}
                style={{
                  position: 'absolute',
                  width: handleSize,
                  height: handleSize,
                  borderRadius: 2 / zoom,
                  background: '#fff',
                  border: `${1 / zoom}px solid #5857FD`,
                  cursor: cursorStyle,
                  left: corner.includes('left') ? handleOffset : 'auto',
                  right: corner.includes('right') ? handleOffset : 'auto',
                  top: corner.includes('top') ? handleOffset : 'auto',
                  bottom: corner.includes('bottom') ? handleOffset : 'auto',
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
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #252525 0%, #1e1e1e 50%, #181818 100%)',
            overflow: 'hidden',
          }}
        >
          {/* 纹理叠加 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.3,
              backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 70%)',
            }}
          />

          {/* 环境光晕 */}
          <div
            style={{
              position: 'absolute',
              width: 128,
              height: 128,
              borderRadius: '50%',
              filter: 'blur(48px)',
              background: isPlaying ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
              transform: isPlaying ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 0.7s ease',
            }}
          />

          {/* 紧凑的中心布局 */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}
          >
            {/* 波形 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                gap: 2,
                height: 28,
              }}
            >
              {defaultWaveformHeights.map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: 2,
                    height: h,
                    borderRadius: 1,
                    background: 'rgba(255,255,255,0.5)',
                    transformOrigin: 'bottom',
                    ...(isPlaying ? {
                      animationName: 'wave',
                      animationDuration: '1.5s',
                      animationTimingFunction: 'ease-in-out',
                      animationIterationCount: 'infinite',
                      animationDelay: `${i * 50}ms`,
                    } : {}),
                  }}
                />
              ))}
            </div>

            {/* 圆形进度容器 */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* 脉冲环动画 */}
              {isPlaying && (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      width: 112,
                      height: 112,
                      borderRadius: '50%',
                      border: '1px solid rgba(255,255,255,0.1)',
                      animationName: 'ping',
                      animationDuration: '2s',
                      animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
                      animationIterationCount: 'infinite',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      width: 96,
                      height: 96,
                      borderRadius: '50%',
                      border: '1px solid rgba(255,255,255,0.15)',
                      animationName: 'ping',
                      animationDuration: '2.5s',
                      animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
                      animationIterationCount: 'infinite',
                      animationDelay: '0.5s',
                    }}
                  />
                </>
              )}

              {/* 进度环 SVG */}
              <svg
                style={{
                  position: 'absolute',
                  width: 80,
                  height: 80,
                  transform: 'rotate(-90deg)',
                }}
                viewBox="0 0 80 80"
              >
                {/* 背景圆 */}
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1.5"
                />
                {/* 进度弧 */}
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
                  style={{ transition: 'stroke-dashoffset 0.1s' }}
                />
              </svg>

              {/* 播放/暂停按钮 - 使用 nodrag 防止拖拽冲突 */}
              <button
                className="nodrag nopan nowheel"
                onClick={togglePlay}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={hasError || !nodeData.url}
                style={{
                  position: 'relative',
                  zIndex: 10,
                  display: 'flex',
                  height: 56,
                  width: 56,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'all 0.3s',
                  border: hasError 
                    ? '1px solid rgba(239, 68, 68, 0.3)' 
                    : isPlaying 
                      ? '1px solid rgba(255,255,255,0.2)' 
                      : '1px solid rgba(255,255,255,0.1)',
                  background: hasError
                    ? 'rgba(239, 68, 68, 0.1)'
                    : isPlaying 
                      ? 'rgba(255,255,255,0.15)' 
                      : 'rgba(255,255,255,0.05)',
                  boxShadow: isPlaying ? '0 10px 15px -3px rgba(0,0,0,0.3)' : 'none',
                  cursor: hasError || !nodeData.url ? 'not-allowed' : 'pointer',
                  opacity: hasError || !nodeData.url ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isPlaying && !hasError && nodeData.url) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isPlaying && !hasError && nodeData.url) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  }
                }}
              >
                {isPlaying ? (
                  <Pause style={{ height: 20, width: 20, color: 'rgba(255,255,255,0.9)' }} />
                ) : (
                  <Play style={{ height: 20, width: 20, color: hasError ? 'rgba(239, 68, 68, 0.7)' : 'rgba(255,255,255,0.7)', marginLeft: 2 }} />
                )}
              </button>
            </div>

            {/* 音频名称和类型 */}
            <div style={{ padding: '0 16px', textAlign: 'center' }}>
              <div
                style={{
                  fontSize: 12,
                  color: hasError ? 'rgba(239, 68, 68, 0.7)' : 'rgba(255,255,255,0.7)',
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: nodeData.size.width - 32,
                  letterSpacing: '0.025em',
                }}
              >
                {hasError ? '无法加载音频' : nodeData.title || 'Untitled'}
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 10,
                  color: hasError ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255,255,255,0.3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                {hasError ? 'Error' : nodeData.artist || 'Audio'}
              </div>
            </div>
          </div>

          {/* 隐藏的音频元素 */}
          {nodeData.url && (
            <audio
              ref={audioRef}
              src={nodeData.url}
              loop={nodeData.loop}
              preload="metadata"
              style={{ display: 'none' }}
            />
          )}
        </div>
      ) : null}
      <NodeLabelBar
        isVisible={showToolbar}
        nodeType={nodeData.type}
        label={rawItem?.title || 'Audio'}
        sizeLabel={`${Math.round(nodeData.size.width)} × ${Math.round(nodeData.size.height)}`}
        nodeWidth={nodeData.size.width}
        toolLabel={undefined}
      />
      <QuickActionToolbar isVisible={showToolbar} actions={quickActions} />
    </div>
  );
}
