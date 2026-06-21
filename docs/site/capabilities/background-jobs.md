---
layout: layouts/base.vto
title: Background jobs
templateEngine: [vento, md]
prev: { label: "Services & contracts", href: "/capabilities/services/" }
next: { label: "Durable sagas", href: "/capabilities/durable-sagas/" }
---

{{ comp.breadcrumb() }}

# Background jobs

The **workers** plugin is NetScript's background-job capability: durable, KV-backed
job handlers that run in their own thread-isolated processor, separate from your
request-serving services. You author a job as a single `defineJobHandler(...)`
function, give it an `id`, and the runtime takes care of registration, execution
tracking, scheduling, and an HTTP API to enqueue and inspect runs. It is the unit
you reach for whenever work should happen *after* a request returns — sending a
welcome email, provisioning settings, processing an upload — without blocking the
caller.

Two things make the workers plugin more than a queue. First, **job dispatch and
execution are instrumented with real OpenTelemetry spans** — traces show up in the
Aspire dashboard automatically, no wiring required (see [Observability below](#observability-real-job-traces-out-of-the-box)).
Second, alongside TypeScript job handlers it carries a **polyglot task runtime**
(`defineTask`) for executing non-TypeScript work — Python, shell, any runtime —
under the same scheduler and queue (see [Polyglot tasks](#polyglot-tasks-run-non-typescript-work)).

Add it to a scaffolded workspace with one command, which lands the plugin at
`plugins/workers/` and registers it in `netscript.config.ts`:

```bash
netscript plugin add worker --samples
```

The `--samples` flag ships two real, compiling modules you can read and trigger
immediately: `plugins/workers/jobs/health-check.ts` (a job handler) and
`plugins/workers/tasks/validate-payload.ts` (a polyglot task). The
`create-user-settings.ts` job is generated later by `netscript generate`
(runtime-registry / official-sample generation) when both the workers and sagas
plugins are present. The plugin's API service comes up on **port 8091**.

{{ comp callout { type: "tip", title: "Use this when…" } }}
Reach for a background job when the work is <strong>fire-and-forget or deferrable</strong>:
it should survive the request that started it, run on its own schedule or trigger, and
be retried/observed independently. If the work instead <strong>coordinates several steps
across time</strong> (waiting for messages, compensating on failure), model it as a
<a href="/capabilities/durable-sagas/">durable saga</a> — jobs and sagas compose: the
sample <code>create-user-settings</code> job publishes a <code>UserSettingsCreated</code>
message that a saga consumes. When the work originates from an inbound HTTP request, an
upstream <a href="/capabilities/triggers/">trigger</a> can <code>enqueueJob</code> into
this same runtime.
{{ /comp }}

{{ comp callout { type: "important", title: "Aspire first, then jobs" } }}
The workers plugin persists job definitions to Postgres and uses Deno KV for execution
state, so bring orchestration up before you exercise it. Step&nbsp;1 is the database
service; step&nbsp;2 is Aspire: <code>cd aspire &amp;&amp; aspire run</code> provisions
Postgres and Garnet, then <code>netscript db init --name init</code> /
<code>netscript db generate</code> wire the schema. Only after Aspire is up will
<code>:8091</code> resolve jobs and record executions. See
<a href="/how-to/database-migration/">Database &amp; migration</a>.
{{ /comp }}

## Author a job

A job handler is an async function over a context object that returns a result. The
headline surface is `defineJobHandler` plus `createSuccessResult` /
`createFailureResult` from `@netscript/plugin-workers-core`; the job's identity is
attached with `Object.assign(handler, { id })`. The two tabs below are the actual
scaffold samples — start with the simple one, reach for the richer tool surface only
when you need it.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Simple — create-user-settings.ts",
    lang: "ts",
    code: "// plugins/workers/jobs/create-user-settings.ts\nimport { createSagaPublisher } from '@netscript/plugin-sagas/runtime';\nimport { createSuccessResult, defineJobHandler } from '@netscript/plugin-workers-core';\nimport { z } from 'zod';\n\nconst CreateUserSettingsPayloadSchema = z.object({ userId: z.string().min(1) });\nconst sagaPublisher = createSagaPublisher();\n\n// The handler receives a ctx; parse its payload with zod, do the work, return a result.\nconst handler = defineJobHandler(async (ctx) => {\n  const { userId } = CreateUserSettingsPayloadSchema.parse(ctx.payload ?? {});\n\n  // Hand off to the saga capability — this is the cross-plugin choreography.\n  await sagaPublisher.publish({ type: 'UserSettingsCreated', payload: { userId } });\n\n  return createSuccessResult({ userId, settingsCreated: true, source: 'scaffold-sample' });\n});\n\n// The id is how the runtime registers, lists, and triggers the job.\nexport default Object.assign(handler, { id: 'create-user-settings' });"
  },
  {
    label: "Advanced — job tools (health-check.ts)",
    lang: "ts",
    code: "// plugins/workers/jobs/health-check.ts\nimport { createSuccessResult, createFailureResult, defineJobHandler } from '@netscript/plugin-workers-core';\nimport { createJobTools } from './job-tools.ts';\n\nconst handler = defineJobHandler(async (ctx) => {\n  // createJobTools(ctx) exposes log, progress, and trace helpers (API shape).\n  const { log, progress, trace } = createJobTools(ctx);\n\n  log.info('Starting workers plugin health check');\n  progress(20, 'Checking environment');\n\n  const envCheck = await trace.withChildSpan('check.environment', (span) => {\n    span.setAttribute('check.name', 'environment');\n    return { ok: true };\n  });\n\n  if (!envCheck.ok) return createFailureResult('environment check failed');\n  return createSuccessResult({ status: 'healthy' });\n});\n\nexport default Object.assign(handler, { id: 'workers-plugin-health-check' as const });"
  },
  {
    label: "Custom spans — @netscript/telemetry",
    lang: "ts",
    code: "// plugins/workers/jobs/with-real-spans.ts\nimport { createSuccessResult, defineJobHandler } from '@netscript/plugin-workers-core';\n// For REAL custom spans inside a handler, call the telemetry helpers directly —\n// they participate in the same trace as the dispatcher span (which is automatic).\nimport { withChildSpan } from '@netscript/telemetry/instrumentation';\n\nconst handler = defineJobHandler(async (ctx) => {\n  const result = await withChildSpan('charge.customer', async (span) => {\n    span.setAttribute('order.id', String(ctx.payload?.orderId ?? ''));\n    // ... real work; this child span shows up under the job span in Aspire.\n    return { charged: true };\n  });\n\n  return createSuccessResult(result);\n});\n\nexport default Object.assign(handler, { id: 'charge-customer' });"
  }
] }) }}

