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
`@netscript/cron` — each exposing one typed contract across several backends and
**auto-detecting** the best available adapter from the Aspire environment, with a zero-config
local fallback so the same code runs on a laptop and in production.

{{ comp.diagram({
  src: "/assets/diagrams/queue-worker-scheduler.svg",
  alt: "A cron schedule fires a tick that enqueues work onto a provider-agnostic queue; one or more worker listeners drain the queue in parallel while a KV store holds cursors, dedupe keys, and counters that keep the loop idempotent.",
  caption: "The trio in one loop: cron tick → enqueue → parallel queue listeners → KV state holds the cursor, dedupe keys, and counters."
}) }}

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

## What it is

Each package is built on the same NetScript opinion: a single typed contract, several adapters
behind it, and provider selection that resolves automatically from the environment so you never
branch on "is this local or Aspire?" in product code. KV unifies **Deno KV, Redis/Garnet, and
in-memory**; the queue unifies **Deno KV, Redis, RabbitMQ (AMQP), and PostgreSQL** (plus a
KV-polling fallback for remote KV Connect endpoints); cron unifies **native `Deno.cron()` and an
in-memory** scheduler. None of the three requires you to operate Redis, RabbitMQ, or PostgreSQL
during development — the local adapters carry the same code until [Aspire](/explanation/aspire/)
provisions the real backends. When [telemetry](/capabilities/telemetry/) is on, queues are traced
for you with no manual instrumentation.

