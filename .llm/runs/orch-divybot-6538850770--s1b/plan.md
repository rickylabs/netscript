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
