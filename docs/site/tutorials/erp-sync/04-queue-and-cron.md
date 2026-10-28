---
layout: layouts/base.vto
title: Add a queue and a cron schedule
templateEngine: [vento, md]
prev: { label: "3 · Polyglot transform", href: "/tutorials/erp-sync/03-polyglot-transform/" }
next: { label: "5 · Deploy", href: "/tutorials/erp-sync/05-deploy/" }
---

# Add a queue and a cron schedule

This chapter prepares the sync for bursts and recurring work. Your
[import job](/tutorials/erp-sync/02-import-job/) runs one file at a time, but the day you backfill
Dynamics with SAP's historical exports, twenty files land in the hand-off folder at once. Until
cutover, the two systems also stay aligned only if a full re-sync runs every night, whether or not
a file arrived. You add a **queue provider** and a worker **concurrency** so I/O-bound bursts
overlap, and a **cron schedule** that fires on a cadence rather than an event.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/erp-sync/01-scaffold/" },
  { label: "2 · Import job", href: "/tutorials/erp-sync/02-import-job/" },
  { label: "3 · Polyglot transform", href: "/tutorials/erp-sync/03-polyglot-transform/" },
  { label: "4 · Queue & cron", href: "/tutorials/erp-sync/04-queue-and-cron/" },
  { label: "5 · Deploy", href: "/tutorials/erp-sync/05-deploy/" }
] }) }}

## What you will build

A workers config that names a **queue provider** and a worker **concurrency**, so I/O-bound
imports overlap instead of running one by one, and a **scheduled trigger**
(`defineScheduledTrigger`) that enqueues a re-sync job on a cron cadence. You also see where the
running concurrency comes from under Aspire.

## Before you begin

You need the `my-erp/` workspace from [chapter 2](/tutorials/erp-sync/02-import-job/) with the
`import-products` job and `product-import-trigger` working, and `aspire start` healthy. Confirm the
job is registered:

```sh
curl '<workers-endpoint>/api/v1/workers/jobs'
```

`import-products` should appear in the list. If it does not, return to chapter 2 and re-run
`netscript generate plugins`.

## Step 1 — Choose a queue provider

A NetScript queue is provider-agnostic: the same job-enqueue path runs on the zero-config Deno KV
default on your laptop and on a real broker under Aspire, with no change to your job code. The
`QueueProvider` enum has four selectable production backends, and auto-discovery picks one when you
do not pin one:

{{ comp.apiTable({ caption: "Queue providers (QueueProvider) in @netscript/queue", columns: ["Provider", "How you select it", "Reach for it when"], rows: [
  ["<code>deno-kv</code>", "Auto-discovery <strong>fallback</strong>, or pin <code>QueueProvider.DenoKv</code>", "Local dev and single-instance apps with no broker. Durable to the Deno KV store; needs <code>--unstable-kv</code>."],
  ["<code>redis</code>", "Auto-discovered when a Redis/Garnet connection is present; or pin <code>QueueProvider.Redis</code>", "High-throughput production with a Redis/Garnet resource already provisioned by Aspire."],
  ["<code>rabbitmq</code>", "Auto-discovered <strong>first</strong> when an AMQP broker is present; or pin <code>QueueProvider.RabbitMQ</code>", "Broker-grade routing and reliability; the top of the auto-discovery probe."],
  ["<code>postgres</code>", "<strong>Explicit only</strong> — pass <code>QueueProvider.Postgres</code>; never auto-discovered", "You already run Postgres and want the queue in the same transactional store. Row-claim via FOR UPDATE SKIP LOCKED."]
] }) }}

For the ERP sync, let the environment decide. Write provider-neutral config and you get Deno KV
locally, then the Aspire cache once it is up: `redis` by default, or `garnet` via
`--cache-backend`. The auto-discovery probe order is **RabbitMQ → Redis → Deno KV**.

