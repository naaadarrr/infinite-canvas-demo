# 外部命令请求与调试指南

本文档说明如何向协作画布服务发送外部命令，以及常用的本地调试方法。

## 1. 目标接口

- 方法: `POST`
- 路径: `/canvas/{boardId}/commands`
- 请求头:
  - `Content-Type: application/json`
- 认证: **当前已临时移除（无需任何认证头）**

## 2. 请求体结构

```json
{
  "id": "cmd_20260127_0001",
  "source": "external.crm",
  "type": "append_nodes",
  "payload": {
    "nodes": [
      {
        "taskId": "task_xxx",
        "boardId": "board_xxx",
        "sortWeight": 10,
        "uid": "user_xxx",
        "userName": "alice",
        "toolType": "text-to-image",
        "toolCategory": "image",
        "status": "success",
        "mediaType": "image",
        "rating": 0,
        "parameters": {
          "prompt": "A cat on the moon",
          "aspect_ratio": "1:1"
        },
        "result": {
          "compressedImage": {
            "filePath": "analyzed_video/task/xxx/inline_image_0_resized.jpeg",
            "width": 512,
            "height": 512
          },
          "originImage": {
            "filePath": "analyzed_video/task/xxx/inline_image_0.jpeg",
            "width": 1024,
            "height": 1024
          }
        },
        "creditsCost": 0,
        "creditsPayerUid": "user_xxx",
        "creditsPayerName": "alice",
        "gmtCreate": "2026-01-27 10:00:00",
        "gmtModify": "2026-01-27 10:00:00",
        "completedAt": "2026-01-27 10:05:00",
        "isPinned": false
      }
    ]
  }
}
```

### 字段说明

- `id`: 命令唯一 ID（用于幂等去重）
- `source`: 外部系统标识（仅用于日志与兼容旧 ID）
- `type`: 命令类型（见下方行为说明）
- `payload.nodes`: **BoardTaskItem** 数组（后端运行时只强校验 `taskId`）

## 3. 命令行为

### append_nodes
- **只新增**。
- 若房间中已存在相同 `taskId`，忽略该条。

### update_nodes
- **只更新**，不会创建新节点。
- 更新前先比较当前房间内该 `taskId` 对应节点的 raw 数据：
  - 若内容完全一致，则忽略（不广播、不增加 seq）。
  - 若有字段变化，则更新并广播。


### delete_nodes
- 删除 `taskId` 对应节点。
- 若不存在该 `taskId`，直接忽略。

## 4. 节点映射规则（简述）

- `mediaType` → 节点类型（image / video / audio / text）
- `result` 中的资源信息会生成节点 URL / poster
- `raw` 会挂在节点上，供前端 UI 展示与状态判断

## 5. 本地调试

### 5.1 启动服务

```bash
pnpm --filter @tc/infinite-server dev
```

默认会启动 Wrangler 本地服务（`wrangler dev --persist-to .wrangler/state`）。

### 5.2 发送请求（curl 示例）

```bash
curl -X POST "https://infinite-canvas-collab-server.buzzbus.workers.dev/canvas/{boardId}/commands" \
  -H "Content-Type: application/json" \
  --data @- <<'JSON'
{
  "id": "cmd_20260127_0001",
  "source": "external.crm",
  "type": "append_nodes",
  "payload": {
    "nodes": [
      {
        "taskId": "task_001",
        "boardId": "board_001",
        "sortWeight": 10,
        "uid": "user_001",
        "userName": "alice",
        "toolType": "text-to-image",
        "toolCategory": "image",
        "status": "success",
        "mediaType": "image",
        "rating": 0,
        "parameters": { "prompt": "Hello world", "aspect_ratio": "1:1" },
        "result": {
          "compressedImage": { "filePath": "analyzed_video/task/xxx/img_0_resized.jpeg", "width": 512, "height": 512 },
          "originImage": { "filePath": "analyzed_video/task/xxx/img_0.jpeg", "width": 1024, "height": 1024 }
        },
        "creditsCost": 0,
        "creditsPayerUid": "user_001",
        "creditsPayerName": "alice",
        "gmtCreate": "2026-01-27 10:00:00",
        "gmtModify": "2026-01-27 10:00:00",
        "completedAt": "2026-01-27 10:05:00",
        "isPinned": false
      }
    ]
  }
}
JSON
```

### 5.3 更新与删除示例

```bash
# 更新（只更新已存在的 taskId）
curl -X POST "https://infinite-canvas-collab-server.buzzbus.workers.dev/canvas/{boardId}/commands" \
  -H "Content-Type: application/json" \
  --data '{"id":"cmd_20260127_0002","source":"external.crm","type":"update_nodes","payload":{"nodes":[{"taskId":"task_001","rating":5}]}}'

# 删除（只需 taskId 即可）
curl -X POST "https://infinite-canvas-collab-server.buzzbus.workers.dev/canvas/{boardId}/commands" \
  -H "Content-Type: application/json" \
  --data '{"id":"cmd_20260127_0003","source":"external.crm","type":"delete_nodes","payload":{"nodes":[{"taskId":"task_001"}]}}'
```

### 5.4 查看日志

- Worker 日志中会输出：
  - `[ExternalCommands]`（接收请求）
  - `[CanvasRoom]`（命令处理结果）

如果在 Cloudflare 环境调试，可使用：

```bash
pnpm --filter @tc/infinite-server tail
```

## 6. 响应结果

接口会返回如下结构：

```json
{
  "success": true,
  "status": "applied",
  "seq": 12,
  "created": 1,
  "updated": 0,
  "deleted": 0,
  "ignored": 0
}
```

- `ignored` 表示被跳过（已存在、未变化、或 taskId 不存在）。
- `seq` 会在有实际变更时递增。

---

需要补充示例或接入真实后端签名时告诉我，我可以继续完善。
