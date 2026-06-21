---
layout: layouts/base.vto
title: Fresh meta-framework
templateEngine: [vento, md]
prev: { label: "Fresh UI & design", href: "/capabilities/fresh-ui/" }
next: { label: "Typed SDK & client", href: "/capabilities/sdk/" }
---

# Fresh meta-framework

The NetScript **Fresh meta-framework** is the application layer that turns a route into a
typed, server-rendered page. You author a page with `definePage()` — binding a typed
**route contract**, server **resources** and **layers** (each with its own loader, cache
window, and partial-refresh endpoint), and **forms** — then build it into Fresh route
wiring. The same contract object a page loader uses to call a service is the one the
[typed SDK client](/capabilities/sdk/) imports and the [oRPC service](/capabilities/services/)
implements, so the page → contract → SDK → service request model **cannot drift**.

{{ comp.badge({ status: "alpha" }) }}

{{ comp.diagram({
  src: "/assets/diagrams/fresh-page-model.svg",
  alt: "Request flow: browser hits a Fresh route built by definePage; the server handler runs resource and layer loaders that call the typed SDK client, which calls an oRPC service backed by the database; the rendered HTML ships to the browser where an island hydrates against the same query key.",
  caption: "The Fresh page model: definePage binds a route, runs server loaders through the typed SDK to a service, renders HTML, and hydrates islands against a shared query cache — one contract end to end."
}) }}

{{ comp callout { type: "tip", title: "Use this when" } }}
Reach for the Fresh meta-framework when you need a <strong>server-rendered, typed page</strong>
— a route with loaders that pull from your services, layered slots that refresh independently,
forms that validate and mutate server-side, and islands that hydrate just the interactive parts.
For <em>components, theming, and copy-source primitives</em> this page does NOT cover those —
see <a href="/capabilities/fresh-ui/">Fresh UI &amp; design</a>. For the <em>data layer the
loaders call</em> use the <a href="/capabilities/sdk/">typed SDK</a>; for the
<em>contract those services share</em> see <a href="/explanation/contracts/">Contracts</a>.
{{ /comp }}

## What it is

