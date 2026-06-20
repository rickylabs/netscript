# Worklog: sagas-telemetry-spans

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-prime-time-sagas-telemetry-spans--impl` |
| Branch | `feat/prime-time/sagas-telemetry-spans` |
| Archetype | `ARCHETYPE-3-runtime-behavior` for `@netscript/plugin-sagas-core` |
| Scope overlays | `SCOPE-service` for `plugins/sagas/services` |

## Design

### Public Surface

- `SagaTraceParent` — new exported telemetry subpath type carrying optional W3C trace context.
- `SagaTelemetryTracer.startSpan(..., { parent })` — additive optional parent context.
- `SagaHandleSpanInput.parent` — additive optional parent context.
- `SagaEngineOptions.instrumentation` — optional injected `SagaInstrumentation`, defaulting to NOOP.
- `SagaBusBridgeOptions.instrumentation` — optional pass-through instrumentation for the bridge.
- `SagaRuntimeNativeOptions.instrumentation` — optional native runtime instrumentation.
- `createOtelSagaTracer()` / `createSagaTelemetry()` — internal `plugins/sagas` composition-root helpers.

### Domain Vocabulary

- `SagaTraceParent` — W3C parent context `{ traceparent?, tracestate? }`.
- `SagaInstrumentation` — vendor-neutral saga telemetry seam owned by `plugin-sagas-core`.
- `SagaTelemetrySpan` — structural span interface used by the core engine.
- `SagaHandleSpanInput` — per-message span identity and attributes.
- `SagaTelemetryOutcomes` — canonical handle outcomes.

### Ports

- `SagaTelemetryTracer` — core-owned structural tracing port. The OTel implementation lives in `plugins/sagas`.
- `SagaStorePort` — existing durable state port consumed unchanged.

### Constants

- `SagaSpanNames.HANDLE` — canonical `saga.handle` span name.
- `SagaSpanEvents.STATE_BEFORE` / `STATE_AFTER` — state transition span events.
- `SagaAttributes.*` — canonical span attributes reused without new vocabulary.
- `SagaTelemetryOutcomes.*` — success/error/compensated/skipped outcomes.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Seam shape extension + engine instrumentation option | scoped check/lint/fmt; telemetry tests | `packages/plugin-sagas-core/src/telemetry/*`, `src/runtime/saga-engine.ts`, telemetry tests |
| 2 | Emit `saga.handle` spans in engine handle path | scoped check/lint/fmt; new engine span tests; runtime tests | `packages/plugin-sagas-core/src/runtime/saga-engine.ts`, tests |
| 3 | Thread instrumentation through bridge/runtime composition | scoped check/lint/fmt; runtime publish injection test | `packages/plugin-sagas-core/src/adapters/saga-bus-bridge.ts`, `src/runtime/create-saga-runtime.ts`, tests |
| 4 | OTel adapter + composition-root injection | scoped check/lint/fmt; adapter tests | `plugins/sagas/src/telemetry/*`, runtime/service composition roots, tests |
| 5 | API publish to engine trace linkage integration | scoped check/lint/fmt; integration failure-path tests; arch/jsr gates | service/integration tests and final artifacts |

### Deferred Scope

- Compensation, DLQ, idempotency, concurrency counters — additive follow-up call sites, not required for handle spans.
- `saga.cascade.*` spans — bridge/scheduler/compensator instrumentation is a separate cascade telemetry slice.
- Scaffold runtime E2E — excluded by approved plan because this slice does not change scaffold output.

### Contributor Path

To extend saga telemetry, start at `packages/plugin-sagas-core/src/telemetry/instrumentation.ts` for vocabulary and port shape, then wire call sites from the engine or bridge. OTel-specific behavior belongs in `plugins/sagas/src/telemetry/` and should be injected by composition roots, not imported by `plugin-sagas-core`.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-06-20 | preflight | bootstrap | Read harness, doctrine, plan artifacts; branch tracks `origin/feat/prime-time/sagas-telemetry-spans`. |
| 2026-06-20 | S1 | implementation | Added `SagaTraceParent`, tracer parent forwarding, exported type, and `SagaEngineOptions.instrumentation` with NOOP default. |
| 2026-06-20 | S1 | gates | Scoped check/lint/fmt and focused telemetry test passed. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Core owns structural seam only | Avoids hidden globals and telemetry package dependency in runtime core | `plan.md`, doctrine A10/AP-11 |
| Engine owns `saga.handle` span lifecycle | One span per per-instance handle+persist unit | `plan.md`, F-13 |
| OTel adapter lives in `plugins/sagas` | Composition root already depends on `@netscript/telemetry` | `research.md`, `plan.md` |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| none | n/a | n/a |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| S1 check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-sagas-core --ext ts` | PASS | 90 files selected; 0 findings; wrapper runs `deno check --quiet --unstable-kv <files>`. |
| S1 lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin-sagas-core --ext ts` | PASS | 90 files selected; 0 findings. |
| S1 fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin-sagas-core --ext ts` | PASS | 90 files selected; 0 findings. |
| S1 telemetry test | `deno test --unstable-kv --allow-all packages/plugin-sagas-core/tests/telemetry/instrumentation_test.ts` | PASS | 1 passed, 0 failed. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-1..F-18 | PENDING_SCRIPT | Manual evidence pending final gate pass | Required by plan. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Handle span behavior | NOT_RUN | pending targeted tests | Required by S2/S3/S5. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `plugins/sagas` | NOT_RUN | pending check/tests | Required by S4/S5. |

## Handoff Notes

- Evaluator should inspect `packages/plugin-sagas-core/src/runtime/saga-engine.ts` span lifecycle and `plugins/sagas/src/telemetry/otel-saga-tracer.ts` parent-context mapping first.
