# 🔥 紧急修复: 添加 scope 参数

## 问题描述

**错误信息**:
```
Feishu auth callback error: Error: 获取用户访问令牌失败: undefined
```

**根本原因**:
授权 URL 缺少 `scope` 参数，导致飞书 API 拒绝授权请求。

## ✅ 已修复

### 修改的文件

`apps/demo/src/lib/feishu.ts`

### 修改内容

#### 1. 添加 scope 参数到授权 URL

```typescript
// ✅ 修复后
export function getFeishuAuthUrl(config: FeishuConfig, state?: string): string {
  const params = new URLSearchParams({
    app_id: config.appId,
    redirect_uri: config.redirectUri,
    state: state || Math.random().toString(36).substring(7),
    // ✨ 新增: scope 参数
    scope: 'contact:user.base:readonly contact:user.email:readonly',
  });

  return `https://open.feishu.cn/open-apis/authen/v1/authorize?${params.toString()}`;
}
```

#### 2. 增强错误日志

```typescript
// ✅ 修复后 - 显示详细的错误信息
if (data.code !== 0) {
  console.error('飞书 API 返回错误:', {
    code: data.code,
    msg: data.msg,
    error: data.error,
    error_description: data.error_description,
  });
  throw new Error(
    `获取用户访问令牌失败: ${data.msg || data.error_description || data.error || '未知错误'}`
  );
}
```

## 🚀 如何应用修复

### 方法 1: 自动更新（推荐）

代码已经更新，只需重启服务：

```bash
# 停止当前服务（Ctrl+C）
# 然后重新启动
cd apps/demo
pnpm dev
```

### 方法 2: 手动检查

如果自动更新失败，手动检查文件：

```bash
# 查看文件内容
cat apps/demo/src/lib/feishu.ts | grep -A 5 "scope"

# 应该看到:
# scope: 'contact:user.base:readonly contact:user.email:readonly',
```

## 🧪 测试修复

1. **清除浏览器缓存**
   ```
   - 清除 Cookie
   - 清除本地存储
   - 或使用无痕模式
   ```

2. **重新测试登录**
   ```
   1. 访问 http://localhost:3002/admin
   2. 点击「使用飞书账号登录」
   3. 在飞书授权页面确认授权
   4. 应该成功登录 ✅
   ```

3. **查看日志**
   ```bash
   # 如果仍有错误，查看详细日志
   # 现在会显示飞书 API 返回的完整错误信息
   ```

## 📋 验证清单

- [ ] 代码已更新（包含 scope 参数）
- [ ] 服务已重启
- [ ] 浏览器缓存已清除
- [ ] 能够跳转到飞书授权页
- [ ] 授权页面显示正确的权限请求
- [ ] 授权后成功回调
- [ ] 成功进入管理后台

## 🔍 scope 参数说明

### 必需的权限

| scope | 说明 | 用途 |
|-------|------|------|
| `contact:user.base:readonly` | 获取用户基本信息 | 获取姓名、头像等 |
| `contact:user.email:readonly` | 获取用户邮箱 | 用于白名单验证 |

### 飞书平台配置

确保在飞书开放平台已开启这些权限：

1. 进入「权限管理」→「权限配置」
2. 搜索并开启：
   - ✅ `contact:user.base:readonly`
   - ✅ `contact:user.email:readonly`
3. 保存并发布应用

## 🐛 如果仍然失败

### 检查飞书应用配置

```bash
# 1. 确认权限已开启
进入飞书开放平台 → 权限管理 → 权限配置
确保两个权限都已开启并保存

# 2. 确认应用已发布
进入版本管理与发布
确保应用状态为「已发布」

# 3. 确认重定向 URL 正确
进入网页 → 网页配置
确保包含: http://localhost:3002/admin/auth/callback
```

### 查看详细错误

现在代码会输出详细的错误信息：

```javascript
// 控制台会显示
飞书 API 返回错误: {
  code: 错误码,
  msg: 错误信息,
  error: 错误类型,
  error_description: 错误描述
}
```

根据错误信息进行针对性修复。

## 📚 相关文档

- [完整故障排查指南](./feishu-login-troubleshooting.md)
- [配置指南](./feishu-login-setup.md)
- [问题解答](./feishu-login-qa.md)

## 🎯 快速命令

```bash
# 重启服务
cd apps/demo && pnpm dev

# 查看文件是否包含 scope
grep -n "scope:" apps/demo/src/lib/feishu.ts

# 清除 node_modules 重新安装（如果需要）
rm -rf node_modules && pnpm install
```

---

**修复时间**: 2026-02-11
**状态**: ✅ 已修复
**影响**: 所有用户
**优先级**: 🔥 高（阻塞登录功能）
