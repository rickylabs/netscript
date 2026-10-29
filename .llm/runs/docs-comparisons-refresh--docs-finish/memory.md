# Comparison maintenance notes

- Keep scenario prose in comparisons/_data.ts and exact compilable sources in comparisons/_examples. `deno run -A tools/docs-site/check-comparison-examples.ts` derives source export maps and runs the structured check wrapper with consumer compiler settings; no cast or suppression hides API drift.
- Shared producer/Fresh examples use upstream createStateSchema. The producer-only package-owned schema helper has a different consumer-facing shape; do not assume it is interchangeable with Fresh StreamDB.
- Component headings need explicit ids: Markdown heading plugins do not assign anchors inside this raw HTML component. Hash handling must reveal the containing scenario for both panel and descendant anchors.
- Vento autotrim removes trailing spaces around template tags. Use explicit entities between source links so the rendered sources remain readable.
- No-JS browser contexts must inherit the project's viewport and color scheme; otherwise a four-project report silently repeats desktop/light for those tests.

- Browser test files under tools/fresh-ui-browser use docs/site/deno.json for format as CI explicitly selects it. Run the exact scoped wrapper from the docs workflow; the tools root formatter gives a conflicting quote style.
