# Plan: NetScript Database Architecture and Prisma 8

## Run Metadata

| Field               | Value                                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Run ID              | `docs-database-architecture-rfc--prisma-8-rfc`                                                                       |
| Branch              | `docs/database-architecture-rfc`                                                                                     |
| Baseline            | `origin/main@cd720529333328bcba5e1a308ce7632f4350efdf`                                                               |
| Phase               | `plan-eval-ready`                                                                                                    |
| Target              | `rfcs/0000-database-architecture.md` plus harness provenance; no canonical RFC before PLAN-EVAL PASS                 |
| Current changeset   | Documentation/RFC under `SCOPE-docs.md`                                                                              |
| Future architecture | A1 contract, A2 control/provider integrations, A3 runtime, A4 definition/plugin DSL, A5 thin plugins, A6 testkit/CLI |

## Goal

Produce an implementation-grade, clean-break database architecture RFC whose first certified
provider is Prisma 8 PostgreSQL, while NetScript owns a provider-neutral composition, contribution,
runtime-lifecycle, validation, and operations system. The experience must eliminate copied schemas,
manually synchronized types, hand-wired clients/adapters, textual generated-source repair, implicit
target selection, Aspire-coupled pure work, terminal-log contracts, and hand-maintained agent
instructions.

## Scope

- Current-state, failure-history, doctrine/debt, Prisma RC/current-source, market, and agent-surface
  evidence.
- Exact durable vocabulary, artifact taxonomy, package/archetype/dependency graph, public versus
  adapter-local ownership, and refusal boundaries.
- Current model-first native Prisma TypeScript authoring, const-preserving app/plugin composition,
  contract spaces, extension bundles, app-local inferred bindings, and an E2E type flow.
- Bounded contract-derived Standard Schema validation for runtime and JSON representations,
  selection-aware results, codec contributions, fail-closed semantics, caching, and optional AOT
  equivalence.
- Multiple explicitly named targets, same-provider isolation, namespaces with honest capability
  gating, ownership policy, provider/runtime modes, and plugin lifecycle.
- Programmatic operation catalog, deterministic manifest, preview/plan/apply/verify state machines,
  provider locking, receipts, partial/unknown outcomes, resume, CI determinism, and generated agent
  surface.
- Clean adoption of populated databases, no-compat cutover, parallel branch/release-line strategy,
  implementation waves, conformance/release gates, kill criteria, and migration documentation.
- Required doctrine and debt consequences for the future implementation program.

## Non-Scope and Refusal Boundary

- Production package, CLI, plugin, or provider implementation in this RFC PR.
- Any backward-compatible facade, Prisma 7 client, legacy generated module, alias barrel, dual
  migration history, `setClient`, copied fragment, or runtime shim.
- A NetScript query DSL, generic repository, ORM, model language, or lowest-common-denominator
  portability API.
- Recreating Prisma's obsolete target/table/column fluent builder or re-exporting Prisma as though
  NetScript owns it.
- Runtime capability negotiation; capabilities are declared static data.
- Cross-database foreign keys, transparent joins, atomic transactions, or automatic rollback.
- Hosted control-plane products: RBAC, approval workflow, registries/promotion, fleet schedulers,
  continuous drift agents, KMS/secrets, notifications, or permanent audit servers.
- Claims that Prisma SQLite, MongoDB, MySQL, SQL Server, multi-namespace E2E typing, plugin
  archive/drop, AOT validation, or moving raw/prepared/aggregate conveniences are implemented.

## Doctrine Verdict and Axioms

The current `packages/database` is an A2 integration package marked Refactor. Its recorded AP-17
`interfaces/` rename is stale because source now uses `ports/`; the composition-root question is
still relevant. `DB-GENERATE-ASPIRE-COUPLING` is open and is closed structurally when pure
operations cannot resolve Aspire. Auth roadmap R1 independently requires deterministic plugin-aware
schema/migration automation and must converge on contract spaces rather than an auth-only generator.

Doctrine currently codifies plain `*.prisma` plugin fragments and does not register the proposed
packages in its gated denominator. The implementation program must amend
`docs/architecture/doctrine/06-archetypes.md` and `10-codebase-verdict-and-handoff.md` before new
packages land. This RFC records the target; it does not mutate doctrine before acceptance.

