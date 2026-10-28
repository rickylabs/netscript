---
layout: layouts/base.vto
title: A typed catalog service
templateEngine: [vento, md]
prev: { label: '1 · Scaffold', href: '/tutorials/storefront/01-scaffold/' }
next: { label: '3 · Cart contracts', href: '/tutorials/storefront/03-cart-contracts/' }
---

# A typed catalog service

In this chapter you read the typed CRUD catalog that the scaffold generated for `products`, prove it
works through its OpenAPI projection, and make one change: a missing product returns a typed `404`
instead of a `500`. Passing `--service --db postgres` in chapter 1 generated a contract whose schemas
come from your Prisma model, Prisma-backed handlers and a `defineService` entry point, so you see
NetScript's central rule on your own data: **the contract is the single source of truth**.

{{ comp.learningPath({
  steps: [
    { label: "1 · Scaffold", href: "/tutorials/storefront/01-scaffold/" },
    { label: "2 · Catalog service", href: "/tutorials/storefront/02-catalog-service/" },
    { label: "3 · Cart contracts", href: "/tutorials/storefront/03-cart-contracts/" },
    { label: "4 · Checkout saga", href: "/tutorials/storefront/04-checkout-saga/" },
    { label: "5 · Shipping webhook", href: "/tutorials/storefront/05-shipping-webhook/" },
    { label: "6 · Storefront UI", href: "/tutorials/storefront/06-storefront-ui/" },
    { label: "7 · Deploy", href: "/tutorials/storefront/07-deploy/" },
  ],
}) }}

## What you will build

You read the generated contract, a `createCrudContract` surface whose Zod schemas are **generated
from Prisma**, and its Prisma-backed handlers. Then you `curl` the catalog through its OpenAPI
projection: create a product, list it back, and watch the contract reject a malformed write with a
typed `400` before any handler runs. Finally you change `getById` to return a typed
`404 NOT_FOUND` instead of a generic `500`, and prove it with `curl`.

## Before you begin

You should have finished [chapter 1](/tutorials/storefront/01-scaffold/), so:

- `my-shop/` exists with `services/products/`, `contracts/` and `database/` directories;
- `aspire start` is up from the `aspire/` folder, so the dashboard at
  [https://localhost:18888](https://localhost:18888) is live and Postgres is online;
- the database is initialized (`netscript db init`, `db generate` and `db seed` in chapter 1).

The scaffolded seed script only checks the connection (`SELECT 1`); it inserts no rows. Your
`products` table starts empty, and you create the first product through the API in
[Verify your progress](#verify-your-progress).

Confirm the service is reachable before you change anything:

```sh
curl http://localhost:3001/health
```

A healthy JSON response means the `products` service is up on port **3001**.

## Step 1 — Read the generated contract

Contracts are the typed seam between your service and every client. They live in `contracts/`,
versioned under `versions/v1/`, and are built from [`@orpc/contract`](/explanation/contracts/) routes
and [Zod](https://zod.dev) schemas. For a database-backed service you don't write the entity schema:
it is **generated from your Prisma model** and re-exported from a `@database/zod` module, so the
contract and the table can't drift. `createCrudContract` then generates the CRUD routes from those
schemas.

Open the generated `contracts/versions/v1/products.contract.ts`:

```ts
// contracts/versions/v1/products.contract.ts (generated)
import { implement } from '@orpc/server';
import { baseContract } from '@netscript/contracts';
import { createCrudContract } from '@netscript/contracts/crud';
import { z } from 'zod';
import { ProductCreateInput, ProductSchema, ProductUpdateInput } from '@database/zod';

export const ProductsHealthSchemaV1 = z.object({
  status: z.enum(['healthy', 'unhealthy', 'degraded']).describe('Service health status'),
  service: z.string().describe('Service name'),
  version: z.string().describe('Service version'),
  timestamp: z.string().datetime().describe('ISO timestamp'),
  uptime: z.number().int().nonnegative().optional().describe('Uptime in seconds'),
});

// The entity and input schemas are GENERATED from Prisma — no hand-written shape to drift.
export const ProductsProductSchemaV1 = ProductSchema;
export const ProductsProductCreateInputSchemaV1 = ProductCreateInput;
export const ProductsProductUpdateInputSchemaV1 = ProductUpdateInput;

// createCrudContract builds list/getById/create/update/delete routes on baseContract.
export const ProductsCrudContractV1 = createCrudContract({
  resource: 'products',
  entitySchema: ProductsProductSchemaV1,
  createSchema: ProductsProductCreateInputSchemaV1,
  updateSchema: ProductsProductUpdateInputSchemaV1,
});

export const ProductsContractV1 = {
  health: {
    check: baseContract
      .route({ method: 'GET', path: '/products/health' })
      .output(ProductsHealthSchemaV1),
  },
  ...ProductsCrudContractV1,
};

// implement() turns the contract object into a `.handler()`-bindable surface.
export const ProductsV1 = implement(ProductsContractV1);
```

Three ideas carry the pattern:

1. **Schemas come from Prisma.** `ProductSchema`, `ProductCreateInput` and `ProductUpdateInput` are
   generated into `@database/zod` from your `schema.prisma` (a `Product` with `id`, `name`,
   `createdAt`, `updatedAt`). They are both runtime validators and the TypeScript types every
   consumer uses: change a column, run `netscript db generate`, and every consumer re-type-checks.
2. **`createCrudContract` generates the standard five routes.** From `resource`, `entitySchema`,
   `createSchema` and `updateSchema`, it builds `list` (`GET /products`), `getById`
   (`GET /products/{id}`), `create` (`POST /products`), `update` (`PATCH /products/{id}`) and
   `delete` (`DELETE /products/{id}`). Each route is built on `baseContract` from
   `@netscript/contracts`, so each inherits the typed `NOT_FOUND`, `VALIDATION_ERROR`,
   `UNAUTHORIZED`, `FORBIDDEN`, `RATE_LIMITED` and `SERVICE_UNAVAILABLE` errors.
3. **`implement(ProductsContractV1)`** produces `ProductsV1`, whose `.handler(...)` is bound to the
   schemas above. Return the wrong shape and `deno task check` fails.

{{ comp callout { type: "tip", title: "Why a separate contracts/ workspace?" } }}
Your service <em>and</em> your Fresh app import from the same <code>@my-shop/contracts</code> alias,
so there is exactly one definition of a product. Change a field here and every consumer
re-type-checks against it. See <a href="/explanation/contracts/">Contracts &amp; type flow</a>.
{{ /comp }}

## Step 2 — Read the Prisma-backed handlers

A contract describes the shape; a handler supplies the behavior. Database-backed handlers need a
Prisma client, which NetScript injects through a **typed context**: `v1.products.$context<{ db }>()`
declares the context shape, and each `.handler(...)` receives it as `context`. Open the generated
`services/products/src/routers/v1.ts`:

```ts
// services/products/src/routers/v1.ts (generated, condensed)
import type { PrismaClient } from '@database';
import { v1 } from '@my-shop/contracts';

type ProductHandlerContext = { readonly db: PrismaClient };
const productsV1 = v1.products.$context<ProductHandlerContext>();

export const ProductsV1 = {
  // list is PAGE-BASED: input { page, limit, sortBy?, sortOrder }.
  list: productsV1.list.handler(async ({ input, context }) => {
    const skip = (input.page - 1) * input.limit;
    const [data, total] = await Promise.all([
      context.db.product.findMany({ skip, take: input.limit }),
      context.db.product.count(),
    ]);
    const totalPages = Math.ceil(total / input.limit);
    return {
      data,
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages,
        hasNext: input.page < totalPages,
        hasPrev: input.page > 1,
      },
    };
  }),

  getById: productsV1.getById.handler(async ({ input, context }) => {
    const record = await context.db.product.findUnique({ where: { id: input.id } });
    if (!record) throw new Error(`Product ${input.id} not found`); // ← upgraded in Step 3
    return record;
  }),

  create: productsV1.create.handler(async ({ input, context }) =>
    await context.db.product.create({ data: input })
  ),

  update: productsV1.update.handler(async ({ input, context }) =>
    await context.db.product.update({ where: { id: input.id }, data: input.data })
  ),

  delete: productsV1.delete.handler(async ({ input, context }) =>
    await context.db.product.delete({ where: { id: input.id } })
  ),
};
```

What the types guarantee:

- `input` is already parsed and typed to the contract's input schema, so you never re-validate it.
  `list` input is **page-based** (`{ page, limit, sortBy?, sortOrder }`, with `page` 1-indexed), and
  its output is `{ data, pagination: { page, limit, total, totalPages, hasNext, hasPrev } }`. For
  `update`, `createCrudContract` shapes the input as `{ id, data }`, so the handler reads `input.id`
  and passes `input.data` to Prisma.
- `context.db` is the Prisma client the service injects; `db.product.*` is the generated table API.
- Each handler's return value must satisfy the contract's output schema. Drop a field and
  `deno task check` rejects it.

`getById` throws a **generic `Error`** when a row is missing, which reaches the client as a
`500 INTERNAL_SERVER_ERROR`. A missing product is a client-addressable `404`, not a server fault.
You fix that next.

## Step 3 — Upgrade the not-found to a typed 404

Every `createCrudContract` route inherits the typed `NOT_FOUND` error from `baseContract`, and each
handler receives an `errors` object with a constructor for it. In
`services/products/src/routers/v1.ts`, change `getById` to throw the typed error:

```ts
// services/products/src/routers/v1.ts — getById, upgraded
getById: productsV1.getById.handler(async ({ input, context, errors }) => {
  const record = await context.db.product.findUnique({ where: { id: input.id } });
  if (!record) throw errors.NOT_FOUND({ message: `Product ${input.id} not found` });
  return record;
}),
```

`errors.NOT_FOUND(...)` raises the contract's own typed error: the client now receives a `404` with a
typed `{ code: 'NOT_FOUND', ... }` body. Because the error vocabulary is part of the contract, client
and server agree on it.

The service router (`services/products/src/router.ts`) already aggregates these handlers and nests
the generated `health` router under the `products` namespace. You don't need to change it:

```ts
// services/products/src/router.ts (generated)
import { health } from './routers/health.ts';
import { ProductsV1 } from './routers/v1.ts';

export const v1 = { products: { ...ProductsV1, health } };
export const router = { v1 };
export type Router = typeof router;
```

## Step 4 — How it is served

The service entry point is `services/products/src/main.ts`. Because the service uses the database,
it passes a Prisma client through the `db` option, and `defineService` makes that client available as
the handler's `context.db`:

```ts
// services/products/src/main.ts (generated)
import { defineService } from '@netscript/service';
import { db } from '@database';
import { router } from './router.ts';

const database = await db.getClient();

// One call wires CORS, request logging, OpenAPI, RPC, and health endpoints.
await defineService(router, {
  auth: { public: true, reason: 'Public example service; add guards before exposing private data' },
  name: 'products',
  version: '1.0.0',
  port: parseInt(Deno.env.get('PORT') || '3001'),
  db: database,
  openapi: { title: 'Products API', description: 'products service' },
  debug: true,
});
```

{{ comp callout { type: "note", title: "Where the port comes from" } }}
<code>parseInt(Deno.env.get('PORT') || '3001')</code> is the runtime read, not the source of truth.
Aspire <strong>injects</strong> <code>PORT</code> when it starts the service, and the typed
<code>services.products.port</code> field in <code>netscript.config.ts</code> decides which port the
scaffold injects. The <code>'3001'</code> fallback applies only when you run the entrypoint outside
Aspire. To change the port, edit the typed config, not this line.
{{ /comp }}

`defineService(router, { … })` is the one-call form the scaffold uses, and it covers a typical
catalog. When you need to control middleware order, attach auth or run startup hooks, NetScript also
offers a fluent `createService(router, { … })` builder; the
[services capability](/services-sdk/services/) compares them. The service exposes this surface on
port **3001**:

{{ comp.apiTable({
  caption: "products service endpoints (port 3001)",
  rows: [
    { name: "/api/rpc/*", type: "POST", desc: "The typed oRPC surface. A typed client calls procedures (v1.products.list) under this prefix with end-to-end type safety." },
    { name: "/api/products", type: "GET / POST", desc: "The OpenAPI/REST projection: GET lists (paginated), POST creates. getById/update/delete live at /api/products/{id}." },
    { name: "/health", type: "GET", desc: "Liveness probe — the plain JSON health check you hit in chapter 1." },
  ],
}) }}

## Verify your progress

With `aspire start` running, the `products` service is live on `:3001` with your upgraded handler.
The REST projection mounts under the `/api` prefix, with no `/v1` segment: `v1` is the RPC namespace,
not part of the URL.

1. Create a product, since the table started empty:

   ```sh
   curl -X POST http://localhost:3001/api/products \
     -H 'content-type: application/json' \
     -d '{ "name": "Aeron Chair" }'
   ```

   You get the created row back, with a numeric `id`.

2. List the catalog. The output is page-shaped:

   ```sh
   curl "http://localhost:3001/api/products?page=1&limit=10"
   ```

   You see `{ "data": [ … ], "pagination": { "page": 1, "limit": 10, "total": 1, … } }`, the
   contract's `list` output.

3. Send a `create` without the required `name`:

   ```sh
   curl -X POST http://localhost:3001/api/products \
     -H 'content-type: application/json' \
     -d '{}'
   ```

   You get a `400` with `{ "code": "BAD_REQUEST", "message": "Input validation failed", ... }` before
   any handler runs. This is the framework's automatic input-validation gate, distinct from the
   handler-thrown `VALIDATION_ERROR` (`422`) you would raise for a semantic rule.

4. Fetch an id that doesn't exist:

   ```sh
   curl -i http://localhost:3001/api/products/999999
   ```

   You see `HTTP/1.1 404` and a `{ "code": "NOT_FOUND", ... }` body: your Step 3 change.

5. Type-check the workspace:

   ```sh
   deno task check
   ```

- [ ] `POST /api/products` creates a product; `GET /api/products` returns it under `data` with
      `pagination`.
- [ ] A `create` missing `name` returns `400 BAD_REQUEST` ("Input validation failed").
- [ ] `GET /api/products/999999` returns a typed `404 NOT_FOUND` — your Step 3 upgrade.
- [ ] `deno task check` passes — the handlers satisfy the generated output schemas.

{{ comp callout { type: "note", title: "The RPC prefix is /api/rpc/_" } }}
NetScript mounts the typed oRPC surface under <code>/api/rpc/_</code>; the
<code>/api/products/*</code> paths you called are its OpenAPI projection under the <code>/api</code>
prefix. A typed <code>@orpc/client</code> reads the base URL from the service, so you rarely type the
RPC path by hand. See <a href="/explanation/contracts/">Contracts &amp; type flow</a>.
{{ /comp }}

## What you built

A running, typed catalog: a versioned contract generated with `createCrudContract` from
Prisma-generated schemas, Prisma-backed handlers bound through `v1.products.$context<{ db }>()`, and
a `defineService` entry point on port **3001**. Your one change, `errors.NOT_FOUND(...)`, turned a
`500` into a typed `404`. Next, you apply the same contract-first loop to a domain that doesn't exist
yet: a shopping cart.

{{ comp.nextPrev({ prev: { label: "1 · Scaffold", href: "/tutorials/storefront/01-scaffold/" },
next: { label: "3 · Cart contracts", href: "/tutorials/storefront/03-cart-contracts/" } }) }}
