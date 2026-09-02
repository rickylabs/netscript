# Lead-author briefing — canonical NetScript database architecture RFC

You are the single lead author for NetScript's canonical database architecture RFC. Work in:

`/home/codex/repos/netscript-db-rfc`

Use native Claude Code Opus 5 with high effort. You own the RFC's structure, technical coherence,
prose, API design, and final internal consistency. Do not delegate RFC sections or merge
independently authored prose. You may use read-only search and analysis workflows, but the canonical
document must have one architectural voice.

PLAN-EVAL cycle 2 passed. It is the final Plan-Gate cycle. The owner has ended pre-writing loops: do
not start, request, or simulate another PLAN-EVAL. Begin canonical RFC authorship now. Architecture
diversity happens against the completed draft, not before it.

## Mission

Write:

`rfcs/0000-database-architecture.md`

This is not a narrow Prisma 7→8 migration note. It is a clean-slate replacement for NetScript's
inherited database foundation, using Prisma Next where it is mature while introducing a genuine
NetScript database layer.

The RFC must make the intended developer experience concrete:

- Pure TypeScript, native Prisma contract authoring.
- A thin, inference-preserving NetScript layer analogous in spirit to NetScript's oRPC extension
  approach.
- No hand-maintained schema mirrors, copied plugin fragments, repair scripts, provider-specific
  workspace forests, manually synchronized validators, or CLI-only orchestration.
- Explicit multi-target, contract-space, ownership, migration, runtime, validation, plugin, and
  operational semantics.
- A provider-neutral kernel with one first certified adapter: Prisma 8 PostgreSQL.
- A clean break with no compatibility API, Prisma 7 fallback, dual runtime, legacy adapter facade,
  or in-application mixed stack.
- Mechanical adoption and data continuity without backwards compatibility.

The RFC must be implementation-grade: an implementer should be able to derive package work, public
types, state transitions, test matrices, refusal behavior, and release gates without inventing
architecture.

## Editing scope

Edit only:

- `rfcs/0000-database-architecture.md`

The root owns all run bookkeeping. Do not edit `plan.md`, `research.md`, `worklog.md`,
`context-pack.md`, `drift.md`, `supervisor.md`, anything under `research/` or `briefs/`,
`plan-eval.md`, independent model reports, production packages, doctrine, or existing RFCs. Do not
commit or push.

## Required source order

Read these completely before drafting:

1. `AGENTS.md`, `SCOPE-docs.md`, `rfcs/README.md`, and `rfcs/0000-template.md`.
2. Run-root `research.md`, `plan.md`, `worklog.md`, `context-pack.md`, `drift.md`, `supervisor.md`,
   and the now-`PASS` cycle-2 `plan-eval.md`.
3. `research/architecture-plan-synthesis.md` as the reconciled decision source.
4. The two priority source audits, in full:
   - `research/typescript-schema-orpc-audit.md`
   - `research/runtime-validation-source-audit.md`
5. Every remaining supporting report:
   - `research/netscript-current-state.md`
   - `research/prisma-8-deep-dive.md`
   - `research/runtime-validation-maintainer-exchange.md`
   - `research/market-analysis.md`
   - `research/market-gap-audit.md`
   - `research/planned-jsr-audit.md`
   - `research/qwen-prisma-risk-review.md`
   - `research/claude-opus-architecture-review.md`

Treat run-root `research.md` as the correction ledger. Independent model reports are adversarial
evidence, not factual authority. In particular:

- The generated engine workspace has 42 `db:*` keys per workspace at the evaluated baseline, not 30.
- `@prisma/orm-postgres` has 138 audited top-level export keys, not approximately 275.
- The current-state report's “more than twenty” task statement was accurate.
- The live `DatabaseGraph` recommendation was rejected in favor of a durable plain
  `DatabaseManifest`.
- Broad contract-derived validation claims were narrowed by the pinned source audit.
- Provider re-export proposals were rejected.
- Plugin contract spaces do not independently solve removal semantics.

