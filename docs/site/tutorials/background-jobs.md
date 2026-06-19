---
layout: layouts/base.vto
title: Add background jobs
templateEngine: [vento, md]
prev: { label: "2 · Build a service", href: "/tutorials/build-a-service/" }
next: { label: "4 · A durable workflow", href: "/tutorials/durable-workflow/" }
---

# Tutorial 3 · Add background jobs

This is the third rung of the ladder. So far your `users` service answers requests in the request
path — synchronously, while the caller waits. Real apps also need work that happens *after* the
response: send a welcome email, warm a cache, provision settings. That is what the **workers**
plugin is for.

In this step you will add the workers plugin, author a job with `defineJobHandler(...)` and
`createJobTools(...)`, and trigger it over the Workers API on **`:8091`**. By the end you will watch
a job you wrote execute on demand — and you will have wired the first link in the cross-plugin chain
the rest of the ladder builds on: this job publishes the `UserSettingsCreated` message that
[Tutorial 4](/tutorials/durable-workflow/)'s saga consumes.

{{ comp.learningPath({ steps: [
  { label: "Quickstart", href: "/quickstart/" },
  { label: "1 · First workspace", href: "/tutorials/first-workspace/" },
  { label: "2 · Build a service", href: "/tutorials/build-a-service/" },
  { label: "3 · Background jobs", href: "/tutorials/background-jobs/" },
  { label: "4 · Durable workflow", href: "/tutorials/durable-workflow/" },
  { label: "5 · Ingest a webhook", href: "/tutorials/ingest-webhook/" }
] }) }}

## In this step you will

- Add the **workers** plugin to your workspace, with its sample jobs.
- Read the job-authoring API: `defineJobHandler`, `createJobTools`, and the result helpers
  `createSuccessResult` / `createFailureResult`.
- Author and register a job that publishes a saga message.
- Trigger the job over HTTP and confirm it ran.

## Before you begin

You should already have a workspace from [Tutorial 1](/tutorials/first-workspace/) with the `users`
service from [Tutorial 2](/tutorials/build-a-service/). This rung adds to that same app — do not
start over.

You also need **Aspire running**. The workers plugin ships an API service and a background
processor that Aspire orchestrates alongside Postgres and Garnet. From your project root:

```sh
cd aspire
aspire run
```

{{ comp callout { type: "important", title: "Aspire first, then everything else" } }}
The Workers API on <code>:8091</code> and its background processor are resources in the Aspire
graph. Start <code>aspire run</code> from the <code>aspire/</code> folder <strong>before</strong> you
add the plugin or trigger a job, and leave it running. The same rule that governed
<a href="/tutorials/first-workspace/"><code>netscript db</code></a> applies here: Aspire is the
control plane.
{{ /comp }}

## Step 1 — Add the workers plugin

NetScript's background capabilities arrive as plugins. Add the workers plugin with its sample jobs
so you have a working reference to read and adapt:

```sh
netscript plugin add worker --samples
```

This lands the plugin at **`plugins/workers/`** — the canonical, config-referenced install location
— and registers it in `netscript.config.ts`. Confirm it:

```sh
netscript plugin list
```

The workers plugin shows up in the registry. On disk, the install looks like this:

```
plugins/workers/
├── mod.ts                       # Public manifest (workersPlugin, inspectWorkers)
├── jobs/                        # ← the job-authoring surface
│   ├── health-check.ts          # Full sample: log, progress, trace tools
│   ├── create-user-settings.ts  # Publishes the UserSettingsCreated saga message
│   └── job-tools.ts             # Local createJobTools(ctx) helper
├── contracts/v1/                # oRPC contract re-exports (frontend-safe)
├── database/workers.prisma      # Plugin's Prisma models (JobDefinition)
├── services/src/                # The :8091 oRPC API service
└── bin/combined.ts              # Background processor entrypoint
```

{{ comp callout { type: "note", title: "Two trees, one canonical home" } }}
A scaffold may also create a slimmer top-level <code>workers/</code> directory — a workspace member
that stages a subset of files for the background processor. The real, config-referenced plugin lives
at <strong><code>plugins/workers/</code></strong>: that is what <code>netscript.config.ts</code>
points at (<code>./plugins/workers/mod.ts</code>) and where you author jobs. Edit
<code>plugins/workers/</code>.
{{ /comp }}

## Step 2 — Read the job-authoring API

A job is a function wrapped by `defineJobHandler`, given a stable `id`, and exported as the module
default. Inside the handler you receive a `ctx`, do the work, and return a result. The sample
`plugins/workers/jobs/health-check.ts` shows the full tool surface — `createJobTools(ctx)` hands you
`log`, `progress`, and `trace`:

{{ comp.tabbedCode({ tabs: [
  {
    label: "jobs/health-check.ts (shape)",
    lang: "ts",
    code: "import {\n  createSuccessResult,\n  createFailureResult,\n  defineJobHandler,\n} from '@netscript/plugin-workers-core';\nimport { createJobTools } from './job-tools.ts';\n\nconst handler = defineJobHandler(async (ctx) => {\n  const { log, progress, trace } = createJobTools(ctx);\n\n  log.info('Starting workers plugin health check');\n  progress(20, 'Checking environment');\n\n  const env = await trace.withChildSpan('check.environment', (span) => {\n    span.setAttribute('check.name', 'environment');\n    return { ok: true };\n  });\n\n  if (!env.ok) return createFailureResult('environment check failed');\n  return createSuccessResult({ status: 'healthy' });\n});\n\nexport default Object.assign(handler, {\n  id: 'workers-plugin-health-check' as const,\n});"
  },
  {
    label: "The tool surface",
    lang: "ts",
    code: "// createJobTools(ctx) returns three helpers:\n//\n//   log.info / log.warn / log.error  — structured logging\n//   progress(percent, message)        — report job progress\n//   trace.addEvent / trace.recordProgress / trace.withChildSpan\n//\n// `id` is attached to the handler with Object.assign so the\n// runtime registry can address the job by a stable string."
  }
] }) }}

{{ comp callout { type: "warning", title: "Honest reality: progress & trace are stubs today" } }}
In the scaffolded copy, <code>createJobTools</code>'s <strong>progress reporting and trace/span
helpers are no-op stubs</strong> — <code>progress(...)</code> and <code>trace.withChildSpan(...)</code>
log to the console but do not emit real OpenTelemetry spans or a live progress stream yet. The
API is stable and your code will keep working as the runtime fills in; just don't expect spans in
the Aspire dashboard from these sample tools in alpha. <code>log.*</code> does emit structured logs.
{{ /comp }}

## Step 3 — Read the job you'll trigger

The sample you'll actually run is `plugins/workers/jobs/create-user-settings.ts`. It is deliberately
small — that is the point of NetScript jobs. It parses its payload with Zod, publishes a saga
message, and returns a success result:

{{ comp.tabbedCode({ tabs: [
  {
    label: "jobs/create-user-settings.ts",
    lang: "ts",
    code: "import { createSagaPublisher } from '@netscript/plugin-sagas/runtime';\nimport {\n  createSuccessResult,\n  defineJobHandler,\n} from '@netscript/plugin-workers-core';\nimport { z } from 'zod';\n\nconst CreateUserSettingsPayloadSchema = z.object({\n  userId: z.string().min(1),\n});\n\nconst sagaPublisher = createSagaPublisher();\n\nconst handler = defineJobHandler(async (ctx) => {\n  const { userId } = CreateUserSettingsPayloadSchema.parse(ctx.payload ?? {});\n\n  // Publish a message a saga can pick up (Tutorial 4 consumes this).\n  await sagaPublisher.publish({\n    type: 'UserSettingsCreated',\n    payload: { userId },\n  });\n\n  return createSuccessResult({\n    userId,\n    settingsCreated: true,\n    source: 'scaffold-sample',\n  });\n});\n\nexport default Object.assign(handler, { id: 'create-user-settings' });"
  }
] }) }}

This is the first link of the ladder's cross-plugin chain: the job **publishes
`UserSettingsCreated`**, and the saga you add in [Tutorial 4](/tutorials/durable-workflow/)
**handles** that exact message. You don't need to wire anything else now — just understand that
triggering this job emits a message the rest of the app reacts to.

