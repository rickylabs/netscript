# research.md — sagas-telemetry-spans

## Slice scope (from blocker_slices.json key `sagas-telemetry-spans`)

Title: "Saga telemetry seam + handle-path spans + API publish trace linkage".
Severity: blocker. Wave A. Units: `plugins/sagas`, `packages/telemetry` (and, per ground truth below,
`packages/plugin-sagas-core`, which owns the seam the gaps describe). `dependsOn: []`.

Three gaps:
- `observability-continuity-saga-runtime-no-telemetry-seam` (high, unwired-root)
- `observability-continuity-saga-engine-no-spans` (blocker, inert-surface)
- `observability-continuity-saga-publish-event-no-trace-linkage` (medium, partial)

## Ground-truth verification (current main, this worktree)

All cited evidence re-verified against current code. Line numbers confirmed/updated below.

### Gap 1 — no tracer/instrumentation injection point (CONFIRMED)
- `packages/plugin-sagas-core/src/runtime/saga-engine.ts:51-55` — `SagaEngineOptions = { id?, defaultRetryPolicy?, store? }`. **No `instrumentation`/`tracer` field.** Confirmed.
- `packages/plugin-sagas-core/src/runtime/saga-engine.ts:74-78` — constructor stores `id`, `#retryPolicy`, `#store` only. No instrumentation field. Confirmed.
- `packages/plugin-sagas-core/src/runtime/create-saga-runtime.ts:24-33` — `SagaRuntimeNativeOptions` has `id, engine, engineOptions, scheduler, compensator, store, resolveCompensation, idempotency`. **No instrumentation.** Confirmed.
- `packages/plugin-sagas-core/src/runtime/create-saga-runtime.ts:89-102` — `createNativeBus` builds engine + bridge; threads no tracer. Confirmed.
- `packages/plugin-sagas-core/src/adapters/saga-bus-bridge.ts:27-34` — `SagaBusBridgeOptions` has `id, engine, scheduler, compensator, resolveCompensation, idempotency`. **No instrumentation.** Confirmed.
- `plugins/sagas/services/src/main.ts:11-12` — header advertises "OpenTelemetry tracing" and "Prisma store for durable saga state"; `main.ts:63` calls `createSagaRuntime({ adapter: 'native' })` with no tracer. Confirmed (line 63 exact).
- `packages/plugin-sagas-core/src/telemetry/instrumentation.ts:150-168` — `SagaInstrumentation` + `startHandleSpan` exist; `NOOP_TRACER` default at 140-147. Confirmed.

### Gap 2 — engine handle path emits no spans; trace context dead-ends (CONFIRMED)
- `packages/plugin-sagas-core/src/runtime/saga-engine.ts:1-22` — imports only domain + ports; **no telemetry import.** Confirmed.
- `packages/plugin-sagas-core/src/runtime/saga-engine.ts:214-225` — `SagaContext` is built with `traceparent: message.traceparent`, `tracestate: message.tracestate` (lines 222-223); handler invoked at line 225. **No span created or activated** around the handler. Confirmed (cited 222-225; exact).
- `packages/plugin-sagas-core/src/runtime/saga-engine.ts:290-291` — `#persistTransition` copies `traceparent`/`tracestate` into the persisted `SagaStateMetadata` as **data only**, never an active span parent. Confirmed.
- `packages/plugin-sagas-core/src/adapters/saga-bus-bridge.ts:189-197` — `withPublishOptions` forwards `traceparent`/`tracestate` as message fields; zero span creation. Confirmed.
- Grep `SagaInstrumentation|startHandleSpan|SagaTelemetryTracer|getSagaTracer` across `packages/plugin-sagas-core/src` and `plugins/sagas`: **matches only inside `src/telemetry/{instrumentation,mod}.ts`** (the seam itself). Zero call sites elsewhere. The seam is fully inert. Confirmed via Grep.
- Grep `@netscript/telemetry` in `packages/plugin-sagas-core`: **no matches** — the core package does not (yet) import the OTel facade. Confirmed.

