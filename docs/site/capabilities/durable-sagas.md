---
layout: layouts/base.vto
title: Durable sagas
templateEngine: [vento, md]
prev: { label: "Background jobs", href: "/capabilities/background-jobs/" }
next: { label: "Triggers & ingress", href: "/capabilities/triggers/" }
---

# Durable sagas

A saga is the answer to the question every retry loop dodges: *what happens between
step three and step four when the process dies?* In NetScript a saga is an explicit,
message-driven state machine — you declare the state it carries, the messages it
reacts to, and the effects each handler emits. It is authored with a single fluent
builder, persisted to a durable store, and served by the **sagas plugin** on port
`:8092`. The model is closer to Temporal than to a job queue, but it lives in plain
TypeScript inside your workspace — no separate cluster to operate.

{{ comp.diagram({
  src: "/assets/diagrams/saga-state-machine.svg",
  alt: "Saga state machine: an event advances the saga through typed states, a compensation branch unwinds a failed step, and every transition checkpoints to a kv or prisma store.",
  caption: "A saga is a state machine. Each inbound message runs a handler that mutates typed state and returns an effect ledger (advance, complete, fail, compensate); the runtime checkpoints state between messages to the durable store (kv or prisma) so an instance survives a crash."
}) }}

This is the third capability in the continuous-app thread. The
[background jobs](/capabilities/background-jobs/) capability ended with a job,
`create-user-settings`, that publishes a `UserSettingsCreated` message. Here that
message stops being fire-and-forget: a saga **consumes it**, advances its own state,
and emits a `sagaComplete(...)` effect that the runtime records as a first-class
outcome — and persists durably so the instance survives a process restart.

{{ comp callout { type: "note", title: "Where it lives" } }}
The plugin is installed at <code>plugins/sagas/</code> and referenced by
<code>netscript.config.ts</code> as <code>./plugins/sagas/mod.ts</code>. The fluent
builder and effect helpers come from <code>@netscript/plugin-sagas-core</code>; the
config-time companion (<code>defineSagaConfig</code>) comes from
<code>@netscript/plugin-sagas-core/config</code>; the durable runtime factory
(<code>createDurableSagaRuntime</code>) and the HTTP publisher
(<code>createSagaPublisher</code>) come from the
<code>@netscript/plugin-sagas/runtime</code> subpath. Add it to a workspace with
the public package install flow (<code>netscript plugin install @netscript/plugin-sagas</code>).
For local-source contributor samples inside this monorepo, run
<code>deno run -A packages/cli/bin/netscript-dev.ts plugin install saga --name sagas --samples</code>.
{{ /comp }}

## What it is

A saga is a **durable, message-driven state machine**: a typed state object plus a set
of handlers, one per message type, that advance that state and return an effect ledger.
The runtime persists state between every message, so an instance that is mid-flight when
the process restarts resumes exactly where it left off. Unlike a background job — a
single idempotent unit — a saga correlates many messages into one long-running instance
and gives compensation (the *undo* of an already-applied step) a first-class place in
the model. Read the conceptual companion, the
{{ comp.xref({ key: "explain:durable-workflows" }) }}, for why state must outlive the
process and how effect-based outcomes differ from a retry loop.

## Learn → · Do →

{{ comp.featureGrid({
  columns: 2,
  items: [
    { icon: "◆", title: "Learn — Build the checkout saga", body: "The storefront tutorial rung that adds the sagas plugin, correlates the order events, and compensates a failed payment step.", href: "/tutorials/storefront/04-checkout-saga/" },
    { icon: "→", title: "Do — Wire a durable workflow", body: "Add the sagas plugin to a running app, consume a cross-plugin message, and emit sagaComplete end to end.", href: "/tutorials/storefront/04-checkout-saga/" }
  ]
}) }}

{{ comp.featureGrid({
  columns: 3,
  items: [
    { icon: "◆", title: "Fluent builder", body: "defineSaga(id).durability().state().on().compensate().build() — id, durability tier, typed state, message handlers, compensations, then build(). One chain, fully type-checked." },
    { icon: "▣", title: "Durable store backend", body: "Runtime state persists to kv or prisma, chosen by NETSCRIPT_SAGA_STORE / appsettings. createDurableSagaRuntime({ backend, prisma }) owns the resources." },
    { icon: "≋", title: "Effect-based outcomes", body: "Every handler returns an array of effects — sagaComplete, sagaFail, sagaCompensate, send, schedule, spawn are named outcomes returned from handlers, never a fall-through." },
    { icon: "⊡", title: "Served on :8092", body: "An oRPC API lists registered sagas, inspects running instances, publishes messages, and streams activity over SSE." },
    { icon: "⇄", title: "Cross-plugin choreography", body: "The workers create-user-settings job publishes UserSettingsCreated; this saga consumes it — one message crossing the plugin boundary, type-checked on both sides." },
    { icon: "◷", title: "Crash-survivable", body: "State checkpoints between messages, so an instance picks up exactly where it left off after a restart. That survival is the entire point of a saga." }
  ]
}) }}

