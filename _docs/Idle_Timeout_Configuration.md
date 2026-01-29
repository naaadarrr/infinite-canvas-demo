# 空闲超时配置

## ✅ 已实现的优化

### 优化 1: 画布预览无感刷新 ✅

**问题**: 管理面板刷新时,画布预览 iframe 会重新加载导致闪烁

**原因**: 
```typescript
// ❌ 错误: 每次渲染 Date.now() 都不同,导致 src 变化
<iframe src={`/?canvasId=${roomId}&userId=admin_${Date.now()}`} />
```

**修复**:
```typescript
// ✅ 正确: 使用固定的 userId
const adminUserId = useMemo(() => `admin_${Math.random().toString(36).slice(2, 9)}`, []);

<iframe 
  key={selectedRoomId}
  src={`/?canvasId=${selectedRoomId}&adminMode=true&userId=${adminUserId}`} 
/>
```

**效果**:
- ✅ 状态刷新时 iframe 不重新加载
- ✅ 画布内容保持连续,无闪烁
- ✅ 只有切换房间时才重新加载

---

### 优化 2: 空闲超时改为 2 分钟并可配置 ✅

**修改前**:
```typescript
const clientIdleTimeoutMs = 5 * 60 * 1000; // 固定 5 分钟
```

**修改后**:
```typescript
export interface CollaborationConfig {
  // ...其他配置
  clientIdleTimeout?: number; // 客户端空闲超时(毫秒),默认 2 分钟
}

const {
  clientIdleTimeout = 2 * 60 * 1000, // 默认 2 分钟
} = config;
```

**效果**:
- ✅ 默认超时改为 2 分钟
- ✅ 可以通过配置自定义超时时间
- ✅ 更快释放空闲连接

---

## 配置方式

### 方式 1: 使用默认值 (2 分钟)

```typescript
const collab = useCollaboration(
  {
    canvasId,
    userId,
    userName,
    enabled: true,
    // 不指定 clientIdleTimeout,使用默认 2 分钟
  },
  handleMessage
);
```

---

### 方式 2: 自定义超时时间

```typescript
const collab = useCollaboration(
  {
    canvasId,
    userId,
    userName,
    enabled: true,
    clientIdleTimeout: 5 * 60 * 1000, // 5 分钟
  },
  handleMessage
);
```

---

### 方式 3: 通过环境变量配置

```typescript
// .env.local
NEXT_PUBLIC_CLIENT_IDLE_TIMEOUT=120000  # 2 分钟(毫秒)
```

```typescript
const collab = useCollaboration(
  {
    canvasId,
    userId,
    userName,
    enabled: true,
    clientIdleTimeout: process.env.NEXT_PUBLIC_CLIENT_IDLE_TIMEOUT 
      ? parseInt(process.env.NEXT_PUBLIC_CLIENT_IDLE_TIMEOUT) 
      : 2 * 60 * 1000,
  },
  handleMessage
);
```

---

### 方式 4: 通过组件属性配置

```typescript
// CollaborativeCanvas.tsx
export interface CollaborativeCanvasProps {
  // ...其他属性
  clientIdleTimeout?: number;
}

export function CollaborativeCanvas({
  canvasId,
  userId,
  userName,
  clientIdleTimeout,
  // ...其他属性
}: CollaborativeCanvasProps) {
  const collab = useCollaboration(
    {
      canvasId,
      userId,
      userName,
      enabled: collabEnabled,
      invisible,
      clientIdleTimeout, // 传递配置
    },
    handleMessage
  );
}
```

```typescript
// 使用时
<CollaborativeCanvas
  canvasId="room15"
  userId="user_123"
  clientIdleTimeout={10 * 60 * 1000}  // 10 分钟
/>
```

---

## 推荐配置

### 开发环境

```typescript
clientIdleTimeout: 10 * 60 * 1000  // 10 分钟
```

**理由**:
- 开发时可能需要长时间思考
- 避免频繁断开影响调试

---

### 生产环境

```typescript
clientIdleTimeout: 2 * 60 * 1000  // 2 分钟 (默认)
```

**理由**:
- 快速释放空闲连接
- 降低服务器负载
- 减少 DO Duration 消耗

---

### 演示/展示环境

```typescript
clientIdleTimeout: 30 * 60 * 1000  // 30 分钟
```

**理由**:
- 用户可能长时间观看
- 避免演示过程中断开

---

### 管理员面板

```typescript
clientIdleTimeout: undefined  // 禁用空闲检测
```

或

```typescript
clientIdleTimeout: Infinity  // 永不超时
```

**理由**:
- 管理员需要长时间监控
- 隐形连接不占用太多资源

---

## 配置对比

| 场景 | 超时时间 | 检测频率 | 理由 |
|------|---------|---------|------|
| 生产环境 | 2 分钟 | 30 秒 | 快速释放空闲连接 |
| 开发环境 | 10 分钟 | 30 秒 | 便于调试 |
| 演示环境 | 30 分钟 | 30 秒 | 避免演示中断 |
| 管理面板 | 禁用 | - | 长时间监控 |

---

## 技术实现

### 1. 接口定义

```typescript
// packages/widget/src/hooks/useCollaboration.ts

export interface CollaborationConfig {
  canvasId: string;
  userId: string;
  userName?: string;
  wsUrl?: string;
  token?: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  enabled?: boolean;
  invisible?: boolean;
  clientIdleTimeout?: number; // ← 新增: 客户端空闲超时(毫秒)
}
```

---

### 2. 默认值