{{ comp.featureGrid({ items: [
  {
    title: "@netscript/kv",
    body: "Reactive key-value storage. getKv() auto-detects Deno KV or Redis/Garnet; construct MemoryKvAdapter directly for tests. get/set/watch/atomic with per-key TTL.",
    href: "/reference/kv/",
    icon: "◆"
  },
  {
    title: "@netscript/queue",
    body: "Provider-agnostic message queues. createQueue() wraps Deno KV, Redis, RabbitMQ (AMQP), and PostgreSQL behind one MessageQueue<T> contract; createParallelQueue() adds concurrency.",
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

## Learn → / Do →

{{ comp.featureGrid({ items: [
  {
    title: "Do — Choose a queue provider",
    body: "Recipe: pick between Deno KV, Redis, RabbitMQ, and PostgreSQL — and wire the Aspire-provisioned, local-fallback, and explicit-provider paths.",
    href: "/how-to/choose-a-queue-provider/",
    icon: "→"
  },
  {
    title: "Understand — Orchestration with Aspire",
    body: "How the scaffold wires Garnet (Redis) and message brokers as resources, and why auto-detection just works once aspire start is up.",
    href: "/explanation/aspire/",
    icon: "◎"
  }
] }) }}

## One API, many backends

Each package keeps a single typed contract with several adapters behind it, and provider
selection resolves automatically from the environment. The matrix below is the full provider
surface — read across a capability to see which backends it supports and how each is chosen. Note
one deliberate exception: the **PostgreSQL queue backend is explicit-provider only** — it is real
and durable, but auto-detection never selects it (see the callout below).

{{ comp.apiTable({
  caption: "Adapter × capability — supported backends and how they are selected",
  rows: [
    { name: "Deno KV", type: "kv · queue · cron", desc: "Default zero-config fallback. KV stores locally; the queue uses native Deno KV queue ops; cron shares the same local-first philosophy via Deno.cron(). No external service required." },
    { name: "memory", type: "kv · cron", desc: "Process-local. MemoryKvAdapter for KV (must be constructed explicitly) and the in-memory cron adapter (provider: 'memory') — deterministic for tests. The KV default for local development without Redis is Deno KV (local file), not the in-memory adapter." },
    { name: "Redis / Garnet", type: "kv · queue", desc: "Production cache and queue backend. Selected when CACHE_PROVIDER=redis|garnet, REDIS_URI/GARNET_URI, or Aspire services__redis__*/services__garnet__* are present. Garnet is the Redis-compatible cache Aspire provisions." },
    { name: "RabbitMQ (AMQP)", type: "queue", desc: "Durable broker for high-throughput, multi-consumer queues. Chosen first by auto-detection when Aspire reports a rabbitmq service. Imported via @netscript/queue/adapters/amqp for direct access." },
    { name: "PostgreSQL", type: "queue", desc: "Durable SQL-backed queue (FOR UPDATE SKIP LOCKED row-claim, visibility timeout, ack/nack, DLQ). EXPLICIT-PROVIDER ONLY — set provider: QueueProvider.Postgres; never auto-detected. Configure connection.postgres.{url,tableName}." },
    { name: "KV-polling", type: "queue", desc: "KvPollingAdapter — used automatically when the Deno KV path is a remote HTTP/HTTPS endpoint (KV Connect), where native queue ops are unavailable. Tunable via connection.denoKv.{pollInterval,visibilityTimeout,maxRetries}." },
    { name: "Deno.cron()", type: "cron", desc: "Native runtime scheduler. Used by createScheduler() whenever the runtime exposes Deno.cron(); falls back to the in-memory adapter otherwise." }
  ]
}) }}

{{ comp callout { type: "warning", title: "PostgreSQL queue is explicit-provider only" } }}
The queue's auto-detection order is <strong>RabbitMQ → Redis → Deno KV</strong> — it never
selects PostgreSQL. The Postgres backend is a real, durable adapter
(<code>FOR UPDATE SKIP LOCKED</code> row-claiming, visibility timeout, ack/nack, dead-letter
store), but you must opt in explicitly with <code>provider: QueueProvider.Postgres</code> (or
the string <code>'postgres'</code>). The <code>url</code> in
<code>connection.postgres</code> is optional — when omitted, the adapter falls back to the
Aspire-provisioned Postgres URI — and <code>tableName</code> defaults to
<code>message_queue</code>. Reach for it when you want queue state to live in the same
transactional database as your domain data.
{{ /comp }}

{{ comp callout { type: "important", title: "Aspire first — then the production adapters appear" } }}
Auto-detection upgrades to Redis/Garnet and RabbitMQ only when those resources are
<strong>running</strong>. Bring orchestration up first:
<code>cd aspire &amp;&amp; aspire start</code> provisions Postgres, Garnet, and any message broker
(dashboard at <a href="http://localhost:18888">http://localhost:18888</a>)
<strong>before</strong> any <code>netscript db</code> command or service that expects those
backends. Without Aspire, KV falls back to local Deno KV, the queue falls back to Deno KV, and
cron falls back to the in-memory adapter — your code is identical either way. See
<a href="/explanation/aspire/">Orchestration with Aspire</a>.
{{ /comp }}

## KV — key types first

`getKv(config?)` returns a `WatchableKv` bound to the auto-detected backend. Keys are typed
tuples, values are fully typed, and `KvSetOptions.expireIn` (milliseconds) gives per-key TTL on
every adapter. Pass a `SharedKvConfig` to override provider selection on first access.

{{ comp.apiTable({
  caption: "SharedKvConfig — first-access overrides for getKv()",
  rows: [
    { name: "provider", type: "KvProvider?", desc: "Force a specific provider. The default 'auto' inspects the environment and chooses the best available backend." },
    { name: "path", type: "string?", desc: "Deno KV path or URL." },
    { name: "redisUrl", type: "string?", desc: "Explicit Redis connection URL." },
    { name: "redisNamespace", type: "string?", desc: "Prefix used for Redis-backed keys." },
    { name: "skipServiceDiscovery", type: "boolean?", desc: "Skip environment-based provider detection." }
  ]
}) }}

{{ comp.apiTable({
  caption: "KvSetOptions — per-key write options",
  rows: [
    { name: "expireIn", type: "number?", desc: "Time-to-live in milliseconds; the key is removed after the window elapses. Honoured by every adapter." }
  ]
}) }}

`getKv()` is the headline entrypoint; the same module also exposes `closeKv()`, `resetKv()`
(for tests), `getRawKv()` (the underlying `Deno.Kv` when the provider is Deno KV),
`getActiveProvider()`, `isKvInitialized()`, and the `isWatchable()` type guard.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Simple — auto-detected getKv()",
    lang: "ts",
    code: "// main.ts\nimport { getKv } from '@netscript/kv';\n\nconst kv = await getKv(); // picks Redis/Garnet under Aspire, else local Deno KV\n\nawait kv.set(['users', 'alice'], { name: 'Alice', role: 'admin' });\n\nconst entry = await kv.get<{ name: string; role: string }>(['users', 'alice']);\nconsole.log(entry?.value.name); // \"Alice\"\n\n// Per-key TTL works on every adapter — expire a session after one hour.\nawait kv.set(['sessions', 'tok_abc'], { userId: 'u1' }, { expireIn: 3_600_000 });"
  },
  {
    label: "Reactive — watch a prefix",
    lang: "ts",
    code: "// watch-jobs.ts\nimport { getKv } from '@netscript/kv';\n\nconst kv = await getKv();\n\n// Stream every change under a prefix, including newly created keys.\nfor await (const event of kv.watchPrefix(['jobs', 'order-processor'])) {\n  console.log(`${event.key.join('/')} -> ${event.type}`, event.value);\n}"
  },
  {
    label: "Atomic — compare-and-swap",
    lang: "ts",
    code: "// counter.ts\nimport { getKv } from '@netscript/kv';\n\nconst kv = await getKv();\n\nconst entry = await kv.get<number>(['counters', 'visits']);\nconst result = await kv.atomic(\n  [{ key: ['counters', 'visits'], versionstamp: entry?.versionstamp ?? null }],\n  [{ type: 'set', key: ['counters', 'visits'], value: (entry?.value ?? 0) + 1 }],\n);\n\nif (!result.ok) {\n  // A concurrent write landed since the read — retry the cycle.\n}"
  },
  {
    label: "Tests / explicit backend",
    lang: "ts",
    code: "// kv.test.ts — deterministic, process-local store for tests.\nimport { MemoryKvAdapter } from '@netscript/kv';\n\nconst kv = new MemoryKvAdapter();\nawait kv.set(['test', 'key'], 'value');\n\n// Or pin Redis explicitly via the subpath import (keeps ioredis out of other graphs).\nimport { RedisKvAdapter } from '@netscript/kv/redis';\n\nconst redisKv = new RedisKvAdapter({ url: 'redis://localhost:6379', namespace: 'myapp' });\nawait redisKv.set(['cache', 'featured'], items, { expireIn: 60_000 });"
  }
] }) }}

## Queues — key types first

`createQueue<T>(name, options?)` returns a `MessageQueue<T>` over the auto-detected backend. The
factory stays synchronous; the heavy Redis, RabbitMQ (AMQP), and PostgreSQL adapters resolve
lazily on first use and never enter your module graph until then. Producers call
`enqueue(message, options?)`; consumers call `listen(handler, options?)`; `stop()` drains and
releases the connection. The `QueueProvider` enum names the four backends —
`DenoKv`, `Redis`, `RabbitMQ`, `Postgres`.

{{ comp.apiTable({
  caption: "QueueOptions — passed to createQueue / createTypedQueue / createParallelQueue",
  rows: [
    { name: "provider", type: "QueueProvider?", desc: "Pin a backend. Omit to auto-discover (RabbitMQ → Redis → Deno KV). Set QueueProvider.Postgres to opt into the explicit-only Postgres adapter." },
    { name: "autoDiscover", type: "boolean? = true", desc: "Enable Aspire-environment discovery. Priority: RabbitMQ > Redis > Deno KV." },
    { name: "retryAttempts", type: "number? = 3", desc: "Max retries for failed messages — only applies when the backend has no native retry." },
    { name: "retryDelay", type: "number? = 1000", desc: "Delay between retry attempts in milliseconds — only when the backend has no native retry." },
    { name: "connection", type: "QueueConnectionOptions?", desc: "Provider-specific connection: connection.{denoKv,redis,rabbitmq,postgres}. KV Connect tuning lives under connection.denoKv (pollInterval, visibilityTimeout, maxRetries)." },
    { name: "deadLetterStore", type: "DeadLetterStorePort?", desc: "Custom terminal-failure store. When omitted, adapters use their provider-specific durable default." },
    { name: "disableAutoTracing", type: "boolean? = false", desc: "Skip the automatic TracedQueue wrapper when you prefer to wire spans by hand." }
  ]
}) }}

`createTypedQueue(name, schema, options?)` wraps a Zod schema and validates on enqueue/dequeue;
its `TypedQueueOptions` adds `validateOnEnqueue` (default true), `validateOnDequeue` (default
true), and `onValidationError` (`'discard'` default, `'dlq'`, or `'throw'`). `createParallelQueue`
takes the same options plus a `concurrency` count.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Enqueue — producer",
    lang: "ts",
    code: "// enqueue-email.ts\nimport { createQueue } from '@netscript/queue';\n\n// Auto-detects: RabbitMQ (AMQP) under Aspire, else Redis, else Deno KV.\nconst emails = createQueue<{ to: string; body: string }>('emails');\n\nawait emails.enqueue({\n  to: 'user@example.com',\n  body: 'Welcome to NetScript.',\n});\n\n// Delay availability (e.g. a 5-minute reminder) via EnqueueOptions.\nawait emails.enqueue({ to: 'user@example.com', body: 'Still there?' }, { delay: 5 * 60 * 1000 });"
  },
  {
    label: "Consume — listener",
    lang: "ts",
    code: "// consume-email.ts\nimport { createQueue } from '@netscript/queue';\n\nconst emails = createQueue<{ to: string; body: string }>('emails');\n\n// The handler receives the message and a MessageContext (messageId, deliveryCount, ack/nack).\nawait emails.listen(async (message, context) => {\n  await sendEmail(message.to, message.body);\n  // Some backends ack/retry natively (queue.nativeRetrial === true).\n});\n\n// On shutdown, drain in-flight work and release the backend connection.\nawait emails.stop();"
  },
  {
    label: "Parallel — bounded concurrency",
    lang: "ts",
    code: "// parallel-jobs.ts\nimport { createParallelQueue } from '@netscript/queue';\n\n// Process up to 4 I/O-bound messages concurrently on a single listener.\nconst jobs = createParallelQueue<{ orderId: string }>('order-jobs', { concurrency: 4 });\n\nawait jobs.listen(async (message) => {\n  await fulfilOrder(message.orderId); // these run in parallel, up to 4 at a time\n});\n\n// concurrency <= 1 behaves exactly like createQueue. For CPU-bound work prefer Web Workers."
  },
  {
    label: "Typed — runtime validation",
    lang: "ts",
    code: "// typed-notifications.ts\nimport { z } from 'zod';\nimport { createTypedQueue } from '@netscript/queue';\n\nconst NotificationSchema = z.object({\n  type: z.enum(['email', 'sms']),\n  to: z.string(),\n  body: z.string(),\n});\n\n// Invalid payloads route to a dead-letter queue instead of being discarded.\nconst notifications = createTypedQueue('notifications', NotificationSchema, {\n  onValidationError: 'dlq',\n});"
  },
  {
    label: "PostgreSQL — durable, explicit",
    lang: "ts",
    code: "// pg-queue.ts\nimport { createQueue, QueueProvider } from '@netscript/queue';\n\n// PostgreSQL is never auto-detected — opt in explicitly.\nconst jobs = createQueue<{ orderId: string }>('order-jobs', {\n  provider: QueueProvider.Postgres,        // or provider: 'postgres'\n  connection: {\n    postgres: {\n      // url is optional — falls back to the Aspire-provisioned Postgres URI.\n      url: 'postgres://app:secret@localhost:5432/app',\n      tableName: 'message_queue',           // default table name\n    },\n  },\n});\n\nawait jobs.enqueue({ orderId: 'ord_123' });"
  },
  {
    label: "Pin another provider",
    lang: "ts",
    code: "// pin-provider.ts\nimport { createQueue, QueueProvider } from '@netscript/queue';\n\n// Force Redis regardless of what auto-detection would pick.\nconst jobs = createQueue('jobs', { provider: QueueProvider.Redis });\n\n// Or tune the Deno KV / KV-polling adapter for a remote KV Connect endpoint.\nconst remote = createQueue('jobs', {\n  connection: {\n    denoKv: { path: 'https://kv.example.com', pollInterval: 500, visibilityTimeout: 60_000 },\n  },\n});"
  }
] }) }}