## Minimal example — an order saga with compensation

The runnable shape you grow into: a real state type, multiple `.on(...)` handlers, and a
`.compensate(...)` branch that unwinds an already-charged payment when fulfillment fails.
The first handler reserves stock and emits a `send(...)` effect to charge payment; the
failure path returns `sagaCompensate(...)` so the engine routes the matching compensation
handler, which refunds and then fails the instance.

```ts
// plugins/sagas/order-saga.ts
import {
  defineSaga,
  sagaComplete,
  sagaCompensate,
  sagaFail,
  send,
} from '@netscript/plugin-sagas-core';

// The state is the source of truth that survives across messages and crashes.
type OrderState = Readonly<{
  status: 'awaiting-payment' | 'awaiting-fulfillment' | 'completed' | 'refunded';
  orderId?: string;
  paymentId?: string;
}>;

type OrderPlaced = Readonly<{ orderId: string }>;
type PaymentCaptured = Readonly<{ orderId: string; paymentId: string }>;
type FulfillmentFailed = Readonly<{ orderId: string; reason: string }>;

export const orderSaga = defineSaga('order-saga')
  // Durability tier: where the runtime checkpoints state between messages.
  .durability('t1')
  // Typed initial state, seeded once at instance creation.
  .state<OrderState>({ status: 'awaiting-payment' })
  // Handler 1: an order was placed — record it and ask the payment service to charge.
  .on<'OrderPlaced', OrderPlaced>('OrderPlaced', (saga, event) => {
    saga.state = { ...saga.state, orderId: event.payload.orderId };
    // `send` is an effect: dispatch a command to another target, not a direct call.
    return [send({ kind: 'service', id: 'payments' }, { orderId: event.payload.orderId }, {})];
  })
  // Handler 2: payment captured — advance toward fulfillment.
  .on<'PaymentCaptured', PaymentCaptured>('PaymentCaptured', (saga, event) => {
    saga.state = {
      ...saga.state,
      status: 'awaiting-fulfillment',
      paymentId: event.payload.paymentId,
    };
    return [];
  })
  // Handler 3: fulfillment failed AFTER we charged — request the compensation branch.
  .on<'FulfillmentFailed', FulfillmentFailed>('FulfillmentFailed', (saga, event) => {
    return [sagaCompensate({ type: 'FulfillmentFailed', payload: event.payload }, event.payload.reason)];
  })
  // Compensation: undo the already-applied payment, then fail the instance.
  .compensate<'FulfillmentFailed', FulfillmentFailed>('FulfillmentFailed', (saga, event) => {
    saga.state = { ...saga.state, status: 'refunded' };
    return [
      send({ kind: 'service', id: 'payments' }, { refund: saga.state.paymentId }, {}),
      sagaFail(`order ${event.payload.orderId} unfulfilled: ${event.payload.reason}`),
    ];
  })
  .build();

export default orderSaga;
```

{{ comp callout { type: "important", title: "Compensation: a .compensate() branch OR an effect" } }}
There are <strong>two</strong> ways to compensate, and they work together. The builder
exposes a first-class <code>.compensate(eventType, handler)</code> that registers an undo
handler keyed by message type. A running handler routes into it by returning the
<code>sagaCompensate(message, reason?)</code> effect. So a saga's whole lifecycle —
advance, <code>sagaComplete</code>, <code>sagaFail</code>, <code>sagaCompensate</code>,
<code>send</code>, <code>schedule</code>, <code>spawn</code> — is <strong>named outcomes
returned from handlers</strong>, never a fall-through or an unhandled throw. The undo logic
itself lives in the <code>.compensate()</code> handler, not inline in the forward path.
{{ /comp }}

## Key types first

Before the options, the primary interfaces the DSL works in. `SagaState` is the base
shape your typed state must satisfy; `SagaContext` is the read-only context passed to
every handler; `SagaDefinition` is the frozen object `build()` returns and the runtime
registers.

