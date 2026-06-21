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
the way it is: OpenTelemetry instrumentation that the framework wires into your boundaries, a
uniform traces-logs-metrics signal set, and the Aspire dashboard as the single viewing surface
where those signals land. It is understanding-oriented — read it to build a mental model of where
a trace comes from and where it goes. When you want to wire spans yourself, follow the
[how-to: add OpenTelemetry](/how-to/add-opentelemetry/); when you want the headline API and
ports, see the [telemetry capability](/capabilities/telemetry/); when you want exact exported
symbols, follow [`reference/telemetry/`](/reference/telemetry/).

{{ comp callout { type: "note", title: "What is live, in one sentence" } }}
Job dispatch, job execution, scheduler runs, subprocess trace continuation, and
<code>task.execute</code> spans are <strong>real OpenTelemetry today</strong> — they appear in the
Aspire trace view automatically. The single honest gap is narrow and tracked: the scaffold's
<code>createJobTools(ctx)</code> handler helpers (<code>trace.addEvent</code>,
<code>withChildSpan</code>, <code>progress</code>) are still no-op stubs in the generated sample —
for custom handler spans, reach for <code>@netscript/telemetry</code> directly.
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
OpenTelemetry context propagation for you in one call. A worker job is dispatched *inside a span*
the framework opens for you — you do nothing, and the job's lifecycle still lands in the trace
view. The intent is that the *common* signal — "this operation happened, here is its trace id,
here is whether it was healthy" — is free and uniform, and the *specific* signal — a custom child
span around an expensive step — is one typed call away.

{{ comp callout { type: "note", title: "Three signals, one context" } }}
OpenTelemetry models telemetry as three correlated signal types: <strong>traces</strong> (the
causal tree of spans for one logical operation), <strong>logs</strong> (timestamped structured
records), and <strong>metrics</strong> (aggregated counters and gauges). NetScript's design goal
is that all three share one <em>trace context</em> — the <code>traceparent</code> that travels
with a request — so a log line, a span, and a counter can be stitched back to the same operation
in the dashboard. The shared context is what turns three separate streams into one story.
{{ /comp }}

## Where the signal is born: instrumentation the framework owns

The instrumentation point in NetScript is the boundary the framework controls — the service RPC
handler, the worker dispatcher, the scheduler — not a global singleton you reach for from
anywhere. Three concrete seams matter, and all three emit real OpenTelemetry today.

**Services** propagate trace context automatically. When you serve a router with
`defineService(...)`, RPC handling on `/api/rpc/*` carries the incoming `traceparent` so a
downstream call is a child of the caller's span rather than an orphan. You write the business
logic; the framework keeps the causal chain intact across the service boundary.

**Worker jobs** are wrapped by the dispatcher in a real execution span. Before your handler runs,
the framework opens a `traceJobExecution` span carrying job attributes, duration, and status, and
emits `job.started` / `job.completed` / `job.failed` / `job.exception` events. Step events
(`job.step.*`) and progress events (`job.progress`, with current/total/percentage) are real. When
a job runs out-of-process, the dispatcher injects the W3C `traceparent`/`tracestate` into the
subprocess environment so the child run continues the *same* trace — its spans nest under the
parent in the dashboard.

**The scheduler** emits its own spans for schedule start, per-job dispatch, and cron runs, so a
cron-triggered job is a causal descendant of the scheduler tick that fired it.

**Task runs** emit `task.execute` spans. The multi-runtime task executor brackets each task in a
real OpenTelemetry span and copies its recorded attributes onto the exported span — so polyglot
tasks defined with [`defineTask`](/capabilities/background-jobs/) are traced like any other unit.

{{ comp callout { type: "important", title: "The honest gap: scaffold job-tools helpers" } }}
Two layers, stated precisely so you never over- or under-claim:
<br><br>
<strong>Framework / dispatcher layer = real OTel.</strong> <code>traceJobExecution</code>,
scheduler spans, subprocess <code>traceparent</code> propagation, and <code>task.execute</code>
spans are live. A user gets job traces in Aspire <em>automatically</em>, with zero handler code.
<br><br>
<strong>Scaffold <code>createJobTools(ctx)</code> helpers = still no-op stubs.</strong> The
<code>trace.addEvent</code>, <code>trace.withChildSpan</code>, and <code>progress(...)</code>
helpers the generated sample hands <em>into your handler</em> are placeholders — your callback
still runs and returns normally, but no extra span is exported from those calls. This is a
<strong>known, tracked limitation with a fix planned</strong> (debt
<code>workers-scaffold-job-tools-noop</code>), not a permanent design choice. The honest
workaround today: call <code>@netscript/telemetry</code> helpers directly from your handler for
custom spans.
{{ /comp }}

