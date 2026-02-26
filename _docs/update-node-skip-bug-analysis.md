# Update Node 跳过更新漏洞分析

## 问题描述

在 Cloudflare 日志中发现,虽然任务状态已经从 `init` 更新到 `completed`,并且包含了完整的 `result` 数据,但 canvas 中的节点仍然显示 `init` 状态(旋转的加载圆圈),没有切换到完成后的视频。

### 相关日志

1. **Append 节点**: https://dash.cloudflare.com/5b6c981ebeb77b3e3566ffc9ba8be751/workers-and-pages/observability/events/01KH05NMV9R2B57186NNGATGMF
2. **Update 节点 (未生效)**: 
   - https://dash.cloudflare.com/5b6c981ebeb77b3e3566ffc9ba8be751/workers-and-pages/observability/events/01KH05NPJGYNVR1FB0A5H1D4SV
   - https://dash.cloudflare.com/5b6c981ebeb77b3e3566ffc9ba8be751/workers-and-pages/observability/events/01KH05QX75VTPSRCGDQER54TGM

## 根本原因分析

### 代码位置

`packages/server/src/canvasRoom.ts` 第 1305-1382 行的 `update_nodes` 处理逻辑。

### 问题1: isDeepEqual 判断过于严格

```typescript:1324-1349:packages/server/src/canvasRoom.ts
const existingRaw = (existing as CanvasNodeData & { raw?: BoardTaskItem }).raw;
const mergedRaw = this.mergeTaskItem(existingRaw, item);
const normalizedType = this.resolveTaskNodeType(item.mediaType, existing);
const shouldRefreshMedia = normalizedType
  ? this.shouldRefreshMedia(existing, normalizedType)
  : false;

// 检测状态变化,添加调试日志
const existingStatus = existingRaw?.status;
const incomingStatus = item.status;
const statusChanged = existingStatus !== incomingStatus;
const hasResultData = item.result && Object.keys(item.result).length > 0;

if (statusChanged) {
  console.log(
    `[CanvasRoom] Status change detected: taskId=${item.taskId} status=${existingStatus}->${incomingStatus} hasResult=${hasResultData}`
  );
}

// ⚠️ 问题所在: 即使状态改变,仍然可能被跳过
if (existingRaw && this.isDeepEqual(existingRaw, mergedRaw) && !shouldRefreshMedia) {
  console.log(
    `[CanvasRoom] Skipping update (no changes): taskId=${item.taskId} status=${incomingStatus} shouldRefreshMedia=${shouldRefreshMedia}`
  );
  summary.ignored += 1;
  continue;
}
```

**问题**:
- `statusChanged` 检测到状态变化(例如 `init` -> `completed`)
- 但 `isDeepEqual(existingRaw, mergedRaw)` 仍然可能返回 `true`
- 这会导致即使状态改变,更新也被跳过

### 问题2: buildTaskItemUpdates 可能返回空更新

```typescript:1351-1358:packages/server/src/canvasRoom.ts
const updates = await this.buildTaskItemUpdates(mergedRaw, existing, source);
if (!updates || Object.keys(updates).length === 0) {
  console.log(
    `[CanvasRoom] Skipping update (empty updates): taskId=${item.taskId} status=${incomingStatus}`
  );
  summary.ignored += 1;
  continue;
}
```

**问题**:
- `buildTaskItemUpdates` 内部也使用 `isDeepEqual` 来比较字段(第 1517 行)
- 即使 `raw` 数据不同,但如果生成的 `derived` 字段相同,更新会被跳过
- 这可能发生在媒体 URL 尚未解析完成的情况

### 问题3: deepMerge 的副作用

```typescript:1640-1670:packages/server/src/canvasRoom.ts
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
```

**问题**:
- `deepMerge` 会递归合并对象
- 如果 `existing.result` 和 `incoming.result` 的某些字段相同,合并后的 `mergedRaw` 和 `existingRaw` 可能看起来"相等"
- 但实际上 `incoming` 包含了新的完整数据

## 具体场景重现

### 场景1: init -> completed 状态转换

1. **Append 时**:
   ```json
   {
     "taskId": "xxx",
     "status": "init",
     "result": {}  // 空或只有部分字段
   }
   ```

2. **第一次 Update** (状态变为 completed):
   ```json
   {
     "taskId": "xxx",
     "status": "completed",
     "result": {
       "originVideo": {
         "filePath": "/path/to/video.mp4",
         "width": 1024,
         "height": 1024
       }
     }
   }
   ```

3. **检查流程**:
   - `existingRaw.status = "init"`
   - `mergedRaw.status = "completed"` ← 状态已更新
   - `statusChanged = true` ← 检测到变化
   - `isDeepEqual(existingRaw, mergedRaw) = false` ← 应该返回 false
   - **但是**: 如果 `shouldRefreshMedia = false`,或者 `buildTaskItemUpdates` 返回空,更新仍然会被跳过

### 场景2: URL 解析延迟

1. `buildTaskNodeData` 尝试解析 URL:
   ```typescript
   const url = await this.resolveMediaUrl(result?.originVideo);
   ```

2. 如果 `resolveMediaUrl` 返回空字符串(例如签名 URL 失败):
   ```typescript
   const url = '';  // 空字符串
   ```

3. `buildTaskItemUpdates` 比较 `existing.url` 和 `derived.url`:
   ```typescript
   if (!this.isDeepEqual((existing as Record<string, unknown>)[key], value)) {
     (updates as Record<string, unknown>)[key] = value;
   }
   ```

4. 如果 `existing.url = ''` 且 `derived.url = ''`,则认为没有变化,跳过更新

## 修复方案

### 方案1: 状态变化时强制更新 (推荐)

