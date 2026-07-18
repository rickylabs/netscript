---
layout: layouts/base.vto
title: Background jobs
templateEngine: [vento, md]
prev: { label: "Services & contracts", href: "/services-sdk/services/" }
next: { label: "Durable sagas", href: "/durable-workflows/sagas/" }
order: 1
---

# Background jobs

**One typed handler file is the whole job.** Registration, dispatch, retry, execution
tracking, scheduling, tracing, and the HTTP trigger API all come from the worker runtime —
so shipping a working background job (whether you write it or an AI agent does) means
authoring a single `defineJobHandler` module, not first assembling a queue, a worker pool,
and an inspection UI around it.

A NetScript **background job** is a durable, KV-backed TypeScript handler that runs in
its own thread-isolated worker, separate from your request-serving services. You author a
job as one `defineJobHandler(...)` callable, give it an `id`, and the runtime takes care of
registration, dispatch, retry, execution tracking, scheduling, and an HTTP API to enqueue
and inspect runs. It is the unit you reach for whenever work should happen *after* a request
returns — charging a payment, sending a welcome email, processing an upload — without
blocking the caller.

{{ comp.diagram({ src: "/assets/diagrams/queue-worker-scheduler.svg", alt: "An enqueue call (from a trigger, an HTTP POST to the workers API, or the scheduler) places a job on the durable queue; the worker runtime pulls it and runs the handler in one of three runner modes — in-process, web-worker (one V8 isolate per worker), or subprocess — then writes a JobResult to the KV-backed execution store, which streams updates back over SSE.", caption: "Enqueue → durable queue → worker runtime (in-process / web-worker / subprocess) → result store. The scheduler fires cron-defined jobs onto the same queue; graceful shutdown drains in-flight runs before the runner stops." }) }}

## The story: a screenshot becomes a diagnosis

The clearest picture of what this contract buys comes from a production incident-diagnosis
assistant built on NetScript for a legacy ERP estate. A support engineer pastes an
alert-email screenshot into a chat channel; a background job runs a vision model over the
image and extracts the structured fields (program, error number, table, timestamp) that
downstream tooling needs to trace the failure.

Two properties of the job contract shaped that worker into its correct form:

- **The payload is queue-borne, so it stays small.** The first version enqueued the raw
  image bytes and hit Deno KV's 64&nbsp;KB enqueue limit. The fix — carry only a small
  reference through the queue and fetch the bytes back over a typed service client inside
  the handler — is exactly the shape the contract steers you toward: the queue moves
  *references to work*, not blobs.
- **Workers stay compute-only.** The app's channel database holds an exclusive OS file
  lock, so a second process opening it crashes outright. Because a job handler receives a
  `ctx` and returns a `JobResult` — rather than a database connection — writing results
  back through the owning service's typed client was the natural default, not a
  discipline the team had to invent. The single writer keeps owning its database; the
  worker never touches it.

The same run is traced end to end: dispatch, execution, progress events, and the
subprocess hop (if any) land in the [Aspire dashboard](/explanation/aspire/) without
handler-side wiring. The rest of this page is the mechanism behind that story.

## What it is

A job is plain TypeScript that runs **in the worker process, not the request process**.
The headline surface — `defineJobHandler`, `createSuccessResult`, and `createFailureResult`
from `@netscript/plugin-workers-core` — lets you write a typed handler over a `ctx`, do the
work, and return a structured `JobResult`. Job dispatch and execution are instrumented with
real OpenTelemetry spans that show up in the [Aspire dashboard](/explanation/aspire/)
automatically, so a queued run is observable end to end without wiring. The runner mode
(how the handler is isolated) is a **user-tunable** — see the runtime-mode table below — and
the same queue and scheduler also drive [polyglot tasks](/background-processing/polyglot-tasks/) when
the work is owned by another runtime. The why-behind-the-choreography lives in
[Durability model](/explanation/durability-model/).

