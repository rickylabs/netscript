---
layout: layouts/base.vto
title: Scaffold the storefront
templateEngine: [vento, md]
prev: { label: "Storefront", href: "/tutorials/storefront/" }
next: { label: "2 · Catalog service", href: "/tutorials/storefront/02-catalog-service/" }
---

# Scaffold the storefront

This is chapter 1 of the storefront track. Before you can sell anything you need a workspace on disk
and a running system to grow it in. In this chapter you create `my-shop/` with the `netscript` CLI,
tour what it generated, and bring the whole thing up under [Aspire](/explanation/aspire/) — Postgres,
the Redis cache, and an example service all running together behind one dashboard.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/storefront/01-scaffold/" },
  { label: "2 · Catalog service", href: "/tutorials/storefront/02-catalog-service/" },
  { label: "3 · Cart contracts", href: "/tutorials/storefront/03-cart-contracts/" },
  { label: "4 · Checkout saga", href: "/tutorials/storefront/04-checkout-saga/" },
  { label: "5 · Shipping webhook", href: "/tutorials/storefront/05-shipping-webhook/" },
  { label: "6 · Deploy", href: "/tutorials/storefront/06-deploy/" }
] }) }}

## What you will build

By the end of this chapter you will have a real NetScript workspace named `my-shop/` on disk — with a
shared `contracts/` workspace, a `products` service, a Fresh app, and a Postgres database — and you
will have watched it boot under a single `aspire start`, with the Aspire dashboard live on
`https://localhost:18888` and Postgres plus Redis reporting healthy.

## Before you begin

This is the first chapter, so the only prerequisites are a working local toolchain. You need:

- **[Deno](https://deno.com/) 2.x** on your `PATH` — check with `deno --version`.
- The **[Aspire CLI](https://aspire.dev)** — check with `aspire --version`. NetScript uses Aspire to
  provision your database and cache locally, so you never wire up Docker containers by hand.
- **Docker** running, so Aspire can start the Postgres and Redis containers. Confirm with
  `docker info` — it should print engine details, not a connection error.

Install the NetScript CLI from JSR once:

```sh
deno install --global --allow-all --name netscript jsr:@netscript/cli{{ releaseSpecifier }}
```

Confirm it resolves and inspect the command groups:

```sh
netscript --help
```

You should see the public groups: `init`, `contract`, `db`, `deploy`, `generate`, `marketplace`,
`plugin`, `service`, `ui:add`, and `ui:init`. If `netscript` is not found, make sure Deno's install
directory (printed by `deno install`) is on your `PATH`, then open a fresh terminal.

{{ comp callout { type: "tip", title: "Prefer not to install globally?" } }}
Run any command ad-hoc with <code>deno x jsr:@netscript/cli{{ releaseSpecifier }} &lt;command&gt;</code>. The rest of this track assumes the installed <code>netscript</code> form.
{{ /comp }}

## Step 1 — Preview the scaffold with a dry run

Before writing any files, ask the CLI what it _would_ create. `--dry-run` plans the scaffold and
prints the result without touching disk:

```sh
netscript init my-shop --dry-run
```

`netscript init` validates your options, then runs an ordered pipeline that lays down the project
root, Aspire orchestration, the shared contracts workspace, a Fresh app, an empty plugin registry,
and — when you ask for them — a database workspace and an example service. The dry run reports file
and directory totals per phase, so you can see the project's shape before committing to it. A clean
dry run is your green light to scaffold for real.

## Step 2 — Create the workspace

Scaffold `my-shop/` with an example service named `products` on port **3001** and a Postgres
database, so you have something real to run and a place for the catalog you build next chapter:

```sh
netscript init my-shop --service --service-name products --service-port 3001 --db postgres
cd my-shop
```

This scaffolds `my-shop/`, formats the output with `deno fmt`, and initializes a git repository. On
completion the CLI prints a **next steps** summary tailored to your options — keep it handy; the
steps below mirror the common path.

This track uses Postgres, but the database is polyglot: swap `--db postgres` for `mysql`, `mssql`, or
`sqlite` and the scaffold wires Prisma for that engine instead (sqlite is file-backed, with no Aspire
container). Keep `--db postgres` to follow along.

A few `init` options you will reach for (run `netscript init --help` for the full list):

{{ comp.apiTable({ caption: "Common netscript init options", rows: [
  { name: "--service --service-name <name> --service-port <port>", type: "flag group", desc: "Include an example oRPC service on the given port. We use products on 3001." },
  { name: "--db <engine>", type: "flag", desc: "Scaffold a Prisma-backed database workspace. First-class engines: postgres (default for this track), mysql, mssql, sqlite. Omit or use --db none to skip database tooling." },
  { name: "--no-aspire", type: "flag", desc: "Skip the Aspire orchestration files — you would then wire infrastructure yourself. Do NOT pass this for the track; we rely on aspire start." },
  { name: "--editor <none|zed|vscode>", type: "flag", desc: "Generate editor settings for the chosen editor." },
  { name: "--dry-run", type: "flag", desc: "Plan the scaffold and print totals without writing any files." }
] }) }}

## Step 3 — Tour what you got

Open `my-shop/` and you will find this shape:

{{ comp.fileTree({ items: [
  { name: "my-shop/", children: [
    { name: "apps/dashboard/", comment: "Fresh frontend (defineFreshApp)" },
    { name: "contracts/", comment: "Shared oRPC contracts, versioned under versions/v1/" },
    { name: "services/products/", comment: "The example oRPC service (src/main.ts, router.ts, routers/)" },
    { name: "plugins/", comment: "Plugin registry + manifests — empty until chapter 4" },
    { name: "database/", comment: "Postgres workspace (Prisma schema + migrations) — initialized in chapter 2" },
    { name: "tests/", comment: "Workspace-level test suite scaffolded alongside the project" },
    { name: "aspire/", children: [
      { name: "apphost.mts", comment: "Entry point for aspire start" },
      { name: "aspire.config.json", comment: "AppHost language + SDK pin" }
    ] },
    { name: "appsettings.json", comment: "Infrastructure config (Services / Databases / Persistent)" },
    { name: "deno.json", comment: "Workspace root (members, tasks, dependency catalog)" },
    { name: "netscript.config.ts", comment: "Framework config (defineConfig)" }
  ] }
] }) }}

What each piece is for:

- **`contracts/`** — the typed seam between your services and any client. Contracts are oRPC + Zod,
  versioned under `versions/v1/`. Everything else derives its types from here. You add the cart
  contract here in [chapter 3](/tutorials/storefront/03-cart-contracts/). See
  [Contracts & type flow](/explanation/contracts/).
- **`services/products/`** — a working oRPC service. `src/main.ts` calls `defineService(...)`;
  handlers live under `src/routers/`. You make it a real catalog in
  [chapter 2](/tutorials/storefront/02-catalog-service/).
- **`apps/dashboard/`** — a Fresh app for your storefront UI, already wired to consume contracts. The
  [`@netscript/fresh`](/web-layer/fresh-ui/) meta-framework powers it. This track stays on the
  backend, so you will not edit it.
- **`plugins/`** — where background capabilities (workers, sagas, triggers, streams) register. Empty
  until you add the sagas plugin in [chapter 4](/tutorials/storefront/04-checkout-saga/).
- **`database/`** — the Postgres-backed database workspace: the Prisma schema and migrations that back
  `context.db` in your handlers. You initialize it in
  [chapter 2](/tutorials/storefront/02-catalog-service/) with `netscript db init`.
- **`tests/`** — the workspace-level test suite scaffolded alongside the project. Extend it as you add
  handlers and contracts.
- **`aspire/`** — the orchestrator. `aspire start` reads `apphost.mts` and starts every resource your
  app declares — Postgres, the Redis cache, your services — with one command.
- **`appsettings.json`** — the infrastructure manifest Aspire reads: which services, databases, and
  persistent resources to provision.
- **`netscript.config.ts`** — declares paths, plugins, logging, and database wiring via
  `defineConfig`. See the [config reference](/reference/config/).

{{ comp callout { type: "note", title: "Where is packages/?" } }}
If you scaffolded from a checkout of the NetScript repo you may see a vendored <code>packages/</code> directory. A normal JSR install does not have one — your project pulls <code>@netscript/*</code> from the registry. Ignore <code>packages/</code> in this track.
{{ /comp }}

## Step 4 — Bring up orchestration

This is the step that turns a folder of files into a running system — and the one most people miss.
**Aspire provisions your database and cache; you do not start containers by hand, and you run it
before any `netscript db` command.** Run it from the `aspire/` subfolder so the CLI finds
`apphost.mts`:

```sh
cd aspire
aspire restore   # once per machine: restores the Aspire SDK modules into .aspire/
aspire start       # starts the AppHost and every declared resource
```

`aspire start` brings up the Postgres database, the Redis cache, and your `products` service
together, then prints a URL and a one-time login token for the **Aspire dashboard**:

```
https://localhost:18888
```

The dashboard lists every resource (`postgres`, `redis`, your service), live console logs, and
distributed traces. Leave `aspire start` running in this terminal — it is your storefront's control
plane for the rest of the track.

{{ comp callout { type: "important", title: "Aspire is step 2 — database commands need it running" } }}
The Postgres container only exists while <code>aspire start</code> is up. So <code>netscript db init</code>, <code>db generate</code>, and <code>db seed</code> must be run <strong>after</strong> Aspire has started — never before. You use them in <a href="/tutorials/storefront/02-catalog-service/">chapter 2</a>.
{{ /comp }}

## Verify your progress

The example `products` service exposes a plain health endpoint. In a second terminal — leave
`aspire start` going in the first — confirm the service answers on port **3001**:

```sh
curl http://localhost:3001/health
```

{{ comp callout { type: "note", title: "Endpoints are HTTP/1.1 — HTTP/2 is opt-in" } }}
You reach services over plaintext <strong>HTTP/1.1</strong> at <code>http://localhost:3001</code> — that is the default. HTTP/2 is opt-in and requires TLS: configure it with <code>ServiceTlsOptions</code> (or the <code>NETSCRIPT_TLS_CERT_FILE</code> / <code>NETSCRIPT_TLS_KEY_FILE</code> environment variables). See <a href="/explanation/aspire/">Aspire &amp; the AppHost</a> for the local-versus-deployed runtime model.
{{ /comp }}

You should get a healthy JSON response. Then type-check the whole workspace from the project root to
confirm the scaffold, contracts, and service all line up:

```sh
deno task check
```

A clean check, plus a healthy `curl`, means the scaffold is sound.

- [ ] `netscript --help` lists the public command groups.
- [ ] `my-shop/` exists with `contracts/`, `services/products/`, `database/`, and `aspire/`.
- [ ] `aspire start` is up; the dashboard at `https://localhost:18888` shows `postgres` and `redis`
      healthy.
- [ ] `curl http://localhost:3001/health` returns healthy JSON.
- [ ] `deno task check` passes with no errors.

{{ comp callout { type: "tip", title: "If something is not green" } }}
Three quick checks cover most first-run snags: (1) is <code>aspire start</code> still up in its terminal, with <code>postgres</code> and <code>redis</code> healthy in the <a href="/explanation/aspire/">dashboard</a>? (2) is Docker running (<code>docker info</code>)? (3) did you <code>cd aspire</code> before <code>aspire start</code>, so it found <code>apphost.mts</code>? A failed <code>curl</code> usually means the service has not finished starting — give it a few seconds and retry.
{{ /comp }}

## What you built

A real NetScript workspace, `my-shop/`: a shared `contracts/` workspace, a `products` service, a
Fresh app, and a Postgres database plus Redis cache — all orchestrated by Aspire and visible in one
dashboard. Next, you turn that placeholder `products` service into a real, typed catalog.

{{ comp.nextPrev({ prev: { label: "Storefront", href: "/tutorials/storefront/" }, next: { label: "2 · Catalog service", href: "/tutorials/storefront/02-catalog-service/" } }) }}
