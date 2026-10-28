---
layout: layouts/base.vto
title: Use a second database
templateEngine: [vento, md]
order: 102
oldUrl: /how-to/use-a-second-database/
---

# Use a second database

This recipe adds a *second* database, a second Postgres or a MySQL or SQL Server instance, to a
workspace that already has its primary datasource. Each datasource gets its own Prisma schema,
migrations and generated client.

The examples show the common Postgres-primary case, but the steps apply to whichever engine you
chose with `netscript init --db`. The default scaffold aggregates every plugin's `.prisma` models
into **one primary datasource** (see
[Database & migration](/data-persistence/how-to/database-migration/)). A second database is a
**separate** Prisma schema workspace with its own `generate` output and migration history, and it
never merges into the primary aggregation.

`netscript db add <engine>` accepts the same four engines as `netscript init`: `postgres`, `mysql`,
`mssql` and `sqlite`. The container engines (`postgres` / `mysql` / `mssql`) run as Aspire container
resources (`addPostgres` / `addMySql` / `addSqlServer`). `sqlite` is **file-backed and has no Aspire
container resource**, so the Aspire and Docker prerequisites apply only to the container engines.

There are two ways to add one, and they answer different needs:

- **Scaffold it (`netscript db add`)** — when you want NetScript to own the second datasource:
  its own schema dir, migrations, seed scripts, and an Aspire-provisioned container. This is
  the recommended path and the bulk of this recipe.
