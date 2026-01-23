#!/bin/bash

# 初始化本地 D1 数据库的简单脚本

echo "🔧 初始化本地 D1 数据库..."
echo ""

# 找到数据库文件
DB_DIR=".wrangler/state/v3/d1/miniflare-D1DatabaseObject"
if [ ! -d "$DB_DIR" ]; then
  echo "❌ 数据库目录不存在。请先运行 pnpm dev 创建数据库文件。"
  exit 1
fi

DB_FILE=$(find "$DB_DIR" -name "*.sqlite" | head -n 1)

if [ -z "$DB_FILE" ]; then
  echo "❌ 找不到数据库文件。请先运行 pnpm dev 创建数据库文件。"
  exit 1
fi

echo "📦 找到数据库: $DB_FILE"
echo ""

# 使用 sqlite3 命令行工具
if ! command -v sqlite3 &> /dev/null; then
  echo "❌ 未找到 sqlite3 命令。请安装 SQLite3:"
  echo "   brew install sqlite3"
  exit 1
fi

echo "🔨 应用数据库架构..."
sqlite3 "$DB_FILE" < d1/schema.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ 数据库初始化成功！"
  echo ""
  echo "📋 数据库表:"
  sqlite3 "$DB_FILE" "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
  echo ""
  echo "🎉 完成！现在可以运行 pnpm dev 启动服务器。"
else
  echo ""
  echo "❌ 初始化失败"
  exit 1
fi
