---
layout: layouts/base.vto
title: Request-scoped resources
templateEngine: [vento, md]
order: 13
---

# Request-scoped resources

This page explains `withResource(key, factory)`: a named value that `definePage()` resolves once
while the page pipeline prepares, before any layer runs. Every layer loader, the layout, the
metadata resolver and every later resource read the same resolved value. A dashboard that needs the
signed-in session for its header, its orders table and its totals fetches the session once.

It assumes you know the [builder chain](/web-layer/builders/).

## Compared with bare Fresh

Fresh 2 gives you a request context and nothing above it. To share one session between two regions
of one page, you hand-maintain a `State` interface, load the session in `routes/_middleware.ts`
(the route handler runs too late for a layout to see it), fetch everything else in one
`define.handlers({ GET })` function, and prop-drill the returned `{ data }` bag down to each child
component:

```tsx
// routes/_middleware.ts — bare Fresh
export const handler = define.middleware(async (ctx) => {
  ctx.state.session = await loadSession(ctx.req);
  return await ctx.next();
});

// routes/orders.tsx — bare Fresh
export const handler = define.handlers({
  async GET(ctx) {
    const session = ctx.state.session; // typed only as well as State claims
    const settings = await loadTenantSettings(session.tenantId);
    const orders = await listOrders({ tenantId: session.tenantId, limit: 20 });
    return { data: { session, settings, orders } };
  },
});

export default define.page<typeof handler>(({ data }) => <OrdersView {...data} />);
```

The resource store removes three costs:

- **The state bag is a promise, not a proof.** `ctx.state.session` is typed by whatever `State`
  asserts. Nothing checks that the middleware ran on this route, so a route mounted outside its
  subtree type-checks and throws at runtime.
- **Sharing means memoizing by hand.** When a layout or error handler wants the same session, you
  fetch it again or write a `WeakMap` keyed on `ctx.req`. A partial route arrives as a new `Request`
  and misses that key.
- **Ordering lives in one function.** Dependent fetches are correct only because they sit in the
  right order in one handler body. Split a region out and the guarantee goes with it.

## The mechanism

`definePage()` collects resources as descriptors and resolves them in one place, before any layer
runs. This is the loop, from
`packages/fresh/src/application/builders/define-page/runtime/handlers.ts`:

```ts
const resourceStore: Record<string, unknown> = {};
const resources = resourceStore as DefinePageResourcesOf<TTypes>;

const baseRuntimeCtx = createRuntimeContextBase(ctx, config, resources, controller.signal, path, search);

for (const descriptor of config.resources) {
  resourceStore[descriptor.key] = await withOptionalSpan(
    config,
    `page.resource.${descriptor.key}`,
    { 'page.route': ctx.url.pathname, 'page.resource.key': descriptor.key },
    async () => await descriptor.factory(runtimeCtx),
  );
}
```

The loop has four observable properties:

1. **Params parse first.** `resolvePathParams` and `resolveSearchParams` run before the loop, so
   `ctx.path` and `ctx.search` are already parsed and typed inside every resource factory.
2. **Resources resolve sequentially, in declaration order.** Each one is awaited before the next
   starts, so the order you write the chain in is the dependency order.
3. **They resolve into a shared store.** `ctx.resources` is that record, and `ctx.resource(key)` is a
   synchronous accessor that reads one entry with the key's own type. Every layer loader, the layout
   and the metadata resolver receive the same context, so one declaration means one fetch for any
   number of readers.
4. **Declaration order is a runtime and a type contract.** A factory's context exposes only the
   resources registered earlier in the chain. Read a not-yet-registered key and the value types as
   `never`, so the first property access on it fails `deno check`. Pass that `never` through without
   touching its shape and the type checker stays quiet; the runtime guard covers that case.

Each resolution is wrapped in a `page.resource.<key>` span carrying `page.route` and
`page.resource.key`, unless the page turned telemetry off with `withTelemetry({ enabled: false })`.

The runtime guard is `resolveResource`. It throws when a key is missing from the store:

```text
definePage() could not resolve resource "sesion"
```

Read it as "not yet" as well as "not there": after type erasure, a dynamic key or a cast, an
out-of-order read reaches this check instead of the type checker.

### Where the guarantee stops

The store is built by `prepareRequestState`, and each page-pipeline preparation builds its own. A
custom method handler registered with `withHandler()` prepares its own request state too, so a
`POST` handler that resolves resources and then renders the page resolves them again. "Resolved
once" holds for one page render, not across handlers.

## Shared substrate, local props

Declare the session once; each region takes what it needs from it.

