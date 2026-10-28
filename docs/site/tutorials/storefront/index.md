---
layout: layouts/base.vto
title: Build a storefront backend
templateEngine: [vento, md]
prev: { label: "Tutorials", href: "/tutorials/" }
next: { label: "1 · Scaffold", href: "/tutorials/storefront/01-scaffold/" }
order: 4
---

# Build a storefront backend

Across seven chapters you build a small e-commerce storefront in one workspace: a products catalog,
a cart, a durable checkout, a shipping webhook and a storefront page. The track follows the same
structure as the NetScript playground, recast as a shop. One typed oRPC contract carries through
every layer: the server handler validates against it, and the page's query and checkout mutation
are typed from it, so a wrong field is a compile error.

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

A storefront backend called `my-shop/`:

- a typed `products` catalog service backed by Postgres;
- a `cart` domain defined contract-first;
- a durable `checkout` saga that survives restarts and compensates on failure;
- an HMAC-verified shipping webhook that hands inbound provider events to a background job;
- a storefront page whose query and mutation are typed from the same contracts.

In the last chapter the whole app runs on your machine under one orchestrator, visible in a single
dashboard. The track teaches NetScript's central rule, **the oRPC contract is the single source of
truth**, then adds durable workflows and verified webhooks so checkout holds up when money changes
hands.

## The shape of the app

{{ comp.featureGrid({ items: [
  {
    title: "Catalog → cart → checkout → shipping",
    body: "Products live in a typed service. A cart contract models a new domain. Checkout is a durable saga with a compensation branch. Shipping arrives as a verified webhook that enqueues a job. Each piece is one chapter.",
    href: "/tutorials/storefront/02-catalog-service/"
  },
  {
    title: "Contract-first",
    body: "Every service surface is an <code>@orpc/contract</code> route with Zod input and output schemas, many generated from Prisma. The server handler, the typed client and the OpenAPI projection all derive from one schema.",
    href: "/tutorials/storefront/02-catalog-service/"
  },
  {
    title: "Durable checkout",
    body: "Checkout is a <code>defineSaga</code> state machine: it checkpoints its state, reacts to payment messages, and runs a compensation path when a step fails.",
    href: "/tutorials/storefront/04-checkout-saga/"
  }
] }) }}

## Who this is for

You know TypeScript and have used Deno a little. You don't need NetScript experience: chapter 1
starts from an empty folder. If you have never run the framework locally, skim the
[Quickstart](/quickstart/) first; it covers the same scaffold more slowly. Each chapter adds one
capability and ends with a command whose output you can check.

## The seven chapters

{{ comp.featureGrid({ items: [
  {
    title: "1 · Scaffold",
    body: "Create <code>my-shop/</code> with the <code>netscript</code> CLI and boot it under Aspire: Postgres, the Redis cache and your service come up together, and the dashboard answers on :18888.",
    href: "/tutorials/storefront/01-scaffold/"
  },
  {
    title: "2 · Catalog service",
    body: "Read the typed <code>products</code> contract generated from Prisma, its Postgres-backed handlers and its <code>defineService</code> entry point, then add a typed 404.",
    href: "/tutorials/storefront/02-catalog-service/"
  },
  {
    title: "3 · Cart contracts",
    body: "Model a new <code>cart</code> domain contract-first (list, getById, create, update) with shared typed errors, then derive a typed client from it.",
    href: "/tutorials/storefront/03-cart-contracts/"
  },
  {
    title: "4 · Checkout saga",
    body: "Turn checkout into a durable workflow with <code>defineSaga</code>: a state machine that walks an order through payment and compensates when payment fails.",
    href: "/tutorials/storefront/04-checkout-saga/"
  },
  {
    title: "5 · Shipping webhook",
    body: "Accept an HMAC-verified shipping webhook with <code>defineWebhook</code> and hand each inbound event to a background job with <code>enqueueJob</code>.",
    href: "/tutorials/storefront/05-shipping-webhook/"
  },
  {
    title: "6 · Storefront UI",
    body: "A typed cart route with <code>createRouteReference</code>, and a catalog query and checkout mutation driven through <code>createServiceClient</code> → <code>createQueryFactories</code> in a Fresh island.",
    href: "/tutorials/storefront/06-storefront-ui/"
  },
  {
    title: "7 · Deploy",
    body: "Run the whole storefront locally under one <code>aspire start</code>: every service, plugin API and background processor in one resource graph, observable from the dashboard.",
    href: "/tutorials/storefront/07-deploy/"
  }
] }) }}

## Start the track

Work the chapters in order. The `my-shop/` workspace you create in chapter 1 is the one you finish
in chapter 7: each chapter starts by checking the state the previous one left. After the track, the
guides in **Build › [Services & SDK](/services-sdk/)** pick up where these chapters stop.

{{ comp.nextPrev({ prev: { label: "Tutorials", href: "/tutorials/" }, next: { label: "1 · Scaffold", href: "/tutorials/storefront/01-scaffold/" } }) }}
