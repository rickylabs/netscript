# Plan: NetScript Database Architecture and Prisma 8

## Run Metadata

| Field          | Value                                                                 |
| -------------- | --------------------------------------------------------------------- |
| Run ID         | `docs-database-architecture-rfc--prisma-8-rfc`                        |
| Branch         | `docs/database-architecture-rfc`                                      |
| Phase          | `research`                                                            |
| Target         | `rfcs/0000-database-architecture.md` plus harness provenance          |
| Archetype      | Docs-only RFC describing future Archetypes 1, 2, 4, 5, and 6 surfaces |
| Scope overlays | `SCOPE-docs.md`                                                       |

## Archetype

The committed change is a documentation/RFC changeset, so `SCOPE-docs.md` governs its immediate
gates. The architecture it specifies spans separate future package boundaries: a small contract/IR
(A1), external database integration ports/adapters (A2), a user-facing definition DSL (A4), database
contribution packages (A5 where first-party plugins are used), and CLI/scaffold automation (A6).
Research must assign one smallest fitting archetype to each proposed package rather than forcing the
whole database system into one package shape.

## Current Doctrine Verdict

Pending the current database-package verdict and relevant debt-ledger scan.

## Axioms in Play

| Axiom | Why it matters                                                                            |
| ----- | ----------------------------------------------------------------------------------------- |
| A1    | The RFC must lock the public contracts before implementation topology.                    |
| A2    | NetScript's durable boundary must remain simpler than Prisma internals.                   |
| A3    | The common database path must become one deterministic command/composition flow.          |
| A5    | Provider, engine, migration, schema, validation, and observability axes must compose.     |
| A7    | NetScript should wrap upstream capabilities and standards rather than rebuild an ORM.     |
| A9    | Each proposed package needs an explicit doctrine archetype.                               |
| A10   | The app's generated composition root, not a service locator, wires database capabilities. |
| A11   | Extension axes must be named before the RFC introduces abstractions.                      |
| A14   | Contract tests and CI must preserve the architecture and eliminate manual drift.          |

## Goal

Produce a state-of-the-art, implementation-grade RFC for a clean-break NetScript database
architecture built for Prisma 8, while remaining deliberately capable of multiple schemas,
databases, engines, providers, deployment runtimes, and third-party contributions.

## Scope

- Deep current-state and historical NetScript audit.
- Deep Prisma 8/Next and source/issue/PR audit.
- Competitor/prior-art analysis.
- Complete user-facing and contributor-facing architecture.
- Explicit breaking migration and parallel-branch rollout strategy.
- Implementation waves, contracts, test strategy, CI design, risk analysis, and acceptance gates.

## Non-Scope

- Production implementation of the accepted architecture in this RFC PR.
- Backward-compatible shims, aliases, dual clients, or preservation of obsolete generated assets.
- Premature selection of unverified Prisma 8 internals as stable NetScript public API.

## Hidden Scope

- Generator determinism and cacheability, plugin discovery, configuration provenance, secrets,
  migration concurrency, destructive-change policy, transaction semantics, serverless/edge/runtime
  constraints, telemetry, test databases, CI topology, version skew, supply-chain boundaries,
  docs/scaffold synchronization, and AI-agent discoverability.

## Locked Decisions

| ID | Decision                                                                                                    | Rationale                                                                           |
| -- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| L0 | This RFC is a clean-break redesign; compatibility is not a design constraint.                               | Explicit owner directive; avoids encoding old foundation limits into the new layer. |
| L1 | Prisma is an implementation target behind NetScript-owned concepts, not the NetScript DB public API itself. | Preserves flexibility without pretending all database semantics are portable.       |
| L2 | PLAN-EVAL is mandatory before authoring the canonical RFC.                                                  | The run is architecture-heavy, high-risk, and multi-wave.                           |
| L3 | Fable 5 high is the last substantive gate and may refine the document in place.                             | Explicit owner exception.                                                           |

## Open-Decision Sweep

All architecture decisions remain `must resolve now` until research closes them. The completed plan
will enumerate each one individually before PLAN-EVAL.

## Risk Register

| Risk                                                              | Mitigation                                                                                                                         |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Designing against RC marketing rather than implementation reality | Verify official docs against source, tests, release diffs, and live issues/PRs.                                                    |
| Replacing manual glue with a larger proprietary abstraction       | Keep NetScript IR/ports minimal, capability-oriented, and conformance-tested.                                                      |
| False portability across engines                                  | Model capabilities and explicit escape hatches; never normalize away real provider semantics.                                      |
| RFC too broad to implement                                        | Define strict package boundaries, dependency graph, staged waves, and per-wave acceptance gates.                                   |
| No-compat break becomes an unsafe migration                       | Supply a mechanical migration tool/doc, preflight report, data-preserving sequence, and rollback boundaries without runtime shims. |

## Anti-Patterns to Resolve or Avoid

Pending current-state and doctrine audit.

## Fitness Gates

Pending archetype assignment and Plan-Gate completion.

## Arch-Debt Implications

Pending targeted scan of `.llm/harness/debt/arch-debt.md`.

## Validation Plan

| Order | Gate                            | Command or check                                                           | Expected result                                         |
| ----- | ------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------- |
| 1     | Research provenance             | Source/link inventory and claim ledger                                     | Every load-bearing claim is traceable and current.      |
| 2     | PLAN-EVAL                       | Fresh Fable 5 medium opposite-family session                               | `PASS` before RFC authoring.                            |
| 3     | RFC source alignment            | Local paths, `deno doc`, focused code inspection, upstream primary sources | No unsupported present-state or proposed-surface claim. |
| 4     | Docs gates                      | Formatting, local links/paths, terminology, contradiction scan             | PASS.                                                   |
| 5     | Independent architecture review | Qwen 3.8 Max                                                               | No unresolved critical/high finding.                    |
| 6     | IMPL-EVAL                       | Fresh opposite-family evaluator                                            | `PASS`.                                                 |
| 7     | Final refinement                | Fable 5 high                                                               | Final in-place refinement; no substantive gate follows. |

## Dependencies

- Current NetScript `main`, issue/PR history, doctrine, and RFC process.
- Official Prisma release/docs/source/issues/PRs and supported database/runtime matrix.
- Existing native Claude/Fable agentic route and phase-bound Qwen evaluator route.

## Drift Watch

- Prisma 8 RC releases or API changes during the run.
- New NetScript database changes merged to `main`.
- Any model route that reports a different identity or cannot attach observably.
- Any architecture decision that would implicitly recreate backward compatibility.
