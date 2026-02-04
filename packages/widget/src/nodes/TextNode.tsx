import React from 'react';
import { NodeProps, useStore } from '@xyflow/react';
import type { TextNodeData, TextAlign } from '@tc/infinite-core';
import { useToolbarVisibility } from './useToolbarVisibility';
import { isDev } from '../utils/env';

// 工具栏组件
interface TextToolbarProps {
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  textAlign: TextAlign;
  backgroundColor: string | undefined;
  backgroundOpacity: number;
  zoom: number;
  onFontSizeChange: (size: number) => void;
  onFontWeightChange: (weight: 'normal' | 'bold') => void;
  onTextAlignChange: (align: TextAlign) => void;
  onBackgroundColorChange: (color: string) => void;
  onBackgroundOpacityChange: (opacity: number) => void;
}

const TextToolbar = React.memo(function TextToolbar({
  fontSize,
  fontWeight,
  textAlign,
  backgroundColor,
  backgroundOpacity,
  zoom,
  onFontSizeChange,
  onFontWeightChange,
  onTextAlignChange,
  onBackgroundColorChange,
  onBackgroundOpacityChange,
}: TextToolbarProps) {
  const [showFontSizeDropdown, setShowFontSizeDropdown] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [hoveredTooltip, setHoveredTooltip] = React.useState<string | null>(null);
  const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72, 96, 128];
  const backgroundOptions: Array<{ value: string; label: string; swatch: string }> = [
    { value: 'transparent', label: '透明', swatch: 'transparent' },
    { value: '#ffffff', label: '白色', swatch: '#ffffff' },
    { value: '#000000', label: '黑色', swatch: '#000000' },
    { value: '#f5f5f5', label: '灰色', swatch: '#f5f5f5' },
    { value: '#fef3c7', label: '淡黄', swatch: '#fef3c7' },
    { value: '#e0f2fe', label: '淡蓝', swatch: '#e0f2fe' },
    { value: '#dcfce7', label: '淡绿', swatch: '#dcfce7' },
  ];

  const TooltipWrapper = ({
    id,
    label,
    children,
  }: {
    id: string;
    label: string;
    children: React.ReactNode;
  }) => (
    <div
      onMouseEnter={() => setHoveredTooltip(id)}
      onMouseLeave={() => setHoveredTooltip((current) => (current === id ? null : current))}
      style={{ position: 'relative', display: 'inline-flex' }}
    >
      {children}
      {hoveredTooltip === id && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 8,
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <div
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              backgroundColor: '#252525',
              color: '#fff',
              fontSize: 12,
              whiteSpace: 'nowrap',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
            }}
          >
            {label}
          </div>
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: -4,
              width: 8,
              height: 8,
              transform: 'translateX(-50%) rotate(45deg)',
              backgroundColor: '#252525',
              borderRight: '1px solid rgba(255, 255, 255, 0.12)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          />
        </div>
      )}
    </div>
  );

  return (
    <div
      className="nodrag nopan nowheel"
      onPointerDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onDoubleClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: `translateX(-50%) scale(${1 / zoom})`,
        transformOrigin: 'bottom center',
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 8px',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 10,
        border: '1px solid rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
        whiteSpace: 'nowrap',
        zIndex: 9999,
        pointerEvents: 'auto',
      }}
    >
      {/* 字体大小下拉框 */}
      <div style={{ position: 'relative' }}>
        <TooltipWrapper id="font-size" label="字号">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowFontSizeDropdown(!showFontSizeDropdown);
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 6,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              fontSize: 12,
              color: '#fff',
              minWidth: 56,
            }}
          >
            {fontSize}
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path
                d="M1 1L5 5L9 1"
                stroke="rgba(255, 255, 255, 0.8)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </TooltipWrapper>
        {showFontSizeDropdown && (
          <div
            className="nodrag nopan nowheel"
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 4,
              backgroundColor: '#252525',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 6,
              boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
              maxHeight: 200,
              overflowY: 'auto',
              zIndex: 10000,
              pointerEvents: 'auto',
            }}
          >
            {fontSizes.map((size) => (
              <div
                key={size}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onFontSizeChange(size);
                  setShowFontSizeDropdown(false);
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                style={{
                  padding: '6px 16px',
                  cursor: 'pointer',
                  fontSize: 12,
                  color: size === fontSize ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
                  backgroundColor: size === fontSize ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.backgroundColor =
                    size === fontSize ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.backgroundColor =
                    size === fontSize ? 'rgba(255, 255, 255, 0.12)' : 'transparent';
                }}
              >
                {size}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 加粗按钮 */}
      <TooltipWrapper id="bold" label="加粗">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onFontWeightChange(fontWeight === 'bold' ? 'normal' : 'bold');
          }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          style={{
            width: 26,
            height: 26,
            border: 'none',
            borderRadius: 6,
            backgroundColor: fontWeight === 'bold' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 14,
            color: fontWeight === 'bold' ? '#ffffff' : 'rgba(255, 255, 255, 0.75)',
          }}
        >
          B
        </button>
      </TooltipWrapper>

      {isExpanded && (
        <>
          {/* 分隔线 */}
          <div style={{ width: 1, height: 18, backgroundColor: 'rgba(255, 255, 255, 0.18)', margin: '0 4px' }} />

          {/* 对齐方式按钮组 */}
          <div style={{ display: 'flex', gap: 2 }}>
            {/* 左对齐 */}
            <TooltipWrapper id="align-left" label="左对齐">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTextAlignChange('left');
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                style={{
                  padding: 6,
                  border: 'none',
                  borderRadius: 6,
                  backgroundColor: textAlign === 'left' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 3H14M2 6.5H10M2 10H14M2 13.5H10"
                    stroke={textAlign === 'left' ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </TooltipWrapper>
            {/* 居中对齐 */}
            <TooltipWrapper id="align-center" label="居中对齐">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTextAlignChange('center');
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                style={{
                  padding: 6,
                  border: 'none',
                  borderRadius: 6,
                  backgroundColor: textAlign === 'center' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 3H14M4 6.5H12M2 10H14M4 13.5H12"
                    stroke={textAlign === 'center' ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </TooltipWrapper>
            {/* 右对齐 */}
            <TooltipWrapper id="align-right" label="右对齐">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTextAlignChange('right');
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                style={{
                  padding: 6,
                  border: 'none',
                  borderRadius: 6,
                  backgroundColor: textAlign === 'right' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 3H14M6 6.5H14M2 10H14M6 13.5H14"
                    stroke={textAlign === 'right' ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </TooltipWrapper>
          </div>

          {/* 分隔线 */}
          <div style={{ width: 1, height: 18, backgroundColor: 'rgba(255, 255, 255, 0.18)', margin: '0 4px' }} />

          {/* 背景色按钮组 */}
          <div style={{ display: 'flex', gap: 4 }}>
            {backgroundOptions.map((option) => {
              const isActive = (backgroundColor ?? 'transparent') === option.value;
              return (
                <TooltipWrapper key={option.label} id={`bg-${option.label}`} label={option.label}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onBackgroundColorChange(option.value);
                    }}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      border: isActive
                        ? '2px solid rgba(255, 255, 255, 0.9)'
                        : '1px solid rgba(255, 255, 255, 0.3)',
                      padding: 0,
                      backgroundColor: option.swatch,
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    {option.value === 'transparent' && (
                      <span
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: 3,
                          background:
                            'linear-gradient(135deg, transparent 45%, #ef4444 45%, #ef4444 55%, transparent 55%)',
                        }}
                      />
                    )}
                    {option.value === '#000000' && (
                      <span
                        style={{
                          position: 'absolute',
                          inset: 2,
                          borderRadius: 2,
                          border: '1px solid rgba(255,255,255,0.4)',
                        }}
                      />
                    )}
                  </button>
                </TooltipWrapper>
              );
            })}
          </div>

          {/* 分隔线 */}
          <div style={{ width: 1, height: 18, backgroundColor: 'rgba(255, 255, 255, 0.18)', margin: '0 4px' }} />

          {/* 背景透明度 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(backgroundOpacity * 100)}
              onChange={(event) => {
                event.stopPropagation();
                onBackgroundOpacityChange(Number(event.target.value) / 100);
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
              style={{ width: 90, accentColor: '#ffffff' }}
            />
            <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', minWidth: 36, textAlign: 'right' }}>
              {Math.round(backgroundOpacity * 100)}%
            </span>
          </div>
        </>
      )}

      <TooltipWrapper id="expand" label={isExpanded ? '收起' : '更多'}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          style={{
            width: 26,
            height: 26,
            border: 'none',
            borderRadius: 6,
            backgroundColor: isExpanded ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
            color: isExpanded ? '#ffffff' : 'rgba(255, 255, 255, 0.75)',
          }}
          aria-label={isExpanded ? '收起' : '更多'}
        >
          ...
        </button>
      </TooltipWrapper>
    </div>
  );
});

export function TextNode({ data, selected, dragging }: NodeProps) {
  const nodeData = data as unknown as TextNodeData & {
    onNodeDataChange?: (id: string, patch: Partial<Omit<TextNodeData, 'type'>>) => void;
    autoEdit?: boolean;
  };
  // 使用 useStore 获取 React Flow 中的实际节点位置
  const nodePosition = useStore((state) => {
    const node = state.nodeLookup?.get(nodeData.id);
    return node?.position ?? nodeData.position;
  });
  const showHighlight = selected || dragging;
  const [content, setContent] = React.useState(nodeData.content || 'Add some text..');
  const [isEditing, setIsEditing] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const textDisplayRef = React.useRef<HTMLDivElement | null>(null);
  const autoEditProcessedRef = React.useRef(false);
  const scaleStateRef = React.useRef<{
    anchorX: number;
    anchorY: number;
    startDist: number;
    startFontSize: number;
    startWidth: number;
    startHeight: number;
    startPosX: number;
    startPosY: number;
    corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  } | null>(null);
  const widthResizeRef = React.useRef<{
    startX: number;
    startWidth: number;
    startPosX: number;
    side: 'left' | 'right';
  } | null>(null);
  const manualSizingRef = React.useRef(false); // 标记是否正在手动调整尺寸
  
  const fontSize = nodeData.fontSize ?? 16;
  const fontWeight = nodeData.fontWeight ?? 'normal';
  const textAlign = nodeData.textAlign ?? 'left';
  const backgroundOpacity = Math.max(0, Math.min(1, nodeData.backgroundOpacity ?? 1));
  const lineHeight = 1.4;
  const paddingSize = 12;
  const lineHeightPx = Math.round(fontSize * lineHeight);
  const zoom = useStore((state) => state.transform[2] ?? 1);
  const showToolbar = useToolbarVisibility(selected, dragging);
  const resolvedBackgroundColor = React.useMemo(() => {
    if (!nodeData.backgroundColor || nodeData.backgroundColor === 'transparent') {
      return 'transparent';
    }
    const hex = nodeData.backgroundColor.replace('#', '');
    const normalized = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
    const value = Number.parseInt(normalized, 16);
    if (Number.isNaN(value) || normalized.length !== 6) {
      return nodeData.backgroundColor;
    }
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `rgba(${r}, ${g}, ${b}, ${backgroundOpacity})`;
  }, [backgroundOpacity, nodeData.backgroundColor]);
  const resolvedTextColor = React.useMemo(() => {
    const raw = (nodeData.backgroundColor || '').toLowerCase();
    // 透明背景使用白色字体
    if (!raw || raw === 'transparent') {
      return nodeData.color || '#ffffff';
    }
    const normalized = raw.startsWith('#') ? raw.slice(1) : raw;
    const hex = normalized.length === 3 ? normalized.split('').map((c) => c + c).join('') : normalized;
    // 黑色背景使用白色字体
    if (hex === '000000') {
      return nodeData.color || '#ffffff';
    }
    // 白色背景使用黑色字体
    if (hex === 'ffffff') {
      return nodeData.color || '#000000';
    }
    // 其他背景使用黑色字体
    return nodeData.color || '#000000';
  }, [nodeData.backgroundColor, nodeData.color]);

  React.useEffect(() => {
    setContent(nodeData.content || '');
  }, [nodeData.content]);

  // 自动进入编辑模式(针对新创建的文本节点)
  React.useEffect(() => {
    if (nodeData.autoEdit && !autoEditProcessedRef.current) {
      autoEditProcessedRef.current = true;
      setIsEditing(true);
      // 清除 autoEdit 标记
      nodeData.onNodeDataChange?.(nodeData.id, { autoEdit: undefined } as any);
      // 聚焦到textarea并全选文本
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          // 全选文本，让用户可以直接开始输入替换
          textareaRef.current.select();
        }
      }, 100);
    }
  }, [nodeData.autoEdit, nodeData, content]);

  // 当选中且点击时进入编辑模式
  const handleContainerClick = React.useCallback(() => {
    if (selected && !isEditing) {
      setIsEditing(true);
      // 聚焦到textarea
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  }, [selected, isEditing]);

  // 自动计算高度
  React.useLayoutEffect(() => {
    const textDisplay = textDisplayRef.current;
    if (!textDisplay) {
      return;
    }
    
    // 如果正在手动调整尺寸，不自动调整高度
    if (manualSizingRef.current) {
      return;
    }
    
    // 获取文本渲染区域的实际高度
    const scrollHeight = textDisplay.scrollHeight;
    const minContentHeight = lineHeightPx;
    const contentHeight = Math.max(scrollHeight, minContentHeight);
    const nextHeight = contentHeight + paddingSize * 2;
    
    if (Math.abs(nextHeight - nodeData.size.height) < 1) {
      return;
    }
    
    nodeData.onNodeDataChange?.(nodeData.id, {
      size: { ...nodeData.size, height: Math.ceil(nextHeight) },
    });
  // 移除 nodeData.size.height 和 nodeData.size 的依赖，避免循环触发
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, lineHeightPx, nodeData.id, nodeData.onNodeDataChange, paddingSize, nodeData.size.width]);

  // 用于延迟同步内容到服务器的 ref
  const contentSyncTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isComposingRef = React.useRef(false);

  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value;
    setContent(nextValue);
    
    // 如果正在输入中文（composing），不立即同步
    if (isComposingRef.current) {
      return;
    }
    
    // 清除之前的延迟同步
    if (contentSyncTimeoutRef.current) {
      clearTimeout(contentSyncTimeoutRef.current);
    }
    
    // 延迟 300ms 同步到服务器，避免打断输入
    contentSyncTimeoutRef.current = setTimeout(() => {
      nodeData.onNodeDataChange?.(nodeData.id, { content: nextValue });
    }, 300);
  };

  // 处理输入法开始
  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  // 处理输入法结束
  const handleCompositionEnd = (event: React.CompositionEvent<HTMLTextAreaElement>) => {
    isComposingRef.current = false;
    const nextValue = (event.target as HTMLTextAreaElement).value;
    
    // 输入法结束后立即同步
    if (contentSyncTimeoutRef.current) {
      clearTimeout(contentSyncTimeoutRef.current);
    }
    nodeData.onNodeDataChange?.(nodeData.id, { content: nextValue });
  };

  const handleBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    const nextValue = event.currentTarget.value;
    // 延迟检查，给工具栏按钮点击事件时间执行
    setTimeout(() => {
      // 检查是否点击了工具栏，如果是则不失焦
      const relatedTarget = event.relatedTarget as HTMLElement;
      if (relatedTarget && containerRef.current?.contains(relatedTarget)) {
        // 点击的是工具栏内的元素，保持编辑状态并重新聚焦
        textareaRef.current?.focus();
        return;
      }
      
      setIsEditing(false);
      // 如果内容为空（去除空格后），触发删除
      if (!nextValue.trim()) {
        if (isDev()) {
          console.log('[TextNode] Empty content on blur, request delete', {
            id: nodeData.id,
          });
        }
        nodeData.onNodeDataChange?.(nodeData.id, { _delete: true } as any);
      }
    }, 0);
  };

  const handleFontSizeChange = React.useCallback((newSize: number) => {
    nodeData.onNodeDataChange?.(nodeData.id, { fontSize: newSize });
  }, [nodeData]);

  const handleFontWeightChange = React.useCallback((newWeight: 'normal' | 'bold') => {
    nodeData.onNodeDataChange?.(nodeData.id, { fontWeight: newWeight });
  }, [nodeData]);

  const handleTextAlignChange = React.useCallback((newAlign: TextAlign) => {
    nodeData.onNodeDataChange?.(nodeData.id, { textAlign: newAlign });
  }, [nodeData]);

  const handleBackgroundColorChange = React.useCallback((newColor: string) => {
    const normalizedColor = !newColor || newColor === 'transparent' ? 'transparent' : newColor;
    // 根据新背景色自动设置文字颜色
    let textColor: string;
    const raw = normalizedColor.toLowerCase();
    
    // 透明背景使用白色字体
    if (!raw || raw === 'transparent') {
      textColor = '#ffffff';
    } else {
      const normalized = raw.startsWith('#') ? raw.slice(1) : raw;
      const hex = normalized.length === 3 ? normalized.split('').map((c) => c + c).join('') : normalized;
      // 黑色背景使用白色字体
      if (hex === '000000') {
        textColor = '#ffffff';
      } 
      // 白色背景使用黑色字体
      else if (hex === 'ffffff') {
        textColor = '#000000';
      } 
      // 其他背景使用黑色字体
      else {
        textColor = '#000000';
      }
    }
    
    nodeData.onNodeDataChange?.(nodeData.id, { 
      backgroundColor: normalizedColor,
      color: textColor 
    });
  }, [nodeData]);

  const handleBackgroundOpacityChange = React.useCallback((newOpacity: number) => {
    nodeData.onNodeDataChange?.(nodeData.id, { backgroundOpacity: newOpacity });
  }, [nodeData]);

  const handleScaleStart = (
    event: React.PointerEvent<HTMLDivElement>,
    corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  ) => {
    event.preventDefault();
    event.stopPropagation();
    
    manualSizingRef.current = true;
    
    const rect = containerRef.current?.getBoundingClientRect();
    
    // 计算锚点位置（对角）
    const anchorX = corner.includes('left') ? rect!.right : rect!.left;
    const anchorY = corner.includes('top') ? rect!.bottom : rect!.top;
    const startDist = Math.hypot(event.clientX - anchorX, event.clientY - anchorY);
    
    scaleStateRef.current = {
      anchorX,
      anchorY,
      startDist,
      startFontSize: fontSize,
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
      const { anchorX, anchorY, startDist, startFontSize, startWidth, startHeight, startPosX, startPosY, corner } = scaleStateRef.current;
      
      const currentDist = Math.hypot(moveEvent.clientX - anchorX, moveEvent.clientY - anchorY);
      const scaleFactor = currentDist / startDist;
      
      const newFontSize = Math.max(8, Math.min(1024, startFontSize * scaleFactor));
      const newWidth = Math.max(80, startWidth * scaleFactor);
      const newHeight = Math.max(30, startHeight * scaleFactor);
      
      let newPosX = startPosX;
      let newPosY = startPosY;
      
      if (corner === 'bottom-right') {
        newPosX = startPosX;
        newPosY = startPosY;
      } else if (corner === 'bottom-left') {
        newPosX = startPosX + (startWidth - newWidth);
        newPosY = startPosY;
      } else if (corner === 'top-right') {
        newPosX = startPosX;
        newPosY = startPosY + (startHeight - newHeight);
      } else if (corner === 'top-left') {
        newPosX = startPosX + (startWidth - newWidth);
        newPosY = startPosY + (startHeight - newHeight);
      }
      
      
      nodeData.onNodeDataChange?.(nodeData.id, {
        fontSize: Math.round(newFontSize),
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
      
      // 延迟清除手动调整标记，给足够时间让状态稳定
      setTimeout(() => {
        manualSizingRef.current = false;
      }, 500);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const handleWidthResizeStart = (
    event: React.PointerEvent<HTMLDivElement>,
    side: 'left' | 'right'
  ) => {
    event.preventDefault();
    event.stopPropagation();
    
    manualSizingRef.current = true;
    
    widthResizeRef.current = {
      startX: event.clientX,
      startWidth: nodeData.size.width,
      // 使用 React Flow 的实际位置，而不是 nodeData.position
      startPosX: nodePosition.x,
      side,
    };

    const handleMove = (moveEvent: PointerEvent) => {
      if (!widthResizeRef.current) {
        return;
      }
      const { startX, startWidth, startPosX, side } = widthResizeRef.current;
      const deltaX = moveEvent.clientX - startX;
      
      let newWidth = startWidth;
      let newPosX = startPosX;
      
      if (side === 'right') {
        newWidth = startWidth + deltaX;
      } else {
        newWidth = startWidth - deltaX;
        newPosX = startPosX + deltaX;
      }
      
      newWidth = Math.max(80, newWidth);
      if (side === 'left' && newWidth === 80) {
        newPosX = startPosX + (startWidth - 80);
      }
      
      if (Math.abs(newWidth - nodeData.size.width) > 2 || Math.abs(newPosX - nodeData.position.x) > 2) {
        const patch: any = {
          size: { ...nodeData.size, width: Math.round(newWidth) },
        };
        
        if (side === 'left') {
          patch.position = {
            x: newPosX,
            y: nodeData.position.y,
          };
        }
        
        nodeData.onNodeDataChange?.(nodeData.id, patch);
      }
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      widthResizeRef.current = null;
      
      // 延迟清除手动调整标记
      setTimeout(() => {
        manualSizingRef.current = false;
      }, 500);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  // 渲染文本内容，保留换行
  const renderTextContent = () => {
    if (!content) {
      return <span style={{ opacity: 0.4 }}>Add some text..</span>;
    }
    return content;
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      style={{
        width: nodeData.size.width,
        height: nodeData.size.height,
        position: 'relative',
        overflow: 'visible',
        padding: `${paddingSize}px`,
        boxSizing: 'border-box',
        border: showHighlight ? '2px solid #3b82f6' : '2px solid transparent',
        backgroundColor: resolvedBackgroundColor,
      }}
    >
      {/* 顶部工具栏 - 在编辑模式或选中时显示 */}
      {showToolbar && (
        <TextToolbar
          fontSize={fontSize}
          fontWeight={fontWeight}
          textAlign={textAlign}
          backgroundColor={nodeData.backgroundColor}
          backgroundOpacity={backgroundOpacity}
          zoom={zoom || 1}
          onFontSizeChange={handleFontSizeChange}
          onFontWeightChange={handleFontWeightChange}
          onTextAlignChange={handleTextAlignChange}
          onBackgroundColorChange={handleBackgroundColorChange}
          onBackgroundOpacityChange={handleBackgroundOpacityChange}
        />
      )}

      {showHighlight && (
        <>
          {/* 左边缘宽度调节区域 */}
          <div
            className="nodrag"
            onPointerDown={(e) => handleWidthResizeStart(e, 'left')}
            style={{
              position: 'absolute',
              left: -4,
              top: 12,
              bottom: 12,
              width: 8,
              cursor: 'ew-resize',
              zIndex: 1,
            }}
          />
          {/* 右边缘宽度调节区域 */}
          <div
            className="nodrag"
            onPointerDown={(e) => handleWidthResizeStart(e, 'right')}
            style={{
              position: 'absolute',
              right: -4,
              top: 12,
              bottom: 12,
              width: 8,
              cursor: 'ew-resize',
              zIndex: 1,
            }}
          />
          {/* 四个角的缩放控制点 */}
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

      {/* 文本渲染层 - 用于显示实际文本 */}
      <div
        ref={textDisplayRef}
        style={{
          width: '100%',
          minHeight: `${lineHeightPx}px`,
          fontSize: fontSize,
          fontFamily: nodeData.fontFamily || 'sans-serif',
          fontWeight: fontWeight,
          color: resolvedTextColor,
          textAlign: textAlign,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          lineHeight: `${lineHeightPx}px`,
          userSelect: isEditing ? 'none' : 'text',
          opacity: isEditing ? 0 : 1,
          pointerEvents: isEditing ? 'none' : 'auto',
        }}
      >
        {renderTextContent()}
      </div>

      {/* 隐藏的输入层 - 仅在编辑模式下显示 */}
      {isEditing && (
        <textarea
          title="Input Text"
          placeholder="Add some text.."
          ref={textareaRef}
          className="nodrag"
          autoFocus
          style={{
            position: 'absolute',
            top: paddingSize,
            left: paddingSize,
            right: paddingSize,
            bottom: paddingSize,
            width: `calc(100% - ${paddingSize * 2}px)`,
            height: `calc(100% - ${paddingSize * 2}px)`,
            boxSizing: 'border-box',
            fontSize: fontSize,
            fontFamily: nodeData.fontFamily || 'sans-serif',
            fontWeight: fontWeight,
            color: resolvedTextColor,
            textAlign: textAlign,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflow: 'hidden',
            border: 'none',
            outline: 'none',
            resize: 'none',
            background: 'transparent',
            lineHeight: `${lineHeightPx}px`,
            padding: 0,
            margin: 0,
            caretColor: resolvedTextColor,
          }}
          value={content}
          onChange={handleContentChange}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onBlur={handleBlur}
          onContextMenu={(event) => {
            event.preventDefault();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              textareaRef.current?.blur();
              return;
            }
            if (event.key !== 'Delete' && event.key !== 'Backspace') {
              return;
            }
            const nextValue = event.currentTarget.value;
            if (!nextValue.trim()) {
              event.preventDefault();
              event.stopPropagation();
              if (isDev()) {
                console.log('[TextNode] Empty content on key delete, request delete', {
                  id: nodeData.id,
                  key: event.key,
                });
              }
              nodeData.onNodeDataChange?.(nodeData.id, { _delete: true } as any);
            }
          }}
        />
      )}

    </div>
  );
}
