import * as react_jsx_runtime from 'react/jsx-runtime';
import React from 'react';
import { Edge, Node, ReactFlowInstance, NodeProps } from '@xyflow/react';
import { CanvasNodeData as CanvasNodeData$1, CanvasConfig, BoardTaskItem, LayoutConfig } from '@tc/infinite-core';
export * from '@tc/infinite-core';

interface InfiniteCanvasProps {
    nodes: CanvasNodeData$1[];
    edges?: Edge[];
    config?: CanvasConfig;
    onNodesChange?: (nodes: CanvasNodeData$1[]) => void;
    onEdgesChange?: (edges: Edge[]) => void;
    onNodeDragStart?: (nodeId: string, position: {
        x: number;
        y: number;
    }) => void;
    onNodeDrag?: (nodeId: string, position: {
        x: number;
        y: number;
    }, selectedNodeIds?: string[]) => void;
    onNodeDragEnd?: (nodeId: string, position: {
        x: number;
        y: number;
    }) => void;
    onNodeContextMenu?: (event: React.MouseEvent, node: Node<CanvasNodeData$1>) => void;
    onPaneContextMenu?: (event: React.MouseEvent) => void;
    onPaneMouseMove?: (position: {
        x: number;
        y: number;
    }, event: React.MouseEvent) => void;
    onViewportChange?: (viewport: {
        x: number;
        y: number;
        zoom: number;
    }) => void;
    onPaneClick?: (position: {
        x: number;
        y: number;
    }, event: React.MouseEvent) => void;
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
    onReactFlowInit?: (instance: ReactFlowInstance<Node<CanvasNodeData$1>, Edge>) => void;
}
declare function InfiniteCanvas({ nodes: initialNodes, edges: initialEdges, config, onNodesChange: onNodesChangeCallback, onEdgesChange: onEdgesChangeCallback, onNodeDragStart, onNodeDrag, onNodeDragEnd, onNodeContextMenu, onPaneContextMenu, onPaneMouseMove, onViewportChange, onPaneClick, onNodeClick: onNodeClickCallback, paneCursor, nodesDraggable, elementsSelectable, selectionOnDrag, panOnDrag, onLockChange, isLocked, showControls, className, style, backgroundColor, width, height, minWidth, minHeight, onReactFlowInit, }: InfiniteCanvasProps): react_jsx_runtime.JSX.Element;

