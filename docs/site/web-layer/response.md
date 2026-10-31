---
layout: layouts/base.vto
title: Response shaping
templateEngine: [vento, md]
order: 5
---

# Response shaping

This page covers what a page produces besides its markup: the `<head>` block, the status code, the
response headers, and the HTTP methods it answers. Builder methods decide these after the layers
resolve, and `build()` synthesises a `GET` handler from them. It decides at build time whether the
page needs a handler at all, so the wrong combination of methods fails with one of three errors,
sometimes naming a method you did not call.

It assumes you know the [builder chain](/web-layer/builders/).

## Compared with bare Fresh

For one page, Fresh's own answer is adequate:

```tsx
// routes/orders.tsx — bare Fresh
export const handler = define.handlers({
  async GET(ctx) {
    const session = ctx.state.session;
    const orders = await listOrders({ tenantId: session.tenantId, limit: 20 });
    return ctx.render(
      <>
        <Head>
          <title>Orders ({orders.length})</title>
          <meta name='description' content='Every order for the current tenant.' />
        </Head>
        <OrdersTable orders={orders} />
      </>,
      {
        status: 200,
        headers: {
          'cache-control': 'private, max-age=0, must-revalidate',
          'x-tenant': session.tenantId,
        },
      },
    );
  },
});
```

`ctx.render(vnode, init)` takes a `ResponseInit`, so status and headers are one object literal. The
costs appear as the app grows:

- **Shaping a response changes the module's shape.** A `define.page()` that needs one header must
  become a `define.handlers({ GET })` that renders explicitly.
- **Headers do not merge at the region level.** Handlers and middleware can set headers, but a
  rendered region cannot contribute its own. A form that needs `Set-Cookie` depends on a handler or
  middleware that knows the region exists.
- **Metadata is placement, not resolution.** `<Head>` only sees values in scope where you put it, so
  titles that depend on loaded data are drilled down to it, or `<Head>` is hoisted up to the data.

## The mechanism: a synthesised GET

`build()` inspects the config and picks one of three shapes. From
`packages/fresh/src/application/builders/define-page/builder/mod.tsx`:

```ts
if (config.streaming) {
  if (config.handlers.GET) { throw new Error(/* … */); }
  builtHandlers.GET = /* streaming response */;
} else if (config.headers.length > 0 || config.status !== undefined) {
  if (config.handlers.GET) { throw new Error(/* … */); }
  builtHandlers.GET = /* ctx.render() with headers and status */;
}
const handler = Object.keys(builtHandlers).length > 0 ? builtHandlers : undefined;
```

As a table:

| The page declares | `build()` produces |
| --- | --- |
| neither headers, status, nor streaming | `handler` is `undefined`; Fresh renders `default` |
| `withHeader()` and/or `withStatus()` | a `GET` handler that calls `ctx.render(page, { headers, status })` |
| `withStreaming()` | a `GET` handler returning a streaming `Response`, carrying the headers and status too |
| any of the above **plus** an explicit `withHandler('GET')` | a throw at `build()` |

The three error messages, verbatim:

```text
definePage() cannot combine withHandler("GET") with withStreaming().
definePage() cannot combine withHandler("GET") with withHeader() or withStatus().
definePage() requires ctx.render() when withHeader() or withStatus() is used.
```

The first two fire at `build()`, which is module load rather than request time. The third fires per
request, when the synthesised handler receives a context without a `render` method.

{{ comp callout { type: "warning", title: "withForm() makes a page a shaped page" } }}
<code>withForm</code> appends a CSRF header resolver to <code>config.headers</code> unless you pass
<code>csrf: false</code>. That takes the headers branch, so <strong>every form page has a synthesised
<code>GET</code> that requires <code>ctx.render()</code></strong>. Adding
<code>withHandler('GET')</code> to a form page throws
<em>cannot combine withHandler("GET") with withHeader() or withStatus()</em>, naming two methods you
never called. A custom <code>GET</code> on a form page needs the form's cookie to come from
somewhere else.
{{ /comp }}

Only `GET` is affected. A `withHandler('POST')` coexists with `withStatus()` and `withHeader()`: the
built handler map holds both the POST you wrote and the GET the builder synthesised.

