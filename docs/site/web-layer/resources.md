---
layout: layouts/base.vto
title: Request-scoped resources
templateEngine: [vento, md]
order: 13
---

# Request-scoped resources

A page is rarely one query. A dashboard route wants the signed-in session for its header, the same
session's tenant id to scope the orders table, and the tenant's currency to format the totals. Three
regions, one request, and — if you fetch inside each region — three round trips for data that could
not have changed between them.

`withResource(key, factory)` is `definePage()`'s answer: a named value computed **once per request**
and readable by every layer loader, the layout, the metadata resolver, and every later resource. This
page is about that mechanism — what the runtime actually does, what it costs you in bare Fresh, and
the four patterns worth learning by name.

The builder-chain overview lives in [Pages and the define-page builder](/web-layer/builders/); this
page assumes it.

## What bare Fresh makes you write

Fresh 2 gives you a request context and nothing above it. To share one session between two regions of
one page you write, at minimum:

1. A `State` interface in `utils.ts`, hand-maintained, listing everything you intend to stash on
   `ctx.state`.
2. A `routes/_middleware.ts` that loads the session and assigns `ctx.state.session`, because the
   route handler runs too late for a layout to see it.
3. A `define.handlers({ async GET(ctx) { … } })` in the route module that fetches everything else the
   page needs, in one function, in hand-sequenced `await` order.
4. `ctx.render({ … })` with a single props bag, then prop-drilling that bag from `define.page()` down
   through each child component that needs a slice of it.

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

Three things are worth naming precisely, because they are the costs the resource store removes.

**The state bag is a promise, not a proof.** `ctx.state.session` is typed by whatever the `State`
interface asserts. Nothing checks that the middleware which populates it actually ran on this route,
so a route mounted outside that middleware's subtree type-checks fine and throws at runtime.

**Sharing across a boundary means memoizing by hand.** The moment a second thing — a layout, a
sibling partial route, an error page — wants the same session, you either fetch it again or write a
request-scoped memo yourself: a `WeakMap` keyed on `ctx.req`, plus the discipline to route every
caller through it.

**Ordering lives in one function.** Dependent fetches are correct only because they sit in the right
order inside a single handler body. Split a region out and the ordering guarantee goes with it.

## The mechanism

`definePage()` collects resources as descriptors and resolves them in one place, before any layer
runs. This is the whole of it, from
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

Four facts follow from those ten lines, and they are the whole contract:

1. **Params parse first.** `resolvePathParams` and `resolveSearchParams` run before the loop, so
   `ctx.path` and `ctx.search` are already typed and parsed inside every resource factory. A resource
   is URL-aware for free.
2. **Resources resolve sequentially, in declaration order,** each one awaited before the next starts.
   The order you write the chain in *is* the dependency order.
3. **They resolve into a shared store** that the runtime context wraps. `ctx.resources` is that
   record; `ctx.resource(key)` reads one entry from it with the key's own type. Every layer loader,
   the layout, and the metadata resolver receive the same context — so the store is the request-scoped
   dedup. One declaration, one fetch, N readers.
4. **Each resource is span-wrapped** as `page.resource.<key>`, carrying `page.route` and
   `page.resource.key`. Dedup you cannot observe is a claim; this one shows up once per request in the
   trace.

Reading a key that has not resolved yet — a typo, or a resource declared *after* the one reading it —
throws from `resolveResource`:

```text
definePage() could not resolve resource "sesion"
```

That is a runtime error rather than a type error, and it is the one sharp edge of the declaration-order
contract. Read the message as "not yet", not only as "not there".

## Pattern 1 — one resource, every layer

The canonical shape. Declare the session once; each region takes what it needs from it.

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
`Session` — not `unknown`, not `Session | undefined` — because the key was registered on the builder's
type state by `withResource`. Misspell the key and it is a compile error; the runtime throw above is
reserved for the ordering case a type cannot see.

This is also the division of labour worth internalising: **resources are the shared substrate, layers
are the per-region refinement.** The header does not need the tenant id and the table does not need
the role list; each loader narrows the same resolved value into its own props. Nothing is drilled,
because nothing is passed — the context is the transport.

## Pattern 2 — auth- and context-aware queries

