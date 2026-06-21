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
run `aspire run`. You do not stand up Jaeger, Grafana, or a log shipper to get started — the
AppHost provisions the OTLP collector and the dashboard for you.

This page is the capability hub: what telemetry exists, how to emit it, where to view it,
and — honestly — the one place that is still a scaffold stub. For the full generated API of
each unit, follow the reference links: the telemetry primitives live at
[`/reference/telemetry/`](/reference/telemetry/) and the structured logger at
[`/reference/logger/`](/reference/logger/).

{{ comp callout { type: "important", title: "Aspire first, then telemetry" } }}
The dashboard, the OTLP collector, and the per-resource trace/log views all come up with the
orchestrator — they are not separate processes you start by hand. Run
<code>cd aspire &amp;&amp; aspire run</code> <strong>before</strong> any <code>netscript db</code>
command (Aspire provisions Postgres and Garnet first), then open the dashboard URL printed in
the console (<code>http://localhost:18888</code>, with a one-time auth token). Until Aspire is
running there is no <code>:18888</code> surface to view traces or logs on. See
<a href="/how-to/database-migration/">Database &amp; migration</a> for the full startup order.
{{ /comp }}

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

## Endpoints & ports

Telemetry has no single service of its own — it is emitted by every runtime and aggregated
by Aspire. These are the real addresses you interact with, validated by the CLI E2E suite.

{{ comp.apiTable({
  caption: "Observability surfaces (link to /reference/telemetry/ and /reference/logger/ for the generated APIs)",
  rows: [
    { name: "http://localhost:18888", type: "dashboard", desc: "Aspire dashboard — traces, structured logs, metrics, and resource state for the whole app graph. Auth token printed by `aspire run`." },
    { name: "http://localhost:4318", type: "OTLP/HTTP", desc: "OTLP ingest endpoint the AppHost configures (aspire.config.json https profile). Runtimes export spans and logs here; the dashboard reads them back. This is the seam you point at a hosted backend." },
    { name: "GET :8091/health", type: "liveness", desc: "Workers API health probe — reported as resource health in the dashboard." },
    { name: "GET :8092/health/live", type: "liveness", desc: "Sagas API liveness route." },
    { name: "GET :8093/health", type: "liveness", desc: "Triggers API health probe (Hono service)." },
    { name: ":8094", type: "service", desc: "Auth API (auth-api) — its request spans propagate trace context like any other service." }
  ]
}) }}

## What is traced automatically

Before you write a single instrumentation call, the worker runtime already produces a usable
trace tree in Aspire. The `@netscript/telemetry` instrumentation is wired into the dispatcher,
the executor, and the scheduler, so the moment a job runs you get spans with attributes,
durations, status, and lifecycle events — no scaffold changes required.

{{ comp.apiTable({
  caption: "Automatic worker traces (emitted by the runtime — see /reference/telemetry/)",
  rows: [
    { name: "traceJobExecution", type: "span", desc: "Wraps each job's execution with attributes, duration, status, and job.started / job.completed / job.failed / job.exception events. Emitted by the dispatcher." },
    { name: "recordJobProgress", type: "event", desc: "job.progress events carrying current / total / percentage — the runtime records real progress as the job advances." },
    { name: "addJobStepEvent", type: "event", desc: "job.step.* events for each step the runtime walks through." },
    { name: "scheduler spans", type: "span", desc: "createSchedulerStartSpan / createScheduleJobSpan / traceJobDispatch / recordCronJobRun — cron and schedule dispatch are traced end to end." },
    { name: "subprocess traceparent", type: "context", desc: "The dispatcher injects W3C traceparent / tracestate into the subprocess env so out-of-process job runs continue the same trace (initJobTracing / runTracedJob)." },
    { name: "task.execute", type: "span", desc: "The multi-runtime task executor wraps each task run in a task.execute span (TaskExecutorSpan → OTel) — polyglot and TS tasks alike show up in the trace tree." }
  ]
}) }}

{{ comp callout { type: "tip", title: "The cheapest observability win" } }}
Run <code>aspire run</code>, trigger a job, and open <code>:18888</code> → <strong>Traces</strong>.
You will see the dispatch span, the execution span, progress and step events, and — for
subprocess or polyglot tasks — a continued trace across the process boundary. None of that
requires editing the scaffold. Reach for custom instrumentation only when you want spans
<em>inside your own handler logic</em>.
{{ /comp }}

## Instrument a handler

The two tabs below show the two emission paths a developer touches: structured logging
through the framework logger, and **custom** spans inside a job handler. For custom spans,
call the `@netscript/telemetry` helpers (`traceJobExecution`, `withChildSpan`,
`recordJobProgress`) directly — they are the real, supported surface. Read the honesty
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
    code: "// plugins/workers/jobs/health-check.ts — real custom spans inside a handler.\n// The dispatcher already wraps this job in traceJobExecution automatically;\n// withChildSpan + recordJobProgress let you add detail under that parent span.\nimport { createSuccessResult, createFailureResult, defineJobHandler } from '@netscript/plugin-workers-core';\nimport { withChildSpan, recordJobProgress } from '@netscript/telemetry/instrumentation';\n\nconst handler = defineJobHandler(async (ctx) => {\n  const { log } = ctx;\n  log.info('Starting workers plugin health check');\n\n  // Real progress event — shows up as job.progress in the trace.\n  recordJobProgress(1, 2, 'Checking environment');\n\n  // withChildSpan opens a real child span under the job-execution span.\n  const envCheck = await withChildSpan('check.environment', (span) => {\n    span.setAttribute('check.name', 'environment');\n    return { ok: true };\n  });\n\n  recordJobProgress(2, 2);\n  if (!envCheck.ok) return createFailureResult('environment check failed');\n  return createSuccessResult({ status: 'healthy' });\n});\n\nexport default Object.assign(handler, { id: 'workers-plugin-health-check' as const });"
  }
] }) }}

