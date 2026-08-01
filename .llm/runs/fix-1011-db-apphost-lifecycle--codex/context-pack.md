# Context Pack: preserve resident AppHost during database CLI operations

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1011-db-apphost-lifecycle--codex` |
| Branch | `fix/1011-db-apphost-lifecycle` |
| Current phase | `plan-eval` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Current State

Branch is clean at `origin/main` baseline `3ab64720f`. Research identifies unconditional
`aspire stop --apphost <resident path>` in `executeDetached` as the concrete sufficient cause.
Plan/design are ready for separate-session PLAN-EVAL; no implementation has started. The canonical
local Qwen evaluator launch reached the correct model/session but failed authentication before it
could read the plan.

## Completed

- Skills/doctrine/archetype selection and current verdict review.
- Issue and code/test re-baseline.
- Plan, risk register, Design checkpoint, and gate selection.

## In Progress

- Restoring local `claude-openrouter` evaluator authentication, then retrying PLAN-EVAL.

## Next Steps

1. Make a usable OpenRouter credential available to the local evaluator profile.
2. Retry separate open-model PLAN-EVAL and obtain PASS.
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
| Plan | blocked before verdict | Qwen session `aa3c6460-8788-4e0d-b4c3-9b04fc11eb17`: `Not logged in` |
| Static/Fitness/Runtime/Consumer | not run | implementation prohibited before PASS |

## Open Questions

- Evaluator credential must be restored before the harness hard stop can clear.

## Drift and Debt

- Drift: issue diagnosis is unproven; concrete explicit-stop cause is established. PLAN-EVAL local
  transport is currently credential-blocked.
- Debt: none created or deepened.

## Commits

- See the draft PR commit list + per-slice PR comments.
