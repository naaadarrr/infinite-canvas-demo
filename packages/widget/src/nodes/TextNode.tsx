import React from 'react';
import { NodeProps, NodeResizeControl } from '@xyflow/react';
import type { TextNodeData } from '@tc/infinite-core';

export function TextNode({ data, selected, dragging }: NodeProps) {
  const nodeData = data as unknown as TextNodeData & {
    onNodeDataChange?: (id: string, patch: Partial<Omit<TextNodeData, 'type'>>) => void;
  };
  const sizeLabel = `${nodeData.size.width} x ${nodeData.size.height}`;
  const showHighlight = selected || dragging;
  const [content, setContent] = React.useState(nodeData.content || '');

  React.useEffect(() => {
    setContent(nodeData.content || '');
  }, [nodeData.content]);

  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value;
    setContent(nextValue);
    nodeData.onNodeDataChange?.(nodeData.id, { content: nextValue });
  };
  
  return (
    <div
      style={{
        width: nodeData.size.width,
        height: nodeData.size.height,
        position: 'relative',
        border: `2px solid ${showHighlight ? '#3b82f6' : '#ddd'}`,
        // borderRadius: '8px',
        overflow: 'hidden',
        padding: '12px',
        backgroundColor: nodeData.backgroundColor || '#fff',
      }}
    >
      {showHighlight && (
        <>
          <NodeResizeControl
            position="top-left"
            minWidth={120}
            minHeight={48}
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              background: '#fff',
              border: '1px solid #3b82f6',
            }}
          />
          <NodeResizeControl
            position="top-right"
            minWidth={120}
            minHeight={48}
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              background: '#fff',
              border: '1px solid #3b82f6',
            }}
          />
          <NodeResizeControl
            position="bottom-left"
            minWidth={120}
            minHeight={48}
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              background: '#fff',
              border: '1px solid #3b82f6',
            }}
          />
          <NodeResizeControl
            position="bottom-right"
            minWidth={120}
            minHeight={48}
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              background: '#fff',
              border: '1px solid #3b82f6',
            }}
          />
        </>
      )}
      {/* 文本内容 - 使用 nodrag 允许文本选择 */}
      <textarea
        className="nodrag"
        style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          fontSize: nodeData.fontSize || 16,
          fontFamily: nodeData.fontFamily || 'sans-serif',
          color: nodeData.color || '#000',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          userSelect: 'text',
          overflow: 'auto',
          border: 'none',
          outline: 'none',
          resize: 'none',
          background: 'transparent',
          lineHeight: 1.4,
        }}
        value={content}
        onChange={handleContentChange}
      />
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
