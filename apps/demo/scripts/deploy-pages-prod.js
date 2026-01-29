const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function parseDotenv(contents) {
  const parsed = {};
  const lines = contents.replace(/\r\n?/g, '\n').split('\n');
  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) continue;
    const match = line.match(/^\s*(?:export\s+)?([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2] ?? '';
    value = value.trim();
    const quote = value[0];
    if (quote === '"' || quote === "'" || quote === '`') {
      if (value.endsWith(quote)) {
        value = value.slice(1, -1);
      } else {
        value = value.slice(1);
      }
      if (quote === '"') {
        value = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
      }
    }
    parsed[key] = value;
  }
  return parsed;
}

function loadEnvFile(filename) {
  const filePath = path.join(process.cwd(), filename);
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile() && !stat.isFIFO()) return;
    const contents = fs.readFileSync(filePath, 'utf8');
    const parsed = parseDotenv(contents);
    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`Failed to load env from ${filename}`, err);
      process.exit(1);
    }
  }
}

function run(command) {
  const result = spawnSync(command, {
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

process.env.NODE_ENV = 'production';
loadEnvFile('.env.production');
loadEnvFile('.env');
process.env.__NEXT_PROCESSED_ENV = 'true';

run('pnpm run build:pages');
run('cp wrangler.toml .vercel/output/static/');
run('cd .vercel/output/static && npx wrangler pages deploy . --project-name infinite-canvas-demo');