| Axiom | Application                                                                                                                                        |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1    | Public data/types and README examples precede implementation.                                                                                      |
| A2    | NetScript's stable surface stays smaller than Prisma internals.                                                                                    |
| A3    | The common author/compose/emit/plan/apply path is one deterministic flow.                                                                          |
| A5    | Targets, spaces, providers, extensions, runtime modes, and validators compose without inheritance.                                                 |
| A7    | Wrap Prisma and Standard Schema; do not rebuild an ORM or validator ecosystem.                                                                     |
| A8    | Definition, runtime, control, provider, and tooling responsibilities live in separate role-named packages/folders.                                 |
| A9    | Each future package has exactly one archetype; runtime is explicitly A3.                                                                           |
| A10   | Generated application composition roots bind providers/targets; no global registry/service locator.                                                |
| A11   | Extension axes are named as target, role, namespace, space, provider, capability, connection source, runtime scope, and validation representation. |
| A12   | Plan/apply/recovery, contribution lifecycle, and multi-target execution are explicit state machines.                                               |
| A13   | Runtime/control crash boundaries, cancellation, unknown outcomes, and supervision are explicit.                                                    |
| A14   | Conformance, publish, generated-project, journey, and release gates preserve the design.                                                           |

Applicable anti-patterns include AP-3 god ports, AP-4 cross-package implementation inheritance, AP-9
premature abstraction, AP-14 upstream re-export, AP-17 stale folder/debt tracking, AP-18 giant
generated snapshots, AP-24 engine switches, and AP-25 side effects outside edges. The RFC must also
reject service-location, widened native-fragment registries, source-text repair, message-string gate
assertions, implicit fallback selection, and arbitrary schema TypeScript during production apply.

## Locked Vocabulary and Artifact Taxonomy

| Term                                | Locked meaning                                                                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `DatabaseDefinition`                | Pure authored TypeScript composition of targets, spaces, connection-source references, policies, and native contracts.           |
| `NativeContract`                    | Provider-owned authored value, initially Prisma's model-first `defineContract` result.                                           |
| `SpaceContribution`                 | Declarative owner/version/dependency/capability/provenance/retention record for one contract space.                              |
| `ContractArtifact`                  | Canonical provider contract data/declaration, lineage, and provenance pinned per space.                                          |
| `DatabaseManifest`                  | Deterministic, versioned, content-addressed resolved snapshot; the durable join point. A graph is private compiler IR only.      |
| `AppBinding`                        | Generated application-local inferred bridge from native contract declarations to sessions, validators, and consumers.            |
| `TargetRef` / `TargetSession`       | Explicit target reference and process/request lifecycle shell; concrete provider query type is app-local.                        |
| `SpeculativePreview`                | Advisory output that cannot be approved or applied.                                                                              |
| `ExecutablePlan`                    | Expiring plan bound to manifest, target/space closure, live baseline, provider pins, policy, environment, and secret references. |
| `ProviderMarker` / `ProviderLedger` | Provider-owned authoritative applied migration state; not duplicated as NetScript mutable state.                                 |
| `OperationReceipt`                  | Immutable evidence/checkpoints, not desired state or a shadow database.                                                          |
| `OperationCatalog`                  | Machine names/classes/request/result/diagnostic/next-action catalog; CLI/docs/agents are projections.                            |
| `ValidationIR`                      | Internal bounded value/selection algebra producing Standard Schema values; never a second entity/query model.                    |

Declared identities are `TargetId`, `RoleRef`, `NamespaceRef`, `SpaceId`, `ObjectKey`,
`ContractSnapshotId`, `ManifestDigest`, `PlanId`, `RunId`, and `ReceiptId`. Provider names, engine
names, paths, config aliases, array order, traversal order, and discovery order are never identities
or dependency edges.

## Exact Future Package and Dependency Graph

| Unit                                  | Archetype   | Owns                                                                                                                                   | Must not own                                                                    |
| ------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `@netscript/database-contract`        | A1          | Plain identities, manifests/plans/receipts/diagnostics, capabilities, ownership, shared small SPIs.                                    | IO, query types, provider imports.                                              |
| `@netscript/database`                 | A4          | `defineDatabase`, target/space/policy definitions, pure compiler/resolver, frozen definitions.                                         | Connections, provider/Aspire imports, execution.                                |
| `@netscript/database-runtime`         | A3          | Process/request lifecycle, binding, connection ownership, health/readiness, cancellation, validation coordination.                     | Migration orchestration, CLI, provider query vocabulary.                        |
| `@netscript/database-control`         | A2          | Programmatic classify/compose/emit/preview/plan/apply/verify/inspect, provider ports, locks, receipts, recovery, cross-target saga.    | Provider SQL/AST/types, terminal text, CLI rendering.                           |
| `@netscript/database-prisma-postgres` | A2          | Sole framework runtime/control Prisma boundary, capability descriptor, artifact/control/runtime/validation adapters, import allowlist. | Prisma re-export, private-type public surface, hand-written low-level driver.   |
| `@netscript/database-testkit`         | A6          | Runnable provider/space certification and machine reports if a binary is justified.                                                    | Application runtime dependency. Reconsider split before W1 if no binary exists. |
| `@netscript/plugin`                   | Existing A4 | Plain `defineDatabaseSpace` contribution seam and legacy-surface removal.                                                              | Provider/runtime/control dependency.                                            |
| First-party `plugins/*`               | Existing A5 | Thin descriptors and generated contract/lineage assets sourced from `-core`.                                                           | Copied app schema or convention-bearing DB implementation.                      |
| `@netscript/aspire`                   | Existing A2 | Narrow connection-source/provisioning adapter.                                                                                         | Requirement for pure/non-Aspire operations.                                     |
| `@netscript/cli`                      | Existing A6 | Operation-catalog projection, adoption codemod, generated help/agent assets.                                                           | Database/provider business logic.                                               |

