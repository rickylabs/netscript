---
layout: layouts/base.vto
title: Choose a queue provider
templateEngine: [vento, md]
prev: { label: "Use a second database", href: "/how-to/use-a-second-database/" }
next: { label: "Tune the worker runtime", href: "/how-to/tune-worker-runtime/" }
---

# Choose a queue provider

**Scope:** how to pick the right backend for `@netscript/queue` — the in-memory test
adapter, the zero-config Deno KV default, Redis, RabbitMQ (AMQP), and PostgreSQL — and how
to either let auto-discovery select one or pin one explicitly with `provider` +
`connection`. This is the *decision* recipe; for the enqueue/consume/cron mechanics see
[Queue / KV / cron](/how-to/queue-kv-cron/).

A NetScript queue is provider-agnostic by design: the same `createQueue("jobs")` runs on an
in-memory adapter in a unit test, on Deno KV on your laptop, and on a real broker under
Aspire — without touching the call site. The only thing that changes is which backend the
factory resolves. This recipe is about making that choice deliberately.

## Prerequisites

{{ comp.apiTable({ caption: "Before you start", rows: [
  {
    name: "A NetScript workspace",
    type: "netscript init",
    desc: "Created per the Quickstart. Import @netscript/queue from any workspace member."
  },
  {
    name: "aspire startning (for real backends)",
    type: "cd aspire && aspire start",
    desc: "Aspire provisions Postgres, Garnet/Redis, and any AMQP broker BEFORE your service connects. The in-memory and Deno KV adapters need nothing extra; Redis, RabbitMQ, and the Postgres queue all expect Aspire up first."
  },
  {
    name: "Deno KV unstable flag",
    type: "--unstable-kv",
    desc: "The Deno KV backend (the auto-discovery fallback) uses Deno KV. The scaffold's deno.json sets unstable: ['raw-imports', 'kv']; add --unstable-kv to any ad-hoc deno run/check that touches the queue."
  }
] }) }}

## The five backends at a glance

There are **four** selectable production providers in the `QueueProvider` enum — Deno KV,
Redis, RabbitMQ, and PostgreSQL — plus the `MemoryQueueAdapter` from
`@netscript/queue/testing` for tests and examples. Pick by the row that matches your
deployment, then jump to the matching step.

{{ comp.apiTable({ caption: "Queue backends in @netscript/queue", columns: ["Backend", "How you select it", "Reach for it when"], rows: [
  ["<code>MemoryQueueAdapter</code>", "<code>new MemoryQueueAdapter()</code> from <code>@netscript/queue/testing</code> (never auto-discovered)", "Unit tests and isolated examples — volatile, in-process, zero setup; data is lost on restart."],
  ["Deno KV <code>(provider: 'deno-kv')</code>", "Auto-discovery <strong>fallback</strong>, or pin <code>QueueProvider.DenoKv</code>", "Local dev and single-instance apps with no broker; durable to the Deno KV store. Needs <code>--unstable-kv</code>."],
  ["Redis <code>(provider: 'redis')</code>", "Auto-discovered when a Redis/Garnet connection is present; or pin <code>QueueProvider.Redis</code>", "High-throughput production with a Redis/Garnet resource already provisioned by Aspire."],
  ["RabbitMQ <code>(provider: 'rabbitmq')</code>", "Auto-discovered <strong>first</strong> when an AMQP broker is present; or pin <code>QueueProvider.RabbitMQ</code>", "Broker-grade routing and reliability via Fedify's AMQP adapter; the top of the auto-discovery probe."],
  ["PostgreSQL <code>(provider: 'postgres')</code>", "<strong>Explicit only</strong> — pass <code>QueueProvider.Postgres</code>; never auto-discovered", "You already run Postgres and want one fewer moving part, or want the queue to share your transactional store. Row-claim via <code>FOR UPDATE SKIP LOCKED</code>."]
] }) }}

## Step 1 — Default: let auto-discovery pick

If you pass no `provider`, the factory probes the Aspire environment and selects the first
available backend in a fixed order. Write provider-neutral code and let the environment
decide:

```ts
// queue.ts
import { createTypedQueue } from "@netscript/queue";
import { z } from "zod";

const JobSchema = z.object({ id: z.string(), kind: z.string() });

// No provider → auto-discovery. Probe order: RabbitMQ → Redis → Deno KV.
export const jobs = createTypedQueue("jobs", JobSchema);
```

The probe order is **RabbitMQ (AMQP) → Redis → Deno KV**. Deno KV is the always-available
fallback when no broker is discoverable, so the same code runs unchanged from laptop to
production as you provision real backends under Aspire.

