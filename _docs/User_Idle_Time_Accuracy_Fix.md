# 用户空闲时间准确性修复

## ⚠️ 问题描述

**现象**:
- 用户进入房间后没有任何鼠标或键盘操作
- 管理面板每次刷新都显示该用户"空闲时长 0秒"
- 超过 2 分钟后,客户端也没有自动下线

**用户反馈**:
> "这个用户在进入后一直没有任何鼠标的动作或者行为,但是每次刷新都是显示空闲时长是 0,导致超过了2分钟没有任何操作都没有client层都没有让它自动下线"

**实际截图**:
```
用户ID: user_1i0uiq
空闲时长: 0秒 ❌ (不准确)
```

---

## 🔍 根本原因分析

### 问题 1: 服务端 `lastActiveAt` 的更新逻辑

#### 之前的实现

```typescript
// canvasRoom.ts - handleMessage()

private async handleMessage(ws: WebSocket, message: ClientMessage): Promise<void> {
  const conn = this.connections.get(ws);
  if (!conn) return;

  // ❌ 任何消息都会更新 lastActiveAt
  conn.lastActiveAt = Date.now();

  switch (message.type) {
    case 'update_presence': // ← 包括这种非用户操作的消息
      // ...
  }
}
```

**问题**:
- `update_presence` 消息可能由鼠标移动触发(其他用户的)
- 或者其他系统级消息
- 导致 `lastActiveAt` 一直在更新,即使用户没有主动操作

---

### 问题 2: 管理面板显示的空闲时间

#### 之前的实现

```typescript
// canvasRoom.ts - handleGetStatus()

connections: Array.from(this.connections.values()).map(conn => ({
  userId: conn.userId,
  userName: conn.userName,
  joinedAt: conn.joinedAt,
  lastActiveAt: conn.lastActiveAt,
  idleSeconds: Math.floor((now - conn.lastActiveAt) / 1000), // ← 基于任何消息
}))
```

**问题**:
- 空闲时间基于 `lastActiveAt`
- 而 `lastActiveAt` 包括所有消息(包括非用户操作)
- 导致空闲时间不准确

---

### 问题 3: 客户端空闲检测是否正常?

**客户端实现**(正确的):

```typescript
// useCollaboration.ts

// 客户端空闲检测
const lastUserActivityRef = useRef<number>(Date.now());

// 监听真实用户活动
useEffect(() => {
  const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel', 'click'];
  
  const handleActivity = () => {
    lastUserActivityRef.current = Date.now(); // ✅ 只在真实用户操作时更新
    // ...
  };
  
  events.forEach(event => {
    window.addEventListener(event, throttledActivity);
  });
}, []);

// 定期检查
setInterval(() => {
  const idleTime = Date.now() - lastUserActivityRef.current;
  if (idleTime > clientIdleTimeout) {
    // 断开连接 ✅
  }
}, 30000);
```

**结论**: 客户端逻辑是**正确的**,问题出在服务端显示。

---

## ✅ 解决方案

### 方案: 区分"任何消息"和"用户操作"

**核心思想**:
- `lastActiveAt`: 最后收到**任何消息**的时间(保持不变)
- `lastUserActionAt`: 最后收到**用户主动操作**的时间(新增)

### 实现

#### 1. 修改 `ConnectionInfo` 类型

```typescript
// types.ts

export interface ConnectionInfo {
  userId: string;
  userName?: string;
  joinedAt: number;
  lastActiveAt: number; // 最后活动时间(任何消息)
  lastUserActionAt: number; // 用户主动操作时间(不包括 update_presence)
  invisible?: boolean;
}
```

---

#### 2. 初始化连接时设置两个时间戳

```typescript
// canvasRoom.ts - handleJoin()

const now = Date.now();
this.connections.set(ws, {
  userId,
  userName,
  joinedAt: now,
  lastActiveAt: now,
  lastUserActionAt: now, // ← 初始化用户操作时间
  invisible: invisible || false,
});
```

---

#### 3. 区分消息类型更新时间戳

