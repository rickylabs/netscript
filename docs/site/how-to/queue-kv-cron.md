---
layout: layouts/base.vto
title: Queue / KV / cron
templateEngine: [vento, md]
prev: { label: "Database & migration", href: "/how-to/database-migration/" }
next: { label: "Add OpenTelemetry", href: "/how-to/add-opentelemetry/" }
---

# Queue / KV / cron

**Scope:** three task recipes for the runtime primitives every NetScript app reaches
for sooner or later — enqueueing and consuming a **queue** message, reading and writing
**KV**, and scheduling a **cron** job. Each primitive is a small, provider-agnostic
package (`@netscript/queue`, `@netscript/kv`, `@netscript/cron`) that auto-detects its
backend from the environment, so the same code runs against an in-memory adapter on your
laptop and a real broker or store under Aspire. This page shows the minimal, copy-able
shape for each, then points you at the full generated API.

These primitives are lower-level than the [background-jobs](/capabilities/background-jobs/)
plugin: a worker job is a managed handler with persistence, retries, and an HTTP trigger,
whereas a raw queue is just a typed pipe. Use the plugin when you want lifecycle
management; use these primitives when you want a thin abstraction you control. For the
concept-level tour, read [Capabilities — KV, queues &
cron](/capabilities/kv-queues-cron/).

## Prerequisites

{{ comp.apiTable({ caption: "Before you start", rows: [
  {
    name: "A NetScript workspace",
    type: "netscript init",
    desc: "Created per the Quickstart. Run these recipes from the workspace root or any workspace member."
  },
  {
    name: "Deno KV unstable flag",
    type: "--unstable-kv",
    desc: "KV (and the KV-backed queue/cron fallbacks) use Deno KV. The scaffold's deno.json sets unstable: ['raw-imports', 'kv']; add --unstable-kv to any ad-hoc deno run/check that touches these packages."
  },
  {
    name: "Aspire running (for real backends)",
    type: "cd aspire && aspire run",
    desc: "In-memory and Deno KV adapters need nothing extra. To exercise the Redis/Garnet or RabbitMQ backends, bring up orchestration first — aspire run provisions garnet (cache) and any broker before your service connects."
  }
] }) }}

{{ comp callout { type: "note", title: "Backends auto-discover — you rarely pick one by hand" } }}
Each package resolves its provider from the environment at first use. <strong>KV</strong>
auto-detects across <code>'deno-kv'</code>, <code>'redis'</code>, <code>'nitro'</code>, or
<code>'auto'</code>; <strong>queue</strong> probes RabbitMQ (AMQP), then Redis, then Deno KV;
<strong>cron</strong> uses native <code>Deno.cron</code> with an in-memory scheduler for tests.
You write provider-neutral code and let Aspire wire the connection strings.
{{ /comp }}

## Recipe 1 — KV: read and write durable state

`@netscript/kv` is a reactive key-value store with one API across **Deno KV**, **Redis**,
and an in-memory backend. The shared lifecycle resolves a provider once and hands back a
`WatchableKv` — a `KvStore` with `get` / `set` / `delete` / `has` / `list` / `atomic`,
plus reactive `watch` / `watchPrefix`.

### Step 1 — Get the shared store

```ts
// some-module.ts
import { getKv } from "@netscript/kv";

// Resolves (and initializes on first call) the shared WatchableKv singleton.
// Provider is auto-detected from the environment unless you pass a config.
const kv = await getKv();
```

`getKv()` takes an optional `SharedKvConfig` if you want to pin a provider or a Deno KV
path. The provider set is `'redis' | 'deno-kv' | 'nitro' | 'auto'`; leaving it unset means
`'auto'`.

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

