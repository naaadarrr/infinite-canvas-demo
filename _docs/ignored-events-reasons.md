# Ignored Events 完整原因日志

## 概述

为了更好地诊断和调试外部命令处理,我们为所有 `ignored` 事件添加了详细的原因说明。每个被忽略的操作都会打印包含 `Reason=` 的日志。

---

## Append Nodes (创建节点) - 可能的 Ignored 原因

### 1. 无效的 item 或缺少 taskId

**触发条件**: item 为空或 taskId 不是字符串

**日志格式**:
```
[CanvasRoom] Ignored append_nodes: Reason=Invalid item or missing taskId, item={"..."}
```

**原因分析**:
- payload.nodes 数组中包含了 null/undefined 元素
- item.taskId 字段缺失或不是字符串类型
- 数据格式错误

**解决方案**:
- 检查外部系统发送的数据格式
- 确保每个 item 都有有效的 taskId 字段

---

### 2. 节点已存在

**触发条件**: 该 taskId 的节点已经在画布中

**日志格式**:
```
[CanvasRoom] Ignored append_nodes: Reason=Node already exists, taskId=task_123, existingNodeId=task:task_123
```

**原因分析**:
- 重复发送 append 命令
- 任务系统重试导致重复创建
- 命令去重机制未生效

**解决方案**:
- 这是正常的防重机制,无需处理
- 如果频繁出现,检查外部系统的命令去重逻辑

---

### 3. 无法构建节点

**触发条件**: buildNodeFromTaskItem 返回 null

**日志格式**:
```
[CanvasRoom] Ignored append_nodes: Reason=Failed to build node, taskId=task_123, mediaType=unknown
```

**原因分析**:
- mediaType 不支持 (不是 image/video/audio/text)
- mediaType 字段缺失或格式错误
- normalizeTaskMediaType 返回 null

**解决方案**:
- 检查 item.mediaType 字段
- 确保 mediaType 是支持的类型: `image`, `video`, `audio`, `text`

---

## Update Nodes (更新节点) - 可能的 Ignored 原因

### 1. 无效的 item 或缺少 taskId

**触发条件**: item 为空或 taskId 不是字符串

**日志格式**:
```
[CanvasRoom] Ignored update_nodes: Reason=Invalid item or missing taskId, item={"..."}
```

**原因分析**: 同 append_nodes #1

---

### 2. 节点不存在

**触发条件**: 找不到对应 taskId 的节点

**日志格式**:
```
[CanvasRoom] Ignored update_nodes: Reason=Node not found, taskId=task_123, source=board
```

**原因分析**:
- 节点从未创建 (漏掉了 append_nodes)
- 节点已被删除
- taskId 不匹配

**解决方案**:
- 确保先发送 append_nodes,再发送 update_nodes
- 检查 taskId 是否正确
- 可能需要改用 upsert_nodes (先尝试更新,失败则创建)

---

### 3. 节点索引不一致

**触发条件**: findNodeIdByTaskId 找到了 ID,但 nodes Map 中不存在

**日志格式**:
```
[CanvasRoom] Ignored update_nodes: Reason=Node exists in index but not in memory, taskId=task_123, nodeId=task:task_123
```

**原因分析**:
- 内存状态不一致 (严重 bug)
- 并发操作导致状态损坏

**解决方案**:
- 这是异常情况,需要立即排查
- 检查是否有并发删除操作
- 考虑重启 DO 实例

---

### 4. 无变化 (深度相等)

**触发条件**: 没有状态变化,没有 result 数据,且深度比较相等

**日志格式**:
```
[CanvasRoom] Ignored update_nodes: Reason=No changes detected (deep equal), taskId=task_123, status=completed, shouldRefreshMedia=false
```

**原因分析**:
- 完全相同的重复更新
- 所有字段都没有变化
- 媒体 URL 也不需要刷新

**解决方案**:
- 这是正常的优化行为,无需处理
- 如果业务上确实需要更新,确保至少一个字段有变化

---

### 5. 空更新 (buildTaskItemUpdates 返回空)

**触发条件**: buildTaskItemUpdates 计算后没有需要更新的字段

**日志格式**:
```
[CanvasRoom] Ignored update_nodes: Reason=Empty updates (buildTaskItemUpdates returned nothing), taskId=task_123, status=completed, nodeType=video
```

**原因分析**:
- derived 字段 (url, poster, size 等) 计算后与现有值相同
- raw 数据相同
- 所有可更新的字段都没有变化

**解决方案**:
- 检查是否真的有新数据
- 如果 result 有变化,应该会触发强制更新 (不会走到这里)
- 可能是媒体 URL 解析失败导致

---

## Delete Nodes (删除节点) - 可能的 Ignored 原因

### 1. 无效的 item 或缺少 taskId

**触发条件**: item 为空或 taskId 不是字符串

**日志格式**:
```
[CanvasRoom] Ignored delete_nodes: Reason=Invalid item or missing taskId, item={"..."}
```

**原因分析**: 同 append_nodes #1

---

### 2. 节点不存在

**触发条件**: 找不到对应 taskId 的节点

**日志格式**:
```
[CanvasRoom] Ignored delete_nodes: Reason=Node not found, taskId=task_123, source=board
```

**原因分析**:
- 节点从未创建
- 节点已被删除 (重复删除)
- taskId 不匹配

