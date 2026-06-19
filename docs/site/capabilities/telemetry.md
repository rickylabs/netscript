---
layout: layouts/base.vto
title: Telemetry & logging
templateEngine: [vento, md]
prev: { label: "KV, queues & cron", href: "/capabilities/kv-queues-cron/" }
next: { label: "Fresh UI & design", href: "/capabilities/fresh-ui/" }
---

{{ comp.breadcrumb() }}

# Telemetry & logging

NetScript treats observability as a built-in, not a bolt-on. Every service and plugin
runtime is wired for **OpenTelemetry** — services serve their RPC handlers with
`.withRPC({ traceContext: true })`, jobs run inside a span-aware context, and structured
logs flow through the framework `logger`. The viewing surface is the **Aspire dashboard at
`http://localhost:18888`**, which collects OTLP traces, metrics, and structured logs from
every resource in the app graph (services, plugin APIs, background processors) the moment
you run `aspire run`. You do not stand up Jaeger, Grafana, or a log shipper to get started —
the AppHost provisions the OTLP collector and the dashboard for you.

This page is the capability hub: what telemetry exists, how to emit it, where to view it,
and — honestly — which parts are still stubs in the current scaffold. For the full generated
API of each unit, follow the reference links: the telemetry primitives live at
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

Telemetry in NetScript spans three layers — emission (in your handler code), transport
(OTLP over HTTP to the collector), and viewing (the Aspire dashboard). The framework owns
transport and viewing; you own emission, and even that is mostly wired for you.

{{ comp.featureGrid({ items: [
  {
    title: "Structured logging",
    body: "The @netscript/logger unit gives every service and plugin a level-aware, structured logger. Config is declared in netscript.config.ts (logging: { level: 'info', format: 'text' }) and threaded through the runtime.",
    icon: "▤"
  },
  {
    title: "OpenTelemetry traces",
    body: "Services enable trace-context propagation with .withRPC({ traceContext: true }); the @opentelemetry/api dependency (^1.9) is in the catalog and wired into the request path so spans flow to the collector.",
    icon: "◈"
  },
  {
    title: "OTLP → Aspire dashboard",
    body: "The generated AppHost configures an OTLP endpoint (http://localhost:4318) and the Aspire dashboard (http://localhost:18888) so traces, metrics, and logs from every resource land in one place.",
    icon: "◎"
  },
  {
    title: "Per-resource health",
    body: "Each plugin API exposes a liveness probe — workers :8091 GET /health, sagas :8092 GET /health/live, triggers :8093 GET /health — surfaced as resource state in the dashboard.",
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
    { name: "http://localhost:4318", type: "OTLP/HTTP", desc: "OTLP ingest endpoint the AppHost configures (aspire.config.json https profile). Runtimes export spans and logs here; the dashboard reads them back." },
    { name: "GET :8091/health", type: "liveness", desc: "Workers API health probe — reported as resource health in the dashboard." },
    { name: "GET :8092/health/live", type: "liveness", desc: "Sagas API liveness route." },
    { name: "GET :8093/health", type: "liveness", desc: "Triggers API health probe (Hono service)." }
  ]
}) }}

## Instrument a handler

The two tabs below show the two emission paths a developer touches: structured logging
through the framework logger, and span-aware work inside a job via `createJobTools(ctx)`.
Both are copied from the real scaffold. Read the honesty callout under them before you
promise a dashboard a progress bar.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Structured logging",
    lang: "ts",
    code: "// netscript.config.ts — declare the logging contract for the whole workspace.\nimport { defineConfig } from '@netscript/config';\n\nexport default defineConfig({\n  name: 'my-app',\n  version: '1.0.0',\n  // level: 'debug' | 'info' | 'warn' | 'error'; format: 'text' | 'json'\n  logging: { level: 'info', format: 'text' },\n  plugins: ['./plugins/workers/mod.ts', './plugins/sagas/mod.ts'],\n});\n\n// Inside a job handler, the logger comes from the job tools (console-backed today).\n// import { createJobTools } from './job-tools.ts';\nconst emit = (log) => {\n  log.info('user provisioned', { userId: 'u_123', source: 'scaffold' });\n  log.warn('rate limit approaching', { remaining: 4 });\n};"
  },
  {
    label: "Spans in a job (OTel API shape)",
    lang: "ts",
    code: "// plugins/workers/jobs/health-check.ts — the span-aware tool surface.\nimport { createSuccessResult, createFailureResult, defineJobHandler } from '@netscript/plugin-workers-core';\nimport { createJobTools } from './job-tools.ts';\n\nconst handler = defineJobHandler(async (ctx) => {\n  // createJobTools(ctx) exposes log, progress, and trace helpers.\n  const { log, progress, trace } = createJobTools(ctx);\n\n  log.info('Starting workers plugin health check');\n  trace.addEvent('health_check.started', { verbose: false });\n  progress(20, 'Checking environment');\n\n  // withChildSpan models the OTel span API; set attributes inside the callback.\n  const envCheck = await trace.withChildSpan('check.environment', (span) => {\n    span.setAttribute('check.name', 'environment');\n    return { ok: true };\n  });\n\n  if (!envCheck.ok) return createFailureResult('environment check failed');\n  return createSuccessResult({ status: 'healthy' });\n});\n\nexport default Object.assign(handler, { id: 'workers-plugin-health-check' as const });"
  }
] }) }}

