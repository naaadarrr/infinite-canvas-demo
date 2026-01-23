# 无限画布多人协同编辑需求（完整版本）

## 1. 背景与目标

现有前端已用 **React** 和 **React Flow** 实现基础的无限画布组件（`InfiniteCanvas.tsx`），支持节点的渲染、尺寸同步、拖拽移动、吸附对齐等功能，并引入了自定义的 Image/Video/Audio/Text 节点。在此基础上需要添加“多人实时协作”能力，使多个用户可以同时查看和控制同一画布上的节点，并保证状态的一致性和持久化。MVP 目标是：

- 多个浏览器窗口同时打开同一画布时，节点的位置和选择状态能够实时同步；
- 用户可以创建节点、选中节点并拖拽移动，其他用户可以看到对应的变化；
- 支持显示其他用户的光标、正在拖拽的节点等 presence 信息；
- 网络抖动或刷新页面后，节点最终状态能够恢复；
- 优先支持节点移动，未来可扩展节点添加、删除、文本编辑等。

为了降低后端复杂度，协同逻辑采用中心化权威模型：**Cloudflare Durable Object（DO）** 作为单个画布的权威状态机，通过 WebSocket 管理所有客户端的连接并广播消息；Cloudflare D1 用于存储画布元数据、最新快照索引等结构化信息；Cloudflare R2 用于存储快照文件。Cloudflare 文档指出 Durable Objects 适合创建协同编辑工具、实时交互等需要协调状态的应用【552808641505565†L107-L121】；D1 是 Cloudflare 提供的托管的无服务器 SQL 数据库【303085997821412†L100-L115】；R2 是用于存放大量非结构化数据的对象存储【277728512498823†L137-L151】。

## 2. 总体架构

```
Client (Next.js + React Flow + Recoil) ────── WebSocket ───────────>  Worker  ──────┬─→ CanvasRoomDO (Durable Object)
    │                                 (token验证/路由)              │        │
    │                                                              │        └─→ D1 (存储画布元数据/快照索引)
    │                                                              │
    └─HTTP API (创建/获取画布)                                      └─→ R2 (存储快照 JSON)
```

- **客户端**：使用 React Flow 渲染节点和边，通过 Recoil 管理本地 UI 状态和协同状态。拖拽事件根据节点 `id`、坐标发送 **语义操作消息**（`drag_start`/`drag_move`/`drag_end`），并乐观更新 UI。
- **Worker（HTTP + WebSocket）**：负责鉴权（简单实现可以用分享链接或固定 token）、为每个 `canvasId` 找到对应 DO，并把 WebSocket 连接转发给 DO；提供 REST API 创建画布、获取初始状态等。
- **Durable Object（CanvasRoomDO）**：每个画布对应一个 DO 实例，它维护权威的节点集合、presence 信息、当前序号 `seq`，处理来自客户端的操作（移动节点、创建节点等）、排序并广播给其他连接，控制节点锁定以及快照持久化。Cloudflare 文档指出 Durable Objects 结合计算和存储，可用作需要协调多个客户端状态的构建块【552808641505565†L134-L147】。
- **D1（Serverless SQL DB）**：存储画布列表、成员信息（可选）、快照指针（`latest_snapshot_key`、`latest_seq` 等），持久化 DO 的元数据。D1 具备 SQLite 兼容 SQL 语义【303085997821412†L100-L115】。
- **R2（对象存储）**：用于保存画布的快照 JSON，大对象便于持久化和后续备份。R2 适合存放大量非结构化数据【277728512498823†L137-L151】。

## 3. 需求细化

### 3.1 功能需求

1. **节点模型**  
   - 每个节点包含：`id`、`type`（image/video/audio/text/…）、`position: { x, y }`、`size: { width, height }`、`zIndex`、自定义内容（标题、媒体 URL 等）。
   - 初次加载节点列表从 API 获取，并注入到 React Flow；节点大小由 `InfiniteCanvas.tsx` 中 `syncNodeDataSize` 函数同步。 

