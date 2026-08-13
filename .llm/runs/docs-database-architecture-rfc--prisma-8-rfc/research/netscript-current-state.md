# NetScript Database Current-State Audit

## Scope and baseline

- Repository: `rickylabs/netscript`
- Baseline: `origin/main` at `cd720529333328bcba5e1a308ce7632f4350efdf`
- Audit date: 2026-08-13
- Package dependency baseline: Prisma `7.8.0` in the root catalog/lock; generated workspaces still
  encode `^7.4.2` specifiers.
- Sources: current source and docs, architecture-debt ledger, Git history, GitHub issue/PR evidence,
  and focused `deno doc`/dependency-tool inspection.

This document describes the system that exists. It does not carry forward the compatibility-first
solution from issue [#313](https://github.com/rickylabs/netscript/issues/313).

## Executive finding

NetScript does not currently have one database architecture. It has five partially-overlapping
systems whose identities and ownership rules do not line up:

1. an appsettings/Aspire database-resource model;
2. a fixed CLI engine registry and operation runner;
3. a generated per-engine Prisma workspace and task graph;
4. a runtime adapter wrapper around user-constructed Prisma clients; and
5. an install-time plugin Prisma-fragment copier.

The happy path works only after those systems agree on config keys, engine directory names,
environment variables, generated files, Prisma CLI behavior, adapter packages, and a live Aspire
resource graph. The framework makes that agreement a developer and CI responsibility, then adds
post-generation repair scripts where upstream output does not fit Deno/browser expectations.

The redesign therefore cannot be a Prisma version substitution. The missing foundation is one
NetScript-owned, typed, inspectable database graph from which resource provisioning, schema
composition, client construction, generated imports, migrations, validation artifacts, plugin
contributions, diagnostics, and CI plans are derived.

## Present topology

```text
appsettings.json
  NetScript.PrimaryDatabase
  NetScript.Databases.<configKey>
               |
               +--> Aspire helpers/resources and allocated connection values
               |
               +--> DbWorkspaceResolver
                      configKey -> fixed DbEngine -> database/<engine>/
                                           |
                                           +--> per-engine deno.json tasks
                                           +--> prisma.config.ts
                                           +--> schema/**/*.prisma
                                           +--> migrations/
                                           +--> scripts/*
                                           +--> schema/.generated/*
                                                        |
                                                        +--> generated engine mod.ts
                                                        +--> deep user imports / @database/zod

plugin package database/**/*.prisma
               |
               +--> package/source resolution
               +--> install-time file copy
               +--> regex declaration collision scan
               +--> database/<engine>/schema/plugins/<plugin>/*.prisma
```

There is no canonical graph or manifest joining these views. The effective configuration is spread
across `appsettings.json`, the root workspace list, a generated database `deno.json`,
`prisma.config.ts`, schema files, generated Aspire helpers, generated engine modules, environment
variables, plugin package metadata, and generated output.

## Identity model and its limitations

| Identity            | Current representation                               | Consequence                                                                        |
| ------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Logical target      | `NetScript.Databases.<configKey>`                    | Used for CLI selection and Aspire resource lookup.                                 |
| Primary target      | `NetScript.PrimaryDatabase`                          | Used by Aspire/service wiring, but ignored by `DbWorkspaceResolver.resolveTarget`. |
| Engine              | Closed union: `postgres                              | mysql                                                                              |
| Schema workspace    | `database/<engine>/`                                 | Multiple same-engine targets share one schema, client, migrations, and tasks.      |
| Physical database   | `DatabaseName` plus Aspire resource                  | Coupled to config and provisioning mode.                                           |
| Prisma datasource   | One `datasource db` per generated workspace          | Not a first-class NetScript object.                                                |
| Generated client    | Deep path under `schema/.generated/client.server.ts` | User code can import the wrong target or a stale artifact.                         |
| Plugin schema owner | Installed file path under `schema/plugins/<plugin>`  | Ownership is filesystem-derived, not a versioned contribution contract.            |

Two correctness gaps follow directly from this model:

- `db add postgres --name analytics` creates another config target but still renders and resolves
  `database/postgres/`. It cannot represent two PostgreSQL databases with independent schemas or
  migration histories. The public second-database guide currently claims otherwise.
- With more than one enabled target, omitting `--db` does **not** resolve
  `NetScript.PrimaryDatabase`; `resolveTarget` only defaults when exactly one target exists. This
  conflicts with current documentation that says a bare command targets the primary database.

## Public and generated runtime surfaces

### `@netscript/database`

The root package currently exposes:

- tracing activation (`enableInstrumentation` / tracing subpath);
- generic adapter/status/connection/transaction types;
- the PostgreSQL adapter on the root and adapter barrel;
- MySQL and MSSQL adapters on explicit subpaths;
- JSON field extensions;
- a structurally-cast `withTransaction` helper; and
- connection-string parsers/builders.

The central `DatabaseAdapter<TClient>` port owns client lifecycle, health, status, and raw query
methods. Concrete adapters do not construct the client. The user must:

1. create the NetScript wrapper;
2. ask it for a Prisma driver adapter;
3. construct the schema-generated `PrismaClient` with that driver;
4. pass the client back through `setClient`; and only then
5. call connect, health, status, or raw-query methods.

This is circular assembly. The wrapper is neither a driver adapter nor an owning database factory,
and unsupported Prisma drivers bypass its lifecycle entirely.

### Generated database package

Each engine workspace generates another facade with its own singleton, connection resolution, driver
selection, health query, exported Prisma client symbols, and `DB` type. This duplicates the
published adapter layer rather than composing it. Applications and docs also import generated Prisma
clients by physical path.

The generated package exposes `./zod` from generated output. Root workspace aliases and generated
contract templates depend on precise, hand-maintained generated symbol names. Issues
[#1254](https://github.com/rickylabs/netscript/issues/1254) and
[#1290](https://github.com/rickylabs/netscript/issues/1290) show that changing the barrel target
first hid models and then broke clean scaffolds at type-check and startup time.

### Custom MySQL Prisma adapter

`@netscript/prisma-adapter-mysql` implements Prisma's low-level `SqlDriverAdapter` contracts and
conversion/error/transaction behavior itself. It imports upstream unstable driver-adapter utility
types and `mysql2/promise`; comments still describe an earlier Deno MySQL implementation. This is a
large upstream-coupled maintenance surface, not merely a thin NetScript integration adapter.

## CLI and lifecycle

The CLI exposes fourteen verbs: add, list, remove, init, generate, migrate, seed, status, studio,
introspect, reset, deploy, validate, and resolve.

The operation path is:

1. parse `appsettings.json`;
2. map a closed engine enum to a fixed provider registry;
3. derive workdir as `database/<engine>`;
4. require the resident Aspire AppHost for every shared operation, including pure generation;
5. materialize an operation-request JSON file;
6. explicitly start `netscript-db-<configKey>` inside the resident graph;
7. have that resource invoke a generated `deno task db:<operation>:<engine>`;
8. poll Aspire until terminal, fetch logs, stop the resource, remove the request, and release a
   filesystem lock.

Important behavior:

- `--db all` is sequential and fail-fast; there is no complete per-target result or resumable plan.
- Studio silently executes only the first resolved target.
- Pure `generate` is Aspire-coupled even though the generated workspace task can run without a
  database. `DB-GENERATE-ASPIRE-COUPLING` remains open architecture debt.
- `db add` scaffolds and rewrites config/helpers, but intentionally does not migrate, generate, or
  seed. Users must restart/reload orchestration and run the lifecycle steps themselves.
- The engine registry is a registry in implementation shape only. Its key type is closed, its
  providers contain hard-coded template switches, and operation commands instantiate their own
  default resolver/runner. Third-party database support cannot be contributed as a coherent public
  capability.

## Generation and repair pipeline

A generated engine workspace contains at least:

- `deno.json` with more than twenty database tasks and duplicated Prisma version specifiers;
- `prisma.config.ts` with connection-string normalization;
- a generated engine `mod.ts` with driver/client/tracing/lifecycle code;
- `schema/schema.prisma`;
- a seeded placeholder generated client;
- migrations and seed directories;
- Zod generator config in two locations; and
- clear-placeholder, migrate, generate-Zod, fix-Zod, and patch-client scripts.

The nominal `db:generate` pipeline performs:

1. placeholder removal;
2. Prisma client generation;
3. a second Prisma generation through the Zod wrapper;
4. generated Zod import rewriting;
5. circular-reference rewriting;
6. getter-pattern rewriting;
7. decimal compatibility rewriting;
8. a generated CRUD alias barrel;
9. Prisma client renaming/facade patching; and
10. another outer fix-Zod pass.

The result is non-atomic generated source that NetScript mutates based on upstream textual output.
Users can edit the schema without running the pipeline and continue compiling against stale types.
Multi-database projects multiply this state and expose physical generated paths to consumers.

## Plugin contribution model

Plugins declare schema by shipping plain `database/**/*.prisma` files. During installation the CLI:

- discovers or downloads package fragments;
- chooses one database target (explicit, primary-ish, or first available);
- copies each fragment into the consumer's active schema tree;
- scans top-level `model`, `enum`, `type`, and `view` blocks using a custom regex/balanced-brace
  parser;
- removes byte-normalized identical declarations; and
- rejects same-name declarations with different normalized bodies.

What this model does not express:

- contribution contract or schema version;
- supported providers/capabilities;
- target selection policy beyond install-time flags;
- dependency ordering or contribution dependencies;
- declaration ownership and allowed augmentation;
- migration ownership, rollout, rollback, or data transforms;
- generated validator/client requirements;
- uninstall data policy;
- compatibility with an existing database version;
- deterministic graph digest/provenance; or
- a programmatic contributor test kit.

The filesystem assumption already caused dependency-mode installs to report success while omitting
all plugin tables ([#1014](https://github.com/rickylabs/netscript/issues/1014)). Model-name clashes
then broke authentication installs and required namespacing plus a custom collision guard
([PR #1059](https://github.com/rickylabs/netscript/pull/1059)). The removal path deletes the copied
schema directory; it does not plan or execute a safe database migration.

## Recurrent failure classes

Path-scoped Git history since 2026-06-01 contains 30 `fix*` commits touching the database package,
custom adapter, CLI database kernel/templates, schema writer, or database E2E gate (release commits
excluded from that count). The audited implementation/test/template surface is about 9,175 lines.
The number is descriptive, not a quality metric; the failure history is the stronger evidence.

| Failure class                                                                 | Evidence                                                                                                                                                 | Architectural lesson                                                                                   |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Prisma schema-engine crash/hang on Windows                                    | [PR #98](https://github.com/rickylabs/netscript/pull/98), [PR #145](https://github.com/rickylabs/netscript/pull/145), retry/timeout code in `migrate.ts` | NetScript CI owns upstream subprocess lifecycle and flake classification.                              |
| SQLite facade compiled only against placeholder, failed after real generation | [#173](https://github.com/rickylabs/netscript/issues/173)                                                                                                | Stubs and generated-client contracts can diverge; every capability axis needs generated-project proof. |
| Plugin schema silently absent in dependency installs                          | [#1014](https://github.com/rickylabs/netscript/issues/1014)                                                                                              | Source-layout discovery is not a contribution contract.                                                |
| Plugin/base model collision                                                   | [PR #1059](https://github.com/rickylabs/netscript/pull/1059)                                                                                             | Global Prisma declaration namespace needs explicit ownership and conflict semantics.                   |
| Read-only DB command killed resident AppHost                                  | #1011 / [PR #1088](https://github.com/rickylabs/netscript/pull/1088)                                                                                     | Database operations lacked a stable lifecycle owner.                                                   |
| Ephemeral AppHost leaked and masked the real host                             | [#1196](https://github.com/rickylabs/netscript/issues/1196), [PR #1301](https://github.com/rickylabs/netscript/pull/1301)                                | Fixing lifecycle symptoms without one operation model moved the failure.                               |
| Second AppHost mounted live PGDATA and corrupted it                           | [#1310](https://github.com/rickylabs/netscript/issues/1310), [PR #1311](https://github.com/rickylabs/netscript/pull/1311)                                | Resource reconstruction is unsafe; operations must bind an authoritative graph.                        |
| Stale allocated Postgres endpoint                                             | [#1202](https://github.com/rickylabs/netscript/issues/1202), [PR #1393](https://github.com/rickylabs/netscript/pull/1393)                                | Runtime connection provenance must be inspectable and validated against the live allocation.           |
| Headless migrate returned success without an artifact                         | [#1327](https://github.com/rickylabs/netscript/issues/1327), [PR #1393](https://github.com/rickylabs/netscript/pull/1393)                                | Exit code is insufficient; operations need typed plans and artifact/state postconditions.              |
| Multi-model Zod alias hid symbols, then its repair broke startup              | [#1254](https://github.com/rickylabs/netscript/issues/1254), [#1290](https://github.com/rickylabs/netscript/issues/1290)                                 | Generated symbol paths cannot be the framework contract.                                               |
| Split Zod module instances broke schema interoperability                      | [#1295](https://github.com/rickylabs/netscript/issues/1295)                                                                                              | Validation must use a standards-facing contract and controlled dependency boundary.                    |

The most severe lifecycle bug cost a measured pilot hours, two database resets, and a privileged
host scrub. The final artifact-proof repair in PR #1393 took six serialized `scaffold.runtime`
attempts as successive test-harness assumptions surfaced. This is exactly the CI instability the new
design must structurally retire.

## Architecture-debt alignment

- `packages/database — AP-17` remains open: ports were renamed, but the composition root has never
  been resolved.
- `DB-GENERATE-ASPIRE-COUPLING` remains open and documents the pure-codegen/Aspire mismatch.
- Current doctrine classifies `packages/database` as an A2 integration package needing refactor and
  `packages/prisma-adapter-mysql` as an A2 integration package. The new owner directive supersedes
  the old recommendation to preserve the existing database port unchanged.
- Auth roadmap item R1 independently requires deterministic plugin-aware schema and migration
  generation; this RFC must make that an ordinary contribution, not an auth-specific escape hatch.

## What is worth preserving as evidence, not API compatibility

- Explicit subpaths keep heavy engine dependencies out of unrelated consumers.
- Artifact-first migration verification is correct and should become a general operation contract.
- Resident-resource binding fixed the unsafe duplicate-AppHost model.
- Deterministic provider registries and generated composition roots match doctrine in principle.
- Plugin schema conflicts now fail rather than silently overwrite.
- Engine-specific behavior is real and must remain capability-visible; a lowest-common-denominator
  database API would be a regression.

These are invariants to re-express in the new architecture. They do not justify retaining current
package names, ports, generated paths, task names, or runtime shims.

## Clean-break implications

The RFC design must make the following impossible or mechanically detectable:

1. editing a database definition without refreshing the effective client/validator/schema graph;
2. constructing a driver, client, and lifecycle wrapper in the wrong order;
3. importing a client by its generated filesystem path;
4. running an operation against an implicit or ambiguous target;
5. reporting success without proving planned artifacts and database state;
6. copying an unversioned plugin fragment without capability/conflict/migration analysis;
7. representing two logical databases as one accidental engine directory;
8. adding an engine by editing switches across CLI, templates, Aspire, packages, docs, and CI;
9. requiring Aspire/Docker for pure compilation; and
10. patching upstream generated text as an undocumented permanent compatibility layer.
