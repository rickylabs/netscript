---
layout: layouts/base.vto
title: Scaffold the workspace
templateEngine: [vento, md]
prev: { label: "ERP Sync", href: "/tutorials/erp-sync/" }
next: { label: "2 · Import job", href: "/tutorials/erp-sync/02-import-job/" }
---

# Scaffold the workspace

This is the first chapter of the ERP Sync track. Before you can watch files or run background jobs,
you need a workspace with the right plugins installed and an orchestrator to run them. In this
chapter you create `my-erp/`, add the **workers** and **triggers** plugins, and boot the whole stack
under Aspire so the rest of the track has something real to build on.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/erp-sync/01-scaffold/" },
  { label: "2 · Import job", href: "/tutorials/erp-sync/02-import-job/" },
  { label: "3 · Polyglot transform", href: "/tutorials/erp-sync/03-polyglot-transform/" },
  { label: "4 · Queue & cron", href: "/tutorials/erp-sync/04-queue-and-cron/" },
  { label: "5 · Deploy", href: "/tutorials/erp-sync/05-deploy/" }
] }) }}

## What you will build

By the end of this chapter you will have `my-erp/` on disk — a NetScript workspace with a Postgres
database, the **workers** plugin at `plugins/workers/` (the background-job engine on `:8091`), and
the **triggers** plugin at `plugins/triggers/` (the ingress engine on `:8093`) — all running
together under one `aspire start`, with the Aspire dashboard live on `:18888`.

## Before you begin

You need the same local toolchain the [main tutorials](/tutorials/) use:

- **[Deno](https://deno.com/) 2.x** on your `PATH` — check with `deno --version`.
- The **[Aspire CLI](https://aspire.dev)** — check with `aspire --version`. Aspire provisions your
  database and cache locally so you do not wire up Docker by hand.
- **Docker** running, so Aspire can start the Postgres and Garnet containers — confirm with
  `docker info`.

Install the NetScript CLI from JSR once, then confirm it:

```sh
deno install --global --allow-all --name netscript jsr:@netscript/cli
netscript --help
```

You should see the public command groups, including `init`, `plugin`, `generate`, `db`, and
`deploy`. If `netscript` is not found, make sure Deno's install directory is on your `PATH` and open
a fresh terminal.

{{ comp callout { type: "tip", title: "Prefer not to install globally?" } }}
Run any command ad-hoc with
<code>deno x jsr:@netscript/cli &lt;command&gt;</code>. The rest of this track
assumes the installed <code>netscript</code> form.
{{ /comp }}

## Step 1 — Preview the scaffold with a dry run

Before writing files, ask the CLI what it _would_ create. `--dry-run` plans the scaffold and prints
the file and directory totals per phase without touching disk:

```sh
netscript init my-erp --dry-run
```

A clean dry run means your flag combination is valid — the CLI rejects bad option mixes (an unknown
`--db` engine, for instance) here, before any files exist. Treat it as a green light to scaffold for
real.

## Step 2 — Create the workspace

This track needs a database to anchor durable execution, so scaffold with Postgres:

```sh
netscript init my-erp --db postgres
cd my-erp
```

This scaffolds `my-erp/`, formats the output with `deno fmt`, and initializes a git repository. On
completion the CLI prints a **next steps** summary tailored to your options.

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
If you scaffolded from a checkout of the NetScript repo you may see a vendored
<code>packages/</code> directory. A normal JSR install does not have one — your project pulls
<code>@netscript/*</code> from the registry. Ignore <code>packages/</code> in this track.
{{ /comp }}

## Step 3 — Add the workers plugin

NetScript's background capabilities arrive as plugins. Add the **workers** plugin with its sample
jobs so you have a working reference to read and adapt:

```sh
deno run -A packages/cli/bin/netscript-dev.ts plugin add worker --name workers --samples
```

This lands the plugin at **`plugins/workers/`** — the canonical, config-referenced install location
— and registers it in `netscript.config.ts` (`./plugins/workers/mod.ts`) and `appsettings.json`. The
workers plugin ships an API service on `:8091` and a separate background processor that drains the
job queue.

## Step 4 — Add the triggers plugin

Now add the **triggers** plugin, which is how NetScript receives events — including the file-watch
trigger you build in [Chapter 2](/tutorials/erp-sync/02-import-job/):

```sh
deno run -A packages/cli/bin/netscript-dev.ts plugin add trigger --name triggers --samples
```

This lands a workspace at `plugins/triggers/` and registers it in `netscript.config.ts`
(`./plugins/triggers/mod.ts`) and `appsettings.json`. The triggers API runs on `:8093`. Confirm both
plugins registered:

```sh
netscript plugin list
```

You should see `workers` and `triggers` in the registry.

{{ comp callout { type: "note", title: "Two trees, one canonical home" } }}
A scaffold may also create slimmer top-level <code>workers/</code> and <code>triggers/</code>
directories — workspace members that stage a subset of files for the background processors. The
real, config-referenced plugins live at <strong><code>plugins/workers/</code></strong> and
<strong><code>plugins/triggers/</code></strong>: that is what <code>netscript.config.ts</code>
points at and where you author code. Edit under <code>plugins/</code>.
{{ /comp }}

## Step 5 — Bring up orchestration

This is the step that turns a folder of files into a running system. **Aspire provisions your
database and cache and starts every process; you do not start containers by hand, and you run it
before any `netscript db` command.** Run it from the `aspire/` subfolder so the CLI sees
`apphost.mts`:

```sh
cd aspire
aspire restore   # once per machine: restores the Aspire SDK modules into .aspire/
aspire start       # starts the AppHost and every declared resource
```

`aspire start` brings up Postgres, the Garnet cache, the workers API + processor, and the triggers API
+ processor together, then prints a URL and a one-time login token for the **Aspire dashboard**:

```
http://localhost:18888
```

The dashboard's **Resources** tab is the authority for which port each resource bound — the
conventional assignments (workers `:8091`, triggers `:8093`) are what this two-plugin workspace lands
on, allocated from the `:8091–8099` plugin range. Leave `aspire start` going in this terminal; it is
your control plane for the rest of the track.

{{ comp callout { type: "important", title: "Aspire is step 2 — database commands need it running" } }}
The Postgres container only exists while <code>aspire start</code> is up. So
<code>netscript db init</code>, <code>db generate</code>, and <code>db seed</code> must run
<strong>after</strong> Aspire has started — never before. There is more on the database sequence in
<a href="/how-to/deploy-local-aspire/">Deploy locally with Aspire</a>.
{{ /comp }}

## Verify your progress

In a second terminal (leave `aspire start` going in the first), confirm both plugin APIs are alive:

```sh
curl http://localhost:8091/health   # workers API
curl http://localhost:8093/health   # triggers API
```

Both should return a healthy JSON response. Then type-check the whole workspace from the project
root:

```sh
deno task check
```

Expected: a clean check with no errors — the scaffold, both plugins, and the database wiring all
line up.

- [ ] `my-erp/` exists with `plugins/workers/` and `plugins/triggers/` on disk.
- [ ] `netscript plugin list` shows both `workers` and `triggers`.
- [ ] `aspire start` is up; the dashboard on `:18888` lists `postgres`, `garnet`, and both plugin APIs.
- [ ] `curl :8091/health` and `curl :8093/health` both return healthy.
- [ ] `deno task check` is clean.

{{ comp callout { type: "tip", title: "If something is not green" } }}
Three checks cover most first-run snags: (1) is <code>aspire start</code> still up, with
<code>postgres</code> and <code>garnet</code> healthy in the
<a href="/explanation/aspire/">dashboard</a>? (2) is Docker running (<code>docker info</code>)?
(3) did you <code>cd aspire</code> before <code>aspire start</code>, so it found
<code>apphost.mts</code>? A failed <code>curl</code> usually means a service is still starting —
give it a few seconds and retry.
{{ /comp }}

## What you built

A real NetScript workspace, `my-erp/`, with the **workers** and **triggers** plugins installed and
the whole stack — Postgres, Garnet, both plugin APIs and their background processors — running under
one `aspire start` and visible in the dashboard. Next, you give it something to do.

{{ comp.nextPrev({ prev: { label: "ERP Sync", href: "/tutorials/erp-sync/" }, next: { label: "2 · Import job", href: "/tutorials/erp-sync/02-import-job/" } }) }}
