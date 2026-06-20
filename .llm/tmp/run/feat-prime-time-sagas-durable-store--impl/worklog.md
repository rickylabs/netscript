# Worklog: sagas-durable-store

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-prime-time-sagas-durable-store--impl` |
| Branch | `feat/prime-time/sagas-durable-store` |
| Archetype | `ARCHETYPE-3 runtime/behavior` for `@netscript/plugin-sagas-core`; `ARCHETYPE-5 plugin` for `@netscript/plugin-sagas` |
| Scope overlays | `SCOPE-service` |

## Design

### Public Surface

- `KvSagaStore` — production `SagaStorePort` implementation backed by raw `Deno.Kv`.
- `openSagaRuntimeKv()` — opens the production saga runtime KV using `NETSCRIPT_SAGA_KV_PATH`.
- `createDurableSagaRuntime()` — plugin-layer native runtime factory that injects a durable store.
- `SagaRuntimeNativeOptions.logger?` — core runtime warning seam for store-less native composition.
- `plugins/sagas/src/runtime/mod.ts` — runtime subpath re-exports for the new durable store/factory.

### Domain Vocabulary

- `SagaStateEnvelope` — persisted saga instance state and metadata.
- `SagaTransitionRecord` — append-only transition history record keyed by instance and version.
- `SagaCorrelationIndexEntry` — O(1) correlation index from saga id + correlation key to instance id.
- `DurableSagaRuntime` — runtime, store, and KV handle returned by plugin durable composition.
- `KvSagaStoreOptions` — injected KV, optional key prefix, and optional clock seam.

### Ports

- `SagaStorePort` — existing core persistence contract reused unchanged.
- `LoggerPort` — existing core structured logging seam used for one-time store-less warning.

### Constants

- KV prefix default: `['sagas']`.
- KV namespaces: `state`, `correlation`, `transition`.
- Store id: `kv-saga-store`.
- Environment variable: `NETSCRIPT_SAGA_KV_PATH`.
- Warning code: `sagas.runtime.store_missing`.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | `feat(sagas): KvSagaStore durable SagaStorePort` | `deno test --unstable-kv --allow-all plugins/sagas/src/runtime/kv-saga-store_test.ts`; `run-deno-check.ts --root plugins/sagas/src/runtime --ext ts` | `plugins/sagas/src/runtime/kv-saga-store.ts`, `plugins/sagas/src/runtime/kv-saga-store_test.ts` |
| 2 | `feat(sagas): openSagaRuntimeKv + createDurableSagaRuntime default wiring` | Targeted runtime tests and scoped check | `plugins/sagas/src/runtime/create-durable-saga-runtime.ts`, test, `plugins/sagas/src/runtime/mod.ts` |
| 3 | `feat(sagas-core): warn on store-less native engine composition` | Core check and runtime tests | `packages/plugin-sagas-core/src/runtime/create-saga-runtime.ts`, core test |
| 4 | `feat(sagas): wire durable runtime into service composition root` | Scoped service check | `plugins/sagas/services/src/main.ts` |
| 5 | `feat(sagas): durable-by-default standalone runner/supervisor` | Targeted runtime tests and scoped check | `plugins/sagas/src/runtime/saga-runner.ts`, `plugins/sagas/src/runtime/saga-supervisor.ts`, tests |
| 6 | `test(sagas): cross-restart durability + failure-path integration` | `deno test --unstable-kv --allow-all plugins/sagas/src/runtime/durable-saga-restart_test.ts` | `plugins/sagas/src/runtime/durable-saga-restart_test.ts` |
| 7 | `docs(sagas): correct Prisma-store promise` | Scoped TS fmt plus manual `.prisma` diff review | `plugins/sagas/database/sagas.prisma`, `plugins/sagas/services/src/main.ts` |
| 8 | `chore(sagas): full validation sweep` | Full gate set named in plan | Gate evidence only |

### Deferred Scope

- Applied-key idempotency dedup — separate `sagas-idempotency-e2e` slice.
- Telemetry spans — separate `sagas-telemetry-spans` slice.
- Signal-driven graceful drain — separate `service-graceful-shutdown` slice.
- HTTP read-path reconciliation to consume `KvSagaStore` — deferred-safe separate slice.
- Scaffold/runtime E2E — explicitly not required because this slice does not change scaffold output.

### Contributor Path

To add a new durable saga store, implement `SagaStorePort` in `plugins/sagas/src/runtime/`, add focused unit and restart/failure-path tests beside it, then expose a plugin-layer factory or explicit injection path through `createDurableSagaRuntime` without moving Deno-specific defaults into core.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-06-20 | bootstrap | pre-flight | Read implementation brief, approved research/plan/plan-meta, doctrine/archetype/service overlay, and current saga/triggers code paths. |
| 2026-06-20 | 1 | implementation | Added `KvSagaStore` over raw `Deno.Kv` with optimistic saves, correlation lookup, transition log, delete cleanup, diagnostics/test read helpers, and close lifecycle. |
| 2026-06-20 | 1 | validation | Targeted unit/failure-path tests, scoped check, and scoped fmt gate passed. |
| 2026-06-20 | 2 | implementation | Added `createDurableSagaRuntime`, default `KvSagaStore` injection, injected store/KV support, and runtime barrel exports. |
| 2026-06-20 | 2 | validation | Durable runtime factory tests, scoped check, and scoped fmt gate passed. |
| 2026-06-20 | 3 | implementation | Added `SagaRuntimeNativeOptions.logger?` and a per-logger one-time warning when core composes a native engine without a store. |
| 2026-06-20 | 3 | validation | Targeted warning tests, full core runtime tests, package check, and scoped fmt passed. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Keep `SagaStorePort` unchanged | Existing engine already drives `load`, `save`, correlation, and transition methods. | `plan.md`, `packages/plugin-sagas-core/src/ports/saga-store-port.ts` |
| Put Deno KV implementation in plugin package | Core remains platform-neutral and mirrors triggers pattern. | `plan.md`, `docs/architecture/doctrine/07-composition-and-extension.md` |
| Warn instead of defaulting core store | Closes silent store-less behavior without introducing Deno KV dependency into core. | `plan.md`, `packages/plugin-sagas-core/src/runtime/logger.ts` |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| None | N/A | N/A |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Pre-flight branch check | `git status --short --branch` | PASS | On `feat/prime-time/sagas-durable-store`; unrelated OpenHands request files already modified. |
| Slice 1 test | `deno test --unstable-kv --allow-all plugins/sagas/src/runtime/kv-saga-store_test.ts` | PASS | Exit 0; 5 passed, 0 failed. |
| Slice 1 check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/sagas/src/runtime --ext ts` | PASS | Exit 0; 6 files selected, 0 diagnostics. |
| Slice 1 fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root plugins/sagas/src/runtime --ext ts --include 'kv-saga-store'` | PASS | Exit 0; 2 files selected, 0 findings. |
| Slice 2 test | `deno test --unstable-kv --allow-all plugins/sagas/src/runtime/create-durable-saga-runtime_test.ts` | PASS | Exit 0; 2 passed, 0 failed. |
| Slice 2 check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/sagas/src/runtime --ext ts` | PASS | Exit 0; 8 files selected, 0 diagnostics. |
| Slice 2 fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root plugins/sagas/src/runtime --ext ts --include 'create-durable-saga-runtime\|mod.ts\|kv-saga-store'` | PASS | Exit 0; 5 files selected, 0 findings. |
| Slice 3 targeted test | `deno test --unstable-kv --allow-all packages/plugin-sagas-core/tests/runtime/create-saga-runtime_test.ts` | PASS | Exit 0; 2 passed, 0 failed. |
| Slice 3 runtime tests | `deno test --unstable-kv --allow-all packages/plugin-sagas-core/tests/runtime/` | PASS | Exit 0; 15 passed, 0 failed. |
| Slice 3 package check | `deno task check` from `packages/plugin-sagas-core` | PASS | Exit 0; all package entrypoints checked. |
| Slice 3 fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin-sagas-core/src --root packages/plugin-sagas-core/tests/runtime --ext ts --include 'create-saga-runtime'` | PASS | Exit 0; 2 files selected, 0 findings. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-5/F-13/F-15/F-16/F-18 | NOT_RUN | Pending implementation | Will record final manual/script evidence after slices land. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Durable KV store unit/failure tests | PASS | `kv-saga-store_test.ts`: 5 passed, 0 failed | Covers state round-trip, correlation, transitions, stale expected version rejection, and delete cleanup. |
| Durable runtime factory tests | PASS | `create-durable-saga-runtime_test.ts`: 2 passed, 0 failed | Covers default `KvSagaStore` injection and injected store/KV preservation. |
| Store-less warning tests | PASS | `create-saga-runtime_test.ts`: 2 passed, 0 failed | Covers exactly one warning per injected logger and no warning when a store is present. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Service composition | NOT_RUN | Pending implementation | Planned in slice 4. |

## Handoff Notes

- Evaluator should inspect `plugins/sagas/src/runtime/kv-saga-store.ts`, `create-durable-saga-runtime.ts`, the service/runner/supervisor wiring, and the restart/failure-path tests first.
