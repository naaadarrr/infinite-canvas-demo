# Update Node Skip Bug 修复 - 最终优化版本

## 核心思路优化

根据实际业务逻辑,修复方案进一步简化:

### 关键判断逻辑

**只要 incoming 数据有 `result` 字段,就直接更新,无需复杂的深度比较。**

理由:
1. `result` 字段是任务完成后的产出数据,一定是新的内容
2. 有 `result` 说明任务已经执行完成或有新的产出
3. 不需要逐字段比较,直接更新即可
4. 简化逻辑,提高性能,减少 bug

### 尺寸计算优化

**从 `result` 中的实际媒体资源计算真实尺寸,而不是依赖 `parameters.aspectRatio`。**

原因:
1. 视频/图片的实际尺寸可能与输入参数不同
2. 有些任务没有 `aspectRatio` 参数
3. 实际资源的 width/height 是最可靠的数据源

优先级:
```
result.originVideo/originImage 的实际 width/height (真实比例)
  ↓ (如果没有)
parameters.aspectRatio (用户输入参数)
  ↓ (如果没有)
默认正方形 (450x450)
```

## 修复代码

### 1. 简化的判断逻辑

```typescript:1324-1367:packages/server/src/canvasRoom.ts
const existingRaw = (existing as CanvasNodeData & { raw?: BoardTaskItem }).raw;
const mergedRaw = this.mergeTaskItem(existingRaw, item);
const normalizedType = this.resolveTaskNodeType(item.mediaType, existing);

// 【优化】简化判断逻辑: 只要 incoming 有 result 数据就强制更新
const existingStatus = existingRaw?.status;
const incomingStatus = item.status;
const statusChanged = existingStatus !== incomingStatus;
const hasResultData = item.result && Object.keys(item.result).length > 0;

// 关键判断: 状态变化或有 result 数据时,直接更新,无需深度比较
const shouldForceUpdate = statusChanged || hasResultData;

if (shouldForceUpdate) {
  console.log(
    `[CanvasRoom] Forcing update: taskId=${item.taskId} statusChanged=${statusChanged} hasResult=${hasResultData} status=${existingStatus}->${incomingStatus}`
  );
} else {
  // 只有在没有状态变化且没有 result 数据时,才进行深度相等检查
  const shouldRefreshMedia = normalizedType
    ? this.shouldRefreshMedia(existing, normalizedType)
    : false;
  
  if (existingRaw && this.isDeepEqual(existingRaw, mergedRaw) && !shouldRefreshMedia) {
    console.log(
      `[CanvasRoom] Skipping update (no changes): taskId=${item.taskId} status=${incomingStatus}`
    );
    summary.ignored += 1;
    continue;
  }
}
```

**逻辑说明**:
- ✅ 有 `result` 数据 → 强制更新
- ✅ 状态变化 → 强制更新
- ⚠️ 都没有 → 深度相等检查
- ❌ 完全相同 → 跳过更新

### 2. 优化的尺寸计算

```typescript:1561-1590:packages/server/src/canvasRoom.ts
private resolveTaskResultSize(
  item: BoardTaskItem,
  type: NodeType,
  existingSize?: Size
): Size | null {
  const { nodeWidth, nodeHeight } = this.externalLayoutConfig;
  const result = item.result ?? undefined;

  // 【优化】优先使用 result 中的实际资源尺寸,计算真实比例
  const resources =
    type === NodeType.IMAGE
      ? [result?.originImage, result?.compressedImage]
      : [result?.originVideo, result?.originImage];
  
  // 从实际资源中获取真实的宽高比
  const actualAspectRatio = this.resolveAspectRatioFromResources(resources);
  if (actualAspectRatio) {
    console.log(
      `[CanvasRoom] Using actual aspect ratio from result: taskId=${item.taskId} ratio=${actualAspectRatio.toFixed(3)} (${resources[0]?.width}x${resources[0]?.height})`
    );
    return this.resolveNodeSize(nodeWidth, nodeHeight, actualAspectRatio);
  }

  // 备选方案: 使用 parameters 中的 aspectRatio
  const paramAspectRatio = this.resolveAspectRatioFromParameters(item.parameters);
  if (paramAspectRatio) {
    console.log(
      `[CanvasRoom] Using aspect ratio from parameters: taskId=${item.taskId} ratio=${paramAspectRatio.toFixed(3)}`
    );
    return this.resolveNodeSize(nodeWidth, nodeHeight, paramAspectRatio);
  }

  // 如果都没有,返回 null 表示不更新尺寸(保持现有尺寸)
  return null;
}
```

