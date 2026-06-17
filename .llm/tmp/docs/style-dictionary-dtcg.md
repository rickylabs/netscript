# Extract: Style Dictionary v5 + DTCG 2025.10

> Source: styledictionary.com/info/dtcg/, styledictionary.com (homepage), designtokens.org/tr/drafts/format/
> Fetch date: 2026-06-11

## Key Facts

1. **SD v4 has first-class DTCG support**; SD v5 is "in progress" for full DTCG 2025.10 support (styledictionary.com/info/dtcg/).
2. The exact quote: "Important note: the latest format 2025.10 does not have full support yet in Style Dictionary. This is a work in progress in v5." (github issue #1590).
3. **SD v5 exists** and is actively developed; zeroheight already runs SD v5 + 2025.10 in production.
4. DTCG 2025.10 color object format: `{ "colorSpace": "srgb", "components": [0,0.4,0.8], "hex": "#0066cc" }` — this is the color value structure.
5. Alias syntax: `{group.token}` curly braces; JSON Pointer `$ref` also supported.
6. `$extends` for group inheritance (deep merge, JSON Schema $ref semantics).
7. **$extensions** property for vendor-specific data.
8. DTCG file extensions: `.tokens`, `.tokens.json`.
9. SD can be run programmatically via Node.js API; Deno can import npm:style-dictionary.

## Implication for Plan D-3

- SD v5 under Deno is viable via `npm:style-dictionary@^5`.
- DTCG 2025.10 color object format is the right source structure for OKLCH + hex fallback.
- The "work in progress" note means we MUST pin a specific SD v5 version and constrain to features already working (color object format is confirmed supported).
