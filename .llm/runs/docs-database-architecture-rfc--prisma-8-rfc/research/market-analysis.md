# Database Architecture Market Analysis

## Scope and method

This is not an ORM popularity comparison. NetScript is a meta-framework, so the relevant question is
which products have solved parts of the framework-level problem:

- one coherent developer workflow over database tooling;
- schema ownership across application features and plugins;
- multiple databases, schemas, providers, and deployment modes;
- extensible adapters without forcing every contributor to reimplement framework mechanics;
- deterministic generation and migrations;
- safe, inspectable CI/deployment;
- runtime lifecycle and connection routing; and
- an accurate agent-facing surface.

The comparison uses official product documentation and source repositories observed on 2026-08-13.
It evaluates eleven purposeful comparators:

1. Wasp and RedwoodJS as Prisma-based full-stack frameworks;
2. Payload and Better Auth as plugin-heavy TypeScript products;
3. AdonisJS Lucid as an integrated application-framework database layer;
4. Drizzle, MikroORM, and Kysely as TypeScript data-tooling architectures;
5. Atlas as a database delivery/control-plane product; and
6. Django and Rails as mature app-owned migration and multi-database systems.

No product is a template to copy wholesale. The desired NetScript architecture combines the
strongest ownership, extensibility, lifecycle, and safety ideas while avoiding their manual seams.

## Executive comparison

| Product        | Strongest relevant idea                                                                         | Important limitation for NetScript                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Wasp           | Framework commands and generated auth/app schema create a coherent Prisma happy path            | Still fundamentally one framework-managed Prisma schema/client and provider story.                 |
| RedwoodJS      | Framework-level schema, structural migrations, seeds, and explicit data migrations              | Largely forwards Prisma CLI concepts; data and structural migration ordering remains manual.       |
| Payload        | Thin internal database contract with official Mongo/Drizzle adapters                            | Adapter abstraction serves Payload's CMS model, not arbitrary app/plugin contract ownership.       |
| Better Auth    | Typed plugin schema declarations plus an adapter factory that centralizes mechanics             | Prisma/Drizzle users still generate an ORM schema and manually migrate it.                         |
| AdonisJS Lucid | Named typed connections, lifecycle ownership, programmatic runner, locks, data-migration defer  | ORM/config is framework-specific and plugins do not own independent contract spaces.               |
| Drizzle        | Broad dialect coverage, SQL escape hatches, schema filters, many migration workflows            | Multiple configs and exported schema aggregation remain developer-managed; ownership is implicit.  |
| MikroORM       | Clean core/driver/extension split with broad providers and programmable migration runner        | One ORM instance does not span independent connections; multi-schema fan-out has stateful caveats. |
| Kysely         | Small open dialect/driver/plugin interfaces, zero-dependency cross-runtime query core           | Schema types/codegen and migration authoring are intentionally external/manual.                    |
| Atlas          | Composite schema graph, semantic migration lint, drift, policy, promotion, target-group rollout | Separate product/control plane; application runtime typing and plugin APIs are out of scope.       |
| Django         | Per-app migration graphs with declared dependencies and mature routing                          | Multiple databases are operated one at a time and router mistakes may silently skip migrations.    |
| Rails          | Named DBs, per-DB migration roots, runtime role/shard switching, unmanaged DB flag              | Database ownership is config/folder-based, not a typed plugin contribution protocol.               |

The market does not offer one complete equivalent of the proposed NetScript layer. The opportunity
is real: treat database structure as a composed, typed ownership graph; drive runtime and control
planes from it; and make safety and agent context first-class outputs.

## Comparator deep dives

### Wasp

