---
layout: layouts/base.vto
title: The storefront page
templateEngine: [vento, md]
prev: { label: "5 · Shipping webhook", href: "/tutorials/storefront/05-shipping-webhook/" }
next: { label: "7 · Deploy", href: "/tutorials/storefront/07-deploy/" }
---

# The storefront page

Every chapter so far built the backend: a typed catalog, a contract-first cart, a durable checkout, a
verified webhook. All of it is reachable by `curl` — and none of it has a face. This chapter puts one
on it, and in doing so closes the loop the whole track has been building toward: **the same oRPC
contract that types the server handler also types the page's query and its checkout mutation.** Write
a wrong field in the browser and it is a compile error, exactly as it is on the server. No second copy
of "what a cart is", no hand-written fetch wrapper, no DTO that drifts.

You will build a customer's cart page as a Fresh route with a **typed route contract**, then drive its
catalog query and its checkout mutation through the SDK's contract-derived query utilities inside an
island. This is the frontend half of NetScript's typed spine — the part the storefront backend never
showed you until now.

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

A `GET /cart/[customer]` page. One **bound route contract** declares its URL pattern, its typed
`{ customer }` path param, and its typed pagination search — so a link to the page and the handler that
answers it can never disagree about its shape. A single clients module exposes a typed
`productsClient` and `cartClient` plus their query utilities, each derived from the chapter-2 and
chapter-3 contracts. An island then reads the catalog with `useIslandQuery` and begins checkout — a
new cart — with `useIslandMutation`, both keyed off those contract-derived helpers. The catalog query
runs live against the `products` service you have had up since chapter 2; the checkout mutation is
typed end to end against the cart contract from chapter 3.

## Prerequisites

- The `products` service on `:3001` (from [chapter 2](/tutorials/storefront/02-catalog-service/)) and
  the `cart` contract and its typed client (from
  [chapter 3](/tutorials/storefront/03-cart-contracts/)).
