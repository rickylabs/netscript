---
layout: layouts/base.vto
title: Build a storefront backend
templateEngine: [vento, md]
prev: { label: "Tutorials", href: "/tutorials/" }
next: { label: "1 · Scaffold", href: "/tutorials/storefront/01-scaffold/" }
order: 4
---

# Build a storefront backend

This track is a project, not a tour. Across seven chapters you build a small e-commerce storefront —
a products catalog, a cart, a durable checkout, a shipping webhook, and a storefront page — in one
workspace that grows chapter by chapter. It is the same spine the NetScript playground runs, re-themed
as a shop, so every pattern you learn here is one the framework's own example app uses in anger.

The differentiator this track proves is **one typed contract, honored from the database to the
button**: the oRPC schema you write once is the same object the server handler validates against, the
same one a page's query and checkout mutation are typed from, so a wrong field is a compile error, not
a 2 a.m. incident. **What this replaces:** the hand-maintained REST-plus-fetch-wrapper-plus-DTO stack
where the client's idea of a cart and the server's idea of a cart are two files that drift until
production catches them apart.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/storefront/01-scaffold/" },
  { label: "2 · Catalog service", href: "/tutorials/storefront/02-catalog-service/" },
  { label: "3 · Cart contracts", href: "/tutorials/storefront/03-cart-contracts/" },
  { label: "4 · Checkout saga", href: "/tutorials/storefront/04-checkout-saga/" },
  { label: "5 · Shipping webhook", href: "/tutorials/storefront/05-shipping-webhook/" },
  { label: "6 · Storefront UI", href: "/tutorials/storefront/06-storefront-ui/" },
  { label: "7 · Deploy", href: "/tutorials/storefront/07-deploy/" }
] }) }}

## What you will build

A working storefront backend called `my-shop/`: a typed `products` catalog service backed by
Postgres, a `cart` domain defined contract-first, a durable `checkout` saga that survives restarts
and compensates on failure, and an HMAC-verified shipping webhook that hands inbound provider events
to a background job. By the last chapter the whole thing runs on your machine under one orchestrator,
visible in a single dashboard.

The arc is deliberate. It teaches NetScript's central opinion — **the oRPC contract is the single
source of truth** — and then shows what that buys you once the happy path needs to survive money
changing hands: durable workflows and verified webhooks make checkout reliable instead of hopeful.

## The shape of the app

{{ comp.featureGrid({ items: [
  {
    title: "Catalog → cart → checkout → shipping",
    body: "Products live in a typed service. A cart contract models a new domain. Checkout is a durable saga with a compensation branch. Shipping arrives as a verified webhook that enqueues a job. Each piece is one chapter.",
    href: "/tutorials/storefront/02-catalog-service/"
  },
  {
    title: "Contract-first, everywhere",
    body: "Every service surface is an <code>@orpc/contract</code> route with Zod input/output schemas — many of them generated from Prisma. Write the schema once and the server handler, the typed client, and the OpenAPI projection all agree.",
    href: "/tutorials/storefront/02-catalog-service/"
  },
  {
    title: "Durable by design",
    body: "Checkout is not a one-shot call — it is a state machine with <code>defineSaga</code> that checkpoints its state, reacts to payment and inventory messages, and runs a compensation path when a step fails.",
    href: "/tutorials/storefront/04-checkout-saga/"
  }
] }) }}

## Who this is for

You are comfortable with TypeScript and have used Deno at least a little. You do not need prior
NetScript experience — chapter 1 starts from an empty folder — but if you have never run the
framework locally, skim the [Quickstart](/quickstart/) first; it
covers the same scaffold at a gentler pace. This track moves faster and stays on the storefront
domain the whole way.

You also do not need to read the whole framework before you start. Each chapter introduces exactly
one new capability, grounds it in real running code, and proves it with a command whose output you
can check.

## The seven chapters

{{ comp.featureGrid({ items: [
  {
    title: "1 · Scaffold",
    body: "Create <code>my-shop/</code> with the <code>netscript</code> CLI and boot it under Aspire. Postgres (the default; swap <code>--db postgres</code> for <code>mysql</code>, <code>mssql</code>, or <code>sqlite</code>), the Redis cache, and your service come up together; the dashboard answers on :18888.",
    href: "/tutorials/storefront/01-scaffold/"
  },
  {
    title: "2 · Catalog service",
    body: "Define a typed <code>products</code> contract whose schemas come from Prisma, implement the handlers against a Postgres-backed database client, and serve it with <code>defineService</code> on :3001.",
    href: "/tutorials/storefront/02-catalog-service/"
  },
  {
    title: "3 · Cart contracts",
    body: "Model a brand-new <code>cart</code> domain contract-first — list, getById, create, update — with shared typed errors, then derive a fully typed client from it. No handler guesswork.",
    href: "/tutorials/storefront/03-cart-contracts/"
  },
  {
    title: "4 · Checkout saga",
    body: "Turn checkout into a durable workflow with <code>defineSaga</code>: a state machine that walks order → payment → inventory → shipment and compensates when a step fails.",
    href: "/tutorials/storefront/04-checkout-saga/"
  },
  {
    title: "5 · Shipping webhook",
    body: "Accept an HMAC-verified shipping/payment webhook with <code>defineWebhook</code> and hand each inbound event to a background job with <code>enqueueJob</code>. Triggers API on :8093.",
    href: "/tutorials/storefront/05-shipping-webhook/"
  },
  {
    title: "6 · Storefront UI",
    body: "Put a face on the backend: a typed cart route with <code>createRouteReference</code>, a catalog query and a checkout mutation driven through <code>createServiceClient</code> → <code>createServiceQueryUtils</code> in a Fresh island. The typed contract, honored all the way to the button.",
    href: "/tutorials/storefront/06-storefront-ui/"
  },
  {
    title: "7 · Deploy",
    body: "Run the whole storefront locally under one <code>aspire start</code> — every service, plugin API, and background processor in one resource graph, observable from the dashboard. The local topology, not a cloud deployer.",
    href: "/tutorials/storefront/07-deploy/"
  }
] }) }}

{{ comp callout { type: "note", title: "One workspace, carried forward" } }}
This is a tutorial track: state compounds. The <code>my-shop/</code> workspace you create in chapter 1 is the same one you finish in chapter 7 — each chapter begins by checking the project state the previous one left, and each "What you built" feeds the next chapter's objective. Work the chapters in order.
{{ /comp }}

## Start the build

{{ comp.nextPrev({ prev: { label: "Tutorials", href: "/tutorials/" }, next: { label: "1 · Scaffold", href: "/tutorials/storefront/01-scaffold/" } }) }}
