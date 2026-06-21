---
layout: layouts/base.vto
title: Your first workspace
templateEngine: [vento, md]
prev: { label: "Tutorials", href: "/tutorials/" }
next: { label: "2 · Build a service", href: "/tutorials/build-a-service/" }
---

# Tutorial 1 · Your first workspace

This is the first rung of the NetScript learning ladder. By the end you will have a real
workspace on disk, understand what every generated directory is for, and watch the whole thing
boot under one orchestrator — the [Aspire](/explanation/aspire/) dashboard showing your service,
database, and cache running together.

It is a guided happy path, not an option catalog. When you want the exact spelling of a flag, the
[`netscript` CLI reference](/reference/cli/) is the source of truth.

{{ comp.learningPath({ steps: [
  { label: "Quickstart", href: "/quickstart/" },
  { label: "1 · First workspace", href: "/tutorials/first-workspace/" },
  { label: "2 · Build a service", href: "/tutorials/build-a-service/" },
  { label: "3 · Background jobs", href: "/tutorials/background-jobs/" },
  { label: "4 · Durable workflow", href: "/tutorials/durable-workflow/" },
  { label: "5 · Ingest a webhook", href: "/tutorials/ingest-webhook/" }
] }) }}

## What you will accomplish

| # | Step | Outcome |
| - | ---- | ------- |
| 0 | Before you begin | Deno, the Aspire CLI, Docker, and the `netscript` CLI all on your `PATH`. |
| 1 | Preview the scaffold | A `--dry-run` plan of every file and directory, written to nothing. |
| 2 | Create the workspace | `my-app/` on disk: contracts, a `users` service, a Fresh app, Aspire, Postgres. |
| 3 | Tour what you got | A mental map of each generated directory and why it exists. |
| 4 | Bring up orchestration | `aspire run` provisions Postgres + Garnet + your service; dashboard on `:18888`. |
| 5 | Confirm it is running | A healthy `users` service answering on `:3001`, a clean `deno task check`. |

You will reuse this same `my-app` workspace for every later tutorial, so take your time here.

## Before you begin

You will need:

- **[Deno](https://deno.com/) 2.x** on your `PATH` — check with `deno --version`.
- The **[Aspire CLI](https://aspire.dev)** — check with `aspire --version`. NetScript uses Aspire
  to provision your database and cache locally, so you do not wire up Docker by hand.
- **Docker** running, so Aspire can start the Postgres and Garnet containers. Confirm with
  `docker info` (it should print engine details, not a connection error).

Install the NetScript CLI from JSR once:

```sh
deno install --global --allow-all --name netscript jsr:@netscript/cli/bin/netscript.ts
```

Confirm it and inspect the command groups:

```sh
netscript --help
```

You should see the public groups: `init`, `contract`, `db`, `deploy`, `generate`, `plugin`, and
`service`. If `netscript` is not found, make sure Deno's install directory (printed by
`deno install`) is on your `PATH`, then open a fresh terminal.

{{ comp callout { type: "tip", title: "Prefer not to install globally?" } }}
Run any command ad-hoc with <code>deno run -A jsr:@netscript/cli/bin/netscript.ts &lt;command&gt;</code>. The rest of this tutorial assumes the installed <code>netscript</code> form.
{{ /comp }}

## Step 1 — Preview the scaffold with a dry run

Before writing any files, ask the CLI what it _would_ create. `--dry-run` plans the scaffold and
prints the result without touching disk:

```sh
netscript init my-app --dry-run
```

`netscript init` validates your options, then runs an ordered pipeline that lays down the project
root, Aspire orchestration, contracts, the Fresh app workspace, an empty plugin registry, and
(optionally) a database workspace and an example service. The dry run reports the file and directory
totals per phase, so you can see the project's shape before committing to it.

{{ comp callout { type: "note", title: "Why dry-run first?" } }}
A dry run is the cheapest way to confirm your flag combination is valid — the CLI rejects bad option mixes (for example, an unknown <code>--db</code> engine) here, before any files exist. Treat a clean dry run as a green light to scaffold for real.
{{ /comp }}

## Step 2 — Create the workspace

This tutorial uses an example service and a Postgres database so you have something real to run:

```sh
netscript init my-app --service --service-name users --service-port 3001 --db postgres
cd my-app
```

This scaffolds `my-app/`, formats the output with `deno fmt`, and initializes a git repository. On
completion the CLI prints a **next steps** summary tailored to your options — keep it handy; the
steps below mirror the common path.

A few options you will reach for early (run `netscript init --help` for the full list):

{{ comp.apiTable({
  title: "Common netscript init options",
  columns: ["Option", "What it does"],
  rows: [
    ["--service --service-name <name> --service-port <port>", "Include an example oRPC service on the given port."],
    ["--db <engine>", "Scaffold a database workspace (postgres, mysql, …). Omit or use --db none to skip database tooling."],
    ["--no-aspire", "Skip the Aspire orchestration files (you would wire infrastructure yourself)."],
    ["--editor <none|zed|vscode>", "Generate editor settings for the chosen editor."],
    ["--dry-run", "Plan the scaffold and print totals without writing any files."]
  ]
}) }}

## Step 3 — Tour what you got

Open `my-app/` and you will find this shape:

```
my-app/
├── apps/dashboard/      # Fresh frontend (defineFreshApp)
├── contracts/           # Shared oRPC contracts, versioned under versions/v1/
├── services/users/      # The example oRPC service (src/main.ts, router.ts, routers/)
├── plugins/             # Plugin registry + manifests (one mod.ts per plugin)
├── aspire/              # Aspire TypeScript orchestration (isolated Node runtime)
│   ├── apphost.mts      # Entry point for `aspire run`
│   ├── .helpers/        # Generated register-*.mts helpers
│   ├── .aspire/         # Aspire SDK modules (output of `aspire restore`)
│   └── package.json     # tsx + vscode-jsonrpc, isolated from the Deno workspace
├── appsettings.json     # Infrastructure config (Services / Databases / Persistent)
├── deno.json            # Workspace root (members, tasks, dependency catalog)
└── netscript.config.ts  # Framework config (defineConfig)
```

What each piece is for:

- **`contracts/`** — the typed seam between your services and any client. Contracts are oRPC +
  Zod, versioned (`versions/v1/…`). Everything else derives its types from here. See
  [Contracts & type flow](/explanation/contracts/).
- **`services/users/`** — a working oRPC service. `src/main.ts` calls `defineService(...)`; handlers
  live under `src/routers/`. You will extend it in [Tutorial 2](/tutorials/build-a-service/).
- **`apps/dashboard/`** — a Fresh app for your UI, already wired to consume contracts. The
  [`@netscript/fresh`](/capabilities/fresh-meta-framework/) meta-framework powers it.
- **`plugins/`** — where background-processing capabilities (workers, sagas, triggers, streams)
  register. Empty until you add one in [Tutorial 3](/tutorials/background-jobs/).
- **`aspire/`** — the orchestrator. `aspire run` reads `apphost.mts` and starts every resource your
  app declares — Postgres, the Garnet cache, and your services — with one command.
- **`appsettings.json`** — the infrastructure manifest Aspire reads: which services, databases, and
  persistent resources to provision.
- **`netscript.config.ts`** — declares paths, plugins, logging, and database wiring via
  `defineConfig`. See the [config reference](/reference/config/).

{{ comp callout { type: "note", title: "Where is packages/?" } }}
If you scaffolded from a checkout of the NetScript repo you may see a vendored <code>packages/</code> directory. A normal JSR install does not have one — your project pulls <code>@netscript/*</code> from the registry. Ignore <code>packages/</code> in this tutorial.
{{ /comp }}

## Step 4 — Bring up orchestration

This is the step that turns a folder of files into a running system — and the one most people miss.
**Aspire provisions your database and cache; you do not start containers by hand, and you run it
before any `netscript db` command.** Run it from the `aspire/` subfolder so the CLI sees
`apphost.mts`:

```sh
cd aspire
aspire restore   # once: restores the Aspire SDK modules into .aspire/
aspire run       # starts the AppHost and every declared resource
```

`aspire run` brings up the Postgres database, the Garnet cache, and your `users` service together,
then prints a URL and login token for the **Aspire dashboard** — open it:

```
http://localhost:18888
```

The dashboard lists every resource (`postgres`, `garnet`, your service), live logs, and distributed
traces. Leave `aspire run` running in this terminal; it is your app's control plane for the rest of
the ladder.

{{ comp callout { type: "important", title: "Aspire is step 2 — database commands need it running" } }}
The Postgres container only exists while <code>aspire run</code> is up. So <code>netscript db init</code>, <code>db generate</code>, and <code>db seed</code> must be run <strong>after</strong> Aspire has started — never before. You will use them in <a href="/how-to/database-migration/">Database &amp; migration</a>.
{{ /comp }}

## Step 5 — Confirm it is running

The example `users` service exposes a plain health endpoint. In a second terminal (leave `aspire
run` going in the first):

```sh
curl http://localhost:3001/health
```

You should get a healthy JSON response. The same service also speaks oRPC at `/api/rpc/*` — that
typed surface is what [Tutorial 2](/tutorials/build-a-service/) builds on.

To type-check the whole workspace at any time, from the project root:

```sh
deno task check
```

A clean check confirms the scaffold, contracts, and service all line up.

{{ comp callout { type: "tip", title: "If something is not green" } }}
Three quick checks cover most first-run snags: (1) is <code>aspire run</code> still up in its terminal, with <code>postgres</code> and <code>garnet</code> healthy in the <a href="/explanation/aspire/">dashboard</a>? (2) is Docker running (<code>docker info</code>)? (3) did you <code>cd aspire</code> before <code>aspire run</code>, so it found <code>apphost.mts</code>? A failed <code>curl</code> usually means the service has not finished starting — give it a few seconds and retry.
{{ /comp }}

## What you built

A real NetScript workspace: a typed `users` service, shared contracts, a Fresh app, and a Postgres
database and Garnet cache — all orchestrated by Aspire and visible in one dashboard. You know what
each directory is for and how the system boots.

## Where to go next

- **Continue the ladder** → [Tutorial 2 · Build a service](/tutorials/build-a-service/) — add a
  real procedure to the `users` contract and call it from a typed client.
- **Understand the orchestrator** → [Orchestration with Aspire](/explanation/aspire/).
- **See the typed seam** → [Contracts & type flow](/explanation/contracts/).
- **Look something up** → the [CLI reference](/reference/cli/) and [config reference](/reference/config/).