{{ comp.apiTable({
  caption: "Primary saga types (@netscript/plugin-sagas-core)",
  rows: [
    { name: "SagaState", type: "Readonly<Record<string, unknown>>", desc: "Base state shape every saga's typed state must extend. Your State type is intersected with this." },
    { name: "SagaMessage<T, P>", type: "{ type, payload, correlationKey?, idempotencyKey?, concurrencyKey?, occurredAt?, traceparent? }", desc: "The event or command delivered to a handler. `type` discriminates; `payload` is your typed body." },
    { name: "SagaContext<S, M>", type: "{ sagaId, instanceId, correlationKey, state, message, attempt, now, traceparent? }", desc: "Read-only handler context. `now` is the injected clock; `attempt` is the retry count; trace fields carry W3C context." },
    { name: "SagaHandler<S, M>", type: "(saga, event, context) => readonly CascadedMessage[]", desc: "A synchronous handler: it mutates saga.state and RETURNS an effect ledger. No async, no direct I/O." },
    { name: "SagaDefinition<Id, S, M>", type: "Readonly<{ id, durability, initialState, handlers, compensations, correlations, retry?, concurrency?, schedule? }>", desc: "The frozen definition build() produces. Registered into the runtime and into KV under ['saga','registry', id]." },
    { name: "SAGA_DURABILITY_TIERS", type: "readonly ['t1','t2','t3']", desc: "The durability tiers a definition may declare via .durability(tier). 't1' is the scaffolded default." }
  ]
}) }}

## The builder API

A saga is built with `defineSaga(id)` and a typestate chain: `.state()` must come before
any handler, and `.build()` requires at least one handler. These are the methods on the
returned `SagaBuilder`.

{{ comp.apiTable({
  caption: "defineSaga(id) — SagaBuilder methods",
  rows: [
    { name: ".durability(tier)", type: "SagaDurabilityTier ('t1' | 't2' | 't3')", desc: "Set the persistence tier the runtime checkpoints state to. Defaults to t1. Distinct from the kv/prisma store backend (see below)." },
    { name: ".state<S>(initial)", type: "S extends SagaState", desc: "Declare the typed initial state, seeded once at instance creation. MUST be called before any handler (typestate-enforced)." },
    { name: ".on<T, P>(type, handler)", type: "SagaHandler", desc: "Register a forward handler for a message type. Receives (saga, event, context), mutates saga.state, returns an effect ledger." },
    { name: ".compensate<T, P>(type, handler)", type: "SagaHandler", desc: "Register a compensation (undo) handler keyed by message type. Routed when a handler returns sagaCompensate(...)." },
    { name: ".correlate(rule)", type: "SagaCorrelation<M>", desc: "Extract a correlation key from an incoming message so it routes to the right running instance." },
    { name: ".concurrency(opts)", type: "{ limit: number; key?: (m) => string }", desc: "Bound how many messages run at once, optionally per derived key. Overlapping publishes for one key are rejected." },
    { name: ".schedule(cron)", type: "string", desc: "Attach a cron expression that ticks the saga definition on a schedule." },
    { name: ".onSignal(signal, handler)", type: "SignalDefinition, handler", desc: "Register a reserved signal handler (defineSignal). Runtime dispatch is deferred in the alpha." },
    { name: ".onQuery(query, handler)", type: "QueryDefinition, handler", desc: "Register a reserved synchronous read-only query handler (defineQuery). Promises are rejected at type level." },
    { name: ".build()", type: "=> SagaDefinition", desc: "Freeze the chain into a SagaDefinition. Requires at least one .on(...) handler (typestate-enforced)." }
  ]
}) }}

{{ comp.tabbedCode({ tabs: [
  {
    label: "Simple — minimal saga",
    lang: "ts",
    code: "// plugins/sagas/<your-saga>.ts\nimport { defineSaga, sagaComplete } from '@netscript/plugin-sagas-core';\n\ntype State = Readonly<{ status: string; processedAt?: string }>;\n\n// Build a saga: id -> durability tier -> typed state -> message handlers -> build().\nexport const userSettingsSaga = defineSaga('user-settings-saga')\n  .durability('t1')\n  .state<State>({ status: 'pending' })\n  .on<'UserSettingsCreated', { userId: string }>(\n    'UserSettingsCreated',\n    (saga, event, context) => {\n      // Advance the saga's own state, then emit completion as a recorded outcome.\n      saga.state = {\n        ...saga.state,\n        status: 'completed',\n        processedAt: context.now.toISOString(),\n      };\n      return [sagaComplete({\n        userId: event.payload.userId,\n        processedAt: context.now.toISOString(),\n      })];\n    },\n  )\n  .build();\n\nexport default userSettingsSaga;"
  },
  {
    label: "Config-time companion",
    lang: "ts",
    code: "// netscript.config.ts (excerpt)\nimport { defineSagaConfig } from '@netscript/plugin-sagas-core/config';\n\n// The config-time entry the scaffolder + CLI read. SEPARATE from the runtime\n// definition that defineSaga(...).build() produces.\nexport const orderSagaEntry = defineSagaConfig('order-saga', './plugins/sagas/order-saga.ts')\n  .name('Order saga')\n  .description('Reserve, charge, fulfill — with a compensation branch.')\n  .topic('orders')\n  .tags(['orders', 'checkout'])\n  .build();"
  }
] }) }}

