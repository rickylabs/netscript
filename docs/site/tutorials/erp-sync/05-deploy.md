---
layout: layouts/base.vto
title: Run it locally under Aspire
templateEngine: [vento, md]
prev: { label: "4 · Queue & cron", href: "/tutorials/erp-sync/04-queue-and-cron/" }
next: { label: "How-to guides", href: "/how-to/" }
---

# Run it locally under Aspire

You have built the whole VIF→CSB sync: a file-watch import job, a sandboxed transform task, a
queue, and a cron schedule. This final chapter runs all of it together — workers,
triggers, queue, and cron processors — on one machine under `aspire start`, and shows you how to read
the running system from the dashboard. It is the **local** orchestration story: one command,
one observable stack, throwaway infrastructure.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/erp-sync/01-scaffold/" },
  { label: "2 · Import job", href: "/tutorials/erp-sync/02-import-job/" },
  { label: "3 · Polyglot transform", href: "/tutorials/erp-sync/03-polyglot-transform/" },
  { label: "4 · Queue & cron", href: "/tutorials/erp-sync/04-queue-and-cron/" },
  { label: "5 · Deploy", href: "/tutorials/erp-sync/05-deploy/" }
] }) }}

## What you will build

By the end of this chapter you will bring the full `my-erp/` resource graph up with a single
`aspire start` — Postgres, Redis, the workers API + processor, and the triggers API + processor (which
runs your file-watch and cron triggers) — initialize the database through the running AppHost, and
read the live import pipeline in the Aspire dashboard: resources, console logs, and the traces that
stitch a file drop to its job execution.

{{ comp callout { type: "important", title: "Aspire is the LOCAL story — not a production deployer" } }}
<code>aspire start</code> exists to make <code>git clone</code> → one command produce a complete,
observable, correctly-wired stack on <strong>one machine</strong>. The Postgres and Redis it starts
are throwaway Docker containers for dev convenience — <strong>not</strong> your production database or
cache. Shipping to a remote target (managed infrastructure, your own process lifecycle) is the
<a href="/how-to/deploy/">Deploy</a> recipe; this chapter is the local companion. The full local
walkthrough lives in <a href="/how-to/deploy-local-aspire/">Deploy locally with Aspire</a>.
{{ /comp }}

## Before you begin

