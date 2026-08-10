# MCP Config Reference

Package: `weixin-publisher`

The normal setup has no credential environment variables. Install one pinned global package version, configure accounts from a separate local terminal, and let the MCP host launch the matching `wop-mcp` entry.

## 1. Install and configure accounts

```bash
npm install -g weixin-publisher@<version>
wop --help
wop-mcp
```

Run account management in a real local terminal, never in an MCP conversation:

```bash
wop account:add brand-a --label "Brand A"
wop account:list
wop account:doctor brand-a
wop account:edit brand-a --replace-secret
wop account:set-default brand-a
wop account:remove brand-a --yes
```

`account:add` and `account:edit --replace-secret` display one `*` per `AppSecret` character and ask for it twice to confirm the value. Account metadata is stored in the user config directory; the secret is stored in the OS keyring. The secret is never a command argument, MCP environment variable, tool parameter, or tool result.

## 2. Claude Code

Use the CLI rather than hand-editing JSON. The command contains only the MCP executable:

Windows:

```powershell
claude mcp add --scope user weixin-publisher -- wop-mcp.cmd
```

macOS/Linux:

```bash
claude mcp add --scope user weixin-publisher -- wop-mcp
```

After adding, restart Claude Code, verify with `claude mcp list`, call `list_accounts`, choose an `accountId`, and call `doctor` with that ID.

Avoid `cmd /c` in `claude mcp add` on Windows. Use `wop-mcp.cmd` directly.

### Claude Code tool permissions

Add `mcp__weixin-publisher__*` to the user-level `~/.claude/settings.json` `permissions.allow` list. Do not put this global permission in `settings.local.json`.

## 3. Codex config.toml

Windows:

```toml
[mcp_servers.weixin_publisher]
command = "cmd"
args = ["/c", "wop-mcp"]
startup_timeout_sec = 120
```

macOS/Linux:

```toml
[mcp_servers.weixin_publisher]
command = "wop-mcp"
startup_timeout_sec = 120
```

There is intentionally no `[mcp_servers.weixin_publisher.env]` section for account credentials. After saving, restart Codex, call `list_accounts`, select an account, and call `doctor` with its `accountId`.

## 4. Account selection workflow

Use this sequence for any remote operation:

```text
list_accounts
  -> choose accountId
  -> doctor(accountId)
  -> create_draft(accountId, ...)
  -> get_draft(accountId, ...)
```

Pass the same `accountId` to draft, material, publish, and status tools. Local-only rendering and cover preparation do not need an account ID.

## 5. Migration

Older MCP entries that contain `WECHAT_APP_ID` or `WECHAT_APP_SECRET` should be removed after the account is registered with `wop account:add`. Do not copy `AppSecret` into the new MCP config. Keep the MCP server on a fixed package version and upgrade intentionally.
