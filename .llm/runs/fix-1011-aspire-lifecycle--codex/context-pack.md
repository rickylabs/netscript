# Context Pack: Aspire and CLI lifecycle (#1011, #1012)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1011-aspire-lifecycle--codex` |
| Branch | `fix/1011-aspire-lifecycle` |
| Current phase | `implementation (Plan-Gate owner-waived)` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | service intent; overlay file absent |

## Current State

Research and contract-first design are locked against `origin/main` @ `ab0fa13fe`. Draft PR #1088
publishes the plan. S1 now routes detached DB operations through a distinct generated isolated
AppHost and adds a live resident-identity gate. The canonical separate PLAN-EVAL route remains
credential-blocked, but the owner explicitly waived the gate as the opposite-family Claude reviewer.

## Completed

- Required skills, doctrine, A6 profile, issues, predecessor PRs, and official Aspire CLI docs read.
- Lifecycle ownership and readiness contracts written.
- Commit slices and full gate set selected.
- S0 plan commit `5601b8fa0` pushed; draft PR #1088 opened with research and plan comments.
- S1 red proof, implementation, full CLI package/static/fitness gates, and opposite-family review.

## In Progress

- S1 commit/push/comment, followed by S2 readiness implementation.

## Next Steps

1. Commit/push/comment the reviewed S1 slice.
2. Implement S2 with the same evidence and commit trail.
3. Run merge-readiness gates once, handle IMPL-EVAL under the recorded route constraint, reconcile
   close-gate evidence, and transition only if every criterion is proven.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Distinct DB AppHost path + isolation | `plan.md` L1 | Prevents resident identity retirement and ambiguous cleanup. |
| Inspector evidence rather than parallel mechanism | `plan.md` L3 | Reuses #1076 and its missing-binary contract. |
| Live acceptance gates in runtime suite | `plan.md` L5 | String generation is not runtime evidence. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-1011-aspire-lifecycle--codex/` | modified | Waiver, S1 evidence, gates, and review. |
| `packages/cli/src/kernel/adapters/database/` | modified | Detached DB lifecycle uses a distinct isolated AppHost identity. |
| `packages/cli/src/kernel/templates/aspire/helpers/` | modified | Generates the DB-operation AppHost entry. |
| `packages/cli/e2e/src/` | modified | Live resident PID/backchannel preservation gate. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | WAIVED | Canonical launch blocked; owner supplied opposite-family review and explicit waiver. |
| Static | PASS (S1) | CLI package 554/0; scoped check/lint/fmt zero findings. |
| Fitness | PASS (S1) | `quality:gate`; pre-existing warnings only. |
| Runtime | NOT_RUN | Once-only `scaffold.runtime` deferred to merge-readiness. |
| Consumer | NOT_RUN | Implementation hard stop. |

## Open Questions

- None before S1 implementation.

## Drift and Debt

- Drift: missing service overlay file; runtime-provided Codex supervisor route; unauthenticated
  canonical formal-evaluator profile.
- Debt: no new debt planned; existing CLI restructure debt must not deepen.

## Commits

- See the draft PR's commit list + per-slice PR comments.
