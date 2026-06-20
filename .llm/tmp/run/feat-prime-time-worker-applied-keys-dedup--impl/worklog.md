# Worklog: worker-applied-keys-dedup

## Run Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `feat-prime-time-worker-applied-keys-dedup--impl` |
| Branch         | `feat/prime-time/worker-applied-keys-dedup` |
| Archetype      | `ARCHETYPE-3 - Runtime / Behavior` |
| Scope overlays | `SCOPE-service` |

## Design

### Public Surface

- `JobMessage.idempotencyKey?: string` and `TaskMessage.idempotencyKey?: string`.
- `WorkerIdempotencyPort`, `WorkerIdempotencyInput`, `WorkerIdempotencyClaim`, and
  `WorkerIdempotencySource` exported from `@netscript/plugin-workers-core`.
- `KvWorkerIdempotencyStore` internal to `plugins/workers/worker`.

### Domain Vocabulary

- `WorkerIdempotencySource` — identifies whether the applied key came from a caller key, queue
  message id, or payload hash.
- `WorkerIdempotencyInput` — one worker delivery to resolve and claim.
- `WorkerIdempotencyClaim` — result of attempting to reserve the applied key.
- `already-applied` — structured duplicate-delivery skip, not a worker failure.

### Ports

- `WorkerIdempotencyPort` — durable applied-keys store consumed by the worker dispatcher before
  effects run.
- `WorkerIdempotencyKvStore` — plugin-local minimal KV shape backed by the shared `getKv()` handle.

### Constants

- Worker idempotency sources: `caller`, `message-id`, `payload-hash`.
- Worker idempotency concepts: `job`, `task`.
- KV key spaces: `workers/idempotency/active`, `workers/idempotency/applied`.
- Default TTLs: active claim `15m`, applied marker `24h`; env names
  `NETSCRIPT_WORKERS_IDEMPOTENCY_ACTIVE_TTL_MS` and
  `NETSCRIPT_WORKERS_IDEMPOTENCY_APPLIED_TTL_MS`.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | core-contract | `run-deno-check/lint/fmt --root packages/plugin-workers-core --ext ts --unstable-kv` | `runtime-types.ts`, `ports/worker-idempotency-port.ts`, `ports/mod.ts`, `public/mod.ts`, `runtime/mod.ts` |
| 2 | core-resolver+tests | `deno test packages/plugin-workers-core` targeted | resolver and `tests/runtime/worker-idempotency_test.ts` |
| 3 | plugin-store | targeted workers idempotency-store tests | `plugins/workers/worker/worker-idempotency-store.ts`, store tests |
| 4 | consumer-gate | targeted dispatcher/listener tests | `job-dispatcher.ts`, `worker-options.ts`, `queue-consumer.ts`, `worker.ts`, tests |
| 5 | producer-propagation | targeted triggers producer test | `trigger-runtime-processor.ts`, triggers test |
| 6 | composition-wiring | `deno check --unstable-kv` on workers plus runtime test | `service-runtime.ts`, `router-context.ts`, `bin/runtime.ts`, tests |
| 7 | docs+surface | publish dry-run, JSR audit, docs/readme checks | workers and workers-core README files |

### Deferred Scope

- `packages/queue` adapter changes — queue/DLQ uniformity belongs to `rbp-dlq-contract`; this slice
  uses the existing message id and delivery count consume contract.
- Scaffold/runtime E2E — no scaffold output, generated registry, or DB wiring changes.
- Executor decomposition debt — existing architecture debt remains out of scope.

### Contributor Path

To extend worker delivery semantics, start at
`packages/plugin-workers-core/src/ports/worker-idempotency-port.ts` for the contract, then
`plugins/workers/worker/worker-idempotency-store.ts` for storage behavior, and finally
`plugins/workers/worker/job-dispatcher.ts` for where the claim gates effects.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-06-20 | bootstrap | artifacts | Created implementation run artifacts after PLAN-EVAL-passed brief review. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Use shared `getKv()` handle | Durable, shared across replicas, no hidden KV singleton. | `plan.md`, doctrine AP-11 |
| Port in core, store in plugin | Storage-agnostic public surface; plugin already owns `@netscript/kv`. | `plan.md`, F-3 |
| Required worker idempotency dependency | No silent in-memory or no-op production default. | `plan.md`, doctrine 08 |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| none | N/A | N/A |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| pending | pending | NOT_RUN | Implementation not started. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| pending | NOT_RUN | pending | Implementation not started. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| pending | NOT_RUN | pending | Implementation not started. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| pending | NOT_RUN | pending | Implementation not started. |

## Handoff Notes

- Evaluator should inspect the worker dispatcher idempotency gate, KV store semantics, trigger
  producer propagation, and final gate evidence first.
