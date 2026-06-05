# Workflow Guide - Key Files by Task

> Doctrine reference: package/plugin architecture is governed by `docs/architecture/doctrine/` and
> `.llm/harness/debt/arch-debt.md`. This file describes current repo state; doctrine defines the
> target state.

> What files to look at and modify for common development tasks.

## Building a New Feature

### Adding a New Service Endpoint

1. **Define the contract** (schema + route):
   - `contracts/versions/v1/{service}.contract.ts` - Add Zod schema + contract method
   - `contracts/versions/v1/index.ts` - Export new schemas
   - `contracts/versions/v1/mod.ts` - Include in v1 object

2. **Implement the handler**:
   - `services/{service}/src/routers/v1.ts` - Add handler using `v1.{service}.{method}.handler()`

3. **Wire up the router** (if new router):
   - `services/{service}/src/router.ts` - Add to v1 object

4. **Update frontend** (if UI needed):
   - `apps/frontend/lib/api-clients.ts` - Client auto-updates from contract
   - `apps/frontend/routes/(dashboard)/dashboard/{entity}/` - Add page
   - `apps/frontend/routes/partials/dashboard/{entity}/` - Add partial

### Adding a New Service

1. **Create service directory**: `services/{name}/`
   - Copy structure from `services/users/`
   - `deno.json` - Update name, port, imports
   - `src/main.ts` - Update defineService config
   - `src/router.ts` - Wire up contracts
   - `src/routers/v1.ts` - Implement handlers

2. **Define contracts**: `contracts/versions/v1/{name}.contract.ts`

3. **Add to configuration**:
   - `netscript.config.ts` - Add service entry (port, workdir, dependencies)
   - `dotnet/AppHost/appsettings.json` - Add to NetScript:Services

4. **Regenerate**: `deno task generate` (generates new Aspire extension methods)

### Adding a New Worker Job

1. **Define job handler**: `workers/jobs/{job-name}.ts`
   - Use the function form from `@netscript/plugin-workers-core`:
     `defineJobHandler(async (ctx) => ...)`
   - Return `createSuccessResult()` or `createFailureResult()`

2. **Export a job definition** from a discoverable module:
   - Use `defineJob()` from `@netscript/plugin-workers-core`
   - Use `defineWorkers()` from `@netscript/plugin-workers-core/config` when authoring worker config
     helpers; `@netscript/config` no longer exports workers config helpers

3. **Regenerate plugin registries**:
   - Run `deno run -A packages/cli/bin/netscript-dev.ts generate plugins --project-root .`
   - The walker discovers `defineJob()` call sites and emits
     `.netscript/generated/plugin-workers/jobs.registry.ts`

### Adding a New Saga

1. **Define message types**: `sagas/types.ts`
   - Add discriminated union types

2. **Create saga definition**: `sagas/{name}-saga.ts`
   - Use `defineSaga()` from `@netscript/plugin-sagas-core`

3. **Regenerate plugin registries**:
   - Run `deno run -A packages/cli/bin/netscript-dev.ts generate plugins --project-root .`
   - The walker emits `.netscript/generated/plugin-sagas/sagas.registry.ts`

4. **Configure installed plugins**: `netscript.config.ts`
   - Ensure the `plugins` array contains the saga plugin path or marketplace package reference

5. **Create worker jobs** (if needed):
   - `workers/jobs/{step-name}.ts` for each saga step

### Adding a New Trigger

1. **Define trigger**: `triggers/{name}.ts`
   - Use `defineWebhook(handler, spec)`, `defineFileWatch(handler, spec)`, or
     `defineScheduledTrigger(handler, spec)` from `@netscript/plugin-triggers-core/builders`
   - Configure webhook, file lifecycle, or schedule specs in the second argument
   - Use handler tools such as `enqueueJob()` for cross-axis worker dispatch
   - Optional: retry, deduplication, backfill, and file lifecycle specs

2. **Regenerate plugin registries**:
   - Run `deno run -A packages/cli/bin/netscript-dev.ts generate plugins --project-root .`
   - The walker emits `.netscript/generated/plugin-triggers/triggers.registry.ts`

3. **Configure runtime** (optional): `triggers/runtime/triggers/v*.json`
   - Add override entry for operator-controlled settings

4. **Add plugin wiring** (if API needed): `plugins/triggers/`
   - Jobs in `plugins/triggers/jobs/` for trigger-initiated processing
   - Webhook routes in `plugins/triggers/services/src/routers/webhooks.ts`

5. **Create associated worker jobs** (if using `enqueueJob` action):
   - `workers/jobs/{job-name}.ts` using `defineJobHandler(async (ctx) => ...)`

### Adding a New Plugin

1. **Create plugin directory**: `plugins/{name}/`
   - `mod.ts` - `definePlugin(name, version).with*().build()` with contributions
   - `contracts/v1/mod.ts` - oRPC contracts (if API)
   - `services/src/main.ts` - Service entry (if API)
   - `database/{name}.prisma` - Schema (if database)

2. **Register for a project**: `netscript.config.ts`
   - Add the plugin package/path to the `plugins` array, or use `netscript plugin add`

