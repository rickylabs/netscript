---
layout: layouts/base.vto
title: Durable sagas
templateEngine: [vento, md]
prev: { label: "Background jobs", href: "/capabilities/background-jobs/" }
next: { label: "Triggers & ingress", href: "/capabilities/triggers/" }
---

{{ comp.breadcrumb() }}

# Durable sagas

A saga is the answer to the question every retry loop dodges: *what happens between
step three and step four when the process dies?* In NetScript a saga is an explicit,
message-driven state machine — you declare the state it carries, the messages it
reacts to, and the effects each handler emits. It is authored with a single fluent
builder, persisted to a durability tier, and served by the **sagas plugin** on port
`:8092`. The model is closer to Temporal than to a job queue, but it lives in plain
TypeScript inside your workspace — no separate cluster to operate.

This is the third capability in the continuous-app thread. The
[background jobs](/capabilities/background-jobs/) capability ended with a job,
`create-user-settings`, that publishes a `UserSettingsCreated` message. Here that
message stops being fire-and-forget: a saga **consumes it**, advances its own state,
and emits a `sagaComplete(...)` effect that the runtime records as a first-class
outcome.

{{ comp callout { type: "note", title: "Where it lives" } }}
The plugin is installed at <code>plugins/sagas/</code> and referenced by
<code>netscript.config.ts</code> as <code>./plugins/sagas/mod.ts</code>. The fluent
builder and effect helpers come from <code>@netscript/plugin-sagas-core</code>; the
config-time companion (<code>defineSagaConfig</code>) comes from
<code>@netscript/plugin-sagas-core/config</code>. Add it to a workspace with
<code>netscript plugin add saga --samples</code>.
{{ /comp }}

## The headline API

A saga is built with `defineSaga(id)` and a chain of three load-bearing calls before
`.build()`:

- **`.durability('t1')`** picks the persistence tier the saga's state is checkpointed
  to. `'t1'` is the tier the scaffolded sample uses.
- **`.state<S>({ ... })`** declares the typed state object the saga carries across
  messages, seeded with its initial value.
- **`.on<Type, Payload>(type, handler)`** registers a message handler. The handler
  receives `(saga, message, context)`, mutates `saga.state`, and **returns an array
  of effects** — completion (`sagaComplete`), failure, or further messages. This is
  where compensation lives: it is modeled as handler effects, not an explicit
  `.step()/.compensate()` chain.

The simple tab below is the minimal saga the scaffolder emits. The advanced tab shows
the shape you grow into: a real state type, multiple `.on(...)` handlers, and a
completion effect carrying a correlation-friendly payload.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Simple — minimal saga",
    lang: "ts",
    code: "// plugins/sagas/<your-saga>.ts\nimport { defineSaga, sagaComplete } from '@netscript/plugin-sagas-core';\n\ntype State = Readonly<{ status: string; processedAt?: string }>;\ntype Message = Readonly<{ type: 'UserSettingsCreated'; payload: unknown }>;\n\n// Build a saga: id -> durability tier -> typed state -> message handlers -> build().\nexport const userSettingsSaga = defineSaga('user-settings-saga')\n  .durability('t1')\n  .state<State>({ status: 'pending' })\n  .on<Message['type'], Message['payload']>(\n    'UserSettingsCreated',\n    (saga, message, context) => {\n      // Advance the saga's own state, then emit completion as a recorded outcome.\n      saga.state = {\n        ...saga.state,\n        status: 'completed',\n        processedAt: context.now.toISOString(),\n      };\n      return [sagaComplete({\n        messageType: message.type,\n        processedAt: context.now.toISOString(),\n      })];\n    },\n  )\n  .build();\n\nexport default userSettingsSaga;"
  },
  {
    label: "Advanced — durability + state + multiple on() handlers",
    lang: "ts",
    code: "// plugins/sagas/onboarding-saga.ts\nimport { defineSaga, sagaComplete } from '@netscript/plugin-sagas-core';\n\n// The state is the source of truth that survives across messages and crashes.\ntype OnboardingState = Readonly<{\n  status: 'awaiting-settings' | 'awaiting-welcome' | 'completed';\n  userId?: string;\n  settingsReadyAt?: string;\n  welcomedAt?: string;\n}>;\n\ntype SettingsCreated = Readonly<{ userId: string }>;\ntype WelcomeSent = Readonly<{ userId: string }>;\n\nexport const onboardingSaga = defineSaga('user-onboarding-saga')\n  // Durability tier: where the runtime checkpoints state between messages.\n  .durability('t1')\n  // Typed initial state, seeded once at instance creation.\n  .state<OnboardingState>({ status: 'awaiting-settings' })\n  // Handler 1: consume the message the workers job published.\n  .on<'UserSettingsCreated', SettingsCreated>(\n    'UserSettingsCreated',\n    (saga, message, context) => {\n      saga.state = {\n        ...saga.state,\n        status: 'awaiting-welcome',\n        userId: message.payload.userId,\n        settingsReadyAt: context.now.toISOString(),\n      };\n      // No effect yet — wait for the next correlated message.\n      return [];\n    },\n  )\n  // Handler 2: a second message advances the same instance to completion.\n  .on<'WelcomeEmailSent', WelcomeSent>(\n    'WelcomeEmailSent',\n    (saga, message, context) => {\n      saga.state = {\n        ...saga.state,\n        status: 'completed',\n        welcomedAt: context.now.toISOString(),\n      };\n      // Completion is named, recorded, and carries a correlation payload.\n      return [sagaComplete({\n        userId: saga.state.userId,\n        completedAt: context.now.toISOString(),\n      })];\n    },\n  )\n  .build();\n\nexport default onboardingSaga;"
  }
] }) }}