{{ comp callout { type: "tip", title: "Author your own job the same way" } }}
To add a job of your own, drop a new file in <code>plugins/workers/jobs/</code> that calls
<code>defineJobHandler(async (ctx) => { /* work */ return createSuccessResult({}); })</code> and
exports <code>Object.assign(handler, &#123; id: 'my-job' &#125;)</code>. Re-run the registry
generation step below and it becomes triggerable by its <code>id</code>.
{{ /comp }}

## Step 4 — Generate the runtime registry

The Workers API addresses jobs by `id`, which means it needs a generated registry that maps each id
to its handler. Generate the plugin registries so the new jobs are discoverable:

```sh
netscript generate
```

This scans `plugins/workers/jobs` (and `plugins/triggers/jobs`) and writes a jobs registry the
running service loads. After this, `create-user-settings` and `workers-plugin-health-check` are both
addressable over the API.

{{ comp callout { type: "note", title: "Restart the processor if it was already running" } }}
If <code>aspire run</code> was up before you generated the registry, restart it (or let it
hot-reload) so the Workers API and its background processor pick up the newly generated jobs.
{{ /comp }}

## Step 5 — Trigger the job

With Aspire up, the Workers API is live on **`:8091`**. First confirm the service is healthy and the
job is registered:

```sh
# Health
curl http://localhost:8091/health

# List registered jobs — create-user-settings should appear
curl http://localhost:8091/api/v1/workers/jobs
```

Now trigger the job by its `id`. The trigger endpoint enqueues an execution and the background
processor runs it:

```sh
curl -X POST http://localhost:8091/api/v1/workers/jobs/create-user-settings/trigger \
  -H 'content-type: application/json' \
  -d '{ "payload": { "userId": "user-42" } }'
```

{{ comp callout { type: "tip", title: "Seed sample data first if you prefer" } }}
The workers plugin exposes <code>POST /api/v1/workers/seed</code> to populate sample job and task
records, and <code>GET /api/v1/workers/tasks</code> to inspect them. Seeding is optional for this
tutorial — triggering the job directly is enough.
{{ /comp }}

## Verify — watch it execute

A trigger returns quickly because the work runs in the background. Confirm it actually executed by
reading the executions feed:

```sh
curl 'http://localhost:8091/api/v1/workers/executions?limit=10'
```

You should see an execution record for `create-user-settings` with a completed/succeeded status and
the result payload (`settingsCreated: true`, `source: "scaffold-sample"`). You can also watch it in
two other places:

- **Aspire dashboard** at [http://localhost:18888](http://localhost:18888) — open the `workers` and
  `workers-api` resources and read their live logs; you will see the job's `log.info` lines and the
  publish of `UserSettingsCreated`.
- **The structured log lines** the job emits via `log.info` (these are real, unlike the
  trace/progress stubs called out above).

{{ comp.apiTable({
  title: "Workers API · :8091",
  caption: "Endpoints you used in this step. See the full generated surface in the reference.",
  columns: ["Method", "Path", "Purpose"],
  rows: [
    ["GET", "/health", "Liveness check for the Workers API service"],
    ["GET", "/api/v1/workers/jobs", "List registered job handlers by id"],
    ["POST", "/api/v1/workers/jobs/{id}/trigger", "Enqueue an execution of a job by id"],
    ["GET", "/api/v1/workers/executions?limit=10", "Recent executions and their results"],
    ["GET", "/api/v1/workers/tasks", "Inspect task records"],
    ["POST", "/api/v1/workers/seed", "Populate sample job and task records"]
  ]
}) }}

{{ comp callout { type: "important", title: "If the execution never appears" } }}
<ul>
<li><strong>Aspire isn't running</strong> — the background processor that drains the job queue is an
Aspire resource. Start <code>aspire run</code> from <code>aspire/</code> and retry.</li>
<li><strong>The job isn't registered</strong> — re-run <code>netscript generate</code> so
<code>create-user-settings</code> is in the generated registry, then restart Aspire.</li>
<li><strong>Wrong id</strong> — the trigger path uses the job's <code>id</code>
(<code>create-user-settings</code>), not its filename. Check <code>GET /api/v1/workers/jobs</code>.</li>
</ul>
{{ /comp }}

## What you built

You added the **workers** plugin at `plugins/workers/`, read the job-authoring API
(`defineJobHandler`, `createJobTools`, `createSuccessResult` / `createFailureResult`), generated the
runtime registry, and triggered a real job over the Workers API on `:8091` — then watched it execute
in the executions feed and the Aspire dashboard. That job published a `UserSettingsCreated`
message, the first half of a durable workflow.

You also saw the honest edges of alpha: `log.*` emits structured logs, but `progress` and `trace`
are no-op stubs in the scaffolded tools today.

## Where to go next

- **Continue the ladder** → [Tutorial 4 · A durable workflow](/tutorials/durable-workflow/) — add
  the **sagas** plugin and a saga that consumes the `UserSettingsCreated` message this job
  published, completing the choreography.
- **Go deeper on the capability** → [Background jobs](/capabilities/background-jobs/) — the concept,
  the headline API, and the full endpoint map.
- **Look up the full API** → the generated [`workers` reference](/reference/workers/) and the
  [plugin model](/explanation/plugin-model/).
