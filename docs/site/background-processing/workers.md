---
layout: layouts/base.vto
title: Background jobs
templateEngine: [vento, md]
prev: { label: "Services & contracts", href: "/services-sdk/services/" }
next: { label: "Durable sagas", href: "/durable-workflows/sagas/" }
order: 1
---

# Background jobs

This page shows how to write a background job, enqueue it, observe it and run it safely in
production.

A **background job** is a TypeScript handler that runs in the background worker process, separate
from your request-serving services. You write one `defineJobHandler(...)` module and give it an
`id`. The worker runtime handles registration, dispatch, retry, execution tracking, scheduling,
tracing and an HTTP API to enqueue and inspect runs. Use a job for work that happens after a
request returns, such as charging a payment, sending a welcome email or processing an upload.

{{ comp.diagram({ src: "/assets/diagrams/queue-worker-scheduler.svg", alt: "An enqueue call (from a trigger, an HTTP POST to the workers API, or the scheduler) places a job on the durable queue; the worker runtime pulls it and runs the handler in-process with cooperative async concurrency — then writes a JobResult to the KV-backed execution store, which streams updates back over SSE.", caption: "Enqueue → durable queue → in-process job runner → result store. The scheduler fires cron-defined jobs onto the same queue; graceful shutdown drains in-flight runs before the runner stops." }) }}

## When to use a job

| Unit | Use it when |
| --- | --- |
| Background job | The work is TypeScript and deferrable. It must outlive the request, run on a schedule or trigger, and be retried and observed on its own. |
| [Polyglot task](/background-processing/polyglot-tasks/) | The work must run in another runtime: Python, .NET, a shell script or a binary. It shares the job queue, retry and telemetry, and runs as a subprocess. |
| [Durable saga](/durable-workflows/sagas/) | The work coordinates several steps over time, waits for messages or compensates on failure. Jobs and sagas compose. |
| [Service](/services-sdk/services/) | The caller needs a synchronous request/response API. |

[The durability model](/explanation/durability-model/) explains how jobs and sagas divide the work.

## Payloads and side effects

Two rules keep a job correct. Both come from a production incident-diagnosis assistant, where a job
runs a vision model over a pasted alert-email screenshot and extracts structured fields.

- **Carry references, not blobs.** The payload travels through the queue. The first version
  enqueued the raw image and hit Deno KV's 64&nbsp;KB enqueue limit. Enqueue a small reference, then
  fetch the bytes inside the handler through a typed service client.
- **Keep workers compute-only.** A handler receives a `ctx` and returns a `JobResult`; it never gets
  a database connection. Write results back through the owning service's typed client, so that
  service stays the single writer. In that app, the channel database held an exclusive OS file
  lock, and a second process opening it crashed.

## Minimal example

Install the workers plugin in your workspace:

```bash
netscript plugin install @netscript/plugin-workers
```

The plugin's API service listens on the port assigned at scaffold time, a stable port of 49152 or
higher. Find it in the console output, `appsettings.json` or the Aspire dashboard.

A job handler is an async function over a `ctx` that returns a `JobResult`. Parse the payload with a
Zod schema, do the work, and return `createSuccessResult(...)` or `createFailureResult(...)`. Attach
the job's id with `Object.assign(handler, { id })`.

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

With Aspire and the workers API running (see [Production notes](#production-notes)), enqueue a run
by `id` with the plugin CLI. `ns-workers` is a name you give that CLI; the scaffold does not create
it. Install it once:

```bash
deno install -gArf -n ns-workers jsr:@netscript/plugin-workers{{ releaseSpecifier }}/cli
```

Without the install, run each command as
`deno x -A jsr:@netscript/plugin-workers{{ releaseSpecifier }}/cli <verb …>`.

```bash
# Enqueue through the workers API (port 8091), without hand-writing HTTP.
ns-workers trigger process-payment \
  --payload='{"orderId":"o_42","amountCents":4999}'

# Watch it land in the KV-backed execution history.
ns-workers executions --limit=10 --json
```

## Handler context and result

A handler has the type `(ctx: JobHandlerContext<TPayload>) => JobResult<TResult> | Promise<…>`.

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
    { name: "error", type: "string", desc: "Failure message, required when success is false (the first argument to createFailureResult)." }
  ]
}) }}

## Worker runtime modes (`WORKER_RUNTIMES`)

Only in-process job execution is implemented. The background worker is a separate process from the
API service, but its job handlers share one isolate and event loop. `WORKER_RUNTIMES` and
`WorkerRuntime` keep this vocabulary for compatibility; they do not select a runner. Subprocess
execution exists for polyglot tasks only.

