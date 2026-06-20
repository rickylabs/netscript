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
| 2026-06-20 | 1 | core-contract | Added `idempotencyKey` message fields and core idempotency port exports. |
| 2026-06-20 | 2 | core-resolver+tests | Added key resolver and precedence/hash tests. |
| 2026-06-20 | 3 | plugin-store | Added `KvWorkerIdempotencyStore` over shared KV abstraction and store tests. |
| 2026-06-20 | 4 | consumer-gate | Gated job/task effects before execution; composition wiring folded in to keep branch green. |
| 2026-06-20 | 5 | producer-propagation | Trigger runtime now stamps idempotency key onto `JobMessage` body. |
| 2026-06-20 | 7 | docs+surface | README delivery guarantee, module doc fix, JSR audit, publish dry-run, final gate run. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Use shared `getKv()` handle | Durable, shared across replicas, no hidden KV singleton. | `plan.md`, doctrine AP-11 |
| Port in core, store in plugin | Storage-agnostic public surface; plugin already owns `@netscript/kv`. | `plan.md`, F-3 |
| Required worker idempotency dependency | No silent in-memory or no-op production default. | `plan.md`, doctrine 08 |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Composition wiring folded into consumer commit | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-workers-core --root plugins/workers --root plugins/triggers --ext ts` | PASS | 237 files selected, 2 batches, 0 diagnostics. Wrapper passes `--unstable-kv` by default. |
| scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin-workers-core --root plugins/workers --root plugins/triggers --ext ts` | PASS | 237 files selected, 0 lint findings. |
| scoped fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin-workers-core --root plugins/workers --root plugins/triggers --ext ts` | PASS | 237 files selected, 0 formatting findings. |
| publish dry-run | `deno task publish:dry-run` in `packages/plugin-workers-core` | PASS | Dry run complete; existing `unanalyzable-dynamic-import` warning in `src/runtime/job-dispatcher.ts`. |
| JSR audit | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/plugin-workers-core --text` | PASS | Exit 0 after adding missing `@module`; warnings remain for existing cardinality and tool slow-types text while dry-run is OK. |
| doc lint | `deno doc --lint packages/plugin-workers-core/mod.ts` | PASS | Checked 1 file. |
| architecture composite | `deno task arch:check` | FAIL_EXISTING | Reports 58 failures across pre-existing repo debt outside this slice, including CLI/plugin abstract classes and Jest/Vitest globals. No new slice-specific failure identified. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| F-1 file-size | PASS | `wc -l`: new files 38, 43, 26, 209 LOC; changed dispatcher 297 LOC after helper split. | No new file exceeds 300/500 thresholds. |
| F-3 layering | PASS | Port in workers-core `src/ports`; resolver in `src/runtime`; concrete KV store in plugin `worker/`; composition root injects store. | No `@netscript/kv` dependency added to workers-core. |
| F-5/F-6 public surface/JSR | PASS | publish dry-run + JSR audit exit 0. | New exported port types are explicit type aliases/interfaces. |
| F-10 test shape | PASS | New tests: resolver 45 LOC, store 83 LOC, dispatcher 219 LOC. | Below 500 LOC. |
| F-13 runtime invariants | PASS | Targeted tests prove duplicate skip, release on failure, applied marker, TTL expiry. | Delivery guarantee documented in READMEs. |
| F-14 console-log | PASS_WITH_EXISTING_STYLE | `rg console\\.` shows existing worker logging style; new skip log uses same worker logging path plus span events. | No console usage added to workers-core. |
| F-15/F-17/F-18 barrels | PASS | `rg worker-idempotency|WorkerIdempotency` confirms exports only in root/subpath barrels. | New worker subpath export is intentional internal plugin surface. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| worker applied-keys behavior | PASS | `deno test --allow-all --unstable-kv ...` combined targeted run passed 35 tests. | Includes store, dispatcher, workers plugin, workers-core, triggers producer tests. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| workers-core consumers | PASS | workers-core tests passed 20 tests. | Resolver included. |
| workers plugin consumers | PASS | workers targeted/plugin tests passed 13 tests. | Worker constructor call sites compile with required idempotency. |
| triggers producer | PASS | trigger runtime processor tests passed 2 tests. | Message body carries idempotency key. |

## Handoff Notes

- Evaluator should inspect `plugins/workers/worker/job-dispatcher.ts`,
  `plugins/workers/worker/worker-idempotency-store.ts`,
  `packages/plugin-workers-core/src/ports/worker-idempotency-port.ts`, and
  `plugins/triggers/src/runtime/trigger-runtime-processor.ts` first.
- `deno task arch:check` remains red due to broad pre-existing repository debt; slice-scoped static,
  runtime, JSR, publish, and manual fitness evidence is green.
