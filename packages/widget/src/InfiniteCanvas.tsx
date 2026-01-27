import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Node,
  Edge,
  ReactFlowInstance,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { CanvasNodeData, CanvasConfig, RawDataItem } from '@tc/infinite-core';
import { ImageNode, VideoNode, AudioNode, TextNode } from './nodes';
import { createWidgetEvent, widgetBridge } from './bridge';

type SnapLines = { x?: number; y?: number } | null;
type CanvasNodeDataPatch = Partial<Omit<CanvasNodeData, 'type'>>;

const getNodeRect = (position: { x: number; y: number }, size: { width: number; height: number }) => {
  const centerX = position.x + size.width / 2;
  const centerY = position.y + size.height / 2;
  return {
    left: position.x,
    right: position.x + size.width,
    top: position.y,
    bottom: position.y + size.height,
    centerX,
    centerY,
  };
};

const getSnappedPosition = (
  position: { x: number; y: number },
  node: Node<CanvasNodeData>,
  otherNodes: Node<CanvasNodeData>[],
  threshold: number
) => {
  const size = node.data.size;
  const rect = getNodeRect(position, size);
  let snappedX = position.x;
  let snappedY = position.y;
  let snapLineX: number | undefined;
  let snapLineY: number | undefined;
  let bestXDelta = threshold + 1;
  let bestYDelta = threshold + 1;

  otherNodes.forEach((other) => {
    const otherRect = getNodeRect(other.position, other.data.size);

    const xCandidates = [
      { delta: otherRect.left - rect.left, line: otherRect.left },
      { delta: otherRect.centerX - rect.centerX, line: otherRect.centerX },
      { delta: otherRect.right - rect.right, line: otherRect.right },
    ];

    xCandidates.forEach(({ delta, line }) => {
      const absDelta = Math.abs(delta);
      if (absDelta <= threshold && absDelta < bestXDelta) {
        bestXDelta = absDelta;
        snappedX = position.x + delta;
        snapLineX = line;
      }
    });

    const yCandidates = [
      { delta: otherRect.top - rect.top, line: otherRect.top },
      { delta: otherRect.centerY - rect.centerY, line: otherRect.centerY },
      { delta: otherRect.bottom - rect.bottom, line: otherRect.bottom },
    ];

    yCandidates.forEach(({ delta, line }) => {
      const absDelta = Math.abs(delta);
      if (absDelta <= threshold && absDelta < bestYDelta) {
        bestYDelta = absDelta;
        snappedY = position.y + delta;
        snapLineY = line;
      }
    });
  });

  return {
    position: { x: snappedX, y: snappedY },
    snapLines: { x: snapLineX, y: snapLineY } as SnapLines,
  };
};

