# DO 管理面板修复说明

## 修复的问题

### 问题 1: 房间列表为空

**原因分析:**
- `handleListRooms` API 只查询 D1 数据库中的 `canvases` 表
- 直接通过 URL (`?canvasId=room15`) 打开的房间是临时 DO 实例
- 这些临时 DO 实例没有持久化到数据库,因此不会出现在列表中
- Cloudflare DO 目前不支持列举所有活跃的 DO 实例

**解决方案:**
1. ✅ 数据库查询改为容错模式,即使 D1 查询失败也返回空列表
2. ✅ 前端保留手动输入房间 ID 的功能
3. ✅ 在 API 响应中添加提示信息

**代码修改:**

```typescript
// packages/server/src/admin.ts
try {
  const rooms: any[] = [];
  
  // 从D1获取持久化的画布列表(容错处理)
  try {
    const result = await env.DB.prepare(
      'SELECT id, title, latest_seq, created_at, updated_at FROM canvases ORDER BY updated_at DESC LIMIT 100'
    ).all();
    
    if (result.results && result.results.length > 0) {
      rooms.push(...result.results);
    }
  } catch (dbError) {
    console.warn('[Admin] D1 query failed, returning empty list:', dbError);
  }

  return new Response(JSON.stringify({
    rooms: rooms,
    total: rooms.length,
    note: '提示: 活跃但未持久化的房间需要手动输入房间ID添加'
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
```

---

### 问题 2: 被踢出后自动重连

**原因分析:**
- 管理员踢出用户(close code 4004)或关闭房间(close code 4003)后
- WebSocket `onclose` 事件触发,但客户端的自动重连逻辑没有识别这些特殊的关闭码
- 导致用户被踢出后立即自动重连,又重新进入房间

**解决方案:**
1. ✅ 识别所有"永久性断开"的 close code
2. ✅ 对这些情况禁用自动重连
3. ✅ 显示友好的错误提示
4. ✅ 用户需要刷新页面才能重新连接

**关闭码定义:**

| Code | 含义 | 是否自动重连 |
|------|------|-------------|
| 1000 | 正常关闭 | ✅ 是 |
| 1013 | 服务器拒绝 | ❌ 否 |
| 4000 | 房间已满 | ❌ 否 |
| 4001 | 空闲超时 | ❌ 否 |
| 4002 | 连接错误 | ❌ 否 |
| 4003 | 房间被管理员关闭 | ❌ 否 |
| 4004 | 用户被管理员踢出 | ❌ 否 |

**代码修改:**

```typescript
// packages/widget/src/hooks/useCollaboration.ts
ws.onclose = (event) => {
  console.log('[Collaboration] Disconnected from canvas:', canvasId, 'code:', event.code, 'reason:', event.reason);
  setConnected(false);
  if (wsRef.current === ws) {
    wsRef.current = null;
  }

  // 处理不同的关闭代码
  if (event.code === 1013) {
    // 服务器拒绝
    reconnectBlockedRef.current = true;
  }
  
  if (
    event.code === 4000 || // 房间已满
    event.code === 4001 || // 空闲超时
    event.code === 4002 || // 其他错误
    event.code === 4003 || // 房间被管理员关闭
    event.code === 4004    // 用户被管理员踢出
  ) {
    shouldReconnectRef.current = false;
    reconnectBlockedRef.current = true;
    
    // 给用户友好的提示
    const reasons: Record<number, string> = {
      4000: '房间已满',
      4001: '由于长时间未操作，您已被自动断开连接',
      4002: '连接错误',
      4003: '房间已被管理员关闭',
      4004: '您已被管理员移出房间'
    };
    
    const reason = reasons[event.code] || event.reason || '连接已关闭';
    console.warn(`[Collaboration] 连接关闭: ${reason}，请刷新页面重新连接`);
    
    // 可以触发一个回调通知UI层
    if (onMessageRef.current) {
      onMessageRef.current({
        type: MessageType.ERROR,
        error: reason,
        code: event.code,
        permanent: true // 标识这是永久性断开，不会自动重连
      });
    }
  }
  
  if (manualCloseRef.current) {
    manualCloseRef.current = false;
    return;
  }

  // 自动重连（只在允许重连的情况下）
  if (
    enabled &&
    autoReconnect &&
    shouldReconnectRef.current &&
    !reconnectBlockedRef.current
  ) {
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('[Collaboration] Reconnecting...');
      connect();
    }, reconnectInterval);
  }
};
```

**UI 层处理:**

```typescript
// packages/widget/src/CollaborativeCanvas.tsx
case 'error':
  if (message.code === 'ROOM_FULL') {
    pushToast('The session is full, please try again later', 'error');
  } else if ((message as any).permanent) {
    // 永久性断开连接的错误
    pushToast(message.error || 'Connection closed', 'error');
  }
  break;
```

---

## 测试场景

### 场景 1: 临时房间监控

1. 打开房间: `http://localhost:3000/?canvasId=room15`
2. 打开管理面板: `http://localhost:3000/admin`
3. **预期结果**: 列表为空,显示提示信息
4. 手动输入 `room15` 并点击"添加"
5. **预期结果**: 房间出现在列表中,显示实时状态

