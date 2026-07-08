# IMPL-EVAL: #406 span-link fan-in for streams and sagas

**Branch**: `feat/406-telemetry-t5-span-links`  
**Base**: `c8f68721` (main)  
**Slice commit**: `52299e2e`  
**Evaluator**: IMPL-EVAL (separate session from Tier-D generator)

## Checks

### 1. Real links, not mocks (ADVERSARIAL) ✅

**Finding**: The implementation uses real SDK adapters, not test mocks.

- `createFanInLinks` (packages/telemetry/src/application/fan-in-links.ts) parses W3C traceparent and delegates to `SpanLinkPort.createLink()`
- `OtelSdkSpanLink` preserves link attributes; `OtelDenoSpanLink` drops them (Deno runtime limitation is documented)
- Both are production adapters implementing the port interface, not test-only stubs
- Tests use `InMemorySpanRecorder` (structural Tracer) + `createOtelSdkSpanLink()` to verify real link construction
- Test evidence: link attributes preserved, traceId/spanId parsed correctly from W3C traceparent

**Verdict**: PASS — no mock adapters on the real path.

### 2. DB link helper reuse ✅

**Finding**: `createFanInLinks` is the single source of truth; no per-plugin reimplementation.

- All three packages (telemetry, plugin-streams-core, plugin-sagas-core) consume `createFanInLinks` from `@netscript/telemetry`
- Saga engine constructs `SagaTraceLink` input data (traceparent + attributes) but delegates link construction to `createFanInLinks` in the tracer adapter
- No hand-rolled span link construction in individual plugins

**Verdict**: PASS — centralized helper reused correctly.

### 3. #402 convention compliance (TC-14) ✅

**Finding**: All span and link attributes follow the #402 semconv + netscript.* namespacing law.

**Streams** (packages/plugin-streams-core/src/telemetry/attributes.ts):
- Standard OTel semantic conventions: `messaging.system`, `messaging.destination.name`, `messaging.operation.name`, `messaging.operation.type`, `messaging.message.id`, `messaging.message.conversation_id`
- NetScript domain: `netscript.messaging.destination.kind`, `netscript.stream.path`, `netscript.stream.collection`, `netscript.stream.producer.id`, `netscript.correlation.id`, `netscript.outcome`

**Sagas** (packages/plugin-sagas-core/src/telemetry/attributes.ts):
- All former bare `saga.*` keys refactored to `netscript.saga.*` prefix
- Standard OTel semantic conventions: `error.type`, `messaging.destination.name`
- NetScript domain: `netscript.saga.id`, `netscript.saga.instance.id`, `netscript.saga.event.type`, `netscript.saga.attempt`, `netscript.saga.durability_tier`, `netscript.saga.correlation_key`, `netscript.job.target.id`, `netscript.idempotency.key`, `netscript.retry.max_attempts`, `netscript.concurrency.key`, `netscript.saga.scheduled_for`, `netscript.saga.delay_ms`, `netscript.saga.child.id`, `netscript.saga.child.instance.id`, `netscript.saga.compensation.reason`, `netscript.saga.compensation.cascade_size`, `netscript.outcome`, `netscript.saga.status`
- Link attributes (saga-engine.ts) use the same `SagaAttributes` map

**Test evidence**: Instrumentation tests verify link attributes match the namespaced keys.

**Verdict**: PASS — TC-14 satisfied.

### 4. Gates + hygiene ✅

**Check wrapper**: `deno check` exit 0 on all touched packages (telemetry, plugin-streams-core, plugin-sagas-core).

**Lint wrapper**: `deno lint` exit 0, 0 findings across all packages.

**Focused tests**:
- `packages/telemetry/tests/application/fan-in-links_test.ts`: 1/1 passed
- `packages/plugin-streams-core/tests/telemetry/instrumentation_test.ts`: 2/2 passed
- `packages/plugin-sagas-core/tests/telemetry/otel-saga-telemetry_test.ts`: 2/2 passed
- `packages/plugin-sagas-core/tests/telemetry/saga-engine-spans_test.ts`: 3/3 passed
- `plugins/sagas/tests/telemetry/otel-saga-tracer_test.ts`: 2/2 passed
- `plugins/sagas/tests/telemetry/publish-trace-linkage_test.ts`: 2/2 passed

Total: 12/12 green.

**Publish bar**: `deno publish --dry-run` exit 0 on telemetry, plugin-streams-core, plugin-sagas-core. No `--allow-slow-types` used. No slow types detected.

**Lock hygiene**: `git diff c8f68721..HEAD -- deno.lock` is EMPTY. Working tree churn (from `deno check` side effects) reverted before commit.

**`as` casts**: Zero new `as` casts in the diff. Only two comment lines contain the word "as" in prose (not type assertions).

**Verdict**: PASS — all gates green.

## Summary

The #406 implementation correctly adds span-link fan-in support for streams (PRODUCER/CONSUMER) and sagas (cascade join):

1. **Architecture**: Shared `createFanInLinks` helper + `SpanLinkPort` abstraction enables both providers (SDK and Deno-native) to participate without per-plugin branching.
2. **Correctness**: Real SDK adapters used; W3C traceparent parsing verified; link attributes preserved or dropped according to provider capability.
3. **Convention**: All attribute keys follow the #402 law (semconv where applicable, netscript.* for domain-specific fields).
4. **Hygiene**: No lock churn, no new `as` casts, all gates pass.

No fixes required. Ready for merge.

OPENHANDS_VERDICT: PASS
