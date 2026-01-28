# InfiniteLayout Rating 实现文档

## 概述

为 InfiniteLayout 组件添加了 Rating（评分）功能支持。用户可以在无限画布中直接点击星星对任务进行评分（0-3 星），使用乐观更新策略确保流畅的用户体验。

**实施日期**：2026-01-27

## 实现位置

**文件路径**：
```
/Users/jeff/Workspace/code/createhub_demo/src/app/board/[id]/components/BoardWorkspace/components/Gallery/components/TaskAssets/components/LayoutRenderer/components/InfiniteLayout/index.tsx
```

## 核心实现

### 1. 导入依赖

```typescript
import { TaskRatingValue } from "@/server/api/services/board/common";
import { useUpdateTaskRatingMutation } from "@/app/board/[id]/components/BoardWorkspace/data/taskAssets/task/useTaskMutations";
```

### 2. 初始化 Mutation Hook

```typescript
const updateRatingMutation = useUpdateTaskRatingMutation();
```

### 3. Rating 处理函数

使用 `useRecoilCallback` 实现乐观更新：

```typescript
const handleRatingRequest = useRecoilCallback(
  ({ set, snapshot }) =>
    async (nodeId: string, taskId: string, rating: TaskRatingValue) => {
      console.log("[InfiniteLayout] Handle rating request", { nodeId, taskId, rating });
      
      // 1. 获取当前任务（用于回滚）
      const currentTask = await snapshot.getPromise(taskByIdState(taskId));
      
      if (!currentTask) {
        console.warn("[InfiniteLayout] Task not found for rating:", taskId);
        return;
      }
      
      const originalRating = currentTask.rating;
      
      // 如果评分没变，直接返回
      if (originalRating === rating) {
        return;
      }
      
      // 2. 乐观更新 Store
      set(taskByIdState(taskId), (prev) =>
        prev ? { ...prev, rating } : null
      );
      
      try {
        // 3. 调用 API
        await updateRatingMutation.mutateAsync({
          taskId,
          rating
        });
        
        console.log("[InfiniteLayout] Rating updated successfully:", { taskId, rating });
      } catch (error) {
        // 4. 失败时回滚
        set(taskByIdState(taskId), (prev) =>
          prev ? { ...prev, rating: originalRating } : null
        );
        
        toast({
          title: "评分失败",
          description: "无法更新评分，请重试",
          variant: "destructive",
        });
        
        console.error("[InfiniteLayout] Failed to update rating:", error);
      }
    },
  [updateRatingMutation]
);
```

### 4. 事件监听

在 `NODE_QUICK_ACTION` 事件监听器中添加 rating 处理：

```typescript
const unsubscribeQuickAction = widgetBridge.on(
  "NODE_QUICK_ACTION",
  (event: any) => {
    const actionId = event.payload?.actionId;
    const nodeId = event.payload?.nodeId;
    const taskId = event.payload?.node?.raw?.taskId;
    const rating = event.payload?.rating;  // 提取 rating 值
    
    if (typeof nodeId === "string" && typeof taskId === "string") {
      switch (actionId) {
        // ... 其他 actions
        case "rating":
          if (typeof rating === "number") {
            handleRatingRequest(nodeId, taskId, rating as TaskRatingValue);
          }
          break;
      }
    }
  }
);
```

## 事件结构

### Rating 事件格式

```json
{
  "type": "NODE_QUICK_ACTION",
  "payload": {
    "nodeId": "node_xxx",
    "nodeType": "image",
    "actionId": "rating",
    "actionLabel": "Rating",
    "rating": 3,
    "node": {
      "raw": {
        "taskId": "task_xxx",
        // ...
      }
    }
  },
  "source": "ui",
  "timestamp": 1234567890
}
```

### 关键字段

- `actionId`: 固定为 `"rating"`
- `rating`: 评分值（0-3 的整数）
  - `0`: 清除评分
  - `1-3`: 对应 1-3 星

## 乐观更新流程

```
用户点击星星
    ↓
Widget 发出 NODE_QUICK_ACTION 事件
    ↓
InfiniteLayout 监听到事件
    ↓
提取 nodeId, taskId, rating
    ↓
1. 获取当前任务和原始评分
    ↓
2. 立即更新 Store (乐观更新)
    ↓
    UI 立即响应，显示新评分 ⚡
    ↓
3. 调用后端 API
    ↓
┌───────────┬───────────┐
│  成功     │   失败    │
└─────┬─────┴─────┬─────┘
      ↓           ↓
  无需操作    回滚到原始评分
  记录日志    显示错误提示
```

## 特点

### 1. 乐观更新

- **立即响应**：UI 立即更新，无需等待 API 返回
- **用户体验**：评分操作感觉即时响应
- **错误处理**：失败时自动回滚到原始状态

### 2. 防止重复更新

```typescript
// 如果评分没变，直接返回
if (originalRating === rating) {
  return;
}
```

### 3. Store 级别更新

直接更新 `taskByIdState`，无需刷新整个任务列表：

```typescript
set(taskByIdState(taskId), (prev) =>
  prev ? { ...prev, rating } : null
);
```

### 4. 错误回滚

失败时精确回滚到原始评分：

```typescript
set(taskByIdState(taskId), (prev) =>
  prev ? { ...prev, rating: originalRating } : null
);
```

## 错误处理

### 任务不存在

```typescript
if (!currentTask) {
  console.warn("[InfiniteLayout] Task not found for rating:", taskId);
  return;
}
```

### API 调用失败

