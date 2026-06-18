# @netscript/plugin-sagas-core

Saga DSL, runtime ports, adapters, telemetry, configuration, and testing primitives for NetScript saga plugins.

## Install

```sh
deno add jsr:@netscript/plugin-sagas-core
```

## Quick example

Define a saga with the fluent builder and emit cascaded messages from handlers:

```ts
import { defineSaga, sagaComplete } from '@netscript/plugin-sagas-core';

const orderSaga = defineSaga('order')
  .state({ paid: false })
  .on('order.paid', (saga) => {
    saga.state.paid = true;
    return sagaComplete({ orderId: saga.id });
  })
  .build();
```

`defineSaga(id).state().on().build()` is the userland authoring chain. Pair it with
`defineSignal()` / `defineQuery()` for reserved signal and query definitions, and the cascaded
message constructors `send()`, `schedule()`, `spawn()`, `sagaComplete()`, `sagaFail()`, and
`sagaCompensate()` to express handler side-effects.

## Docs

- [API reference](https://rickylabs.github.io/netscript/reference/plugin-sagas/)
- [Concepts & guides](https://rickylabs.github.io/netscript/)
