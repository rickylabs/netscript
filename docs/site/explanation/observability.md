---
layout: layouts/base.vto
title: Observability
templateEngine: [vento, md]
prev: { label: "Durable workflows", href: "/explanation/durable-workflows/" }
next: { label: "Orchestration with Aspire", href: "/explanation/aspire/" }
---

{{ comp.breadcrumb() }}

# Observability

This page explains *how* NetScript thinks about observability and *why* the model is built
the way it is: OpenTelemetry instrumentation that lives inside your handlers, a uniform
traces-logs-metrics signal set, and the Aspire dashboard as the single viewing surface where
those signals land. It is understanding-oriented — read it to build a mental model of where a
trace comes from and where it goes. When you want to wire spans yourself, follow the
[how-to: add OpenTelemetry](/how-to/add-opentelemetry/); when you want the headline API and
ports, see the [telemetry capability](/capabilities/telemetry/); when you want exact exported
symbols, follow [`reference/telemetry/`](/reference/telemetry/).

{{ comp callout { type: "important", title: "Alpha honesty up front" } }}
The instrumentation <em>seams</em> are real and wired everywhere, but some of the scaffolded
sample tools are deliberately hollow. In particular the worker job tools
(<code>createJobTools(ctx)</code>) expose <code>trace</code> and <code>progress</code> as
<strong>no-op stubs</strong> in the generated project — they log to the console and return,
they do not emit real spans yet. This page tells you exactly which signals are live and which
are placeholders so you never ship a dashboard that promises traces it cannot draw.
{{ /comp }}

## The thesis: observability is a property of the boundary, not an add-on

Most backends bolt observability on after the fact. You write a handler, ship it, watch it
misbehave in production, and *then* thread a logger, a metrics client, and a tracer through
every call site — three libraries, three configuration surfaces, three ways to forget a field.
The instrumentation drifts from the code because it was never part of the code's shape.

NetScript takes the same stance on observability that it takes on
[contracts](/explanation/contracts/): the cross-cutting concern belongs to the boundary, so the
framework owns it and hands you a typed seam. A service built with
[`defineService(...)`](/capabilities/services/) wires request logging, health endpoints, and the
OpenTelemetry context propagation for you in one call. A worker job receives a `ctx` and a small
tools object instead of importing a tracer directly. The intent is that the *common* signal —
"this request happened, here is its trace id, here is whether it was healthy" — is free and
uniform, and the *specific* signal — a custom child span around an expensive step — is one
typed call away.

{{ comp callout { type: "note", title: "Three signals, one context" } }}
OpenTelemetry models telemetry as three correlated signal types: <strong>traces</strong> (the
causal tree of spans for one logical operation), <strong>logs</strong> (timestamped structured
records), and <strong>metrics</strong> (aggregated counters and gauges). NetScript's design goal
is that all three share one <em>trace context</em> — the <code>traceparent</code> that travels
with a request — so a log line, a span, and a counter can be stitched back to the same operation
in the dashboard. The shared context is what turns three separate streams into one story.
{{ /comp }}

## Where the signal is born: instrumentation inside the handler

The instrumentation point in NetScript is the handler context, not a global singleton you reach
for from anywhere. Two concrete seams matter.

**Services** propagate trace context automatically. When you serve a router with
`defineService(...)`, RPC handling carries the incoming `traceparent` so a downstream call is a
child of the caller's span rather than an orphan. You write the business logic; the framework
keeps the causal chain intact across the service boundary.

**Worker jobs** receive a tools object built from the job context. `createJobTools(ctx)` returns
`{ log, progress, trace }` — structured logging, progress reporting, and a tracing helper with
`addEvent`, `recordProgress`, and `withChildSpan`. The *design intent* is that a job author
brackets an expensive step in a child span and the span lands in the dashboard's trace view,
correlated with the job's execution.

