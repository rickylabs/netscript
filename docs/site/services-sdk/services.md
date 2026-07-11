---
layout: layouts/base.vto
title: Services & contracts
templateEngine: [vento, md]
prev: { label: "Capabilities", href: "/capabilities/" }
next: { label: "Background jobs", href: "/background-processing/workers/" }
---

# Services & contracts

**Write the contract once; the handler, the typed client, and the OpenAPI surface are all derived
from it — so an agent (or a teammate) never spends a turn keeping them in sync.**

A NetScript **service** is a typed HTTP runtime that *implements* an
[`@orpc/contract`](/explanation/contracts/) definition. You author the contract once
(route + zod input/output), `implement()` it, bind `.handler()`s, and serve the resulting
router on a Hono + oRPC runtime. The contract object is the single source of truth: the
same object a typed client imports is the one the server implements, so caller and server
**cannot drift**. The example `users` service answers on port **3001** with both an
OpenAPI surface (`/api/v1/users/*`) and a typed oRPC endpoint (`/api/rpc/*`).

{{ comp.diagram({
  src: "/assets/diagrams/request-lifecycle.svg",
  alt: "A browser request flows into the service router, through middleware to the matched contract handler, optionally to the database, and back as a typed response.",
  caption: "Request lifecycle: browser → service router → middleware → contract handler → database → typed response."
}) }}

{{ comp callout { type: "tip", title: "Use this when" } }}
Reach for a service when you need a <strong>synchronous, request/response API</strong> with
a versioned, type-locked contract shared between front end and back end — a CRUD surface,
an internal RPC boundary, or a public REST/OpenAPI endpoint. For <em>fire-and-forget</em>
work use a <a href="/background-processing/workers/">background job</a>; for
<em>message-driven, long-running</em> orchestration use a
<a href="/durable-workflows/sagas/">durable saga</a>; for <em>inbound HTTP that kicks
off work</em> use a <a href="/durable-workflows/triggers/">trigger</a>; for
<em>signed-in identity and sessions</em> compose the
<a href="/identity-access/auth/">auth plugin</a>.
{{ /comp }}

## Why contract-first: the drift you never debug

Every hand-synced API dies the same way. A field gets renamed on the server; the client wrapper,
the API docs, and the front-end types each get updated in separate steps — and one of them gets
missed. The bug ships silently and surfaces later as a runtime `undefined`, and the fix costs a
round of archaeology to find which of the three copies drifted.

A NetScript service removes the copies. The contract — plain `@orpc/contract` routes with zod
input/output schemas, versioned in its own package — is the only declaration of the wire shape.
The handler binds to it via `implement()`, the client imports it, and the OpenAPI spec is
generated from it. Rename a field and the build fails in the handler *and* the caller before
anything ships. In eis-chat, the production app NetScript is dogfooded against, this is how the
whole API surface works: `implement(ChannelContractV1)` on the service side, a typed dashboard
client built off the same contract type on the other — a new contract route is automatically
typed on the client, with no "keep the API docs in sync" step in between.

The same property is why contract-first services suit AI-agent codebases. Encore's
[NestJS-alternatives article](https://encore.dev/articles/nestjs-alternatives) names the failure
mode: TypeScript's backend ecosystem has many valid ways to structure validation, data access,
and project layout, so coding agents pick a different combination on every prompt. Encore's
answer is to fix the conventions in application code; NetScript locks the convention at the
**contract layer** — one way to declare a route (contract + zod schemas + `implement()`), and
everything downstream derived from it. An agent working in the codebase reads one declared shape
and follows it, instead of inventing a new client wrapper per session.

## What it is

A service is the **Layer 3 preset** (`defineService`) over a three-layer package. Layer 1 is
small primitives — health, error, RPC, OpenAPI, and Scalar docs handlers you can mount in any
Hono app. Layer 2 is `createService()`, a fluent builder that materializes a mountable
`ServiceApp` (via `build()`) or starts a Deno listener (via `serve()`). Layer 3 is
`defineService()`, the curated one-call preset used by generated service entrypoints. Every
layer takes the oRPC router as its input, and the same contract the router implements is the
one a typed client imports — so a renamed field is a compile error on both sides. The full
type story is in [Contracts](/explanation/contracts/).

## Learn → / Do →

{{ comp.featureGrid({ items: [
  {
    title: "Learn — Build a service",
    body: "Track A 02: author a contract, stand up the users service on :3001, call it from a typed client.",
    href: "/tutorials/storefront/02-catalog-service/",
    icon: "→"
  },
  {
    title: "Do — Expose OpenAPI & Scalar",
    body: "Recipe: turn on the generated OpenAPI spec and the Scalar docs UI for an existing service.",
    href: "/how-to/expose-openapi-scalar/",
    icon: "◆"
  },
  {
    title: "Do — Graceful shutdown",
    body: "Recipe: drain in-flight requests and run teardown hooks on SIGINT/SIGTERM before the process exits.",
    href: "/how-to/graceful-shutdown/",
    icon: "◆"
  }
] }) }}

## The contract is the source of truth

Before there is a service there is a contract. A contract is plain `@orpc/contract`
routes whose inputs and outputs are zod schemas, collected into an object and passed to
`implement()` from `@orpc/server`. `implement()` returns a `.handler()`-bindable object
the service router consumes. The example workspace versions its contracts under
`contracts/versions/v1/` and re-exports them as `@<project>/contracts` — so a contract
bump is an explicit, reviewable version directory, never an accidental break.

```ts
// contracts/versions/v1/users.contract.ts
import { z } from 'zod';
import { oc } from '@orpc/contract';
import { implement } from '@orpc/server';

export const UsersContractV1 = {
  health: oc.route({ method: 'GET' }).input(z.object({}).optional()).output(UsersHealthSchemaV1),
  list: oc.route({ method: 'POST' }).input(UsersListInputSchemaV1).output(UsersListResponseSchemaV1),
  updateStatus: oc.route({ method: 'POST' }).input(UsersUpdateStatusInputSchemaV1).output(UsersUpdateStatusResponseSchemaV1),
};

// `implement()` produces the .handler()-bindable object the service router consumes.
export const UsersV1 = implement(UsersContractV1);
```

The chain end-to-end — contract → `implement()` → `.handler()` → typed client → query →
island — is laid out in [Contracts](/explanation/contracts/). The key property: the
client imports the *same* contract object, so a renamed field or a changed output shape is
a **compile error in both the handler and the caller** before it can ship.

## Headline API: two ways to construct a service

NetScript ships **two** service-construction APIs, and the example project uses both.
Workspace services use the one-call `defineService(router, options)` — the right default
for the 80% case. Plugin API services (workers, sagas, auth) use the fluent
`createService(router, options).with*().serve()` builder when they need to add CORS,
OpenAPI, a database client, auth middleware, or custom context step by step. Both stand up
the same Hono + oRPC runtime; `defineService` is a curated preset over the same builder.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Simple — defineService (one-shot)",
    lang: "ts",
    code: "// services/users/src/main.ts\nimport { defineService } from '@netscript/service';\nimport { router } from './router.ts';\n\n// One call wires CORS, request logging, OpenAPI, RPC, and health endpoints.\nawait defineService(router, {\n  name: 'users',\n  version: '1.0.0',\n  port: parseInt(Deno.env.get('PORT') || '3001'),\n  openapi: { title: 'Users API', description: 'users service' },\n  debug: true,\n});"
  },
  {
    label: "Advanced — createService().serve() (fluent)",
    lang: "ts",
    code: "// plugins/workers/services/src/main.ts — step-by-step composition\nimport { createService } from '@netscript/service';\nimport { router } from './router.ts';\n\nawait createService(router, { name: 'workers', version: '1.0.0', port: 8091 })\n  .withCors()\n  .withLogger()\n  .withOpenAPI({ title: 'Workers API' })\n  .withDocs()\n  .withDatabase(dbClient)\n  .withContext(() => ({ workers: runtime }))\n  .withRPC({ traceContext: true })\n  .withHealth()\n  .withServiceInfo()\n  .onStartup(async () => {/* seed, warm caches */})\n  .serve();"
  }
] }) }}

### `defineService(router, options)` — the preset options

`DefineServiceOptions` extends the base `ServiceConfig` (`name`, `version`, `port`) and adds
the preset-only keys below. These are the **complete** option keys confirmed against the
package surface — nothing is omitted.

{{ comp.apiTable({
  caption: "DefineServiceOptions (extends ServiceConfig)",
  rows: [
    { name: "name", type: "string (required)", desc: "Service name used for logging, telemetry, and health-check labels." },
    { name: "version", type: "string?", desc: "Service version (e.g. '1.0.0'); surfaced on /health and the OpenAPI spec." },
    { name: "port", type: "number?", desc: "Default listener port if serve() is not passed an explicit port. The generated entrypoint reads Deno.env.get('PORT') || '3001'." },
    { name: "db", type: "DbContext?", desc: "Database context injected as context.db. Accepts a single Prisma client (with $queryRaw) or a multi-db record like { netscript, mdb, prosco, prev }; the first value exposing $queryRaw is auto-wired as the /health and /health/ready probe client." },
    { name: "openapi", type: "{ title?; description? }?", desc: "Turns on the generated OpenAPI spec endpoint and the Scalar docs UI with this title/description." },
    { name: "debug", type: "boolean?", desc: "Enables verbose oRPC logging. Defaults to the NETSCRIPT_DEBUG env var." },
    { name: "auth", type: "{ authn: AuthnOptions; authz?: AuthzOptions }?", desc: "Installs the authentication (and optional authorization) gate on guarded paths — the preset form of .withAuthn()/.withAuthz()." },
    { name: "tls", type: "ServiceTlsOptions?", desc: "Opt-in TLS: { cert, key } as PEM strings. When set, the listener serves HTTPS and negotiates HTTP/2 via ALPN automatically. Forwarded to serve() as .serve({ tls }). See TLS & HTTP/2 below." }
  ]
}) }}

{{ comp callout { type: "note", title: "Handlers bind to the contract" } }}
A router aggregates versioned handlers — <code>export const router = { v1: { users: { ...UsersV1, health } } }</code> —
and each handler is bound from the implemented contract:
<code>v1.users.list.handler(async ({ input }) =&gt; { /* return records */ })</code>. In the
scaffold's <strong>Step 5</strong> the <code>users</code> handlers return seeded
<strong>in-memory records</strong> (no database yet) — the front-end ↔ contract proof. Wiring
Prisma comes later; see <a href="/data-persistence/database/">Database</a>.
{{ /comp }}

## Endpoints & ports

A `defineService` runtime exposes its OpenAPI routes, a typed oRPC endpoint mounted under
`/api/rpc/*`, and a health check. The example `users` service is reachable once
`aspire start` is up (Aspire provisions Postgres/Redis first) or when you run it directly
with `deno task --cwd services/users dev`.

{{ comp.apiTable({
  caption: "Users service surface (port 3001)",
  rows: [
    { name: "/api/v1/users/*", type: "HTTP/OpenAPI", desc: "REST surface generated from the contract (list, updateStatus, health)." },
    { name: "/api/rpc/*", type: "oRPC", desc: "Typed RPC endpoint a generated client calls — same contract object, no drift. This is the served default path (not /rpc)." },
    { name: "/health", type: "HTTP", desc: "Liveness/readiness check; anonymous by default (excluded from authn)." },
    { name: ":3001", type: "port", desc: "Default service port; read from Deno.env.get('PORT') || '3001'." }
  ]
}) }}

{{ comp callout { type: "important", title: "Aspire first, then hit the endpoint" } }}
Services that touch the database need orchestration up first:
<code>cd aspire &amp;&amp; aspire start</code> brings up Postgres and Redis (dashboard at
<a href="https://localhost:18888">https://localhost:18888</a>) <strong>before</strong> any
<code>netscript db</code> command. The seeded-records example service runs without the DB,
but the real workflow expects Aspire running. See <a href="/explanation/aspire/">Aspire</a>.
{{ /comp }}

## OpenAPI spec & Scalar docs

Passing `openapi` to `defineService` (or calling `.withOpenAPI().withDocs()` on the builder)
turns on a REST surface generated from the same contract, a machine-readable OpenAPI JSON
spec, and the **Scalar** interactive docs UI. Under the hood three Layer-1 primitives do the
work, and you can mount them directly in any host Hono app when you need finer control:
`createOpenAPISpec` serves the spec JSON, `createScalarDocs` serves the Scalar HTML page, and
`createOpenAPIHandler` serves the REST routes themselves (it adds the `ZodSmartCoercionPlugin`
so query-string values coerce to their schema types automatically).

{{ comp.apiTable({
  caption: "OpenAPI / Scalar primitives (@netscript/service)",
  rows: [
    { name: "createOpenAPISpec(router, config)", type: "→ ServiceHandler", desc: "Serves the OpenAPI JSON spec. config is OpenAPIConfig (see below). Mount at e.g. /api/openapi.json." },
    { name: "createScalarDocs(options)", type: "→ ServiceHandler", desc: "Serves the Scalar docs UI HTML that loads the spec. options is ScalarDocsOptions (specUrl, title?, theme?)." },
    { name: "createScalarJs()", type: "→ ServiceHandler", desc: "Serves the bundled Scalar JS so the docs UI works offline without CDN access." },
    { name: "createOpenAPIHandler(router, config?)", type: "→ FetchHandler", desc: "The OpenAPI REST request handler (with ZodSmartCoercionPlugin). config is RPCHandlerConfig; mount under /api/*." }
  ]
}) }}

{{ comp.apiTable({
  caption: "OpenAPIConfig (createOpenAPISpec)",
  rows: [
    { name: "title", type: "string (required)", desc: "API title shown in the spec and docs." },
    { name: "version", type: "string (required)", desc: "API version, e.g. '1.0.0'." },
    { name: "description", type: "string?", desc: "Longer API description." },
    { name: "servers", type: "Array<{ url; description? }>?", desc: "Server URLs advertised in the spec (e.g. staging vs. production base URLs)." }
  ]
}) }}

{{ comp.apiTable({
  caption: "ScalarDocsOptions (createScalarDocs)",
  rows: [
    { name: "specUrl", type: "string (required)", desc: "URL the docs UI fetches the OpenAPI spec from, e.g. '/api/openapi.json'." },
    { name: "title", type: "string?", desc: "Docs page title." },
    { name: "theme", type: "'default' | 'kepler' | 'moon' | 'purple' | 'saturn'", desc: "Scalar UI theme." }
  ]
}) }}

{{ comp.tabbedCode({ tabs: [
  {
    label: "Preset — defineService({ openapi })",
    lang: "ts",
    code: "// services/users/src/main.ts\nimport { defineService } from '@netscript/service';\nimport { router } from './router.ts';\n\n// Turns on the OpenAPI spec + Scalar docs UI in one option.\nawait defineService(router, {\n  name: 'users',\n  version: '1.0.0',\n  port: 3001,\n  openapi: {\n    title: 'Users API',\n    description: 'User management service',\n  },\n});"
  },
  {
    label: "Primitives — mount in a host app",
    lang: "ts",
    code: "// host/openapi-routes.ts — wire the primitives onto an existing Hono app\nimport {\n  createOpenAPISpec,\n  createScalarDocs,\n  createScalarJs,\n} from '@netscript/service';\nimport { router } from './router.ts';\n\napp.get('/api/openapi.json', createOpenAPISpec(router, {\n  title: 'Users API',\n  version: '1.0.0',\n  description: 'User management service',\n}));\n\napp.get('/api/docs', createScalarDocs({\n  specUrl: '/api/openapi.json',\n  title: 'Users API',\n  theme: 'kepler',\n}));\n\n// Serve Scalar offline (no CDN dependency)\napp.get('/api/docs/scalar.js', createScalarJs());"
  }
] }) }}

## Health, readiness & liveness

The preset wires `/health` automatically; the underlying primitives let you compose probes
by hand or mount them in a host app. `createHealthHandler` runs every registered
`HealthCheck` in parallel and returns an aggregate `HealthResponse`
(`status` ∈ `healthy | degraded | unhealthy`). `createReadinessHandler` takes an array of
async boolean checks and is the one to point an orchestrator's *readiness* probe at — it
fails until dependencies (DB, caches) are reachable. `createLivenessHandler` is a bare
"is the process up" probe that returns 200 with no dependency checks, for an orchestrator's
*liveness* probe. The `healthChecks` namespace ships pre-built checks for the common
dependencies so you don't hand-roll them.

{{ comp.apiTable({
  caption: "Health primitives & checks (@netscript/service)",
  rows: [
    { name: "createHealthHandler(options?)", type: "→ ServiceHandler", desc: "Runs all checks in parallel, returns an aggregate HealthResponse. options: HealthHandlerOptions { checks?, version?, includeDetails? (default true) }." },
    { name: "createReadinessHandler(checks)", type: "→ ServiceHandler", desc: "Readiness probe: checks is Array<() => Promise<boolean>>; reports not-ready until every check resolves true. Mount at /health/ready." },
    { name: "createLivenessHandler()", type: "→ ServiceHandler", desc: "Liveness probe: 200 OK while the process runs, no dependency checks. Mount at /health/live." },
    { name: "healthChecks.database(db)", type: "→ HealthCheck", desc: "Pre-built DB probe; runs a $queryRaw `SELECT 1`-style ping against the Prisma client." },
    { name: "healthChecks.kv()", type: "→ HealthCheck", desc: "Pre-built check for the KV store." },
    { name: "healthChecks.service(name, baseUrl)", type: "→ HealthCheck", desc: "Probes another service's health endpoint by name + base URL." },
    { name: "healthChecks.custom(name, fn)", type: "→ HealthCheck", desc: "Wraps your own async () => Promise<boolean> as a named check." }
  ]
}) }}

{{ comp.tabbedCode({ tabs: [
  {
    label: "Compose probes by hand",
    lang: "ts",
    code: "// host/health-routes.ts — readiness + liveness + aggregate health\nimport {\n  createHealthHandler,\n  createLivenessHandler,\n  createReadinessHandler,\n  healthChecks,\n} from '@netscript/service';\nimport { db } from '@database';\n\n// Aggregate health (parallel checks + details)\napp.get('/health', createHealthHandler({\n  version: '1.0.0',\n  checks: [healthChecks.database(db)],\n}));\n\n// Liveness: is the process up?\napp.get('/health/live', createLivenessHandler());\n\n// Readiness: are dependencies reachable?\napp.get('/health/ready', createReadinessHandler([\n  async () => { await db.$queryRaw`SELECT 1`; return true; },\n]));"
  }
] }) }}

{{ comp callout { type: "note", title: "Liveness vs. readiness" } }}
Point an orchestrator's <strong>liveness</strong> probe at <code>/health/live</code> (restart
the container only when the process is wedged) and its <strong>readiness</strong> probe at
<code>/health/ready</code> (stop routing traffic until the DB and caches answer). Wiring both
to the same dependency-checking endpoint is the classic footgun: a transient DB blip then
triggers a <em>restart</em> instead of a brief traffic pause.
{{ /comp }}

## Graceful shutdown

`serve()` installs SIGINT/SIGTERM (or SIGBREAK on Windows) handlers and drains in-flight
requests before exiting. Register teardown work with `.onShutdown(hook)` on the builder — a
`ShutdownHook` receives a `ShutdownContext` (`reason`, optional `signal`) and runs during the
drain. The drain is bounded by `drainTimeoutMs` (default `30_000`); when it elapses the
service stops anyway and the resulting `ShutdownReport` records `timedOut: true` plus a
per-hook `ShutdownHookOutcome` for each registered hook. Calling `running.stop()` triggers
the same drain manually (reason `'manual'`).

{{ comp.apiTable({
  caption: "Shutdown types (@netscript/service)",
  rows: [
    { name: "ShutdownHook", type: "(context: ShutdownContext) => Promise<void> | void", desc: "Async teardown callback registered via .onShutdown(). Run in registration order during the drain." },
    { name: "ShutdownContext", type: "{ reason: ShutdownReason; signal?: Deno.Signal }", desc: "Passed to each hook. signal is set only when reason is 'signal'." },
    { name: "ShutdownReason", type: "'signal' | 'manual' | 'startup-failure'", desc: "Why the drain started: an OS signal, a manual stop() call, or a failed startup hook." },
    { name: "ShutdownHookOutcome", type: "{ ok: boolean; error?: string }", desc: "Per-hook result; error holds a normalized message when a hook throws or rejects." },
    { name: "ShutdownReport", type: "{ reason; timedOut: boolean; hooks: readonly ShutdownHookOutcome[] }", desc: "Final result of a completed shutdown — the reason, whether the timeout elapsed, and every hook outcome in execution order." }
  ]
}) }}

{{ comp.apiTable({
  caption: "ServeOptions (serve()) — shutdown-relevant keys",
  rows: [
    { name: "port", type: "number?", desc: "Preferred listener port; use 0 for an ephemeral port." },
    { name: "signal", type: "AbortSignal?", desc: "External signal that stops the listener when aborted (drives the drain)." },
    { name: "drainTimeoutMs", type: "number?", desc: "Max time to wait for in-flight requests and shutdown hooks before forcing exit. Defaults to 30_000." },
    { name: "handleSignals", type: "boolean?", desc: "Install SIGINT/SIGTERM (or SIGBREAK) handlers. Defaults to true." },
    { name: "tls", type: "ServiceTlsOptions?", desc: "Opt-in TLS ({ cert, key } PEM strings). Present → HTTPS + HTTP/2 via ALPN; absent → plain HTTP/1.1. See TLS & HTTP/2 below." }
  ]
}) }}

{{ comp.tabbedCode({ tabs: [
  {
    label: "onShutdown teardown",
    lang: "ts",
    code: "// services/users/src/main.ts — drain + teardown on signal or manual stop\nimport { createService } from '@netscript/service';\nimport { router } from './router.ts';\nimport { db } from '@database';\n\nconst running = await createService(router, { name: 'users', version: '1.0.0' })\n  .withRPC()\n  .withHealth()\n  .onShutdown(async ({ reason, signal }) => {\n    // reason: 'signal' | 'manual' | 'startup-failure'\n    audit.record({ event: 'shutdown', reason, signal });\n    await db.$disconnect();\n  })\n  .serve({\n    port: 3001,\n    drainTimeoutMs: 10_000, // wait up to 10s for in-flight work\n    handleSignals: true,    // SIGINT/SIGTERM/SIGBREAK\n  });\n\n// Later, in tests or a supervisor: trigger the same drain manually.\nawait running.stop();"
  }
] }) }}

## TLS & HTTP/2 (opt-in)

By default a service listens over plain HTTP. Pass a `tls` option and the *same* listener serves
HTTPS and negotiates **HTTP/2 automatically via ALPN** — HTTP/1.1 stays available as a fallback, and
there is no separate `http2` flag. TLS is purely additive: a service that omits `tls` is unchanged.

`tls` is a `ServiceTlsOptions` object whose `cert` and `key` are **PEM-encoded strings** — the
certificate chain and the private key as *contents*, not file paths. It is accepted by both
`defineService(router, { …, tls })` and the fluent builder's `.serve({ tls })`.

```ts
// services/users/src/main.ts — serve HTTPS + HTTP/2 with an inline cert/key
import { defineService } from '@netscript/service';
import { router } from './router.ts';

await defineService(router, {
  name: 'users',
  port: 3000,
  tls: {
    cert: await Deno.readTextFile('cert.pem'), // PEM contents
    key: await Deno.readTextFile('key.pem'),   // PEM contents
  },
});
// Fluent equivalent: createService(router, { name }).withHealth().serve({ tls: { cert, key } })
```

If you omit `tls`, the listener falls back to environment configuration: set **both**
`NETSCRIPT_TLS_CERT_FILE` and `NETSCRIPT_TLS_KEY_FILE` and the service serves HTTPS from those files.
Unlike the inline `cert`/`key` (PEM contents), these env vars are **file paths** — and both are
required; one alone is ignored.

{{ comp.apiTable({
  caption: "ServiceTlsOptions (@netscript/service) + env fallback",
  rows: [
    { name: "cert", type: "string (required)", desc: "PEM-encoded certificate chain — the contents, not a path." },
    { name: "key", type: "string (required)", desc: "PEM-encoded private key — the contents, not a path." },
    { name: "NETSCRIPT_TLS_CERT_FILE", type: "env (path)", desc: "Fallback when tls is omitted: file path to the PEM certificate chain. Both env vars must be set together." },
    { name: "NETSCRIPT_TLS_KEY_FILE", type: "env (path)", desc: "Fallback when tls is omitted: file path to the PEM private key. Both env vars must be set together." }
  ]
}) }}

## Service-layer authn / authz middleware

The service builder ships a **provider-agnostic** authentication and authorization seam in
`@netscript/service/auth`. It is a thin Hono-middleware layer over the request pipeline —
deliberately **distinct from the [auth plugin](/identity-access/auth/)**, which composes a
sign-in/session backend (kv-oauth, WorkOS, better-auth). Use this seam when a service needs
to gate its own routes — verify a credential, trust an upstream identity header, or check a
scope — without taking on an interactive identity provider.

Two stages wrap the request: `.withAuthn()` resolves a `Principal` (authentication) via an
`AuthenticatorPort`, and `.withAuthz()` makes an `AuthzDecision` from that principal
(authorization) via an `AuthorizerPort`. By default the `/api` surface is protected and
`/health` is anonymous — both configurable through `AuthnOptions.protect` /
`AuthnOptions.allowAnonymous`. The preset form is `defineService(router, { auth: { authn, authz } })`.

{{ comp.apiTable({
  caption: "@netscript/service/auth surface",
  rows: [
    { name: "createStaticCredentialAuthenticator", type: "authenticator", desc: "Matches a configured static credential (e.g. API key / shared secret) → Principal." },
    { name: "createTrustedHeaderAuthenticator", type: "authenticator", desc: "Trusts an identity asserted by an upstream proxy header (e.g. behind a gateway)." },
    { name: "createScopeAuthorizer", type: "authorizer", desc: "Allows/denies a request by checking the Principal's scopes against required scopes." },
    { name: ".withAuthn({ authenticator, protect?, allowAnonymous? })", type: "builder method", desc: "Installs the authentication gate (AuthnOptions). protect defaults to ['/api']; allowAnonymous defaults to ['/health']." },
    { name: ".withAuthz({ authorizer, denyByDefault? })", type: "builder method", desc: "Installs the authorization gate (AuthzOptions) from the Principal. denyByDefault fails closed and defaults to true." }
  ]
}) }}

{{ comp.tabbedCode({ tabs: [
  {
    label: "Fluent — withAuthn / withAuthz",
    lang: "ts",
    code: "// Gate a service with a static credential + scope check\nimport { createService } from '@netscript/service';\nimport {\n  createStaticCredentialAuthenticator,\n  createScopeAuthorizer,\n} from '@netscript/service/auth';\nimport { router } from './router.ts';\n\nconst authenticator = createStaticCredentialAuthenticator({\n  credentials: {\n    [Deno.env.get('SERVICE_API_KEY') ?? '']: {\n      subject: 'service:ci',\n      scopes: ['users:write'],\n    },\n  },\n});\nconst authorizer = createScopeAuthorizer({\n  rules: [{ match: () => true, requireScopes: ['users:write'] }],\n  denyByDefault: true,\n});\n\nawait createService(router, { name: 'users', version: '1.0.0', port: 3001 })\n  .withRPC()\n  .withAuthn({ authenticator })\n  .withAuthz({ authorizer })\n  .withHealth() // /health stays anonymous\n  .serve();"
  },
  {
    label: "Trusted-header (behind a gateway)",
    lang: "ts",
    code: "// Trust identity asserted by an upstream proxy/gateway\nimport { createTrustedHeaderAuthenticator } from '@netscript/service/auth';\n\n// The Principal is assembled internally from these header NAMES — point at the\n// headers your gateway sets; you do not map values yourself.\nconst authenticator = createTrustedHeaderAuthenticator({\n  subjectHeader: 'x-forwarded-user',\n  scopesHeader: 'x-forwarded-scopes', // optional; space/comma-separated\n});\n\n// then: .withAuthn({ authenticator })"
  }
] }) }}

{{ comp callout { type: "note", title: "Service-auth seam vs. the auth plugin" } }}
This middleware is for <strong>machine-to-machine and gateway-fronted</strong> gating: static
credentials, trusted upstream headers, scope checks. It does <em>not</em> do interactive
sign-in, OAuth callbacks, or session cookies. For <strong>signed-in human users</strong>
(sign-in / callback / session / me), compose the
<a href="/identity-access/auth/"><code>auth</code> plugin</a> backend instead — the two layers
are complementary and can run together.
{{ /comp }}

## Production notes

{{ comp callout { type: "warning", title: "Footguns before you ship" } }}
<ul>
<li><strong>Don't wire liveness to dependency checks.</strong> <code>/health/live</code> must
stay dependency-free; only <code>/health/ready</code> should fail on an unreachable DB. Crossing
them turns a transient DB blip into a container restart loop.</li>
<li><strong>Set <code>drainTimeoutMs</code> below your platform's kill grace.</strong> The drain
defaults to <code>30_000</code>; if your orchestrator sends SIGKILL sooner, in-flight requests
are cut off — pick a timeout under the platform's termination grace period.</li>
<li><strong>The served RPC path is <code>/api/rpc/*</code>, not <code>/rpc</code>.</strong>
Point generated clients at the same path the runtime mounts.</li>
<li><strong><code>denyByDefault</code> is <code>true</code>.</strong> With <code>.withAuthz()</code>
installed, any request that reaches no matching rule is rejected — add an explicit allow rule for
public-but-authenticated routes rather than relaxing the default.</li>
<li><strong>Aspire first for DB-backed services.</strong> <code>aspire start</code> must bring up
Postgres/Redis before any <code>netscript db</code> command or the readiness probe will fail.</li>
</ul>
{{ /comp }}

## Reference

This hub is intentionally thin — the full generated API lives in the reference.

{{ comp.xref({ key: "ref:service" }) }}

{{ comp.featureGrid({ items: [
  {
    title: "Look up — @netscript/service",
    body: "The full generated API: defineService, createService, the fluent builder, the OpenAPI/Scalar and health primitives, the shutdown types, and the /auth middleware seam.",
    href: "/reference/service/",
    icon: "≡"
  },
  {
    title: "Look up — @netscript/contracts",
    body: "Contract primitives plus the /crud, /query, and /transform helpers that generate CRUD contracts, paginated queries, and response transformers.",
    href: "/reference/contracts/",
    icon: "≡"
  },
  {
    title: "Understand — Contracts",
    body: "The oRPC contract → implement → handler → typed client → query → island type flow, explained.",
    href: "/explanation/contracts/",
    icon: "◎"
  },
  {
    title: "Learn — Build a service",
    body: "Guided tutorial: contract → users service on :3001 → typed client → island, built from scratch.",
    href: "/tutorials/storefront/02-catalog-service/",
    icon: "→"
  }
] }) }}

{{ comp.nextPrev({ prev: { label: "Capabilities", href: "/capabilities/" }, next: { label: "Background jobs", href: "/background-processing/workers/" } }) }}
