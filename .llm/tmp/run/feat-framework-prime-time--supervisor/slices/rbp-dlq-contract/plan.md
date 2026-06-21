# plan.md — rbp-dlq-contract

## Locked scope

Define ONE uniform dead-letter-queue contract for `@netscript/queue` and make every default/native
adapter honor it, so a poison message (max-attempts-exceeded or `nack({requeue:false})`) is **durably
recorded**, never silently dropped. Unit: `packages/queue` only. No service/scaffold/docs-site changes.

## Archetype + overlays

- **ARCHETYPE-2 (Integration).** New package-owned port `DeadLetterStorePort` + named adapters.
- **Overlays: none.** Library package; touches the package README that ships in the unit only.

## Design

### Contract (LOCKED)

New file `packages/queue/ports/dead-letter.ts`, re-exported from `ports/mod.ts` and `mod.ts`:

```ts
/** Structured dead-letter record. Aligns with NormalizedError doctrine (08 §error normalization). */
export interface DeadLetterRecord<T = unknown> {
  readonly messageId: string;
  readonly queueName: string;
  readonly payload: T;
  readonly headers: Record<string, string>;
  readonly deliveryCount: number;
  readonly enqueuedAt: string;        // ISO
  readonly failedAt: string;          // ISO
  readonly reason: DeadLetterReason;  // discriminant
  readonly errorCode?: string;        // e.g. QueueErrorCode or handler error.code
  readonly errorMessage?: string;
}
export type DeadLetterReason =
  | 'max_attempts_exceeded'
  | 'nack_without_requeue'
  | 'validation_failed';

/** Minimal port (AP-3: do NOT mirror every backend op). */
export interface DeadLetterStorePort<T = unknown> {
  append(record: DeadLetterRecord<T>): Promise<void>;
  list(options?: { limit?: number }): Promise<DeadLetterRecord<T>[]>;
  reprocess(reenqueue: (record: DeadLetterRecord<T>) => Promise<void>, options?: { limit?: number }): Promise<number>;
  depth(): Promise<number>;
}
```

Decision: the port is the seam; reprocess takes a `reenqueue` callback (the adapter knows how to put a
message back) so the store stays transport-agnostic (avoids AP-3 store-owns-the-queue coupling).

### Default durable store (LOCKED)

`packages/queue/adapters/kv-dead-letter-store.ts` → `class KvDeadLetterStore<T> implements DeadLetterStorePort<T>`.
- Wraps an **injected** `WatchableKv` from `@netscript/kv` (constructor option `kv`; if absent, lazily
  `getKv()` on first use — NOT at module load, satisfying AP-11). Key layout reuses the proven KvPolling
  shape: `['queue:dlq', queueName, failedAt, messageId]`.
- `append` = `kv.set(dlqKey, record)`. `list`/`depth` = `kv.list({prefix:['queue:dlq', queueName]})`.
  `reprocess` = iterate prefix, call `reenqueue(record)`, then `kv.delete(entry.key)`; returns count.
- This is the production default for KV/DenoKv/local paths. **No in-memory-only default ships.**

### Postgres durable store (LOCKED)

`packages/queue/adapters/postgres-dead-letter-store.ts` → `class PostgresDeadLetterStore<T>`.
- Reuses the adapter's `PostgresQueueClient` (already injectable, `postgres.adapter.ts:27-44,79`).
- `ensureSchema` creates `CREATE TABLE IF NOT EXISTS <table>_dlq (queue_name, message_id PRIMARY KEY,
  payload jsonb, headers jsonb, delivery_count int, enqueued_at timestamptz, failed_at timestamptz,
  reason text, error_code text, error_message text)`; mirrors the existing `createSchema` style
  (`postgres.adapter.ts:294-318`). `append`=INSERT…ON CONFLICT DO NOTHING; `list`/`depth`=SELECT/COUNT;
  `reprocess`=SELECT…LIMIT, call `reenqueue`, DELETE.

### Redis durable store (LOCKED)

