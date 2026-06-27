---
layout: layouts/base.vto
title: Durability model
templateEngine: [vento, md]
prev: { label: "Auth model", href: "/explanation/auth-model/" }
next: { label: "Observability", href: "/explanation/observability/" }
---

# Durability model

This essay is **understanding-oriented**. It answers one question: *how does NetScript make
long-running, message-driven work survive a process restart?* It builds the mental model — what a
saga is, how its state is persisted, where that state physically lives, and how compensation and
correlation fit — so you can reason about the running system. It is not a step-by-step guide. When
you want to build a durable workflow with your own hands, follow the
[durable workflow tutorial](/tutorials/storefront/04-checkout-saga/); for the headline API and ports see
{{ comp.xref({ key: "cap:durable-sagas" }) }}; for the exact exported symbols see
{{ comp.xref({ key: "ref:sagas" }) }}.

{{ comp.diagram({ src: "/assets/diagrams/saga-state-machine.svg", alt: "A saga as a persisted state machine: an inbound message is routed by correlation id to the right instance, the runtime loads its state from the durable store, the matching handler advances the state and returns effects, and the new state is written back.", caption: "A saga is a persisted state machine. Messages drive transitions; the runtime loads state by correlation, applies the matching handler, and writes the new state back to the durable store." }) }}

{{ comp callout { type: "note", title: "What is genuinely live today" } }}
The saga builder, its persisted state model, the message-handler effects, and the
<strong>durable store</strong> behind them are all <strong>real and they compile</strong> — the
scaffold ships a working <code>defineSaga(...)</code> sample, a registry API at <code>:8092</code>,
and a durable runtime that persists every transition to either <strong>Deno KV</strong> or
<strong>Prisma/Postgres</strong>. Two builder methods are reserved: <code>.onSignal(...)</code> and
<code>.onQuery(...)</code> compile and register, but their runtime dispatch is explicitly deferred
(the doc comments say so) — do not design around live signal/query routing yet. Neither caveat
touches the core saga durability described here.
{{ /comp }}

## What "durable" actually means here

A plain request handler is **ephemeral**: it runs, returns, and forgets. If the process restarts
halfway through a multi-step business process — provision an account, charge a card, send a welcome
email — everything in memory is gone and there is no record of how far you got. Durability is the
property that lets a *logical* workflow outlive any *single* execution: its progress is written down
somewhere external to the process, so a restart, a retry, or a later message can pick up exactly
where the last one left off.

NetScript draws the durability boundary at the **saga**. A saga is a small, named state machine
whose state is persisted and whose transitions are driven by **messages** rather than by a callable
returning to its caller. Because the state lives outside the process and the inputs arrive as
messages over time, a saga can span minutes, hours, or many process lifetimes — that is what the
word *durable* buys you. This is doctrine axiom A12 in practice: *durable workflows are state
machines*, not long-lived call stacks. See {{ comp.xref({ key: "explain:architecture" }) }} for how
that axiom shapes the whole framework.

{{ comp callout { type: "note", title: "Durability is about the state, not the speed" } }}
Durability does not mean "slow" or "queued forever". It means the workflow's
<strong>position</strong> — which step it is on and what it has accumulated so far — is recorded
outside the handler, so the workflow is correct even when the runtime is not continuous. A saga that
completes in one message is still durable; it just had one transition.
{{ /comp }}

## The saga builder: a state machine you declare, not wire

A saga is authored with a **fluent builder**. You declare an id, a durability tier, the shape and
initial value of its state, and one or more message handlers, then call `.build()` to freeze it into
a definition the runtime can register and run.

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

Each call in the chain has a precise job:

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

The builder surface is wider than the scaffold sample shows. Alongside the core methods above it
also exposes `.correlate(...)` (a custom correlation extractor), `.concurrency(...)` (bounded,
optionally per-message-key concurrency), and `.schedule(cron)` (a cron schedule on the definition),
plus the two reserved hooks `.onSignal(...)` and `.onQuery(...)`. Reach for the reference unit when
you need the full surface — this essay sticks to the load-bearing concepts.

