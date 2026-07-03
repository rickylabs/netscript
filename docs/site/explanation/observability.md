---
layout: layouts/base.vto
title: Observability
templateEngine: [vento, md]
prev: { label: "Durability model", href: "/explanation/durability-model/" }
next: { label: "Orchestration with Aspire", href: "/explanation/aspire/" }
---

# Observability

This essay answers one question: how does NetScript make a *distributed, multi-process*
application observable, so that one logical operation reads as one story even though it crosses
HTTP, a queue, a saga, and a worker subprocess? The answer is a single idea applied everywhere —
**the trace context travels with the work** — wired into the framework boundaries so you inherit
it for free. Read this to build the mental model; to wire spans yourself, follow the
[how-to: add OpenTelemetry](/how-to/add-opentelemetry/); for the headline API and ports, see the
{{ comp.xref({ key: "cap:telemetry" }) }} hub; for exact exported symbols, see
{{ comp.xref({ key: "ref:telemetry" }) }}.

{{ comp.diagram({
  src: "/assets/diagrams/otel-traceparent.svg",
  alt: "A traceparent header entering at an HTTP request, propagating through the service RPC boundary, into a job dispatched onto the queue, and injected into a worker subprocess — every span nesting under one trace id.",
  caption: "One traceparent, four processes, one trace. The framework carries the W3C trace context across each boundary so spans born in separate processes still nest under the same root."
}) }}

## The thesis: observability is a property of the boundary

Most backends bolt observability on after the fact. You write a handler, ship it, watch it
misbehave, and *then* thread a logger, a metrics client, and a tracer through every call site —
three libraries, three configuration surfaces, three ways to forget a field. The instrumentation
drifts from the code because it was never part of the code's shape.

NetScript takes the same stance on observability that it takes on
{{ comp.xref({ key: "explain:contracts", text: "contracts" }) }}: a cross-cutting concern belongs
to the boundary, so the framework owns it and hands you a typed seam. A service built with
[`defineService(...)`](/capabilities/services/) wires request logging, health endpoints, and
OpenTelemetry context propagation in one call. A worker job is dispatched *inside a span* the
framework opens for you. The intent is that the *common* signal — "this operation happened, here is
its trace id, here is whether it was healthy" — is free and uniform, and the *specific* signal — a
custom child span around an expensive step — is one typed call away.

{{ comp callout { type: "note", title: "Three signals, one context" } }}
OpenTelemetry models telemetry as three correlated signal types: <strong>traces</strong> (the
causal tree of spans for one logical operation), <strong>logs</strong> (timestamped structured
records), and <strong>metrics</strong> (aggregated counters and gauges). NetScript's design goal is
that all three share one <em>trace context</em> — the <code>traceparent</code> that travels with a
request — so a log line, a span, and a counter can be stitched back to the same operation in the
dashboard. The shared context is what turns three separate streams into one story.
{{ /comp }}

## The core insight: distributed trace propagation

This is the part worth understanding well, because it is where most home-grown observability
breaks. In a NetScript app, a single user action — "place an order" — does not run in one process.
An HTTP request hits a service; the service dispatches a job onto a queue; a worker picks the job
up, often in a *separate subprocess*; that worker may emit a saga step that fans out further. Four
processes, one intent. If each process started its own trace, your dashboard would show four
disconnected fragments and you would correlate them by hand, by timestamp, badly.

The fix is the **W3C trace context**: a `traceparent` header (and an optional `tracestate`) that
carries a trace id and the current span id. The rule is simple — *whoever does the work carries the
context forward, and opens their span as a child of the id they received.* When every hop obeys
that rule, the spans nest into one tree even though no two of them share a process.

NetScript enforces the rule at each boundary it owns:

**The service boundary.** When you serve a router with `defineService(...).withRPC({ traceContext:
true })`, RPC handling on `/api/rpc/*` reads the incoming `traceparent` and continues it, so a
downstream call is a child of the caller's span rather than an orphan. You write the business logic;
the framework keeps the causal chain intact across the wire.