{{ comp callout { type: "note", title: "Job tools vs. real spans (the honest distinction)" } }}
<code>createJobTools(ctx)</code> returns <code>log</code>, <code>progress</code>, and
<code>trace.{addEvent,recordProgress,withChildSpan}</code> to give you the API shape to
write against. In the scaffolded copy the <strong>progress and trace helpers are
currently no-op stubs</strong> (<code>log</code> writes to the console; the trace/progress
methods do nothing). This is a <strong>known, tracked limitation with a fix planned</strong>,
not a permanent design choice. The important part: this gap is <em>only</em> in the
scaffold-facing helper — job dispatch and execution themselves emit real spans
automatically (next section). The honest workaround for custom handler spans today is to
call <code>@netscript/telemetry</code> helpers directly, as the third tab shows.
{{ /comp }}

## Observability: real job traces out of the box

Job-level observability is **not** a stub. The workers runtime instruments the entire
scheduler → queue → worker → subprocess path with real OpenTelemetry spans, and those
traces appear in the [Aspire dashboard](/explanation/aspire/) automatically once Aspire
is up — you do not have to wire anything.

{{ comp.apiTable({
  caption: "What the worker runtime traces automatically (framework layer — real today)",
  rows: [
    { name: "Job dispatch + execution", type: "span", desc: "Each enqueued run gets a span with attributes, duration, status, and job.started / job.completed / job.failed / job.exception events." },
    { name: "Step + progress events", type: "event", desc: "job.step.* and job.progress (current / total / percentage) events are emitted by the dispatcher on real job runs." },
    { name: "Subprocess trace continuation", type: "context", desc: "W3C traceparent / tracestate is propagated into the background subprocess, so the child trace links back to the dispatching span." },
    { name: "Scheduler + cron spans", type: "span", desc: "Scheduler-start, schedule-job, dispatch, and cron-run spans cover the timer/cron path that fires scheduled jobs." },
    { name: "task.execute span", type: "span", desc: "The polyglot task executor wraps task runs in a task.execute span too (see Polyglot tasks below)." }
  ]
}) }}