The mental model to hold: **`defineSaga(...).durability(...).state(...).on(...).build()` is a
declaration of a persisted state machine.** You are not writing imperative control flow that falls
off the end of a callable — you are describing *which messages move the workflow* and *what state
each move leaves behind*.

{{ comp callout { type: "tip", title: "Why state lives on `saga.state`" } }}
The handler receives the live <code>saga</code> object and mutates <code>saga.state</code> in place,
then returns effects. Keeping state on the saga rather than in handler-local variables is exactly
what makes it <strong>durable</strong>: the runtime owns that object, persists it to the configured
durable store, and rehydrates it before the next matching message. A local variable would vanish;
<code>saga.state</code> does not.
{{ /comp }}

## Durability tiers: how hard to persist

`.durability(tier)` takes one of three tiers — `t1`, `t2`, `t3` — and defaults to `t1`. The tier is
the saga *definition's* contract for how aggressively the runtime should persist it; it is a
separate axis from *which* physical store the writes land in. Hold the two apart: the tier travels
with the definition, the store backend is chosen once for the whole runtime. The same `t1` saga runs
unchanged whether its state is written to Deno KV or to Postgres — you never re-author a saga to
change where it persists.

## Where the state physically lives: the durable store

The builder describes *what* to persist. The **durable saga store** is *where* it goes. NetScript
ships two interchangeable backends, and the runtime persists every transition to exactly one of
them, chosen at startup:

{{ comp.apiTable({
  caption: "Durable saga store backends — NETSCRIPT_SAGA_STORE",
  rows: [
    { name: "kv", type: "KvSagaStore", desc: "Persists saga runtime state to Deno KV. The default scaffold backend — zero external dependencies, ideal for local development and KV-native deployments." },
    { name: "prisma", type: "PrismaSagaStore", desc: "Persists saga runtime state through a host-owned Prisma client into Postgres, across three saga_runtime_* tables. Choose this when you already run Postgres (the Aspire stack does) and want saga state in your relational store. Requires a Prisma client at construction." }
  ]
}) }}

You select the backend explicitly — it is **mandatory**, and the runtime throws at startup if
neither source provides it (`Saga store backend is required. Set NETSCRIPT_SAGA_STORE=kv|prisma …`).
Two equivalent switches:

- **Environment:** `NETSCRIPT_SAGA_STORE=kv` or `NETSCRIPT_SAGA_STORE=prisma`.
- **App settings:** `sagas.store.backend: "kv" | "prisma"`.

The composition root is `createDurableSagaRuntime(...)`, exported from the
`@netscript/plugin-sagas/runtime` subpath. When you ask for the Prisma backend you must hand it a
client; the KV backend can take a `Deno.Kv` (or open the default):

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

{{ comp callout { type: "important", title: "Two axes: tier vs store backend" } }}
Keep these apart in your head. The <strong>durability tier</strong> —
<code>.durability('t1')</code> on the builder — is a property of the saga <em>definition</em>
describing how aggressively the runtime should persist it. The <strong>store backend</strong> —
<code>kv</code> or <code>prisma</code> — is the physical place those persisted writes land, chosen
once at the composition root for the whole runtime. Switching stores is a deployment decision, not a
code rewrite.
{{ /comp }}

### Choosing kv vs prisma

Both backends implement the same `SagaStorePort`, so the choice is operational, not behavioural:

- **`kv` (default).** Zero external dependencies — state lives in Deno KV. Lowest-friction for local
  development and for deployments that are already KV-native. This is what the scaffold uses out of
  the box, so a fresh project is durable with nothing else running.
- **`prisma`.** Routes the durable write path into Postgres. Pick it when you already operate
  Postgres (the {{ comp.xref({ key: "cap:database" }) }} stack and Aspire bring one up) and want saga
  state queryable alongside the rest of your relational data — at the cost of a running database and
  a Prisma client to hand the store at construction.

### How the Prisma store maps the runtime

The `PrismaSagaStore` is a thin delegate over a host-owned Prisma client. The durable *write path*
spans three `saga_runtime_*` tables, each capturing one facet of the persisted machine:

{{ comp.apiTable({
  caption: "Prisma durable write-path models",
  rows: [
    { name: "SagaRuntimeState", type: "saga_runtime_state", desc: "The current persisted state object for an instance — the durable 'position' the runtime rehydrates before the next message." },
    { name: "SagaRuntimeTransition", type: "saga_runtime_transition", desc: "The applied transitions, keyed by instance and version, so the durable workflow's history is recorded — not just its latest snapshot." },
    { name: "SagaRuntimeCorrelation", type: "saga_runtime_correlation", desc: "The correlation index that maps a saga id plus correlation key back to its instance — how the runtime finds the right state to load." }
  ]
}) }}

This is deliberately distinct from the read-model `SagaInstance` table (`saga_instances`) that backs
the listing API. The `saga_runtime_*` tables are the **durability mechanism**; `SagaInstance` is a
projection used to *display* instances. Choosing the `prisma` backend opts the durable write path
into Postgres; the `kv` backend keeps the same logical structure in Deno KV instead.

## Compensation: two shapes

If you have used other orchestration frameworks, you may expect a saga to be a list of forward steps
each paired with a rollback. NetScript supports compensation in **two** shapes, and it is worth
knowing which one you are looking at.

**Shape 1 — compensation as an effect (what the scaffold ships).** A saga handler **returns an array
of effects**. `sagaComplete({...})` is one such effect — it signals the workflow reached a terminal,
successful state. In this shape, corrective actions are expressed the same way: as additional
effects a message handler returns, interpreted by the runtime, rather than as a separate rollback
chain registered up front. The scaffolded sample uses exactly this model, which is why its handler's
last line is `return [sagaComplete({...})]`.

**Shape 2 — compensation as a first-class builder hook.** The `SagaBuilder` *also* exposes a
`.compensate(eventType, handler)` method — "register a compensation handler for a failed event
type". It takes the same `(saga, message, context) => Effect[]` handler shape as `.on(...)`, but the
runtime invokes it on the failure path for that event rather than the forward path. So if you want
an explicit, named rollback per event type, the hook is there.

{{ comp callout { type: "tip", title: "Which shape should you reach for?" } }}
Both are real. The <strong>effect-array</strong> shape (Shape 1) is the scaffold's default and the
simplest mental model — corrective actions are just more values your handler returns. Reach for
<code>.compensate(...)</code> (Shape 2) when you want an <em>explicit</em> rollback handler bound to
a specific failed event type, separate from the forward <code>.on(...)</code> transition. They are
not mutually exclusive — a saga can use forward effects and register compensations for the events
that need them.
{{ /comp }}

## Correlation: how one saga instance finds its messages

A saga *definition* is a template; a running workflow is a saga *instance*. Many onboarding flows can
be in flight at once, so the runtime keys instances by a **correlation id** and exposes them through
the registry API. The registry stores saga metadata in Deno KV, and the API service lists
definitions and live instances:

{{ comp.apiTable({
  caption: "Sagas API — registry and instances (port :8092)",
  rows: [
    { name: "GET /api/v1/sagas/sagas", type: "list definitions", desc: "Every registered saga definition and its handled message types — this is where your built saga shows up." },
    { name: "GET /api/v1/sagas/instances", type: "list instances", desc: "Live saga instances. Each instance carries its own persisted state." },
    { name: "GET /api/v1/sagas/instances/{sagaName}/{correlationId}", type: "single instance", desc: "One instance addressed by saga name plus correlation id — the durable position of one workflow." },
    { name: "POST /api/v1/sagas/publish", type: "publish a message", desc: "Hand a message to the saga runtime, which routes it to the matching handler on the correct instance." },
    { name: "GET /health/live", type: "liveness", desc: "The sagas service liveness probe." }
  ]
}) }}

The thing to internalize: a saga's identity (`id`, set via the builder) plus a correlation id is what
lets the durable state survive being put down and picked back up. The runtime does not keep your
workflow in memory; it looks the instance up by correlation, loads its state from the configured
store, applies the message, and writes the new state back. By default the correlation key comes from
the message; `.correlate(...)` lets a definition extract it differently.

