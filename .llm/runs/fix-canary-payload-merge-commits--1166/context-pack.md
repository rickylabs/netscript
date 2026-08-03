# Context Pack: Merge-aware canary payload derivation (#1166)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-canary-payload-merge-commits--1166` |
| Branch | `fix/canary-payload-merge-commits` |
| Current phase | `implement` |
| Archetype | N/A — internal release tooling |
| Scope overlays | none |

## Current State

The branch contains only harness commits over `origin/main`; no implementation file has changed.
Research and Design are locked. The milestone orchestrator approved the plan and issued a written
waiver of the per-PR local PLAN-EVAL hard stop under `milestone-run.md`'s composed evaluator protocol.

## Completed

- Read #1166 and all user-named skill/cadence contracts.
- Reproduced the defect in current source inspection and defined the negative synthetic DAG.
- Selected the focused internal-tool gate set; package/plugin doctrine and release-cut gates are N/A.

## In Progress

- Draft PR #1180 is open with the required partial reference, milestone, and taxonomy.
- PLAN-EVAL is recorded as composed/waived for this delegated milestone PR; the earlier local route
  failure remains visible as a did-not-run, not a verdict.

## Next Steps

1. Delegate slice 1, capture RED→GREEN, and run the focused/adjacent/scoped gates.
2. Perform the required opposite-family code review, fix findings, and make the supervisor sign-off
   commit.
3. Push/comment and hand the PR to the milestone run's composed evaluator/pre-merge gate.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Merge-aware `previous..head` traversal | plan L1 | No workflow/publish changes. |
| Explicit payload evidence | plan L3/L4 | Zero commits succeeds as genuine-empty; suspicious empty fails. |
| Partial issue reference | user PR contract | `Refs #1166`; boxes 2–4 remain. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-canary-payload-merge-commits--1166/*` | new | Harness bootstrap only. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | authorized | PLAN-EVAL composed per `milestone-run.md`; written orchestrator waiver recorded. |
| Fitness | pending | Synthetic fixture and regression suite planned. |
| Runtime | N/A | No release cut or runtime behavior. |
| Consumer | pending | Existing GitHub surface regression tests. |

## Open Questions

- None that block implementation; live-cut evidence remains explicitly deferred.

## Drift and Debt

- Drift: owner-opened Codex supervisor, failed local evaluator attempt, and subsequent milestone-run
  composed-evaluation waiver are recorded.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
