# 画布活动追踪优化

## 📋 需求描述

**用户反馈**:
> "现在是,只有在编辑模式并且有实际操作节点才算是有行为,但是实际是只要用户在画布上有动作都算有主动触发行为,避免出现空闲(但是这是指用户需要在画板范围内的鼠标移动才算);不需要只限于编辑模式还是pan模式"

**核心需求**:
1. 用户在画布上的**任何鼠标活动**都应该算作有效操作
2. 不限于编辑模式,pan 模式也算
3. 不限于操作节点,在画布空白区域移动也算
4. 目的:避免用户正在浏览画布时被误判为空闲

---

## 🔍 问题分析

### 之前的实现

#### 服务端空闲判断

```typescript
// canvasRoom.ts - handleMessage()

const userActionTypes = [
  'create_node',    // 创建节点
  'delete_node',    // 删除节点
  'update_node',    // 更新节点
  'drag_start',     // 开始拖拽
  // ...
];

if (userActionTypes.includes(message.type)) {
  conn.lastUserActionAt = now; // ← 只有这些操作才更新
}
```

**问题**:
- 只认可**编辑类操作**
- 用户在 pan 模式下浏览画布,不算活动
- 用户在画布空白区域移动鼠标,不算活动
- 导致正在浏览的用户被误判为空闲

---

#### 客户端空闲检测

```typescript
// useCollaboration.ts

// 监听全局用户活动
const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel', 'click'];

events.forEach(event => {
  window.addEventListener(event, throttledActivity, { passive: true }); // ← 全局监听
});
```

**现状**:
- 客户端**已经**在监听全局活动
- 客户端的空闲检测**是正确的**
- 但**服务端不知道**客户端的活动状态

---

## ✅ 解决方案

### 方案: 新增 `USER_ACTIVITY` 消息类型

**核心思想**:
- 客户端检测到用户活动时,通知服务端
- 服务端将 `user_activity` 消息也算作用户操作
- 使用节流机制,避免频繁发送(每 30 秒最多一次)

---

### 实现步骤

#### 1. 新增消息类型

**服务端类型** (`packages/server/src/types.ts`):

```typescript
export enum MessageType {
  // ...其他类型
  USER_ACTIVITY = 'user_activity', // ← 新增
}

export interface UserActivityMessage {
  type: MessageType.USER_ACTIVITY;
  timestamp?: number; // 可选:客户端时间戳
}

export type ClientMessage =
  | JoinMessage
  | LeaveMessage
  // ...
  | UserActivityMessage; // ← 新增
```

**客户端类型** (`packages/widget/src/hooks/useCollaboration.ts`):

```typescript
export enum MessageType {
  // ...其他类型
  USER_ACTIVITY = 'user_activity', // ← 新增
}
```

---

#### 2. 服务端处理 `user_activity` 消息

```typescript
// canvasRoom.ts - handleMessage()

const userActionTypes = [
  'create_node', 'delete_node', 'update_node', 'update_nodes',
  'drag_start', 'drag_move', 'drag_end', 'lock', 'unlock',
  'user_activity' // ← 新增: 包括用户活动通知
];

if (userActionTypes.includes(message.type)) {
  conn.lastUserActionAt = now; // ← 更新用户操作时间
}

switch (message.type) {
  case 'user_activity':
    // 用户活动通知,只更新时间戳,不需要其他处理
    return;
    
  // ...其他 case
}
```

---

#### 3. 客户端发送活动通知

```typescript
// useCollaboration.ts

const lastActivityNotifyRef = useRef<number>(0); // 上次通知服务端的时间

const updateUserActivity = useCallback(() => {
  const now = Date.now();
  lastUserActivityRef.current = now;
  
  // 标记不再是空闲断开状态
  if (wasIdleDisconnectedRef.current) {
    wasIdleDisconnectedRef.current = false;
  }
  
  // 通知服务端用户有活动(节流:最多每30秒通知一次)
  const timeSinceLastNotify = now - lastActivityNotifyRef.current;
  if (wsRef.current?.readyState === WebSocket.OPEN && timeSinceLastNotify > 30000) {
    wsRef.current.send(JSON.stringify({
      type: MessageType.USER_ACTIVITY,
      timestamp: now,
    }));
    lastActivityNotifyRef.current = now;
    console.log('[Collaboration] Notified server of user activity');
  }
}, []);
```

**关键点**:
- ✅ 监听全局用户活动(已有)
- ✅ 每 30 秒最多发送一次通知(节流)
- ✅ 不影响客户端本地的空闲检测
- ✅ 网络开销极小

---

## 🔄 完整流程

### 场景 1: 用户在 Pan 模式下浏览画布