export interface InfiniteCanvasProps {
  nodes: CanvasNodeData[];
  edges?: Edge[];
  config?: CanvasConfig;
  onNodesChange?: (nodes: CanvasNodeData[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  onNodeDragStart?: (nodeId: string, position: { x: number; y: number }) => void;
  onNodeDrag?: (nodeId: string, position: { x: number; y: number }, selectedNodeIds?: string[]) => void;
  onNodeDragEnd?: (nodeId: string, position: { x: number; y: number }) => void;
  onNodeContextMenu?: (event: React.MouseEvent, node: Node<CanvasNodeData>) => void;
  onPaneMouseMove?: (position: { x: number; y: number }, event: React.MouseEvent) => void;
  onViewportChange?: (viewport: { x: number; y: number; zoom: number }) => void;
  onPaneClick?: (position: { x: number; y: number }, event: React.MouseEvent) => void;
  paneCursor?: string;
  nodesDraggable?: boolean;
  elementsSelectable?: boolean;
  selectionOnDrag?: boolean;
  panOnDrag?: number[];
  className?: string;
  style?: React.CSSProperties;
  backgroundColor?: string;
  /** 画布宽度，默认 '100%'。当嵌入到业务方 UI 时，建议明确指定或确保父容器有明确宽度 */
  width?: string | number;
  /** 画布高度，默认 '100%'。当嵌入到业务方 UI 时，建议明确指定或确保父容器有明确高度 */
  height?: string | number;
  /** 最小宽度，默认 '300px' */
  minWidth?: string | number;
  /** 最小高度，默认 '400px' */
  minHeight?: string | number;
}

export function InfiniteCanvas({
  nodes: initialNodes,
  edges: initialEdges = [],
  config = {},
  onNodesChange: onNodesChangeCallback,
  onEdgesChange: onEdgesChangeCallback,
  onNodeDragStart,
  onNodeDrag,
  onNodeDragEnd,
  onNodeContextMenu,
  onPaneMouseMove,
  onViewportChange,
  onPaneClick,
  paneCursor,
  nodesDraggable = true,
  elementsSelectable = true,
  selectionOnDrag = true,
  panOnDrag = [1, 2],
  className,
  style,
  backgroundColor = '#f5f5f5',
  width = '100%',
  height = '100%',
  minWidth = '300px',
  minHeight = '400px',
}: InfiniteCanvasProps) {
  const [nodes, setNodes] = React.useState<Node<CanvasNodeData>[]>([]);
  const nodesRef = React.useRef<Node<CanvasNodeData>[]>([]);
  const pendingDeleteRef = React.useRef<Set<string>>(new Set());
  const [edges, setEdges] = React.useState<Edge[]>(initialEdges);
  const isInitialMount = React.useRef(true);
  const [snapLines, setSnapLines] = React.useState<SnapLines>(null);
  const [viewport, setViewport] = React.useState({ x: 0, y: 0, zoom: 1 });
  const reactFlowInstanceRef = React.useRef<ReactFlowInstance<Node<CanvasNodeData>, Edge> | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const fitViewAppliedRef = React.useRef(false);
  const lastViewportNotifiedRef = React.useRef(viewport);
  const snapPositionRef = React.useRef<Map<string, { x: number; y: number }>>(new Map());

  // 使用 ref 追踪是否已初始化，避免重复设置
  const initializedRef = React.useRef(false);
  const initialNodesSignatureRef = React.useRef<string>('');
  const defaultViewport = useMemo(
    () => ({ x: 0, y: 0, zoom: config.defaultZoom || 1 }),
    [config.defaultZoom]
  );

  const emitNodesChange = useCallback(
    (nextNodes: Node<CanvasNodeData>[]) => {
      if (onNodesChangeCallback && !isInitialMount.current) {
        setTimeout(() => {
          const canvasNodes: CanvasNodeData[] = nextNodes.map((node) => {
            const { onNodeDataChange: _ignore, ...nodeData } = node.data as CanvasNodeData & {
              onNodeDataChange?: unknown;
            };
            return {
              ...nodeData,
              position: node.position,
              zIndex: node.zIndex,
            } as CanvasNodeData;
          });
          onNodesChangeCallback(canvasNodes);
        }, 0);
      }
    },
    [onNodesChangeCallback]
  );

  const requestDeleteNode = useCallback((targetNode: Node<CanvasNodeData>) => {
    if (pendingDeleteRef.current.has(targetNode.id)) {
      return;
    }
    pendingDeleteRef.current.add(targetNode.id);
    const { onNodeDataChange: _ignore, ...nodeSnapshot } = targetNode.data as CanvasNodeData & {
      onNodeDataChange?: unknown;
    };
    widgetBridge.emit(
      createWidgetEvent(
        'NODE_DELETE_REQUEST',
        {
          nodeId: targetNode.id,
          nodeType: targetNode.data.type,
          node: nodeSnapshot,
        },
        { source: 'ui' }
      )
    );
  }, []);

  const confirmDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((prevNodes) => {
        const nextNodes = prevNodes.filter((node) => node.id !== nodeId);
        if (nextNodes.length === prevNodes.length) {
          pendingDeleteRef.current.delete(nodeId);
          return prevNodes;
        }
        emitNodesChange(nextNodes);
        pendingDeleteRef.current.delete(nodeId);
        return nextNodes;
      });
    },
    [emitNodesChange]
  );

  const syncNodeDataSize = useCallback((node: Node<CanvasNodeData>) => {
    const width = node.width ?? node.data.size.width;
    const height = node.height ?? node.data.size.height;
    if (width === node.data.size.width && height === node.data.size.height) {
      return node;
    }
    
    return {
      ...node,
      data: {
        ...node.data,
        size: { width, height },
      },
    } as Node<CanvasNodeData>;
  }, []);

