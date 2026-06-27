---
layout: layouts/base.vto
title: ERP Sync
templateEngine: [vento, md]
prev: { label: "Tutorials", href: "/tutorials/" }
next: { label: "1 · Scaffold", href: "/tutorials/erp-sync/01-scaffold/" }
---

# ERP Sync

This track builds a **back-office data ingestion service** — an ERP sync backend that watches for
supplier data files, turns each one into a durable background job, scales that work behind a queue,
and runs scheduled maintenance on a cron. It is the durable-processing companion to the
[main tutorials ladder](/tutorials/): where that ladder ends at a request/response service plus a
webhook, this one is about everything that happens **off** the request path.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/erp-sync/01-scaffold/" },
  { label: "2 · Import job", href: "/tutorials/erp-sync/02-import-job/" },
  { label: "3 · Polyglot transform", href: "/tutorials/erp-sync/03-polyglot-transform/" },
  { label: "4 · Queue & cron", href: "/tutorials/erp-sync/04-queue-and-cron/" },
  { label: "5 · Deploy", href: "/tutorials/erp-sync/05-deploy/" }
] }) }}

## What you will build

By the end of this five-chapter track you will have `my-erp/` on disk: a NetScript workspace with
the **workers** and **triggers** plugins installed, a file-watch trigger that fires the moment a
supplier drops a `products_*.csv` into a watched folder, a background **job** that parses it, a
**queue** sized for throughput, and a **cron** schedule that runs recurring maintenance — all
orchestrated locally by Aspire and visible in one dashboard. You will also understand how NetScript
runs **polyglot** (non-TypeScript) transform tasks, so a Python or shell step can join the pipeline
when TypeScript is not the right tool.

The spine is one idea repeated at every layer: **durable background processing**. An inbound file
becomes a queued job; the job runs in an isolated worker; recurring work runs on a schedule; and
nothing is lost across a restart.

## The arc

```
supplier drops products_2024.csv          (a file lands in .data/incoming/products)
        │  defineFileWatch trigger fires on 'create'
        ▼
enqueueJob('import-products')             (a durable worker job, :8091)
        │  the job parses + records the rows
        ▼
queue provider (Deno KV → Redis/RabbitMQ) (sized for throughput in config)
        │
        ▼
cron / scheduled trigger                  (recurring re-sync + cleanup)
```

Chapter 3 steps **off** this hands-on spine to teach the polyglot runtime: how to define a `python`
or `shell` task, the per-runtime permission model, and which runtimes NetScript supports. It is the
one chapter you read rather than run end-to-end — and it says so plainly.

## The chapters

{{ comp.featureGrid({ items: [
  {
    title: "1 · Scaffold the workspace",
    body: "Create <code>my-erp/</code> with <code>netscript init</code>, add the <strong>workers</strong> and <strong>triggers</strong> plugins, and boot the whole thing under Aspire. Ends at the dashboard on <code>:18888</code>.",
    href: "/tutorials/erp-sync/01-scaffold/"
  },
  {
    title: "2 · Import job",
    body: "Watch <code>.data/incoming/products</code> with <code>defineFileWatch</code> and turn every <code>products_*.csv</code> into a durable <code>defineJobHandler</code> background job that parses the rows.",
    href: "/tutorials/erp-sync/02-import-job/"
  },
  {
    title: "3 · Polyglot transform",
    body: "Read how a non-TypeScript transform step works: the <code>defineTask().runtime('python')</code> shape, the per-runtime permission model, and the runtime support matrix. A documented capability, not a run-it-now step.",
    href: "/tutorials/erp-sync/03-polyglot-transform/"
  },
  {
    title: "4 · Queue & cron",
    body: "Pick a <code>QueueProvider</code>, size worker concurrency in config, and add a <code>defineScheduledTrigger</code> cron that re-syncs on a cadence. Includes the concurrency env-var gotcha.",
    href: "/tutorials/erp-sync/04-queue-and-cron/"
  },
  {
    title: "5 · Deploy locally",
    body: "Run the whole ERP backend — workers, triggers, queue, and cron processors — on one machine under <code>aspire start</code>, and read it from the dashboard. Shows local-vs-production topology clearly.",
    href: "/tutorials/erp-sync/05-deploy/"
  }
] }) }}

## Before you start

This track assumes the same local toolchain as the main ladder: a recent
[Deno](https://deno.com/) and the [.NET Aspire](https://learn.microsoft.com/dotnet/aspire/) CLI on
your `PATH`, plus Docker running so Aspire can provision Postgres and Redis. If NetScript is brand
new to you, walk the [Storefront tutorial](/tutorials/storefront/) first — it
explains every generated directory in more depth than we re-cover here. This track then re-grounds
you from a fresh scaffold, so you can start either place.

{{ comp callout { type: "note", title: "One workspace, five chapters" } }}
Every chapter grows the same <code>my-erp/</code> project. Each one opens with a <strong>Before you
begin</strong> state check and closes with <strong>What you built</strong>, so the work compounds
instead of resetting between chapters. Follow them in order.
{{ /comp }}

{{ comp.nextPrev({ prev: { label: "Tutorials", href: "/tutorials/" }, next: { label: "1 · Scaffold", href: "/tutorials/erp-sync/01-scaffold/" } }) }}
