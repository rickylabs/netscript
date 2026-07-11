# @netscript/telemetry

[![JSR](https://jsr.io/badges/@netscript/telemetry)](https://jsr.io/@netscript/telemetry)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**OpenTelemetry tracing for NetScript, structured as ports and adapters: domain tracers, W3C context
propagation across job subprocesses, fan-in span links, first-party oRPC and Hono instrumentation,
and a telemetry query read model — all linking scheduler, queue, worker, RPC, and SSE spans into one
distributed trace.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/telemetry

# Node.js / Bun
npx jsr add @netscript/telemetry
bunx jsr add @netscript/telemetry
```

### Usage

```typescript
import { getJobTracer, withSpan } from '@netscript/telemetry/tracer';

// Run async work inside a span on the job-domain tracer.
const records = await withSpan(
  getJobTracer(),
  'job.import',
  async (span) => {
    span.setAttribute('netscript.job.source', 'erp-sync');
    return await importRecords();
  },
);
```

To continue a worker's trace inside a spawned job subprocess, extract the propagated context at the
start of the job script:

```typescript
import { initJobTracing } from '@netscript/telemetry';
import { getJobTracer, withSpan } from '@netscript/telemetry/tracer';

const parentContext = initJobTracing();

await withSpan(
  getJobTracer(),
  'job.main',
  async (span) => {
    span.setAttribute('netscript.job.step', 'processing');
    // ... job logic
  },
  { parentContext: parentContext ?? undefined },
);
```

---

## 🧭 Architecture: telemetry port/adapters

The package separates **ports** (what NetScript code programs against) from **adapters** (what
actually emits telemetry). `@netscript/telemetry/otel` exposes the port contracts —
`TracerProviderPort`, `MeterPort`, `PropagatorPort`, `SpanLinkPort`, `TelemetryQueryPort` — plus two
provider adapters:

- `OtelDenoTracerProvider` (default) — binds to Deno's built-in OTLP exporter (`OTEL_DENO=true`), so
  tracing works with zero SDK dependencies.
- `OtelSdkTracerProvider` — an opt-in binding for apps that bring the OpenTelemetry JS SDK
  (`SdkBinding`), which also unlocks attribute-preserving span links.

`createTelemetryProvider` selects a provider adapter (Deno-native by default, SDK-backed when
requested); application code only ever sees the port types.

---

## 📦 Key Capabilities

- **Domain tracers**: `getQueueTracer`, `getWorkerTracer`, `getSchedulerTracer`, `getJobTracer`,
  `getSagaTracer`, `getSSETracer`, and `getKVTracer` return cached, canonically named tracers so
  spans group by NetScript subsystem.
- **W3C context propagation**: `injectContext`/`extractContext` carry trace context through message
  headers, and `createJobTraceEnv`/`extractJobTraceContext` thread it across `Deno.Command` job
  subprocesses.
- **Fan-in span links**: `createFanInLinks` turns upstream message `traceparent`/`tracestate`
  headers into span links through the active provider's `SpanLinkPort`, so many producer traces link
  into one consumer span (the Flow-B grouped trace shape) instead of being re-parented.
- **Span helpers**: `withSpan`, `withSpanSync`, `createSpan`, and `addSpanEvent` wrap
  OpenTelemetry-compatible `Span` and `Context` types so callers never touch the raw SDK.
- **First-party oRPC instrumentation**: `@netscript/telemetry/orpc` ships a `TracingPlugin` backed
  by the upstream `@orpc/otel` `ORPCInstrumentation` (plus `registerORPCInstrumentation` and an
  `ErrorHandlingPlugin`), so RPC server spans follow upstream semconv `rpc.*` conventions.
- **First-party Hono instrumentation**: `@netscript/telemetry/hono` exposes
  `createHonoTracingMiddleware`, which wraps Hono's first-party `@hono/otel`
  `httpInstrumentationMiddleware` and layers NetScript service naming and W3C propagation on top.
- **Worker/job/queue instrumentation**: `@netscript/telemetry/instrumentation` provides
  `traceJobExecution`, `traceQueue`, scheduler tick/dispatch spans, and worker metric helpers —
  including `recordSharedWorkerMetrics`, the shared metric recorder the workers plugin dispatches
  through.
- **Query read model**: `@netscript/telemetry/query` publishes the `TelemetryQueryPort` contract,
  read-side trace/span/log/resource/metric types, Standard Schema query-filter validators
  (`validateTraceQueryFilter`, `validateMetricQueryFilter`, `validateResourceQueryFilter`), and the
  Aspire-backed `AspireTelemetryQuery` reader (`createAspireTelemetryQuery` /
  `createTelemetryQuery`).
- **Instrumentation registry**: `InstrumentationRegistry` registers lifecycle hooks with
  `setupAll`/`teardownAll`, and `inspectTelemetry` returns a JSON-stable `InspectionReport` for
  diagnostics.
- **Config validation**: `getTelemetryConfig` validates the resolved configuration with a Standard
  Schema, failing fast with `TelemetryConfigError` on a malformed OTLP endpoint.
- **Test double**: `@netscript/telemetry/testing` provides `InMemorySpanRecorder`, a `Tracer`
  implementation that records spans in memory for unit assertions.

### Subpaths

| Subpath                                | Purpose                                               |
| -------------------------------------- | ----------------------------------------------------- |
| `@netscript/telemetry`                 | Primary tracing surface + registry + diagnostics      |
| `@netscript/telemetry/tracer`          | Domain tracers, span helpers, fan-in span links       |
| `@netscript/telemetry/config`          | Env-driven configuration + Standard Schema            |
| `@netscript/telemetry/context`         | W3C context propagation                               |
| `@netscript/telemetry/attributes`      | `netscript.*`/semconv attribute builders, `SpanNames` |
| `@netscript/telemetry/instrumentation` | Queue/worker/scheduler/job instrumentation + metrics  |
| `@netscript/telemetry/registry`        | Instrumentation registry facade                       |
| `@netscript/telemetry/orpc`            | oRPC tracing/error plugins (`@orpc/otel`-backed)      |
| `@netscript/telemetry/hono`            | Hono tracing middleware (`@hono/otel`-backed)         |
| `@netscript/telemetry/otel`            | Provider ports + OpenTelemetry adapters               |
| `@netscript/telemetry/query`           | Read-model contracts + Aspire telemetry reader        |
| `@netscript/telemetry/testing`         | In-memory span recorder for tests                     |

### Attribute Convention (#402)

The #402 telemetry convention (netscript.* vs semconv) splits attribute ownership in two:

- **Upstream semconv keys** are used wherever OpenTelemetry defines them — `rpc.*` for RPC spans,
  `gen_ai.*` for AI/agent spans, `server.*`/`messaging.*` for HTTP and messaging — including
  `messaging.operation.name`, `messaging.operation.type`, and `messaging.message.conversation_id`.
- **NetScript-owned attributes** live under the single proprietary root `netscript.*`. Queue-only
  concepts such as delivery count, priority, delay, DLQ, and requeue live under
  `netscript.messaging.*`; correlated spans use the shared floor `netscript.correlation.id`.

Attribute builders under `@netscript/telemetry/attributes` (`createJobAttributes`,
`createMessagingAttributes`, `createSagaAttributes`, `createTriggerAttributes`,
`createGenAiAttributes`, …) apply the split for job, messaging, saga, trigger, execution, and GenAI
spans, and `SpanNames` fixes the canonical span-name vocabulary. During the beta.5 `dup` window the
builders also emit deprecated bare aliases where an old key already shipped. The convention rules
(TC-1..TC-14) additionally define span naming, SpanKind, status, W3C propagation, and the required
`OTEL_SEMCONV_STABILITY_OPT_IN=messaging,rpc,gen_ai_latest_experimental` value.

### AI telemetry adapter

Inject the OpenTelemetry adapter into the AI runtime without adding an OTel
dependency to `@netscript/ai`:

```ts
import { createAiRuntime } from '@netscript/ai';
import { createOtelAiTelemetryPort } from '@netscript/telemetry/ai';

const ai = createAiRuntime({ telemetry: createOtelAiTelemetryPort() });
```

Agent-loop chat operations become GenAI client spans, provider-reported usage
is recorded as `gen_ai.usage.input_tokens` and `gen_ai.usage.output_tokens`, and
tool-call signals become `execute_tool` spans. The adapter uses the global OTel
tracer by default; tests and custom composition roots may inject a tracer.

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/telemetry/](https://rickylabs.github.io/netscript/reference/telemetry/)
- **Convention**:
  [docs/site/reference/telemetry/convention.md](../../docs/site/reference/telemetry/convention.md)
- **Observability**:
  [rickylabs.github.io/netscript/observability/](https://rickylabs.github.io/netscript/observability/)

---

## 📝 License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to
JSR with cryptographically verified provenance.
