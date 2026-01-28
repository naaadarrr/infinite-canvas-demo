# InfiniteLayout Quick Actions 快速参考

## 快速概览

所有 Quick Actions 通过 `NODE_QUICK_ACTION` 事件触发，根据 `actionId` 分发到不同的处理函数。

## 核心代码

### 事件监听和分发

```typescript
useEffect(() => {
  const unsubscribeQuickAction = widgetBridge.on(
    "NODE_QUICK_ACTION",
    (event: any) => {
      const actionId = event.payload?.actionId;
      const nodeId = event.payload?.nodeId;
      const taskId = event.payload?.node?.raw?.taskId;
      
      if (typeof nodeId === "string" && typeof taskId === "string") {
        switch (actionId) {
          case "edit":
            handleReEditRequest(nodeId, taskId);
            break;
          case "reference":
            handleRemixRequest(nodeId, taskId);
            break;
          case "inpaint":
            handleInpaintRequest(nodeId, taskId);
            break;
          case "video":
            handleGenerateVideoRequest(nodeId, taskId);
            break;
          case "ocr":
            handleOcrRequest(nodeId, taskId);
            break;
          default:
            console.log("[InfiniteLayout] Unhandled quick action:", actionId);
        }
      }
    }
  );

  return () => {
    unsubscribeQuickAction();
  };
}, [
  handleReEditRequest,
  handleRemixRequest,
  handleInpaintRequest,
  handleGenerateVideoRequest,
  handleOcrRequest
]);
```

## Action ID 速查表

| Action ID | 中文名 | 功能 | 状态 |
|-----------|--------|------|------|
| `edit` | 重新编辑 | 填充原始参数到工具面板 | ✅ |
| `reference` | 混音/参考 | 设置为参考图 | ✅ |
| `inpaint` | 局部重绘 | 打开 Inpaint 对话框 | ✅ |
| `video` | 生成视频 | 设置为视频首帧 | ✅ |
| `rating` | 评分 | 0-3 星评分（乐观更新） | ✅ |
| `ocr` | 编辑文字 | OCR 文字识别 | 🚧 |
| `lipsync` | AI Avatar | 口型同步 | ⏳ |
| `upscale` | 放大 | 图片/视频放大 | ⏳ |

## 快速实现模板

### 基础模板

```typescript
const handleXxxRequest = useCallback(
  (nodeId: string, taskId: string) => {
    // 1. 查找任务
    const task = tasks.find((t) => t.taskId === taskId);
    
    // 2. 验证任务存在
    if (!task) {
      toast({ title: "任务未找到", variant: "destructive" });
      return;
    }
    
    // 3. 获取必要数据（如果需要）
    const imageUrl = getOriginUrl(task) || getThumbnailUrl(task);
    if (!imageUrl) {
      toast({ 
        title: "无法执行操作",
        description: "该任务没有可用的图片输出",
        variant: "destructive"
      });
      return;
    }
    
    // 4. 执行操作
    fillToolForm({
      toolType: ToolType.XxxTool,
      parameter: imageUrl
    });
  },
  [tasks, fillToolForm]
);
```

### 填充工具表单

```typescript
// Re-edit - 使用原始参数
fillToolForm({
  toolType: task.toolType as ToolType,
  ...task.parameters
});

// 设置参考图 - 数组格式
fillToolForm({
  toolType: ToolType.ImageEdit,
  referenceImages: [imageUrl]
});

// 设置首帧图片
fillToolForm({
  toolType: ToolType.ImageToVideo,
  firstFrameImage: imageUrl
});
```

### 打开对话框

```typescript
// Inpaint 对话框
setCurrentInpaintTask(task);
inpaintModal.open();
```

### 乐观更新（Rating）

