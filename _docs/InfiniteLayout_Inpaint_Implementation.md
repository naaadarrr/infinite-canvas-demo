# InfiniteLayout Inpaint 指令实现文档

## 概述

本文档描述了在 `InfiniteLayout` 组件中实现 inpaint 指令的过程。通过监听无限画布发出的 `NODE_INPAINT_REQUEST` 事件，打开现有的 `InpaintModal` 对话框，允许用户对图片进行局部重绘。

## 实现位置

**文件路径**：
```
/Users/jeff/Workspace/code/createhub_demo/src/app/board/[id]/components/BoardWorkspace/components/Gallery/components/TaskAssets/components/LayoutRenderer/components/InfiniteLayout/index.tsx
```

## 关键变更

### 1. 导入依赖

添加了以下导入：

```typescript
import { getOriginUrl } from "@/app/board/[id]/components/BoardWorkspace/helpers/taskHelpers/media";
import { InpaintModal } from "@/app/board/[id]/components/BoardWorkspace/components/Gallery/components/TaskAssets/components/InpaintModal";
import { useInpaintModal } from "@/app/board/[id]/components/BoardWorkspace/components/Gallery/components/TaskAssets/components/TaskCard/hooks/modals/useInpaintModal";
```

- `getOriginUrl`：用于获取任务的原图 URL（支持图片和视频类型）
- `InpaintModal`：Inpaint 对话框组件
- `useInpaintModal`：管理 Inpaint 对话框状态的 Hook

### 2. 状态管理

在组件中添加了两个新的状态：

```typescript
const inpaintModal = useInpaintModal();

// 用于存储当前的 inpaint 任务
const [currentInpaintTask, setCurrentInpaintTask] = useState<BoardTaskItem | null>(null);
```

- `inpaintModal`：管理 inpaint 对话框的打开/关闭状态
- `currentInpaintTask`：存储当前需要进行 inpaint 操作的任务

### 3. 处理函数

#### handleInpaintRequest

处理来自无限画布的 inpaint 请求：

```typescript
const handleInpaintRequest = useCallback(
  (nodeId: string, taskId: string) => {
    console.log("[InfiniteLayout] Handle inpaint request", { nodeId, taskId });
    
    // 查找对应的任务
    const task = tasks.find((t) => t.taskId === taskId);
    
    if (!task) {
      console.warn("[InfiniteLayout] Task not found for inpaint:", taskId);
      toast({
        title: "任务未找到",
        description: "无法找到对应的任务，请刷新后重试",
        variant: "destructive",
      });
      return;
    }
    
    // 检查任务是否有图片输出
    const imageUrl = getOriginUrl(task);
    if (!imageUrl) {
      console.warn("[InfiniteLayout] No image URL for task:", taskId);
      toast({
        title: "无法使用 Inpaint",
        description: "该任务没有可用的图片输出",
        variant: "destructive",
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

**功能**：
- 根据 `taskId` 查找对应的任务
- 验证任务存在且有图片输出
- 设置当前任务并打开 inpaint 对话框
- 错误情况下显示友好的提示信息

#### handleInpaintSubmit

处理用户提交 inpaint 操作：

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

**功能**：
- 接收遮罩数据和提示词
- 记录提交的信息
- 显示提交成功的提示
- 关闭对话框

**注意**：实际的 inpaint 任务提交逻辑需要后续实现（标记为 TODO）

### 4. 事件监听

在 `useEffect` 中修改了 `NODE_QUICK_ACTION` 事件处理器，添加对 inpaint action 的处理：

```typescript
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
        // 可以在这里添加其他快捷操作的处理
        default:
          console.log("[InfiniteLayout] Unhandled quick action:", actionId);
      }
    }
  }
);
```

**功能**：
- 监听来自无限画布的快捷操作事件 `NODE_QUICK_ACTION`
- 提取 `actionId`、`nodeId` 和 `taskId`
- 根据 `actionId` 分发到相应的处理函数
- 当 `actionId` 为 `"inpaint"` 时，调用 `handleInpaintRequest`

**重要说明**：
- Inpaint 是通过 `NODE_QUICK_ACTION` 事件触发的，而不是独立的 `NODE_INPAINT_REQUEST` 事件
- 事件的 `payload.actionId` 字段用于区分不同的快捷操作类型
- 这种设计允许在同一个事件类型下支持多种快捷操作（如 inpaint、duplicate 等）

### 5. UI 渲染

在组件返回的 JSX 中添加了 `InpaintModal` 的渲染：

```typescript
{/* Inpaint 对话框 */}
{currentInpaintTask && (
  <InpaintModal
    isOpen={inpaintModal.isOpen}
    onClose={inpaintModal.close}
    imageUrl={getOriginUrl(currentInpaintTask) || ""}
    onSubmit={handleInpaintSubmit}
  />
)}
```

**功能**：
- 仅在有当前任务时渲染对话框
- 传递图片 URL 和相关回调函数

## 事件流程

```
用户在无限画布右键点击图片节点，选择 "Inpaint"
                    ↓
无限画布 widget 发出 NODE_QUICK_ACTION 事件（actionId: "inpaint"）
                    ↓
        InfiniteLayout 监听 NODE_QUICK_ACTION 事件
                    ↓
        提取 actionId, nodeId, taskId
                    ↓
        根据 actionId 判断为 "inpaint" 操作
                    ↓
              调用 handleInpaintRequest
                    ↓
        查找对应的任务，验证是否有图片输出
                    ↓
        设置 currentInpaintTask，打开 InpaintModal
                    ↓
            用户在对话框中进行 inpaint 操作
                    ↓
          用户点击 "Generate" 按钮提交
                    ↓
              调用 handleInpaintSubmit
                    ↓
        记录数据，显示提示，关闭对话框
                    ↓
         TODO: 提交到后端处理 inpaint 任务