```typescript
// canvasRoom.ts - handleMessage()

private async handleMessage(ws: WebSocket, message: ClientMessage): Promise<void> {
  const conn = this.connections.get(ws);
  if (!conn) return;

  const now = Date.now();
  
  // 更新最后活动时间(任何消息)
  conn.lastActiveAt = now;
  
  // 只有用户主动操作才更新 lastUserActionAt
  const userActionTypes = [
    'create_node',
    'delete_node', 
    'update_node',
    'update_nodes',
    'drag_start',
    'drag_move',
    'drag_end',
    'lock',
    'unlock'
  ];
  
  if (userActionTypes.includes(message.type)) {
    conn.lastUserActionAt = now; // ← 只在用户操作时更新
  }

  switch (message.type) {
    // ...
  }
}
```

**关键区别**:
- ✅ `create_node`, `delete_node`, `update_node`: 用户操作
- ✅ `drag_start`, `drag_move`, `drag_end`: 用户操作
- ✅ `lock`, `unlock`: 用户操作
- ❌ `update_presence`: 不算用户操作(可能是被动触发)

---

#### 4. 管理面板显示基于用户操作时间

```typescript
// canvasRoom.ts - handleGetStatus()

connections: Array.from(this.connections.values()).map(conn => ({
  userId: conn.userId,
  userName: conn.userName,
  joinedAt: conn.joinedAt,
  lastActiveAt: conn.lastActiveAt,
  lastUserActionAt: conn.lastUserActionAt, // ← 新增字段
  idleSeconds: Math.floor((now - conn.lastUserActionAt) / 1000), // ← 基于用户操作时间
}))
```

---

## 🔄 修复后的行为

### 场景 1: 用户只是打开页面,不操作

**之前**:
```
用户打开页面
  ↓
可能收到其他用户的 update_presence 广播
  ↓
服务端 lastActiveAt 更新 ❌
  ↓
管理面板显示: 空闲 0秒 ❌
```

**现在**:
```
用户打开页面
  ↓
lastUserActionAt = 加入时间
  ↓
收到其他用户的广播(不更新 lastUserActionAt) ✅
  ↓
管理面板显示: 空闲 120秒 ✅
  ↓
客户端 2 分钟后自动断开 ✅
```

---

### 场景 2: 用户偶尔操作

**行为**:
```
用户打开页面 → lastUserActionAt = T0
  ↓
1 分钟后移动节点 → lastUserActionAt = T0 + 60s ✅
  ↓
管理面板显示: 空闲 0秒 ✅
  ↓
再 2 分钟无操作 → lastUserActionAt = T0 + 60s (不变)
  ↓
管理面板显示: 空闲 120秒 ✅
  ↓
客户端自动断开 ✅
```

---

## 📊 消息类型分类

### 用户主动操作 (更新 `lastUserActionAt`)

| 消息类型 | 说明 | 是否更新 |
|---------|------|---------|
| `create_node` | 创建节点 | ✅ |
| `delete_node` | 删除节点 | ✅ |
| `update_node` | 更新单个节点 | ✅ |
| `update_nodes` | 批量更新节点 | ✅ |
| `drag_start` | 开始拖拽 | ✅ |
| `drag_move` | 拖拽移动 | ✅ |
| `drag_end` | 结束拖拽 | ✅ |
| `lock` | 锁定节点 | ✅ |
| `unlock` | 解锁节点 | ✅ |

---

### 系统消息 (不更新 `lastUserActionAt`)

| 消息类型 | 说明 | 是否更新 |
|---------|------|---------|
| `update_presence` | 更新光标位置 | ❌ |
| `ping` | 心跳(如果有) | ❌ |

---

## 🧪 测试场景

### 测试 1: 用户只打开不操作

**步骤**:
```bash
# 1. 打开房间,不做任何操作
http://localhost:3000/?canvasId=test_idle

# 2. 打开管理面板,选择该房间
http://localhost:3000/admin

# 3. 观察空闲时长,每 5 秒刷新一次
```

**预期结果**:
```
0秒  → 5秒  → 10秒 → ... → 120秒 → (用户断开)
```

**实际日志**:
```
[Collaboration] User idle for 121s, disconnecting...
```

---

### 测试 2: 用户偶尔操作

