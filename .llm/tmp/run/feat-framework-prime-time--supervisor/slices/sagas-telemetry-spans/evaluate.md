# IMPL-EVAL: sagas-telemetry-spans

**Verdict**: PASS

## Evaluation Summary

All required gates pass. The implementation correctly wires end-to-end OpenTelemetry spans for handled saga messages with W3C trace context propagation, and the rebase correctly integrates the applied-key idempotency guard with the telemetry span lifecycle.

## Implementation Audit

### Files Implemented
- `packages/plugin-sagas-core/src/runtime/saga-engine.ts`: creates `saga.handle` span per handled message
- `packages/plugin-sagas-core/src/telemetry/instrumentation.ts`: defines vendor-neutral instrumentation seam
- `plugins/sagas/src/telemetry/otel-saga-tracer.ts`: OTel-backed tracer adapter
- `plugins/sagas/services/src/main.ts`: wires instrumentation in service composition root
- `plugins/sagas/src/runtime/saga-supervisor.ts`: wires instrumentation in supervisor default runtime
- `plugins/sagas/src/runtime/create-durable-saga-runtime.ts`: forwards instrumentation to engine

## Static Gate Evidence

| Gate | Command | Result |
|------|---------|--------|
| Type check (plugin-sagas-core) | `deno run -A .llm/tools/run-deno-check.ts --root packages/plugin-sagas-core` | 96 files, 0 occurrences |
| Type check (plugins/sagas) | `deno run -A .llm/tools/run-deno-check.ts --root plugins/sagas` | 66 files, 0 occurrences |
| Lint | `deno task check` | PASS |
| Fmt | `deno fmt --check` | PASS |
| Tests (plugin-sagas-core) | `deno test --allow-all --unstable-kv packages/plugin-sagas-core/` | 29/29 passed |
| Tests (plugins/sagas) | `deno test --allow-all --unstable-kv plugins/sagas/` | 25/25 passed |

## Fitness Gate Evidence

### F-3: Ports
✓ The instrumentation seam is injected via `SagaEngineOptions.instrumentation` (saga-engine.ts:18-20)
✓ `SagaRuntimeNativeOptions.instrumentation` threads through to engine (create-saga-runtime.ts:36)
✓ `SagaBusBridgeOptions.instrumentation` for deferred cascade spans (create-saga-runtime.ts:113)

### F-5: State & Lifecycle
✓ SagaEngine lifecycle unchanged (start/stop/noop pattern)
✓ Applied-key guard preserved at saga-engine.ts:224-235 (runs BEFORE span creation)
✓ Handler executes inside span (saga-engine.ts:263-269)
✓ State transitions persist inside span (saga-engine.ts:274-295)
✓ Span ends in finally block (saga-engine.ts:330-333)

