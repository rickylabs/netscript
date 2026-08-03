# Context Pack: Merge-aware canary payload derivation (#1166)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-canary-payload-merge-commits--1166` |
| Branch | `fix/canary-payload-merge-commits` |
| Current phase | `plan-eval` |
| Archetype | N/A — internal release tooling |
| Scope overlays | none |

## Current State

The branch contains only the harness bootstrap commit over `origin/main`; no implementation file has
changed. Research and Design are locked. The canonical local Qwen evaluator launch is blocked by an
absent OpenRouter credential, and the Plan-Gate hard stop remains in force.

## Completed

- Read #1166 and all user-named skill/cadence contracts.
- Reproduced the defect in current source inspection and defined the negative synthetic DAG.
- Selected the focused internal-tool gate set; package/plugin doctrine and release-cut gates are N/A.

## In Progress

- Draft PR #1180 is open with the required partial reference, milestone, and taxonomy.
- PLAN-EVAL launch is blocked before a model turn (`auth_required`).

## Next Steps

1. Restore `OPENROUTER_API_KEY` to the approved child environment and run separate local Qwen
   PLAN-EVAL, or obtain an explicit written owner waiver.
2. Only after PASS/waiver, delegate slice 1, capture RED→GREEN, run gates, and perform
   opposite-family substantive review.
3. Sign off, push/comment, then run a distinct Qwen IMPL-EVAL session.

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
| Static | blocked | PLAN-EVAL route returned `auth_required`; no evaluator turn ran. |
| Fitness | pending | Synthetic fixture and regression suite planned. |
| Runtime | N/A | No release cut or runtime behavior. |
| Consumer | pending | Existing GitHub surface regression tests. |

## Open Questions

- Blocking: restore the local evaluator credential or obtain an explicit written Plan-Gate waiver.

## Drift and Debt

- Drift: owner-opened Codex supervisor recorded as minor route fallback; local evaluator credential
  absence recorded as significant because it blocks the hard Plan-Gate.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
