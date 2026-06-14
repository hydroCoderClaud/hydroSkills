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
- Do you want to use the default `wechat-green` theme, or choose `rose-magenta`, `soft-purple`, or `ocean-blue`?
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

- `wechat-green`: title `#18a96f`, number `#18a96f`, quote border `#18a96f`, quote background `#fbfefd`
- `rose-magenta`: title `#c24d76`, number `#b33f69`, quote border `#d86a92`, quote background `#fff8fb`
- `soft-purple`: title `#8b6fd6`, number `#7a5fc9`, quote border `#a58ee2`, quote background `#fbf9ff`
- `ocean-blue`: title `#2f86b7`, number `#2777a6`, quote border `#5aa6cc`, quote background `#f6fcff`

Each theme preset coordinates four colors:

- `titleColor` controls non-numeric headings.
- `numberColor` controls numeric marker headings such as `# 1.5`.
- `quoteBorderColor` controls the quote/callout left border.
- `quoteBackgroundColor` controls the quote/callout background.
- Ordinary body text and quote text stay low-saturation gray for readability.
- Do not ask for all four colors by default; ask for a theme preset first, then override individual colors only when the user asks.

Font sizes can be customized when the user asks:

- `fontSize` controls ordinary body text, list text, and quote text. Default: `14`.
- `titleFontSize` controls non-numeric headings. Default: `16`.
- `numberFontSize` controls numeric marker headings such as `# 1.5`. Default: `16`.
- Do not ask about font sizes by default; only set these fields when the user gives a preference or when you need to preserve an explicit brief.

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
  "titleColor": "#18a96f",
  "numberColor": "#18a96f",
  "quoteBorderColor": "#18a96f",
  "quoteBackgroundColor": "#fbfefd",
  "publishMode": "draft",
  "needOpenComment": false,
  "onlyFansCanComment": false
}
```

## Safety Rules

- Do not call `delete_draft` unless the user explicitly asks to delete a draft by ID.
- Do not call `submit_publish` merely because `publishMode` is set to `publish`; ask or wait for explicit instruction.
- If a WeChat API error mentions IP whitelist, tell the user the public IP from the error and ask them to add it in the WeChat Official Account backend.
- If publish status is accepted but not visible on mobile, explain that WeChat push delivery and article-list visibility can be asynchronous.

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
