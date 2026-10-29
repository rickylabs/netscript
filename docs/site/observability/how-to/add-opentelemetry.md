---
layout: layouts/base.vto
title: Add OpenTelemetry
description: Emit custom spans and structured logs, propagate traceparent, and read the traces in the Aspire dashboard.
templateEngine: [vento, md]
order: 101
oldUrl: /how-to/add-opentelemetry/
---

# Add OpenTelemetry

This recipe turns on, extends and reads distributed traces in an existing NetScript workspace. You
trigger traces from the instrumentation that already ships, add your own spans in a job handler,
propagate `traceparent` across services and job subprocesses, and read the result in the Aspire
dashboard.

`@netscript/telemetry` wraps `@opentelemetry/api` and is already wired into the services, the worker
dispatcher, the scheduler and the subprocess task runtime the scaffold generates, and Aspire stands up
the OTLP collector and the trace UI. For the mental model, read
[Observability](/explanation/observability/); for the API, see
[Telemetry & logging](/observability/telemetry/) and the [`telemetry`](/reference/telemetry/) and
[`logger`](/reference/logger/) references.

## Prerequisites

{{ comp.apiTable({ caption: "What this recipe assumes", rows: [
  { name: "netscript workspace", type: "netscript init", desc: "An existing workspace. If you have none, scaffold one first — see the tutorials." },
  { name: "Start Aspire", type: "cd aspire && aspire start", desc: "The AppHost provisions Postgres, Redis, the OTLP collector, and the dashboard. Start it BEFORE you expect traces. Dashboard at the URL Aspire prints." },
  { name: "@netscript/telemetry", type: "OTel facade", desc: "Wraps @opentelemetry/api and ships the worker/scheduler/queue/SSE instrumentation. Already wired into the generated handlers — no install step." },
  { name: "A service or plugin to trace", type: "services/users or plugins/workers", desc: "The users service (on its assigned port) and the workers/sagas/triggers/auth plugins all emit health + trace data once running." }
] }) }}

> [!IMPORTANT]
> The OTLP endpoint and the trace UI are **Aspire resources**. Start orchestration with
> `cd aspire && aspire start` before you run a service, trigger a job or open the dashboard; without
> it, spans have nowhere to go and there is nothing to view.

## How the telemetry is already wired

Three layers ship instrumented, plus the export path. The table shows where you get spans for free
and where you add your own.

{{ comp.apiTable({ caption: "Where instrumentation lives", rows: [
  { name: "Service layer (real spans)", type: "@netscript/service", desc: "RPC trace context (header extraction into ctx.traceHeaders) is ON by default — traceContext defaults to true when withRPC() is called without arguments. The OTel TracingPlugin that creates real spans is also always active; it is independent of the traceContext option." },
  { name: "Worker runtime (real spans)", type: "job dispatcher + scheduler", desc: "Job dispatch and execution, scheduler runs, and the task subprocess emit real OTel spans automatically via @netscript/telemetry — traceJobExecution, scheduler spans, task.execute. Traces show up in Aspire with no handler code." },
  { name: "Scaffold job tools", type: "createJobTools(ctx)", desc: "log / progress / trace handed to defineJobHandler bodies. trace.addEvent records on the active job span, withChildSpan exports child work, and progress emits telemetry while forwarding to the runtime channel. log.* remains console-backed." },
  { name: "OTLP export + UI", type: "the OTLP URL Aspire prints → the URL Aspire prints", desc: "The Aspire profile points OTLP at the OTLP URL Aspire prints; the dashboard renders the collected traces and correlated structured logs at the URL Aspire prints." }
] }) }}

The dispatcher layer emits lifecycle spans automatically, including `task.execute` spans. Inside a
handler, the scaffold-facing `createJobTools(ctx)` records events, progress and child spans beneath
the active job span; its `log.*` helpers stay console-backed. Import the telemetry helpers directly
only when you need the lower-level API.

## Step 1 — Bring up Aspire and confirm the collector