## `withMeta`: a resolver, not a placement

`withMeta(resolver)` registers a synchronous or asynchronous resolver that runs **after** every layer
has resolved, so it can read what they produced:

```tsx
.withMeta((ctx) => ({
  title: `Orders (${ctx.layerData.orders?.orders.length ?? 0})`,
  description: 'Every order for the current tenant.',
  canonicalUrl: new URL(ctx.url.pathname, 'https://app.example.com').href,
}))
```

By then `ctx.layerData` holds the same values a layout sees, and `ctx.resource(key)` and the parsed
`ctx.path` / `ctx.search` are available. The resolver returns a descriptor with seven optional
fields, which the runtime renders into a Fresh `<Head>`:

| Field | Emits |
| --- | --- |
| `title` | `<title>` |
| `description` | `<meta name="description">` |
| `robots` | `<meta name="robots">` |
| `canonicalUrl` | `<link rel="canonical">` |
| `meta` | one `<meta>` per entry, with `name` or `property` |
| `links` | one `<link>` per entry, with `rel`, `href`, and optional `title` / `type` |
| `jsonLd` | one `<script type="application/ld+json">` per entry, `JSON.stringify`d |

`jsonLd` accepts a single value or an array; both produce script tags. The head block is prepended to
the page body, so it composes with whatever `routes/_app.tsx` renders.

Layer props are `Partial` on `ctx.layerData` (a region that produced no data has no entry), so read
them with `?.` and a default, as above. A title computed from a region that failed to load then
degrades instead of throwing.

## `withHeader`: three overloads, merged in order

`resolveHeaderDescriptor` normalises three call shapes into one descriptor list. The list resolves
in declaration order, and later entries override earlier ones:

```tsx
.withHeader('cache-control', 'private, max-age=0, must-revalidate')     // name + value
.withHeader({ 'x-page-type': 'orders', 'x-api-version': '1' })          // a HeadersInit map
.withHeader((ctx) => ({ 'x-tenant': ctx.resource('session').tenantId })) // computed per request
```

The resolver form receives the same context the layout and `withMeta` see, so a header can depend on
a resource or on resolved layer data. Static and computed descriptors resolve together with
`Promise.all` and merge with `Headers.set`, so **the last writer wins per header name**, not per call:
a map that repeats a name set by an earlier string pair replaces it.

The three overloads are declared separately, so the string form requires its value:
`withHeader('x-thing')` alone does not compile, because a bare string matches neither `HeadersInit`
nor a resolver.

## `withStatus`: the page's default GET status

`withStatus(status)` sets the status the synthesised `GET` renders with. It applies to that handler
only; a `withHandler('POST')` returns whatever `Response` you build. The common use is a page that
renders a real body under a non-200 code:

```tsx
export const orderDetailPage = definePage()
  .withPathParams(z.object({ id: z.string() }))
  .withLayer('order', OrderView, {
    loader: async (ctx) => {
      const order = await loadOrder(ctx.path.id);
      return order ? { order } : null;
    },
    fallback: <p>No such order.</p>,
  })
  .withStatus(404)
  .build('/orders/[id]');
```

The status is fixed at build time, not chosen per request. A page that returns 200 or 404 depending
on what it found needs a `withHandler` that returns its own `Response`, or a redirect from a
middleware.

## `withPolicy` and `withStreaming`