{{ comp.tabbedCode({ tabs: [
  {
    label: "workers/jobs/health-check.ts",
    lang: "ts",
    code: "import {\n  defineJobHandler,\n  createSuccessResult,\n  createFailureResult,\n} from '@netscript/plugin-workers-core';\nimport { createJobTools } from './job-tools.ts';\n\n// The instrumentation seam: tools come FROM the job context,\n// not from a global tracer you import and configure yourself.\nconst handler = defineJobHandler(async (ctx) => {\n  const { log, progress, trace } = createJobTools(ctx);\n\n  log.info('Starting workers plugin health check');\n  trace.addEvent('health_check.started', { verbose: false });\n  progress(20, 'Checking environment');\n\n  // The design intent: bracket an expensive step in a child span.\n  const env = await trace.withChildSpan('check.environment', (span) => {\n    span.setAttribute('check.name', 'environment');\n    return { ok: true };\n  });\n\n  return env.ok\n    ? createSuccessResult({ status: 'healthy' })\n    : createFailureResult('environment check failed');\n});\n\nexport default Object.assign(handler, {\n  id: 'workers-plugin-health-check' as const,\n});"
  },
  {
    label: "What is live vs stubbed",
    lang: "text",
    code: "createJobTools(ctx) returns { log, progress, trace }\n\n  log.info / log.warn / log.error\n     -> structured console logging         LIVE (writes records)\n\n  progress(pct, message)\n     -> progress reporting                 NO-OP STUB in scaffold\n\n  trace.addEvent(name, attrs)\n  trace.recordProgress(...)\n  trace.withChildSpan(name, fn)\n     -> OpenTelemetry spans                 NO-OP STUB in scaffold\n        (fn still runs; no span is exported)\n\nThe SHAPES are real and stable. The bodies in the generated\nsample are placeholders. Do not promise live worker traces\nfrom these tools until the runtime fills them in."
  }
] }) }}

{{ comp callout { type: "warning", title: "The stub boundary, stated plainly" } }}
In the scaffolded project, <code>trace.withChildSpan</code> still <em>runs your callback</em> —
your code executes and returns normally — but it does <strong>not</strong> export a real
OpenTelemetry span, and <code>progress(...)</code> does not surface a real progress signal. They
are console-logging no-ops. So a worker job's structured logs are real and useful today; its
distributed traces are a seam waiting on runtime, not a feature you can demo in the dashboard
yet. Write your jobs against the API — the shape will not change — but tell your team the trace
view will be empty for worker spans for now.
{{ /comp }}

## Where the signal goes: OTLP to the Aspire dashboard

A span or a log is only useful once something collects it. In the default NetScript dev loop
that collector is the Aspire dashboard, and the wire between your process and the dashboard is
**OTLP** (the OpenTelemetry Protocol). The generated Aspire AppHost configures an OTLP endpoint
at `http://localhost:4318` and a dashboard UI at `http://localhost:18888`; resources started
under Aspire are handed the OTLP endpoint through environment variables, so they export their
telemetry to the dashboard without per-service configuration.

This is why [Aspire is step 2](/explanation/aspire/) of the dev flow, not an afterthought:
`cd aspire && aspire run` brings up the dashboard (and the OTLP receiver behind it) before you
exercise any handler, so the very first request you make has somewhere to land. Without the
dashboard running, your handlers still execute — they simply export into the void.

{{ comp.apiTable({
  caption: "The observability surface — endpoints, ports, and what each one carries",
  rows: [
    { name: "Aspire dashboard", type: "http://localhost:18888", desc: "The viewing surface. Resource graph, per-resource health, console logs, structured logs, and the distributed-trace view. Login token is printed by `aspire run`." },
    { name: "OTLP receiver", type: "http://localhost:4318", desc: "Where processes export OpenTelemetry traces/logs/metrics. Configured by the generated Aspire AppHost and handed to resources via environment variables." },
    { name: "Workers health", type: "GET :8091/health", desc: "Liveness for the workers API. The simplest signal: is this capability up?" },
    { name: "Sagas health", type: "GET :8092/health/live", desc: "Liveness for the sagas API (note the /health/live path on sagas specifically)." },
    { name: "Triggers health", type: "GET :8093/health", desc: "Liveness for the triggers (Hono) API." },
    { name: "Service trace context", type: "traceparent", desc: "Propagated by defineService RPC handling so a downstream call is a child span of its caller, not an orphan." }
  ]
}) }}

## How the pieces correlate (a diagram in prose)

Here is the journey of one signal — say a child span around a database read inside a job — from
where it is created to where you read it in the dashboard:

```text
  handler context          framework seam            OTLP wire              Aspire dashboard
 ────────────────        ─────────────────        ─────────────         ────────────────────

 createJobTools(ctx)  ->  trace.withChildSpan  ->  export via OTLP   ->  trace view at :18888
   { log, trace }          (design: real span)      :4318 endpoint        correlated by trace id
       │                         │                       │                       │
       │  structured logs        │  spans + events       │  one transport        │  logs + spans +
       │  (LIVE today)           │  (STUB in worker       │  for all three        │  health, one place
       ▼                         ▼   sample today)        ▼  signal types         ▼
   one ctx, one trace id    one causal tree         OTel Protocol          one operation, end to end
```