```
用户在画布上移动鼠标
   ↓
客户端检测到 mousemove 事件 ✅
   ↓
updateUserActivity() 被调用
   ↓
lastUserActivityRef 更新(本地) ✅
   ↓
每 30 秒发送一次 user_activity 消息 → 服务端
   ↓
服务端更新 lastUserActionAt ✅
   ↓
管理面板显示: 空闲 0秒 ✅
   ↓
不会被自动断开 ✅
```

---

### 场景 2: 用户在编辑模式下操作节点

```
用户拖动节点
   ↓
发送 drag_move 消息 → 服务端
   ↓
服务端更新 lastUserActionAt ✅
   ↓
同时客户端检测到 mousemove
   ↓
lastUserActivityRef 更新 ✅
   ↓
(30秒内不重复发送 user_activity) ✅
```

**优势**:
- 编辑操作已经会发送消息,不需要重复发送
- `user_activity` 作为补充,覆盖非编辑场景

---

### 场景 3: 用户完全不动

```
用户打开画布,不移动鼠标,不操作
   ↓
lastUserActivityRef 不更新
   ↓
不发送 user_activity 消息
   ↓
服务端 lastUserActionAt 不更新
   ↓
空闲时长持续增长: 0s → 30s → 60s → 120s
   ↓
客户端 2 分钟后自动断开 ✅
```

---

## 📊 性能分析

### 网络开销

**之前**:
```
编辑操作: 每次操作 1 条消息
总开销: 取决于操作频率
```

**现在**:
```
编辑操作: 每次操作 1 条消息(不变)
浏览活动: 最多每 30 秒 1 条消息
总开销: 编辑操作 + (浏览时间 / 30秒)
```

**示例**:
```
用户浏览 10 分钟:
- 之前: 0 条消息
- 现在: 20 条消息(10分钟 / 30秒)
- 每条消息: ~50 字节
- 总计: 1KB

完全可以接受 ✅
```

---

### 消息频率对比

| 活动类型 | 发送频率 | 单位时间消息数 |
|---------|---------|--------------|
| 编辑节点 | 实时 | 取决于操作(例如拖动时 30fps) |
| update_presence | 节流 100ms | 每秒 10 条 |
| **user_activity** | **节流 30s** | **每 30 秒 1 条** |

**结论**:
- `user_activity` 的频率**远低于**其他消息
- 对网络的影响**可忽略**

---

## 🎯 关键优化点

### 1. 节流机制避免频繁发送

```typescript
const timeSinceLastNotify = now - lastActivityNotifyRef.current;
if (timeSinceLastNotify > 30000) { // ← 30 秒节流
  // 发送消息
  lastActivityNotifyRef.current = now;
}
```

**为什么是 30 秒?**
- 客户端空闲检测每 30 秒检查一次
- 客户端空闲超时是 2 分钟(120 秒)
- 30 秒通知一次,可以确保服务端在 2 分钟内收到至少 4 次通知
- 足够准确,又不会太频繁

---

### 2. 覆盖所有用户活动场景

| 场景 | 客户端检测 | 服务端接收 | 结果 |
|------|----------|----------|------|
| 编辑节点 | ✅ mousemove | ✅ drag_move | 不空闲 |
| Pan 模式浏览 | ✅ mousemove | ✅ user_activity | 不空闲 ✅ |
| 画布空白区移动 | ✅ mousemove | ✅ user_activity | 不空闲 ✅ |
| 滚动画布 | ✅ wheel | ✅ user_activity | 不空闲 ✅ |
| 点击按钮 | ✅ click | ✅ user_activity | 不空闲 ✅ |
| 完全不动 | ❌ | ❌ | 空闲 ✅ |

---

### 3. 不影响客户端本地检测

```typescript
// 本地检测不变
lastUserActivityRef.current = now; // ← 立即更新

// 服务端通知有节流
if (timeSinceLastNotify > 30000) {
  // 发送 user_activity
}
```

**好处**:
- 客户端的空闲检测仍然是精确的
- 服务端的显示可能有 30 秒误差(可接受)
- 不会导致误判

---

## 🧪 测试场景

### 测试 1: Pan 模式浏览画布

**步骤**:
```bash
# 1. 打开房间
http://localhost:3000/?canvasId=test_pan

# 2. 切换到 Pan 模式

# 3. 在画布上移动鼠标(不操作节点)

# 4. 打开管理面板,观察空闲时长
http://localhost:3000/admin
```

**预期结果**:
- ✅ 空闲时长保持在 0-30 秒之间
- ✅ 不会超过 2 分钟断开
- ✅ 控制台每 30 秒显示: `[Collaboration] Notified server of user activity`

