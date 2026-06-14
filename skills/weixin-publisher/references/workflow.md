# Workflow Reference

## Default Behavior

Default to draft creation. This is the safest normal path:

1. `doctor`
2. `prepare_cover` if using a local cover image
3. `create_draft`
4. `get_draft` if the user wants to inspect the saved draft

Only call `submit_publish` when the user explicitly says to publish, formally publish, submit, or send the article live.

## Asking for Content

If the user says they want to make an article but does not provide enough detail, ask concise questions:

- What is the topic or working title?
- Who is the audience?
- Do you want to use the default `wechat-green` theme, choose `rose-magenta`, `soft-purple`, or `ocean-blue`, or provide one custom `themeColor`?
- Do you want a draft only or final publish?
- Do you have source text, notes, or links?
- Do you need a cover image?

Prefer one or two questions at a time.

## Article Input Shape

Use `contentMarkdown` for ordinary articles.

Use `contentHtml` only when the user needs exact HTML control or a later engineering workflow provides WeChat-compatible HTML.

Markdown rendering defaults to `stylePreset: "default"` with 14px body text and 16px headings/numeric marker headings. This uses a polished long-form WeChat article style with thin body text, WeChat-green anchors, fine rules, and mobile-friendly spacing.

Use `stylePreset: "classic"` when the user wants a plainer fallback style with more conservative headings and tighter spacing.

Theme accents can be selected with `themePreset`:

- `wechat-green`: a complete green palette for headings, numbers, links, inline code, quote blocks, dividers, and code blocks.
- `rose-magenta`: a complete rose palette for headings, numbers, links, inline code, quote blocks, dividers, and code blocks.
- `soft-purple`: a complete soft-purple palette for headings, numbers, links, inline code, quote blocks, dividers, and code blocks.
- `ocean-blue`: a complete ocean-blue palette for headings, numbers, links, inline code, quote blocks, dividers, and code blocks.

If the user gives a custom primary color, set `themeColor` instead of manually filling every color. The renderer derives a coordinated palette from that one color.

The color priority is:

1. Individual color fields.
2. `themeColor` derived palette.
3. `themePreset`.
4. Default `wechat-green`.

Each theme coordinates these fields:

- `titleColor` controls non-numeric headings.
- `numberColor` controls numeric marker headings such as `# 1.5`.
- `headingBorderColor` controls heading decorative borders.
- `dividerColor` controls horizontal dividers.
- `quoteBorderColor` controls the quote/callout left border.
- `quoteBackgroundColor` controls the quote/callout background.
- `linkColor` controls link text.
- `linkBorderColor` controls link underlines.
- `inlineCodeColor` controls inline code or special marker text.
- `inlineCodeBackgroundColor` controls inline code or special marker background.
- `codeBlockBorderColor` controls code block borders.
- `codeBlockBackgroundColor` controls code block background.
- `codeBlockColor` controls code block text.
- Ordinary body text and quote text stay low-saturation gray for readability.
- Do not ask for all colors by default; ask for a theme preset or one `themeColor` first, then override individual colors only when the user asks for advanced fine tuning.

Font sizes can be customized when the user asks:

- `fontSize` controls ordinary body text, list text, and quote text. Default: `14`.
- `titleFontSize` controls non-numeric headings. Default: `16`.
- `numberFontSize` controls numeric marker headings such as `# 1.5`. Default: `16`.
- Do not ask about font sizes by default; only set these fields when the user gives a preference or when you need to preserve an explicit brief.

Comment behavior:

- `needOpenComment` controls whether article comments are open. Default: `true`.
- Set `needOpenComment: false` only when the user explicitly asks to disable comments.
- `onlyFansCanComment` controls whether only followers can comment. Default: `false`.
- Automatic featured comment selection is not currently exposed by this tool as an API-controlled field.

## Markdown Structure For Built-In Design

When generating a WeChat article from scratch, use this Markdown structure so the visual template has enough semantic cues to work with:

```markdown
# 1
## Section title

Ordinary body paragraph.

> Pull quote, key idea, or section takeaway.

# 1.1
## Subsection title

Ordinary body paragraph.
```

Rendering triggers:

- `# 1`, `# 1.1`, or `# 1.5` triggers the numeric marker heading style.
- `## Section title` triggers the section title style.
- `> key sentence` triggers the quote or callout block style.
- Ordinary paragraphs should stay as plain Markdown text, not hand-written HTML.
- Use inline code only for real parameter names, commands, field names, and config values such as `themePreset`, `fontSize`, `rose-magenta`, or `wop-mcp`.
- Do not wrap ordinary Chinese sentences, prompt examples, or prose fragments in backticks. Use normal lists, bold text, or blockquotes instead.

For most generated articles, include 3 to 5 numbered sections. Do not add numeric marker headings before every short paragraph; use them only to mark real section boundaries.

Recommended fields:

```json
{
  "title": "Article title",
  "author": "Author name",
  "summary": "Short summary",
  "digest": "Short digest",
  "contentMarkdown": "Markdown content",
  "stylePreset": "default",
  "themePreset": "wechat-green",
  "fontSize": 14,
  "titleFontSize": 16,
  "numberFontSize": 16,
  "publishMode": "draft",
  "needOpenComment": true,
  "onlyFansCanComment": false
}
```

Custom primary color example:

```json
{
  "stylePreset": "default",
  "themeColor": "#c24d76",
  "fontSize": 14,
  "titleFontSize": 16,
  "numberFontSize": 16,
  "publishMode": "draft"
}
```

Advanced color override example:

```json
{
  "stylePreset": "default",
  "themePreset": "rose-magenta",
  "titleColor": "#c24d76",
  "numberColor": "#b33f69",
  "headingBorderColor": "#e8bfd0",
  "dividerColor": "#f2d9e4",
  "quoteBorderColor": "#d86a92",
  "quoteBackgroundColor": "#fff8fb",
  "linkColor": "#c24d76",
  "linkBorderColor": "#e8bfd0",
  "inlineCodeColor": "#b33f69",
  "inlineCodeBackgroundColor": "#fff4f8",
  "codeBlockBorderColor": "#e6c7d5",
  "codeBlockBackgroundColor": "#fffafb",
  "codeBlockColor": "#5e4955"
}
```

## Safety Rules

- Do not call `delete_draft` unless the user explicitly asks to delete a draft by ID.
- Do not call `submit_publish` merely because `publishMode` is set to `publish`; ask or wait for explicit instruction.
- Comments are open by default for newly created or updated drafts. If the user asks for no comments, set `needOpenComment: false`.
- Do not tell users that automatic featured comments, original declaration, rewards, collection assignment, ads, or platform recommendation can be controlled unless a future public API field is added and implemented.
- If a WeChat API error mentions IP whitelist, tell the user the public IP from the error and ask them to add it in the WeChat Official Account backend.
- If publish status is accepted but not visible on mobile, explain that WeChat push delivery and article-list visibility can be asynchronous.
- After creating or updating a draft, call `get_draft` and check title, digest, and content for mojibake such as repeated `?`, `�`, `Ã`, or `ä¸`.
- On Windows/PowerShell, avoid piping scripts that contain hard-coded Chinese text into Node. Prefer UTF-8 JSON files, existing source files, or safe file reads before calling MCP tools.

## Result Summary

When a draft is created, report:

- title
- `draftMediaId`
- whether cover upload happened
- whether inline images were uploaded
- that it is a draft only

When publish is submitted, report:

- `publishId`
- `draftMediaId`
- that WeChat may still be processing/reviewing
- next step: call `get_publish_status`
