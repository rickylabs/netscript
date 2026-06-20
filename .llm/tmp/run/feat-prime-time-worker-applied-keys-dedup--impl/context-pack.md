# Context Pack: worker-applied-keys-dedup

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `feat-prime-time-worker-applied-keys-dedup--impl` |
| Branch | `feat/prime-time/worker-applied-keys-dedup` |
| Current phase | `implement` |
| Archetype | `ARCHETYPE-3 - Runtime / Behavior` |
| Scope overlays | `SCOPE-service` |

## Current State

Implementation is complete for worker consumer-side applied-keys dedup. The branch carries the core
message/port contract, key resolver, KV store, dispatcher gates, trigger producer propagation,
composition wiring, tests, docs, and gate evidence.

## Completed

- Read harness/doctrine/tooling/PR instructions and the approved slice plan artifacts.
- Confirmed branch `feat/prime-time/worker-applied-keys-dedup` tracks
  `origin/feat/prime-time/worker-applied-keys-dedup`.
- Created implementation run artifacts.
- Implemented all approved contracts and tests for this slice.
- Ran scoped static gates, targeted runtime tests, JSR audit, doc lint, and publish dry-run.

## In Progress

- Final docs/evidence commit and PR completion comment.

## Next Steps

1. Push final docs/evidence commit.
2. Comment PR #79 ready for IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Worker idempotency is required | `plan.md` | Production must not silently fall back to no-op/in-memory. |
| Store uses shared `getKv()` | `plan.md` | Same durable KV handle as worker runtime state. |
| Queue remains read-only | `research.md` | Consumer-side applied-key dedup is the defect site. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/tmp/run/feat-prime-time-worker-applied-keys-dedup--impl/*` | new | Harness implementation artifacts. |
| `packages/plugin-workers-core/src/ports/worker-idempotency-port.ts` | new | Storage-agnostic worker idempotency port. |
| `packages/plugin-workers-core/src/runtime/worker-idempotency.ts` | new | Key resolver and hash fallback. |
| `plugins/workers/worker/worker-idempotency-store.ts` | new | KV-backed applied-keys store. |
| `plugins/workers/worker/job-dispatcher.ts` | changed | Claim/skip/mark/release gate for job and task effects. |
| `plugins/triggers/src/runtime/trigger-runtime-processor.ts` | changed | Stamps idempotency key on `JobMessage`. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | PASS | Scoped check/lint/fmt green for workers-core, workers, triggers. |
| Fitness | PASS_WITH_EXISTING_ARCH_DEBT | JSR audit/doc lint/publish green; repo-wide `arch:check` fails on pre-existing unrelated debt. |
| Runtime | PASS | Combined targeted run passed 35 tests. |
| Consumer | PASS | workers-core, workers plugin, and triggers tests passed. |

## Open Questions

- None.

## Drift and Debt

- Drift: minor commit-order drift, composition wiring folded into consumer commit to preserve a
  compiling branch after each push.
- Debt: no new debt accepted.

## Commits
- 7f1d011: feat(workers): add worker idempotency contract
- 1a959dd: test(workers): cover worker idempotency key resolution
- d68ae7c: feat(workers): add kv worker idempotency store
- dc37d5b: feat(workers): gate worker effects by idempotency claims
- 951c27b: feat(triggers): propagate worker idempotency keys
