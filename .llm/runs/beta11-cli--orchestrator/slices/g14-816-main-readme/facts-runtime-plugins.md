# Facts — Runtime/Services Model & Plugins Ecosystem (Lane 3, #816)

Author: Lane-3 fact-sheet agent (Claude · Opus 4.8). Read-only against `wt-g14-816` @ `0b04eb2b`
(current main). VERIFIED CLAIMS ONLY — every claim carries a source citation. The Lane-4 writer uses
only this sheet; no claim survives without a citation. Citations are `path:line` in this worktree, or
a named README section (READMEs were freshly reworked under #815 and are the authoritative surface).

---

## Domain 1 — Runtime / Services Model

### What it IS
NetScript's service runtime turns an oRPC router into a running Hono service — health probes,
OpenAPI, Scalar docs, request tracing, and graceful shutdown — in one call
(`packages/service/README.md:7-8`). It is **contract-first**: one oRPC contract is implemented by
services and consumed by generated typed SDK clients, both staying in sync because they share one
definition (`packages/contracts/README.md:12-16`). Where a service lives is resolved at call time
through Aspire service discovery from orchestrator-injected env vars, so the same client code runs
against local processes, containers, and deployed endpoints with no registry or config file
(`packages/sdk/README.md:17-19`, `:28-29`).

### Flagship capabilities
- **One-call service preset.** `defineService(router, options)` wires CORS, logging, OpenAPI JSON,
  Scalar docs, RPC, service info, and health, starts the listener, and returns a `RunningService`
  handle with `addr` and an idempotent `stop()` (`packages/service/README.md:22-24`).
- **Fluent builder alternative.** `createService(router, config)` composes the same stages step by
  step, then `serve()` starts a listener or `build()` returns a mountable app
  (`packages/service/README.md:25-26`; symbol verified at
  `packages/service/src/builder/service-builder.ts:189`).
- **Three health probes.** `withHealth()` adds `/health`, `/health/live`, and `/health/ready`, with
  `healthChecks.database`, `.kv`, `.service`, and `.custom` for common dependencies
  (`packages/service/README.md:27-28`; endpoints verified at
  `packages/service/src/builder/service-builder-impl.ts:370-371`,
  `packages/service/src/primitives/health.ts:244,256`).
- **Graceful lifecycle.** `onShutdown()` registers LIFO teardown hooks; `serve()` drains in-flight
  requests, installs `SIGINT`/`SIGTERM` handlers, and accepts an external `AbortSignal`
  (`packages/service/README.md:29-30`).
- **Tracing on every request, no per-service wiring.** The builder registers tracing middleware as
  the outermost layer on every service; each request gets a server span with W3C propagation and the
  service name recorded (`packages/service/README.md:31-33`).
- **Opt-in auth as a subpath.** `./auth` ships authn/authz ports plus static-credential,
  trusted-header, and scope-authorizer factories, kept off the import graph until used
  (`packages/service/README.md:34-35`).
- **Contract vocabulary.** `baseContract` carries NetScript's common oRPC error map — `NOT_FOUND`,
  `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `RATE_LIMITED`, `SERVICE_UNAVAILABLE` — so every
  procedure starts from one shared error vocabulary; CRUD builders (`./crud`), query helpers
  (`./query`, `buildPrismaWhere`), and transformers (`./transform`) emit whole contracts from one
  entity schema (`packages/contracts/README.md:20-22`, `:28-33`).
- **Typed client pipeline.** `defineServices` over a contract map yields typed oRPC clients,
  KV-cached server-side query factories, and browser-side TanStack Query utils — all sharing input/
  output types from the contract (`packages/sdk/README.md:23-33`).
- **Telemetry wiring — connected traces.** `@netscript/telemetry` links scheduler, queue, worker,
  RPC, and SSE spans into one distributed trace via explicit ports/adapters, with W3C propagation
  (including across `Deno.Command` job subprocesses), fan-in span links, and a telemetry query read
  model (`packages/telemetry/README.md:7-9`, `:21-37`). Default provider binds Deno's built-in OTLP
  exporter with **zero OpenTelemetry SDK dependency** (`packages/telemetry/README.md:53-55`,
  `:160-163`).

### Honest maturity line (what's beta/rough)
Pre-release line: bare `jsr:@netscript/*` specifiers do not resolve — every install must pin
`<version>` to the installed CLI (`packages/service/README.md:54-55`, repeated across all package
READMEs). The whole workspace targets Deno 2.x/2.9+ and leans on `Deno.*`/Deno KV APIs
(`packages/service/README.md:163-165`); attribute-preserving span links require opting into the
SDK-backed telemetry provider rather than the default (`packages/telemetry/README.md:163-164`). Repo
version line is `0.0.1-beta.x` (run context; milestone 13 / beta-11).

### Quotable numbers (verified by counting/reading)
- **3 health endpoints** exposed by `withHealth()`: `/health`, `/health/live`, `/health/ready`
  (`packages/service/README.md:27`; verified in source, health.ts:244,256).
- **6 shared oRPC error codes** in `baseContract`'s error map (`packages/contracts/README.md:20-22`).
- **Zero OpenTelemetry SDK dependencies** for default tracing — Deno's built-in OTLP exporter
  (`packages/telemetry/README.md:54-55`).
- `@netscript/telemetry` exposes **13 public subpath entries** (`.`, `./tracer`, `./config`,
  `./context`, `./attributes`, `./instrumentation`, `./registry`, `./orpc`, `./hono`, `./ai`,
  `./otel`, `./query`, `./testing`) (`packages/telemetry/README.md:124-138`).

---

## Domain 2 — Plugins Ecosystem

### What it IS
A NetScript plugin is at its core a **manifest**: plain, validated data declaring what the plugin
contributes to an app — services, background processors, stream topics, DB schema/migrations,
runtime-config topics, and telemetry as typed contribution axes
(`packages/plugin/README.md:12-14`, `:24-26`). `definePlugin(name, version)` gives authors a
chainable, type-narrowing builder whose `.build()` yields a schema-validated `PluginManifest`; hosts
inspect manifests without executing them (`inspectPlugin`/`verifyPlugin`), so the CLI scaffolds from
them and Aspire wiring is generated from them — all without running plugin code
(`packages/plugin/README.md:22-34`, `:18-20`). Each first-party plugin binds reusable builders from a
matching `*-core` package to a NetScript host (e.g. `packages/plugin-workers-core`,
`plugins/workers/README.md:16-20`).

### Flagship capabilities
- **One install, whole capability.** Each plugin ships as one declarative manifest;
  `netscript plugin install <kind>` scaffolds the workspace, registers the API service, provisions
  storage, and adds resources to the Aspire AppHost so everything starts with the app
  (`plugins/workers/README.md:11-14`, mirrored in every plugin README).
- **workers** — durable jobs, **multi-runtime tasks (Deno · PowerShell · Python · shell)** with
  at-least-once delivery keyed on `idempotencyKey`, workflows, a Workers API on port **8091**, and a
  full job-lifecycle CLI (`add-job`, `run`, `list-jobs`, `executions`, `logs`, `trigger`,
  `enable`/`disable`, `compile-registry`) (`plugins/workers/README.md:25-32`).
- **sagas** — durable multi-step workflows with **compensation**; saga state persisted so a crash
  mid-flow resumes instead of stranding half-applied effects; Saga API on port **8092**; store backend
  selectable `--saga-store-backend kv|prisma`; `inspect` degrades to a local source scan when the API
  is down (`plugins/sagas/README.md:24-32`, `:59-61`).
- **triggers** — webhook, scheduled, and file-watch triggers through one processor with
  **ack-then-process ingress** (verify + persist before the `202`), idempotency, retry, and
  dead-lettering; default fan-out concurrency **10** (`TRIGGER_CONCURRENCY`); Triggers API on port
  **8093** (`plugins/triggers/README.md:28-38`).
- **streams** — durable, replayable topics with **no database required** (no Postgres, no KV, no
  external broker); typed `defineStreamTopic`/`defineStreamProducer`/`defineStreamConsumer`; the
  common pipe other plugins publish to (`plugins/streams/README.md:8`, `:23-34`, `:56-57`).
- **auth** — one `auth-api` service (port **8094**, exposing `signin`, `callback`, `signout`,
  `session`, `me` over a v1 contract) with **swappable backends** selected via
  `NETSCRIPT_AUTH_BACKEND`: `kv-oauth`, `workos`, or `better-auth`; unsupported ops return typed
  auth-provider errors at the API boundary; ships the auth Prisma schema + durable session streams
  (`plugins/auth/README.md:24-36`).
- **ai** — install scaffolds an **app-owned, in-process** chat/tool/agent surface under `ai/` (7 typed
  files: composition root, model registry, streaming chat route, chat island, tool + agent stubs, MCP
  registry); the agent loop runs inside the app's own server process with **no AI gateway/extra network
  hop**; MCP is client-side only (the plugin scaffolds no MCP server); streaming supports cancellation
  via request `AbortSignal` + `stop()` (`plugins/ai/README.md:7-8`, `:24-36`, `:77-85`).
- **Runtime backends / durability.** Streams topics survive restarts and support replay
  (`plugins/streams/README.md:27-29`); worker `./streams`, saga `./streams`, trigger `./streams`, and
  auth `./streams` publish domain entities to durable stream topics
  (`plugins/workers/README.md:34-35`; `plugins/sagas/README.md:35-36`;
  `plugins/triggers/README.md:121`; `plugins/auth/README.md:33-34`).
- **Aspire-native wiring.** Every plugin contributes its resources to the AppHost via an `./aspire`
  subpath; installs report "Regenerated 12 Aspire helper files"
  (`plugins/workers/README.md:36-37`, `:86`).

### Honest maturity line (what's beta/rough)
Plugin runtimes/CLIs/API services require **Deno 2.9+** and use `Deno.*` + Deno KV APIs; only the
manifests/contracts are plain data importable anywhere TypeScript runs
(`plugins/workers/README.md:138-142`; same note across plugins). Multi-runtime tasks require the
target interpreter (PowerShell/Python/POSIX shell) present on the machine
(`plugins/workers/README.md:140-142`). Plugin identity `0.0.1-alpha.0` appears in the plugin authoring
example (`packages/plugin/README.md:60`); pre-release version-pinning caveat applies to all plugin
installs. The streams library `defineStream*` handles are **wiring stubs** — runtime IO throws
`StreamUnsupportedOperationError` until `@netscript/plugin-streams-core` is bound
(`plugins/streams/README.md:100-103`). NOTE for writer: the AI install output prints "on port 8095"
(`plugins/ai/README.md:74`) but the AI surface is explicitly **in-process with no gateway service** —
do not describe AI as an 8095 API service; the other five ports (8091-8094, 4437) back real services.

### Quotable numbers (verified by counting)
- **6 first-party plugins**: workers, sagas, triggers, streams, auth, ai (`ls plugins/` → 6 dirs).
- **30 workspace packages** under `packages/`, including **6 `plugin-*-core` packages** that back the
  six plugins (`ls -d packages/*/` → 30; `ls -d packages/plugin-*-core` → 6).
- **4 task runtimes** for workers: Deno, PowerShell, Python, shell (`plugins/workers/README.md:26`).
- **Service ports**: workers 8091, sagas 8092, triggers 8093, auth 8094, streams 4437 (verified in
  each plugin's install-output and API-service README lines: workers `:85`, sagas `:85`,
  triggers `:85`, auth `:78`, streams `:81`).
