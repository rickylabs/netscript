# Packages Reference

> Doctrine reference: package/plugin architecture is governed by `docs/architecture/doctrine/` and
> `.llm/harness/debt/arch-debt.md`. This file describes current repo state; doctrine defines the
> target state.

> Complete reference for the shared packages in the `packages/` directory.

## Doctrine Status

Source: `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`. Open debt is tracked in
`.llm/harness/debt/arch-debt.md`.

| Package                           | Archetype                  | Doctrine verdict | Debt status |
| --------------------------------- | -------------------------- | ---------------- | ----------- |
| `@netscript/runtime-config`       | 1 Small Contract           | Refactor         | open        |
| `@netscript/config`               | 1 Small Contract           | Refactor         | open        |
| `@netscript/aspire`               | 2 Integration              | Keep             | none seeded |
| `@netscript/cron`                 | 2 Integration              | Refactor         | open        |
| `@netscript/database`             | 2 Integration              | Refactor         | open        |
| `@netscript/queue`                | 2 Integration              | Refactor         | open        |
| `@netscript/kv`                   | 2 Integration              | Refactor         | open        |
| `@netscript/prisma-adapter-mysql` | 2 Integration              | Keep             | none seeded |
| `@netscript/logger`               | 2 Integration              | Keep             | none seeded |
| `@netscript/telemetry`            | 2 Integration              | Refactor         | open        |
| `@netscript/watchers`             | 3 Runtime/Behavior         | Keep             | none seeded |
| `@netscript/plugin-triggers-core` | 3 Runtime/Behavior + 4 DSL | Keep             | active      |
| `@netscript/plugin-workers-core`  | 3 Runtime/Behavior + 4 DSL | Refactor         | active      |
| `@netscript/plugin-streams-core`  | 1 Small Contract           | Keep             | none seeded |
| `@netscript/plugin-sagas-core`    | 3 Runtime/Behavior + 4 DSL | Keep             | active      |
| `@netscript/fresh`                | 4 Public DSL/Builder       | Restructure      | open        |
| `@netscript/fresh-ui`             | 4 Public DSL/Builder       | Keep             | none seeded |
| `@netscript/sdk`                  | 4 Public DSL/Builder       | Keep             | none seeded |
| `@netscript/service`              | 4 Public DSL/Builder       | Refactor         | open        |
| `@netscript/contracts`            | 4 Public DSL/Builder       | Keep             | none seeded |
| `@netscript/plugin`               | 4 Public DSL/Builder       | Restructure      | open        |
| `@netscript/cli`                  | 6 CLI/Tooling              | Restructure      | open        |
| `@netscript/contracts`            | Special                    | Rewrite          | open        |
| `plugins/sagas`                   | 5 Plugin Package           | Keep             | none seeded |
| `plugins/streams`                 | 5 Plugin Package           | Keep             | none seeded |
| `plugins/triggers`                | 5 Plugin Package           | Refactor         | open        |
| `plugins/workers`                 | 5 Plugin Package           | Refactor         | open        |

## Package Dependency Graph

```
                          @netscript/config
                                |
                ┌───────────────┼───────────────┐
                |               |               |
         @netscript/sdk    @netscript/service   @netscript/cli
           |     |              |                    |
      ┌────┘     └────┐    ┌───┴────┐          @netscript/plugin
      |               |    |        |
  @netscript/kv   @netscript/telemetry  @netscript/logger
      |               |                     |
  @netscript/queue  @netscript/cron    (middleware, orpc)
      |
  @netscript/plugin-workers-core ─── @netscript/plugin-streams-core
      |
  plugins/workers
      |
  @netscript/plugin-sagas-core
      |
  @netscript/plugin-triggers-core
      |
  plugins/triggers ─── @netscript/watchers
      |
  (kv, queue, plugin-sagas-core, plugin-workers-core, runtime-config, sdk, telemetry)

  @netscript/fresh ─── (sdk, telemetry, logger)
  @netscript/fresh-ui  (standalone: preact, signals, tailwind-merge, clsx)
  @netscript/database  (standalone: prisma, pg, opentelemetry)
  @netscript/contracts    (standalone: zod)
  @netscript/contracts (standalone: zod, orpc)
  @netscript/prisma-adapter-mysql (standalone: prisma driver utils)
```

---

## Core Infrastructure

### @netscript/sdk — Service Discovery, Clients & Query Cache

**Purpose**: Connect services via Aspire-injected environment variables, create type-safe RPC
clients, cache query results with stale-while-revalidate semantics.

**Entrypoints** (`deno.json` exports):

