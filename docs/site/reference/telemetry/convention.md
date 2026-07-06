# NetScript telemetry convention

This convention is the TC-1..TC-14 checklist used to grade NetScript package and plugin telemetry.
It is the contract for the beta.5 telemetry revamp; follow-on parity issues raise each package to
this checklist without redefining the rules.

## Semantic-convention opt-in

NetScript instrumentation sets and documents the OpenTelemetry opt-in value:

```text
OTEL_SEMCONV_STABILITY_OPT_IN=messaging,rpc,gen_ai_latest_experimental
```

Use OpenTelemetry semantic-convention attribute keys verbatim when a domain exists. NetScript-owned
attributes use the single proprietary root `netscript.*`. The beta.5 migration emits duplicate
deprecated aliases for one beta under the `dup` window, then the bare aliases are removed.

## Checklist

- **TC-1:** Span names use `<domain>.<operation>` from the central `SpanNames` map. RPC and GenAI
  keep their upstream semantic-convention span-name shapes.
- **TC-2:** Every emitted span declares the correct SpanKind: SERVER for ingress, CLIENT for
  outbound calls, PRODUCER/CONSUMER for messaging, and INTERNAL for local compute.
- **TC-3:** Every span records OK or ERROR status; failures record the exception before `end()`.
- **TC-4:** Lifecycle breadcrumbs use span events such as `started`, `completed`, `failed`,
  `state.before`, and `state.after`.
- **TC-5:** OpenTelemetry semantic-convention domains use upstream keys verbatim, including
  `messaging.*`, `rpc.*`, `gen_ai.*`, `db.*`, `http.*`, `server.*`, and `error.type`.
- **TC-6:** NetScript-owned attributes live under one root: `netscript.*`.
- **TC-7:** Each span carries an identity key, `netscript.correlation.id`, outcome/status, and
  retry/attempt fields when the operation is retriable.
- **TC-8:** Span attributes do not contain prompt text, PII, secrets, tokens, or raw subjects.
- **TC-9:** W3C `traceparent` and `tracestate` are extracted on ingress and injected on egress.
- **TC-10:** Subprocess propagation uses uppercase env keys: `TRACEPARENT`, `TRACESTATE`, and
  `CORRELATION_ID`.
- **TC-11:** Per-domain metrics live in the shared telemetry layer.
- **TC-12:** Enablement is decoupled from `OTEL_DENO`; disabled telemetry returns no-op tracers at
  the facade, not call-site branches.
- **TC-13:** Packages consume `@netscript/telemetry/instrumentation` instead of private tracer
  facades.
- **TC-14:** Fan-in uses span links attached at span creation time with per-message attributes.

## Attribute builders

Use `@netscript/telemetry/attributes` builders instead of hand-typed keys:

- `createJobAttributes`
- `createMessagingAttributes`
- `createSagaAttributes`
- `createTriggerAttributes`
- `createExecutionAttributes`
- `createGenAiAttributes`

During beta.5, builders emit canonical `netscript.*` keys plus deprecated bare aliases where the old
surface already shipped. New code should read and assert the canonical key.
