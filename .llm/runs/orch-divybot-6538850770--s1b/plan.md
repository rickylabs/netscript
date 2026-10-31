# Plan & Design — READY FOR REVIEW

Use supplied leaf profile, feature tier. Fresh UI remains Archetype 4 with the existing token domain/adapters boundary; CLI integration is Archetype 6. No new dependencies or public commands.

1. Import exact nine-collection snapshot from #2493 at dd442e82794c4b960e51529f1c7ac534afda75ea. Add explicit Theme set A/B selection to the preset contract. Theme set owns shared WEB names; resolve those names through its aliases once, never sequentially overwrite them with inactive Theme/Theme B values. Resolve geometry and shadow reads through Theme set too. Keep NS One compatibility aliases.
2. Expose each original Theme language (including Ledger, Signal and Glass) and each Theme B language (Bloom, Cupertino, Liquid, Terminal, macOS 27, Apple Classic, Fluent 2 Web) as its own preset, with the existing fixed gray/accent/flavor/density model. Faithful presets ship only when all inputs resolve. Keep four existing COLOR names, with Studio FLOAT rule dimensions migrated to -width, as already recorded in name-migrations.json. Independently register new WEB names/types in role-manifest.json; importer does not author the registry.
3. Extend intentional contrast coverage for newly exported text/background roles, chart series at 3:1 against chart surfaces, and every code/syntax role at 4.5:1 against code surfaces. Explicit l/d source roles are measured only in their matching scheme. Make coverage validation reject missing chart/syntax uses or weakened thresholds. Regenerate exact exclusions from all measured failures, dropping every fixed/stale exclusion. Preserve all Figma values. Save JSON failing-pairs report with preset, scheme, foreground role, background paint stack, ratio and required ratio, plus a concise per-preset Markdown table. Burn-down remains OPEN.
4. Regenerate DTCG, token outputs, registry and embedded TS assets; update preset consumers and documentation/count assumptions. Add regressions that distinguish Theme A/B and independent new presets, prove every mode resolves, preserve NS One, and enforce contrast/report coverage. Run structured check/test/lint/fmt, token sources/validate/freshness, quality:gate, release:preflight, docs:accuracy, all applicable root check:* commands, native publish-size test, and full scaffold.runtime once. Docker unavailable means runtime UNPROVEN.
5. Independent read-only Claude plan evaluation before code; independent read-only Claude implementation evaluation with substantive slice review before sign-off commits. Keep one evaluator across repair rounds. Final exact-head required CI checks must be green before READY. No labels; Refs #2450; Cockpit merges.

## Commit slices

- Bootstrap/source/plan: this run directory and exact source export; plan evaluation proves design.
- Tokens v2 implementation: packages/fresh-ui source, snapshots, registry, output and tests plus run evidence; token and package gates, independent implementation evaluation.
- Carriers and integration: generated CLI/MCP carriers, documentation and narrowly required consumers plus run evidence; canonical integration checks and independent final review.

## Deferred scope

Figma contrast value burn-down and merge/publication belong to owner/Cockpit. No code-side color corrections. No arbitrary free density or base accent toggles. No component redesign.

## Contributor path

packages/fresh-ui/tokens/README.md is the extension entrypoint.

## Locked decisions and risk register

- Remove old Bloom/Liquid scalar/font overrides now that Theme B owns them; core aliases follow the exported Scheme/Theme set values, including shadow x. Retain historical pack-only node roles for consumers where the fresh export has no replacement. A test compares every routed exported role with source values to prevent accidental palette edits.
- Unitless state opacity imports as DTCG number; dimensions retain pixels. Type mappings remain an explicit code responsibility.
- Add scheme applicability to contrast-pair data for explicit l/d roles; validate unknown/empty applicability and ensure required coverage still applies in each effective context.
- Alias cycles/missing modes: resolve all variables in all preset/scheme inputs and assert references. Duplicate names: router ownership plus a regression that reverses collection order. False contrast coverage: deterministic negative controls remove chart/syntax pairs and weaken thresholds. Stale exceptions: regenerate from zero exclusions, preserve strict exact matching.
- Publish risk: no new JSON import attributes in shipped source; all authoritative assets remain gzip embedded. Run native publish budget, JSR audit and doc lint; report inherited findings separately, never waive branch regressions.
- Generated carrier drift: regenerate authoritative carrier tools after source is committed, rerun all four check tasks and remaining configured checks. Restore only generated docs/site lock churn, never delete locks.

## Open decisions

None that affect implementation remain. Figma value burn-down and post-merge publication are safe to defer because code reports exact failing pairs and does not claim completion of that design work. Docker availability is an execution fact, recorded UNPROVEN if absent.

## PLAN-EVAL round 1 corrections — locked contract