{{ comp callout { type: "warning", title: "Honest alpha reality: worker trace & progress are no-op stubs" } }}
The <code>trace</code> and <code>progress</code> helpers returned by
<code>createJobTools(ctx)</code> give you the <strong>API shape</strong> to write against, but in
the scaffolded copy <code>trace.{addEvent,recordProgress,withChildSpan}</code> and
<code>progress(...)</code> are <strong>no-op stubs</strong> — <code>log</code> writes to the console;
the spans do nothing and the progress channel is not wired to the dashboard yet. Write the
calls so your code reads correctly and is ready when the runtime lands, but do
<strong>not</strong> promise live distributed traces or a job progress bar from the sample tools in
alpha. The OpenTelemetry that <em>is</em> live today is service-level trace-context propagation
(<code>.withRPC({ traceContext: true })</code>) and the structured logs/health that flow to
<code>:18888</code>. See <a href="/explanation/observability/">Observability</a> for the full
picture of what is real versus deferred.
{{ /comp }}

## View it in Aspire

With `aspire run` up, the dashboard at `http://localhost:18888` gives you three views over the
same telemetry stream — there is no separate tool to configure.

{{ comp.apiTable({
  caption: "Aspire dashboard views (http://localhost:18888)",
  rows: [
    { name: "Resources", type: "graph", desc: "Live state of every app-graph resource: postgres, garnet, workers-api, workers, sagas-api, sagas, triggers-api, triggers. Health probes drive the status colour." },
    { name: "Console logs", type: "stream", desc: "Per-resource stdout/stderr — the framework logger's text/JSON output lands here in real time." },
    { name: "Structured logs", type: "OTLP", desc: "Structured log records exported over OTLP, filterable by resource, level, and attributes." },
    { name: "Traces", type: "OTLP", desc: "Distributed traces collected from the OTLP endpoint (http://localhost:4318) — request spans across services as trace-context propagates." }
  ]
}) }}

{{ comp callout { type: "tip", title: "Use this when…" } }}
Reach for the dashboard whenever you need to answer <strong>"what happened and where"</strong>:
which resource is unhealthy, what a service logged for a given request, or how a call fanned out
across services. Because Aspire wires OTLP for you, the <em>cheapest</em> observability win is
simply running <code>aspire run</code> and opening <code>:18888</code> — no extra dependency, no
collector to deploy. When you outgrow the local dashboard, the same OTLP export
(<code>http://localhost:4318</code>) is the seam you point at a hosted backend.
{{ /comp }}

## Where to go next

Pick the lane that matches what you're doing — copy the instrumentation recipe, build the
mental model, or look up the exact generated surface.

{{ comp.featureGrid({ items: [
  {
    title: "Do — Add OpenTelemetry",
    body: "Task-oriented recipe: enable trace-context propagation, emit spans via trace.withChildSpan, propagate traceparent across services, and point the OTLP export (:4318) at the dashboard.",
    href: "/how-to/add-opentelemetry/",
    icon: "◆"
  },
  {
    title: "Understand — Observability",
    body: "The mental model: how spans, structured logs, health endpoints, and Aspire traces fit together — and an honest map of what's live versus the no-op worker trace/progress stubs.",
    href: "/explanation/observability/",
    icon: "◎"
  },
  {
    title: "Look up — telemetry reference",
    body: "The full generated deno doc API for @netscript/telemetry — every exported span helper, attribute, and type. The authority for signatures.",
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