{{ comp callout { type: "note", title: "Queues are traced for you" } }}
When telemetry is enabled, <code>createQueue()</code> auto-wraps the queue with
<code>@netscript/telemetry</code>, so enqueue and consume spans show up in the Aspire dashboard
alongside RPC and SSE work — no manual instrumentation. Opt out with
<code>disableAutoTracing: true</code> when you want to wire spans by hand. See
<a href="/capabilities/telemetry/">Telemetry &amp; logging</a>.
{{ /comp }}

## Cron — key types first

`createScheduler(options?)` returns a `CronScheduler` that uses native `Deno.cron()` when the
runtime exposes it and an in-memory adapter otherwise.
`schedule(id, expression, handler, options?)` registers a job from a standard cron expression or
a `CronPresets` constant and resolves to a `ScheduledJob`; `trigger(id)` fires it manually (handy
in tests); `unschedule(id)` removes one; `stop()` tears the scheduler down. For simple
single-scheduler apps, `getScheduler()` returns a shared singleton (`stopScheduler()` resets it).
The handler may be a bare `JobHandler` or a `ContextualJobHandler` that receives a `JobContext`
(`jobId`, `scheduledTime`, `actualTime`, `attempt`, `signal`).

{{ comp.apiTable({
  caption: "CreateSchedulerOptions — passed to createScheduler / getScheduler",
  rows: [
    { name: "provider", type: "CronProvider?", desc: "Pin a provider. Omit to auto-detect by runtime — Deno.cron() when available, else the in-memory adapter." },
    { name: "tickInterval", type: "number? = 60000", desc: "Poll interval in milliseconds for the memory adapter; only used when provider is 'memory'." }
  ]
}) }}