{{ comp callout { type: "tip", title: "Two ways to register a saga" } }}
The builder above produces the <strong>runtime</strong> saga. There is also a
<strong>config-time</strong> companion,
<code>defineSagaConfig(id, entrypoint).name(...).description(...).topic(...).tags(...).build()</code>
from <code>@netscript/plugin-sagas-core/config</code>, which the service uses to publish
saga <em>metadata</em> into Deno KV (under <code>['saga','registry', id]</code>) so the
API can list it. The runtime consumes <code>SagaDefinition</code> objects; the config
describes them.
{{ /comp }}

## How completion and compensation work

Each `.on(...)` handler returns an array of effects. The scaffolded sample uses
`sagaComplete(...)`, which marks the instance finished and records its payload. Failure
and follow-on messages are expressed the same way — by returning the matching effect
from a handler — so a saga's entire lifecycle (advance, complete, fail, compensate) is
**named outcomes returned from handlers**, never a fall-through or an unhandled throw.

{{ comp callout { type: "important", title: "Compensation is effects, not a step/compensate chain" } }}
The scaffolded sample does <strong>not</strong> use an explicit
<code>.step().compensate()</code> chain. Compensation is modeled as ordinary message
handlers that return effect arrays — you react to a failure message by emitting the
undo as another effect. Don't document a step/compensate API the sample doesn't ship.
{{ /comp }}

## Endpoints and ports

The sagas plugin runs an oRPC API service on `:8092`. It lists registered sagas and
inspects running instances; the registry is backed by Deno KV. These are the routes
the live scaffold serves — see [`/reference/sagas/`](/reference/sagas/) for the full
generated surface.

{{ comp.apiTable({
  caption: "Sagas plugin — runtime endpoints (port :8092)",
  rows: [
    { name: "GET /health/live", type: "liveness", desc: "Liveness probe for the sagas API service." },
    { name: "GET /api/v1/sagas/sagas", type: "registry", desc: "List the saga definitions registered into KV (id, name, topic, handled message types, enabled)." },
    { name: "GET /api/v1/sagas/instances", type: "instances", desc: "List running and completed saga instances. Inspect one with /instances/{sagaName}/{correlationId}." },
    { name: "POST /api/v1/sagas/publish", type: "publish", desc: "Publish a message to the saga bus — the same path the workers create-user-settings job uses to emit UserSettingsCreated." },
    { name: "GET /api/v1/sagas/subscribe", type: "stream (SSE)", desc: "Server-sent-events stream of saga activity, KV-watch backed." }
  ]
}) }}

