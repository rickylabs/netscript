---
layout: layouts/base.vto
title: Durability model
templateEngine: [vento, md]
order: 5
---

# Durability model

This page explains how NetScript keeps long-running, message-driven work alive across process
restarts: what a saga is, where its state lives, and how compensation and correlation fit. For the
headline API, see {{ comp.xref({ key: "cap:durable-sagas" }) }}; for the exported symbols, see
{{ comp.xref({ key: "ref:sagas" }) }}.

{{ comp.diagram({ src: "/assets/diagrams/saga-state-machine.svg", alt: "A saga as a persisted state machine: an inbound message is routed by correlation id to the right instance, the runtime loads its state from the durable store, the matching handler advances the state and returns effects, and the new state is written back.", caption: "A saga is a persisted state machine. Messages drive transitions; the runtime loads state by correlation, applies the matching handler, and writes the new state back to the durable store." }) }}

## What durable means

A plain request handler is **ephemeral**: it runs, returns, and forgets. If the process restarts
halfway through a multi-step business process, such as provisioning an account, charging a card, and
sending a welcome email, everything in memory is gone and nothing records how far it got.
Durability lets a *logical* workflow outlive any *single* execution: its progress is written outside
the process, so a restart, a retry, or a later message picks up where the last one stopped.

NetScript draws the durability boundary at the **saga**: a small, named state machine whose state
is persisted and whose transitions are driven by **messages** rather than by a call returning to
its caller. Because the state lives outside the process and the inputs arrive over time, a saga can
span minutes, hours, or many process lifetimes. Durability is about the workflow's *position*, not
its speed: a saga that completes in one message is still durable; it had one transition. See
{{ comp.xref({ key: "explain:architecture" }) }} for how this state-machine model shapes the rest of
the framework.

## The saga builder

A saga is authored with a **fluent builder**. You declare an id, a durability tier, the shape and
initial value of its state, and one or more message handlers, then call `.build()` to freeze the
definition. The result describes which messages move the workflow and what state each move leaves
behind; it is not imperative control flow.

```ts
// plugins/sagas/<saga>.ts  — the scaffolded shape, verbatim core
import { defineSaga, sagaComplete } from '@netscript/plugin-sagas-core';

type State = Readonly<{ status: string; processedAt?: string }>;
type Message = Readonly<{ type: 'UserSettingsCreated'; payload: { userId: string } }>;

export const userOnboardingSaga = defineSaga('user-onboarding')
  .durability('t1')
  .state<State>({ status: 'pending' })
  .on<Message['type'], Message['payload']>(
    'UserSettingsCreated',
    (saga, message, context) => {
      saga.state = {
        ...saga.state,
        status: 'completed',
        processedAt: context.now.toISOString(),
      };
      return [sagaComplete({ messageType: message.type, processedAt: context.now.toISOString() })];
    },
  )
  .build();

export default userOnboardingSaga;
```

{{ comp.apiTable({
  caption: "The defineSaga(...) builder chain",
  rows: [
    { name: "defineSaga(id)", type: "(id: string) => SagaBuilder", desc: "Opens the builder and names the saga. The id is the registry key and shows up at GET /api/v1/sagas/sagas." },
    { name: ".durability(tier)", type: "(tier: 't1' | 't2' | 't3') => SagaBuilder", desc: "Declares the saga-definition durability TIER — how aggressively the runtime should persist this saga. Defaults to t1. This is a property of the definition, distinct from which physical store (kv or prisma) the runtime writes to." },
    { name: ".state<S>(initial)", type: "<S>(initial: S) => SagaBuilder", desc: "Declares the persisted state shape and its initial value. This object is what survives across messages and restarts. Must precede any handler." },
    { name: ".on<T,P>(type, handler)", type: "(type, (saga, msg, ctx) => Effect[]) => SagaBuilder", desc: "Registers a transition for one message type. The handler mutates saga.state and returns an array of effects (for example sagaComplete(...))." },
    { name: ".compensate(type, handler)", type: "(type, (saga, msg, ctx) => Effect[]) => SagaBuilder", desc: "Registers a compensation handler for a FAILED event type — the first-class rollback hook (see below). Same handler shape as .on(...)." },
    { name: ".build()", type: "() => SagaDefinition", desc: "Freezes the chain into a SagaDefinition after at least one handler exists. Nothing runs until build() and registration." }
  ]
}) }}