{{ comp.apiTable({
  caption: "ScheduleOptions — per-job scheduling options",
  rows: [
    { name: "timezone", type: "string? = 'UTC'", desc: "IANA timezone the cron expression is evaluated against, e.g. 'America/New_York'." },
    { name: "runOnInit", type: "boolean?", desc: "Run the handler once immediately on registration, in addition to the schedule." },
    { name: "enabled", type: "boolean? = true", desc: "Whether the job starts enabled. Register a job disabled and turn it on later." },
    { name: "backoff", type: "object?", desc: "Retry backoff: { type: 'fixed' | 'exponential' | 'linear', initialDelay, maxDelay?, multiplier? }. Delays are milliseconds." },
    { name: "maxRetries", type: "number?", desc: "Maximum retries on handler failure before the run is recorded as failed." },
    { name: "metadata", type: "Record<string, unknown>?", desc: "Arbitrary metadata stored with the job and surfaced on its ScheduledJob record." }
  ]
}) }}

{{ comp.tabbedCode({ tabs: [
  {
    label: "Simple — preset schedule",
    lang: "ts",
    code: "// daily-report.ts\nimport { createScheduler, CronPresets } from '@netscript/cron';\n\nconst scheduler = createScheduler(); // native Deno.cron() when available\n\nconst report = async () => {\n  await generateDailyReport();\n};\n\nawait scheduler.schedule('daily-report', CronPresets.WEEKDAYS_9AM, report, {\n  timezone: 'America/New_York',\n});\n\n// Fire once on demand — useful for verifying wiring.\nawait scheduler.trigger('daily-report');\nawait scheduler.stop();"
  },
  {
    label: "Raw expression + context",
    lang: "ts",
    code: "// hourly-cleanup.ts\nimport { createScheduler } from '@netscript/cron';\n\nconst scheduler = createScheduler({ provider: 'memory', tickInterval: 100 });\n\n// Hourly cleanup; the contextual handler receives scheduling metadata.\nconst cleanup = async (context) => {\n  console.log(context.jobId, context.attempt, context.scheduledTime.toISOString());\n};\n\nawait scheduler.schedule('cleanup', '0 * * * *', cleanup);"
  },
  {
    label: "Lifecycle events",
    lang: "ts",
    code: "// observe-jobs.ts\nimport { createScheduler } from '@netscript/cron';\n\nconst scheduler = createScheduler({ provider: 'memory' });\n\n// Observe jobRun / jobError / jobScheduled / jobUnscheduled.\nscheduler.on('jobRun', (event) => {\n  if (!event.result.success) {\n    console.error(`Job ${event.jobId} failed`, event.result.error);\n  }\n});"
  },
  {
    label: "Validate expressions",
    lang: "ts",
    code: "// validate-cron.ts\nimport { isValidCronExpression, parseCronExpression } from '@netscript/cron';\n\nif (isValidCronExpression('0 9 * * 1-5')) {\n  const parsed = parseCronExpression('0 9 * * 1-5');\n  console.log(parsed?.hour, parsed?.dayOfWeek);\n}"
  }
] }) }}

