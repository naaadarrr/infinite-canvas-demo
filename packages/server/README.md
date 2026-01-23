# Infinite Canvas Server

基于 Cloudflare Workers、Durable Objects、D1 和 R2 的无限画布多人协同后端服务。

## 功能特性

- ✨ **实时协同**：基于 WebSocket 的多人实时编辑
- 🔒 **节点锁定**：防止多人同时编辑同一节点
- 👥 **Presence 显示**：实时显示其他用户的光标和选择状态
- 💾 **自动快照**：定期保存画布状态到 R2 和 D1
- 🚀 **边缘部署**：基于 Cloudflare 边缘网络，低延迟
- 🔄 **状态恢复**：断线重连后自动恢复画布状态

## 技术栈

- **Cloudflare Workers**：无服务器计算平台
- **Durable Objects**：有状态的协调服务，每个画布一个 DO 实例
- **D1**：Serverless SQL 数据库，存储画布元数据
- **R2**：对象存储，保存画布快照
- **WebSocket**：实时双向通信

## 项目结构

```
packages/server/
├── src/
│   ├── index.ts          # Worker 入口，HTTP 和 WebSocket 路由
│   ├── canvasRoom.ts     # CanvasRoom Durable Object 实现
│   ├── types.ts          # TypeScript 类型定义
│   ├── snapshot.ts       # R2 和 D1 快照持久化模块
│   └── utils/
│       └── auth.ts       # 简单鉴权工具
├── d1/
│   └── schema.sql        # D1 数据库表结构
├── package.json
├── tsconfig.json
├── wrangler.toml         # Cloudflare 配置
└── README.md
```

## 快速开始

### 1. 安装依赖

```bash
cd packages/server
pnpm install
```

### 2. 创建 D1 数据库

```bash
pnpm d1:create
```

这会创建一个名为 `canvas_db` 的数据库，并输出 `database_id`。将这个 ID 填入 `wrangler.toml` 中：

```toml
[[d1_databases]]
binding = "DB"
database_name = "canvas_db"
database_id = "<your-database-id-here>"
```

### 3. 应用数据库迁移

创建 `d1/migrations/0001_init.sql` 文件，内容为 `d1/schema.sql`，然后运行：

```bash
pnpm d1:migrate
```

### 4. 启动本地开发服务器

```bash
pnpm dev
```

这会启动 Wrangler 本地开发服务器，默认在 `http://127.0.0.1:8787`。

本地模式会自动创建：
- 本地 Durable Objects 实例
- 本地 D1 数据库（SQLite）
- 本地 R2 存储

所有数据会保存在 `.wrangler/state` 目录中。

## API 文档

### HTTP API

#### 获取画布列表

```http
GET /api/canvas
```

#### 创建画布

```http
POST /api/canvas
Content-Type: application/json

{
  "title": "My Canvas"
}
```

#### 获取画布详情

```http
GET /api/canvas/:id
```

#### 删除画布

```http
DELETE /api/canvas/:id
Authorization: Bearer <token>
```

### WebSocket API

#### 连接

```javascript
const ws = new WebSocket('ws://127.0.0.1:8787/ws/canvas/:id?token=<token>');
```

#### 消息格式

所有消息都是 JSON 格式。

**客户端 -> 服务器**

```typescript
// 加入画布
{
  "type": "join",
  "userId": "user123",
  "userName": "John Doe",
  "lastSeq": 0  // 可选，用于增量同步
}

// 创建节点
{
  "type": "create_node",
  "tempId": "temp_123",  // 可选
  "nodeData": {
    "type": "text",
    "position": { "x": 100, "y": 200 },
    "size": { "width": 200, "height": 100 },
    "content": "Hello"
  }
}

// 开始拖拽
{
  "type": "drag_start",
  "nodeId": "node_123",
  "position": { "x": 100, "y": 200 }
}

// 拖拽移动
{
  "type": "drag_move",
  "nodeId": "node_123",
  "position": { "x": 150, "y": 250 }
}

// 结束拖拽
{
  "type": "drag_end",
  "nodeId": "node_123",
  "position": { "x": 200, "y": 300 }
}

// 更新 presence
{
  "type": "update_presence",
  "presence": {
    "cursor": { "x": 100, "y": 200 },
    "viewport": { "x": 0, "y": 0, "zoom": 1 },
    "selectedNodes": ["node_123"]
  }
}
```

