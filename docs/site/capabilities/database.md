---
layout: layouts/base.vto
title: Database & Prisma
templateEngine: [vento, md]
prev: { label: "Durable streams", href: "/capabilities/streams/" }
next: { label: "KV, queues & cron", href: "/capabilities/kv-queues-cron/" }
---

# Database & Prisma

NetScript's persistence layer is **Prisma 7 over a driver adapter** (Postgres is the recommended engine,
with MSSQL and MySQL adapters shipped alongside), generated for the Deno runtime and
provisioned for you by **Aspire**. Every plugin contributes its own `.prisma` models, which
are aggregated into a single generated client over one primary datasource.

{{ comp.diagram({
  src: "/assets/diagrams/database-schema-aggregation.svg",
  alt: "Per-plugin .prisma schema files (root ExampleRecord, workers, sagas, triggers, auth) under database/postgres/schema/plugins are aggregated by netscript db generate into a single Deno-runtime Prisma client and matching zod schemas; the client talks to one datasource through a selected driver adapter — postgres, mssql, or mysql.",
  caption: "One generated client, many contributors. Each plugin's .prisma file is aggregated into the same datasource; an adapter (postgres / mssql / mysql) selects the driver underneath."
}) }}

{{ comp callout { type: "important", title: "Aspire is step 2 — before any db command" } }}
Every <code>netscript db</code> command talks to Postgres <strong>through Aspire</strong>.
In the default layout Postgres is a container that <strong>Aspire</strong> provisions, so
<code>cd aspire &amp;&amp; aspire start</code> must be up <strong>before</strong> you run
<code>netscript db init</code>. Run a <code>db</code> command against a stopped AppHost and
it fails with <code>aspire start failed: … Project file does not exist</code>. That is the
dependency, not a bug — bring orchestration up first, then run the db workflow from the
workspace root. See <a href="/explanation/aspire/">Orchestration with Aspire</a> for why.
{{ /comp }}

{{ comp callout { type: "tip", title: "Use this when" } }}
Reach for the database layer when you need <strong>durable, relational state</strong> —
records that survive restarts, are queried with a typed client, and are shared across your
service and its plugins. The engine is polyglot: pick it at scaffold time with
<code>--db</code> — Postgres (the recommended engine; or <code>mysql</code> / <code>mssql</code> /
<code>sqlite</code>). For <em>ephemeral or high-throughput</em> state (counters, locks,
work queues, scheduled triggers) reach for <a href="/capabilities/kv-queues-cron/">KV,
queues &amp; cron</a> instead; the scaffold uses both — Postgres for records, Redis/KV for
execution state. Postgres can <em>also</em> back the work queue itself — see <a
href="/capabilities/kv-queues-cron/">the Postgres queue backend</a> below.
{{ /comp }}

## Learn → / Do →

- **Learn** — the [Team Workspace tutorial, step 03](/tutorials/workspace/03-workspace-data/)
  wires workspace data through the database from scratch.
- **Do** — the [Use a second database](/how-to/use-a-second-database/) recipe adds a second
  adapter-backed datasource (MSSQL or MySQL) beside the primary Postgres.

## How persistence is wired

The scaffold engine is chosen with the `--db` flag —
`netscript init my-app --db postgres|mysql|mssql|sqlite`. Postgres is the recommended
engine (and what every tutorial uses); `mysql`, `mssql`, and `sqlite` are first-class
alternatives. `postgres` / `mysql` / `mssql` provision an Aspire container; `sqlite` is
file-backed with **no** Aspire container resource. The `--db postgres` scaffold
lays down a `database/postgres/` workspace (a different engine lays down
`database/<engine>/`). A few facts are worth internalizing before you run anything, because
they differ from a typical single-file Prisma setup.

