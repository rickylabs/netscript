---
layout: layouts/base.vto
title: A durable workflow
templateEngine: [vento, md]
prev: { label: "3 · Add background jobs", href: "/tutorials/background-jobs/" }
next: { label: "5 · Ingest a webhook", href: "/tutorials/ingest-webhook/" }
---

# Tutorial 4 · A durable workflow

In [Tutorial 3](/tutorials/background-jobs/) you added the `workers` plugin and authored the
`create-user-settings` job. That job does one quietly important thing on its last line: it
**publishes a `UserSettingsCreated` message**. Up to now nothing was listening. This rung adds the
listener.

You will install the `sagas` plugin and build a **durable workflow** — a long-lived, message-driven
state machine that survives restarts. The saga subscribes to the exact message the worker publishes,
advances its own state, and emits a `sagaComplete` effect. By the end the two plugins are wired
end-to-end: a job runs, a message flows, a saga reacts, and you can see the completed instance over
HTTP on port `:8092`.

This is the heart of the continuous app the ladder is building — the **fil d'Ariane** connecting
worker output to saga input.

{{ comp.learningPath({ steps: [
  { label: "Quickstart", href: "/quickstart/" },
  { label: "1 · First workspace", href: "/tutorials/first-workspace/" },
  { label: "2 · Build a service", href: "/tutorials/build-a-service/" },
  { label: "3 · Background jobs", href: "/tutorials/background-jobs/" },
  { label: "4 · Durable workflow", href: "/tutorials/durable-workflow/" },
  { label: "5 · Ingest a webhook", href: "/tutorials/ingest-webhook/" }
] }) }}

## In this step you will

- Add the official `sagas` plugin to your workspace with `netscript plugin add saga --samples`.
- Author a saga with the fluent builder: `defineSaga(id).durability().state().on().build()`.
- Subscribe it to the `UserSettingsCreated` message the worker job publishes.
- Emit a `sagaComplete` effect when the workflow finishes.
- List your saga and inspect completed instances on the **Sagas API at `:8092`**.

## Prerequisites — check your state

This rung continues the same app. Before you start, confirm:

- You finished [Tutorial 3](/tutorials/background-jobs/) and have a `plugins/workers/` directory
  containing the `create-user-settings` job that publishes `UserSettingsCreated`.
- `aspire run` is still up in its own terminal (the dashboard answers at
  `http://localhost:18888`). The saga registry and instance store both live in Deno KV, which the
  Aspire-managed services depend on.

{{ comp callout { type: "important", title: "Aspire must already be running" } }}
The Sagas API service and its KV-backed registry come up as part of the orchestrated app. If you closed your <code>aspire run</code> terminal, restart it from the <code>aspire/</code> folder (<code>cd aspire &amp;&amp; aspire run</code>) <strong>before</strong> running any <code>netscript</code> command in this tutorial. Database and KV resources only exist while Aspire is up.
{{ /comp }}

## Step 1 — Add the sagas plugin

Sagas ship as an official NetScript plugin. Add it from the project root, with its sample saga
included so you have a working module to adapt:

```sh
netscript plugin add saga --samples
```

The plugin lands at the canonical location **`plugins/sagas/`**, and `netscript.config.ts` is
updated to reference `./plugins/sagas/mod.ts`. A slimmer top-level `sagas/` workspace directory is
also created as the background-processor staging copy — you author against `plugins/sagas/`.

Confirm it registered:

```sh
netscript plugin list
```

You should see `sagas` alongside the `workers` plugin from the previous rung. (Adding `saga` also
pulls in its `streams` dependency, which is how cross-plugin messages travel.)

{{ comp callout { type: "note", title: "What landed on disk" } }}
The <code>plugins/sagas/</code> tree includes <code>mod.ts</code> (the plugin manifest), <code>contracts/v1/</code>, <code>database/sagas.prisma</code>, an oRPC API service under <code>services/src/</code>, and the saga runtime under <code>src/runtime/</code> (<code>saga-runner.ts</code>, <code>saga-supervisor.ts</code>, <code>saga-publisher.ts</code>). The sample saga is emitted by the scaffolder template — it is the module you will edit next.
{{ /comp }}