3. **Generate discovery output**:
   - Run `netscript generate plugins`
   - Validate with `netscript plugin list`, `netscript plugin info <name>`, and
     `netscript plugin doctor`

4. **Marketplace lifecycle stubs**:
   - `netscript marketplace search <query>` reports the future discovery contract
   - `netscript marketplace publish <path>` validates local metadata without publishing

### Adding a New Database Model

1. **Update Prisma schema**: `database/mysql/schema/schema.prisma` (or postgres)
2. **Run migration**: `deno task db:migrate -- --name=add-{model}`
3. **Generate client**: `deno task db:generate`
4. **Generate Zod schemas**: `deno task db:generate:zod`
5. **Update contracts** (if needed): `contracts/versions/v1/`

### Adding a Frontend Page

1. **Create route**: `apps/frontend/routes/(dashboard)/dashboard/{entity}/`
   - `index.tsx` - List page with DeferPage
   - `[id].tsx` - Detail page
   - `new.tsx` - Create form
   - `[id]/edit.tsx` - Edit form

2. **Create partials**: `apps/frontend/routes/partials/dashboard/{entity}/`
   - `list.tsx` - Data fetching + table rendering
   - `stats.tsx` - Stats card
   - `[id]/header.tsx` - Detail header
   - `[id]/detail.tsx` - Detail body

3. **Add navigation**: `apps/frontend/routes/(dashboard)/_layout.tsx`

4. **Create components**: `apps/frontend/routes/(dashboard)/(_components)/`
   - `{entity}-table.tsx` - List component
   - `{entity}-form.tsx` - Form component

---

## Fixing Bugs

### Service Bug

1. **Check contract**: `contracts/versions/v1/{service}.contract.ts` - Schema correct?
2. **Check handler**: `services/{service}/src/routers/v1.ts` - Logic correct?
3. **Check database query**: Prisma model and relations in schema
4. **Check error handling**: `notFound()`, `errors.VALIDATION_ERROR()` usage

### Frontend Bug

1. **Check route/page**: `apps/frontend/routes/...` - Handler and component
2. **Check partial**: `apps/frontend/routes/partials/...` - Data loading
3. **Check island**: `apps/frontend/islands/...` - Client-side logic
4. **Check query/cache**: `apps/frontend/utils/dashboard-queries.ts` - Cache invalidation

### Worker Bug

1. **Check job handler**: `workers/jobs/{job}.ts` - Execution logic
2. **Check configuration**: `netscript.config.ts` - Job settings
3. **Check scheduler**: `plugins/workers/worker/scheduler.ts` - Scheduling logic
4. **Check worker**: `plugins/workers/worker/worker.ts` - Execution routing
5. **Check KV state**: ExecutionState keys in Deno KV

### Saga Bug

1. **Check message types**: `sagas/types.ts` - Correct discriminated union
2. **Check saga definition**: `sagas/{name}-saga.ts` - Handler logic
3. **Check transport**: `packages/plugin-sagas-core/src/transports/` - Message delivery
4. **Check store**: Prisma SagaInstance/SagaExecutionHistory tables

### Trigger Bug

1. **Check trigger definition**: `triggers/{name}.ts` - Watch paths, patterns, stability settings
   correct?
2. **Check watcher strategy**: Native vs Polling vs Hybrid - network drives need polling
3. **Check stability filter**: Threshold settings adequate for file sizes/write speeds?
4. **Check action executor**: Action type and target correct?
5. **Check runtime overrides**: `triggers/runtime/triggers/v*.json` - Trigger not disabled?
6. **Check KV state**: Trigger event store entries for recent events

---

## Debugging

### Service Debugging

- **Health check**: `curl http://localhost:{port}/health`
- **API docs**: Open `http://localhost:{port}/api/docs`
- **OpenAPI spec**: `http://localhost:{port}/api/openapi.json`
- **Aspire dashboard**: `http://localhost:18888` - Traces, logs, metrics
- **Prisma Studio**: start through Aspire after `deno task db:init` and `deno task db:seed`

### Worker Debugging

- **SSE stream**: `curl http://localhost:8091/api/v1/workers/subscribe`
- **Execution list**: `curl http://localhost:8091/api/v1/workers/executions`
- **Manual trigger**: `curl -X POST http://localhost:8091/api/v1/workers/jobs/{id}/trigger`
- **KV inspection**: Check Deno KV for ExecutionState records

### Saga Debugging

- **SSE stream**: `curl http://localhost:8092/api/v1/sagas/subscribe`
- **Instance state**: `curl http://localhost:8092/api/v1/sagas/instances/{sagaName}/{correlationId}`
- **History timeline**:
  `curl http://localhost:8092/api/v1/sagas/instances/{sagaName}/{correlationId}/history`

### Frontend Debugging

