# Token shorthand and source gaps

- Current contract role shorthand is not naïve whole-segment alternation: `space/page/padding-x|y` means both padding-x and padding-y. Exact rule locked in plan.md; app-shell must be a positive control.
- `SF:` role namespace must bind through Theme set to preserve theme routing, not directly to Theme/Theme B/Studio flavor. Default role lookup Scheme → Theme set → Density.
- Fully expanded prose role `SF:prose/h2|h3|h4/size|line|tracking` includes absent `Theme set/prose/h4/tracking` on this baseline. Never silently omit or invent that binding. Strict full generation must fail before output; source repair belongs outside S5b.
- Maintained Code Connect API uses virtual `figma`, `.figma.ts` URL metadata and figma.code; HTML parser figma.connect is deprecated. Official template docs: https://developers.figma.com/docs/code-connect/template-files/ .
