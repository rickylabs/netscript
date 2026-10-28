---
layout: layouts/base.vto
title: Queue / KV / cron
description: Use the reactive KV store, the durable queue, and cron schedules.
templateEngine: [vento, md]
order: 103
oldUrl: /how-to/queue-kv-cron/
---

# Queue / KV / cron

This page gives you the minimal working code for three runtime primitives: reading and writing
**KV**, enqueueing and consuming a **queue** message, and scheduling a **cron** job. Each is a small
provider-agnostic package (`@netscript/kv`, `@netscript/queue`, `@netscript/cron`) that resolves
its backend from the environment, so the same code runs on a local adapter on your laptop and on a
real store or broker under Aspire. To pick or pin a queue backend, see
[Choose a queue provider](/data-persistence/how-to/choose-a-queue-provider/).

These primitives sit below the [background jobs](/background-processing/workers/) plugin. A worker
job is a managed handler with persistence, retries and an HTTP trigger; a raw queue is a typed pipe
you control. For the concepts, read [KV, queues & cron](/data-persistence/kv-queues-cron/).

## Prerequisites

{{ comp.apiTable({ caption: "Before you start", rows: [
  {
    name: "A NetScript workspace",
    type: "netscript init",
    desc: "Created per the Quickstart. Run these recipes from the workspace root or any workspace member."
  },
  {
    name: "Start Aspire (for real backends)",
    type: "cd aspire && aspire start",
    desc: "Aspire is step 2 of local dev — it provisions Postgres, Redis (cache), and any broker BEFORE your service connects. In-memory and Deno KV adapters need nothing extra; Redis, RabbitMQ, and the Postgres queue all expect Aspire up first."
  },
  {
    name: "Deno KV unstable flag",
    type: "--unstable-kv",
    desc: "KV (and the KV-backed queue/cron fallbacks) use Deno KV. The scaffold's deno.json sets unstable: ['raw-imports', 'kv']; add --unstable-kv to any ad-hoc deno run/check that touches these packages."
  }
] }) }}

## Recipe 1 — KV: read and write durable state

`@netscript/kv` is a reactive key-value store with one API across **Deno KV**, **Redis** and an
in-memory backend. It resolves a provider once and hands back a `WatchableKv`: a `KvStore` with
`get` / `set` / `delete` / `has` / `list` / `atomic`, plus reactive `watch` / `watchPrefix`.

### Step 1 — Get the shared store

```ts
// some-module.ts
import { getKv } from "@netscript/kv";

// Resolves (and initializes on first call) the shared WatchableKv singleton.
// Provider is auto-detected from the environment unless you pass a config.
const kv = await getKv();
```

`getKv()` takes an optional `SharedKvConfig` to pin a provider or a Deno KV path. The provider set is
`'redis' | 'deno-kv' | 'nitro' | 'auto'`; leaving it unset means `'auto'`. Deno KV is the local
default and needs `--unstable-kv`. To use Redis, import `@netscript/kv/redis`: the sub-path
self-registers the `'redis'` provider, which reads its connection with
`getRedisConnectionFromEnv()` from the Redis/Garnet resource Aspire provisions.

### Step 2 — Write, read, and expire

```ts
// Keys are KvKey = readonly Deno.KvKeyPart[] — a portable tuple key.
await kv.set(["users", 42, "profile"], { name: "Ada", status: "active" });

const entry = await kv.get<{ name: string; status: string }>(["users", 42, "profile"]);
console.log(entry?.value?.name); // "Ada"

// KvSetOptions.expireIn sets a TTL in milliseconds.
await kv.set(["session", "tok_123"], { userId: 42 }, { expireIn: 60_000 });

await kv.delete(["session", "tok_123"]);
```

### Step 3 — List a prefix and watch for changes

```ts
// list() takes a KvListOptions selector — here, every key under ["users"].
for await (const item of kv.list({ prefix: ["users"] })) {
  console.log(item.key, item.value);
}

// watchPrefix() returns an AsyncIterable; iterate it with for-await, cancel via AbortSignal.
const controller = new AbortController();
for await (const event of kv.watchPrefix(["users"], { signal: controller.signal })) {
  console.log("changed:", event.key);
}
// …to stop:
controller.abort();
```

The full surface, including `getRawKv`, `getActiveProvider`, `atomic` compare-and-swap and the
`WatchableKv` contract, is in [`@netscript/kv`](/reference/kv/).

## Recipe 2 — Queue: enqueue and consume a message

`@netscript/queue` puts one `MessageQueue` interface, with optional Zod validation, over four
backends: Deno KV, Redis, RabbitMQ (AMQP) and PostgreSQL. A queue has two operations: `enqueue`
(producer) and `listen` (consumer). Auto-discovery probes **RabbitMQ (AMQP)**, then **Redis**, then
**Deno KV**; PostgreSQL is opt-in only.

### Step 1 — Create a typed queue

