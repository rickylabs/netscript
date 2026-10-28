---
layout: layouts/base.vto
title: The storefront page
templateEngine: [vento, md]
prev: { label: "5 · Shipping webhook", href: "/tutorials/storefront/05-shipping-webhook/" }
next: { label: "7 · Deploy", href: "/tutorials/storefront/07-deploy/" }
---

# The storefront page

In this chapter you build a customer's cart page in Fresh. The page has a **typed route contract**,
and an island drives its catalog query and checkout mutation through the SDK's contract-derived query
utilities. **The same oRPC contract that types the server handler also types the page's query and its
checkout mutation**, so a wrong field in the browser is a compile error, as it is on the server.

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

A `GET /cart/[customer]` page:

- one **bound route contract** declares its URL pattern, its typed `{ customer }` path param and its
  typed pagination search, so a link to the page and the handler that answers it can't disagree;
- one module per service exposes a typed `productsClient` and `cartClient` and their query
  utilities, derived from the chapter 2 and chapter 3 contracts;
- an island reads the catalog with `useIslandQuery` and begins checkout, creating a cart, with
  `useIslandMutation`, both keyed off those helpers.

The catalog query runs live against the `products` service from chapter 2. The checkout mutation is
typed end to end against the cart contract from chapter 3.

## Before you begin

- The `products` service on `:3001` from [chapter 2](/tutorials/storefront/02-catalog-service/), and
  the `cart` contract and its typed client from
  [chapter 3](/tutorials/storefront/03-cart-contracts/).
