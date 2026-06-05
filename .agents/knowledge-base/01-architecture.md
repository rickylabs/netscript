# NetScript - Architecture Overview

> Doctrine reference: package/plugin architecture is governed by `docs/architecture/doctrine/` and
> `.llm/harness/debt/arch-debt.md`. This file describes current repo state; doctrine defines the
> target state.

> Single source of truth for understanding NetScript, a proof-of-concept meta-framework
> demonstrating enterprise-grade patterns for Deno applications.

## What NetScript Is

NetScript is a **config-driven, contract-first meta-framework** for building distributed Deno
applications with .NET Aspire orchestration. Think "Laravel for Deno" - opinionated scaffolding with
zero vendor lock-in.

**Core philosophy: "Wrap, Don't Reinvent"** - Leverage Aspire's orchestration, Fedify's message
queues, Prisma's ORM, oRPC's type-safe RPC, and Fresh 2's SSR - don't compete with them.

## System Architecture

```
                          .NET Aspire (Orchestrator)
                                |
        ┌───────────────────────┼───────────────────────┐
        |                       |                       |
 Infrastructure          Services Layer          Application Layer
        |                       |                       |
┌───────┴───────┐      ┌───────┴───────┐        ┌──────┴──────┐
│ MySQL (Primary)│      │ Users   :3000 │        │  Frontend   │
│ Postgres (KV)  │      │ Products:3001 │        │  (Fresh 2)  │
│ Garnet (Cache) │      │ Orders  :3002 │        │  :8000      │
│ OTEL  (:4318)  │      └───────┬───────┘        └──────┬──────┘
└───────┬───────┘               |                       |
        |               ┌───────┴───────┐               |
        |               │ Plugin Layer  │               |
        |               │ Workers :8091 │               |
        |               │ Sagas   :8092 │               |
        |               └───────┬───────┘               |
        |                       |                       |
        └───────────────────────┼───────────────────────┘
                                |
                       Background Layer
                    ┌───────────────┴───────────────┐
                    │ Scheduler (Deno.cron)          │
                    │ Worker (Job Executor)          │
                    │ Saga Processor                 │
                    │ Trigger Processor              │
                    └───────────────────────────────┘
```

## The Five Architectural Layers

### 1. Configuration Layer

- **`netscript.config.ts`** - Single source of truth for services, workers, sagas, tasks, databases
- **`appsettings.json`** - .NET Aspire configuration (merged with netscript.config.ts)
- **Generated C# code** - `dotnet/.generated/*.g.cs` extension methods auto-generated from config
- **Deno workspace** - `deno.json` with 12 workspace member globs
- **Runtime overrides** - `@netscript/runtime-config` enables hot-reloadable configuration changes
  without restarts (job schedules, feature flags, trigger paths)

### 2. Contracts Layer

- **Contract-first development** - Zod schemas define the API surface
- **Type flow**: `Zod Schema -> oRPC Contract -> Service Handler -> Client -> Frontend`
- **Versioned**: `contracts/versions/v1/` with `API_VERSIONS` metadata
- **Shared base**: `baseContract` provides 6 standard error types (NOT_FOUND, VALIDATION_ERROR,
  UNAUTHORIZED, FORBIDDEN, RATE_LIMITED, SERVICE_UNAVAILABLE)
- **Plugin contracts**: Workers and Sagas plugins contribute their own contracts

### 3. Services Layer

- **3 microservices**: Users (:3000), Products (:3001), Orders (:3002)
- **Identical structure**: `defineService()` -> Hono + oRPC + OpenAPI + Scalar docs
- **Service discovery**: Aspire-injected environment variables (`services__users__http__0`)
- **Cross-service calls**: Orders service calls Users and Products for validation
- **Database access**: Prisma ORM with MySQL (primary) via `@database`

### 4. Plugin Layer

- **Workers Plugin** (:8091) - Job management API + SSE real-time updates
- **Sagas Plugin** (:8092) - Workflow management API + SSE updates
- **Plugin system**: `definePlugin()` with database/contract/service/worker/job contributions
- **Lifecycle hooks**: setup, beforeGenerate, afterGenerate, teardown

### 5. Background Layer

- **Scheduler**: Deno.cron -> Message queue -> Job execution
- **Worker**: Consumes queue messages, executes Deno/Python/Shell/PowerShell tasks
- **Saga Processor**: Processes saga messages, triggers worker jobs, manages durable state
- **Trigger Processor**: Watches file system events and webhook calls, dispatches actions (enqueue
  jobs, publish saga messages, call services)
- **Combined mode** (dev): Single process runs scheduler + worker
- **Separated mode** (prod): Independent scheduler and scalable workers

## Data Flow Patterns

### Request Flow (API Call)

```
Browser -> Frontend (Fresh 2 SSR) -> Service Client (oRPC) -> Service (Hono + oRPC) -> Database (Prisma)
```

### Cache-First Flow (DeferPage Pattern)

```
1. Browser requests page
2. Frontend checks KV cache for data
3. If cached: render immediately with cached data + schedule background revalidation
4. If not cached: show skeleton fallback
5. Partial endpoint fetches fresh data from service
6. Fresh data replaces skeleton/stale content
```

### Job Execution Flow

```
Deno.cron trigger -> Scheduler -> Queue (KV/Redis) -> Worker -> TaskExecutor -> Subprocess
                                                                    |
                                                            ExecutionState (KV)
                                                                    |
                                                            SSE -> Frontend
```

### Saga Workflow Flow

```
Service Event -> Saga Bus (Redis/Garnet) -> Saga Processor -> Handler
                                                                  |
                                                          triggerJob() -> Workers API -> Worker
                                                                  |
                                                          Job Complete Event -> Saga Bus -> Next Step
```

### Trigger Execution Flow

```
File Event -> Watcher -> Trigger Processor -> Action Executor -> Queue/Job/Saga/Service
                                                   |
                                           Event Store (KV)
                                                   |
                                           SSE -> Frontend
```

## Key Technology Stack

| Layer         | Technology                                                   | Purpose                                                   |
| ------------- | ------------------------------------------------------------ | --------------------------------------------------------- |
| Runtime       | Deno 2.x                                                     | TypeScript runtime with native OTEL                       |
| Orchestration | .NET Aspire                                                  | Service discovery, telemetry, containers                  |
| Frontend      | Fresh 2 + Preact + Vite                                      | SSR with islands architecture                             |
| Styling       | Tailwind CSS 4                                               | Utility-first CSS                                         |
| RPC           | oRPC                                                         | Type-safe RPC + OpenAPI generation                        |
| Validation    | Zod 4                                                        | Schema validation + type inference                        |
| Database      | Prisma 7                                                     | ORM with driver adapters                                  |
| Web Framework | Hono                                                         | Lightweight HTTP framework                                |
| KV Store      | Deno KV / Garnet                                             | State, cache, queue backend                               |
| Queue         | Fedify adapters                                              | Message queue abstraction                                 |
| Cron          | Deno.cron                                                    | Native cron scheduling                                    |
| Telemetry     | OpenTelemetry                                                | Distributed tracing via OTLP HTTP                         |
| Sagas         | @saga-bus/core                                               | Durable workflow orchestration                            |
| File Watching | @netscript/watchers                                          | File system event detection with stability checks         |
| Triggers      | @netscript/plugin-triggers-core + @netscript/plugin-triggers | Event-driven action dispatch (file + webhook + schedules) |
| Desktop       | Taurify (Tauri)                                              | Desktop app packaging                                     |

## Configuration-Driven Architecture

Everything flows from configuration:

```
netscript.config.ts          appsettings.json
        |                           |
        └─────────┬─────────────────┘
                  |
          Code Generation
                  |
        ┌─────────┴─────────┐
        |                   |
  Services.g.cs      Workers.g.cs
  Resources.g.cs     Sagas.g.cs
  Plugins.g.cs
        |
  Aspire Orchestration
        |
  Running Application
```

## Deployment Modes

### Development

- `deno task dev` -> Aspire orchestrates all services, databases, workers
- Watch mode with HMR for frontend and services
- Combined scheduler + worker in single process
- Garnet (Redis protocol) for KV/queue/cache

### Production (Windows Services)

- `deno task deploy:build` -> Compiles each service to standalone executable
- Servy (Windows Service manager) manages service lifecycle
- Separated scheduler (1 instance) + workers (N instances)
- External MySQL, Garnet for queue/cache
- PowerShell scripts for install/start/stop/status

### Compiled Binary Mode

- `deno compile` produces standalone executables
- Static job registry (no dynamic imports)
- VFS path resolution for embedded assets
- `NETSCRIPT_PROJECT_ROOT` environment variable signals compiled mode
