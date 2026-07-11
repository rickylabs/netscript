---
layout: layouts/base.vto
title: Add a queue and a cron schedule
templateEngine: [vento, md]
prev: { label: "3 · Polyglot transform", href: "/tutorials/erp-sync/03-polyglot-transform/" }
next: { label: "5 · Deploy", href: "/tutorials/erp-sync/05-deploy/" }
---

# Add a queue and a cron schedule

Your [import job](/tutorials/erp-sync/02-import-job/) runs one file at a time. A migration does
not: the day you backfill Dynamics with SAP's historical exports, twenty files land in the hand-off
folder at once, and until cutover the two systems only stay aligned if a full re-sync runs every
night whether or not a file arrived. This chapter adds the two pieces that make both durable: a
**queue provider** and a worker **concurrency** so bursts drain in parallel, and a **cron
schedule** that fires on a cadence rather than an event.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/erp-sync/01-scaffold/" },
  { label: "2 · Import job", href: "/tutorials/erp-sync/02-import-job/" },
  { label: "3 · Polyglot transform", href: "/tutorials/erp-sync/03-polyglot-transform/" },
  { label: "4 · Queue & cron", href: "/tutorials/erp-sync/04-queue-and-cron/" },
  { label: "5 · Deploy", href: "/tutorials/erp-sync/05-deploy/" }
] }) }}

## What you will build

By the end of this chapter your workers config will name a **queue provider** and a worker
**concurrency** so bursts of imports drain in parallel instead of one-by-one, and a new
**scheduled trigger** (`defineScheduledTrigger`) will enqueue a re-sync job on a cron cadence. You
will also know the one concurrency naming gotcha to set explicitly so it does not bite you under
Aspire.

## Before you begin

You need the `my-erp/` workspace from [Chapter 2](/tutorials/erp-sync/02-import-job/) with the
`import-products` job and `product-import-trigger` working, and `aspire start` healthy. Confirm the job
is registered:

```sh
curl 'http://localhost:8091/api/v1/workers/jobs'
```

Expected: `import-products` appears in the list. If not, return to Chapter 2 and re-run
`netscript generate plugins`.

## Step 1 — Choose a queue provider

A NetScript queue is provider-agnostic: the same job-enqueue path runs on the zero-config Deno KV
default on your laptop and on a real broker under Aspire, without touching your job code. The
`QueueProvider` enum has four selectable production backends, and auto-discovery picks one for you
when you do not pin one:

{{ comp.apiTable({ caption: "Queue providers (QueueProvider) in @netscript/queue", columns: ["Provider", "How you select it", "Reach for it when"], rows: [
  ["<code>deno-kv</code>", "Auto-discovery <strong>fallback</strong>, or pin <code>QueueProvider.DenoKv</code>", "Local dev and single-instance apps with no broker. Durable to the Deno KV store; needs <code>--unstable-kv</code>."],
  ["<code>redis</code>", "Auto-discovered when a Redis/Garnet connection is present; or pin <code>QueueProvider.Redis</code>", "High-throughput production with a Redis/Garnet resource already provisioned by Aspire."],
  ["<code>rabbitmq</code>", "Auto-discovered <strong>first</strong> when an AMQP broker is present; or pin <code>QueueProvider.RabbitMQ</code>", "Broker-grade routing and reliability; the top of the auto-discovery probe."],
  ["<code>postgres</code>", "<strong>Explicit only</strong> — pass <code>QueueProvider.Postgres</code>; never auto-discovered", "You already run Postgres and want the queue in the same transactional store. Row-claim via FOR UPDATE SKIP LOCKED."]
] }) }}

For the ERP sync, the right default is to let the environment decide: write provider-neutral config
and you get Deno KV locally, and the Aspire cache once it is up — `redis` by default, or `garnet` via `--cache-backend`. The auto-discovery probe order is
**RabbitMQ → Redis → Deno KV**.

{{ comp callout { type: "note", title: "PostgreSQL is the deliberate exception" } }}
Auto-discovery probes <strong>RabbitMQ → Redis → Deno KV only</strong>. It will <strong>never</strong>
fall through to PostgreSQL, even when a Postgres connection is present. The SQL-durable queue is
opt-in — you must pass <code>provider: QueueProvider.Postgres</code> or you will quietly land on the
Deno KV adapter. The full decision guide is in
<a href="/how-to/choose-a-queue-provider/">Choose a queue provider</a>.
{{ /comp }}

## Step 2 — Size worker concurrency in config

`concurrency` on the workers config is the size of the worker pool the runner spins up — each slot is
its own V8 isolate (~20–40 MB), so raising it buys parallelism at a memory cost. This is where a
burst of imports gets drained in parallel. Set it in the generated worker config:

```ts
// config/official-plugins/mod.ts
import { defineWorkers } from '@netscript/plugin-workers-core/config';

export const workers = defineWorkers({
  jobsDir: './workers/jobs',
  tasksDir: './workers/tasks',
  queueProvider: 'auto', // Deno KV locally; the Aspire cache once up (redis default, garnet alt).
  queueName: 'jobs',
  concurrency: 4, // pool size: 4 isolates → ~80–160 MB. Raise for throughput, lower to bound memory.
  enabled: true,
  groups: [],
});
```

