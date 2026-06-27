---
layout: layouts/base.vto
title: Telemetry & logging
templateEngine: [vento, md]
prev: { label: "KV, queues & cron", href: "/capabilities/kv-queues-cron/" }
next: { label: "Fresh UI & design", href: "/capabilities/fresh-ui/" }
---

# Telemetry & logging

NetScript treats observability as a built-in, not a bolt-on. Every service and plugin
runtime is wired for **OpenTelemetry** — services serve their RPC handlers with
trace-context propagation, the worker runtime wraps job dispatch, execution, scheduling,
subprocess hand-off, and task execution in real OTel spans, and structured logs flow through
the framework `logger`. The viewing surface is the **Aspire dashboard at
`http://localhost:18888`**, which collects OTLP traces, metrics, and structured logs from
every resource in the app graph (services, plugin APIs, background processors) the moment you
run `aspire start`. You do not stand up Jaeger, Grafana, or a log shipper to get started — the
AppHost provisions the OTLP collector and the dashboard for you.

{{ comp.diagram({
  src: "/assets/diagrams/otel-traceparent.svg",
  alt: "A W3C traceparent header propagates from a service request through the worker runtime into a subprocess and across a saga boundary, keeping every span under one trace id.",
  caption: "Trace-context propagation: a single traceparent (W3C) flows service → worker → subprocess → saga, so spans from every runtime join one distributed trace in Aspire."
}) }}

This page is the capability hub: what telemetry exists, how to emit it, where to view it,
and the one place that is still a scaffold stub. For the full generated API of
each unit, follow the reference links: the telemetry primitives live at
[`/reference/telemetry/`](/reference/telemetry/) and the structured logger at
[`/reference/logger/`](/reference/logger/).

