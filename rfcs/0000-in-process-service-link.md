---
rfc: 0000
title: In-process service link with HTTP transport parity
status: Draft
authors: ['@rickylabs']
created: 2026-11-24
tracking-issue: https://github.com/rickylabs/netscript/issues/451
target-milestone: 0.0.10
---

# In-process service link with HTTP transport parity

## Summary

This RFC specifies an in-process transport mode for `@netscript/sdk` service clients that dispatches
typed oRPC calls directly to a mounted `ServiceApp` via Web Platform `Request` / `Response` without
opening a network socket, while maintaining exact behavioral parity with the existing HTTP link. The
in-process link reuses the SDK's single oRPC `RPCLink`, transport policy, RFC 0001 contribution
preparation pipeline, response-cache partitioning, and transport-owned W3C trace injection, varying
only destination resolution and an abort-aware, root-context-detached `app.fetch(request)` adapter.
The default transport remains `http` so every existing caller is unchanged, a package-owned
structural port avoids pulling server-only `@netscript/service` dependencies into browser-safe SDK
entrypoints, and an explicit HTTP-versus-in-process parity suite gates implementation.

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
| `SdkClientTransportDescriptor` currently declares `kind: 'http'`, `origin: URL`, `rpcPath: string`, `secure: boolean`; bearer and internal-credential contributions allow credentials when `transport.secure` or loopback origin holds.  | Source-inspected: `packages/sdk/src/ports/sdk-client-contribution.ts:30-39`; `packages/plugin-auth-core/src/sdk/bearer-contribution.ts:87-95`; `packages/sdk/src/client/internal-credential-contribution.ts:118-129` | In-process transport must report `secure: true` with a canonical RFC 6761 `.localhost` synthetic origin (`https://in-process.localhost`) so credentialed contributions work seamlessly. |
| Naive `app.fetch(new Request(req, init))` delivers `request.signal` abort to the mounted handler, **but does not reject the caller promise** (measured: caller resolved `{ done: true }` after abort on both cooperative and non-cooperative handlers). | Measured: `deno eval` parity probe against `main` `87965d80` (Deno 2.9.7, `@orpc/client@1.15.5`, `hono@4.13.5`)                                                                      | The in-process fetch adapter must explicitly race `app.fetch(request)` against `signal`, reject pre-aborted calls before dispatch, and cancel late `Response.body` streams.            |
| Calling `app.fetch(request)` directly inside `withSpan(SpanNames.RPC_CLIENT)` leaks the caller's active OpenTelemetry trace into the mounted app via same-process `AsyncLocalStorage` even when `propagateTraceContext: false`.          | Measured: `deno eval` trace-isolation probe against `main` `87965d80` (SERVER span inherited caller `traceId` without detachment; detached to fresh root trace with `ROOT_CONTEXT`)  | The in-process fetch adapter must invoke `app.fetch(request)` inside a detached root telemetry context (`withContextAsync(extractContext({}), ...)`).                                  |
| On current `main`, `DedupeRequestsPlugin` in `http-client-link.ts` drops `context.cache = 'no-store'` and `context.signal` on `GET` procedures (measured: `init.signal` absent at fetch). Issue [#2610](https://github.com/rickylabs/netscript/issues/2610) / PR [#2611](https://github.com/rickylabs/netscript/pull/2611) owns that repair. | Source-inspected: `packages/sdk/src/client/http-client-link.ts:168-177`, `packages/sdk/src/internal/transport-policy.ts:183-187`; measured: `deno eval` probe (`hasSignal: false`)    | This RFC does not redesign GET transport or deduplication. Reusing the single shared `RPCLink` ensures `#2611`'s fix automatically governs both HTTP and in-process GET calls.         |
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
surface without sockets while keeping HTTP parity as a mechanical invariant.

### Goals

This RFC MUST:

1. provide an in-process transport mode for `createServiceClient()` and `defineServices()` that
   reuses the SDK's single `RPCLink`, transport policy, and canonical `buildServiceRpcPath()`
   pathname without a bespoke RPC codec;
2. keep `transport` defaulting to `{ kind: 'http' }` so all existing callers remain source- and
   behavior-compatible;
3. preserve RFC 0001 contribution semantics identically across HTTP and in-process transports:
   once-per-epoch header preparation, reserved header enforcement, redacted errors, response-cache
   partitioning (`$netscript.sdk-context`), and `direct-only` omission;
4. preserve transport-owned W3C trace propagation (`traceparent` / `tracestate`) and `rpc.client`
   CLIENT spans when `propagateTraceContext: true`, and preserve trace isolation when
   `propagateTraceContext: false`;
5. preserve full mounted-app middleware, authn/authz denial, contract-defined error, and wire
   encoding/decoding parity with HTTP;
6. propagate caller `AbortSignal` cancellation into the mounted handler and reject the caller
   promptly on abort, without sharing results across caller contexts/partitions or retaining
   cancelled requests;
7. provide explicit direct binding (`app`), isolated scoped registries for parallel tests
   (`createInProcessServiceRegistry()`), and default process-scoped registry helpers with
   `clearInProcessServices()`; and
8. preserve `@netscript/sdk` browser safety, Deno-free universal ports, JSR publishability, and
   private-adapter hygiene (`client-contribution-private-surface_test.ts`).

### Non-goals

This RFC does not:

- redesign SDK `GET` transport, `DedupeRequestsPlugin`, or `no-store` / `signal` forwarding on the
  shared HTTP link (owned by [#2610](https://github.com/rickylabs/netscript/issues/2610) /
  [#2611](https://github.com/rickylabs/netscript/pull/2611));
- define a single-process application host, unified-runtime CLI, or deployment target
  ([#891](https://github.com/rickylabs/netscript/issues/891) keeps deployment orthogonal; `#822` is
  closed unmerged and `#824`/`#850` are superseded and not built upon);
- expose arbitrary user-supplied `ClientLinkPort`, raw `fetch`, or raw oRPC `RPCLink` instances on
  `CreateServiceClientOptions`;
- add HTTP header contributions to `@netscript/sdk/desktop` MessagePort clients (which continue to
  reject `contributions` with `SDK_CONTRIBUTION_TRANSPORT_UNSUPPORTED`); or
- migrate `@netscript/sdk` from stable oRPC v1 to oRPC v2.

## Guide-level explanation

> **Draft note:** Code snippets in this section illustrate the proposed API as if shipped; none of
> the proposed symbols exist on `main` yet.

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
import { createInProcessServiceClient, createServiceClient } from '@netscript/sdk/client';
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

// Option 2: convenience wrapper (identical behavior and contribution inference)
const ordersDirect = createInProcessServiceClient({
  contract: ordersContract,
  serviceName: 'orders',
  app: ordersApp,
});

const order = await orders.get({ id: 'ord_123' });
```

### Scoped registry for parallel tests and explicit composition

Use `createInProcessServiceRegistry()` to wire multiple mounted services with explicit lifetime and
complete test isolation across concurrent tests:

```ts
import {
  createInProcessServiceRegistry,
  defineServices,
} from '@netscript/sdk';

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
import {
  clearInProcessServices,
  createServiceClient,
  registerInProcessService,
} from '@netscript/sdk/client';

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

Per-call `AbortSignal` behaves identically to HTTP:

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

| File (proposed)                                       | Visibility      | Role                                                                                                                                   |
| ----------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/sdk/src/ports/service-client.ts`            | Public (`./ports`, `./client`, `./presets`, `.`) | Existing port file (382 LOC baseline): adds upstream-free `InProcessServiceApp`, `InProcessServiceRegistry`, and `ServiceClientTransport` arms while keeping `ports/` at 12 immediate children. |
| `packages/sdk/src/client/in-process-registry.ts`      | Public (`./client`, `.`) | `InProcessServiceError`, `createInProcessServiceRegistry()`, and default registry helpers (`register`/`unregister`/`resolve`/`clear`). |
| `packages/sdk/src/client/in-process-client-link.ts`   | Package-private | `createInProcessClientLink()` and abort-aware, `ROOT_CONTEXT`-isolated `createInProcessFetch()` adapter.                               |
| `packages/sdk/src/internal/fetch-rpc-link.ts`         | Package-private | Shared `RPCLink` + `ClientRetryPlugin` + `DedupeRequestsPlugin` + `withSpan(RPC_CLIENT)` + `createStableV1ClientLink` builder.         |
| `packages/sdk/src/client/http-client-link.ts`         | Package-private | Thin HTTP specialization delegating to `fetch-rpc-link.ts` with `resolveServiceUrl` and `globalThis.fetch`.                            |
| `packages/sdk/src/client/service-client.ts`           | Public (`./client`, `.`) | Branches on `transport.kind` (`'http'` default vs `'in-process'`); adds `createInProcessServiceClient()`.                              |
| `packages/sdk/src/presets/define-services.ts`         | Public (`./presets`, `.`) | Adds `transport?: ServiceClientTransport` to `DefineServiceConfig` and forwards it to `createServiceClient()`.                         |

Folder cardinality and file-size check against doctrine R-FOLD-CARD and F-1
(`docs/architecture/doctrine/05-folder-structure.md:167-185`, `09-anti-patterns-and-fitness-functions.md:201-205`):

- `packages/sdk/src/client/` currently has 10 immediate children (7 `.ts` files + 3 `stream-*`
  subdirectories; source-inspected); adding `in-process-registry.ts` and `in-process-client-link.ts`
  brings it to 12 immediate children (within the 12-child cap).
- `packages/sdk/src/ports/` currently has 12 immediate children (source-inspected). Adding a 13th
  file would exceed R-FOLD-CARD by 1; extending `packages/sdk/src/ports/service-client.ts` (382 LOC
  baseline, staying below the 500 LOC F-1 threshold) keeps `packages/sdk/src/ports/` at 12 immediate
  children with zero cardinality debt.
- `packages/sdk/src/internal/` currently has 2 immediate children (`client-contributions/` and
  `transport-policy.ts`; source-inspected); adding `fetch-rpc-link.ts` brings it to 3.

**Why `createInProcessClientLink` stays package-private:**
`packages/sdk/tests/client-contribution-private-surface_test.ts:4-19,90-109` enforces that
`createHttpClientLink`, `ClientLinkPort`, `ClientLinkCallOptions`, and `ResolvedTransportPolicy`
never appear in `deno doc --json` for `.`, `./client`, `./ports`, or `./desktop`. Exporting
`createInProcessClientLink` publicly would either expose `ClientLinkPort` / `ResolvedTransportPolicy`
or expose a raw oRPC `RPCLink`, violating both RFC 0001's zero-oRPC boundary and
`client-contribution-private-surface_test.ts`. Furthermore, bypassing `createServiceClient()` would
omit `contributionRuntimeByClient` (`WeakMap`) registration (`packages/sdk/src/client/service-client.ts:128-145`),
silently breaking `createQueryFactory()` and `createServiceQueryUtils()` cache partitioning.
`createInProcessClientLink` is therefore added to `PRIVATE_ADAPTER_NAMES` alongside
`createHttpClientLink`, while `createServiceClient({ ..., transport })` and
`createInProcessServiceClient(...)` provide the public entrypoints.

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
`@example`).

#### Transport and port types (`@netscript/sdk/ports`, re-exported from `./client`, `./presets`, `.`)

```ts
/** Minimal mountable service app accepted by the SDK in-process transport. */
export interface InProcessServiceApp {
  /** Handle a Web Platform request without opening a network listener. */
  fetch(request: Request): Response | Promise<Response>;
}

/** Options controlling registration in an {@link InProcessServiceRegistry}. */
export interface InProcessServiceRegisterOptions {
  /**
   * Explicitly replace an existing registration for the same `serviceName`.
   * Defaults to `false`, which rejects duplicate registrations.
   */
  readonly replace?: boolean;
}

/** Isolated lookup table mapping logical service names to mounted in-process apps. */
export interface InProcessServiceRegistry {
  /** Register a mounted service app under `serviceName`. */
  register(
    serviceName: string,
    app: InProcessServiceApp,
    options?: InProcessServiceRegisterOptions,
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

/** Explicit HTTP transport selection (the default when `transport` is omitted). */
export interface HttpServiceClientTransport {
  /** Dispatch RPC requests over HTTP(S) using service discovery or `resolveServiceUrl`. */
  readonly kind: 'http';
}

/** In-process transport bound directly to one mounted service app. */
export interface DirectInProcessServiceClientTransport {
  /** Dispatch RPC requests directly to a mounted `InProcessServiceApp`. */
  readonly kind: 'in-process';
  /** Directly bound service app instance. */
  readonly app: InProcessServiceApp;
  /** Mutually exclusive with `app`. */
  readonly registry?: never;
}

/** In-process transport resolved lazily from a scoped or default registry. */
export interface RegistryInProcessServiceClientTransport {
  /** Dispatch RPC requests to a service app resolved by `serviceName`. */
  readonly kind: 'in-process';
  /** Mutually exclusive with `registry`. */
  readonly app?: never;
  /**
   * Optional isolated registry; when omitted, resolves from the SDK's default
   * in-process registry.
   */
  readonly registry?: InProcessServiceRegistry;
}

/** In-process transport selection arms. */
export type InProcessServiceClientTransport =
  | DirectInProcessServiceClientTransport
  | RegistryInProcessServiceClientTransport;

/** Transport discriminated union accepted by `createServiceClient()` and `defineServices()`. */
export type ServiceClientTransport =
  | HttpServiceClientTransport
  | InProcessServiceClientTransport;
```

#### Registry and error API (`@netscript/sdk/client`, re-exported from `.`)

```ts
/** Stable error codes emitted by in-process service registration and lookup. */
export type InProcessServiceErrorCode =
  | 'IN_PROCESS_SERVICE_INVALID'
  | 'IN_PROCESS_SERVICE_DUPLICATE'
  | 'IN_PROCESS_SERVICE_NOT_FOUND';

/** Package-owned error for invalid, duplicate, or missing in-process service bindings. */
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
  options?: InProcessServiceRegisterOptions,
): void;

/** Unregister one service app from the default process-scoped registry. */
export function unregisterInProcessService(serviceName: string): boolean;

/** Resolve a service app from the default process-scoped registry, or throw if absent. */
export function resolveInProcessService(serviceName: string): InProcessServiceApp;

/** Clear all registrations in the default process-scoped registry for test isolation. */
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

Convenience factory on `@netscript/sdk/client` (re-exported from `.`):

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

| Invalid configuration (including JS / `unknown` input)                  | Required behavior                                                         |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `transport` is not `undefined` and not a plain object with valid `kind` | Throw `TypeError` naming the supported transport kinds (`http`, `in-process`). |
| `transport.kind === 'in-process'` with both `app` and `registry` set    | Throw `TypeError` (mutually exclusive binding modes).                     |
| `transport.kind === 'in-process'` with invalid `app` (missing `fetch`)  | Throw `InProcessServiceError` (`IN_PROCESS_SERVICE_INVALID`).             |
| `transport.kind === 'in-process'` with invalid `registry`               | Throw `TypeError` (must expose `resolve`).                                |
| `transport.kind === 'in-process'` combined with `resolveServiceUrl`     | Throw `TypeError` (`resolveServiceUrl` applies only to HTTP transport).   |
| `transport.kind === 'http'` with unexpected `app` or `registry` fields  | Throw `TypeError` (avoid silently ignoring in-process bindings).          |

#### Subpath export map impact

No new subpath entry in `packages/sdk/deno.json` is required. All new public types and functions
re-export through the existing `./ports`, `./client`, `./presets` (types only), and `.` entrypoints,
preserving existing JSR packaging and avoiding semver-breaking subpath churn
(`docs/architecture/doctrine/05-folder-structure.md:97-98`).

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
  │         └─ createFetchRpcClientLink({
  │              resolveTransport: () => resolveHttpTransport(resolveServiceUrl, serviceName, protocol, rpcPath),
  │              fetch: globalThis.fetch,
  │              ...shared
  │            })
  └─ transport.kind === 'in-process'
       └─ createInProcessClientLink(...)
            └─ createFetchRpcClientLink({
                 resolveTransport: () => resolveInProcessTransport(rpcPath),
                 fetch: createInProcessFetch(resolveApp),
                 ...shared
               })
```

Everything inside `createFetchRpcClientLink` is 100% shared between HTTP and in-process:

1. **Effective RPC pathname:** `buildServiceRpcPath({ routerName: routerName ?? serviceName, apiPath, apiVersion })`
   (`packages/service/src/primitives/rpc-path.ts:24-32`) combined with `new URL(prepared.call.transport.rpcPath, prepared.call.transport.origin)`
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
`resolveTransport()` MUST return:

```ts
Object.freeze({
  kind: 'in-process' as const,
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
  accurately reflecting that in-process calls never traverse a cleartext network.

#### Lazy app resolution

When configured via registry (`transport: { kind: 'in-process' }` or
`transport: { kind: 'in-process', registry }`), the in-process link resolves `serviceName` lazily at
call time — mirroring HTTP's lazy `resolveServiceUrl(serviceName, protocol)` per call
(`packages/sdk/src/client/http-client-link.ts:128-133,222-230`). This allows module-top-level
`defineServices()` definitions to be imported before a single-process composition root finishes
building and registering its `ServiceApp` instances.

Resolution order per logical call epoch:

1. Check pre-aborted caller `signal` (reject immediately with `abortReason(signal)` without
   resolving the app, invoking contribution preparation, or dispatching).
2. Resolve the target `InProcessServiceApp` (`boundApp ?? activeRegistry.resolve(serviceName)`)
   during logical-call transport resolution — **before** `options.preparation.prepare(logicalCall)`
   — mirroring HTTP, where `options.resolveTransport()` executes prior to contribution preparation
   (`packages/sdk/src/internal/client-contributions/stable-v1-adapter.ts:239-243`;
   `packages/sdk/tests/integration/service-url-resolver_test.ts:151-166`). The resolved app handle
   is attached only to package-private per-epoch dispatch state (never exposed on the public
   `SdkClientTransportDescriptor`) so that:
   - an unregistered `serviceName` rejects with `InProcessServiceError`
     (`IN_PROCESS_SERVICE_NOT_FOUND`) before invoking any credential resolver, matching HTTP's
     missing-discovery-URL failure order; and
   - every retry attempt within the same logical call epoch targets the resolved app instance, while
     an iterator-phase stream reconnect starts a fresh epoch and re-resolves from the registry.

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
3. **`SdkClientTransportDescriptor` reconciliation:**
   `packages/sdk/src/ports/sdk-client-contribution.ts:30-39` currently defines:
   ```ts
   export interface SdkClientTransportDescriptor {
     readonly kind: 'http' | 'in-process';
     readonly origin: URL;
     readonly rpcPath: string;
     readonly secure: boolean;
   }
   ```
   Widening `kind` from `'http'` to `'http' | 'in-process'` while setting `secure: true` and
   `origin: new URL('https://in-process.localhost')` preserves full compatibility with both shipped
   credential contributions without modifying them:
   - `createBearerSdkClientContribution` (`packages/plugin-auth-core/src/sdk/bearer-contribution.ts:87-95`)
     checks `transport.secure || isLocalDevelopmentOrigin(transport.origin) || allowInsecureTransport` —
     both `secure: true` and `.localhost` pass without `allowInsecureTransport`.
   - `createInternalCredentialSdkClientContribution`
     (`packages/sdk/src/client/internal-credential-contribution.ts:118-129`) performs the same check
     and likewise passes without `allowInsecureTransport`.
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

#### Mandatory OpenTelemetry context detachment (`ROOT_CONTEXT` boundary)

Empirical measurement on `main` (`87965d80`, Deno 2.9.7, `@hono/otel`, `@opentelemetry/context-async-hooks`)
uncovered an in-process-only telemetry parity trap:

- **Without detachment (measured failure):** Because `app.fetch(request)` runs inside the same
  process and inside `withSpan(SpanNames.RPC_CLIENT)`'s `AsyncLocalStorage` scope, when
  `propagateTraceContext: false` omits `traceparent`, Hono's `createHonoTracingMiddleware`
  (`packages/telemetry/src/hono/otel-middleware.ts:50-80` → `@hono/otel`) falls back to
  `context.active()` and **accidentally parents the mounted app's SERVER span to the caller's CLIENT
  span** (same `traceId`, non-null `parentSpanId`), diverging from HTTP where the network boundary
  breaks `AsyncLocalStorage` and yields a fresh root SERVER trace.
- **With detachment (measured parity):** Invoking `app.fetch(request)` inside a clean root
  OpenTelemetry context via existing `@netscript/telemetry/context` exports:
  ```ts
  withContextAsync(extractContext({}), async () => await app.fetch(request))
  ```
  (`packages/telemetry/src/context/w3c.ts:201-202` runs `propagation.extract(ROOT_CONTEXT, {}, ...)`
  which returns `ROOT_CONTEXT`, and `packages/telemetry/src/context/helpers.ts:44-46` executes
  within `context.with(ctx, fn)` — requiring zero direct `@opentelemetry/api` imports in
  `@netscript/sdk` and zero changes to `@netscript/telemetry`).
  Measured results with detachment:
  - When `propagateTraceContext: true`: `@hono/otel` extracts the parent exclusively from the
    injected W3C `traceparent` / `tracestate` HTTP headers. The mounted service handler receives
    identical `context.traceHeaders.traceparent` and `context.traceHeaders.tracestate`
    (`packages/service/src/builder/service-builder-impl.ts:323-333`), and the exported SERVER span
    shares the caller's `traceId` with `parentSpanId === rpcClientSpan.spanId` — exact parity with
    HTTP.
  - When `propagateTraceContext: false`: `@hono/otel` sees neither W3C headers nor an active caller
    span, starting a fresh root SERVER span (`parentSpanId: null`, distinct `traceId`) — exact
    parity with HTTP.

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

Measured parity on `main` (`87965d80`):

- Unauthenticated call (invalid bearer token): both HTTP and in-process return `safe()` failure
  `{ isSuccess: false, isDefined: false, name: 'Error', code: 'UNAUTHORIZED', status: 401, message: 'Unauthorized' }`.
- Unauthorized call (valid token missing required scope): both HTTP and in-process return `safe()`
  failure `{ isSuccess: false, isDefined: false, name: 'Error', code: 'FORBIDDEN', status: 403, message: 'Forbidden' }`.
- Contract-defined errors (`ORPCError` with `defined: true`): encoded by `RPCHandler` and decoded by
  `RPCLink` through the same wire format, so `safe()` and `isDefinedError()` narrow identically on
  both transports.
- Synchronous exceptions thrown by a faulty `app.fetch(request)` implementation MUST be captured
  into a rejected Promise inside the `async` dispatch wrapper so they flow through `withSpan` error
  recording and retry policy identically to a rejected `globalThis.fetch` call.

### Abort, cancellation propagation, and zero retention

#### Measured failure mode of naive `app.fetch(new Request(req, init))`

Passing `fetch: (req, init) => app.fetch(new Request(req, init))` directly to `RPCLink` fails abort
parity on `main` (`87965d80`, measured under Deno 2.9.7):

- `new Request(req, init)` **does** link `request.signal` to `init.signal` across all `cache` modes
  (`undefined`, `'default'`, `'no-store'`, `'force-cache'`), and when the caller calls
  `controller.abort(reason)`, the mounted oRPC handler observes `signal.aborted === true` and its
  `'abort'` event fires.
- **However**, unlike WHATWG `globalThis.fetch`, Hono's `app.fetch(request)` does **not** reject
  when `request.signal` aborts; it resolves whenever the handler returns a `Response`. Measured:
  - Over HTTP: both cooperative and non-cooperative handlers caused the caller promise to reject in
    ~31–32 ms with `Error('user-aborted')`.
  - Over naive `app.fetch`: the cooperative handler observed `signal.aborted === true` and returned,
    causing the caller promise to **resolve** with `{ done: true }` instead of rejecting; the
    non-cooperative handler kept the caller waiting 154 ms and likewise resolved `{ done: true }`.
- Additionally, if `signal.aborted === true` before dispatch, `new Request(req, init)` does not
  throw, so naive `app.fetch` would still invoke middleware and the handler.

#### Normative in-process fetch adapter contract

The package-private `createInProcessFetch()` adapter in `packages/sdk/src/client/in-process-client-link.ts`
MUST enforce WHATWG Fetch abort semantics around `app.fetch(request)`:

```ts
function abortReason(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException('The operation was aborted', 'AbortError');
}

function createInProcessFetch(
  resolveApp: () => InProcessServiceApp,
): typeof globalThis.fetch {
  return (input, init) => {
    const signal = init?.signal ?? (input instanceof Request ? input.signal : undefined);
    if (signal?.aborted) {
      return Promise.reject(abortReason(signal));
    }

    const app = resolveApp();
    const request = new Request(input, init);
    const dispatch = withContextAsync(extractContext({}), async () => await app.fetch(request));

    if (signal === undefined) {
      return dispatch;
    }

    return new Promise<Response>((resolve, reject) => {
      let settled = false;

      const onAbort = (): void => {
        if (settled) return;
        settled = true;
        reject(abortReason(signal));
        // Drain any late settlement: prevent unhandled rejection and release any Response body.
        void dispatch.then(
          (response) => response.body?.cancel().catch(() => {}),
          () => {},
        );
      };

      signal.addEventListener('abort', onAbort, { once: true });

      dispatch.then(
        (response) => {
          if (settled) {
            void response.body?.cancel().catch(() => {});
            return;
          }
          settled = true;
          signal.removeEventListener('abort', onAbort);
          resolve(response);
        },
        (error) => {
          if (settled) return;
          settled = true;
          signal.removeEventListener('abort', onAbort);
          reject(error);
        },
      );
    });
  };
}
```

Normative properties verified by measurement on `main` (`87965d80`):

1. **Pre-aborted signal:** Rejects immediately with `abortReason(signal)` before calling
   `app.fetch(request)` (`handlerEntered: false`).
2. **In-flight handler observation:** `new Request(input, init)` forwards `signal` into
   `request.signal`, which Hono (`c.req.raw`) and oRPC `RPCHandler` expose as `{ signal }` inside
   the procedure handler. Aborting the caller's `AbortController` fires `'abort'` on the handler's
   `signal` immediately — matching HTTP disconnect cancellation.
3. **Immediate caller rejection:** Both cooperative and non-cooperative handlers reject the caller
   immediately upon abort (~31–32 ms, matching HTTP's ~31–32 ms) with the exact `signal.reason`.
4. **No leaked listeners, bodies, or unhandled rejections:** Normal settlement removes the `'abort'`
   listener immediately; abort settlement detaches the caller, cancels any late `Response.body`
   stream, and suppresses unhandled rejection from a late handler failure.
5. **Streaming responses after headers settle:** Once a streaming `Response` (e.g., SSE / async
   iterator) is returned, `request.signal` remains linked to the caller's `AbortSignal` so the
   mounted producer still observes mid-stream cancellation, while `createStableV1ClientLink()`
   already prevents reconnect epochs after abort
   (`packages/sdk/tests/integration/client-contribution-adapter_test.ts:329-367`).
6. **Zero request retention:** `createInProcessFetch()` holds no map, set, queue, or cache across
   calls. Once settled or aborted, no reference to the `Request`, `Response`, `AbortSignal`, or
   caller context remains in the adapter or registry.

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
- `GET` cancellation and `cache: 'no-store'` parity on **both** HTTP and in-process is owned by
  `#2611` and applies automatically to the in-process transport as soon as `#2611` lands, with zero
  in-process-specific workaround or divergence.

### Context isolation and non-retention guarantees

Neither transport may share a result between caller contexts/partitions or retain a cancelled
request. This invariant holds across all four layers:

| Layer                                               | Isolation / non-retention mechanism                                                                                                                    | Parity guarantee                                                                                  |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Server cache (`createQueryFactory` / `CacheQuery`)  | Full key appends `['$netscript.sdk-context', JSON.stringify(sortedPairs)]` (`packages/sdk/src/internal/client-contributions/prepared-call.ts:418-421`). Rejected/denied/aborted `queryFn` calls never populate cache entries. | Shared `contributionRuntimeByClient` (`WeakMap`) and `CacheQuery` across HTTP and in-process.     |
| TanStack Query (`createServiceQueryUtils`)          | Recursive proxy appends `['$netscript.sdk-context', ...sortedPairs]` to full read keys (`packages/sdk/src/query-client/create-service-query-utils.ts:49-92`). | Shared proxy and `contributionRuntimeByClient` across HTTP and in-process.                        |
| Transport dedup (`DedupeRequestsPlugin`)            | Prepared contribution headers exist before dedup (`client-contribution-adapter_test.ts:454-499`), so distinct `authorization` / `accept-language` headers never coalesce. Signalled / `no-store` GET isolation is owned by `#2611`. | Single `DedupeRequestsPlugin` instance inside shared `createFetchRpcClientLink`.                  |
| In-process registry & fetch adapter                 | Registry stores only `serviceName → InProcessServiceApp`. Fetch adapter holds zero cross-call state, removes `'abort'` listeners on settlement, and cancels late `Response.body` streams. | Zero request/response/context retention after completion or abort.                                |

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
- **Denied caller C:** unauthenticated (`401`) and/or unauthorized (`403`) caller (`partition: 'ctx-denied'`).

Assert exact HTTP ↔ in-process parity across every case:

1. **Effective RPC path:** Both transports deliver the identical `url.pathname` derived from
   `buildServiceRpcPath()` (including custom `routerName`, `apiPath`, and `apiVersion` overrides).
2. **Response and denial parity:**
   - Context A and context B receive byte-identical decoded responses on HTTP and in-process, each
     reflecting only its own authenticated principal.
   - Denied caller C receives the identical `safe()` failure (`isSuccess: false`, matching `code`,
     `status`, `defined`) on HTTP and in-process; contract-defined errors (`defined: true`) likewise
     match.
3. **Trace propagation and isolation:**
   - With `propagateTraceContext: true` under an active parent span carrying W3C `tracestate`: both
     transports emit an `rpc.client` (`SpanKind.CLIENT`) span under the parent, deliver `traceparent`
     (containing the caller's `traceId` and the `rpc.client` `spanId`) plus `tracestate` to the
     mounted service handler, and parent the service's HTTP `SERVER` span to the `rpc.client` span.
   - With `propagateTraceContext: false`: neither transport attaches `traceparent`/`tracestate`, and
     on **both** transports the mounted service's `SERVER` span starts a fresh detached root trace
     (`parentSpanId === null`, `serverTraceId !== callerTraceId`).
4. **Cache isolation (`createQueryFactory` and `createServiceQueryUtils`):**
   - Calling through `defineServices()` / `createQueryFactory()` backed by `CacheQuery(new MemoryCacheStore())`
     populates distinct `$netscript.sdk-context` keys for context A and context B; neither transport
     shares a cached result between the two contexts.
   - Denied caller C fails without reading A's or B's cached data and without writing any cache
     entry (`getCachedData` returns `null`).
   - `createServiceQueryUtils()` produces identical partitioned `queryKey` tuples across both
     transports, and `direct-only` contributions omit `queries` and `queryUtils` identically on both
     transports.
5. **In-flight abort / cancellation and non-retention:**
   - Hold one call in flight on a synthetic procedure and abort its caller `AbortSignal` (covering
     both a cooperative handler that awaits `signal` and a non-cooperative handler that ignores
     `signal`, plus a pre-aborted negative control that must not enter the handler):
     - The mounted handler observes `signal.aborted === true` (and `'abort'` listener fires) on
       in-process just as the HTTP handler does.
     - Both HTTP and in-process caller promises reject promptly with `signal.reason`.
     - Neither transport shares a result between the two caller contexts or populates any cache
       entry for the cancelled call.
     - Neither transport retains the cancelled request: subsequent calls on both transports succeed
       cleanly, Deno's built-in ops and resource sanitizers remain enabled and green, and late
       `Response.body` streams are cancelled cleanly.
   - *(Sequencing note)* For `GET` procedures, the abort-in-flight case additionally depends on
     `#2611`'s shared `DedupeRequestsPlugin` repair landing; implementation must cover `POST` abort
     parity immediately and include `GET` abort parity once `#2611` is merged (see
     [Unresolved questions](#unresolved-questions)).

#### 2. Registry, compatibility, and negative-control tests

- Omitting `transport` defaults to HTTP; all existing `packages/sdk/tests/` suites stay green
  without modification.
- `registerInProcessService` / `resolveInProcessService` / `unregisterInProcessService` /
  `clearInProcessServices` and isolated `createInProcessServiceRegistry()` instances:
  - Unknown `serviceName` throws `InProcessServiceError` (`IN_PROCESS_SERVICE_NOT_FOUND`) naming
    `serviceName` before invoking contribution `prepare()`.
  - Duplicate `serviceName` throws `InProcessServiceError` (`IN_PROCESS_SERVICE_DUPLICATE`) unless
    `{ replace: true }` is passed.
  - `clearInProcessServices()` isolates tests cleanly; two scoped registries do not interfere.
- Construction validation rejects malformed `transport`, `app` + `registry` together, `resolveServiceUrl`
  combined with `kind: 'in-process'`, and non-`fetch` app objects.

#### 3. Type, JSR, browser-safety, and doctrine gates

- Type fixture `packages/sdk/tests/type-fixtures/in-process-service-app_type.ts` proves:
  - `ServiceApp` from `@netscript/service` is assignable to `InProcessServiceApp` with zero casts;
  - `createInProcessServiceClient` and `createServiceClient({ ..., transport: { kind: 'in-process', ... } })`
    infer identical `ServiceClient<TContract, ServiceClientContext & SdkClientContributionContext<TContributions>>`
    types and preserve `defineServices()` `queries` / `queryUtils` / `direct-only` omission;
  - mutually exclusive `app` vs `registry` arms fail compilation via `@ts-expect-error`.
- `packages/sdk/tests/client-contribution-private-surface_test.ts` updated to include
  `createInProcessClientLink` and `createFetchRpcClientLink` in `PRIVATE_ADAPTER_NAMES` and green.
- `packages/sdk/tests/query/define-services-browser-import_test.ts` remains green (0 logger/kv/`node:`
  edges on `mod.ts` and `src/presets/mod.ts`).
- `packages/sdk/tests/integration/service-url-resolver_test.ts` (`no-deno-runtime-client.ts`)
  remains green (no `Deno.*` global access or types required on universal SDK entrypoints).
- Scoped `run-deno-check.ts`, `run-deno-test.ts`, `run-deno-lint.ts`, `run-deno-fmt.ts`,
  `deno task doc:lint --root packages/sdk --pretty`, `deno task quality:gate`, `deno task arch:check`,
  and `deno publish --dry-run --allow-dirty` in `packages/sdk` all pass with zero warnings/slow types.

## Drawbacks

- **Full Request/Response serialization overhead in-process:** Routing through `RPCLink` and
  `ServiceApp.fetch(new Request(req, init))` still serializes/deserializes payloads and builds Web
  Fetch objects in memory. That overhead is small (sub-millisecond in local measurements) and is the
  exact price of preventing HTTP/in-process semantic divergence.
- **Process-scoped default registry risk:** Offering `registerInProcessService()` /
  `clearInProcessServices()` introduces opt-in module-level state that tests must clear if they use
  the default registry instead of `createInProcessServiceRegistry()` or direct `app` binding.
- **Minor type widening if `SdkClientTransportDescriptor.kind` adds `'in-process'`:** Any external
  contribution that narrows `options.transport.kind` to literal `'http'` without checking
  `transport.secure` would observe `'http' | 'in-process'` (see [Breaking changes and migration](#breaking-changes-and-migration)).
- **Shared dependency on `#2611` for `GET` cancellation:** Because this RFC deliberately shares
  `RPCLink` and `DedupeRequestsPlugin` with HTTP rather than forking a second transport, `GET`
  in-flight cancellation inherits `#2611`'s schedule rather than bypassing it.

## Rationale and alternatives

### Why this design

Reusing `RPCLink`, `ResolvedTransportPolicy`, `PreparedOutboundHeadersPort`, `createStableV1ClientLink`,
and `ServiceApp.fetch()` guarantees structural anti-divergence: there is only one wire codec, one
RPC path builder, one contribution preparation pipeline, one cache-partition runtime, and one trace
injection site. Adding only the abort-aware, `ROOT_CONTEXT`-detached `createInProcessFetch` adapter
and the `InProcessServiceApp` structural port closes the two measured in-process parity traps
(abort resolution mismatch and ALS trace leakage) while keeping `@netscript/sdk` browser-safe and
upstream-type-free.

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
- force every caller mounting a `ServiceApp` to hand-roll the non-obvious abort race, `Response.body`
  cancellation, `ROOT_CONTEXT` telemetry detachment, and synthetic `.localhost` origin — reintroducing
  the exact bugs measured in our baseline probes.

Rejected in favor of the closed, discriminated `ServiceClientTransport` union.

### Impact of not doing this

Single-process deployments and tests remain forced onto either loopback sockets (with port/net
overhead) or direct router calls (which silently diverge from production HTTP middleware, auth,
tracing, and serialization behavior).

## Breaking changes and migration

- **Existing callers:** Strictly additive and non-breaking. `transport` is optional and defaults to
  `{ kind: 'http' }`; omitting it preserves identical runtime and compile-time behavior across
  `createServiceClient()`, `defineServices()`, `createQueryFactory()`, and
  `createServiceQueryUtils()`.
- **Contributions reading `SdkClientTransportDescriptor.kind`:** Widening
  `SdkClientTransportDescriptor.kind` from `'http'` to `'http' | 'in-process'` is a narrow type-level
  widening on the v1 contribution descriptor. Existing first-party contributions
  (`createBearerSdkClientContribution`, `createInternalCredentialSdkClientContribution`,
  `createLocaleSdkClientContribution`) do not constrain `transport.kind` to `'http'` and compile and
  pass unchanged. If FCP prefers strictly zero type widening on `SdkClientTransportDescriptor.kind`,
  see [Unresolved questions](#unresolved-questions) item 1.
- **Migration for tests using loopback listeners purely for in-process RPC:** Tests may optionally
  switch from `serve({ port: 0 })` + `Deno.env.set(...)` to `build()` +
  `createInProcessServiceClient({ contract, serviceName, app })` (or a scoped registry) without
  changing contract, contribution, query, or assertion code.

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
  racing and OTel context detachment to match real network `fetch()`.
- **WHATWG Fetch Standard** (abort-before-fetch and in-flight abort rejection) and **W3C Trace
  Context** (`traceparent`/`tracestate` propagation across trust/transport boundaries).
- **RFC 6761 §6.3**: reserves `.localhost` names for local-only use without external DNS resolution.

## Unresolved questions

These focused items are intended to be settled during RFC discussion / FCP before implementation:

1. **`SdkClientTransportDescriptor.kind` widening vs staying `'http'`:** Should
   `SdkClientTransportDescriptor.kind` widen to `'http' | 'in-process'` (recommended so
   contributions and diagnostics can distinguish network vs in-process calls while `secure: true`
   keeps auth contributions working), or remain `'http'` for strictly zero type-level widening?
2. **`InProcessServiceApp` shape (1 method vs 2 methods):** Should `InProcessServiceApp` declare
   only `fetch(request: Request): Response | Promise<Response>` (recommended per doctrine minimal
   single-verb port rule, accepting `ServiceApp`, Hono apps, and minimal `{ fetch }` stubs), or
   mirror both `fetch` and `request` from `ServiceApp` (omitting `ServiceEnvironment` / `Deno.Addr`)?
3. **Package-private `createInProcessClientLink`:** Confirm keeping `createInProcessClientLink`
   package-private (parallel to `createHttpClientLink` and `client-contribution-private-surface_test.ts`)
   rather than promoting `ClientLinkPort` to a public export in this change.
4. **Default process-scoped registry vs scoped-only:** Should the SDK ship both isolated
   `createInProcessServiceRegistry()` AND the default process-scoped helpers
   (`registerInProcessService` / `unregisterInProcessService` / `resolveInProcessService` /
   `clearInProcessServices` from issue `#451`), or require an explicit `app` or scoped `registry`?
5. **Duplicate registration default:** Confirm rejecting duplicate `serviceName` registrations by
   default (`IN_PROCESS_SERVICE_DUPLICATE`) with opt-in `{ replace: true }`, versus silent overwrite.
6. **Optional telemetry additions:**
   - Keep `'netscript.rpc.transport': 'orpc'` and optionally add
     `'netscript.rpc.transport.mode': 'http' | 'in-process'` on the `rpc.client` span?
   - Reuse existing `withContextAsync(extractContext({}), ...)` from `@netscript/telemetry/context`
     (zero changes to `@netscript/telemetry`), or also add a dedicated `withRootContext()` helper in
     `@netscript/telemetry/context`?
7. **Sequencing of `GET` abort-in-flight acceptance case with `#2611`:** Should implementation wait
   for `#2611` to land so the acceptance parity suite asserts both `GET` and `POST` abort-in-flight
   cancellation in one PR, or may implementation land with `POST` abort parity first and enable the
   `GET` abort parity assertion as soon as `#2611` merges?

## Future possibilities

- Single-process multi-service host composition and deployment adapters (orthogonal to this RFC;
  tracked under [#891](https://github.com/rickylabs/netscript/issues/891)).
- Explicit public custom-transport port (`ClientLinkPort` with capability negotiation) if a third
  non-Fetch, non-MessagePort transport emerges.
- Dedicated MessagePort contribution protocol for `@netscript/sdk/desktop` in a separate RFC.
- Zero-copy or binary stream optimizations for large in-process streaming responses, provided HTTP
  semantic parity and cancellation invariants remain preserved.
