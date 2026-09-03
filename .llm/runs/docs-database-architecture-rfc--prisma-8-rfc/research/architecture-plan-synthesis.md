# Architecture Plan Synthesis — NetScript Database Foundation

> Status: Plan-Gate synthesis, not PLAN-EVAL and not the canonical RFC.\
> Baseline: `origin/main@cd720529333328bcba5e1a308ce7632f4350efdf`.\
> Evidence date: 2026-08-13.\
> Confidence labels: **[FACT]** is directly supported by a cited research/source artifact;
> **[INFERENCE]** reconciles facts; **[PROPOSAL]** is the architecture recommended for plan lock.

## 1. Executive decision

**[PROPOSAL]** NetScript should replace its database foundation with a clean-break, provider-neutral
composition and operations kernel whose first certified provider is Prisma 8 PostgreSQL. The kernel
owns identity, deterministic composition, schema-contributor ownership, runtime lifecycle, operation
state machines, policy, and evidence. Prisma owns its schema language, query language, contract
format, execution engine, migration semantics, and database-specific lowering. The application owns
domain ports and the final inferred query types.

The durable center is not a live `DatabaseGraph`. It is a sequence of distinct values:

```text
provider-native TypeScript contracts + NetScript database definition
                               |
                               v
             content-addressed DatabaseManifest
                  |                         |
                  v                         v
       app-local typed bindings      speculative preview
                  |                         |
                  v                         v
       lifecycle-owned sessions   baseline-bound ExecutablePlan
                                            |
                                            v
                                  provider marker / ledger
                                            |
                                            v
                                  immutable OperationReceipt
```

**[INFERENCE]** This reconciles the two strongest independent findings:

- the five current database systems need one NetScript-owned join point, but a live runtime graph
  would become a service locator ([netscript-current-state.md](./netscript-current-state.md),
  “Executive finding”; [claude-opus-architecture-review.md](./claude-opus-architecture-review.md),
  §§2.1–2.2); and
- the manifest, plan, upstream ledger, and receipt must not collapse into Terraform-like mutable
  state ([market-analysis.md](./market-analysis.md), “Artifact and control-plane boundary”;
  [market-gap-audit.md](./market-gap-audit.md), “Plan-lock decisions affected”).

The redesign has five refusal boundaries:

1. **No NetScript query DSL or repository abstraction.** The provider's query surface remains intact
   and application-local.
2. **No compatibility layer.** No Prisma 7 facade, legacy generated module, dual client,
   `setClient`, alias barrel, copied schema, or textual generated-source repair survives.
3. **No false portability.** Provider capabilities are visible and statically checked. Unsupported
   targets and operations fail explicitly.
4. **No local hosted control-plane clone.** RBAC, approvals, registries, fleet schedulers,
   continuous drift agents, KMS, and permanent audit servers are optional integrations.
5. **No validation overclaim.** Standard Schema interpretation is deliberately bounded; unsupported
   Prisma operations, result shapes, pack kinds, and codecs fail while constructing a schema.

## 2. Reconciled evidence and corrections

### 2.1 Facts that carry the architecture

- **[FACT]** NetScript currently has five overlapping systems—configuration/Aspire resources, CLI
  registry/runner, generated engine workspaces, runtime wrappers, and plugin fragment copying—with
  no canonical join point. Target resolution ignores `PrimaryDatabase`; two same-provider targets
  share `database/<engine>`; generation is Aspire-coupled; executing `generateDatabaseDenoJson` for
  all four providers produces 42 `db:*` task keys in every generated engine workspace; plugin
  contribution is source-layout discovery plus regex collision checking
  ([netscript-current-state.md](./netscript-current-state.md); executed-generator correction in the
  [run-root rebaseline](../research.md), “Corrections and conflict resolutions”).
- **[FACT]** Prisma 8 RC1 is Early Access, Node 24-primary, TypeScript 5.9 optional-peer, and
  intends PostgreSQL as the only 8.0 GA database. MongoDB is EA, SQLite is proof-of-concept, MySQL
  is later, and SQL Server is absent. Prisma's current direction is canonical contract data, a
  separate control client, provider runtimes, contract spaces, and types-only emission
  ([prisma-8-deep-dive.md](./prisma-8-deep-dive.md), “Research pin,” “Executive conclusion,” and
  “Maturity scorecard”).
- **[FACT]** `@prisma/orm-postgres` has 138 top-level export keys at the audited pin, not the
  approximate 275 stated in one independent report. This number is evidence of breadth, not a public
  API requirement ([prisma-8-deep-dive.md](./prisma-8-deep-dive.md), “Public packages and coupling
  risk”).
- **[FACT]** Prisma's public programmatic control direction is real but moving. The CLI/config
  distribution, control routing, schema generation, PostgreSQL floor, numeric semantics, and output
  channels changed after RC1. Public NetScript types therefore cannot name those option shapes or
  package paths ([prisma-8-deep-dive.md](./prisma-8-deep-dive.md), “Six days of post-RC churn”).
- **[FACT]** NetScript builds with `isolatedDeclarations: true`; doctrine's slow-type exception is
  intentionally restricted to oRPC-bound packages. Application-specific inferred Prisma contract
  types must therefore terminate in generated app-local bindings unless publish conformance proves
  an explicitly annotated provider surface
  ([claude-opus-architecture-review.md](./claude-opus-architecture-review.md), §§2.1, 12.1;
  `docs/architecture/doctrine/02-public-surface.md`).
- **[FACT]** The owner/maintainer exchange is evidence for a runtime-derived validation direction,
  not an upstream commitment. The pinned source proves a useful bounded value algebra but disproves
  full contract-only Prisma operation parity
  ([runtime-validation-maintainer-exchange.md](./runtime-validation-maintainer-exchange.md);
  [runtime-validation-source-audit.md](./runtime-validation-source-audit.md), “Bottom-line
  decision”).

### 2.2 Disagreements resolved

| Disagreement                          | Resolution for plan lock                                                                                                                                                                                                            | Reason                                                                                                                                    |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Live `DatabaseGraph` versus manifest  | **[PROPOSAL]** `DatabaseGraph` may exist only as a private compiler IR. `DatabaseManifest` is the durable resolved value.                                                                                                           | A live graph invites lookup/service-location; a manifest is serializable, hashable, reviewable, and transportable.                        |
| Three artifacts versus five artifacts | **[PROPOSAL]** Three public responsibilities—definition/manifest, operation protocol, contribution record—produce five distinct artifact classes: definition, resolved manifest, executable plan, provider ledger, receipt.         | Qwen correctly minimizes the public kernel; the market audit correctly separates operational artifacts.                                   |
| Who owns migration/control semantics? | **[PROPOSAL]** Prisma owns provider plan/diff/lineage/marker semantics. NetScript owns target selection, classification, policy, locking orchestration, expiry, cross-target sequencing, recovery, receipts, and error translation. | NetScript must not reimplement Prisma's migration engine, but the missing cross-target and operational guarantees are framework concerns. |
| Capability negotiation                | **[PROPOSAL]** Static manifest capability claims and requirements only. No runtime negotiation protocol.                                                                                                                            | Prevents a second ORM and makes unsupported composition deterministic.                                                                    |
| Consumer-owned ports                  | **[PROPOSAL]** App architecture guidance, not a NetScript port framework. NetScript exposes typed target/session references; applications bind them to their own stores at composition roots.                                       | Preserves domain boundaries without generating repositories.                                                                              |
| Provider contingency backend          | **[PROPOSAL]** Specify and test a narrow provider SPI, but do not pre-build a direct-SQL fallback solely to prove it. A second real provider certifies the SPI later.                                                               | A speculative fallback would recreate low-level database machinery and violate “wrap, do not reinvent.”                                   |
| Validation generation                 | **[PROPOSAL]** Runtime Standard Schema interpretation is the default for a bounded algebra. Optional AOT is derived, atomic, and corpus-equivalent.                                                                                 | Qwen's generated-validator recommendation predates the source audit; the source audit supersedes broad generation assumptions.            |
| Public representation name            | **[PROPOSAL]** `runtime` and `json`. Driver wire is adapter-internal.                                                                                                                                                               | Prisma codecs have three channels; calling JSON “wire” is ambiguous.                                                                      |
| Full mutation/query input validation  | **[PROPOSAL]** Do not promise it from the contract alone. Model-value and explicitly contributed operation schemas are supported; missing operation grammar is an unsupported-construction error.                                   | Prisma's phantom operation type maps are emitted to `.d.ts`, not retained as runtime validation data.                                     |
| Plugin removal                        | **[PROPOSAL]** Detach-and-retain is the initial guaranteed operation. Archive/drop remain capability- and conformance-conditional.                                                                                                  | Contract spaces solve ownership and history, not RC1 extension removal.                                                                   |
| Provider breadth                      | **[PROPOSAL]** Provider-neutral kernel, Prisma 8 PostgreSQL-only first release. Other targets return structured unsupported diagnostics; no Prisma 7 fallback.                                                                      | Honest match to upstream maturity while preserving the architecture.                                                                      |