`@netscript/fresh` is a **DSL / builder** package over [Fresh 2](https://fresh.deno.dev/). Its
public product is a small set of builders and typed contracts — `definePage()`,
`defineRouteContract()`, `definePartial()`, `defineFreshApp()`, plus form, query, and defer
factories — that translate page and route intent into Fresh runtime wiring. A page is composed
from three cooperating pieces: a **server layer** (data resolved by a loader), a **partial
route** that re-renders just that layer on demand, and a **hydrated island** that shares the
same query cache on the client. Rendering is **cache-first**: a fresh cached payload renders
immediately, a stale one renders then reloads in the background (SWR), and a miss falls back to
the layer's partial. The contract type-flow that makes this safe end-to-end is explained in
[Contracts](/explanation/contracts/).

## Learn → / Do →

{{ comp.featureGrid({ items: [
  {
    title: "Learn — Build a page (Track D)",
    body: "The guided tutorial track: route contract → definePage with a cache-first layer → its partial → a hydrated island, built from scratch.",
    href: "/tutorials/",
    icon: "→"
  },
  {
    title: "Do — Customize the Fresh UI",
    body: "Recolor the design system, swap primitives, and extend the generated app shell — the hands-on Fresh UI customization recipe.",
    href: "/how-to/customize-fresh-ui/",
    icon: "◆"
  },
  {
    title: "Do — TanStack Query in islands",
    body: "Wire an island to the same cache the page loader filled, so hydration is instant and invalidation is shared.",
    href: "/tutorials/live-dashboard/03-sdk-cache-first-query/",
    icon: "◆"
  },
  {
    title: "Look up — Components & theming",
    body: "The design-system layer — primitives, interactive components, and tokens — lives in the Fresh UI hub, not here.",
    href: "/capabilities/fresh-ui/",
    icon: "≡"
  }
] }) }}

## Minimal example — an orders page

A page starts with a **typed route contract**, then `definePage()` binds it, attaches a
metadata resolver, and builds the Fresh route wiring. The search schema below is parsed and
type-checked, so `ctx.useSearch()` inside a loader is fully typed.

```tsx
// routes/orders/index.tsx
import { definePage } from '@netscript/fresh/builders';
import { defineRouteContract, paginationSearchSchema } from '@netscript/fresh/route';
import { OrdersPanel } from '../../islands/OrdersPanel.tsx';

// 1. The route contract: typed, parsed search params (the single source of truth for this URL).
const ordersRoute = defineRouteContract({
  searchSchema: paginationSearchSchema({
    defaultLimit: 20,
    defaultSort: 'createdAt',
    defaultOrder: 'desc',
  }),
});

// 2. The page: bind the route, load a server resource, render a cache-first layer.
export const ordersPage = definePage()
  .withRoute(ordersRoute)
  .withResource('orders', async (ctx) => {
    const { limit, sort, order } = ctx.useSearch();
    return await ordersClient.list.query({ limit, sort, order });
  })
  .withLayer('list', OrdersPanel, {
    loader: (ctx) => ({ orders: ctx.useResource('orders') }),
    partialName: 'orders-list',
    staleTime: 30_000,
    staleReloadMode: 'background',
  })
  .withMeta(() => ({ title: 'Orders', description: 'Browse the current order queue.' }))
  .build();
```

The matching **partial route** re-renders only the `orders-list` layer when the island asks
for fresh data — same loader, same query key, no full-page reload:

```tsx
// routes/orders/_partials/orders-list.tsx
import { definePartial } from '@netscript/fresh/builders';
import { OrdersPanel } from '../../../islands/OrdersPanel.tsx';

export const ordersListPartial = definePartial({
  name: 'orders-list',
  loader: async (ctx) => ({ orders: await ordersClient.list.query(ctx.search) }),
  component: OrdersPanel,
});
```

## Key types first — the page builder chain

`definePage()` returns a fluent builder. Each `with*` step is typed against the accumulated
state, so a search-param key, a resource name, or a layer's props are all inferred forward into
the loaders and components downstream. Call `.build()` last; with a bound route it returns a
routed definition exposing `route`, `nav`, and `hooks`.

{{ comp.apiTable({
  caption: "definePage() builder methods (PageBuilder)",
  rows: [
    { name: "withRoute(route)", type: "method", desc: "Bind the page to a typed route contract (from defineRouteContract). Makes path/search params type-safe in every loader and component." },
    { name: "withResource(key, factory)", type: "method", desc: "Resolve one named server resource (e.g. an SDK query). Read it later with ctx.useResource(key). withResources(map) adds several at once." },
    { name: "withParams / withPathParams / withSearchParams", type: "method", desc: "Attach path and/or search schemas directly (alternative to withRoute) when you do not need a shared route contract." },
    { name: "withPolicy(policy)", type: "method", desc: "Set the page-wide defer policy — a named profile or an override object. See the policy table below." },
    { name: "withLayer(id, component, config)", type: "method", desc: "Register a render slot with its own loader, cache window, and partial-refresh endpoint. config is a PageLayerConfig (or a bare loader). See the layer-config table." },
    { name: "withForm(id, component, config)", type: "method", desc: "Register a route-bound, server-validated form as a typed layer. config is a PageFormConfig. See the form-config table." },
    { name: "withLayout(layout)", type: "method", desc: "Compose the registered layer slots into the page shell: (slots) => <main>{slots.list()}</main>." },
    { name: "withMeta(resolver)", type: "method", desc: "Resolve <head> metadata (title, description) per request." },
    { name: "withTelemetry(config)", type: "method", desc: "Attach telemetry metadata (span naming) for the page's traces." },
    { name: "withHandler(method, handler)", type: "method", desc: "Register a raw method handler. Do not combine GET here with withHeader()/withStatus()." },
    { name: "build(options?)", type: "method", desc: "Finalize. build() / build('/path') / build({ routePattern }) — with a bound route the result exposes route, nav, and hooks." }
  ]
}) }}

## `withLayer` options — the cache-first slot

A **layer** is the unit of independent loading and refresh. Its `loader` produces props, its
`partial`/`partialName` names the route that re-renders it in isolation, and the cache/policy
keys decide when a stale slot reloads. These are the real keys on `PageLayerConfig`:

{{ comp.apiTable({
  caption: "PageLayerConfig — withLayer(id, component, config)",
  rows: [
    { name: "loader", type: "(ctx) => Props | Promise<Props>", desc: "Async loader providing the layer component's props. Reads resources via ctx.useResource(key)." },
    { name: "partial", type: "string | (ctx) => string", desc: "Partial endpoint (or resolver) used to refresh this layer without a full-page reload." },
    { name: "partialName", type: "string | (ctx) => string", desc: "Stable Fresh partial name rendered into the response — the handshake key the island uses to ask for fresh data." },
    { name: "fallback", type: "unknown", desc: "Content shown while a deferred layer is still pending." },
    { name: "policy", type: "PageDeferPolicyInput | profile", desc: "Per-layer defer policy override (see the policy table)." },
    { name: "layerDeps", type: "(ctx) => unknown", desc: "Dependency projection (over path + search) deciding when the layer should reload." },
    { name: "staleTime", type: "number (ms)", desc: "Freshness window for the cached layer payload before it is considered stale." },
    { name: "gcTime", type: "number (ms)", desc: "Cache retention window before the payload is evicted." },
    { name: "staleReloadMode", type: "'blocking' | 'background'", desc: "When stale, reload before rendering (blocking) or render now and revalidate after (background SWR)." },
    { name: "shouldReload", type: "boolean | (ctx) => boolean", desc: "Explicit reload guard, overriding the freshness heuristics." },
    { name: "delivery", type: "PageLayerDelivery", desc: "Delivery mode for the layer (e.g. streamed)." }
  ]
}) }}

## `withPolicy` — the defer policy enum

`withPolicy()` (and a layer's `policy`) accepts a **named profile** or an override object. The
full set of named profiles is:

{{ comp.apiTable({
  caption: "PageDeferPolicyProfile + PageDeferPolicyInput overrides",
  rows: [
    { name: "'balanced'", type: "profile (default)", desc: "Cache-first with sensible SWR — the default trade-off between first paint and freshness." },
    { name: "'aggressive-first-paint'", type: "profile", desc: "Render cached/fallback content as early as possible, revalidate after." },
    { name: "'background-refresh'", type: "profile", desc: "Prefer serving cache and always refresh in the background." },
    { name: "'low-bandwidth'", type: "profile", desc: "Minimize prewarm and client refresh traffic for constrained clients." },
    { name: "{ profile, staleTimeMs }", type: "override", desc: "Start from a named profile, then override the freshness window in ms." },
    { name: "{ prewarmOnMiss, prewarmOnStale }", type: "override", desc: "Prewarm the partial when the cache is missing and/or stale." },
    { name: "{ clientRefreshOnFreshCache, skipClientWhenServerPrewarm }", type: "override", desc: "Fine-tune whether the client refreshes when the server cache is already fresh or prewarming." }
  ]
}) }}

## `withForm` — server-validated forms as a layer

`withForm(id, component, config)` registers a form as a typed layer: it wires the method
handler, CSRF headers, validation, and form metadata in one step. `TOutput` is inferred from
`mutate`'s return type, so `redirectTo`/`onSuccess` are typed against your result.

{{ comp.apiTable({
  caption: "PageFormConfig — withForm(id, component, config)",
  rows: [
    { name: "schema", type: "Schema (required)", desc: "Validation + constraint schema. The inference site for the form's input type." },
    { name: "mutate", type: "(input, ctx) => TOutput (required)", desc: "Runs the mutation with validated input. Its return type is the sole inference site for TOutput." },
    { name: "initial", type: "(ctx) => Partial<Values>", desc: "Resolves initial values on GET, merged with schema defaults." },
    { name: "onIntent", type: "(intent, values, ctx) => FormIntentResult", desc: "Handles non-submit intents (validate, reset) — short-circuits before validation." },
    { name: "redirectTo", type: "(output, ctx) => string | Response", desc: "Redirect target after a successful mutation. Takes precedence over onSuccess." },
    { name: "onSuccess", type: "(output, ctx) => { message?, nextValues? }", desc: "Success metadata when staying on the same page." },
    { name: "invalidate", type: "(output, ctx) => void", desc: "Cache invalidation after mutation, before the response is sent." },
    { name: "csrf", type: "boolean (default true)", desc: "CSRF protection toggle." },
    { name: "method", type: "'POST' | 'PUT' | 'PATCH' (default POST)", desc: "HTTP method for the form submission." },
    { name: "spanName", type: "string (default form.{id})", desc: "Telemetry span prefix for the form handler." }
  ]
}) }}

## Route contracts, partials, defer & islands

The route contract is the typed boundary of a URL. `defineRouteContract({ pathSchema,
searchSchema })` produces a contract whose parsed params flow into the page; the
`@netscript/fresh/route` subpath ships the schema builders and link helpers, and
`@netscript/fresh/defer` + `@netscript/fresh/query` cover deferral and island hydration.

{{ comp.apiTable({
  caption: "Surrounding surface (confirmed exports)",
  rows: [
    { name: "defineRouteContract({ pathSchema, searchSchema })", type: "@netscript/fresh/route", desc: "Typed route contract. Parsed path/search params become type-safe page inputs." },
    { name: "paginationSearchSchema(opts)", type: "@netscript/fresh/route", desc: "Ready-made search schema for limit/sort/order pagination (defaultLimit/defaultSort/defaultOrder)." },
    { name: "enumPathParamSchema(name, values)", type: "@netscript/fresh/route", desc: "Typed enum path-param schema, e.g. a status segment constrained to a fixed set." },
    { name: "InferRouteContractSearch<T> / InferRouteContractPath<T>", type: "@netscript/fresh/route", desc: "Extract the parsed search/path types from a route contract for reuse." },
    { name: "createRouteReference / bindRoutePattern", type: "@netscript/fresh/route", desc: "Typed href and link-prop helpers bound to a route pattern." },
    { name: "definePartial({ name, loader, component })", type: "@netscript/fresh/builders", desc: "A framework-owned partial route — the isolated re-render target for a layer." },
    { name: "DeferPage / DeferComponent / Deferred", type: "@netscript/fresh/defer", desc: "Suspense-style deferred rendering: stream a fallback now, swap real content when the promise resolves." },
    { name: "QueryIsland / useIslandQuery / useIslandMutation / useLiveQuery", type: "@netscript/fresh/query", desc: "TanStack Query for islands, imported through one centralized subpath so the dependency never forks." },
    { name: "defineFreshApp(options)", type: "@netscript/fresh/server", desc: "Bootstrap the Fresh app runtime that serves the built pages." }
  ]
}) }}

{{ comp callout { type: "note", title: "Reading page state inside loaders & components" } }}
Inside a routed page's render tree, read the resolved state through the page context the loader
receives — <code>ctx.useResource(key)</code>, <code>ctx.useResources()</code>,
<code>ctx.useSearch()</code>, <code>ctx.useRoute()</code>, and <code>ctx.useSlots()</code> — or
the value-level hooks <code>usePageRoute()</code>, <code>usePagePath()</code>, and
<code>usePageSearch()</code> for the canonical current page. These are <strong>context
accessors</strong>, not standalone exported hooks: a routed <code>.build()</code> also exposes
typed <code>route.hooks.use*()</code> bundles for inference inside islands.
{{ /comp }}

## Production notes

{{ comp callout { type: "warning", title: "Don't double-handle GET" } }}
<code>withHeader()</code> and <code>withStatus()</code> generate their own <code>GET</code>
handler that calls <code>ctx.render()</code>. Do <strong>not</strong> also register
<code>withHandler('GET', …)</code> on the same page — the two collide. Pick one: declarative
headers/status, <em>or</em> a hand-written GET handler.
{{ /comp }}

{{ comp callout { type: "important", title: "Islands import TanStack Query through the subpath" } }}
Island code must import query hooks from <code>@netscript/fresh/query</code> (e.g.
<code>useIslandQuery</code>, <code>QueryIsland</code>), <strong>not</strong> from
<code>@tanstack/preact-query</code> directly. The subpath centralizes the dependency and the
hydration boundary, so the page loader's cache and the island's cache stay the same instance —
import the raw library and hydration silently breaks.
{{ /comp }}

{{ comp callout { type: "important", title: "Runtime permissions & KV typing" } }}
Deferred prewarm and durable-stream helpers touch the platform at runtime:
<code>--allow-net</code> for partial prewarm and stream endpoints, <code>--allow-env</code> when
stream settings resolve from the environment, and <code>--unstable-kv</code> for the SSE helpers
that watch <code>Deno.Kv</code>. Type-check page entrypoints with <code>--unstable-kv</code> too —
the streaming server helpers expose KV-aware types. This package is <strong>alpha</strong>
(<code>0.0.1-alpha.x</code>); pin the version and expect surface churn.
{{ /comp }}

## Reference →

This hub is intentionally thin — the full generated API for every subpath
(`server`, `builders`, `route`, `defer`, `form`, `query`, `interactive`, `streams`, `vite`)
lives in the reference.

{{ comp.xref({ key: "ref:fresh" }) }}

{{ comp.featureGrid({ items: [
  {
    title: "Look up — @netscript/fresh reference",
    body: "The full generated API: definePage, defineRouteContract, the form/defer/query factories, and the server bootstrap.",
    href: "/reference/fresh/",
    icon: "≡"
  },
  {
    title: "Data — Typed SDK & client",
    body: "The cache-first typed clients your page loaders call. Same contract as the service, no drift.",
    href: "/capabilities/sdk/",
    icon: "◆"
  },
  {
    title: "Design — Fresh UI & components",
    body: "The component and theming layer this page renders: primitives, interactive components, and tokens.",
    href: "/capabilities/fresh-ui/",
    icon: "→"
  },
  {
    title: "Understand — Contracts",
    body: "The contract → SDK client → page loader → island type flow that keeps caller and server in lockstep.",
    href: "/explanation/contracts/",
    icon: "◎"
  }
] }) }}

{{ comp.nextPrev({ prev: { label: "Fresh UI & design", href: "/capabilities/fresh-ui/" }, next: { label: "Typed SDK & client", href: "/capabilities/sdk/" } }) }}
