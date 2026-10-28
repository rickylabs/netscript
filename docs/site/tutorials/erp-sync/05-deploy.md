---
layout: layouts/base.vto
title: Run the ERP sync under Aspire
templateEngine: [vento, md]
prev: { label: "4 · Queue & cron", href: "/tutorials/erp-sync/04-queue-and-cron/" }
next: { label: "Build", href: "/how-to/" }
---

# Run the ERP sync under Aspire

This chapter runs the whole SAP→Dynamics sync (workers, triggers, queue and cron processors) on
one machine under `aspire start`, and shows you how to read the running system from the
dashboard. You wrote none of the orchestration wiring: `netscript init` scaffolded the AppHost in
chapter 1, each plugin you added contributed its own API and background processor to the graph,
and one `aspire start` boots them all with cross-references resolved.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/erp-sync/01-scaffold/" },
  { label: "2 · Import job", href: "/tutorials/erp-sync/02-import-job/" },
  { label: "3 · Polyglot transform", href: "/tutorials/erp-sync/03-polyglot-transform/" },
  { label: "4 · Queue & cron", href: "/tutorials/erp-sync/04-queue-and-cron/" },
  { label: "5 · Deploy", href: "/tutorials/erp-sync/05-deploy/" }
] }) }}

## What you will build

The full `my-erp/` resource graph, up with a single `aspire start`: Postgres, Redis, the workers
API and processor, and the triggers API and processor that runs your file-watch and cron triggers.
You initialize the database through the running AppHost and read the import pipeline in the
Aspire dashboard: resources, console logs, and the traces that connect a file drop to its job
execution.

{{ comp callout { type: "important", title: "Aspire is the LOCAL story — not a production deployer" } }}
<code>aspire start</code> turns <code>git clone</code> plus one command into a complete, observable, correctly wired stack on <strong>one machine</strong>. The Postgres and Redis it starts are throwaway Docker containers for development, <strong>not</strong> your production database or cache. Shipping to a remote target (managed infrastructure, your own process lifecycle) is the <a href="/orchestration-runtime/how-to/deploy/">Deploy</a> recipe. The full local walkthrough is <a href="/orchestration-runtime/how-to/deploy-local-aspire/">Deploy locally with Aspire</a>.
{{ /comp }}

## Before you begin

