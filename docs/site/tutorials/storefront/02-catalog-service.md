---
layout: layouts/base.vto
title: A typed catalog service
templateEngine: [vento, md]
prev: { label: "1 · Scaffold", href: "/tutorials/storefront/01-scaffold/" }
next: { label: "3 · Cart contracts", href: "/tutorials/storefront/03-cart-contracts/" }
---

# A typed catalog service

In [chapter 1](/tutorials/storefront/01-scaffold/) you scaffolded `my-shop/` and watched it boot
under Aspire, with a placeholder `products` service answering on `:3001`. Now you make that service
real: a typed product **catalog** whose schemas are generated from your Prisma model, whose handlers
read from Postgres, and whose surface is served by `defineService`. By the end you will have proven
NetScript's central idea on your own data — **the contract is the single source of truth**.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/storefront/01-scaffold/" },
  { label: "2 · Catalog service", href: "/tutorials/storefront/02-catalog-service/" },
  { label: "3 · Cart contracts", href: "/tutorials/storefront/03-cart-contracts/" },
  { label: "4 · Checkout saga", href: "/tutorials/storefront/04-checkout-saga/" },
  { label: "5 · Shipping webhook", href: "/tutorials/storefront/05-shipping-webhook/" },
  { label: "6 · Deploy", href: "/tutorials/storefront/06-deploy/" }
] }) }}

## What you will build

You will define a `products` contract with typed `list` / `getById` / `create` / `update`
procedures whose Zod schemas are **generated from Prisma**, bind handlers that query a Postgres-backed
database client, and serve the whole thing with `defineService(...)` on port **3001**. You will then
`curl` the catalog over its OpenAPI projection and watch the contract reject a malformed write before
it ever reaches your handler.

## Before you begin

You should have finished [chapter 1](/tutorials/storefront/01-scaffold/), so:

- `my-shop/` exists with `services/products/` and `contracts/` directories.
- `aspire run` is up from the `aspire/` folder, so the dashboard at
  [http://localhost:18888](http://localhost:18888) is live and Postgres is online.

With Aspire up, initialize the database so the catalog has real tables to read and write. Run these
from the **workspace root** (a second terminal — leave `aspire run` going in the first):

```sh
netscript db init --name init   # create + apply the first migration
netscript db generate           # generate the Prisma client
netscript db seed               # optional: seed some sample products
```

Confirm the service is reachable before you change anything:

```sh
curl http://localhost:3001/health
```

A healthy JSON response means the scaffolded `products` service is up on port **3001** and ready to
turn into a real catalog.

{{ comp callout { type: "important", title: "db commands need Aspire running first" } }}
<code>netscript db init / generate / seed</code> reach the Postgres container <em>through</em> the running AppHost. If <code>aspire run</code> is not up, there is no database to migrate and these commands fail fast. Bring Aspire up first — always.
{{ /comp }}

## Step 1 — Define the catalog contract

Contracts are the typed seam between your service and every client. They live in `contracts/`,
versioned under `versions/v1/`, and are built from [`@orpc/contract`](/explanation/contracts/) routes
plus [Zod](https://zod.dev) schemas. The key move for a database-backed service is that you do not
hand-write the entity schema — it is **generated from your Prisma model** and re-exported from a
`@database/zod` module, so the contract and the table can never drift.

Open `contracts/versions/v1/products.contract.ts` and define the catalog surface:

```ts
// contracts/versions/v1/products.contract.ts
import { z } from 'zod';
import { implement } from '@orpc/server';
import { baseContract } from '../../shared.ts';
import {
  IdQuerySchema,
  nonNegativeInt,
  OffsetPaginationQuerySchema,
  paginationLimit,
  paginationOffset,
  positiveInt,
} from '@shared/utils';
import {
  ProductCategorySchema,
  ProductSchema,
  ProductUncheckedCreateInputObjectZodSchema,
  ProductUncheckedUpdateInputObjectZodSchema,
} from '@database/zod';

// The entity schema is GENERATED from Prisma — no hand-written shape to drift.
export const ProductsSchemaV1 = ProductSchema;

// Create/update inputs are derived from the same generated schemas.
export const CreateProductsSchemaV1 = ProductUncheckedCreateInputObjectZodSchema.omit({ id: true });
export const UpdateProductsSchemaV1 = ProductUncheckedUpdateInputObjectZodSchema
  .pick({ id: true, name: true, description: true, price: true, category: true, stock: true })
  .extend({ id: positiveInt({ description: 'Product ID to update' }) });

// Routes declare method + typed input + typed output. No handler body here.
export const productsContract = {
  list: baseContract
    .route({ method: 'GET' })
    .input(OffsetPaginationQuerySchema.extend({ category: ProductCategorySchema.optional() }))
    .output(z.object({
      items: z.array(ProductsSchemaV1),
      total: nonNegativeInt({ description: 'Total count' }),
      limit: paginationLimit({ description: 'Results per page' }),
      offset: paginationOffset({ description: 'Current offset' }),
      hasMore: z.boolean(),
    })),
  getById: baseContract.route({ method: 'GET' }).input(IdQuerySchema).output(ProductsSchemaV1),
  create: baseContract.route({ method: 'POST' }).input(CreateProductsSchemaV1).output(ProductsSchemaV1),
  update: baseContract.route({ method: 'PUT' }).input(UpdateProductsSchemaV1).output(ProductsSchemaV1),
};

// implement() turns the contract into a `.handler()`-bindable object.
export const productsContractV1 = implement(productsContract);
```

Three ideas carry the whole pattern:

1. **Schemas come from Prisma.** `ProductSchema` and the `Product*InputObjectZodSchema` shapes are
   generated into `@database/zod` from your `schema.prisma`. They double as runtime validation and as
   the TypeScript types that flow everywhere else — change a column, regenerate, and every consumer
   re-type-checks.
2. **`baseContract` gives you typed errors for free.** It is defined once as `os.errors({ ... })` and
   carries `NOT_FOUND`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `RATE_LIMITED`, and
   `SERVICE_UNAVAILABLE`. Every route built from it can `throw` those typed errors and the client sees
   them, typed.
3. **`implement(productsContract)`** produces `productsContractV1`, whose `.handler(...)` is now bound
   to the schemas above. Return the wrong shape and `deno task check` fails.

{{ comp callout { type: "tip", title: "Why a separate contracts/ workspace?" } }}
Because your service <em>and</em> your Fresh app both import from the same <code>@my-shop/contracts</code> alias, there is exactly one definition of a "product". Change a field here and every consumer re-type-checks against it — see <a href="/explanation/contracts/">Contracts &amp; type flow</a>.
{{ /comp }}

## Step 2 — Implement the handlers against Postgres

A contract describes the shape; a handler supplies the behavior. Database-backed handlers need a
Prisma client, and NetScript injects it through a **typed context**: `v1.products.$context<{ db }>()`
declares the context shape, then each `router.<proc>.handler(...)` receives it as `context`.

Open `services/products/src/routers/v1.ts` and bind the handlers:

```ts
// services/products/src/routers/v1.ts
import { v1 } from '@my-shop/contracts';
import { notFound } from '@shared/utils';
import type { DB } from '@database';

// Declare the context the handlers need: a Prisma client.
const router = v1.products.$context<{ db: DB['client'] }>();

export const productsV1 = {
  list: router.list.handler(async ({ input, context }) => {
    const { db } = context;
    const where = input.category ? { category: input.category } : {};
    const [total, items] = await Promise.all([
      db.product.count({ where }),
      db.product.findMany({ where, skip: input.offset, take: input.limit }),
    ]);
    return { items, total, limit: input.limit, offset: input.offset, hasMore: input.offset + input.limit < total };
  }),

  getById: router.getById.handler(async ({ input, errors, path, context }) => {
    const item = await context.db.product.findUnique({ where: { id: input.id } });
    if (!item) notFound({ errors, path, resourceId: input.id });
    return item;
  }),

  create: router.create.handler(async ({ input, context }) => {
    return await context.db.product.create({ data: input });
  }),

  update: router.update.handler(async ({ input, errors, path, context }) => {
    const existing = await context.db.product.findUnique({ where: { id: input.id } });
    if (!existing) notFound({ errors, path, resourceId: input.id });
    return await context.db.product.update({ where: { id: input.id }, data: input });
  }),
};
```

What is type-locked here, for free:

- `input` is already parsed and typed to the contract's input schema — you never re-validate it.
- `context.db` is the Prisma client you injected; `db.product.*` is the generated table API.
- `notFound({ errors, path, resourceId })` raises the typed `NOT_FOUND` error from `baseContract` —
  the client receives a 404 with a typed body, not a generic throw.
- Each handler's return value must satisfy the contract's output schema. Drop a field and
  `deno task check` rejects it.

Now aggregate the handlers into the service router. The router namespaces by version so the service
can host `v1`, `v2`, and so on side by side:

```ts
// services/products/src/router.ts
import { health } from './routers/health.ts';
import { productsV1 } from './routers/v1.ts';

export const v1 = { health, products: productsV1 };
export const router = { v1 };
export type Router = typeof router;
```

## Step 3 — Serve it with `defineService`

The service entry point is `services/products/src/main.ts`. Because this service talks to the
database, you pass it a Prisma client through the `db` option — `defineService` then makes that client
available as the handler `context.db` you used above:

```ts
// services/products/src/main.ts
import { defineService } from '@netscript/service';
import { router } from './router.ts';
import { db } from '@database';

// One call wires CORS, request logging, OpenAPI, RPC, and health endpoints.
await defineService(router, {
  name: 'products',
  version: '1.0.0',
  port: parseInt(Deno.env.get('PORT') || '3001'),
  db: await db.getClient(),
  openapi: { title: 'Products API', description: 'Product catalog service' },
  debug: true,
});
```

`defineService(router, { … })` is the one-shot form the scaffold uses, and what you will reach for
99% of the time. NetScript also exposes a fluent `createService(router, { … }).withDatabase(db)...serve()`
builder when you need to control middleware order, attach auth, or run startup hooks — the
[services capability](/capabilities/services/) compares them — but `defineService` covers a typical
catalog.

Either form binds the same router and exposes the same surface on port **3001**:

{{ comp.apiTable({ caption: "products service endpoints (port 3001)", rows: [
  { name: "/api/rpc/*", type: "POST", desc: "The typed oRPC surface. A typed client calls procedures (v1.products.list) under this prefix with end-to-end type safety." },
  { name: "/api/v1/products/list", type: "GET", desc: "The OpenAPI/REST projection of the same procedure, for tools and curl." },
  { name: "/health", type: "GET", desc: "Liveness probe — the plain JSON health check you hit in chapter 1." }
] }) }}

## Verify your progress

If `aspire run` is orchestrating everything, the `products` service is already live on `:3001` with
your new handlers. From a second terminal, list the catalog over the OpenAPI projection:

```sh
curl "http://localhost:3001/api/v1/products/list?limit=5&offset=0"
```

You should see your seeded products and a total, shaped exactly like the contract's `list` output.
Now prove the contract is doing real work — send a `create` with a missing required field and watch
it get rejected with a typed validation error, before any handler runs:

```sh
curl -X POST http://localhost:3001/api/v1/products/create \
  -H 'content-type: application/json' \
  -d '{ "name": "Incomplete product" }'
```

You should get a `422` carrying the `VALIDATION_ERROR` shape from `baseContract`. Finally, confirm
the whole workspace still type-checks end to end:

```sh
deno task check
```

- [ ] `netscript db init / generate / seed` completed with Aspire up.
- [ ] `GET /api/v1/products/list` returns seeded products and a `total`.
- [ ] A malformed `create` returns a typed `422 VALIDATION_ERROR`.
- [ ] `deno task check` passes — the handlers satisfy the generated output schemas.

{{ comp callout { type: "note", title: "The RPC prefix is /api/rpc/*" } }}
NetScript mounts the typed oRPC surface under <code>/api/rpc/*</code>; the <code>/api/v1/products/*</code> paths you curl'd are its OpenAPI projection. A typed <code>@orpc/client</code> reads the base URL from the service, so you rarely type the RPC path by hand. See <a href="/explanation/contracts/">Contracts &amp; type flow</a>.
{{ /comp }}

## What you built

- A versioned **oRPC contract** whose entity and input schemas are **generated from Prisma** via
  `@database/zod`, with typed errors inherited from `baseContract`.
- Handlers bound with `v1.products.$context<{ db }>()` → `.handler(...)` that read and write Postgres
  through the injected Prisma client, fully type-locked to the contract.
- A running catalog served by `defineService(router, { name, version, port, db, openapi })` on port
  **3001**, with its OpenAPI projection confirmed by `curl` and `deno task check`.

You own the contract-first, database-backed loop every NetScript service follows. Next you apply it
to a domain that does **not** exist yet — a shopping cart — by designing its contract first.

{{ comp.nextPrev({ prev: { label: "1 · Scaffold", href: "/tutorials/storefront/01-scaffold/" }, next: { label: "3 · Cart contracts", href: "/tutorials/storefront/03-cart-contracts/" } }) }}