The session resource is not only data, it is the *scope* every later fetch runs in. Because resources
resolve in order, a later resource can build on the resolved auth context rather than re-deriving it:

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

`settings` depends on `session`, and that dependency is expressed by writing it second — the `for…of`
loop guarantees the rest. Swap the two lines and you get the `could not resolve resource` throw, which
is why declaration order deserves a comment in pages with more than two dependent resources.

Tenant scoping, feature flags keyed on a plan, and per-user permission sets all take this shape: the
authoritative value is resolved once at the top of the request, and every consumer downstream is
reading, not re-fetching. Pair it with `withPolicy` when the page's defer behaviour should also depend
on who is asking.

## Pattern 3 — URL-aware resources

Because params parse before the loop, a resource can be a function of the route's typed state rather
than of raw strings. `ctx.search` is the parsed schema output, so a paginated list resource reads
`ctx.search.limit` and `ctx.search.offset` directly — no `URLSearchParams.get()`, no `Number()`, no
clamping in the loader. The scaffolded orders page in the
[live dashboard tutorial](/tutorials/live-dashboard/04-definePage-QueryIsland/) does exactly this,
feeding `ctx.search` into a cached SDK read that two layers then share.

The consequence worth stating: a URL-aware resource is *also* deduped. A page whose table and whose
hydration seed both depend on the same page-and-filter combination reads it once, and changing the
filter in the URL is what invalidates it — the request boundary is the cache boundary.

Where the params themselves come from — schemas, defaults, `paginationSearchSchema()` — is
[Routing and route contracts](/web-layer/route/).

## Pattern 4 — `withResources` for independent values

When several values have no relationship to each other, declare them as one object instead of one
call per line:

```tsx
export const batchPage = definePage()
  .withResources({
    session: async (ctx) => await loadSession(ctx.req),
    banner: () => Promise.resolve({ message: 'Scheduled maintenance tonight' }),
  })
  .build('/dashboard');
```

`withResources` appends one descriptor per entry, in `Object.entries` order, onto the same
`config.resources` array. It is a grouping convenience, **not** a concurrency primitive: the runtime
loop still awaits them one at a time. If two genuinely independent fetches are both slow, resolve them
inside a single resource with `Promise.all` and return the pair — that is the only way to overlap
them today, and it keeps the trace honest, since you will see one span instead of two.

## Reading resources elsewhere

| Where | How |
| --- | --- |
| Layer loader, layout, metadata resolver | `ctx.resource(key)` / `ctx.resources` |
| Child component of a routed page | the page's `hooks.useResource(key)`, or the standalone `useDefinePageResource(key)` |
| Anywhere you want the whole record | `ctx.resources`, typed as the accumulated key map |

The hooks come from a routed `build()` — a page built with a route pattern exposes `hooks`, and those
hooks are how a component reads a resource without a prop path. The full hook list is in
[Pages and the define-page builder](/web-layer/builders/).

## What to watch for

- **A resource is not a cache.** It lives for exactly one request. Cross-request caching is the SDK's
  `getCachedEntry()` and the query layer — see
  [Data loading and the query cache](/web-layer/query/).
- **Sequential by design.** Ten resources are ten awaits. Keep the chain short and push parallelism
  inside a factory.
- **Declaration order is API.** Reordering the chain can break a dependent resource at runtime with no
  type-level warning.
- **Span names are keys.** `page.resource.session` is only as readable as the key you chose; name
  resources after the domain value, not after the call.

## Related

{{ comp.cardsGrid({ columns: 3, cards: [
  { title: "Pages and the define-page builder", body: "The full builder chain this page zooms into.", href: "/web-layer/builders/" },
  { title: "Partials and deferred regions", body: "Refresh one region without the page around it.", href: "/web-layer/partials/" },
  { title: "Routing and route contracts", body: "Where ctx.path and ctx.search come from.", href: "/web-layer/route/" },
  { title: "Data loading and the query cache", body: "Caching that outlives a single request.", href: "/web-layer/query/" },
  { title: "Live dashboard tutorial", body: "Resources, layers, and a QueryIsland end to end.", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" },
  { title: "Testing pages", body: "Assert on a built page definition.", href: "/web-layer/testing/" }
] }) }}

See the [Web Layer overview](/web-layer/) for the full pillar map.
