# 客户端空闲检测调试

## 🐛 问题现象

用户反馈:
- 用户 `user_1i0uiq` 空闲时长显示 0秒
- 用户 `user_khda82` 空闲时长 2分41秒,但没有被自动断开
- 用户 `user_8cht3q` 和 `user_6nudzw` 空闲 6分44秒,仍然没有断开

**预期行为**: 用户空闲超过 2 分钟应该自动断开

---

## 🔍 可能的原因

### 原因 1: 空闲检测定时器没有启动

**检查点**:
```typescript
// startClientIdleCheck() 应该在 ws.onopen 时调用
ws.onopen = () => {
  // ...
  startClientIdleCheck(); // ← 这里
};
```

**验证方法**:
- 打开浏览器控制台
- 连接时应该看到: `[Collaboration] Starting client-side idle detection (timeout: 120000ms = 120s)`

---

### 原因 2: lastUserActivityRef 被意外更新

**可能场景**:
1. 收到其他用户的消息时,误更新了本地活动时间
2. `user_activity` 消息发送时,同时更新了本地时间
3. 全局事件监听器意外触发

**排查方法**:
```typescript
// 在 updateUserActivity 中添加日志
const updateUserActivity = useCallback(() => {
  const now = Date.now();
  console.log('[Collaboration] Updating user activity at', new Date(now).toLocaleTimeString());
  lastUserActivityRef.current = now;
  // ...
}, []);
```

---

### 原因 3: 定时器被清除

**可能场景**:
- 组件重新渲染时,`useEffect` 清理函数被调用
- `stopClientIdleCheck()` 被意外调用

**排查方法**:
```typescript
const stopClientIdleCheck = useCallback(() => {
  console.log('[Collaboration] Stopping client-side idle detection');
  if (idleCheckTimerRef.current) {
    clearInterval(idleCheckTimerRef.current);
    idleCheckTimerRef.current = null;
  }
}, []);
```

---

### 原因 4: 定时器间隔太长

当前设置:
- 检查间隔: 30 秒
- 超时时间: 2 分钟

**问题**:
- 如果用户在 2:15 时停止活动
- 定时器在 2:00 检查(正常)
- 下一次检查在 2:30(超时后 15 秒)
- 所以实际断开时间可能是 2:00 - 2:30 之间

**解决方案**: 缩短检查间隔

```typescript
// 改为每 15 秒检查一次
idleCheckTimerRef.current = setInterval(() => {
  // ...
}, 15000); // 15 秒
```

---

## ✅ 已实施的修复

### 修复 1: 添加详细日志

```typescript
// 启动时日志
console.log(`[Collaboration] Starting client-side idle detection (timeout: ${clientIdleTimeout}ms = ${clientIdleTimeout / 1000}s)`);

// 每次检查时日志
const idleSeconds = Math.floor(idleTime / 1000);
console.log(`[Collaboration] Idle check: ${idleSeconds}s idle (threshold: ${clientIdleTimeout / 1000}s)`);

// 断开时日志
console.log(`[Collaboration] User idle for ${idleSeconds}s, disconnecting...`);
```

---

### 修复 2: 修复重连逻辑

**问题**:
```typescript
// ❌ 错误: 检查"不是"空闲断开
if (!wasIdleDisconnectedRef.current && !wsRef.current && shouldReconnectRef.current) {
  connect();
}
```

**修复**:
```typescript
// ✅ 正确: 检查"是"空闲断开
if (wasIdleDisconnectedRef.current && !wsRef.current && shouldReconnectRef.current) {
  connect();
}
```

---

## 🧪 测试步骤

### 测试 1: 验证定时器启动

```bash
# 1. 打开房间
http://localhost:3000/?canvasId=test_idle

# 2. 打开浏览器控制台

# 3. 查找日志
[Collaboration] Starting client-side idle detection (timeout: 120000ms = 120s)
```

**预期**: 看到启动日志

---

### 测试 2: 验证定时检查

```bash
# 1. 保持页面打开,不移动鼠标

# 2. 每 30 秒查看控制台

# 预期日志:
[Collaboration] Idle check: 30s idle (threshold: 120s)
[Collaboration] Idle check: 60s idle (threshold: 120s)
[Collaboration] Idle check: 90s idle (threshold: 120s)
[Collaboration] Idle check: 120s idle (threshold: 120s)
[Collaboration] User idle for 120s, disconnecting...
```

---

### 测试 3: 验证活动更新