## How they compose

The trio is strongest together. A common pattern: a **cron** job wakes on a schedule and
**enqueues** a batch of work; **queue** consumers process each message in parallel; and a **KV**
store holds the cursor, dedupe keys, or rate-limit counters that keep the whole thing idempotent
across restarts. None of these requires you to operate Redis, RabbitMQ, or PostgreSQL during
development — the local Deno KV / in-memory adapters carry the same code until Aspire provisions
the real backends (or until you opt in to the PostgreSQL queue explicitly).

{{ comp.apiTable({
  caption: "Picking the right primitive",
  rows: [
    { name: "Key-value state", type: "@netscript/kv", desc: "Synchronous-feeling read/write state: caches, sessions, flags, counters, cursors. Use TTL for ephemerality and watches for reactivity." },
    { name: "Fire-and-forget work", type: "@netscript/queue", desc: "Decouple slow work from the request path. Fan out to multiple consumers; let the backend handle retries where nativeRetrial is true. Four backends: Deno KV, Redis, AMQP, PostgreSQL." },
    { name: "Time-driven work", type: "@netscript/cron", desc: "Run handlers on a schedule. Pair with a queue to fan a scheduled tick out into many parallel jobs." },
    { name: "Stateful orchestration", type: "durable saga", desc: "When work spans steps with correlation and compensation, a queue is not enough — model it as a durable saga instead." }
  ]
}) }}

