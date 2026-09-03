# Plan — Slice A client selector

## Scope

- Archetype: 6 (CLI/tooling), horizontal kernel application extraction.
- Overlays: none.
- Doctrine verdict: preserve the application/UI layering; no new debt.
- Issue relationship: Refs #1354 (partial); stacked on #1664.
- Product ceiling: four files exactly as listed in the locked plan.

## Locked decisions

1. Move #1664's selector without changing its discovery order, resolution matrix, validation, or diagnostics.
2. `--client` remains the only selector. Ambiguity fails closed; there is no auto-pick, namespace, alias, or fallback selector.
3. Export only the internal application resolver and binding type needed by the UI and future Slice C; do not add a package public export.
4. Move selector-unit cases to a colocated extension test only when expectations can remain verbatim; retain UI integration regressions in `web-scaffold_test.ts`.

## Open-decision sweep

- None. All decisions that could force rework are locked above.

## Commit slice

1. Extract and share #1664's selector; prove with the focused selector matrix, unchanged UI regressions, package CLI tests, structured static gates, architecture/quality/docs gates, and base diff review. Files: the four product files plus this run directory.

## Risks

- Diagnostic drift: pin exact messages and compare the UI regression diff to #1664.
- Discovery-order drift: reuse the implementation verbatim and test conventional and fallback paths.
- Accidental public-surface expansion: add no `mod.ts`, export-map, carrier, or command changes.
- Lock churn: verify `deno.lock` against the baseline before commit and push.

## Deferred scope

- Resource command, procedure validation, Fresh manifest work, templates, and all later #1354 slices.

## Gates

- Focused selector and unchanged `web-scaffold_test.ts` regressions.
- Full package-owned CLI test suite with exact counts.
- Structured check/lint/fmt.
- `deno task arch:check` and `deno task quality:gate`.
- `docs:readme-fences` and `docs:jsdoc-examples` without baseline increases.
- Diff and child-count review; no carrier gate because no public surface moves.

