#!/bin/bash
# 检查远程 D1 数据库状态

echo "🔍 Checking remote D1 database..."
echo ""

# 检查表是否存在
echo "1. Checking if canvases table exists..."
result=$(wrangler d1 execute canvas_db --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name='canvases'" 2>&1)

if echo "$result" | grep -q "canvases"; then
  echo "✅ Table exists"
  
  # 查询记录数
  echo ""
  echo "2. Checking record count..."
  wrangler d1 execute canvas_db --remote --command "SELECT COUNT(*) as count FROM canvases"
  
  echo ""
  echo "3. Showing recent records..."
  wrangler d1 execute canvas_db --remote --command "SELECT id, title, latest_seq, updated_at FROM canvases ORDER BY updated_at DESC LIMIT 5"
else
  echo "❌ Table does not exist"
  echo ""
  echo "Creating table..."
  wrangler d1 execute canvas_db --remote --file=./d1/schema.sql
  
  if [ $? -eq 0 ]; then
    echo "✅ Table created successfully"
  else
    echo "❌ Failed to create table"
    exit 1
  fi
fi

echo ""
echo "4. Testing API..."
curl -s -H "Authorization: Bearer user_admin" \
  https://infinite-canvas-collab-server.buzzbus.workers.dev/admin/rooms | jq '.total'

echo ""
echo "✅ Check complete"