Dependency law:

```text
@netscript/database-contract
  <- @netscript/database
  <- @netscript/database-runtime
  <- @netscript/database-control
  <- @netscript/plugin

chosen provider implements runtime/control SPIs and is supplied by the app composition root
@netscript/database-testkit may depend on all public SPIs; no runtime package depends on it
application/plugin controlled-build schema modules may import Prisma's public authoring builder
```

No framework package re-exports Prisma. Runtime/control Prisma imports exist only inside the
PostgreSQL adapter. App/plugin native authoring imports are controlled build inputs; deployments use
their plain canonical artifacts.

## Public Surfaces, Ports, and Closed Vocabularies

### Public surfaces

- Candidate A is the baseline: native current model-first Prisma `defineContract`, then thin
  `defineDatabase({ contract, ... })` or `defineDatabaseSpace({ contract, ... })` preserving
  `typeof contract` unchanged.
- An optional policy factory exists only if it forwards exact native helpers without private
  imports, copied overloads, or inference widening; otherwise it is killed.
- `ownership: app` fragments return const-preserved native builder values and are composed by an
  explicit generated root. `ownership: space` contributions own a full contract artifact and
  migration head; this is the default for plugin-owned tables.
- One identity/version-checked `DatabaseExtension` bundle fans authoring, control, runtime, and
  validation facets through two-phase collection.
- `TargetRef`/session handles expose lifecycle and a narrow query generic. Application-owned stores
  receive concrete sessions at composition roots; NetScript does not generate repositories.
- Standard Schema is public. Schema classes are model value, explicitly contributed operation input,
  and fully known selection/result. Public representations are `runtime` and `json`.
- Control requests/results/plans/receipts/diagnostics are plain NetScript data. Human CLI text is
  never a contract.

### Consumed ports

Each port stays at three or four cohesive methods and has at least two exercised implementations or
a concrete external seam:

- `ContractArtifactSource` / atomic artifact publisher for controlled native evaluation and pinned
  mirrors.
- `ProviderRuntimeFactory` for scope-correct sessions and lifecycle.
- `ProviderControl` for emit/inspect/plan/apply/verify translation.
- `ConnectionSource` for environment/Aspire/secret-reference resolution.
- `MigrationLock`/provider lock capability with owner/nonce/fencing evidence.
- `ReceiptSink` for atomic immutable checkpoint evidence.
- `Clock`/ID/signature policy only where deterministic testing or production approval requires it.

Provider registries are immutable composition-root values, not public global registries. Concrete
Prisma control/runtime/contract/codec/AST shapes stay adapter-local.

### Closed vocabularies

- Ownership: `managed`, `adopted`, `external`, `ignored`.
- Runtime scope: `process`, `request`.
- Validation representation: `runtime`, `json`; driver wire is internal.
- Operation class: `pure`, `live-read`, `mutating`, `resident`.
- Plan status: speculative, inspected, planned, policy-refused/allowed, approved, ready, expired,
  stale, revoked.
- Receipt phases/outcomes: planned, acquiring-lock, locked, revalidating, started, applying,
  applied, verifying, verified, succeeded, refused, skipped, failed, partial-success,
  cleanup-required, outcome-unknown, cancelled.
- Ownership/removal initial guarantee: detach-and-retain; archive/drop are capability-conditional.
- Capabilities are open namespaced IDs but static declared data; no runtime negotiation protocol.

## Locked Decision Ledger

