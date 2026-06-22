# @netscript/plugin-sagas-core

Core saga authoring, runtime-port, adapter, telemetry, contract, and testing primitives for the
NetScript sagas plugin family.

This package is intentionally framework-layer code. It owns types and composition boundaries that
can be reused by the plugin package, applications, tests, and future extension packages without
importing or re-exporting `@saga-bus/*` symbols.

## Install

```sh
deno add jsr:@netscript/plugin-sagas-core
```

## What This Package Owns

- The userland saga DSL: `defineSaga(id).state().on().build()`.
- Reserved signal and query definition builders: `defineSignal()` and `defineQuery()`.
- Cascaded message constructors: `send()`, `schedule()`, `spawn()`, `sagaComplete()`, `sagaFail()`,
  and `sagaCompensate()`.
- Domain vocabulary for saga IDs, states, messages, transitions, retry policy, and errors.
- Runtime ports for bus, transport, store, clock, outbox, history, and agent-runtime boundaries.
- Native and legacy bus adapters behind `SagaBusPort`.
- Transport implementations for Redis Streams and Garnet-compatible LIST queues.
- Hono/SSE middleware, worker trigger helpers, publisher ports, oRPC contracts, streams schema,
  telemetry instrumentation, deterministic testing helpers, and stub-only abstract bases.

The plugin package (`@netscript/plugin-sagas`) owns CLI wiring, scaffolding, application
integration, runtime processes, Aspire contribution, HTTP publisher clients, and generated project
files.

## Root Surface

The root barrel is deliberately small and user-facing:

```ts
import {
  defineQuery,
  defineSaga,
  defineSignal,
  sagaComplete,
  schedule,
  send,
  spawn,
} from '@netscript/plugin-sagas-core';
```

Everything else is available through named subpaths. This keeps the root export count under the
NetScript budget and prevents internal adapter, transport, and contract types from becoming ambient
userland API.

## Quick example

```ts
import { defineSaga, sagaComplete, send } from '@netscript/plugin-sagas-core';

type RegistrationState = {
  status: 'pending' | 'welcoming' | 'done';
};

type UserRegisteredPayload = {
  userId: string;
  email: string;
};

export const registrationSaga = defineSaga('user-registration')
  .state<RegistrationState>({ status: 'pending' })
  .on<'UserRegistered', UserRegisteredPayload>('UserRegistered', (saga, event) => {
    saga.state.status = 'welcoming';

    return [
      send('send-welcome-email', { email: event.payload.email }, {
        idempotencyKey: `welcome:${event.payload.userId}`,
        concurrencyKey: `user:${event.payload.userId}`,
      }),
    ];
  })
  .on('WelcomeEmailSent', (saga) => {
    saga.state.status = 'done';
    return [sagaComplete()];
  })
  .build();
```

The public authoring path is the fluent chain only. There is no public flat saga specification
factory. The internal definition value produced by `.build()` is frozen and should be treated as a
runtime artifact, not as a mutable authoring object.

## Runtime Composition

Runtime state is always owned by an explicit composition root:

```ts
import { createSagaRuntime } from '@netscript/plugin-sagas-core/runtime';
import { registrationSaga } from './registration-saga.ts';

const runtime = createSagaRuntime();

await runtime.register([registrationSaga]);
await runtime.start();
```

`createSagaRuntime()` defaults to the native adapter. The legacy adapter is available only through
an explicit option:

```ts
const legacyRuntime = createSagaRuntime({ adapter: 'legacy' });
```

There are no saga bus or registry singletons. Do not add `getSagaBus`, `setSagaBus`, `resetSagaBus`,
`getSagaRegistry`, or `resetSagaRegistry`. Applications should pass the runtime, bus, store,
transport, clock, and instrumentation dependencies through their own composition root.

## Preset Startup

The `./presets` subpath contains the thin startup helper used by distributed handler processes:

```ts
import { startSagas } from '@netscript/plugin-sagas-core/presets';
import { registrationSaga } from './registration-saga.ts';

const started = await startSagas({
  definitions: [registrationSaga],
});

await started.shutdown();
```

The preset does not discover files, inspect registries, install process signal handlers, or read
environment variables. It is a small wrapper over `createSagaRuntime()` and explicit definitions.

## Subpaths

| Subpath                   | Role                                                               |
| ------------------------- | ------------------------------------------------------------------ |
| `.`                       | Curated root DSL and cascaded message constructors                 |
| `./builders`              | Userland builder types and reserved signal/query builders          |
| `./domain`                | Branded IDs, saga state/message/context/result/error vocabulary    |
| `./ports`                 | Runtime, persistence, transport, durability, and agent boundaries  |
| `./runtime`               | Native engine, scheduler, compensator, and runtime facade          |
| `./adapters`              | Native `SagaBusBridge` and deprecated `SagaBusLegacy` wrapper      |
| `./transports`            | Redis Streams and Garnet-compatible LIST transports                |
| `./middleware`            | Hono request context and SSE event middleware                      |
| `./integration/workers`   | Branded worker job/task trigger helpers                            |
| `./integration/publisher` | Publisher port for plugin-layer HTTP clients                       |
| `./telemetry`             | Structural tracing/metrics instrumentation facade                  |
| `./config`                | Config-time `defineSagaConfig(id, entrypoint)` builder and schemas |
| `./contracts/v1`          | Versioned oRPC/Zod contract surface                                |
| `./streams`               | Saga instance stream schema                                        |
| `./presets`               | `startSagas()` and `startSagaHandlers()` composition helpers       |
| `./abstracts`             | Stub-only bases for named extension axes                           |
| `./testing`               | Deterministic in-memory stores, bus, clock, and runtime helper     |
| `./agent`                 | Reserved future AI-agent surface                                   |

## Durability Scope

Group E provides Tier 1 runtime primitives: durable saga state and transition vocabulary, explicit
store ports, and injected clocks/transports. Tier 2 outbox and Tier 3 history/agent durability are
reserved as ports in this package and implemented in later phases.

Signal/query dispatch is also reserved. `defineSignal()`, `defineQuery()`, `.onSignal()`, and
`.onQuery()` exist so userland code can stabilize around the public surface, but runtime dispatch
throws `SagasError.notImplemented()` until Phase 7d.

## Delivery Guarantees

The native saga runtime is at-least-once with idempotency keys. Publishers should supply an
`idempotencyKey` for retried messages and cascaded sends. The bus bridge reserves the message target
and key before delivery, and the engine records an applied `(instanceId, idempotencyKey)` before
handler effects run.

Duplicate messages are not runtime failures. A duplicate applied key returns `alreadyApplied: true`
from the engine result, skips the handler, and does not persist another transition. The default
memory stores are real process-local implementations for tests and single-process development;
production composition roots must inject durable `SagaIdempotencyPort` and `SagaAppliedKeyStore`
implementations.

## Docs

- [Authoring](./docs/authoring.md)
- [Runtime Composition](./docs/runtime-composition.md)
- [Extension Axes](./docs/extension-axes.md)
- [Testing](./docs/testing.md)