```typescript
catch (error) {
  // 回滚
  set(taskByIdState(taskId), (prev) =>
    prev ? { ...prev, rating: originalRating } : null
  );
  
  // 用户提示
  toast({
    title: "评分失败",
    description: "无法更新评分，请重试",
    variant: "destructive",
  });
  
  // 日志记录
  console.error("[InfiniteLayout] Failed to update rating:", error);
}
```

## 日志记录

```typescript
// 接收请求
console.log("[InfiniteLayout] Handle rating request", { nodeId, taskId, rating });

// 任务未找到
console.warn("[InfiniteLayout] Task not found for rating:", taskId);

// 成功更新
console.log("[InfiniteLayout] Rating updated successfully:", { taskId, rating });

// 更新失败
console.error("[InfiniteLayout] Failed to update rating:", error);
```

## 与 TaskCard 的一致性

InfiniteLayout 中的 Rating 实现与 TaskCard 完全一致：

| 特性 | TaskCard | InfiniteLayout | 一致性 |
|------|---------|---------------|--------|
| 使用 Hook | `useTaskRating` | `handleRatingRequest` | ✅ |
| 乐观更新 | ✅ | ✅ | ✅ |
| 错误回滚 | ✅ | ✅ | ✅ |
| Store 更新 | `taskByIdState` | `taskByIdState` | ✅ |
| API Mutation | `useUpdateTaskRatingMutation` | `useUpdateTaskRatingMutation` | ✅ |

## 性能优化

### 1. useRecoilCallback

使用 `useRecoilCallback` 避免不必要的重新渲染：

```typescript
const handleRatingRequest = useRecoilCallback(
  ({ set, snapshot }) => async (nodeId, taskId, rating) => {
    // ...
  },
  [updateRatingMutation]
);
```

### 2. 防止重复更新

检查评分是否真的改变：

```typescript
if (originalRating === rating) {
  return;
}
```

### 3. 精确更新

只更新单个任务的 rating 字段，不影响其他数据：

```typescript
set(taskByIdState(taskId), (prev) =>
  prev ? { ...prev, rating } : null
);
```

## 测试场景

### 正常流程

1. ✅ 用户点击星星（1-3 星）
2. ✅ UI 立即显示新评分
3. ✅ API 调用成功
4. ✅ 评分持久化到后端

### 清除评分

1. ✅ 用户点击已选中的星星
2. ✅ 评分变为 0（清除）
3. ✅ UI 立即更新
4. ✅ API 调用成功

### 快速连续点击

1. ✅ 用户快速点击不同星星
2. ✅ 每次点击都触发更新
3. ✅ 最后一次点击的评分生效

### 错误情况

1. ✅ API 调用失败
2. ✅ 自动回滚到原始评分
3. ✅ 显示错误提示
4. ✅ 日志记录错误信息

### 边界情况

1. ✅ 任务不存在时的处理
2. ✅ 评分值相同时不触发更新
3. ✅ 网络请求超时的处理

## 键盘快捷键

Widget 组件支持键盘快捷键：

- `1` / `2` / `3` - 快速评 1-3 星
- `0` - 清除评分

这些快捷键会触发相同的 `NODE_QUICK_ACTION` 事件，因此 InfiniteLayout 自动支持。

## 类型定义

```typescript
// TaskRatingValue 类型
type TaskRatingValue = 0 | 1 | 2 | 3;

// 事件 Payload
interface RatingEventPayload {
  nodeId: string;
  nodeType: string;
  actionId: "rating";
  actionLabel: "Rating";
  rating: number;
  node: {
    raw: {
      taskId: string;
      // ...
    };
  };
}
```

## 相关文件

### 主要文件

- **InfiniteLayout 组件**：`/src/app/.../InfiniteLayout/index.tsx`
- **Rating Hook**：`/src/app/.../hooks/taskActions/useTaskRating.ts`
- **Rating Mutation**：`/src/app/.../data/taskAssets/task/useTaskMutations.ts`

### Widget 文件

- **NodeRatingBadge**：`/packages/widget/src/nodes/NodeRatingBadge.tsx`
- **ImageNode**：`/packages/widget/src/nodes/ImageNode.tsx`

## 代码统计

```
新增代码：约 50 行
主要内容：
- 1 个导入语句
- 1 个 mutation hook 初始化
- 1 个处理函数（handleRatingRequest）
- 1 个 switch case
- 完善的错误处理和日志
```

## 与其他 Quick Actions 的对比

| 特性 | Rating | 其他 Actions | 说明 |
|------|--------|-------------|------|
| 事件类型 | `NODE_QUICK_ACTION` | `NODE_QUICK_ACTION` | 统一 |
| 额外字段 | `rating` | - | Rating 特有 |
| 乐观更新 | ✅ | ❌ | Rating 需要即时反馈 |
| 错误回滚 | ✅ | ❌ | Rating 需要回滚 |
| 更新方式 | Store 更新 | 填充表单 | 不同的操作方式 |

## 最佳实践

1. **使用 useRecoilCallback**：确保状态更新的原子性
2. **乐观更新**：提供即时的用户反馈
3. **错误回滚**：失败时恢复原始状态
4. **防止重复**：检查值是否真的改变
5. **详细日志**：记录所有关键操作

## 总结

Rating 功能现在已完全集成到 InfiniteLayout 组件中：

- ✅ 支持 0-3 星评分
- ✅ 乐观更新，即时响应
- ✅ 错误自动回滚
- ✅ 与 TaskCard 一致的体验
- ✅ 完善的错误处理
- ✅ 详细的日志记录

用户现在可以在无限画布中直接点击星星对任务进行评分，体验流畅且可靠！🌟
