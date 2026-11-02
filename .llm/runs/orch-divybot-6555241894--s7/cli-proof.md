# Actual builder to CLI proof

Implementation source: cf1a8f80985967642cc8a4dcf80bd0c97c990c01. Deno 2.9.7. Browser reads the actual built /netscript/create page after builder/preview readiness, selects studio-cloud, and copies the textarea value:

`ns1_eyJ2ZXJzaW9uIjoxLCJ0aGVtZSI6InN0dWRpby1jbG91ZCIsInN0eWxlIjoic3R5bGUtdXRpbGl0eSJ9`

Actual command, raw exit **0**:

```sh
deno run -A packages/cli/bin/netscript-dev.ts init s7-preset-proof \
  --path .llm/tmp/s7-proof-6555241894 --db none --editor none \
  --ci --yes --no-git --no-aspire --preset ns1_eyJ2ZXJzaW9uIjoxLCJ0aGVtZSI6InN0dWRpby1jbG91ZCIsInN0eWxlIjoic3R5bGUtdXRpbGl0eSJ9
```

This is the local-source CLI init, using the same prepareInitPreset/applyInitPreset flow as public init, with actual package copy and actual application of the copied code. No stub or alternate decoder. The generated app is served by its maintained dev task with --host 127.0.0.1 --port 4187 and rendered at /design/components. No generated app edits were made.

## Resolved tokens

[Token comparison](proof/token-comparison.json): generated theme-preset.json selects studio/cloud/comfortable. Both selected full preset dictionaries match canonical studio-cloud, and all **1,180 resolved tokens per scheme** in generated tokens.json match exactly. Generated tokens.css is byte-identical to the shipped studio-cloud CSS (SHA-256 in the report). The active manifest intentionally rewrites defaultPreset/tokens/themes/ramps to the selected preset.

## Rendered comparison

[Browser comparison](proof/render-comparison.json): both actual builder iframe and independently generated app render in light and dark. All **1,180 computed custom properties** agree after semantic normalization: browser-canvas RGBA for colors (including shadows), numeric/time/whitespace normalization for minified serialization. **Zero differences in either scheme.** The actual primary Button’s colors, border color/radius, font family/size/weight, height and horizontal padding agree exactly. No page errors. Controls are 36px high, 10px radius, Figtree 12px/500. Light primary is RGBA(13,116,206,255), dark RGBA(0,144,255,255).

[Builder light](proof/builder-light.png), [builder dark](proof/builder-dark.png), [generated page light](proof/app-light.png), [generated page dark](proof/app-dark.png), and isolated actual app button [light](proof/app-button-light.png)/[dark](proof/app-button-dark.png) preserve the rendered evidence. Scripts [copy-builder.mjs](proof/copy-builder.mjs) and [compare-render.mjs](proof/compare-render.mjs) reproduce capture/assertions from the repository root after starting the two owned servers. Local browser shared-library setup is environment-specific; no repository dependency changes are needed.

Reproduction diagnostics retained privately: a first raw CSS string comparison exposed expected minifier serialization differences (Lab/OKLCH, seconds/milliseconds and shadow token separators); semantic normalization resolved these without relaxing component color/geometry assertions. A first manifest comparison inspected token records rather than their value fields; the final exact comparison reads the actual value fields. Actual command status and final assertions, not early scaffold messages or diagnostic output, are the verdict.