2. **节点移动**  
   - 客户端拖拽节点时，首先在本地更新位置（乐观 UI），并通过 WebSocket 发送 `drag_start` / `drag_move` / `drag_end` 消息。 
   - Durable Object 根据节点 `id` 和操作顺序更新权威状态，广播 `node_set_pos` 给所有连接；客户端收到后更新 Recoil 中的节点位置。 
   - 为避免多人同时拖动同一节点造成抖动，引入 **拖拽锁**：当 A 发送 `drag_start(n1)`，DO 标记 n1 已被 A 锁定并广播锁定状态；其他客户端拖 n1 时应提示“被锁定”并拒绝本地拖拽。`drag_end` 后释放锁。

3. **节点创建/删除（可选）**  
   - MVP 可先只做移动；如需扩展，建议通过客户端发送 `create_node`/`delete_node` 操作，由 DO 生成唯一 `id` 并广播。 

4. **Presence**  
   - 客户端定期（100–200 ms）发送光标位置、视口信息、选中节点 id、拖拽节点 id 等，通过 DO 中的 `presence` map 保存并广播给其他客户端。presence 数据不持久化。 

5. **吸附（snapping）与网格对齐**  
   - 前端现有实现使用 `getSnappedPosition` 算法对齐节点并显示辅助线，snap 阀值可通过 `config.snapThreshold` 配置；本地吸附后的坐标随拖拽消息发送，DO 不参与计算。 

6. **持久化与快照**  
   - DO 持有内存状态，但为了支持重启/部署更新，需要定期持久化：
     - 每 N 次操作或每 T 秒，序列化 `nodes` 和 `seq` 为 JSON 文件写入 R2（如 `snapshots/{canvasId}/{seq}.json`）。 
     - 在 D1 的 `canvases` 表中更新 `latest_snapshot_key` 和 `latest_seq` 字段。
   - DO 冷启动时：读取 D1 中的快照指针，从 R2 拉取 JSON 恢复节点状态和 seq。如果缺少快照，可回放最近的操作日志（MVP 可不实现日志，而直接写完整快照）。

7. **异常处理**  
   - 客户端断网或 refresh 后，重新连接 WS 时应发送 `join` 消息携带最后已知 `seq`。DO 返回最新快照及从该 seq 之后的更新，保证状态补齐。
   - WS 连接断开应在 DO 的 `connections` 列表中移除对应客户端，并移除其 presence；锁定的节点若长时间未收到 `drag_end`，可通过心跳超时释放。 

### 3.2 性能与限制

- **消息节流**：拖拽时客户端发送 `drag_move` 应节流至 ~30 fps；presence 更新节流至 5–10 fps。 
- **WS 广播**：DO 接收一条操作后，应批量 broadcast；建议将更新队列化并在 event loop 空闲时发送，减少抖动。 
- **节点数**：MVP 支持几十到上百个节点并发移动；如需要上千个节点，可考虑分片或按层级拆分多个 DO。 

## 4. 后端工程目录建议

在现有仓库根目录下新增 `packages/server`（或 `backend`）文件夹，统一管理 Cloudflare Worker 与 Durable Object 代码。建议结构如下：

```
packages/server/
├── wrangler.toml          # Cloudflare 配置
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts           # Worker 入口，HTTP 路由 + WS 处理
│   ├── canvasRoom.ts      # Durable Object 类：权威状态机、广播逻辑、持久化
│   ├── types.ts           # Node、presence、WS 消息等共享类型定义
│   ├── snapshot.ts        # 持久化到 R2 的工具函数，读写 R2/D1
│   └── utils/
│       └── auth.ts        # 简单鉴权/分享链接校验（可选）
├── d1/
│   └── schema.sql         # D1 数据库表结构：canvases, snapshots, (members)
└── README.md              # 本地开发指南
```

### `wrangler.toml` 示例

```toml
name = "infinite-canvas-server"
type = "javascript"
compatibility_date = "2025-12-31"

# Durable Object 绑定
[[durable_objects]]
name = "CANVAS_ROOM"
class_name = "CanvasRoom"

# D1 数据库绑定
d1_databases = [
  { binding = "DB", database_name = "canvas_db", database_id = "<your-d1-db-id>" }
]

# R2 对象存储绑定
[[r2_buckets]]
binding = "R2"
bucket_name = "canvas-snapshots"
preview_bucket_name = "canvas-snapshots"

# 环境变量（如有）
[vars]
TOKEN_SECRET = "<set-a-secret>"
```

