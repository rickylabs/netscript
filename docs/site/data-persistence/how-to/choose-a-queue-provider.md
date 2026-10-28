---
layout: layouts/base.vto
title: Choose a queue provider
description: Pick a queue backend, then let auto-discovery select it or pin it explicitly.
templateEngine: [vento, md]
order: 104
oldUrl: /how-to/choose-a-queue-provider/
---

# Choose a queue provider

This recipe helps you pick a backend for `@netscript/queue` and select it, either through
auto-discovery or by pinning one with `provider` and `connection`. For the enqueue, consume and cron
mechanics, see [Queue / KV / cron](/data-persistence/how-to/queue-kv-cron/).

A NetScript queue is provider-agnostic: the same `createQueue("jobs")` call runs on an in-memory
adapter in a unit test, on Deno KV on your laptop and on a broker under Aspire. Only the backend the
factory resolves changes, never the call site.

## Prerequisites

{{ comp.apiTable({ caption: "Before you start", rows: [
  {
    name: "A NetScript workspace",
    type: "netscript init",
    desc: "Created per the Quickstart. Import @netscript/queue from any workspace member."
  },
  {
    name: "Start Aspire (for real backends)",
    type: "cd aspire && aspire start",
    desc: "Aspire provisions Postgres, Redis/Garnet, and any AMQP broker BEFORE your service connects. The in-memory and Deno KV adapters need nothing extra; Redis, RabbitMQ, and the Postgres queue all expect Aspire up first."
  },
  {
    name: "Deno KV unstable flag",
    type: "--unstable-kv",
    desc: "The Deno KV backend (the auto-discovery fallback) uses Deno KV. The scaffold's deno.json sets unstable: ['raw-imports', 'kv']; add --unstable-kv to any ad-hoc deno run/check that touches the queue."
  }
] }) }}

## The five backends at a glance

The `QueueProvider` enum names four selectable providers: Deno KV, Redis, RabbitMQ and PostgreSQL.
The `MemoryQueueAdapter` from `@netscript/queue/testing` covers tests and examples. Find the row
that matches your deployment, then follow its step.

{{ comp.apiTable({ caption: "Queue backends in @netscript/queue", columns: ["Backend", "How you select it", "Reach for it when"], rows: [
  ["<code>MemoryQueueAdapter</code>", "<code>new MemoryQueueAdapter()</code> from <code>@netscript/queue/testing</code> (never auto-discovered)", "Unit tests and isolated examples — volatile, in-process, zero setup; data is lost on restart."],
  ["Deno KV <code>(provider: 'deno-kv')</code>", "Auto-discovery <strong>fallback</strong>, or pin <code>QueueProvider.DenoKv</code>", "Local dev and single-instance apps with no broker; durable to the Deno KV store. Needs <code>--unstable-kv</code>."],
  ["Redis <code>(provider: 'redis')</code>", "Auto-discovered when a Redis/Garnet connection is present; or pin <code>QueueProvider.Redis</code>", "High-throughput production with a Redis/Garnet resource already provisioned by Aspire."],
  ["RabbitMQ <code>(provider: 'rabbitmq')</code>", "Auto-discovered <strong>first</strong> when an AMQP broker is present; or pin <code>QueueProvider.RabbitMQ</code>", "Broker-grade routing and reliability via Fedify's AMQP adapter; the top of the auto-discovery probe."],
  ["PostgreSQL <code>(provider: 'postgres')</code>", "<strong>Explicit only</strong> — pass <code>QueueProvider.Postgres</code>; never auto-discovered", "You already run Postgres and want one fewer moving part, or want the queue to share your transactional store. Row-claim via <code>FOR UPDATE SKIP LOCKED</code>."]
] }) }}

## Step 1 — Let auto-discovery pick

Pass no `provider` and the factory probes the Aspire environment, then selects the first available
backend in a fixed order. Write provider-neutral code and let the environment decide:

```ts
// queue.ts
import { createTypedQueue } from "@netscript/queue";
import { z } from "zod";

const JobSchema = z.object({ id: z.string(), kind: z.string() });

// No provider → auto-discovery. Probe order: RabbitMQ → Redis → Deno KV.
export const jobs = createTypedQueue("jobs", JobSchema);
```