- `aspire start` up, so the `products` service is discoverable by name (the dashboard answers at
  [https://localhost:18888](https://localhost:18888)).
- The route contract and query utilities ship in `@netscript/fresh/route`, `@netscript/sdk/client`
  and `@netscript/sdk/query-client`. None needs Aspire to type-check, but the live catalog query runs
  under Aspire.

{{ comp callout { type: "note", title: "The cart page goes in your Fresh app" } }}
Chapter 1 scaffolded a Fresh app next to the services; routes and islands live there. This chapter
adds files under <code>apps/storefront/</code>: use your app's actual folder name. If you stopped
chapter 3 at the contract and have no running <code>cart</code> service, the checkout mutation still
type-checks end to end, because the client is built from the contract alone. To run it live, serve
the cart handlers with the <code>defineService</code> loop from chapter 2.
{{ /comp }}

## Step 1 — Declare the bound route contract

Give the page a typed identity before any UI. A route contract from `@netscript/fresh/route` is the
single source of truth for a route's pattern, path params and search params. `createRouteReference`
infers the `{ customer }` param from the pattern, and `defineRouteContract` with `bindRoutePattern`
adds typed pagination search with safe defaults. Put it in the shared `contracts/` tree so the page
and every link import the *same* object:

```ts
// contracts/routes/cart-page.ts
import {
  bindRoutePattern,
  createRouteReference,
  defineRouteContract,
  fallback,
  paginationSearchSchema,
} from '@netscript/fresh/route';
import { z } from 'zod';

/** The one place the cart page pattern is written. */
export const CART_PAGE_PATTERN = '/cart/[customer]';

// createRouteReference infers the typed { customer } param from the pattern.
export const cartPageRef = createRouteReference(CART_PAGE_PATTERN);

/**
 * The bound cart page: typed `{ customer }` path param + typed `limit`/`offset`
 * pagination, all inferred from this one declaration.
 */
export const cartRoute = bindRoutePattern(
  defineRouteContract({
    pathSchema: z.object({ customer: z.string().min(1) }),
    searchSchema: paginationSearchSchema({ defaultLimit: 12 }).extend({
      // A junk ?highlight= falls back to undefined instead of throwing.
      highlight: fallback(z.string().optional(), undefined),
    }),
  }),
  CART_PAGE_PATTERN,
);
```

`bindRoutePattern` returns one object with everything downstream needs: `cartRoute.parsePath(...)` and
`cartRoute.parseSearch(...)` turn raw request params into typed values, and
`cartRoute.href({ path: { customer } })` builds the URL for a link. Navigation and the handler share
one definition of the route.

{{ comp.apiTable({
  caption: "@netscript/fresh/route — the bound route contract surface",
  rows: [
    { name: "createRouteReference(pattern)", type: "RouteReference", desc: "Infers typed path params directly from a Fresh route pattern — `/cart/[customer]` yields `{ customer: string }`." },
    { name: "defineRouteContract({ pathSchema?, searchSchema? })", type: "DefineRouteContract", desc: "Declares typed path and search schemas; bind it to one or more concrete patterns." },
    { name: "bindRoutePattern(contract, pattern)", type: "BoundRouteContract", desc: "Binds the contract to a pattern, returning one object with .parsePath / .parseSearch / .href." },
    { name: "paginationSearchSchema(opts) / fallback(schema, default)", type: "search schema", desc: "Typed limit/offset with computed defaults; fallback() catches junk query strings instead of 500-ing the page." }
  ]
}) }}

## Step 2 — One typed module per service

A client needs only a contract to be fully typed. Keep each service's client and its cache-aware query
factory together in `lib/<service>.ts`, the layout `service add <name> --with-client` generates:

```ts
// apps/storefront/lib/products.ts
import { ProductsContractV1 } from '@my-shop/contracts/versions/v1';
import { createServiceClient } from '@netscript/sdk/client';
import { createQueryFactories } from '@netscript/sdk/query';

// One typed client per service. `serviceName` is the discovery key — how the
// client finds the service URL at call time; you never hardcode a port.
export const productsClient = createServiceClient<typeof ProductsContractV1>({
  contract: ProductsContractV1,
  serviceName: 'products',
});
export const productsQueries = createQueryFactories({
  products: { contract: ProductsContractV1, client: productsClient },
}).products;

// apps/storefront/lib/cart.ts follows the same generated shape:
// cartClient + createQueryFactories({ cart: ... }).cart → cartQueries.
```

`productsClient.list(input)` has the exact signature `ProductsContractV1.list` declares, and
`productsQueries.list.queryOptions(input)` gives you the **contract-derived cache key** the island
reads and invalidates through. Change a field in the contract and this module re-type-checks.

{{ comp callout { type: "note", title: "How serviceName becomes a URL" } }}
You never write <code>http://localhost:3001</code>. <code>serviceName: 'products'</code> resolves at
call time from an Aspire-injected environment variable, <code>services__products__http__0</code> on
the server and its browser mirror in the client, so the same client works in a page loader and in a
hydrated island. Aspire sets those variables when the app lists <code>products</code> as a reference.
See <a href="/services-sdk/how-to/discover-services/">Discover services</a>.
{{ /comp }}

## Step 3 — Read and mutate in the island

In the island, `useIslandQuery` reads the catalog and `useIslandMutation` begins checkout by creating
a cart. Both come from `@netscript/fresh/query`; island code imports query hooks from there, never
from TanStack directly, so the dependency stays in one place:

```tsx
// apps/storefront/islands/CheckoutIsland.tsx
import {
  QueryIsland,
  useIslandMutation,
  useIslandQuery,
  useQueryClient,
} from '@netscript/fresh/query';
import { cartClient, cartQueries } from '../lib/cart.ts';
import { productsClient, productsQueries } from '../lib/products.ts';

interface CheckoutIslandProps {
  customer: string;
  input: { limit: number; offset: number };
  initialProducts?: { items: Array<{ id: number; name: string }> };
}

function CheckoutInner({ customer, input, initialProducts }: CheckoutIslandProps) {
  const queryClient = useQueryClient();

  // READ — the catalog. The util gives the contract-derived cache key; the typed
  // client makes the call. initialData seeds the first paint from a server loader.
  const catalog = useIslandQuery({
    queryKey: productsQueries.list.queryOptions(input).queryKey,
    queryFn: () => productsClient.list(input),
    initialData: initialProducts,
    staleTime: 10_000,
  });

  // WRITE — begin checkout by creating the customer's cart, typed off CartContractV1.
  // On success, invalidate the cart's query key so any cart view refetches.
  const checkout = useIslandMutation({
    mutationFn: (line: { productId: number; quantity: number }) =>
      cartClient.create({ customerId: customer, items: [line] }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: cartQueries.list.clientKey() }),
  });

  const products = catalog.data?.items ?? [];
  return (
    <ul class='ns-stack'>
      {products.map((product) => (
        <li key={product.id}>
          <span>{product.name}</span>
          <button
            type='button'
            disabled={checkout.isPending}
            onClick={() => checkout.mutate({ productId: product.id, quantity: 1 })}
          >
            {checkout.isPending ? 'Adding…' : 'Add to cart'}
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function CheckoutIsland(props: CheckoutIslandProps) {
  return (
    <QueryIsland>
      <CheckoutInner {...props} />
    </QueryIsland>
  );
}
```

What keeps this typed end to end:

- **`queryKey` from the utility, `queryFn` calling the client.** `productsQueries.list.queryOptions(...)`
  computes the same cache key the server uses, so a server-seeded row and a client-refetched row share
  one key. The island hook wants a zero-argument `queryFn`, so you call the typed
  `productsClient.list(input)` there, checked against `ProductsContractV1`.
- **`mutationFn` is a typed contract call.** `cartClient.create({ customerId, items })` is checked
  against `CartContractV1.create`; an item without a `productId` fails `deno task check`.
- **Invalidation is keyed off the contract.** `cartQueries.list.clientKey()` is the prefix-matchable
  cache key for every cart list query, so one line refetches the cart after checkout.

{{ comp callout { type: "note", title: "Why the queryFn wraps the client" } }}
The island hooks (<code>useIslandQuery</code>/<code>useIslandMutation</code>) take a small option
surface with a zero-argument <code>queryFn</code>. The SDK's
<code>queryOptions()</code>/<code>mutationOptions()</code> produce a fuller TanStack shape whose
functions expect a call context, so you don't spread them into the island hooks. Use the utilities
for the parts that must stay contract-derived, the <strong>keys</strong>, and make the typed client
the function body.
{{ /comp }}

Adding to a cart is a widget event, so it lives in the island. A checkout that collects an address
and then navigates is a page event: `definePage().withForm()` owns the validation, the error round
trip and the CSRF token, so the page works without JavaScript.
[Server-validated forms](/web-layer/form/) covers the split and the pipeline behind it.

## Step 4 — Wire the route to the page

Build the page with NetScript's fluent `definePage` builder. Binding it to the `cartRoute` contract
types `ctx.path` and `ctx.search` throughout the pipeline. `.withResource()` registers a value
resolved once per request; see [Request-scoped resources](/web-layer/resources/) for what "once"
guarantees:

```tsx
// apps/storefront/routes/cart/[customer].tsx
import { definePage } from '@app/utils.ts';
import { cartRoute } from '../../../contracts/routes/cart-page.ts';
import CheckoutIsland from '../../islands/CheckoutIsland.tsx';
import { productsClient } from '../../lib/products.ts';

const cartPage = definePage()
  .withRoute(cartRoute)
  .withResource('initialProducts', async (ctx) => {
    // Resolve the first page of products on the server side
    const input = { limit: ctx.search.limit, offset: ctx.search.offset };
    return await productsClient.list(input);
  })
  .withLayer('checkout', CheckoutIsland, {
    loader: async (ctx) => ({
      customer: ctx.path.customer,
      input: { limit: ctx.search.limit, offset: ctx.search.offset },
      initialProducts: await ctx.resource('initialProducts'),
    }),
  })
  .withLayout((slots, ctx) => (
    <main class='ns-page'>
      <h1>Cart for {ctx.path.customer}</h1>
      {slots.checkout()}
    </main>
  ))
  .build();

export default cartPage.default;
```

`definePage` comes from `@app/utils.ts`, the module chapter 1's scaffold wrote. It re-exports the
builder bound to your app's `State` type, so every page shares one typed context.

`.withRoute(cartRoute)` hands the contract's schemas to the builder, so parsing happens before your
loader runs: `ctx.path.customer` is a typed string, and `ctx.search` carries the
`paginationSearchSchema` defaults, so `/cart/cust_1001` with no query string yields
`{ limit: 12, offset: 0 }`. A link elsewhere builds the URL with
`cartRoute.href({ path: { customer: 'cust_1001' } })`, so the pattern is written once, in the
contract.

## Verify your progress

Type-check first. The compiler proves the whole typed chain without a server:

```sh
# From the workspace root.
deno task check
```

A clean check means the route contract, both service clients, the query utilities and the island line
up with the chapter 2 and chapter 3 contracts. Then run the **catalog query** live. With
`aspire start` up and at least one product created in chapter 2, the `products` service answers by
discovery and the page's query returns real rows:

```sh
# The query the island runs, against the live products service.
curl "http://localhost:3001/api/products?page=1&limit=12"
```

You get the page-shaped catalog back, the same `items` the island renders. Open `/cart/cust_1001` in
your Fresh app (its port is in the Aspire dashboard resource list): each product has an **Add to
cart** button wired to the typed checkout mutation.

- [ ] `contracts/routes/cart-page.ts` exports `cartRoute`, a bound route contract with a typed
      `{ customer }` param and pagination search.
- [ ] `apps/storefront/lib/products.ts` and `lib/cart.ts` export their service-derived clients and
      query factories.
- [ ] `CheckoutIsland.tsx` reads with `useIslandQuery` and mutates with `useIslandMutation`, keyed off
      the contract-derived helpers.
- [ ] The page binds to the contract and loads initial products using `definePage` and a layer loader.
- [ ] `deno task check` passes.
- [ ] `curl` against `:3001/api/products` returns the catalog the island renders.

## What you built

A `GET /cart/[customer]` page whose route is a **bound route contract**, built with `definePage`: it
resolves the first page of products on the server and mounts the checkout island as a layer. One
module per service wraps a typed `createServiceClient` in `createQueryFactories`, and the island
reads with `useIslandQuery` and begins checkout with `useIslandMutation`, all keyed off the same
contracts as the backend. The [live-dashboard track](/tutorials/live-dashboard/03-sdk-cache-first-query/)
takes these query utilities further, with cache-first reads and streamed updates. Next, you run the
whole storefront under one `aspire start`.