{{ comp callout { type: "tip", title: "Jobs vs. tasks vs. sagas vs. services" } }}
Reach for a <strong>background job</strong> when the work is <strong>fire-and-forget or
deferrable</strong> and written in TypeScript: it should survive the request that started
it, run on its own schedule or trigger, and be retried and observed independently. If the
work must run in <em>another runtime</em> (Python, .NET, a shell script, a binary), use a
<a href="/background-processing/polyglot-tasks/">polyglot task</a> — it shares this same queue,
retry, and telemetry machinery but spawns a subprocess. If the work <strong>coordinates
several steps across time</strong> (waiting for messages, compensating on failure), model it
as a <a href="/durable-workflows/sagas/">durable saga</a>; jobs and sagas compose. For a
<em>synchronous request/response API</em>, author a
<a href="/services-sdk/services/">service</a> instead.
{{ /comp }}

## Learn → / Do →

{{ comp.featureGrid({ items: [
  {
    title: "Learn — ERP Sync, lesson 02",
    body: "The tutorial rung: add the worker plugin to the running app, author an import job, and trigger it over :8091 as part of the ERP-sync narrative.",
    href: "/tutorials/erp-sync/02-import-job/",
    icon: "→"
  },
  {
    title: "Do — Tune the worker runtime",
    body: "Recipe: pick the in-process / web-worker / subprocess runner, set WORKERS_CONCURRENCY, and choose a queue provider for your deployment.",
    href: "/how-to/tune-worker-runtime/",
    icon: "◆"
  },
  {
    title: "Understand — Polyglot tasks",
    body: "Run non-TypeScript work (Python, .NET, shell) on the same durable queue and scheduler as a managed subprocess.",
    href: "/background-processing/polyglot-tasks/",
    icon: "◎"
  }
] }) }}

## Minimal example

Add the workers plugin to a published workspace with the public package install flow:

```bash
netscript plugin install @netscript/plugin-workers
```

{{ comp callout { type: "note", title: "Historical: import-map patch no longer required" } }}
Projects scaffolded with an early published CLI (<code>--package-source jsr</code>) on
<code>0.0.1-beta.7</code> generated a root <code>deno.json</code> whose import map omitted the
<code>@netscript/sdk</code> and <code>@netscript/sdk/client</code> entries, requiring a manual patch
before the background worker could load jobs. The scaffold generator now emits both entries in JSR
mode, so no manual fix is needed on current releases.
{{ /comp }}

For local-source contributor work inside this monorepo, use the maintainer binary when you need
first-party samples:

```bash
deno run -A packages/cli/bin/netscript-dev.ts plugin install worker --name workers --samples
```

That local path lands real, compiling modules you can read and trigger immediately — including
`plugins/workers/jobs/health-check.ts` (a job handler) and
`plugins/workers/tasks/validate-payload.ts` (a polyglot task). The plugin's API service comes up
on **port 8091**.

A job handler is an async callable over a `ctx` object that returns a `JobResult`. Parse the
payload with a Zod schema, do the work, and return `createSuccessResult(...)` or
`createFailureResult(...)`. The job's identity is attached with `Object.assign(handler, { id })`.

```ts
// plugins/workers/jobs/process-payment.ts
import {
  createFailureResult,
  createSuccessResult,
  defineJobHandler,
} from '@netscript/plugin-workers-core';
import { z } from 'zod';

// Payload contract — parse ctx.payload before doing any work.
const ProcessPaymentPayloadSchema = z.object({
  orderId: z.string().min(1),
  amountCents: z.number().int().positive(),
});

const handler = defineJobHandler(async (ctx) => {
  const { orderId, amountCents } = ProcessPaymentPayloadSchema.parse(ctx.payload ?? {});

  // Optional progress callback — the runtime wires reportProgress on real runs.
  ctx.reportProgress?.(10, 'charging customer');

  const charge = await chargeCustomer(orderId, amountCents);
  if (!charge.ok) {
    // A failure result is recorded and feeds the retry policy.
    return createFailureResult(`charge declined: ${charge.reason}`);
  }

  ctx.reportProgress?.(100, 'charged');
  // The success payload (data) is persisted on the execution record.
  return createSuccessResult({ orderId, chargeId: charge.id, amountCents });
});

// The id is how the runtime registers, lists, and triggers the job.
export default Object.assign(handler, { id: 'process-payment' });
```

