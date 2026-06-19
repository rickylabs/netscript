---
layout: layouts/base.vto
title: KV, queues & cron
templateEngine: [vento, md]
prev: { label: "Database & Prisma", href: "/capabilities/database/" }
next: { label: "Telemetry & logging", href: "/capabilities/telemetry/" }
---

# KV, queues & cron

The integration trio. Most backends end up hand-assembling three boring-but-load-bearing
seams: a **key-value store** for cache and session state, a **message queue** for
fire-and-forget work, and a **cron scheduler** for time-driven jobs. NetScript ships all
three as provider-agnostic packages — `@netscript/kv`, `@netscript/queue`, and
`@netscript/cron` — each exposing one contract across several backends and **auto-detecting**
the best available adapter from the Aspire environment, with a zero-config local fallback so
the same code runs on a laptop and in production.

{{ comp callout { type: "tip", title: "Use this when" } }}
Reach for <strong>KV</strong> when you need fast, typed read/write state — caches, sessions,
feature flags, counters — with optional TTL and reactive watches. Reach for a
<strong>queue</strong> when you have <em>fire-and-forget</em> or fan-out work that should not
block a request: emails, webhooks, image processing. Reach for <strong>cron</strong> when work
is <em>time-driven</em>: nightly reports, hourly cleanups, weekday digests. For
<em>message-driven, long-running orchestration with state</em>, step up to a
<a href="/capabilities/durable-sagas/">durable saga</a>; for <em>inbound HTTP that kicks off
work</em> use a <a href="/capabilities/triggers/">trigger</a>.
{{ /comp }}

## One API, many backends

Each package is built on the same NetScript opinion: a single typed contract, several adapters
behind it, and provider selection that resolves automatically from the environment so you never
branch on "is this local or Aspire?" in product code. KV unifies **Deno KV, Redis/Garnet, and
in-memory**. Queue unifies **Deno KV, Redis, RabbitMQ (AMQP), and a KV-polling** fallback. Cron
unifies **native `Deno.cron()` and an in-memory** scheduler.

{{ comp.featureGrid({ items: [
  {
    title: "@netscript/kv",
    body: "Reactive key-value storage. getKv() auto-detects Deno KV, Redis/Garnet, or memory; get/set/watch/atomic with per-key TTL.",
    href: "/reference/kv/",
    icon: "◆"
  },
  {
    title: "@netscript/queue",
    body: "Provider-agnostic message queues. createQueue() wraps Deno KV, Redis, RabbitMQ (AMQP), and KV-polling behind one MessageQueue<T> contract.",
    href: "/reference/queue/",
    icon: "≡"
  },
  {
    title: "@netscript/cron",
    body: "Runtime-agnostic scheduling. createScheduler() uses native Deno.cron() when available and an in-memory adapter for tests.",
    href: "/reference/cron/",
    icon: "◎"
  }
] }) }}

## The adapter matrix

Every capability degrades gracefully: with nothing configured you get a local backend (Deno KV
or in-memory) and zero external dependencies; once Aspire provisions Redis/Garnet or RabbitMQ,
the same `getKv()`/`createQueue()`/`createScheduler()` call upgrades to the production adapter
automatically. The matrix below is the full provider surface — read across a capability to see
which backends it supports and how each is chosen.

{{ comp.apiTable({
  caption: "Adapter × capability — supported backends and how they are selected",
  rows: [
    { name: "Deno KV", type: "kv · queue · cron", desc: "Default zero-config fallback. KV stores locally; the queue uses native Deno KV queue ops; cron is unrelated to KV but shares the local-first philosophy. No external service required." },
    { name: "memory", type: "kv · cron", desc: "Process-local. MemoryKvAdapter for KV and the in-memory cron adapter (provider: 'memory') — the deterministic default for tests and local development." },
    { name: "Redis / Garnet", type: "kv · queue", desc: "Production cache and queue backend. Selected when CACHE_PROVIDER=redis|garnet, REDIS_URI/GARNET_URI, or Aspire services__redis__*/services__garnet__* are present. Garnet is the Redis-compatible cache Aspire provisions." },
    { name: "RabbitMQ (AMQP)", type: "queue", desc: "Durable broker for high-throughput, multi-consumer queues. Selected first when Aspire reports a rabbitmq service. Imported via @netscript/queue/adapters/amqp for direct access." },
    { name: "KV-polling", type: "queue", desc: "KvPollingAdapter — used automatically when the Deno KV path is a remote HTTP/HTTPS endpoint (KV Connect), where native queue ops are unavailable." },
    { name: "Deno.cron()", type: "cron", desc: "Native runtime scheduler. Used by createScheduler() whenever the runtime exposes Deno.cron(); falls back to the in-memory adapter otherwise." }
  ]
}) }}