```

## 错误处理

实现了以下错误情况的处理：

1. **任务未找到**
   - 显示提示："任务未找到，无法找到对应的任务，请刷新后重试"
   - 记录 warning 日志

2. **任务无图片输出**
   - 显示提示："无法使用 Inpaint，该任务没有可用的图片输出"
   - 记录 warning 日志

## 与 Delete 指令的对比

| 特性 | Delete 指令 | Inpaint 指令 |
|------|------------|--------------|
| **触发事件** | `NODE_DELETE_REQUEST` | `NODE_QUICK_ACTION` (actionId: "inpaint") |
| **事件来源** | 专用删除事件 | 通用快捷操作事件 |
| **确认对话框** | `DeleteConfirmModal` | `InpaintModal` |
| **状态管理** | `pendingDeleteNodeId` | `currentInpaintTask` |
| **处理函数** | `handleDeleteRequest` → `handleConfirmDelete` | `handleInpaintRequest` → `handleInpaintSubmit` |
| **画布通知** | `NODE_DELETE_CONFIRM` | 无（仅打开对话框） |
| **后端操作** | 删除任务 + 乐观更新 | TODO: 创建 inpaint 任务 |

## 待实现功能 (TODO)

1. **后端 API 集成**
   - 实现实际的 inpaint 任务提交逻辑
   - 调用后端 API 创建新的 inpaint 任务
   - 将遮罩数据和提示词发送到后端

2. **任务创建和追踪**
   - 创建新的 inpaint 任务
   - 在任务列表中显示新任务
   - 实时更新任务状态

3. **结果处理**
   - 处理 inpaint 任务完成后的结果
   - 在画布中显示新生成的图片
   - 支持查看原图和 inpaint 结果的对比

## 测试场景

1. **正常流程**
   - 在无限画布中右键点击图片节点
   - 选择 "Inpaint" 选项
   - 验证对话框正确打开，显示对应的图片
   - 进行遮罩绘制和提示词输入
   - 点击 "Generate" 提交
   - 验证提示信息显示，对话框关闭

2. **错误场景**
   - 对不存在的任务触发 inpaint（验证错误提示）
   - 对没有图片输出的任务触发 inpaint（验证错误提示）

3. **边界情况**
   - 快速连续触发多次 inpaint（验证状态正确切换）
   - 打开 inpaint 对话框后点击取消（验证对话框正确关闭）

## 类型安全说明

在实现过程中，需要注意 `TaskResultOutput` 类型的正确使用：

```typescript
export interface TaskResultOutput {
  type: string;
  /** @deprecated 使用 compressedImage.url 代替 */
  url?: string;
  /** @deprecated 使用 compressedImage.url 代替 */
  thumbnail_url?: string;
  width?: number;
  height?: number;
  file_size?: number;
  /** 压缩图（用于列表展示） */
  compressedImage?: MediaResourceInfo;
  /** 原图（用于详情页展示） */
  originImage?: MediaResourceInfo;
  originVideo?: OriginVideoResourceInfo;
}
```

**正确的方式**：使用 `getOriginUrl(task)` 工具函数来获取图片 URL
- 对于图片类型：优先使用 `originImage.url`，其次 `compressedImage.url`
- 对于视频类型：使用 `originVideo.url`

**错误的方式**：直接访问 `task.result.outputUrl`（该字段不存在）

## 参考资料

- **InpaintModal 组件**：`/src/app/board/[id]/components/BoardWorkspace/components/Gallery/components/TaskAssets/components/InpaintModal/index.tsx`
- **useInpaintModal Hook**：`/src/app/board/[id]/components/BoardWorkspace/components/Gallery/components/TaskAssets/components/TaskCard/hooks/modals/useInpaintModal.ts`
- **媒体 URL 工具函数**：`/src/app/board/[id]/components/BoardWorkspace/helpers/taskHelpers/media.ts`
- **Delete 实现文档**：`/Volumes/GeIL P4A 1TB Extend Disk/gitlab/Frontend/infinite-canvas/_docs/InfiniteLayout_Delete_Implementation.md`

## 日志记录

实现中添加了以下日志点，便于调试：

```typescript
// 事件监听
console.log("[Widget Event] NODE_QUICK_ACTION", event);

// 未处理的 action
console.log("[InfiniteLayout] Unhandled quick action:", actionId);

// 处理请求
console.log("[InfiniteLayout] Handle inpaint request", { nodeId, taskId });

// 错误情况
console.warn("[InfiniteLayout] Task not found for inpaint:", taskId);
console.warn("[InfiniteLayout] No image URL for task:", taskId);

// 提交
console.log("Inpaint submitted:", { task, prompt, maskDataLength });
```

## 事件数据示例

```json
{
  "type": "NODE_QUICK_ACTION",
  "payload": {
    "nodeId": "node_1769515223074_e1a82ld5v",
    "nodeType": "image",
    "actionId": "inpaint",
    "actionLabel": "Inpaint",
    "node": {
      "raw": {
        "taskId": "ca6c2792efbb4ee4acc084781bf99305",
        "result": {
          "originImage": {
            "url": "https://..."
          }
        }
      }
    }
  }
}
```

## 总结

本次实现为 `InfiniteLayout` 组件添加了 inpaint 指令支持，复用了现有的 `InpaintModal` 组件和相关基础设施。实现遵循了与 delete 指令相同的设计模式，确保了代码的一致性和可维护性。

下一步需要实现后端 API 集成，完成实际的 inpaint 任务提交和处理逻辑。