### Gap 3 — API publish records trace headers as opaque data; no span bridges API→engine (CONFIRMED, line shift)
- `plugins/sagas/services/src/routers/v1-handlers.ts:130-136` — `publish` handler reads `getTraceContext()`, converts to plain headers via `traceContextToHeaders`, forwards to `publishSagaMessage`; **never activates a span/context** around the call. Confirmed (exact 130-136).
- `plugins/sagas/services/src/routers/v1-handlers.ts:223-233` — `runtime.publish(message, {traceparent, tracestate})` (223-226) then the `saga:message_received` SSE event embeds trace headers in `data.headers` as plain JSON (228-233). Observability-as-data. Confirmed (cited 228-233; the publish call is 223-226 — slightly shifted from the evidence's 213-226 range but same function).
- `plugins/sagas/services/src/main.ts:58` — `.withRPC({ traceContext: true })` establishes the server span; the native runtime built at `main.ts:63` emits no child saga span. Confirmed.

**No gap in this slice is already resolved on main. All three stand.**

## Existing reusable contracts / APIs (wrap, do not reinvent)

### The seam already exists in plugin-sagas-core (vendor-neutral, NOOP default)
`packages/plugin-sagas-core/src/telemetry/instrumentation.ts` + `attributes.ts` ship a complete,
documented, dependency-free structural telemetry boundary:
- `SagaTelemetrySpan` (setAttribute/addEvent/setStatus/recordException/end) — interface.
- `SagaTelemetryTracer.startSpan(name, { kind, attributes })` — structural tracer interface.
- `SagaInstrumentation` class: `startHandleSpan(SagaHandleSpanInput)`, `recordStateBefore/After`,
  `finishSpan(span, outcome, error?)`, plus `recordHandleDuration`, `recordCompensation`,
  `recordConcurrencyThrottled`, etc. Defaults to `NOOP_TRACER`/no meter.
- `SagaSpanNames.HANDLE = 'saga.handle'`, canonical `SagaAttributes` (saga.id, saga.instance.id,
  saga.event.type, saga.attempt, saga.durability_tier, saga.correlation_key, outcome, error_class),
  `SagaTelemetryOutcomes` (success/error/compensated/skipped), `SagaSpanEvents` (state.before/after),
  `SagaMetricNames`. Exported from `@netscript/plugin-sagas-core/telemetry` (deno.json `./telemetry`).

This is the **single most important reuse**: the seam is built and JSR-published; the slice only has
to (a) thread it into the engine/bridge/runtime options and (b) supply a real (OTel-backed) tracer
adapter at the composition roots. No new attribute/span vocabulary is needed.

### Real OTel facade lives in @netscript/telemetry
- `packages/telemetry/src/core/tracer.ts:102-104` — `getSagaTracer()` returns the cached
  `@netscript/saga` OTel `Tracer` (`TracerNames.SAGA`). Exported via `@netscript/telemetry/tracer`.
- `packages/telemetry/src/core/span.ts:32-62` — `withSpan(tracer, name, fn, { kind, attributes, parentContext })`
  starts a span, **activates it via `context.with(trace.setSpan(...))`**, sets OK/ERROR status,
  records exceptions, ends in `finally`. This is the correct primitive for active-context spans.
- `packages/telemetry/src/core/span.ts:14-27` — `createSpan(tracer, name, { kind, attributes, parentContext })`
  for the manual start/finish path the structural seam uses.
- `packages/telemetry/src/context/w3c.ts:120-162` — `extractContext(headers)` and
  `extractFromTraceContext({ traceparent, tracestate })` build an OTel `Context` from W3C headers
  (handles remote span context). This is how the engine's `message.traceparent` string becomes an
  active parent context so the engine span links under the API server span.
- `packages/telemetry/context.ts` re-exports `getTraceContext` (= `resolveTraceContext`) and
  `getParentContextFromHeaders` (= `extractContext`).
- `SpanKind` / `SpanStatusCode` from `@netscript/telemetry/tracer` (`src/core/types.ts:106-139`).

### plugins/sagas already imports @netscript/telemetry
`plugins/sagas/deno.json` maps `@netscript/telemetry` → `../../packages/telemetry/mod.ts` and
`@netscript/telemetry/context` → `../../packages/telemetry/context.ts`. v1-handlers already uses
`getTraceContext` from `@netscript/telemetry/context` (`v1-handlers.ts:5`). So the OTel adapter and
publish-span wiring can live in `plugins/sagas` with **no new dependency**.

### Composition roots that must inject the seam (all 3 thread runtimeOptions verbatim)
- `plugins/sagas/services/src/main.ts:63` — `createSagaRuntime({ adapter: 'native' })` (HTTP service).
- `plugins/sagas/src/runtime/saga-supervisor.ts:66-68,121-125` — `createDefaultRuntime(runtimeOptions ?? {})`
  forwards verbatim into `createSagaRuntime`.
- `plugins/sagas/src/runtime/saga-runner.ts:62-69` — `SagaRuntimeSupervisor({ runtimeOptions: { ...options.runtimeOptions, adapter } })`.
  Because the supervisor/runner already pass `runtimeOptions` straight through, adding
  `instrumentation` to `SagaRuntimeNativeOptions` automatically reaches the standalone runner once the
  runner default supplies it.

### Domain already carries trace context
- `packages/plugin-sagas-core/src/domain/saga-context.ts:6-16` — `SagaContext` has `traceparent?`,
  `tracestate?`. `saga-message.ts:12-13` — `SagaMessage` has `traceparent?`, `tracestate?`.
  `saga-state.ts:13-14` — `SagaStateMetadata` persists them. The data already flows; only the active
  span is missing.
- `SagaDefinition.durability: SagaDurabilityTier` (`saga-definition.ts:46`) supplies the
  `saga.durability_tier` attribute for `SagaHandleSpanInput.durabilityTier`.

## Doctrine constraints

- `docs/architecture/doctrine/08-runtime-state-failure.md:191-198` — error normalization: the
  normalized record is what telemetry consumes; handlers never log raw errors. Spans must
  `recordException` on the structured error, not stringify ad hoc beyond message.
- `docs/architecture/doctrine/08-runtime-state-failure.md:237-248` (`@netscript/sagas` example) —
  saga doctrine deltas (compensation first-class, AbortSignal propagation, terminal-phase fitness).
  Telemetry is consistent with "structurally on the right track"; this slice closes the inert-surface.
- F-13 (saga/runtime invariants) is `required` for Archetype 3. The handle span must wrap the
  handler+persist sequence per saga instance (per-instance serial concurrency, doctrine §Concurrency),
  so one span = one handled message for one instance.
- F-15 re-export-upstream lint, F-18 sub-barrel lint: the OTel adapter in `plugins/sagas` must not be
  re-exported from a published root barrel of a `@netscript/*` package (plugins/sagas is the deployable,
  not a published library surface here). The seam stays in `plugin-sagas-core/telemetry`.

## Debt / surface implications

- **No new public type budget pressure on `plugin-sagas-core` root.** The seam is already exported on
  the `./telemetry` subpath; we add `instrumentation?` fields to existing option types
  (`SagaEngineOptions`, `SagaRuntimeNativeOptions`, `SagaBusBridgeOptions`) — additive optional fields,
  no new exported symbols required beyond what `./telemetry` already exposes.
- The OTel→seam adapter (`createOtelSagaTracer` / `createSagaTelemetry`) is **new code in
  `plugins/sagas`** (composition root). It is internal wiring, not a published library API, so it does
  not enlarge any `@netscript/*` JSR surface.
- One **contract extension** is required on the seam to carry parent trace context into the tracer:
  `SagaTelemetryTracer.startSpan` options gain an optional `parent?: SagaTraceParent` field
  (`{ traceparent?: string; tracestate?: string }`). This is additive/optional; NOOP tracer ignores
  it. Without it, an OTel adapter cannot link the engine span under the API/server span (the
  structural seam currently has no way to receive the W3C parent). This is the only seam-shape change
  and it must be locked now (deferring it forces engine + adapter rework).