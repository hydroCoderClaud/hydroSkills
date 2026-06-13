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

Recommended fields:

```json
{
  "title": "Article title",
  "author": "Author name",
  "summary": "Short summary",
  "digest": "Short digest",
  "contentMarkdown": "Markdown content",
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
