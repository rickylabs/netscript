# Worklog: NetScript Database Architecture and Prisma 8 RFC

## Run Metadata

| Field          | Value                                                         |
| -------------- | ------------------------------------------------------------- |
| Run ID         | `docs-database-architecture-rfc--prisma-8-rfc`                |
| Branch         | `docs/database-architecture-rfc`                              |
| Phase          | `plan-eval-ready`                                             |
| Archetype      | Docs-only RFC describing future A1/A2/A3/A4/A5/A6 surfaces    |
| Scope overlays | `SCOPE-docs.md`; future packages use their archetype matrices |

## Design

The Design checkpoint is **locked and ready for PLAN-EVAL cycle 2**. Cycle 1 returned `FAIL_PLAN`
solely because the copied generated-workspace task count was factually wrong; the evaluator executed
the generator for all four providers and found 42 `db:*` keys per workspace. The mutable
research/synthesis/plan records are corrected and ready for resubmission. The architecture remains
evaluator-unapproved, and no canonical RFC file may be created until a fresh separate evaluator
returns `PASS`.

### Public Surface and Package Graph

- Planned RFC record: `rfcs/0000-database-architecture.md`; it does not exist before PLAN-EVAL.
- `@netscript/database-contract` (A1): plain identities, manifest/plan/receipt/diagnostic schemas,
  capabilities, ownership, and shared small SPIs; zero provider dependencies.
- `@netscript/database` (A4): thin `defineDatabase`/target/space/policy definitions and pure
  deterministic manifest compiler.
- `@netscript/database-runtime` (A3): process/request lifecycle, connection ownership,
  health/readiness, cancellation, and validation coordination.
- `@netscript/database-control` (A2): programmatic operation catalog, emit/preview/plan/apply/
  verify/inspect, provider ports, locks, receipts, recovery, and cross-target saga.
- `@netscript/database-prisma-postgres` (A2): experimental/certified provider and sole framework
  Prisma runtime/control boundary; no Prisma re-export.
- `@netscript/database-testkit` (A6): runnable provider/space conformance only if a binary is
  justified; reconsider before W1 otherwise.
- Existing `@netscript/plugin` (A4), first-party plugins (A5), Aspire (A2), and CLI (A6) receive
  thin database contribution, connection-source, and operation-projection changes.

Candidate A is the authoring baseline: applications and controlled plugin build inputs call current
model-first Prisma `defineContract`, then pass the exact native value into thin
`defineDatabase`/`defineDatabaseSpace` functions that preserve inference. NetScript neither
recreates the deleted screenshot fluent DSL nor vendors/re-exports Prisma. App-specific inferred
bindings and const-preserving fragment composition are generated application-locally.

### Domain Vocabulary

- `DatabaseDefinition`: pure authored TypeScript composition.
- `NativeContract`: provider-native schema value.
- `SpaceContribution`: declarative owner/version/capability/dependency/provenance/retention record.
- `ContractArtifact`: canonical provider data/declaration/lineage/provenance, pinned per space.
- `DatabaseManifest`: deterministic versioned resolved value and durable join point; a graph is
  private compiler IR only.
- `AppBinding`: generated app-local inferred target/session/validation bridge.
- `TargetRef`/`TargetSession`: explicit identity and lifecycle shell with app-local query generic.
- `SpeculativePreview` versus baseline-bound `ExecutablePlan`.
- Provider-owned `ProviderMarker`/`ProviderLedger` versus immutable NetScript `OperationReceipt`.
- `OperationCatalog`: machine source for CLI/help/docs/agents.
- `ValidationIR`: bounded internal value/selection algebra, never a second ORM type system.

Stable identities are target, role, namespace, space, object, contract snapshot, manifest, plan,
run, and receipt IDs. Provider/engine/path/order/discovery strings never substitute for identity.

### Ports

- `ContractArtifactSource` and atomic artifact publisher.
- `ProviderRuntimeFactory` for process/request sessions.
- `ProviderControl` for provider-native emit/inspect/plan/apply/verify translation.
- `ConnectionSource` for environment, Aspire, or secret-reference resolution.
- Provider `MigrationLock` capability with owner/nonce/fencing evidence.
- `ReceiptSink` for atomic immutable checkpoints.
- Clock/ID/signature policy only where deterministic tests or production approval need seams.

