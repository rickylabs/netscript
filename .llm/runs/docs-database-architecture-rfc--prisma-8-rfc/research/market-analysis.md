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
It evaluates seventeen purposeful comparators:

1. Wasp and RedwoodJS as Prisma-based full-stack frameworks;
2. Payload and Better Auth as plugin-heavy TypeScript products;
3. AdonisJS Lucid as an integrated application-framework database layer;
4. Drizzle, MikroORM, and Kysely as TypeScript data-tooling architectures;
5. Flyway and Liquibase as mature migration-ledger, locking, repair, and extension systems;
6. Terraform and Pulumi as plan/apply/state/checkpoint and partial-failure prior art;
7. Atlas and Bytebase as database delivery/control-plane products;
8. ZenStack v3 as a TypeScript schema/plugin/runtime-validation comparator; and
9. Django and Rails as mature app-owned migration and multi-database systems.

A focused independent correction audit covers the additional evidence and exact recovery semantics
in more depth in [market-gap-audit.md](./market-gap-audit.md). This document integrates its
decision-relevant conclusions without reproducing the companion report verbatim.

No product is a template to copy wholesale. The desired NetScript architecture combines the
strongest ownership, extensibility, lifecycle, and safety ideas while avoiding their manual seams.

## Executive comparison

| Product        | Strongest relevant idea                                                                        | Important limitation for NetScript                                                                 |
| -------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Wasp           | Framework commands and generated auth/app schema create a coherent Prisma happy path           | Still fundamentally one framework-managed Prisma schema/client and provider story.                 |
| RedwoodJS      | Framework-level schema, structural migrations, seeds, and explicit data migrations             | Largely forwards Prisma CLI concepts; data and structural migration ordering remains manual.       |
| Payload        | Thin internal database contract with official Mongo/Drizzle adapters                           | Adapter abstraction serves Payload's CMS model, not arbitrary app/plugin contract ownership.       |
| Better Auth    | Typed plugin schema declarations plus an adapter factory that centralizes mechanics            | Prisma/Drizzle users still generate an ORM schema and manually migrate it.                         |
| AdonisJS Lucid | Named typed connections, lifecycle ownership, programmatic runner, locks, data-migration defer | ORM/config is framework-specific and plugins do not own independent contract spaces.               |
| Drizzle        | Broad dialect coverage, SQL escape hatches, schema filters, many migration workflows           | Multiple configs and exported schema aggregation remain developer-managed; ownership is implicit.  |
| MikroORM       | Clean core/driver/extension split with broad providers and programmable migration runner       | One ORM instance does not span independent connections; multi-schema fan-out has stateful caveats. |
| Kysely         | Small open dialect/driver/plugin interfaces, zero-dependency cross-runtime query core          | Schema types/codegen and migration authoring are intentionally external/manual.                    |
| Flyway         | Mature history states, checksum validation, database locks, repair, and programmatic runner    | Locations share one history; repair does not clean objects left by failed non-transactional DDL.   |
| Liquibase      | Changeset ledger/lock, preview/rollback, broad changelog and Java extension surfaces           | Path/order-based composition and one shared ledger are not contributor-owned migration spaces.     |
| Terraform      | Explicit config/plan/state/backend split and honest partial-apply recovery semantics           | Mutable state is not a manifest/receipt; apply is non-atomic and saved plans are opaque/sensitive. |
| Pulumi         | Frequent checkpoints and first-class recovery for interrupted, outcome-unknown operations      | Complete planning is weakened by program execution/unknowns; robust backends are a hosted concern. |
| Atlas          | Composite schema, semantic lint, migration planning, and optional registry/control plane       | Composition uses load order; continuous drift, promotion, and fleet history are Cloud services.    |
| Bytebase       | Plan/issue/rollout stages, SQL review, approvals, and per-database task history                | Persistent control plane; current releases removed automatic schema drift detection.               |
| ZenStack v3    | Explicit schema imports, schema/CLI/runtime plugins, and runtime-derived shaped Zod schemas    | One aggregate history; plugins are preview and validation is Zod-specific rather than Standard.    |
| Django         | Per-app migration graphs with declared dependencies and mature routing                         | Multiple databases are operated one at a time and router mistakes may silently skip migrations.    |
| Rails          | Named DBs, per-DB migration roots, runtime role/shard switching, unmanaged DB flag             | Database ownership is config/folder-based, not a typed plugin contribution protocol.               |

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

