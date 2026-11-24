# Worklog: Local Deno KV queue listener concurrency and transient persistence recovery (#2651)

## Run Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `fix-kv-queue-listen-concurrency-2651--impl` |
| Branch         | `fix/kv-queue-listen-concurrency-2651` |
| Issue          | #2651 — implementation PR; body carries `Closes #2651` |
| Classification | implementation |
| Archetype      | `packages/queue` = Archetype 2 (Integration, `Keep` verdict); `plugins/workers` = Archetype 5 (Plugin Package, `Refactor` verdict — no debt deepening) |
| Scope overlays | `SCOPE-service.md` (worker settlement persistence wiring in `plugins/workers`) |
| Milestone      | `0.0.10` |

## Coordinator bootstrap (2026-11-24)

Baseline `main` = `87965d800b7d61312e8612c82bdb0cb98bdf5b29`; `v0.0.10-canary.4` = `7c51c7efb64cbf65c567232245c13fea69f45fe4`.

### Owner model authorization

> Owner explicitly authorized T3 dispatch, with rationale for Neon: it first found or co-found these gaps. Exact public builder model settings: […] providerInstanceId antigravity, model gemini-4-neon, options {thought_level:'xhigh'} for N2 #2651, […] N5 #2653, #2146 and #451. […] If Antigravity is out of quota or unavailable, report before falling back. No silent switches.
>
> […] For Neon builds Codex Sol independent review is authorized, […]

Quoted verbatim from the owner's batch directive. `[…]` marks elided text that concerns lanes or parties outside this run's public record; nothing that governs this lane is elided.

### Route record

| Role | Requested identity | Transport | Family |
| ---- | ------------------ | --------- | ------ |
| Builder | providerInstanceId `antigravity`, model `gemini-4-neon`, options `{thought_level: 'xhigh'}` | T3 `delegate_task`, isolation `worktree` | Google |
| IMPL-EVAL | providerInstanceId `codex`, model `gpt-6.2-sol`, options `{reasoningEffort: 'xhigh'}`, a separate session (OpenAI vs Google) | separate session | OpenAI |

- Workload tier: `feature`. The privileged `complex`/`architecture` rows are not authorized for
  this lane and are not selected.
- PLAN-EVAL: N/A — the issue's expected behavior fixes the contract (whole-delivery bound, bounded retry only for known-uncommitted writes, CAS refusal stays a conflict, no blind replay). Record the retry policy as a locked decision in `## Design` before code.
- IMPL-EVAL loop: feature row — at most 5 rounds, owner notified after round 3. Every new head after changes is re-gated.
- No implementation lane self-certifies. Automated green gates are evidence, not review.
- Fallback: none without an owner report first. If the builder or reviewer provider is unavailable
  or out of quota, the coordinator reports before any fallback; no silent model or provider switch.

### Scope

- The file-backed Deno KV listener honors `listen(handler, { concurrency })` for **whole deliveries**, including cancellation and drain.
- A recoverable, known-uncommitted file write (transient SQLite busy) settles within a bounded retry policy. A refused CAS remains a conflict. An unknown commit outcome never triggers a blind replay.
- No false dead letter and no repeated successful external effect. Preserve the pause, acknowledgement and redelivery semantics merged in #2645.
- Synthetic regressions from the issue: peak active handlers = 1 for `concurrency: 1` with two messages; transient busy on one settlement write; CAS refusal; ambiguous write outcome; a provider effect counter.

### Boundaries and shared seams

- No Redis adapter edits: `packages/kv/adapters/redis/**` and related Redis queue code are owned by active #2649.
- No dependency or lock edits.
- Ask the coordinator before touching another lane's files or `plugins/workers` beyond settlement wiring.

### Gates

- Scoped check (`--unstable-kv`)/lint/fmt/test over `packages/queue` and any touched root; the new regressions must fail on `main` and pass on the branch.
- `deno task quality:scan`, `deno task arch:check`, `deno task release:preflight`; `deno task publish:dry-run` if a public export changes.
- Scaffold runtime gate (`deno task e2e:cli run scaffold.runtime --cleanup --format pretty`, Docker only via `mise exec -- docker`) if the change reaches the scaffolded workers runtime path; otherwise record N/A with the reason.

## Design

