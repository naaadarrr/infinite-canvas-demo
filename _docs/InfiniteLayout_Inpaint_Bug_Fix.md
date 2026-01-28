# InfiniteLayout Inpaint Bug 修复记录

## 问题描述

**日期**: 2026-01-27  
**问题**: 在无限画布中右键点击图片节点，选择 "Inpaint" 选项后，没有弹出 Inpaint 对话框。

## 问题分析

### 原始实现问题

最初的实现监听了一个不存在的事件类型 `NODE_INPAINT_REQUEST`：

```typescript
// ❌ 错误的实现
const unsubscribeInpaintRequest = widgetBridge.on<{ nodeId?: string }>(
  "NODE_INPAINT_REQUEST",  // 这个事件实际上不存在
  (event: any) => {
    // ...
  }
);
```

### 实际事件类型

通过查看事件日志，发现 Inpaint 操作实际上是通过 `NODE_QUICK_ACTION` 事件触发的：

```json
{
  "type": "NODE_QUICK_ACTION",
  "payload": {
    "nodeId": "node_1769515223074_e1a82ld5v",
    "nodeType": "image",
    "actionId": "inpaint",  // 通过 actionId 字段区分操作类型
    "actionLabel": "Inpaint",
    "node": {
      "raw": {
        "taskId": "ca6c2792efbb4ee4acc084781bf99305",
        // ...
      }
    }
  }
}
```

### 关键发现

1. **事件类型**：Inpaint 使用通用的 `NODE_QUICK_ACTION` 事件，而不是专用事件
2. **操作识别**：通过 `payload.actionId` 字段区分不同的快捷操作（`"inpaint"`、`"duplicate"` 等）
3. **设计模式**：与 Delete 操作不同，Delete 使用专用的 `NODE_DELETE_REQUEST` 事件

## 解决方案

### 修改事件监听器

将 Inpaint 的处理逻辑移到 `NODE_QUICK_ACTION` 事件监听器中：

```typescript
// ✅ 正确的实现
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

### 代码变更

```diff
  useEffect(() => {
    const unsubscribeQuickAction = widgetBridge.on(
      "NODE_QUICK_ACTION",
      (event: any) => {
        console.log("[Widget Event] NODE_QUICK_ACTION", event);
+       
+       const actionId = event.payload?.actionId;
+       const nodeId = event.payload?.nodeId;
+       const taskId = event.payload?.node?.raw?.taskId;
+       
+       // 根据 actionId 分发到不同的处理函数
+       if (typeof nodeId === "string" && typeof taskId === "string") {
+         switch (actionId) {
+           case "inpaint":
+             handleInpaintRequest(nodeId, taskId);
+             break;
+           default:
+             console.log("[InfiniteLayout] Unhandled quick action:", actionId);
+         }
+       }
      }
    );
    
    // ... 其他事件监听器
    
-   const unsubscribeInpaintRequest = widgetBridge.on<{ nodeId?: string }>(
-     "NODE_INPAINT_REQUEST",
-     (event: any) => {
-       console.log("[Widget Event] NODE_INPAINT_REQUEST", event);
-       const nodeId = event.payload?.nodeId;
-       const taskId = event.payload?.node?.raw?.taskId;
-       
-       if (typeof nodeId === "string" && typeof taskId === "string") {
-         handleInpaintRequest(nodeId, taskId);
-       }
-     }
-   );
    
    return () => {
      unsubscribeQuickAction();
      unsubscribeDeleteRequest();
      unsubscribeDeleted();
-     unsubscribeInpaintRequest();
    };
  }, [handleDeleteRequest, handleInpaintRequest]);
```

## 验证

修复后，事件处理流程如下：

1. 用户右键点击图片节点，选择 "Inpaint"
2. Widget 发出 `NODE_QUICK_ACTION` 事件，`actionId` 为 `"inpaint"`
3. `InfiniteLayout` 监听到事件，提取 `actionId`, `nodeId`, `taskId`
4. Switch 语句匹配 `actionId === "inpaint"`
5. 调用 `handleInpaintRequest(nodeId, taskId)`
6. 验证任务存在且有图片输出
7. 打开 `InpaintModal` 对话框 ✅

## 经验总结

### 调试技巧

1. **查看事件日志**：在事件监听器中添加 `console.log` 输出完整的事件对象
2. **检查事件结构**：仔细查看 `event.type` 和 `event.payload` 的结构
3. **对比相似功能**：查看其他类似功能（如 Delete）的实现方式

### 设计模式

1. **通用事件 vs 专用事件**：
   - 通用事件（`NODE_QUICK_ACTION`）：通过 `actionId` 字段区分操作类型，适合多种快捷操作
   - 专用事件（`NODE_DELETE_REQUEST`）：独立的事件类型，适合重要或复杂的操作

2. **事件分发**：使用 `switch` 语句根据 `actionId` 分发到不同的处理函数

3. **扩展性**：这种设计允许轻松添加新的快捷操作（如 `duplicate`, `edit` 等）

### 注意事项

- ⚠️ 不要假设事件类型，始终根据实际的事件日志进行实现
- ⚠️ 在添加新功能时，先调查现有的类似功能是如何实现的
- ⚠️ 确保事件监听器的清理函数正确注销所有订阅

## 文档更新

已更新以下文档：

1. **InfiniteLayout_Inpaint_Implementation.md**：更新事件监听部分，反映正确的实现
2. **InfiniteLayout_Inpaint_Quick_Reference.md**：更新快速参考中的事件监听代码
3. **InfiniteLayout_Inpaint_Bug_Fix.md**（本文档）：记录 bug 修复过程

## 相关代码

- **主文件**：`/src/app/board/[id]/components/BoardWorkspace/components/Gallery/components/TaskAssets/components/LayoutRenderer/components/InfiniteLayout/index.tsx`
- **事件监听**：第 275-319 行
- **处理函数**：`handleInpaintRequest`（第 216-250 行）

## 状态

✅ **已修复**

- Inpaint 对话框现在可以正常弹出
- 事件处理流程完整且正确
- 所有相关文档已更新