// watchPrefix() is reactive: the callback fires on every change beneath the prefix.
const stop = kv.watchPrefix(["users"], (event) => {
  console.log("changed:", event.key);
});
// …later
stop();
```

{{ comp.apiTable({ caption: "KV adapters (@netscript/kv)", rows: [
  {
    name: "DenoKvAdapter",
    type: "@netscript/kv (provider 'deno-kv')",
    desc: "Deno-native, backed by Deno.Kv, with native watch support. The default for local dev. Needs --unstable-kv."
  },
  {
    name: "MemoryKvAdapter",
    type: "@netscript/kv (provider 'auto' in tests)",
    desc: "Volatile in-process store. Nothing to provision; data is lost on restart. Ideal for tests and isolated runs."
  },
  {
    name: "Redis adapter",
    type: "@netscript/kv/redis (provider 'redis')",
    desc: "Importing the sub-path self-registers the 'redis' provider. Backed by the Garnet/Redis resource Aspire provisions. Reads its connection via getRedisConnectionFromEnv()."
  }
] }) }}

See the full surface — `getRawKv`, `getActiveProvider`, `atomic` compare-and-swap, the
`WatchableKv` contract — in [`@netscript/kv`](/reference/kv/).

## Recipe 2 — Queue: enqueue and consume a message

`@netscript/queue` wraps battle-tested adapters behind one `MessageQueue` interface with
optional Zod validation. A queue has exactly two operations: `enqueue` (producer) and
`listen` (consumer). Backend auto-discovery probes **RabbitMQ (AMQP)** first, then
**Redis**, then **Deno KV**.

### Step 1 — Create a typed queue

Prefer `createTypedQueue` so messages are validated with Zod at both enqueue and dequeue
time. (`createQueue` gives you the untyped pipe if you don't want validation.)

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

{{ comp.apiTable({ caption: "Queue adapters (@netscript/queue)", rows: [
  {
    name: "Deno KV",
    type: "QueueProvider — auto-discovery fallback",
    desc: "Zero-dependency local default when no broker is present. Durable to the Deno KV store. Needs --unstable-kv."
  },
  {
    name: "Redis",
    type: "QueueProvider — second probe",
    desc: "Backed by the Redis/Garnet resource Aspire provisions. Used when a Redis connection is discoverable and no AMQP broker is."
  },
  {
    name: "RabbitMQ (AMQP)",
    type: "QueueProvider — first probe",
    desc: "Full broker semantics via Fedify's AMQP adapter (amqplib). Preferred when an AMQP connection is available. Use createParallelQueue for concurrent processing."
  }
] }) }}

{{ comp callout { type: "important", title: "Production pitfalls" } }}
<ul>
<li><strong>Validate at the boundary.</strong> Prefer <code>createTypedQueue</code> over <code>createQueue</code> — an unvalidated queue happily transports malformed messages until a consumer throws deep in your handler. Validation at enqueue time fails fast at the producer.</li>
<li><strong>Local default is Deno KV, not a broker.</strong> If you never start Aspire, your queue silently runs on the Deno KV fallback. That is fine for dev, but it is not RabbitMQ — don't assume broker-grade ordering or fan-out semantics until you've provisioned the real backend.</li>
<li><strong>Handler throws are not free retries.</strong> A thrown <code>QueueHandlerError</code> follows the adapter's ack/retry policy, which differs per backend. Make handlers idempotent so a redelivery can't double-charge or double-send.</li>
</ul>
{{ /comp }}

For `createParallelQueue`, the typed/parallel options, the `QueueError` hierarchy, and the
standalone `safeValidate` / `validateOrThrow` helpers, see
[`@netscript/queue`](/reference/queue/).

## Recipe 3 — Cron: schedule a recurring job

`@netscript/cron` is a runtime-agnostic scheduler over native **`Deno.cron`** and an
**in-memory** scheduler for tests, with timezone support and job-lifecycle events. You get
a scheduler from the factory and register jobs with a cron expression.

### Step 1 — Get a scheduler

```ts
// scheduler.ts
import { getScheduler } from "@netscript/cron";

// Shared singleton, created on first call, auto-detecting the runtime backend.
const scheduler = getScheduler();
```

`createScheduler(options?)` builds a fresh scheduler if you'd rather not use the shared
instance; `stopScheduler()` tears the default one down (handy between tests).

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

scheduler.schedule("session-cleanup", expr, cleanup);

// Or use a named preset instead of a raw expression.
scheduler.schedule("nightly-report", CronPresets.EVERY_DAY, async () => {
  await emitDailyReport();
});
```

{{ comp callout { type: "warning", title: "Cron runs in-process — match it to your runtime" } }}
Native <code>Deno.cron</code> requires the schedule to be registered while the process is
alive; a cron job in a short-lived request handler will never fire. Register schedules
during startup of a long-running service (a worker background processor or a
<code>defineService</code> entry), not inside a per-request path. The in-memory backend is
for tests only — it does not survive a restart.
{{ /comp }}

The scheduler contract, `parseCronExpression`, the full `CronPresets` set
(`EVERY_MINUTE`, `EVERY_5_MINUTES`, `EVERY_HOUR`, `EVERY_DAY`, `WEEKDAYS_9AM`, …), and the
adapter classes are documented in [`@netscript/cron`](/reference/cron/).

## See also

{{ comp.featureGrid({ items: [
  {
    title: "Capabilities — KV, queues & cron",
    body: "The concept-level tour of these primitives, when to reach for them, and how Aspire wires the backends.",
    href: "/capabilities/kv-queues-cron/",
    icon: "◎"
  },
  {
    title: "Reference — @netscript/kv",
    body: "Full generated API: the WatchableKv contract, adapters, atomic operations, and the shared lifecycle helpers.",
    href: "/reference/kv/",
    icon: "≡"
  },
  {
    title: "Reference — @netscript/queue",
    body: "createQueue / createTypedQueue / createParallelQueue, the MessageQueue interface, and the validation helpers.",
    href: "/reference/queue/",
    icon: "≡"
  },
  {
    title: "Reference — @netscript/cron",
    body: "The scheduler factory, cron-expression utilities, CronPresets, and the per-backend adapter classes.",
    href: "/reference/cron/",
    icon: "≡"
  },
  {
    title: "Background jobs (workers)",
    body: "When you want managed handlers with persistence, retries, and an HTTP trigger instead of a raw queue.",
    href: "/capabilities/background-jobs/",
    icon: "◆"
  },
  {
    title: "Database & migration",
    body: "The previous recipe — provision Postgres under Aspire and run the db init → generate → seed flow.",
    href: "/how-to/database-migration/",
    icon: "→"
  }
] }) }}

{{ comp.nextPrev({ prev: { label: "Database & migration", href: "/how-to/database-migration/" }, next: { label: "Add OpenTelemetry", href: "/how-to/add-opentelemetry/" } }) }}
