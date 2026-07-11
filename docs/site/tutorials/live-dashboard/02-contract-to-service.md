---
layout: layouts/base.vto
title: A typed read-model service
templateEngine: [vento, md]
prev: { label: "1 · Scaffold", href: "/tutorials/live-dashboard/01-scaffold/" }
next: { label: "3 · Cache-first query", href: "/tutorials/live-dashboard/03-sdk-cache-first-query/" }
---

# A typed read-model service

In chapter 1 you scaffolded `my-dashboard/` and booted it under Aspire. Now you will shape the data
the dashboard reads: an `orders` oRPC contract with a typed `list` procedure, served by
`defineService`. The contract is the single source of truth — the same schema locks the types for
the server handler and, later, for the Fresh client.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/live-dashboard/01-scaffold/" },
  { label: "2 · Contract to service", href: "/tutorials/live-dashboard/02-contract-to-service/" },
  { label: "3 · Cache-first query", href: "/tutorials/live-dashboard/03-sdk-cache-first-query/" },
  { label: "4 · definePage + island", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" },
  { label: "5 · Live stream", href: "/tutorials/live-dashboard/05-live-stream/" },
  { label: "6 · Deploy", href: "/tutorials/live-dashboard/06-deploy/" }
] }) }}

## What you will build

An `orders.list` procedure: a `GET` route that takes pagination plus a `status` filter and returns a
typed page of orders. The `status` filter is not decoration — it is the lens an operations queue
lives in: `pending` and `processing` are the work to do, `failed` is the money at risk, `cancelled`
is the ship-it-and-regret-it pile. You will read the scaffolded contract, understand the
`.route().input().output()` shape, and serve it on port **3002** with `defineService`. This is the
read-model every later chapter consumes — the rows that will eventually update live in the browser.

## Before you begin

You should have completed [chapter 1](/tutorials/live-dashboard/01-scaffold/): `my-dashboard/` on
disk and `aspire start` up. Confirm the `orders` service is reachable before you change anything — in a
second terminal:

```sh
curl http://localhost:3002/health
```

A healthy JSON response means the scaffolded `orders` service is live on **3002** and ready to read.

## Step 1 — Read the orders contract