## The worked example: three capabilities, one durable workflow

Durability becomes interesting when capabilities **compose**. The scaffold ships exactly this
choreography, and it is the same continuous app the [tutorials](/tutorials/) build rung by rung.
Follow one user-onboarding flow through three plugins:

```text
  Inbound HTTP                Background job              Durable saga
  (triggers :8093)            (workers :8091)            (sagas :8092)
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

Step by step, in the real code:

1. **A trigger turns an inbound webhook into a job.** The triggers plugin exposes raw Hono routes
   (not oRPC). The webhook handler returns an array of `enqueueJob(jobRef, { payload, priority })`
   effects, so a `POST` to `:8093/api/v1/webhooks/inbound/generic` enqueues a worker job — the
   *ingress* of the durable flow. (`enqueueJob` is the one live trigger action; the `defer` action is
   defined but unsupported — it throws and routes to the DLQ, so do not build on deferred replay.)
   See {{ comp.xref({ key: "cap:triggers" }) }}.
2. **A worker job publishes the saga message.** The workers plugin's `create-user-settings` sample is
   an ordinary `defineJobHandler(async (ctx) => ...)` that, on success, **publishes the
   `UserSettingsCreated` message** via a saga publisher. The job is the *unit of work*; publishing the
   message is how it hands control to the durable layer. See {{ comp.xref({ key: "cap:background-jobs" }) }}.
3. **A saga consumes the message and emits `sagaComplete`.** The sagas plugin registers
   `userOnboardingSaga`, whose `.on('UserSettingsCreated', ...)` handler mutates `saga.state` and
   returns `[ sagaComplete({...}) ]`. That terminal effect is the durable workflow finishing — and
   the new state is written to whichever store (`kv` or `prisma`) the runtime was configured with.

```ts
// workers/jobs/create-user-settings.ts — the publish step, verbatim core
import { createSagaPublisher } from '@netscript/plugin-sagas/runtime';
import { createSuccessResult, defineJobHandler } from '@netscript/plugin-workers-core';
import { z } from 'zod';

type UserRegistrationMessage = {
  type: 'UserSettingsCreated';
  payload: { userId: string };
};

const CreateUserSettingsPayloadSchema = z.object({ userId: z.string().min(1) });
const sagaPublisher = createSagaPublisher<UserRegistrationMessage>();

const handler = defineJobHandler(async (ctx) => {
  const { userId } = CreateUserSettingsPayloadSchema.parse(ctx.payload ?? {});
  await sagaPublisher.publish({ type: 'UserSettingsCreated', payload: { userId } });
  return createSuccessResult({ userId, settingsCreated: true, source: 'scaffold-sample' });
});