Once the workers API is up (Aspire first — see Production notes), enqueue a run by `id`:

{{ comp callout { type: "note", title: "ns-workers is a shorthand you install once" } }}
<code>ns-workers</code> is a name <em>you</em> give the workers plugin's CLI — the scaffold does
not create it. Install it once, globally, and every <code>ns-workers</code> command on this page
works as written:
<pre><code class="language-bash">deno install -gArf -n ns-workers jsr:@netscript/plugin-workers{{ releaseSpecifier }}/cli</code></pre>
Rather not install it? Each <code>ns-workers &lt;verb …&gt;</code> is exactly
<code>deno x -A jsr:@netscript/plugin-workers{{ releaseSpecifier }}/cli &lt;verb …&gt;</code> — run
that full form instead.
{{ /comp }}

```bash
# Enqueue through the workers API (port 8091), without hand-writing HTTP.
ns-workers trigger process-payment \
  --payload='{"orderId":"o_42","amountCents":4999}'

# Watch it land in the KV-backed execution history.
ns-workers executions --limit=10 --json
```

## Key types first — `JobHandlerContext` & `JobResult`

A handler is `(ctx: JobHandlerContext<TPayload>) => JobResult<TResult> | Promise<…>`. These
two shapes are the contract you write against; read them before the option tables.

{{ comp.apiTable({
  caption: "JobHandlerContext<TPayload> — the ctx passed to defineJobHandler",
  rows: [
    { name: "id", type: "string", desc: "The execution id for this run. Stable per dispatched run." },
    { name: "job", type: "{ id: string } | undefined", desc: "The job definition reference (its id), when available." },
    { name: "payload", type: "TPayload", desc: "The enqueued payload. Parse it with your Zod schema before use." },
    { name: "correlationId", type: "string | undefined", desc: "Correlation id propagated across the dispatch for tracing." },
    { name: "traceparent", type: "string | undefined", desc: "W3C traceparent of the dispatching span; child spans nest under it." },
    { name: "tracestate", type: "string | undefined", desc: "W3C tracestate accompanying the traceparent." },
    { name: "reportProgress", type: "(percent, message?) => void | Promise<void>", desc: "Optional progress callback wired by the runtime on real runs; emits job.progress events." }
  ]
}) }}

{{ comp.apiTable({
  caption: "JobResult<TResult> — return createSuccessResult() or createFailureResult()",
  rows: [
    { name: "success", type: "true | false", desc: "Discriminant. createSuccessResult sets true; createFailureResult sets false. Branch on this." },
    { name: "data", type: "TResult | undefined", desc: "The result payload, persisted on the execution record (present on success, optional on failure)." },
    { name: "error", type: "string", desc: "Failure message — required when success is false (the first arg to createFailureResult)." }
  ]
}) }}

## Worker runtime modes (`WORKER_RUNTIMES`)

How a handler is isolated from the API process is a tunable: `WORKER_RUNTIMES` enumerates the
three runner modes the worker runtime supports. The scaffold default is **web-worker**, where
each worker is its own V8 isolate sized by the `WORKERS_CONCURRENCY` env var. Pick the mode
that matches your isolation, memory, and parallelism needs.