{{ comp.tabbedCode({ tabs: [
  {
    label: "Custom handler span (the supported path today)",
    lang: "ts",
    code: "import {\n  defineJobHandler,\n  createSuccessResult,\n  createFailureResult,\n} from '@netscript/plugin-workers-core';\n// For CUSTOM spans inside a handler, import the telemetry helpers directly.\n// The dispatcher already opened the parent job span around this handler,\n// so this child span nests under it automatically.\nimport { withChildSpan } from '@netscript/telemetry/instrumentation';\n\nconst handler = defineJobHandler(async (ctx) => {\n  ctx.logger.info('Starting workers plugin health check');\n\n  // Bracket an expensive step in a REAL child span. Because the\n  // framework already wraps the job in traceJobExecution, this child\n  // lands under the job's trace in the Aspire trace view.\n  const env = await withChildSpan('check.environment', async (span) => {\n    span.setAttribute('check.name', 'environment');\n    return { ok: true };\n  });\n\n  return env.ok\n    ? createSuccessResult({ status: 'healthy' })\n    : createFailureResult('environment check failed');\n});\n\nexport default Object.assign(handler, {\n  id: 'workers-plugin-health-check' as const,\n});"
  },
  {
    label: "What is live vs stubbed",
    lang: "text",
    code: "Framework / dispatcher layer (you write NO instrumentation):\n\n  traceJobExecution span                 LIVE  (job.started/completed/failed/exception)\n  addJobStepEvent -> job.step.*          LIVE\n  recordJobProgress -> job.progress      LIVE  (current/total/percentage)\n  scheduler start / dispatch / cron      LIVE\n  subprocess traceparent continuation    LIVE  (child run joins the same trace)\n  task.execute span (multi-runtime exec) LIVE\n\nScaffold createJobTools(ctx) helpers (called inside YOUR handler):\n\n  log.info / log.warn / log.error        LIVE  (structured logging)\n  progress(pct, message)                 NO-OP STUB in scaffold (fix planned)\n  trace.addEvent / withChildSpan / ...   NO-OP STUB in scaffold (fix planned)\n        -> callback runs; no extra span exported\n\nWorkaround for custom spans today: import from\n@netscript/telemetry/instrumentation directly (see other tab)."
  }
] }) }}

## Where the signal goes: OTLP to the Aspire dashboard

A span or a log is only useful once something collects it. In the default NetScript dev loop
that collector is the Aspire dashboard, and the wire between your process and the dashboard is
**OTLP** (the OpenTelemetry Protocol). The generated Aspire AppHost configures an OTLP endpoint
at `http://localhost:4318` and a dashboard UI at `http://localhost:18888`; resources started
under Aspire are handed the OTLP endpoint through environment variables, so they export their
telemetry to the dashboard without per-service configuration.

This is why [Aspire is step 2](/explanation/aspire/) of the dev flow, not an afterthought:
`cd aspire && aspire run` brings up the dashboard (and the OTLP receiver behind it) — along with
Postgres and Garnet — *before* any `netscript db` command or handler runs, so the very first
request you make has somewhere to land. Without the dashboard running, your handlers still
execute — they simply export into the void.

{{ comp.apiTable({
  caption: "The observability surface — endpoints, ports, and what each one carries",
  rows: [
    { name: "Aspire dashboard", type: "http://localhost:18888", desc: "The viewing surface. Resource graph, per-resource health, console logs, structured logs, and the distributed-trace view. Login token is printed by `aspire run`." },
    { name: "OTLP receiver", type: "http://localhost:4318", desc: "Where processes export OpenTelemetry traces/logs/metrics. Configured by the generated Aspire AppHost and handed to resources via environment variables." },
    { name: "Workers health", type: "GET :8091/health", desc: "Liveness for the workers API. The simplest signal: is this capability up?" },
    { name: "Sagas health", type: "GET :8092/health/live", desc: "Liveness for the sagas API (note the /health/live path on sagas specifically)." },
    { name: "Triggers health", type: "GET :8093/health", desc: "Liveness for the triggers (raw Hono) API." },
    { name: "Auth health", type: "GET :8094/health/live", desc: "Liveness for the auth-api service (also exposes /health/ready)." },
    { name: "Streams service", type: ":4437", desc: "The durable-stream producer runtime, served as an Aspire Deno service and wired into workers/auth/sagas." },
    { name: "Service trace context", type: "traceparent", desc: "Propagated by defineService RPC handling on /api/rpc/* so a downstream call is a child span of its caller, not an orphan." }
  ]
}) }}

## How the pieces correlate (a diagram in prose)

Here is the journey of one signal — say the execution span the dispatcher opens around a job, plus
a custom child span you add inside it — from where it is created to where you read it in the
dashboard:

```text
  framework boundary        instrumentation           OTLP wire              Aspire dashboard
 ────────────────────      ─────────────────        ─────────────         ────────────────────

 dispatcher wraps job  ->  traceJobExecution    ->  export via OTLP   ->  trace view at :18888
   (you write nothing)      (REAL span today)        :4318 endpoint        correlated by trace id
       │                         │                       │                       │
       │  structured logs        │  spans + step/        │  one transport        │  logs + spans +
       │  (LIVE)                 │  progress events      │  for all three        │  health, one place
       │                         │  (LIVE)               │  signal types         │
       │                         │                       │                       │
       │  your handler adds      │  withChildSpan from   │                       │
       │  @netscript/telemetry   │  telemetry -> nests    │                       │
       ▼  child span (LIVE)      ▼  under the job span   ▼  OTel Protocol        ▼  one operation, end to end
   one ctx, one trace id    one causal tree         OTel Protocol          reassembled by trace id
```

