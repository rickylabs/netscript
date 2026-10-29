---
layout: layouts/base.vto
title: Database & Prisma
templateEngine: [vento, md]
order: 1
---

# Database & Prisma

This page explains how NetScript wires its database layer: where the schema and connection settings
live, how one schema edit reaches the typed client, the validation schemas and the migration, and how
to choose or add a database engine.

The persistence layer is **Prisma 7 over a driver adapter**, generated for the Deno runtime and
provisioned by **Aspire**. Postgres is the recommended engine; MSSQL and MySQL adapters ship
alongside it. Every plugin contributes its own `.prisma` models, and NetScript aggregates them into
one generated client over one primary datasource. The `.prisma` file is the single source: edit it,
run `netscript db generate`, and the Deno-runtime client and the matching zod schemas regenerate
together. The same `netscript db` workflow creates and applies the migration.

Use the database for records that survive restarts, are queried with a typed client and are shared
across a service and its plugins. For ephemeral or high-throughput state, such as counters, locks,
work queues and scheduled triggers, use [KV, queues & cron](/data-persistence/kv-queues-cron/). The
scaffold uses both: Postgres for records, Redis/KV for execution state. Postgres can also back the
work queue when you select it with an explicit `provider: 'postgres'`.

{{ comp.diagram({
  src: "/assets/diagrams/database-schema-aggregation.svg",
  alt: "Per-plugin .prisma schema files (root ExampleRecord, workers, sagas, triggers, auth) under database/postgres/schema/plugins are aggregated by netscript db generate into a single Deno-runtime Prisma client and matching zod schemas; the client talks to one datasource through a selected driver adapter — postgres, mssql, or mysql.",
  caption: "One generated client, many contributors. Each plugin's .prisma file is aggregated into the same datasource; an adapter (postgres / mssql / mysql) selects the driver underneath."
}) }}

> [!IMPORTANT]
> Start Aspire before any `netscript db` command. In the default layout Aspire provisions Postgres as
> a container, so `cd aspire && aspire start` must be running, with Docker or Podman up, before you
> run `netscript db init`. [Orchestration with Aspire](/explanation/aspire/) explains why the AppHost
> owns the database container.

## How persistence is wired

You choose the engine at scaffold time with `--db`:
`netscript init my-app --db postgres|mysql|mssql|sqlite`. Postgres is the recommended engine and the
one every tutorial uses. `postgres`, `mysql` and `mssql` run as Aspire container resources; `sqlite`
is file-backed and has no container resource. A `--db postgres` scaffold lays down this workspace,
and another engine lays down `database/<engine>/`:

```tree
my-app/
├── appsettings.json              # NetScript.Databases.postgres — Engine/Mode/DatabaseName (the real config)
├── netscript.config.ts           # databases.config is intentionally EMPTY here
└── database/postgres/
    ├── schema/
    │   ├── schema.prisma          # root: generator client (runtime="deno"), generator zod, datasource db
    │   └── plugins/               # per-plugin .prisma models aggregated here
    │       ├── workers/workers.prisma
    │       ├── sagas/sagas.prisma
    │       ├── triggers/triggers.prisma
    │       └── auth/auth.prisma   # appears once the auth plugin is added (better-auth backend)
    ├── prisma.config.ts           # schema dir + migrations path + datasource url
    ├── scripts/                   # migrate.ts, seed.ts, generate-zod.ts, fix-zod-imports.ts, …
    └── schema/.generated/         # appears after `db generate`: Prisma client + zod schemas
```

Three things differ from a typical single-file Prisma setup:

- **`appsettings.json` drives the datasource, not `netscript.config.ts`.** In the scaffold,
  `netscript.config.ts` has `databases: { config: [] }` (empty). The connection details live in
  `appsettings.json` under `NetScript.Databases.postgres`: `Engine: "Postgres"`, `Mode: "Container"`,
  a generated `DatabaseName`, a persistent `DataPath` of `.data/postgres`, and
  `PrimaryDatabase: "postgres"`. Aspire reads that block to provision the container.
