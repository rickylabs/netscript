# Refreshed CLI proof after coordinator repairs

Copied from the newly built /create page after builder and Cloud iframe readiness:

`ns1_eyJ2ZXJzaW9uIjoxLCJ0aGVtZSI6InN0dWRpby1jbG91ZCIsInN0eWxlIjoic3R5bGUtdXRpbGl0eSJ9`

Actual current local-source CLI command, raw exit **0**:

```sh
deno run -A packages/cli/bin/netscript-dev.ts init review-preset-proof \
  --path .llm/tmp/s7-review-proof-6555241894 --db none --editor none \
  --ci --yes --no-git --no-aspire --preset ns1_eyJ2ZXJzaW9uIjoxLCJ0aGVtZSI6InN0dWRpby1jbG91ZCIsInN0eWxlIjoic3R5bGUtdXRpbGl0eSJ9
```

The unmodified generated app ran its maintained dev task on port4187 and rendered /design/components. Current builder/iframe served from the newly built docs on port4186. Deno2.9.7. Shared existing codec, including the new size/error rules; no alternate decoder or generated-app edits.

[Canonical tokens/CSS](proof-review/token-comparison.json): selected Studio Cloud metadata correct, all **1,180 resolved tokens per scheme** exact, generated tokens.css byte-identical to canonical Cloud CSS. [Rendered comparison](proof-review/render-comparison.json): **zero differences across1,180 computed custom properties** in both schemes after the same documented browser color/time serialization normalization. Primary Button color, border color/radius, font family/size/weight, height and horizontal padding agree exactly; no page errors.

[Builder light](proof-review/builder-light.png), [builder dark](proof-review/builder-dark.png), [app Button light](proof-review/app-button-light.png), [app Button dark](proof-review/app-button-dark.png).

The repaired docs preview deliberately loads only the existing self-hosted docs fonts and otherwise uses each preset’s declared fallback stacks. The generated app retains its canonical font manifest. Matching font-family token/computed declarations do not claim identical downloaded font-face availability or glyph pixels for every preset. The UI now makes that fallback boundary visible. This is the coordinator-approved drop-remote-links option. The independent browser census proves no outgoing third-party requests for all24builder selections and all52registry previews.
