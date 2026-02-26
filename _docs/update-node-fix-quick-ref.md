# Update Node Skip Bug - 快速参考

## 问题症状

- ✅ 任务在后台系统中显示为 `completed`
- ❌ Canvas 中节点仍显示 `init` 状态(旋转加载圆圈)
- ❌ 日志中出现 `Skipping update (no changes)` 但同时有 `Status change detected`

## 快速诊断

### 1. 检查 Cloudflare 日志

在 Cloudflare Dashboard 的 Workers & Pages → Observability → Logs 中搜索:

```
[CanvasRoom] Status change detected
```

如果紧接着出现:

```
[CanvasRoom] Skipping update (no changes)
```

则说明 bug 存在。

### 2. 检查命令执行结果

搜索 `External command result`,查看 `updated` 和 `ignored` 的值:

```json
{
  "status": "applied",
  "updated": 0,    // ❌ 应该是 1
  "ignored": 1,    // ❌ 应该是 0
  "seq": 42
}
```

## 修复验证

### 修复后应该看到的日志

```
[CanvasRoom] External command received id=xxx type=update_nodes nodes=1
[CanvasRoom] Significant change detected: taskId=xxx
[CanvasRoom] Forcing update due to status/result change: taskId=xxx statusChanged=true hasResultChange=true
[CanvasRoom] Applying updates: taskId=xxx updateKeys=[raw,status,url,poster,size]
[CanvasRoom] External command result id=xxx status=applied updated=1 ignored=0 seq=43
[CanvasRoom] External command flushed immediately: id=xxx seq=43
```

### 关键指标

- `updated=1` ✅ (不是 0)
- `ignored=0` ✅ (不是 1)
- seq 递增 ✅
- 看到 "Forcing update" ✅
- 看到 "flushed immediately" ✅

## 本地测试

```bash
# 1. 启动开发服务器
cd packages/server
npx wrangler dev

# 2. 运行测试脚本
cd /Volumes/GeIL\ P4A\ 1TB\ Extend\ Disk/gitlab/Frontend/infinite-canvas
bash _docs/test-update-node-fix.sh

# 3. 查看实时日志
npx wrangler tail --format pretty
```

## 生产环境部署

```bash
# 1. 部署到 staging
cd packages/server
npx wrangler deploy --env staging

# 2. 监控日志
npx wrangler tail --env staging --format pretty

# 3. 验证通过后部署到生产
npx wrangler deploy

# 4. 监控生产日志
npx wrangler tail --format pretty
```

## 回滚步骤

如果出现问题:

```bash
# 1. 查看历史版本
npx wrangler deployments list

# 2. 回滚
npx wrangler rollback [DEPLOYMENT_ID]
```

## 关键代码位置

文件: `packages/server/src/canvasRoom.ts`

### 修复前 (有 bug)

```typescript:1343-1349
if (existingRaw && this.isDeepEqual(existingRaw, mergedRaw) && !shouldRefreshMedia) {
  console.log(`[CanvasRoom] Skipping update (no changes): ...`);
  summary.ignored += 1;
  continue;
}
```

### 修复后 (正确)

```typescript:1343-1370
if (statusChanged || hasResultChange) {
  console.log(`[CanvasRoom] Forcing update due to status/result change: ...`);
  // 跳过深度相等检查
} else if (existingRaw && this.isDeepEqual(existingRaw, mergedRaw) && !shouldRefreshMedia) {
  console.log(`[CanvasRoom] Skipping update (no changes): ...`);
  summary.ignored += 1;
  continue;
}

const updates = await this.buildTaskItemUpdates(mergedRaw, existing, source);

// 强制更新 raw 数据
if ((statusChanged || hasResultChange) && (!updates || Object.keys(updates).length === 0)) {
  console.warn(`[CanvasRoom] Empty updates but status/result changed, forcing raw update: ...`);
  const forcedUpdates: Partial<CanvasNodeData> = {
    raw: mergedRaw,
    status: mergedRaw.status,
  };
  Object.assign(existing, forcedUpdates);
  updatesBatch.push({ nodeId: existingId, updates: forcedUpdates });
  summary.updated += 1;
  continue;
}
```

## 相关文档

- 详细分析: `_docs/update-node-skip-bug-analysis.md`
- 修复总结: `_docs/update-node-fix-summary.md`
- 测试脚本: `_docs/test-update-node-fix.sh`
- 快速参考: `_docs/update-node-fix-quick-ref.md` (本文件)

## 常见问题

### Q: 为什么状态变化还会被跳过?

A: 因为原代码只检查了 `isDeepEqual(existingRaw, mergedRaw)`,没有优先处理状态变化的情况。

### Q: 为什么需要强制更新 raw 数据?

A: 即使媒体 URL 解析失败导致 `derived` 字段没有变化,客户端仍然需要知道状态已经改变,以便显示正确的 UI(例如从加载状态切换到错误状态)。

### Q: 修复后会不会导致过多的更新?

A: 不会。修复只针对状态或 result 变化的情况。完全相同的重复更新仍然会被正确跳过。

### Q: 如何验证客户端是否收到更新?

A: 在浏览器控制台中查看 WebSocket 消息:

```javascript
// 应该看到 NODES_UPDATED 消息
{
  type: 'nodes_updated',
  seq: 43,
  updates: [{
    nodeId: 'task:xxx',
    updates: {
      raw: {...},
      status: 'completed',
      url: '...',
      poster: '...',
      size: {...}
    }
  }]
}
```

## 联系支持

如果问题仍然存在,请提供:

1. Canvas ID
2. Task ID
3. Cloudflare 日志截图(包含完整的命令执行流程)
4. 客户端 WebSocket 消息截图
