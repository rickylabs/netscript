---
layout: layouts/base.vto
title: Database & migration
templateEngine: [vento, md]
prev: { label: "Add a service", href: "/how-to/add-a-service/" }
next: { label: "Queue / KV / cron", href: "/how-to/queue-kv-cron/" }
---

# Database & migration

**Goal:** take a freshly scaffolded NetScript workspace and stand up its Postgres
database — create the first migration, generate the typed Prisma client, seed it, and
confirm the schema is applied — using the public `netscript db` commands.

This is a task-oriented recipe. The single most important fact, and the one most people
trip over: **`netscript db` commands provision and talk to Postgres *through* Aspire**.
Aspire is step 2, not an afterthought. You bring the database up first with `aspire run`,
*then* the `db` commands have something to connect to. Skip that and `db init` fails with
`aspire start failed`.

{{ comp callout { type: "important", title: "Aspire must be running first" } }}
Every <code>netscript db</code> command needs a live Postgres instance. In the default
(Aspire) layout, Postgres is a container that <strong>Aspire</strong> provisions — so
<code>cd aspire &amp;&amp; aspire run</code> has to be up <strong>before</strong> you run
<code>netscript db init</code>. Running a <code>db</code> command against a stopped AppHost
fails with <code>aspire start failed: … Project file does not exist</code>. That is the
dependency, not a bug.
{{ /comp }}

## Before you start

{{ comp.apiTable({ caption: "Prerequisites", rows: [
  { name: "NetScript workspace", type: "netscript init …", desc: "A workspace scaffolded with a database. The default --db postgres lays down database/postgres/ with a Prisma schema, prisma.config.ts, and seed scripts." },
  { name: "netscript CLI", type: "on PATH", desc: "Install with deno install --global --allow-all --name netscript jsr:@netscript/cli/bin/netscript.ts — then netscript --help should print." },
  { name: "Aspire CLI", type: "aspire", desc: "Used to provision Postgres and Garnet as containers via Docker. Confirm with aspire --version. Docker/Podman must be running." },
  { name: "Deno", type: "2.x", desc: "deno --version. Prisma generation runs under the Deno runtime (the schema sets runtime=\"deno\")." }
] }) }}

If you scaffolded with `--no-aspire`, you are responsible for pointing the workspace at
your own Postgres via `POSTGRES_URI` / `DATABASE_URL` (see [Deploy](/how-to/deploy/));
the migration commands below are otherwise identical.

Run every command from your workspace root unless a step says otherwise. To target a
workspace other than the current directory, pass `--project-root <path>`.

## Step 1 — Confirm the database wiring

A scaffolded workspace already contains the database workspace at `database/postgres/`:

```text
my-app/
├── appsettings.json              # NetScript.Databases.postgres — Engine/Mode/DatabaseName
├── netscript.config.ts           # databases.config is intentionally empty here
└── database/postgres/
    ├── schema/
    │   ├── schema.prisma          # root: generator client (runtime="deno"), generator zod, datasource db
    │   └── plugins/               # per-plugin .prisma models aggregated here
    │       ├── workers/workers.prisma
    │       ├── sagas/sagas.prisma
    │       └── triggers/triggers.prisma
    ├── prisma.config.ts           # schema dir + migrations path + datasource url
    └── scripts/                   # migrate.ts, seed.ts, generate-zod.ts, …
```

Two things worth internalizing before you run anything:

- **The datasource is Postgres, driven by `appsettings.json` — not by `netscript.config.ts`.**
  In the scaffold, `netscript.config.ts` has `databases: { config: [] }` (empty). The real
  connection details live in `appsettings.json` under `NetScript.Databases.postgres`
  (`Engine: "Postgres"`, `Mode: "Container"`, a generated `DatabaseName`, and a persistent
  `DataPath` of `.data/postgres`). Aspire reads that block to provision the container.
- **Plugin schemas are split out and aggregated.** Each first-party plugin ships its own
  `database/<plugin>.prisma`; those are aggregated under
  `database/postgres/schema/plugins/<plugin>/`. So after adding the `workers`, `sagas`, and
  `triggers` plugins you'll see their tables (e.g. `model JobDefinition` from workers) join
  the root `ExampleRecord` model in the same Postgres datasource.

{{ comp callout { type: "note", title: "One datasource, many contributors" } }}
NetScript uses a single primary Postgres datasource. Plugins contribute Prisma models into
it rather than each owning a separate database, so one <code>db init</code> /
<code>db generate</code> cycle covers the app and its plugins together.
{{ /comp }}

## Step 2 — Bring up Postgres with Aspire (do this first)

From the workspace root, change into the isolated Aspire folder and start the AppHost.
The TypeScript AppHost (`aspire/apphost.mts`) lives in `aspire/` to keep its Node graph
separate from the Deno workspace, so the commands run from there:

```bash
cd aspire
aspire restore   # one-time: downloads the AppHost SDK modules
aspire run       # provisions Postgres + Garnet containers and starts the resource graph
```

Leave `aspire run` running in this terminal. It provisions both the Postgres database and
the Garnet cache (your KV/queue backend) as Docker containers — no manual `docker run` and
no local Postgres install required. When it settles you'll have:

- The **Aspire dashboard** at [http://localhost:18888](http://localhost:18888) — the access
  token is printed in the `aspire run` output. Open it and confirm the `postgres` and
  `garnet` resources are green.
- Resources named `postgres`, `garnet`, and the per-capability services/processors
  (`workers-api`, `workers`, `sagas-api`, `sagas`, `triggers-api`, `triggers`).

{{ comp callout { type: "warning", title: "If db commands fail with \"aspire start failed\"" } }}
That error means the AppHost is not running, or you ran the <code>db</code> command from a
directory where Aspire can't find <code>aspire/apphost.mts</code>. Fix: start
<code>aspire run</code> from the <code>aspire/</code> folder <strong>first</strong>, keep it
running, and run the <code>netscript db</code> commands from the <strong>workspace
root</strong> in a separate terminal.
{{ /comp }}

## Step 3 — Run the migration workflow

Open a **second terminal** at the workspace root (keep `aspire run` going in the first).
Now Postgres is reachable, run the four-command database workflow in order:

{{ comp.tabbedCode({ tabs: [
  {
    label: "1 · init",
    lang: "bash",
    code: "# Create the first migration from the current Prisma schema and apply it.\n# --name labels the migration directory (here: a migration called \"init\").\nnetscript db init --name init"
  },
  {
    label: "2 · generate",
    lang: "bash",
    code: "# Generate the Deno-runtime Prisma client (and the zod schemas) into\n# database/postgres/schema/.generated so your code can import typed models.\nnetscript db generate"
  },
  {
    label: "3 · seed",
    lang: "bash",
    code: "# Run the workspace seed scripts (database/postgres/scripts/seed.ts)\n# to populate baseline rows.\nnetscript db seed"
  },
  {
    label: "4 · status",
    lang: "bash",
    code: "# Show migration / tooling status: which migrations are applied and\n# whether the database is in sync with the schema.\nnetscript db status"
  }
] }) }}

What each step does, in plain terms:

- **`netscript db init --name init`** — initializes database tooling and creates the first
  migration from `database/postgres/schema/schema.prisma`, writing it to the migrations
  path declared in `prisma.config.ts` (`migrations: { path: 'migrations' }`) and applying it
  to the running Postgres container.
- **`netscript db generate`** — runs database code generation: the Prisma client
  (`generator client` with `runtime="deno"`, output `./.generated`) plus the zod schemas
  (`generator zod` → `./.generated/zod`). Re-run this whenever the schema changes.
- **`netscript db seed`** — executes the seed scripts under `database/postgres/scripts/`.
- **`netscript db status`** — reports migration/tooling status so you can confirm the
  schema is applied and in sync.

{{ comp callout { type: "tip", title: "Iterating on the schema later" } }}
After the first <code>init</code>, evolve the schema by editing the
<code>.prisma</code> files and running <code>netscript db migrate</code> to create and apply
the next migration, then <code>netscript db generate</code> to refresh the client.
<code>netscript db reset</code> drops and re-applies everything (destructive — dev only),
and <code>netscript db studio</code> opens a visual browser over the data.
{{ /comp }}

## Step 4 — Verify

Confirm the database is migrated and seeded three ways:

1. **CLI status.** `netscript db status` reports the `init` migration as applied and the
   schema in sync. This is the authoritative check.
2. **Aspire dashboard.** The `postgres` resource at
   [http://localhost:18888](http://localhost:18888) is green and shows recent activity from
   the migration and seed runs.
3. **Generated client exists.** `database/postgres/schema/.generated/` now contains the
   Prisma client and the `zod` schemas — proof `db generate` succeeded and your typed models
   are importable.

If all three line up, your database is provisioned, migrated, and seeded.

{{ comp callout { type: "warning", title: "Production pitfalls" } }}
<ul>
<li><strong>Forgetting Aspire.</strong> The most common failure: running <code>netscript db init</code> with no <code>aspire run</code> up. Start Aspire first.</li>
<li><strong>Wrong directory.</strong> Run <code>aspire run</code> from <code>aspire/</code>, but run the <code>netscript db</code> commands from the workspace root (or pass <code>--project-root</code>).</li>
<li><strong>Stale client after a schema change.</strong> Editing a <code>.prisma</code> file without re-running <code>netscript db generate</code> leaves your code typed against the old shape. Generate after every schema change.</li>
<li><strong>Docker not running.</strong> Aspire provisions Postgres and Garnet as containers; if Docker/Podman is down, the <code>postgres</code> resource never goes green.</li>
<li><strong>Treating <code>db reset</code> as routine.</strong> It is destructive — it drops the database. Keep it to local dev.</li>
</ul>
{{ /comp }}

## See also

{{ comp.card({ title: "Reference — database", body: "The full generated @netscript/database API: schema helpers, the Prisma adapter surface, and migration tooling.", href: "/reference/database/", icon: "≡" }) }}

{{ comp.card({ title: "Capability — Database & Prisma", body: "How NetScript wires Prisma 7 + Postgres, per-plugin schema aggregation, and the appsettings-driven datasource.", href: "/capabilities/database/", icon: "◎" }) }}

{{ comp.card({ title: "Orchestration with Aspire", body: "Why the AppHost (aspire/apphost.mts) provisions Postgres and Garnet, and how the resource graph fits together.", href: "/explanation/aspire/", icon: "◆" }) }}

{{ comp.card({ title: "Deploy without Aspire", body: "Point the workspace at your own Postgres via POSTGRES_URI / DATABASE_URL using the --no-aspire escape hatch.", href: "/how-to/deploy/", icon: "→" }) }}

For the MySQL adapter surface, see [`prisma-adapter-mysql`](/reference/prisma-adapter-mysql/).
