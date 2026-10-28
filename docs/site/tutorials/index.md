---
layout: layouts/base.vto
title: Tutorials
nav_title: Overview
description: Five tracks, each building one complete application from netscript init to a running Aspire graph.
templateEngine: [vento, md]
prev: null
next:
  label: "Storefront"
  href: "/tutorials/storefront/"
---

# Tutorials

Each tutorial builds one application step by step, from an empty directory to a running app. Every
step ends with a command or an endpoint you can check, and each track introduces capabilities in the
order you need them. You don't need to know the framework before you start.

## Five tracks, five applications

Each track builds one complete application from a fresh `netscript init` and ends by running it
locally under Aspire. The tracks are independent: start with the one closest to what you're building.

{{ comp.featureGrid({ items: [
  {
    title: "Storefront",
    body: "An e-commerce backend: a typed catalog service, a contract-first cart, a durable <code>checkout</code> saga with compensation, an HMAC-verified shipping webhook and a storefront page. Teaches <strong>services and durable workflows</strong>. 7 chapters.",
    href: "/tutorials/storefront/"
  },
  {
    title: "Team Workspace",
    body: "An authenticated SaaS backend: a pluggable auth backend and session, team data in a second database, a provisioning job, and routes protected with <code>.withAuthz()</code>. Teaches <strong>auth and access control</strong>. 6 chapters.",
    href: "/tutorials/workspace/"
  },
  {
    title: "ERP Sync",
    body: "A legacy-ERP migration sync: watch for incoming data files, ingest them with durable jobs, run a sandboxed transform task, and add a queue provider and a cron schedule. Teaches <strong>jobs, queues and polyglot tasks</strong>. 5 chapters.",
    href: "/tutorials/erp-sync/"
  },
  {
    title: "Live Dashboard",
    body: "A real-time UI with no polling: a typed contract, an SDK client, a cache-first query, a Fresh <code>definePage</code> with a hydrated <code>QueryIsland</code>, and a durable StreamDB feed that pushes updates into the page. Teaches <strong>the typed Fresh and SDK stack</strong>. 6 chapters.",
    href: "/tutorials/live-dashboard/"
  },
  {
    title: "AI Chat",
    body: "A durable AI chat app whose transcript, streaming markdown, tool-call cards and MCP widgets survive reload and reconnect: a durable chat route on <code>@netscript/fresh/ai</code>, the <code>fresh-ui</code> chat components, a server-side tool, a remote MCP server and a live island. Teaches <strong>durable AI chat</strong>. 6 chapters.",
    href: "/tutorials/chat/"
  }
] }) }}

## Not sure which to pick?

{{ comp.apiTable({
  caption: "Choose by what you're building",
  rows: [
    { name: "An API with multi-step business logic", type: "Storefront", desc: "Typed services and a workflow that can't half-complete: orders, payments, fulfillment. Teaches contracts, defineService, sagas and webhooks." },
    { name: "An app behind a login", type: "Team Workspace", desc: "Authentication, sessions and route-level access control first. Teaches the auth backend, session crypto and the .withAuthz() seam." },
    { name: "Data pipelines and scheduled work", type: "ERP Sync", desc: "Work off the request path: file ingestion, batch jobs, scheduled syncs and tasks in other languages. Teaches triggers, jobs, queues, cron and the task runtime." },
    { name: "A live, reactive frontend", type: "Live Dashboard", desc: "Server data in a Fresh UI that stays current without a refresh. Teaches the SDK client, cache-first queries, the page builder, islands and durable streams." },
    { name: "A durable AI chat app", type: "AI Chat", desc: "A chat UI whose transcript, streaming markdown, tool-call cards and MCP widgets survive reload and reconnect, with replies that stream in live. Teaches the durable chat route on @netscript/fresh/ai, the fresh-ui chat components, a server-side tool, the MCP client stack and the live subscription." }
  ]
}) }}

New to NetScript? Any track starts from zero, but **Storefront** covers the most core ideas.

## Before you start

Every track needs the same local toolchain:

- a recent [Deno](https://deno.com/);
- the [Aspire](https://aspire.dev) CLI on your `PATH`;
- the NetScript CLI:

```sh
deno install --global --allow-all --name netscript jsr:@netscript/cli{{ releaseSpecifier }}
```

If you have never run NetScript on this machine, the [quickstart](/quickstart/) installs the CLI and
boots a project in a few commands. Each chapter lists the earlier chapters it builds on.

## When you finish

{{ comp.featureGrid({ items: [
  {
    title: "Build",
    body: "A guide for each capability, and recipes for tasks the tutorials don't cover: discovering services, exposing OpenAPI, choosing a queue provider, second databases and production pitfalls.",
    href: "/how-to/"
  },
  {
    title: "Reference",
    body: "The API surface of every <code>@netscript/*</code> package: exact symbols, signatures and types.",
    href: "/reference/"
  },
  {
    title: "Concepts",
    body: "The design reasoning behind contracts-first services, durable execution, the plugin model and the local Aspire topology.",
    href: "/explanation/"
  }
] }) }}