[Wasp entities](https://wasp.sh/docs/0.20/data-model/entities) are Prisma models in a
`schema.prisma` file. Wasp exposes a framework migration command and a singleton Prisma client
through `wasp/server`. Its [database documentation](https://wasp.sh/docs/data-model/databases)
supports SQLite as the default local route and PostgreSQL for production. Wasp Auth
[combines generated auth entities with the user's schema](https://wasp.sh/docs/auth/entities).

What works:

- the framework owns a simple end-to-end command surface;
- application code imports a framework database service rather than assembling a client;
- auth schema is derived as part of framework composition; and
- a new application gets a low-friction local database.

What remains weak:

- schema combination is a framework special case, not a public ownership protocol;
- plugin dependency/version/removal semantics are not first-class;
- the singleton/runtime shape is not capability- or deployment-mode-specific;
- multi-target identity and independent histories are not central; and
- migration safety remains constrained by the underlying Prisma workflow.

NetScript lesson: preserve “one obvious workflow,” but replace implicit schema merging and singleton
service access with declared contract spaces and scoped target references.

### RedwoodJS

Redwood wraps Prisma migrations and client use through its CLI. Its
[data migration system](https://docs.redwoodjs.com/docs/data-migrations) adds an application-owned
ledger and timestamped TypeScript transforms alongside Prisma's structural migrations. The
[CLI reference](https://docs.redwoodjs.com/docs/cli-commands) separates `migrate dev`,
`migrate deploy`, reset, seed, and data-migrate commands.

What works:

- structural and content changes are recognized as different concerns;
- data migrations are plain application code with an execution ledger;
- CLI integration reduces raw tool invocation; and
- the framework documents environment-specific migration behavior.

What remains weak:

- structural and data migrations are separate sequences the developer must coordinate;
- new-developer replay can run structural drops before a historical data transform, requiring
  defensive code or manual choreography;
- provider switching can require discarding migration history; and
- plugin schema ownership and multi-database composition are not solved.

NetScript lesson: data transforms must be invariant-bound edges in the same plan as schema
transitions, not a second chronological folder whose correctness depends on invocation order.

### Payload

Payload documents a [thin database adapter](https://payloadcms.com/docs/database/overview) over its
internal data structures. Official adapters cover MongoDB/Mongoose and PostgreSQL or SQLite through
Drizzle. Its [migration commands](https://payloadcms.com/docs/database/migrations) share a common
framework surface while adapters implement provider-specific behavior; relational databases use
migration files, while Mongo workflows emphasize data transformations.

What works:

- framework code depends on an internal database contract;
- providers live in separate packages;
- the adapter selects the backing ORM without exposing it as the whole product contract; and
- lifecycle/migration commands remain product-level concepts.

What remains weak:

- the adapter is shaped around Payload collections and CMS operations;
- provider capability differences are not a general application type system;
- schema-contributing third-party packages do not get independent migration ownership by default;
- multiple arbitrary application databases are not the core abstraction.

NetScript lesson: use an internal port and target packages, but do not create a giant generic
repository interface. Keep feature ports consumer-owned and make target capabilities explicit.

### Better Auth

Better Auth's [database model](https://better-auth.com/docs/concepts/database) supports multiple
adapters. Plugins can declare models/fields; the CLI can generate or migrate the required schema.
The [plugin API](https://better-auth.com/docs/beta/concepts/plugins) makes database schema part of a
typed plugin definition. Its
[adapter factory](https://better-auth.com/docs/beta/guides/create-a-db-adapter) centralizes model
and field mapping, ID generation, JSON conversion, joins, and schema configuration so an adapter
author focuses on database operations.

What works:

- plugin-owned database requirements are declarative and typed;
- one factory owns cross-cutting adapter behavior;
- the plugin schema is available to tooling;
- framework migration can be automatic when using the built-in Kysely route; and
- adapter authors do not repeat naming/serialization mechanics.

What remains weak:

- with Prisma or Drizzle, Better Auth generates ORM schema that the user must merge/apply;
- the contribution does not own a full independent migration graph and database marker;
- version upgrade/removal/data-retention policy is not a universal contract-space protocol; and
- application-wide target routing is out of scope.

NetScript lesson: emulate the declaration and adapter-factory ergonomics, but eliminate the
“generate this then manually integrate/migrate it” boundary.

### AdonisJS Lucid

Lucid's [typed database configuration](https://lucid.adonisjs.com/docs/configuration) defines a
default and named connections, supports read replicas, opens connections lazily, and lets the
framework close them during shutdown. Each connection can own migration paths. Its
[migration system](https://lucid.adonisjs.com/docs/migrations) provides TypeScript up/down classes,
a ledger, transactions, advisory locks, dry runs, safe-mode options, rollback constraints, seed
integration, and a programmatic `MigrationRunner`. `defer` supports data work that should run after
schema operations.

What works:

- one framework config names every connection;
- runtime lifecycle belongs to the framework;
- CLI and programmatic runners use the same migration semantics;
- migration locks and transaction behavior are visible;
- connections can have separate migration roots; and
- generated schema types can be refreshed after migrations.

What remains weak:

- connection and migration ownership are configured in application files, not composed from
  versioned plugin spaces;
- the relational/ORM model remains Lucid-specific;
- cross-connection apply is not globally atomic; and
- type regeneration is still an explicit lifecycle step.

NetScript lesson: named connections, lazy lifecycle, one programmatic runner, and explicit lock/dry-
run behavior should all be first-class. NetScript can go further by deriving them from one graph and
making stale artifacts impossible to overlook.

### Drizzle ORM and Drizzle Kit

Drizzle supports
[code-first, database-first, and external migration workflows](https://orm.drizzle.team/docs/migrations).
`drizzle-kit generate` covers PostgreSQL, MySQL, SQLite, Turso, SingleStore, SQL Server, and
CockroachDB, accepts schema files or folders, checks conflicts, and permits custom SQL migrations.
The [schema declaration guide](https://orm.drizzle.team/docs/sql-schema-declaration) allows schema
split across files as long as all declarations are exported. The
[configuration file](https://orm.drizzle.team/docs/drizzle-config-file) offers schema/table/
extension filters and multiple project configs.

What works:

- broad provider/dialect support;
- schema is ordinary TypeScript and can be split by feature;
- generated SQL remains inspectable and editable;
- database-first and code-first teams can use the same toolkit;
- filters can exclude externally managed objects such as PostGIS tables; and
- multiple configs can represent stages or databases.

What remains weak:

- multiple config files are the composition mechanism rather than one typed graph;
- exported declaration aggregation is a developer convention;
- filters express inclusion, not versioned ownership/history;
- extension/plugin migration ordering and removal are not a public framework protocol; and
- generated type/schema lifecycle is user-driven.

NetScript lesson: retain inspectable SQL, broad adapters, and ownership filters, but make target and
space composition explicit and machine-checkable.

### MikroORM

MikroORM's [architecture](https://mikro-orm.io/docs/architecture) separates a database-agnostic core
from provider packages. Official drivers include PostgreSQL, MySQL/MariaDB, SQLite/libSQL, SQL
Server, Oracle, MongoDB, and others. The
[configuration system](https://mikro-orm.io/docs/configuration) registers extensions such as the
migrator, schema generator, entity generator, and seeder without forcing dynamic optional imports.
It supports replicas and attached SQLite databases.

Its [migrator](https://mikro-orm.io/docs/migrations) is both CLI- and programmatically accessible,
supports transaction/all-or-nothing policy, snapshots, blank migrations, status/pending/check,
fresh/seed, rollup, and target ranges. Runtime schema selection can fan one migration set across
tenant schemas, with explicit documented caveats: shared-instance parallel fan-out is unsupported,
the schema state is reset in `finally`, and MSSQL does not support that runtime schema mode.

What works:

- clear core/driver/extension package boundaries;
- broad provider coverage without one monolithic driver;
- extension registration avoids bundler-hostile dynamic loading;
- programmatic operations match CLI operations;
- migration behavior is configurable and observable; and
- provider-specific limitations are documented rather than hidden.

What remains weak:

- one ORM instance does not span independent connections;
- parallel schema fan-out requires separate processes/instances;
- entity/schema ownership is still ORM metadata aggregation, not contributor contract spaces;
- feature packages do not naturally carry independent migration histories.

NetScript lesson: capability documentation and programmatic extension registration are strong
patterns. The graph must instantiate isolated per-target runners and must never share stateful
migration instances across parallel targets.

### Kysely

Kysely presents a small type-safe SQL query core. Its
[`Dialect` interface](https://kysely-org.github.io/kysely-apidoc/interfaces/Dialect.html) creates a
driver, adapter, introspector, and compiler; users can implement their own. Official support covers
PostgreSQL, MySQL, SQL Server, SQLite, and PGlite. The [project overview](https://www.kysely.dev/)
emphasizes zero dependencies, cross-runtime execution, raw SQL escape hatches, and optional
migrations.

The [official `kysely-ctl`](https://github.com/kysely-org/kysely-ctl) is TypeScript-first and
cross-runtime. Its config can accept a dialect or existing Kysely instance and replace migration
providers, migrators, seed providers, and seeders. Kysely's adapter base provides migration-lock
hooks, using native locks where available or a lock table otherwise.

What works:

- narrow, open, composable SPIs;
- query core is decoupled from schema generation;
- adapter authors can extend a base with forward-compatible defaults;
- migrations/providers are independently replaceable;
- Deno/Bun/Node are intentional targets; and
- raw SQL is an honest, typed escape hatch.

What remains weak:

- type generation/introspection belongs to external tools;
- schema source, migration source, and runtime type source can drift;
- migration authoring is intentionally manual;
- plugin schema ownership is not a built-in concept; and
- framework lifecycle/orchestration is left to the caller.

NetScript lesson: keep the SPI small and extensible, but do not inherit the fragmented toolchain.
One graph must tie schema, types, migrations, connections, and agent surface together.

### Atlas

Atlas is the closest comparator for the database control plane rather than runtime ORM. Its
[project configuration](https://atlasgo.io/atlas-schema/projects) includes a `composite_schema` data
source that loads multiple schemas—from SQL, HCL, ORMs, or external sources—into one graph. Order
expresses dependencies, and multiple sources can extend the same database namespace.

Its [CI/CD workflow](https://atlasgo.io/guides/evaluation/ci-cd) develops a desired schema, plans a
migration, runs semantic lint/simulation in review, delivers an approved artifact, and applies it.
Atlas exposes drift detection, schema testing, target groups, staged rollout, audit history, and
machine-readable output. Its
[destructive-change policy](https://atlasgo.io/guides/destructive-change-policy) can remove drops
from a plan, fail them deterministically in CI, and enforce deprecation workflows. The
[agent guidance](https://atlasgo.io/guides/ai-tools) treats migration generation, linting, policy,
and testing as a structured agent workflow.

What works:

- multiple schema sources become one inspectable graph;
- desired state and versioned migration workflows can coexist;
- semantic lint and policy run before apply;
- approved plans can be promoted across environments;
- drift and deployment history are explicit;
- target groups support database-per-tenant rollout; and
- agent behavior is constrained by deterministic policy.

What remains weak:

- runtime query typing/client lifecycle are separate concerns;
- advanced CI/registry/policy features may require a hosted/commercial control plane;
- composite ordering is configuration order unless stronger semantics are layered above it;
- app/plugin packages do not automatically expose a TypeScript contribution factory.

NetScript lesson: copy the plan-review-deliver-apply state machine, policy gates, drift vocabulary,
receipts, and composed graph semantics. Keep the NetScript core local and provider-neutral; an Atlas
adapter can remain an optional future delivery backend.

### Django

Django owns migrations per installed application. Migrations are declarative operation objects,
loaded into a graph, and declare cross-app dependencies. The
[migration operations](https://docs.djangoproject.com/en/5.2/ref/migration-operations/) preserve
historical model state and support custom schema/data operations. The
[migration guide](https://docs.djangoproject.com/en/5.2/topics/migrations/) explains that per-app
execution is best effort because dependencies may require other apps.

Django's [multiple database](https://docs.djangoproject.com/en/5.2/topics/db/multi-db/) model uses
named aliases and ordered routers for reads, writes, relations, and migrations. Commands operate on
one database at a time through `--database`. Cross-database relations are not supported, and the
documentation warns that changing router behavior can create missing tables, extra tables, broken
foreign keys, or silent migration skips.

What works:

- feature/app ownership of migrations is mature;
- dependency graphs compose histories without flattening files;
- historical state allows deterministic migration replay;
- database routing is a first-class policy surface; and
- app removal has an explicit migration/squash/deploy sequence.

What remains weak:

- router ordering and `None` fallthrough can be subtle;
- migration refusal can become a silent skip;
- multi-database commands require repeated explicit invocation;
- cross-database relations cannot be made transparent.

NetScript lesson: adopt per-contributor graphs and explicit dependencies. Reject silent skip:
composition must return a complete target/space decision table, and every omitted operation needs a
reason code.

### Rails Active Record

Rails'
[multiple database guide](https://guides.rubyonrails.org/active_record_multiple_databases.html)
supports named databases, primary/replica roles, horizontal shards, automatic/manual connection
switching, per-database migration directories, and a generator `--database` selector.
`database_tasks: false` explicitly marks an external database whose schema/migrations/seeds Rails
must not manage.

What works:

- external/unmanaged databases are explicit;
- target identity controls migration folders and generators;
- runtime read/write role and shard switching are framework concepts;
- connection classes provide granular binding.

What remains weak:

- ownership is configuration/folder convention rather than a typed graph;
- schema-contributing engines/plugins do not automatically carry isolated migration spaces;
- cross-database associations have caveats; and
- target capability typing is limited.

NetScript lesson: an explicit `managed: false`-style policy is essential. NetScript should
generalize it into managed/adopted/external/ignored ownership and use stable target IDs for every
artifact.

## Cross-market capability matrix

Legend: **strong** means the capability is a primary, documented abstraction; **partial** means it
exists but leaves important manual integration; **none** means it is not a product-level concept.

| Product            | Typed target graph       | Plugin/feature schema owner | Independent migration graph | Multi-DB routing          | Programmatic control  | Semantic CI policy  | Agent surface        |
| ------------------ | ------------------------ | --------------------------- | --------------------------- | ------------------------- | --------------------- | ------------------- | -------------------- |
| Wasp               | Partial                  | Partial                     | None                        | None                      | Partial               | None                | Partial              |
| RedwoodJS          | Partial                  | None                        | Partial (data ledger)       | None                      | Partial               | None                | Partial              |
| Payload            | Partial                  | Partial                     | Partial                     | Partial                   | Partial               | None                | Partial              |
| Better Auth        | Partial                  | Strong declaration          | None                        | Partial                   | Partial               | None                | Partial              |
| Adonis Lucid       | Strong named connections | Partial                     | Per connection              | Strong                    | Strong                | Partial             | Partial              |
| Drizzle            | Partial/multi-config     | Partial file exports        | Per config                  | Partial                   | Strong                | Partial             | Partial              |
| MikroORM           | Strong per instance      | Partial metadata            | Per instance/schema         | Partial                   | Strong                | Partial             | Partial              |
| Kysely             | Open dialect config      | None                        | Replaceable provider        | Caller-owned              | Strong primitives     | None                | None                 |
| Atlas              | Strong control graph     | Strong source composition   | Strong                      | Strong target groups      | Strong                | Strong              | Strong               |
| Django             | Strong aliases/routers   | Strong apps                 | Strong                      | Strong but one-at-a-time  | Strong                | Partial             | Partial              |
| Rails              | Strong named DB/roles    | Partial engines             | Per database                | Strong                    | Strong                | Partial             | Partial              |
| Proposed NetScript | Strong, single graph     | Strong contract spaces      | Strong per space/target     | Strong capability routing | Strong structured API | Strong local policy | Generated from graph |

## Design patterns to import

### 1. One framework graph, not many config files

Adonis, Rails, and Django prove stable named connections are understandable. Atlas proves multiple
schema sources can be composed. NetScript should combine them:

```text
defineDatabaseGraph({
  targets: {
    primary: databaseTarget(...),
    analytics: databaseTarget(...),
  },
  contributions: [
    appDatabase(...),
    auth.database(...),
    billing.database(...),
  ],
});
```

The graph must resolve to a deterministic manifest before runtime or database access.

### 2. Contributor-owned migration spaces

Django's per-app graph and Prisma 8's contract spaces are the strongest ownership models. Each
contributor needs:

- stable ID and version;
- target-selection predicate;
- provider/capability requirements;
- owned contract artifact;
- migration graph and head;
- dependencies;
- data transforms/invariants;
- ownership policy;
- removal/data-retention policy; and
- provenance/signature.

The app consumes pinned mirrors; installation never mutates another contributor's source.

### 3. A factory that owns adapter mechanics

Better Auth and Kysely show how to make extension authors productive: a small factory/base
centralizes naming, lifecycle, serialization, errors, and compatibility. NetScript target authors
should supply only provider-specific capabilities and bindings, then pass a conformance kit.

### 4. Plan is the deployment contract

Atlas's develop/review/deliver/apply model should govern every mutating NetScript database
operation:

```text
compose -> inspect -> plan -> policy/lint/test -> approve -> apply -> verify -> receipt
```

The approved artifact binds graph digest, target, environment, live baseline, operations, package
versions, and expiry. Apply refuses drifted inputs.

### 5. Managed and external ownership are different

Rails' `database_tasks: false`, Drizzle filters, Atlas external sources, and Prisma's Supabase drift
incident all point to the same requirement. NetScript must never treat every visible object as
framework-owned.

### 6. Capability-specific APIs beat false portability

MikroORM and Django document provider differences; Kysely exposes dialect behavior; Prisma separates
families and targets. NetScript should expose common lifecycle/control concepts but capability-gate
provider-specific query and migration features.

### 7. Programmatic core, CLI and agents as projections

Adonis, MikroORM, Kysely, and Atlas expose programmatic runners. NetScript commands should call one
typed operation API. Help, JSON schema, documentation, and agent skills should be generated views of
that operation catalog.

## Anti-patterns to reject

The market analysis reinforces explicit rejection of:

- forwarding an upstream ORM CLI as the NetScript architecture;
- generated schema that still requires a manual merge or second migrate command;
- multiple same-provider databases represented by copied config files and engine folders;
- plugin installation that copies schema into the application;
- silent router/filter/selector skips;
- a universal singleton client;
- “supports multiple databases” that means only repeated manual commands;
- generated code repaired by string replacement;
- data transforms sequenced independently from structural migration state;
- shared stateful migration runners used concurrently;
- database-specific behavior hidden behind an over-broad generic repository; and
- agent instructions maintained separately from the real command/type surface.

## Proposed market position

NetScript can plausibly offer a distinctive database story:

> Declare every database target and schema contributor once. NetScript composes and validates the
> graph, provisions connections, emits only canonical artifacts, binds typed runtime sessions, plans
> and verifies every migration, and gives humans, CI, plugins, and agents the same structured
> view—without copied schemas, patched clients, or hidden manual steps.

That is materially more than a Prisma wrapper. It is a meta-framework control and composition layer
whose first high-fidelity runtime/control adapter is Prisma 8 PostgreSQL.

## Primary source register

- Wasp: [entities](https://wasp.sh/docs/0.20/data-model/entities),
  [databases](https://wasp.sh/docs/data-model/databases),
  [auth entities](https://wasp.sh/docs/auth/entities)
- RedwoodJS: [data migrations](https://docs.redwoodjs.com/docs/data-migrations),
  [CLI commands](https://docs.redwoodjs.com/docs/cli-commands),
  [database seeds](https://docs.redwoodjs.com/docs/database-seeds/)
- Payload: [database adapters](https://payloadcms.com/docs/database/overview),
  [migrations](https://payloadcms.com/docs/database/migrations)
- Better Auth: [database](https://better-auth.com/docs/concepts/database),
  [plugins](https://better-auth.com/docs/beta/concepts/plugins),
  [adapter factory](https://better-auth.com/docs/beta/guides/create-a-db-adapter)
- AdonisJS Lucid: [configuration](https://lucid.adonisjs.com/docs/configuration),
  [migrations](https://lucid.adonisjs.com/docs/migrations)
- Drizzle: [migration workflows](https://orm.drizzle.team/docs/migrations),
  [generate](https://orm.drizzle.team/docs/drizzle-kit-generate),
  [migrate](https://orm.drizzle.team/docs/drizzle-kit-migrate),
  [schema declaration](https://orm.drizzle.team/docs/sql-schema-declaration),
  [configuration](https://orm.drizzle.team/docs/drizzle-config-file)
- MikroORM: [architecture](https://mikro-orm.io/docs/architecture),
  [configuration](https://mikro-orm.io/docs/configuration),
  [multiple schemas](https://mikro-orm.io/docs/multiple-schemas),
  [migrations](https://mikro-orm.io/docs/migrations)
- Kysely: [overview](https://www.kysely.dev/),
  [Dialect SPI](https://kysely-org.github.io/kysely-apidoc/interfaces/Dialect.html),
  [adapter base](https://kysely-org.github.io/kysely-apidoc/classes/DialectAdapterBase.html),
  [official CLI](https://github.com/kysely-org/kysely-ctl)
- Atlas: [project/composite schema](https://atlasgo.io/atlas-schema/projects),
  [CI/CD](https://atlasgo.io/guides/evaluation/ci-cd),
  [destructive policy](https://atlasgo.io/guides/destructive-change-policy),
  [agent workflow](https://atlasgo.io/guides/ai-tools),
  [database-per-tenant control plane](https://atlasgo.io/guides/database-per-tenant/control-plane)
- Django: [migrations](https://docs.djangoproject.com/en/5.2/topics/migrations/),
  [migration operations](https://docs.djangoproject.com/en/5.2/ref/migration-operations/),
  [multiple databases](https://docs.djangoproject.com/en/5.2/topics/db/multi-db/),
  [application removal](https://docs.djangoproject.com/en/5.2/howto/delete-app/)
- Rails: [multiple databases](https://guides.rubyonrails.org/active_record_multiple_databases.html)