The TypeScript/validation acceptance sentence must appear explicitly in the RFC, in equivalent or
stronger language:

> Accept the native integration only if it preserves Prisma's exact contract inference without
> private imports, copied overloads, casts, or declaration widening, and accept contract-derived
> validation only where the canonical contract plus contributed codec, operation, and selection
> metadata can produce sound fail-closed Standard Schema validators; otherwise narrow or kill the
> affected layer rather than pretending parity.

## Evidence discipline

Keep these evidence classes visibly distinct:

- Current NetScript source fact.
- Prisma RC1 source fact.
- Post-RC Prisma source fact.
- Official primary-source fact.
- Owner/maintainer exchange as exploratory direction, not an upstream commitment.
- Architectural inference.
- NetScript proposal.
- Conditional or unproven implementation capability.

Pin Prisma RC1 claims to `v8.0.0-rc.1@a76a6c5`. Label post-RC observations against the audited
post-RC object `71e2e0d9ee1f306b5a11435cd1973023cb33866a`. Never present post-RC code as RC1
behavior or RC1 behavior as a GA guarantee.

Source-link every material external, upstream, market, maturity, release, issue, and PR claim to
primary sources. Local research reports are a claim index, not substitutes for upstream citations.
Explicitly label unknowns and implementation-time decisions. Do not turn an attractive inference
into a supported capability.

## Template and front matter

Follow `rfcs/0000-template.md` completely. Preserve every required top-level section:

- Summary
- Motivation
- Guide-level explanation
- Reference-level explanation
- Drawbacks
- Rationale and alternatives
- Breaking changes and migration
- Prior art
- Unresolved questions
- Future possibilities

Use valid draft front matter consistent with repository conventions:

- `rfc: 0000`
- `status: Draft`
- `authors: ['@rickylabs']`
- `created: 2026-08-13`
- A precise architecture title
- Issue #313 as historical/tracking context if consistent with `rfcs/README.md`
- `Backlog / Triage` if no milestone is yet committed

Do not omit template sections because equivalent material appears elsewhere. Add structured
subsections and appendices under them.

## Eight-slice trace

Map the complete RFC to all eight planned slices:

- Slices 0–2: provenance, research, plan lock, and the passing final Plan-Gate; summarize, do not
  rewrite.
- Slice 3: vocabulary, package graph, public APIs, TypeScript/E2E types, validation, operations,
  spaces, targets, state machines, and refusal boundaries.
- Slice 4: adoption, clean cutover, data safety, waves, conformance, CI/JSR/release gates, market
  implications, risk register, and kill/switch criteria.
- Slice 5: leave an explicit review/disposition surface for Qwen 3.8 Max and Grok 4.6 high.
- Slice 6: implementation-grade completeness review may occur later inside the fixed post-draft
  review sequence, but it is not another PLAN-EVAL and must not restart planning.
- Slice 7: reserve the one final substantive refinement for Fable 5 high.

Include a decision-trace appendix mapping every D-01–D-47 decision to its definitive RFC section.
Nothing may be silently dropped or weakened.

Group the decisions coherently:

- D-01–D-05: clean break, data continuity, artifact separation, no query/repository abstraction.
- D-06–D-08 and D-36: native TypeScript contract authoring, Candidate A, inference preservation,
  app-local binding.
- D-09–D-16: exact packages, provider boundary, target identity, explicit selection, replicas,
  static capabilities.
- D-17–D-20 and D-38–D-40: contract spaces, ownership, extension bundles, pinned artifacts, plugin
  lifecycle.
- D-21–D-25: bounded Standard Schema interpretation.
- D-26–D-33: pure operations, catalog projections, preview/plan separation, control ownership,
  saga/receipts, artifact generation, agent surface.
- D-34–D-35: no legacy provider parity and signed production plans.
- D-37: namespace capability withheld pending sound type/runtime parity.
- D-41–D-42: W3/provider implementation-time pin, import, and lock choices.
- D-43–D-47: explicitly deferred optional capabilities.

## Central design narrative