{{ comp callout { type: "note", title: "PostgreSQL is the deliberate exception" } }}
Auto-discovery probes <strong>RabbitMQ → Redis → Deno KV only</strong>. It will
<strong>never</strong> fall through to PostgreSQL — even when a Postgres connection is
present in the environment. The SQL-durable queue is opt-in: you must pass
<code>provider: 'postgres'</code> (Step 3) or you will quietly land on the Deno KV adapter.
{{ /comp }}

## Step 2 — Pin a provider explicitly

To take auto-discovery out of the loop, pass `provider` from the `QueueProvider` enum.
Connection details go under `connection.<provider>`; every URL is optional and falls back
to Aspire service discovery when omitted.

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

## Step 3 — Select the PostgreSQL backend

The PostgreSQL provider gives you a SQL-durable queue with row-claim semantics
(`FOR UPDATE SKIP LOCKED`), a visibility timeout, ack/nack, and a dead-letter store — so
concurrent consumers never double-claim a message. Because it is never auto-discovered, you
must name it:

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

Reach for Postgres when you already run it under Aspire and want the queue and your
application data in one transactional store, rather than standing up a dedicated broker.

## Step 4 — Use the in-memory backend in tests

For unit tests and examples, construct the `MemoryQueueAdapter` directly from the testing
sub-path. It is volatile and in-process — nothing to provision, and it is never selected by
auto-discovery, so production code paths stay untouched:

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

Any provider can be wrapped for concurrent processing with `createParallelQueue`. Pass a
`concurrency` greater than 1 and a single listener processes that many messages at once —
ideal for I/O-bound work (HTTP calls, DB queries). At `concurrency: 1` (the default) it is
identical to `createQueue`.

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

For CPU-bound work, prefer Web Workers over queue concurrency — see
[Tune the worker runtime](/how-to/tune-worker-runtime/).

## In-production pitfalls

{{ comp callout { type: "warning", title: "Choosing a provider — read before you ship" } }}
<ul>
<li><strong>Local default is Deno KV, not a broker.</strong> If you never start Aspire, auto-discovery silently lands on the Deno KV fallback. Fine for dev — but don't assume broker-grade ordering or fan-out until you've provisioned and confirmed the real backend.</li>
<li><strong>PostgreSQL is opt-in, never auto-selected.</strong> The probe is RabbitMQ → Redis → Deno KV; it will <strong>not</strong> choose Postgres even when a Postgres connection exists. Pin <code>provider: QueueProvider.Postgres</code> or you'll quietly run on Deno KV.</li>
<li><strong>Remote Deno KV (KV Connect) switches adapters.</strong> A Deno KV path that is an <code>http(s)://</code> URL is treated as KV Connect, which has no native queue ops — the factory transparently swaps in a polling adapter (configurable <code>pollInterval</code>, <code>visibilityTimeout</code>, <code>maxRetries</code> under <code>connection.denoKv</code>). A local/SQLite KV path uses native queue ops. Know which one you're on before tuning.</li>
<li><strong>Make handlers idempotent.</strong> A thrown <code>QueueHandlerError</code> follows each backend's own ack/retry policy, so the same message can be redelivered. An idempotent handler can't double-charge or double-send on a retry.</li>
</ul>
{{ /comp }}

{{ comp callout { type: "important", title: "Validate at the boundary" } }}
Prefer <code>createTypedQueue</code> (Zod-validated at enqueue and dequeue) over the
untyped <code>createQueue</code> whenever the payload shape matters. An unvalidated queue
can carry malformed messages until the consumer fails inside the handler;
validation at enqueue time fails fast at the producer, regardless of which provider you
chose.
{{ /comp }}

## See also

{{ comp.xref({ key: "cap:kv-queues-cron" }) }} — the concept-level tour of queues, KV, and
cron, and how Aspire wires the four queue backends.

{{ comp.xref({ key: "cap:background-jobs" }) }} — when you want a managed worker job
(persistence, retries, an HTTP trigger) instead of a raw queue.

{{ comp.xref({ key: "howto:queue-kv-cron" }) }} — the mechanics recipe: enqueue, consume,
and schedule. This page pairs with it: choose the backend here, run it there.

For the full `QueueProvider` enum, the `QueueConnectionOptions` shape, `createParallelQueue`
/ `ParallelQueueOptions`, the `MessageQueue` interface, and the `QueueError` hierarchy, see
{{ comp.xref({ key: "ref:queue" }) }}.

{{ comp.nextPrev({ prev: { label: "Use a second database", href: "/how-to/use-a-second-database/" }, next: { label: "Tune the worker runtime", href: "/how-to/tune-worker-runtime/" } }) }}
