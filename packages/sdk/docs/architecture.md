# `@netscript/sdk` Architecture

This document records the package-level architecture contract for
`@netscript/sdk`. It complements the public README with the layer map and seam
audit used by the package-quality gate.

## Layer Map

| Layer         | Role                               | SDK files                                                                | Extension rule                                                                           |
| ------------- | ---------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| L0 ports      | Package-owned structural contracts | `src/ports/*`                                                            | Add width only when a consumer needs it. Do not re-export upstream implementation types. |
| L1 primitives | Runtime building blocks            | `src/cache/*`, `src/discovery/*`, `src/openapi/*`, `src/telemetry/*`     | Implement behavior here without depending on L2 factories.                               |
| L2 factories  | Typed composition units            | `src/client/*`, `src/query/*`, `src/query-client/*`, `src/collections/*` | Accept L0/L1 values and return named package-owned surface types.                        |
| L3 preset     | One-liner app composition          | `src/presets/define-services.ts`                                         | Compose L2 factories only and return the L2 values directly.                             |

## Composability Contract

Every higher layer must be replaceable by dropping down one level:

- `defineServices()` returns `clients`, `queries`, and `queryUtils`; these are
  the same values produced by `createServiceClient()`, `createQueryFactory()`,
  and `createServiceQueryUtils()`.
- Query factories accept `ServiceClient<TContract>` and expose
  `QueryFactory<TContract>`.
- Query-client helpers accept `ServiceClient<TContract>` and expose
  `ServiceQueryUtils<TContract>`.
- Collections accept `QueryClientPort` and return `QueryCollection<TItem>`.
- Cache-aware query execution goes through `CacheProvider`, not through an
  upstream QueryClient type.

The contract forbids convenience APIs from hiding the lower-level values they
compose. If an application starts with `defineServices()` and later needs manual
wiring, it can reuse the returned clients and query helpers.

## Type Inference Contract

The contract type flows through the SDK without user annotations:

```text
ContractLike
  -> ServiceClient<TContract>
  -> QueryFactory<TContract>
  -> ServiceQueryUtils<TContract>
  -> defineServices() result maps
```

Public types are named aliases or interfaces so editor hovers remain readable.
Internal assertions are allowed only at upstream boundaries or when JavaScript
reflection loses a mapped key relationship, and those assertions must explain
why they are sound.

## Transport Seam Audit

The current transport implementation is HTTP:

- `createServiceClient()` creates a client link through
  `createHttpClientLink()`.
- `createHttpClientLink()` resolves service URLs, trace headers, retry behavior,
  request dedupe, and fetch bridging.
- `ClientLinkFactory` and `ClientLinkPort` are internal structural seams under
  `src/ports/client-link-factory.ts`.

This slice intentionally does not add a public transport option and does not
implement RFC 14 in-process/unified mode. The seam exists so a future in-process
adapter can be added behind the same `createServiceClient()` public API.

## Discovery Split

Discovery is separated by responsibility:

- `browser-env.ts` builds and reads VITE-exposed service URL keys.
- `service-url.ts` resolves service URLs and enumerates Aspire services.
- `kv-connection.ts` resolves KV and SQL connection settings.
- `mod.ts` is the implementation barrel used by the public subpath.

The lookup order is full VITE key, shorthand VITE key, then server `services__*`
env. Tests cover this order because it is the highest-risk part of the split.

## Cache State

`CacheQuery` owns in-flight dedupe state as instance state. The exported
`cacheQuery` singleton still has one shared map, while tests or alternate
engines can inject their own map. This avoids hidden process-global state
without removing the default shared cache behavior.

Timing defaults are centralized in `src/cache/defaults.ts` and reused by cache
queries, query factories, composite queries, query-client defaults, and the KV
persister.

## Public Surface Boundaries

The public subpaths are intentionally narrow:

- `client` for direct service calls and error helpers.
- `query` for server-side cache-aware factories.
- `query-client` for TanStack Query integration.
- `cache` for server-only cache primitives.
- `collections` for collection adapters.
- `discovery` for Aspire environment lookup.
- `ports` for structural types.
- `streams` for the first-party streams facade.
- `telemetry` for middleware helpers.

`adapters` and `openapi` are not standalone subpaths. KV cache storage is
exported from `cache`, and OpenAPI helpers are exported from the root barrel.

## Contributor Path

To extend the SDK:

1. Add or widen an L0 port only when a concrete consumer needs the width.
2. Implement runtime behavior in the matching L1 primitive or L2 factory.
3. Export through the narrowest public subpath.
4. Add a focused type fixture or runtime test that proves inference and
   behavior.
5. Keep the root barrel broad but do not add new subpaths without a consumer.