| Subpath        | Module              | Purpose                                                                                                                                      |
| -------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `.`            | `mod.ts`            | Barrel — re-exports all subpaths                                                                                                             |
| `./adapters`   | `adapters/mod.ts`   | `KvCacheStore` — Deno KV-backed cache adapter                                                                                                |
| `./cache`      | `cache/mod.ts`      | `CacheQuery` — stale-while-revalidate with in-flight deduplication                                                                           |
| `./client`     | `client/mod.ts`     | `createServiceClient<TContract>()` — type-safe oRPC client factory                                                                           |
| `./discovery`  | `discovery/mod.ts`  | `getServiceUrl()`, `getPostgresConnection()`, `getMysqlConnection()`, `getMssqlConnection()`                                                 |
| `./interfaces` | `interfaces/mod.ts` | Shared types: `CacheKey`, `CacheStore`, `CacheStoreEntry`, `HealthCheckResponse`, `PaginatedResponse`, `ServiceMetadata`, `ServiceTransport` |
| `./openapi`    | `openapi/mod.ts`    | OpenAPI spec helpers                                                                                                                         |
| `./query`      | `query/mod.ts`      | `createQueryFactories()` — TanStack Query-inspired cache layer                                                                               |
| `./telemetry`  | `telemetry/mod.ts`  | Trace context propagation for oRPC clients                                                                                                   |

**Key exports** (via root):

- `createServiceClient<TContract>({ contract, serviceName })` — Type-safe oRPC client with trace
  context
- `createQueryFactories({ name: { contract, client } })` — Adds `.invalidate()`, `.prefetch()`,
  `.getCachedData()` to each action
- `CacheQuery` — Stale-while-revalidate with Deno KV, in-flight deduplication, background
  revalidation
- `KvCacheStore` — Deno KV adapter for the cache layer
- `getServiceUrl(serviceName, protocol)` — Resolve URL from `services__{name}__{protocol}__{index}`
  env vars
- `getPostgresConnection()` / `getMysqlConnection()` / `getMssqlConnection()` — Database URL
  discovery
- `safe(promise)` — Returns `[error, data]` tuple for graceful error handling
- `isDefinedError(error)` — Type guard for oRPC structured errors

**Patterns**: Service discovery reads Aspire env vars. Clients propagate W3C trace context headers.
Query factories add `.invalidate()`, `.prefetch()`, `.getCachedData()` to each action.

### @netscript/service — Service Bootstrap

**Purpose**: Three-layer abstraction for building Deno services.

**Entrypoints**: `.` only.

**Layer 1 — Primitives**:

- `createRPCHandler()` / `createOpenAPIHandler()` — oRPC endpoint handlers
- `createRPCPlugins({ serviceName })` — Tracing, error handling, logging, CORS plugins
- `createHealthHandler()` / `createLivenessHandler()` / `createReadinessHandler()` — Health probes
- `healthChecks.database()` / `.kv()` / `.service()` / `.custom()` — Built-in health checks
- `createOpenAPISpec()` / `createScalarDocs()` / `createScalarJs()` — API documentation
- `createErrorHandler()` / `createNotFoundHandler()` — Error middleware

**Layer 2 — Builder**:

```typescript
createService(router, { name, version, port })
  .withCors()
  .withLogger()
  .withOpenAPI({ title })
  .withDocs()
  .withDatabase(db)
  .withRPC({ traceContext: true })
  .withHealth()
  .withServiceInfo()
  .onStartup(async () => { ... })
  .serve()
```

**Layer 3 — Preset**:

- `defineService(router, options)` — One-liner with all defaults, database connectivity
  verification, retry logic

### @netscript/config — Configuration Management

**Purpose**: Vite-inspired type-safe configuration with runtime Zod validation.

**Entrypoints**: `.` only.

**Key exports**:

- `defineConfig(config)` / `defineConfigAsync(fn)` — Config definition
- `loadConfig()` / `initConfig()` / `getConfig()` — Load, cache, retrieve
- `resolveEnv(schema)` / `getEnv(name)` / `hasEnv(name)` — Type-safe env var access
- `isDev()` / `isProd()` / `isTest()` — Mode helpers

**Config schemas**: NetScriptConfigSchema, ServiceConfigSchema, DatabaseConfigSchema,
WorkerGroupSchema, SagasConfigSchema, TaskConfigSchema, DeploymentConfigSchema

### @netscript/telemetry — OpenTelemetry Integration

**Purpose**: Distributed tracing with Deno's native OTEL support.

**Entrypoints**:

| Subpath                  | Module                        | Purpose                                                                                                                |
| ------------------------ | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `.`                      | `mod.ts`                      | Barrel — re-exports all below                                                                                          |
| `./config`               | `config.ts`                   | OTEL configuration and environment                                                                                     |
| `./tracer`               | `tracer.ts`                   | `getTracer()`, `withSpan()`, `createSpan()`                                                                            |
| `./context`              | `context.ts`                  | `getTraceContext()`, `injectContext()`, `extractContext()`                                                             |
| `./attributes`           | `attributes.ts`               | Semantic attributes: `JobAttributes`, `MessagingAttributes`, `KVAttributes`                                            |
| `./instrumentation`      | `instrumentation.ts`          | `traceJobExecution()`, `startWorkerSpan()`, `traceSchedulerTick()`, `TracedQueue`, `traceQueue()`                      |
| `./instrumentation/saga` | `src/instrumentation/saga.ts` | Saga-specific tracing middleware                                                                                       |
| `./orpc`                 | `orpc.ts`                     | `TracingPlugin`, `ErrorHandlingPlugin`, `createTracingPlugin()`, `createErrorHandlingPlugin()`, `createTraceContext()` |

