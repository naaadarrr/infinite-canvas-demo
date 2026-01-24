/**
 * 共享类型定义
 * 这些类型在前后端都会使用，可以考虑后续提取到 packages/types
 */

// ============ 节点相关类型 ============

export enum NodeType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  TEXT = 'text',
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface BaseNodeData {
  id: string;
  type: NodeType;
  position: Position;
  size: Size;
  zIndex?: number;
  rotation?: number;
  [key: string]: unknown;
}

export interface ImageNodeData extends BaseNodeData {
  type: NodeType.IMAGE;
  url: string;
  alt?: string;
}

export interface VideoNodeData extends BaseNodeData {
  type: NodeType.VIDEO;
  url: string;
  poster?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

export interface AudioNodeData extends BaseNodeData {
  type: NodeType.AUDIO;
  url: string;
  title?: string;
  artist?: string;
  autoplay?: boolean;
  loop?: boolean;
}

export interface TextNodeData extends BaseNodeData {
  type: NodeType.TEXT;
  content: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
}

export type CanvasNodeData = ImageNodeData | VideoNodeData | AudioNodeData | TextNodeData;

// ============ WebSocket 消息类型 ============

export enum MessageType {
  // 连接相关
  JOIN = 'join',
  LEAVE = 'leave',
  SYNC_STATE = 'sync_state',
  PING = 'ping',
  PONG = 'pong',
  
  // 节点操作
  CREATE_NODE = 'create_node',
  DELETE_NODE = 'delete_node',
  UPDATE_NODE = 'update_node',
  UPDATE_NODES = 'update_nodes',
  
  // 拖拽操作
  DRAG_START = 'drag_start',
  DRAG_MOVE = 'drag_move',
  DRAG_END = 'drag_end',
  
  // Presence
  UPDATE_PRESENCE = 'update_presence',
  PRESENCE_UPDATE = 'presence_update',
  
  // 节点更新广播
  NODE_CREATED = 'node_created',
  NODE_DELETED = 'node_deleted',
  NODE_UPDATED = 'node_updated',
  NODES_UPDATED = 'nodes_updated',
  NODE_LOCKED = 'node_locked',
  NODE_UNLOCKED = 'node_unlocked',
  
  // 错误
  ERROR = 'error',
}

// 客户端 -> 服务器消息

export interface JoinMessage {
  type: MessageType.JOIN;
  userId: string;
  userName?: string;
  lastSeq?: number; // 客户端已知的最后序号，用于增量同步
}

export interface LeaveMessage {
  type: MessageType.LEAVE;
}

export interface PongMessage {
  type: MessageType.PONG;
}

export interface CreateNodeMessage {
  type: MessageType.CREATE_NODE;
  tempId?: string; // 客户端临时 ID
  nodeData: Partial<CanvasNodeData>;
}

export interface DeleteNodeMessage {
  type: MessageType.DELETE_NODE;
  nodeId: string;
}

export interface UpdateNodeMessage {
  type: MessageType.UPDATE_NODE;
  nodeId: string;
  updates: Partial<CanvasNodeData>;
}

export interface UpdateNodesMessage {
  type: MessageType.UPDATE_NODES;
  updates: Array<{ nodeId: string; updates: Partial<CanvasNodeData> }>;
}

export interface DragStartMessage {
  type: MessageType.DRAG_START;
  nodeId: string;
  position: Position;
}

export interface DragMoveMessage {
  type: MessageType.DRAG_MOVE;
  nodeId: string;
  position: Position;
}

export interface DragEndMessage {
  type: MessageType.DRAG_END;
  nodeId: string;
  position: Position;
}

export interface UpdatePresenceMessage {
  type: MessageType.UPDATE_PRESENCE;
  presence: Partial<UserPresence>;
}

export type ClientMessage =
  | JoinMessage
  | LeaveMessage
  | PongMessage
  | CreateNodeMessage
  | DeleteNodeMessage
  | UpdateNodeMessage
  | UpdateNodesMessage
  | DragStartMessage
  | DragMoveMessage
  | DragEndMessage
  | UpdatePresenceMessage;

// 服务器 -> 客户端消息

export interface SyncStateMessage {
  type: MessageType.SYNC_STATE;
  seq: number;
  nodes: CanvasNodeData[];
  presences: Record<string, UserPresence>;
  lockedNodes: Record<string, string>; // nodeId -> userId
}

export interface PingMessage {
  type: MessageType.PING;
  ts: number;
}

export interface NodeCreatedMessage {
  type: MessageType.NODE_CREATED;
  seq: number;
  node: CanvasNodeData;
  tempId?: string;
}

export interface NodeDeletedMessage {
  type: MessageType.NODE_DELETED;
  seq: number;
  nodeId: string;
}

export interface NodeUpdatedMessage {
  type: MessageType.NODE_UPDATED;
  seq: number;
  nodeId: string;
  updates: Partial<CanvasNodeData>;
  userId?: string; // 可选：标识是谁触发的更新，用于客户端过滤
}

export interface NodesUpdatedMessage {
  type: MessageType.NODES_UPDATED;
  seq: number;
  updates: Array<{ nodeId: string; updates: Partial<CanvasNodeData> }>;
}

export interface NodeLockedMessage {
  type: MessageType.NODE_LOCKED;
  nodeId: string;
  userId: string;
}

export interface NodeUnlockedMessage {
  type: MessageType.NODE_UNLOCKED;
  nodeId: string;
}

export interface PresenceUpdateMessage {
  type: MessageType.PRESENCE_UPDATE;
  userId: string;
  presence: UserPresence | null; // null 表示用户离开
}

export interface ErrorMessage {
  type: MessageType.ERROR;
  error: string;
  code?: string;
}

export type ServerMessage =
  | SyncStateMessage
  | PingMessage
  | NodeCreatedMessage
  | NodeDeletedMessage
  | NodeUpdatedMessage
  | NodesUpdatedMessage
  | NodeLockedMessage
  | NodeUnlockedMessage
  | PresenceUpdateMessage
  | ErrorMessage;

// ============ Presence 类型 ============

export interface UserPresence {
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
  color?: string; // 用户颜色标识
  lastUpdate: number; // 时间戳
}

// ============ 持久化类型 ============

export interface CanvasSnapshot {
  canvasId: string;
  seq: number;
  nodes: CanvasNodeData[];
  timestamp: number;
}

export interface CanvasMetadata {
  id: string;
  title: string;
  latestSnapshotKey: string | null;
  latestSeq: number;
  createdAt: number;
  updatedAt: number;
}

// ============ Worker 环境类型 ============

export interface Env {
  CANVAS_ROOM: DurableObjectNamespace;
  DB: D1Database;
  R2: R2Bucket;
  TOKEN_SECRET: string;
  SNAPSHOT_INTERVAL?: string;
  SNAPSHOT_OP_THRESHOLD?: string;
  MAX_ROOM_USERS?: string;
}

// ============ Durable Object 状态类型 ============

export interface CanvasRoomState {
  canvasId: string;
  seq: number;
  nodes: Map<string, CanvasNodeData>;
  presences: Map<string, UserPresence>;
  lockedNodes: Map<string, string>; // nodeId -> userId
  connections: Map<WebSocket, ConnectionInfo>;
  lastSnapshotSeq: number;
  lastSnapshotTime: number;
}

export interface ConnectionInfo {
  userId: string;
  userName?: string;
  joinedAt: number;
  lastPongAt: number;
  missedHeartbeats: number;
}
