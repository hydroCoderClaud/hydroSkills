#!/usr/bin/env node

const args = new Map();
for (const raw of process.argv.slice(2)) {
  const match = raw.match(/^--([^=]+)=(.*)$/);
  if (match) {
    args.set(match[1], match[2]);
  }
}

const host = args.get('host') ?? 'claude';
const platform = args.get('platform') ?? process.platform;
const install = args.get('install') ?? 'npx';
const appId = args.get('app-id') ?? 'your_app_id';
const appSecret = args.get('app-secret') ?? 'your_app_secret';

const isWindows = platform === 'win32' || platform.toLowerCase().startsWith('win');

function commandConfigJson() {
  if (install === 'global') {
    return isWindows
      ? { command: 'cmd', args: ['/c', 'wop-mcp'] }
      : { command: 'wop-mcp' };
  }

  return isWindows
    ? { command: 'cmd', args: ['/c', 'npx', '-y', '--package', 'weixin-publisher', 'wop-mcp'] }
    : { command: 'npx', args: ['-y', '--package', 'weixin-publisher', 'wop-mcp'] };
}

function envJson() {
  return {
    WECHAT_APP_ID: appId,
    WECHAT_APP_SECRET: appSecret,
    WECHAT_PUBLISH_MODE: 'draft',
    WECHAT_REQUEST_TIMEOUT_MS: '15000',
  };
}

function printClaude() {
  const config = {
    mcpServers: {
      'weixin-publisher': {
        ...commandConfigJson(),
        env: envJson(),
      },
    },
  };

  console.log(JSON.stringify(config, null, 2));
}

function quoteToml(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function printCodex() {
  const commandConfig = commandConfigJson();
  const env = envJson();

  console.log('[mcp_servers.weixin_publisher]');
  console.log(`command = "${quoteToml(commandConfig.command)}"`);
  if (commandConfig.args) {
    console.log(`args = [${commandConfig.args.map((arg) => `"${quoteToml(arg)}"`).join(', ')}]`);
  }
  console.log('startup_timeout_sec = 120');
  console.log('');
  console.log('[mcp_servers.weixin_publisher.env]');
  for (const [key, value] of Object.entries(env)) {
    console.log(`${key} = "${quoteToml(value)}"`);
  }
}

if (host === 'codex') {
  printCodex();
} else if (host === 'claude') {
  printClaude();
} else {
  console.error('Usage: node generate-config.mjs --host=codex|claude --platform=win32|darwin|linux --install=npx|global --app-id=... --app-secret=...');
  process.exit(1);
}
