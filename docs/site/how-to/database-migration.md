---
layout: layouts/base.vto
title: Database & migration
templateEngine: [vento, md]
prev: { label: "Add a service", href: "/how-to/add-a-service/" }
next: { label: "Queue / KV / cron", href: "/how-to/queue-kv-cron/" }
---

# Database & migration

**Goal:** take a freshly scaffolded NetScript workspace and stand up its Postgres
database — bring up the AppHost, create the first migration, generate the typed Prisma
client, seed it, and confirm the schema is applied — using only the public
`netscript db` commands.

This is a task-oriented recipe. The single most important fact, and the one most people
trip over: **`netscript db` commands provision and talk to Postgres _through_ Aspire**.
Aspire is step 2, not an afterthought. You bring the database up first with
`cd aspire && aspire run`, _then_ the `db` commands have something to connect to. Skip
that ordering and `db init` fails with `aspire start failed` before it ever reaches
Prisma. Everything below assumes the default Aspire layout; the `--no-aspire` escape hatch
is called out where it differs.

{{ comp callout { type: "important", title: "Aspire must be running first" } }}
Every <code>netscript db</code> command needs a live Postgres instance. In the default
(Aspire) layout, Postgres is a container that <strong>Aspire</strong> provisions — so
<code>cd aspire &amp;&amp; aspire run</code> has to be up <strong>before</strong> you run
<code>netscript db init</code>. Running a <code>db</code> command against a stopped AppHost
fails with <code>aspire start failed: … Project file does not exist</code>. That is the
dependency, not a bug — see <a href="/explanation/aspire/">Orchestration with Aspire</a>
for why the AppHost owns the database container.
{{ /comp }}

## What you'll end up with

By the end of this recipe you will have a running Postgres container, a first migration
on disk and applied, a generated Prisma client (with matching zod schemas) under
`database/postgres/schema/.generated/`, seeded baseline rows, and a green
`netscript db status`. The whole loop is four commands, run once, against a database that
Aspire is keeping alive in a second terminal.

{{ comp.apiTable({ caption: "The migration workflow at a glance", rows: [
  { name: "aspire run", type: "from aspire/", desc: "Provisions the Postgres + Garnet containers. Must be up first and stay running." },
  { name: "netscript db init --name init", type: "from workspace root", desc: "Initializes tooling, creates the first migration from schema.prisma, applies it to Postgres." },
  { name: "netscript db generate", type: "from workspace root", desc: "Generates the Deno-runtime Prisma client + zod schemas into .generated. Re-run after every schema edit." },
  { name: "netscript db seed", type: "from workspace root", desc: "Runs database/postgres/scripts/seed.ts to populate baseline rows." },
  { name: "netscript db status", type: "from workspace root", desc: "Reports which migrations are applied and whether the database is in sync — the authoritative verification." }
] }) }}

## Before you start

{{ comp.apiTable({ caption: "Prerequisites", rows: [
  { name: "NetScript workspace", type: "netscript init …", desc: "A workspace scaffolded with a database. The default --db postgres lays down database/postgres/ with a Prisma schema, prisma.config.ts, and seed scripts." },
  { name: "netscript CLI", type: "on PATH", desc: "Install with deno install --global --allow-all --name netscript jsr:@netscript/cli/bin/netscript.ts — then netscript --help should print." },
  { name: "Aspire CLI", type: "aspire", desc: "Used to provision Postgres and Garnet as containers via Docker. Confirm with aspire --version. Docker/Podman must be running." },
  { name: "Deno", type: "2.x", desc: "deno --version. Prisma generation runs under the Deno runtime (the schema sets runtime=\"deno\")." }
] }) }}

If you scaffolded with `--no-aspire`, you are responsible for pointing the workspace at
your own Postgres via `POSTGRES_URI` / `DATABASE_URL` (see [Deploy](/how-to/deploy/));
there is no AppHost to start, so you skip Step 2, but the migration commands in Step 3
are otherwise identical and talk to whatever database those variables resolve to.

Run every command from your workspace root unless a step says otherwise. To target a
workspace other than the current directory, pass `--project-root <path>` — useful in CI or
when scripting against a checkout you are not `cd`-ed into.

## Step 1 — Confirm the database wiring

A scaffolded workspace already contains the database workspace at `database/postgres/`.
You do not author any of this by hand; the point of this step is to recognize the moving
parts so the later commands make sense:

```text
my-app/
├── appsettings.json              # NetScript.Databases.postgres — Engine/Mode/DatabaseName
├── netscript.config.ts           # databases.config is intentionally empty here
└── database/postgres/
    ├── schema/
    │   ├── schema.prisma          # root: generator client (runtime="deno"), generator zod, datasource db
    │   ├── plugins/               # per-plugin .prisma models aggregated here
    │   │   ├── workers/workers.prisma
    │   │   ├── sagas/sagas.prisma
    │   │   └── triggers/triggers.prisma
    │   └── .generated/            # created by `db generate`: Prisma client + zod
    ├── prisma.config.ts           # schema dir + migrations path + datasource url
    ├── migrations/                # created by `db init`: timestamped migration dirs
    └── scripts/                   # migrate.ts, seed.ts, generate-zod.ts, …
```

Two things worth internalizing before you run anything:

- **The datasource is Postgres, driven by `appsettings.json` — not by `netscript.config.ts`.**
  In the scaffold, `netscript.config.ts` has `databases: { config: [] }` (empty). The real
  connection details live in `appsettings.json` under `NetScript.Databases.postgres`
  (`Engine: "Postgres"`, `Mode: "Container"`, a generated `DatabaseName`, and a persistent
  `DataPath` of `.data/postgres`). Aspire reads that block to provision the container, and
  `prisma.config.ts` resolves its datasource URL from the same source. If you ever wonder
  "where does the connection string come from?", the answer is this block, not the config
  file.
- **Plugin schemas are split out and aggregated.** Each first-party plugin ships its own
  `database/<plugin>.prisma`; those are aggregated under
  `database/postgres/schema/plugins/<plugin>/`. So after adding the `workers`, `sagas`, and
  `triggers` plugins you'll see their tables (e.g. `model JobDefinition` from workers) join
  the root `ExampleRecord` model in the same Postgres datasource. One migration covers them
  all.

{{ comp callout { type: "note", title: "One datasource, many contributors" } }}
NetScript uses a single primary Postgres datasource. Plugins contribute Prisma models into
it rather than each owning a separate database, so one <code>db init</code> /
<code>db generate</code> cycle covers the app and its plugins together. Adding a plugin
later that ships its own <code>.prisma</code> means re-running
<code>netscript db migrate</code> and <code>netscript db generate</code> to fold its tables
in.
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
  (`workers-api`, `workers`, `sagas-api`, `sagas`, `triggers-api`, `triggers`). If you also
  scaffolded auth and streams, you'll see `auth-api` (:8094) and the streams service
  (:4437) join the graph.

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
  to the running Postgres container. The `--name` value names the migration directory; pick
  something descriptive for later migrations (`add-orders`, `index-email`), not just `init`.
- **`netscript db generate`** — runs database code generation: the Prisma client
  (`generator client` with `runtime="deno"`, output `./.generated`) plus the zod schemas
  (`generator zod` → `./.generated/zod`). Re-run this whenever the schema changes, because
  the generated types are how your application code stays in lockstep with the database.
- **`netscript db seed`** — executes the seed scripts under `database/postgres/scripts/`.
  Seeds are ordinary Deno scripts, so they can insert baseline rows, reference data, or a
  first admin record using the freshly generated client.
- **`netscript db status`** — reports migration/tooling status so you can confirm the
  schema is applied and in sync. This is the command you'll reach for most often once you
  start iterating.

