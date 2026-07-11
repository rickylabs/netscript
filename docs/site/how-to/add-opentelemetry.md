---
layout: layouts/base.vto
title: Add OpenTelemetry
templateEngine: [vento, md]
prev: { "label": "Queue / KV / cron", "href": "/how-to/queue-kv-cron/" }
next: { "label": "Customize Fresh UI", "href": "/how-to/customize-fresh-ui/" }
---

# Add OpenTelemetry

**Scope:** turn on, extend, and read distributed traces in an existing NetScript
workspace. OpenTelemetry is not a bolt-on here — `@netscript/telemetry` wraps
`@opentelemetry/api` and is wired into the services, the worker dispatcher, the scheduler,
and the subprocess task runtime the scaffold generates. Aspire stands up the OTLP collector
and the trace UI for you. This recipe shows where the instrumentation already lives, how to
add your own spans and structured logs, how `traceparent` propagates across the oRPC/HTTP
boundary and into job subprocesses, and how to watch it all land in the Aspire dashboard at
[https://localhost:18888](https://localhost:18888).

This is a task recipe, not a deep-dive. For the mental model behind spans, structured logs,
and the per-capability health endpoints, read [Observability](/explanation/observability/).
For the generated API surface, follow the [`telemetry`](/reference/telemetry/) and
[`logger`](/reference/logger/) reference pages, and the
[Telemetry capability](/capabilities/telemetry/) hub for the Learn / Do / Reference triplet.

{{ comp callout { type: "important", title: "What works today, and the one gap" } }}
<strong>Worker tracing is built in and real.</strong> Job dispatch, job execution, the
scheduler, and the task subprocess all emit real OpenTelemetry spans automatically — they
appear in the Aspire dashboard with no code from you. <code>task.execute</code> spans are
real too. The <strong>only</strong> gap is the scaffold's <code>createJobTools(ctx)</code>
handler helpers: <code>trace.addEvent</code>, <code>trace.withChildSpan</code>, and
<code>trace.recordProgress</code> are currently <strong>no-op stubs</strong> in the generated
<code>job-tools.ts</code> (a tracked debt with a fix planned). To emit custom spans from
inside a handler today, call the <code>@netscript/telemetry</code> instrumentation helpers
directly — shown in Step 3. Structured logging via <code>log.*</code> is real now.
{{ /comp }}

## Prerequisites

{{ comp.apiTable({ caption: "What this recipe assumes", rows: [
  { name: "netscript workspace", type: "netscript init", desc: "An existing workspace. If you have none, scaffold one first — see the tutorials." },
  { name: "Start Aspire", type: "cd aspire && aspire start", desc: "The AppHost provisions Postgres, Redis, the OTLP collector, and the dashboard. Start it BEFORE you expect traces. Dashboard at https://localhost:18888." },
  { name: "@netscript/telemetry", type: "OTel facade", desc: "Wraps @opentelemetry/api and ships the worker/scheduler/queue/SSE instrumentation. Already wired into the generated handlers — no install step." },
  { name: "A service or plugin to trace", type: "services/users or plugins/workers", desc: "The users service (:3001) and the workers/sagas/triggers/auth plugins all emit health + trace data once running." }
] }) }}

{{ comp callout { type: "warning", title: "Aspire first, always" } }}
The OTLP endpoint and the trace UI are <strong>Aspire resources</strong>. Aspire is step 2 of
the workflow: <code>cd aspire &amp;&amp; aspire start</code> brings up Postgres, Redis, the
collector, and the dashboard <strong>before</strong> any <code>netscript db</code> command or
service. If <code>aspire start</code> is not up, there is nowhere for spans to go and nothing to
view. Start orchestration from the <code>aspire/</code> folder before you run a service,
trigger a job, or open the dashboard.
{{ /comp }}

## How the telemetry is already wired

Three layers ship instrumented out of the box. Knowing which is which tells you where you get
spans for free and where you add your own.

{{ comp.apiTable({ caption: "Where instrumentation lives", rows: [
  { name: "Service layer (real spans)", type: "@netscript/service", desc: "RPC trace context (header extraction into ctx.traceHeaders) is ON by default — traceContext defaults to true when withRPC() is called without arguments. The OTel TracingPlugin that creates real spans is also always active; it is independent of the traceContext option." },
  { name: "Worker runtime (real spans)", type: "job dispatcher + scheduler", desc: "Job dispatch and execution, scheduler runs, and the task subprocess emit real OTel spans automatically via @netscript/telemetry — traceJobExecution, scheduler spans, task.execute. Traces show up in Aspire with no handler code." },
  { name: "Scaffold job tools (stub spans today)", type: "createJobTools(ctx)", desc: "log / progress / trace handed to defineJobHandler bodies. log.* is REAL; trace.addEvent / withChildSpan / recordProgress are no-op stubs in the scaffold (tracked debt, fix planned). For custom handler spans, call @netscript/telemetry helpers directly." },
  { name: "OTLP export + UI", type: "http://localhost:4318 → :18888", desc: "The Aspire profile points OTLP at http://localhost:4318; the dashboard renders the collected traces and correlated structured logs at :18888." }
] }) }}

{{ comp callout { type: "note", title: "Two senses of \"worker tracing\"" } }}
The framework/dispatcher layer emits real spans — <code>traceJobExecution</code>,
scheduler spans, and subprocess <code>traceparent</code> propagation are all live, so you get
job traces in Aspire automatically. The <em>scaffold-facing</em>
<code>createJobTools(ctx)</code> helpers your handler calls are the only stubs. Never read
"the job-tools helpers are stubs" as "worker tracing is a no-op" — the runtime around your
handler is fully instrumented.
{{ /comp }}

## Step 1 — Bring up Aspire and confirm the collector

From the workspace root, start orchestration. The AppHost registers the OTLP collector and
the dashboard, then boots Postgres, Redis, and every service/plugin resource.

```bash
cd aspire
aspire start
# dashboard: https://localhost:18888  (login token printed in the console)
```

Open [https://localhost:18888](https://localhost:18888), authenticate with the token Aspire
printed, and select the **Traces** tab. With nothing exercised yet it is empty — that is
expected. Leave it open; it updates live.

{{ comp callout { type: "note", title: "Resources you should see" } }}
The Aspire resource graph lists <code>postgres</code>, <code>redis</code>,
<code>workers-api</code> (<code>:8091</code>), <code>workers</code>,
<code>sagas-api</code> (<code>:8092</code>), <code>sagas</code>,
<code>triggers-api</code> (<code>:8093</code>), <code>triggers</code>, the
<code>auth-api</code> (<code>:8094</code>), and the durable-streams service
(<code>:4437</code>). Each resource exports telemetry to the OTLP endpoint at
<code>http://localhost:4318</code>; the dashboard reads from there.
{{ /comp }}

## Step 2 — Generate a trace without writing any code

Both service-layer and worker-runtime tracing are real and need no code from you. Exercise a
running surface and a trace appears.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Trigger a worker job",
    lang: "bash",
    code: "# Workers API on :8091 — enqueue the sample health-check job by id.\n# Dispatch + execution + scheduler spans are emitted automatically.\ncurl -s -X POST http://localhost:8091/api/v1/workers/jobs/workers-plugin-health-check/trigger\n\n# then list recent executions\ncurl -s 'http://localhost:8091/api/v1/workers/executions?limit=10'"
  },
  {
    label: "Hit the users service",
    lang: "bash",
    code: "# Users oRPC service on :3001 — the request is traced at the service layer.\n# oRPC services are served under /api/rpc/* (not /rpc).\ncurl -s -X POST http://localhost:3001/api/v1/users/list \\\n  -H 'content-type: application/json' \\\n  -d '{}'"
  },
  {
    label: "POST an inbound webhook",
    lang: "bash",
    code: "# Triggers API on :8093 (raw Hono routes, not oRPC) — resolves the inbound\n# trigger, whose enqueueJob action enqueues the workers health-check job,\n# producing a connected dispatch + execution trace.\ncurl -s -X POST http://localhost:8093/api/v1/webhooks/inbound/generic \\\n  -H 'content-type: application/json' \\\n  -d '{}'"
  }
] }) }}

