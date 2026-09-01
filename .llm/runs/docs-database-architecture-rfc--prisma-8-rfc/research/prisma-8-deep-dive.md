# Prisma 8 / Prisma Next Deep Dive

## Research pin and confidence model

This audit deliberately separates three upstream states that must not be conflated:

| State             | Pin                                                                                                              | Why it matters                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Announced release | [`v8.0.0-rc.1`](https://github.com/prisma/prisma/releases/tag/v8.0.0-rc.1), published 2026-08-07                 | The version named by the NetScript RFC request.                                   |
| RC source         | [`a76a6c5`](https://github.com/prisma/prisma/tree/a76a6c5ad627ceaf1d78e874757cb2ca43e93ff5)                      | Reproducible basis for package, runtime, migration, skill, and scorecard claims.  |
| Upstream main     | [`71e2e0d`](https://github.com/prisma/prisma/tree/71e2e0d9ee1f306b5a11435cd1973023cb33866a), observed 2026-08-13 | Six days of post-RC changes that reveal which integration seams are still moving. |

Prisma calls this release Early Access and explicitly does not recommend it for production
workloads. The RC source requires Node.js 24+, declares TypeScript 5.9 as an optional package peer
floor, and describes PostgreSQL as the sole database intended for 8.0 GA. MongoDB remains Early
Access, SQLite is a proof of concept, MySQL follows later, and SQL Server is not present in the
Prisma 8 target set.

The analysis below uses this confidence vocabulary:

- **implemented**: an observable public or source-level implementation exists;
- **proven**: Prisma's RC scorecard cites a real-database integration test;
- **untested**: reachable through a public surface but not proven by the scorecard's
  integration-test standard;
- **absent**: the RC scorecard explicitly says the capability is not in 8.0;
- **moving**: the relevant surface changed on `main` after the RC tag;
- **NetScript gate**: NetScript must prove the behavior independently before adopting it.

## Executive conclusion

Prisma 8 is not Prisma 7 with a new client generator. It is a TypeScript database framework built
around a canonical data contract, composable family/target/adapter/driver/extension descriptors,
structured query and migration plans, and separate control and execution planes. The generated
executable `PrismaClient` disappears. The durable emitted artifacts are a canonical `contract.json`
and a type declaration; a small runtime facade consumes the contract.

That direction directly attacks several NetScript pain points:

- generated executable client source can disappear;
- source-rewriting and Zod repair passes can disappear;
- schema ownership can be modeled rather than inferred from copied files;
- migrations can be planned and verified through a programmatic API;
- structured results and errors can replace log scraping; and
- database families, targets, adapters, drivers, and extensions are distinct axes.

It is not yet a safe foundation to expose directly. The RC's public package surface is extremely
wide, its CLI/config distribution changed materially within six days, important runtime and
migration cells remain unproven, the project skill contains stale internal imports and behavioral
contradictions, and the only 8.0 GA target is PostgreSQL. NetScript should therefore adopt the
contract/control/runtime architecture, wrap a deliberately narrow upstream seam, and make release
adoption conditional on a NetScript-owned conformance suite.

## The architecture that actually replaces Prisma 7

The source is arranged as layers rather than as one client package:

```text
authoring source (.prisma or TypeScript DSL)
                    |
                    v
family + target + extension lowering
                    |
                    v
canonical contract.json + contract.d.ts
  domain plane       storage plane       hashes/profile
                    |
          +---------+---------+
          |                   |
          v                   v
   control plane        execution plane
 plan / diff / emit     SQL DSL / ORM / raw
 migrate / verify       middleware / codecs
 introspect / sign      driver / transaction
```

The important decomposition is:

| Axis           | Meaning                                                         | NetScript consequence                                       |
| -------------- | --------------------------------------------------------------- | ----------------------------------------------------------- |
| Family         | Shared semantics, such as SQL versus Mongo                      | Do not use “engine” as the only discriminator.              |
| Target         | Concrete database behavior, such as PostgreSQL                  | Provider capabilities belong to a target descriptor.        |
| Adapter        | Lowers framework operations into target operations              | NetScript must not reimplement this SPI unless certified.   |
| Driver         | Owns wire connectivity and lifecycle                            | Driver choice is distinct from database target.             |
| Extension      | Adds authoring, contract, control, execution, codecs, or schema | Contributions need declared capabilities and compatibility. |
| Contract space | One contributor's owned contract and migration history          | Plugin schema ownership becomes first-class.                |

The framework core composes descriptors into control and execution stacks. Component descriptors
carry family and target identity, and their instances contribute capabilities. The source checks
several duplicate-ownership conditions, such as conflicting codec or authoring constructs, while
capability-value merging itself is last-writer-wins. NetScript must therefore validate contribution
identity and collisions before handing a resolved stack to Prisma; upstream merge order alone is not
a sufficient plugin policy.

### Public packages and coupling risk

The RC publishes facade, framework, family, target, toolchain, and extension packages under
`@prisma/orm-*`. `@prisma/orm-postgres` is described as the one package an application installs, but
its export map contains 138 top-level subpath keys spanning adapters, control internals, contract
internals, migration tooling, query ASTs, runtime, target planning, and utilities. It also depends
on `pg`.

This is useful for extension authors and dangerous for a meta-framework:

- a direct NetScript re-export would turn upstream RC internals into NetScript public API;
- deep imports would make upstream refactors consumer-breaking;
- a duplicate component/engine package can become a runtime correctness problem;
- Node-oriented driver dependencies can silently leak into Deno/browser graphs.

The integration boundary should therefore be one private NetScript package with an allowlist of
upstream imports and a dependency check that fails on every newly introduced deep import.

## Contract-first emission

### What is emitted

Prisma 8 compiles PSL or a TypeScript builder into:

- canonical `contract.json`, used by tooling and runtime;
- `contract.d.ts`, carrying the type-level contract; and
- a very small application facade that imports the two artifacts.

This is the inverse of the Prisma 7 model: executable client implementation is not the generated
artifact. The runtime is a versioned package and the contract is data. The architecture explicitly
calls this “types-only emission.”

Consequences for NetScript:

1. Generated output can be content-addressed and atomically replaced.
2. A clean build can compare a graph digest rather than patch generated TypeScript.
3. Multiple targets can emit independently when their output directories are distinct.
4. Framework validation, docs, agent context, and CI can consume the same canonical graph.
5. Runtime upgrades do not require regenerating an executable client unless the contract format
   itself changes.

### Contract planes and hashes

The unified contract separates domain structure from physical storage structure. Storage is
namespace-aware and uses an open entry-kind dictionary, allowing a target or pack to add target-only
entities. Prisma computes distinct identities for storage, execution, and profile concerns.
Migration identity is storage-based; runtime plans carry the storage hash and, when present, profile
hash.

This separation is valuable, but NetScript must not make raw upstream hash fields its own long-lived
public identifiers. The RC upgrade recipes show contract canonicalization and hash representation
changing across pre-release versions. NetScript should record:

- its own database-graph digest;
- the exact upstream package set and contract format version;
- each target's upstream storage/profile hashes; and
- the resolved contributor provenance.

That lets NetScript explain drift without treating one upstream digest as the identity of the whole
application database graph.

### Authoring modes

Prisma supports PSL and a TypeScript contract builder. Both lower to the same contract model. The
TypeScript route provides immediate `typeof contract` inference; PSL relies on emitted declaration
artifacts and has a language server.

NetScript should not invent a third database model DSL. It should provide a composition DSL for
targets, spaces, policies, routing, capabilities, and lifecycle while allowing the application
contract source to remain Prisma PSL or TypeScript. A NetScript plugin contribution should point at
or construct a contract space; it should not concatenate Prisma syntax.

## Runtime surface

The PostgreSQL facade consumes `contractJson` and returns a contract-typed runtime with:

- `sql`: structured SQL builder;
- `orm`: model-oriented collection API;
- `raw`: escape hatch;
- `enums` and `nativeEnums`;
- `context` and `stack`;
- `connect` / `close`;
- `runtime` for lower-level access;
- `transaction`; and
- `prepare`.

The serverless facade is intentionally asymmetric. It creates an async-disposable runtime per
request and omits closure-cached `orm`, `runtime()`, and `transaction()` surfaces that would be
unsafe in that lifecycle. This is a strong precedent for NetScript: runtime capability types should
reflect deployment mode rather than promising one universal client.

### What NetScript should expose

Application features should not receive the Prisma facade globally. They should receive
consumer-owned ports or an explicitly typed target reference:

```ts
export interface AccountStore {
  findByEmail(email: string): Promise<Account | null>;
  save(account: Account): Promise<void>;
}

export const accountsDatabase = dbRef<'primary', AppDatabaseContract>();
```

The application composition root can bind that reference to the Prisma 8 runtime. A feature that
truly needs the query surface may depend on a NetScript-owned `DatabaseSession<TContract>` view;
most domain code should depend on a narrower feature port. This preserves query power without making
Prisma a framework-wide service locator.

### Lifecycle implications

Prisma separates long-lived, static, and serverless runtime shapes. NetScript must own:

- target resolution;
- connection-source resolution;
- one lifecycle owner per runtime instance;
- request versus process scope;
- graceful close ordering;
- health/readiness semantics;
- transaction/session scoping; and
- observability middleware.

It must not restore the current circular sequence in which a wrapper creates a driver, the user
creates a client, and the client is set back onto the wrapper.

## Programmatic control plane

The RC publishes `createControlClient` from `@prisma/orm-toolchain/cli/control-api`. It accepts
family, target, adapter, optional driver, extensions, and an optional connection. It can initialize
without a live driver for offline work and exposes domain operations for:

- contract verification and emission;
- schema verification;
- database signing;
- `dbInit` and `dbUpdate` in plan/apply modes;
- migration planning/application;
- introspection; and
- lifecycle connect/close.

Progress is modeled as nested start/end spans. Operations return structured results and dotted-code
errors instead of requiring terminal log parsing. The control client intentionally uses `any` at
descriptor variance boundaries; NetScript should type the resolved descriptors before that boundary
and contain the cast inside its integration package.

Current `main` strengthens this seam: migration and database commands were routed through the
control API; output channels and typed next actions became explicit; a ControlClient test double was
added; and command-independent operations were exported. This makes the programmatic seam the
correct integration direction, while simultaneously proving that exact package paths and option
shapes are still moving.

### Operation classification

NetScript should classify operations before invoking Prisma:

| Class           | Examples                                                                   | Required context                                  |
| --------------- | -------------------------------------------------------------------------- | ------------------------------------------------- |
| Pure/offline    | compose graph, validate ownership, emit, format, migration integrity check | Source tree only; never Aspire.                   |
| Live/direct     | inspect, plan against live state, verify, status                           | Target connection; no resident app required.      |
| Mutating/direct | initialize, apply migrations, sign, seed                                   | Target connection, lock, consent policy, receipt. |
| Resident-only   | operations whose connection exists only inside AppHost resource binding    | Aspire session, explicitly selected.              |

The current NetScript rule that routes even generation through a resident AppHost must not survive.

## Migration system

### Graph, refs, marker, and ledger

Prisma 8 models migrations as graph edges between storage hashes rather than only timestamped steps.
Named refs identify graph nodes. Contract snapshots are content-addressed. Each contract space has
its own marker state, and the migration ledger records applied edges. PostgreSQL and SQLite source
and tests implement the ledger; Mongo participates with target-specific atomicity semantics.

For transactional SQL, the edge execution and ledger update are transactionally coupled. Mongo DDL
cannot rely on a multi-document transaction, so it verifies the destination before advancing the
marker and diagnoses partial state.

This is a stronger model than NetScript's current “call the generated task and inspect logs,” but it
is not a distributed transaction system. Applying two different database targets can never be
globally atomic. NetScript needs a run receipt with per-target phases, idempotent resume, and
explicit partial-success reporting.

### Plans and destructive consent

`dbInit` and `dbUpdate` separate plan from apply. Destructive operations require explicit consent,
and structured errors can carry the destructive operation list. Current `main` further distinguishes
findings from execution errors and assigns different exit behavior.

NetScript should add policy above consent:

- an interactive “yes” is never enough in CI;
- production plans need a signed graph digest and environment binding;
- provider capability and transaction behavior must be visible;
- destructive operations need a deterministic policy decision;
- data-loss warnings require data-aware preflight where feasible; and
- apply must reject a plan if the graph, live baseline, package set, or target changed.

### Data migrations

Prisma models data transforms as invariant-guarded transitions. A transform declares a precondition
query that detects remaining work and a mutation plan; the runner verifies the invariant afterward.
The destination identity includes the required invariants. This is a sound foundation for resumable,
auditable data movement.

The authoring experience is not finished. Planner output can leave placeholders in generated
`migration.ts` files that a developer must fill. The upstream multi-extension example still imports
contract/head/migration artifacts manually and uses several `as unknown` casts. NetScript should
preserve the invariant model but generate descriptor wiring, references, and contributor packaging
from its graph.

### Important absent or weak migration capabilities

The RC scorecard marks or reveals gaps that matter to NetScript:

- no mature reset/resolve/diff/execute/squash workflow comparable with Prisma 7;
- no general shadow-database workflow;
- no complete advisory-lock story across targets;
- no row-count-aware data-loss analysis;
- no comprehensive diagnosis for unexecutable changes or unique constraints over dirty data;
- views absent from the 8.0 feature surface;
- raw migration operation coverage unproven;
- PostgreSQL and SQLite `dataTransform` integration coverage unproven;
- many individual destructive PostgreSQL operations unproven; and
- extension removal is unsupported.

NetScript must not paper over these with shell scripts. Every required operation needs either an
upstream-proven capability, a NetScript implementation behind a target adapter, or an explicit
unsupported diagnostic.

## Contract spaces: the key plugin concept

[ADR 212](https://github.com/prisma/prisma/blob/v8.0.0-rc.1/docs/architecture%20docs/adrs/ADR%20212%20-%20Contract%20spaces.md)
defines each contributor as a disjoint tuple:

```text
(contract.json, migration graph, head ref)
```

The application owns one space. Each schema-contributing extension owns another. The consumer repo
contains a pinned mirror of extension artifacts, so production apply/verify does not need to import
`node_modules`. The database marker stores one row per space. The verifier aggregates spaces in
memory and rejects overlapping storage ownership.

This solves the central semantic failure in NetScript's copied-fragment model: schema contribution
is a versioned owner with history, not a file copied into someone else's schema.

### What contract spaces do and do not solve

They provide:

- one owner per storage object;
- independent migration histories;
- pinned consumer-side artifacts;
- per-space plan/run/verify;
- cross-space foreign-key declarations;
- extension-controlled schema versus app-controlled schema; and
- a basis for dependency ordering and removal diagnostics.

They do not provide:

- one merged on-disk contract;
- cross-database atomicity;
- transparent cross-database relations;
- runtime traversal across spaces as a complete ORM feature;
- extension removal/data-retention policy;
- automatic author descriptor packaging;
- a NetScript target-selection policy; or
- stable compatibility across arbitrary extension/core versions.

The RC ADR text also contains stale layout and command statements relative to later source. Source
implements topological extension dependency ordering even where older ADR prose says dependency
ordering is deferred. NetScript's design must pin behavior to tests and package versions, not copy
upstream prose as an executable contract.

### External ownership and drift

Issue [#29896](https://github.com/prisma/prisma/issues/29896) shows a hosted Supabase database
failing `db verify` because a pinned extension contract and externally evolving tables diverged. The
workaround was effectively marker-only. This is not an edge case for NetScript plugins; it is the
normal shape of managed services.

NetScript contributions therefore need an ownership policy:

- `managed`: NetScript may plan and apply the object;
- `adopted`: NetScript verifies selected properties and can establish a baseline;
- `external`: another system owns lifecycle; NetScript records capabilities and allowed drift;
- `ignored`: deliberately excluded with an auditable reason.

That policy belongs on each contract space or owned object set and must influence diff, plan,
verification, removal, and agent instructions.

## Multiple schemas, databases, and engines

Prisma's contract is namespace-aware, and the PostgreSQL runtime proves multi-namespace access.
Cross-space foreign keys can target another contributor's table in the same physical database.

A Prisma config/control stack still describes one target and connection. Multiple independent
databases require a framework-level graph above Prisma. NetScript must model at least:

```text
database graph
  target id
    family
    provider target
    driver/runtime mode
    connection/provisioning source
    namespaces
    contract spaces
    migration root
    dependencies
    operational policy
```

Target identity must be a stable user-defined key, not the engine name. `primary` and `analytics`
must be distinct even when both are PostgreSQL. Their output, migration history, runtime binding,
health, and operation receipts must never collide.

The graph must be open to multiple adapters, but capability-driven rather than lowest-common-
denominator. PostgreSQL can expose RLS/native enums/vector operations; SQLite or a future SQL Server
adapter can expose different capabilities. Code requiring a capability should fail at composition or
type-check time, not at a late database call.

## Validation and generated types

The pinned RC source supports a qualified runtime-interpreter design. The emitted contract contains
a bounded runtime value algebra: scalar codec references, value objects, unions, nullability,
`many`, `dict`, and value-set references
(`packages/1-framework/0-foundation/contract/src/domain-types.ts:5-39`). SQL storage adds native
type, codec parameters/references, defaults, nullability, and value sets
(`packages/2-sql/1-core/contract/src/ir/storage-column.ts:15-25`), while model relations and
cross-space coordinates remain explicit (`domain-types.ts:41-75` and
`packages/1-framework/0-foundation/contract/src/cross-reference.ts:5-14`). NetScript can interpret
that bounded algebra directly into `StandardSchemaV1` values without generating validator source.
This is feasibility against `v8.0.0-rc.1`, not evidence of a stable upstream validation API.

Standard Schema is the right NetScript public boundary, but Prisma's existing Standard Schema slot
does not validate model values. `CodecDescriptor.paramsSchema` validates JSON-sourced codec
_parameters_ and exposes TypeScript renderers
(`packages/1-framework/1-core/framework-components/src/shared/codec-descriptor.ts:27-54`). Codec
instances instead define three conversion representations—application runtime, database-driver wire,
and contract/database JSON
(`packages/1-framework/1-core/framework-components/src/shared/codec.ts:16-30,44-51`)—without a value
predicate. NetScript should therefore expose `representation: 'runtime' | 'json'`, reserve driver
wire for adapter internals, and require every built-in or custom codec contributor to provide an
explicit value schema for each supported representation. A codec with conversion functions but no
matching value schema is unsupported; conversion success must not be treated as validation.

The interpreter must remain narrower than Prisma's generated type universe. SQL plans retain the
operation AST, parameters, projection aliases, expressions, and optional codec references
(`packages/2-sql/4-lanes/relational-core/src/plan.ts:19-22` and
`src/ast/types.ts:1480-1505,1510-1538,1892-1910,1984-2002`), but codec metadata is explicitly absent
for computed, subquery, and raw projections (`ast/types.ts:1484-1488`). Mongo plans retain the
command and an optional nested result shape
(`packages/2-mongo-family/4-query/query-ast/src/query-plan.ts:15-20` and
`src/result-shape.ts:1-13`), yet that shape permits `unknown`. Generated SQL field, operation,
codec, and aggregate type maps are phantom/type-only
(`packages/2-sql/1-core/contract/src/types.ts:90-139,207-215`) and are emitted into `contract.d.ts`
(`packages/1-framework/3-tooling/emitter/src/generate-contract-dts.ts:179-221`), not retained as
runtime validation metadata. Direct model fields and fully known selections can be validated;
filters, nested writes, polymorphic narrowing, computed/aggregate/include/raw results, and any
unknown shape require an explicit operation/result contributor or must fail closed.

Contract spaces also remain separate identities. The aggregate exposes app and extension contracts
per space rather than merging them
(`packages/1-framework/3-tooling/migration/src/aggregate/types.ts:32-79,81-123`), and cross-space
domain checks are deferred to aggregate deployment
(`packages/1-framework/0-foundation/contract/src/validate-domain.ts:140-147`). Validator lookup and
cache identity must include `spaceId`, resolve references through an integrity-checked aggregate,
and never flatten equal namespace/model names from different spaces.

No existing section hash is a complete validator cache key. RC hashing separately covers storage,
execution, and capability profile
(`packages/1-framework/0-foundation/contract/src/hashing.ts:74-106`), while domain, roots, and
extensions can change independently. NetScript should digest the canonical full-contract
representation (`contract/src/canonicalization.ts:250-277`) together with schema version, space,
target/family, operation or selection, representation, interpreter ABI, and codec/pack contributor
identities; include execution identity when defaults matter. Unsupported metadata must raise a
deterministic schema-construction error, never silently become `unknown` or pass-through.

Ahead-of-time output remains an optional startup/performance optimization only if conformance tests
prove it is semantically identical to the runtime interpreter for success values, issue paths,
representation handling, unsupported-case failures, and cache invalidation. It must not become a
second hand-maintained model universe or require textual repair.

Post-RC evidence is narrower and must not be read back into the RC: object `71e2e0d` adds
`packages/2-sql/2-authoring/contract-ts/src/data-contract-json-schema.ts:10-15,31-38,68-110`, which
labels generated contract JSON Schema lossy/advisory, keeps ArkType authoritative, and accepts
unknown pack maps generically because a static editor schema cannot know contributed kinds. That
improves validation of `contract.json`; it does not add model-data schemas, codec value predicates,
or universal result-shape metadata.

## Runtime/platform support and Deno

The RC documentation lists Node 24 as primary and Bun 1.2 / Deno 2.0 as best-effort. The PostgreSQL
facade depends on `pg`; serverless documentation requires Node compatibility in Cloudflare and
records a real Hyperdrive cursor limitation. Source imports Node built-ins in relevant paths.

“Deno is listed” is therefore not sufficient for NetScript. Adoption needs:

- Deno import-graph verification;
- Deno compile and runtime tests without undeclared Node globals;
- connection, query, transaction, stream, close, and error mapping tests;
- bundler tests for the supported deployment modes;
- no CLI/toolchain modules in runtime graphs;
- leak detection under repeated start/stop and request lifecycles; and
- one real external PostgreSQL run, not only PGlite or emulation.

## Maturity scorecard

Prisma's RC scorecard is unusually honest and should be used rather than feature-list marketing. Its
integration-test threshold counts a capability as proven only when a Prisma Next test executes
against the corresponding real database test environment and asserts observable behavior.

Across 593 atomic feature rows and 1,779 database cells:

| Verdict                | Cells |
| ---------------------- | ----: |
| Proven                 |   416 |
| Reachable but untested |   488 |
| Experimental           |    12 |
| Absent                 |   244 |
| Not applicable         |   619 |

Per database:

| Target     | Proven | Untested | Experimental | Absent | N/A |
| ---------- | -----: | -------: | -----------: | -----: | --: |
| PostgreSQL |    222 |      136 |            4 |    111 | 120 |
| SQLite     |     85 |      235 |            4 |     98 | 171 |
| MongoDB    |    109 |      117 |            4 |     35 | 328 |

Selected consequences:

- PostgreSQL is the only credible first adoption target, but still requires NetScript conformance.
- SQLite's presence in source is not feature parity.
- MongoDB validates family abstraction, not production equivalence.
- MySQL and SQL Server need different adapters or later upstream targets.
- Open query/result/transaction work after RC means type presence cannot substitute for runtime
  verification.

## Agent surface audit

Prisma 8 treats agent instructions as product surface. `init` installs a version-pinned project
skill and a lock file, and the skill routes by workflow. The direction is excellent: an agent gets
local version-specific commands, structured errors, known gaps, and explicit references.

The RC content is not trustworthy enough to consume directly. Repo-local scans find dozens of legacy
`@internal/...` paths and `PN-*` error-code references, but exact totals vary materially with the
token/root-counting pattern and are not load-bearing evidence. More importantly:

- legacy internal imports and error-code vocabulary remain after the public move to dotted codes;
- one reference says raw SQL is unavailable while runtime source exposes `raw`;
- one reference says prepared statements are not a user surface while runtime source exposes
  `prepare`;
- another debugging reference recommends raw access, contradicting the query reference; and
- migration workflow prose mentions commands or layouts that do not match the RC/current source.

Issue [#29932](https://github.com/prisma/prisma/issues/29932), where a published `orderBy` nulls
type was accepted but ignored at runtime, is a concrete warning: type surface, docs, and execution
must be tested together.

NetScript should generate its agent surface from its machine-readable database graph and command
catalog:

- target/space inventory with capabilities and ownership;
- exact command schemas and structured outputs;
- environment/destructive policy;
- generated import examples that compile;
- known unsupported operations;
- error code and next-action catalog; and
- a conformance test that runs every documented example.

The generated skill is an output of the architecture, not a hand-maintained parallel manual.

## Six days of post-RC churn

Between the RC tag and the 2026-08-13 `main` pin, Prisma landed a long chain of release-candidate
development commits. The following are integration-significant:

| Change                                                                                                       | Evidence                                                                                      | Interpretation                                                     |
| ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Stop publishing the `prisma-next` CLI; use unified `@prisma/cli@next` / `prisma-cli` and a nested ORM config | [`3dc98cb`](https://github.com/prisma/prisma/commit/3dc98cb)                                  | RC binary/config names are not a stable NetScript contract.        |
| Route migration/database commands through control API                                                        | [`d0c8333`](https://github.com/prisma/prisma/commit/d0c8333) and later command-port commits   | Programmatic control is becoming the intended seam.                |
| Add sectioned config diagnostics, config format marker, and ControlClient test double                        | [`15308c6`](https://github.com/prisma/prisma/commit/15308c6)                                  | Config and testing contracts are still formalizing.                |
| Generate contract JSON Schema from ArkType                                                                   | [`92b6ee3`](https://github.com/prisma/prisma/commit/92b6ee3)                                  | Machine validation is improving; pin schema format.                |
| Add packed-import, non-throwing-validator, and tarball-install conformance checks                            | [`c4a5875`](https://github.com/prisma/prisma/commit/c4a5875)                                  | Upstream recognizes publish-surface correctness as a release gate. |
| Lower PostgreSQL floor from 17 to 15                                                                         | [`5d4a4db`](https://github.com/prisma/prisma/commit/5d4a4db)                                  | RC documentation can become stale within days.                     |
| Change aggregate number semantics and add lossless variants                                                  | [`a900bc1`](https://github.com/prisma/prisma/commit/a900bc1)                                  | Result typing/precision is not frozen.                             |
| Make all command output channels explicit                                                                    | [`71e2e0d`](https://github.com/prisma/prisma/commit/71e2e0d9ee1f306b5a11435cd1973023cb33866a) | Structured orchestration is improving but not settled.             |

The RFC should describe desired NetScript semantics and an upstream compatibility window, not freeze
RC package names into public examples.

## Open upstream issue and pull-request ledger

Observed 2026-08-13:

| Item                                                                                                                                                                   | Surface                                                            | NetScript risk/gate                                                           |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| [Issue #29896](https://github.com/prisma/prisma/issues/29896)                                                                                                          | External Supabase contract drift breaks verify                     | Test external/adopted ownership and version-skew policy.                      |
| [Issue #29923](https://github.com/prisma/prisma/issues/29923) / [PR #29944](https://github.com/prisma/prisma/pull/29944)                                               | Introspection schema selector silently ignored                     | Test every selector against a non-default schema; never accept silent ignore. |
| [Issue #29932](https://github.com/prisma/prisma/issues/29932)                                                                                                          | Published null-ordering type ignored by runtime                    | Conformance must cross type, plan, SQL, and result.                           |
| [PR #29997](https://github.com/prisma/prisma/pull/29997)                                                                                                               | Whole-query raw SQL redesign                                       | Treat raw/escape-hatch API as moving.                                         |
| [PR #30009](https://github.com/prisma/prisma/pull/30009)                                                                                                               | Exact CLI-engine peer needed to prevent duplicate engine copies    | Enforce one resolved upstream component set.                                  |
| [PR #30006](https://github.com/prisma/prisma/pull/30006), [#30014](https://github.com/prisma/prisma/pull/30014), [#30015](https://github.com/prisma/prisma/pull/30015) | Prepared statement counts/results/guards and transaction lifecycle | Prepared/transaction behavior needs dedicated acceptance tests.               |
| [PR #29979](https://github.com/prisma/prisma/pull/29979)                                                                                                               | Shared PostgreSQL connection query serialization                   | Test concurrency with externally supplied pools/connections.                  |
| [PR #29956](https://github.com/prisma/prisma/pull/29956)                                                                                                               | Structural pool compatibility                                      | Do not type-promise arbitrary pool implementations before proof.              |

Only items applicable to the Prisma 8 source were used. Prisma 7 engine/client issues were not
silently generalized to the new stack.

## Adopt, wrap, defer, reject

| Upstream idea/surface                        | Decision                        | Reason                                                                                    |
| -------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------- |
| Canonical contract JSON + declaration        | Adopt                           | Eliminates executable client generation and enables one inspectable graph.                |
| Domain/storage separation and hashes         | Adopt behind NetScript manifest | Excellent internal identity; upstream representation may evolve.                          |
| Family/target/adapter/driver/extension split | Adopt conceptually              | Correct open-axis model for multiple engines and runtimes.                                |
| PostgreSQL runtime facade                    | Wrap                            | Powerful but too upstream-specific to become NetScript-wide API.                          |
| Programmatic ControlClient                   | Wrap and pin                    | Correct orchestration seam; package/options still moving.                                 |
| Contract spaces                              | Adopt and extend                | Best basis for plugin ownership; needs NetScript target, policy, removal, and provenance. |
| Migration graph, refs, marker, ledger        | Adopt after conformance         | Stronger than linear scripts; operational gaps remain.                                    |
| Invariant-guarded data transforms            | Adopt                           | Correct semantic model; automate wiring and placeholder detection.                        |
| Structured errors/progress/results           | Adopt and translate             | Enables stable CLI/agent surfaces without log parsing.                                    |
| Project-level agent skill                    | Recreate from NetScript graph   | Direction good; RC content stale and internally coupled.                                  |
| Prisma CLI binary/config surface             | Do not bind                     | Changed immediately after RC.                                                             |
| Public Prisma package re-exports             | Reject                          | Would transfer upstream RC churn into NetScript API.                                      |
| Hand-written low-level driver adapters       | Reject by default               | High correctness/security/lifecycle burden; require certification if unavoidable.         |
| Copied/merged schema fragments               | Reject                          | No ownership, history, policy, or safe removal.                                           |
| Generated-source text patching               | Reject                          | Non-semantic, non-atomic, and upstream-output coupled.                                    |
| Universal lowest-common-denominator DB API   | Reject                          | Hides real capability differences and weakens every provider.                             |
| Prisma 7 compatibility facade                | Reject                          | Owner explicitly requires a clean break.                                                  |

## Required NetScript adoption gates

Prisma 8 can become the PostgreSQL implementation only after all gates pass against a pinned release
candidate or final package set:

1. **Publish integrity**
   - install packed artifacts in a blank Deno/Node fixture;
   - verify every NetScript-used export and peer resolves exactly once;
   - reject internal/deep imports outside the allowlist.
2. **Contract determinism**
   - emit twice from clean checkout and compare bytes/digests;
   - emit multiple targets concurrently into distinct roots;
   - prove atomic replacement and interruption recovery.
3. **Runtime**
   - CRUD, relations, raw, codecs, transactions, prepared statements, streaming/cancellation;
   - connection injection, serverless lifecycle, close/leak behavior;
   - error mapping and sensitive-value redaction.
4. **Control**
   - offline emission never starts Aspire;
   - every plan/apply/verify result is structured;
   - cancellation and progress spans behave deterministically.
5. **Migration**
   - greenfield, existing adoption, drift, destructive refusal, stale-plan refusal;
   - graph branch/ref resolution, ledger/marker atomicity, resume after failure;
   - data-transform invariants and migration locking;
   - non-default namespace and two same-provider target isolation.
6. **Contract spaces**
   - two plugins, dependency order, collisions, cross-space FK;
   - version upgrade, external drift, missing artifact, uninstall/retention refusal;
   - apply/verify with no plugin package installed.
7. **Platform**
   - Deno compile/runtime and dependency graph;
   - supported bundlers/deployment modes;
   - one real PostgreSQL service, not only an emulator.
8. **Docs/agent**
   - all generated examples type-check and run;
   - command/flag/error catalogs match machine output;
   - no internal imports or stale command names.
9. **Upstream maturity**
   - no unresolved blocker in the used surface;
   - NetScript matrix records upstream scorecard status and local proof;
   - an explicit owner signs off each waived upstream gap.

## Architectural implications for the RFC

The database RFC should make the following non-negotiable:

- one NetScript-owned database graph is the composition source of truth;
- Prisma is one target implementation, not the definition of NetScript's database architecture;
- a target ID, not engine name, owns output, connection, migrations, runtime, and receipts;
- contract spaces replace plugin file copying;
- offline work is independent of Aspire;
- generated artifacts are minimal, deterministic, target-scoped, and atomically emitted;
- validation is provider-based and never repaired textually;
- runtime types expose actual capabilities and lifecycle mode;
- consumers own domain ports; database integration is bound at composition roots;
- control operations are programmatic and structured;
- cross-target apply is resumable, never falsely described as atomic;
- agent/docs surfaces derive from the same graph and command schema;
- no Prisma 7 compatibility client, legacy generated module, or runtime shim survives; and
- adoption is gated by NetScript proof, not by an upstream “supported” label.

## Primary source register

- [Prisma 8.0.0 RC1 release](https://github.com/prisma/prisma/releases/tag/v8.0.0-rc.1)
- [RC source tree](https://github.com/prisma/prisma/tree/v8.0.0-rc.1)
- [Root README and support posture](https://github.com/prisma/prisma/blob/v8.0.0-rc.1/README.md)
- [Architecture overview](https://github.com/prisma/prisma/blob/v8.0.0-rc.1/ARCHITECTURE.md)
- [Feature scorecard](https://github.com/prisma/prisma/blob/v8.0.0-rc.1/scorecard.md)
- [Contract spaces ADR](https://github.com/prisma/prisma/blob/v8.0.0-rc.1/docs/architecture%20docs/adrs/ADR%20212%20-%20Contract%20spaces.md)
- [Data migrations ADR](https://github.com/prisma/prisma/blob/v8.0.0-rc.1/docs/architecture%20docs/adrs/ADR%20176%20-%20Data%20migrations%20as%20invariant-guarded%20transitions.md)
- [Public package policy ADR](https://github.com/prisma/prisma/blob/v8.0.0-rc.1/docs/architecture%20docs/adrs/ADR%20242%20-%20Public%20npm%20surface%20-%20single%20%40prisma%20scope%20with%20consolidated%20publish%20packages.md)
- [Programmatic Control API source](https://github.com/prisma/prisma/tree/v8.0.0-rc.1/packages/1-framework/3-tooling/cli/src/control-api)
- [PostgreSQL runtime source](https://github.com/prisma/prisma/blob/v8.0.0-rc.1/packages/3-extensions/postgres/src/runtime/postgres.ts)
- [Serverless PostgreSQL runtime source](https://github.com/prisma/prisma/blob/v8.0.0-rc.1/packages/3-extensions/postgres/src/runtime/postgres-serverless.ts)
- [Prisma 8 project skill](https://github.com/prisma/prisma/tree/v8.0.0-rc.1/skills/prisma-8)
- [Supported versions](https://github.com/prisma/prisma/blob/v8.0.0-rc.1/docs/Supported%20Versions.md)
- [Serverless deployment guide](https://github.com/prisma/prisma/blob/v8.0.0-rc.1/docs/Serverless%20Deployment%20Guide.md)
