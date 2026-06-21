# plan.md — sagas-telemetry-spans

## Locked scope

Wire the **already-built** saga telemetry seam end to end so the deployed sagas runtime emits real
OpenTelemetry spans for every handled message, and so the API `publish` path links its span to the
engine `saga.handle` span via W3C trace-context propagation. No new telemetry vocabulary; the slice is
seam-threading + one additive seam-shape extension + an OTel adapter at the composition roots + tests.

In scope:
1. `packages/plugin-sagas-core` (ARCHETYPE-3): thread an optional `SagaInstrumentation` through
   `SagaEngineOptions`, `SagaBusBridgeOptions`, `SagaRuntimeNativeOptions`/`createNativeBus`; emit a
   `saga.handle` span around the handler+persist sequence in `SagaEngine.#handleEntry`, activating the
   parent context derived from `message.traceparent`/`tracestate`; record `state.before`/`state.after`
   events and finish with `success`/`error` outcome + `recordHandleDuration`.
2. Seam extension (locked): add optional `parent?: { traceparent?: string; tracestate?: string }` to
   `SagaTelemetryTracer.startSpan` options and to `SagaInstrumentation.startHandleSpan` input, so an
   OTel tracer can root the engine span under the propagated context. NOOP tracer ignores it.
3. `plugins/sagas` (SCOPE-service): add an OTel-backed `SagaTelemetryTracer` adapter
   (`createOtelSagaTracer`) and a `createSagaTelemetry()` factory that returns a `SagaInstrumentation`
   wired to `getSagaTracer()`; inject it at all three composition roots (service `main.ts`,
   `saga-runner`, `saga-supervisor` default).
4. `plugins/sagas/services` (SCOPE-service): in the `publish` oRPC handler, activate the OTel context
   (extracted from the inbound trace headers) around `runtime.publish` so the server span parents the
   engine span; keep the SSE event headers as-is (already correct as breadcrumb data).

Out of scope (explicitly deferred — safe):
- Metrics emission beyond `recordHandleDuration` on the handle path (compensation/dlq/idempotency/
  concurrency counters require their own runtime wiring; the seam methods exist but their call sites
  belong to sibling slices). Defer — does not force rework: adding a meter later is purely additive on
  the same `SagaInstrumentation`.
- Cascade spans (`saga.cascade.*`) — bridge/scheduler/compensator instrumentation. Defer to a follow-up
  cascade-telemetry slice; the seam methods already exist and are unaffected by handle-span wiring.
- Touching `packages/aspire/src/public/mod.ts`, `scaffold-versions.ts`, version pins (forbidden).

## Archetype + overlays

- Primary: **ARCHETYPE-3** (runtime/stateful) for `@netscript/plugin-sagas-core`. F-13 applies.
- Overlay: **SCOPE-service** for `plugins/sagas/services` composition root + oRPC publish handler.

## Design

### Contract-first

**(C1) Seam shape extension (plugin-sagas-core/src/telemetry/instrumentation.ts):**
```ts
/** W3C parent trace context optionally carried into a saga span. */
export type SagaTraceParent = Readonly<{ traceparent?: string; tracestate?: string }>;

export interface SagaTelemetryTracer {
  startSpan(
    name: string,
    options: Readonly<{
      kind: SagaTelemetrySpanKind;
      attributes?: SagaTelemetryAttributes;
      parent?: SagaTraceParent;   // NEW — optional, NOOP ignores it
    }>,
  ): SagaTelemetrySpan;
}

export type SagaHandleSpanInput = Readonly<{
  sagaId: string; instanceId?: string; eventType: string; attempt: number;
  durabilityTier: SagaDurabilityTier; correlationKey?: string;
  parent?: SagaTraceParent;        // NEW — optional
}>;
```
`SagaInstrumentation.startHandleSpan` forwards `input.parent` into `tracer.startSpan(..., { parent })`.
`NOOP_TRACER.startSpan` keeps ignoring all options. Additive only; no removed/renamed symbols.

