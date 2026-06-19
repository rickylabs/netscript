---
layout: layouts/base.vto
title: Add OpenTelemetry
templateEngine: [vento, md]
prev: { "label": "Queue / KV / cron", "href": "/how-to/queue-kv-cron/" }
next: { "label": "Customize Fresh UI", "href": "/how-to/customize-fresh-ui/" }
---

# Add OpenTelemetry

**Scope:** turn on, extend, and read distributed traces in an existing NetScript
workspace. OpenTelemetry is not a bolt-on here — `@opentelemetry/api` is wired into the
service and job handlers the scaffold generates, and Aspire stands up the OTLP collector
and the trace UI for you. This recipe shows where the instrumentation already lives, how
to add your own spans and structured logs, how `traceparent` propagates across the
oRPC/HTTP boundary, and how to watch it all land in the Aspire dashboard at
[http://localhost:18888](http://localhost:18888).

This is a task recipe, not a deep-dive. For the mental model behind spans, structured
logs, and the per-capability health endpoints, read
[Observability](/explanation/observability/). For the generated API surface, follow the
[`telemetry`](/reference/telemetry/) and [`logger`](/reference/logger/) reference pages.

{{ comp callout { type: "important", title: "Honest status — worker trace/progress are stubs today" } }}
The job tools you get from <code>createJobTools(ctx)</code> — <code>log</code>,
<code>progress</code>, and <code>trace</code> — are wired into the sample jobs, but in the
<strong>scaffolded copy the <code>trace</code> and <code>progress</code> helpers are no-op
stubs</strong>: <code>trace.withChildSpan</code> and <code>trace.addEvent</code> run your
callback and log to the console, but they do not yet emit real OTel spans, and
<code>progress(...)</code> only logs. Service-level tracing (the oRPC services on
<code>:3001</code>, <code>:8091</code>, <code>:8092</code>, <code>:8093</code>) is real.
Author your jobs against the <code>trace</code> API now — when the runtime lands real
spans, your code emits them with no changes — but do not promise live per-job spans in a
demo yet.
{{ /comp }}

## Prerequisites

{{ comp.apiTable({ caption: "What this recipe assumes", rows: [
  { name: "netscript workspace", type: "netscript init", desc: "An existing workspace. If you have none, scaffold one first — see the tutorials." },
  { name: "Aspire running", type: "cd aspire && aspire run", desc: "The AppHost provisions the OTLP collector + dashboard. Start it BEFORE you expect traces. Dashboard at http://localhost:18888." },
  { name: "@opentelemetry/api", type: "catalog: ^1.9", desc: "Already pinned in the workspace catalog and consumed by the generated handlers — no install step." },
  { name: "A service or plugin to trace", type: "services/users or plugins/workers", desc: "The users service (:3001) and the workers/sagas/triggers plugins all emit health + trace data once running." }
] }) }}

{{ comp callout { type: "warning", title: "Aspire first, always" } }}
The OTLP endpoint and the trace UI are <strong>Aspire resources</strong>. If
<code>aspire run</code> is not up, there is nowhere for spans to go and nothing to view.
Start orchestration from the <code>aspire/</code> folder
(<code>cd aspire &amp;&amp; aspire run</code>) before you run a service, trigger a job, or
open the dashboard. This is the same dependency the database commands have.
{{ /comp }}

## How the telemetry is already wired

Two layers ship instrumented out of the box. Knowing which is which tells you where to add
your own spans.

{{ comp.apiTable({ caption: "Where instrumentation lives", rows: [
  { name: "Service layer (real spans)", type: "@netscript/service", desc: "defineService(...) and the fluent createService(...).withRPC({ traceContext: true }).serve() builder enable RPC trace context. Incoming requests are traced and traceparent is read/propagated." },
  { name: "Job tools (stub spans today)", type: "createJobTools(ctx)", desc: "log / progress / trace handed to defineJobHandler bodies. trace.withChildSpan + trace.addEvent are no-ops in the scaffold; structured logging via log.* is real." },
  { name: "OTLP export", type: "http://localhost:4318", desc: "The Aspire https profile points OTLP at http://localhost:4318; the dashboard renders the collected traces at :18888." },
  { name: "Health endpoints", type: "GET /health", desc: "Each plugin API exposes liveness — Workers GET /health (:8091), Sagas GET /health/live (:8092), Triggers GET /health (:8093) — that the dashboard surfaces alongside traces." }
] }) }}

## Step 1 — Bring up Aspire and confirm the collector

From the workspace root, start orchestration. The AppHost registers the OTLP collector and
the dashboard, then boots Postgres, Garnet, and every service/plugin resource.

```bash
cd aspire
aspire run
# dashboard: http://localhost:18888  (login token printed in the console)
```

Open [http://localhost:18888](http://localhost:18888), authenticate with the token Aspire
printed, and select the **Traces** tab. With nothing exercised yet it is empty — that is
expected. Leave it open; it updates live.

{{ comp callout { type: "note", title: "Resources you should see" } }}
The Aspire resource graph lists <code>postgres</code>, <code>garnet</code>,
<code>workers-api</code>, <code>workers</code>, <code>sagas-api</code>, <code>sagas</code>,
<code>triggers-api</code>, and <code>triggers</code>. Each service resource exports its
telemetry to the OTLP endpoint at <code>http://localhost:4318</code>; the dashboard reads
from there.
{{ /comp }}

## Step 2 — Generate a service trace

Service-layer tracing is real and needs no code from you. Exercise a running service and a
span appears.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Trigger a worker job",
    lang: "bash",
    code: "# Workers API on :8091 — enqueue the sample health-check job by id\ncurl -s -X POST http://localhost:8091/api/v1/workers/jobs/workers-plugin-health-check/trigger\n\n# then list recent executions\ncurl -s 'http://localhost:8091/api/v1/workers/executions?limit=10'"
  },
  {
    label: "Hit the users service",
    lang: "bash",
    code: "# Users oRPC service on :3001 — the request is traced at the service layer\ncurl -s -X POST http://localhost:3001/api/v1/users/list \\\n  -H 'content-type: application/json' \\\n  -d '{}'"
  },
  {
    label: "POST an inbound webhook",
    lang: "bash",
    code: "# Triggers API on :8093 (raw Hono) — resolves trigger id inbound/generic,\n# which enqueues the workers health-check job\ncurl -s -X POST http://localhost:8093/api/v1/webhooks/inbound/generic \\\n  -H 'content-type: application/json' \\\n  -d '{}'"
  }
] }) }}