- **Wire an adapter by hand** — when the second database is *external* (a managed MySQL, a
  reporting warehouse) that you only read/write from application code, with no NetScript-managed
  migrations. Covered in [Connect an external database by hand](#connect-an-external-database-by-hand).

## Prerequisites

{{ comp.apiTable({ caption: "Prerequisites", rows: [
  { name: "A scaffolded workspace", type: "with a primary db", desc: "An existing NetScript project whose primary datasource is already wired (Postgres, the recommended engine, or whichever engine you passed to netscript init via --db) — ideally migrated once via the Database & migration recipe so you know the single-datasource loop." },
  { name: "netscript CLI", type: "on PATH", desc: "deno install --global --allow-all --name netscript jsr:@netscript/cli" + releaseSpecifier + ". netscript db add --help should print." },
  { name: "Aspire CLI + Docker", type: "for container mode", desc: "The scaffolded second database is provisioned as a container by Aspire (addMySql / addPostgres / addSqlServer). Docker or Podman must be running. Skip only for an external/hand-wired database." },
  { name: "Deno", type: "2.x", desc: "Prisma client generation runs under the Deno runtime (the generated schema sets runtime=\"deno\")." }
] }) }}

> [!IMPORTANT]
> **Add a datasource only for an isolated data domain:** a different engine (MySQL or SQL Server
> beside Postgres), a separate migration lifecycle, or a datasource you scale and back up
> independently. For a new *table*, add a model to the primary schema instead; every extra
> datasource brings its own migration history, generated client and connection to manage.
> {{ comp.xref({ key: "cap:database", text: "Database & Prisma" }) }} explains why the default is a
> single aggregated datasource.

## Step 1 — Scaffold the second database

From the workspace root, run `netscript db add <engine>` with `postgres`, `mysql`, `mssql` or
`sqlite`. The `--name` flag sets the **config key** the datasource is registered under; it defaults
to the engine name.

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

In one pass, `netscript db add`:

- **scaffolds a workspace** at `database/<engine>/` (for `mysql`, `database/mysql/`) with its own
  `schema/schema.prisma`, `prisma.config.ts`, `scripts/` and, after generate, `schema/.generated/`;
- **registers the datasource** in `appsettings.json` under `NetScript.Databases.<configKey>` with the
  engine, mode and a generated `DatabaseName`, the same appsettings-driven model the primary uses;
- **adds the workspace** as a project member so tooling discovers it;
- **regenerates the Aspire config and AppHost helper files**, so the new container (for example the
  MySQL resource via `addMySql`) joins the resource graph the next time you run `aspire start`.

> [!NOTE]
> `db add` does **not** run a migration or generate a client. The new
> `database/mysql/schema/schema.prisma` ships a starter schema and no `.generated/` directory yet; you
> run the migration loop yourself in Step 3.

## Step 2 — Bring the new container up with Aspire

Because `db add` regenerated the Aspire config, the new database becomes a container in the resource
graph. Start or restart the AppHost so it provisions the container:

```bash
# database/migration recipe covers this in full — restart so Aspire picks up
# the regenerated config and provisions the new container (e.g. the mysql resource).
cd aspire
aspire start
```

Open the Aspire dashboard at [https://localhost:18888](https://localhost:18888) (`aspire start`
prints the access token) and confirm that the new resource, `mysql`, `analytics` or whatever your
config key is, turns green beside `postgres` and `redis`.

> [!WARNING]
> The container appears only because `db add` regenerated the Aspire helpers. If you register a
> datasource by editing `appsettings.json` by hand, the AppHost doesn't know about it and the resource
> never shows up. Let the CLI own the appsettings and Aspire wiring.

## Step 3 — Migrate and generate the second datasource

Every `netscript db` operation is **multi-database aware**: it takes `--db <target>`, where the
target is a **config key**, a database name or `all`. With the second database registered under
`NetScript.Databases.mysql`, pass `--db mysql`. Run these from the workspace root while `aspire start`
runs in another terminal:

1. Create and apply the first migration for the second datasource only.

   ```bash
   # Create + apply the first migration for the SECOND datasource only.
   # --db selects the config key; --name labels the migration directory.
   netscript db init --db mysql --name init
   ```

2. Generate its Deno-runtime Prisma client and zod schemas.

   ```bash
   # Generate the Deno-runtime Prisma client + zod schemas into
   # database/mysql/schema/.generated for the mysql datasource.
   netscript db generate --db mysql
   ```

3. Run its seed scripts.

   ```bash
   # Run that datasource's seed scripts (database/mysql/scripts/seed.ts).
   netscript db seed --db mysql
   ```

4. Confirm it is migrated and in sync.

   ```bash
   # Confirm the mysql datasource is migrated and in sync — the authoritative check.
   netscript db status --db mysql
   ```

To operate on every registered datasource at once, primary and second, use `--db all`:

```bash
# Operate on EVERY registered datasource at once (primary + second).
netscript db migrate --db all --name add_reports
netscript db generate --db all
```

Each datasource keeps its **own** migration history under `database/<engine>/migrations/` and its
**own** generated client. Running `netscript db migrate --db mysql` after editing the second schema
never touches the primary Postgres, and the reverse holds too.

> [!IMPORTANT]
> A `db` command without `--db` resolves to the **primary** datasource. Pass `--db <configKey>` when
> you mean the second one, or `--db all` to fan out across every registered datasource. The resolver
> matches on config key first, then database name.

## Step 4 — Query the second client from application code

After `db generate --db mysql`, the second datasource has its own typed client at
`database/mysql/schema/.generated/client.server.ts`. Import it like the primary, from the new path.
The two clients are independent `PrismaClient` instances, so a service can read from both:

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

### Unsupported by NetScript, supported by Prisma (libSQL / Turso example)

When you need a backing database that Prisma supports (such as **libSQL / Turso** via `@prisma/adapter-libsql`, PlanetScale, or Cloudflare D1) but NetScript does not ship a pre-packaged wrapper for, wire Prisma's driver adapter directly in application code.

#### 1. Distinguishing Prisma's driver adapter from NetScript's `DatabaseAdapter`

It is important to distinguish the two levels of adapters:

- **Prisma driver adapter (`PrismaLibSql`)**: Low-level engine adapter provided by upstream (`@prisma/adapter-libsql`). Its sole job is bridging Prisma 7 query engine calls to the underlying driver (e.g. `@libsql/client`). You pass this directly to `new PrismaClient({ adapter })`.
- **NetScript `DatabaseAdapter` wrapper**: High-level framework port (`@netscript/database/ports`) implemented by NetScript's factories (`createPostgresAdapter`, `createMysqlAdapter`, `createMssqlAdapter`). It encapsulates connection lifecycle (`connect()`, `disconnect()`), health checks (`healthCheck()`), status metrics (`getStatus()`), and raw query dispatch (`executeRaw()`).

When using an unsupported driver like libSQL/Turso directly, your application uses Prisma's driver adapter without implementing NetScript's `DatabaseAdapter`.

#### 2. Code example (libSQL / Turso)

Below is a complete, pasteable example using `@prisma/adapter-libsql` and the generated Deno Prisma client shape:

```ts
// database/turso/mod.ts (or services/chat/src/db.ts)
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient as TursoClient } from './schema/.generated/client.server.ts';

// 1. Resolve environment variables under Deno
const connectionString = Deno.env.get('TURSO_DATABASE_URL') ?? 'libsql://my-app.turso.io';
const authToken = Deno.env.get('TURSO_AUTH_TOKEN');

// 2. Construct Prisma's driver adapter directly
const adapter = new PrismaLibSql({
  url: connectionString,
  authToken,
});

// 3. Instantiate the generated Deno Prisma client with the driver adapter
export const turso = new TursoClient({ adapter });

// 4. Application-owned health check ping
export async function checkTursoHealth(): Promise<boolean> {
  try {
    await turso.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
```

#### 3. Application-owned responsibilities

Because NetScript does not wrap the driver, the application owns the following responsibilities:

- **Client generation & output shape**: Configure `schema/schema.prisma` with `generator client { provider = "prisma-client", output = "./.generated", runtime = "deno" }`. Run `netscript db generate --db <name>` to output the Deno-compatible client at `./schema/.generated/client.server.ts`.
- **Environment & connection management**: Resolve URL and credentials (such as `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`) via `Deno.env.get()`.
- **Lifecycle & health**: Manage startup/shutdown (`turso.$connect()`, `turso.$disconnect()`) and implement custom health checks (e.g. `turso.$queryRaw`SELECT 1\``) for readiness probes or health reporting.
- **Tracing & telemetry**: Configure query logging or OpenTelemetry tracing directly on the `PrismaClient` instance if desired.
- **Permissions (driver-dependent)**: Grant the specific Deno runtime permissions required by your database driver (`--allow-net`, `--allow-env`, `--allow-read` for network/cloud drivers like libSQL over HTTP; `--allow-ffi` is driver-dependent and only needed if using native/C bindings), and declare required permissions on Aspire apphost entries when launching under Aspire.

#### 4. Decision rule: Direct use vs. reusable `DatabaseAdapter` wrapper

- **Use direct Prisma driver adapter (`new PrismaClient({ adapter })`) app-locally when**:
  - You are adding a single service/datasource with an upstream driver (e.g. libSQL/Turso).
  - Standard `PrismaClient` methods satisfy all query needs.
  - You do not need centralized `netscript db` lifecycle hooks or multi-plugin status reporting.
- **Implement a reusable NetScript `DatabaseAdapter` wrapper when**:
  - The database driver will be shared across multiple plugins or workspace packages.
  - You need uniform `connect()`, `disconnect()`, `healthCheck()`, and `getStatus()` behavior across the workspace.
  - CLI tools or plugin doctor require standardized status reporting.

## Production notes

- **Stale second client.** Each datasource has its *own* `.generated/`. Editing
  `database/mysql/schema/schema.prisma` without `netscript db generate --db mysql` leaves your code
  typed against the old shape.
- **Importing the wrong client.** The primary is
  `database/postgres/schema/.generated/client.server.ts`; the second is
  `database/mysql/schema/.generated/client.server.ts`. They are distinct `PrismaClient`s, and crossing
  the imports queries the wrong database.
- **Docker down.** Aspire provisions a scaffolded (container-mode) second database; if Docker or
  Podman is not running, its resource never turns green. A hand-wired external database doesn't need
  it.
- **Alpha surface.** NetScript packages share the aligned `{{ releaseVersion }}` version, and public
  subpaths can still be renamed. Pin versions and re-check the import paths after upgrades.

## Next steps

Pick a backend for your queues in
[Choose a queue provider](/data-persistence/how-to/choose-a-queue-provider/); its PostgreSQL backend
can share one of these datasources.

- {{ comp.xref({ key: "cap:database", text: "Database & Prisma" }) }}: driver adapters and the
  aggregated primary datasource.
- {{ comp.xref({ key: "ref:database", text: "@netscript/database reference" }) }} and
  {{ comp.xref({ key: "ref:prisma-adapter-mysql", text: "@netscript/prisma-adapter-mysql reference" }) }}.
- {{ comp.xref({ key: "explain:aspire", text: "Orchestration with Aspire" }) }}: how the AppHost
  provisions each database container.

{{ comp.nextPrev({ prev: { label: "Expose OpenAPI & Scalar", href: "/services-sdk/how-to/expose-openapi-scalar/" }, next: { label: "Choose a queue provider", href: "/data-persistence/how-to/choose-a-queue-provider/" } }) }}
