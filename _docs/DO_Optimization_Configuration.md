# DO 优化配置文档

## 环境变量配置

### DO 优化相关配置

在 `packages/server/wrangler.toml` 中添加以下环境变量:

```toml
[vars]
# DO优化配置
IDLE_TIMEOUT_MS = "300000"  # 5分钟用户空闲超时
EMPTY_ROOM_TIMEOUT_MS = "60000"  # 1分钟空房间超时
IDLE_CHECK_INTERVAL_MS = "60000"  # 60秒检查一次空闲连接
```

### 配置说明

#### IDLE_TIMEOUT_MS
- **类型**: 字符串(数字)
- **默认值**: `"300000"` (5分钟)
- **说明**: 用户无任何操作的超时时间(毫秒)。超过此时间后,连接将被自动关闭。
- **推荐值**: 
  - 开发环境: `"180000"` (3分钟)
  - 生产环境: `"300000"` (5分钟)
  - 严格模式: `"120000"` (2分钟)

#### EMPTY_ROOM_TIMEOUT_MS
- **类型**: 字符串(数字)
- **默认值**: `"60000"` (1分钟)
- **说明**: 房间无任何连接后的超时时间(毫秒)。超过此时间后,DO将清理所有定时器并准备终止。
- **推荐值**:
  - 开发环境: `"30000"` (30秒)
  - 生产环境: `"60000"` (1分钟)
  - 快速清理: `"10000"` (10秒)

#### IDLE_CHECK_INTERVAL_MS
- **类型**: 字符串(数字)
- **默认值**: `"60000"` (60秒)
- **说明**: 空闲检查的间隔时间(毫秒)。定期检查所有连接的空闲状态。
- **推荐值**:
  - 标准: `"60000"` (60秒)
  - 频繁检查: `"30000"` (30秒)
  - 宽松检查: `"120000"` (2分钟)

## 优化效果

### 优化前
- 心跳每30秒发送一次
- 空房间持续存在
- 僵尸连接无法清理
- 平均DO存活时间: 长期活跃

### 优化后
- 无心跳机制,依赖WebSocket原生检测
- 5分钟无活动自动断开连接
- 1分钟空房间自动清理
- 预期Duration降低: **≥40%**

## 监控指标

### 关键日志事件

优化后的系统会输出以下结构化日志:

```json
// 房间创建
{
  "event": "room_created",
  "roomId": "canvas_xxx",
  "timestamp": 1234567890
}

// 空闲超时
{
  "event": "idle_timeout",
  "roomId": "canvas_xxx",
  "userId": "user_xxx",
  "idleSeconds": 300,
  "timestamp": 1234567890
}

// 空房间关闭
{
  "event": "empty_room_shutdown",
  "roomId": "canvas_xxx",
  "emptyDurationMs": 60000,
  "timestamp": 1234567890
}
```

### Cloudflare Dashboard 监控

在 Cloudflare Dashboard 中关注以下指标:

1. **Durable Objects Duration**
   - 位置: Workers & Pages > [Your Worker] > Metrics > Durable Objects
   - 目标: 相比优化前降低 ≥40%

2. **Durable Objects Requests**
   - 观察请求数是否正常
   - 确保优化没有导致过多的DO重启

3. **WebSocket Connections**
   - 监控活跃连接数
   - 确认僵尸连接被正常清理

## 管理API

### 获取房间列表
```bash
GET /admin/rooms
Authorization: Bearer <token>
```

### 获取房间状态
```bash
GET /admin/rooms/:roomId
Authorization: Bearer <token>
```

响应示例:
```json
{
  "roomId": "canvas_xxx",
  "createdAt": 1234567890,
  "lastConnectionAt": 1234567890,
  "activeConnections": 2,
  "activeUsers": 2,
  "nodeCount": 10,
  "seq": 100,
  "idleSeconds": 0,
  "connections": [
    {
      "userId": "user_1",
      "userName": "Alice",
      "joinedAt": 1234567890,
      "lastActiveAt": 1234567890,
      "idleSeconds": 0
    }
  ]
}
```

### 关闭房间
```bash
POST /admin/rooms/:roomId/shutdown
Authorization: Bearer <token>
```

### 踢出用户
```bash
POST /admin/rooms/:roomId/kick
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user_xxx"
}
```

## 管理面板

访问 `/admin` 路由可以打开管理面板,提供以下功能:

- 查看所有房间列表
- 实时监控房间状态
- 查看连接详情
- 强制关闭房间
- 踢出指定用户
- 自动刷新(可配置间隔)

## 故障排查

### 问题1: 用户频繁断线

**症状**: 用户在正常使用时被断开连接

**可能原因**: `IDLE_TIMEOUT_MS` 设置过短

**解决方案**: 增加 `IDLE_TIMEOUT_MS` 值,建议至少5分钟

### 问题2: Duration仍然很高

**症状**: 优化后Duration没有明显降低

**可能原因**: 
1. 房间有持续的活动
2. 空房间超时设置过长
3. 仍有其他定时器在运行

**解决方案**:
1. 检查日志确认空闲检测是否正常工作
2. 减小 `EMPTY_ROOM_TIMEOUT_MS` 值
3. 确认所有心跳相关代码已移除

### 问题3: 管理面板无法访问

**症状**: 访问 `/admin` 返回404或401

**可能原因**: 
1. 路由未正确配置
2. Token验证失败

**解决方案**:
1. 确认 `apps/demo/src/app/admin/page.tsx` 文件存在
2. 检查 `NEXT_PUBLIC_USER_TOKEN` 环境变量
3. 确认Worker已部署最新代码

## 部署清单

优化完成后,部署前请确认:

- [ ] 所有代码已提交到git
- [ ] `wrangler.toml` 已更新环境变量
- [ ] 已在本地测试管理API
- [ ] 已测试管理面板UI
- [ ] 已准备监控Dashboard
- [ ] 已通知团队成员配置变更

## 回滚方案

如果优化导致问题,可以快速回滚:

1. 恢复之前的git commit
2. 重新部署Worker
3. 清除可能的DO Storage缓存(如需要)

```bash
# 回滚到优化前的版本
git revert <commit-hash>

# 重新部署
cd packages/server
wrangler deploy
```

## 下一步优化建议

1. **监控数据收集**: 收集1-2周的Duration数据,评估优化效果
2. **调整参数**: 根据实际使用情况微调超时参数
3. **考虑升级**: 如仍超出免费层,考虑升级到Paid Plan
4. **架构演进**: 评估是否需要DO+Queue混合架构

## 相关文档

- [Cloudflare Durable Objects 文档](https://developers.cloudflare.com/durable-objects/)
- [WebSocket API 文档](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [项目README](../README.md)
