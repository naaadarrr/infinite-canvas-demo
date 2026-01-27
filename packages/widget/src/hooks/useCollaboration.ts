/**
 * 协同编辑 Hook
 * 提供 WebSocket 连接和消息处理
 */

import { useEffect, useRef, useState, useCallback } from 'react';

declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

// 消息类型
export enum MessageType {
  JOIN = 'join',
  LEAVE = 'leave',
  SYNC_STATE = 'sync_state',
  PING = 'ping',
  PONG = 'pong',
  CREATE_NODE = 'create_node',
  UPDATE_NODE = 'update_node',
  UPDATE_NODES = 'update_nodes',
  DELETE_NODE = 'delete_node',
  DRAG_START = 'drag_start',
  DRAG_MOVE = 'drag_move',
  DRAG_END = 'drag_end',
  UPDATE_PRESENCE = 'update_presence',
  NODE_CREATED = 'node_created',
  NODE_UPDATED = 'node_updated',
  NODES_UPDATED = 'nodes_updated',
  NODE_DELETED = 'node_deleted',
  NODE_LOCKED = 'node_locked',
  NODE_UNLOCKED = 'node_unlocked',
  PRESENCE_UPDATE = 'presence_update',
  ERROR = 'error',
}

export interface Position {
  x: number;
  y: number;
}

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
  color?: string;
  lastUpdate: number;
}

export interface CanvasNodeData {
  id: string;
  type: string;
  position: Position;
  size: { width: number; height: number };
  [key: string]: any;
}

// 服务器消息类型
export interface SyncStateMessage {
  type: MessageType.SYNC_STATE;
  seq: number;
  nodes: CanvasNodeData[];
  presences: Record<string, UserPresence>;
  lockedNodes: Record<string, string>;
}

export interface PingMessage {
  type: MessageType.PING;
  ts: number;
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
  presence: UserPresence | null;
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
  | NodeUpdatedMessage
  | NodesUpdatedMessage
  | NodeDeletedMessage
  | NodeLockedMessage
  | NodeUnlockedMessage
  | PresenceUpdateMessage
  | ErrorMessage;

// Hook 配置
export interface CollaborationConfig {
  canvasId: string;
  userId: string;
  userName?: string;
  wsUrl?: string;
  token?: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  enabled?: boolean;
}

// Hook 返回值
export interface CollaborationState {
  connected: boolean;
  seq: number;
  presences: Map<string, UserPresence>;
  lockedNodes: Map<string, string>;
  
  // 发送消息的方法
  createNode: (nodeData: Partial<CanvasNodeData>, tempId?: string) => void;
  updateNode: (nodeId: string, updates: Partial<CanvasNodeData>) => void;
  updateNodes: (updates: Array<{ nodeId: string; updates: Partial<CanvasNodeData> }>) => void;
  deleteNode: (nodeId: string) => void;
  dragStart: (nodeId: string, position: Position) => void;
  dragMove: (nodeId: string, position: Position) => void;
  dragEnd: (nodeId: string, position: Position) => void;
  updatePresence: (presence: Partial<UserPresence>) => void;
  leave: () => void;
}

// 节流函数
function throttle<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  return (...args: Parameters<T>) => {
    lastArgs = args;
    
    if (!timeout) {
      timeout = setTimeout(() => {
        if (lastArgs) {
          func(...lastArgs);
          lastArgs = null;
        }
        timeout = null;
      }, wait);
    }
  };
}

/**
 * 协同编辑 Hook
 */