| ID   | Decision                                                                                                                               | Status                                 |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| D-01 | Clean break; no backward-compatibility API/runtime surface.                                                                            | Locked                                 |
| D-02 | Data continuity and mechanical migration are mandatory.                                                                                | Locked                                 |
| D-03 | Durable join point is `DatabaseManifest`; live graph is private compiler IR.                                                           | Locked                                 |
| D-04 | Definition, manifest, executable plan, provider ledger, and receipt remain separate values.                                            | Locked                                 |
| D-05 | NetScript defines no query DSL, repository, or portable client facade.                                                                 | Locked                                 |
| D-06 | Current native model-first Prisma TypeScript authoring is primary; obsolete fluent chaining is not recreated.                          | Locked; import spelling adapter-pinned |
| D-07 | Candidate A native contract plus thin definition is baseline; optional factory dies on private imports/overload copying/type widening. | Locked                                 |
| D-08 | App-specific inferred binding is generated app-local, never a kernel package export.                                                   | Locked                                 |
| D-09 | Package/archetype graph above is exact; runtime is A3.                                                                                 | Locked                                 |
| D-10 | Kernel is provider-neutral; first certified adapter is Prisma 8 PostgreSQL only.                                                       | Locked                                 |
| D-11 | Unsupported providers fail explicitly; no Prisma 7 fallback.                                                                           | Locked                                 |
| D-12 | Capabilities are static tags/requirements, never runtime negotiation.                                                                  | Locked                                 |
| D-13 | Provider registry is composition-root data, never global/public mutable state.                                                         | Locked                                 |
| D-14 | Stable target ID owns connection, output, runtime, migrations, locks, and receipts.                                                    | Locked                                 |
| D-15 | Target selection is explicit, dependency-closed, and records every omission/reason.                                                    | Locked                                 |
| D-16 | Replicas are roles of a target, never migration targets.                                                                               | Locked                                 |
| D-17 | Provider-native contract spaces plus NetScript policy replace copied fragments.                                                        | Locked                                 |
| D-18 | One managed owner per `ObjectKey`; augmentation requires owner grant.                                                                  | Locked                                 |
| D-19 | Pinned mirrors make apply/verify independent of installed plugin code.                                                                 | Locked                                 |
| D-20 | Detach-and-retain is guaranteed removal; archive/drop are conditional.                                                                 | Locked                                 |
| D-21 | Standard Schema is public; bounded runtime interpretation is default.                                                                  | Locked                                 |
| D-22 | Public validation representations are `runtime` and `json`; driver wire is internal.                                                   | Locked                                 |
| D-23 | Complete Prisma operation validation is not contract-derived; exact operation contributors are required.                               | Locked                                 |
| D-24 | Unknown validation metadata fails while constructing the schema.                                                                       | Locked                                 |
| D-25 | Optional AOT validation is corpus-equivalent only and never required.                                                                  | Locked                                 |
| D-26 | Pure operations cannot resolve connections, Aspire, Docker, or network.                                                                | Locked                                 |
| D-27 | Programmatic operation catalog is primary; CLI/docs/agents are generated projections.                                                  | Locked                                 |
| D-28 | Preview is not executable plan; apply accepts only bound/revalidated plans.                                                            | Locked                                 |
| D-29 | NetScript owns policy/lock/recovery/receipts/cross-target saga; provider owns diff/lineage/marker mechanics.                           | Locked                                 |
| D-30 | Cross-target apply is never atomic; partial and unknown outcomes are first-class.                                                      | Locked                                 |
| D-31 | Local kernel does not rebuild hosted registry/RBAC/fleet/drift products.                                                               | Locked                                 |
| D-32 | Generated artifacts are minimal, content-addressed, atomic, and never text-patched.                                                    | Locked                                 |
| D-33 | Agent instructions/catalogs are generated and every example executes.                                                                  | Locked                                 |
| D-34 | Existing MySQL/MSSQL/SQLite support is not carried through compatibility code.                                                         | Locked                                 |
| D-35 | Production plans require signatures; mechanism/key custody is selected before production cutover.                                      | Pre-implementation W5/W10              |
| D-36 | Model-first callback, Candidate A, two-phase collection, const-preserving root, and no-re-export rule define builder strategy.         | Locked; exact RC/GA path W3            |
| D-37 | Multi-namespace adapter capability is withheld while Prisma type maps flatten runtime namespaces; no cast workaround.                  | Conditional upstream block             |
| D-38 | App-owned fragments and plugin-owned spaces are distinct; plugin tables default to full space ownership.                               | Locked                                 |
| D-39 | One extension bundle supplies identity-matched authoring/control/runtime/validation facets.                                            | Locked                                 |
| D-40 | CI/production migration and runtime consume canonical verified artifacts, not arbitrary schema TypeScript.                             | Locked                                 |
| D-41 | Exact Prisma control/runtime import allowlist and compatibility window are selected in W3.                                             | Pre-implementation W3                  |
| D-42 | Native advisory versus fenced-row lock is certified per provider.                                                                      | Pre-implementation provider detail     |
| D-43 | Whether AOT validation ships is safe to defer.                                                                                         | Deferred                               |
| D-44 | A real second provider is safe to defer.                                                                                               | Deferred                               |
| D-45 | Public raw/prepared/aggregate conveniences are safe to defer/keep adapter-local.                                                       | Deferred                               |
| D-46 | Archive/drop plugin retirement in v1 is safe to defer.                                                                                 | Deferred                               |
| D-47 | Remote approval/registry/continuous-drift integrations are safe to defer.                                                              | Deferred                               |