- **One datasource, many contributors.** There is a single primary Postgres datasource. Each
  first-party plugin ships its own `database/<plugin>.prisma`, aggregated under
  `database/postgres/schema/plugins/<plugin>/`. After you add `workers`, `sagas` and `triggers`,
  their tables (for example `model JobDefinition` from workers) join the root `ExampleRecord` model
  in the same database, and one `db init` / `db generate` cycle covers the app and its plugins.
- **The client is generated for Deno.** `schema.prisma` sets `generator client` with
  `runtime = "deno"` and `output = "./.generated"`, plus a `generator zod` (prisma-zod-generator)
  that writes matching zod schemas to `./.generated/zod`. One generate gives you the type-safe client
  and the runtime validation schemas.

## Generated schemas feed public contracts

`netscript db generate` also writes the NetScript-owned CRUD barrel that contract modules import as
`@database/zod`. It exposes `<Model>Schema`, `<Model>CreateInput` and `<Model>UpdateInput` for every
discovered model. The workspace root and the `contracts/` member map the alias to different relative
targets, but consumer code imports `@database/zod` in both. In a contract module, derive the public
shape instead of copying the model or exporting it unchanged:

```ts
import { UserSchema as DatabaseUserSchema } from '@database/zod';
import { z } from 'zod';

export const UsersListItemSchemaV1 = DatabaseUserSchema
  .pick({ id: true, name: true })
  .extend({
    status: z.enum(['active', 'invited']),
  });
```

