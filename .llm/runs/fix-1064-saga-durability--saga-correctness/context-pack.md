# Context Pack: saga engine correctness

## Run Metadata

| Field          | Value                                        |
| -------------- | -------------------------------------------- |
| Run ID         | `fix-1064-saga-durability--saga-correctness` |
| Branch         | `fix/1064-saga-durability`                   |
| Current phase  | `plan-eval`                                  |
| Archetype      | `2`, `3`, `5`                                |
| Scope overlays | `docs`                                       |

## Current State

Production source remains unchanged. All three defects have pre-fix empirical failures and the
formal plan is committed, but the required separate-session PLAN-EVAL is blocked by missing local
OpenRouter credentials.

## Completed

- Required skills/doctrine/harness profiles read.
- Full issue and PR context re-baselined.
- Owned Redis/Garnet diagnosis completed without touching foreign resources.
- Public-surface scan and Design checkpoint completed.

## In Progress

- Obtain supervisor direction or restore the canonical local evaluator credential.

## Next Steps

1. Restore the canonical local Qwen evaluator route and run PLAN-EVAL, or obtain a written owner
   waiver.
2. Implement, gate, commit, push, and comment #1064.
3. Repeat independently for #1065 and #1066.
4. Run aggregate gates and IMPL-EVAL; drive draft PR to ready-for-merge.

## Key Decisions

| Decision                                               | Source         | Notes                                                         |
| ------------------------------------------------------ | -------------- | ------------------------------------------------------------- |
| Real CAS violation is the #1064 implementation target  | research       | Original hang not reproduced and will not be falsely claimed. |
| No new public exports                                  | plan/jsr scan  | Drift trigger if implementation contradicts this.             |
| Effect and instance identity resolution are exhaustive | issue/doctrine | No silent fallthrough or message-id identity.                 |

## Files Changed

| Path                                                     | Status | Notes                           |
| -------------------------------------------------------- | ------ | ------------------------------- |
| `.llm/runs/fix-1064-saga-durability--saga-correctness/*` | new    | Harness planning/evidence only. |

## Gates

| Gate family | Current status            | Evidence                                     |
| ----------- | ------------------------- | -------------------------------------------- |
| Static      | planning PASS             | `deno doc` surface scan                      |
| Fitness     | blocked                   | local evaluator `auth_required`              |
| Runtime     | pre-fix failures captured | real Redis, compensation, correlation probes |
| Consumer    | pending                   | docs/tests after implementation              |

## Open Questions

- Canonical local PLAN-EVAL credential is absent; cloud OpenHands is not permitted for a local run.

## Drift and Debt

- Drift: hang non-reproduction and canonical docs path recorded.
- Debt: none proposed; existing KV adapter audit remains open.

## Commits

- See the draft PR's commit list + per-slice PR comments.
