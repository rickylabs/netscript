---
layout: layouts/base.vto
title: Durable sagas
templateEngine: [vento, md]
prev: { label: "Background jobs", href: "/background-processing/workers/" }
next: { label: "Triggers & ingress", href: "/durable-workflows/triggers/" }
order: 1
---

# Durable sagas

This page covers durable sagas: message-driven state machines whose state survives a process
crash. You author a saga with one fluent builder, the runtime persists it to a durable store, and
the **sagas plugin** serves it on its assigned port.

Consider the [storefront checkout saga](/tutorials/storefront/04-checkout-saga/). A payment is
captured, fulfillment fails, and the process restarts in between. A saga keeps that in-between state
durable and gives the undo, the refund, a declared place in the definition. Recovery then means
reading state, not reconstructing intent.

{{ comp.diagram({
  src: "/assets/diagrams/saga-state-machine.svg",
  alt: "Saga state machine: an event advances the saga through typed states, a compensation branch unwinds a failed step, and every transition checkpoints to a kv or prisma store.",
  caption: "A saga is a state machine. Each inbound message runs a handler that mutates typed state and returns an effect ledger (advance, complete, fail, compensate); the runtime checkpoints state between messages to the durable store (kv or prisma) so an instance survives a crash."
}) }}

## What it is

A saga is a typed state object plus one handler per message type. Each handler advances the state
and returns an effect ledger. The runtime persists state between messages, so an instance that is
mid-flight when the process restarts resumes where it left off. A background job is a single
idempotent unit; a saga correlates many messages into one long-running instance and gives
compensation, the undo of an already-applied step, a declared place in the model. The
{{ comp.xref({ key: "explain:durable-workflows" }) }} explains why state must outlive the process.

| You need | Import from |
| --- | --- |
| The fluent builder and effect helpers | `@netscript/plugin-sagas-core` |
| The config-time companion, `defineSagaConfig` | `@netscript/plugin-sagas-core/config` |
| The durable runtime factory `createDurableSagaRuntime` and the HTTP publisher `createSagaPublisher` | `@netscript/plugin-sagas/runtime` |

Add the plugin with `netscript plugin install @netscript/plugin-sagas`. It installs at
`plugins/sagas/`, and `netscript.config.ts` references it as `./plugins/sagas/mod.ts`. For
local-source contributor samples inside the NetScript monorepo, run
`deno run -A packages/cli/bin/netscript-dev.ts plugin install saga --name sagas --samples`.

## Minimal example — an order saga with compensation

This saga has a typed state, three `.on(...)` handlers, and a `.compensate(...)` branch that
unwinds an already-charged payment when fulfillment fails. It records workflow state and consumes
results that workers publish; it does not use `send(...)` to address a service or job. The failure
path returns `sagaCompensate(...)`, so the engine runs the matching compensation handler, records
the cancellation, and fails the instance.

```ts
// plugins/sagas/order-saga.ts
import {
  defineSaga,
  sagaComplete,
  sagaCompensate,
  sagaFail,
} from '@netscript/plugin-sagas-core';

// The state is the source of truth that survives across messages and crashes.
type OrderState = Readonly<{
  status: 'awaiting-payment' | 'awaiting-fulfillment' | 'completed' | 'cancelled';
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
  // Handler 1: record the workflow. A trigger enqueues payment work separately.
  .on<'OrderPlaced', OrderPlaced>('OrderPlaced', (saga, event) => {
    saga.state = { ...saga.state, orderId: event.payload.orderId };
    return [];
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
  // Compensation: record cancellation, then fail the instance.
  .compensate<'FulfillmentFailed', FulfillmentFailed>('FulfillmentFailed', (saga, event) => {
    saga.state = { ...saga.state, status: 'cancelled' };
    return [sagaFail(`order ${event.payload.orderId} unfulfilled: ${event.payload.reason}`)];
  })
  .build();

export default orderSaga;
```

{{ comp callout { type: "important", title: "Compensation is a branch and an effect" } }}
<code>.compensate(eventType, handler)</code> registers an undo handler keyed by message type, and a running handler routes into it by returning <code>sagaCompensate(message, reason?)</code>. The undo logic lives in the <code>.compensate()</code> handler, not inline in the forward path. Every outcome, including <code>sagaComplete</code>, <code>sagaFail</code>, <code>send</code> and <code>schedule</code>, is a named effect returned from a handler, never a fall-through. <code>spawn()</code> is reserved, and calling it throws <code>SAGA_NOT_IMPLEMENTED</code>.
{{ /comp }}

