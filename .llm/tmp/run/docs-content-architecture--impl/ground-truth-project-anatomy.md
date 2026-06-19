# Ground-Truth Project Anatomy

Source project (scaffolded by the CLI E2E `scaffold.runtime` suite):

```
C:\Dev\repos\netscript-framework\.claude\worktrees\agent-a6564d6730edc2f15\.llm\tmp\cli-e2e\plugin-smoke-20260619-052006
```

This report reflects the **actual files on disk**, not a guess. Code snippets are trimmed but
otherwise verbatim. Project name token throughout: `plugin-smoke-20260619-052006`.

> **CRITICAL LAYOUT FACT (differs from the prompt's assumption):** the four installed plugins live
> under **`plugins/<name>/`** — `plugins/workers`, `plugins/sagas`, `plugins/triggers`,
> `plugins/streams`. These are the canonical, config-referenced installs. There are **also**
> slimmer top-level `workers/`, `sagas/`, `triggers/` dirs (workspace members, background-processor
> staging copies that mirror a subset of files). `netscript.config.ts` points only at
> `./plugins/*/mod.ts`, and `appsettings.json` plugin `Workdir`s are `plugins/workers`,
> `plugins/sagas`, `plugins/triggers`, `plugins/streams`. **Document `plugins/<name>/` as the real
> install location.** All paths below are under `plugins/` unless stated.

---

## Summary Table

| Plugin / Unit | Headline authoring API | Primary import specifier | HTTP route prefix | Service port |
|---|---|---|---|---|
| **workers** | `defineJobHandler(async (ctx) => …)` + `createJobTools(ctx)` + `createSuccessResult`/`createFailureResult`; job id via `Object.assign(handler, { id })` | `@netscript/plugin-workers-core` | `/api/v1/workers/*` (`jobs`, `executions`, `tasks`, `seed`, `subscribe`, `jobs/{id}/trigger`) | **8091** |
| **sagas** | Fluent builder: `defineSaga(id).durability('t1').state<S>({…}).on<Type,Payload>(type, fn).build()`; emit `sagaComplete({…})` | `@netscript/plugin-sagas-core` | `/api/v1/sagas/*` (`sagas`, `instances`, `publish`, `subscribe`) + `/health/live` | **8092** |
| **triggers** | `defineWebhook(handler, { id, path, verifier, tags })` returning `enqueueJob(jobRef, { payload, priority })[]` | `@netscript/plugin-triggers-core/builders` | `/api/v1/webhooks/inbound/generic`, `/api/v1/webhooks/:triggerId`, `/api/v1/events` | **8093** |
| **streams** | `defineStreamTopic(name, schema)`, `defineStreamProducer(topic)`, `defineStreamConsumer(topic)` | `@netscript/plugin-streams` (manifest) / `@netscript/plugin-streams-core` (schemas) | `services/src/main.ts` (durable-streams dev service) | **4437** |
| **users service** | `defineService(router, { name, version, port, openapi })`; handlers via `v1.users.list.handler(...)` | `@netscript/service` + `@plugin-smoke-…/contracts` | `/api/v1/users/*`, `/api/rpc/v1/...` | **3001** |
| **contracts** | `oc.route(...).input(zod).output(zod)` then `implement(Contract)` | `@orpc/contract`, `@orpc/server`, `zod` | n/a | n/a |

Background processors (separate from API services) run from `bin/combined.ts` (workers, sagas) and
`src/runtime/trigger-processor.ts` (triggers); see appsettings `BackgroundProcessors`.

---

## 1. workers (`plugins/workers/`)

### Directory layout
- `mod.ts` — public manifest: `export { inspectWorkers, workersPlugin }` + manifest types.
- `contracts.ts` — re-exports `@netscript/plugin-workers-core/contracts/v1` (frontend-safe, no ioredis).
- `jobs/` — **the sample job authoring surface**: `health-check.ts`, `create-user-settings.ts`,
  `job-tools.ts` (local `createJobTools` helper).
- `contracts/v1/` — `workers.contract.ts` (re-export), `mod.ts`.
- `database/workers.prisma` — plugin's Prisma models.
- `services/src/` — oRPC API service: `main.ts`, `router.ts`, `routers/{jobs,runs,tasks,admin,subscribe,health,v1,router-context}.ts`, `service-runtime.ts`, `init.ts`.
- `bin/` — background entrypoints: `combined.ts`, `runtime.ts`, `scheduler.ts`, `worker.ts`.
- `runtime/tasks/v1.0.0.json`, `runtime/current` — runtime registry version pin.
- `streams/`, `worker/`, `src/` (aspire/cli/scaffolding/e2e/public), `docs/`, `tests/`, `test-api.ts`, `verify-plugin.ts`, `scaffold.plugin.json`, `scaffold.runtime.json`, `deno.json`.

### Headline authoring API (`jobs/create-user-settings.ts`, verbatim core)
```ts
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

The richer `jobs/health-check.ts` shows the full tool surface via `createJobTools(ctx)`:
```ts
const { log, progress, trace } = createJobTools(ctx);
log.info('Starting workers plugin health check');
trace.addEvent('health_check.started', { verbose });
progress(20, 'Checking environment');
const envCheck = await trace.withChildSpan('check.environment', (span) => { span.setAttribute(...); ... });
// ...returns createSuccessResult(result) on healthy, else createFailureResult(message)
const healthCheckJob = Object.assign(handler, { id: 'workers-plugin-health-check' as const });
```
`createJobTools` (in `jobs/job-tools.ts`) wraps `JobHandlerContext` and exposes `log`, `progress`,
`trace.{addEvent,recordProgress,withChildSpan}`, and `traceContext`. Note the trace/progress are
**no-op stubs** in the scaffolded copy (console.* logging; spans are no-ops) — a doc author should
not promise real OTel spans from the sample tools.

### Manifest / config
`scaffold.plugin.json`: `provider.kind="worker"`, `category="background-processor"`,
`defaultEntrypoint="bin/combined.ts"`, `defaultServiceEntrypoint="services/src/main.ts"`,
`defaultRequiresDb/Kv=true`, `concurrencyEnvVar="WORKER_CONCURRENCY"` (default 2).
`officialSource`: `canonicalName="workers"`, `servicePort=8091`, `dependencies=["streams"]`.

`deno.json` name `@netscript/plugin-workers`, exports `.`, `./aspire`, `./cli`, `./contracts`,
`./scaffolding`, `./services`, `./streams`, `./worker`. Key import map:
`@netscript/plugin-workers-core` → `../../packages/plugin-workers-core/mod.ts`, plus
`/runtime`, `/executor`, `/registry`, `/state`, `/streams`, `/contracts/v1` subpaths;
`@netscript/plugin-streams` → `../streams/mod.ts`. zod via `jsr:@zod/zod@4.4.3`.

### Runtime surface (`services/src/router.ts`, `main.ts`)
Service built with `createService(router, { name:'workers', version, port })` then a fluent chain:
`.withCors().withLogger().withOpenAPI(...).withDocs().withDatabase(dbClient).withContext(() => ({ workers: runtime })).withRPC({ traceContext:true }).withHealth().withServiceInfo().onStartup(...).serve()`.
Router uses oRPC `os.prefix('/v1/workers').router(workersV1)`. Documented OpenAPI routes:
`/api/v1/workers/jobs`, `/jobs/{id}`, `/jobs/{id}/trigger`, `/executions`,
`/executions/{jobId}/{executionId}`, `/tasks`, `/cleanup`, `/seed`, `/subscribe` (SSE, KV-watch).
Port from `ctx.env.PORT ?? Deno.env.get('PORT') ?? '8091'`.

### Runtime registry generation (`scaffold.runtime.json`)
A jobs registry is generated to `.netscript/generated/plugin-workers/jobs.registry.ts` (registryKey
`id`, type `JobHandler<any>` from `@netscript/plugin-workers-core/runtime`). The `scaffold` profile
includes `example-job.ts`, `health-check.ts`, and (when present) saga jobs `send-welcome-email.ts`,
`process-payment-webhook.ts`, and trigger job `process-webhook-payload.ts`. It also scans
`plugins/workers/jobs` and `plugins/triggers/jobs` as plugin dirs.

---

## 2. sagas (`plugins/sagas/`)

### Directory layout
- `mod.ts` — manifest: `inspectSagas`, `sagasPlugin`, `SAGAS_API_DEFAULT_PORT`, `SAGAS_PLUGIN_ID/VERSION`.
- `contracts.ts` → re-exports `./contracts/v1/sagas.contract.ts`.
- `contracts/v1/sagas.contract.ts`, `mod.ts`.
- `database/sagas.prisma`.
- `services/src/` — oRPC API: `main.ts`, `router.ts`, `saga-registry.ts` (KV metadata store),
  `routers/{v1,v1-handlers,v1-helpers,v1-types,health}.ts`, `init.ts`.
- `src/runtime/` — `saga-runner.ts`, `saga-supervisor.ts`, `saga-publisher.ts`, `mod.ts`.
- `src/scaffolding/` — saga code generators (`saga-scaffolders.ts`, `sagas-item-scaffolder.ts`, `starter.ts`).
- `src/{plugin,public,aspire,cli,e2e,constants}`, `streams/`, `docs/`, `runtime/sagas/v1.0.0.json`.
- **No `jobs/` or sample `*.ts` saga module ships at the plugin root** — the saga sample is emitted
  by the scaffolder template (below), not checked in as a top-level file.

### Headline authoring API (fluent builder, from `src/scaffolding/saga-scaffolders.ts` template)
The generated saga module looks like:
```ts
import { defineSaga, sagaComplete } from '@netscript/plugin-sagas-core';

type State = Readonly<{ status: string; processedAt?: string }>;
type Message = Readonly<{ type: '<MessageType>'; payload: unknown }>;

export const exampleSaga = defineSaga('<saga-id>')
  .durability('t1')
  .state<State>({ status: '<initial>' })
  .on<Message['type'], Message['payload']>('<MessageType>', (saga, message, context) => {
    saga.state = { ...saga.state, status: '<completed>', processedAt: context.now.toISOString() };
    return [ sagaComplete({ messageType: message.type, processedAt: context.now.toISOString() }) ];
  })
  .build();

export default exampleSaga;
```
There is also a **config-time** companion generated via
`defineSagaConfig(id, entrypoint).name(...).description(...).topic(...).tags(...).build()` from
`@netscript/plugin-sagas-core/config`. The runtime consumes `SagaDefinition` objects
(`@netscript/plugin-sagas-core/domain`) — compensation/steps are modeled as message handlers
returning effect arrays (e.g. `sagaComplete(...)`), not an explicit `.step()/.compensate()` chain in
the scaffolded sample.

### Saga registry (`services/src/saga-registry.ts`)
Sagas register **metadata into KV** (`['saga','registry', id]`) for the API service to list:
`registerSagaDefinitions(defs)`, `listSagaMetadata({ topic })`, `getSagaMetadata(id)`. Metadata =
`{ id, name, topic, handledMessageTypes, registeredAt, enabled }`.

### Manifest / runtime
`scaffold.plugin.json`: `provider.kind="saga"`, `defaultPermissions=["--unstable-kv","--allow-all"]`,
`concurrencyEnvVar="SAGA_CONCURRENCY"`. `officialSource`: `servicePort=8092`,
`dependencies=["streams"]`, `pluginReferences=["workers-api"]`.

### Runtime surface (`services/src/router.ts`, port 8092)
oRPC `os.prefix('/v1/sagas').router(sagasV1)`. OpenAPI routes: `/api/v1/sagas/sagas`,
`/sagas/{id}`, `/instances`, `/instances/{sagaName}/{correlationId}`, `/publish`,
`/subscribe` (SSE). RPC: `v1.sagas.{listSagas,getSaga,listInstances,getInstance,publish,subscribe}`.
Plus a liveness route at `/health/live`.

---

## 3. triggers (`plugins/triggers/`)

### Directory layout
- `mod.ts` — manifest: `inspectTriggers`, `triggersPlugin`, `TRIGGERS_API_DEFAULT_PORT`, etc.
- `contracts.ts`, `contracts/v1/triggers.contract.ts`.
- **`generic-webhook.ts`, `webhook-validate-data.ts`** — top-level webhook sample modules.
- `jobs/` — sample jobs wired from triggers: `file-import.ts`, `file-relay.ts`, `staged-cleanup.ts`, `job-tools.ts`.
- `database/triggers.prisma`.
- `services/src/` — **Hono**-based API: `main.ts`, `router.ts`, `routers/{webhooks,events,health}.ts`.
- `src/runtime/` — `trigger-processor.ts` (background entrypoint), cron/file-watcher/KV adapters,
  `project-trigger-registry.ts`.
- `src/{plugin,public,aspire,cli,scaffolding,constants}`, `streams/`, `docs/` (incl. `recipes/{webhooks,schedules,file-watching}.md`), `tests/e2e/`.

### Headline authoring API (`generic-webhook.ts`, verbatim core)
```ts
import { defineWebhook, enqueueJob } from '@netscript/plugin-triggers-core/builders';
import type { JobDefinition } from '@netscript/plugin-workers-core';

const workersPluginHealthCheckJob = {
  id: 'workers-plugin-health-check' as JobDefinition<'workers-plugin-health-check'>['id'],
  name: 'Workers Health Check', topic: 'default',
} satisfies JobDefinition<'workers-plugin-health-check'>;

export const genericInboundWebhook = defineWebhook(
  () => Promise.resolve([
    enqueueJob<'workers-plugin-health-check', HealthCheckPayload>(
      workersPluginHealthCheckJob, { payload: { verbose: false }, priority: 50 },
    ),
  ]),
  { id: 'generic-inbound-webhook', path: 'inbound/generic', verifier: 'memory',
    description: 'Open webhook that enqueues the workers plugin health-check job.',
    tags: ['webhook', 'runtime-task', 'health-check'] },
);
export default genericInboundWebhook;
```
`webhook-validate-data.ts` shows a webhook that accepts a typed payload and enqueues **nothing**
(`() => Promise.resolve([])`, `path: 'validate/data'`). The wiring is: a webhook handler returns an
array of `enqueueJob(jobRef, { payload, priority })` effects, binding inbound HTTP to worker jobs.

The trigger **jobs** (`jobs/file-import.ts` etc.) are ordinary `defineJobHandler` jobs (same API as
workers) — e.g. `file-import.ts` reads a staged file, parses CSV/JSON/text, deletes the staged copy,
and returns `createSuccessResult({ ..., sagaMessage })`. Job id `triggers-plugin-file-import`.

### Manifest / runtime
`scaffold.plugin.json`: `provider.kind="trigger"`, `defaultEntrypoint="src/runtime/trigger-processor.ts"`,
`concurrencyEnvVar="TRIGGER_CONCURRENCY"` (default 10), `--allow-all`. `officialSource`:
`servicePort=8093`, `dependencies=["streams"]`, `pluginReferences=["workers-api"]`.

### Runtime surface — **Hono, not oRPC** (`services/src/router.ts`)
Unlike workers/sagas, the triggers service mounts raw Hono apps:
```ts
app.route('/api/v1/events', createEventsRouter({ eventStore }));
app.route('/api/v1/webhooks', createWebhookRouter({ ingress }));
```
The webhook router (`routers/webhooks.ts`) is a `new Hono()` with `app.post('/:triggerId', …)` and
`app.post('/:triggerId/*', …)`, dispatching to a `TriggerIngressPort`. So the live endpoint
`/api/v1/webhooks/inbound/generic` resolves trigger id `inbound/generic` → the
`generic-inbound-webhook` definition. Port via `Deno.env.get('PORT') ?? TRIGGERS_API_DEFAULT_PORT`.

---

## 4. streams (`plugins/streams/`)

### Directory layout
- `mod.ts` — manifest re-exporting `streamsPlugin` **and** the topic API
  (`defineStreamTopic`, `defineStreamProducer`, `defineStreamConsumer`) + many contribution types.
- `src/public/stream-api.ts` — the typed topic/producer/consumer API implementation.
- `services/src/main.ts` — durable-streams dev service entrypoint.
- `src/{aspire,cli,e2e,scaffolding}`, `docs/` (rich: `concepts.md`, `architecture.md`,
  `getting-started.md`, `recipes/{defining-a-topic,publishing-events,consuming-via-sse,observability}.md`,
  `advanced/extending.md`), `scaffold.plugin.json`, `deno.json`, `verify-plugin.ts`.
- **No `database/` (requiresDb=false), no `jobs/`.** Streams is a utility/infra plugin.

### Headline authoring API (`src/public/stream-api.ts`, verbatim core)
```ts
export function defineStreamTopic<TPayload>(
  name: string, schema: StreamPayloadSchema<TPayload>,
): StreamTopicDefinition<TPayload> { return Object.freeze({ name, schema }); }

export function defineStreamProducer<TPayload>(_topic: StreamTopicDefinition<TPayload>)
  : StreamProducerHandle<TPayload> { return Object.freeze({ publish: async (_p) => {} }); }

export function defineStreamConsumer<TPayload>(_topic: StreamTopicDefinition<TPayload>)
  : StreamConsumerHandle<TPayload> {
    return Object.freeze({ subscribe: (_h) => () => {} }); }
```
**Important reality check:** in the scaffolded copy, `defineStreamProducer().publish` and
`defineStreamConsumer().subscribe` are **stubs** (no-op bodies). The schema type uses Standard
Schema (`'~standard'`). The recipe doc `docs/recipes/defining-a-topic.md` explicitly says
*"Topic-centric APIs are deferred. Define entity-oriented stream schemas with
`@netscript/plugin-streams-core` today."* A tutorial should treat streams as the topic-schema
authoring surface + the durable-streams dev service (port 4437), not a full pub/sub runtime yet.

### Manifest
`scaffold.plugin.json`: `provider.kind="stream"`, `category="plugin"`, `portRangeKey="PLUGIN_API"`,
`pluginType="utility"`, `requiresDb=false`, `requiresKv=false`. `officialSource.servicePort=4437`.
deno.json name `@netscript/plugin-streams`; core at `../../packages/plugin-streams-core/mod.ts`.

---

## 5. users service (`services/users/`)

### Layout
`deno.json` (name `@plugin-smoke-…/users`, exports `./src/main.ts`), `src/main.ts`, `src/router.ts`,
`src/routers/{v1,health}.ts`. (Shared helper at `services/_shared/plugin-service-context.ts`.)

### `defineService` usage (`src/main.ts`, verbatim)
```ts
import { defineService } from '@netscript/service';
import { router } from './router.ts';

await defineService(router, {
  name: 'users', version: '1.0.0',
  port: parseInt(Deno.env.get('PORT') || '3001'),
  openapi: { title: 'Users API', description: 'users service' },
  debug: true,
});
```
> **Surprise:** local services use `defineService(...)` (one call, options object), while **plugin**
> API services use the fluent `createService(...).withCors()....serve()` builder. Two different
> service-construction APIs in the same project.

`router.ts` aggregates versions: `export const v1 = { users: { ...UsersV1, health } };
export const router = { v1 };`. Handlers (`routers/v1.ts`) bind the contract:
```ts
import { type UsersListItemV1, v1 } from '@plugin-smoke-20260619-052006/contracts';
export const UsersV1 = {
  list: v1.users.list.handler(async ({ input }) => { /* in-memory seeded records */ }),
  updateStatus: v1.users.updateStatus.handler(async ({ input }) => { /* mutate + return */ }),
};
```
Handlers return **seeded in-memory records** (no DB yet at this scaffold step — comments call this
out explicitly as the "Step 5" FE↔contract proof).

---

## 6. contracts (`contracts/`)

`mod.ts` → `versions/v1/mod.ts` → exports `UsersContractV1`, `v1 = { users: UsersV1 }`, and types.
`versions/v1/users.contract.ts` is the oRPC + zod + `implement()` pattern (verbatim core):
```ts
import { z } from 'zod';
import { oc } from '@orpc/contract';
import { implement } from '@orpc/server';

export const UsersListItemSchemaV1 = z.object({
  id: z.number().int().positive(), name: z.string().min(1),
  summary: z.string().min(1), status: UsersStatusSchemaV1, createdAt: z.string().datetime(),
});

export const UsersContractV1 = {
  health: { check: oc.route({ method: 'GET' }).input(z.object({}).optional()).output(UsersHealthSchemaV1) },
  list: oc.route({ method: 'POST' }).input(UsersListInputSchemaV1).output(UsersListResponseSchemaV1),
  updateStatus: oc.route({ method: 'POST' }).input(UsersUpdateStatusInputSchemaV1).output(UsersUpdateStatusResponseSchemaV1),
};

export const UsersV1 = implement(UsersContractV1); // ready for .handler() binding
```
`contracts/deno.json` pins `@orpc/contract`, `@orpc/server` `^1.14.6`, `zod ^4.3.6`. The pattern:
contract objects (`oc.route().input().output()`) → `implement(contract)` produces the
`.handler()`-bindable object the service router consumes.

---

## 7. Database wiring (`database/postgres/`)

- `schema/schema.prisma` — root schema: `generator client { provider="prisma-client";
  output="./.generated"; runtime="deno" }`, a `generator zod` (prisma-zod-generator →
  `./.generated/zod`), `datasource db { provider="postgresql" }`, and a single sample model
  `ExampleRecord`.
- **Plugin schemas are split out** under `schema/plugins/{workers,sagas,triggers}/*.prisma` (each
  plugin ships its own `database/<name>.prisma`, copied/aggregated here). e.g.
  `schema/plugins/workers/workers.prisma` defines `model JobDefinition` (job persistence; executions
  stay in KV per the file's own comments). Triggers/sagas similarly contribute their tables.
- `prisma.config.ts` — `defineConfig({ schema:'schema', migrations:{ path:'migrations' },
  datasource:{ url } })`; URL resolved from `POSTGRES_URI`/`DATABASE_URL` and normalized
  (postgres/mysql/mssql connection-string → URL).
- `scripts/` — `migrate.ts`, `seed.ts`, `generate-zod.ts`, `fix-zod-imports.ts`,
  `patch-prisma-client.ts`, `clear-seeded-client.ts`.
- `netscript.config.ts` `databases: { config: [] }` is **empty** — DB config is actually carried by
  `appsettings.json` `NetScript.Databases.postgres` (Engine `Postgres`, Mode `Container`,
  `DatabaseName=plugin-smoke-…-db`, Persistent, `DataPath=.data/postgres`), with
  `PrimaryDatabase=postgres`. KV/cache: `Cache.garnet` (Engine Garnet, Container), `PrimaryCache=garnet`.

So: one Postgres datasource, **per-plugin Prisma model files aggregated** under
`schema/plugins/<plugin>/`, generated Deno-runtime Prisma client + zod, driven by appsettings (not
the near-empty `databases` block in `netscript.config.ts`).

---

## 8. Aspire (`aspire/`)

- `apphost.mts` — **GENERATED, TypeScript/Node** entry for `aspire start`:
  ```ts
  import { createBuilder } from './.aspire/modules/aspire.mjs';
  import { createNetScriptAppHost } from './.helpers/index.mjs';
  const builder = await createBuilder();
  await createNetScriptAppHost(builder, '../appsettings.json');
  await builder.build().run();
  ```
- `aspire.config.json` — `appHost.path="apphost.mts"`, `language="typescript/nodejs"`, SDK 13.4.4,
  package `Aspire.Hosting.PostgreSQL`, an `https` profile with OTLP at `http://localhost:4318`.
- `.helpers/index.mts` (`createNetScriptAppHost`) registers resources in C#-NuGet order:
  (1) dashboard OTLP, (2) infrastructure (DB+cache), (3) DB-CLI short-circuit, (4) **services**
  (two-pass: create then wire cross-refs), (5) **plugins** (two-pass: create then wire plugin→plugin
  + plugin→service refs via `getEndpoint('http')` + `withEnvironment()`), (6) **background
  processors**, (7) apps, (8) tools.
- The `.helpers/register-*.mts` pattern: each resource class has its own
  `register-{infrastructure,services,plugins,background,apps,tools}.mts`, all using
  `builder.addExecutable()` with resolved permissions/workdir/HTTP endpoint/OTEL env, reading
  everything from the parsed `appsettings.json`. Workspace paths are resolved relative to
  `appHostDirectory()/..` (apphost lives under `aspire/` to isolate the Node graph from the Deno root).
- **Divergence to flag:** `netscript.config.ts` sets `aspire.appHost: 'dotnet/AppHost'`, but the real
  generated app host is the **Node/TypeScript** `aspire/apphost.mts`. Document the actual
  `aspire/apphost.mts` + `aspire.config.json`, not a dotnet AppHost.

---

## 9. Config (root)

### `netscript.config.ts` (verbatim)
```ts
import { defineConfig } from '@netscript/config';
export default defineConfig({
  name: 'plugin-smoke-20260619-052006', version: '1.0.0',
  paths: { services: 'services', apps: 'apps', contracts: 'contracts', plugins: 'plugins' },
  logging: { level: 'info', format: 'text' },
  aspire: { appHost: 'dotnet/AppHost' },
  databases: { config: [] },
  plugins: ['./plugins/streams/mod.ts', './plugins/workers/mod.ts',
            './plugins/sagas/mod.ts', './plugins/triggers/mod.ts'],
  gateway: { enabled: false }, sdk: {}, deploy: {},
});
```
Plugins are referenced by **`./plugins/<name>/mod.ts`** — confirms `plugins/<name>/` is canonical.

### `deno.json` workspace
Members include `apps/dashboard`, `contracts`, `database/postgres`, all `packages/*` (the vendored
local-source copies, incl. `plugin-{workers,sagas,triggers,streams}-core`), `plugins`, **`plugins/*`**,
plus the staging dirs `sagas`, `services/users`, `triggers`, `workers`. `nodeModulesDir:"auto"`,
`unstable:["raw-imports","kv"]`. Tasks: `dev` (dashboard), `check`, `lint`, `fmt`, `test`. Fmt:
2-space, lineWidth 100, semicolons, single-quote. A `catalog` pins shared dep versions (durable-streams,
orpc `1.14.6`, prisma `7.8.0`, preact, tailwind, pg/ioredis/mysql2, vite, etc.).

---

## Documentation hooks — the single most compelling "hello world" per unit

- **workers** — *"Write a job in 12 lines."* Walk `defineJobHandler(async (ctx) => { z.parse(ctx.payload); return createSuccessResult({...}) })` + `Object.assign(handler, { id })`, then trigger it via `POST /api/v1/workers/jobs/{id}/trigger` (port 8091). Use `create-user-settings.ts` as the canonical sample.
- **sagas** — *"Orchestrate a message-driven workflow with a fluent builder."* `defineSaga(id).durability('t1').state<S>({...}).on<Type,Payload>(type, (saga, msg, ctx) => [ sagaComplete({...}) ]).build()`, then list it at `GET /api/v1/sagas/sagas` (port 8092). Pair it with the workers `create-user-settings` job that publishes `UserSettingsCreated`.
- **triggers** — *"Turn an inbound webhook into a background job."* `defineWebhook(() => [enqueueJob(jobRef, { payload, priority })], { id, path:'inbound/generic', verifier:'memory' })`, then `POST /api/v1/webhooks/inbound/generic` (port 8093, Hono) and watch the workers health-check job run.
- **streams** — *"Define a typed topic schema."* `defineStreamTopic('orders', schema)` with `@netscript/plugin-streams-core` entity schemas; note producer/consumer runtime is currently stubbed/deferred — frame it as topic + durable-streams dev service (port 4437), not live pub/sub yet.
- **users service + contracts** — *"Contract-first: one schema, type-locked client and server."* Author `oc.route().input(zod).output(zod)`, `implement(contract)`, bind `v1.users.list.handler(...)`, and serve with `defineService(router, { name, port, openapi })` (port 3001).
