# Cloudflare Data Studio 查询 Durable Objects 指南

## 快速开始 - 实际可用的查询方法

### 🚀 最快的方法：使用管理 API

```bash
# 1. 启动本地开发服务器
cd packages/server
npx wrangler dev

# 2. 在浏览器中打开
# http://localhost:8787/admin/rooms
```

你会看到所有房间的列表，包括：
- 房间 ID
- 节点数量
- 连接数
- 序列号
- 最后活动时间

### 📊 查看特定房间的详细信息

```bash
# 浏览器访问
http://localhost:8787/admin/rooms/{canvasId}

# 或使用 curl
curl http://localhost:8787/admin/rooms/canvas_123 | jq '.'
```

返回示例：
```json
{
  "roomId": "canvas_123",
  "nodeCount": 15,
  "seq": 42,
  "activeConnections": 2,
  "connections": [...],
  "lastStateSource": "do_storage"
}
```

### 🔍 使用 Wrangler 直接查询 DO Storage

```bash
# 获取完整的 state 数据
npx wrangler durable-objects:storage get \
  --name infinite-canvas-collab-worker \
  --id "canvas_123" \
  --key state \
  --pretty
```

### 📝 查询 D1 数据库

```bash
# 列出所有画布
npx wrangler d1 execute canvas_db \
  --command "SELECT id, title, latest_seq FROM canvases LIMIT 10"

# 查询特定画布
npx wrangler d1 execute canvas_db \
  --command "SELECT * FROM canvases WHERE id='canvas_123'"
```

### ⚡ Data Studio 的实际用法

在 Data Studio 中只能运行非常简单的查询：

```sql
-- 查看所有存储的键值对
SELECT * FROM storage;

-- 这将显示类似：
-- key      | value
-- ---------|----------
-- "state"  | {"version":1,"seq":42,...}
```

**注意**: 
- ❌ 不支持 `WHERE`、`JSON_EXTRACT` 等复杂查询
- ❌ 不支持跨 DO 实例查询
- ✅ 只能查看单个 DO 实例的原始数据
- ✅ 适合快速检查数据是否存在

## Durable Object 架构

### 1. Durable Object 类型

项目中定义了一个 Durable Object 类:

- **CanvasRoom** (`class_name: "CanvasRoom"`)
  - 用途: 管理单个画布的实时协作状态
  - 每个画布对应一个 DO 实例
  - 使用命名 ID: `env.CANVAS_ROOM.idFromName(canvasId)`

### 2. 数据存储结构

#### DO Storage (主要存储)

每个 CanvasRoom DO 实例在 DO Storage 中存储一个 `state` 对象:

```typescript
{
  version: 1,                           // 状态版本号
  seq: number,                          // 当前操作序列号
  nodes: CanvasNodeData[],              // 画布节点数组
  canvasId: string,                     // 画布 ID
  commandIds: Record<string, number>,   // 已处理的命令 ID (防重)
  tombstones: Record<string, number>,   // 已删除的外部节点标记
  autoLayoutIndex: number,              // 自动布局索引
  lastFlushedAt: number,                // 最后持久化时间戳
  migratedAt?: number,                  // 迁移时间戳 (如果从 R2 迁移)
  migratedFrom?: string                 // 迁移来源标记
}
```

#### D1 数据库 (索引和管理)

##### canvases 表
```sql
CREATE TABLE canvases (
  id TEXT PRIMARY KEY,        -- 画布 ID
  title TEXT,                 -- 画布标题
  latest_seq INTEGER,         -- 最新序列号
  created_at INTEGER,         -- 创建时间戳
  updated_at INTEGER          -- 最后更新时间戳
);
```

##### canvas_members 表 (可选)
```sql
CREATE TABLE canvas_members (
  canvas_id TEXT,             -- 画布 ID
  user_id TEXT,               -- 用户 ID
  role TEXT,                  -- 角色 (owner/editor/viewer)
  FOREIGN KEY (canvas_id) REFERENCES canvases(id)
);
```

#### R2 对象存储 (遗留快照)

- Bucket 名称: `canvas-snapshots`
- 路径格式: `snapshots/{canvasId}/snapshot_{seq}_{timestamp}.json`
- 注意: 新版本已迁移到 DO Storage，R2 仅用于遗留数据迁移

## 如何查询 Durable Object 数据

⚠️ **重要**: Cloudflare Data Studio 的 SQL 功能非常有限，主要用于简单的数据检查。对于实际的数据查询和分析，**强烈推荐使用下面的方法 2-4**。

### 方法 1: Data Studio (仅用于简单检查)

1. 打开 Cloudflare Dashboard
2. 导航到你的 Durable Object: **Workers & Pages** → **Durable Objects**
3. 选择 `infinite-canvas-collab-worker_CanvasRoom`
4. 点击 **Data Studio** 按钮

