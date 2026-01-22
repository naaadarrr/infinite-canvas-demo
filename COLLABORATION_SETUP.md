# 无限画布协同功能设置指南

本指南将帮助您快速启动和测试无限画布的多人协同编辑功能。

## 📋 前置要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Cloudflare 账户（仅用于生产部署）

## 🚀 快速开始

### 1. 安装依赖

在项目根目录运行：

```bash
# 安装根目录依赖
pnpm install

# 安装后端依赖
cd packages/server
pnpm install
cd ../..
```

### 2. 配置后端

#### 2.1 创建 D1 数据库

```bash
cd packages/server
pnpm d1:create
```

这会创建一个本地 D1 数据库。记录输出的 `database_id`，并填入 `packages/server/wrangler.toml`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "canvas_db"
database_id = "填写你的-database-id"
```

#### 2.2 应用数据库迁移

```bash
pnpm d1:migrate
```

这会创建必要的数据库表。

### 3. 配置前端

创建 `apps/demo/.env.local` 文件（复制 `.env.local.example`）：

```env
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8787
NEXT_PUBLIC_WS_BASE=ws://127.0.0.1:8787
NEXT_PUBLIC_USER_TOKEN=user_dev_user
```

### 4. 启动开发环境

#### 方案 A：同时启动前后端（推荐）

在项目根目录运行：

```bash
pnpm dev:all
```

这会同时启动：
- 后端 Worker（端口 8787）
- 前端 Demo（端口 3000）

#### 方案 B：分别启动

**终端 1 - 启动后端：**

```bash
cd packages/server
pnpm dev
```

**终端 2 - 启动前端：**

```bash
cd apps/demo
pnpm dev
```

### 5. 测试协同功能

1. 打开浏览器访问 `http://localhost:3000`
2. 打开第二个浏览器窗口（或无痕模式）也访问 `http://localhost:3000`
3. 在任一窗口中拖动节点，观察另一个窗口的实时同步
4. 测试以下功能：
   - ✅ 节点拖拽同步
   - ✅ 节点锁定（一个用户拖拽时，其他用户无法拖拽同一节点）
   - ✅ 多用户光标显示（如果前端实现了）
   - ✅ 断线重连后状态恢复

## 📚 架构说明

### 后端组件

```
packages/server/
├── src/
│   ├── index.ts          # Worker 入口，HTTP/WS 路由
│   ├── canvasRoom.ts     # Durable Object，管理画布状态
│   ├── types.ts          # 类型定义
│   ├── snapshot.ts       # 快照持久化
│   └── utils/auth.ts     # 简单鉴权
├── d1/
│   ├── schema.sql        # 数据库结构
│   └── migrations/       # 迁移文件
└── wrangler.toml         # Cloudflare 配置
```

### 数据流

```
客户端 A                     Durable Object                  客户端 B
   │                              │                              │
   ├─── drag_start ──────────────>│                              │
   │                              ├─── 验证 & 锁定节点            │
   │<──── node_locked ────────────┤                              │
   │                              ├──── node_locked ────────────>│
   │                              │                              │
   ├─── drag_move ───────────────>│                              │
   │                              ├─── 更新位置                  │
   │<──── node_updated ───────────┤                              │
   │                              ├──── node_updated ───────────>│
   │                              │                              │
   ├─── drag_end ────────────────>│                              │
   │                              ├─── 释放锁定                  │
   │<──── node_unlocked ──────────┤                              │
   │                              ├──── node_unlocked ──────────>│
   │                              │                              │
   │                              ├─── 保存快照到 R2/D1         │
```

## 🔧 API 参考

### HTTP API

#### 创建画布

```bash
curl -X POST http://127.0.0.1:8787/api/canvas \
  -H "Content-Type: application/json" \
  -d '{"title":"测试画布"}'
```

#### 获取画布列表

```bash
curl http://127.0.0.1:8787/api/canvas
```

#### 获取画布详情

```bash
curl http://127.0.0.1:8787/api/canvas/{canvasId}
```

### WebSocket API

#### 连接

