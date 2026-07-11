---
layout: layouts/base.vto
title: A typed catalog service
templateEngine: [vento, md]
prev: { label: "1 · Scaffold", href: "/tutorials/storefront/01-scaffold/" }
next: { label: "3 · Cart contracts", href: "/tutorials/storefront/03-cart-contracts/" }
---

# A typed catalog service

In [chapter 1](/tutorials/storefront/01-scaffold/) you scaffolded `my-shop/` and watched it boot
under Aspire, with a `products` service answering on `:3001`. That service is not a placeholder — when
you passed `--service --db postgres`, the scaffold generated a **complete, typed CRUD catalog**: a
contract whose schemas come from your Prisma model, Prisma-backed handlers, and a `defineService`
entry point. In this chapter you read what was generated, prove it does real work over its OpenAPI
projection, and make one deliberate upgrade — turning a not-found into a typed `404`. By the end you
will have seen NetScript's central idea on your own data: **the contract is the single source of
truth**.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/storefront/01-scaffold/" },
  { label: "2 · Catalog service", href: "/tutorials/storefront/02-catalog-service/" },
  { label: "3 · Cart contracts", href: "/tutorials/storefront/03-cart-contracts/" },
  { label: "4 · Checkout saga", href: "/tutorials/storefront/04-checkout-saga/" },
  { label: "5 · Shipping webhook", href: "/tutorials/storefront/05-shipping-webhook/" },
  { label: "6 · Deploy", href: "/tutorials/storefront/06-deploy/" }
] }) }}

## What you will build

You will initialize the Postgres database behind the generated `products` catalog, read the generated
contract (a `createCrudContract` surface whose Zod schemas are **generated from Prisma**) and its
Prisma-backed handlers, then `curl` the catalog over its OpenAPI projection: create a product, list
it back, and watch the contract reject a malformed write with a typed `400` before any handler runs.
Finally you make one authored change — upgrading `getById` from a generic `500` to a typed `404
NOT_FOUND` — and prove it with a curl.

## Before you begin

You should have finished [chapter 1](/tutorials/storefront/01-scaffold/), so:

- `my-shop/` exists with `services/products/`, `contracts/`, and `database/` directories.
- `aspire start` is up from the `aspire/` folder, so the dashboard at
  [https://localhost:18888](https://localhost:18888) is live and Postgres is online.

With Aspire up, initialize the database so the catalog has real tables to read and write. Run these
from the **workspace root** (a second terminal — leave `aspire start` going in the first):

```sh
netscript db init --name init   # create + apply the first migration
netscript db generate           # generate the Prisma client and @database/zod schemas
netscript db seed               # verifies the connection (SELECT 1) — the table starts empty
```

The scaffolded seed script only checks connectivity; it does **not** insert sample rows. Your
`products` table starts empty — you will create your first product over the API further down, which is
the honest way to prove the write path.

Confirm the service is reachable before you change anything:

```sh
curl http://localhost:3001/health
```

A healthy JSON response means the scaffolded `products` service is up on port **3001**.

{{ comp callout { type: "important", title: "db commands need aspire starting first" } }}
<code>netscript db init / generate / seed</code> reach the Postgres container <em>through</em> the running AppHost. If <code>aspire start</code> is not up, there is no database to migrate and these commands fail fast. Bring Aspire up first — always.
{{ /comp }}

## Step 1 — Read the generated contract

Contracts are the typed seam between your service and every client. They live in `contracts/`,
versioned under `versions/v1/`, and are built from [`@orpc/contract`](/explanation/contracts/) routes
plus [Zod](https://zod.dev) schemas. The key move for a database-backed service is that you do not
hand-write the entity schema — it is **generated from your Prisma model** and re-exported from a
`@database/zod` module, so the contract and the table can never drift. And you do not hand-roll the
CRUD routes either: `createCrudContract` generates them from the schemas.

Open the generated `contracts/versions/v1/products.contract.ts` and read it:

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

Three ideas carry the whole pattern:

1. **Schemas come from Prisma.** `ProductSchema`, `ProductCreateInput`, and `ProductUpdateInput` are
   generated into `@database/zod` from your `schema.prisma` (a `Product` with `id`, `name`,
   `createdAt`, `updatedAt`). They double as runtime validation and as the TypeScript types that flow
   everywhere else — change a column, `netscript db generate`, and every consumer re-type-checks.
2. **`createCrudContract` generates the standard five.** Given `resource`, `entitySchema`,
   `createSchema`, and `updateSchema`, it builds `list` (`GET /products`), `getById`
   (`GET /products/{id}`), `create` (`POST /products`), `update` (`PATCH /products/{id}`), and
   `delete` (`DELETE /products/{id}`) — every route built on `baseContract`, imported from
   `@netscript/contracts`, so each one inherits typed `NOT_FOUND`, `VALIDATION_ERROR`,
   `UNAUTHORIZED`, `FORBIDDEN`, `RATE_LIMITED`, and `SERVICE_UNAVAILABLE` errors for free.
3. **`implement(ProductsContractV1)`** produces `ProductsV1`, whose `.handler(...)` is now bound to
   the schemas above. Return the wrong shape and `deno task check` fails.

{{ comp callout { type: "tip", title: "Why a separate contracts/ workspace?" } }}
Because your service <em>and</em> your Fresh app both import from the same <code>@my-shop/contracts</code> alias, there is exactly one definition of a "product". Change a field here and every consumer re-type-checks against it — see <a href="/explanation/contracts/">Contracts &amp; type flow</a>.
{{ /comp }}

## Step 2 — Read the Prisma-backed handlers

A contract describes the shape; a handler supplies the behavior. Database-backed handlers need a
Prisma client, and NetScript injects it through a **typed context**:
`v1.products.$context<{ db }>()` declares the context shape, then each `.handler(...)` receives it as
`context`. Open the generated `services/products/src/routers/v1.ts`:

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

What is type-locked here, for free:

- `input` is already parsed and typed to the contract's input schema — you never re-validate it.
  `list` input is **page-based** (`{ page, limit, sortBy?, sortOrder }`, `page` 1-indexed), and its
  output is `{ data, pagination: { page, limit, total, totalPages, hasNext, hasPrev } }`. For
  `update`, `createCrudContract` shapes the input as `{ id, data }`, so the handler reads `input.id`
  and passes `input.data` straight through to Prisma.
- `context.db` is the Prisma client the service injects; `db.product.*` is the generated table API.
- Each handler's return value must satisfy the contract's output schema. Drop a field and
  `deno task check` rejects it.

Notice `getById` throws a **generic `Error`** when a row is missing. That surfaces to the client as a
`500 INTERNAL_SERVER_ERROR` — technically wrong: a missing product is a client-addressable `404`, not
a server fault. That is the one thing you improve next.

## Step 3 — Upgrade the not-found to a typed 404

Every `createCrudContract` route inherits the typed `NOT_FOUND` error from `baseContract`, and each
handler receives an `errors` object with a constructor for it. Edit `getById` in
`services/products/src/routers/v1.ts` to throw the typed error instead of a bare `Error`:

```ts
// services/products/src/routers/v1.ts — getById, upgraded
getById: productsV1.getById.handler(async ({ input, context, errors }) => {
  const record = await context.db.product.findUnique({ where: { id: input.id } });
  if (!record) throw errors.NOT_FOUND({ message: `Product ${input.id} not found` });
  return record;
}),
```

`errors.NOT_FOUND(...)` raises the contract's own typed error — the client now receives a `404` with a
typed `{ code: 'NOT_FOUND', ... }` body instead of a generic `500` throw. This is the whole point of
`baseContract`: the error vocabulary is part of the contract, so both sides agree on it.

The service router (`services/products/src/router.ts`) already aggregates these handlers and nests the
generated `health` router under the `products` namespace — you do not need to touch it:

```ts
// services/products/src/router.ts (generated)
import { health } from './routers/health.ts';
import { ProductsV1 } from './routers/v1.ts';

export const v1 = { products: { ...ProductsV1, health } };
export const router = { v1 };
export type Router = typeof router;
```

## Step 4 — How it is served

The service entry point is `services/products/src/main.ts`. Because this service talks to the
database, it passes a Prisma client through the `db` option — `defineService` then makes that client
available as the handler `context.db` you read above:

```ts
// services/products/src/main.ts (generated)
import { defineService } from '@netscript/service';
import { db } from '@database';
import { router } from './router.ts';

const database = await db.getClient();

// One call wires CORS, request logging, OpenAPI, RPC, and health endpoints.
await defineService(router, {
  name: 'products',
  version: '1.0.0',
  port: parseInt(Deno.env.get('PORT') || '3001'),
  db: database,
  openapi: { title: 'Products API', description: 'products service' },
  debug: true,
});
```

`defineService(router, { … })` is the one-shot form the scaffold uses, and what you will reach for
99% of the time. NetScript also exposes a fluent `createService(router, { … })` builder when you need
to control middleware order, attach auth, or run startup hooks — the
[services capability](/services-sdk/services/) compares them — but `defineService` covers a typical
catalog. It exposes the same surface on port **3001**:

{{ comp.apiTable({ caption: "products service endpoints (port 3001)", rows: [
  { name: "/api/rpc/*", type: "POST", desc: "The typed oRPC surface. A typed client calls procedures (v1.products.list) under this prefix with end-to-end type safety." },
  { name: "/api/products", type: "GET / POST", desc: "The OpenAPI/REST projection: GET lists (paginated), POST creates. getById/update/delete live at /api/products/{id}." },
  { name: "/health", type: "GET", desc: "Liveness probe — the plain JSON health check you hit in chapter 1." }
] }) }}

## Verify your progress

If `aspire start` is orchestrating everything, the `products` service is already live on `:3001` with
your upgraded handler. The REST projection mounts under the `/api` prefix (no `/v1` segment — that is
the RPC namespace, not the URL). From a second terminal, first create a product, since the table
started empty:

```sh
curl -X POST http://localhost:3001/api/products \
  -H 'content-type: application/json' \
  -d '{ "name": "Aeron Chair" }'
```

You get the created row back, with a numeric `id`. Now list the catalog — the output is page-shaped:

```sh
curl "http://localhost:3001/api/products?page=1&limit=10"
```

You should see `{ "data": [ … ], "pagination": { "page": 1, "limit": 10, "total": 1, … } }`, exactly
the contract's `list` output. Prove the contract is doing real work — send a `create` with the
required `name` missing and watch it get rejected before any handler runs:

```sh
curl -X POST http://localhost:3001/api/products \
  -H 'content-type: application/json' \
  -d '{}'
```

You get a `400` with `{ "code": "BAD_REQUEST", "message": "Input validation failed", ... }` — the
framework's automatic input-validation gate, distinct from the handler-thrown `VALIDATION_ERROR`
(`422`) you would raise for a semantic rule. Finally, prove your Step 3 upgrade: fetch an id that does
not exist and confirm it is now a typed `404`, not a `500`:

```sh
curl -i http://localhost:3001/api/products/999999
```

You should see `HTTP/1.1 404` and a `{ "code": "NOT_FOUND", ... }` body. Then confirm the whole
workspace still type-checks end to end:

```sh
deno task check
```

- [ ] `netscript db init / generate / seed` completed with Aspire up.
- [ ] `POST /api/products` creates a product; `GET /api/products` returns it under `data` with
      `pagination`.
- [ ] A `create` missing `name` returns `400 BAD_REQUEST` ("Input validation failed").
- [ ] `GET /api/products/999999` returns a typed `404 NOT_FOUND` — your Step 3 upgrade.
- [ ] `deno task check` passes — the handlers satisfy the generated output schemas.

{{ comp callout { type: "note", title: "The RPC prefix is /api/rpc/*" } }}
NetScript mounts the typed oRPC surface under <code>/api/rpc/*</code>; the <code>/api/products/*</code> paths you curl'd are its OpenAPI projection under the <code>/api</code> prefix. A typed <code>@orpc/client</code> reads the base URL from the service, so you rarely type the RPC path by hand. See <a href="/explanation/contracts/">Contracts &amp; type flow</a>.
{{ /comp }}

## What you built

- A read of the versioned **oRPC contract** the scaffold generated with `createCrudContract` from
  entity and input schemas **generated from Prisma** via `@database/zod` —
  `list`/`getById`/`create`/`update`/`delete`, with typed errors inherited from `baseContract`.
- Prisma-backed handlers bound with `v1.products.$context<{ db }>()` → `.handler(...)`, page-based
  `list`, and one authored upgrade: `getById` now raises `errors.NOT_FOUND(...)` for a missing row,
  turning a `500` into a typed `404`.
- A running catalog served by `defineService(router, { name, version, port, db, openapi })` on port
  **3001**, its OpenAPI projection at `/api/products` confirmed by `curl` and `deno task check`.

You own the contract-first, database-backed loop every NetScript service follows. Next you apply it
to a domain that does **not** exist yet — a shopping cart — by designing its contract first.

{{ comp.nextPrev({ prev: { label: "1 · Scaffold", href: "/tutorials/storefront/01-scaffold/" }, next: { label: "3 · Cart contracts", href: "/tutorials/storefront/03-cart-contracts/" } }) }}