  const isSkeletonNode = useCallback((node: Node<CanvasNodeData>) => {
    const raw = (node.data as CanvasNodeData & { raw?: RawDataItem }).raw;
    return String(raw?.status ?? '').toLowerCase() === 'init';
  }, []);

  const handleNodeDataUpdate = useCallback(
    (id: string, dataPatch: CanvasNodeDataPatch) => {
      // 检查是否是删除操作
      if ((dataPatch as any)._delete) {
        setNodes((prevNodes) => {
          const target = prevNodes.find((node) => node.id === id);
          if (target) {
            requestDeleteNode(target);
          }
          return prevNodes;
        });
        return;
      }

      setNodes((prevNodes) => {
        const updatedNodes = prevNodes.map((node) => {
          if (node.id !== id) {
            return node;
          }
          const newData = {
            ...node.data,
            ...dataPatch,
            type: node.data.type,
          } as CanvasNodeData;
          
          const updatedNode: Node<CanvasNodeData> = {
            ...node,
            data: newData,
          };
          // 如果 patch 包含 size，同步更新 node 的 width/height
          if (dataPatch.size) {
            updatedNode.width = newData.size.width;
            updatedNode.height = newData.size.height;
          }
          // 如果 patch 包含 position，同步更新 node 的 position
          if (dataPatch.position) {
            const pos = dataPatch.position as { x: number; y: number };
            updatedNode.position = {
              x: pos.x,
              y: pos.y,
            };
          }
          return updatedNode;
        });
        // 不需要再调用 syncNodeDataSize，因为我们已经同步了尺寸
        emitNodesChange(updatedNodes);
        return updatedNodes;
      });
    },
    [emitNodesChange, requestDeleteNode]
  );

  React.useEffect(() => {
    nodesRef.current = nodes;
    if (pendingDeleteRef.current.size > 0) {
      const existingIds = new Set(nodes.map((node) => node.id));
      pendingDeleteRef.current.forEach((id) => {
        if (!existingIds.has(id)) {
          pendingDeleteRef.current.delete(id);
        }
      });
    }
  }, [nodes]);

