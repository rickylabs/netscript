# Context Pack: Aspire and CLI lifecycle (#1011, #1012)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1011-aspire-lifecycle--codex` |
| Branch | `fix/1011-aspire-lifecycle` |
| Current phase | `plan` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | service intent; overlay file absent |

## Current State

Research and contract-first design are locked against `origin/main` @ `ab0fa13fe`. No product code
has changed. The plan selects a distinct generated DB-operation AppHost path plus isolated startup,
extends the #1076 `AppHostInspector` with health-report evidence, and adds both missing live
acceptance cases to `scaffold.runtime`.

## Completed

- Required skills, doctrine, A6 profile, issues, predecessor PRs, and official Aspire CLI docs read.
- Lifecycle ownership and readiness contracts written.
- Commit slices and full gate set selected.

## In Progress

- S0 plan/design commit and draft PR opening.

## Next Steps

1. Launch separate local Qwen PLAN-EVAL and require `PASS`.
2. Implement S1, run focused gates, obtain opposite-family review, commit/push/comment.
3. Implement S2 with the same review/commit trail.
4. Run merge-readiness gates once, IMPL-EVAL, close-gate evidence, and ready transition.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Distinct DB AppHost path + isolation | `plan.md` L1 | Prevents resident identity retirement and ambiguous cleanup. |
| Inspector evidence rather than parallel mechanism | `plan.md` L3 | Reuses #1076 and its missing-binary contract. |
| Live acceptance gates in runtime suite | `plan.md` L5 | String generation is not runtime evidence. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-1011-aspire-lifecycle--codex/` | new | Harness plan-stage artifacts only. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | pending | Separate Qwen PLAN-EVAL not yet run. |
| Static | NOT_RUN | Implementation hard stop. |
| Fitness | NOT_RUN | Implementation hard stop. |
| Runtime | NOT_RUN | Implementation hard stop. |
| Consumer | NOT_RUN | Implementation hard stop. |

## Open Questions

- None requiring owner input before PLAN-EVAL.

## Drift and Debt

- Drift: missing service overlay file; runtime-provided Codex supervisor route.
- Debt: no new debt planned; existing CLI restructure debt must not deepen.

## Commits

- See the draft PR's commit list + per-slice PR comments.

