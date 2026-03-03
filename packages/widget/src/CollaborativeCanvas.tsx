import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CanvasConfig, CanvasNodeData, LayoutConfig, RawDataItem } from '@tc/infinite-core';
import { NodeType, generateId, parseRawData } from '@tc/infinite-core';
import type { Edge, Node as FlowNode, ReactFlowInstance } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import type { CollaborationState, ServerMessage, UserPresence } from './hooks';
import { useCollaboration } from './hooks';
import { InfiniteCanvas } from './InfiniteCanvas';
import { createWidgetEvent, widgetBridge } from './bridge';
import { isDev } from './utils/env';
import { DependencyFocusProvider } from './nodes/DependencyFocusContext';
import { BoardTaskItem } from '@tc/infinite-core';
import { EditModeIcon, LockModeIcon, TextModeIcon, PlusIcon, LayersIcon, PanModeIcon } from './icons';
import { Upload, ImagePlus, Video, Send, X, Paintbrush, Eraser, Undo2, Redo2, Plus, Sparkles, Share, UserPlus, ChevronDown, LayoutGrid, User, AudioLines, Mic, ScanFace, Box, Blend, Clapperboard, Type, Repeat2, Smile, ArrowUpRight, ArrowUp, RotateCcw, Tv, Wand2, ScanSearch, PersonStanding } from 'lucide-react';
import { CanvasRoleProvider } from './CanvasRoleContext';
import { SelectModeProvider, SelectModeState } from './SelectModeContext';

