# Context Pack: preserve resident AppHost during database CLI operations

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1011-db-apphost-lifecycle--codex` |
| Branch | `fix/1011-db-apphost-lifecycle` |
| Current phase | `plan` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Current State

Branch is clean at `origin/main` baseline `3ab64720f`. Research identifies unconditional
`aspire stop --apphost <resident path>` in `executeDetached` as the concrete sufficient cause.
Plan/design are ready for separate-session PLAN-EVAL; no implementation has started.

## Completed

- Skills/doctrine/archetype selection and current verdict review.
- Issue and code/test re-baseline.
- Plan, risk register, Design checkpoint, and gate selection.

## In Progress

- Bootstrap commit, draft PR, and PLAN-EVAL dispatch.

## Next Steps

1. Commit/push run bootstrap and open the prescribed draft PR.
2. Obtain separate open-model PLAN-EVAL PASS.
3. Implement and validate the single ownership slice.
4. Perform supervisor review, push/comment, then separate IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Explicit pre-start ownership probe | plan D1 | Never stop a pre-existing AppHost. |
| Studio unchanged | plan D3 | Interactive path remains out of scope. |

## Files Changed

Only this run directory is new before PLAN-EVAL.

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | pending | separate evaluator not yet run |
| Static/Fitness/Runtime/Consumer | not run | implementation prohibited before PASS |

## Open Questions

- None that force implementation rework.

## Drift and Debt

- Drift: issue diagnosis is unproven; concrete explicit-stop cause is established.
- Debt: none created or deepened.

## Commits

- See the draft PR commit list + per-slice PR comments.