## Effect helpers

A handler's only side effect is the array of **cascaded messages** it returns. These
helpers (`@netscript/plugin-sagas-core`) construct the named effects. Every kind in
`CASCADED_MESSAGE_KINDS` (`send | scheduled | spawn | complete | fail | compensate`) has
a constructor.

{{ comp.apiTable({
  caption: "Effect helpers — saga handler outcomes",
  rows: [
    { name: "sagaComplete(result?)", type: "=> CascadedMessage<'complete'>", desc: "Terminal success. Marks the instance finished and records the optional result payload." },
    { name: "sagaFail(reason)", type: "string | Error => CascadedMessage<'fail'>", desc: "Terminal failure. Records the reason; no further messages are applied to the instance." },
    { name: "sagaCompensate(message, reason?)", type: "=> CascadedMessage<'compensate'>", desc: "Route into the matching .compensate(type, ...) handler to undo an already-applied step." },
    { name: "send(target, payload, options)", type: "=> CascadedMessage<'send'>", desc: "Dispatch a command to a target (job, saga, or runtime adapter). options carry idempotencyKey / concurrencyKey / retry / queue." },
    { name: "schedule(message, delay)", type: "delay: Date | number | '5m' => CascadedMessage<'scheduled'>", desc: "Deliver a wrapped message after a delay (a Date, ms, or a '30s'/'5m'/'2h'/'1d' string)." },
    { name: "spawn(child, input, options)", type: "=> CascadedMessage<'spawn'>", desc: "Start a child saga from a definition or id, passing typed input. options take idempotencyKey / concurrencyKey." }
  ]
}) }}

## createParallelQueue — fan-out and concurrent processing

Saga handlers stay synchronous and pure; the *transport* layer that carries cascaded
messages and feeds fan-out work is where you tune concurrency. `createParallelQueue` (from
{{ comp.xref({ key: "ref:queue", text: "@netscript/queue" }) }}) is the primitive for
that: it wraps a base queue so a single listener processes several messages at once. It is
the right tool when a saga spawns many independent children or pushes I/O-bound side work
(API calls, DB writes) that should run in parallel rather than one at a time. The
`concurrency` option is the whole story — `1` is plain sequential, anything higher enables
parallel processing.

{{ comp.apiTable({
  caption: "createParallelQueue(name, options) — ParallelQueueOptions (extends QueueOptions)",
  rows: [
    { name: "concurrency", type: "number (default 1)", desc: "Number of concurrent processors. Must be >= 1; values > 1 wrap the queue for parallel listening. Use for I/O-bound work; for CPU-bound work prefer web-worker tasks." },
    { name: "provider", type: "QueueProvider ('deno-kv' | 'redis' | 'rabbitmq' | 'postgres')", desc: "Backing queue provider. Omit to auto-discover from the Aspire environment." },
    { name: "autoDiscover", type: "boolean (default true)", desc: "Discover a queue service from Aspire. Priority RabbitMQ > Redis > Deno KV." },
    { name: "retryAttempts", type: "number (default 3)", desc: "Max retry attempts for failed messages, when the backend lacks native retry." },
    { name: "retryDelay", type: "number ms (default 1000)", desc: "Delay between retries, when the backend lacks native retry." },
    { name: "connection", type: "QueueConnectionOptions", desc: "Provider-specific connection options (denoKv / redis / rabbitmq / postgres)." },
    { name: "deadLetterStore", type: "DeadLetterStorePort", desc: "Where terminal message failures land. Omit to use the provider's durable default." },
    { name: "disableAutoTracing", type: "boolean (default false)", desc: "Skip the automatic TracedQueue wrapper when you trace manually." }
  ]
}) }}

```ts
// plugins/sagas/fan-out.ts — process saga side-effects concurrently
import { createParallelQueue, QueueProvider } from '@netscript/queue';

type NotifyMessage = Readonly<{ orderId: string; channel: 'email' | 'sms' }>;

// Four messages processed at a time on a single listener — for I/O-bound fan-out
// (notifications, webhook calls) a saga emits as it advances.
const notifications = createParallelQueue<NotifyMessage>('order-notifications', {
  concurrency: 4,
  provider: QueueProvider.Redis,
});

await notifications.listen(async (message) => {
  // These run up to 4 at a time, not serially.
  await deliverNotification(message.orderId, message.channel);
});
```