{{ comp.apiTable({
  caption: "WORKER_RUNTIMES — runner isolation modes (WorkerRuntime type)",
  rows: [
    { name: "in-process", type: "WorkerRuntime", desc: "Runs the handler in the same process via the in-process runner (registry-first). Lowest overhead, no isolation — best for tests, compiled binaries, and single-tenant local composition." },
    { name: "web-worker", type: "WorkerRuntime", desc: "Runs each worker in its own Web Worker / V8 isolate (~20-40 MB each). The scaffold default; WORKERS_CONCURRENCY sets the process pool size for parallel job execution. Keep it low to bound memory." },
    { name: "subprocess", type: "WorkerRuntime", desc: "Runs the handler in a spawned subprocess. Strongest process isolation; only Deno tasks get permission sandboxing through .permissions(). Python, .NET, shell, PowerShell, and cmd inherit the worker process's OS permissions." }
  ]
}) }}

{{ comp.apiTable({
  caption: "Deployment & scaling knobs (workers config)",
  rows: [
    { name: "WORKERS_CONCURRENCY", type: "env (number)", desc: "Runtime worker process pool size. The entrypoint reads this plural variable; current Aspire metadata also emits WORKER_CONCURRENCY, but the runtime does not consume it." },
    { name: "concurrency", type: "number", desc: "Per-topic max concurrent workers (WorkersConfigData.concurrency / per-group scaling)." },
    { name: "mode", type: "'combined' | 'distributed'", desc: "Per-topic deployment mode: one combined runner vs. distributed runners. Defaults to 'combined'." },
    { name: "queueProvider", type: "'auto' | 'deno-kv' | 'redis' | 'postgres' | 'amqp'", desc: "Queue backend. 'auto' resolves a provider; see Choose a queue provider." },
    { name: "jobsDir / tasksDir", type: "string", desc: "Directories scanned for default-exported job and task modules." }
  ]
}) }}

{{ comp callout { type: "note", title: "Tune it without touching code" } }}
The runner mode and pool size are deployment settings, not handler concerns — the same
<code>process-payment</code> handler runs unchanged under any
<a href="/how-to/tune-worker-runtime/"><code>WORKER_RUNTIMES</code> mode</a>. Start on the
<code>web-worker</code> default with a small <code>WORKERS_CONCURRENCY</code>, move to
<code>subprocess</code> when you need hard isolation, and drop to <code>in-process</code> for
tests and compiled single-binary deployments. Resolution precedence (schema default → config
file → env → override) is covered in
<a href="/orchestration-runtime/runtime-config/">runtime configuration</a>.
{{ /comp }}

## Enqueue from a trigger

The HTTP `…/trigger` endpoint is one way in; the other is **declaratively, from a trigger
handler**, which returns an `enqueueJob(...)` action. `enqueueJob(job, options)` comes from
`@netscript/plugin-triggers-core` and binds an imported job definition to a payload, so an
inbound webhook or a scheduled trigger drops work onto this same runtime.

```ts
// plugins/triggers/triggers/payment-webhook.ts
import { defineWebhook, enqueueJob } from '@netscript/plugin-triggers-core';
// Import the job definition you want to dispatch (its default export carries the id).
import processPayment from '../../workers/jobs/process-payment.ts';

const handler = defineWebhook(
  // The handler returns trigger actions; enqueueJob is the most common one.
  (event) => [
    enqueueJob(processPayment, {
      payload: { orderId: event.payload.orderId, amountCents: event.payload.amountCents },
      idempotencyKey: event.payload.orderId, // optional: collapse duplicate deliveries
    }),
  ],
  { id: 'payment-webhook', path: '/webhooks/payment', verifier: 'hmac-sha256', secretEnv: 'WEBHOOK_SECRET' },
);

export default handler;
```

{{ comp.apiTable({
  caption: "enqueueJob(job, options) — EnqueueJobOptions (from @netscript/plugin-triggers-core)",
  rows: [
    { name: "payload", type: "TPayload", desc: "The payload handed to the job's ctx.payload. Parse it with the job's Zod schema." },
    { name: "idempotencyKey", type: "string", desc: "Collapses duplicate deliveries — at-most-once effect per key." },
    { name: "concurrencyKey", type: "string", desc: "Serializes runs that share a key (e.g. per-order) so they do not overlap." },
    { name: "priority", type: "number", desc: "Dispatch priority for this enqueue action." }
  ]
}) }}