**服务器 -> 客户端**

```typescript
// 状态同步
{
  "type": "sync_state",
  "seq": 42,
  "nodes": [...],
  "presences": {...},
  "lockedNodes": {...}
}

// 节点创建
{
  "type": "node_created",
  "seq": 43,
  "node": {...},
  "tempId": "temp_123"
}

// 节点更新
{
  "type": "node_updated",
  "seq": 44,
  "nodeId": "node_123",
  "updates": {
    "position": { "x": 200, "y": 300 }
  }
}

// 节点锁定
{
  "type": "node_locked",
  "nodeId": "node_123",
  "userId": "user456"
}

// Presence 更新
{
  "type": "presence_update",
  "userId": "user456",
  "presence": {...}
}
```

## 配置

在 `wrangler.toml` 中可以配置：

```toml
[vars]
TOKEN_SECRET = "your-secret-key"
SNAPSHOT_INTERVAL = "30000"       # 快照间隔（毫秒）
SNAPSHOT_OP_THRESHOLD = "50"      # 操作数阈值
```

## 部署

### 部署到 Cloudflare

1. 登录 Cloudflare：

```bash
wrangler login
```

2. 创建生产环境 D1 数据库：

```bash
wrangler d1 create canvas_db
```

将输出的 `database_id` 更新到 `wrangler.toml`。

3. 在 Cloudflare 控制台创建 R2 存储桶 `canvas-snapshots`。

4. 应用数据库迁移：

```bash
pnpm d1:migrate:prod
```

5. 部署 Worker：

```bash
pnpm deploy
```

部署成功后会输出 Worker 的 URL，例如 `https://infinite-canvas-server.<your-subdomain>.workers.dev`。

### 环境变量

在生产环境中，建议在 Cloudflare 控制台设置环境变量：

- `TOKEN_SECRET`：JWT 密钥或其他认证密钥
- `SNAPSHOT_INTERVAL`：快照间隔（默认 30000ms）
- `SNAPSHOT_OP_THRESHOLD`：快照操作阈值（默认 50）

## 开发建议

### 本地测试

1. 启动后端：`pnpm dev`
2. 启动前端（在根目录）：`pnpm dev`
3. 前端会通过 `.env.local` 中的 `NEXT_PUBLIC_API_BASE` 连接到本地后端

### 调试

查看 Worker 日志：

```bash
pnpm tail
```

查看本地 D1 数据：

```bash
wrangler d1 execute canvas_db --local --command "SELECT * FROM canvases"
```

### 性能优化

- **消息节流**：客户端应对 `drag_move` 和 `update_presence` 消息进行节流
- **批量更新**：DO 可以将多个更新合并为一个广播
- **增量同步**：客户端重连时可以只同步差异部分

## 架构设计

### 权威状态模型

每个画布由一个 Durable Object 实例管理，作为该画布的权威状态机：

1. 所有节点操作必须经过 DO 验证和排序
2. DO 为每个操作分配递增的序列号（seq）
3. 客户端进行乐观更新，但以 DO 的广播为准

### 快照策略

DO 会在以下情况保存快照：

1. 操作数达到阈值（默认 50 次）
2. 时间间隔达到阈值（默认 30 秒）
3. 所有客户端断开连接时

快照包含：
- 完整的节点列表
- 当前序列号
- 时间戳

### 冷启动恢复

DO 实例启动时：

1. 从 D1 读取最新快照的 key
2. 从 R2 加载快照内容
3. 恢复节点状态和序列号

## 故障排除

### Durable Object 未启动

确保 `wrangler.toml` 中正确配置了 DO 绑定和迁移。

### D1 数据库连接失败

检查 `database_id` 是否正确填写，并确保已运行迁移。

### WebSocket 连接失败

检查 token 是否正确传递，以及 CORS 配置。

## 后续扩展

- [ ] 完善的权限系统（owner/editor/viewer）
- [ ] JWT 认证
- [ ] 操作历史和撤销/重做
- [ ] 富文本编辑（集成 Yjs）
- [ ] 画布分片（支持超大画布）
- [ ] 版本历史
- [ ] 协作光标动画

## 许可证

MIT