### Flyway

Flyway's Java API centers on `Flyway.configure().dataSource(...).load()` and programmatic operations
such as `migrate()`. Its
[command surface](https://documentation.red-gate.com/flyway/reference/commands) includes `migrate`,
`info`, `validate`, `repair`, and `baseline`, with undo, dry-run, comparison, and drift features
varying by edition. Recursively scanned
[locations](https://documentation.red-gate.com/flyway/reference/configuration/flyway-namespace/flyway-locations-setting)
feed one migration sequence and one
[schema history table](https://documentation.red-gate.com/flyway/flyway-concepts/migrations/flyway-schema-history-table).
That table records checksums and precise states including failed, missing, future, out-of-order,
outdated, and superseded migrations.

Migration starts under a database lock with a configurable retry count; Native Connectors currently
do not implement that locking. Where the database supports transactional DDL, migrations can run
individually or, with `group=true`, as one pending-migration transaction. PostgreSQL may need a
session-level rather than transactional advisory lock for operations such as
`CREATE INDEX CONCURRENTLY`.
[Repair](https://documentation.red-gate.com/flyway/reference/commands/repair) can remove failed
ledger rows and realign checksums, but user objects left by a failed non-transactional migration
still require manual cleanup.

Flyway also supports Java migrations, callbacks, and custom migration resolvers/executors through
its [Java hooks](https://documentation.red-gate.com/flyway/reference/usage/api-java/api-hooks).
Those are strong execution-extension points, not typed schema ownership: multiple locations still
share one history and do not acquire stable contributor IDs, independent heads, or removal policy.

NetScript lesson: migration state vocabulary, locks, checksum integrity, and structured repair are
mature prior art. NetScript must add contributor/target identity and distinguish `failed`,
`cleanup_required`, and `outcome_unknown`; “repair ledger” must never imply “repair database.”

### Liquibase

Liquibase composes XML, YAML, JSON, or formatted-SQL changelogs. A changeset's durable identity is
`id + author + filepath`;
[`logicalFilePath`](https://docs.liquibase.com/secure/reference-guide-5-1-1/changelog-attributes/logicalfilepath)
stabilizes moves and avoids module collisions. `includeAll` loads recursively in alphabetical order
unless a custom comparator is supplied. These mechanisms support modular files, but not semantic
dependency edges or independent contributor histories.

`DATABASECHANGELOG` stores checksum, order, execution type, contexts, labels, and a deployment ID;
`DATABASECHANGELOGLOCK` serializes updates with a single database row and may require
`release-locks` after an unclean exit.
[`update-sql`](https://docs.liquibase.com/secure/reference-guide-5-2-1/init-update-and-rollback-commands/update-sql)
previews generated SQL but explicitly does not prove correctness or bind a later apply. Changesets
are transactional where possible; with
[`runInTransaction=false`](https://docs.liquibase.com/secure/reference-guide-5-1/changelog-attributes/runintransaction),
a mid-changeset error can leave both schema and ledger inconsistent. Rollback, snapshot, `diff`, and
`diff-changelog` provide explicit recovery and inspection, not a continuously reconciled state
backend.
[Inspection command coverage](https://docs.liquibase.com/secure/reference-guide-5-2-1/database-inspection-change-tracking-and-utility-commands/what-are-database-inspection-commands)
also varies by object and edition.

Liquibase has a broad Java extension model covering databases, changes, changelog formats,
executors, preconditions, snapshots, SQL generators, and resource access. `ServiceLoader` discovers
implementations and priority selects one for the current context. This is powerful but demonstrates
why NetScript contribution resolution should reject ambiguity rather than hold a plugin priority
contest.
[Extension anatomy](https://contribute.liquibase.com/extensions-integrations/extensions-overview/extension-anatomy/)

NetScript lesson: use logical, path-independent space/migration IDs; topologically order declared
dependencies rather than files; treat arbitrary extension code as a pinned supply-chain boundary;
and do not mistake a shared lock/ledger for contributor isolation.

### Terraform

Terraform's most useful analogy is its explicit separation of configuration, saved plan, mutable
state, and state backend. [State](https://developer.hashicorp.com/terraform/language/state) maps
resource addresses to remote object identities and provider metadata. It is not desired
configuration and is not an immutable run receipt. A
[saved plan](https://developer.hashicorp.com/terraform/cli/commands/plan) is an opaque apply input
that can contain the full configuration, values, options, and cleartext sensitive data; a
speculative plan carries no apply intent.

Backends store state and may provide locking, but locking is optional by backend. State uses lineage
and monotonically increasing serials to reduce unsafe manual pushes. On
[apply failure](https://developer.hashicorp.com/terraform/tutorials/cli/apply), Terraform records
completed changes, unlocks, and exits without automatic rollback; the operator fixes the cause and
applies again. `-target` is explicitly exceptional recovery machinery because it may leave changes
and outputs incomplete. `-refresh-only` makes adoption of observed drift reviewable, and also shows
why changing the framework's record of reality must be a deliberate operation.

Provider executables expose schema, validate, configure, read, plan, and apply RPCs over gRPC and
are version/checksum-pinned. Those schemas describe provider/resource configuration and state, not
application query/mutation/result validation.
[Provider RPC lifecycle](https://developer.hashicorp.com/terraform/plugin/framework/internals/rpcs)

NetScript lesson: the resolved manifest is immutable generated configuration, not Terraform state;
the operation receipt is evidence, not an authoritative shadow database; executable plans must be
secret-free, baseline-bound, and revalidated; and routine `--target`-style partial apply should be
rejected. NetScript should not build a remote state backend or generic provider RPC ecosystem.

### Pulumi

`pulumi up` executes a program, observes resource registrations, constructs a goal graph, and
compares it with recorded stack state. Pulumi does not query every provider automatically before
each preview/update; explicit refresh incorporates live drift.
[Saved update plans](https://www.pulumi.com/docs/iac/concepts/update-plans/) remain experimental and
are checked incrementally as the program runs. Unknown outputs, resources created inside `apply`,
and providers configured with unknown values can make preview incomplete, so earlier operations may
run before a plan discrepancy is discovered.

Pulumi writes frequent checkpoints. Pulumi Cloud supplies transactional checkpoint APIs, while DIY
blob backends have locking/history but document weaker recovery from some partial failures.
Interrupted creates can remain `pending` because the engine cannot know whether the provider
finished; recovery requires inspecting the provider and then clearing or importing the object with
`pulumi refresh`.
[Interrupted-update recovery](https://www.pulumi.com/docs/iac/operations/troubleshooting/interrupted-updates/)
Pulumi does not automatically roll back failed updates, and targeted operations may use stale
recorded values for non-targeted dependencies.

Providers combine a separate executable with language SDKs generated from a package schema; native,
Terraform-bridged, parameterized, and dynamic providers are supported. The
[plugin architecture](https://www.pulumi.com/docs/iac/concepts/plugins/) is strong extensibility
prior art, but package schemas generate SDKs rather than Standard Schema-compatible trust-boundary
validators.

NetScript lesson: composition must be pure enough to yield a complete deterministic plan; receipts
need an `outcome_unknown` phase; uncertain operations must be inspected before retry; and hosted
transactional checkpoints, policy, audit, scheduled drift, and KMS are integration concerns rather
than kernel features.

### Atlas

Atlas is the closest comparator for the database control plane rather than runtime ORM. Its
[project configuration](https://atlasgo.io/atlas-schema/projects) includes a `composite_schema` data
source that loads multiple schemas—from SQL, HCL, ORMs, or external sources—into one graph. Order
controls loading for dependencies, and multiple sources can extend the same database namespace. That
is useful composition, but configuration order is weaker than declared semantic dependency edges and
independent contributor histories.

Its [CI/CD workflow](https://atlasgo.io/guides/evaluation/ci-cd) develops a desired schema, plans a
migration, runs semantic lint/simulation in review, delivers an approved artifact, and applies it.
The local CLI/Pro surface provides schema testing, machine-readable output, versioned/declarative
planning, and synchronous pre-apply drift checks. Registry promotion, fleet deployment history,
continuous drift monitoring, notifications, and agent-mediated database access belong to
[Atlas Cloud](https://atlasgo.io/cloud/getting-started) and its
[paid agent](https://atlasgo.io/cloud/agents). Its
[destructive-change policy](https://atlasgo.io/guides/destructive-change-policy) can remove drops
from a plan, fail them deterministically in CI, and enforce deprecation workflows. The
[agent guidance](https://atlasgo.io/guides/ai-tools) treats migration generation, linting, policy,
and testing as a structured agent workflow.

What works:

- multiple schema sources become one inspectable graph;
- desired state and versioned migration workflows can coexist;
- semantic lint and policy run before apply;
- executable migration artifacts can be reviewed before local apply;
- synchronous pre-apply drift can guard deployments; and
- agent behavior is constrained by deterministic policy.

What remains weak:

- runtime query typing/client lifecycle are separate concerns;
- registry/promotion, fleet status, continuous drift, audit history, approvals, and notifications
  require a hosted/commercial control plane;
- composite ordering is configuration order unless stronger semantics are layered above it;
- app/plugin packages do not automatically expose a TypeScript contribution factory.

NetScript lesson: copy the plan-review-deliver-apply state machine, policy gates, drift vocabulary,
and composed graph semantics that can run locally. Do not infer that Atlas Cloud's registry,
continuous monitoring, rollout history, agents, or collaboration layer are cheap local primitives.
An Atlas adapter can remain an optional future delivery backend.

### Bytebase

Bytebase's [Plan](https://docs.bytebase.com/change-database/plan) defines DDL/DML changes for one or
more databases, receives automatic SQL review, becomes an Issue for approval, and then drives a
Rollout. Rollouts contain environment stages and per-database tasks; stages can progress
sequentially while tasks within a stage can run in parallel. SQL review, rollout policy, approvals,
scheduling, task status/logs, explicit skip reasons, and before/after schema history make partial
fleet progress visible.

This is a persistent database control plane even when self-hosted in one container: it owns
workspace metadata, users, roles, issues, schedulers, credentials, policies, and audit history. It
does not provide an application ORM, runtime Standard Schema layer, or typed contributor-owned
migration spaces. A server-side Plan/Issue/Rollout record is not the same as a portable, signed,
offline NetScript plan artifact.

A material current correction is that Bytebase
[removed Schema Drift Detection in 3.14.0](https://docs.bytebase.com/changelog/bytebase-3-14-0),
including its related API fields. Current schema comparison, history, and
[synchronization](https://docs.bytebase.com/change-database/synchronize-schema) must not be scored
as continuous drift monitoring.

NetScript lesson: borrow staged per-target result visibility, SQL policy vocabulary, and explicit
partial success. Keep IAM, approval flows, schedulers, database groups, notifications, permanent
audit storage, and fleet dashboards outside the local kernel; integrate with Bytebase optionally.

### ZenStack v3

ZenStack v3 is no longer Prisma-backed at runtime; it uses a Kysely-based ORM while retaining a
Prisma-superset ZModel language and PrismaClient-compatible query shape.
[Explicit imports](https://zenstack.dev/docs/modeling/multi-file) are type-checked and merged into
one schema AST before downstream tools run. This is clearer than implicit directory merging, but it
still produces one aggregate schema and one migration history rather than contributor-owned spaces.

The preview [plugin model](https://zenstack.dev/docs/modeling/plugin) accepts a built-in provider,
local module, or npm package. Plugins can contribute schema attributes/functions, generation, CLI
behavior, and ORM runtime interception. Schema enablement and runtime installation remain distinct,
so a contribution can be only half-installed unless a higher-level manifest binds both. The current
`zen migrate` commands expose a single schema and migrations path, temporary Prisma schema
mechanics, and manual `resolve --applied`/`--rolled-back` recovery.

The [`@zenstackhq/zod` runtime factory](https://zenstack.dev/docs/utilities/zod) is the strongest
direct comparator to NetScript validation: it derives typed model schemas from the resolved ZenStack
schema and supports `select`, `include`, `omit`, nested relation shaping, and create/update
optionality. It remains Zod 4-specific and does not document a provider-neutral Standard Schema
surface for complete operation arguments, storage/wire representations, or extension codecs.

NetScript lesson: adopt explicit composition, runtime derivation, and selection-aware validator
ergonomics. Add stable contributor identity/history/provenance/removal policy, bind schema and
runtime installation in one record, and keep Standard Schema—not Zod—as the durable public boundary.

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

The earlier broad matrix overstated Atlas's local capabilities and scored an unimplemented NetScript
proposal as already strong. This narrower matrix evaluates the four artifacts at the center of the
RFC: resolved manifest, executable plan, receipt/recovery record, and contributor space, plus the
runtime validation boundary. **Strong** means a current primary capability; **partial** means
materially different or manual; **hosted** means a persistent control plane is required. The
NetScript row is an unimplemented design target, not a market fact.

| Product/pattern       | Resolved desired manifest                    | Apply-bound plan                                    | Durable run evidence / partial recovery                      | Contributor-owned schema + history                           | Runtime selection-aware validation                    | Lock / drift boundary                                         |
| --------------------- | -------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------------------- |
| Flyway                | Partial config + ordered migrations          | None; dry-run is not bound                          | Strong history/repair; manual object cleanup can remain      | None; locations merge into one history                       | None                                                  | JDBC database lock; Native Connector gap; drift edition-gated |
| Liquibase             | Partial root changelog                       | Partial `update-sql` preview                        | Strong ledger/lock/rollback vocabulary                       | Partial module identity, shared ledger                       | None                                                  | Database lock; explicit diff/snapshot, not reconciliation     |
| Terraform CLI         | Strong config graph; mutable state separate  | Strong opaque saved plan                            | Strong mutable state and partial-apply recovery; no rollback | Partial modules/providers, not DB owners                     | None; provider schemas are unrelated                  | Backend-dependent lock; refresh/refresh-only drift            |
| Pulumi OSS            | Partial graph emerges from program execution | Partial/experimental and incrementally enforced     | Strong checkpoints and pending-operation recovery            | Partial packages/components, not DB owners                   | None; package schemas generate SDKs                   | DIY lock; explicit refresh                                    |
| Pulumi Cloud          | Same program graph                           | Partial/experimental                                | Hosted transactional checkpoints, history, and policy        | None for DB schema ownership                                 | None                                                  | Hosted locking and scheduled drift                            |
| Atlas CLI/Pro         | Strong schema graph                          | Partial/strong migration and declarative planning   | Strong migration directory/ledger and local apply evidence   | Partial composite sources; load order, not owned histories   | None                                                  | Pre-apply drift is Pro; local apply semantics                 |
| Atlas Cloud           | Strong registry source of truth              | Strong promotion/registry workflow                  | Hosted deployment history and fleet status                   | Partial source composition                                   | None                                                  | Hosted agents, scheduled drift, notifications                 |
| Bytebase current      | Strong persistent server-side Plan           | Strong Plan → Issue → Rollout, not offline artifact | Strong stage/task history and partial fleet rollout          | None                                                         | None                                                  | Persistent scheduler; automatic drift feature removed         |
| ZenStack v3           | Strong single composed AST                   | None beyond wrapped migration workflow              | Partial migration status/resolve                             | Partial schema/plugin contribution; one history              | Strongest comparator, but Zod-specific and incomplete | No multi-target lock/drift layer                              |
| Prisma 8 RC substrate | Strong contract snapshot per target          | Emerging control plan                               | Stronger graph/marker/ledger substrate                       | Strong spaces; removal/retention conditional                 | No stable public Standard Schema layer                | Adapter/provider dependent                                    |
| Proposed NetScript    | **Design target, not implemented**           | **Design target; live-baseline binding unproven**   | **Design target; unknown/partial/resume paths unproven**     | **Conditional on NetScript policy and upstream conformance** | **Design target; runtime/AOT equivalence unproven**   | **Design target; local per-target only, no hosted monitor**   |

## Design patterns to import

### 1. One resolved manifest, not many config files

Adonis, Rails, and Django prove stable named connections are understandable. Atlas proves multiple
schema sources can be composed. NetScript should combine them:

```text
defineDatabaseManifest({
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

The source manifest must resolve through one pure function to a deterministic, content-addressed
snapshot before runtime or database access. Array position, file path, provider discovery order, and
package-manager traversal must not become semantic dependency edges.

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

### 4. An apply-bound plan is the deployment contract

Atlas's develop/review/deliver/apply model is useful process prior art. Terraform and Pulumi add the
harder recovery lesson: a preview is not an executable plan, and applying a valid plan is not an
atomic transaction. Every mutating NetScript database operation should follow:

```text
compose -> inspect -> plan -> policy/lint/test -> approve -> apply -> verify -> receipt
```

The approved artifact binds the resolved-manifest digest, exact target and contribution spaces,
environment, live-baseline fingerprint, ordered operations, policy result, provider/package lock
digests, and expiry. It excludes secret values and carries only stable references. Apply acquires
the native lock, revalidates every binding, checkpoints irreversible operations, and refuses stale
inputs. A speculative preview may be human-readable, but it must not be accepted as this artifact.

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

## Artifact and control-plane boundary

The RFC should name five artifacts and keep their responsibilities disjoint:

1. **Source manifest:** authored targets, contributions, dependencies, ownership, and policy.
2. **Resolved snapshot:** pure, deterministic, content-addressed composition with provenance.
3. **Executable plan:** an expiring deployment contract bound to one inspected baseline and exact
   provider/package locks.
4. **Upstream ledger or marker:** provider-native migration history and lock evidence; NetScript
   reads it but does not invent a second mutable source of truth.
5. **Operation receipt:** immutable append-only evidence of attempted work, checkpoints,
   verification, and any uncertain or partial outcome.

The local NetScript kernel should own deterministic resolution and digests; overlap and provenance
checks; local policy/lint/test; native lock orchestration; target/space invocation; immutable
receipts and inspect-before-resume; and the runtime Standard Schema validation boundary. It should
not turn the manifest or receipts into Terraform-like mutable state.

Remote state and transactional checkpoints, organization/RBAC systems, approval and issue workflow,
artifact registries and promotion, continuous drift schedulers, fleet dashboards, centralized audit
servers, notifications, agents, and KMS/secrets are optional control-plane concerns. Pulumi Cloud,
Atlas Cloud, and Bytebase show their value, but also the persistent services and operators they
require. The local meta-framework should expose stable integration events and artifact formats for
such systems, not quietly rebuild them.

## Plan-lock consequences

The comparison changes these RFC decisions:

1. The manifest, snapshot, plan, upstream ledger, and receipt are separate types. None is a mutable
   general-purpose state backend.
2. Preview and executable planning are different operations. Only the latter may be approved and
   applied, and it binds manifest digest, target/space set, baseline, ordered operations, policy,
   package/provider locks, environment, and expiry.
3. Apply acquires a provider-native lock and then revalidates the baseline and all plan bindings.
   Lock scope, timeout, owner/nonce, stale-lock inspection, and any force-unlock path are explicit;
   unsupported locking is surfaced as a capability gap.
4. Receipt states include at least `planned`, `locked`, `started`, `applied`, `verified`, `failed`,
   `partial_success`, `skipped`, `cleanup_required`, and `outcome_unknown`. Checkpoint after each
   irreversible operation.
5. After interruption or transport loss, inspect the database and upstream ledger before retrying.
   Never blindly replay an operation whose outcome is unknown.
6. Cross-target execution is a dependency-ordered saga, not an atomic transaction. Report each
   target/space result and do not promise automatic rollback.
7. Selective target/space execution includes dependency closure, records omitted work and reasons,
   and still verifies whole-manifest invariants. Terraform-style targeting is exceptional recovery,
   not the normal deployment model.
8. Drift comparison is ownership-aware: managed, adopted, external, and ignored objects have
   different policies. Adoption is an explicit reviewed operation.
9. Logical IDs, not paths, array order, config order, or provider discovery, define identity and
   dependencies.
10. Plugin contributions carry version, digest, provenance, capabilities, owned space, lifecycle
    phase, and removal policy. Schema-time and runtime halves must install and validate together.
11. Contributor removal and data retention remain conditional until the upstream substrate proves
    the required semantics and NetScript passes conformance tests.
12. Runtime validation binds operation, target, normalized selection, wire representation, codecs,
    cache key, and runtime/AOT equivalence. A Zod adapter is useful, but is not the Standard Schema
    contract itself.
13. Registry, promotion, fleet history, continuous drift, RBAC, approvals, notifications, and
    centralized secrets remain external control-plane integrations unless separately chartered.

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
- treating the source manifest or immutable receipts as a Terraform-style mutable state backend;
- accepting a dry run or speculative preview as an apply-bound plan;
- using targeted partial apply as the routine deployment path;
- deriving dependencies from alphabetical, filesystem, array, or provider-discovery order;
- treating migration-ledger repair as proof that partially created database objects were cleaned up;
- claiming registry, promotion, fleet, continuous drift, audit, approval, or notification features
  without the hosted control plane that implements them;
- assigning a proposed capability a market score of “strong” before implementation and conformance
  evidence;
- database-specific behavior hidden behind an over-broad generic repository; and
- agent instructions maintained separately from the real command/type surface.

## Proposed market position

NetScript can plausibly offer a distinctive database story:

> Declare every database target and schema contributor once. NetScript composes and validates the
> resolved manifest, provisions connections, emits only canonical artifacts, binds typed runtime
> sessions, plans and verifies every migration, and gives humans, CI, plugins, and agents the same
> structured view—without copied schemas, patched clients, or hidden manual steps.

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
- Flyway: [commands](https://documentation.red-gate.com/flyway/reference/commands),
  [locations](https://documentation.red-gate.com/flyway/reference/configuration/flyway-namespace/flyway-locations-setting),
  [schema history](https://documentation.red-gate.com/flyway/flyway-concepts/migrations/flyway-schema-history-table),
  [repair](https://documentation.red-gate.com/flyway/reference/commands/repair),
  [Java hooks](https://documentation.red-gate.com/flyway/reference/usage/api-java/api-hooks)
- Liquibase:
  [logical file identity](https://docs.liquibase.com/secure/reference-guide-5-1-1/changelog-attributes/logicalfilepath),
  [SQL preview](https://docs.liquibase.com/secure/reference-guide-5-2-1/init-update-and-rollback-commands/update-sql),
  [transaction control](https://docs.liquibase.com/secure/reference-guide-5-1/changelog-attributes/runintransaction),
  [inspection](https://docs.liquibase.com/secure/reference-guide-5-2-1/database-inspection-change-tracking-and-utility-commands/what-are-database-inspection-commands),
  [extension anatomy](https://contribute.liquibase.com/extensions-integrations/extensions-overview/extension-anatomy/)
- Terraform: [state](https://developer.hashicorp.com/terraform/language/state),
  [saved/speculative plans](https://developer.hashicorp.com/terraform/cli/commands/plan),
  [apply failure](https://developer.hashicorp.com/terraform/tutorials/cli/apply),
  [provider RPC lifecycle](https://developer.hashicorp.com/terraform/plugin/framework/internals/rpcs)
- Pulumi: [update plans](https://www.pulumi.com/docs/iac/concepts/update-plans/),
  [interrupted updates](https://www.pulumi.com/docs/iac/operations/troubleshooting/interrupted-updates/),
  [plugins](https://www.pulumi.com/docs/iac/concepts/plugins/)
- Atlas: [project/composite schema](https://atlasgo.io/atlas-schema/projects),
  [CI/CD](https://atlasgo.io/guides/evaluation/ci-cd),
  [destructive policy](https://atlasgo.io/guides/destructive-change-policy),
  [agent workflow](https://atlasgo.io/guides/ai-tools),
  [Cloud](https://atlasgo.io/cloud/getting-started), [Cloud agents](https://atlasgo.io/cloud/agents)
- Bytebase: [plans](https://docs.bytebase.com/change-database/plan),
  [schema synchronization](https://docs.bytebase.com/change-database/synchronize-schema),
  [3.14.0 drift-feature removal](https://docs.bytebase.com/changelog/bytebase-3-14-0)
- ZenStack v3: [multi-file schemas](https://zenstack.dev/docs/modeling/multi-file),
  [plugins](https://zenstack.dev/docs/modeling/plugin),
  [selection-aware Zod factory](https://zenstack.dev/docs/utilities/zod)
- Django: [migrations](https://docs.djangoproject.com/en/5.2/topics/migrations/),
  [migration operations](https://docs.djangoproject.com/en/5.2/ref/migration-operations/),
  [multiple databases](https://docs.djangoproject.com/en/5.2/topics/db/multi-db/),
  [application removal](https://docs.djangoproject.com/en/5.2/howto/delete-app/)
- Rails: [multiple databases](https://guides.rubyonrails.org/active_record_multiple_databases.html)
