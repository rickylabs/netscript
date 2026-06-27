---
layout: layouts/base.vto
title: Use a second database
templateEngine: [vento, md]
prev: { label: "Expose OpenAPI & Scalar", href: "/how-to/expose-openapi-scalar/" }
next: { label: "Choose a queue provider", href: "/how-to/choose-a-queue-provider/" }
---

# Use a second database

**Goal:** add a *second* database — a second Postgres, or a MySQL/SQL Server instance —
to a NetScript workspace that already has its primary datasource, so each datasource gets its
own Prisma schema, migrations, and generated client.

This recipe assumes the primary datasource is Postgres (the recommended default — every tutorial
scaffolds with `--db postgres`), but the primary engine is itself chosen at scaffold time: pass
`--db mysql`, `--db mssql`, or `--db sqlite` to `netscript init` for a MySQL, SQL Server, or
file-backed SQLite primary instead. Everything below applies regardless of which engine your
primary uses; the examples simply show the common Postgres-primary case.

NetScript's default scaffold gives you **one primary datasource** that every plugin
aggregates its `.prisma` models into (see [Database & migration](/how-to/database-migration/)).
A second database is the opposite shape: a **separate** Prisma schema workspace with its own
`generate` output and its own migration history. It never merges into the primary aggregation.

The second datasource is polyglot the same way the primary is: `netscript db add <engine>`
accepts the same four engines as `netscript init` — `postgres`, `mysql`, `mssql`, and `sqlite`.
The container-mode engines (`postgres`/`mysql`/`mssql`) are provisioned as an Aspire container
resource (`addPostgres` / `addMySql` / `addSqlServer`); `sqlite` is **file-backed and has no
Aspire container resource**, so the Aspire/Docker prerequisites below apply only to the
container engines.

There are two ways to add one, and they answer different needs:

- **Scaffold it (`netscript db add`)** — when you want NetScript to own the second datasource:
  its own schema dir, migrations, seed scripts, and an Aspire-provisioned container. This is
  the recommended path and the bulk of this recipe.