No must-resolve-now decision remains. Pre-implementation items have stable public semantics and
cannot force a package-boundary rewrite. D-37 withholds a capability claim rather than blocking the
provider-neutral architecture.

## Control and Contribution State Machines

- Composition: authored → resolving → resolved(manifest, warnings) or refused(diagnostics), as a
  pure total `Result`.
- Planning: resolved → speculative preview or baseline inspection → executable plan → policy →
  approval/signature → ready, with expired/stale/revoked refusal branches.
- Apply: planned → lock → revalidate → start → checkpoint each irreversible step/group → applied →
  verify → succeeded; refusal, skip, failure, partial-success, cleanup-required, cancellation, and
  outcome-unknown are explicit.
- Resume always inspects live state/provider ledger and revalidates bindings before action; it never
  blindly replays unknown non-idempotent work.
- Multi-target execution is a dependency-ordered saga with separate runners/locks and complete
  per-target/per-space outcomes.
- Contribution lifecycle: install, upgrade, skew refusal, detach, retain, conditional archive/drop.
  App-owned fragments compose into the app space; plugin-owned tables default to full spaces with
  independent artifacts/heads. Extension facets install as one identity/version-checked bundle.

## Runtime Validation Boundary

The internal supported algebra is registered scalar codecs, nullability, lists, dictionaries, value
objects, resolvable unions, value sets/enums/native enums, integrity-checked cross-space relations,
whole-model values with explicit presence policy, and direct-column result projections with complete
alias/codec/nullability/representation metadata.

Construction fails with stable `DB_VALIDATION_UNSUPPORTED` coordinates for unknown/missing codec
schemas, pack kinds, cross-space refs/heads, ambiguous unions/variants, missing Prisma operation
grammar, computed/subquery/raw/aggregate/include/unknown results, opaque checks, database-state
constraints, and incompatible async predicates. Invalid values return Standard Schema issues; they
do not throw. Cache identity includes canonical full-contract digest, schema version, space,
target/family, normalized operation/selection, representation, interpreter ABI, codec/pack
identity/version, and execution identity when defaults matter.

## Provider and Target Matrix

| Case                                   | Architecture                                                         | First adapter claim                                       |
| -------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------- |
| Two PostgreSQL databases               | Named targets with isolated artifacts/runtime/ledger/locks/receipts. | Required.                                                 |
| Multiple PostgreSQL namespaces         | First-class kernel axis.                                             | Withheld until no-cast Prisma type/runtime parity passes. |
| Writer/read replicas                   | Roles on one target.                                                 | Conditional runtime capability; readers cannot migrate.   |
| App plus plugin spaces                 | Independent ownership/artifacts/heads/dependency order.              | Required.                                                 |
| Managed/adopted/external/ignored       | Ownership-aware plan/verify/drift.                                   | Required.                                                 |
| Process/request scope                  | Distinct lifecycle/capability types.                                 | Required.                                                 |
| Prisma SQLite/MongoDB/MySQL/SQL Server | Provider/family axis remains open.                                   | Explicitly unsupported/deferred; no fallback.             |
| Cross-target relation/transaction      | Not representable.                                                   | Structured composition refusal.                           |
| Provider-specific queries              | Native app-local provider surface.                                   | No portable wrapper.                                      |

## Clean Cutover

`netscript db adopt` is a temporary codemod/tool, not compatibility. It reads legacy config/layout,
generates explicit target definitions from config keys, introspects reachable databases, proposes
object ownership, hard-stops on unattributed objects, compiles/emits canonical artifacts, writes
baseline marker metadata only, verifies zero drift, and then deletes the old engine workspaces, the
42 per-workspace generated `db:*` task keys, copied fragments, repair scripts, adapters, and
dependencies. Baseline establishment performs zero table/data DDL/DML.

Old/new stacks may coexist on separate branches/release lines while features are developed, but one
application never composes both. Before first new apply, rollback is repository-only plus idempotent
marker cleanup where supported. After apply, recovery is forward via lineage and receipts.

## Implementation Waves

