---
rfc: 0000
title: In-process service link with HTTP transport parity
status: Draft
authors: ['@rickylabs']
created: 2026-11-24
tracking-issue: pending (reference issue: https://github.com/rickylabs/netscript/issues/451)
target-milestone: 0.0.10
---

# In-process service link with HTTP transport parity

> **Status: Draft.** No accepted governing RFC covers the in-process service link, and the
> referenced feature issue (`#451`) does not constitute RFC acceptance. This draft specifies the
> proposed design only and does not authorize implementation under `packages/` or `plugins/`. Code
> snippets below illustrate the proposed API as if shipped; none of the proposed symbols exist on
> `main` yet.

## Summary

This RFC specifies an in-process transport mode for `@netscript/sdk` service clients that dispatches
typed oRPC calls directly to a mounted `ServiceApp` via Web Platform `Request` / `Response` without
opening a network socket, while preserving behavioral parity with the existing HTTP link across
defined parity boundaries. The in-process link reuses the SDK's single oRPC `RPCLink`, transport
policy, RFC 0001 contribution preparation pipeline, response-cache partitioning, and transport-owned
W3C trace injection, varying only epoch-pinned destination resolution and an abort-aware,
redirect-refusing, root-context-detached `app.fetch(request)` adapter. The default transport
remains `http` so existing callers are unchanged, a package-owned structural port avoids pulling
server-only `@netscript/service` dependencies into browser-safe SDK entrypoints, and an explicit
HTTP-versus-in-process parity and edge-control suite gates implementation.

## Motivation

### Re-baseline against current main

Issue [#451](https://github.com/rickylabs/netscript/issues/451) was originally filed before
[RFC 0001](0001-sdk-client-contributions.md) and several SDK/service refactors landed on `main`
(`87965d800b7d61312e8612c82bdb0cb98bdf5b29`). The current codebase establishes the following
verified baseline facts:

| Current baseline fact                                                                                                                                                                                                                   | Provenance                                                                                                                                                                           | Design implication                                                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createServiceClient()` resolves `transportPolicy`, validates RFC 0001 `contributions`, builds `rpcPath` via `buildServiceRpcPath()` from `@netscript/service/rpc-path`, constructs `createHttpClientLink()`, and registers `contributionRuntimeByClient` (`WeakMap`). | Source-inspected: `packages/sdk/src/client/service-client.ts:8,84-147`                                                                                                               | Any in-process transport must flow through `createServiceClient()` so `transportPolicy`, contributions, `rpcPath`, and `WeakMap` cache-partition bindings remain identical.            |
| `createHttpClientLink()`, `ClientLinkPort`, and `ClientLinkCallOptions` are strictly package-private and excluded from public `deno doc --json` across `.`, `./client`, `./ports`, and `./desktop`.                                     | Source-inspected: `packages/sdk/tests/client-contribution-private-surface_test.ts:4-19,90-109`                                                                                       | `createInProcessClientLink()` must remain package-private alongside `createHttpClientLink()` rather than leaking `ClientLinkPort` or oRPC link types onto the public JSR surface.      |
| `createHttpClientLink()` already accepts an internal `fetch?: typeof globalThis.fetch` seam and wraps it in `withSpan(SpanNames.RPC_CLIENT, ..., { kind: SpanKind.CLIENT })` plus `injectContext()` for W3C `traceparent`/`tracestate`. | Source-inspected: `packages/sdk/src/client/http-client-link.ts:66,121,179-209`                                                                                                       | HTTP and in-process can share one internal RPC link factory with zero codec or plugin duplication.                                                                                     |
| `createService(...).build()` returns a non-listening `ServiceApp` (`fetch` + `request`); `serve()` returns `RunningService { app, addr, stop }` exposing the same `ServiceApp` instance.                                                | Source-inspected: `packages/service/src/types.ts:20-31,46-55`; `packages/service/src/builder/service-builder-impl.ts:515-524`; `packages/service/src/builder/service-listener.ts:207-213` | One built `ServiceApp` can back both an HTTP listener and an in-process link simultaneously for exact parity verification.                                                             |
| `@netscript/sdk` already depends on `@netscript/service` in `packages/sdk/deno.json` for leaf subpaths (`./rpc-path`, `./internal-credential`); `@netscript/service` has zero imports of `@netscript/sdk`.                                | Source-inspected: `packages/sdk/deno.json:33`; `packages/sdk/src/client/service-client.ts:8`; `packages/sdk/src/client/internal-credential-contribution.ts:11`; `packages/service/deno.json` | No circular package dependency exists, yet root `@netscript/service` imports remain forbidden for universal SDK entrypoints.                                                           |
| Baseline `deno info --json packages/sdk/mod.ts` resolves 113 modules with 0 logger/kv/hono/`node:` edges; adding `import type { ServiceApp } from '@netscript/service'` expands to 215 modules pulling `packages/logger/`, `packages/kv/`, `hono`, and `node:*`, and exposes `Deno.Addr`. | Measured: `deno info --json` against `main` `87965d80` (Deno 2.9.7); source-inspected: `packages/service/src/types.ts:15-18`, `packages/sdk/tests/query/define-services-browser-import_test.ts:38-63,103-110` | `@netscript/sdk` must define a minimal, runtime-neutral structural port (`InProcessServiceApp`) rather than importing `ServiceApp` from `@netscript/service` root.                     |
| `SdkClientTransportDescriptor` on `main` declares `readonly kind: 'http'`, `origin: URL`, `rpcPath: string`, `secure: boolean`; bearer and internal-credential contributions allow credentials when `transport.secure` or loopback origin holds. | Source-inspected: `packages/sdk/src/ports/sdk-client-contribution.ts:30-39`; `packages/plugin-auth-core/src/sdk/bearer-contribution.ts:87-95`; `packages/sdk/src/client/internal-credential-contribution.ts:118-129` | In-process transport reports `secure: true` with a canonical RFC 6761 `.localhost` synthetic origin (`https://in-process.localhost`) as an explicit host trust decision; widening `kind` is a compatibility trade-off analyzed explicitly below. |
| Naive `app.fetch(new Request(req, init))` delivers `request.signal` abort to the mounted handler, **but does not reject the caller promise** (measured: caller resolved `{ done: true }` after abort on both cooperative and non-cooperative handlers). | Measured: parity probes against `main` `87965d80` (Deno 2.9.7, locked `@orpc/client@1.15.5`, `jsr:@hono/hono@4.13.13`)                                                               | The in-process fetch adapter must subscribe before dispatch, race `app.fetch(request)` against `signal`, fail closed on locked/disturbed bodies, release the owned reader lock and abort listener on every terminal path, and guarantee at most one `body.cancel()`. |
| Calling `app.fetch(request)` directly inside `withSpan(SpanNames.RPC_CLIENT)` leaks the caller's active OpenTelemetry trace into the mounted app via same-process `AsyncLocalStorage` even when `propagateTraceContext: false` — and deferred `Response.body` reads/cancellations or late cleanup callbacks inherit the caller's ALS context unless also detached. | Measured: trace-isolation probes against `main` `87965d80` (SERVER span and deferred body callbacks inherited caller context without detachment; detached to `ROOT_CONTEXT` with `withContext(extractContext({}), ...)`) | The in-process fetch adapter must execute `app.fetch(request)`, register the single late-settlement hook, and run all wrapped source stream `read()` / `cancel()` operations inside `withContext(extractContext({}), ...)`. |
| Locked `@orpc/client@1.15.5` `StandardRPCLinkCodec.decode()` checks `status >= 400`, so a raw `302` empty-body redirect returned to `RPCLink` decodes as `isSuccess: true, data: null`.                                                 | Measured: frozen probe against `main` `87965d80` (`@orpc/client@1.15.5`)                                                                                                             | `createInProcessFetch()` must explicitly intercept WHATWG redirect statuses (`301, 302, 303, 307, 308`), cancel the body once in `ROOT_CONTEXT`, and reject without following redirects. |
| On current `main`, `DedupeRequestsPlugin` in `http-client-link.ts` strips `context` (`cache: 'no-store'`, `signal`, and internal symbols) before `fetch` on `GET` and keys dedup only on wire request `(method, URL, body, headers)`. Issue [#2610](https://github.com/rickylabs/netscript/issues/2610) / PR [#2611](https://github.com/rickylabs/netscript/pull/2611) owns the `no-store`/`signal` repair. | Source-inspected: `packages/sdk/src/client/http-client-link.ts:168-177`, `packages/sdk/src/internal/transport-policy.ts:183-187`; measured: frozen probes (`hasSignal: false`, `wireCallsObserved: 1` for identical-header distinct partitions on `GET`, `handlerEntries: 2` on `POST`) | This RFC does not redesign `GET` transport or deduplication. Epoch-pinned dispatch uses an SDK-private per-epoch binding (`resolveEpoch`) paired with a per-app `WeakMap<InProcessServiceApp, ClientLinkPort>` so binding isolation is immune to both `DedupeRequestsPlugin` context stripping and retained public descriptors; shared-SDK `DedupeRequestsPlugin` partition-keying is a hard prerequisite for full identical-header `GET` parity. |
| `RPCLink` compares full absolute URL length (`origin + rpcPath + query`) against `maxUrlLength: 2083` before `GET`→`POST` fallback; `Deno.serve` passes `{ remoteAddr }` to `app.fetch(req, env)` while one-argument `app.fetch(req)` omits socket peer metadata. | Source-inspected: `packages/sdk/src/internal/transport-policy.ts:197`, `packages/service/src/builder/service-listener.ts:113-114`, `packages/service/src/rate-limit/middleware/rate-limit-middleware.ts:61-91`; measured: frozen edge-controls probe | Exact parity boundaries are explicitly defined for near-2083 verb fallback and socket-metadata-dependent middleware (`withRateLimit()`), with required acceptance controls for both. |
| The historical `design/E-desktop/epic-and-issues.md` file referenced in issue `#451` is no longer present in the repository; PR `#822` closed unmerged, `#824`/`#850` are superseded, and `#891` (deploy plugin RFC) keeps in-process SDK transport orthogonal. | Source-inspected: repository tree (`design/` absent); GitHub issue/PR records `#822`, `#824`, `#850`, `#891`                                                                         | This RFC stands on its own against current `main` and accepted RFC 0001, without building on superseded single-runtime drafts.                                                         |

### User problem

NetScript services already materialize a listener-free `ServiceApp` via `createService(...).build()`
(`packages/service/src/builder/service-builder-impl.ts:515-524`). Without an in-process SDK
transport, callers in a single-process deployment, embedded host, or integration test must either:

1. bind an ephemeral loopback TCP listener (`serve({ port: 0 })`), inject discovery environment
   variables, manage listener teardown, and require `--allow-net`; or
2. call router procedures directly, bypassing Hono middleware (`withAuthn`, `withAuthz`,
   `withBodyLimit`, `withRateLimit`, `withCors`, `withLogger`, `createHonoTracingMiddleware`),
   canonical RPC path routing, oRPC wire serialization, and RFC 0001 client contributions.

Both workarounds hurt either runtime portability or correctness. An in-process service link lets
application code, `defineServices()`, and tests call mounted services through the exact typed SDK
surface without sockets while keeping HTTP parity as a mechanical invariant across defined parity
boundaries.

### Goals

This RFC MUST:

1. provide an in-process transport mode for `createServiceClient()` and `defineServices()` that
   reuses the SDK's single `RPCLink`, transport policy, and canonical `buildServiceRpcPath()`
   pathname without a bespoke RPC codec;
2. keep `transport` defaulting to `{ kind: 'http' }` so existing callers remain source- and
   behavior-compatible;
3. preserve RFC 0001 contribution semantics identically across HTTP and in-process transports:
   once-per-epoch header preparation, reserved header enforcement, redacted errors, response-cache
   partitioning (`$netscript.sdk-context`), and `direct-only` omission;
4. make credential trust for mounted bindings explicit, pin dispatch to the exact binding resolved
   before contribution preparation for each logical epoch, refuse HTTP redirects without network
   fallback, and document replacement semantics;
5. preserve transport-owned W3C trace propagation (`traceparent` / `tracestate`) and `rpc.client`
   CLIENT spans when `propagateTraceContext: true`, and preserve trace isolation when
   `propagateTraceContext: false`;
6. preserve mounted-app middleware, authn/authz denial, contract-defined error, and wire
   encoding/decoding parity with HTTP, while stating exact parity boundaries where transport inputs
   legitimately differ (`maxUrlLength` verb fallback and socket peer metadata);
7. propagate caller `AbortSignal` cancellation into the mounted handler, enforce abort across setup,
   in-flight dispatch, and unfinished response-body consumption with a single cleanup path and
   bounded SDK retention;
8. provide explicit direct binding (`app`), isolated scoped registries for registry lookup isolation
   (`createInProcessServiceRegistry()`), and default process-scoped registry helpers with
   `clearInProcessServices()`; and
9. preserve `@netscript/sdk` browser safety, Deno-free universal ports, JSR publishability, minimal
   barrel export growth, and private-adapter hygiene (`client-contribution-private-surface_test.ts`).

### Non-goals

This RFC does not:

- redesign SDK `GET` transport, `DedupeRequestsPlugin`, or `no-store` / `signal` forwarding on the
  shared HTTP link (owned by [#2610](https://github.com/rickylabs/netscript/issues/2610) /
  [#2611](https://github.com/rickylabs/netscript/pull/2611));
- define a single-process application host, unified-runtime CLI, or deployment target
  ([#891](https://github.com/rickylabs/netscript/issues/891) keeps deployment orthogonal; `#822` is
  closed unmerged and `#824`/`#850` are superseded and not built upon);
- synthesize fake network socket metadata (`ServiceEnvironment.remoteAddr`) for in-process calls;
- expose arbitrary user-supplied `ClientLinkPort`, raw `fetch`, or raw oRPC `RPCLink` instances on
  `CreateServiceClientOptions`;
- add HTTP header contributions to `@netscript/sdk/desktop` MessagePort clients (which continue to
  reject `contributions` with `SDK_CONTRIBUTION_TRANSPORT_UNSUPPORTED`); or
- migrate `@netscript/sdk` from stable oRPC v1 to oRPC v2.

## Guide-level explanation

### Default HTTP transport (unchanged)

Existing calls to `createServiceClient()` and `defineServices()` omit `transport` and continue to
use HTTP service discovery with zero changes:

```ts
import { createServiceClient } from '@netscript/sdk/client';
import { ordersContract } from './contracts/orders.ts';

// transport defaults to { kind: 'http' }
const orders = createServiceClient({
  contract: ordersContract,
  serviceName: 'orders',
});
```

### Direct in-process binding

When the caller already holds a built `ServiceApp` (from `createService(...).build()` or
`RunningService.app`), bind it directly without touching any shared registry:

```ts
import { createService } from '@netscript/service';
import { createServiceClient } from '@netscript/sdk/client';
import { createInProcessServiceClient } from '@netscript/sdk/in-process';
import { ordersContract } from './contracts/orders.ts';
import { ordersRouter } from './services/orders/router.ts';

const ordersApp = createService(ordersRouter, { name: 'orders' })
  .withRPC({ rpcPath: '/api/rpc/v1/orders' })
  .build();

// Option 1: explicit transport on createServiceClient
const orders = createServiceClient({
  contract: ordersContract,
  serviceName: 'orders',
  transport: { kind: 'in-process', app: ordersApp },
});

// Option 2: convenience wrapper on @netscript/sdk/in-process (identical behavior and inference)
const ordersDirect = createInProcessServiceClient({
  contract: ordersContract,
  serviceName: 'orders',
  app: ordersApp,
});

const order = await orders.get({ id: 'ord_123' });
```

### Scoped registry for parallel tests and explicit composition

Use `createInProcessServiceRegistry()` from `@netscript/sdk/in-process` to wire multiple mounted
services with explicit lifetime and registry lookup isolation across concurrent tests (note: shared
server or TanStack caches remain keyed by resource/action/input/partition and should still be
isolated per test when mounting different implementations):

```ts
import { defineServices } from '@netscript/sdk/presets';
import { createInProcessServiceRegistry } from '@netscript/sdk/in-process';

const registry = createInProcessServiceRegistry();
registry.register('orders', ordersApp);
registry.register('billing', billingApp);

const { clients, queries, queryUtils } = defineServices({
  orders: {
    contract: ordersContract,
    contributions: [bearerContribution, localeContribution] as const,
    transport: { kind: 'in-process', registry },
  },
  billing: {
    contract: billingContract,
    transport: { kind: 'in-process', registry },
  },
});

const result = await clients.orders.get(
  { id: 'ord_123' },
  { context: { auth: sessionAuth, locale: 'de-CH' } },
);
```

### Default process-scoped registry for single-process hosts

When a single-process composition root mounts services once at startup and consumers construct
clients with `transport: { kind: 'in-process' }` (no explicit `app` or `registry`), the SDK
resolves `serviceName` lazily from the default registry:

```ts
import { createServiceClient } from '@netscript/sdk/client';
import {
  clearInProcessServices,
  registerInProcessService,
} from '@netscript/sdk/in-process';

// At composition root startup:
registerInProcessService('orders', ordersApp);

// In consumer modules (constructed before or after registration):
const orders = createServiceClient({
  contract: ordersContract,
  serviceName: 'orders',
  transport: { kind: 'in-process' },
});

// In test teardown:
clearInProcessServices();
```

### Cancellation in-process

Per-call `AbortSignal` cancels both in-flight handler execution and unread/streaming response bodies:

```ts
const controller = new AbortController();
const pending = orders.slowReport({ id: 'r_1' }, { context: { signal: controller.signal } });
controller.abort(new Error('request cancelled'));
// Mounted handler observes signal.aborted === true; `pending` rejects with the abort reason.
```

## Reference-level explanation

### Architecture, doctrine archetype, and package placement

This proposal extends `@netscript/sdk` (`packages/sdk`, Architecture Doctrine Archetype 2 —
Integration, current verdict `Keep` in
[10-codebase-verdict-and-handoff.md](../docs/architecture/doctrine/10-codebase-verdict-and-handoff.md))
and introduces no new package.

| File (proposed)                                               | Visibility                                                 | Role                                                                                                                                      |
| ------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/sdk/src/ports/service-client.ts`                    | Public (`./ports`, `./client`, `./presets`, `./in-process`, `.`) | Existing port file (382 LOC baseline): adds upstream-free `InProcessServiceApp`, `InProcessServiceRegistry`, and `ServiceClientTransport` while keeping `ports/` at 12 immediate children. |
| `packages/sdk/src/in-process/mod.ts`                          | Public (`./in-process` focused subpath; **12 symbols ≤ 20 F-5 cap**) | Bounded public barrel exporting `InProcessServiceError`, `InProcessServiceErrorCode`, `createInProcessServiceClient`, `CreateInProcessServiceClientOptions`, `createInProcessServiceRegistry`, default-registry helpers, and the 3 port types — intentionally NOT re-exported on `.` or `./client` (matching `./desktop` and `./auto-update`). |
| `packages/sdk/src/in-process/registry.ts`                     | Public via `./in-process`                                  | `InProcessServiceError`, `createInProcessServiceRegistry()`, and default registry helpers (`register`/`unregister`/`resolve`/`clear`).    |
| `packages/sdk/src/in-process/create-client.ts`                | Public via `./in-process`                                  | `CreateInProcessServiceClientOptions` and `createInProcessServiceClient()` delegating directly to `createServiceClient()`.                |
| `packages/sdk/src/in-process/client-link.ts`                  | Package-private                                            | `createInProcessClientLink()` (SDK-private per-epoch `resolveEpoch` + per-app `WeakMap<InProcessServiceApp, ClientLinkPort>`) and `createInProcessFetch()`. |
| `packages/sdk/src/internal/fetch-rpc-link.ts`                 | Package-private                                            | Shared `RPCLink` + `ClientRetryPlugin` + `DedupeRequestsPlugin` + `withSpan(RPC_CLIENT)` + `createStableV1ClientLink` builder.            |
| `packages/sdk/src/internal/client-contributions/stable-v1-adapter.ts` | Package-private                                    | Adds optional package-private `resolveEpoch` hook to `StableV1ClientLinkOptions` so per-epoch app bindings stay local to `startEpoch()` and never attach to public `SdkClientTransportDescriptor`. |
| `packages/sdk/src/client/http-client-link.ts`                 | Package-private                                            | Thin HTTP specialization delegating to `fetch-rpc-link.ts` with `resolveServiceUrl` and `globalThis.fetch`.                               |
| `packages/sdk/src/client/service-client.ts`                   | Public (`./client`, `.`)                                   | Branches on `transport.kind` (`'http'` default vs `'in-process'`); adds zero new runtime exports to `./client` or `.`.                    |
| `packages/sdk/src/presets/define-services.ts`                 | Public (`./presets`, `.`)                                  | Adds `transport?: ServiceClientTransport` to `DefineServiceConfig` and forwards it to `createServiceClient()`.                            |

Folder cardinality and file-size check against doctrine R-FOLD-CARD and F-1
(`docs/architecture/doctrine/05-folder-structure.md:167-185`, `09-anti-patterns-and-fitness-functions.md:201-205`):

- `packages/sdk/src/in-process/` is a new focused subpath directory (following `src/desktop/` and
  `src/auto-update/` in `packages/sdk/deno.json:8-9`) containing 4 immediate children (`mod.ts`,
  `registry.ts`, `create-client.ts`, `client-link.ts`) — well within the 12-child cap.
- `packages/sdk/src/client/` stays at 10 immediate children (`+0` children).
- `packages/sdk/src/ports/` stays at 12 immediate children (`+0` children; `service-client.ts` stays
  below the 500 LOC F-1 threshold).
- `packages/sdk/src/internal/` grows from 2 to 3 immediate children (`fetch-rpc-link.ts`).

**Why `createInProcessClientLink` stays package-private:**
`packages/sdk/tests/client-contribution-private-surface_test.ts:4-19,90-109` enforces that
`createHttpClientLink`, `ClientLinkPort`, `ClientLinkCallOptions`, and `ResolvedTransportPolicy`
never appear in `deno doc --json` for `.`, `./client`, `./ports`, or `./desktop`. Exporting
`createInProcessClientLink` publicly would either expose `ClientLinkPort` / `ResolvedTransportPolicy`
or expose a raw oRPC `RPCLink`, violating both RFC 0001's zero-oRPC boundary and
`client-contribution-private-surface_test.ts`. Furthermore, bypassing `createServiceClient()` would
omit `contributionRuntimeByClient` (`WeakMap`) registration (`packages/sdk/src/client/service-client.ts:128-145`),
silently breaking `createQueryFactory()` and `createServiceQueryUtils()` cache partitioning.
`createInProcessClientLink` and `createFetchRpcClientLink` are therefore added to
`PRIVATE_ADAPTER_NAMES` alongside `createHttpClientLink`, while `createServiceClient({ ..., transport })`
and `createInProcessServiceClient(...)` provide the public entrypoints.

### Dependency direction for `ServiceApp` (`sdk` ↔ `service`)

Issue `#451` item 7 requires deciding whether `@netscript/sdk` imports `type { ServiceApp }` from
`@netscript/service` or mirrors its structural shape in `@netscript/sdk`.

#### Measured dependency graph evidence

- **Current direction (source-inspected):** `packages/sdk/deno.json:33` already declares
  `"@netscript/service": "jsr:@netscript/service@0.0.9"`. `packages/sdk/src/` imports ONLY two
  leaf subpaths: `@netscript/service/rpc-path` (`packages/sdk/src/client/service-client.ts:8`, zero
  imports) and `@netscript/service/internal-credential`
  (`packages/sdk/src/client/internal-credential-contribution.ts:11`, Web Crypto + `Deno.open`).
  `packages/service/` has zero imports of `@netscript/sdk`.
- **Baseline browser-safety graph (measured on `main` `87965d80`):**
  `deno info --json packages/sdk/mod.ts` resolves **113 modules** with `HAS_LOGGER: false`,
  `HAS_KV: false`, `HAS_HONO: false`, `HAS_NODE: false`.
  `packages/sdk/tests/query/define-services-browser-import_test.ts:38-63,103-110` enforces zero
  `/packages/kv/`, `/packages/logger/`, or `node:` edges on both `packages/sdk/mod.ts` and
  `packages/sdk/src/presets/mod.ts`.
- **Importing `type { ServiceApp } from '@netscript/service'` (measured on `main` `87965d80`):**
  `deno info --json` on a single-line file containing only
  `import type { ServiceApp } from '@netscript/service'` resolves **215 modules** with
  `HAS_LOGGER: true`, `HAS_KV: true`, `HAS_HONO: true`, `HAS_NODE: true` — immediately breaking
  `define-services-browser-import_test.ts`.
- **Deno-global bleed (source-inspected):** `packages/service/src/types.ts:15-31` defines
  `ServiceApp.fetch(request: Request, env?: ServiceEnvironment)` where
  `ServiceEnvironment.remoteAddr?: Deno.Addr`. Pulling `ServiceApp` into `@netscript/sdk`'s
  universal client/ports/presets declarations exposes `Deno.Addr` to browser and React Native
  consumers (`packages/sdk/tests/integration/fixtures/no-deno-runtime-client.ts`).

#### Decision and rationale

`@netscript/sdk` MUST define a package-owned, runtime-neutral structural port `InProcessServiceApp`
rather than importing `type { ServiceApp } from '@netscript/service'`:

```ts
/** Minimal mountable service app accepted by the SDK in-process transport. */
export interface InProcessServiceApp {
  /** Handle a Web Platform request without opening a network listener. */
  fetch(request: Request): Response | Promise<Response>;
}
```

Rationale:

1. **Zero browser/runtime regression:** `InProcessServiceApp` references only Web Platform
   `Request` and `Response` (doctrine A7), keeping `define-services-browser-import_test.ts` at zero
   browser-unsafe edges and preserving Deno-free portability.
2. **Zero-cast compatibility with `@netscript/service`:** Because `ServiceApp.fetch(request, env?)`
   has an optional `env` parameter (`packages/service/src/types.ts:23`), every `ServiceApp` returned
   by `createService(...).build()` or `RunningService.app` is structurally assignable to
   `InProcessServiceApp` without casts. A dedicated compile-time type fixture
   (`packages/sdk/tests/type-fixtures/in-process-service-app_type.ts`) MUST prove
   `ServiceApp` → `InProcessServiceApp` assignability on every check.
3. **Minimal port (doctrine A2 / AP-3):** `docs/architecture/doctrine/05-folder-structure.md:18`
   specifies small, single-verb ports. The in-process link invokes only `fetch(request)` and never
   calls `ServiceApp.request(input, init?, env?)`, so omitting `request` avoids forcing test doubles
   or Web-standard `{ fetch }` adapters to implement an unused method. (Whether to retain the
   1-method port or mirror `ServiceApp`'s 2-method shape is listed in [Unresolved questions](#unresolved-questions).)
4. **Single canonical RPC path authority preserved:** `@netscript/sdk` continues to import
   `buildServiceRpcPath` from the pure leaf `@netscript/service/rpc-path`.

### Public API and type surface

All new public types and functions are JSR-compliant (explicit return types, zero `any`, zero
upstream `@orpc/*` or `hono` types, zero `Deno.*` globals, full JSDoc with `@param`/`@returns`/
`@example`). To minimize barrel growth against doctrine F-5
(`docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md:234-244`), transport arms
and `register` options are inlined directly into `ServiceClientTransport` and
`InProcessServiceRegistry` rather than exporting redundant single-use wrapper aliases.

#### Transport and port types (`@netscript/sdk/ports`, re-exported from `./client`, `./presets`, `.`)

```ts
/** Minimal mountable service app accepted by the SDK in-process transport. */
export interface InProcessServiceApp {
  /** Handle a Web Platform request without opening a network listener. */
  fetch(request: Request): Response | Promise<Response>;
}

/** Isolated lookup table mapping logical service names to mounted in-process apps. */
export interface InProcessServiceRegistry {
  /**
   * Register a mounted service app under `serviceName`.
   * Rejects duplicate registrations unless `options.replace === true`.
   */
  register(
    serviceName: string,
    app: InProcessServiceApp,
    options?: { readonly replace?: boolean },
  ): void;
  /** Remove one registered service app; returns `true` if an entry existed. */
  unregister(serviceName: string): boolean;
  /** Resolve a registered service app, throwing `InProcessServiceError` if absent. */
  resolve(serviceName: string): InProcessServiceApp;
  /** Report whether `serviceName` is currently registered. */
  has(serviceName: string): boolean;
  /** Remove all registered service apps from this registry. */
  clear(): void;
}

/** Transport discriminated union accepted by `createServiceClient()` and `defineServices()`. */
export type ServiceClientTransport =
  | {
    /** Dispatch RPC requests over HTTP(S) using service discovery or `resolveServiceUrl`. */
    readonly kind: 'http';
  }
  | {
    /** Dispatch RPC requests directly to a mounted `InProcessServiceApp`. */
    readonly kind: 'in-process';
    /** Directly bound service app instance. */
    readonly app: InProcessServiceApp;
    /** Mutually exclusive with `app`. */
    readonly registry?: never;
  }
  | {
    /** Dispatch RPC requests to a service app resolved lazily by `serviceName`. */
    readonly kind: 'in-process';
    /** Mutually exclusive with `registry`. */
    readonly app?: never;
    /** Optional isolated registry; when omitted, resolves from the SDK default registry. */
    readonly registry?: InProcessServiceRegistry;
  };
```

#### Registry and error API (`@netscript/sdk/in-process`)

```ts
/** Stable error codes emitted by the in-process service transport and registry. */
export type InProcessServiceErrorCode =
  | 'IN_PROCESS_SERVICE_INVALID'
  | 'IN_PROCESS_SERVICE_DUPLICATE'
  | 'IN_PROCESS_SERVICE_NOT_FOUND'
  | 'IN_PROCESS_REDIRECT_UNSUPPORTED'
  | 'IN_PROCESS_BODY_UNUSABLE';

/** Package-owned error for invalid, duplicate, missing, redirected, or unusable-body in-process calls. */
export class InProcessServiceError extends Error {
  readonly code: InProcessServiceErrorCode;
  readonly serviceName?: string;
}

/** Create an isolated in-process service registry with no global shared state. */
export function createInProcessServiceRegistry(): InProcessServiceRegistry;

/** Register a mounted service app in the default process-scoped registry. */
export function registerInProcessService(
  serviceName: string,
  app: InProcessServiceApp,
  options?: { readonly replace?: boolean },
): void;

/** Unregister one service app from the default process-scoped registry. */
export function unregisterInProcessService(serviceName: string): boolean;

/** Resolve a service app from the default process-scoped registry, or throw if absent. */
export function resolveInProcessService(serviceName: string): InProcessServiceApp;

/** Clear all registrations in the default process-scoped registry for registry lookup isolation. */
export function clearInProcessServices(): void;
```

Registry invariants:

- **Zero import-time side effects:** The default registry is an empty in-memory `Map` lazily
  populated only when `registerInProcessService()` is called.
- **Name validation:** `serviceName` must be a non-empty string with no leading/trailing whitespace;
  invalid names throw `InProcessServiceError` (`IN_PROCESS_SERVICE_INVALID`).
- **App validation:** `app` must be a non-null object with `typeof app.fetch === 'function'`; invalid
  values throw `InProcessServiceError` (`IN_PROCESS_SERVICE_INVALID`).
- **Duplicate guard:** Re-registering an existing `serviceName` without `{ replace: true }` throws
  `InProcessServiceError` (`IN_PROCESS_SERVICE_DUPLICATE`) naming `serviceName` (doctrine
  `05-folder-structure.md:25`, `07-composition-and-extension.md:140-141`).
- **Missing service lookup:** `resolve(serviceName)` throws `InProcessServiceError`
  (`IN_PROCESS_SERVICE_NOT_FOUND`) with a clear message naming `serviceName` and how to bind or
  register it. Lookup NEVER silently falls back to HTTP discovery.
- **Zero response/request caching:** The registry holds only `serviceName → InProcessServiceApp`
  references. It never stores requests, responses, caller contexts, or promises.
- **Lookup isolation vs cache lifetime:** Scoped registries (`createInProcessServiceRegistry()`)
  and `clearInProcessServices()` provide **registry lookup isolation** only. Server caches
  (`CacheQuery` / `setCacheProvider`) and TanStack `QueryClient` instances key cached entries by
  `(resource, action, input, $netscript.sdk-context partition)` — NOT by mounted
  `InProcessServiceApp` identity or registry instance. Replacing a binding (`{ replace: true }`) or
  switching registries does **not** automatically invalidate or partition cached responses from an
  earlier mount; callers and tests sharing a cache store across mounts MUST invalidate the affected
  resource prefix or supply a fresh `CacheQuery` / `QueryClient`.

#### Client and preset options (`@netscript/sdk/ports`, `./client`, `./presets`, `.`)

`CreateServiceClientOptions` (`packages/sdk/src/ports/service-client.ts:337-382`) and
`DefineServiceConfig` (`packages/sdk/src/presets/define-services.ts:29-69`) each gain one optional
field:

```ts
/**
 * Client transport mode. Defaults to `{ kind: 'http' }`.
 */
readonly transport?: ServiceClientTransport;
```

Convenience factory on `@netscript/sdk/in-process` (intentionally NOT re-exported from `./client` or `.`):

```ts
export type CreateInProcessServiceClientOptions<
  TContract extends ContractLike,
  TContributions extends readonly object[] = readonly [],
> =
  & Omit<
    CreateServiceClientOptions<TContract, TContributions>,
    'transport' | 'resolveServiceUrl' | 'protocol'
  >
  & (
    | { readonly app: InProcessServiceApp; readonly registry?: never }
    | { readonly app?: never; readonly registry?: InProcessServiceRegistry }
  );

export function createInProcessServiceClient<
  TContract extends ContractLike,
  const TContributions extends readonly object[] = readonly [],
>(
  options: CreateInProcessServiceClientOptions<TContract, TContributions>,
): ServiceClient<
  TContract,
  ServiceClientContext & SdkClientContributionContext<TContributions>
>;
```

`createInProcessServiceClient(options)` MUST delegate directly to `createServiceClient({ ...rest, transport })`
so that `resolveTransportPolicy`, `validateSdkClientContributions`, `buildServiceRpcPath`, and
`contributionRuntimeByClient` (`WeakMap`) execute through one single path.

#### Construction-time validation

| Invalid configuration (including JS / `unknown` input)                  | Required behavior                                                              |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `transport` is not `undefined` and not a plain object with valid `kind` | Throw `TypeError` naming the supported transport kinds (`http`, `in-process`). |
| `transport.kind === 'in-process'` with both `app` and `registry` set    | Throw `TypeError` (mutually exclusive binding modes).                          |
| `transport.kind === 'in-process'` with invalid `app` (missing `fetch`)  | Throw `InProcessServiceError` (`IN_PROCESS_SERVICE_INVALID`).                  |
| `transport.kind === 'in-process'` with invalid `registry`               | Throw `TypeError` (must expose `resolve`).                                     |
| `transport.kind === 'in-process'` combined with `resolveServiceUrl`     | Throw `TypeError` (`resolveServiceUrl` applies only to HTTP transport).        |
| `transport.kind === 'http'` with unexpected `app` or `registry` fields  | Throw `TypeError` (avoid silently ignoring in-process bindings).               |

#### Public export delta and bounded F-5 subpath budget

Doctrine F-5 (`docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md:234-243`) caps
exported symbols at **`<= 20` per `mod.ts`** (or split into focused subpaths). On current `main`
(`87965d80`), `@netscript/sdk`'s four existing barrels (`./ports`, `./presets`, `./client`, `.`)
already exceed 20 symbols, while `./desktop` and `./auto-update` already establish the package's
focused-subpath precedent (`packages/sdk/deno.json:8-9`, `packages/sdk/mod.ts:43-50`).

This design places **all 9 runtime, error, registry, and convenience-factory exports** on one new
focused subpath **`@netscript/sdk/in-process`** (`packages/sdk/src/in-process/mod.ts` — **12 total
symbols, strictly within F-5's `<= 20` cap**), and adds ONLY the **3-type minimal JSR type closure**
(`InProcessServiceApp`, `InProcessServiceRegistry`, `ServiceClientTransport`) required by
`CreateServiceClientOptions.transport` and `DefineServiceConfig.transport` on the four pre-existing
over-cap barrels (**`+0` runtime exports** on `.`, `./client`, `./presets`, and `./ports`):

| Entrypoint (`packages/sdk`)               | Measured baseline | Proposed delta | Net total | F-5 disposition                                                                                                                | Added symbols                                                                                                                                                                                    |
| ----------------------------------------- | ----------------: | -------------: | --------: | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `./in-process` (`src/in-process/mod.ts`)  | `0` (new)         | `+12`          | `12`      | **Compliant (`12 <= 20`, zero F-5 debt)**                                                                                      | `InProcessServiceApp`, `InProcessServiceRegistry`, `ServiceClientTransport`, `InProcessServiceError`, `InProcessServiceErrorCode`, `CreateInProcessServiceClientOptions`, `createInProcessServiceClient`, `createInProcessServiceRegistry`, `registerInProcessService`, `unregisterInProcessService`, `resolveInProcessService`, `clearInProcessServices` |
| `./ports` (`src/ports/mod.ts`)            | `96`              | `+3` (types)   | `99`      | **Pre-existing over-cap barrel; bounded `+3` type-closure debt disposition required in the architecture-debt ledger**     | `InProcessServiceApp`, `InProcessServiceRegistry`, `ServiceClientTransport`                                                                                                                      |
| `./presets` (`src/presets/mod.ts`)        | `94`              | `+3` (types)   | `97`      | **Pre-existing over-cap barrel; bounded `+3` type-closure debt disposition required in the architecture-debt ledger**     | `InProcessServiceApp`, `InProcessServiceRegistry`, `ServiceClientTransport` (JSR type closure for `DefineServiceConfig.transport`)                                                               |
| `./client` (`src/client/mod.ts`)          | `54`              | `+3` (types)   | `57`      | **Pre-existing over-cap barrel; bounded `+3` type-closure debt disposition required in the architecture-debt ledger; `+0` runtime symbols** | `InProcessServiceApp`, `InProcessServiceRegistry`, `ServiceClientTransport` (JSR type closure for `CreateServiceClientOptions.transport`)                                                        |
| `.` (`mod.ts`)                            | `159`             | `+3` (types)   | `162`     | **Pre-existing over-cap barrel; bounded `+3` type-closure debt disposition required in the architecture-debt ledger; `+0` runtime symbols** | Inherited via `export * from './src/client/mod.ts'` (`packages/sdk/mod.ts:55`); zero runtime helpers re-exported from `./in-process`                                                             |

Every entrypoint total above is enforced as a hard upper bound by an automated `deno doc --frozen --json`
export-count gate in [Acceptance Gate #4](#4-type-jsr-browser-safety-and-doctrine-gates). Whether to
retain this bounded `./in-process` subpath plan (recommended) or additionally re-export the 9
runtime/error symbols from `./client` and `.` (growing them to `66` and `171` under a wider F-5 debt
grant) is recorded in [Unresolved questions](#unresolved-questions) item 4.

### Link mechanism and shared transport pipeline

#### Single shared RPC link builder (no bespoke codec)

Today `packages/sdk/src/client/http-client-link.ts:110-233` builds oRPC's `RPCLink` and wraps it in
`createStableV1ClientLink()`. Implementation MUST factor that common machinery into one
package-private module `packages/sdk/src/internal/fetch-rpc-link.ts` (`createFetchRpcClientLink`)
used by BOTH `createHttpClientLink()` and `createInProcessClientLink()`:

```text
createServiceClient(options)
  ├─ resolveTransportPolicy(contract, { transportPolicy })
  ├─ validateSdkClientContributions(contributions ?? [])
  ├─ rpcPath = buildServiceRpcPath({ routerName: routerName ?? serviceName, apiPath, apiVersion })
  ├─ transport.kind === 'http' (default)
  │    └─ createHttpClientLink(...)
  │         └─ createStableV1ClientLink({
  │              resolveTransport: () => resolveHttpTransport(...),
  │              link: createFetchRpcClientLink({ fetch: globalThis.fetch, ...shared }),
  │              ...shared
  │            })
  └─ transport.kind === 'in-process'
       └─ createInProcessClientLink(...)
            └─ createStableV1ClientLink({
                 resolveEpoch: () => {
                   const app = boundApp ?? activeRegistry.resolve(serviceName);
                   return {
                     transport: resolveInProcessTransport(rpcPath),
                     link: getOrCreateFetchRpcLinkForApp(app),
                   };
                 },
                 ...shared
               })
```

Everything inside `createFetchRpcClientLink` is 100% shared between HTTP and in-process:

1. **Effective RPC pathname:** `buildServiceRpcPath({ routerName: routerName ?? serviceName, apiPath, apiVersion })`
   (`packages/service/src/primitives/rpc-path.ts:24-32`) combined with
   `new URL(prepared.call.transport.rpcPath, prepared.call.transport.origin)`
   (`packages/sdk/src/client/http-client-link.ts:130-133`). Both transports therefore send the exact
   same `url.pathname` (for example `/api/rpc/v1/orders/get`) to the mounted service.
2. **Method, overflow fallback, and URL length:** Identical `ResolvedTransportPolicy`
   (`fallbackMethod: 'POST'`, `maxUrlLength: 2083`, `method`, `dedupePredicate`, `cacheGroups`;
   `packages/sdk/src/internal/transport-policy.ts:193-200`).
3. **Wire codec and error decoding:** Identical `@orpc/client/fetch` `RPCLink` JSON/binary/SSE
   serialization and `ORPCError` reconstruction. No bespoke in-process codec is permitted.
4. **Retry and dedup plugins:** Identical `ClientRetryPlugin` (`default.retry = 0`) and
   `DedupeRequestsPlugin` (`packages/sdk/src/client/http-client-link.ts:162-178`).
5. **Logical call epoch wrapper:** Identical `createStableV1ClientLink()`
   (`packages/sdk/src/internal/client-contributions/stable-v1-adapter.ts:213-285`).

#### Canonical synthetic origin

`RPCLink` and Web Platform `Request` require an absolute HTTP(S) URL. For in-process calls,
`resolveTransport()` MUST return a fresh frozen descriptor per logical epoch:

```ts
Object.freeze({
  kind: 'in-process' as const, // see SdkClientTransportDescriptor compatibility section
  origin: new URL('https://in-process.localhost'),
  rpcPath,
  secure: true,
})
```

Why `https://in-process.localhost` is normative:

- **RFC 6761 §6.3 `.localhost` reservation:** `.localhost` is reserved for local loopback/non-network
  use and never resolves against external DNS.
- **Safe for arbitrary `serviceName` values:** Embedding `serviceName` in the hostname would fail or
  normalize unexpectedly for names containing underscores or non-LDH characters. Keeping the origin
  constant (`https://in-process.localhost`) and carrying `serviceName` in `rpcPath` and span
  attribute `rpc.service` avoids URL construction failures.
- **Confidentiality consistency:** `origin.protocol === 'https:'` agrees with `secure: true`,
  reflecting that the in-process hop does not traverse a cleartext network.

#### Credential trust, epoch-pinned binding, replacement semantics, and redirect refusal

Because `resolveTransport()` reports `secure: true` with `https://in-process.localhost`, shipped
credential contributions (`createBearerSdkClientContribution` and
`createInternalCredentialSdkClientContribution`) permit attaching credentials without requiring
`allowInsecureTransport`. That makes the trust model explicit and normative:

1. **Mounting or replacing is an explicit trust decision:** Unlike HTTPS, the structural
   `InProcessServiceApp` port and `InProcessServiceRegistry` carry no TLS certificate, hostname, or
   network origin verification. Passing `transport: { kind: 'in-process', app }`, binding a scoped
   registry, or calling `register(serviceName, app, { replace: true })` for a credentialed client is
   an explicit host/composition-root trust decision designating `app` as the trusted recipient of
   credentials prepared for `serviceName`. Replacing a registry entry via `{ replace: true }`
   explicitly transfers credential trust for subsequent logical epochs to the replacement app.
2. **Epoch-pinned binding via SDK-private `resolveEpoch()` (immune to retained descriptors, mid-epoch replacement, and `GET` dedup):**
   - For direct binding (`transport: { kind: 'in-process', app }`), a single `createFetchRpcClientLink`
     is closed directly over `app` for the lifetime of the client.
   - For registry binding (`transport: { kind: 'in-process', registry? }`), package-private
     `StableV1ClientLinkOptions` (`packages/sdk/src/internal/client-contributions/stable-v1-adapter.ts:227-250`)
     accepts an optional package-private `resolveEpoch()` callback invoked **once** at the start of
     each `startEpoch()` call, **before** `options.preparation.prepare(logicalCall)` — mirroring
     HTTP's missing-discovery-URL failure order
     (`stable-v1-adapter.ts:239-243`; `packages/sdk/tests/integration/service-url-resolver_test.ts:151-166`).
   - `resolveEpoch()` resolves `const app = activeRegistry.resolve(serviceName)`, obtains the
     per-app `ClientLinkPort` from a per-client `WeakMap<InProcessServiceApp, ClientLinkPort>` whose
     `createFetchRpcClientLink` is closed directly over `createInProcessFetch(app)`, and returns
     `{ transport: resolveInProcessTransport(rpcPath), link }`.
   - **Never key any `WeakMap` or `Map` by the public `SdkClientTransportDescriptor`:** Because
     `logicalCall.transport` is delivered directly to user contribution `prepare(snapshot)`
     (`packages/sdk/src/internal/client-contributions/prepared-call.ts:462-471`), a contribution can
     retain `snapshot.transport` strongly past call completion; keying a `WeakMap` by `transport`
     would keep a replaced `app1` and its cached `RPCLink` reachable indefinitely. Holding `epoch.link`
     strictly as an SDK-private local binding inside `startEpoch()` (or, in adapters outside
     `stable-v1-adapter.ts`, an SDK-private `Map<symbol, InProcessServiceApp>` whose entry is
     explicitly deleted in `finally` on every exit including preparation failure and abort)
     guarantees:
     - **Zero retention via retained public descriptors:** `snapshot.transport` is a plain frozen
       `{ kind, origin, rpcPath, secure }` object with zero attached symbols and zero map/WeakMap
       references to `app` or `epoch.link`. Once `startEpoch()` exits (on normal completion,
       preparation failure, abort, or iterator close), `epoch.link` becomes immediately unreachable.
     - **Zero mid-epoch credential cross-delivery (including unary retries and deduped `GET`):**
       Measured on `main` (`87965d80`), `DedupeRequestsPlugin` replaces `options.context` before
       invoking `fetch` on deduped `GET` requests, stripping `context[stableV1PreparedCall]`.
       Because `createTransportPolicy(epoch.link, ...).dispatch(prepared)` passes `epoch.link`
       directly into its unary retry loop (`stable-v1-adapter.ts:196-207`) and each `epoch.link` is
       closed directly over `app1`, calling `register(serviceName, app2, { replace: true })` during
       async `prepare()` OR between unary retry attempts keeps epoch 1 strictly pinned to `app1`
       (`app2` never receives epoch 1's credentials and epoch 1 never coalesces in `app2`'s
       `DedupeRequestsPlugin`).
     - **Clean post-replacement epochs and iterator reconnect:** New logical calls and
       iterator-phase stream reconnect epochs (`startEpoch(lastEventId)` at
       `stable-v1-adapter.ts:271`) invoke `resolveEpoch()` anew, resolving `app2` from the registry
       and re-preparing contribution headers specifically for `app2`.
     - **Prompt GC of replaced apps:** Because `linksByApp` is a `WeakMap<InProcessServiceApp, ClientLinkPort>`
       and no public descriptor holds a map edge to `app1`, a replaced `app1` and its cached
       `RPCLink` become garbage-collectible as soon as `app1`'s in-flight epochs finish.
3. **Strict locality — redirect refusal and zero network fallback:**
   - `createInProcessFetch()` NEVER calls `globalThis.fetch` and NEVER falls back to HTTP discovery.
   - Measured on `main` (`87965d80`, locked `@orpc/client@1.15.5`): `StandardRPCLinkCodec.decode()`
     only treats `response.status >= 400` as an error, so returning a raw `302 Found` empty-body
     response directly to `RPCLink` silently succeeds with `{ isSuccess: true, data: null }`.
   - Therefore, `createInProcessFetch()` MUST intercept WHATWG redirect statuses
     (`301`, `302`, `303`, `307`, `308`), cancel any unlocked `response.body` once inside
     `ROOT_CONTEXT` (suppressing cancellation rejections), and reject with `InProcessServiceError`
     (`code: 'IN_PROCESS_REDIRECT_UNSUPPORTED'`, omitting `Location` query parameters/credentials
     from the error message). Synthetic-origin credentials are never followed onto external URLs
     and redirects never silently decode as `null`.
   - Hosts mounting custom forwarding proxies as an `InProcessServiceApp` remain responsible for not
     forwarding synthetic-origin credentials onto cleartext remote network hops.

### Reconciliation with RFC 0001 (client contributions and cache partitions)

[RFC 0001](0001-sdk-client-contributions.md) governs typed SDK client contributions and explicitly
defines the contract for [#451](https://github.com/rickylabs/netscript/issues/451)
(`rfcs/0001-sdk-client-contributions.md:970-973`). This design satisfies every RFC 0001 invariant:

1. **Header capability declared and supported:** Unlike `@netscript/sdk/desktop` (MessagePort, no HTTP
   headers, which rejects `contributions` with `SDK_CONTRIBUTION_TRANSPORT_UNSUPPORTED`;
   `packages/sdk/src/desktop/application/desktop-rpc-client.ts:35-47`), the in-process transport speaks
   Web Fetch `Request`/`Headers` end-to-end. Every RFC 0001 contribution (auth bearer, internal
   credential, locale, custom application header contributions) runs through the identical
   `PreparedOutboundHeadersPort` (`packages/sdk/src/internal/client-contributions/prepared-call.ts:438-499`).
2. **Once-per-epoch preparation and redaction:** Contributions prepare once per logical call epoch,
   replay byte-equivalently across unary retries, start a fresh epoch on iterator-phase stream
   reconnect, respect all reserved headers (`content-type`, `traceparent`, `tracestate`, Fetch
   forbidden headers, `proxy-*`, `sec-*`, `set-cookie`), and emit identical redacted
   `SdkClientContributionError` failures with zero dispatch on error.
3. **`SdkClientTransportDescriptor` reconciliation (shipped vs proposed):**
   On current `main`, `packages/sdk/src/ports/sdk-client-contribution.ts:30-39` ships:
   ```ts
   // Shipped declaration on main (packages/sdk/src/ports/sdk-client-contribution.ts:30-39):
   export interface SdkClientTransportDescriptor {
     readonly kind: 'http';
     readonly origin: URL;
     readonly rpcPath: string;
     readonly secure: boolean;
   }
   ```
   **Proposed widening:**
   ```ts
   // Proposed widened declaration (potentially breaking TypeScript change — see below):
   export interface SdkClientTransportDescriptor {
     readonly kind: 'http' | 'in-process';
     readonly origin: URL;
     readonly rpcPath: string;
     readonly secure: boolean;
   }
   ```
   - **Shipped first-party contributions:** Both `createBearerSdkClientContribution`
     (`packages/plugin-auth-core/src/sdk/bearer-contribution.ts:87-95`) and
     `createInternalCredentialSdkClientContribution`
     (`packages/sdk/src/client/internal-credential-contribution.ts:118-129`) inspect
     `transport.secure` and `transport.origin` without constraining `transport.kind` to `'http'`;
     measured in frozen probes, both succeed against `secure: true` + `https://in-process.localhost`
     and continue to refuse non-loopback cleartext `http://` origins before dispatch.
   - **Breaking-change impact on external contributions:** Widening `readonly kind: 'http'` to
     `readonly kind: 'http' | 'in-process'` is a **potentially breaking TypeScript type change** for
     any external RFC 0001 contribution that assigns `options.transport.kind` to literal `'http'` or
     switches exhaustively on `options.transport.kind`, **even if its caller never uses the
     in-process transport**. See [Breaking changes and migration](#breaking-changes-and-migration) and
     [Unresolved questions](#unresolved-questions) item 1 for the non-breaking alternative (keeping
     `kind: 'http'` with an optional additive flag).
4. **Identical cache partitioning and `direct-only` enforcement:**
   Because `createServiceClient()` populates `contributionRuntimeByClient` (`WeakMap`) identically
   regardless of `transport.kind` (`packages/sdk/src/client/service-client.ts:128-145`):
   - `createQueryFactory()` (`packages/sdk/src/query/query-factory.ts:86,105-109,121-132`) computes
     the exact same `['$netscript.sdk-context', JSON.stringify(sortedPairs)]` server-cache suffix on
     HTTP and in-process.
   - `createServiceQueryUtils()` (`packages/sdk/src/query-client/create-service-query-utils.ts:137-144`)
     appends the exact same `['$netscript.sdk-context', ...sortedPairs]` suffix on full read keys
     (`queryKey`, `queryOptions`, `infiniteKey`, `infiniteOptions`, `experimental_streamed*`,
     `experimental_live*`) while keeping invalidation prefixes and mutation keys unsuffixed.
   - `defineServices()` (`packages/sdk/src/presets/define-services.ts:204-209`) omits `direct-only`
     services from `queries` and `queryUtils` identically on both transports.
5. **No raw oRPC types or private ports leaked:** Zero `@orpc/*` or `ClientLinkPort` symbols appear
   in any new public export (`client-contribution-private-surface_test.ts` stays green).

### Trace propagation and telemetry isolation

#### Transport-owned CLIENT span and W3C header injection

Consistent with RFC 0001 (`rfcs/0001-sdk-client-contributions.md:975-981`), trace propagation
remains strictly transport-owned. Both HTTP and in-process execute the identical `withSpan` wrapper
inside `createFetchRpcClientLink`:

- Tracer: `getTracer('@netscript/sdk')`
- Span name: `SpanNames.RPC_CLIENT` (`'rpc.client'`)
- Span kind: `SpanKind.CLIENT`
- Attributes:
  - `'rpc.system': 'orpc'`
  - `'rpc.service': serviceName`
  - `'netscript.rpc.transport': 'orpc'` (kept equal to HTTP and `TracingPlugin` in
    `packages/telemetry/src/orpc/tracing-plugin.ts:211` for attribute compatibility; adding an
    optional `'netscript.rpc.transport.mode': 'http' | 'in-process'` attribute is recorded under
    [Unresolved questions](#unresolved-questions))
  - `'server.address': new URL(requestUrl).hostname` (`'in-process.localhost'` in-process)
- Header injection when `propagateTraceContext: true`:
  1. `RPCLink`'s `headers` callback preserves `context.traceHeaders` (if explicitly passed) or
     `getTraceHeaders()` (`packages/sdk/src/client/http-client-link.ts:148-158`).
  2. Inside `withSpan`, `injectContext({}, contextWithSpan(span))` injects the newly created
     `rpc.client` CLIENT span's `traceparent` (and active `tracestate`) onto the final `Headers`
     container (`packages/sdk/src/client/http-client-link.ts:186-191`), overwriting any stale
     `traceparent` so the mounted service sees the CLIENT span as its parent.
- When `propagateTraceContext: false`: neither `traceparent` nor `tracestate` is attached to the
  request headers.

#### Mandatory OpenTelemetry context detachment across the full request and body lifecycle (`ROOT_CONTEXT` boundary)

Empirical measurement on `main` (`87965d80`, Deno 2.9.7, `@hono/otel`, `@opentelemetry/context-async-hooks`)
uncovered two in-process-only telemetry parity traps:

- **Trap 1 — Direct `app.fetch(request)` ALS leakage (measured failure):** Because `app.fetch(request)`
  runs inside the same process and inside `withSpan(SpanNames.RPC_CLIENT)`'s `AsyncLocalStorage`
  scope, when `propagateTraceContext: false` omits `traceparent`, Hono's `createHonoTracingMiddleware`
  (`packages/telemetry/src/hono/otel-middleware.ts:50-80` → `@hono/otel`) falls back to
  `context.active()` and **accidentally parents the mounted app's SERVER span to the caller's CLIENT
  span** (same `traceId`, non-null `parentSpanId`), diverging from HTTP where the network boundary
  breaks `AsyncLocalStorage` and yields a fresh root SERVER trace.
- **Trap 2 — Post-headers body and late-cleanup ALS leakage (measured failure):** Detaching only
  `app.fetch(request)` is insufficient. When the caller later consumes or aborts a streaming
  `Response.body`, or when a `dispatch.then(...)` late-cleanup callback was registered inside the
  caller's active span, `AsyncLocalStorage` restores the **caller's** OTel context during deferred
  source `pull()`, post-headers `abort` cancellation, consumer `cancel()`, and late-body `cancel()`
  after caller rejection — leaking caller telemetry into server stream callbacks AND retaining the
  caller's OTel context inside the settlement hook.
- **Full-lifecycle detachment (measured parity):** Capture `const serviceCtx = extractContext({})`
  (`ROOT_CONTEXT`, via existing `@netscript/telemetry/context` exports `extractContext` and
  `withContext` at `packages/telemetry/src/context/w3c.ts:201-202` and
  `packages/telemetry/src/context/helpers.ts:37-39` — zero direct `@opentelemetry/api` imports in
  `@netscript/sdk` and zero changes to `@netscript/telemetry`) and run **all** of the following
  inside `withContext(serviceCtx, ...)`:
  1. invoking `app.fetch(request)`;
  2. registering the single `dispatch.then(...)` settlement callback (so late cleanup never captures
     or retains the caller's OTel context and runs `cancelLateBodyOnce` strictly under `ROOT_CONTEXT`);
  3. cancelling redirect bodies in `rejectIfRedirect`; and
  4. wrapping every non-null `Response.body` (on **both** signalled and unsignalled calls) so
     `reader.read()`, `reader.cancel(reason)`, and `'abort'` listener registration execute inside
     `withContext(serviceCtx, ...)`.
  Measured results with full-lifecycle detachment:
  - When `propagateTraceContext: true`: `@hono/otel` extracts the parent exclusively from the
    injected W3C `traceparent` / `tracestate` HTTP headers. The mounted service handler receives
    identical `context.traceHeaders.traceparent` and `context.traceHeaders.tracestate`
    (`packages/service/src/builder/service-builder-impl.ts:323-333`), the exported SERVER span
    shares the caller's `traceId` with `parentSpanId === rpcClientSpan.spanId`, and deferred source
    `pull()` / post-headers `cancel()` / late-body `cancel()` NEVER inherit the caller's active
    `caller.op` or `rpc.client` span.
  - When `propagateTraceContext: false`: `@hono/otel` sees neither W3C headers nor an active caller
    span, starting a fresh root SERVER span (`parentSpanId: null`, distinct `traceId`), and deferred
    source `pull()` / post-headers `cancel()` / late-body `cancel()` all observe `ROOT_CONTEXT`
    (`trace.getSpan(context.active()) === undefined`) — exact parity with HTTP.

### Denial, error, and middleware parity

Because the in-process link builds a real Web Platform `Request` and invokes `app.fetch(request)`,
every request traverses the full mounted `ServiceApp` stack constructed by `ServiceBuilderImpl.build()`
(`packages/service/src/builder/service-builder-impl.ts:515-524`):

1. `createHonoTracingMiddleware` (`service-builder-impl.ts:118`)
2. `withCors`, `withLogger`, caller `use()` middleware, `withRateLimit`
3. `createAuthnMiddleware` (`packages/service/src/auth/auth-middleware.ts:48-90`) → JSON `401 UNAUTHORIZED` or `503 SERVICE_UNAVAILABLE`
4. `createAuthzMiddleware` (`packages/service/src/auth/auth-middleware.ts:103-166`) → JSON `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 NOT_FOUND`, or `410 GONE`
5. `withBodyLimit` (`packages/service/src/primitives/body-limit.ts`) → JSON `413 PAYLOAD_TOO_LARGE`
6. `wireRpc` → `RPCHandler.handle(c.req.raw, { prefix, context })` (`packages/service/src/builder/service-rpc.ts:110-122`)
7. `createNotFoundHandler` / `createErrorHandler`

Measured parity on `main` (`87965d80`, locked `@orpc/client@1.15.5`, `@orpc/server@1.15.5`, `jsr:@hono/hono@4.13.13`):

- Unauthenticated call (invalid bearer token): both HTTP and in-process return `safe()` failure
  `{ isSuccess: false, isDefined: false, code: 'UNAUTHORIZED', status: 401 }`.
- Unauthorized call (valid token missing required scope): both HTTP and in-process return `safe()`
  failure `{ isSuccess: false, isDefined: false, code: 'FORBIDDEN', status: 403 }`.
- Contract-defined errors (`ORPCError` with `defined: true`): measured on a single mounted service
  throwing `errors.VAULT_LOCKED({ message: 'Vault is sealed', data: { vaultId: 'locked', reason: 'maintenance' } })` —
  both HTTP and in-process decode identically to `safe()` failure
  `{ isSuccess: false, isDefined: true, code: 'VAULT_LOCKED', status: 409, data: { vaultId: 'locked', reason: 'maintenance' } }`
  and satisfy `isDefinedError(error) === true`.
- Synchronous exceptions thrown by a faulty `app.fetch(request)` implementation MUST be captured
  into a rejected Promise inside the `async` dispatch wrapper so they flow through `withSpan` error
  recording and retry policy identically to a rejected `globalThis.fetch` call.

### Transport-changed inputs and explicit parity boundaries

Two observable request inputs differ mechanically between socket-backed HTTP and socketless
in-process dispatch. This RFC defines explicit parity boundaries for both rather than leaving them
implicit:

#### 1. Full-URL length `GET` → `POST` overflow fallback (`maxUrlLength = 2083`)

- **Measured behavior (`main` `87965d80`):** oRPC's `StandardRPCLinkCodec` enforces
  `transportPolicy.maxUrlLength` (`2083`; `packages/sdk/src/internal/transport-policy.ts:197`)
  against the **full serialized absolute URL** (`origin + rpcPath + encoded query`). Because
  `https://in-process.localhost` (28 chars) and a typical loopback HTTP origin such as
  `http://localhost:<port>` (22 chars) have different lengths, an identical `GET` procedure input
  falling inside that origin-length window (measured: 1989-char payload → 2082-char HTTP URL vs
  2088-char in-process URL) dispatches as `GET` over HTTP and falls back to `POST` in-process.
- **Parity contract:**
  - **In scope (method-insensitive policies):** Identical effective RPC pathname (`url.pathname`),
    byte-identical decoded output and error semantics, identical cache keys, and identical
    authn/authz decisions for **method-insensitive policies** (policies that authorize an oRPC
    procedure identically across its declared `GET` method and its oRPC `POST` overflow fallback,
    such as contract-path/scope rules).
  - **Out of scope (verb choice & method-sensitive policies within the overflow window):** Identical
    HTTP method (`GET` vs `POST` overflow fallback) — and therefore authorization or middleware
    decisions that inspect `req.method` (note: shipped `createAuthzMiddleware` passes `c.req.method`
    to `authorizer.authorize(...)` at `packages/service/src/auth/auth-middleware.ts:127-147`) — are
    **outside** the parity guarantee for inputs falling inside the origin-length delta around
    `2083` characters. Measured on a single mounted service with a `GET`-only authorizer at the
    boundary: HTTP (`GET`, 2082 chars) returned `200`, while in-process (`POST`, 2088 chars)
    returned `403 FORBIDDEN`. This is the exact same origin-length variation that already exists
    between any two HTTP origins of different lengths (for example `http://localhost:3000` versus
    `https://api.example.com`). Callers requiring strict verb and method-sensitive authorization
    parity across that window MUST hold the verb constant via `transportPolicy: { method: () => 'POST' }`
    (measured: restores identical `403` / output parity on both transports) or declare `POST` on
    the contract procedure.

#### 2. Socket peer metadata (`ServiceEnvironment.remoteAddr`) and peer-dependent middleware

- **Source-inspected & measured behavior (`main` `87965d80`):** Over HTTP, `Deno.serve` calls
  `app.fetch(request, { remoteAddr: info.remoteAddr })`
  (`packages/service/src/builder/service-listener.ts:113-114`). Over the in-process link,
  `InProcessServiceApp.fetch(request)` deliberately takes one argument and omits
  `ServiceEnvironment.remoteAddr` (`Deno.Addr`) so `@netscript/sdk` remains runtime-neutral and
  never fabricates socket peer addresses. Consequently, middleware keyed on socket IP — notably
  default `withRateLimit()` (`packages/service/src/rate-limit/middleware/rate-limit-middleware.ts:61-91`,
  `packages/service/src/rate-limit/middleware/client-address.ts:27-48`,
  `packages/service/src/rate-limit/middleware/options.ts:29`) — buckets HTTP callers by socket peer
  IP while bucketing in-process callers into the shared `'unknown'` bucket (logging a one-time
  warning).
- **Parity contract:**
  - **Out of scope by design:** Socket-layer peer address (`ServiceEnvironment.remoteAddr`) and
    middleware policies keyed implicitly on socket IP are outside the in-process transport parity
    guarantee. Synthesizing a fake loopback IP would misrepresent trust boundaries for `trustProxy`
    and IP allowlists and would leak runtime-specific `Deno.Addr` shapes into universal SDK ports.
  - **In scope with logical key:** Services mounted in-process with `withRateLimit()` MUST supply an
    explicit logical `key` function (for example authenticated `principal.subject` or a declared
    header). Measured against a single mounted `ServiceApp` with a logical `key`, HTTP and
    in-process share the exact same quota bucket and produce identical `429` + `Retry-After`
    enforcement.

### Abort, cancellation propagation, and bounded retention

#### Measured failure mode of naive `app.fetch(new Request(req, init))`

Passing `fetch: (req, init) => app.fetch(new Request(req, init))` directly to `RPCLink` fails abort
parity on `main` (`87965d80`, measured under Deno 2.9.7, `jsr:@hono/hono@4.13.13`):

- `new Request(req, init)` **does** link `request.signal` to `init.signal` across all `cache` modes
  (`undefined`, `'default'`, `'no-store'`, `'force-cache'`), and when the caller calls
  `controller.abort(reason)`, the mounted oRPC handler observes `signal.aborted === true` and its
  `'abort'` event fires.
- **However**, unlike WHATWG `globalThis.fetch`, Hono's `app.fetch(request)` does **not** reject
  when `request.signal` aborts; it resolves whenever the handler returns a `Response`. Measured:
  - Over HTTP: both cooperative and non-cooperative handlers caused the caller promise to reject
    immediately with `Error('user-aborted')`.
  - Over naive `app.fetch`: the cooperative handler observed `signal.aborted === true` and returned,
    causing the caller promise to **resolve** with `{ done: true }` instead of rejecting; the
    non-cooperative handler kept the caller waiting until completion and likewise resolved
    `{ done: true }`.
- Additionally, if `signal.aborted === true` before dispatch, `new Request(req, init)` does not
  throw, so naive `app.fetch` still invokes middleware and the handler; and once headers settle,
  an unproxied non-cooperative `Response.body` `ReadableStream` ignores subsequent caller aborts.

#### Normative in-process fetch adapter contract

The package-private `createInProcessFetch(app)` adapter in
`packages/sdk/src/in-process/client-link.ts` MUST enforce WHATWG Fetch abort semantics, body-ownership
integrity, unconditional reader unlock, redirect refusal, and full-body-lifecycle `ROOT_CONTEXT`
detachment across pre-dispatch, synchronous setup, pending dispatch, and unfinished response-body
consumption with a single cleanup path:

```ts
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

function abortReason(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException('The operation was aborted', 'AbortError');
}

function releaseReaderSafely(reader: ReadableStreamDefaultReader<Uint8Array>): void {
  try {
    reader.releaseLock();
  } catch {
    // Already unlocked.
  }
}

function cancelUnownedBodyInContext(
  body: ReadableStream<Uint8Array> | null,
  reason: unknown,
  serviceCtx: Context,
): void {
  if (body === null || body.locked) return;
  withContext(serviceCtx, () => {
    try {
      void body.cancel(reason).catch(() => {});
    } catch {
      // Ignore synchronous cancel failures from foreign streams.
    }
  });
}

function rejectIfRedirect(
  response: Response,
  serviceName: string,
  serviceCtx: Context,
): Response {
  if (REDIRECT_STATUSES.has(response.status)) {
    cancelUnownedBodyInContext(response.body, undefined, serviceCtx);
    throw new InProcessServiceError(
      'IN_PROCESS_REDIRECT_UNSUPPORTED',
      `In-process service "${serviceName}" returned HTTP ${response.status} redirect; redirects are not followed in-process.`,
      serviceName,
    );
  }
  return response;
}

function wrapInProcessResponse(
  response: Response,
  serviceName: string,
  serviceCtx: Context,
  signal?: AbortSignal,
): Response {
  const rawBody = response.body;
  if (rawBody === null) {
    return response;
  }
  // Fail closed if app.fetch() violated response-body ownership (already locked or disturbed).
  if (response.bodyUsed || rawBody.locked) {
    throw new InProcessServiceError(
      'IN_PROCESS_BODY_UNUSABLE',
      `In-process service "${serviceName}" returned a Response whose body was already locked or disturbed.`,
      serviceName,
    );
  }

  const reader = rawBody.getReader();
  let terminal = false;
  let cancelSent = false;
  let streamController: ReadableStreamDefaultController<Uint8Array> | undefined;

  const cancelSourceOnce = (reason: unknown): Promise<void> => {
    if (cancelSent) {
      releaseReaderSafely(reader);
      return Promise.resolve();
    }
    cancelSent = true;
    return withContext(serviceCtx, () => {
      try {
        return reader.cancel(reason).catch(() => {});
      } finally {
        // Unlocks rawBody synchronously even when source cancel() stalls or rejects.
        releaseReaderSafely(reader);
      }
    });
  };

  const finish = (): void => {
    if (terminal) return;
    terminal = true;
    signal?.removeEventListener('abort', onBodyAbort);
  };

  const onBodyAbort = (): void => {
    if (terminal) return;
    const reason = abortReason(signal!);
    finish();
    streamController?.error(reason);
    void cancelSourceOnce(reason);
  };

  const wrappedBody = new ReadableStream<Uint8Array>({
    start(controller) {
      streamController = controller;
      if (signal) {
        withContext(serviceCtx, () => {
          signal.addEventListener('abort', onBodyAbort, { once: true });
        });
        if (signal.aborted) {
          onBodyAbort();
        }
      }
    },
    async pull(controller) {
      if (terminal) {
        releaseReaderSafely(reader);
        return;
      }
      try {
        const { done, value } = await withContext(serviceCtx, () => reader.read());
        if (terminal) {
          releaseReaderSafely(reader);
          return;
        }
        if (done) {
          finish();
          releaseReaderSafely(reader);
          controller.close();
          return;
        }
        controller.enqueue(value);
      } catch (error) {
        if (terminal) {
          releaseReaderSafely(reader);
          return;
        }
        finish();
        releaseReaderSafely(reader);
        controller.error(error);
      }
    },
    cancel(reason) {
      finish();
      return cancelSourceOnce(reason);
    },
  });

  return new Response(wrappedBody, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

function createInProcessFetch(
  app: InProcessServiceApp,
  serviceName: string,
): typeof globalThis.fetch {
  return (input, init) => {
    const signal = init && 'signal' in init
      ? (init.signal ?? undefined)
      : (input instanceof Request ? input.signal : undefined);

    if (signal?.aborted) {
      return Promise.reject(abortReason(signal));
    }

    const serviceCtx = extractContext({});

    if (signal === undefined) {
      try {
        const request = new Request(input, init);
        return withContext(serviceCtx, () =>
          Promise.resolve(app.fetch(request)).then((response) =>
            wrapInProcessResponse(
              rejectIfRedirect(response, serviceName, serviceCtx),
              serviceName,
              serviceCtx,
            )
          ));
      } catch (error) {
        return Promise.reject(error);
      }
    }

    return new Promise<Response>((resolve, reject) => {
      let settled = false;
      let lateBodyCancelled = false;

      const cancelLateBodyOnce = (response: Response, reason: unknown): void => {
        if (lateBodyCancelled) return;
        lateBodyCancelled = true;
        cancelUnownedBodyInContext(response.body, reason, serviceCtx);
      };

      const onAbort = (): void => {
        if (settled) return;
        settled = true;
        reject(abortReason(signal));
      };

      // Subscribe BEFORE constructing Request or invoking app.fetch so a
      // synchronous abort triggered during setup is never missed.
      withContext(serviceCtx, () => {
        signal.addEventListener('abort', onAbort, { once: true });
      });

      let dispatch: Promise<Response>;
      try {
        const request = new Request(input, init);
        dispatch = withContext(serviceCtx, () => Promise.resolve(app.fetch(request)));
      } catch (error) {
        if (!settled) {
          settled = true;
          signal.removeEventListener('abort', onAbort);
          reject(error);
        }
        return;
      }

      // Register the single settlement path INSIDE ROOT_CONTEXT so late cleanup
      // never captures or executes under the caller's OpenTelemetry context.
      withContext(serviceCtx, () => {
        dispatch.then(
          (response) => {
            if (settled || signal.aborted) {
              const reason = abortReason(signal);
              if (!settled) {
                settled = true;
                signal.removeEventListener('abort', onAbort);
                reject(reason);
              }
              cancelLateBodyOnce(response, reason);
              return;
            }
            settled = true;
            signal.removeEventListener('abort', onAbort);
            try {
              resolve(
                wrapInProcessResponse(
                  rejectIfRedirect(response, serviceName, serviceCtx),
                  serviceName,
                  serviceCtx,
                  signal,
                ),
              );
            } catch (error) {
              reject(error);
            }
          },
          (error) => {
            if (settled) return;
            settled = true;
            signal.removeEventListener('abort', onAbort);
            reject(error);
          },
        );
      });
    });
  };
}
```

Normative lifecycle guarantees (all empirically verified by frozen probes and sanitizer-enabled tests
on `main` `87965d80`):

1. **Pre-aborted signal:** Rejects immediately with `abortReason(signal)` before constructing
   `Request` or calling `app.fetch(request)` (`handlerEntered === false`).
2. **Synchronous abort during setup:** Because `signal.addEventListener('abort', onAbort, { once: true })`
   executes **before** `new Request(input, init)` and `app.fetch(request)`, a synchronous
   `controller.abort(reason)` triggered inside `app.fetch` setup rejects the caller immediately with
   `reason` and cancels any returned unlocked `Response.body` exactly once in `ROOT_CONTEXT`.
3. **In-flight handler observation and prompt caller rejection:** `new Request(input, init)` links
   `request.signal` into Hono (`c.req.raw`) and oRPC `RPCHandler`'s `{ signal }`. Aborting the
   caller's `AbortController` delivers `signal.aborted === true` to the handler and rejects the
   caller immediately with `abortReason(signal)` — even while a non-cooperative handler remains
   blocked.
4. **Single cleanup path (at most one `body.cancel()`):** `onAbort` does not attach a second
   `dispatch.then(...)` chain. Only the single `dispatch.then(...)` handler (registered inside
   `withContext(serviceCtx, ...)`) drains late responses through `cancelLateBodyOnce()`,
   guaranteeing an unlocked late `response.body.cancel()` runs **at most once** under `ROOT_CONTEXT`,
   ignoring foreign-locked late bodies without throwing, and suppressing unhandled rejections from
   late handler failures.
5. **Body ownership & unconditional terminal unlock (all paths, signalled and unsignalled):**
   - A compliant `InProcessServiceApp.fetch()` transfers an unlocked, undisturbed `Response.body`
     to the adapter. If `response.body !== null && (response.bodyUsed || response.body.locked)`,
     `wrapInProcessResponse` MUST fail closed with `InProcessServiceError('IN_PROCESS_BODY_UNUSABLE')`
     (never silently passing an already-locked body through without abort protection, and never
     calling `cancel()` on a foreign-locked stream).
   - Every non-null owned `Response.body` is wrapped on **both** signalled and unsignalled calls so
     every `reader.read()` and `reader.cancel(reason)` runs inside `withContext(serviceCtx, ...)`
     (never inheriting caller OTel context).
   - On **every** terminal path — **EOF**, **signal abort**, **consumer `cancel()`**, and **source
     error** — the adapter detaches `signal.removeEventListener('abort', onBodyAbort)` and executes
     `reader.releaseLock()` synchronously, **even when `reader.cancel(reason)` stalls indefinitely
     or rejects** (verified under Deno resource & ops sanitizers: `rawBody.locked === false`
     immediately with zero unhandled rejections). Null-body responses attach no body listener.
   - `createStableV1ClientLink()` additionally prevents iterator-phase reconnect epochs after abort
     (`packages/sdk/tests/integration/client-contribution-adapter_test.ts:329-367`).
6. **Bounded SDK retention while an abandoned handler is pending:** JavaScript cannot preempt an
   already-running handler that ignores `request.signal`. While a non-cooperative handler has not
   yet settled its `app.fetch(request)` promise, the SDK retains **only** the single lightweight
   `dispatch.then` settlement callback registered under `ROOT_CONTEXT` — holding zero references to
   caller context, caller OpenTelemetry `AsyncLocalStorage` context, contribution projections,
   procedure input, cache entries, or any adapter/registry map entry. The moment the abandoned
   `app.fetch` promise settles, that single callback cancels any late body once under `ROOT_CONTEXT`
   and drops all remaining references.

#### Relationship to `#2611` (`#2610`) — GET transport and deduplication boundary

On current `main`, `packages/sdk/src/client/http-client-link.ts:168-177` installs
`DedupeRequestsPlugin` with a catch-all `defaultCacheGroup` whose group context is `{}`
(`packages/sdk/src/internal/transport-policy.ts:183-187`). As tracked in
[#2610](https://github.com/rickylabs/netscript/issues/2610) and planned in
[#2611](https://github.com/rickylabs/netscript/pull/2611), that plugin replaces `context` on `GET`
requests before `fetch`, causing `init.cache` and `init.signal` to arrive as `undefined` (measured
on `main`: `currentMainGetDedupInit: { hasSignal: false }`).

This RFC **explicitly does not redesign GET transport or `DedupeRequestsPlugin`**. Because HTTP and
in-process share the exact same `createFetchRpcClientLink` and `DedupeRequestsPlugin` configuration:

- any `POST` (or non-deduped) procedure already forwards `context.signal` to `fetch` on current
  `main` for both HTTP and in-process;
- `GET` cancellation and `cache: 'no-store'` forwarding parity on **both** HTTP and in-process is
  owned by `#2611` and applies automatically to the in-process transport as soon as `#2611` lands,
  with zero in-process-specific workaround or divergence.

### Context isolation, layer ownership, and shared-SDK prerequisites

Isolation between caller contexts/partitions is enforced at specific layers with distinct
boundaries. Implementation and tests MUST treat each layer's guarantee accurately:

| Layer                                               | What this layer owns and guarantees                                                                                                                                                                            | Boundary / prerequisite                                                                                                                                                                |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Server cache (`createQueryFactory` / `CacheQuery`)  | Full key appends `['$netscript.sdk-context', JSON.stringify(sortedPairs)]` (`packages/sdk/src/internal/client-contributions/prepared-call.ts:418-421`). Distinct valid partitions NEVER share cache entries even when prepared headers are identical. Denied/aborted `queryFn` calls never populate cache entries. | Keyed by `(resource, action, input, partition)` — NOT by mounted app instance. Replacing a binding (`{ replace: true }`) does not auto-invalidate previously cached responses.         |
| TanStack Query (`createServiceQueryUtils`)          | Recursive proxy appends `['$netscript.sdk-context', ...sortedPairs]` to full read keys (`packages/sdk/src/query-client/create-service-query-utils.ts:49-92`). Identical across HTTP and in-process.          | Same cache-lifetime boundary: callers reusing one `QueryClient` across binding replacements must invalidate explicitly.                                                                |
| Transport in-flight dedup (`DedupeRequestsPlugin`)  | Shared across HTTP and in-process inside `createFetchRpcClientLink`. Prepared contribution headers are attached before dedup (`client-contribution-adapter_test.ts:454-499`), so calls with distinct `authorization` / `accept-language` headers do not coalesce. Non-deduped (`POST`) calls with identical prepared headers across distinct partitions execute independently (`handlerEntries === 2`, measured on both transports). Per-app `WeakMap<InProcessServiceApp, ClientLinkPort>` ensures replaced mounts never coalesce with prior mounts. | **Hard shared-SDK prerequisite for unsignalled `GET` parity (measured on `main` `87965d80`):** `DedupeRequestsPlugin` currently keys only on wire request `(method, URL, body, headers)` and **coalesces** concurrent unsignalled `GET` calls from two distinct valid RFC 0001 partitions when both emit identical prepared headers (`wireCallsObserved: 1`). `#2611` repairs signalled/`no-store` `GET` forwarding while intentionally retaining unsignalled `GET` coalescing; full `GET` cross-partition non-sharing therefore requires a shared-SDK `DedupeRequestsPlugin` partition-key prerequisite (outside `#451`) OR an explicit acceptance scope decision restricting v1 identical-header non-sharing parity to non-deduped (`POST`) / partition-distinguished calls. |
| In-process registry & fetch adapter                 | Registry stores only `serviceName → InProcessServiceApp`. SDK-private `resolveEpoch()` binds `epoch.link` locally without keying any map on public `SdkClientTransportDescriptor`. Fetch adapter removes `'abort'` listeners and unlocks `reader.releaseLock()` on every terminal path (even if `cancel()` stalls or rejects), fails closed on locked/disturbed bodies (`IN_PROCESS_BODY_UNUSABLE`), and runs all source/cleanup callbacks inside `ROOT_CONTEXT`. | Bounded retention (lightweight `ROOT_CONTEXT` settlement hook only) while an abandoned non-cooperative handler remains pending; zero cross-call state or caller OTel context retained once settled. |

### Acceptance tests and implementation gates

Implementation is not complete until every gate below passes.

#### 1. Transport parity acceptance suite (mandatory implementation gate)

Mount **one synthetic service** (`createService(router, { name }).withAuthn(...).withAuthz(...).withRPC({ rpcPath }).serve({ port: 0, hostname: 'localhost', handleSignals: false })`)
and attach **the exact same `running.app` `ServiceApp` instance** to the in-process transport while
pointing the HTTP transport at `running.addr`.

Using the same typed contract and an RFC 0001 partitioned auth contribution, execute the same typed
procedure through **both** HTTP and in-process clients with:

- **Caller context A:** authorized principal A (`partition: 'ctx-a'`).
- **Caller context B:** authorized principal B (`partition: 'ctx-b'`).
- **Denied caller C:** unauthenticated (`401`) and unauthorized (`403`) callers (`partition: 'ctx-denied'`).

Assert exact HTTP ↔ in-process parity across every case:

1. **Effective RPC path:** Both transports deliver the identical `url.pathname` derived from
   `buildServiceRpcPath()` (including custom `routerName`, `apiPath`, and `apiVersion` overrides).
2. **Response, denial, and defined-error parity:**
   - Context A and context B receive byte-identical decoded responses on HTTP and in-process, each
     reflecting only its own authenticated principal.
   - Denied caller C receives the identical `safe()` failure (`isSuccess: false`, `isDefined: false`,
     matching `code` and `status` for `401` and `403`) on HTTP and in-process.
   - Contract-defined errors (`ORPCError` with `defined: true`, typed `data`) narrow via
     `isDefinedError()` and match identically (`isDefined: true`, `code`, `status`, `data`) across
     HTTP and in-process.
3. **Trace propagation and full body-lifecycle isolation:**
   - With `propagateTraceContext: true` under an active parent span carrying W3C `tracestate`: both
     transports emit an `rpc.client` (`SpanKind.CLIENT`) span under the parent, deliver `traceparent`
     (containing the caller's `traceId` and the `rpc.client` `spanId`) plus `tracestate` to the
     mounted service handler, and parent the service's HTTP `SERVER` span to the `rpc.client` span.
   - With `propagateTraceContext: false`: neither transport attaches `traceparent`/`tracestate`, and
     on **both** transports the mounted service's `SERVER` span starts a fresh detached root trace
     (`parentSpanId === null`, `serverTraceId !== callerTraceId`).
   - **Full body-lifecycle telemetry boundary (both `propagateTraceContext: false` AND `true`):**
     Execute streaming reads (signalled and unsignalled), post-headers `controller.abort()`, consumer
     `reader.cancel()`, and late-body `cancel()` after caller rejection while inside an active caller
     OTel span; assert the caller's OTel span is **never** active inside deferred source `pull()`,
     post-headers abort `cancel()`, consumer `cancel()`, or late-body `cancel()`.
4. **Cache isolation and cross-partition non-sharing gate:**
   - Calling through `defineServices()` / `createQueryFactory()` backed by `CacheQuery(new MemoryCacheStore())`
     populates distinct `$netscript.sdk-context` keys for context A and context B; neither transport
     shares a cached result between the two contexts.
   - Denied caller C fails without reading A's or B's cached data and without writing any cache
     entry (`getCachedData` returns `null`).
   - `createServiceQueryUtils()` produces identical partitioned `queryKey` tuples across both
     transports, and `direct-only` contributions omit `queries` and `queryUtils` identically on both
     transports.
   - **Concurrent identical-wire two-partition non-sharing requirement:** Issue two concurrent calls
     from two distinct valid RFC 0001 partitions emitting identical prepared headers against a
     stateful/sequence-generating handler; assert **two independent handler entries
     (`handlerEntries === 2`) and independently generated results (`resA.sequence !== resB.sequence`)
     on BOTH HTTP and in-process transports** (equal coalescing is NOT an acceptable pass!).
     - For non-deduped (`POST`) procedures, this assertion passes immediately on both transports.
     - For unsignalled `GET` procedures with identical prepared headers across distinct partitions,
       landing the shared-SDK `DedupeRequestsPlugin` partition-key fix (alongside `#2611`) is a
       **hard implementation prerequisite** unless v1 acceptance is explicitly narrowed (see
       [Unresolved questions](#unresolved-questions) item 7).
5. **Observable abort-lifecycle barrier suite (both transports, all terminal paths, sanitizers ON):**
   - **Explicit entry / abort-observed / release barriers across BOTH HTTP and in-process** on a
     non-cooperative mounted handler:
     1. Await `entryBarrier` (confirming handler entry), then call `controller.abort(reason)`.
     2. Await `abortObservedBarrier` (confirming `request.signal.aborted === true` inside handler).
     3. Assert the caller promise rejects with `reason` **before** releasing `releaseBarrier`.
     4. Execute a **fresh same-key dispatch** and assert it succeeds **before** releasing
        `releaseBarrier`.
     5. Release `releaseBarrier` and assert: (a) **no cache write** from the abandoned call on both
        transports (fresh call's cached entry is preserved), and (b) on the in-process transport,
        **exactly one** late-body `cancel()` invocation (`lateBodyCancels === 1`).
   - **Synchronous abort during `app.fetch` setup:** Handler calls `controller.abort(reason)`
     synchronously before returning a `Response`; assert caller rejects with `reason` and
     `lateBodyCancels === 1`.
   - **Sanitizer-enabled terminal-path matrix (EOF, abort, consumer cancel, source error, unusable
     body, late rejection):** Verify under Deno's built-in resource and ops sanitizers (`sanitizeOps: true`,
     `sanitizeResources: true`):
     - Normal EOF unlocks source (`rawBody.locked === false`) and removes `'abort'` listener;
     - Post-headers `controller.abort(reason)` immediately rejects pending `read()` with `reason`,
       calls source `cancel()` once, and unlocks `rawBody.locked === false` **immediately even when
       source `cancel()` stalls indefinitely or rejects**;
     - Consumer `wrappedReader.cancel()` unlocks `rawBody.locked === false` immediately even when
       source `cancel()` stalls or rejects;
     - Source `pull()` error propagates to consumer and unlocks `rawBody.locked === false`;
     - Already-locked and already-disturbed (`bodyUsed === true`) `Response.body` streams fail
       closed with `InProcessServiceError('IN_PROCESS_BODY_UNUSABLE')` on both signalled and
       unsignalled calls without cancelling the foreign-locked stream;
     - Late `app.fetch` rejection after caller abort is absorbed cleanly with zero unhandled
       rejections.
   - **Pre-aborted negative control:** Aborted signal rejects immediately with `signal.reason` with
     `handlerEntered === false`.
   - *(Sequencing note)* For `GET` procedures, in-flight abort parity is explicitly gated on the
     actual landed `#2611` shared fix and its supported caller path (`cache: 'no-store'` / signalled
     `GET` once `#2611` merges; see [Unresolved questions](#unresolved-questions) item 7).

#### 2. Credential trust, epoch binding, replacement, redirect, and transport-boundary controls

- **Trusted in-process credential delivery:** Both `createBearerSdkClientContribution` and
  `createInternalCredentialSdkClientContribution` succeed on an explicitly trusted in-process mount
  without `allowInsecureTransport`.
- **Cleartext non-loopback HTTP refusal negative control:** Both contributions refuse
  `http://api.example.test` before dispatch (`dispatched === 0`, `SdkClientContributionError`) when
  `allowInsecureTransport` is omitted.
- **Mid-epoch replacement, retained-descriptor control, and real shared-link retry/reconnect:**
  - **Mid-epoch replacement race:** Start epoch 1 against `app1` with an async `prepare()` held on a
    barrier; call `registry.register(name, app2, { replace: true })`; release epoch 1 while
    concurrently starting epoch 2; assert epoch 1's prepared credentials reach **`app1` only** and
    epoch 2 reaches `app2` with epoch 2's credentials.
  - **Retained-descriptor control:** Contribution retains every `snapshot.transport` descriptor
    strongly across (a) successful completion, (b) throwing `prepare()`, and (c) aborted `prepare()`;
    assert zero hidden symbols on retained descriptors, zero active epoch bindings remaining after
    every exit, and no map keyed by `snapshot.transport` keeping a replaced `app1` reachable.
  - **Real shared-link unary retry (`retry: 1`) + async-iterator reconnect (`eventIterator`) across
    `{ replace: true }`:** Verify on the actual shared `createStableV1ClientLink` + `RPCLink` stack
    that: (a) a unary retry after mid-retry `{ replace: true }` stays pinned to `app1` (replaying
    epoch 1's headers; `app2` receives 0 calls from epoch 1); and (b) an async-iterator reconnect
    after stream drop + `{ replace: true }` starts a fresh epoch, re-resolves `app2`, re-runs
    `prepare()`, forwards `Last-Event-ID`, and yields subsequent events from `app2`.
- **Redirect refusal control:** Mounted app returns `302 Found` with an external `Location` header
  and a body whose `cancel()` rejects; assert the client rejects with `InProcessServiceError`
  (`IN_PROCESS_REDIRECT_UNSUPPORTED`), does not silently resolve `null`, invokes redirect body
  `cancel()` once (in `ROOT_CONTEXT`, zero unhandled rejection), and triggers zero
  `globalThis.fetch` calls.
- **Near-2083 URL-length boundary controls (method-insensitive AND method-sensitive authorizers):**
  - Choose an input payload whose serialized full URL stays `<= 2083` over the loopback HTTP origin
    (`GET`) and exceeds `2083` over `https://in-process.localhost` (`POST`):
    - Under a **method-insensitive** policy, assert decoded responses and cache keys remain
      byte-identical despite the overflow verb fallback.
    - Under a **method-sensitive** authorizer allowing `GET` only, assert HTTP (`GET`) returns `200`
      and in-process (`POST`) returns `403 FORBIDDEN` (documenting the explicit scope boundary), and
      assert that configuring `transportPolicy: { method: () => 'POST' }` restores exact parity
      across both transports.
- **Peer-metadata `withRateLimit()` boundary control:** Against a single mounted `ServiceApp`:
  - with default socket-keyed `withRateLimit()`, assert HTTP and in-process bucket separately
    (documenting the intentional `'unknown'` fallback boundary when `remoteAddr` is absent);
  - with a logical `key` function (e.g., authenticated principal / header), assert HTTP and
    in-process enforce the exact same shared quota (`429` + `Retry-After`) while distinct logical
    callers succeed.

#### 3. Registry, compatibility, and construction-validation tests

- Omitting `transport` defaults to HTTP; all existing `packages/sdk/tests/` suites stay green
  without modification.
- `registerInProcessService` / `resolveInProcessService` / `unregisterInProcessService` /
  `clearInProcessServices` and isolated `createInProcessServiceRegistry()` instances:
  - Unknown `serviceName` throws `InProcessServiceError` (`IN_PROCESS_SERVICE_NOT_FOUND`) naming
    `serviceName` before invoking contribution `prepare()`.
  - Duplicate `serviceName` throws `InProcessServiceError` (`IN_PROCESS_SERVICE_DUPLICATE`) unless
    `{ replace: true }` is passed.
  - `clearInProcessServices()` resets default-registry lookups cleanly; two scoped registries
    provide independent registry lookup isolation.
- Construction validation rejects malformed `transport`, `app` + `registry` together,
  `resolveServiceUrl` combined with `kind: 'in-process'`, and non-`fetch` app objects.

#### 4. Type, JSR, browser-safety, and doctrine gates

- Type fixture `packages/sdk/tests/type-fixtures/in-process-service-app_type.ts` proves:
  - `ServiceApp` from `@netscript/service` is assignable to `InProcessServiceApp` with zero casts;
  - `createInProcessServiceClient` and `createServiceClient({ ..., transport: { kind: 'in-process', ... } })`
    infer identical `ServiceClient<TContract, ServiceClientContext & SdkClientContributionContext<TContributions>>`
    types and preserve `defineServices()` `queries` / `queryUtils` / `direct-only` omission;
  - mutually exclusive `app` vs `registry` arms fail compilation via `@ts-expect-error`.
- `packages/sdk/tests/client-contribution-private-surface_test.ts` updated to include
  `createInProcessClientLink` and `createFetchRpcClientLink` in `PRIVATE_ADAPTER_NAMES` (and cover
  `./in-process`) and green.
- **Automated F-5 per-entrypoint export-count gate (`deno doc --frozen --json`):** Assert exported
  symbol counts satisfy `./in-process <= 20` (exact target `12`), `./ports <= 99`, `./presets <= 97`,
  `./client <= 57`, and `. <= 162`, with zero in-process runtime/error/registry helpers exported
  from `.` or `./client`, and with the bounded `+3` type-closure delta on the four pre-existing
  over-cap barrels recorded in the architecture-debt ledger.
- `packages/sdk/tests/query/define-services-browser-import_test.ts` remains green (0 logger/kv/`node:`
  edges on `mod.ts`, `src/presets/mod.ts`, and `src/in-process/mod.ts`).
- `packages/sdk/tests/integration/service-url-resolver_test.ts` (`no-deno-runtime-client.ts`)
  remains green (no `Deno.*` global access or types required on universal SDK entrypoints).
- Scoped `run-deno-check.ts`, `run-deno-test.ts`, `run-deno-lint.ts`, `run-deno-fmt.ts`,
  `deno task doc:lint --root packages/sdk --pretty`, `deno task quality:gate`, `deno task arch:check`,
  and `deno publish --dry-run --allow-dirty` in `packages/sdk` all pass with zero warnings/slow types.

## Drawbacks

- **Full Request/Response serialization overhead in-process:** Routing through `RPCLink` and
  `ServiceApp.fetch(new Request(req, init))` still serializes/deserializes payloads and builds Web
  Fetch objects in memory. That overhead is paid intentionally as the exact cost of preventing
  HTTP/in-process semantic divergence.
- **Process-scoped default registry risk:** Offering `registerInProcessService()` /
  `clearInProcessServices()` introduces opt-in module-level state that tests must clear if they use
  the default registry instead of `createInProcessServiceRegistry()` or direct `app` binding, and
  lookup isolation does not automatically flush shared query caches.
- **Potential breaking TypeScript widening if `SdkClientTransportDescriptor.kind` adds `'in-process'`:**
  Any external contribution assigning `options.transport.kind` to literal `'http'` or doing an
  exhaustive check on `kind` breaks at compile time even when its caller stays on HTTP (see
  [Breaking changes and migration](#breaking-changes-and-migration)).
- **Shared dependency on `#2611` and dedup-key behavior for `GET`:** Because this RFC deliberately
  shares `RPCLink` and `DedupeRequestsPlugin` with HTTP rather than forking a second transport,
  `GET` in-flight cancellation inherits `#2611`'s schedule, and transport-level non-coalescing for
  distinct partitions with identical prepared headers on unsignalled `GET` remains a shared-SDK
  prerequisite.

## Rationale and alternatives

### Why this design

Reusing `RPCLink`, `ResolvedTransportPolicy`, `PreparedOutboundHeadersPort`, `createStableV1ClientLink`,
and `ServiceApp.fetch()` guarantees structural anti-divergence: there is only one wire codec, one
RPC path builder, one contribution preparation pipeline, one cache-partition runtime, and one trace
injection site. Adding only the epoch-pinned per-app `WeakMap`, the abort-aware, redirect-refusing,
`ROOT_CONTEXT`-detached `createInProcessFetch` adapter, and the `InProcessServiceApp` structural
port closes every measured in-process parity trap (abort resolution mismatch, post-headers body
abort, redirect `null` decoding, mid-epoch replacement races, and ALS trace leakage) while keeping
`@netscript/sdk` browser-safe and upstream-type-free.

### Alternative 1: Direct handler invocation (bypassing HTTP, Hono, and wire codec)

Invoking oRPC router procedures directly via `@orpc/server`'s `call()` avoids `Request`/`Response`
construction, but sacrifices almost every parity guarantee:

- skips Hono middleware (`withCors`, `withLogger`, `withAuthn`, `withAuthz`, `withBodyLimit`,
  `withRateLimit`, `createHonoTracingMiddleware`);
- bypasses `buildServiceRpcPath()` routing and path-based contract authorization
  (`packages/service/src/auth/contract/contract-authorizer.ts`);
- bypasses wire JSON/date/binary serialization so shared object references mutate across caller and
  callee and serialization bugs escape tests;
- drops HTTP request headers, breaking RFC 0001 header contributions and W3C `traceparent`/`tracestate`
  propagation; and
- cannot target a built `ServiceApp` (requires raw router internals).

Rejected because it violates the core HTTP transport parity requirement.

### Alternative 2: HTTP over loopback (`http://localhost:<ephemeral-port>`)

Starting a real loopback `Deno.serve` listener per mounted service gives wire parity automatically,
but:

- requires `--allow-net`, ephemeral port allocation, OS socket descriptors, and explicit
  `RunningService.stop()` lifecycle coordination;
- fails in restricted/single-worker runtimes that cannot bind TCP listeners;
- incurs kernel loopback socket framing and Deno listener shutdown/drain overhead for every
  in-process hop; and
- requires mutating environment variables or custom `resolveServiceUrl` tables to route between
  ephemeral ports.

Rejected as the general single-process mechanism (though loopback HTTP remains the exact reference
oracle in the acceptance parity suite).

### Alternative 3: Separate in-process codec or bespoke `ClientLinkPort`

Writing a custom in-process `ClientLinkPort` with its own encoding, error wrapping, retry loop,
dedup table, or trace wrapper would duplicate `http-client-link.ts`, drift whenever RFC 0001
contributions or `#2611` transport fixes evolve, and risk leaking upstream/internal link semantics.

Rejected because zero codec duplication is the strongest anti-divergence guarantee.

### Alternative 4: Expose raw `fetch` or raw `ClientLinkPort` / oRPC `RPCLink` on `CreateServiceClientOptions`

Allowing callers to inject an arbitrary `fetch` callback or oRPC `RPCLink` directly onto
`CreateServiceClientOptions` would:

- break RFC 0001's rule that transport policy, `fetch`, and tracing remain SDK-owned
  (`rfcs/0001-sdk-client-contributions.md:955-973`) and violate `client-contribution-private-surface_test.ts`;
- force every caller mounting a `ServiceApp` to hand-roll the non-obvious abort race, post-headers
  `Response.body` abort proxy, redirect refusal, `ROOT_CONTEXT` telemetry detachment, epoch-pinned
  replacement handling, and synthetic `.localhost` origin — reintroducing the exact defects measured
  in baseline probes.

Rejected in favor of the closed, discriminated `ServiceClientTransport` union.

### Impact of not doing this

Single-process deployments and tests remain forced onto either loopback sockets (with port/net
overhead) or direct router calls (which silently diverge from production HTTP middleware, auth,
tracing, and serialization behavior).

## Breaking changes and migration

- **Existing client callers:** Strictly additive and non-breaking. `transport` is optional and
  defaults to `{ kind: 'http' }`; omitting it preserves identical runtime and compile-time behavior
  across `createServiceClient()`, `defineServices()`, `createQueryFactory()`, and
  `createServiceQueryUtils()`.
- **Contributions inspecting `SdkClientTransportDescriptor.kind` (potentially breaking TypeScript
  change if widened):**
  - On `main`, `SdkClientTransportDescriptor.kind` is literal `'http'`
    (`packages/sdk/src/ports/sdk-client-contribution.ts:32`).
  - **If widened to `'http' | 'in-process'` (Option A):** Any external contribution assigning
    `options.transport.kind` to a `'http'`-typed binding or switching exhaustively on `kind` fails
    TypeScript compilation even when its caller remains on HTTP. Shipped first-party contributions
    (`createBearerSdkClientContribution`, `createInternalCredentialSdkClientContribution`,
    `createLocaleSdkClientContribution`) do not narrow `transport.kind` to `'http'` and compile
    unchanged. Migration for affected external contributions: handle `'in-process'` (or check
    `options.transport.secure` / `origin` instead of assuming `kind === 'http'`).
  - **Non-breaking alternative (Option B):** Keep `readonly kind: 'http'` on v1
    `SdkClientTransportDescriptor` (since both transports speak Fetch HTTP `Request`/`Response`
    semantics) and optionally expose an additive `readonly inProcess?: boolean` field, yielding zero
    compile-time breakage for existing external contributions.
  - See [Unresolved questions](#unresolved-questions) item 1.
- **Migration for tests using loopback listeners purely for in-process RPC:** Tests may optionally
  switch from `serve({ port: 0 })` + `Deno.env.set(...)` to `build()` +
  `createInProcessServiceClient({ contract, serviceName, app })` (or a scoped registry) without
  changing contract, contribution, query, or assertion code — adding a logical `key` function if the
  service uses `withRateLimit()`.

## Prior art

- **`@netscript/service` `ServiceApp.fetch()`** (`packages/service/mod.ts:13-15`,
  `packages/service/src/types.ts:20-31`): already intentionally returns a non-listening Web Fetch
  `ServiceApp` for single-process host mounting.
- **RFC 0001 ([`0001-sdk-client-contributions.md`](0001-sdk-client-contributions.md))**: establishes
  transport-owned tracing, once-per-epoch preparation, `$netscript.sdk-context` cache partitioning,
  private internal adapter ports, and the rule that custom transports must not expose raw oRPC link
  types.
- **Hono `app.fetch` / `app.request`** and **oRPC `RPCLink` custom `fetch`**: standard Fetch-based
  in-memory dispatch seams that keep router/middleware parity while requiring caller-side abort
  racing, post-headers body abort proxying, redirect refusal, and OTel context detachment to match
  real network `fetch()`.
- **WHATWG Fetch Standard** (abort-before-fetch, in-flight abort rejection, body-read abort, and
  redirect status set `{ 301, 302, 303, 307, 308 }`) and **W3C Trace Context**
  (`traceparent`/`tracestate` propagation across trust/transport boundaries).
- **RFC 6761 §6.3**: reserves `.localhost` names for local-only use without external DNS resolution.

## Unresolved questions

The following technical design choices remain open before acceptance:

1. **`SdkClientTransportDescriptor.kind` widening (Option A) vs non-breaking v1 preservation
   (Option B):** Should `SdkClientTransportDescriptor.kind` widen from `'http'` to
   `'http' | 'in-process'` (making the transport kind explicit at the cost of a potentially breaking
   TypeScript change for external contributions that assume literal `'http'`), or retain
   `readonly kind: 'http'` with an additive optional `readonly inProcess?: boolean` flag for zero
   type-level breakage?
2. **`InProcessServiceApp` shape (1 method vs 2 methods):** Should `InProcessServiceApp` declare
   only `fetch(request: Request): Response | Promise<Response>` (recommended per doctrine minimal
   single-verb port rule, accepting `ServiceApp`, Hono apps, and minimal `{ fetch }` stubs), or
   mirror both `fetch` and `request` from `ServiceApp` (omitting `ServiceEnvironment` / `Deno.Addr`)?
3. **Package-private `createInProcessClientLink`:** Confirm keeping `createInProcessClientLink`
   package-private (parallel to `createHttpClientLink` and `client-contribution-private-surface_test.ts`)
   rather than promoting `ClientLinkPort` to a public export in this change.
4. **Bounded `@netscript/sdk/in-process` subpath vs `./client` / `.` re-exports (F-5 budget):**
   Confirm placing all 9 in-process runtime, error, registry, and convenience-factory exports
   exclusively on the new F-5-compliant subpath `@netscript/sdk/in-process` (`12 <= 20` symbols)
   while limiting the four pre-existing over-cap barrels (`./ports`, `./presets`, `./client`, `.`)
   to the `+3` minimal JSR type-closure (`99`, `97`, `57`, `162` with recorded arch-debt
   disposition), versus additionally re-exporting runtime/registry helpers from `./client` and `.`
   (`66` and `171` symbols, requiring broader F-5 debt approval), and confirm whether the default
   process-scoped helpers should ship alongside isolated `createInProcessServiceRegistry()`.
5. **Duplicate registration default:** Confirm rejecting duplicate `serviceName` registrations by
   default (`IN_PROCESS_SERVICE_DUPLICATE`) with opt-in `{ replace: true }`, versus silent overwrite.
6. **Optional telemetry additions:**
   - Keep `'netscript.rpc.transport': 'orpc'` and optionally add
     `'netscript.rpc.transport.mode': 'http' | 'in-process'` on the `rpc.client` span?
   - Reuse existing `withContext(extractContext({}), ...)` from `@netscript/telemetry/context`
     (zero changes to `@netscript/telemetry`), or also add a dedicated `withRootContext()` helper in
     `@netscript/telemetry/context`?
7. **Sequencing of `GET` abort-in-flight and identical-header cross-partition `GET` prerequisites:**
   - **Option A (full `GET` + `POST` parity gate):** Wait for both `#2611` (`GET` `no-store` /
     `signal` forwarding) and a shared-SDK `DedupeRequestsPlugin` partition-key fix to land so the
     implementation closes both `GET` abort-in-flight and concurrent identical-header two-partition
     `GET` non-sharing (`handlerEntries === 2`) in one pass.
   - **Option B (narrowed v1 `POST`-first acceptance):** Explicitly narrow v1 acceptance to `POST` /
     distinct-header parity (where `handlerEntries === 2` and both-transport abort barriers already
     pass on `main`), and gate `GET` abort-in-flight + identical-header `GET` non-sharing on the
     shared-SDK `#2611` + `DedupeRequestsPlugin` prerequisite landing.

## Future possibilities

- Single-process multi-service host composition and deployment adapters (orthogonal to this RFC;
  tracked under [#891](https://github.com/rickylabs/netscript/issues/891)).
- Explicit public custom-transport port (`ClientLinkPort` with capability negotiation) if a third
  non-Fetch, non-MessagePort transport emerges.
- Dedicated MessagePort contribution protocol for `@netscript/sdk/desktop` in a separate RFC.
- Zero-copy or binary stream optimizations for large in-process streaming responses, provided HTTP
  semantic parity and cancellation invariants remain preserved.
