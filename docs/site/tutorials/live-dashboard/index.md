---
layout: layouts/base.vto
title: Live Dashboard
templateEngine: [vento, md]
prev: { label: "Tutorials", href: "/tutorials/" }
next: { label: "1 · Scaffold", href: "/tutorials/live-dashboard/01-scaffold/" }
---

# Live Dashboard

An order queue goes wrong quietly. The screen your fulfillment team watches shows five-minute-old
rows, so the packing station ships an order the customer cancelled three minutes ago, and a payment
that failed at 14:02 sits looking like `processing` until someone thinks to hit refresh. The usual
fix — poll harder — just trades staleness for load and still leaves a gap for the next missed
cancellation.

This track builds the alternative end to end: a real-time operations dashboard for an order queue.
By the last chapter you will have a table that updates **live** in the browser — no manual refresh,
no polling loop, no hand-rolled WebSocket — fed by the full NetScript data spine, from a typed
contract on the backend to a durable change-stream on the frontend. It is the same durable-stream
seam the streams plugin scaffolds into a workspace for notification fan-out — here, pointed at your
orders.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/live-dashboard/01-scaffold/" },
  { label: "2 · Contract to service", href: "/tutorials/live-dashboard/02-contract-to-service/" },
  { label: "3 · Cache-first query", href: "/tutorials/live-dashboard/03-sdk-cache-first-query/" },
  { label: "4 · definePage + island", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" },
  { label: "5 · Live stream", href: "/tutorials/live-dashboard/05-live-stream/" },
  { label: "6 · Deploy", href: "/tutorials/live-dashboard/06-deploy/" }
] }) }}

## What you will build

A `my-dashboard/` Fresh workspace whose home screen is the live order queue described above. You
scaffold a fresh NetScript project, expose an `orders` read-model through a typed oRPC service, wire
a cache-first SDK query layer, render the queue with NetScript's `definePage` page builder and a
hydrated TanStack Query island, then upgrade it to push real-time updates over a durable
change-stream — the point where the refresh button stops mattering. The final chapter runs the whole
graph locally under Aspire. This is a learning track: the same project grows chapter by chapter, so
do them in order.

## Before you begin

You need a working local toolchain — the same one every NetScript tutorial assumes. Confirm Deno,
the Aspire CLI, and Docker are on your `PATH`:

```sh
deno --version && aspire --version && docker info
```

You should see a Deno 2.x version, an Aspire CLI version, and Docker engine details (not a
connection error). If any are missing, the [quickstart](/quickstart/) walks through installing them.
Install the NetScript CLI once:

```sh
deno install --global --allow-all --name netscript jsr:@netscript/cli{{ releaseSpecifier }}
```

{{ comp callout { type: "note", title: "New to NetScript? Walk the main ladder first" } }}
This track assumes you are comfortable with the contract-first service loop. If <code>defineService</code> and oRPC contracts are new, do the <a href="/quickstart/">Quickstart</a> and the <a href="/tutorials/storefront/02-catalog-service/">Storefront catalog-service chapter</a> first — they move slower. This track moves faster and goes deeper on the Fresh consumer surface.
{{ /comp }}

## The arc: contract → client → query → island → stream

NetScript's signature spine carries one shape of data from the database all the way to a live cell
in the browser, type-checked at every hop. Each chapter adds exactly one link:

{{ comp.featureGrid({ items: [
  {
    title: "1 · Scaffold the workspace",
    body: "Create <code>my-dashboard/</code> with <code>netscript init</code>, tour the Fresh app, and boot it under Aspire. You end with a running frontend on the app port and the Aspire dashboard on :18888.",
    href: "/tutorials/live-dashboard/01-scaffold/"
  },
  {
    title: "2 · A typed read-model service",
    body: "Define an <code>orders</code> oRPC contract with <code>.route().input().output()</code> and serve it with <code>defineService</code>. This is the data your dashboard reads.",
    href: "/tutorials/live-dashboard/02-contract-to-service/"
  },
  {
    title: "3 · SDK client + cache-first query",
    body: "Build a typed <code>createServiceClient</code> and a <code>createQueryFactories</code> query layer with KV-backed stale-while-revalidate. Service discovery resolves the URL for you.",
    href: "/tutorials/live-dashboard/03-sdk-cache-first-query/"
  },
  {
    title: "4 · definePage + QueryIsland",
    body: "Render the table with NetScript's <code>definePage</code> builder — the layer / partial / island triad — and hydrate a TanStack Query island for client-side reads and optimistic mutations.",
    href: "/tutorials/live-dashboard/04-definePage-QueryIsland/"
  },
  {
    title: "5 · Go live with StreamDB",
    body: "Replace polling with a durable change-stream: <code>createSagasStreamDB</code> feeds <code>useLiveQuery</code> so rows update the instant state changes on the server.",
    href: "/tutorials/live-dashboard/05-live-stream/"
  },
  {
    title: "6 · Run it all under Aspire",
    body: "Bring the whole graph up locally — service, Fresh app, streams runtime, Postgres (the default; swap <code>--db</code> for <code>mysql</code> / <code>mssql</code> / <code>sqlite</code> at scaffold time), Redis — with one <code>aspire start</code>. Clear about what local orchestration is and is not.",
    href: "/tutorials/live-dashboard/06-deploy/"
  }
] }) }}

{{ comp callout { type: "tip", title: "Where to look things up" } }}
This track teaches the path. For exact symbols and signatures, the <a href="/reference/">reference</a> is generated from source and always current — the <a href="/reference/fresh/">fresh</a>, <a href="/reference/sdk/">sdk</a>, <a href="/reference/service/">service</a>, and <a href="/reference/streams/">streams</a> units back the chapters here. For the reasoning behind contracts and durability, read the <a href="/explanation/">explanation</a> pages.
{{ /comp }}

## What you built

By the end of this track you will own an order queue your operations team can act on without
second-guessing it — and, more importantly, the full NetScript read spine that powers it, from
contract to durable stream. Every hop is typed off the same contract, so the row a packer sees is
the row the service wrote.

{{ comp.nextPrev({ prev: { label: "Tutorials", href: "/tutorials/" }, next: { label: "1 · Scaffold", href: "/tutorials/live-dashboard/01-scaffold/" } }) }}
