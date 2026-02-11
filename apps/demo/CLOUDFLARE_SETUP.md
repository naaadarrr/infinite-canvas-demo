# Cloudflare Pages 部署配置指南

## 问题描述

部署到 Cloudflare Pages 后出现 "Node.JS Compatibility Error: no nodejs_compat compatibility flag set" 错误。

## 解决方案

### 步骤 1: 登录 Cloudflare Dashboard

访问 https://dash.cloudflare.com/ 并登录

### 步骤 2: 进入项目设置

1. 点击左侧菜单的 **Workers & Pages**
2. 找到并点击 **infinite-canvas-demo** 项目
3. 点击 **Settings** 标签

### 步骤 3: 配置兼容性标志

1. 在左侧菜单中找到 **Functions** 部分
2. 先设置 **Compatibility Date** 为: `2026-01-23`
3. 滚动到 **Compatibility Flags** 区域
4. 点击 **Add flag** 按钮
5. 在输入框中输入: `nodejs_compat`
6. 再添加一个 flag: `nodejs_compat_populate_process_env`
7. 点击 **Save** 保存

### 步骤 4: 重新部署

配置保存后,有两种方式让配置生效:

**方式 1: 在 Dashboard 中重新部署**
1. 进入 **Deployments** 标签
2. 找到最新的部署
3. 点击右侧的 **···** (三个点)
4. 选择 **Retry deployment**

**方式 2: 从本地重新部署**
```bash
cd apps/demo
pnpm run deploy:pages
```

### 步骤 5: 验证

部署完成后,访问 https://infinite-canvas-demo.pages.dev/ 确认错误已解决。

## 为什么需要这样做?

Cloudflare Pages 的兼容性标志需要在项目设置中配置,而不能仅通过 `wrangler.toml` 文件设置。虽然我们在代码中包含了 `wrangler.toml`,但首次部署时需要在 Dashboard 中手动配置一次。

配置后,后续的部署都会自动使用这个设置。
