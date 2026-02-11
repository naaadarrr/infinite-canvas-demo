# 🔧 修复 Cloudflare Pages 部署错误

## ❌ 当前问题

网站 https://infinite-canvas-demo.pages.dev/ 显示错误:
```
Node.JS Compatibility Error
no nodejs_compat compatibility flag set
```

构建时出现警告:
```
▲ [WARNING] The package "node:buffer" wasn't found on the file system but is built into node.
▲ [WARNING] The package "node:async_hooks" wasn't found on the file system but is built into node.
```

## ✅ 解决方法(必须在 Cloudflare Dashboard 中配置)

### 步骤 1: 登录 Cloudflare Dashboard

访问 https://dash.cloudflare.com/

### 步骤 2: 找到你的 Pages 项目

1. 在左侧菜单中点击 **Workers & Pages**
2. 找到并点击 **infinite-canvas-demo** 项目

### 步骤 3: 配置兼容性设置(关键步骤!)

1. 点击 **Settings** 标签页
2. 在左侧菜单找到 **Functions** 部分并点击
3. 你会看到两个环境的设置:
   - **Production (production)**
   - **Preview (preview)**

对于 **Production 环境**:

4. 找到 **Compatibility date** 部分:
   - 点击 **Edit** 或直接修改
   - 设置为: `2026-01-23`（推荐）
   - 点击 **Save**

5. 找到 **Compatibility flags** 部分:
   - 点击 **Add flag** 按钮
   - 在输入框中输入: `nodejs_compat`
   - 点击 **Add** 或 **Save**
   - 再次点击 **Add flag**，输入: `nodejs_compat_populate_process_env`
   - 点击 **Add** 或 **Save**

对于 **Preview 环境**(如果你也想让预览环境正常工作):

6. 重复步骤 4-5,为 Preview 环境也添加相同的配置（日期和两个 flags 都一致）

### 步骤 4: 重新部署

配置保存后,你需要触发一次新的部署:

**选项 A: 在 Dashboard 中重试部署**
1. 点击 **Deployments** 标签页
2. 找到最新的部署记录
3. 点击右侧的 **⋯** (三个点菜单)
4. 选择 **Retry deployment**

**选项 B: 从本地重新部署(推荐)**
```bash
cd apps/demo
pnpm run deploy:pages
```

### 步骤 5: 验证修复

1. 等待部署完成(通常 1-2 分钟)
2. 访问 https://infinite-canvas-demo.pages.dev/
3. 确认错误已消失,页面正常显示

## 📋 为什么必须这样做?

1. **Cloudflare Pages 的限制**: `wrangler pages deploy` 命令**不支持** `--compatibility-flags` 参数
2. **wrangler.toml 的作用范围**: 虽然我们在代码中添加了 `wrangler.toml`,但对于 Pages 项目,这个文件只在 Workers 部署时生效,Pages 需要在 Dashboard 中配置
3. **持久化配置**: Dashboard 中的设置会保存在项目配置中,所有后续部署都会自动使用这些设置

## 🎯 配置后的效果

- ✅ `node:buffer` 模块可用
- ✅ `node:async_hooks` 模块可用
- ✅ Next.js 应用正常运行
- ✅ 后续部署无需重复配置

## ⚠️ 注意事项

- 必须为 **Production** 和 **Preview** 两个环境都配置
- 保存后必须重新部署才能生效
- 如果还是有问题,检查 **Compatibility date** 是否设置为 `2026-01-23`，并确认 flags 为 `nodejs_compat` + `nodejs_compat_populate_process_env`
