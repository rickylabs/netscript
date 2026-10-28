---
layout: layouts/base.vto
title: Telemetry & logging
templateEngine: [vento, md]
prev: { label: "KV, queues & cron", href: "/data-persistence/kv-queues-cron/" }
next: { label: "Fresh UI & design", href: "/web-layer/fresh-ui/" }
order: 1
---

# Telemetry & logging

This page covers what NetScript traces and logs for you, the `@netscript/telemetry` surface for adding
your own spans, and the two places to read the results: the Aspire dashboard and a typed query port.

Every service and plugin runtime is wired for **OpenTelemetry**. Services serve their RPC handlers
with trace-context propagation (first-party oRPC and Hono instrumentation), the worker runtime wraps
job dispatch, execution, scheduling, subprocess hand-off and task execution in spans, and structured
logs flow through the framework `logger`. A single W3C `traceparent` groups a cross-process flow into
**one distributed trace**. The Aspire dashboard collects OTLP traces, metrics and structured logs from
every resource in the app graph as soon as you run `aspire start`; you don't stand up Jaeger, Grafana
or a log shipper. "Did the change work?" becomes a trace you open, or query from code, instead of four
console logs you correlate by eye.

{{ comp.diagram({
  src: "/assets/diagrams/otel-traceparent.svg",
  alt: "A W3C traceparent header propagates from a service request through the worker runtime into a subprocess and across a saga boundary, keeping every span under one trace id.",
  caption: "Trace-context propagation: a single traceparent (W3C) flows service → worker → subprocess → saga, so spans from every runtime join one distributed trace in Aspire."
}) }}

> [!IMPORTANT]
> The dashboard and the OTLP collector come up with the orchestrator. Run
> `cd aspire && aspire start` and open the dashboard URL it prints; until Aspire runs, there is
> nowhere to view traces or logs.

## One trace across processes

A trigger fires, the scheduler dispatches, a queue hands the job to a worker, the job reports
success, and the downstream callback never lands. In NetScript that whole flow is **one grouped
trace**: trigger → scheduler dispatch → queue enqueue/dequeue → `job.execute` → the SDK's
`rpc.client` callback span, all under a single trace id, because the runtimes propagate W3C trace
context across every process boundary. You open one trace instead of tailing a console per resource.

Where many producers feed one consumer, such as a fan-in into a durable-streams processor,
`createFanInLinks` attaches **span links** from each producer trace instead of re-parenting, so the
consumer span shows exactly which upstream flows fed it.

AI workloads use the same spine. Spans follow the upstream `gen_ai.*` semantic conventions (through
`createGenAiAttributes` in `@netscript/telemetry/attributes`), so a traced agent turn shows the model
call, the tool calls and the durable write it produced, step by step, on one tree.

## Ports, adapters and attributes

`@netscript/telemetry` carries three OpenTelemetry signals: traces, metrics (worker counts, SSE
connection stats) and logs, all over the same OTLP export. Application and runtime code program
against the port contracts in `@netscript/telemetry/otel`: `TracerProviderPort`, `MeterPort`,
`PropagatorPort`, `SpanLinkPort` and `TelemetryQueryPort`. The zero-dependency default adapter,
`OtelDenoTracerProvider`, binds to Deno's built-in OTLP exporter through `OTEL_DENO=true`. The opt-in
`OtelSdkTracerProvider` serves apps that bring the OpenTelemetry JS SDK and also enables
attribute-preserving span links.

Attribute names follow one convention: upstream semconv keys (`rpc.*`, `messaging.*`, `gen_ai.*`,
`server.*`) wherever OpenTelemetry defines them, and NetScript-owned keys under the single
proprietary root `netscript.*`. Correlated spans share `netscript.correlation.id`. The
[telemetry conventions](/reference/telemetry/convention/) has the full rules for span naming,
SpanKind, status and propagation; [Observability](/explanation/observability/) separates what the
framework emits from what is a scaffold stub.

## What you get out of the box

| Signal | What you get |
| --- | --- |
| Structured logging | `@netscript/logger` gives every service and plugin a level-aware structured logger. Declare it in `netscript.config.ts` (`logging: { level: 'info', format: 'text' }`); output is text or JSON and filterable in the dashboard. |
| Traces | Service request paths propagate W3C trace context, and the worker runtime traces the job lifecycle (see the next section). |
| OTLP export and dashboard | The generated AppHost configures an OTLP endpoint and the Aspire dashboard, so traces, metrics and logs from every resource land in one place with no collector to deploy. |
| Browser console logs | Generated app resources call `withBrowserLogs()` (the AppHost pins `Aspire.Hosting.Browsers`). A Fresh/Vite app's browser console output, including a client-side `TypeError` an island throws, appears in that resource's **Console logs** in the dashboard, correlated with the server-side spans of the same request. |

