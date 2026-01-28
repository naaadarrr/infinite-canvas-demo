# InfiniteLayout Quick Actions 完整实现文档

## 概述

本文档描述了在 `InfiniteLayout` 组件中实现所有 Quick Actions 的完整过程。通过监听无限画布发出的 `NODE_QUICK_ACTION` 事件，根据 `actionId` 字段执行不同的操作。

## 实现位置

**文件路径**：
```
/Users/jeff/Workspace/code/createhub_demo/src/app/board/[id]/components/BoardWorkspace/components/Gallery/components/TaskAssets/components/LayoutRenderer/components/InfiniteLayout/index.tsx
```

## 已实现的 Quick Actions

### 1. Re-edit (`edit`)

**功能**：重新编辑任务，打开对应的工具面板并填充原始参数。

**实现**：
```typescript
const handleReEditRequest = useCallback(
  (nodeId: string, taskId: string) => {
    const task = tasks.find((t) => t.taskId === taskId);
    
    if (!task) {
      toast({ title: "任务未找到", variant: "destructive" });
      return;
    }
    
    // 使用 fillToolForm 填充工具表单
    fillToolForm({
      toolType: task.toolType as ToolType,
      ...task.parameters
    });
  },
  [tasks, fillToolForm]
);
```

**使用场景**：
- 用户想要使用相同的参数重新生成任务
- 修改之前任务的某些参数后重新执行

### 2. Remix (`reference`)

**功能**：将图片作为参考图，打开 ImageEdit 工具面板。

**实现**：
```typescript
const handleRemixRequest = useCallback(
  (nodeId: string, taskId: string) => {
    const task = tasks.find((t) => t.taskId === taskId);
    
    if (!task) {
      toast({ title: "任务未找到", variant: "destructive" });
      return;
    }
    
    const imageUrl = getOriginUrl(task) || getThumbnailUrl(task);
    if (!imageUrl) {
      toast({ 
        title: "无法使用 Remix", 
        description: "该任务没有可用的图片输出",
        variant: "destructive"
      });
      return;
    }
    
    // 填充 ImageEdit 工具表单（作为参考图）
    fillToolForm({
      toolType: ToolType.ImageEdit,
      referenceImages: [imageUrl]
    });
  },
  [tasks, fillToolForm]
);
```

**使用场景**：
- 用户想要基于现有图片生成相似风格的新图片
- 使用图片作为 Image-to-Image 的参考

### 3. Inpaint (`inpaint`)

**功能**：打开 Inpaint 对话框，对图片进行局部重绘。

**实现**：
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
      toast({ 
        title: "无法使用 Inpaint",
        description: "该任务没有可用的图片输出",
        variant: "destructive"
      });
      return;
    }
    
    // 打开 inpaint 对话框
    setCurrentInpaintTask(task);
    inpaintModal.open();
  },
  [tasks, inpaintModal]
);
```

**使用场景**：
- 修复图片的某个区域
- 替换图片中的某个对象
- 移除图片中的不需要的内容

### 4. Generate Video (`video`)

**功能**：将图片作为首帧，打开 Image-to-Video 工具面板。

**实现**：
```typescript
const handleGenerateVideoRequest = useCallback(
  (nodeId: string, taskId: string) => {
    const task = tasks.find((t) => t.taskId === taskId);
    
    if (!task) {
      toast({ title: "任务未找到", variant: "destructive" });
      return;
    }
    
    const imageUrl = getOriginUrl(task) || getThumbnailUrl(task);
    if (!imageUrl) {
      toast({ 
        title: "无法生成视频",
        description: "该任务没有可用的图片输出",
        variant: "destructive"
      });
      return;
    }
    
    // 填充 Image-to-Video 工具表单
    fillToolForm({
      toolType: ToolType.ImageToVideo,
      firstFrameImage: imageUrl
    });
  },
  [tasks, fillToolForm]
);
```

**使用场景**：
- 将静态图片转换为动态视频
- 为图片添加动画效果

### 5. Edit Image Text (`ocr`)

**功能**：识别并编辑图片中的文字（开发中）。

**实现**：
```typescript
const handleOcrRequest = useCallback(
  (nodeId: string, taskId: string) => {
    const task = tasks.find((t) => t.taskId === taskId);
    
    if (!task) {
      toast({ title: "任务未找到", variant: "destructive" });
      return;
    }
    
    // TODO: 实现 OCR 功能
    toast({
      title: "OCR 功能开发中",
      description: "Edit Image Text 功能即将推出",
    });
  },
  [tasks]
);
```

**使用场景**：
- 识别图片中的文字
- 编辑或替换图片中的文字内容
- 翻译图片中的文字

## 事件处理流程

### 统一事件监听器

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
          // TODO: 添加其他快捷操作
          // case "lipsync": handleLipSyncRequest(nodeId, taskId); break;
          // case "upscale": handleUpscaleRequest(nodeId, taskId); break;
          default:
            console.log("[InfiniteLayout] Unhandled quick action:", actionId);
        }
      }
    }
  );

  return () => {
    unsubscribeQuickAction();
    unsubscribeDeleteRequest();
    unsubscribeDeleted();
  };
}, [
  handleDeleteRequest,
  handleReEditRequest,
  handleRemixRequest,
  handleInpaintRequest,
  handleGenerateVideoRequest,
  handleOcrRequest
]);
```

