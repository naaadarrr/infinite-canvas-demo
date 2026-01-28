# InfiniteLayout Inpaint 指令快速参考

## 快速概览

在无限画布中添加 inpaint 指令支持，允许用户通过右键菜单打开 Inpaint 对话框，对图片进行局部重绘。

## 核心实现

### 1. 导入依赖

```typescript
import { getOriginUrl } from "@/app/board/[id]/components/BoardWorkspace/helpers/taskHelpers/media";
import { InpaintModal } from "@/app/board/[id]/components/BoardWorkspace/components/Gallery/components/TaskAssets/components/InpaintModal";
import { useInpaintModal } from "@/app/board/[id]/components/BoardWorkspace/components/Gallery/components/TaskAssets/components/TaskCard/hooks/modals/useInpaintModal";
```

### 2. 状态管理

```typescript
const inpaintModal = useInpaintModal();
const [currentInpaintTask, setCurrentInpaintTask] = useState<BoardTaskItem | null>(null);
```

### 3. 处理请求

```typescript
const handleInpaintRequest = useCallback(
  (nodeId: string, taskId: string) => {
    const task = tasks.find((t) => t.taskId === taskId);
    
    if (!task) {
      toast({ title: "任务未找到", variant: "destructive" });
      return;
    }
    
    const imageUrl = getOriginUrl(task);
    if (!imageUrl) {
      toast({ title: "无法使用 Inpaint", description: "该任务没有可用的图片输出", variant: "destructive" });
      return;
    }
    
    setCurrentInpaintTask(task);
    inpaintModal.open();
  },
  [tasks, inpaintModal]
);
```

### 4. 监听事件

```typescript
useEffect(() => {
  const unsubscribeQuickAction = widgetBridge.on(
    "NODE_QUICK_ACTION",
    (event: any) => {
      console.log("[Widget Event] NODE_QUICK_ACTION", event);
      
      const actionId = event.payload?.actionId;
      const nodeId = event.payload?.nodeId;
      const taskId = event.payload?.node?.raw?.taskId;
      
      // 根据 actionId 分发到不同的处理函数
      if (typeof nodeId === "string" && typeof taskId === "string") {
        switch (actionId) {
          case "inpaint":
            handleInpaintRequest(nodeId, taskId);
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
}, [handleInpaintRequest]);
```

### 5. 渲染对话框

```typescript
{currentInpaintTask && (
  <InpaintModal
    isOpen={inpaintModal.isOpen}
    onClose={inpaintModal.close}
    imageUrl={getOriginUrl(currentInpaintTask) || ""}
    onSubmit={handleInpaintSubmit}
  />
)}
```

### 6. 提交处理

```typescript
const handleInpaintSubmit = useCallback(
  (maskData: string, prompt: string) => {
    console.log("Inpaint submitted:", {
      task: currentInpaintTask?.taskId,
      prompt,
      maskDataLength: maskData.length,
    });
    
    // TODO: 实现实际的 inpaint 任务提交逻辑
    toast({
      title: "Inpaint 任务已提交",
      description: "正在处理中...",
    });
    
    inpaintModal.close();
  },
  [currentInpaintTask, inpaintModal]
);
```

## 关键点

### ✅ DO

- ✅ 使用 `getOriginUrl(task)` 获取图片 URL（类型安全）
- ✅ 验证任务存在且有图片输出
- ✅ 显示友好的错误提示信息
- ✅ 在监听器依赖数组中包含 `handleInpaintRequest`

### ❌ DON'T

- ❌ 不要直接访问 `task.result.outputUrl`（该字段不存在）
- ❌ 不要忘记在 cleanup 函数中取消订阅事件
- ❌ 不要忘记检查任务和图片 URL 是否存在

## 事件流程

```
用户右键点击图片节点 → 选择 "Inpaint"
          ↓
Widget 发出 NODE_QUICK_ACTION 事件 (actionId: "inpaint")
          ↓
  InfiniteLayout 监听 NODE_QUICK_ACTION
          ↓
  判断 actionId === "inpaint"
          ↓
  handleInpaintRequest 验证任务和图片
          ↓
  打开 InpaintModal 对话框
          ↓
  用户绘制遮罩并输入提示词
          ↓
  点击 Generate → handleInpaintSubmit
          ↓
  TODO: 提交到后端创建 inpaint 任务
```

## 事件类型说明

**重要**：Inpaint 使用 `NODE_QUICK_ACTION` 事件，而不是独立的事件类型。

- **事件类型**：`NODE_QUICK_ACTION`
- **识别方式**：`payload.actionId === "inpaint"`
- **与 Delete 的区别**：Delete 使用专用的 `NODE_DELETE_REQUEST` 事件

## 类型安全

```typescript
// ✅ 正确
const imageUrl = getOriginUrl(task);

// ❌ 错误
const imageUrl = task.result?.outputUrl; // TypeScript 错误：outputUrl 不存在
```

`getOriginUrl` 会根据媒体类型自动选择正确的 URL：
- **图片**：`originImage.url` > `compressedImage.url`
- **视频**：`originVideo.url`

## 错误处理

| 错误场景 | 处理方式 |
|---------|---------|
| 任务未找到 | 显示 toast 提示："任务未找到" |
| 无图片输出 | 显示 toast 提示："无法使用 Inpaint，该任务没有可用的图片输出" |

## TODO

- [ ] 实现后端 API 调用，创建 inpaint 任务
- [ ] 将遮罩数据和提示词发送到后端
- [ ] 在任务列表中显示新创建的 inpaint 任务
- [ ] 实时更新任务状态和结果

## 相关文档

- 详细实现文档：`InfiniteLayout_Inpaint_Implementation.md`
- Delete 指令实现：`InfiniteLayout_Delete_Implementation.md`
- 媒体 URL 工具函数：`/src/app/board/[id]/components/BoardWorkspace/helpers/taskHelpers/media.ts`