{{ comp callout { type: "important", title: "Aspire first, then telemetry" } }}
The dashboard, the OTLP collector, and the per-resource trace/log views all come up with the
orchestrator — they are not separate processes you start by hand. Run
<code>cd aspire &amp;&amp; aspire start</code> <strong>before</strong> any <code>netscript db</code>
command (Aspire provisions Postgres and Redis first), then open the dashboard URL printed in
the console (<code>http://localhost:18888</code>, with a one-time auth token). Until Aspire is
running there is no <code>:18888</code> surface to view traces or logs on. See
<a href="/how-to/database-migration/">Database &amp; migration</a> for the full startup order.
{{ /comp }}

## What it is

Telemetry in NetScript is three OpenTelemetry signals — **traces**, **metrics**, and
**logs** — wired through one package, `@netscript/telemetry`, and one viewing surface, the
Aspire dashboard. Traces are the headline: a request enters a service, the worker runtime
dispatches and executes a job, a subprocess runs a polyglot task, and a saga advances — and
because a single **W3C `traceparent`** header propagates across every one of those process
boundaries, the whole fan-out collapses into one trace tree. Metrics (worker counts, SSE
connection stats) and structured logs ride the same OTLP export. The framework owns transport
(OTLP/HTTP to the collector) and viewing (the dashboard); it now owns most of emission too —
the worker, scheduler, queue, saga, and SSE runtimes are instrumented for you. The full
mental model — what is framework-real versus a scaffold stub — is in
[Observability](/explanation/observability/).

## Learn → / Do →

{{ comp.featureGrid({ items: [
  {
    title: "Do — Add OpenTelemetry",
    body: "Task-oriented recipe: lean on the automatic job spans, add custom spans via @netscript/telemetry withChildSpan, propagate traceparent across services and subprocesses, and point the OTLP export (:4318) at the dashboard.",
    href: "/how-to/add-opentelemetry/",
    icon: "◆"
  },
  {
    title: "Understand — Observability",
    body: "The mental model: how spans, structured logs, health endpoints, and Aspire traces fit together — and the precise framework-vs-scaffold map of what is real (traceJobExecution, task.execute) versus the tracked createJobTools(ctx) stub.",
    href: "/explanation/observability/",
    icon: "◎"
  },
  {
    title: "Look up — telemetry reference",
    body: "The full generated deno doc API for @netscript/telemetry — tracer facade, context/traceparent helpers, the NetScript instrumentation helpers, and the oRPC tracing plugin.",
    href: "/reference/telemetry/",
    icon: "≡"
  }
] }) }}

## What you get out of the box

Telemetry in NetScript spans three layers — emission (in framework runtimes and your handler
code), transport (OTLP over HTTP to the collector), and viewing (the Aspire dashboard). The
framework owns transport and viewing, and it now owns most of emission too: the worker runtime
traces the entire job lifecycle automatically. The only thing you still wire by hand is custom
spans *inside* a job handler — and even there the `@netscript/telemetry` helpers do the work.

{{ comp.featureGrid({ items: [
  {
    title: "Structured logging",
    body: "The @netscript/logger unit gives every service and plugin a level-aware, structured logger. Config is declared in netscript.config.ts (logging: { level: 'info', format: 'text' }) and threaded through the runtime — text or JSON, filterable in the dashboard.",
    icon: "▤"
  },
  {
    title: "OpenTelemetry traces (real)",
    body: "Service request paths propagate W3C trace context, and the worker runtime emits real spans for job dispatch, execution, scheduling, subprocess hand-off, and task.execute. @opentelemetry/api (^1.9) is in the catalog and wired into the request and job paths so spans flow to the collector.",
    icon: "◈"
  },
  {
    title: "OTLP → Aspire dashboard",
    body: "The generated AppHost configures an OTLP endpoint (http://localhost:4318) and the Aspire dashboard (http://localhost:18888) so traces, metrics, and logs from every resource land in one place — no collector to deploy.",
    icon: "◎"
  },
  {
    title: "Per-resource health",
    body: "Each plugin API exposes a liveness probe — workers :8091 GET /health, sagas :8092 GET /health/live, triggers :8093 GET /health, auth :8094 — surfaced as resource state in the dashboard.",
    icon: "✚"
  }
] }) }}

## Enable tracing & see a span

Tracing turns on from the **environment** — `@netscript/telemetry/config` resolves a
`TelemetryConfig` from the standard `OTEL_*` variables, and the Aspire AppHost already sets
them for you. The fastest path is to run `aspire start`, trigger any job, and the
runtime's automatic spans show up in the dashboard with no code change. The tab below adds a
**custom** span on top of that automatic trace.

{{ comp.tabbedCode({ tabs: [
  {
    label: "1 — Turn it on (env-driven)",
    lang: "ts",
    code: "// netscript.config.ts — declare the structured-logging contract for the workspace.\n// Tracing itself is enabled by OTEL_* env vars (the Aspire AppHost sets these); the\n// config package reads them — there is no defineTelemetry() call to make.\nimport { defineConfig } from '@netscript/config';\n\nexport default defineConfig({\n  name: 'my-app',\n  version: '1.0.0',\n  logging: { level: 'info', format: 'text' }, // level: debug|info|warn|error\n  plugins: ['./plugins/workers/mod.ts'],\n});\n\n// Anywhere in app code you can inspect what telemetry resolved (log-safe, redacted):\nimport { describeTelemetryConfig, isTelemetryEnabled } from '@netscript/telemetry/config';\nif (isTelemetryEnabled()) console.log(describeTelemetryConfig());\n// → { enabled: true, endpoint: 'http://localhost:4318', protocol, serviceName, sampler }"
  },
  {
    label: "2 — Add a custom span",
    lang: "ts",
    code: "// plugins/workers/jobs/health-check.ts — a real child span inside a handler.\n// The dispatcher already wraps this job in traceJobExecution automatically;\n// withChildSpan opens a child span under that parent. recordJobProgress's 3rd arg\n// is a UNIT label (e.g. 'steps'), not a free-text message.\nimport { createSuccessResult, defineJobHandler } from '@netscript/plugin-workers-core';\nimport { withChildSpan, recordJobProgress } from '@netscript/telemetry/instrumentation';\n\nconst handler = defineJobHandler(async (ctx) => {\n  recordJobProgress(1, 2, 'steps'); // → job.progress event on the trace\n\n  const envCheck = await withChildSpan('check.environment', async (span) => {\n    span.setAttribute('check.name', 'environment');\n    return { ok: true };\n  });\n\n  recordJobProgress(2, 2, 'steps');\n  return createSuccessResult({ healthy: envCheck.ok });\n});\n\nexport default Object.assign(handler, { id: 'workers-plugin-health-check' as const });"
  }
] }) }}

{{ comp callout { type: "tip", title: "Lowest-effort observability path" } }}
Run <code>aspire start</code>, trigger a job, and open <code>:18888</code> → <strong>Traces</strong>.
You will see the dispatch span, the execution span, progress and step events, and — for
subprocess or polyglot tasks — a continued trace across the process boundary. None of that
requires editing the scaffold. Reach for custom instrumentation only when you want spans
<em>inside your own handler logic</em>.
{{ /comp }}

## Key types: the telemetry init/config surface

Configuration is **read from the environment**, not constructed — `@netscript/telemetry/config`
resolves and caches a `TelemetryConfig` from the `OTEL_*` variables. These are the confirmed
fields and the helpers that read them.

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

Two subpaths cover hand-written instrumentation. `@netscript/telemetry/tracer` is the
low-level facade over `@opentelemetry/api` — get a tracer, open a span, run a callback inside
one. `@netscript/telemetry/instrumentation` is the NetScript-domain layer the runtimes
themselves use — job, scheduler, queue, and SSE spans with the right attributes baked in.
The `/context` subpath holds the **`traceparent`** propagation helpers that make the
cross-boundary trace in the diagram above possible.

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

## Service & RPC tracing toggle

Services opt into trace propagation through the oRPC layer rather than by hand. The
`@netscript/telemetry/orpc` subpath ships an oRPC **tracing plugin** that opens a SERVER span
per RPC and continues any inbound `traceparent`, plus an error-handling plugin that classifies
failures. On the service builder this is the `.withRPC({ traceContext: true })` toggle (see
[Services](/capabilities/services/)); the plugin
factory below is the underlying surface if you mount oRPC yourself.

{{ comp.apiTable({
  caption: "oRPC tracing surface (@netscript/telemetry/orpc)",
  rows: [
    { name: "createTracingPlugin(options?)", type: "→ TracingPlugin", desc: "oRPC plugin that opens a SERVER span per call and continues an inbound traceparent. Options are TracingPluginOptions." },
    { name: "createErrorHandlingPlugin(options?)", type: "→ ErrorHandlingPlugin", desc: "Classifies errors as client | server | transient and records them on the span; takes an optional ErrorClassifier and ErrorLogger." },
    { name: "createTraceContext()", type: "→ TraceContext", desc: "Build the per-call trace context the plugin threads through. addEvent / setAttributes / getTraceId / getSpanId operate on the active span." }
  ]
}) }}

{{ comp callout { type: "note", title: "Database & worker tracing toggles live next door" } }}
The Prisma query-tracing and worker-runtime tracing toggles are documented on their own hubs
to avoid duplication. Database query spans are wired through the
<a href="/capabilities/database/">database</a> client; the worker runtime's automatic job
spans are described in <a href="/capabilities/background-jobs/">background jobs</a>. This hub
owns the <strong>cross-cutting</strong> telemetry surface — config, the tracer facade,
traceparent propagation, and the oRPC plugin — that those runtimes build on. See
{{ comp.xref({ key: "cap:database", text: "Database & Prisma" }) }} for the per-query toggle.
{{ /comp }}

## What is traced automatically

Before you write a single instrumentation call, the worker runtime already produces a usable
trace tree in Aspire. The `@netscript/telemetry` instrumentation is wired into the dispatcher,
the executor, and the scheduler, so the moment a job runs you get spans with attributes,
durations, status, and lifecycle events — no scaffold changes required.

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

## Instrument a handler

The two tabs below show the two emission paths a developer touches: structured logging
through the framework logger, and **custom** spans inside a job handler. For custom spans,
call the `@netscript/telemetry` helpers (`traceJobExecution`, `withChildSpan`,
`recordJobProgress`) directly — they are the real, supported surface. Read the
callout under the tabs to understand why you reach for the telemetry package rather than the
scaffold's `createJobTools(ctx)` trace helpers.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Structured logging",
    lang: "ts",
    code: "// netscript.config.ts — declare the logging contract for the whole workspace.\nimport { defineConfig } from '@netscript/config';\n\nexport default defineConfig({\n  name: 'my-app',\n  version: '1.0.0',\n  // level: 'debug' | 'info' | 'warn' | 'error'; format: 'text' | 'json'\n  logging: { level: 'info', format: 'text' },\n  plugins: ['./plugins/workers/mod.ts', './plugins/sagas/mod.ts'],\n});\n\n// Inside a job handler, the logger comes from the job tools (console-backed today,\n// and surfaced under the resource's Console logs view in the Aspire dashboard).\n// import { createJobTools } from './job-tools.ts';\nconst emit = (log) => {\n  log.info('user provisioned', { userId: 'u_123', source: 'scaffold' });\n  log.warn('rate limit approaching', { remaining: 4 });\n};"
  },
  {
    label: "Custom spans via @netscript/telemetry",
    lang: "ts",
    code: "// plugins/workers/jobs/health-check.ts — real custom spans inside a handler.\n// The dispatcher already wraps this job in traceJobExecution automatically;\n// withChildSpan + recordJobProgress let you add detail under that parent span.\nimport { createSuccessResult, createFailureResult, defineJobHandler } from '@netscript/plugin-workers-core';\nimport { withChildSpan, recordJobProgress } from '@netscript/telemetry/instrumentation';\n\nconst handler = defineJobHandler(async (ctx) => {\n  const { log } = ctx;\n  log.info('Starting workers plugin health check');\n\n  // Real progress event — 3rd arg is a UNIT label, not a message.\n  recordJobProgress(1, 2, 'steps');\n\n  // withChildSpan opens a real child span under the job-execution span.\n  const envCheck = await withChildSpan('check.environment', async (span) => {\n    span.setAttribute('check.name', 'environment');\n    return { ok: true };\n  });\n\n  recordJobProgress(2, 2, 'steps');\n  if (!envCheck.ok) return createFailureResult('environment check failed');\n  return createSuccessResult({ status: 'healthy' });\n});\n\nexport default Object.assign(handler, { id: 'workers-plugin-health-check' as const });"
  }
] }) }}