{{ comp callout { type: "important", title: "Aspire first — then the production adapters appear" } }}
Auto-detection upgrades to Redis/Garnet and RabbitMQ only when those resources are
<strong>running</strong>. Bring orchestration up first:
<code>cd aspire &amp;&amp; aspire run</code> provisions Postgres, Garnet, and any message broker
(dashboard at <a href="http://localhost:18888">http://localhost:18888</a>)
<strong>before</strong> any <code>netscript db</code> command or service that expects those
backends. Without Aspire, KV falls back to local Deno KV, the queue falls back to Deno KV, and
cron falls back to the in-memory adapter — your code is identical either way. See
<a href="/explanation/aspire/">Orchestration with Aspire</a>.
{{ /comp }}

## Headline API — KV: get & set with TTL

`getKv()` returns a `WatchableKv` bound to the auto-detected backend. Keys are typed tuples,
values are fully typed, and `expireIn` (milliseconds) gives per-key TTL on every adapter. For
tests, construct `MemoryKvAdapter` directly; for an explicit Redis connection, import the Redis
adapter from the `@netscript/kv/redis` subpath so Redis stays out of your module graph unless
you ask for it.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Simple — auto-detected getKv()",
    lang: "ts",
    code: "import { getKv } from '@netscript/kv';\n\nconst kv = await getKv(); // picks Redis/Garnet under Aspire, else local Deno KV\n\nawait kv.set(['users', 'alice'], { name: 'Alice', role: 'admin' });\n\nconst entry = await kv.get<{ name: string; role: string }>(['users', 'alice']);\nconsole.log(entry?.value.name); // \"Alice\"\n\n// Per-key TTL works on every adapter — expire a session after one hour.\nawait kv.set(['sessions', 'tok_abc'], { userId: 'u1' }, { expireIn: 3_600_000 });"
  },
  {
    label: "Reactive — watch a prefix",
    lang: "ts",
    code: "import { getKv } from '@netscript/kv';\n\nconst kv = await getKv();\n\n// Stream every change under a prefix, including newly created keys.\nfor await (const event of kv.watchPrefix(['jobs', 'order-processor'])) {\n  console.log(`${event.key.join('/')} -> ${event.type}`, event.value);\n}"
  },
  {
    label: "Atomic — compare-and-swap",
    lang: "ts",
    code: "import { getKv } from '@netscript/kv';\n\nconst kv = await getKv();\n\nconst entry = await kv.get<number>(['counters', 'visits']);\nconst result = await kv.atomic(\n  [{ key: ['counters', 'visits'], versionstamp: entry?.versionstamp ?? null }],\n  [{ type: 'set', key: ['counters', 'visits'], value: (entry?.value ?? 0) + 1 }],\n);\n\nif (!result.ok) {\n  // A concurrent write landed since the read — retry the cycle.\n}"
  },
  {
    label: "Tests / explicit backend",
    lang: "ts",
    code: "// Deterministic, process-local store for tests.\nimport { MemoryKvAdapter } from '@netscript/kv';\n\nconst kv = new MemoryKvAdapter();\nawait kv.set(['test', 'key'], 'value');\n\n// Or pin Redis explicitly via the subpath import.\nimport { RedisKvAdapter } from '@netscript/kv/redis';\n\nconst redisKv = new RedisKvAdapter({ url: 'redis://localhost:6379', namespace: 'myapp' });\nawait redisKv.set(['cache', 'featured'], items, { expireIn: 60_000 });"
  }
] }) }}

## Headline API — queues: enqueue & consume