Ports stay cohesive at three or four methods. Provider registries are immutable composition-root
values, not globals. Concrete Prisma contracts/control/runtime/codec/AST types remain adapter-local.
Application domain ports remain application practice, not a generated NetScript repository system.

### Constants and State Machines

- Ownership: `managed`, `adopted`, `external`, `ignored`.
- Runtime scope: `process`, `request`.
- Validation representation: `runtime`, `json`; driver wire is internal.
- Operation class: `pure`, `live-read`, `mutating`, `resident`.
- Receipt outcomes include success, refusal, skip, failure, partial success, cleanup required,
  cancellation, and outcome unknown.
- Removal guarantee: detach-and-retain; archive/drop are conditional.
- Capability IDs are open namespaced static data, not a negotiation protocol.

Composition, planning/approval, apply/checkpoint/verify/recovery, contribution lifecycle, and
multi-target saga transitions are specified in `plan.md`. Preview cannot be applied; every unknown
outcome is inspected before resume; cross-target atomicity is never claimed.

### Commit Slices

| # | Slice                                                                     | Gate                                                     | Files                                                             |
| - | ------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------- |
| 0 | Harness bootstrap/review surface.                                         | Artifact/format/diff; landed.                            | Run root.                                                         |
| 1 | Research corpus, rebaseline index, planned JSR audit, and Plan-Gate lock. | PLAN-EVAL input completeness, source/claim, format/diff. | `research.md`, `research/*.md`, planning/context/drift artifacts. |
| 2 | Independent Plan-Gate verdict.                                            | Fresh separate-session `PASS`.                           | `plan-eval.md`, planning artifacts only.                          |
| 3 | Canonical architecture/API RFC body.                                      | Source alignment, docs, decision coverage.               | RFC plus run context/worklog.                                     |
| 4 | Cutover/waves/conformance/risks/market completion.                        | Migration safety, claim trace, docs gates.               | RFC plus run context/worklog.                                     |
| 5 | Qwen/Grok adversarial findings resolved.                                  | No open critical/high; Grok 4.6 route receipt.           | RFC plus review/run artifacts.                                    |
| 6 | Separate-session IMPL-EVAL.                                               | Evaluator `PASS`.                                        | `evaluate.md`, RFC/run artifacts.                                 |
| 7 | Absolute final Fable 5 high refinement and publish handoff.               | Fable substantive gate, then mechanical checks only.     | RFC/final run/handoff artifacts.                                  |

### Prospective JSR Verdict

`research/planned-jsr-audit.md` returns **PASS-AS-PLANNED / NOT ACTUAL PUBLISH READINESS**. The six
new packages do not exist, so actual `deno publish --dry-run`, `deno doc --lint`, publish-list,
packed-install, canary, and remote-consumer results are **N/A**, not PASS.

Implementation requires per unit: explicit manifest/export/include surface, docs/JSDoc/examples,
isolated declarations, no slow-types waiver, scoped check/lint/fmt, `quality:scan`, `arch:check`,
`deno doc --lint`, `deno publish --dry-run`, publish-list inspection, generated-asset freshness,
public import and packed-consumer tests. W10 adds authenticated OIDC/SLSA canary, registry
reconciliation, and `e2e-cli-prod` against exact JSR versions.

### Open Decisions and Deferred Scope

- Must resolve now: **none**.
- Pre-implementation by wave: manifest encoding/versioning; exact Prisma pin/import allowlist;
  namespace capability verdict; lifecycle/transaction types; signature/key custody; provider lock;
  receipt retention/fault harness; augmentation grants; cutover window/runbook.
- Safe to defer: second provider, Prisma non-PostgreSQL targets, runtime negotiation, AOT, archive/
  drop, raw/prepared/aggregate conveniences, hosted control plane, cross-database relation/
  transaction support.
- All production packages, doctrine mutations, publication, provider certification, plugin
  conversion, legacy deletion, and release operation begin only after RFC acceptance.

### Contributor Path and Implementation Waves

Contributors author native provider contracts, then declare app-owned fragments or plugin-owned full
spaces. A two-phase generated root collects extension bundles/dependencies first, then invokes
native fragments with exact helpers. Plugin tables default to their own space, artifacts, lineage,
and head; production apply/verify consumes the pinned mirror without plugin code.

