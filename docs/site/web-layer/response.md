---
layout: layouts/base.vto
title: Response shaping
templateEngine: [vento, md]
order: 17
---

# Response shaping

Everything a page produces beyond its markup — the `<head>` block, the status code, the response
headers, and which HTTP methods it answers — is decided after the layers resolve, by five builder
methods and the `GET` handler the builder synthesises from them.

That synthesis is the part worth understanding. `definePage()` does not hand you a handler and let you
mutate its response; it decides, at `build()` time, whether the page needs a handler at all and what
that handler must be able to do. Get that wrong and you meet one of three errors with a message that
names a method you may not have called. This page is about which combinations produce which handler,
and why.

The builder-chain overview lives in [Pages and the define-page builder](/web-layer/builders/); this
page assumes it.

## What bare Fresh makes you write

Fresh's own answer is direct and, for one page, entirely adequate:

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

`ctx.render(vnode, init)` takes a `ResponseInit`, so status and headers are one object literal. Three
costs show up as the app grows rather than in this snippet.

**Shaping a response changes the module's shape.** A page that renders with `define.page()` and needs
one header must become a `define.handlers({ GET })` that renders explicitly. The rendering and the
shaping are the same expression, so you cannot add a header without taking ownership of the render.

**Headers have no merge point.** Everything contributing a header — a cache directive, a tenant tag, a
form's CSRF cookie — has to be assembled into one literal by the same function. There is nowhere for a
region to contribute one, so a form that needs `Set-Cookie` either reaches into that literal or sets
the cookie somewhere else entirely.

**Metadata is placement, not resolution.** `<Head>` renders where you put it, which means it can only
see values already in scope at that point in the tree. Titles that depend on loaded data are drilled
down to wherever `<Head>` sits, or the `<Head>` is hoisted to wherever the data is.

## The mechanism: a synthesised GET

`build()` inspects the config and decides which of three shapes the page has. From
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

Read as a table:

| The page declares | `build()` produces |
| --- | --- |
| neither headers, status, nor streaming | `handler` is `undefined`; Fresh renders `default` |
| `withHeader()` and/or `withStatus()` | a `GET` handler that calls `ctx.render(page, { headers, status })` |
| `withStreaming()` | a `GET` handler returning a streaming `Response`, carrying the headers and status too |
| any of the above **plus** an explicit `withHandler('GET')` | a throw at `build()` |

The three messages are verbatim, and worth searching for as strings:

```text
definePage() cannot combine withHandler("GET") with withStreaming().
definePage() cannot combine withHandler("GET") with withHeader() or withStatus().
definePage() requires ctx.render() when withHeader() or withStatus() is used.
```

The first two fire at `build()` — module load, not request time. The third fires per request, when the
synthesised handler receives a context without a `render` method.

{{ comp callout { type: "warning", title: "withForm() makes a page a shaped page" } }}
<code>withForm</code> appends a CSRF header resolver to <code>config.headers</code> unless you passed
<code>csrf: false</code>. That is enough to take the headers branch, so <strong>every form page has a
synthesised <code>GET</code> that requires <code>ctx.render()</code></strong> — and adding
<code>withHandler('GET')</code> to a form page throws
<em>cannot combine withHandler("GET") with withHeader() or withStatus()</em>, naming two methods you
never called. If you need a custom <code>GET</code> on a form page, the form's cookie has to come from
somewhere else.
{{ /comp }}

Only `GET` is affected. A `withHandler('POST')` coexists with `withStatus()` and `withHeader()`
without complaint: the built handler map ends up with both the POST you wrote and the GET the builder
synthesised.

## `withMeta`: a resolver, not a placement

`withMeta(resolver)` registers an async function that runs **after** every layer has resolved, so it
can read what they produced:

```tsx
.withMeta((ctx) => ({
  title: `Orders (${ctx.layerData.orders?.orders.length ?? 0})`,
  description: 'Every order for the current tenant.',
  canonicalUrl: new URL(ctx.url.pathname, 'https://app.example.com').href,
}))
```

`ctx.layerData` is fully populated by then — the same values a layout sees — and `ctx.resource(key)`
and the parsed `ctx.path` / `ctx.search` are available too. The resolver returns a descriptor with
seven optional fields, which the runtime renders into a Fresh `<Head>`:

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
the page body, so it composes with whatever `routes/_app.tsx` already renders rather than replacing
it.

Layer props are `Partial` on `ctx.layerData` — a region that produced no data has no entry — so read
them with `?.` and a default, as above. That is the honest shape: a title computed from a region that
failed to load should degrade, not throw.

## `withHeader`: three overloads, merged in order

`resolveHeaderDescriptor` normalises three call shapes into one descriptor list, and the list is
resolved in declaration order with later entries overriding earlier ones:

```tsx
.withHeader('cache-control', 'private, max-age=0, must-revalidate')     // name + value
.withHeader({ 'x-page-type': 'orders', 'x-api-version': '1' })          // a HeadersInit map
.withHeader((ctx) => ({ 'x-tenant': ctx.resource('session').tenantId })) // computed per request
```

The resolver form receives the same context the layout and `withMeta` see, so a header can depend on a
resource or on resolved layer data. Static and computed descriptors are resolved together with
`Promise.all` and then merged with `Headers.set` — meaning **last writer wins per header name**, not
per call: a map that repeats a name set by an earlier string pair replaces it.

