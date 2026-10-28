---
layout: layouts/base.vto
title: Observability model
templateEngine: [vento, md]
order: 6
---

# Observability model

This page explains how NetScript keeps one logical operation readable as one trace when it crosses
HTTP, a queue, a saga, and a worker subprocess: the trace context travels with the work, and the
framework carries it across every boundary it owns. For the headline API, see the
{{ comp.xref({ key: "cap:telemetry" }) }} hub; for the exported symbols, see
{{ comp.xref({ key: "ref:telemetry" }) }}.

{{ comp.diagram({
  src: "/assets/diagrams/otel-traceparent.svg",
  alt: "A traceparent header entering at an HTTP request, propagating through the service RPC boundary, into a job dispatched onto the queue, and injected into a worker subprocess — every span nesting under one trace id.",
  caption: "One traceparent, four processes, one trace. The framework carries the W3C trace context across each boundary so spans born in separate processes still nest under the same root."
}) }}

## Observability at the boundary

In most backends, observability is added after the fact: you ship a handler, watch it misbehave,
then thread a logger, a metrics client, and a tracer through every call site. The instrumentation
drifts from the code because it was never part of the code's shape.

NetScript treats observability the way it treats
{{ comp.xref({ key: "explain:contracts", text: "contracts" }) }}: a cross-cutting concern belongs to
the boundary, so the framework owns it and gives you a typed seam. A service built with
[`defineService(...)`](/capabilities/services/) wires request logging, health endpoints, and
OpenTelemetry context propagation in one call. A worker job runs *inside a span* the framework
opens. The common signal (this operation happened, here is its trace id, here is whether it was
healthy) comes with no code; a custom child span around an expensive step is one typed call.

{{ comp callout { type: "note", title: "Three signals, one context" } }}
OpenTelemetry has three correlated signal types: <strong>traces</strong> (the causal tree of spans
for one logical operation), <strong>logs</strong> (timestamped structured records), and
<strong>metrics</strong> (aggregated counters and gauges). NetScript's design goal is that all
three share one <em>trace context</em>, the <code>traceparent</code> that travels with a request, so
the dashboard can tie a log line, a span, and a counter back to the same operation.
{{ /comp }}

## Trace propagation

A single user action, such as placing an order, does not run in one process. An HTTP request hits a
service; the service dispatches a job onto a queue; a worker picks the job up, often in a separate
subprocess; the worker may emit a saga step that fans out further. If each process started its own
trace, the dashboard would show four disconnected fragments that you correlate by timestamp.

The **W3C trace context** prevents that: a `traceparent` header, and an optional `tracestate`,
carries a trace id and the current span id. Whoever does the work carries the context forward and
opens its span as a child of the id it received. When every hop follows that rule, the spans nest
into one tree even though no two of them share a process.

NetScript applies the rule at each boundary it owns:

| Boundary | What the framework does |
| --- | --- |
| Service RPC | With `defineService(...).withRPC({ traceContext: true })`, RPC handling on `/api/rpc/*` reads the incoming `traceparent` and continues it, so a downstream call is a child of the caller's span. |
| Job dispatch | Before your handler runs, the dispatcher opens a `traceJobExecution` span carrying job attributes, duration, and status. |
| Worker subprocess | For an out-of-process job, `createJobSubprocessEnv` injects the `traceparent`, `tracestate`, and the parent's `OTEL_*` configuration into the subprocess environment. The child Deno process reads them on startup and continues the same trace. |
| Scheduler | Cron runs emit their own spans, rooted at the scheduler tick. |
| SSE | `extractTraceContextFromRecord` links an SSE event back to the job execution that produced it, so a streamed progress event points at its originating trace. |

{{ comp callout { type: "important", title: "Boundaries you open yourself" } }}
A trace is one operation only because <strong>every process that touches the work carries the same
<code>traceparent</code></strong>. NetScript does this automatically at the boundaries it owns. When
<em>you</em> open a new boundary, such as a raw <code>fetch</code> to a third party or a process you
spawn yourself, forward the header; otherwise the child span becomes an orphan and the operation
splits into separate traces.
{{ /comp }}

## Structured logs

Logs in NetScript are structured records, not free-text `console.log` output. A handler's
`ctx.logger` emits JSON with a level, a message, and an attribute bag, and the logging middleware
adds request metadata to each record. Because logging runs inside the same active span as the work,
a log line emitted during a job carries, or can be joined to, the operation's trace id. In the
dashboard, you select a slow trace and see the log lines emitted within its spans beside it. The
logging surface is in {{ comp.xref({ key: "ref:logger" }) }}.

## OTLP and the Aspire dashboard

In the default development loop, the Aspire dashboard collects the telemetry, and processes send it
over **OTLP** (the OpenTelemetry Protocol). The generated Aspire AppHost configures an OTLP receiver
at `http://localhost:4318` and a dashboard UI at `https://localhost:18888`. Resources started under
Aspire receive the OTLP endpoint through environment variables, so they export telemetry without
per-service configuration.

That is why {{ comp.xref({ key: "explain:aspire", text: "Aspire is step two" }) }} of the
development flow: `cd aspire && aspire start` brings the receiver up, with Postgres and Redis,
before the first handler runs. Without it, handlers still run, but their telemetry has no receiver.

