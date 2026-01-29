/**
 * CanvasRoom Durable Object
 * 每个画布对应一个 DO 实例，维护权威状态
 */

import type {
  Env,
  CanvasNodeData,
  ExternalCommandEnvelope,
  BoardTaskItem,
  MediaResourceInfo,
  Size,
  UserPresence,
  ConnectionInfo,
  ClientMessage,
  ServerMessage,
  JoinMessage,
  LeaveMessage,
  CreateNodeMessage,
  DeleteNodeMessage,
  UpdateNodeMessage,
  UpdateNodesMessage,
  DragStartMessage,
  DragMoveMessage,
  DragEndMessage,
  UpdatePresenceMessage,
  SyncStateMessage,
  NodeCreatedMessage,
  NodeDeletedMessage,
  NodeUpdatedMessage,
  NodesUpdatedMessage,
  Position,
} from './types';
import { MessageType, NodeType } from './types';
import { loadLatestSnapshot } from './snapshot';
import { parseExternalCommand } from './utils/externalCommands';

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;
const ASPECT_RATIO_PATTERN = /^(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)$/;

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
  private processedCommandIds: Map<string, number> = new Map();
  private externalTombstones: Map<string, number> = new Map();
  private autoLayoutIndex: number = 0;
  
  // DO Storage 持久化配置
  private isDirty: boolean = false;
  private flushTimer?: number;
  private flushInterval: number = 2000; // 2 秒持久化
  private stateLoaded: boolean = false; // 防止重复加载
  private readonly CURRENT_STATE_VERSION = 1; // 状态版本控制
  private lastStateSource: 'do_storage' | 'legacy_migration' | 'empty' | 'memory' | 'unknown' = 'unknown';
  private readonly commandIdTtlMs: number = 24 * 60 * 60 * 1000;
  private readonly tombstoneTtlMs: number = 30 * 24 * 60 * 60 * 1000;
  private readonly externalLayoutConfig = {
    columns: 4,
    nodeWidth: 300,
    nodeHeight: 200,
    gap: 50,
    startX: 100,
    startY: 100,
  };
  private readonly externalCdnBaseUrl = 'https://dr1coeak04nbk.cloudfront.net';
  
  // 旧快照配置(已废弃,保留用于迁移)
  private lastSnapshotSeq: number = 0;
  private lastSnapshotTime: number = Date.now();
  private maxRoomUsers: number = 10;
  
  // 空闲检测配置
  private readonly idleTimeoutMs: number;
  private idleCheckTimer?: number;
  
  // 空房间检测配置
  private roomCreatedAt: number = 0;
  private lastConnectionAt: number = 0;
  private emptyRoomTimer?: number;
  private readonly emptyRoomTimeoutMs: number;
  
  // 清理定时器
  private cleanupTimer?: number;
  
  // D1 记录同步标记
  private d1RecordEnsured: boolean = false;
  
  // D1 写入指标
  private d1WriteAttempts: number = 0;
  private d1WriteFailures: number = 0;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    
    // 从环境变量读取配置
    if (env.MAX_ROOM_USERS) {
      const max = parseInt(env.MAX_ROOM_USERS, 10);
      if (!Number.isNaN(max) && max > 0) {
        this.maxRoomUsers = max;
      }
    }
    
    // DO优化配置
    this.idleTimeoutMs = env.IDLE_TIMEOUT_MS 
      ? parseInt(env.IDLE_TIMEOUT_MS, 10) 
      : 5 * 60 * 1000; // 默认5分钟
    
    this.emptyRoomTimeoutMs = env.EMPTY_ROOM_TIMEOUT_MS
      ? parseInt(env.EMPTY_ROOM_TIMEOUT_MS, 10)
      : 60 * 1000; // 默认1分钟
    
    console.log(`[CanvasRoom] Initialized with idleTimeout=${this.idleTimeoutMs}ms, emptyRoomTimeout=${this.emptyRoomTimeoutMs}ms`);
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

    if (url.pathname === '/commands' && request.method === 'POST') {
      return this.handleExternalCommand(request);
    }

    // HTTP API（可选）
    if (url.pathname === '/state') {
      return this.handleGetState();
    }

    // 管理API
    if (url.pathname === '/status' && request.method === 'GET') {
      return this.handleGetStatus();
    }

    if (url.pathname === '/shutdown' && request.method === 'POST') {
      return this.handleShutdown();
    }

    if (url.pathname === '/kick' && request.method === 'POST') {
      return this.handleKickUser(request);
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
    } else {
      this.lastStateSource = 'memory';
      console.log(`[CanvasRoom] Canvas ${canvasId} already initialized, serving state from memory`);
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
    if (this.stateLoaded) {
      return; // 防止重复加载
    }
    
    this.canvasId = canvasId;
    this.roomCreatedAt = Date.now();
    this.lastConnectionAt = Date.now();
    
    console.log(JSON.stringify({
      event: 'room_created',
      roomId: canvasId,
      timestamp: this.roomCreatedAt,
    }));
    console.log(`[CanvasRoom] Initializing canvas ${canvasId}`);

    try {
      // 1. 首先尝试从 DO Storage 加载状态
      const storedData = await this.state.storage.get<{
        version?: number;
        seq: number;
        nodes: CanvasNodeData[];
        canvasId: string;
        commandIds?: Record<string, number>;
        tombstones?: Record<string, number>;
        autoLayoutIndex?: number;
        [key: string]: any;
      }>('state');

      if (storedData && storedData.seq !== undefined && storedData.nodes) {
        // DO Storage 有数据,直接使用
        const version = storedData.version || 1; // 向后兼容,默认版本 1
        
        if (version === this.CURRENT_STATE_VERSION) {
          this.lastStateSource = 'do_storage';
          this.seq = storedData.seq;
          this.nodes = new Map(storedData.nodes.map(node => [node.id, node]));
          this.processedCommandIds = new Map(Object.entries(storedData.commandIds || {}));
          this.externalTombstones = new Map(Object.entries(storedData.tombstones || {}));
          this.autoLayoutIndex = storedData.autoLayoutIndex ?? this.nodes.size;
          console.log(
            `[CanvasRoom] Restored from DO storage v${version}: ${storedData.nodes.length} nodes, seq ${this.seq}`
          );
        } else {
          this.lastStateSource = 'do_storage';
          console.warn(
            `[CanvasRoom] State version mismatch: stored=${version}, current=${this.CURRENT_STATE_VERSION}`
          );
          // 未来可以添加版本迁移逻辑
          // 现在先加载,假设向后兼容
          this.seq = storedData.seq;
          this.nodes = new Map(storedData.nodes.map(node => [node.id, node]));
          this.processedCommandIds = new Map(Object.entries(storedData.commandIds || {}));
          this.externalTombstones = new Map(Object.entries(storedData.tombstones || {}));
          this.autoLayoutIndex = storedData.autoLayoutIndex ?? this.nodes.size;
        }
      } else {
        // 2. DO Storage 为空,尝试从 R2+D1 迁移(仅一次)
        console.log(`[CanvasRoom] DO storage empty, attempting legacy migration...`);
        
        const snapshot = await loadLatestSnapshot(this.env, canvasId);
        
        if (snapshot) {
          this.lastStateSource = 'legacy_migration';
          this.seq = snapshot.seq;
          this.nodes = new Map(snapshot.nodes.map(node => [node.id, node]));
          this.autoLayoutIndex = this.nodes.size;
          console.log(`[CanvasRoom] Migrated from R2+D1: ${snapshot.nodes.length} nodes, seq ${this.seq}`);
          
          // 立即写入 DO Storage,完成迁移
          await this.state.blockConcurrencyWhile(async () => {
            await this.state.storage.put('state', {
              version: this.CURRENT_STATE_VERSION,
              seq: this.seq,
              nodes: Array.from(this.nodes.values()),
              canvasId: this.canvasId,
              commandIds: Object.fromEntries(this.processedCommandIds),
              tombstones: Object.fromEntries(this.externalTombstones),
              autoLayoutIndex: this.autoLayoutIndex,
              migratedAt: Date.now(),
              migratedFrom: 'R2_D1',
            });
          });
          console.log(`[CanvasRoom] Migration completed, data now in DO storage v${this.CURRENT_STATE_VERSION}`);
        } else {
          this.lastStateSource = 'empty';
          console.log(`[CanvasRoom] No legacy data found, starting fresh`);
          this.autoLayoutIndex = 0;
        }
      }
      
      this.stateLoaded = true;
    } catch (error) {
      this.lastStateSource = 'unknown';
      console.error(`[CanvasRoom] Error loading state:`, error);
    }

    // 确保在 D1 中有记录(用于管理面板列表)
    try {
      await this.ensureD1RecordWithRetry(3);
    } catch (error) {
      console.warn(`[CanvasRoom] Failed to ensure D1 record:`, error);
      // 不阻塞初始化流程
    }

    // 启动定期持久化(防止重复启动)
    this.startFlushTimer();
  }

  /**
   * 确保 D1 中有该房间的记录(用于管理面板)
   * 增强版本: 包含结果验证和详细日志
   */
  private async ensureD1Record(): Promise<void> {
    if (!this.canvasId) return;

    // 如果已经确保过,跳过(避免重复写入)
    if (this.d1RecordEnsured) {
      return;
    }

    this.d1WriteAttempts++;
    
    try {
      // 检查是否已存在
      const existing = await this.env.DB.prepare(
        'SELECT id FROM canvases WHERE id = ?'
      )
        .bind(this.canvasId)
        .first();

      if (!existing) {
        // 不存在,创建新记录
        const result = await this.env.DB.prepare(
          'INSERT INTO canvases (id, title, latest_seq, created_at, updated_at) VALUES (?, ?, ?, unixepoch(), unixepoch())'
        )
          .bind(this.canvasId, this.canvasId, this.seq)
          .run();
        
        // 验证写入是否成功
        if (!result.success) {
          throw new Error(`D1 insert failed: ${JSON.stringify(result)}`);
        }
        
        console.log(`[CanvasRoom] ✅ Created D1 record for room ${this.canvasId} (seq: ${this.seq})`);
      } else {
        // 已存在,更新 updated_at
        const result = await this.env.DB.prepare(
          'UPDATE canvases SET updated_at = unixepoch(), latest_seq = ? WHERE id = ?'
        )
          .bind(this.seq, this.canvasId)
          .run();
        
        // 验证更新是否成功
        if (!result.success) {
          throw new Error(`D1 update failed: ${JSON.stringify(result)}`);
        }
        
        console.log(`[CanvasRoom] ✅ Updated D1 record for room ${this.canvasId} (seq: ${this.seq})`);
      }
      
      // 标记已确保,避免重复调用
      this.d1RecordEnsured = true;
    } catch (error) {
      this.d1WriteFailures++;
      
      // 记录详细错误信息
      console.error(`[CanvasRoom] ❌ Error ensuring D1 record for ${this.canvasId}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        canvasId: this.canvasId,
        seq: this.seq,
        attempts: this.d1WriteAttempts,
        failures: this.d1WriteFailures,
      });
      throw error;
    }
  }

  /**
   * 带重试机制的 D1 记录确保方法
   * 最多重试 3 次,使用指数退避策略
   */
  private async ensureD1RecordWithRetry(maxRetries: number = 3): Promise<void> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await this.ensureD1Record();
        return; // 成功则返回
      } catch (error) {
        const isLastAttempt = attempt === maxRetries - 1;
        
        console.warn(
          `[CanvasRoom] D1 record attempt ${attempt + 1}/${maxRetries} failed for ${this.canvasId}:`,
          error instanceof Error ? error.message : String(error)
        );
        
        if (isLastAttempt) {
          // 最后一次重试失败,记录错误但不阻塞流程
          console.error(
            `[CanvasRoom] ❌ Failed to ensure D1 record after ${maxRetries} attempts for ${this.canvasId}`
          );
          return;
        }
        
        // 等待后重试 (指数退避: 1s, 2s, 3s)
        const delayMs = 1000 * (attempt + 1);
        console.log(`[CanvasRoom] Retrying D1 record creation in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        // 重置标志以允许重试
        this.d1RecordEnsured = false;
      }
    }
  }

  /**
   * 处理客户端加入
   */
  private async handleJoin(ws: WebSocket, message: JoinMessage): Promise<void> {
    const { userId, userName, lastSeq, invisible } = message;

    const activeUsers = new Set(Array.from(this.connections.values()).map((info) => info.userId));
    if (activeUsers.size >= this.maxRoomUsers && !activeUsers.has(userId)) {
      this.send(ws, {
        type: MessageType.ERROR,
        error: 'Room is full',
        code: 'ROOM_FULL',
      });
      ws.close(1013, 'Room full');
      return;
    }

    // 注册连接
    const now = Date.now();
    this.lastConnectionAt = now;
    this.connections.set(ws, {
      userId,
      userName,
      joinedAt: now,
      lastActiveAt: now,
      lastUserActionAt: now, // 初始化用户操作时间
      invisible: invisible || false,
    });
    
    // 停止空房间检查(有新连接了)
    this.stopEmptyRoomCheck();

    // 只有非隐形用户才添加到 presence
    if (!invisible) {
      this.presences.set(userId, {
        userId,
        userName,
        lastUpdate: Date.now(),
      });
    }

    console.log(
      `[CanvasRoom] User ${userId} joined canvas ${this.canvasId} (state source: ${this.lastStateSource}, invisible: ${invisible || false})`
    );

    // 发送完整状态同步
    const syncMessage: SyncStateMessage = {
      type: MessageType.SYNC_STATE,
      seq: this.seq,
      nodes: Array.from(this.nodes.values()),
      presences: Object.fromEntries(this.presences),
      lockedNodes: Object.fromEntries(this.lockedNodes),
    };
    
    this.send(ws, syncMessage);

    // 只有非隐形用户才广播加入消息
    if (!invisible) {
      this.broadcastPresenceUpdate(userId, this.presences.get(userId)!);
    }

    // 启动空闲检查(如果是第一个连接)
    if (this.connections.size === 1) {
      this.startIdleCheck();
      
      // 第一个用户加入时,立即确保 D1 记录存在(带重试)
      // 这样管理面板刷新时就能立即看到这个房间
      if (!this.d1RecordEnsured) {
        this.ensureD1RecordWithRetry(3).catch(error => {
          console.warn(`[CanvasRoom] Failed to ensure D1 record on first join:`, error);
          // 不阻塞用户加入
        });
      }
    }
  }

  /**
   * 处理客户端消息
   */
  private async handleMessage(ws: WebSocket, message: ClientMessage): Promise<void> {
    const conn = this.connections.get(ws);
    if (!conn) return;

    const now = Date.now();
    // 更新最后活动时间(任何消息)
    conn.lastActiveAt = now;
    
    // 只有用户主动操作才更新 lastUserActionAt
    const userActionTypes = ['create_node', 'delete_node', 'update_node', 'update_nodes', 
                             'drag_start', 'drag_move', 'drag_end', 'lock', 'unlock',
                             'user_activity']; // 包括用户活动通知
    if (userActionTypes.includes(message.type)) {
      conn.lastUserActionAt = now;
    }

    switch (message.type) {
      case 'user_activity':
        // 用户活动通知,只更新时间戳,不需要其他处理
        return;
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
      type: MessageType.NODE_CREATED,
      seq: this.seq,
      node,
      tempId: message.tempId,
    };

    this.broadcast(response);
    this.markDirty();
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
      type: MessageType.NODE_DELETED,
      seq: this.seq,
      nodeId,
    };

    this.broadcast(response);
    this.markDirty();
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

    // 新增: 如果节点被锁定且不是锁定者,拒绝更新
    if (this.lockedNodes.has(nodeId) && this.lockedNodes.get(nodeId) !== userId) {
      console.warn(`[CanvasRoom] User ${userId} tried to update locked node ${nodeId}`);
      const conn = Array.from(this.connections.entries()).find(([_, info]) => info.userId === userId);
      if (conn) {
        this.sendError(conn[0], `Node ${nodeId} is locked by another user`, 'NODE_LOCKED');
      }
      return;
    }

    // 合并更新
    Object.assign(node, updates);
    this.seq++;

    const response: NodeUpdatedMessage = {
      type: MessageType.NODE_UPDATED,
      seq: this.seq,
      nodeId,
      updates,
      userId, // 保留 userId,让客户端可以过滤
    };

    this.broadcast(response);
    this.markDirty();
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
      type: MessageType.NODES_UPDATED,
      seq: this.seq,
      updates: applied,
    };

    this.broadcast(response);
    this.markDirty();
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
      type: MessageType.NODE_LOCKED,
      nodeId,
      userId,
    });

    // 广播位置更新
    this.broadcast({
      type: MessageType.NODE_UPDATED,
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
    
    this.markDirty();
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

    // 广播位置更新（包含 userId 信息，让客户端可以过滤自己的更新）
    this.broadcast({
      type: MessageType.NODE_UPDATED,
      seq: this.seq,
      nodeId,
      updates: { position },
      userId, // 添加 userId，让客户端知道是谁在拖动
    });
    
    this.markDirty();
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
      type: MessageType.NODE_UNLOCKED,
      nodeId,
    });

    this.broadcast({
      type: MessageType.NODE_UPDATED,
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

    this.markDirty();
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
   * 更新 presence
   */
  private async handleUpdatePresence(userId: string, message: UpdatePresenceMessage): Promise<void> {
    const presence = this.presences.get(userId);
    if (!presence) {
      // 隐形用户没有 presence,直接返回
      return;
    }

    // 合并更新
    Object.assign(presence, message.presence, {
      lastUpdate: Date.now(),
    });

    // 广播 presence 更新
    this.broadcastPresenceUpdate(userId, presence);
  }

  /**
   * 处理外部命令
   */
  private async handleExternalCommand(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const canvasId = url.searchParams.get('canvasId');
    if (!canvasId) {
      return new Response(JSON.stringify({ error: 'Missing canvasId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!this.canvasId) {
      await this.initialize(canvasId);
    } else if (this.canvasId !== canvasId) {
      return new Response(JSON.stringify({ error: 'CanvasId mismatch' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const bodyText = await request.text();
    const parsed = parseExternalCommand(bodyText);
    if (!parsed.ok || !parsed.command) {
      console.warn(`[CanvasRoom] Invalid external command: ${parsed.error || 'Invalid command'}`);
      return new Response(JSON.stringify({ error: parsed.error || 'Invalid command' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(
      `[CanvasRoom] External command received id=${parsed.command.id} source=${parsed.command.source} type=${parsed.command.type} nodes=${parsed.command.payload.nodes.length}`
    );

    const result = this.applyExternalCommand(parsed.command);
    console.log(
      `[CanvasRoom] External command result id=${parsed.command.id} status=${result.status} created=${result.created} updated=${result.updated} deleted=${result.deleted} ignored=${result.ignored} seq=${result.seq}`
    );
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * 处理断开连接
   */
  private handleDisconnect(ws: WebSocket): void {
    const conn = this.connections.get(ws);
    if (!conn) return;

    const { userId, invisible } = conn;
    console.log(`[CanvasRoom] User ${userId} disconnected from canvas ${this.canvasId} (invisible: ${invisible || false})`);

    // 释放该用户锁定的所有节点
    for (const [nodeId, lockUserId] of this.lockedNodes.entries()) {
      if (lockUserId === userId) {
        this.lockedNodes.delete(nodeId);
        this.broadcast({
          type: MessageType.NODE_UNLOCKED,
          nodeId,
        });
      }
    }

    // 移除连接
    this.connections.delete(ws);

    // 检查是否还有该用户的其他连接
    const hasOtherConnections = Array.from(this.connections.values())
      .some(info => info.userId === userId);

    if (!hasOtherConnections && !invisible) {
      // 只有非隐形用户才移除 presence 并广播
      this.presences.delete(userId);
      this.broadcastPresenceUpdate(userId, null);
    }

    // 如果没有连接了，可以考虑保存快照并清理
    if (this.connections.size === 0) {
      console.log(`[CanvasRoom] No more connections, flushing final state`);
      this.flushToStorage('final').catch(console.error); // 立即持久化
      this.stopFlushTimer(); // 停止定时器
      this.stopIdleCheck(); // 停止空闲检查
      this.startEmptyRoomCheck(); // 启动空房间检查
    }
  }

  /**
   * 启动空闲连接检查
   */
  private startIdleCheck(): void {
    if (this.idleCheckTimer) {
      return;
    }

    console.log(`[CanvasRoom] Starting idle check for room ${this.canvasId}`);
    
    // 每60秒检查一次
    this.idleCheckTimer = setInterval(() => {
      const now = Date.now();
      const toClose: WebSocket[] = [];
      
      for (const [ws, info] of this.connections.entries()) {
        const idleTime = now - info.lastUserActionAt;
        if (idleTime > this.idleTimeoutMs) {
          console.log(JSON.stringify({
            event: 'idle_timeout',
            roomId: this.canvasId,
            userId: info.userId,
            idleSeconds: Math.floor(idleTime / 1000),
            timestamp: now,
          }));
          toClose.push(ws);
        }
      }
      
      toClose.forEach(ws => {
        ws.close(4001, 'Idle timeout');
      });
    }, 60000) as unknown as number;
  }

  /**
   * 停止空闲连接检查
   */
  private stopIdleCheck(): void {
    if (this.idleCheckTimer) {
      clearInterval(this.idleCheckTimer);
      this.idleCheckTimer = undefined;
      console.log(`[CanvasRoom] Stopped idle check for room ${this.canvasId}`);
    }
  }

  /**
   * 启动空房间检查
   */
  private startEmptyRoomCheck(): void {
    if (this.emptyRoomTimer) {
      return;
    }
    
    console.log(`[CanvasRoom] Starting empty room check for ${this.canvasId}`);
    
    this.emptyRoomTimer = setTimeout(() => {
      if (this.connections.size === 0) {
        const emptyDuration = Date.now() - this.lastConnectionAt;
        console.log(JSON.stringify({
          event: 'empty_room_shutdown',
          roomId: this.canvasId,
          emptyDurationMs: emptyDuration,
          timestamp: Date.now(),
        }));
        console.log(`[CanvasRoom] Room ${this.canvasId} empty for ${emptyDuration}ms, shutting down`);
        
        // 最终持久化
        this.flushToStorage('final').then(() => {
          // 清理所有定时器
          this.stopAllTimers();
          console.log(`[CanvasRoom] Room ${this.canvasId} cleanup complete`);
        }).catch(console.error);
      }
    }, this.emptyRoomTimeoutMs) as unknown as number;
  }

  /**
   * 停止空房间检查
   */
  private stopEmptyRoomCheck(): void {
    if (this.emptyRoomTimer) {
      clearTimeout(this.emptyRoomTimer);
      this.emptyRoomTimer = undefined;
      console.log(`[CanvasRoom] Stopped empty room check for ${this.canvasId}`);
    }
  }

  /**
   * 停止所有定时器
   */
  private stopAllTimers(): void {
    this.stopFlushTimer();
    this.stopIdleCheck();
    this.stopEmptyRoomCheck();
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
   * 获取详细状态（管理API）
   */
  private handleGetStatus(): Response {
    const now = Date.now();
    const status = {
      roomId: this.canvasId,
      createdAt: this.roomCreatedAt,
      lastConnectionAt: this.lastConnectionAt,
      activeConnections: this.connections.size,
      activeUsers: new Set(Array.from(this.connections.values()).map(c => c.userId)).size,
      nodeCount: this.nodes.size,
      seq: this.seq,
      lockedNodesCount: this.lockedNodes.size,
      presenceCount: this.presences.size,
      lastStateSource: this.lastStateSource,
      idleSeconds: this.connections.size === 0 
        ? Math.floor((now - this.lastConnectionAt) / 1000) 
        : 0,
      connections: Array.from(this.connections.values()).map(conn => ({
        userId: conn.userId,
        userName: conn.userName,
        joinedAt: conn.joinedAt,
        lastActiveAt: conn.lastActiveAt,
        lastUserActionAt: conn.lastUserActionAt,
        idleSeconds: Math.floor((now - conn.lastUserActionAt) / 1000), // 基于用户操作时间
      })),
      // D1 写入指标
      metrics: {
        d1RecordEnsured: this.d1RecordEnsured,
        d1WriteAttempts: this.d1WriteAttempts,
        d1WriteFailures: this.d1WriteFailures,
        d1WriteSuccessRate: this.d1WriteAttempts > 0 
          ? ((this.d1WriteAttempts - this.d1WriteFailures) / this.d1WriteAttempts * 100).toFixed(2) + '%'
          : 'N/A',
      },
    };

    return new Response(JSON.stringify(status), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * 强制关闭房间（管理API）
   */
  private async handleShutdown(): Promise<Response> {
    console.log(`[CanvasRoom] Forced shutdown for room ${this.canvasId}`);
    
    // 关闭所有连接
    for (const ws of this.connections.keys()) {
      ws.close(4003, 'Room shutdown by admin');
    }
    
    // 持久化并清理
    await this.flushToStorage('final');
    this.stopAllTimers();
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * 踢出指定用户（管理API）
   */
  private async handleKickUser(request: Request): Promise<Response> {
    try {
      const body = await request.json<{ userId: string }>();
      if (!body.userId) {
        return new Response(JSON.stringify({ error: 'Missing userId' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      let kicked = 0;
      for (const [ws, info] of this.connections.entries()) {
        if (info.userId === body.userId) {
          ws.close(4004, 'Kicked by admin');
          kicked++;
        }
      }
      
      return new Response(JSON.stringify({ success: true, kicked }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  private applyExternalCommand(command: ExternalCommandEnvelope) {
    const now = Date.now();
    this.pruneCommandIds(now);
    this.pruneTombstones(now);

    if (this.processedCommandIds.has(command.id)) {
      return {
        success: true,
        status: 'duplicate',
        seq: this.seq,
        created: 0,
        updated: 0,
        deleted: 0,
        ignored: 0,
      };
    }

    this.processedCommandIds.set(command.id, now);

    const summary = {
      success: true,
      status: 'applied',
      seq: this.seq,
      created: 0,
      updated: 0,
      deleted: 0,
      ignored: 0,
    };

    const updatesBatch: Array<{ nodeId: string; updates: Partial<CanvasNodeData> }> = [];
    const source = command.source;
    const commandType = command.type === 'upsert_nodes' ? 'update_nodes' : command.type;

    switch (commandType) {
      case 'append_nodes': {
        for (const item of command.payload.nodes) {
          if (!item || typeof item.taskId !== 'string') {
            summary.ignored += 1;
            continue;
          }

          const existingId = this.findNodeIdByTaskId(item.taskId, source);
          if (existingId) {
            summary.ignored += 1;
            continue;
          }

          const nodeId = this.getTaskNodeId(item.taskId);
          const createdNode = this.buildNodeFromTaskItem(item, nodeId, source);
          if (!createdNode) {
            summary.ignored += 1;
            continue;
          }
          this.nodes.set(nodeId, createdNode);
          this.seq += 1;
          summary.created += 1;
          this.broadcast({
            type: MessageType.NODE_CREATED,
            seq: this.seq,
            node: createdNode,
          });
        }
        break;
      }
      case 'update_nodes': {
        for (const item of command.payload.nodes) {
          if (!item || typeof item.taskId !== 'string') {
            summary.ignored += 1;
            continue;
          }

          const existingId = this.findNodeIdByTaskId(item.taskId, source);
          if (!existingId) {
            summary.ignored += 1;
            continue;
          }

          const existing = this.nodes.get(existingId);
          if (!existing) {
            summary.ignored += 1;
            continue;
          }

          const existingRaw = (existing as CanvasNodeData & { raw?: BoardTaskItem }).raw;
          const mergedRaw = this.mergeTaskItem(existingRaw, item);
          if (existingRaw && this.isDeepEqual(existingRaw, mergedRaw)) {
            summary.ignored += 1;
            continue;
          }

          const updates = this.buildTaskItemUpdates(mergedRaw, existing, source);
          if (!updates || Object.keys(updates).length === 0) {
            summary.ignored += 1;
            continue;
          }

          Object.assign(existing, updates);
          updatesBatch.push({ nodeId: existingId, updates });
          summary.updated += 1;
        }
        if (updatesBatch.length > 0) {
          this.seq += 1;
          summary.seq = this.seq;
          this.broadcast({
            type: MessageType.NODES_UPDATED,
            seq: this.seq,
            updates: updatesBatch,
          });
        }
        break;
      }
      case 'delete_nodes': {
        for (const item of command.payload.nodes) {
          if (!item || typeof item.taskId !== 'string') {
            summary.ignored += 1;
            continue;
          }

          const existingId = this.findNodeIdByTaskId(item.taskId, source);
          if (!existingId) {
            summary.ignored += 1;
            continue;
          }

          if (!this.nodes.has(existingId)) {
            summary.ignored += 1;
            continue;
          }

          this.nodes.delete(existingId);
          this.lockedNodes.delete(existingId);
          this.seq += 1;
          summary.deleted += 1;
          this.broadcast({
            type: MessageType.NODE_DELETED,
            seq: this.seq,
            nodeId: existingId,
          });
        }
        break;
      }
      default:
        summary.success = false;
        summary.status = 'unsupported';
        return summary;
    }

    if (summary.created + summary.updated + summary.deleted > 0) {
      summary.seq = this.seq;
      this.markDirty();
    }
    return summary;
  }

  private buildNodeFromTaskItem(item: BoardTaskItem, nodeId: string, source: string): CanvasNodeData | null {
    const normalizedType = this.normalizeTaskMediaType(item.mediaType);
    if (!normalizedType) {
      return null;
    }

    const size = this.getTaskDefaultSize(item, normalizedType);
    const position = this.nextAutoPosition(size);
    const derived = this.buildTaskNodeData(item, normalizedType);

    return ({
      id: nodeId,
      type: normalizedType,
      position,
      size,
      zIndex: 1,
      raw: item,
      taskId: item.taskId,
      rating: item.rating,
      externalId: item.taskId,
      externalSource: source,
      ...derived,
    } as unknown) as CanvasNodeData;
  }

  private buildTaskItemUpdates(
    item: BoardTaskItem,
    existing: CanvasNodeData,
    source: string
  ): Partial<CanvasNodeData> | null {
    const normalizedType = this.resolveTaskNodeType(item.mediaType, existing);
    if (!normalizedType) {
      return null;
    }

    const derived = this.buildTaskNodeData(item, normalizedType);
    const updates: Partial<CanvasNodeData> = {
      raw: item,
      taskId: item.taskId,
      rating: item.rating,
      externalId: item.taskId,
      externalSource: source,
    };

    if (existing.type !== normalizedType) {
      updates.type = normalizedType;
    }

    for (const [key, value] of Object.entries(derived)) {
      if (!this.isDeepEqual((existing as Record<string, unknown>)[key], value)) {
        (updates as Record<string, unknown>)[key] = value;
      }
    }

    return updates;
  }

  private buildTaskNodeData(item: BoardTaskItem, type: NodeType): Partial<CanvasNodeData> {
    const result = item.result ?? undefined;

    switch (type) {
      case NodeType.IMAGE: {
        const url = this.resolveMediaUrlFrom([result?.originImage, result?.compressedImage]) ?? '';
        return { url };
      }
      case NodeType.VIDEO: {
        const url = this.resolveMediaUrlFrom([result?.originVideo, result?.originImage]) ?? '';
        const poster =
          this.resolveCoverUrl(result?.originVideo) ??
          this.resolveCoverUrl(result?.originImage);
        return { url, poster, loop: true, muted: true };
      }
      case NodeType.AUDIO: {
        const url = this.resolveMediaUrl(result?.originAudio) ?? '';
        const title =
          this.resolveTitle(item.parameters?.fileName) ??
          this.resolveTitle(item.title) ??
          '音频文件';
        return { url, title };
      }
      case NodeType.TEXT: {
        const content =
          this.resolveTitle(item.title) ??
          this.resolveTitle(item.parameters?.prompt) ??
          '';
        return { content };
      }
      default:
        return {};
    }
  }

  private normalizeTaskMediaType(mediaType: unknown): NodeType | null {
    if (typeof mediaType !== 'string') {
      return null;
    }
    switch (mediaType.toLowerCase()) {
      case 'image':
        return NodeType.IMAGE;
      case 'video':
        return NodeType.VIDEO;
      case 'audio':
        return NodeType.AUDIO;
      case 'text':
        return NodeType.TEXT;
      default:
        return null;
    }
  }

  private resolveTaskNodeType(mediaType: unknown, existing: CanvasNodeData): NodeType | null {
    const normalized = this.normalizeTaskMediaType(mediaType);
    if (normalized) {
      return normalized;
    }
    return existing.type ?? null;
  }

  private mergeTaskItem(existing: BoardTaskItem | undefined, incoming: BoardTaskItem): BoardTaskItem {
    if (!existing) {
      return incoming;
    }
    return this.deepMerge(existing, incoming) as BoardTaskItem;
  }

  private deepMerge<T>(base: T, patch: T): T {
    if (!base || typeof base !== 'object' || !patch || typeof patch !== 'object') {
      return patch;
    }
    if (Array.isArray(base) && Array.isArray(patch)) {
      return patch as T;
    }
    const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const [key, value] of Object.entries(patch as Record<string, unknown>)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const existingValue = result[key];
        if (existingValue && typeof existingValue === 'object' && !Array.isArray(existingValue)) {
          result[key] = this.deepMerge(existingValue, value);
        } else {
          result[key] = this.deepMerge({}, value);
        }
      } else if (Array.isArray(value)) {
        result[key] = value.slice();
      } else {
        result[key] = value;
      }
    }
    return result as T;
  }

  private getTaskDefaultSize(item: BoardTaskItem, type: NodeType): Size {
    const { nodeWidth, nodeHeight } = this.externalLayoutConfig;
    if (type === NodeType.AUDIO || type === NodeType.TEXT) {
      return { width: nodeWidth, height: 120 };
    }

    const result = item.result ?? undefined;
    const resources =
      type === NodeType.IMAGE
        ? [result?.originImage, result?.compressedImage]
        : [result?.originVideo, result?.originImage];
    const aspectRatio =
      this.resolveAspectRatioFromParameters(item.parameters) ??
      this.resolveAspectRatioFromResources(resources);
    return this.resolveNodeSize(nodeWidth, nodeHeight, aspectRatio);
  }

  private resolveNodeSize(
    nodeWidth: number,
    nodeHeight: number,
    aspectRatio?: number
  ): Size {
    if (!aspectRatio || !Number.isFinite(aspectRatio) || aspectRatio <= 0) {
      return { width: nodeWidth, height: nodeHeight };
    }
    const containerRatio = nodeWidth / nodeHeight;
    if (aspectRatio >= containerRatio) {
      return { width: nodeWidth, height: nodeWidth / aspectRatio };
    }
    return { width: nodeHeight * aspectRatio, height: nodeHeight };
  }

  private resolveMediaUrl(resource?: MediaResourceInfo): string | undefined {
    if (!resource) {
      return undefined;
    }
    if (resource.url) {
      return this.resolveUrl(resource.url);
    }
    return this.resolveUrl(resource.filePath);
  }

  private resolveMediaUrlFrom(resources: Array<MediaResourceInfo | undefined>): string | undefined {
    for (const resource of resources) {
      const url = this.resolveMediaUrl(resource);
      if (url) {
        return url;
      }
    }
    return undefined;
  }

  private resolveCoverUrl(resource?: MediaResourceInfo): string | undefined {
    if (!resource?.coverPath) {
      return undefined;
    }
    return this.resolveUrl(resource.coverPath);
  }

  private resolveUrl(value?: string): string | undefined {
    if (!value) {
      return undefined;
    }
    if (ABSOLUTE_URL_PATTERN.test(value)) {
      return value;
    }
    const trimmedBase = this.externalCdnBaseUrl.endsWith('/')
      ? this.externalCdnBaseUrl.slice(0, -1)
      : this.externalCdnBaseUrl;
    const trimmedPath = value.startsWith('/') ? value.slice(1) : value;
    return `${trimmedBase}/${trimmedPath}`;
  }

  private resolveTitle(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private resolveAspectRatioFromParameters(parameters?: BoardTaskItem['parameters']): number | undefined {
    if (!parameters || typeof parameters !== 'object') {
      return undefined;
    }
    const record = parameters as Record<string, unknown>;
    return this.parseAspectRatio(record.aspectRatio ?? record.aspect_ratio);
  }

  private resolveAspectRatioFromResources(
    resources: Array<MediaResourceInfo | undefined>
  ): number | undefined {
    for (const resource of resources) {
      const width = resource?.width;
      const height = resource?.height;
      if (typeof width === 'number' && typeof height === 'number' && width > 0 && height > 0) {
        return width / height;
      }
    }
    return undefined;
  }

  private parseAspectRatio(value: unknown): number | undefined {
    if (typeof value === 'number') {
      return Number.isFinite(value) && value > 0 ? value : undefined;
    }
    if (typeof value !== 'string') {
      return undefined;
    }
    const match = ASPECT_RATIO_PATTERN.exec(value.trim());
    if (!match) {
      return undefined;
    }
    const width = Number(match[1]);
    const height = Number(match[2]);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      return undefined;
    }
    return width / height;
  }

  private nextAutoPosition(size?: Size): Position {
    const { columns, nodeWidth, nodeHeight, gap, startX, startY } = this.externalLayoutConfig;
    const index = this.autoLayoutIndex;
    const row = Math.floor(index / columns);
    const col = index % columns;
    this.autoLayoutIndex += 1;
    const cellX = startX + col * (nodeWidth + gap);
    const cellY = startY + row * (nodeHeight + gap);
    if (!size) {
      return { x: cellX, y: cellY };
    }
    return {
      x: cellX + (nodeWidth - size.width) / 2,
      y: cellY + (nodeHeight - size.height) / 2,
    };
  }

  private getTaskNodeId(taskId: string): string {
    return `task:${taskId}`;
  }

  private getLegacyExternalNodeId(source: string, taskId: string): string {
    return `ext:${source}:${taskId}`;
  }

  private findNodeIdByTaskId(taskId: string, source?: string): string | null {
    const directId = this.getTaskNodeId(taskId);
    if (this.nodes.has(directId)) {
      return directId;
    }

    if (source) {
      const legacyId = this.getLegacyExternalNodeId(source, taskId);
      if (this.nodes.has(legacyId)) {
        return legacyId;
      }
    }

    for (const [nodeId, node] of this.nodes.entries()) {
      const candidate = this.extractTaskId(node);
      if (candidate === taskId) {
        return nodeId;
      }
    }

    return null;
  }

  private extractTaskId(node: CanvasNodeData): string | null {
    const rawTaskId = (node as CanvasNodeData & { raw?: BoardTaskItem }).raw?.taskId;
    if (typeof rawTaskId === 'string') {
      return rawTaskId;
    }
    const taskId = (node as CanvasNodeData & { taskId?: string }).taskId;
    if (typeof taskId === 'string') {
      return taskId;
    }
    const externalId = (node as CanvasNodeData & { externalId?: string }).externalId;
    if (typeof externalId === 'string') {
      return externalId;
    }
    return null;
  }

  private isDeepEqual(a: unknown, b: unknown): boolean {
    if (Object.is(a, b)) {
      return true;
    }
    if (typeof a !== typeof b) {
      return false;
    }
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object') {
      return false;
    }
    if (Array.isArray(a) || Array.isArray(b)) {
      if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
        return false;
      }
      for (let i = 0; i < a.length; i += 1) {
        if (!this.isDeepEqual(a[i], b[i])) {
          return false;
        }
      }
      return true;
    }
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) {
      return false;
    }
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) {
        return false;
      }
      if (!this.isDeepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
        return false;
      }
    }
    return true;
  }

  private pruneCommandIds(now: number): void {
    const cutoff = now - this.commandIdTtlMs;
    for (const [id, ts] of this.processedCommandIds.entries()) {
      if (ts < cutoff) {
        this.processedCommandIds.delete(id);
      }
    }
  }

  private pruneTombstones(now: number): void {
    const cutoff = now - this.tombstoneTtlMs;
    for (const [id, ts] of this.externalTombstones.entries()) {
      if (ts < cutoff) {
        this.externalTombstones.delete(id);
      }
    }
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
      type: MessageType.PRESENCE_UPDATE,
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
      type: MessageType.ERROR,
      error,
      code,
    });
  }

  /**
   * 标记状态已变更,需要持久化
   */
  private markDirty(): void {
    this.isDirty = true;
  }

  /**
   * 将脏状态持久化到 DO Storage
   * 使用 blockConcurrencyWhile 确保写入原子性
   */
  private async flushToStorage(reason: 'scheduled' | 'final' | 'manual' = 'scheduled'): Promise<void> {
    if (!this.isDirty || !this.canvasId) {
      return;
    }

    try {
      const now = Date.now();
      this.pruneCommandIds(now);
      this.pruneTombstones(now);
      console.log(
        `[CanvasRoom] Flushing state (${reason}) for canvas ${this.canvasId} v${this.CURRENT_STATE_VERSION} at seq ${this.seq}`
      );
      
      // 使用 blockConcurrencyWhile 保证原子性写入
      await this.state.blockConcurrencyWhile(async () => {
        await this.state.storage.put('state', {
          version: this.CURRENT_STATE_VERSION,
          seq: this.seq,
          nodes: Array.from(this.nodes.values()),
          canvasId: this.canvasId,
          commandIds: Object.fromEntries(this.processedCommandIds),
          tombstones: Object.fromEntries(this.externalTombstones),
          autoLayoutIndex: this.autoLayoutIndex,
          lastFlushedAt: Date.now(),
        });
      });

      this.isDirty = false;
      console.log(
        `[CanvasRoom] Flush completed successfully for canvas ${this.canvasId} v${this.CURRENT_STATE_VERSION} at seq ${this.seq}`
      );

      // 同时更新 D1 记录(不阻塞主流程)
      // 如果 D1 记录还未创建,先尝试创建
      if (!this.d1RecordEnsured) {
        this.ensureD1RecordWithRetry(3).catch(err => {
          console.warn(`[CanvasRoom] Failed to ensure D1 record during flush:`, err);
        });
      } else {
        this.updateD1Record().catch(err => {
          console.warn(`[CanvasRoom] Failed to update D1 record:`, err);
        });
      }
    } catch (error) {
      console.error(`[CanvasRoom] Error flushing state:`, error);
      // 保持 isDirty = true,下次定时器会重试
    }
  }

  /**
   * 更新 D1 中的记录
   */
  private async updateD1Record(): Promise<void> {
    if (!this.canvasId) return;

    try {
      await this.env.DB.prepare(
        'UPDATE canvases SET updated_at = unixepoch(), latest_seq = ? WHERE id = ?'
      )
        .bind(this.seq, this.canvasId)
        .run();
    } catch (error) {
      // 静默失败,不影响主流程
      console.warn(`[CanvasRoom] Failed to update D1:`, error);
    }
  }

  /**
   * 启动定期持久化定时器
   * 防止重复启动 - 关键安全修复
   */
  private startFlushTimer(): void {
    // 防止创建多个定时器
    if (this.flushTimer) {
      console.log(`[CanvasRoom] Flush timer already running, skipping`);
      return;
    }

    console.log(`[CanvasRoom] Starting flush timer (${this.flushInterval}ms interval)`);
    
    this.flushTimer = setInterval(async () => {
      await this.flushToStorage('scheduled');
    }, this.flushInterval) as unknown as number;
  }

  /**
   * 停止定期持久化定时器
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
      console.log(`[CanvasRoom] Flush timer stopped`);
    }
  }

  /**
   * 检查是否需要保存快照 (已废弃,保留用于兼容)
   */
  private async checkSnapshot(): Promise<void> {
    // 已废弃: 现在使用 DO Storage + markDirty + flushToStorage
    // 保留空实现以防其他地方调用
  }

  /**
   * 立即保存快照 (已废弃,保留用于兼容)
   */
  private async saveSnapshotNow(): Promise<void> {
    // 已废弃: 现在使用 flushToStorage
    // 保留空实现以防其他地方调用
  }

  /**
   * 启动定期快照 (已废弃)
   */
  private startPeriodicSnapshot(): void {
    // 已废弃: 现在使用 startFlushTimer
  }

  /**
   * Alarm 处理 (已废弃)
   */
  async alarm(): Promise<void> {
    // 已废弃: 现在使用定期 flush 机制
  }
}