| Wave | Scope                                                                                                                                            | Dependency | Exit evidence                                                                        |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------ |
| W0   | Accepted RFC, doctrine/verdict amendments planned, package/gate registration.                                                                    | —          | RFC gates and architecture acceptance.                                               |
| W1   | A1 contract kernel.                                                                                                                              | W0         | Zero-provider-dependency publish/doc/consumer gates.                                 |
| W2   | A4 definition/compiler and manifest invariants.                                                                                                  | W1         | Pure deterministic property/negative tests; no IO.                                   |
| W3   | Experimental Prisma PostgreSQL spike: native builder, artifacts, control/runtime, spaces, extensions, validation decoder, Deno, namespace check. | W1–W2      | Real PostgreSQL, packed Deno, import allowlist, kill/switch review.                  |
| W4   | A3 runtime and Aspire connection adapter.                                                                                                        | W1–W3      | Lifecycle/leak/cancellation/scope/validation gates.                                  |
| W5   | A2 control, plans, locks, receipts, recovery, cross-target saga.                                                                                 | W1–W4      | Failure injection, atomic emit, pure path without Aspire.                            |
| W6   | A6 provider/space conformance testkit.                                                                                                           | W1–W5      | Intentionally broken fixtures fail; real-service machine report.                     |
| W7   | `@netscript/plugin` contribution seam and first plugin-core fixture.                                                                             | W1–W6      | Breaking surface and thinness/seam/package-free gates.                               |
| W8   | CLI/agent/adoption projection.                                                                                                                   | W2, W5–W7  | Generated examples/catalog freshness, populated adoption preflight.                  |
| W9   | First-party auth/workers/sagas/triggers spaces.                                                                                                  | W7–W8      | Each space certified; package-free apply/verify and runtime parity.                  |
| W10  | Clean cutover and legacy deletion.                                                                                                               | W1–W9      | Full release class, Windows/Linux, production-shaped adoption, remote published E2E. |
| W11  | Second real provider only when demanded/mature.                                                                                                  | W10        | Same provider conformance; no kernel/manifest public rewrite.                        |

## RFC Commit Slices

| # | Slice and proof                                                                                                                                    | Gate                                                                                              | Files                                                                                   |
| - | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 0 | Harness bootstrap and draft review surface.                                                                                                        | Artifact presence, scoped format/diff; already landed.                                            | Run root artifacts.                                                                     |
| 1 | Current research corpus and Plan-Gate lock are complete.                                                                                           | Research/source/claim index, planned JSR audit, scoped format/diff, PLAN-EVAL input completeness. | `research.md`, `research/*.md`, `plan.md`, `worklog.md`, `context-pack.md`, `drift.md`. |
| 2 | Independent PLAN-EVAL accepts the locked plan before RFC authorship.                                                                               | Fresh separate-session evaluator `PASS`.                                                          | `plan-eval.md`, planning artifacts only.                                                |
| 3 | Canonical RFC defines vocabulary, APIs, package graph, TypeScript/E2E types, validation, control, contributions, providers, and refusal boundary.  | Source alignment, local-link/terminology/docs format, decision coverage.                          | `rfcs/0000-database-architecture.md`, run context/worklog.                              |
| 4 | RFC completes adoption/cutover, implementation waves, exhaustive conformance/release matrix, market implications, risks, and kill/switch criteria. | Requirement/decision trace, migration safety, claim/source audit, docs gates.                     | Same RFC plus run context/worklog.                                                      |
| 5 | Independent Qwen/Grok/adversarial findings are resolved with no open critical/high issue.                                                          | Qwen review disposition; Grok 4.6 high observable route receipt; source audit.                    | RFC plus review/run artifacts.                                                          |
| 6 | Separate-session IMPL-EVAL accepts the complete RFC.                                                                                               | Evaluator `PASS`; no self-certification.                                                          | `evaluate.md`, RFC/run artifacts.                                                       |
| 7 | Owner-directed Fable 5 high performs the absolute final substantive refinement; publish the final review state.                                    | Fable refinement, docs static checks only afterward, commit/push/PR trail.                        | RFC and final run/handoff artifacts.                                                    |

There are eight ordered slices, below the Plan-Gate limit. The canonical RFC does not exist before
Slice 2 passes. Fable 5 high is the last substantive model gate; only mechanical static verification
may follow.

## Gate Set

### Plan and research gates

- Run-root `research.md` current-main rebaseline and complete report/source index.
- Every load-bearing numeric/factual claim is pinned to NetScript baseline, Prisma RC tag, post-RC
  object, or official primary source; corrected claims are not copied from independent reports.
- Locked D-01–D-47, no must-resolve-now item, ordered slices, risks, gates, deferred scope, doctrine
  implications, and implementation waves.
- Separate-session PLAN-EVAL using the harness plan protocol; hard stop until `PASS`.

### Current docs/RFC gates