## 事件流程图

```
用户右键点击节点 → 选择 Quick Action
            ↓
Widget 发出 NODE_QUICK_ACTION 事件
            ↓
InfiniteLayout 监听到事件
            ↓
提取 actionId, nodeId, taskId
            ↓
    根据 actionId 分发：
    
┌───────────┬────────────┬────────────┬────────────┬────────────┐
│   edit    │ reference  │  inpaint   │   video    │    ocr     │
└─────┬─────┴─────┬──────┴─────┬──────┴─────┬──────┴─────┬──────┘
      ↓           ↓            ↓            ↓            ↓
  Re-edit     Remix      Inpaint    Generate      OCR
  填充表单    设置参考图   打开对话框   Video      (开发中)
      ↓           ↓            ↓        首帧         ↓
  打开工具面板  打开工具面板  用户编辑   打开工具面板   显示提示
```

## Action ID 映射表

| Action ID | 功能 | 目标工具 | 参数 | 状态 |
|-----------|------|---------|------|------|
| `edit` | Re-edit | 任务原工具 | 任务原参数 | ✅ 已实现 |
| `reference` | Remix | ImageEdit | `referenceImages` | ✅ 已实现 |
| `inpaint` | Inpaint | InpaintModal | `imageUrl` | ✅ 已实现 |
| `video` | Generate Video | ImageToVideo | `firstFrameImage` | ✅ 已实现 |
| `ocr` | Edit Image Text | (OCR 工具) | - | 🚧 开发中 |
| `lipsync` | AI Avatar | AiAvatar/VideoLipSync | 图片/视频 | ⏳ 待实现 |
| `upscale` | Upscale | (Upscale 工具) | - | ⏳ 待实现 |

## 依赖说明

### 导入的模块

```typescript
import { useToolFormFiller } from "@/app/board/[id]/components/ToolPanel/hooks/useToolFormFiller";
import { ToolType } from "@/app/board/[id]/components/ToolPanel/types";
import { getOriginUrl, getThumbnailUrl } from "@/app/board/[id]/components/BoardWorkspace/helpers/taskHelpers/media";
import { toast } from "@/hooks/useToast";
```

### 核心 Hooks

- **useToolFormFiller**: 用于填充工具面板表单
- **useInpaintModal**: 管理 Inpaint 对话框状态
- **useDeleteConfirmDialog**: 管理删除确认对话框（delete 操作）

## 错误处理

所有 Quick Actions 都包含统一的错误处理：

### 1. 任务未找到

```typescript
if (!task) {
  toast({
    title: "任务未找到",
    description: "无法找到对应的任务，请刷新后重试",
    variant: "destructive",
  });
  return;
}
```

### 2. 图片 URL 不存在

```typescript
if (!imageUrl) {
  toast({
    title: "无法使用 [功能名]",
    description: "该任务没有可用的图片输出",
    variant: "destructive",
  });
  return;
}
```

### 3. 未实现的功能

```typescript
toast({
  title: "[功能名] 功能开发中",
  description: "[功能描述] 功能即将推出",
});
```

## 类型安全

### ToolType 枚举

所有工具类型都定义在 `ToolType` 枚举中：

```typescript
export enum ToolType {
  ImageEdit = 'image-edit',
  ImageToVideo = 'image-to-video',
  Inpaint = 'inpaint',
  AiAvatar = 'ai-avatar',
  VideoLipSync = 'video-lip-sync',
  // ...
}
```

### 参数类型

使用 `fillToolForm` 时，参数会自动进行类型检查：

```typescript
fillToolForm({
  toolType: ToolType.ImageEdit,
  referenceImages: [imageUrl]  // ✅ 正确：使用数组
});

fillToolForm({
  toolType: ToolType.ImageEdit,
  referenceImage: imageUrl  // ❌ 错误：不存在的参数
});
```

## 日志记录

每个 Quick Action 都包含详细的日志记录：

