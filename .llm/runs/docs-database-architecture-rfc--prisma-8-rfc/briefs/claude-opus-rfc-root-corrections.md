# Claude Opus 5 high — root semantic corrections

You are the **single native Claude Code Opus 5 high lead author/editor** for a bounded correction of
NetScript's database architecture RFC. Continue in `/home/codex/repos/netscript-db-rfc`.

Edit only:

```text
rfcs/0000-database-architecture.md
```

Do not edit run bookkeeping, plans, research, reviews, briefs, doctrine, source code, generated
files, or locks. Do not use subagents, another model, browsing, or a new research workflow. Do not
commit or push.

## This brief supersedes the old size gate

This brief supersedes every instruction in `briefs/claude-opus-rfc-disposition-consolidate.md`,
reviews, worklogs, or messages that sets a word-count target, `<=10k` target, required net deletion,
deletion budget, or size-conditioned completion token. **There is no word-count acceptance gate.**
Do not delete unique evidence, API contracts, safety rules, examples, or explanation to reach a
number.

The only editorial criteria are semantic completeness, correctness, clarity, useful detail, and
non-duplication. Remove or combine prose only when it says the same thing without adding precision.
Do not add a book: repair the existing sections locally and keep the current heading structure.

The current worktree RFC is the correction base, not frozen commit `5dfc4e8eb`. At brief creation it
has Git blob `f0b87f19c117d6167ee2a7b2b623aa8aa6e149c7`; verify it before editing and stop rather
than overwrite a different concurrent draft.

## Required reading and invariants

Read completely before editing: `AGENTS.md`, the current RFC, `plan.md`, `research.md`,
`research/layered-dx-api-audit.md`, `research/typescript-schema-orpc-audit.md`,
`research/runtime-validation-source-audit.md`, and the existing Qwen/Grok/root reviews. Use the
pinned RC1 checkout under `.llm/tmp/prisma-v8-rc1` only to confirm exact API spelling already named
below; do not widen research.

Preserve D-01–D-47 except the already-authorized `OWNER-DX-01` refinements to D-07, D-08, and D-36.
Preserve the exact six-package graph, native Prisma schema/query authority, provider-neutral kernel,
PostgreSQL-only first adapter, bounded fail-closed Standard Schema, separate contract spaces,
manifest/plan/ledger/receipt identities, explicit effects and recovery, clean break, and data-safe
adoption. Add no compatibility layer, schema/query mirror DSL, repository facade, provider switch,
global registry, private Prisma import, copied overload, cast workaround, or unsupported claim.

## Required corrections

### 1. Make L1 provider ownership and value flow real

The current L1 imports `definePostgresDatabase` from neutral `@netscript/database`, silently chooses
a PostgreSQL provider, exports no configured provider value, and later claims the composition root
can import/reach that same value. This contradicts all of: the adapter-only provider boundary, the
neutral package's no-provider dependency, the rule that runtime does not consume
`DatabaseDefinition`, and the executable-example promise.

Correct the same-app progression so:

- the application creates **one** configured immutable provider value from
  `@netscript/database-prisma-postgres` and exports/reuses it in L1/L2, runtime, and control;
- the L1 recipe owned by `@netscript/database` is provider-neutral and accepts that value; it
  literally calls L2 and returns the same `DatabaseDefinition`;
- no hidden default, provider lookup, `database.providers` runtime read, or second provider instance
  exists;
- the L1 name does not promise a provider-specific implementation from a neutral package. Choose a
  concise provider-neutral name/signature consistent with `define` semantics; do not add a package;
- L3 receives the manifest, configured provider, connections, and binding—not the definition.

Resolve `fromAspire` ownership at the same time. The actual Aspire `ConnectionSource` adapter and
resource projection belong to `@netscript/aspire`. Either import an Aspire-owned pure reference
constructor from that package, or state and type a neutral data-only reference constructor that has
no Aspire implementation/dependency. Do not let `@netscript/database` smuggle in Aspire IO.

### 2. Register an extension once, early enough for authoring

The current example first builds `appContract` with Prisma's raw pgvector pack, then separately
registers a NetScript `pgvector(...)` bundle after the contract exists. That is two registration
sites; the later value cannot retroactively provide the authoring facet.

