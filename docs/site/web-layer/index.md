---
layout: layouts/base.vto
title: Web layer
description: Fresh pages, routes, data loading, forms, and islands with @netscript/fresh, plus the Fresh UI components.
templateEngine: [vento, md]
oldUrl: /web-layer/examples/
---

# Web layer

This page maps the web-layer guides. The web layer is `@netscript/fresh`, a server-first
meta-framework built on [Fresh](https://fresh.deno.dev/) 2.x and Preact. Its pages load data through
the **same contract object your services implement**, so when a contract changes, the page that
depends on it fails `deno check` instead of failing in production.

In a scaffolded workspace, `apps/dashboard/lib/example-service.ts` imports `UsersContractV1` and
derives a typed client and TanStack Query factories from it. The `users` service implements the same
contract. Reshape an endpoint and every page loader, island and form that consumes it becomes a
compile error with a file and line number.

## How a page is put together

You author a page with `definePage()`. It binds a typed **route contract**, server **resources**,
**layers** (each with its own loader, cache window and partial-refresh endpoint) and **forms**, then
builds them into Fresh route wiring. Handlers run in Deno and return HTML. Only components under
`islands/` ship JavaScript to the browser, where they hydrate against the same query cache the server
dehydrated.

{{ comp.diagram({
  src: "/assets/diagrams/fresh-page-model.svg",
  alt: "Request flow: browser hits a Fresh route built by definePage; the server handler runs resource and layer loaders that call the typed SDK client, which calls an oRPC service backed by the database; the rendered HTML ships to the browser where an island hydrates against the same query key.",
  caption: "The Fresh page model: definePage binds a route, runs server loaders through the typed SDK to a service, renders HTML, and hydrates islands against a shared query cache. One contract runs end to end."
}) }}

## Guides

Each guide covers one part of that model. Read the one you need.

- [Fresh page model](/web-layer/server/): server-first rendering, the islands boundary, and
  `defineFreshApp()` from `@netscript/fresh/server`, the bootstrap every NetScript Fresh app
  starts from.
- [The define-page builder](/web-layer/builders/): `definePage()` and `definePartial()` from
  `@netscript/fresh/builders`, with typed layers, defer policies and per-layer partial refresh.
- [Request-scoped resources](/web-layer/resources/): `withResource()`, one value resolved once per
  request and shared by every layer, layout and metadata resolver on the page.
- [Layers, layout, and slots](/web-layer/layers/): `withLayer()` and `withLayout()`, named regions
  that resolve concurrently, each with its own loader, fallback and freshness window.
- [Response shaping](/web-layer/response/): `withMeta()`, `withHeader()`, `withStatus()`, and the
  `GET` handler `build()` synthesises from them.
- [Route contracts](/web-layer/route/): `defineRouteContract()`, schema helpers such as
  `paginationSearchSchema()` and `defineEnumPathParam()`, and the generated `routes` tree that turns
  a moved route file into a compile error.
- [Generated web surface](/web-layer/generated-surface/): which files in a Fresh app you own and
  which the route generator rewrites.
- [Partials](/web-layer/partials/): `definePartial()`, paired route references, and the layer
  config that turns a region into a cache-aware deferred partial.
- [Deferred & streaming UI](/web-layer/defer-streaming-ui/): stream a fallback now and swap in real
  content when a slower layer resolves.
- [Data loading & the query cache](/web-layer/query/): `QueryIsland`, `useQuery`, `useMutation`
  and `useLiveQuery`, the TanStack Query bridge that shares one cache between server render and
  island hydration.
- [Query bridge](/web-layer/query-bridge/): SDK query factories from loader to island, the two
  key tiers, `getCachedEntry()` as a read rather than a fetch, and when to dehydrate instead of
  passing `initialData`.
- [Server-validated forms](/web-layer/form/): typed, contract-aware form handling declared as a page
  layer.
- [Interactivity](/web-layer/interactive/) and [durable-stream consumption](/durable-workflows/streams/):
  island runtime helpers and the browser-side client for durable HTTP/SSE streams.
- [Vite integration](/web-layer/vite/), [testing](/web-layer/testing/) and
  [diagnostics](/web-layer/error/). For a worked example of the whole layer, follow
  [the Live Dashboard tutorial](/tutorials/live-dashboard/).
- [Fresh UI & design](/web-layer/fresh-ui/): the visual layer on top, with the copy-source component
  registry, design tokens and the scaffolded dashboard app.

## Learn, do, look up

{{ comp.cardsGrid({ columns: 4, cards: [
  { eyebrow: "Learn", title: "Live dashboard tutorial", body: "Contract to page to live stream: the web layer end to end.", href: resolveXref("tut:live-dashboard").href },
  { eyebrow: "Do", title: "Recipes", body: "Task-oriented recipes for this area, one problem each.", href: "/web-layer/how-to/" },
  { eyebrow: "Look up", title: "`@netscript/fresh` reference", body: "API reference. Related units: `fresh-ui`.", href: resolveXref("ref:fresh").href },
  { eyebrow: "Understand", title: "Contracts & type flow", body: "The design rationale behind this pillar.", href: resolveXref("explain:contracts").href },
] }) }}