## Trigger a job from a typed client

The `ns-workers trigger` command above calls the same OpenAPI route. Because the workers API is a **plugin
service**, the same trigger is reachable with a generated typed client over the RPC route
`/api/rpc/*` — no OpenAPI-only fallback and no transport `404`. A first-party plugin API mounts
its router under a named segment, so the client takes a `routerName` alongside `serviceName`;
Aspire injects the URL under `services__workers-api__http__0`.

```ts
// Reach the workers plugin API with a generated typed client.
import { createServiceClient } from '@netscript/sdk/client';
import { workersContract } from '@netscript/plugin-workers/contracts';

const workers = createServiceClient<typeof workersContract>({
  contract: workersContract,
  serviceName: 'workers-api',
  routerName: 'workers',
});

// triggerJob is served over /api/rpc/* and returns { jobId, triggered }.
// Over REST the {id} path segment carries the target job; over RPC (no path
// segment) it travels in this input object. Either way it resolves to
// input.id — with no id at all the call fails with a 422 VALIDATION_ERROR.
const { jobId, triggered } = await workers.triggerJob({
  id: 'process-payment',
  payload: { orderId: 'o_42', amountCents: 4999 },
});

// triggerTask is the polyglot-task twin, returning { taskId, triggered }.
const task = await workers.triggerTask({ id: 'validate-payload', payload: {} });
```

{{ comp.apiTable({
  caption: "Trigger procedures — served over /api/rpc/* (typed client) and /api/v1/... (OpenAPI/REST)",
  rows: [
    { name: "triggerJob({ id, payload?, priority?, delay?, correlationId? })", type: "{ jobId, triggered }", desc: "POST /jobs/{id}/trigger — enqueue a run of the job named by the {id} path segment; resolves the jobId and a triggered flag." },
    { name: "triggerTask({ id, payload?, priority?, delay?, correlationId? })", type: "{ taskId, triggered }", desc: "POST /tasks/{id}/trigger — enqueue a run of the polyglot task named by the {id} path segment; resolves the taskId and a triggered flag." }
  ]
}) }}

{{ comp callout { type: "note", title: "Declare the plugin dependency with pluginReferences" } }}
When a Service depends on a plugin API — the workers plugin, say — declare it in that Service's
config section with <code>pluginReferences?: string[]</code>, a list of the plugin resource names it
consumes (alongside the existing <code>dependsOn</code>). The Aspire helper generation wires those
references so the Service can discover and load the user jobs the plugin API exposes at runtime, and
so the typed client above resolves the plugin's injected URL
(<code>services__workers-api__http__0</code>). It is the config seam behind Service→plugin-API job
discovery.
{{ /comp }}

{{ comp callout { type: "caution", title: "The {id} path segment is authoritative" } }}
<code>triggerJob</code> / <code>triggerTask</code> resolve the target id from
<code>input.id</code>. On the REST route (<code>POST /jobs/{id}/trigger</code>) oRPC merges the
<code>{id}</code> URL path segment into <code>input.id</code>, so the path is authoritative and a
body <code>id</code> is a redundant fallback that can never disagree with it; on the RPC transport
there is no path segment, so the <code>id</code> you pass in the input object is used directly. If
neither resolves an id, the handler short-circuits to a typed <code>VALIDATION_ERROR</code>
(HTTP&nbsp;422) through the centralized <code>validationFailed</code> contract helper <em>before any
KV write</em> — it never persists an <code>undefined</code>-keyed run. Handle it as the contract's
typed error on the client, not a generic <code>500</code>.
{{ /comp }}

## Graceful shutdown

Background runners must drain in flight work before they exit, or a redeploy loses jobs
mid-run. The `@netscript/plugin-workers-core/shutdown` subpath provides a `ShutdownManager`
that registers stoppable resources and stops them in priority order, with a timeout, when a
shutdown is requested.