## Step 2 — Read the saga builder

NetScript sagas are authored with a **fluent builder** imported from
`@netscript/plugin-sagas-core`. Each call narrows the saga's type and configuration, and `.build()`
produces the definition the runtime consumes. The shape is:

{{ comp.tabbedCode({ tabs: [
  { label: "The builder chain", lang: "ts", code: "import { defineSaga, sagaComplete } from '@netscript/plugin-sagas-core';\n\nexport const exampleSaga = defineSaga('user-onboarding')\n  .durability('t1')           // persistence tier — survive restarts\n  .state({ status: 'pending' }) // initial state for each instance\n  .on('UserSettingsCreated', (saga, message, context) => {\n    // advance state + return effects\n    return [];\n  })\n  .build();" }
] }) }}

Each link in the chain has a job:

- **`defineSaga(id)`** — starts the builder with a stable saga id (used in the registry and instance
  keys).
- **`.durability('t1')`** — selects the durability tier. `'t1'` is the persisted tier: instance
  state is checkpointed so an in-flight workflow survives a process restart. This is what makes the
  workflow _durable_ rather than a fire-and-forget callback.
- **`.state<S>({...})`** — declares the per-instance state shape and its initial value. Every
  correlated workflow instance gets its own copy of this state.
- **`.on<Type, Payload>(type, handler)`** — subscribes to a message type. The handler receives
  `(saga, message, context)`, may mutate `saga.state`, and **returns an array of effects**.
- **`.build()`** — finalizes the `SagaDefinition` the saga runner executes.

{{ comp callout { type: "note", title: "Compensation is modeled as effects, not steps" } }}
If you have used other saga frameworks you may expect a <code>.step()</code> / <code>.compensate()</code> chain. NetScript's scaffolded sample takes a different shape: each <code>.on()</code> message handler returns an array of <strong>effects</strong> (such as <code>sagaComplete(...)</code>). Compensation is just another effect you return from a handler, not a separate DSL. See <a href="/explanation/durable-workflows/">Durable workflows</a> for the reasoning behind this design.
{{ /comp }}

## Step 3 — Subscribe to the worker's message

Open the sample saga module under `plugins/sagas/` and adapt it to handle the message the
`create-user-settings` job publishes. Recall from Tutorial 3 that the job ends with:

```ts
// plugins/workers/jobs/create-user-settings.ts (from Tutorial 3)
await sagaPublisher.publish({
  type: 'UserSettingsCreated',
  payload: { userId },
});
```

So the saga must listen for the `UserSettingsCreated` type and read `payload.userId`. Replace the
sample body with this onboarding saga:

{{ comp.tabbedCode({ tabs: [
  { label: "plugins/sagas/.../user-onboarding.ts", lang: "ts", code: "import { defineSaga, sagaComplete } from '@netscript/plugin-sagas-core';\n\n// The state each onboarding instance carries.\ntype OnboardingState = Readonly<{\n  status: 'pending' | 'completed';\n  userId?: string;\n  processedAt?: string;\n}>;\n\n// The message published by the workers `create-user-settings` job.\ntype UserSettingsCreated = Readonly<{ userId: string }>;\n\nexport const userOnboardingSaga = defineSaga('user-onboarding')\n  .durability('t1')\n  .state<OnboardingState>({ status: 'pending' })\n  .on<'UserSettingsCreated', UserSettingsCreated>(\n    'UserSettingsCreated',\n    (saga, message, context) => {\n      const processedAt = context.now.toISOString();\n      saga.state = {\n        ...saga.state,\n        status: 'completed',\n        userId: message.payload.userId,\n        processedAt,\n      };\n      return [\n        sagaComplete({\n          messageType: message.type,\n          userId: message.payload.userId,\n          processedAt,\n        }),\n      ];\n    },\n  )\n  .build();\n\nexport default userOnboardingSaga;" }
] }) }}

What this does, line by line:

- The instance starts in `status: 'pending'` — that is the value passed to `.state()`.
- `.on('UserSettingsCreated', …)` registers the handler for exactly the message type the worker
  publishes. The two plugins agree on the string `'UserSettingsCreated'`; that agreement _is_ the
  contract between them.
