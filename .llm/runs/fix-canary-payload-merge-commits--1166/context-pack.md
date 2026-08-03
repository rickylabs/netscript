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

Implementation and all locked local gates are complete in the transient native-WSL slice worktree.
The reviewed working tree is intentionally uncommitted for the supervisor's opposite-family review
and sign-off commit. The milestone orchestrator's per-PR PLAN-EVAL waiver remains in force.

## Completed

- Read #1166 and all user-named skill/cadence contracts.
- Reproduced the defect in current source inspection and defined the negative synthetic DAG.
- Selected the focused internal-tool gate set; package/plugin doctrine and release-cut gates are N/A.

## In Progress

- Draft PR #1180 remains supervisor-owned with the required partial reference, milestone, and taxonomy.
- Opposite-family substantive review and supervisor sign-off commit are pending; this implementation
  lane did not self-certify, commit, push, or mutate PR metadata.

## Next Steps

1. Perform the required opposite-family code review and address any findings.
2. Make the supervisor sign-off commit, push/comment, and hand the PR to the milestone run's
   composed evaluator/pre-merge gate.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Merge-aware `previous..head` traversal | plan L1 | No workflow/publish changes. |
| Explicit payload evidence | plan L3/L4 | Zero commits succeeds as genuine-empty; suspicious empty fails. |
| Partial issue reference | user PR contract | `Refs #1166`; boxes 2–4 remain. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-canary-payload-merge-commits--1166/*` | existing | Harness bootstrap and slice evidence. |
| `.llm/tools/release/canary-label.ts` | modified | Merge-aware range traversal, explicit derivation evidence, fail-closed suspicious empty. |
| `.llm/tools/release/canary-label_test.ts` | modified | Real-git RED→GREEN fixture plus empty/failure regressions. |
| `.llm/runs/fix-canary-payload-merge-commits--1166/worklog.md` | modified | RED/GREEN and gate evidence. |
| `.llm/runs/fix-canary-payload-merge-commits--1166/context-pack.md` | modified | Supervisor review handoff state. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | Focused 15/15; adjacent 87/87; scoped check/lint/fmt clean. |
| Fitness | PASS | Real DAG proves baseline omission and merge-aware inclusion; empty/failure split covered. |
| Runtime | N/A | No release cut or runtime behavior. |
| Consumer | PASS | Existing GitHub association, note, unpublished refusal, and drift regressions green. |

## Open Questions

- None that block implementation; live-cut evidence remains explicitly deferred.

## Drift and Debt

- Drift: owner-opened Codex supervisor, failed local evaluator attempt, and subsequent milestone-run
  composed-evaluation waiver are recorded.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