The RFC should tell one continuous story:

```text
native authored TypeScript contracts + NetScript definitions/contributions
  → pure two-phase composition
  → canonical ContractArtifacts
  → deterministic DatabaseManifest
  → generated app-local AppBinding
  → runtime sessions + bounded validators
  → inspected baseline
  → bound ExecutablePlan
  → provider apply/ledger
  → immutable OperationReceipts
  → verify/recovery
```

Do not conflate source definition, resolved manifest, speculative preview, executable plan, provider
ledger, or receipt.

## Native Prisma TypeScript authoring and NetScript extension layer

This is a primary RFC axis, not a small implementation detail.

Use the current model-first native Prisma form:

```ts
defineContract(scaffold, (helpers) => ({
  models: {/* native Prisma definitions */},
  types: {/* native Prisma definitions */},
  enums: {/* native Prisma definitions */},
}));
```

The owner's screenshot showed a real historical target/table/column fluent API, but Prisma removed
it. Do not recreate it. Do not invent a NetScript schema DSL. Do not vendor or re-export Prisma as
though NetScript owns it.

Candidate A is mandatory as the baseline:

```ts
const contract = defineContract(scaffold, (p) => /* native value */);

export default defineDatabase({
  targets: { main: /* explicit target */ },
  spaces: {
    app: defineDatabaseSpace({
      ownership: "app",
      contract,
      // owner/version/dependencies/policy
    }),
  },
});
```

Define exact public signatures and inference behavior for:

- `defineDatabase`
- `defineDatabaseTarget`
- `defineDatabaseSpace`
- `defineDatabaseExtension`
- App-owned native fragments
- Plugin-owned full spaces
- Two-phase extension collection
- Const-preserving generated composition roots
- `DatabaseDefinition`
- `NativeContract`
- `SpaceContribution`
- `DatabaseExtension`
- `AppBinding`
- `TargetRef`
- `TargetSession`

Show the oRPC precedent precisely: preserve the native upstream authoring and inferred value, then
add NetScript policy, lifecycle, ownership, artifact, and orchestration around it. Do not transfer
oRPC-specific slow-type exceptions, global builder ownership, transport concepts, or re-export
patterns.

An optional factory survives only if it forwards exact public Prisma helpers without copied
overloads, private imports, declaration widening, or cast workarounds. State the kill criterion
directly.

Show end-to-end type propagation from native contract to generated application-local binding,
query/session use, Standard Schema consumers, route/procedure/form boundaries, and serialization.
Published kernel packages must remain declaration-safe and provider-neutral; application-specific
inferred Prisma types remain app-local.

## Runtime Standard Schema interpretation

This is the other primary axis.

Define the public API and internal boundary for runtime contract-derived Standard Schema values.
Include examples for:

- Whole-model runtime values.
- JSON/serialized model values.
- Mutation inputs only when exact operation metadata is explicitly contributed.
- Selection/results only when aliases, codecs, nullability, and representation are fully known.
- Two independent Standard Schema consumers.

The only public representations are:

- `runtime`
- `json`

Driver-wire representation remains adapter-internal.

Specify the supported `ValidationIR` algebra: registered scalar codecs, nullability, lists,
dictionaries, value objects, resolvable unions, enums/value sets/native enums, integrity-checked
cross-space relations, whole-model presence policy, and fully known direct-column projections.

Specify construction-time `DB_VALIDATION_UNSUPPORTED` refusal for missing or ambiguous codecs,
packs, variants, cross-space metadata, Prisma operation grammar, raw/computed/subquery/aggregate/
include results, opaque checks, database-state constraints, incompatible async predicates, and
unknown result shapes.

Invalid values return Standard Schema issues; unsupported schemas fail during schema construction.
Custom codecs must contribute representation-specific value schemas—encode/decode functions are not
validation.

Define cache identity using the full canonical contract digest, schema version, space,
target/family, operation or normalized selection, representation, interpreter ABI, codec/pack
identity and version, and execution identity where defaults matter.