Refresh the **Traces** tab in the dashboard. You will see a trace for the request, with the
service or worker resource as the root span. Click it to expand the span tree, attributes, and
the structured logs correlated to that trace. A webhook that enqueues a job shows the inbound
request span and the resulting job-dispatch and job-execution spans — the dispatcher
propagates `traceparent` into the worker subprocess, so they share one trace.

{{ comp callout { type: "tip", title: "Where the real job spans come from" } }}
The worker dispatcher wraps each run in <code>traceJobExecution</code> and emits
<code>job.started</code> / <code>job.completed</code> / <code>job.failed</code> events, a
duration, and a status; the scheduler emits its own start and per-run spans; the multi-runtime
task executor emits <code>task.execute</code> spans. All of that is automatic — you are seeing
real instrumentation from <code>@netscript/telemetry</code>, not the scaffold helpers.
{{ /comp }}

## Step 3 — Add your own spans in a job handler (the real way today)

The scaffold hands you `createJobTools(ctx)` so you can author against `log`, `progress`, and
`trace`. `log.*` is real today. The `trace.*` helpers are **no-op stubs in the scaffold** — if
you want a real custom span around a unit of work right now, call the `@netscript/telemetry`
instrumentation helpers directly. Keep the `trace.*` calls if you like authoring against the
forward-compatible shape, but do not rely on them for live spans yet.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Real custom span (recommended today)",
    lang: "ts",
    code: "import {\n  createFailureResult,\n  createSuccessResult,\n  defineJobHandler,\n} from '@netscript/plugin-workers-core';\n// Call the instrumentation helpers directly for a REAL child span today.\nimport {\n  recordJobProgress,\n  withChildSpan,\n} from '@netscript/telemetry/instrumentation';\nimport { createJobTools } from './job-tools.ts';\n\nconst handler = defineJobHandler(async (ctx) => {\n  const { log } = createJobTools(ctx); // log.* is real today\n  log.info('Starting workers plugin health check');\n\n  // withChildSpan opens a real span as a child of the active job span\n  // and gives you a handle to attach queryable attributes.\n  const envOk = await withChildSpan('check.environment', async (span) => {\n    span.setAttribute('check.name', 'environment');\n    return Boolean(Deno.env.get('PORT'));\n  });\n\n  if (!envOk) return createFailureResult('environment check failed');\n\n  // Emit a real job.progress event (current / total / percentage).\n  recordJobProgress(1, 1);\n  return createSuccessResult({ status: 'healthy' });\n});\n\nexport default Object.assign(handler, {\n  id: 'workers-plugin-health-check' as const,\n});"
  },
  {
    label: "Forward-compatible scaffold shape",
    lang: "ts",
    code: "import { defineJobHandler } from '@netscript/plugin-workers-core';\nimport { createJobTools } from './job-tools.ts';\n\n// createJobTools(ctx) returns:\n//   log          -> console.* wrappers: info/warn/error/debug (plain stdout today, NOT trace-correlated)\n//   progress     -> progress(percent, message) (forwards to ctx.reportProgress)\n//   trace        -> { addEvent, recordProgress, withChildSpan } (STUB spans today)\n//   traceContext -> { traceparent, tracestate } for manual propagation\n//\n// Authoring against trace.* is fine — your code is ready for when the\n// scaffold helpers are upgraded — but these calls emit NO real spans today.\n// Prefer @netscript/telemetry helpers (other tab) for spans you need now.\nconst handler = defineJobHandler(async (ctx) => {\n  const { log, trace, traceContext } = createJobTools(ctx);\n  log.info('health check', { traceparent: traceContext.traceparent });\n  trace.addEvent('health_check.started'); // no-op in the scaffold today\n  return { ok: true } as const;\n});\n\nexport default handler;"
  },
  {
    label: "Instrumentation helper map",
    lang: "ts",
    code: "// @netscript/telemetry/instrumentation — the real worker helpers:\n//   traceJobExecution(...)  wrap a whole job run in a span (dispatcher uses this)\n//   withChildSpan(name, fn) open a child span under the active context\n//   addJobStepEvent(...)    emit a job.step.* event\n//   recordJobProgress(c, t) emit a job.progress event (current / total / %)\n//   runTracedJob(...)       run a job body inside subprocess trace context\n//   startWorkerSpan(...)    worker lifecycle span\n//\n// Companion subpaths:\n//   @netscript/telemetry/context     active trace context + traceparent helpers\n//   @netscript/telemetry/attributes  canonical OTel attribute keys\n//   @netscript/telemetry/orpc        oRPC client/server trace interceptors\n// Authoritative export map: /reference/telemetry/"
  }
] }) }}

