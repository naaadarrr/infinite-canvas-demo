#!/usr/bin/env node

/**
 * 初始化本地 D1 数据库
 * 由于 wrangler 3.x 版本的限制，需要手动初始化本地数据库
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

console.log('🔧 初始化本地 D1 数据库...\n');

// 确保目录存在
const stateDir = path.join(__dirname, '../.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
if (!fs.existsSync(stateDir)) {
  fs.mkdirSync(stateDir, { recursive: true });
  console.log('✅ 创建状态目录:', stateDir);
}

// 查找数据库文件
const dbFiles = fs.readdirSync(stateDir).filter(f => f.endsWith('.sqlite'));
let dbPath;

if (dbFiles.length === 0) {
  // 创建新数据库
  dbPath = path.join(stateDir, 'db.sqlite');
  console.log('📦 创建新数据库:', dbPath);
} else {
  // 使用现有数据库
  dbPath = path.join(stateDir, dbFiles[0]);
  console.log('📦 使用现有数据库:', dbPath);
}

// 打开数据库
const db = new Database(dbPath);

// 读取 SQL 架构
const schemaPath = path.join(__dirname, '../d1/schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// 执行 SQL
try {
  console.log('\n🔨 应用数据库架构...\n');
  
  // 分割 SQL 语句
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  for (const statement of statements) {
    if (statement.trim()) {
      console.log('  执行:', statement.substring(0, 50) + '...');
      db.exec(statement);
    }
  }
  
  console.log('\n✅ 数据库初始化成功！\n');
  
  // 验证表是否创建
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log('📋 数据库表:');
  tables.forEach(t => console.log('  -', t.name));
  
} catch (error) {
  console.error('\n❌ 初始化失败:', error.message);
  process.exit(1);
} finally {
  db.close();
}

console.log('\n🎉 完成！现在可以运行 pnpm dev 启动服务器。\n');
