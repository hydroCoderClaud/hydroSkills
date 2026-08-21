---
name: weixin-publisher
description: Use when the user wants to install, configure, or use the weixin-publisher npm package and MCP server to create WeChat Official Account drafts or publish articles from an agent. Covers secure local account setup, HydroDesktop, Claude Code, and Codex MCP setup, cover preparation, draft-first workflows, and safe publish behavior.
---

# Weixin Publisher

Use this skill to give a user WeChat Official Account publishing capability through the `weixin-publisher` npm package and MCP server.

Current content shapes:

- Ordinary article: user-facing article draft, WeChat `news` draft.
- Sticker / newspic: user-facing `sticker` flow, WeChat API `article_type: "newspic"`. These are the same content shape at different naming layers, not two separate stages.

Default stance: make a draft first. Do not submit final publish unless the user clearly asks to publish.

## Setup Workflow

When the user wants to install or configure WeChat publishing:

1. Detect the host OS and available tools:
   - Run `node --version` and `npm --version`.
   - Prefer a pinned global install: `npm install -g weixin-publisher@<version>`.
   - Verify both `wop --help` and `wop-mcp` from the same global installation.
2. Check local account state with `wop account:list`.
   - If no account exists, ask the user to open a separate local terminal and run `wop account:add <account-id>`.
   - The account command collects `AppID` normally and `AppSecret` through masked terminal input twice for confirmation. It shows one `*` per entered character; never ask for the secret in chat and never pass it in MCP arguments or environment variables.
   - If an account exists but its credential is missing, use `wop account:edit <account-id> --replace-secret` in the local terminal.
3. Ask which host to configure:
   - HydroDesktop
   - Claude Code
   - Codex
   - multiple hosts
4. Configure MCP with the global `wop-mcp` entry and no credential environment variables.
5. For HydroDesktop, prefer the hydroSkills marketplace path: install the `微信公众号发布助手` skill, then install the `微信公众号发布 MCP`; account credentials remain in the local OS secure store.
   - Marketplace MCP JSON may include `tools`; keep it because HydroDesktop uses it as an internal marketplace recognition field.
   - If the user manually adds MCP JSON, use only `command` (`wop-mcp.cmd` on Windows, `wop-mcp` on macOS/Linux). Do not add `args: []`, `tools`, or credential `env`.
   - After adding the MCP, tell the user to open HydroDesktop ability management, enter from the wrench icon, find the `weixin-publisher` MCP row, and click its tool authorization button.
6. For Claude Code, prefer `claude mcp add --scope user` from [MCP Config](references/mcp-config.md) instead of manually editing JSON.
7. For Codex, generate or write the MCP config using the templates in [MCP Config](references/mcp-config.md).
8. For Claude Code, ask the user to enable global tool permission for this MCP after restart; see [MCP Config](references/mcp-config.md).
9. Tell the user to restart the HydroDesktop, Claude Code, or Codex session after config changes.
10. After restart, call `list_accounts`, choose the requested `accountId`, then call `doctor` with that account ID.

If Node.js or npm is missing, stop and tell the user to install Node.js LTS first.

## Publishing Workflow

After MCP is available:

1. Call `list_accounts`, choose an account ID, then call `doctor` with that account ID.
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
8. If the user wants a sticker/newspic post, use [Sticker Workflow](#sticker-workflow) instead of ordinary article creation.
9. If a cover is needed, follow [Cover Generation](references/cover-generation.md).
   - Prefer the MCP process's current working directory for newly generated cover files. When `WOP_WORKSPACE_ROOT` is set, use that real local directory as the publisher workspace root.
   - Never pass an Agent-only virtual path to a local MCP. If the host cannot provide a real local directory, ask the host for an absolute local path or ask the user to choose the output directory.
   - If image-generation code is needed, prefer Node.js and create the program under `create_wx_image` in the current working directory.
10. Call `prepare_cover` for any local cover image.
11. Call `create_draft`.
12. Call `get_draft` to verify the saved title, digest, and body do not contain mojibake such as repeated `?`, `�`, `Ã`, or `ä¸`.
13. Return the `draftMediaId`, `displayMessage`, and `userHint`.
14. Only call `submit_publish` if the user explicitly asks for final publish.

## Sticker Workflow

Use this path when the user asks for 贴图, sticker, newspic, image-card posts, or a concise swipe-like image post.

1. Use `preview_sticker_images` when the user wants to inspect the local visual result first.
2. Use `render_sticker_images` when the user only wants local PNG output.
3. Use `create_sticker_draft_from_content` when the user gives structured text/cards and wants the tool to render PNGs, upload them, and create a WeChat draft.
4. Use `create_sticker_draft` when the user already has local image files or existing image `mediaId`s.
5. Use `update_sticker_draft` when the user wants to revise an existing sticker/newspic draft. Do not use ordinary `update_draft` for newspic drafts, and do not set `fallbackToArticle` during update.
6. Set `fallbackToArticle: true` only when creating a sticker draft and the user wants compatibility fallback if `newspic` is unavailable.
7. After draft creation or update, call `get_draft` to verify `articleType`, `imageInfo`, and `imageMediaIds` when available.
8. Keep draft-first behavior: do not call `submit_publish` unless the user explicitly asks to publish.

Sticker layout rules:

- Prefer airy image-card composition over dense article-like text.
- Keep each card to one clear idea, one short body paragraph, and 2 to 4 concise bullets.
- Leave visible breathing room between the body paragraph and the first green-dot bullet; do not let bullets look like a continuation of the paragraph.
- Use the same theme model as ordinary articles: set `themePreset` or one custom `themeColor`, and let sticker titles, body text, secondary text, badges, dividers, bullet dots, borders, and soft backgrounds follow that palette.
- Keep sticker body text visually aligned with ordinary article body text: theme-derived `bodyColor`, light font weight, readable line height, and no loud accent color for normal prose.
- Keep the newspic draft body aligned with the same theme too: prefer `contentMarkdown` or structured `summary`/`digest` so the tool renders WeChat-compatible themed HTML instead of saving a bare plain-text body.
- Keep the body-to-bullet gap generous, then keep bullet rows compact enough that the list reads as one visual group.
- When hand-authoring HTML/SVG/image layouts, use flow layout or measured block heights instead of fixed overlapping coordinates.
- When hand-authoring HTML/SVG/image layouts, apply the chosen `themePreset`, `themeColor`, or explicit color overrides to the generated image, not only to draft metadata.
- Always inspect `preview_sticker_images` before creating a draft when content is newly generated or visually dense.

Terminology:

- Say `sticker` to the user.
- Use `newspic` only when explaining the WeChat API-layer draft type.
- Do not describe `sticker` and `newspic` as two separate content forms.

Never call `delete_draft` unless the user explicitly asks to delete a specific draft.

## Tool Use Rules

Read MCP results in this order:

1. `displayMessage`
2. `userHint`
3. `message`
4. Structured IDs such as `draftMediaId`, `publishId`, and `status`

Use these MCP tools as the normal path:

- `doctor`
- `list_accounts`
- `preview_article`
- `prepare_cover`
- `upload_cover`
- `create_draft`
- `create_sticker_draft`
- `render_sticker_images`
- `preview_sticker_images`
- `create_sticker_draft_from_content`
- `update_sticker_draft`
- `get_draft`
- `list_drafts`
- `submit_publish` only after explicit user confirmation
- `get_publish_status`

## Config Safety

Treat `AppSecret` as a secret. Do not print it back to the user except as a masked value.

The MCP server does not accept `WECHAT_APP_ID` or `WECHAT_APP_SECRET` environment variables in the normal setup. Account metadata is stored in the user config directory and secrets are stored by the OS keyring (Windows Credential Manager, macOS Keychain, or the platform keyring). Account CRUD is a local CLI workflow, never an MCP workflow.

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