{{ comp.apiTable({
  caption: "WorkersConfigData — the fields you set here (@netscript/plugin-workers-core/config)",
  rows: [
    { name: "concurrency", type: "number", desc: "Default worker pool size (V8 isolates running jobs in parallel). Schema default 2." },
    { name: "queueProvider", type: "'auto' | 'deno-kv' | 'redis' | 'postgres' | 'amqp'", desc: "Queue backend. 'auto' resolves one for you. Default 'auto'." },
    { name: "queueName", type: "string", desc: "Queue the runner consumes from. Default 'jobs'." },
    { name: "jobsDir / tasksDir", type: "string", desc: "Directories scanned for default-exported job and task modules." },
    { name: "groups", type: "WorkerGroupData[]", desc: "Per-topic worker groups, each with its own scaling.concurrency and retention." },
    { name: "enabled", type: "boolean", desc: "Whether workers run at all. Default true." }
  ]
}) }}

For per-topic control — a hot `imports` topic at concurrency 10 while a heavy `reports` topic stays
at 1 — use a `WorkerGroup` with its own `scaling: { mode, concurrency }`. The full per-topic and
runner-mode knobs are in [Tune the worker runtime](/how-to/tune-worker-runtime/).

{{ comp callout { type: "warning", title: "Set scaling.concurrency in config — the Aspire env var is silently ignored" } }}
There are <strong>two</strong> concurrency env names in play and they are <em>not</em> the same
variable. The worker entrypoint reads <code>WORKERS_CONCURRENCY</code> (note the <strong>S</strong>)
and defaults it to <code>1</code>. The Aspire contribution, however, declares and injects
<code>WORKER_CONCURRENCY</code> (no S). Under <code>aspire start</code> today the injected
<code>WORKER_CONCURRENCY</code> does <em>not</em> feed the entrypoint's <code>WORKERS_CONCURRENCY</code>
read, so the Aspire value is silently ignored and the process pool falls back to its default. Treat
the config-driven <code>concurrency</code> (and per-topic <code>scaling.concurrency</code>) above as
the durable control, and if you must override the pool by env, set <code>WORKERS_CONCURRENCY</code>
explicitly on the background resource. This naming seam is a known rough edge, tracked for a
framework-side fix.
{{ /comp }}

## Step 3 — Add a cron schedule

Some migration work is time-driven, not file-driven: the nightly full re-sync that keeps Dynamics
aligned with SAP until cutover, an hourly cleanup of stale staging files. That is a **scheduled trigger** —
`defineScheduledTrigger(handler, spec)` from
`@netscript/plugin-triggers-core/builders`. Like the file-watch trigger, its handler returns an array
of effects; here it enqueues a job on a cron cadence.

```ts
// plugins/triggers/scheduled-resync.ts
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
    { name: "timezone", type: "string", desc: "IANA timezone the cron is evaluated in. Set it explicitly — 'UTC' here — so the cadence is unambiguous." },
    { name: "description / tags", type: "string / string[]", desc: "Metadata for discovery and the dashboard." }
  ]
}) }}

{{ comp callout { type: "note", title: "Cron lives on the triggers axis" } }}
Scheduling is a triggers concern, not a workers concern — a scheduled trigger is just another way to
<code>enqueueJob</code>, alongside file-watch and webhooks. That keeps one durable path: every job
enters the workers runtime the same way, however it was kicked off. The scaffold's <code>--samples</code>
ship several <code>defineScheduledTrigger</code> examples under the triggers plugin to crib from.
{{ /comp }}

## Step 4 — Register the new trigger

The scheduled trigger has to be picked up by the triggers runtime. Regenerate the registries:

```sh
netscript generate plugins
```

Then restart `aspire start` (or let it hot-reload) so the triggers processor loads
`daily-resync-schedule`.

## Verify your progress

First confirm the config type-checks with the new concurrency and provider settings:

```sh
deno task check
```

Expected: a clean check. Then confirm the cron schedule registered — for a fast feedback loop you can
temporarily set its `cron` to `*/2 * * * *` (every two minutes), regenerate, restart Aspire, wait,
and read the executions feed:

```sh
curl 'http://localhost:8091/api/v1/workers/executions?limit=10'
```

Expected: an `import-products` execution appears on the cron cadence with no file dropped — the
schedule, not a file event, enqueued it. Set the cron back to `0 6 * * *` when you are done testing.

- [ ] `config/official-plugins/mod.ts` sets `concurrency` and `queueProvider`.
- [ ] `deno task check` is clean.
- [ ] `daily-resync-schedule` is registered (after `netscript generate plugins` + Aspire restart).
- [ ] A scheduled `import-products` execution appears on the cron cadence with no file dropped.
- [ ] You set `WORKERS_CONCURRENCY` explicitly (or rely on config `concurrency`) rather than the ignored Aspire `WORKER_CONCURRENCY`.

{{ comp callout { type: "important", title: "Make handlers idempotent before you scale concurrency" } }}
Raising <code>concurrency</code> means more jobs run at once, and every queue backend can redeliver a
message on retry. An idempotent import — keyed on the file's content hash or name — can re-run without
double-importing. Pair retries with an <code>idempotencyKey</code> on enqueue so a redelivery after a
restart does not duplicate rows. See <a href="/how-to/choose-a-queue-provider/">Choose a queue
provider</a> for each backend's delivery semantics.
{{ /comp }}

## What you built

A workers config that names a queue provider and a worker concurrency so a SAP backfill burst
drains in parallel, and a `defineScheduledTrigger` cron that enqueues the nightly re-sync — plus
the knowledge to set concurrency where it actually takes effect. The sync now absorbs bursts and
runs its recurring work unattended. The last chapter runs the whole thing under Aspire.

{{ comp.nextPrev({ prev: { label: "3 · Polyglot transform", href: "/tutorials/erp-sync/03-polyglot-transform/" }, next: { label: "5 · Deploy", href: "/tutorials/erp-sync/05-deploy/" } }) }}