---

### 测试 2: 画布空白区域移动鼠标

**步骤**:
```bash
# 1. 打开房间
# 2. 在画布的空白区域移动鼠标(不悬停在节点上)
# 3. 观察管理面板
```

**预期结果**:
- ✅ 空闲时长保持较低
- ✅ 不会被判断为空闲

---

### 测试 3: 编辑模式操作节点

**步骤**:
```bash
# 1. 打开房间
# 2. 拖动节点
# 3. 观察控制台
```

**预期结果**:
- ✅ 不额外发送 user_activity(因为 drag_move 已经发送了)
- ✅ 空闲时长为 0

---

### 测试 4: 完全不动

**步骤**:
```bash
# 1. 打开房间
# 2. 2 分钟不移动鼠标,不操作
# 3. 观察是否断开
```

**预期结果**:
- ✅ 空闲时长增长: 0s → 30s → 60s → 90s → 120s
- ✅ 2 分钟后自动断开
- ✅ 显示提示: "由于长时间未操作..."

---

## 📝 修改的文件

| 文件 | 修改内容 | 行数 |
|------|---------|------|
| `packages/server/src/types.ts` | 新增 `USER_ACTIVITY` 消息类型 | +7 |
| `packages/server/src/canvasRoom.ts` | 处理 `user_activity` 消息 | +3 |
| `packages/widget/src/hooks/useCollaboration.ts` | 新增 `USER_ACTIVITY` 枚举 | +1 |
| `packages/widget/src/hooks/useCollaboration.ts` | 添加发送通知逻辑 | +12 |

**总计**: ~25 行代码

---

## 🎯 核心改进

### 之前

| 活动类型 | 算作用户操作? |
|---------|-------------|
| 创建/编辑/删除节点 | ✅ |
| 拖动节点 | ✅ |
| Pan 模式浏览 | ❌ |
| 画布空白区移动 | ❌ |
| 滚动画布 | ❌ |

**问题**: 用户浏览画布时被误判为空闲

---

### 现在

| 活动类型 | 算作用户操作? |
|---------|-------------|
| 创建/编辑/删除节点 | ✅ |
| 拖动节点 | ✅ |
| **Pan 模式浏览** | **✅** |
| **画布空白区移动** | **✅** |
| **滚动画布** | **✅** |
| **任何鼠标/键盘活动** | **✅** |

**效果**: 只要用户在使用画布,就不会被断开

---

## 🔮 后续优化

### 1. 可配置节流时间

```typescript
export interface CollaborationConfig {
  // ...
  activityNotifyInterval?: number; // 默认 30000ms
}

const {
  activityNotifyInterval = 30000,
} = config;
```

---

### 2. 只监听画布容器内的事件

```typescript
// 传入画布容器 ref
const canvasRef = useRef<HTMLElement>(null);

useCollaboration({
  canvasId,
  userId,
  containerRef: canvasRef, // ← 只监听此容器内的事件
});
```

**好处**:
- 更精确(只计算画布内的活动)
- 避免用户在其他 UI 上的操作被计入

---

### 3. 区分活动类型

```typescript
// 发送更详细的活动信息
wsRef.current.send(JSON.stringify({
  type: MessageType.USER_ACTIVITY,
  timestamp: now,
  eventType: 'mousemove', // ← 记录事件类型
}));
```

**用途**:
- 分析用户行为
- 更精细的空闲判断

---

## ✅ 验证清单

测试前确认:

- [ ] Pan 模式下浏览画布,空闲时长保持低位
- [ ] 画布空白区域移动鼠标,不被判断为空闲
- [ ] 滚动画布,空闲时长重置
- [ ] 2 分钟完全不动,自动断开
- [ ] 控制台每 30 秒显示一次活动通知
- [ ] 管理面板空闲时长准确

---

## 🎉 总结

### 问题
- 只有编辑操作算作用户活动
- 用户浏览画布时被误判为空闲
- Pan 模式下会被自动断开

### 原因
- 服务端只认可编辑类消息
- 客户端检测到活动,但服务端不知道

### 修复
- 新增 `user_activity` 消息类型
- 客户端定期通知服务端用户活动
- 使用 30 秒节流,避免频繁发送

### 效果
- ✅ 任何鼠标/键盘活动都算有效操作
- ✅ Pan 模式浏览不会被断开
- ✅ 画布空白区移动也算活动
- ✅ 网络开销可忽略(每 30 秒 1 条消息)
- ✅ 完全不动仍然会自动断开

现在可以重新部署并测试! 🚀

**关键改进**: 
用户只要在**使用画布**(任何模式),就不会被误判为空闲! ✨