**Design**: No-op when `OTEL_DENO=false`. Uses Deno's native OTLP exporter when enabled. Aspire
injects all OTEL environment variables.

### @netscript/logger — Structured Logging

**Purpose**: Hierarchical logging built on LogTape.

**Entrypoints**:

| Subpath        | Module          | Purpose                                                                 |
| -------------- | --------------- | ----------------------------------------------------------------------- |
| `.`            | `mod.ts`        | Core: logger creators, configuration, LogTape re-exports                |
| `./middleware` | `middleware.ts` | Hono middleware with request ID injection                               |
| `./orpc`       | `orpc.ts`       | `LoggingPlugin` — oRPC plugin with procedure logging, duration tracking |

**Key exports** (root):

- `createServiceLogger(name)` / `createPackageLogger(name)` / `createWorkerLogger(name)` /
  `createJobLogger(jobId)` / `createChildLogger(parent, name)` — Scoped loggers
- `configureLogging(config)` / `ensureLogging()` / `isLoggingConfigured()` / `resetLogging()` —
  Configuration
- `configure`, `getConsoleSink`, `getLogger`, `withContext` — Direct LogTape re-exports

**Hierarchy**: `['netscript', 'services', 'users', 'getById']` →
`[netscript][services][users][getById]`

---

## Data Layer

### @netscript/kv — Reactive Key-Value Store

**Purpose**: Unified KV interface across Redis, Deno KV, and in-memory backends.

**Entrypoints**:

| Subpath   | Module     | Purpose                                            |
| --------- | ---------- | -------------------------------------------------- |
| `.`       | `mod.ts`   | Core lifecycle, types, Deno KV and Memory adapters |
| `./redis` | `redis.ts` | `RedisKvAdapter` — requires `ioredis`              |

**Key exports** (root):

- Lifecycle: `getKv()`, `getRawKv()`, `closeKv()`, `resetKv()`, `isKvInitialized()`, `getKvPath()`
- Provider: `getActiveProvider()`, type `KvProvider`, type `SharedKvConfig`
- Adapters: `DenoKvAdapter`, `MemoryKvAdapter` (root); `RedisKvAdapter` (via `./redis`)
- Type guards: `isWatchable()`
- Store types: `WatchableKv`, `KvStore`, `KvEntry`, `KvKey`, `KvListOptions`, `KvSetOptions`,
  `WatchEvent`, `WatchOptions`, `WatchPrefixOptions`
- Atomic types: `AtomicCheck`, `AtomicMutation`, `AtomicResult`

**Auto-detection priority**: Redis → Deno KV. Reads Aspire env vars for connection info.

### @netscript/queue — Message Queue Abstraction

**Purpose**: Fedify-wrapped message queue with type-safe validation.

**Entrypoints**: `.` only.

**Key exports**:

- `createQueue(name)` / `createTypedQueue(name, schema)` /
  `createParallelQueue(name, { concurrency })` — Factory functions
- Adapters: `DenoKvAdapter`, `RedisAdapter`, `AmqpAdapter`, `KvPollingAdapter`
- `safeValidate()` / `validateOrThrow()` — Zod validation helpers

**Auto-detection priority**: RabbitMQ → Redis → Deno KV (with polling fallback for KV Connect).

### @netscript/database — Database Adapters

**Purpose**: Prisma driver adapters for multiple databases with tracing and utilities.

**Entrypoints**:

| Subpath               | Module                         | Purpose                                                                    |
| --------------------- | ------------------------------ | -------------------------------------------------------------------------- |
| `.`                   | `mod.ts`                       | Main: instrumentation, transaction wrapper, connection helpers, JSON utils |
| `./interfaces`        | `interfaces/mod.ts`            | Adapter interface definitions                                              |
| `./adapters`          | `adapters/mod.ts`              | All adapters barrel                                                        |
| `./adapters/postgres` | `adapters/postgres.adapter.ts` | Prisma v7 PostgreSQL driver adapter                                        |
| `./adapters/mssql`    | `adapters/mssql.adapter.ts`    | Prisma v7 MSSQL driver adapter                                             |
| `./adapters/mysql`    | `adapters/mysql.adapter.ts`    | Prisma v7 MySQL driver adapter                                             |
| `./extensions`        | `extensions/mod.ts`            | JSON field utilities for different backends                                |
| `./scripts`           | `scripts/mod.ts`               | Zod generation, migration, import fixer scripts                            |
| `./tracing`           | `prisma-tracing.ts`            | Prisma OTEL tracing integration                                            |

**Key exports** (root):

- `enableInstrumentation()` — Prisma OTEL tracing
- `PostgresAdapter` / `MssqlAdapter` / `MysqlAdapter` — Prisma v7 driver adapters
- `parseConnectionString()` / `buildPostgresConnectionString()` — Connection helpers
- `withTransaction()` — Transaction wrapper
- `jsonUtils` — JSON field utilities for different backends

### @netscript/cron — Scheduling Abstraction

**Purpose**: Runtime-agnostic cron scheduling.

**Entrypoints**:

| Subpath      | Module                | Purpose                                           |
| ------------ | --------------------- | ------------------------------------------------- |
| `.`          | `mod.ts`              | Factory, singleton, adapters, presets, validation |
| `./adapters` | `adapters/mod.ts`     | `DenoCronAdapter`, `MemoryCronAdapter`            |
| `./types`    | `interfaces/types.ts` | Cron types, `CronPresets`                         |

**Key exports** (root):

- `createScheduler()` / `getScheduler()` / `stopScheduler()` — Factory and singleton
- `DenoCronAdapter` — Uses native `Deno.cron()`
- `MemoryCronAdapter` — In-memory for testing
- `CronPresets` — HOURLY, DAILY, WEEKDAYS_9AM, etc.
- `isValidCronExpression()` / `parseCronExpression()` — Validation

---

## Workers, Sagas & Triggers

### @netscript/plugin-workers-core — Job, Task & Workflow Primitives

**Purpose**: Published workers-core package for job/task/workflow definitions, typestate builders,
runtime composition, registries, execution state, Dax-backed task execution, streams, testing, and
worker plugin config schemas. The former package-level workers implementation now lives in
`packages/plugin-workers-core/`; `plugins/workers/` owns the installable plugin wrapper.

**Entrypoints**:

| Subpath          | Module                        | Purpose                                                                     |
| ---------------- | ----------------------------- | --------------------------------------------------------------------------- |
| `.`              | `mod.ts`                      | Capped public root: builders, result factories, runtime preset, diagnostics |
| `./config`       | `src/config/mod.ts`           | Worker/job/task config schemas plus `defineWorkers()` and `defineJobs()`    |
| `./runtime`      | `src/runtime/mod.ts`          | `createWorkersRuntime()`, in-process runner, dispatcher, runtime messages   |
| `./executor`     | `src/executor/mod.ts`         | Multi-runtime task executor and runtime adapters                            |
| `./registry`     | `src/registry/mod.ts`         | Memory/KV job and task registries                                           |
| `./state`        | `src/state/mod.ts`            | KV-backed execution state                                                   |
| `./contracts/v1` | `src/contracts/v1/mod.ts`     | Workers service contract                                                    |
| `./schemas`      | `src/domain/public-schema.ts` | Public Zod schema surface                                                   |
| `./testing`      | `src/testing/mod.ts`          | In-memory adapters and fixtures                                             |

**Key exports** (grouped by domain):

- **Builders**: `defineJob()`, `defineTask()`, `defineWorkflow()`, typestate builder types.
- **Handlers/results**: `defineJobHandler(fn)`, `createSuccessResult()`, `createFailureResult()`. Do
  not use the removed object-style `defineJobHandler({ ... })` or `jobSuccess`/`jobFailure`.
- **Config**: `defineWorkers()`, `defineJobs()`, `WorkersConfigSchema`, `JobConfigSchema`,
  `TaskConfigSchema` from `@netscript/plugin-workers-core/config`; `@netscript/config` preserves
  plugin sections but does not own worker schema validation.
- **Runtime**: `createWorkersRuntime(opts)` is the composition root; no singleton `get*()` /
  `reset*()` runtime accessors.
- **Executor**: Dax-backed multi-runtime task executor for Deno, Python, Shell, PowerShell, .NET,
  cmd, and executable tasks.
- **Registry/state**: Memory/KV registries and KV-backed execution state.
- **Plugin layer**: `plugins/workers` owns services, bins, CLI verbs, Aspire contribution,
  worker/scheduler processes, registry generation, and scaffold/runtime manifests.

### @netscript/plugin-sagas-core — Durable Workflow Orchestration

**Purpose**: Saga DSL, runtime ports, transports, stores, telemetry, config, and test primitives.
The installable plugin wrapper lives in `plugins/sagas/`.

**Entrypoints**:

| Subpath                   | Module                             | Purpose                                              |
| ------------------------- | ---------------------------------- | ---------------------------------------------------- |
| `.`                       | `mod.ts`                           | Core saga builder, bus, registry, transports, stores |
| `./builders`              | `src/builders/mod.ts`              | Saga definition DSL                                  |
| `./config`                | `src/config/mod.ts`                | Saga configuration schemas                           |
| `./integration/publisher` | `src/integration/publisher/mod.ts` | Service-side message publisher                       |
| `./integration/workers`   | `src/integration/workers/mod.ts`   | `triggerJob()` — saga-to-worker bridge               |

**Key exports** (root):

- `defineSaga()` and saga builder primitives for typed workflow definitions.
- `getSagaRegistry()` — Singleton saga registry
- `createSagaBus()` / `getSagaBus()` — Saga bus factory (auto-discovers transport)
- `SagaBusAdapter` — Wrapper around @saga-bus/core
- `NetScriptRedisTransport` / `GarnetListTransport` — Fixed transports
- `startSagas(options)` — Processor entry point
- SSE middleware, tracing middleware

**Integration exports**:

- `createSagaPublisher<TMessages>()` — Service-side message publisher (via `./publisher`)
- `createSagaJobContext<TMessages>()` — Worker job saga integration (via `./publisher`)
- `triggerJob()` — Saga handler → Workers API bridge (via `./integration/workers`)

**Transports**: Redis Streams, Garnet LIST-based, InMemory. **Stores**: Postgres (Prisma), Redis,
InMemory.

### @netscript/plugin-triggers-core — Event-Driven Trigger System

**Purpose**: Handler-first DSL, trigger event domain types, processor ports, runtime composition,
testing adapters, telemetry, config, and contracts for webhook, file-watch, and scheduled triggers.

**Entrypoints**:

| Subpath          | Module                    | Purpose                                    |
| ---------------- | ------------------------- | ------------------------------------------ |
| `.`              | `mod.ts`                  | Capped public root                         |
| `./builders`     | `src/builders/mod.ts`     | Handler-first trigger DSL                  |
| `./domain`       | `src/domain/mod.ts`       | Trigger definitions, events, specs, errors |
| `./runtime`      | `src/runtime/mod.ts`      | Processor and ingress composition roots    |
| `./ports`        | `src/ports/mod.ts`        | Processor, ingress, scheduler, DLQ ports   |
| `./testing`      | `src/testing/mod.ts`      | Memory adapters and test clock             |
| `./config`       | `src/config/mod.ts`       | Trigger config schemas                     |
| `./contracts/v1` | `src/contracts/v1/mod.ts` | Triggers API contract                      |

**Key exports** (root):

- **Builders**: `defineWebhook(handler, spec)`, `defineFileWatch(handler, spec)`,
  `defineScheduledTrigger(handler, spec)`.
- **Runtime**: `createTriggerProcessor(opts)`, `createTriggerIngress(opts)`, `TriggerProcessor`.
- **Ports**: scheduler, ingress, processor, DLQ, idempotency, and webhook verifier ports.
- **Plugin layer**: `plugins/triggers` owns HTTP ingress, cron and watcher adapters, CLI verbs,
  Aspire contribution, scaffold manifests, and `trigger-processor`.
- Actions: `TriggerActionSchema`, `ActionTypeSchema`, `EnqueueJobActionSchema`,
  `PublishSagaActionSchema`, `CallServiceActionSchema`, `RunScriptActionSchema`,
  `ExecuteTaskActionSchema`, `EnqueueMessageActionSchema`, `ExecuteBatchActionSchema`,
  `CustomActionSchema`
- Events: `TriggerEventSchema`, `FileEventPayloadSchema`, `FileEventKindSchema`,
  `TriggerEventStatusSchema`, `ActionResultSchema`
- Middleware: `TriggerMiddlewareSchema`, `ThrottleConfigSchema`, `RetryPolicySchema`,
  `ActionChainConfigSchema`
- KV keys: `TriggerKvKeys`

### @netscript/watchers — File-Watching Primitives

**Purpose**: Composable strategies, filters, and a pipeline-based `FileWatcher` for detecting file
system changes across local and network filesystems.

**Entrypoints**: `.` only.

**Key exports**:

- **Factory**: `createWatcher(options)` — Creates a configured `FileWatcher` with strategy
  auto-detection
- **Watcher**: `FileWatcher` — Pipeline-based watcher: strategy → filters → async iterable of
  `WatchEvent`
- **Strategies**: `NativeStrategy` (Deno.watchFs), `PollingStrategy` (interval-based stat polling
  for network drives), `HybridStrategy` (native with polling fallback)
- **Filters**: `StabilityFilter` (file-size stability checks), `GlobFilter` (pattern matching),
  `DedupFilter` (content-hash deduplication)
- **FS Utilities**: `AccessFailureTracker`, `safeReadFile()`, `safeStat()`, `computeContentHash()`
- **Types**: `WatchEvent`, `EventKind`, `FileInfo`, `StabilityOptions`, `WatcherOptions`,
  `WatchFilter`, `WatchStrategy`, `WatchStrategyHandler`

### @netscript/runtime-config — Hot-Reloadable Runtime Overrides

**Purpose**: Loads and watches hot-reloadable runtime overrides from the deployment config
directory. Consumed by workers, sagas, and triggers binaries for live schedule/enable/disable
changes without restarts.

**Entrypoints**: `.` only (single-file package).

**Key exports**:

- `loadRuntimeConfig()` — Load all overrides from the resolved runtime config directory. Returns
  `RuntimeConfig` with graceful empty defaults on missing files.
- `watchRuntimeConfig(onChange, options)` — Watch the config directory for changes, debounce
  (300ms), and invoke `onChange` with the reloaded config. Uses `Deno.watchFs()` with `AbortSignal`
  for graceful shutdown.
- `logRuntimeConfigSummary(config, prefix?)` — Console-log summary of active overrides at startup
- Per-topic getters: `getJobOverride(config, jobId)`, `getSagaOverride(config, sagaId)`,
  `getTriggerOverride(config, triggerId)`, `getRuntimeTask(config, taskId)`
- `isFeatureEnabled(config, flagId, defaultValue?)` — Feature flag check

**Types**:

- `RuntimeConfig` — Top-level: `{ jobs, sagas, triggers, features, tasks }`
- `JobOverride` — `{ id, enabled?, schedule?, timeout?, maxRetries?, timezone?, concurrency? }`
- `SagaOverride` — `{ id, enabled?, timeout?, maxRetries?, compensationTimeout? }`
- `TriggerOverride` — `{ id, enabled?, paths? }`
- `FeatureFlag` — `{ id, enabled, description?, rolloutPercentage? }`
- `RuntimeTask` — `{ id, name, runtime, entrypoint, enabled?, timeout?, schedule?, description? }`

**Resolution order** for config directory:

1. `NETSCRIPT_RUNTIME_CONFIG_DIR` env var
2. Parent of `NETSCRIPT_TASKS_DIR`
3. `./runtime` (dev fallback)

---

## Frontend

### @netscript/fresh — Fresh 2 Framework Extensions

**Purpose**: Enterprise wrappers for Fresh 2 — composable page builders, form handling, defer/cache
system, error pipelines, route contracts, SSE, app bootstrap, and Vite configuration.

**Entrypoints**:

| Subpath         | Module            | Purpose                                                                                                                                                                                 |
| --------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.`             | `mod.ts`          | Curated shared surface: `DeferPage`, `DeferComponent`, `ErrorDisplay`, `errorHandler`, `hasError`, `extractData`, cache utilities                                                       |
| `./server`      | `server.ts`       | Server-only: SSE stream helpers, `defineFreshApp()` bootstrap                                                                                                                           |
| `./builders`    | `builders/mod.ts` | `definePage()`, `definePartial()`, `defineStatsPartial()`, `PageBuilder` interface, typed route references, 60+ typed symbols                                                           |
| `./route`       | `route/mod.ts`    | Route contract definitions and manifest utilities                                                                                                                                       |
| `./defer`       | `defer/mod.ts`    | `DeferPage`, `DeferComponent`, `DEFER_POLICY`, `DEFER_STALE_MS`, `DETAIL_FORCE_REFRESH_POLICY`, `resolveDetailDeferConfig`                                                              |
| `./form`        | `form/mod.ts`     | Form helpers: `createEmptyFormErrors`, `toFormErrors`, `firstFieldError`, `formDataToRawValues`, `normalizeFormValues`, `resolveFormState`, `buildPaginationState`, `resolvePagination` |
| `./error`       | `error/mod.ts`    | `errorHandler()`, `extractData()`, `extractErrorData()`, `hasError()`                                                                                                                   |
| `./utils`       | `utils/mod.ts`    | `CacheEntry` helpers: `hasAllCacheEntries`, `minCachedAt`, `projectCachedItemFromList`                                                                                                  |
| `./interactive` | `interactive.ts`  | Browser-facing: `usePromise()`, `resolvedPromise()`                                                                                                                                     |
| `./vite`        | `config/vite.ts`  | `createNetScriptVitePlugin()` — Vite plugin with NetScript route/env defaults                                                                                                           |

**Builders** (`./builders`):

The `definePage()` builder provides a composable, type-safe page construction API:

```typescript
definePage('/dashboard/users')
  .withPathSchema(schema)
  .withSearchSchema(schema)
  .withResource('users', loaderFn)
  .withLayer('main', layerConfig)
  .withHandler('POST', handlerFn)
  .withLayout(layoutFn)
  .withMeta(metaResolver)
  .build();
```

Key builder types: `PageBuilder`, `PageContext`, `PageLayoutContext`, `PageRouteTarget`,
`PageRouteReference`, `PageRouteNavigation`, `PagePairedRouteTarget`, `PageDefinition`,
`RoutedPageDefinition`, `PageSlot`, `PageSlots`, `PageMetaDescriptor`.

Preset builders: `definePartial(options)` for partial endpoints, `defineStatsPartial(options)` for
stats-specific partials.

**Form** (`./form`):

- `createEmptyFormErrors()` / `toFormErrors(zodError)` / `firstFieldError(errors, field)` — Error
  construction and extraction
- `formDataToRawValues(formData)` / `normalizeFormValues(raw, schema)` — FormData → typed values
- `resolveFormState(ctx)` — Resolve form state from request context
- `buildPaginationState(input)` / `resolvePagination(ctx)` — Pagination from URL search params
- Types: `FormErrors`, `FormState`, `PaginationState`, `FormPageMode`, `FormPageProps`,
  `FormValues`, `FormFieldErrors`, `FormPageInvalidateContext`

**Patterns**: `definePage()` carries compile-time type information through the builder chain. Forms
parse FormData through Zod validation. DeferPage renders cached content immediately and replaces
with fresh data from partial endpoints.

### @netscript/fresh-ui — Interactive Primitives & Component Registry

**Purpose**: Interactive UI primitives and a copy-source component registry for Fresh applications.
Uses a two-model delivery architecture.

**Entrypoints**:

| Subpath         | Module           | Purpose                                                                                                                                 |
| --------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `.`             | `mod.ts`         | Stable helpers: `cn()` (class merging via clsx + tailwind-merge), toast state management (`withToast`, `getToast`, `stripToastFromUrl`) |
| `./interactive` | `interactive.ts` | Package-owned interactive primitives: Accordion, Dialog, Drawer, Popover, Tabs, Tooltip                                                 |

**Two delivery models**:

1. **Interactive primitives** (`runtime/`, imported via `./interactive`) — Package-owned, accessible
   components with keyboard navigation, focus management, and ARIA attributes. Updated with the
   package. Headless: accessibility and interaction built in, styling is yours.

2. **Registry components** (`registry/`, copy-source) — UI components you copy into your app and
   own. After copying, the files are yours — update styles, add props, wire up your own state.
   Package updates do not affect copied code.

**Interactive primitives** (6):

| Component   | Subcomponents                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| `Accordion` | `Root`, `Item`, `ItemTrigger`, `ItemIndicator`, `ItemContent`                                              |
| `Dialog`    | `Root`, `Trigger`, `Content`, `Title`, `Description`, `Close`                                              |
| `Drawer`    | `Root`, `Trigger`, `Content`, `Title`, `Description`, `Close`                                              |
| `Popover`   | `Root`, `Trigger`, `Anchor`, `Positioner`, `Content`, `Title`, `Description`, `Close`, `Arrow`, `ArrowTip` |
| `Tabs`      | `Root`, `List`, `Trigger`, `Content`                                                                       |
| `Tooltip`   | `Root`, `Trigger`, `Positioner`, `Content`, `Arrow`, `ArrowTip`                                            |

**Registry components** (copy from `registry/components/ui/`):

Buttons & Actions: `Button`, `IconButton`. Form Controls: `Input`, `Textarea`, `Select`, `Checkbox`,
`Switch`, `Label`, `FormField`. Layout: `Card`, `Panel`, `DetailLayout`, `SidebarShell`,
`SectionDivider`, `Separator`. Data Display: `DataTable`, `Badge`, `StatsGrid`, `Pagination`.
Navigation: `Breadcrumb`, `PageHeader`, `FilterForm`. Feedback: `Alert`, `InlineNotice`, `Spinner`,
`Progress`, `Skeleton`, `EmptyState`.

**Registry islands** (copy from `registry/islands/`): `SidebarToggle`, `ThemeToggle`, `Toast`.

---

## Utilities

### @netscript/contracts — Contract Utilities

**Entrypoints**: `.` only.

**Key exports**: `createCrudContract()`, `createReadOnlyContract()`, `createPaginatedOutput()`,
`buildPrismaWhere()`, `buildSearchCondition()`, `createTransformer()`, `paginatedQuery()`

### @netscript/contracts — Shared Utilities

**Entrypoints**: `.` only.

**Key exports** (via `@netscript/contracts`): Validators (`positiveInt`, `nonNegativeInt`,
`paginationLimit`), Codecs (`stringToInt`, `decimalToNumber`), Error helpers (`notFound`,
`getResourceType`)

### @netscript/plugin — Plugin System

**Entrypoints**:

| Subpath       | Module                 | Purpose                                     |
| ------------- | ---------------------- | ------------------------------------------- |
| `.`           | `mod.ts`               | Manifest builder, discovery, loader, walker |
| `./abstracts` | `src/abstracts/mod.ts` | Plugin extension contracts                  |
| `./config`    | `src/config/mod.ts`    | Host config helpers                         |
| `./cli`       | `src/cli/mod.ts`       | Framework verb dispatch and doctor helpers  |
| `./loader`    | `loader.ts`            | Plugin loading and resolution               |
| `./sdk`       | `src/sdk/mod.ts`       | Plugin author SDK surface                   |
| `./testing`   | `src/testing/mod.ts`   | Test helpers and fixture primitives         |
| `./templates` | `src/templates/mod.ts` | Scaffold template helpers                   |

**Key exports** (root): typestate `definePlugin(name, version).with*().build()`, manifest
validation, plugin loading/resolution, filesystem discovery, registry extraction/emission, and
framework verb dispatch. User projects list installed plugins in `netscript.config.ts`; the walker
generates runtime registries under `.netscript/generated/`.

Official plugin packages are:

- `plugins/workers/` with `packages/plugin-workers-core/`
- `plugins/sagas/` with `packages/plugin-sagas-core/`
- `plugins/triggers/` with `packages/plugin-triggers-core/`
- `plugins/streams/` with `packages/plugin-streams-core/`

### @netscript/cli — Deployment CLI

**Purpose**: Build, install, and manage NetScript applications as native Windows Services. Replaces
the old 6,262-line `scripts/deploy-windows.ts` monolith.

**Entrypoints**: `.` only.

**Key exports**:

- `loadDeployConfig(options?)` — Three-source merge (netscript.config.ts + appsettings.json + env)
- `findProjectRoot(startDir?)` — Walks up from CWD to locate project root
- `loadRuntimeOverrides(configDir)` — Reads `runtime/current` + topic JSON files
- `detectInfrastructure(raw)` — DB/cache detection (env vars → appsettings → Docker → defaults)
- `buildWindowsDeployment(config, options)` — Full pipeline: compile → Servy XML → manifest →
  runtime
- `extractCompileTargets(config)` / `compileAll(targets, options)` — deno compile wrapper
- `writeServyConfigs(targets, configDir, options)` / `generateServyXml(config)` — Servy XML
- `generateServiceManifest(...)` / `topologicalSort(targets)` — services.json + dep ordering
- `writeRuntimeConfig(config, configDir, version, force?)` — runtime/ scaffolding
- `getV8Profile(target)` — V8 heap profile per service type (256/512/128 MB)
- `CLIError`, `ExitCode`, `formatError()` — Typed error hierarchy

**See**: [11-cli-deployment.md](./11-cli-deployment.md) for full reference.

### @netscript/prisma-adapter-mysql — MySQL Adapter

Prisma v7 MySQL driver adapter for Deno using `deno.land/x/mysql`.

**Entrypoints**: `.` only (exports from `src/mod.ts`).

---

## Import Aliases

```typescript
// Core workspace aliases
import { ... } from '@contracts';                 // contracts/mod.ts
import { ... } from '@database';                  // database/postgres/mod.ts (or database/mod.ts)
import { ... } from '@database/zod';              // database/postgres/schema/.generated/zod/schemas/index.ts
import { ... } from '@netscript/contracts';              // packages/contracts/mod.ts

