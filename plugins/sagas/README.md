# @netscript/plugin-sagas

NetScript plugin package for saga service wiring, scaffolding, generated registry ownership, runtime
processes, Aspire resources, E2E probes, durable stream surfaces, and the HTTP publisher SDK.

The saga DSL, runtime ports, state machine contracts, and native runtime implementation live in
`@netscript/plugin-sagas-core`. This package is the operational layer around that core. It
contributes the plugin manifest, starts service and background resources, generates runtime
registries, and exposes cross-service publishing tools for applications that need to talk to the
sagas API.

## What This Package Owns

- The typed `sagasPlugin` manifest and plugin inspection helpers.
- `ns-sagas` command metadata and local backends for registry generation, inspection, and codemods.
- Scaffolding for fluent saga definition modules and config-owned saga groups.
- The saga-owned runtime registry manifest in `scaffold.runtime.json`.
- E2E health and roundtrip gate definitions plus runnable HTTP probes.
- The Aspire contribution for `sagas-api` and `sagas-runner`.
- The plugin-layer HTTP publisher client in `./runtime`.
- The background runtime runner and supervisor process in `./runtime`.
- The V1 HTTP contract and service entrypoint in `./contracts` and `./services`.
- Browser and server stream entrypoints for saga instance state.

## Package Boundary

Userland saga definitions import the DSL from `@netscript/plugin-sagas-core`, not from this plugin
package. Application services that need to publish messages to the sagas API import the HTTP SDK
from `@netscript/plugin-sagas/runtime`.

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

The publisher example uses an injected `fetcher` so tests and docs do not depend on a running sagas
service. In application code, omit `fetcher` and let the publisher resolve the Aspire service URL or
the configured `baseUrl`.

## Runtime Processes

The Aspire contribution registers two resources:

- `sagas-api`: the HTTP API service on port `8092`.
- `sagas-runner`: the background runtime process that loads the generated static registry.

`sagas-runner` starts through `plugins/sagas/src/runtime/saga-runner.ts`. It resolves
`SAGAS_ADAPTER` and `SAGAS_REGISTRY_MODULE`, loads the generated registry module, registers the
definitions into a caller-owned runtime, and waits for platform-safe shutdown signals.

The default generated registry module is:

```text
.netscript/generated/plugin-sagas/sagas.registry.ts
```

Generate it through the CLI or scaffolding runtime manifest before starting the runner.

```ts
import { SagaRuntimeSupervisor } from '@netscript/plugin-sagas/runtime';
import type { SagaRuntime } from '@netscript/plugin-sagas/runtime';

const supervisor = new SagaRuntimeSupervisor({
  definitions: [],
  createRuntime: () => ({
    adapter: 'native',
    bus: {},
    register: async () => {},
    start: async () => {},
    stop: async () => {},
    publish: async () => ({}),
    dispatchCascaded: async () => ({}),
    signal: async () => ({}),
    query: async () => ({}),
  } as unknown as SagaRuntime),
});

const snapshot = await supervisor.start();
if (snapshot.status !== 'running') {
  throw new Error(`Unexpected status: ${snapshot.status}`);
}
await supervisor.stop();
```

## CLI And Scaffolding

The `./cli` subpath provides command metadata and a local project backend. Hosts mount these
commands under their own CLI shell instead of asking this package to own process-level command
parsing.

```ts
import { SagasCli, StaticSagasCliBackend } from '@netscript/plugin-sagas/cli';

const cli = new SagasCli(new StaticSagasCliBackend());
const names = cli.commands().map((command) => command.name);

if (!names.includes('generate-registry')) {
  throw new Error('registry command is required');
}
```

The `./scaffolding` subpath contributes saga definition and saga config scaffolders. They generate
source for projects, while the actual runtime DSL remains in `@netscript/plugin-sagas-core`.

```ts
import { SagaDefinitionScaffolder } from '@netscript/plugin-sagas/scaffolding';

const scaffolder = new SagaDefinitionScaffolder();
const source = await scaffolder.generate({
  id: 'orders-created',
  messageType: 'orders.created',
});

if (!source.includes('orders.created')) {
  throw new Error('expected message type in generated source');
}
```

## Aspire Contribution

The `./aspire` subpath exposes `SagasAspireContribution`, a structural contribution that registers
the API and runner resources with a host AppHost builder.

```ts
import { SagasAspireContribution } from '@netscript/plugin-sagas/aspire';

const contribution = new SagasAspireContribution();
const resources = contribution.contribute({
  addDenoService: (name) => ({ name, kind: 'service' }),
  addDenoBackground: (name) => ({ name, kind: 'background' }),
}, {
  projectRoot: Deno.cwd(),
  port: (_key, fallback = 0) => fallback,
});

if (resources.length !== 2) {
  throw new Error('sagas contribution should register two resources');
}
```

## Streams

The `./streams` subpath is browser-safe and creates a StreamDB for saga instances. The
`./streams/server` subpath is server-only and mirrors existing saga state into durable streams.

Use the stream DB from browser or Fresh islands when a UI needs live saga instance state. Use the
server mirror only inside the sagas service process, because it expects a Prisma-like database
client and writes to the durable streams producer.

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

Root exports stay small by design. Runtime and operational APIs live on subpaths so applications can
import only the layer they need.

## Current Migration Notes

Group E keeps older service and stream imports available until locked consumer migration slices
remove them. New `src/` code in this plugin does not export upstream saga bus package types, does
not introduce saga bus or registry singletons, and uses composition-root owned runtime instances.

T1 durability is the shipped default. T2 outbox, T3 history/replay, and runtime signal/query
dispatch remain reserved for the later durability phase.

## More Documentation

- [HTTP Publisher](./docs/http-publisher.md)
- [Runtime Processes](./docs/runtime-processes.md)
- [Scaffolding And Operations](./docs/scaffolding-and-operations.md)