W0 RFC/doctrine plan → W1 contract → W2 definition/compiler → W3 experimental Prisma PostgreSQL
spike → W4 runtime → W5 control → W6 testkit → W7 plugin seam → W8 CLI/agent/adoption → W9
first-party spaces → W10 clean cutover → W11 second provider only when real/mature. Every wave has
the archetype, source, JSR, consumer, conformance, and release exits recorded in `plan.md`.

## Progress Log

| Time       | Slice | Step      | Notes                                                                                                                                                                                                                                                                                                                                          |
| ---------- | ----- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-13 | 0     | bootstrap | Fresh worktree and branch created from current `origin/main`; run artifacts initialized.                                                                                                                                                                                                                                                       |
| 2026-08-13 | 1     | research  | Owner directed the root to orchestrate. Added a fresh Claude Code Opus 5 high independent architecture lane; its exclusive report feeds plan lock.                                                                                                                                                                                             |
| 2026-08-13 | 1     | research  | Owner supplied a March 2026 Prisma-maintainer exchange supporting contract-derived runtime validation. Elevated Standard Schema input/output validation to a first-class subsystem and recorded runtime/AOT equivalence gates.                                                                                                                 |
| 2026-08-13 | 1     | research  | Owner elevated Prisma Next's proposed pure-TypeScript schema authoring. Added a dedicated source/architecture audit and required schema-to-contract-to-operation-to-validation-to-transport type propagation in the Opus synthesis and Plan-Gate.                                                                                              |
| 2026-08-13 | 1     | research  | Owner clarified the target is Prisma's native `defineContract` builder and named NetScript's oRPC extension model as the precedent. Expanded the audit to compare native-surface preservation, factory augmentation, plugin typing, and app-local composition against database-specific lifecycle/ownership needs.                             |
| 2026-08-13 | 1     | research  | Pinned-source validation audit found a qualified runtime-interpretation path, not full contract-only parity. Locked fail-closed bounded semantics, runtime/JSON representations, contributor value schemas for custom codecs, selection metadata requirements, aggregate-space identity, and a canonical full-contract validator cache digest. |
| 2026-08-13 | 1     | research  | Claude Code Opus 5 high completed its three-part independent architecture synthesis. It recommends a compiled manifest, app-local inferred contract binding, an A3 runtime package, an operational protocol replacing `Promise<number>`, native TypeScript authoring at the composition seam, and a clean Postgres-first cutover.              |
| 2026-08-13 | 1     | synthesis | Delegated a separate Plan-Gate synthesis to reconcile Opus, Qwen, source audits, market evidence, doctrine, and the pending TypeScript/oRPC audit before formal PLAN-EVAL.                                                                                                                                                                     |
| 2026-08-13 | 1     | plan-lock | Completed the source-audited TypeScript/oRPC and prospective JSR audits, current-main `research.md` index, decision-grade architecture synthesis, and formal D-01–D-47 Plan-Gate. No must-resolve-now decision remains; phase advanced to `plan-eval-ready`.                                                                                   |

### PLAN-EVAL Cycle 1

Fresh Fable 5 medium cycle 1 returned `FAIL_PLAN` on one medium factual-integrity defect only: an
independently reported count of 30 generated `db:*` tasks was copied into mutable Plan-Gate records,
while executing the generator produced 42 per engine workspace for every provider. All architecture
decisions, slices, risks, gates, and deferrals otherwise passed.

The three mutable records now use the executed 42-per-workspace result and disposition Qwen F3 as an
incorrect correction while preserving independent reports and evaluator evidence. Targeted format
and full diff checks passed. Cycle 2 resubmission is ready; phase remains `plan-eval-ready` and RFC
authorship remains blocked.

## Decisions