`createQueue<T>(name, options?)` returns a `MessageQueue<T>` over the auto-detected backend.
The factory stays synchronous; heavy Redis and RabbitMQ (AMQP) adapters resolve lazily on first
use and never enter your module graph until then. Producers call `enqueue(message)`; consumers
call `listen(handler)`. Wrap a schema with `createTypedQueue(name, schema, options?)` to validate
on enqueue/dequeue, with a dead-letter (`'dlq'`) option for invalid payloads.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Enqueue — producer",
    lang: "ts",
    code: "import { createQueue } from '@netscript/queue';\n\n// Auto-detects: RabbitMQ (AMQP) under Aspire, else Redis, else Deno KV.\nconst emails = createQueue<{ to: string; body: string }>('emails');\n\nawait emails.enqueue({\n  to: 'user@example.com',\n  body: 'Welcome to NetScript.',\n});"
  },
  {
    label: "Consume — listener",
    lang: "ts",
    code: "import { createQueue } from '@netscript/queue';\n\nconst emails = createQueue<{ to: string; body: string }>('emails');\n\n// Handler runs for each message; some backends ack/retry natively (nativeRetrial).\nawait emails.listen(async (message) => {\n  await sendEmail(message.to, message.body);\n});\n\n// On shutdown, drain and release the backend connection.\nawait emails.stop();"
  },
  {
    label: "Typed — runtime validation",
    lang: "ts",
    code: "import { z } from 'zod';\nimport { createTypedQueue } from '@netscript/queue';\n\nconst NotificationSchema = z.object({\n  type: z.enum(['email', 'sms']),\n  to: z.string(),\n  body: z.string(),\n});\n\n// Invalid payloads route to a dead-letter queue instead of throwing.\nconst notifications = createTypedQueue('notifications', NotificationSchema, {\n  onValidationError: 'dlq',\n});"
  },
  {
    label: "Pin a provider",
    lang: "ts",
    code: "import { createQueue, QueueProvider } from '@netscript/queue';\n\n// Force Redis regardless of what auto-detection would pick.\nconst jobs = createQueue('jobs', { provider: QueueProvider.Redis });\n\n// Or tune the Deno KV / KV-polling adapter for a remote KV Connect endpoint.\nconst remote = createQueue('jobs', {\n  connection: {\n    denoKv: { path: 'https://kv.example.com', pollInterval: 500, visibilityTimeout: 60_000 },\n  },\n});"
  }
] }) }}

{{ comp callout { type: "note", title: "Queues are traced for you" } }}
When telemetry is enabled, <code>createQueue()</code> auto-wraps the queue with
<code>@netscript/telemetry</code>, so enqueue and consume spans show up in the Aspire dashboard
alongside RPC and SSE work — no manual instrumentation. Opt out with
<code>disableAutoTracing: true</code> when you want to wire spans by hand. See
<a href="/capabilities/telemetry/">Telemetry &amp; logging</a>.
{{ /comp }}

## Headline API — cron: schedule a job

`createScheduler(options?)` returns a `CronScheduler` that uses native `Deno.cron()` when the
runtime exposes it and an in-memory adapter otherwise. `schedule(name, expression, handler,
options?)` registers a job from a standard cron expression or a `CronPresets` constant;
`trigger(name)` fires it manually (handy in tests); `stop()` tears the scheduler down. For
simple single-scheduler apps, `getScheduler()` returns a shared singleton.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Simple — preset schedule",
    lang: "ts",
    code: "import { createScheduler, CronPresets } from '@netscript/cron';\n\nconst scheduler = createScheduler(); // native Deno.cron() when available\n\nconst report = async () => {\n  await generateDailyReport();\n};\n\nawait scheduler.schedule('daily-report', CronPresets.WEEKDAYS_9AM, report, {\n  timezone: 'America/New_York',\n});\n\n// Fire once on demand — useful for verifying wiring.\nawait scheduler.trigger('daily-report');\nawait scheduler.stop();"
  },
  {
    label: "Raw expression + context",
    lang: "ts",
    code: "import { createScheduler } from '@netscript/cron';\n\nconst scheduler = createScheduler({ provider: 'memory', tickInterval: 100 });\n\n// Hourly cleanup; the handler receives scheduling metadata.\nconst cleanup = async (context) => {\n  console.log(context.jobId, context.attempt, context.scheduledTime.toISOString());\n};\n\nawait scheduler.schedule('cleanup', '0 * * * *', cleanup);"
  },
  {
    label: "Lifecycle events",
    lang: "ts",
    code: "import { createScheduler } from '@netscript/cron';\n\nconst scheduler = createScheduler({ provider: 'memory' });\n\n// Observe jobRun / jobError / jobScheduled / jobUnscheduled.\nscheduler.on('jobRun', (event) => {\n  if (!event.result.success) {\n    console.error(`Job ${event.jobId} failed`, event.result.error);\n  }\n});"
  },
  {
    label: "Validate expressions",
    lang: "ts",
    code: "import { isValidCronExpression, parseCronExpression } from '@netscript/cron';\n\nif (isValidCronExpression('0 9 * * 1-5')) {\n  const parsed = parseCronExpression('0 9 * * 1-5');\n  console.log(parsed?.hour, parsed?.dayOfWeek);\n}"
  }
] }) }}