For spans you author *inside* a handler, import directly from
**`@netscript/telemetry`** (e.g. `@netscript/telemetry/instrumentation` for
`withChildSpan` / `traceJobExecution`, `@netscript/telemetry/context`,
`@netscript/telemetry/attributes`). These nest correctly under the automatic dispatch
span. See [Observability](/explanation/observability/) for the full model and
[Add OpenTelemetry](/how-to/add-opentelemetry/) for the recipe.

{{ comp callout { type: "warning", title: "One honest remaining gap" } }}
The <strong>job</strong> dispatch path is fully span-wrapped. The scaffold-facing
<code>createJobTools(ctx)</code> trace/progress helpers remain no-op stubs (tracked debt,
fix planned — see the callout above). Do not say "worker tracing is a no-op": that is
false for the framework layer. The accurate framing is "real job/scheduler/subprocess
traces automatically; the scaffold handler-helper shims are the only stub, and you bypass
them with <code>@netscript/telemetry</code> directly."
{{ /comp }}

## Polyglot tasks: run non-TypeScript work

Job handlers are TypeScript functions. But not all background work is TypeScript — you
may have a Python scoring model, a shell pipeline, or a binary you want to run on the
same durable scheduler and queue. That is what **`defineTask`** is for: it registers a
**task** whose runtime is *not* a JS function, executed by the workers' multi-runtime
task executor rather than invoked in-process.

`defineTask` is a distinct capability from `defineJobHandler`, not a synonym:

{{ comp.apiTable({
  caption: "defineJobHandler vs. defineTask",
  rows: [
    { name: "defineJobHandler", type: "TS job", desc: "An in-process async TypeScript handler over ctx that returns a result. The default unit for application logic written in Deno/TS." },
    { name: "defineTask", type: "polyglot task", desc: "A task whose runtime can be non-TypeScript (e.g. a separate process / interpreter). Dispatched through the same scheduler and queue, executed by the multi-runtime task executor." }
  ]
}) }}

Reach for `defineTask` when the work is owned by another runtime and you want NetScript's
scheduling, queueing, and execution tracking around it without rewriting it in
TypeScript. It is surfaced from `@netscript/plugin-workers-core` alongside
`defineJobHandler`, and its runs are wrapped in a real `task.execute` OpenTelemetry span
by the task executor.

{{ comp callout { type: "note", title: "Two registries, one runtime" } }}
TypeScript handlers land in the jobs registry (default-exported from
<code>plugins/workers/jobs</code>); polyglot tasks are surfaced through
<code>defineTask</code>. The workers API exposes both — <code>GET /api/v1/workers/jobs</code>
lists job definitions and <code>GET /api/v1/workers/tasks</code> shows the task registry
view. Pick <code>defineJobHandler</code> for TS logic and <code>defineTask</code> when the
work belongs to another runtime.
{{ /comp }}

## Trigger and inspect

