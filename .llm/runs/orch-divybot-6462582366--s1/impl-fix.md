# IMPL-EVAL fix: scope CSS by preset

Parent5a5c1a42. Status: PASS in the same final evaluator session after the single fix round. Both verdicts are retained in impl-eval.md. First verdict is retained in impl-eval.md.

## Resulting behavior

`tokens.css` contains only the configured light/dark preset and NS One compatibility. The configured light block also serves :root; legacy light/dark selectors follow configured defaults so they win specificity ties. NS One uses2 effective contexts, other presets4 including compatibility. Native oklch/mix fallbacks remain guarded, and the original NS One CSS fixture stays intact.

Style Dictionary now emits18 additional presets/<id>.css files:68 total outputs from all72 inputs. Named registry themes install their own CSS as tokens.css and the other17 preview styles through the established one-source/one-target copy planner. The default seed also makes all18 previews available. A regression rejects duplicate theme copy sources; actual Utility ui:init copies the exact selected stylesheet bytes.

The token CLI manages23 files:five core artifacts in assets and18 separate preview styles in static/presets. Build overrides propagate to every preview. Clean enumerates only that whitelist and preserves unrelated static CSS, app styles, config and sources. The development design shell links one static stylesheet only when the allowlisted requested preset differs from the configured preset. Normal pages request no preview CSS. This uses Fresh's existing static middleware; there is no serving route or CSS import glob in UI code.

## Measured budget

| CSS | Raw bytes | Gzip bytes | Declarations | Effective contexts |
| --- | ---: | ---: | ---: | ---: |
| Before, all presets |2466154|414792|56919|36|
| NS One app |130436|24542|3035|2|
| Utility app including NS compatibility |259738|46937|6045|4|

NS One raw CSS falls94.7%. The deterministic regression caps NS One below200000 bytes/4000 declarations, every other preset below400000 bytes/7000 declarations, and requires only the configured/compatibility selector sets. Full detail: css-size-proof.json.

## Repeated proof

- Frozen build/freshness:68 outputs/72 inputs PASS. Token schema/alias/name/contrast quality receipt PASS;903 roles,4066 uses and406 exact exclusions remain unchanged.
-210 package tests PASS, including every stale/missing artifact, declaration compatibility and new CSS/copy-source bounds.37 combined CLI flow/controller/template/root tests PASS.
- Fresh app check, complete-coverage lint/format and repository quality/architecture PASS. Both publish dry-runs PASS. Pages complete exports/snippets/accuracy/build/links/caveats PASS.
- Full12-case browser capture PASS. Default pages have zero preview links, Utility exactly one successfully served stylesheet; existing scheme/keyboard/font/ramp/isolation/legacy/geometry checks remain. Utility still has zero serious/critical findings and no allowance. Axe baseline entries are unchanged from the migration review.
- Repeated8 before/after component pairs are pixel-identical, with144 equal sampled styles. Current full screenshots and comparison evidence are refreshed; original S0 captures remain untouched.
- Actual registry/scaffold CLI proof PASS: selected CSS byte-for-byte; init/build23 files; live alias in JSON/main/all18 previews; raw semantic rejection exit1 preserves all23 hashes; clean removes exactly23 and preserves unknown static/source bytes; rebuild restores identical hashes. See cli-proof-final.json.
- Full runtime remains the explicitly reported host-prerequisite UNPROVEN; no new success claim. No Figma value, source schema, contrast exclusion or legacy selector contract changed.

The first Vite-path preview probe returned404 and an import-glob candidate failed the production build; both were discarded in favor of Fresh static files, then the full production/build/browser gates passed. Publish dry-runs initially raced with the docs build replacing _site; re-running after the docs build completed passed. Those raw failures remain in private evidence. No gate was weakened.