## How they compose

The trio is strongest together. A common pattern: a **cron** job wakes on a schedule and
**enqueues** a batch of work; **queue** consumers process each message in parallel; and a **KV**
store holds the cursor, dedupe keys, or rate-limit counters that keep the whole thing idempotent
across restarts. None of these requires you to operate Redis or RabbitMQ during development —
the local Deno KV / in-memory adapters carry the same code until Aspire provisions the real
backends.

{{ comp.apiTable({
  caption: "Picking the right primitive",
  rows: [
    { name: "Key-value state", type: "@netscript/kv", desc: "Synchronous-feeling read/write state: caches, sessions, flags, counters, cursors. Use TTL for ephemerality and watches for reactivity." },
    { name: "Fire-and-forget work", type: "@netscript/queue", desc: "Decouple slow work from the request path. Fan out to multiple consumers; let the backend handle retries where nativeRetrial is true." },
    { name: "Time-driven work", type: "@netscript/cron", desc: "Run handlers on a schedule. Pair with a queue to fan a scheduled tick out into many parallel jobs." },
    { name: "Stateful orchestration", type: "@netscript/plugin-sagas-core", desc: "When work spans steps with correlation and compensation, a queue is not enough — model it as a durable saga instead." }
  ]
}) }}

## Where to go next

This hub is intentionally thin — the full generated signatures, options, and adapter exports
live in the reference. Pick the lane that matches what you're doing.

{{ comp.featureGrid({ items: [
  {
    title: "Do — Wire a queue / KV / cron job",
    body: "Task recipe: stand up each primitive in an existing workspace, with the Aspire-provisioned and local-fallback paths spelled out.",
    href: "/how-to/queue-kv-cron/",
    icon: "◆"
  },
  {
    title: "Look up — @netscript/kv reference",
    body: "Full generated API: getKv, WatchableKv, KvStore, the Deno KV / memory / Redis adapters, and the auto-detection table.",
    href: "/reference/kv/",
    icon: "≡"
  },
  {
    title: "Look up — @netscript/queue reference",
    body: "createQueue, createTypedQueue, createParallelQueue, QueueProvider, MessageQueue<T>, and the Deno KV / Redis / AMQP / KV-polling adapters.",
    href: "/reference/queue/",
    icon: "≡"
  },
  {
    title: "Look up — @netscript/cron reference",
    body: "createScheduler, getScheduler, CronPresets, CronScheduler, the Deno.cron() and memory adapters, and ScheduleOptions.",
    href: "/reference/cron/",
    icon: "≡"
  },
  {
    title: "Understand — Orchestration with Aspire",
    body: "How the scaffold wires Garnet (Redis) and message brokers as resources, and why auto-detection just works once aspire run is up.",
    href: "/explanation/aspire/",
    icon: "◎"
  },
  {
    title: "Understand — Telemetry & logging",
    body: "Why queues are traced by default and how KV/queue/cron spans land in the Aspire dashboard.",
    href: "/capabilities/telemetry/",
    icon: "◎"
  }
] }) }}

{{ comp.nextPrev({ prev: { label: "Database & Prisma", href: "/capabilities/database/" }, next: { label: "Telemetry & logging", href: "/capabilities/telemetry/" } }) }}