Refresh the **Traces** tab in the dashboard. You will see a trace for the request, with the
service resource as the root span. Click it to expand the span tree, attributes, and the
structured logs correlated to that trace.

## Step 3 — Add your own spans and structured logs in a job

Inside a job handler, pull the tools from `createJobTools(ctx)` and wrap meaningful work in
a child span. The sample `plugins/workers/jobs/health-check.ts` does exactly this — model
your jobs on it.

{{ comp.tabbedCode({ tabs: [
  {
    label: "jobs/health-check.ts",
    lang: "ts",
    code: "import {\n  createFailureResult,\n  createSuccessResult,\n  defineJobHandler,\n} from '@netscript/plugin-workers-core';\nimport { createJobTools } from './job-tools.ts';\n\nconst handler = defineJobHandler(async (ctx) => {\n  // log/progress/trace are the built-in observability tools for a job.\n  const { log, progress, trace } = createJobTools(ctx);\n\n  log.info('Starting workers plugin health check');\n  trace.addEvent('health_check.started', { verbose: false });\n  progress(20, 'Checking environment');\n\n  // Wrap a unit of work in a child span and attach attributes.\n  const envOk = await trace.withChildSpan('check.environment', (span) => {\n    span.setAttribute('check.name', 'environment');\n    return Boolean(Deno.env.get('PORT'));\n  });\n\n  if (!envOk) return createFailureResult('environment check failed');\n\n  progress(100, 'Healthy');\n  return createSuccessResult({ status: 'healthy' });\n});\n\nexport default Object.assign(handler, {\n  id: 'workers-plugin-health-check' as const,\n});"
  },
  {
    label: "What each tool does",
    lang: "ts",
    code: "// createJobTools(ctx) wraps the JobHandlerContext and returns:\n//   log      -> structured logger: log.info / log.warn / log.error (REAL today)\n//   progress -> progress(percent, message) (logs today; reporting deferred)\n//   trace    -> { addEvent, recordProgress, withChildSpan } (STUB spans today)\n//   traceContext -> the active trace context for manual propagation\n//\n// withChildSpan runs your callback and gives you a span handle to\n// setAttribute(...) on. Author against it now; real spans land later\n// with no change to this code."
  }
] }) }}

