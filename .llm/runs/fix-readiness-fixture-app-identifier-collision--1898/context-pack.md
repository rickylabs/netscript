# Context Pack: fixture app identifier collision

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-readiness-fixture-app-identifier-collision--1898` |
| Branch | `fix/readiness-fixture-app-identifier-collision` |
| Current phase | `implement` |
| Archetype | `6 — CLI / Tooling` (CLI-owned E2E harness) |
| Scope overlays | `none` |

## Current State

Baseline `7d18ef104` and issue #1898 are verified. Research, plan, and design are locked. PLAN-EVAL
is N/A for this fully specified mechanical fix. RED is reproduced with three duplicate bindings.

## Completed

- Skill, harness, doctrine, issue, source, test, and debt intake.
- Selected a fixture-specific block-local identifier namespace.
- Designed a real-generator semantic regression plus emitted-module compile assertion.
- RED wrapper exit 1: passed 4, failed 1; duplicates `app_0_workdir`, `app_0`, `app_0_otel`.

## In Progress

- Slice 1 RED commit and draft PR opening.

## Next Steps

1. Commit/push RED and open the required draft PR.
2. Implement namespace rewrite, run focused gates, and commit/push GREEN.
3. Obtain separate-session IMPL-EVAL without marking the PR ready.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Rewrite isolated fixture block bindings | plan D1/D2 | Covers `_workdir`, `_otel`, and future suffixes at identifier boundaries. |
| Compile actual injected module | plan D3 | Uses temporary typed local stubs; no runtime lease. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| run directory | new | Harness state and staged owner brief/thread identity. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | pending | Required wrappers not yet run. |
| Fitness | manual N/A | Nested E2E harness; no published/package architecture change. |
| Runtime | prohibited here | Full E2E requires supervisor lane. |
| Consumer | pending | Real generated-module compile test. |

## Open Questions

- None.

## Drift and Debt

- Drift: none.
- Debt: existing `scaffold-runtime-a8-f16-1333` not touched or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
