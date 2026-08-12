# Context Pack: #1583 durable chat subscription ownership

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1583-duplicate-sse-subscriptions--1583` |
| Branch | `fix/1583-duplicate-sse-subscriptions` |
| Current phase | `correction cycle 2 / implement` |
| Archetype | `4 - Public DSL / Builder`, with runtime gates |
| Scope overlays | `frontend` |

## Current State

The implementation is accepted by fallback IMPL-EVAL. Its one blocking `FAIL_FIX` finding was missing in-tree coverage of concurrent value/error fan-out. Correction cycle 2 adds only an emitting probe, two multicast tests, and explicit suffix-only late-join documentation; production behavior is unchanged.

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
- Fallback IMPL-EVAL verified mechanism, retirement serialization, SR2 equivalence, physical abort proof, and no surface growth; verdict `FAIL_FIX` solely for absent fan-out delivery tests.
- Correction RED proof: both new tests fail without hub wiring at physical count 2 versus 1; full temporary run 227 pass / 5 expected fail.
- Correction GREEN proof: scoped check/lint/fmt zero findings; package task 232 pass / 0 fail.

## In Progress

- Correction cycle 2 final gates, commit, explicit-refspec push, and `[PHASE: IMPL]` comment.

## Next Steps

1. Run the four correction gates at the restored accepted implementation.
2. Commit/push correction evidence and post `[PHASE: IMPL]`.
3. Leave evaluation to the orchestrator's automatic label-driven lifecycle; do not launch or trigger one locally.

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
| `packages/fresh/src/runtime/ai/create-chat-connection_test.ts` | cycle-2 changed | Emitting probe plus identical values/terminal and shared-error fan-out tests. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | final correction scoped check/lint/fmt wrappers: zero findings |
| Fitness | PASS_WITH_BASELINE_WARNINGS | explicit Fresh scan zero findings; `quality:gate` exit 0; no deepened Fresh warning |
| Runtime | PASS | correction GREEN 232/0; correction no-hub RED 227/5, with both new tests failing 2-versus-1 physical count |
| Docs/JSR | PARTIAL_BASELINE_RESIDUE | `./ai` zero; full package tool reports 44 unrelated diagnostics while exiting 0 |
| Consumer | PACKAGE_PASS / EXTERNAL_UNAVAILABLE | existing integration green; external EIS checkout unavailable |

## Open Questions

- None blocking implementation.

## Drift and Debt

- Drift: issue acceptance mismatch was repaired by adding the three brief-mandated boxes.
- Documented semantic drift: a subscriber joining an active pump receives only a suffix, while a subscriber after retirement opens a fresh upstream that may replay from `initialOffset`. No replay buffer was added.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
