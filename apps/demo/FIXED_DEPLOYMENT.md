# 🔧 正确配置 Cloudflare Pages Compatibility Flags

## 📋 当前状态

从你的截图看到:
- **Compatibility flags**: `nodejs_compat populate_process_env` ❌ (这是错误的格式)
- **Compatibility date**: `Jan 23, 2026` ✅

## ⚠️ 问题

当前的 compatibility flags 是一个单一字符串,但应该是**多个独立的标志**。

## ✅ 修复步骤

### 1. 点击 Compatibility flags 右侧的 ✏️ (编辑按钮)

### 2. 删除当前的标志
   - 删除整个 `nodejs_compat populate_process_env` 字符串

### 3. 重新添加正确的标志(逐个添加)

**第一个标志:**
- 点击 **Add flag**
- 输入: `nodejs_compat`
- 点击 Save 或 Add

**第二个标志(可选):**
- 点击 **Add flag**
- 输入: `populate_process_env`
- 点击 Save 或 Add

### 4. 保存设置

点击页面底部的 **Save** 按钮

### 5. 重新部署

在 **Deployments** 页面:
- 找到最新的部署
- 点击右侧的 **⋯** (三个点)
- 选择 **Retry deployment**

或者从命令行:
```bash
cd apps/demo
pnpm run deploy:pages
```

## 📝 最终应该看到的配置

在 **Compatibility flags** 部分应该显示为:
- `nodejs_compat`
- `populate_process_env`

两个独立的标志,而不是一个连在一起的字符串。

## 🎯 为什么会这样?

可能是之前配置时输入格式不正确,或者 Cloudflare 的 UI 更新导致。关键是要确保每个标志都是独立添加的。

## ⚡ 快速验证

部署完成后,访问 https://infinite-canvas-demo.pages.dev/ 应该不再显示 "nodejs_compat compatibility flag" 错误。