{{ comp callout { type: "tip", title: "Iterating on the schema later" } }}
After the first <code>init</code>, evolve the schema by editing the
<code>.prisma</code> files and running <code>netscript db migrate</code> to create and apply
the next migration, then <code>netscript db generate</code> to refresh the client. The pair
is the rhythm of day-to-day schema work: <strong>migrate then generate, every time</strong>.
<code>netscript db reset</code> drops and re-applies everything (destructive — dev only),
and <code>netscript db studio</code> opens a visual browser over the data.
{{ /comp }}

## Step 4 — Verify

Confirm the database is migrated and seeded three ways, from most to least authoritative:

1. **CLI status.** `netscript db status` reports the `init` migration as applied and the
   schema in sync. This is the authoritative check — if it is green, the rest is corroboration.
2. **Generated client exists.** `database/postgres/schema/.generated/` now contains the
   Prisma client and the `zod` schemas — proof `db generate` succeeded and your typed models
   are importable from application code.
3. **Aspire dashboard.** The `postgres` resource at
   [http://localhost:18888](http://localhost:18888) is green and shows recent activity from
   the migration and seed runs. Use it to eyeball that the container is healthy.

If all three line up, your database is provisioned, migrated, and seeded — you can now
import the generated client in a service or worker and read the rows the seed wrote.

{{ comp callout { type: "warning", title: "Production pitfalls" } }}
<ul>
<li><strong>Forgetting Aspire.</strong> The most common failure: running <code>netscript db init</code> with no <code>aspire run</code> up. Start Aspire first.</li>
<li><strong>Wrong directory.</strong> Run <code>aspire run</code> from <code>aspire/</code>, but run the <code>netscript db</code> commands from the workspace root (or pass <code>--project-root</code>).</li>
<li><strong>Stale client after a schema change.</strong> Editing a <code>.prisma</code> file without re-running <code>netscript db generate</code> leaves your code typed against the old shape. Generate after every schema change.</li>
<li><strong>Docker not running.</strong> Aspire provisions Postgres and Garnet as containers; if Docker/Podman is down, the <code>postgres</code> resource never goes green.</li>
<li><strong>Treating <code>db reset</code> as routine.</strong> It is destructive — it drops the database. Keep it to local dev.</li>
</ul>
{{ /comp }}

## Where the data goes next

Once the schema is live, the generated client is what every other capability reads and
writes through. Queue jobs persist their `message_queue` rows (the
[PostgreSQL queue backend](/how-to/queue-kv-cron/) shares this same datasource), durable
sagas persist runtime state when configured with the Prisma store backend, and your
services query their models directly. The migration loop you just ran is the foundation the
rest of the workspace stands on.

## See also

{{ comp.card({ title: "Reference — database", body: "The full generated @netscript/database API: schema helpers, the Prisma adapter surface, and migration tooling.", href: "/reference/database/", icon: "≡" }) }}

{{ comp.card({ title: "Capability — Database & Prisma", body: "How NetScript wires Prisma 7 + Postgres, per-plugin schema aggregation, and the appsettings-driven datasource.", href: "/capabilities/database/", icon: "◎" }) }}

{{ comp.card({ title: "Orchestration with Aspire", body: "Why the AppHost (aspire/apphost.mts) provisions Postgres and Garnet, and how the resource graph fits together.", href: "/explanation/aspire/", icon: "◆" }) }}

{{ comp.card({ title: "Queue / KV / cron", body: "The next recipe: use the KV and queue backends — including the PostgreSQL queue provider that shares this datasource.", href: "/how-to/queue-kv-cron/", icon: "→" }) }}

{{ comp.card({ title: "Deploy without Aspire", body: "Point the workspace at your own Postgres via POSTGRES_URI / DATABASE_URL using the --no-aspire escape hatch.", href: "/how-to/deploy/", icon: "→" }) }}

For the MySQL adapter surface, see [`prisma-adapter-mysql`](/reference/prisma-adapter-mysql/).