interface CollaborativeCanvasProps {
    canvasId?: string | null;
    userId?: string;
    userName?: string;
    seedNodes?: CanvasNodeData$1[];
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
declare function CollaborativeCanvas({ canvasId: canvasIdProp, userId: userIdProp, userName: userNameProp, seedNodes: seedNodesProp, rawData, layoutConfig, config, initialBackgroundColor, enableCollaboration, dependencyEdgesVisible, className, style, width, height, minWidth, minHeight, invisible, role, topBarLogoUrl, userAvatarUrl, userCredits, modelPreviewVideoUrl, modelPreviewPosterUrl, }: CollaborativeCanvasProps): react_jsx_runtime.JSX.Element;

type WidgetEventSource = 'ui' | 'agent' | 'system' | 'inpaint-toolbar';
interface WidgetEvent<T = any> {
    type: string;
    payload: T;
    requestId?: string;
    source?: WidgetEventSource;
    timestamp: number;
}
type WidgetEventHandler<T = any> = (event: WidgetEvent<T>) => void;
type WidgetCommandHandler<T = any> = (payload: T) => void;
declare class WidgetBridge {
    private handlers;
    private commandHandlers;
    emit<T>(event: WidgetEvent<T>): void;
    on<T>(type: string, handler: WidgetEventHandler<T>): () => void;
    command<T>(type: string, payload?: T): void;
    onCommand<T>(type: string, handler: WidgetCommandHandler<T>): () => void;
}
declare const widgetBridge: WidgetBridge;
declare const createWidgetEvent: <T>(type: string, payload: T, options?: {
    source?: WidgetEventSource;
    requestId?: string;
    timestamp?: number;
}) => WidgetEvent<T>;

/**
 * 协同编辑 Hook
 * 提供 WebSocket 连接和消息处理
 */
declare enum MessageType {
    JOIN = "join",
    LEAVE = "leave",
    SYNC_STATE = "sync_state",
    CREATE_NODE = "create_node",
    UPDATE_NODE = "update_node",
    UPDATE_NODES = "update_nodes",
    DELETE_NODE = "delete_node",
    DRAG_START = "drag_start",
    DRAG_MOVE = "drag_move",
    DRAG_END = "drag_end",
    UPDATE_PRESENCE = "update_presence",
    USER_ACTIVITY = "user_activity",
    NODE_CREATED = "node_created",
    NODE_UPDATED = "node_updated",
    NODES_UPDATED = "nodes_updated",
    NODE_DELETED = "node_deleted",
    NODE_LOCKED = "node_locked",
    NODE_UNLOCKED = "node_unlocked",
    PRESENCE_UPDATE = "presence_update",
    ERROR = "error"
}
interface Position {
    x: number;
    y: number;
}
interface UserPresence {
    userId: string;
    userName?: string;
    cursor?: Position;
    cursorSpace?: 'flow' | 'screen';
    viewport?: {
        x: number;
        y: number;
        zoom: number;
    };
    selectedNodes?: string[];
    draggingNode?: string;
    color?: string;
    lastUpdate: number;
}
interface CanvasNodeData {
    id: string;
    type: string;
    position: Position;
    size: {
        width: number;
        height: number;
    };
    [key: string]: any;
}
interface SyncStateMessage {
    type: MessageType.SYNC_STATE;
    seq: number;
    nodes: CanvasNodeData[];
    presences: Record<string, UserPresence>;
    lockedNodes: Record<string, string>;
}
interface NodeUpdatedMessage {
    type: MessageType.NODE_UPDATED;
    seq: number;
    nodeId: string;
    updates: Partial<CanvasNodeData>;
    userId?: string;
}
interface NodesUpdatedMessage {
    type: MessageType.NODES_UPDATED;
    seq: number;
    updates: Array<{
        nodeId: string;
        updates: Partial<CanvasNodeData>;
    }>;
}
interface NodeCreatedMessage {
    type: MessageType.NODE_CREATED;
    seq: number;
    node: CanvasNodeData;
    tempId?: string;
}
interface NodeDeletedMessage {
    type: MessageType.NODE_DELETED;
    seq: number;
    nodeId: string;
}
interface NodeLockedMessage {
    type: MessageType.NODE_LOCKED;
    nodeId: string;
    userId: string;
}
interface NodeUnlockedMessage {
    type: MessageType.NODE_UNLOCKED;
    nodeId: string;
}
interface PresenceUpdateMessage {
    type: MessageType.PRESENCE_UPDATE;
    userId: string;
    presence: UserPresence | null;
}
interface ErrorMessage {
    type: MessageType.ERROR;
    error: string;
    code?: string;
}
type ServerMessage = SyncStateMessage | NodeCreatedMessage | NodeUpdatedMessage | NodesUpdatedMessage | NodeDeletedMessage | NodeLockedMessage | NodeUnlockedMessage | PresenceUpdateMessage | ErrorMessage;
interface CollaborationConfig {
    canvasId: string;
    userId: string;
    userName?: string;
    wsUrl?: string;
    token?: string;
    autoReconnect?: boolean;
    reconnectInterval?: number;
    enabled?: boolean;
    invisible?: boolean;
    clientIdleTimeout?: number;
}
interface CollaborationState {
    connected: boolean;
    seq: number;
    presences: Map<string, UserPresence>;
    lockedNodes: Map<string, string>;
    createNode: (nodeData: Partial<CanvasNodeData>, tempId?: string) => void;
    updateNode: (nodeId: string, updates: Partial<CanvasNodeData>) => void;
    updateNodes: (updates: Array<{
        nodeId: string;
        updates: Partial<CanvasNodeData>;
    }>, immediate?: boolean) => void;
    deleteNode: (nodeId: string) => void;
    dragStart: (nodeId: string, position: Position) => void;
    dragMove: (nodeId: string, position: Position) => void;
    dragEnd: (nodeId: string, position: Position) => void;
    updatePresence: (presence: Partial<UserPresence>) => void;
    leave: () => void;
    reconnect: () => void;
}
/**
 * 协同编辑 Hook
 */
declare function useCollaboration(config: CollaborationConfig, onMessage: (message: ServerMessage) => void): CollaborationState;

declare function ImageNode({ data, selected, dragging }: NodeProps): react_jsx_runtime.JSX.Element;

declare function VideoNode({ data, selected, dragging }: NodeProps): react_jsx_runtime.JSX.Element;

declare function AudioNode({ data, selected, dragging }: NodeProps): react_jsx_runtime.JSX.Element;

declare function TextNode({ data, selected, dragging }: NodeProps): react_jsx_runtime.JSX.Element;

interface IconProps$2 extends React.SVGProps<SVGSVGElement> {
    size?: number;
    strokeWidth?: number | string;
}
declare function EditModeIcon({ size, ...props }: IconProps$2): react_jsx_runtime.JSX.Element;

interface IconProps$1 extends React.SVGProps<SVGSVGElement> {
    size?: number;
    locked?: boolean;
}
declare function LockModeIcon({ size, locked, ...props }: IconProps$1): react_jsx_runtime.JSX.Element;

declare function PanModeIcon({ size, ...props }: IconProps$2): react_jsx_runtime.JSX.Element;

interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number;
}
declare function TextModeIcon({ size, ...props }: IconProps): react_jsx_runtime.JSX.Element;

declare function PlusIcon({ size, ...props }: IconProps$2): react_jsx_runtime.JSX.Element;

declare function LayersIcon({ size, strokeWidth, ...props }: IconProps$2): react_jsx_runtime.JSX.Element;

declare function ExpandIcon({ size, ...props }: IconProps$2): react_jsx_runtime.JSX.Element;

interface SelectModeState {
    isActive: boolean;
    mediaType: string | null;
}
declare const SelectModeProvider: React.Provider<SelectModeState>;
declare const useSelectMode: () => SelectModeState;

export { AudioNode, type CollaborationConfig, type CollaborationState, CollaborativeCanvas, type CollaborativeCanvasProps, EditModeIcon, ExpandIcon, type IconProps$2 as IconProps, ImageNode, InfiniteCanvas, type InfiniteCanvasProps, LayersIcon, LockModeIcon, PanModeIcon, PlusIcon, SelectModeProvider, type SelectModeState, type ServerMessage, TextModeIcon, TextNode, type UserPresence, VideoNode, WidgetBridge, type WidgetEvent, type WidgetEventSource, createWidgetEvent, useCollaboration, useSelectMode, widgetBridge };
