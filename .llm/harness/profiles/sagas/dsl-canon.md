# Sagas — DSL Canon

> **Purpose.** Resolve the dual-canon conflict identified in the evaluator
> (`evaluate.md` finding F-3): the previous plan locked **both**
> `createSagaDefinition(flatSpec)` and `defineSaga(id).chain().build()` as
> "the userland DSL". That is two DSLs. Userland authors will not know which
> to use. This document picks one.
>
> **Decision.** **Fluent chain wins.** `defineSaga(id)...build()` is the
> single userland DSL. `createSagaDefinition(spec)` is **internal** —
> referenced only by `.build()` and by tests via `runSaga()`.

## 1. Why the fluent chain

| Property | Fluent chain | Flat spec |
|---|---|---|
| Lifecycle is lexically visible | ✓ (`.state().on().compensate().build()`) | ✗ (hash-shaped object) |
| TypeScript inference flows from prior step | ✓ (typestate) | partial (only via mapped types) |
| Encourages step ordering | ✓ (`build()` last) | ✗ |
| Familiar to NetScript users | ✓ (matches `defineWorker`, Fresh DSL) | ✗ |
| Matches Wolverine + Voltagent workflow DSL conventions | ✓ | ✗ |
| Easier to extend (new `.method()` is a new builder return type) | ✓ | requires schema reshuffle |
| Composable: chain may be intercepted by middleware | ✓ | ✗ |

The flat-spec form remains valuable as the **internal value** that the
runtime consumes — it just is not the user surface.

## 2. The canon

### 2.1 Public surface (`@netscript/plugin-sagas-core`)

| Symbol | Purpose | Notes |
|---|---|---|
| `defineSaga<TId>(id)` | Entry point for the userland chain. Returns `SagaBuilder<TId, TState=never, TEvents=never>`. | Typestate marker `TState=never` means `.state()` *must* be called next |
| `.state(initial)` | Locks state shape. Returns `SagaBuilder<TId, TState, never>`. | Required exactly once before `.on()` |
| `.correlate<TEvent>(fn)` | Specifies correlation key extractor. Optional; default uses `event.sagaId`. | |
| `.durability(tier)` | `'t1' \| 't2' \| 't3'` — see `architecture.md` §3 | Default `'t1'` |
| `.concurrency({ limit, key? })` | Bounded parallelism, optionally per-key (Trigger.dev concurrency key) | Optional |
| `.on(eventType, handler)` | Handler `(saga, event, ctx) => CascadedMessage[]`. May be called many times. | At least one required |
| `.onSignal(signal, handler)` | Out-of-band command, async permitted, may mutate state | Reserved 7a, runtime 7d |
| `.onQuery(query, handler)` | Out-of-band read, **must be synchronous**, **must NOT mutate state** | Reserved 7a, runtime 7d |
| `.compensate(eventType, handler)` | Compensation handler — same signature as `.on()`, semantically tagged as compensation | |
| `.middleware(mw)` | Saga-scoped middleware (composes with global middleware) | Optional |
| `.schedule(cron)` | For cron-triggered sagas, e.g. `'0 9 * * *'` | Optional; mutually exclusive with the explicit topic-driven mode |
| `.build()` | Returns frozen `SagaDefinition<TId, TState, TEvents>` | Required terminal step |

### 2.2 Cascaded-message constructors (also public)

```ts
import {
  send, schedule, spawn,
  sagaComplete, sagaFail, sagaCompensate,
} from '@netscript/plugin-sagas-core';
```

| Constructor | Returns | Notes |
|---|---|---|
| `send(target, payload, opts?)` | `CascadedMessage` of kind `'send'` | `opts.idempotencyKey?`, `opts.retry?`, `opts.queue?`, `opts.concurrencyKey?` |
| `schedule(message, delay)` | `CascadedMessage` of kind `'scheduled'` | `delay` accepts `'5m'` / `Date` / `Duration` |
| `spawn(childSaga, input, opts?)` | `CascadedMessage` of kind `'spawn'` | Child-saga isolation boundary |
| `sagaComplete(result?)` | terminal `'complete'` | Removes saga instance from persistence |
| `sagaFail(reason)` | terminal `'fail'` | Triggers compensation cascade |
| `sagaCompensate(message)` | `'compensate'` | Tags message as compensation for telemetry |

### 2.3 Signal & query definitions

```ts
import { defineSignal, defineQuery } from '@netscript/plugin-sagas-core';

export const cancelSignal = defineSignal<{ reason: string }>('cancel');
export const statusQuery = defineQuery<{ status: string }>('status');
```

The constraint from Temporal applies: **query handlers must be synchronous
and must not mutate state.** The chain builder enforces this via overloaded
signatures:

```ts
.onQuery<TResult>(q: QueryDefinition<TResult>, handler: (saga) => TResult): SagaBuilder<...>
// note: handler is non-async; the type signature returns TResult, not Promise<TResult>
```