```typescript
// 使用 useRecoilCallback 实现乐观更新
const handleRatingRequest = useRecoilCallback(
  ({ set, snapshot }) =>
    async (nodeId: string, taskId: string, rating: TaskRatingValue) => {
      const currentTask = await snapshot.getPromise(taskByIdState(taskId));
      const originalRating = currentTask.rating;
      
      // 乐观更新
      set(taskByIdState(taskId), (prev) =>
        prev ? { ...prev, rating } : null
      );
      
      try {
        await updateRatingMutation.mutateAsync({ taskId, rating });
      } catch (error) {
        // 失败时回滚
        set(taskByIdState(taskId), (prev) =>
          prev ? { ...prev, rating: originalRating } : null
        );
      }
    },
  [updateRatingMutation]
);
```

## 关键点

### ✅ DO

- ✅ 始终验证任务存在
- ✅ 验证必要的数据（如图片 URL）
- ✅ 提供友好的错误提示
- ✅ 使用 `useCallback` 缓存处理函数
- ✅ 在依赖数组中包含所有处理函数
- ✅ 使用 `getOriginUrl` 获取高质量图片

### ❌ DON'T

- ❌ 不要直接访问 `task.result.url`
- ❌ 不要忘记错误处理
- ❌ 不要在依赖数组中遗漏处理函数
- ❌ 不要使用错误的参数名（如 `referenceImage` 应为 `referenceImages`）

## 常用工具类型

```typescript
ToolType.ImageEdit          // 图片编辑
ToolType.ImageToVideo       // 图片转视频
ToolType.Inpaint           // Inpaint
ToolType.AiAvatar          // AI Avatar (图片)
ToolType.VideoLipSync      // 口型同步 (视频)
ToolType.ImageUpscale      // 图片放大
ToolType.VideoUpscale      // 视频放大
```

## 常用参数名

```typescript
// 图片参数
referenceImages: string[]   // 参考图片（数组）
firstFrameImage: string     // 首帧图片
lastFrameImage: string      // 尾帧图片
sourceImage: string         // 源图片

// Avatar 参数
avatarPhoto: string         // Avatar 照片
avatarVideo: string         // Avatar 视频

// 通用参数
prompt: string              // 提示词
aspectRatio: string         // 宽高比
```

## 错误提示模板

```typescript
// 任务未找到
toast({
  title: "任务未找到",
  description: "无法找到对应的任务，请刷新后重试",
  variant: "destructive",
});

// 图片不存在
toast({
  title: "无法使用 [功能名]",
  description: "该任务没有可用的图片输出",
  variant: "destructive",
});

// 功能开发中
toast({
  title: "[功能名] 功能开发中",
  description: "[功能描述] 功能即将推出",
});
```

## 日志记录

```typescript
// 处理请求
console.log("[InfiniteLayout] Handle [action] request", { nodeId, taskId });

// 错误情况
console.warn("[InfiniteLayout] Task not found for [action]:", taskId);
console.warn("[InfiniteLayout] No image URL for [action]:", taskId);

// 成功执行
console.log("[InfiniteLayout] [Action] completed for task:", taskId);
```

## 添加新 Action 的步骤

1. **创建处理函数**

```typescript
const handleNewActionRequest = useCallback(
  (nodeId: string, taskId: string) => {
    // 实现逻辑
  },
  [dependencies]
);
```

2. **添加到 switch 语句**

```typescript
case "newaction":
  handleNewActionRequest(nodeId, taskId);
  break;
```

3. **更新依赖数组**

```typescript
}, [
  // ... 其他处理函数
  handleNewActionRequest
]);
```

## 相关文档

- 详细文档：`InfiniteLayout_QuickActions_Implementation.md`
- Inpaint 实现：`InfiniteLayout_Inpaint_Implementation.md`
- Delete 实现：`InfiniteLayout_Delete_Implementation.md`

## 测试清单

- [x] Re-edit 正确填充表单
- [x] Remix 正确设置参考图
- [x] Inpaint 对话框正常打开
- [x] Generate Video 正确设置首帧
- [x] Rating 乐观更新正常工作
- [x] Rating 失败时自动回滚
- [x] 错误情况显示正确提示
- [x] 任务不存在时的处理
- [x] 图片 URL 不存在时的处理
