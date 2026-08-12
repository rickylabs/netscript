# Context Pack: #1583 durable chat subscription ownership

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1583-duplicate-sse-subscriptions--1583` |
| Branch | `fix/1583-duplicate-sse-subscriptions` |
| Current phase | `implement` |
| Archetype | `4 - Public DSL / Builder`, with runtime gates |
| Scope overlays | `frontend` |

## Current State

Research and RED testing are complete. Ordinary renders of the pinned Preact hook do not recreate its `ChatClient` or bypass its idempotent subscribe guard. The NetScript handle itself has no ownership guard and directly opens one upstream iterator per consumed `subscribe()` call. All three new tests fail before production change with physical call counts 2/2/3 instead of 1/1/2.

## Completed

- Harness activation and authority-chain reads.
- Issue/current-tree re-baseline.
- Preact hook, TanStack client, durable transport, and NetScript lifecycle trace.
- JSR/public-surface scan and PLAN-EVAL N/A decision.
- RED package run: 227 passed, three new tests failed exactly as designed.

## In Progress

- Slice 2 RED test commit and PR evidence.

## Next Steps

1. Commit/push RED tests and update the draft PR.
2. Implement the single-upstream pump, run required gates, and update evidence.
3. Run separate-session native Fable IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Connection-handle multicast | `plan.md` D1 | One physical upstream; logical subscribers share future chunks. |
| No surface growth | `plan.md` D2 | Existing signatures remain unchanged. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-1583-duplicate-sse-subscriptions--1583/*` | new | Harness evidence only. |
| `packages/fresh/src/runtime/ai/create-chat-connection_test.ts` | changed | Three RED-first physical-subscription lifecycle tests. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | NOT_RUN | implementation not started |
| Fitness | planned | `plan.md` |
| Runtime | RED proven | `deno task --cwd packages/fresh test`: 227 pass / 3 expected fail |
| Consumer | planned | package integration suite; external EIS unavailable |

## Open Questions

- None blocking implementation.

## Drift and Debt

- Drift: issue acceptance mismatch was repaired by adding the three brief-mandated boxes.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
