# @netscript/telemetry

OpenTelemetry tracing primitives and NetScript instrumentation for jobs, queues, RPC, and SSE.

## Install

```sh
deno add jsr:@netscript/telemetry
```

Layered helpers live on typed subpaths so callers import only what they need:

```ts
import { getTelemetryConfig } from '@netscript/telemetry/config';
import { withSpan } from '@netscript/telemetry/tracer';
import { TracingPlugin } from '@netscript/telemetry/orpc';
```

## Quick example

Inspect an instrumentation registry to produce a JSON-stable diagnostic report:

```ts
import { inspectTelemetry, InstrumentationRegistry } from '@netscript/telemetry';

const registry = new InstrumentationRegistry();
registry.register({ name: 'queue' });

const report = inspectTelemetry(registry);
console.log(report.summary);
```

Use `@netscript/telemetry/tracer` and `@netscript/telemetry/context` to create spans and propagate
trace context across jobs, queues, and subprocesses.

## Docs

- [API reference](https://rickylabs.github.io/netscript/reference/telemetry/)
- [Concepts & guides](https://rickylabs.github.io/netscript/)