`withPolicy(policy)` sets the page-level defer policy: a named profile (`'balanced'`,
`'aggressive-first-paint'`, `'background-refresh'`, `'low-bandwidth'`) or an object overriding
individual fields. It is a **default**: the runtime reads `descriptor.config.policy ?? config.policy`,
so a layer that names its own `policy` wins for that region. Set it at page level when several
regions should share the same freshness behaviour.
[Deferred and streaming UI](/web-layer/defer-streaming-ui/#the-policy-engine) tabulates what each
profile sets.

The policy governs reads; it does not make writes coherent. After a mutation commits, await
`invalidateServerQueryCache(action.key(input))` to clear the server CacheProvider entry, then
invalidate the matching island QueryClient key. Order matters under `balanced`: if the browser
reloads before the server tier is cleared, the cache-first policy can paint the value the write just
made stale. `defineFreshApp()` owns the standard invalidation route, so you do not need a bespoke
proxy handler.

`withStreaming()` opts the page into builder-owned HTML streaming. It only affects layers that also
declare `delivery: 'stream'`. Both flags are required, and neither warns when the other is missing.
The streaming handler still applies the page's headers and status. See
[Layers, layout, and slots](/web-layer/layers/) for the layer half.

## What `build()` returns

`build()` has three call shapes. They differ in whether the result knows its own route:

```tsx
const unrouted = definePage().build();                              // page, default, handler
const routed = definePage().build('/orders/[id]');                  // + nav, route, hooks
const alsoRouted = definePage().build({ routePattern: '/orders/[id]' });
```

An unrouted definition is `{ page, default, handler }`. A routed one adds `nav` (the typed href
builder), `route` (the bound `RouteReference`, so `route.href({ path: { id: '7' } })` yields
`/orders/7`) and `hooks` (the eleven page-bound hooks). A page bound with `withRoute()` or
`withRouteContract()` is already routed, so its bare `build()` returns the routed shape; the Vite
plugin's generated binding relies on this. See
[Routing and route contracts](/web-layer/route/#three-authoring-forms-one-generated-binding).

Route modules export the built page:

```tsx
export const { handler, default: page } = ordersPage;
export { page as default };
```

On an unshaped page `handler` is `undefined`, and Fresh renders the default export.

## Custom handlers

`withHandler(method, handler)` registers a handler for `'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' |
'OPTIONS' | 'HEAD'`. The builder wraps it so params are parsed and resources resolved before your code
runs:

```tsx
.withHandler('POST', async (ctx) => {
  const session = await ctx.resource('session');
  return Response.json({ tenantId: session.tenantId });
})
```

The wrapper does **not** run the layers. `ctx.layerData` is `{}` inside a custom handler and no
layer loader fires, so a handler that needs a region's data loads it itself. The handler may return a
`Response` or a `{ data }` object.

A custom handler also prepares its **own** request state, including its own resource store. A `POST`
handler that resolves resources and then triggers a page render resolves them twice; see
[Request-scoped resources](/web-layer/resources/).

## Putting it together

```tsx
export const ordersPage = definePage()
  .withResource('session', async (ctx) => await loadSession(ctx.req))
  .withLayer('orders', OrdersTable, {
    loader: async (ctx) => {
      const session = await ctx.resource('session');
      return { orders: await listOrders({ tenantId: session.tenantId, limit: 20 }) };
    },
  })
  .withMeta((ctx) => ({
    title: `Orders (${ctx.layerData.orders?.orders.length ?? 0})`,
    description: 'Every order for the current tenant.',
    canonicalUrl: new URL(ctx.url.pathname, 'https://app.example.com').href,
  }))
  .withHeader('cache-control', 'private, max-age=0, must-revalidate')
  .withHeader((ctx) => ({ 'x-tenant': ctx.resource('session').tenantId }))
  .withStatus(200)
  .build('/orders');
```

Per request, the session resolves, the layer loads and renders, the meta resolver reads the layer's
props to build the title, both header descriptors resolve against the same context, and the
synthesised `GET` calls `ctx.render()` with the merged headers and the status.

## What to watch for

- **The error names the method the builder saw, not the one you wrote.** `withForm` contributes a
  header, so its pages report a `withHeader()` conflict.
- **`withHeader` and `withStatus` require a render-capable context.** A handler invoked outside
  Fresh's rendering path throws per request; in tests, supply a `render` function.
- **Streaming is checked first.** A page with streaming, headers and a `GET` handler reports the
  streaming conflict; fixing it surfaces the header conflict next.
- **Status is per page, not per request.** Conditional status codes need a custom handler.
- **Header merging is per name, not per call.** A later map silently replaces a name an earlier call
  set.
- **Meta reads layer data, and layer data is partial.** Guard the read.

## Next steps

Continue with [Deferred and streaming UI](/web-layer/defer-streaming-ui/) to choose a `withPolicy`
profile. See also [Server-validated forms](/web-layer/form/) for the header resolver `withForm`
installs.