**解决方案**:
- 这通常是正常的幂等性保证
- 如果频繁出现,检查删除命令的去重逻辑

---

### 3. 节点索引不一致

**触发条件**: findNodeIdByTaskId 找到了 ID,但 nodes Map 中不存在

**日志格式**:
```
[CanvasRoom] Ignored delete_nodes: Reason=Node exists in index but not in memory, taskId=task_123, nodeId=task:task_123
```

**原因分析**: 同 update_nodes #3 (严重 bug)

---

## 日志搜索技巧

### 查看所有 ignored 事件

```bash
npx wrangler tail --format pretty | grep "Ignored"
```

### 按原因分类

```bash
# 查看无效 item
npx wrangler tail --format pretty | grep "Reason=Invalid item"

# 查看节点已存在
npx wrangler tail --format pretty | grep "Reason=Node already exists"

# 查看节点不存在
npx wrangler tail --format pretty | grep "Reason=Node not found"

# 查看无变化
npx wrangler tail --format pretty | grep "Reason=No changes detected"

# 查看空更新
npx wrangler tail --format pretty | grep "Reason=Empty updates"
```

### 按 taskId 搜索

```bash
npx wrangler tail --format pretty | grep "taskId=task_123"
```

---

## 日志格式规范

所有 ignored 日志遵循统一格式:

```
[CanvasRoom] Ignored <command_type>: Reason=<原因>, <关键字段1>=<值1>, <关键字段2>=<值2>
```

**字段说明**:
- `<command_type>`: append_nodes / update_nodes / delete_nodes
- `Reason=`: 被忽略的具体原因
- 后续字段: 帮助诊断的关键信息 (taskId, nodeId, status, mediaType 等)

---

## 监控建议

### 正常的 ignored 比例

| 命令类型 | 正常 ignored 比例 | 异常阈值 |
|---------|------------------|---------|
| append_nodes | < 5% | > 10% |
| update_nodes | < 10% | > 30% |
| delete_nodes | < 5% | > 10% |

### 需要告警的情况

1. **"Node exists in index but not in memory"**
   - 严重程度: 🔴 Critical
   - 表示状态不一致,需要立即排查

2. **"Failed to build node" 大量出现**
   - 严重程度: 🟡 Warning
   - 可能是 mediaType 数据格式问题

3. **"Node not found" (update_nodes) > 30%**
   - 严重程度: 🟡 Warning
   - 可能是命令顺序问题或丢失 append 命令

4. **"Node already exists" (append_nodes) > 10%**
   - 严重程度: 🟢 Info
   - 可能是重试过多,检查外部系统的重试策略

---

## 故障排查流程

### 步骤 1: 查看日志

```bash
npx wrangler tail --format pretty | grep "Ignored"
```

### 步骤 2: 分析原因

根据 `Reason=` 字段,对照上面的原因列表

### 步骤 3: 检查数据

```bash
# 查看命令详情
npx wrangler tail --format pretty | grep "External command received"

# 查看命令结果
npx wrangler tail --format pretty | grep "External command result"
```

### 步骤 4: 验证节点状态

```bash
# 查看房间状态
curl http://localhost:8787/admin/rooms/{canvasId}

# 查看 DO Storage
npx wrangler durable-objects:storage get \
  --name infinite-canvas-collab-worker \
  --id "{canvasId}" \
  --key state \
  --pretty
```

---

## 示例日志分析

### 案例 1: 正常的重复 append

```
[CanvasRoom] External command received id=cmd_001 source=board type=append_nodes nodes=1
[CanvasRoom] Ignored append_nodes: Reason=Node already exists, taskId=task_123, existingNodeId=task:task_123
[CanvasRoom] External command result id=cmd_001 status=applied created=0 updated=0 deleted=0 ignored=1 seq=42
```

**分析**: 正常的防重机制,无需处理

---

### 案例 2: 异常的节点不存在

```
[CanvasRoom] External command received id=cmd_002 source=board type=update_nodes nodes=1
[CanvasRoom] Ignored update_nodes: Reason=Node not found, taskId=task_456, source=board
[CanvasRoom] External command result id=cmd_002 status=applied created=0 updated=0 deleted=0 ignored=1 seq=42
```

**分析**: update 但节点不存在,可能漏掉了 append 命令

**解决方案**: 
1. 检查外部系统是否发送了 append_nodes
2. 考虑使用 upsert_nodes 替代 update_nodes

---

### 案例 3: 严重的状态不一致

```
[CanvasRoom] External command received id=cmd_003 source=board type=update_nodes nodes=1
[CanvasRoom] Ignored update_nodes: Reason=Node exists in index but not in memory, taskId=task_789, nodeId=task:task_789
[CanvasRoom] External command result id=cmd_003 status=applied created=0 updated=0 deleted=0 ignored=1 seq=42
```

**分析**: 🔴 严重 bug,状态不一致

**解决方案**:
1. 立即检查 DO 实例状态
2. 考虑重启 DO 实例
3. 排查并发操作导致的问题

---

## 总结

通过详细的 ignored 原因日志,我们可以:

1. ✅ 快速定位问题根源
2. ✅ 区分正常行为和异常情况
3. ✅ 监控系统健康状态
4. ✅ 优化外部系统的命令发送逻辑
5. ✅ 提高调试效率

所有 ignored 事件都有明确的 `Reason=` 说明,配合其他关键字段 (taskId, nodeId, status 等),可以快速诊断和解决问题。
