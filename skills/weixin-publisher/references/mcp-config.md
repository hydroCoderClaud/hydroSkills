# MCP Config Reference

Package name: `weixin-publisher`

Preferred MCP server key: `weixin-publisher`

Required environment variables:

- `WECHAT_APP_ID`
- `WECHAT_APP_SECRET`

Recommended environment variables:

- `WECHAT_PUBLISH_MODE=draft`
- `WECHAT_REQUEST_TIMEOUT_MS=15000`

## Install Mode Choice

Default recommendation: `npx`.

Use `npx` when:

- The user wants the simplest setup.
- The user does not want global npm installs.
- The host can access the internet when starting MCP.

Use global install when:

- The user wants faster startup.
- The user wants less network dependence.
- The user understands PATH/global npm bin issues.

Global install command:

```bash
npm install -g weixin-publisher
```

## Claude Code

Prefer configuring Claude Code with the CLI instead of hand-editing JSON. Ask the user for `WECHAT_APP_ID` and `WECHAT_APP_SECRET` first, then run one of these commands.

Use `--scope user` for normal user-level setup. Claude Code stores this in the appropriate user-level Claude config, commonly the user's home `.claude.json`; do not create a random project `.mcp.json` unless the user explicitly wants project-local setup.

Windows, npx:

```powershell
claude mcp add --scope user weixin-publisher `
  -e WECHAT_APP_ID=your_app_id `
  -e WECHAT_APP_SECRET=your_app_secret `
  -e WECHAT_PUBLISH_MODE=draft `
  -e WECHAT_REQUEST_TIMEOUT_MS=15000 `
  -- cmd /c npx -y --package weixin-publisher wop-mcp
```

Windows, global install:

```powershell
claude mcp add --scope user weixin-publisher `
  -e WECHAT_APP_ID=your_app_id `
  -e WECHAT_APP_SECRET=your_app_secret `
  -e WECHAT_PUBLISH_MODE=draft `
  -e WECHAT_REQUEST_TIMEOUT_MS=15000 `
  -- cmd /c wop-mcp
```

macOS/Linux, npx:

```bash
claude mcp add --scope user weixin-publisher \
  -e WECHAT_APP_ID=your_app_id \
  -e WECHAT_APP_SECRET=your_app_secret \
  -e WECHAT_PUBLISH_MODE=draft \
  -e WECHAT_REQUEST_TIMEOUT_MS=15000 \
  -- npx -y --package weixin-publisher wop-mcp
```

macOS/Linux, global install:

```bash
claude mcp add --scope user weixin-publisher \
  -e WECHAT_APP_ID=your_app_id \
  -e WECHAT_APP_SECRET=your_app_secret \
  -e WECHAT_PUBLISH_MODE=draft \
  -e WECHAT_REQUEST_TIMEOUT_MS=15000 \
  -- wop-mcp
```

After adding, run:

```bash
claude mcp list
```

### Claude Code Tool Permissions

Adding the MCP server only registers it. Claude Code may still ask the user to approve MCP tools, especially when tools are shown with `*` or when a session first tries to call them.

Preferred setup:

1. Restart Claude Code after `claude mcp add --scope user`.
2. Ask Claude Code to call `doctor`.
3. When Claude Code asks for tool permission, approve only the needed `weixin-publisher` tools.

For a normal draft-first workflow, it is reasonable to allow these tools:

- `doctor`
- `render_article`
- `prepare_cover`
- `upload_cover`
- `upload_inline_image`
- `create_draft`
- `get_draft`
- `list_drafts`
- `get_publish_status`
- `list_published`

Keep these tools as explicit per-use approvals unless the user intentionally wants automation with publish/delete power:

- `submit_publish`
- `delete_draft`
- `update_draft`

If the user wants to start Claude Code with pre-approved tools for a session, use Claude Code's `--allowedTools` / `--allowed-tools` option and the exact MCP tool names shown by Claude Code. They commonly follow the pattern `mcp__weixin-publisher__tool_name`, but the UI/CLI output should be treated as the source of truth.