### Archetype & doctrine check
- `packages/queue`: Archetype 2 (Integration), doctrine verdict `Keep` (`docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`). Owns `MessageQueue` / `DeadLetterStorePort` ports, `DenoKvAdapter`, `_kv-queue/` dispatcher/routes/connections, and `KvDeadLetterStore`. No Redis adapter files touched (`#2649` boundary).
- `plugins/workers`: Archetype 5 (Plugin Package), doctrine verdict `Refactor`, with `SCOPE-service.md` overlay for background runtime settlement wiring. Existing `plugins/workers/worker/` directory is over the F-16 cardinality cap (40 immediate children), so the new settlement-persistence helper lives in `plugins/workers/src/runtime/settlement-persistence.ts` (4 -> 5 children, well under cap) and new worker recovery regressions live in `plugins/workers/tests/runtime/kv-settlement-recovery_test.ts` (keeping `plugins/workers/worker/` cardinality at 40 and every test file under the F-10 500-LOC cap).
- Current `packages/queue` and `plugins/workers` JSR publish surfaces remain backwards-compatible: `ListenOptions.concurrency` already exists on `@netscript/queue`; `WorkerExecutionState` gains only an optional read-only `get?(executionId: string)` method that `KvExecutionState` already implements.

### Public surface
- `@netscript/queue` (`DenoKvAdapter.listen` & `createQueue`): honors `ListenOptions.concurrency` (default `1`, positive safe integer `1..2_147_483_647`; throws `QueueConfigurationError` before opening KV connections on invalid values) for whole deliveries (handler + `ack`/`nack`), including cancellation and drain.
- `@netscript/plugin-workers/worker` (`WorkerExecutionState`): optional read-only `get?(executionId: string): Promise<(WorkerExecutionRecord & { readonly status?: string }) | null>` used for read-after-ambiguous-write verification (implemented by `KvExecutionState`).

### Locked decision 1 — Bounded retry policy (`KvWriteRetryPolicy`)
Applies **only** to `known_uncommitted_transient` local SQLite write contention failures:
- `maxAttempts: 6` (1 initial attempt + at most 5 retries)
- `maxTotalTimeMs: 2_000` (hard cumulative wall-clock ceiling so settlement never stalls worker drain/stop)
- `baseDelayMs: 15` (exponential ceiling: `15, 30, 60, 120, 240` ms)
- `maxDelayMs: 250` (per-wait cap)
- Jitter: equal jitter in `[ceiling / 2, ceiling]` (at least `1` ms, clamped to remaining total budget)
- Abort-aware: checks `AbortSignal` before every attempt, uses abortable sleep (`delay(ms, { signal })`), and aborts immediately without another attempt if cancelled.

### Locked decision 2 — Commit-outcome classification (`WRITE_FAILURE_CLASS`)
Every storage write outcome classifies into a closed vocabulary before deciding retry vs verify vs fail:
1. `committed`: write fulfilled (`void` or `{ ok: true }`). Proceed normally.
2. `cas_conflict`: atomic check refused (`{ ok: false }`) or CAS/claim-loss conflict error (`Worker idempotency claim lost`, `CasConflictError`, `CAS_CONFLICT`, `ATOMIC_CHECK_FAILED`, atomic check / versionstamp conflict). **Never retried as transient.** Preserved as a conflict immediately; never causes blind replay or false dead letter.
3. `known_uncommitted_transient`: local SQLite lock/busy error before commit — walking `error` and `error.cause` (depth <= 8, cycle-safe) for SQLite busy/locked codes (`SQLITE_BUSY*`, `SQLITE_LOCKED*`) or messages (`database is locked`, `database table is locked`, `database schema is locked`), explicitly excluding CAS conflicts, abort/shutdown/timeout/lease-loss, closed-handle errors (`BadResource`, `KvClosedError`), and ambiguous/I/O markers (`SQLITE_IOERR`, `SQLITE_CORRUPT`, `SQLITE_FULL`, `unknown`, `ambiguous`, `uncertain`, `commit outcome`). Retried only within the locked bounded retry policy.
4. `aborted`: `AbortError`, `ShutdownError`, `TimeoutError`, `QueueLeaseLostError`, or aborted `AbortSignal`. Never retried; surfaces immediately to preserve #2645 cancellation and shutdown handback semantics.
5. `unknown_commit_outcome`: default for every other failure where commit status is unknown (I/O error, interrupted write, generic outage). **Never triggers a blind write replay or blind effect replay.** First runs a read-only state verification (`verifyCommitted`):
   - `KvDeadLetterStore.append`: O(1) read of `identityKey` confirming it points to `recordKey`.
   - Worker `idempotency.markApplied`: read-first check (`claim({ ...claimInput, deliveryCount: 1 })` so a live active marker cannot be stolen; releases only if an unexpected probe claim occurred on an expired key) checking `alreadyApplied === true`.
   - Worker `executionState.start` / `executionState.complete`: read-only `executionState.get?.(executionId)` checking `row?.status === expectedStatus`.
   - If verification confirms the write committed: settle cleanly without replay, without overwriting state, and without dead-lettering.
   - If verification confirms not committed (or verification cannot read): do **not** blindly replay the write; after `executionSucceeded === true`, do **not** release the active idempotency claim, do **not** call `recordJobFailure` to overwrite a succeeded execution or issue a second `complete` write, do **not** falsely dead-letter, and do **not** requeue/replay the external effect on queue-driven deliveries (direct calls without `queueContext` still reject so callers observe the unconfirmed error).

