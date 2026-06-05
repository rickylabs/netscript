# @netscript/plugin-sagas

NetScript plugin package for saga service wiring, scaffolding, generated registry ownership, runtime
processes, Aspire resources, E2E probes, and the HTTP publisher SDK.

The core saga DSL and runtime ports live in `@netscript/plugin-sagas-core`. This package is the
operational plugin layer around that core: it contributes the plugin manifest, starts service and
background resources, generates runtime registries, and exposes cross-service publishing tools.

## What This Package Owns

- The typed `sagasPlugin` manifest and plugin inspection helpers.
- `ns-sagas` command metadata and backends for registry generation, inspection, and codemods.
- Scaffolding for fluent saga definition modules and config-owned saga groups.
- The saga-owned runtime registry manifest in `scaffold.runtime.json`.
- E2E health and roundtrip gate definitions plus runnable HTTP probes.
- The Aspire contribution for `sagas-api` and `sagas-runner`.
- The plugin-layer HTTP publisher client in `./runtime`.
- The background runtime runner and supervisor process in `./runtime`.
- Legacy service and stream exports that are migrated by later Group E slices.

## Package Boundary

Userland saga definitions should import the DSL from `@netscript/plugin-sagas-core`, not from this
plugin package. Application services that need to publish messages to the sagas API may import the
HTTP SDK from `@netscript/plugin-sagas/runtime`.

```ts
import type { SagaCorrelationKey } from '@netscript/plugin-sagas-core/domain';
import { createSagaPublisher } from '@netscript/plugin-sagas/runtime';

const publisher = createSagaPublisher({
  baseUrl: 'http://127.0.0.1:8092',
});

const correlationKey = 'order:ord_123' as SagaCorrelationKey;

await publisher.publish({
  type: 'orders.created',
  payload: { orderId: 'ord_123' },
  correlationKey,
});
```

The example above shows the plugin boundary only. In application code, prefer a branded value
produced by your composition root.

## Runtime Processes

The Aspire contribution registers two resources:

- `sagas-api`: the HTTP API service on port `8092`.
- `sagas-runner`: the background runtime process that loads the generated static registry.

`sagas-runner` starts through `plugins/sagas/src/runtime/saga-runner.ts`. It resolves
`SAGAS_ADAPTER` and `SAGAS_REGISTRY_MODULE`, loads the generated registry module, registers the
definitions into a caller-owned runtime, and waits for platform-safe shutdown signals.

The default generated registry module is:

```text
.netscript/generated/plugin-sagas/saga-registry.ts
```

Generate it through the CLI or scaffolding runtime manifest before starting the runner.

## Subpaths

| Subpath         | Purpose                                      |
| --------------- | -------------------------------------------- |
| `.`             | Curated plugin manifest exports.             |
| `./public`      | Manifest and inspection surface.             |
| `./plugin`      | Plugin package contribution aliases.         |
| `./cli`         | CLI command model and local project backend. |
| `./scaffolding` | Saga definition/config scaffolders.          |
| `./e2e`         | Health and roundtrip gate definitions.       |
| `./aspire`      | Aspire resource contribution.                |
| `./runtime`     | HTTP publisher, runner, and supervisor.      |
| `./contracts`   | Versioned sagas API contract.                |
| `./services`    | Sagas API service entrypoint.                |

Root exports stay small by design. Runtime and operational APIs live on subpaths.

## Current Migration Notes

Group E keeps older service and stream imports on the legacy saga package until the locked consumer
migration slices remove them. New `src/` code in this plugin does not export upstream saga bus
package types, does not introduce saga bus or registry singletons, and uses composition-root owned
runtime instances.

T1 durability is the shipped default. T2 outbox, T3 history/replay, and runtime signal/query
dispatch remain reserved for the later durability phase.

## More Documentation

- [HTTP Publisher](./docs/http-publisher.md)
- [Runtime Processes](./docs/runtime-processes.md)
- [Scaffolding And Operations](./docs/scaffolding-and-operations.md)
