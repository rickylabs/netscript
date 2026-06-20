# Worklog: sagas-idempotency-e2e

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-prime-time-sagas-idempotency-e2e--impl` |
| Branch | `feat/prime-time/sagas-idempotency-e2e` |
| Archetype | `ARCHETYPE-3 - Runtime/Behavior` |
| Scope overlays | `SCOPE-service` |

## Design

### Public Surface

- `SagaAppliedKeyStore` / `SagaAppliedKeyOutcome` from `packages/plugin-sagas-core/src/ports`.
- `MemorySagaAppliedKeyStore` from `packages/plugin-sagas-core/src/runtime` and `src/stores`.
- `sagaIdempotencyKey(target, idempotencyKey)` from core runtime for plugin durable adapters.
- `SagaEngineOptions.appliedKeys` and `SagaEngineHandleResult.alreadyApplied`.
- `PublishMessageInput.idempotencyKey` in `plugins/sagas/contracts/v1`.
- `KvSagaIdempotencyStore`, `KvSagaAppliedKeyStore`, and `openSagaRuntimeKv` from `plugins/sagas/src/runtime`.

### Domain Vocabulary

- `SagaAppliedKeyStore` — records an applied `(instanceId, idempotencyKey)` pair atomically.
- `SagaAppliedKeyOutcome` — discriminates first application from duplicate replay with `applied`.
- `alreadyApplied` — structured engine outcome for duplicates; not an exception.
- `idempotencyKey` — client supplied key scoped to transport target or saga instance.

### Ports

- `SagaAppliedKeyStore` — durable effect-dedup store consumed by `SagaEngine`; default memory implementation is process-local and production roots inject KV.
- `SagaIdempotencyPort` — existing transport dedup reservation port reused unchanged.
- `Deno.Kv` — plugin-layer durable adapter dependency opened only in composition/runtime roots.

### Constants

- KV namespaces: `["sagas", "idempotency"]` for transport reservations and `["sagas", "applied"]` for engine applied keys.
- Default transport reservation TTL: `DEFAULT_IDEMPOTENCY_TTL_MS`.
- Applied-key TTL: unset by default; configurable for deployed roots.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | core applied-key port + memory default | `.llm/tools/run-deno-check.ts --root packages/plugin-sagas-core --ext ts --unstable-kv`; lint/fmt wrappers | core ports/runtime/stores barrels |
| 2 | core engine applied-key guard | `deno test --unstable-kv packages/plugin-sagas-core/tests/runtime/saga-engine*` | `saga-engine.ts`, core engine tests |
| 3 | core README delivery guarantee | `deno doc --lint packages/plugin-sagas-core/mod.ts` | `packages/plugin-sagas-core/README.md` |
| 4 | publish contract idempotency key | check wrapper on `plugins/sagas/contracts` | `plugins/sagas/contracts/v1/sagas.contract.ts` |
| 5 | service idempotency threading | check wrapper on `plugins/sagas/services` | `v1-types.ts`, `v1-handlers.ts` |
| 6 | plugin KV durable stores | check wrapper on `plugins/sagas/src/runtime --unstable-kv` | `kv-saga-runtime-stores.ts`, runtime barrel |
| 7 | composition-root durable wiring | check wrapper on core + plugin/service roots | `create-saga-runtime.ts`, `main.ts`, runner/supervisor, READMEs |
| 8 | tests | targeted `deno test --unstable-kv --allow-all` | package/plugin/service tests |
| 9 | final gate pass | plan gate set | harness artifacts, final validation |

### Deferred Scope

- Durable `SagaStorePort` state envelopes — sibling `sagas-durable-store` slice lands first; this slice consumes its contract where present but does not duplicate it.
- Scaffold/runtime E2E — no scaffold output changes; explicitly excluded by approved plan.
- Cascade-target idempotency beyond existing bridge behavior — safe follow-up.

### Contributor Path

To add another saga idempotency backend, implement `SagaIdempotencyPort` for transport reservations
and `SagaAppliedKeyStore` for engine effects, then inject both through `createSagaRuntime({ native:
{ idempotency, engineOptions: { appliedKeys } } })`.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-06-20 | bootstrap | pre-flight | Branch and upstream confirmed; PLAN-EVAL summary records PASS. |
| 2026-06-20 | 1 | applied-key contract | Added core `SagaAppliedKeyStore`, process-local memory implementation, and exported `sagaIdempotencyKey`. |
| 2026-06-20 | 1 | gates | Scoped check/lint/fmt and targeted `deno check --unstable-kv` passed. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| KV adapters stay in `plugins/sagas` | Keep JSR-published core free of `Deno.openKv` and permissions. | approved plan C5 |
| Engine guard returns `alreadyApplied` instead of throwing | Duplicate is a structured non-failure per doctrine 08. | doctrine 08, approved plan C2 |
| Memory default is process-local only | Engine public surface must be real for raw consumers; deployed roots inject durable KV. | approved plan C1/C6 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| none | n/a | n/a |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| slice 1 check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-sagas-core --ext ts` | PASS | 91 files selected; 0 diagnostics. |
| slice 1 unstable check | `deno check --unstable-kv packages/plugin-sagas-core/mod.ts packages/plugin-sagas-core/src/ports/mod.ts packages/plugin-sagas-core/src/runtime/mod.ts packages/plugin-sagas-core/src/stores/mod.ts` | PASS | Public/core entrypoints type-check with unstable KV enabled. |
| slice 1 lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin-sagas-core --ext ts` | PASS | 91 files selected; 0 findings. |
| slice 1 fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin-sagas-core --ext ts` | PASS | 91 files selected; 0 findings after scoped write-format. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-13 | NOT_RUN | pending | Manual invariant evidence after implementation. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| targeted runtime tests | NOT_RUN | pending | Implementation in progress. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| consumer imports | NOT_RUN | pending | Implementation in progress. |

## Handoff Notes

- Evaluator should inspect `SagaEngine.#handleEntry`, KV store atomic checks, and service publish threading first.
