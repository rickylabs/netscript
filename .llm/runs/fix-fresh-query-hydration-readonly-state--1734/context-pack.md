# Context Pack: Fresh query hydration readonly/mutable type correction

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-fresh-query-hydration-readonly-state--1734` |
| Branch | `fix/fresh-query-hydration-readonly-state` |
| Current phase | `plan` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` (contract-only) |

## Current State

S2 is implemented and focused-green. Private guards validate readonly unknown cache records before
copying them into TanStack's mutable input. Exact 5.101.0 and 5.102.8 checks pass; public types,
exports, and the ^5.101.0 range remain unchanged.

## Completed

- Required skills, harness workflow, static gates, doctrine, archetype, overlay, and issue read.
- Exact 5.102.8 failure reproduced and declared range restored.
- Dependency latest/why evidence and JSR/doc-lint baselines captured.
- S0 pushed and draft PR #1736 opened with required metadata.
- S1 RED fixture/test added and proven failing before implementation.
- S2 private boundary correction and behavior tests implemented.
- Focused tests/check/lint/fmt, quality scan (`allowCount: 7`), and arch check pass.

## In Progress

- S2 commit and push.

## Next Steps

1. Commit/push S2 and post its PR phase comment.
2. Run the final exact-head requested static suite.
3. Push the receipt commit and leave the PR draft for external Tier-A/IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Keep `^5.101.0` | plan D1 | Support entire range. |
| Keep public `DehydratedState` unchanged | plan D2 | No mutable widening or upstream leak. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-fresh-query-hydration-readonly-state--1734/*` | new | Harness evidence only. |
| `packages/fresh/tests/query-hydration-version-compat_test.ts` | new | RED child-check regression. |
| `packages/fresh/tests/type-fixtures/query-hydration-5.102.8-deno.json` | new | Exact 5.102.8 no-lock config. |
| `packages/fresh/tests/type-fixtures/query-hydration-5.101.0-deno.json` | new | Exact 5.101.0 no-lock config. |
| `packages/fresh/src/application/query/hydration.ts` | changed | Private validated mutable conversion. |
| `packages/fresh/tests/query-hydration_test.ts` | new | Valid readonly hydration and invalid-entry behavior. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | focused PASS | 4 tests; 3-file check/lint; 5-file fmt |
| Fitness | focused PASS | quality scan and arch check |
| Runtime | N/A | no lease |
| Consumer | pending | S2 |

## Open Questions

- None.

## Drift and Debt

- Drift: historical Fresh doc-lint resolution no longer matches current 45-diagnostic baseline;
  a transient F-16 warning from colocated test placement was fixed before commit.
- Debt: no new debt; inherited findings remain outside issue #1734.

## Commits

- See the draft PR's commit list + per-slice PR comments.
