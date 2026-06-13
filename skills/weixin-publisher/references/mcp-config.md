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

## Claude Code .mcp.json

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
