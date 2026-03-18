import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import type { CanvasConfig, CanvasNodeData, LayoutConfig, RawDataItem } from '@tc/infinite-core';
import { NodeType, generateId, parseRawData } from '@tc/infinite-core';
import type { Edge, Node as FlowNode, ReactFlowInstance } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import type { CollaborationState, ServerMessage, UserPresence } from './hooks';
import { useCollaboration } from './hooks';
import { InfiniteCanvas } from './InfiniteCanvas';
import { createWidgetEvent, widgetBridge } from './bridge';
import { isDev } from './utils/env';
import { getToolLabel } from './utils/toolLabels';
import { DependencyFocusProvider } from './nodes/DependencyFocusContext';
import { BoardTaskItem } from '@tc/infinite-core';
import { EditModeIcon, LockModeIcon, PlusIcon, LayersIcon } from './icons';
import { Upload, Image as ImageIcon, ImagePlus, Video, Send, X, Check, Paintbrush, Eraser, Undo2, Redo2, Plus, Sparkles, Share, UserPlus, ChevronDown, LayoutGrid, Frame, User, AudioLines, Mic, ScanFace, Box, Blend, Clapperboard, Type, Repeat2, Smile, ArrowUpRight, ArrowUp, RotateCcw, Tv, Wand2, ScanSearch, PersonStanding, Zap, Star, PenTool, Repeat, Maximize2, Rotate3d, ImagePlay, MoveDiagonal, Link2, CircleUser, ShoppingBag, UserPen, MicVocal, Command, Crown, type LucideIcon } from 'lucide-react';
import { CanvasRoleProvider } from './CanvasRoleContext';
import { SelectModeProvider, SelectModeState } from './SelectModeContext';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { BottomToolbar } from './BottomToolbar';
import { TextToImagePanel } from './panels/TextToImagePanel';
import { ProductPhotographyModal } from './panels/ProductPhotographyModal';
import { InpaintTutorialModal } from './panels/InpaintTutorialModal';
import { ImageUpscaleModal } from './panels/ImageUpscaleModal';
import { VideoUpscaleModal } from './panels/VideoUpscaleModal';
import { AIVideoModal } from './panels/AIVideoModal';
import type { AIVideoTab } from './panels/AIVideoModal';
import type { ImageToolTab, TextToImageState } from './panels/TextToImagePanel';
import { AiCreateProvider, type AiCreateContextValue } from './AiCreateContext';
import type { ProductPhotoState } from './panels/ProductPhotographyModal';
import { AIAvatarModal } from './panels/AIAvatarModal';
import { VideoLipSyncModal } from './panels/VideoLipSyncModal';
import { DesignMyAvatarModal } from './panels/DesignMyAvatarModal';
import { ProductAvatarModal } from './panels/ProductAvatarModal';
import { Camera } from 'lucide-react';
import { MultiSelectToolbar, MultiSelectCornerHandles, type AlignDirection } from './MultiSelectBar';
import { useMultiSelectInfo } from './hooks/useMultiSelectActions';

const DEFAULT_SUBCANVAS_KEY = '__default__';
const FLOW_UI = {
  canvasBg: '#000000',
  panelBg: '#1c1e22',
  panelBorder: 'rgba(255,255,255,0.08)',
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

// ─── Sidebar style constants (inline, no Tailwind — widget has no Tailwind) ──

/** Nav item label: 11px / 14px lh / #D4D4D4 */
const NAV_LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 400,
  lineHeight: '14px',
  letterSpacing: 'normal',
  color: '#D4D4D4',
};

/** Footer item label: 10px / #fff */
const FOOTER_LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 400,
  lineHeight: 1,
  color: '#fff',
};

/** Shared nav button base style */
const NAV_BTN_BASE: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,           // gap-1 = 4px
  padding: 8,       // p-2 = 8px
  borderRadius: 8,  // rounded-lg
  border: 'none',
  background: 'transparent',
  color: 'rgba(255,255,255,0.6)',  // text-white/60
  cursor: 'pointer',
  transition: 'background 120ms ease, color 120ms ease',
  fontFamily: 'Inter, -apple-system, sans-serif',
};

/** Footer button base style */
const FOOTER_BTN_BASE: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  padding: 8,
  borderRadius: 8,
  border: 'none',
  background: 'transparent',
  color: '#fff',
  cursor: 'pointer',
  transition: 'background 120ms ease',
  fontFamily: 'Inter, -apple-system, sans-serif',
};

