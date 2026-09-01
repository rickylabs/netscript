# Context Pack: Flow-B fixture workers anchor

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-flow-b-fixture-plugin-marker--1863` |
| Branch | `fix/flow-b-fixture-plugin-marker` |
| Current phase | `evaluate` |
| Archetype | `6 — CLI / Tooling` (nested E2E workspace) |
| Scope overlays | `none` |

## Current State

Implementation is complete. The Flow-B fixture now selects the workers resource range using unique
semantic creation and registration code anchors. Focused RED/GREEN flipped 0/3 to 3/0, all scoped
static wrappers pass, and the lock file is byte-identical. Separate-session IMPL-EVAL and hosted
runtime acceptance remain deliberately pending.

## Completed

- Re-baselined the brief against current main.
- Proposed and locked the minimal product ceiling.
- Deferred generator-family marker consistency without crossing scope.
- Landed and pushed the test-only RED commit `1d045b04c`.
- Implemented the locator and integrated the returned half-open range into Flow-B rewriting.
- Passed focused test/check/lint/fmt gates and supplemental read-only quality/doctrine scans.

## In Progress

- None; stopped at implementation complete for separate evaluation.

## Next Steps

1. Run separate-session IMPL-EVAL against PR #1865.
2. Dispatch hosted `scaffold.runtime` proof under a runtime lease.
3. Update close-gated issue/PR acceptance evidence before merge.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Locate workers by unique create + register code anchors. | plan D1–D3 | Independent of comments and plugin order; malformed/ambiguous output throws. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-flow-b-fixture-plugin-marker--1863/` | new | Harness state and evidence. |
| `packages/cli/e2e/src/application/gates/scaffold/prepare-flow-b-fixture.ts` | changed | Uses the semantic half-open workers range. |
| `packages/cli/e2e/src/application/gates/scaffold/locate-workers-resource-block.ts` | new | Pure two-anchor locator and malformed-output predicate. |
| `packages/cli/e2e/tests/application/gates/locate-workers-resource-block_test.ts` | new | RED/GREEN accept/absence/malformed cases. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | Focused test 3/0; structured check/lint/fmt 3 files, zero findings. |
| Fitness | PASS/N/A | F-10/F-19 and supplemental quality/doctrine pass; JSR N/A. |
| Runtime | N/A locally | Owner forbids runtime commands without a lease. |
| Consumer | N/A | No published surface change. |

## Open Questions

- None.

## Drift and Debt

- Drift: source marker-family guard deferred at the locked product ceiling; read-only quality and
  doctrine tasks executed repo-wide while probing help and passed.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
