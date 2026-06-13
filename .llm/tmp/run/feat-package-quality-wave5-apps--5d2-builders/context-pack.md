# Context Pack: 5d2 builders — `definePage` DSL decomposition

## Run Metadata

| Field          | Value                                                |
| -------------- | ---------------------------------------------------- |
| Run ID         | `feat-package-quality-wave5-apps--5d2-builders`      |
| Branch         | `feat/package-quality-wave5-apps-5d2-builders`       |
| Current phase  | `plan`                                               |
| Archetype      | A3 Runtime/Behavior + A4 DSL/Builder + SCOPE-frontend |
| Scope overlays | frontend                                             |

## Current State

Skeleton `design.md`, `plan.md`, `context-pack.md` created.  
Phase-1 research is committed and will be reused; no re-derivation.  
Next: populate design decomposition, DSL market bar, island/RFC-14 seams, browser validation strategy, then lock commit slices.

## Completed

- Read AGENTS.md, netscript-harness skill, umbrella plan, handover, phase-1 research, A3/A4/SCOPE-frontend archetypes, plan-gate matrix, run-loop.
- Created skeleton deliverables.

## In Progress

- Deep-dive decomposition and design.md population.

## Next Steps

1. Inspect source files (`builder.tsx`, `runtime.tsx`, `navigation.tsx`, `types.ts`, `search-params.ts`, `define-partial.tsx`, tests).
2. Run measurements (`deno doc --lint`, file sizes, private-type-ref inventory).
3. Populate DSL market bar and RFC-14 / island seams.
4. Lock slice list in plan.md.
5. Update drift.md if any divergence from umbrella/handover.
6. Commit plan artifacts.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Public surface unchanged | umbrella plan §Final public surface | No new exports, no renamed types. |
| Role-named subfolders | A4 archetype + handover | builder / runtime / navigation / types / internal. |
| Reuse phase-1 research | handover | Do not re-derive symbol map or baseline. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/tmp/run/feat-package-quality-wave5-apps--5d2-builders/design.md` | new | skeleton |
| `.llm/tmp/run/feat-package-quality-wave5-apps--5d2-builders/plan.md` | new | skeleton |
| `.llm/tmp/run/feat-package-quality-wave5-apps--5d2-builders/context-pack.md` | new | skeleton |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | not started | |
| Fitness | not started | |
| Runtime | not started | |
| Consumer | not started | |

## Open Questions

- One plan or two?
- Exact fixture route set for A4-Browser validation.

## Drift and Debt

- Drift: none yet.
- Debt: none yet.

## Commits

- none yet