Once Aspire is up and the schema is wired, the workers API on **`:8091`** registers your
job by `id` and gives you HTTP endpoints to seed, trigger, and inspect runs. These are the
endpoints the CLI E2E suite validates live.

{{ comp.apiTable({
  caption: "Workers API — port 8091 (link to /reference/workers/ for the full generated surface)",
  rows: [
    { name: "GET /health", type: "liveness", desc: "Health probe for the workers API service." },
    { name: "GET /api/v1/workers/jobs", type: "list", desc: "All registered job definitions (id, name, topic) discovered from plugins/workers/jobs." },
    { name: "POST /api/v1/workers/jobs/{id}/trigger", type: "enqueue", desc: "Enqueue a run of the job with this id, e.g. create-user-settings, passing a JSON payload body." },
    { name: "GET /api/v1/workers/executions?limit=10", type: "history", desc: "Recent executions and their outcomes (KV-backed execution state)." },
    { name: "GET /api/v1/workers/tasks", type: "list", desc: "Task registry view for the workers runtime (polyglot defineTask entries)." },
    { name: "POST /api/v1/workers/seed", type: "seed", desc: "Seed the workers store with the sample/registered jobs." },
    { name: "GET /api/v1/workers/subscribe", type: "SSE", desc: "Server-sent-events stream of execution updates (KV-watch)." }
  ]
}) }}

Trigger the sample job by `id` once the service is running:

```bash
# Enqueue the create-user-settings job (port 8091).
curl -X POST http://localhost:8091/api/v1/workers/jobs/create-user-settings/trigger \
  -H 'content-type: application/json' \
  -d '{"userId":"u_123"}'

# Watch it land in the execution history.
curl http://localhost:8091/api/v1/workers/executions?limit=10
```

{{ comp callout { type: "note", title: "Where jobs come from" } }}
The runtime scans <code>workers/jobs</code> (the primary user jobs directory) for
default-exported handlers, and also includes plugin-contributed handlers from
<code>plugins/workers/jobs</code> (and <code>plugins/triggers/jobs</code> when present). The
generated registry lands at
<code>.netscript/generated/plugin-workers/jobs.registry.ts</code>, keyed by each handler's
<code>id</code>. Background execution runs from <code>plugins/workers/bin/combined.ts</code>,
which is a <em>separate</em> process from the <code>:8091</code> API service — the API
enqueues, the processor executes. The default concurrency is <code>2</code> via the
<code>WORKER_CONCURRENCY</code> env var.
{{ /comp }}

## Where to go next

Pick the lane that matches what you're doing — learn the workflow end to end, copy a
recipe, look up the exact generated surface, or build the mental model.

{{ comp.featureGrid({ items: [
  {
    title: "Learn — Add background jobs",
    body: "The tutorial rung: add the worker plugin to the running app, author a job, and trigger it over :8091 as part of the continuous users-onboarding narrative.",
    href: "/tutorials/background-jobs/",
    icon: "→"
  },
  {
    title: "Do — Queue, KV & cron recipe",
    body: "Task-oriented recipe for the queue, Deno KV, and cron primitives the workers runtime is built on, including the --unstable-kv flag.",
    href: "/how-to/queue-kv-cron/",
    icon: "◆"
  },
  {
    title: "Look up — workers reference",
    body: "The full generated deno doc API for @netscript/plugin-workers — every exported symbol, type, and subpath. The authority for signatures.",
    href: "/reference/workers/",
    icon: "≡"
  },
  {
    title: "Understand — Durable workflows",
    body: "How jobs compose with sagas: the create-user-settings job publishes UserSettingsCreated, a saga consumes it. The why behind the choreography.",
    href: "/explanation/durable-workflows/",
    icon: "◎"
  }
] }) }}

{{ comp.nextPrev({
  prev: { label: "Services & contracts", href: "/capabilities/services/" },
  next: { label: "Durable sagas", href: "/capabilities/durable-sagas/" }
}) }}