The generated schema stays authoritative for column types and nullability. The versioned contract
selects what crosses the service boundary and adds stricter or public-only rules.
[Contracts & type flow](/explanation/contracts/#where-the-public-shape-begins) covers the DB-less
counterpart, private-field omission and explicit multi-model relation composition.

## A model and a query

Define models in `.prisma` files, then query them through the generated Deno client. The root
`schema.prisma` ships one sample model, `ExampleRecord`; plugin schema files add their own.

{{ comp.tabbedCode({ tabs: [
  {
    label: "schema.prisma",
    lang: "prisma",
    code: "// database/postgres/schema/schema.prisma\ngenerator client {\n  provider = \"prisma-client\"\n  output   = \"./.generated\"\n  runtime  = \"deno\"\n}\n\ngenerator zod {\n  provider = \"prisma-zod-generator\"\n  output   = \"./.generated/zod\"\n}\n\ndatasource db {\n  provider = \"postgresql\"\n  // The datasource URL is resolved by prisma.config.ts (POSTGRES_URI / DATABASE_URL),\n  // not declared here.\n}\n\nmodel ExampleRecord {\n  id        String   @id @default(uuid())\n  name      String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}"
  },
  {
    label: "query.ts",
    lang: "ts",
    code: "// Import the Deno-runtime client generated by `netscript db generate`.\nimport { PrismaClient } from '../database/postgres/schema/.generated/client.server.ts';\n\nconst prisma = new PrismaClient();\n\n// Insert a record, then read it back — fully typed off the model above.\nconst created = await prisma.exampleRecord.create({\n  data: { name: 'first' },\n});\n\nconst recent = await prisma.exampleRecord.findMany({\n  orderBy: { createdAt: 'desc' },\n  take: 10,\n});\n\nconsole.log(created.id, recent.length);"
  }
] }) }}

## The database workflow

Run the public `netscript db` commands from the workspace root while `aspire start` runs from
`aspire/`. To target another workspace, pass `--project-root <path>`. The generated client under
`database/postgres/schema/.generated/` is a build artifact: after a `.prisma` edit, your code is
typed against the old shape until you run `netscript db generate` again.

| Command | What it does |
| --- | --- |
| `netscript db init --name init` | Creates the first migration from the current Prisma schema and applies it. `--name` labels the migration directory. |
| `netscript db generate` | Generates the Deno-runtime Prisma client and the zod schemas into `database/postgres/schema/.generated`. |
| `netscript db seed` | Runs the workspace seed scripts (`database/postgres/scripts/seed.ts`) to populate baseline rows. |
| `netscript db status` | Shows which migrations are applied and whether the database is in sync with the schema. |
| `netscript db migrate --name add_orders` | Creates and applies the next migration after a schema change. Run `netscript db generate` after it. |

[Migrate the database](/data-persistence/how-to/database-migration/) runs this cycle step by step.

## Plugins contribute models

Adding a first-party plugin installs its Prisma models into the same datasource; there is no second
database. The models land under `database/postgres/schema/plugins/<plugin>/` and migrate in the same
`db init` / `migrate` cycle as your app.

{{ comp.apiTable({
  caption: "Plugin-contributed Prisma models (same primary datasource)",
  rows: [
    { name: "workers", type: "@netscript/plugin-workers", desc: "Job and schedule definitions (for example JobDefinition) backing the durable background-job runtime." },
    { name: "sagas", type: "@netscript/plugin-sagas", desc: "Durable saga state — saga_runtime_state / saga_runtime_transition / saga_runtime_correlation — when the saga store backend is prisma (vs kv). See Durable sagas." },
    { name: "triggers", type: "@netscript/plugin-triggers", desc: "Trigger definitions and delivery bookkeeping for the inbound webhook/ingest runtime." },
    { name: "auth", type: "@netscript/plugin-auth", desc: "auth.prisma: auth_users / auth_sessions / auth_accounts / auth_verifications — used by the better-auth backend. (kv-oauth stores sessions in KV; WorkOS is stateless.)" }
  ]
}) }}

> [!NOTE]
> Run the auth migration only when `NETSCRIPT_AUTH_BACKEND` selects the better-auth backend. The
> default kv-oauth backend keeps sessions in KV and WorkOS is stateless (sealed cookie), so neither
> depends on the `auth.prisma` tables.

## Driver adapters

Prisma 7 talks to the database through a **driver adapter**. NetScript wraps each driver in a small
`DatabaseAdapter` that gives every backend the same lifecycle surface: `getDriverAdapter` →
`setClient` → `connect` / `disconnect` / `healthCheck` / `getStatus`. Postgres lives in the
`@netscript/database/adapters` barrel. The SQL Server and MySQL adapters are sub-exports, so a
Postgres-only app never loads their heavier drivers; MySQL runs on the native-Deno
[`@netscript/prisma-adapter-mysql`](/reference/prisma-adapter-mysql/) driver. You can target or add a
second engine without changing how your code consumes the client.

Every adapter accepts the shared `DatabaseConnectionOptions` from `@netscript/database/ports`: either a
`connectionString` or the structured `host` / `port` / `database` / `username` / `password` / `ssl` /
`poolSize` / `timeout` parts, plus a few engine-specific extras.

{{ comp.apiTable({
  caption: "Driver adapters (each implements DatabaseAdapter)",
  rows: [
    { name: "adapters/postgres", type: "createPostgresAdapter(opts)", desc: "PostgreSQL via @prisma/adapter-pg. Re-exported from the @netscript/database/adapters barrel. PostgresConnectionOptions adds schema and applicationName. Builds a connection string under the hood." },
    { name: "adapters/mssql", type: "createMssqlAdapter(opts)", desc: "SQL Server via @prisma/adapter-mssql. Import from @netscript/database/adapters/mssql (sub-export — NOT in the barrel). MssqlConnectionOptions adds instanceName, trustServerCertificate, encrypt, integratedSecurity, applicationName, connectTimeout, requestTimeout. Accepts ADO.NET-style connection strings." },
    { name: "adapters/mysql", type: "createMysqlAdapter(opts)", desc: "MySQL 8.x / MariaDB via @netscript/prisma-adapter-mysql (a native-Deno driver). Import from @netscript/database/adapters/mysql (sub-export). MysqlConnectionOptions adds charset, timezone, connectionLimit, multipleStatements." }
  ]
}) }}

{{ comp.apiTable({
  caption: "DatabaseAdapter surface (every adapter)",
  rows: [
    { name: "provider", type: "'postgres' | 'mssql' | 'mysql'", desc: "Readonly provider identity used in status reporting." },
    { name: "getDriverAdapter()", type: "→ driver adapter", desc: "Returns the Prisma driver adapter to pass as `new PrismaClient({ adapter })`. Lazily constructs it from the options." },
    { name: "setClient(client)", type: "(client) => void", desc: "Hand the constructed PrismaClient back to the adapter so connect / health / raw calls have a client to use." },
    { name: "getClient()", type: "→ PrismaClient", desc: "Return the configured Prisma client. Throws if setClient() has not been called." },
    { name: "connect() / disconnect()", type: "→ Promise<void>", desc: "Explicit $connect / $disconnect. Prisma auto-connects on first query, so these are optional." },
    { name: "healthCheck()", type: "→ Promise<boolean>", desc: "Lightweight `SELECT 1` probe; true when the connection answers." },
    { name: "getStatus()", type: "→ Promise<DatabaseConnectionStatus>", desc: "Snapshot: { connected, provider, database, host, lastConnected, error }." },
    { name: "executeRaw() / executeRawUnsafe()", type: "(query, ...params) => Promise<T>", desc: "Raw query escape hatches routed through the configured client." }
  ]
}) }}

The adapter does not own the `PrismaClient`. You pass `getDriverAdapter()` to
`new PrismaClient({ adapter })`, then hand the client back with `adapter.setClient(client)`; only then
do `getClient()`, `connect()`, `healthCheck()` and `executeRaw()` work.
[Use a second database](/data-persistence/how-to/use-a-second-database/#connect-an-external-database-by-hand)
shows the full wiring for MySQL and SQL Server.

## Query tracing

`@netscript/database/tracing` sends Prisma query spans to OpenTelemetry. It replaces
`@prisma/instrumentation` and avoids the CJS-heavy `@opentelemetry/instrumentation` dependency, which
breaks Deno bundle and compile. Call `enablePrismaTracing()` **once, before you construct any Prisma
client**; engine spans then go to your OpenTelemetry tracer with the standard W3C `traceparent`.
Queries from a client constructed before the call lose their early spans.

{{ comp.apiTable({
  caption: "@netscript/database/tracing — PrismaTracingConfig + hooks",
  rows: [
    { name: "enablePrismaTracing(config?)", type: "(PrismaTracingConfig) => void", desc: "Register the tracing helper. Call once, before creating any PrismaClient." },
    { name: "config.tracerProvider", type: "PrismaTracingProvider", desc: "Tracer provider to use. Defaults to the globally registered OpenTelemetry provider." },
    { name: "config.ignoreSpanTypes", type: "(string | RegExp)[]", desc: "Span-name patterns to drop (string match or regex). Defaults to []." },
    { name: "disablePrismaTracing()", type: "() => void", desc: "Clear the global tracing helper." },
    { name: "isPrismaTracingEnabled()", type: "() => boolean", desc: "True when a tracing helper is currently registered." },
    { name: "enableInstrumentation()", type: "() => boolean (@netscript/database)", desc: "Convenience toggle from the package root: enables Prisma OTEL instrumentation only when OTEL_DENO=true; returns whether it was enabled." }
  ]
}) }}

{{ comp.tabbedCode({ tabs: [
  {
    label: "Enable tracing",
    lang: "ts",
    code: "// services/orders/src/tracing.ts\nimport { enablePrismaTracing } from '@netscript/database/tracing';\n\n// Call ONCE, before constructing any PrismaClient. Engine spans then dispatch\n// into the globally registered OpenTelemetry tracer with a W3C traceparent.\nenablePrismaTracing({\n  // tracerProvider defaults to the global provider; override only if you manage\n  // your own. ignoreSpanTypes drops noisy internal spans by name or regex.\n  ignoreSpanTypes: ['prisma:client:serialize', /detect_platform/],\n});\n\n// ... now construct the client (see the adapter example below).\nimport { PrismaClient } from '../database/postgres/schema/.generated/client.server.ts';\nconst prisma = new PrismaClient();"
  },
  {
    label: "Root toggle (OTEL_DENO)",
    lang: "ts",
    code: "// Alternatively, gate instrumentation on the OTEL_DENO flag from the package root.\nimport { enableInstrumentation } from '@netscript/database';\n\n// Returns true only when OTEL_DENO=true and wiring succeeded.\nconst tracing = enableInstrumentation();\nconsole.log('prisma tracing on:', tracing);"
  }
] }) }}

## A second database

A second datasource, such as a reporting MySQL instance beside the primary Postgres, is a separate
Prisma schema workspace (for example `database/mysql/schema/`) with its own `generate` output and its
own migrations. It does not merge into the Postgres aggregation; you generate and migrate each
datasource on its own. [Use a second database](/data-persistence/how-to/use-a-second-database/) covers
both ways to add one: scaffolding it with `netscript db add`, or wiring an external database by hand
with `createMysqlAdapter` or `createMssqlAdapter`.

## Endpoints & ports

The database is not an HTTP service. You work with the Aspire resources and the connection-string
variables the workspace resolves:

{{ comp.apiTable({
  caption: "Database surface (provisioned by Aspire)",
  rows: [
    { name: "postgres", type: "Aspire resource", desc: "The Postgres container Aspire provisions from appsettings.json NetScript.Databases.postgres. Watch it go green in the dashboard." },
    { name: "redis", type: "Aspire resource", desc: "Redis cache — the default `--cache-backend`; Redis-compatible — backing KV/queues. A separate concern from Postgres; see KV, queues & cron. (`garnet` and `deno-kv` are alternative backends.)" },
    { name: "the URL Aspire prints", type: "dashboard", desc: "Aspire dashboard (anonymous local access in the generated profile) — confirm the postgres resource is healthy." },
    { name: "POSTGRES_URI / DATABASE_URL", type: "env", desc: "Connection string resolved by prisma.config.ts and normalized to a URL. Set these yourself under --no-aspire." }
  ]
}) }}

## How it compares

Convex replaces the relational engine with its own reactive datastore and a TypeScript-declared
schema. Supabase standardizes on hosted Postgres with a SQL schema. NetScript leaves the engine
choice to you and makes the Prisma schema the contract everything else is generated from.

| | NetScript | Convex | Supabase |
|---|---|---|---|
| Choice of relational engine (Postgres / MySQL / MSSQL / SQLite) | Yes — `--db` at scaffold time | No — Convex is its own datastore | No — Postgres |
| Schema authored in Prisma files | Yes — aggregated per plugin | No — declared in TypeScript | No — SQL migrations |
| Database runs in your own infrastructure by default | Yes — Aspire-provisioned container, or a server you point at | No — Convex Cloud by default (self-hosting available) | No — hosted Postgres by default (self-hosting available) |

If your product wants a managed reactive datastore, those platforms are built for it. If it needs a
specific relational engine, such as an existing MSSQL estate, a Postgres you already operate or a
file-backed SQLite for a desktop app, the driver adapters keep your query code identical across all
of them.

## Next steps

Run the [database migration](/data-persistence/how-to/database-migration/) recipe to bring up
Postgres and apply your first migration.

- [Use a second database](/data-persistence/how-to/use-a-second-database/): add an MSSQL or MySQL
  datasource beside Postgres.
- [Team Workspace tutorial, step 03](/tutorials/workspace/03-workspace-data/): wire workspace data
  through the database from scratch.
- [`@netscript/database` reference](/reference/database/): ports, the postgres/mssql/mysql adapters,
  extensions and tracing.
