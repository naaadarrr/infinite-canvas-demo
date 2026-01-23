# 🚀 从这里开始

## ✅ 服务器已经启动并运行！

您的协同编辑后端服务器当前正在 `http://localhost:8787` 运行。

## 🎯 快速测试

### 1. 测试基本 API

```bash
# 获取服务状态
curl http://localhost:8787

# 创建画布
curl -X POST http://localhost:8787/api/canvas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer user_test" \
  -d '{"title":"我的画布"}'

# 获取画布列表
curl http://localhost:8787/api/canvas
```

### 2. 测试协同功能

打开测试客户端：

```bash
# macOS
open test-client.html

# Linux
xdg-open test-client.html

# Windows
start test-client.html
```

或者直接双击 `test-client.html` 文件。

### 3. 多窗口测试

1. 在测试客户端中点击 **"连接"** 按钮
2. 点击 **"创建节点"** 按钮创建几个节点
3. **打开第二个浏览器窗口**（或无痕模式）
4. 在第二个窗口中也打开 `test-client.html` 并点击 **"连接"**
5. 🎉 现在可以在两个窗口中拖动节点，观察实时同步！

## 📋 当前状态

✅ 后端服务器运行中 (`http://localhost:8787`)  
✅ D1 数据库已初始化  
✅ R2 存储已模拟  
✅ Durable Objects 已就绪  
✅ WebSocket 支持已启用  

## 🔧 如果需要重启服务器

### 停止服务器

在运行 `pnpm dev` 的终端中按 `Ctrl+C`

### 重新启动

```bash
cd packages/server
pnpm dev
```

**注意**：如果服务器启动后出现 "no such table" 错误，运行：

```bash
./scripts/init-db.sh
```

## 📚 下一步

### 集成到前端应用

1. 参考 `packages/widget/COLLABORATION_EXAMPLE.md` 查看集成示例
2. 使用 `useCollaboration` Hook：

```typescript
import { useCollaboration } from '@tc/infinite-widget';

const collab = useCollaboration(
  {
    canvasId: 'your-canvas-id',
    userId: 'user-123',
  },
  handleMessage
);

// 发送拖拽
collab.dragMove(nodeId, { x: 100, y: 200 });
```

### 启动完整应用

在项目根目录运行：

```bash
pnpm dev:all
```

这会同时启动前端和后端。

## 🎨 测试客户端功能

测试客户端 (`test-client.html`) 提供了：

- ✅ 可视化节点拖拽
- ✅ 实时消息日志
- ✅ 在线用户列表
- ✅ 节点锁定状态显示
- ✅ 多用户光标显示

## 🐛 故障排除

### 问题：端口 8787 被占用

修改 `wrangler.toml`:

```toml
[dev]
port = 8788
```

然后在测试客户端中更新 `API_BASE` 和 `WS_BASE`。

### 问题：数据库错误

运行初始化脚本：

```bash
./scripts/init-db.sh
```

### 问题：WebSocket 连接失败

1. 确认服务器正在运行
2. 检查浏览器控制台的错误信息
3. 确认 URL 正确（`ws://localhost:8787`）

## 📖 文档

- **完整文档**: `README.md`
- **快速入门**: `QUICK_START.md`
- **故障排除**: `TROUBLESHOOTING.md`
- **API 文档**: 查看 `README.md` 的 API 部分
- **集成示例**: `../widget/COLLABORATION_EXAMPLE.md`

## 🎉 成功标志

如果你能：

- ✅ 访问 `http://localhost:8787` 并看到 JSON 响应
- ✅ 创建画布并获取画布列表
- ✅ 在测试客户端中连接成功
- ✅ 在两个浏览器窗口中实时同步节点

恭喜！🎊 你的协同编辑后端已经完全就绪！

## 💡 有用的命令

```bash
# 查看日志
pnpm tail

# 重新初始化数据库
./scripts/init-db.sh

# 检查数据库内容
sqlite3 .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite "SELECT * FROM canvases;"

# 停止服务器
# 在运行的终端按 Ctrl+C
```

## 🚀 准备部署？

当你准备部署到生产环境时：

1. 参考 `TROUBLESHOOTING.md` 设置 Cloudflare API Token
2. 创建生产环境的 D1 数据库和 R2 存储桶
3. 运行 `pnpm deploy`

详细说明请查看 `../../COLLABORATION_SETUP.md`。

---

**享受你的协同编辑体验！** 🎨✨