Read it left to right. The dispatcher opens a real job span before your handler runs — you write
nothing. Inside the handler, a `withChildSpan` from `@netscript/telemetry` nests under that parent
(whereas the scaffolded `createJobTools` helper would be a no-op). Whatever signal is produced is
exported over OTLP to the dashboard's receiver on `:4318`. The dashboard correlates the spans, the
log lines, and the health state by trace id and shows them as one operation at
[http://localhost:18888](http://localhost:18888). The point of the shared trace context is exactly
this last hop: three streams, reassembled into one story, because they all carried the same id.

{{ comp callout { type: "tip", title: "Health endpoints are observability too" } }}
Don't overlook the cheapest signal. Every capability service ships a health route —
<code>:8091/health</code> (workers), <code>:8092/health/live</code> (sagas),
<code>:8093/health</code> (triggers), <code>:8094/health/live</code> (auth) — and Aspire
surfaces each resource's health on the dashboard's resource graph. Before you reach for
distributed tracing, "is this resource green?" answers most production questions, and it is wired
with zero handler code.
{{ /comp }}

## A note on auth diagnostics (not an audit trail)

The [auth plugin](/capabilities/auth/) emits five durable `auth.*` events —
`auth.signin.started`, `auth.signin.failed`, `auth.token.refreshed`, `auth.session.revoked`, and
`auth.oidc.completed` — onto a durable stream (`/auth/sessions`, producer `auth-service`). These
are useful diagnostics: they let you observe sign-in lifecycle and session revocation as they
happen.

Read their guarantees honestly. Emission is **best-effort and gated** — it is a no-op unless a
durable streams URL is configured (`DURABLE_STREAMS_URL` / the Aspire `services__streams__http__0`
binding). Only `auth.oidc.completed`, `auth.token.refreshed`, and `auth.session.revoked` write the
durable session projection; `auth.signin.started` / `auth.signin.failed` are diagnostic-only. There
is **no dedicated auth audit or telemetry surface** in the framework today — do not treat these
events as a guaranteed, tamper-evident audit log. They are an observability convenience layered on
the streams runtime, nothing more.

## Why this design, and what it costs

The honest trade-offs, because instrumentation-at-the-boundary is an opinion:

- **Telemetry follows the framework, not a side library.** Because the trace context rides the
  service boundary and the dispatcher opens the job span, you cannot accidentally instrument
  half your code — the lifecycle signal is free. The cost is that you instrument NetScript's
  *way* — you reach for `@netscript/telemetry` and the catalog-pinned `@opentelemetry/api`
  (`^1.9`), not whatever tracer you used last job.
- **One viewing surface in dev, your choice in prod.** The dashboard at `:18888` is a developer
  convenience wired by Aspire. It is an OTLP receiver like any other; in production you point the
  same OTLP export at your own collector. The model does not lock you to Aspire — it locks you to
  the protocol.
- **The scaffold helpers are a known, bounded gap.** The job lifecycle, scheduler, subprocess, and
  `task.execute` spans are real — but the scaffolded `createJobTools(ctx)` `trace`/`progress`
  helpers are no-op stubs (fix planned). Their shapes are stable, so code you write against them
  keeps working when the runtime fills them in. Until then, use `@netscript/telemetry` directly for
  custom handler spans, and do not promise dashboards that depend on those helper calls.
- **Correlation depends on context propagation working end to end.** A dropped `traceparent` (a
  call that doesn't carry it forward) turns a child span into an orphan and breaks the single-story
  view. The framework propagates it across the service boundary and into worker subprocesses so you
  don't have to — but custom fan-out (spawning your own fetches) is where you reintroduce the
  responsibility.

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
  span (`withChildSpan`) nests under its parent to form the causal tree.
- **traceparent** — the W3C trace-context header that carries the trace id across a boundary so
  separate spans stitch into one trace; the framework even injects it into worker subprocesses.

## Where to go next

- **Do it:** the [how-to: add OpenTelemetry](/how-to/add-opentelemetry/) walks adding a custom
  span, structured logs, and `traceparent` propagation against a running service.
- **Hub:** the [telemetry capability](/capabilities/telemetry/) covers the headline API and the
  OTel-wired-into-boundaries model with the real endpoints.
- **Surface:** [Orchestration with Aspire](/explanation/aspire/) explains the dashboard and OTLP
  receiver that consume these signals.
- **Reference:** the exact exported symbols live in [`reference/telemetry/`](/reference/telemetry/)
  and the logging surface in [`reference/logger/`](/reference/logger/).

{{ comp.nextPrev({ prev: { label: "Durable workflows", href: "/explanation/durable-workflows/" }, next: { label: "Orchestration with Aspire", href: "/explanation/aspire/" } }) }}
