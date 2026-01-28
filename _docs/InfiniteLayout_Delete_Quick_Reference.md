# InfiniteLayout 删除功能 - 快速参考

## 核心实现要点

### 1. 导入依赖

```typescript
import { useState, useCallback } from "react";
import { useRecoilCallback } from "recoil-next";
import { useDeleteConfirmDialog } from "...";
import { useTaskListRefresh } from "...";
import { useDeleteTaskMutation } from "...";
import { Dialog, DialogContent, ... } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
```

### 2. 初始化 Hooks

```typescript
const { refreshAllTaskLists } = useTaskListRefresh();
const deleteTaskMutation = useDeleteTaskMutation();
const deleteDialog = useDeleteConfirmDialog();
const [pendingDeleteNodeId, setPendingDeleteNodeId] = useState<string | null>(null);
```

### 3. 核心函数（3 个）

#### executeDeleteTask（乐观更新 + API 调用）
```typescript
const executeDeleteTask = useRecoilCallback(
  ({ set, snapshot }) => async (taskId: string) => {
    // 1. 保存状态
    // 2. 乐观删除（从所有 Recoil state 移除）
    // 3. 调用 API
    // 4. 成功：刷新列表
    // 5. 失败：回滚 + 提示错误
  },
  [deleteTaskMutation, refreshAllTaskLists]
);
```

#### handleDeleteRequest（打开对话框）
```typescript
const handleDeleteRequest = useCallback(
  (nodeId: string, taskIdFromEvent?: string) => {
    // ⚠️ 关键：使用 taskId 查找，不是 nodeId
    const task = tasks.find(t => t.taskId === taskIdFromEvent);
    if (!task) return;
    setPendingDeleteNodeId(nodeId);
    deleteDialog.openDialog(task);
  },
  [tasks, deleteDialog]
);
```

#### handleConfirmDelete（确认后执行）
```typescript
const handleConfirmDelete = useCallback(async () => {
  deleteDialog.closeDialog();
  if (!pendingDeleteNodeId) return;
  
  widgetBridge.command("NODE_DELETE_CONFIRM", { nodeId: pendingDeleteNodeId });
  await executeDeleteTask(pendingDeleteNodeId);
  setPendingDeleteNodeId(null);
}, [pendingDeleteNodeId, deleteDialog, executeDeleteTask]);
```

### 4. 事件监听

```typescript
useEffect(() => {
  const unsubscribe = widgetBridge.on("NODE_DELETE_REQUEST", (event) => {
    const nodeId = event.payload?.nodeId;
    const taskId = event.payload?.node?.raw?.taskId; // ⚠️ 关键：提取 taskId
    
    if (typeof nodeId === "string" && typeof taskId === "string") {
      handleDeleteRequest(nodeId, taskId); // 传递两个 ID
    }
  });
  return () => unsubscribe();
}, [handleDeleteRequest]);
```

### 5. 渲染对话框

```typescript
<Dialog open={deleteDialog.dialog.isOpen} onOpenChange={(open) => !open && handleCancelDelete()}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>确认删除</DialogTitle>
      <DialogDescription>确定要删除这个任务吗？此操作无法撤销。</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={handleCancelDelete}>取消</Button>
      <Button variant="destructive" onClick={handleConfirmDelete}>确认删除</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## 数据流图

```
用户点击删除按钮
    ↓
NODE_DELETE_REQUEST 事件
    ↓
handleDeleteRequest(nodeId)
    ├─ 查找 task
    ├─ 保存 pendingDeleteNodeId
    └─ 打开对话框
    ↓
用户点击"确认删除"
    ↓
handleConfirmDelete()
    ├─ 关闭对话框
    ├─ 通知画布：NODE_DELETE_CONFIRM
    └─ executeDeleteTask(nodeId)
        ├─ 保存当前状态（用于回滚）
        ├─ 乐观删除（立即从 UI 移除）
        ├─ 调用删除 API
        ├─ 成功 → 刷新列表
        └─ 失败 → 回滚 + 错误提示
```

## 关键点

1. **nodeId vs taskId**：
   - `nodeId`：画布节点 ID，用于通知画布删除节点
   - `taskId`：任务业务 ID，用于查找任务和执行删除
   - ⚠️ **必须从事件中提取 taskId**：`event.payload?.node?.raw?.taskId`
2. **pendingDeleteNodeId**：临时存储待删除的 nodeId，用于对话框确认后通知画布
3. **乐观更新**：先更新 UI，后调用 API，提升用户体验
4. **错误回滚**：API 失败时恢复原始状态，保证数据一致性
5. **复用对话框**：使用 `useDeleteConfirmDialog` 保持与其他删除流程一致

## 与 TaskCard 删除的区别

| 特性 | TaskCard | InfiniteLayout |
|------|---------|----------------|
| Hook 使用 | `useTaskDelete(task)` | 直接实现 `executeDeleteTask` |
| task 来源 | Props 传入单个 task | 从 `tasks` 数组动态查找 |
| 对话框 | Hook 内部集成 | 组件级别渲染 |
| nodeId 管理 | 不需要 | 需要 `pendingDeleteNodeId` |

## 代码量对比

- **总代码行数**: ~265 行
- **核心逻辑**: ~100 行（executeDeleteTask + handlers）
- **UI 部分**: ~30 行（Dialog 组件）
- **事件监听**: ~10 行（useEffect）

## 可扩展性

如需添加更多操作（如编辑、移动等），可以参考删除功能的实现模式：

```typescript
// 1. 定义核心逻辑函数
const executeXxxTask = useRecoilCallback(...);

// 2. 定义请求处理函数
const handleXxxRequest = useCallback((nodeId) => { ... });

// 3. 监听对应事件
widgetBridge.on("NODE_XXX_REQUEST", handleXxxRequest);

// 4. 渲染对应的 UI（如果需要）
```