**(C2) Engine option (plugin-sagas-core/src/runtime/saga-engine.ts):**
```ts
export type SagaEngineOptions = Readonly<{
  id?: string;
  defaultRetryPolicy?: RetryPolicy;
  store?: SagaStorePort;
  instrumentation?: SagaInstrumentation;   // NEW — defaults to NOOP SagaInstrumentation
}>;
```
Constructor: `this.#instrumentation = options.instrumentation ?? new SagaInstrumentation();`
(import from `../telemetry/mod.ts`). NOOP-safe by default → zero behavior change when unwired.

**(C3) Bridge + runtime options:** `SagaBusBridgeOptions` and `SagaRuntimeNativeOptions` each gain
`instrumentation?: SagaInstrumentation`. `createNativeBus` passes
`options.instrumentation` into `createSagaEngine({ ..., instrumentation })` (when no pre-built
`engine` is supplied) and into the bridge. The bridge holds it for the (deferred) cascade spans but
must thread it to the engine it builds; for this slice the engine is the span owner.

**(C4) OTel adapter (plugins/sagas — new file, e.g. `plugins/sagas/src/telemetry/otel-saga-tracer.ts`):**
```ts
import { createSpan, getSagaTracer, SpanKind, SpanStatusCode } from '@netscript/telemetry/tracer';
import { extractFromTraceContext } from '@netscript/telemetry/context';
import {
  createSagaInstrumentation, type SagaInstrumentation, type SagaTelemetrySpan,
  type SagaTelemetryTracer,
} from '@netscript/plugin-sagas-core/telemetry';

export function createOtelSagaTracer(): SagaTelemetryTracer { /* maps kind→SpanKind, parent→Context via extractFromTraceContext, returns createSpan(...) wrapped as SagaTelemetrySpan */ }
export function createSagaTelemetry(): SagaInstrumentation {
  return createSagaInstrumentation({ tracer: createOtelSagaTracer() });
}
```
The adapter maps the structural `SagaTelemetrySpan` onto the OTel `Span` (setAttribute, addEvent,
setStatus ok/error → `SpanStatusCode`, recordException, end). For `parent`, it builds an OTel
`Context` via `extractFromTraceContext({ traceparent, tracestate })` and passes it as
`createSpan(..., { parentContext })` so the span links remotely. Internal composition-root code; not
exported from any published `@netscript/*` root barrel.

**(C5) API publish trace linkage (v1-handlers.ts publish handler):** wrap the `runtime.publish` call
in the active OTel context extracted from the inbound headers, using
`getParentContextFromHeaders`/`extractFromTraceContext` + `context.with`, OR simpler: since the engine
adapter already re-parents from `message.traceparent`, ensure the handler propagates the *current*
server span's trace context into `message.traceparent` (it already does via `getTraceContext()` →
`traceContextToHeaders` → message fields at `v1-handlers.ts:219-220`). The required change is to make
the engine span use that as parent (covered by C1/C4). Add an assertion-backed test that the engine
span's parent traceId equals the API server span's traceId. No SSE event shape change.

### Span lifecycle in `SagaEngine.#handleEntry` (saga-engine.ts:197-252)

Replace the bare handler invocation with an instrumented sequence (still per-instance serial, inside
`#withConcurrency`):
1. Build `SagaHandleSpanInput` from `entry.sagaId`, resolved `instanceId`, `message.type`, `attempt`,
   `entry.definition.durability`, `correlationKey`, and `parent: { traceparent: message.traceparent,
   tracestate: message.tracestate }`.
2. `const span = this.#instrumentation.startHandleSpan(input);`
3. `this.#instrumentation.recordStateBefore(span, { 'saga.status': loaded?.metadata.status })`.
4. Run handler + `#persistTransition` inside `try`. On success:
   `recordStateAfter(span, { 'saga.status': status })`, then
   `finishSpan(span, outcomeFromStatus(status))` where compensating/failed→`COMPENSATED`/`ERROR`,
   else `SUCCESS`; `recordHandleDuration({ ...input, outcome, durationMs })`.
