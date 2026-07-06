# Workflow Reference

## Default Behavior

Default to draft creation. This is the safest normal path:

1. `doctor`
2. `preview_article` if the user wants to inspect local layout before touching WeChat
3. `prepare_cover` if using a local cover image
4. `create_draft`
5. `get_draft` if the user wants to inspect the saved draft

Only call `submit_publish` when the user explicitly says to publish, formally publish, submit, or send the article live.

For sticker/newspic posts, use `preview_sticker_images`, `render_sticker_images`, `create_sticker_draft`, or `create_sticker_draft_from_content` instead of forcing the content into a normal article.

## Local Pseudo Preview

Use `preview_article` when the user wants to see the layout before creating a WeChat draft.

- It writes a standalone local HTML file and returns `filePath` / `fileUrl`.
- If `outputPath` is omitted, it writes to `./wxpub_output/<title>.preview.html` under the current working directory.
- It does not call WeChat APIs, upload images, create drafts, or send preview messages.
- It is useful for checking theme color, font size, numeric headings, quotes, lists, code blocks, and approximate mobile width.
- It is not the WeChat backend preview. Final rendering can still differ slightly in the Official Account editor and on mobile WeChat.

Use `preview_sticker_images` for sticker/newspic local preview. It renders local PNG sticker images and writes a WeChat-style local HTML preview page without calling WeChat APIs.

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
- `bodyColor` controls ordinary paragraph and list text.
- `mutedColor` controls secondary text such as quotes, subtitles, and footers.
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
- Ordinary body text and quote text stay low-saturation for readability, but they are still derived from the selected theme or custom `themeColor`.
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

## Sticker / Newspic Input Shape

Use the sticker path when the user asks for 贴图, sticker, newspic, image cards, or a concise image-led post.

`sticker` is the user-facing product term. `newspic` is the WeChat API `article_type`. They are not separate stages.

Use `create_sticker_draft_from_content` for structured card content:

```json
{
  "title": "Sticker title",
  "subtitle": "Optional subtitle",
  "summary": "Short summary",
  "contentMarkdown": "Optional themed body shown in the newspic draft.",
  "themePreset": "wechat-green",
  "cards": [
    {
      "title": "Card title",
      "body": "Card body",
      "badge": "Optional badge"
    }
  ],
  "fallbackToArticle": true
}
```

Use `create_sticker_draft` when local PNG/JPG files or existing image `mediaId`s are already available:

```json
{
  "title": "Sticker title",
  "digest": "Short digest",
  "contentMarkdown": "Optional themed body shown in the newspic draft.",
  "images": [
    {
      "filePath": "./card-1.png",
      "alt": "Card 1",
      "caption": "Optional caption"
    }
  ],
  "fallbackToArticle": true
}
```

Use `update_sticker_draft` to revise an existing sticker/newspic draft:

```json
{
  "mediaId": "existing draft media_id",
  "sticker": {
    "title": "Updated sticker title",
    "contentMarkdown": "Updated themed body shown in the newspic draft.",
    "themePreset": "rose-magenta",
    "images": [
      {
        "filePath": "./updated-card-1.png",
        "alt": "Updated card 1"
      }
    ]
  }
}
```

Do not use ordinary `update_draft` for sticker/newspic drafts. `update_draft` writes a normal `news` article payload; `update_sticker_draft` writes `article_type: "newspic"` with `image_info`.

`fallbackToArticle` is only for creating a new sticker draft. Do not include it when calling `update_sticker_draft`; an existing `newspic` draft cannot be downgraded during update.

Sticker theme behavior:

- Sticker rendering uses the same theme model as ordinary articles.
- `themePreset` supports `wechat-green`, `rose-magenta`, `soft-purple`, and `ocean-blue`; `warm-cream` is also kept for sticker compatibility.
- `themeColor` derives a coordinated palette from one custom primary color, just like ordinary article rendering.
- Explicit color overrides such as `titleColor`, `numberColor`, `dividerColor`, `headingBorderColor`, `inlineCodeBackgroundColor`, `linkColor`, and `codeBlockBackgroundColor` affect sticker SVG/PNG output, not only metadata.
- Map color roles consistently: sticker title uses `titleColor`; body and bullet text use `bodyColor`; subtitles and footers use `mutedColor`; badge/accent uses `numberColor`; bullet dots use `linkColor`; the separator uses `dividerColor`; card border uses `headingBorderColor`; soft background uses `quoteBackgroundColor`; badge background uses `inlineCodeBackgroundColor`; card background uses `codeBlockBackgroundColor`.
- Keep ordinary sticker body copy in an article-like theme-derived body style instead of tinting prose with the accent color.
- The newspic draft `content` body also uses the ordinary article renderer when `contentMarkdown`, `content`, `summary`, or `digest` is provided. Prefer `contentMarkdown` for authored body copy; use `contentHtml` only for exact WeChat-compatible HTML control.

## Sticker Layout Density Rules

Sticker/newspic cards are final images, not editable article paragraphs. Optimize for visual breathing room:

- Use one message per card. Avoid turning a card into a miniature long-form article.
- Keep `body` short enough for 2 to 4 visual lines when possible.
- Use 2 to 4 bullets per card. Prefer concise bullets over full sentences.
- Keep a clear gap after `body` before the first bullet. The first green-dot row should read as a new list block, not as a continuation of the paragraph.
- Keep the bullet group compact after that first gap: bullet rows should be readable, but not so loose that each dot feels like a separate section.
- Avoid long mixed Chinese/English tokens when a shorter label works. If tool names are necessary, put one tool name per bullet.
- Use `preview_sticker_images` before draft creation whenever the content is newly generated, has long titles, long bodies, mixed Chinese/English text, or more than three bullets.

When generating HTML/SVG/image layouts outside the built-in renderer:

- Use flow layout or measured text block heights.
- Do not position subtitles, body text, or bullets with fixed coordinates that assume a single title line.
- Treat title, subtitle, body, bullet list, footer, and page index as separate vertical blocks with explicit gaps.
- If anything overlaps, wraps awkwardly, or feels cramped, revise the content or spacing before creating a draft.

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
  "bodyColor": "#5a4651",
  "mutedColor": "#77636d",
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