Only use JSON snippets below for manual review, migration, or when `claude mcp add` is unavailable.

## Claude Code Manual JSON Reference

Windows, npx:

```json
{
  "mcpServers": {
    "weixin-publisher": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "--package", "weixin-publisher", "wop-mcp"],
      "env": {
        "WECHAT_APP_ID": "your_app_id",
        "WECHAT_APP_SECRET": "your_app_secret",
        "WECHAT_PUBLISH_MODE": "draft",
        "WECHAT_REQUEST_TIMEOUT_MS": "15000"
      }
    }
  }
}
```

Windows, global install:

```json
{
  "mcpServers": {
    "weixin-publisher": {
      "command": "cmd",
      "args": ["/c", "wop-mcp"],
      "env": {
        "WECHAT_APP_ID": "your_app_id",
        "WECHAT_APP_SECRET": "your_app_secret",
        "WECHAT_PUBLISH_MODE": "draft",
        "WECHAT_REQUEST_TIMEOUT_MS": "15000"
      }
    }
  }
}
```

macOS/Linux, npx:

```json
{
  "mcpServers": {
    "weixin-publisher": {
      "command": "npx",
      "args": ["-y", "--package", "weixin-publisher", "wop-mcp"],
      "env": {
        "WECHAT_APP_ID": "your_app_id",
        "WECHAT_APP_SECRET": "your_app_secret",
        "WECHAT_PUBLISH_MODE": "draft",
        "WECHAT_REQUEST_TIMEOUT_MS": "15000"
      }
    }
  }
}
```

macOS/Linux, global install:

```json
{
  "mcpServers": {
    "weixin-publisher": {
      "command": "wop-mcp",
      "env": {
        "WECHAT_APP_ID": "your_app_id",
        "WECHAT_APP_SECRET": "your_app_secret",
        "WECHAT_PUBLISH_MODE": "draft",
        "WECHAT_REQUEST_TIMEOUT_MS": "15000"
      }
    }
  }
}
```

## Codex config.toml

Windows, npx:

```toml
[mcp_servers.weixin_publisher]
command = "cmd"
args = ["/c", "npx", "-y", "--package", "weixin-publisher", "wop-mcp"]
startup_timeout_sec = 120

[mcp_servers.weixin_publisher.env]
WECHAT_APP_ID = "your_app_id"
WECHAT_APP_SECRET = "your_app_secret"
WECHAT_PUBLISH_MODE = "draft"
WECHAT_REQUEST_TIMEOUT_MS = "15000"
```

Windows, global install:

```toml
[mcp_servers.weixin_publisher]
command = "cmd"
args = ["/c", "wop-mcp"]
startup_timeout_sec = 120

[mcp_servers.weixin_publisher.env]
WECHAT_APP_ID = "your_app_id"
WECHAT_APP_SECRET = "your_app_secret"
WECHAT_PUBLISH_MODE = "draft"
WECHAT_REQUEST_TIMEOUT_MS = "15000"
```

macOS/Linux, npx:

```toml
[mcp_servers.weixin_publisher]
command = "npx"
args = ["-y", "--package", "weixin-publisher", "wop-mcp"]
startup_timeout_sec = 120

[mcp_servers.weixin_publisher.env]
WECHAT_APP_ID = "your_app_id"
WECHAT_APP_SECRET = "your_app_secret"
WECHAT_PUBLISH_MODE = "draft"
WECHAT_REQUEST_TIMEOUT_MS = "15000"
```

macOS/Linux, global install:

```toml
[mcp_servers.weixin_publisher]
command = "wop-mcp"
startup_timeout_sec = 120

[mcp_servers.weixin_publisher.env]
WECHAT_APP_ID = "your_app_id"
WECHAT_APP_SECRET = "your_app_secret"
WECHAT_PUBLISH_MODE = "draft"
WECHAT_REQUEST_TIMEOUT_MS = "15000"
```

After writing Codex or Claude Code config, tell the user to restart the current session so the MCP server is loaded.
