/**
 * CanvasRoom Durable Object
 * 每个画布对应一个 DO 实例，维护权威状态
 */

import type {
  Env,
  CanvasNodeData,
  UserPresence,
  ConnectionInfo,
  ClientMessage,
  ServerMessage,
  MessageType,
  JoinMessage,
  LeaveMessage,
  CreateNodeMessage,
  DeleteNodeMessage,
  UpdateNodeMessage,
  UpdateNodesMessage,
  DragStartMessage,
  DragMoveMessage,
  DragEndMessage,
  PongMessage,
  UpdatePresenceMessage,
  SyncStateMessage,
  PingMessage,
  NodeCreatedMessage,
  NodeDeletedMessage,
  NodeUpdatedMessage,
  NodesUpdatedMessage,
  Position,
} from './types';
import { loadLatestSnapshot, createAndSaveSnapshot } from './snapshot';

export class CanvasRoom implements DurableObject {
  private state: DurableObjectState;
  private env: Env;
  
  // 画布状态
  private canvasId: string = '';
  private seq: number = 0;
  private nodes: Map<string, CanvasNodeData> = new Map();
  private presences: Map<string, UserPresence> = new Map();
  private lockedNodes: Map<string, string> = new Map(); // nodeId -> userId
  private connections: Map<WebSocket, ConnectionInfo> = new Map();
  
  // 快照配置
  private lastSnapshotSeq: number = 0;
  private lastSnapshotTime: number = Date.now();
  private snapshotInterval: number = 30000; // 30 秒
  private snapshotOpThreshold: number = 50; // 50 个操作
  private maxRoomUsers: number = 3;
  private heartbeatInterval: number = 30000; // 30 秒
  private heartbeatMissLimit: number = 3;
  