// Package aliases (used across the workspace)
import { ... } from '@netscript/sdk';              // packages/sdk/mod.ts
import { ... } from '@netscript/sdk/client';       // packages/sdk/client/mod.ts (and other subpaths)
import { ... } from '@netscript/fresh';            // packages/fresh/mod.ts
import { ... } from '@netscript/fresh/builders';   // packages/fresh/builders/mod.ts
import { ... } from '@netscript/fresh/form';       // packages/fresh/form/mod.ts
import { ... } from '@netscript/fresh/vite';       // packages/fresh/config/vite.ts
import { ... } from '@netscript/fresh-ui';         // packages/fresh-ui/mod.ts
import { ... } from '@netscript/fresh-ui/interactive'; // packages/fresh-ui/interactive.ts
import { ... } from '@netscript/kv';               // packages/kv/mod.ts
import { ... } from '@netscript/kv/redis';         // packages/kv/redis.ts
import { ... } from '@netscript/queue';            // packages/queue/mod.ts
import { ... } from '@netscript/cron';             // packages/cron/mod.ts
import { ... } from '@netscript/telemetry';        // packages/telemetry/mod.ts
import { ... } from '@netscript/plugin-workers-core'; // packages/plugin-workers-core/mod.ts
import { ... } from '@netscript/plugin-workers-core/config'; // worker config schemas/helpers
import { ... } from '@netscript/plugin-sagas-core'; // packages/plugin-sagas-core/mod.ts
import { ... } from '@netscript/plugin-triggers-core'; // packages/plugin-triggers-core/mod.ts
import { ... } from '@netscript/plugin-triggers-core/builders'; // trigger DSL
import { ... } from '@netscript/watchers';         // packages/watchers/mod.ts
import { ... } from '@netscript/config';           // packages/config/mod.ts
import { ... } from '@netscript/logger';           // packages/logger/mod.ts
import { ... } from '@netscript/logger/middleware'; // packages/logger/middleware.ts
import { ... } from '@netscript/logger/orpc';      // packages/logger/orpc.ts
import { ... } from '@netscript/service';          // packages/service/mod.ts
import { ... } from '@netscript/plugin';           // packages/plugin/mod.ts
import { ... } from '@netscript/runtime-config';   // packages/runtime-config/mod.ts
import { ... } from '@netscript/cli';              // packages/cli/mod.ts
import { ... } from '@netscript/database';         // packages/database/mod.ts

// Application-level aliases
import { ... } from '@workers';                    // workers/mod.ts
import { ... } from '@plugins/workers';            // plugins/workers/contracts/v1/mod.ts
import { ... } from '@plugins/sagas/contracts';    // plugins/sagas/contracts.ts
import { ... } from '@plugins/triggers/contracts'; // plugins/triggers/contracts.ts
import { ... } from '@sagas/types';                // sagas/types.ts
import { ... } from '@app/triggers';               // triggers/mod.ts
```