Prefer `createTypedQueue`, which validates messages with Zod at enqueue and dequeue. A malformed
message then fails fast at the producer instead of inside the consumer's handler. `createQueue`
gives you the untyped pipe if you don't want validation.

```ts
// queue.ts
import { createTypedQueue } from "@netscript/queue";
import { z } from "zod";

const EmailJobSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string(),
});

// Name is the logical queue; the backend is auto-discovered (RabbitMQ → Redis → Deno KV).
export const emailQueue = createTypedQueue("welcome-emails", EmailJobSchema);
```

### Step 2 — Enqueue from a producer

```ts
import { emailQueue } from "./queue.ts";

await emailQueue.enqueue({
  to: "ada@example.com",
  subject: "Welcome",
  body: "Thanks for signing up.",
});

// EnqueueOptions supports a delay (e.g. retry-after, scheduled send).
await emailQueue.enqueue(
  { to: "grace@example.com", subject: "Reminder", body: "Don't forget." },
  { delay: 30_000 },
);
```

### Step 3 — Consume with a listener

```ts
import { emailQueue } from "./queue.ts";

// listen() runs the handler per message; MessageContext carries metadata + ack controls.
await emailQueue.listen(async (message, context) => {
  // `message` is already validated against EmailJobSchema.
  await sendEmail(message.to, message.subject, message.body);
  // Throwing here surfaces a QueueHandlerError; the adapter handles retry/ack semantics.
});
```

> [!WARNING]
> A thrown `QueueHandlerError` follows the adapter's ack/retry policy, which differs per backend, so
> the same message can be redelivered. Make handlers idempotent so a redelivery can't double-charge
> or double-send.

To run this queue on the SQL-durable PostgreSQL backend, pin it explicitly as shown in
[Choose a queue provider](/data-persistence/how-to/choose-a-queue-provider/#step-3-select-the-postgresql-backend);
`createTypedQueue` accepts the same `provider` / `connection` options. For `createParallelQueue`,
the full `QueueProvider` enum, the `connection.postgres` shape, the `QueueError` hierarchy and the
standalone `safeValidate` / `validateOrThrow` helpers, see [`@netscript/queue`](/reference/queue/).

## Recipe 3 — Cron: schedule a recurring job

`@netscript/cron` is a runtime-agnostic scheduler over native **`Deno.cron`**, with an **in-memory**
scheduler for tests, timezone support and job-lifecycle events.

### Step 1 — Get a scheduler

```ts
// scheduler.ts
import { getScheduler } from "@netscript/cron";

// Shared singleton, created on first call, auto-detecting the runtime backend.
const scheduler = getScheduler();
```

`createScheduler(options?)` builds a fresh scheduler if you'd rather not use the shared instance;
`stopScheduler()` tears the default one down, for example between tests.

### Step 2 — Schedule with a cron expression or a preset

```ts
import { getScheduler, CronPresets, isValidCronExpression } from "@netscript/cron";

const scheduler = getScheduler();

// Standard 5-field cron expression. Validate untrusted input first.
const expr = "*/15 * * * *"; // every 15 minutes
if (!isValidCronExpression(expr)) throw new Error(`bad cron: ${expr}`);

const cleanup = async () => {
  await purgeExpiredSessions();
};

await scheduler.schedule("session-cleanup", expr, cleanup);

// Or use a named preset instead of a raw expression.
await scheduler.schedule("nightly-report", CronPresets.EVERY_DAY, async () => {
  await emitDailyReport();
});
```

> [!WARNING]
> Native `Deno.cron` fires only while the process that registered the schedule is alive, so a cron
> job registered in a short-lived request handler never runs. Register schedules at startup of a
> long-running service, such as a worker background processor or a `defineService` entry. The
> in-memory backend is for tests only and does not survive a restart.

The scheduler contract, `parseCronExpression`, the full `CronPresets` set (`EVERY_MINUTE`,
`EVERY_5_MINUTES`, `EVERY_HOUR`, `EVERY_DAY`, `WEEKDAYS_9AM`, …) and the adapter classes are in
[`@netscript/cron`](/reference/cron/).

## Next steps

Pick or pin the queue backend in
[Choose a queue provider](/data-persistence/how-to/choose-a-queue-provider/).

- [KV, queues & cron](/data-persistence/kv-queues-cron/): when to reach for each primitive and how
  they compose.
- [Background jobs](/background-processing/workers/): managed handlers with persistence, retries and
  an HTTP trigger instead of a raw queue.
- References: [`@netscript/kv`](/reference/kv/), [`@netscript/queue`](/reference/queue/) and
  [`@netscript/cron`](/reference/cron/).

{{ comp.nextPrev({ prev: { label: "Database & migration", href: "/data-persistence/how-to/database-migration/" }, next: { label: "Add OpenTelemetry", href: "/observability/how-to/add-opentelemetry/" } }) }}