```bash
# 1. 打开房间

# 2. 移动鼠标

# 3. 查看控制台

# 预期日志:
[Collaboration] Updating user activity at 11:20:30
[Collaboration] Notified server of user activity (每 30 秒最多一次)
```

---

### 测试 4: 验证自动重连

```bash
# 1. 打开房间,等待 2 分钟断开

# 2. 移动鼠标

# 预期:
- 看到日志: [Collaboration] User activity detected after idle disconnect, reconnecting...
- WebSocket 重新连接
- 页面恢复正常
```

---

## 🔧 进一步调试方案

如果问题仍然存在,添加更多日志:

### 方案 1: 监控 lastUserActivityRef 变化

```typescript
// 在 updateUserActivity 中
const updateUserActivity = useCallback(() => {
  const now = Date.now();
  const prev = lastUserActivityRef.current;
  const gap = now - prev;
  
  console.log(`[Collaboration] Activity: previous=${new Date(prev).toLocaleTimeString()}, gap=${gap}ms`);
  
  lastUserActivityRef.current = now;
  // ...
}, []);
```

---

### 方案 2: 监控事件触发

```typescript
// 在全局事件监听中
events.forEach(event => {
  window.addEventListener(event, (e) => {
    console.log(`[Collaboration] Event: ${event} from ${e.target}`);
    throttledActivity();
  }, { passive: true });
});
```

---

### 方案 3: 添加性能监控

```typescript
// 检查定时器是否被清除
setInterval(() => {
  console.log('[Collaboration] Timer check:', {
    idleCheckTimer: idleCheckTimerRef.current !== null,
    wsConnected: wsRef.current?.readyState === WebSocket.OPEN,
    lastActivity: new Date(lastUserActivityRef.current).toLocaleTimeString(),
  });
}, 60000); // 每分钟检查一次
```

---

## 📊 预期日志输出

### 正常场景 (用户有活动)

```
[Collaboration] Starting client-side idle detection (timeout: 120000ms = 120s)
[Collaboration] Idle check: 0s idle (threshold: 120s)
[Collaboration] Updating user activity at 11:20:15
[Collaboration] Idle check: 0s idle (threshold: 120s)
[Collaboration] Updating user activity at 11:20:45
[Collaboration] Idle check: 0s idle (threshold: 120s)
```

---

### 空闲场景 (用户无活动)

```
[Collaboration] Starting client-side idle detection (timeout: 120000ms = 120s)
[Collaboration] Idle check: 30s idle (threshold: 120s)
[Collaboration] Idle check: 60s idle (threshold: 120s)
[Collaboration] Idle check: 90s idle (threshold: 120s)
[Collaboration] Idle check: 120s idle (threshold: 120s)
[Collaboration] User idle for 120s, disconnecting...
[Collaboration] Stopped client-side idle detection
⚠️ 由于长时间未操作，已自动断开连接。移动鼠标即可恢复连接。
```

---

### 重连场景

```
[Collaboration] Disconnected (idle)
[Collaboration] User activity detected after idle disconnect, reconnecting...
[Collaboration] Connecting to: ws://localhost:8787/ws/canvas/test_idle
[Collaboration] Connected
[Collaboration] Starting client-side idle detection (timeout: 120000ms = 120s)
```

---

## 🎯 下一步

1. **重新部署** 包含日志的版本
2. **打开浏览器控制台** 观察日志
3. **测试 2 分钟空闲** 看是否自动断开
4. **收集日志** 如果仍然不工作,分享完整日志
5. **调整检查间隔** 如果需要,改为 15 秒检查一次

---

## 💡 临时解决方案

如果客户端检测仍然不工作,可以依赖服务端的空闲检测:

```typescript
// canvasRoom.ts - 服务端空闲检测(已实现)
private startIdleCheck(): void {
  this.idleCheckTimer = setInterval(() => {
    const now = Date.now();
    const toClose: WebSocket[] = [];
    
    for (const [ws, info] of this.connections.entries()) {
      // 基于 lastUserActionAt (不是 lastActiveAt)
      if (now - info.lastUserActionAt > this.idleTimeoutMs) {
        console.log(`[CanvasRoom] Closing idle connection: ${info.userId}`);
        toClose.push(ws);
      }
    }
    
    toClose.forEach(ws => {
      ws.close(4001, 'Idle timeout');
    });
  }, 60000);
}
```

这个服务端检测**已经实现**,应该可以作为备份方案。