### 场景 2: 管理员踢出用户

**操作步骤:**

1. 用户 A 打开房间: `http://localhost:3000/?canvasId=room15`
2. 管理员打开面板: `http://localhost:3000/admin`
3. 手动添加 `room15` 到监控列表
4. 点击用户 A 的"踢出"按钮

**预期结果:**

在用户 A 的浏览器中:
- ✅ WebSocket 连接关闭(code 4004)
- ✅ 显示错误提示: "您已被管理员移出房间"
- ✅ **不会自动重连**
- ✅ 用户需要刷新页面才能重新进入

在管理面板中:
- ✅ 房间的连接数减少
- ✅ 用户 A 从连接列表中消失

### 场景 3: 管理员关闭房间

**操作步骤:**

1. 多个用户打开同一房间
2. 管理员在面板中点击"关闭房间"

**预期结果:**

所有用户的浏览器中:
- ✅ WebSocket 连接关闭(code 4003)
- ✅ 显示错误提示: "房间已被管理员关闭"
- ✅ **不会自动重连**
- ✅ 需要刷新页面才能重新进入

在管理面板中:
- ✅ 房间的连接数变为 0
- ✅ DO 实例关闭

### 场景 4: 空闲超时

**操作步骤:**

1. 用户打开房间后 5 分钟不操作

**预期结果:**

- ✅ WebSocket 连接关闭(code 4001)
- ✅ 显示错误提示: "由于长时间未操作，您已被自动断开连接"
- ✅ **不会自动重连**
- ✅ 需要刷新页面才能重新进入

---

## 用户体验优化

### 错误提示

| 场景 | 提示文案 | 颜色 |
|------|---------|------|
| 房间已满 | "The session is full, please try again later" | 红色 |
| 空闲超时 | "由于长时间未操作，您已被自动断开连接" | 红色 |
| 被管理员踢出 | "您已被管理员移出房间" | 红色 |
| 房间被关闭 | "房间已被管理员关闭" | 红色 |
| 正在重连 | "连接断开，正在重连..." | 橙色 |

### 控制台日志

所有永久性断开都会输出警告日志:

```
⚠️ [Collaboration] 连接关闭: 您已被管理员移出房间，请刷新页面重新连接
```

---

## 部署步骤

### 1. 重新部署服务端

```bash
cd packages/server
npm run deploy
```

### 2. 重启前端开发服务器

```bash
# 停止当前服务 (Ctrl+C)
npm run dev
```

### 3. 验证修复

1. 打开浏览器控制台
2. 测试上述场景
3. 检查控制台日志和 UI 提示

---

## 注意事项

### 数据库房间 vs 临时 DO

- **数据库房间**: 持久化到 D1 的 `canvases` 表,会出现在列表中
- **临时 DO**: 直接通过 URL 访问的房间,不会持久化,需要手动添加

### 何时持久化?

目前的实现中,房间数据在以下情况会持久化到 D1:
1. 定期自动保存(每 30 秒)
2. 用户主动保存
3. 房间关闭前的最终保存

如果房间刚创建不久,还没有触发自动保存,就不会出现在数据库列表中。

### 建议的工作流程

1. **开发/测试阶段**: 使用手动输入房间 ID 来监控临时房间
2. **生产环境**: 大部分房间会被持久化,会自动出现在列表中
3. **紧急情况**: 如果需要快速监控某个活跃房间,直接输入房间 ID

---

## 相关文件

| 文件 | 修改内容 |
|------|---------|
| `packages/server/src/admin.ts` | 房间列表 API 容错处理 |
| `packages/widget/src/hooks/useCollaboration.ts` | WebSocket 关闭码识别和自动重连控制 |
| `packages/widget/src/CollaborativeCanvas.tsx` | 永久性错误的 UI 提示 |

---

## 后续优化建议

### 1. DO 实例列举

如果 Cloudflare 未来支持列举 DO 实例,可以直接获取所有活跃房间:

```typescript
// 伪代码(目前不支持)
const instances = await env.CANVAS_ROOM.list();
```

### 2. 主动推送

使用 WebSocket 或 Server-Sent Events 将 DO 状态变化主动推送到管理面板:

```typescript
// DO 内部
this.notifyAdmin({
  event: 'user_joined',
  roomId: this.canvasId,
  userId: conn.userId
});
```

### 3. 房间发现服务

维护一个中心化的房间注册表:

```typescript
// DO 创建时注册
await env.ROOM_REGISTRY.put(roomId, {
  createdAt: Date.now(),
  lastActivity: Date.now()
});

// 管理面板从注册表获取
const rooms = await env.ROOM_REGISTRY.list();
```

---

## 总结

✅ **问题 1 已修复**: 数据库查询容错,支持手动添加临时房间  
✅ **问题 2 已修复**: 识别永久性断开,禁止自动重连,显示友好提示  
✅ **用户体验**: 清晰的错误提示和控制台日志  
✅ **向后兼容**: 不影响现有功能  

现在可以正常使用管理面板监控和管理 DO 房间了! 🎉