```tsx
export const ordersPage = definePage()
  .withResource('session', async (ctx) => await loadSession(ctx.req))
  .withLayer('header', AccountHeader, {
    loader: async (ctx) => {
      const session = await ctx.resource('session');
      return { name: session.userId, roles: session.roles };
    },
  })
  .withLayer('orders', OrdersTable, {
    loader: async (ctx) => {
      const session = await ctx.resource('session');
      const orders = await listOrders({ tenantId: session.tenantId, limit: 20 });
      return { orders, currency: 'EUR' };
    },
  })
  .build('/orders');
```

`loadSession` runs once. Both loaders get the resolved value, and `ctx.resource('session')` returns
`Session` (not `unknown` or `Session | undefined`) because `withResource` registered the key on the
builder's type state. Misspell the key and the value collapses to `never`, so the loader's first use
of it fails `deno check`.

**Resources are the shared substrate; layers are the per-region refinement.** The header does not
need the tenant id and the table does not need the role list, so each loader narrows the same value
into its own props. Nothing is prop-drilled, because the context carries the value.

## Dependent resources

The session resource is also the *scope* every later fetch runs in. Because resources resolve in
order, a later resource can build on the resolved auth context instead of re-deriving it:

```tsx
export const dependentPage = definePage()
  .withResource('session', async (ctx) => await loadSession(ctx.req))
  .withResource('settings', async (ctx) => {
    const session = await ctx.resource('session');
    return await loadTenantSettings(session.tenantId);
  })
  .withLayer('orders', OrdersTable, {
    loader: async (ctx) => {
      const session = await ctx.resource('session');
      const settings = await ctx.resource('settings');
      const orders = await listOrders({ tenantId: session.tenantId, limit: 20 });
      return { orders, currency: settings.currency };
    },
  })
  .build('/orders');
```

`settings` depends on `session`, and you express that by declaring it second; the `for…of` loop does
the rest. Swap the two lines and `ctx.resource('session')` inside the `settings` factory types as
`never`, so `session.tenantId` fails `deno check` before the page runs.

Tenant scoping, plan-based feature flags and per-user permission sets take the same shape: the
authoritative value resolves once per page-pipeline preparation, and every consumer reads it
instead of re-fetching. Pair it with `withPolicy` when the page's defer behaviour should also depend
on who is asking.

## Route state in resources

Because params parse before the loop, a resource can depend on the route's typed state instead of
raw strings. `ctx.search` is the parsed schema output, so a paginated list resource reads
`ctx.search.limit` and `ctx.search.offset` directly, with no `URLSearchParams.get()`, `Number()` or
clamping in the loader. The orders page in the
[live dashboard tutorial](/tutorials/live-dashboard/04-definePage-QueryIsland/) feeds `ctx.search`
into a cached SDK read that two layers then share.

A URL-aware resource is deduped too: a table and a hydration seed that depend on the same page and
filter read it once per render. The store is not a cache keyed on the URL. It is rebuilt for every
page-pipeline preparation, so changing the filter produces another request and another store.

[Routing and route contracts](/web-layer/route/) covers where the params come from: schemas,
defaults and `paginationSearchSchema()`.

## Grouping independent factories

When several values are unrelated, declare them as one object instead of one call each:

```tsx
export const batchPage = definePage()
  .withResources({
    session: async (ctx) => await loadSession(ctx.req),
    banner: () => Promise.resolve({ message: 'Scheduled maintenance tonight' }),
  })
  .build('/dashboard');
```

`withResources` appends one descriptor per entry, in `Object.entries` order, onto the same
`config.resources` array. It groups declarations; it does **not** run them concurrently. To overlap
two slow, independent fetches, resolve them inside a single resource with `Promise.all` and return
the pair. The trace then shows one span for both.

## Reading resources elsewhere

| Where | How |
| --- | --- |
| Layer loader, layout, metadata resolver | `ctx.resource(key)` / `ctx.resources` |
| Child component of a routed page | the page's `hooks.useResource(key)`, or the standalone `useDefinePageResource(key)` |
| Anywhere you want the whole record | `ctx.resources`, typed as the accumulated key map |

The hooks come from a routed `build()`: a page built with a route pattern exposes `hooks`, which let
a component read a resource without a prop path.

## What to watch for

- **A resource is not a cache.** The store lives for one page-pipeline preparation. For
  cross-request caching, use the SDK's `getCachedEntry()` and the query layer; see
  [Data loading and the query cache](/web-layer/query/).
- **Sequential by design.** Ten resources are ten awaits. Keep the chain short and push parallelism
  inside a factory.
- **Declaration order is API.** Reordering the chain breaks dependent factories, usually at
  `deno check` and otherwise at the runtime guard.
- **Span names are keys.** `page.resource.session` is only as readable as the key you chose; name
  resources after the domain value, not after the call.

## Next steps

Continue with [Layers, layout, and slots](/web-layer/layers/), the concurrent half of the page that
reads these resources. See also [Partials](/web-layer/partials/) to refresh one region without the
page around it.