  React.useEffect(() => {
    const unsubscribe = widgetBridge.onCommand<{ nodeId?: string } | string>(
      'NODE_DELETE_CONFIRM',
      (payload) => {
        if (!payload) {
          return;
        }
        const nodeId = typeof payload === 'string' ? payload : payload.nodeId;
        if (typeof nodeId !== 'string') {
          return;
        }
        confirmDeleteNode(nodeId);
      }
    );
    return () => {
      unsubscribe();
    };
  }, [confirmDeleteNode]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName?.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || target.isContentEditable) {
          return;
        }
      }
      const selectedNodes = nodesRef.current.filter((node) => node.selected);
      if (selectedNodes.length === 0) {
        return;
      }
      selectedNodes.forEach((node) => requestDeleteNode(node));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [requestDeleteNode]);

  const updatePaneCursor = useCallback(() => {
    const pane = containerRef.current?.querySelector('.react-flow__pane') as HTMLElement | null;
    if (!pane) {
      return;
    }
    pane.style.cursor = paneCursor ?? '';
  }, [paneCursor]);

  React.useEffect(() => {
    updatePaneCursor();
  }, [updatePaneCursor]);

  React.useEffect(() => {
    if (!onViewportChange) {
      return;
    }
    const last = lastViewportNotifiedRef.current;
    if (last.x === viewport.x && last.y === viewport.y && last.zoom === viewport.zoom) {
      return;
    }
    lastViewportNotifiedRef.current = viewport;
    onViewportChange(viewport);
  }, [onViewportChange, viewport]);
  
  // 仅在初始化或节点列表实质性变化时设置节点
  React.useEffect(() => {
    // 计算节点 ID 列表的哈希，用于检测实质性变化
    const nodeSignature = initialNodes
      .map((node) => JSON.stringify(node))
      .sort()
      .join('|');

    // 如果节点签名没有变化，跳过更新
    if (initializedRef.current && nodeSignature === initialNodesSignatureRef.current) {
      return;
    }
    
    initialNodesSignatureRef.current = nodeSignature;
    initializedRef.current = true;
    
    const prevNodeMap = new Map(nodes.map((n) => [n.id, n]));
    
    const flowNodes: Node<CanvasNodeData>[] = initialNodes.map((node) => {
      const prevNode = prevNodeMap.get(node.id);
      return {
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          ...node,
          onNodeDataChange: handleNodeDataUpdate,
        } as CanvasNodeData,
        zIndex: node.zIndex,
        selected: prevNode?.selected ?? false,
        dragging: prevNode?.dragging ?? false,
        width: node.size.width,
        height: node.size.height,
        measured: prevNode?.measured ?? {
          width: node.size.width,
          height: node.size.height,
        },
      } as Node<CanvasNodeData>;
    });
    
    setNodes(flowNodes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNodes]);

  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges]);

  React.useEffect(() => {
    const instance = reactFlowInstanceRef.current;
    if (!instance || fitViewAppliedRef.current || nodes.length === 0) {
      return;
    }
    instance.fitView({ padding: 0.2, duration: 0 });
    fitViewAppliedRef.current = true;
  }, [nodes.length]);

  // 节点类型映射
  const nodeTypes = useMemo(
    () => ({
      image: ImageNode as any,
      video: VideoNode as any,
      audio: AudioNode as any,
      text: TextNode as any,
    }),
    []
  );

  // 处理节点变化
  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      const nextChanges = changes.filter((change) => {
        if (change.type !== 'remove') {
          return true;
        }
        const target = nodes.find((node) => node.id === change.id);
        if (!target) {
          return true;
        }
        return !isSkeletonNode(target);
      });
      const snapThreshold = config.snapThreshold ?? 5;
      const snapToNodes = config.snapToNodes ?? true;
      const showSnapLines = config.showSnapLines ?? true;
      let nextSnapLines: SnapLines = null;
      
      // 检查是否有正在拖动的节点
      const hasDraggingChange = nextChanges.some(
        (change) => change.type === 'position' && 'dragging' in change && change.dragging === true
      );

      const mappedChanges = nextChanges.map((change) => {
        if (
          !snapToNodes ||
          change.type !== 'position' ||
          !('position' in change) ||
          !change.position ||
          !('dragging' in change) ||
          typeof change.dragging !== 'boolean'
        ) {
          return change;
        }

        const movingNode = nodes.find((node) => node.id === change.id);
        if (!movingNode) {
          return change;
        }

        const otherNodes = nodes.filter((node) => node.id !== change.id);
        const snapped = getSnappedPosition(change.position, movingNode, otherNodes, snapThreshold);
        const hasSnap =
          snapped.snapLines && (snapped.snapLines.x !== undefined || snapped.snapLines.y !== undefined);

        if (change.dragging === true) {
          if (hasSnap) {
            nextSnapLines = snapped.snapLines;
            snapPositionRef.current.set(change.id, snapped.position);
          } else {
            snapPositionRef.current.delete(change.id);
          }

          return {
            ...change,
            position: snapped.position,
          };
        }

        if (change.dragging === false) {
          const snappedPosition = snapPositionRef.current.get(change.id);
          if (snappedPosition) {
            snapPositionRef.current.delete(change.id);
            return {
              ...change,
              position: snappedPosition,
            };
          }
        }

        return change;
      });

      if (showSnapLines && hasDraggingChange && nextSnapLines) {
        setSnapLines(nextSnapLines);
      } else {
        setSnapLines(null);
      }

      setNodes((nds) => {
        const updatedNodes = applyNodeChanges(mappedChanges, nds) as Node<CanvasNodeData>[];
        const syncedNodes = updatedNodes.map(syncNodeDataSize);
        
        // 延迟通知外部节点变化，避免在渲染期间调用 setState
        emitNodesChange(syncedNodes);
        
        return syncedNodes;
      });
    },
    [
      config.snapThreshold,
      config.snapToNodes,
      config.showSnapLines,
      emitNodesChange,
      isSkeletonNode,
      nodes,
      syncNodeDataSize,
    ]
  );

  // 标记初始挂载完成
  React.useEffect(() => {
    isInitialMount.current = false;
  }, []);

  // 处理边变化
  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => {
        const updatedEdges = applyEdgeChanges(changes, eds);
        
        if (onEdgesChangeCallback && !isInitialMount.current) {
          setTimeout(() => {
            onEdgesChangeCallback(updatedEdges);
          }, 0);
        }
        
        return updatedEdges;
      });
    },
    [onEdgesChangeCallback]
  );

  // 处理连接
  const handleConnect: OnConnect = useCallback(
    (connection) => {
      setEdges((eds) => {
        const updatedEdges = addEdge(connection, eds);
        
        if (onEdgesChangeCallback) {
          setTimeout(() => {
            onEdgesChangeCallback(updatedEdges);
          }, 0);
        }
        
        return updatedEdges;
      });
    },
    [onEdgesChangeCallback]
  );

  // 合并容器样式
  const containerStyle: React.CSSProperties = {
    width,
    height,
    minWidth,
    minHeight,
    backgroundColor,
    position: 'relative',
    ...style,
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={containerStyle}
    >
      <style>
        {`
          @keyframes dependency-edge-dash {
            0% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: 4.51056px; }
          }
          .dependency-edge-animated path {
            animation: dependency-edge-dash 1.4s linear infinite;
          }
        `}
      </style>
      <ReactFlow<Node<CanvasNodeData>, Edge>
        style={{ width: '50vh', height: '50vh' }}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeDragStart={(_, node) => {
          onNodeDragStart?.(node.id, node.position);
        }}
        onNodeDrag={(_, node) => {
          // 获取所有选中的节点ID
          const selectedNodeIds = nodes.filter(n => n.selected).map(n => n.id);
          onNodeDrag?.(node.id, node.position, selectedNodeIds.length > 1 ? selectedNodeIds : undefined);
        }}
        onNodeDragStop={(_, node) => {
          setSnapLines(null);
          onNodeDragEnd?.(node.id, node.position);
        }}
        onNodeContextMenu={(event, node) => {
          if (!onNodeContextMenu) {
            return;
          }
          onNodeContextMenu(event, node);
        }}
        deleteKeyCode={null}
        onMoveEnd={(_, nextViewport) => {
          setViewport((prevViewport) => {
            if (
              prevViewport.x === nextViewport.x &&
              prevViewport.y === nextViewport.y &&
              prevViewport.zoom === nextViewport.zoom
            ) {
              return prevViewport;
            }
            return nextViewport;
          });
        }}
        onInit={(instance) => {
          reactFlowInstanceRef.current = instance;
        }}
        onPaneMouseEnter={updatePaneCursor}
        onPaneMouseMove={(event) => {
          updatePaneCursor();
          if (!onPaneMouseMove) {
            return;
          }
          const point = { x: event.clientX, y: event.clientY };
          if (reactFlowInstanceRef.current?.screenToFlowPosition) {
            onPaneMouseMove(reactFlowInstanceRef.current.screenToFlowPosition(point), event);
            return;
          }
          onPaneMouseMove(point, event);
        }}
        onPaneClick={(event) => {
          if (!onPaneClick) {
            return;
          }
          const point = { x: event.clientX, y: event.clientY };
          if (reactFlowInstanceRef.current?.screenToFlowPosition) {
            onPaneClick(reactFlowInstanceRef.current.screenToFlowPosition(point), event);
            return;
          }
          onPaneClick(point, event);
        }}
        minZoom={config.minZoom || 0.1}
        maxZoom={config.maxZoom || 4}
        defaultViewport={defaultViewport}
        snapToGrid={config.snapToGrid || false}
        snapGrid={config.gridSize ? [config.gridSize, config.gridSize] : undefined}
        fitView={false}
        nodesDraggable={nodesDraggable}
        nodesConnectable={false}
        elementsSelectable={elementsSelectable}
        nodeDragThreshold={1}
        selectNodesOnDrag={false}
        selectionOnDrag={selectionOnDrag}
        selectionMode={SelectionMode.Full}
        elevateNodesOnSelect={false}
        panOnDrag={panOnDrag}
        panOnScroll={true}
        zoomOnScroll={false}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        panOnScrollSpeed={0.5}
        proOptions={{
          hideAttribution: true,
        }}
      >
        <Controls />
        <MiniMap />
      </ReactFlow>
      {snapLines && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {snapLines.x !== undefined && (
            <div
              style={{
                position: 'absolute',
                left: snapLines.x,
                top: -10000,
                height: 20000,
                borderLeft: '1px dashed #ddd',
              }}
            />
          )}
          {snapLines.y !== undefined && (
            <div
              style={{
                position: 'absolute',
                top: snapLines.y,
                left: -10000,
                width: 20000,
                borderTop: '1px dashed #ddd',
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
