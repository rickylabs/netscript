# Plan: declared plugin linking through one shared seam

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-plugin-linking-seam-1189--1189` |
| Branch | `fix/plugin-linking-seam-1189` |
| Phase | `plan` |
| Target | `@netscript/plugin` protocol + CLI reconciliation/runtime fixtures |
| Archetype | `5 - Plugin` composed with `6 - CLI/tooling` |
| Base | `canary/0.0.5-canary.13` |

## Archetype and Doctrine Verdict

The public declaration belongs to the thin plugin protocol; the CLI is the host adapter that
interprets it. A plugin declares data, while one core seam owns discovery and idempotent wiring.
No plugin identity or naming convention enters core control flow.

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| A2 | Public types must truthfully express every supported linking edge. |
| A6 | Third-party consumers prove the extension seam, not first-party shortcuts. |
| A7 | Filesystem mutation stays behind the existing filesystem port. |
| A11 | Runtime/AppHost behavior remains at the adapter edge. |

## Goal

A third-party plugin declares explicit producer and service/app consumer identifiers in its own
manifest; install, later consumer creation, and uninstall converge appsettings through the same
generic reconciler, and a real service-to-plugin call is visible in Aspire telemetry.

## Scope

- Add optional `linking` schema/types to `@netscript/plugin`.
- Discover installed declarations without official status or suffix inference.
- Reconcile plugins, background processors, services, and apps uniformly.
- Preserve install/remove/service lifecycle convergence and helper regeneration.
- Add a fixture third-party plugin and RED-first end-to-end contract/runtime coverage.
- Capture real scaffold, cross-resource call, and OTEL artefacts.

## Non-Scope

- No official-plugin-only proof as acceptance evidence.
- No wildcard/all-services vocabulary; consumers are explicit identifiers.
- No plugin marketplace trust redesign or #1093 discovery implementation.
- No release publication while #1312 blocks publishing.

## Hidden Scope

- Install-order symmetry requires both plugin-first and consumer-first fixtures.
- Uninstall must remove producer references from every surface even after its manifest directory is removed.
- Existing official manifests remain compatible and may migrate incrementally.
- AppHost helpers must be regenerated from the reconciled artifact before runtime proof.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| D1 | Add top-level optional `linking` independent of `officialSource`. | Third-party eligibility cannot depend on first-party source metadata. |
| D2 | `linking` declares canonical identity, producer resource/background keys, and named `services`/`apps` consumers. | Replaces suffix and directory inference with explicit finite identifiers. |
| D3 | One reconciler applies a producer reference through a common entry mutation to all declared surfaces. | Satisfies the shared-seam constraint without per-plugin branches. |
| D4 | Discover manifests by scanning supported plugin config roots for `scaffold.plugin.json`. | Installed keys cannot locate arbitrary third-party config directories without guessing. |
| D5 | Missing producers/consumers are ignored until present, then later lifecycle reconciliation retro-wires them. | Makes install order commutative and idempotent. |
| D6 | No local PLAN-EVAL. | Milestone ruling composes draft→ready augmentation with orchestrator pre-merge evaluation. |
| D7 | The decisive fixture has an arbitrary third-party name and identifiers unrelated to official conventions. | An official plugin cannot prove the seam is generic. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Wildcard consumers | safe to defer | Explicit identifiers meet the issue and avoid hidden global coupling. |
| Schema-version bump | resolved | Optional backward-compatible field remains schema v1. |
| #1093 fixture reuse | resolved unavailable | #1093 is open and no fixture exists on the train base; record as drift, use one #1189 fixture. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Manifest scan captures unrelated files. | Validate full manifest schema and require valid `linking`; scan only root/plugin config directories. |
| Removal loses declaration before cleanup. | Reconcile desired references against installed producer keys so stale references are pruned generically. |
| Existing official wiring regresses. | Retain compatibility translation and existing tests while adding explicit-linking fixtures. |
| Runtime proof passes on config alone. | Require correlated service→plugin trace/span plus response artefact. |
| Shared host resources collide. | Leak-check first, one AppHost, explicit owned root, scoped teardown. |
| Lock resolution churn. | Preserve inherited queue row only; stage explicit paths. |

## Anti-Patterns

| Pattern | Plan |
| ------- | ---- |
| Host-side plugin-name branch | Prohibited; quality scan plus arbitrary fixture. |
| Naming convention in core | Delete `endsWith('-api')`; identifiers come from manifest. |
| Fat plugin logic | Fixture declares data and implements its endpoint only; core owns reconciliation. |
| Unit-only proof | Require real scaffold and OTEL-correlated boundary call. |

## Fitness and Validation Gates

| Order | Gate | Evidence |
| ----- | ---- | -------- |
| 1 | RED manifest/reconciler fixture | Third-party declaration rejected and surfaces unwired on baseline. |
| 2 | Protocol tests | Optional linking parses; invalid identifiers fail; old manifests pass. |
| 3 | Reconciler/install/remove tests | Both orders converge; apps/services wire; uninstall prunes; suffix heuristic absence asserted. |
| 4 | Scoped wrappers | check/lint/fmt for plugin and CLI touched roots. |
| 5 | Framework quality | `quality:gate`, no new ignores/casts/plugin-name branches. |
| 6 | JSR audit | plugin doc lint + publish dry-run and CLI consumer check. |
| 7 | Real third-party scaffold | one-command install, zero hand edits, runtime call and OTEL trace/span/log artefacts. |
| 8 | Full runtime | one-pass `scaffold.runtime --cleanup --format pretty`, serialized at merge readiness. |

## Commit Slices

| # | Slice | Proof | Expected files |
| - | ----- | ----- | -------------- |
| 1 | Contract and RED fixtures | Parser + reconciler tests fail on current behavior | plugin manifest protocol, fixture/tests, run artifacts |
| 2 | Generic reconciliation | Focused tests pass for four surfaces, both orders, cleanup, no suffix | reconciler + lifecycle tests |
| 3 | Third-party install/runtime proof | Fresh scaffold response + correlated OTEL artefacts | fixture plugin, E2E gate/evidence, run artifacts |
| 4 | Quality and D6 handoff | required gates, acceptance reconciliation, ready PR | worklog/context/evaluate handoff |

## Debt and Drift Watch

- No new architecture debt is accepted.
- Record the absent carried brief and unavailable #1093 fixture as minor planning drift.
- Any need for plugin-specific logic, manual appsettings edits, or official-only proof is architectural drift and requires rescope.