## 3. Durable vocabulary and artifact taxonomy

The RFC must use these terms consistently. Similar-looking values are intentionally distinct.

| Term                                | Kind and owner                                                          | Meaning and invariant                                                                                                                                                                                       |
| ----------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DatabaseDefinition`                | Public TypeScript value, NetScript                                      | Authored composition of targets, spaces, connection-source references, capability requirements, and policies. Pure; it performs no IO. It is not called a manifest.                                         |
| `NativeContract`                    | Provider-native authored value, provider                                | A Prisma `defineContract` result or another provider's equivalent. NetScript does not translate its entity/query vocabulary.                                                                                |
| `SpaceContribution`                 | Public declarative record, NetScript/plugin                             | Stable owner ID, version, target binding input, dependencies, ownership, capabilities, artifact references, provenance, and retention policy for one contract space.                                        |
| `ContractArtifact`                  | Versioned generated data, provider                                      | Canonical provider contract data plus its declaration/types and lineage artifacts. It is pinned and mirrored per space.                                                                                     |
| `DatabaseManifest`                  | Public versioned generated data, NetScript                              | Fully resolved, deterministic snapshot of target/space identity, ownership, capability proof, artifact digests, provider pins, topological order, output roots, and policies. It is the durable join point. |
| `ManifestDigest`                    | NetScript content address                                               | Digest of the canonical full manifest, including provider/contributor identities. It is not any Prisma storage/profile hash.                                                                                |
| `AppBinding`                        | App-local generated TypeScript                                          | Minimal inferred bridge from native contract declarations to concrete target sessions, validators, and transport consumers. Never a published framework export.                                             |
| `TargetRef`                         | Public narrow generic value, NetScript                                  | Explicit stable reference to one target. It carries identity/capability/scope types but no query methods by itself.                                                                                         |
| `TargetSession`                     | Public lifecycle shell + app-local query generic, NetScript/application | Provider-created process/request-scoped binding. Query surface remains the provider's inferred type parameter.                                                                                              |
| `ConnectionSource`                  | Public consumed port, NetScript                                         | Resolves credentials/allocation for one target/environment. Environment values never participate in manifest identity. Aspire is one adapter.                                                               |
| `SpeculativePreview`                | Public structured value, NetScript control                              | Offline or live advisory preview. Cannot be approved or applied.                                                                                                                                            |
| `ExecutablePlan`                    | Public signed/versioned value, NetScript control                        | Bound to manifest digest, exact target/space closure, provider pins, environment, live baseline, operations, policy decision, expiry, and secret references.                                                |
| `ProviderMarker` / `ProviderLedger` | Provider-owned database state                                           | Authoritative provider record of applied space heads/edges. NetScript reads and cites it; NetScript does not create a second mutable shadow state.                                                          |
| `OperationReceipt`                  | Immutable append-only evidence, NetScript control                       | What was attempted, observed, checkpointed, verified, skipped, failed, or left uncertain. It is not desired state.                                                                                          |
| `OperationCatalog`                  | Public machine-readable data, NetScript                                 | Names, classes, request/result schemas, diagnostics, and next actions. CLI/help/docs/agent instructions are projections.                                                                                    |
| `ValidationIR`                      | Internal bounded value algebra, NetScript runtime                       | Provider-decoded scalar/value-object/union/list/dict/null/value-set/selection shape used to produce Standard Schema values. It never becomes a second entity or query model.                                |

Identity is declared, never inferred from provider names or paths:

- `TargetId` identifies one logical database (`primary`, `analytics`).
- `RoleRef` identifies writer/read-only roles of a target; a replica is not a migration target.
- `NamespaceRef` identifies a physical namespace inside one target.
- `SpaceId` identifies one schema owner (`app`, `plugin:@netscript/auth`).
- `ObjectKey` is `(target, namespace, entryKind, name)` and has one managed owner.
- `ContractSnapshotId` addresses one canonical provider contract artifact.
- `PlanId` binds a manifest, baseline, provider set, policy, and target/space closure.
- `RunId`/`ReceiptId` identify executions and evidence.

**[PROPOSAL]** Paths, array order, package traversal order, provider discovery order, config
aliases, and engine names must never become identity or dependency edges.

## 4. Exact package and dependency graph

### 4.1 Package assignments

One package receives exactly one doctrine archetype. This corrects the current plan's missing
Archetype 3 runtime surface.

| Package                               | Archetype                 | Public responsibility                                                                                                                                                                                                         | Forbidden responsibility                                                                                          |
| ------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `@netscript/database-contract`        | **A1 Small Contract**     | Identities, manifest/plan/receipt/diagnostic data shapes, capability and ownership vocabularies, provider pins, small public SPIs shared across packages.                                                                     | IO, runtime lifecycle, query types, Prisma imports.                                                               |
| `@netscript/database`                 | **A4 Public DSL/Builder** | `defineDatabase`, target/space/policy composition, pure resolution/compilation to `DatabaseManifest`, frozen definitions, deterministic diagnostics.                                                                          | Connections, Aspire, provider imports, migration execution.                                                       |
| `@netscript/database-runtime`         | **A3 Runtime/Behavior**   | Process/request lifecycle, target binding, connection ownership, close order, health/readiness, cancellation, validation cache/interpreter coordination, small session handles.                                               | Migration orchestration, CLI, provider query vocabulary.                                                          |
| `@netscript/database-control`         | **A2 Integration**        | Programmatic operation protocol; provider/control ports; classify/preview/plan/apply/verify/inspect/emit; lock coordination; receipts; resume and cross-target saga.                                                          | Provider SQL/AST types, direct Prisma imports, CLI rendering.                                                     |
| `@netscript/database-prisma-postgres` | **A2 Integration**        | The only **framework runtime/control** Prisma import boundary; PostgreSQL capability descriptor; native-contract/artifact adapter; control adapter; runtime factory; validation-IR decoder; upstream compatibility allowlist. | Re-exporting Prisma as NetScript's generic API; importing CLI into runtime; hand-written Prisma driver internals. |
| `@netscript/database-testkit`         | **A6 CLI/Tooling**        | Runnable provider and contribution conformance certification with machine receipts, negative fixtures, and real-service profiles.                                                                                             | Runtime dependency of an application.                                                                             |
| `@netscript/plugin` (existing)        | **A4 Public DSL/Builder** | `defineDatabaseSpace`/contribution seam using `@netscript/database-contract`; removal of hollow path/engine contribution abstracts in the clean break.                                                                        | Provider, runtime, or control dependencies.                                                                       |
| First-party `plugins/*`               | **A5 Plugin**             | Thin contribution records and pinned release artifacts sourced from their `-core`; provider requirements and lifecycle policy.                                                                                                | Copied application schema, migration ownership hidden in install scripts, framework conventions.                  |
| `@netscript/aspire` (existing)        | **A2 Integration**        | One `ConnectionSource`/provisioning adapter and resource projection from the manifest.                                                                                                                                        | Mandatory dependency for pure or non-Aspire operations.                                                           |
| `@netscript/cli` (existing)           | **A6 CLI/Tooling**        | Thin rendering/projection of `OperationCatalog` and `@netscript/database-control`; adoption codemod and agent artifact emission.                                                                                              | Database orchestration logic or provider switches.                                                                |

`@netscript/database-testkit` is deliberately A6 rather than a `./testing` subpath because
third-party provider certification is runnable automation that provisions real services, executes a
matrix, and emits a signed machine report. If implementation proves no binary is needed, this is the
only package split that may be revisited before Wave 1; it must not be folded after public release.

### 4.2 Dependency direction

```text
                         @netscript/database-contract (A1)
                       /          |          |          \
                      v           v          v           v
     @netscript/database(A4)  -runtime(A3)  -control(A2)  @netscript/plugin(A4)
                                 ^    ^       ^
                                 |     \      |
                                 +------\-----+
                                        v
                         @netscript/database-prisma-postgres(A2)
                                        ^
                                        |
                         @netscript/database-testkit(A6)

 application composition root -> definition + runtime + control + chosen provider + app bindings
 provider-native app/plugin schema source -> Prisma public authoring builder (controlled build only)
 @netscript/aspire            -> runtime/contract connection-source SPI only
 @netscript/cli               -> control/contract operation catalog only
 first-party plugin           -> plugin + database-contract only
```

The arrows denote “depends on” toward the top-level contract seam: kernel packages never import a
provider. The provider implements runtime/control SPIs and is selected as a value in the application
composition root. Only the testkit may fan across all public SPIs.

### 4.3 Doctrine and publish obligations

**[FACT]** Doctrine currently describes database schema contributions as plain `*.prisma` fragments,
and its verdict/gated-root tables do not contain the proposed packages
([claude-opus-architecture-review.md](./claude-opus-architecture-review.md), §§3.5, 15.1).

**[PROPOSAL]** Wave 0 must amend `docs/architecture/doctrine/06-archetypes.md` and
`10-codebase-verdict-and-handoff.md`, register every new package in the gated denominator, replace
the plain-fragment rule, and ensure A9's archetype count is current. Every package must pass
F-1…F-19 as required by its archetype; A3 additionally has required runtime gates. Package/plugin
waves require JSR surface design, `deno doc --lint`, packed install, consumer imports,
`quality:scan`, and `arch:check`. No database package receives the oRPC slow-types exception by
assumption.

## 5. Public versus adapter-local ownership

| Surface           | Public NetScript contract                                                                                 | Adapter-local/provider-owned detail                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Authoring         | Targets, spaces, ownership, policy, capability requirements, native-contract artifact references.         | Prisma model/field/index/default helpers, scaffold shape, lowering and contract AST.                      |
| Types             | Plain identities/artifacts plus generic `TargetRef`/`TargetSession`; concrete app bindings.               | Prisma conditional/query/result types and contract generics.                                              |
| Runtime           | Scope, lifecycle, health, cancellation, transaction capability marker, validation requests.               | `sql`, `orm`, `raw`, `prepare`, concrete transaction/runtime facade, driver/pool types.                   |
| Control           | Operation classes, plan binding, policy, lock requirements, result/receipt/error catalog.                 | Exact `createControlClient` path/options, upstream plans/errors/progress, migration graph representation. |
| Contract identity | NetScript `ManifestDigest`, `ContractSnapshotId`, provider pin.                                           | Prisma storage/execution/profile hashes and contract schema version, recorded as opaque attributes.       |
| Contributions     | Stable `SpaceId`, provenance, target/capability/dependency/ownership/removal policy, mirror digest.       | Prisma contract-space artifact layout, marker/ledger tables, extension descriptors.                       |
| Validation        | `StandardSchemaV1`, `runtime` and `json`, bounded supported/unsupported semantics, NetScript issue codes. | Prisma contract/AST decoding, driver-wire values, codec conversions, pack-specific metadata.              |
| Operations UI     | Machine catalog, JSON requests/results, `nextAction`; CLI/help/docs/agents generated from it.             | Upstream command names, terminal text, config file layout.                                                |

No framework package re-exports Prisma. No public example imports a moving upstream control path.
Application and provider-specific plugin schema-authoring modules may import Prisma's **public
authoring builder** directly during the controlled build phase; that is provider-native authoring,
not a NetScript re-export. They may not import Prisma runtime/control internals, and their emitted
plain contribution descriptor/artifacts—not the schema module—are the deployment input.

## 6. Native TypeScript schema extension and end-to-end typing

### 6.1 Locked strategy

**[FACT]** The fluent target/model/table/column chain shown in the owner's screenshot was real at
historical commit `fd88abf4`. Prisma redesign PR #261 / commit `27ccefc3` replaced it with the
model-first callback form, and PR #317 / commit `e1e5ab2c` removed the legacy implementation. RC1's
PostgreSQL API is `defineContract(scaffold, ({ field, model, rel, type }) => …)`: semantic models
first, `.sql(...)` storage overlay second, typed model tokens, and helper vocabulary composed from
family/target/extension packs. The callback preserves its literal return type
([typescript-schema-orpc-audit.md](./typescript-schema-orpc-audit.md), §§1–3).

**[PROPOSAL]** Use the same architectural pattern as NetScript's oRPC integration—preserve the
upstream inferred contract, add a NetScript-owned typed composition seam, and bind it at the
application root—but do not copy the mechanisms that would erase inference or publish slow types:

1. **Candidate A is the baseline: native contract plus thin NetScript definition.** An application
   or plugin author invokes Prisma's public `defineContract` directly, then passes the exact native
   value to `defineDatabase({ contract, … })` or `defineDatabaseSpace({ contract, … })`. The
   NetScript function retains `typeof contract` unchanged while adding identity and policy.
   NetScript does not translate entity/model vocabulary and does not publish a shadow
   `model()/column()` DSL.
2. **NetScript wraps the result, not the builder.** The frozen database/space definition records
   target, ownership, migration head, capabilities, validation policy, and lifecycle around the
   native value. It must not copy Prisma overloads or widen the value to a generic contract record.
3. **Composition uses contract spaces, not object spreading.** App and plugin contracts remain
   separately owned snapshots with declared dependency edges. A “merged TypeScript contract” may be
   an app-local inferred view only where Prisma publicly supports it; it is never the ownership
   record.
4. **Plugin publication exports artifacts and plain contribution metadata.** A plugin's release
   pipeline emits/pins its contract JSON, declaration artifact, lineage, provenance, and descriptor.
   Consumer apply/verify works without importing the plugin package.
5. **Inferred binding stays application-local.** The app emitter writes a minimal binding module
   from the manifest and provider declaration artifacts. This is automatic generated glue, never
   hand-authored and never text-patched.
6. **A policy-applied native factory is optional, never foundational.** A
   `createPrismaContractFactory(...).define(callback)` convenience is allowed only if it forwards
   Prisma's exact composed helper surface without copied overloads, private imports, or inference
   widening. Otherwise Candidate A remains the complete public API.

This is “extend Prisma like oRPC” at the correct seam:
`native inferred contract → structurally
checked NetScript contribution → generated app-local binding`.
It does not mean wrapping `defineContract` with a parallel builder or re-exporting all upstream
helpers.

### 6.2 End-to-end type flow

```text
native defineContract() value
      | typeof contract (editor/compiler inference)
      +-----------------------> provider query/result types
      |
      v
defineDatabase()/defineDatabaseSpace(contract, ownership/capabilities)
      |
      v
DatabaseDefinition -> DatabaseManifest + pinned contract.d.ts/contract.json
      |                                      |
      |                                      +--> bounded ValidationIR -> StandardSchemaV1<T>
      v
generated app-local TargetBinding<NativeContract>
      |
      +--> process/request TargetSession<QueryOf<NativeContract>>
      +--> typed selection/result helper where provider metadata is complete
      +--> oRPC/Fresh/form/SSR schemas at explicit trust boundaries
      +--> application-owned AccountStore/BillingStore adapters at composition root
```

Static inference and durable identity are independent:

- `typeof contract` is the DX track. It may contain complex provider generics and never crosses a
  published framework boundary.
- `ContractSnapshotId`/`ManifestDigest` is the correctness track. It is plain data used by plans,
  markers, receipts, validators, caches, agents, and stale-artifact checks.

Every derived binding includes the manifest digest and exact provider pin. Runtime startup rejects a
binding/manifest/contract mismatch with a structured `db.artifact.stale` or
`db.contract.version-mismatch` diagnostic and a machine `nextAction`.

### 6.3 Minimal illustrative shape

This is an audited architectural sketch. The Prisma import subpath and exact RC overload remain
adapter-pin details, so the canonical RFC must label them version-specific rather than promise the
literal path.

```ts
// Application-local provider-native authoring.
export const appContract = defineContract(
  { extensions: {}, namespaces: ['app'] },
  ({ field, model }) => {
    const User = model('User', {
      namespace: 'app',
      fields: {
        id: field.id.uuidv4String(),
        email: field.text().unique(),
      },
    });
    return { models: { User } } as const;
  },
);

// NetScript composition adds ownership/lifecycle, not model vocabulary.
export const appDatabase = defineDatabase({
  id: 'app',
  contract: appContract,
  target: 'primary',
  migrations: { space: 'app' },
  validation: { profile: 'boundaries' },
});
```

The public RFC must explicitly state that the screenshot's deleted fluent syntax is not the target
API and must not be recreated by NetScript merely for aesthetic familiarity.

### 6.4 Native fragments, ownership modes, and extension bundles

There are two contribution modes, and the mode decides migration ownership:

- `ownership: 'app'` is a native fragment function that receives Prisma's exact composed helpers and
  returns const-preserved native `types/models/enums/entities`. A generated app-local root composes
  fragments through explicit calls and object spreads. It must not use `Array.reduce()` or a
  registry widened to `Record<string, ModelLike>`.
- `ownership: 'space'` is a complete plugin-owned native contract, canonical artifact, migration
  graph, and head. This is the default for plugin-owned tables. The consumer binds the space to a
  target but does not acquire its migration ownership.

Composition is necessarily two-phase because extension packs determine the static and runtime shape
of the helper object before Prisma invokes the callback:

1. collect contribution manifests, required packs, dependencies, target/namespace requirements,
   ownership, and extension facets;
2. resolve one scaffold, obtain the fully composed native helper surface, and then invoke app-owned
   fragments in deterministic dependency order.

A database extension is one NetScript contribution bundle with a single verified ID/version and four
phase facets:

```ts
defineDatabaseExtension({
  id: 'pgvector',
  version: '…',
  authoring: pgvectorPack,
  control: pgvectorControl,
  runtime: pgvectorRuntime,
  validation: pgvectorValidation,
});
```

The generated root fans that bundle into Prisma's authoring, control, runtime, and validation
locations. A missing, mismatched, or half-installed facet is a composition error. This eliminates
the current class of manual registration where one logical extension must be repeated independently
per phase ([typescript-schema-orpc-audit.md](./typescript-schema-orpc-audit.md), §§4, 10).

### 6.5 Canonical artifact boundary

Native no-emit development does not remove the production artifact boundary: Prisma itself
serializes/deserializes even an in-memory native contract before runtime use, and migration planning
is canonical-artifact-driven. The automated build therefore evaluates native authoring only in a
controlled deterministic phase, canonicalizes, atomically emits contract and declaration artifacts,
checks the migration head, validates or creates migration artifacts, attaches ownership/provenance,
and makes CI/production runtime consume the exact verified artifact. Migration apply never executes
arbitrary application or plugin TypeScript
([typescript-schema-orpc-audit.md](./typescript-schema-orpc-audit.md), §9).

## 7. Runtime validation subsystem

### 7.1 Public boundary and algebra

**[PROPOSAL]** Standard Schema is the only public validator protocol. NetScript returns
`StandardSchemaV1<T>` from app-local typed bindings; it does not re-export Zod, Valibot, ArkType, or
Prisma's ArkType contract-document validators.

The supported internal `ValidationIR` is deliberately closed per interpreter ABI:

- registered scalar codec leaves;
- nullability;
- `many` lists and `dict` values;
- value objects;
- value sets, domain enums, and resolvable provider native enums;
- unions only when branch identity is deterministic;
- model fields/relations whose cross-space references resolve through a verified aggregate;
- whole-model values with explicit presence policy; and
- direct-column selection/returning projections whose alias, codec, nullability, and representation
  are fully known.

Public representations are:

```ts
type ValidationRepresentation = 'runtime' | 'json';
```

Prisma driver-wire values and schemas are adapter-internal. A built-in or custom codec is supported
only when its contributor supplies a deterministic value schema for every advertised public
representation. Conversion success is not validation.

### 7.2 Three schema classes

The RFC must not hide materially different guarantees behind one `input()` method.

| Class                  | Supported initial guarantee                                                                                                    | Refusal boundary                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Model value schema     | Validate a named model/value-object/enum in `runtime` or `json`, using explicit object-presence/default policy.                | No inference that database uniqueness/FK/check constraints are locally satisfied.                                             |
| Operation input schema | Available only when the provider/extension contributes a runtime operation grammar and typed binding for that exact operation. | Prisma create/update/filter/nested-write semantics absent from runtime contract data fail at construction.                    |
| Result schema          | Validate whole-model or fully-known direct projections/selections with complete leaves.                                        | Computed/subquery/raw/aggregate/include/unknown leaves require an explicit contributed result schema or fail at construction. |

Candidate app-local shape:

```ts
const users = database.primary.space('app').model('User');

const runtimeUser = users.value({ representation: 'runtime' });
const createData = users.operation('create', { representation: 'runtime' });
const publicUser = users.result(selection, { representation: 'json' });
```

`operation()` and `result()` throw `DB_VALIDATION_UNSUPPORTED` while constructing a schema if the
requested metadata is incomplete. Invalid user values do not throw; they return Standard Schema
issues.

### 7.3 Mandatory unsupported cases

Schema construction fails closed for at least:

- unknown codec or missing representation-specific codec value schema;
- unknown provider pack entity kind;
- corrupt/missing aggregate space, head, hash, cross-space reference, or value set;
- ambiguous unions or unresolved model variants/discriminators;
- Prisma operation types whose runtime grammar is absent: filters, relation traversal, nested
  writes, polymorphic narrowing, and default/presence semantics without a contributor;
- SQL computed, subquery, raw, aggregate, or include results without an explicit result shape;
- Mongo `resultShape: unknown`, raw `Document`, or unknown leaves;
- opaque SQL index/check expressions and database-state constraints such as uniqueness, FK, or
  exclusion checks; and
- async/non-deterministic value predicates where the requested Standard Schema mode promises sync.

No unsupported case becomes `unknown`, pass-through, or a warning.

### 7.4 Cache identity and AOT equivalence

No existing Prisma section hash covers validator identity. Cache keys contain:

```text
canonical full-contract digest + schema version + space id + target/family
+ operation or normalized selection + representation + interpreter ABI
+ codec/pack contributor id/version + execution identity when defaults matter
```

An optional AOT projection ships only if it passes the same semantic corpus as runtime
interpretation: successes, issue paths, representation behavior, unsupported-construction failures,
contract-space resolution, and invalidation. It is content-addressed, target-scoped, atomic, and
replaceable. It is never hand-maintained, repaired, or required for correctness.

### 7.5 Trust-boundary policy

- Input/model-value validation is mandatory at external mutation boundaries where a supported schema
  exists.
- Output validation is mandatory for declared API/RPC responses, SSR/hydration payloads, and
  external-service messages; it is opt-in for internal query loops.
- Failure issues include stable code, target, space, contract digest, model/operation/selection,
  representation, field path, expected class, and observed value class.
- Contract-space plugin fields participate automatically after aggregate integrity verification.
- oRPC, Fresh, forms, and SSR consume the same Standard Schema values; adapters must not regenerate
  library-specific mirrors.

## 8. Control state machines

### 8.1 Operation classes

| Class       | Examples                                                      | Allowed dependencies                                                                          |
| ----------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `pure`      | compose, validate definition, emit, format, lineage integrity | Source/artifact readers and atomic writer only; never connection, Aspire, Docker, or network. |
| `live-read` | inspect, introspect, live preview, verify, status             | Explicit target connection; no mutation lock.                                                 |
| `mutating`  | initialize, seed, apply, sign, adopt baseline, retire         | Explicit target; provider-native lock/fencing; executable plan where applicable.              |
| `resident`  | studio or connection available only inside an existing host   | Explicit target and resident orchestration binding.                                           |

Aspire is a connection-source/provisioning adapter, never an operation class.

### 8.2 Composition state machine

```text
authored
  -> resolving
  -> resolved(manifest, warnings)
  -> refused(diagnostics)
```

Resolution is pure and total as `Result`. It validates declared identities, output/root isolation,
provider pins, target binding, capability subsets, ownership disjointness, dependency
closure/cycles, cross-target reference refusal, contribution provenance, contract version, and
mirror integrity.

### 8.3 Preview/plan state machine

```text
resolved manifest
  -> speculative-preview ----------------------> non-applicable
  -> inspect baseline
  -> executable-plan-created
  -> policy-evaluated(allowed | refused)
  -> approved/signed (required by environment)
  -> ready
  -> expired | stale | revoked
```

A speculative preview is never accepted by `apply`. An executable plan binds manifest digest,
target/space dependency closure, environment, live baseline, provider/package locks, ordered
operations, destructive findings, policy result, secret references, and expiry. Production requires
a signature, but signing/key custody is a pre-production decision rather than a Wave 1 blocker.

### 8.4 Apply/receipt state machine

```text
planned
  -> acquiring-lock
  -> locked
  -> revalidating
  -> started
  -> applying(step checkpoint)*
  -> applied
  -> verifying
  -> verified
  -> succeeded

terminal/interrupt branches:
  refused | skipped(reason) | failed | partial_success
  | cleanup_required | outcome_unknown | cancelled
```

Every irreversible operation or provider transaction group appends an atomic receipt checkpoint.
Loss of transport after dispatch produces `outcome_unknown`, never `failed`. Resume first inspects
the database and provider ledger, revalidates plan bindings, and then continues only operations
whose outcome is known and unfinished. It never blindly repeats non-idempotent DDL or data
transforms.

Lock scope is target + physical database. Lock evidence includes provider capability, owner, nonce,
fencing token where used, start/expiry, timeout, and safe force-unlock preconditions. An adapter
that cannot provide a certified lock is refused for concurrent-safe apply.

### 8.5 Cross-target saga

Target and space selection always expands dependency closure. The plan records omitted items and
reason codes. Execution orders independent targets deterministically and may run them concurrently
only when policies and resource limits allow; each target has a separate runner and lock.

There is no cross-database transaction and no automatic rollback claim. A second-target failure
returns complete per-target/per-space results and `partial_success`; resume continues after
inspection. Selective apply is recovery machinery, not the normal path, and it requires subsequent
whole-manifest verification.

## 9. Plugin and contract-space lifecycle

### 9.1 Contribution record

Every contribution declares:

- stable `SpaceId` and semantic version;
- provider contract-format range and contract artifact digest;
- target binding supplied by the application, never a default/fallback;
- namespace/object ownership and `managed | adopted | external | ignored` policy;
- static capability requirements;
- declared dependency edges;
- migration head/lineage artifact and data invariants;
- package/integrity/provenance/signature information;
- one identity/version-checked extension bundle fanning into authoring, control, runtime, and
  representation-specific validation facets;
- representation-specific codec/operation/result validation contributions;
- allowed executable phases; and
- default retention/removal policy.

The consumer pins a mirror containing descriptor, contract data/declaration, lineage, and
provenance. Production apply/verify reads the mirror, not `node_modules`. Half-installation—schema
contribution present without its runtime/codec half, or vice versa—is a composition error.

### 9.2 Ownership and augmentation

- Each `ObjectKey` has one managed owner.
- Equal text from two contributors is still conflicting ownership.
- Namespaces prevent lexical collisions but do not replace ownership checks.
- Cross-space references require the same target plus a declared dependency edge.
- Augmentation is an owner-granted closed permission, not implicit merge. Initial grant kinds are
  deliberately narrow; unsupported modification asks the owner or uses an app-owned migration.
- `external` is not planned/mutated and is verified only against declared assertions. `adopted` has
  an explicit reviewed baseline. `ignored` requires an auditable reason and participates in neither.

### 9.3 Lifecycle

| Transition       | Guaranteed behavior                                                                                                                                | Refusal/conditional behavior                                                                      |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Install          | Validate target/capability/dependency/ownership/provenance; pin mirror; recompile manifest; produce plan.                                          | Refuse overlap, missing/cyclic dependency, contract skew, unsupported provider/codec.             |
| Upgrade          | Require lineage path from pinned head; pin new mirror; plan each changed edge.                                                                     | Refuse ownership widening, incompatible contract format, capability regression, ambiguous branch. |
| Skew             | Refuse mutation when installed package, mirror, manifest, and marker identities disagree.                                                          | Diagnostic names every observed identity and sync action.                                         |
| Detach/uninstall | Remove runtime/package binding while retaining pinned space tombstone and data by default.                                                         | Refuse if dependents remain or contribution cannot be verified without package code.              |
| Retain           | Guaranteed initial removal mode; preserve data, marker, mirror/tombstone, and ownership history; downgrade future mutation authority to `adopted`. | Exact upstream extension-detach mechanics must pass conformance.                                  |
| Archive          | Provider-capability conditional; planned namespace/table relocation with restoration path.                                                         | Unsupported for v1 unless Prisma PostgreSQL conformance proves it.                                |
| Drop             | Destructive-plan conditional; explicit policy/approval, dependent closure, and verified lineage.                                                   | Not claimed as a general RC1 capability; no delete-directory shortcut.                            |

**[PROPOSAL]** The RFC defines the lifecycle vocabulary now but only marks detach-and-retain as a
first-release guarantee. Archive/drop do not block the architecture and may not be scored as
implemented until provider conformance succeeds.

## 10. Multi-target and provider matrix

| Axis/case                                | Kernel support         | Prisma 8 PostgreSQL adapter v1  | Required behavior                                                                                                                                                                                                         |
| ---------------------------------------- | ---------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Two PostgreSQL databases                 | Yes                    | Required                        | Distinct `TargetId`, connections, outputs, spaces, markers, runtimes, plans, locks, receipts.                                                                                                                             |
| Multiple PostgreSQL namespaces           | Yes                    | **Upstream-blocked capability** | Runtime lowering supports per-model namespaces, but RC1/current-main type maps flatten them into the default namespace. The adapter must not claim `multiNamespace` until exact type/runtime parity passes without casts. |
| Writer/read replicas                     | Roles on one target    | Runtime conditional             | Reader session is read-only; no migration operation can address a reader.                                                                                                                                                 |
| App + multiple plugin spaces             | Yes                    | Required                        | Independent artifacts/heads, dependency order, overlap refusal, package-free apply/verify.                                                                                                                                |
| Managed/adopted/external/ignored objects | Yes                    | Required                        | Ownership-aware plan and drift semantics.                                                                                                                                                                                 |
| Request/process scope                    | Yes                    | Required                        | Different types and lifecycle; serverless request handles disposable and capability-reduced.                                                                                                                              |
| Prisma 8 SQLite                          | Kernel-ready           | Unsupported/deferred            | Structured `db.target.unsupported`; no legacy fallback.                                                                                                                                                                   |
| Prisma 8 MongoDB                         | Family axis ready      | Unsupported/deferred            | No production claim based on EA source presence.                                                                                                                                                                          |
| Prisma 8 MySQL                           | Provider axis ready    | Absent/deferred                 | Retire hand-rolled adapter; revisit after upstream or a separately certified provider.                                                                                                                                    |
| SQL Server                               | Provider axis ready    | Absent/deferred                 | Requires another provider implementation.                                                                                                                                                                                 |
| Cross-target relation/transaction        | Explicitly unsupported | Unsupported                     | Composition error for relations; multi-target operations are sagas, never transactions.                                                                                                                                   |
| Provider-specific query features         | Capability-visible     | Native Prisma surface           | No lowest-common-denominator wrapper.                                                                                                                                                                                     |

The provider-neutral kernel may ship independently of Prisma readiness. The Prisma adapter remains
experimental/unpublished until every release gate passes. A Prisma delay never reopens a Prisma 7
path.

## 11. Clean cutover and parallel development

### 11.1 No-compatibility law

The old and new systems may live on separate branches/release lines during implementation, but one
application composition may never load both. There are no runtime shims, aliases, deprecated
facades, dual migration histories, or copied schema bridges.

### 11.2 Adoption workflow

`netscript db adopt` is a temporary migration tool, not a compatibility layer:

1. Read legacy config and generated layouts; report duplicate/ambiguous identities.
2. Generate a proposed TypeScript `DatabaseDefinition`, taking target IDs from config keys, never
   providers.
3. Introspect every reachable target without mutation.
4. Propose one space per attributable owner plus app/external/adopted classifications.
5. Produce a complete ownership/capability/provenance preflight; unattributed objects hard-stop.
6. Compile the manifest and emit atomic provider/app-binding artifacts.
7. Establish one baseline/root per space and write provider marker metadata **only**—zero DDL/DML.
8. Verify the live target against the manifest and baseline.
9. Commit the new composition and delete old engine workspaces, the 42 per-workspace generated
   `db:*` task keys, repair scripts, copied plugin fragments, old adapters, and dependencies only
   after verification.

After baseline and before the first new apply, rollback is repository-only plus idempotent removal
of new marker metadata where provider semantics permit. After first apply, recovery is forward
through lineage and receipts. There is no “run both clients” rollback.

### 11.3 Safety and parity

- A seeded/populated production-shaped rehearsal must prove adoption performs zero schema/data
  mutation.
- Preflight is a committed CI artifact with target/provider versions, every object/owner, capability
  proof, plugin provenance, and unresolved blockers.
- The fourteen legacy verbs receive explicit mapped/replaced/removed dispositions; implicit
  target/default and silent first-target execution are deliberate removals.
- The parallel architecture branch merges only after feature-parity accounting, migration guide,
  data-safety rehearsal, and full scaffold/runtime gates. This is branch strategy, not public API.

## 12. Implementation waves and dependencies

| Wave                       | Proves                                                                                                                                                                               | Depends on | Primary surfaces                                                   | Exit gate                                                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W0 RFC/doctrine lock       | Vocabulary, package archetypes, refusal boundaries, acceptance matrix.                                                                                                               | —          | RFC + doctrine/gated-root amendments planned, not production code. | Accepted RFC; PLAN-EVAL/IMPL-EVAL complete; no unresolved must-resolve decision.                                                                               |
| W1 Contract kernel         | Plain identities, artifact schemas, capability/ownership vocabularies, diagnostic/operation types.                                                                                   | W0         | `@netscript/database-contract`                                     | A1 gates; zero upstream deps; publish/doc/consumer proof.                                                                                                      |
| W2 Definition/compiler     | Pure native-contract wrapping, definition DSL, deterministic manifest resolution, ownership/dependency/capability checks.                                                            | W1         | `@netscript/database`                                              | A4 gates; property/determinism tests; zero IO reachability.                                                                                                    |
| W3 Prisma PostgreSQL spike | Validate public native builder, contract artifacts, ControlClient, runtime, spaces, extension bundles, Deno, bounded ValidationIR, and namespace parity behind adapter-local facade. | W1–W2      | Experimental `@netscript/database-prisma-postgres`                 | Kill/switch review; real PostgreSQL + packed Deno proof; no public stability claim; do not advertise `multiNamespace` while upstream types flatten namespaces. |
| W4 Runtime                 | Process/request sessions, lifecycle, connection sources, health/readiness, validation cache and trust-boundary adapters.                                                             | W1–W3      | `@netscript/database-runtime`, Aspire adapter                      | A3 gates; lifecycle/leak/cancellation/scope tests.                                                                                                             |
| W5 Control                 | Operation catalog, preview/plan/apply/verify, lock/recovery/receipt state machines, atomic emission, cross-target saga.                                                              | W1–W4      | `@netscript/database-control`                                      | A2 gates; exhaustive negative/failure injection; pure path no Aspire.                                                                                          |
| W6 Conformance testkit     | Certify providers and spaces, generated-project fixtures, machine reports.                                                                                                           | W1–W5      | `@netscript/database-testkit`                                      | A6/F-CLI gates; intentionally broken fixtures fail; real PostgreSQL.                                                                                           |
| W7 Contribution seam       | Replace hollow path/engine abstracts with space contributions and pinned artifacts.                                                                                                  | W1–W6      | `@netscript/plugin`, first plugin-core fixture                     | Breaking surface accounting; plugin seam/thinness gates.                                                                                                       |
| W8 CLI/agent/adoption      | Thin command projection, generated docs/skill, adoption codemod/preflight.                                                                                                           | W2, W5–W7  | `@netscript/cli`, generated app surface                            | Every example compiles/runs; codes/catalogs match; zero text-log assertions.                                                                                   |
| W9 First-party spaces      | Auth/workers/sagas/triggers converted; capability and lineage artifacts published.                                                                                                   | W7–W8      | Plugin core + thin A5 packages                                     | Each space conformance suite; package-free apply/verify; runtime E2E parity.                                                                                   |
| W10 Clean cutover          | Adopt populated fixtures; delete old database foundation and manual pipeline.                                                                                                        | W1–W9      | Repo-wide DB wiring/scaffold/docs                                  | Full release-gate class, Windows/Linux, production-shaped adoption, no compatibility remnants.                                                                 |
| W11 Provider expansion     | Prove SPI with a real second provider only when demanded and mature.                                                                                                                 | W10        | Separate provider package                                          | Full provider conformance; no kernel/public manifest change.                                                                                                   |

W3 is intentionally a spike before public runtime/control stabilization. A failed Prisma adapter
must not invalidate W1–W2. No old package is deleted before W10; that temporary repository
coexistence does not authorize dual runtime composition.

## 13. Exhaustive Plan-Gate decision table

| ID   | Decision                                                                                                                                                                                     | Status before PLAN-EVAL                         | Rationale / evidence                                                                                                                                                                    |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-01 | Clean break; no backward compatibility surface.                                                                                                                                              | **LOCK**                                        | Owner directive; old constraints caused current architecture.                                                                                                                           |
| D-02 | Data continuity and mechanical migration are mandatory.                                                                                                                                      | **LOCK**                                        | No-compat does not authorize data loss.                                                                                                                                                 |
| D-03 | Durable join point is `DatabaseManifest`; live graph is private compiler IR.                                                                                                                 | **LOCK**                                        | Opus/Qwen/market reconciliation.                                                                                                                                                        |
| D-04 | Definition, manifest, plan, provider ledger, and receipt are separate values.                                                                                                                | **LOCK**                                        | Terraform/Pulumi/Flyway/Liquibase corrections.                                                                                                                                          |
| D-05 | NetScript defines no query DSL/repository/client facade.                                                                                                                                     | **LOCK**                                        | Avoid second ORM; native provider semantics remain available.                                                                                                                           |
| D-06 | Native model-first Prisma `defineContract` authoring is primary; obsolete fluent chaining is not recreated. PSL may remain provider input but is not NetScript's preferred E2E path.         | **LOCK; exact import path adapter-pinned**      | Owner directive plus historical/current source audit.                                                                                                                                   |
| D-07 | Candidate A—direct native contract plus thin `defineDatabase`/space wrapper—is the baseline. Optional policy factory dies if it copies overloads, uses private imports, or widens inference. | **LOCK**                                        | Preserves native values and ownership; exact oRPC transfer audit.                                                                                                                       |
| D-08 | App-specific inferred binding is generated app-local, never published from kernel packages.                                                                                                  | **LOCK**                                        | `isolatedDeclarations` and slow-type boundary.                                                                                                                                          |
| D-09 | Exact package graph/archetypes are §4; runtime is A3.                                                                                                                                        | **LOCK**                                        | Doctrine gate correctness.                                                                                                                                                              |
| D-10 | Kernel is provider-neutral; first certified adapter is Prisma 8 PostgreSQL only.                                                                                                             | **LOCK**                                        | Upstream maturity matrix.                                                                                                                                                               |
| D-11 | Unsupported providers fail explicitly; no Prisma 7 fallback.                                                                                                                                 | **LOCK**                                        | Honest capability model and clean break.                                                                                                                                                |
| D-12 | Capabilities are static declared tags, not runtime negotiation.                                                                                                                              | **LOCK**                                        | Minimum kernel; prevents abstraction growth.                                                                                                                                            |
| D-13 | Provider registry is composition-root data, never global/public mutable registry.                                                                                                            | **LOCK**                                        | A10 and service-locator refusal.                                                                                                                                                        |
| D-14 | Stable target ID, not engine/provider, owns connection/output/runtime/migrations/receipts.                                                                                                   | **LOCK**                                        | Repairs same-provider collision.                                                                                                                                                        |
| D-15 | Target selection is explicit; selection expands dependency closure and records omissions.                                                                                                    | **LOCK**                                        | No fallback/silent skip; market recovery lessons.                                                                                                                                       |
| D-16 | Replicas are target roles, not migration targets.                                                                                                                                            | **LOCK**                                        | Prevents accidental mutation of readers.                                                                                                                                                |
| D-17 | Provider-native contract spaces plus NetScript contribution policy replace copied fragments.                                                                                                 | **LOCK**                                        | Ownership/history/provenance.                                                                                                                                                           |
| D-18 | One managed owner per `ObjectKey`; augmentation requires owner grant.                                                                                                                        | **LOCK**                                        | Text collision is not ownership.                                                                                                                                                        |
| D-19 | Pinned mirrors make production apply/verify independent of installed plugin packages.                                                                                                        | **LOCK**                                        | Contract-space deployment property.                                                                                                                                                     |
| D-20 | Detach-and-retain is guaranteed removal; archive/drop are conditional.                                                                                                                       | **LOCK**                                        | RC extension removal gap.                                                                                                                                                               |
| D-21 | Standard Schema is public; runtime bounded interpretation is default.                                                                                                                        | **LOCK**                                        | Maintainer direction plus source proof.                                                                                                                                                 |
| D-22 | Public validation representations are `runtime` and `json`; driver wire is internal.                                                                                                         | **LOCK**                                        | Three-channel codec source.                                                                                                                                                             |
| D-23 | Full Prisma operation validation is not contract-derived; explicit operation contributors are required.                                                                                      | **LOCK**                                        | Phantom operation maps erased at runtime.                                                                                                                                               |
| D-24 | Unknown validation metadata fails at schema construction.                                                                                                                                    | **LOCK**                                        | Fail-closed safety.                                                                                                                                                                     |
| D-25 | Optional AOT validation is semantic-equivalence-only and never required.                                                                                                                     | **LOCK**                                        | No second model universe.                                                                                                                                                               |
| D-26 | Pure operations cannot resolve connections or Aspire.                                                                                                                                        | **LOCK**                                        | Closes recorded architecture debt.                                                                                                                                                      |
| D-27 | Control API is programmatic; CLI/docs/agents project the operation catalog.                                                                                                                  | **LOCK**                                        | Eliminates log parsing/drift.                                                                                                                                                           |
| D-28 | Preview differs from executable plan; apply accepts only bound, revalidated plans.                                                                                                           | **LOCK**                                        | Market plan/apply evidence.                                                                                                                                                             |
| D-29 | NetScript owns policy/lock/recovery/receipt/cross-target saga; provider owns diff/lineage/marker mechanics.                                                                                  | **LOCK**                                        | Avoid both shell forwarding and migration-engine reinvention.                                                                                                                           |
| D-30 | Cross-target apply is never atomic; partial/unknown outcomes are first-class.                                                                                                                | **LOCK**                                        | Database reality and recovery prior art.                                                                                                                                                |
| D-31 | Local kernel does not implement hosted registry/RBAC/fleet/drift services.                                                                                                                   | **LOCK**                                        | Scope control.                                                                                                                                                                          |
| D-32 | Generated artifacts are minimal, content-addressed, atomic, and never text-patched.                                                                                                          | **LOCK**                                        | Retires current repair pipeline.                                                                                                                                                        |
| D-33 | Agent instructions are generated and every example is executed.                                                                                                                              | **LOCK**                                        | Upstream skill drift evidence.                                                                                                                                                          |
| D-34 | Existing MySQL/MSSQL/SQLite product support is not carried through compatibility code.                                                                                                       | **LOCK**                                        | Clean break; structured unsupported behavior.                                                                                                                                           |
| D-35 | Production plan signing is required.                                                                                                                                                         | **PRE-IMPLEMENTATION**                          | Key custody/algorithm can be chosen before W10, not before kernel work.                                                                                                                 |
| D-36 | Exact provider-native builder strategy and extension collection.                                                                                                                             | **LOCK; import spelling PRE-IMPLEMENTATION W3** | Current model-first callback, Candidate A, two-phase composition, const-preserving generated root, and no-re-export rule are source-audited; exact RC/GA subpath remains adapter-local. |
| D-37 | Multi-namespace capability claim.                                                                                                                                                            | **CONDITIONAL / upstream-blocking**             | RC1 and current main lower runtime namespaces but type maps flatten into default namespace; no cast workaround is allowed.                                                              |
| D-38 | App-owned fragments and plugin-owned spaces are distinct; plugin-owned tables default to full space ownership.                                                                               | **LOCK**                                        | Preserves literal native values while keeping migration history with the real owner.                                                                                                    |
| D-39 | One database-extension bundle supplies identity-matched authoring/control/runtime/validation facets through two-phase collection.                                                            | **LOCK**                                        | Prevents manual half-registration and helper-shape unsoundness.                                                                                                                         |
| D-40 | Migration/runtime in CI and production consume canonical verified artifacts, never arbitrary schema TypeScript.                                                                              | **LOCK**                                        | Prisma's migration system and even no-emit runtime cross the canonical artifact boundary.                                                                                               |
| D-41 | Exact Prisma control/runtime import allowlist and compatibility window.                                                                                                                      | **PRE-IMPLEMENTATION (W3)**                     | Adapter-local and intentionally version-pin dependent.                                                                                                                                  |
| D-42 | Lock implementation strategy (native advisory vs fenced row).                                                                                                                                | **PRE-IMPLEMENTATION PER PROVIDER**             | Public semantics are locked; mechanism is conformance-driven.                                                                                                                           |
| D-43 | AOT validator ships.                                                                                                                                                                         | **SAFE TO DEFER**                               | Runtime is sufficient; ship only for measured cold-start need.                                                                                                                          |
| D-44 | Second provider identity.                                                                                                                                                                    | **SAFE TO DEFER**                               | SPI is proven when a real requirement/mature provider exists.                                                                                                                           |
| D-45 | Raw/prepared/aggregate numeric public conveniences.                                                                                                                                          | **SAFE TO DEFER / adapter-local**               | Moving upstream semantics; native query surface remains accessible app-locally.                                                                                                         |
| D-46 | Archive/drop plugin retirement in v1.                                                                                                                                                        | **SAFE TO DEFER**                               | Retain path supplies safe lifecycle; destructive paths require proof.                                                                                                                   |
| D-47 | Remote approval/registry/continuous-drift integration.                                                                                                                                       | **SAFE TO DEFER**                               | Optional control-plane charter.                                                                                                                                                         |

There is no open decision that would force a package-boundary rewrite after PLAN-EVAL. D-37 is an
honest capability block: it prevents a Prisma PostgreSQL adapter from advertising sound
multi-namespace E2E typing, but it does not alter the provider-neutral manifest or package graph.

## 14. Conformance and release gates

Every behavioral feature crosses **type → composition/plan → provider artifact/SQL → result →
lifecycle/evidence**. A type-only or exit-code-only pass is not evidence.

### 14.1 Composition, typing, and artifacts

- Native TypeScript contract preserves model/query/result inference through the app binding.
- App-owned fragment composition preserves literal model/field/relation names under reordering; a
  widened registry fixture must fail its type-soundness gate.
- Plugin contribution compiles without slow-type erasure and publishes its plain descriptor plus
  artifact set.
- One extension bundle proves identical ID/version across authoring/control/runtime/validation, and
  a missing or mismatched facet fails composition.
- Same-provider targets have no shared paths, heads, connections, locks, bindings, or receipts.
- Every ownership/capability/dependency/contract-skew diagnostic has a negative test and structured
  `nextAction`.
- Resolve/emit twice from clean inputs yields byte-identical manifest/artifacts; interruption shows
  fully old or fully new roots only.
- Domain-only, extension-only, codec, provider, representation, selection, and default-sensitive
  changes invalidate the appropriate app binding/validation cache.
- Packed clean-consumer install resolves one exact Prisma component set and no off-allowlist import.
- Migration apply succeeds from canonical JSON/operations artifacts with application/plugin source
  TypeScript unavailable.
- Type-check/editor latency passes an agreed 500-model representative application budget.

### 14.2 Runtime and validation

- Real PostgreSQL (not only PGlite) proves connect/query/relation/transaction/cancel/stream/close,
  request/process scope, external pool where supported, and leak-free repeated lifecycle.
- Deno import graph has no unintended Node/CLI/toolchain reachability; deployment/bundler profiles
  named by the adapter pass.
- `runtime | json` corpus covers strings/numbers/booleans, Date, bigint, numeric string, bytes,
  JSON, domain enum/value set/native enum, null/list/dict/value object/union, and one custom codec.
- Every unsupported case in §7.3 fails constructing the schema with stable coordinates; invalid
  values return path-rich Standard Schema issues.
- Direct selection/result shapes are strict; computed/raw/unknown paths never pass through.
- App plus two extension spaces proves aggregate resolution and duplicate model names never collide.
- Standard Schema consumption is proven through at least two independent consumers (for example oRPC
  plus a form/validator integration), without generated Zod mirror files.
- If AOT exists, the full semantic corpus and cache invalidation suite is identical.

### 14.3 Control, migration, and recovery

- Offline emit succeeds with no Aspire/.NET/Docker/network.
- Non-default namespace selectors are honored; a silently ignored selector is a failure.
- Greenfield, populated adoption (marker-only), drift, destructive refusal, stale/expired plan,
  package/contract skew, lock contention/death, invariant transform, and external ownership pass.
- Connection loss after dispatch produces `outcome_unknown`; resume inspects marker/live state
  before action.
- Cross-target failure records all target/space phases and resumes only known-unfinished steps.
- Target/space selective recovery proves dependency closure, omitted reasons, and subsequent full
  verification.
- Plugin install/upgrade/dependency/skew/package-absent verify/detach-retain pass. Archive/drop are
  excluded until individually certified.
- Windows and Linux migration gates run; no gate asserts human message strings.

### 14.4 Doctrine, consumer, journey, and release

- Each new package is doctrine-registered and passes archetype F-1…F-19, scoped check/lint/fmt,
  `quality:scan`, `arch:check`, JSR audit, docs score, packed install, and public import tests.
- A3 lifecycle packages pass mandatory runtime/Aspire gates; A5 plugins pass thinness, base-seam,
  golden emitter, doctor, contract-soundness, and `scaffold.runtime` parity.
- Generated CLI/help/agent catalogs exactly match machine operation/diagnostic schemas; every
  example compiles and runs.
- Journeys: scaffold → second PostgreSQL target → two plugin spaces → plan/apply/deploy with no
  manual generated edit; and populated legacy adoption → zero DDL → verify.
- Cutover runs the full release-gate class and proves no legacy Prisma adapter, generated task,
  copied fragment, repair script, deep generated import, or compatibility alias remains.

## 15. Kill and switch criteria

### 15.1 Kill only the Prisma adapter

Keep the provider-neutral kernel but do not publish/switch to Prisma 8 if any remains true at the
adoption pin:

- Deno runtime/import purity requires vendoring or textual patching upstream.
- Packed provider artifacts cannot publish/install without unsupported slow-type or duplicate-
  component failures.
- Native TypeScript authoring cannot preserve app-local inference through a stable public builder
  seam.
- Contract emission cannot be deterministic and atomically installed.
- Programmatic control cannot produce enough structured information to bind plans, verify outcomes,
  and avoid terminal-text parsing.
- PostgreSQL marker/ledger advancement cannot be proven safe with migration effects.
- Contract spaces cannot prove disjoint ownership/package-free apply for app plus plugins.
- Required runtime lifecycle/transaction/error/cancellation behavior fails against real PostgreSQL.
- Upstream changes contract format without a viable migration path more than once before NetScript's
  first stable adapter release.

Switch to a different provider adapter only after it passes the same SPI conformance. Do not reopen
Prisma 7 compatibility.

### 15.2 Kill or narrow a subsystem

- If full-operation Standard Schema derivation would require reproducing Prisma's phantom type
  system, keep only model-value and known-result validation plus explicit contributors; this
  narrowing is already the plan, not a failure.
- If runtime interpretation misses cold-start budgets, test AOT equivalence; if equivalence fails,
  retain runtime and require explicit schemas at the affected boundary rather than shipping a
  divergent mirror.
- If provider-generic capability types grow into query abstractions or negotiation, delete them and
  keep literal static tags.
- If contribution archive/drop cannot be verified, ship detach-and-retain only.
- If the public provider SPI changes to accommodate hypothetical providers before a second adapter
  exists, revert to the smallest Prisma-exercised seam and defer generalization.

### 15.3 Architecture kill criteria

Reopen the RFC—not merely the adapter—if implementation proves that:

- a deterministic manifest cannot express one target/space composition without depending on live
  state;
- app-local type binding necessarily becomes a published framework slow type;
- target identity cannot stay provider-independent; or
- ownership/history cannot remain distinct from query/runtime types.

## 16. Unresolved items by gate

### Must resolve before PLAN-EVAL

None. The TypeScript/oRPC source audit closes the last package-boundary decision: current native
model-first `defineContract`, direct public authoring plus thin `defineDatabase`, two-phase
extension collection, const-preserving app-local fragment composition, plugin-owned full spaces by
default, and no provider re-export or copied overloads. PLAN-EVAL must verify these locks, not
reopen them from illustrative RC syntax.

### Must resolve before implementation wave

- W1: canonical manifest/digest encoding and public format-version policy.
- W3: exact Prisma import allowlist/version window, GA/RC pin, Deno/runtime matrix, native builder
  conformance, namespace capability status, extension-bundle facets, and adapter experimental
  status.
- W4: request/process lifecycle and transaction capability types.
- W5: plan signature schema, key custody before production, provider lock mechanism, receipt storage
  location/retention, and crash-fault injection harness.
- W7: initial augmentation grant vocabulary and executable contribution phase allowlist.
- W10: migration window, legacy branch support end date, and release rollback runbook.

### Safe to defer

- Any second provider; Prisma SQLite/Mongo/MySQL/SQL Server support.
- Runtime capability negotiation (rejected until a concrete case exists).
- AOT validation.
- Archive/drop plugin removal beyond retain.
- Public raw/prepared/aggregate convenience APIs.
- Hosted approvals/RBAC/registry/promotion/fleet/continuous-drift/secret services.
- Cross-database relations and transactions (explicitly unsupported, not future parity debt).

## 17. Conflict ledger and final recommendations

| Source position                                                         | Finding                                                    | Final recommendation                                                                                                                                                |
| ----------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Current-state audit: one database graph                                 | Correct need, risky runtime noun.                          | Private compiler graph; public resolved manifest.                                                                                                                   |
| Qwen: three durable artifacts                                           | Correct API-minimization pressure.                         | Three public responsibilities, five distinct artifact classes.                                                                                                      |
| Opus: nine-node package graph                                           | Correct doctrine separation, with one caution.             | Adopt graph in §4; do not build speculative direct-SQL contingency backend.                                                                                         |
| Opus/Qwen: provider-neutral kernel, PostgreSQL-only implementation      | Convergent.                                                | Lock.                                                                                                                                                               |
| Opus: full input/output runtime validation                              | Too broad after pinned-source audit.                       | Bounded algebra, three schema classes, fail closed.                                                                                                                 |
| Opus: runtime/wire                                                      | Incorrect public naming after codec audit.                 | Use `runtime` and `json`; driver wire is internal.                                                                                                                  |
| Qwen: generated validator provider                                      | Superseded by source proof and owner/maintainer direction. | Runtime interpreter default; optional equivalent AOT only.                                                                                                          |
| Opus: provider re-export of Prisma builder                              | Conflicts with doctrine and moving exact surface.          | Application imports native Prisma builder; provider adds wrapper/extension values only where publishable.                                                           |
| Owner: extend TypeScript schema like oRPC                               | Architecturally correct, mechanics differ.                 | Current native model-first builder + thin definition, const-preserving app-root composition, extension bundle fan-out; add DB-specific ownership/lineage/lifecycle. |
| TypeScript source: namespaces lower at runtime but flatten in type maps | Blocks a broad multi-schema claim.                         | Keep kernel axis, withhold adapter capability until no-cast type/runtime conformance passes.                                                                        |
| Prisma contract spaces solve removal                                    | Overclaim.                                                 | Ownership/history adopt; detach-retain first; archive/drop conditional.                                                                                             |
| Market analogies to Terraform/Atlas/Bytebase                            | Useful only with scope correction.                         | Import plan/recovery vocabulary; do not rebuild mutable/hosted control plane.                                                                                       |

**[PROPOSAL] Final recommendation.** Lock the architecture described here, then submit it to the
separate-session PLAN-EVAL before creating the canonical RFC. The canonical RFC should optimize for
one extraordinary user journey: author provider-native TypeScript contracts and NetScript
target/space policy once; obtain query types, lifecycle-owned sessions, Standard Schema
trust-boundary validation, migrations, runtime wiring, CLI/CI evidence, plugin ownership, and agent
context automatically—without a copied schema, manually synchronized type, hand-written adapter,
textual repair, or implicit target choice.

## 18. Local evidence register

- Current NetScript reality: [netscript-current-state.md](./netscript-current-state.md).
- Prisma RC/current source, issues, PRs, and maturity:
  [prisma-8-deep-dive.md](./prisma-8-deep-dive.md).
- Market comparators and corrected control-plane analogies:
  [market-analysis.md](./market-analysis.md) and [market-gap-audit.md](./market-gap-audit.md).
- Owner/maintainer validation exchange:
  [runtime-validation-maintainer-exchange.md](./runtime-validation-maintainer-exchange.md).
- Pinned-source validation feasibility/refusal boundary:
  [runtime-validation-source-audit.md](./runtime-validation-source-audit.md).
- Native TypeScript builder evolution, oRPC transfer, extension bundles, namespace blocker, and
  artifact boundary: [typescript-schema-orpc-audit.md](./typescript-schema-orpc-audit.md).
- Qwen adversarial minimal-kernel review:
  [qwen-prisma-risk-review.md](./qwen-prisma-risk-review.md).
- Claude Opus package/runtime/control/contribution review:
  [claude-opus-architecture-review.md](./claude-opus-architecture-review.md).
- Doctrine: `docs/architecture/doctrine/01-thesis-and-axioms.md`, `02-public-surface.md`,
  `05-folder-structure.md`, `06-archetypes.md`, `07-composition-and-extension.md`,
  `08-runtime-state-failure.md`, `09-anti-patterns-and-fitness-functions.md`, and
  `11-plugin-thinness-and-base-seams.md`.
- Harness Plan-Gate: `.llm/harness/gates/plan-gate.md` and
  `.llm/harness/gates/archetype-gate-matrix.md`.
