---
layout: layouts/base.vto
title: Database & Prisma
templateEngine: [vento, md]
prev: { label: "Durable streams", href: "/capabilities/streams/" }
next: { label: "KV, queues & cron", href: "/capabilities/kv-queues-cron/" }
---

# Database & Prisma

NetScript's persistence layer is **Prisma 7 over Postgres**, generated for the Deno
runtime and provisioned for you by **Aspire**. You don't install Postgres, write a
`docker run`, or hand-craft a connection string: `cd aspire && aspire run` brings up a
Postgres container (and a Garnet cache for KV) before any `netscript db` command, and
the four public commands — `netscript db init`, `generate`, `seed`, and `status` — drive
the schema from there. One primary datasource is shared by the app and every plugin:
each plugin contributes its own `.prisma` models, which are aggregated under
`database/postgres/schema/plugins/<plugin>/` into the same database.

{{ comp callout { type: "important", title: "Aspire is step 2 — before any db command" } }}
Every <code>netscript db</code> command talks to Postgres <strong>through Aspire</strong>.
In the default layout Postgres is a container that <strong>Aspire</strong> provisions, so
<code>cd aspire &amp;&amp; aspire run</code> must be up <strong>before</strong> you run
<code>netscript db init</code>. Run a <code>db</code> command against a stopped AppHost and
it fails with <code>aspire start failed: … Project file does not exist</code>. That is the
dependency, not a bug — bring orchestration up first, then run the db workflow from the
workspace root.
{{ /comp }}

{{ comp callout { type: "tip", title: "Use this when" } }}
Reach for the database layer when you need <strong>durable, relational state</strong> —
records that survive restarts, are queried with a typed client, and are shared across your
service and its plugins. For <em>ephemeral or high-throughput</em> state (counters, locks,
work queues, scheduled triggers) reach for <a href="/capabilities/kv-queues-cron/">KV,
queues &amp; cron</a> instead; the scaffold uses both — Postgres for records, Garnet/KV for
execution state.
{{ /comp }}

## How persistence is wired

The default `--db postgres` scaffold lays down a `database/postgres/` workspace. A few
facts are worth internalizing before you run anything, because they differ from a typical
single-file Prisma setup.

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
    │       └── triggers/triggers.prisma
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
    code: "// database/postgres/schema/schema.prisma\ngenerator client {\n  provider = \"prisma-client\"\n  output   = \"./.generated\"\n  runtime  = \"deno\"\n}\n\ngenerator zod {\n  provider = \"prisma-zod-generator\"\n  output   = \"./.generated/zod\"\n}\n\ndatasource db {\n  provider = \"postgresql\"\n  url      = env(\"POSTGRES_URI\")\n}\n\nmodel ExampleRecord {\n  id        Int      @id @default(autoincrement())\n  name      String\n  summary   String\n  createdAt DateTime @default(now())\n}"
  },
  {
    label: "query.ts",
    lang: "ts",
    code: "// Import the Deno-runtime client generated by `netscript db generate`.\nimport { PrismaClient } from '../database/postgres/schema/.generated/client.ts';\n\nconst prisma = new PrismaClient();\n\n// Insert a record, then read it back — fully typed off the model above.\nconst created = await prisma.exampleRecord.create({\n  data: { name: 'first', summary: 'seeded via Prisma' },\n});\n\nconst recent = await prisma.exampleRecord.findMany({\n  orderBy: { createdAt: 'desc' },\n  take: 10,\n});\n\nconsole.log(created.id, recent.length);"
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

With `aspire run` up (Postgres reachable), run the public `netscript db` commands from the
workspace root in this order. The first three are the create-and-fill cycle; `status`
confirms it landed.

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
    code: "# Show migration / tooling status: which migrations are applied and\n# whether the database is in sync with the schema.\nnetscript db status\n\n# Later, when the schema evolves:\nnetscript db migrate    # create + apply the next migration"
  }
] }) }}

## Endpoints & ports

The database itself isn't an HTTP service you call — it's a Postgres container Aspire
provisions and the generated Prisma client connects to. The relevant surfaces are the
Aspire resources and the connection-string env vars the workspace resolves.

{{ comp.apiTable({
  caption: "Database surface (provisioned by Aspire)",
  rows: [
    { name: "postgres", type: "Aspire resource", desc: "The Postgres container Aspire provisions from appsettings.json NetScript.Databases.postgres. Watch it go green in the dashboard." },
    { name: "garnet", type: "Aspire resource", desc: "Garnet cache backing KV/queues — a separate concern from Postgres; see KV, queues & cron." },
    { name: "http://localhost:18888", type: "dashboard", desc: "Aspire dashboard (token printed by `aspire run`) — confirm the postgres resource is healthy." },
    { name: "POSTGRES_URI / DATABASE_URL", type: "env", desc: "Connection string resolved by prisma.config.ts and normalized to a URL. Set these yourself under --no-aspire." }
  ]
}) }}

{{ comp callout { type: "warning", title: "Production pitfalls" } }}
<ul>
<li><strong>Forgetting Aspire.</strong> The most common failure: running <code>netscript db init</code> with no <code>aspire run</code> up. Start orchestration first, from the <code>aspire/</code> folder.</li>
<li><strong>Wrong directory.</strong> Run <code>aspire run</code> from <code>aspire/</code>, but run the <code>netscript db</code> commands from the workspace <strong>root</strong> (or pass <code>--project-root</code>).</li>
<li><strong>Stale client after a schema change.</strong> Editing a <code>.prisma</code> file without re-running <code>netscript db generate</code> leaves your code typed against the old model.</li>
<li><strong>Docker not running.</strong> Aspire provisions Postgres and Garnet as containers; if Docker/Podman is down the <code>postgres</code> resource never goes green.</li>
</ul>
{{ /comp }}

{{ comp callout { type: "note", title: "MySQL is also supported" } }}
Postgres is the default, but a <strong>MySQL adapter</strong> ships too:
<code>prisma-adapter-mysql</code> wires Prisma to MySQL the same contract-first way. See its
generated surface at <a href="/reference/prisma-adapter-mysql/">prisma-adapter-mysql</a> if
you're targeting MySQL instead of Postgres.
{{ /comp }}

## Where to go next

This hub is intentionally thin — the full generated API lives in the reference. Pick the
lane that matches what you're doing.

{{ comp.featureGrid({ items: [
  {
    title: "Do — Database & migration",
    body: "Task recipe: bring up Postgres with Aspire, then run db init → generate → seed → status, step by step.",
    href: "/how-to/database-migration/",
    icon: "◆"
  },
  {
    title: "Look up — @netscript/database reference",
    body: "The full generated API: schema helpers, the Prisma adapter surface, and the migration tooling.",
    href: "/reference/database/",
    icon: "≡"
  },
  {
    title: "Understand — Orchestration with Aspire",
    body: "Why the AppHost (aspire/apphost.mts) provisions Postgres and Garnet, and how the resource graph fits together.",
    href: "/explanation/aspire/",
    icon: "◎"
  },
  {
    title: "MySQL — prisma-adapter-mysql",
    body: "Targeting MySQL instead of Postgres? The MySQL Prisma adapter surface, generated.",
    href: "/reference/prisma-adapter-mysql/",
    icon: "→"
  }
] }) }}

{{ comp.nextPrev({ prev: { label: "Durable streams", href: "/capabilities/streams/" }, next: { label: "KV, queues & cron", href: "/capabilities/kv-queues-cron/" } }) }}