- `aspire start` up, so the `products` service is discoverable by name (the dashboard answers at
  [https://localhost:18888](https://localhost:18888)).
- The route contract and query utilities are built into `@netscript/fresh/route`,
  `@netscript/sdk/client`, and `@netscript/sdk/query-client`; none needs Aspire to type-check, though
  you run under Aspire to exercise the catalog query live.

{{ comp callout { type: "note", title: "The cart page reuses your Fresh app" } }}
Chapter 1 scaffolded a Fresh app alongside the services — that is where routes and islands live. This
chapter adds files under <code>apps/storefront/</code> (use your app's actual folder name); the
imports are what matter, not the exact path. If you stopped chapter 3 at the contract and never stood
up a running <code>cart</code> service, the checkout mutation still type-checks end to end — the client
is built from the contract alone. Running it live is the same <code>defineService</code> loop chapter
2 used, pointed at the cart handlers.
{{ /comp }}

## Step 1 — Declare the bound route contract

Give the page a typed identity before any UI. A route contract from `@netscript/fresh/route` is the
single source of truth for a route's pattern, its path params, and its search params.
`createRouteReference` infers the `{ customer }` param straight from the pattern; `defineRouteContract`
+ `bindRoutePattern` add typed pagination search with safe defaults. Put it in the shared `contracts/`
tree so the page and any link import the *same* object:

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
`cartRoute.href({ path: { customer } })` builds the URL for a link — so navigation and the handler
that answers it share one definition of the route.

{{ comp.apiTable({
  caption: "@netscript/fresh/route — the bound route contract surface",
  rows: [
    { name: "createRouteReference(pattern)", type: "RouteReference", desc: "Infers typed path params directly from a Fresh route pattern — `/cart/[customer]` yields `{ customer: string }`." },
    { name: "defineRouteContract({ pathSchema?, searchSchema? })", type: "DefineRouteContract", desc: "Declares typed path and search schemas; bind it to one or more concrete patterns." },
    { name: "bindRoutePattern(contract, pattern)", type: "BoundRouteContract", desc: "Binds the contract to a pattern, returning one object with .parsePath / .parseSearch / .href." },
    { name: "paginationSearchSchema(opts) / fallback(schema, default)", type: "search schema", desc: "Typed limit/offset with computed defaults; fallback() catches junk query strings instead of 500-ing the page." }
  ]
}) }}

## Step 2 — One typed clients module

A client needs only a contract to be fully typed. Build one `createServiceClient` per service in a
single module — the "one place all clients live" pattern — and wrap each in
`createServiceQueryUtils`, which turns a client into per-procedure TanStack Query helpers:

```ts
// apps/storefront/lib/api-clients.ts
import { CartContractV1, ProductsContractV1 } from '@my-shop/contracts/versions/v1';
import { createServiceClient } from '@netscript/sdk/client';
import { createServiceQueryUtils } from '@netscript/sdk/query-client';

// One typed client per service. `serviceName` is the discovery key — how the
// client finds the service URL at call time; you never hardcode a port.
export const productsClient = createServiceClient<typeof ProductsContractV1>({
  contract: ProductsContractV1,
  serviceName: 'products',
});
export const cartClient = createServiceClient<typeof CartContractV1>({
  contract: CartContractV1,
  serviceName: 'cart',
});

// Contract-derived query/mutation utilities: one entry per procedure, each with
// a typed queryKey/queryOptions and mutationKey/mutationOptions.
export const productsQueries = createServiceQueryUtils(productsClient);
export const cartQueries = createServiceQueryUtils(cartClient);
```

`productsClient.list(input)` now has the exact signature `ProductsContractV1.list` declared, and
`productsQueries.list.queryOptions({ input })` hands you the **contract-derived cache key** the island
reads and invalidates through. Change a field in the contract and this module re-type-checks — there
is no second definition of a product or a cart to keep in sync.

{{ comp callout { type: "note", title: "How serviceName becomes a URL" } }}
You never write <code>http://localhost:3001</code>. <code>serviceName: 'products'</code> resolves at
call time from an Aspire-injected env var — server-side <code>services__products__http__0</code> and
its browser mirror — so the same client works in a page loader and in a hydrated island. Aspire sets
those when the app lists <code>products</code> as a reference; the client just reads them. Full
mechanics in <a href="/services-sdk/how-to/discover-services/">Discover services</a>.
{{ /comp }}

## Step 3 — Read and mutate in the island

The island is where the typed contract meets the browser. `useIslandQuery` reads the catalog;
`useIslandMutation` begins checkout by creating a cart. Both come from `@netscript/fresh/query` — island
code imports query hooks from there, never from TanStack directly, so the dependency stays
centralized:

```tsx
// apps/storefront/islands/CheckoutIsland.tsx
import {
  QueryIsland,
  useIslandMutation,
  useIslandQuery,
  useQueryClient,
} from '@netscript/fresh/query';
import {
  cartClient,
  cartQueries,
  productsClient,
  productsQueries,
} from '../lib/api-clients.ts';

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
    queryKey: productsQueries.list.queryOptions({ input }).queryKey,
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
      queryClient.invalidateQueries({ queryKey: cartQueries.list.key({ type: 'query' }) }),
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

The moves that make this typed end to end:

- **`queryKey` from the utility, `queryFn` calling the client.** `productsQueries.list.queryOptions(...)`
  computes the same cache key the server uses, so a server-seeded row and a client-refetched row share
  one key. The island hook wants a zero-argument `queryFn`, so you invoke the typed
  `productsClient.list(input)` there — the call is checked against `ProductsContractV1`, not a loose
  `fetch`.
- **`mutationFn` is a typed contract call.** `cartClient.create({ customerId, items })` is checked
  against `CartContractV1.create`; pass an item without a `productId` and it fails `deno task check`,
  not in production.
- **Invalidation is keyed off the contract too.** `cartQueries.list.key({ type: 'query' })` is the
  prefix-matchable cache key for every cart list query, so one line refetches the cart after checkout.

{{ comp callout { type: "note", title: "Why the queryFn wraps the client instead of spreading queryOptions" } }}
The island hooks (<code>useIslandQuery</code>/<code>useIslandMutation</code>) take a deliberately
small option surface with a zero-argument <code>queryFn</code>. The SDK's
<code>queryOptions()</code>/<code>mutationOptions()</code> produce a fuller TanStack shape whose
functions expect a call context, so they are not spread wholesale into the island hooks. You use the
utilities for the parts that must stay contract-derived — the <strong>keys</strong> — and let the
typed client be the function body. Same type source, honest seam.
{{ /comp }}

## Step 4 — Wire the route to the page

The page reads its params **through the contract** and hands the island a typed slice. The route the
Fresh app registers (`/cart/:customer`) and the contract's pattern (`/cart/[customer]`) name the same
segment — `cartRoute.parsePath` bridges them:

```tsx
// apps/storefront/routes/cart/[customer].tsx
import { cartRoute } from '../../../contracts/routes/cart-page.ts';
import CheckoutIsland from '../../islands/CheckoutIsland.tsx';

export default function CartPage(props: { params: { customer: string }; url: URL }) {
  // Typed off the ONE route contract — no hand-parsing the URL.
  const { customer } = cartRoute.parsePath(props.params);
  const { limit, offset } = cartRoute.parseSearch(props.url.searchParams);

  return (
    <main class='ns-page'>
      <h1>Cart for {customer}</h1>
      <CheckoutIsland customer={customer} input={{ limit, offset }} />
    </main>
  );
}
```

`cartRoute.parseSearch` applies the `paginationSearchSchema` defaults, so `/cart/cust_1001` with no
query string still yields a typed `{ limit: 12, offset: 0 }`. A link elsewhere builds the URL with
`cartRoute.href({ path: { customer: 'cust_1001' } })` — the pattern is written once, in the contract.

## Test it out

Type-check first — the whole typed chain is proven by the compiler, no server required:

```sh
# From the workspace root.
deno task check
```

A clean check means the route contract, both service clients, the query utilities, and the island all
line up with the chapter-2 and chapter-3 contracts. Now exercise the **catalog query** live. With
`aspire start` up and at least one product created (chapter 2), the `products` service answers by
discovery, so the page's query returns real rows:

```sh
# The query the island runs, against the live products service.
curl "http://localhost:3001/api/products?page=1&limit=12"
```

You get the page-shaped catalog back — the same `items` the island renders. Open the page in your
Fresh app (the app's port shows in the Aspire dashboard resource list) at `/cart/cust_1001`, and each
product carries an **Add to cart** button wired to the typed checkout mutation.

- [ ] `contracts/routes/cart-page.ts` exports `cartRoute`, a bound route contract with a typed
      `{ customer }` param and pagination search.
- [ ] `apps/storefront/lib/api-clients.ts` exports `productsClient`, `cartClient`, `productsQueries`,
      and `cartQueries`, each derived from a contract.
- [ ] `CheckoutIsland.tsx` reads with `useIslandQuery` and mutates with `useIslandMutation`, keyed off
      the contract-derived helpers.
- [ ] The page reads `customer`, `limit`, and `offset` via `cartRoute.parsePath` / `.parseSearch`, not
      by hand.
- [ ] `deno task check` passes.
- [ ] `curl` against `:3001/api/products` returns the catalog the island renders.

## What you built

- A `GET /cart/[customer]` page whose route is a **bound route contract**: one object owns the pattern,
  the typed `{ customer }` path param, and the pagination search, and it produces both the page's typed
  params and the URL a link would call.
- A single clients module with one typed `createServiceClient` per service, each wrapped in
  `createServiceQueryUtils` — the contract-derived query and mutation helpers.
- An island that **reads** the catalog with `useIslandQuery` and **begins checkout** with
  `useIslandMutation`, both keyed off those helpers, with cache invalidation keyed off the cart
  contract too.

That is the differentiator this chapter exists to prove: the oRPC contract you wrote once on the
backend is the *same* type source for the URL, the query, and the mutation on the frontend — checked
by the compiler from the database to the button, never a second hand-maintained copy that can drift.

## Next Steps

- **Ship it.** [Chapter 7 · Deploy](/tutorials/storefront/07-deploy/) runs the whole storefront —
  services, plugins, and this page — under one `aspire start`.
- **Go cache-first and live.** The [live-dashboard track](/tutorials/live-dashboard/03-sdk-cache-first-query/)
  takes the same query utilities further: KV-backed stale-while-revalidate reads and real-time
  streamed updates.
- **Reference.** The [SDK reference](/reference/sdk/) and [contracts explanation](/explanation/contracts/)
  cover the full typed client-and-query surface.

{{ comp.nextPrev({ prev: { label: "5 · Shipping webhook", href: "/tutorials/storefront/05-shipping-webhook/" }, next: { label: "7 · Deploy", href: "/tutorials/storefront/07-deploy/" } }) }}