{{ comp.apiTable({
  caption: "WORKER_RUNTIMES — implemented and reserved job-runner vocabulary",
  rows: [
    { name: "in-process", type: "WorkerRuntime", desc: "Implemented: handlers share the background worker process and event loop; asynchronous I/O can overlap, synchronous CPU work cannot run in parallel." },
    { name: "web-worker", type: "WorkerRuntime", desc: "Reserved job-runner vocabulary; no Web Worker isolate pool is implemented." },
    { name: "subprocess", type: "WorkerRuntime", desc: "Reserved job-runner vocabulary. Subprocesses are implemented for task executors, not job handlers; Deno task permissions apply only to Deno tasks." }
  ]
}) }}

To size concurrency, scale topics or pick a queue provider, see
[Tune the worker runtime](/background-processing/how-to/tune-worker-runtime/).

## Enqueue from a trigger

A trigger handler can enqueue a job by returning an `enqueueJob(...)` action. `enqueueJob(job,
options)` from `@netscript/plugin-triggers-core` binds an imported job definition to a payload, so an
inbound webhook or a scheduled trigger puts work on the same runtime.

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

`ns-workers trigger` calls an OpenAPI route. Because the workers API is a plugin service, a
generated typed client reaches the same trigger over the RPC route `/api/rpc/*`. A first-party
plugin API mounts its router under a named segment, so the client takes a `routerName` as well as a
`serviceName`. Aspire injects the URL as `services__workers-api__http__0`.

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

A service that calls the workers API declares the dependency in its config section with
`pluginReferences?: string[]`, next to `dependsOn`. Aspire helper generation wires those
references, so the service discovers the jobs the plugin API exposes and the typed client resolves
`services__workers-api__http__0`.

> [!NOTE]
> On the REST route, oRPC merges the `{id}` path segment into `input.id`, so the path wins over a
> body `id`. Over RPC, pass `id` in the input object. With no id, the call fails with a typed
> `VALIDATION_ERROR` (HTTP&nbsp;422) before any KV write. Handle it as the contract's typed error,
> not as a generic `500`.

## Observe cancellation and deadlines

`ctx.signal` is an `AbortSignal` owned by the executor. With `InProcessJobRunner`, pass it to
abort-aware I/O such as `fetch`, call `ctx.signal.throwIfAborted()` at checkpoints in long loops,
and yield between chunks so cancellation can arrive. The worker owns this lifetime; no app or owner
session has to stay open.

`ctx.deadlineAt` is an optional deadline in epoch milliseconds. The in-process runner uses dispatch
time plus `job.timeout`, the caller-supplied `deadlineAt`, or the earlier of the two when both
exist. With neither configured, there is no deadline. Bound downstream work by the remaining time
instead of starting a full job timeout for each operation.

After an abort, `ctx.signal.reason.name` says why. The first abort cause is preserved.

| `reason.name` | Cause |
| --- | --- |
| `TimeoutError` | The deadline elapsed. |
| `ShutdownError` | The runner began stopping. |
| `AbortError` | The caller cancelled. |

