---
layout: layouts/base.vto
title: Cart, contract-first
templateEngine: [vento, md]
prev: { label: "2 · Catalog service", href: "/tutorials/storefront/02-catalog-service/" }
next: { label: "4 · Checkout saga", href: "/tutorials/storefront/04-checkout-saga/" }
---

# Cart, contract-first

In this chapter you design a new `cart` domain contract-first. Chapter 2's catalog contract was
mostly generated from Prisma; here you write the cart's procedures and schemas yourself as the single
source of truth, then derive a typed client from them with no codegen step. The checkout saga in
chapter 4 builds on this contract.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/storefront/01-scaffold/" },
  { label: "2 · Catalog service", href: "/tutorials/storefront/02-catalog-service/" },
  { label: "3 · Cart contracts", href: "/tutorials/storefront/03-cart-contracts/" },
  { label: "4 · Checkout saga", href: "/tutorials/storefront/04-checkout-saga/" },
  { label: "5 · Shipping webhook", href: "/tutorials/storefront/05-shipping-webhook/" },
  { label: "6 · Storefront UI", href: "/tutorials/storefront/06-storefront-ui/" },
  { label: "7 · Deploy", href: "/tutorials/storefront/07-deploy/" }
] }) }}

## What you will build

A `cart` contract under `contracts/versions/v1/` with `list`, `getById`, `create` and `update`
procedures, Zod schemas for a cart and its line items, and typed errors inherited from
`baseContract`. You then derive a typed `@orpc/client` from the contract and call it: the contract
alone, with no implementation yet, gives a client end-to-end type safety.

{{ comp callout { type: "note", title: "Cart is a new domain, modeled on orders" } }}
Unlike <code>products</code>, the NetScript playground has no cart. This chapter models the cart
contract on the playground's <strong>orders</strong> contract: the same procedure set
(<code>list</code>/<code>getById</code>/<code>create</code>/<code>update</code>) and the same
<code>baseContract</code> typed-error pattern. Orders has a database table behind it; your cart
schemas here are hand-written Zod. You can generate them from Prisma later if you add a cart table.
{{ /comp }}

## Before you begin

From [chapter 2](/tutorials/storefront/02-catalog-service/), check that:

- `my-shop/` has a working `products` service on `:3001` and a `contracts/versions/v1/` directory
  with `products.contract.ts` in it;