- Inside the handler, the saga reads `message.payload.userId`, stamps `context.now`, and assigns a
  new `saga.state`. Because the saga is `durability('t1')`, this state is checkpointed.
- The handler returns one effect, `sagaComplete({...})`, which signals the runtime that this
  workflow instance is finished. The completion metadata you pass is recorded on the instance.

{{ comp callout { type: "tip", title: "The message type is the join point" } }}
There is no shared function call between the worker and the saga — they are isolated background processors in different threads. The worker <code>publish(... 'UserSettingsCreated' ...)</code> and the saga <code>.on('UserSettingsCreated', ...)</code> are joined only by the message type traveling through the streams transport. Keep the string identical on both sides.
{{ /comp }}

## Step 4 — Register the saga

The Sagas API service lists sagas from a **KV-backed registry** (`['saga','registry', <id>]`). The
scaffold's saga runtime registers your built definition on startup, recording metadata of the form
`{ id, name, topic, handledMessageTypes, registeredAt, enabled }`. Because `aspire run` already
brings the sagas background processor and API service up together, you do not start anything by hand
— the saga you authored is picked up when the orchestrated app (re)starts.

Type-check the workspace to confirm your saga compiles against the builder's generic signatures:

```sh
deno task check
```

A clean check means `defineSaga`, `.durability()`, `.state()`, `.on()`, and `.build()` all line up
with the message and state types you declared.

## Step 5 — Verify the workflow end-to-end

With Aspire up, exercise the full thread: trigger the worker job, let it publish, and watch the saga
complete.

First confirm the saga registered. Against the **Sagas API on `:8092`**:

```sh
curl http://localhost:8092/api/v1/sagas/sagas
```

You should see your `user-onboarding` saga in the list, with `UserSettingsCreated` among its handled
message types.

Now trigger the worker job from Tutorial 3 (it runs on the Workers API at `:8091`) so it publishes
the message:

```sh
curl -X POST http://localhost:8091/api/v1/workers/jobs/create-user-settings/trigger \
  -H 'content-type: application/json' \
  -d '{ "userId": "u_1001" }'
```

The job parses the payload, publishes `{ type: 'UserSettingsCreated', payload: { userId: "u_1001" } }`,
and returns a success result. The saga runner receives that message, runs your `.on()` handler,
advances state to `completed`, and emits `sagaComplete`. Inspect the resulting instances:

```sh
curl http://localhost:8092/api/v1/sagas/instances
```

You should see a completed `user-onboarding` instance carrying `userId: "u_1001"` and the
`processedAt` timestamp your handler stamped. You can also confirm the service is healthy at any
time:

```sh
curl http://localhost:8092/health/live
```

{{ comp callout { type: "warning", title: "Production pitfall — durability is not free correctness" } }}
<code>durability('t1')</code> persists instance state so a workflow survives a restart, but it does <strong>not</strong> dedupe inbound messages for you. If the worker re-publishes <code>UserSettingsCreated</code> for the same <code>userId</code>, your handler runs again. Make handlers idempotent — check <code>saga.state.status</code> before re-applying side effects — so a redelivered message can't double-complete a workflow.
{{ /comp }}

## What you built

The two halves of a durable choreography, joined by a single message:

- A `sagas` plugin at `plugins/sagas/`, added with `netscript plugin add saga --samples`.
- A `user-onboarding` saga built with the fluent
  `defineSaga().durability().state().on().build()` chain, subscribed to the `UserSettingsCreated`
  message the worker publishes.
- A `sagaComplete` effect that records the finished workflow, observable as a completed instance on
  the Sagas API at `:8092`.

The worker produces; the saga consumes; the instance store remembers. That is a durable workflow.

## Where to go next

- **Continue the ladder** → [Tutorial 5 · Ingest a webhook](/tutorials/ingest-webhook/) — add the
  `triggers` plugin and turn an inbound `POST` into a background job, closing the loop back to
  workers.
- **Understand the model** → [Durable workflows](/explanation/durable-workflows/) — durability
  tiers, correlation, instances, and why compensation is modeled as effects.
- **Full generated API** → the [sagas reference](/reference/sagas/) — every route, type, and symbol
  the `sagas` plugin exposes.