#### 可用的查询

```sql
-- 查看是否有存储的数据
SELECT * FROM storage;

-- 计数存储的键值对数量
SELECT COUNT(*) FROM storage;
```

**限制**: Data Studio 不支持复杂的 JSON 解析和过滤，只能看到原始的键值对。

### 方法 2: 使用管理 API (推荐 ⭐)

这是最方便的方法，可以获取完整的房间状态：

```bash
# 获取特定房间的详细状态
curl https://your-worker.workers.dev/admin/rooms/{canvasId}

# 列出所有房间
curl https://your-worker.workers.dev/admin/rooms

# 本地开发环境
npx wrangler dev
# 然后在浏览器访问 http://localhost:8787/admin/rooms
```

### 方法 3: 使用 Wrangler CLI (最强大 ⭐⭐)

直接访问 Durable Object Storage：

```bash
# 进入项目目录
cd packages/server

# 列出特定 DO 实例的所有键
npx wrangler durable-objects:storage list \
  --name infinite-canvas-collab-worker \
  --id "your-canvas-id-here"

# 获取 state 键的完整数据 (格式化输出)
npx wrangler durable-objects:storage get \
  --name infinite-canvas-collab-worker \
  --id "your-canvas-id-here" \
  --key state \
  --pretty

# 如果不知道 canvas ID，可以先查询 D1 数据库
npx wrangler d1 execute canvas_db \
  --command "SELECT id, title FROM canvases LIMIT 10"
```

### 方法 4: 查看实时日志

```bash
# 查看 Worker 日志 (包括 DO 的日志)
npx wrangler tail --format pretty

# 过滤特定房间的日志
npx wrangler tail --format pretty | grep "canvas_123"
```

### 查询语法

⚠️ **重要提示**: Cloudflare Data Studio 的 SQL 语法与标准 SQL 有所不同。下面是实际可用的查询方法。

#### 查询前的准备

在 Data Studio 中，Durable Object Storage 的数据结构如下：
- 每个键值对存储在一行中
- 数据通过列号访问，而不是命名列
- 列索引从 1 开始

#### 1. 查看所有存储的键 (基础查询)

```sql
-- 列出所有存储的键值对
-- 列 1: key 名称
-- 列 2: value 值 (JSON 字符串)
SELECT * FROM storage;
```

如果你的 DO 中存储了 `state` 键，应该能看到一行数据，其中第一列是 `"state"`，第二列是完整的 JSON 数据。

#### 2. 查询 state 数据 (推荐使用 Cloudflare API)

由于 Data Studio 的 SQL 查询功能有限，建议通过以下方式查询数据：

**方法 A: 使用 Wrangler CLI**

```bash
# 进入项目目录
cd packages/server

# 查询特定 DO 实例的存储
npx wrangler durable-objects:storage get \
  --name infinite-canvas-collab-worker \
  --id "canvas-id-here" \
  --key state
```

**方法 B: 通过管理 API (推荐)**

```bash
# 获取房间状态
curl https://your-worker.workers.dev/admin/rooms/canvas-id-here

# 列出所有房间
curl https://your-worker.workers.dev/admin/rooms
```

**方法 C: 在 Worker 代码中添加调试端点**

在你的 Worker 中添加一个调试端点来直接访问 DO Storage：

```typescript
// 在 index.ts 中添加
if (url.pathname === '/debug/storage' && request.method === 'GET') {
  const canvasId = url.searchParams.get('canvasId');
  if (!canvasId) {
    return new Response('Missing canvasId', { status: 400 });
  }
  
  const id = env.CANVAS_ROOM.idFromName(canvasId);
  const stub = env.CANVAS_ROOM.get(id);
  
  // 在 CanvasRoom 中添加对应的 /debug/storage 路由
  return await stub.fetch(new URL('/state', request.url).toString());
}
```

#### 3. Data Studio 中的基础查询

如果你坚持使用 Data Studio，以下是一些基础查询：

```sql
-- 方式 1: 简单查看所有数据
1

-- 方式 2: 如果支持列名访问
SELECT 1 FROM storage

-- 方式 3: 计数
SELECT COUNT(*) FROM storage
```

**注意**: Data Studio 的查询能力非常有限，主要用于：
- 查看是否有数据存储
- 检查键的存在性
- 简单的数据计数

对于复杂的数据查询和分析，强烈建议使用管理 API 或 wrangler CLI。

#### 4. 使用 Wrangler 查看完整数据

这是最可靠的方法来查看 DO Storage 数据：

