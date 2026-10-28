---
layout: layouts/base.vto
title: KV, queues & cron
templateEngine: [vento, md]
order: 2
---

# KV, queues & cron

This page explains NetScript's three integration packages: `@netscript/kv` for cache and session
state, `@netscript/queue` for fire-and-forget work and `@netscript/cron` for time-driven jobs. Each
exposes one typed contract over several backends and **auto-detects** the best available adapter
from the Aspire environment. A zero-config local fallback lets the same code run on a laptop and in
production, without branching on "is this local or Aspire?" in product code.

{{ comp.diagram({
  src: "/assets/diagrams/queue-worker-scheduler.svg",
  alt: "A cron schedule fires a tick that enqueues work onto a provider-agnostic queue; one or more worker listeners drain the queue in parallel while a KV store holds cursors, dedupe keys, and counters that keep the loop idempotent.",
  caption: "The trio in one loop: cron tick → enqueue → parallel queue listeners → KV state holds the cursor, dedupe keys, and counters."
}) }}

## Which primitive to use

{{ comp.apiTable({
  caption: "Picking the right primitive",
  rows: [
    { name: "Key-value state", type: "@netscript/kv", desc: "Synchronous-feeling read/write state: caches, sessions, flags, counters, cursors. Use TTL for ephemerality and watches for reactivity." },
    { name: "Fire-and-forget work", type: "@netscript/queue", desc: "Decouple slow work from the request path. Fan out to multiple consumers; let the backend handle retries where nativeRetrial is true. Four backends: Deno KV, Redis, AMQP, PostgreSQL." },
    { name: "Time-driven work", type: "@netscript/cron", desc: "Run handlers on a schedule. Pair with a queue to fan a scheduled tick out into many parallel jobs." },
    { name: "Stateful orchestration", type: "durable saga", desc: "When work spans steps with correlation and compensation, a queue is not enough — model it as a durable saga instead." }
  ]
}) }}

For inbound HTTP that kicks off work, use a [trigger](/durable-workflows/triggers/). For
message-driven, long-running orchestration with state, use a
[durable saga](/durable-workflows/sagas/).

## One API, many backends

Each package keeps one typed contract with several adapters behind it, and provider selection
resolves from the environment. The matrix lists every backend, the capabilities it supports and how
it is chosen.

BullMQ is a Redis-backed queue library, and Celery requires a broker such as RabbitMQ or Redis; in
both cases that infrastructure must run before the first job enqueues. `createQueue()` starts on
local Deno KV with nothing to provision, and moving to Redis or RabbitMQ is an environment change,
not a code change.

{{ comp.apiTable({
  caption: "Adapter × capability — supported backends and how they are selected",
  rows: [
    { name: "Deno KV", type: "kv · queue · cron", desc: "Default zero-config fallback. KV stores locally; the queue uses native Deno KV queue ops, routing each message by queue name so named queues on one database never consume each other's messages (listen to all of them from one process: a message whose name has no listener there is re-enqueued a few times, then dead-lettered as 'unroutable'); cron shares the same local-first philosophy via Deno.cron(). No external service required." },
    { name: "memory", type: "kv · cron", desc: "Process-local. MemoryKvAdapter for KV (must be constructed explicitly) and the in-memory cron adapter (provider: 'memory') — deterministic for tests. The KV default for local development without Redis is Deno KV (local file), not the in-memory adapter." },
    { name: "Redis / Garnet", type: "kv · queue", desc: "Production cache and queue backend. Selected when CACHE_PROVIDER=redis|garnet, REDIS_URI/GARNET_URI, or Aspire services__redis__*/services__garnet__* are present. Redis is the default cache Aspire provisions; Garnet is the Redis-compatible alternative via --cache-backend garnet." },
    { name: "RabbitMQ (AMQP)", type: "queue", desc: "Durable broker for high-throughput, multi-consumer queues. Chosen first by auto-detection when Aspire reports a rabbitmq service. Imported via @netscript/queue/adapters/amqp for direct access." },
    { name: "PostgreSQL", type: "queue", desc: "Durable SQL-backed queue (FOR UPDATE SKIP LOCKED row-claim, visibility timeout, ack/nack, DLQ). EXPLICIT-PROVIDER ONLY — set provider: QueueProvider.Postgres; never auto-detected. Configure connection.postgres.{url,tableName}." },
    { name: "KV-polling", type: "queue", desc: "KvPollingAdapter — used automatically when the Deno KV path is a remote HTTP/HTTPS endpoint (KV Connect), where native queue ops are unavailable. Tunable via connection.denoKv.{pollInterval,visibilityTimeout,maxRetries}." },
    { name: "Deno.cron()", type: "cron", desc: "Native runtime scheduler. Used by createScheduler() whenever the runtime exposes Deno.cron(); falls back to the in-memory adapter otherwise." }
  ]
}) }}

