---
layout: layouts/base.vto
title: Tune the worker runtime
templateEngine: [vento, md]
prev: { label: "Choose a queue provider", href: "/how-to/choose-a-queue-provider/" }
next: { label: "Run a polyglot task", href: "/how-to/run-a-polyglot-task/" }
---

# Tune the worker runtime

Trade throughput against isolation by tuning four real knobs — worker **concurrency**, the
**runner mode**, per-task **Deno permissions**, and **timeouts/retries** — without touching a
single job handler.

The same `process-payment` handler runs unchanged whether you give it one in-process slot or
ten subprocess-isolated workers. Everything below is a deployment setting: it lives in
`config/official-plugins/mod.ts` (`defineWorkers(...)`), in per-task runtime config, or in an
environment variable read by the worker entrypoint. See
[Background jobs](/capabilities/background-jobs/) for the handler-authoring side.

## Prerequisites

{{ comp.apiTable({
  caption: "What you need before tuning",
  rows: [
    { name: "workers plugin", type: "plugins/workers/", desc: "Public install: netscript plugin install @netscript/plugin-workers. Local contributor samples: deno run -A packages/cli/bin/netscript-dev.ts plugin install worker --name workers --samples. The :8091 API enqueues; a separate background process executes." },
    { name: "config/official-plugins/mod.ts", type: "defineWorkers(...)", desc: "The generated worker config block — where concurrency, queueProvider, and per-topic scaling live." },
    { name: "@netscript/plugin-workers-core/config", type: "import", desc: "defineWorkers, defineJobs, and the WorkersConfig / ScalingConfig / TaskConfig types." },
    { name: "Aspire up (for live runs)", type: "cd aspire && aspire start", desc: "The background runner needs Postgres + KV. Aspire injects the worker env vars; see Production pitfalls." }
  ]
}) }}

## Knob 1 — Default concurrency

`concurrency` on the workers config is the size of the Web Worker pool the runner spins up:
each slot is its own V8 isolate, so raising it buys parallelism at roughly 20–40 MB per
isolate. The schema default is `2`.

Show the type before the call site:

{{ comp.apiTable({
  caption: "WorkersConfigData — top-level worker config (@netscript/plugin-workers-core/config)",
  rows: [
    { name: "concurrency", type: "number", desc: "Default worker pool size (V8 isolates running jobs in parallel). Schema default 2." },
    { name: "queueProvider", type: "'auto' | 'deno-kv' | 'redis' | 'postgres' | 'amqp'", desc: "Queue backend. 'auto' resolves one for you. Default 'auto'." },
    { name: "queueName", type: "string", desc: "Queue the runner consumes from. Default 'jobs'." },
    { name: "jobsDir / tasksDir", type: "string", desc: "Directories scanned for default-exported job and task modules. Defaults ./workers/jobs and ./workers/tasks." },
    { name: "groups", type: "WorkerGroupData[]", desc: "Per-topic worker groups, each with its own scaling and retention (Knob 2)." },
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
  concurrency: 4, // pool size: 4 isolates → ~80-160 MB. Raise for throughput, lower to bound memory.
  enabled: true,
  groups: [],
});
```

## Knob 2 — Per-topic scaling (concurrency + mode)

Different topics deserve different parallelism. A `WorkerGroup` binds a queue `topic` to its
own `scaling` policy, so you can run a hot `webhooks` topic at concurrency 10 while a heavy
`reports` topic stays at 1. The `mode` selects whether the worker and scheduler share one
runner (`combined`) or run as separate processes (`distributed`).

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

## Knob 3 — The per-task Deno worker runtime & permissions

A **polyglot task** (`defineTask`, or a `TaskConfig` entry in `workers/runtime/`) runs as a
spawned process. For the `deno` runtime, the task's `permissions` object is compiled
**directly into the child `deno run` command's `--allow-*` flags** — a `deno` task with no
`permissions` set falls back to `--allow-all`, so set them deliberately. The shape mirrors
Deno's permission model: each field is `boolean` (grant/deny all) or a `string[]` allowlist.

{{ comp.apiTable({
  caption: "WorkerConfigPermissions — per-task Deno grants (compiled to --allow-* flags)",
  rows: [
    { name: "net", type: "boolean | string[]", desc: "Network access. true → --allow-net; ['api.stripe.com'] → --allow-net=api.stripe.com." },
    { name: "read", type: "boolean | string[]", desc: "Filesystem read. Pass a path allowlist to scope it." },
    { name: "write", type: "boolean | string[]", desc: "Filesystem write. Scope to an output dir in production." },
    { name: "env", type: "boolean | string[]", desc: "Environment variable access." },
    { name: "run", type: "boolean | string[]", desc: "Subprocess access (--allow-run). Needed when the task shells out." },
    { name: "ffi", type: "boolean", desc: "Foreign-interface access (--allow-ffi). Leave false unless a native binding is required." },
    { name: "import", type: "string[]", desc: "Allowed specifiers for dynamic imports (--allow-import=…)." }
  ]
}) }}

{{ comp.apiTable({
  caption: "TaskConfig — runtime, timeout & retry knobs (@netscript/plugin-workers-core/config)",
  rows: [
    { name: "type", type: "'deno' | 'python' | 'dotnet' | 'cmd' | 'powershell' | 'shell' | 'executable'", desc: "Runtime that executes the task. Each maps to a runtime adapter. Default 'deno'." },
    { name: "timeout", type: "number", desc: "Execution timeout in ms. Schema default 300000 (5 min)." },
    { name: "maxRetries", type: "number", desc: "Max retry attempts. Schema default 1." },
    { name: "retryDelay", type: "number", desc: "Delay between retries in ms. Schema default 1000." },
    { name: "maxConcurrency", type: "number", desc: "Max concurrent runs of this one task. Schema default 1." },
    { name: "priority", type: "number", desc: "Dispatch priority 0–100. Schema default 50." },
    { name: "permissions", type: "WorkerConfigPermissions", desc: "Deno grants for the task (above). Omit on a 'deno' task and it runs with --allow-all." }
  ]
}) }}

The framework also ships named presets so you do not hand-roll the object. `permissions` from
`@netscript/plugin-workers-core` exposes `minimal`, `none`, `network`, `filesystem`,
`readOnly`, `subprocess`, `full`, and `allAccess`.

Start a new Deno task from the CLI, then tune the generated builder instead of creating its file by
hand. The `add-task` verb uses the spaced `add task` shell syntax:

```sh
ns-workers add task charge-customer --runtime=deno
```

For a non-Deno entrypoint, choose its runtime and path explicitly, for example
`ns-workers add task sync-report --runtime=python --entrypoint=scripts/sync-report.py`.

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

{{ comp callout { type: "note", title: "Jobs have their own timeout/retry defaults" } }}
A <strong>job</strong> (<code>JobConfig</code>) and a <strong>task</strong>
(<code>TaskConfig</code>) carry the same permission shape but <em>different</em> schema
defaults: a job defaults to <code>timeout: 60000</code> (60s) and <code>maxRetries: 3</code>,
while a task defaults to <code>timeout: 300000</code> (5&nbsp;min) and <code>maxRetries: 1</code>.
Set both explicitly in production rather than relying on the default that happens to apply.
{{ /comp }}

## Knob 4 — Runner pool size at the process level

The numbers above configure *definitions*. The actual pool the background process spins up is
read from an environment variable when `plugins/workers/bin/combined.ts` (or `worker.ts`)
starts. That entrypoint reads **`WORKERS_CONCURRENCY`** (default `1`) and passes it to the
Web Worker pool.

```bash
# Override the running pool size for the background worker process.
WORKERS_CONCURRENCY=8 deno run -A plugins/workers/bin/combined.ts
```

{{ comp callout { type: "warning", title: "Two concurrency env vars — know which one wins" } }}
There are <strong>two</strong> concurrency env names in play and they are <em>not</em> the
same variable. The worker entrypoint (<code>plugins/workers/bin/runtime.ts</code>) reads
<code>WORKERS_CONCURRENCY</code> (note the <strong>S</strong>) and defaults it to
<code>1</code>. The Aspire contribution, however, declares and injects
<code>WORKER_CONCURRENCY</code> (no S, value <code>2</code>) via its
<code>concurrencyEnvVar</code>. Under <code>aspire start</code> today, the injected
<code>WORKER_CONCURRENCY</code> does <em>not</em> feed the entrypoint's
<code>WORKERS_CONCURRENCY</code> read, so the process pool falls back to its default. Set
<code>WORKERS_CONCURRENCY</code> explicitly on the background resource if you need a specific
pool size, and treat the per-topic <code>scaling.concurrency</code> in
<code>defineWorkers</code> as the durable, config-driven control. This naming seam is a known
rough edge.
{{ /comp }}

## Choosing a runner mode

How a handler is isolated is the `WORKER_RUNTIMES` tunable — three modes, same handler. The
scaffold default is the Web Worker isolate path (one V8 isolate per pool slot).

{{ comp.apiTable({
  caption: "WORKER_RUNTIMES — runner isolation modes (WorkerRuntime type)",
  rows: [
    { name: "in-process", type: "WorkerRuntime", desc: "Handler runs in the same process. Lowest overhead, no isolation. Best for tests, compiled single-binary deploys, single-tenant local composition." },
    { name: "web-worker", type: "WorkerRuntime", desc: "Each pool slot is its own Web Worker / V8 isolate (~20-40 MB). The scaffold default; pool size = concurrency. Keep it low to bound memory." },
    { name: "subprocess", type: "WorkerRuntime", desc: "Handler runs in a spawned subprocess. Strongest process isolation; only Deno tasks get permission sandboxing through .permissions(). Python, .NET, shell, PowerShell, and cmd inherit the worker process's OS permissions." }
  ]
}) }}

## In-production pitfalls

{{ comp callout { type: "important", title: "A 'deno' task with no permissions runs --allow-all" } }}
The Deno runtime adapter (<code>buildDenoPermissionFlags</code>) returns
<code>--allow-all</code> when a task's <code>permissions</code> object is absent. That is
convenient for local scaffolding and dangerous in production: an unpinned task can read your
whole disk and reach any host. Always set an explicit <code>permissions</code> object (or a
tightened preset) on every <code>deno</code> task you ship. Path-scope <code>read</code>/
<code>write</code> and host-scope <code>net</code> rather than passing bare <code>true</code>.
{{ /comp }}

{{ comp callout { type: "warning", title: "Concurrency is a memory multiplier" } }}
Each <code>web-worker</code> slot is a separate V8 isolate at roughly 20–40&nbsp;MB. A
<code>concurrency</code> of 20 is up to ~800&nbsp;MB of isolates before your jobs allocate a
byte. Raise concurrency to chase throughput, but profile memory under load and prefer
<strong>per-topic</strong> scaling so a hot topic does not starve the rest of the host. Drop
to <code>in-process</code> for tests and compiled single-binary deploys where isolation is not
worth the per-isolate cost.
{{ /comp }}

{{ comp callout { type: "warning", title: "Timeouts and retries interact — bound them together" } }}
A task with <code>timeout: 300000</code> and <code>maxRetries: 3</code> can occupy a worker
slot for up to ~15&nbsp;minutes of wall time before it gives up, and each retry waits
<code>retryDelay</code> first. Under a saturated pool that is real head-of-line blocking. Size
<code>timeout</code> to the work, keep <code>maxRetries</code> small for slow tasks, and pair
retries with an <code>idempotencyKey</code> on enqueue so a re-delivery after a forced restart
does not double-charge. See
<a href="/how-to/choose-a-queue-provider/">Choose a queue provider</a> for delivery semantics.
{{ /comp }}

## See also

{{ comp.xref({ key: "cap:background-jobs" }) }}

{{ comp.xref({ key: "cap:polyglot-tasks" }) }}

{{ comp.xref({ key: "howto:choose-a-queue-provider" }) }}

{{ comp.xref({ key: "howto:run-a-polyglot-task" }) }}

{{ comp.xref({ key: "ref:workers" }) }}

{{ comp.nextPrev({
  prev: { label: "Choose a queue provider", href: "/how-to/choose-a-queue-provider/" },
  next: { label: "Run a polyglot task", href: "/how-to/run-a-polyglot-task/" }
}) }}
