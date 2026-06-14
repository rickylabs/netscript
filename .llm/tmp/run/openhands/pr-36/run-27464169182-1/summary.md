# OpenHands Summary — 5d3 route PLAN phase

## Task
Fill every TODO in `.llm/tmp/run/feat-package-quality-wave5-apps--5d3-route/design.md` and
`plan.md` with real PLAN-phase content, update `drift.md`, and commit to the branch. Zero
implementation; PLAN only.

## Summary
- Reused committed research artifacts from `.llm/tmp/run/feat-package-quality-wave5-apps--5d3-route/`
  without re-running measurements.
- Filled `design.md` with measure-first baseline, decomposition target, E2E typesafety chain,
  manifest vs Fresh 2 `fsRoutes`, oRPC/contracts alignment, runtime validation design, and
  risks/supervisor questions.
- Filled `plan.md` with a 25-slice (<=30) slice lock, MEASURE-FIRST table, gate-to-slice map,
  review map, assumptions, dependencies/merge impact, and side-effect ledger.
- Updated `drift.md` with 4 new drift entries (D-5d3-002 through D-5d3-005).
- Committed the four PLAN-phase artifacts to the feature branch.

## MEASURE-FIRST table (committed numbers reused)

| Metric | Value | Target |
|--------|-------|--------|
| `route/mod.ts` LOC | 755 | <= 500 |
| `route/contract.ts` LOC | 764 | <= 500 |
| `route/manifest.ts` LOC | 534 | <= 500 |
| Combined `deno doc --lint` errors | 180 | 0 |
| . missing-jsdoc | 106 | 0 |
| . private-type-ref | 74 | 0 |
| `deno publish --dry-run` package-wide problems | 62 (not route-specific) | route surface adds 0 new problems |
| Public exports from `./route/mod.ts` | 49 | unchanged (plus re-export aliases only) |

## Slice count
25 slices (<= 30), grouped into Foundation -> Public-surface completeness -> Static gates ->
Consumer + runtime validation.

## Gate-to-slice map (every required archetype gate covered)
- F-1 (file-size): slices 2-7, 15
- F-2 (helper reinvention): slice 16
- F-3 (layering): slices 2-4, 6, 17
- F-5 (public surface): slices 3-4, 8-14, 18
- F-6 (JSR publishability): slice 25
- F-7 (doc-score): slices 8-14, 25
- F-8 (workspace lib): slice 21
- F-9 (permissions): slice 24
- F-10 (test shape): slices 23-24
- F-11 (forbidden folders): slice 2
- F-12 (naming): slices 1, 19
- F-13 (runtime invariants): slice 24
- F-14 (console-log): slices 6, 12
- F-15 (re-export-upstream): slices 3-4, 7, 20
- F-16 (folder cardinality): slice 2
- F-18 (sub-barrels): slice 2
- Static type gate: slice 21
- Doc-lint gate: slice 14
- Consumer gate: slice 22
- Runtime/Aspire gate: slice 24
- F-4 / F-17 / browser validation: N/A or deferred out of 5d3 scope

## Top decisions / risks
1. Decompose three overweight route files into `route/types.ts`, `route/navigation.ts`,
   `route/manifest-types.ts`, and `route/_internal/` while preserving every public export.
2. Move link/hook helpers into `route/navigation.ts` to clear builder-side `private-type-ref`
   leaks; requires 5d2 surface stability.
3. Type-align route schemas with `@netscript/contracts` `ContractSchema<T>` (type-level only).
4. Keep manifest as a thin Fresh 2 `fsRoutes` wrapper, adding only contract sidecars and static
   codegen.
5. Runtime/Aspire proof deferred until 5d2 fixture conventions are known.

## Changes
- `design.md` rewritten (242 lines)
- `plan.md` rewritten (211 lines)
- `drift.md` updated (36 lines)
- `worklog.md` updated (13 lines)
- Commit `2163459` on `feat/package-quality-wave5-apps-5d3-route`

## Validation
- Zero `TODO` markers remain in `design.md` and `plan.md`.
- Slice count verified <= 30.
- Every required archetype gate from `archetype-gate-matrix.md` mapped to a slice.
- No code implementation; no `deno cache --reload`; no lockfile changes.

## Remaining risks
- 5d2 builder surface may shift before 5d3 implementation; consumer-import gate (slice 22) must be
  re-run after any 5d2 merge.
- Aspire/runtime fixture location needs supervisor decision (playground vs dedicated fixture).
- Package-wide `deno publish --dry-run` failures are out of 5d3 scope and may obscure route
  progress unless evaluated with a scoped check.

READY FOR PLAN-EVAL
