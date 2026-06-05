# NetScript Glossary

> Doctrine reference: package/plugin architecture is governed by `docs/architecture/doctrine/` and
> `.llm/harness/debt/arch-debt.md`. This file describes current repo state; doctrine defines the
> target state.

> Definitions of all key terms, concepts, and abbreviations used in the project.

## Core Concepts

### NetScript

The proof-of-concept meta-framework implementing enterprise-grade patterns for Deno applications. A
reference implementation ("test-app") demonstrating all NetScript patterns.

### Contract-First Development

Design philosophy where API contracts (Zod schemas + oRPC routes) are defined before implementation.
Types flow from contracts to services, clients, and frontend automatically.

### Wrap, Don't Reinvent

Core philosophy: leverage existing tools (Aspire, Fedify, Prisma, oRPC, Fresh) rather than building
custom alternatives. Build thin wrappers that add value without vendor lock-in.

### DeferPage Pattern

Cache-first page loading strategy: show cached data immediately, display skeleton fallback if no
cache exists, fetch fresh data from partial endpoint in background, replace content when fresh data
arrives. Implemented in `@netscript/fresh`.

### Service Discovery

Automatic resolution of service URLs via Aspire-injected environment variables. Pattern:
`services__{serviceName}__{protocol}__{index}` (e.g.,
`services__users__http__0=http://localhost:3000`).

---

## Architecture Terms

### Aspire / .NET Aspire

Microsoft's orchestration framework for distributed applications. Manages service lifecycle,
database containers, environment variable injection, and OpenTelemetry telemetry. Accessed via
`deno task dev` (runs `aspire run`).

### AppHost

The .NET Aspire orchestrator project at `dotnet/AppHost/`. Contains `Program.cs` which wires up all
resources, services, and infrastructure.

### Generated Code (.g.cs)

C# extension methods auto-generated from `netscript.config.ts` and `appsettings.json`. Located in
`dotnet/.generated/`. Regenerated via `deno task generate`.

### Workspace Members

Deno workspace globs in root `deno.json` that define independent packages with their own
`deno.json`. Enables shared dependency resolution and import aliasing.

### Route Group

Fresh 2 directory naming convention using `(parentheses)` that applies shared layouts without adding
URL segments. `routes/(dashboard)/` applies `_layout.tsx` to all child routes without `/dashboard`
in URL.

### Partial

Fresh 2 endpoint that renders a fragment of HTML for deferred loading. Located in
`routes/partials/`. Configured with `skipAppWrapper: true` and `skipInheritedLayouts: true`.

### Island

Preact component that hydrates on the client side within Fresh 2's server-rendered pages. Located in
`apps/frontend/islands/`. Only islands have client-side JavaScript.

---

## Type System

### Zod Schema

Runtime type validation library (v4) used as the single source of truth for all data types. Schemas
are defined once and types are inferred via `z.infer<>`.

### oRPC Contract

Type-safe RPC contract definition using `@orpc/contract`. Combines HTTP route info (method, path)
with input/output Zod schemas and error definitions.

### baseContract

Shared oRPC contract base that provides 6 standard error types (NOT_FOUND, VALIDATION_ERROR,
UNAUTHORIZED, FORBIDDEN, RATE_LIMITED, SERVICE_UNAVAILABLE). All versioned contracts extend this.

### Codec

Bi-directional Zod transformation for converting between wire format and application types.
Examples: `stringToInt()` (query param coercion), `decimalToNumber` (Prisma Decimal handling).

### Query Factory

TanStack Query-inspired caching layer from `@netscript/sdk`. Adds `.invalidate()`, `.prefetch()`,
`.getCachedData()`, and stale-while-revalidate behavior to oRPC client methods.

---

## Services

### Microservice

Independent Deno process with its own port, Hono HTTP server, oRPC handlers, and database access.
Three in the project: Users (:3000), Products (:3001), Orders (:3002).

### defineService()

Layer 3 (preset) function from `@netscript/service` that bootstraps a complete service with CORS,
logging, OpenAPI docs, RPC handlers, health checks, and database connectivity verification.

### createService()

Layer 2 (builder) function from `@netscript/service` for custom service configuration with fluent
API (.withCors(), .withLogger(), .withRPC(), etc.).

### Service Client

Type-safe oRPC client created via `createServiceClient()` from `@netscript/sdk`. Automatically
resolves service URL from Aspire environment variables and propagates trace context.

### Cross-Service Call

When one service calls another via oRPC client. Example: Orders service calls Users and Products
services to validate data before creating an order.

---

## Workers

### Job

A scheduled or triggered unit of work defined with `defineJob()` in userland worker modules. The
plugin walker discovers job definitions and emits the workers generated registry.

### Task

A standalone polyglot script (Deno, Python, Shell, PowerShell, .NET) that can be orchestrated by
jobs. Located in `workers/tasks/` or `tasks/`.

### Scheduler

Component that manages cron schedules and enqueues jobs to the message queue when their schedule
fires. Uses `Deno.cron` (via `@netscript/cron`).

### Worker (Background)

Component that consumes job messages from the queue and executes them. Two execution paths: Web
Worker pool (Deno jobs) or subprocess via TaskExecutor (polyglot tasks).

### Combined Mode

Development mode where scheduler and worker run in a single process (`workers/bin/combined.ts`).

### TaskExecutor

Multi-runtime execution engine from `@netscript/plugin-workers-core/executor`. Uses Dax-backed
runtime adapters for Deno, Python, Shell, PowerShell, .NET, cmd, and executable tasks.

### ExecutionState

KV-backed state machine tracking job execution progress. States: pending, queued, running,
completed, failed, timeout, cancelled.

### Topic

Organizational grouping for jobs enabling queue isolation and independent scaling. Examples:
notifications, maintenance, sagas, processing.

### WorkerPool

Web Worker-based parallel execution pool for Deno jobs. Avoids subprocess overhead for
TypeScript/JavaScript jobs.

### Job Handler

Function created with `defineJobHandler(async (ctx) => ...)` from `@netscript/plugin-workers-core`.
It receives payload/progress/logging context and returns `createSuccessResult()` or
`createFailureResult()`.

---

## Sagas

### Saga

A durable, long-running workflow that coordinates multiple steps across services. Survives process
restarts and handles compensation (rollback) on failure.

### Saga Bus

Message router from `@saga-bus/core` that delivers events to saga handlers based on correlation ID
matching. Backed by Redis Streams or Garnet LIST.

### Correlation ID

Unique identifier linking all messages in a saga instance. Example: `orderId` correlates all events
in an order fulfillment saga.

### Saga State

Persistent state object stored in Postgres (or Redis). Updated on each message handled, versioned
for optimistic concurrency.

### Compensation

Rollback logic in saga handlers. When a step fails (e.g., payment fails), the saga publishes
compensating events (e.g., cancel reservation).

### Saga Publisher

Type-safe message publisher created via `createSagaPublisher<TMessages>()`. Used by services to
trigger saga state transitions.

### Saga Job Context

Context created via `createSagaJobContext<TMessages>()` for worker jobs that are part of a saga.
Enables publishing completion/failure events back to the saga bus.

### Transport

Message delivery layer for the saga bus. Options: Redis Streams (production), Garnet LIST-based
(temporary), InMemory (testing).

### Store

State persistence layer for saga instances. Options: Postgres via Prisma (recommended), Redis
(fast), InMemory (testing).

---

## Triggers

### Action Executor

The trigger processor component from `@netscript/plugin-triggers-core` that executes trigger
handlers through the unified event pipeline. It supports worker dispatch through `enqueueJob()` and
keeps sibling plugin actions behind typed ports or returned metadata. File-watch handlers can also
use file lifecycle settings for staging, archive, and quarantine.

### File Trigger

A trigger activated by file system events (create, modify, delete) on watched directories.
Configured with paths, glob patterns, and stability thresholds. Example: watching `./incoming/sales`
for new CSV files.

### Stability Threshold

Configuration for file triggers that polls file size at intervals to confirm a file write is
complete before triggering. Prevents acting on partially-written files (common with network file
shares and large uploads).

### Trigger

An event-driven automation rule that dispatches actions (enqueue job, publish saga message, call
service, run script) in response to external events. Defined with handler-first builders from
`@netscript/plugin-triggers-core/builders`. Initial kinds include webhook, file-watch, scheduled,
and reserved queue, stream, and manual discriminators.

### Trigger Processor

The component from `@netscript/plugin-triggers-core` that processes unified trigger events with
deduplication, retry, DLQ, and circuit-breaker handling. Plugin runtime entry point:
`startTriggerProcessorRuntime()`.

### Watcher

A file system observation primitive from `@netscript/watchers`. Supports three strategies: Native
(Deno.watchFs), Polling (for network drives), and Hybrid (native with polling fallback). Produces a
stream of `WatchEvent` items.

### Webhook Trigger

A trigger activated by inbound HTTP webhook calls. Provides URL-based event ingestion for external
systems.

---

## Plugins

### Plugin

A self-contained extension that contributes database schemas, contracts, services, workers, jobs,
and lifecycle hooks to the application. Defined with the typestate manifest builder:
`definePlugin(name, version).with*().build()`.

### Plugin Registry

The generated runtime output under `.netscript/generated/`. User projects do not edit a central
plugin registry file; they list installed plugins in `netscript.config.ts`, then run
`netscript generate plugins` so the walker emits axis-specific registries.

### Plugin Contributions

What a plugin can provide: database (schemas, migrations), contracts (API definitions), service
(HTTP endpoint), worker (background processor), jobs (scheduled tasks), aspire (environment,
telemetry), hooks (lifecycle).

### Typestate Builder

A fluent API that only exposes valid next steps as a manifest is built. Plugin manifests use
`definePlugin(name, version).with*().build()` so authoring errors are caught at compile time.

### Contribution Axis

One installable surface contributed by a plugin, such as workers jobs, saga definitions, trigger
definitions, contracts, services, database schemas, Aspire resources, or streams.

### Filesystem Walker

The discovery component that scans project plugin roots and userland contribution directories for
manifest files and `defineJob` / `defineSaga` / `defineWebhook` call sites. It feeds generated
registries and CLI inspection commands.

### Registry Emitter

The generator that writes per-axis runtime files under `.netscript/generated/`, such as
`plugin-workers/jobs.registry.ts`, `plugin-sagas/sagas.registry.ts`, and
`plugin-triggers/triggers.registry.ts`.

### Marketplace Stub

The CLI surface for future marketplace workflows. `netscript marketplace search` and
`netscript marketplace publish` currently validate command shape and explain that network-backed
marketplace behavior is not enabled yet.

### Workers Plugin

Plugin at `plugins/workers/` providing the Workers API (:8091) with job management, execution
tracking, and SSE real-time updates.

### Sagas Plugin

Plugin at `plugins/sagas/` providing the Sagas API (:8092) with workflow management, instance
tracking, and SSE updates.

### Triggers Plugin

Plugin at `plugins/triggers/` providing webhook, file-watch, and scheduled trigger APIs and a
trigger processor.

### Streams Plugin

Plugin at `plugins/streams/` providing stream contracts and integration primitives used by the
background plugins.

---

## Frontend

### Fresh 2

Deno's SSR framework with file-based routing, island architecture (selective hydration), and partial
updates. Version 2.2.0.

### Preact

Lightweight React alternative (10.27.2) used for UI components. Compatible with React ecosystem but
3KB.

### Preact Signals

Fine-grained reactive state management. Components only re-render when their specific signal values
change. Used in islands for SSE state.

### f-client-nav

Fresh 2 attribute on `<body>` that enables SPA-style navigation without full page reloads.

### f-partial

Fresh 2 attribute on `<form>` that submits to a partial endpoint and replaces the target region.

### StatsCard

Reusable dashboard component for displaying metric cards with icon, title, value, color, and
optional link.

### Composite Query

Query that aggregates multiple service calls into a single cached result. Example: `dashboardStats`
fetches user, product, and order stats in parallel.

### Fresh UI

`@netscript/fresh-ui` package providing interactive UI primitives and a copy-source component
registry for Fresh applications. Uses a two-model architecture: interactive primitives
(package-owned, updated with package) and registry components (copy-source, owned by the application
after copying).

### Interactive Primitive

A package-owned accessible UI component from `@netscript/fresh-ui/interactive` that centralizes
keyboard interaction, focus management, and ARIA attributes. Updated with the package. Examples:
Accordion, Dialog, Drawer, Popover, Tabs, Tooltip.

### Cache Invalidation

Process of clearing cached query results after mutations. `invalidateUsers(true)` clears cache and
eagerly refetches.

### Page Builder

The `definePage()` composable builder from `@netscript/fresh/builders`. Provides type-safe page
construction with resources, layers, handlers, layouts, meta, and slots. Carries compile-time type
information through the builder chain.

### Registry Component

A UI component from `@netscript/fresh-ui` that is copied into the application and then owned by the
developer. Located under `registry/components/ui/` in the package. After copying, package updates do
not affect the component. Examples: Button, DataTable, Card, FilterForm, StatsGrid.

---

## Infrastructure

### Garnet

Microsoft's Redis-compatible cache server. Used for KV store, message queue, and saga transport.
Connected at port 6379.

### Deno KV

Deno's built-in key-value store. Used for caching, execution state, and as a queue backend. Can be
local (file) or remote (KV Connect/HTTP).

### KV Connect

Protocol for connecting to remote Deno KV instances. When detected, queue falls back to polling
adapter instead of native queue.

### Servy

Windows Service manager used for production deployment. Aspire-compiled executables are registered
as Windows services via XML configuration.

### OTLP

OpenTelemetry Protocol. Uses HTTP/protobuf format on port 4318 to send traces, metrics, and logs to
Aspire Dashboard.

### Trace Context (W3C)

Standard for distributed tracing propagation. `traceparent` and `tracestate` headers pass trace
identity across service boundaries, queues, and subprocesses.

---

## Database

### Prisma

TypeScript ORM (v7) with schema-first design. Generates type-safe client and Zod schemas from
`.prisma` files.

### Driver Adapter

Prisma v7 pattern using native database drivers (pg, mysql2) instead of Prisma's built-in
connections. Enables better connection pooling and compatibility.

### Prisma Studio

GUI for database inspection and manipulation. Runs on port 5555 via `deno task prisma:studio`.

### Generated Zod Schemas

Zod schemas auto-generated from Prisma schema by `prisma-zod-generator`. Located at
`database/postgres/schema/.generated/zod/`. Imported as `@database/zod`.

---

## Configuration

### netscript.config.ts

Main application configuration file. Defines services, databases, deployment settings, and installed
plugin references. Installed plugins are listed in the `plugins` array; generated runtime registries
live under `.netscript/generated/`. `@netscript/config` validates core sections and preserves
plugin-owned top-level sections; worker schema validation lives in
`@netscript/plugin-workers-core/config`.

### appsettings.json

.NET Aspire configuration file at `dotnet/AppHost/`. Defines connection strings, database engines,
service ports, plugin settings, and worker binaries.

### defineConfig()

Type-safe configuration definition function from `@netscript/config`. Returns validated
configuration object.

### Runtime Config

Hot-reloadable configuration overrides loaded by `@netscript/runtime-config`. Allows operators to
disable jobs, change cron schedules, toggle feature flags, and modify trigger paths without
restarting services. Watched via `Deno.watchFs()` with debounced reload.

---

## CLI & Tasks

### deno task dev

Start the full application via Aspire. Orchestrates all services, databases, workers, and frontend.

### deno task generate

Regenerate types, clients, OpenAPI specs, and Aspire C# extension methods from configuration.

### deno task check

Type-check all TypeScript files across the workspace.

### aspire run

.NET CLI command that starts the Aspire orchestrator. `deno task dev` is a wrapper.

---

## Abbreviations

| Abbreviation | Meaning                                 |
| ------------ | --------------------------------------- |
| CRUD         | Create, Read, Update, Delete            |
| DAG          | Directed Acyclic Graph (workflow steps) |
| HMR          | Hot Module Replacement                  |
| KV           | Key-Value (store)                       |
| OTEL         | OpenTelemetry                           |
| OTLP         | OpenTelemetry Protocol                  |
| PEL          | Pending Entry List (Redis Streams)      |
| RPC          | Remote Procedure Call                   |
| SPA          | Single Page Application                 |
| SSE          | Server-Sent Events                      |
| SSR          | Server-Side Rendering                   |
| VFS          | Virtual File System (compiled binaries) |