export default Object.assign(handler, { id: 'create-user-settings' });
```

{{ comp callout { type: "note", title: "Why split a job from a saga at all?" } }}
The <strong>job</strong> does the discrete, retryable unit of work (parse the payload, write a
record, call an API) and reports success or failure. The <strong>saga</strong> owns the
<em>long-lived position</em> across many such messages. Splitting them means a transient job failure
can be retried without losing the workflow's accumulated state, and the same saga can react to
messages published by several different jobs. Composition, not a single mega-handler, is what keeps
each piece small and durable.
{{ /comp }}

## What a crash actually preserves

Concretely, when the process dies mid-workflow:

- **Persisted (survives):** the instance's `saga.state` (its `SagaRuntimeState` / KV equivalent), the
  applied transitions, and the correlation index. On restart the runtime can find the instance by
  correlation and rehydrate its exact position.
- **Not preserved (by design):** anything held only in handler-local variables or in-process memory.
  That is the whole point of moving state onto `saga.state` — local closures are *expected* to be
  lost, and the durable store is what stands in for them.
- **Idempotency:** the runtime carries an applied-key boundary (`SagaAppliedKeyStore`) so that a
  redelivered message does not double-apply a transition — important because at-least-once delivery
  means the same message can arrive twice across a restart.

## Limitations (alpha)

The durability story is real but young, and a few edges are worth naming so you do not over-trust it:

- **Reserved builder hooks.** `.onSignal(...)` and `.onQuery(...)` compile and register, but their
  runtime dispatch is explicitly deferred. Treat them as forward-declared surface, not live features.
- **Trigger `defer` is unsupported.** The `defer` trigger action throws and routes to the DLQ — only
  `enqueueJob` is a live ingress for durable flows today.
- **Two stores, same port, different operational maturity.** `kv` is the path the scaffold and tests
  exercise most; `prisma` is real and tested but assumes you bring and manage the Postgres + Prisma
  client yourself.

None of these undermine the core guarantee — a built `defineSaga(...)` survives restarts on either
store — but they shape what you should and should not design around right now.
<!-- caveat: arch-debt:triggers-defer-unsupported -->

## Why the model looks like this — the design trade-offs

The message-and-state shape is a deliberate set of trade-offs:

- **Persisted state over in-memory closures.** Putting the workflow's position on `saga.state` and
  persisting it to a durable store is what survives restarts. The cost is that you think in
  transitions, not in straight-line code; the benefit is correctness across process lifetimes.
- **A pluggable store over a hard-wired backend.** Pulling the persistence behind a single
  `KvSagaStore` / `PrismaSagaStore` seam — selected by one explicit setting — lets the same saga run
  on Deno KV in development and on Postgres in production without touching the workflow. The cost is
  the one mandatory choice at startup; the benefit is that durability is a deployment decision, not a
  code rewrite.
- **Effects over imperative side-effects.** Returning `sagaComplete({...})` (and other effects)
  instead of calling out directly keeps handlers replayable. The runtime decides *when* and *how*
  effects apply, which is what makes retries and compensation tractable.
- **Composition over a workflow monolith.** Trigger → job → saga are three small capabilities wired
  by messages. Each can be added, tested, and scaled independently, and the
  {{ comp.xref({ key: "explain:architecture", text: "plugin model" }) }} is what lets a host assemble
  them without editing host code.

## How this connects to the rest of NetScript

A durable workflow is not an island. It rides on top of the same primitives you have already met or
will meet:

- It is delivered as **plugins** — workers, sagas, triggers — through the plugin model's
  contribution/registry mechanism.
- Its messages and effects are **observable**: job dispatch and execution emit real OpenTelemetry
  spans that show up in Aspire automatically. See [observability](/explanation/observability/) for
  the full picture — including the one known gap (the scaffold `createJobTools(ctx)` handler helpers
  are no-op stubs, a tracked limitation; call `@netscript/telemetry` helpers directly for custom
  spans).
- Its API surfaces (`:8091`, `:8092`, `:8093`) and the Postgres/Garnet backing store — including the
  Postgres tables behind the `prisma` saga store — are brought up by Aspire. Remember the ordering:
  `cd aspire && aspire start` is what makes the durable infrastructure available **before** any
  `netscript db` command. See {{ comp.xref({ key: "cap:kv-queues-cron" }) }} for the KV/queue
  primitives the runtime leans on, and {{ comp.xref({ key: "cap:streams" }) }} for the streaming
  counterpart to message-driven sagas.

## Where to go next

- **Do it:** [Build a durable workflow](/tutorials/storefront/04-checkout-saga/) — the hands-on tutorial that
  adds the saga and consumes `UserSettingsCreated` end to end.
- **See the capability:** {{ comp.xref({ key: "cap:durable-sagas" }) }} — the headline `defineSaga`
  API, the `:8092` endpoints, the `kv | prisma` store switch, and the Learn / Do / Reference triplet.
- **Look it up:** {{ comp.xref({ key: "ref:sagas" }) }} for the full generated API surface, and
  {{ comp.xref({ key: "ref:queue" }) }} for the queue layer underneath message delivery.

{{ comp.nextPrev({ prev: { label: "Auth model", href: "/explanation/auth-model/" }, next: { label: "Observability", href: "/explanation/observability/" } }) }}