The builder also exposes `.correlate(...)` (a custom correlation extractor), `.concurrency(...)`
(bounded concurrency, optionally per message key), and `.schedule(cron)` (a cron schedule on the
definition). The reference unit lists the full surface.

> [!WARNING]
> `.onSignal(...)` and `.onQuery(...)` compile and register, but their runtime dispatch is
> deferred. Don't design around live signal or query routing yet. The rest of the saga durability
> model on this page is implemented.

{{ comp callout { type: "tip", title: "Why state lives on `saga.state`" } }}
The handler receives the live <code>saga</code> object, mutates <code>saga.state</code> in place,
then returns effects. Keeping state on the saga rather than in handler-local variables is what makes
it <strong>durable</strong>: the runtime owns that object, persists it to the configured durable
store, and rehydrates it before the next matching message. A local variable would vanish;
<code>saga.state</code> does not.
{{ /comp }}

## Durability tiers

`.durability(tier)` takes one of three tiers, `t1`, `t2`, or `t3`, and defaults to `t1`. The tier is
the saga *definition's* contract for how aggressively the runtime persists it. It is a separate axis
from the physical store the writes land in: the tier travels with the definition, and the store
backend is chosen once for the whole runtime. The same `t1` saga runs unchanged whether its state is
written to Deno KV or to Postgres.

## The durable store

The builder describes *what* to persist; the **durable saga store** is *where* it goes. NetScript
ships two interchangeable backends, and the runtime persists every transition to exactly one of
them, chosen at startup:

{{ comp.apiTable({
  caption: "Durable saga store backends — NETSCRIPT_SAGA_STORE",
  rows: [
    { name: "kv", type: "KvSagaStore", desc: "Persists saga runtime state to Deno KV. The default scaffold backend, with no external dependencies; suited to local development and KV-native deployments." },
    { name: "prisma", type: "PrismaSagaStore", desc: "Persists saga runtime state through a host-owned Prisma client into your scaffolded relational database (Postgres in the recommended setup; mysql / mssql / sqlite all work — the store follows your Prisma client, it is not Postgres-specific), across three saga_runtime_* tables. Choose this when you want saga state in your relational store alongside the rest of your data. Requires a Prisma client at construction." }
  ]
}) }}

Both backends implement the same `SagaStorePort`, so the choice is operational, not behavioral.
`kv` is the path the scaffold and tests exercise most. `prisma` is implemented and tested, and
assumes you run the database and hand the store a Prisma client yourself.

The selection is **mandatory**: the runtime throws at startup if neither source provides it
(`Saga store backend is required. Set NETSCRIPT_SAGA_STORE=kv|prisma …`). Set it in one of two
places:

- **Environment:** `NETSCRIPT_SAGA_STORE=kv` or `NETSCRIPT_SAGA_STORE=prisma`.
- **App settings:** `sagas.store.backend: "kv" | "prisma"`.

The composition root is `createDurableSagaRuntime(...)`, exported from the
`@netscript/plugin-sagas/runtime` subpath. The Prisma backend requires a client; the KV backend can
take a `Deno.Kv` or open the default:

```ts
// composition root — pick the backend once, at startup
import { createDurableSagaRuntime } from '@netscript/plugin-sagas/runtime';

const { runtime, store, dispose } = await createDurableSagaRuntime({
  backend: 'prisma',     // or 'kv'
  prisma: prismaClient,  // pass when backend === 'prisma'
});
// `runtime` registers SagaDefinitions and applies messages;
// `store` is the KvSagaStore or PrismaSagaStore instance; `dispose` releases it.
```

### Prisma store tables

The `PrismaSagaStore` is a thin delegate over a host-owned Prisma client. The durable write path
spans three `saga_runtime_*` tables, each holding one facet of the persisted machine:

{{ comp.apiTable({
  caption: "Prisma durable write-path models",
  rows: [
    { name: "SagaRuntimeState", type: "saga_runtime_state", desc: "The current persisted state object for an instance — the durable 'position' the runtime rehydrates before the next message." },
    { name: "SagaRuntimeTransition", type: "saga_runtime_transition", desc: "The applied transitions, keyed by instance and version, so the durable workflow records its history as well as its latest snapshot." },
    { name: "SagaRuntimeCorrelation", type: "saga_runtime_correlation", desc: "The correlation index that maps a saga id plus correlation key back to its instance — how the runtime finds the right state to load." }
  ]
}) }}

These tables are separate from the read-model `SagaInstance` table (`saga_instances`) that backs the
listing API. The `saga_runtime_*` tables are the **durability mechanism**; `SagaInstance` is a
projection used to *display* instances. Choosing the `prisma` backend opts the durable write path
into Postgres; the `kv` backend keeps the same logical structure in Deno KV.

## Compensation

NetScript supports compensation in two shapes, and a saga can use both:

| Shape | How it works | Use it when |
| --- | --- | --- |
| Effects (the scaffold default) | A handler **returns an array of effects** that the runtime interprets. `sagaComplete({...})` signals a terminal, successful state; corrective actions are more effects the handler returns, not a rollback chain registered up front. The scaffolded handler ends with `return [sagaComplete({...})]`. | Corrective actions belong to the forward transition. |
| `.compensate(eventType, handler)` | Registers a compensation handler for a failed event type, with the same `(saga, message, context) => Effect[]` shape as `.on(...)`. The runtime invokes it on the failure path for that event. | You want an explicit, named rollback for a specific failed event type. |

## Correlation

A saga *definition* is a template; a running workflow is a saga *instance*. Many instances can be in
flight at once, so the runtime keys them by a **correlation id** and exposes them through the
registry API. The registry stores saga metadata in Deno KV, and the API service lists definitions
and live instances:

{{ comp.apiTable({
  caption: "Sagas API — registry and instances (on its assigned port)",
  rows: [
    { name: "GET /api/v1/sagas/sagas", type: "list definitions", desc: "Every registered saga definition and its handled message types — this is where your built saga shows up." },
    { name: "GET /api/v1/sagas/instances", type: "list instances", desc: "Live saga instances. Each instance carries its own persisted state." },
    { name: "GET /api/v1/sagas/instances/{sagaName}/{correlationId}", type: "single instance", desc: "One instance addressed by saga name plus correlation id — the durable position of one workflow." },
    { name: "POST /api/v1/sagas/publish", type: "publish a message", desc: "Hand a message to the saga runtime, which routes it to the matching handler on the correct instance." },
    { name: "GET /health/live", type: "liveness", desc: "The sagas service liveness probe." }
  ]
}) }}

The saga's `id` plus a correlation id is what lets the durable state be put down and picked back
up. The runtime does not keep your workflow in memory: it looks the instance up by correlation,
loads its state from the configured store, applies the message, and writes the new state back. By
default the correlation key comes from the message; `.correlate(...)` lets a definition extract it
differently.

## Worked example: user onboarding

Durability matters most when capabilities compose. The scaffold ships one user-onboarding flow
across three plugins, and it is the same continuous app the [tutorials](/tutorials/) build:

```text
  Inbound HTTP                Background job              Durable saga
  (triggers API)              (workers API)              (sagas API)
  ────────────────           ────────────────           ────────────────
  POST /api/v1/webhooks ───▶  create-user-settings ───▶  user-onboarding
  /inbound/generic            job runs:                  saga handles:
       │                      publishes                  'UserSettingsCreated'
  enqueueJob(jobRef)          UserSettingsCreated         │
       │                           │                      returns
       ▼                           ▼                      [ sagaComplete({...}) ]
  worker job enqueued        saga message published      workflow terminal
                                                          (state persisted to
                                                           kv | prisma store)
```

1. **A trigger turns an inbound webhook into a job.** The triggers plugin exposes raw webhook routes alongside its typed oRPC management contract
   (not oRPC). The webhook handler returns an array of `enqueueJob(jobRef, { payload, priority })`
   effects, so a `POST` to `/api/v1/webhooks/inbound/generic` at the triggers URL Aspire prints enqueues a worker job: the
   *ingress* of the durable flow. A handler can also return `defer({ until })`; the runtime persists
   the event and replays it once at or after that timestamp, including after a process restart.
   See {{ comp.xref({ key: "cap:triggers" }) }}.
