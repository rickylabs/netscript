# HTTP Publisher

The HTTP publisher is the service-to-saga SDK for application services. It implements the
`SagaPublisherPort` from `@netscript/plugin-sagas-core/integration/publisher` and keeps HTTP,
service discovery, and environment access out of the core package.

## Import

```ts
import { createSagaPublisher } from '@netscript/plugin-sagas/runtime';
```

The publisher is intentionally on the plugin runtime subpath. Userland saga definitions should keep
using the core DSL package.

## Default Endpoint

The default publish path is:

```text
/api/v1/sagas/publish
```

The client resolves a base URL in this order:

1. Explicit `baseUrl` option.
2. Aspire HTTPS service variable for `sagas-api`.
3. Aspire HTTP service variable for `sagas-api`.
4. `SAGAS_API_URL`.
5. `NETSCRIPT_SAGAS_URL`.
6. Local fallback `http://127.0.0.1:8092`.

Both `fetch` and environment lookup are injectable. Tests should pass a `fetcher` and `readEnv`
instead of touching process state.

## Single Publish

```ts
import type { SagaCorrelationKey } from '@netscript/plugin-sagas-core/domain';
import { createSagaPublisher } from '@netscript/plugin-sagas/runtime';

const publisher = createSagaPublisher({
  baseUrl: 'http://127.0.0.1:8092',
});

const correlationKey = 'order:ord_123' as SagaCorrelationKey;

const result = await publisher.publish({
  type: 'orders.created',
  payload: {
    orderId: 'ord_123',
    total: 42,
  },
  correlationKey,
  idempotencyKey: 'orders.created:ord_123',
});

if (!result.published) {
  throw new Error(result.reason);
}
```

The result is a typed accepted or rejected receipt. HTTP failures, network failures, invalid payload
values, and API-level rejections are reported as rejected receipts rather than hidden global state.

## Batch Publish

`publishMany()` is sequential by default:

```ts
await publisher.publishMany([
  { type: 'orders.created', payload: { orderId: 'ord_1' } },
  { type: 'orders.created', payload: { orderId: 'ord_2' } },
]);
```

Use explicit parallel mode only when ordering does not matter:

```ts
await publisher.publishMany(messages, {
  mode: 'parallel',
  traceparent,
});
```

Trace context is copied into the request body and into HTTP headers.

## Payload Rules

The publisher normalizes payloads into JSON objects accepted by the sagas API contract. Object
payloads are sent as-is after JSON validation. Primitive payloads are wrapped as `{ value }`. `Date`
values become ISO strings. Unsupported values fail validation and return a rejected receipt.

This keeps the plugin boundary explicit: the API receives JSON, while TypeScript services can still
work with typed domain objects before publishing.
