'use client';

import { useState } from 'react';
import { InfiniteCanvas, CanvasNodeData } from '@tc/infinite-widget';
import { NodeType, generateId, parseRawData } from '@tc/infinite-core';
import { mockData } from './mockData';
import '@xyflow/react/dist/style.css';

export default function Home() {
  const [nodes, setNodes] = useState<CanvasNodeData[]>(() => {
    const parsedNodes = parseRawData(mockData, {
      columns: 4,
      nodeWidth: 300,
      nodeHeight: 200,
      gap: 50,
      startX: 100,
      startY: 100,
    });
    console.log('Parsed nodes:', parsedNodes);
    return parsedNodes;
  });

  const [backgroundColor, setBackgroundColor] = useState('#f5f5f5');
  const [activeTool, setActiveTool] = useState<'select' | 'text'>('select');

  const handlePaneClick = (position: { x: number; y: number }) => {
    if (activeTool !== 'text') {
      return;
    }
    const newNode: CanvasNodeData = {
      id: generateId(),
      type: NodeType.TEXT,
      position,
      size: { width: 240, height: 90 },
      content: 'Untitle Text',
      fontSize: 24,
      color: '#111',
      backgroundColor: '#fff',
    };
    setNodes((prevNodes) => [...prevNodes, newNode]);
    setActiveTool('select');
  };

  return (
    <main style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          padding: '20px',
          background: '#fff',
          borderBottom: '1px solid #e0e0e0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
            @tc/infinite - 无限画布演示
          </h1>
          <p style={{ margin: '8px 0 0', color: '#666', fontSize: '14px' }}>
            支持图片、视频、音频、文本节点的拖动、缩放和组织 | 4列网格布局 | 共 {nodes.length} 个节点
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ fontSize: '14px', color: '#666' }}>背景颜色：</label>
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            style={{
              width: '50px',
              height: '30px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          />
          <button
            onClick={() => setBackgroundColor('#f5f5f5')}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            重置
          </button>
        </div>
      </header>
      <div style={{ flex: 1, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: 16,
            top: 120,
            zIndex: 5,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            padding: '10px 8px',
            borderRadius: 16,
            background: '#fff',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTool(activeTool === 'text' ? 'select' : 'text')}
            title="添加文本"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: activeTool === 'text' ? '1px solid #1d4ed8' : '1px solid #e5e7eb',
              background: activeTool === 'text' ? '#1d4ed8' : '#fff',
              color: activeTool === 'text' ? '#fff' : '#111',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            T
          </button>
        </div>
        <InfiniteCanvas
          nodes={nodes}
          onNodesChange={setNodes}
          backgroundColor={backgroundColor}
          onPaneClick={handlePaneClick}
          paneCursor={activeTool === 'text' ? 'text' : undefined}
          config={{
            minZoom: 0.1,
            maxZoom: 4,
            defaultZoom: 0.8,
            snapToGrid: false,
          }}
        />
      </div>
    </main>
  );
}
