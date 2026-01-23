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
    wsUrl = (typeof process !== 'undefined' && process?.env?.NEXT_PUBLIC_WS_BASE) || 'ws://127.0.0.1:8787',
    token = (typeof process !== 'undefined' && process?.env?.NEXT_PUBLIC_USER_TOKEN) || `user_${userId}`,
    autoReconnect = true,
    reconnectInterval = 3000,
  } = config;

  const [connected, setConnected] = useState(false);
  const [seq, setSeq] = useState(0);
  const [presences, setPresences] = useState<Map<string, UserPresence>>(new Map());
  const [lockedNodes, setLockedNodes] = useState<Map<string, string>>(new Map());

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSeqRef = useRef(0);
  const reconnectBlockedRef = useRef(false);

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
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const url = `${wsUrl}/ws/canvas/${canvasId}?token=${token}`;
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('[Collaboration] Connected to canvas:', canvasId);
      setConnected(true);

      // 发送 JOIN 消息
      ws.send(
        JSON.stringify({
          type: MessageType.JOIN,
          userId,
          userName,
          lastSeq: lastSeqRef.current,
        })
      );
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
            send({ type: MessageType.PONG });
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

        // 调用外部回调
        onMessage(message);
      } catch (error) {
        console.error('[Collaboration] Error parsing message:', error);
      }
    };

    ws.onclose = () => {
      console.log('[Collaboration] Disconnected from canvas:', canvasId);
      setConnected(false);
      wsRef.current = null;

      // 自动重连
      if (autoReconnect && !reconnectBlockedRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[Collaboration] Reconnecting...');
          connect();
        }, reconnectInterval);
      }
    };

    ws.onerror = (error) => {
      console.error('[Collaboration] WebSocket error:', error);
    };

    wsRef.current = ws;
  }, [canvasId, userId, userName, wsUrl, token, autoReconnect, reconnectInterval, onMessage]);

  // 初始化连接
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

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
