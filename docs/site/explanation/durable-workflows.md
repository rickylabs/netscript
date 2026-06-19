---
layout: layouts/base.vto
title: Durable workflows
templateEngine: [vento, md]
prev: { label: "The plugin model", href: "/explanation/plugin-model/" }
next: { label: "Observability", href: "/explanation/observability/" }
---

{{ comp.breadcrumb() }}

# Durable workflows

This page is **understanding-oriented**. It explains *what makes a NetScript workflow
durable*, *how a saga keeps state across steps*, and *why* three capabilities — workers,
sagas, and triggers — compose into a single long-running process rather than one monolithic
handler. Read it to build the mental model; it is not a step-by-step guide. When you want to
build the workflow with your own hands, follow the
[durable workflow tutorial](/tutorials/durable-workflow/); when you want the headline API and
ports, see the [durable sagas capability](/capabilities/durable-sagas/); when you want the
exact exported symbols, follow [`reference/sagas/`](/reference/sagas/).

{{ comp callout { type: "important", title: "Alpha honesty up front" } }}
The saga builder, its state model, and the message-handler effects are <strong>real and
they compile</strong> — the scaffold ships a working <code>defineSaga(...)</code> sample and
a registry API at <code>:8092</code>. But two things are honest stubs you should not promise
runtime for: the worker job <em>tools</em> (<code>createJobTools(ctx)</code>'s
<code>trace</code> and <code>progress</code>) are <strong>no-ops</strong>, and the
<code>streams</code> producer/consumer bodies are empty. This page is precise about which
pieces are live so your mental model matches the running scaffold.
{{ /comp }}

## What "durable" actually means here

A plain request handler is **ephemeral**: it runs, returns, and forgets. If the process
restarts halfway through a multi-step business process — provision an account, charge a card,
send a welcome email — everything in memory is gone and there is no record of how far you got.
Durability is the property that lets a *logical* workflow outlive any *single* execution:
its progress is written down somewhere external to the process so that a restart, a retry, or
a second message can pick up exactly where the last one left off.

NetScript draws the durability boundary at the **saga**. A saga is a small, named state
machine whose state is persisted and whose transitions are driven by **messages** rather than
by a function returning to its caller. Because the state lives outside the process and the
inputs arrive as messages over time, a saga can span minutes, hours, or many process
lifetimes — that is what the word *durable* buys you.

{{ comp callout { type: "note", title: "Durability is about the state, not the speed" } }}
Durability does not mean "slow" or "queued forever". It means the workflow's
<strong>position</strong> — which step it is on and what it has accumulated so far — is
recorded outside the handler, so the workflow is correct even when the runtime is not
continuous. A saga that completes in one message is still durable; it just had one transition.
{{ /comp }}

## The saga builder: a state machine you declare, not wire

A saga is authored with a **fluent builder**. You declare four things — an id, a durability
tier, the shape and initial value of its state, and one or more message handlers — and call
`.build()` to freeze it into a definition the runtime can register and run.

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
    { name: "defineSaga(id)", type: "(id: string) => Builder", desc: "Opens the builder and names the saga. The id is the registry key and shows up at GET /api/v1/sagas/sagas." },
    { name: ".durability(tier)", type: "(tier: 't1') => Builder", desc: "Declares the durability tier the runtime persists this saga under. 't1' is the scaffolded tier — it is the contract for how aggressively state is written down." },
    { name: ".state<S>(initial)", type: "<S>(initial: S) => Builder", desc: "Declares the persisted state shape and its initial value. This object is what survives across messages and restarts." },
    { name: ".on<T,P>(type, handler)", type: "(type, (saga, msg, ctx) => Effect[]) => Builder", desc: "Registers a transition for one message type. The handler mutates saga.state and returns an array of effects (for example sagaComplete(...))." },
    { name: ".build()", type: "() => SagaDefinition", desc: "Freezes the chain into a SagaDefinition the runtime consumes. Nothing runs until build() and registration." }
  ]
}) }}

The mental model to hold: **`defineSaga(...).durability(...).state(...).on(...).build()` is a
declaration of a persisted state machine.** You are not writing imperative control flow that
falls off the end of a function — you are describing *which messages move the workflow* and
*what state each move leaves behind*.

{{ comp callout { type: "tip", title: "Why state lives on `saga.state`" } }}
The handler receives the live <code>saga</code> object and mutates <code>saga.state</code> in
place, then returns effects. Keeping state on the saga rather than in handler-local variables is
exactly what makes it <strong>durable</strong>: the runtime owns that object, persists it under
the declared <code>durability</code> tier, and rehydrates it before the next matching message.
A local variable would vanish; <code>saga.state</code> does not.
{{ /comp }}

## Compensation is modeled as effects, not a `.step()/.compensate()` chain

If you have used other orchestration frameworks, you may expect a saga to be a list of forward
steps each paired with a rollback (`.step().compensate()`). NetScript's scaffolded model is
deliberately different and worth understanding so you do not go looking for an API that is not
there.

A NetScript saga handler **returns an array of effects**. `sagaComplete({...})` is one such
effect — it signals the workflow reached a terminal, successful state. Compensation, retries,
and fan-out are expressed the same way: as values a message handler returns, interpreted by the
runtime, rather than as a separate rollback chain you register up front. The runtime consumes
`SagaDefinition` objects and applies the effect arrays your handlers produce.