5. On thrown error: `finishSpan(span, ERROR, error)` (records exception + error status) then rethrow,
   and `recordHandleDuration` with `outcome: ERROR`. Use a `try/finally` so the span always ends.
6. Duration measured with `performance.now()` deltas.

Behavior is unchanged when instrumentation is the NOOP default (all calls are no-ops). The handler
result, persistence, retry classification, and concurrency semantics are untouched.

### Production/enterprise bar

- Real observability: spans are emitted by the **deployed** runtime (service main.ts injects the OTel
  adapter), not just in tests. Parent linkage proven by test. Error path records exceptions + ERROR
  status. Duration histogram recorded.
- No stubs/no-ops left advertised: the `main.ts` header "OpenTelemetry tracing" becomes true at the
  composition root. NOOP remains only as the *unconfigured default* (correct: a library default with
  no observability backend must be inert, not crash).
- Graceful: spans end in `finally`; no span leak on throw. No new failure modes (NOOP-safe default).

## Commit slices (ordered, each independently gate-able)

**S1 — Seam shape extension + engine instrumentation field (plugin-sagas-core).**
- Edit `src/telemetry/instrumentation.ts` (add `SagaTraceParent`, `parent?` on tracer options +
  `SagaHandleSpanInput`, forward in `startHandleSpan`; NOOP unchanged), `src/telemetry/mod.ts`
  (export `SagaTraceParent` type).
- Edit `src/runtime/saga-engine.ts`: add `instrumentation?` to `SagaEngineOptions`, store
  `#instrumentation` with NOOP default, import `SagaInstrumentation`.
- Proves: seam accepts a parent + engine holds instrumentation; no behavior change.
- Gate: `deno run -A .llm/tools/run-deno-check.ts --root packages/plugin-sagas-core --ext ts`
  (or `deno check --unstable-kv` on the package mod set); `run-deno-lint.ts`; `run-deno-fmt.ts`.
  Targeted: `deno test --unstable-kv --allow-all packages/plugin-sagas-core/tests/telemetry`.

**S2 — Emit `saga.handle` span in engine handle path (plugin-sagas-core).**
- Edit `src/runtime/saga-engine.ts:197-252` `#handleEntry` to start/finish the span, record
  state.before/after, duration, outcome, parent from message trace context (Design above).
- Proves: every handled message produces one `saga.handle` span with correct attributes + parent +
  outcome; error path records exception; NOOP default keeps existing tests green.
- Gate: package check/lint/fmt; new unit test `tests/telemetry/saga-engine-spans_test.ts` using a
  recording `SagaTelemetryTracer` double (assert span name, attributes, events, outcome, error span,
  parent forwarded). Re-run existing `tests/runtime/*` to prove no regression. F-13 invariant manual
  evidence: span wraps the per-instance serial handle+persist unit.

**S3 — Thread instrumentation through bridge + runtime composition (plugin-sagas-core).**
- Edit `src/adapters/saga-bus-bridge.ts` (`SagaBusBridgeOptions.instrumentation?`, hold it) and
  `src/runtime/create-saga-runtime.ts` (`SagaRuntimeNativeOptions.instrumentation?`, pass into
  `createSagaEngine` and `createSagaBusBridge`).
- Proves: a `SagaInstrumentation` supplied to `createSagaRuntime({ native: { instrumentation } })`
  reaches the engine.
- Gate: package check/lint/fmt; unit test that an injected recording instrumentation receives a
  handle span after `runtime.publish` of a registered message.

**S4 — OTel adapter + composition-root injection (plugins/sagas).**
- Add `plugins/sagas/src/telemetry/otel-saga-tracer.ts` (`createOtelSagaTracer`,
  `createSagaTelemetry`) wrapping `getSagaTracer()` + `extractFromTraceContext` + `createSpan`.