Show one configured extension value created before native contract construction and a real two-phase
flow: phase 1 collects and identity/version-checks the provider-owned opaque bundle; phase 2 invokes
the native Prisma model-first builder with its public authoring facet and then fans the same bundle
into control, runtime, and validation. The app never assembles/imports Prisma control or runtime
facets. NetScript may orchestrate `defineContract`; it may not mirror its model/field/
relation/query vocabulary. Keep direct native Prisma authoring as an honest L3 escape hatch and say
precisely whether that escape hatch must pass the same configured bundle's public authoring
projection.

### 3. Correct examples to the pinned RC1 API

- Replace `field.timestamp().defaultNow()` with the pinned RC1 temporal helper actually demonstrated
  by upstream, such as `field.temporal.createdAt()`.
- Replace Prisma-7-shaped lowercase `orm.post.findMany` / `orm.user.create` calls. Current RC1 ORM
  is Pascal-case and fluent: examples use shapes such as
  `db.Post.where(...).select(...).take(...).all()` and `db.User.create(...)`. Keep explicit space
  selection, but let `space('app').orm` expose that native RC1 surface unchanged.
- Cite the pinned example/source beside claims whose spelling is RC1-specific; do not present a
  proposed NetScript wrapper as an observed Prisma API.

### 4. Make mixed source-native and artifact-only binding sound

Keep erased `typeof definition` inference for app-authored contracts. A plugin-owned pinned space is
artifact-only at the consumer and TypeScript cannot infer its exact query type from JSON. Therefore
the target binding must explicitly combine:

- source-native, type-only app contract evidence; and
- an automatically and atomically emitted provider declaration for each artifact-only queried space.

Show the generated **declaration** imported into the hand-written/real adapter binding value, or
omit an artifact-only space from the typed query map. Do not claim `PrimaryQueries` contains `auth`
without showing its declaration evidence. Each space remains a separate contract type and
`ContractSnapshotId`; no merged Prisma contract or generic-record widening is allowed. The runtime
value is constructed by the adapter `/binding` factory from the manifest/provider identities and is
not an ambient `declare const`.

Bound the fallback exactly. Automatic declaration emission is for publish/artifact-only boundaries
proved in W3. Do not incidentally say failure of the direct app fixture makes generation universal.
If direct app inference requires a private import, copied overload, cast, provider type in a neutral
package, or runtime authoring evaluation, record it as a W3 kill/rethink criterion. Runtime still
consumes manifest and pinned artifact values; a declaration is type evidence, never control
authority.

### 5. Make L3 and all example status honest

L3 must be a complete, coherent example of native Prisma `defineContract` plus NetScript
primitives/ports reaching the same compiler, manifest, adapter binding, runtime, and control—not an
L2 definition relabelled “native foundation.” It may be a compact excerpt, but label it as such.

Across every snippet, either bind imports/values (`postgres`, `connections`, `runId`, `policy`,
`AccountStore`, plugin contribution factories, generated declarations) or label the code as a
focused excerpt and name the omitted prior value. Do not claim examples are executable exactly as
written while using ellipses, undeclared symbols, a callable constant, or a value exported only by
another layer. Keep examples useful; do not inflate them with irrelevant scaffolding.

Use “generated declaration” or “generated provider type artifact” for the bounded fallback. Use
“binding” for the real adapter-created runtime value that carries/verifies target, manifest digest,
provider pin, and per-space snapshot ids. The manifest remains the durable runtime/control
authority.

### 6. Demonstrate a valid validation happy path

The contract alone does not contain full create/update operation grammar. Before showing
`users.input('create', ...)`, identify the exact registered operation contributor that makes
`create` supported, where it is registered through the single extension/provider flow, and how its
identity/version participates in manifest/cache identity. Do not invent contract-only parity.
Unsupported operations still fail at schema construction; invalid values still return Standard
Schema issues.

Correct the leakage invariant: **provider-neutral NetScript packages** must never expose Prisma
types. The Prisma adapter's explicitly provider-specific `/binding` declaration necessarily maps
opaque contract evidence to Prisma query/transaction types; do not claim that no published NetScript
declaration anywhere can name Prisma.

### 7. Repair package dependency and compile/effect wording

