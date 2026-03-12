import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
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
import './styles.css';
import type { CanvasNodeData, CanvasConfig, RawDataItem } from '@tc/infinite-core';
import { ImageNode, VideoNode, AudioNode, TextNode } from './nodes';
import { createWidgetEvent, widgetBridge } from './bridge';
import { isDev } from './utils/env';
import { CanvasControls } from './CanvasControls';

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
  onPaneContextMenu?: (event: React.MouseEvent) => void;
  onPaneMouseMove?: (position: { x: number; y: number }, event: React.MouseEvent) => void;
  onViewportChange?: (viewport: { x: number; y: number; zoom: number }) => void;
  onPaneClick?: (position: { x: number; y: number }, event: React.MouseEvent) => void;
  onNodeClick?: (nodeId: string) => void;
  paneCursor?: string;
  nodesDraggable?: boolean;
  elementsSelectable?: boolean;
  selectionOnDrag?: boolean;
  panOnDrag?: number[];
  onLockChange?: (locked: boolean) => void;
  isLocked?: boolean;
  showControls?: boolean;
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
  /** React Flow 实例就绪回调 */
  onReactFlowInit?: (instance: ReactFlowInstance<Node<CanvasNodeData>, Edge>) => void;
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
  onPaneContextMenu,
  onPaneMouseMove,
  onViewportChange,
  onPaneClick,
  onNodeClick: onNodeClickCallback,
  paneCursor,
  nodesDraggable = true,
  elementsSelectable = true,
  selectionOnDrag = true,
  panOnDrag = [1, 2],
  onLockChange,
  isLocked = false,
  showControls = true,
  className,
  style,
  backgroundColor = '#000000',
  width = '100%',
  height = '100%',
  minWidth = '300px',
  minHeight = '400px',
  onReactFlowInit,
}: InfiniteCanvasProps) {
  const [nodes, setNodes] = React.useState<Node<CanvasNodeData>[]>([]);
  const nodesRef = React.useRef<Node<CanvasNodeData>[]>([]);
  const pendingDeleteRef = React.useRef<Set<string>>(new Set());
  const [edges, setEdges] = React.useState<Edge[]>(initialEdges);
  const isInitialMount = React.useRef(true);
  const [snapLines, setSnapLines] = React.useState<SnapLines>(null);
  const [isNodeDragging, setIsNodeDragging] = React.useState(false);
  const [isPanDragging, setIsPanDragging] = React.useState(false);
  const [viewport, setViewport] = React.useState({ x: 0, y: 0, zoom: 1 });
  const reactFlowInstanceRef = React.useRef<ReactFlowInstance<Node<CanvasNodeData>, Edge> | null>(null);
  const [instanceReady, setInstanceReady] = React.useState(false);
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

  const getViewportFromInstance = useCallback(
    (instance: ReactFlowInstance<Node<CanvasNodeData>, Edge>) => {
      const viewportGetter = (instance as ReactFlowInstance<Node<CanvasNodeData>, Edge> & {
        getViewport?: () => { x: number; y: number; zoom: number };
        toObject?: () => { viewport?: { x: number; y: number; zoom: number } };
      });
      const viewport = viewportGetter.getViewport?.() ?? viewportGetter.toObject?.().viewport;
      if (!viewport) {
        return null;
      }
      return viewport;
    },
    []
  );

  const applyInitialFitView = useCallback(() => {
    const instance = reactFlowInstanceRef.current;
    if (!instance || fitViewAppliedRef.current || nodes.length === 0) {
      return;
    }
    instance.fitView({ padding: 0.2, duration: 0 });
    fitViewAppliedRef.current = true;
    const nextViewport = getViewportFromInstance(instance);
    if (!nextViewport) {
      return;
    }
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
  }, [getViewportFromInstance, nodes.length]);

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
              selected: node.selected, // 保留节点选择状态
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
    if (isDev()) {
      console.log('[InfiniteCanvas] request delete', {
        id: targetNode.id,
        type: targetNode.data?.type,
      });
    }
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
          if (isDev()) {
            console.warn('[InfiniteCanvas] confirm delete but node not found', { nodeId });
          }
          pendingDeleteRef.current.delete(nodeId);
          return prevNodes;
        }
        if (isDev()) {
          console.log('[InfiniteCanvas] confirm delete', { nodeId });
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
        if (isDev()) {
          console.log('[InfiniteCanvas] nodeData delete patch', { id });
        }
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
          // 如果 patch 包含 size，同步更新 node 的 width/height/measured
          if (dataPatch.size) {
            updatedNode.width = newData.size.width;
            updatedNode.height = newData.size.height;
            updatedNode.measured = {
              width: newData.size.width,
              height: newData.size.height,
            };
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
        if (isDev()) {
          console.log('[InfiniteCanvas] received NODE_DELETE_CONFIRM', { nodeId });
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
      // 多选模式下不允许删除节点（不论选中多少个都不可以）
      if (selectedNodes.length > 1) {
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
    if (isNodeDragging) {
      pane.style.cursor = 'move';
    } else if (paneCursor === 'grab' && isPanDragging) {
      pane.style.cursor = 'grabbing';
    } else {
      pane.style.cursor = paneCursor ?? '';
    }
  }, [paneCursor, isNodeDragging, isPanDragging]);

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
    // 计算节点结构签名，只包含节点ID、类型等结构性属性，排除position等动态属性
    // 这样可以避免在拖动时因position变化而触发重新初始化
    const nodeSignature = initialNodes
      .map((node) => `${node.id}:${node.type}:${node.size.width}:${node.size.height}`)
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
        selected: prevNode?.selected ?? node.selected ?? false,
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

  // 创建一个只包含需要同步属性的签名，避免因 selected 等其他属性变化触发不必要的更新
  const syncSignature = useMemo(() => {
    return initialNodes.map((node) => {
      const depFocus = (node as CanvasNodeData & { dependencyFocus?: boolean }).dependencyFocus ?? false;
      const zIndex = typeof node.zIndex === 'number' ? node.zIndex : 0;
      // 添加需要同步的属性到签名中
      const nodeAny = node as CanvasNodeData & { 
        rating?: number;
        fontSize?: number;
        fontWeight?: string;
        textAlign?: string;
        backgroundColor?: string;
        backgroundOpacity?: number;
        fontFamily?: string;
        color?: string;
        content?: string;
        raw?: { status?: string };
      };
      const rating = nodeAny.rating ?? 0;
      const fontSize = nodeAny.fontSize ?? 0;
      const fontWeight = nodeAny.fontWeight ?? '';
      const textAlign = nodeAny.textAlign ?? '';
      const backgroundColor = nodeAny.backgroundColor ?? '';
      const backgroundOpacity = nodeAny.backgroundOpacity ?? 1;
      const fontFamily = nodeAny.fontFamily ?? '';
      const color = nodeAny.color ?? '';
      const content = nodeAny.content ?? '';
      const url = node.url ?? '';
      const rawStatus = String(nodeAny.raw?.status ?? '');
      return `${node.id}:${Math.round(node.position.x * 10)}:${Math.round(node.position.y * 10)}:${depFocus}:${zIndex}:${rating}:${fontSize}:${fontWeight}:${textAlign}:${backgroundColor}:${backgroundOpacity}:${fontFamily}:${color}:${content}:${url}:${rawStatus}`;
    }).join('|');
  }, [initialNodes]);

  // 同步外部状态更新到 React Flow 内部状态
  // 这个 useEffect 专门处理位置和 dependencyFocus 的变化
  React.useEffect(() => {
    if (!initializedRef.current) {
      return; // 等待初始化完成
    }
    
    // 使用 setNodes 的函数形式来访问当前状态，避免 nodes 作为依赖项导致循环
    setNodes((currentNodes) => {
      const nodeUpdates: Array<{ id: string; position: { x: number; y: number }; initialNode: CanvasNodeData }> = [];
      
      initialNodes.forEach((initialNode) => {
        const flowNode = currentNodes.find((n) => n.id === initialNode.id);
        if (flowNode) {
          // 如果节点当前正在被拖动，完全跳过（避免干扰用户操作）
          if (flowNode.dragging) {
            return;
          }
          
          // 检查位置变化
          const dx = Math.abs(flowNode.position.x - initialNode.position.x);
          const dy = Math.abs(flowNode.position.y - initialNode.position.y);
          const posChanged = dx > 0.1 || dy > 0.1;
          
          // 检查 dependencyFocus 变化
          const flowDependencyFocus = (flowNode.data as CanvasNodeData & { dependencyFocus?: boolean }).dependencyFocus;
          const initialDependencyFocus = (initialNode as CanvasNodeData & { dependencyFocus?: boolean }).dependencyFocus;
          const dependencyFocusChanged = flowDependencyFocus !== initialDependencyFocus;
          
          // 检查 zIndex 变化
          const flowZIndex = typeof flowNode.zIndex === 'number' ? flowNode.zIndex : 0;
          const initialZIndex = typeof initialNode.zIndex === 'number' ? initialNode.zIndex : 0;
          const zIndexChanged = flowZIndex !== initialZIndex;
          
          // 检查 rating 变化
          const flowRating = (flowNode.data as CanvasNodeData & { rating?: number }).rating ?? 0;
          const initialRating = (initialNode as CanvasNodeData & { rating?: number }).rating ?? 0;
          const ratingChanged = flowRating !== initialRating;
          
          // 检查文本样式属性变化
          const flowData = flowNode.data as CanvasNodeData & { 
            fontSize?: number; fontWeight?: string; textAlign?: string; 
            backgroundColor?: string; backgroundOpacity?: number; 
            fontFamily?: string; color?: string; content?: string;
          };
          const initialData = initialNode as CanvasNodeData & { 
            fontSize?: number; fontWeight?: string; textAlign?: string; 
            backgroundColor?: string; backgroundOpacity?: number; 
            fontFamily?: string; color?: string; content?: string;
          };
          const textStyleChanged = 
            (flowData.fontSize ?? 0) !== (initialData.fontSize ?? 0) ||
            (flowData.fontWeight ?? '') !== (initialData.fontWeight ?? '') ||
            (flowData.textAlign ?? '') !== (initialData.textAlign ?? '') ||
            (flowData.backgroundColor ?? '') !== (initialData.backgroundColor ?? '') ||
            (flowData.backgroundOpacity ?? 1) !== (initialData.backgroundOpacity ?? 1) ||
            (flowData.fontFamily ?? '') !== (initialData.fontFamily ?? '') ||
            (flowData.color ?? '') !== (initialData.color ?? '') ||
            (flowData.content ?? '') !== (initialData.content ?? '');

          const urlChanged = (flowNode.data as CanvasNodeData).url !== initialNode.url;
          const flowRaw = (flowNode.data as CanvasNodeData & { raw?: { status?: string } }).raw;
          const initialRaw = (initialNode as CanvasNodeData & { raw?: { status?: string } }).raw;
          const rawStatusChanged = String(flowRaw?.status ?? '') !== String(initialRaw?.status ?? '');
          
          if (posChanged || dependencyFocusChanged || zIndexChanged || ratingChanged || textStyleChanged || urlChanged || rawStatusChanged) {
            nodeUpdates.push({
              id: initialNode.id,
              position: initialNode.position,
              initialNode: initialNode,
            });
          }
        }
      });
      
      if (nodeUpdates.length === 0) {
        return currentNodes; // 没有变化，返回原数组避免重渲染
      }
      
      return currentNodes.map((node) => {
        const update = nodeUpdates.find((u) => u.id === node.id);
        if (update) {
          // 保留现有 data 中的回调函数（如 onNodeDataChange），只更新需要同步的属性
          const existingData = node.data as CanvasNodeData & { onNodeDataChange?: unknown };
          const { onNodeDataChange } = existingData;
          return {
            ...node,
            position: update.position,
            zIndex: update.initialNode.zIndex, // 同步 zIndex
            // 保留当前的 selected 状态，不从 initialNodes 同步
            data: {
              ...update.initialNode,
              onNodeDataChange, // 保留回调函数
            } as CanvasNodeData,
          };
        }
        return node;
      });
    });
  }, [syncSignature, initialNodes]);

  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges]);

  React.useEffect(() => {
    if (!instanceReady || nodes.length === 0) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      applyInitialFitView();
    });
    return () => cancelAnimationFrame(frame);
  }, [applyInitialFitView, instanceReady, nodes.length]);

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

  // 合并容器样式（拖拽素材时显示四向箭头 move 光标）
  const containerStyle: React.CSSProperties = {
    width,
    height,
    minWidth,
    minHeight,
    backgroundColor,
    position: 'relative',
    cursor: isNodeDragging ? 'move' : (paneCursor === 'grab' && isPanDragging ? 'grabbing' : paneCursor),
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
        style={{ 
          width: '100%', 
          height: '100%', 
          backgroundColor,
          // Override React Flow default background
          '--xy-background-color-default': backgroundColor,
        } as any}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeDragStart={(_, node) => {
          setIsNodeDragging(true);
          document.body.style.cursor = 'move';
          onNodeDragStart?.(node.id, node.position);
        }}
        onNodeDrag={(_, node) => {
          const selectedNodeIds = nodes.filter(n => n.selected).map(n => n.id);
          onNodeDrag?.(node.id, node.position, selectedNodeIds.length > 1 ? selectedNodeIds : undefined);
        }}
        onNodeDragStop={(_, node) => {
          setIsNodeDragging(false);
          document.body.style.cursor = '';
          setSnapLines(null);
          onNodeDragEnd?.(node.id, node.position);
        }}
        onNodeContextMenu={(event, node) => {
          if (!onNodeContextMenu) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          onNodeContextMenu(event, node);
        }}
        onPaneContextMenu={(event) => {
          if (!onPaneContextMenu) {
            return;
          }
          onPaneContextMenu(event as unknown as React.MouseEvent);
        }}
        deleteKeyCode={null}
        onMoveStart={() => {
          setIsPanDragging(true);
        }}
        onMoveEnd={(_, nextViewport) => {
          setIsPanDragging(false);
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
          setInstanceReady(true);
          onReactFlowInit?.(instance);
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
        onNodeClick={(_, node) => {
          onNodeClickCallback?.(node.id);
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
        nodeDragThreshold={5}
        selectNodesOnDrag={true}
        selectionOnDrag={selectionOnDrag}
        selectionMode={SelectionMode.Full}
        elevateNodesOnSelect={false}
        panOnDrag={panOnDrag}
        panOnScroll={true}
        zoomOnScroll={false}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        zoomActivationKeyCode="Meta"
        panOnScrollSpeed={1}
        colorMode="dark"
        proOptions={{
          hideAttribution: true,
        }}
      >
        {showControls && (
          <CanvasControls
            position="bottom-left"
            isLocked={isLocked}
            onLockChange={onLockChange}
          />
        )}
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
                borderLeft: '1px dashed rgba(255,255,255,0.2)',
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
                borderTop: '1px dashed rgba(255,255,255,0.2)',
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