**The queue / worker boundary.** Before your handler runs, the dispatcher opens a real
`traceJobExecution` span carrying job attributes, duration, and status. When that job runs
*out-of-process*, the dispatcher serializes the active context and injects the `traceparent` /
`tracestate` (and the parent's `OTEL_*` config) into the subprocess environment via
`createJobSubprocessEnv`. The child Deno process reads them back on startup and continues the *same*
trace — so a span born in a forked subprocess still nests under the HTTP request that triggered it.

**The scheduler and SSE boundaries.** Cron runs emit their own spans rooted at the scheduler tick,
and SSE events can be linked back to the job execution that produced them via
`extractTraceContextFromRecord` — so a streamed progress event points at its originating trace.

{{ comp callout { type: "important", title: "The key insight, in one line" } }}
A trace is one operation only because <strong>every process that touches the work agreed to carry
the same <code>traceparent</code></strong>. NetScript makes that agreement automatic at the
boundaries it owns (service RPC, job dispatch, subprocess spawn, scheduler). Where <em>you</em> open
a new boundary — a raw <code>fetch</code> to a third party, a process you spawn yourself — the
agreement is yours to honor: forward the header, or the child span becomes an orphan and the
single-story view breaks.
{{ /comp }}

```text
  HTTP request          service (RPC)          queue / dispatcher         worker subprocess
 ──────────────       ─────────────────       ────────────────────      ──────────────────
 traceparent     ->   continue context   ->   traceJobExecution    ->   createJobSubprocessEnv
 arrives at edge      open child span         opens job span            injects traceparent into
                      (withRPC traceContext)   (REAL OTel today)         env; child joins SAME trace
        │                    │                        │                         │
        └──────────── one trace id, carried forward at every hop ───────────────┘
```

## Structured logging, correlated by trace

Logs in NetScript are structured records, not free-text `console.log`. A handler's `ctx.logger`
emits JSON with a level, a message, and an attribute bag, and the logging middleware enriches each
record with request metadata. Because logging runs inside the same active span as the work, a log
line emitted during a job carries — or can be joined to — the operation's trace id. That correlation
is the whole point: in the dashboard you select a slow trace, and the log lines emitted *within* its
spans are right there beside it, not in a separate searchable haystack you cross-reference by
timestamp.

This is also why the scaffold's `progress(...)` helper is limited: it logs via the worker
pool and delegates to `ctx.reportProgress`, but it does *not* by itself emit a `job.progress`
OpenTelemetry span event. For an OTel-visible progress event, call `recordJobProgress` from
`@netscript/telemetry/instrumentation` directly. The exact logging surface lives in
{{ comp.xref({ key: "ref:logger" }) }}.

## Where the signal goes: OTLP to the Aspire dashboard

A span or a log is only useful once something collects it. In the default dev loop that collector is
the Aspire dashboard, and the wire between your process and the dashboard is **OTLP** (the
OpenTelemetry Protocol). The generated Aspire AppHost configures an OTLP receiver at
`http://localhost:4318` and a dashboard UI at `https://localhost:18888`; resources started under
Aspire are handed the OTLP endpoint through environment variables, so they export telemetry without
per-service configuration. This is why {{ comp.xref({ key: "explain:aspire", text: "Aspire is step two" }) }} of the dev flow, not an afterthought: `cd aspire && aspire start` brings the receiver up —
along with Postgres and Redis — *before* the first handler runs, so the very first request has
somewhere to land. Without it, handlers still execute; they simply export into the void.

{{ comp.apiTable({
  caption: "The observability surface — endpoints, ports, and what each one carries",
  rows: [
    { name: "Aspire dashboard", type: "https://localhost:18888", desc: "The viewing surface. Resource graph, per-resource health, structured logs, and the distributed-trace view. Login token is printed by `aspire start`." },
    { name: "OTLP receiver", type: "http://localhost:4318", desc: "Where processes export OpenTelemetry traces, logs, and metrics. Configured by the generated Aspire AppHost and handed to resources via env vars." },
    { name: "Service trace context", type: "traceparent", desc: "Continued by defineService RPC handling on /api/rpc/* (withRPC traceContext) so a downstream call is a child span of its caller, not an orphan." },
    { name: "Subprocess env", type: "OTEL_* + traceparent", desc: "Injected into a worker subprocess by createJobSubprocessEnv so an out-of-process job continues the SAME trace as the request that dispatched it." },
    { name: "Workers health", type: "GET :8091/health", desc: "Liveness for the workers API. The cheapest signal: is this capability up?" },
    { name: "Auth health", type: "GET :8094/health/live", desc: "Liveness for the auth-api service (also exposes /health/ready)." }
  ]
}) }}

## Known gap: scaffold job-tools helpers

Two layers, stated precisely so you never over- or under-claim.

{{ comp callout { type: "important", title: "Real OTel vs. scaffold stubs" } }}
<strong>Framework / dispatcher layer = real OTel.</strong> <code>traceJobExecution</code>, scheduler
spans, subprocess <code>traceparent</code> propagation, and <code>task.execute</code> spans are
live. A user gets job traces in Aspire <em>automatically</em>, with zero handler code.
<br><br>
<strong>Scaffold <code>createJobTools(ctx)</code> tracing helpers = still no-op stubs.</strong> The
<code>trace.addEvent</code> and <code>trace.withChildSpan</code> helpers the generated sample hands
<em>into your handler</em> are placeholders — your callback runs and returns normally, but no extra
span is exported. This is a <strong>known, tracked limitation with a fix planned</strong> (debt
<code>workers-scaffold-job-tools-noop</code>), not a permanent design choice. The workaround
today: call <code>@netscript/telemetry/instrumentation</code> helpers directly from your handler for
custom spans — because the dispatcher already opened the parent job span, your child span nests
under it automatically.
<!-- caveat: arch-debt:workers-scaffold-job-tools-noop -->
{{ /comp }}

```ts
// services/orders/handlers/process-order.ts
import {
  defineJobHandler,
  createSuccessResult,
} from '@netscript/plugin-workers-core';
// For CUSTOM spans inside a handler, import the telemetry helpers directly.
// The dispatcher already opened the parent job span around this handler,
// so this child span nests under it automatically.
import { withChildSpan } from '@netscript/telemetry/instrumentation';

const handler = defineJobHandler(async (ctx) => {
  ctx.logger.info('processing order'); // structured log, joined to the trace

  // Bracket an expensive step in a REAL child span.
  const result = await withChildSpan('order.charge', async (span) => {
    span.setAttribute('order.amount', ctx.payload.amount);
    return { charged: true };
  });

  return createSuccessResult({ charged: result.charged });
});

export default Object.assign(handler, { id: 'process-order' as const });
```

## The auth audit trail: structured, redacted, traced

Authentication is the one place where "just log everything" is actively dangerous — sign-in events
carry subjects, tokens, and claims you must *not* persist in the clear. The auth audit surface
shipped to solve exactly this: `@netscript/plugin-auth-core/telemetry` is a small, audit-safe
instrumentation facade that the auth service composition root wires in with `createAuthTelemetry`.
It does three things, all of them on purpose.

**It traces auth operations as first-class spans.** `traceOperation` brackets each auth operation —
`auth.signin`, `auth.callback`, `auth.signout`, `auth.session`, `auth.me` — in a child span that
joins the incoming request trace, so a failed sign-in is a node in the same trace as the request
that triggered it, not a disconnected log line.

**It emits standardized audit events.** Each operation records an `auth.audit.log` span event plus
breadcrumbs (`auth.principal.resolved`, `auth.session.issued`, `auth.session.revoked`) with a finite
outcome vocabulary — `success`, `unauthenticated`, `failed_bad_credentials`,
`failed_session_expired`, `failed_provider_error`, `failed_callback_invalid` — and a machine-readable
error code (`AUTH_INVALID_CREDENTIALS`, `AUTH_SESSION_EXPIRED`, …). Outcomes are an enum, not prose,
so the audit trail is queryable.

**It redacts by construction.** A raw subject never lands in the trace. `hashSubject` runs the
subject through HMAC-SHA-256 with a *deployment-owned salt* (never derived from the subject), so the
recorded `auth.subject_hash` is stable for correlation but not reversible. `redactAuthPrincipal`
projects a principal down to its hash, scheme, scope/role *counts*, and claims with any
token-bearing key (anything matching `token`, `secret`, `credential`, `password`, `apikey`,
`authorization`, `sessionid`, …) stripped out entirely. The shape that reaches the dashboard is
audit-safe by design, not by a downstream scrubbing pass you might forget.

{{ comp callout { type: "warning", title: "Auth audit is gated — and that is deliberate" } }}
The redaction is only as strong as its salt, so auth telemetry is <strong>opt-in by
configuration</strong>: <code>createAuthTelemetry</code> is enabled only when a
<code>subjectHashSalt</code> is supplied (the auth service resolves it from
<code>NETSCRIPT_AUTH_AUDIT_SALT</code>). With no salt configured, <code>traceOperation</code> runs
your callback through a <em>no-op recorder</em> — auth still works, but no subject is hashed and no
audit span is emitted, because emitting an un-salted hash would be worse than emitting nothing. A
guiding rule runs through the code: <em>observability must never change auth behavior</em> — every
recorder method swallows its own errors so a telemetry failure can never break a login.
{{ /comp }}

This supersedes the older "auth diagnostics, not an audit trail" caveat: there is now a real,
structured, redacted auth audit surface. What it is *not* is a tamper-evident, immutable ledger —
the events ride the standard OTel/streams transport. Treat it as a strong, queryable audit trail for
operational and security review, not as a compliance-grade write-once log. For how auth itself is
shaped, see {{ comp.xref({ key: "explain:auth-model" }) }} and the
{{ comp.xref({ key: "cap:auth" }) }} hub.

## Why this design, and what it costs

The trade-offs, because instrumentation-at-the-boundary is an opinion.

- **Telemetry follows the framework, not a side library.** Because the trace context rides the
  service boundary and the dispatcher opens the job span, you cannot accidentally instrument half
  your code — the lifecycle signal is free. The cost is that you instrument NetScript's *way*: you
  reach for `@netscript/telemetry` and the catalog-pinned `@opentelemetry/api` (`^1.9`), not whatever
  tracer you used last job.
- **One viewing surface in dev, your choice in prod.** The dashboard at `:18888` is a developer
  convenience wired by Aspire. It is an OTLP receiver like any other; in production you point the same
  OTLP export at your own collector. The model does not lock you to Aspire — it locks you to the
  protocol.
- **Correlation depends on propagation working end to end.** A dropped `traceparent` — a call that
  doesn't carry it forward — turns a child span into an orphan and breaks the single-story view. The
  framework propagates it across the service boundary and into worker subprocesses so you don't have
  to; custom fan-out (your own `fetch`, your own spawned process) is where you reintroduce the
  responsibility.
- **The scaffold helpers are a known, bounded gap.** The job lifecycle, scheduler, subprocess, and
  `task.execute` spans are real — but the scaffolded `createJobTools(ctx)` `trace` helpers are no-op
  stubs (fix planned). Their shapes are stable, so code you write against them keeps working when the
  runtime fills them in. Until then, use `@netscript/telemetry/instrumentation` directly.

The OpenTelemetry dependency is pinned in the workspace catalog (`@opentelemetry/api` at `^1.9`) and
imported through the catalog, never de-catalogued, so every workspace member shares one telemetry API
surface — which is itself why a `traceparent` minted in the service and read in a worker refers to
the same span model.

## Glossary

- **OpenTelemetry (OTel)** — the vendor-neutral standard for traces, logs, and metrics that NetScript
  instruments against (`@opentelemetry/api`). See the [glossary](/glossary/) and the
  {{ comp.xref({ key: "cap:telemetry" }) }} hub.
- **OTLP** — the OpenTelemetry Protocol; the wire your process uses to export telemetry. In dev, the
  Aspire AppHost receives it at `http://localhost:4318`.
- **Span** — one node in a trace: a named, timed operation with attributes and events. A child span
  (`withChildSpan`) nests under its parent to form the causal tree.
- **traceparent** — the W3C trace-context header that carries the trace id across a boundary so
  separate spans stitch into one trace; the framework injects it even into worker subprocesses.

## Where to go next

- **Do it:** the [how-to: add OpenTelemetry](/how-to/add-opentelemetry/) walks adding a custom span,
  structured logs, and `traceparent` propagation against a running service.
- **Hub:** the {{ comp.xref({ key: "cap:telemetry" }) }} hub covers the headline API and the
  OTel-wired-into-boundaries model with the real endpoints; {{ comp.xref({ key: "cap:auth" }) }}
  covers the auth surface whose audit trail is described above.
- **Related:** {{ comp.xref({ key: "cap:services" }) }} (the boundary that propagates trace context),
  {{ comp.xref({ key: "cap:durable-sagas" }) }} (the multi-step operations a single trace spans), and
  {{ comp.xref({ key: "explain:aspire" }) }} (the dashboard and OTLP receiver that consume these
  signals).
- **Reference:** exact exported symbols live in {{ comp.xref({ key: "ref:telemetry" }) }}, and the
  logging surface in {{ comp.xref({ key: "ref:logger" }) }}.

{{ comp.nextPrev({ prev: { label: "Durability model", href: "/explanation/durability-model/" }, next: { label: "Orchestration with Aspire", href: "/explanation/aspire/" } }) }}
