---
layout: layouts/base.vto
title: Live Dashboard
templateEngine: [vento, md]
prev: { label: "Tutorials", href: "/tutorials/" }
next: { label: "1 · Scaffold", href: "/tutorials/live-dashboard/01-scaffold/" }
order: 4
---

# Live Dashboard

This track builds a real-time operations dashboard for an order queue, from a typed contract on the
backend to a durable change-stream in the browser. By the last chapter, an open page receives
server-pushed updates with no manual refresh, no polling loop and no hand-written WebSocket.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/live-dashboard/01-scaffold/" },
  { label: "2 · Contract to service", href: "/tutorials/live-dashboard/02-contract-to-service/" },
  { label: "3 · Cache-first query", href: "/tutorials/live-dashboard/03-sdk-cache-first-query/" },
  { label: "4 · definePage + island", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" },
  { label: "5 · Live stream", href: "/tutorials/live-dashboard/05-live-stream/" },
  { label: "6 · Deploy", href: "/tutorials/live-dashboard/06-deploy/" }
] }) }}

## What you will build

A `my-dashboard/` Fresh workspace whose home screen is an order queue. You scaffold a NetScript
project, expose an `orders` read-model through a typed oRPC service, add a cache-first SDK query
layer, and render the queue with NetScript's `definePage` page builder and a hydrated TanStack Query
island. Then you subscribe a page to a durable change-stream so the server pushes updates into it.
The final chapter runs the whole graph locally under Aspire. The same project grows chapter by
chapter, so work them in order.

## Before you begin

You need the toolchain every NetScript tutorial assumes. Check that Deno, the Aspire CLI and Docker
are available:

```sh
deno --version && aspire --version && docker info
```

You see a Deno 2.x version, an Aspire CLI version, and Docker engine details (not a connection
error). If any is missing, the [quickstart](/quickstart/) walks through installing it. Install the
NetScript CLI:

```sh
deno install --global --allow-all --name netscript jsr:@netscript/cli{{ releaseSpecifier }}
```

{{ comp callout { type: "note", title: "New to NetScript? Start with the main ladder" } }}
This track assumes you know the contract-first service loop. If <code>defineService</code> and oRPC
contracts are new to you, do the <a href="/quickstart/">Quickstart</a> and the
<a href="/tutorials/storefront/02-catalog-service/">Storefront catalog-service chapter</a> first. This
track moves faster and goes deeper on the Fresh consumer side.
{{ /comp }}

## The arc: contract → client → query → island → stream

One shape of data travels from the database to a live cell in the browser, type-checked at every
hop. Each chapter adds one link:

{{ comp.featureGrid({ items: [
  {
    title: "1 · Scaffold the workspace",
    body: "Create <code>my-dashboard/</code> with <code>netscript init</code>, tour the Fresh app, and boot it under Aspire, with the Aspire dashboard on the URL Aspire prints.",
    href: "/tutorials/live-dashboard/01-scaffold/"
  },
  {
    title: "2 · A typed read-model service",
    body: "Read an <code>orders</code> oRPC contract built with <code>.route().input().output()</code> and serve it with <code>defineService</code>. This is the data your dashboard reads.",
    href: "/tutorials/live-dashboard/02-contract-to-service/"
  },
  {
    title: "3 · SDK client + cache-first query",
    body: "Build a typed <code>createServiceClient</code> and a <code>createQueryFactories</code> query layer with KV-backed stale-while-revalidate. Service discovery resolves the URL.",
    href: "/tutorials/live-dashboard/03-sdk-cache-first-query/"
  },
  {
    title: "4 · definePage + QueryIsland",
    body: "Render the table with the <code>definePage</code> builder's layers, partials and islands, and hydrate a TanStack Query island for client-side reads and optimistic mutations.",
    href: "/tutorials/live-dashboard/04-definePage-QueryIsland/"
  },
  {
    title: "5 · Go live with StreamDB",
    body: "Replace polling with a durable change-stream: <code>createSagasStreamDB</code> feeds <code>useLiveQuery</code>, and rows arrive over the open subscription after each durable saga transition.",
    href: "/tutorials/live-dashboard/05-live-stream/"
  },
  {
    title: "6 · Run it all under Aspire",
    body: "Bring up the service, the Fresh app, the streams runtime, Postgres and Redis with one <code>aspire start</code>, and see what local orchestration is and is not.",
    href: "/tutorials/live-dashboard/06-deploy/"
  }
] }) }}

## Start the track

Start at chapter 1 and keep the same `my-dashboard/` through to chapter 6. For exact symbols, the
[fresh](/reference/fresh/), [sdk](/reference/sdk/), [service](/reference/service/) and
[streams](/reference/streams/) reference units back these chapters. After the track, the guides in
**Build › [Web Layer](/web-layer/)** pick up where the chapters stop.
