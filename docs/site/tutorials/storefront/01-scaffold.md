---
layout: layouts/base.vto
title: Scaffold the storefront
templateEngine: [vento, md]
prev: { label: "Storefront", href: "/tutorials/storefront/" }
next: { label: "2 · Catalog service", href: "/tutorials/storefront/02-catalog-service/" }
---

# Scaffold the storefront

In this chapter you create `my-shop/` with the `netscript` CLI, tour what it generated, and bring it
up under [Aspire](/explanation/aspire/): Postgres, the Redis cache and an example service running
together behind one dashboard.

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

A NetScript workspace named `my-shop/` with a shared `contracts/` workspace, a `products` service, a
Fresh app and a Postgres database. At the end it boots under one `aspire start`, the Aspire dashboard
is live at the URL Aspire prints, and Postgres and Redis report healthy.

## Before you begin

You need a working local toolchain:

- **[Deno](https://deno.com/) 2.x** on your `PATH`. Check with `deno --version`.
- The **[Aspire CLI](https://aspire.dev)**. Check with `aspire --version`. NetScript uses Aspire to
  provision your database and cache locally, so you never wire up Docker containers by hand.
- **Docker** running, so Aspire can start the Postgres and Redis containers. `docker info` prints
  engine details, not a connection error.

Install the NetScript CLI from JSR:

```sh
deno install -g -A -f -n netscript --minimum-dependency-age=0 jsr:@netscript/cli{{ releaseSpecifier }}
```

`--minimum-dependency-age=0` lets the pinned release install on its publication day, and `-f`
replaces an older global `netscript` executable. Confirm it resolves:

```sh
netscript --help
```

You see the public groups: `agent`, `config`, `contract`, `db`, `deploy`, `generate`, `init`,
`marketplace`, `plugin`, `service`, and the `ui:*` group (`ui:list`, `ui:add`, `ui:update`,
`ui:remove`). If `netscript` is not found, add Deno's install directory (printed by `deno install`)
to your `PATH` and open a new terminal.

## Step 1 — Preview the scaffold with a dry run

`--dry-run` plans the scaffold and prints the result without writing to disk:

```sh
netscript init my-shop --dry-run
```

`netscript init` validates your options, then runs an ordered pipeline: the project root, Aspire
orchestration, the shared contracts workspace, a Fresh app, an empty plugin registry, and, when you
ask for them, a database workspace and an example service. The dry run reports file and directory
totals per phase. A clean dry run means you can scaffold for real.

## Step 2 — Create the workspace

Scaffold `my-shop/` with an example service named `products` on port **3001** and a Postgres
database, which holds the catalog you build in the next chapter:

```sh
netscript init my-shop --service --service-name products --service-port 3001 --db postgres
cd my-shop
```

The CLI scaffolds `my-shop/`, formats the output with `deno fmt`, initializes a git repository, and
prints a **next steps** summary for your options. The steps below follow the same path.

{{ comp callout { type: "note", title: "Pinned ports in this track" } }}
This track pins the <code>products</code> service to port <code>3001</code> with
<code>--service-port</code>. Without a pinned port, each scaffold gets its own randomized high-range
ports.
{{ /comp }}

This track uses Postgres. You can swap `--db postgres` for `mysql`, `mssql` or `sqlite` and the
scaffold wires Prisma for that engine instead; SQLite is file-backed, with no Aspire container. Keep
`--db postgres` to follow along. Run `netscript init --help` for every option; these are the common
ones:

{{ comp.apiTable({ caption: "Common netscript init options", rows: [
  { name: "--service --service-name <name> --service-port <port>", type: "flag group", desc: "Include an example oRPC service on the given port. We use products on 3001." },
  { name: "--db <engine>", type: "flag", desc: "Scaffold a Prisma-backed database workspace. First-class engines: postgres (default for this track), mysql, mssql, sqlite. Omit or use --db none to skip database tooling." },
  { name: "--no-aspire", type: "flag", desc: "Skip the Aspire orchestration files — you would then wire infrastructure yourself. Do NOT pass this for the track; we rely on aspire start." },
  { name: "--editor <none|zed|vscode>", type: "flag", desc: "Generate editor settings for the chosen editor." },
  { name: "--dry-run", type: "flag", desc: "Plan the scaffold and print totals without writing any files." }
] }) }}

## Step 3 — Tour what you got

`my-shop/` has this shape:

{{ comp.fileTree({ items: [
  { name: "my-shop/", children: [
    { name: "apps/dashboard/", comment: "Fresh frontend (defineFreshApp)" },
    { name: "contracts/", comment: "Shared oRPC contracts, versioned under versions/v1/" },
    { name: "services/products/", comment: "The example oRPC service (src/main.ts, router.ts, routers/)" },
    { name: "plugins/", comment: "Plugin registry + manifests — empty until chapter 4" },
    { name: "database/", comment: "Postgres workspace (Prisma schema + migrations) — initialize before editing" },
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

- **`contracts/`** — the typed seam between your services and any client: oRPC + Zod contracts,
  versioned under `versions/v1/`. Everything else takes its types from here. You add the cart
  contract in [chapter 3](/tutorials/storefront/03-cart-contracts/). See
  [Contracts & type flow](/explanation/contracts/).
- **`services/products/`** — a working oRPC service. `src/main.ts` calls `defineService(...)` and
  handlers live under `src/routers/`. You read it as a typed catalog in
  [chapter 2](/tutorials/storefront/02-catalog-service/).
- **`apps/dashboard/`** — a Fresh app wired to consume contracts, powered by the
  [`@netscript/fresh`](/web-layer/fresh-ui/) meta-framework. You add the storefront page in
  [chapter 6](/tutorials/storefront/06-storefront-ui/).
- **`plugins/`** — where background capabilities (workers, sagas, triggers, streams) register. Empty
  until [chapter 4](/tutorials/storefront/04-checkout-saga/).
- **`database/`** — the Postgres database workspace: the Prisma schema and migrations behind
  `context.db` in your handlers. You initialize it in Step 4.
- **`tests/`** — the workspace-level test suite. Extend it as you add handlers and contracts.
- **`aspire/`** — the orchestrator. `aspire start` reads `apphost.mts` and starts every resource your
  app declares: Postgres, the Redis cache and your services.
- **`appsettings.json`** — the infrastructure manifest Aspire reads: which services, databases and
  persistent resources to provision.
- **`netscript.config.ts`** — declares paths, plugins, logging and database wiring with
  `defineConfig`. See the [config reference](/reference/config/).

{{ comp callout { type: "note", title: "Where is packages/?" } }}
If you scaffolded from a checkout of the NetScript repo, you may see a vendored
<code>packages/</code> directory. A normal JSR install doesn't have one: your project pulls
<code>@netscript/*</code> from the registry. Ignore <code>packages/</code> in this track.
{{ /comp }}

## Step 4 — Bring up orchestration

Aspire provisions your database and cache; you don't start containers by hand, and you start Aspire
before any `netscript db` command. Run it from the `aspire/` folder so the CLI finds `apphost.mts`:

```sh
cd aspire
aspire restore   # once per machine: restores the Aspire SDK modules into .aspire/
deno task aspire:start   # starts the AppHost and every declared resource
```

`deno task aspire:start` is the wrapper the CLI's printed next steps recommend: it sets a 300-second
cold-start budget while container images download on the first run. It brings up Postgres, the Redis
cache and your `products` service, then prints a URL and a one-time login token for the **Aspire
dashboard**.

In an interactive terminal, leave it running: it is your storefront's control plane for the rest of
the track. Aspire assigns free ports at runtime, so take the dashboard and app URLs from the
dashboard (or MCP `list_api_services`) instead of memorizing them.

{{ comp callout { type: "note", title: "Non-interactive terminals" } }}
In a non-interactive terminal, the command detaches without printing a login token. Resolve resource
endpoints with
<code>aspire describe --apphost ./apphost.mts --format Json --non-interactive --nologo</code>, or MCP
<code>list_api_services</code>, instead of the dashboard.
{{ /comp }}

### Initialize the database before customising

The Postgres container exists only while `aspire start` is running. Open a second terminal at the
`my-shop/` project root and run:

```sh
netscript db init --name init
netscript db generate
netscript db seed
```

`db init` creates and applies the initial migration, `db generate` produces the Prisma client and
the `@database/zod` schemas, and `db seed` runs the generated seed script. The CLI runs each command
as a database-operation resource inside the running graph, so it uses the existing Postgres
connection and never provisions a second container over the same data directory. A successful run
proves the resource graph, connection string, Prisma schema and migration path agree before chapter 2
adds catalog behavior.

## Verify your progress

In the second terminal, with `aspire start` still running in the first, check that the example
`products` service answers on port **3001**:

```sh
curl http://localhost:3001/health
```

You get a healthy JSON response. Services answer over plaintext HTTP/1.1; HTTP/2 is opt-in and needs
TLS. Then type-check the workspace from the project root:

```sh
deno task check
```

A clean check and a healthy `curl` mean the scaffold is sound. Don't start customizing until every
box below is ticked: on an unverified base, every later failure looks like a bug in your code.

- [ ] `netscript --help` lists the public command groups (`agent`, `config`, `contract`, `db`, `deploy`, `generate`, `init`, `marketplace`, `plugin`, `service`, `ui:*`).
- [ ] `my-shop/` exists with `contracts/`, `services/products/`, `database/`, `plugins/`, `aspire/`, and `tests/`.
- [ ] `aspire start` is up; its printed dashboard URL (or MCP `list_api_services`) shows `products`, `postgres`, and `redis`
      healthy.
- [ ] `netscript db init --name init` succeeded and the initial migration exists.
- [ ] `curl http://localhost:3001/health` returns healthy JSON.
- [ ] Opening the Fresh app URL from the dashboard (or MCP status) with `/design` appended renders the generated
      design reference (it returns an HTTP 302 redirect to `/design/composition`, so scripted checks require `curl -L`).
- [ ] `deno task check` passes with no errors.

{{ comp callout { type: "tip", title: "If something is not green" } }}
Check three things: (1) is <code>aspire start</code> still up, with <code>postgres</code> and
<code>redis</code> healthy in the <a href="/explanation/aspire/">dashboard</a>? (2) is Docker running
(<code>docker info</code>)? (3) did you <code>cd aspire</code> before <code>aspire start</code>, so it
found <code>apphost.mts</code>? Under heavy system load, <code>aspire restore</code> or
<code>start</code> can time out with <code>Failed to prepare: A task was canceled</code>; re-running
the start command usually succeeds. Without a browser, inspect failures with the MCP
<code>get_recent_errors</code> or <code>list_api_services</code> tools.
{{ /comp }}

## What you built

A NetScript workspace, `my-shop/`: a shared `contracts/` workspace, a `products` service, a Fresh
app, and a Postgres database plus Redis cache, all orchestrated by Aspire and visible in one
dashboard. Next, you read the `products` service as a typed catalog and give it a typed 404.

{{ comp.nextPrev({ prev: { label: "Storefront", href: "/tutorials/storefront/" }, next: { label: "2 · Catalog service", href: "/tutorials/storefront/02-catalog-service/" } }) }}