`createDurableSagaRuntime(...)` installs the native `SagaCompensator` automatically, so a
`sagaCompensate(...)` returned by a registered forward handler runs its matching
`.compensate(type, ...)` branch without a second dispatch call. If you compose the lower-level
`createSagaRuntime(...)` yourself, pass `native.compensator`. Externally supplied compensation
cascades also need `native.resolveCompensation`, so the runtime can recover the definition,
instance, and state. Missing compensators, resolvers, matching branches, and unknown effect kinds
fail with a named `SAGA_NOT_IMPLEMENTED` error instead of being discarded.

### What a compensation persists

A compensation is two persisted transitions, and neither needs a follow-up message. The `.on()`
transition that returns `sagaCompensate(...)` saves the instance as `compensating`. When the
`.compensate()` branch finishes, the runtime saves the branch's state change and outcome as the
next version of the instance, with the same versioned transition commit as `.on()`, on plain and
atomic stores alike:

| `.compensate()` branch outcome     | Persisted status                                        |
| ---------------------------------- | ------------------------------------------------------- |
| returns `[]` (or only `send`s)     | `compensated`: the undo finished (terminal)             |
| returns `[sagaFail(reason)]`       | `failed` (terminal)                                     |
| returns `[sagaComplete(result)]`   | `completed` (terminal)                                  |
| returns `[sagaCompensate(...)]`    | stays `compensating` until the nested branch finishes   |
| throws                             | `failed`, with `metadata.compensationError` set; every partial state change (including in-place edits of nested objects) is discarded and the error is rethrown |

A branch runs on its own copy of the state, so editing `saga.state` in place is safe: nothing is
saved unless the branch returns.

When one handler returns several effects, they run in order. Each `sagaCompensate(...)` runs against
the latest state and version saved for its instance during that dispatch, and saves its own outcome
as the next version. That latest version includes an earlier compensation, other sagas that handled
the same message, and any transition a `send(...)` caused, whether the instance handled the message
itself or it came back through other sagas. For
`[sagaCompensate(releaseStock), sagaCompensate(refundPayment)]`, both branches' state changes are
kept, and the last outcome sets the final status.

A `sagaFail(...)` returned from `.on()` saves `failed` first. If a `.compensate()` branch is
registered for that message type, it then runs, and the table above decides its saved outcome. A
branch's own `sagaFail` ends the instance; it is never routed back into the branch.

`compensating` means the undo is still running; it is not a final status. An ordinary `.on()`
handler that returns no terminal effect leaves a `compensating` instance as `compensating` and never
returns it to `running`. Rows that runtimes before 0.0.8 left at `compensating` still load. To end
one, deliver a message whose `.on()` handler returns `sagaFail(...)` or `sagaComplete(...)`.

Each outcome commit expects the version the compensation ran against, and takes its replay identity
from that version. A redelivered outcome is therefore not applied twice:
`SagaEngine.commitCompensation(...)` reports `committed: false`, and the branch's cascades are not
dispatched again.

## Key types

`SagaState` is the base shape your typed state must satisfy, `SagaContext` is the read-only context
passed to every handler, and `SagaDefinition` is the frozen object that `build()` returns and the
runtime registers.

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

### Instance-key precedence

For every handled message, the native engine resolves one durable instance key in this order:

1. the value returned by the definition's `.correlate(...)` extractor;
2. the message's explicit `correlationKey` when the extractor returns `undefined`;
3. the stable default `<sagaId>:<messageType>` correlation key.

The transport-level message `id` is never an instance key. Distinct message ids can therefore
resume the same workflow, while two concurrent messages whose extractor returns different business
keys are persisted as separate saga instances.

### Config-time companion

`netscript.config.ts` declares each saga for the scaffolder and CLI with `defineSagaConfig`:

```ts
// netscript.config.ts (excerpt)
import { defineSagaConfig } from '@netscript/plugin-sagas-core/config';

// The config-time entry the scaffolder + CLI read. SEPARATE from the runtime
// definition that defineSaga(...).build() produces.
export const orderSagaEntry = defineSagaConfig('order-saga', './plugins/sagas/order-saga.ts')
  .name('Order saga')
  .description('Reserve, charge, fulfill — with a compensation branch.')
  .topic('orders')
  .tags(['orders', 'checkout'])
  .build();
```

## Effect helpers

