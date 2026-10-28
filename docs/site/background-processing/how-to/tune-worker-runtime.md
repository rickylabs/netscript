---
layout: layouts/base.vto
title: Tune the worker runtime
description: Trade throughput against isolation with concurrency, runner mode, per-task permissions, timeouts, and retries.
templateEngine: [vento, md]
order: 101
oldUrl: /how-to/tune-worker-runtime/
---

# Tune the worker runtime

This recipe tunes queue concurrency, per-topic scaling, task timeouts and retries, and the abort
cleanup budget without changing a job handler.

Jobs execute in-process in the background worker service. Concurrency overlaps asynchronous I/O; it
does not create Web Worker isolates or parallelize synchronous CPU work (see
[worker runtime modes](/background-processing/workers/#worker-runtime-modes-worker_runtimes)). The
settings live in `config/official-plugins/mod.ts` (`defineWorkers(...)`), in per-task runtime
config, or in an environment variable that the worker entrypoint reads. For handler authoring, see
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
> **Bound timeouts and retries together.** A task with `timeout: 300000` and `maxRetries: 3` can
> hold a worker slot for about 15&nbsp;minutes of wall time, and each retry first waits
> `retryDelay`. Under a saturated pool that is head-of-line blocking. Size `timeout` to the work,
> keep `maxRetries` small for slow tasks, and pair retries with an `idempotencyKey` on enqueue so a
> re-delivery after a forced restart does not charge twice. See
> [Choose a queue provider](/data-persistence/how-to/choose-a-queue-provider/) for delivery
> semantics.

## Next steps

Restrict what each Deno task can reach with
[Restrict worker task permissions](/background-processing/how-to/restrict-worker-task-permissions/).

- {{ comp.xref({ key: "howto:choose-a-queue-provider" }) }}
- {{ comp.xref({ key: "howto:run-a-polyglot-task" }) }}
- {{ comp.xref({ key: "ref:workers", text: "workers reference" }) }}

{{ comp.nextPrev({
  prev: { label: "Choose a queue provider", href: "/data-persistence/how-to/choose-a-queue-provider/" },
  next: { label: "Run a polyglot task", href: "/background-processing/how-to/run-a-polyglot-task/" }
}) }}