```bash
# 列出特定 DO 实例的所有键
npx wrangler durable-objects:storage list \
  --name infinite-canvas-collab-worker \
  --id "canvas-id-here"

# 获取特定键的值
npx wrangler durable-objects:storage get \
  --name infinite-canvas-collab-worker \
  --id "canvas-id-here" \
  --key state \
  --pretty
```

#### 5. 推荐的数据查询流程

1. **快速检查**: 使用 Data Studio 的 `SELECT * FROM storage` 查看是否有数据
2. **详细查询**: 使用管理 API `/admin/rooms/{canvasId}` 获取完整状态
3. **调试分析**: 使用 wrangler CLI 直接访问 DO Storage
4. **监控统计**: 查询 D1 数据库获取汇总信息

## 实用查询示例

### 使用 Wrangler 查询 DO Storage

#### 1. 查看所有画布的状态

```bash
# 先从 D1 获取所有画布 ID
npx wrangler d1 execute canvas_db --command "SELECT id FROM canvases"

# 然后循环查询每个 DO 实例 (使用脚本)
# 创建 scripts/query-all-rooms.sh
```

创建查询脚本 `scripts/query-all-rooms.sh`:

```bash
#!/bin/bash

# 获取所有画布 ID
CANVAS_IDS=$(npx wrangler d1 execute canvas_db \
  --command "SELECT id FROM canvases" \
  --json | jq -r '.[].results[].id')

# 循环查询每个房间
for canvas_id in $CANVAS_IDS; do
  echo "=== Canvas: $canvas_id ==="
  npx wrangler durable-objects:storage get \
    --name infinite-canvas-collab-worker \
    --id "$canvas_id" \
    --key state \
    --pretty
  echo ""
done
```

#### 2. 检查特定房间的数据完整性

```bash
#!/bin/bash
CANVAS_ID="your-canvas-id"

echo "1. D1 记录:"
npx wrangler d1 execute canvas_db \
  --command "SELECT * FROM canvases WHERE id='$CANVAS_ID'" \
  --json | jq '.'

echo "2. DO Storage 数据:"
npx wrangler durable-objects:storage get \
  --name infinite-canvas-collab-worker \
  --id "$CANVAS_ID" \
  --key state \
  --pretty

echo "3. 管理 API 状态:"
curl "http://localhost:8787/admin/rooms/$CANVAS_ID" | jq '.'
```

#### 3. 导出特定房间的完整数据

```bash
# 导出为 JSON 文件
npx wrangler durable-objects:storage get \
  --name infinite-canvas-collab-worker \
  --id "canvas_123" \
  --key state \
  --pretty > backup_canvas_123.json

# 查看导出的数据
jq '.nodes | length' backup_canvas_123.json  # 节点数量
jq '.seq' backup_canvas_123.json             # 序列号
jq '.nodes[0]' backup_canvas_123.json        # 第一个节点
```

### 在 Cloudflare Dashboard 中查询 D1

1. 导航到 **Storage & Databases** → **D1 SQL Databases**
2. 选择 `canvas_db` 数据库
3. 在 **Console** 标签中输入查询

### 常用查询

#### 1. 列出所有画布

```sql
SELECT 
  id, 
  title, 
  latest_seq, 
  datetime(created_at, 'unixepoch') as created,
  datetime(updated_at, 'unixepoch') as updated
FROM canvases 
ORDER BY updated_at DESC 
LIMIT 50;
```

#### 2. 查询最近活跃的画布

```sql
SELECT 
  id, 
  title, 
  latest_seq,
  (unixepoch() - updated_at) as seconds_since_update,
  datetime(updated_at, 'unixepoch') as last_update
FROM canvases 
WHERE updated_at > unixepoch() - 3600  -- 最近1小时
ORDER BY updated_at DESC;
```

#### 3. 查询特定用户的画布

```sql
SELECT 
  c.id, 
  c.title, 
  c.latest_seq,
  m.role
FROM canvases c
JOIN canvas_members m ON c.id = m.canvas_id
WHERE m.user_id = 'your-user-id'
ORDER BY c.updated_at DESC;
```

## 通过 API 查询

### 管理 API 端点

项目提供了以下管理 API 来查询房间状态:

#### 1. 列出所有活跃房间

```bash
GET /admin/rooms
```

响应示例:
```json
{
  "rooms": [
    {
      "canvasId": "canvas_123",
      "title": "My Canvas",
      "seq": 42,
      "createdAt": 1706832000,
      "updatedAt": 1706835600
    }
  ]
}
```

#### 2. 获取特定房间状态

```bash
GET /admin/rooms/{canvasId}
```

