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
builder, persisted to a durable store, and served by the **sagas plugin** on port
`:8092`. The model is closer to Temporal than to a job queue, but it lives in plain
TypeScript inside your workspace — no separate cluster to operate.

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
(<code>createDurableSagaRuntime</code>) comes from the
<code>@netscript/plugin-sagas/runtime</code> subpath. Add it to a workspace with
<code>netscript plugin add saga --samples</code>.
{{ /comp }}

{{ comp.featureGrid({
  columns: 3,
  items: [
    { icon: "◆", title: "Fluent builder", body: "defineSaga(id).durability().state().on().build() — id, durability tier, typed state, message handlers, then build(). One chain, fully type-checked." },
    { icon: "▣", title: "Durable store backend", body: "Runtime state persists to kv or prisma, chosen by NETSCRIPT_SAGA_STORE / appsettings. createDurableSagaRuntime({ backend, prisma }) owns the resources." },
    { icon: "≋", title: "Effect-based outcomes", body: "Every handler returns an array of effects — advance, complete, fail, compensate are named outcomes returned from handlers, never a fall-through." },
    { icon: "⊡", title: "Served on :8092", body: "An oRPC API lists registered sagas, inspects running instances, publishes messages, and streams activity over SSE." },
    { icon: "⇄", title: "Cross-plugin choreography", body: "The workers create-user-settings job publishes UserSettingsCreated; this saga consumes it — one message crossing the plugin boundary, type-checked on both sides." },
    { icon: "◷", title: "Crash-survivable", body: "State checkpoints between messages, so an instance picks up exactly where it left off after a restart. That survival is the entire point of a saga." }
  ]
}) }}

## The headline API

A saga is built with `defineSaga(id)` and a chain of three load-bearing calls before
`.build()`:

- **`.durability('t1')`** picks the persistence **tier** the saga's state is
  checkpointed to. `'t1'` is the tier the scaffolded sample uses. This is the
  saga-definition durability *tier* (`SAGA_DURABILITY_TIERS`) — a different concept
  from the runtime **store backend** (`kv`/`prisma`) covered in the next section, so
  keep the two straight.
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

## Choosing a durable store backend

Authoring a saga decides *what* it does. The **durable store backend** decides *where
its runtime state lives between messages and across crashes*. NetScript ships two
backends, and the choice is **explicit and mandatory** — the runtime refuses to start
without one.

- **`kv`** — durable saga state in Deno KV (the orchestration store stood up by
  Aspire). Zero extra schema; the natural default for a single-service app and for
  local development.
- **`prisma`** — durable saga state in Postgres via Prisma. The `PrismaSagaStore`
  writes the dedicated runtime tables `saga_runtime_state`, `saga_runtime_transition`,
  and `saga_runtime_correlation`. Reach for this when you want the saga's own write
  path in your relational database alongside the rest of your data, with SQL-level
  inspection of in-flight state and transition history.

You select the backend with the `NETSCRIPT_SAGA_STORE` environment variable
(`kv` | `prisma`) or the appsettings key `sagas.store.backend`. If neither is set the
runtime **throws** — there is no silent default, by design, so a deployment can never
guess wrong about where durable state lands.

{{ comp.apiTable({
  caption: "Durable saga store backends — trait matrix",
  rows: [
    { name: "kv", type: "Deno KV", desc: "Default for local/single-service. No extra schema. Provisioned by Aspire (Garnet/KV). Resolved via NETSCRIPT_SAGA_STORE=kv or sagas.store.backend=kv." },
    { name: "prisma", type: "Postgres / Prisma", desc: "Writes saga_runtime_state, saga_runtime_transition, saga_runtime_correlation. Requires a Prisma client passed to createDurableSagaRuntime. SQL-inspectable in-flight state. Resolved via NETSCRIPT_SAGA_STORE=prisma or sagas.store.backend=prisma." },
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
    code: "import {\n  createDurableSagaRuntime,\n  resolveSagaStoreBackend,\n} from '@netscript/plugin-sagas/runtime';\n\n// Read the backend from the environment (or appsettings) — throws if unset.\nconst backend = resolveSagaStoreBackend({\n  env: Deno.env.toObject(),\n  // appsettings: loadedAppsettings, // sagas.store.backend\n});\n\nconst runtime = await createDurableSagaRuntime({\n  backend,\n  prisma: backend === 'prisma' ? prismaClient : undefined,\n});"
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
<code>/api/v1/sagas/instances</code> to return durable state. This holds for both
backends: <code>kv</code> needs Garnet/KV up, and <code>prisma</code> needs Postgres up
with the <code>saga_runtime_*</code> tables migrated. DB commands require Aspire running
first.
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
durable instance recorded its completion. Whether that durable instance lives in Deno
KV or in your `saga_runtime_*` Postgres tables is exactly the `NETSCRIPT_SAGA_STORE`
choice above.

## Learn · Do · Reference

{{ comp.card({
  title: "Learn — Build a durable workflow",
  body: "The tutorial rung that adds the sagas plugin to the running app, consumes the UserSettingsCreated message published by the workers job, and emits sagaComplete. Walks the whole builder end to end.",
  href: "/tutorials/durable-workflow/",
  icon: "◆"
}) }}

{{ comp.card({
  title: "Understand — Why durable workflows",
  body: "The conceptual companion: why a saga's state must outlive the process, how effect-based outcomes differ from a retry loop, and where the kv vs prisma durable store backends fit the durability model.",
  href: "/explanation/durable-workflows/",
  icon: "✲"
}) }}

{{ comp.card({
  title: "Reference — sagas",
  body: "The full generated @netscript/plugin-sagas API: the defineSaga builder, durability tiers, createDurableSagaRuntime, the kv/prisma store backends, effect helpers (sagaComplete and friends), the SagaDefinition domain types, and every :8092 route.",
  href: "/reference/sagas/",
  icon: "≡"
}) }}

## Why a saga, and why not

{{ comp callout { type: "tip", title: "Reach for a saga when…" } }}
You have a multi-step process where steps can fail independently and the
<strong>state between steps must survive a crash</strong> — onboarding, checkout,
provisioning. The correlation, persistence, and named completion/failure outcomes are
exactly what a hand-rolled retry loop lacks. Pick <code>prisma</code> as the store
backend when you also want that in-flight state queryable in your relational database.
{{ /comp }}

{{ comp callout { type: "warning", title: "Don't reach for a saga when…" } }}
The work is a single idempotent unit with no inter-step state — that is a
<a href="/capabilities/background-jobs/">background job</a>, not a saga. And remember
the alpha reality: durability and the instance store depend on the orchestration stack
being up via Aspire (Garnet/KV for <code>kv</code>, Postgres for <code>prisma</code>),
so a saga is not a substitute for a database transaction within one handler.
{{ /comp }}

{{ comp.nextPrev({
  prev: { label: "Background jobs", href: "/capabilities/background-jobs/" },
  next: { label: "Triggers & ingress", href: "/capabilities/triggers/" }
}) }}
