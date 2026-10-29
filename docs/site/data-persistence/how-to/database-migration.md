---
layout: layouts/base.vto
title: Migrate the database
description: Initialize, generate, seed, and inspect the database schema with the netscript db commands.
templateEngine: [vento, md]
order: 101
oldUrl: /how-to/database-migration/
---

# Migrate the database

This recipe takes a freshly scaffolded workspace to a migrated, seeded database. You start the
AppHost, create and apply the first migration, generate the typed Prisma client, seed it and confirm
the schema, using only the public `netscript db` commands.

The recipe uses **Postgres**, the recommended engine and the one every tutorial builds on. NetScript
scaffolds a Prisma-backed database for four engines, chosen with
`netscript init my-app --db postgres|mysql|mssql|sqlite`. Postgres, MySQL and MSSQL run as Aspire
container resources; SQLite is file-backed and needs no container. The migration loop is the same on
every engine; only provisioning differs.

> [!IMPORTANT]
> `netscript db` commands reach the database through Aspire, so `cd aspire && aspire start` must be
> running before `netscript db init`. Against a stopped AppHost a `db` command fails fast. With the
> AppHost running, the CLI starts an explicit operation resource in the resident graph and injects
> the existing database connection; it never starts a second Postgres or remounts its data
> directory. [Orchestration with Aspire](/explanation/aspire/) explains why the AppHost owns the
> database container.

## Prerequisites

{{ comp.apiTable({
  caption: "Prerequisites",
  rows: [
    { name: "NetScript workspace", type: "netscript init …", desc: "A workspace scaffolded with a database. This recipe uses --db postgres (the recommended default), which lays down database/postgres/ with a Prisma schema, prisma.config.ts, and seed scripts. Swap --db postgres for mysql, mssql, or sqlite for a different engine — the workflow is the same, only the database/<engine>/ directory differs." },
    { name: "netscript CLI", type: "on PATH", desc: "Install with deno install --global --allow-all --name netscript jsr:@netscript/cli" + releaseSpecifier + " — then netscript --help should print." },
    { name: "Aspire CLI", type: "aspire", desc: "Used to provision Postgres and Redis as containers via Docker. Confirm with aspire --version. Docker/Podman must be running." },
    { name: "Deno", type: "2.x", desc: "deno --version. Prisma generation runs under the Deno runtime (the schema sets runtime=\"deno\")." },
  ],
}) }}

Run every command from the workspace root unless a step says otherwise. To target another
workspace, for example in CI, pass `--project-root <path>`.

> [!NOTE]
> With a `--no-aspire` scaffold there is no AppHost to start: skip Step 2 and point the workspace at
> your own Postgres with `POSTGRES_URI` / `DATABASE_URL` (see
> [Deploy](/orchestration-runtime/how-to/deploy/)). Each `netscript db <command>` then runs the
> matching task in the database workspace directly
> (`deno task --cwd database/postgres db:<command>:postgres`) with your environment, and the
> generated `appsettings.json` registers the database with `Mode: "External"`.

## Step 1 — Confirm the database wiring

A scaffolded workspace already contains the database workspace at `database/postgres/`. You don't
write any of it by hand; this step shows the parts the later commands use:

```tree
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

The connection details come from `appsettings.json` under `NetScript.Databases.postgres`, not from
`netscript.config.ts`: Aspire provisions the container from that block and `prisma.config.ts`
resolves its datasource URL from the same source. Plugin schemas are aggregated into the same
datasource, so one migration covers the app and its plugins.
[How persistence is wired](/data-persistence/database/#how-persistence-is-wired) explains both.

## Step 2 — Start Postgres with Aspire

From the workspace root, change into `aspire/` and start the AppHost. The TypeScript AppHost
(`aspire/apphost.mts`) lives there to keep its Node graph separate from the Deno workspace:

```bash
cd aspire
aspire restore   # one-time: downloads the AppHost SDK modules
aspire start       # provisions Postgres + Redis containers and starts the resource graph
```

Leave `aspire start` running in this terminal. It provisions Postgres and the Redis cache (your KV
and queue backend) as Docker containers; you need no `docker run` and no local Postgres install.
When it settles:

- The **Aspire dashboard** is at the URL Aspire prints, using the allocated URL from `aspire start`. The generated local profile allows anonymous access. Confirm the `postgres` and `redis` resources are green.
- The graph also lists the per-capability services and processors (`workers-api`, `workers`,
  `sagas-api`, `sagas`, `triggers-api`, `triggers`). If you scaffolded auth and streams, `auth-api`
  and the streams service join the graph on their assigned ports.

## Step 3 — Run the migration workflow

Open a second terminal at the workspace root and keep `aspire start` running in the first. These
commands address the running Postgres through an explicit resident AppHost resource; they don't
create a parallel AppHost or database container. Run them in order:

1. Create the first migration from `database/postgres/schema/schema.prisma` and apply it. The
   migration lands under the path `prisma.config.ts` declares (`migrations: { path: 'migrations' }`).
   `--name` names the migration directory; give later migrations descriptive names such as
   `add-orders` or `index-email`.

   ```bash
   # Create the first migration from the current Prisma schema and apply it.
   # --name labels the migration directory (here: a migration called "init").
   netscript db init --name init
   ```

2. Generate the Prisma client (`generator client` with `runtime="deno"`, output `./.generated`) and
   the zod schemas (`generator zod`, output `./.generated/zod`). The generated types keep your code in
   lockstep with the database, so re-run this whenever the schema changes.

   ```bash
   # Generate the Deno-runtime Prisma client (and the zod schemas) into
   # database/postgres/schema/.generated so your code can import typed models.
   netscript db generate
   ```

3. Seed baseline rows. Seeds are ordinary Deno scripts under `database/postgres/scripts/`, so they can
   insert reference data or a first admin record with the freshly generated client.

   ```bash
   # Run the workspace seed scripts (database/postgres/scripts/seed.ts)
   # to populate baseline rows.
   netscript db seed
   ```

4. Check the migration status. This is the command you'll run most once you start iterating.

   ```bash
   # Show migration / tooling status: which migrations are applied and
   # whether the database is in sync with the schema.
   netscript db status
   ```

### Iterate on the schema

After the first `init`, edit the `.prisma` files, run `netscript db migrate` to create and apply the
next migration, then `netscript db generate` to refresh the client: migrate, then generate, every
time. Do the same after you add a plugin that ships its own `.prisma` models. `netscript db studio`
opens a visual browser over the data.

> [!CAUTION]
> `netscript db reset` drops the database and re-applies every migration. Use it only in local
> development.

## Step 4 — Verify

Confirm the database is migrated and seeded, from most to least authoritative:

1. **CLI status.** `netscript db status` reports the `init` migration as applied and the schema in
   sync. If it is green, the other checks only corroborate it.
2. **Generated client.** `database/postgres/schema/.generated/` contains the Prisma client and the
   `zod` schemas, so your typed models are importable from application code.
3. **Aspire dashboard.** The dashboard at the URL Aspire prints shows the `postgres` resource
   is green and shows recent activity from the migration and seed runs.

When all three agree, import the generated client in a service or worker and read the rows the seed
wrote.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| A `db` command reports that the resident AppHost is stopped. | The AppHost isn't running, or you ran the command where Aspire can't find `aspire/apphost.mts`. Start `aspire start` from `aspire/`, keep it running, and run `netscript db` from the workspace root (or pass `--project-root`). |
| The `postgres` resource never turns green. | Docker or Podman isn't running. Aspire provisions Postgres and Redis as containers. |
| Code is typed against the old schema. | You edited a `.prisma` file without re-running `netscript db generate`. Generate after every schema change. |

## Next steps

Continue with [Use KV, queues, and cron](/data-persistence/how-to/queue-kv-cron/) to use the KV and queue
backends; its PostgreSQL queue provider keeps `message_queue` rows in this same datasource.

- [Database & Prisma](/data-persistence/database/): per-plugin schema aggregation, driver adapters
  and the appsettings-driven datasource.
- [Deploy](/orchestration-runtime/how-to/deploy/): point the workspace at your own Postgres with
  `POSTGRES_URI` / `DATABASE_URL` and `--no-aspire`.
- [`@netscript/database` reference](/reference/database/): the full API reference.
