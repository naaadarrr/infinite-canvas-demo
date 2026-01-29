#!/bin/bash
# 从多个来源发现线上房间 ID

echo "🔍 Discovering rooms from multiple sources..."
echo ""

# 1. 从本地数据库获取
echo "1️⃣ Rooms in LOCAL database:"
wrangler d1 execute canvas_db --command "SELECT id, title, latest_seq, updated_at FROM canvases ORDER BY updated_at DESC" 2>/dev/null || echo "  ❌ Failed to query local DB"
echo ""

# 2. 从远程数据库获取
echo "2️⃣ Rooms in REMOTE database:"
wrangler d1 execute canvas_db --remote --command "SELECT id, title, latest_seq, updated_at FROM canvases ORDER BY updated_at DESC" 2>/dev/null || echo "  ❌ Failed to query remote DB"
echo ""

# 3. 从 R2 扫描
echo "3️⃣ Scanning R2 for room IDs..."
echo "  (This will call the scan-and-fix API)"
result=$(curl -s -X POST \
  -H "Authorization: Bearer user_admin" \
  https://infinite-canvas-collab-server.buzzbus.workers.dev/admin/rooms/scan-and-fix)

echo "$result" | jq '.'
echo ""

# 4. 从 API 获取当前列表
echo "4️⃣ Current room list from API:"
curl -s -H "Authorization: Bearer user_admin" \
  https://infinite-canvas-collab-server.buzzbus.workers.dev/admin/rooms | jq '.rooms[] | {id, latest_seq, updated_at}'
echo ""

# 5. 总结
echo "📊 Summary:"
local_count=$(wrangler d1 execute canvas_db --command "SELECT COUNT(*) as count FROM canvases" --json 2>/dev/null | jq -r '.[0].results[0].count' 2>/dev/null || echo "0")
remote_count=$(wrangler d1 execute canvas_db --remote --command "SELECT COUNT(*) as count FROM canvases" --json 2>/dev/null | jq -r '.[0].results[0].count' 2>/dev/null || echo "0")

echo "  Local DB:  $local_count rooms"
echo "  Remote DB: $remote_count rooms"
echo ""

# 6. 建议
if [ "$remote_count" -lt "$local_count" ]; then
  echo "💡 Suggestion: Remote DB has fewer rooms than local."
  echo "   You may want to migrate local rooms to remote."
  echo ""
  echo "   Run this to migrate:"
  echo "   ./scripts/migrate-local-to-remote.sh"
fi

echo "✅ Discovery complete"