A handler's only side effect is the array of **cascaded messages** it returns. These helpers from
`@netscript/plugin-sagas-core` build the named effects. `CASCADED_MESSAGE_KINDS` keeps `spawn` in
the wire vocabulary so that deserialized unsupported effects fail loudly; the public `spawn()`
function returns `never` and throws before it creates an effect.

{{ comp.apiTable({
  caption: "Effect helpers — saga handler outcomes",
  rows: [
    { name: "sagaComplete(result?)", type: "=> CascadedMessage<'complete'>", desc: "Terminal success. Marks the instance finished and records the optional result payload." },
    { name: "sagaFail(reason)", type: "string | Error => CascadedMessage<'fail'>", desc: "Terminal failure. Records the reason; no further messages are applied to the instance." },
    { name: "sagaCompensate(message, reason?)", type: "=> CascadedMessage<'compensate'>", desc: "Route into the matching .compensate(type, ...) handler to undo an already-applied step." },
    { name: "send(target, payload, options)", type: "=> CascadedMessage<'send'>", desc: "Republish an internal message onto the saga bus. It does not trigger a worker job or task. options carry idempotencyKey / concurrencyKey / retry / queue." },
    { name: "schedule(message, delay)", type: "delay: Date | number | '5m' => CascadedMessage<'scheduled'>", desc: "Deliver a wrapped message after a delay (a Date, ms, or a '30s'/'5m'/'2h'/'1d' string)." },
    { name: "spawn(child, input, options)", type: "=> never", desc: "Unsupported. Calling it immediately throws SAGA_NOT_IMPLEMENTED; the runtime also rejects deserialized spawn effects defensively." }
  ]
}) }}

## createParallelQueue — fan-out and concurrent processing

Saga handlers stay synchronous and pure, so you tune concurrency in the transport layer that
carries cascaded messages and fan-out work. `createParallelQueue` from
{{ comp.xref({ key: "ref:queue", text: "@netscript/queue" }) }} wraps a base queue so one listener
processes several messages at once. Use it for independent internal messages or I/O-bound side
work, such as API calls and database writes. `concurrency: 1` is sequential; any higher value runs
messages in parallel. For CPU-bound work, use a subprocess task executor instead. The queue
reference lists every `ParallelQueueOptions` field.

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

{{ comp callout { type: "note", title: "Two concurrency settings" } }}
<code>createParallelQueue({ concurrency })</code> sets how many <em>queue</em> messages a listener processes at once. <code>defineSaga().concurrency({ limit, key })</code> bounds how many messages run against one <em>saga instance</em> or derived key, and rejects overlapping publishes for the same key. Use the queue setting for parallel fan-out and the builder setting to serialize work on one business entity, such as one order or one tenant.
{{ /comp }}

## Choosing a durable store backend

The **durable store backend** decides where a saga's runtime state lives between messages and
across crashes. The runner defaults to `kv` when no backend is configured. Select the backend
explicitly for deployments, so durable state lands where you intend.

| Backend | Stores state in | Use it when |
| --- | --- | --- |
| `kv` | Deno KV, the orchestration store that Aspire provisions. No extra schema. | You run locally or a single service. |
| `prisma` | Your scaffolded relational database, through your project's Prisma client: Postgres in the recommended setup, or `mysql`, `mssql` or `sqlite`. `PrismaSagaStore` writes the runtime tables `saga_runtime_state`, `saga_runtime_transition` and `saga_runtime_correlation`. | You want the saga's write path beside the rest of your data, with SQL inspection of in-flight state and transition history. |

Select the backend with `NETSCRIPT_SAGA_STORE` (`kv` | `prisma`) or the appsettings key
`sagas.store.backend` / `Sagas.Store.Backend`; the environment variable wins. The runner uses the
host bootstrap's settings when supplied. Without a bootstrap, it reads `appsettings.json` from
`NETSCRIPT_PROJECT_ROOT` or the working directory, including the installed
`NetScript.BackgroundProcessors.sagas.Sagas` settings. Direct `sagas/runtime.ts` and packaged
runtime launches resolve the same way and keep the `kv` default when nothing is configured. Invalid
configured values always fail startup.

The `prisma` backend needs a Prisma client from the bootstrap. Without one,
`createDurableSagaRuntime` throws `Prisma saga store backend requires a Prisma client.`