Read it left to right. A handler asks its context for tools. The framework's tracing seam is
*meant* to produce a real span (and does, for instrumented framework code; it is stubbed in the
scaffolded worker sample). Whatever signal is produced is exported over OTLP to the dashboard's
receiver on `:4318`. The dashboard correlates the span, the log lines, and the health state by
trace id and shows them as one operation at [http://localhost:18888](http://localhost:18888).
The point of the shared trace context is exactly this last hop: three streams, reassembled into
one story, because they all carried the same id.

{{ comp callout { type: "tip", title: "Health endpoints are observability too" } }}
Don't overlook the cheapest signal. Every capability service ships a health route —
<code>:8091/health</code> (workers), <code>:8092/health/live</code> (sagas),
<code>:8093/health</code> (triggers) — and Aspire surfaces each resource's health on the
dashboard's resource graph. Before you reach for distributed tracing, "is this resource green?"
answers most production questions, and it is wired with zero handler code.
{{ /comp }}

## Why this design, and what it costs

The honest trade-offs, because instrumentation-in-the-handler is an opinion:

- **Telemetry follows the framework, not a side library.** Because the trace context rides the
  service boundary and the tools come from the job context, you cannot accidentally instrument
  half your code. The cost is that you instrument NetScript's *way* — you reach for `ctx` tools
  and the catalog-pinned `@opentelemetry/api` (`^1.9`), not whatever tracer you used last job.
- **One viewing surface in dev, your choice in prod.** The dashboard at `:18888` is a developer
  convenience wired by Aspire. It is an OTLP receiver like any other; in production you point the
  same OTLP export at your own collector. The model does not lock you to Aspire — it locks you to
  the protocol.
- **The stubs are a known, bounded gap.** Worker `trace`/`progress` being no-ops is the most
  important honesty in this whole zone. The shapes are stable, so code you write now keeps
  working when the runtime fills them in — but you must not build dashboards, alerts, or demos
  that depend on worker spans today. Structured logs and health are the signals you can trust now.
- **Correlation depends on context propagation working end to end.** A dropped `traceparent` (a
  call that doesn't carry it forward) turns a child span into an orphan and breaks the single-story
  view. The framework propagates it across the service boundary so you don't have to — but custom
  fan-out (spawning your own fetches) is where you reintroduce the responsibility.

The OpenTelemetry dependency is pinned in the workspace catalog (`@opentelemetry/api` at `^1.9`)
and imported through the catalog, never de-catalogued, so every workspace member shares one
telemetry API surface.

## Glossary

- **OpenTelemetry (OTel)** — the vendor-neutral standard for traces, logs, and metrics that
  NetScript instruments against (`@opentelemetry/api`). See the [glossary](/glossary/) and the
  [telemetry capability](/capabilities/telemetry/).
- **OTLP** — the OpenTelemetry Protocol; the wire your process uses to export telemetry. In dev,
  the Aspire AppHost receives it at `http://localhost:4318`.
- **Span** — one node in a trace: a named, timed operation with attributes and events. A child
  span (`trace.withChildSpan`) nests under its parent to form the causal tree.
- **traceparent** — the W3C trace-context header that carries the trace id across a boundary so
  separate spans stitch into one trace.

## Where to go next

- **Do it:** the [how-to: add OpenTelemetry](/how-to/add-opentelemetry/) walks adding a custom
  span, structured logs, and `traceparent` propagation against a running service.
- **Hub:** the [telemetry capability](/capabilities/telemetry/) covers the headline API and the
  OTel-wired-into-handlers model with the real endpoints.
- **Surface:** [Orchestration with Aspire](/explanation/aspire/) explains the dashboard and OTLP
  receiver that consume these signals.
- **Reference:** the exact exported symbols live in [`reference/telemetry/`](/reference/telemetry/)
  and the logging surface in [`reference/logger/`](/reference/logger/).

{{ comp.nextPrev({ prev: { label: "Durable workflows", href: "/explanation/durable-workflows/" }, next: { label: "Orchestration with Aspire", href: "/explanation/aspire/" } }) }}