## What is traced automatically

The `@netscript/telemetry` instrumentation is wired into the worker dispatcher, the executor and the
scheduler, so every job run produces spans with attributes, durations, status and lifecycle events
without scaffold changes.

{{ comp.apiTable({
  caption: "Automatic worker traces (emitted by the runtime — see /reference/telemetry/)",
  rows: [
    { name: "traceJobExecution", type: "span", desc: "Wraps each job's execution with attributes, duration, status, and job.started / job.completed / job.failed / job.exception events. Emitted by the dispatcher." },
    { name: "recordJobProgress", type: "event", desc: "job.progress events carrying current / total / unit — the runtime records real progress as the job advances." },
    { name: "addJobStepEvent", type: "event", desc: "job.step.* events for each step the runtime walks through." },
    { name: "scheduler spans", type: "span", desc: "createSchedulerStartSpan / createScheduleJobSpan / startSchedulerTickSpan / recordCronJobRun — cron and schedule dispatch are traced end to end." },
    { name: "subprocess traceparent", type: "context", desc: "The dispatcher injects W3C traceparent / tracestate into the subprocess env so out-of-process job runs continue the same trace (initJobTracing / runTracedJob / createJobSubprocessEnv)." },
    { name: "task.execute", type: "span", desc: "The multi-runtime task executor wraps each task run in a task.execute span — polyglot and TS tasks alike show up in the trace tree." }
  ]
}) }}

## Enable tracing & see a span

Tracing turns on from the **environment**: `@netscript/telemetry/config` resolves a
`TelemetryConfig` from the standard `OTEL_*` variables, and the Aspire AppHost sets them for you. Run
`aspire start`, trigger any job, and open **Traces** in the dashboard: you see the dispatch span, the
execution span, progress and step events and, for subprocess or polyglot tasks, the trace continued
across the process boundary.

> [!NOTE]
> Locally, Aspire provisions the OTLP collector and the dashboard and injects the `OTEL_*` variables
> into every resource. The dashboard and OTLP endpoints bind to **ephemeral ports** (the generated
> profile uses `localhost:0`), so use the URL `aspire start` prints rather than assuming `:18888` or
> `:4318`. `aspire start --isolated`, an upstream Aspire CLI flag, also randomizes the dashboard, OTLP
> and resource-service ports and isolates secrets, so several AppHosts can boot in parallel. Deployed,
> there is no Aspire and no dashboard: point `OTEL_EXPORTER_OTLP_ENDPOINT` at your own collector or a
> hosted backend (Grafana Tempo, Honeycomb, Jaeger). The instrumentation code stays the same; only the
> endpoint, protocol and sampler change.

`netscript.config.ts` declares the logging contract; there is no `defineTelemetry()` call. At runtime
you can print what telemetry resolved:

{{ comp.codeBlock({ lang: "ts", code: "// netscript.config.ts — declare the structured-logging contract for the workspace.\n// Tracing itself is enabled by OTEL_* env vars (the Aspire AppHost sets these); the\n// config package reads them — there is no defineTelemetry() call to make.\nimport { defineConfig } from '@netscript/config';\n\nexport default defineConfig({\n  name: 'my-app',\n  version: '1.0.0',\n  logging: { level: 'info', format: 'text' }, // level: debug|info|warn|error\n  plugins: ['./plugins/workers/mod.ts'],\n});\n\n// Anywhere in app code you can inspect what telemetry resolved (log-safe, redacted):\nimport { describeTelemetryConfig, isTelemetryEnabled } from '@netscript/telemetry/config';\nif (isTelemetryEnabled()) console.log(describeTelemetryConfig());\n// → { enabled: true, endpoint: 'http://localhost:4318', protocol, serviceName, sampler }" }) }}

To add a custom span inside a job handler, open a child span under the job span the dispatcher
already created:

{{ comp.codeBlock({ lang: "ts", code: "// plugins/workers/jobs/health-check.ts — a real child span inside a handler.\n// The dispatcher already wraps this job in traceJobExecution automatically;\n// withChildSpan opens a child span under that parent. recordJobProgress's 3rd arg\n// is a UNIT label (e.g. 'steps'), not a free-text message.\nimport { createSuccessResult, defineJobHandler } from '@netscript/plugin-workers-core';\nimport { withChildSpan, recordJobProgress } from '@netscript/telemetry/instrumentation';\n\nconst handler = defineJobHandler(async (ctx) => {\n  recordJobProgress(1, 2, 'steps'); // → job.progress event on the trace\n\n  const envCheck = await withChildSpan('check.environment', async (span) => {\n    span.setAttribute('check.name', 'environment');\n    return { ok: true };\n  });\n\n  recordJobProgress(2, 2, 'steps');\n  return createSuccessResult({ healthy: envCheck.ok });\n});\n\nexport default Object.assign(handler, { id: 'workers-plugin-health-check' as const });" }) }}

[Add OpenTelemetry](/observability/how-to/add-opentelemetry/#step-3-add-your-own-spans-in-a-job-handler)
shows the same handler written with the scaffold's `createJobTools(ctx)`.

## Configuration

`@netscript/telemetry/config` reads configuration from the environment and caches the resolved
`TelemetryConfig`; you don't construct it.

{{ comp.apiTable({
  caption: "TelemetryConfig (@netscript/telemetry/config — resolved from OTEL_* env vars)",
  rows: [
    { name: "enabled", type: "boolean", desc: "Whether OpenTelemetry instrumentation is active (driven by OTEL_DENO / endpoint presence). Mirror it with isTelemetryEnabled()." },
    { name: "endpoint", type: "string | undefined", desc: "OTLP exporter endpoint URL (e.g. http://localhost:4318). Read directly via getOtlpEndpoint()." },
    { name: "protocol", type: "string", desc: "OTLP exporter protocol (e.g. http/protobuf), from OTEL_EXPORTER_OTLP_PROTOCOL." },
    { name: "serviceName", type: "string", desc: "Service name reported to backends, from OTEL_SERVICE_NAME (or the default). Read via getServiceName()." },
    { name: "serviceVersion", type: "string", desc: "Service version reported to backends." },
    { name: "resourceAttributes", type: "Record<string, string>", desc: "Resource attributes parsed from OTEL_RESOURCE_ATTRIBUTES." },
    { name: "sampler", type: "string", desc: "Trace sampler name, from OTEL_TRACES_SAMPLER (e.g. parentbased_always_on, traceidratio)." },
    { name: "debug", type: "boolean", desc: "Whether debug-level telemetry logging is on (OTEL_LOG_LEVEL)." }
  ]
}) }}

{{ comp.apiTable({
  caption: "Config helpers (@netscript/telemetry/config)",
  rows: [
    { name: "getTelemetryConfig()", type: "→ TelemetryConfig", desc: "Resolve telemetry config from the OTEL_* environment variables." },
    { name: "getConfig()", type: "→ TelemetryConfig", desc: "Return the process-cached config (resetConfig() clears the cache, mainly for tests)." },
    { name: "isTelemetryEnabled()", type: "→ boolean", desc: "Whether instrumentation is enabled for this process." },
    { name: "getOtlpEndpoint()", type: "→ string | undefined", desc: "The configured OTLP endpoint, when present." },
    { name: "getServiceName()", type: "→ string", desc: "The configured service name, or the default." },
    { name: "describeTelemetryConfig()", type: "→ TelemetryConfigDescription", desc: "A redacted, log-safe summary of the resolved config — safe to print in diagnostics." },
    { name: "OTEL_ENV_VARS", type: "const record", desc: "The OTEL_* variable NAMES NetScript reads: OTEL_DENO, OTEL_EXPORTER_OTLP_ENDPOINT/_PROTOCOL, OTEL_SERVICE_NAME, OTEL_RESOURCE_ATTRIBUTES, OTEL_TRACES_SAMPLER, OTEL_LOG_LEVEL, the BSP/BLRP schedule delays, and OTEL_METRIC_EXPORT_INTERVAL." }
  ]
}) }}

## Span & instrumentation helpers

Two subpaths cover hand-written instrumentation. `@netscript/telemetry/tracer` is the low-level facade
over `@opentelemetry/api`: get a tracer, open a span, run a callback inside one.
`@netscript/telemetry/instrumentation` is the NetScript-domain layer the runtimes use themselves, with
job, scheduler, queue and SSE spans that carry the right attributes. The `/context` subpath holds the
**`traceparent`** propagation helpers behind the cross-process trace in the diagram above.

{{ comp.apiTable({
  caption: "Tracer facade (@netscript/telemetry/tracer)",
  rows: [
    { name: "getTracer(name, version)", type: "→ Tracer", desc: "Cached tracer for an instrumentation name/version. Domain shortcuts exist: getJobTracer/getQueueTracer/getWorkerTracer/getSchedulerTracer/getSagaTracer/getSSETracer/getKVTracer." },
    { name: "withSpan(tracer, name, fn, options)", type: "→ Promise<T>", desc: "Run an async callback inside a span and close it on completion. withSpanSync is the synchronous form." },
    { name: "createSpan(tracer, name, options)", type: "→ Span", desc: "Create a span from a tracer + CreateSpanOptions (kind, attributes, parentContext, links). You end() it yourself." },
    { name: "setSpanAttributes / setSpanError / setSpanOk", type: "(span, …) → void", desc: "Bulk-set attributes, mark a span failed (with an optional Error), or mark it OK. addSpanEvent(span, name, attrs?) adds an event." },
    { name: "getActiveSpan() / getActiveContext()", type: "→ Span? / Context", desc: "Read the span / OTel context active on the current async path. isTracingEnabled() gates work." },
    { name: "SpanKind / SpanStatusCode / TracerNames", type: "const", desc: "Span-kind (INTERNAL/SERVER/CLIENT/PRODUCER/CONSUMER), status (UNSET/OK/ERROR), and the standard domain tracer-name strings." }
  ]
}) }}

{{ comp.apiTable({
  caption: "NetScript instrumentation helpers (@netscript/telemetry/instrumentation)",
  rows: [
    { name: "traceJobExecution(options, fn)", type: "→ Promise<T>", desc: "Wrap a job run in a span with job.started/completed/failed events. Emitted automatically by the dispatcher; the supported entry point for tracing a job by hand." },
    { name: "withChildSpan(name, fn, attributes?)", type: "→ Promise<T>", desc: "Open a child span under the active span and run fn inside it. The go-to for custom spans in a handler." },
    { name: "recordJobProgress(current, total, unit)", type: "→ void", desc: "Emit a job.progress event. The 3rd arg is a UNIT label (e.g. 'steps'), NOT a description. addJobStepEvent(stepName, attrs?) records job.step.* events." },
    { name: "startJobDispatchSpan / traceJobDispatch", type: "span / → Promise<void>", desc: "Open the dispatch span and return PropagationHeaders to carry traceparent to the executor. createJobSubprocessEnv injects traceparent/tracestate into a subprocess env." },
    { name: "scheduler & cron spans", type: "span / event", desc: "createSchedulerStartSpan, createScheduleJobSpan, startSchedulerTickSpan, traceSchedulerTick, recordCronJobRun — cron/schedule dispatch traced end to end." },
    { name: "traceQueue(queue, options) / TracedQueue", type: "→ TracedQueue<T>", desc: "Wrap a MessageQueue so enqueue/consume carry trace context. SSE helpers (startSSEConnection, createSSEEventSpan, traceSSEEvent) trace Server-Sent-Event streams." }
  ]
}) }}

{{ comp.apiTable({
  caption: "Traceparent / context propagation (@netscript/telemetry/context)",
  rows: [
    { name: "formatTraceparent(spanContext)", type: "→ string", desc: "Serialize a span context to a W3C traceparent header value. parseTraceparent(value) parses one back to a ParsedTraceparent | null." },
    { name: "injectContext(headers, ctx?) / extractContext(headers)", type: "→ headers / → Context", desc: "Inject the active trace context into outbound PropagationHeaders, or extract a remote one from inbound headers — the core of cross-service propagation." },
    { name: "withContext(ctx, fn) / withContextAsync(ctx, fn)", type: "→ T / → Promise<T>", desc: "Run a callback with a given OTel context active so spans created inside attach to the right parent." },
    { name: "createMessageHeaders / resolveParentContextFromHeaders", type: "→ headers / → Context", desc: "Build propagation headers for a queue message, and resolve the parent context back out on the consumer side." },
    { name: "getTraceId(ctx?) / getSpanId(ctx?)", type: "→ string?", desc: "Read the current trace/span ids — handy for correlating structured log lines with a trace." }
  ]
}) }}

## Service, RPC & HTTP tracing

Services get trace propagation from **first-party instrumentation** that wraps the upstream OTel
packages. The `@netscript/telemetry/orpc` subpath ships an oRPC **tracing plugin**, backed by the
upstream `@orpc/otel` instrumentation, that opens a SERVER span per RPC and continues any inbound
`traceparent`, plus an error-handling plugin that classifies failures. The `@netscript/telemetry/hono`
subpath does the same for plain HTTP: `createHonoTracingMiddleware` wraps Hono's first-party
`@hono/otel` middleware and adds NetScript service naming and W3C propagation, and the service builder
registers it outermost for you. On the service builder, the RPC side is the
`.withRPC({ traceContext: true })` toggle (see [Services](/services-sdk/services/)); the factories
below are the underlying surface if you mount oRPC or Hono yourself.

{{ comp.apiTable({
  caption: "oRPC + Hono tracing surface (@netscript/telemetry/orpc, @netscript/telemetry/hono)",
  rows: [
    { name: "createTracingPlugin(options?)", type: "→ TracingPlugin", desc: "oRPC plugin that opens a SERVER span per call and continues an inbound traceparent, following upstream rpc.* semconv. Options are TracingPluginOptions." },
    { name: "registerORPCInstrumentation(config?)", type: "→ void", desc: "Registers the upstream @orpc/otel ORPCInstrumentation the tracing plugin is backed by — wrap-don't-reinvent, applied to oRPC." },
    { name: "createErrorHandlingPlugin(options?)", type: "→ ErrorHandlingPlugin", desc: "Classifies errors as client | server | transient and records them on the span; takes an optional ErrorClassifier and ErrorLogger." },
    { name: "createTraceContext()", type: "→ TraceContext", desc: "Build the per-call trace context the plugin threads through. addEvent / setAttributes / getTraceId / getSpanId operate on the active span." },
    { name: "createHonoTracingMiddleware(options)", type: "→ HonoTracingMiddleware", desc: "Hono middleware wrapping @hono/otel's httpInstrumentationMiddleware with NetScript service naming + W3C propagation. app.use('*', createHonoTracingMiddleware({ serviceName: 'users' }))." }
  ]
}) }}

Prisma query spans are covered in
[Database & Prisma](/data-persistence/database/#query-tracing), and the worker job spans in
[What is traced automatically](#what-is-traced-automatically).

## Endpoints & ports

Telemetry has no service of its own: every runtime emits it and Aspire aggregates it. These are the
addresses you interact with.

{{ comp.apiTable({
  caption: "Observability surfaces (link to /reference/telemetry/ and /reference/logger/ for the generated APIs)",
  rows: [
    { name: "https://localhost:18888", type: "dashboard", desc: "Aspire dashboard — traces, structured logs, metrics, and resource state for the whole app graph. Auth token printed by `aspire start`." },
    { name: "http://localhost:4318", type: "OTLP/HTTP", desc: "OTLP ingest endpoint the AppHost configures (aspire.config.json https profile). Runtimes export spans and logs here; the dashboard reads them back. This is the seam you point at a hosted backend." },
    { name: "GET /health", type: "Workers API", desc: "Workers API health probe — reported as resource health in the dashboard (on its assigned port)." },
    { name: "GET /health/live", type: "Sagas API", desc: "Sagas API liveness route (on its assigned port)." },
    { name: "GET :8093/health", type: "liveness", desc: "Triggers API health probe (Hono service)." },
    { name: ":8094", type: "service", desc: "Auth API (auth-api) — its request spans propagate trace context like any other service." }
  ]
}) }}

## View it in Aspire

With `aspire start` up, the dashboard gives you four views over the same telemetry stream:

{{ comp.apiTable({
  caption: "Aspire dashboard views (https://localhost:18888)",
  rows: [
    { name: "Resources", type: "graph", desc: "Live state of every app-graph resource: postgres, redis, workers-api, workers, sagas-api, sagas, triggers-api, triggers, auth-api. Health probes drive the status colour." },
    { name: "Console logs", type: "stream", desc: "Per-resource stdout/stderr — the framework logger's text/JSON output lands here in real time." },
    { name: "Structured logs", type: "OTLP", desc: "Structured log records exported over OTLP, filterable by resource, level, and attributes." },
    { name: "Traces", type: "OTLP", desc: "Distributed traces collected from the OTLP endpoint (http://localhost:4318) — job dispatch/execution/scheduler/task spans and cross-service request spans as trace context propagates." }
  ]
}) }}

## Close the loop: read the trace back in code

The dashboard answers *what happened and where* for a person. Programs, and AI agents verifying their
own change without a browser, use the **typed read side**. `@netscript/telemetry/query` publishes a
`TelemetryQueryPort` contract with an Aspire-backed reader: `createAspireTelemetryQuery(...)`, or
`createTelemetryQuery(...)` for the port type, reads the Aspire `/api/telemetry/*` surface into
package-owned read models: `TelemetryTrace`, `TelemetrySpan` (with its `events` and `links`),
`TelemetryLog`, `TelemetryResource` and `TelemetryMetric`. Verification becomes an assertion: fetch
the trace by id and check that the span you expected is present with the status you expected.

{{ comp.apiTable({
  caption: "Telemetry query read side (@netscript/telemetry/query)",
  rows: [
    { name: "createAspireTelemetryQuery(options) / createTelemetryQuery(options)", type: "→ AspireTelemetryQuery / TelemetryQueryPort", desc: "Build the Aspire-backed reader over the dashboard's /api/telemetry/* surface. The first returns the concrete adapter; the second returns it typed as the port contract." },
    { name: "queryTraces(filter?) / getTrace(traceId)", type: "→ Promise<TelemetryTrace[]> / Promise<TelemetryTrace?>", desc: "List traces matching a TraceQueryFilter, or fetch a single trace by id — the assertion primitive for 'did my flow produce the span I expected'." },
    { name: "querySpans / queryLogs / queryMetrics / queryResources", type: "→ Promise<readonly …[]>", desc: "Read spans, structured logs, metrics, and resource records back as package-owned models (TelemetrySpan / TelemetryLog / TelemetryMetric / TelemetryResource)." },
    { name: "validateTraceQueryFilter / validateMetricQueryFilter / validateResourceQueryFilter", type: "(filter) → filter", desc: "Standard Schema validators for the query filters — a malformed query fails in-process rather than returning silently-wrong rows." }
  ]
}) }}

Encore exposes its local traces to an AI agent through an MCP server. NetScript makes the read side a
typed in-language port that the app, a test or an agent's own tool calls directly, and it returns the
same package-owned read models the runtimes emit.

## Production notes

| Avoid | Do instead |
| --- | --- |
| Tracing 100% of traffic in production. The local Aspire default samples everything, which is fine for development and ruinous at scale. | Set a ratio sampler in the environment: `OTEL_TRACES_SAMPLER` (surfaced as `TelemetryConfig.sampler`) to `traceidratio` with a rate. Keep always-on sampling for low-volume services or a targeted debugging window. |
| Editing instrumentation to point at Grafana or Honeycomb; you redo that churn on every upgrade. | Point the exporter. `OTEL_EXPORTER_OTLP_ENDPOINT` (default `http://localhost:4318`) is the single seam: change endpoint and protocol in the environment and the instrumentation code stays the same. |
| Unbounded values such as user ids, raw URLs or full payloads in `span.setAttribute`; they explode index cardinality on the backend. | Use stable, low-cardinality keys. To correlate a specific record, log `getTraceId()` in a structured log line instead of widening the span. |
| A message as `recordJobProgress`'s third argument; free text there inflates cardinality and misreads the API. | Pass a stable unit label such as `'steps'` or `'items'`. |
| Treating `progress(percent, message)` as only a log line. | Use it for both telemetry and runtime progress: it emits a `job.progress` event and forwards the percentage and message to the workers channel. |

## Next steps

Follow [Add OpenTelemetry](/observability/how-to/add-opentelemetry/) to trigger a trace, add your own
spans and read them in the dashboard.

- [Observability](/explanation/observability/): how automatic framework spans, `createJobTools(ctx)`
  handler telemetry, console logs, health endpoints and Aspire traces fit together.
- {{ comp.xref({ key: "ref:telemetry" }) }} and [logger](/reference/logger/) references: the full
  generated APIs.
- [Telemetry conventions](/reference/telemetry/convention/): span naming, SpanKind and the
  `netscript.*` attribute rules.

{{ comp.nextPrev({
  prev: { label: "KV, queues & cron", href: "/data-persistence/kv-queues-cron/" },
  next: { label: "Fresh UI & design", href: "/web-layer/fresh-ui/" }
}) }}