```ts
// plugins/workers/bin/with-shutdown.ts
import { ShutdownManager } from '@netscript/plugin-workers-core/shutdown';
import { startWorkers } from '@netscript/plugin-workers-core';

const runtime = await startWorkers({ autoStart: true });
const shutdown = new ShutdownManager({ timeoutMs: 10_000 });

// Register the runtime so a drain stops it gracefully (lower priority stops first).
shutdown.register({ id: 'workers-runtime', priority: 100, stop: (reason) => runtime.stop(reason) });

// Tie OS signals to the drain, then report what stopped / failed / timed out.
Deno.addSignalListener('SIGTERM', async () => {
  const report = await shutdown.shutdown('SIGTERM');
  console.info('shutdown', report.state, { stopped: report.stopped, timedOut: report.timedOut });
  Deno.exit(0);
});
```

{{ comp.apiTable({
  caption: "ShutdownManager — @netscript/plugin-workers-core/shutdown",
  rows: [
    { name: "register(resource)", type: "void", desc: "Register a ShutdownResource ({ id, stop(reason?), priority? }) to be stopped on drain." },
    { name: "unregister(id)", type: "void", desc: "Remove a resource from the drain set." },
    { name: "shutdown(reason?, { timeoutMs })", type: "Promise<ShutdownReport>", desc: "Stop registered resources in priority order; returns { state, stopped, failed, timedOut }." },
    { name: "waitForShutdown()", type: "Promise<void>", desc: "Resolves once shutdown has started — await it in long-running loops." },
    { name: "createAbortController()", type: "AbortController", desc: "An AbortController that aborts when shutdown begins; pass its signal into in-flight async work." },
    { name: "state", type: "'running' | 'shutting-down' | 'stopped'", desc: "Current lifecycle state of the manager." }
  ]
}) }}

## Workers API & where jobs come from

Once Aspire is up and the schema is wired, the workers API on **`:8091`** registers your job
by `id` and exposes HTTP endpoints to seed, trigger, and inspect runs. These are the
endpoints the CLI E2E suite validates live.

{{ comp.apiTable({
  caption: "Workers API — port 8091 (full generated surface in the workers reference)",
  rows: [
    { name: "GET /health", type: "liveness", desc: "Health probe for the workers API service." },
    { name: "GET /api/v1/workers/jobs", type: "list", desc: "All registered job definitions (id, name, topic) discovered from the jobs directories." },
    { name: "POST /api/v1/workers/jobs/{id}/trigger", type: "enqueue", desc: "Enqueue a run of the job with this id, passing a JSON payload body." },
    { name: "GET /api/v1/workers/executions?limit=10", type: "history", desc: "Recent executions and outcomes (KV-backed execution state)." },
    { name: "GET /api/v1/workers/tasks", type: "list", desc: "Task registry view (polyglot defineTask entries)." },
    { name: "POST /api/v1/workers/seed", type: "seed", desc: "Seed the workers store with the registered jobs." },
    { name: "GET /api/v1/workers/subscribe", type: "SSE", desc: "Server-sent-events stream of execution updates (KV-watch)." }
  ]
}) }}

