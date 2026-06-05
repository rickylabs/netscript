# Testing

The `./testing` subpath provides deterministic primitives for saga unit tests and runtime
composition tests. The helpers avoid global state and keep all captured data available through
explicit values.

## Runtime Helper

```ts
import { createTestSagaRuntime, MemorySagaStore } from '@netscript/plugin-sagas-core/testing';
import { orderSaga } from './order-saga.ts';

const testRuntime = createTestSagaRuntime({
  store: new MemorySagaStore(),
});

await testRuntime.register([orderSaga]);
await testRuntime.publish({
  type: 'OrderPaid',
  payload: { orderId: 'order-1' },
});
```

Use the returned runtime, bus, clock, and store directly in assertions. Do not rely on a
process-wide registry between tests.

## Stores

`MemorySagaStore` implements `SagaStorePort` for in-memory state, transition, and correlation tests.
`RecordingSagaStore` wraps another store and records interactions. Use the recording wrapper when
the test needs to prove persistence behavior rather than only final state.

## Bus

`MemorySagaBus` implements `SagaBusPort` for local handler tests. It keeps signal and query behavior
aligned with the current runtime scope: those calls throw `SagasError.notImplemented()` until Phase
7d.

## Clock

`TestSagaClock` makes scheduled behavior deterministic. Advance the clock explicitly in tests
instead of waiting for wall-clock time.

## Recommended Test Shape

- Build saga definitions with the same fluent DSL used by production code.
- Inject memory stores, buses, and clocks through the helper.
- Assert emitted messages and store writes at the port boundary.
- Use deterministic idempotency and concurrency keys in fixtures.
- Keep plugin-layer process wiring out of core package tests.

These constraints keep tests parallelizable and make adapter parity checks possible later in the
Group E plan.