`packages/queue/adapters/redis-dead-letter-store.ts` → `class RedisDeadLetterStore<T>`.
- Reuses the adapter's `commands` Redis client. DLQ is a Redis LIST key `netscript:dlq:<queue>` storing
  JSON `DeadLetterRecord`s. `append`=`rpush`; `list`=`lrange 0 limit`; `depth`=`llen`;
  `reprocess`=`lpop` loop calling `reenqueue`.

### Wiring per adapter (LOCKED)

Each adapter gains a constructor option `deadLetterStore?: DeadLetterStorePort<T>` and a private
`#dlq` resolved in the **constructor/composition path** (not module load):
- **Postgres** (`createContext` `:392-418`): when `nack({requeue:false})` OR `delivery_count >= maxAttempts`,
  build a `DeadLetterRecord` and `await this.#dlq.append(record)` **before** the existing `ack()` DELETE, so
  the row is recorded then removed. Default `#dlq = new PostgresDeadLetterStore(sameClient, tableName)`.
- **Redis** (`createContext` `:334-339`): on `nack({requeue:false})`, `lrem` from processing (as today) then
  `await this.#dlq.append(record)` instead of dropping. Default `#dlq = new RedisDeadLetterStore(commands, queue)`.
- **DenoKv** (`:291-305`): give the NetScript context a real `nack` that, when `requeue:false`, appends to a
  default `KvDeadLetterStore` over the adapter's own `Deno.Kv`. (Fedify still owns retry/redelivery; this adds
  the terminal DLQ sink the no-op path lacked.)
- **AMQP** (`:207-221`): provide a real `nack({requeue:false})` that appends to a `KvDeadLetterStore` (KV is the
  always-available durable sink) so the contract holds even though RabbitMQ also supports broker-side DLX;
  document the DLX option in the README as the higher-throughput alternative.
- **KvPolling refactor** (`:471-523`,`:674-698`,`:726-760`): replace the inline `dlqKey` write with
  `this.#dlq.append(...)`, `getStats().dlq` with `this.#dlq.depth()`, and `reprocessDlq` with
  `this.#dlq.reprocess(reenqueue)`. Default `#dlq = new KvDeadLetterStore(thisKv, queueName)` so **behavior is
  byte-for-byte preserved** and the package now has ONE DLQ contract.
- **MemoryQueueAdapter (testing)** (`:180-213`): honor `nack({requeue:false})` by appending to an injected
  store (default a tiny in-memory `DeadLetterStorePort` impl in `testing/`), enabling port-contract tests
  without a backend.

### Factory + typed-queue (LOCKED)

- `create-queue.ts` (`:209-264`): thread an optional `deadLetterStore` from a new `QueueOptions.deadLetterStore?`
  (added to `options.ts`) into each `create*Queue` builder; when absent each adapter constructs its provider-
  appropriate default store (above). No change to provider selection priority.
- `create-typed-queue.ts` (`:174-177`): `onValidationError:'dlq'` continues to call `nack({requeue:false})`,
  which now reliably dead-letters on every adapter with `reason:'validation_failed'` — closing the advertised-
  capability gap with zero contract change to the public `onValidationError` enum.

### README (LOCKED)

Update `packages/queue/README.md` (DLQ section near `:81`,`:226`) to state the delivery guarantee
(at-least-once; poison → durable DLQ on all adapters), the per-provider DLQ backing store, the
`DeadLetterStorePort` extension point, and required permissions (`--allow-read`/`--allow-write` for KV path,
network for Postgres/Redis) per ARCHETYPE-2 AP-19.

## Open decisions

- **Reprocess concurrency** — reprocess is sequential (first-wins, ordered). Safe to defer (additive option
  later); no rework risk. Marked **safe to defer**.
- **AMQP broker-side DLX vs KV sink** — LOCKED to KV sink as the guaranteed path; DLX documented as optional.
  Resolved now (deferring would force adapter rework). **Must-resolve-now → resolved.**

No open decision would force rework if deferred. (Plan-gate open-decision sweep: clean.)

## Commit slices (ordered, gate-able)