响应示例:
```json
{
  "roomId": "canvas_123",
  "createdAt": 1706832000,
  "lastConnectionAt": 1706835600,
  "activeConnections": 2,
  "activeUsers": 2,
  "nodeCount": 15,
  "seq": 42,
  "lockedNodesCount": 1,
  "presenceCount": 2,
  "lastStateSource": "do_storage",
  "idleSeconds": 0,
  "connections": [
    {
      "userId": "user_1",
      "userName": "Alice",
      "joinedAt": 1706835000,
      "lastActiveAt": 1706835600,
      "lastUserActionAt": 1706835500,
      "idleSeconds": 100
    }
  ],
  "metrics": {
    "d1RecordEnsured": true,
    "d1WriteAttempts": 3,
    "d1WriteFailures": 0,
    "d1WriteSuccessRate": "100.00%"
  }
}
```

#### 3. 使用 wrangler CLI 查询

```bash
# 开发环境
npx wrangler dev

# 生产环境 (需要配置认证)
curl https://your-worker.workers.dev/admin/rooms \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 数据检查清单

### 健康检查

1. **检查 DO Storage 状态**
   - 所有活跃房间都有 `state` 键
   - `version` 字段为 1
   - `seq` 序列号递增
   - `lastFlushedAt` 时间戳合理

2. **检查 D1 记录**
   - 每个活跃房间在 `canvases` 表中都有记录
   - `updated_at` 时间戳与 DO 最后活动时间一致
   - `latest_seq` 与 DO Storage 中的 `seq` 一致

3. **检查数据一致性**
   ```sql
   -- 找出 D1 和 DO Storage 不一致的房间
   SELECT 
     d1.id,
     d1.latest_seq as d1_seq,
     do.seq as do_seq,
     (do.seq - d1.latest_seq) as seq_diff
   FROM canvases d1
   LEFT JOIN (
     SELECT 
       object_id,
       json_extract(value, '$.seq') as seq
     FROM _cf_KV WHERE key = 'state'
   ) do ON d1.id = do.object_id
   WHERE do.seq != d1.latest_seq;
   ```

### 常见问题排查

#### 1. 房间数据丢失

```sql
-- 检查是否从 R2 迁移
SELECT 
  object_id,
  json_extract(value, '$.migratedFrom') as source,
  json_extract(value, '$.migratedAt') as migrated_at
FROM _cf_KV 
WHERE key = 'state' AND object_id = 'your-canvas-id';
```

#### 2. D1 记录缺失

使用管理 API 修复:

```bash
POST /admin/rooms/scan-and-fix
```

或单个修复:

```bash
POST /admin/rooms/create-record
Content-Type: application/json

{
  "canvasId": "your-canvas-id"
}
```

#### 3. 查看 DO 实例运行状态

```bash
GET /admin/rooms/{canvasId}
```

检查响应中的:
- `activeConnections`: 当前 WebSocket 连接数
- `idleSeconds`: 空闲时间
- `lastStateSource`: 状态来源 (`do_storage` | `legacy_migration` | `empty`)

## 数据备份

### 导出 DO Storage 数据

```sql
-- 导出所有房间的状态 (JSON 格式)
SELECT 
  object_id as canvas_id,
  value as state_json
FROM _cf_KV 
WHERE key = 'state';
```

### 导出 D1 数据

```bash
# 使用 wrangler 导出
npx wrangler d1 export canvas_db --output backup.sql
```

## 监控建议

### 关键指标

1. **DO 实例数量**: 监控活跃房间数量
2. **节点总数**: 监控画布复杂度
3. **D1 写入成功率**: `d1WriteSuccessRate` 应接近 100%
4. **空闲时间**: 超过配置的超时时间可能表示 DO 未正常关闭

### 告警阈值

- D1 写入失败率 > 5%
- 单个房间节点数 > 1000
- 房间空闲时间 > 1 小时 (但仍有连接)
- DO Storage 和 D1 seq 差异 > 10

## 相关命令

```bash
# 查看 DO 日志
npx wrangler tail --format pretty

# 列出 D1 表结构
npx wrangler d1 execute canvas_db --command ".schema"

# 列出 R2 对象 (遗留快照)
npx wrangler r2 object list canvas-snapshots --prefix "snapshots/"
```

## 参考文档

- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [Durable Objects Storage API](https://developers.cloudflare.com/durable-objects/api/storage-api/)
- [D1 Database](https://developers.cloudflare.com/d1/)
- [R2 Object Storage](https://developers.cloudflare.com/r2/)

## 总结

通过 Data Studio 和 D1 查询，你可以:

1. ✅ 查看所有活跃的 Durable Object 实例
2. ✅ 检查每个房间的完整状态和节点数据
3. ✅ 验证数据一致性 (DO Storage vs D1)
4. ✅ 排查迁移问题
5. ✅ 监控系统健康状态

建议定期运行健康检查查询，确保数据完整性和一致性。
