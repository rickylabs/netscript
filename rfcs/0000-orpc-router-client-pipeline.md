---
rfc: 0000
title: oRPC-native procedure pipeline and router client
status: Draft
authors: ["@rickylabs"]
created: 2026-11-25
tracking-issue: https://github.com/rickylabs/netscript/issues/2671
target-milestone: 0.0.10
---

# oRPC-native procedure pipeline and router client

> **Draft evaluation notice.** This document is a **Draft** evaluation RFC produced for technical review. It does not authorize implementation changes under `packages/`, `plugins/`, `docs/site/`, `.github/`, `deno.json`, or `deno.lock`. Every statement about current NetScript or oRPC behavior below is tagged as **source-inspected** or **measured** (from the locked `@orpc/*@1.15.5` runtime probes in `.llm/runs/plan-rfc-orpc-router-client-pipeline-2671--rfc/probes/`); proposed designs are tagged as **derived**. Companion oRPC v2 evaluation: draft PR #2674 (tracking issue #2672).

## Summary

NetScript currently enforces authentication, URL-indexed contract authorization, rate limiting, request logging, and HTTP tracing inside Hono middleware outside oRPC, while exposing RPC procedures over HTTP via `RPCLink`. Calling an oRPC router directly in-process via `createRouterClient` or `call` therefore skips authentication, contract authorization, rate limiting, and unified request logging. This RFC inventories NetScript's Hono middleware, service primitives, auth modes, lifecycle hooks, and dual-router plugin bindings, classifying each as **transport-only**, **procedure-level**, or **split**, and specifies an oRPC-native procedure pipeline that preserves every existing security invariant across HTTP, `createRouterClient`, and bare `call()`. Warm empirical probes (2,000 warm-up / 5,000 measured iterations) against locked `@orpc/*@1.15.5` show that on the **default authenticating path**, a design-complete `createRouterClient` pipeline is **5.6×–7.2× faster** than PR #2659's fetch-based in-process link (independent reviewer warm measurements: **4.7×–7.4×** under shared-host load), saving **~0.17 ms** (small unary) to **~0.30 ms** (12.8 KiB list) per call; relative ratios shrink toward 1× under real cryptographic or network session authenticators. We recommend **Option 3 — Split-Stage into Coexistence**, decoupled from PR #2659: **Stage 1a** (`0.0.10`) takes #2659 off hold independently (with its own targeted amendments handled separately) alongside safe, non-breaking procedure-pipeline improvements on v1 (unified `requestId`, idempotent wrapping, declarative `withProcedureRateLimit` over RFC 0008's `RateLimitStore`, and removing redundant handler `CORSPlugin`); **Stage 1b** (`0.0.11`) adds the procedure-level authorization pipeline with scoped `VerifiedPrincipalRecord`, explicit HTTP-edge pre-dispatch parity, and `service.start()`/`stop()` lifecycle; and **Stage 2** (`0.1.0`, aligned with oRPC v2 GA in companion PR #2674 / tracker #2672) plugs the router client into NetScript's single `createServiceClient({ transport })` API with construction-time capability checks so both in-process transports coexist safely and downstream applications migrate once.

## Motivation

### Current gap (**source-inspected**)

In current `main` (`87965d800`), `ServiceBuilderImpl` (`packages/service/src/builder/service-builder-impl.ts`) mounts cross-cutting security and operational policies on the Hono HTTP layer:

- `createAuthnMiddleware` and `createAuthzMiddleware` (`packages/service/src/auth/auth-middleware.ts`) run as deferred Hono middleware installed by `build()` strictly *before* `withBodyLimit` (`service-builder-impl.ts:517-518`).
- `createContractAuthorizer` (`packages/service/src/auth/contract/contract-authorizer.ts`) and `createContractOverlayAuthorizer` (`packages/service/src/auth/contract/contract-overlay-authorizer.ts`) compile contract metadata into a `rou3` URL matcher (`packages/service/src/auth/contract/contract-procedure-index.ts`) using `@orpc/client/standard` `toHttpPath`, `@orpc/openapi/standard` `toRou3Pattern`, and `@orpc/contract` `fallbackContractConfig`. That index backs not only procedure matching across RPC, RPC aliases, deprecated prefixes, and OpenAPI projections, but also `findInternalGuard` (failing closed on `HEAD` and unserved methods targeting internal OpenAPI paths), `claims()` (rejecting overlapping `rawRoutes`), `retiredPaths` (`410 procedure_retired`), and unmatched authenticated routes (`404 procedure_not_found`).
- `createRateLimitMiddleware` (`packages/service/src/rate-limit/middleware/rate-limit-middleware.ts`) registers eagerly via `.use()`, running *before* `build()`-deferred authn/authz and keying on `remoteAddr` / `trustProxy` or a custom `key(HonoContext)` callback. Accepted RFC 0008 (`rfcs/0008-rolling-service-quotas.md`) documents calling `store.consume()` directly inside handlers after authentication for principal-keyed quotas rather than providing a post-auth builder stage.
- `loggerMiddleware` (`packages/logger/middleware.ts`) reads/mints `X-Request-ID` on Hono context, whereas `LoggingPlugin` (`packages/logger/orpc-plugin.ts`, `createRequestId()` at line 371) generates an **independent, uncorrelated** 8-character `requestId` per RPC invocation.
- `buildRpcContext` (`packages/service/src/builder/service-builder-impl.ts:319-342`) copies `c.get('principal')`, `db`, and `traceHeaders` into oRPC `initialContext` inside `wireRpc`, overwriting any `principal` returned by `.withContext()`.
- `onStartup` hooks run exclusively in `ServiceBuilder.serve()` (`service-builder-impl.ts:617-636`), and `onShutdown` / `disconnectServiceDatabases` run only in `RunningService.stop()`.
- Plugin services created via `createPluginService` (`packages/plugin/src/service/presentation/create-plugin-service.ts:198-200`) pass a separate `rpcRouter: resolvePluginRpcRouter(router)` to `withRPC(...)` (`plugin-contract-binder.ts:148-165`), serving legacy flat `/v1/<proc>` routes on RPC alongside canonical nested `/v1/<namespace>/<proc>` routes on OpenAPI.

Because procedure controls live exclusively in Hono:

1. **Direct `createRouterClient` / `call()` bypasses security and observability.** Draft PR #2659 (`rfcs/0000-in-process-service-link.md`, "Alternative 1") rejected `@orpc/server` `call()` for this exact reason and proposed an in-memory Fetch link (`RPCLink` custom `fetch` → `ServiceApp.fetch`).
2. **Fetch-link still pays full HTTP framing per call.** Eliminating TCP sockets cuts HTTP loopback latency roughly in half (**measured**: `386.4 µs` → `212.2 µs` small unary; `590.5 µs` → `345.0 µs` for 100-item / 12.8 KiB payload), which is completely acceptable for ordinary SSR pages (1–3 calls) and tests, but adds 4–15 ms on high-fan-out loaders (20–50 internal calls per render), tight worker/saga batch orchestrations, and high-frequency `eventIterator` streams.

### What this enables (**derived**)

An oRPC-native procedure pipeline paired with a retained HTTP-edge pre-dispatch gate unlocks:

- **Safe, zero-framing in-process calls** for high-fan-out compositions, streaming `eventIterator` fan-out, and trusted internal service-to-service calls through NetScript's single `createServiceClient({ transport })` API (**measured**: **5.6×–7.2×** faster than fetch-link on the default authenticating path, saving **~0.17–0.30 ms/call**).
- **Exact authorization parity** across HTTP, `createRouterClient`, and bare `call()`, failing closed at construction whenever a service's auth or rate-limit configuration cannot be represented cleanly without an HTTP request.
- **Unified `requestId` correlation, idempotent router wrapping, explicit non-listening `start()`/`stop()` lifecycle, and declarative post-auth `withProcedureRateLimit`** building directly on RFC 0008's `RateLimitStore`.