1. **DLQ port + record contract.** Add `ports/dead-letter.ts`; re-export from `ports/mod.ts` + `mod.ts`;
   extend `_envelope.ts` with a shared `toDeadLetterRecord(message, reason, error?)` helper.
   *Proves*: contract compiles + exported. *Gate*: `run-deno-check.ts --root packages/queue --ext ts`,
   `run-deno-lint.ts`, `run-deno-fmt.ts`. Files: `ports/dead-letter.ts`, `ports/mod.ts`, `mod.ts`,
   `adapters/_envelope.ts`.
2. **KvDeadLetterStore (default durable) + unit tests.** Add `adapters/kv-dead-letter-store.ts`; export from
   `adapters/mod.ts`; add `deno.json` subpath `./adapters/kv-dead-letter-store`.
   *Proves*: append/list/depth/reprocess against an injected in-test `Deno.Kv`. *Gate*: check + targeted
   `deno test --unstable-kv tests/dead-letter-store_test.ts`. Files: store, `adapters/mod.ts`, `deno.json`,
   `tests/dead-letter-store_test.ts`.
3. **PostgresDeadLetterStore + RedisDeadLetterStore + unit tests.** Add both stores; export + subpaths.
   *Proves*: append/list/reprocess via in-memory fake `PostgresQueueClient` / fake Redis `commands`.
   *Gate*: check + targeted tests. Files: two store files, `adapters/mod.ts`, `deno.json`, test files.
4. **KvPolling refactor onto the port.** Replace inline DLQ write/depth/reprocess with `#dlq`; default
   `KvDeadLetterStore`. *Proves*: existing KvPolling DLQ behavior preserved. *Gate*: check + existing
   kv-polling tests (extend if present). Files: `adapters/kv-polling.adapter.ts`, its test.
5. **Postgres + Redis adapter DLQ wiring + failure-path tests.** Route `nack({requeue:false})` / max-attempts
   to `#dlq.append` before discard. *Proves*: poison message lands in DLQ store, not silent drop. *Gate*:
   check + `tests/postgres-adapter_test.ts` (extend) + new redis adapter test. Files: two adapters, tests.
6. **DenoKv + AMQP adapter DLQ wiring + tests.** Real `nack({requeue:false})` → `KvDeadLetterStore`. *Proves*:
   no-op nack replaced with durable DLQ. *Gate*: check --unstable-kv + targeted tests. Files: two adapters,
   tests.
7. **Memory testing adapter honors contract + factory/typed-queue wiring + e2e dlq test.** Add
   `QueueOptions.deadLetterStore`; thread through factory; typed-queue `'dlq'` end-to-end test (validation
   failure → record present). *Proves*: advertised `onValidationError:'dlq'` works on a default adapter.
   *Gate*: check + `tests/typed-queue_test.ts` + `tests/validation_test.ts`. Files: `testing/memory-queue.ts`,
   `testing/mod.ts`, `factory/create-queue.ts`, `factory/create-typed-queue.ts`, `ports/options.ts`, tests.
8. **README delivery-guarantee + DLQ docs + publish dry-run.** *Proves*: surface documented, package
   publishable. *Gate*: `run-deno-fmt.ts`, `deno publish:dry-run`, F-5/F-6 (jsr-audit on the new exported
   surface). Files: `README.md`, `deno.json` (if exports adjusted).

(8 slices < 30.)

## Gates to run

- Per slice: `.llm/tools/run-deno-check.ts --root packages/queue --ext ts` (add `--unstable-kv` for KV slices),
  `.llm/tools/run-deno-lint.ts`, `.llm/tools/run-deno-fmt.ts --root packages/queue --ext ts`.