{{ comp callout { type: "note", title: "Concurrency lives in two places" } }}
<code>createParallelQueue({ concurrency })</code> tunes how many <em>queue</em> messages a
listener processes at once. <code>defineSaga().concurrency({ limit, key })</code> bounds
how many messages run against one <em>saga instance</em> (or per derived key) — overlapping
publishes for the same key are rejected. Use the queue knob for fan-out throughput; use the
builder knob to serialize work on a single business entity (one order, one tenant).
{{ /comp }}

## Choosing a durable store backend

Authoring a saga decides *what* it does. The **durable store backend** decides *where
its runtime state lives between messages and across crashes*. NetScript ships two
backends, and the choice is **explicit and mandatory** — the runtime refuses to start
without one.

- **`kv`** — durable saga state in Deno KV (the orchestration store stood up by
  Aspire). Zero extra schema; the natural default for a single-service app and for
  local development.
- **`prisma`** — durable saga state in your scaffolded relational database via Prisma
  (Postgres in the recommended setup; equally `mysql` / `mssql` / `sqlite`, since the store writes through
  your project's Prisma client — it is not Postgres-specific). The `PrismaSagaStore`
  writes the dedicated runtime tables `saga_runtime_state`, `saga_runtime_transition`,
  and `saga_runtime_correlation`. Reach for this when you want the saga's own write
  path in your relational database alongside the rest of your data, with SQL-level
  inspection of in-flight state and transition history.

You select the backend with the `NETSCRIPT_SAGA_STORE` environment variable (`kv` | `prisma`) or the appsettings key `sagas.store.backend`. The plugin service resolves this on startup via `resolveSagaStoreBackend(...)`, which **throws** if neither is set — there is no silent default in the resolver, by design, so a deployment can never guess wrong about where durable state lands. (Calling `createDurableSagaRuntime(...)` directly without a `backend` falls back to the KV store; the mandatory-selection guarantee comes from the resolver the service runs at startup.)

{{ comp.apiTable({
  caption: "Durable saga store backends — trait matrix",
  rows: [
    { name: "kv", type: "Deno KV", desc: "Default for local/single-service. No extra schema. Provisioned by Aspire (Redis/KV). Resolved via NETSCRIPT_SAGA_STORE=kv or sagas.store.backend=kv." },
    { name: "prisma", type: "Relational / Prisma", desc: "Writes saga_runtime_state, saga_runtime_transition, saga_runtime_correlation. Requires a Prisma client passed to createDurableSagaRuntime — so it follows whatever engine you scaffolded (Postgres in the recommended setup; mysql / mssql / sqlite all work). SQL-inspectable in-flight state. Resolved via NETSCRIPT_SAGA_STORE=prisma or sagas.store.backend=prisma." },
    { name: "selection", type: "mandatory", desc: "No implicit default. resolveSagaStoreBackend(...) throws when neither NETSCRIPT_SAGA_STORE nor sagas.store.backend is set." },
    { name: "client requirement", type: "prisma only", desc: "backend: 'prisma' (or passing prisma) without a Prisma client throws 'Prisma saga store backend requires a Prisma client.'" }
  ]
}) }}

The factory that owns these resources is `createDurableSagaRuntime(...)` from the
`@netscript/plugin-sagas/runtime` subpath. It resolves a `SagaStorePort`, builds the
native runtime over it, and hands you back a `dispose()` that closes the store (and the
KV handle it opened).

{{ comp.tabbedCode({ tabs: [
  {
    label: "kv backend",
    lang: "ts",
    code: "import { createDurableSagaRuntime } from '@netscript/plugin-sagas/runtime';\n\n// Deno KV durable store — the default for local/single-service apps.\n// Selected at deploy time by NETSCRIPT_SAGA_STORE=kv (or appsettings sagas.store.backend=kv).\nconst { runtime, store, dispose } = await createDurableSagaRuntime({\n  backend: 'kv',\n  // kv is opened for you if you don't inject one (openSagaRuntimeKv()).\n});\n\n// ... register saga definitions on `runtime`, process messages ...\n\nawait dispose(); // closes the KV-backed store + handle"
  },
  {
    label: "prisma backend",
    lang: "ts",
    code: "import { createDurableSagaRuntime } from '@netscript/plugin-sagas/runtime';\nimport { PrismaClient } from './generated/prisma/client.ts';\n\n// Postgres/Prisma durable store — writes saga_runtime_* tables.\n// Selected at deploy time by NETSCRIPT_SAGA_STORE=prisma.\nconst prisma = new PrismaClient();\nconst { runtime, store, dispose } = await createDurableSagaRuntime({\n  backend: 'prisma',\n  prisma, // REQUIRED for prisma — omitting it throws.\n});\n\n// ... register saga definitions, process messages — transitions land in\n// saga_runtime_state / saga_runtime_transition / saga_runtime_correlation ...\n\nawait dispose();"
  },
  {
    label: "resolve from env / appsettings",
    lang: "ts",
    code: "import { createDurableSagaRuntime } from '@netscript/plugin-sagas/runtime';\nimport { resolveSagaStoreBackend } from '@netscript/plugin-sagas-core/stores';\n\n// Read the backend from the environment (or appsettings) — throws if unset.\nconst backend = resolveSagaStoreBackend({\n  env: Deno.env.toObject(),\n  // appsettings: loadedAppsettings, // sagas.store.backend\n});\n\nconst runtime = await createDurableSagaRuntime({\n  backend,\n  prisma: backend === 'prisma' ? prismaClient : undefined,\n});"
  }
] }) }}

{{ comp callout { type: "important", title: "Two durability concepts — don't conflate them" } }}
<code>.durability('t1')</code> on the <strong>saga definition</strong> selects a
<em>durability tier</em> (<code>SAGA_DURABILITY_TIERS</code>) — a property of the saga
itself. The <strong>store backend</strong> (<code>kv</code> | <code>prisma</code>) is a
<em>runtime/deployment</em> choice about <em>which database</em> holds durable state,
resolved by <code>NETSCRIPT_SAGA_STORE</code> / <code>sagas.store.backend</code>. A
saga keeps its declared tier regardless of which backend you deploy against.
{{ /comp }}

{{ comp callout { type: "note", title: "Read model vs. durable write path" } }}
The Prisma backend's <code>saga_runtime_*</code> tables are the durable
<strong>write path</strong> the engine checkpoints to. They are distinct from
<code>saga_instances</code> (and <code>saga_execution_history</code>) — a
<strong>read-model projection</strong> into Postgres for API queries, analytics, and
debugging. The runtime persists to the former; the API surface lists from the latter.
{{ /comp }}

## The HTTP publisher — createSagaPublisher

A message reaches a saga through a **publisher**. `createSagaPublisher` (from
`@netscript/plugin-sagas/runtime`) returns a `SagaPublisherPort` whose `publish(...)` POSTs
to the sagas API publish endpoint, discovering the service URL from the Aspire environment
by default. The workers `create-user-settings` job uses exactly this to emit
`UserSettingsCreated` across the plugin boundary.

{{ comp.apiTable({
  caption: "createSagaPublisher(options) — HttpSagaPublisherOptions",
  rows: [
    { name: "serviceName", type: "string", desc: "Aspire service name to resolve a base URL from. Defaults to the sagas service discovery name." },
    { name: "baseUrl", type: "string", desc: "Explicit base URL override; skips discovery when set." },
    { name: "publishPath", type: "string (default '/api/v1/sagas/publish')", desc: "Path the publisher POSTs each message to." },
    { name: "headers", type: "Record<string, string>", desc: "Extra headers sent with every publish (auth, tenant routing)." },
    { name: "retryableStatusCodes", type: "readonly number[] (default 408,409,425,429,5xx)", desc: "HTTP statuses treated as retryable so the receipt is marked retryable." },
    { name: "id", type: "string (default 'http-saga-publisher')", desc: "Stable publisher id surfaced in diagnostics." },
    { name: "fetcher / readEnv", type: "boundary fns", desc: "Test/injection seams for the fetch implementation and the env reader used for discovery." }
  ]
}) }}

The port returns a typed **receipt** rather than throwing: `publish(...)` resolves a
`SagaPublisherResult` — either `{ published: true, ... }` (a `SagaPublisherReceipt`) or
`{ published: false, reason, retryable }` (a `SagaPublisherRejected`). `publishMany(...)`
takes a `mode: 'sequential' | 'parallel'` so a batch can fan out.

{{ comp.tabbedCode({ tabs: [
  {
    label: "The job that publishes (workers)",
    lang: "ts",
    code: "// plugins/workers/jobs/create-user-settings.ts (core, verbatim from the scaffold)\nimport { createSagaPublisher } from '@netscript/plugin-sagas/runtime';\nimport { createSuccessResult, defineJobHandler } from '@netscript/plugin-workers-core';\nimport { z } from 'zod';\n\nconst PayloadSchema = z.object({ userId: z.string().min(1) });\nconst sagaPublisher = createSagaPublisher<UserRegistrationMessage>();\n\nconst handler = defineJobHandler(async (ctx) => {\n  const { userId } = PayloadSchema.parse(ctx.payload ?? {});\n  // This is the message the saga below consumes — a typed receipt comes back.\n  await sagaPublisher.publish({ type: 'UserSettingsCreated', payload: { userId } });\n  return createSuccessResult({ userId, settingsCreated: true });\n});\n\nexport default Object.assign(handler, { id: 'create-user-settings' });"
  },
  {
    label: "The saga that consumes (sagas)",
    lang: "ts",
    code: "// plugins/sagas/user-settings-saga.ts\nimport { defineSaga, sagaComplete } from '@netscript/plugin-sagas-core';\n\ntype State = Readonly<{ status: string; processedAt?: string }>;\n\nexport const userSettingsSaga = defineSaga('user-settings-saga')\n  .durability('t1')\n  .state<State>({ status: 'pending' })\n  .on<'UserSettingsCreated', { userId: string }>(\n    'UserSettingsCreated',\n    (saga, event, context) => {\n      saga.state = { ...saga.state, status: 'completed', processedAt: context.now.toISOString() };\n      return [sagaComplete({ userId: event.payload.userId, processedAt: context.now.toISOString() })];\n    },\n  )\n  .build();"
  }
] }) }}

## Extension points

The current scaffold uses the curated defaults, but the core package exposes the seams the
plugin is composed from. Each is a subpath of `@netscript/plugin-sagas-core` — cite the
sub-path in prose and look it up under {{ comp.xref({ key: "ref:sagas" }) }} (e.g.
`reference/sagas/presets`, `reference/sagas/transports`).

{{ comp.apiTable({
  caption: "Saga extension seams (@netscript/plugin-sagas-core subpaths)",
  rows: [
    { name: "/presets", type: "startSagas(), startSagaHandlers()", desc: "Composition helpers that build a runtime from explicit definitions and return a { runtime, bus, sagaCount, shutdown } bundle. startSagaHandlers is the distributed-handler alias." },
    { name: "/middleware", type: "createSagaMiddleware(), createSSEEventsMiddleware()", desc: "Hono middleware that injects saga helpers into request context, plus SSE event emission with optional durable history (SagaHistoryWriter)." },
    { name: "/transports", type: "createGarnetListTransport(), createNetScriptRedisTransport()", desc: "At-least-once delivery adapters: a Garnet/Redis LIST transport and a Redis Streams transport, both with immediate + delayed publish and ack/nack." },
    { name: "/agent", type: "agent surface", desc: "Agent integration seam for the plugin's agent-facing surface (alpha)." },
    { name: "/integration/publisher", type: "SagaPublisherPort", desc: "The publisher boundary createSagaPublisher implements — publish() / publishMany() with typed receipts." },
    { name: "/integration/workers", type: "workers bridge", desc: "The seam that lets a workers job emit and consume saga messages across the plugin boundary." }
  ]
}) }}

{{ comp callout { type: "tip", title: "Default transport vs. Redis/Garnet" } }}
The scaffolded sagas service runs over the in-process native runtime and Deno KV. The
<code>/transports</code> adapters (<code>createGarnetListTransport</code>,
<code>createNetScriptRedisTransport</code>) are for <strong>multi-process or distributed</strong>
delivery — when saga handlers run as separate processes and need at-least-once delivery with
consumer groups, delayed messages, and dead-letter handling. Reach for them only when a single
process is no longer enough; the KV path covers local and single-service apps.
{{ /comp }}

## Endpoints and ports

The sagas plugin runs an oRPC API service on `:8092`. It lists registered sagas and
inspects running instances; the registry is backed by Deno KV. These are the routes
the live scaffold serves — see {{ comp.xref({ key: "ref:sagas" }) }} for the full
generated surface.

{{ comp.apiTable({
  caption: "Sagas plugin — runtime endpoints (port :8092)",
  rows: [
    { name: "GET /health/live", type: "liveness", desc: "Liveness probe for the sagas API service." },
    { name: "GET /api/v1/sagas/sagas", type: "registry", desc: "List the saga definitions registered into KV (id, name, topic, handled message types, enabled)." },
    { name: "GET /api/v1/sagas/instances", type: "instances", desc: "List running and completed saga instances. Inspect one with /instances/{sagaName}/{correlationId}." },
    { name: "POST /api/v1/sagas/publish", type: "publish", desc: "Publish a message to the saga bus — the same path createSagaPublisher POSTs to and the workers create-user-settings job uses." },
    { name: "GET /api/v1/sagas/subscribe", type: "stream (SSE)", desc: "Server-sent-events stream of saga activity (saga:started / state_changed / completed / failed / compensating), KV-watch backed." }
  ]
}) }}

## The continuous-app choreography

The thread that ties the capabilities together is real and it compiles. The workers
plugin's `create-user-settings` job calls a saga publisher and emits
`UserSettingsCreated`; this saga's `.on('UserSettingsCreated', ...)` handler consumes
it and emits `sagaComplete(...)`. One message crosses the plugin boundary, and both
halves are type-checked against the same message type.

After both plugins are running under Aspire, trigger the workers job
(`POST :8091/api/v1/workers/jobs/create-user-settings/trigger`) and watch the saga
appear at `GET :8092/api/v1/sagas/instances` — the message crossed the boundary and a
durable instance recorded its completion. Whether that durable instance lives in Deno
KV or in your `saga_runtime_*` Postgres tables is exactly the `NETSCRIPT_SAGA_STORE`
choice above.

## Production notes

{{ comp callout { type: "warning", title: "Aspire first, then anything stateful" } }}
The sagas service needs Postgres and Redis up before it can persist and list
instances. Bring orchestration up first — <code>cd aspire &amp;&amp; aspire start</code>
(dashboard at <a href="https://localhost:18888"><code>https://localhost:18888</code></a>) —
<em>before</em> any <code>netscript db</code> command or before you expect
<code>/api/v1/sagas/instances</code> to return durable state. This holds for both
backends: <code>kv</code> needs Redis/KV up, and <code>prisma</code> needs Postgres up
with the <code>saga_runtime_*</code> tables migrated. DB commands require Aspire running
first.
{{ /comp }}

{{ comp callout { type: "important", title: "Handlers are synchronous and pure" } }}
A <code>SagaHandler</code> returns <code>readonly CascadedMessage[]</code> — it is
<strong>synchronous</strong> and does no direct I/O. All side effects (charging payment,
sending mail, spawning a child) are expressed as <em>effects</em> the runtime applies, so
the handler is replayable and crash-safe. Do not <code>await</code> a network call inside a
handler; emit a <code>send(...)</code> effect and let the target do the work. Compensation
follows the same rule — its undo runs in the <code>.compensate()</code> handler as more
effects, not as inline cleanup.
{{ /comp }}

## Why a saga, and why not

{{ comp callout { type: "tip", title: "Reach for a saga when…" } }}
You have a multi-step process where steps can fail independently and the
<strong>state between steps must survive a crash</strong> — onboarding, checkout,
provisioning. The correlation, persistence, and named completion/failure/compensation
outcomes are exactly what a hand-rolled retry loop lacks. Pick <code>prisma</code> as the
store backend when you also want that in-flight state queryable in your relational database.
{{ /comp }}

{{ comp callout { type: "warning", title: "Don't reach for a saga when…" } }}
The work is a single idempotent unit with no inter-step state — that is a
<a href="/capabilities/background-jobs/">background job</a>, not a saga. And remember
the alpha reality: durability and the instance store depend on the orchestration stack
being up via Aspire (Redis/KV for <code>kv</code>, Postgres for <code>prisma</code>),
so a saga is not a substitute for a database transaction within one handler.
{{ /comp }}

## Reference →

{{ comp.featureGrid({
  columns: 2,
  items: [
    { icon: "≡", title: "Look up — sagas reference", body: "The full generated @netscript/plugin-sagas API: the defineSaga builder, durability tiers, createDurableSagaRuntime, the kv/prisma store backends, effect helpers, presets/middleware/transports seams, and every :8092 route.", href: "/reference/sagas/" },
    { icon: "✲", title: "Understand — the durability model", body: "Why a saga's state must outlive the process, how effect-based outcomes differ from a retry loop, and where the kv vs prisma backends fit.", href: "/explanation/durability-model/" },
    { icon: "◆", title: "Learn — Storefront checkout saga", body: "Build the order/checkout saga with a compensation branch as part of the storefront tutorial track.", href: "/tutorials/storefront/04-checkout-saga/" },
    { icon: "▣", title: "Look up — queue reference", body: "createParallelQueue, createQueue, providers, and connection options for the fan-out concurrency primitive.", href: "/reference/queue/" }
  ]
}) }}

{{ comp.nextPrev({
  prev: { label: "Background jobs", href: "/capabilities/background-jobs/" },
  next: { label: "Triggers & ingress", href: "/capabilities/triggers/" }
}) }}