### Locked decision 3 — Local Deno KV whole-delivery concurrency, cancellation & drain
- `KvQueueRegistration` (`packages/queue/adapters/_kv-queue/routes.ts`) bounds concurrent deliveries to `concurrency` (default `1`) across the entire `DenoKvAdapter.deliver()` promise (handler + `ack`/`nack`).
- Excess deliveries arriving from `Deno.Kv.listenQueue` queue FIFO in `#waiters` while holding their native `listenQueue` delivery unacknowledged.
- Slot handoff on delivery completion is atomic: `#releaseSlot()` starts the next waiter synchronously and adds it to `#activeDeliveries` before the finishing delivery is removed, so `#active` never exceeds `concurrency` and `settle()` never observes an empty gap.
- `KvQueueRouteTable.next(queueName)` prefers a registration with `hasCapacity` in round-robin order before falling back to round-robin across saturated registrations.
- On cancellation (`signal.abort()`, `stop()`, `close()`, or loop failure), `registration.close()` immediately rejects future/queued admissions (resolving queued waiters with `admitted = false`) without cancelling already-admitted deliveries; `registration.settle()` drains only admitted deliveries.
- Unadmitted deliveries (`admitted === false`) re-enter `KvQueueDispatcher.#route`:
  - If another registration for the same queue name exists, deliver immediately.
  - Else if other queue names remain registered, `#reroute` as before.
  - Else (`#routes.isEmpty`):
    - On non-dedicated loops (`:memory:` / caller-owned `Deno.Kv`), park with `policy.parkDelayMs` as before.
    - On dedicated file-backed loops (`dedicatedListener === true`), wait until either a new listener registers (0 ms handoff) or all admitted deliveries finish draining, then durably re-enqueue the unchanged envelope (`messageId`, `deliveryCount`, `headers`, `routingHops` preserved) with a short handback delay (`min(25 ms, policy.parkDelayMs)`) **before** resolving the native `listenQueue` callback (crash-safe publish-before-ack; avoids the 5 s park stall on pause/resume while keeping the closing loop from reclaiming the handback).

### Domain vocabulary & constants
- `WRITE_FAILURE_CLASS`: `'cas_conflict' | 'known_uncommitted_transient' | 'aborted' | 'unknown_commit_outcome'`
- `DEFAULT_KV_WRITE_RETRY_POLICY`: `{ maxAttempts: 6, maxTotalTimeMs: 2_000, baseDelayMs: 15, maxDelayMs: 250 }`
- `DEDICATED_HANDBACK_DELAY_MS = 25`
- `MAX_CONCURRENCY = 2_147_483_647`
- `SettlementOutcome<T>`: discriminated union `{ readonly settled: true; readonly value: T; readonly attempts: number; readonly verifiedAfterUnknown: boolean } | { readonly settled: false; readonly failureClass: WriteFailureClass; readonly error: unknown; readonly attempts: number }`

### Ports
- Existing `MessageQueue`, `ListenOptions`, `MessageContext`, `DeadLetterStorePort` (`packages/queue/ports/`).
- Existing `WorkerIdempotencyPort` (`packages/plugin-workers-core/src/ports/worker-idempotency-port.ts`).
- Existing `WorkerExecutionState` (`plugins/workers/worker/worker-options.ts`) extended with optional read-only `get?`.

