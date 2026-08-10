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
const install = args.get('install') ?? 'global';
const version = args.get('version');
const isWindows = platform === 'win32' || platform.toLowerCase().startsWith('win');

function commandConfig({ avoidCmdShim = false } = {}) {
  if (install === 'global') {
    if (isWindows && avoidCmdShim) {
      return { command: 'wop-mcp.cmd' };
    }
    return isWindows ? { command: 'cmd', args: ['/c', 'wop-mcp'] } : { command: 'wop-mcp' };
  }

  const packageName = version ? `weixin-publisher@${version}` : 'weixin-publisher';
  const args = ['-y', '--package', packageName, 'wop-mcp'];
  if (isWindows && avoidCmdShim) {
    return { command: 'npx.cmd', args };
  }
  return isWindows ? { command: 'cmd', args: ['/c', 'npx', ...args] } : { command: 'npx', args };
}

function quoteToml(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function printClaude() {
  const config = {
    mcpServers: {
      'weixin-publisher': {
        ...commandConfig({ avoidCmdShim: true }),
      },
    },
  };
  console.log(JSON.stringify(config, null, 2));
}

function printCodex() {
  const command = commandConfig();
  console.log('[mcp_servers.weixin_publisher]');
  console.log(`command = "${quoteToml(command.command)}"`);
  if (command.args) {
    console.log(`args = [${command.args.map((arg) => `"${quoteToml(arg)}"`).join(', ')}]`);
  }
  console.log('startup_timeout_sec = 120');
}

if (host === 'codex') {
  printCodex();
} else if (host === 'claude') {
  printClaude();
} else {
  console.error('Usage: node generate-config.mjs --host=codex|claude --platform=win32|darwin|linux --install=global|npx [--version=x.y.z]');
  process.exit(1);
}
