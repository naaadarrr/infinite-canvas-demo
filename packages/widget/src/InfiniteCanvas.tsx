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
import type { CanvasNodeData, CanvasConfig } from '@tc/infinite-core';
import { ImageNode, VideoNode, AudioNode, TextNode } from './nodes';

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
  onNodeDrag?: (nodeId: string, position: { x: number; y: number }) => void;
  onNodeDragEnd?: (nodeId: string, position: { x: number; y: number }) => void;
  onNodeContextMenu?: (event: React.MouseEvent, node: Node<CanvasNodeData>) => void;
  onPaneMouseMove?: (position: { x: number; y: number }, event: React.MouseEvent) => void;
  onViewportChange?: (viewport: { x: number; y: number; zoom: number }) => void;
  onPaneClick?: (position: { x: number; y: number }, event: React.MouseEvent) => void;
  paneCursor?: string;
  className?: string;
  style?: React.CSSProperties;
  backgroundColor?: string;
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
  className,
  style,
  backgroundColor = '#f5f5f5',
}: InfiniteCanvasProps) {
  const [nodes, setNodes] = React.useState<Node<CanvasNodeData>[]>([]);
  const [edges, setEdges] = React.useState<Edge[]>(initialEdges);
  const isInitialMount = React.useRef(true);
  const [snapLines, setSnapLines] = React.useState<SnapLines>(null);
  const [viewport, setViewport] = React.useState({ x: 0, y: 0, zoom: 1 });
  const reactFlowInstanceRef = React.useRef<ReactFlowInstance<Node<CanvasNodeData>, Edge> | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const fitViewAppliedRef = React.useRef(false);
  const lastViewportNotifiedRef = React.useRef(viewport);

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

  const handleNodeDataUpdate = useCallback(
    (id: string, dataPatch: CanvasNodeDataPatch) => {
      // 检查是否是删除操作
      if ((dataPatch as any)._delete) {
        setNodes((prevNodes) => {
          const filteredNodes = prevNodes.filter((node) => node.id !== id);
          emitNodesChange(filteredNodes);
          return filteredNodes;
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
    [emitNodesChange]
  );

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
      } as Node<CanvasNodeData>;
    });
    
    setNodes(flowNodes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNodes]);

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
      const snapThreshold = config.snapThreshold ?? 5;
      const snapToNodes = config.snapToNodes ?? true;
      const showSnapLines = config.showSnapLines ?? true;
      let nextSnapLines: SnapLines = null;
      
      // 检查是否有正在拖动的节点
      const hasDraggingChange = changes.some(
        (change) => change.type === 'position' && 'dragging' in change && change.dragging === true
      );

      const nextChanges = changes.map((change) => {
        // 只在正在拖动时应用 snap，拖动结束时不应用
        if (
          !snapToNodes ||
          change.type !== 'position' ||
          !('position' in change) ||
          !change.position ||
          !('dragging' in change) ||
          change.dragging !== true  // 明确检查是否正在拖动
        ) {
          return change;
        }

        const movingNode = nodes.find((node) => node.id === change.id);
        if (!movingNode) {
          return change;
        }

        const otherNodes = nodes.filter((node) => node.id !== change.id);
        const snapped = getSnappedPosition(change.position, movingNode, otherNodes, snapThreshold);
        if (snapped.snapLines && (snapped.snapLines.x !== undefined || snapped.snapLines.y !== undefined)) {
          nextSnapLines = snapped.snapLines;
        }

        return {
          ...change,
          position: snapped.position,
        };
      });

      if (showSnapLines && hasDraggingChange && nextSnapLines) {
        setSnapLines(nextSnapLines);
      } else {
        setSnapLines(null);
      }

      setNodes((nds) => {
        const updatedNodes = applyNodeChanges(nextChanges, nds) as Node<CanvasNodeData>[];
        const syncedNodes = updatedNodes.map(syncNodeDataSize);
        
        // 延迟通知外部节点变化，避免在渲染期间调用 setState
        emitNodesChange(syncedNodes);
        
        return syncedNodes;
      });
    },
    [config.snapThreshold, config.snapToNodes, config.showSnapLines, nodes, emitNodesChange, syncNodeDataSize]
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

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', backgroundColor, position: 'relative', ...style }}
    >
      <ReactFlow<Node<CanvasNodeData>, Edge>
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
          onNodeDrag?.(node.id, node.position);
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
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        nodeDragThreshold={1}
        selectNodesOnDrag={false}
        selectionOnDrag={true}
        selectionMode={SelectionMode.Full}
        elevateNodesOnSelect={false}
        panOnDrag={[1, 2]}
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