2. **A worker job publishes the saga message.** The workers plugin's `create-user-settings` sample is
   an ordinary `defineJobHandler(async (ctx) => ...)` that, on success, **publishes the
   `UserSettingsCreated` message** through a saga publisher. The job is the *unit of work*;
   publishing the message hands control to the durable layer. See
   {{ comp.xref({ key: "cap:background-jobs" }) }}.
3. **A saga consumes the message and emits `sagaComplete`.** The sagas plugin registers
   `userOnboardingSaga`, whose `.on('UserSettingsCreated', ...)` handler mutates `saga.state` and
   returns `[ sagaComplete({...}) ]`. That terminal effect finishes the workflow, and the new state
   is written to the configured store (`kv` or `prisma`).

```ts
// workers/jobs/create-user-settings.ts — the publish step, verbatim core
import { createSagaPublisher } from '@netscript/plugin-sagas/runtime';
import {
  createFailureResult,
  createSuccessResult,
  defineJobHandler,
} from '@netscript/plugin-workers-core';
import { z } from 'zod';

type UserRegistrationMessage = {
  type: 'UserSettingsCreated';
  payload: { userId: string };
};

const CreateUserSettingsPayloadSchema = z.object({ userId: z.string().min(1) });
const sagaPublisher = createSagaPublisher<UserRegistrationMessage>();

const handler = defineJobHandler(async (ctx) => {
  const { userId } = CreateUserSettingsPayloadSchema.parse(ctx.payload ?? {});
  const publishResult = await sagaPublisher.publish({
    type: 'UserSettingsCreated',
    payload: { userId },
  });
  if (!publishResult.published) {
    return createFailureResult(
      `Saga publish rejected: ${publishResult.reason}`,
      { userId, retryable: publishResult.retryable },
    );
  }
  return createSuccessResult({ userId, settingsCreated: true, source: 'scaffold-sample' });
});

export default Object.assign(handler, { id: 'create-user-settings' });
```

{{ comp callout { type: "note", title: "Why split a job from a saga" } }}
The <strong>job</strong> does one discrete, retryable unit of work (parse the payload, write a
record, call an API) and reports success or failure. The <strong>saga</strong> owns the
<em>long-lived position</em> across many such messages. Splitting them lets a transient job failure
be retried without losing the workflow's accumulated state, and lets one saga react to messages
from several different jobs.
{{ /comp }}

## What a crash preserves

When the process dies mid-workflow:

- **Persisted:** the instance's `saga.state` (its `SagaRuntimeState` or KV equivalent), the applied
  transitions, and the correlation index. On restart the runtime finds the instance by correlation
  and rehydrates its position.
- **Lost, by design:** anything held only in handler-local variables or in-process memory.
- **Not applied twice:** the runtime keeps an applied-key boundary (`SagaAppliedKeyStore`) so a
  redelivered message does not apply a transition twice. At-least-once delivery means the same
  message can arrive twice across a restart.

## Design trade-offs

- **Persisted state over in-memory closures.** The cost is that you think in transitions, not in
  straight-line code; the benefit is correctness across process lifetimes.
- **A pluggable store over a hard-wired backend.** One `KvSagaStore` / `PrismaSagaStore` seam,
  selected by one explicit setting, lets the same saga run on Deno KV in development and on Postgres
  in production. The cost is one mandatory choice at startup; the benefit is that durability is a
  deployment decision, not a code rewrite.
- **Effects over direct side effects.** Returning `sagaComplete({...})` and other effects instead of
  calling out directly keeps handlers replayable. The runtime decides *when* and *how* effects
  apply, which makes retries and compensation tractable.
- **Composition over a workflow monolith.** Trigger, job, and saga are three small capabilities
  wired by messages. Each can be added, tested, and scaled on its own, and the
  {{ comp.xref({ key: "explain:architecture", text: "plugin model" }) }} lets a host assemble them
  without editing host code.

Next: build a saga in [Durable checkout](/tutorials/storefront/04-checkout-saga/).