- `SCOPE-docs.md`: source alignment, current/target scope separation, local-link/path integrity,
  doctrine/glossary terminology, and drift recording.
- Targeted `deno fmt --check` and `git diff --check` for run/RFC Markdown.
- Claim/source ledger, contradiction scan, decision-to-section trace, migration-safety trace, and
  generated/local example syntax review.
- Canonical RFC template/process/front matter and implementation-grade API/state-machine/matrix
  coverage.
- No production package/runtime gate is claimed by a docs-only RFC.

### Future archetype and source gates

- Per future unit, required F-1…F-19 by the archetype matrix; A3 has required runtime gates, A5
  required plugin/runtime parity, A6 applicable F-CLI family.
- Scoped check/lint/fmt, `quality:scan`, `arch:check`, public surface/subpath audit, naming/folder/
  layering/inheritance/upstream-re-export/permission/test-shape gates.
- Provider import allowlist, exact single Prisma component set, Deno import purity, no toolchain in
  runtime graphs, real PostgreSQL, lifecycle/leak/cancellation/transaction/error/redaction gates.
- Deterministic/atomic emission, stale digest refusal, canonical-artifact-only migration, target/
  namespace/space isolation, locks, crash/unknown/resume, ownership/removal, and negative diagnostic
  matrices.
- App fragment literal-type preservation, extension-bundle facet identity, namespace type/runtime
  parity, 500-model editor/type-check budget, and no private/cast workaround.
- Standard Schema runtime/JSON corpus, two independent consumers, selection-aware outputs,
  fail-closed unsupported cases, contract-space aggregation, and optional AOT equivalence.
- Generated project journeys, agent/help catalog freshness, executable examples, and full
  `scaffold.runtime` when DB/scaffold/Aspire/plugin wiring changes.

### Prospective JSR gates

The planned JSR audit verdict is **PASS-AS-PLANNED / NOT ACTUAL PUBLISH READINESS**. The six new
packages do not exist, so `deno publish --dry-run`, `deno doc --lint`, publish-file inspection, and
packed/remote install are **N/A now**, never recorded as PASS.

At implementation each unit requires: scoped manifest metadata/license/description, explicit export
map and include whitelist, test/fixture exclusions, `@module` docs and runnable examples, 100%
stable symbol docs target, explicit public declarations, relative same-package imports, ESM/Deno
purity, no HTTP/CommonJS/top-level filesystem assumptions, generated-asset freshness,
`deno doc --lint` zero diagnostics, `deno publish --dry-run` without `--allow-slow-types`, inspected
publish list, public import tests, clean packed consumer install, `quality:scan`, and `arch:check`.

Publishable generated assets are checked-in deterministic TypeScript constants unless an
authenticated registry canary proves JSON/import-attribute limitations resolved. W10 additionally
requires release preflight, GitHub OIDC/SLSA provenance, authenticated canary, registry settings
reconciliation, and production `e2e-cli-prod` against exact published JSR versions. Local dry-run or
packed install cannot substitute for the remote-graph verdict.

### Review/evaluator order

1. PLAN-EVAL: fresh Fable 5 medium separate session, `PASS` before RFC.
2. Root/source/doctrine audit during drafting; no generator self-certification.
3. Independent Qwen findings disposition and Grok 4.6 high adversarial complete-RFC review.
4. IMPL-EVAL: fresh separate evaluator session.
5. Fable 5 high final in-place refinement as the absolute last substantive gate.
6. Mechanical format/link/diff checks, commit/push, and PR handoff only.

## Risk Register