- `aspire start` is up (the dashboard answers at [https://localhost:18888](https://localhost:18888)).

Confirm the contracts workspace is where you left it:

```sh
ls contracts/versions/v1/
```

You see `products.contract.ts` among the files. The CLI adds `cart.contract.ts` next to it.

## Step 1 — Scaffold the cart contract

Let the CLI create the contract file and wire it into the version aggregate, as the
[Add a service](/services-sdk/how-to/add-a-service/) recipe does. From the workspace root:

```sh
netscript contract add cart
```

This writes `contracts/versions/v1/cart.contract.ts`, a starter contract with example schemas and
procedures, and regenerates `contracts/versions/v1/mod.ts` so the new contract is exported and
reachable as `v1.cart`. You don't edit `mod.ts`: the aggregate imports both the plain
`CartContractV1` and the implemented `CartV1`, re-exports the plain object, and adds `cart` to the
`v1.*` map. This is the same `CartContractV1` (routes) → `CartV1` (implemented) convention the
generated products contract uses.

Confirm the file landed:

```sh
ls contracts/versions/v1/
```

Next, replace the scaffolded example with the cart's real shape.

## Step 2 — Define the cart schemas

A cart holds line items, each referencing a product by id with a quantity, and a status. Open the
scaffolded `contracts/versions/v1/cart.contract.ts` and replace its starter schemas with the ones
below. The helpers (`positiveInt`, `nonNegativeInt`, the pagination schemas) and `baseContract` come
from `@netscript/contracts`. Replace the scaffold's `oc`/`@orpc/contract` import with `baseContract`
so every route inherits the shared typed errors, as the playground's `orders` contract does:

```ts
// contracts/versions/v1/cart.contract.ts
import { z } from 'zod';
import { implement } from '@orpc/server';
import {
  baseContract,
  nonNegativeInt,
  OffsetPaginationQuerySchema,
  paginationLimit,
  paginationOffset,
  positiveInt,
} from '@netscript/contracts';

// A single line in a cart.
export const CartItemSchemaV1 = z.object({
  productId: positiveInt({ description: 'Product being added' }),
  quantity: z.number().int().positive().describe('How many'),
});

// The cart status lifecycle.
export const CartStatusSchemaV1 = z.enum(['open', 'checking_out', 'ordered', 'abandoned']);

// A cart, as returned by the API.
export const CartSchemaV1 = z.object({
  id: positiveInt({ description: 'Cart ID' }),
  customerId: z.string().min(1).describe('Owner of the cart'),
  status: CartStatusSchemaV1,
  items: z.array(CartItemSchemaV1).describe('Line items'),
  total: z.number().nonnegative().describe('Computed cart total'),
  createdAt: z.string().datetime(),
});

// Inputs the create/update procedures accept.
export const CreateCartSchemaV1 = z.object({
  customerId: z.string().min(1).describe('Owner of the cart'),
  items: z.array(CartItemSchemaV1).describe('Initial line items'),
});

export const UpdateCartSchemaV1 = z.object({
  id: positiveInt({ description: 'Cart ID to update' }),
  status: CartStatusSchemaV1.optional(),
  items: z.array(CartItemSchemaV1).optional().describe('Replaces existing items'),
});
```

These hand-written schemas play the role the generated `@database/zod` schemas played for products:
they are the runtime validators and the TypeScript types every consumer uses.

Now reduce the scaffolded `CartContractV1` to a single `baseContract` route, the paginated `list`, so
the CLI has a `baseContract` builder to extend in the next step. Keep the trailing `implement()` call
the scaffold generated:

```ts
// contracts/versions/v1/cart.contract.ts (continued)
export const CartContractV1 = {
  // List carts with pagination.
  list: baseContract
    .route({ method: 'GET', path: '/cart' })
    .input(OffsetPaginationQuerySchema.extend({ status: CartStatusSchemaV1.optional() }))
    .output(z.object({
      items: z.array(CartSchemaV1),
      total: nonNegativeInt({ description: 'Total count' }),
      limit: paginationLimit({ description: 'Results per page' }),
      offset: paginationOffset({ description: 'Current offset' }),
      hasMore: z.boolean(),
    })),
};

// implement() makes the contract `.handler()`-bindable — the same ProductsContractV1 → ProductsV1
// convention the generated products contract uses.
export const CartV1 = implement(CartContractV1);
```

## Step 3 — Add the remaining procedures

Add the rest of the cart's surface with the CLI instead of editing the contract object by hand. Each
`contract add-route` call appends a typed route to `CartContractV1` using the `baseContract` builder
you kept in Step 2, so every procedure inherits the typed errors (`NOT_FOUND`, `VALIDATION_ERROR`, …)
from chapter 2:

```sh
netscript contract add-route cart getById \
  --method GET \
  --path /cart/{id} \
  --input "z.object({ id: positiveInt({ description: 'Cart ID' }) })" \
  --output "CartSchemaV1"

netscript contract add-route cart create \
  --method POST \
  --path /cart \
  --input "CreateCartSchemaV1" \
  --output "CartSchemaV1"

netscript contract add-route cart update \
  --method PATCH \
  --path /cart/{id} \
  --input "UpdateCartSchemaV1" \
  --output "CartSchemaV1"
```

Inspect the result as source or as JSON:

```sh
netscript contract inspect cart
netscript contract inspect cart --json
```

`CartContractV1` now has the full surface. The equivalent source is:

```ts
// contracts/versions/v1/cart.contract.ts (CartContractV1, after the CLI additions)
export const CartContractV1 = {
  // List carts with pagination.
  list: baseContract
    .route({ method: 'GET', path: '/cart' })
    .input(OffsetPaginationQuerySchema.extend({ status: CartStatusSchemaV1.optional() }))
    .output(z.object({
      items: z.array(CartSchemaV1),
      total: nonNegativeInt({ description: 'Total count' }),
      limit: paginationLimit({ description: 'Results per page' }),
      offset: paginationOffset({ description: 'Current offset' }),
      hasMore: z.boolean(),
    })),

  // Fetch one cart. @throws NOT_FOUND when the id is unknown.
  getById: baseContract
    .route({ method: 'GET', path: '/cart/{id}' })
    .input(z.object({ id: positiveInt({ description: 'Cart ID' }) }))
    .output(CartSchemaV1),

  // Create a cart. @throws VALIDATION_ERROR when input is invalid.
  create: baseContract
    .route({ method: 'POST', path: '/cart' })
    .input(CreateCartSchemaV1)
    .output(CartSchemaV1),

  // Update status or items. @throws NOT_FOUND, VALIDATION_ERROR.
  update: baseContract
    .route({ method: 'PATCH', path: '/cart/{id}' })
    .input(UpdateCartSchemaV1)
    .output(CartSchemaV1),
};
```

The shape matches `products` and `orders`: a paginated `list`, a `getById` that can throw
`NOT_FOUND`, a `create` that can throw `VALIDATION_ERROR`, and an `update`. The `v1.cart` entry the
scaffold wired into `mod.ts` points at the implemented `CartV1`, so the new procedures are reachable
from the `@my-shop/contracts` barrel and from `@my-shop/contracts/versions/v1` with no extra wiring.

{{ comp.apiTable({ caption: "The cart contract surface", rows: [
  { name: "list", type: "GET /cart", desc: "List carts, optionally filtered by status. Returns items + total + pagination metadata." },
  { name: "getById", type: "GET /cart/{id}", desc: "Fetch one cart by id. Throws the typed NOT_FOUND error when the id is unknown." },
  { name: "create", type: "POST /cart", desc: "Open a new cart for a customer with initial items. Throws VALIDATION_ERROR on bad input." },
  { name: "update", type: "PATCH /cart/{id}", desc: "Change cart status or replace items. The checkout saga (chapter 4) flips status to checking_out." }
] }) }}

## Step 4 — Derive a typed client

A client needs **only the contract** to be fully typed: no running server, no generated SDK, no
hand-written request types. The typed-client packages aren't in the scaffold's import map, so add
them once:

```sh
deno add npm:@orpc/client npm:@orpc/openapi-client
```

Then create a small script:

```ts
// scripts/cart-client.ts
import { createORPCClient } from '@orpc/client';
import { OpenAPILink } from '@orpc/openapi-client/fetch';
import { CartContractV1 } from '@my-shop/contracts/versions/v1';

// The client's type comes entirely from the contract. The REST projection is under /api.
const link = new OpenAPILink(CartContractV1, { url: 'http://localhost:3001/api' });
const client = createORPCClient<typeof CartContractV1>(link);

// `created` is typed as CartSchemaV1 — the editor knows its fields before you run anything.
const created = await client.create({
  customerId: 'cust_1001',
  items: [{ productId: 1, quantity: 2 }],
});

console.log(created.status, created.total);
```

With no cart service implemented yet, your editor already types `created.status` as the
`CartStatusSchemaV1` union and `created.items` as `CartItemSchemaV1[]`. Passing the wrong shape to
`client.create(...)` is a compile error.

{{ comp callout { type: "tip", title: "Implementing the cart is the chapter 2 loop" } }}
This chapter stops at the contract and a typed client. For a running cart service, follow the loop
products used: <code>v1.cart.$context&lt;{ db }&gt;()</code>, bind <code>.handler(...)</code>
functions, aggregate them into a router, and serve it with <code>defineService(...)</code>. See
<a href="/tutorials/storefront/02-catalog-service/">chapter 2</a>.
{{ /comp }}

## Verify your progress

The contract is code, so you verify it by type-checking it together with the typed client that uses
it. From the workspace root:

```sh
deno task check
```

A clean check proves the cart schemas, the routes and the generated `mod.ts` registration line up,
and that `scripts/cart-client.ts` is consistent with `CartContractV1`.

- [ ] `contracts/versions/v1/cart.contract.ts` exists with `list` / `getById` / `create` / `update`.
- [ ] Every route is built from `baseContract`, so it carries the shared typed errors.
- [ ] `netscript contract inspect cart` lists all four procedures.
- [ ] `CartV1` is wired into `contracts/versions/v1/mod.ts` and reachable as `v1.cart`.
- [ ] The typed client in `scripts/cart-client.ts` compiles — `created` is typed without a running
      server.
- [ ] `deno task check` passes.

## What you built

A new `cart` domain defined contract-first: schemas, a `list` / `getById` / `create` / `update`
procedure set and `baseContract` typed errors, modeled on the playground's `orders` contract. The CLI
created the contract and its routes (`netscript contract add` and `contract add-route`) and
regenerated `contracts/versions/v1/mod.ts`, and a typed `@orpc/client` derived from the contract alone
type-checks with no codegen. Next, that contract feeds checkout, which you make reliable with a
durable saga.
