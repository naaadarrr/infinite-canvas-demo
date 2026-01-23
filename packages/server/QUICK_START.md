# 快速启动指南

本指南帮助你在 5 分钟内启动并测试协同编辑后端。

## 🚀 快速开始（最简单的方式）

### 1. 安装依赖

```bash
cd packages/server
pnpm install
```

### 2. 启动本地服务器

```bash
pnpm dev
```

服务将在 `http://127.0.0.1:8787` 启动。

### 3. 测试连接

打开浏览器访问：`http://127.0.0.1:8787`

你应该看到：

```json
{
  "name": "Infinite Canvas Server",
  "version": "0.0.1",
  "status": "running"
}
```

### 4. 测试协同功能

打开 `test-client.html`：

```bash
# macOS
open test-client.html

# Linux
xdg-open test-client.html

# Windows
start test-client.html
```

或者直接拖拽 `test-client.html` 到浏览器中。

### 5. 多窗口测试

1. 点击 "连接" 按钮
2. 点击 "创建节点" 按钮创建几个节点
3. **打开第二个浏览器窗口**（或无痕模式），再次打开 `test-client.html`
4. 在第二个窗口中点击 "连接"
5. 尝试在两个窗口中拖动节点，观察实时同步！

## 🎯 完整设置（生产环境）

如果上述快速启动不够，你想要完整的 D1 + R2 支持：

### 1. 创建 D1 数据库

```bash
wrangler d1 create canvas_db
```

将输出的 `database_id` 填入 `wrangler.toml`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "canvas_db"
database_id = "粘贴你的-database-id"
```

### 2. 应用数据库迁移

```bash
pnpm d1:migrate
```

### 3. 重启服务

```bash
pnpm dev
```

## 📝 测试清单

- [ ] 后端启动成功（访问 `http://127.0.0.1:8787` 返回 JSON）
- [ ] 测试客户端可以连接（状态显示"已连接"）
- [ ] 可以创建节点
- [ ] 可以拖动节点
- [ ] 打开第二个窗口，两个窗口中的节点可以实时同步
- [ ] 拖动节点时，另一个窗口显示"节点已锁定"
- [ ] 关闭一个窗口，另一个窗口的在线用户列表更新

## 🔧 API 测试

### 创建画布

```bash
curl -X POST http://127.0.0.1:8787/api/canvas \
  -H "Content-Type: application/json" \
  -d '{"title":"测试画布"}'
```

### 获取画布列表

```bash
curl http://127.0.0.1:8787/api/canvas
```

## 🐛 常见问题

### 问题：端口 8787 被占用

**解决方案**：修改 `wrangler.toml`，添加：

```toml
[dev]
port = 8788
```

然后在 `test-client.html` 中修改 API_BASE 和 WS_BASE。

### 问题：WebSocket 连接失败

**解决方案**：
1. 确认后端已启动（访问 `http://127.0.0.1:8787`）
2. 检查浏览器控制台的错误信息
3. 确认防火墙没有阻止连接

### 问题：节点不同步

**解决方案**：
1. 打开两个窗口的浏览器控制台
2. 查看 WebSocket 消息
3. 确认两个窗口都显示"已连接"

## 📚 下一步

- 查看 [完整文档](./README.md)
- 集成到你的 React 应用：[集成示例](../widget/COLLABORATION_EXAMPLE.md)
- 部署到生产环境：[协同功能设置指南](../../COLLABORATION_SETUP.md)

## 💡 提示

- 本地开发不需要 D1/R2，数据会保存在内存中
- 使用 `--persist` 标志可以保存数据到磁盘：`wrangler dev --local --persist`
- 想看日志？使用 `pnpm tail` 或直接查看终端输出

## 🎉 成功！

如果你能在两个浏览器窗口中同时拖动节点并看到实时同步，恭喜你，协同编辑功能已经正常工作了！

现在你可以：
- 集成到你的前端应用
- 自定义节点类型
- 添加更多协同功能（评论、选择、光标等）