{{ comp callout { type: "note", title: "PostgreSQL is the deliberate exception" } }}
Auto-discovery probes <strong>RabbitMQ → Redis → Deno KV only</strong>. It <strong>never</strong> falls through to PostgreSQL, even when a Postgres connection is present. The SQL-durable queue is opt-in: pass <code>provider: QueueProvider.Postgres</code>, or you silently get the Deno KV adapter. The full decision guide is <a href="/data-persistence/how-to/choose-a-queue-provider/">Choose a queue provider</a>.
{{ /comp }}

## Step 2 — Size worker concurrency in config

`concurrency` declares queue concurrency. Jobs execute in-process in the background worker and
share its event loop. Raising concurrency lets I/O-bound imports overlap; it does not allocate V8
isolates or speed up synchronous CPU-bound transformations. Set it in the generated worker config:

```ts
// config/official-plugins/mod.ts
import { defineWorkers } from '@netscript/plugin-workers-core/config';

export const workers = defineWorkers({
  jobsDir: './workers/jobs',
  tasksDir: './workers/tasks',
  queueProvider: 'auto', // Deno KV locally; the Aspire cache once up (redis default, garnet alt).
  queueName: 'jobs',
  concurrency: 4, // Queue concurrency: overlap up to 4 I/O-bound jobs; no CPU parallelism.
  enabled: true,
  groups: [],
});
```

{{ comp.apiTable({
  caption: "WorkersConfigData — the fields you set here (@netscript/plugin-workers-core/config)",
  rows: [
    { name: "concurrency", type: "number", desc: "Default queue concurrency for in-process jobs. Schema default 2; no isolate pool is allocated." },
    { name: "queueProvider", type: "'auto' | 'deno-kv' | 'redis' | 'postgres' | 'amqp'", desc: "Queue backend. 'auto' resolves one for you. Default 'auto'." },
    { name: "queueName", type: "string", desc: "Queue the runner consumes from. Default 'jobs'." },
    { name: "jobsDir / tasksDir", type: "string", desc: "Directories scanned for default-exported job and task modules." },
    { name: "groups", type: "WorkerGroupData[]", desc: "Per-topic worker groups, each with its own scaling.concurrency and retention." },
    { name: "enabled", type: "boolean", desc: "Whether workers run at all. Default true." }
  ]
}) }}

For per-topic control, such as a busy `imports` topic at concurrency 10 while a heavy `reports`
topic stays at 1, use a `WorkerGroup` with its own `scaling: { mode, concurrency }`.
[Tune the worker runtime](/background-processing/how-to/tune-worker-runtime/) covers the per-topic
and runner-mode settings.

`WORKERS_CONCURRENCY` sets the running queue concurrency. Aspire injects it on the workers
background resource with the plugin's declared default, so set it only to override that value.

{{ comp callout { type: "warning", title: "Make handlers idempotent before you scale concurrency" } }}
Raising <code>concurrency</code> runs more jobs at once, and every queue backend can redeliver a message on retry. An idempotent import, keyed on the file's content hash or name, can re-run without importing twice. Pair retries with an <code>idempotencyKey</code> on enqueue so a redelivery after a restart does not duplicate rows. <a href="/data-persistence/how-to/choose-a-queue-provider/">Choose a queue provider</a> lists each backend's delivery semantics.
{{ /comp }}

## Step 3 — Add a cron schedule

Some migration work runs on time, not on files: the nightly full re-sync that keeps Dynamics
aligned with SAP until cutover, or an hourly cleanup of stale staging files. That is a
**scheduled trigger**, `defineScheduledTrigger(handler, spec)` from
`@netscript/plugin-triggers-core/builders`. The `add-scheduled` verb, written as `add scheduled`,
can scaffold the job action already wired. `ns-triggers` and `ns-workers` are the plugin CLI
shorthands you installed in [chapter 2](/tutorials/erp-sync/02-import-job/).

