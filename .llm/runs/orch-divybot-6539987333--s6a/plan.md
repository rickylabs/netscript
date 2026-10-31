# Plan & Design — READY FOR REVIEW

## Locked decisions

Deliver Utility only on baseline shipped components/blocks. Use existing data-scope/data-part/variant attributes; CSS uses existing Figma semantic roles, not literal design values. Preserve NS One styling with a Utility preset scope. Do not edit tokens or their contrast allowances. New scaffolds select Studio Utility explicitly; old app configuration wins. Fix generated islands with accessible presentational rendering and registry Button, contain health content, and make the Design link conditional on development because its routes intentionally do not ship.

## Ordered slices

1. Defaults and generated pages: CLI application/init and page/island templates, focused regression tests, default docs. Prove selection/legacy behavior, valid generated imports and layout.
2. Utility restyle: existing registry component CSS plus layout/island styles and minimal component state corrections. Cover every baseline registry visual item; reuse existing parts and keep keyboard/runtime contracts. Prove actual rendered light/dark component states, sizes, RTL/reduced motion and legacy preset isolation.
3. Evidence and carriers: compact per-component Figma comparison, generated registry/CLI/docs/publish carriers, tests and final independent review. No screenshot dump in Git.

## Gate set

Structured scoped check, test, lint and fmt; quality:gate (quality:scan + arch:check); JSR package audit; release:preflight; docs:accuracy; all root check:* tasks that apply (report unavailable-input tasks explicitly); token contrast validation without exclusions; registry embedding, agent-docs prose, export corpus, assets barrel and publish assets freshness. Run the exact scaffold.runtime cleanup command once; Docker unavailable means UNPROVEN. Browser evidence uses real component markup, light/dark, rest/hover/focus/active/disabled/invalid/loading as applicable, sizes and RTL/reduced-motion.

## Risks and mitigations

- Shared CSS conflicts with #2488: only baseline items, fetch/merge main before final head, never force push.
- CSS specificity may override native states: assert computed states and legacy isolation in Chromium.
- Figma ledgers differ from spec: ledger wins; record missing roles/gaps without inventing token values.
- Environment/runtime or inherited gates may fail: report exact evidence, retain draft; never READY without required green checks at current head.
- Asset regeneration may change unrelated outputs: inspect diff and restore only run-generated unrelated churn, especially docs/site/deno.lock.

## Open decisions and deferred scope

No unresolved architectural decision. Exact component bindings are implementation detail grounded in ledger/render inspection. Other styles, new gap components, token source corrections and 0.0.8 migration redesign are deferred by owner scope. No new architecture debt planned. The existing token source contrast debt is not reclassified as fixed.

## Review and release

Both evaluations use the explicit Claude Opus 5.5 high override in separate read-only sessions. No self-certification. Do not merge until selected plan review and mandatory implementation review pass. Refs #2419 only; no labels or public session ids. Cockpit merges.
