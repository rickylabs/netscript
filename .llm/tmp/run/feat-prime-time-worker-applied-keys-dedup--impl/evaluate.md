# IMPL-EVAL — worker-applied-keys-dedup

**Verdict: PASS**

## Gate evidence

| Gate | Command | Exit | Result |
|---|---|---|---|
| deno check (unstable-kv, scoped) | `run-deno-check.ts --root packages/plugin-workers-core --root plugins/workers --root plugins/triggers --ext ts` | 0 | 237 files, 0 occurrences |
| deno lint (scoped) | `run-deno-lint.ts --root packages/plugin-workers-core --root plugins/workers --root plugins/triggers --ext ts` | 0 | 237 files, 0 occurrences |
| deno fmt (scoped) | `run-deno-fmt.ts --root packages/plugin-workers-core --root plugins/workers --root plugins/triggers --ext ts` | 0 | 237 files, 0 findings |
| deno test (workers-core) | `deno test --unstable-kv packages/plugin-workers-core/` | 0 | 20 passed, 0 failed |
| deno test (workers plugin) | `deno test --unstable-kv plugins/workers/` | 0 | 12 passed, 0 failed |
| deno test (triggers) | `deno test --unstable-kv plugins/triggers/` | 0 | 8 passed, 0 failed (12 E2E ignored correctly) |
| deno test (job-dispatcher targeted) | `deno test plugins/workers/worker/job-dispatcher_test.ts` | 0 | 3 passed (redelivery-skip, failure-release, task-applied) |
| publish:dry-run (plugin-workers-core) | `deno task publish:dry-run` | 0 | Success (one pre-existing unanalyzable-dynamic-import warning, non-blocking) |
| arch:check | `deno task arch:check` | 0 | Only pre-existing F-14/AP-19/AP-23 findings, none slice-related |

## Contracts verified

- `runtime-types.ts`: `idempotencyKey?: string` on both `JobMessage` and `TaskMessage`.
- `worker-idempotency-port.ts`: `WorkerIdempotencyPort` + `WorkerIdempotencyInput` + `WorkerIdempotencyClaim` + `WorkerIdempotencySource` (matches plan spec).
- `ports/mod.ts` re-export + `public/mod.ts` re-export via `public-schema.ts` named exports.
- `worker-idempotency-store.ts`: concrete `KvWorkerIdempotencyStore` over `@netscript/kv` (getKv-shared).
- `worker-options.ts`: `WorkerDispatchContext.idempotency` required; `WorkerOptions.idempotency` required.
- `trigger-runtime-processor_test.ts`: producer stamps `idempotencyKey` onto `JobMessage` body.
- `router-context.ts`: `WorkersServiceRuntime` exposes `idempotency: KvWorkerIdempotencyStore`.

## Test plan vs delivery

- Unit resolver precedence (caller > message-id > payload-hash): ✓ `worker-idempotency_test.ts` (3 tests).
- Unit store (first-claim, duplicate, release, markApplied, TTL, non-durable-backend throw): ✓ `worker-idempotency-store_test.ts` (5 tests).
- Integration dispatcher redelivery + failure-path + task gate: ✓ `job-dispatcher_test.ts` (3 tests).
- Producer propagation: ✓ `trigger-runtime-processor_test.ts` (stamps idempotencyKey onto JobMessage).
- publish:dry-run surface: ✓ passes.

## Production bar checks

- **Durable persistence (NOT in-memory):** KV-backed, shared `getKv()` handle, TTL-bounded (active `expireIn`, applied `expireIn`). ✓
- **Idempotency under retry:** claim → markApplied / release flow; TTL releases crashed claims; no permanent wedge. ✓
- **No in-memory-only set:** confirmed — port in core, KV impl in plugin; constructor throws if backend cannot guarantee durability. ✓
- **Observability:** span event `worker.job.idempotent_skip` / `worker.task.idempotent_skip` + dedup metric attribute. ✓
- **Structured already-applied (skip, not failure):** confirmed in dispatcher and test output. ✓
- **Graceful shutdown:** TTL bounds guarantee no dangling active claims. ✓

## Lock hygiene

`deno.lock` not modified during the run. No stray files generated.

## Slice-specific note (durable + idempotent under retry)

Verified: `KvWorkerIdempotencyStore` persists to KV (`['workers','idempotency','active'|'applied', key]`), uses atomic when available with sequential-has+set fallback, and rejects non-durable backends. The retry path is exercised by `KvWorkerIdempotencyStore release allows a failed delivery to retry` and `processWorkerJob releases a failed claim so redelivery can re-run`.

## Gaps

None.