You need the complete `my-erp/` workspace from [chapter 4](/tutorials/erp-sync/04-queue-and-cron/):
the workers and triggers plugins, the `import-products` job, the `normalize-sap` transform task,
the `product-import-trigger` file watch and the `daily-resync-schedule` cron. Docker must be running
so Aspire can provision Postgres and Redis. Confirm the AppHost was scaffolded (it is a
TypeScript/Node program, not C#):

```sh
ls aspire/apphost.mts aspire/aspire.config.json
```

Both files should exist. `netscript init` generated them in chapter 1; you never write them by hand.

## Step 1 — Understand the graph you are about to run

The resource graph is **derived from your installed plugins** at boot through `composeAppHost`.
Add a plugin and its API and background processor appear; remove it and they disappear, with no
edit to `apphost.mts`. With workers and triggers installed, `aspire start` stands up this graph:

{{ comp.apiTable({
  caption: "What aspire start brings up for the ERP sync",
  rows: [
    { name: "aspire (dashboard)", type: "https://localhost:18888 / http://localhost:18889", desc: "Live resource list, console logs, structured logs and traces. A login token is printed on start." },
    { name: "OTLP collector", type: "http://localhost:4318", desc: "OpenTelemetry endpoint the dashboard runs; framework spans and structured logs land here automatically." },
    { name: "postgres", type: "Container", desc: "Throwaway Docker Postgres. The database netscript db commands target — reachable only while Aspire is up." },
    { name: "redis", type: "Container (cache)", desc: "Redis cache, the default `--cache-backend`; Redis-compatible. Backs the KV/queue workloads; auto-discovery resolves the queue to it once it is up." },
    { name: "workers API + processor", type: "allocated port + executable", desc: "The API enqueues; a separate background processor drains the queue and runs your import job." },
    { name: "triggers API + processor", type: "allocated port + executable", desc: "The API plus the processor that runs your file-watch and cron triggers." }
  ]
}) }}

As in [chapter 1](/tutorials/erp-sync/01-scaffold/), the plugin APIs have no fixed port: Aspire
allocates them at every start, and the dashboard's **Resources** tab shows the port each resource
bound. Pin a plugin with `--port` only when something outside the graph must keep its address,
such as an OAuth callback.

## Step 2 — Restore and run

The AppHost runs on its own isolated Node runtime inside `aspire/`, so its dependencies never leak
into your Deno workspace. If `aspire start` is not still running from earlier chapters, restore
once per machine and start it, both from inside `aspire/`:

```sh
cd aspire
aspire restore   # one-time SDK restore (and after an SDK bump)
aspire start       # boots the whole graph; prints the dashboard URL + a login token
```

`aspire start` brings up infrastructure first, then the plugin APIs and background processors,
with cross-references resolved into injected environment variables. Leave it running.

## Step 3 — Initialize the database through the running AppHost

With Aspire up, Postgres is live and the `netscript db` commands can reach the container Aspire
provisioned. Run them from the **workspace root** in a second terminal, leaving `aspire start`
running in the first:

```sh
netscript db init --name init   # create + apply the first migration
netscript db generate           # generate the Prisma client
netscript db seed               # optional: seed development data
```

{{ comp callout { type: "warning", title: "Order matters: scaffold → orchestrate → database" } }}
The most common first-run error is running a <code>netscript db</code> command before <code>aspire start</code>: without Aspire there is no Postgres to reach, and the command fails. <code>aspire restore</code> and <code>aspire start</code> run from inside <code>aspire/</code>; <code>netscript db</code> commands run from the <strong>workspace root</strong>, <strong>after</strong> the graph is up. There is no <code>netscript generate aspire</code>: <code>netscript init</code> produces the AppHost.
{{ /comp }}

## Step 4 — Watch the pipeline run end to end

1. Drop a file in the SAP export shape:

   ```sh
   cat > .data/incoming/products_live.csv <<'CSV'
   material_no,description,price_cents
   ANV-9,Anvil,4999
   CSV
   mv .data/incoming/products_live.csv .data/incoming/products/products_live.csv
   ```

2. Open `https://localhost:18888` and paste the login token `aspire start` printed.

3. Read the run in the three dashboard surfaces:

{{ comp.apiTable({
  caption: "Reading the running ERP sync in the Aspire dashboard",
  rows: [
    { name: "Resources", type: "tab", desc: "Every container and executable with status and the port it bound. Confirm workers, triggers, postgres, and redis are all green." },
    { name: "Console logs", type: "tab", desc: "stdout/stderr per resource. Open the workers processor to read your import job's log lines; the triggers processor shows the file-watch event." },
    { name: "Structured logs + Traces", type: "tab", desc: "Spans correlated by traceparent. The framework instruments job dispatch and execution automatically, so a file drop → job run trace appears with no extra wiring." }
  ]
}) }}

Aspire starts each resource with an OTLP endpoint pointed at `http://localhost:4318`, so
framework-level spans (job dispatch, job execution, scheduler runs) appear in the **Traces** view
without extra setup.

{{ comp callout { type: "note", title: "Which spans you see" } }}
The <strong>dispatch and execution trace appears automatically</strong>, because the framework instruments the run end to end. Handler calls through <code>createJobTools</code>, including <code>trace.withChildSpan</code>, add custom detail beneath that trace. <code>log.*</code> remains console-backed. <a href="/explanation/observability/">Observability</a> describes the complete path.
{{ /comp }}

## Verify your progress

Confirm the whole graph is healthy and the pipeline ran. `ns-workers` is the workers CLI shorthand
you installed in [chapter 2](/tutorials/erp-sync/02-import-job/).

```sh
# Both plugin APIs answer (endpoints from the Resources tab).
curl <workers-endpoint>/health
curl <triggers-endpoint>/health

# The dropped file produced an import execution.
ns-workers executions --limit=10 --json
```

Both health checks should return healthy JSON, and the executions feed should show a completed
`import-products` run for `products_live.csv`.

- [ ] `aspire start` is up; the dashboard lists `postgres`, `redis`, workers, and triggers all green.
- [ ] `netscript db init/generate` succeeded against the Aspire Postgres.
- [ ] `curl <workers-endpoint>/health` and `curl <triggers-endpoint>/health` both return healthy.
- [ ] A file drop produced an `import-products` execution and a dispatch/execution trace in the dashboard.

{{ comp callout { type: "tip", title: "If aspire start will not boot" } }}
<ul>
<li><strong>Docker is not running.</strong> Aspire provisions Postgres and Redis through Docker; without the daemon, nothing starts.</li>
<li><strong>Wrong directory.</strong> <code>aspire restore</code> and <code>aspire start</code> run from <code>aspire/</code>; <code>netscript db</code> runs from the workspace root.</li>
<li><strong>Ports in use.</strong> The dashboard needs <code>:18888</code> and <code>:18889</code>, and OTLP needs <code>:4318</code>. A stale earlier run holding a port blocks boot; free it and retry.</li>
</ul>
{{ /comp }}

## What you built

The complete SAP→Dynamics sync (workers, triggers, queue and cron) running on one machine under a
single `aspire start`, with the database initialized through the running AppHost and a SAP export
traced from file drop to durable job execution. You also know where the local setup ends and a
production deployment begins.

## Next steps

Ship the sync to a remote target with [Deploy](/orchestration-runtime/how-to/deploy/), the
production companion to this local run: deployable units, managed backing services and the
`--no-aspire` path. Related pages:

- [Run a polyglot task](/background-processing/how-to/run-a-polyglot-task/): swap chapter 3's Deno
  transform for a Python or shell step on your own host.
- [Choose a queue provider](/data-persistence/how-to/choose-a-queue-provider/) and
  [Tune the worker runtime](/background-processing/how-to/tune-worker-runtime/): tune throughput.
- [Orchestration with Aspire](/explanation/aspire/) and the recipes in [Build](/how-to/).