{{ comp callout { type: "warning", title: "Known gap: the scaffold createJobTools(ctx) trace/progress helpers are no-op stubs" } }}
Job dispatch and execution are instrumented with <strong>real OTel spans</strong> — traces
show up in Aspire automatically (<code>traceJobExecution</code>, <code>recordJobProgress</code>,
scheduler spans, and subprocess traceparent propagation are all live in the runtime). The one
remaining gap is narrow and specific: the <code>trace.{addEvent,withChildSpan,recordProgress}</code>
and <code>progress(...)</code> helpers returned by the scaffold's <code>createJobTools(ctx)</code>
are currently <strong>no-op stubs</strong> in the generated copy. <code>log</code> writes to the
console; those particular trace/progress helpers do nothing. This is a <strong>known, tracked
limitation with a fix planned</strong> (debt <code>workers-scaffold-job-tools-noop</code>), not a
permanent design choice. <strong>Workaround:</strong> for custom spans and progress, call the
<code>@netscript/telemetry</code> helpers directly (as in the tab above) rather than the scaffold
<code>createJobTools</code> trace surface — those are real today. See
<a href="/explanation/observability/">Observability</a> for the full framework-vs-scaffold map.
<!-- caveat: arch-debt:workers-scaffold-job-tools-noop -->
{{ /comp }}