Do not claim full Prisma create/update/filter/nested-write/result parity from the contract. AOT is
optional and may ship only with corpus equivalence to runtime interpretation.

## Exact package and ownership graph

Specify the exact graph and one archetype per unit:

- `@netscript/database-contract` — A1
- `@netscript/database` — A4
- `@netscript/database-runtime` — A3
- `@netscript/database-control` — A2
- `@netscript/database-prisma-postgres` — A2
- `@netscript/database-testkit` — A6, conditional on a justified binary
- Existing `@netscript/plugin` — A4
- First-party plugins — A5
- Existing Aspire integration — A2
- Existing CLI — A6

For every package, document:

- Owned responsibilities.
- Forbidden responsibilities.
- Dependencies and import law.
- Public versus adapter-local types.
- Runtime permissions.
- JSR/publication status.
- Archetype gates.
- Kill or split criteria.

No framework package re-exports Prisma. Only the PostgreSQL adapter owns Prisma runtime/control
imports. Controlled app/plugin build inputs may directly import Prisma's public authoring builder.
Production apply and runtime consume canonical verified artifacts, not arbitrary schema TypeScript.

## Public contracts and artifacts

Provide complete TypeScript examples and field-level contract tables for:

- Stable IDs: target, role, namespace, space, object, contract snapshot, manifest, plan, run,
  receipt.
- `DatabaseDefinition`
- `NativeContract`
- `SpaceContribution`
- `ContractArtifact`
- `DatabaseManifest`
- `AppBinding`
- `TargetRef` and `TargetSession`
- `SpeculativePreview`
- `ExecutablePlan`
- `ProviderMarker`
- `ProviderLedger`
- `OperationReceipt`
- `OperationCatalog`
- Public diagnostics and results
- Internal-only `ValidationIR`

For every durable artifact, state producer, consumer, authority, version, identity, digest inputs,
canonical encoding, persistence, atomicity, provenance, redaction, and stale/mismatch behavior.

Define the ports with cohesive three/four-method shapes:

- `ContractArtifactSource` and atomic publisher
- `ProviderRuntimeFactory`
- `ProviderControl`
- `ConnectionSource`
- `MigrationLock`
- `ReceiptSink`
- Clock/ID/signature policy where justified

Provider registries are immutable composition-root data, not global registries.

## Formal behavior

Include formal state-transition tables or Mermaid diagrams for:

- Pure definition composition and manifest resolution.
- Runtime process/request session lifecycle.
- Inspection, preview, plan, policy, approval/signature, readiness, expiry/staleness/revocation.
- Lock, revalidation, apply, checkpoint, verification, cancellation, and recovery.
- `outcome_unknown` inspect-before-resume.
- Dependency-ordered multi-target saga and partial success.
- Plugin install, upgrade, version skew refusal, detach, retain, conditional archive/drop.
- Extension-bundle identity/version verification.

Define legal transitions, forbidden transitions, persistent evidence, retry/idempotency rules,
cancellation semantics, and structured diagnostics. Preview must never be applicable. Cross-target
atomicity must never be implied.

## Targets, providers, spaces, ownership

Cover:

- Multiple PostgreSQL targets of the same provider.
- Explicit target selection and dependency closure.
- Roles and writer/read replicas; replicas never migrate.
- Namespaces as a kernel identity axis, while Prisma multi-namespace certification remains withheld
  until no-cast type/runtime parity passes.
- App space plus independently versioned plugin spaces.
- `managed`, `adopted`, `external`, and `ignored` ownership.
- One managed owner per `ObjectKey`.
- Owner-granted augmentation only.
- Pinned mirrors that allow apply/verify without installed plugin code.
- Detach-and-retain as the only guaranteed v1 removal.
- Explicit unsupported/refusal behavior for Prisma SQLite, MongoDB, MySQL, SQL Server, cross-target
  relations, and cross-target transactions.

Do not turn the provider-neutral kernel into false portable query semantics. Native provider query
surfaces remain app-local.

## Programmatic control, CLI, agents, and CI