> [!WARNING]
> The queue's auto-detection order is **RabbitMQ → Redis → Deno KV**; it never selects PostgreSQL.
> The Postgres backend is a durable adapter (`FOR UPDATE SKIP LOCKED` row-claiming, visibility
> timeout, ack/nack, dead-letter store), but you must opt in with `provider: QueueProvider.Postgres`
> or the string `'postgres'`. `connection.postgres.url` is optional and falls back to the
> Aspire-provisioned Postgres URI; `tableName` defaults to `message_queue`. Use it when queue state
> should live in the same transactional database as your domain data.

> [!IMPORTANT]
> Auto-detection upgrades to Redis/Garnet and RabbitMQ only while those resources are **running**,
> so start orchestration first with `cd aspire && aspire start`. Without Aspire, KV and the queue fall
> back to local Deno KV and cron to the in-memory adapter; your code is identical either way. See
> [Orchestration with Aspire](/explanation/aspire/).

## KV

`getKv(config?)` returns a `WatchableKv` bound to the auto-detected backend. Keys are typed tuples,
values are fully typed, and `KvSetOptions.expireIn` (milliseconds) sets a per-key TTL on every
adapter. Pass a `SharedKvConfig` to override provider selection on first access.

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

The same module also exposes `closeKv()`, `resetKv()` (for tests), `getRawKv()` (the underlying
`Deno.Kv` when the provider is Deno KV), `getActiveProvider()`, `isKvInitialized()` and the
`isWatchable()` type guard.

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

## Queues

`createQueue<T>(name, options?)` returns a `MessageQueue<T>` over the auto-detected backend. The
factory stays synchronous; the Redis, RabbitMQ (AMQP) and PostgreSQL adapters load lazily on first use
and stay out of your module graph until then. Producers call `enqueue(message, options?)`, consumers
call `listen(handler, options?)`, and `stop()` drains and releases the connection. The
`QueueProvider` enum names the four backends: `DenoKv`, `Redis`, `RabbitMQ` and `Postgres`.

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

`createTypedQueue(name, schema, options?)` wraps a Zod schema and validates on enqueue and dequeue.
Its `TypedQueueOptions` add `validateOnEnqueue` (default true), `validateOnDequeue` (default true) and
`onValidationError` (`'discard'` by default, `'dlq'` or `'throw'`). `createParallelQueue` takes the
same options plus a `concurrency` count.

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

> [!NOTE]
> When telemetry is enabled, `createQueue()` wraps the queue with `@netscript/telemetry`, so enqueue
> and consume spans appear in the Aspire dashboard beside RPC and SSE work. Set
> `disableAutoTracing: true` to wire spans by hand. See
> [Telemetry & logging](/observability/telemetry/).

## Cron

`createScheduler(options?)` returns a `CronScheduler` that uses native `Deno.cron()` when the runtime
exposes it and an in-memory adapter otherwise. `schedule(id, expression, handler, options?)` registers
a job from a standard cron expression or a `CronPresets` constant and resolves to a `ScheduledJob`.
`trigger(id)` fires a job manually, which helps in tests; `unschedule(id)` removes one; `stop()` tears
the scheduler down. For single-scheduler apps, `getScheduler()` returns a shared singleton
(`stopScheduler()` resets it). The handler may be a bare `JobHandler` or a `ContextualJobHandler` that
receives a `JobContext` (`jobId`, `scheduledTime`, `actualTime`, `attempt`, `signal`).