{{ comp callout { type: "note", title: "Where jobs come from" } }}
Each handler file under your jobs directory (<code>workers/jobs</code> by default,
<code>*.ts</code>) is discovered and compiled into one generated registry at
<code>.netscript/generated/plugin-workers/job-registry.ts</code>, keyed by the source filename —
so <code>workers/jobs/process-payment.ts</code> registers as <code>process-payment</code>. Both
the <code>:8091</code> API service <em>and</em> the background runner load that single registry at
startup: the API service registers the generated user job definitions <em>before it serves</em>,
so your jobs — not just the built-in <code>workers-plugin-health-check</code> — appear in
<code>GET /api/v1/workers/jobs</code> and resolve on trigger. Registration order decides id
collisions: the plugin's own jobs register first, then the generated user definitions load and
<em>skip any id already present</em>, so a user file that reuses a built-in id (such as
<code>workers-plugin-health-check</code>) leaves the plugin job in place rather than overwriting it —
first registration wins. Background execution runs from
<code>plugins/workers/bin/combined.ts</code>, a <em>separate</em> process from the API service —
the API enqueues, the runner executes. A missing generated registry is tolerated as an empty set,
so a fresh workspace boots before you author any job. Set <code>WORKERS_CONCURRENCY</code> on the
worker background process when you need a specific process pool size. Current Aspire metadata also
emits <code>WORKER_CONCURRENCY</code>, but the runtime entrypoint does not consume it; use
<a href="/how-to/tune-worker-runtime/">Tune the worker runtime</a> for the mismatch details.
{{ /comp }}

## Observability: real job traces out of the box

Job-level observability is **not** a stub. The workers runtime instruments the
scheduler → queue → worker → subprocess path with real OpenTelemetry spans, and those traces
appear in the [Aspire dashboard](/explanation/aspire/) automatically once Aspire is up.

{{ comp.apiTable({
  caption: "What the worker runtime traces automatically (framework layer — real today)",
  rows: [
    { name: "Job dispatch + execution", type: "span", desc: "Each enqueued run gets a span with attributes, duration, status, and job.started / job.completed / job.failed / job.exception events." },
    { name: "Step + progress events", type: "event", desc: "job.step.* and job.progress (current / total / percentage) events are emitted on real job runs." },
    { name: "Subprocess trace continuation", type: "context", desc: "W3C traceparent / tracestate is propagated into the subprocess runner, so the child trace links back to the dispatching span." },
    { name: "Scheduler + cron spans", type: "span", desc: "Scheduler-start, schedule-job, dispatch, and cron-run spans cover the timer/cron path that fires scheduled jobs." }
  ]
}) }}

For spans you author *inside* a handler, import directly from **`@netscript/telemetry`**
(e.g. `@netscript/telemetry/instrumentation` for `withChildSpan`). These nest correctly under
the automatic dispatch span. See [Observability](/explanation/observability/) for the model and
[Add OpenTelemetry](/how-to/add-opentelemetry/) for the recipe.

## How it compares

Trigger.dev is a managed platform for background jobs and agent workflows; Temporal is a
durable-execution system you self-host or rent as Temporal Cloud; NetScript's worker
runtime is a plugin that lives inside your own repository and process tree. Each model
carries a real tradeoff — a managed platform removes operations, a replay-based cluster
gives the strongest durability guarantees, a local-first plugin keeps everything in code
you own. The rows below are structural facts drawn from each project's public
documentation (as of mid-2026), not rankings.

| | NetScript workers | Trigger.dev | Temporal |
|---|---|---|---|
| Handler code | Plain async TypeScript (`defineJobHandler`); failed runs are retried, never replayed | TypeScript tasks in your repo, executed by the platform | Workflow code replayed from event history; side effects live in activities |
| Determinism constraint on orchestration code | None — handlers may call `Date.now()`, `Math.random()`, and do direct I/O | Not required | Required in workflow code: no `Date.now()`, `Math.random()`, or direct I/O |
| Where handlers execute | Your own processes: in-process, web-worker, or subprocess runner | Managed cloud; self-hosting via Docker Compose | Self-hosted cluster or Temporal Cloud |
| Backing stores | Pluggable queue (`deno-kv`, `redis`, `postgres`, `amqp`); Deno KV execution state; Postgres job definitions | Platform-managed | Database, Elasticsearch, server, and workers (self-hosted) |
| Control plane | None separate — the workers API is one of your services (`:8091`) | The Trigger.dev platform | The Temporal cluster |

