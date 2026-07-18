---
layout: layouts/base.vto
title: Web Layer
templateEngine: [vento, md]
---

# Web Layer

The web layer is where API drift surfaces last and costs the most turns to fix. NetScript's answer
is `@netscript/fresh`: a server-first meta-framework, built on [Fresh](https://fresh.deno.dev/) 2.x
and Preact, that renders pages from the **same contract object your services implement**. The page
loader, the typed browser client, and the server handler share one type — so when a contract
changes, the page that depends on it fails `deno check`, not production.

## The failure this layer removes

Picture the usual sequence in a UI built on hand-rolled `fetch` calls. A service endpoint gains a
required filter and reshapes its response. The API compiles, its tests pass, and the dashboard —
which encoded the old response shape in an untyped `fetch` — keeps rendering until a user (or an
agent's browser check) finds the broken page. Whoever fixes it now spends turns rediscovering what
the endpoint actually returns, because nothing in the UI's code says so.

In a NetScript workspace that sequence stops at the type checker. The scaffolded dashboard builds
its client from the contract itself — `apps/dashboard/lib/example-service.ts` imports
`UsersContractV1` and derives a typed client plus TanStack-Query factories from it — and that is the
same contract object the `users` service implements. Reshape the endpoint and every page loader,
island, and form that consumes it becomes a compile error with a file and line number: the response
shape lives in the type system, where an agent can read it, instead of in someone's memory.

## How a page is put together

You author a page with `definePage()` — binding a typed **route contract**, server **resources**
and **layers** (each with its own loader, cache window, and partial-refresh endpoint), and
**forms** — then build it into Fresh route wiring. Rendering is server-first: handlers run in Deno
and return HTML, and only components under `islands/` ship JavaScript to the browser, where they
hydrate against the same query cache the server dehydrated.

{{ comp.diagram({
  src: "/assets/diagrams/fresh-page-model.svg",
  alt: "Request flow: browser hits a Fresh route built by definePage; the server handler runs resource and layer loaders that call the typed SDK client, which calls an oRPC service backed by the database; the rendered HTML ships to the browser where an island hydrates against the same query key.",
  caption: "The Fresh page model: definePage binds a route, runs server loaders through the typed SDK to a service, renders HTML, and hydrates islands against a shared query cache — one contract end to end."
}) }}

Each piece of that model has its own leaf page — link into the one you need rather than reading in
order:

- **[The Fresh page model](/web-layer/server/)** — server-first rendering, the islands boundary,
  and `defineFreshApp()` (`@netscript/fresh/server`), the bootstrap every NetScript Fresh app
  starts from.
- **[The define-page builder](/web-layer/builders/)** — `definePage()` and `definePartial()`
  (`@netscript/fresh/builders`): typed layers, defer policies, and per-layer partial refresh.
- **[Route contracts](/web-layer/route/)** — `defineRouteContract()`, schema helpers such as
  `paginationSearchSchema()`, and `createRouteReference()` for typed links.
- **[Data loading & the query cache](/web-layer/query/)** — `QueryIsland`, `useQuery`,
  `useMutation`, and `useLiveQuery`: the TanStack-Query bridge that shares one cache between
  server render and island hydration.
- **[Server-validated forms](/web-layer/form/)** — typed, contract-aware form handling declared as
  a page layer.
- **[Deferred & streaming UI](/web-layer/defer-streaming-ui/)** — stream a fallback now, swap in
  real content when a slower layer resolves.
- **[Interactivity](/web-layer/interactive/)** and **[durable-stream consumption](/durable-workflows/streams/)**
  — island runtime helpers and the browser-side client for durable HTTP/SSE streams.
- **[Vite integration](/web-layer/vite/)**, **[testing](/web-layer/testing/)**,
  **[diagnostics](/web-layer/error/)**, and **[worked examples](/web-layer/examples/)**.

The visual layer on top of all of this — the copy-source component registry, design tokens, and the
scaffolded dashboard app — is [Fresh UI & design](/web-layer/fresh-ui/), which has its own story.

## Start here

{{ comp.cardsGrid({ columns: 3, cards: [
  { eyebrow: "Overview & Concepts", title: "Fresh page model", body: "Server rendering, islands, route contracts, layers, partials, and shared query cache.", href: "/web-layer/server/", icon: "O" },
  { eyebrow: "Overview & Concepts", title: "Fresh UI & design", body: "The copy-source component registry, design tokens, and the scaffolded dashboard app.", href: "/web-layer/fresh-ui/", icon: "O" },
  { eyebrow: "Quickstart", title: "Live dashboard", body: "Build a Fresh page backed by a typed SDK client and a cache-first QueryIsland.", href: "/tutorials/live-dashboard/", icon: "Q" },
  { eyebrow: "How-To", title: "Customize Fresh UI", body: "Adjust the generated UI layer and design-system surface.", href: "/web-layer/how-to/customize-fresh-ui/", icon: "H" },
  { eyebrow: "How-To", title: "Server-validated form", body: "Build a form that validates and mutates on the server.", href: "/web-layer/how-to/build-a-server-validated-form/", icon: "H" },
  { eyebrow: "API Reference", title: "@netscript/fresh", body: "Generated symbols for the Fresh framework package.", href: "/reference/fresh/", icon: "R" },
  { eyebrow: "API Reference", title: "@netscript/fresh-ui", body: "Generated symbols for the companion UI package.", href: "/reference/fresh-ui/", icon: "R" }
] }) }}

## Learn, do, look up

{{ comp.cardsGrid({ columns: 4, cards: [
  { eyebrow: "Learn", title: "Live dashboard tutorial", body: "Contract to page to live stream — the web layer end to end.", href: resolveXref("tut:live-dashboard").href },
  { eyebrow: "Do", title: "Recipes", body: "Task-oriented recipes for this area, one problem each.", href: "/web-layer/how-to/" },
  { eyebrow: "Look up", title: "`@netscript/fresh` reference", body: "Generated API reference. Related units: `fresh-ui`.", href: resolveXref("ref:fresh").href },
  { eyebrow: "Understand", title: "Contracts & type flow", body: "The design rationale behind this pillar.", href: resolveXref("explain:contracts").href },
] }) }}