- **Vite dev server**: `deno task dev:frontend` (HMR at http://localhost:5173)
- **Network tab**: Check oRPC calls and partial loading
- **SSE inspector**: Monitor `/api/jobs` endpoint

### Trigger Debugging

- **Trigger events**: `curl http://localhost:{triggers-port}/api/v1/triggers/events` - Recent events
- **Trigger definitions**: `curl http://localhost:{triggers-port}/api/v1/triggers/triggers` -
  Registered triggers
- **Manual fire**:
  `curl -X POST http://localhost:{triggers-port}/api/v1/triggers/triggers/{id}/fire` - Test trigger
- **SSE stream**: `curl http://localhost:{triggers-port}/api/v1/triggers/subscribe` - Live events
- **Webhook test**: `curl -X POST http://localhost:{triggers-port}/webhooks/{path}` - Test webhook
  ingestion
- **File watcher logs**: Check console output for `[triggers]` prefix messages
- **Runtime config**: Check `triggers/runtime/current` for active overrides

---

## Documentation

### Where to Find Documentation

- **Architecture**: `.agents/knowledge-base/` folder (this knowledge base)
- **API contracts**: `contracts/versions/v1/` (schemas are self-documenting)
- **API docs**: Each service at `/api/docs` (Scalar UI)
- **OpenAPI specs**: Each service at `/api/openapi.json`
- **Config reference**: `netscript.config.ts` (Zod schemas with descriptions)

---

## Deploying

### Development

```bash
deno task dev           # Start everything via Aspire
deno task dev:frontend  # Frontend only with Vite HMR
```

### Database Operations

```bash
deno task db:init                  # First-time Postgres database setup
deno task db:migrate -- --name=x   # Create/apply migration
deno task db:seed                  # Seed data
deno task db:generate              # Generate Prisma client
deno task db:status                # Migration status
```

Fresh worktrees and fresh Aspire data volumes must run `deno task db:init` and `deno task db:seed`
before starting Aspire. If `.env.local` is copied in, keep the Garnet/Redis override variables
commented when Aspire should run Garnet as a container; uncomment them only when using an externally
started local cache.

### Code Generation

```bash
deno task generate  # Regenerate types, clients, Aspire code
```

### Quality Checks

```bash
deno task check:apps       # Type check apps
deno task check:packages   # Type check packages
deno task check:plugins    # Type check plugins
deno task check:services   # Type check services
deno task check:workers    # Type check workers
deno task check:sagas      # Type check sagas
deno task check:triggers   # Type check triggers
deno task lint             # Lint code
deno task fmt              # Format code
deno task test             # Run all tests
```

> **Note:** Manual `deno check` requires the `--unstable-kv` flag for Deno.Kv types. The `check:*`
> sub-tasks above already include this flag.

### Windows Deployment

```bash
deno task deploy:build    # Compile to executables
deno task deploy:install  # Install Windows services
deno task deploy:start    # Start services
deno task deploy:status   # Check status
```

---

## Searching for Specific Features

### Type System / Validation

- Zod schemas: `contracts/versions/v1/`, `packages/contracts/`
- Generated Zod: `database/postgres/schema/.generated/zod/`
- Codecs: `packages/contracts/codecs.ts`

### Caching / Query Layer

- Cache implementation: `packages/sdk/cache-query.ts`
- Query factories: `packages/sdk/query-factory.ts`
- Frontend queries: `apps/frontend/utils/dashboard-queries.ts`

### Real-Time / SSE

- Frontend SSE: `apps/frontend/routes/api/jobs.ts`
- Workers SSE: `plugins/workers/services/src/routers/v1.ts` (subscribe handler)
- Sagas SSE: `plugins/sagas/services/src/routers/v1.ts` (subscribe handler)
- Island: `apps/frontend/islands/JobsWidget.tsx`

### Authentication / Authorization

- Not yet implemented (contracts define UNAUTHORIZED/FORBIDDEN errors)

### Service Discovery

- Implementation: `packages/sdk/service-discovery.ts`
- Environment variables: `services__{name}__{protocol}__{index}`

### Configuration

- Main config: `netscript.config.ts`
- Aspire config: `dotnet/AppHost/appsettings.json`
- Config package: `packages/config/`

### Plugin System

- Plugin definition: `packages/plugin/`
- Plugin discovery config: `netscript.config.ts` `plugins` array
- Generated plugin registries: `.netscript/generated/`
- Workers plugin: `plugins/workers/`
- Sagas plugin: `plugins/sagas/`

### Triggers / File Watching

- Trigger definitions: `triggers/` (application-level)
- Trigger core package: `packages/plugin-triggers-core/` (builders, domain, ports, runtime)
- Watcher package: `packages/watchers/` (file watching primitives)
- Runtime config: `packages/runtime-config/` (hot-reload overrides)
- Triggers plugin: `plugins/triggers/` (API, contracts, database, jobs)
- Trigger runtime: `triggers/runtime/` (version pointer, override files)

### Database

- Prisma schemas: `database/mysql/schema/schema.prisma`, `database/postgres/schema/schema.prisma`
- Database package: `packages/database/`
- Prisma client: `database/postgres/mod.ts` (exported as `@database`)
- Migrations: `database/mysql/migrations/`

### Telemetry / Tracing

- Core package: `packages/telemetry/`
- oRPC plugins: `packages/telemetry/orpc/`
- Worker instrumentation: `packages/telemetry/instrumentation/`
- Aspire OTEL: `dotnet/ServiceDefaults/Extensions.cs`
