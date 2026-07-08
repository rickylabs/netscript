# @netscript/telemetry

[![JSR](https://jsr.io/badges/@netscript/telemetry)](https://jsr.io/@netscript/telemetry)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**OpenTelemetry tracing primitives for NetScript: domain tracers, W3C context propagation across job
subprocesses, and an instrumentation registry that links scheduler, queue, worker, RPC, and SSE
spans into one distributed trace.**

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
    span.setAttribute('job.source', 'erp-sync');
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
    span.setAttribute('job.step', 'processing');
    // ... job logic
  },
  { parentContext: parentContext ?? undefined },
);
```

---

## 📦 Key Capabilities

- **Domain tracers**: `getQueueTracer`, `getWorkerTracer`, `getSchedulerTracer`, `getJobTracer`,
  `getSagaTracer`, `getSSETracer`, and `getKVTracer` return cached, canonically named tracers so
  spans group by NetScript subsystem.
- **W3C context propagation**: `injectContext`/`extractContext` carry trace context through message
  headers, and `createJobTraceEnv`/`extractJobTraceContext` thread it across `Deno.Command` job
  subprocesses.
- **Span helpers**: `withSpan`, `withSpanSync`, `createSpan`, and `addSpanEvent` wrap
  OpenTelemetry-compatible `Span` and `Context` types so callers never touch the raw SDK.
- **Instrumentation registry**: `InstrumentationRegistry` registers lifecycle hooks with
  `setupAll`/`teardownAll`, and `inspectTelemetry` returns a JSON-stable `InspectionReport` for
  diagnostics.
- **oRPC tracing**: `createTracingPlugin` and `createErrorHandlingPlugin` (via
  `@netscript/telemetry/orpc`) instrument the NetScript oRPC handler with handler-scoped trace
  context.
- **Provider adapters**: `@netscript/telemetry/otel` exposes the `TracerProviderPort` plus the
  Deno-native `OtelDenoTracerProvider` (default) and the opt-in `OtelSdkTracerProvider` scaffold.
- **Query read-model**: `@netscript/telemetry/query` publishes the `TelemetryQueryPort` contract,
  read-side trace/span/log/resource/metric types, Standard Schema query-filter validators, and the
  Aspire-backed `createTelemetryQuery` reader.
- **Test double**: `@netscript/telemetry/testing` provides `InMemorySpanRecorder`, a `Tracer`
  implementation that records spans in memory for unit assertions.
- **Config validation**: `getTelemetryConfig` validates the resolved configuration with a Standard
  Schema (`telemetryConfigSchema`), failing fast with `TelemetryConfigError` on a malformed OTLP
  endpoint.
- **Telemetry convention**: TC-1..TC-14 defines span naming, SpanKind, status, W3C propagation,
  `netscript.*` attribute namespacing, the beta.5 deprecated-alias `dup` window, and the required
  `OTEL_SEMCONV_STABILITY_OPT_IN=messaging,rpc,gen_ai_latest_experimental` value.

### Subpaths

| Subpath                              | Purpose                                            |
| ------------------------------------ | -------------------------------------------------- |
| `@netscript/telemetry`               | Primary tracing surface + registry + diagnostics   |
| `@netscript/telemetry/tracer`        | Domain tracers and span helpers                    |
| `@netscript/telemetry/config`        | Env-driven configuration + Standard Schema          |
| `@netscript/telemetry/context`       | W3C context propagation                            |
| `@netscript/telemetry/attributes`    | `netscript.*` attribute builders                   |
| `@netscript/telemetry/instrumentation` | Queue/worker/scheduler instrumentation            |
| `@netscript/telemetry/registry`      | Instrumentation registry facade                    |
| `@netscript/telemetry/orpc`          | oRPC tracing/error plugins                         |
| `@netscript/telemetry/otel`          | Provider ports + OpenTelemetry adapters            |
| `@netscript/telemetry/query`         | Read-model contracts + Aspire telemetry reader     |
| `@netscript/telemetry/testing`       | In-memory span recorder for tests                  |

### Attribute Convention

NetScript-owned attributes live under the single `netscript.*` root. Attribute builders under
`@netscript/telemetry/attributes` cover job, messaging, saga, trigger, execution, and GenAI spans.
During beta.5 those builders emit canonical `netscript.*` keys plus deprecated bare aliases where an
old key already shipped.

Messaging uses upstream OpenTelemetry keys only where they exist, including
`messaging.operation.name`, `messaging.operation.type`, and `messaging.message.conversation_id`.
Queue-only concepts such as delivery count, priority, delay, DLQ, and requeue live under
`netscript.messaging.*`. Correlated spans use the shared floor `netscript.correlation.id`.

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

MIT — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