- Inject at `plugins/sagas/services/src/main.ts:63` (`createSagaRuntime({ adapter: 'native', native: { instrumentation: createSagaTelemetry() } })`),
  `plugins/sagas/src/runtime/saga-runner.ts` default `runtimeOptions.native.instrumentation`, and
  `plugins/sagas/src/runtime/saga-supervisor.ts` `createDefaultRuntime` default.
- Proves: deployed runtime emits real OTel spans; "OpenTelemetry tracing" header is now accurate.
- Gate: `run-deno-check.ts --root plugins/sagas`; lint; fmt; unit test for the adapter mapping
  (kind→SpanKind, parent→remote context, status/exception) using a fake OTel tracer or the real
  in-memory exporter from `@netscript/telemetry` test utils if available, else assert the adapter
  produces a `SagaTelemetrySpan` whose operations delegate.

**S5 — API publish → engine trace linkage + integration test (plugins/sagas/services).**
- Confirm/adjust `v1-handlers.ts` publish handler so the inbound trace context propagated onto the
  message parents the engine span (server span → `saga.handle` child); add an integration test that
  publishes through a runtime built with `createSagaTelemetry()` against an in-memory OTel exporter and
  asserts the `saga.handle` span shares the server span's traceId and is a child of it. Failure-path
  test: a throwing handler yields an ERROR-status span with the recorded exception.
- Proves: end-to-end API→engine trace continuity (gap 3 closed) and failure-path observability.
- Gate: `run-deno-check.ts --root plugins/sagas`; lint; fmt; the new integration test. **No scaffold
  output changes → `e2e:cli` NOT required.**

(5 commit slices, < 30. No scaffold/Prisma/registry output changes, so the expensive
`scaffold.runtime` e2e gate is out of scope for this slice.)

## Gates to run (per slice above; summary)

- Static (every slice): `.llm/tools/run-deno-check.ts` (with `--unstable-kv` for workspace KV code),
  `.llm/tools/run-deno-lint.ts`, `.llm/tools/run-deno-fmt.ts` scoped to the touched roots, `--ext ts`.
- Targeted tests: new telemetry unit tests (`packages/plugin-sagas-core/tests/telemetry/`) and the
  `plugins/sagas` adapter + integration tests; re-run existing `packages/plugin-sagas-core/tests/runtime/*`.
- Fitness (Archetype 3, manual/PENDING_SCRIPT evidence): F-1 file-size, F-3 layering (seam stays in
  `telemetry/`, OTel adapter stays in plugins/sagas composition root), F-5 public-surface (additive
  optional fields only), F-6 JSR publishability (no slow types introduced — see jsr-audit below),
  F-13 saga/runtime invariants (span wraps per-instance handle unit), F-15/F-18 (no upstream re-export
  / sub-barrel from published roots).
- `e2e:cli`: **not required** (no scaffold/DB/registry/Aspire output change).

## jsr-audit (planned public surface)

- `@netscript/plugin-sagas-core` published surface change is **additive optional fields** on existing
  exported option types (`SagaEngineOptions`, `SagaBusBridgeOptions`, `SagaRuntimeNativeOptions`,
  `SagaHandleSpanInput`, `SagaTelemetryTracer`) plus one new exported type `SagaTraceParent` on the
  `./telemetry` subpath. All concrete types; no inferred/slow types; no `any`. `SagaInstrumentation`
  field type is the already-exported class. No private-type-ref risk: every new symbol is exported
  from `./telemetry`. Full export-map lint (per harness lesson) applies to `./telemetry`.
- The OTel adapter is **not** part of any `@netscript/*` published surface (plugins/sagas deployable),
  so it carries no JSR slow-type obligation.
- Verdict: publishable; no slow-type or surface risk introduced.

## @netscript/cli ordering

Untouched. `@netscript/cli` still publishes last; not in this slice.