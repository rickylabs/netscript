# Context Pack: Aspire and CLI lifecycle (#1011, #1012)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1011-aspire-lifecycle--codex` |
| Branch | `fix/1011-aspire-lifecycle` |
| Current phase | `plan-eval (blocked)` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | service intent; overlay file absent |

## Current State

Research and contract-first design are locked against `origin/main` @ `ab0fa13fe`. Draft PR #1088
publishes the plan; no product code has changed. The canonical separate PLAN-EVAL route is blocked
because its isolated Claude/OpenRouter profile is not logged in, so it produced no verdict artifact.

## Completed

- Required skills, doctrine, A6 profile, issues, predecessor PRs, and official Aspire CLI docs read.
- Lifecycle ownership and readiness contracts written.
- Commit slices and full gate set selected.
- S0 plan commit `5601b8fa0` pushed; draft PR #1088 opened with research and plan comments.

## In Progress

- Restore the formal-evaluator credential or obtain an explicit owner-authorized fallback/waiver.

## Next Steps

1. Authenticate the isolated Claude/OpenRouter evaluator profile and require a separate Qwen
   PLAN-EVAL `PASS`, or record an explicit owner-authorized fallback/waiver.
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
| Plan | BLOCKED | Canonical Qwen launch returned `Not logged in · Please run /login`; artifact absent. |
| Static | NOT_RUN | Implementation hard stop. |
| Fitness | NOT_RUN | Implementation hard stop. |
| Runtime | NOT_RUN | Implementation hard stop. |
| Consumer | NOT_RUN | Implementation hard stop. |

## Open Questions

- Will the owner restore the canonical evaluator profile authentication, or explicitly authorize a
  documented fallback/waiver for this PLAN-EVAL?

## Drift and Debt

- Drift: missing service overlay file; runtime-provided Codex supervisor route; unauthenticated
  canonical formal-evaluator profile.
- Debt: no new debt planned; existing CLI restructure debt must not deepen.

## Commits

- See the draft PR's commit list + per-slice PR comments.
