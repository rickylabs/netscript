# `@netscript/sdk`

[![JSR](https://jsr.io/badges/@netscript/sdk)](https://jsr.io/@netscript/sdk)
[![Deno](https://img.shields.io/badge/runtime-Deno-000000?logo=deno&logoColor=white)](https://deno.com/)
[![License](https://img.shields.io/badge/license-MIT-0f172a)](https://opensource.org/licenses/MIT)

Service discovery, type-safe oRPC clients, and cache-backed query factories for NetScript applications running on Deno with Aspire orchestration.

## Features

- **Service discovery** — Automatic URL resolution from Aspire environment variables
- **Type-safe clients** — oRPC client factories with full contract inference and typed return values
- **Cache-backed queries** — Query factories with built-in KV caching, stale-while-revalidate, and prefetch
- **OpenTelemetry tracing** — Automatic span propagation on all RPC calls
- **OpenAPI generation** — Spec generation from oRPC routers with configurable title, version, and description
- **Database discovery** — Helpers for resolving Postgres, MySQL, and SQL Server connection strings from Aspire
- **Subpath imports** — Import only the capability you need

## Install

```ts
// deno.json
{
  "imports": {
    "@netscript/sdk": "jsr:@netscript/sdk@^1.0.0"
  }
}
```

Focused subpath imports are also available for narrower dependency graphs:

```ts
import { createServiceClient } from "@netscript/sdk/client";
import { getServiceUrl } from "@netscript/sdk/discovery";
import { createQueryFactories } from "@netscript/sdk/query";
```

## Quick Start

Resolve a service URL and make a type-safe API call:

```ts
import { createServiceClient } from "@netscript/sdk/client";
import { getServiceUrl } from "@netscript/sdk/discovery";

// Reads services__orders-api__http__0 from the Aspire environment
const baseUrl = getServiceUrl("orders-api");

// Pass your oRPC contract and the service name — the client resolves the URL automatically
const ordersApi = createServiceClient({
  contract: ordersContract,
  serviceName: "orders-api",
});

const result = await ordersApi.list({ limit: 10, offset: 0 });
//    ^? inferred from your contract
```

## Entry Points

| Import | Purpose | Key Exports |
|--------|---------|-------------|
| `@netscript/sdk` | Root — re-exports the full primary API | Everything below |
| `@netscript/sdk/discovery` | Service and database URL discovery | `getServiceUrl`, `getServiceInfo`, `getAllServices`, `getPostgresUri`, `getMysqlUri` |
| `@netscript/sdk/client` | oRPC client factories and error helpers | `createServiceClient`, `safe`, `isDefinedError` |
| `@netscript/sdk/cache` | Cache primitives and cache-entry helpers | `cacheQuery`, `CacheQuery`, `isCacheEntryStale`, `toCachedEntry` |
| `@netscript/sdk/query` | Query factories with built-in caching | `createQueryFactories`, `createQueryFactory`, `createCompositeQuery` |
| `@netscript/sdk/openapi` | OpenAPI spec generation | `createOpenAPIGenerator`, `generateOpenAPISpec` |
| `@netscript/sdk/telemetry` | OpenTelemetry middleware | `otelMiddleware` |
| `@netscript/sdk/adapters` | KV-backed cache store adapter | `KvCacheStore` |
| `@netscript/sdk/interfaces` | Canonical TypeScript contracts | `CacheStore`, `ServiceMetadata`, `PaginatedResponse` |

## Usage

### Resolve service URLs

```ts
import {
  getAllServices,
  getServiceInfo,
  getServiceUrl,
  isServiceAvailable,
} from "@netscript/sdk/discovery";

// Single endpoint — throws if not found
const url = getServiceUrl("orders-api", "http");

// All endpoints for a service
const info = getServiceInfo("orders-api");
console.log(info.http);  // http://localhost:5001
console.log(info.https); // https://localhost:5002

// List every service registered in the environment
const names = getAllServices(); // ["frontend", "orders-api", "users-api"]

// Guard before connecting
if (isServiceAvailable("payments-api")) {
  // ...
}
```

### Type-safe oRPC clients

```ts
import { createServiceClient } from "@netscript/sdk/client";

const usersApi = createServiceClient({
  contract: usersContract,       // your oRPC contract
  serviceName: "users-api",
  propagateTraceContext: true,   // default — keeps OTel spans connected across services
});

const user = await usersApi.getById({ id: "usr_1" });
//    ^? inferred output type from contract
```

### Error handling

```ts
import { isDefinedError, safe } from "@netscript/sdk/client";

const [err, user] = await safe(usersApi.getById({ id: "usr_1" }));

if (err) {
  if (isDefinedError(err)) {
    // err is a typed contract error — access err.data for the payload
  } else {
    // unexpected error
  }
}
```

### Cache-backed query factories

Build per-resource query helpers with built-in caching, invalidation, and prefetch:

```ts
import { createQueryFactories } from "@netscript/sdk/query";

const queries = createQueryFactories({
  orders: { contract: ordersContract, client: ordersApi },
  users:  { contract: usersContract,  client: usersApi  },
});

// Cached fetch — serves stale data while revalidating in the background
const page = await queries.orders.list({ limit: 20, offset: 0 });

// Read what's in cache without making a network request
const cached = await queries.orders.list.getCachedEntry({ limit: 20, offset: 0 });

// Prefetch for the next page
queries.orders.list.prefetch({ limit: 20, offset: 20 });

// Invalidate all cached data for a resource
await queries.orders.invalidate();
```

### Generate an OpenAPI spec

```ts
import { createOpenAPIGenerator, generateOpenAPISpec } from "@netscript/sdk/openapi";

const generator = createOpenAPIGenerator();

const spec = await generateOpenAPISpec(router, generator, {
  title: "Orders API",
  version: "1.0.0",
  description: "Order management endpoints",
});

// Serve it from your Fresh or Hono app
app.get("/api/openapi.json", (c) => c.json(spec));
```

### Resolve database connections

```ts
import {
  getMysqlUri,
  getPostgresConnection,
  getPostgresUri,
} from "@netscript/sdk/discovery";

// Full URI for connecting a Postgres driver
const pgUri = getPostgresUri("postgresdb");

// Structured connection info
const pg = getPostgresConnection("postgresdb");
console.log(pg?.host, pg?.port, pg?.database);

// MySQL
const mysqlUri = getMysqlUri("mysqldb");
```

## Resources

- [`@netscript/kv`](https://jsr.io/@netscript/kv) — KV backend used by `KvCacheStore` and the cache adapters
- [oRPC documentation](https://orpc.unnoq.com) — Contract and client primitives
- [OpenTelemetry for Deno](https://docs.deno.com/runtime/fundamentals/telemetry/)
- [Aspire service discovery](https://learn.microsoft.com/en-us/dotnet/aspire/service-discovery/overview)

## License

MIT