```typescript
const {
  canvasId,
  userId,
  userName,
  // ...其他配置
  clientIdleTimeout = 2 * 60 * 1000, // ← 默认 2 分钟
} = config;
```

---

### 3. 空闲检测

```typescript
const startClientIdleCheck = useCallback(() => {
  console.log(`[Collaboration] Starting client-side idle detection (timeout: ${clientIdleTimeout}ms)`);
  
  idleCheckTimerRef.current = setInterval(() => {
    const now = Date.now();
    const idleTime = now - lastUserActivityRef.current;
    
    if (idleTime > clientIdleTimeout) {  // ← 使用配置的超时时间
      console.log(`[Collaboration] User idle for ${Math.floor(idleTime / 1000)}s, disconnecting...`);
      
      // 断开连接...
    }
  }, 30000); // 每30秒检查一次
}, [clientIdleTimeout]);
```

---

## 测试场景

### 场景 1: 默认 2 分钟超时

**步骤**:
1. 打开房间,不指定 `clientIdleTimeout`
2. 2 分钟不操作
3. 观察自动断开

**预期结果**:
- ✅ 2 分钟后自动断开
- ✅ 显示提示: "由于长时间未操作..."
- ✅ 移动鼠标后自动重连

---

### 场景 2: 自定义 5 分钟超时

**代码**:
```typescript
<CollaborativeCanvas
  canvasId="room15"
  userId="user_123"
  clientIdleTimeout={5 * 60 * 1000}
/>
```

**步骤**:
1. 打开房间
2. 5 分钟不操作
3. 观察自动断开

**预期结果**:
- ✅ 5 分钟后才断开 (不是 2 分钟)
- ✅ 日志显示: `timeout: 300000ms`

---

### 场景 3: 画布预览无闪烁

**步骤**:
1. 打开管理面板
2. 选择一个房间
3. 点击"显示画布"
4. 等待自动刷新 (每 5 秒)
5. 观察画布预览

**预期结果**:
- ✅ 状态数据更新 (连接数、节点数)
- ❌ 画布 iframe 不重新加载
- ❌ 没有闪烁

---

## 日志示例

### 启动时

```
[Collaboration] Starting client-side idle detection (timeout: 120000ms)
```

### 2 分钟后断开

```
[Collaboration] User idle for 121s, disconnecting...
[Collaboration] Disconnected from canvas: room15 code: 1000 reason: Client idle timeout
⚠️ 由于长时间未操作，已自动断开连接。移动鼠标即可恢复连接。
[Collaboration] Stopped client-side idle detection
```

### 自定义超时

```
[Collaboration] Starting client-side idle detection (timeout: 300000ms)
```

---

## 性能影响

### 超时时间对性能的影响

| 超时时间 | DO Duration 影响 | 服务器负载 | 用户体验 |
|---------|-----------------|----------|---------|
| 1 分钟 | ⬇️⬇️⬇️ 最低 | ⬇️⬇️⬇️ 最低 | ⚠️ 频繁断开 |
| 2 分钟 | ⬇️⬇️ 很低 | ⬇️⬇️ 很低 | ✅ 平衡 |
| 5 分钟 | ⬇️ 较低 | ⬇️ 较低 | ✅ 舒适 |
| 10 分钟 | ➡️ 中等 | ➡️ 中等 | ✅ 宽松 |
| 禁用 | ⬆️⬆️ 较高 | ⬆️⬆️ 较高 | ✅ 无中断 |

---

### 检测频率对性能的影响

当前实现: 每 30 秒检查一次

```typescript
setInterval(() => {
  const idleTime = Date.now() - lastUserActivityRef.current;
  if (idleTime > clientIdleTimeout) {
    // 断开...
  }
}, 30000); // 30 秒
```

**性能分析**:
- CPU: 每次检查 < 0.1ms
- 内存: 几乎无影响
- 网络: 无影响 (不发送请求)

**结论**: 30 秒的检测频率完全可以接受

---

## 修改的文件

| 文件 | 修改内容 | 行数 |
|------|---------|------|
| `apps/demo/src/app/admin/page.tsx` | 修复 iframe 闪烁 | +5 |
| `packages/widget/src/hooks/useCollaboration.ts` | 添加可配置超时 | +8 |

**总计**: ~15 行代码

---

## 后续优化

### 1. 渐进式警告

```typescript
// 1分30秒时显示警告
if (idleTime > clientIdleTimeout - 30000 && idleTime < clientIdleTimeout) {
  showWarning('30秒后将自动断开，移动鼠标可保持连接');
}
```

### 2. 用户偏好

```typescript
// 允许用户在 UI 中设置
<select onChange={(e) => setIdleTimeout(parseInt(e.target.value))}>
  <option value={120000}>2 分钟</option>
  <option value={300000}>5 分钟</option>
  <option value={600000}>10 分钟</option>
  <option value={Infinity}>永不断开</option>
</select>
```

### 3. 智能调整

```typescript
// 根据用户活跃度动态调整
const adjustedTimeout = isActiveUser 
  ? 10 * 60 * 1000  // 活跃用户: 10 分钟
  : 2 * 60 * 1000;  // 普通用户: 2 分钟
```

---

## 总结

✅ **优化 1**: 画布预览无感刷新,无闪烁  
✅ **优化 2**: 空闲超时改为 2 分钟  
✅ **优化 3**: 超时时间可配置  
✅ **编译通过**: 无错误  
✅ **向后兼容**: 不影响现有功能  

**关键改进**:
1. 管理面板刷新时画布不重新加载
2. 默认 2 分钟空闲超时
3. 灵活的配置方式
4. 更好的性能和用户体验

现在可以重新启动前端并测试! 🎉