  // 心跳和清理
  private heartbeatTimer?: number;
  private cleanupTimer?: number;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    
    // 从环境变量读取配置
    if (env.SNAPSHOT_INTERVAL) {
      this.snapshotInterval = parseInt(env.SNAPSHOT_INTERVAL, 10);
    }
    if (env.SNAPSHOT_OP_THRESHOLD) {
      this.snapshotOpThreshold = parseInt(env.SNAPSHOT_OP_THRESHOLD, 10);
    }
    if (env.MAX_ROOM_USERS) {
      const max = parseInt(env.MAX_ROOM_USERS, 10);
      if (!Number.isNaN(max) && max > 0) {
        this.maxRoomUsers = max;
      }
    }
  }

  /**
   * 处理 HTTP 请求（WebSocket 升级）
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    // WebSocket 升级
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request);
    }

    if (url.pathname === '/leave' && request.method === 'POST') {
      return this.handleLeaveRequest(request);
    }

    // HTTP API（可选）
    if (url.pathname === '/state') {
      return this.handleGetState();
    }

    return new Response('Not found', { status: 404 });
  }

  /**
   * 外部服务强制用户离开
   */
  private async handleLeaveRequest(request: Request): Promise<Response> {
    try {
      const body = await request.json<{ userId?: string }>();
      const userId = body.userId;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Missing userId' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      let closedCount = 0;
      for (const [ws, info] of this.connections.entries()) {
        if (info.userId === userId) {
          ws.close(4002, 'Forced leave');
          closedCount += 1;
        }
      }

      return new Response(JSON.stringify({ success: true, closedCount }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  /**
   * 处理 WebSocket 连接
   */
  private async handleWebSocket(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const canvasId = url.searchParams.get('canvasId');
    
    if (!canvasId) {
      return new Response('Missing canvasId', { status: 400 });
    }

    // 初始化画布状态（如果是首次连接）
    if (!this.canvasId) {
      await this.initialize(canvasId);
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // 接受连接
    server.accept();
    
    // 等待客户端发送 JOIN 消息
    server.addEventListener('message', async (event) => {
      try {
        const message = JSON.parse(event.data as string) as ClientMessage;
        
        if (message.type === 'join') {
          await this.handleJoin(server, message as JoinMessage);
        } else {
          // 其他消息需要先 JOIN
          if (!this.connections.has(server)) {
            this.sendError(server, 'Must send JOIN message first');
            return;
          }
          await this.handleMessage(server, message);
        }
      } catch (error) {
        console.error('[CanvasRoom] Error handling message:', error);
        this.sendError(server, 'Invalid message format');
      }
    });

    server.addEventListener('close', () => {
      this.handleDisconnect(server);
    });

    server.addEventListener('error', (event) => {
      console.error('[CanvasRoom] WebSocket error:', event);
      this.handleDisconnect(server);
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  /**
   * 初始化画布状态
   */
  private async initialize(canvasId: string): Promise<void> {
    this.canvasId = canvasId;
    console.log(`[CanvasRoom] Initializing canvas ${canvasId}`);

    // 尝试从快照恢复
    try {
      const snapshot = await loadLatestSnapshot(this.env, canvasId);
      
      if (snapshot) {
        this.seq = snapshot.seq;
        this.lastSnapshotSeq = snapshot.seq;
        this.nodes = new Map(snapshot.nodes.map(node => [node.id, node]));
        console.log(`[CanvasRoom] Restored from snapshot: ${snapshot.nodes.length} nodes, seq ${this.seq}`);
      } else {
        console.log(`[CanvasRoom] No snapshot found, starting fresh`);
      }
    } catch (error) {
      console.error(`[CanvasRoom] Error loading snapshot:`, error);
    }

    // 启动定期快照
    this.startPeriodicSnapshot();
  }

  /**
   * 处理客户端加入
   */
  private async handleJoin(ws: WebSocket, message: JoinMessage): Promise<void> {
    const { userId, userName, lastSeq } = message;

    const activeUsers = new Set(Array.from(this.connections.values()).map((info) => info.userId));
    if (activeUsers.size >= this.maxRoomUsers && !activeUsers.has(userId)) {
      this.send(ws, {
        type: 'error',
        error: 'Room is full',
        code: 'ROOM_FULL',
      });
      ws.close(1013, 'Room full');
      return;
    }

    // 注册连接
    this.connections.set(ws, {
      userId,
      userName,
      joinedAt: Date.now(),
      lastPongAt: Date.now(),
      missedHeartbeats: 0,
    });

    // 初始化 presence
    this.presences.set(userId, {
      userId,
      userName,
      lastUpdate: Date.now(),
    });

    console.log(`[CanvasRoom] User ${userId} joined canvas ${this.canvasId}`);

    // 发送完整状态同步
    const syncMessage: SyncStateMessage = {
      type: 'sync_state',
      seq: this.seq,
      nodes: Array.from(this.nodes.values()),
      presences: Object.fromEntries(this.presences),
      lockedNodes: Object.fromEntries(this.lockedNodes),
    };
    
    this.send(ws, syncMessage);

    // 广播新用户加入
    this.broadcastPresenceUpdate(userId, this.presences.get(userId)!);

    this.startHeartbeat();
  }

  /**
   * 处理客户端消息
   */
  private async handleMessage(ws: WebSocket, message: ClientMessage): Promise<void> {
    const conn = this.connections.get(ws);
    if (!conn) return;

    switch (message.type) {
      case 'create_node':
        await this.handleCreateNode(conn.userId, message as CreateNodeMessage);
        break;
      
      case 'delete_node':
        await this.handleDeleteNode(conn.userId, message as DeleteNodeMessage);
        break;
      
      case 'update_node':
        await this.handleUpdateNode(conn.userId, message as UpdateNodeMessage);
        break;

      case 'update_nodes':
        await this.handleUpdateNodes(conn.userId, message as UpdateNodesMessage);
        break;
      
      case 'drag_start':
        await this.handleDragStart(conn.userId, message as DragStartMessage);
        break;
      
      case 'drag_move':
        await this.handleDragMove(conn.userId, message as DragMoveMessage);
        break;
      
      case 'drag_end':
        await this.handleDragEnd(conn.userId, message as DragEndMessage);
        break;

      case 'leave':
        await this.handleLeave(conn.userId, ws, message as LeaveMessage);
        break;

      case 'pong':
        await this.handlePong(ws, message as PongMessage);
        break;
      
      case 'update_presence':
        await this.handleUpdatePresence(conn.userId, message as UpdatePresenceMessage);
        break;
      
      default:
        console.warn(`[CanvasRoom] Unknown message type:`, message);
    }
  }

  /**
   * 创建节点
   */
  private async handleCreateNode(userId: string, message: CreateNodeMessage): Promise<void> {
    const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const node: CanvasNodeData = {
      ...message.nodeData,
      id: nodeId,
    } as CanvasNodeData;

    this.nodes.set(nodeId, node);
    this.seq++;

    const response: NodeCreatedMessage = {
      type: 'node_created',
      seq: this.seq,
      node,
      tempId: message.tempId,
    };

    this.broadcast(response);
    await this.checkSnapshot();
  }

  /**
   * 删除节点
   */
  private async handleDeleteNode(userId: string, message: DeleteNodeMessage): Promise<void> {
    const { nodeId } = message;

    if (!this.nodes.has(nodeId)) {
      return;
    }

    this.nodes.delete(nodeId);
    this.lockedNodes.delete(nodeId);
    this.seq++;

    const response: NodeDeletedMessage = {
      type: 'node_deleted',
      seq: this.seq,
      nodeId,
    };

    this.broadcast(response);
    await this.checkSnapshot();
  }

  /**
   * 更新节点
   */
  private async handleUpdateNode(userId: string, message: UpdateNodeMessage): Promise<void> {
    const { nodeId, updates } = message;
    const node = this.nodes.get(nodeId);

    if (!node) {
      return;
    }

    // 合并更新
    Object.assign(node, updates);
    this.seq++;

    const response: NodeUpdatedMessage = {
      type: 'node_updated',
      seq: this.seq,
      nodeId,
      updates,
    };

    this.broadcast(response);
    await this.checkSnapshot();
  }

  /**
   * 批量更新节点
   */
  private async handleUpdateNodes(userId: string, message: UpdateNodesMessage): Promise<void> {
    const updates = message.updates || [];
    if (updates.length === 0) {
      return;
    }

    const applied: Array<{ nodeId: string; updates: Partial<CanvasNodeData> }> = [];

    updates.forEach(({ nodeId, updates: nodeUpdates }) => {
      const node = this.nodes.get(nodeId);
      if (!node) {
        return;
      }
      if (this.lockedNodes.has(nodeId) && this.lockedNodes.get(nodeId) !== userId) {
        return;
      }
      Object.assign(node, nodeUpdates);
      applied.push({ nodeId, updates: nodeUpdates });
    });

    if (applied.length === 0) {
      return;
    }

    this.seq++;

    const response: NodesUpdatedMessage = {
      type: 'nodes_updated',
      seq: this.seq,
      updates: applied,
    };

    this.broadcast(response);
    await this.checkSnapshot();
  }

  /**
   * 开始拖拽
   */
  private async handleDragStart(userId: string, message: DragStartMessage): Promise<void> {
    const { nodeId, position } = message;
    const node = this.nodes.get(nodeId);

    if (!node) {
      return;
    }

    // 检查节点是否已被锁定
    if (this.lockedNodes.has(nodeId) && this.lockedNodes.get(nodeId) !== userId) {
      // 发送错误给请求者
      const conn = Array.from(this.connections.entries()).find(([_, info]) => info.userId === userId);
      if (conn) {
        this.sendError(conn[0], `Node ${nodeId} is locked by another user`);
      }
      return;
    }

    // 锁定节点
    this.lockedNodes.set(nodeId, userId);

    // 更新位置
    node.position = position;
    this.seq++;

    // 广播锁定状态
    this.broadcast({
      type: 'node_locked',
      nodeId,
      userId,
    });

    // 广播位置更新
    this.broadcast({
      type: 'node_updated',
      seq: this.seq,
      nodeId,
      updates: { position },
    });

    // 更新 presence
    const presence = this.presences.get(userId);
    if (presence) {
      presence.draggingNode = nodeId;
      this.broadcastPresenceUpdate(userId, presence);
    }
  }

  /**
   * 拖拽移动
   */
  private async handleDragMove(userId: string, message: DragMoveMessage): Promise<void> {
    const { nodeId, position } = message;
    const node = this.nodes.get(nodeId);

    if (!node) {
      return;
    }

    // 检查是否持有锁
    if (this.lockedNodes.get(nodeId) !== userId) {
      return;
    }

    // 更新位置
    node.position = position;
    this.seq++;

    // 广播位置更新（节流由客户端控制）
    this.broadcast({
      type: 'node_updated',
      seq: this.seq,
      nodeId,
      updates: { position },
    });
  }

  /**
   * 结束拖拽
   */
  private async handleDragEnd(userId: string, message: DragEndMessage): Promise<void> {
    const { nodeId, position } = message;
    const node = this.nodes.get(nodeId);

    if (!node) {
      return;
    }

    // 检查是否持有锁
    if (this.lockedNodes.get(nodeId) !== userId) {
      return;
    }

    // 更新最终位置
    node.position = position;
    this.seq++;

    // 释放锁
    this.lockedNodes.delete(nodeId);

    // 广播解锁和最终位置
    this.broadcast({
      type: 'node_unlocked',
      nodeId,
    });

    this.broadcast({
      type: 'node_updated',
      seq: this.seq,
      nodeId,
      updates: { position },
    });

    // 更新 presence
    const presence = this.presences.get(userId);
    if (presence) {
      presence.draggingNode = undefined;
      this.broadcastPresenceUpdate(userId, presence);
    }

    await this.checkSnapshot();
  }

  /**
   * 处理客户端离开
   */
  private async handleLeave(userId: string, ws: WebSocket, _message: LeaveMessage): Promise<void> {
    if (!this.connections.has(ws)) {
      return;
    }
    ws.close(4000, 'Client leave');
  }

  /**
   * 处理心跳响应
   */
  private async handlePong(ws: WebSocket, _message: PongMessage): Promise<void> {
    const conn = this.connections.get(ws);
    if (!conn) return;
    conn.lastPongAt = Date.now();
    conn.missedHeartbeats = 0;
  }

  /**
   * 更新 presence
   */
  private async handleUpdatePresence(userId: string, message: UpdatePresenceMessage): Promise<void> {
    const presence = this.presences.get(userId);
    if (!presence) return;

    // 合并更新
    Object.assign(presence, message.presence, {
      lastUpdate: Date.now(),
    });

    // 广播 presence 更新
    this.broadcastPresenceUpdate(userId, presence);
  }

  /**
   * 处理断开连接
   */
  private handleDisconnect(ws: WebSocket): void {
    const conn = this.connections.get(ws);
    if (!conn) return;

    const { userId } = conn;
    console.log(`[CanvasRoom] User ${userId} disconnected from canvas ${this.canvasId}`);

    // 释放该用户锁定的所有节点
    for (const [nodeId, lockUserId] of this.lockedNodes.entries()) {
      if (lockUserId === userId) {
        this.lockedNodes.delete(nodeId);
        this.broadcast({
          type: 'node_unlocked',
          nodeId,
        });
      }
    }

    // 移除连接
    this.connections.delete(ws);

    // 检查是否还有该用户的其他连接
    const hasOtherConnections = Array.from(this.connections.values())
      .some(info => info.userId === userId);

    if (!hasOtherConnections) {
      // 移除 presence
      this.presences.delete(userId);
      this.broadcastPresenceUpdate(userId, null);
    }

    // 如果没有连接了，可以考虑保存快照并清理
    if (this.connections.size === 0) {
      console.log(`[CanvasRoom] No more connections, saving final snapshot`);
      this.saveSnapshotNow().catch(console.error);
      this.stopHeartbeat();
    }
  }

  /**
   * 心跳检测
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      return;
    }
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      for (const [ws, info] of this.connections.entries()) {
        if (ws.readyState !== 1) {
          ws.close(4001, 'Heartbeat timeout');
          continue;
        }
        if (now - info.lastPongAt > this.heartbeatInterval) {
          info.missedHeartbeats += 1;
        } else {
          info.missedHeartbeats = 0;
        }
        if (info.missedHeartbeats >= this.heartbeatMissLimit) {
          ws.close(4001, 'Heartbeat timeout');
          continue;
        }
        const ping: PingMessage = { type: 'ping', ts: now };
        this.send(ws, ping);
      }
    }, this.heartbeatInterval) as unknown as number;
  }

  private stopHeartbeat(): void {
    if (!this.heartbeatTimer) {
      return;
    }
    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = undefined;
  }

  /**
   * 获取状态（HTTP API）
   */
  private handleGetState(): Response {
    return new Response(
      JSON.stringify({
        canvasId: this.canvasId,
        seq: this.seq,
        nodeCount: this.nodes.size,
        connectionCount: this.connections.size,
        presenceCount: this.presences.size,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  /**
   * 广播消息给所有连接
   */
  private broadcast(message: ServerMessage, excludeWs?: WebSocket): void {
    const data = JSON.stringify(message);
    
    for (const ws of this.connections.keys()) {
      if (ws !== excludeWs && ws.readyState === 1) {
        try {
          ws.send(data);
        } catch (error) {
          console.error('[CanvasRoom] Error sending message:', error);
        }
      }
    }
  }

  /**
   * 广播 presence 更新
   */
  private broadcastPresenceUpdate(userId: string, presence: UserPresence | null): void {
    this.broadcast({
      type: 'presence_update',
      userId,
      presence,
    });
  }

  /**
   * 发送消息给特定连接
   */
  private send(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * 发送错误消息
   */
  private sendError(ws: WebSocket, error: string, code?: string): void {
    this.send(ws, {
      type: 'error',
      error,
      code,
    });
  }

  /**
   * 检查是否需要保存快照
   */
  private async checkSnapshot(): Promise<void> {
    const opsSinceSnapshot = this.seq - this.lastSnapshotSeq;
    const timeSinceSnapshot = Date.now() - this.lastSnapshotTime;

    if (
      opsSinceSnapshot >= this.snapshotOpThreshold ||
      timeSinceSnapshot >= this.snapshotInterval
    ) {
      await this.saveSnapshotNow();
    }
  }

  /**
   * 立即保存快照
   */
  private async saveSnapshotNow(): Promise<void> {
    if (!this.canvasId) return;

    try {
      console.log(`[CanvasRoom] Saving snapshot for canvas ${this.canvasId} at seq ${this.seq}`);
      
      await createAndSaveSnapshot(
        this.env,
        this.canvasId,
        this.seq,
        Array.from(this.nodes.values())
      );

      this.lastSnapshotSeq = this.seq;
      this.lastSnapshotTime = Date.now();
    } catch (error) {
      console.error(`[CanvasRoom] Error saving snapshot:`, error);
    }
  }

  /**
   * 启动定期快照
   */
  private startPeriodicSnapshot(): void {
    // 使用 alarm API 进行定期快照
    this.state.storage.setAlarm(Date.now() + this.snapshotInterval);
  }

  /**
   * Alarm 处理（定期触发）
   */
  async alarm(): Promise<void> {
    console.log(`[CanvasRoom] Alarm triggered for canvas ${this.canvasId}`);
    
    // 如果有更新，保存快照
    if (this.seq > this.lastSnapshotSeq) {
      await this.saveSnapshotNow();
    }

    // 设置下一次 alarm
    if (this.connections.size > 0) {
      this.state.storage.setAlarm(Date.now() + this.snapshotInterval);
    }
  }
}
