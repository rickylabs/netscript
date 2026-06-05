# `@netscript/telemetry`

[![JSR](https://jsr.io/badges/@netscript/telemetry)](https://jsr.io/@netscript/telemetry)
[![Deno](https://img.shields.io/badge/runtime-Deno-000000?logo=deno&logoColor=white)](https://deno.com/)
[![License](https://img.shields.io/badge/license-MIT-0f172a)](https://opensource.org/licenses/MIT)

OpenTelemetry tracing primitives and NetScript-specific instrumentation for queues, jobs,
schedulers, SSE streams, and oRPC handlers. Use it to create spans, propagate trace context across
async boundaries, and add tracing to worker-style runtimes without rebuilding OpenTelemetry plumbing
yourself.

## Features

- **Tracer primitives** — Create and manage spans with `getTracer()`, `withSpan()`, `createSpan()`,
  and span utility helpers
- **Context propagation** — Inject and extract W3C trace headers for messages, jobs, and other async
  handoffs
- **Queue instrumentation** — Wrap message queues with `TracedQueue` to trace enqueue, dequeue, ack,
  and nack operations
- **Worker and scheduler tracing** — Add spans and semantic attributes around job dispatch and
  execution flows
- **Plugin-owned instrumentation** — Domain runtimes such as sagas expose their telemetry contracts
  from their owning packages
- **oRPC integration** — Instrument handlers with tracing and structured error-classification
  plugins
- **Semantic attributes** — Reuse constants and attribute builders for messaging, jobs, workers,
  schedulers, triggers, KV, and SSE
- **Environment-driven config** — Read OTEL runtime settings from standard `OTEL_*` environment
  variables

## Installation

```ts
// deno.json
{
  "imports": {
    "@netscript/telemetry": "jsr:@netscript/telemetry@^0.1.0"
  }
}
```

Import subpaths only when you want a narrower surface such as config helpers, context propagation,
or oRPC plugins.

## Quick Start

Create a traced operation and prepare propagation headers for downstream queue or worker hops:

```ts
import { createMessageHeaders, getTracer, SpanKind, withSpan } from '@netscript/telemetry';

const tracer = getTracer('@acme/orders');

const headers = await withSpan(
  tracer,
  'orders.publish',
  async (span) => {
    span.setAttribute('orders.batch_size', 10);
    return createMessageHeaders({ 'x-correlation-id': 'req_123' });
  },
  { kind: SpanKind.PRODUCER },
);

console.log(headers.traceparent);
```

## Entry Points

| Import                                 | Purpose                                           | Key Exports                                                                     |
| -------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------- |
| `@netscript/telemetry`                 | Root entrypoint for the curated public API        | `getTracer`, `withSpan`, `createMessageHeaders`, `TracingPlugin`, `TracedQueue` |
| `@netscript/telemetry/config`          | Read and describe runtime telemetry configuration | `getTelemetryConfig`, `describeTelemetryConfig`, `isTelemetryEnabled`           |
| `@netscript/telemetry/tracer`          | Core span and tracer primitives                   | `getTracer`, `createSpan`, `withSpan`, `setSpanError`                           |
| `@netscript/telemetry/context`         | W3C and message/job propagation helpers           | `createMessageHeaders`, `getParentContextFromHeaders`, `injectContext`          |
| `@netscript/telemetry/attributes`      | Semantic attribute constants and builders         | `MessagingAttributes`, `JobAttributes`, `createMessagingAttributes`             |
| `@netscript/telemetry/instrumentation` | Queue, worker, scheduler, and SSE instrumentation | `TracedQueue`, `traceQueue`, `traceJobExecution`, `traceScheduledTask`          |
| `@netscript/telemetry/orpc`            | oRPC tracing and error helpers                    | `createTracingPlugin`, `createErrorHandlingPlugin`, `createTraceContext`        |

## Usage

### Inspect telemetry config from the environment

```ts
import { describeTelemetryConfig } from '@netscript/telemetry/config';

console.log(describeTelemetryConfig());
```

### Wrap a queue with tracing

```ts
import { createQueue } from '@netscript/queue';
import { MessagingSystems } from '@netscript/telemetry/attributes';
import { TracedQueue } from '@netscript/telemetry/instrumentation';

const innerQueue = createQueue<{ jobId: string }>('jobs');
const queue = new TracedQueue(innerQueue, {
  queueName: 'jobs',
  system: MessagingSystems.DENO_KV_POLLING,
});

await queue.enqueue({ jobId: 'job-123' });
```

### Recover parent trace context from message headers

```ts
import {
  createMessageHeaders,
  resolveParentContextFromHeaders,
} from '@netscript/telemetry/context';

const headers = createMessageHeaders();
const parentContext = resolveParentContextFromHeaders(headers);

void parentContext;
```

### Inspect instrumentation

```ts
import { inspectTelemetry, InstrumentationRegistry } from '@netscript/telemetry';

const registry = new InstrumentationRegistry();
registry.register({ name: 'queue' });

const report = inspectTelemetry(registry);
console.log(report.summary);
```

### Add tracing to an oRPC router

```ts
import { createErrorHandlingPlugin, createTracingPlugin } from '@netscript/telemetry/orpc';

const plugins = [
  createTracingPlugin(),
  createErrorHandlingPlugin(),
];

void plugins;
```

## Configuration

`@netscript/telemetry` reads the standard OTEL environment variables below:

| Variable                      | Purpose                                                          |
| ----------------------------- | ---------------------------------------------------------------- |
| `OTEL_DENO`                   | Enables NetScript telemetry helpers when set to `true`           |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP collector endpoint                                          |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | Export protocol such as `http/protobuf`                          |
| `OTEL_SERVICE_NAME`           | Service name recorded on spans                                   |
| `OTEL_RESOURCE_ATTRIBUTES`    | Comma-separated resource attributes, including `service.version` |
| `OTEL_TRACES_SAMPLER`         | Sampling strategy                                                |
| `OTEL_LOG_LEVEL`              | Enables debug mode when set to `debug`                           |

Use `getTelemetryConfig()` when you need the full parsed object and `describeTelemetryConfig()` when
you want a concise runtime summary for logs or diagnostics.

## Architecture

The package is split by responsibility:

- `src/core/` for tracer and span primitives
- `src/config/` for environment parsing and cached config access
- `src/context/` for W3C, message, and payload propagation helpers
- `src/attributes/` for reusable semantic attribute domains
- `src/instrumentation/` for queue and SSE tracing
- `src/runtime/` for instrumentation lifecycle registration
- `src/diagnostics/` for package inspection reports
- `src/orpc/` for oRPC tracing and error plugins

Most applications can stay on the root entrypoint. Reach for subpaths when you want a smaller import
surface or package-specific examples.

## Mental Model

Telemetry code should create spans at runtime boundaries and propagate context through explicit
carrier objects. Configuration stays in `src/config`, span creation stays in `src/core`, and
adapters such as queues or oRPC plugins sit at the package edge.

## API

The alpha root surface exports:

- `getTelemetryConfig` and `describeTelemetryConfig`
- `createSpan`, `withSpan`, and tracer helpers
- `createMessageHeaders` and `resolveParentContextFromHeaders`
- `TracedQueue` and SSE helpers
- `InstrumentationRegistry`
- `inspectTelemetry`

## Recipes

Register instrumentation by creating an `InstrumentationRegistry`, registering named hooks, then
calling `setupAll` at startup and `teardownAll` during shutdown. Inspect the registry when wiring
CLI diagnostics or health checks.

## Testing

The package uses Deno tests with explicit file-level scenarios. Current coverage includes config
parsing, context propagation, tracer caching, oRPC plugin construction, runtime registry behavior,
and README examples.

## Observability

Span helpers use `@opentelemetry/api` and record structured attributes rather than log strings.
Queue helpers preserve W3C trace context in message headers so consumers can continue traces across
async boundaries.

## Stability

This package is `0.0.1-alpha.0`. Plugin-specific runtime telemetry lives in the owning runtime
packages, with shared primitives kept here.

## Compatibility

The package targets Deno and JSR while depending on the stable `@opentelemetry/api` package. It does
not require a collector at type-check time; runtime exporters are configured through standard OTEL
environment variables.

## Resources

- [OpenTelemetry for Deno](https://docs.deno.com/runtime/fundamentals/open_telemetry/)
- [`@opentelemetry/api`](https://www.npmjs.com/package/@opentelemetry/api)
- [`@netscript/queue`](https://jsr.io/@netscript/queue) — Queue integrations used by `TracedQueue`
- [`@netscript/plugin-workers-core`](https://jsr.io/@netscript/plugin-workers-core) — Worker and
  scheduler runtimes that consume these helpers

## License

MIT