## Endpoints & ports

Telemetry has no single service of its own — it is emitted by every runtime and aggregated
by Aspire. These are the real addresses you interact with, validated by the CLI E2E suite.

{{ comp.apiTable({
  caption: "Observability surfaces (link to /reference/telemetry/ and /reference/logger/ for the generated APIs)",
  rows: [
    { name: "http://localhost:18888", type: "dashboard", desc: "Aspire dashboard — traces, structured logs, metrics, and resource state for the whole app graph. Auth token printed by `aspire start`." },
    { name: "http://localhost:4318", type: "OTLP/HTTP", desc: "OTLP ingest endpoint the AppHost configures (aspire.config.json https profile). Runtimes export spans and logs here; the dashboard reads them back. This is the seam you point at a hosted backend." },
    { name: "GET :8091/health", type: "liveness", desc: "Workers API health probe — reported as resource health in the dashboard." },
    { name: "GET :8092/health/live", type: "liveness", desc: "Sagas API liveness route." },
    { name: "GET :8093/health", type: "liveness", desc: "Triggers API health probe (Hono service)." },
    { name: ":8094", type: "service", desc: "Auth API (auth-api) — its request spans propagate trace context like any other service." }
  ]
}) }}

## View it in Aspire

With `aspire start` up, the dashboard at `http://localhost:18888` gives you four views over the
same telemetry stream — there is no separate tool to configure.