B1: Remove applyPresetOverlay and PRESET_ROLE_MAPS use entirely: Scheme now owns core roles. Retain legacy-role-aliases for NS One only. addNodeRoles may add historical names only if no Figma WEB variable exports that name; exported-name equality regression guards this. Non-Figma Terminal key aliases remain a component-only contract. Shadow x reads Theme set/shadow/x, not a brutal-id conditional. All Figma-exported names in non-NS-One presets resolve from Figma with no legacy fallback or scalar override; legacy-only compatibility names may remain.

B2: Chart foregrounds are chart-1…5, matching-scheme chart-l|d-1…5, and matching-scheme studio-chart-l|d-1…5 in Studio presets. Required chart background roles: bg (surface/bg), card-bg (card/bg), card (surface/card); Cupertino adds cupertino-surface-bg/card/raised/well, Liquid adds liquid-surface-bg/card/raised/well/zebra, Fluent adds fluent-solid-base. Each background is composited over bg through TokenContrastPort; all these exact per-role checks require 3:1. Faithful themes measure their own routed Scheme/Theme set surfaces, not inspired pack roles, because those packs represent different languages. Every exported code-syntax-* role requires 4.5:1 on code-bg. TokenContrastPair.schemes?: readonly TokenScheme[] filters explicit l/d values; missing/empty/invalid entries fail. Coverage requires chart surface pairs and syntax/code-bg pairs so deleting one is a negative control.

B3: Preset table (id | Theme set | active mode | Base gray | Base accent | flavor | source density / public density):

| id | set | mode | gray | accent | flavor | density |
| --- | --- | --- | --- | --- | --- | --- |
| ledger | A | Ledger | Slate | Indigo | Utility | Dense / compact |
| signal | A | Signal | Neutral | Lime | Utility | Dense / compact |
| glass | A | Glass | Slate | Blue | Utility | Comfortable / comfortable |
| macos-27 | B | macOS 27 | Slate | Blue | Utility | Comfortable / comfortable |
| apple-classic | B | Apple Classic | Slate | Blue | Utility | Comfortable / comfortable |
| fluent-2-web | B | Fluent 2 Web | Neutral | Blue | Utility | Comfortable / comfortable |

Existing bloom, cupertino, liquid and terminal retain ids and base/density defaults but select set B and their exact namesake modes. All other presets select A; Studio fixes mode Studio plus its flavor and original density. Non-active Theme collection uses its declared default (Studio for Theme, Bloom for Theme B). Base inputs affect only aliases that explicitly reach Base gray/accent; Theme B-owned gray/accent ramps take precedence naturally. Constants FIGMA_THEME_SET, FIGMA_THEME_COLLECTIONS map A/B to Theme/Theme B. figmaModes derives target collection modes from these constants.

## Review regression and release proof

- Snapshot contains exactly four cross-type WEB collisions, already mapped to -width. Reject all other duplicate names except identical Theme/Theme B/Theme set definitions; test reversal of collection order for identical imported documents.
- Token metadata records the origin collection/name/mode and selected Theme set, theme collection and theme mode. Keep Theme set provenance for routed names.
- Source type/em/style includes Italic and Regular/weight variants. DTCG 2025.10 has no string/fontStyle type. Keep fontWeight as the stable standard type; the Italic primitive uses the standard regular weight with netscript.css="italic" and netscript.figmaStyle="Italic" preserving the original style. CSS serialization reads the exact style; computed Figma serialization carries that source style through BuiltToken rather than returning its regular-weight carrier. Other weight styles retain their numeric fontWeight. Schema validation, exact CSS and Figma style round-trip tests prove this representation does not edit the source value.
- Faithful preset eligibility: every variable/alias resolves, every exported name equals source values, no code overlays/fallbacks replace exported values, and all font requests build. All three are expected to qualify; report actual result.
- Exact exclusions regenerated from zero allowances; source names immutable export PR/commit plus pair roles/report, except inherited S0 pairs retain S0 provenance; reason explicitly says owner must correct and re-export, burn-down open.
- Required gates: structured package check/test/lint/fmt; token source/name/contrast/freshness and negative controls; quality:gate (includes arch:check); release:preflight; docs:accuracy; native publish-size.test.ts and token CSS bounds/6000-byte gzip check; registry-template lint via scoped wrappers. Regenerate agent-docs prose → export corpus → assets barrel → publish assets, plus Aspire surface manifest if changed. Run EVERY configured root check:* task (review-threads supplied this PR); record external prerequisites or inherited failures as unproven/failed, never pass. Revert docs/site/deno.lock churn. Run scaffold.runtime in one pass with cleanup; Docker unavailable is UNPROVEN.
- Token slice gate: token tests+source/check/contrast, package structured check/lint/fmt, native publish size, quality gate, independent slice review. Carriers slice gate: all check:* tasks, release/docs accuracy, CLI token/template regressions, runtime, independent final review. Generated token assets necessarily exceed 30 files; they are one reproducible output set rather than independent logic slices.