- `[[durable_objects]]` 声明了名为 `CANVAS_ROOM` 的 Durable Object，类在 `canvasRoom.ts` 中定义。每个 `canvasId` 实例化一个 DO。
- `d1_databases` 绑定一个名为 `DB` 的 D1 数据库，用于存储元数据；Cloudflare D1 文档指出它提供托管的无服务器 SQL 语义【303085997821412†L100-L115】。
- `r2_buckets` 绑定一个名为 `R2` 的存储桶，用于存快照；R2 是 Cloudflare 的对象存储，适合存放大量非结构化数据【277728512498823†L137-L151】。

### D1 数据库表结构（示例 `schema.sql`）

```sql
-- 画布列表
CREATE TABLE IF NOT EXISTS canvases (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  latest_snapshot_key TEXT,
  latest_seq INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- 可选：成员列表 / 分享信息
CREATE TABLE IF NOT EXISTS canvas_members (
  canvas_id TEXT,
  user_id TEXT,
  role TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  PRIMARY KEY (canvas_id, user_id)
);
```

## 5. 本地开发与调试指南

1. **安装依赖**：在 `packages/server` 中运行 `npm install`，安装 `wrangler`, `@cloudflare/workers-types` 等依赖。

2. **初始化数据库**：使用 `wrangler d1 create <db-name>` 创建 D1 数据库，并记录 `database_id` 填入 `wrangler.toml`；执行 `wrangler d1 migrations apply <db-name>` 应用 `schema.sql`。

3. **启动后端**：执行 `wrangler dev --local --persist`，启用本地模拟 DO、R2、D1（`--persist` 将持久化数据保存在 `.wrangler/state` 目录）。启动成功后，会提供类似 `http://127.0.0.1:8787` 的服务地址。文档指出，当你运行 `wrangler dev` 时，Miniflare 会自动创建 KV、D1、R2 等本地资源，而无需手动搭建【40073712038618†L444-L454】。

4. **启动前端**：在 React 项目中运行 `npm run dev`。前端通过 `.env.local` 配置后端地址，例如：
   ```
   NEXT_PUBLIC_API_BASE="http://127.0.0.1:8787"
   ```

5. **连接 WebSocket**：前端访问 `/api/canvas/:id` 获取画布信息后，通过 `new WebSocket(`${API_BASE}/ws/canvas/${canvasId}?token=...`)` 连接。Worker 根据 `canvasId` 调用 `CANVAS_ROOM.get(id)` 获取或创建 DO，并转发 `fetch` 请求至 DO，实现 WebSocket 流程。

6. **调试 tips**：
   - 使用 `console.log` 或 `wrangler tail` 查看 DO 中的日志。
   - 在本地不接入 R2 时，可模拟快照保存为本地文件或忽略快照逻辑，专注实时功能；生产环境再接入 R2。

## 6. 与 apps/demo 的集成与部署

为了保持前端与后端解耦，建议将 Cloudflare Worker 项目放在 `packages/server` 中，前端 demo 应用放在 `apps/demo` 中，两者通过 HTTP/WS 调用交互，而不是通过代码导入。具体集成方案如下：

### 6.1 在 monorepo 中保持隔离

1. **目录结构**：`packages/server` 用于后端 Worker/DO 代码；`packages/widget` 用于可复用的画布 UI 组件；`apps/demo` 用于基于 Next.js 的演示应用。三者互不依赖源代码，前端只通过网络访问后端。
2. **内部依赖**：如需共享类型定义，可以在 `packages/types` 中定义公共 TS 类型（如 `CanvasNode`、`Presence` 等），然后通过 workspace 依赖引入，无需直接引用后端逻辑。

### 6.2 在 apps/demo 中使用后端服务

1. **环境变量**：在 `apps/demo` 的 `.env.local` 中声明后端地址，例如：

   ```
   NEXT_PUBLIC_API_BASE=http://127.0.0.1:8787
   ```

   `NEXT_PUBLIC_API_BASE` 会用于构建 REST 请求（如 `/api/canvas`）和 WebSocket 连接（如 `/ws/canvas/:id`）。