{{ comp callout { type: "warning", title: "Don't reach for `.compensate()`" } }}
The scaffolded sample does <strong>not</strong> expose an explicit
<code>.step()/.compensate()</code> chain. Model corrective actions as additional effects
returned from a message handler — the same mechanism that emits <code>sagaComplete</code>. If
you document or teach this, frame compensation as an <em>effect</em>, not as a parallel rollback
DSL, so readers' expectations match the running code.
{{ /comp }}

## Correlation: how one saga instance finds its messages

A saga *definition* is a template; a running workflow is a saga *instance*. Many onboarding
flows can be in flight at once, so the runtime keys instances by a **correlation id** and
exposes them through the registry API. The registry stores saga metadata in Deno KV under keys
like `['saga', 'registry', id]`, and the API service lists definitions and live instances:

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

The thing to internalize: a saga's identity (`id`, registered via the builder) plus a
correlation id is what lets the durable state survive being put down and picked back up. The
runtime does not keep your workflow in memory; it looks the instance up by correlation, applies
the message, and writes the new state back.

## The worked example: three capabilities, one durable workflow

Durability becomes interesting when capabilities **compose**. The scaffold ships exactly this
choreography, and it is the same continuous app the [tutorials](/tutorials/) build rung by
rung. Follow one user-onboarding flow through three plugins:

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
```

Step by step, in the real code:

1. **A trigger turns an inbound webhook into a job.** The triggers plugin exposes raw Hono
   routes (not oRPC). `defineWebhook(...)` returns an array of `enqueueJob(jobRef, { payload,
   priority })` effects, so a `POST` to
   [`:8093/api/v1/webhooks/inbound/generic`](/capabilities/triggers/) enqueues a worker job.
   The webhook is the *ingress* of the durable flow.
2. **A worker job publishes the saga message.** The workers plugin's
   `create-user-settings` sample is an ordinary `defineJobHandler(async (ctx) => ...)` that, on
   success, **publishes the `UserSettingsCreated` message** via a saga publisher. The job is the
   *unit of work*; publishing the message is how it hands control to the durable layer.
3. **A saga consumes the message and emits `sagaComplete`.** The
   [sagas plugin](/capabilities/durable-sagas/) registers `userOnboardingSaga`, whose
   `.on('UserSettingsCreated', ...)` handler mutates `saga.state` and returns
   `[ sagaComplete({...}) ]`. That terminal effect is the durable workflow finishing.

```ts
// workers/jobs/create-user-settings.ts — the publish step, verbatim core
import { createSagaPublisher } from '@netscript/plugin-sagas/runtime';
import { createSuccessResult, defineJobHandler } from '@netscript/plugin-workers-core';
import { z } from 'zod';

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
<em>long-lived position</em> across many such messages. Splitting them means a transient job
failure can be retried without losing the workflow's accumulated state, and the same saga can
react to messages published by several different jobs. Composition, not a single mega-handler,
is what keeps each piece small and durable.
{{ /comp }}

## Why the model looks like this — the design trade-offs

The message-and-state shape is a deliberate set of trade-offs:

- **Persisted state over in-memory closures.** Putting the workflow's position on
  `saga.state` and persisting it under a `durability` tier is what survives restarts. The cost
  is that you think in transitions, not in straight-line code; the benefit is correctness across
  process lifetimes.
- **Effects over imperative side-effects.** Returning `sagaComplete({...})` (and other effects)
  instead of calling out directly keeps handlers pure and replayable. The runtime decides
  *when* and *how* effects apply, which is what makes retries and compensation tractable.
- **Composition over a workflow monolith.** Trigger → job → saga are three small capabilities
  wired by messages. Each can be added, tested, and scaled independently, and the
  [plugin model](/explanation/plugin-model/) is what lets a host assemble them without editing
  host code.
- **Honest stubs over fake guarantees.** Worker trace/progress tools and stream
  producer/consumer bodies are no-ops in the scaffold. The durable saga state and the
  `sagaComplete` effect are the parts that are genuinely live today, and the docs say so rather
  than promising spans the sample cannot draw.

## How this connects to the rest of NetScript

A durable workflow is not an island. It rides on top of the same primitives you have already
met or will meet:

- It is delivered as **plugins** — workers, sagas, triggers — through the
  [plugin model](/explanation/plugin-model/)'s contribution/registry mechanism.
- Its messages and effects are intended to be **observable**: see
  [observability](/explanation/observability/) for which signals are live (and which job tools
  are stubs) when you watch a workflow run.
- Its API surfaces (`:8091`, `:8092`, `:8093`) and the Postgres/Garnet backing store are brought
  up by [Aspire](/explanation/aspire/) — remember that `cd aspire && aspire run` is what makes
  the durable infrastructure available before any database command.

## Where to go next

- **Do it:** [Build a durable workflow](/tutorials/durable-workflow/) — the hands-on tutorial
  that adds the saga and consumes `UserSettingsCreated` end to end.
- **See the capability:** [Durable sagas](/capabilities/durable-sagas/) — the headline
  `defineSaga` API, the `:8092` endpoints, and the Learn / Do / Reference triplet.
- **Look it up:** [`reference/sagas/`](/reference/sagas/) for the full generated API surface of
  `@netscript/plugin-sagas`.

---

Back to the [explanation overview](/explanation/).
