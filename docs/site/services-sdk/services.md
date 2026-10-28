---
layout: layouts/base.vto
title: Services & contracts
templateEngine: [vento, md]
prev: { label: "Capabilities", href: "/capabilities/" }
next: { label: "Background jobs", href: "/background-processing/workers/" }
order: 1
---

# Services & contracts

This page explains how a NetScript service implements a versioned contract and which runtime APIs
serve it: `defineService`, the fluent builder, OpenAPI, health probes, graceful shutdown, TLS and
service-level auth.

A **service** is a typed HTTP runtime that implements an [`@orpc/contract`](/explanation/contracts/)
definition. You define the versioned public contract (routes with Zod input and output),
`implement()` it, bind `.handler()`s, and serve the router on a Hono and oRPC runtime. A typed client
imports the same contract object the server implements, so caller and server cannot drift. The
example `users` service answers on its assigned port with an OpenAPI surface (`/api/v1/users/*`) and
a typed oRPC endpoint (`/api/rpc/*`).

{{ comp.diagram({
  src: "/assets/diagrams/request-lifecycle.svg",
  alt: "A browser request flows into the service router, through middleware to the matched contract handler, optionally to the database, and back as a typed response.",
  caption: "Request lifecycle: browser → service router → middleware → contract handler → database → typed response."
}) }}

## When to use a service

A service is the synchronous request/response boundary. Other work has its own runtime:

| You need | Use |
| --- | --- |
| A versioned, type-locked API shared by front end and back end: CRUD, an internal RPC boundary, or a public REST/OpenAPI endpoint | A service (this page) |
| Fire-and-forget work | A [background job](/background-processing/workers/) |
| Message-driven, long-running orchestration | A [durable saga](/durable-workflows/sagas/) |
| Inbound HTTP that starts work | A [trigger](/durable-workflows/triggers/) |
| Signed-in identity and sessions | The [auth plugin](/identity-access/auth/) |

## What it is

`@netscript/service` has three layers. Layer 1 is small primitives: health, error, RPC, OpenAPI,
and Scalar docs handlers you can mount in any Hono app. Layer 2 is `createService()`, a fluent
builder that materializes a mountable `ServiceApp` (via `build()`) or starts a Deno listener (via
`serve()`). Layer 3 is `defineService()`, the one-call preset that generated service entrypoints
use. Every layer takes the oRPC router as its input.

## The contract is the source of truth

A contract is plain `@orpc/contract` routes whose inputs and outputs are Zod schemas, collected into
an object and passed to `implement()` from `@orpc/server`. `implement()` returns the
`.handler()`-bindable object the service router consumes. The example workspace versions its
contracts under `contracts/versions/v1/` and re-exports them as `@<project>/contracts`, so a contract
bump is an explicit, reviewable version directory.

For a database-backed service, the public Zod shape usually starts from a generated schema: run
`netscript db generate`, import from `@database/zod`, and narrow or extend the model before binding
it to the route. See the [generated-schema step](/data-persistence/database/#generated-schemas-feed-public-contracts)
and the [two contract origins](/explanation/contracts/#where-the-public-shape-begins). A service
without a database authors the same public shape directly.

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

Because the client imports the same contract object, a renamed field or a changed output shape is a
compile error in both the handler and the caller. [Contracts](/explanation/contracts/) traces the
full chain from contract to island.

## Two ways to construct a service

Workspace services use the one-call `defineService(router, options)`, the default for most
services. Plugin API services (workers, sagas, auth) use the fluent
`createService(router, options).with*().serve()` builder to add CORS, OpenAPI, a database client,
auth middleware, or custom context step by step. Both run the same Hono and oRPC runtime;
`defineService` is a preset over the builder.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Simple — defineService (one-shot)",
    lang: "ts",
    code: "// services/users/src/main.ts\nimport { defineService } from '@netscript/service';\nimport { router } from './router.ts';\n\n// One call wires CORS, request logging, OpenAPI, RPC, and health endpoints.\nawait defineService(router, {\n  auth: { public: true, reason: 'Public example service; add guards before exposing private data' },\n  name: 'users',\n  version: '1.0.0',\n  port: parseInt(Deno.env.get('PORT') || '3001'), // note: your scaffold's port will differ\n  openapi: { title: 'Users API', description: 'users service' },\n  debug: true,\n});"
  },
  {
    label: "Advanced — createService().serve() (fluent)",
    lang: "ts",
    code: "// plugins/workers/services/src/main.ts — step-by-step composition\nimport { createService } from '@netscript/service';\nimport { router } from './router.ts';\n\nawait createService(router, { name: 'workers', version: '1.0.0', port: 8091 }) // note: your scaffold's port will differ\n  .withCors()\n  .withLogger()\n  .withOpenAPI({ title: 'Workers API' })\n  .withDocs()\n  .withDatabase(dbClient)\n  .withContext(() => ({ workers: runtime }))\n  .withRPC({ traceContext: true })\n  .withHealth()\n  .withServiceInfo()\n  .onStartup(async () => {/* seed, warm caches */})\n  .serve();"
  }
] }) }}

Aspire injects `PORT` at runtime, so the entrypoint reads it from the environment. The typed source
of truth is the `services.<name>.port` field in `netscript.config.ts`, which the scaffold wires as the
fallback default. Set the port there rather than editing this line.

### `defineService(router, options)` options

`DefineServiceOptions` extends the base `ServiceConfig` (`name`, `version`, `port`) with the
preset-only keys below. This is the complete option list.

{{ comp.apiTable({
  caption: "DefineServiceOptions (extends ServiceConfig)",
  rows: [
    { name: "name", type: "string (required)", desc: "Service name used for logging, telemetry, and health-check labels." },
    { name: "version", type: "string?", desc: "Service version (e.g. '1.0.0'); surfaced on /health and the OpenAPI spec." },
    { name: "port", type: "number?", desc: "Default listener port; the generated entrypoint reads Deno.env.get('PORT') first." },
    { name: "db", type: "DbContext?", desc: "Database context injected as context.db: one Prisma client or a multi-db record. The configured $queryRaw client backs /health/ready." },
    { name: "openapi", type: "{ title?; description? }?", desc: "Turns on the generated OpenAPI spec endpoint and the Scalar docs UI with this title/description." },
    { name: "debug", type: "boolean?", desc: "Enables verbose oRPC logging. Defaults to the NETSCRIPT_DEBUG env var." },
    { name: "auth", type: "ServiceAuthPolicy (required)", desc: "Choose native { authn, authz? } guards or an explicit { public: true, reason } opt-out. The reason must be nonblank; omission fails before startup." },
    { name: "tls", type: "ServiceTlsOptions?", desc: "Opt-in TLS { cert, key } (PEM): HTTPS with HTTP/2 via ALPN. See TLS & HTTP/2 below." },
    { name: "hostname", type: "string?", desc: "Listener bind interface; default 0.0.0.0." },
    { name: "middleware", type: "ServiceMiddleware[]?", desc: "Runs in order after CORS and logging, before auth." },
    { name: "bodyLimit", type: "{ maxBytes }?", desc: "Opt-in: typed JSON 413 for larger bodies on RPC and OpenAPI, after auth. See reference/service." }
  ]
}) }}

> [!IMPORTANT]
> `defineService()` requires an explicit auth policy. The examples on this page are public
> demonstrations. For protected operations, pass
> `auth: { authn: { authenticator }, authz: { authorizer } }`; authorization is optional. A missing
> policy is a type error, and a runtime `TypeError` for JavaScript callers. To keep a public
> service public, add `auth: { public: true, reason: 'Public status service with no protected operations' }`.
> See the [explicit service posture and migration](/reference/service/#explicit-service-posture).

{{ comp callout { type: "note", title: "Handlers bind to the contract" } }}
A router aggregates versioned handlers, for example
<code>export const router = { v1: { users: { ...UsersV1, health } } }</code>, and each handler is
bound from the implemented contract:
<code>v1.users.list.handler(async ({ input }) =&gt; { /* return records */ })</code>. In the
scaffold's <strong>Step 5</strong> the <code>users</code> handlers return seeded in-memory records
(no database yet). See <a href="/data-persistence/database/">Database</a> to wire Prisma.
{{ /comp }}

## Endpoints & ports

A `defineService` runtime exposes its OpenAPI routes, a typed oRPC endpoint under `/api/rpc/*`, and
a health check. The example `users` service is reachable once `aspire start` is up (Aspire provisions
Postgres and Redis first), or when you run it directly with `deno task --cwd services/users dev`.

{{ comp.apiTable({
  caption: "Users service surface",
  rows: [
    { name: "/api/v1/users/*", type: "HTTP/OpenAPI", desc: "REST surface generated from the contract (list, updateStatus, health)." },
    { name: "/api/rpc/*", type: "oRPC", desc: "Typed RPC endpoint a generated client calls — same contract object, no drift. This is the served default path (not /rpc)." },
    { name: "/health", type: "HTTP", desc: "Liveness/readiness check; anonymous by default (excluded from authn)." },
    { name: "Assigned", type: "port", desc: "The service port allocated at scaffold time (read from Deno.env.get('PORT'))." }
  ]
}) }}

## OpenAPI spec & Scalar docs

Passing `openapi` to `defineService`, or calling `.withOpenAPI().withDocs()` on the builder, turns on
a REST surface generated from the same contract, a machine-readable OpenAPI JSON document, and the
Scalar interactive docs UI. Three Layer-1 primitives do the work and can be mounted in any Hono app:
`createOpenAPISpec` serves the document, `createScalarDocs` serves the Scalar page, and
`createScalarJs` serves the bundled Scalar runtime. `createOpenAPIHandler` serves the REST routes
themselves and adds the `ZodSmartCoercionPlugin`, so query-string values coerce to their schema
types. [Expose OpenAPI & Scalar](/services-sdk/how-to/expose-openapi-scalar/) shows both paths and
every option.

## Health, readiness & liveness

The preset wires `/health` automatically. The primitives let you compose probes by hand or mount
them in a host app:

- `createHealthHandler` runs every registered `HealthCheck` in parallel and returns an aggregate
  `HealthResponse` (`status` ∈ `healthy | degraded | unhealthy`).
- `createReadinessHandler` takes an array of async boolean checks. Point an orchestrator's readiness
  probe at it: it fails until dependencies (database, caches) are reachable.
- `createLivenessHandler` returns 200 while the process runs, with no dependency checks, for an
  orchestrator's liveness probe.
- The `healthChecks` namespace ships pre-built checks for common dependencies.

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

{{ comp callout { type: "warning", title: "Keep liveness free of dependency checks" } }}
Point an orchestrator's <strong>liveness</strong> probe at <code>/health/live</code>, which restarts
the container only when the process is wedged, and its <strong>readiness</strong> probe at
<code>/health/ready</code>, which stops routing traffic until the database and caches answer. If
both use the same dependency-checking endpoint, a transient database blip triggers a restart loop
instead of a brief traffic pause.
{{ /comp }}

## Graceful shutdown

`serve()` installs SIGINT/SIGTERM (or SIGBREAK on Windows) handlers and drains in-flight requests
before exiting. Register teardown work with `.onShutdown(hook)` on the builder. A `ShutdownHook`
receives a `ShutdownContext` (`reason`, optional `signal`) and runs during the drain. `drainTimeoutMs`
bounds the drain (default `30_000`); when it elapses the service stops anyway, and the
`ShutdownReport` records `timedOut: true` and a `ShutdownHookOutcome` for each hook. Calling
`running.stop()` triggers the same drain manually (reason `'manual'`). The
[Graceful shutdown recipe](/orchestration-runtime/how-to/graceful-shutdown/) walks through it.

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
    code: "// services/users/src/main.ts — drain + teardown on signal or manual stop\nimport { createService } from '@netscript/service';\nimport { router } from './router.ts';\nimport { db } from '@database';\n\nconst running = await createService(router, { name: 'users', version: '1.0.0' })\n  .withRPC()\n  .withHealth()\n  .onShutdown(async ({ reason, signal }) => {\n    // reason: 'signal' | 'manual' | 'startup-failure'\n    audit.record({ event: 'shutdown', reason, signal });\n    await db.$disconnect();\n  })\n  .serve({\n    port: 3001, // note: your scaffold's port will differ\n    drainTimeoutMs: 10_000, // wait up to 10s for in-flight work\n    handleSignals: true,    // SIGINT/SIGTERM/SIGBREAK\n  });\n\n// Later, in tests or a supervisor: trigger the same drain manually.\nawait running.stop();"
  }
] }) }}

## TLS & HTTP/2 (opt-in)

A service listens over plain HTTP by default. Pass a `tls` option and the same listener serves HTTPS
and negotiates HTTP/2 through ALPN, with HTTP/1.1 as a fallback. There is no separate `http2` flag,
and a service that omits `tls` is unchanged.

`tls` is a `ServiceTlsOptions` object whose `cert` and `key` are PEM-encoded strings: the certificate
chain and the private key as contents, not file paths. Both `defineService(router, { …, tls })` and
the builder's `.serve({ tls })` accept it.

```ts
// services/users/src/main.ts — serve HTTPS + HTTP/2 with an inline cert/key
import { defineService } from '@netscript/service';
import { router } from './router.ts';

await defineService(router, {
  auth: { public: true, reason: 'Public example service; add guards before exposing private data' },
  name: 'users',
  port: 3000, // note: your scaffold's port will differ
  tls: {
    cert: await Deno.readTextFile('cert.pem'), // PEM contents
    key: await Deno.readTextFile('key.pem'),   // PEM contents
  },
});
// Fluent equivalent: createService(router, { name }).withHealth().serve({ tls: { cert, key } })
```

If you omit `tls`, the listener falls back to environment configuration: set both
`NETSCRIPT_TLS_CERT_FILE` and `NETSCRIPT_TLS_KEY_FILE` and the service serves HTTPS from those files.
Unlike the inline `cert`/`key`, these variables are file paths, and both are required; one alone is
ignored.

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

`@netscript/service/auth` is a provider-agnostic authentication and authorization seam: a thin
Hono-middleware layer over the request pipeline. Use it when a service gates its own routes (verify
a credential, trust an upstream identity header, or check a scope) without an interactive identity
provider. It is separate from the [auth plugin](/identity-access/auth/), which composes a
sign-in/session backend (kv-oauth, WorkOS, better-auth).

Two stages wrap the request. `.withAuthn()` resolves a `Principal` through an `AuthenticatorPort`,
and `.withAuthz()` makes an `AuthzDecision` from that principal through an `AuthorizerPort`. By
default `/api` is protected and `/health` is anonymous; `AuthnOptions.protect` and
`AuthnOptions.allowAnonymous` change that. The preset form is
`defineService(router, { auth: { authn, authz } })`.

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
    code: "// Gate a service with a static credential + scope check\nimport { createService } from '@netscript/service';\nimport {\n  createStaticCredentialAuthenticator,\n  createScopeAuthorizer,\n} from '@netscript/service/auth';\nimport { router } from './router.ts';\n\nconst authenticator = createStaticCredentialAuthenticator({\n  credentials: {\n    [Deno.env.get('SERVICE_API_KEY') ?? '']: {\n      subject: 'service:ci',\n      scopes: ['users:write'],\n    },\n  },\n});\nconst authorizer = createScopeAuthorizer({\n  rules: [{ match: () => true, requireScopes: ['users:write'] }],\n  denyByDefault: true,\n});\n\nawait createService(router, { name: 'users', version: '1.0.0', port: 3001 }) // note: your scaffold's port will differ\n  .withRPC()\n  .withAuthn({ authenticator })\n  .withAuthz({ authorizer })\n  .withHealth() // /health stays anonymous\n  .serve();"
  },
  {
    label: "Trusted-header (behind a gateway)",
    lang: "ts",
    code: "// Trust identity asserted by an upstream proxy/gateway\nimport { createTrustedHeaderAuthenticator } from '@netscript/service/auth';\n\n// The Principal is assembled internally from these header NAMES — point at the\n// headers your gateway sets; you do not map values yourself.\nconst authenticator = createTrustedHeaderAuthenticator({\n  subjectHeader: 'x-forwarded-user',\n  scopesHeader: 'x-forwarded-scopes', // optional; space/comma-separated\n});\n\n// then: .withAuthn({ authenticator })"
  }
] }) }}

{{ comp callout { type: "note", title: "Service-auth seam vs. the auth plugin" } }}
This middleware gates machine-to-machine and gateway-fronted traffic: static credentials, trusted
upstream headers, scope checks. It does no interactive sign-in, OAuth callbacks, or session cookies.
For signed-in users, compose the <a href="/identity-access/auth/"><code>auth</code> plugin</a>
backend. The two layers can run together.
{{ /comp }}

## Protect anonymous routes

Use `.withRateLimit({ routes, limit, windowMs, store })` on the builder's middleware seam to reserve
a per-client quota before routing. The socket peer is propagated to Hono; XFF requires explicit
proxy trust. Shared production quotas use the `@netscript/kv` atomic adapter, while bounded memory
storage supports tests/development. Follow
[Protect an anonymous service route](/services-sdk/how-to/protect-an-anonymous-route/) for a
device-flow start/poll example and the
[`@netscript/service` reference](/reference/service/#rate-limits-and-client-addresses) for the
contracts.

## Production notes

- **Set `drainTimeoutMs` below your platform's kill grace.** The drain defaults to `30_000`. If your
  orchestrator sends SIGKILL sooner, in-flight requests are cut off.
- **The served RPC path is `/api/rpc/*`, not `/rpc`.** Point generated clients at the path the
  runtime mounts.
- **`denyByDefault` is `true`.** With `.withAuthz()` installed, a request that matches no rule is
  rejected. Add an explicit allow rule for public-but-authenticated routes instead of relaxing the
  default.
- **Start Aspire first for database-backed services.** `aspire start` must bring up Postgres and
  Redis (dashboard at [https://localhost:18888](https://localhost:18888)) before any
  `netscript db` command, or the readiness probe fails.

## Next steps

Call this service from an app or another service with [Typed SDK & client](/services-sdk/sdk/). See
also the [Add a service](/services-sdk/how-to/add-a-service/) recipe and the
[`@netscript/service`](/reference/service/) and [`@netscript/contracts`](/reference/contracts/)
references.