The practical consequence of the first two rows: a NetScript job handler is ordinary
TypeScript with no replay-safety rules to learn, so code an agent writes for a service
moves into a worker unchanged — the isolation question is deferred to the runner mode
(the `WORKER_RUNTIMES` table above), a deployment setting rather than a handler concern.

## Production notes

{{ comp callout { type: "important", title: "Aspire first, then jobs" } }}
The workers plugin persists job definitions to Postgres and uses Deno KV for execution state,
so bring orchestration up before you exercise it. Step&nbsp;1 is the database service;
step&nbsp;2 is Aspire: <code>cd aspire &amp;&amp; aspire start</code> provisions Postgres and
Redis, then <code>netscript db init --name init</code> / <code>netscript db generate</code>
wire the schema. Only after Aspire is up will <code>:8091</code> resolve jobs and record
executions. See <a href="/how-to/database-migration/">Database &amp; migration</a>.
{{ /comp }}

{{ comp callout { type: "warning", title: "Drain on redeploy, or lose in-flight runs" } }}
A runner that exits without draining abandons jobs mid-execution. Wire a
<code>ShutdownManager</code> to <code>SIGTERM</code> (above), bound it with a
<code>timeoutMs</code>, and check <code>report.timedOut</code> in your logs. Pair the drain
with an <code>idempotencyKey</code> on enqueue so a retried delivery after a forced exit does
not double-charge. For the full recipe see
<a href="/how-to/tune-worker-runtime/">Tune the worker runtime</a>.
{{ /comp }}

{{ comp.badge({ status: "partial" }) }}

{{ comp callout { type: "note", title: "Deferred: the scaffold createJobTools helper is a no-op" } }}
The scaffold's <code>createJobTools(ctx)</code> helper (in
<code>plugins/workers/jobs/job-tools.ts</code>) exposes <code>log</code>,
<code>progress</code>, and <code>trace</code> shims — but in the generated copy its
<strong>progress and trace methods are no-op stubs</strong> (only <code>log</code> writes to
the console), and it is <em>not</em> a published <code>@netscript/plugin-workers-core</code>
export. This is a known, tracked limitation with a fix planned, not a permanent design choice,
and it is <em>only</em> in that scaffold-facing helper: job dispatch and execution themselves
emit real spans automatically (above). For custom handler spans today, call
<code>@netscript/telemetry</code> helpers directly. Do not say "worker tracing is a no-op" —
that is false for the framework layer.
<!-- caveat: arch-debt:workers-scaffold-job-tools-noop -->
{{ /comp }}

## Reference →

This hub is intentionally thin — the full generated API for `@netscript/plugin-workers`
(`defineJobHandler`, the job/task builders, the runtime, the shutdown manager, and every
exported type and subpath) lives in the reference.

{{ comp.xref({ key: "ref:workers" }) }}

{{ comp.featureGrid({ items: [
  {
    title: "Learn — ERP Sync, lesson 02",
    body: "Author an import job and trigger it over :8091 as part of the continuous ERP-sync tutorial narrative.",
    href: "/tutorials/erp-sync/02-import-job/",
    icon: "→"
  },
  {
    title: "Do — Tune the worker runtime",
    body: "Pick the runner mode, set WORKERS_CONCURRENCY, choose a queue provider, and wire graceful shutdown.",
    href: "/how-to/tune-worker-runtime/",
    icon: "◆"
  },
  {
    title: "Look up — workers reference",
    body: "The full generated deno doc API for @netscript/plugin-workers — every exported symbol, type, and subpath.",
    href: "/reference/workers/",
    icon: "≡"
  },
  {
    title: "Understand — Durability model",
    body: "How jobs compose with sagas: a job publishes a message a saga consumes. The why behind the choreography.",
    href: "/explanation/durability-model/",
    icon: "◎"
  }
] }) }}

{{ comp.nextPrev({
  prev: { label: "Services & contracts", href: "/services-sdk/services/" },
  next: { label: "Durable sagas", href: "/durable-workflows/sagas/" }
}) }}
