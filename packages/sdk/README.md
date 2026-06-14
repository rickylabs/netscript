# `@netscript/sdk`

[![JSR](https://jsr.io/badges/@netscript/sdk)](https://jsr.io/@netscript/sdk)
[![Deno](https://img.shields.io/badge/runtime-Deno-000000?logo=deno&logoColor=white)](https://deno.com/)
[![License](https://img.shields.io/badge/license-MIT-0f172a)](https://opensource.org/licenses/MIT)

Service discovery, typed service clients, cache-aware query factories, and TanStack Query utilities
for NetScript applications running on Deno with Aspire orchestration.

## 1. What This Package Provides

`@netscript/sdk` is an **Archetype 4 (DSL/Builder)** package (see the doctrine archetype map and
[`docs/architecture.md`](./docs/architecture.md)): its public product is a set of typed factory and
preset builders that turn generated service contracts into runtime clients and query helpers. The
package connects generated service contracts to runtime clients and query helpers, and is designed
as four composable layers:

- L0 ports: package-owned structural types such as `ServiceClient`, `QueryFactory`,
  `QueryClientPort`, `ServiceQueryUtils`, `CacheStore`, and `ServiceTransport`.
- L1 primitives: service discovery, cache query execution, KV cache storage, OpenAPI helpers, and
  telemetry middleware.
- L2 factories: `createServiceClient()`, `createQueryFactory()`, `createServiceQueryUtils()`,
  `createQueryCollection()`, and `createNetScriptQueryClient()`.
- L3 preset: `defineServices()`, a one-liner that returns the same L2 values for many services.

Each layer is implemented in terms of the layer below it. The one-liner is a convenience, not a
container: if you outgrow it, the returned values are already the lower-level values you would have
wired by hand.

## 2. Install

```json
{
  "imports": {
    "@netscript/sdk": "jsr:@netscript/sdk@^0.0.1-alpha.0",
    "@netscript/sdk/": "jsr:@netscript/sdk@^0.0.1-alpha.0/"
  }
}
```

The package is Deno-first. It assumes Aspire-style environment variables for service discovery and
uses Deno KV through the cache subpath when server-side cache primitives are imported.

## 3. Entry Points

| Import                        | Use it for                                     | Main exports                                                                |
| ----------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------- |
| `@netscript/sdk`              | Root composition and broad service app imports | `defineServices`, client/query/cache/discovery exports                      |
| `@netscript/sdk/client`       | Direct oRPC clients                            | `createServiceClient`, `safe`, `isDefinedError`, `ServiceClient`            |
| `@netscript/sdk/query`        | Server-side cache-aware query factories        | `createQueryFactory`, `createQueryFactories`, `createCompositeQuery`        |
| `@netscript/sdk/query-client` | TanStack Query integration                     | `createServiceQueryUtils`, `createNetScriptQueryClient`, key bridge helpers |
| `@netscript/sdk/cache`        | Server-only cache primitives                   | `CacheQuery`, `cacheQuery`, `KvCacheStore`, provider registration           |
| `@netscript/sdk/collections`  | TanStack DB collection adapter                 | `createQueryCollection`, `QueryCollection`                                  |
| `@netscript/sdk/discovery`    | Aspire service and database lookup             | `getServiceUrl`, `getServiceInfo`, `getKvConnection`, SQL helpers           |
| `@netscript/sdk/ports`        | Structural SDK contracts                       | `ServiceClient`, `QueryFactory`, `QueryClientPort`, `ServiceQueryUtils`     |
| `@netscript/sdk/streams`      | Durable stream producer facade                 | `createStreamProducer`, stream-core type exports                            |
| `@netscript/sdk/telemetry`    | Middleware type surface                        | `otelMiddleware`                                                            |

## 4. Quick Start With `defineServices`

Use `defineServices()` when an app has several service contracts and wants clients plus query
helpers from one map.

```ts
import { defineServices } from '@netscript/sdk';
import { ordersContract, usersContract } from './contracts.ts';

export const sdk = defineServices({
  orders: { contract: ordersContract },
  users: { contract: usersContract, options: { staleTime: 60_000 } },
});

const order = await sdk.clients.orders.get({ id: 'ord_1' });
const page = await sdk.queries.orders.list({ limit: 20, offset: 0 });
const options = sdk.queryUtils.orders.list.queryOptions({
  input: { limit: 20, offset: 0 },
});

void order;
void page;
void options;
```

The type of each client, query factory, and query utility is inferred from the matching contract. No
user-facing type annotation is required.

## 5. Direct Service Clients

Use `createServiceClient()` when you only need direct RPC calls.

```ts
import { createServiceClient, isDefinedError, safe } from '@netscript/sdk/client';
import { ordersContract } from './contracts.ts';

const orders = createServiceClient({
  contract: ordersContract,
  serviceName: 'orders-api',
});

const [error, result] = await safe(orders.get({ id: 'ord_1' }));

if (error && isDefinedError(error)) {
  console.error(error.code, error.data);
}

void result;
```

The client resolves `services__orders-api__http__0` by default and keeps trace headers connected
when telemetry context is available.

## 6. Query Factories

Query factories are framework-neutral L2 helpers. They use the SDK cache provider and expose
execution, invalidation, prefetch, cache reads, and TanStack-compatible options for each contract
procedure.

```ts
import { createQueryFactories } from '@netscript/sdk/query';

const queries = createQueryFactories({
  orders: { contract: ordersContract, client: ordersClient },
});

const firstPage = await queries.orders.list({ limit: 20, offset: 0 });
const key = queries.orders.list.key({ limit: 20, offset: 0 });

queries.orders.list.prefetch({ limit: 20, offset: 20 });
await queries.orders.invalidate();

void firstPage;
void key;
```

Import `@netscript/sdk/cache` once in server-side code to register the default KV-backed cache
provider.

## 7. TanStack Query Integration

Use `@netscript/sdk/query-client` in browser or island code.

```ts
import { createNetScriptQueryClient, createServiceQueryUtils } from '@netscript/sdk/query-client';

const queryClient = createNetScriptQueryClient();
const orderUtils = createServiceQueryUtils(ordersClient, { path: ['orders'] });

const queryOptions = orderUtils.list.queryOptions({
  input: { limit: 20, offset: 0 },
});

void queryClient;
void queryOptions;
```

The public `ServiceQueryUtils<TContract>` type is a structural mirror. It preserves contract
inference without requiring applications to import upstream oRPC helper types.

## 8. Cache Primitives

`@netscript/sdk/cache` is server-only. Importing it registers `cacheQuery` as the provider used by
query factories.

```ts
import { CacheQuery, cacheQuery, KvCacheStore } from '@netscript/sdk/cache';

const customCache = new CacheQuery(new KvCacheStore());
await cacheQuery.setCachedData(['orders', 'summary'], { count: 3 });

void customCache;
```

Cache timing defaults live in one internal constants module and are shared by server cache queries,
query factories, query-client defaults, and the KV persister.

## 9. Service Discovery

Service discovery supports browser and server lookup paths.

```ts
import {
  getAllServices,
  getKvConnection,
  getServiceInfo,
  getServiceUrl,
} from '@netscript/sdk/discovery';

const apiUrl = getServiceUrl('orders-api', 'http');
const info = getServiceInfo('orders-api');
const kvConnection = getKvConnection('kv');
const services = getAllServices();

void apiUrl;
void info;
void kvConnection;
void services;
```

Lookup order is:

1. `VITE_services__{serviceName}__{protocol}__{index}`
2. `VITE_{NORMALISED_SERVICE_NAME}_URL`
3. `services__{serviceName}__{protocol}__{index}`

The browser and server lookup logic lives in separate implementation files so consumers can reason
about which runtime surface they are importing.

## 10. Collections

Collections wrap TanStack DB behind the package-owned `QueryCollection<TItem>` return port.

```ts
import { createQueryCollection } from '@netscript/sdk/collections';

const orders = createQueryCollection({
  resource: 'orders',
  queryKey: ['orders', 'list'],
  queryFn: () => queries.orders.list({ limit: 100, offset: 0 }),
  getKey: (order) => order.id,
  queryClient,
});

await orders.preload();
const order = orders.get('ord_1');

void order;
```

The public port includes common read, iteration, mutation, lifecycle, and preload operations without
leaking TanStack DB helper types.

## 11. OpenAPI And Telemetry

OpenAPI helpers are exported from the root barrel.

```ts
import { createOpenAPIGenerator, generateOpenAPISpec } from '@netscript/sdk';

const generator = createOpenAPIGenerator();
const spec = await generateOpenAPISpec(router, generator, {
  title: 'Orders API',
  version: '1.0.0',
  description: 'Order management endpoints',
});

void spec;
```

Telemetry middleware is intentionally narrow:

```ts
import { otelMiddleware } from '@netscript/sdk/telemetry';

const middleware = otelMiddleware();
void middleware;
```

Client trace propagation is handled through `createServiceClient()` and the internal HTTP link.

## 12. Ports And Extension Points

Use `@netscript/sdk/ports` when another package needs SDK-compatible shapes without depending on
concrete SDK adapters.

```ts
import type {
  QueryClientPort,
  QueryFactory,
  ServiceClient,
  ServiceQueryUtils,
} from '@netscript/sdk/ports';

type OrdersClient = ServiceClient<typeof ordersContract>;
type OrdersQueries = QueryFactory<typeof ordersContract>;
type OrdersUtils = ServiceQueryUtils<typeof ordersContract>;

void (undefined as unknown as QueryClientPort);
void (undefined as unknown as OrdersClient);
void (undefined as unknown as OrdersQueries);
void (undefined as unknown as OrdersUtils);
```

The transport seam for a future in-process client adapter is internal today. The public
`createServiceClient()` options remain transport-agnostic.

## 13. Architecture Notes

The SDK follows the layer model described in [`docs/architecture.md`](./docs/architecture.md).

- Ports are structural and package-owned.
- Higher layers expose the lower-layer values they compose.
- The HTTP transport link is isolated behind an internal client-link factory.
- Service discovery keeps browser environment lookup separate from server environment lookup.
- Cache in-flight dedupe state belongs to `CacheQuery` instances, not process-global module state.

## 14. Development, Validation, And License

Common package-local tasks:

```sh
deno task check
deno task test
deno task lint
deno task fmt
deno task publish:dry-run
```

During package-quality work, the repository may keep `packages/sdk/` excluded from the root config
until the final validation slice. Focused checks use explicit configs and entrypoints so type and
documentation evidence still covers the current public surface.

MIT
