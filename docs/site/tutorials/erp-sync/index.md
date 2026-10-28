---
layout: layouts/base.vto
title: ERP Sync
templateEngine: [vento, md]
prev: { label: "Tutorials", href: "/tutorials/" }
next: { label: "1 · Scaffold", href: "/tutorials/erp-sync/01-scaffold/" }
order: 3
---

# ERP Sync

This track builds the sync service for a team midway through an ERP migration. **SAP**, the legacy
system, is still the system of record. **Microsoft Dynamics**, its replacement, goes live in
stages, so for months the two run in parallel and Dynamics is only as correct as the sync that
feeds it. The integration is a **file export**, not an API: SAP drops a file every night, and the
service has to ingest it.

The service watches for the SAP export drops, turns each one into a durable background job,
transforms legacy rows into Dynamics' shape, absorbs backfill bursts behind a queue, and re-syncs
nightly on a cron. The file-watch trigger, the job, the queue and the cron are NetScript primitives
wired into one orchestrated runtime. They replace the usual cron entries, `nohup` workers and glue
scripts, which silently drop a file or a row when a process dies mid-run.

The [main tutorials ladder](/tutorials/) ends at a request/response service plus a webhook; this
track covers the work that happens **off** the request path.

## What you will build

`my-erp/`: a NetScript workspace with the **workers** and **triggers** plugins, orchestrated
locally by Aspire and visible in one dashboard. Every chapter grows the same project, so do the
chapters in order.

## The arc

```text
SAP export job drops products_2024.csv     (a file lands in .data/incoming/products)
        │  defineFileWatch trigger fires on 'create'
        ▼
enqueueJob('import-products')              (a durable worker job)
        │  the job parses + records the raw SAP rows
        ▼
normalize-sap transform task               (sandboxed deno subprocess: SAP shape → Dynamics shape)
        │
        ▼
queue provider (Deno KV → Redis/RabbitMQ)  (sized for backfill bursts in config)
        │
        ▼
cron / scheduled trigger                   (nightly re-sync until cutover)
```

Each chapter ends on something you can observe: a JSON body, a log line or a file on disk. The
exception is the Python variant of the transform in chapter 3, a step for your own host, because
non-Deno runtimes are not sandboxed and need their interpreter installed.

## The chapters

{{ comp.featureGrid({ items: [
  {
    title: "1 · Scaffold the workspace",
    body: "Create <code>my-erp/</code> with <code>netscript init</code>, add the <strong>workers</strong> and <strong>triggers</strong> plugins, and boot under Aspire.",
    href: "/tutorials/erp-sync/01-scaffold/"
  },
  {
    title: "2 · Import job",
    body: "Watch <code>.data/incoming/products</code> with <code>defineFileWatch</code> and turn every <code>products_*.csv</code> into a durable <code>defineJobHandler</code> job that parses the rows.",
    href: "/tutorials/erp-sync/02-import-job/"
  },
  {
    title: "3 · Polyglot transform",
    body: "Build and run the SAP→Dynamics transform as a sandboxed <code>deno</code> task with explicit <code>.permissions()</code>, then see the Python variant.",
    href: "/tutorials/erp-sync/03-polyglot-transform/"
  },
  {
    title: "4 · Queue & cron",
    body: "Pick a <code>QueueProvider</code>, size worker concurrency in config, and add a <code>defineScheduledTrigger</code> cron for the nightly re-sync.",
    href: "/tutorials/erp-sync/04-queue-and-cron/"
  },
  {
    title: "5 · Deploy locally",
    body: "Run workers, triggers, queue and cron processors on one machine under <code>aspire start</code>, read them from the dashboard, and see where local stops and production starts.",
    href: "/tutorials/erp-sync/05-deploy/"
  }
] }) }}

## Before you begin

- A recent [Deno](https://deno.com/) and the [Aspire](https://aspire.dev) CLI on your `PATH`.
- Docker running, so Aspire can provision Postgres and Redis.

The track uses Postgres, the default; you can swap `--db postgres` for `mysql`, `mssql` or
`sqlite` when you scaffold. Chapter 1 starts from a fresh scaffold. If NetScript is new to you, the
[Storefront tutorial](/tutorials/storefront/) explains every generated directory in more depth.

When you finish, the [Background jobs](/background-processing/) guides pick up where the track
stops. Start with chapter 1.

{{ comp.nextPrev({ prev: { label: "Tutorials", href: "/tutorials/" }, next: { label: "1 · Scaffold", href: "/tutorials/erp-sync/01-scaffold/" } }) }}
