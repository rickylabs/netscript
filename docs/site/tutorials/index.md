---
layout: layouts/base.vto
title: Tutorials
templateEngine: [vento, md]
prev: null
next:
  label: "Storefront"
  href: "/tutorials/storefront/"
---

Tutorials are for **learning by building**. Each one walks a fixed path from an
empty directory to a running application — no step skipped, every rung proven by
a real command or endpoint. You don't need to understand the whole framework
before you start; each track introduces its capabilities in the order you'd
actually reach for them.

Unlike the [how-to guides](/how-to/), which assume you already know the shape of
the task, a tutorial follows one continuous example and never leaves you guessing
what to do next.

{{ comp callout { type: "tip", title: "How the four lanes fit together" } }}
Tutorials teach you a path end to end. When you already know the path and just
need the recipe, use the <a href="/how-to/">how-to guides</a>. For exact symbols
and signatures, go to the <a href="/reference/">reference</a>. For the design
reasoning behind durability, contracts, and plugins, read the
<a href="/explanation/">explanation</a> pages.
{{ /comp }}

## Five tracks, five applications

There are five independent tracks. **Each builds one complete application** from a
fresh `netscript init`, and each ends by running that application **locally
under .NET Aspire** — so whichever you pick, you finish with something that boots,
serves, and survives a restart. The tracks don't depend on each other; start with
the one closest to what you're building.

{{ comp.featureGrid({ items: [
  {
    title: "Storefront",
    body: "Build an e-commerce backend: a typed catalog service, contract-first cart, a durable <code>checkout</code> saga with compensation, and an HMAC-verified shipping webhook. The track for <strong>services + durable workflows</strong>. 6 chapters.",
    href: "/tutorials/storefront/"
  },
  {
    title: "Team Workspace",
    body: "Build an authenticated SaaS backend: add a pluggable auth backend and session, model per-plugin data across a second database, run a provisioning job, and protect routes with the <code>.withAuthz()</code> seam. The track for <strong>auth + access control</strong>. 6 chapters.",
    href: "/tutorials/workspace/"
  },
  {
    title: "ERP Sync",
    body: "Build a background-processing backend: watch for incoming data files, ingest them with durable jobs, add a queue provider and a cron schedule, and learn how polyglot (non-TypeScript) transform tasks are defined. The track for <strong>jobs, queues &amp; polyglot</strong>. 5 chapters.",
    href: "/tutorials/erp-sync/"
  },
  {
    title: "Live Dashboard",
    body: "Build a real-time UI: go from a typed contract to an SDK client, a cache-first query, a Fresh <code>definePage</code> with a hydrated <code>QueryIsland</code>, and finally a durable StreamDB feed that updates the table live. The track for <strong>the Fresh + SDK stack</strong>. 6 chapters.",
    href: "/tutorials/live-dashboard/"
  },
  {
    title: "AI Chat",
    body: "Build a durable AI chat app whose transcript, streaming markdown, and tool-call cards survive reload and reconnect: wire a durable chat route on <code>@netscript/fresh/ai</code>, hydrate the <code>fresh-ui</code> chat components, and add one server-side tool. The track for <strong>durable chat UI</strong>. 4 chapters.",
    href: "/tutorials/chat/"
  }
] }) }}

## Not sure which to pick?

{{ comp.apiTable({
  caption: "Choose by what you're building",
  rows: [
    { name: "An API with multi-step business logic", type: "Storefront", desc: "You need typed services and a workflow that can't half-complete — orders, payments, fulfillment. Teaches contracts, defineService, sagas, and webhooks." },
    { name: "An app behind a login", type: "Team Workspace", desc: "You need authentication, sessions, and route-level access control before anything else. Teaches the auth backend, session crypto, and the .withAuthz() seam." },
    { name: "Data pipelines and scheduled work", type: "ERP Sync", desc: "Your work happens off the request path — file ingestion, batch jobs, scheduled syncs, and tasks in other languages. Teaches triggers, jobs, queues, cron, and the task runtime." },
    { name: "A live, reactive frontend", type: "Live Dashboard", desc: "You're rendering server data in a Fresh UI that stays current without a refresh. Teaches the SDK client, cache-first queries, the page builder, islands, and durable streams." },
    { name: "A durable AI chat app", type: "AI Chat", desc: "You're building a chat UI whose transcript, streaming markdown, and tool-call cards survive reload and reconnect. Teaches the durable chat route on @netscript/fresh/ai, the fresh-ui chat components, and one server-side tool." }
  ]
}) }}

New to NetScript entirely? Any track starts from zero, but **Storefront** is the
broadest tour of the core ideas. To inspect the whole shape of a NetScript backend, start there.

## Before you start

Every track assumes a working local toolchain. If you have never run NetScript on
this machine, the [quickstart](/quickstart/) installs the CLI and gets a project
up in a few commands; each track's first chapter then re-grounds you from the
scaffold, so you can start in either place.

{{ comp callout { type: "note", title: "What you'll need" } }}
A recent <a href="https://deno.com/">Deno</a> and the
<a href="https://learn.microsoft.com/dotnet/aspire/">.NET Aspire</a> CLI on your
PATH. Install the NetScript CLI with
<code>deno install --global --allow-all --name netscript jsr:@netscript/cli{{ releaseSpecifier }}</code>.
Each chapter lists its own prerequisite state, so you always know which earlier
chapters it builds on.
{{ /comp }}

## When you finish

Once you've completed a track, branch out into the rest of the docs:

{{ comp.featureGrid({ items: [
  {
    title: "How-to guides",
    body: "Task-focused recipes for things the tutorials don't cover — discovering services, exposing OpenAPI, choosing a queue provider, second databases, and production pitfalls.",
    href: "/how-to/"
  },
  {
    title: "Capabilities",
    body: "One hub per capability (services, workers, sagas, triggers, streams, auth) with the headline API, ports, and endpoints on one screen.",
    href: "/capabilities/"
  },
  {
    title: "Reference",
    body: "Generated, always-current API surface for every <code>@netscript/*</code> unit — exact symbols, signatures, and types.",
    href: "/reference/"
  },
  {
    title: "Explanation",
    body: "The design reasoning behind contracts-first services, durable execution, the plugin model, and the local Aspire topology.",
    href: "/explanation/"
  }
] }) }}