- **Wire an adapter by hand** — when the second database is *external* (a managed MySQL, a
  reporting warehouse) that you only read/write from application code, with no NetScript-managed
  migrations. Covered in [Connect an external database by hand](#connect-an-external-database-by-hand).

## Before you start

{{ comp.apiTable({ caption: "Prerequisites", rows: [
  { name: "A scaffolded workspace", type: "with a primary db", desc: "An existing NetScript project whose primary datasource is already wired (Postgres by default, or whichever engine you passed to netscript init via --db) — ideally migrated once via the Database & migration recipe so you know the single-datasource loop." },
  { name: "netscript CLI", type: "on PATH", desc: "deno install --global --allow-all --name netscript jsr:@netscript/cli. netscript db add --help should print." },
  { name: "Aspire CLI + Docker", type: "for container mode", desc: "The scaffolded second database is provisioned as a container by Aspire (addMySql / addPostgres / addSqlServer). Docker or Podman must be running. Skip only for an external/hand-wired database." },
  { name: "Deno", type: "2.x", desc: "Prisma client generation runs under the Deno runtime (the generated schema sets runtime=\"deno\")." }
] }) }}

{{ comp callout { type: "important", title: "One datasource, or several — pick deliberately" } }}
A second database is the right tool when you need an <strong>isolated</strong> data domain:
a different engine (MySQL/SQL Server beside Postgres), a separate migration lifecycle, or a
datasource you can scale and back up independently. If you only want a new <em>table</em>, add
a model to the primary schema instead — adding a whole datasource means a second migration
history, a second generated client, and a second connection to manage. See
{{ comp.xref({ key: "cap:database", text: "Database & Prisma" }) }} for why the default is a
single aggregated datasource.
{{ /comp }}

## Step 1 — Scaffold the second database

From the workspace root, run `netscript db add <engine>`. The engine is one of
`postgres`, `mysql`, `mssql`, or `sqlite`. The `--name` flag sets the **config key** the
datasource is registered under (it defaults to the engine name):

{{ comp.tabbedCode({ tabs: [
  {
    label: "MySQL beside Postgres",
    lang: "bash",
    code: "# Add a MySQL datasource. Registered under NetScript.Databases.mysql,\n# scaffolded into database/mysql/, provisioned by Aspire's addMySql (image 8.4).\nnetscript db add mysql"
  },
  {
    label: "A second Postgres",
    lang: "bash",
    code: "# A second Postgres for an isolated domain. --name gives it a distinct config\n# key (and workspace), so it does not collide with the primary 'postgres'.\nnetscript db add postgres --name analytics"
  },
  {
    label: "SQL Server",
    lang: "bash",
    code: "# SQL Server via Aspire's addSqlServer. Same shape — its own schema + migrations.\nnetscript db add mssql --name reporting"
  }
] }) }}

What `netscript db add` does, in one pass:

- **Scaffolds a workspace** at `database/<engine>/` (for `mysql`, `database/mysql/`) — its own
  `schema/schema.prisma`, `prisma.config.ts`, `scripts/`, and (after generate) `schema/.generated/`.
- **Registers the datasource** in `appsettings.json` under `NetScript.Databases.<configKey>`
  with the engine, mode, and a generated `DatabaseName` — the same appsettings-driven model the
  primary Postgres uses.
- **Adds the workspace** as a member of the project so tooling discovers it.
- **Regenerates the Aspire config and AppHost helper files** so the new container (for example
  the MySQL resource via `addMySql`) joins the resource graph the next time you run `aspire start`.

{{ comp callout { type: "note", title: "The new datasource starts empty" } }}
<code>db add</code> scaffolds the workspace and registers the datasource, but it does
<strong>not</strong> run a migration or generate a client — the new
<code>database/mysql/schema/schema.prisma</code> ships a starter schema and no
<code>.generated/</code> directory yet. You run the migration loop yourself in Step 3,
targeting the new datasource with <code>--db</code>.
{{ /comp }}

## Step 2 — Bring the new container up with Aspire

Because `db add` regenerated the Aspire config, the new database becomes a container in the
resource graph. Start (or restart) the AppHost so it provisions:

```bash
# database/migration recipe covers this in full — restart so Aspire picks up
# the regenerated config and provisions the new container (e.g. the mysql resource).
cd aspire
aspire start
```

Open the Aspire dashboard at [http://localhost:18888](http://localhost:18888) (the access
token is printed by `aspire start`) and confirm the new resource — `mysql`, `analytics`, or
whatever your config key is — goes green alongside the existing `postgres` and `redis`.

{{ comp callout { type: "warning", title: "If you skipped db add and only edited appsettings" } }}
The container only appears because <code>db add</code> <strong>regenerated the Aspire
helpers</strong>. If you register a datasource by hand-editing
<code>appsettings.json</code> without re-running the generator, the AppHost will not know
about it and the resource never shows up. Let the CLI own the appsettings + Aspire wiring —
that is the whole point of <code>db add</code>.
{{ /comp }}

## Step 3 — Migrate and generate the second datasource

The `netscript db` operations are **multi-database aware**: every one takes a `--db <target>`
flag, where the target is a **config key**, a database name, or `all`. With the second database
registered under `NetScript.Databases.mysql`, point each command at it with `--db mysql`. Run
these from the workspace root, with `aspire start` up in another terminal:

{{ comp.tabbedCode({ tabs: [
  {
    label: "1 · init",
    lang: "bash",
    code: "# Create + apply the first migration for the SECOND datasource only.\n# --db selects the config key; --name labels the migration directory.\nnetscript db init --db mysql --name init"
  },
  {
    label: "2 · generate",
    lang: "bash",
    code: "# Generate the Deno-runtime Prisma client + zod schemas into\n# database/mysql/schema/.generated for the mysql datasource.\nnetscript db generate --db mysql"
  },
  {
    label: "3 · seed",
    lang: "bash",
    code: "# Run that datasource's seed scripts (database/mysql/scripts/seed.ts).\nnetscript db seed --db mysql"
  },
  {
    label: "4 · status",
    lang: "bash",
    code: "# Confirm the mysql datasource is migrated and in sync — the authoritative check.\nnetscript db status --db mysql"
  },
  {
    label: "all datasources",
    lang: "bash",
    code: "# Operate on EVERY registered datasource at once (primary + second).\nnetscript db migrate --db all --name add_reports\nnetscript db generate --db all"
  }
] }) }}

Each datasource keeps its **own** migration history under `database/<engine>/migrations/`
and its **own** generated client. Editing the second schema and re-running
`netscript db migrate --db mysql` never touches the primary Postgres, and vice versa.

{{ comp callout { type: "note", title: "Omitting --db targets the primary" } }}
Run a <code>db</code> command with no <code>--db</code> and it resolves to the
<strong>primary</strong> datasource (the default Postgres). Always pass
<code>--db &lt;configKey&gt;</code> when you mean the second one, or <code>--db all</code>
to fan out across every registered datasource. The resolver matches on config key first, then
database name.
{{ /comp }}

## Step 4 — Query the second client from application code

After `db generate --db mysql`, the second datasource has its own typed client at
`database/mysql/schema/.generated/client.server.ts`. Import it exactly like the primary —
just from the new path. The two clients are independent `PrismaClient` instances, so a service
can read from both:

{{ comp.tabbedCode({ tabs: [
  {
    label: "Use the second client",
    lang: "ts",
    code: "// services/reporting/src/db.ts\n// Each datasource generates its OWN client. Import the second one from its path.\nimport { PrismaClient as ReportingPrisma } from '../database/mysql/schema/.generated/client.server.ts';\n\nexport const reporting = new ReportingPrisma();\n\n// Fully typed off the SECOND schema's models — separate from the primary client.\nconst rows = await reporting.report.findMany({ take: 20 });\nconsole.log(rows.length);"
  },
  {
    label: "Read from both",
    lang: "ts",
    code: "// services/reporting/src/sync.ts\n// A service can hold both clients side by side — one per datasource.\nimport { PrismaClient as AppPrisma } from '../database/postgres/schema/.generated/client.server.ts';\nimport { PrismaClient as ReportingPrisma } from '../database/mysql/schema/.generated/client.server.ts';\n\nconst app = new AppPrisma();\nconst reporting = new ReportingPrisma();\n\n// Copy a record from the primary Postgres into the MySQL reporting datasource.\nconst order = await app.exampleRecord.findFirstOrThrow();\nawait reporting.report.create({ data: { sourceId: order.id, name: order.name } });"
  }
] }) }}

## Connect an external database by hand

If the second database is **external** — a managed MySQL you do not want NetScript to migrate
or provision — skip `db add` and wire a driver adapter in application code. NetScript wraps each
Prisma 7 driver in a small `DatabaseAdapter` with a uniform lifecycle
(`getDriverAdapter` → `setClient` → `connect`/`healthCheck`/`getStatus`). The MySQL and SQL Server
adapters are **sub-exports** (not in the `@netscript/database/adapters` barrel), so a Postgres-only
app never pulls in their drivers:

{{ comp.apiTable({
  caption: "Second-database adapter factories (each implements DatabaseAdapter)",
  rows: [
    { name: "createMysqlAdapter(opts)", type: "@netscript/database/adapters/mysql", desc: "MySQL 8.x / MariaDB via the native-Deno @netscript/prisma-adapter-mysql driver. MysqlConnectionOptions adds charset, timezone, connectionLimit, multipleStatements over the shared parts." },
    { name: "createMssqlAdapter(opts)", type: "@netscript/database/adapters/mssql", desc: "SQL Server via @prisma/adapter-mssql. MssqlConnectionOptions adds instanceName, encrypt, trustServerCertificate, integratedSecurity, connectTimeout, requestTimeout." },
    { name: "createPostgresAdapter(opts)", type: "@netscript/database/adapters", desc: "PostgreSQL via @prisma/adapter-pg. The only adapter in the barrel; PostgresConnectionOptions adds schema and applicationName." }
  ]
}) }}

The shared options come from `DatabaseConnectionOptions` (`@netscript/database/ports`): pass a
`connectionString`, or the structured `host` / `port` / `database` / `username` / `password` /
`ssl` / `poolSize` / `timeout` parts.

{{ comp.tabbedCode({ tabs: [
  {
    label: "MySQL — createMysqlAdapter",
    lang: "ts",
    code: "// services/reporting/src/external-db.ts\n// Sub-export — import from /adapters/mysql, NOT the barrel.\nimport { createMysqlAdapter } from '@netscript/database/adapters/mysql';\nimport { PrismaClient } from '../database/mysql/schema/.generated/client.server.ts';\n\n// 1) Build the adapter from structured parts (or pass { connectionString }).\nconst adapter = createMysqlAdapter({\n  host: Deno.env.get('MYSQL_HOST') ?? 'localhost',\n  port: 3306,\n  database: 'reporting',\n  username: Deno.env.get('MYSQL_USER') ?? 'root',\n  password: Deno.env.get('MYSQL_PASSWORD'),\n  ssl: false,\n});\n\n// 2) Pass the driver adapter into Prisma, then hand the client BACK to the adapter.\nexport const reporting = new PrismaClient({ adapter: adapter.getDriverAdapter() });\nadapter.setClient(reporting);\n\n// 3) Lifecycle + health now run off the same client.\nawait adapter.connect();\nconst ok = await adapter.healthCheck(); // SELECT 1\nconsole.log('mysql healthy:', ok, await adapter.getStatus());"
  },
  {
    label: "Env-driven config",
    lang: "ts",
    code: "// Prefer reading config from the environment? getMysqlConfig() reads structured\n// MYSQL_HOST / MYSQL_PORT / MYSQL_DATABASE / MYSQL_USER / MYSQL_PASSWORD vars and\n// falls back to a connection-string env var (MYSQLDB_URI, then DATABASE_URL).\nimport { createMysqlAdapter, getMysqlConfig } from '@netscript/database/adapters/mysql';\n\nconst cfg = getMysqlConfig(); // → MysqlAdapterConfig, or throws if nothing is set\nconst adapter = createMysqlAdapter({\n  host: cfg.hostname,\n  port: cfg.port,\n  database: cfg.db,\n  username: cfg.username,\n  password: cfg.password,\n});\n// (getMssqlConfig has the same shape for SQL Server, reading MSSQL_* / MSSQLDB_URI.)"
  },
  {
    label: "SQL Server variant",
    lang: "ts",
    code: "// services/reporting/src/external-db.ts — SQL Server (same lifecycle)\nimport { createMssqlAdapter } from '@netscript/database/adapters/mssql';\nimport { PrismaClient } from '../database/mssql/schema/.generated/client.server.ts';\n\nconst adapter = createMssqlAdapter({\n  host: Deno.env.get('MSSQL_SERVER') ?? 'localhost',\n  port: 1433,\n  database: 'reporting',\n  username: 'sa',\n  password: Deno.env.get('MSSQL_PASSWORD'),\n  encrypt: true,              // local-dev TLS knobs; tighten for production\n  trustServerCertificate: true,\n});\n\nexport const reporting = new PrismaClient({ adapter: adapter.getDriverAdapter() });\nadapter.setClient(reporting);\nawait adapter.connect();"
  }
] }) }}

{{ comp callout { type: "important", title: "getClient() throws until you call setClient()" } }}
The adapter does <strong>not</strong> own the <code>PrismaClient</code> — you construct it.
The order is always: build the adapter, call <code>getDriverAdapter()</code>, pass that to
<code>new PrismaClient({ adapter })</code>, then call
<code>adapter.setClient(client)</code>. Only then do <code>getClient()</code>,
<code>connect()</code>, <code>healthCheck()</code>, and <code>executeRaw()</code> work — call
<code>getClient()</code> before <code>setClient()</code> and it throws
<code>"… client not initialized. Call setClient() …"</code>.
{{ /comp }}

## In-production pitfalls

{{ comp callout { type: "warning", title: "Watch for these" } }}
<ul>
<li><strong>Forgetting <code>--db</code>.</strong> A bare <code>netscript db migrate</code> targets the <strong>primary</strong> datasource. Always pass <code>--db &lt;configKey&gt;</code> (e.g. <code>--db mysql</code>) for the second one, or <code>--db all</code> to fan out — otherwise you migrate the wrong database.</li>
<li><strong>Aspire not restarted after <code>db add</code>.</strong> The new container only joins the resource graph after the regenerated Aspire config is loaded. Restart <code>aspire start</code> before the new datasource is reachable.</li>
<li><strong>Stale second client.</strong> Each datasource has its <em>own</em> <code>.generated/</code>. Editing <code>database/mysql/schema/schema.prisma</code> without <code>netscript db generate --db mysql</code> leaves your code typed against the old shape — same trap as the primary, once per datasource.</li>
<li><strong>Importing the wrong client.</strong> The primary is <code>database/postgres/schema/.generated/client.server.ts</code>; the second is <code>database/mysql/schema/.generated/client.server.ts</code>. They are distinct <code>PrismaClient</code>s — crossing the imports queries the wrong database.</li>
<li><strong>Calling <code>getClient()</code> before <code>setClient()</code></strong> on a hand-wired adapter throws — see the callout above.</li>
<li><strong>Docker down.</strong> A scaffolded (container-mode) second database is provisioned by Aspire; if Docker/Podman is not running, its resource never goes green. An external/hand-wired database does not need this.</li>
<li><strong>Alpha surface.</strong> NetScript packages share the aligned <code>{{ releaseVersion }}</code> version, and public subpaths can still be renamed. Pin versions and re-check the import paths after upgrades.</li>
</ul>
{{ /comp }}

## See also

{{ comp.xref({ key: "cap:database", text: "Database & Prisma — capability hub" }) }} ·
{{ comp.xref({ key: "howto:database-migration", text: "Database & migration — the primary-datasource loop" }) }} ·
{{ comp.xref({ key: "ref:database", text: "@netscript/database reference" }) }} ·
{{ comp.xref({ key: "ref:prisma-adapter-mysql", text: "@netscript/prisma-adapter-mysql reference" }) }} ·
{{ comp.xref({ key: "explain:aspire", text: "Orchestration with Aspire" }) }} ·
{{ comp.xref({ key: "cap:kv-queues-cron", text: "KV, queues & cron — the Postgres queue backend" }) }}

{{ comp.nextPrev({ prev: { label: "Expose OpenAPI & Scalar", href: "/how-to/expose-openapi-scalar/" }, next: { label: "Choose a queue provider", href: "/how-to/choose-a-queue-provider/" } }) }}
