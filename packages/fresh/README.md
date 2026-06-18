# @netscript/fresh

Page builders, typed route contracts, form helpers, durable-stream and query islands, and deferred
rendering primitives for Fresh applications in the NetScript ecosystem.

## Install

```sh
deno add jsr:@netscript/fresh
```

Focused subpath imports give you only the layer you need:

```ts
import { definePage } from '@netscript/fresh/builders';
import { defineRouteContract, paginationSearchSchema } from '@netscript/fresh/route';
import { defineFreshApp } from '@netscript/fresh/server';
```

`@netscript/fresh` is Deno-first and built for Fresh 2. Type-checking entrypoints should include
`--unstable-kv`, since the streaming server helpers expose KV-aware types.

## Quick example

Define a page with a typed, paginated route contract:

```ts
import { definePage } from '@netscript/fresh/builders';
import { defineRouteContract, paginationSearchSchema } from '@netscript/fresh/route';

const ordersRoute = defineRouteContract({
  searchSchema: paginationSearchSchema({
    defaultLimit: 20,
    defaultSort: 'createdAt',
    defaultOrder: 'desc',
  }),
});

export const ordersPage = definePage()
  .withRoute(ordersRoute)
  .withMeta(() => ({
    title: 'Orders',
    description: 'Browse the current order queue.',
  }))
  .build();
```

The package is subpath-first: `builders` and `route` define page and route intent, `form` handles
form state and error normalization, `query` and `streams` power islands, `defer` provides
suspense-style deferred rendering, and `server` bootstraps the Fresh app with `defineFreshApp()`.

## Docs

- [API reference](https://rickylabs.github.io/netscript/reference/fresh/)
- [Concepts & guides](https://rickylabs.github.io/netscript/)
- [Fresh documentation](https://fresh.deno.dev/docs/)
