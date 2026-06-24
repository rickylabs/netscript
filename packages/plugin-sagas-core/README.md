# @netscript/plugin-sagas-core

[![JSR](https://jsr.io/badges/@netscript/plugin-sagas-core)](https://jsr.io/@netscript/plugin-sagas-core)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The saga-authoring core for NetScript: a fluent DSL for defining durable, multi-step workflows
plus the runtime ports, native engine, and deterministic testing primitives the
`@netscript/plugin-sagas` plugin composes into a host application.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/plugin-sagas-core

# Node.js / Bun
npx jsr add @netscript/plugin-sagas-core
bunx jsr add @netscript/plugin-sagas-core
```

### Usage

Author a saga with the fluent DSL, then drive it through the native runtime:

```typescript
import { defineSaga, sagaComplete, send } from '@netscript/plugin-sagas-core';
import { createSagaRuntime } from '@netscript/plugin-sagas-core/runtime';

type RegistrationState = { status: 'pending' | 'welcoming' | 'done' };
type UserRegistered = { userId: string; email: string };

const registrationSaga = defineSaga('user-registration')
  .state<RegistrationState>({ status: 'pending' })
  .on<'UserRegistered', UserRegistered>('UserRegistered', (saga, event) => {
    saga.state.status = 'welcoming';
    return [
      send('send-welcome-email', { email: event.payload.email }, {
        idempotencyKey: `welcome:${event.payload.userId}`,
      }),
    ];
  })
  .on('WelcomeEmailSent', (saga) => {
    saga.state.status = 'done';
    return [sagaComplete()];
  })
  .build();

const runtime = createSagaRuntime();
await runtime.register([registrationSaga]);
await runtime.start();
```

---

## 📦 Key Capabilities

- **Fluent saga DSL**: `defineSaga(id).state().on().build()` produces a frozen `SagaDefinition`;
  cascaded effects are returned from handlers via `send`, `schedule`, `spawn`, `sagaComplete`,
  `sagaFail`, and `sagaCompensate`.
- **Composition-root runtime**: `createSagaRuntime()` wires the native engine, scheduler, and
  compensator with no global bus or registry singletons — applications inject their own store,
  transport, and clock ports.
- **At-least-once delivery**: idempotency keys reserve a message target before delivery and record
  applied `(instanceId, key)` pairs, so duplicate messages return `alreadyApplied` instead of
  re-running handler effects.
- **Pluggable runtime ports**: `SagaStorePort`, `SagaBusPort`, `SagaClockPort`,
  `SagaIdempotencyPort`, and `SagaAppliedKeyStore` are the durability seams — swap the in-memory
  defaults for durable backends in production.
- **Deterministic testing surface**: the `./testing` subpath ships in-memory stores, a controllable
  clock, and a runtime helper for unit-testing saga logic without external infrastructure.

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/sagas/](https://rickylabs.github.io/netscript/reference/sagas/)
  — the sagas family reference; this core package is documented in its Internals section.
- **Durable Workflows**:
  [rickylabs.github.io/netscript/durable-workflows/](https://rickylabs.github.io/netscript/durable-workflows/)
  — the capability pillar covering sagas, durability, retries, and DLQ behavior.
- **Checkout saga tutorial**:
  [rickylabs.github.io/netscript/tutorials/storefront/04-checkout-saga/](https://rickylabs.github.io/netscript/tutorials/storefront/04-checkout-saga/)
  — build a multi-step saga end to end.

---

## 📝 License

MIT — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
