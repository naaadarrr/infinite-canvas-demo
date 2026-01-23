'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CollaborationState, ServerMessage, UserPresence } from '@tc/infinite-widget';
import { InfiniteCanvas, CanvasNodeData, useCollaboration } from '@tc/infinite-widget';
import { NodeType, generateId, parseRawData } from '@tc/infinite-core';
import { mockData } from './mockData';
import '@xyflow/react/dist/style.css';

export default function Home() {
  const seedNodes = useMemo(
    () =>
      parseRawData(mockData, {
        columns: 4,
        nodeWidth: 300,
        nodeHeight: 200,
        gap: 50,
        startX: 100,
        startY: 100,
      }),
    []
  );

  const [nodes, setNodes] = useState<CanvasNodeData[]>([]);

  const [backgroundColor, setBackgroundColor] = useState('#f5f5f5');
  const [activeTool, setActiveTool] = useState<'select' | 'text'>('select');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
  } | null>(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; variant: 'info' | 'error' }>
  >([]);
  const userId = useMemo(() => `user_${Math.random().toString(36).slice(2, 8)}`, []);
  const canvasId = useMemo(() => {
    if (typeof window === 'undefined') {
      return 'demo';
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('canvasId') ?? 'demo';
  }, []);
  const collabRef = useRef<CollaborationState | null>(null);
  const seededRef = useRef(false);
  const nodesRef = useRef<CanvasNodeData[]>([]);
  const idMapRef = useRef<Map<string, string>>(new Map());
  const presencesRef = useRef<Map<string, { userName?: string }>>(new Map());
  const knownUsersRef = useRef<Set<string>>(new Set());
  const connectedRef = useRef(false);
  const wasConnectedRef = useRef(false);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const userColor = useMemo(() => {
    const palette = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0f766e'];
    const hash = Array.from(userId).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return palette[hash % palette.length];
  }, [userId]);

  const resolvePresenceCursor = useCallback((presence: UserPresence) => {
    if (!presence.cursor) {
      return null;
    }
    if (presence.cursorSpace === 'screen' && presence.viewport) {
      return {
        x: (presence.cursor.x - presence.viewport.x) / presence.viewport.zoom,
        y: (presence.cursor.y - presence.viewport.y) / presence.viewport.zoom,
      };
    }
    return presence.cursor;
  }, []);

  const pushToast = useCallback((message: string, variant: 'info' | 'error' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2500);
  }, []);

  const seedCanvas = useCallback(() => {
    if (seededRef.current) {
      return;
    }
    seededRef.current = true;

    const tempNodes = seedNodes.map((node) => ({
      ...node,
      id: `temp_${node.id}`,
    }));

    setNodes(tempNodes);

    tempNodes.forEach((node) => {
      const { id: tempId, ...nodeData } = node;
      collabRef.current?.createNode(nodeData, tempId);
    });
  }, [seedNodes]);

  const handleMessage = useCallback(
    (message: ServerMessage) => {
      switch (message.type) {
        case 'sync_state':
          if (message.nodes.length > 0) {
            seededRef.current = true;
            setNodes(message.nodes);
          } else {
            setNodes([]);
            seedCanvas();
          }
          knownUsersRef.current = new Set(Object.keys(message.presences));
          break;

        case 'node_created':
          if (message.tempId) {
            idMapRef.current.set(message.tempId, message.node.id);
          }
          setNodes((prevNodes) => {
            if (message.tempId) {
              const hasTemp = prevNodes.some((node) => node.id === message.tempId);
              if (hasTemp) {
                return prevNodes.map((node) =>
                  node.id === message.tempId ? message.node : node
                );
              }
            }
            if (prevNodes.some((node) => node.id === message.node.id)) {
              return prevNodes;
            }
            return [...prevNodes, message.node];
          });
          break;

        case 'node_updated':
          setNodes((prevNodes) =>
            prevNodes.map((node) => {
              if (node.id === message.nodeId) {
                return { ...node, ...message.updates };
              }
              const mappedId = idMapRef.current.get(node.id);
              if (mappedId && mappedId === message.nodeId) {
                return { ...node, id: message.nodeId, ...message.updates };
              }
              return node;
            })
          );
          break;

        case 'nodes_updated':
          setNodes((prevNodes) => {
            const updateMap = new Map(
              message.updates.map((update) => [update.nodeId, update.updates])
            );
            return prevNodes.map((node) => {
              const directUpdate = updateMap.get(node.id);
              if (directUpdate) {
                return { ...node, ...directUpdate };
              }
              const mappedId = idMapRef.current.get(node.id);
              if (mappedId) {
                const mappedUpdate = updateMap.get(mappedId);
                if (mappedUpdate) {
                  return { ...node, id: mappedId, ...mappedUpdate };
                }
              }
              return node;
            });
          });
          break;

        case 'node_deleted':
          setNodes((prevNodes) => prevNodes.filter((node) => node.id !== message.nodeId));
          break;

        case 'presence_update':
          if (message.userId === userId) {
            break;
          }
          if (message.presence) {
            if (!knownUsersRef.current.has(message.userId)) {
              const name = message.presence.userName || message.userId;
              pushToast(`${name} 进入了房间`, 'info');
              knownUsersRef.current.add(message.userId);
            }
          } else {
            if (knownUsersRef.current.has(message.userId)) {
              const name = presencesRef.current.get(message.userId)?.userName || message.userId;
              pushToast(`${name} 离开了房间`, 'info');
              knownUsersRef.current.delete(message.userId);
            }
          }
          break;

        case 'error':
          if (message.code === 'ROOM_FULL') {
            pushToast('房间已满，请稍后再进入', 'error');
          }
          break;
      }
    },
    [pushToast, seedCanvas, userId]
  );

  const collab = useCollaboration(
    {
      canvasId,
      userId,
      userName: userId,
    },
    handleMessage
  );
  collabRef.current = collab;
  connectedRef.current = collab.connected;
  useEffect(() => {
    if (!contextMenu) {
      return;
    }
    const handleClose = () => setContextMenu(null);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [contextMenu]);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  useEffect(() => {
    presencesRef.current = new Map(collab.presences);
  }, [collab.presences]);
  useEffect(() => {
    if (collab.connected) {
      collab.updatePresence({ userName: userId, color: userColor });
    }
  }, [collab, userColor, userId]);
  useEffect(() => {
    if (wasConnectedRef.current && !collab.connected) {
      setContextMenu(null);
      setNodes([]);
      idMapRef.current.clear();
      knownUsersRef.current.clear();
      pushToast('已离开房间', 'error');
    }
    wasConnectedRef.current = collab.connected;
  }, [collab.connected, pushToast]);

  const handlePaneClick = useCallback(
    (position: { x: number; y: number }) => {
      if (activeTool !== 'text') {
        return;
      }
      const tempId = `temp_${generateId()}`;
      const defaultContent = 'Untitle Text';
      const defaultFontSize = 24;
      const paddingSize = 12;
      const lineHeight = 1.4;
      
      // 计算文本宽度
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      let textWidth = 200;
      if (context) {
        context.font = `${defaultFontSize}px sans-serif`;
        textWidth = context.measureText(defaultContent).width;
      }
      
      // 计算单行高度
      const singleLineHeight = Math.ceil(defaultFontSize * lineHeight) + paddingSize * 2;
      
      const newNode: CanvasNodeData = {
        id: tempId,
        type: NodeType.TEXT,
        position,
        size: { width: Math.max(80, Math.ceil(textWidth + paddingSize * 2 + 16)), height: singleLineHeight },
        content: defaultContent,
        fontSize: defaultFontSize,
        color: '#111',
        backgroundColor: 'transparent',
      };
      setNodes((prevNodes) => [...prevNodes, newNode]);
      collab.createNode(newNode, tempId);
      setActiveTool('select');
    },
    [activeTool, collab]
  );

  const handleNodesChange = useCallback(
    (nextNodes: CanvasNodeData[]) => {
      const prevNodes = nodesRef.current;
      setNodes(nextNodes);

      // 检测被删除的节点
      const nextNodeIds = new Set(nextNodes.map((node) => node.id));
      const deletedNodes = prevNodes.filter((node) => !nextNodeIds.has(node.id));
      
      // 同步删除操作到服务器
      deletedNodes.forEach((node) => {
        const mappedId = idMapRef.current.get(node.id) ?? node.id;
        collab.deleteNode(mappedId);
        // 清理 idMap
        idMapRef.current.delete(node.id);
      });

      const movedNodes = nextNodes.filter((node) => {
        const prev = prevNodes.find((prevNode) => prevNode.id === node.id);
        if (!prev) {
          return false;
        }
        return prev.position.x !== node.position.x || prev.position.y !== node.position.y;
      });

      if (movedNodes.length > 1) {
        const updates = movedNodes.map((node) => ({
          nodeId: idMapRef.current.get(node.id) ?? node.id,
          updates: { position: node.position },
        }));
        collab.updateNodes(updates);
      }

      const dataUpdates = nextNodes.reduce<Array<{ nodeId: string; updates: Partial<CanvasNodeData> }>>(
        (acc, node) => {
          const prev = prevNodes.find((prevNode) => prevNode.id === node.id);
          if (!prev) {
            return acc;
          }
          const updates: Partial<CanvasNodeData> = {};
          (Object.keys(node) as Array<keyof CanvasNodeData>).forEach((key) => {
            if (key === 'id' || key === 'type' || key === 'position') {
              return;
            }
            const nextValue = node[key];
            const prevValue = prev[key];
            if (typeof nextValue === 'object' && nextValue !== null) {
              if (JSON.stringify(nextValue) !== JSON.stringify(prevValue)) {
                updates[key] = nextValue as CanvasNodeData[typeof key];
              }
              return;
            }
            if (nextValue !== prevValue) {
              updates[key] = nextValue as CanvasNodeData[typeof key];
            }
          });
          if (Object.keys(updates).length === 0) {
            return acc;
          }
          acc.push({
            nodeId: idMapRef.current.get(node.id) ?? node.id,
            updates,
          });
          return acc;
        },
        []
      );

      if (dataUpdates.length > 0) {
        collab.updateNodes(dataUpdates);
      }
    },
    [collab]
  );

  const handleNodeDragStart = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      const mappedId = idMapRef.current.get(nodeId) ?? nodeId;
      collab.dragStart(mappedId, position);
    },
    [collab]
  );

  const handleNodeDrag = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      const mappedId = idMapRef.current.get(nodeId) ?? nodeId;
      collab.dragMove(mappedId, position);
    },
    [collab]
  );

  const handleNodeDragEnd = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      const mappedId = idMapRef.current.get(nodeId) ?? nodeId;
      collab.dragEnd(mappedId, position);
    },
    [collab]
  );

  const toFlowPosition = useCallback(
    (clientX: number, clientY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) {
        return null;
      }
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      if (localX < 0 || localY < 0 || localX > rect.width || localY > rect.height) {
        return null;
      }
      return {
        x: (localX - viewport.x) / viewport.zoom,
        y: (localY - viewport.y) / viewport.zoom,
      };
    },
    [viewport]
  );

  const handlePaneMouseMove = useCallback(
    (position: { x: number; y: number }) => {
      if (!connectedRef.current) {
        return;
      }
      collab.updatePresence({
        cursor: position,
        cursorSpace: 'flow',
        viewport,
        userName: userId,
        color: userColor,
      });
    },
    [collab, userColor, userId, viewport]
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!connectedRef.current) {
        return;
      }
      const position = toFlowPosition(event.clientX, event.clientY);
      if (!position) {
        return;
      }
      collab.updatePresence({
        cursor: position,
        cursorSpace: 'flow',
        viewport,
        userName: userId,
        color: userColor,
      });
    },
    [collab, toFlowPosition, userColor, userId, viewport]
  );

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
    window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [handlePointerMove]);

  const handleViewportChange = useCallback(
    (nextViewport: { x: number; y: number; zoom: number }) => {
      setViewport(nextViewport);
      if (!connectedRef.current) {
        return;
      }
      collab.updatePresence({
        viewport: nextViewport,
        userName: userId,
        color: userColor,
      });
    },
    [collab, userColor, userId]
  );

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: { id: string }) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
      });
    },
    []
  );

  const sortNodesByLayer = useCallback((list: CanvasNodeData[]) => {
    const indexMap = new Map(list.map((node, index) => [node.id, index]));
    return [...list].sort((a, b) => {
      const aZ = typeof a.zIndex === 'number' ? a.zIndex : 0;
      const bZ = typeof b.zIndex === 'number' ? b.zIndex : 0;
      if (aZ !== bZ) {
        return aZ - bZ;
      }
      return (indexMap.get(a.id) ?? 0) - (indexMap.get(b.id) ?? 0);
    });
  }, []);

  const getLayerInfo = useCallback(
    (nodeId: string) => {
      const ordered = sortNodesByLayer(nodesRef.current);
      const index = ordered.findIndex((node) => node.id === nodeId);
      if (index === -1) {
        return { isTop: false, isBottom: false };
      }
      return {
        isTop: index === ordered.length - 1,
        isBottom: index === 0,
      };
    },
    [sortNodesByLayer]
  );

  const applyLayerAction = useCallback(
    (nodeId: string, action: 'forward' | 'backward' | 'front' | 'back') => {
      let pendingUpdates: Array<{ nodeId: string; updates: Partial<CanvasNodeData> }> = [];
      setNodes((prevNodes) => {
        if (prevNodes.length < 2) {
          return prevNodes;
        }
        const ordered = sortNodesByLayer(prevNodes);
        const index = ordered.findIndex((node) => node.id === nodeId);
        if (index === -1) {
          return prevNodes;
        }
        const nextOrder = [...ordered];
        if (action === 'forward') {
          if (index === ordered.length - 1) {
            return prevNodes;
          }
          [nextOrder[index], nextOrder[index + 1]] = [nextOrder[index + 1], nextOrder[index]];
        } else if (action === 'backward') {
          if (index === 0) {
            return prevNodes;
          }
          [nextOrder[index], nextOrder[index - 1]] = [nextOrder[index - 1], nextOrder[index]];
        } else if (action === 'front') {
          if (index === ordered.length - 1) {
            return prevNodes;
          }
          const [node] = nextOrder.splice(index, 1);
          nextOrder.push(node);
        } else if (action === 'back') {
          if (index === 0) {
            return prevNodes;
          }
          const [node] = nextOrder.splice(index, 1);
          nextOrder.unshift(node);
        }
        const zIndexMap = new Map(nextOrder.map((node, idx) => [node.id, idx]));
        const nextNodes = prevNodes.map((node) => {
          const nextZIndex = zIndexMap.get(node.id);
          if (nextZIndex === undefined || nextZIndex === node.zIndex) {
            return node;
          }
          pendingUpdates.push({
            nodeId: idMapRef.current.get(node.id) ?? node.id,
            updates: { zIndex: nextZIndex },
          });
          return { ...node, zIndex: nextZIndex };
        });
        return nextNodes;
      });
      if (pendingUpdates.length > 0) {
        collab.updateNodes(pendingUpdates);
      }
      setContextMenu(null);
    },
    [collab, sortNodesByLayer]
  );

  const handleCloneNode = useCallback(() => {
    if (!contextMenu) {
      return;
    }
    const source = nodesRef.current.find((node) => node.id === contextMenu.nodeId);
    if (!source) {
      setContextMenu(null);
      return;
    }
    const tempId = `temp_${generateId()}`;
    const clonedNode: CanvasNodeData = {
      ...source,
      id: tempId,
      position: {
        x: source.position.x + 24,
        y: source.position.y + 24,
      },
    };
    setNodes((prevNodes) => [...prevNodes, clonedNode]);
    collab.createNode(clonedNode, tempId);
    setContextMenu(null);
  }, [collab, contextMenu]);

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
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
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
          <div
            style={{
              minWidth: 180,
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: '8px 10px',
              background: '#f8fafc',
            }}
          >
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>
              在线用户 ({collab.presences.size})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
              {Array.from(collab.presences.entries()).map(([id, presence]) => (
                <div key={id} style={{ color: id === userId ? '#0f172a' : '#334155' }}>
                  {presence.userName || id}
                  {id === userId ? ' (你)' : ''}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>
      <div style={{ flex: 1, position: 'relative' }} ref={canvasRef}>
        {toasts.length > 0 && (
          <div
            style={{
              position: 'fixed',
              top: 20,
              right: 20,
              zIndex: 60,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {toasts.map((toast) => (
              <div
                key={toast.id}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: toast.variant === 'error' ? '#fee2e2' : '#fef3c7',
                  color: toast.variant === 'error' ? '#991b1b' : '#92400e',
                  fontSize: 13,
                  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.12)',
                }}
              >
                {toast.message}
              </div>
            ))}
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            transformOrigin: '0 0',
            zIndex: 55,
          }}
        >
          {Array.from(collab.presences.entries()).map(([id, presence]) => {
            const cursor = resolvePresenceCursor(presence);
            if (id === userId || !cursor) {
              return null;
            }
            const color = presence.color || '#2563eb';
            return (
              <div
                key={id}
                style={{
                  position: 'absolute',
                  left: cursor.x,
                  top: cursor.y,
                }}
              >
                <div
                  style={{
                    transform: `translate(8px, 8px) scale(${1 / viewport.zoom})`,
                    transformOrigin: '0 0',
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: color,
                      boxShadow: '0 0 0 2px #fff',
                    }}
                  />
                  <div
                    style={{
                      marginTop: 4,
                      padding: '2px 6px',
                      borderRadius: 8,
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      fontSize: 11,
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {presence.userName || id}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
        <div style={{ width: '100%', height: '100%' }}>
          <InfiniteCanvas
            nodes={nodes}
            onNodesChange={handleNodesChange}
            backgroundColor={backgroundColor}
            onPaneClick={handlePaneClick}
            onNodeDragStart={handleNodeDragStart}
            onNodeDrag={handleNodeDrag}
            onNodeDragEnd={handleNodeDragEnd}
            onNodeContextMenu={handleNodeContextMenu}
            onPaneMouseMove={handlePaneMouseMove}
            onViewportChange={handleViewportChange}
            paneCursor={activeTool === 'text' ? 'text' : undefined}
            config={{
              minZoom: 0.1,
              maxZoom: 4,
              defaultZoom: 0.8,
              snapToGrid: false,
            }}
          />
        </div>
        {contextMenu && (
          <div
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              zIndex: 50,
              background: '#fff',
              borderRadius: 10,
              border: '1px solid #e5e7eb',
              boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
              padding: 6,
              minWidth: 140,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {(() => {
              const layerInfo = getLayerInfo(contextMenu.nodeId);
              return (
                <>
                  <button
                    type="button"
                    disabled={layerInfo.isTop}
                    onClick={() => applyLayerAction(contextMenu.nodeId, 'forward')}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      border: 'none',
                      background: 'transparent',
                      cursor: layerInfo.isTop ? 'not-allowed' : 'pointer',
                      fontSize: 13,
                      color: layerInfo.isTop ? '#9ca3af' : '#111',
                    }}
                  >
                    上一层
                  </button>
                  <button
                    type="button"
                    disabled={layerInfo.isBottom}
                    onClick={() => applyLayerAction(contextMenu.nodeId, 'backward')}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      border: 'none',
                      background: 'transparent',
                      cursor: layerInfo.isBottom ? 'not-allowed' : 'pointer',
                      fontSize: 13,
                      color: layerInfo.isBottom ? '#9ca3af' : '#111',
                    }}
                  >
                    下一层
                  </button>
                  <button
                    type="button"
                    disabled={layerInfo.isTop}
                    onClick={() => applyLayerAction(contextMenu.nodeId, 'front')}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      border: 'none',
                      background: 'transparent',
                      cursor: layerInfo.isTop ? 'not-allowed' : 'pointer',
                      fontSize: 13,
                      color: layerInfo.isTop ? '#9ca3af' : '#111',
                    }}
                  >
                    最顶层
                  </button>
                  <button
                    type="button"
                    disabled={layerInfo.isBottom}
                    onClick={() => applyLayerAction(contextMenu.nodeId, 'back')}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      border: 'none',
                      background: 'transparent',
                      cursor: layerInfo.isBottom ? 'not-allowed' : 'pointer',
                      fontSize: 13,
                      color: layerInfo.isBottom ? '#9ca3af' : '#111',
                    }}
                  >
                    最底层
                  </button>
                  <div
                    style={{
                      height: 1,
                      background: '#e5e7eb',
                      margin: '6px 4px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleCloneNode}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    复制节点
                  </button>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </main>
  );
}