{{ comp callout { type: "tip", title: "Where the scaffold log.* helpers actually go" } }}
<code>log.info</code> / <code>log.warn</code> / <code>log.error</code> in the scaffold's
<code>createJobTools(ctx)</code> forward to <code>console.*</code> — they appear in process
stdout (surfaced in the Aspire dashboard's <strong>Console logs</strong> view per resource),
<strong>not</strong> as OTel-correlated structured log records tied to the active trace. For
trace-correlated structured logging from a handler, use <code>@netscript/logger</code>
directly. Use real spans (the <code>withChildSpan</code> helper) when you want queryable
attributes and durations on a unit of work.
{{ /comp }}

## Step 4 — Extend service tracing and propagate `traceparent`

The services keep trace context across the oRPC/HTTP boundary. The workers service builds its
app with the fluent builder and opts the RPC layer into trace context explicitly:

{{ comp.tabbedCode({ tabs: [
  {
    label: "Enable RPC trace context",
    lang: "ts",
    code: "import { createService } from '@netscript/service';\nimport { router } from './router.ts';\n\n// The plugin API services use the fluent builder. withRPC({ traceContext: true })\n// threads the incoming traceparent through to handlers. oRPC is served under\n// /api/rpc/* by default.\nawait createService(router, { name: 'workers', version: '1.0.0', port: 8091 })\n  .withCors()\n  .withLogger()\n  .withOpenAPI({ title: 'Workers API' })\n  .withDatabase(dbClient)\n  .withRPC({ traceContext: true })\n  .withHealth()\n  .serve();"
  },
  {
    label: "One-shot service (defineService)",
    lang: "ts",
    code: "import { defineService } from '@netscript/service';\nimport { router } from './router.ts';\n\n// Local services use the one-call form. Tracing is enabled by the framework;\n// debug: true surfaces verbose request/trace logs while you wire things up.\nawait defineService(router, {\n  name: 'users',\n  version: '1.0.0',\n  port: parseInt(Deno.env.get('PORT') || '3001'),\n  openapi: { title: 'Users API', description: 'users service' },\n  debug: true,\n});"
  },
  {
    label: "Propagate across a call",
    lang: "bash",
    code: "# When one service calls another over HTTP, forward the W3C traceparent\n# header so both spans land in ONE trace in the dashboard.\ncurl -s http://localhost:3001/api/v1/users/list \\\n  -X POST -H 'content-type: application/json' \\\n  -H 'traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01' \\\n  -d '{}'"
  }
] }) }}

Aspire injects `PORT` at runtime, so the entrypoint reads it from the environment; the typed source
of truth is your `netscript.config.ts` `services.<name>.port` field, which the scaffold wires as the
fallback default — set the port there rather than editing this line.

{{ comp callout { type: "note", title: "traceparent is the join key" } }}
NetScript follows the W3C Trace Context standard. When an inbound request carries a
<code>traceparent</code> header, the service continues that trace instead of starting a new
one — and the worker dispatcher propagates <code>traceparent</code> / <code>tracestate</code>
into the job subprocess. So a webhook on <code>:8093</code> that enqueues a job and the worker
subprocess that runs it appear as a <strong>single correlated trace</strong>, live, today.
Always forward <code>traceparent</code> on service-to-service calls.
{{ /comp }}

## Step 5 — Read the traces

Back in the dashboard at [https://localhost:18888](https://localhost:18888):

1. **Traces** — every request and job as a waterfall of spans. Click a root span to drill into
   children, durations, and attributes (the ones you set via `span.setAttribute(...)`). Job
   runs show `job.started` / `job.completed` events and, where you added them, `job.progress`
   and `job.step.*` events.
2. **Structured logs** — filter by resource (e.g. `workers-api`) or by trace id to see the
   `log.info`/`log.error` lines correlated to a span.
3. **Resources** — health and console output per resource; cross-reference a failing span with
   the resource that produced it.

Confirm liveness independently of the UI by hitting the per-capability health endpoints:

```bash
curl -s http://localhost:8091/health        # workers
curl -s http://localhost:8092/health/live   # sagas
curl -s http://localhost:8093/health        # triggers
curl -s http://localhost:8094/health        # auth
```

## Production pitfalls

{{ comp callout { type: "warning", title: "Custom handler spans: use the helpers, not the stubs" } }}
The scaffold <code>createJobTools(ctx)</code> <code>trace.addEvent</code>,
<code>trace.withChildSpan</code>, and <code>trace.recordProgress</code> are <strong>no-op
stubs</strong> today (tracked debt, fix planned). The dispatcher, scheduler, and task
subprocess spans around your handler are real and need nothing from you — but for a
<em>custom</em> span inside the handler, call <code>@netscript/telemetry/instrumentation</code>
helpers (<code>withChildSpan</code>, <code>recordJobProgress</code>,
<code>addJobStepEvent</code>) directly so the span actually emits.
{{ /comp }}

{{ comp callout { type: "warning", title: "No collector, no traces" } }}
Spans are only collected while Aspire is running and the OTLP endpoint
(<code>http://localhost:4318</code>) is reachable. Running a service standalone with
<code>--no-aspire</code> means tracing has nowhere to export to. If the Traces tab is empty,
check that <code>aspire start</code> is up first — Aspire provisions the collector and dashboard used by the examples.
{{ /comp }}

{{ comp callout { type: "tip", title: "Set attributes, not log lines, for span data" } }}
Data you want to filter or aggregate on (ids, counts, statuses) belongs on the span via
<code>span.setAttribute(...)</code>, not buried in a log string. Attributes are queryable in
the dashboard; freeform log text is not. Reserve <code>log.*</code> for human-readable
narrative and errors.
{{ /comp }}

## See also

{{ comp.featureGrid({ items: [
  {
    title: "Telemetry capability",
    body: "The OTel-in-handlers capability hub — headline API, ports, and the Learn / Do / Reference triplet.",
    href: "/capabilities/telemetry/",
    icon: "◎"
  },
  {
    title: "Observability (explanation)",
    body: "The mental model: spans, structured logs, health endpoints, and how Aspire renders distributed traces across services and jobs.",
    href: "/explanation/observability/",
    icon: "✶"
  },
  {
    title: "telemetry reference",
    body: "The generated @netscript/telemetry API surface — the full, authoritative export map (instrumentation, context, attributes, orpc).",
    href: "/reference/telemetry/",
    icon: "≡"
  },
  {
    title: "logger reference",
    body: "The structured logger used by log.info / log.warn / log.error inside handlers and jobs.",
    href: "/reference/logger/",
    icon: "≡"
  }
] }) }}