```typescript
// 在第 1343 行之前添加状态变化检查
if (statusChanged) {
  // 状态变化时,强制更新,不进行深度相等检查
  console.log(
    `[CanvasRoom] Forcing update due to status change: taskId=${item.taskId} status=${existingStatus}->${incomingStatus}`
  );
  // 跳过 isDeepEqual 检查
} else if (existingRaw && this.isDeepEqual(existingRaw, mergedRaw) && !shouldRefreshMedia) {
  // 状态未变化时才进行深度相等检查
  console.log(
    `[CanvasRoom] Skipping update (no changes): taskId=${item.taskId} status=${incomingStatus} shouldRefreshMedia=${shouldRefreshMedia}`
  );
  summary.ignored += 1;
  continue;
}
```

### 方案2: result 数据变化时强制更新

```typescript
// 检查 result 字段是否有实质性变化
const hasResultChange = !this.isDeepEqual(existingRaw?.result, item.result);

if (statusChanged || hasResultChange) {
  // 状态变化或 result 变化时,强制更新
  console.log(
    `[CanvasRoom] Forcing update: taskId=${item.taskId} statusChanged=${statusChanged} hasResultChange=${hasResultChange}`
  );
  // 跳过后续的相等性检查
} else if (existingRaw && this.isDeepEqual(existingRaw, mergedRaw) && !shouldRefreshMedia) {
  // ...
}
```

### 方案3: buildTaskItemUpdates 检查修复

```typescript
// 在第 1351 行之后添加
const updates = await this.buildTaskItemUpdates(mergedRaw, existing, source);

// 如果状态变化,即使 updates 为空,也强制包含 raw 和 status
if (statusChanged || hasResultChange) {
  if (!updates || Object.keys(updates).length === 0) {
    console.warn(
      `[CanvasRoom] Empty updates but status/result changed, forcing update: taskId=${item.taskId}`
    );
    // 强制更新 raw 数据,确保客户端能获取最新状态
    const forcedUpdates: Partial<CanvasNodeData> = {
      raw: mergedRaw,
      status: mergedRaw.status,
    };
    Object.assign(existing, forcedUpdates);
    updatesBatch.push({ nodeId: existingId, updates: forcedUpdates });
    summary.updated += 1;
    continue;
  }
}

if (!updates || Object.keys(updates).length === 0) {
  // 正常情况下的空更新跳过
  console.log(
    `[CanvasRoom] Skipping update (empty updates): taskId=${item.taskId} status=${incomingStatus}`
  );
  summary.ignored += 1;
  continue;
}
```

### 方案4: 增强日志输出 (辅助调试)

```typescript
// 在第 1324 行之后添加详细日志
const existingRaw = (existing as CanvasNodeData & { raw?: BoardTaskItem }).raw;
const mergedRaw = this.mergeTaskItem(existingRaw, item);

// 详细对比日志
console.log(`[CanvasRoom] Update comparison: taskId=${item.taskId}`, {
  existingStatus: existingRaw?.status,
  incomingStatus: item.status,
  statusChanged,
  existingResultKeys: existingRaw?.result ? Object.keys(existingRaw.result) : [],
  incomingResultKeys: item.result ? Object.keys(item.result) : [],
  hasResultData,
  isDeepEqual: existingRaw ? this.isDeepEqual(existingRaw, mergedRaw) : null,
  shouldRefreshMedia,
});
```

## 推荐修复顺序

1. **立即修复**: 采用方案1 + 方案3,确保状态变化时不会被跳过
2. **增强监控**: 采用方案4,添加详细日志,便于后续调试
3. **长期优化**: 评估 `isDeepEqual` 和 `deepMerge` 的必要性,考虑使用更简单的比较策略

## 验证方法

### 1. 本地测试

```bash
# 启动本地开发服务器
cd packages/server
npx wrangler dev

# 发送 append 命令
curl -X POST 'http://localhost:8787/commands?canvasId=test_canvas' \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "cmd_001",
    "source": "test",
    "type": "append_nodes",
    "payload": {
      "nodes": [{
        "taskId": "task_001",
        "status": "init",
        "mediaType": "video",
        "result": {}
      }]
    }
  }'

# 发送 update 命令
curl -X POST 'http://localhost:8787/commands?canvasId=test_canvas' \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "cmd_002",
    "source": "test",
    "type": "update_nodes",
    "payload": {
      "nodes": [{
        "taskId": "task_001",
        "status": "completed",
        "mediaType": "video",
        "result": {
          "originVideo": {
            "filePath": "/test/video.mp4",
            "width": 1024,
            "height": 1024
          }
        }
      }]
    }
  }'

# 检查日志输出
# 应该看到 "Forcing update due to status change" 而不是 "Skipping update"
```

### 2. 生产环境验证

1. 部署修复后的代码
2. 在 Cloudflare Dashboard 中查看日志
3. 确认不再出现 "Skipping update" 日志
4. 确认客户端能正确接收到 `NODE_UPDATED` 或 `NODES_UPDATED` 消息

## 相关文件

- `/packages/server/src/canvasRoom.ts`: 主要逻辑文件
- `/packages/server/src/types.ts`: 类型定义
- `/packages/server/src/utils/externalCommands.ts`: 外部命令解析

## 附录: 日志分析检查清单

当遇到类似问题时,检查以下日志:

1. ✅ "External command received" - 确认命令已接收
2. ✅ "Status change detected" - 确认状态变化被检测到
3. ⚠️ "Skipping update (no changes)" - **问题标志**: 即使状态变化也被跳过
4. ⚠️ "Skipping update (empty updates)" - **问题标志**: buildTaskItemUpdates 返回空
5. ✅ "Applying updates" - 确认更新被应用
6. ✅ "External command result" - 确认命令执行结果
7. ✅ "External command flushed" - 确认数据已持久化
