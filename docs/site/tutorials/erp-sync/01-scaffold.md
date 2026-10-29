---
layout: layouts/base.vto
title: Scaffold the ERP sync
templateEngine: [vento, md]
prev: { label: "ERP Sync", href: "/tutorials/erp-sync/" }
next: { label: "2 · Import job", href: "/tutorials/erp-sync/02-import-job/" }
---

# Scaffold the ERP sync

This chapter creates `my-erp/`, the workspace for the SAP-to-Dynamics sync. You add the
**workers** and **triggers** plugins and boot the stack under Aspire, so the rest of the track has
a running system to build on.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/erp-sync/01-scaffold/" },
  { label: "2 · Import job", href: "/tutorials/erp-sync/02-import-job/" },
  { label: "3 · Polyglot transform", href: "/tutorials/erp-sync/03-polyglot-transform/" },
  { label: "4 · Queue & cron", href: "/tutorials/erp-sync/04-queue-and-cron/" },
  { label: "5 · Deploy", href: "/tutorials/erp-sync/05-deploy/" }
] }) }}

## What you will build

`my-erp/` on disk: a NetScript workspace with a Postgres database, the **workers** plugin at
`plugins/workers/` (the background-job engine) and the **triggers** plugin at `plugins/triggers/`
(the ingress engine), all running under one `aspire start`, with the Aspire dashboard available at the URL Aspire prints.

## Before you begin

You need:

- **[Deno](https://deno.com/) 2.x** on your `PATH`. Check with `deno --version`.
- The **[Aspire CLI](https://aspire.dev)**. Check with `aspire --version`. Aspire provisions your
  database and cache locally, so you don't wire up Docker by hand.
- **Docker** running, so Aspire can start the Postgres and Redis containers. Check with
  `docker info`.

Install the NetScript CLI from JSR once, then confirm it:

```sh
deno install --global --allow-all --name netscript --minimum-dependency-age=0 jsr:@netscript/cli{{ releaseSpecifier }}
netscript --help
```

The public command groups are `agent`, `config`, `contract`, `db`, `deploy`, `generate`, `init`, `marketplace`, `plugin`, `service`, `tokens`, `ui:add`, `ui:init`, `ui:list`, `ui:remove` and `ui:update`. If `netscript` is not found, add Deno's install directory to your `PATH` and open a new terminal.

## Step 1 — Preview the scaffold with a dry run

`--dry-run` plans the scaffold and prints the file and directory totals per phase without writing
to disk:

```sh
netscript init my-erp --dry-run
```

The CLI rejects invalid option combinations here, such as an unknown `--db` engine, before any
files exist. A clean dry run means your flags are valid.

## Step 2 — Create the workspace

Durable execution needs a database, so scaffold with Postgres, the recommended default. You can
swap `postgres` for `mysql`, `mssql` or `sqlite` and the rest of the track works the same; this
track uses `postgres` throughout:

```sh
netscript init my-erp --db postgres
cd my-erp
```

The CLI scaffolds `my-erp/`, formats the output with `deno fmt`, initializes a git repository and
prints a **next steps** summary for your options.

{{ comp.apiTable({
  caption: "netscript init options used here (run netscript init --help for the full list)",
  columns: ["Option", "What it does"],
  rows: [
    ["--db postgres", "Scaffold a Postgres database workspace. Durable execution and queue persistence anchor on it."],
    ["--dry-run", "Plan the scaffold and print totals without writing any files."],
    ["--no-aspire", "Skip the Aspire orchestration files. Do NOT pass this — the rest of the track runs under Aspire."]
  ]
}) }}

{{ comp callout { type: "note", title: "Where is packages/?" } }}
If you scaffolded from a checkout of the NetScript repo, you may see a vendored <code>packages/</code> directory. A normal JSR install does not have one: your project pulls <code>@netscript/*</code> from the registry. Ignore <code>packages/</code> in this track.
{{ /comp }}

## Step 3 — Add the workers plugin

Add the **workers** plugin with its sample jobs, which give you a working reference to read and
adapt:

```sh
netscript plugin install worker --name workers --samples
```

The plugin lands at **`plugins/workers/`**, the config-referenced install location, and is
registered in `netscript.config.ts` (`./plugins/workers/mod.ts`) and `appsettings.json`. It ships
an API service and a separate background processor that drains the job queue.

## Step 4 — Add the triggers plugin

Add the **triggers** plugin. Triggers are how NetScript receives events, including the file-watch
trigger you build in [chapter 2](/tutorials/erp-sync/02-import-job/):

```sh
netscript plugin install trigger --name triggers --samples
```

The plugin lands at `plugins/triggers/` and is registered in `netscript.config.ts`
(`./plugins/triggers/mod.ts`) and `appsettings.json`. Confirm both plugins registered:

```sh
netscript plugin list
```

You should see `workers` and `triggers` in the registry.

{{ comp callout { type: "note", title: "Two trees, one canonical home" } }}
A scaffold may also create smaller top-level <code>workers/</code> and <code>triggers/</code> directories: workspace members that stage a subset of files for the background processors. The config-referenced plugins live at <strong><code>plugins/workers/</code></strong> and <strong><code>plugins/triggers/</code></strong>. That is what <code>netscript.config.ts</code> points at and where you author code.
{{ /comp }}

## Step 5 — Bring up orchestration

Aspire provisions your database and cache and starts every process. You don't start containers by
hand, and Aspire must be running before any `netscript db` command (chapter 5 runs them; see also
[Deploy locally with Aspire](/orchestration-runtime/how-to/deploy-local-aspire/)). Run it from the
`aspire/` subfolder so the CLI sees `apphost.mts`:

```sh
cd aspire
aspire restore   # once per machine: restores the Aspire SDK modules into .aspire/
aspire start       # starts the AppHost and every declared resource
```

`aspire start` brings up Postgres, the Redis cache, the workers API and processor, and the
triggers API and processor, then prints the allocated URL for the
**Aspire dashboard**:

```text
the URL Aspire prints
```

The dashboard's **Resources** tab is the authority for the port each resource bound. You installed
these plugins without `--port`, so their entries carry no `HostPort`, and Aspire allocates their
host ports at every start. Copy the `workers-api` and `triggers-api` endpoints from that tab now;
the rest of the track writes them as `<workers-endpoint>` and `<triggers-endpoint>`. Re-read them
after any restart.

Leave `aspire start` running in this terminal. It is your control plane for the rest of the track.

## Verify your progress

1. In a second terminal, confirm both plugin APIs are alive:

   ```sh
   curl <workers-endpoint>/health    # workers API
   curl <triggers-endpoint>/health   # triggers API
   ```

   Both should return a healthy JSON response.

2. Type-check the workspace from the project root:

   ```sh
   deno task check
   ```

   A clean check means the scaffold, both plugins and the database wiring line up.

- [ ] `my-erp/` exists with `plugins/workers/` and `plugins/triggers/` on disk.
- [ ] `netscript plugin list` shows both `workers` and `triggers`.
- [ ] `aspire start` is up; the dashboard at the URL Aspire prints lists `postgres`, `redis`, and both plugin APIs.
- [ ] `curl <workers-endpoint>/health` and `curl <triggers-endpoint>/health` both return healthy.
- [ ] `deno task check` is clean.

{{ comp callout { type: "tip", title: "If something is not green" } }}
Three checks cover most first-run problems: (1) is <code>aspire start</code> still up, with <code>postgres</code> and <code>redis</code> healthy in the <a href="/explanation/aspire/">dashboard</a>? (2) is Docker running (<code>docker info</code>)? (3) did you <code>cd aspire</code> before <code>aspire start</code>, so it found <code>apphost.mts</code>? A failed <code>curl</code> usually means a service is still starting; wait a few seconds and retry.
{{ /comp }}

## What you built

`my-erp/`, with the **workers** and **triggers** plugins installed and the stack (Postgres, Redis,
both plugin APIs and their background processors) running under one `aspire start`. Next, you give
it the SAP export to ingest.
