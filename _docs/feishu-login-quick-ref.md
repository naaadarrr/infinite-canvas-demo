# 飞书登录快速配置参考

## 🚀 快速开始（5分钟配置）

### 1. 飞书开放平台

1. 访问 https://open.feishu.cn/app
2. 创建企业自建应用
3. 获取 **App ID** 和 **App Secret**
4. 添加重定向 URL: `http://localhost:3002/admin/auth/callback`
5. 开启权限:
   - `contact:user.base:readonly`
   - `contact:user.email:readonly`
6. 发布应用到企业

### 2. 环境变量配置

编辑 `apps/demo/.env.local`:

```bash
# 飞书配置
FEISHU_APP_ID=cli_xxxxxxxxxxxx
FEISHU_APP_SECRET=your_secret_here
FEISHU_REDIRECT_URI=http://localhost:3002/admin/auth/callback

# 管理员白名单（用逗号分隔）
ADMIN_WHITELIST=admin@company.com,manager@company.com

# Session 密钥（至少32个字符）
SESSION_SECRET=$(openssl rand -base64 32)
```

### 3. 安装依赖

```bash
cd apps/demo
pnpm install
```

### 4. 启动服务

```bash
pnpm dev
```

访问: http://localhost:3002/admin

## 📝 核心文件清单

### 新增文件

```
apps/demo/src/
├── lib/
│   ├── feishu.ts              # 飞书 OAuth 工具
│   └── session.ts             # Session 管理
├── app/admin/
│   ├── login/
│   │   └── page.tsx          # 登录页面
│   └── auth/
│       ├── login/
│       │   └── route.ts      # 发起登录 API
│       ├── callback/
│       │   └── route.ts      # 授权回调 API
│       ├── logout/
│       │   └── route.ts      # 退出登录 API
│       └── me/
│           └── route.ts      # 获取用户信息 API
├── components/ui/
│   └── alert.tsx             # Alert 组件
└── middleware.ts              # 路由保护中间件
```

### 修改文件

```
apps/demo/
├── .env.local                 # 环境变量配置 ✏️
├── package.json               # 添加 jose 依赖 ✏️
└── src/app/admin/
    └── page.tsx              # 添加用户信息和退出功能 ✏️
```

## 🔐 安全检查清单

- [ ] `SESSION_SECRET` 使用随机生成的 32+ 字符
- [ ] `ADMIN_WHITELIST` 只包含需要访问的邮箱
- [ ] `FEISHU_APP_SECRET` 未提交到 Git
- [ ] 生产环境使用 HTTPS
- [ ] 生产环境的 `FEISHU_REDIRECT_URI` 已在飞书平台配置

## 🧪 测试步骤

1. ✅ 访问 `/admin` 自动跳转登录页
2. ✅ 点击登录按钮跳转飞书授权页
3. ✅ 授权后成功登录管理后台
4. ✅ 顶部显示用户信息
5. ✅ 关闭浏览器后重新打开仍然保持登录
6. ✅ 点击退出按钮成功退出
7. ✅ 非白名单用户无法登录

## 📊 功能对照表

| 需求 | 实现 | 文件 |
|-----|-----|------|
| 1. 飞书企业登录 | ✅ | `lib/feishu.ts` |
| 2. 获取用户信息 | ✅ | `app/admin/auth/callback/route.ts` |
| 3. 白名单验证 | ✅ | `lib/feishu.ts` |
| 4. 30天登录态 | ✅ | `lib/session.ts` |
| 5. 登录页面UI | ✅ | `app/admin/login/page.tsx` |
| 6. 用户信息展示 | ✅ | `app/admin/page.tsx` |
| 7. 退出登录 | ✅ | `app/admin/auth/logout/route.ts` |
| 8. 路由保护 | ✅ | `middleware.ts` |

## 🐛 故障排查

### 问题: 无法跳转到飞书授权页

**检查:**
- [ ] `FEISHU_APP_ID` 是否正确
- [ ] `FEISHU_REDIRECT_URI` 格式是否正确
- [ ] 浏览器控制台是否有错误

### 问题: 授权后提示无权限

**检查:**
- [ ] 当前用户邮箱是否在 `ADMIN_WHITELIST` 中
- [ ] 飞书是否开启了 `contact:user.email:readonly` 权限
- [ ] 用户是否有企业邮箱

### 问题: 登录后立即退出

**检查:**
- [ ] `SESSION_SECRET` 是否配置
- [ ] Cookie 是否被浏览器阻止
- [ ] 开发环境是否使用 `localhost`（不要使用 127.0.0.1）

## 🌐 生产环境部署

1. **更新重定向 URL**
   ```bash
   FEISHU_REDIRECT_URI=https://your-domain.com/admin/auth/callback
   ```

2. **飞书平台添加生产 URL**
   在「网页配置」中添加生产环境回调地址

3. **设置环境变量**
   在部署平台（Cloudflare/Vercel）设置环境变量

4. **验证 HTTPS**
   确保生产环境使用 HTTPS

## 💡 常用命令

```bash
# 生成 SESSION_SECRET
openssl rand -base64 32

# 启动开发服务器
pnpm dev

# 查看环境变量
cat apps/demo/.env.local

# 重启服务
# Ctrl+C 然后重新运行 pnpm dev
```

## 📞 获取帮助

详细文档: `_docs/feishu-login-setup.md`

---

**完成配置后，访问 `http://localhost:3002/admin` 开始使用！** 🎉
