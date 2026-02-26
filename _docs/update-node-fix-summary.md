# Update Node Skip Bug 修复总结

## 问题描述

在 Canvas 协作系统中发现一个严重 bug:当任务状态从 `init` 更新到 `completed` 时,虽然服务端收到了更新命令,但由于检查逻辑的漏洞,更新被错误地跳过,导致客户端仍然显示初始的加载状态,而不是完成后的视频内容。

## 根本原因

### 1. 过度的深度相等检查

原代码在 `update_nodes` 处理中使用了 `isDeepEqual` 来检查 `existingRaw` 和 `mergedRaw` 是否相等。但这个检查**没有考虑状态变化的特殊性**:

```typescript
// ❌ 问题代码
if (existingRaw && this.isDeepEqual(existingRaw, mergedRaw) && !shouldRefreshMedia) {
  console.log(`[CanvasRoom] Skipping update (no changes): ...`);
  summary.ignored += 1;
  continue;
}
```

即使 `status` 从 `init` 变为 `completed`,如果其他字段相似,`isDeepEqual` 可能返回 `true`,导致更新被跳过。

### 2. 空更新检查过于严格

即使通过了第一层检查,`buildTaskItemUpdates` 可能返回空对象:

```typescript
// ❌ 问题代码
const updates = await this.buildTaskItemUpdates(mergedRaw, existing, source);
if (!updates || Object.keys(updates).length === 0) {
  console.log(`[CanvasRoom] Skipping update (empty updates): ...`);
  summary.ignored += 1;
  continue;
}
```

这在以下情况下会出问题:
- 媒体 URL 尚未解析完成
- `result` 中的数据结构相同,但值不同
- 状态变化但衍生字段没有立即变化

### 3. 缺少 result 字段的变化检测

原代码只检测了 `status` 变化,但没有检测 `result` 字段的变化:

```typescript
// ✅ 已有
const statusChanged = existingStatus !== incomingStatus;

// ❌ 缺失
const hasResultChange = !this.isDeepEqual(existingRaw?.result, item.result);
```

## 修复方案

### 1. 添加 result 变化检测

```typescript
const hasResultChange = !this.isDeepEqual(existingRaw?.result, item.result);
```

### 2. 状态或 result 变化时强制更新

```typescript
if (statusChanged || hasResultChange) {
  console.log(
    `[CanvasRoom] Forcing update due to status/result change: taskId=${item.taskId}`
  );
  // 跳过深度相等检查
} else if (existingRaw && this.isDeepEqual(existingRaw, mergedRaw) && !shouldRefreshMedia) {
  // 只有在状态和 result 都没变化时才检查深度相等
  summary.ignored += 1;
  continue;
}
```

### 3. 空更新时强制更新 raw 数据

```typescript
if ((statusChanged || hasResultChange) && (!updates || Object.keys(updates).length === 0)) {
  console.warn(
    `[CanvasRoom] Empty updates but status/result changed, forcing raw update`
  );
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

### 4. 增强日志输出

```typescript
if (statusChanged || hasResultChange) {
  console.log(
    `[CanvasRoom] Significant change detected: taskId=${item.taskId}`,
    {
      existingStatus,
      incomingStatus,
      statusChanged,
      hasResultChange,
      existingResultKeys: existingRaw?.result ? Object.keys(existingRaw.result) : [],
      incomingResultKeys: item.result ? Object.keys(item.result) : [],
      hasResultData,
      shouldRefreshMedia,
    }
  );
}
```

## 修复效果

### 修复前

```
[CanvasRoom] Status change detected: taskId=xxx status=init->completed hasResult=true
[CanvasRoom] Skipping update (no changes): taskId=xxx status=completed
```

**结果**: 节点状态不更新,客户端继续显示加载动画

### 修复后

```
[CanvasRoom] Significant change detected: taskId=xxx
[CanvasRoom] Forcing update due to status/result change: taskId=xxx
[CanvasRoom] Applying updates: taskId=xxx updateKeys=[raw,status,url,poster,size]
```

**结果**: 节点成功更新,客户端显示完成后的视频

## 测试验证

运行测试脚本:

```bash
cd packages/server
npx wrangler dev

# 在另一个终端
cd /Volumes/GeIL\ P4A\ 1TB\ Extend\ Disk/gitlab/Frontend/infinite-canvas
bash _docs/test-update-node-fix.sh
```

预期输出:

```
✓ 节点创建成功
✓ 节点更新成功
✓ Result 变化时节点更新成功
✓ 序列号正确 (seq=3)
✓ 节点数量正确 (1 个节点)

所有测试通过! 修复有效!
```

## 影响范围

### 修复的场景

1. ✅ 任务状态从 `init` -> `processing` -> `completed` 的转换
2. ✅ 任务从 `processing` -> `failed` 的转换
3. ✅ 任务完成后 `result` 数据的添加或更新
4. ✅ 视频生成完成后 `originVideo` 数据的填充
5. ✅ 任何涉及 `result` 字段变化的更新

### 不影响的场景

1. ✅ 正常的节点位置更新 (drag)
2. ✅ 正常的节点属性更新 (如 title, rating)
3. ✅ 完全相同的重复更新 (仍然会被正确跳过)

## 部署建议

### 1. 测试环境部署

```bash
cd packages/server
npx wrangler deploy --env staging
```

### 2. 监控关键日志

部署后关注以下日志:

```bash
npx wrangler tail --env staging --format pretty
```

关键日志标记:
- ✅ "Forcing update due to status/result change" - 修复生效
- ⚠️ "Skipping update (no changes)" - 正常跳过
- ❌ "Skipping update" + "Status change detected" - 如果同时出现则说明修复失败

### 3. 生产环境部署

确认测试环境稳定后:

```bash
cd packages/server
npx wrangler deploy
```

### 4. 回滚计划

如果出现问题,可以快速回滚:

```bash
# 查看历史版本
npx wrangler deployments list

# 回滚到指定版本
npx wrangler rollback [DEPLOYMENT_ID]
```

## 相关文件

- **修复代码**: `/packages/server/src/canvasRoom.ts` (第 1324-1380 行)
- **问题分析**: `/_docs/update-node-skip-bug-analysis.md`
- **测试脚本**: `/_docs/test-update-node-fix.sh`
- **修复总结**: `/_docs/update-node-fix-summary.md` (本文件)

## 后续改进建议

### 短期 (1-2 周)

1. 添加单元测试覆盖 `update_nodes` 的各种场景
2. 添加集成测试验证客户端能正确接收更新
3. 监控生产环境的 "ignored" vs "updated" 比例

### 中期 (1-2 月)

1. 评估 `deepMerge` 和 `isDeepEqual` 的性能影响
2. 考虑引入版本号机制,避免过度依赖深度比较
3. 优化日志输出,减少不必要的序列化开销

### 长期 (3-6 月)

1. 重构外部命令处理逻辑,使用更清晰的状态机
2. 添加更多的端到端测试
3. 考虑使用消息队列确保更新的顺序性和可靠性

## 总结

这次修复解决了一个关键的状态同步问题,确保了:

1. ✅ 任务状态变化能够正确传播到客户端
2. ✅ 任务完成后的媒体数据能够正确显示
3. ✅ 不会因为过度的相等性检查而跳过重要更新
4. ✅ 保留了对真正重复更新的跳过逻辑

修复后的代码更加健壮,日志更加详细,便于后续的调试和维护。
