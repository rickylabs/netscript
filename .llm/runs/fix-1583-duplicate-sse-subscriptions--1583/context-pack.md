# Context Pack: #1583 durable chat subscription ownership

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1583-duplicate-sse-subscriptions--1583` |
| Branch | `fix/1583-duplicate-sse-subscriptions` |
| Current phase | `evaluate` |
| Archetype | `4 - Public DSL / Builder`, with runtime gates |
| Scope overlays | `frontend` |

## Current State

Implementation and generator gates are complete. Ordinary renders of the pinned Preact hook do not recreate its `ChatClient` or bypass its idempotent subscribe guard. The original NetScript handle had no ownership guard and directly opened one upstream iterator per consumed `subscribe()` call. The new per-handle internal hub shares one physical retry pump, aborts it on teardown/last detach, and permits a fresh pump after retirement.

## Completed

- Harness activation and authority-chain reads.
- Issue/current-tree re-baseline.
- Preact hook, TanStack client, durable transport, and NetScript lifecycle trace.
- JSR/public-surface scan and PLAN-EVAL N/A decision.
- RED package run: 227 passed, three new tests failed exactly as designed.
- GREEN package run: 230 passed, 0 failed.
- Check/lint/fmt wrappers, explicit Fresh source quality scan, and repository quality gate exit 0.
- Required doc-lint command exits 0 and keeps `./ai` at zero, while exposing 44 unrelated package diagnostics in query/route/streams.
- Local substantive slice review complete; no public-surface, dependency, lockfile, or forbidden-subtree changes.

## In Progress

- Separate-session native Fable 5 medium IMPL-EVAL.

## Next Steps

1. Commit/push implementation and gate evidence; post the final `[PHASE: IMPL]` comment.
2. Run separate-session native Fable IMPL-EVAL and address at most two `FAIL_FIX` cycles.
3. Record the evaluator verdict without changing the PR out of draft.

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
| `packages/fresh/src/runtime/ai/create-chat-connection.ts` | changed | Routes logical subscription calls through one internal hub. |
| `packages/fresh/src/internal/chat-subscription-hub.ts` | new | Connection-scoped ownership, multicast, cancellation, retirement, and unchanged SR2 retry. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | scoped check/lint/fmt wrappers: zero findings |
| Fitness | PASS_WITH_BASELINE_WARNINGS | explicit Fresh scan zero findings; `quality:gate` exit 0; no deepened Fresh warning |
| Runtime | PASS | `deno task --cwd packages/fresh test`: 230 pass / 0 fail after RED 227/3 evidence |
| Docs/JSR | PARTIAL_BASELINE_RESIDUE | `./ai` zero; full package tool reports 44 unrelated diagnostics while exiting 0 |
| Consumer | PACKAGE_PASS / EXTERNAL_UNAVAILABLE | existing integration green; external EIS checkout unavailable |

## Open Questions

- None blocking implementation.

## Drift and Debt

- Drift: issue acceptance mismatch was repaired by adding the three brief-mandated boxes.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
