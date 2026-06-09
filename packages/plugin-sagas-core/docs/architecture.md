# Architecture

`@netscript/plugin-sagas-core` is an Archetype 3 Runtime/Behavior package. It owns the saga DSL,
state machine vocabulary, runtime lifecycle, transport and store ports, adapter implementations,
telemetry metadata, and testing fixtures consumed by NetScript saga-aware packages.

## Archetype

Doctrine archetype: **A3 Runtime/Behavior**. The package owns long-running saga execution with
correlated state, delivery through transports, scheduling, idempotency, compensation, and explicit
start/stop lifecycle. Its gate set therefore includes F-13 saga/runtime invariants, Runtime/Aspire
validation, and consumer-import validation.

## Boundary

The core package owns reusable saga definitions, contracts, runtime composition, ports, and
adapters. It does not own the `plugins/sagas` service process, plugin manifest, CLI verbs, scaffold
contributions, or generated database artifacts.

## Layers

- `domain/` contains pure saga definitions, states, identifiers, messages, retry policy, and errors.
- `builders/` contains the declarative `defineSaga`, `defineQuery`, and `defineSignal` DSL.
- `ports/` contains consumed contracts for bus, store, history, outbox, clock, transport, and agent
  runtime collaborators.
- `runtime/` owns lifecycle orchestration, scheduling, compensation, idempotency, and
  `createSagaRuntime(options)`.
- `adapters/` and `transports/` provide implementations behind the core ports.
- `middleware/` exposes request/runtime integration helpers without depending on concrete
  transports.
- `stores/` is a documented pass-through barrel for store implementers.
- `testing/` exposes memory-backed fixtures and clocks through the dedicated `./testing` subpath.

## State and Lifecycle

Saga instances are keyed by externally visible correlation ids. Definitions name phases and terminal
outcomes, handlers produce cascaded messages instead of calling transports directly, and runtime
execution flows through ports that accept cancellation where they perform asynchronous work.

```text
defined saga
  -> SagaEngine
      -> SagaStorePort
      -> SagaTransportPort
      -> SagaScheduler
      -> SagaCompensator
```

## Dependency Rules

The package can depend on upstream saga-bus, Redis, Hono, and sibling core packages only through
owned ports or explicit integration subpaths. It does not import `plugins/sagas`, and it does not
re-export third-party packages as public vendor surfaces.

## Extension

Callers extend the runtime by supplying port implementations, transport implementations, or
definition builders. Stub-only abstract contracts under `src/abstracts/` remain alpha extension
surfaces; concrete lifecycle behavior stays in runtime classes and composition roots.
