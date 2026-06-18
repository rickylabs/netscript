# @netscript/sdk

Service discovery, oRPC clients, and cache-backed query factories for NetScript applications.

## Install

```sh
deno add jsr:@netscript/sdk
```

Focused subpath imports are available when you only need part of the surface:

```ts
import { createServiceClient } from '@netscript/sdk/client';
import { createQueryFactories } from '@netscript/sdk/query';
import { createNetScriptQueryClient } from '@netscript/sdk/query-client';
```

```json
{
  "service": "orders"
}
```

## Quick example

Compose typed clients, server-side query factories, and TanStack Query utilities from a single
contract map with the `defineServices()` preset:

```ts
import { defineServices } from '@netscript/sdk';
import { ordersContract } from './contracts/orders.ts';

const { clients, queries, queryUtils } = defineServices({
  orders: { contract: ordersContract },
});

// Direct oRPC call through the typed service client.
const order = await clients.orders.get({ id: '123' });

// Cache-aware query factory for server or framework-neutral code.
const orderQuery = queries.orders;

// TanStack Query utilities for frontend / island consumers.
const ordersQueryUtils = queryUtils.orders;
```

Each service entry defaults its `serviceName` and `queryPath` to the map key, so the one-liner above
wires discovery, clients, and queries together. Drop to a focused subpath (`@netscript/sdk/client`,
`@netscript/sdk/query`, `@netscript/sdk/query-client`) when an app only needs part of the surface.

## Docs

- [API reference](https://rickylabs.github.io/netscript/reference/sdk/)
- [Concepts & guides](https://rickylabs.github.io/netscript/)