## Guide-level explanation

> **Derived design.** All code snippets below illustrate the target developer experience across Stage 1a, Stage 1b, and Stage 2.

### 1. One unified client API with construction-time capability checks (Stage 2)

Rather than exposing two unrelated client APIs that invite misuse, both PR #2659's fetch-link and RFC A's router client plug into NetScript's single `createServiceClient({ transport })` seam:

```ts
import { createService } from '@netscript/service';
import { createContractAuthorizer } from '@netscript/service/auth';
import { createMemoryRateLimitStore } from '@netscript/service/rate-limit';
import { createServiceClient, createRouterClientTransport } from '@netscript/sdk/client';
import { createBearerSdkClientContribution } from '@netscript/plugin-auth-core/sdk';
import { ordersContract } from '@app/contracts/orders';
import { ordersRouter } from './routers/orders.ts';

const quotaStore = createMemoryRateLimitStore();

const ordersBuilder = createService(ordersRouter, { name: 'orders' })
  .withLogger()
  .withCors({ origins: ['https://app.example.com'] }) // HTTP transport-only
  .withBodyLimit({ maxBytes: 1_048_576 })            // HTTP transport-only (after HTTP edge authn/authz)
  .withAuthn({ authenticator })                      // HTTP edge + procedure pipeline (single authn on HTTP)
  .withAuthz({ authorizer: createContractAuthorizer(ordersContract) }) // Contract-derived (required for router client)
  .withProcedureRateLimit({                          // Declarative wrapper over RFC 0008 RateLimitStore
    store: quotaStore,
    limit: 120,
    windowMs: 60_000,
    key: ({ principal, clientAddress, procedurePath }) =>
      principal
        ? `${principal.claims.tenantId ?? 'global'}:${principal.subject}:${procedurePath.join('.')}`
        : `addr:${clientAddress ?? 'unknown'}:${procedurePath.join('.')}`,
  })
  .onStartup(async () => { await warmCaches(); })
  .onShutdown(async () => { await flushBuffers(); })
  .withRPC();

// Non-listening lifecycle handle: runs onStartup hooks, tracks in-flight calls, exposes stop()
const startedOrders = await ordersBuilder.start();

// Unified client API — fails closed at construction if authz is path-based, if onStartup hasn't run,
// if HTTP-only withRateLimit() has no procedure counterpart, or if custom Hono .use() is unacknowledged.
const ordersClient = createServiceClient({
  contract: ordersContract,
  serviceName: 'orders',
  transport: createRouterClientTransport(startedOrders, {
    propagateTraceContext: true, // Explicit W3C trace continuity; caller ALS is always detached
  }),
  contributions: [bearerContribution] as const,
});

const order = await ordersClient.getOrder(
  { orderId: 'ord_42' },
  { context: { token: userBearerToken }, signal },
);

// Graceful non-listening teardown: refuses new in-process calls, drains in-flight calls,
// runs onShutdown hooks in reverse order, and disposes databases.
await startedOrders.stop();
```

When a caller needs HTTP-edge behavior (CORS headers, `withBodyLimit` 413 checks, refresh-on-read browser `Set-Cookie` headers without an explicit sink, path-based `createScopeAuthorizer` / `createContractOverlayAuthorizer`, raw Hono routes, or JSON wire-codec verification), it passes PR #2659's fetch-link transport into the **same** `createServiceClient({ transport })` call:

```ts
const httpParityClient = createServiceClient({
  contract: ordersContract,
  serviceName: 'orders',
  transport: createInProcessServiceLink({ app: startedOrders.app }), // PR #2659
  contributions: [bearerContribution] as const,
});
```

## Reference-level explanation

### 1. Complete inventory and classification (**source-inspected**)

Every Hono middleware, service primitive, auth helper, lifecycle hook, and plugin surface in `packages/service`, `packages/telemetry`, `packages/logger`, `packages/plugin`, and first-party `plugins/*` is classified below:

| Component & source location (**source-inspected**) | Current mount & execution order | Classification | Rationale & target placement (**derived**) |
| --- | --- | --- | --- |
| `createHonoTracingMiddleware` (`packages/telemetry/src/hono/otel-middleware.ts`) | `ServiceBuilderImpl` constructor, first Hono layer | **Transport-only** | Owns HTTP `SERVER` span and HTTP W3C extraction. Procedure spans on HTTP and router-client are owned by `ORPCInstrumentation` + `TracingPlugin`. |
| `withCors()` (`packages/service/src/middleware/service-cors.ts`) + hardcoded `new CORSPlugin()` (`packages/service/src/primitives/handlers.ts:112`) | Eager `.use()`; snapshots/restores 6 CORS headers to override `handlers.ts`'s `CORSPlugin` | **Transport-only** | Keep `withCors()` at HTTP edge; remove redundant `CORSPlugin` from `handlers.ts` in Stage 1a (also avoids oRPC v2 `CORSHandlerPlugin` `origin: '*'` default). |
| `withLogger()` (`packages/logger/middleware.ts`) & `LoggingPlugin` (`packages/logger/orpc-plugin.ts`, `createRequestId()` at line 371) | `loggerMiddleware`: eager `.use()`, parses/mints `X-Request-ID`, logs HTTP access. `LoggingPlugin`: handler interceptors mint a second uncorrelated `requestId` (`orpc-plugin.ts:371`). | **Split** | HTTP access log & `X-Request-ID` I/O stay **transport-only**. Unified `requestId` propagation and procedure structured logging move to **procedure-level** (Stage 1a). |
| `withRateLimit()` (`packages/service/src/rate-limit/middleware/rate-limit-middleware.ts`) & RFC 0008 direct `store.consume()` (`rfcs/0008-rolling-service-quotas.md`) | Eager `.use()` (runs *before* deferred authn/authz); keys on `remoteAddr`/`trustProxy` or `key(HonoContext)`. RFC 0008 uses direct post-auth `store.consume()`. | **Split** | Pre-auth IP/socket volumetric guard stays **transport-only**. New declarative `withProcedureRateLimit()` wraps RFC 0008's `RateLimitStore` at **procedure-level** for BOTH authenticated (tenant/principal) and public (`clientAddress` projection) procedures. Services with HTTP `withRateLimit()` but no `withProcedureRateLimit()` **fail closed** at router-client construction unless explicitly acknowledged. |
| Custom `.use(mw)` (e.g., `plugins/auth/services/src/request-context.ts` `withAuthRequest` ALS) | Eager `.use()` in call order (before deferred auth/body-limit). | **Transport-only** | Operates on raw Hono `Context` / `Set-Cookie`. Router-client construction **fails closed** if custom `.use()` middleware is registered unless the service explicitly declares it transport-only (`inProcess: { allowHttpMiddlewareSkip: true }`). |
| `withAuthn()` (`packages/service/src/auth/auth-middleware.ts`) & `AuthnResult.{responseHeaders, setCookies}` (`packages/service/src/auth/types.ts:54-56`) | Deferred in `build()` (`installAuth`), before `withBodyLimit`. Applies `responseHeaders` and `setCookies` (refresh-on-read sessions) onto Hono response. | **Split (dual-layer, single authn on HTTP)** | **HTTP edge** runs `AuthenticatorPort` before `withBodyLimit`, applies `responseHeaders`/`setCookies`, and records a **scoped `VerifiedPrincipalRecord`** (§3.4). **Procedure pipeline** checks the scoped record; if absent/untrusted/expired, invokes `AuthenticatorPort` over a request-less `AuthnRequest`. If `AuthnResult` returns non-empty `setCookies` or `responseHeaders` in-process without an explicit caller side-effect sink, the pipeline **fails closed** (never silently drops rotated cookies!). |
| `withAuthz()` (`auth-middleware.ts`), `createContractAuthorizer` (`contract-authorizer.ts`), `createContractOverlayAuthorizer` (`contract-overlay-authorizer.ts`), `createScopeAuthorizer` (`scope-authorizer.ts`), custom `AuthorizerPort` | Deferred in `build()` immediately after `withAuthn` and **strictly before `withBodyLimit`**. | **Split (HTTP edge + procedure pipeline)** | **HTTP edge** keeps pre-body-limit resolution + authorization (preserving **401-before-413**, **403-before-413**, **401-before-404/410**, `procedure_not_found`, `procedure_retired`, `rawRoutes`). **Procedure pipeline** enforces contract-meta authorization (including unmarked → fallback else `403 authz.no-matching-rule`) on router-client and bare `call()`. Path-dependent authorizer modes fail closed at router-client construction (§3.2). |
| `contract-procedure-index.ts` helpers: `find()`, `findInternalGuard()`, `claims()`, `retiredPaths`, `PROCEDURE_ERROR_CODES.{NOT_FOUND, RETIRED}` | Compiled at `createContractAuthorizer` / `createContractOverlayAuthorizer` `bind()`. `findInternalGuard` fails closed on `HEAD`/unserved methods hitting internal OpenAPI paths; `claims()` rejects overlapping `rawRoutes`. | **Transport-only (retained at HTTP edge!)** | **Retained explicitly at the HTTP edge** (§3.3). On v1 keeps existing `contract-procedure-index.ts`; on v2 migrates RPC/OpenAPI matching to oRPC v2's native `RPCMatcher` + `OpenAPIMatcher` + `getOpenAPIMeta` (measured on `2.0.0-beta.53`). |
| `withBodyLimit()` (`packages/service/src/primitives/body-limit.ts`) | Deferred in `build()` (`installBodyLimit`), strictly *after* `installAuth`. | **Transport-only** | Guards untrusted HTTP byte streams (`413`). In-process calls hold JS values validated by Zod schemas; outer ingress enforces byte caps. |
| `withHealth()` (`/health*`), `withServiceInfo()` (`/`), `withOpenAPI()` (`/api/openapi.json`), `withDocs()` (`/api/docs*`), `route()` raw routes | Deferred in `build()` (except eager `withServiceInfo()`). | **Transport-only** | Infrastructure probes, docs UI, and raw HTTP routes. |
| `withRPC()` / `wireRpc` (`service-rpc.ts`, `handlers.ts`) & **`withRPC({ rpcRouter })`** (`create-plugin-service.ts:198-200`, `plugin-contract-binder.ts:148-165`) | Deferred in `build()`. Plugin services pass a separate `rpcRouter` containing legacy flat `/v1/<proc>` aliases alongside canonical nested `router` (`/v1/<ns>/<proc>`). | **Split** | HTTP wire adapters (`RPCHandler`, `OpenAPIHandler`, `ZodSmartCoercionPlugin`, `rpcAliases`, `deprecatedRpcRoutes`) stay **transport-only**. `TracingPlugin`, `ErrorHandlingPlugin`, and `LoggingPlugin` interceptors run at **procedure-level**. **Both** `router` and `rpcRouter` are wrapped idempotently (`WRAPPED_ROUTER_MARKER`); router-client binds exclusively to the canonical `this.router` (never legacy flat aliases in `rpcRouter`). |
| `onStartup` / `onShutdown` / `withDatabase` disposal (`service-builder-impl.ts:171-196, 385-410, 617-636`) | Today `onStartup` runs **only** in `serve()`; `onShutdown` + DB disconnect run **only** in `RunningService.stop()`. | **Service-lifecycle (shared)** | Add non-listening `await service.start()` → `StartedService` running `onStartup` hooks, tracking in-flight calls, and exposing `stop()` to drain + run `onShutdown` + disconnect DBs. Router-client construction fails closed if `onStartup` hooks are registered and `start()` has not been called. |
| `startServiceListener()` (`service-listener.ts`: TLS/ALPN, `hostname`, `remoteAddr`, OS signals) | `serve()` only. | **Transport-only** | OS socket lifecycle. |
| Plugin streaming RPC (`plugins/workers` `subscribe`, `plugins/sagas` `subscribe`, `plugins/triggers` `subscribeEvents`, `plugins/ai` `chat`) | oRPC `eventIterator` / `AsyncIteratorObject` procedures. | **Procedure-level** | Works natively over router-client when wrapped with `wrapDetachedAsyncIterator` (§2.3) so every `next()`/`return()`/`throw()` executes detached. |
| Non-RPC plugin HTTP routes (`plugins/streams` `serveRpc: false` proxy; `plugins/triggers` raw HMAC webhooks `raw-trigger-routes.ts`; `plugins/ai` `stream-proxy.stub.ts`; `plugins/auth` cookie-mutating `login`/`logout`/`refresh`) | Raw Hono routes or Fresh handlers; `plugins/auth` relies on `withAuthRequest` ALS + `Set-Cookie`. | **Transport-only** | Stay on HTTP / #2659 fetch-link. Token-introspection / cookie-free `plugins/auth` procedures and internal worker/saga/trigger RPC callbacks can use router-client. |

### 2. Request-less oRPC context, RFC 0001 projection, and async-context isolation (**derived** & **measured**)

#### 2.1 Transport-neutral context & non-HTTP audit fields

Procedures wrapped by NetScript's pipeline receive a transport-neutral `NetScriptProcedureContext` with no `Request` or Hono `Context`:

- `principal?: Principal` (honored **only** when verified by a valid scoped `VerifiedPrincipalRecord`, §3.4),
- `tenantId?: string`, `requestId: string` (unified across Hono `X-Request-ID` and `LoggingPlugin`), `logger: Logger`, `db?: DbContext`,
- `transport: 'http' | 'in-process'`, `clientAddress?: string` (explicit caller/BFF-forwarded client address for public quotas),
- `headers?: Readonly<Record<string, string>>`, `authnSideEffects?: { onResponseHeaders?; onSetCookies? }`.

**Defined in-process `AuthnRequest` and audit log fields (no fake HTTP RPC paths!):**
- `logAuthDecision` records `{ stage, decision, transport: 'in-process', procedure: path.join('.'), method: 'IN_PROCESS', path: 'orpc://<serviceName>/<procedure>', requestId, scheme, subjectHash, reason }`.
- Request-less `AuthnRequest` handed to v1 `AuthenticatorPort` sets `method: 'IN_PROCESS'` and `path: 'orpc://<serviceName>/<procedure>'` (a distinct non-HTTP URI that cannot accidentally match any HTTP path prefix like `/api/...`).

#### 2.2 Projecting RFC 0001 SDK client contributions without a `Request`

**Source-inspected** in `packages/sdk/src/ports/sdk-client-contribution.ts:30-39` and `packages/sdk/src/internal/client-contributions/stable-v1-adapter.ts`: RFC 0001 v1 contributions receive `SdkClientTransportDescriptor` (`{ kind: 'http', origin: URL, rpcPath: string, secure: boolean }`) and `procedure: { path, meta }` inside `prepare()`, emitting lower-case headers and synchronous `CacheQuery` partition suffixes.