The shared `resolveSagaStoreBackend(...)` resolver throws when no backend is selected, unless the
caller supplies `defaultBackend`; the runner supplies `kv` for compatibility. The low-level
`createDurableSagaRuntime(...)` factory also defaults to `kv` when it gets neither a backend nor a
Prisma client, and an explicit `backend: 'kv'` wins over an optional Prisma client.

`createDurableSagaRuntime(...)`, from the `@netscript/plugin-sagas/runtime` subpath, resolves a
`SagaStorePort`, builds an **unstarted** native runtime over it, and returns a `dispose()` that
closes the store and the KV handle it opened. It is deprecated as a single-point composition
surface. Use the scaffolded `startSagaRunner(...)` path for registry loading, queue delivery,
delayed cascades, projection, and lifecycle ownership. If you use the low-level factory, you must
register definitions, inject a scheduler for `schedule()` cascades, and call `runtime.start()`
before publishing.

{{ comp.tabbedCode({ tabs: [
  {
    label: "kv backend",
    lang: "ts",
    code: "import { createDurableSagaRuntime } from '@netscript/plugin-sagas/runtime';\n\n// Low-level Deno KV construction. Prefer startSagaRunner() for the complete process.\nconst { runtime, store, dispose } = await createDurableSagaRuntime({ backend: 'kv' });\nawait runtime.register(definitions);\nawait runtime.start();\ntry {\n  await runtime.publish(message);\n} finally {\n  await runtime.stop('application shutdown');\n  await dispose();\n}"
  },
  {
    label: "prisma backend",
    lang: "ts",
    code: "import { createDurableSagaRuntime } from '@netscript/plugin-sagas/runtime';\nimport { PrismaClient } from './generated/prisma/client.ts';\n\n// Low-level Prisma construction. Prefer startSagaRunner() for complete delivery + lifecycle.\nconst prisma = new PrismaClient();\nconst { runtime, dispose } = await createDurableSagaRuntime({ backend: 'prisma', prisma });\nawait runtime.register(definitions);\nawait runtime.start();\n// A definition that emits schedule() also requires an injected scheduler on this low-level path.\nawait runtime.publish(message);\nawait runtime.stop('application shutdown');\nawait dispose();"
  },
  {
    label: "resolve from env / appsettings",
    lang: "ts",
    code: "import { createDurableSagaRuntime } from '@netscript/plugin-sagas/runtime';\nimport { resolveSagaStoreBackend } from '@netscript/plugin-sagas-core/stores';\n\n// Read the backend from the environment (or appsettings) — throws if unset.\nconst backend = resolveSagaStoreBackend({\n  env: Deno.env.toObject(),\n  // appsettings: loadedAppsettings, // sagas.store.backend\n});\n\nconst runtime = await createDurableSagaRuntime({\n  backend,\n  prisma: backend === 'prisma' ? prismaClient : undefined,\n});"
  }
] }) }}

{{ comp callout { type: "important", title: "Tier and backend are different" } }}
<code>.durability('t1')</code> selects a <em>durability tier</em> (<code>SAGA_DURABILITY_TIERS</code>), a property of the saga definition. The store backend (<code>kv</code> | <code>prisma</code>) is a deployment choice of <em>which database</em> holds durable state, resolved by <code>NETSCRIPT_SAGA_STORE</code> or <code>sagas.store.backend</code>. A saga keeps its declared tier whichever backend you deploy against.
{{ /comp }}

The `saga_runtime_*` tables are the durable **write path** the engine checkpoints to.
`saga_instances` and `saga_execution_history` are a separate **read-model projection** into Postgres
for API queries, analytics, and debugging. The runtime persists to the first; the API lists from
the second.

## The HTTP publisher — createSagaPublisher

A message reaches a saga through a **publisher**. `createSagaPublisher` from
`@netscript/plugin-sagas/runtime` returns a `SagaPublisherPort`. Its `publish(...)` POSTs to the
sagas API publish endpoint and, by default, discovers the service URL from the Aspire environment.
The workers `create-user-settings` job uses it to emit `UserSettingsCreated` across the plugin
boundary.

The HTTP response acknowledges a durable enqueue, not the saga transition. The background saga
runner consumes that queue, persists engine state, and updates the `saga_instances` read model.
Queue or provider failures and the publish deadline return a non-2xx response; the endpoint never
treats an indefinitely pending publish as success.