```sh
ns-triggers add scheduled daily-resync-schedule \
  --cron="0 6 * * *" \
  --timezone=UTC \
  --job=import-products \
  --description="Runs a full product re-sync every morning." \
  --tags=resync,products,scheduled
```

The command writes `triggers/daily-resync-schedule-trigger.ts` and refreshes the trigger registry.
Like the file-watch trigger, its generated handler returns an array of effects; the `--job` flag
supplies the enqueue action, so you don't write the definition by hand:

```ts
// triggers/daily-resync-schedule-trigger.ts (generated excerpt)
import { defineScheduledTrigger, enqueueJob } from '@netscript/plugin-triggers-core/builders';
import type { JobDefinition } from '@netscript/plugin-workers-core';

const importProductsJob = {
  id: 'import-products' as JobDefinition<'import-products'>['id'],
  name: 'Import Products',
  topic: 'default',
  entrypoint: './workers/jobs/import-products.ts',
} satisfies JobDefinition<'import-products'>;

export const dailyResyncSchedule = defineScheduledTrigger(
  (event) => Promise.resolve([enqueueJob(importProductsJob, { payload: event.payload })]),
  {
    id: 'daily-resync-schedule',
    cron: '0 6 * * *', // every day at 06:00
    timezone: 'UTC',
    description: 'Runs a full product re-sync every morning.',
    tags: ['resync', 'products', 'scheduled'],
  },
);

export default dailyResyncSchedule;
```

{{ comp.apiTable({
  caption: "ScheduledTrigger spec — the fields that define the cadence",
  rows: [
    { name: "id", type: "string", desc: "Stable identifier for the schedule, used in logs and the events feed." },
    { name: "cron", type: "string", desc: "Standard 5-field cron expression. '0 6 * * *' = daily at 06:00; '*/5 * * * *' = every five minutes." },
    { name: "timezone", type: "string", desc: "IANA timezone the cron is evaluated in. Set it explicitly ('UTC' here) so the cadence is unambiguous." },
    { name: "description / tags", type: "string / string[]", desc: "Metadata for discovery and the dashboard." }
  ]
}) }}

{{ comp callout { type: "note", title: "Cron lives on the triggers axis" } }}
Scheduling is a triggers concern, not a workers concern. A scheduled trigger is another way to <code>enqueueJob</code>, alongside file-watch and webhooks, so every job enters the workers runtime the same way, however it was started. The <code>--samples</code> triggers include several <code>defineScheduledTrigger</code> examples to copy from.
{{ /comp }}

## Step 4 — Load the new trigger

The scaffold command already refreshed the registry. Restart `aspire start` (or let it hot-reload)
so the triggers processor loads `daily-resync-schedule`.

## Verify your progress

1. Confirm the config type-checks with the new concurrency and provider settings:

   ```sh
   deno task check
   ```

2. Confirm the cron schedule registered. For fast feedback, temporarily set its `cron` to
   `*/2 * * * *` (every two minutes), regenerate, restart Aspire, wait, and read the executions
   feed:

   ```sh
   ns-workers executions --limit=10 --json
   ```

   An `import-products` execution appears on the cron cadence with no file dropped: the schedule,
   not a file event, enqueued it.

3. Set the cron back to `0 6 * * *` when you are done testing.

- [ ] `config/official-plugins/mod.ts` sets `concurrency` and `queueProvider`.
- [ ] `deno task check` is clean.
- [ ] `daily-resync-schedule` is registered (after `netscript generate plugins` + Aspire restart).
- [ ] A scheduled `import-products` execution appears on the cron cadence with no file dropped.
- [ ] The workers background resource shows `WORKERS_CONCURRENCY` in the Aspire dashboard, and you changed it only to override the declared default.

## What you built

A workers config that names a queue provider and a worker concurrency, so a SAP backfill burst
drains with overlapping I/O, and a `defineScheduledTrigger` cron that enqueues the nightly
re-sync. The sync now absorbs bursts and runs its recurring work unattended. Next, you run the
whole pipeline under Aspire.
