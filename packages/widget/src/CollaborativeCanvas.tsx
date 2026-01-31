import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CanvasConfig, CanvasNodeData, LayoutConfig, RawDataItem } from '@tc/infinite-core';
import { NodeType, generateId, parseRawData } from '@tc/infinite-core';
import type { Edge } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import type { CollaborationState, ServerMessage, UserPresence } from './hooks';
import { useCollaboration } from './hooks';
import { InfiniteCanvas } from './InfiniteCanvas';
import { createWidgetEvent, widgetBridge } from './bridge';
import { DependencyFocusProvider } from './nodes/DependencyFocusContext';
import { BoardTaskItem } from '@tc/infinite-core';
import { EditModeIcon, LockModeIcon, PanModeIcon, TextModeIcon } from './icons';
import { CanvasRoleProvider } from './CanvasRoleContext';

const DEFAULT_SUBCANVAS_KEY = '__default__';
const FLOW_UI = {
  canvasBg: '#121417',
  panelBg: '#1c1e22',
  panelBorder: 'rgba(255,255,255,0.03)',
  panelShadow: '0 4px 16px rgba(0,0,0,0.2)',
  panelHighlight: 'rgba(255,255,255,0.08)',
  panelText: '#ffffff',
  panelTextMuted: 'rgba(255,255,255,0.7)',
  panelTextDisabled: 'rgba(255,255,255,0.35)',
  divider: 'rgba(255,255,255,0.08)',
  danger: '#ef4444',
};

type SubCanvasInfo = {
  id: string;
  status: 'unread' | 'read';
  origin: { x: number; y: number };
  groupKey: string;
  anchorNodeId?: string;
};

export interface CollaborativeCanvasProps {
  canvasId?: string | null;
  userId?: string;
  userName?: string;
  seedNodes?: CanvasNodeData[];
  rawData?: BoardTaskItem[];
  layoutConfig?: LayoutConfig;
  config?: CanvasConfig;
  initialBackgroundColor?: string;
  enableCollaboration?: boolean;
  dependencyEdgesVisible?: boolean;
  className?: string;
  style?: React.CSSProperties;
  /** 画布宽度，默认 '100%'。当嵌入到业务方 UI 时，建议明确指定或确保父容器有明确宽度 */
  width?: string | number;
  /** 画布高度，默认 '100%'。当嵌入到业务方 UI 时，建议明确指定或确保父容器有明确高度 */
  height?: string | number;
  /** 最小宽度，默认 '300px' */
  minWidth?: string | number;
  /** 最小高度，默认 '400px' */
  minHeight?: string | number;
  /** 隐形模式,不在用户列表中显示 */
  invisible?: boolean;
  /** 用户角色，分 viewer、editor 和 owner */
  role?: 'viewer' | 'editor' | 'owner';
}