### Commit slices
1. **S1 (`packages/queue`):** Design checkpoint + red-on-main proof in run dir; whole-delivery concurrency, cancellation, and drain in `packages/queue/adapters/_kv-queue/routes.ts`, `dispatcher.ts`, and `deno-kv.adapter.ts`; bounded transient retry & commit-outcome classification in `packages/queue/adapters/_kv-queue/write-retry.ts` wired into `dispatcher.ts` and `kv-dead-letter-store.ts`; queue regression tests in `packages/queue/tests/deno-kv-concurrency-contention_test.ts` and `packages/queue/tests/deno-kv-write-retry_test.ts`. Open draft PR immediately.
   - Gate: scoped check (`--unstable-kv`), lint, fmt, and tests over `packages/queue`.
2. **S2 (`plugins/workers`):** Worker settlement persistence helper (`plugins/workers/src/runtime/settlement-persistence.ts`), optional `WorkerExecutionState.get?` (`plugins/workers/worker/worker-options.ts`), settlement wiring in `plugins/workers/worker/job-dispatcher.ts` (jobs & tasks), and worker settlement regression tests in `plugins/workers/tests/runtime/kv-settlement-recovery_test.ts`.
   - Gate: scoped check (`--unstable-kv`), lint, fmt, and tests over `plugins/workers/worker/`, `plugins/workers/src/runtime/`, and `plugins/workers/tests/runtime/`.
3. **S3 (docs & full validation):** Concise documentation of local Deno KV concurrency and transient write contention recovery in `packages/queue/README.md`, full validation suite (`quality:scan`, `arch:check`, `release:preflight`, `doc:lint`, `publish:dry-run`, `maint:leak-check`, `scaffold.runtime --cleanup` if Docker available), and read-only `mirror-acceptance-evidence.ts --dry-run --pretty` check against the draft PR.

### Deferred scope
- Redis KV / Redis queue adapters (`packages/kv/adapters/redis/**`, `packages/queue/adapters/_redis-*`, `redis.adapter.ts`) — owned by active #2649.
- Cross-process local Deno KV delivery wakeup latency (Deno SQLite KV polls cross-process on a slow interval; out of scope).
- Dependency/lock edits or `packages/plugin-workers-core` public contract refactoring.

