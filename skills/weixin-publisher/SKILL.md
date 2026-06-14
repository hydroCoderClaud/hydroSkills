---
name: weixin-publisher
description: Use when the user wants to install, configure, or use the weixin-publisher npm package and MCP server to create WeChat Official Account drafts or publish articles from an agent. Covers HydroDesktop, Claude Code, and Codex setup, credential injection, cover preparation, draft-first workflows, and safe publish behavior.
---

# Weixin Publisher

Use this skill to give a user WeChat Official Account publishing capability through the `weixin-publisher` npm package and MCP server.

Default stance: make a draft first. Do not submit final publish unless the user clearly asks to publish.

## Setup Workflow

When the user wants to install or configure WeChat publishing:

1. Detect the host OS and available tools:
   - Run `node --version` and `npm --version`.
   - Run `npx -y --package weixin-publisher wop --help` to verify the npm package can be fetched.
   - If the user prefers global install, run `npm install -g weixin-publisher`, then verify `wop --help` and `wop-mcp`.
2. Ask for only the missing required credentials:
   - `WECHAT_APP_ID`
   - `WECHAT_APP_SECRET`
3. Ask which host to configure:
   - HydroDesktop
   - Claude Code
   - Codex
   - multiple hosts
4. Prefer `npx` unless the user explicitly wants global install.
5. For HydroDesktop, prefer the hydroSkills marketplace path: install the `微信公众号发布助手` skill, then install the `微信公众号发布 MCP`, and replace the placeholder `WECHAT_APP_ID` / `WECHAT_APP_SECRET`.
6. For Claude Code, prefer `claude mcp add --scope user` from [MCP Config](references/mcp-config.md) instead of manually editing JSON.
7. For Codex, generate or write the MCP config using the templates in [MCP Config](references/mcp-config.md).
8. For Claude Code, ask the user to enable global tool permission for this MCP after restart; see [MCP Config](references/mcp-config.md).
9. Tell the user to restart the HydroDesktop, Claude Code, or Codex session after config changes.
10. After restart, call the MCP `doctor` tool first.

If Node.js or npm is missing, stop and tell the user to install Node.js LTS first.

## Publishing Workflow

After MCP is available:

1. Call `doctor`.
2. Ask the user what article to make:
   - topic/title
   - target audience
   - rough outline or source material
   - preferred theme preset or one primary `themeColor`, or use default `wechat-green`
   - whether to stop at draft or publish
3. Create or gather article content.
4. Default to `contentMarkdown` for ordinary articles.
5. Use the default render preset unless the user wants raw HTML:
   - `stylePreset: "default"` for the normal path
   - `fontSize: 14` for body text
   - `titleFontSize: 16` for non-numeric headings
   - `numberFontSize: 16` for numeric marker headings such as `# 1` or `# 1.5`
   - `stylePreset: "classic"` for a plainer fallback layout when the user wants a more conservative article style
   - `themePreset: "wechat-green"` unless the user chooses `rose-magenta`, `soft-purple`, or `ocean-blue`
   - use `themeColor` only when the user gives one custom primary color; the renderer derives a coordinated palette from it
   - treat a theme as a coordinated palette for headings, numeric markers, heading lines, dividers, links, inline code, quote/callout blocks, and code blocks
   - only set individual color fields when the user explicitly wants advanced fine tuning
   - do not ask about font sizes by default; use the defaults unless the user asks for larger or smaller text
   - comments are enabled by default; set `needOpenComment: false` only when the user explicitly asks to disable comments
   - keep `onlyFansCanComment: false` unless the user explicitly asks to allow follower-only comments
   - do not promise automatic featured comment selection; current public draft/publish fields only cover opening comments and follower-only comments
6. Shape generated Markdown so the built-in article design is actually used:
   - use numeric marker headings such as `# 1`, `# 1.1`, or `# 1.5` before major sections
   - follow each numeric marker with a normal section heading such as `## Section title`
   - use Markdown blockquotes (`> key sentence`) for pull quotes, key ideas, and summary lines
   - use inline code only for real parameter names, commands, field names, and config values such as `themePreset`, `fontSize`, `rose-magenta`, or `wop-mcp`
   - do not wrap ordinary Chinese sentences, prompt examples, or prose fragments in backticks; use normal lists, bold text, or blockquotes instead
   - do not hand-write HTML for ordinary paragraphs, headings, lists, or quotes
7. If the user wants to inspect layout before creating a draft, call `preview_article`.
   - Explain that this is a local HTML pseudo-preview, not a WeChat backend preview.
   - Return the local `filePath` or `fileUrl` so the user can open it.
8. If a cover is needed, follow [Cover Generation](references/cover-generation.md).
9. Call `prepare_cover` for any local cover image.
10. Call `create_draft`.
11. Call `get_draft` to verify the saved title, digest, and body do not contain mojibake such as repeated `?`, `�`, `Ã`, or `ä¸`.
12. Return the `draftMediaId`, `displayMessage`, and `userHint`.
13. Only call `submit_publish` if the user explicitly asks for final publish.

Never call `delete_draft` unless the user explicitly asks to delete a specific draft.

## Tool Use Rules

Read MCP results in this order:

1. `displayMessage`
2. `userHint`
3. `message`
4. Structured IDs such as `draftMediaId`, `publishId`, and `status`

Use these MCP tools as the normal path:

- `doctor`
- `preview_article`
- `prepare_cover`
- `upload_cover`
- `create_draft`
- `get_draft`
- `list_drafts`
- `submit_publish` only after explicit user confirmation
- `get_publish_status`

## Config Safety

Treat `WECHAT_APP_SECRET` as a secret. Do not print it back to the user except as a masked value.

When editing config files, prefer:

- `claude mcp add --scope user` for Claude Code user-level setup.
- `~/.codex/config.toml` for Codex global setup.
- Printing config snippets first if the user has not granted permission to write files.

Only edit Claude Code JSON directly when the CLI is unavailable or the user explicitly asks for manual config. In that case, user-level Claude Code MCP config belongs in the appropriate section of the user home `.claude.json`, not in an arbitrary project file.

Do not silently overwrite existing MCP config. Merge with existing config when possible.

## Claude Code Tool Permissions

After Claude Code loads the MCP server, ask the user to enable global tool permission for the `weixin-publisher` MCP in the user-level `~/.claude/settings.json`.

Add `mcp__weixin-publisher__*` to `permissions.allow`. Do not put this global permission in `settings.local.json`.

## References

- For platform-specific config templates, read [MCP Config](references/mcp-config.md).
- For article and publishing behavior, read [Workflow](references/workflow.md).
- For cover creation, read [Cover Generation](references/cover-generation.md).
