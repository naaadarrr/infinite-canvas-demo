-- 画布列表表
CREATE TABLE IF NOT EXISTS canvases (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  latest_snapshot_key TEXT,
  latest_seq INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- 画布成员表（可选，用于权限管理）
CREATE TABLE IF NOT EXISTS canvas_members (
  canvas_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor', -- owner, editor, viewer
  created_at INTEGER DEFAULT (unixepoch()),
  PRIMARY KEY (canvas_id, user_id),
  FOREIGN KEY (canvas_id) REFERENCES canvases(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_canvases_updated_at ON canvases(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_canvas_members_canvas ON canvas_members(canvas_id);
CREATE INDEX IF NOT EXISTS idx_canvas_members_user ON canvas_members(user_id);