The three overloads are declared separately rather than as one loose signature, so the string form
requires its value: `withHeader('x-thing')` on its own does not compile — a bare string matches
neither `HeadersInit` nor a resolver.

## `withStatus`: the page's default GET status

`withStatus(status)` sets the status the synthesised `GET` renders with. It applies to that handler
only — a `withHandler('POST')` returns whatever `Response` you build. The common use is a page that
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

Note what this does *not* do: the status is fixed at build time, not chosen per request. A page that
must return 200 or 404 depending on what it found needs a `withHandler` that returns its own
`Response`, or a redirect from a middleware — the builder has one status per page.

## `withPolicy` and `withStreaming`

`withPolicy(policy)` sets the page-level defer policy: a named profile (`'balanced'`,
`'aggressive-first-paint'`, `'background-refresh'`, `'low-bandwidth'`) or an object overriding
individual fields. It is a **default, not a mandate** — the runtime reads
`descriptor.config.policy ?? config.policy`, so any layer naming its own `policy` wins for that
region. Setting it at page level is how several regions end up with the same freshness behaviour on
purpose.

A policy resolves to a stale window plus four booleans deciding prewarm-on-miss, prewarm-on-stale,
client-refresh-on-fresh-cache, and skip-client-while-server-prewarms. Which profile sets which is
tabulated once, in
[Deferred and streaming UI](/web-layer/defer-streaming-ui/#the-policy-engine); the short version is
that `balanced` trusts a fresh cache and `background-refresh` re-verifies even a fresh one.

`withStreaming()` opts the page into builder-owned HTML streaming. It only affects layers that also
declare `delivery: 'stream'`; the page-level flag and the per-layer flag are both required, and
neither warns when the other is missing. The streaming handler still applies the page's headers and
status. See [Layers, layout, and slots](/web-layer/layers/) for the layer half.

## What `build()` returns

`build()` has three call shapes, and the difference is whether the result knows its own route:

```tsx
const unrouted = definePage().build();                              // page, default, handler
const routed = definePage().build('/orders/[id]');                  // + nav, route, hooks
const alsoRouted = definePage().build({ routePattern: '/orders/[id]' });
```

An unrouted definition is `{ page, default, handler }`. A routed one adds `nav` (the typed href
builder), `route` (the bound `RouteReference`, so `route.href({ path: { id: '7' } })` yields
`/orders/7`), and `hooks` (the eleven page-bound hooks). A page bound with `withRoute()` or
`withRouteContract()` is already routed, so its bare `build()` returns the routed shape — which is
what the Vite plugin's generated binding gives you without a pattern argument. See
[Routing and route contracts](/web-layer/route/#three-authoring-forms-one-generated-binding).

Route modules export the built page:

```tsx
export const { handler, default: page } = ordersPage;
export { page as default };
```

`handler` being `undefined` on an unshaped page is correct and expected — Fresh renders the default
export.

## Custom handlers see a prepared context

`withHandler(method, handler)` registers a handler for `'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' |
'OPTIONS' | 'HEAD'`. The builder wraps it so that params are parsed and resources are resolved before
your code runs:

```tsx
.withHandler('POST', async (ctx) => {
  const session = await ctx.resource('session');
  return Response.json({ tenantId: session.tenantId });
})
```

What the wrapper does **not** do is run the layers. `ctx.layerData` is `{}` inside a custom handler,
and no layer loader fires. A handler that needs a region's data loads it itself, or the page renders
through the normal path. The handler may return a `Response` or a `{ data }` object.

The other consequence is that a custom handler prepares its **own** request state, including its own
resource store. A `POST` handler that resolves resources and then triggers a page render resolves them
twice — see [Request-scoped resources](/web-layer/resources/) for where that guarantee stops.

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

One request: the session resolves, the layer loads and renders, the meta resolver reads the layer's
props to build the title, both header descriptors resolve against the same context, and the
synthesised `GET` calls `ctx.render()` with the merged headers and the status.

## What to watch for

- **The error names the method the builder saw, not the one you wrote.** `withForm` contributes a
  header, so its pages report a `withHeader()` conflict.
- **`withHeader` and `withStatus` require a render-capable context.** The per-request throw is what a
  handler invoked outside Fresh's rendering path produces; in tests, supply a `render` function.
- **Streaming is checked first.** A page with streaming, headers, and a `GET` handler reports the
  streaming conflict — fixing it surfaces the header conflict next.
- **Status is per page, not per request.** Conditional status codes need a custom handler.
- **Header merging is per name, not per call.** A later map silently replaces a name an earlier call
  set.
- **Meta reads layer data, and layer data is partial.** Guard the read.

## Related

{{ comp.cardsGrid({ columns: 3, cards: [
  { title: "Pages and the define-page builder", body: "The full builder chain this page zooms into.", href: "/web-layer/builders/" },
  { title: "Layers, layout, and slots", body: "What resolves before meta, headers, and status.", href: "/web-layer/layers/" },
  { title: "Request-scoped resources", body: "What a custom handler prepares, and what it does not.", href: "/web-layer/resources/" },
  { title: "Routing and route contracts", body: "Where a routed build()'s route and nav come from.", href: "/web-layer/route/" },
  { title: "Deferred and streaming UI", body: "What each withPolicy profile actually sets.", href: "/web-layer/defer-streaming-ui/" },
  { title: "Server-validated forms", body: "The header resolver withForm installs.", href: "/web-layer/form/" }
] }) }}

See the [Web Layer overview](/web-layer/) for the full pillar map.