{{ comp.apiTable({
  caption: "createSagaPublisher(options) — HttpSagaPublisherOptions",
  rows: [
    { name: "serviceName", type: "string", desc: "Aspire service name to resolve a base URL from. Defaults to the sagas service discovery name." },
    { name: "baseUrl", type: "string", desc: "Explicit base URL override; skips discovery when set." },
    { name: "publishPath", type: "string (default '/api/v1/sagas/publish')", desc: "Path the publisher POSTs each message to." },
    { name: "headers", type: "Record<string, string>", desc: "Extra headers sent with every publish (auth, tenant routing)." },
    { name: "retryableStatusCodes", type: "readonly number[] (default 408,409,425,429,5xx)", desc: "HTTP statuses treated as retryable so the receipt is marked retryable." },
    { name: "id", type: "string (default 'http-saga-publisher')", desc: "Stable publisher id surfaced in diagnostics." },
    { name: "fetcher / readEnv / listEnvKeys", type: "boundary fns", desc: "Test/injection seams for the fetch implementation, the env reader used for discovery, and the env key-name enumeration used only to diagnose a failed discovery." }
  ]
}) }}

The port returns a typed **receipt** instead of throwing. `publish(...)` resolves a
`SagaPublisherResult`: either `{ published: true, ... }` (a `SagaPublisherReceipt`) or
`{ published: false, reason, retryable }` (a `SagaPublisherRejected`). `publishMany(...)` takes
`mode: 'sequential' | 'parallel'`, so a batch can fan out.

The publisher resolves its endpoint from these sources, in order:

1. `options.baseUrl`
2. `services__<serviceName>__https__0`
3. `services__<serviceName>__http__0`
4. `SAGAS_API_URL`
5. `NETSCRIPT_SAGAS_URL`

There is no fallback port. When no source resolves, the receipt is non-retryable with
`reason: 'no-endpoint'` and a `diagnostic` that names each source tried. The diagnostic also says
whether a `services__*` key or the `NETSCRIPT_ASPIRE` marker proved an Aspire environment, and
whether env enumeration was denied. It carries key names only, never values.
`publishSagaOrThrow(...)` renders that diagnostic into the `SagasError` it raises.

{{ comp.tabbedCode({ tabs: [
  {
    label: "The job that publishes (workers)",
    lang: "ts",
    code: "import { createSagaPublisher } from '@netscript/plugin-sagas/runtime';\nimport { createFailureResult, createSuccessResult, defineJobHandler } from '@netscript/plugin-workers-core';\nimport { z } from 'zod';\n\ntype UserRegistrationMessage = {\n  type: 'UserSettingsCreated';\n  payload: { userId: string };\n};\n\nconst CreateUserSettingsPayloadSchema = z.object({\n  userId: z.string().min(1, 'userId is required'),\n});\n\nconst sagaPublisher = createSagaPublisher<UserRegistrationMessage>();\n\nconst handler = defineJobHandler(CreateUserSettingsPayloadSchema, async (ctx) => {\n  const { userId } = ctx.payload;\n  console.info('Creating scaffold sample settings', { userId });\n\n  const publishResult = await sagaPublisher.publish({\n    type: 'UserSettingsCreated',\n    payload: { userId },\n  });\n  if (!publishResult.published) {\n    return createFailureResult(\n      `Saga publish rejected: ${publishResult.reason}`,\n      { userId, retryable: publishResult.retryable },\n    );\n  }\n\n  return createSuccessResult({\n    userId,\n    settingsCreated: true,\n    source: 'scaffold-sample',\n  });\n});\n\nexport default Object.assign(handler, { id: 'create-user-settings' as const });"
  },
  {
    label: "The saga that consumes (sagas)",
    lang: "ts",
    code: "// plugins/sagas/user-settings-saga.ts\nimport { defineSaga, sagaComplete } from '@netscript/plugin-sagas-core';\n\ntype State = Readonly<{ status: string; processedAt?: string }>;\n\nexport const userSettingsSaga = defineSaga('user-settings-saga')\n  .durability('t1')\n  .state<State>({ status: 'pending' })\n  .on<'UserSettingsCreated', { userId: string }>(\n    'UserSettingsCreated',\n    (saga, event, context) => {\n      saga.state = { ...saga.state, status: 'completed', processedAt: context.now.toISOString() };\n      return [sagaComplete({ userId: event.payload.userId, processedAt: context.now.toISOString() })];\n    },\n  )\n  .build();"
  }
] }) }}

## Extension points

