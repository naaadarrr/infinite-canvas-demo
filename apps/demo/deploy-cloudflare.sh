#!/bin/bash

# Cloudflare Pages 部署脚本
# 使用方法: ./deploy-cloudflare.sh

echo "🚀 开始部署到 Cloudflare Pages..."

# 1. 构建 Next.js 应用
echo "📦 构建应用..."
pnpm run build:pages

# 2. 复制 wrangler.toml 到构建输出目录
echo "📝 配置部署设置..."
cp wrangler.toml .vercel/output/static/

# 3. 部署到 Cloudflare Pages
echo "☁️  部署到 Cloudflare..."
cd .vercel/output/static
npx wrangler pages deploy . --project-name infinite-canvas-demo

echo "✅ 部署完成!"