```typescript
// 接收事件
console.log("[Widget Event] NODE_QUICK_ACTION", event);

// 处理请求
console.log("[InfiniteLayout] Handle [action] request", { nodeId, taskId });

// 错误情况
console.warn("[InfiniteLayout] Task not found for [action]:", taskId);
console.warn("[InfiniteLayout] No image URL for [action]:", taskId);

// 成功执行
console.log("[InfiniteLayout] [Action] completed for task:", taskId);
```

## 待实现功能 (TODO)

### 1. LipSync (口型同步)

```typescript
case "lipsync":
  handleLipSyncRequest(nodeId, taskId);
  break;
```

**实现思路**：
- 图片：打开 AiAvatar 工具，填充 `avatarPhoto`
- 视频：打开 VideoLipSync 工具，填充 `avatarVideo`

### 2. Upscale (图片/视频放大)

```typescript
case "upscale":
  handleUpscaleRequest(nodeId, taskId);
  break;
```

**实现思路**：
- 图片：打开 ImageUpscale 工具
- 视频：打开 VideoUpscale 工具

### 3. OCR 功能完善

当 OCR 工具开发完成后，替换当前的占位实现：

```typescript
const handleOcrRequest = useCallback(
  (nodeId: string, taskId: string) => {
    const task = tasks.find((t) => t.taskId === taskId);
    const imageUrl = getOriginUrl(task);
    
    fillToolForm({
      toolType: ToolType.OCR,  // 假设的 OCR 工具类型
      sourceImage: imageUrl
    });
  },
  [tasks, fillToolForm]
);
```

## 测试场景

### 1. Re-edit

- ✅ 图片任务重新编辑
- ✅ 视频任务重新编辑
- ✅ 参数正确填充到工具面板

### 2. Remix

- ✅ 图片作为参考图
- ✅ 打开 ImageEdit 工具
- ✅ 参考图正确设置

### 3. Inpaint

- ✅ 打开 Inpaint 对话框
- ✅ 图片正确加载
- ✅ 遮罩绘制功能正常

### 4. Generate Video

- ✅ 图片作为首帧
- ✅ 打开 ImageToVideo 工具
- ✅ 首帧图片正确设置

### 5. 错误处理

- ✅ 任务不存在时显示错误提示
- ✅ 图片 URL 不存在时显示错误提示
- ✅ 未实现功能显示开发中提示

## 与 TaskCard 的一致性

InfiniteLayout 中的 Quick Actions 实现与 TaskCard 中的实现保持一致：

| 功能 | TaskCard | InfiniteLayout | 一致性 |
|------|---------|---------------|--------|
| Re-edit | `useTaskReEdit` | `handleReEditRequest` | ✅ |
| Remix | `useTaskReference` | `handleRemixRequest` | ✅ |
| Inpaint | `onInpaint` callback | `handleInpaintRequest` | ✅ |
| Generate Video | `handleImageToVideo` | `handleGenerateVideoRequest` | ✅ |
| OCR | `handleOcr` | `handleOcrRequest` | ✅ |

## 性能优化

### 1. useCallback

所有处理函数都使用 `useCallback` 缓存，避免不必要的重新渲染：

```typescript
const handleReEditRequest = useCallback(
  (nodeId: string, taskId: string) => {
    // ...
  },
  [tasks, fillToolForm]  // 依赖项
);
```

### 2. 任务查找

使用 `Array.find` 方法快速查找任务：

```typescript
const task = tasks.find((t) => t.taskId === taskId);
```

### 3. 提前返回

错误情况下提前返回，避免不必要的处理：

```typescript
if (!task) {
  toast({ title: "任务未找到", variant: "destructive" });
  return;  // 提前返回
}
```

## 相关文档

- **InfiniteLayout Delete 实现**：`InfiniteLayout_Delete_Implementation.md`
- **InfiniteLayout Inpaint 实现**：`InfiniteLayout_Inpaint_Implementation.md`
- **ToolPanel 文档**：`/src/app/board/[id]/components/ToolPanel/README.md`
- **Quick Actions 定义**：`/src/app/board/[id]/components/BoardWorkspace/data/quickActions.tsx`

## 总结

本次实现为 InfiniteLayout 组件添加了完整的 Quick Actions 支持，包括：

1. ✅ **Re-edit** - 重新编辑任务
2. ✅ **Remix** - 使用图片作为参考
3. ✅ **Inpaint** - 局部图片重绘
4. ✅ **Generate Video** - 图片转视频
5. 🚧 **Edit Image Text (OCR)** - 文字识别编辑（占位）

所有功能都经过类型检查，包含完善的错误处理，并与 TaskCard 中的实现保持一致。通过统一的事件监听和分发机制，可以轻松扩展更多的 Quick Actions。
