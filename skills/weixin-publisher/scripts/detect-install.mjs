#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import os from 'node:os';

function run(command, args, options = {}) {
  const useShell = process.platform === 'win32';
  const spawnCommand = useShell
    ? [command, ...args].map(quoteShellArg).join(' ')
    : command;
  const spawnArgs = useShell ? [] : args;

  const result = spawnSync(spawnCommand, spawnArgs, {
    encoding: 'utf8',
    shell: useShell,
    cwd: options.cwd,
  });

  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout?.trim() ?? '',
    stderr: result.stderr?.trim() ?? '',
  };
}

function quoteShellArg(value) {
  if (/^[a-zA-Z0-9_./:=@-]+$/.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '\\"')}"`;
}

const checks = {
  platform: process.platform,
  osRelease: os.release(),
  node: run('node', ['--version']),
  npm: run('npm', ['--version']),
  wop: run('wop', ['--help']),
  wopMcp: run('wop-mcp', ['--help']),
  npxPackage: run('npm', ['exec', '-y', '--package', 'weixin-publisher', '--', 'wop', '--help'], {
    cwd: os.homedir(),
  }),
};

const summary = {
  platform: checks.platform,
  osRelease: checks.osRelease,
  hasNode: checks.node.ok,
  nodeVersion: checks.node.stdout,
  hasNpm: checks.npm.ok,
  npmVersion: checks.npm.stdout,
  hasGlobalWop: checks.wop.ok,
  hasGlobalWopMcp: checks.wopMcp.ok,
  canUseNpxPackage: checks.npxPackage.ok,
};

console.log(JSON.stringify({ summary, checks }, null, 2));
