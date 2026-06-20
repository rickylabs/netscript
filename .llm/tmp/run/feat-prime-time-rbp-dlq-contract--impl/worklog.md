# Worklog: rbp-dlq-contract implementation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-prime-time-rbp-dlq-contract--impl` |
| Branch | `feat/prime-time/rbp-dlq-contract` |
| Archetype | `ARCHETYPE-2 (Integration)` |
| Scope overlays | `none` |
| PLAN-EVAL | PASS in supervisor summary, cycle 2, run `27852228111` |

## Design

### Public Surface

- `DeadLetterRecord<T>` — structured poison-message record.
- `DeadLetterReason` — finite terminal-failure discriminant.
- `DeadLetterStorePort<T>` — append/list/reprocess/depth store contract.
- `KvDeadLetterStore<T>` — default durable KV-backed store.
- `PostgresDeadLetterStore<T>` — PostgreSQL-backed provider store.
- `RedisDeadLetterStore<T>` — Redis-backed provider store.
- `QueueOptions.deadLetterStore?` — optional caller-supplied store threaded through factory wiring.
- `NackOptions` — existing `nack()` metadata extended with optional terminal DLQ reason/error fields.

### Domain Vocabulary

- `DeadLetterRecord<T>` — durable terminal failure payload.
- `DeadLetterReason` — `max_attempts_exceeded`, `nack_without_requeue`, `validation_failed`.
- `DeadLetterMessageMetadata<T>` — adapter-local metadata used to build records.

### Ports

- `DeadLetterStorePort<T>` — package-owned external persistence seam used by all queue adapters so the queue package does not mirror provider-specific DLQ APIs.

### Constants

- `DeadLetterReason` values — finite failure vocabulary named by the public contract.
- KV DLQ prefix — `queue:dlq` preserving the existing KvPolling key layout.
- Redis DLQ prefix — `netscript:dlq:<queue>` from the locked plan.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | DLQ port + record contract | `run-deno-check.ts`, `run-deno-lint.ts`, `run-deno-fmt.ts` | `ports/dead-letter.ts`, `ports/message-queue.ts`, `ports/mod.ts`, `mod.ts`, `adapters/_envelope.ts` |
| 2 | KvDeadLetterStore + unit tests | scoped check + `deno test --unstable-kv packages/queue/tests/dead-letter-store_test.ts` | `adapters/kv-dead-letter-store.ts`, `adapters/mod.ts`, `deno.json`, tests |
| 3 | Postgres/Redis stores + unit tests | scoped check + targeted store tests | provider store files, tests |
| 4 | KvPolling refactor | scoped check + KvPolling DLQ regression tests | `adapters/kv-polling.adapter.ts`, tests |
| 5 | Postgres/Redis adapter wiring | scoped check + adapter failure-path tests | `adapters/postgres.adapter.ts`, `adapters/redis.adapter.ts`, tests |
| 6 | DenoKv/AMQP adapter wiring | scoped check + no-op nack replacement tests | `adapters/deno-kv.adapter.ts`, `adapters/amqp.adapter.ts`, tests |
| 7 | Memory/factory/typed-queue integration | scoped check + typed queue validation DLQ tests | `testing/`, `factory/`, `ports/options.ts`, tests |
| 8 | README + publish/fitness gates | fmt + publish dry-run + jsr-audit/manual fitness evidence | `README.md`, final artifacts |

### Deferred Scope

- Bounded-parallel reprocess — additive option, sequential first-wins behavior is locked for this slice.
- RabbitMQ broker DLX provisioning — documented optional high-throughput path; KV-backed sink is the guaranteed package contract.
- Applied-key idempotency — owned by sibling prime-time slices.

### Contributor Path

To add a new provider store, implement `DeadLetterStorePort<T>` in `adapters/<tech>-dead-letter-store.ts`, export it from `adapters/mod.ts` and `deno.json`, inject it through the provider adapter constructor, and add a port-contract test that exercises append/list/depth/reprocess.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-06-20 | 1 | contract | Added public DLQ port/types, `NackOptions`, and `_envelope.ts` record conversion helper. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Add optional `NackOptions.reason/errorCode/errorMessage` | Existing `nack({ requeue: false })` cannot distinguish validation failures from explicit poison drops; optional fields preserve current callers. | `plan.md` typed-queue validation DLQ requirement |
| Keep new files under existing root `ports/` and `adapters/` folders | `packages/queue` already uses a flat role-folder layout and existing debt registry says this shape is OK. | `.llm/harness/debt/arch-debt.md`, doctrine 05 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| none | n/a | n/a |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Slice 1 check | `rtk proxy deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/queue --ext ts` | PASS | `deno check --quiet --unstable-kv <files>`, 33 files, 0 findings |
| Slice 1 lint | `rtk proxy deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/queue --ext ts` | PASS | 33 files, 0 findings |
| Slice 1 fmt | `rtk proxy deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/queue --ext ts` | PASS | 33 files, 0 findings |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-1 | PASS | Scoped check passed | Slice 1 |
| F-3 | PASS | Port in `ports/`, helper in adapter-local envelope module | No forbidden layering detected in slice |
| F-5 | PASS | New public types have explicit declarations | Full doc/publish gate runs in slice 8 |
| F-7 | PASS | New public symbols have JSDoc one-liners | Full doc lint runs in slice 8 |
| F-8 | PASS | Scoped lint passed | Slice 1 |
| F-12 | PASS | Scoped fmt passed | Slice 1 |
| F-14 | PASS | No new console output | Manual evidence from patch |
| F-15 | PASS | No version/catalog changes | Manual evidence from patch |
| F-17 | PASS | Port and helper/adapter concerns co-located by role | Manual evidence |
| F-18 | PASS | Root and `ports/mod.ts` barrels updated | Manual evidence |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Runtime behavior | NOT_RUN | Not introduced in slice 1 | Store/adapter slices run targeted tests |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Queue public import surface | PASS | Scoped check includes `packages/queue/mod.ts` and `ports/mod.ts` | Slice 1 |

## Handoff Notes

- Inspect the `NackOptions` metadata extension first; it is the only additive detail needed to preserve the locked `validation_failed` DLQ reason.