{{ comp callout { type: "important", title: "Production notes" } }}
Review these production constraints before deploying: <strong>(1)</strong> the PostgreSQL queue is
<em>never</em> auto-detected — if you forget <code>provider: QueueProvider.Postgres</code> you
silently get the Deno KV fallback. <strong>(2)</strong> <code>retryAttempts</code> /
<code>retryDelay</code> apply <em>only</em> when the backend lacks native retry; check
<code>queue.nativeRetrial</code> before assuming your config is in effect. <strong>(3)</strong>
KV per-key TTL is set via <code>expireIn</code> (milliseconds), not an absolute timestamp.
<strong>(4)</strong> cron <code>timezone</code> defaults to <code>UTC</code> — set it explicitly
for business-hours schedules. <strong>(5)</strong> always <code>await scheduler.stop()</code> and
<code>await queue.stop()</code> on shutdown so in-flight work drains and connections release.
{{ /comp }}

## Reference →

{{ comp.xref({ key: "ref:kv" }) }} · {{ comp.xref({ key: "ref:queue" }) }} ·
{{ comp.xref({ key: "ref:cron" }) }}

{{ comp.featureGrid({ items: [
  {
    title: "Do — Choose a queue provider",
    body: "Task recipe: stand up each primitive in an existing workspace, with the Aspire-provisioned, local-fallback, and explicit-PostgreSQL paths spelled out.",
    href: "/how-to/choose-a-queue-provider/",
    icon: "◆"
  },
  {
    title: "Look up — @netscript/kv reference",
    body: "Full generated API: getKv, WatchableKv, KvSetOptions, SharedKvConfig, the Deno KV / memory / Redis adapters, and the auto-detection table.",
    href: "/reference/kv/",
    icon: "≡"
  },
  {
    title: "Look up — @netscript/queue reference",
    body: "createQueue, createTypedQueue, createParallelQueue, QueueProvider, QueueOptions, MessageQueue<T>, and the Deno KV / Redis / AMQP / PostgreSQL / KV-polling adapters.",
    href: "/reference/queue/",
    icon: "≡"
  },
  {
    title: "Look up — @netscript/cron reference",
    body: "createScheduler, getScheduler, CronPresets, CronScheduler, ScheduleOptions, JobContext, and the Deno.cron() and memory adapters.",
    href: "/reference/cron/",
    icon: "≡"
  },
  {
    title: "Understand — Orchestration with Aspire",
    body: "How the scaffold wires Garnet (Redis) and message brokers as resources, and why auto-detection just works once aspire start is up.",
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