## 3. The canonical example

```ts
// sagas/user-registration-saga.ts
import {
  defineSaga, defineSignal, defineQuery,
  send, schedule, sagaComplete, sagaFail,
} from '@netscript/plugin-sagas-core';
import { sendWelcomeEmail, releaseInventory } from '../workers/jobs/mod.ts';

export const cancelSignal = defineSignal<{ reason: string }>('cancel');
export const statusQuery = defineQuery<{ status: string }>('status');

export default defineSaga('user-registration')
  .durability('t1')
  .state({ status: 'pending' as const, email: '' })
  .correlate<UserRegistered>(event => event.userId)
  .concurrency({ limit: 5, key: msg => msg.tenantId })
  .on('UserRegistered', (saga, event) => {
    saga.state.email = event.email;
    saga.state.status = 'welcoming';
    return [
      send(sendWelcomeEmail, { email: event.email }, {
        idempotencyKey: `welcome:${event.userId}`,
        retry: {
          initialInterval: '1s',
          backoffCoefficient: 2,
          maximumAttempts: 5,
          nonRetryableErrorTypes: ['InvalidEmailError'],
        },
      }),
      schedule({ type: 'WelcomeTimeout', userId: event.userId }, '5m'),
    ];
  })
  .on('WelcomeEmailSent', (saga) => {
    saga.state.status = 'completed';
    return [sagaComplete()];
  })
  .on('WelcomeTimeout', (saga) => {
    saga.state.status = 'failed';
    return [sagaFail('welcome timeout')];
  })
  .compensate('PaymentFailed', (saga) => {
    saga.state.status = 'compensating';
    return [send(releaseInventory, { userId: saga.state.userId })];
  })
  .onSignal(cancelSignal, (saga, payload) => {
    saga.state.status = 'cancelled';
    return [sagaFail(`cancelled: ${payload.reason}`)];
  })
  .onQuery(statusQuery, (saga) => ({ status: saga.state.status }))
  .build();
```

This compiles to a single frozen `SagaDefinition` value. No I/O. No
side-effects. The walker discovers it by `export default`.

## 4. Anti-patterns specific to the DSL

| Anti-pattern | Smell | Fix |
|---|---|---|
| **AP-SAGA-1** | Calling `.build()` before any `.on()` | Builder typestate enforces — compile error |
| **AP-SAGA-2** | Defining handler logic outside the chain ("helpers") | Move helpers into separate jobs (workers) invoked via `send()` |
| **AP-SAGA-3** | Mutating state inside `.onQuery()` handler | Type signature forbids; lint also checks for assignment expressions in `onQuery` callbacks |
| **AP-SAGA-4** | Returning a Promise from `.on()` | Handlers are **synchronous projection** of `(state, event) → cascaded`. Async work happens in cascaded jobs, not in the handler. |
| **AP-SAGA-5** | Skipping `idempotencyKey` on `send()` | Lint warns; production runs reject `send()` without `idempotencyKey` on T2/T3 sagas |
| **AP-SAGA-6** | Calling Deno APIs (`fetch`, `Deno.env`, `Deno.kv`) inside `.on()` | Handlers are pure. Side effects belong in jobs. F-9 (permissions) check catches the `Deno.*` call. |
| **AP-SAGA-7** | `defineSaga(id)` where `id` is dynamic | `id` must be a string literal — required by the walker's static discovery |

## 5. Migration note

Sagas authored against the **previous** `createTypedSaga()` API from
`@saga-bus/core` are syntactically very close to the canon. The migration is
mostly an import swap and a renaming of `.given/.when/.then` style methods
to `.state/.on/.build`. See `migration-strategy.md` §4 for the codemod.

## 6. Why NOT decorator-style (`@OnEvent`)

We considered Voltagent-style decorators on a saga class. Rejected:

- Decorators are still a stage-3 proposal in TypeScript; behavior varies
  between Deno and Node.
- The plain-value DSL has stronger discoverability for the walker (it does
  not need to instantiate the class to read the definition).
- Composition root + frozen values is the doctrine norm.

## 7. Test helper

```ts
import { runSaga } from '@netscript/plugin-sagas-core/testing';

const result = runSaga(
  userRegistrationSaga,
  { status: 'pending', email: '' },
  { type: 'UserRegistered', userId: 'u1', email: 'a@b' },
);

assertEquals(result.state.status, 'welcoming');
assertEquals(result.cascaded.length, 2);
assertEquals(result.cascaded[0].kind, 'send');
assertEquals(result.cascaded[0].idempotencyKey, 'welcome:u1');
```

`runSaga()` is the deterministic, no-runtime tester. It accepts the frozen
definition, an initial state, and an event, and returns `(state',
cascaded[])` — the Wolverine property in NetScript form.