Define a typed `OperationCatalog` as the source for classify/compose/emit/preview/plan/apply/verify/
inspect/resume operations. CLI commands, help, documentation, and agent instructions are generated
projections.

Show programmatic and CLI journeys with machine results, human rendering, diagnostics, exit
semantics, and next actions. Every example should be executable or explicitly pseudocode pending a
W3 import pin.

Separate:

- `pure`
- `live-read`
- `mutating`
- `resident`

Pure operations must not resolve connections, Aspire, Docker, secrets, or network access.

Explain how the architecture shortens and stabilizes CI through pure compilation, canonical digests,
atomic artifacts, bounded real-service stages, reusable structured receipts, and removal of
hand-patching/repair workflows. Do not promise unmeasured CI reductions; define measurements and
release thresholds.

## Migration, clean break, and data safety

No backwards compatibility is allowed.

`netscript db adopt` is a temporary migration codemod/tool, not a compatibility layer. Specify the
complete adoption protocol:

1. Read legacy config/layout.
2. Generate explicit target identities.
3. Introspect reachable databases.
4. Propose object ownership.
5. Hard-stop on unattributed or conflicting objects.
6. Compile and atomically emit canonical artifacts.
7. Establish one baseline/root per space.
8. Write provider marker metadata only, with zero table/data DDL/DML.
9. Verify live state and zero drift.
10. Delete legacy engine workspaces, the 42 per-workspace generated `db:*` task keys, copied plugin
    fragments, repair scripts, adapters, and dependencies only after verified adoption.

Separate-branch/release-line coexistence is allowed during development, but a single application may
never compose old and new stacks. Before the first new apply, rollback is repository-only plus safe
marker cleanup. After apply, recovery is forward through lineage, provider ledger, and receipts.

Include rehearsal, backup, ownership, destructive-consent, partial-outcome, crash, marker, secret,
lock, and release-window safety gates.

## Market and rationale

Use the market reports to compare NetScript against:

- Wasp
- RedwoodJS
- Payload
- Better Auth
- AdonisJS Lucid
- Drizzle/Drizzle Kit
- MikroORM
- Kysely
- Flyway
- Liquibase
- Terraform
- Pulumi
- Atlas
- Bytebase
- ZenStack v3
- Django
- Rails Active Record

Do not produce a feature-list dump. Derive the architectural lessons:

- One resolved manifest.
- Contributor-owned migration spaces.
- Native authoring with framework policy around it.
- Apply-bound plans.
- Managed versus external ownership.
- Capability-specific behavior instead of false portability.
- Programmatic core with CLI/agent projections.
- Separate source, manifest, plan, ledger, and receipt.

State clearly what a local meta-framework must not rebuild: hosted RBAC, organization/fleet
management, remote registry, policy SaaS, approval service, or continuous-drift control plane.

Explain alternatives rejected: Prisma 7 compatibility, one-to-one migration, a proprietary schema
DSL, recreating the deleted fluent builder, live graph/service locator, global mutable provider
registry, provider re-export, portable query client, generated validator parity claims, plugin
fragment copying, CLI as business logic, and hosted-control-plane creep.

## Implementation and release plan

Carry W0–W11 into the RFC with dependencies and exit evidence:

- W0 RFC/doctrine preparation
- W1 contract kernel
- W2 pure definition/compiler
- W3 experimental Prisma PostgreSQL spike
- W4 A3 runtime
- W5 A2 control
- W6 conformance testkit
- W7 plugin seam
- W8 CLI/agent/adoption
- W9 first-party spaces
- W10 clean cutover
- W11 second provider only with real demand and maturity

Include the exhaustive conformance matrix:

- Archetype F-1…F-19 requirements.
- A3 lifecycle/leak/cancellation/scope gates.
- Real PostgreSQL, Deno, provider import allowlist, and exact single Prisma component set.
- Literal-type preservation and no-cast/private-import checks.
- Namespace type/runtime parity.
- Standard Schema runtime/JSON corpus and two consumers.
- Extension facet identity.
- Target/space/namespace isolation.
- Failure injection, lock, crash, unknown-outcome, and resume.
- Ownership/removal.
- Deterministic/atomic artifact production.
- Generated example/catalog freshness.
- Generated-project and `scaffold.runtime` journeys.
- Windows/Linux and release-class adoption rehearsal.

