# Source validation recipes

Run from packages/fresh-ui: `deno run --lock=deno.lock --frozen --allow-read --allow-env scripts/validate-token-sources.ts`. All eight DTCG source documents validate against the official 2025.10 format/resolver schemas; both schema bundles embed format IDs, so compile them in separate Ajv instances. Color.js may return a boxed Number for rgba alpha: convert it with Number() before finite-number checks. DTCG hex fallback is six digits, with alpha in its separate field.
