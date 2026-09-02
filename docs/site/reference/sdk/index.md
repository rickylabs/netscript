---
layout: layouts/base.vto
title: "@netscript/sdk"
---

# `@netscript/sdk`

Service discovery, oRPC clients, and cache-backed query factories for NetScript. This page is
written against the package's public surface reported by `deno doc`. For the full index of
packages and plugins return to the [reference overview](/reference/).

The root entrypoint (`@netscript/sdk`) is the high-level composition entry for service-aware
applications: it re-exports the client, query, query-client, discovery, telemetry, and OpenAPI
surfaces and adds the `defineServices()` preset. It does not export the server cache engine or
install a cache provider at import time. A single `defineServices()` call wires the whole typed
stack — service clients, cache-aware query factories, and query utils — from one service map, so a
component imports ready-to-use `queryOptions()` / `mutationOptions()` instead of hand-writing fetch
wrappers. Focused sub-path exports carry the same values for narrow imports — see
[Sub-path exports](#sub-path-exports).

## Composition preset (`defineServices`)

These symbols are available from the root export and the focused, browser-safe
`@netscript/sdk/presets` entry.

| Symbol | Kind | Description |
| --- | --- | --- |
| `defineServices` | function | Create SDK clients, query factories, and query utils from one service map. |
| `DefineServiceConfig` | interface | Service definition consumed by `defineServices()`. |
| `DefineServicesConfigMap` | type alias | Input map accepted by `defineServices()`. |
| `DefinedServices` | interface | Result object returned by `defineServices()`. |
| `DefinedServiceClients` | type alias | Service clients produced by `defineServices()`. |
| `DefinedServiceQueries` | type alias | Query factories produced by `defineServices()`. |
| `DefinedServiceQueryUtils` | type alias | Service query utils produced by `defineServices()`. |

## Service clients (`@netscript/sdk/client`)

| Symbol | Kind | Signature / Description |
| --- | --- | --- |
| `createServiceClient` | function | Type-safe service client using Aspire service discovery and oRPC. Signature: `createServiceClient<TContract>(options): ServiceClient<TContract>`. |
| `safe` | function | Resolve a promise into a tuple/object result mirroring the oRPC safe-call ergonomics. |
| `isDefinedError` | function | Narrow an unknown error to an oRPC defined error. |
| `ServiceClient` | type alias | Typed service client derived from a contract router. |
| `ServiceClientShape` | type alias | Recursive callable/router shape for a typed service client. |
| `ServiceClientMethod` | type alias | Typed service-client method derived from a contract procedure. |
| `ServiceClientContext` | interface | Per-call service client context. |
| `ServiceClientContract` | interface | Compile-time marker that preserves the source contract for inference. |
| `ServiceRequestOptions` | interface | Optional second argument passed to service-client methods. |
| `CreateServiceClientOptions` | interface | Options for creating a discovered service client. |
| `ContractLike` | type alias | Recursive structural representation of an oRPC contract router. |
| `ContractProcedureLike` | interface | Minimal structural representation of an oRPC contract procedure. |
| `ContractProcedureMetadata` | interface | Public oRPC metadata used to derive client typing. |
| `ContractProcedureNames` | type alias | Procedure names available on a contract router. |
| `ContractSchema` | interface | Minimal structural representation of a standard-schema-compatible type. |
| `ContractSchemaInput` | type alias | Infer the input type from a standard schema. |
| `ContractSchemaOutput` | type alias | Infer the output type from a standard schema. |
| `ProcedureInputFromNode` | type alias | Input payload for a contract procedure node. |
| `ProcedureOutputFromNode` | type alias | Output payload for a contract procedure node. |
| `DefinedError` | interface | Public shape of an oRPC defined error. |
| `SafeResult` | type alias | Tuple/object result returned by `safe`. |
| `SafeSuccess` | type alias | Success branch returned by `safe`. |
| `SafeFailure` | type alias | Failure branch returned by `safe`. |

### Client contributions (`SdkClientContribution`)

`CreateServiceClientOptions.contributions` accepts an explicit literal tuple of request
contributions. Tuple type inference projects the combined context declared across all
contributions onto the per-call client `context`.

Every `SdkClientContribution` descriptor contains six required fields:

- `protocol`: Protocol version discriminator (`{ family: 'netscript.sdk-client', major: 1 }`).
- `id`: Globally unique contribution identifier (`${string}:${string}`).
- `context`: Runtime declaration mapping owned context keys to `'required'` or `'optional'`.
- `headerKeys`: Readonly array of exclusive lower-case HTTP request-header names owned by this
  contribution.
- `responseCache`: Response-cache policy declaration (`{ mode: 'invariant' }`,
  `{ mode: 'partitioned', partition: ... }`, or `{ mode: 'direct-only' }`).
- `prepare`: Synchronous or async hook returning a header patch (`{ headers?: Record<string, string> }`)
  for one logical request epoch.

```ts
import { oc } from '@orpc/contract';
import {
  createServiceClient,
  defineSdkClientContribution,
} from '@netscript/sdk/client';
import { z } from 'zod';

const contract = {
  echo: oc
    .route({ method: 'POST', path: '/echo' })
    .input(z.object({ message: z.string() }))
    .output(z.object({ echoed: z.string() })),
};

const tenantHeader = defineSdkClientContribution<{ tenantId: string }>()({
  protocol: { family: 'netscript.sdk-client', major: 1 },
  id: 'app:tenant-header',
  context: { tenantId: 'required' },
  headerKeys: ['x-tenant-id'],
  responseCache: {
    mode: 'partitioned',
    partition: ({ context }) => context.tenantId,
  },
  prepare: ({ context }) => ({
    headers: { 'x-tenant-id': context.tenantId },
  }),
});

const client = createServiceClient({
  contract,
  serviceName: 'tenant-service',
  contributions: [tenantHeader] as const,
});

await client.echo(
  { message: 'hello' },
  { context: { tenantId: 'tenant_123' } },
);
```

## Server-side query factories (`@netscript/sdk/query`)

| Symbol | Kind | Signature / Description |
| --- | --- | --- |
| `createQueryFactory` | function | Query factory for an oRPC contract. Signature: `createQueryFactory<TContract>(resource, contract, client, defaultOptions): QueryFactory<TContract>`. |
| `createQueryFactories` | function | Create multiple query factories at once from a resource-to-config map. |
| `createCompositeQuery` | function | Combine multiple endpoints under one cache key. |
| `setCacheProvider` | function | Register the cache engine (server bootstrap). |
| `hasCacheProvider` | function | Check whether a cache provider has been registered. |
| `QueryFactory` | type alias | Generated query helpers for a contract resource. |
| `ActionMethod` | interface | Query helper bound to a specific resource action. |
| `CompositeQuery` | interface | Composite query helper contract for multi-endpoint aggregations. |
| `FactoryConfig` | interface | Configuration for a single query factory. |
| `CacheProvider` | interface | Minimal interface the query-factory layer needs from the cache engine. |
| `ProcedureInput` | type alias | Input payload for a contract procedure. |
| `ProcedureOutput` | type alias | Output payload for a contract procedure. |

## Cache engine (`@netscript/sdk/cache`)

Server-side only. Importing this subpath is inert. Custom server bootstraps must call
`setCacheProvider(cacheQuery)` explicitly; `defineFreshApp()` does this for NetScript-managed Fresh
apps.

| Symbol | Kind | Description |
| --- | --- | --- |
| `cacheQuery` | variable | Shared cache-query singleton. |
| `CacheQuery` | class | Query cache engine with stale-while-revalidate semantics. |
| `KvCacheStore` | class | SDK cache store backed by the shared `@netscript/kv` singleton. |
| `setCacheProvider` | function | Register the cache engine (call once during server bootstrap). |
| `getCacheProvider` | function | Retrieve the registered cache provider. |
| `hasCacheProvider` | function | Check whether a cache provider has been registered. |
| `resetCacheProvider` | function | Reset the cache provider (primarily for testing). |
| `createActionQueryKey` | function | Build a canonical resource/action/input query key. |
| `serializeQueryKeyInput` | function | Serialize structured query input into the canonical cache-key segment. |
| `isCacheEntryStale` | function | Determine whether a cached entry is stale for a freshness window. |
| `toCachedEntry` | function | Convert a persisted cache entry into the public cached-entry shape. |
| `CacheEntry` | interface | Persisted cache payload stored by the SDK cache engine. |
| `CachedEntry` | interface | Public cache entry shape returned to framework consumers. |
| `CacheProvider` | interface | Minimal interface the query-factory layer needs from the cache engine. |
| `CacheQueryOptions` | interface | Full cache-query execution options. |
| `QueryParams` | interface | Cache policy overrides for a query execution. |
| `QueryKey` | type alias | Serializable query key used to address cached entries. |
| `QueryKeyPart` | type alias | Primitive query-key segment supported by the SDK cache layer. |

## Query client / TanStack integration (`@netscript/sdk/query-client`)

Browser- and island-facing TanStack Query integration.

| Symbol | Kind | Signature / Description |
| --- | --- | --- |
| `createNetScriptQueryClient` | function | TanStack QueryClient with server-first defaults. Signature: `createNetScriptQueryClient(options): QueryClient`. |
| `createServiceQueryUtils` | function | Thin oRPC/TanStack remap with `queryOptions({ input })`; unlike the golden-path `createQueryFactories` call `queryOptions(input)`, it has no server KV tier. Do not mix the two call shapes in one data layer. Signature: `createServiceQueryUtils<TContract>(client, options?): ServiceQueryUtils<TContract>`. |
| `createKvCachePersister` | function | KV-backed async storage adapter for TanStack Query persistence. |
| `bridgeInvalidation` | function | Build a client-side invalidation filter from a resource and optional action. |
| `toClientKeyPrefix` | function | Convert an SDK resource/action pair to a client-side TanStack key prefix. |
| `DEFAULT_STALE_TIME` | variable | Default stale time (30 s) matching the server-first philosophy. |
| `DEFAULT_GC_TIME` | variable | Default garbage-collection time (5 min) matching the server KV cache TTL. |
| `QueryClientPort` | type | Narrow TanStack QueryClient capability set used by SDK collection and query adapters. |
| `QueryClientFilters` | interface | Cache selector for invalidation and lookup operations. |
| `QueryClientFetchOptions` | interface | Options accepted by query fetch operations. |
| `QueryClientSetOptions` | interface | Options accepted by cache write operations. |
| `QueryClientPredicate` | type alias | Predicate filtering query cache operations by key or metadata. |
| `QueryOptionsWithInitialData` | interface | TanStack-compatible options produced by the query-options helper. |
| `ActionQueryOptions` | interface | Configuration for the action query-options helper. |
| `ActionMutationOptions` | interface | Configuration for the action mutation-options helper. |
| `MutationOptionsResult` | interface | TanStack-compatible mutation options produced by the SDK. |
| `CreateServiceQueryUtilsOptions` | interface | Options for creating TanStack Query utils from an SDK service client. |
| `NetScriptQueryClientOptions` | interface | Options for `createNetScriptQueryClient`. |
| `KvCachePersisterOptions` | interface | Options for `createKvCachePersister`. |
| `KvCachePersisterStorage` | interface | Async storage adapter shape used by the persister. |
| `ServiceQueryUtils` | type alias | TanStack Query utilities derived from a service contract. |
| `ServiceProcedureQueryUtils` | interface | TanStack Query utilities for one service procedure. |
| `ServiceProcedureQueryOptions` | type alias | Query options accepted by a service procedure utility. |
| `ServiceProcedureQueryResult` | interface | Query options returned by a service procedure utility. |
| `ServiceProcedureMutationOptions` | interface | Mutation options accepted by a service procedure utility. |
| `ServiceProcedureMutationResult` | interface | Mutation options returned by a service procedure utility. |
| `ServiceProcedureInfiniteOptions` | interface | Infinite-query options accepted by a service procedure utility. |
| `ServiceProcedureInfiniteResult` | interface | Infinite-query options returned by a service procedure utility. |
| `ServiceProcedureStreamedOptions` | type alias | Streamed-query options accepted by a service procedure utility. |
| `ServiceProcedureStreamedResult` | type alias | Streamed-query options returned by a service procedure utility. |
| `ServiceProcedureLiveResult` | type alias | Live-query options returned by a service procedure utility. |
| `ServiceOperationKey` | type alias | Partial matching key generated by service query utilities. |
| `ServiceOperationKeyOptions` | interface | Partial matching-key options at router or procedure level. |
| `ServiceOperationType` | type alias | Operation kinds accepted by service query utility keys. |
| `ServiceOptionalInputRest` | type alias | Optional/required single-option tuple based on input optionality. |
| `ServicePartialInput` | type alias | Deep partial input used by matching-key helpers. |
| `ServiceQueryKeyOptions` | type alias | Query-key options for a single service procedure. |
| `ServiceStreamedKeyOptions` | interface | Serializable streamed-query key options. |
| `ServiceQueryClientContext` | type alias | Empty oRPC client context used by SDK-created service clients. |

## Collections (`@netscript/sdk/collections`)

| Symbol | Kind | Description |
| --- | --- | --- |
| `createQueryCollection` | function | Create a TanStack DB collection backed by TanStack Query for data fetching. |
| `QueryCollection` | interface | Structural collection returned by `createQueryCollection()`. |
| `QueryCollectionOptions` | interface | Options for `createQueryCollection`. |
| `QueryCollectionStatus` | type alias | Collection status values exposed by the SDK collection port. |
| `QueryCollectionTransaction` | interface | Opaque transaction returned by collection mutation operations. |
| `QueryCollectionUpdate` | type alias | Callback used to update one collection item. |
| `QueryCollectionUpdateMany` | type alias | Callback used to update multiple collection items. |

## Service discovery (`@netscript/sdk/discovery`)

Resolves Aspire-managed service URLs and database/KV connections from environment variables.

| Symbol | Kind | Description |
| --- | --- | --- |
| `getServiceUrl` | function | Get a service URL from Aspire browser or server environment variables. |
| `getServiceInfo` | function | Get all endpoints for a service. |
| `getAllServices` | function | Get all available server-side Aspire service names. |
| `isServiceAvailable` | function | Check whether a service endpoint is available. |
| `getKvConnection` | function | Get KV connection from SQLite or remote Deno KV environment variables. |
| `getPostgresConnection` | function | Get PostgreSQL connection settings from environment variables. |
| `getPostgresUri` | function | Get the PostgreSQL connection URI. |
| `getMysqlConnection` | function | Get MySQL connection settings from environment variables. |
| `getMysqlUri` | function | Get the MySQL connection URI. |
| `getMssqlConnection` | function | Get SQL Server connection settings from environment variables. |
| `getMssqlUri` | function | Get the SQL Server connection URI. |
| `ServiceInfo` | interface | Resolved service endpoint metadata discovered from Aspire env vars. |
| `ServiceProtocol` | type alias | Supported protocols for Aspire service discovery endpoints. |
| `PostgresConnectionInfo` | interface | PostgreSQL connection details discovered from Aspire env vars. |
| `MysqlConnectionInfo` | interface | MySQL connection details discovered from Aspire env vars. |
| `MssqlConnectionInfo` | interface | SQL Server connection details discovered from Aspire env vars. |

## Durable streams (`@netscript/sdk/streams`)

Server-side writers and schema helpers for NetScript durable streams (State Protocol).

| Symbol | Kind | Description |
| --- | --- | --- |
| `createStreamProducer` | function | Create or reuse a durable stream producer for a stream path. |
| `createDurableStream` | reference | Re-export alias for the durable stream producer factory. |
| `defineStreamSchema` | function | Define a type-safe durable stream schema. |
| `inspectStreamTopic` | function | Inspect a stream schema and optional producer metadata. |
| `buildStreamUrl` | function | Build the full stream URL for a NetScript stream path. |
| `getStreamsUrl` | function | Resolve the base URL of the durable streams server. |
| `getStreamsAuth` | function | Resolve authentication headers for the durable streams server. |
| `DurableStreamProducer` | class | Server-side writer for a named durable stream. |
| `DurableStreamProducerOptions` | interface | Options accepted by `DurableStreamProducer`. |
| `StreamProducerPort` | interface | Port implemented by stream producers that publish State Protocol changes. |
| `StateSchema` | type alias | Schema map returned by `defineStreamSchema`. |
| `StreamStateDefinition` | type alias | Input map accepted by `defineStreamSchema`. |
| `CollectionDefinition` | interface | A single collection definition inside a durable stream schema. |
| `CollectionEventHelpers` | interface | Helper methods attached to collections by the durable-streams state layer. |
| `CollectionWithHelpers` | type alias | Collection definition after durable-streams helpers are attached. |
| `ChangeEvent` | interface | Entity change event emitted by durable stream producers. |
| `ControlEvent` | interface | Control event emitted for non-entity lifecycle changes. |
| `StateEvent` | type alias | Durable stream event union. |
| `Operation` | type alias | State Protocol operation names supported by durable streams. |
| `StreamTopicInspectionInput` | interface | Input accepted by `inspectStreamTopic`. |
| `StreamTopicInspectionReport` | interface | Diagnostic report returned by `inspectStreamTopic`. |

## Telemetry (`@netscript/sdk/telemetry`)

| Symbol | Kind | Description |
| --- | --- | --- |
| `otelMiddleware` | function | Create a typed passthrough OpenTelemetry middleware for oRPC composition. |
| `MiddlewareHandler` | type alias | Minimal async middleware signature used by the SDK. |
| `MiddlewareNext` | type alias | Next-handler signature for the SDK middleware chain. |

## Ports (`@netscript/sdk/ports`)

Package-owned, upstream-type-free structural ports shared with other NetScript packages. The
port surface re-exports the structural contracts documented in the sections above
(`QueryClientPort`, `CacheStore`, `ServiceMetadata`, `ServiceQueryUtils`, `HealthCheckResponse`,
`PaginatedResponse`, the service operation/key types, and the cache/contract structural
aliases). Import from `@netscript/sdk/ports` when implementing or consuming these contracts
without pulling in the concrete client, query, or cache engines.

| Representative symbol | Kind | Description |
| --- | --- | --- |
| `QueryClientPort` | type | Narrow TanStack QueryClient capability set used by SDK collection and query adapters. |
| `CacheStore` | interface | Structural cache store contract. |
| `CacheStoreEntry` | interface | Entry shape stored by a `CacheStore`. |
| `CacheKey` | type alias | Structural cache key contract. |
| `ServiceMetadata` | interface | Service metadata port. |
| `ServiceTransport` | interface | Transport port for service clients. |
| `HealthCheckResponse` | interface | Standard health-check response contract. |
| `PaginatedResponse` | interface | Standard paginated response contract. |
| `ServiceQueryUtils` | type alias | Query-utility port derived from a service contract. |

## OpenAPI helpers

Available from the root export.

| Symbol | Kind | Description |
| --- | --- | --- |
| `createOpenAPIGenerator` | function | Create an OpenAPI generator configured for Zod-backed oRPC contracts. |
| `generateOpenAPISpec` | function | Generate an OpenAPI document from a contract router. |
| `OpenAPIConfig` | interface | Shared OpenAPI configuration contract used by higher-level packages. |
| `OpenAPIDocument` | type alias | Public OpenAPI document shape returned by the SDK. |
| `OpenAPIGeneratorLike` | interface | Minimal generator contract exposed by the SDK. |

## Sub-path exports

The following entrypoints are published alongside the root export. Focused entries keep
environment-specific adapters and dependencies out of consumers that do not need them.

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/sdk` | `./mod.ts` | Side-effect-free high-level composition entry (`defineServices`) plus common non-cache surfaces. |
| `@netscript/sdk/auto-update` | `./src/auto-update/mod.ts` | Auto-update client-side primitives. |
| `@netscript/sdk/desktop` | `./src/desktop/mod.ts` | Native desktop capability helpers and bindings. |
| `@netscript/sdk/cache` | `./src/cache/mod.ts` | Server-side KV-backed cache engine and explicit provider-registration seam. |
| `@netscript/sdk/client` | `./src/client/mod.ts` | `createServiceClient` and the contract algebra. |
| `@netscript/sdk/collections` | `./src/collections/mod.ts` | TanStack DB collection backed by TanStack Query. |
| `@netscript/sdk/discovery` | `./src/discovery/mod.ts` | Aspire service URL and database/KV connection discovery. |
| `@netscript/sdk/ports` | `./src/ports/mod.ts` | Package-owned structural ports (upstream-type-free). |
| `@netscript/sdk/presets` | `./src/presets/mod.ts` | Browser-safe `defineServices` preset and its package-owned type closure. |
| `@netscript/sdk/query` | `./src/query/mod.ts` | Server-side cache-aware query factories. |
| `@netscript/sdk/query-client` | `./src/query-client/mod.ts` | TanStack Query integration for browser/island code. |
| `@netscript/sdk/streams` | `./src/streams.ts` | Durable stream producers and schema helpers. |
| `@netscript/sdk/telemetry` | `./src/telemetry/mod.ts` | OpenTelemetry middleware for oRPC. |

---

Back to the [reference overview](/reference/).