From the workspace root, start orchestration. The AppHost registers the OTLP collector and the
dashboard, then boots Postgres, Redis and every service and plugin resource.

```bash
cd aspire
aspire start
# dashboard: the URL Aspire prints  (anonymous local access in the generated profile)
```

Open the dashboard at the URL Aspire prints; the generated local profile allows anonymous access
and select the **Traces** tab. It stays empty until you exercise something, and it updates live.

The resource graph lists `postgres`, `redis`, `workers-api`, `workers`, `sagas-api`, `sagas`,
`triggers-api`, `triggers`, `auth-api` and the durable-streams service, each API on its assigned
port. Every resource exports telemetry to the OTLP endpoint at the OTLP URL Aspire prints, and the
dashboard reads from there.

## Step 2 — Generate a trace without writing any code

Service-layer and worker-runtime tracing need no code from you: exercise a running surface and a
trace appears. The first tab uses `ns-workers`, a name you give the workers plugin's CLI; the scaffold
doesn't create it. Install it once, globally:

```bash
deno install -gArf -n ns-workers jsr:@netscript/plugin-workers{{ releaseSpecifier }}/cli
```

To skip the install, run each `ns-workers <verb …>` as
`deno x -A jsr:@netscript/plugin-workers{{ releaseSpecifier }}/cli <verb …>` instead.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Trigger a worker job",
    lang: "bash",
    code: "# Workers API — enqueue the sample health-check job by id (on its assigned port).\n# Dispatch + execution + scheduler spans are emitted automatically.\nns-workers trigger workers-plugin-health-check\n\n# then list recent executions\nns-workers executions --limit=10 --json"
  },
  {
    label: "Call the users service",
    lang: "ts",
    code: "import { createServiceClient } from '@netscript/sdk/client';\nimport { UsersContractV1 } from '@my-app/contracts';\n\n// In an Aspire-launched caller, discovery and trace context propagate through the SDK.\nconst users = createServiceClient({ contract: UsersContractV1, serviceName: 'users' });\nawait users.list({ page: 1, limit: 10, sortOrder: 'asc' });"
  },
  {
    label: "POST an inbound webhook",
    lang: "bash",
    code: "# Triggers API at the URL Aspire prints (raw webhook ingress plus oRPC management) — resolves the inbound\n# trigger, whose enqueueJob action enqueues the workers health-check job,\n# producing a connected dispatch + execution trace.\ncurl -s -X POST \"$TRIGGERS_URL/api/v1/webhooks/inbound/generic\" \\\n  -H 'content-type: application/json' \\\n  -d '{}'"
  }
] }) }}

Refresh the **Traces** tab. Each request has a trace with the service or worker resource as the root
span; expand it for the span tree, attributes and the structured logs correlated to that trace. A
webhook that enqueues a job shows the inbound request span and the resulting job-dispatch and
job-execution spans in one trace, because the dispatcher propagates `traceparent` into the worker
subprocess.

### Query or export a detached AppHost

Generated workspaces include tasks that query traces and logs, so you don't have to find the dashboard
URL:

```bash
# Query traces or logs for a specific resource
deno task aspire:otel -- traces <resource>
deno task aspire:otel -- logs <resource>

# Query with timestamp search filter (ISO format or date)
deno task aspire:otel -- traces <resource> --search "timestamp:>=2026-08-30"

# Export collected telemetry to a structured zip archive
deno task aspire:export -- -o telemetry.zip
```

The task wrappers forward your arguments and try Aspire's automatic discovery first. On failure they
query `aspire ps --format Json` for the matching AppHost path and retry with its active
`dashboardUrl`. Bare `aspire otel` exits with code `12` when no dashboard is reachable; the wrappers
catch that exit and resolve the running instance.

AI agents and external tools that connect through the NetScript MCP telemetry server
(`@netscript/mcp`) resolve the endpoint in this order:

1. The explicit `--endpoint` option.
2. The `NETSCRIPT_TELEMETRY_ENDPOINT` environment variable.
3. The `ASPIRE_DASHBOARD_PORT` environment variable.
4. A built-in fallback endpoint, which may not match the current run. Set the explicit endpoint to the URL Aspire prints.