Contracts are the typed seam between your service and every client. They live in `contracts/`,
versioned under `versions/v1/`, and are built from [`@orpc/contract`](/explanation/contracts/) routes
plus [Zod](https://zod.dev) schemas. Open `contracts/versions/v1/orders.contract.ts`. The dashboard
only needs the read path, so focus on the `list` procedure:

```ts
// contracts/versions/v1/orders.contract.ts (the read path the dashboard uses)
import { z } from 'zod';
import { baseContract } from '../../shared.ts';

// The order status the dashboard table colours its badges by.
export const OrderStatusSchema = z.enum([
  'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'failed',
]);

// One order row, as the API returns it.
export const OrdersSchemaV1 = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  status: OrderStatusSchema,
  total: z.number().nonnegative(),
  shippingCity: z.string(),
  shippingCountry: z.string(),
  createdAt: z.string().datetime(),
});

export const ordersContract = {
  list: baseContract
    .route({ method: 'GET' })
    .input(z.object({
      limit: z.number().int().positive(),
      offset: z.number().int().nonnegative(),
      status: OrderStatusSchema.optional(),
    }))
    .output(z.object({
      items: z.array(OrdersSchemaV1),
      total: z.number().int().nonnegative(),
      limit: z.number().int().positive(),
      offset: z.number().int().nonnegative(),
      hasMore: z.boolean(),
    })),
};
```

The pattern is the whole point:

1. **Schemas first.** Zod objects describe the input and the output. They double as runtime
   validation and as the TypeScript types that flow everywhere else.
2. **`baseContract.route({ method }).input(...).output(...)`** declares *what* the procedure accepts
   and returns — there is no handler body in the contract. `baseContract` is the scaffold's shared
   base that pre-declares common errors (`NOT_FOUND`, `VALIDATION_ERROR`, and friends).

{{ comp callout { type: "note", title: "The real scaffold derives schemas from Prisma" } }}
The contract you generated wires its order schemas from <code>@database/zod</code> — Zod schemas generated from your Prisma models — so the contract and the database never drift. The hand-written <code>OrdersSchemaV1</code> above is the <em>same shape</em>, spelled out so you can read it. When you wire real persistence, prefer the generated schemas. See <a href="/data-persistence/database/">Database &amp; Prisma</a>.
{{ /comp }}

## Step 2 — Read the handler

A contract describes the shape; a handler supplies the behavior. Handlers live under
`services/orders/src/routers/`. Open `services/orders/src/routers/v1.ts`. The `list` handler binds to
the contract's `list` route and queries the database through the injected context:

```ts
// services/orders/src/routers/v1.ts (the list handler, trimmed)
import { v1 } from '@contracts';

const router = v1.orders.$context<{ db: OrdersDb }>();

export const ordersV1 = {
  list: router.list.handler(async ({ input, context }) => {
    const { db } = context;
    const { limit, offset, status } = input;

    const where = status ? { status } : {};
    const total = await db.netscript.order.count({ where });
    const orders = await db.netscript.order.findMany({
      where,
      include: { items: true },
      skip: offset,
      take: limit,
    });

    return {
      items: orders.map(toOrderResponse),
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }),
  // getById, create, update, delete, getStats … also bound here.
};
```

What is type-locked here, for free:

- `input` is already parsed and typed as `{ limit: number; offset: number; status?: ... }`. You never
  re-validate it — the contract did that.
- The returned object must satisfy the contract's `output` schema. Drop `hasMore`, mistype `total`,
  or forget `items`, and `deno task check` rejects it.

The `$context<{ db: OrdersDb }>()` call is how the handler declares it needs a database client; the
service injects it (next step). The router then aggregates the handlers and namespaces them by
version so the service can host `v1`, `v2`, and so on side by side.

## Step 3 — Serve it with defineService

The service entry point is `services/orders/src/main.ts`. One `defineService` call wires CORS,
request logging, OpenAPI, the typed RPC surface, and health endpoints, and injects the database
client the handler asked for:

```ts
// services/orders/src/main.ts
import { defineService } from '@netscript/service';
import { router } from './router.ts';
import { db } from '@database';

// Each call returns the correctly typed client instance.
const netscript = await db.getClient();

await defineService(router, {
  name: 'orders',
  version: '1.0.0',
  port: parseInt(Deno.env.get('PORT') || '3002'),
  db: { netscript },
  openapi: { title: 'Orders API', description: 'Order management service' },
  debug: true,
});
```

The service binds the router and exposes the same surface on port **3002**:

{{ comp.apiTable({
  caption: "orders service endpoints (port 3002)",
  rows: [
    { name: "/api/rpc/*", type: "POST", desc: "The typed oRPC surface. Your typed client calls procedures (v1.orders.list) under this prefix with end-to-end type safety. This is what the dashboard talks to." },
    { name: "/api/v1/orders/list", type: "GET", desc: "The OpenAPI/REST projection of the same procedure — handy for curl and tools." },
    { name: "/health", type: "GET", desc: "Liveness probe — the plain JSON check you hit above." }
  ]
}) }}

{{ comp callout { type: "note", title: "Two ways to stand a service up" } }}
The scaffold uses <code>defineService(router, { … })</code> — one call, sensible defaults. NetScript also offers a fluent <code>createService(router, { … }).withCors().withLogger().withRPC().serve()</code> builder when you need to control middleware order or add custom wiring. Stick with <code>defineService</code> for this track. See <a href="/services-sdk/services/">Services &amp; contracts</a>.
{{ /comp }}

## Step 4 — Initialize the database

The `list` handler reads from Postgres, so the database needs its schema and some rows. With
`aspire start` still up (Postgres is only live while Aspire is), run these from the **workspace root**
in a second terminal:

```sh
netscript db init --name init   # create + apply the first migration
netscript db generate           # generate the Prisma client
netscript db seed               # seed development data (orders, users, products)
```

These talk to the Postgres container Aspire provisioned. Run them with no Aspire up and they fail —
there is no database to reach. The full sequence is in
[Database & migration](/how-to/database-migration/).

## Verify your progress

Call the `list` procedure over the OpenAPI projection with `curl`. From a second terminal:

```sh
curl 'http://localhost:3002/api/v1/orders/list?limit=2&offset=0'
```

You should see up to two seeded orders and a total, shaped exactly like the contract's `output`:

```json
{
  "items": [
    { "id": 1, "userId": 1, "status": "delivered", "total": 129.5, "shippingCity": "Berlin", "shippingCountry": "DE", "createdAt": "2026-01-01T00:00:00.000Z" }
  ],
  "total": 42,
  "limit": 2,
  "offset": 0,
  "hasMore": true
}
```

Then confirm the whole workspace still type-checks — contract, handler, and router together — from
the project root:

```sh
deno task check
```

- [ ] `curl …/api/v1/orders/list?limit=2&offset=0` returns a typed page of orders.
- [ ] The shape matches the contract's `output` (items / total / limit / offset / hasMore).
- [ ] `deno task check` is clean.

{{ comp callout { type: "tip", title: "Empty items array?" } }}
If <code>items</code> comes back empty, the seed step did not run or the database is fresh. Re-run <code>netscript db seed</code> from the workspace root (with <code>aspire start</code> still up), then retry the curl.
{{ /comp }}

## What you built

A typed `orders.list` read-model: an oRPC contract (`@orpc/contract` + Zod), a database-backed
handler bound with `.handler(...)`, and a running service via `defineService` on port **3002**, with
a verified `/api/rpc/*` surface and its `/api/v1/orders/*` OpenAPI projection. Next you will read this
service from the Fresh app through a typed SDK client and a cache-first query layer.

{{ comp.nextPrev({ prev: { label: "1 · Scaffold", href: "/tutorials/live-dashboard/01-scaffold/" }, next: { label: "3 · Cache-first query", href: "/tutorials/live-dashboard/03-sdk-cache-first-query/" } }) }}
