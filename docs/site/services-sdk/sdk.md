---
layout: layouts/base.vto
title: Typed SDK & client
templateEngine: [vento, md]
prev: { label: "Fresh meta-framework", href: "/web-layer/" }
next: { label: "Polyglot tasks", href: "/background-processing/polyglot-tasks/" }
order: 2
---

# Typed SDK & client

**Declare a contract action once and everything the caller needs — the typed method, the query
key, the cache entry, the TanStack options — is derived from it, in one import.**

The `@netscript/sdk` is the **typed client and data layer** for NetScript: it turns an
[`@orpc/contract`](/explanation/contracts/) into a discovered, type-safe service client,
wraps each contract action in a **cache-first query factory** (KV-backed SWR), and bridges
those into [TanStack Query](https://tanstack.com/query) for islands. The contract object is
the single source of truth — the *same* object the [service](/services-sdk/services/)
implements is the one the client imports, so caller and server **cannot drift**.
{{ comp.badge({ status: "beta" }) }}

{{ comp.diagram({
  src: "/assets/diagrams/sdk-data-flow.svg",
  alt: "A contract object flows into a generated typed client, then a cache-first query factory backed by Deno KV, then into a Fresh island; the same contract object is imported by the oRPC service so the two ends cannot drift.",
  caption: "One contract → typed client → KV cache-first query → island. The service imports the same contract, so a renamed field is a compile error on both sides."
}) }}

## What it is

The SDK is layered. **L1** is the typed client: `createServiceClient<Contract>()` resolves a
service URL from [Aspire service discovery](/explanation/aspire/) and returns a callable
object whose method signatures are inferred from the contract. **L2** wraps each contract
action in a query factory (`createQueryFactories`) that runs through a shared KV-backed cache
provider and exposes `queryOptions`/`mutationOptions`/`clientKey`/`key`/`getCachedEntry` per
action. **L3** is the `defineServices()` preset that builds clients, server query factories,
and frontend query utils from one contract map. You consume the layer you need and can drop
down without rewiring. See [Contracts](/explanation/contracts/) for the type-flow theory.

{{ comp callout { type: "tip", title: "Use this when" } }}
Reach for the SDK when an app or a service needs to <strong>call a typed oRPC service</strong>
and render its data with <strong>cache-first, server-hydrated queries</strong>. Use the bare
<a href="/services-sdk/services/"><code>createServiceClient</code></a> for service-to-service
RPC; add <code>createQueryFactories</code> when you want KV-backed SWR and TanStack option
helpers; reach for <a href="/web-layer/">Fresh</a> when an island must
hydrate that same query key on the client.
{{ /comp }}

## Declare once, derived everywhere

The classic data-layer tax is the [hand-rolled fetch wrapper](/web-layer/query/): a `lib/api.ts`
full of `fetch()` calls whose request and response types are re-typed by hand from whatever the
server currently returns. Every server change costs a second edit in the wrapper, a third in the query keys, and
whichever one is forgotten becomes a runtime bug. For an AI agent working the codebase the tax is
worse — each of those copies is a separate turn, and a stale one is a wrong answer the agent
cannot see until runtime.

The SDK collapses those copies into one declaration. tRPC made this move famous for TypeScript
APIs — declare a procedure on the server and the client's types follow, "end-to-end typesafe."
NetScript keeps that declare-once property and shifts *where* the declaration
lives: not inside server code, but in a standalone, versioned contract package that the server,
the client, **and** the OpenAPI/Scalar surface all import. And the derivation goes further than
method types — from one contract action the factory derives the server KV cache key (`key()`),
the client TanStack key (`clientKey()`), the `queryOptions`/`mutationOptions` helpers, and the
SWR cache reads. One edit to the contract updates the client, the docs surface, and the query
layer together — there is no separate turn to keep them in sync.

This is how a production chat application built on NetScript wires its dashboard:
the typed client is built straight off the contract type, so a route added to the contract shows
up on the client already typed. The mechanics of each layer are below; the type-flow theory is in
[Contracts](/explanation/contracts/).

## Learn → / Do →

{{ comp.featureGrid({ items: [
  {
    title: "Learn — Build a service + client",
    body: "Track D walks contract → typed client → query factory → definePage layer → island, end to end.",
    href: "/tutorials/storefront/02-catalog-service/",
    icon: "→"
  },
  {
    title: "Do — Discover a service",
    body: "Task recipe: resolve a service URL from Aspire env and stand up a typed client for it.",
    href: "/services-sdk/how-to/discover-services/",
    icon: "◆"
  }
] }) }}

## Minimal example

A single `lib/api-clients.ts` is the spine of the data layer: build the typed client from a
contract, then derive a query factory from `{ contract, client }`. Every consumer — server
loader or island — imports from here.

```ts
// apps/playground/lib/api-clients.ts
import { createServiceClient } from '@netscript/sdk/client';
import { createQueryFactories } from '@netscript/sdk/query';
import { ordersContract } from '@contracts';

// L1 — typed client. `serviceName` resolves a URL via Aspire discovery.
export const ordersClient = createServiceClient<typeof ordersContract>({
  contract: ordersContract,
  serviceName: 'orders',
});

// L2 — cache-first query factory bound to that client (KV-backed SWR).
export const api = createQueryFactories({
  orders: { contract: ordersContract, client: ordersClient },
});

// Direct typed call: `.list()` is fully inferred from the contract.
const recent = await ordersClient.list({ limit: 10 });
```

{{ comp callout { type: "note", title: "Plugin services add a routerName" } }}
A first-party plugin API (workers, sagas, triggers) mounts its router under a named segment, so
its client needs <code>routerName</code> in addition to <code>serviceName</code>:
<code>createServiceClient&lt;typeof workersContract&gt;({ contract, serviceName: 'workers-api', routerName: 'workers' })</code>.
Plain workspace services omit it.
{{ /comp }}

## Key types first

The query factory is the heart of the data layer. Each contract action becomes an
**`ActionMethod`** carrying the full cache-first surface — keys, prefetch, cached reads, and
TanStack option helpers. These are the methods you call from a `definePage` loader and an
island; reading them first explains the rest of the page.

{{ comp.apiTable({
  caption: "ActionMethod — per-action query helpers (api.orders.list.*)",
  rows: [
    { name: "queryOptions(props, options?)", type: "(input, ActionQueryOptions?) => QueryOptions", desc: "TanStack queryOptions with a typed queryKey and queryFn derived from the contract. The primary helper a loader/island passes to useQuery." },
    { name: "mutationOptions(options?)", type: "(ActionMutationOptions?) => MutationOptions", desc: "TanStack mutationOptions with a typed mutationKey and mutationFn for writes (e.g. updateStatus)." },
    { name: "key(props)", type: "(input) => readonly [string, action, string]", desc: "Canonical SERVER cache key [resource, action, serializedInput] used by the KV cache." },
    { name: "clientKey(props?)", type: "(input?) => readonly unknown[]", desc: "CLIENT-side TanStack query key, prefix-matchable for invalidateQueries. clientKey() vs key() is the server↔client split." },
    { name: "getCachedEntry(props)", type: "(input) => Promise<CachedEntry<Output> | null>", desc: "Read cached data WITH its cache timestamp (cachedAt) — the SWR primitive a layer loader uses to decide stale-reload." },
    { name: "getCachedData(props)", type: "(input) => Promise<Output | null>", desc: "Read cached data only, without fetching." },
    { name: "prefetch(props, options?)", type: "(input, QueryParams?) => void", desc: "Warm the cache in the background (fire-and-forget)." },
    { name: "invalidate()", type: "() => Promise<void>", desc: "Invalidate all cached queries for this action." }
  ]
}) }}

## Constructing the client & factory

The two L1/L2 constructors and their options. `createServiceClient` is the only call that
touches discovery; `createQueryFactories` is pure wiring over `{ contract, client }`.

{{ comp.apiTable({
  caption: "createServiceClient<Contract>(options) — CreateServiceClientOptions",
  rows: [
    { name: "contract", type: "TContract — required", desc: "The @orpc/contract object. Drives both client typing AND HTTP method inference." },
    { name: "serviceName", type: "string — required", desc: "Service name registered in Aspire / NetScript config. Resolved to a URL via discovery (services__{name}__{protocol}__{index}; browser uses the VITE_ mirror)." },
    { name: "routerName", type: "string?", desc: "Router-name segment for URL path construction. Required for plugin API services, omitted for plain services." },
    { name: "protocol", type: "'http' | 'https'?", desc: "Resolved protocol for service discovery." },
    { name: "apiPath / apiVersion", type: "string?", desc: "Base RPC path and API version segment overrides." },
    { name: "propagateTraceContext", type: "boolean?", desc: "Auto-propagate W3C traceparent/tracestate headers on each call." }
  ]
}) }}

The L3 alternative builds all three layers from one map:
`defineServices({ orders: { contract, serviceName: 'orders' } })` returns
`{ clients, queryFactories, queryUtils }` — the same L2 values, just composed in one call.

## Service discovery & query client

`serviceName` is resolved at call time from Aspire-injected environment variables. The
`@netscript/sdk/discovery` subpath exposes the resolvers directly when you need a raw URL, and
`@netscript/sdk/query-client` provides the browser-side TanStack glue.

{{ comp.apiTable({
  caption: "Discovery & query-client helpers",
  rows: [
    { name: "getServiceUrl(name, protocol, index)", type: "@netscript/sdk/discovery", desc: "Resolve a service URL from Aspire browser-VITE or server services__* env. This is how serviceName resolves." },
    { name: "getServiceInfo(name) / isServiceAvailable(name) / getAllServices()", type: "@netscript/sdk/discovery", desc: "Inspect a service's endpoints, check availability, or list all server-side Aspire service names (topology)." },
    { name: "createNetScriptQueryClient(options)", type: "@netscript/sdk/query-client", desc: "A TanStack QueryClient with server-first defaults: staleTime 30s, gcTime 300s, refetchOnWindowFocus false, retry 1." },
    { name: "createServiceQueryUtils()", type: "@netscript/sdk/query-client", desc: "Bridge a typed SDK client into oRPC/TanStack frontend query utilities." },
    { name: "bridgeInvalidation(resource, action?)", type: "@netscript/sdk/query-client", desc: "Build a client-side invalidation filter ({ queryKey }) for queryClient.invalidateQueries()." },
    { name: "toClientKeyPrefix(resource, action?)", type: "@netscript/sdk/query-client", desc: "Map a server resource/action to a prefix-matchable client query key, e.g. ['orders','list']." },
    { name: "cacheQuery.setCachedData(key, data, ttl)", type: "@netscript/sdk/cache", desc: "Server-only: fire-and-forget pre-warm of an entity into the KV cache. Importing /cache auto-registers the shared provider." }
  ]
}) }}

{{ comp.tabbedCode({ tabs: [
  {
    label: "Server loader (definePage layer)",
    lang: "ts",
    code: "// routes/(dashboard)/orders/(_loaders)/orders-list.ts\nimport { api } from '@/lib/api-clients.ts';\n\n// Cache-first: read the KV entry (with cachedAt) for SWR; fall back to a fetch.\nexport const loadOrders = async () => {\n  const entry = await api.orders.list.getCachedEntry({ limit: 20 });\n  if (entry) return entry; // serve cached; SDK reloads stale in the background\n  return { data: await api.orders.list.queryOptions({ limit: 20 }).queryFn(), cachedAt: Date.now() };\n};"
  },
  {
    label: "Island (TanStack hydration)",
    lang: "tsx",
    code: "// orders/(_islands)/OrdersQueryIsland.tsx\nimport { useQuery, useQueryClient } from '@netscript/fresh/query';\nimport { api } from '@/lib/api-clients.ts';\n\n// Same contract action → same query key as the server loader, so the island\n// hydrates from server state instead of refetching on mount.\nconst OrdersList = () => {\n  const qc = useQueryClient();\n  const orders = useQuery(api.orders.list.queryOptions({ limit: 20 }));\n  // invalidate by prefix after a write:\n  const refresh = () => qc.invalidateQueries({ queryKey: api.orders.list.clientKey() });\n  return null; // render orders.data\n};"
  },
  {
    label: "Safe error narrowing",
    lang: "ts",
    code: "// services/orders/src/routers/v1.ts — service-to-service call\nimport { safe, isDefinedError } from '@netscript/sdk/client';\nimport { usersClient } from '@/lib/api-clients.ts';\n\nconst [error, user, isDefined] = await safe(usersClient.getById({ id }));\nif (error) {\n  // narrow to a typed, contract-declared error\n  if (isDefinedError(error)) return { code: error.code, status: error.status };\n  throw error;\n}"
  }
] }) }}

## Production notes

{{ comp callout { type: "important", title: "/cache and /discovery are server-only" } }}
<code>@netscript/sdk/cache</code> touches Deno KV and <code>@netscript/sdk/discovery</code>
reads <code>services__*</code> env on the server — never import them into island/browser code.
Browsers resolve service URLs through the <strong><code>VITE_</code>-mirrored</strong> keys
that Aspire injects, and the query factory's cache reads happen on the server loader; the
island receives hydrated state and a <code>clientKey()</code> for invalidation only.
{{ /comp }}

{{ comp callout { type: "warning", title: "clientKey() vs key() — don't cross the streams" } }}
<code>key(props)</code> is the <strong>server</strong> KV cache key
(<code>[resource, action, serializedInput]</code>); <code>clientKey(props?)</code> is the
<strong>client</strong> TanStack key (prefix-matchable). Invalidate on the client with
<code>clientKey()</code> / <code>toClientKeyPrefix(...)</code> — passing a server
<code>key()</code> to <code>invalidateQueries</code> will silently match nothing. NetScript is in
beta; subpath barrels are stable but signatures may still move.
{{ /comp }}

## Reference →

This hub is intentionally thin — the full generated API (client, query, query-client, cache,
collections, discovery, streams, telemetry, ports) lives in the reference.

{{ comp.xref({ key: "ref:sdk" }) }}

{{ comp.featureGrid({ items: [
  {
    title: "Look up — @netscript/sdk reference",
    body: "Generated API for every subpath: createServiceClient, createQueryFactories, defineServices, discovery, and the cache engine.",
    href: "/reference/sdk/",
    icon: "≡"
  },
  {
    title: "Understand — Contracts",
    body: "The oRPC contract → implement → handler → typed client → query → island type flow that makes drift a compile error.",
    href: "/explanation/contracts/",
    icon: "◎"
  },
  {
    title: "Build — Services & contracts",
    body: "The server side of the contract: defineService, the fluent builder, OpenAPI/Scalar, and the auth seam.",
    href: "/services-sdk/services/",
    icon: "◆"
  },
  {
    title: "Render — Fresh meta-framework",
    body: "How a definePage layer + island consume these query factories with cache-first hydration.",
    href: "/web-layer/",
    icon: "→"
  }
] }) }}

{{ comp.nextPrev({ prev: { label: "Fresh meta-framework", href: "/web-layer/" }, next: { label: "Polyglot tasks", href: "/background-processing/polyglot-tasks/" } }) }}