The probe order is **RabbitMQ (AMQP) → Redis → Deno KV**. Deno KV is the always-available fallback
when no broker is discoverable, so the same code runs unchanged from laptop to production as you
provision real backends under Aspire.

> [!WARNING]
> Auto-discovery **never** selects PostgreSQL, even when a Postgres connection is present in the
> environment. Pass `provider: 'postgres'` (Step 3), or the queue quietly runs on the Deno KV
> adapter.

## Step 2 — Pin a provider explicitly

To take auto-discovery out of the loop, pass `provider` from the `QueueProvider` enum. Connection
details go under `connection.<provider>`; every URL is optional and falls back to Aspire service
discovery when omitted.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Redis",
    lang: "ts",
    code: "// queue.ts\nimport { createQueue, QueueProvider } from \"@netscript/queue\";\n\nconst jobs = createQueue(\"jobs\", {\n  provider: QueueProvider.Redis,\n  connection: {\n    redis: {\n      // url optional → falls back to getRedisConnectionFromEnv() / Aspire.\n      url: Deno.env.get(\"REDIS_URL\"),\n      // options are passed through to ioredis.\n      options: {},\n    },\n  },\n});"
  },
  {
    label: "RabbitMQ",
    lang: "ts",
    code: "// queue.ts\nimport { createQueue, QueueProvider } from \"@netscript/queue\";\n\nconst jobs = createQueue(\"jobs\", {\n  provider: QueueProvider.RabbitMQ,\n  connection: {\n    rabbitmq: {\n      // url optional → derived from Aspire's rabbitmq service (amqp://).\n      url: Deno.env.get(\"AMQP_URL\"),\n      // queueName defaults to the queue's logical name.\n      queueName: \"jobs\",\n    },\n  },\n});"
  },
  {
    label: "Deno KV",
    lang: "ts",
    code: "// queue.ts\nimport { createQueue, QueueProvider } from \"@netscript/queue\";\n\nconst jobs = createQueue(\"jobs\", {\n  provider: QueueProvider.DenoKv,\n  connection: {\n    denoKv: {\n      // path optional → Aspire discovery or the default shared Deno KV.\n      path: Deno.env.get(\"DENO_KV_URL\"),\n      verbose: false,\n    },\n  },\n});"
  }
] }) }}

> [!WARNING]
> **Upgrading from 0.0.7:** the RabbitMQ adapter now uses amqplib 2, and an explicit `heartbeat=0`
> in a connection URL disables heartbeats. To keep broker-negotiated heartbeats, remove that query
> parameter from `AMQP_URL` or `connection.rabbitmq.url`. URLs generated through Aspire omit it and
> keep negotiating with the broker. Keep `heartbeat=0` only when you mean to disable heartbeats; a
> positive value still requests an interval in seconds.

## Step 3 — Select the PostgreSQL backend

The PostgreSQL provider is a SQL-durable queue with row-claim semantics (`FOR UPDATE SKIP LOCKED`), a
visibility timeout, ack/nack and a dead-letter store, so concurrent consumers never double-claim a
message. Because auto-discovery never picks it, you must name it:

```ts
// queue.ts
import { createQueue, QueueProvider } from "@netscript/queue";

// provider: QueueProvider.Postgres is the ONLY way to select this backend.
const jobs = createQueue("jobs", {
  provider: QueueProvider.Postgres,
  connection: {
    postgres: {
      // url optional → falls back to Aspire's getPostgresUri().
      url: Deno.env.get("DATABASE_URL"),
      // tableName defaults to 'message_queue'.
      tableName: "message_queue",
    },
  },
});

await jobs.enqueue({ id: "job-1", kind: "reindex" });
```

Choose Postgres when you already run it under Aspire and want the queue and your application data in
one transactional store instead of a dedicated broker.

## Step 4 — Use the in-memory backend in tests

For unit tests and examples, construct the `MemoryQueueAdapter` from the testing sub-path. It is
volatile and in-process, needs nothing provisioned, and auto-discovery never selects it, so production
code paths stay untouched:

```ts
// jobs_test.ts
import { MemoryQueueAdapter } from "@netscript/queue/testing";

const queue = new MemoryQueueAdapter<{ id: string }>();

await queue.enqueue({ id: "job-1" });
await queue.listen(async (message) => {
  // assert on `message` here
});
```

## Step 5 — Add concurrency with createParallelQueue

`createParallelQueue` wraps any provider for concurrent processing. With a `concurrency` greater
than 1, one listener processes that many messages at once, which suits I/O-bound work such as HTTP
calls and database queries. At `concurrency: 1` (the default) it behaves like `createQueue`.

```ts
// queue.ts
import { createParallelQueue, QueueProvider } from "@netscript/queue";

// 8 messages processed concurrently on one listener, pinned to Redis.
const queue = createParallelQueue("notifications", {
  concurrency: 8,
  provider: QueueProvider.Redis,
});

await queue.listen(async (message) => {
  await deliver(message); // these run in parallel
});
```

For CPU-bound work, prefer Web Workers over queue concurrency; see
[Tune the worker runtime](/background-processing/how-to/tune-worker-runtime/).

## Step 6 — Run one file on two backends

To confirm the selection, run one provider-neutral file first on the Deno KV fallback and then on
Redis under Aspire. The file doesn't change between the runs:

```ts
// jobs.ts — the resulting file: provider-neutral producer + consumer
import { createTypedQueue } from '@netscript/queue';
import { z } from 'zod';

const JobSchema = z.object({ id: z.string(), kind: z.string() });

// No provider → auto-discovery. Probe order: RabbitMQ → Redis → Deno KV.
export const jobs = createTypedQueue('jobs', JobSchema);

if (import.meta.main) {
  await jobs.enqueue({ id: 'job-1', kind: 'reindex' });
  await jobs.listen(async (message) => {
    console.log('processed', message.id, message.kind);
  });
}
```

```bash
# From the workspace root, in order:

# 1. Local run — no Aspire, no broker. Auto-discovery falls through to Deno KV.
#    The scaffold's deno.json already sets unstable: ['raw-imports', 'kv'];
#    add --unstable-kv to any ad-hoc run that touches the queue.
deno run --unstable-kv -A jobs.ts
#    -> processed job-1 reindex   (on the Deno KV fallback)

# 2. Provision the real backend, then run the SAME file untouched.
cd aspire && aspire start && cd ..   # brings up Redis/Garnet
deno run --unstable-kv -A jobs.ts
#    -> processed job-1 reindex   (now auto-discovered onto Redis)
```

The call site (`createTypedQueue('jobs', JobSchema)`, `enqueue`, `listen`) is identical in both runs;
only the resolved backend changed. Pin a provider with `provider: QueueProvider.*` (Step 2) to take
auto-discovery out of the loop.

## Production notes

- **The local default is Deno KV, not a broker.** If you never start Aspire, auto-discovery lands on
  the Deno KV fallback. That is fine for development, but don't assume broker-grade ordering or
  fan-out until you have provisioned and confirmed the real backend.
- **Remote Deno KV (KV Connect) switches adapters.** A Deno KV path that is an `http(s)://` URL is
  treated as KV Connect, which has no native queue operations, so the factory swaps in a polling
  adapter. Tune it with `pollInterval`, `visibilityTimeout` and `maxRetries` under
  `connection.denoKv`. A local or SQLite KV path uses native queue operations; know which one you are
  on before tuning.

## Next steps

Enqueue and consume on the backend you chose with
{{ comp.xref({ key: "howto:queue-kv-cron" }) }}.

- {{ comp.xref({ key: "cap:kv-queues-cron" }) }}: the concept-level tour of queues, KV and cron.
- {{ comp.xref({ key: "cap:background-jobs" }) }}: a managed worker job (persistence, retries, an
  HTTP trigger) instead of a raw queue.
- {{ comp.xref({ key: "ref:queue" }) }}: the `QueueProvider` enum, `QueueConnectionOptions`,
  `ParallelQueueOptions`, the `MessageQueue` interface and the `QueueError` hierarchy.

{{ comp.nextPrev({ prev: { label: "Use a second database", href: "/data-persistence/how-to/use-a-second-database/" }, next: { label: "Tune the worker runtime", href: "/background-processing/how-to/tune-worker-runtime/" } }) }}