### F-6: Runtime Invariants
✓ Default instrumentation is NOOP (create-saga-runtime.ts:104)
✓ No behavior change when instrumentation is absent
✓ All existing runtime/* tests pass unchanged (regression guard)

### F-13: Saga Runtime
✓ One `saga.handle` span per handled message (saga-engine.ts:263)
✓ Parent trace context propagated from message.traceparent/tracestate (saga-engine.ts:258-260)
✓ Span attributes: sagaId, instanceId, eventType, attempt, durabilityTier, correlationKey (saga-engine.ts:250-261)
✓ State events: state.before and state.after recorded (saga-engine.ts:264-266, 296-298)
✓ Handler errors: span status ERROR + recordException (saga-engine.ts:318-329)
✓ Duration recorded on finally (saga-engine.ts:330-333)

### F-15: Diagnostics
✓ Structural span vocabulary (SagaSpanNames, SagaAttributes) exported
✓ Vendor-neutral seam in plugin-sagas-core
✓ OTel adapter in plugins/sagas (composition root, not a published export)

### F-18: Service Composition
✓ `plugins/sagas/services/src/main.ts` wires createSagaTelemetry() into runtimeOptions (line 63 per plan-meta)
✓ Publish handler propagates traceparent/tracestate from HTTP headers to message (verified in publish-saga-message.ts)
✓ Integration test confirms API span → saga.handle span parent-child linkage with shared traceId

## Telemetry + Idempotency Integration

### Critical Ordering Verified
```
saga-engine.ts:213-236 (in #handleEntry):
  1. Resolve instanceId (line 220-221)
  2. Load state from store (line 222-223)
  3. **Applied-key guard** (line 224-235):
     - If idempotencyKey present:
       - Call appliedKeys.recordApplied(instanceId, idempotencyKey)
       - If already applied: return early with alreadyApplied=true
       - **NO span created, NO handler invoked, NO persist**
  4. Clone previous state (line 238)
  5. Build context with traceparent/tracestate (line 248-249)
  6. **Start saga.handle span** (line 263):
     - Parent context from message.traceparent/tracestate
     - Attributes: sagaId, instanceId, eventType, attempt, durabilityTier, correlationKey
  7. Execute handler (line 269)
  8. Persist transition (line 274-295)
  9. End span in finally (line 330-333)
```

✓ Idempotency guard runs BEFORE span creation (correct: duplicate messages skip telemetry)
✓ Accepted messages run the guarded transition INSIDE the `saga.handle` span (correct: span wraps handler+persist)
✓ No dropped applied-key guards during rebase (verified at saga-engine.ts:224-235)
✓ No broken spans: span lifecycle is create → execute → persist → end (verified in finally block)

## Test Coverage

### Unit Tests (plugin-sagas-core)
- `tests/telemetry/instrumentation_test.ts`: SagaInstrumentation.startHandleSpan forwards parent to tracer ✓
- `tests/telemetry/saga-engine-spans_test.ts`:
  - Engine emits one successful saga.handle span ✓
  - Engine records ERROR span + rethrows on handler error ✓
  - createSagaRuntime threads instrumentation to engine ✓
- `tests/runtime/*`: 29/29 existing tests pass (NOOP default regression guard) ✓

### Integration Tests (plugins/sagas)
- `tests/telemetry/otel-saga-tracer_test.ts`: OTel adapter maps kind→SpanKind, parent→Context, setStatus→StatusCode ✓
- `tests/telemetry/publish-trace-linkage_test.ts`:
  - Publish API propagates trace headers as saga.handle parent ✓
  - Throwing handler yields ERROR span ✓
- `tests/services/publish-message_test.ts`: publish contract round-trips idempotencyKey ✓
- `src/runtime/*`: 25/25 tests pass (store, supervisor, restart, idempotency, applied-keys) ✓

## Rebase Drift Analysis

The rebase onto `feat-framework-prime-time` (merge-base 9b3bde45) integrated:
- #74 SagaStorePort seam (no conflict: store injection unchanged)
- #75 sagas-idempotency-e2e (correct: applied-key guard preserved at saga-engine.ts:224-235)
- #78, #79, #80 (no conflict: unrelated slices)

**Integration correctness**: The applied-key guard from #75 and the telemetry spans from this slice compose correctly:
- Guard runs BEFORE span creation (line 224 < line 263)
- Guard short-circuits duplicate messages (line 226-234 returns early)
- Accepted messages proceed to span creation (line 263)
- No dropped guards, no broken spans

## Architecture Debt

**No new debt introduced.** All locked decisions honored:
- Seam ownership: telemetry seam in plugin-sagas-core, OTel adapter in plugins/sagas ✓
- Span owner: SagaEngine creates/ends saga.handle span ✓
- NOOP default: unwired usage is inert ✓
- Parent context extension: additive, no seam breakage ✓
- Injection points: service + supervisor + durable-runtime all wire via runtimeOptions ✓
- Metrics scope: recordHandleDuration on handle path only (counters/cascade spans deferred) ✓

## Risks Realized

**None.** All mitigations held:
- Active-context propagation: adapter uses createSpan + manual end, parent linkage via remote Context (not ambient activation) ✓
- Behavior change risk: NOOP default, regression tests pass ✓
- JSR slow-type risk: SagaTraceParent is concrete, no inference ✓
- Double-instrumentation: only SagaEngine creates handle span, bridge holds instrumentation for deferred cascade spans ✓

## Conclusion

The implementation is **complete and correct**. All required static, fitness, and runtime gates pass. The telemetry seam is wired end-to-end with W3C trace context propagation. The rebase correctly integrated the applied-key idempotency guard with the telemetry span lifecycle (guard before span, accepted messages inside span). No architecture debt, no dropped guards, no broken spans.

**Verdict: PASS**
