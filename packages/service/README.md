# `@netscript/service`

[![JSR](https://jsr.io/badges/@netscript/service)](https://jsr.io/@netscript/service)
[![Deno](https://img.shields.io/badge/runtime-Deno-000000?logo=deno&logoColor=white)](https://deno.com/)
[![License](https://img.shields.io/badge/license-MIT-0f172a)](https://opensource.org/licenses/MIT)

Service bootstrap builders, health probes, and Hono/oRPC runtime wiring for NetScript
applications. The package gives generated services a small entrypoint while preserving direct
access to the underlying mountable service app.

## Features

- Fluent `createService()` builder for CORS, logging, OpenAPI, Scalar docs, RPC, health, and custom
  routes.
- One-call `defineService()` preset for generated NetScript services.
- Package-owned structural public types, so callers do not depend on Hono or oRPC type internals.
- `build()` returns a non-listening `ServiceApp` for composition into another host.
- `serve()` returns a `RunningService` with `addr` and `stop()` for tests and supervisors.
- Offline Scalar docs through the bundled `assets/scalar.min.js` file.
- Logger-backed startup diagnostics for database connectivity failures.

## Install

```jsonc
{
  "imports": {
    "@netscript/service": "jsr:@netscript/service@^0.0.1-alpha.0"
  }
}
```

## Quick Start

```ts
import { defineService } from '@netscript/service';
import { router } from './router.ts';

const service = await defineService(router, {
  name: 'users',
  port: 3000,
});

await service.stop();
```

## Entry Points

| Import | Purpose |
| --- | --- |
| `@netscript/service` | Root service primitives, builder, preset, and public structural types. |

The package currently exposes one entrypoint. Additional subpaths are deferred until the alpha
surface needs separate import graphs.

## Public Surface

The root entrypoint exports three layers:

| Layer | Exports |
| --- | --- |
| Primitives | `createHealthHandler`, `createRPCHandler`, `createOpenAPISpec`, Scalar docs handlers, not-found and error handlers. |
| Builder | `createService`, `ServiceBuilder`, `ServiceConfig`, and structural runtime types. |
| Preset | `defineService`, `DefineServiceOptions`. |

`LoggerMiddlewareOptions` is re-exported from `@netscript/logger/middleware` because it is a
first-party sibling package contract.

## Builder

Use `createService()` when a service needs explicit composition:

```ts
import { createService } from '@netscript/service';

const running = await createService(router, { name: 'orders', version: '1.0.0' })
  .withCors({ origin: 'https://app.example.com' })
  .withLogger()
  .withOpenAPI({ title: 'Orders API' })
  .withDocs()
  .withRPC()
  .withHealth()
  .serve({ port: 3001 });

await running.stop();
```

## Preset

Use `defineService()` for generated service entrypoints:

```ts
const running = await defineService(router, {
  name: 'orders',
  port: 3001,
  openapi: {
    title: 'Orders API',
    description: 'Order management service',
  },
});
```

The preset enables CORS, request logging, OpenAPI JSON, Scalar docs, RPC, service info, and health
endpoints.

## Runtime Lifecycle

`serve()` starts a Deno listener and returns:

```ts
type RunningService = {
  app: ServiceApp;
  addr: { hostname: string; port: number; transport: 'tcp' | 'unix' };
  stop(): Promise<void>;
};
```

Pass an external signal when a parent process owns cancellation:

```ts
const controller = new AbortController();
const running = await createService(router, { name: 'users' }).serve({
  port: 0,
  signal: controller.signal,
});

controller.abort();
await running.stop();
```

## Build Without Listening

`build()` returns a `ServiceApp` and does not call `Deno.serve`:

```ts
const app = createService(router, { name: 'users' })
  .withHealth()
  .build();

const response = await app.request('/health');
```

This is the composition seam for hosts that mount multiple services into one runtime.

## Health

Health endpoints are added with `withHealth()`:

| Route | Purpose |
| --- | --- |
| `/health` | Full health response with configured checks. |
| `/health/live` | Liveness probe. |
| `/health/ready` | Readiness probe. |

Custom checks use `withHealthCheck()`:

```ts
createService(router, { name: 'users' })
  .withHealthCheck({
    name: 'search',
    check: async () => ({ healthy: await searchClient.isReady() }),
  })
  .withHealth();
```

## RPC And OpenAPI

`withRPC()` installs two handler paths:

| Path | Purpose |
| --- | --- |
| `/api/rpc/*` | Type-safe RPC endpoint. |
| `/api/*` | REST-style OpenAPI endpoint. |

`withOpenAPI()` serves `/api/openapi.json`. `withDocs()` serves `/api/docs` and
`/api/docs/scalar.js`.

## Database Context

`withDatabase()` injects a database context into oRPC handlers and optionally wires health checks:

```ts
createService(router, { name: 'users' })
  .withDatabase({ primary: db }, db)
  .withRPC()
  .withHealth();
```

The preset accepts `db` and discovers the first `$queryRaw`-capable client for startup diagnostics
and health probes.

## Logging And Diagnostics

The service package uses `@netscript/logger` for listener banners, request middleware, oRPC logging,
and startup diagnostics. Database diagnostics name the selected engine, endpoint, environment
variables, and suggested local checks without printing raw credentials.

## Required Permissions

| Permission | Used by |
| --- | --- |
| `--allow-net` | `Deno.serve`, external health checks, TCP database diagnostics. |
| `--allow-env` | environment-based database diagnostics and development error messages. |
| `--allow-read` | serving bundled Scalar JavaScript. |
| `--unstable-kv` | `healthChecks.kv()`. |

## Testing

Use `build()` for in-memory route checks and `serve({ port: 0 })` for real listener checks:

```ts
const running = await createService(router, { name: 'users' })
  .withHealth()
  .serve({ port: 0 });

const response = await fetch(`http://${running.addr.hostname}:${running.addr.port}/health`);
await running.stop();
```

## Documentation

- [`docs/getting-started.md`](./docs/getting-started.md)
- [`docs/concepts.md`](./docs/concepts.md)
- [`docs/architecture.md`](./docs/architecture.md)

## See Also

- [`@netscript/logger`](https://jsr.io/@netscript/logger)
- [`@netscript/telemetry`](https://jsr.io/@netscript/telemetry)
- [Hono](https://hono.dev/)
- [oRPC](https://orpc.unnoq.com/)

## License

MIT