const DEFAULT_SUBCANVAS_KEY = '__default__';
const FLOW_UI = {
  canvasBg: '#000000',
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

const normalizeAudioNodeSize = (node: CanvasNodeData): { node: CanvasNodeData; changed: boolean } => {
  if (node.type !== NodeType.AUDIO) {
    return { node, changed: false };
  }
  const width = node.size?.width;
  const height = node.size?.height;
  if (!width || !height || width === height) {
    return { node, changed: false };
  }
  const side = Math.max(width, height);
  return {
    node: {
      ...node,
      size: { width: side, height: side },
    },
    changed: true,
  };
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
  /** 顶部栏左侧 logo 图片地址。不传则使用默认内联 logo。建议将 logo 放在应用 public 目录（如 apps/demo/public/logo.svg）后传 "/logo.svg" */
  topBarLogoUrl?: string;
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
  topBarLogoUrl,
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
      return parseRawData(rawData, resolvedLayout).map((node) => normalizeAudioNodeSize(node).node);
    }
    return (seedNodesProp ?? []).map((node) => normalizeAudioNodeSize(node).node);
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
  const [toolMode, setToolMode] = useState<'pan' | 'edit'>('edit');
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

  // Select mode state - 素材选择模式状态
  const [selectMode, setSelectMode] = useState<SelectModeState>({
    isActive: false,
    mediaType: null,
  });

  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [plusMenuTab, setPlusMenuTab] = useState<string | null>(null);
  const [layersPanelOpen, setLayersPanelOpen] = useState(false);
  const [layoutPanelOpen, setLayoutPanelOpen] = useState(false);
  const layoutPanelRef = useRef<HTMLDivElement | null>(null);

  // Inpaint focus mode
  const [inpaintFocus, setInpaintFocus] = useState<{
    nodeId: string;
    prompt: string;
    maskTool: 'brush' | 'eraser';
    brushSize: number;
  } | null>(null);

  // Layers drag state
  const [layerDragId, setLayerDragId] = useState<string | null>(null);
  const [layerDragOverId, setLayerDragOverId] = useState<string | null>(null);

  // AI creation mode (ai-image / ai-video)
  const [aiCreateMode, setAiCreateMode] = useState<{
    type: 'ai-image' | 'ai-video';
    subActionId: string;
    nodeId: string;
    prompt: string;
  } | null>(null);
  const reactFlowInstanceRef = useRef<ReactFlowInstance<FlowNode<CanvasNodeData>, Edge> | null>(null);

  const getToolButtonStyle = (active: boolean, disabled: boolean): React.CSSProperties => ({
    width: 40,
    height: 40,
    borderRadius: 10,
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
  const pushImmediateUpdates = useCallback(
    (updates: Array<{ nodeId: string; updates: Partial<CanvasNodeData> }>) => {
      if (!canEdit || updates.length === 0) {
        return;
      }
      const collab = collabRef.current;
      if (!collab) {
        return;
      }
      const now = Date.now();
      updates.forEach((update) => {
        localOperatingNodesRef.current.set(update.nodeId, now);
      });
      collab.updateNodes(updates, true);
      setTimeout(() => {
        updates.forEach((update) => {
          const timestamp = localOperatingNodesRef.current.get(update.nodeId);
          if (timestamp === now) {
            localOperatingNodesRef.current.delete(update.nodeId);
          }
        });
      }, 100);
    },
    [canEdit]
  );

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

  // 输入依赖项类型，包含路径和名称（用于区分 firstFrame/lastFrame）
  type InputDependency = {
    path: string;
    name?: string; // 'firstFrame' | 'lastFrame' | undefined
  };

  const getInputDependencies = useCallback((item?: BoardTaskItem): InputDependency[] => {
    if (!item) {
      return [];
    }
    const inputImages = item.parameters?.inputImages;
    if (!Array.isArray(inputImages) || inputImages.length === 0) {
      return [];
    }
    const dependencies: InputDependency[] = [];
    const possibleKeys = ['inputImageS3Path', 'url', 'filePath', 'resourceId', 'path'];
    
    // 遍历所有 inputImages，而不只是第一个
    inputImages.forEach((inputImage) => {
      if (typeof inputImage === 'string') {
        dependencies.push({ path: inputImage });
      } else if (inputImage && typeof inputImage === 'object') {
        const obj = inputImage as Record<string, unknown>;
        const name = typeof obj.name === 'string' ? obj.name : undefined;
        
        // 找到第一个有效的路径
        for (const key of possibleKeys) {
          const value = obj[key];
          if (typeof value === 'string' && value.length > 0) {
            dependencies.push({ path: value, name });
            break;
          }
        }
      }
    });
    return dependencies;
  }, []);

  // 向后兼容：仅返回路径数组
  const getInputImagePaths = useCallback((item?: BoardTaskItem): string[] => {
    return getInputDependencies(item).map((dep) => dep.path);
  }, [getInputDependencies]);

  // 保持向后兼容的单路径版本
  const getInputImagePath = useCallback((item?: BoardTaskItem) => {
    const paths = getInputImagePaths(item);
    return paths.length > 0 ? paths[0] : null;
  }, [getInputImagePaths]);

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
      // 收集所有可能的输出路径标识（filePath, url, resourceId）
      const resources = [
        result?.originImage,
        result?.compressedImage,
        result?.originVideo,
        result?.originAudio,
      ];
      resources.forEach((resource) => {
        if (resource) {
          pushPath(resource.filePath);
          pushPath(resource.url);
          pushPath(resource.resourceId);
        }
      });
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
    // 收集所有可能的输出路径标识
    const resources = [
      result?.originImage,
      result?.compressedImage,
      result?.originVideo,
      result?.originAudio,
    ];
    resources.forEach((resource) => {
      if (resource) {
        pushPath(resource.filePath);
        pushPath(resource.url);
        pushPath(resource.resourceId);
      }
    });
    return paths;
  }, []);

  const findAnchorNodeByInputPath = useCallback(
    (inputPaths: string[], baseNodes: CanvasNodeData[]) => {
      if (inputPaths.length === 0) {
        return null;
      }
      for (const node of baseNodes) {
        const nodePaths = getNodeReferencePaths(node);
        // 检查任意输入路径是否匹配节点的任意引用路径
        for (const inputPath of inputPaths) {
          if (nodePaths.includes(inputPath)) {
            return node;
          }
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

    // 根据依赖名称确定使用的 handle
    // firstFrame -> 左侧连接, lastFrame -> 右侧连接, 其他 -> 顶部连接
    const getHandleForDependencyName = (name?: string): { sourceHandle: string; targetHandle: string } => {
      if (name === 'firstFrame') {
        return { sourceHandle: 'dep-source-left', targetHandle: 'dep-target-right' };
      }
      if (name === 'lastFrame') {
        return { sourceHandle: 'dep-source-right', targetHandle: 'dep-target-left' };
      }
      return { sourceHandle: 'dep-source', targetHandle: 'dep-target' };
    };

    const buildEdge = (
      sourceId: string,
      targetId: string,
      suffix: string,
      dependencyName?: string
    ): Edge => {
      const handles = getHandleForDependencyName(dependencyName);
      return {
        id: `dep_${sourceId}_${targetId}_${suffix}`,
        source: sourceId,
        target: targetId,
        sourceHandle: handles.sourceHandle,
        targetHandle: handles.targetHandle,
        type: 'bezier',
        markerEnd: { type: MarkerType.ArrowClosed, color: 'rgb(210, 210, 210)' },
        style: {
          stroke: 'rgb(210, 210, 210)',
          strokeWidth: 2,
          strokeDasharray: '6 6',
        },
        className: 'dependency-edge-animated',
      };
    };

    const edges: Edge[] = [];
    const focusRaw = (focusNode as CanvasNodeData & { raw?: RawDataItem }).raw;
    
    // 获取所有输入依赖（包含名称信息）
    const focusInputDeps = getInputDependencies(focusRaw);
    focusInputDeps.forEach((dep, index) => {
      const targetId = outputPathToNodeId.get(dep.path);
      if (targetId && targetId !== focusNode.id) {
        edges.push(buildEdge(focusNode.id, targetId, `prev_${index}`, dep.name));
      }
    });

    const focusOutputs = new Set(getNodeOutputPaths(focusNode));
    if (focusOutputs.size > 0) {
      nodes.forEach((node) => {
        if (node.id === focusNode.id) {
          return;
        }
        const raw = (node as CanvasNodeData & { raw?: RawDataItem }).raw;
        // 获取该节点的所有输入依赖
        const nodeDeps = getInputDependencies(raw);
        nodeDeps.forEach((dep, depIndex) => {
          if (focusOutputs.has(dep.path)) {
            edges.push(buildEdge(node.id, focusNode.id, `next_${node.id}_${depIndex}`, dep.name));
          }
        });
      });
    }

    setDependencyEdges(edges);
  }, [dependencyEdgesVisible, dependencyFocusNodeId, getInputDependencies, getNodeOutputPaths, nodes]);

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
      const normalizedNodes = newNodes.map((node) => normalizeAudioNodeSize(node).node);
      if (collabEnabled) {
        const tempNodes = normalizedNodes.map((node) => ({
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
      setNodes((prevNodes) => [...prevNodes, ...normalizedNodes]);
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
            const sizeUpdates: Array<{ nodeId: string; updates: Partial<CanvasNodeData> }> = [];
            const normalizedNodes = (message.nodes as CanvasNodeData[]).map((node) => {
              const { node: normalizedNode, changed } = normalizeAudioNodeSize(node);
              if (changed) {
                sizeUpdates.push({ nodeId: normalizedNode.id, updates: { size: normalizedNode.size } });
              }
              return normalizedNode;
            });
            setNodes(normalizedNodes);
            if (sizeUpdates.length > 0) {
              pushImmediateUpdates(sizeUpdates);
            }
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
          {
            const { node: normalizedNode, changed } = normalizeAudioNodeSize(
              message.node as CanvasNodeData
            );
            if (changed) {
              pushImmediateUpdates([{ nodeId: normalizedNode.id, updates: { size: normalizedNode.size } }]);
            }
            if (message.tempId) {
              idMapRef.current.set(message.tempId, message.node.id);
            }
            setNodes((prevNodes) => {
              if (message.tempId) {
                const hasTemp = prevNodes.some((node) => node.id === message.tempId);
                if (hasTemp) {
                  return prevNodes.map((node) =>
                    node.id === message.tempId ? normalizedNode : node
                  );
                }
              }
              if (prevNodes.some((node) => node.id === normalizedNode.id)) {
                return prevNodes;
              }
              return [...prevNodes, normalizedNode];
            });
            break;
          }

        case 'node_updated':
          // 如果更新来自当前用户自己,完全跳过处理(避免回显造成抖动)
          if (message.userId && message.userId === userId) {
            break;
          }
          {
            const sizeUpdates: Array<{ nodeId: string; updates: Partial<CanvasNodeData> }> = [];
            setNodes((prevNodes) =>
              prevNodes.map((node) => {
                if (node.id === message.nodeId) {
                  const merged = { ...node, ...(message.updates as Partial<CanvasNodeData>) } as CanvasNodeData;
                  const { node: normalizedNode, changed } = normalizeAudioNodeSize(merged);
                  if (changed) {
                    sizeUpdates.push({ nodeId: normalizedNode.id, updates: { size: normalizedNode.size } });
                  }
                  return normalizedNode;
                }
                const mappedId = idMapRef.current.get(node.id);
                if (mappedId && mappedId === message.nodeId) {
                  const merged = {
                    ...node,
                    id: message.nodeId,
                    ...(message.updates as Partial<CanvasNodeData>),
                  } as CanvasNodeData;
                  const { node: normalizedNode, changed } = normalizeAudioNodeSize(merged);
                  if (changed) {
                    sizeUpdates.push({ nodeId: normalizedNode.id, updates: { size: normalizedNode.size } });
                  }
                  return normalizedNode;
                }
                return node;
              })
            );
            if (sizeUpdates.length > 0) {
              pushImmediateUpdates(sizeUpdates);
            }
          }
          break;

        case 'nodes_updated':
          // 过滤掉本地正在操作的节点的更新（防止回显造成抖动）
          // 只过滤最近150ms内标记的节点，避免过滤其他用户的合法更新
          const now = Date.now();
          const filteredUpdates = message.updates.filter(update => {
            const markTimestamp = localOperatingNodesRef.current.get(update.nodeId);
            if (!markTimestamp) {
              return true; // 没有标记，正常接收
            }
            
            const age = now - markTimestamp;
            const isRecentLocalOperation = age < 150; // 只过滤最近150ms的操作
            
            return !isRecentLocalOperation;
          });
          
          if (filteredUpdates.length === 0) {
            break;
          }
          
          {
            const sizeUpdates: Array<{ nodeId: string; updates: Partial<CanvasNodeData> }> = [];
            setNodes((prevNodes) => {
              const updateMap = new Map(
                filteredUpdates.map((update) => [update.nodeId, update.updates])
              );
              
              const nextNodes = prevNodes.map((node) => {
                const directUpdate = updateMap.get(node.id);
                if (directUpdate) {
                  const merged = { ...node, ...(directUpdate as Partial<CanvasNodeData>) } as CanvasNodeData;
                  const { node: normalizedNode, changed } = normalizeAudioNodeSize(merged);
                  if (changed) {
                    sizeUpdates.push({ nodeId: normalizedNode.id, updates: { size: normalizedNode.size } });
                  }
                  return normalizedNode;
                }
                const mappedId = idMapRef.current.get(node.id);
                if (mappedId) {
                  const mappedUpdate = updateMap.get(mappedId);
                  if (mappedUpdate) {
                    const merged = {
                      ...node,
                      id: mappedId,
                      ...(mappedUpdate as Partial<CanvasNodeData>),
                    } as CanvasNodeData;
                    const { node: normalizedNode, changed } = normalizeAudioNodeSize(merged);
                    if (changed) {
                      sizeUpdates.push({ nodeId: normalizedNode.id, updates: { size: normalizedNode.size } });
                    }
                    return normalizedNode;
                  }
                }
                return node;
              });
              
              return nextNodes;
            });
            if (sizeUpdates.length > 0) {
              pushImmediateUpdates(sizeUpdates);
            }
          }
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
    [pushImmediateUpdates, pushToast, seedCanvas, userId]
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
    let spaceHeld = false;
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
      if (key === 'v') {
        setToolMode('edit');
        setActiveTool('select');
      }
      if (key === 'h') {
        setToolMode('pan');
      }
      if (key === 'z') {
        const instance = reactFlowInstanceRef.current;
        if (instance) {
          const selectedNodes = instance.getNodes().filter((n: any) => n.selected);
          if (selectedNodes.length > 0) {
            instance.fitView({ nodes: selectedNodes, padding: 0.3, duration: 300 });
          }
        }
      }
      if (key === 'f') {
        const instance = reactFlowInstanceRef.current;
        if (instance) {
          instance.fitView({ padding: 0.15, duration: 300 });
        }
      }
      if (event.code === 'Space' && !spaceHeld) {
        spaceHeld = true;
        event.preventDefault();
        setToolMode('pan');
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space' && spaceHeld) {
        spaceHeld = false;
        setToolMode('edit');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [canEdit]);


  useEffect(() => {
    if (!layoutPanelOpen) return;
    const handleMouseDown = (event: MouseEvent) => {
      if (layoutPanelRef.current && !layoutPanelRef.current.contains(event.target as Node)) {
        setLayoutPanelOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLayoutPanelOpen(false);
    };
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [layoutPanelOpen]);

  // Listen for SET_SELECT_MODE command from host page
  useEffect(() => {
    const unsubscribe = widgetBridge.onCommand<SelectModeState>(
      'SET_SELECT_MODE',
      (payload) => {
        if (payload && typeof payload === 'object') {
          console.log('[CollaborativeCanvas] SET_SELECT_MODE received:', payload);
          setSelectMode({
            isActive: Boolean(payload.isActive),
            mediaType: payload.mediaType ?? null,
          });
        }
      }
    );
    return unsubscribe;
  }, []);

  // Listen for inpaint quick action → enter focus mode
  useEffect(() => {
    const unsubscribe = widgetBridge.on(
      'NODE_QUICK_ACTION',
      (event: { payload?: { actionId?: string; nodeId?: string }; source?: string }) => {
        if (
          event.payload?.actionId === 'inpaint' &&
          event.payload?.nodeId &&
          event.source !== 'inpaint-toolbar'
        ) {
          const targetId = event.payload.nodeId;
          setInpaintFocus({ nodeId: targetId, prompt: '', maskTool: 'brush', brushSize: 30 });
          setNodes((prev) =>
            prev.map((n) => ({ ...n, selected: n.id === targetId }))
          );
          setTimeout(() => {
            const instance = reactFlowInstanceRef.current;
            if (instance) {
              instance.fitView({
                nodes: [{ id: targetId }] as any,
                padding: 0.5,
                duration: 300,
              });
            }
          }, 50);
        }
      }
    );
    return unsubscribe;
  }, []);

  // ESC exits inpaint focus mode or AI create mode
  useEffect(() => {
    if (!inpaintFocus && !aiCreateMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (inpaintFocus) setInpaintFocus(null);
        if (aiCreateMode) {
          setAiCreateMode(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inpaintFocus, aiCreateMode]);

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
      const inputPaths = getInputImagePaths(item);
      if (inputPaths.length > 0) {
        const anchor = findAnchorNodeByInputPath(inputPaths, nodes);
        if (anchor) {
          // 使用第一个输入路径作为分组键
          const groupKey = inputPaths[0];
          const existing = anchoredGroups.get(groupKey);
          if (existing) {
            existing.items.push(item);
          } else {
            anchoredGroups.set(groupKey, { anchor, items: [item] });
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

    // 跟踪是否已经为本批次启用了依赖关系线
    let dependencyFocusEnabled = false;

    // 如果要添加有依赖的新节点，先清除现有节点的 dependencyFocus
    if (anchoredGroups.size > 0) {
      const updates: Array<{ nodeId: string; updates: Partial<CanvasNodeData> }> = [];
      setNodes((prevNodes) => {
        return prevNodes.map((node) => {
          const hasFocus = Boolean((node as CanvasNodeData & { dependencyFocus?: boolean }).dependencyFocus);
          if (hasFocus) {
            updates.push({
              nodeId: idMapRef.current.get(node.id) ?? node.id,
              updates: { dependencyFocus: false } as Partial<CanvasNodeData>,
            });
            return { ...node, dependencyFocus: false } as CanvasNodeData;
          }
          return node;
        });
      });
      if (updates.length > 0) {
        collabRef.current?.updateNodes(updates, true);
      }
    }

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
      // 新节点有依赖，自动打开依赖关系线（只为第一个节点开启）
      const newNodes = compactNodes.map((node, index) => ({
        ...node,
        subCanvasId: subCanvas.id,
        // 只为本批次第一个有依赖的节点启用 dependencyFocus
        dependencyFocus: !dependencyFocusEnabled && index === 0 ? true : undefined,
      }));
      if (newNodes.length > 0 && !dependencyFocusEnabled) {
        dependencyFocusEnabled = true;
      }
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
    getInputImagePaths,
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
        if (isDev()) {
          console.log('[CollaborativeCanvas] local delete detected, send collab delete', {
            id: node.id,
            mappedId,
          });
        }
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
        
        // 100ms 后清除标记（缩短时间窗口，减少对其他用户的影响）
        setTimeout(() => {
          dataUpdates.forEach(update => {
            const timestamp = localOperatingNodesRef.current.get(update.nodeId);
            if (timestamp === now) {
              localOperatingNodesRef.current.delete(update.nodeId);
            }
          });
        }, 100);
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
      // 多选模式下不提供右键菜单（右键菜单是针对单一节点的）
      const selectedNodes = nodesRef.current.filter((item) => item.selected);
      if (selectedNodes.length > 1) {
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

  const handlePlusAction = useCallback(
    (actionId: 'upload' | 'ai-image' | 'ai-video', subActionId?: string) => {
      setPlusMenuOpen(false);
      setPlusMenuTab(null);

      if (actionId === 'upload') {
        widgetBridge.emit(
          createWidgetEvent(
            'CANVAS_CREATE_ACTION',
            { actionId },
            { source: 'ui' }
          )
        );
        return;
      }

      // AI Image / AI Video → create placeholder node at viewport center
      const instance = reactFlowInstanceRef.current;
      const placeholderSize = actionId === 'ai-image'
        ? { width: 320, height: 320 }
        : { width: 480, height: 270 };
      let centerFlow = { x: 0, y: 0 };
      if (instance) {
        const containerEl = document.querySelector('.react-flow');
        const cw = containerEl?.clientWidth ?? 1200;
        const ch = containerEl?.clientHeight ?? 800;
        centerFlow = instance.screenToFlowPosition({
          x: cw / 2,
          y: ch / 2,
        });
      }
      const placeholderNode: CanvasNodeData = {
        id: generateId(),
        type: actionId === 'ai-image' ? NodeType.IMAGE : NodeType.VIDEO,
        position: {
          x: centerFlow.x - placeholderSize.width / 2,
          y: centerFlow.y - placeholderSize.height / 2,
        },
        size: placeholderSize,
        url: '',
        title: actionId === 'ai-image' ? 'New Image' : 'New Video',
        zIndex: nodes.length,
      };
      setNodes((prev) => [...prev, placeholderNode]);
      setAiCreateMode({
        type: actionId,
        subActionId: subActionId ?? actionId,
        nodeId: placeholderNode.id,
        prompt: '',
      });
      setTimeout(() => {
        if (instance) {
          instance.fitView({
            nodes: [{ id: placeholderNode.id }] as any,
            padding: 1.2,
            duration: 300,
          });
        }
      }, 50);
    },
    [nodes.length]
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
    if (isDev()) {
      console.log('[CollaborativeCanvas] context menu delete', {
        id: target.id,
        type: target.type,
      });
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
        position: 'relative',
        width: 'inherit',
        height: 'inherit',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...style,
      }}
      onContextMenu={isViewer ? (event) => event.preventDefault() : undefined}
    >
      {/* Top Bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 48,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          background: 'rgba(17,17,19,0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Left: Logo (tooltip "Home", click navigates home) + Board Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            type="button"
            aria-label="Back to home"
            title="Back to home"
            onMouseDown={(e) => { e.stopPropagation(); }}
            onClick={(e) => {
              e.stopPropagation();
              widgetBridge.emit(createWidgetEvent('CANVAS_NAVIGATE', { target: 'home' }, { source: 'ui' }));
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              background: 'transparent',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            {topBarLogoUrl ? (
              <img src={topBarLogoUrl} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              console.log('Board menu');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'transparent',
              border: 'none',
              padding: '8px 4px',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
          >
            My First Board
            <ChevronDown size={14} color="rgba(255,255,255,0.6)" />
          </button>
        </div>

        {/* Right: Layout switcher + Share */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div ref={layoutPanelRef} style={{ position: 'relative' }}>
            <button
              type="button"
              title="Layout"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setLayoutPanelOpen((prev) => !prev);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 30,
                background: layoutPanelOpen ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
                border: 'none',
                borderRadius: 6,
                color: '#FFFFFF',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { if (!layoutPanelOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={(e) => { if (!layoutPanelOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18" /><path d="M8 4H4v4" /><path d="M20 16v4h-4" />
                <rect x="2" y="2" width="20" height="20" rx="2" />
              </svg>
            </button>
            {layoutPanelOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 8,
                  width: 240,
                  padding: 16,
                  background: FLOW_UI.panelBg,
                  border: `1px solid ${FLOW_UI.panelBorder}`,
                  borderRadius: 12,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  zIndex: 100,
                  userSelect: 'none',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: FLOW_UI.panelText, marginBottom: 12 }}>Layout</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                  {([
                    { id: 'grid', label: 'Grid', icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                      </svg>
                    )},
                    { id: 'split', label: 'Split', icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="18" rx="1" /><rect x="14" y="3" width="7" height="18" rx="1" />
                      </svg>
                    )},
                    { id: 'grouped', label: 'Grouped', icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="7" rx="1" /><rect x="3" y="14" width="8" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                      </svg>
                    )},
                    { id: 'canvas', label: 'Canvas', icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18" /><path d="M8 4H4v4" /><path d="M20 16v4h-4" />
                        <rect x="2" y="2" width="20" height="20" rx="2" />
                      </svg>
                    )},
                  ] as const).map((mode) => {
                    const isActive = mode.id === 'canvas';
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          setLayoutPanelOpen(false);
                          if (mode.id !== 'canvas') {
                            widgetBridge.emit(
                              createWidgetEvent('CANVAS_LAYOUT_CHANGE', { layout: mode.id }, { source: 'ui' })
                            );
                          }
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                          padding: '8px 4px',
                          border: 'none',
                          background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                          color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                          borderRadius: 8,
                          cursor: mode.id === 'canvas' ? 'default' : 'pointer',
                          fontSize: 10,
                          fontWeight: 500,
                          transition: 'background 120ms ease, color 120ms ease',
                        }}
                        onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; } }}
                        onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; } }}
                      >
                        {mode.icon}
                        <span>{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              height: 30,
              padding: '0 12px',
              background: '#6366f1',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <UserPlus size={15} />
            Share
          </button>
        </div>
      </div>
      {/* Plus menu popup - rendered at main level for proper z-index */}
      {plusMenuOpen && canEdit && !inpaintFocus && !aiCreateMode && (
        <>
          <div
            onClick={() => { setPlusMenuOpen(false); setPlusMenuTab(null); }}
            style={{ position: 'fixed', inset: 0, zIndex: 49 }}
          />
          <div
            style={{
              position: 'fixed',
              left: 60,
              top: '50%',
              transform: 'translateY(-50%)',
              borderRadius: 12,
              background: FLOW_UI.panelBg,
              border: `1px solid ${FLOW_UI.panelBorder}`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'row',
              overflow: 'hidden',
              userSelect: 'none',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderRight: `1px solid ${FLOW_UI.divider}`,
                width: 80,
                padding: '6px 0',
              }}
            >
              {([
                { id: 'ai-image', label: 'Image', Icon: ImagePlus },
                { id: 'ai-video', label: 'Video', Icon: Video },
                { id: 'avatar', label: 'Avatar', Icon: ScanFace },
                { id: 'audio', label: 'Audio', Icon: AudioLines },
                { id: 'upload', label: 'Upload', Icon: Upload },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (tab.id === 'upload') {
                      handlePlusAction('upload');
                      return;
                    }
                    setPlusMenuTab(tab.id);
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    padding: '10px 6px',
                    border: 'none',
                    background: plusMenuTab === tab.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: plusMenuTab === tab.id ? '#fff' : 'rgba(255,255,255,0.5)',
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: 'pointer',
                    borderRadius: 0,
                    transition: 'background 120ms ease, color 120ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (plusMenuTab !== tab.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    if (plusMenuTab !== tab.id) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <tab.Icon size={20} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
            <div style={{ minWidth: 220, padding: 6 }}>
              {plusMenuTab === 'ai-image' && ([
                { id: 'text-to-image', label: 'Text to Image', Icon: Type },
                { id: 'image-edit', label: 'Image Edit', Icon: Paintbrush },
                { id: 'inpaint', label: 'Inpaint', Icon: Eraser },
                { id: 'image-character-swap', label: 'Image Character Swap', Icon: Repeat2 },
                { id: 'image-face-swap', label: 'Image Face Swap', Icon: Smile },
                { id: 'image-upscale', label: 'Image Upscale', Icon: ArrowUpRight },
                { id: 'photo-angle-editor', label: 'Photo Angle Editor', Icon: RotateCcw },
              ]).map((item) => (
                <button key={item.id} type="button" onClick={() => handlePlusAction('ai-image', item.id)}
                  style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', color: FLOW_UI.panelText, fontSize: 13, fontWeight: 500, textAlign: 'left' as const, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'background 120ms ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <item.Icon size={16} color="#ffffff" />{item.label}
                </button>
              ))}
              {plusMenuTab === 'ai-video' && ([
                { id: 'image-to-video', label: 'Image to Video', Icon: Clapperboard },
                { id: 'text-to-video', label: 'Text to Video', Icon: Type },
                { id: 'omni-reference', label: 'Omni Reference', Icon: Wand2 },
                { id: 'video-character-swap', label: 'Video Character Swap', Icon: Repeat2 },
                { id: 'video-upscale', label: 'Video Upscale', Icon: ArrowUpRight },
                { id: 'motion-control', label: 'Motion Control', Icon: PersonStanding },
              ]).map((item) => (
                <button key={item.id} type="button" onClick={() => handlePlusAction('ai-video', item.id)}
                  style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', color: FLOW_UI.panelText, fontSize: 13, fontWeight: 500, textAlign: 'left' as const, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'background 120ms ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <item.Icon size={16} color="#ffffff" />{item.label}
                </button>
              ))}
              {plusMenuTab === 'avatar' && ([
                { id: 'ai-avatar', label: 'AI Avatar', Icon: ScanFace },
                { id: 'product-avatar', label: 'Product Avatar', Icon: Box },
                { id: 'design-avatar', label: 'Design My Avatar', Icon: Blend },
                { id: 'video-lip-sync', label: 'Video Lip Sync(Video Avatar)', Icon: Clapperboard },
              ]).map((item) => (
                <button key={item.id} type="button" onClick={() => { setPlusMenuOpen(false); setPlusMenuTab(null); widgetBridge.emit(createWidgetEvent('CANVAS_CREATE_ACTION', { actionId: item.id }, { source: 'ui' })); }}
                  style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', color: FLOW_UI.panelText, fontSize: 13, fontWeight: 500, textAlign: 'left' as const, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'background 120ms ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <item.Icon size={16} color="#ffffff" />{item.label}
                </button>
              ))}
              {plusMenuTab === 'audio' && ([
                { id: 'voiceover', label: 'Voiceover', Icon: Mic },
              ]).map((item) => (
                <button key={item.id} type="button" onClick={() => { setPlusMenuOpen(false); setPlusMenuTab(null); widgetBridge.emit(createWidgetEvent('CANVAS_CREATE_ACTION', { actionId: item.id }, { source: 'ui' })); }}
                  style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', color: FLOW_UI.panelText, fontSize: 13, fontWeight: 500, textAlign: 'left' as const, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'background 120ms ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <item.Icon size={16} color="#ffffff" />{item.label}
                </button>
              ))}
              {plusMenuTab === 'upload' && (
                <div style={{ padding: '20px 12px', color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center' }}>
                  Uploading...
                </div>
              )}
            </div>
          </div>
        </>
      )}
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
        {canEdit && !inpaintFocus && !aiCreateMode && (
          <div
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: plusMenuOpen ? 51 : 5,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              padding: 4,
              width: 48,
              borderRadius: 12,
              background: FLOW_UI.panelBg,
              border: `1px solid ${FLOW_UI.panelBorder}`,
              boxShadow: FLOW_UI.panelShadow,
              userSelect: 'none',
            }}
          >
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setPlusMenuOpen((prev) => {
                    if (!prev) setPlusMenuTab('ai-image');
                    return !prev;
                  });
                }}
                title="Create"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  border: 'none',
                  background: plusMenuOpen ? 'rgba(255,255,255,0.85)' : '#fff',
                  color: '#1c1e22',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PlusIcon size={18} />
              </button>
            </div>

            <div
              style={{
                height: 1,
                margin: '2px 4px',
                background: FLOW_UI.divider,
              }}
            />

            <button
              type="button"
              onClick={() => {
                if (isLocked) return;
                if (toolMode === 'edit') {
                  setToolMode('pan');
                } else {
                  setToolMode('edit');
                  setActiveTool('select');
                }
              }}
              title={toolMode === 'edit' ? 'Cursor (V) — click to switch to Hand (H)' : 'Hand (H) — click to switch to Cursor (V)'}
              style={getToolButtonStyle(true, isLocked)}
              disabled={isLocked}
            >
              {toolMode === 'edit' ? <EditModeIcon size={18} /> : <PanModeIcon size={18} />}
            </button>

            <button
              type="button"
              onClick={() => {
                if (isLocked) {
                  return;
                }
                setActiveTool(activeTool === 'text' ? 'select' : 'text');
              }}
              title="Add Text (T)"
              style={getToolButtonStyle(activeTool === 'text', isLocked)}
              disabled={isLocked}
            >
              <TextModeIcon size={18} />
            </button>

          </div>
        )}
        <div style={{ width: '100%', height: '100%' }}>
          <SelectModeProvider value={selectMode}>
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
                        : 'default'
                }
                nodesDraggable={!isLocked && effectiveToolMode === 'edit' && !inpaintFocus && !aiCreateMode}
                elementsSelectable={!isLocked && !inpaintFocus && !aiCreateMode}
                selectionOnDrag={!isLocked && effectiveToolMode === 'edit' && !inpaintFocus && !aiCreateMode}
                panOnDrag={isLocked ? [] : effectiveToolMode === 'pan' ? [0, 1, 2] : [1, 2]}
                onLockChange={setIsLocked}
                isLocked={isLocked}
                showControls={canEdit}
                config={canvasConfig}
                width={width}
                height={height}
                minWidth={minWidth}
                minHeight={minHeight}
                onReactFlowInit={(instance) => {
                  reactFlowInstanceRef.current = instance;
                }}
              />
              </DependencyFocusProvider>
            </CanvasRoleProvider>
          </SelectModeProvider>
        </div>
        {/* Inpaint focus overlay + toolbar */}
        {inpaintFocus && (() => {
          const focusedNode = nodes.find((n) => n.id === inpaintFocus.nodeId);
          if (!focusedNode) return null;
          const screenX = focusedNode.position.x * viewport.zoom + viewport.x;
          const screenY = focusedNode.position.y * viewport.zoom + viewport.y;
          const screenW = focusedNode.size.width * viewport.zoom;
          const screenH = focusedNode.size.height * viewport.zoom;

          const handleInpaintSubmit = () => {
            if (!inpaintFocus.prompt.trim()) return;
            widgetBridge.emit(
              createWidgetEvent(
                'NODE_QUICK_ACTION',
                {
                  nodeId: inpaintFocus.nodeId,
                  actionId: 'inpaint',
                  actionLabel: 'Inpaint',
                  prompt: inpaintFocus.prompt,
                  maskTool: inpaintFocus.maskTool,
                  brushSize: inpaintFocus.brushSize,
                },
                { source: 'inpaint-toolbar' }
              )
            );
          };

          const maskBtnStyle = (active: boolean): React.CSSProperties => ({
            width: 32,
            height: 32,
            borderRadius: 8,
            border: 'none',
            background: active ? 'rgba(99,102,241,0.3)' : 'transparent',
            color: active ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 100ms ease',
          });

          return (
            <>
              {/* Transparent dismissal overlay (4 segments) */}
              <div
                onClick={() => setInpaintFocus(null)}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: Math.max(0, screenY - 2), zIndex: 40, cursor: 'pointer' }}
              />
              <div
                onClick={() => setInpaintFocus(null)}
                style={{ position: 'absolute', top: screenY + screenH + 2, left: 0, right: 0, bottom: 0, zIndex: 40, cursor: 'pointer' }}
              />
              <div
                onClick={() => setInpaintFocus(null)}
                style={{ position: 'absolute', top: screenY - 2, left: 0, width: Math.max(0, screenX - 2), height: screenH + 4, zIndex: 40, cursor: 'pointer' }}
              />
              <div
                onClick={() => setInpaintFocus(null)}
                style={{ position: 'absolute', top: screenY - 2, left: screenX + screenW + 2, right: 0, height: screenH + 4, zIndex: 40, cursor: 'pointer' }}
              />
              {/* Focus highlight (Solid border) */}
              <div
                style={{
                  position: 'absolute',
                  left: screenX - 2,
                  top: screenY - 2,
                  width: screenW + 4,
                  height: screenH + 4,
                  zIndex: 41,
                  borderRadius: 6,
                  border: '2px solid #6366f1',
                  pointerEvents: 'none',
                }}
              />

              {/* === Mask toolbar + close (above image) === */}
              <div
                style={{
                  position: 'absolute',
                  left: screenX + screenW / 2,
                  transform: 'translateX(-50%)',
                  top: screenY - 50,
                  zIndex: 42,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  padding: '4px 6px',
                  borderRadius: 12,
                  background: FLOW_UI.panelBg,
                  border: `1px solid ${FLOW_UI.panelBorder}`,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                <button
                  type="button"
                  title="Brush"
                  onClick={() => setInpaintFocus((p) => p ? { ...p, maskTool: 'brush' } : p)}
                  style={maskBtnStyle(inpaintFocus.maskTool === 'brush')}
                >
                  <Paintbrush size={15} />
                </button>
                <button
                  type="button"
                  title="Eraser"
                  onClick={() => setInpaintFocus((p) => p ? { ...p, maskTool: 'eraser' } : p)}
                  style={maskBtnStyle(inpaintFocus.maskTool === 'eraser')}
                >
                  <Eraser size={15} />
                </button>
                <div style={{ width: 1, height: 18, background: FLOW_UI.divider, margin: '0 3px' }} />
                <input
                  type="range"
                  min={5}
                  max={80}
                  value={inpaintFocus.brushSize}
                  onChange={(e) =>
                    setInpaintFocus((p) => p ? { ...p, brushSize: Number(e.target.value) } : p)
                  }
                  style={{ width: 72, accentColor: '#6366f1' }}
                />
                <div style={{ width: 1, height: 18, background: FLOW_UI.divider, margin: '0 3px' }} />
                <button
                  type="button"
                  title="Undo"
                  onClick={() => {
                    widgetBridge.emit(createWidgetEvent('INPAINT_MASK_ACTION', { action: 'undo' }, { source: 'ui' }));
                  }}
                  style={maskBtnStyle(false)}
                >
                  <Undo2 size={15} />
                </button>
                <button
                  type="button"
                  title="Redo"
                  onClick={() => {
                    widgetBridge.emit(createWidgetEvent('INPAINT_MASK_ACTION', { action: 'redo' }, { source: 'ui' }));
                  }}
                  style={maskBtnStyle(false)}
                >
                  <Redo2 size={15} />
                </button>
                <div style={{ width: 1, height: 18, background: FLOW_UI.divider, margin: '0 3px' }} />
                <button
                  type="button"
                  title="Close"
                  onClick={() => setInpaintFocus(null)}
                  style={{
                    ...maskBtnStyle(false),
                    color: 'rgba(255,255,255,0.45)',
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* === Inpaint panel (fixed to bottom) === */}
              <div
                style={{
                  position: 'absolute',
                  left: screenX + screenW / 2, // Centered on focused node
                  transform: 'translateX(-50%)',
                  bottom: 20,
                  width: Math.min(520, Math.max(screenW + 40, 420)),
                  zIndex: 42,
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: FLOW_UI.panelBg,
                  border: `1px solid ${FLOW_UI.panelBorder}`,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  userSelect: 'none',
                }}
              >
                {/* Prompt textarea */}
                <textarea
                  placeholder="Describe what you want to change, or enter a prompt for the masked area"
                  value={inpaintFocus.prompt}
                  onChange={(e) =>
                    setInpaintFocus((prev) =>
                      prev ? { ...prev, prompt: e.target.value } : prev
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && inpaintFocus.prompt.trim()) {
                      e.preventDefault();
                      handleInpaintSubmit();
                    }
                  }}
                  autoFocus
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#fff',
                    fontSize: 13,
                    lineHeight: '20px',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit',
                  }}
                />
                {/* Reference + Generate row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    title="Add reference image"
                    onClick={() => {
                      widgetBridge.emit(
                        createWidgetEvent(
                          'INPAINT_UPLOAD_REFERENCE',
                          { nodeId: inpaintFocus.nodeId },
                          { source: 'ui' }
                        )
                      );
                    }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      border: '1.5px dashed rgba(255,255,255,0.15)',
                      background: 'transparent',
                      color: 'rgba(255,255,255,0.3)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Plus size={16} />
                  </button>
                  <span style={{ fontSize: 11, color: FLOW_UI.panelTextMuted, flexShrink: 0 }}>
                    Ref
                  </span>
                  <div style={{ flex: 1 }} />
                  
                  {/* Generate Button with Cost */}
                  <div
                    onClick={inpaintFocus.prompt.trim() ? handleInpaintSubmit : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      height: 36,
                      borderRadius: 10,
                      background: inpaintFocus.prompt.trim()
                        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                        : 'rgba(255,255,255,0.06)',
                      color: inpaintFocus.prompt.trim() ? '#fff' : 'rgba(255,255,255,0.25)',
                      cursor: inpaintFocus.prompt.trim() ? 'pointer' : 'default',
                      overflow: 'hidden',
                      transition: 'background 150ms ease, color 150ms ease',
                      userSelect: 'none',
                    }}
                  >
                    {/* Cost section */}
                    <div style={{
                      padding: '0 10px',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      background: 'rgba(0,0,0,0.1)',
                      borderRight: '1px solid rgba(255,255,255,0.1)',
                    }}>
                      <Sparkles size={13} color={inpaintFocus.prompt.trim() ? '#fbbf24' : 'currentColor'} />
                      <span>4</span>
                    </div>
                    {/* Send section */}
                    <div style={{
                      padding: '0 12px',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Send size={15} />
                    </div>
                  </div>
                </div>
              </div>
            </>
          );
        })()}
        {/* AI Create mode overlay + toolbar */}
        {aiCreateMode && (() => {
          const placeholderNode = nodes.find((n) => n.id === aiCreateMode.nodeId);
          if (!placeholderNode) return null;
          const screenX = placeholderNode.position.x * viewport.zoom + viewport.x;
          const screenY = placeholderNode.position.y * viewport.zoom + viewport.y;
          const screenW = placeholderNode.size.width * viewport.zoom;
          const screenH = placeholderNode.size.height * viewport.zoom;
          const isImage = aiCreateMode.type === 'ai-image';
          return (
            <>
              {/* Transparent dismissal overlay (click outside exits create mode but keeps placeholder) */}
              <div
                onClick={() => {
                  setAiCreateMode(null);
                }}
                style={{ position: 'absolute', inset: 0, zIndex: 39 }}
              />
              {/* Selected border overlay on the placeholder node */}
              <div
                style={{
                  position: 'absolute',
                  left: screenX - 2,
                  top: screenY - 2,
                  width: screenW + 4,
                  height: screenH + 4,
                  zIndex: 41,
                  borderRadius: 4,
                  border: '2px solid #3b82f6',
                  pointerEvents: 'none',
                }}
              />
              {/* Fixed-size creation panel below the placeholder */}
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  left: screenX + screenW / 2 - 260,
                  top: screenY + screenH + 12,
                  width: 520,
                  zIndex: 42,
                  padding: '12px 14px',
                  borderRadius: 16,
                  background: FLOW_UI.panelBg,
                  border: `1px solid ${FLOW_UI.panelBorder}`,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: isImage
                        ? 'rgba(99,102,241,0.15)'
                        : 'rgba(236,72,153,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isImage
                      ? <ImagePlus size={14} color="#818cf8" />
                      : <Video size={14} color="#f472b6" />}
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                    {aiCreateMode.subActionId
                      .split('-')
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ')}
                  </span>
                </div>
                <textarea
                  placeholder={
                    isImage
                      ? 'Describe anything you want to generate'
                      : 'Describe the video you want to create...'
                  }
                  value={aiCreateMode.prompt}
                  onChange={(e) =>
                    setAiCreateMode((prev) =>
                      prev ? { ...prev, prompt: e.target.value } : prev
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && aiCreateMode.prompt.trim()) {
                      e.preventDefault();
                      widgetBridge.emit(
                        createWidgetEvent(
                          'CANVAS_CREATE_ACTION',
                          {
                            actionId: aiCreateMode.subActionId,
                            nodeId: aiCreateMode.nodeId,
                            prompt: aiCreateMode.prompt,
                          },
                          { source: 'ui' }
                        )
                      );
                      setAiCreateMode(null);
                    }
                  }}
                  autoFocus
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#fff',
                    fontSize: 13,
                    lineHeight: '1.5',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit',
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                    <Sparkles size={14} />
                    <span>14</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!aiCreateMode.prompt.trim()) return;
                      widgetBridge.emit(
                        createWidgetEvent(
                          'CANVAS_CREATE_ACTION',
                          {
                            actionId: aiCreateMode.subActionId,
                            nodeId: aiCreateMode.nodeId,
                            prompt: aiCreateMode.prompt,
                          },
                          { source: 'ui' }
                        )
                      );
                      setAiCreateMode(null);
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      border: 'none',
                      background: aiCreateMode.prompt.trim()
                        ? isImage
                          ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                          : 'linear-gradient(135deg, #ec4899, #f472b6)'
                        : 'rgba(255,255,255,0.06)',
                      color: aiCreateMode.prompt.trim() ? '#fff' : 'rgba(255,255,255,0.25)',
                      cursor: aiCreateMode.prompt.trim() ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'background 150ms ease, color 150ms ease',
                    }}
                  >
                    <ArrowUp size={16} />
                  </button>
                </div>
              </div>
            </>
          );
        })()}
        {contextMenu && canEdit && (
          <div
            className="widget-context-menu"
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
            <style>
              {`
                .widget-context-menu .widget-context-item {
                  width: 100%;
                  text-align: left;
                  padding: 8px 10px;
                  border: none;
                  background: transparent;
                  cursor: pointer;
                  font-size: 13px;
                  border-radius: 8px;
                  transition: background-color 120ms ease;
                }
                .widget-context-menu .widget-context-item:disabled {
                  cursor: not-allowed;
                }
                .widget-context-menu .widget-context-item:not(:disabled):hover {
                  background: rgba(255, 255, 255, 0.08);
                }
                .widget-context-menu .widget-context-item.danger:not(:disabled):hover {
                  background: rgba(239, 68, 68, 0.16);
                }
              `}
            </style>
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
                        className="widget-context-item"
                        disabled={layerInfo.isTop}
                        onClick={() => applyLayerAction(contextMenu.nodeId, 'forward')}
                        style={{
                          color: layerInfo.isTop ? FLOW_UI.panelTextDisabled : FLOW_UI.panelText,
                        }}
                      >
                        Forward 
                      </button>
                      <button
                        type="button"
                        className="widget-context-item"
                        disabled={layerInfo.isBottom}
                        onClick={() => applyLayerAction(contextMenu.nodeId, 'backward')}
                        style={{
                          color: layerInfo.isBottom ? FLOW_UI.panelTextDisabled : FLOW_UI.panelText,
                        }}
                      >
                        Backward
                      </button>
                      <button
                        type="button"
                        className="widget-context-item"
                        disabled={layerInfo.isTop}
                        onClick={() => applyLayerAction(contextMenu.nodeId, 'front')}
                        style={{
                          color: layerInfo.isTop ? FLOW_UI.panelTextDisabled : FLOW_UI.panelText,
                        }}
                      >
                        To Front
                      </button>
                      <button
                        type="button"
                        className="widget-context-item"
                        disabled={layerInfo.isBottom}
                        onClick={() => applyLayerAction(contextMenu.nodeId, 'back')}
                        style={{
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
                  {isSuccess && (
                    <button
                      type="button"
                      className="widget-context-item"
                      onClick={handleCloneNode}
                      style={{ color: FLOW_UI.panelText }}
                    >
                      Duplicate
                    </button>
                  )}
                  {isSuccess && (
                    <button
                      type="button"
                      className="widget-context-item"
                      onClick={() => {
                        widgetBridge.emit(
                          createWidgetEvent('NODE_QUICK_ACTION', { nodeId: contextMenu.nodeId, action: 'download' }, { source: 'ui' })
                        );
                        setContextMenu(null);
                      }}
                      style={{ color: FLOW_UI.panelText }}
                    >
                      Download
                    </button>
                  )}
                  <div
                    style={{
                      height: 1,
                      background: FLOW_UI.divider,
                      margin: '6px 4px',
                    }}
                  />
                  <button
                    type="button"
                    className="widget-context-item danger"
                    onClick={handleDeleteNode}
                    style={{
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
        {/* Layers panel - bottom right */}
        <div
          style={{
            position: 'absolute',
            right: 16,
            bottom: 16,
            zIndex: 20,
            pointerEvents: 'auto',
            display: (inpaintFocus || aiCreateMode) ? 'none' : undefined,
            userSelect: 'none',
          }}
        >
          {layersPanelOpen && (
            <div
              style={{
                marginBottom: 8,
                width: 260,
                maxHeight: 600,
                borderRadius: 12,
                background: FLOW_UI.panelBg,
                border: `1px solid ${FLOW_UI.panelBorder}`,
                boxShadow: FLOW_UI.panelShadow,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: `1px solid ${FLOW_UI.divider}`,
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: FLOW_UI.panelText }}>
                  Layers
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: FLOW_UI.panelTextMuted }}>
                    {nodes.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLayersPanelOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      border: 'none',
                      background: 'transparent',
                      color: FLOW_UI.panelTextMuted,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>
              <div
                style={{
                  overflowY: 'auto',
                  flex: 1,
                  padding: 4,
                }}
              >
                {(() => {
                  const sortedDesc = sortNodesByLayer(nodes).slice().reverse();
                  return sortedDesc.map((node, idx) => {
                    const raw = (node as CanvasNodeData & { raw?: RawDataItem }).raw;
                    const thumbUrl =
                      (node as any).url ||
                      raw?.result?.compressedImage?.url ||
                      raw?.result?.originImage?.url ||
                      (node.type === 'video'
                        ? ((node as any).poster ||
                           raw?.result?.originVideo?.coverUrl ||
                           raw?.result?.originVideo?.url)
                        : null);
                    const isText = node.type === 'text';
                    const isAudio = node.type === 'audio';
                    const isVideo = node.type === 'video';
                    const label =
                      (node as any).title ||
                      raw?.title ||
                      `${(node.type ?? 'image').charAt(0).toUpperCase()}${(node.type ?? 'image').slice(1)}_${node.id.slice(-4)}`;
                    const isDragging = layerDragId === node.id;
                    const isDragOver = layerDragOverId === node.id && layerDragId !== node.id;
                    return (
                      <div
                        key={node.id}
                        draggable
                        onDragStart={(e) => {
                          setLayerDragId(node.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          setLayerDragOverId(node.id);
                        }}
                        onDragLeave={() => {
                          if (layerDragOverId === node.id) setLayerDragOverId(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (!layerDragId || layerDragId === node.id) {
                            setLayerDragId(null);
                            setLayerDragOverId(null);
                            return;
                          }
                          const fromIdx = sortedDesc.findIndex((n) => n.id === layerDragId);
                          const toIdx = idx;
                          if (fromIdx === -1 || fromIdx === toIdx) {
                            setLayerDragId(null);
                            setLayerDragOverId(null);
                            return;
                          }
                          const reordered = [...sortedDesc];
                          const [moved] = reordered.splice(fromIdx, 1);
                          reordered.splice(toIdx, 0, moved);
                          const newZMap = new Map<string, number>();
                          reordered.forEach((n, i) => {
                            newZMap.set(n.id, reordered.length - 1 - i);
                          });
                          setNodes((prev) =>
                            prev.map((n) => ({
                              ...n,
                              zIndex: newZMap.get(n.id) ?? n.zIndex ?? 0,
                            }))
                          );
                          setLayerDragId(null);
                          setLayerDragOverId(null);
                        }}
                        onDragEnd={() => {
                          setLayerDragId(null);
                          setLayerDragOverId(null);
                        }}
                        onClick={() => {
                          setNodes((prev) =>
                            prev.map((n) => ({
                              ...n,
                              selected: n.id === node.id,
                            }))
                          );
                          const instance = reactFlowInstanceRef.current;
                          if (instance) {
                            const rfNodes = instance.getNodes();
                            const target = rfNodes.find((n: any) => n.id === node.id);
                            if (target) {
                              instance.fitView({ nodes: [target], padding: 0.3, duration: 300 });
                            }
                          }
                          widgetBridge.emit(
                            createWidgetEvent(
                              'CANVAS_FOCUS_NODE',
                              { nodeId: node.id },
                              { source: 'ui' }
                            )
                          );
                        }}
                        style={{
                          width: '100%',
                          padding: '5px 6px',
                          border: 'none',
                          background: isDragOver
                            ? 'rgba(99,102,241,0.15)'
                            : node.selected
                              ? 'rgba(99,102,241,0.25)'
                              : 'transparent',
                          color: FLOW_UI.panelText,
                          fontSize: 12,
                          textAlign: 'left',
                          borderRadius: 6,
                          cursor: 'grab',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          opacity: isDragging ? 0.4 : 1,
                          transition: 'background 100ms ease, opacity 100ms ease',
                          borderTop: isDragOver ? '2px solid #6366f1' : '2px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (!node.selected && !isDragOver) {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isDragOver
                            ? 'rgba(99,102,241,0.15)'
                            : node.selected
                              ? 'rgba(99,102,241,0.25)'
                              : 'transparent';
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 4,
                            overflow: 'hidden',
                            flexShrink: 0,
                            background: '#2a2d32',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {thumbUrl && !isText && !isAudio ? (
                            <img
                              src={thumbUrl}
                              alt=""
                              draggable={false}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                              }}
                            />
                          ) : (
                            <span style={{ fontSize: 14, opacity: 0.5, color: '#fff' }}>
                              {isVideo ? '▶' : isAudio ? '♪' : isText ? 'T' : '🖼'}
                            </span>
                          )}
                        </div>
                        <span
                          style={{
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: '16px',
                          }}
                        >
                          {label}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setLayersPanelOpen((prev) => !prev)}
            title="Layers"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              padding: 0,
              borderRadius: 10,
              border: `1px solid ${FLOW_UI.panelBorder}`,
              background: layersPanelOpen ? 'rgba(255,255,255,0.08)' : FLOW_UI.panelBg,
              boxShadow: FLOW_UI.panelShadow,
              color: FLOW_UI.panelText,
              cursor: 'pointer',
              float: 'right',
              transition: 'background 120ms ease',
            }}
          >
            <LayersIcon size={14} />
          </button>
        </div>
      </div>
    </main>
  );
}
