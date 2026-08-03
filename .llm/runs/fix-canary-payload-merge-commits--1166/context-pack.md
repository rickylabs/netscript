# Context Pack: Merge-aware canary payload derivation (#1166)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-canary-payload-merge-commits--1166` |
| Branch | `fix/canary-payload-merge-commits` |
| Current phase | `plan` |
| Archetype | N/A — internal release tooling |
| Scope overlays | none |

## Current State

The branch equals `origin/main` at `fb75cf6f`. Research and Design are locked; no implementation
file has changed. The next hard stop is separate-session PLAN-EVAL.

## Completed

- Read #1166 and all user-named skill/cadence contracts.
- Reproduced the defect in current source inspection and defined the negative synthetic DAG.
- Selected the focused internal-tool gate set; package/plugin doctrine and release-cut gates are N/A.

## In Progress

- Commit run bootstrap, open draft PR, and dispatch PLAN-EVAL.

## Next Steps

1. Commit/push the plan artifacts and open the draft PR with `Refs #1166`.
2. Run separate local Qwen PLAN-EVAL; implementation is blocked until `PASS`.
3. Delegate slice 1, capture RED→GREEN, run gates, and perform opposite-family substantive review.
4. Sign off, push/comment, then run separate Qwen IMPL-EVAL.

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
| Static | pending | PLAN-EVAL not yet run. |
| Fitness | pending | Synthetic fixture and regression suite planned. |
| Runtime | N/A | No release cut or runtime behavior. |
| Consumer | pending | Existing GitHub surface regression tests. |

## Open Questions

- None that force implementation rework; live-cut evidence is explicitly deferred.

## Drift and Debt

- Drift: owner-opened Codex supervisor recorded as minor route fallback.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