export function useCollaboration(
  config: CollaborationConfig,
  onMessage: (message: ServerMessage) => void
): CollaborationState {
  const {
    canvasId,
    userId,
    userName,
    wsUrl = (typeof process !== 'undefined' && process?.env?.NEXT_PUBLIC_WS_BASE) || 'wss://infinite-canvas-collab-server.buzzbus.workers.dev',
    token = (typeof process !== 'undefined' && process?.env?.NEXT_PUBLIC_USER_TOKEN) || `user_${userId}`,
    autoReconnect = true,
    reconnectInterval = 3000,
    enabled = true,
  } = config;

  const [connected, setConnected] = useState(false);
  const [seq, setSeq] = useState(0);
  const [presences, setPresences] = useState<Map<string, UserPresence>>(new Map());
  const [lockedNodes, setLockedNodes] = useState<Map<string, string>>(new Map());

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSeqRef = useRef(0);
  const reconnectBlockedRef = useRef(false);
  const manualCloseRef = useRef(false);
  const shouldReconnectRef = useRef(true);
  
  // 使用 ref 存储 onMessage，避免它影响 connect 的依赖
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  // 发送消息
  const send = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // 节流的发送方法
  const throttledDragMove = useRef(
    throttle((nodeId: string, position: Position) => {

      send({
        type: MessageType.DRAG_MOVE,
        nodeId,
        position,
      });
    }, 33) // ~30 fps
  ).current;

  const throttledUpdatePresence = useRef(
    throttle((presence: Partial<UserPresence>) => {
      send({
        type: MessageType.UPDATE_PRESENCE,
        presence,
      });
    }, 100) // ~10 fps
  ).current;

  const throttledUpdateNodes = useRef(
    throttle((updates: Array<{ nodeId: string; updates: Partial<CanvasNodeData> }>) => {
      send({
        type: MessageType.UPDATE_NODES,
        updates,
      });
    }, 33) // ~30 fps
  ).current;

  // 连接 WebSocket
  const connect = useCallback(() => {
    if (!enabled) {
      return;
    }
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      return;
    }

    try {
      const url = `${wsUrl}/ws/canvas/${canvasId}?token=${token}`;
      console.log('[Collaboration] Connecting to:', url);
      const ws = new WebSocket(url);
      manualCloseRef.current = false;

      ws.onopen = () => {
        console.log('[Collaboration] Connected to canvas:', canvasId);
        setConnected(true);

        // 发送 JOIN 消息
        try {
          ws.send(
            JSON.stringify({
              type: MessageType.JOIN,
              userId,
              userName,
              lastSeq: lastSeqRef.current,
            })
          );
        } catch (error) {
          console.error('[Collaboration] Error sending JOIN message:', error);
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as ServerMessage;

          // 更新 seq
          if ('seq' in message) {
            setSeq(message.seq);
            lastSeqRef.current = message.seq;
          }

          // 处理特殊消息
          switch (message.type) {
            case MessageType.PING:
              // 直接发送 PONG，不使用 send 函数避免循环依赖
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: MessageType.PONG }));
              }
              break;
            case MessageType.SYNC_STATE:
              setPresences(new Map(Object.entries(message.presences)));
              setLockedNodes(new Map(Object.entries(message.lockedNodes)));
              break;

            case MessageType.NODE_LOCKED:
              setLockedNodes((prev) => {
                const next = new Map(prev);
                next.set(message.nodeId, message.userId);
                return next;
              });
              break;

            case MessageType.NODE_UNLOCKED:
              setLockedNodes((prev) => {
                const next = new Map(prev);
                next.delete(message.nodeId);
                return next;
              });
              break;

            case MessageType.PRESENCE_UPDATE:
              setPresences((prev) => {
                const next = new Map(prev);
                if (message.presence) {
                  next.set(message.userId, message.presence);
                } else {
                  next.delete(message.userId);
                }
                return next;
              });
              break;

          case MessageType.ERROR:
              if (message.code === 'ROOM_FULL') {
                reconnectBlockedRef.current = true;
                ws.close(4000, 'Room full');
              } else {
                console.error('[Collaboration] Server error:', message.error);
              }
              break;
          }

          // 调用外部回调（使用 ref 避免依赖变化）
          onMessageRef.current(message);
        } catch (error) {
          console.error('[Collaboration] Error parsing message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('[Collaboration] Disconnected from canvas:', canvasId, 'code:', event.code, 'reason:', event.reason);
        setConnected(false);
        if (wsRef.current === ws) {
          wsRef.current = null;
        }

        if (event.code === 1013) {
          reconnectBlockedRef.current = true;
        }
        if (event.code === 4000 || event.code === 4002) {
          shouldReconnectRef.current = false;
        }
        if (manualCloseRef.current) {
          manualCloseRef.current = false;
          return;
        }

        // 自动重连
        if (
          enabled &&
          autoReconnect &&
          shouldReconnectRef.current &&
          !reconnectBlockedRef.current
        ) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('[Collaboration] Reconnecting...');
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (error: Event) => {
        const wsError = error as ErrorEvent;
        console.error('[Collaboration] WebSocket error:', {
          error: wsError,
          message: wsError.message || 'Unknown error',
          type: wsError.type,
          url,
          readyState: ws.readyState,
          readyStateText: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][ws.readyState],
          canvasId,
        });
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[Collaboration] Error creating WebSocket:', error);
    }
  // 注意：移除 onMessage 依赖，使用 onMessageRef 替代，避免 connect 频繁重建
  }, [canvasId, userId, userName, wsUrl, token, autoReconnect, reconnectInterval, enabled]);

  // 初始化连接
  useEffect(() => {
    if (!enabled) {
      shouldReconnectRef.current = false;
      manualCloseRef.current = true;
      setConnected(false);
      setPresences(new Map());
      setLockedNodes(new Map());
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    shouldReconnectRef.current = true;
    connect();

    return () => {
      shouldReconnectRef.current = false;
      manualCloseRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, enabled]);

  // API 方法
  const createNode = useCallback(
    (nodeData: Partial<CanvasNodeData>, tempId?: string) => {
      send({
        type: MessageType.CREATE_NODE,
        tempId: tempId ?? `temp_${Date.now()}`,
        nodeData,
      });
    },
    [send]
  );

  const updateNode = useCallback(
    (nodeId: string, updates: Partial<CanvasNodeData>) => {
      send({
        type: MessageType.UPDATE_NODE,
        nodeId,
        updates,
      });
    },
    [send]
  );

  const updateNodes = useCallback(
    (updates: Array<{ nodeId: string; updates: Partial<CanvasNodeData> }>) => {
      if (updates.length === 0) {
        return;
      }
      throttledUpdateNodes(updates);
    },
    [throttledUpdateNodes]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      send({
        type: MessageType.DELETE_NODE,
        nodeId,
      });
    },
    [send]
  );

  const dragStart = useCallback(
    (nodeId: string, position: Position) => {
      send({
        type: MessageType.DRAG_START,
        nodeId,
        position,
      });
    },
    [send]
  );

  const dragMove = useCallback(
    (nodeId: string, position: Position) => {
      throttledDragMove(nodeId, position);
    },
    [throttledDragMove]
  );

  const dragEnd = useCallback(
    (nodeId: string, position: Position) => {
      send({
        type: MessageType.DRAG_END,
        nodeId,
        position,
      });
    },
    [send]
  );

  const updatePresence = useCallback(
    (presence: Partial<UserPresence>) => {
      throttledUpdatePresence(presence);
    },
    [throttledUpdatePresence]
  );

  const leave = useCallback(() => {
    send({ type: MessageType.LEAVE });
  }, [send]);

  return {
    connected,
    seq,
    presences,
    lockedNodes,
    createNode,
    updateNode,
    updateNodes,
    deleteNode,
    dragStart,
    dragMove,
    dragEnd,
    updatePresence,
    leave,
  };
}
