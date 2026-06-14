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
- Do you want a draft only or final publish?
- Do you have source text, notes, or links?
- Do you need a cover image?

Prefer one or two questions at a time.

## Article Input Shape

Use `contentMarkdown` for ordinary articles.

Use `contentHtml` only when the user needs exact HTML control or a later engineering workflow provides WeChat-compatible HTML.

Markdown rendering defaults to `stylePreset: "default"` with 14px body text. This uses a polished long-form WeChat article style with thin body text, WeChat-green anchors, fine rules, and mobile-friendly spacing.

Use `stylePreset: "classic"` when the user wants a plainer fallback style with more conservative headings and tighter spacing.

Heading accents can be customized with safe hex colors:

- `titleColor` controls non-numeric headings.
- `numberColor` controls numeric marker headings such as `# 1.5`.
- Good defaults are `#18a96f`, `#149362`, `#2aa876`, `#2f7f6f`, `#2b3941`, and `#b68a35`.

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
  "fontSize": 14,
  "titleColor": "#18a96f",
  "numberColor": "#18a96f",
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