{{ comp callout { type: "warning", title: "Aspire first, then anything stateful" } }}
The sagas service needs Postgres and Garnet up before it can persist and list
instances. Bring orchestration up first — <code>cd aspire &amp;&amp; aspire run</code>
(dashboard at <a href="http://localhost:18888"><code>http://localhost:18888</code></a>) —
<em>before</em> any <code>netscript db</code> command or before you expect
<code>/api/v1/sagas/instances</code> to return durable state. DB commands require
Aspire running first.
{{ /comp }}

## The continuous-app choreography

The thread that ties the capabilities together is real and it compiles. The workers
plugin's `create-user-settings` job calls a saga publisher and emits
`UserSettingsCreated`; this saga's `.on('UserSettingsCreated', ...)` handler consumes
it and emits `sagaComplete(...)`. One message crosses the plugin boundary, and both
halves are type-checked against the same message type.

{{ comp.tabbedCode({ tabs: [
  {
    label: "The job that publishes (workers)",
    lang: "ts",
    code: "// plugins/workers/jobs/create-user-settings.ts (core, verbatim from the scaffold)\nimport { createSagaPublisher } from '@netscript/plugin-sagas/runtime';\nimport { createSuccessResult, defineJobHandler } from '@netscript/plugin-workers-core';\nimport { z } from 'zod';\n\nconst PayloadSchema = z.object({ userId: z.string().min(1) });\nconst sagaPublisher = createSagaPublisher<UserRegistrationMessage>();\n\nconst handler = defineJobHandler(async (ctx) => {\n  const { userId } = PayloadSchema.parse(ctx.payload ?? {});\n  // This is the message the saga below consumes.\n  await sagaPublisher.publish({ type: 'UserSettingsCreated', payload: { userId } });\n  return createSuccessResult({ userId, settingsCreated: true });\n});\n\nexport default Object.assign(handler, { id: 'create-user-settings' });"
  },
  {
    label: "The saga that consumes (sagas)",
    lang: "ts",
    code: "// plugins/sagas/user-settings-saga.ts\nimport { defineSaga, sagaComplete } from '@netscript/plugin-sagas-core';\n\ntype State = Readonly<{ status: string; processedAt?: string }>;\n\nexport const userSettingsSaga = defineSaga('user-settings-saga')\n  .durability('t1')\n  .state<State>({ status: 'pending' })\n  .on<'UserSettingsCreated', { userId: string }>(\n    'UserSettingsCreated',\n    (saga, message, context) => {\n      saga.state = { ...saga.state, status: 'completed', processedAt: context.now.toISOString() };\n      return [sagaComplete({ userId: message.payload.userId, processedAt: context.now.toISOString() })];\n    },\n  )\n  .build();"
  }
] }) }}

After both plugins are running under Aspire, trigger the workers job
(`POST :8091/api/v1/workers/jobs/create-user-settings/trigger`) and watch the saga
appear at `GET :8092/api/v1/sagas/instances` — the message crossed the boundary and a
durable instance recorded its completion.

## Learn · Do · Reference

{{ comp.card({
  title: "Learn — Build a durable workflow",
  body: "The tutorial rung that adds the sagas plugin to the running app, consumes the UserSettingsCreated message published by the workers job, and emits sagaComplete. Walks the whole builder end to end.",
  href: "/tutorials/durable-workflow/",
  icon: "◆"
}) }}

{{ comp.card({
  title: "Do — Add a plugin",
  body: "The task recipe for installing a saga (or any plugin) into a workspace with netscript plugin add saga --samples, where it lands under plugins/sagas/, and how the registry is generated.",
  href: "/how-to/add-a-plugin/",
  icon: "◎"
}) }}

{{ comp.card({
  title: "Reference — sagas",
  body: "The full generated @netscript/plugin-sagas API: the defineSaga builder, durability tiers, effect helpers (sagaComplete and friends), the SagaDefinition domain types, and every :8092 route.",
  href: "/reference/sagas/",
  icon: "≡"
}) }}

## Why a saga, and why not

{{ comp callout { type: "tip", title: "Reach for a saga when…" } }}
You have a multi-step process where steps can fail independently and the
<strong>state between steps must survive a crash</strong> — onboarding, checkout,
provisioning. The correlation, persistence, and named completion/failure outcomes are
exactly what a hand-rolled retry loop lacks.
{{ /comp }}

{{ comp callout { type: "warning", title: "Don't reach for a saga when…" } }}
The work is a single idempotent unit with no inter-step state — that is a
<a href="/capabilities/background-jobs/">background job</a>, not a saga. And remember
the alpha reality: durability and the instance store depend on Postgres being up via
Aspire, so a saga is not a substitute for a database transaction within one handler.
{{ /comp }}

{{ comp.nextPrev({
  prev: { label: "Background jobs", href: "/capabilities/background-jobs/" },
  next: { label: "Triggers & ingress", href: "/capabilities/triggers/" }
}) }}