### Contributor path
- Queue concurrency and handback: read `packages/queue/adapters/_kv-queue/routes.ts` and `dispatcher.ts` (entry from `deno-kv.adapter.ts`).
- Transient write classification and retry policy: read `packages/queue/adapters/_kv-queue/write-retry.ts` (queue/DLQ) and `plugins/workers/src/runtime/settlement-persistence.ts` (worker settlement wired in `plugins/workers/worker/job-dispatcher.ts`).

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-11-24 | S0 | bootstrap | Coordinator bootstrap commit: `supervisor.md`, `worklog.md`, `drift.md`. |
| 2026-11-24 | S0 | red-on-main | Verified genuine failures on unmodified `main` (`87965d800b7d61312e8612c82bdb0cb98bdf5b29`): queue regression (`deno test --allow-all --unstable-kv packages/queue/tests/deno-kv-concurrency-contention_test.ts` -> exit 1, 0 passed / 4 failed: `concurrency: 1` ran `peak=2`, invalid concurrency did not reject, `KvDeadLetterStore.append` failed on `SQLITE_BUSY`); worker settlement regressions (exit 1, 2 existing passed / 7 new failed: `SQLITE_BUSY` on `markApplied`/`executionComplete`, CAS refusal replay, ambiguous `markApplied` & `executionComplete` overwrite/replay, file-backed `Worker` `concurrency: 1` `peak=2`). |
| 2026-11-24 | S1 | impl + verify | Implemented `packages/queue` whole-delivery concurrency, cancellation/drain handback, bounded transient SQLite retry & commit-outcome classification (`write-retry.ts`, `routes.ts`, `dispatcher.ts`, `deno-kv.adapter.ts`, `kv-dead-letter-store.ts`). Gates: `run-deno-check.ts --root packages/queue --ext ts,tsx` exit 0 (83 files), `run-deno-lint.ts --root packages/queue --ext ts,tsx` exit 0 (83 files), `run-deno-fmt.ts --root packages/queue --ext ts,tsx` exit 0 (83 files), `deno test --allow-all --unstable-kv` over 18 queue test suites exit 0 (94 passed, 0 failed, 25 ignored). Committed `bb398c780` and opened draft PR #2657. |
| 2026-11-24 | S2 | impl + verify | Implemented `plugins/workers` settlement retry/verification (`plugins/workers/src/runtime/settlement-retry.ts`, `settlement-persistence.ts`), optional read-only `WorkerExecutionState.get?` (`worker-options.ts`), job & task settlement wiring (`job-dispatcher.ts`, 484 LOC), and file-backed worker settlement/pause/task regressions (`kv-settlement-recovery_test.ts`, `settlement-persistence_test.ts`). Gates: `run-deno-check.ts --root plugins/workers --ext ts,tsx` exit 0 (163 files), `run-deno-lint.ts --root plugins/workers --ext ts,tsx` exit 0 (163 files), `run-deno-fmt.ts --root plugins/workers --ext ts,tsx` exit 0 (163 files), 14 worker test files exit 0 (81 passed, 0 failed, 8 ignored), `arch:check` exit 0 with zero new F-1/F-16 warnings. Committed `7e58cd6d3`. |
| 2026-11-24 | S3 | docs + full validation | Documented local Deno KV concurrency and bounded transient write contention recovery in `packages/queue/README.md`. Re-ran full validation suite at final tree state: `run-deno-check.ts --root packages/queue --ext ts,tsx` exit 0 (83 files), `run-deno-check.ts --root plugins/workers --ext ts,tsx` exit 0 (163 files), `run-deno-lint.ts --root packages/queue --ext ts,tsx` exit 0 (83 files), `run-deno-lint.ts --root plugins/workers --ext ts,tsx` exit 0 (163 files), `run-deno-fmt.ts --root packages/queue --ext ts,tsx` exit 0 (83 files), `run-deno-fmt.ts --root plugins/workers --ext ts,tsx` exit 0 (163 files), `run-deno-test.ts -- --allow-all --unstable-kv` across 18 `packages/queue` test suites exit 0 (94 passed, 0 failed, 25 ignored), `run-deno-test.ts -- --allow-all --unstable-kv` across `plugins/workers/tests/runtime/` + 12 `plugins/workers/worker/` test suites exit 0 (116 passed, 0 failed, 8 ignored), `deno task quality:scan` exit 0 (`allowCount: 7`, `findings: []`), `deno task arch:check` exit 0, `deno task release:preflight` exit 0, `deno task publish:dry-run` exit 0 (35 packages). Attempted `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`: exit 1 (`4 passed, 1 failed` — `preflight.deno`, `preflight.aspire`, `scaffold.init`, and `cleanup.aspire-stop` passed; `behavior.documented-scaffold` timed out after 300s waiting for Aspire `postgres` resource `state=(null)` before worker startup in this container's remote DinD environment); `deno task maint:leak-check -- --slice-dir .llm/runs/fix-kv-queue-listen-concurrency-2651--impl --worktree .` exit 0 with 0 owned survivors. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Archetype 2 (`packages/queue`) + Archetype 5 / `SCOPE-service.md` (`plugins/workers`) | Matches doctrine verdicts (`Keep` / `Refactor`) and keeps new helper in `plugins/workers/src/runtime/` so `worker/` F-16 cardinality (40) is not deepened. | `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`, `arch:check` |
| Bounded retry policy: `maxAttempts: 6`, `maxTotalTimeMs: 2_000`, `baseDelayMs: 15`, `maxDelayMs: 250`, equal jitter, abort-aware | Bounds worst-case retries inside worker settlement budget while giving SQLite write locks time to clear without thundering herd. | #2651 acceptance criteria |
| Closed 4-way failure classification (`cas_conflict`, `known_uncommitted_transient`, `aborted`, `unknown_commit_outcome`) | Prevents CAS refusals from retrying as transient, prevents unknown outcomes from triggering blind write or effect replay, and preserves #2645 abort/shutdown handback. | #2651 acceptance criteria, #2645 |
| Dedicated file-backed unadmitted handback waits for admitted drain (or new route) then re-enqueues unchanged with `min(25ms, parkDelayMs)` before native ack | Crash-safe publish-before-ack, preserves `deliveryCount` and `messageId`, avoids 5 s park delay on pause/resume, and prevents closing loop reclaim. | #2651, #2645, Deno 2.9.7 `listenQueue` probe |

## Drift

See `drift.md`.
