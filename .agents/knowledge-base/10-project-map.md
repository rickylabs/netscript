# Project Semantic Map

> Doctrine reference: package/plugin architecture is governed by `docs/architecture/doctrine/` and
> `.llm/harness/debt/arch-debt.md`. This file describes current repo state; doctrine defines the
> target state.

> Complete file inventory organized by domain, purpose, and dependency relationships. Use this to
> efficiently locate any file in the codebase.

## Project Statistics

| Category    | Files    | Lines       |
| ----------- | -------- | ----------- |
| Contracts   | 10       | 1,452       |
| Services    | 14       | 1,351       |
| Packages    | 183      | 51,567      |
| Frontend    | 125      | 18,412      |
| Plugins     | 31       | 5,608       |
| Workers     | 34       | 4,968       |
| Sagas       | 7        | 1,398       |
| .NET/Aspire | 9        | 2,594       |
| Database    | 20       | 2,092       |
| Root Config | 3        | 1,511       |
| **TOTAL**   | **~436** | **~91,000** |

---

## Configuration Files (Entry Points)

```
netscript.config.ts                    Main app config (services, installed plugins, databases)
deno.json                              [78 lines]  Workspace config (members, tasks, imports, compiler options)
dotnet/AppHost/appsettings.json        [~120 lines] Aspire infrastructure config
dotnet/AppHost/Program.cs              [310 lines] Aspire orchestration entry point
```

## Contracts Layer

```
contracts/
├── mod.ts                             [67]  Main barrel export (v1, plugins, API_VERSIONS)
├── shared.ts                          [262] Base contract, pagination schemas, error schemas
├── plugins/mod.ts                     [62]  Plugin contract registry
└── versions/v1/
    ├── mod.ts                         [37]  v1 contract object for routers
    ├── index.ts                       [16]  v1 schema exports for types
    ├── users.contract.ts              [199] User CRUD + stats + filters
    ├── products.contract.ts           [185] Product CRUD + stats + filters + Decimal
    ├── orders.contract.ts             [242] Order CRUD + stats + relations + cross-service
    ├── health.contract.ts             [89]  Health check + ping contracts
    └── jobs.contract.ts               [293] Execution records, job definitions, KV keys, SSE events
```

## Services Layer

```
services/
├── users/src/
│   ├── main.ts                        [28]  defineService() entry point, port 3000
│   ├── router.ts                      [57]  v1 { health, users } composition
│   └── routers/
│       ├── v1.ts                      [218] User CRUD handlers + saga publish
│       └── health.ts                  [40]  Health check handlers
├── products/src/
│   ├── main.ts                        [28]  defineService() entry point, port 3001
│   ├── router.ts                      [57]  v1 { health, products } composition
│   └── routers/
│       ├── v1.ts                      [189] Product CRUD handlers + Decimal handling
│       └── health.ts                  [40]  Health check handlers
├── orders/src/
│   ├── main.ts                        [28]  defineService() entry point, port 3002
│   ├── router.ts                      [57]  v1 { health, orders } composition
│   └── routers/
│       ├── v1.ts                      [554] Order CRUD + cross-service + saga + transforms
│       └── health.ts                  [40]  Health check handlers
└── plugins/
    ├── mod.ts                         [65]  Plugin services barrel
    └── workers/mod.ts                 [10]  Workers service re-export
```

## Packages Layer (21 packages)

### Core SDK & Service

```
packages/sdk/
├── mod.ts                             [57]  Main exports
├── service-discovery.ts               [558] Aspire env var resolution
├── orpc-client.ts                     [207] Type-safe oRPC client factory
├── cache-query.ts                     [327] Stale-while-revalidate cache
├── query-factory.ts                   [416] TanStack Query-inspired factories
├── openapi-helpers.ts                 [100] OpenAPI utilities
├── otel-middleware.ts                 [29]  OTEL middleware
└── types.ts                           [37]  Type definitions

packages/service/
├── mod.ts                             [78]  Main exports (3 layers)
├── builders/service-builder.ts        [492] Fluent builder API
├── presets/define-service.ts          [350] One-liner preset with DB verification
└── primitives/
    ├── handlers.ts                    [201] RPC/OpenAPI handler factories
    ├── health.ts                      [225] Health check primitives
    └── openapi.ts                     [124] OpenAPI spec + Scalar docs
```

### Configuration & CLI

```
packages/config/
├── mod.ts                             [109] Main exports
├── define-config.ts                   [79]  defineConfig() + defineConfigAsync()
├── env.ts                             [146] Environment variable utilities
├── loader.ts                          [193] Config file loading + caching
├── schema.ts                          [754] All Zod schemas (SINGLE SOURCE OF TRUTH)
└── types.ts                           [267] TypeScript type definitions

packages/cli/
├── mod.ts                             [136] CLI exports
└── src/
    ├── main.ts                        [438] CLI command handler
    ├── types.ts                       [413] Deployment types
    └── config/loader.ts               [681] Config merge (netscript.config + appsettings)
    └── adapters/windows/
        ├── compile.ts                 [368] deno compile utilities
        ├── compiled.ts                [620] Compiled deployment strategy
        ├── discovery.ts               [373] Service discovery for deploy
        ├── servy.ts                   [439] Servy XML config generation
        └── scripts.ts                 [826] PowerShell script generation
```

### Data Layer

```
packages/kv/
├── mod.ts                             [79]  Main exports
├── shared.ts                          [398] Singleton KV manager + auto-detection
├── interfaces/
│   ├── watchable-kv.ts                [121] Core WatchableKv interface
│   ├── kv-store.ts                    [158] Fedify-compatible KvStore
│   ├── types.ts                       [112] Type definitions
│   └── mod.ts                         [33]  Interface exports
└── adapters/
    ├── deno-kv.adapter.ts             [587] Deno KV with native watch()
    ├── redis.adapter.ts               [724] Redis via ioredis
    ├── memory.adapter.ts              [538] In-memory for testing
    └── mod.ts                         [15]  Adapter exports

packages/queue/
├── mod.ts                             [104] Main exports
├── factory/
│   ├── create-queue.ts                [382] Auto-detection factory
│   ├── create-typed-queue.ts          [201] Zod-validated queue
│   ├── create-parallel-queue.ts       [145] Concurrent consumer
│   └── mod.ts                         [12]
├── adapters/
│   ├── deno-kv.adapter.ts            [473] Fedify Deno KV adapter
│   ├── redis.adapter.ts              [342] Fedify Redis adapter
│   ├── amqp.adapter.ts               [319] Fedify RabbitMQ adapter
│   ├── kv-polling.adapter.ts          [753] Polling fallback for KV Connect
│   └── mod.ts                         [12]
├── interfaces/                        [~600] Queue interfaces + error classes
├── internal/                          [~370] Distributed + parallel queue internals
└── utils/                             [~140] Validation utilities

packages/database/
├── mod.ts                             [261] Main exports + instrumentation
├── adapters/
│   ├── postgres.adapter.ts            [196] Prisma v7 pg adapter
│   ├── mysql.adapter.ts               [464] Prisma v7 MySQL adapter
│   ├── mssql.adapter.ts              [482] Prisma v7 MSSQL adapter
│   └── mod.ts                         [21]
├── interfaces/                        [~200] Adapter interfaces
├── extensions/                        [~620] JSON field utilities
└── scripts/                           [~710] Zod gen, migration, import fixer

packages/cron/
├── mod.ts                             [219] Main exports + singleton
├── adapters/
│   ├── deno.adapter.ts               [420] Deno.cron native adapter
│   ├── memory.adapter.ts             [490] In-memory for testing
│   └── mod.ts                         [14]
└── interfaces/
    ├── scheduler.ts                   [186] CronScheduler interface
    ├── types.ts                       [234] Cron types + presets
    └── mod.ts                         [33]
```

### Observability

```
packages/telemetry/
├── mod.ts                             [251] Main exports
├── config.ts                          [236] OTEL configuration from env
├── tracer.ts                          [398] Tracer factory + span utilities
├── context.ts                         [564] W3C trace context propagation
├── attributes.ts                      [377] Semantic attribute builders
├── instrumentation/
│   ├── mod.ts                         [107] Instrumentation exports
│   ├── queue.ts                       [446] Queue tracing
│   ├── worker.ts                      [554] Worker/job tracing
│   ├── scheduler.ts                   [522] Scheduler tracing
│   ├── saga.ts                        [609] Saga tracing
│   └── sse.ts                         [453] SSE tracing
├── orpc/
│   ├── mod.ts                         [56]  oRPC plugin exports
│   ├── plugin.ts                      [258] TracingPlugin
│   ├── error-plugin.ts               [454] ErrorHandlingPlugin
│   └── context.ts                     [249] oRPC trace context
└── workers/mod.ts                     [169] Worker-specific OTEL

packages/logger/
├── mod.ts                             [106] Main exports
├── config.ts                          [157] LogTape configuration
├── creators.ts                        [142] Logger factory functions
├── middleware.ts                      [229] Hono logger middleware
├── types.ts                           [54]  Type definitions
└── orpc-plugin.ts                     [544] LoggingPlugin for oRPC
```

### Workers, Sagas, Triggers & Streams Core Packages

```
packages/plugin-workers-core/
├── mod.ts                             [37]  Capped public root exports
├── src/builders/                      [~560] Job/task/workflow typestate builders
├── src/config/                        [~250] Job/task/workers config schemas/helpers
├── src/domain/                        [~1.6K] Job/task/workflow/domain schemas and types
├── src/executor/                      [~870] Dax-backed multi-runtime task executor
├── src/registry/                      [~380] Memory/KV job and task registries
├── src/runtime/                       [~400] createWorkersRuntime + dispatcher/runner
├── src/state/                         [~230] KV execution state
├── src/streams/                       [~210] Workers stream producer/schema
├── src/testing/                       [~240] In-memory test adapters and fixtures
└── src/workflow/                      [~320] Workflow state/executor/step runner

plugins/workers/
├── mod.ts                             [14]  Plugin manifest
├── scaffold.runtime.json              [98]  Plugin-owned scaffold/runtime policy
├── bin/                               [~120] Worker/scheduler/combined entrypoints
├── services/src/                      [~950] Workers API service over createService()
├── src/cli/                           [~1K] Workers CLI verbs and registry generator
├── src/aspire/                        [~100] Aspire contribution
├── src/scaffolding/                   [~380] Job/task/workflow scaffolders
└── worker/                            [~1.6K] Plugin worker and scheduler processes

packages/plugin-sagas-core/
├── mod.ts                             Capped public root exports
├── src/builders/                      defineSaga(), defineSignal(), defineQuery()
├── src/domain/                        Saga definitions, messages, errors, schemas
├── src/ports/                         Runtime, store, transport, and logger ports
├── src/runtime/                       createSagaRuntime() and processor composition
├── src/transports/                    Redis/Garnet/in-memory transport adapters
├── src/stores/                        Saga state persistence adapters
├── src/integration/                   Publisher and worker bridge helpers
├── src/config/                        Saga config schemas
└── src/testing/                       Test helpers and memory adapters
```

### Shared Utilities

```
packages/contracts/
├── mod.ts                             [8]
└── utils/
    ├── mod.ts                         [7]   Main exports
    ├── error-helpers.ts               [74]  notFound(), getResourceType()
    ├── datetime.ts                    [1112] Date/time utilities
    └── zod/
        ├── mod.ts                     [8]
        ├── schemas.ts                 [111] positiveInt, paginationLimit, etc.
        ├── codecs.ts                  [421] stringToInt, decimalToNumber, etc.
        └── validation-helpers.ts      [211] Email, URL, bounded string validators

packages/contracts/
├── mod.ts                             [203] Contract utility exports
├── base-contract.ts                   [218] Base contract with error types
├── crud/create-crud-contract.ts       [265] CRUD contract generator
├── helpers/
│   ├── paginated-query.ts            [262] Prisma pagination helpers
│   └── transform.ts                   [162] Data transformation utilities
└── schemas/
    ├── pagination.ts                  [160] Pagination schema generators
    └── filters.ts                     [214] Dynamic filter builder

packages/plugin/
├── mod.ts                             Plugin system exports
├── loader.ts                          Plugin loading + resolution
└── src/
    ├── cli/                           Framework verb dispatch and doctor helpers
    ├── config/                        Plugin host config helpers
    ├── sdk/discovery/                 Filesystem walker, AST extractor, registry emitter
    ├── sdk/manifest/                  definePlugin(name, version).with*().build()
    ├── testing/                       Test helpers and fixtures
    └── templates/                     Scaffold template helpers
```

### Frontend Packages

```
packages/fresh-ui/
├── mod.ts                             [~15] Stable helpers: cn(), toast state
├── interactive.ts                     [~10] Interactive primitive re-exports
├── deno.json                               Package config
├── README.md                               Full component documentation
├── registry/
│   ├── lib/
│   │   ├── cn.ts                           Class name merging (clsx + tailwind-merge)
│   │   └── toast.ts                        URL-based toast state management
│   ├── components/ui/                      Copy-source UI components (20+)
│   │   ├── button.tsx, icon-button.tsx
│   │   ├── input.tsx, textarea.tsx, select.tsx
│   │   ├── checkbox.tsx, switch.tsx, label.tsx
│   │   ├── form-field.tsx, card.tsx, panel.tsx
│   │   ├── badge.tsx, breadcrumb.tsx, data-table.tsx
│   │   ├── detail-layout.tsx, empty-state.tsx
│   │   ├── filter-form.tsx, page-header.tsx
│   │   ├── pagination.tsx, section-divider.tsx, separator.tsx
│   │   ├── sidebar-shell.tsx, alert.tsx, inline-notice.tsx
│   │   ├── spinner.tsx, progress.tsx, skeleton.tsx
│   │   └── stats-grid.tsx
│   └── islands/
│       ├── SidebarToggle.tsx
│       ├── ThemeToggle.tsx
│       └── Toast.tsx
└── runtime/
    ├── accordion/                          Accordion primitive
    ├── dialog/                             Dialog primitive (focus trap)
    ├── drawer/                             Drawer primitive
    ├── popover/                            Popover primitive
    ├── tabs/                               Tabs primitive
    └── tooltip/                            Tooltip primitive
```

### Runtime Config & Triggers

```
packages/runtime-config/
├── mod.ts                             [~280] Single-file: loadRuntimeConfig(), watchRuntimeConfig(), getters
└── deno.json                               Package config

packages/watchers/
├── mod.ts                             [~50] Public surface
├── types.ts                                Type definitions
├── file-watcher.ts                         Pipeline-based FileWatcher
├── fs.ts                                   FS utilities (safeReadFile, safeStat)
├── deno.json                               Package config
├── strategies/
│   ├── native.ts                           Deno.watchFs strategy
│   ├── polling.ts                          Interval-based stat polling
│   └── hybrid.ts                           Native with polling fallback
└── filters/
    ├── stability.ts                        File-size stability checks
    ├── glob.ts                             Pattern matching
    └── dedup.ts                            Content-hash deduplication

packages/plugin-triggers-core/
├── mod.ts                                  Capped public root
├── src/builders/                           defineWebhook/FileWatch/ScheduledTrigger
├── src/domain/                             Trigger definitions, events, specs
├── src/ports/                              Processor, ingress, scheduler, DLQ ports
├── src/runtime/                            TriggerProcessor and ingress composition
├── src/testing/                            Memory adapters and test clock
├── src/config/                             Trigger config schemas
└── src/contracts/v1/                       Triggers API contract

packages/plugin-streams-core/
├── mod.ts                                  Capped public root exports
└── src/                                    Stream contract/domain primitives
```

## Frontend Application

```
apps/frontend/
├── main.ts                            [75]  App initialization + middleware
├── client.ts                          [2]   CSS import for HMR
├── utils.ts                           [56]  State type + define + getHandlerProps
├── vite.config.ts                     [123] Build config + Aspire env vars

├── lib/
│   ├── api-clients.ts                 [106] 5 service clients + query factories
│   └── types.ts                       [37]  Inferred types from clients

├── utils/
│   ├── dashboard-queries.ts           [230] Composite queries + invalidation + deletion
│   ├── store.ts                       [6]   Global store
│   └── jobs/
│       ├── store.ts                   [54]  Signal-based SSE state
│       └── connection.ts              [361] SSE connection lifecycle

├── islands/                           [~4000] Client-side interactive components
│   ├── JobsWidget.tsx                 [496] Real-time job monitoring SSE
│   ├── ManualTrigger.tsx              [425] Manual job/saga triggering
│   ├── SagaInstanceList.tsx           [394] Saga instance browser
│   ├── SagaTimeline.tsx               [397] Saga event timeline
│   ├── SagaStateViewer.tsx            [344] Saga JSON state viewer
│   ├── SagaLinkedJobs.tsx             [324] Saga-linked job executions
│   ├── Toast.tsx                      [308] Global notifications
│   ├── OrderItems.tsx                 [201] Order items island
│   ├── TriggerButton.tsx              [215] Trigger button island
│   ├── TaurifyTest.tsx                [645] Desktop integration test
│   └── components/
│       ├── ResultPreviewDialog.tsx     [291] Result/error modal
│       └── TopicSelector.tsx          [113] Topic filter dropdown

├── components/
│   ├── ui/                            [~480] Form primitives (button, input, select, label, form-field)
│   └── icons/                         [~500] SVG icon components (18 files)

├── routes/
│   ├── _app.tsx                       [23]  Root HTML shell (f-client-nav)
│   ├── (dashboard)/_layout.tsx        [87]  Dashboard nav header
│   ├── (dashboard)/dashboard/
│   │   ├── index.tsx                  [181] Dashboard overview
│   │   ├── users/                     [622] Users CRUD (index, [id], new, [id]/edit)
│   │   ├── products/                  [672] Products CRUD
│   │   ├── orders/                    [824] Orders CRUD
│   │   ├── tasks/                     [971] Tasks monitoring (index, [jobId], executions/[executionId])
│   │   └── sagas/                     [229] Sagas browser
│   ├── (dashboard)/(_components)/     [~2400] Shared dashboard components
│   │   ├── *-table.tsx                [~560] List table components
│   │   ├── *-form.tsx                 [~710] CRUD form components
│   │   ├── filters/                   [~470] Filter components
│   │   ├── stats-card.tsx             [67]  Stat card
│   │   ├── pagination.tsx             [143] Pagination controls
│   │   └── breadcrumb.tsx             [68]  Breadcrumbs
│   ├── partials/dashboard/            [~5600] Deferred loading endpoints
│   │   ├── stats.tsx                  [217] Dashboard stats
│   │   ├── users/                     [~1155] User list, stats, header, detail
│   │   ├── products/                  [~1150] Product list, stats, header, detail
│   │   ├── orders/                    [~1410] Order list, stats, header, detail
│   │   ├── tasks/                     [406] Task stats + list
│   │   └── sagas/                     [397] Saga stats + list
│   └── api/
│       ├── jobs.ts                    [209] SSE stream for job updates
│       ├── tasks/trigger.ts           [140] Manual task trigger
│       └── sagas/                     [391] Saga SSE + API endpoints
```

## Plugins

```
plugins/
├── workers/
│   ├── mod.ts                         [189] Workers plugin definition
│   ├── contracts/v1/
│   │   ├── mod.ts                     [107] Contract exports
│   │   └── workers.contract.ts        [318] Full workers API contract
│   ├── services/src/
│   │   ├── main.ts                    [68]  Workers API service (:8091)
│   │   ├── router.ts                  [90]  Router composition
│   │   └── routers/v1.ts             [689] All workers API handlers + SSE
│   ├── worker/
│   │   ├── scheduler.ts              [600] Cron scheduling implementation
│   │   └── worker.ts                  [937] Job execution implementation
│   └── jobs/health-check.ts          [214] Plugin health check job
├── sagas/
│   ├── mod.ts                         [129] Sagas plugin definition
│   ├── contracts/v1/
│   │   └── sagas.contract.ts          [201] Sagas API contract
│   └── services/src/
│       ├── main.ts                    [56]  Sagas API service (:8092)
│       ├── router.ts                  [76]  Router composition
│       └── routers/v1.ts             [644] All sagas API handlers + SSE
├── triggers/
│   ├── mod.ts                                  definePlugin() — trigger plugin
│   ├── contracts.ts                            Contract barrel export
│   ├── deno.json                               Plugin config
│   ├── contracts/v1/
│   │   ├── mod.ts                              v1 contract barrel
│   │   └── triggers.contract.ts                Trigger API contracts
│   ├── database/
│   │   └── triggers.prisma                     Prisma schema for triggers
│   ├── jobs/
│   │   ├── file-import.ts                      File import job handler
│   │   ├── file-relay.ts                       File relay job handler
│   │   └── staged-cleanup.ts                   Staged file cleanup
│   └── services/src/
│       ├── main.ts                             Service entry point
│       ├── router.ts                           Router composition
│       └── routers/
│           ├── health.ts                       Health checks
│           ├── v1.ts                           API handlers
│           └── webhooks.ts                     Webhook ingestion routes
└── streams/
    ├── mod.ts                                  Stream plugin manifest
    └── scaffold.plugin.json                    Plugin scaffold metadata
```

## Workers & Sagas Implementations

```
workers/
├── mod.ts                             [72]  Worker system entry
├── job-worker-entry.ts                [48]  Generated registry import for compiled mode
├── bin/
│   ├── combined.ts                    [47]  Dev: scheduler + worker
│   ├── scheduler.ts                   [2]   Prod: scheduler only
│   └── worker.ts                      [5]   Prod: worker only
├── jobs/
│   ├── orders-daily-export.ts         [218] CSV export job
│   ├── task-orchestration-example.ts  [601] Multi-runtime demo
│   ├── execution-cleanup.ts           [460] KV -> DB archival
│   ├── export-notification-processor.ts [260] Notification processing
│   ├── health-check.ts               [175] System health check
│   ├── process-payment.ts            [183] Payment processing (saga step)
│   ├── reserve-inventory.ts           [180] Inventory reservation (saga step)
│   ├── create-shipment.ts            [205] Shipment creation (saga step)
│   ├── send-welcome-email.ts         [173] Welcome email (saga step)
│   ├── create-user-settings.ts       [172] User settings (saga step)
│   ├── exports-cleanup.ts            [185] File cleanup
│   └── example-job.ts                [93]  Demo job
└── tasks/
    ├── validate-data.ts               [143] Deno validation task
    ├── fetch-data.ts                  [201] Deno API fetch task
    ├── transform-data.py              [197] Python transformation
    ├── aggregate-data.sh              [137] Shell aggregation
    ├── aggregate-data.ps1             [107] PowerShell aggregation
    ├── cleanup-temp.sh                [215] Shell cleanup
    ├── cleanup-temp.ps1               [194] PowerShell cleanup
    ├── generate-report.ps1            [163] PowerShell reporting
    └── system-diagnostics.ps1         [325] PowerShell diagnostics

sagas/
├── mod.ts                             [42]  Saga definition exports
├── types.ts                           [370] All saga message types
├── bin/combined.ts                    [46]  Saga processor entry
├── order-saga.ts                      [249] Order fulfillment workflow
├── user-registration-saga.ts          [188] User onboarding workflow
├── checkout-saga.ts                   [281] Cart checkout workflow
└── product-restock-saga.ts            [222] Inventory restock workflow
```

## Triggers Implementations

```
triggers/
├── mod.ts                                  Trigger exports
├── bin/
│   └── combined.ts                         Trigger processor entry point
├── csv-import.ts                           CSV file import trigger
├── product-import.ts                       Product file import trigger
├── file-watcher-diagnostics.ts             Diagnostic watcher trigger
├── generic-webhook.ts                      Generic webhook trigger
├── export-notify-webhook.ts                Export notification webhook
├── payment-status-webhook.ts               Payment status webhook
├── webhook-validate-data.ts                Webhook data validation
└── runtime/
    ├── current                             Version pointer file
    ├── schema.json                         JSON schema for overrides
    └── triggers/
        └── v1.0.0.json                     Trigger overrides
```

Generated runtime registries are not edited by hand:

```
.netscript/generated/
├── plugin-workers/jobs.registry.ts
├── plugin-sagas/sagas.registry.ts
└── plugin-triggers/triggers.registry.ts
```

## Infrastructure

```
dotnet/
├── AppHost/
│   ├── Program.cs                     [310] Aspire orchestration
│   ├── PrismaCliExtensions.cs         [213] Prisma CLI integration
│   └── MssqlConfigExtensions.cs       [95]  MSSQL-specific config
├── ServiceDefaults/
│   └── Extensions.cs                  [158] WithDenoOpenTelemetry()
└── .generated/
    ├── Services.g.cs                  [278] Service extension methods
    ├── Resources.g.cs                 [1060] Database/cache resource builders
    ├── Plugins.g.cs                   [164] Plugin service builders
    ├── Workers.g.cs                   [193] Worker/scheduler builders
    └── Sagas.g.cs                     [123] Saga processor builders

database/
├── postgres/schema/
│   ├── schema.prisma                  [59]  Main schema (generator + datasource)
│   └── models/
│       ├── users.prisma               [76]  User model
│       ├── products.prisma            [68]  Product model
│       ├── orders.prisma              [114] Order + OrderItem models
│       └── saga-entities.prisma       [310] Saga entity models
├── mysql/schema/
│   ├── schema.prisma                  [52]  MySQL generator + datasource
│   └── models/                        [~720] Same models for MySQL
└── mssql/schema/                      [~480] Same models for SQL Server
```