```javascript
const ws = new WebSocket('ws://127.0.0.1:8787/ws/canvas/{canvasId}?token=user_dev_user');

ws.onopen = () => {
  // 发送 JOIN 消息
  ws.send(JSON.stringify({
    type: 'join',
    userId: 'user123',
    userName: 'John Doe',
    lastSeq: 0
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('收到消息:', message);
};
```

#### 消息类型

**客户端发送：**

- `join` - 加入画布
- `create_node` - 创建节点
- `update_node` - 更新节点
- `delete_node` - 删除节点
- `drag_start` - 开始拖拽
- `drag_move` - 拖拽移动
- `drag_end` - 结束拖拽
- `update_presence` - 更新光标/选择状态

**服务器发送：**

- `sync_state` - 完整状态同步
- `node_created` - 节点创建通知
- `node_updated` - 节点更新通知
- `node_deleted` - 节点删除通知
- `node_locked` - 节点锁定通知
- `node_unlocked` - 节点解锁通知
- `presence_update` - 用户状态更新

## 🐛 常见问题

### 1. D1 数据库创建失败

**问题：** `wrangler d1 create` 命令失败

**解决方案：**
- 确保已安装最新版本的 wrangler：`npm install -g wrangler@latest`
- 检查网络连接
- 使用 `--local` 标志创建本地数据库用于开发

### 2. WebSocket 连接失败

**问题：** 前端无法连接到 WebSocket

**解决方案：**
- 确认后端已启动（`http://127.0.0.1:8787` 可访问）
- 检查 `.env.local` 中的 URL 配置
- 查看浏览器控制台的错误信息
- 确保 token 格式正确（`user_*` 或 `share_*`）

### 3. 节点状态不同步

**问题：** 多个窗口中节点位置不一致

**解决方案：**
- 打开浏览器开发者工具，查看 WebSocket 消息
- 检查 Wrangler 控制台日志：`pnpm --filter @tc/infinite-server tail`
- 确保客户端正确处理 `sync_state` 消息

### 4. 快照保存失败

**问题：** R2 写入错误

**解决方案：**
- 本地开发时，R2 会自动模拟，无需手动创建
- 生产环境需要在 Cloudflare 控制台创建 R2 bucket
- 检查 `wrangler.toml` 中的 bucket 名称配置

## 📦 部署到生产环境

### 1. 登录 Cloudflare

```bash
cd packages/server
wrangler login
```

### 2. 创建生产环境资源

**创建 D1 数据库：**

```bash
wrangler d1 create canvas_db
```

将输出的 `database_id` 更新到 `wrangler.toml`。

**创建 R2 存储桶：**

在 Cloudflare 控制台创建名为 `canvas-snapshots` 的 R2 bucket。

### 3. 应用数据库迁移

```bash
pnpm d1:migrate:prod
```

### 4. 部署 Worker

```bash
pnpm deploy
```

### 5. 更新前端配置

将 `apps/demo/.env.production` 中的 API 地址改为你的 Worker URL：

```env
NEXT_PUBLIC_API_BASE=https://infinite-canvas-server.your-subdomain.workers.dev
NEXT_PUBLIC_WS_BASE=wss://infinite-canvas-server.your-subdomain.workers.dev
```

### 6. 部署前端

前端可以部署到 Vercel、Netlify 或其他平台：

```bash
cd apps/demo
pnpm build
```

## 🔐 安全建议

生产环境建议：

1. **启用真正的鉴权**：将 `src/utils/auth.ts` 中的简单 token 替换为 JWT
2. **配置权限系统**：使用 `canvas_members` 表管理权限
3. **设置 CORS**：在 Worker 中限制允许的来源
4. **使用环境变量**：通过 Cloudflare 控制台设置敏感配置
5. **启用速率限制**：防止滥用

## 📊 性能优化

- **消息节流**：客户端应节流 `drag_move`（~30fps）和 `update_presence`（~10fps）
- **批量更新**：DO 可以合并多个更新为一次广播
- **增量同步**：重连时只同步差异（使用 `lastSeq`）
- **快照策略**：根据画布大小调整快照阈值

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT
