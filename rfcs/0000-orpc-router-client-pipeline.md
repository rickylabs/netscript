---
rfc: 0000
title: oRPC-native procedure pipeline and router client
status: Draft
authors: ["@rickylabs"]
created: 2026-11-25
tracking-issue: https://github.com/rickylabs/netscript/issues/2671
target-milestone: Backlog / Triage
---

# oRPC-native procedure pipeline and router client

> **Draft evaluation notice.** This document is a **Draft** evaluation RFC produced for technical review. It does not authorize implementation changes under `packages/`, `plugins/`, `docs/site/`, `.github/`, or `deno.lock`. Every statement about current NetScript or oRPC behavior below is tagged as **source-inspected** or **measured** (from the locked `@orpc/*@1.15.5` runtime probes in the run folder); proposed designs are tagged as **derived**.

## Summary

NetScript currently enforces authentication, path-based contract authorization, rate limiting, request logging, and HTTP tracing inside Hono middleware outside oRPC, while exposing RPC procedures over HTTP via `RPCLink`. As a result, calling a service router directly in-process via oRPC's `createRouterClient` or `call` bypasses authentication, contract authorization, rate limiting, and unified request logging. This RFC inventories every Hono middleware and service primitive in NetScript, classifies each as **transport-only**, **procedure-level**, or **split**, and designs an oRPC-native procedure pipeline that preserves NetScript's security invariants across both HTTP and in-process `createRouterClient` calls without double-authenticating or weakening HTTP edge defenses. Empirical probes against the locked `@orpc/*@1.15.5` stack show that `createRouterClient` through an oRPC-native procedure pipeline reduces per-call latency by **3.3×–10.6×** over the fetch-based in-process link proposed in draft PR #2659 (`rfcs/0000-in-process-service-link.md`, head `d2c0e05b`) and **6.8×–21.9×** over HTTP loopback on unary calls, while maintaining full authn, contract authz, internal-audience anti-spoofing, shared post-auth logical rate limiting, OpenTelemetry tracing, and `AbortSignal` parity. We recommend **Option 3 — Stage into Coexistence**: land #2659's fetch-link for HTTP-edge parity testing and opaque `ServiceApp` mounting alongside migrating contract authorization and procedure concerns into NetScript's oRPC procedure pipeline on v1, then expose the public typed `createRouterClient` API aligned with oRPC v2 (see companion RFC `#2672`) so both in-process modes coexist with clear selection rules and downstream applications migrate once.

## Motivation

### Current gap (**source-inspected**)

In current `main` (`87965d800`), `ServiceBuilderImpl` (`packages/service/src/builder/service-builder-impl.ts`) mounts every cross-cutting security and operational policy on the Hono HTTP layer:

- `createAuthnMiddleware` and `createAuthzMiddleware` (`packages/service/src/auth/auth-middleware.ts`) run as Hono middleware over `Context.req.method` and `Context.req.path`.
- `createContractAuthorizer` (`packages/service/src/auth/contract/contract-authorizer.ts`) compiles the contract tree into a `rou3` URL matcher (`packages/service/src/auth/contract/contract-procedure-index.ts`) using `@orpc/client/standard` `toHttpPath`, `@orpc/openapi/standard` `toRou3Pattern`, and `@orpc/contract` `fallbackContractConfig` so Hono can infer which oRPC procedure an HTTP request will hit before `RPCHandler` or `OpenAPIHandler` dispatches it.
- `createRateLimitMiddleware` (`packages/service/src/rate-limit/middleware/rate-limit-middleware.ts`) runs as eager Hono `.use()` middleware *before* authentication, keying on IP/`remoteAddr` or custom `HonoContext` extractors. Post-auth principal/tenant quotas were explicitly deferred in RFC 0008 because Hono middleware runs pre-auth.
- `loggerMiddleware` (`packages/logger/middleware.ts`) sets a Hono `requestId` (`X-Request-ID`) and LogTape context, whereas `LoggingPlugin` (`packages/logger/orpc-plugin.ts:278`) inside oRPC generates an **independent, uncorrelated** `requestId` via `crypto.randomUUID().slice(0, 8)` because it has no access to the Hono request ID.
- `buildRpcContext` (`packages/service/src/builder/service-builder-impl.ts:319-342`) copies `c.get('principal')`, `db`, and `traceHeaders` into oRPC `initialContext` only inside the HTTP `wireRpc` callback (`packages/service/src/builder/service-rpc.ts:58-96`).

Because these controls live in Hono rather than in oRPC procedures:

1. **In-process `createRouterClient` / `call()` is unsafe today.** Any server code invoking a router directly via `@orpc/server` bypasses `withAuthn`, `withAuthz`, `createContractAuthorizer`, `withRateLimit`, and `withLogger`. Draft PR #2659 (`rfcs/0000-in-process-service-link.md`, "Alternative 1") explicitly rejected `@orpc/server` `call()` for this exact reason and proposed an in-memory `RPCLink` custom `fetch` feeding `ServiceApp.fetch` instead.
2. **HTTP-only framing overhead persists for trusted in-process calls.** Even with #2659's fetch-link eliminating TCP sockets, every in-process call still constructs a Fetch `Request`, JSON/RPC-encodes the payload, runs Hono route matching + `rou3` contract-index URL parsing + body-limit stream wrapping + CORS snapshotting, decodes the body back into JS objects, encodes the response into a `Response` stream, and decodes it again (**measured**: `259.3 µs` mean for small unary, `380.6 µs` for 100-item / 12.8 KiB payload).
3. **Path-based contract authorization is tightly coupled to oRPC v1 internals.** `contract-procedure-index.ts` imports `toHttpPath`, `toRou3Pattern`, `fallbackContractConfig`, and `HTTPMethod` — all four of which are removed in oRPC v2 (`2.0.0-beta.53`, **measured** in companion RFC `#2672`). Reconstructing procedure identity from HTTP URLs is inherently fragile across aliases, deprecated prefixes, RPC vs OpenAPI dual mounts, and URL normalization.

### What this enables

Moving procedure-level concerns into an oRPC-native procedure pipeline (while keeping strictly transport-level defenses at the HTTP edge) unlocks:

- **Safe, zero-framing in-process RPC via `createRouterClient`** for single-process monolith deployments, BFF/Fresh SSR loaders, and internal plugin-to-plugin calls (workers, sagas, triggers) with **3.3×–10.6×** lower latency than fetch-link and **6.8×–21.9×** lower latency than HTTP loopback (**measured**).
- **Procedure-native contract authorization** that inspects the matched procedure's metadata directly (`procedure['~orpc'].meta` in v1; `defineMeta` accessor in v2) with zero URL-to-procedure reconstruction drift and full compatibility with oRPC v2.
- **Post-auth logical quotas** (tenant/principal/procedure buckets sharing `RateLimitStore` identically across HTTP and in-process calls).
- **Unified correlation (`requestId`), tracing, and structured logging** across HTTP and in-process transports.

## Guide-level explanation

> **Derived design.** All code snippets below illustrate the proposed steady-state NetScript developer experience after implementation.

A service author continues to define contracts and handlers once with `createService` or `defineService`. Under the hood, NetScript wraps the service router in its **procedure pipeline** before exposing it to HTTP (`RPCHandler` / `OpenAPIHandler`) or in-process callers (`createRouterClient`):

```ts
import { createService } from '@netscript/service';
import { createContractAuthorizer } from '@netscript/service/auth';
import { createMemoryRateLimitStore } from '@netscript/service/rate-limit';
import { ordersContract } from '@app/contracts/orders';
import { ordersRouter } from './routers/orders.ts';

const sharedQuotaStore = createMemoryRateLimitStore();

const ordersService = createService(ordersRouter, { name: 'orders' })
  .withLogger()
  .withCors({ origins: ['https://app.example.com'] }) // HTTP transport-only
  .withBodyLimit({ maxBytes: 1_048_576 })            // HTTP transport-only
  .withAuthn({ authenticator })                      // Dual-layer: HTTP edge + procedure pipeline
  .withAuthz({ authorizer: createContractAuthorizer(ordersContract) }) // Procedure-native
  .withProcedureRateLimit({                          // Post-auth logical quota (HTTP + in-process)
    store: sharedQuotaStore,
    limit: 120,
    windowMs: 60_000,
    key: ({ principal, procedurePath }) =>
      `${principal?.claims.tenantId ?? 'global'}:${principal?.subject ?? 'anon'}:${procedurePath.join('.')}`,
  })
  .withRPC();

// 1. Serve over HTTP as before:
const running = await ordersService.serve();

// 2. Or create a typed, guarded in-process client for BFF / SSR / co-located services:
const inProcessOrders = ordersService.createRouterClient({
  contributions: [bearerContribution] as const,
  propagateTraceContext: true, // Explicit W3C trace opt-in; caller ALS is always detached
});

// Enforces authn, contract authz, internal-audience checks, logical rate limit,
// tracing, logging, Zod validation, and AbortSignal — with zero HTTP framing:
const order = await inProcessOrders.getOrder(
  { orderId: 'ord_42' },
  { context: { token: userBearerToken }, signal },
);
```

When a test or co-located monolith needs full HTTP-edge semantics (CORS headers, `withBodyLimit` 413 checks, `Set-Cookie` responses from `plugins/auth`, raw Hono routes, or JSON wire-codec verification), it continues to use the fetch-link transport from PR #2659:

```ts
// Full HTTP-edge parity (CORS, body limit, raw routes, wire codec, cookies):
const httpParityClient = createServiceClient({
  contract: ordersContract,
  serviceName: 'orders',
  transport: createInProcessServiceLink({ app: ordersService.build() }), // PR #2659
  contributions: [bearerContribution] as const,
});
```

## Reference-level explanation

### 1. Complete inventory and classification of Hono middleware and service primitives (**source-inspected**)

Every middleware, handler, plugin, and primitive currently registered in `packages/service`, `packages/telemetry`, `packages/logger`, `packages/plugin`, and first-party `plugins/*` was source-inspected and classified into **transport-only** (must stay at the HTTP edge), **procedure-level** (moves into oRPC middleware/interceptors), or **split** (HTTP edge retains transport-specific duties; procedure pipeline owns domain/RPC duties):

| Component & source location (**source-inspected**) | Current mount & execution order | Classification | Rationale & target placement (**derived**) |
| --- | --- | --- | --- |
| `createHonoTracingMiddleware` (`packages/telemetry/src/hono/otel-middleware.ts`) | `ServiceBuilderImpl` constructor (`this.app.use('*', ...)`), first Hono layer | **Transport-only** | Owns HTTP `SERVER` span (`http.request.method`, `url.path`, status code) and HTTP header W3C extraction. Procedure spans on both HTTP and `createRouterClient` are owned by `ORPCInstrumentation` (`@orpc/otel` in v1; `@orpc/opentelemetry` in v2) + `TracingPlugin`. |
| `withCors()` / `createServiceCorsMiddleware` (`packages/service/src/middleware/service-cors.ts`) + hardcoded `new CORSPlugin()` (`packages/service/src/primitives/handlers.ts:112`) | Eager `.use()` in call order; snapshots/restores 6 CORS headers to override `handlers.ts`'s `CORSPlugin` | **Transport-only** | Browser cross-origin preflight/header policy has no meaning in-process. Keep `createServiceCorsMiddleware` at HTTP edge; remove the redundant wildcard `CORSPlugin` in `handlers.ts` (also prevents oRPC v2 `CORSHandlerPlugin` `origin: '*'` drift). |
| `withLogger()` / `loggerMiddleware` (`packages/logger/middleware.ts`) & `LoggingPlugin` (`packages/logger/orpc-plugin.ts`) | `loggerMiddleware`: eager `.use()`, parses/mints `X-Request-ID`, logs HTTP access, wraps LogTape `withContext`. `LoggingPlugin`: inside `RPCHandler`/`OpenAPIHandler` `clientInterceptors`, mints a *second* `requestId`. | **Split** | HTTP access log + `X-Request-ID` header I/O stay **transport-only**. Unified `requestId` propagation, LogTape context binding, and procedure start/finish/redacted-debug logging move to **procedure-level** (eliminating the duplicate uncorrelated `requestId`). |
| `withRateLimit()` / `createRateLimitMiddleware` (`packages/service/src/rate-limit/middleware/rate-limit-middleware.ts`) | Eager `.use()` (runs *before* `build()`-deferred authn/authz); keys on `remoteAddr` / `trustProxy` or `key(HonoContext)`. | **Split** | Pre-auth socket/IP volumetric protection stays **transport-only** (`X-Forwarded-For`, `remoteAddr`, `Retry-After` HTTP headers). Post-auth logical/principal/tenant/procedure quotas (deferred in RFC 0008) become **procedure-level** sharing the exact same `RateLimitStore` port. |
| Custom `.use(mw)` (e.g., `plugins/auth/services/src/request-context.ts` `withAuthRequest` ALS) | Eager `.use()` in call order (runs before deferred auth/body-limit). | **Transport-only** | Operates on raw Hono `Context` / `c.req.raw` / `Set-Cookie` headers (`plugins/auth` cookie jar). Procedures that must read/write browser cookies remain HTTP-edge operations unless a cookie-free bearer/session contract is invoked. |
| `withAuthn()` / `createAuthnMiddleware` (`packages/service/src/auth/auth-middleware.ts`, `composite-authenticator.ts`, `trusted-header-authenticator.ts`, `internal-credential-authenticator.ts`, `packages/plugin-auth-core/src/adapters/auth-service-authenticator.ts`) | Deferred to `build()` (`installAuth`), runs *before* `withBodyLimit` and routes. Supports `responseHeaders` (e.g., refresh-on-read `Set-Cookie`). | **Split (dual-layer, single execution)** | **HTTP edge** runs `AuthenticatorPort` before `withBodyLimit` on guarded HTTP paths (preserving 401-before-413, 404/410 anti-oracle, raw routes, and `Set-Cookie` `responseHeaders`), then stamps a module-private `WeakSet<Principal>` brand onto the verified `Principal`. **Procedure pipeline** checks the brand: if present, reuses `principal` without re-authenticating; otherwise invokes the same `AuthenticatorPort` over a request-less `AuthnRequest` synthesized from context headers. |
| `withAuthz()` / `createAuthzMiddleware`, `createContractAuthorizer`, `createContractOverlayAuthorizer`, `createScopeAuthorizer` (`packages/service/src/auth/*`) | Deferred to `build()` immediately after `withAuthn`. Compiles `contract-procedure-index.ts` (`rou3` + `toHttpPath` + `toRou3Pattern`). | **Split (procedure-native core + thin HTTP route guard)** | Procedure authorization (`authentication`, `audience: 'internal'`, `scopes`, `roles`, fallback `AuthorizerPort`) moves into **procedure-level** reading procedure metadata directly (`procedure['~orpc'].meta` / v2 `defineMeta`). **HTTP edge** retains only a thin pre-dispatch gate covering `rawRoutes`, `/api/openapi.json`, `/api/docs`, `retiredPaths`, and unknown-path unauthenticated rejection (401 before 404/410/413). |
| `withBodyLimit()` / `createBodyLimitMiddleware` (`packages/service/src/primitives/body-limit.ts`) | Deferred to `build()` (`installBodyLimit`), strictly *after* `installAuth`. Uses `hono/body-limit` streaming byte cap (`413`). | **Transport-only** | Guards HTTP byte-stream parsing against memory/DoS exhaustion from untrusted network callers. In-process callers already hold in-memory JS objects validated by Zod schemas; no HTTP body stream exists. |
| `withHealth()` (`/health`, `/health/live`, `/health/ready`, `packages/service/src/primitives/health.ts`) & `withServiceInfo()` (`/`) | `withHealth`: deferred in `build()`. `withServiceInfo`: eager `app.get('/')`. | **Transport-only** | Infrastructure HTTP probe endpoints consumed by orchestrators (Aspire, Kubernetes, load balancers). |
| `withOpenAPI()` (`/api/openapi.json`) & `withDocs()` (`/api/docs`, `/api/docs/scalar.js`, `packages/service/src/primitives/openapi.ts`) | Deferred in `build()` (`installDeferredRoutes`). | **Transport-only** | HTTP documentation & OpenAPI specification endpoints. |
| `withRPC()` / `wireRpc` (`packages/service/src/builder/service-rpc.ts`, `packages/service/src/primitives/handlers.ts`) | Deferred in `build()`. Mounts `RPCHandler` (`/api/rpc/*`, `rpcAliases`, `deprecatedRpcRoutes`) and `OpenAPIHandler` (`/api/*`) with `TracingPlugin`, `ErrorHandlingPlugin`, `LoggingPlugin`, `CORSPlugin`, `ZodSmartCoercionPlugin`. | **Split** | HTTP wire handlers (`RPCHandler`, `OpenAPIHandler`, `ZodSmartCoercionPlugin` / v2 `SmartCoercionHandlerPlugin`, `rpcAliases`, `deprecatedRpcRoutes`) stay **transport-only**. `TracingPlugin`, `ErrorHandlingPlugin`, and `LoggingPlugin` procedure interceptors move to **procedure-level** so they execute on both HTTP and `createRouterClient`/`call`. |
| `route()` custom raw routes (`service-builder-impl.ts:470`) | Deferred in `build()` after `wireRpc`. | **Transport-only** | Arbitrary Hono HTTP handlers outside oRPC. |
| `startServiceListener()` (`packages/service/src/builder/service-listener.ts`) | `serve()` only: `Deno.serve`, TLS/ALPN, `hostname`, `remoteAddr`, graceful shutdown signals. | **Transport-only** | OS socket binding and lifecycle. |
| Plugin SSE / streaming RPC procedures (`plugins/workers` `subscribe`, `plugins/sagas` `subscribe`, `plugins/triggers` `subscribeEvents`, `plugins/ai` `chat`) | oRPC `eventIterator` / `AsyncIteratorObject` procedures inside mounted routers. | **Procedure-level** | Native oRPC async iterators work directly over `createRouterClient` (with `signal` and `lastEventId`) with zero SSE framing/parsing overhead! |
| Non-RPC plugin HTTP routes (`plugins/streams/services/src/service.ts` `serveRpc: false` reverse proxy; `plugins/triggers/services/src/raw-trigger-routes.ts` HMAC webhooks `POST /api/v1/webhooks/:triggerId` & `GET /api/v1/events`; `plugins/ai` Fresh `stream-proxy.stub.ts`) | Raw Hono routes (`route()`) or Fresh HTTP handlers; external HTTP HMAC signatures / stream proxying. | **Transport-only** | Must remain HTTP endpoints. Note: internal **callbacks** dispatched *by* workers/sagas/triggers to service RPC procedures (especially `audience: 'internal'`) can use `createRouterClient` when co-located! |
| `plugins/auth/services/src/main.ts` & `auth-guard.ts` | Uses `createPluginService` + `withAuthRequest` ALS (`c.req.raw` + `Set-Cookie`) for session-cookie endpoints (`login`, `logout`, `refresh`, `verify`). | **Split** | Token-verification / introspection / admin procedures work cleanly over `createRouterClient`; cookie-issuing browser session endpoints remain HTTP-edge (or fetch-link) because they depend on `Set-Cookie` response headers. |

### 2. Request-less oRPC context and RFC 0001 client contribution projection (**derived**)

#### 2.1 Transport-neutral `NetScriptProcedureContext`

Every procedure wrapped by NetScript's pipeline receives a transport-neutral context shape without referencing `Request` or Hono `Context`:

```ts
export interface NetScriptProcedureContext {
  /** Verified caller identity (trusted ONLY when stamped in framework-private VERIFIED_PRINCIPAL_BRAND). */
  readonly principal?: Principal;
  /** Tenant identifier derived from verified principal claims (or explicit verified scope). */
  readonly tenantId?: string;
  /** Unified correlation identifier propagated from HTTP X-Request-ID or generated once per call. */
  readonly requestId: string;
  /** Scoped structured logger bound to service + requestId + procedure. */
  readonly logger: Logger;
  /** Optional database handle injected by ServiceBuilder.withDatabase(). */
  readonly db?: DbContext;
  /** Transport discriminator for telemetry/diagnostics (never used to weaken authorization!). */
  readonly transport: 'http' | 'in-process';
  /** Normalized lower-case headers (from HTTP Request or RFC 0001 contribution projection). */
  readonly headers?: Readonly<Record<string, string>>;
  /** Optional W3C traceparent/tracestate carrier. */
  readonly traceHeaders?: Readonly<Record<string, string>>;
}
```

Two **source-inspected / measured** pitfalls in current NetScript directly govern how this context is constructed:

1. **`ServiceBuilderImpl.buildRpcContext()` overwrite & ordering (`packages/service/src/builder/service-builder-impl.ts:319-342`):** Today `buildRpcContext` returns `{ ...this.contextFactory(c), db, traceHeaders, principal: c.get('principal') }`, overwriting any `principal` returned by `.withContext()`. Therefore, HTTP-edge principal branding MUST happen inside `createAuthnMiddleware` (adding the exact `Principal` object returned by `AuthenticatorPort` to the module-private `VERIFIED_PRINCIPAL_BRAND = new WeakSet<Principal>()`), NOT in user `.withContext()` code.
2. **Anti-forging for unbranded `principal` (**measured** in Parity Probe Test 1.8):** If an in-process caller passes a hand-constructed `{ principal: { subject: 'user:admin', ... } }` into `createRouterClient` context without going through a trusted framework authenticator, `VERIFIED_PRINCIPAL_BRAND.has(context.principal)` is `false`. The pipeline ignores the unbranded object, runs `AuthenticatorPort` against `context.headers`, and fails closed with `401 UNAUTHORIZED`. Server-side trusted delegation (e.g., an authenticated HTTP BFF forwarding its already-verified `context.principal` to a co-located downstream service in the same process) works safely ONLY when passing a brand-verified `Principal` *and* only when the downstream service explicitly opts in to `trustSharedPrincipal: true` (default `false` so internal services still validate their own `audience` / `internal-credential` token by default!).

#### 2.2 Projecting RFC 0001 SDK client contributions without a `Request`

**Source-inspected** in `packages/sdk/src/internal/client-contributions/stable-v1-adapter.ts` and `packages/sdk/src/ports/sdk-client-contribution.ts`: RFC 0001 forbids exposing raw oRPC link types to contributors. Contributions declare:

- required/optional caller `context` fields,
- `prepare()` returning normalized HTTP header entries (e.g., `authorization: Bearer <token>`, `accept-language: de-CH`),
- `responseCache` partition keys (`serverSuffix` / `querySuffix`),
- transport support metadata (`supportedTransports`).

To project RFC 0001 contributions onto `createRouterClient` without constructing a `Request`:

1. Extract the transport-neutral `prepareCall(procedurePath, callerContext, signal)` helper from `stable-v1-adapter.ts` so both `RPCLink` and `createRouterClient` run the exact same contribution validation, conflict checks, redaction (`SdkClientContributionError`), and `CacheQuery` partition key computation (`getServiceClientContributionRuntime`).
2. Add `'in-process-router'` to the contribution transport capability set. Contributions that emit only request headers and cache partitions (bearer auth, internal-credential derivation, locale, future devtools trace/metadata headers) work identically on HTTP, fetch-link, and router-client. Contributions requiring raw HTTP response mutation or transport-specific hooks fail fast at construction with `SDK_CONTRIBUTION_TRANSPORT_UNSUPPORTED`.
3. Inside `createRouterClient(pipelineRouter, { context, interceptors })`, the `context` factory receives the prepared lower-case `headers: Readonly<Record<string, string>>` plus `requestId` and `traceHeaders`. Inside the procedure pipeline, `toRequestlessAuthnRequest(headers, procedurePath)` constructs a lightweight `AuthnRequest` (no `URL`, no `Request`, no `ReadableStream`) and passes it directly to the service's exact `AuthenticatorPort` (static credential, internal HMAC credential, JWT/OIDC verifier, or composite authenticator).

#### 2.3 AsyncLocalStorage & OpenTelemetry trace isolation (**measured** in Parity Probe Test 3)

In-process calls execute on the caller's JS call stack, creating two hazards if left unguarded:

- **Accidental ALS leakage:** Caller-side `AsyncLocalStorage` stores (e.g., caller's database transaction handle, caller's auth request context, caller's LogTape properties) automatically propagate into the callee's handler unless detached.
- **Ambiguous trace linkage:** Always inheriting the caller's active OTel span couples background/detached jobs to an already-ended HTTP span, whereas always dropping it breaks distributed traces for synchronous BFF→service calls.

**Design (proven in Parity Probe Test 3):**

1. Capture `const cleanAlsSnapshot = AsyncLocalStorage.snapshot()` at module initialization time (outside any request ALS).
2. Wrap every `createRouterClient` invocation in an oRPC client interceptor (`createProcedureClient`'s `options.interceptors` — **source-inspected** in `@orpc/server@1.15.5/dist/shared/server.DEBcqOjg.mjs`, executed directly inside `createProcedureClient`):
   - If `propagateTraceContext === true` (default for synchronous request-scoped clients), inject W3C `traceparent`/`tracestate` from `otelContext.active()` into a plain object carrier *before* detaching ALS.
   - Enter `cleanAlsSnapshot(...)` — detaching 100% of caller `AsyncLocalStorage` stores (including `userAls`, caller LogTape context, caller DB tx).
   - Explicitly re-enter OTel context via `withContext(propagateTraceContext ? extractContext(carrier) : extractContext({}), () => options.next())`.
3. `ORPCInstrumentation` (`@orpc/otel` in v1; `@orpc/opentelemetry` in v2) wraps `createProcedureClient` natively via `runWithSpan('call_procedure')`, emitting `call_procedure`, `middleware.<name>`, and `handler` spans on **both** HTTP and `createRouterClient` (**measured** in Parity Probe Test 3: all three spans captured with exact caller `traceId` when `propagateTraceContext: true`, fresh detached `traceId` when `false`, and `userAls === undefined` in both cases).

### 3. Procedure-based contract authorization without weakening any security check

#### 3.1 How oRPC executes router-level middleware (**source-inspected** & **measured**)

Source inspection of `@orpc/server@1.15.5/dist/shared/server.DEBcqOjg.mjs` (`enhanceRouter` / `os.use(...).router(router)`) confirms two critical properties:

1. **Runs on every invocation path:** Wrapping a router with `os.$context<NetScriptProcedureContext>().use(pipelineMiddleware).router(router)` prepends `pipelineMiddleware` onto every procedure leaf's `['~orpc'].middlewares` array. Consequently, it executes identically on `RPCHandler`, `OpenAPIHandler`, `createRouterClient`, **and** bare `call(router.proc, ...)` (**measured** in Parity Probe Test 4.2).
2. **Runs *before* Zod input validation:** `enhanceRouter` shifts each procedure's `inputValidationIndex` forward by the number of prepended router middlewares. Thus authentication and contract authorization execute *before* input schema validation — unauthenticated callers sending malformed payloads receive `401 UNAUTHORIZED`, never `400 BAD_REQUEST` schema error details (**measured** in Parity Probe Test 4.3).

#### 3.2 Direct procedure metadata lookup (retiring `contract-procedure-index.ts` for RPC/OpenAPI)

Instead of reconstructing which procedure an HTTP path corresponds to via `rou3` + `toHttpPath` + `toRou3Pattern`, the pipeline middleware reads the matched procedure directly:

- **On oRPC v1 (`1.15.5`):** `procedure['~orpc'].meta?.access` (identical `NetScriptProcedureMeta` already authored on `baseContract` procedures).
- **On oRPC v2 (`2.0.0`):** `getNetScriptAccessMeta(procedure)` backed by `@orpc/contract` `defineMeta` (zero dependency on `~orpc.route`, `toHttpPath`, `toRou3Pattern`, or `fallbackContractConfig`).
- Authorization evaluation reuses NetScript's existing pure policy engine `authorizeProcedurePolicy` (`packages/service/src/auth/contract/procedure-policy-decision.ts`) and `isInternalServicePrincipal` (`packages/service/src/auth/internal-credential/internal-credential-authenticator.ts`) verbatim (**measured** in Parity Probe Test 1).
- Procedures missing an explicit `access` block default to `{ authentication: 'required', requiredScopes: [], requiredRoles: [] }` (fail-closed default-deny preserved).

#### 3.3 Preserving every HTTP-edge security invariant

Moving procedure authorization into oRPC **must not** regress any HTTP-edge invariant tested in `packages/service/tests/`. The dual-layer boundary preserves all six:

| Security invariant (**source-inspected**) | How HTTP edge enforces it | How `createRouterClient` enforces it | Weakened? |
| --- | --- | --- | --- |
| **1. Default-deny / fail-closed** (`service-auth-policy_test.ts`) | Guarded prefixes (`/api/*`, `/api/rpc/*`, protected `rawRoutes`) require auth unless explicitly declared `authentication: 'none'` or in `allowAnonymous`. | Procedure pipeline defaults missing `access` meta to `authentication: 'required'`; unauthenticated calls throw `UNAUTHORIZED`. | **No** |
| **2. 401-before-413 body limit** (`packages/service/tests/body-limit_test.ts:234-260`) | HTTP edge retains pre-body-limit authn check on non-public HTTP paths (`installAuth` stays before `installBodyLimit`). Brand-verified `Principal` is passed to oRPC so authn runs **once** (**measured** in Parity Probe Test 2: `authnCalls.count === 0` on HTTP path). | N/A — no HTTP byte stream exists; authn still executes before Zod input validation (**measured** Test 4.3). | **No** |
| **3. 404/410 availability oracle protection** (`contract-authorizer.ts:36-37`, `procedure-availability_test.ts`) | Because `RPCHandler` returns `{ matched: false }` for unknown or retired paths before procedure middleware runs, HTTP edge keeps a minimal anonymous-allowlist check (only public `authentication: 'none'` paths and `allowAnonymous` pass unauthenticated to routing; all other unauthenticated HTTP requests fail with `401` before reaching `404` or `410`!). | `createRouterClient` invokes typed procedures directly on a compiled router object; there is no unauthenticated URL probing surface. | **No** |
| **4. `audience: 'internal'` anti-spoofing** (`internal-procedures_test.ts`) | `authorizeProcedurePolicy` checks `isInternalServicePrincipal(principal)` (module-private `WeakSet` brand stamped exclusively by `createInternalCredentialAuthenticator`). User tokens spoofing `subject: 'netscript:internal'` and `roles: ['service', 'internal']` are rejected with `403 authz.internal-audience`. | Identical `authorizeProcedurePolicy` + `isInternalServicePrincipal` runs inside procedure pipeline (**measured** in Parity Probe Test 1.5–1.6). | **No** |
| **5. Unbranded `Principal` anti-forging** | HTTP edge stamps `VERIFIED_PRINCIPAL_BRAND` inside `createAuthnMiddleware`; `buildRpcContext` cannot be spoofed by headers. | Unbranded plain `Principal` objects injected into `createRouterClient` context are ignored; pipeline falls back to `AuthenticatorPort` and fails closed with `401` (**measured** in Parity Probe Test 1.8). | **No** |
| **6. Raw routes & overlay authorizers** (`contract-raw-routes.ts`, `contract-overlay-authorizer.ts`) | Non-oRPC Hono routes (`rawRoutes`, `plugins/streams`, `plugins/triggers` webhooks, `/api/openapi.json`, `/api/docs`) continue using HTTP-edge Hono authz; overlay checks run on both layers via `AuthorizerPort`. | `createRouterClient` only exposes oRPC procedures; overlay `AuthorizerPort` hooks run inside procedure pipeline if configured. | **No** |

#### 3.4 Empirical edge case: Router-level `ORPCError` schema reconciliation (**measured**)

During parity probe development, a critical oRPC behavior was uncovered:

- In `@netscript/contracts` (`packages/contracts/src/domain/schemas.ts:100-121`), `commonErrorMap` attaches strict Zod object schemas to `UNAUTHORIZED` (`{ reason?: 'missing_token' | 'invalid_token' | 'expired_token' }`), `FORBIDDEN` (`{ requiredRole?: string; userRole?: string }`), `RATE_LIMITED` (`{ retryAfter: number; limit: number }`), and `SERVICE_UNAVAILABLE` (`{ retryAfter?: number; reason?: string }`).
- When router-level middleware (`os.use(...)`) throws `new ORPCError('UNAUTHORIZED', { status: 401, message: '...' })` without `defined: true` **and** a `data` object conforming to the procedure's error schema, oRPC's `validateORPCError` downgrades `defined` to `false` — breaking `isDefinedError()` and `safe()` narrowing on the client!
- **Required implementation rule:** The procedure pipeline MUST construct contract-aligned error payloads matching `commonErrorMap` (e.g., `data: { reason }` for `UNAUTHORIZED`, `data: {}` for `FORBIDDEN`, `data: { retryAfter, limit }` for `RATE_LIMITED`) and reconcile `defined` against `procedure['~orpc'].errorMap` (on v1) or `reconcileORPCError` (on v2). Parity Probe Test 1.2 & 1.7 verified `isDefinedError === true` and `safe()` narrowing once reconciled.

### 4. What an in-process `createRouterClient` call gets vs deliberately omits

| Concern | `createRouterClient` (RFC A) | Fetch-link (#2659) | HTTP loopback | Why omission on `createRouterClient` is safe (or what caveats apply) |
| --- | --- | --- | --- | --- |
| Authentication (`AuthenticatorPort`) | **Yes** | Yes | Yes | Runs inside procedure pipeline before input validation. |
| Contract-meta authz (`scopes`, `roles`, `audience: 'internal'`) | **Yes** | Yes | Yes | Direct procedure-meta lookup; zero path-matching drift. |
| Post-auth logical rate limiting (`RateLimitStore`) | **Yes** | Yes (once pipeline lands) | Yes (once pipeline lands) | Shared store enforces identical quota across HTTP and in-process (**measured** Test 2). |
| Pre-auth IP / `remoteAddr` rate limit | **No** | Synthetic/none | Yes | In-process caller has no network socket/IP; logical principal/tenant quota replaces IP throttling. |
| CORS (`withCors`) | **No** | Yes | Yes | Same-origin browser enforcement has no meaning for trusted server-to-server JS calls. |
| HTTP body byte limit (`withBodyLimit` 413) | **No** | Yes | Yes | No untrusted HTTP byte stream is parsed; caller already holds in-memory JS values validated by Zod input schema. (Caveat: if forwarding untrusted external payloads, validate/cap at the outer ingress boundary.) |
| HTTP compression / TLS / ALPN / Host policy | **No** | No (except compression plugins) | Yes | Local process memory; no wire transport. |
| Zod input & output validation | **Yes** | Yes | Yes | Runs natively inside oRPC procedure execution. |
| Reference isolation / object aliasing | **Conditional** | Always (JSON clone) | Always (JSON clone) | **Measured (Parity Probe Test 5):** Procedures declaring a Zod `.output(...)` schema (NetScript's contract-first norm) produce a cloned object tree via Zod parse, isolating server state from caller mutation. **Caveat:** Schema-less procedures return the exact JS object reference — NetScript MUST warn or deep-freeze/clone if an untrusted schema-less procedure is exposed via router-client! |
| OTel spans & ALS detachment | **Yes** | Yes (via `Hono` + `ORPCInstrumentation`) | Yes | `ORPCInstrumentation` + `AsyncLocalStorage.snapshot()` interceptor (**measured** Test 3). |
| Unified `requestId` & structured logging | **Yes** | Yes | Yes | Single `requestId` flows through pipeline & `LoggingPlugin`. |
| `AbortSignal` cancellation | **Yes** | Yes | Yes | Native `signal` forwarded to handler & `RateLimitStore` (**measured** Test 4.1). |
| `eventIterator` / `AsyncIteratorObject` streaming | **Yes (zero SSE framing)** | Yes (SSE encode/decode) | Yes (HTTP SSE) | Direct JS async iterator; avoids SSE serialization overhead. |
| `Set-Cookie` / raw HTTP headers / raw Hono `route()` | **No** | **Yes** | **Yes** | Use fetch-link (#2659) or HTTP when invoking cookie-issuing auth endpoints (`plugins/auth`) or non-oRPC routes (`plugins/streams`, `plugins/triggers` webhooks). |
| Wire codec round-trip (`Date`/`BigInt`/JSON serialization) | **No** | **Yes** | **Yes** | Contract tests verifying HTTP wire serialization must still use fetch-link or HTTP loopback. |

### 5. Empirical measurements against locked `@orpc/*@1.15.5` (**measured**)

Both probes were executed with `mise exec -- deno run/test --frozen -A` against locked `@orpc/*@1.15.5` on Deno `2.9.5` (zero edits to `packages/`, `plugins/`, or `deno.lock`). To ensure an apples-to-apples transport comparison free of terminal I/O distortion, `overhead-benchmark.probe.ts` injects an identical silent logger into both Hono apps and the router-client pipeline while executing identical SHA-256 subject-hash audit computation, static bearer authentication, contract-meta scope authorization, and `MemoryRateLimitStore` consumption across all modes.

#### 5.1 Call overhead benchmark (50 warmup + 500 measured iterations; `probes/overhead-benchmark.probe.ts`, `probes/overhead-results.json`)

| Scenario | Transport mode | Mean (µs) | p50 (µs) | p95 (µs) | p99 (µs) | Throughput (ops/s) | Speedup vs HTTP | Speedup vs Fetch-link |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **Small unary** (~100 B) | HTTP loopback (`Deno.serve` + `RPCLink`) | 536.5 | 466.1 | 863.3 | 2,234.6 | 1,864 | 1.0× | 0.5× |
| Small unary (~100 B) | Fetch-link in-process (#2659 model) | 259.3 | 211.0 | 429.5 | 1,214.2 | 3,856 | 2.1× | 1.0× |
| Small unary (~100 B) | `createRouterClient` (with full authn) | **78.7** | **52.1** | **101.7** | 813.1 | **12,701** | **6.8×** | **3.3×** |
| Small unary (~100 B) | `createRouterClient` (brand-verified principal) | **24.5** | **20.2** | **44.9** | 91.1 | **40,815** | **21.9×** | **10.6×** |
| **Medium list** (100 items, 12,822 B JSON) | HTTP loopback (`Deno.serve` + `RPCLink`) | 745.6 | 696.6 | 1,072.9 | 1,579.8 | 1,341 | 1.0× | 0.5× |
| Medium list (100 items, 12,822 B JSON) | Fetch-link in-process (#2659 model) | 380.6 | 338.1 | 578.8 | 1,225.8 | 2,627 | 2.0× | 1.0× |
| Medium list (100 items, 12,822 B JSON) | `createRouterClient` (with full authn) | **48.1** | **41.3** | **71.5** | 112.3 | **20,800** | **15.5×** | **7.9×** |
| Medium list (100 items, 12,822 B JSON) | `createRouterClient` (brand-verified principal) | **36.4** | **29.2** | **57.1** | 123.9 | **27,448** | **20.5×** | **10.5×** |
| **Concurrent burst** (20 × 25 = 500 calls) | HTTP loopback (`Deno.serve` + `RPCLink`) | — | — | — | — | 5,191 | 1.0× | 0.6× |
| Concurrent burst (20 × 25 = 500 calls) | Fetch-link in-process (#2659 model) | — | — | — | — | 8,574 | 1.7× | 1.0× |
| Concurrent burst (20 × 25 = 500 calls) | `createRouterClient` (with full authn) | — | — | — | — | **30,828** | **5.9×** | **3.6×** |
| Concurrent burst (20 × 25 = 500 calls) | `createRouterClient` (brand-verified principal) | — | — | — | — | **68,324** | **13.2×** | **8.0×** |

**Key measurement takeaway:** Fetch-link (#2659) removes ~50% of HTTP loopback latency (TCP socket + kernel syscall overhead), leaving ~259–381 µs of Fetch `Request`/`Response` allocation, JSON/RPC encode+decode, Hono routing, and `rou3` contract-index matching. `createRouterClient` eliminates that remaining framing layer entirely, scaling especially strongly as payload size grows (**7.9×–10.5×** faster than fetch-link at just 12.8 KiB JSON).

#### 5.2 Parity & security probe (`probes/router-client-parity.probe.ts` — 5/5 tests passing in 71 ms)

1. **Authn, contract authz, internal-audience anti-spoofing, defined errors & anti-forging:** Verified public `authentication: 'none'` pass-through, fail-closed `401 UNAUTHORIZED` (`isDefinedError === true`), valid scope+role allow with unified `requestId`/`tenantId`/`locale`, missing-scope `403 FORBIDDEN`, spoofed `netscript:internal` user rejection (`403 authz.internal-audience`), genuine HKDF internal-credential allow, custom contract-defined `ORDER_LOCKED` (`409`) narrowing, and rejection of unbranded forged `Principal` objects in context.
2. **Cross-transport shared post-auth logical rate limit & single-authn proof:** Mounted the same `pipelineRouter` on HTTP (`createService`) and `createRouterClient` sharing one `MemoryRateLimitStore` (quota = 2). Call 1 (HTTP) succeeded with `authnCalls.count === 0` (proving HTTP-edge brand reuse avoids double authentication); Call 2 (`createRouterClient`) succeeded (`authnCalls.count === 1`); Calls 3 (`createRouterClient`) and 4 (HTTP) both failed with `429 RATE_LIMITED`.
3. **OTel tracing & ALS isolation:** Verified `ORPCInstrumentation` emits `call_procedure`, `middleware.netscriptProcedurePipeline`, and `handler` spans on `createRouterClient`, `userAls` never leaks into callee handlers (`undefined`), `propagateTraceContext: true` preserves caller `traceId`, and `propagateTraceContext: false` creates a fresh detached root trace.
4. **Cancellation, bare `call()` enforcement, and auth-before-validation ordering:** Verified `AbortSignal` aborts in-flight handler, bare `call(pipelineRouter.getOrder, ...)` enforces authn, and unauthenticated invalid-type input returns `401 UNAUTHORIZED` (not `400 BAD_REQUEST`).
5. **Reference isolation:** Verified Zod `.output(...)` clones outputs isolating server objects from caller mutation, while schema-less procedures alias the underlying JS reference.

## Drawbacks

1. **Two execution layers for auth on HTTP:** Keeping 401-before-413 and 404/410 anti-oracle defenses at the HTTP edge while moving procedure authorization into oRPC requires careful brand handoff (`VERIFIED_PRINCIPAL_BRAND`) so authn never runs twice and error shapes remain consistent across edge and procedure layers.
2. **Two in-process transport options to document:** Coexistence with #2659 means NetScript must give users a crystal-clear selection rule (router client vs fetch-link) so teams do not mistakenly use router-client to test HTTP-only behavior (`withBodyLimit`, `withCors`, `Set-Cookie`, wire serialization).
3. **Aliasing risk for schema-less procedures:** Procedures that omit `.output(...)` return live JS references over `createRouterClient`. While NetScript's contract-first doctrine requires `.output(...)`, third-party or ad-hoc procedures could accidentally expose mutable state if not guarded.
4. **Upstream oRPC v2 alignment:** oRPC v2 (`2.0.0-beta.53`) changes procedure metadata (`defineMeta`), `StandardHandlerPlugin` (`OrderablePlugin` + return-based `init`), `ORPCError` (`status` removed), and `@orpc/opentelemetry`. Shipping a brand-new public `createRouterClient` surface on v1 primitives right before v2 would create avoidable API churn.

## Rationale and alternatives

We evaluated the three strategic options comparing this RFC against draft PR #2659 (`rfcs/0000-in-process-service-link.md`, head `d2c0e05b`):

| Option | Assessment | Verdict |
| --- | --- | --- |
| **1. Replace #2659** (router-client only; drop fetch-link) | Eliminates transport duality, but leaves NetScript with **no** zero-socket in-process way to test HTTP-edge middleware (`withBodyLimit`, `withCors`, `Set-Cookie` in `plugins/auth`, raw routes in `plugins/streams`/`plugins/triggers`, `retiredPaths` 410s, wire JSON codec) or to mount an opaque `ServiceApp` whose raw router is not exposed. | **Rejected** — fetch-link solves legitimate HTTP-parity & opaque-app problems that `createRouterClient` intentionally omits. |
| **2. Coexist immediately on v1** (ship both public APIs in parallel on `@orpc/*@1.15.5`) | Gives immediate performance gains, but exposes a brand-new v1-shaped `createRouterClient` / `ServiceHandlerPlugin` public API right before oRPC v2 replaces `oc.$meta`, `ORPCError.status`, and handler plugin contracts — forcing downstream applications through two migrations. | **Rejected** — avoidable public-API churn across v1→v2. |
| **3. Stage into Coexistence** (Recommended) | **Stage 1 (v1):** Land #2659 fetch-link for immediate in-process HTTP parity & testing; simultaneously refactor NetScript's internal service pipeline so contract-meta authz, procedure error/logging/tracing, and post-auth logical rate limiting live in oRPC middleware (immediately hardening HTTP services, unifying `requestId`, and deleting `contract-procedure-index.ts`'s 4 v2-broken imports). **Stage 2 (aligned with RFC B / oRPC v2):** Expose `service.createRouterClient(...)` and RFC 0001 `'in-process-router'` contribution projection as a first-class public API on oRPC v2's `createRouterClient` + `defineMeta` + `@orpc/opentelemetry` foundation. Both transports then **coexist permanently** with crisp guidelines. | **Recommended** |

### Coexistence selection guide (steady state)

- **Use `createRouterClient` (RFC A)** for trusted in-process service-to-service calls, Fresh SSR / BFF data loading, co-located workers/sagas/triggers internal RPC, `eventIterator` live streams, and high-fan-out compositions where you hold the service builder/router and want 3–22× lower overhead.
- **Use fetch-link (#2659)** for HTTP-edge integration tests (`withBodyLimit`, `withCors`, `retiredPaths`, HTTP status codes, wire codec fidelity), cookie-bearing browser/auth flows (`plugins/auth` `Set-Cookie`), non-oRPC routes (`plugins/streams`, `plugins/triggers` webhooks), and calling an opaque `ServiceApp`.

## Downstream consumers

> All downstream impact analysis below applies generically to any downstream application built on NetScript.

### Public API, behavior changes, and deprecations

- **Additive in Stage 1 (v1):**
  - `ServiceBuilder.withProcedureRateLimit(...)` (post-auth logical quota stage sharing `RateLimitStore`).
  - Unified `requestId` in `LoggingPlugin` (previously emitted a second random ID unrelated to `X-Request-ID`; log parsers correlating HTTP access logs and RPC logs will now see matching IDs).
  - `createContractAuthorizer` switches its internal evaluation for RPC/OpenAPI procedures from `rou3` URL matching to oRPC procedure metadata while keeping its public signature compatible; `contract-procedure-index.ts` internal helpers become deprecated and scheduled for removal in v2.
- **Additive in Stage 2 (v2-aligned):**
  - `ServiceBuilder.createRouterClient(...)` / `createInProcessRouterClient(...)` public API.
  - `'in-process-router'` transport capability on RFC 0001 `SdkClientContribution`.
  - Deprecation of passing raw unguarded routers directly into `@orpc/server` `createRouterClient` / `call` without NetScript's pipeline wrapper.

### Generated code and CLI scaffold changes

- `netscript service` scaffold templates (`packages/cli/src/kernel/assets/service/*`) and plugin service generators (`generate-plugin-service-2.ts.template`) require **no breaking syntax change** in Stage 1: `createService(router, ...).withAuthn(...).withAuthz(...)` automatically wraps `router` in the procedure pipeline.
- In Stage 2, generated service entrypoints (`services/<name>/src/service.ts` or `main.ts`) should export the configured service factory separately from `serve()` (e.g., `export function createOrdersService(deps)`) so co-located callers and BFF routes can call `.createRouterClient(...)` without side-effecting a listening TCP socket at import time.

### Migration steps and codemod

1. **Stage 1 (automatic for standard services):** Downstream applications using `defineService` or `createService(...).withAuthn().withAuthz({ authorizer: createContractAuthorizer(contract) })` gain procedure-level enforcement automatically on upgrade. Applications that manually called `createRPCHandler(rawRouter)` outside `createService` should migrate to `wrapServiceRouter(rawRouter, pipelineOptions)` (automated warning + codemod target).
2. **Stage 2 (opt-in adoption):** Applications currently calling co-located services over HTTP loopback or #2659 fetch-link can switch eligible internal calls to `service.createRouterClient({ contributions })`. Any custom `withContext((c) => ...)` factory that reads HTTP headers (`c.req.header('x-tenant-id')`) to supply data needed by in-process callers should move that projection into an RFC 0001 client contribution or verified `principal.claims` so the procedure has no Hono dependency.
3. **Codemod (`netscript migrate procedure-pipeline`):** Flags direct `c.req.header(...)` reads inside `withContext()`, flags schema-less procedures missing `.output(...)`, and flags direct `@orpc/server` `createRouterClient` / `call` calls on unwrapped routers.

### Configuration changes

- `withRateLimit(...)` remains the pre-auth HTTP edge limiter; new optional `withProcedureRateLimit(...)` configures post-auth principal/tenant/procedure quotas (can share the same `RateLimitStore` instance).
- `ServiceBuilder.createRouterClient({ propagateTraceContext, trustSharedPrincipal, contributions })`:
  - `propagateTraceContext`: defaults to `true` for request-scoped BFF/service calls; set `false` for detached background jobs.
  - `trustSharedPrincipal`: defaults to `false` (fail-closed; caller must supply a contribution credential such as bearer or internal HKDF token). Enable only for explicitly trusted in-process BFF→service delegation where the caller forwards a brand-verified `Principal`.

### Security implications of moving authorization layers

- **Net security improvement:** Closes the current bypass where `call()` / `createRouterClient` skips authn/authz entirely, eliminates URL-normalization/mount-prefix desync bugs between Hono's `rou3` index and oRPC's router, enforces auth *before* input validation on all transports, and prevents forged `Principal` objects via `VERIFIED_PRINCIPAL_BRAND`.
- **Operational risks to audit during rollout:**
  1. Downstream services relying on custom Hono `.use()` middleware *for authorization* (rather than `withAuthn`/`withAuthz`) will **not** have that Hono middleware run on `createRouterClient`. Mitigation: document clearly and provide a startup/lint warning if `.createRouterClient()` is called on a service with custom `.use()` middleware unless explicitly acknowledged.
  2. Downstream services with procedures omitting `.output(...)` risk shared-reference mutation across caller/callee in-process. Mitigation: enforce `.output(...)` in `createRouterClient` strict mode (default `true` in dev/test) or auto-`structuredClone` schema-less outputs.
  3. Downstream HTTP clients testing `401` vs `413` or `404`/`410` availability must confirm HTTP edge pre-checks remain enabled (covered by existing `body-limit_test.ts` and `procedure-availability_test.ts` regression suites).

### Compatibility window

- **Stage 1** is backward-compatible on the NetScript v0.x / oRPC v1 line (no breaking removals; deprecated `contract-procedure-index` internals retained for one minor release cycle).
- **Stage 2** ships with the oRPC v2 release window (see companion RFC `#2672`), giving downstream applications a single coordinated major/minor migration with both fetch-link (#2659) and `createRouterClient` supported side-by-side.

## Breaking changes and migration

- Stage 1 is **non-breaking** for consumers using `createService` / `defineService` public APIs.
- Removing legacy `contract-procedure-index.ts` internal URL-matching exports and requiring procedure-pipeline wrapping before exposing `createRouterClient` is scoped to the coordinated oRPC v2 cut-over (tracked in companion RFC `#2672`).

## Prior art

- **oRPC official guidance** ([Server-Side Client](https://orpc.dev/docs/client/server-side), [Optimize SSR](https://orpc.dev/docs/best-practices/optimize-ssr)): recommends `createRouterClient` / `call` for efficient in-process calls while retaining fetch-based links where full HTTP handler/plugin parity is needed.
- **Draft PR #2659** (`rfcs/0000-in-process-service-link.md`, head `d2c0e05b`): establishes the fetch-link in-process transport, ALS/OTel detachment requirements, and RFC 0001 contribution parity baseline that this RFC builds upon and complements.
- **Accepted RFC 0001** (`rfcs/0001-sdk-client-contributions.md`): establishes transport-neutral client contributions without exposing raw oRPC links.
- **Accepted RFC 0008** (rolling service quotas): established `RateLimitStore` and explicitly deferred post-auth logical/principal quotas pending a post-auth execution seam.

## Unresolved questions

1. **Schema-less procedure output isolation:** Should `createRouterClient` refuse to expose procedures without `.output(...)` by default, run `structuredClone()` automatically on schema-less outputs, or emit a development warning?
2. **`plugins/auth` cookie-free in-process mode:** Should `plugins/auth` expose a thin in-process verification router (for `verify` / token introspection) while keeping cookie-mutating routes (`login`, `logout`, `refresh`) HTTP/fetch-link-only, or should response-header carriers be modeled explicitly?
3. **Custom `withContext(c)` migration ergonomics:** For services that currently read non-auth HTTP headers inside `withContext(c)`, should `ServiceBuilder` introduce a transport-neutral `withProcedureContext(({ headers, principal, db }) => ...)` alongside `withContext(c)` in Stage 1?
4. **Error payload parity on HTTP edge vs procedure pipeline:** When HTTP edge rejects an unauthenticated request before `withBodyLimit` (`401`), Hono currently returns `{ error: 'UNAUTHORIZED', message }` (`auth-middleware.ts:293`), whereas oRPC procedure errors return oRPC JSON envelopes. Should Stage 1 keep exact HTTP-edge JSON shapes for backward compatibility and unify error envelopes in Stage 2?

## Future possibilities

- **Single-process modular monolith composition** mounting multiple NetScript services into one Deno process with automatic router-client wiring for co-located dependencies and transparent fallback to HTTP `RPCLink` when split into separate containers.
- **Compile-time / lint verification** ensuring every service procedure declares explicit `access` metadata and `.output(...)` schemas before being registered into a router-client catalog.
- **In-process streaming fan-out** for `plugins/workers`, `plugins/sagas`, `plugins/triggers`, and `plugins/ai` using zero-copy `AsyncIteratorObject` channels over `createRouterClient`.