Retry behavior is the same for the memory and native `Deno.cron()` providers. `maxRetries` counts
retries after the initial handler call, so attempts are numbered `0..maxRetries` and the handler runs
at most `maxRetries + 1` times. The default is zero retries. Without `backoff`, configured retries run
immediately.

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
    { name: "backoff", type: "BackoffStrategy?", desc: "Optional delay policy between retries: fixed, exponential, or linear. Delays are milliseconds; maxDelay caps every computed delay." },
    { name: "maxRetries", type: "number? = 0", desc: "Retries after attempt 0. Total handler calls are at most maxRetries + 1." },
    { name: "metadata", type: "Record<string, unknown>?", desc: "Arbitrary metadata stored with the job and surfaced on its ScheduledJob record." }
  ]
}) }}

For retry number `r` (the one-based retry after handler attempt `r - 1`), fixed backoff waits
`initialDelay`, exponential waits `initialDelay * (multiplier ?? 2)^(r - 1)`, and linear waits
`initialDelay * r`. `maxDelay`, when present, caps the result for every policy. `unschedule()` and
`stop()` abort an in-progress backoff wait and do not start another handler attempt.

Lifecycle reporting stays aggregate for compatibility. Each scheduled or manual invocation updates
`ScheduledJob.runCount` once and emits exactly one terminal event: `jobRun` after eventual success, or
`jobError` after the retry budget is exhausted or backoff is aborted. The event's `result.attempt` is
the terminal zero-based handler attempt; intermediate failures emit no terminal events.

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
    code: "// observe-jobs.ts\nimport { createScheduler } from '@netscript/cron';\n\nconst scheduler = createScheduler({ provider: 'memory' });\n\n// Observe one terminal event per invocation, even when retries occur.\nscheduler.on('jobRun', (event) => {\n  console.log(`Job ${event.jobId} succeeded on attempt ${event.result.attempt}`);\n});\nscheduler.on('jobError', (event) => {\n  console.error(`Job ${event.jobId} failed on attempt ${event.result.attempt}`, event.result.error);\n});"
  },
  {
    label: "Validate expressions",
    lang: "ts",
    code: "// validate-cron.ts\nimport { isValidCronExpression, parseCronExpression } from '@netscript/cron';\n\nif (isValidCronExpression('0 9 * * 1-5')) {\n  const parsed = parseCronExpression('0 9 * * 1-5');\n  console.log(parsed?.hour, parsed?.dayOfWeek);\n}"
  }
] }) }}

## How they compose

A common pattern uses all three: a **cron** job wakes on a schedule and **enqueues** a batch of work,
**queue** consumers process each message in parallel, and a **KV** store holds the cursor, dedupe keys
or rate-limit counters that keep the loop idempotent across restarts.

Keep queue payloads small: enqueue a reference, not the bytes. A job that carries a raw file or image
works until the payload outgrows the backend's message limit (Deno KV caps values at 64 KiB), and then
the enqueue itself fails. Enqueue a small identifier, store the bytes behind a service, and have the
consumer fetch them over a [typed service call](/services-sdk/sdk/). The queue then only moves
pointers, and the same payload works on every backend in the matrix.

## Production notes

- `retryAttempts` and `retryDelay` apply **only** when the backend lacks native retry. Check
  `queue.nativeRetrial` before assuming your config is in effect.
- KV per-key TTL is set with `expireIn` in milliseconds, not with an absolute timestamp.
- Cron `timezone` defaults to `UTC`. Set it explicitly for business-hours schedules.
- Always `await scheduler.stop()` and `await queue.stop()` on shutdown so in-flight work drains and
  connections close.

## Next steps

Use these primitives in code with the
[Use KV, queues, and cron](/data-persistence/how-to/queue-kv-cron/) recipe.

- [Choose a queue provider](/data-persistence/how-to/choose-a-queue-provider/): auto-discovery,
  explicit providers and the PostgreSQL backend.
- {{ comp.xref({ key: "ref:kv" }) }} · {{ comp.xref({ key: "ref:queue" }) }} ·
  {{ comp.xref({ key: "ref:cron" }) }}: the full generated APIs.
- [Telemetry & logging](/observability/telemetry/): how queue and scheduler spans reach the Aspire
  dashboard.