The scaffold uses curated defaults, and the core package exposes the seams the plugin is built
from. Each seam is a subpath of `@netscript/plugin-sagas-core`, documented under
{{ comp.xref({ key: "ref:sagas" }) }}, for example `reference/sagas/presets` and
`reference/sagas/transports`.

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

{{ comp callout { type: "tip", title: "Default transport or Redis and Garnet" } }}
The scaffolded sagas service runs over the in-process native runtime and Deno KV, which covers local and single-service apps. Use the <code>/transports</code> adapters (<code>createGarnetListTransport</code>, <code>createNetScriptRedisTransport</code>) only when saga handlers run as separate processes and need at-least-once delivery with consumer groups, delayed messages, and dead-letter handling.
{{ /comp }}

## Endpoints and ports

The sagas plugin runs an oRPC API service on its assigned port. It lists registered sagas and
inspects running instances; a Deno KV registry backs the list. The live scaffold serves these
routes; {{ comp.xref({ key: "ref:sagas" }) }} has the full generated surface.

{{ comp.apiTable({
  caption: "Sagas plugin — runtime endpoints (on its assigned port)",
  rows: [
    { name: "GET /health/live", type: "liveness", desc: "Liveness probe for the sagas API service." },
    { name: "GET /api/v1/sagas/sagas", type: "registry", desc: "List the saga definitions registered into KV (id, name, topic, handled message types, enabled)." },
    { name: "GET /api/v1/sagas/instances", type: "instances", desc: "List running and completed saga instances. Inspect one with /instances/{sagaName}/{correlationId}." },
    { name: "POST /api/v1/sagas/publish", type: "publish", desc: "Durably enqueue a saga message for the background runner. Returns non-2xx when enqueue fails or exceeds the publish deadline." },
    { name: "GET /api/v1/sagas/subscribe", type: "stream (SSE)", desc: "Server-sent-events stream of saga activity (saga:started / state_changed / completed / failed / compensating), KV-watch backed." }
  ]
}) }}

## The continuous-app choreography

The workers plugin's `create-user-settings` job publishes `UserSettingsCreated` through a saga
publisher, and the saga's `.on('UserSettingsCreated', ...)` handler consumes it and returns
`sagaComplete(...)`. Both halves type-check against the same message type. To watch the message
cross the plugin boundary:

1. Run both plugins under Aspire.
2. Trigger the workers job with `POST /api/v1/workers/jobs/create-user-settings/trigger` on the
   workers API port.
3. Read `GET /api/v1/sagas/instances` on the sagas API port. The new instance records the
   completion.

The instance lives in Deno KV or in your `saga_runtime_*` tables, depending on the
`NETSCRIPT_SAGA_STORE` choice above.

## Production notes

{{ comp callout { type: "warning", title: "Start Aspire first" } }}
The sagas service needs Postgres and Redis before it can persist and list instances. Run <code>cd aspire &amp;&amp; aspire start</code> (dashboard at <a href="https://localhost:18888"><code>https://localhost:18888</code></a>) before any <code>netscript db</code> command, and before you expect <code>/api/v1/sagas/instances</code> to return durable state. Both backends depend on it: <code>kv</code> needs Redis/KV, and <code>prisma</code> needs Postgres with the <code>saga_runtime_*</code> tables migrated.
{{ /comp }}

{{ comp callout { type: "important", title: "Handlers are synchronous and pure" } }}
A <code>SagaHandler</code> returns <code>readonly CascadedMessage[]</code>. It is <strong>synchronous</strong> and does no direct I/O; the runtime applies every side effect, so the handler is replayable and crash-safe. Do not <code>await</code> a network call inside a handler. Emit <code>send(...)</code> for another saga message, and use the workers integration helpers or the triggers API <code>enqueueJob(...)</code> path for worker work. Compensation follows the same rule: its undo runs in the <code>.compensate()</code> handler as more effects.
{{ /comp }}

## When to use a saga

- **Use a saga** for a multi-step process whose steps can fail independently and whose state
  between steps must survive a crash: onboarding, checkout, provisioning. Pick `prisma` as the
  store backend when you also want that in-flight state queryable in your relational database.
- **Use a [background job](/background-processing/workers/)** for a single idempotent unit with
  no state between steps.
- **Use a database transaction** for atomic work inside one handler. A saga does not replace it.

## Next step

Build the checkout saga, with a compensation branch, in the
[storefront tutorial](/tutorials/storefront/04-checkout-saga/). The full generated API is in the
{{ comp.xref({ key: "ref:sagas", text: "sagas reference" }) }}.