- Targeted tests: `deno test --unstable-kv` on the new + touched `packages/queue/tests/*_test.ts`.
- **Fitness (ARCHETYPE-2 — the matrix requires the FULL set `F-1..F-12, F-14..F-18`; `F-13` is n/a for
  Arch-2). Every required gate is enumerated below with its Phase-A disposition per
  `gates/archetype-gate-matrix.md`:**
  - **F-1** Build/type-check → PASS: `run-deno-check.ts --root packages/queue --ext ts` (`--unstable-kv` for KV slices) per slice.
  - **F-2** Helper-reinvention scan → PENDING_SCRIPT + manual evidence: no new helper duplicates `_envelope.ts` / `@netscript/kv`; the new DLQ stores wrap existing primitives (`PostgresQueueClient`, Redis `commands`, `WatchableKv`).
  - **F-3** Public-surface review → PASS: 7 new exports reviewed (see jsr-audit section).
  - **F-4** Inheritance audit → PENDING_SCRIPT + manual evidence: each `*DeadLetterStore` `implements DeadLetterStorePort<T>` — no deep class hierarchies introduced.
  - **F-5** Slow-type / JSR doc-lint on the FULL export map → PASS with explicit return annotations (jsr-audit section).
  - **F-6** JSR publishability → PASS: `deno task publish:dry-run` (queue) in the README slice.
  - **F-7** Doc-score on new exports → PASS: doc comments on every new public symbol.
  - **F-8** Lint → PASS: `run-deno-lint.ts` per slice.
  - **F-9** Permission declaration check → PASS: README slice declares `--allow-read`/`--allow-write` for the KV path and network for Postgres/Redis (AP-19).
  - **F-10** Test-shape (unit + failure-path) → PASS: testPlan covers 9 scenarios across all 5 adapters + regression.
  - **F-11** Forbidden-folder lint → PASS + manual evidence: new files land in `ports/`, `adapters/`, `testing/` only — no `interfaces/`, no nested `src/` inside `packages/queue/` (AP-17; store ships under `ports/dead-letter.ts`).
  - **F-12** Format → PASS: `run-deno-fmt.ts --root packages/queue --ext ts` per slice.
  - **F-14** No stray `console.log` in shipped code → PASS: DLQ append routes through existing adapter logging / `TracedQueue`; gate explicitly selected to catch a stray log.
  - **F-15** Package metadata/version integrity → PASS: no version-pin or catalog edits; `deno.json` only gains subpath exports.
  - **F-16** Folder-cardinality lint → PENDING_SCRIPT + manual evidence: folder count under `packages/queue/` unchanged; new files added to existing folders (`ports`, `adapters`, `testing`).
  - **F-17** Abstract-derived co-location → PASS: `DeadLetterStorePort<T>` (port) co-located in `ports/`; `Kv/Postgres/RedisDeadLetterStore` (derived) co-located in `adapters/`, matching doctrine §archetype-2.
  - **F-18** Sub-barrel lint → PASS: existing `ports/mod.ts` + `adapters/mod.ts` + `mod.ts` barrels carry the new exports; if a new subpath export crosses a sub-barrel boundary, add the `arch:barrel-ok` justification line per existing convention.
- Package: `deno task publish:dry-run` (queue) in the README slice.
- **No `e2e:cli`** — no scaffold output changes.

## Production / enterprise bar (met)

Durable persistence on every adapter (KV/Postgres/Redis tables-or-keys; no memory-only default ships);
structured `DeadLetterRecord` aligned to NormalizedError doctrine; idempotent `append` (ON CONFLICT /
keyed); reprocess/depth observability surface; failure-path tests per adapter; no TODOs / no-op nack paths
left advertised.

## jsr-audit (planned surface)

New public exports: `DeadLetterStorePort`, `DeadLetterRecord`, `DeadLetterReason`, `KvDeadLetterStore`,
`PostgresDeadLetterStore`, `RedisDeadLetterStore`, `QueueOptions.deadLetterStore`. All are explicit interfaces
/ classes with named return types (no inferred slow types). Sub-path exports added in `deno.json`. Risk:
slow-type from returning bare generics — mitigated by explicit `Promise<DeadLetterRecord<T>[]>` return
annotations on every port method. jsr-audit applied to the FULL export map (mod.ts + ports/mod.ts +
adapters/mod.ts), not mod.ts alone.