Reflect the prospective JSR result honestly: `PASS-AS-PLANNED / NOT ACTUAL PUBLISH READINESS`. The
packages do not exist, so dry-run, doc lint, packed install, canary, and remote consumer results are
currently N/A.

Specify implementation-time:

- Explicit export maps and include lists.
- Stable JSDoc/module docs/examples.
- Isolated declarations.
- No slow-types waiver.
- `deno doc --lint`.
- `deno publish --dry-run`.
- Publish-list inspection.
- Packed clean consumer.
- `quality:scan` and `arch:check`.
- Generated asset freshness.
- OIDC/SLSA canary and exact-version remote E2E at W10.

## Risks, kill criteria, and unknowns

Carry the complete risk register and mitigation/kill response into the RFC. Explicitly distinguish:

- Locked semantics.
- W1/W3/W4/W5/W7/W10 implementation decisions.
- Conditional upstream blockers.
- Safe deferred capabilities.

No must-resolve-now architecture question may be reintroduced casually. If source inspection reveals
a genuine contradiction, report it to the root, narrow the capability, and continue unless it
invalidates the package boundary.

Never silently widen support. In particular, do not claim:

- Prisma 8 GA stability from RC1.
- Non-PostgreSQL certification.
- Multi-namespace soundness.
- Full operation/result validation from contract data.
- Archive/drop safety.
- Cross-database relations or transactions.
- Runtime capability negotiation.
- AOT validation.
- Hosted control-plane behavior.
- Actual JSR publish readiness.

Include decisive subsystem and provider kill/switch criteria. Preserve the provider-neutral kernel
if the Prisma adapter fails; narrow validation rather than recreating Prisma's type system; withhold
unsupported capabilities instead of casting around them.

## Expected depth

This must be a substantial architectural RFC, not a polished summary of the plan. Expect roughly
18,000–30,000 coherent words, or comparable implementation-grade depth. Word count is not a quota:
prefer one consistent model, precise tables, complete examples, explicit invariants, and
traceability over repetition. It should be materially deeper than a typical 5–10 page proposal while
remaining readable from guide-level DX through reference-level mechanics.

Avoid copying the synthesis section-by-section. Re-author it as one narrative, eliminate
duplication, and use appendices for decision/source/conformance trace tables.

## Fixed post-draft process

After the complete draft, the sequence is exactly:

1. Root performs a personal substantive source/doctrine/API review.
2. Qwen 3.8 Max performs the focused review across TypeScript inference, Standard Schema,
   control/recovery, migration safety, package/JSR surfaces, and market claims.
3. Grok 4.6 high performs the whole-RFC adversarial review.
4. The author/editor explicitly dispositions findings and revises the RFC.
5. One Fable 5 high session performs the absolute final substantive review and refinement.

There is no generic additional focused-review party and there are no more PLAN-EVAL loops. Nothing
substantive follows the final Fable 5 high refinement; only mechanical checks and publication
actions may follow.

## Final checks for this authoring session

Before handing back the draft:

- Verify every template heading and valid front matter.
- Produce a D-01–D-47 section trace.
- Produce a requirement/source/claim trace for load-bearing facts.
- Search for contradictions between RC1, post-RC, and proposals.
- Search for accidental compatibility, Prisma 7 fallback, provider re-export, full-validation,
  namespace, non-PostgreSQL, or hosted-control-plane overclaims.
- Check local links and referenced paths.
- Check for placeholders, invented import paths, unsupported capability claims, and stale
  30-task/~275-export claims.
- Run `deno fmt --check rfcs/0000-database-architecture.md`.
- Run `git diff --check`.
- Report the RFC size/line count, coverage, explicit unknowns, and check results.

Do not commit or push.