## Step 3 — Add your own spans in a job handler

The scaffold hands you `createJobTools(ctx)` with `log`, `progress` and `trace`. The trace and progress
helpers emit through the active job telemetry context; the `@netscript/telemetry/instrumentation`
helpers stay available for lower-level composition.

{{ comp.tabbedCode({ tabs: [
  {
    label: "withChildSpan directly",
    lang: "ts",
    code: "import {\n  createFailureResult,\n  createSuccessResult,\n  defineJobHandler,\n} from '@netscript/plugin-workers-core';\n// Call the instrumentation helpers directly for a REAL child span today.\nimport {\n  recordJobProgress,\n  withChildSpan,\n} from '@netscript/telemetry/instrumentation';\nimport { createJobTools } from './job-tools.ts';\n\nconst handler = defineJobHandler(async (ctx) => {\n  const { log } = createJobTools(ctx); // log.* is real today\n  log.info('Starting workers plugin health check');\n\n  // withChildSpan opens a real span as a child of the active job span\n  // and gives you a handle to attach queryable attributes.\n  const envOk = await withChildSpan('check.environment', async (span) => {\n    span.setAttribute('check.name', 'environment');\n    return Boolean(Deno.env.get('PORT'));\n  });\n\n  if (!envOk) return createFailureResult('environment check failed');\n\n  // Emit a real job.progress event (current / total / percentage).\n  recordJobProgress(1, 1);\n  return createSuccessResult({ status: 'healthy' });\n});\n\nexport default Object.assign(handler, {\n  id: 'workers-plugin-health-check' as const,\n});"
  },
  {
    label: "createJobTools(ctx)",
    lang: "ts",
    code: "import { defineJobHandler } from '@netscript/plugin-workers-core';\nimport { createJobTools } from './job-tools.ts';\n\n// createJobTools(ctx) returns:\n//   log          -> console.* wrappers: info/warn/error/debug (plain stdout, NOT trace-correlated)\n//   progress     -> emits job.progress and forwards to ctx.reportProgress\n//   trace        -> real addEvent, recordProgress, and withChildSpan helpers\n//   traceContext -> { traceparent, tracestate } for manual propagation\nconst handler = defineJobHandler(async (ctx) => {\n  const { log, progress, trace, traceContext } = createJobTools(ctx);\n  log.info('health check', { traceparent: traceContext.traceparent });\n  trace.addEvent('health_check.started');\n  await progress(50, 'half complete');\n  await trace.withChildSpan('health_check.verify', async (span) => {\n    span.setAttribute('check.kind', 'health');\n  });\n  return { ok: true } as const;\n});\n\nexport default handler;"
  },
] }) }}

> [!NOTE]
> The scaffold's `log.info` / `log.warn` / `log.error` forward to `console.*`. They appear in process
> stdout, in the dashboard's **Console logs** view for the resource, but **not** as OTel-correlated
> log records tied to the active trace. For trace-correlated structured logging, use
> `@netscript/logger` directly, and use spans (`withChildSpan`) when you want queryable attributes and
> durations on a unit of work.

## Step 4 — Extend service tracing and propagate `traceparent`

Services keep trace context across the oRPC/HTTP boundary. The plugin API services build their app
with the fluent builder and opt the RPC layer into trace context explicitly:

{{ comp.tabbedCode({ tabs: [
  {
    label: "Enable RPC trace context",
    lang: "ts",
    code: "import { createService } from '@netscript/service';\nimport { router } from './router.ts';\n\n// The plugin API services use the fluent builder. withRPC({ traceContext: true })\n// threads the incoming traceparent through to handlers. oRPC is served under\n// /api/rpc/* by default.\nawait createService(router, { name: 'workers', version: '1.0.0', port: Number(Deno.env.get('PORT')) }) // note: your scaffold's port will differ\n  .withCors()\n  .withLogger()\n  .withOpenAPI({ title: 'Workers API' })\n  .withDatabase(dbClient)\n  .withRPC({ traceContext: true })\n  .withHealth()\n  .serve();"
  },
  {
    label: "One-shot service (defineService)",
    lang: "ts",
    code: "import { defineService } from '@netscript/service';\nimport { router } from './router.ts';\n\n// Local services use the one-call form. Tracing is enabled by the framework;\n// debug: true surfaces verbose request/trace logs while you wire things up.\nawait defineService(router, {\n  auth: { public: true, reason: 'Public example service; add guards before exposing private data' },\n  name: 'users',\n  version: '1.0.0',\n  port: parseInt(Deno.env.get('PORT') || '3001'), // note: your scaffold's port will differ\n  openapi: { title: 'Users API', description: 'users service' },\n  debug: true,\n});"
  },
  {
    label: "Propagate across a call",
    lang: "ts",
    code: "import { createServiceClient } from '@netscript/sdk/client';\nimport { UsersContractV1 } from '@my-app/contracts';\n\n// In an Aspire-launched caller, discovery and trace context propagate through the SDK.\nconst users = createServiceClient({ contract: UsersContractV1, serviceName: 'users' });\nawait users.list({ page: 1, limit: 10, sortOrder: 'asc' });"
  }
] }) }}

Aspire injects `PORT` at runtime, so the entrypoint reads it from the environment. The typed source
of truth is the `services.<name>.port` field in `netscript.config.ts`, which the scaffold wires as the
fallback default; set the port there rather than editing this line.

NetScript follows the W3C Trace Context standard. When an inbound request carries a `traceparent`
header, the service continues that trace instead of starting a new one, and the worker dispatcher
propagates `traceparent` / `tracestate` into the job subprocess. A webhook at the triggers URL Aspire prints that enqueues a
job and the worker subprocess that runs it therefore appear as a **single correlated trace**. Forward
`traceparent` on every service-to-service call.

## Step 5 — Read the traces

In the dashboard at the URL Aspire prints:

1. **Traces** shows every request and job as a waterfall of spans. Click a root span to drill into
   children, durations and attributes (the ones you set with `span.setAttribute(...)`). Job runs show
   `job.started` / `job.completed` events and, where you added them, `job.progress` and `job.step.*`
   events.
2. **Structured logs** filters by resource (e.g. `workers-api`) or by trace id to show the
   `log.info`/`log.error` lines correlated to a span.
3. **Resources** shows health and console output per resource, so you can match a failing span to the
   resource that produced it.

Check liveness without the UI through the per-capability health endpoints:

```bash
# Replace ports with the ones dynamically assigned to your services:
curl -s http://localhost:<workers-port>/health        # workers
curl -s http://localhost:<sagas-port>/health/live   # sagas
curl -s http://localhost:<triggers-port>/health        # triggers
curl -s http://localhost:<auth-port>/health        # auth
```

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| The **Traces** tab stays empty. | Spans are collected only while Aspire runs and the OTLP endpoint (`the OTLP URL Aspire prints`) is reachable. A service started standalone with `--no-aspire` has nowhere to export. Start `aspire start` first. |
| `deno task aspire:otel -- traces <resource>` returns an empty array. | A healthy but idle AppHost has no traces yet. Generate traffic first. |

## Production notes

- **Put span data in attributes, not log lines.** Ids, counts and statuses you want to filter or
  aggregate on belong on the span through `span.setAttribute(...)`; attributes are queryable in the
  dashboard and freeform log text is not. Keep `log.*` for human-readable narrative and errors.

## Next steps

Read [Telemetry & logging](/observability/telemetry/) for the full configuration, helper and
trace-query surface.

- [Observability](/explanation/observability/): spans, structured logs, health endpoints and how
  Aspire renders distributed traces across services and jobs.
- [`telemetry` reference](/reference/telemetry/): the full export map (instrumentation, context,
  attributes, orpc).
- [`logger` reference](/reference/logger/): the structured logger behind `log.info` / `log.warn` /
  `log.error`.