An abort-aware handler releases resources in `finally` and propagates the abort instead of reporting
success. See [the cancellation reference](/reference/plugin-workers-core/#job-context-cancellation)
for the dispatch contract and
[runtime tuning](/background-processing/how-to/tune-worker-runtime/#abort-cleanup-budget) for the
cleanup budget.

### Operator cancellation limit

The Workers API runs router ships inspection operations only. No operator cancel operation reaches
the handler signal, so a stored `cancelled` status does not prove that a handler was aborted. In a
custom host that uses `InProcessJobRunner`, pass a caller `signal` to `dispatch` and abort its
controller to request cancellation. Closing a UI, disconnecting an HTTP request or deleting a job
definition does not cancel a running job. This contract is verified for the in-process runner only;
isolated or external task executors may not propagate it the same way.

## Graceful shutdown

A runner that exits without draining loses in-flight jobs on redeploy. `ShutdownManager`, from the
`@netscript/plugin-workers-core/shutdown` subpath, registers stoppable resources and stops them in
priority order, with a timeout, when shutdown starts.

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

## Workers API and job discovery

With Aspire up and the schema wired, the workers API service registers your jobs by `id` and serves
endpoints to seed, trigger and inspect runs.

{{ comp.apiTable({
  caption: "Workers API — port allocated per project; the workers reference has the full generated surface",
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

Each `*.ts` handler file in the jobs directory (`workers/jobs` by default) compiles into one
generated registry, `.netscript/generated/plugin-workers/job-registry.ts`, keyed by filename:
`workers/jobs/process-payment.ts` registers as `process-payment`. The API service and the
background runner both load this registry at startup. The API service registers the generated
definitions before it serves, so your jobs appear in `GET /api/v1/workers/jobs` next to the built-in
`workers-plugin-health-check` and resolve on trigger.

The plugin's own jobs register first, and the first registration wins: a user file that reuses a
built-in id such as `workers-plugin-health-check` is skipped. A missing registry counts as empty, so
a fresh workspace boots before you write a job.

The background runner, `plugins/workers/bin/combined.ts`, is a separate process from the API
service: the API enqueues and the runner executes. Aspire injects the runner's queue concurrency as
`WORKERS_CONCURRENCY`; [Tune the worker runtime](/background-processing/how-to/tune-worker-runtime/)
shows how to change it.

## Tracing

The workers runtime traces the scheduler → queue → worker → subprocess path with OpenTelemetry
spans. They appear in the [Aspire dashboard](/explanation/aspire/) once Aspire is up, with no
handler-side wiring.

{{ comp.apiTable({
  caption: "What the worker runtime traces automatically",
  rows: [
    { name: "Job dispatch + execution", type: "span", desc: "Each enqueued run gets a span with attributes, duration, status, and job.started / job.completed / job.failed / job.exception events." },
    { name: "Step + progress events", type: "event", desc: "job.step.* and job.progress (current / total / percentage) events are emitted on real job runs." },
    { name: "Subprocess trace continuation", type: "context", desc: "W3C traceparent / tracestate is propagated into the subprocess runner, so the child trace links back to the dispatching span." },
    { name: "Scheduler + cron spans", type: "span", desc: "Scheduler-start, schedule-job, dispatch, and cron-run spans cover the timer/cron path that fires scheduled jobs." }
  ]
}) }}

For spans inside a handler, import from `@netscript/telemetry`, for example `withChildSpan` from
`@netscript/telemetry/instrumentation`. These spans nest under the dispatch span. The scaffold's
`createJobTools(ctx)` helper comes from `@netscript/plugin-workers-core`: its trace helpers add
events and child spans under the active job span, progress emits telemetry and forwards to the
runtime channel, and the `log.*` helpers write to the console. See
[Observability](/explanation/observability/) for the model and
[Add OpenTelemetry](/observability/how-to/add-opentelemetry/) for the recipe.

## How it compares

Trigger.dev is a managed platform for background jobs and agent workflows. Temporal is a
durable-execution system you self-host or rent as Temporal Cloud. NetScript's worker runtime is a
plugin inside your own repository and process tree. The rows are structural facts from each
project's public documentation (as of mid-2026), not rankings.

| | NetScript workers | Trigger.dev | Temporal |
|---|---|---|---|
| Handler code | Plain async TypeScript (`defineJobHandler`); failed runs are retried, never replayed | TypeScript tasks in your repo, executed by the platform | Workflow code replayed from event history; side effects live in activities |
| Determinism constraint on orchestration code | None — handlers may call `Date.now()`, `Math.random()`, and do direct I/O | Not required | Required in workflow code: no `Date.now()`, `Math.random()`, or direct I/O |
| Where handlers execute | Your background worker process: in-process jobs; subprocess task executors | Managed cloud; self-hosting via Docker Compose | Self-hosted cluster or Temporal Cloud |
| Backing stores | Pluggable queue (`deno-kv`, `redis`, `postgres`, `amqp`); Deno KV execution state; Postgres job definitions | Platform-managed | Database, Elasticsearch, server, and workers (self-hosted) |
| Control plane | None separate — the workers API is one of your services (running on its scaffold-assigned port) | The Trigger.dev platform | The Temporal cluster |

A NetScript job handler is ordinary TypeScript with no replay-safety rules, so code written for a
service moves into a worker unchanged.

## Production notes

> [!IMPORTANT]
> **Start Aspire before you run jobs.** The workers plugin stores job definitions in Postgres and
> execution state in Deno KV. Run `cd aspire && aspire start` to provision Postgres and Redis, then
> `netscript db init --name init` and `netscript db generate` to wire the schema. Until then, the
> workers API cannot resolve jobs or record executions. See
> [Database & migration](/data-persistence/how-to/database-migration/).

> [!WARNING]
> **Drain on redeploy.** A runner that exits without draining abandons running jobs. Wire a
> `ShutdownManager` to `SIGTERM` (see [Graceful shutdown](#graceful-shutdown)), bound it with
> `timeoutMs`, and log `report.timedOut`. Add an `idempotencyKey` on enqueue so a retried delivery
> after a forced exit does not charge twice.

## Next steps

Build and trigger a job inside a running app in [ERP Sync, lesson 02](/tutorials/erp-sync/02-import-job/).

- [Tune the worker runtime](/background-processing/how-to/tune-worker-runtime/): concurrency,
  per-topic scaling, timeouts and retries.
- [Polyglot tasks](/background-processing/polyglot-tasks/): run Python, .NET or shell steps on the
  same queue.
- {{ comp.xref({ key: "ref:workers", text: "workers reference" }) }}: every exported symbol, type
  and subpath.

{{ comp.nextPrev({
  prev: { label: "Services & contracts", href: "/services-sdk/services/" },
  next: { label: "Durable sagas", href: "/durable-workflows/sagas/" }
}) }}
