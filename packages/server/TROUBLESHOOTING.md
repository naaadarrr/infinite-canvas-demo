# 故障排除指南

## 🔐 D1 数据库创建失败 - API Token 权限错误

### 错误信息

```
Authentication error [code: 10000]
It looks like you are authenticating Wrangler via a custom API token
```

### 原因

您的 Cloudflare API Token 缺少创建 D1 数据库的权限。

### 解决方案

#### 选项 A：使用本地开发模式（推荐用于开发/测试）

本地开发模式不需要创建真正的 D1 数据库：

```bash
# 1. 注释掉 wrangler.toml 中的 database_id
# 编辑 wrangler.toml，将 database_id 留空或注释掉

# 2. 直接启动开发服务器
pnpm dev

# Wrangler 会自动：
# - 创建本地 SQLite 数据库（在 .wrangler/state/）
# - 应用数据库迁移
# - 模拟 R2 存储
```

**优点：**
- ✅ 无需配置 Cloudflare
- ✅ 立即可用
- ✅ 数据持久化到本地磁盘
- ✅ 完全离线工作

#### 选项 B：创建新的 API Token（用于生产部署）

如果您需要部署到 Cloudflare 生产环境：

1. **访问 Cloudflare Dashboard**：
   https://dash.cloudflare.com/profile/api-tokens

2. **创建自定义 Token**：
   - 点击 "Create Token"
   - 选择 "Create Custom Token"

3. **配置权限**：
   ```
   Permissions:
   - Account | D1 | Edit
   - Account | Workers Scripts | Edit
   - Account | Workers R2 Storage | Edit
   - Account | Account Settings | Read
   
   Account Resources:
   - Include | Your Account Name
   ```

4. **保存并使用新 Token**：
   ```bash
   # 方式 1: 环境变量
   export CLOUDFLARE_API_TOKEN="your-new-token"
   
   # 方式 2: 重新登录
   wrangler logout
   wrangler login
   ```

5. **重试创建数据库**：
   ```bash
   wrangler d1 create canvas_db
   ```

#### 选项 C：使用 OAuth 登录（最简单）

如果上述方法都不行，使用 OAuth 登录：

```bash
# 1. 退出当前登录
wrangler logout

# 2. 使用浏览器重新登录
wrangler login

# 3. 创建数据库
wrangler d1 create canvas_db
```

这种方式会给予完整的账户权限。

### 更新 wrangler.toml

创建数据库成功后，将输出的 `database_id` 填入 `wrangler.toml`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "canvas_db"
database_id = "填写这里"  # 例如：xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## 🚀 快速开始建议

**对于开发和测试，我们强烈建议使用选项 A（本地模式）：**

```bash
cd packages/server

# 确保 wrangler.toml 中的 database_id 为空
# database_id = ""

# 直接启动
pnpm dev

# 打开测试客户端
open test-client.html
```

这样可以立即开始测试协同功能，无需任何 Cloudflare 配置！

## 📋 本地开发完整流程

```bash
# 1. 安装依赖
cd packages/server
pnpm install

# 2. 启动服务（自动创建本地数据库）
pnpm dev

# 输出应该类似：
# ⎔ Starting local server...
# ⎔ Applying database migrations...
# [wrangler:inf] Ready on http://127.0.0.1:8787

# 3. 验证服务
curl http://127.0.0.1:8787

# 4. 打开测试客户端
open test-client.html

# 5. 在多个浏览器窗口中测试协同功能
```

## 🔍 验证本地设置

检查本地数据库是否正常工作：

```bash
# 查看本地数据库文件
ls -la .wrangler/state/v3/d1/

# 查看画布列表（服务启动后）
curl http://127.0.0.1:8787/api/canvas

# 创建测试画布
curl -X POST http://127.0.0.1:8787/api/canvas \
  -H "Content-Type: application/json" \
  -d '{"title":"测试画布"}'
```

## 📊 本地 vs 生产环境对比

| 特性 | 本地模式 | 生产环境 |
|------|---------|---------|
| 需要 Cloudflare 账户 | ❌ 不需要 | ✅ 需要 |
| 需要 API Token | ❌ 不需要 | ✅ 需要 |
| 数据持久化 | ✅ 本地磁盘 | ✅ Cloudflare |
| 全球 CDN | ❌ 本地访问 | ✅ 边缘节点 |
| 适用场景 | 开发/测试 | 生产部署 |

## ⚠️ 注意事项

1. **本地数据库位置**：`.wrangler/state/v3/d1/`
   - 不要删除此目录，否则会丢失所有数据
   - 已在 `.gitignore` 中排除

2. **端口冲突**：如果 8787 被占用，可以在 `wrangler.toml` 中修改：
   ```toml
   [dev]
   port = 8788
   ```

3. **数据迁移**：本地数据库的迁移会自动应用，无需手动操作

## 🎯 推荐的开发流程

```bash
# 阶段 1: 本地开发和测试（无需 Cloudflare）
cd packages/server
pnpm dev  # 使用本地数据库

# 阶段 2: 集成测试
cd ../..
pnpm dev:all  # 同时启动前后端

# 阶段 3: 准备生产部署
# 1. 修复 API Token 权限
# 2. 创建真正的 D1 数据库
# 3. 创建 R2 存储桶
# 4. 运行 pnpm deploy

# 阶段 4: 部署
pnpm deploy:server
```

## 📞 需要帮助？

如果问题仍然存在：

1. 检查 Cloudflare 控制台中的账户设置
2. 确认您的账户类型（Free/Pro/Business）
3. 查看 `.wrangler/logs/` 中的详细日志
4. 参考 [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)

## ✅ 验证清单

- [ ] 可以启动 `pnpm dev` 无报错
- [ ] 访问 `http://127.0.0.1:8787` 返回 JSON
- [ ] 可以创建画布（`POST /api/canvas`）
- [ ] 测试客户端可以连接
- [ ] 多个窗口可以实时同步

完成上述检查后，您的本地开发环境就完全就绪了！