Keep six packages, but state the actual dependency edges rather than an ambiguous chain.
`@netscript/database` depends on `-contract` and owns definitions plus deterministic resolution.
Runtime and control consume manifest/contract SPIs and must not depend on `@netscript/database` for
definition types they never consume. They do not import each other. The adapter implements the
published runtime/control SPIs; the app supplies it as a value. `@netscript/plugin` publishes plain
contributions without provider/runtime/control dependencies. Testkit is never a runtime dependency.

Reserve mathematically **pure/deterministic** for in-memory resolution of a definition plus supplied
snapshots. Loading source artifacts and atomically publishing emitted artifacts are offline effects;
they may be classified `pure` in the operation catalog only if the RFC explicitly defines that class
as “no live database/network/connection,” not side-effect-free. `compileDatabase` must not be called
both pure/total and an implicit IO loader. Preserve the structural rule that live control never
receives a definition.

### 8. Complete rollup and plugin artifact semantics

Make space → target → run rollup a total deterministic function over every terminal status,
including `skipped` and the all-success case. Preserve: target success requires all selected spaces;
unknown/cleanup dominate; mixed space outcomes do not make a target partially successful; run-level
`partial-success` requires at least one successful target and another non-success target; when none
succeeds, use the closed non-success precedence. Do not add another diagram.

Replace the plugin example's contract-JSON-only `pinnedArtifact(...)` with one coherent pinned-space
aggregate containing descriptor snapshot, canonical contract data **and declaration**, migration
lineage/graph, head, hashes, and provenance. Make the exported symbol's call/value shape consistent
with L1/L2 use. Production package-free apply consumes this aggregate; query typing uses its
automatically emitted consumer declaration without merging spaces.

### 9. Tell the truth about marker mutation and rollback

Marker-only adoption performs provider-metadata DML. Replace “zero table or data DDL/DML” with the
precise guarantee: no application-schema DDL and no application/user-data DML; only idempotent,
receipt-backed provider marker/ledger metadata writes occur. Use the same wording in summary,
adoption table, and safety claims.

If marker removal is not certified safe during pre-apply rollback, do not leave the space actively
`adopted`. Preserve the marker and transition it to the retained, verify-only lifecycle/tombstone
state: no runtime binding, plan, or apply until explicit re-adoption. Keep post-first-apply recovery
forward-only.

### 10. Add exact pinned source links

Keep RC1 facts separate from post-RC facts. Add direct pinned GitHub source links—not only local
checkout paths—for the load-bearing current builder, temporal helper/example, phantom runtime
contract overload, fluent Pascal-case ORM example, separate-space aggregate, namespace type-map, and
bounded-validation claims. Reuse existing deep-dive links where they resolve exactly; do not link a
moving branch or marketing page for a source-level claim.

## Completion standard and checks

Read the full result once after editing. Confirm that the guide and reference sections add different
value; remove only genuine repetition. Confirm the same configured provider and extension values
flow through all three adoption layers, runtime, and control. Confirm there is no hidden provider,
second registration, merged contract, arbitrary production TypeScript evaluation, manual emit/type
generation ritual, or compatibility path.

Run:

```bash
deno fmt rfcs/0000-database-architecture.md
deno fmt --check rfcs/0000-database-architecture.md
deno task docs:links
git diff --check -- rfcs/0000-database-architecture.md
git status --short
```

Also inspect the scoped diff and search for the superseded invalid shapes: `defaultNow`, lowercase
Prisma-7 `findMany`, an implicit `definePostgresDatabase` provider, contract-JSON-only plugin
artifact, universal-generation fallback, “zero ... DDL/DML” wording that ignores marker DML, and
provider-neutral Prisma leakage. Do not run or report a word-count gate.

Return a concise handoff with: native route/session receipt; one disposition row per numbered
correction above; exact RFC sections/lines; confirmation that only the RFC changed; check commands
and exit status; and genuine residual W3/W4/W5/W10/upstream risks. End
`READY_FOR_ROOT_SEMANTIC_REVIEW` only if every correction is applied and checks pass. Otherwise end
`BLOCKED: <precise reason>`. Do not claim final acceptance: root semantic review and the one final
Fable 5 high refinement remain.
