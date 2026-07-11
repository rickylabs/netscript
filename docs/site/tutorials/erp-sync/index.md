---
layout: layouts/base.vto
title: ERP Sync
templateEngine: [vento, md]
prev: { label: "Tutorials", href: "/tutorials/" }
next: { label: "1 · Scaffold", href: "/tutorials/erp-sync/01-scaffold/" }
---

# ERP Sync

Your team is mid-migration between two ERPs. **SAP**, the legacy system, is still the
system of record — production plans against it every day. **Microsoft Dynamics**, its replacement,
goes live in stages, which means that for months the two run in parallel and Dynamics is only as
correct as the sync that feeds it. The integration you are handed is a **file export**, not an
API: SAP drops a nightly file, and your job is to ingest it. This track builds that sync:
a back-office service that watches for the SAP export drops, turns each one into a durable
background job, transforms legacy rows into Dynamics' shape, absorbs backfill bursts behind a queue,
and re-syncs nightly on a cron. It is the durable-processing companion to the
[main tutorials ladder](/tutorials/): where that ladder ends at a request/response service plus a
webhook, this one is about everything that happens **off** the request path.

The differentiator this track proves is **durable background processing you did not hand-roll**:
the file-watch trigger, the job, the queue, and the cron are first-class NetScript primitives wired
into one orchestrated runtime — in place of the pile of cron entries, ad-hoc `nohup` workers, and
bespoke glue scripts most teams reach for, the kind that silently drop a file or a row when a
process dies mid-run.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/erp-sync/01-scaffold/" },
  { label: "2 · Import job", href: "/tutorials/erp-sync/02-import-job/" },
  { label: "3 · Polyglot transform", href: "/tutorials/erp-sync/03-polyglot-transform/" },
  { label: "4 · Queue & cron", href: "/tutorials/erp-sync/04-queue-and-cron/" },
  { label: "5 · Deploy", href: "/tutorials/erp-sync/05-deploy/" }
] }) }}

## What you will build

By the end of this five-chapter track you will have `my-erp/` on disk: a NetScript workspace with
the **workers** and **triggers** plugins installed, a file-watch trigger that fires the moment
the SAP export job drops a `products_*.csv` into the hand-off folder, a background **job** that
parses it, a runnable **transform task** — executed as a sandboxed subprocess — that rewrites
the legacy columns and integer-cent prices into Dynamics' shape, a **queue** sized for backfill bursts,
and a **cron** schedule that re-syncs nightly — all orchestrated locally by Aspire and visible in
one dashboard. Along the way you will see how the same task builder targets **polyglot**
(non-TypeScript) runtimes, so a Python or shell step can join the pipeline when TypeScript is not
the right tool.

The spine is one idea repeated at every layer: **durable background processing**. The stakes are
concrete: a file the watcher misses is a day of catalog changes Dynamics never sees; a row loaded
untransformed puts prices off by a factor of one hundred; a burst that overwhelms a single worker
delays the re-sync everyone plans against. An inbound file becomes a queued job; the job runs in
an isolated worker; the transform runs in a sandboxed subprocess; recurring work runs on a
schedule; and nothing is lost across a restart.

## The arc

```
SAP export job drops products_2024.csv     (a file lands in .data/incoming/products)
        │  defineFileWatch trigger fires on 'create'
        ▼
enqueueJob('import-products')              (a durable worker job, :8091)
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

Every chapter on this spine is hands-on and closes on something you can observe — a JSON body, a
log line, a file on disk. Chapter 3 also carries the track's one deliberately forward-looking
section: the Python variant of the transform, marked plainly as a step for your own host because
non-Deno runtimes are not sandboxed and need their interpreter installed.

## The chapters

{{ comp.featureGrid({ items: [
  {
    title: "1 · Scaffold the workspace",
    body: "Create <code>my-erp/</code> with <code>netscript init</code>, add the <strong>workers</strong> and <strong>triggers</strong> plugins, and boot the whole thing under Aspire. Ends at the dashboard on <code>:18888</code>.",
    href: "/tutorials/erp-sync/01-scaffold/"
  },
  {
    title: "2 · Import job",
    body: "Watch <code>.data/incoming/products</code> with <code>defineFileWatch</code> and turn every <code>products_*.csv</code> the SAP export drops into a durable <code>defineJobHandler</code> background job that parses the rows.",
    href: "/tutorials/erp-sync/02-import-job/"
  },
  {
    title: "3 · Polyglot transform",
    body: "Build and <strong>run</strong> the SAP→Dynamics transform as a sandboxed <code>deno</code> task: <code>defineTask</code>, explicit <code>.permissions()</code> compiled to <code>--allow-*</code> flags, and the executor. The Python variant is the caveated next step.",
    href: "/tutorials/erp-sync/03-polyglot-transform/"
  },
  {
    title: "4 · Queue & cron",
    body: "Pick a <code>QueueProvider</code>, size worker concurrency in config, and add a <code>defineScheduledTrigger</code> cron for the nightly re-sync. Includes the concurrency env-var gotcha.",
    href: "/tutorials/erp-sync/04-queue-and-cron/"
  },
  {
    title: "5 · Deploy locally",
    body: "Run the whole sync — workers, triggers, queue, and cron processors — on one machine under <code>aspire start</code>, and read it from the dashboard. Shows local-vs-production topology clearly.",
    href: "/tutorials/erp-sync/05-deploy/"
  }
] }) }}

## Before you start

This track assumes the same local toolchain as the main ladder: a recent
[Deno](https://deno.com/) and the [.NET Aspire](https://learn.microsoft.com/dotnet/aspire/) CLI on
your `PATH`, plus Docker running so Aspire can provision Postgres and Redis. This track uses
Postgres (the default; swap `--db postgres` for `mysql`, `mssql`, or `sqlite` when you scaffold). If NetScript is brand
new to you, walk the [Storefront tutorial](/tutorials/storefront/) first — it
explains every generated directory in more depth than we re-cover here. This track then re-grounds
you from a fresh scaffold, so you can start either place.

{{ comp callout { type: "note", title: "One workspace, five chapters" } }}
Every chapter grows the same <code>my-erp/</code> project. Each one opens with a <strong>Before you
begin</strong> state check and closes with <strong>What you built</strong>, so the work compounds
instead of resetting between chapters. Follow them in order.
{{ /comp }}

{{ comp.nextPrev({ prev: { label: "Tutorials", href: "/tutorials/" }, next: { label: "1 · Scaffold", href: "/tutorials/erp-sync/01-scaffold/" } }) }}