{{ comp callout { type: "tip", title: "Structured logs are real now" } }}
Even while job spans are stubbed, <code>log.info</code> / <code>log.warn</code> /
<code>log.error</code> emit <strong>structured logs</strong> that the dashboard correlates
to the active trace context. Lean on logs for job-level visibility today, and keep the
<code>trace.withChildSpan</code> calls in place so the spans appear automatically when the
runtime upgrades.
{{ /comp }}

## Step 4 — Extend service tracing and propagate `traceparent`

The services keep trace context across the oRPC/HTTP boundary. The workers service builds
its app with the fluent builder and opts the RPC layer into trace context explicitly:

{{ comp.tabbedCode({ tabs: [
  {
    label: "Enable RPC trace context",
    lang: "ts",
    code: "import { createService } from '@netscript/service';\nimport { router } from './router.ts';\n\n// The plugin API services use the fluent builder. withRPC({ traceContext: true })\n// is what threads the incoming traceparent through to handlers.\nawait createService(router, { name: 'workers', version: '1.0.0', port: 8091 })\n  .withCors()\n  .withLogger()\n  .withOpenAPI({ title: 'Workers API' })\n  .withDatabase(dbClient)\n  .withRPC({ traceContext: true })\n  .withHealth()\n  .serve();"
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

{{ comp callout { type: "note", title: "traceparent is the join key" } }}
NetScript follows the W3C Trace Context standard. When an inbound request carries a
<code>traceparent</code> header, the service continues that trace instead of starting a new
one — so a webhook on <code>:8093</code> that enqueues a job, and the worker that runs it,
appear as a single correlated trace once the job span runtime is live. Always forward
<code>traceparent</code> on service-to-service calls.
{{ /comp }}

## Step 5 — Read the traces

Back in the dashboard at [http://localhost:18888](http://localhost:18888):

1. **Traces** — every request as a waterfall of spans. Click a root span to drill into
   children, durations, and attributes (the ones you set via `span.setAttribute(...)`).
2. **Structured logs** — filter by resource (e.g. `workers-api`) or by trace id to see the
   `log.info`/`log.error` lines correlated to a span.
3. **Resources** — health and console output per resource; cross-reference a failing span
   with the resource that produced it.

Confirm liveness independently of the UI by hitting the per-capability health endpoints:

```bash
curl -s http://localhost:8091/health        # workers
curl -s http://localhost:8092/health/live   # sagas
curl -s http://localhost:8093/health        # triggers
```

## Production pitfalls

{{ comp callout { type: "warning", title: "Do not promise job spans you do not have" } }}
The scaffolded <code>createJobTools</code> trace and progress helpers are <strong>no-op
stubs</strong>. A live demo that claims to show per-job OTel spans from the sample jobs
will mislead — service spans are real, job spans are not yet. Show service traces for the
live story and treat job <code>trace.*</code> calls as forward-compatible scaffolding.
{{ /comp }}

{{ comp callout { type: "warning", title: "No collector, no traces" } }}
Spans are only collected while Aspire is running and the OTLP endpoint
(<code>http://localhost:4318</code>) is reachable. Running a service standalone with
<code>--no-aspire</code> means tracing has nowhere to export to. If the Traces tab is empty,
check that <code>aspire run</code> is up first.
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
    body: "The mental model: spans, structured logs, health endpoints, and how Aspire renders distributed traces.",
    href: "/explanation/observability/",
    icon: "✶"
  },
  {
    title: "telemetry reference",
    body: "The generated @netscript/telemetry API surface — the full, authoritative export map.",
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