{{ comp callout { type: "warning", title: "Honest alpha reality: the scaffold createJobTools(ctx) trace/progress helpers are no-op stubs" } }}
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
{{ /comp }}

## View it in Aspire

With `aspire run` up, the dashboard at `http://localhost:18888` gives you four views over the
same telemetry stream — there is no separate tool to configure.

{{ comp.apiTable({
  caption: "Aspire dashboard views (http://localhost:18888)",
  rows: [
    { name: "Resources", type: "graph", desc: "Live state of every app-graph resource: postgres, garnet, workers-api, workers, sagas-api, sagas, triggers-api, triggers, auth-api. Health probes drive the status colour." },
    { name: "Console logs", type: "stream", desc: "Per-resource stdout/stderr — the framework logger's text/JSON output lands here in real time." },
    { name: "Structured logs", type: "OTLP", desc: "Structured log records exported over OTLP, filterable by resource, level, and attributes." },
    { name: "Traces", type: "OTLP", desc: "Distributed traces collected from the OTLP endpoint (http://localhost:4318) — job dispatch/execution/scheduler/task spans and cross-service request spans as trace context propagates." }
  ]
}) }}

{{ comp callout { type: "tip", title: "Use this when…" } }}
Reach for the dashboard whenever you need to answer <strong>"what happened and where"</strong>:
which resource is unhealthy, what a service logged for a given request, why a job failed, or how
a call fanned out across services and subprocesses. Because Aspire wires OTLP for you, the
<em>cheapest</em> observability win is simply running <code>aspire run</code> and opening
<code>:18888</code> — no extra dependency, no collector to deploy. When you outgrow the local
dashboard, the same OTLP export (<code>http://localhost:4318</code>) is the seam you point at a
hosted backend.
{{ /comp }}

## Where to go next

Pick the lane that matches what you're doing — copy the instrumentation recipe, build the
mental model, or look up the exact generated surface.

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
    body: "The full generated deno doc API for @netscript/telemetry — traceJobExecution, recordJobProgress, withChildSpan, scheduler spans, and every attribute and type. The authority for signatures.",
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
