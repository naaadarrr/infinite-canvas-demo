# Idle Timeout + Auto Reconnect 规则规范

适用于：  
- 协同画布（React Flow / Infinite Canvas）  
- WebSocket 长连接  
- Cloudflare Durable Objects  
- 无心跳、客户端自管理连接生命周期模型  

---

## 一、目标

通过客户端 idle 计时，实现：

1. 空闲用户自动断开连接（释放 DO / WS）
2. 用户再次操作自动重连
3. 不依赖心跳
4. 不依赖服务端计时
5. 显著减少 DO duration 占用

---

## 二、有效动作定义（Activity）

只要发生以下任意事件，即视为 **有效动作**，必须调用 `markActivity()` 更新 `lastUserActivityAt`：

### 1) 鼠标 / 触摸
- mousemove
- mousedown / mouseup
- click / dblclick
- wheel
- drag / drop
- touchstart / touchmove

### 2) 画布操作（React Flow / Infinite Canvas）
- 节点移动
- 节点创建 / 删除
- 节点属性修改
- 连线创建 / 删除
- 选中节点
- 画布平移（pan）
- 缩放（zoom）

### 3) 键盘
- keydown（画布作用域内）
- 文本编辑（节点、输入框）

**规则**：
- 仅用户真实操作触发，外部广播/同步消息不得刷新 `lastUserActivityAt`。
- 事件监听需做节流（建议 1s）以降低成本。

---

## 三、客户端状态机（仅 3 个状态）

### 状态定义
1. **CONNECTED**：WebSocket 已连接，空闲检测运行中
2. **IDLE_DISCONNECTED**：因空闲主动断开，等待用户活动触发重连
3. **OFFLINE**：非空闲原因断开（被踢、房间关闭、手动关闭、禁用），不自动重连

### 状态字段（最小集合）
- `lastUserActivityAt`：最后一次有效动作时间戳
- `idleTimeoutMs`：空闲超时阈值
- `idleCheckIntervalMs`：空闲检测周期
- `autoReconnect` / `reconnectIntervalMs`
- `idleDisconnectReason`（boolean / enum）
- `reconnectBlocked`（boolean）

### 状态转移（核心）
| From | Trigger | To | 动作 |
|------|---------|----|------|
| CONNECTED | 有效动作 | CONNECTED | 更新 `lastUserActivityAt`，必要时通知服务端（节流） |
| CONNECTED | `idleTime >= idleTimeoutMs` | IDLE_DISCONNECTED | `ws.close(1000, 'Client idle timeout')`，停止空闲检测 |
| IDLE_DISCONNECTED | 有效动作 | CONNECTED | 立即发起 `connect()` 并重置 idle 计时 |
| CONNECTED | 断开且为永久原因 | OFFLINE | 停止检测、阻止重连、提示用户 |
| CONNECTED | 临时断开（网络抖动等） | CONNECTED | 走自动重连定时器（不进入 IDLE_DISCONNECTED） |

**永久原因（示例）**：房间已满、管理员关闭房间、被踢出、手动禁用连接。

---

## 四、Idle 计时规则

- **来源**：仅本地用户操作驱动。
- **计时**：`idleTime = now - lastUserActivityAt`。
- **检测频率**：默认 30s（可配置）。
- **超时触发**：达到 `idleTimeoutMs` 即主动断开（正常关闭码 1000）。
- **禁用**：`idleTimeoutMs = undefined | Infinity` 时关闭空闲检测。

---

## 五、自动重连规则

### 1) 空闲断开后的重连（核心体验）
- **仅在检测到用户再次操作时重连**。
- 不允许“空闲断开后立即自动重连”。

### 2) 非空闲断开（网络波动）
- 若 `autoReconnect = true` 且非永久原因，可按固定间隔或指数退避重连。
- 重连间隔默认 3000ms（可配置）。

### 3) 永久断开（阻断）
- close code / reason 命中永久原因时，进入 OFFLINE。
- 仅允许用户主动刷新或重新进入画布连接。

---

## 六、服务端协作原则（DO）

- **不依赖服务端计时**：客户端是 idle 的唯一判定者。
- **不使用心跳**：不发送无业务意义的 ping/pong。
- 服务端只在收到真实用户消息或 `USER_ACTIVITY`（节流）时更新 `lastUserActionAt`。
- 可保留服务端兜底空闲清退（较长阈值），但仅作为安全兜底，不作为主逻辑。

**建议的 close code 约定**：
- `1000`：客户端空闲主动断开（可在活动后重连）
- `4001`：服务端空闲兜底断开（客户端视作 idle，可在活动后重连）
- `4000 / 4003 / 4004`：永久断开（阻断重连）

---

## 七、推荐默认值

| 场景 | clientIdleTimeout | idleCheckInterval | reconnectInterval |
|------|------------------|------------------|------------------|
| 生产 | 2 分钟 | 30 秒 | 3 秒 |
| 开发 | 10 分钟 | 30 秒 | 3 秒 |
| 演示 | 30 分钟 | 30 秒 | 3 秒 |
| 管理员面板 | 禁用 | - | - |

---

## 八、验收标准（最小集）

1. 空闲到达阈值后，WS 自动断开（code 1000）
2. 空闲断开后，**首次用户操作**触发自动重连
3. 任意其他用户操作不应刷新本客户端 idle 计时
4. 无心跳消息产生
5. DO duration 明显下降（空闲用户不占用连接）

---

## 九、异常与边界

- **浏览器后台/休眠**：恢复后首次操作应触发重连。
- **网络瞬断**：按 autoReconnect 规则重连，不误判为 idle。
- **禁用连接（enabled=false）**：直接进入 OFFLINE，不再自动重连。

---

## 十、实现提示（非强制）

- 全局事件监听 + 画布事件监听双保险，避免漏记操作。
- 事件监听需节流，避免高频更新。
- 空闲断开时标记 `idleDisconnectReason = true`，并在用户活动时专门处理。

