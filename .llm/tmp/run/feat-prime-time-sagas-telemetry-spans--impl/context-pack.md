# Context Pack: sagas-telemetry-spans

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-prime-time-sagas-telemetry-spans--impl` |
| Branch | `feat/prime-time/sagas-telemetry-spans` |
| Current phase | `implement` |
| Archetype | `ARCHETYPE-3-runtime-behavior` |
| Scope overlays | `SCOPE-service` |

## Current State

S4 implementation is complete locally: the core telemetry seam and engine handle spans are wired, native runtime instrumentation reaches the engine, and `plugins/sagas` now has an OTel-backed saga tracer injected at service, runner, and supervisor native composition roots. S1-S3 are committed and pushed; S4 is ready to commit.

## Completed

- Read required AGENTS, harness, doctrine, PR, tools, Deno toolchain, JSR, archetype, service overlay, gate matrix, debt, research, plan, and plan-meta artifacts.
- Confirmed branch `feat/prime-time/sagas-telemetry-spans` tracks `origin/feat/prime-time/sagas-telemetry-spans`.
- Implemented S1 seam shape extension and focused telemetry seam test.
- Committed and pushed S1 (`eeff38c`), with PR #76 progress comment.
- Implemented S2 handle span lifecycle and tests.
- Committed and pushed S2 (`9d2e6d2`), with PR #76 progress comment.
- Implemented S3 runtime/bridge instrumentation threading and test.
- Committed and pushed S3 (`24828ad`), with PR #76 progress comment.
- Implemented S4 OTel adapter, composition-root injection, plugin import-map subpaths, and adapter tests.

## In Progress

- S4 commit/push/PR comment.

## Next Steps

1. Commit S4.
2. Append `commits.md`, push explicit refspec, and comment PR #76.
3. Start S5 API publish trace linkage integration/failure-path tests and final gates.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Structural seam remains in `plugin-sagas-core`; OTel adapter lives in `plugins/sagas` | `plan.md` | Prevents core package from depending on telemetry/OTel. |
| `SagaEngine` owns `saga.handle` span lifecycle | `plan.md` | One span per handled message and saga instance. |
| NOOP default instrumentation | `plan.md` | Behavior-preserving for library default usage. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/tmp/run/feat-prime-time-sagas-telemetry-spans--impl/*` | new | Implementation artifacts. |
| `packages/plugin-sagas-core/src/telemetry/instrumentation.ts` | changed | Adds `SagaTraceParent`, tracer parent option, and start-handle forwarding. |
| `packages/plugin-sagas-core/src/telemetry/mod.ts` | changed | Exports `SagaTraceParent`. |
| `packages/plugin-sagas-core/src/runtime/saga-engine.ts` | changed | Adds optional engine instrumentation field with NOOP default. |
| `packages/plugin-sagas-core/src/runtime/create-saga-runtime.ts` | changed | Threads native instrumentation into engine construction and bridge options. |
| `packages/plugin-sagas-core/src/adapters/saga-bus-bridge.ts` | changed | Accepts and holds bridge instrumentation for deferred cascade spans. |
| `packages/plugin-sagas-core/tests/telemetry/instrumentation_test.ts` | new | Proves parent context forwards into tracer options. |
| `packages/plugin-sagas-core/tests/telemetry/saga-engine-spans_test.ts` | new | Proves success and failure handle span lifecycle and duration metric. |
| `plugins/sagas/deno.json` | changed | Adds local import-map subpaths for core telemetry and telemetry tracer plus test assert dependency. |
| `plugins/sagas/src/telemetry/otel-saga-tracer.ts` | new | OTel-backed structural saga tracer adapter and instrumentation factory. |
| `plugins/sagas/services/src/main.ts` | changed | Injects `createSagaTelemetry()` into the service native runtime. |
| `plugins/sagas/src/runtime/saga-runner.ts` | changed | Supplies default native saga telemetry for the runner runtime options. |
| `plugins/sagas/src/runtime/saga-supervisor.ts` | changed | Supplies default native saga telemetry in the default runtime factory. |
| `plugins/sagas/tests/telemetry/otel-saga-tracer_test.ts` | new | Proves adapter mapping. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | S4 PASS | check/lint/fmt scoped to `packages/plugin-sagas-core` and `plugins/sagas` passed through S4. |
| Fitness | IN_PROGRESS | S1-S4 public-surface/runtime invariants covered by tests; full manual evidence pending final gate pass. |
| Runtime | S4 PASS | telemetry seam, engine span, runtime injection, OTel adapter, and existing runtime tests passed. |
| Consumer | S4 PASS | `plugins/sagas` scoped check/test passed. |

## Open Questions

- Which in-memory OTel test helper is already available for S4/S5.

## Drift and Debt

- Drift: none.
- Debt: none created.

## Commits

- eeff38c: feat(sagas): extend telemetry span seam
- 9d2e6d2: feat(sagas): emit engine handle spans
- 24828ad: feat(sagas): thread runtime instrumentation
