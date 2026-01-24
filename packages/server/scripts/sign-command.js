#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const readline = require('readline');

const DEFAULT_SOURCE = 'external.crm';
const DEFAULT_EXTERNAL_ID = '5baeea6c9ea742f7a35a137aab9199999';
const DEFAULT_ADD_URL = '/analyzed_video_task_object_replace_llm_df317ff873344f0aaac13659b6514ae2_inline_image_0.jpeg';
const DEFAULT_UPDATE_URL = '/board_eb7e9efeb118432e8bbc49366c9fbc66_upload_71-i0T9WWBL._AC_SX466_.jpg';
const DEFAULT_RAW_DATA = {
  taskId: '5baeea6c9ea742f7a35a137aab9199999',
  status: 'success',
  mediaType: 'image',
  result: {
    originImage: {
      url: DEFAULT_ADD_URL,
    },
  },
};

function usage() {
  console.log(`Usage:
  node sign-command.js --url <url> --key <keyId> --secret <secret> [--menu]
                      [--body <json>] [--body-file <path>] [--method POST]
                      [--timestamp <unix_seconds_or_ms>] [--nonce <nonce>] [--print-curl] [--exec]

Examples:
  node sign-command.js --url http://127.0.0.1:8787/canvas/room1/commands \\
    --key key_dev_1 --secret secret_dev_1 \\
    --body '{"id":"cmd_1","source":"external.crm","type":"upsert_nodes","payload":{"nodes":[]}}' \\
    --print-curl

  node sign-command.js --url http://127.0.0.1:8787/canvas/room1/commands \\
    --key key_dev_1 --secret secret_dev_1 --body-file ./command.json --print-curl

  node sign-command.js --url http://127.0.0.1:8787/canvas/room1/commands \\
    --key key_dev_1 --secret secret_dev_1 --menu --print-curl --exec
`);
}

function parseArgs(argv) {
  const args = { method: 'POST', printCurl: false, menu: false, exec: false };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === '--print-curl') {
      args.printCurl = true;
      continue;
    }
    if (key === '--exec') {
      args.exec = true;
      continue;
    }
    if (key === '--menu') {
      args.menu = true;
      continue;
    }
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${key}`);
    }
    switch (key) {
      case '--url':
        args.url = value;
        break;
      case '--key':
        args.key = value;
        break;
      case '--secret':
        args.secret = value;
        break;
      case '--body':
        args.body = value;
        break;
      case '--body-file':
        args.bodyFile = value;
        break;
      case '--method':
        args.method = value.toUpperCase();
        break;
      case '--timestamp':
        args.timestamp = value;
        break;
      case '--nonce':
        args.nonce = value;
        break;
      default:
        throw new Error(`Unknown argument: ${key}`);
    }
    i += 1;
  }
  return args;
}

function shellSingleQuote(value) {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

async function executeRequest(args, bodyText, timestamp, nonce, signature) {
  if (typeof fetch !== 'function') {
    throw new Error('fetch is not available in this Node version');
  }

  const response = await fetch(args.url, {
    method: args.method,
    headers: {
      Authorization: `Bearer ${args.key}`,
      'Content-Type': 'application/json',
      'X-Timestamp': timestamp,
      'X-Nonce': nonce,
      'X-Signature': signature,
    },
    body: bodyText,
  });

  const responseText = await response.text();
  console.log(`HTTP ${response.status} ${response.statusText}`);
  for (const [key, value] of response.headers.entries()) {
    console.log(`${key}: ${value}`);
  }
  console.log('');
  console.log(responseText);
}

function generateCommandId() {
  return `cmd_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function createCommandEnvelope(type, node) {
  return {
    id: generateCommandId(),
    source: DEFAULT_SOURCE,
    type,
    payload: {
      nodes: [node],
    },
  };
}

function createExternalNode(url, updatedAt, includeRaw) {
  const data = { url };
  if (includeRaw) {
    data.raw = {
      ...DEFAULT_RAW_DATA,
      result: {
        originImage: {
          url,
        },
      },
    };
  }

  return {
    externalId: DEFAULT_EXTERNAL_ID,
    type: 'image',
    data,
    updatedAt,
  };
}

async function promptMenu() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (question, fallback) =>
    new Promise((resolve) => {
      const prompt = fallback ? `${question} (${fallback}): ` : `${question}: `;
      rl.question(prompt, (answer) => {
        const value = answer.trim();
        resolve(value || fallback || '');
      });
    });

  console.log('请选择操作:');
  console.log('1) 添加记录 (append_nodes)');
  console.log('2) 修改记录 (upsert_nodes)');
  console.log('3) 移除记录 (delete_nodes)');

  const choice = await ask('输入序号', '1');
  const now = Date.now();
  const updatedAt = Number(await ask('updatedAt (毫秒/秒)', String(now))) || now;

  let command;
  if (choice === '1') {
    const url = await ask('图片 URL', DEFAULT_ADD_URL);
    command = createCommandEnvelope('append_nodes', createExternalNode(url, updatedAt, true));
  } else if (choice === '2') {
    const url = await ask('图片 URL', DEFAULT_UPDATE_URL);
    command = createCommandEnvelope('upsert_nodes', createExternalNode(url, updatedAt, true));
  } else if (choice === '3') {
    const node = createExternalNode(DEFAULT_UPDATE_URL, updatedAt, false);
    node.data = {};
    command = createCommandEnvelope('delete_nodes', node);
  } else {
    rl.close();
    throw new Error('Unknown menu choice');
  }

  const source = await ask('source', DEFAULT_SOURCE);
  const externalId = await ask('externalId', DEFAULT_EXTERNAL_ID);
  command.source = source;
  command.payload.nodes[0].externalId = externalId;

  rl.close();
  return JSON.stringify(command);
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    usage();
    process.exit(1);
  }

  if (!args.url || !args.key || !args.secret) {
    usage();
    process.exit(1);
  }

  if (!args.body && !args.bodyFile && !args.menu) {
    console.error('Missing --body, --body-file, or --menu');
    usage();
    process.exit(1);
  }

  const bodyText = args.menu
    ? await promptMenu()
    : args.bodyFile
      ? fs.readFileSync(args.bodyFile, 'utf8')
      : args.body;
  const timestamp = args.timestamp || Math.floor(Date.now() / 1000).toString();
  const nonce = args.nonce || (crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'));
  const url = new URL(args.url);

  const canonical = [
    'v1',
    args.method,
    url.pathname,
    timestamp,
    nonce,
    bodyText,
  ].join('\n');

  const signature = crypto.createHmac('sha256', args.secret).update(canonical).digest('hex');

  const output = {
    url: args.url,
    method: args.method,
    timestamp,
    nonce,
    signature,
  };

  console.log(JSON.stringify(output, null, 2));

  if (args.printCurl) {
    console.log('');
    console.log(
      [
        `curl -X ${args.method} "${args.url}" \\\n  -H "Authorization: Bearer ${args.key}" \\\n  -H "Content-Type: application/json" \\\n  -H "X-Timestamp: ${timestamp}" \\\n  -H "X-Nonce: ${nonce}" \\\n  -H "X-Signature: ${signature}" \\\n  --data-raw ${shellSingleQuote(bodyText)}`,
      ].join('\n')
    );
  }

  if (args.exec) {
    console.log('');
    await executeRequest(args, bodyText, timestamp, nonce, signature);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