| Risk                                                   | Mitigation / kill response                                                                                             |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Designing to RC marketing or stale builder screenshots | Pin source; current model-first API; keep exact paths adapter-local; W3 spike.                                         |
| Upstream changes during RFC/implementation             | RC/current split, exact provider pin/allowlist, independent provider release, compatibility-window gate.               |
| Replacing glue with a second ORM/control plane         | No query/model DSL, no runtime negotiation, no hosted services, small SPIs and refusal boundary.                       |
| Published slow types or Prisma leakage                 | App-local inference; no re-export/private imports; isolated declarations; no slow-types waiver; prospective JSR gates. |
| Native fragment composition widens inference           | Two-phase explicit const-preserving generated root; compile-failure soundness fixtures and editor budget.              |
| False multi-schema claim                               | Withhold capability until Prisma type/runtime parity passes without casts.                                             |
| Contract-derived validation overclaims full operations | Bounded algebra, explicit contributors, runtime/JSON split, fail at schema construction.                               |
| Custom codec accepts invalid values                    | Mandatory representation-specific value schemas; encode/decode is not validation.                                      |
| Stale or half-published artifacts                      | Full canonical digest, atomic publish, facet identity, runtime/apply mismatch refusal.                                 |
| Plugin removal destroys data                           | Retain default; archive/drop conditional destructive plan; no directory-delete semantics.                              |
| Provider spaces mistaken for complete portability      | PostgreSQL-only certification; explicit unsupported targets; native capability surface.                                |
| Apply success/exit code masks partial work             | Typed per-target/space outcomes, immutable checkpoints, `outcome-unknown`, inspect-before-resume.                      |
| Cross-target atomicity/rollback implied                | Saga language only; no global transaction; complete partial-success receipt.                                           |
| Mutable receipts become shadow state                   | Provider ledger remains authority; receipts are append-only evidence.                                                  |
| No-compat cutover causes data loss                     | Ownership preflight, marker-only adoption, zero-DDL rehearsal, forward recovery, parallel release line only.           |
| JSR plan mistaken for actual readiness                 | Explicit N/A now; per-package dry-run/docs/packed/canary/remote E2E receipts required later.                           |
| RFC breadth becomes unimplementable                    | Exact packages, W0–W11 dependencies, per-wave exits, kill/switch criteria.                                             |
| Agent/docs drift                                       | Generate from operation catalog/manifest and execute every example.                                                    |
| CI remains long/flaky                                  | Pure/offline paths, digest caching, real-service gates only at bounded stages, atomic structured receipts.             |

## Kill and Switch Criteria

Do not publish/switch to Prisma 8 if Deno requires vendoring/text patching; public packages cannot
pass without slow types/private imports; native inference widens; controlled authoring is
non-deterministic; canonical emit is non-atomic; control cannot produce structured bound plans and
results; marker/ledger advancement is unsafe; contract spaces cannot prove disjoint/package-free
operation; real PostgreSQL lifecycle fails; or upstream contract churn lacks a migration path.

Narrow validation rather than rebuild Prisma types; retain runtime interpretation if AOT equivalence
fails; delete capability abstractions that grow into queries; ship detach-and-retain if destructive
removal cannot be certified; defer a generic SPI change until a second real provider needs it.
Reopen the architecture only if a deterministic manifest depends on live state, app inference
necessarily becomes published slow types, target identity cannot remain provider-independent, or
ownership/ history cannot remain separate from query/runtime types.

## Open-Decision Sweep

### Must resolve now

None.

### Must resolve before implementation wave

- W1: canonical manifest/digest encoding and public format-version evolution.
- W3: exact Prisma pin/import allowlist/public builder subpath, runtime/Deno matrix, extension facet
  mappings, namespace capability result, and experimental publication status.
- W4: concrete request/process scope and transaction capability shapes.
- W5/W10: signature format/key custody, provider lock implementation, receipt storage/retention, and
  crash-fault harness.
- W7: initial augmentation grant vocabulary and executable contribution phase allowlist.
- W10: migration window, parallel legacy branch end date, rollback/runbook, remote release evidence.

These are mechanism/version/release decisions behind locked public semantics and cannot force a
package-boundary rewrite.

### Safe to defer

Second provider; Prisma SQLite/MongoDB/MySQL/SQL Server; runtime capability negotiation; AOT
validation; archive/drop removal; public raw/prepared/aggregate conveniences; hosted control-plane
services; cross-database relation/transaction support (explicitly unsupported rather than parity
debt).

## Deferred Implementation Scope

All W1–W11 production code, doctrine mutation, package publication, provider certification, plugin
migration, legacy deletion, release-line operation, and hosted integrations are deferred to
post-acceptance implementation programs. This RFC must specify them precisely but does not claim
their gates have run.

## Dependencies and Drift Watch

- Current NetScript baseline, issue/PR history, doctrine, debt, RFC process, and harness protocols.
- Prisma RC1/pinned current source, official release/ADRs/scorecard/issues/PRs, plus a fresh pin
  check during RFC drafting and W3.
- Standard Schema and current NetScript oRPC/Fresh/plugin composition precedents.
- Drift watch: Prisma RC/API/contract changes; namespace typing; moving control/runtime paths;
  NetScript DB changes merged to main; model route identity; any compatibility or hosted-control-
  plane creep; any package surface requiring slow types.

## Plan-Gate Readiness

- Research is current and indexed in `research.md`.
- D-01–D-47 are locked/classified; no must-resolve-now decision remains.
- Eight ordered RFC slices name proof/gates/files.
- Risk, deferred scope, doctrine/debt, future package/JSR/source/consumer gates, and waves are
  explicit.
- Prospective JSR audit is applied honestly as planning evidence, with actual dry runs N/A.
- The next action is a fresh separate-session PLAN-EVAL. Canonical RFC authorship remains blocked
  until `PASS`.