2. **创建画布**：演示应用可以在页面加载时调用 `POST ${NEXT_PUBLIC_API_BASE}/api/canvas` 创建画布并得到 `canvasId`，然后建立 WebSocket 连接。

3. **启动脚本**：在根目录的 `package.json` 中添加可并行启动后端 Worker 与前端 demo 的脚本。例如：

   ```json
   {
     "scripts": {
       "dev:server": "cd packages/server && wrangler dev --local --persist",
       "dev:demo": "cd apps/demo && next dev",
       "dev": "concurrently \"npm run dev:server\" \"npm run dev:demo\""
     }
   }
   ```

   - `wrangler dev --local --persist` 会在本地启动 Worker、Durable Object、D1 和 R2 资源，并将本地数据持久化到 `.wrangler/state` 目录【40073712038618†L444-L454】。
   - `concurrently` 用于同时运行两个进程；开发者可以一条命令启动前后端。

4. **从前端调用**：`apps/demo` 中的 React 组件无需引用后端代码，只需使用 `fetch` 或 `axios` 请求 API。例如：

   ```ts
   // 获取画布列表
   const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/canvas`);
   const data = await res.json();
   ```

   WebSocket 连接类似：

   ```ts
   const ws = new WebSocket(`${process.env.NEXT_PUBLIC_API_BASE}/ws/canvas/${canvasId}?token=${userToken}`);
   ```

### 6.3 部署指南

1. **发布 Worker**：在 `packages/server` 中运行 `wrangler publish` 将 Worker 和 Durable Objects 部署到 Cloudflare。该命令会使用 `wrangler.toml` 中的配置创建或更新 DO 绑定并上传脚本。部署时可以通过 `--env production` 使用不同的配置。
2. **部署 demo**：`apps/demo` 可以部署到 Vercel、Netlify 或其它环境。构建时应设置 `NEXT_PUBLIC_API_BASE` 指向已经部署的 Worker 域名（例如 `https://<your-worker-subdomain>.workers.dev`）。
3. **CI/CD**：如采用 GitHub Actions，可在一条工作流中先在 `packages/server` 运行 `wrangler publish`，然后在 `apps/demo` 运行 `npm run build` 并将产物推送到 Vercel。确保在 CI 中配置 Cloudflare API Token 及 Worker 帐号 ID。

通过上述隔离与配置，`apps/demo` 无需直接 import 后端包即可调用服务，同时可以方便地在本地启动调试和部署生产环境。文档提醒，`wrangler dev` 和 Vite 插件会自动在本地创建 KV、D1、R2 等资源，并通过 Miniflare 提供持久化【40073712038618†L444-L453】。

## 7. 后续可扩展内容

- **节点内容编辑**：在文本节点中使用 CRDT（如 Yjs）的子文档，实现富文本实时编辑并在 DO 中存放权威增量。
- **块树结构**：如实现 Notion/白板风格，可将画布拆分为多个区块，每个区块一个 DO，前端按需订阅当前视口附近的区块。 
- **版本历史和撤销/重做**：将操作日志持久化至 R2 或 D1，支持回放和回滚。
- **权限系统**：在 `canvas_members` 中存储角色（owner/editor/viewer），在 Worker 中鉴权；分享链接生成短期 token。 
- **搜索**：将快照或节点内容异步写入全文索引（如 Meilisearch），实现画布搜索功能。

## 8. 总结

该需求方案围绕前端已有的 React Flow 无限画布实现，通过 Cloudflare Durable Objects、D1 和 R2 构建了一个中心化权威的协同架构。Durable Objects 结合计算与存储，适用于需要协调多个客户端状态的实时应用【552808641505565†L134-L147】。D1 提供托管的无服务器 SQL 数据库，适合保存画布列表和快照索引【303085997821412†L100-L115】。R2 是对象存储，用于存储画布快照【277728512498823†L137-L151】。通过合理的模块划分和持久化策略，这个 MVP 能在保证实时性的同时支持冷启动恢复，并为后续功能扩展（评论、块结构、版本历史等）留出空间。并且通过在 monorepo 中保持后端与前端的隔离、使用环境变量和统一的启动脚本，`apps/demo` 可以独立于后端代码进行开发和部署，同时轻松接入实时协同服务。