| Decision                                                      | Reason                                                                                                                     | Source                                   |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| #313 is superseded design evidence                            | Its additive/compatibility premise conflicts with the owner-directed clean break.                                          | Owner directive + current rebaseline     |
| Compiled manifest, not live graph                             | A plain deterministic value is the durable join point and avoids service location.                                         | Synthesis D-03/D-04                      |
| Exact A1/A4/A3/A2/A2/A6 package split                         | One archetype per responsibility; runtime lifecycle requires A3 gates.                                                     | Doctrine + synthesis §4                  |
| Native model-first Prisma authoring                           | Preserve the real current builder/inference; never recreate the deleted fluent screenshot API or another DSL.              | TypeScript/oRPC audit + D-06/D-07        |
| App-local inferred binding                                    | Satisfies isolated declarations without expanding the oRPC-only slow-type exception.                                       | Doctrine/JSR audit + D-08                |
| Contract spaces and extension bundles                         | Plugin ownership/history and one authoring/control/runtime/validation registration replace copied fragments/manual facets. | Prisma source + D-17–D-20/D-38–D-40      |
| Bounded Standard Schema interpreter                           | Contract runtime data is useful but omits full operation/result types; runtime/JSON schemas fail closed.                   | Validation source audit + D-21–D-25      |
| Provider-neutral kernel, PostgreSQL-only first adapter        | Matches Prisma maturity without compatibility fallback or false portability.                                               | Prisma scorecard/source + D-10/D-11/D-34 |
| NetScript operational semantics, provider migration mechanics | NetScript owns policy/locks/recovery/receipts/saga while provider owns diff/lineage/marker.                                | Market/source reconciliation + D-27–D-30 |
| PLAN-EVAL before RFC                                          | Architecture has no open must-resolve item but still requires independent acceptance.                                      | Harness Plan-Gate + D-01–D-47            |
| Fable 5 high remains last substantive gate                    | Explicit owner exception; no substantive model review follows it.                                                          | Owner directive                          |

## Drift

| Drift                                                    | Severity      | Logged in drift.md |
| -------------------------------------------------------- | ------------- | ------------------ |
| #313 compatibility-first plan is no longer authoritative | architectural | yes                |
| Fable 5 high is the owner-directed final refinement gate | significant   | yes                |

## Gate Results

### Static Gates

| Gate           | Command or check                                | Result | Notes                                                 |
| -------------- | ----------------------------------------------- | ------ | ----------------------------------------------------- |
| Bootstrap diff | `git diff --check`; targeted `deno fmt --check` | PASS   | Six required run artifacts are present and formatted. |

### Fitness Gates

| Gate                         | Result            | Evidence                        | Notes                                                                                |
| ---------------------------- | ----------------- | ------------------------------- | ------------------------------------------------------------------------------------ |
| Archetype/package assignment | PASS_PLANNED      | `plan.md` package graph         | A1/A2/A3/A4/A5/A6 responsibilities and gates are explicit.                           |
| Open-decision sweep          | PASS_PLANNED      | D-01–D-47                       | No must-resolve-now item; pre-wave/deferred items cannot rewrite package boundaries. |
| Prospective JSR audit        | PASS_AS_PLANNED   | `research/planned-jsr-audit.md` | New-package dry-run/docs/packed/canary gates are N/A until implementation, not PASS. |
| PLAN-EVAL                    | FAIL_PLAN_CYCLE_1 | `plan-eval.md`; correction diff | Sole factual-integrity finding corrected; cycle 2 required before canonical RFC.     |

### Runtime Gates

| Gate             | Result | Evidence            | Notes                                                                                           |
| ---------------- | ------ | ------------------- | ----------------------------------------------------------------------------------------------- |
| Runtime behavior | N/A    | Docs-only Plan-Gate | Future A3/provider/control runtime matrices are selected in `plan.md`; no implementation claim. |

### Consumer Gates

| Consumer               | Result         | Evidence                                                      | Notes                                                                  |
| ---------------------- | -------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| PLAN-EVAL reader       | RESUBMIT_READY | `plan-eval.md`, corrected research/plan, synthesis and audits | Cycle 1's sole factual finding is corrected; cycle 2 remains required. |
| RFC reader/implementer | NOT_RUN        | RFC blocked                                                   | Canonical RFC authorship begins only after PLAN-EVAL PASS.             |

## Handoff Notes

- Planning is complete, not evaluator-approved. PLAN-EVAL cycle 1 returned `FAIL_PLAN` only for the
  corrected generated-task count; the next action is fresh separate-session cycle 2. No
  implementation or canonical RFC authorship verdict is claimed.
- Prospective package publishability is `PASS-AS-PLANNED`; actual JSR commands remain N/A until
  packages exist and must produce implementation/release receipts later.
- After PLAN-EVAL PASS, follow the eight RFC slices and preserve Fable 5 high as the final
  substantive gate.
