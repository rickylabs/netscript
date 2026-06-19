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
tracking, and an HTTP API to enqueue and inspect runs. It is the unit you reach for
whenever work should happen *after* a request returns — sending a welcome email,
provisioning settings, processing an upload — without blocking the caller.

Add it to a scaffolded workspace with one command, which lands the plugin at
`plugins/workers/` and registers it in `netscript.config.ts`:

```bash
netscript plugin add worker --samples
```

The `--samples` flag ships two real, compiling job modules you can read and trigger
immediately: `plugins/workers/jobs/health-check.ts` and
`plugins/workers/jobs/create-user-settings.ts`. The plugin's API service comes up on
**port 8091**.

{{ comp callout { type: "tip", title: "Use this when…" } }}
Reach for a background job when the work is <strong>fire-and-forget or deferrable</strong>:
it should survive the request that started it, run on its own schedule or trigger, and
be retried/observed independently. If the work instead <strong>coordinates several steps
across time</strong> (waiting for messages, compensating on failure), model it as a
<a href="/capabilities/durable-sagas/">durable saga</a> — jobs and sagas compose: the
sample <code>create-user-settings</code> job publishes a <code>UserSettingsCreated</code>
message that a saga consumes.
{{ /comp }}

{{ comp callout { type: "important", title: "Aspire first, then jobs" } }}
The workers plugin persists job definitions to Postgres and uses Deno KV for execution
state, so bring orchestration up before you exercise it: <code>cd aspire &amp;&amp; aspire run</code>
provisions Postgres and Garnet, then <code>netscript db init --name init</code> /
<code>db generate</code> wire the schema. Only then will <code>:8091</code> resolve jobs and
record executions. See <a href="/how-to/database-migration/">Database &amp; migration</a>.
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
    code: "// plugins/workers/jobs/health-check.ts\nimport { createSuccessResult, createFailureResult, defineJobHandler } from '@netscript/plugin-workers-core';\nimport { createJobTools } from './job-tools.ts';\n\nconst handler = defineJobHandler(async (ctx) => {\n  // createJobTools(ctx) exposes log, progress, and trace helpers.\n  const { log, progress, trace } = createJobTools(ctx);\n\n  log.info('Starting workers plugin health check');\n  progress(20, 'Checking environment');\n\n  const envCheck = await trace.withChildSpan('check.environment', (span) => {\n    span.setAttribute('check.name', 'environment');\n    return { ok: true };\n  });\n\n  if (!envCheck.ok) return createFailureResult('environment check failed');\n  return createSuccessResult({ status: 'healthy' });\n});\n\nexport default Object.assign(handler, { id: 'workers-plugin-health-check' as const });"
  }
] }) }}

{{ comp callout { type: "warning", title: "Honest alpha reality: job tools are stubs" } }}
<code>createJobTools(ctx)</code> returns <code>log</code>, <code>progress</code>, and
<code>trace.{addEvent,recordProgress,withChildSpan}</code> — but in the scaffolded copy
the <strong>progress and trace helpers are no-op stubs</strong> (<code>log</code> writes to
the console; spans do nothing). They give you the API shape to write against, not real
OpenTelemetry spans or a live progress channel yet. Don't promise dashboards a progress
bar or distributed traces from these tools in alpha — call them when you want the code to
read right, and track <a href="/explanation/observability/">Observability</a> for when the
runtime lands.
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
    { name: "GET /api/v1/workers/tasks", type: "list", desc: "Task registry view for the workers runtime." },
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
The runtime scans <code>plugins/workers/jobs</code> (and <code>plugins/triggers/jobs</code>)
for default-exported handlers and generates a registry at
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