export function CollaborativeCanvas({
  canvasId: canvasIdProp,
  userId: userIdProp,
  userName: userNameProp,
  seedNodes: seedNodesProp = [],
  rawData,
  layoutConfig,
  config,
  initialBackgroundColor = FLOW_UI.canvasBg,
  enableCollaboration,
  dependencyEdgesVisible = true,
  className,
  style,
  width,
  height,
  minWidth,
  minHeight,
  invisible = false,
  role,
}: CollaborativeCanvasProps) {
  const resolvedRole = role ?? (invisible ? 'viewer' : 'editor');
  const isViewer = resolvedRole === 'viewer';
  const canEdit = !isViewer;
  const resolvedLayout = useMemo<LayoutConfig>(
    () => ({
      columns: 4,
      nodeWidth: 300,
      nodeHeight: 200,
      gap: 50,
      startX: 100,
      startY: 100,
      ...layoutConfig,
      includeRawData: true,
    }),
    [layoutConfig]
  );
  const seedNodes = useMemo(() => {
    if (rawData !== undefined) {
      return parseRawData(rawData, resolvedLayout);
    }
    return seedNodesProp ?? [];
  }, [rawData, resolvedLayout, seedNodesProp]);
  const userId = useMemo(
    () => userIdProp ?? `user_${Math.random().toString(36).slice(2, 8)}`,
    [userIdProp]
  );
  const userName = userNameProp ?? userId;
  const canvasIdParam = useMemo(() => {
    if (canvasIdProp !== undefined) {
      return canvasIdProp;
    }
    if (typeof window === 'undefined') {
      return null;
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('canvasId');
  }, [canvasIdProp]);
  const collabEnabled = enableCollaboration ?? Boolean(canvasIdParam);
  const canvasId = canvasIdParam ? canvasIdParam : 'local';
  const canvasConfig = useMemo(
    () => ({
      minZoom: 0.1,
      maxZoom: 4,
      defaultZoom: 0.8,
      snapToGrid: false,
      ...config,
    }),
    [config]
  );

  const [nodes, setNodes] = useState<CanvasNodeData[]>([]);

  const [backgroundColor, setBackgroundColor] = useState(initialBackgroundColor);
  const [activeTool, setActiveTool] = useState<'select' | 'text'>('select');
  const [toolMode, setToolMode] = useState<'pan' | 'edit'>('pan');
  const [isLocked, setIsLocked] = useState(false);
  const effectiveToolMode = canEdit ? toolMode : 'pan';
  const effectiveActiveTool = canEdit ? activeTool : 'select';
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
  } | null>(null);
  const [sessionBlocked, setSessionBlocked] = useState<{ message: string } | null>(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; variant: 'info' | 'error' }>
  >([]);
  const getToolButtonStyle = (active: boolean, disabled: boolean): React.CSSProperties => ({
    width: 32,
    height: 32,
    borderRadius: 8,
    border: 'none',
    background: active ? FLOW_UI.panelHighlight : 'transparent',
    color: active ? FLOW_UI.panelText : FLOW_UI.panelTextMuted,
    fontSize: 16,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.35 : 1,
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  const collabRef = useRef<CollaborationState | null>(null);
  const seededRef = useRef(false);
  const localSeededRef = useRef(false);
  const nodesRef = useRef<CanvasNodeData[]>([]);
  const idMapRef = useRef<Map<string, string>>(new Map());
  const presencesRef = useRef<Map<string, { userName?: string }>>(new Map());
  const knownUsersRef = useRef<Set<string>>(new Set());
  const connectedRef = useRef(false);
  const wasConnectedRef = useRef(false);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const draggingNodesRef = useRef<Set<string>>(new Set());
  const activeSubCanvasRef = useRef<SubCanvasInfo | null>(null);
  const processedRawIdsRef = useRef<Set<string>>(new Set());
  const anchoredSubCanvasesRef = useRef<Map<string, SubCanvasInfo>>(new Map());
  const subCanvasByIdRef = useRef<Map<string, SubCanvasInfo>>(new Map());
  const readyForRawMergeRef = useRef(false);
  // 跟踪本地正在操作的节点（用于过滤服务器回显）
  const localOperatingNodesRef = useRef<Map<string, number>>(new Map());
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

  const getRawTaskId = useCallback((node: CanvasNodeData) => {
    const raw = (node as CanvasNodeData & { raw?: RawDataItem }).raw;
    if (!raw || typeof raw.taskId !== 'string') {
      return null;
    }
    return raw.taskId;
  }, []);

  const getInputImagePath = useCallback((item?: BoardTaskItem) => {
    if (!item) {
      return null;
    }
    const inputImages = item.parameters?.inputImages;
    if (!Array.isArray(inputImages) || inputImages.length === 0) {
      return null;
    }
    const first = inputImages[0] as unknown;
    if (typeof first === 'string') {
      return first;
    }
    if (first && typeof first === 'object') {
      const path = (first as { inputImageS3Path?: unknown }).inputImageS3Path;
      if (typeof path === 'string') {
        return path;
      }
    }
    return null;
  }, []);

  const getNodeReferencePaths = useCallback(
    (node: CanvasNodeData) => {
      const raw = (node as CanvasNodeData & { raw?: RawDataItem }).raw;
      if (!raw) {
        return [];
      }
      const paths: string[] = [];
      const result = raw.result ?? undefined;
      const pushPath = (value?: string) => {
        if (typeof value === 'string' && value.length > 0) {
          paths.push(value);
        }
      };
      pushPath(result?.originImage?.filePath);
      pushPath(result?.compressedImage?.filePath);
      pushPath(result?.originVideo?.filePath);
      pushPath(result?.originAudio?.filePath);
      const inputPath = getInputImagePath(raw);
      if (inputPath) {
        paths.push(inputPath);
      }
      return paths;
    },
    [getInputImagePath]
  );

  const getNodeOutputPaths = useCallback((node: CanvasNodeData) => {
    const raw = (node as CanvasNodeData & { raw?: RawDataItem }).raw;
    if (!raw) {
      return [];
    }
    const paths: string[] = [];
    const result = raw.result ?? undefined;
    const pushPath = (value?: string) => {
      if (typeof value === 'string' && value.length > 0) {
        paths.push(value);
      }
    };
    pushPath(result?.originImage?.filePath);
    pushPath(result?.compressedImage?.filePath);
    pushPath(result?.originVideo?.filePath);
    pushPath(result?.originAudio?.filePath);
    return paths;
  }, []);

  const findAnchorNodeByInputPath = useCallback(
    (inputPath: string, baseNodes: CanvasNodeData[]) => {
      for (const node of baseNodes) {
        const paths = getNodeReferencePaths(node);
        if (paths.includes(inputPath)) {
          return node;
        }
      }
      return null;
    },
    [getNodeReferencePaths]
  );

  const getSubCanvasOrigin = useCallback(
    (baseNodes: CanvasNodeData[]) => {
      const startX = resolvedLayout.startX ?? 100;
      const startY = resolvedLayout.startY ?? 100;
      if (baseNodes.length === 0) {
        return { x: startX, y: startY };
      }
      const rightBoundary = baseNodes.reduce(
        (max, node) => Math.max(max, node.position.x + node.size.width),
        startX
      );
      const zoom = viewport.zoom || 1;
      const offset = 200 / zoom;
      return { x: rightBoundary + offset, y: startY };
    },
    [resolvedLayout.startX, resolvedLayout.startY, viewport.zoom]
  );

  const createSubCanvasAt = useCallback(
    (
      origin: { x: number; y: number },
      options?: { setActive?: boolean; groupKey?: string; anchorNodeId?: string }
    ) => {
      const groupKey = options?.groupKey ?? DEFAULT_SUBCANVAS_KEY;
      const info: SubCanvasInfo = {
        id: `subcanvas_${generateId()}`,
        status: 'unread',
        origin,
        groupKey,
        anchorNodeId: options?.anchorNodeId,
      };
      subCanvasByIdRef.current.set(info.id, info);
      if (options?.setActive) {
        activeSubCanvasRef.current = info;
      }
      return info;
    },
    []
  );

  const createSubCanvas = useCallback(
    (baseNodes: CanvasNodeData[]) => {
      const origin = getSubCanvasOrigin(baseNodes);
      return createSubCanvasAt(origin, { setActive: true, groupKey: DEFAULT_SUBCANVAS_KEY });
    },
    [createSubCanvasAt, getSubCanvasOrigin]
  );

  const getAnchoredSubCanvas = useCallback(
    (inputPath: string, anchorNode: CanvasNodeData) => {
      const existing = anchoredSubCanvasesRef.current.get(inputPath);
      if (existing && existing.status === 'unread') {
        return existing;
      }
      const zoom = viewport.zoom || 1;
      const anchorGap = 1 / zoom;
      const origin = {
        x: anchorNode.position.x,
        y: anchorNode.position.y + anchorNode.size.height + anchorGap,
      };
      const info = createSubCanvasAt(origin, {
        setActive: false,
        groupKey: inputPath,
        anchorNodeId: anchorNode.id,
      });
      anchoredSubCanvasesRef.current.set(inputPath, info);
      return info;
    },
    [createSubCanvasAt, viewport.zoom]
  );

  const ensureActiveSubCanvas = useCallback(
    (baseNodes: CanvasNodeData[]) => {
      const current = activeSubCanvasRef.current;
      if (current && current.status === 'unread') {
        return current;
      }
      return createSubCanvas(baseNodes);
    },
    [createSubCanvas]
  );

  const markSubCanvasRead = useCallback(
    (subCanvasId: string, baseNodes: CanvasNodeData[]) => {
      const info = subCanvasByIdRef.current.get(subCanvasId);
      if (!info || info.status === 'read') {
        return;
      }
      info.status = 'read';
      if (info.groupKey === DEFAULT_SUBCANVAS_KEY) {
        createSubCanvas(baseNodes);
        return;
      }
      const anchorNode = info.anchorNodeId
        ? baseNodes.find((node) => node.id === info.anchorNodeId) ?? null
        : null;
      if (anchorNode) {
        const zoom = viewport.zoom || 1;
        const anchorGap = 1 / zoom;
        const nextInfo = createSubCanvasAt(
          {
            x: anchorNode.position.x,
            y: anchorNode.position.y + anchorNode.size.height + anchorGap,
          },
          {
            setActive: false,
            groupKey: info.groupKey,
            anchorNodeId: anchorNode.id,
          }
        );
        anchoredSubCanvasesRef.current.set(info.groupKey, nextInfo);
      } else {
        const nextInfo = createSubCanvasAt(info.origin, {
          setActive: false,
          groupKey: info.groupKey,
          anchorNodeId: info.anchorNodeId,
        });
        anchoredSubCanvasesRef.current.set(info.groupKey, nextInfo);
      }
    },
    [createSubCanvas, createSubCanvasAt]
  );

  const [dependencyEdges, setDependencyEdges] = useState<Edge[]>([]);
  const dependencySignatureRef = useRef('');
  const dependencyFocusNodeId = useMemo(() => {
    const focused = nodes.find((node) => Boolean((node as CanvasNodeData & { dependencyFocus?: boolean }).dependencyFocus));
    return focused?.id ?? null;
  }, [nodes]);
  const toggleDependencyFocus = useCallback(
    (nodeId: string) => {
      const currentNodes = nodesRef.current;
      if (currentNodes.length === 0) {
        return;
      }
      const isActive = currentNodes.some(
        (node) => node.id === nodeId && Boolean((node as CanvasNodeData & { dependencyFocus?: boolean }).dependencyFocus)
      );
      const updates: Array<{ nodeId: string; updates: Partial<CanvasNodeData> }> = [];
      const nextNodes = currentNodes.map((node) => {
        const nextFocus = node.id === nodeId ? !isActive : false;
        const currentFocus = Boolean(
          (node as CanvasNodeData & { dependencyFocus?: boolean }).dependencyFocus
        );
        if (currentFocus === nextFocus) {
          return node;
        }
        updates.push({
          nodeId: idMapRef.current.get(node.id) ?? node.id,
          updates: { dependencyFocus: nextFocus } as Partial<CanvasNodeData>,
        });
        return { ...node, dependencyFocus: nextFocus } as CanvasNodeData;
      });
      setNodes(nextNodes);
      if (updates.length > 0) {
        // 依赖关系焦点是UI状态，应立即同步
        collabRef.current?.updateNodes(updates, true);
      }
    },
    []
  );

  useEffect(() => {
    if (!dependencyEdgesVisible || !dependencyFocusNodeId) {
      dependencySignatureRef.current = '';
      setDependencyEdges([]);
      return;
    }
    // 使用节点结构签名来检测是否需要重新计算，包含位置信息以支持拖动时的更新
    const signature = nodes
      .map((node) => {
        const raw = (node as CanvasNodeData & { raw?: RawDataItem }).raw;
        const inputPath = getInputImagePath(raw) ?? '';
        const outputPaths = getNodeOutputPaths(node).sort().join(',');
        // 包含取整后的位置，既能跟随拖动更新，又不会过于频繁触发
        return `${node.id}:${inputPath}:${outputPaths}:${Math.round(node.position.x)}:${Math.round(node.position.y)}`;
      })
      .sort()
      .join('|');
    const focusSignature = `${dependencyFocusNodeId}|${signature}`;
    if (focusSignature === dependencySignatureRef.current) {
      return;
    }
    dependencySignatureRef.current = focusSignature;
    const focusNode = nodes.find((node) => node.id === dependencyFocusNodeId);
    if (!focusNode) {
      setDependencyEdges([]);
      return;
    }

    const outputPathToNodeId = new Map<string, string>();
    nodes.forEach((node) => {
      const paths = getNodeOutputPaths(node);
      paths.forEach((path) => {
        if (!outputPathToNodeId.has(path)) {
          outputPathToNodeId.set(path, node.id);
        }
      });
    });

    const buildEdge = (sourceId: string, targetId: string, suffix: string): Edge => ({
      id: `dep_${sourceId}_${targetId}_${suffix}`,
      source: sourceId,
      target: targetId,
      sourceHandle: 'dep-source',
      targetHandle: 'dep-target',
      type: 'bezier',
      markerEnd: { type: MarkerType.ArrowClosed, color: 'rgb(210, 210, 210)' },
      style: {
        stroke: 'rgb(210, 210, 210)',
        strokeWidth: 2,
        strokeDasharray: '6 6',
      },
      className: 'dependency-edge-animated',
    });

    const edges: Edge[] = [];
    const focusRaw = (focusNode as CanvasNodeData & { raw?: RawDataItem }).raw;
    const focusInputPath = getInputImagePath(focusRaw);
    if (focusInputPath) {
      const targetId = outputPathToNodeId.get(focusInputPath);
      if (targetId && targetId !== focusNode.id) {
        edges.push(buildEdge(focusNode.id, targetId, 'prev'));
      }
    }

    const focusOutputs = new Set(getNodeOutputPaths(focusNode));
    if (focusOutputs.size > 0) {
      nodes.forEach((node) => {
        if (node.id === focusNode.id) {
          return;
        }
        const raw = (node as CanvasNodeData & { raw?: RawDataItem }).raw;
        const inputPath = getInputImagePath(raw);
        if (inputPath && focusOutputs.has(inputPath)) {
          edges.push(buildEdge(node.id, focusNode.id, 'next'));
        }
      });
    }

    setDependencyEdges(edges);
  }, [dependencyEdgesVisible, dependencyFocusNodeId, getInputImagePath, getNodeOutputPaths, nodes]);

  const applyGridOffset = useCallback(
    (items: CanvasNodeData[], startIndex: number) => {
      if (startIndex <= 0 || items.length === 0) {
        return items;
      }
      const columns = resolvedLayout.columns ?? 4;
      const safeColumns = columns > 0 ? columns : 1;
      const nodeWidth = resolvedLayout.nodeWidth ?? 300;
      const nodeHeight = resolvedLayout.nodeHeight ?? 200;
      const gap = resolvedLayout.gap ?? 50;
      const step = Math.max(nodeWidth, nodeHeight) + gap;

      return items.map((node, index) => {
        const baseRow = Math.floor(index / safeColumns);
        const baseCol = index % safeColumns;
        const targetIndex = startIndex + index;
        const targetRow = Math.floor(targetIndex / safeColumns);
        const targetCol = targetIndex % safeColumns;
        const deltaX = (targetCol - baseCol) * step;
        const deltaY = (targetRow - baseRow) * step;
        if (deltaX === 0 && deltaY === 0) {
          return node;
        }
        return {
          ...node,
          position: {
            x: node.position.x + deltaX,
            y: node.position.y + deltaY,
          },
        };
      });
    },
    [resolvedLayout.columns, resolvedLayout.gap, resolvedLayout.nodeHeight, resolvedLayout.nodeWidth]
  );

  const layoutDependentNodes = useCallback(
    (
      items: CanvasNodeData[],
      subCanvas: SubCanvasInfo,
      existingNodes: CanvasNodeData[]
    ) => {
      if (items.length === 0) {
        return items;
      }
      const zoom = viewport.zoom || 1;
      const baseGap = resolvedLayout.gap ?? 50;
      const compactGap = Math.max(4, Math.round(baseGap * 0.2));
      const gap = compactGap / zoom;
      const columnCount = Math.min(2, Math.max(1, existingNodes.length + items.length));
      const allNodes = [...existingNodes, ...items];
      const cellWidth = Math.max(...allNodes.map((node) => node.size.width));
      const cellHeight = Math.max(...allNodes.map((node) => node.size.height));

      return items.map((node, index) => {
        const placeIndex = existingNodes.length + index;
        const row = Math.floor(placeIndex / columnCount);
        const col = placeIndex % columnCount;
        return {
          ...node,
          position: {
            x: subCanvas.origin.x + col * (cellWidth + gap),
            y: subCanvas.origin.y + row * (cellHeight + gap),
          },
        };
      });
    },
    [resolvedLayout.gap, viewport.zoom]
  );

  const appendNodes = useCallback(
    (newNodes: CanvasNodeData[]) => {
      if (newNodes.length === 0) {
        return;
      }
      if (collabEnabled) {
        const tempNodes = newNodes.map((node) => ({
          ...node,
          id: `temp_${node.id}`,
        }));
        setNodes((prevNodes) => [...prevNodes, ...tempNodes]);
        tempNodes.forEach((node) => {
          const { id: tempId, ...nodeData } = node;
          collabRef.current?.createNode(nodeData, tempId);
        });
        return;
      }
      setNodes((prevNodes) => [...prevNodes, ...newNodes]);
    },
    [collabEnabled]
  );

  const seedCanvas = useCallback(() => {
    if (seededRef.current) {
      return;
    }
    seededRef.current = true;

    const shouldUseSubCanvas = rawData !== undefined;
    const subCanvas = shouldUseSubCanvas ? ensureActiveSubCanvas(nodesRef.current) : null;
    const preparedNodes = subCanvas
      ? seedNodes.map((node) => ({ ...node, subCanvasId: subCanvas.id }))
      : seedNodes;
    const tempNodes = preparedNodes.map((node) => ({
      ...node,
      id: `temp_${node.id}`,
    }));

    setNodes(tempNodes);

    tempNodes.forEach((node) => {
      const { id: tempId, ...nodeData } = node;
      collabRef.current?.createNode(nodeData, tempId);
    });
    if (shouldUseSubCanvas) {
      preparedNodes.forEach((node) => {
        const taskId = getRawTaskId(node);
        if (taskId) {
          processedRawIdsRef.current.add(taskId);
        }
      });
    }
  }, [ensureActiveSubCanvas, getRawTaskId, rawData, seedNodes]);

  const handleMessage = useCallback(
    (message: ServerMessage) => {
      switch (message.type) {
        case 'sync_state':
          console.log('[Collaboration] Received sync_state:', {
            nodesCount: message.nodes.length,
            presencesCount: Object.keys(message.presences).length,
            currentNodesCount: nodesRef.current.length,
            seeded: seededRef.current,
          });
          
          if (message.nodes.length > 0) {
            seededRef.current = true;
            setNodes(message.nodes as CanvasNodeData[]);
          } else {
            // 如果本地已经有数据,不要清空
            // 只在首次连接且房间为空时才初始化
            if (!seededRef.current && nodesRef.current.length === 0) {
              seedCanvas();
            } else if (!seededRef.current) {
              // 本地有数据但未 seed,保持现有数据不变
              console.log('[Collaboration] Keeping local nodes, not clearing');
            }
            // 不要执行 setNodes([]),这会清空本地数据
          }
          
          // 初始化已知用户列表,排除自己
          const otherUsers = Object.keys(message.presences).filter(id => id !== userId);
          knownUsersRef.current = new Set(otherUsers);
          readyForRawMergeRef.current = true;
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
                  node.id === message.tempId ? (message.node as CanvasNodeData) : node
                );
              }
            }
            if (prevNodes.some((node) => node.id === message.node.id)) {
              return prevNodes;
            }
            return [...prevNodes, message.node as CanvasNodeData];
          });
          break;

        case 'node_updated':
          // 如果更新来自当前用户自己,完全跳过处理(避免回显造成抖动)
          if (message.userId && message.userId === userId) {
            break;
          }
          setNodes((prevNodes) =>
            prevNodes.map((node) => {
              if (node.id === message.nodeId) {
                return { ...node, ...(message.updates as Partial<CanvasNodeData>) } as CanvasNodeData;
              }
              const mappedId = idMapRef.current.get(node.id);
              if (mappedId && mappedId === message.nodeId) {
                return {
                  ...node,
                  id: message.nodeId,
                  ...(message.updates as Partial<CanvasNodeData>),
                } as CanvasNodeData;
              }
              return node;
            })
          );
          break;

        case 'nodes_updated':
          // 过滤掉本地正在操作的节点的更新（防止回显造成抖动）
          const filteredUpdates = message.updates.filter(update => {
            // 如果节点正在本地操作中，跳过服务器的更新
            const isLocallyOperating = localOperatingNodesRef.current.has(update.nodeId);
            return !isLocallyOperating;
          });
          
          if (filteredUpdates.length === 0) {
            break;
          }
          
          setNodes((prevNodes) => {
            const updateMap = new Map(
              filteredUpdates.map((update) => [update.nodeId, update.updates])
            );
            
            const nextNodes = prevNodes.map((node) => {
              const directUpdate = updateMap.get(node.id);
              if (directUpdate) {
                return { ...node, ...(directUpdate as Partial<CanvasNodeData>) } as CanvasNodeData;
              }
              const mappedId = idMapRef.current.get(node.id);
              if (mappedId) {
                const mappedUpdate = updateMap.get(mappedId);
                if (mappedUpdate) {
                  return {
                    ...node,
                    id: mappedId,
                    ...(mappedUpdate as Partial<CanvasNodeData>),
                  } as CanvasNodeData;
                }
              }
              return node;
            });
            
            return nextNodes;
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
            // 用户进入房间
            if (!knownUsersRef.current.has(message.userId)) {
              const name = message.presence.userName || message.userId;
              pushToast(`${name} has entered the session`, 'info');
              knownUsersRef.current.add(message.userId);
            }
          } else {
            // 用户离开房间
            if (knownUsersRef.current.has(message.userId)) {
              const name = presencesRef.current.get(message.userId)?.userName || message.userId;
              pushToast(`${name} left the session`, 'info');
              knownUsersRef.current.delete(message.userId);
            }
          }
          break;

        case 'error':
          if (message.code === 'ROOM_FULL') {
            pushToast('The session is full, please try again later', 'error');
          } else if ((message as any).permanent) {
            // 永久性断开连接的错误
            pushToast(message.error || 'Connection closed', 'error');
            if ((message as any).closeCode === 4004) {
              setSessionBlocked({
                message: 'You have been removed from the session. Refresh the page or click "Re-enter Session" to join again.',
              });
            }
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
      userName,
      enabled: collabEnabled,
      invisible,
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
    if (rawData === undefined) {
      return;
    }
    nodes.forEach((node) => {
      const taskId = getRawTaskId(node);
      if (taskId) {
        processedRawIdsRef.current.add(taskId);
      }
    });
  }, [getRawTaskId, nodes, rawData]);
  useEffect(() => {
    presencesRef.current = new Map(collab.presences);
  }, [collab.presences]);
  useEffect(() => {
    if (collab.connected) {
      collab.updatePresence({ userName, color: userColor });
    }
  }, [collab, userColor, userName]);
  useEffect(() => {
    if (sessionBlocked && collab.connected) {
      setSessionBlocked(null);
    }
  }, [collab.connected, sessionBlocked]);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }
      if (!canEdit) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === 'h') {
        setToolMode('pan');
        setActiveTool('select');
      }
      if (key === 'v') {
        setToolMode('edit');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canEdit]);
  useEffect(() => {
    if (!collabEnabled) {
      return;
    }
    // 只在真正从已连接变为断开时才提示
    if (wasConnectedRef.current && !collab.connected) {
      setContextMenu(null);
      // 不要立即清空nodes，等待重连
      // setNodes([]);
      // idMapRef.current.clear();
      knownUsersRef.current.clear();
      if (!sessionBlocked) {
        pushToast('连接断开，正在重连...', 'error');
      }
    } else if (!wasConnectedRef.current && collab.connected) {
      // 连接成功时不显示toast，因为会收到 sync_state 消息
      console.log('[Collaboration] Connected successfully');
    }
    wasConnectedRef.current = collab.connected;
  }, [collab.connected, collabEnabled, pushToast, sessionBlocked]);
  useEffect(() => {
    if (collabEnabled || localSeededRef.current) {
      return;
    }
    const shouldUseSubCanvas = rawData !== undefined;
    const subCanvas = shouldUseSubCanvas ? ensureActiveSubCanvas(nodesRef.current) : null;
    const preparedNodes = subCanvas
      ? seedNodes.map((node) => ({ ...node, subCanvasId: subCanvas.id }))
      : seedNodes;
    setNodes(preparedNodes);
    localSeededRef.current = true;
    readyForRawMergeRef.current = true;
    if (shouldUseSubCanvas) {
      preparedNodes.forEach((node) => {
        const taskId = getRawTaskId(node);
        if (taskId) {
          processedRawIdsRef.current.add(taskId);
        }
      });
    }
  }, [collabEnabled, ensureActiveSubCanvas, getRawTaskId, rawData, seedNodes]);

  useEffect(() => {
    if (!rawData || rawData.length === 0) {
      return;
    }
    if (!readyForRawMergeRef.current) {
      return;
    }
    const existingTaskIds = new Set<string>();
    nodes.forEach((node) => {
      const taskId = getRawTaskId(node);
      if (taskId) {
        existingTaskIds.add(taskId);
      }
    });
    const pendingItems = rawData.filter((item) => {
      const taskId = typeof item.taskId === 'string' ? item.taskId : null;
      if (!taskId) {
        return false;
      }
      if (existingTaskIds.has(taskId)) {
        return false;
      }
      if (processedRawIdsRef.current.has(taskId)) {
        return false;
      }
      return true;
    });
    if (pendingItems.length === 0) {
      return;
    }
    const anchoredGroups = new Map<string, { anchor: CanvasNodeData; items: BoardTaskItem[] }>();
    const fallbackItems: RawDataItem[] = [];
    pendingItems.forEach((item) => {
      const inputPath = getInputImagePath(item);
      if (inputPath) {
        const anchor = findAnchorNodeByInputPath(inputPath, nodes);
        if (anchor) {
          const existing = anchoredGroups.get(inputPath);
          if (existing) {
            existing.items.push(item);
          } else {
            anchoredGroups.set(inputPath, { anchor, items: [item] });
          }
          return;
        }
      }
      fallbackItems.push(item);
    });

    const markProcessed = (list: CanvasNodeData[]) => {
      list.forEach((node) => {
        const taskId = getRawTaskId(node);
        if (taskId) {
          processedRawIdsRef.current.add(taskId);
        }
      });
    };

    anchoredGroups.forEach(({ anchor, items }, inputPath) => {
      const subCanvas = getAnchoredSubCanvas(inputPath, anchor);
      const existingNodes = nodes.filter(
        (node) => (node as CanvasNodeData & { subCanvasId?: string }).subCanvasId === subCanvas.id
      );
      const positionedNodes = parseRawData(items, {
        ...resolvedLayout,
        startX: subCanvas.origin.x,
        startY: subCanvas.origin.y,
      });
      if (positionedNodes.length === 0) {
        return;
      }
      const compactNodes = layoutDependentNodes(positionedNodes, subCanvas, existingNodes);
      const newNodes = compactNodes.map((node) => ({ ...node, subCanvasId: subCanvas.id }));
      appendNodes(newNodes);
      markProcessed(newNodes);
    });

    if (fallbackItems.length === 0) {
      return;
    }
    const subCanvas = ensureActiveSubCanvas(nodes);
    const existingCount = nodes.filter(
      (node) => (node as CanvasNodeData & { subCanvasId?: string }).subCanvasId === subCanvas.id
    ).length;
    const positionedNodes = parseRawData(fallbackItems, {
      ...resolvedLayout,
      startX: subCanvas.origin.x,
      startY: subCanvas.origin.y,
    });
    if (positionedNodes.length === 0) {
      return;
    }
    const offsetNodes = applyGridOffset(positionedNodes, existingCount);
    const newNodes = offsetNodes.map((node) => ({ ...node, subCanvasId: subCanvas.id }));
    appendNodes(newNodes);
    markProcessed(newNodes);
  }, [
    appendNodes,
    applyGridOffset,
    ensureActiveSubCanvas,
    findAnchorNodeByInputPath,
    getAnchoredSubCanvas,
    getInputImagePath,
    layoutDependentNodes,
    getRawTaskId,
    nodes,
    rawData,
    resolvedLayout,
  ]);

  const handlePaneClick = useCallback(
    (position: { x: number; y: number }) => {
      if (!canEdit || isLocked || toolMode !== 'edit' || activeTool !== 'text') {
        return;
      }
      const tempId = `temp_${generateId()}`;
      const defaultContent = 'Add some text..';
      const defaultFontSize = 24;
      const paddingSize = 12;
      const borderSize = 2;
      const lineHeight = 1.4;

      // 计算文本宽度(使用默认文本)
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      let textWidth = 100;
      if (context) {
        context.font = `${defaultFontSize}px sans-serif`;
        textWidth = context.measureText(defaultContent).width;
      }

      // 计算单行高度
      const singleLineHeight = Math.ceil(defaultFontSize * lineHeight) + paddingSize * 2;

      // 计算默认宽度（增加1倍）
      const defaultWidth = Math.max(200, Math.ceil((textWidth + paddingSize * 2 + 16) * 2));

      // 文本框有 padding 和 border，所以要让文本内容的起始位置对齐鼠标点击位置
      // 文本内容位置 = 文本框左上角 + border + padding
      // 因此文本框位置 = 点击位置 - border - padding
      const newNode: CanvasNodeData = {
        id: tempId,
        type: NodeType.TEXT,
        position: {
          x: position.x - paddingSize - borderSize,
          y: position.y - paddingSize - borderSize,
        },
        size: {
          width: defaultWidth,
          height: singleLineHeight,
        },
        content: defaultContent,
        fontSize: defaultFontSize,
        color: '#ffffff',
        backgroundColor: 'transparent',
        autoEdit: true, // 标记为自动进入编辑模式
        selected: true, // 自动选中新创建的节点
      } as CanvasNodeData;
      setNodes((prevNodes) => [...prevNodes, newNode]);
      collab.createNode(newNode, tempId);
      setActiveTool('select');
    },
    [activeTool, canEdit, collab, isLocked, toolMode]
  );

  const handleNodesChange = useCallback(
    (nextNodes: CanvasNodeData[]) => {
      const prevNodes = nodesRef.current;
      setNodes(nextNodes);

      // 检测被删除的节点
      const nextNodeIds = new Set(nextNodes.map((node) => node.id));
      const deletedNodes = prevNodes.filter((node) => !nextNodeIds.has(node.id));

      deletedNodes.forEach((node) => {
        widgetBridge.emit(
          createWidgetEvent(
            'NODE_DELETED',
            {
              nodeId: node.id,
              nodeType: node.type,
              node,
            },
            { source: 'ui' }
          )
        );
      });

      // 同步删除操作到服务器
      deletedNodes.forEach((node) => {
        const mappedId = idMapRef.current.get(node.id) ?? node.id;
        collab.deleteNode(mappedId);
        // 清理 idMap
        idMapRef.current.delete(node.id);
      });

      // 过滤掉正在拖动的节点，避免与 dragMove 和 dragEnd 冲突
      const movedNodes = nextNodes.filter((node) => {
        // 跳过正在拖动的节点
        if (draggingNodesRef.current.has(node.id)) {
          return false;
        }
        const prev = prevNodes.find((prevNode) => prevNode.id === node.id);
        if (!prev) {
          return false;
        }
        return prev.position.x !== node.position.x || prev.position.y !== node.position.y;
      });

      if (rawData !== undefined && movedNodes.length > 0) {
        const touchedSubCanvasIds = new Set<string>();
        movedNodes.forEach((node) => {
          const subCanvasId = (node as CanvasNodeData & { subCanvasId?: string }).subCanvasId;
          if (subCanvasId) {
            touchedSubCanvasIds.add(subCanvasId);
          }
        });
        touchedSubCanvasIds.forEach((subCanvasId) => {
          markSubCanvasRead(subCanvasId, nextNodes);
        });
      }

      // 只有在没有节点正在拖动，且有位置变化时才发送批量更新
      // 这样可以避免在拖动过程中的干扰
      if (movedNodes.length > 0 && draggingNodesRef.current.size === 0) {
        const updates = movedNodes.map((node) => ({
          nodeId: idMapRef.current.get(node.id) ?? node.id,
          updates: { position: node.position },
        }));
        collab.updateNodes(updates);
      }

      const dataUpdates = nextNodes.reduce<
        Array<{ nodeId: string; updates: Partial<CanvasNodeData> }>
      >((acc, node) => {
        const prev = prevNodes.find((prevNode) => prevNode.id === node.id);
        if (!prev) {
          return acc;
        }
        const updates: Partial<CanvasNodeData> = {};
        let hasSizeChange = false;
        (Object.keys(node) as Array<keyof CanvasNodeData>).forEach((key) => {
          if (key === 'id' || key === 'type' || key === 'position') {
            return;
          }
          const nextValue = node[key];
          const prevValue = prev[key];
          
          if (typeof nextValue === 'object' && nextValue !== null) {
            if (JSON.stringify(nextValue) !== JSON.stringify(prevValue)) {
              updates[key] = nextValue as CanvasNodeData[typeof key];
              if (key === 'size') {
                hasSizeChange = true;
              }
            }
            return;
          }
          if (nextValue !== prevValue) {
            updates[key] = nextValue as CanvasNodeData[typeof key];
          }
        });
        
        // 如果 size 变化了，同时包含 position 以确保同步更新
        // 这样观察者能看到一致的调整尺寸动画
        if (hasSizeChange) {
          updates.position = node.position;
        }
        
        if (Object.keys(updates).length === 0) {
          return acc;
        }
        acc.push({
          nodeId: idMapRef.current.get(node.id) ?? node.id,
          updates,
        });
        return acc;
      }, []);

      if (dataUpdates.length > 0) {
        // 标记这些节点正在本地操作中（用于过滤服务器回显）
        const now = Date.now();
        dataUpdates.forEach(update => {
          localOperatingNodesRef.current.set(update.nodeId, now);
        });
        
        // 对于数据更新（如 rating, content, status 等），立即发送，不使用节流
        collab.updateNodes(dataUpdates, true);
        
        // 500ms 后清除标记（足够时间接收服务器回显）
        setTimeout(() => {
          dataUpdates.forEach(update => {
            const timestamp = localOperatingNodesRef.current.get(update.nodeId);
            if (timestamp === now) {
              localOperatingNodesRef.current.delete(update.nodeId);
            }
          });
        }, 500);
      }
    },
    [collab, markSubCanvasRead, rawData]
  );

  const handleNodeDragStart = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      // 标记节点正在拖动
      draggingNodesRef.current.add(nodeId);

      const mappedId = idMapRef.current.get(nodeId) ?? nodeId;
      
      // 标记节点正在本地操作中（用于过滤服务器回显）
      localOperatingNodesRef.current.set(mappedId, Date.now());
      
      collab.dragStart(mappedId, position);
    },
    [collab]
  );

  const handleNodeDrag = useCallback(
    (nodeId: string, position: { x: number; y: number }, selectedNodeIds?: string[]) => {
      // 批量拖动
      if (selectedNodeIds && selectedNodeIds.length > 1) {
        
        // 首次批量拖动时,为所有节点发送 DRAG_START 以锁定
        selectedNodeIds.forEach((id) => {
          if (!draggingNodesRef.current.has(id)) {
            draggingNodesRef.current.add(id);
            const mappedId = idMapRef.current.get(id) ?? id;
            const node = nodesRef.current.find((n) => n.id === id);
            if (node) {
              // 发送 DRAG_START 锁定节点
              collab.dragStart(mappedId, node.position);
            }
          }
        });

        // 批量发送位置更新
        const currentNodes = nodesRef.current;
        
        const updates = selectedNodeIds
          .map((id) => {
            const node = currentNodes.find((n) => n.id === id);
            if (!node) return null;
            return {
              nodeId: idMapRef.current.get(id) ?? id,
              updates: { position: node.position },
            };
          })
          .filter(
            (update): update is { nodeId: string; updates: { position: { x: number; y: number } } } =>
              update !== null
          );

        if (updates.length > 0) {
          collab.updateNodes(updates);
        }
      } else {
        // 单个节点拖动
        const mappedId = idMapRef.current.get(nodeId) ?? nodeId;
        collab.dragMove(mappedId, position);
      }
    },
    [collab]
  );

  const handleNodeDragEnd = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      // 获取所有正在拖动的节点
      const draggingNodeIds = Array.from(draggingNodesRef.current);

      // 清除所有拖动标记
      draggingNodesRef.current.clear();

      // 为每个节点发送 DRAG_END 以解锁
      draggingNodeIds.forEach((id) => {
        const mappedId = idMapRef.current.get(id) ?? id;
        const node = nodesRef.current.find((n) => n.id === id);
        if (node) {
          collab.dragEnd(mappedId, node.position);
          
          // 拖动结束后延迟清除操作标记（500ms后）
          const timestamp = Date.now();
          localOperatingNodesRef.current.set(mappedId, timestamp);
          setTimeout(() => {
            const currentTimestamp = localOperatingNodesRef.current.get(mappedId);
            if (currentTimestamp === timestamp) {
              localOperatingNodesRef.current.delete(mappedId);
            }
          }, 500);
        }
      });
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
        userName,
        color: userColor,
      });
    },
    [collab, userColor, userName, viewport]
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
        userName,
        color: userColor,
      });
    },
    [collab, toFlowPosition, userColor, userName, viewport]
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
        userName,
        color: userColor,
      });
    },
    [collab, userColor, userName]
  );

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: { id: string }) => {
      event.preventDefault();
      if (!canEdit || isLocked || toolMode !== 'edit') {
        return;
      }
      const targetNode = nodesRef.current.find((item) => item.id === node.id);
      const raw = (targetNode as CanvasNodeData & { raw?: RawDataItem } | undefined)?.raw;
      if (String(raw?.status ?? '').toLowerCase() === 'init') {
        return;
      }
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
      });
    },
    [canEdit, isLocked, toolMode]
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
      const prevNodes = nodesRef.current;
      if (prevNodes.length < 2) {
        setContextMenu(null);
        return;
      }
      
      const ordered = sortNodesByLayer(prevNodes);
      const index = ordered.findIndex((node) => node.id === nodeId);
      
      if (index === -1) {
        setContextMenu(null);
        return;
      }
      
      const nextOrder = [...ordered];
      if (action === 'forward') {
        if (index === ordered.length - 1) {
          setContextMenu(null);
          return;
        }
        [nextOrder[index], nextOrder[index + 1]] = [nextOrder[index + 1], nextOrder[index]];
      } else if (action === 'backward') {
        if (index === 0) {
          setContextMenu(null);
          return;
        }
        [nextOrder[index], nextOrder[index - 1]] = [nextOrder[index - 1], nextOrder[index]];
      } else if (action === 'front') {
        if (index === ordered.length - 1) {
          setContextMenu(null);
          return;
        }
        const [node] = nextOrder.splice(index, 1);
        nextOrder.push(node);
      } else if (action === 'back') {
        if (index === 0) {
          setContextMenu(null);
          return;
        }
        const [node] = nextOrder.splice(index, 1);
        nextOrder.unshift(node);
      }
      
      const zIndexMap = new Map(nextOrder.map((node, idx) => [node.id, idx]));
      const pendingUpdates: Array<{ nodeId: string; updates: Partial<CanvasNodeData> }> = [];
      
      const nextNodes = prevNodes.map((node) => {
        const nextZIndex = zIndexMap.get(node.id);
        if (nextZIndex === undefined || nextZIndex === node.zIndex) {
          return node;
        }
        const mappedId = idMapRef.current.get(node.id) ?? node.id;
        
        pendingUpdates.push({
          nodeId: mappedId,
          updates: { zIndex: nextZIndex },
        });
        return { ...node, zIndex: nextZIndex };
      });
      
      setNodes(nextNodes);
      
      if (pendingUpdates.length > 0) {
        // zIndex 调整应立即同步
        collab.updateNodes(pendingUpdates, true);
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

  const handleDeleteNode = useCallback(() => {
    if (!contextMenu) {
      return;
    }
    const target = nodesRef.current.find((node) => node.id === contextMenu.nodeId);
    if (!target) {
      setContextMenu(null);
      return;
    }
    widgetBridge.emit(
      createWidgetEvent(
        'NODE_DELETE_REQUEST',
        {
          nodeId: target.id,
          nodeType: target.type,
          node: target,
        },
        { source: 'ui' }
      )
    );
    setContextMenu(null);
  }, [contextMenu]);

  useEffect(() => {
    if (!isViewer) {
      return;
    }
    setToolMode('pan');
    setActiveTool('select');
    setContextMenu(null);
  }, [isViewer]);

  return (
    <main
      className={className}
      style={{
        width: 'inherit',
        height: 'inherit',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
      onContextMenu={isViewer ? (event) => event.preventDefault() : undefined}
    >
      {/* <header
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
              aria-label="选择背景颜色"
              title="选择背景颜色"
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
      </header> */}
      <div style={{ flex: 1, position: 'relative' }} ref={canvasRef}>
        {sessionBlocked && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            <div
              style={{
                width: 'min(520px, 92vw)',
                borderRadius: 16,
                padding: '24px 22px',
                background: 'rgba(15, 18, 22, 0.92)',
                border: `1px solid ${FLOW_UI.panelBorder}`,
                boxShadow: '0 18px 40px rgba(15, 23, 42, 0.35)',
                color: '#e2e8f0',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>
                Session Ended
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.5, color: '#cbd5f5', marginBottom: 18 }}>
                {sessionBlocked.message}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSessionBlocked(null);
                  collab.reconnect();
                }}
                style={{
                  minWidth: 160,
                  padding: '10px 16px',
                  borderRadius: 999,
                  border: '1px solid rgba(148,163,184,0.35)',
                  background: 'linear-gradient(135deg, rgba(94,234,212,0.2), rgba(56,189,248,0.25))',
                  color: '#e2e8f0',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Re-enter Session
              </button>
            </div>
          </div>
        )}
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
                  background: toast.variant === 'error' ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.08)',
                  border: `1px solid ${FLOW_UI.panelBorder}`,
                  color: toast.variant === 'error' ? '#fecaca' : '#e2e8f0',
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
            const color = presence.color || '#5ad37b';
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
                    transform: `translate(6px, 6px) scale(${1 / viewport.zoom})`,
                    transformOrigin: '0 0',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'flex-start',
                      gap: 6,
                    }}
                  >
                    <EditModeIcon
                      size={16}
                      style={{ flex: '0 0 auto', color, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))' }}
                    />
                    <div
                      style={{
                        marginTop: 6,
                        padding: '3px 8px',
                        borderRadius: 999,
                        background: 'rgba(15, 18, 22, 0.92)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontSize: 12,
                        fontWeight: 600,
                        lineHeight: '16px',
                        color,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 8px 18px rgba(0,0,0,0.35)',
                      }}
                    >
                      {presence.userName || id}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* 锁定节点指示器层 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            transformOrigin: '0 0',
            zIndex: 10, // 在画布上方,光标下方
          }}
        >
          {Array.from(collab.lockedNodes.entries()).map(([nodeId, lockUserId]) => {
            const node = nodes.find((n) => n.id === nodeId);
            const lockUser = collab.presences.get(lockUserId);
            if (!node || lockUserId === userId) return null; // 不显示自己锁定的节点

            const lockColor = lockUser?.color || '#ef4444';
            const lockName = lockUser?.userName || lockUserId;

            return (
              <div
                key={nodeId}
                style={{
                  position: 'absolute',
                  left: node.position.x,
                  top: node.position.y,
                  width: node.size.width,
                  height: node.size.height,
                  border: `3px solid ${lockColor}`,
                  borderRadius: 8,
                  boxShadow: `0 0 0 1px rgba(255,255,255,0.5), 0 0 12px ${lockColor}`,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: -28,
                    left: 0,
                    padding: '4px 8px',
                    borderRadius: 6,
                    background: lockColor,
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}
                >
                  {lockName} is editing 
                </div>
              </div>
            );
          })}
        </div>
        {canEdit && (
          <div
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 5,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              padding: 4,
              width: 40,
              borderRadius: 12,
              background: FLOW_UI.panelBg,
              border: `1px solid ${FLOW_UI.panelBorder}`,
              boxShadow: FLOW_UI.panelShadow,
            }}
          >
            {/* Edit 模式按钮 */}
            <button
              type="button"
              onClick={() => {
                if (isLocked) return;
                setToolMode('edit');
                setActiveTool('select');
              }}
              title="Edit mode (V)"
              style={getToolButtonStyle(toolMode === 'edit', isLocked)}
              disabled={isLocked}
            >
              <EditModeIcon size={16} />
            </button>

            {/* Pan 模式按钮 */}
            <button
              type="button"
              onClick={() => {
                if (isLocked) return;
                setToolMode('pan');
                setActiveTool('select');
              }}
              title="Pan mode (H)"
              style={getToolButtonStyle(toolMode === 'pan', isLocked)}
              disabled={isLocked}
            >
              <PanModeIcon size={16} />
            </button>
            {/* 文本工具按钮 */}
            <button
              type="button"
              onClick={() => {
                if (toolMode === 'pan' || isLocked) {
                  return;
                }
                setActiveTool(activeTool === 'text' ? 'select' : 'text');
              }}
              title="Add Text (T)"
              style={getToolButtonStyle(activeTool === 'text', toolMode === 'pan' || isLocked)}
              disabled={toolMode === 'pan' || isLocked}
            >
              <TextModeIcon size={16} />
            </button>
            {/* <button
              type="button"
              onClick={() => setIsLocked((prev) => !prev)}
              title={isLocked ? 'Unlock the board' : 'Lock the board'}
              aria-pressed={isLocked}
              style={getToolButtonStyle(isLocked, false)}
            >
              <LockModeIcon size={16} locked={isLocked} />
            </button> */}
          </div>
        )}
        <div style={{ width: '100%', height: '100%' }}>
          <CanvasRoleProvider value={resolvedRole}>
            <DependencyFocusProvider
              value={{ activeNodeId: dependencyFocusNodeId, toggleNode: toggleDependencyFocus }}
            >
              <InfiniteCanvas
                nodes={nodes}
                edges={dependencyEdges}
                onNodesChange={handleNodesChange}
                backgroundColor={backgroundColor}
                onPaneClick={handlePaneClick}
                onNodeDragStart={handleNodeDragStart}
                onNodeDrag={handleNodeDrag}
                onNodeDragEnd={handleNodeDragEnd}
                onNodeContextMenu={canEdit ? handleNodeContextMenu : undefined}
                onPaneMouseMove={handlePaneMouseMove}
                onViewportChange={handleViewportChange}
                paneCursor={
                  isLocked
                    ? 'not-allowed'
                    : effectiveToolMode === 'pan'
                      ? 'grab'
                      : effectiveActiveTool === 'text'
                        ? 'text'
                        : undefined
                }
                nodesDraggable={!isLocked && effectiveToolMode === 'edit'}
                elementsSelectable={!isLocked && effectiveToolMode === 'edit'}
                selectionOnDrag={!isLocked && effectiveToolMode === 'edit'}
                panOnDrag={isLocked ? [] : effectiveToolMode === 'pan' ? [0, 1, 2] : [1, 2]}
                onLockChange={setIsLocked}
                isLocked={isLocked}
                showControls={canEdit}
                config={canvasConfig}
                width={width}
                height={height}
                minWidth={minWidth}
                minHeight={minHeight}
              />
            </DependencyFocusProvider>
          </CanvasRoleProvider>
        </div>
        {contextMenu && canEdit && (
          <div
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              zIndex: 50,
              background: FLOW_UI.panelBg,
              borderRadius: 12,
              border: `1px solid ${FLOW_UI.panelBorder}`,
              boxShadow: FLOW_UI.panelShadow,
              padding: 6,
              minWidth: 140,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {(() => {
              const targetNode = nodesRef.current.find((node) => node.id === contextMenu.nodeId);
              const raw = (targetNode as CanvasNodeData & { raw?: RawDataItem } | undefined)?.raw;
              const status = String(raw?.status ?? '');
              const isSuccess = status ? status.toLowerCase() === 'success' : true;
              const layerInfo = getLayerInfo(contextMenu.nodeId);
              return (
                <>
                  {isSuccess && (
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
                          color: layerInfo.isTop ? FLOW_UI.panelTextDisabled : FLOW_UI.panelText,
                        }}
                      >
                        Forward 
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
                          color: layerInfo.isBottom ? FLOW_UI.panelTextDisabled : FLOW_UI.panelText,
                        }}
                      >
                        Backward
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
                          color: layerInfo.isTop ? FLOW_UI.panelTextDisabled : FLOW_UI.panelText,
                        }}
                      >
                        To Front
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
                          color: layerInfo.isBottom ? FLOW_UI.panelTextDisabled : FLOW_UI.panelText,
                        }}
                      >
                        To Back
                      </button>
                      <div
                        style={{
                          height: 1,
                          background: FLOW_UI.divider,
                          margin: '6px 4px',
                        }}
                      />
                    </>
                  )}
                  <button
                    type="button"
                    onClick={handleDeleteNode}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: 13,
                      color: FLOW_UI.danger,
                    }}
                  >
                    Delete
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