You need the complete `my-erp/` workspace from [Chapter 4](/tutorials/erp-sync/04-queue-and-cron/):
the workers and triggers plugins, the `import-products` job, the `normalize-vif` transform task,
the `product-import-trigger` file watch, and the `daily-resync-schedule` cron. Docker must be
running so Aspire can provision Postgres and
Redis. Confirm the AppHost was scaffolded (it is a TypeScript/Node program, not C#):

```sh
ls aspire/apphost.mts aspire/aspire.config.json
```

Expected: both files exist. `netscript init` generated them in Chapter 1; you never hand-write them.

## Step 1 — Understand the graph you are about to run

The resource graph is **derived from your installed plugins** at boot via `composeAppHost` — add a
plugin and its API plus background processor appear; remove it and they vanish, no edit to
`apphost.mts`. With workers and triggers installed, a single `aspire start` stands up this graph:

{{ comp.apiTable({
  caption: "What aspire start brings up for the ERP sync",
  rows: [
    { name: "aspire (dashboard)", type: "https://localhost:18888 / http://localhost:18889", desc: "Live resource list, console logs, structured logs and traces. A login token is printed on start." },
    { name: "OTLP collector", type: "http://localhost:4318", desc: "OpenTelemetry endpoint the dashboard runs; framework spans and structured logs land here automatically." },
    { name: "postgres", type: "Container", desc: "Throwaway Docker Postgres. The database netscript db commands target — reachable only while Aspire is up." },
    { name: "redis", type: "Container (cache)", desc: "Redis cache — the default `--cache-backend`; Redis-compatible. Backs the KV/queue workloads — this is what auto-discovery resolves the queue to once it is up." },
    { name: "workers API + processor", type: ":8091 (PLUGIN_API range) + executable", desc: "The :8091 API enqueues; a separate background processor drains the queue and runs your import job." },
    { name: "triggers API + processor", type: ":8093 (PLUGIN_API range) + executable", desc: "The :8093 API plus the processor that runs your file-watch and cron triggers." }
  ]
}) }}

{{ comp callout { type: "note", title: "Plugin API ports are range-allocated, not fixed" } }}
The runtime plugins publish their APIs from the <code>:8091–8099</code> PLUGIN_API range. The
conventional assignments (workers <code>:8091</code>, triggers <code>:8093</code>) are what this
two-plugin workspace lands on — but the dashboard's <strong>Resources</strong> tab is the authority
for the exact port each resource bound, not a memorized number. Read it from there.
{{ /comp }}

## Step 2 — Restore and run

The AppHost runs on its own isolated Node runtime inside `aspire/` so its dependencies never leak
into your Deno workspace. Restore once per machine, then run — both from inside `aspire/`:

```sh
cd aspire
aspire restore   # one-time SDK restore (and after an SDK bump)
aspire start       # boots the whole graph; prints the dashboard URL + a login token
```

`aspire start` brings up infrastructure first, then the plugin APIs and background processors, with
cross-references resolved into injected environment variables. Leave it running.

## Step 3 — Initialize the database through the running AppHost

With Aspire up, Postgres is live and the `netscript db` commands can reach it. Run them from the
**workspace root** in a second terminal (leave `aspire start` going in the first):

```sh
netscript db init --name init   # create + apply the first migration
netscript db generate           # generate the Prisma client
netscript db seed               # optional: seed development data
```

These talk to the Postgres container Aspire provisioned. Run them with no Aspire up and they fail —
there is no Postgres for them to reach.

{{ comp callout { type: "warning", title: "Order matters: scaffold → orchestrate → database" } }}
The single most common first-run error is running a <code>netscript db</code> command before
<code>aspire start</code>. <code>aspire restore</code> and <code>aspire start</code> run from inside
<code>aspire/</code>; <code>netscript db</code> commands run from the <strong>workspace root</strong>,
<strong>after</strong> the graph is up. Mixing the directories or the order is what breaks. There is
no <code>netscript generate aspire</code> — the AppHost is produced by <code>netscript init</code>.
{{ /comp }}

## Step 4 — Watch the pipeline run end to end

With the full stack up, exercise the pipeline you built and read it from the dashboard. Drop a
file in VIF's export shape:

```sh
cat > .data/incoming/products_live.csv <<'CSV'
art_no,designation,price_centimes
ANV-9,Anvil,4999
CSV
mv .data/incoming/products_live.csv .data/incoming/products/products_live.csv
```

Then open `https://localhost:18888`, paste the login token `aspire start` printed, and use the three
dashboard surfaces:

{{ comp.apiTable({
  caption: "Reading the running ERP sync in the Aspire dashboard",
  rows: [
    { name: "Resources", type: "tab", desc: "Every container and executable with status and the port it bound. Confirm workers, triggers, postgres, and redis are all green." },
    { name: "Console logs", type: "tab", desc: "stdout/stderr per resource. Open the workers processor to read your import job's log lines; the triggers processor shows the file-watch event." },
    { name: "Structured logs + Traces", type: "tab", desc: "Spans correlated by traceparent. The framework instruments job dispatch and execution automatically, so a file drop → job run trace appears with no extra wiring." }
  ]
}) }}

Because Aspire starts each resource with an OTLP endpoint pointed at `http://localhost:4318`,
framework-level spans (job dispatch, job execution, scheduler runs) surface in the **Traces** view on
their own.

{{ comp callout { type: "note", title: "Which spans you see vs. don't" } }}
The <strong>dispatch/execution trace appears automatically</strong> — that is the framework
instrumenting the run end to end, and <code>log.*</code> emits real structured logs. What is
<em>not</em> yet wired are the custom-span helpers some scaffold samples call inside a handler
(<code>trace.withChildSpan</code> via <code>createJobTools</code>) — those are no-op stubs today
(tracked debt). For custom spans now, import from <code>@netscript/telemetry</code> directly. See
<a href="/explanation/observability/">Observability</a> for the framework-vs-scaffold span boundary.
{{ /comp }}

## Verify your progress

Confirm the whole graph is healthy and the pipeline ran:

```sh
# Both plugin APIs answer.
curl http://localhost:8091/health
curl http://localhost:8093/health

# The dropped file produced an import execution.
curl 'http://localhost:8091/api/v1/workers/executions?limit=10'
```

Expected: both health checks return healthy JSON, and the executions feed shows a completed
`import-products` run for `products_live.csv`.

- [ ] `aspire start` is up; the dashboard lists `postgres`, `redis`, workers, and triggers all green.
- [ ] `netscript db init/generate` succeeded against the Aspire Postgres.
- [ ] `curl :8091/health` and `curl :8093/health` both return healthy.
- [ ] A file drop produced an `import-products` execution and a dispatch/execution trace in the dashboard.

{{ comp callout { type: "warning", title: "Footguns when aspire start will not boot" } }}
<ul>
<li><strong>Docker not running</strong> — Aspire provisions Postgres + Redis through Docker; no
daemon means the happy path does not start.</li>
<li><strong>Wrong directory</strong> — <code>aspire restore</code>/<code>aspire start</code> run from
<code>aspire/</code>; <code>netscript db</code> runs from the workspace root.</li>
<li><strong>Ports in use</strong> — the dashboard wants <code>:18888</code>/<code>:18889</code> and
OTLP <code>:4318</code>; a stale prior run holding a port blocks boot. Free it and retry.</li>
</ul>
{{ /comp }}

## What you built

You ran the complete VIF→CSB sync — workers, triggers, queue, and cron — on one machine under a
single `aspire start`, initialized the database through the running AppHost, and watched a VIF
export flow into a durable job execution with its trace in the dashboard. You now have an
end-to-end durable background-processing backend that could carry a real migration's parallel-run,
and you know exactly where the local story ends and a production deployment begins.

## Where to go next

You have finished the ERP Sync track. From here, branch into task-oriented and reference docs:

- **Ship it remotely** → [Deploy](/how-to/deploy/) — the production companion to this local run:
  deployable units, managed backing services, and the `--no-aspire` path.
- **Take the transform polyglot** → [Run a polyglot task](/how-to/run-a-polyglot-task/) — swap
  Chapter 3's Deno transform for a Python or shell step on your own host.
- **Tune throughput** → [Choose a queue provider](/how-to/choose-a-queue-provider/) and
  [Tune the worker runtime](/how-to/tune-worker-runtime/).
- **Understand the orchestrator** → [Orchestration with Aspire](/explanation/aspire/) and the full
  [How-to guides](/how-to/).

{{ comp.nextPrev({ prev: { label: "4 · Queue & cron", href: "/tutorials/erp-sync/04-queue-and-cron/" }, next: { label: "How-to guides", href: "/how-to/" } }) }}
