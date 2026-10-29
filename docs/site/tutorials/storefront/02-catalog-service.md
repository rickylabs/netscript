---
layout: layouts/base.vto
title: A typed catalog service
templateEngine: [vento, md]
prev: { label: '1 · Scaffold', href: '/tutorials/storefront/01-scaffold/' }
next: { label: '3 · Cart contracts', href: '/tutorials/storefront/03-cart-contracts/' }
---

# A typed catalog service

Read the catalog that the scaffold generated: a shared contract, a repository, application logic
and thin service handlers. Missing records already return a typed `NOT_FOUND`; there is no generic
error to repair. You will inspect the contract and exercise it through a typed SDK client.

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

A small catalog check that creates a product, reads a page and observes the typed not-found error.
The seed from chapter 1 checks the connection but inserts no products.

## Prerequisites

Keep Aspire running from chapter 1 and finish `netscript db init`, `db generate` and `db seed`.
Use `netscript service list` to confirm the `products` service is configured. For live endpoints,
call the MCP tools `list_api_services`, `list_service_operations` and `get_operation_schema` in
that order. Open the dashboard at the URL Aspire prints to check resource health.

## Step 1 — Read the generated contract

Open `contracts/versions/v1/products.contract.ts`. The Prisma generator exports `ProductSchema`,
`ProductCreateInput` and `ProductUpdateInput` through `@database/zod`. `createCrudContract` uses
those schemas to declare `list`, `getById`, `create`, `update` and `delete`.

```ts
// Excerpt from contracts/versions/v1/products.contract.ts.
const demoCrud = createCrudContract({
  resource: 'products',
  entitySchema: ProductsProductSchemaV1,
  createSchema: ProductsProductCreateInputSchemaV1,
  updateSchema: ProductsProductUpdateInputSchemaV1,
});
```

The generated showcase marks the CRUD procedures public with access metadata. Its separate
`session` procedure declares required authentication. Keep these choices explicit when extending
the service; [route authorization](/services-sdk/how-to/protect-an-anonymous-route/) shows the
policy boundary.

Inspect the registered contract from the workspace root:

```sh
netscript contract inspect products
```

`list` takes page-based input: `page`, `limit`, optional `sortBy`, and `sortOrder`. Its result is
`{ data, pagination }`, where pagination includes `page`, `limit`, `total`, `totalPages`,
`hasNext` and `hasPrev`. The update input is `{ id, data }`.

## Step 2 — Follow the implementation

The generated files divide the work:

- `domain/product.ts` owns list-query and pagination rules.
- `application/product.ts` owns use cases and a repository interface.
- `adapters/prisma-product-repository.ts` implements persistence.
- `routers/v1.ts` binds contract procedures to the application.
- `router.ts` creates the versioned router from the repository.

The generated get-by-id handler already uses the shared typed error helper:

```ts
// Excerpt from services/products/src/routers/v1.ts.
getById: v1.products.getById.handler(async ({ input, errors }) => {
  const record = await application.getById(input.id);
  if (!record) {
    notFound({ errors, resourceId: input.id, message: `Product ${input.id} not found` });
  }
  return record;
}),
```

`notFound` is imported from `@netscript/contracts`. A missing row becomes the contract's
`NOT_FOUND` error, which maps to HTTP 404. The handler receives typed input and delegates business
work to the application; it does not issue Prisma calls itself.

## Step 3 — Read the service entry point

`services/products/src/main.ts` obtains the database client, constructs the Prisma repository,
passes it to `createRouter`, and serves the result with `defineService`. Aspire injects the
listener's `PORT` and the service's dependencies.

The router nests the product procedures under `v1.products`. Typed clients use the
`/api/rpc/v1/products` procedure prefix. The default OpenAPI handler mounts at `/api`; the contract's
`/products` route becomes `/api/products`. The RPC namespace does not add `/v1` to a declared REST
path. Use `get_operation_schema` to inspect the actual path instead of guessing it.

## Step 4 — Call the typed catalog

Inside the generated app, keep the client and query factories together in `lib/products.ts`, as
shown in chapter 6. The SDK resolves `serviceName: 'products'` through Aspire's injected discovery
values.

For a terminal check, copy the product service's URL from `aspire describe` into `PRODUCTS_URL`.
This explicit resolver is useful outside an Aspire-launched process, where discovery variables
are not injected. Create `scripts/check-catalog.ts`:

```ts
import { ProductsContractV1 } from '@my-shop/contracts/versions/v1';
import { createServiceClient } from '@netscript/sdk/client';

const endpoint = Deno.env.get('PRODUCTS_URL');
if (!endpoint) throw new Error('Set PRODUCTS_URL to the URL Aspire prints');
const products = createServiceClient({
  contract: ProductsContractV1,
  serviceName: 'products',
  resolveServiceUrl: () => endpoint,
});

const created = await products.create({ name: 'Desk chair' });
const catalog = await products.list({ page: 1, limit: 10, sortOrder: 'asc' });
console.log(created.id, catalog.data, catalog.pagination);

// This intentionally rejects with the typed NOT_FOUND error.
await products.getById({ id: 999999 });
```

Run it from the workspace root with the service URL in your environment:

```sh
deno run --allow-env --allow-net scripts/check-catalog.ts
```

The first calls print the created row and the page-shaped catalog. The final call exits with a
`NOT_FOUND` error. A malformed write fails contract validation before the handler runs; the client
also rejects an invalid input shape at type-check time.

## Verify your progress

```sh
deno task check
```

- [ ] `netscript contract inspect products` lists the generated procedures.
- [ ] The typed client creates a product and returns it under `catalog.data`.
- [ ] Pagination reports page and total information.
- [ ] A missing id returns `NOT_FOUND`, using the generated handler.
- [ ] `deno task check` passes.

## What you built

A catalog checked through the same contract that its service implements. The generated repository
and application own persistence and list policy, the handlers own protocol bindings, and the SDK
owns discovery and transport. Next, add a cart contract.
