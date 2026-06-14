# Getting Started

Install `@netscript/fresh` through a Deno import map and import the subpath that matches the layer
you are building.

```json
{
  "imports": {
    "@netscript/fresh": "jsr:@netscript/fresh@^1.0.0"
  }
}
```

```ts
import { definePage } from '@netscript/fresh/builders';
import { defineRouteContract } from '@netscript/fresh/route';

const route = defineRouteContract().bind('/orders');

export const ordersPage = definePage()
  .withRoute(route)
  .withMeta(() => ({ title: 'Orders' }))
  .build();
```