{{ comp.apiTable({
  caption: "Where telemetry is viewed and received",
  rows: [
    { name: "Aspire dashboard", type: "https://localhost:18888", desc: "The viewing surface: resource graph, per-resource health, structured logs, and the distributed-trace view. `aspire start` prints the login token." },
    { name: "OTLP receiver", type: "http://localhost:4318", desc: "Where processes export OpenTelemetry traces, logs, and metrics. Configured by the generated Aspire AppHost and handed to resources through environment variables." },
    { name: "Workers health", type: "GET /health (on assigned port)", desc: "Liveness for the workers API: the cheapest signal that the capability is up." },
    { name: "Auth health", type: "GET :8094/health/live", desc: "Liveness for the auth-api service, which also exposes /health/ready." }
  ]
}) }}

## Framework and handler telemetry

Job telemetry comes from two layers:

| Layer | What it records |
| --- | --- |
| Framework and dispatcher | `traceJobExecution`, scheduler spans, subprocess `traceparent` propagation, and `task.execute` spans. Job traces appear in Aspire with no handler code. |
| Scaffold `createJobTools(ctx)` helpers | `trace.addEvent` records on the active job span, `trace.withChildSpan` exports a child span, and `progress` records `job.progress` events while forwarding updates to the workers runtime channel. |

For a custom span outside those helpers, import `withChildSpan` from
`@netscript/telemetry/instrumentation`. The dispatcher has already opened the job span, so the
child nests under it:

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

## Auth audit trail

Sign-in events carry subjects, tokens, and claims that must not be stored in the clear, so logging
everything is unsafe for authentication. `@netscript/plugin-auth-core/telemetry` is an audit-safe
instrumentation facade that the auth service composition root wires in with
`createAuthTelemetry`.

**It traces auth operations as spans.** `traceOperation` wraps each auth operation (`auth.signin`,
`auth.callback`, `auth.signout`, `auth.session.revoke`, `auth.session`, `auth.me`) in a child span
that joins the incoming request trace, so a failed sign-in is a node in the same trace as the
request that triggered it.

**It emits standardized audit events.** Each operation records an `auth.audit.log` span event and
breadcrumbs (`auth.principal.resolved`, `auth.session.issued`, `auth.session.revoked`) with a finite
outcome vocabulary (`success`, `unauthenticated`, `failed_bad_credentials`,
`failed_session_expired`, `failed_provider_error`, `failed_callback_invalid`) and a machine-readable
error code (`AUTH_INVALID_CREDENTIALS`, `AUTH_SESSION_EXPIRED`, …). Outcomes are an enum, not prose,
so the audit trail is queryable.

**It redacts by construction.** A raw subject never reaches the trace. `hashSubject` runs the
subject through HMAC-SHA-256 with a *deployment-owned salt* (never derived from the subject), so the
recorded `auth.subject_hash` is stable for correlation but not reversible. `redactAuthPrincipal`
reduces a principal to its hash, scheme, scope and role *counts*, and claims with every
token-bearing key removed (any key matching `token`, `secret`, `credential`, `password`, `apikey`,
`authorization`, `sessionid`, …). What reaches the dashboard is safe by design, not by a later
scrubbing pass.

{{ comp callout { type: "warning", title: "Auth audit needs a salt" } }}
The redaction is only as strong as its salt, so auth telemetry is <strong>opt-in by
configuration</strong>: <code>createAuthTelemetry</code> is enabled only when a
<code>subjectHashSalt</code> is supplied (the auth service reads it from
<code>NETSCRIPT_AUTH_AUDIT_SALT</code>). With no salt, <code>traceOperation</code> runs your callback
through a <em>no-op recorder</em>: auth still works, but no subject is hashed and no audit span is
emitted, because an unsalted hash would be worse than nothing. Observability never changes auth
behavior: every recorder method swallows its own errors, so a telemetry failure cannot break a
login.
{{ /comp }}

The audit trail is not a tamper-evident, immutable ledger: the events ride the standard OTel and
streams transport. Use it as a queryable audit trail for operational and security review, not as a
compliance-grade write-once log. For how auth itself is shaped, see
{{ comp.xref({ key: "explain:auth-model" }) }} and the {{ comp.xref({ key: "cap:auth" }) }} hub.

## Trade-offs

- **Telemetry follows the framework, not a side library.** The trace context rides the service
  boundary and the dispatcher opens the job span, so the lifecycle signal needs no code and you
  cannot instrument half your code by accident. The cost is that you instrument the NetScript way:
  you use `@netscript/telemetry` and the catalog-pinned `@opentelemetry/api` (`^1.9`), not the tracer
  you used on your last project.
- **One viewing surface in development, your choice in production.** The dashboard at `:18888` is a
  development convenience wired by Aspire, and it is an OTLP receiver like any other. In production
  you point the same OTLP export at your own collector. The model ties you to the protocol, not to
  Aspire.

Next: add a custom span and structured logs with [Add OpenTelemetry](/observability/how-to/add-opentelemetry/).
