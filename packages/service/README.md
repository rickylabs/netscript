# @netscript/service

Service bootstrap builders, health probes, and Hono/oRPC runtime wiring for NetScript applications.

## Install

```sh
deno add jsr:@netscript/service
```

## Quick example

Define a generated service entrypoint with the `defineService()` preset, which enables CORS,
request logging, OpenAPI JSON, Scalar docs, RPC, service info, and health endpoints:

```ts
import { defineService } from '@netscript/service';
import { router } from './router.ts';

const service = await defineService(router, {
  name: 'users',
  port: 3000,
});

await service.stop();
```

When a service needs explicit composition, use the fluent `createService()` builder. `serve()`
starts a Deno listener and returns a `RunningService` handle; `build()` returns a non-listening
`ServiceApp` for mounting into another host. Health primitives such as `createHealthHandler()` and
`healthChecks` can also be used directly.

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

## Docs

- [API reference](https://rickylabs.github.io/netscript/reference/service/)
- [Concepts & guides](https://rickylabs.github.io/netscript/)
- [Hono documentation](https://hono.dev/)
- [oRPC documentation](https://orpc.unnoq.com/)