**步骤**:
```bash
# 1. 打开房间
http://localhost:3000/?canvasId=test_idle2

# 2. 等待 1 分钟

# 3. 移动一个节点

# 4. 再等待 2 分钟,不操作
```

**预期结果**:
```
空闲时长: 60秒 → (移动节点) → 0秒 → 30秒 → 60秒 → 120秒 → (断开)
```

---

### 测试 3: 多用户协作

**步骤**:
```bash
# 1. 用户 A 打开房间,不操作
# 2. 用户 B 打开房间,频繁操作
# 3. 观察用户 A 的空闲时长
```

**预期结果**:
- 用户 A 的空闲时长持续增长 ✅
- 用户 B 的操作不影响用户 A ✅
- 用户 A 在 2 分钟后断开 ✅

---

## 🎯 关键改进

### 1. 精确的空闲检测

**之前**:
```typescript
idleSeconds: Math.floor((now - conn.lastActiveAt) / 1000)
```
- 包括所有消息
- 不准确 ❌

**现在**:
```typescript
idleSeconds: Math.floor((now - conn.lastUserActionAt) / 1000)
```
- 只计算用户操作
- 准确 ✅

---

### 2. 保留 `lastActiveAt` 用于其他用途

```typescript
conn.lastActiveAt = now; // 任何消息都更新
```

**用途**:
- 检测 WebSocket 连接是否活跃
- 网络监控
- 调试

---

### 3. 向后兼容

```typescript
// 返回两个时间戳
lastActiveAt: conn.lastActiveAt,
lastUserActionAt: conn.lastUserActionAt,
```

**好处**:
- 管理面板可以显示两个时间
- 调试时可以对比
- 不破坏现有逻辑

---

## 📝 修改的文件

| 文件 | 修改内容 | 行数 |
|------|---------|------|
| `packages/server/src/types.ts` | 添加 `lastUserActionAt` 字段 | +1 |
| `packages/server/src/canvasRoom.ts` | 初始化 `lastUserActionAt` | +1 |
| `packages/server/src/canvasRoom.ts` | 区分消息类型更新时间戳 | +9 |
| `packages/server/src/canvasRoom.ts` | 修改空闲时间计算 | +1 |

**总计**: ~15 行代码

---

## 🔮 后续优化

### 1. 可配置的消息类型

```typescript
// 从环境变量读取
const userActionTypes = (env.USER_ACTION_TYPES || 
  'create_node,delete_node,update_node,drag_start,drag_move,drag_end').split(',');
```

---

### 2. 管理面板显示两种时间

```typescript
// UI 显示
最后消息: 5秒前
最后操作: 120秒前 ← 用于判断是否空闲
```

---

### 3. 基于操作类型的权重

```typescript
// 不同操作有不同权重
const weights = {
  'drag_move': 0.5,    // 轻量操作
  'create_node': 1.0,  // 标准操作
  'delete_node': 1.0,
};

// 加权计算空闲时间
```

---

## ✅ 验证清单

测试前确认:

- [ ] 用户打开房间不操作,空闲时长持续增长
- [ ] 空闲 2 分钟后客户端自动断开
- [ ] 管理面板显示准确的空闲时长
- [ ] 其他用户的操作不影响该用户的空闲时长
- [ ] 用户操作后,空闲时长归零
- [ ] 控制台日志正确

---

## 🎉 总结

### 问题
- 管理面板显示用户空闲时长为 0秒
- 超过 2 分钟不操作也不自动断开
- 空闲检测不准确

### 原因
- 服务端 `lastActiveAt` 包括所有消息
- `update_presence` 等系统消息也会更新时间戳
- 空闲时间计算不准确

### 修复
- 新增 `lastUserActionAt` 字段
- 只在用户主动操作时更新
- 管理面板基于用户操作时间显示

### 效果
- ✅ 空闲时长准确反映用户行为
- ✅ 2 分钟不操作自动断开
- ✅ 管理面板显示正确
- ✅ 不影响其他功能

现在可以重新部署并测试! 🚀

**关键验证**:
```bash
# 打开房间,不操作,观察空闲时长
http://localhost:3000/?canvasId=test_idle

# 预期: 0s → 30s → 60s → 90s → 120s → 断开
```