- **Stage 2 unified transport adapter:** Inside `createRouterClientTransport`'s oRPC interceptor (where the actual `options.path` and contract `procedure.meta` are known per call — **measured** in Parity Probe Test 1), NetScript runs the exact same `prepareCall()` validation, conflict check, `SdkClientContributionError` redaction, and `CacheQuery` partition computation as `RPCLink`.
- Extending `SdkClientTransportDescriptor` (or supplying `{ kind: 'http', origin: new URL('https://<service>.in-process.localhost'), rpcPath: '/api/rpc', secure: true }` for v1 contributions while extending to `kind: 'in-process-router'` in Stage 2) allows header-only contributions (`bearer`, `internal-credential`, `locale`) to project headers without allocating a `Request` — and proves public procedures (`authentication: 'none'`) receive **no** `Authorization` header even when a caller supplies a token (**measured** Test 1). Contributions requiring raw HTTP response mutation fail fast with `SDK_CONTRIBUTION_TRANSPORT_UNSUPPORTED`.

#### 2.3 Async-context isolation: guaranteed root snapshot + streaming pull isolation (**measured** in Parity Probe Test 5)

Round-1 counter-probes exposed two real hazards in naive `AsyncLocalStorage.snapshot()` usage:

1. **Lazy dynamic-import snapshot poisoning (B5a):** Calling `AsyncLocalStorage.snapshot()` at module top-level captures whatever ALS stores are active when the module is first evaluated. If a lazy route or on-demand plugin imports the module inside Request A, the snapshot captures `"tenant-A-session"` and leaks it into every subsequent Request B (**measured** failing-then-passing in Test 5).
   - **Fix:** Capture `BOOTSTRAP_CLEAN_SNAPSHOT` explicitly at process bootstrap (composition root, before any request starts), **and** guard any on-demand capture (`captureCleanAsyncRootOrThrow`) by asserting that every framework-registered ALS (`LogTape`, `withAuthRequest`, DB tx ALS, etc.) has `getStore() === undefined` AND `trace.getActiveSpan() === undefined` — failing closed with `AsyncContextRootCaptureError` if invoked inside an active request! (Note: the same bootstrap-capture fix applies to PR #2659's fetch-link and is tracked as a separate amendment to #2659.)
2. **Streaming async-generator pull leakage (B5b):** Wrapping only `options.next()` detaches only the initial call returning the `AsyncIterator`. Every subsequent consumer `await iter.next()`, `iter.return()`, and `iter.throw()` runs in the consumer's active ALS (**measured** failing-then-passing in Test 5: unwrapped streaming observed `'consumer-leaked-pull'` inside the handler!).
   - **Fix:** When `options.next()` returns an async iterator (`isAsyncIteratorLike(result)`), wrap it in `wrapDetachedAsyncIterator(result, runDetached)` (preserving oRPC `EventMeta` via `wrapAsyncIteratorPreservingEventMeta`) so **every** `next()`, `return()`, and `throw()` executes inside `BOOTSTRAP_CLEAN_SNAPSHOT(() => withContext(targetOtelCtx, ...))` (**measured** in Test 5: `observedAls === null` on all 3 `next()` pulls AND `undefined` inside `finally` on `return()`!).

### 3. Complete authorization design across all modes, HTTP edge parity, and scoped principal branding

#### 3.1 Blocker B1 fix: Unmarked procedures remain deny-by-default (**measured** Test 1)

**Source-inspected** in `packages/service/src/auth/contract/contract-authorizer.ts:129-137`: when a contract procedure declares no `meta.access` (`policy === undefined`), `createContractAuthorizer` delegates to `options.fallback` if provided, and otherwise returns `403 FORBIDDEN` (`authz.no-matching-rule`).

The procedure pipeline mirrors this rule verbatim:
- `policy === undefined` → if a procedure-aware `fallback` is configured (§3.2), invoke it and deny `authz.no-matching-rule` if unmatched; otherwise **always throw `403 FORBIDDEN` (`authz.no-matching-rule`)**.
- Verified in Parity Probe Test 1: an authenticated caller (`alice-token`) invoking `unmarkedOp` receives `403 authz.no-matching-rule` identically on HTTP, `createRouterClient`, and bare `call()`.

#### 3.2 Blocker B2 fix: Exact in-process semantics for every NetScript authorizer mode (**measured** Test 2)

Path-based authorization rules (`request.path.startsWith('/api/orders')`) have no unambiguous request-less meaning: synthesizing a fake RPC path causes silent false-denies or false-allows whenever rules target OpenAPI paths. Therefore, **every authorization mode has an explicit, transport-consistent contract**:

| Service authorization configuration (**source-inspected**) | In-process router-client eligibility (**derived**) | Exact behavior & rationale |
| --- | --- | --- |
| **1. `createContractAuthorizer(contract)` (no fallback)** | **Allowed** | Every procedure's access comes purely from `meta.access`; unmarked procedures deny `403 authz.no-matching-rule`. Identical across HTTP and router-client. |
| **2. `createContractAuthorizer(contract, { fallback })` where `fallback` implements `ProcedureAuthorizerPort` (`authorizeProcedure({ principal, procedurePath })`)** | **Allowed** | Marked procedures use `meta.access`; unmarked procedures invoke `fallback.authorizeProcedure(...)` on both HTTP and router-client (**measured** Test 2). |
| **3. `createContractAuthorizer(contract, { fallback })` with path-based `fallback` (e.g., `createScopeAuthorizer` matching `request.path`)** | **Fail closed at construction** (`ROUTER_CLIENT_PATH_AUTHZ_UNSUPPORTED`) | Prevents HTTP vs in-process disagreement on unmarked procedures. Migrate rules to `meta.access` / `authorizeProcedure`, or use #2659 fetch-link. |
| **4. `createScopeAuthorizer` (path rules) or custom path-only `AuthorizerPort`** | **Fail closed at construction** (`ROUTER_CLIENT_PATH_AUTHZ_UNSUPPORTED`) | Path rules cannot be evaluated faithfully without an HTTP URL/method. Upgrade to contract metadata / `ProcedureAuthorizerPort`, or use #2659 fetch-link. |
| **5. `createContractOverlayAuthorizer(contract)` (leaves unmarked procedures to `protect`/`allowAnonymous` path guards or optional path fallback)** | **Fail closed at construction** unless *every* reachable procedure in the mounted router declares `meta.access` (verified at construction) | If unmarked procedures exist, their HTTP policy depends on URL path guards (`allowAnonymous`, `protect`) that have no in-process meaning. |
| **6. `withAuthn()` only (no `withAuthz()`; relies on `protect`/`allowAnonymous` path prefixes)** | **Fail closed at construction** (`ROUTER_CLIENT_PATH_AUTHZ_UNSUPPORTED`) | Without contract-level `meta.access`, router-client cannot know which procedures were left anonymous by URL prefixes. |

#### 3.3 Blocker B3 fix: Explicit HTTP-edge pre-dispatch index, ordering guarantees, and status/body parity (**measured** Test 3)

**Correction from Round 0:** Stage 1 does **not** delete `contract-procedure-index.ts` or its 4 v1 imports. Retaining a pre-body-limit URL-to-procedure resolver at the HTTP edge is **mandatory** to preserve all six HTTP invariants:
1. Public procedures (`authentication: 'none'`) pass unauthenticated across RPC, aliases, deprecated prefixes, and OpenAPI projections;
2. **401-before-413** (`packages/service/tests/body-limit_test.ts:234-260`);
3. **403-before-413** (an authenticated caller lacking scopes/roles/internal-audience gets `403 FORBIDDEN` *before* `withBodyLimit` reads or oRPC decodes any body bytes — preventing ordinary user tokens from forcing body parsing on internal/admin endpoints!);
4. **401-before-404/410** (unknown and `retiredPaths` never disclose availability before authentication);
5. `findInternalGuard` (`HEAD` and unserved methods targeting an internal procedure's OpenAPI path fail closed with `401`/`403 authz.internal-audience`, never `404`/`405`), `claims()` (fail-fast error when `rawRoutes` overlap RPC/OpenAPI mounts), and typed `404 procedure_not_found` / `410 procedure_retired` codes;
6. Exact backward-compatible HTTP JSON error envelopes in Stage 1a/1b.

**How the HTTP edge index transitions cleanly to oRPC v2 (**source-inspected** on `@orpc/server@2.0.0-beta.53` & `@orpc/openapi@2.0.0-beta.53`):**
- On **v1** (`1.15.5`), keep `contract-procedure-index.ts` at the HTTP edge (no premature churn in Stage 1a/1b).
- On **v2** (`2.0.0`, companion PR #2674), replace the 4 removed v1 helpers (`toHttpPath`, `toRou3Pattern`, `fallbackContractConfig`, `HTTPMethod` — measured in PR #2674's prototype) with oRPC v2's **own exported matchers**: `RPCMatcher` (`@orpc/server/standard`) and `OpenAPIMatcher` (`@orpc/openapi/standard`), both verified exported in `2.0.0-beta.53`. Pair them with a small method-agnostic path set derived from `populateRouterContractOpenAPIPaths` / `getOpenAPIMeta` solely for `findInternalGuard` and `claims()`. (Additionally, source inspection of `@orpc/server@2.0.0-beta.53/dist/adapters/standard/handler.js` confirms `StandardHandler.interceptors` runs post-`resolveProcedure` and pre-`decodeInput()`, though Hono's `withBodyLimit` still sits ahead of `StandardHandler`, so the edge matcher remains required for 401/403-before-413.)

*(Note: Companion PR #2674's separate review round will align its Stage 1 note on `contract-procedure-index.ts` with this corrected design.)*

**HTTP & in-process status-and-body parity table (**measured** Test 3 & Test 1):**

| Condition | Current HTTP (`main`) | Stage 1b HTTP (retained edge gate) | `createRouterClient` (procedure pipeline) |
| --- | --- | --- | --- |
| Unauthenticated protected call (incl. oversized body or invalid input) | `401` `{ error: 'UNAUTHORIZED', message }` (before 413 & validation) | **Byte-identical** `401` (before 413 & validation) | `ORPCError('UNAUTHORIZED')` (before Zod input validation; v1 `defined: true` via `commonErrorMap`) |
| Authenticated missing scope/role, wrong internal audience, or unmarked procedure w/o fallback (incl. oversized body) | `403` `{ error: 'FORBIDDEN', message }` (before 413 & body decode) | **Byte-identical** `403` (before 413 & body decode) | `ORPCError('FORBIDDEN', { message })` (before Zod input validation) |
| Authenticated + authorized + oversized HTTP body | `413` `{ error: 'BODY_TOO_LARGE', ... }` | **Byte-identical** `413` | N/A (no HTTP byte stream; outer ingress enforces byte limits) |
| Unauthenticated unknown or retired URL | `401` `{ error: 'UNAUTHORIZED', ... }` | **Byte-identical** `401` | N/A (typed procedure dispatch; no URL probing surface) |
| Authenticated unknown URL | `404` `{ error: 'NOT_FOUND', code: 'procedure_not_found', message }` | **Byte-identical** `404` | N/A |
| Authenticated `retiredPaths` URL | `410` `{ error: 'GONE', code: 'procedure_retired', message }` | **Byte-identical** `410` | N/A |
| `HEAD` / unserved method on internal OpenAPI path (`findInternalGuard`) | `401` (anon) / `403 authz.internal-audience` (non-internal) | **Byte-identical** `401` / `403` | N/A |
| Rate limit exceeded (HTTP pre-auth or procedure post-auth) | `429` `{ error: 'RATE_LIMITED' }` + `Retry-After` header | **Byte-identical** `429` + `Retry-After` (both edge & procedure) | `ORPCError('RATE_LIMITED', { data: { retryAfter, limit } })` |

#### 3.4 Blocker B4 fix: Scoped, request-bound, audience-checked, expiry-checked `VerifiedPrincipalRecord` + revocation (**measured** Test 4)

A process-wide `WeakSet<Principal>` plus global `INTERNAL_PRINCIPALS` fails three real attacks reproduced by the reviewer and now automated as failing-then-passing proofs in Parity Probe Test 4:

1. **Cross-service + expired-`exp` replay via bare `call()`:** A principal verified by Service A with an expired `exp` was accepted on Service B's wrapped router with zero authenticator calls.
2. **Cross-service internal audience leak:** `isInternalServicePrincipal(p)` is a global `WeakSet` that does not check `p.claims.audience === currentServiceName`, so an `orders` internal principal was admitted on `billing`'s `audience: 'internal'` procedure.
3. **Closure / queued-job / post-revocation replay:** A principal captured in a closure, stream, or queued job remained valid after the originating request ended or the session was revoked/logged out.

**Redesigned brand & admission invariant:**

- Replace `WeakSet<Principal>` with a module-private `WeakMap<Principal, VerifiedPrincipalRecord>` stamped exclusively inside `createAuthnMiddleware` (never in user `.withContext()`):
  ```ts
  interface VerifiedPrincipalRecord {
    readonly serviceId: symbol;            // Unique per service instance
    readonly serviceName: string;          // Bound to internal audience check
    readonly authenticator: AuthenticatorPort;
    readonly verifiedAtMs: number;
    readonly expiresAtMs: number;          // Bounded by min(claims.exp * 1000, verifiedAtMs + maxTrustTtlMs)
    readonly requestScope: { readonly signal: AbortSignal; readonly active: () => boolean };
    readonly isRevoked?: () => boolean;    // Checked on every admission (session/logout revocation)
    readonly internalAudience?: string;    // Set only when minted by internal-credential auth for serviceName
  }
  ```
- **Pipeline admission rule (enforced identically on HTTP, `createRouterClient`, AND bare `call()`):**
  1. Look up `record = VERIFIED_PRINCIPALS.get(context.principal)`. If missing → untrusted.
  2. Require `record.requestScope.active()` (ended unconditionally in the originating request's `finally` block!) AND `!record.isRevoked?.()`.
  3. Require `nowMs < record.expiresAtMs` AND (if `typeof principal.claims.exp === 'number'`) `nowMs < principal.claims.exp * 1000`.
  4. **Service binding:** Require `record.serviceId === currentService.serviceId` — OR (for non-internal procedures only) explicit service-side opt-in `trustSharedPrincipal === true` with `currentService.trustedVerifiers.has(record.authenticator)`.
  5. **Internal-audience binding:** For `policy.audience === 'internal'`, require `record.serviceId === currentService.serviceId` (cross-service delegation is **never** honored for internal procedures!) AND `isInternalServicePrincipal(principal) && principal.claims.audience === currentService.serviceName`.
  6. If ANY check fails, the pipeline ignores `context.principal` and invokes `currentService.authenticator.authenticate(...)` against `context.headers`, failing closed with `401 UNAUTHORIZED` if no valid live credential is present.
- **Single-authn proof on HTTP (measured Test 4, counted directly at `AuthenticatorPort`):** When HTTP edge stamps the scoped record for `singleAuthServiceId` and ends `requestScope` in `finally`, an authenticated HTTP call invokes the underlying `AuthenticatorPort` **exactly once** (`realHttpAuthCalls.count === 1`), while any nested in-process call to another service authenticates against that target service's own authenticator unless explicit non-internal delegation is configured.
- **Error-map note (v1-only):** On oRPC v1 (`1.15.5`), router-level `ORPCError` throws must supply `data` matching `commonErrorMap`'s Zod schemas (`packages/contracts/src/domain/schemas.ts:100-121`) and `defined: Object.hasOwn(errorMap, code)` so `isDefinedError()` does not downgrade `defined` to `false`. On oRPC v2 (`2.0.0-beta.53`, per prototype evidence in PR #2674), `ORPCError` drops the constructor `defined` option and reconciles via `reconcileORPCError`.

### 4. In-process guarantees, deliberate omissions, lifecycle, and fail-closed guards (**derived** & **measured**)

| Concern | Router client (`createRouterClientTransport`) | Fetch-link (#2659) | HTTP loopback | Guard / rationale |
| --- | --- | --- | --- | --- |
| Authentication (`AuthenticatorPort`) | **Yes** (single-authn on HTTP edge; re-authenticates per in-process hop by default) | Yes | Yes | Runs before Zod input validation (`inputValidationIndex` shifted; verified on both v1 `1.15.5` and v2 `2.0.0-beta.53`). |
| Authenticator `setCookies` / `responseHeaders` (refresh-on-read sessions) | **Fail closed** without explicit sink; forwards when sink wired (**measured** Test 6) | **Yes** (native HTTP headers) | **Yes** | Prevents silent loss of rotated session cookies; use #2659 fetch-link or HTTP for browser cookie rotation. |
| Contract-meta authz (incl. unmarked → `403 authz.no-matching-rule`) | **Yes** | Yes | Yes | Identical across HTTP, router-client, and bare `call()` (**measured** Test 1). |
| Path-based authz (`createScopeAuthorizer`, overlay w/ unmarked, custom path `AuthorizerPort`, `authn`-only path guards) | **Fail closed at construction** (**measured** Test 2) | **Yes** | **Yes** | Prevents silent HTTP vs in-process disagreement. |
| Existing HTTP `withRateLimit({ key })` | **Fail closed at construction** unless `withProcedureRateLimit` is configured or skip explicitly acknowledged (**measured** Test 6) | **Yes** | **Yes** | Prevents silently dropping logical quotas on existing services. |
| Post-auth & public `withProcedureRateLimit` (RFC 0008 `RateLimitStore`) | **Yes** (principal/tenant key for auth; explicit `clientAddress` key for public — no global `'anon'` starvation, **measured** Test 6) | Yes (once pipeline lands) | Yes (once pipeline lands) | Shared store enforces identical limits across transports. |
| `onStartup` / `onShutdown` / DB disposal | **Requires `await service.start()`**; fails closed before start; `stop()` drains & disposes (**measured** Test 6) | Requires `start()` or `serve()` | `serve()` | Prevents calling uninitialized services or leaking DB connections. |
| `withRPC({ rpcRouter })` & nested wrapping | **Both routers wrapped idempotently** (`WRAPPED_ROUTER_MARKER`); client binds to canonical `router` (**measured** Test 6) | Yes | Yes | Prevents double middleware execution / double quota decrement and blocks binding to deprecated flat aliases. |
| Custom Hono `.use()` middleware | **Fail closed at construction** unless explicitly declared transport-only | **Yes** | **Yes** | Prevents silently bypassing custom Hono security middleware. |
| CORS (`withCors`), `withBodyLimit` (413), TLS/ALPN, raw Hono `route()`, wire codec round-trip | **Deliberately omitted** | **Yes** (except TLS/ALPN) | **Yes** | Transport-only HTTP concerns; use #2659 fetch-link when testing or invoking them. |
| Input & output reference isolation | **Conditional — plain objects/arrays cloned by strict Zod schemas only!** | Always (JSON clone) | Always (JSON clone) | **Measured (Test 6):** Strict Zod object/array schemas clone outputs, but **both inputs and outputs** pass references through for `z.any()`, `z.unknown()`, `z.custom()`, class instances, and schema-less procedures. Strict router-client mode rejects schema-less procedures or applies `structuredClone` when configured. |
| ALS isolation & streaming (`eventIterator`) | **Yes** (bootstrap root snapshot + fail-closed active-store check + `wrapDetachedAsyncIterator` on every `next`/`return`/`throw`, **measured** Test 5) | Yes (after #2659 root-snapshot amendment) | Yes (process/socket boundary) | Zero caller ALS leakage on unary calls, streaming pulls, and iterator cleanup. |

### 5. Warm empirical measurements against locked `@orpc/*@1.15.5` (**measured**)

Benchmark parameters updated after Round-1 review to **2,000 warm-up** and **5,000 measured** iterations (`probes/overhead-benchmark.probe.ts`, raw JSON in `probes/overhead-results.json`), eliminating the Round-0 cold-JIT artefact and adding a **design-complete** authenticating mode (root ALS snapshot + OTel context detachment + logging, error, and tracing interceptors + per-call `requestId` + scoped brand check + authn + contract authz + SHA-256 audit + `MemoryRateLimitStore`).

> **Important qualification:** All modes below use an **in-memory static credential authenticator** (`createStaticCredentialAuthenticator`), which flatters relative speedup ratios. Under real cryptographic JWT/OIDC verification or network session lookups, fixed authentication cost dominates and relative ratios shrink toward **1×**, though absolute savings (~0.17–0.30 ms/call of HTTP framing & Hono routing) remain unchanged.

#### 5.1 Headline comparison (default authenticating path vs fetch-link & HTTP loopback)

| Scenario | Transport mode | Mean (µs) | p50 (µs) | p95 (µs) | p99 (µs) | Ops/s | vs Fetch-link | Time saved vs Fetch-link | vs HTTP |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **Small unary** (~100 B) | HTTP loopback (`Deno.serve` + `RPCLink`) | 386.4 | 343.0 | 568.2 | 962.0 | 2,588 | 0.5× | — | 1.0× |
| Small unary (~100 B) | Fetch-link in-process (#2659 model) | 212.2 | 176.0 | 323.2 | 801.4 | 4,713 | 1.0× | baseline | 1.8× |
| Small unary (~100 B) | **Router client — authenticating (design-complete, default)** | **38.2** | **31.0** | **60.1** | 95.1 | **26,193** | **5.6×** | **~0.17 ms/call** | **10.1×** |
| Small unary (~100 B) | Router client — authenticating (minimal) | 32.4 | 28.0 | 46.3 | 77.6 | 30,834 | 6.5× | ~0.18 ms/call | 11.9× |
| Small unary (~100 B) | *Router client — trusted principal (off-by-default opt-in)* | *22.3* | *18.5* | *32.3* | *54.3* | *44,744* | *9.5×* | *~0.19 ms/call* | *17.3×* |
| **Medium list** (100 items, 12,822 B JSON) | HTTP loopback (`Deno.serve` + `RPCLink`) | 590.5 | 512.2 | 1,001.0 | 1,387.8 | 1,693 | 0.6× | — | 1.0× |
| Medium list (100 items, 12,822 B JSON) | Fetch-link in-process (#2659 model) | 345.0 | 293.7 | 554.9 | 1,028.5 | 2,899 | 1.0× | baseline | 1.7× |
| Medium list (100 items, 12,822 B JSON) | **Router client — authenticating (design-complete, default)** | **47.7** | **43.3** | **70.2** | 109.8 | **20,952** | **7.2×** | **~0.30 ms/call** | **12.4×** |
| Medium list (100 items, 12,822 B JSON) | Router client — authenticating (minimal) | 43.4 | 39.2 | 60.1 | 115.7 | 23,050 | 7.9× | ~0.30 ms/call | 13.6× |
| Medium list (100 items, 12,822 B JSON) | *Router client — trusted principal (off-by-default opt-in)* | *32.1* | *28.9* | *42.2* | *74.6* | *31,123* | *10.7×* | *~0.31 ms/call* | *18.4×* |
| **Concurrent burst** (20 × 50 = 1,000 calls) | HTTP loopback | — | — | — | — | 4,290 | 0.5× | — | 1.0× |
| Concurrent burst (20 × 50) | Fetch-link in-process (#2659 model) | — | — | — | — | 8,524 | 1.0× | — | 2.0× |
| Concurrent burst (20 × 50) | **Router client — authenticating (design-complete, default)** | — | — | — | — | **42,301** | **5.0×** | — | **9.9×** |
| Concurrent burst (20 × 50) | *Router client — trusted principal (off-by-default opt-in)* | — | — | — | — | *76,889* | *9.0×* | — | *17.9×* |

*Cross-check:* Independent Round-1 reviewer warm runs under shared-host load measured **4.7×–7.4×** for the default authenticating path (~0.17–0.30 ms saved/call) and **~5–10 µs** for design-complete interceptors (this run: **+4.3 to +5.8 µs**).

#### 5.2 Parity & security counter-probe suite (`probes/router-client-parity.probe.ts` — **6/6 tests passing, 73 ms, `--frozen`**)

1. **Test 1 (B1 + core parity + RFC 0001):** Unmarked `unmarkedOp` denied `403 authz.no-matching-rule` on HTTP, `createRouterClient`, and bare `call()`; real `createBearerSdkClientContribution` + `createLocaleSdkClientContribution` project headers and `CacheQuery` partitions via actual `options.path` (proving public `health` receives no `Authorization` header); unified `requestId`, scopes, internal-audience anti-spoofing, and `ORDER_LOCKED` narrowing verified.
2. **Test 2 (B2):** All 5 path-dependent auth modes (`scope-path`, `custom-path`, `contract-path-fallback`, `overlay-unmarked`, `authn-only-path-guard`) fail closed at construction (`ROUTER_CLIENT_PATH_AUTHZ_UNSUPPORTED`); procedure-aware fallback matches HTTP parity.
3. **Test 3 (B3):** HTTP edge preserves 401-before-413, 403-before-413 (body never read), 401-before-404/410, `404 procedure_not_found`, `410 procedure_retired`, `findInternalGuard` (`HEAD` and `DELETE` on internal OpenAPI path → `403`), and `429` + `Retry-After`.
4. **Test 4 (B4 failing-then-passing):** Demonstrates all 3 attacks erroneously passing under the Round-0 unscoped `WeakSet` + global `isInternalServicePrincipal`, then proves the scoped `VerifiedPrincipalRecord` + service-audience check defeats all 3 (`401`/`403`) — plus proves true single-authn (`realHttpAuthCalls.count === 1` counted directly at `AuthenticatorPort`).
5. **Test 5 (B5 failing-then-passing):** Demonstrates lazy snapshot poisoning (`'tenant-A-session'` leak) and unwrapped streaming pull leakage (`'consumer-leaked-pull'`), then proves `captureCleanAsyncRootOrThrow` fails closed on active ALS/OTel span and `wrapDetachedAsyncIterator` isolates all 3 `next()` pulls and `return()` cleanup alongside OTel span propagation.
6. **Test 6 (B6 + advisories):** Refresh-on-read `setCookies` fails closed without sink and forwards with sink; public procedure rate limiting isolates distinct `clientAddress` visitors; `withRateLimit`-without-`withProcedureRateLimit` and unstarted `onStartup` fail closed at construction; `wrapRouterIdempotent` prevents double execution; `AbortSignal`, auth-before-validation, and Zod strict vs `z.unknown()` aliasing verified.

## Drawbacks

1. **Retained HTTP-edge resolver:** Keeping 401-before-413, 403-before-413, 401-before-404/410, `findInternalGuard`, and `claims()` requires maintaining the URL-to-procedure resolver at the HTTP edge alongside the procedure pipeline (mitigated on v2 by delegating to oRPC v2's native `RPCMatcher` and `OpenAPIMatcher`).
2. **Construction-time restrictions on legacy services:** Services using path-based `createScopeAuthorizer`, `createContractOverlayAuthorizer` with unmarked procedures, custom Hono `.use()` middleware, or refresh-on-read cookie sessions without a sink cannot use router-client without adopting contract-derived policies (they must use #2659 fetch-link instead).
3. **Input & output reference aliasing caveats:** Strict Zod object/array schemas clone outputs, but `z.any()`, `z.unknown()`, `z.custom()`, class instances, and **inputs** share JS references in-process.
4. **Modest absolute savings on low-fan-out paths:** Saving ~0.17–0.30 ms per call matters primarily on high-fan-out loaders (20–50 calls/render), batch worker/saga loops, and live `eventIterator` streams — not on 1–3 call pages.

## Rationale and alternatives

| Option | Assessment | Verdict |
| --- | --- | --- |
| **1. Replace #2659** (router-client only; drop fetch-link) | Leaves NetScript with no zero-socket way to test HTTP-edge middleware (`withBodyLimit`, `withCors`, `Set-Cookie`, raw routes, `retiredPaths`, wire codec) or mount opaque `ServiceApp`s or path-guarded legacy services. | **Rejected** |
| **2. Coexist immediately on v1** | Ships a v1-shaped public router-client API right before oRPC v2 (`2.0.0`) changes `oc.$meta`, `ORPCError`, `StandardHandlerPlugin`, and `@orpc/opentelemetry`, forcing two downstream migrations. | **Rejected** |
| **3. Split-Stage into Coexistence, decoupled from #2659** | **Stage 1a (`0.0.10`):** Unblock and amend PR #2659 independently (handled separately) + ship safe, zero-break procedure-pipeline wins on v1 (unified `requestId` fixing `orpc-plugin.ts:371`, idempotent wrapping, declarative `withProcedureRateLimit` over RFC 0008 `RateLimitStore`, removing redundant `CORSPlugin` in `handlers.ts`). **Stage 1b (`0.0.11`):** Ship procedure-level contract authz + scoped `VerifiedPrincipalRecord` + `service.start()`/`stop()` lifecycle while keeping HTTP edge 401/403-before-413 & 404/410 responses byte-identical. **Stage 2 (`0.1.0` / oRPC v2 GA, aligned with PR #2674):** Plug `createRouterClientTransport` into `createServiceClient({ transport })` with construction-time capability checks so both transports coexist cleanly. | **Recommended** |
| **4. Fetch-link only now; defer router-client until measured production need** | Viable conservative fallback: #2659 covers 1–3 call SSR pages and integration tests at ~0.2–0.35 ms/call with zero auth-layer risk. However, deferring Stage 1a/1b leaves `requestId` uncorrelated, `withRPC({ rpcRouter })` unguarded against bare `call()`, and high-fan-out SSR/worker/streaming workloads paying unnecessary HTTP/SSE framing. Stage 1a + gated Stage 1b captures the low-risk hardening immediately while allowing Stage 2 to ship only once oRPC v2 GA lands and high-fan-out demand is confirmed. | **Fallback if Stage 2 priority shifts** |

### Steady-state transport selection rule (enforced at construction, not just prose)

- **`createServiceClient({ transport: createRouterClientTransport(startedService) })`** — enforced at construction to require `service.start()`, contract-derived authorization (`createContractAuthorizer` + optional `ProcedureAuthorizerPort` fallback), `withProcedureRateLimit` whenever `withRateLimit` is set, and no unacknowledged custom Hono `.use()`. Ideal for high-fan-out BFF/SSR loaders, internal service-to-service calls, and `eventIterator` streaming.
- **`createServiceClient({ transport: createInProcessServiceLink({ app }) })` (#2659)** — works for every `ServiceApp` including path-based authorizers, `withBodyLimit`/`withCors` tests, browser `Set-Cookie` rotation (`plugins/auth`), raw routes (`plugins/streams`, `plugins/triggers`), and HTTP wire-codec verification.

## Downstream consumers

> All downstream impact analysis below applies generically to any downstream application built on NetScript.

### Public API, behavior changes, and deprecations

- **Stage 1a (`0.0.10`, non-breaking / additive on oRPC v1):**
  - Unified `requestId` in `LoggingPlugin` (replaces the uncorrelated second ID minted by `createRequestId()` at `packages/logger/orpc-plugin.ts:371`).
  - Additive `ServiceBuilder.withProcedureRateLimit(...)` wrapping RFC 0008's `RateLimitStore`.
  - Redundant wildcard `CORSPlugin` removed from `handlers.ts` (preserving `withCors()` as sole CORS authority).
  - HTTP status codes and JSON error bodies for `401`, `403`, `404`, `410`, `413`, and `429` remain **byte-identical**.
- **Stage 1b (`0.0.11`, non-breaking / additive on oRPC v1):**
  - Additive `ServiceBuilder.start()` → `StartedService` non-listening lifecycle handle (`app`, `stop()`).
  - Additive `ProcedureAuthorizerPort` (`authorizeProcedure`) for request-less fallback rules.
  - Internal procedure pipeline enforces contract-meta authz (including unmarked → `403 authz.no-matching-rule`), scoped `VerifiedPrincipalRecord`, and idempotent wrapping. HTTP edge responses remain **byte-identical**.
- **Stage 2 (`0.1.0`, coordinated with oRPC v2 GA in companion PR #2674 / tracker #2672):**
  - Additive `createRouterClientTransport(startedService, options)` plugging into `createServiceClient({ transport })`.
  - Deprecation of invoking raw unwrapped routers via `@orpc/server` `createRouterClient` / `call` directly.

### Generated code and CLI scaffold changes

- Stage 1a and Stage 1b require **no breaking syntax change** in generated service/contract scaffolds (`packages/cli/src/kernel/assets/service/*`).
- Stage 2 updates generated service entrypoints to export a pure `create<Name>Service(deps)` builder alongside `main.ts` calling `.serve()`, allowing co-located hosts to call `await create<Name>Service(deps).start()` without binding a TCP port at import time.

### Migration steps and single consolidated codemod

- Because Stage 1a and Stage 1b are non-breaking on HTTP, downstream applications need **no Stage 1 codemod** (avoiding two separate codemod passes!).
- At Stage 2 (consolidated with companion PR #2674's `netscript migrate orpc-v2` codemod): applications opting into `createRouterClientTransport` run a single analyzer pass that flags: (1) path-based `createScopeAuthorizer` / `createContractOverlayAuthorizer` rules to migrate to `meta.access` or `ProcedureAuthorizerPort`, (2) `withContext(c)` reads of HTTP headers needed in-process, (3) `withRateLimit()` without `withProcedureRateLimit()`, (4) custom `.use()` middleware, and (5) schema-less / `z.unknown()` procedures exposed in-process.

### Configuration changes

- `withProcedureRateLimit({ store, limit, windowMs, key })`: optional post-auth / public procedure quota sharing `RateLimitStore` with `withRateLimit`. Public procedures must receive a forwarded `clientAddress` (or explicit key) rather than sharing one anonymous bucket.
- `createRouterClientTransport(startedService, { propagateTraceContext, authnSideEffects })`: `propagateTraceContext` defaults to `true`; `trustSharedPrincipal` is configured on the **service builder** (`trustedVerifiers`, default `false` / empty, never honored for `audience: 'internal'`).

### Security implications

- **Closed gaps:** Closes bare `call()` / `createRouterClient` auth bypasses, blocks cross-service & expired-`exp` principal replay, closes cross-service `audience: 'internal'` leakage (`orders` → `billing`), revokes delegated principals on originating-request completion or logout, blocks lazy-import ALS snapshot poisoning and streaming pull leakage, and fails closed rather than dropping refresh-on-read `setCookies` or HTTP-only rate limits.
- **Preserved HTTP defenses:** 401-before-413, **403-before-413**, 401-before-404/410, `findInternalGuard`, `claims()`, and `procedure_not_found`/`procedure_retired` remain intact at the HTTP edge.
- **Residual caveat:** In-process callers sharing JS memory with a service must respect strict Zod schemas (and avoid mutating input objects or `z.unknown()`/`z.custom()` return references).

### Compatibility window

- **Stage 1a (`0.0.10`)** and **Stage 1b (`0.0.11`)** are strictly backward-compatible on NetScript's `0.0.x` / oRPC v1 (`^1.15.5` / `^1.16.6`) line, keeping HTTP error shapes byte-identical.
- **Stage 2 (`0.1.0`)** ships exclusively with the coordinated oRPC v2 GA release (companion PR #2674 / tracker #2672), with at least one minor release cycle (≥60 days) of v1 maintenance overlap before deprecating direct unwrapped router invocation.

## Breaking changes and migration

Stage 1a (`0.0.10`) and Stage 1b (`0.0.11`) introduce **no breaking changes** on HTTP (all HTTP status codes, JSON error envelopes, and deny-by-default rules remain byte-identical). Breaking v2 changes (including oRPC v2 error-envelope and metadata shifts) are isolated to the coordinated `0.1.0` / oRPC v2 cut-over tracked in companion PR #2674 (issue #2672).

## Prior art

- **oRPC official docs** ([Server-Side Client](https://orpc.dev/docs/client/server-side), [Optimize SSR](https://orpc.dev/docs/best-practices/optimize-ssr)) — notes `.callable` is no longer built in on v2 (opt-in extension), preferring `call`/`createRouterClient` for efficiency and fetch links for full HTTP plugin compatibility.
- **Draft PR #2659** (`rfcs/0000-in-process-service-link.md`, head `d2c0e05b`) — recommended to be amended and taken off hold independently, providing full HTTP-stack parity via fetch-link.
- **Accepted RFC 0001** (`rfcs/0001-sdk-client-contributions.md`) — transport-neutral client contributions without exposing raw oRPC links.
- **Accepted RFC 0008** (`rfcs/0008-rolling-service-quotas.md`) — defines `RateLimitStore`, `RateLimitDecision`, and post-auth `store.consume()` usage that `withProcedureRateLimit` wraps declaratively.
- **Companion RFC B** (draft PR #2674, tracking issue #2672) — oRPC v2 readiness and prototype evidence (`2.0.0-beta.53`).

## Unresolved questions

1. **Strict input/output cloning policy:** For procedures using `z.unknown()`, `z.any()`, or `z.custom()`, should `createRouterClientTransport` default to `structuredClone()` on inputs and outputs in development/test, or reject non-plain schemas at construction unless explicitly opted in?
2. **`plugins/auth` cookie-free in-process mode:** Should `plugins/auth` expose a dedicated cookie-free introspection/verification service handle while keeping cookie-mutating `login`/`logout`/`refresh` strictly HTTP/fetch-link, or wire `authnSideEffects.onSetCookies` in Fresh SSR loaders?
3. **Graceful drain timeout for `StartedService.stop()`:** What default drain timeout should `stop()` apply to long-lived in-process `eventIterator` streams before aborting their signals?
4. **Stage 2 go/no-go gate:** Should Stage 2 (`createRouterClientTransport`) ship automatically with oRPC v2 GA (`0.1.0`), or additionally require a recorded high-fan-out benchmark target from a real NetScript workload where #2659's ~0.2–0.35 ms/call is insufficient?

## Future possibilities

- **Modular monolith deployment profiles** switching seamlessly between `createRouterClientTransport` (co-located), `createInProcessServiceLink` (#2659, full HTTP parity), and HTTP `RPCLink` (distributed) through a single `createServiceClient({ transport })` configuration.
- **Static contract linter** verifying `meta.access`, strict Zod `.output(...)` schemas, and absence of path-only authorizers before enabling router-client transport in CI.
