# Cover Generation Reference

Preferred cover workflow:

1. Generate a local HTML/CSS cover composition.
2. Use Playwright or a browser screenshot tool to export a PNG/JPG.
3. Call `prepare_cover` to crop/convert/compress it for WeChat thumb upload.
4. Pass the resulting JPG to `create_draft` as `coverImagePath`.

Use text-to-image APIs when the user explicitly asks for an illustrative, photographic, painterly, or otherwise visually generated cover that cannot be made well with HTML/CSS alone.

## Design Defaults

Keep WeChat covers simple and readable:

- Large title
- Short subtitle if needed
- Clear contrast
- No tiny text
- Avoid decorative clutter
- Avoid relying on brand logos unless the user provides them

Recommended source canvas:

- `900x383` or another 2.35:1 ratio for composition
- After rendering, call `prepare_cover`, which defaults to `720x306` and `64KB`

## Playwright Route

When creating a cover locally:

1. Write an HTML file with embedded CSS.
2. Open it with Playwright.
3. Screenshot the target element or page.
4. Save as PNG or JPG.
5. Call MCP `prepare_cover`.

Do not ask the user to manually crop or compress the image unless automation fails.

## Text-to-Image Route

When the user wants a special illustrated or photographic cover:

1. Generate the image with the available text-to-image API or image MCP.
2. Save the result locally.
3. Add any required title text with HTML/CSS if the generated image text is unreliable.
4. Export the final cover image.
5. Call MCP `prepare_cover`.

Prefer keeping text out of the generated image itself unless the chosen model is known to render text reliably.