## 优化效果

### 修复前 (复杂且有 bug)

```typescript
// ❌ 复杂的逻辑
const statusChanged = existingStatus !== incomingStatus;
const hasResultChange = !this.isDeepEqual(existingRaw?.result, item.result);

if (statusChanged || hasResultChange) {
  // 详细的对比日志
  // 多层嵌套判断
}
```

### 修复后 (简洁且准确)

```typescript
// ✅ 简洁的逻辑
const statusChanged = existingStatus !== incomingStatus;
const hasResultData = item.result && Object.keys(item.result).length > 0;
const shouldForceUpdate = statusChanged || hasResultData;

if (shouldForceUpdate) {
  console.log(`[CanvasRoom] Forcing update: ...`);
}
```

## 优势对比

| 方面 | 之前的修复 | 优化后的修复 |
|------|-----------|-------------|
| 判断逻辑 | 复杂的 `isDeepEqual` 比较 | 简单的 `hasResultData` 检查 |
| 性能 | 需要深度遍历比较对象 | 只检查 result 是否存在 |
| 准确性 | 可能漏掉 result 内部变化 | 只要有 result 就更新 |
| 可维护性 | 逻辑复杂,难以理解 | 逻辑清晰,易于维护 |
| 尺寸计算 | 优先用户参数 | 优先实际资源尺寸 |
| 日志 | 详细但冗长 | 简洁且有效 |

## 典型场景

### 场景1: 任务完成,添加 result

```json
// Update 请求
{
  "taskId": "xxx",
  "status": "completed",
  "result": {
    "originVideo": {
      "filePath": "/path/to/video.mp4",
      "width": 1920,
      "height": 1080
    }
  }
}
```

**处理流程**:
1. `hasResultData = true` ✅
2. `shouldForceUpdate = true` ✅
3. 强制更新,跳过深度比较
4. 从 `originVideo.width/height` 计算尺寸 (1920x1080 → 16:9)
5. 更新节点数据并广播

### 场景2: 状态变化但无 result

```json
// Update 请求
{
  "taskId": "xxx",
  "status": "processing",
  "result": {}
}
```

**处理流程**:
1. `statusChanged = true` ✅ (init → processing)
2. `hasResultData = false` (result 为空)
3. `shouldForceUpdate = true` ✅
4. 强制更新,至少更新 status

### 场景3: 完全相同的重复请求

```json
// Update 请求 (与现有数据完全相同)
{
  "taskId": "xxx",
  "status": "completed",
  "result": {} // 空的 result
}
```

**处理流程**:
1. `statusChanged = false`
2. `hasResultData = false` (result 为空)
3. `shouldForceUpdate = false`
4. 进入深度相等检查
5. `isDeepEqual = true`
6. 跳过更新 ✅ (正确行为)

## 关键日志

### 强制更新日志

```
[CanvasRoom] Forcing update: taskId=xxx statusChanged=true hasResult=true status=init->completed
[CanvasRoom] Using actual aspect ratio from result: taskId=xxx ratio=1.778 (1920x1080)
[CanvasRoom] Updating node size: taskId=xxx oldSize=450x450 newSize=450x253
[CanvasRoom] Applying updates: taskId=xxx updateKeys=[raw,status,url,poster,size]
```

### 跳过更新日志

```
[CanvasRoom] Skipping update (no changes): taskId=xxx status=completed
```

## 性能优势

1. **减少深度比较**: 只有在必要时才进行 `isDeepEqual`,大多数情况下直接更新
2. **准确的尺寸**: 使用实际资源尺寸,避免比例不一致的问题
3. **简化逻辑**: 代码更简洁,更容易理解和维护
4. **更少的 CPU 消耗**: 避免不必要的对象遍历和比较

## 测试验证

运行测试脚本应该看到:

```bash
✓ 节点创建成功
✓ 节点更新成功 (有 result 数据)
✓ Result 变化时节点更新成功
✓ 使用实际资源尺寸计算
✓ 序列号正确递增
```

## 总结

这次优化遵循了**简单即是美**的原则:

1. ✅ **业务驱动**: 基于实际业务逻辑(有 result 就更新)
2. ✅ **性能优化**: 减少不必要的深度比较
3. ✅ **准确可靠**: 使用实际资源尺寸,而非用户参数
4. ✅ **易于维护**: 代码简洁清晰,逻辑一目了然

**核心理念**: 不要过度设计,实际业务中有 `result` 字段就说明有新的内容,直接更新即可,无需逐字段比较。