```text
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

- **The datasource is driven by `appsettings.json`, not `netscript.config.ts`.** In the
  scaffold, `netscript.config.ts` has `databases: { config: [] }` (empty). The connection
  details live in `appsettings.json` under `NetScript.Databases.postgres` —
  `Engine: "Postgres"`, `Mode: "Container"`, a generated `DatabaseName`, and a persistent
  `DataPath` of `.data/postgres`, with `PrimaryDatabase: "postgres"`. Aspire reads that
  block to provision the container.
- **One datasource, many contributors.** There is a single primary Postgres datasource.
  Each first-party plugin ships its own `database/<plugin>.prisma`, and those models are
  aggregated under `database/postgres/schema/plugins/<plugin>/`. After adding `workers`,
  `sagas`, and `triggers`, their tables (for example `model JobDefinition` from workers)
  join the root `ExampleRecord` model in the same database — one `db init` / `db generate`
  cycle covers the app and its plugins together.
- **The client is generated for Deno.** `schema.prisma` sets `generator client` with
  `runtime = "deno"` and `output = "./.generated"`, plus a `generator zod`
  (prisma-zod-generator) emitting matching zod schemas to `./.generated/zod`. You get a
  type-safe client *and* runtime validation schemas from one generate.

## Headline API: a model and a query

Define models in Prisma schema files, then query them through the generated Deno client.
The root `schema.prisma` ships a single sample model, `ExampleRecord`; plugin schema files
add their own. The tabs below show a model alongside the typed query you'd write against
the generated client.

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

{{ comp callout { type: "note", title: "Generate after every schema change" } }}
The generated client under <code>database/postgres/schema/.generated/</code> is a build
artifact. Edit a <code>.prisma</code> file and your code is still typed against the
<strong>old</strong> shape until you re-run <code>netscript db generate</code>. Generate
after every schema change, and re-run <code>netscript db migrate</code> to create and apply
the matching migration.
{{ /comp }}

## The database workflow

With `aspire start` up (Postgres reachable), run the public `netscript db` commands from the
workspace root in this order. The first three are the create-and-fill cycle; `status`
confirms it landed and `migrate` evolves the schema later.

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
  },
  {
    label: "5 · migrate",
    lang: "bash",
    code: "# Later, when the schema evolves: create + apply the next migration.\n# Edit a .prisma file, then:\nnetscript db migrate --name add_orders\nnetscript db generate    # re-generate the client against the new shape"
  }
] }) }}

## Plugins contribute models

Adding a first-party plugin installs its Prisma models to the *same* datasource — there is no
second database. The aggregated tables land under
`database/postgres/schema/plugins/<plugin>/` and migrate in the same `db init`/`migrate`
cycle as your app.

{{ comp.apiTable({
  caption: "Plugin-contributed Prisma models (same primary datasource)",
  rows: [
    { name: "workers", type: "@netscript/plugin-workers", desc: "Job and schedule definitions (for example JobDefinition) backing the durable background-job runtime." },
    { name: "sagas", type: "@netscript/plugin-sagas", desc: "Durable saga state — saga_runtime_state / saga_runtime_transition / saga_runtime_correlation — when the saga store backend is prisma (vs kv). See Durable sagas." },
    { name: "triggers", type: "@netscript/plugin-triggers", desc: "Trigger definitions and delivery bookkeeping for the inbound webhook/ingest runtime." },
    { name: "auth", type: "@netscript/plugin-auth", desc: "auth.prisma: auth_users / auth_sessions / auth_accounts / auth_verifications — used by the better-auth backend. (kv-oauth stores sessions in KV; WorkOS is stateless.)" }
  ]
}) }}

{{ comp callout { type: "note", title: "auth.prisma is backend-specific" } }}
The <a href="/capabilities/auth/">auth plugin</a> contributes
<code>auth.prisma</code> with <code>auth_users</code>, <code>auth_sessions</code>,
<code>auth_accounts</code>, and <code>auth_verifications</code>. Those tables are the
persistence shape for the <strong>better-auth</strong> backend. The default
<strong>kv-oauth</strong> backend keeps sessions in <strong>KV</strong> and
<strong>WorkOS</strong> is stateless (sealed cookie), so they do not depend on these tables.
Run the auth migration only when you select the better-auth backend via
<code>NETSCRIPT_AUTH_BACKEND</code>.
{{ /comp }}

{{ comp callout { type: "tip", title: "Postgres can also back the work queue" } }}
Persistence is not the only place Postgres shows up. The queue runtime now ships a
<strong>PostgreSQL backend</strong> alongside Deno KV, Redis, and RabbitMQ — a durable,
row-claimed (<code>FOR UPDATE SKIP LOCKED</code>) queue table in the same Postgres you
already provision. It is selectable only via an <strong>explicit</strong>
<code>provider: 'postgres'</code> (auto-discovery never picks it). See
<a href="/capabilities/kv-queues-cron/">KV, queues &amp; cron</a> for
<code>connection.postgres.{url, tableName}</code> and the full backend matrix.
{{ /comp }}

## Adapter selection — postgres, mssql, mysql

Prisma 7 talks to the database through a **driver adapter**. NetScript wraps each driver in
a small `DatabaseAdapter` that gives every backend the same lifecycle surface
(`getDriverAdapter` → `setClient` → `connect`/`disconnect`/`healthCheck`/`getStatus`). The
recommended scaffold is Postgres, but MSSQL and MySQL ship as sub-exports so you can target — or
add — a second engine without changing how your code consumes the client.

The shared options shape comes from `DatabaseConnectionOptions`
(`@netscript/database/ports`): every adapter accepts either a `connectionString` or the
structured `host` / `port` / `database` / `username` / `password` / `ssl` / `poolSize` /
`timeout` parts, plus a few engine-specific extras.

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
    { name: "getClient()", type: "→ PrismaClient", desc: "Return the configured Prisma client. Throws if setClient() has not been called — see the callout below." },
    { name: "connect() / disconnect()", type: "→ Promise<void>", desc: "Explicit $connect / $disconnect. Prisma auto-connects on first query, so these are optional." },
    { name: "healthCheck()", type: "→ Promise<boolean>", desc: "Lightweight `SELECT 1` probe; true when the connection answers." },
    { name: "getStatus()", type: "→ Promise<DatabaseConnectionStatus>", desc: "Snapshot: { connected, provider, database, host, lastConnected, error }." },
    { name: "executeRaw() / executeRawUnsafe()", type: "(query, ...params) => Promise<T>", desc: "Raw query escape hatches routed through the configured client." }
  ]
}) }}

{{ comp callout { type: "important", title: "getClient() needs setClient() first" } }}
The adapter does not own the <code>PrismaClient</code> — you construct it. The flow is
always: build the adapter, call <code>getDriverAdapter()</code>, pass that to
<code>new PrismaClient({ adapter })</code>, then call <code>adapter.setClient(client)</code>.
Only then does <code>adapter.getClient()</code> (and <code>connect</code> /
<code>healthCheck</code> / <code>executeRaw</code>) work — call <code>getClient()</code>
before <code>setClient()</code> and it throws
<code>"… client not initialized. Call setClient() …"</code>.
{{ /comp }}

## Tracing — Prisma OpenTelemetry spans

Prisma query spans are wired through a lightweight tracing helper exported from
`@netscript/database/tracing`. It is a drop-in for `@prisma/instrumentation` that avoids the
CJS-heavy `@opentelemetry/instrumentation` dependency (which breaks Deno bundle/compile).
Call `enablePrismaTracing()` **once, before you construct any Prisma client**, and engine
spans dispatch into your OpenTelemetry tracer with the standard W3C `traceparent`.

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

## Runnable example: wiring a second database (MySQL)

The adapters let you stand up a **second** datasource beside the primary Postgres — for
example a reporting MySQL instance — without leaving the typed-client model. The pattern is
the same for every engine: create the adapter, pass `getDriverAdapter()` into a
`PrismaClient`, then `setClient()` so the adapter can manage lifecycle and health. Swap the
import to `adapters/mssql` and `createMssqlAdapter` for SQL Server — the surface is
identical. The MySQL adapter is a sub-export (not in the `adapters` barrel), so import it
from its own path.

{{ comp.tabbedCode({ tabs: [
  {
    label: "MySQL — createMysqlAdapter",
    lang: "ts",
    code: "// services/reporting/src/db.ts\n// MySQL ships as a sub-export — import from /adapters/mysql, not the barrel.\nimport { createMysqlAdapter } from '@netscript/database/adapters/mysql';\nimport { PrismaClient } from '../database/mysql/schema/.generated/client.server.ts';\n\n// 1) Build the adapter from structured parts (or pass { connectionString }).\nconst adapter = createMysqlAdapter({\n  host: Deno.env.get('MYSQL_HOST') ?? 'localhost',\n  port: 3306,\n  database: 'reporting',\n  username: Deno.env.get('MYSQL_USER') ?? 'root',\n  password: Deno.env.get('MYSQL_PASSWORD'),\n  ssl: false,\n});\n\n// 2) Pass the driver adapter into Prisma, then hand the client back.\nexport const reporting = new PrismaClient({ adapter: adapter.getDriverAdapter() });\nadapter.setClient(reporting);\n\n// 3) Now adapter lifecycle + health work off the same client.\nawait adapter.connect();\nconst ok = await adapter.healthCheck(); // SELECT 1\nconsole.log('mysql healthy:', ok, await adapter.getStatus());"
  },
  {
    label: "MSSQL — createMssqlAdapter",
    lang: "ts",
    code: "// services/reporting/src/db.ts — SQL Server variant (same shape)\nimport { createMssqlAdapter } from '@netscript/database/adapters/mssql';\nimport { PrismaClient } from '../database/mssql/schema/.generated/client.server.ts';\n\nconst adapter = createMssqlAdapter({\n  host: Deno.env.get('MSSQL_SERVER') ?? 'localhost',\n  port: 1433,\n  database: 'reporting',\n  username: 'sa',\n  password: Deno.env.get('MSSQL_PASSWORD'),\n  // local-dev TLS knobs; tighten for production\n  encrypt: true,\n  trustServerCertificate: true,\n});\n\nexport const reporting = new PrismaClient({ adapter: adapter.getDriverAdapter() });\nadapter.setClient(reporting);\nawait adapter.connect();"
  },
  {
    label: "Env config helper",
    lang: "ts",
    code: "// Prefer env-driven config? Each engine ships a getter that reads structured\n// vars (MYSQL_HOST/…) and falls back to a connection-string env var.\nimport { createMysqlAdapter } from '@netscript/database/adapters/mysql';\nimport { getMysqlConfig } from '@netscript/database/adapters/mysql';\n\n// getMysqlConfig() → MysqlAdapterConfig from MYSQL_* or MYSQLDB_URI / DATABASE_URL.\nconst cfg = getMysqlConfig();\nconst adapter = createMysqlAdapter({\n  host: cfg.hostname,\n  port: cfg.port,\n  database: cfg.db,\n  username: cfg.username,\n  password: cfg.password,\n});\n// (getMssqlConfig / getPostgres equivalents exist per adapter.)"
  }
] }) }}

{{ comp callout { type: "note", title: "A second datasource is a second schema dir" } }}
A second engine is a separate Prisma schema workspace (for example
<code>database/mysql/schema/</code>) with its own <code>generate</code> output and its own
migrations — it does <em>not</em> merge into the Postgres aggregation above. Generate and
migrate each datasource independently. The full step-by-step lives in the
<a href="/how-to/use-a-second-database/">Use a second database</a> recipe.
{{ /comp }}

## Endpoints & ports

The database itself isn't an HTTP service you call — it's a Postgres container Aspire
provisions and the generated Prisma client connects to. The relevant surfaces are the
Aspire resources and the connection-string env vars the workspace resolves.

{{ comp.apiTable({
  caption: "Database surface (provisioned by Aspire)",
  rows: [
    { name: "postgres", type: "Aspire resource", desc: "The Postgres container Aspire provisions from appsettings.json NetScript.Databases.postgres. Watch it go green in the dashboard." },
    { name: "redis", type: "Aspire resource", desc: "Redis cache — the default `--cache-backend`; Redis-compatible — backing KV/queues. A separate concern from Postgres; see KV, queues & cron. (`garnet` and `deno-kv` are alternative backends.)" },
    { name: "https://localhost:18888", type: "dashboard", desc: "Aspire dashboard (token printed by `aspire start`) — confirm the postgres resource is healthy." },
    { name: "POSTGRES_URI / DATABASE_URL", type: "env", desc: "Connection string resolved by prisma.config.ts and normalized to a URL. Set these yourself under --no-aspire." }
  ]
}) }}

{{ comp callout { type: "warning", title: "Production pitfalls" } }}
<ul>
<li><strong>Forgetting Aspire.</strong> The most common failure: running <code>netscript db init</code> with no <code>aspire start</code> up. Start orchestration first, from the <code>aspire/</code> folder.</li>
<li><strong>Wrong directory.</strong> Run <code>aspire start</code> from <code>aspire/</code>, but run the <code>netscript db</code> commands from the workspace <strong>root</strong> (or pass <code>--project-root</code>).</li>
<li><strong>Stale client after a schema change.</strong> Editing a <code>.prisma</code> file without re-running <code>netscript db generate</code> leaves your code typed against the old model.</li>
<li><strong>Calling getClient() before setClient().</strong> A second-database adapter throws until you hand it the constructed <code>PrismaClient</code> via <code>setClient()</code>.</li>
<li><strong>Tracing wired too late.</strong> <code>enablePrismaTracing()</code> must run <em>before</em> the first <code>PrismaClient</code> is constructed, or early query spans are lost.</li>
<li><strong>Docker not running.</strong> Aspire provisions Postgres and Redis as containers; if Docker/Podman is down the <code>postgres</code> resource never goes green.</li>
</ul>
{{ /comp }}

{{ comp callout { type: "note", title: "MSSQL & MySQL are sub-exports" } }}
Postgres is the recommended engine and lives in the <code>@netscript/database/adapters</code> barrel.
The <strong>SQL Server</strong> and <strong>MySQL</strong> adapters are imported from their
own sub-paths — <code>@netscript/database/adapters/mssql</code> and
<code>@netscript/database/adapters/mysql</code> — so a Postgres-only app never pulls in the
heavier <code>mssql</code> / native-Deno MySQL drivers. The MySQL driver itself lives in the
standalone <a href="/reference/prisma-adapter-mysql/"><code>@netscript/prisma-adapter-mysql</code></a>
package.
{{ /comp }}

## Where to go next

This hub is intentionally thin — the full generated API lives in the reference. Pick the
lane that matches what you're doing.

{{ comp.featureGrid({ items: [
  {
    title: "Learn — Workspace data (Track B 03)",
    body: "Guided tutorial: wire workspace data through Prisma, end to end, in the Team Workspace track.",
    href: "/tutorials/workspace/03-workspace-data/",
    icon: "→"
  },
  {
    title: "Do — Use a second database",
    body: "Task recipe: add an MSSQL or MySQL datasource beside Postgres with a driver adapter.",
    href: "/how-to/use-a-second-database/",
    icon: "◆"
  },
  {
    title: "Do — Database & migration",
    body: "Task recipe: bring up Postgres with Aspire, then run db init → generate → seed → status → migrate.",
    href: "/how-to/database-migration/",
    icon: "◆"
  },
  {
    title: "Look up — @netscript/database reference",
    body: "The full generated API: ports, the postgres/mssql/mysql adapters, extensions, and tracing.",
    href: "/reference/database/",
    icon: "≡"
  },
  {
    title: "Understand — Orchestration with Aspire",
    body: "Why the AppHost (aspire/apphost.mts) provisions Postgres and Redis, and how the resource graph fits together.",
    href: "/explanation/aspire/",
    icon: "◎"
  },
  {
    title: "MySQL — prisma-adapter-mysql",
    body: "The native-Deno MySQL Prisma driver adapter surface, generated.",
    href: "/reference/prisma-adapter-mysql/",
    icon: "→"
  }
] }) }}

{{ comp.nextPrev({ prev: { label: "Durable streams", href: "/capabilities/streams/" }, next: { label: "KV, queues & cron", href: "/capabilities/kv-queues-cron/" } }) }}