{{ comp.apiTable({
  caption: "Aspire dashboard views (http://localhost:18888)",
  rows: [
    { name: "Resources", type: "graph", desc: "Live state of every app-graph resource: postgres, redis, workers-api, workers, sagas-api, sagas, triggers-api, triggers, auth-api. Health probes drive the status colour." },
    { name: "Console logs", type: "stream", desc: "Per-resource stdout/stderr — the framework logger's text/JSON output lands here in real time." },
    { name: "Structured logs", type: "OTLP", desc: "Structured log records exported over OTLP, filterable by resource, level, and attributes." },
    { name: "Traces", type: "OTLP", desc: "Distributed traces collected from the OTLP endpoint (http://localhost:4318) — job dispatch/execution/scheduler/task spans and cross-service request spans as trace context propagates." }
  ]
}) }}

{{ comp callout { type: "tip", title: "Use this when…" } }}
Reach for the dashboard whenever you need to answer <strong>"what happened and where"</strong>:
which resource is unhealthy, what a service logged for a given request, why a job failed, or how
a call fanned out across services and subprocesses. Because Aspire wires OTLP for you, the
lowest-effort observability path is to run <code>aspire start</code> and open
<code>:18888</code> — no extra dependency, no collector to deploy. When you outgrow the local
dashboard, the same OTLP export (<code>http://localhost:4318</code>) is the seam you point at a
hosted backend.
{{ /comp }}

## Production notes

{{ comp callout { type: "warning", title: "Footguns before you ship telemetry" } }}
<ul>
<li><strong>Sampling is an env decision, not a code one.</strong> The sampler comes from
<code>OTEL_TRACES_SAMPLER</code> (surfaced as <code>TelemetryConfig.sampler</code>) — set a
ratio sampler like <code>traceidratio</code> in production rather than tracing 100% of traffic.
The local Aspire default samples everything, which is fine for dev and ruinous at scale.</li>
<li><strong>Point the exporter, don't rewrite the runtime.</strong> The OTLP export
(<code>http://localhost:4318</code>, <code>OTEL_EXPORTER_OTLP_ENDPOINT</code>) is the single
seam for a hosted backend. Swap the endpoint/protocol via env; the instrumentation code does
not change.</li>
<li><strong>Watch span-attribute cardinality.</strong> Putting unbounded values (user ids, raw
URLs, full payloads) into <code>span.setAttribute</code> explodes index cardinality on the
backend. Use stable, low-cardinality keys; correlate to a record with <code>getTraceId()</code>
in a log line instead.</li>
<li><strong><code>recordJobProgress</code>'s 3rd argument is a UNIT label, not a message.</strong>
Pass <code>'steps'</code> / <code>'items'</code>, not free text — the value is meant to be a
stable unit, and a per-call message inflates cardinality.</li>
<li><strong>The scaffold <code>createJobTools(ctx)</code> trace/progress helpers are no-op
today.</strong> Don't ship code that relies on them for real spans — call the
<code>@netscript/telemetry</code> helpers directly (see the callout above).</li>
</ul>
{{ /comp }}

## Reference

This hub is intentionally thin — the full generated API lives in the reference.

{{ comp.xref({ key: "ref:telemetry" }) }}

{{ comp.featureGrid({ items: [
  {
    title: "Do — Add OpenTelemetry",
    body: "Task-oriented recipe: lean on the automatic job spans, add custom spans via @netscript/telemetry withChildSpan, propagate traceparent across services and subprocesses, and point the OTLP export (:4318) at the dashboard.",
    href: "/how-to/add-opentelemetry/",
    icon: "◆"
  },
  {
    title: "Understand — Observability",
    body: "The mental model: how spans, structured logs, health endpoints, and Aspire traces fit together — and the precise framework-vs-scaffold map of what is real (traceJobExecution, task.execute) versus the tracked createJobTools(ctx) stub.",
    href: "/explanation/observability/",
    icon: "◎"
  },
  {
    title: "Look up — telemetry reference",
    body: "The full generated deno doc API for @netscript/telemetry — tracer facade, context/traceparent helpers, the instrumentation helpers, scheduler spans, and the oRPC tracing plugin. The authority for signatures.",
    href: "/reference/telemetry/",
    icon: "≡"
  },
  {
    title: "Look up — logger reference",
    body: "The full generated deno doc API for @netscript/logger — log levels, formats, and the structured-logging surface declared in netscript.config.ts.",
    href: "/reference/logger/",
    icon: "≡"
  }
] }) }}

{{ comp.nextPrev({
  prev: { label: "KV, queues & cron", href: "/capabilities/kv-queues-cron/" },
  next: { label: "Fresh UI & design", href: "/capabilities/fresh-ui/" }
}) }}
