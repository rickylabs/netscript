# Context Pack: #1583 durable chat subscription ownership

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1583-duplicate-sse-subscriptions--1583` |
| Branch | `fix/1583-duplicate-sse-subscriptions` |
| Current phase | `plan` |
| Archetype | `4 - Public DSL / Builder`, with runtime gates |
| Scope overlays | `frontend` |

## Current State

Research is complete and the plan is locked. Ordinary renders of the pinned Preact hook do not recreate its `ChatClient` or bypass its idempotent subscribe guard. The NetScript handle itself has no ownership guard and directly opens one upstream iterator per consumed `subscribe()` call. No implementation file has changed.

## Completed

- Harness activation and authority-chain reads.
- Issue/current-tree re-baseline.
- Preact hook, TanStack client, durable transport, and NetScript lifecycle trace.
- JSR/public-surface scan and PLAN-EVAL N/A decision.

## In Progress

- Slice 1 commit and draft PR bootstrap.

## Next Steps

1. Commit/push the research and plan artifacts; open the draft PR.
2. Add and run RED tests.
3. Implement the single-upstream pump, run required gates, and update evidence.
4. Run separate-session native Fable IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Connection-handle multicast | `plan.md` D1 | One physical upstream; logical subscribers share future chunks. |
| No surface growth | `plan.md` D2 | Existing signatures remain unchanged. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-1583-duplicate-sse-subscriptions--1583/*` | new | Harness evidence only. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | NOT_RUN | implementation not started |
| Fitness | planned | `plan.md` |
| Runtime | planned | three RED-first tests |
| Consumer | planned | package integration suite; external EIS unavailable |

## Open Questions

- GitHub issue acceptance checklist must be reconciled before a non-empty `box-index` map can be authored.

## Drift and Debt

- Drift: issue body lacks the acceptance checkboxes assumed by the brief.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.

