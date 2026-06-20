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
| 2026-06-20 | 2 | engine guard | Added engine applied-key short-circuit, `alreadyApplied` result, and raw `publish()` option threading. |
| 2026-06-20 | 2 | tests | Added engine applied-key tests for duplicate, no-key, per-instance, publish-options, and memory store behavior. |
| 2026-06-20 | 3 | README | Documented core at-least-once delivery with idempotency keys and durable production injection requirement. |
| 2026-06-20 | 4 | contract | Added optional `idempotencyKey` to publish input type and Zod schema. |
| 2026-06-20 | 5 | service threading | Threaded `idempotencyKey` through service runtime message and publish options. |
| 2026-06-20 | 6 | KV stores | Added plugin-layer `KvSagaIdempotencyStore`, `KvSagaAppliedKeyStore`, and `openSagaRuntimeKv`. |
| 2026-06-20 | 7 | wiring | Wired KV stores into service startup and default native runner/supervisor runtime creation; updated plugin README. |
| 2026-06-20 | 8 | tests | Added KV store integration tests, service publish threading tests, and runtime applied-key wiring test. |
| 2026-06-20 | 9 | final gates | Ran final scoped gates, root check/lint, publish dry-run, JSR audit, consumer import validation, and doctrine checks. |
| 2026-06-20 | 9 | JSR docs | Added missing `@module` tags to existing `plugin-sagas-core` exported subpath barrels so JSR audit has no failures. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| KV adapters stay in `plugins/sagas` | Keep JSR-published core free of `Deno.openKv` and permissions. | approved plan C5 |
| Engine guard returns `alreadyApplied` instead of throwing | Duplicate is a structured non-failure per doctrine 08. | doctrine 08, approved plan C2 |
| Memory default is process-local only | Engine public surface must be real for raw consumers; deployed roots inject durable KV. | approved plan C1/C6 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Root `arch:check` and root `fmt:check` are red from unrelated baseline debt outside this slice. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| slice 1 check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-sagas-core --ext ts` | PASS | 91 files selected; 0 diagnostics. |
| slice 1 unstable check | `deno check --unstable-kv packages/plugin-sagas-core/mod.ts packages/plugin-sagas-core/src/ports/mod.ts packages/plugin-sagas-core/src/runtime/mod.ts packages/plugin-sagas-core/src/stores/mod.ts` | PASS | Public/core entrypoints type-check with unstable KV enabled. |
| slice 1 lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin-sagas-core --ext ts` | PASS | 91 files selected; 0 findings. |
| slice 1 fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin-sagas-core --ext ts` | PASS | 91 files selected; 0 findings after scoped write-format. |
| slice 2 tests | `deno test --unstable-kv packages/plugin-sagas-core/tests/runtime/saga-engine*` | PASS | 5 passed, 0 failed. |
| slice 2 check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-sagas-core --ext ts` | PASS | 92 files selected; 0 diagnostics. |
| slice 2 lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin-sagas-core --ext ts` | PASS | 92 files selected; 0 findings. |
| slice 2 fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin-sagas-core --ext ts` | PASS | 92 files selected; 0 findings. |
| slice 3 doc lint | `deno doc --lint packages/plugin-sagas-core/mod.ts` | PASS | Checked 1 file. |
| slice 3 check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-sagas-core --ext ts` | PASS | 92 files selected; 0 diagnostics. |
| slice 3 fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin-sagas-core --ext md,ts` | PASS | 98 files selected; 0 findings after scoped write-format. |
| slice 4 contract check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/sagas/contracts --ext ts` | PASS | 2 files selected; 0 diagnostics. |
| slice 4 contract lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/sagas/contracts --ext ts` | PASS | 2 files selected; 0 findings. |
| slice 4 contract fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root plugins/sagas/contracts --ext ts` | PASS | 2 files selected; 0 findings after scoped write-format. |
| slice 5 service check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/sagas/services --ext ts` | PASS | 10 files selected; 0 diagnostics. |
| slice 5 service lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/sagas/services --ext ts` | PASS | 10 files selected; 0 findings. |
| slice 5 service fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root plugins/sagas/services --ext ts` | PASS | 10 files selected; 0 findings after scoped write-format. |
| slice 6 runtime check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/sagas/src/runtime --ext ts` | PASS | 5 files selected; 0 diagnostics. |
| slice 6 runtime lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/sagas/src/runtime --ext ts` | PASS | 5 files selected; 0 findings. |
| slice 6 runtime fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root plugins/sagas/src/runtime --ext ts` | PASS | 5 files selected; 0 findings after scoped write-format. |
| slice 7 wiring check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/sagas/services --root plugins/sagas/src/runtime --ext ts` | PASS | 15 files selected; 0 diagnostics. |
| slice 7 wiring lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/sagas/services --root plugins/sagas/src/runtime --ext ts` | PASS | 15 files selected; 0 findings. |
| slice 7 wiring fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root plugins/sagas/services --root plugins/sagas/src/runtime --file plugins/sagas/README.md --ext ts,md` | PASS | 16 files selected; 0 findings after scoped write-format. |
| slice 8 core tests | `deno test --unstable-kv --allow-all packages/plugin-sagas-core` | PASS | 23 passed, 0 failed. |
| slice 8 plugin tests | `deno test --unstable-kv --allow-all plugins/sagas` | PASS | 11 passed, 0 failed. |
| slice 8 fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin-sagas-core --root plugins/sagas --ext ts,md` | PASS | 160 files selected; 0 findings. |
| final scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-sagas-core --root plugins/sagas --ext ts` | PASS | 150 files selected; 0 diagnostics. |
| final scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin-sagas-core --root plugins/sagas --ext ts` | PASS | 150 files selected; 0 findings. |
| final scoped fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin-sagas-core --root plugins/sagas --ext ts,md` | PASS | 160 files selected; 0 findings. |
| root check | `deno task check` | PASS | 1,608 files selected; 0 diagnostics. |
| root lint | `deno task lint` | PASS | 1,093 files selected; 0 findings. |
| root fmt check | `deno task fmt:check` | FAIL_BASELINE | Unrelated existing finding in `plugins/triggers/src/runtime/trigger-runtime-processor_test.ts`; not touched by this slice. Scoped fmt for owned roots passed. |
| publish dry-run | `deno publish --dry-run --allow-dirty` from `packages/plugin-sagas-core` | PASS | Dry run complete. |
| JSR audit | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/plugin-sagas-core --text` | PASS_WITH_WARNINGS | No FAIL findings after module docs fix; warnings remain for existing `src` cardinality and slow-type banner. |
| consumer import | `deno eval --unstable-kv "... imports core/plugin runtime idempotency exports ..."` | PASS | Imported `SagaAppliedKeyStore`, `MemorySagaAppliedKeyStore`, `sagaIdempotencyKey`, `KvSagaAppliedKeyStore`, `KvSagaIdempotencyStore`, `openSagaRuntimeKv`. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-1 | PASS | Focused files are below hard fail thresholds. | Manual + scoped checks. |
| F-3 | PASS | Core applied-key port in `ports`, memory implementation in `runtime`, plugin adapters in `plugins/sagas/src/runtime`. | No forbidden dependency direction introduced. |
| F-5/F-7 | PASS_WITH_WARNINGS | JSR audit has no FAIL after adding `@module` tags; dry-run passes. | Existing slow-type warning remains as audit warning. |
| F-6 | PASS | `deno publish --dry-run --allow-dirty` in `packages/plugin-sagas-core`. | No `Deno.openKv` added to published core. |
| F-10 | PASS | Added focused tests; package-level tests pass. | Core 23, plugin 11. |
| F-13 | PASS | Engine guard records applied key before handler effects and returns `alreadyApplied` duplicates without terminal-state changes. | Runtime invariant tests pass. |
| F-14 | PASS | No new `console.*` in published runtime code. | Scoped lint clean. |
| F-18 | PASS | Only package root/subpath barrels updated with explicit exports and `@module` docs. | No sub-barrel-only indirection added. |
| root doctrine | FAIL_BASELINE | `deno task arch:check` reports pre-existing repo failures; scoped `packages/plugin-sagas-core` doctrine has 0 FAIL, scoped `plugins/sagas` has existing `SagasCliCommand`/size/default-export findings. | Recorded in drift; not introduced by this slice. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| targeted runtime tests | PASS | `deno test --unstable-kv --allow-all packages/plugin-sagas-core plugins/sagas` | 34 passed, 0 failed. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| consumer imports | PASS | `deno eval --unstable-kv` import probe | Core and plugin runtime idempotency exports resolve. |

## Handoff Notes

- Evaluator should inspect `SagaEngine.#handleEntry`, KV store atomic checks, and service publish threading first.
- Do not treat root `fmt:check` or root `arch:check` as slice regressions without comparing baseline:
  their current failures point to untouched triggers/CLI/plugin debt outside this slice.
