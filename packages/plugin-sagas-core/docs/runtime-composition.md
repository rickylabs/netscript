# Runtime Composition

Runtime composition is explicit. A process injects optional ports, registers definitions, and starts
the runtime.

## Native Runtime

```ts
import { createSagaRuntime } from '@netscript/plugin-sagas-core/runtime';
import { orderSaga } from './sagas/order.ts';

const runtime = createSagaRuntime();

await runtime.register([orderSaga]);
await runtime.start();
```

The native runtime composes `SagaBusBridge` with `SagaEngine`. A scheduler and compensator can be
injected when the process owns those responsibilities.

## Preset Runtime

```ts
import { startSagas } from '@netscript/plugin-sagas-core/presets';
import { orderSaga } from './sagas/order.ts';

const started = await startSagas({
  definitions: [orderSaga],
});

await started.shutdown();
```

`startSagas()` is a convenience wrapper over `createSagaRuntime()`. It does not discover saga files
or own process lifecycle hooks. Long-running application processes should still own shutdown
behavior.

## Ports

The core runtime uses structural ports:

- `SagaBusPort` for runtime publication, registration, cascaded dispatch, signal, and query calls.
- `SagaTransportPort` for at-least-once message movement.
- `SagaStorePort` for T1 saga instance persistence.
- `SagaClockPort` for deterministic time.
- `SagaOutboxPort` for reserved T2 outbox durability.
- `SagaHistoryStorePort` for reserved T3 history.
- `SagaAgentRuntimePort` for the reserved AI-agent extension axis.

Ports are injected through runtime, adapter, middleware, testing, or plugin-layer composition. Do
not look them up through module-level globals.

## Middleware

The middleware subpath provides request-context integration without owning application state:

```ts
import { createSagaMiddleware } from '@netscript/plugin-sagas-core/middleware';

app.use('*', createSagaMiddleware({ bus: runtime.bus }));
```

SSE middleware accepts explicit event sinks and optional history writers. It does not use a hidden
KV, Prisma client, or process-wide registry.

## Telemetry

Telemetry is structural. The core package defines span names, metric names, attributes, and an
instrumentation facade that can wrap saga handlers and runtime events. It does not require a
concrete OpenTelemetry SDK dependency at the package boundary.

Inject the tracer and meter from the application or plugin package. That keeps instrumentation
portable across local tests, worker processes, and hosted deployments.

## Durability Tiers

Tier 1 is the Group E default. It covers saga state, transition records, correlation lookup, retry
classification, and deterministic clocks.

Tier 2 and Tier 3 are reserved through ports. The current package does not claim outbox relay,
cross-store exactly-once guarantees, or durable agent history runtime behavior.

## Lifecycle Rule

Runtime instances are ordinary values. Pass them through constructors, function arguments, request
contexts, or application containers. Avoid hidden registries because they break parallel tests,
multi-tenant workers, and adapter parity.
