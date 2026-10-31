---
layout: layouts/base.vto
title: Tune the worker runtime
description: Set concurrency, handler retry and backoff, job dead letters, task permissions, timeouts, and cleanup budgets.
templateEngine: [vento, md]
order: 101
oldUrl: /how-to/tune-worker-runtime/
---

# Tune the worker runtime

This recipe tunes queue concurrency, per-topic scaling, job retry and dead-letter behavior, task
timeouts and permissions, and the abort cleanup budget. Declare each job's retry policy beside its
handler so discovery and the generated registry carry the same policy into execution.

Jobs execute in-process in the background worker service. Concurrency overlaps asynchronous I/O; it
does not create Web Worker isolates or parallelize synchronous CPU work. Other runner modes are
reserved; only `in-process` is implemented (see
[worker runtime modes](/background-processing/workers/#worker-runtime-modes-worker_runtimes)). The
settings live beside job handlers, in `config/official-plugins/mod.ts` (`defineWorkers(...)`), in
per-task runtime config, or in an environment variable that the worker entrypoint reads. For handler authoring, see
[Background jobs](/background-processing/workers/).

## Prerequisites

- The workers plugin, installed with `netscript plugin install @netscript/plugin-workers`. For local
  contributor samples, use
  `deno run -A packages/cli/bin/netscript-dev.ts plugin install worker --name workers --samples`.
  The workers API service, on its assigned port, enqueues; a separate background process executes.
- `config/official-plugins/mod.ts`, the generated `defineWorkers(...)` block where concurrency,
  `queueProvider` and per-topic scaling live.
- `@netscript/plugin-workers-core/config`, which exports `defineWorkers`, `defineJobs` and the
  `WorkersConfig`, `ScalingConfig` and `TaskConfig` types.
- For live runs, Aspire (`cd aspire && aspire start`). The background runner needs Postgres and KV,
  and Aspire injects the worker environment variables.
- For Step 3, the `ns-workers` CLI. It is a name you give the workers plugin's CLI; the scaffold does
  not create it. Install it once:

```bash
deno install -gArf -n ns-workers jsr:@netscript/plugin-workers{{ releaseSpecifier }}/cli
```

Without the install, run each command as
`deno x -A jsr:@netscript/plugin-workers{{ releaseSpecifier }}/cli <verb …>`.

## Step 1 — Set the default concurrency

`concurrency` on the workers config declares queue concurrency (schema default `2`). Handlers share
the background worker's isolate, so no isolate is allocated per slot. Raise concurrency for
I/O-bound work, then measure throughput and memory under load.

{{ comp.apiTable({
  caption: "WorkersConfigData — top-level worker config (@netscript/plugin-workers-core/config)",
  rows: [
    { name: "concurrency", type: "number", desc: "Default queue concurrency for in-process jobs. Schema default 2; no isolate pool is allocated." },
    { name: "queueProvider", type: "'auto' | 'deno-kv' | 'redis' | 'postgres' | 'amqp'", desc: "Queue backend. 'auto' resolves one for you. Default 'auto'." },
    { name: "queueName", type: "string", desc: "Queue the runner consumes from. Default 'jobs'." },
    { name: "jobsDir / tasksDir", type: "string", desc: "Directories scanned for default-exported job and task modules. Defaults ./workers/jobs and ./workers/tasks." },
    { name: "groups", type: "WorkerGroupData[]", desc: "Per-topic worker groups, each with its own scaling and retention (Step 2)." },
    { name: "enabled", type: "boolean", desc: "Whether workers run at all. Default true." }
  ]
}) }}

```ts
// config/official-plugins/mod.ts
import { defineWorkers } from '@netscript/plugin-workers-core/config';

export const workers = defineWorkers({
  jobsDir: './workers/jobs',
  tasksDir: './workers/tasks',
  queueProvider: 'auto',
  queueName: 'jobs',
  concurrency: 4, // Queue concurrency: overlap up to 4 I/O-bound jobs; no CPU parallelism.
  enabled: true,
  groups: [],
});
```

## Step 2 — Scale per topic

A `WorkerGroup` binds a queue `topic` to its own `scaling` policy, so a hot `webhooks` topic can run
at concurrency 10 while a heavy `reports` topic stays at 1. `mode` decides whether the worker and the
scheduler share one runner (`combined`) or run as separate processes (`distributed`).

{{ comp.apiTable({
  caption: "ScalingConfigData — per-topic scaling (WorkerGroupData.scaling)",
  rows: [
    { name: "concurrency", type: "number", desc: "Max concurrent workers for this topic. Minimum 1, schema default 2." },
    { name: "mode", type: "'combined' | 'distributed'", desc: "Runner deployment: one combined runner vs. distributed runners. Default 'combined'." }
  ]
}) }}

{{ comp.apiTable({
  caption: "TopicRetentionConfigData — per-topic execution retention (WorkerGroupData.retention)",
  rows: [
    { name: "kvDays", type: "number", desc: "Days execution history stays in KV. Minimum 1, schema default 7." },
    { name: "dbDays", type: "number", desc: "Days execution history stays in the database. Minimum 1, schema default 90." }
  ]
}) }}

```ts
// config/official-plugins/mod.ts
import { defineWorkers } from '@netscript/plugin-workers-core/config';

export const workers = defineWorkers({
  jobsDir: './workers/jobs',
  tasksDir: './workers/tasks',
  queueProvider: 'auto',
  queueName: 'jobs',
  concurrency: 2,
  enabled: true,
  groups: [
    {
      topic: 'webhooks',
      scaling: { mode: 'combined', concurrency: 10 }, // burst-tolerant ingest
      retention: { kvDays: 7, dbDays: 90 },
      jobs: [
        {
          id: 'process-webhook-payload',
          name: 'Process Webhook Payload',
          entrypoint: './process-webhook-payload.ts',
          timeout: 30_000,
          maxRetries: 3,
          tags: ['webhook'],
        },
      ],
    },
  ],
});
```

## Declare job retry and dead-letter behavior with the handler

Attach `retry` to the schema-backed handler in the discovered job file. Both registry generators
preserve the declaration. The generated registry validates it when loaded, before registering the
job. The same retry executor applies
to in-process Deno jobs and jobs delegated to a polyglot runtime.

```ts
// workers/jobs/send-email.ts
import { defineJobHandler } from '@netscript/plugin-workers-core';
import { z } from 'zod';

declare const mailer: { send(to: string, signal: AbortSignal): Promise<void> };

export default Object.assign(
  defineJobHandler(z.object({ to: z.string().email() }), async ({ payload, signal }) => {
    await mailer.send(payload.to, signal);
    return { success: true };
  }),
  {
    id: 'send-email',
    retry: { maxRetries: 2, backoff: 'exponential' as const, delayMs: 1000, maxDelayMs: 30_000 },
  },
);
```

`maxRetries` counts **additional attempts**: this example runs once, waits 1,000 ms after its first
failure, then waits 2,000 ms after its second failure, for at most three attempts. With
`maxRetries: 0`, the handler still executes once; a failure goes straight to the job dead-letter
store. Thrown errors and `{ success: false, error: '...' }` results both consume the retry budget.

| Handler retry field | Meaning |
| --- | --- |
| `maxRetries` | Integer from 0 to 100; default 3 additional attempts. |
| `delayMs` | Base delay in milliseconds; defaults to the definition's `retryDelay`, then 1,000 ms. |
| `backoff` | `fixed` (default), `linear`, or `exponential`. |
| `maxDelayMs` | Ceiling on each wait; default 300,000 ms, raised to the base delay if needed. Must be at least `delayMs`. |

For retry number `n` starting at one, fixed backoff waits `delayMs`, linear backoff waits
`n * delayMs`, and exponential backoff waits `2 ** (n - 1) * delayMs`. Every wait is capped at
`maxDelayMs`. Delays must be finite, nonnegative safe integers. Invalid declarations fail validation
instead of being silently ignored.

Each field resolves in this order: **handler `retry` → builder `metadata.retry` → definition
`maxRetries` / `retryDelay` → defaults**. A handler field wins even over an explicitly configured
group field. Group-versus-flat job configuration keeps its existing whole-group precedence. This
also means a group entry that omits retry settings cannot hide the handler policy behind schema
defaults. A definition authored with the builder can use the same policy:

```ts
import { defineJob } from '@netscript/plugin-workers-core';
import { z } from 'zod';

export const sendEmail = defineJob('send-email')
  .payload(z.object({ to: z.string().email() }))
  .entrypoint('./send-email.ts')
  .retry(2, { backoff: 'exponential', delayMs: 1000, maxDelayMs: 30_000 })
  .build();
```

### Inspect and replay exhausted jobs

Every job has terminal dead-letter handling by default; no additional handler flag is needed. The
worker awaits the durable write after the final allowed attempt and only then lets the queue
acknowledge the delivery. `Worker.deadLetters` uses `JobDeadLetterStorePort`, the queue's existing
`append`, `list`, `reprocess`, and `depth` contract specialized to `JobMessage`. Pass a replacement as
`WorkerOptions.deadLetters` when constructing a `Worker`; the default is `KvDeadLetterStore` under
the separate namespace `workers:job-dlq:<queue>`. This works independently of the queue provider.

A record keeps the original job message, message id, trace headers, enqueue/failure times, error,
and actual handler-attempt count in `deliveryCount`. Missing or disabled definitions have zero
handler attempts and reason `unroutable`. Queue-level poison-message storage remains separate.

```ts
import type { JobMessage, Worker } from '@netscript/plugin-workers/worker';
import type { MessageQueue } from '@netscript/queue';

declare const worker: Worker;
declare const jobs: MessageQueue<JobMessage>;

const failures = await worker.deadLetters.list({ limit: 25 });
const health = await worker.readHealthStatus();
console.log(failures.length, health.deadLetters);

// After correcting the cause, replay a bounded batch through the ordinary job queue.
await worker.deadLetters.reprocess((record) => jobs.enqueue(record.payload), { limit: 10 });
```

The background `/health` response includes `deadLetters: { available, depth }`. Depth is read from
durable storage for each request, including after replay or writes from another worker. A nonzero
depth reports failed work without making an otherwise ready worker unavailable. If the store cannot
be read, `available` is false, `depth` is null, dependency readiness is false, and health returns
HTTP 503. Records remain until successfully reprocessed; execution-history retention does not
remove them.

Timeout is terminal for either job runtime: it records `timeout` and writes a job dead letter after
that attempt instead of restarting potentially uncooperative work. Explicit user cancellation
records `cancelled` and acknowledges without a dead letter. Shutdown aborts an active attempt or
retry wait, releases the claim and requeues without a dead letter. A dead-letter write failure also
releases the claim and propagates to the queue for redelivery; it cannot acknowledge a missing
terminal record. Transport redelivery has its own budget and may run the handler again, so external
side effects must be idempotent.

## Step 3 — Set task runtime, timeout and retries

A polyglot task (`defineTask`, or a `TaskConfig` entry in `workers/runtime/`) runs as a spawned
process. `TaskConfig` holds its runtime, timeout, retry and permission settings.

{{ comp.apiTable({
  caption: "TaskConfig — runtime, timeout & retry knobs (@netscript/plugin-workers-core/config)",
  rows: [
    { name: "type", type: "'deno' | 'python' | 'dotnet' | 'cmd' | 'powershell' | 'shell' | 'executable'", desc: "Runtime that executes the task. Each maps to a runtime adapter. Default 'deno'." },
    { name: "timeout", type: "number", desc: "Execution timeout in ms. Schema default 300000 (5 min)." },
    { name: "maxRetries", type: "number", desc: "Max retry attempts. Schema default 1." },
    { name: "retryDelay", type: "number", desc: "Delay between retries in ms. Schema default 1000." },
    { name: "maxConcurrency", type: "number", desc: "Max concurrent runs of this one task. Schema default 1." },
    { name: "priority", type: "number", desc: "Dispatch priority 0–100. Schema default 50." },
    { name: "permissions", type: "WorkerConfigPermissions", desc: "Deno grants for the task. Omit on a 'deno' task and it runs with --allow-all." }
  ]
}) }}

Scaffold a new Deno task with the CLI, then tune the generated builder instead of writing the file by
hand. The `add-task` verb uses the spaced `add task` syntax:

```sh
ns-workers add task charge-customer --runtime=deno
```

For a non-Deno entrypoint, set its runtime and path, for example
`ns-workers add task sync-report --runtime=python --entrypoint=scripts/sync-report.py`.

Declare the task as a scoped builder, from a named preset, or as declarative runtime config:

{{ comp.tabbedCode({ tabs: [
  {
    label: "Scoped object",
    lang: "ts",
    code: "// workers/tasks/charge-customer.task.ts\nimport { defineTask } from '@netscript/plugin-workers-core';\n\n// Grant only what the task needs: outbound to Stripe, read its config, nothing else.\nexport default defineTask('charge-customer')\n  .runtime('deno')\n  .entrypoint('./charge-customer.ts')\n  .timeout(30_000)\n  .retry(3)\n  .permissions({ net: ['api.stripe.com'], read: ['./config'], env: ['STRIPE_KEY'] })\n  .build();"
  },
  {
    label: "Named preset",
    lang: "ts",
    code: "// workers/tasks/sync-report.task.ts\nimport { defineTask, permissions } from '@netscript/plugin-workers-core';\n\n// 'network' preset = net + env only; spread to tighten one field further.\nexport default defineTask('sync-report')\n  .runtime('deno')\n  .entrypoint('./sync-report.ts')\n  .timeout(120_000)\n  .permissions({ ...permissions.network, read: ['./data'] })\n  .build();"
  },
  {
    label: "Runtime config (JSON)",
    lang: "json",
    code: "// workers/runtime/tasks/v1.0.0.json — declarative, no rebuild\n{\n  \"version\": \"1.0.0\",\n  \"tasks\": [\n    {\n      \"id\": \"charge-customer\",\n      \"name\": \"Charge Customer\",\n      \"runtime\": \"deno\",\n      \"entrypoint\": \"./charge-customer.ts\",\n      \"timeout\": 30000,\n      \"maxRetries\": 3,\n      \"permissions\": { \"net\": [\"api.stripe.com\"], \"env\": [\"STRIPE_KEY\"] }\n    }\n  ]\n}"
  }
] }) }}

> [!NOTE]
> Jobs (`JobConfig`) and tasks (`TaskConfig`) have different schema defaults. A job defaults to
> `timeout: 60000` (60&nbsp;s) and `maxRetries: 3`; a task defaults to `timeout: 300000`
> (5&nbsp;min) and `maxRetries: 1`. Set both explicitly in production.

> [!CAUTION]
> A `deno` task with no `permissions` object runs with `--allow-all`: it can read the whole disk and
> reach any host. Set an explicit, path- and host-scoped `permissions` object or a tightened preset
> on every Deno task you ship.
> [Restrict worker task permissions](/background-processing/how-to/restrict-worker-task-permissions/)
> lists every field, the flag it emits and the presets.

## Step 4 — Override concurrency per process

The settings above configure definitions. The background entrypoint
(`plugins/workers/bin/combined.ts` or `worker.ts`) reads **`WORKERS_CONCURRENCY`** (default `1`) and
passes it as queue concurrency. The in-process runner ignores the legacy `poolSize` and `workerUrl`
options and allocates no isolate pool.

```bash
# Override the queue concurrency for the background worker process.
WORKERS_CONCURRENCY=8 deno run -A plugins/workers/bin/combined.ts
```

Under `aspire start` you do not set it by hand. The workers plugin's Aspire metadata injects
`WORKERS_CONCURRENCY` on the background resource with the plugin's declared default (`2`), and the
deploy-generated `.env` writes the same variable. To change it, edit the background processor's
`Concurrency` in `appsettings.json` and regenerate the AppHost helpers with
`netscript service generate`, or override `WORKERS_CONCURRENCY` in the environment.
[Runtime configuration](/orchestration-runtime/runtime-config/) covers the resolution order: schema
default, config file, environment, override.

## Listener recovery after store outages

A `Worker` supervises its jobs, tasks and queue-trigger listeners separately. The constructor's
`listenerMaxRestarts` defaults to **3 restart attempts per unhealthy burst**. A listener that runs
continuously without throwing for `listenerHealthyResetMs` (default **60,000 ms**) replenishes that
budget. Time spent waiting in restart backoff does not count as healthy running. The interval must
be a finite positive number; invalid values throw `RangeError` before the worker starts resources.

Restart delays grow exponentially from `listenerInitialBackoffMs` (default **100 ms**) to
`listenerMaxBackoffMs` (default **5,000 ms**). A healthy interval also returns the next restart to the
initial delay. For a custom host that should keep retrying store outages indefinitely, pass
`listenerMaxRestarts: Number.POSITIVE_INFINITY`; delays still stay capped and `worker.stop()` aborts
the listener and pending backoff. A finite budget still halts a persistently failing listener when
failures occur inside the healthy window.

These are `WorkerOptions` on `new Worker(...)` from `@netscript/plugin-workers/worker`; they are
not `defineWorkers` config fields or scaffold environment variables. A custom host can pass, for
example, `listenerHealthyResetMs: 120_000`, `listenerMaxRestarts: 5` and
`listenerMaxBackoffMs: 30_000` alongside its queue, registry and execution dependencies.

`worker.healthStatus.listeners` retains cumulative `restartCount` and reports the current burst's
`restartBudgetUsed`. The shared `childHealth.restartCount` also remains cumulative. HTTP child
health records a fixed, redacted failure category: store writes refused (including OOM, READONLY
and NOPERM), connection unavailable, or listener error. The listener snapshot's `failureCause`
retains that category after recovery as incident history. Exception messages, connection URLs and
stacks are not included in the HTTP payload. The legacy local listener `lastError` and the local
failure callback can still contain raw exception details; avoid publishing them as health payloads.
The CLI/Aspire health reader currently replaces incident messages with generic redacted text.

A separate shared crash-loop rule keeps HTTP health unhealthy after **3 restarts within a minute**
until a full minute of uninterrupted running completes. Shortening the restart-budget reset window
or choosing infinite retries does not bypass that health rule. A successful restart alone is not
proof that a restart storm has recovered.

## Abort cleanup budget

`InProcessJobRunner` accepts `abortGracePeriodMs` in its constructor options, with a default of
**1,000 ms**. After a timeout, a shutdown or a caller cancellation, the runner aborts the handler
signal immediately and waits up to this budget for handler and progress cleanup. If cleanup does not
settle, dispatch rejects with the abort reason. Returning success after an abort still rejects.

The budget bounds waiting; it cannot stop in-process JavaScript. A handler that ignores its signal
can keep causing side effects after dispatch rejects, and a blocking synchronous loop prevents
timers from firing. Use abort-aware I/O, yielding checkpoints and `finally` cleanup. The setting is
not a forced termination delay for a worker or subprocess, and it is not a top-level
`defineWorkers` field.

The shutdown manager's overall timeout is a separate host drain budget; size both within your
platform's shutdown window. See
[JobContext cancellation](/reference/plugin-workers-core/#job-context-cancellation) for `deadlineAt`
selection and reason names.

## Production notes

> [!WARNING]
> **Concurrency overlaps I/O, not synchronous CPU work.** All job handlers share the background
> worker's event loop. A synchronous CPU-bound handler blocks other jobs, queue listeners and health
> checks until it yields, and raising `WORKERS_CONCURRENCY` adds no CPU parallelism. Concurrent
> handlers still hold payloads and allocate memory, so measure under realistic load. Use a
> subprocess task executor for work that needs its own process.

> [!WARNING]
> **Bound timeouts and retries together.** A job with `timeout: 300000` and `maxRetries: 3` can
> hold a worker slot for about 20&nbsp;minutes plus retry waits when failures occur near each
> deadline. Budget `(maxRetries + 1) * timeout + sum(capped retry waits)`. For transports with a
> visibility timeout, keep that budget below the visibility lease and the active idempotency claim
> TTL. KV polling defaults to a 30-second visibility lease; worker active claims default to
> 15 minutes (`NETSCRIPT_WORKERS_IDEMPOTENCY_ACTIVE_TTL_MS`). Configure the transport and claim
> budgets for your workload; retries do not renew either lease. Size `timeout` to the work, keep
> `maxRetries` small for slow jobs, and use an `idempotencyKey` plus idempotent external effects
> when enqueueing. See
> [Choose a queue provider](/data-persistence/how-to/choose-a-queue-provider/) for delivery
> semantics.

## Next steps

Restrict what each Deno task can reach with
[Restrict worker task permissions](/background-processing/how-to/restrict-worker-task-permissions/).

- {{ comp.xref({ key: "howto:choose-a-queue-provider" }) }}
- {{ comp.xref({ key: "howto:run-a-polyglot-task" }) }}
- {{ comp.xref({ key: "ref:workers", text: "workers reference" }) }}
