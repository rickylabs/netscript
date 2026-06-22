# NetScript Feature Landscape Research

An exhaustive architectural inventory of the NetScript ecosystem capabilities, built-in packages, first-party plugins, and freshly scaffolded project structures.

## Core Package Namespace (`@netscript/*`)

NetScript is composed of a coordinated family of Deno/JSR packages. Each package behaves as a carefully designed contract where the public types *are* the documentation and public borders are strictly checked.

### 1. `@netscript/service`
* **Purpose:** Fluent, modular layers for bootstrapping services, health checking, error boundary handling, and oRPC + Hono runtime wiring.
* **Architecture Layers:**
  * **Layer 1 (Primitives):** Individual, mountable hand-tuned response handlers for standard errors, CORS, OpenAPI Spec JSON generation (`createOpenAPISpec`), online/offline Scalar API Docs (`createScalarDocs`, `createScalarJs`), standard types, liveness/readiness health probes (`createHealthHandler`, `createLivenessHandler`, `createReadinessHandler`, and out-of-the-box `healthChecks` for databases, Deno KV, and custom checks).
  * **Layer 2 (Fluent Builder):** `createService(router, config)` returns a `ServiceBuilder` fluent interface with custom handlers (`withCors`, `withLogger`, `withDatabase`, `withOpenAPI`, `withDocs`, `withRPC`, `withContext`, `onStartup`). It generates a non-listening `ServiceApp` via `.build()` or starts a standard web listener via `.serve()`.
  * **Layer 3 (Convenience Preset):** `defineService(router, options)` is a one-liner configuration that wraps the standard layer-2 builder with sensible defaults for quick, boilerplate-free service startup.

### 2. `@netscript/contracts`
* **Purpose:** Anchors the root oRPC-based API vocabularies and serialization standards across sibling package and application borders.
* **Core APIs & Schemas:**
  * `baseContract`: The root route-builder primitive embedded with standard JSON-stable errors.
  * Zod Schema Helpers: `boundedString()`, `positiveInt()`, `nonNegativeInt()`, `positiveNumber()`, `nonNegativeNumber()`, `paginationLimit()`, and `paginationOffset()`. These handle automated type-coercion (e.g. URI string parameters into typed values).
  * Out-of-the-box pagination schemas: `OffsetPaginationQuerySchema`/`OffsetPaginationMetaSchema` for limit/offset layouts, and `CursorPaginationQuerySchema`/`CursorPaginationMetaSchema` for cursor-based streaming.
  * Standard Error Envelopes: Predefined schemas for `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError` (field-level support), `RateLimitError`, and `ServiceUnavailableError`.

### 3. `@netscript/sdk`
* **Purpose:** The central server-and-client gateway that orchestrates service clients, server-side caching, and browser/island UI hydration from unified contract definitions.
* **Key Components & Subpaths:**
  * **Root Composition:** `defineServices(configMap)` integrates clients, server query-factories, and TanStack query utilities into a unified instance.
  * **`@netscript/sdk/client`:** Emits `createServiceClient()` to build type-safe RPC clients that carry end-to-end trace headers. Exposes the `safe()` wrapper to resolve promises error-first.
  * **`@netscript/sdk/query`:** Exposes server-side query cache managers (`createQueryFactory()`, `createCompositeQuery()`).
  * **`@netscript/sdk/query-client`:** Emits `createNetScriptQueryClient()` tailored with server-hydration-aware defaults (`staleTime: 30s`, `gcTime: 5 min`).
  * **`@netscript/sdk/cache`:** Exposes KV-backed persistence stores and wraps cache logic.
  * **`@netscript/sdk/discovery`:** Extracts environment endpoints from .NET Aspire orchestration, binding databases (PostgreSQL/MySQL/SQL Server connection strings) and service hostnames.

### 4. `@netscript/kv`
* **Purpose:** Provider-agnostic reactive Key-Value store wrapping native Deno KV, Redis, or Nitro.
* **Key Offerings:**
  * Watched reactive sequences (`watch([keys])`, `watchPrefix([prefix])`) that allow streaming key mutations instantly. Perfect for real-time SSE.
  * `MemoryKvAdapter` for zero-setup unit testing.
  * Integrated atomic transaction blocks (`atomic(...)` compare-and-swap pipelines).

### 5. `@netscript/queue`
* **Purpose:** Standardized message queue facade backing Redis, RabbitMQ, and Deno KV.
* **Key Offerings:**
  * Concurrency parallelism: `createParallelQueue` uses Fedify's concurrent execution buffers to run I/O-bound tasks in parallel on a single listener.
  * Type-safe ingestion: `createTypedQueue` wraps queues in Zod validation schemes, handling dead-letter queueing (`dlq`), message degradation, or explicit retry boundaries.
  * Inherent delay scheduling: `enqueue(msg, { delay: ms })` for deferred task distribution.

### 6. `@netscript/cron`
* **Purpose:** Scheduling engine resolving to Deno native crons, standard cron runners, or in-memory ticking clocks.
* **Key Offerings:**
  * Standardize cron-pattern grammar with extensive `CronPresets` (like hourly, daily, weekdays, etc.).
  * Life-cycle event triggers (`jobRun`, `jobError`) and automated timezone interpretation.

### 7. `@netscript/telemetry`
* **Purpose:** First-class OpenTelemetry tracing fabric, structured logger layers, and parent-child span propagation.
* **Key Offerings:**
  * Shared `InstrumentationRegistry` for multi-stage setup/teardown traces during process execution.
  * Traced helpers: `runTracedJob`, `initJobTracing` for subprocess worker coordination.

---

## First-Party Plugins (`plugins/*` & `@netscript/plugin-*-core`)

NetScript's ecosystem expands smoothly through customizable plugins. Let's document what we found about these plugins:

### 1. Background Jobs (`@netscript/plugin-workers-core` / `plugins/workers`)
* **What it offers:** Distributed, multi-process task worker orchestration.
* **Key APIs:**
  * `defineJob(id)`: Fluent typestate job builders for scheduling periodic routines via `cron()` triggers, binding system permissions, and setting timeouts.
  * `defineTask(id)`: Subprocess launchers configured with fine-grained operating system sandbox constraints (such as restricted network/filesystem hooks).
  * `defineWorkflow(id)`: Chained execution steps combining multiple jobs, tasks, and timed sleep events.

### 2. Durable Workflows (`@netscript/plugin-sagas-core` / `plugins/sagas`)
* **What it offers:** Resilient state machines for executing long-running transactional flows (Sagas) with correlation keys, crash survival, and automated compensations.
* **Key APIs:**
  * `defineSaga(id)`: DSL defining durability tiers (`t1`/`t2`/`t3`), state schemas, message correlation rules, and signal patterns.
  * `on(eventType, handler)` & `compensate(eventType, handler)`: Implements saga-based checkpoint steps. If a transaction falls over midway, the runtime walks backwards executing compensatory procedures.
  * Pure Ledger Actions: Handlers emit pure cascaded instructions (`send`, `spawn` child sagas, `schedule` delays, `compensate`) to keep transitions easily testable and isolated from network side-effects.

### 3. Event Triggers (`@netscript/plugin-triggers-core` / `plugins/triggers`)
* **What it offers:** Highly resilient event-driven ingress hooks that capture webhooks, message queues, and crons.
* **Key APIs:**
  * `defineWebhook`: Registers specialized HTTP URL paths with cryptographic signature verification options (`hmac-sha256`), deduplication strategies, and DLQ rules.

### 4. Durable Streams (`@netscript/plugin-streams-core` / `plugins/streams`)
* **What it offers:** Real-time entity-state streaming backing the State Protocol.
* **Key APIs:**
  * `defineStreamSchema`: Models tabular entity mutations (upserts/deletes) with standard Zod validators, perfect for syncing state continuously over lightweight SSE.
  * `DurableStreamProducer`: Client handles publishing entity streams to the streams runtime hub.

---

## Scaffolded Project Architecture

When a developer runs `netscript init`, the CLI generates a workspace with a clean directory-based separation of concerns:

```
workspace-root/
├── deno.json                   # Root workspace index mapping member folders and version catalog
├── apps/
│   └── web/                    # Fresh 2 application (islands, copy-source fresh-ui components)
├── services/
│   └── [service-name]/         # Individual services defined with oRPC contracts + Hono loaders
├── contracts/
│   └── v1/                     # API schema contracts and shared types
├── plugins/
│   ├── workers/                # Conventional worker jobs, tasks, and workflow pipelines
│   ├── sagas/                  # Durable state machines, correlation rules, and signals
│   ├── triggers/               # Event ingestion handlers (e.g. Crypto-verified webhooks)
│   └── streams/                # Real-time state-protocol stream schemas and publishers
├── database/
│   └── [db-engine]/            # Prisma configuration, schema, migrations, and typed adapters
└── aspire/                     # .NET Aspire AppHost orchestration and TS helper generation
```

This structure organizes every architectural requirement cleanly into specialized zones. By separating service declarations (services), type safety boundaries (contracts), background execution (plugins/\*), and database layers, NetScript creates a robust, standardized, and easily observable backend environment.
