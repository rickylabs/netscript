# @netscript/plugin-sagas

NetScript plugin for durable saga orchestration: service wiring, scaffolding, generated registry
ownership, runtime processes, Aspire resources, E2E probes, durable stream surfaces, and the HTTP
publisher SDK.

The saga DSL, runtime ports, state machine contracts, and native runtime implementation live in
`@netscript/plugin-sagas-core`. This package is the operational layer around that core: it
contributes the plugin manifest, starts service and background resources, generates runtime
registries, and exposes cross-service publishing tools for applications that talk to the sagas API.

## Install

```sh
deno add jsr:@netscript/plugin-sagas
```

Operational and runtime APIs live on focused subpaths so applications import only the layer they
need:

```ts
import { createSagaPublisher } from '@netscript/plugin-sagas/runtime';
import { SagasAspireContribution } from '@netscript/plugin-sagas/aspire';
import { SagasCli, StaticSagasCliBackend } from '@netscript/plugin-sagas/cli';
```

## Quick example

Application services that need to publish messages to the sagas API import the HTTP publisher SDK
from `@netscript/plugin-sagas/runtime`. The publisher accepts an injected `fetcher` so tests and
docs do not depend on a running sagas service; in application code, omit `fetcher` and let the
publisher resolve the Aspire service URL or the configured `baseUrl`.

```ts
import { createSagaPublisher } from '@netscript/plugin-sagas/runtime';
import type { SagaCorrelationKey } from '@netscript/plugin-sagas-core/domain';

const publisher = createSagaPublisher({
  baseUrl: 'http://127.0.0.1:8092',
  fetcher: async () =>
    new Response(JSON.stringify({
      published: true,
      messageType: 'orders.created',
      correlationKey: 'order:ord_123',
    })),
});

const correlationKey = 'order:ord_123' as SagaCorrelationKey;

const result = await publisher.publish({
  type: 'orders.created',
  payload: { orderId: 'ord_123' },
  correlationKey,
});

if (!result.published) {
  throw new Error(result.reason);
}
```

## What this package owns

- The typed `sagasPlugin` manifest and `inspectSagas` inspection helper.
- `ns-sagas` command metadata and local backends for registry generation, inspection, and codemods.
- Scaffolding for fluent saga definition modules and config-owned saga groups.
- The saga-owned runtime registry manifest in `scaffold.runtime.json`.
- E2E health and roundtrip gate definitions plus runnable HTTP probes.
- The Aspire contribution for `sagas-api` and `sagas-runner`.
- The plugin-layer HTTP publisher client, background runtime runner, and supervisor in `./runtime`.
- The V1 HTTP contract and service entrypoint in `./contracts` and `./services`.
- Browser and server stream entrypoints for saga instance state.

## Package boundary

Userland saga definitions import the DSL from `@netscript/plugin-sagas-core`, not from this plugin
package. Application services that publish messages to the sagas API import the HTTP SDK from
`@netscript/plugin-sagas/runtime`.

## Runtime processes

The Aspire contribution registers two resources:

- `sagas-api`: the HTTP API service on port `8092`.
- `sagas-runner`: the background runtime process that loads the generated static registry.

`sagas-runner` starts through `plugins/sagas/src/runtime/saga-runner.ts`. It resolves
`SAGAS_ADAPTER` and `SAGAS_REGISTRY_MODULE`, loads the generated registry module, registers the
definitions into a caller-owned runtime, and waits for platform-safe shutdown signals. The default
generated registry module is `.netscript/generated/plugin-sagas/sagas.registry.ts`; generate it
through the CLI or scaffolding runtime manifest before starting the runner.

## Subpaths

| Subpath            | Purpose                                      |
| ------------------ | -------------------------------------------- |
| `.`                | Curated plugin manifest exports.             |
| `./public`         | Manifest and inspection surface.             |
| `./plugin`         | Plugin package contribution aliases.         |
| `./cli`            | CLI command model and local project backend. |
| `./scaffolding`    | Saga definition/config scaffolders.          |
| `./e2e`            | Health and roundtrip gate definitions.       |
| `./aspire`         | Aspire resource contribution.                |
| `./runtime`        | HTTP publisher, runner, and supervisor.      |
| `./contracts`      | Versioned sagas API contract.                |
| `./services`       | Sagas API service entrypoint.                |
| `./streams`        | Browser-safe saga stream database factory.   |
| `./streams/server` | Server-side saga stream producer and mirror. |

Root exports stay small by design. T1 durability is the shipped default; T2 outbox, T3
history/replay, and runtime signal/query dispatch remain reserved for the later durability phase.

## Docs

- [API reference](https://rickylabs.github.io/netscript/reference/sagas/)
- [Concepts & guides](https://rickylabs.github.io/netscript/)
- [HTTP Publisher](./docs/http-publisher.md)
- [Runtime Processes](./docs/runtime-processes.md)
- [Scaffolding And Operations](./docs/scaffolding-and-operations.md)