function SidebarNavBtn({
  children,
  onClick,
  disabled,
  'aria-label': ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  'aria-label'?: string;
}) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      style={{
        ...NAV_BTN_BASE,
        background: hovered && !disabled ? 'rgba(255,255,255,0.05)' : 'transparent',
        color: disabled ? 'rgba(255,255,255,0.2)' : hovered ? '#fff' : 'rgba(255,255,255,0.6)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  );
}

function SidebarFooterBtn({
  children,
  onClick,
  'aria-label': ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  'aria-label'?: string;
}) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      style={{
        ...FOOTER_BTN_BASE,
        background: hovered ? 'rgba(255,255,255,0.05)' : 'transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  );
}

// ─── Toolbar hover-menu primitives ───────────────────────────────────────────

const TOOLBAR_MENU_STYLE: React.CSSProperties = {
  borderRadius: 8,
  background: '#252525',
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  userSelect: 'none',
  overflow: 'hidden',
  padding: 8,
  minWidth: 200,
};

function ToolbarItemWithMenu({
  button,
  menu,
  disabled,
}: {
  button: React.ReactNode;
  menu: React.ReactNode;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = React.useCallback(() => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
  }, []);
  const scheduleClose = React.useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => { setOpen(false); closeTimer.current = null; }, 100);
  }, [cancelClose]);

  React.useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  return (
    <div
      ref={btnRef}
      style={{ position: 'relative' }}
      onMouseEnter={() => {
        if (disabled) return;
        cancelClose();
        setOpen(true);
        if (btnRef.current) {
          const rect = btnRef.current.getBoundingClientRect();
          const sidebar = btnRef.current.closest('aside');
          const sidebarRight = sidebar ? sidebar.getBoundingClientRect().right : rect.right;
          setPos({ top: rect.top, left: sidebarRight });
        }
      }}
      onMouseLeave={scheduleClose}
    >
      {button}
      {!disabled && open && pos && ReactDOM.createPortal(
        <div
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left + 4,
            zIndex: 1050,
            paddingLeft: 4, // 桥接间隙
          }}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          {/* Bridge div to prevent closing when moving from button to menu */}
          <div 
            style={{ 
              position: 'absolute', 
              left: -8, 
              top: 0, 
              width: 8, 
              height: '100%',
              background: 'transparent'
            }} 
          />
          <div style={TOOLBAR_MENU_STYLE}>
            {menu}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function ToolbarMenuItem({
  Icon,
  label,
  onClick,
}: {
  Icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        height: 40,
        padding: '0 8px',
        border: 'none',
        background: hovered ? 'rgba(255,255,255,0.05)' : 'transparent',
        color: hovered ? '#fff' : '#D4D4D4',
        fontSize: 14,
        fontWeight: 400,
        lineHeight: '20px',
        textAlign: 'left',
        borderRadius: 8,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transition: 'background 100ms ease, color 100ms ease',
        whiteSpace: 'nowrap',
      }}
    >
      <Icon size={18} color={hovered ? '#fff' : '#D4D4D4'} style={{ flexShrink: 0 }} />
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

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
  /** 用户头像 URL */
  userAvatarUrl?: string;
  /** 用户积分/credits 数量 */
  userCredits?: number;
  /** AI Avatar 模型预览视频 URL（如 /avatar-demo.mp4，需 host 在 public 提供） */
  modelPreviewVideoUrl?: string;
  /** AI Avatar 模型预览封面图 URL */
  modelPreviewPosterUrl?: string;
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
  userAvatarUrl,
  userCredits,
  modelPreviewVideoUrl,
  modelPreviewPosterUrl,
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
    type: 'canvas' | 'node' | 'multi-node';
    nodeId?: string;
    nodeIds?: string[];
    exportSubmenuOpen?: boolean;
  } | null>(null);
  const [sessionBlocked, setSessionBlocked] = useState<{ message: string } | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; variant: 'info' | 'error' }>
  >([]);

  // Select mode state - 素材选择模式状态
  const [selectMode, setSelectMode] = useState<SelectModeState>({
    isActive: false,
    mediaType: null,
  });

  const [layersPanelOpen, setLayersPanelOpen] = useState(false);

  const selectedNodes = useMemo(() => nodes.filter((n) => n.selected), [nodes]);
  const multiSelectInfo = useMultiSelectInfo(selectedNodes);

  // Snapshot of selected node IDs — updated whenever selection changes.
  // Used by Shift+2 because React Flow clears selection on Shift keydown
  // (multiSelectionKeyCode="Shift") before the digit key arrives.
  const lastSelectedIdsRef = useRef<string[]>([]);
  useEffect(() => {
    if (selectedNodes.length > 0) {
      lastSelectedIdsRef.current = selectedNodes.map((n) => n.id);
    }
  }, [selectedNodes]);
  const [layoutPanelOpen, setLayoutPanelOpen] = useState(false);
  const layoutPanelRef = useRef<HTMLDivElement | null>(null);

  // Inpaint tutorial modal (shown before entering focus mode from sidebar, or from quick action toolbar)
  const [inpaintTutorialOpen, setInpaintTutorialOpen] = useState<{ open: boolean; initialImageUrl?: string }>({ open: false });

  // Image Upscale immersive modal
  const [imageUpscaleOpen, setImageUpscaleOpen] = useState(false);

  // Video Upscale immersive modal
  const [videoUpscaleOpen, setVideoUpscaleOpen] = useState(false);

  // Phase 3 Avatar modals
  const [aiAvatarModal, setAiAvatarModal] = useState<{ open: boolean; initialAvatarUrl?: string }>({ open: false });
  const [lipSyncModal, setLipSyncModal] = useState<{ open: boolean; initialVideoUrl?: string }>({ open: false });
  const [designAvatarOpen, setDesignAvatarOpen] = useState(false);
  const [productAvatarModal, setProductAvatarModal] = useState<{ open: boolean; initialProductImageUrl?: string }>({ open: false });

  const isImmersiveModalOpen = imageUpscaleOpen || videoUpscaleOpen || inpaintTutorialOpen.open
    || aiAvatarModal.open || lipSyncModal.open || designAvatarOpen || productAvatarModal.open;

  // Inpaint focus mode
  const [inpaintFocus, setInpaintFocus] = useState<{
    nodeId: string;
    prompt: string;
    maskTool: 'brush' | 'eraser';
    brushSize: number;
    /** 'upload' = waiting for image upload (sidebar-triggered); 'edit' = mask+prompt mode */
    step: 'upload' | 'edit';
    uploadedImageUrl?: string;
  } | null>(null);
  const inpaintToolbarRef = useRef<HTMLDivElement>(null);

  // Layers drag state
  const [layerDragId, setLayerDragId] = useState<string | null>(null);
  const [layerDragOverId, setLayerDragOverId] = useState<string | null>(null);

  // AI creation mode (ai-image / ai-video)
  const [aiCreateMode, setAiCreateMode] = useState<{
    type: 'ai-image' | 'ai-video' | 'ai-avatar' | 'ai-audio';
    subActionId: string;
    nodeId: string;
    prompt: string;
    referenceImageUrl?: string;
  } | null>(null);

  // Product Photography immersive modal
  const [ppModalState, setPpModalState] = useState<{
    open: boolean;
    nodeId: string;
    initialProductImageUrl?: string;
  } | null>(null);
  // Tracks node IDs that are currently generating — prevents modal re-open
  const ppGeneratingRef = useRef<Set<string>>(new Set());
  // Ref mirror of ppModalState for use in event handlers without stale closures
  const ppModalStateRef = useRef(ppModalState);
  ppModalStateRef.current = ppModalState;
  // Cooldown: suppress placeholder panel activation briefly after modal close
  const ppClosedAtRef = useRef<number>(0);
  const reactFlowInstanceRef = useRef<ReactFlowInstance<FlowNode<CanvasNodeData>, Edge> | null>(null);
  const [isFlowReady, setIsFlowReady] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const initialMediaLoadedRef = useRef(false);

  // Re-activate creation panel when clicking a placeholder/draft node.
  // Uses a callback instead of a nodes-dependent useEffect to avoid the race
  // condition where clicking an already-selected node doesn't change `nodes`,
  // so the effect never re-fires.
  const tryActivatePlaceholderPanel = useCallback((nodeId: string) => {
    if (inpaintFocus || ppModalState?.open) return;
    // Never re-open for nodes that are currently generating
    if (ppGeneratingRef.current.has(nodeId)) return;
    // Cooldown after modal close to prevent immediate re-trigger
    if (Date.now() - ppClosedAtRef.current < 500) return;
    const node = nodesRef.current.find((n) => n.id === nodeId);
    if (!node) return;
    const nodeAny = node as CanvasNodeData & { toolId?: string; toolCategory?: string; raw?: { status?: string } };
    if (!nodeAny.toolId || node.url) return;
    if (nodeAny.raw?.status) return;
    if (nodeAny.toolId === 'inpaint') return;
    if (nodeAny.toolId === 'product-photography') {
      setPpModalState({ open: true, nodeId: node.id });
      return;
    }
    const category = (nodeAny.toolCategory ?? 'ai-image') as 'ai-image' | 'ai-video' | 'ai-avatar' | 'ai-audio';
    // Use functional update: if already open for this node, preserve prompt;
    // otherwise (re-)activate with empty prompt. This also correctly handles
    // the race where CanvasPanel's dismiss queued setAiCreateMode(null) in the
    // same event — the functional update runs after the null, so we re-set it.
    setAiCreateMode((prev) => {
      if (prev?.nodeId === nodeId) return prev;
      return {
        type: category,
        subActionId: nodeAny.toolId!,
        nodeId: node.id,
        prompt: '',
      };
    });
  }, [inpaintFocus, ppModalState]);

  // Also run on initial selection (e.g. node created with selected: true)
  useEffect(() => {
    if (aiCreateMode || inpaintFocus || ppModalState?.open) return;
    if (Date.now() - ppClosedAtRef.current < 500) return;
    const selectedNode = nodes.find((n) => n.selected);
    if (!selectedNode) return;
    if (ppGeneratingRef.current.has(selectedNode.id)) return;
    if (selectedNode.url) return;
    const nodeAny = selectedNode as CanvasNodeData & { raw?: { status?: string } };
    if (nodeAny.raw?.status) return;
    tryActivatePlaceholderPanel(selectedNode.id);
  }, [nodes, aiCreateMode, inpaintFocus, ppModalState, tryActivatePlaceholderPanel]);


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

  useEffect(() => {
    if (canvasReady) {
      const timer = setTimeout(() => setToolbarVisible(true), 300);
      return () => clearTimeout(timer);
    }
  }, [canvasReady]);

  useEffect(() => {
    // Don't start until both ReactFlow is ready AND data has been seeded.
    // readyForRawMergeRef is set synchronously before setNodes() in the seeding
    // path, so by the time this effect fires (after React commit) it is reliable.
    if (initialMediaLoadedRef.current || !readyForRawMergeRef.current || !isFlowReady) {
      return;
    }
    // Wait for actual nodes data — if still empty, a subsequent effect run
    // (triggered by the nodes state change) will catch it.
    if (nodes.length === 0) {
      return;
    }

    initialMediaLoadedRef.current = true;

    // Hard fallback: never leave the overlay blocking forever
    const fallbackTimer = setTimeout(() => setCanvasReady(true), 6000);

    const revealAfterPaint = () => {
      clearTimeout(fallbackTimer);
      // Two rAFs ensure the browser has composited the decoded pixels to screen
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setCanvasReady(true);
        });
      });
    };

    const hasMediaNodes = nodes.some(
      n => (n.type === 'image' || n.type === 'video') && typeof n.url === 'string' && n.url.length > 0
    );

    if (!hasMediaNodes) {
      // No image/video content — reveal after InfiniteCanvas's extra render cycle
      requestAnimationFrame(() => requestAnimationFrame(revealAfterPaint));
      return () => clearTimeout(fallbackTimer);
    }

    // InfiniteCanvas has its own internal useEffect([initialNodes]) that runs
    // ONE render cycle after CollaborativeCanvas's nodes state update. The actual
    // <img> elements are only inserted into the ReactFlow DOM after that extra
    // cycle. We must wait for them to exist before we can listen for their load.
    //
    // Strategy: poll with rAF until ReactFlow <img>/<video> elements appear,
    // then wait for each one to fully decode (img.decode() = pixels ready to
    // composite), then reveal. Retries cap at ~500ms to handle edge cases.
    const container = canvasRef.current;

    const waitForDomImages = (retriesLeft: number) => {
      const imgs = container
        ? (Array.from(container.querySelectorAll('.react-flow__node img')) as HTMLImageElement[])
        : [];
      const videos = container
        ? (Array.from(container.querySelectorAll('.react-flow__node video')) as HTMLVideoElement[])
        : [];

      if (imgs.length === 0 && videos.length === 0) {
        if (retriesLeft > 0) {
          requestAnimationFrame(() => waitForDomImages(retriesLeft - 1));
        } else {
          // No img elements found after retries (e.g. all skeleton nodes) — reveal
          revealAfterPaint();
        }
        return;
      }

      const imgPromises: Promise<void>[] = imgs.map(img => {
        // Already decoded and painted
        if (img.complete && img.naturalWidth > 0) {
          return (img.decode ? img.decode().catch(() => {}) : Promise.resolve());
        }
        return new Promise<void>(resolve => {
          const onLoad = () => {
            (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => resolve());
          };
          img.addEventListener('load', onLoad, { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        });
      });

      const videoPromises: Promise<void>[] = videos.map(video => {
        if (video.readyState >= 1) return Promise.resolve(); // HAVE_METADATA
        return new Promise<void>(resolve => {
          video.addEventListener('loadedmetadata', () => resolve(), { once: true });
          video.addEventListener('error', () => resolve(), { once: true });
        });
      });

      Promise.all([...imgPromises, ...videoPromises]).then(revealAfterPaint);
    };

    // Start after double rAF — gives InfiniteCanvas's internal useEffect time
    // to run and ReactFlow to insert <img> nodes into the DOM
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        waitForDomImages(30); // ~500ms worth of retries at 60fps
      });
    });

    return () => clearTimeout(fallbackTimer);
  }, [nodes, isFlowReady]);
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
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setContextMenu(null); };
    window.addEventListener('click', handleClose);
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('keydown', handleEsc);
    };
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

    // Capture-phase handler: runs BEFORE React Flow can consume Shift events
    const handleKeyDownCapture = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) {
        return;
      }

      // Shift+1: fit all to screen
      if (event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey && event.code === 'Digit1') {
        event.preventDefault();
        event.stopImmediatePropagation();
        reactFlowInstanceRef.current?.fitView({ padding: 0.15, duration: 300 });
        return;
      }
      // Shift+2: zoom to selection
      if (event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey && event.code === 'Digit2') {
        event.preventDefault();
        event.stopImmediatePropagation();
        const instance = reactFlowInstanceRef.current;
        if (instance) {
          const selectedIds = lastSelectedIdsRef.current;
          if (selectedIds.length > 0) {
            const rfNodes = instance.getNodes();
            const targets = rfNodes.filter((n: any) => selectedIds.includes(n.id));
            if (targets.length > 0) {
              instance.fitView({ nodes: targets, padding: 0.1, maxZoom: 3, duration: 300 });
            } else {
              instance.fitView({ padding: 0.15, duration: 300 });
            }
          } else {
            instance.fitView({ padding: 0.15, duration: 300 });
          }
        }
        return;
      }

      // ⌘+= / ⌘++: zoom in (preventDefault to block browser zoom)
      if ((event.metaKey || event.ctrlKey) && (event.key === '=' || event.key === '+')) {
        event.preventDefault();
        reactFlowInstanceRef.current?.zoomIn({ duration: 0 });
        return;
      }
      // ⌘+-: zoom out (preventDefault to block browser zoom)
      if ((event.metaKey || event.ctrlKey) && event.key === '-') {
        event.preventDefault();
        reactFlowInstanceRef.current?.zoomOut({ duration: 0 });
        return;
      }
    };

    // Bubble-phase handler: normal shortcuts
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) {
        return;
      }
      const key = event.key.toLowerCase();
      const hasModifier = event.metaKey || event.ctrlKey || event.altKey;

      // F: fit all to screen
      if (!hasModifier && !event.shiftKey && key === 'f') {
        reactFlowInstanceRef.current?.fitView({ padding: 0.15, duration: 300 });
        return;
      }

      if (!canEdit) {
        return;
      }
      if (!hasModifier && !event.shiftKey && key === 'v') {
        setToolMode('edit');
        setActiveTool('select');
      }
      if (!hasModifier && !event.shiftKey && key === 'h') {
        setToolMode('pan');
      }
      if (key === '/' || key === '?') {
        setShortcutsOpen((prev) => !prev);
      }
      if (event.code === 'Space' && !spaceHeld) {
        if (ppModalStateRef.current?.open) return;
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
    window.addEventListener('keydown', handleKeyDownCapture, true);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDownCapture, true);
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

  // Listen for inpaint quick action → open immersive modal with node image
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
          const node = nodesRef.current.find((n) => n.id === targetId);
          const nodeUrl = (node?.url as string) || '';
          setInpaintTutorialOpen({ open: true, initialImageUrl: nodeUrl || undefined });
        }
      }
    );
    return unsubscribe;
  }, []);

  // Listen for avatar quick actions → open corresponding modal
  useEffect(() => {
    const unsubscribe = widgetBridge.on(
      'NODE_QUICK_ACTION',
      (event: { payload?: { actionId?: string; nodeId?: string; imageUrl?: string; videoUrl?: string; node?: any }; source?: string }) => {
        const { actionId, nodeId } = event.payload ?? {};
        if (!actionId || !nodeId) return;
        const node = nodesRef.current.find((n) => n.id === nodeId);
        if (!node) return;
        const nodeUrl = (node.url as string) || '';

        if (actionId === 'avatar') {
          if (node.type === NodeType.VIDEO) {
            setLipSyncModal({ open: true, initialVideoUrl: nodeUrl });
          } else {
            setAiAvatarModal({ open: true, initialAvatarUrl: nodeUrl });
          }
        }
        if (actionId === 'product-avatar') {
          setProductAvatarModal({ open: true, initialProductImageUrl: nodeUrl });
        }
        if (actionId === 'video-lip-sync') {
          setLipSyncModal({ open: true, initialVideoUrl: nodeUrl });
        }
        if (actionId === 'video' && node.type === NodeType.IMAGE) {
          setAiCreateMode({
            type: 'ai-video',
            subActionId: 'image-to-video',
            nodeId,
            prompt: '',
            referenceImageUrl: nodeUrl,
          });
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

  // Smooth rAF-based positioning for inpaint mask toolbar & border highlight.
  // Reads the node DOM element's bounding rect directly, bypassing React state lag.
  useEffect(() => {
    if (!inpaintFocus || inpaintFocus.step !== 'edit') return;
    const nodeEl = document.querySelector(`[data-id="${inpaintFocus.nodeId}"]`) as HTMLElement | null;
    if (!nodeEl) return;
    let rafId: number;
    const update = () => {
      const rect = nodeEl.getBoundingClientRect();
      const toolbar = inpaintToolbarRef.current;
      if (toolbar) {
        toolbar.style.left = `${rect.left + rect.width / 2}px`;
        toolbar.style.top = `${rect.top - 12}px`;
      }
      rafId = requestAnimationFrame(update);
    };
    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [inpaintFocus?.nodeId, inpaintFocus?.step]);

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
      const selectedNodes = nodesRef.current.filter((item) => item.selected);

      if (selectedNodes.length > 1) {
        const isClickedNodeSelected = selectedNodes.some((n) => n.id === node.id);
        if (isClickedNodeSelected) {
          setContextMenu({
            x: event.clientX,
            y: event.clientY,
            type: 'multi-node',
            nodeIds: selectedNodes.map((n) => n.id),
          });
        } else {
          const targetNode = nodesRef.current.find((item) => item.id === node.id);
          const raw = (targetNode as CanvasNodeData & { raw?: RawDataItem } | undefined)?.raw;
          if (String(raw?.status ?? '').toLowerCase() === 'init') return;
          setContextMenu({
            x: event.clientX,
            y: event.clientY,
            type: 'node',
            nodeId: node.id,
          });
        }
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
        type: 'node',
        nodeId: node.id,
      });
    },
    [canEdit, isLocked, toolMode]
  );

  const handlePaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      const target = event.target as HTMLElement;
      const nodeEl = target.closest('.react-flow__node');
      if (nodeEl && canEdit && !isLocked && toolMode === 'edit') {
        const nodeId = nodeEl.getAttribute('data-id');
        if (nodeId) {
          const selectedNodes = nodesRef.current.filter((n) => n.selected);
          if (selectedNodes.length > 1 && selectedNodes.some((n) => n.id === nodeId)) {
            setContextMenu({ x: event.clientX, y: event.clientY, type: 'multi-node', nodeIds: selectedNodes.map((n) => n.id) });
            return;
          }
          const targetNode = nodesRef.current.find((n) => n.id === nodeId);
          const raw = (targetNode as CanvasNodeData & { raw?: RawDataItem } | undefined)?.raw;
          if (String(raw?.status ?? '').toLowerCase() !== 'init') {
            setContextMenu({ x: event.clientX, y: event.clientY, type: 'node', nodeId });
            return;
          }
        }
      }
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        type: 'canvas',
      });
    },
    [canEdit, isLocked, toolMode]
  );

  const getNewNodePosition = useCallback(
    (placeholderSize: { width: number; height: number }) => {
      const GAP = 40;
      if (nodes.length > 0) {
        let minX = Infinity, maxX = -Infinity, maxBottom = -Infinity;
        for (const n of nodes) {
          const nx = n.position.x;
          const nRight = nx + n.size.width;
          const nBottom = n.position.y + n.size.height;
          if (nx < minX) minX = nx;
          if (nRight > maxX) maxX = nRight;
          if (nBottom > maxBottom) maxBottom = nBottom;
        }
        const centerX = (minX + maxX) / 2;
        return {
          x: centerX - placeholderSize.width / 2,
          y: maxBottom + GAP,
        };
      }
      const instance = reactFlowInstanceRef.current;
      if (instance) {
        const containerEl = document.querySelector('.react-flow');
        const cw = containerEl?.clientWidth ?? 1200;
        const ch = containerEl?.clientHeight ?? 800;
        const center = instance.screenToFlowPosition({ x: cw / 2, y: ch / 2 });
        return {
          x: center.x - placeholderSize.width / 2,
          y: center.y - placeholderSize.height / 2,
        };
      }
      return { x: -placeholderSize.width / 2, y: -placeholderSize.height / 2 };
    },
    [nodes]
  );

  const handlePlusAction = useCallback(
    (actionId: 'upload' | 'upload-image' | 'upload-video' | 'select-from-board' | 'ai-image' | 'ai-video' | 'ai-avatar' | 'ai-audio', subActionId?: string) => {
      // Product Photography → create placeholder + open immersive modal
      if (subActionId === 'product-photography') {
        const placeholderSize = { width: 320, height: 320 };
        const placeholderNode: CanvasNodeData = {
          id: generateId(),
          type: NodeType.IMAGE,
          position: getNewNodePosition(placeholderSize),
          size: placeholderSize,
          url: '',
          title: 'Image',
          zIndex: nodes.length,
          toolId: 'product-photography',
          toolCategory: 'ai-image',
        } as CanvasNodeData;
        setNodes((prev) => [...prev, placeholderNode]);
        setPpModalState({ open: true, nodeId: placeholderNode.id });
        return;
      }
      // Inpaint from sidebar → show tutorial modal first
      if (subActionId === 'inpaint') {
        setInpaintTutorialOpen({ open: true });
        return;
      }
      // Image Upscale from sidebar → show immersive modal
      if (subActionId === 'image-upscale') {
        setImageUpscaleOpen(true);
        return;
      }
      // Video Upscale from sidebar → show immersive modal
      if (subActionId === 'video-upscale') {
        setVideoUpscaleOpen(true);
        return;
      }
      // Phase 3 Avatar modals from sidebar
      if (subActionId === 'ai-avatar') {
        setAiAvatarModal({ open: true });
        return;
      }
      if (subActionId === 'video-lip-sync') {
        setLipSyncModal({ open: true });
        return;
      }
      if (subActionId === 'design-avatar') {
        setDesignAvatarOpen(true);
        return;
      }
      if (subActionId === 'product-avatar') {
        setProductAvatarModal({ open: true });
        return;
      }
      if (actionId === 'upload' || actionId === 'upload-image' || actionId === 'upload-video' || actionId === 'select-from-board') {
        widgetBridge.emit(
          createWidgetEvent(
            'CANVAS_CREATE_ACTION',
            { actionId },
            { source: 'ui' }
          )
        );
        return;
      }

      const placeholderSize = actionId === 'ai-image'
        ? { width: 1024, height: 1024 }
        : actionId === 'ai-audio'
          ? { width: 320, height: 80 }
          : { width: 1280, height: 720 };
      const nodeType = actionId === 'ai-image' ? NodeType.IMAGE
        : actionId === 'ai-audio' ? NodeType.AUDIO
        : NodeType.VIDEO;
      const nodeTitle = actionId === 'ai-image' ? 'Image'
        : actionId === 'ai-audio' ? 'Audio'
        : actionId === 'ai-avatar' ? 'Video'
        : 'Video';
      const toolId = subActionId ?? actionId;
      const placeholderNode: CanvasNodeData = {
        id: generateId(),
        type: nodeType,
        position: getNewNodePosition(placeholderSize),
        size: placeholderSize,
        url: '',
        title: nodeTitle,
        zIndex: nodes.length,
        toolId,
        toolCategory: actionId,
        selected: true,
      } as CanvasNodeData;
      setNodes((prev) => [...prev.map((n) => ({ ...n, selected: false })), placeholderNode]);
      setAiCreateMode({
        type: actionId,
        subActionId: subActionId ?? actionId,
        nodeId: placeholderNode.id,
        prompt: '',
      });
      setTimeout(() => {
        const instance = reactFlowInstanceRef.current;
        if (instance) {
          instance.fitView({
            nodes: [{ id: placeholderNode.id }] as any,
            padding: 0.35,
            maxZoom: 1,
            duration: 400,
          });
        }
      }, 50);
    },
    [nodes.length, getNewNodePosition]
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

  // --- Multi-select batch action handlers ---

  const handleBatchDelete = useCallback(() => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length === 0) return;
    const nodeIds = selected.map((n) => n.id);
    widgetBridge.emit(
      createWidgetEvent('NODE_BATCH_DELETE_REQUEST', { nodeIds, nodes: selected }, { source: 'ui' })
    );
  }, []);

  const handleBatchGroup = useCallback(() => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length < 2) return;
    widgetBridge.emit(
      createWidgetEvent('NODE_BATCH_GROUP', {
        nodeIds: selected.map((n) => n.id),
        nodes: selected,
      }, { source: 'ui' })
    );
  }, []);

  const handleBatchCopy = useCallback(() => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length === 0) return;
    widgetBridge.emit(
      createWidgetEvent('NODE_BATCH_QUICK_ACTION', {
        nodeIds: selected.map((n) => n.id),
        actionId: 'copy',
        actionLabel: 'Copy',
        nodes: selected,
      }, { source: 'ui' })
    );
  }, []);

  const handleBatchDownload = useCallback(() => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length === 0) return;
    widgetBridge.emit(
      createWidgetEvent('NODE_BATCH_DOWNLOAD', {
        nodeIds: selected.map((n) => n.id),
        nodes: selected,
      }, { source: 'ui' })
    );
  }, []);

  const handleBatchLock = useCallback(() => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length === 0) return;
    widgetBridge.emit(
      createWidgetEvent('NODE_BATCH_QUICK_ACTION', {
        nodeIds: selected.map((n) => n.id),
        actionId: 'lock',
        actionLabel: 'Lock All',
      }, { source: 'ui' })
    );
  }, []);

  const handleBatchUnlock = useCallback(() => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length === 0) return;
    widgetBridge.emit(
      createWidgetEvent('NODE_BATCH_QUICK_ACTION', {
        nodeIds: selected.map((n) => n.id),
        actionId: 'unlock',
        actionLabel: 'Unlock All',
      }, { source: 'ui' })
    );
  }, []);

  const handleBatchHide = useCallback(() => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length === 0) return;
    widgetBridge.emit(
      createWidgetEvent('NODE_BATCH_QUICK_ACTION', {
        nodeIds: selected.map((n) => n.id),
        actionId: 'hide',
        actionLabel: 'Hide All',
      }, { source: 'ui' })
    );
  }, []);

  const handleBatchShow = useCallback(() => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length === 0) return;
    widgetBridge.emit(
      createWidgetEvent('NODE_BATCH_QUICK_ACTION', {
        nodeIds: selected.map((n) => n.id),
        actionId: 'show',
        actionLabel: 'Show All',
      }, { source: 'ui' })
    );
  }, []);

  const handleBatchBringToFront = useCallback(() => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length === 0) return;
    const selectedIds = new Set(selected.map((n) => n.id));
    const sorted = sortNodesByLayer(nodesRef.current);
    const nonSelected = sorted.filter((n) => !selectedIds.has(n.id));
    const selectedSorted = sorted.filter((n) => selectedIds.has(n.id));
    const reordered = [...nonSelected, ...selectedSorted];
    const updatedNodes = reordered.map((n, i) => ({ ...n, zIndex: i }));
    setNodes(updatedNodes);
    const pendingUpdates = updatedNodes.map((n) => ({
      nodeId: n.id,
      updates: { zIndex: n.zIndex } as Partial<CanvasNodeData>,
    }));
    if (pendingUpdates.length > 0) collab.updateNodes(pendingUpdates, true);
    setContextMenu(null);
  }, [collab, sortNodesByLayer]);

  const handleBatchSendToBack = useCallback(() => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length === 0) return;
    const selectedIds = new Set(selected.map((n) => n.id));
    const sorted = sortNodesByLayer(nodesRef.current);
    const nonSelected = sorted.filter((n) => !selectedIds.has(n.id));
    const selectedSorted = sorted.filter((n) => selectedIds.has(n.id));
    const reordered = [...selectedSorted, ...nonSelected];
    const updatedNodes = reordered.map((n, i) => ({ ...n, zIndex: i }));
    setNodes(updatedNodes);
    const pendingUpdates = updatedNodes.map((n) => ({
      nodeId: n.id,
      updates: { zIndex: n.zIndex } as Partial<CanvasNodeData>,
    }));
    if (pendingUpdates.length > 0) collab.updateNodes(pendingUpdates, true);
    setContextMenu(null);
  }, [collab, sortNodesByLayer]);

  const handleBatchExport = useCallback((format: 'png' | 'jpg' | 'svg') => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length === 0) return;
    widgetBridge.emit(
      createWidgetEvent('NODE_BATCH_EXPORT', {
        nodeIds: selected.map((n) => n.id),
        format,
        nodes: selected,
      }, { source: 'ui' })
    );
  }, []);

  const handleAlign = useCallback((direction: AlignDirection) => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length < 2) return;

    let updatedPositions: Array<{ id: string; position: { x: number; y: number } }> = [];

    if (direction === 'left') {
      const minX = Math.min(...selected.map((n) => n.position.x));
      updatedPositions = selected.map((n) => ({ id: n.id, position: { x: minX, y: n.position.y } }));
    } else if (direction === 'right') {
      const maxRight = Math.max(...selected.map((n) => n.position.x + n.size.width));
      updatedPositions = selected.map((n) => ({ id: n.id, position: { x: maxRight - n.size.width, y: n.position.y } }));
    } else if (direction === 'center') {
      const minX = Math.min(...selected.map((n) => n.position.x));
      const maxRight = Math.max(...selected.map((n) => n.position.x + n.size.width));
      const centerX = (minX + maxRight) / 2;
      updatedPositions = selected.map((n) => ({ id: n.id, position: { x: centerX - n.size.width / 2, y: n.position.y } }));
    } else if (direction === 'top') {
      const minY = Math.min(...selected.map((n) => n.position.y));
      updatedPositions = selected.map((n) => ({ id: n.id, position: { x: n.position.x, y: minY } }));
    } else if (direction === 'bottom') {
      const maxBottom = Math.max(...selected.map((n) => n.position.y + n.size.height));
      updatedPositions = selected.map((n) => ({ id: n.id, position: { x: n.position.x, y: maxBottom - n.size.height } }));
    } else if (direction === 'middle') {
      const minY = Math.min(...selected.map((n) => n.position.y));
      const maxBottom = Math.max(...selected.map((n) => n.position.y + n.size.height));
      const centerY = (minY + maxBottom) / 2;
      updatedPositions = selected.map((n) => ({ id: n.id, position: { x: n.position.x, y: centerY - n.size.height / 2 } }));
    }

    setNodes((prev) =>
      prev.map((n) => {
        const update = updatedPositions.find((u) => u.id === n.id);
        return update ? { ...n, position: update.position } : n;
      })
    );
    const pendingUpdates = updatedPositions.map((u) => ({
      nodeId: u.id,
      updates: { position: u.position } as Partial<CanvasNodeData>,
    }));
    if (pendingUpdates.length > 0) collab.updateNodes(pendingUpdates, true);
  }, [collab]);

  const handleDistribute = useCallback((axis: 'horizontal' | 'vertical') => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length < 3) return;

    let updatedPositions: Array<{ id: string; position: { x: number; y: number } }> = [];

    if (axis === 'horizontal') {
      const sorted = [...selected].sort((a, b) => a.position.x - b.position.x);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const totalSpan = (last.position.x + last.size.width) - first.position.x;
      const totalNodeWidth = sorted.reduce((sum, n) => sum + n.size.width, 0);
      const gap = (totalSpan - totalNodeWidth) / (sorted.length - 1);
      let currentX = first.position.x;
      updatedPositions = sorted.map((n) => {
        const pos = { id: n.id, position: { x: currentX, y: n.position.y } };
        currentX += n.size.width + gap;
        return pos;
      });
    } else {
      const sorted = [...selected].sort((a, b) => a.position.y - b.position.y);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const totalSpan = (last.position.y + last.size.height) - first.position.y;
      const totalNodeHeight = sorted.reduce((sum, n) => sum + n.size.height, 0);
      const gap = (totalSpan - totalNodeHeight) / (sorted.length - 1);
      let currentY = first.position.y;
      updatedPositions = sorted.map((n) => {
        const pos = { id: n.id, position: { x: n.position.x, y: currentY } };
        currentY += n.size.height + gap;
        return pos;
      });
    }

    setNodes((prev) =>
      prev.map((n) => {
        const update = updatedPositions.find((u) => u.id === n.id);
        return update ? { ...n, position: update.position } : n;
      })
    );
    const pendingUpdates = updatedPositions.map((u) => ({
      nodeId: u.id,
      updates: { position: u.position } as Partial<CanvasNodeData>,
    }));
    if (pendingUpdates.length > 0) collab.updateNodes(pendingUpdates, true);
  }, [collab]);

  const handleAutoArrange = useCallback(() => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length < 2) return;

    // Simple grid auto-arrange: sort by original position, lay out in rows
    const sorted = [...selected].sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
    const cols = Math.ceil(Math.sqrt(sorted.length));
    const GAP = 24;
    const minX = Math.min(...sorted.map((n) => n.position.x));
    const minY = Math.min(...sorted.map((n) => n.position.y));

    // Compute per-column max widths and per-row max heights
    const colWidths: number[] = Array(cols).fill(0);
    const rowHeights: number[] = [];
    sorted.forEach((n, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      colWidths[col] = Math.max(colWidths[col], n.size.width);
      rowHeights[row] = Math.max(rowHeights[row] ?? 0, n.size.height);
    });

    const updatedPositions = sorted.map((n, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = minX + colWidths.slice(0, col).reduce((s, w) => s + w + GAP, 0);
      const y = minY + rowHeights.slice(0, row).reduce((s, h) => s + h + GAP, 0);
      return { id: n.id, position: { x, y } };
    });

    setNodes((prev) =>
      prev.map((n) => {
        const update = updatedPositions.find((u) => u.id === n.id);
        return update ? { ...n, position: update.position } : n;
      })
    );
    const pendingUpdates = updatedPositions.map((u) => ({
      nodeId: u.id,
      updates: { position: u.position } as Partial<CanvasNodeData>,
    }));
    if (pendingUpdates.length > 0) collab.updateNodes(pendingUpdates, true);
  }, [collab]);

  // Multi-select keyboard shortcuts: ⌘C Copy | ⇧H Horizontal Space | ⇧V Vertical Space | ⇧A Auto Arrange
  useEffect(() => {
    if (!canEdit) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.tagName && /^(INPUT|TEXTAREA)$/.test(target.tagName ?? '') || target?.isContentEditable) return;

      const key = e.key?.toLowerCase();

      if ((e.metaKey || e.ctrlKey) && key === 'c') {
        const selected = nodesRef.current.filter((n) => n.selected);
        if (selected.length > 0) {
          handleBatchCopy();
          try {
            const urls = selected.map((n) => n.url).filter(Boolean);
            if (urls.length > 0) {
              navigator.clipboard.writeText(urls.join('\n')).catch(() => {});
            }
          } catch {}
          e.preventDefault();
        }
      }

      if ((e.metaKey || e.ctrlKey) && key === 'v') {
        e.preventDefault();
        widgetBridge.emit(
          createWidgetEvent('CANVAS_PASTE', {}, { source: 'ui' })
        );
      }

      if (e.shiftKey && !e.metaKey && !e.ctrlKey) {
        const selected = nodesRef.current.filter((n) => n.selected);
        if (selected.length < 2) return;
        if (key === 'h') { e.preventDefault(); handleDistribute('horizontal'); }
        if (key === 'v') { e.preventDefault(); handleDistribute('vertical'); }
        if (key === 'a') { e.preventDefault(); handleAutoArrange(); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canEdit, handleBatchCopy, handleDistribute, handleAutoArrange]);

  useEffect(() => {
    if (!isViewer) {
      return;
    }
    setToolMode('pan');
    setActiveTool('select');
    setContextMenu(null);
  }, [isViewer]);

  const aiCreateContextValue = useMemo<AiCreateContextValue>(() => ({
    aiCreateMode,
    credits: userCredits ?? 25,
    onSubmit: (tab, state, withWatermark) => {
      if (!aiCreateMode) return;
      const targetId = aiCreateMode.nodeId;
      widgetBridge.emit(
        createWidgetEvent(
          'CANVAS_CREATE_ACTION',
          {
            actionId: tab,
            nodeId: targetId,
            prompt: state.prompt,
            model: state.model,
            ratio: state.ratio,
            resolution: state.resolution,
            referenceImageUrl: state.referenceImageUrl || undefined,
            withWatermark,
          },
          { source: 'ui' }
        )
      );
      setAiCreateMode(null);

      // Mock generation for demo: skeleton → reveal result image
      if (tab === 'text-to-image' || tab === 'image-edit') {
        const mockUrl = '/demo-text-to-image-result.png';

        setNodes((prev) => {
          const next = prev.map((n) => {
            if (n.id !== targetId) return n;
            return { ...n, raw: { status: 'init' }, url: '', selected: false };
          });
          nodesRef.current = next;
          return next;
        });
        collab.updateNodes([{ nodeId: targetId, updates: { raw: { status: 'init' }, url: '' } }], true);

        setTimeout(() => {
          reactFlowInstanceRef.current?.fitView({
            nodes: [{ id: targetId }] as any,
            padding: 0.4,
            maxZoom: 1.2,
            duration: 400,
          });
        }, 100);

        setTimeout(() => {
          setNodes((prev) => {
            const next = prev.map((n) => {
              if (n.id !== targetId) return n;
              return { ...n, raw: { status: 'success' }, url: mockUrl, thumbnailUrl: mockUrl };
            });
            nodesRef.current = next;
            return next;
          });
          collab.updateNodes([{
            nodeId: targetId,
            updates: { raw: { status: 'success' }, url: mockUrl, thumbnailUrl: mockUrl },
          }], true);
        }, 2000);
      }
    },
    onVideoSubmit: (tab, state) => {
      if (!aiCreateMode) return;
      const targetId = aiCreateMode.nodeId;
      widgetBridge.emit(
        createWidgetEvent(
          'CANVAS_CREATE_ACTION',
          {
            actionId: tab,
            nodeId: targetId,
            prompt: state.prompt,
            aspectRatio: state.aspectRatio,
            resolution: state.resolution,
            duration: state.duration,
            firstFrameUrl: state.firstFrameUrl || undefined,
            endFrameUrl: state.endFrameUrl || undefined,
            sourceVideoUrl: state.sourceVideoUrl || undefined,
          },
          { source: 'ui' }
        )
      );
      setAiCreateMode(null);
    },
    onDismiss: () => setAiCreateMode(null),
    onUploadReference: (nodeId) => {
      widgetBridge.emit(
        createWidgetEvent('CANVAS_CREATE_ACTION', { actionId: 'upload-reference', nodeId }, { source: 'ui' })
      );
    },
    onUploadFirstFrame: (nodeId) => {
      widgetBridge.emit(
        createWidgetEvent('CANVAS_CREATE_ACTION', { actionId: 'upload-first-frame', nodeId }, { source: 'ui' })
      );
    },
    onUploadEndFrame: (nodeId) => {
      widgetBridge.emit(
        createWidgetEvent('CANVAS_CREATE_ACTION', { actionId: 'upload-end-frame', nodeId }, { source: 'ui' })
      );
    },
    onUploadMedia: (nodeId) => {
      widgetBridge.emit(
        createWidgetEvent('CANVAS_CREATE_ACTION', { actionId: 'upload-media', nodeId }, { source: 'ui' })
      );
    },
    onSelectFromBoard: (nodeId) => {
      widgetBridge.emit(
        createWidgetEvent('CANVAS_NAVIGATE', { target: 'board-select', context: 'image-edit', nodeId }, { source: 'ui' })
      );
    },
    enterRemixMode: (nodeId, imageUrl) => {
      setAiCreateMode({
        type: 'ai-image',
        subActionId: 'image-edit',
        nodeId,
        prompt: '',
        referenceImageUrl: imageUrl,
      });
    },
  }), [aiCreateMode, userCredits]);

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
          left: 64,
          right: 0,
          height: 48,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          background: 'rgba(17,17,19,0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Left: Logo (tooltip "Home", click navigates home) + Board Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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

        {/* Right: Credits + Keyboard shortcuts + Layout switcher + Share */}
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
              background: '#3643FF',
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
      <div style={{ flex: 1, position: 'relative', paddingTop: 48 }} ref={canvasRef}>
        <div
          className={`tc-canvas-loading-overlay${canvasReady ? ' tc-canvas-loading-overlay--hidden' : ''}`}
          aria-hidden={canvasReady}
        >
          <div className="tc-canvas-loading-spinner" />
        </div>
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
        {/* ── Full-height sidebar ── */}
        {/* Sidebar always visible (PRD: 侧边栏始终可见) */}
        <aside
          className="tc-sidebar-b"
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            zIndex: 51,
            display: 'flex',
            flexDirection: 'column',
            background: isImmersiveModalOpen ? '#2D2D30' : undefined,
            userSelect: 'none',
            transition: 'background 200ms ease',
          }}
        >
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 56, flexShrink: 0 }}>
              {topBarLogoUrl ? (
                <img alt="Logo" src={topBarLogoUrl} style={{ width: 28, height: 28, objectFit: 'contain' }} />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 210 210" fill="none">
                  <path d="M162 0C188.51 0 210 21.4905 210 48V162C210 188.51 188.51 210 162 210H48C21.4903 210 0 188.51 0 162V48C0.000166991 21.4905 21.4904 0 48 0H162ZM161.586 69.124C161.556 69.1758 134.717 116.108 128.961 116.008C123.202 115.907 110.372 90.457 110.372 90.457C110.28 90.6044 84.343 131.966 79.5771 132.879C74.8031 133.799 74.6333 114.812 66.125 114.416C57.6174 114.013 36.9155 152.357 36.9111 152.365L46.6514 168.272L70.5635 132.722C70.5732 132.751 76.9933 152.315 89.2393 153.278C101.495 154.242 119.117 120.336 119.117 120.336C119.117 120.336 130.48 143.758 138.443 146.644C146.396 149.531 176.822 95.2796 176.911 95.1211L161.586 69.124ZM77.7305 36.3477C77.7303 52.0516 65.3453 64.9004 50.209 64.9004C65.3454 64.9004 77.7305 77.7491 77.7305 93.4531C77.7305 77.7491 90.1145 64.9004 105.251 64.9004C90.1146 64.9004 77.7306 52.0516 77.7305 36.3477Z" fill="white"/>
                </svg>
              )}
            </div>

            {/* Nav — flex:1, p:8px, gap:4px between items (sync with sidebar package) */}
            <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

                {/* Board */}
                {canEdit && (
                  <SidebarNavBtn
                    aria-label="Board"
                    disabled={isLocked}
                    onClick={() => widgetBridge.emit(createWidgetEvent('CANVAS_NAVIGATE', { target: 'board' }, { source: 'ui' }))}
                  >
                    <Frame style={{ width: 20, height: 20, flexShrink: 0, color: '#D4D4D4' }} />
                    <span style={NAV_LABEL_STYLE}>Board</span>
                  </SidebarNavBtn>
                )}

                {/* Separator */}
                <div style={{ margin: '8px 0', display: 'flex', justifyContent: 'center' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="1" viewBox="0 0 40 1" fill="none">
                    <path d="M0 0.25H40" stroke="url(#sb-nav-sep)" strokeWidth="0.5" />
                    <defs>
                      <linearGradient id="sb-nav-sep" x1="0" y1="0.75" x2="40" y2="0.75" gradientUnits="userSpaceOnUse">
                        <stop stopColor="white" stopOpacity="0" />
                        <stop offset="0.5" stopColor="white" />
                        <stop offset="1" stopColor="white" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Image / Video / Avatar / Audio */}
                {([
                  {
                    key: 'image' as const, title: 'Image', Icon: ImageIcon,
                    items: [
                      { id: 'text-to-image', label: 'Text to Image', Icon: Type, demoDisabled: false },
                      { id: 'image-edit', label: 'Image Edit', Icon: PenTool, demoDisabled: false },
                      { id: 'inpaint', label: 'Inpaint', Icon: Paintbrush, demoDisabled: false },
                      { id: 'image-character-swap', label: 'Image Character Swap', Icon: Repeat, demoDisabled: true },
                      { id: 'image-face-swap', label: 'Image Face Swap', Icon: Smile, demoDisabled: true },
                      { id: 'image-upscale', label: 'Image Upscale', Icon: Maximize2, demoDisabled: false },
                      { id: 'photo-angle-editor', label: 'Photo Angle Editor', Icon: Rotate3d, demoDisabled: true },
                      { id: 'product-photography', label: 'Product Photography', Icon: Camera, demoDisabled: false },
                    ],
                    actionType: 'ai-image' as const,
                  },
                  {
                    key: 'video' as const, title: 'Video', Icon: Video,
                    items: [
                      { id: 'image-to-video', label: 'Image to Video', Icon: ImagePlay, demoDisabled: false },
                      { id: 'text-to-video', label: 'Text to Video', Icon: Type, demoDisabled: false },
                      { id: 'omni-reference', label: 'Omni Reference', Icon: Wand2, demoDisabled: true },
                      { id: 'video-character-swap', label: 'Video Character Swap', Icon: Repeat, demoDisabled: true },
                      { id: 'video-upscale', label: 'Video Upscale', Icon: MoveDiagonal, demoDisabled: false },
                      { id: 'motion-control', label: 'Motion Control', Icon: PersonStanding, demoDisabled: true },
                    ],
                    actionType: 'ai-video' as const,
                  },
                  {
                    key: 'avatar' as const, title: 'Avatar', Icon: User,
                    items: [
                      { id: 'ai-avatar', label: 'AI Avatar', Icon: CircleUser, demoDisabled: false },
                      { id: 'product-avatar', label: 'Product Avatar', Icon: ShoppingBag, demoDisabled: false },
                      { id: 'design-avatar', label: 'Design My Avatar', Icon: UserPen, demoDisabled: false },
                      { id: 'video-lip-sync', label: 'Video Lip Sync', Icon: MicVocal, demoDisabled: false },
                    ],
                    actionType: 'ai-avatar' as const,
                  },
                  {
                    key: 'audio' as const, title: 'Audio', Icon: AudioLines,
                    items: [
                      { id: 'voiceover', label: 'Voiceover', Icon: Mic, demoDisabled: true },
                    ],
                    actionType: 'ai-audio' as const,
                  },
                ]).map((tool) => (
                  <ToolbarItemWithMenu
                    key={tool.key}
                    button={
                      <SidebarNavBtn
                        aria-label={tool.title}
                        disabled={!canEdit || isLocked}
                      >
                        <tool.Icon style={{ width: 18, height: 18, flexShrink: 0, color: '#D4D4D4' }} />
                        <span style={NAV_LABEL_STYLE}>{tool.title}</span>
                      </SidebarNavBtn>
                    }
                    menu={
                      <div>
                        {tool.items.map((item) => (
                          <ToolbarMenuItem key={item.id} Icon={item.Icon} label={item.label} onClick={item.demoDisabled ? () => {} : () => handlePlusAction(tool.actionType, item.id)} />
                        ))}
                      </div>
                    }
                    disabled={!canEdit || isLocked}
                  />
                ))}
              </div>
            </nav>

            {/* Bottom Section — p:8px, space-y:4px */}
            <div style={{
              position: 'relative', zIndex: 10, flexShrink: 0,
              padding: 8, display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              {/* Promotion */}
              <SidebarFooterBtn aria-label="Promotion">
                <img
                  src="https://d1735p3aqhycef.cloudfront.net/topview/dc4c14f2aba1b71f8de715e760306463b4e4c2f1.png"
                  alt="Promotion"
                  style={{ width: 20, height: 20, display: 'block' }}
                />
                <span style={FOOTER_LABEL_STYLE}>47% OFF</span>
              </SidebarFooterBtn>

              {/* Credits */}
              {userCredits != null && (
                <SidebarFooterBtn aria-label="Credits">
                  <img
                    src="https://d1735p3aqhycef.cloudfront.net/topview/ic_credit.svg"
                    alt="Credits"
                    style={{ width: 20, height: 20, display: 'block', pointerEvents: 'none' }}
                  />
                  <span style={{
                    ...FOOTER_LABEL_STYLE,
                    fontSize: String(userCredits.toLocaleString()).length > 6 ? 8 : 10,
                  }}>
                    {userCredits.toLocaleString()}
                  </span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1, marginTop: 2 }}>Pro</span>
                </SidebarFooterBtn>
              )}

              {/* Avatar */}
              <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }}>
                <button
                  type="button"
                  aria-label="User profile"
                  onClick={() => widgetBridge.emit(createWidgetEvent('CANVAS_NAVIGATE', { target: 'profile' }, { source: 'ui' }))}
                  style={{
                    width: 32, height: 32, padding: 0, border: 'none',
                    borderRadius: '50%', cursor: 'pointer', overflow: 'hidden',
                    background: 'linear-gradient(to bottom right, #facc15, #fb923c, #ef4444, #a855f7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  {userAvatarUrl
                    ? <img src={userAvatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(to bottom right, #facc15, #fb923c, #ef4444, #a855f7)', borderRadius: '50%' }} />
                  }
                </button>
              </div>
            </div>
        </aside>
        <div
          className={[
            inpaintFocus ? 'tc-inpaint-active' : '',
            effectiveToolMode === 'pan' ? 'tc-pan-mode' : '',
          ].filter(Boolean).join(' ') || undefined}
          style={{ width: '100%', height: '100%', marginLeft: 64 }}
          onMouseMove={inpaintFocus?.step === 'edit' ? (e) => {
            const el = document.getElementById('tc-brush-cursor');
            if (el) { el.style.left = `${e.clientX}px`; el.style.top = `${e.clientY}px`; el.style.opacity = '1'; }
          } : undefined}
          onMouseLeave={inpaintFocus?.step === 'edit' ? () => {
            const el = document.getElementById('tc-brush-cursor');
            if (el) el.style.opacity = '0';
          } : undefined}
        >
          <AiCreateProvider value={aiCreateContextValue}>
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
                onNodeClick={tryActivatePlaceholderPanel}
                onNodeDragStart={handleNodeDragStart}
                onNodeDrag={handleNodeDrag}
                onNodeDragEnd={handleNodeDragEnd}
                onNodeContextMenu={canEdit ? handleNodeContextMenu : undefined}
                onPaneContextMenu={handlePaneContextMenu}
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
                nodesDraggable={!isLocked && effectiveToolMode === 'edit' && !inpaintFocus && (!aiCreateMode || aiCreateMode.subActionId === 'text-to-image' || aiCreateMode.subActionId === 'image-edit')}
                elementsSelectable={!isLocked && !inpaintFocus && (!aiCreateMode || aiCreateMode.subActionId === 'text-to-image' || aiCreateMode.subActionId === 'image-edit')}
                selectionOnDrag={!isLocked && effectiveToolMode === 'edit' && !inpaintFocus && (!aiCreateMode || aiCreateMode.subActionId === 'text-to-image' || aiCreateMode.subActionId === 'image-edit')}
                panOnDrag={isLocked ? [] : effectiveToolMode === 'pan' ? [0, 1, 2] : [1]}
                onLockChange={setIsLocked}
                isLocked={isLocked}
                showControls={false}
                config={canvasConfig}
                width={width}
                height={height}
                minWidth={minWidth}
                minHeight={minHeight}
                onReactFlowInit={(instance) => {
                  reactFlowInstanceRef.current = instance;
                  setIsFlowReady(true);
                }}
              />
              </DependencyFocusProvider>
            </CanvasRoleProvider>
          </SelectModeProvider>
          </AiCreateProvider>
        </div>
        {/* Inpaint focus overlay + toolbar */}
        {inpaintFocus && (() => {
          // ── Edit step ─────────────────────────────────────────────────────
          const focusedNode = nodes.find((n) => n.id === inpaintFocus.nodeId);
          if (!focusedNode) return null;
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
            background: active ? 'rgba(88,87,253,0.3)' : 'transparent',
            color: active ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 100ms ease',
          });

          const brushDiameter = inpaintFocus.brushSize * viewport.zoom;

          return (
            <>
              {/* No full-screen overlay — canvas receives all events (zoom/pan work).
                  Brush cursor tracked via the canvas wrapper's onMouseMove below. */}
              {/* Custom brush cursor */}
              <div
                id="tc-brush-cursor"
                style={{
                  position: 'fixed',
                  width: brushDiameter,
                  height: brushDiameter,
                  borderRadius: '50%',
                  border: '2px solid #facc15',
                  pointerEvents: 'none',
                  zIndex: 9999,
                  transform: 'translate(-50%, -50%)',
                  opacity: 0,
                  transition: 'width 80ms ease, height 80ms ease',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
                }}
              />
              {/* Selection border is provided by the underlying ImageNode's outline */}

              {/* Mask toolbar (above image) — positioned via rAF for smooth zoom tracking */}
              <div
                ref={inpaintToolbarRef}
                onClick={(e) => e.stopPropagation()}
                onPointerDownCapture={(e) => e.stopPropagation()}
                onMouseDownCapture={(e) => e.stopPropagation()}
                onMouseMove={(e) => {
                  const el = document.getElementById('tc-brush-cursor');
                  if (el) { el.style.left = `${e.clientX}px`; el.style.top = `${e.clientY}px`; el.style.opacity = '1'; }
                }}
                style={{
                  position: 'fixed',
                  left: 0,
                  top: 0,
                  transform: 'translateX(-50%) translateY(-100%)',
                  willChange: 'left, top',
                  cursor: 'default',
                  zIndex: 42,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  padding: '4px 6px',
                  borderRadius: 14,
                  background: FLOW_UI.panelBg,
                  border: `1px solid ${FLOW_UI.panelBorder}`,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'auto',
                }}
              >
                <button type="button" title="Brush" onClick={() => setInpaintFocus((p) => p ? { ...p, maskTool: 'brush' } : p)} style={maskBtnStyle(inpaintFocus.maskTool === 'brush')}>
                  <Paintbrush size={15} />
                </button>
                <button type="button" title="Eraser" onClick={() => setInpaintFocus((p) => p ? { ...p, maskTool: 'eraser' } : p)} style={maskBtnStyle(inpaintFocus.maskTool === 'eraser')}>
                  <Eraser size={15} />
                </button>
                <div style={{ width: 1, height: 18, background: FLOW_UI.divider, margin: '0 3px' }} />
                <input type="range" min={5} max={80} value={inpaintFocus.brushSize} onChange={(e) => setInpaintFocus((p) => p ? { ...p, brushSize: Number(e.target.value) } : p)} style={{ width: 72, accentColor: '#5857FD' }} />
                <div style={{ width: 1, height: 18, background: FLOW_UI.divider, margin: '0 3px' }} />
                <button type="button" title="Undo" onClick={() => { widgetBridge.emit(createWidgetEvent('INPAINT_MASK_ACTION', { action: 'undo' }, { source: 'ui' })); }} style={maskBtnStyle(false)}>
                  <Undo2 size={15} />
                </button>
                <button type="button" title="Redo" onClick={() => { widgetBridge.emit(createWidgetEvent('INPAINT_MASK_ACTION', { action: 'redo' }, { source: 'ui' })); }} style={maskBtnStyle(false)}>
                  <Redo2 size={15} />
                </button>
                <div style={{ width: 1, height: 18, background: FLOW_UI.divider, margin: '0 3px' }} />
                <button type="button" title="Done" onClick={() => setInpaintFocus(null)} style={{ ...maskBtnStyle(false), color: 'rgba(255,255,255,0.7)' }}>
                  <Check size={15} />
                </button>
              </div>

              {/* === Inpaint panel (bottom center, above toolbar) === */}
              <div
                onClick={(e) => e.stopPropagation()}
                onMouseMove={(e) => {
                  const el = document.getElementById('tc-brush-cursor');
                  if (el) { el.style.left = `${e.clientX}px`; el.style.top = `${e.clientY}px`; el.style.opacity = '1'; }
                }}
                style={{
                  position: 'absolute',
                  bottom: 64,
                  left: 'calc(50% + 32px)',
                  transform: 'translateX(-50%)',
                  width: Math.min(440, typeof window !== 'undefined' ? window.innerWidth - 160 : 440),
                  zIndex: 42,
                  borderRadius: 14,
                  background: FLOW_UI.panelBg,
                  border: `1px solid ${FLOW_UI.panelBorder}`,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  userSelect: 'none',
                  overflow: 'hidden',
                  cursor: 'default',
                }}
              >
                {/* Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Inpaint</span>
                  <button
                    type="button"
                    onClick={() => setInpaintFocus(null)}
                    style={{
                      width: 24, height: 24, borderRadius: 6, border: 'none',
                      background: 'transparent', color: 'rgba(255,255,255,0.4)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Content area */}
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Row: Reference + Textarea */}
                  <div style={{ display: 'flex', flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                    {/* Left: Reference Image Upload Area */}
                    <div style={{ width: 64, height: 64, flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => {
                          widgetBridge.emit(createWidgetEvent('INPAINT_UPLOAD_REFERENCE', { nodeId: inpaintFocus.nodeId, slotIndex: 0 }, { source: 'ui' }));
                        }}
                        style={{
                          width: '100%', height: '100%',
                          borderRadius: 8,
                          border: 'none', 
                          background: 'rgba(255,255,255,0.04)',
                          color: 'rgba(255,255,255,0.3)', 
                          cursor: 'pointer',
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center', 
                          justifyContent: 'center',
                          gap: 4,
                          fontSize: 10, fontWeight: 500,
                          transition: 'background 120ms ease',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                      >
                        {inpaintFocus.uploadedImageUrl ? (
                          <img 
                            src={inpaintFocus.uploadedImageUrl} 
                            alt="Reference" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        ) : (
                          <>
                            <Plus size={18} style={{ opacity: 0.4 }} />
                            <span style={{ color: 'rgba(255,255,255,0.2)' }}>Reference</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Right: Prompt Textarea */}
                    <textarea
                      placeholder="Describe what you want to change, or enter a prompt for the masked area"
                      value={inpaintFocus.prompt}
                      onChange={(e) => setInpaintFocus((prev) => prev ? { ...prev, prompt: e.target.value } : prev)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && inpaintFocus.prompt.trim()) {
                          e.preventDefault();
                          handleInpaintSubmit();
                        }
                      }}
                      style={{
                        flex: 1,
                        height: 64,
                        padding: '4px 0', 
                        border: 'none', 
                        background: 'transparent', 
                        color: '#fff', 
                        fontSize: 14, 
                        lineHeight: '20px', 
                        resize: 'none', 
                        fontFamily: 'inherit',
                        outline: 'none',
                        boxShadow: 'none',
                      }}
                      className="tc-inpaint-textarea"
                    />
                  </div>

                  {/* Generate Button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={inpaintFocus.prompt.trim() ? handleInpaintSubmit : undefined}
                      style={{
                        padding: '0 20px', height: 32, borderRadius: 8, border: 'none',
                        background: inpaintFocus.prompt.trim() ? '#fff' : 'rgba(255,255,255,0.08)',
                        color: inpaintFocus.prompt.trim() ? '#000' : 'rgba(255,255,255,0.3)',
                        fontSize: 12, fontWeight: 600, cursor: inpaintFocus.prompt.trim() ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', gap: 6,
                        transition: 'all 120ms ease',
                        boxShadow: inpaintFocus.prompt.trim() ? '0 2px 8px rgba(255,255,255,0.15)' : 'none',
                      }}
                    >
                      <Crown size={14} color={inpaintFocus.prompt.trim() ? '#000' : 'currentColor'} />
                      <span>Generate</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          );
        })()}
        {/* AI Create mode — route to specific panel or fallback generic */}
        {aiCreateMode && (() => {
          const placeholderNode = nodes.find((n) => n.id === aiCreateMode.nodeId);
          if (!placeholderNode) return null;
          const aiCanvasOffsetX = 64;
          const screenX = placeholderNode.position.x * viewport.zoom + viewport.x + aiCanvasOffsetX;
          const screenY = placeholderNode.position.y * viewport.zoom + viewport.y;
          const screenW = placeholderNode.size.width * viewport.zoom;
          const screenH = placeholderNode.size.height * viewport.zoom;

          const useNewPanel = aiCreateMode.subActionId === 'text-to-image'
            || aiCreateMode.subActionId === 'image-edit'
            || aiCreateMode.type === 'ai-video';

          // text-to-image / image-edit / ai-video panels are now rendered inside
          // ImageNode / VideoNode via NodeToolbar for proper zoom/pan tracking
          if (useNewPanel) return null;

          /* ── Fallback: generic prompt-only panel for other tools ── */
          const isImage = aiCreateMode.type === 'ai-image';
          const isAvatar = aiCreateMode.type === 'ai-avatar';
          const isAudio = aiCreateMode.type === 'ai-audio';
          return (
            <>
              <div
                onClick={() => { setAiCreateMode(null); }}
                style={{ position: 'absolute', inset: 0, zIndex: 39 }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: screenX - 2, top: screenY - 2,
                  width: screenW + 4, height: screenH + 4,
                  zIndex: 41,
                  border: '2px solid #5857FD', pointerEvents: 'none',
                }}
              />
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  left: screenX + screenW / 2 - 260,
                  top: screenY + screenH + 12,
                  width: 520, zIndex: 42,
                  padding: '12px 14px', borderRadius: 16,
                  background: FLOW_UI.panelBg,
                  border: `1px solid ${FLOW_UI.panelBorder}`,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  display: 'flex', flexDirection: 'column', gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: isImage ? 'rgba(88,87,253,0.15)' : isAvatar ? 'rgba(20,184,166,0.15)' : isAudio ? 'rgba(245,158,11,0.15)' : 'rgba(236,72,153,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}
                  >
                    {isImage ? <ImagePlus size={14} color="#818cf8" />
                      : isAvatar ? <ScanFace size={14} color="#2dd4bf" />
                      : isAudio ? <Mic size={14} color="#fbbf24" />
                      : <Video size={14} color="#f472b6" />}
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                    {aiCreateMode.subActionId.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </span>
                </div>
                <textarea
                  placeholder={
                    isImage ? 'Describe anything you want to generate'
                      : isAvatar ? 'Enter script for your avatar...'
                      : isAudio ? 'Enter text to generate audio...'
                      : 'Describe the video you want to create...'
                  }
                  value={aiCreateMode.prompt}
                  onChange={(e) => setAiCreateMode((prev) => prev ? { ...prev, prompt: e.target.value } : prev)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && aiCreateMode.prompt.trim()) {
                      e.preventDefault();
                      widgetBridge.emit(createWidgetEvent('CANVAS_CREATE_ACTION', { actionId: aiCreateMode.subActionId, nodeId: aiCreateMode.nodeId, prompt: aiCreateMode.prompt }, { source: 'ui' }));
                      setAiCreateMode(null);
                    }
                  }}
                  autoFocus
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)',
                    color: '#fff', fontSize: 13, lineHeight: '1.5', resize: 'none', fontFamily: 'inherit',
                  }}
                  className="tc-textarea-input"
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
                      widgetBridge.emit(createWidgetEvent('CANVAS_CREATE_ACTION', { actionId: aiCreateMode.subActionId, nodeId: aiCreateMode.nodeId, prompt: aiCreateMode.prompt }, { source: 'ui' }));
                      setAiCreateMode(null);
                    }}
                    style={{
                      width: 32, height: 32, borderRadius: '50%', border: 'none',
                      background: aiCreateMode.prompt.trim()
                        ? isImage ? 'linear-gradient(135deg, #5857FD, #8b5cf6)' : isAvatar ? 'linear-gradient(135deg, #14b8a6, #2dd4bf)' : isAudio ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : 'linear-gradient(135deg, #ec4899, #f472b6)'
                        : 'rgba(255,255,255,0.06)',
                      color: aiCreateMode.prompt.trim() ? '#fff' : 'rgba(255,255,255,0.25)',
                      cursor: aiCreateMode.prompt.trim() ? 'pointer' : 'default',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
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
        {/* Product Photography immersive modal */}
        <ProductPhotographyModal
          open={ppModalState?.open ?? false}
          nodeId={ppModalState?.nodeId ?? ''}
          initialState={ppModalState?.initialProductImageUrl ? { productImageUrl: ppModalState.initialProductImageUrl } : undefined}
          credits={userCredits ?? 25}
          onSubmit={(state) => {
            widgetBridge.emit(
              createWidgetEvent(
                'CANVAS_CREATE_ACTION',
                {
                  actionId: 'product-photography',
                  nodeId: ppModalState?.nodeId,
                  productImageUrl: state.productImageUrl,
                  productMaskDataUrl: state.productMaskDataUrl,
                  backgroundPrompt: state.backgroundPrompt,
                  backgroundImageUrl: state.backgroundImageUrl || undefined,
                  selectedTemplateId: state.selectedTemplateId,
                  ratio: state.ratio,
                },
                { source: 'ui' }
              )
            );
            
            // Mock generation: show skeleton → focus viewport → reveal image
            if (ppModalState?.nodeId) {
              const targetId = ppModalState.nodeId;
              const mockUrl = "/demo-product-photo-result.png";

              // Mark as generating so tryActivatePlaceholderPanel won't re-open the modal
              ppGeneratingRef.current.add(targetId);

              // 1. Enter loading skeleton and immediately sync nodesRef
              setNodes((prevNodes) => {
                const next = prevNodes.map(n => {
                  if (n.id !== targetId) return n;
                  return {
                    ...n,
                    raw: { status: 'init' },
                    url: '',
                  };
                });
                nodesRef.current = next;
                return next;
              });
              collab.updateNodes([{ nodeId: targetId, updates: { raw: { status: 'init' }, url: '' } }], true);

              // 2. Close modal, deselect the node so the useEffect won't re-trigger
              ppClosedAtRef.current = Date.now();
              setPpModalState(null);
              setNodes((prev) => {
                const next = prev.map(n =>
                  n.id === targetId ? { ...n, selected: false } : n
                );
                nodesRef.current = next;
                return next;
              });
              setTimeout(() => {
                const instance = reactFlowInstanceRef.current;
                if (instance) {
                  instance.fitView({
                    nodes: [{ id: targetId }] as any,
                    padding: 0.4,
                    maxZoom: 1.2,
                    duration: 400,
                  });
                }
              }, 100);

              // 3. After delay, reveal the result (but do NOT select it,
              //    to avoid re-triggering tryActivatePlaceholderPanel)
              setTimeout(() => {
                setNodes((prevNodes) => {
                  const next = prevNodes.map(n => {
                    if (n.id !== targetId) return n;
                    return {
                      ...n,
                      raw: { status: 'success' },
                      url: mockUrl,
                      thumbnailUrl: mockUrl,
                    };
                  });
                  nodesRef.current = next;
                  return next;
                });
                collab.updateNodes([{
                  nodeId: targetId,
                  updates: {
                    raw: { status: 'success' },
                    url: mockUrl,
                    thumbnailUrl: mockUrl,
                  },
                }], true);
                ppGeneratingRef.current.delete(targetId);
              }, 1500);
            } else {
              setPpModalState(null);
            }
          }}
          onClose={() => {
            const closingNodeId = ppModalState?.nodeId;
            ppClosedAtRef.current = Date.now();
            setPpModalState(null);
            if (closingNodeId) {
              setNodes((prev) => {
                const next = prev.map(n =>
                  n.id === closingNodeId ? { ...n, selected: false } : n
                );
                nodesRef.current = next;
                return next;
              });
            }
          }}
          onUploadProduct={() => {
            widgetBridge.emit(
              createWidgetEvent('CANVAS_CREATE_ACTION', { actionId: 'upload-product', nodeId: ppModalState?.nodeId }, { source: 'ui' })
            );
          }}
          onSelectFromBoard={() => {
            widgetBridge.emit(
              createWidgetEvent('CANVAS_NAVIGATE', { target: 'board-select', context: 'product-photography', nodeId: ppModalState?.nodeId }, { source: 'ui' })
            );
          }}
        />
        {/* Inpaint tutorial modal */}
        <InpaintTutorialModal
          open={inpaintTutorialOpen.open}
          initialImageUrl={inpaintTutorialOpen.initialImageUrl}
          onClose={() => setInpaintTutorialOpen({ open: false })}
          onSelectFromBoard={() => {
            setInpaintTutorialOpen({ open: false });
            widgetBridge.emit(
              createWidgetEvent('CANVAS_NAVIGATE', { target: 'board-select', context: 'inpaint' }, { source: 'ui' })
            );
          }}
          onSubmit={(data) => {
            setInpaintTutorialOpen({ open: false });
            widgetBridge.emit(
              createWidgetEvent(
                'CANVAS_CREATE_ACTION',
                {
                  actionId: 'inpaint',
                  imageUrl: data.imageUrl,
                  prompt: data.prompt,
                  maskTool: data.maskTool,
                  brushSize: data.brushSize,
                },
                { source: 'ui' }
              )
            );
          }}
        />
        {/* Image Upscale immersive modal */}
        <ImageUpscaleModal
          open={imageUpscaleOpen}
          credits={userCredits ?? 0.8}
          onClose={() => setImageUpscaleOpen(false)}
          onSelectFromBoard={() => {
            setImageUpscaleOpen(false);
            widgetBridge.emit(
              createWidgetEvent('CANVAS_NAVIGATE', { target: 'board-select', context: 'image-upscale' }, { source: 'ui' })
            );
          }}
          onSubmit={(data) => {
            setImageUpscaleOpen(false);
            widgetBridge.emit(
              createWidgetEvent(
                'CANVAS_CREATE_ACTION',
                {
                  actionId: 'image-upscale',
                  imageUrl: data.imageUrl,
                  targetResolution: data.targetResolution,
                  withWatermark: data.withWatermark,
                },
                { source: 'ui' }
              )
            );
          }}
        />
        {/* Video Upscale immersive modal */}
        <VideoUpscaleModal
          open={videoUpscaleOpen}
          credits={userCredits ?? 0}
          onClose={() => setVideoUpscaleOpen(false)}
          onSelectFromBoard={() => {
            setVideoUpscaleOpen(false);
            widgetBridge.emit(
              createWidgetEvent('CANVAS_NAVIGATE', { target: 'board-select', context: 'video-upscale' }, { source: 'ui' })
            );
          }}
          onSubmit={(data) => {
            setVideoUpscaleOpen(false);
            widgetBridge.emit(
              createWidgetEvent(
                'CANVAS_CREATE_ACTION',
                {
                  actionId: 'video-upscale',
                  videoUrl: data.videoUrl,
                  targetResolution: data.targetResolution,
                },
                { source: 'ui' }
              )
            );
          }}
        />
        {/* Phase 3 Avatar modals */}
        <AIAvatarModal
          open={aiAvatarModal.open}
          credits={userCredits ?? 0}
          initialAvatarUrl={aiAvatarModal.initialAvatarUrl}
          modelPreviewVideoUrl={modelPreviewVideoUrl}
          modelPreviewPosterUrl={modelPreviewPosterUrl}
          onClose={() => setAiAvatarModal({ open: false })}
          onSubmit={(data) => {
            setAiAvatarModal({ open: false });
            widgetBridge.emit(
              createWidgetEvent('CANVAS_CREATE_ACTION', { ...data }, { source: 'ui' })
            );
          }}
          onSelectFromBoard={() => {
            setAiAvatarModal({ open: false });
            widgetBridge.emit(
              createWidgetEvent('CANVAS_NAVIGATE', { target: 'board-select', context: 'ai-avatar' }, { source: 'ui' })
            );
          }}
        />
        <VideoLipSyncModal
          open={lipSyncModal.open}
          credits={userCredits ?? 0}
          initialVideoUrl={lipSyncModal.initialVideoUrl}
          onClose={() => setLipSyncModal({ open: false })}
          onSubmit={(data) => {
            setLipSyncModal({ open: false });
            widgetBridge.emit(
              createWidgetEvent('CANVAS_CREATE_ACTION', { ...data }, { source: 'ui' })
            );
          }}
          onSelectFromBoard={() => {
            setLipSyncModal({ open: false });
            widgetBridge.emit(
              createWidgetEvent('CANVAS_NAVIGATE', { target: 'board-select', context: 'video-lip-sync' }, { source: 'ui' })
            );
          }}
        />
        <DesignMyAvatarModal
          open={designAvatarOpen}
          credits={userCredits ?? 2}
          onClose={() => setDesignAvatarOpen(false)}
          onSubmit={(data) => {
            setDesignAvatarOpen(false);
            widgetBridge.emit(
              createWidgetEvent('CANVAS_CREATE_ACTION', { ...data }, { source: 'ui' })
            );
          }}
        />
        <ProductAvatarModal
          open={productAvatarModal.open}
          credits={userCredits ?? 0}
          initialProductImageUrl={productAvatarModal.initialProductImageUrl}
          onClose={() => setProductAvatarModal({ open: false })}
          onSubmit={(data) => {
            setProductAvatarModal({ open: false });
            widgetBridge.emit(
              createWidgetEvent('CANVAS_CREATE_ACTION', { ...data }, { source: 'ui' })
            );
          }}
          onSelectFromBoard={(context) => {
            setProductAvatarModal({ open: false });
            widgetBridge.emit(
              createWidgetEvent('CANVAS_NAVIGATE', { target: 'board-select', context: `product-avatar-${context}` }, { source: 'ui' })
            );
          }}
        />
        {contextMenu && (
          <div
            className="widget-context-menu"
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              zIndex: 200,
              background: '#1c1e22',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.25)',
              padding: 6,
              minWidth: 220,
              fontFamily: 'Inter, -apple-system, sans-serif',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <style>
              {`
                .widget-context-menu .ctx-item {
                  width: 100%;
                  text-align: left;
                  padding: 8px 12px;
                  border: none;
                  background: transparent;
                  cursor: pointer;
                  font-size: 13px;
                  font-weight: 400;
                  border-radius: 6px;
                  transition: background-color 100ms ease;
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  gap: 24px;
                  color: rgba(255,255,255,0.9);
                }
                .widget-context-menu .ctx-item:disabled {
                  cursor: not-allowed;
                  color: rgba(255,255,255,0.3);
                }
                .widget-context-menu .ctx-item:not(:disabled):hover {
                  background: rgba(255,255,255,0.08);
                }
                .widget-context-menu .ctx-item.danger {
                  color: #ef4444;
                }
                .widget-context-menu .ctx-item.danger:not(:disabled):hover {
                  background: rgba(239, 68, 68, 0.12);
                }
                .widget-context-menu .ctx-shortcut {
                  font-size: 12px;
                  color: rgba(255,255,255,0.35);
                  white-space: nowrap;
                  font-weight: 400;
                }
                .widget-context-menu .ctx-divider {
                  height: 1px;
                  background: rgba(255,255,255,0.08);
                  margin: 4px 0;
                }
              `}
            </style>
            {contextMenu.type === 'canvas' && (
              <>
                <button
                  type="button"
                  className="ctx-item"
                  disabled
                  onClick={() => { setContextMenu(null); }}
                >
                  <span>Paste</span>
                  <span className="ctx-shortcut">⌘V</span>
                </button>
                <div className="ctx-divider" />
                <button
                  type="button"
                  className="ctx-item"
                  onClick={() => {
                    reactFlowInstanceRef.current?.zoomIn({ duration: 200 });
                    setContextMenu(null);
                  }}
                >
                  <span>Zoom In</span>
                  <span className="ctx-shortcut">⌘+</span>
                </button>
                <button
                  type="button"
                  className="ctx-item"
                  onClick={() => {
                    reactFlowInstanceRef.current?.zoomOut({ duration: 200 });
                    setContextMenu(null);
                  }}
                >
                  <span>Zoom Out</span>
                  <span className="ctx-shortcut">⌘−</span>
                </button>
                <button
                  type="button"
                  className="ctx-item"
                  onClick={() => {
                    reactFlowInstanceRef.current?.fitView({ padding: 0.15, duration: 300 });
                    setContextMenu(null);
                  }}
                >
                  <span>Zoom to Fit</span>
                  <span className="ctx-shortcut">⌘0</span>
                </button>
                <button
                  type="button"
                  className="ctx-item"
                  onClick={() => {
                    reactFlowInstanceRef.current?.zoomTo(1, { duration: 200 });
                    setContextMenu(null);
                  }}
                >
                  <span>Zoom to 100%</span>
                  <span className="ctx-shortcut">⌘1</span>
                </button>
              </>
            )}
            {contextMenu.type === 'node' && contextMenu.nodeId && (() => {
              const nId = contextMenu.nodeId;
              const targetNode = nodesRef.current.find((n) => n.id === nId);
              const isHidden = (targetNode as any)?.hidden === true;
              const isNodeLocked = (targetNode as any)?.draggable === false;
              const layerInfo = getLayerInfo(nId);
              return (
                <>
                  {/* Clipboard */}
                  <button type="button" className="ctx-item" onClick={() => {
                    widgetBridge.emit(createWidgetEvent('NODE_QUICK_ACTION', { nodeId: nId, actionId: 'copy', actionLabel: 'Copy' }, { source: 'ui' }));
                    setContextMenu(null);
                  }}>
                    <span>Copy</span><span className="ctx-shortcut">⌘C</span>
                  </button>
                  <button type="button" className="ctx-item" onClick={() => {
                    widgetBridge.emit(createWidgetEvent('NODE_QUICK_ACTION', { nodeId: nId, actionId: 'cut', actionLabel: 'Cut' }, { source: 'ui' }));
                    setContextMenu(null);
                  }}>
                    <span>Cut</span><span className="ctx-shortcut">⌘X</span>
                  </button>
                  <button type="button" className="ctx-item" disabled>
                    <span>Paste</span><span className="ctx-shortcut">⌘V</span>
                  </button>
                  <button type="button" className="ctx-item" onClick={handleCloneNode}>
                    <span>Duplicate</span><span className="ctx-shortcut">⌘D</span>
                  </button>

                  <div className="ctx-divider" />

                  {/* Layer ordering */}
                  <button type="button" className="ctx-item" disabled={layerInfo.isTop} onClick={() => { applyLayerAction(nId, 'forward'); }}>
                    <span>Move up</span><span className="ctx-shortcut">⌘]</span>
                  </button>
                  <button type="button" className="ctx-item" disabled={layerInfo.isBottom} onClick={() => { applyLayerAction(nId, 'backward'); }}>
                    <span>Move down</span><span className="ctx-shortcut">⌘[</span>
                  </button>
                  <button type="button" className="ctx-item" disabled={layerInfo.isTop} onClick={() => { applyLayerAction(nId, 'front'); }}>
                    <span>Bring to front</span><span className="ctx-shortcut">⌘⇧]</span>
                  </button>
                  <button type="button" className="ctx-item" disabled={layerInfo.isBottom} onClick={() => { applyLayerAction(nId, 'back'); }}>
                    <span>Send to back</span><span className="ctx-shortcut">⌘⇧[</span>
                  </button>

                  <div className="ctx-divider" />

                  {/* Visibility & Lock */}
                  <button type="button" className="ctx-item" onClick={() => {
                    widgetBridge.emit(createWidgetEvent('NODE_QUICK_ACTION', { nodeId: nId, actionId: isHidden ? 'show' : 'hide', actionLabel: isHidden ? 'Show' : 'Hide' }, { source: 'ui' }));
                    setContextMenu(null);
                  }}>
                    <span>{isHidden ? 'Show' : 'Hide'}</span><span className="ctx-shortcut">⌘⇧H</span>
                  </button>
                  <button type="button" className="ctx-item" onClick={() => {
                    widgetBridge.emit(createWidgetEvent('NODE_QUICK_ACTION', { nodeId: nId, actionId: isNodeLocked ? 'unlock' : 'lock', actionLabel: isNodeLocked ? 'Unlock' : 'Lock' }, { source: 'ui' }));
                    setContextMenu(null);
                  }}>
                    <span>{isNodeLocked ? 'Unlock' : 'Lock'}</span><span className="ctx-shortcut">⌘⇧L</span>
                  </button>

                  <div className="ctx-divider" />

                  {/* Export submenu */}
                  <div style={{ position: 'relative' }}>
                    <button type="button" className="ctx-item" onClick={() => {
                      setContextMenu((prev) => prev ? { ...prev, exportSubmenuOpen: !prev.exportSubmenuOpen } : prev);
                    }}>
                      <span>Export</span><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>›</span>
                    </button>
                    {contextMenu.exportSubmenuOpen && (
                      <div style={{
                        position: 'absolute', left: '100%', top: 0, marginLeft: 4,
                        background: '#1c1e22', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.25)',
                        padding: 6, minWidth: 120, zIndex: 10,
                      }}>
                        {(['PNG', 'JPG', 'SVG'] as const).map((format) => (
                          <button key={format} type="button" className="ctx-item" onClick={() => {
                            widgetBridge.emit(createWidgetEvent('NODE_QUICK_ACTION', { nodeId: nId, actionId: 'export', actionLabel: `Export ${format}`, format: format.toLowerCase() }, { source: 'ui' }));
                            setContextMenu(null);
                          }}>{format}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
            {contextMenu.type === 'multi-node' && contextMenu.nodeIds && (() => {
              const count = contextMenu.nodeIds.length;
              return (
                <>
                  <div style={{ padding: '6px 12px', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                    {count} items selected
                  </div>
                  <div className="ctx-divider" />
                  <button type="button" className="ctx-item" onClick={() => { handleBatchCopy(); setContextMenu(null); }}>
                    <span>Copy</span><span className="ctx-shortcut">⌘C</span>
                  </button>
                  <button type="button" className="ctx-item" onClick={() => { handleBatchGroup(); setContextMenu(null); }} disabled={count < 2}>
                    <span>Group</span>
                  </button>

                  <div className="ctx-divider" />

                  <button type="button" className="ctx-item" onClick={() => { handleBatchBringToFront(); }}>
                    <span>Bring to Front</span><span className="ctx-shortcut">⌘⇧]</span>
                  </button>
                  <button type="button" className="ctx-item" onClick={() => { handleBatchSendToBack(); }}>
                    <span>Send to Back</span><span className="ctx-shortcut">⌘⇧[</span>
                  </button>

                  <div className="ctx-divider" />

                  <button type="button" className="ctx-item" onClick={() => { handleBatchLock(); setContextMenu(null); }}>
                    <span>Lock All</span><span className="ctx-shortcut">⌘⇧L</span>
                  </button>
                  <button type="button" className="ctx-item" onClick={() => { handleBatchHide(); setContextMenu(null); }}>
                    <span>Hide All</span><span className="ctx-shortcut">⌘⇧H</span>
                  </button>

                  <div className="ctx-divider" />

                  <button type="button" className="ctx-item" onClick={() => { handleBatchDownload(); setContextMenu(null); }}>
                    <span>Download All</span>
                  </button>
                </>
              );
            })()}
          </div>
        )}
        {/* Bottom-left spacer removed — shortcuts and avatar icons no longer shown here */}
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
          {/* In Scheme B, panel is toggled from BottomToolbar — hide standalone button */}
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
                    const isDraft = Boolean((node as any).toolId && !node.url);
                    const rawStatus = String(raw?.status ?? '').toLowerCase();
                    const typeName = `${(node.type ?? 'image').charAt(0).toUpperCase()}${(node.type ?? 'image').slice(1)}`;
                    const primaryLabel = raw?.title || typeName;
                    const label = primaryLabel;
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
                            ? 'rgba(88,87,253,0.15)'
                            : node.selected
                              ? 'rgba(88,87,253,0.25)'
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
                          borderTop: isDragOver ? '2px solid #5857FD' : '2px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (!node.selected && !isDragOver) {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isDragOver
                            ? 'rgba(88,87,253,0.15)'
                            : node.selected
                              ? 'rgba(88,87,253,0.25)'
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
                          {isDraft ? (
                            <span style={{ fontSize: 14, opacity: 0.5, color: '#fff' }}>✏️</span>
                          ) : thumbUrl && !isText && !isAudio ? (
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
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          {isDraft && <span style={{ fontSize: 11, flexShrink: 0 }}>✏️</span>}
                          {label}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>
        {/* Multi-select corner handles — 4 real DOM elements tracking selection rect */}
        <MultiSelectCornerHandles
          visible={!!(canEdit && !inpaintFocus && multiSelectInfo && multiSelectInfo.nodes.length >= 2)}
        />
        {/* Multi-select toolbar — floats above selection bounding box */}
        <MultiSelectToolbar
          info={canEdit && !inpaintFocus ? multiSelectInfo : null}
          viewport={viewport}
          onBatchGroup={handleBatchGroup}
          onBatchCopy={handleBatchCopy}
          onBatchDownload={handleBatchDownload}
          onBatchLock={handleBatchLock}
          onBatchUnlock={handleBatchUnlock}
          onBatchHide={handleBatchHide}
          onBatchShow={handleBatchShow}
          onBatchBringToFront={handleBatchBringToFront}
          onBatchSendToBack={handleBatchSendToBack}
          onBatchExport={handleBatchExport}
          onAlign={handleAlign}
          onDistribute={handleDistribute}
          onAutoArrange={handleAutoArrange}
        />
        {/* Bottom center toolbar + Template picker — always visible (PRD: 底部工具栏始终可见) */}
        <BottomToolbar
          visible={toolbarVisible}
          toolMode={effectiveToolMode}
          onToolModeChange={setToolMode}
          viewport={viewport}
          reactFlowInstance={reactFlowInstanceRef.current}
          layersPanelOpen={layersPanelOpen}
          onLayersToggle={() => setLayersPanelOpen((prev) => !prev)}
          canEdit={canEdit}
          isLocked={isLocked}
          sidebarOffset={64}
          onAddAsset={() => handlePlusAction('upload')}
        />
      </div>
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </main>
  );
}
